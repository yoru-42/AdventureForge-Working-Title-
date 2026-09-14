// ============================================================================
// ADVENTUREFORGE INDIVIDUELLE BERUFSAUFGABEN & PFLICHTEN
// Individuelle Tätigkeiten & Verpflichtungen für alle 16 Berufszweige
// Unterteilt nach Lehrling / Anwärter | Geselle / Fachkraft | Spezialist | Meister
// ============================================================================

export interface JobDutySet {
  lehrling: string[];
  geselle: string[];
  spezialisierung: string[];
  meister: string[];
}

export const DETAILED_PROFESSION_DUTIES: Record<string, JobDutySet> = {
  // ---------------------------------------------------------------------------
  // 1. LEBENSMITTEL & VERSORGUNG
  // ---------------------------------------------------------------------------
  koch: {
    lehrling: [
      'Gemüse und Zutaten nach Anweisung waschen, schälen und schneiden',
      'Kochstellen, Töpfe, Pfannen und Küchenarbeitsplätze reinigen',
      'Grundbrühen, Fonds und einfache Beilagen vorbereiten',
      'Kühllager und Vorratskammern auffüllen und überwachen'
    ],
    geselle: [
      'Selbstständige Zubereitung kompletter Tagesgerichte und Menüs',
      'Braten, Dünsten, Backen und Abschmecken von Fleisch, Fisch und Suppen',
      'Koordination der Zubereitungszeiten für gleichzeitiges Servieren',
      'Tägliche Frischekontrolle und Wareneingangsprüfung der Lebensmittel'
    ],
    spezialisierung: [
      'Kreation anspruchsvoller Spezialgerichte und Festtags-Bankette',
      'Feinabstimmung exotischer Gewürze, Kräuterreduktionen und Delikatessen',
      'Überwachung der Küchenhygiene und fachliche Anleitung der Gehilfen',
      'Zubereitung von Schonkost, höfischen Speisen oder Konservierungsverfahren'
    ],
    meister: [
      'Gesamtleitung der Küche, Speiseplangestaltung und Rezepturentwicklung',
      'Kalkulation von Großveranstaltungen, Banketten und Festmählern',
      'Ausbildung und Prüfung von Küchenlehrlingen und Jungköchen',
      'Verhandlung mit Lieferanten und Sicherung höchster kulinarischer Standards'
    ]
  },
  baecker: {
    lehrling: [
      'Mehlsäcke lagern, sieben und Backstube sauber halten',
      'Backöfen anheizen, Asche leeren und Backbleche fetten',
      'Zutaten für Teige abwiegen und Knettröge vorbereiten',
      'Einfaches Kleingebäck formen und zur Gärung abstellen'
    ],
    geselle: [
      'Herstellung verschiedener Sauerteig-, Hefe- und Brotarten',
      'Überwachung der Teiggärung und präzise Einhaltung der Backzeiten',
      'Formen von Brotlaiben, Zöpfen und festlichen Tafelbroten',
      'Ofenführung und Hitzeregulierung bei unterschiedlichen Backwaren'
    ],
    spezialisierung: [
      'Rezepturen für hochwertige Spezial- und Haltbarkeitsbrote (z.B. Schiffszwieback, Wegbrot)',
      'Feine Krustengebäcke, gefüllte Pastetenböden und Schaugebäcke',
      'Veredelung von Teigen mit Saaten, Trockenfrüchten und Gewürzen',
      'Optimierung von Gärungszeiten unter wechselnden Witterungsbedingungen'
    ],
    meister: [
      'Leitung der Backstube und Organisation der nächtlichen Backschichten',
      'Entwicklung meisterhafter Zunftrezepte und Einhaltung von Zunftvorgaben',
      'Ausbildung des Bäckernachwuchses und Qualitätsabnahme aller Laibe',
      'Einkauf von Qualitätsgetreide und Kalkulation der Mehlpreise'
    ]
  },
  konditor: {
    lehrling: [
      'Reinigung von Rührkesseln, Spritztüllen und Backformen',
      'Eier trennen, Schokolade raspeln und Nüsse mahlen',
      'Herstellung einfacher Teigböden und Biskuitmassen',
      'Vorbereitung von Glasuren und Fruchtspiegeln'
    ],
    geselle: [
      'Zusammensetzen mehrschichtiger Torten, Törtchen und Schnitten',
      'Aufschlagen feiner Cremes, Ganaches, Mousses und Buttercremes',
      'Spritzen dekorativer Ornamente, Schriftzüge und Rosetten',
      'Temperieren von Schokolade und Gießen feiner Hohlkörper'
    ],
    spezialisierung: [
      'Anfertigung von kunstvollen Prunktorten für Hochzeiten und Adelshöfe',
      'Zuckerziehen, Zuckergussplastiken und filigrane Marzipankunst',
      'Kreation erlesener Pralinen mit Likör- und Ganachefüllungen',
      'Haltbarmachung empfindlicher Konfekte und kandierter Früchte'
    ],
    meister: [
      'Entwurf monumentaler Schaustücke und Festtagskonfiserie',
      'Meisterliche Rezepturen für exklusive Zunft- und Hofspezialitäten',
      'Ausbildung und Bewertung von Konditorgesellen und Lehrlingen',
      'Betriebsführung, exklusiver Wareneinkauf und Kundenberatung'
    ]
  },
  metzger: {
    lehrling: [
      'Reinigung und Desinfektion von Schlachtraum, Haken und Zerlegetischen',
      'Messer schärfen und Zerkleinerungswerkzeuge vorbereiten',
      'Fleischabschnitte sortieren, Darmreinigungsarbeiten durchführen',
      'Salz, Pökellake und Gewürzmischungen nach Rezept ansetzen'
    ],
    geselle: [
      'Fachgerechte Grob- und Feinzerlegung von Schlachttieren',
      'Herstellung von Frisch-, Koch- und Dauerwurstwaren nach Rezeptur',
      'Zuschneiden von Bratenstücken, Koteletts und Siedefleisch',
      'Einlegen und Überwachen von Pökel- und Räuchervorgängen'
    ],
    spezialisierung: [
      'Herstellung langlebiger Schinken-, Hartwurst- und Trockenfleisch-Spezialitäten',
      'Feine Terrinen, Sülzen, Leberpasteten und Reifeverfahren',
      'Schlachtung und Zerlegung seltener Wild- und Edeltiere',
      'Hygienekontrolle und Qualitätsprüfung bei Seuchen- und Schädlingsgefahr'
    ],
    meister: [
      'Leitung des Schlacht- und Fleischereibetriebs nach Zunftordnung',
      'Vieheinkauf auf Märkten und Qualitätsbegutachtung lebender Tiere',
      'Ausbildung von Fleischereigesellen und Lehrlingen',
      'Sicherung der Fleischversorgung für Stadt, Garnison oder Feldzug'
    ]
  },
  brauer: {
    lehrling: [
      'Sudkessel, Gärbottiche und Lagerfässer gründlich reinigen und dämpfen',
      'Malzsäcke transportieren, schroten und Maischbottich befüllen',
      'Feuer unter dem Braukessel unterhalten und Asche räumen',
      'Wasserfässer füllen und Temperaturüberwachung unterstützen'
    ],
    geselle: [
      'Durchführung des Maisch- und Läuterprozesses nach Rezeptur',
      'Hopfenzugabe und Kochen der Würze bei exakten Zeiten',
      'Anstellen der Hefe und Kontrolle der Haupt- und Nachgärung',
      'Abfüllen, Spunden und Lagern von Bier in Fässern'
    ],
    spezialisierung: [
      'Entwicklung von Bockbieren, Starkbieren, Kräuter- und Gewürzabfüllungen',
      'Spezielle obergärige und untergärige Hefezucht und Gärungssteuerung',
      'Pechung und Instandhaltung von Großlagerfässern',
      'Bierlagerung für Fernreisen und tropische Klimazonen'
    ],
    meister: [
      'Gesamtleitung der Brauerei, Wasserquellenprüfung und Rohstoffeinkauf',
      'Wahrung von Reinheitsgeboten und Einhaltung von Zunftvorgaben',
      'Ausbildung des Brauernachwuchses und Abnahme der Sude',
      'Abschluss von Lieferverträgen mit Gasthäusern, Klöstern und Festen'
    ]
  },
  winzer: {
    lehrling: [
      'Reben anbinden, Triebe ausgeizen und Weinbergpfade instand halten',
      'Traubenträger, Bottiche und Kelterpressen vor der Lese gründlich scheuern',
      'Erntehilfe bei der Weinlese: sorgfältiges Ausschneiden unreifer und fauler Beeren',
      'Schwefelschnitten zur Fassdesinfektion vorbereiten und Kellerböden säubern'
    ],
    geselle: [
      'Fachgerechter Rebschnitt im Frühjahr zur gezielten Ertrags- und Qualitätssteuerung',
      'Bedienung der Traubenpresse und schonendes Keltern des Mostes',
      'Messung von Oechsle-Graden, Säurewerten und Temperaturkontrolle im Gärtank',
      'Abstich von der Hefe, Klärung und Vorbereitung der Holzfasslagerung'
    ],
    spezialisierung: [
      'Gezielter Barrique-Ausbau und Reifung im Eichenholzfass für Spitzenweine',
      'Komposition harmonischer Cuvées aus unterschiedlichen Rebsorten und Lagen',
      'Herstellung edler Eisweine, Spätlesen, Trockenbeerenauslesen und Schaumweine',
      'Sensorische Verkostung, Weinfehler-Diagnose und Terroir-Optimierung'
    ],
    meister: [
      'Gesamtleitung des Weinguts, Lagenbewirtschaftung und Jahrgangsplanung',
      'Vergabe von Prädikaten, Prüfsiegeln und Vertretung in der Winzerinnung',
      'Ausbildung von Winzergesellen und Prüfung angehender Kellermeister',
      'Repräsentation des Weinguts bei fürstlichen Verkostungen und Großkunden'
    ]
  },
  wirt: {
    lehrling: [
      'Gaststube fegen, Tische scheuern und Kaminfeuer entfachen',
      'Getränkefässer aus dem Keller anstechen und Krüge bereitstellen',
      'Einfache Speisen auftragen, Tische abräumen und Geschirr spülen',
      'Gästezimmer lüften, Betten frisch beziehen und Lampenöl auffüllen'
    ],
    geselle: [
      'Ausschank von Bier, Wein und Spirituosen an der Theke',
      'Empfang, Platzierung und Bewirtung der Gäste in der Gaststube',
      'Schlichtung von kleineren Streitigkeiten und Durchsetzung der Hausordnung',
      'Kassieren, Führen der Tagesabrechnung und Wechselgeldverwaltung'
    ],
    spezialisierung: [
      'Organisation von Feiern, Hochzeiten, Gildenversammlungen und Turnieren',
      'Beschaffung exklusiver Weine, Gewürze und Delikatessen',
      'Betreuung hochrangiger Gäste, Gesandter und Adliger',
      'Sicherheitsmanagement gegen Diebstahl, Zechprellerei und Raufbolde'
    ],
    meister: [
      'Eigentümer und Gesamtleiter des Gasthofs / der Taverne',
      'Wirtschaftsplanung, Preiskalkulation und Pachtverträge',
      'Ausbildung des Personals (Schankburschen, Mägde, Köche)',
      'Pflege der Beziehungen zu Stadtrat, Zünften und Reisegesellschaften'
    ]
  },
  kellner: {
    lehrling: [
      'Tische sauber abwischen, Bestecke polieren und Gläser glanzklar spülen',
      'Servietten falten, Speisekarten auslegen und Menagen auffüllen',
      'Speisen und Getränke auf Tabletts tragen und zügig abräumen',
      'Küche und Schenke durch zügigen Geschirrtransport unterstützen'
    ],
    geselle: [
      'Fachgerechte Aufnahme von Bestellungen und Empfehlungen des Tagesangebots',
      'Gekonntes Servieren mehrgängiger Menüs nach gastronomischen Regeln',
      'Zuvorkommende Betreuung der Tischgäste und Beantwortung von Fragen zu Speisen',
      'Kassieren, Rechnungslegung und gewissenhafte Abrechnung der Kellnerbörse'
    ],
    spezialisierung: [
      'Dekantieren und fachkundige Präsentation erlesener Weine am Tisch',
      'Tranchieren von Braten, Filetieren von Fisch und Flambieren vor dem Gast',
      'Betreuung exklusiver VIP-Tafeln, Festbankette und Staatsbankette',
      'Koordination des Serviceteams und Ablaufsteuerung zwischen Küche und Saal'
    ],
    meister: [
      'Oberkellner / Maître d’Hôtel / Restaurant- und Serviceleiter',
      'Personaleinsatzplanung, Schulung des Serviceteams und Etikette-Standards',
      'Gestaltung exklusiver Bankett- und Menükarten in Abstimmung mit dem Küchenchef',
      'Gästebindung für das gehobene Etablissement und Reklamationsmanagement'
    ]
  },

  // ---------------------------------------------------------------------------
  // 2. BAU & HANDWERK
  // ---------------------------------------------------------------------------
  schreiner: {
    lehrling: [
      'Werkstatt sauber halten, Holzspäne fegen und Leimtöpfe anwärmen',
      'Hobelbänke, Stemmeisen und Sägen säubern, ölen und schärfen',
      'Holzbohlen nach Faserverlauf sortieren, zuschneiden und vorschleifen',
      'Einfache Dübelverbindungen und Zuarbeiten ausführen'
    ],
    geselle: [
      'Herstellung robuster Möbel (Tische, Bänke, Truhen, Schränke)',
      'Präzises Einpassen von Zapfen-, Zinken- und Nut-Feder-Verbindungen',
      'Einbau von Türen, Fensterrahmen und Scharnieren',
      'Auftragen von Lasuren, Beizen, Wachsen und Schellack'
    ],
    spezialisierung: [
      'Anfertigung von Prunkmöbeln mit Geheimfächern und Schnitzereien',
      'Furnierarbeiten, Intarsien und filigrane Holzmarketerie',
      'Restaurierung historischer Sakral- und Schlossmöbel',
      'Konstruktion maßgefertigter Treppen und Vertäfelungen'
    ],
    meister: [
      'Leitung der Schreinerei, Werkstattkalkulation und Auftragsvergabe',
      'Entwurf anspruchsvoller Möbelprogramme und Raumkonzepte',
      'Ausbildung und Begutachtung von Gesellenstücken',
      'Materialeinkauf seltener Edel- und Harthölzer'
    ]
  },
  zimmerer: {
    lehrling: [
      'Bauholz entrinden, ablängen und auf dem Zimmerplatz stapeln',
      'Tragende Balken transportieren und Hebezeuge vorbereiten',
      'Bohrlöcher für Holznägel vorbohren und Werkzeuge instand halten',
      'Sicherheitsvorkehrungen am Baugerüst unterstützen'
    ],
    geselle: [
      'Abbinden von Dachstühlen nach Risszeichnung',
      'Fachgerechte Ausführung von Verblattungen, Zapfen und Streben',
      'Aufrichten von Dachwerken und Fachwerkwänden am Bauwerk',
      'Verschlagen von Schalungen, Latten und Windrispen'
    ],
    spezialisierung: [
      'Konstruktion monumentaler Kirchendächer, Kuppeln und Hallentragwerke',
      'Bau von hölzernen Brücken, Hebekränen und Wehrtürmen',
      'Sanierung geschädigter historischer Fachwerke im Bestand',
      'Berechnung statisch hochbelasteter Verbundtragwerke'
    ],
    meister: [
      'Gesamtleitung von Holzbauprojekten und statische Entwurfsplanung',
      'Richtfestleitung, Bauabnahme und Zunftgutachten',
      'Ausbildung von Zimmererlehrlingen und Polieren',
      'Holzeinkauf in Forsten und Koordination mit Maurern und Steinmetzen'
    ]
  },
  maurer: {
    lehrling: [
      'Mörtel mischen (Kalk, Sand, Wasser) und zur Baustelle tragen',
      'Ziegel- und Bruchsteine reinigen, anfeuchten und zutragen',
      'Gerüste sichern, Schutzplanken anbringen und Baustelle reinigen',
      'Grundmauergräben ausschachten und verdichten'
    ],
    geselle: [
      'Errichten von Ziegel- und Natursteinmauern im Verband nach Schnur',
      'Setzen von Ecken, Pfeilern, Fenstereinfassungen und Türbögen',
      'Auftragen und Glätten von Grund- und Deckputz an Außen- und Innenwänden',
      'Fachgerechtes Verfugen und Ausbessern von Mauerwerksschäden'
    ],
    spezialisierung: [
      'Konstruktion von tragenden Tonnengewölben, Kreuzgratgewölben und Kuppeln',
      'Errichtung von wehrhaften Festungsmauern, Zinnen und Pechnasen',
      'Verblendmauerwerk mit dekorativen Ornamenten und Mosaiken',
      'Trockenlegung feuchter Keller und Fundamentsanierung'
    ],
    meister: [
      'Leitung der Bauhütte und Koordination aller Baugewerke',
      'Baustatik, Fundamentplanung und Genehmigungsverfahren',
      'Ausbildung des Maurernachwuchses und Polierüberwachung',
      'Abnahme massiver Großbauten, Stadtbefestigungen und Brücken'
    ]
  },
  schneider: {
    lehrling: [
      'Nähnadeln, Garne, Scheren und Bügeleisen vorbereiten und pflegen',
      'Stoffballen ausrollen, auf Fehler prüfen und zuschneiden helfen',
      'Heftnähte setzen, Säume vorbereiten und Knöpfe annähen',
      'Arbeitsraum sauber halten und Schnittmuster abzeichnen'
    ],
    geselle: [
      'Zuschnitt von Stoffen nach Maß und Passform',
      'Nähen robuster Alltagskleidung, Hosen, Hemden, Röcke und Wämser',
      'Anproben durchführen und Kleidungsstücke exakt abstecken',
      'Reparatur, Ausbesserung und Umnähen getragener Gewänder'
    ],
    spezialisierung: [
      'Fertigung von höfischer Prachtkleidung aus Seide, Samt und Brokat',
      'Stickerei mit Gold- und Silberfäden, Perlen- und Edelsteinbesatz',
      'Herstellung von gefütterten Wintermänteln, Pelzbesätzen und Heroldsröcken',
      'Maßanfertigung wattierter Unterkleidung für Ritter und Rüstungsträger'
    ],
    meister: [
      'Leitung des Schneiderateliers und Hofschneiderei',
      'Entwurf neuer Moden und Kollektionen für Patrizier und Adel',
      'Ausbildung von Gesellen und Zunftprüfung des Meisterstücks',
      'Einkauf kostbarer Importstoffe und Verhandlungen mit Tuchhändlern'
    ]
  },

  // ---------------------------------------------------------------------------
  // 3. METALL & FEINHANDWERK
  // ---------------------------------------------------------------------------
  schmied: {
    lehrling: [
      'Schmiedefeuer anfachen, Kohle nachlegen und Blasbalg bedienen',
      'Schmiedezangen, Hämmer und Amboss sauber und griffbereit halten',
      'Eisenbarren sägen, abschlagen und Rohlinge im Feuer vorwärmen',
      'Zuschlagen als Zuschläger mit dem schweren Vorschlaghammer nach Takt'
    ],
    geselle: [
      'Selbstständiges Schmieden von Werkzeugen, Nägeln, Hufeisen und Beschlägen',
      'Feuerverschweißen von Eisen- und Stahlstücken im Kohlenfeuer',
      'Härten und Anlassen von Kohlenstoffstahl auf die richtige Farbe',
      'Richten, Schleifen und Entgraten fertiger Schmiedestücke'
    ],
    spezialisierung: [
      'Herstellung feuerverschweißter Damaszenerklingen und Spezialstähle',
      'Kunstschmiedearbeiten (verzierter Gitterbau, Tore, Glockenschwengel)',
      'Warmverformung komplexer Bauteile für Wagen, Mühlen und Belagerungsgeräte',
      'Differentialhärtung für extreme Schärfe bei elastischem Klingenrücken'
    ],
    meister: [
      'Leitung der Dorf- oder Stadtschmiede und Führung der Gesellen',
      'Entwurf meisterhafter Zunftarbeiten und Großaufträge',
      'Ausbildung und Prüfung von Schmiedelehrlingen',
      'Einkauf von Erzen, Roheisen und Steinkohle'
    ]
  },
  waffenschmied: {
    lehrling: [
      'Esse reinigen, Holzkohle sieben und Härtebecken vorbereiten',
      'Schleifsteine wässern, Feilen reinigen und Poliermittel mischen',
      'Rohlinge für Klingen, Spitzen und Parierstangen zuschlagen',
      'Einfache Pfeilspitzen, Bolzen und Dolchrohlinge grob schmieden'
    ],
    geselle: [
      'Schmieden ausgewogener Schwerter, Säbel, Lanzen und Streitkolben',
      'Härten und federhartes Anlassen von Klingen zur Vermeidung von Bruch',
      'Feilen, Schleifen und Schärfen von Schneiden und Spitzen',
      'Montage von Parierstange, Griffholz, Lederwicklung und Knauf'
    ],
    spezialisierung: [
      'Herstellung von mehrlagigem Damaststahl mit komplexen Mustern',
      'Perfekte Ausbalancierung meisterlicher Fechtwaffen und Zweihänder',
      'Gravur von Runen, Sinnsprüchen und Hohlkehlen in Klingen',
      'Spezialwaffen gegen gerüstete Gegner (z.B. Panzerbrecher, Rabenschnäbel)'
    ],
    meister: [
      'Leitung der Zeughausschmiede oder Hofwaffenmanufaktur',
      'Erschaffung legendärer Meisterklingen für Heerführer und Könige',
      'Ausbildung und Abnahme von Waffenschmiedegesellen',
      'Rüstungsaufträge für Armeen und Prüfung von Stahlchargen'
    ]
  },
  ruestungsschmied: {
    lehrling: [
      'Treibhämmer, Treibfäuste und Polierscheiben pflegen',
      'Bleche zuschneiden, entgraten und Glühofen bestücken',
      'Kettenringe stanzen, wickeln und Kettengeflechte vernieten',
      'Lederriemen zuschneiden, lochen und Schnallen vorbereiten'
    ],
    geselle: [
      'Treiben von Brustpanzern, Helmen, Arm- und Beinschienen nach Maß',
      'Gelenkige Vernietung beweglicher Panzersegmente (Schwebescheiben, Fausteln)',
      'Härten von Rüstungsplatten gegen Pfeil- und Bolzenbeschuss',
      'Innenpolsterung und Befestigung von Lederberiemungen'
    ],
    spezialisierung: [
      'Maßanfertigung kompletter Vollharnische mit perfekter Bewegungsfreiheit',
      'Rändelung, Ätzung und Feuervergoldung von Prunkharnischen',
      'Spezialturnierrüstungen (z.B. Stechzeuge für den Lanzenstich)',
      'Kombination von gehärtetem Federstahl für maximale Stoßabsorption'
    ],
    meister: [
      'Hofplattner für Fürstenhäuser und königliche Ritterorden',
      'Entwurf revolutionärer Panzerungsformen und Ergonomiekonzepte',
      'Ausbildung hochqualifizierter Plattnergellen',
      'Prüfung und Zertifizierung von Rüstungsstählen gegen Armbrustbeschuss'
    ]
  },
  goldschmied: {
    lehrling: [
      'Schmelztiegel, Zieheisen und Polierpasten reinigen und bereitlegen',
      'Edelmetallabfälle und Feilstaub sorgfältig auffangen und trennen',
      'Gold- und Silberdrähte ziehen und Bleche auswalzen',
      'Einfache Lötstellen vorbereiten und Flussmittel auftragen'
    ],
    geselle: [
      'Herstellung von Ringen, Ketten, Fibeln, Broschen und Ohrschmuck',
      'Präzises Löten feiner Edelmetallverbindungen mit dem Lötrohr',
      'Fassen von Edelsteinen (Zargen- und Krappenfassungen)',
      'Oberflächenbearbeitung (Polieren, Mattieren, Ziselieren)'
    ],
    spezialisierung: [
      'Filigrane Granulation und Cloisonné-Emailarbeiten',
      'Anfertigung von Kronjuwelen, Zeptern, Siegelringen und Sakralgeräten',
      'Fassen seltener Edelsteine mit komplexem Facettenschliff',
      'Gravur von Familienwappen und mikroskopischen Mustern'
    ],
    meister: [
      'Leitung des Hofgoldschmiedeateliers und Zunftvorsitz',
      'Wertgutachten und Feingehaltsprüfung von Edelmetallen (Punzierungsrecht)',
      'Ausbildung und Abnahme des Goldschmiede-Meisterstücks',
      'Verhandlung mit königlichen Schatzmeistern und Minenbesitzern'
    ]
  },

  // ---------------------------------------------------------------------------
  // 4. NATUR & LANDWIRTSCHAFT
  // ---------------------------------------------------------------------------
  bauer: {
    lehrling: [
      'Stallungen ausmisten, Einstreu verteilen und Tränken reinigen',
      'Steine von Feldern sammeln und Unkraut jäten',
      'Zugtiere anspannen, füttern und striegeln',
      'Einfache Saat- und Erntearbeiten mit Sichel und Harke unterstützen'
    ],
    geselle: [
      'Führen von Pflug, Egge und Saatgutausbringung auf den Feldern',
      'Sense führen bei der Getreide- und Heuernte',
      'Drusch und Worfeln des Getreides auf der Tenne',
      'Wartung von Zäunen, Scheunen, Bewässerungsgräben und Geräten'
    ],
    spezialisierung: [
      'Fruchtfolgeplanung (Dreifelderwirtschaft) und Bodenverbesserung',
      'Zucht ertragreicher Saaten und lagerfähiger Pflanzensorten',
      'Herstellung von Qualitätsfutter und Silage für den Winter',
      'Einsatz und Pflege spezialisierter Pflanz- und Erntetechniken'
    ],
    meister: [
      'Wirtschaftliche und operative Leitung des Gutshofs / Bauernhofs',
      'Saatgutbeschaffung, Pachtverwaltung und Abgabenabrechnung',
      'Ausbildung von Jungbauern und Knechten',
      'Vermarktung der Ernteerträge auf den Stadtmärkten'
    ]
  },
  jaeger: {
    lehrling: [
      'Jagdhunde füttern, kämmen und im Gehorsam schulen',
      'Bögen, Armbrüste, Fallen und Jagdmesser pflegen und spannen',
      'Wildpfade nach Spuren absuchen und Futterstellen anlegen',
      'Erlegtes Wild zum Jagdlager tragen und Häutung vorbereiten'
    ],
    geselle: [
      'Lautloses Pirschen und Ansprechen von Hoch- und Niederwild',
      'Sicherer Schuss mit Bogen oder Armbrust auf flüchtende Ziele',
      'Fachgerechtes Aufbrechen, Ausweiden und Zerwirken von Wildbret',
      'Abziehen von Fellen und Vorbereitung für die Gerberei'
    ],
    spezialisierung: [
      'Jagd auf gefährliches Raubwild (Bären, Wölfe, Schattenkreaturen)',
      'Ausbildung und Führung von Meutenjagdhunden und Beizvögeln (Falknerei)',
      'Aufstellen spezialisierter Schlingen, Tellereisen und Fanggruben',
      'Spurenlesen über steiniges Terrain und bei widrigsten Witterungen'
    ],
    meister: [
      'Leitung der fürstlichen Jagdgesellschaften und Hegemeister',
      'Wildbestandsregulierung und Schutz des Forstes vor Wilderern',
      'Ausbildung von Jagdaufsehern und Berufsjägern',
      'Organisation von Großtreibjagden und Repräsentation bei Hofe'
    ]
  },
  kraeuterkundiger: {
    lehrling: [
      'Sammelkörbe, Trockengestelle und Mörser sauber halten',
      'Häufige Heilkräuter nach Aussehen, Geruch und Standort bestimmen',
      'Kräuter schonend ernten, bündeln und an schattigen Orten trocknen',
      'Beschriftung von Gläsern, Beuteln und Tiegeln'
    ],
    geselle: [
      'Herstellung von Teesuden, Tinkturen, Umschlägen und Salben',
      'Bestimmung seltener Wild- und Gebirgskräuter nach Blüte und Wurzel',
      'Zubereitung von Kräuterauflagen zur Wundbehandlung und Fiebersenkung',
      'Richtige Lagerung zur Erhaltung ätherischer Wirkstoffe'
    ],
    spezialisierung: [
      'Extraktion hochkonzentrierter Essenzen und alchemistischer Elixiere',
      'Kombination giftiger Pflanzen für Gegengifte und Schmerzmittel',
      'Kultivierung seltener magischer und aromatischer Kräuter im Arzneigarten',
      'Diagnose von Kräuterunverträglichkeiten und Vergiftungen'
    ],
    meister: [
      'Leitung des botanischen Arzneigartens und Kräuterapotheke',
      'Verfassen von Kräuterbüchern und Ausbildung von Herbalisten',
      'Entdeckung neuer Wirkstoffe und Heilverfahren aus Flora und Fauna',
      'Beratung von Stadtärzten, Klöstern und Lazarettführungen'
    ]
  },

  // ---------------------------------------------------------------------------
  // 5. MEDIZIN
  // ---------------------------------------------------------------------------
  arzt: {
    lehrling: [
      'Lazarettbetten herrichten, Verbände kochen und Instrumente desinfizieren',
      'Puls und Temperatur von Patienten erfassen und protokollieren',
      'Einfache Salben, Wundtränke und Kräutertees nach Anweisung anmischen',
      'Dem leitenden Arzt bei Behandlungen assistieren und Wunden reinigen'
    ],
    geselle: [
      'Selbstständige Diagnose gewöhnlicher Krankheiten, Fieber und Infektionen',
      'Erstversorgung von Schnitt-, Hieb- und Schusswunden sowie Knochenbrüchen',
      'Verschreibung und Verabreichung von Arzneien und Heiltränken',
      'Führen von Patientenakten und Überwachung des Genesungsverlaufs'
    ],
    spezialisierung: [
      'Chirurgische Eingriffe (Amputationen, Geschwürsentfernungen, Nähte)',
      'Behandlung seltener Seuchen, Gifte und mythischer Krankheiten',
      'Feldlazarettleitung unter Kriegsbedingungen und Triageverletzter',
      'Anästhesie und Schmerzausschaltung durch pflanzliche Wirkstoffe'
    ],
    meister: [
      'Chefarzt des städtischen Hospitals oder Leibarzt des Königshauses',
      'Erforschung neuer Heilmethoden und Verfassen medizinischer Lehrschriften',
      'Ausbildung und Prüfung von Ärzten und Wundärzten an Universitäten',
      'Leitung von Quarantänemaßnahmen bei reichsweiten Epidemien'
    ]
  },
  heiler: {
    lehrling: [
      'Heilräume lüften, Weihrauch entzünden und Ruhe bewahren',
      'Bandagen rollen, Tinkturen abmessen und Patienten beruhigen',
      'Lebenszeichen überwachen und einfache Wundverbände anlegen',
      'Konzentration und Energiefluss in Meditationsübungen schulen'
    ],
    geselle: [
      'Kanalisierung heilender Energien zur Linderung akuter Schmerzen',
      'Schließen oberflächlicher Fleischwunden und Stillung von Blutungen',
      'Reinigung des Körpers von einfachen Toxinen und Erschöpfung',
      'Ganzheitliche Pflege von Verwundeten und Genesenden'
    ],
    spezialisierung: [
      'Regeneration von Nerven- und Gewebeschäden durch Aurabehandlung',
      'Lösen von Flüchen, magischen Verunreinigungen und seelischen Schocks',
      'Schnellheilung im Gefecht bei kritischen Vitalwerten',
      'Wiederherstellung geschwächter Organe und Knochensubstanz'
    ],
    meister: [
      'Wunderheilung schwerster tödlicher Verletzungen und Koma-Zustände',
      'Leitung spiritueller Heilhäuser und Sanatorien',
      'Ausbildung von Heilern und Geistheilern',
      'Erschaffung segensreicher Heilquellen und Schutzsanctuarien'
    ]
  },

  // ---------------------------------------------------------------------------
  // 6. WISSENSCHAFT
  // ---------------------------------------------------------------------------
  forscher: {
    lehrling: [
      'Laborgeräte, Manuskripte und Messinstrumente pflegen und ordnen',
      'Literaturrecherchen in Bibliotheken und Archiven durchführen',
      'Versuchsreihen vorbereiten und Rohdaten sauber tabellieren',
      'Exemplare und Proben sorgfältig katalogisieren und konservieren'
    ],
    geselle: [
      'Selbstständige Durchführung empirischer Experimente und Analysen',
      'Auswertung von Messdaten und Abfassen wissenschaftlicher Berichte',
      'Bedienung komplexer Instrumente (z.B. Fernrohre, Sextanten, Mikroskope)',
      'Überprüfung wissenschaftlicher Hypothesen nach strenger Methodik'
    ],
    spezialisierung: [
      'Entwicklung neuer theoretischer Modelle und mathematischer Beweise',
      'Leitung von Expeditionen in unbekannte Gebiete zur Datenerhebung',
      'Analyse arkaner Anomalien und Naturphänomene',
      'Veröffentlichung von Fachabhandlungen in akademischen Gilden'
    ],
    meister: [
      'Leitung einer Akademie, Fakultät oder königlichen Forschungsgesellschaft',
      'Vergabe von Forschungsaufträgen und Stiftungsgeldern',
      'Begutachtung von Dissertationen und Ernennung von Gelehrten',
      'Wissenschaftliche Beratung von Monarchen und Reichsräten'
    ]
  },
  alchemist: {
    lehrling: [
      'Alambiks, Kolben, Tiegel und Reagenzgläser sterilisieren und putzen',
      'Mineralien mahlen, Kräuter mörsern und Destillierwasser ansetzen',
      'Temperatur der Sandbäder und Schmelzöfen konstant halten',
      'Sicherheitsvorkehrungen bei ätzenden Dämpfen befolgen'
    ],
    geselle: [
      'Destillation von Essenzen, Säuren, Basen und flüchtigen Alkoholen',
      'Brauen standardisierter Heil-, Stärkungs- und Schlaftränke',
      'Reagenzprüfungen auf Echtheit von Metallen und Erzen',
      'Sichere Lagerung und Abfüllung hochexplosiver Substanzen'
    ],
    spezialisierung: [
      'Synthese von alchemistischem Feuer, Säurebomben und Rauchpulver',
      'Brauen von Verwandlungs- und Unsichtbarkeitstränken',
      'Transmutation unedler Metalle und Kristallzüchtung',
      'Stabilisierung hochempfindlicher magischer Katalysatoren'
    ],
    meister: [
      'Großmeister des Alchemistenordens und Hüter geheimer Rezepturen',
      'Erschaffung des Steins der Weisen oder universeller Elixiere',
      'Ausbildung und Prüfung diplomierter Alchemisten',
      'Lieferverträge für Munition und Arzneien an Armeen und Akademien'
    ]
  },

  // ---------------------------------------------------------------------------
  // 7. HANDEL & WIRTSCHAFT
  // ---------------------------------------------------------------------------
  kaufmann: {
    lehrling: [
      'Warenannahme, Zählen, Wiegen und Einräumen in Lagerregale',
      'Kassenbuch führen, Quittungen abstempeln und Botengänge erledigen',
      'Verkaufsstand und Kontor säubern und Schaufenster dekorieren',
      'Preisetiketten anbringen und Kundengespräche aufmerksam verfolgen'
    ],
    geselle: [
      'Verkauf von Waren, Führen von Preis- und Rabattverhandlungen',
      'Prüfung von Münzen auf Feingehalt und Fälschungsmerkmale',
      'Erstellung von Rechnungen, Frachtbriefen und Schuldscheinen',
      'Disposition und Nachbestellung von Lagerbeständen'
    ],
    spezialisierung: [
      'Organisation von Fernhandelskarawanen und Übersee-Schiffsladungen',
      'Abschluss von Exklusivverträgen mit Gilden, Manufakturen und Minen',
      'Termingeschäfte, Währungsarbitrage und Warenkredite',
      'Handel mit Luxusgütern, Seide, Gewürzen und magischen Artefakten'
    ],
    meister: [
      'Vorsitzender der Handelskammer / Gildenältester der Hanse',
      'Etablierung internationaler Kontore und Handelsrouten',
      'Ausbildung junger Kaufleute und Vergabe von Handelskrediten',
      'Finanzierung von Flottenexpeditionen und Einflussnahme auf Stadtpolitik'
    ]
  },

  // ---------------------------------------------------------------------------
  // 8. DIENSTLEISTUNG
  // ---------------------------------------------------------------------------
  kutscher: {
    lehrling: [
      'Pferde füttern, tränken, striegeln und Hufe auskratzen',
      'Kutschen waschen, Radachsen fetten und Lederpolster pflegen',
      'Gepäckstücke verladen, mit Seilen verzurren und planen',
      'Geschirr und Zaumzeug reinigen, ölen und auf Risse prüfen'
    ],
    geselle: [
      'Sicheres Führen von Ein- und Zweispännern im Stadt- und Überlandverkehr',
      'Kenntnis der Straßennetze, Mautstationen und sicheren Ausweichrouten',
      'Passagierbetreuung, Gepäcksicherung und Einhaltung von Fahrplänen',
      'Pannenhilfe unterwegs (Radwechsel, Achsenreparatur, Hufschuhwechsel)'
    ],
    spezialisierung: [
      'Führen von Vierspännern und schweren Postkutschen bei Nacht und Unwetter',
      'Verteidigung der Kutsche gegen Wegelagerer mit Peitsche und Blunderbüchse',
      'Schonender Transport hochempfindlicher Frachten und Adliger',
      'Gespannkontrolle in steilem Gebirgsgelände und auf Eis'
    ],
    meister: [
      'Leiter des königlichen Fuhrwesens oder einer überregionalen Postlinie',
      'Routenplanung, Flottenbeschaffung und Stationennetz-Ausbau',
      'Ausbildung und Zulassung von Berufs- und Hofkutschern',
      'Großlogistikverträge für Heerestrosse und Reichstage'
    ]
  },
  butler: {
    lehrling: [
      'Silberbesteck, Gläser und Kaminroste polieren',
      'Tageskleidung des Hausherrn bürsten, bügeln und bereitlegen',
      'Türen öffnen, Boten empfangen und Visitenkarten annehmen',
      'Hausordnung, diskretes Auftreten und Rangordnung einstudieren'
    ],
    geselle: [
      'Perfektes Servieren von mehrgängigen Speisen und Weinen bei Tisch',
      'Koordination der Dienstboten, Zimmermädchen und Küchenhilfen',
      'Empfang und feierliche Ankündigung eintreffender Gäste',
      'Pflege des Weinkellers und Überwachung der Haushaltsvorräte'
    ],
    spezialisierung: [
      'Hofmeisterliche Leitung adeliger Residenzen und Schlösser',
      'Organisation hochkarätiger Soiréen, Bälle und politischer Diners',
      'Diskretes Informations- und Sicherheitsmanagement im Haus',
      'Verwaltung der privaten Schatulle und wertvoller Kunstsammlungen'
    ],
    meister: [
      'Majordomus / Obersthofmeister an einem Fürsten- oder Königshof',
      'Höchste Autorität über das gesamte Hof- und Dienstpersonal',
      'Protokollarische Leitung königlicher Zeremonien und Staatsbesuche',
      'Ausbildung der Spitzenklasse von Butlern und Haushofmeistern'
    ]
  },

  // ---------------------------------------------------------------------------
  // 9. VERWALTUNG
  // ---------------------------------------------------------------------------
  schreiber: {
    lehrling: [
      'Gänsekiele zuschneiden, Tinten anmischen und Löschsand bereithalten',
      'Pergamente und Papiere zuschneiden, linieren und glätten',
      'Abschreiben einfacher Dokumente zur Schulung einer sauberen Kalligraphie',
      'Akten sortieren, binden, siegeln und im Archiv einlagern'
    ],
    geselle: [
      'Aufsetzen fehlerfreier Verträge, Urkunden, Rechnungen und Testamente',
      'Protokollführung bei Ratssitzungen, Gerichtsverhandlungen und Notariaten',
      'Sichere Anwendung von Kanzleiformeln und juristischer Fachsprache',
      'Kopieren und Beglaubigen wichtiger Rechtsdokumente mit Amtssiegel'
    ],
    spezialisierung: [
      'Entschlüsselung und Abfassung diplomatischer Geheimschriften (Kryptographie)',
      'Erstellung meisterlicher Prunkurkunden mit Buchmalerei und Goldinitialen',
      'Kanzleileitung für Fürstentümer und bischöfliche Ordinariate',
      'Prüfung von Dokumenten auf Fälschungsmerkmale und Wasserzeichen'
    ],
    meister: [
      'Großkanzler, Stadtschreiber oder Oberster Archivar des Reiches',
      'Verwaltung des Reichssiegels und aller Staatsverträge',
      'Ausbildung und Ernennung vereidigter Kanzleischreiber',
      'Gesetzgebungsberatung und Verfassungsdokumentation'
    ]
  },
  richter: {
    lehrling: [
      'Gesetzestexte, Kodizes und Urteilssammlungen studieren und nachschlagen',
      'Ladungen für Zeugen und Kläger ausstellen und Gerichtstage vorbereiten',
      'Beisitz bei einfachen Schlichtungsverfahren und Protokollkontrolle',
      'Verwaltung der Gerichtsakten und Verwahrungsräume'
    ],
    geselle: [
      'Leitung von Verhandlungen bei Zivilstreitigkeiten und kleineren Delikten',
      'Vernehmung von Zeugen, Klägern und Angeklagten unter Eid',
      'Rechtsprechung nach geltendem Landes-, Zunft- und Stadtrecht',
      'Verhängung von Geldstrafen, Ehrenstrafen und Schadensersatztiteln'
    ],
    spezialisierung: [
      'Führung schwerer Kriminalprozesse (Mord, Verrat, Magiemissbrauch)',
      'Interpretation komplexer Lehns-, Erb- und Völkerrechtsfragen',
      'Vorsitz bei Berufungsgerichten und Schiedsgerichten der Fürsten',
      'Erstellung grundlegender Rechtsgutachten für Landesherren'
    ],
    meister: [
      'Oberster Richter am Reichshofgericht oder Justizkanzler',
      'Höchste richterliche Instanz für Urteile über Leben, Tod und Reichsacht',
      'Reform des Gesetzbuches und Ausbildung von Richtern und Notaren',
      'Wahrung der Rechtsstaatlichkeit und Unabhängigkeit der Gerichte'
    ]
  },

  // ---------------------------------------------------------------------------
  // 10. MILITÄR
  // ---------------------------------------------------------------------------
  soldat: {
    lehrling: [
      'Waffen, Schilde und Rüstungsteile täglich entrosten, ölen und putzen',
      'Exerzieren im Gleichschritt, Formationsmarsch und Schildwalltraining',
      'Lagerbau: Zelte aufbauen, Gräben ausheben und Wälle sichern',
      'Wachdienst am Lagertor und Patrouillen unter Führung eines Korporals'
    ],
    geselle: [
      'Disziplinierter Einsatz von Lanze, Schwert, Schild und Wurfwaffen im Gefecht',
      'Halten und Vorrücken in geschlossenen Schlachtreihen und Phalanxen',
      'Besetzung von Wachtürmen, Toren und Festungsmauern im Verteidigungsfall',
      'Durchführung von Vorstößen, Gegenangriffen und geordneten Rückzügen'
    ],
    spezialisierung: [
      'Einsatz als Veteran in der Vorhut, Sturmabteilung oder schweren Infanterie',
      'Führung kleiner taktischer Einheiten (Rotten, Banner, Zehnscahften)',
      'Taktischer Kampf gegen Kavallerie und Befestigungssturm mit Leitern',
      'Erste Hilfe bei Schlachtfeldverwundungen und Bergung von Kameraden'
    ],
    meister: [
      'Hauptmann, Feldwebel oder Kommandant eines Regiments / einer Garnison',
      'Gefechtstaktik, Truppenmoral, Verpflegungs- und Munitionslogistik',
      'Ausbildung und Disziplinierung der Truppen nach Heeresordnung',
      'Führung von Gefechten auf strategischer Ebene nach Befehl des Generals'
    ]
  },
  wachmann: {
    lehrling: [
      'Dienstplan studieren, Hellebarde und Laterne pflegen und reinigen',
      'Stadttore öffnen und schließen nach Sonnenstand und Glockenschlag',
      'Passierscheine, Fuhrwerke und Warenladungen am Tor kontrollieren',
      'Meldegänge bei verdächtigen Vorkommnissen unverzüglich ausführen'
    ],
    geselle: [
      'Regelmäßige Streifengänge durch Stadtviertel und über Wehrgänge',
      'Festnahme von Raufbolden, Dieben und Zechprellern nach Verfolgung',
      'Schlichtung von Schlägereien und Aufrechterhaltung des Landfriedens',
      'Bewachung von Gefängniszellen und Eskorte von Gefangenen zum Gericht'
    ],
    spezialisierung: [
      'Nachtwächter-Spezialist für Schattenbezirke und Einbruchsüberwachung',
      'Schutz von VIP-Persönlichkeiten, Bürgermeistern und Kassenräumen',
      'Aufdeckung verdeckter Schmuggelpfade und illegaler Geheimgänge',
      'Verhandlung bei Geiselnahmen und Barrikaden'
    ],
    meister: [
      'Stadtwachhauptmann / Kommandant der Bürgergarde',
      'Gesamtsicherheit der Stadt, Torüberwachung und Notfallverteidigung',
      'Ermittlungsleitung bei schweren Stadtverbrechen und Bandenkriegen',
      'Ausbildung der Stadtwachen und Koordination mit dem Stadtrat'
    ]
  },

  // ---------------------------------------------------------------------------
  // 11. SEEFAHRT
  // ---------------------------------------------------------------------------
  matrose: {
    lehrling: [
      'Decks schrubben, Teer auftragen und Bilgenwasser lenzen',
      'Tauwerk aufschießen, Tampen belegen und Seemannsknoten üben',
      'Segel anschlagen, reffen und bergen auf Zuruf der Bootsleute',
      'Ausguck auf dem Vormast halten bei Tag und Nacht'
    ],
    geselle: [
      'Sicheres Klettern im Rigg und Takelage bei Sturm und schwerer See',
      'Rudergehen nach Kompasskurs und Ansage des Steuermanns',
      'Bedienung von Ankerwinden, Ladebäumen und Beibooten',
      'Ausbessern von Segeltuch und Spleißen von Tauwerk'
    ],
    spezialisierung: [
      'Bootsmann / Takelmeister: Überwachung aller Seile, Masten und Blöcke',
      'Kanonier zur See: Laden, Richten und Abfeuern von Bordgeschützen',
      'Führung von Enterkommandos und Nahkampf auf schwankenden Planken',
      'Leckabdichtung und Notfallreparaturen unter Wasserlinie'
    ],
    meister: [
      'Kapitän / Schiffsführer auf hoher See',
      'Nautische Gesamtverantwortung für Schiff, Mannschaft und Ladung',
      'Navigation nach Gestirnen, Strömungsberechnung und Törnplanung',
      'Schiffsrat, Disziplinarhoheit und Vertretung der Reederei in Häfen'
    ]
  },

  // ---------------------------------------------------------------------------
  // 12. KRIMINALITÄT
  // ---------------------------------------------------------------------------
  dieb: {
    lehrling: [
      'Lautloses Schleichen auf Holzdielen, Kies und Stroh trainieren',
      'Taschendiebstahl an Übungspuppen mit Glöckchen perfektionieren',
      'Spähen nach unbewachten Geldbeuteln und unaufmerksamen Marktgängern',
      'Fluchtwege, Dachpfade und Unterschlüpfe im Viertel einprägen'
    ],
    geselle: [
      'Zielsicherer Diebstahl von Börsen, Schmuck und Dokumenten im Gedränge',
      'Knacken einfacher Schlösser, Vorhängeschlösser und Fensterschnapper',
      'Abschütteln von Verfolgern und Stadtwachen in engen Gassen',
      'Übergabe der Beute an Hehler zu vorteilhaften Konditionen'
    ],
    spezialisierung: [
      'Fassadenklettern an Palästen, Kathedralen und befestigten Schatzkammern',
      'Überwindung komplexer Schlossmechanismen, Fallen und Alarmdrähte',
      'Infiltration bewachter Anwesen in Verkleidung',
      'Entwendung streng geheimer Dokumente ohne Spuren zu hinterlassen'
    ],
    meister: [
      'Gildenmeister der Diebesgilde / Meisterdieb von Legendenruf',
      'Planung monumentaler Coups gegen Nationalbanken und Königsburgen',
      'Ausbildung und Schutz des Diebesnetzwerks in der Unterwelt',
      'Aufteilung von Einbruchsrevieren und Abkommen mit korrupten Wachen'
    ]
  },
  schmuggler: {
    lehrling: [
      'Geheimfächer in Fässern, Kisten und doppelten Wagenböden zimmern',
      'Nachtmärsche durch Moore, Höhlen und unwegsame Grenzwälder',
      'Warenpakete wasserdicht verpacken und an Bojen versenken',
      'Ablenkungsmanöver an Zollstationen durchführen'
    ],
    geselle: [
      'Transport unverzollter Güter, Drogen, Waffen und Artefakte über Grenzen',
      'Nutzung geheimer Höhlensysteme, Kanäle und Küstenpfade bei Ebbe',
      'Bestechung und Verhandlung mit Zollbeamten und Grenzposten',
      'Sicheres Entladen von Schmugglerschiffen an einsamen Klippen'
    ],
    spezialisierung: [
      'Schmuggel lebender Personen und gesuchter politischer Flüchtlinge',
      'Umgehung magischer Grenzsperren und arkaner Inspektionssiegel',
      'Organisation unterirdischer Tunnelnetzwerke unter Stadtmauern',
      'Gefechtsführung gegen Küstenwachen und Zollpatrouillen'
    ],
    meister: [
      'Oberhaupt des Schmugglerrings und maritimer Schattentransportlinien',
      'Kontrolle aller illegalen Im- und Exportrouten eines Kontinents',
      'Abschluss internationaler Schmuggelabkommen mit Rebellen und Fürsten',
      'Geldwäsche und Etablierung legaler Scheinfirmen'
    ]
  },

  // ---------------------------------------------------------------------------
  // 13. MAGIE
  // ---------------------------------------------------------------------------
  magier: {
    lehrling: [
      'Grimoires, Zauberstäbe, Kristalle und Ritualkreide sorgfältig pflegen',
      'Rezitieren arkaner Formeln und Meditation zur Konzentration des Manas',
      'Wirken elementarer Licht-, Funken-, Reinigungs- und Schutzzauber',
      'Arkanes Vokabular, Runenalphabete und Elementarlehre einstudieren'
    ],
    geselle: [
      'Sicheres Wirken von Kampf-, Schutz- und Manipulationszaubern im Gefecht',
      'Präzises Zeichnen von Bannkreisen und magischen Schutzkreisen',
      'Erkennen und Analysieren arkaner Signaturen, Auren und Verzauberungen',
      'Aufladen von Manakristallen und Herstellung einfacher Spruchrollen'
    ],
    spezialisierung: [
      'Beherrschung mächtiger Zerstörungs-, Teleportations- oder Illusionsmagie',
      'Bannung und Fesselung von Elementarwesen, Dämonen oder Naturgeistern',
      'Erschaffung permanenter Verzauberungen auf Waffen, Rüstungen und Amuletten',
      'Gegenmagie: Zerstreuen feindlicher Zauber und magischer Barrieren'
    ],
    meister: [
      'Erzmagier / Akademieratsmitglied / Hofmagier der Krone',
      'Entwicklung völlig neuer Zaubersprüche und arkaner Theorien',
      'Ausbildung und Prüfung von Magiern an Hohen Akademien',
      'Wirken von Ritualen von territorialem Ausmaß (Wettermanipulation, Großschilde)'
    ]
  },

  // ---------------------------------------------------------------------------
  // 14. KUNST & KULTUR
  // ---------------------------------------------------------------------------
  barde: {
    lehrling: [
      'Saiteninstrumente stimmen, reinigen und Saiten neu aufziehen',
      'Balladen, Heldenepen und Volkslieder textsicher auswendig lernen',
      'Atemtechnik, Stimmbildung und Rhythmusgefühl trainieren',
      'Begleitung erfahrener Spielleute bei Tavernenauftritten'
    ],
    geselle: [
      'Vortrag fesselnder Lieder, Gedichte und Geschichten vor Publikum',
      'Meisterhaftes Spiel auf Laute, Flöte, Harfe oder Trommel',
      'Improvisation von Spott- und Lobliedern auf aktuelle Tagesereignisse',
      'Einstimmung des Publikums zur Steigerung von Feststimmung und Trinkfreude'
    ],
    spezialisierung: [
      'Magische Bardengesänge zur Inspiration von Verbündeten im Kampf',
      'Verzauberung von Zuhörern durch beruhigende, aufrührerische oder betörende Klänge',
      'Komposition zeitloser Epen für Königshöfe und Fürstenhochzeiten',
      'Verdeckte Nachrichtenübermittlung und Spionage im Gewand des Spielmanns'
    ],
    meister: [
      'Großbarde / Leiter der Bardenakademie / Skalde der Könige',
      'Erschaffung legendärer Melodien, die ganze Armeen ermutigen oder lähmen',
      'Ausbildung von Sängern, Dichtern und Instrumentalisten',
      'Bewahrung der Kulturgeschichte und des nationalen Mythenschatzes'
    ]
  },
  schauspieler: {
    lehrling: [
      'Kostüme, Masken, Requisiten und Bühnenbilder pflegen und transportieren',
      'Sprechübungen, Gestik und Mimik vor dem Spiegel trainieren',
      'Einstudieren von Nebenrollen und Soufflieren bei Proben',
      'Bühnenaufbau auf Marktplätzen und in Theatersälen unterstützen'
    ],
    geselle: [
      'Überzeugende Darstellung komplexer Haupt- und Charakterrollen',
      'Akzentfreie und weithin tragende Deklamation dramatischer Texte',
      'Spontane Improvisation bei Textausfällen oder Zwischenrufen',
      'Verwandlung durch Schminke, Perücken und Körperhaltung'
    ],
    spezialisierung: [
      'Meisterhafte Tragödie und Komödie vor anspruchsvollem Hofpublikum',
      'Täuschung im Alltag durch perfekte Mimikry fremder Persönlichkeiten',
      'Bühnenfechten und spektakuläre Stunts bei Theaterstücken',
      'Inszenierung und Regieführung von Theaterensembles'
    ],
    meister: [
      'Intendant des königlichen Hoftheaters / Theatergildenmeister',
      'Schreiben und Inszenieren monumentaler Theaterdramen',
      'Ausbildung und Förderung junger Schauspieltalente',
      'Kulturelle Repräsentation der Stadt bei Festspielen'
    ]
  },

  // ---------------------------------------------------------------------------
  // 15. RELIGION
  // ---------------------------------------------------------------------------
  priester: {
    lehrling: [
      'Altäre, Weihwasserbecken, Kerzen und Sakralgewänder reinigen',
      'Heilige Schriften, Liturgien und Gebete studieren und rezitieren',
      'Tempelbesucher empfangen, Spenden entgegennehmen und Opfergaben vorbereiten',
      'Dem Priester bei Gottesdiensten, Taufen und Totenfeiern assistieren'
    ],
    geselle: [
      'Feierliche Abhaltung täglicher Andachten, Messen und religiöser Feste',
      'Seelsorgerische Gespräche, Trostspende und Abnahme der Beichte',
      'Erteilung von Sakramenten (Taufen, Eheschließungen, Krankensalbungen)',
      'Betreuung der Armen, Kranken und Waisen in der Tempelgemeinde'
    ],
    spezialisierung: [
      'Kanalisierung göttlicher Segnungen und Gebetsmacht gegen Untote',
      'Durchführung von Exorzismen und Weihe geweihter Stätten',
      'Missionierung in entlegenen oder ungläubigen Regionen',
      'Theologische Gutachten zu Ketzerei, Wundern und Orakelsprüchen'
    ],
    meister: [
      'Hohepriester / Bischof / Patriarch der Glaubensgemeinschaft',
      'Geistliche Führung aller Tempel und Klöster einer Diözese',
      'Ausbildung und Weihe neuer Priester und Ordensbrüder',
      'Theologische Beratung des Monarchen und Hüter der Glaubenslehre'
    ]
  },

  // ---------------------------------------------------------------------------
  // 16. ABENTEUER
  // ---------------------------------------------------------------------------
  abenteurer: {
    lehrling: [
      'Reiserucksack, Seile, Fackeln, Rationen und Feldflaschen vorbereiten',
      'Lagerfeuer entfachen, Nachtwache halten und Ausrüstung instand halten',
      'Erkundung von sicheren Pfaden und Einprägen von Geländemarkierungen',
      'Einfache Fallen und Gefahren in Höhlen und Ruinen erkennen lernen'
    ],
    geselle: [
      'Erkundung unbekannter Verliese, alter Ruinen, Grüfte und Wildnisse',
      'Kampf gegen streunende Monster, Goblins, Banditen und Bestien',
      'Sichere Entschärfung einfacher Fallgruben, Stolperdrähte und Giftpfeile',
      'Bergung von Schätzen, Relikten und Erfüllung von Gildenaufträgen'
    ],
    spezialisierung: [
      'Dungeon-Infiltration: Überwindung tödlicher magischer Labyrinthe',
      'Monsterjäger: Gezielte Bekämpfung gigantischer Bestien und Drachen',
      'Reliktjagd: Bergung uralter Artefakte aus versunkenen Zivilisationen',
      'Überleben unter extremen Bedingungen (Wüsten, Eiswüsten, Unterreich)'
    ],
    meister: [
      'Legendenumwobener Held / Leiter der Abenteurergilde',
      'Führung heroischer Expeditionen zur Rettung von Königreichen',
      'Ausbildung und Ausrüstung junger Abenteurergruppen',
      'Eintragung in die Chroniken der Geschichte durch vollbrachte Großtaten'
    ]
  },
  monsterjaeger: {
    lehrling: [
      'Monsteranatomie-Bücher studieren und Schwachstellen lernen',
      'Armbrüste, Klingen, Silberwaffen und Monsterfallen reinigen und schärfen',
      'Öle, Gifte, Weihrauch und Blendgranaten nach Rezeptur vorbereiten',
      'Spuren von Klauen, Schleim und Bissspuren im Gelände identifizieren'
    ],
    geselle: [
      'Aufspüren und Stellen gefährlicher Bestien (Ghoule, Wölfe, Riesenspinnen)',
      'Präparation von Waffen mit passenden Ölen (Silber-, Geister-, Giftöle)',
      'Taktischer Ausweichkampf gegen Klauen, Reißzähne und Schwanzhiebe',
      'Bergung wertvoller Monstertrophäen (Giftbeutel, Schuppen, Zähne)'
    ],
    spezialisierung: [
      'Jagd auf fliegende Drachen, Lindwürmer, Vampire und Seuchenchimären',
      'Einsatz spezialisierter Ketten- und Harpunenfallen zur Bewegungsunfähigkeit',
      'Immunitätstraining gegen tierische und nekrotische Gifte',
      'Bekämpfung von Monsternest-Infestationen tief unter der Erde'
    ],
    meister: [
      'Großmeister des Monsterjägerordens und Bestienmeister',
      'Vernichtung uralter Kataklysmen-Ungeheuer und Dämonenfürsten',
      'Ausbildung elitärer Monsterjäger und Entwicklung geheimer Mutagene',
      'Verfassen des maßgeblichen Bestiariums für Gelehrte und Krieger'
    ]
  },
  schatzsucher: {
    lehrling: [
      'Spitzhacken, Schaufeln, Pinsel, Siebe und Lupen transportieren und säubern',
      'Alte Landkarten, Sagen und Schatzlegenden studieren und notieren',
      'Bodenproben nehmen und nach Edelmetallspuren ausschau halten',
      'Gefundene Münzen und Scherben vorsichtig reinigen und verpacken'
    ],
    geselle: [
      'Entzifferung alter Ruineninschriften und archaischer Kartensymbole',
      'Aufspüren verborgener Kammern, Hohlräume und Geheimtüren durch Klopfproben',
      'Sichere Bergung empfindlicher Grabbeigaben, Juwelen und Truhen',
      'Schätzung des historischen und materiellen Werts gefundener Artefakte'
    ],
    spezialisierung: [
      'Überwindung uralter Fluchmechanismen und magischer Siegel auf Schätzen',
      'Tiefseetauchen nach versunkenen Galeonenschätzen und Schiffswracks',
      'Navigation durch labyrinthische Pyramiden und Katakomben',
      'Restaurierung beschädigter historischer Wertgegenstände'
    ],
    meister: [
      'Berühmtester Schatzsucher des Zeitalters und Kurator legendärer Sammlungen',
      'Entdeckung vergessener Königreiche, Atlantis-Städte und Weltenwunder',
      'Finanzierung weltweiter Grabungsexpeditionen',
      'Ausbildung und Schutz von Archäologen- und Schatzsucherteams'
    ]
  },

  // ---------------------------------------------------------------------------
  // 17. ERWEITERTE HANDWERKE & URPRODUKTION
  // ---------------------------------------------------------------------------
  gaertner: {
    lehrling: [
      'Beete umgraben, Steine absammeln und Komposterde aufbereiten',
      'Gießkannen füllen, Setzlinge wässern und Unkraut jäten',
      'Gartengeräte, Scheren und Spaten säubern, schleifen und ölen',
      'Saatgut sortieren und Pflanzreihen nach Schnur anlegen'
    ],
    geselle: [
      'Anzucht und Pikieren von Gemüsepflanzen, Blumen und Ziersträuchern',
      'Formschnitt von Hecken, Buchsbäumen und Obstgehölzen',
      'Bodenverbesserung durch gezielten Einsatz von Humus und Nährstoffen',
      'Bekämpfung von Pflanzenschädlingen mit biologischen und handwerklichen Methoden'
    ],
    spezialisierung: [
      'Veredelung von Obstbäumen durch Okulation und Pfropfen',
      'Gestaltung kunstvoller Schloss- und Schaugärten mit Wasserspielen',
      'Kultivierung seltener Heilpflanzen, Orchideen und exotischer Gewächse',
      'Bau und Betreuung von Treibhäusern und Frühbeetanlagen'
    ],
    meister: [
      'Gartenarchitektur, Parkanlagenplanung und Gesamtdirektion',
      'Leitung königlicher Hofgärten und botanischer Pflanzensammlungen',
      'Ausbildung von Gärtnergesellen und Landschaftspflegern',
      'Züchtung neuer wetterbeständiger und ertragreicher Pflanzensorten'
    ]
  },
  imker: {
    lehrling: [
      'Bienenbeuten, Rähmchen und Einlötdrähte reinigen und zusammenbauen',
      'Mittelwände aus reinem Bienenwachs einlöten und vorbereiten',
      'Smoker (Imkerpfeife) mit trockenem Laub und Kräutern befeuern',
      'Trachtpflanzen in der Umgebung beobachten und Fluglöcher kontrollieren'
    ],
    geselle: [
      'Regelmäßige Durchsicht der Bienenvölker auf Brutgesundheit und Weiselzellen',
      'Schwarmverhinderung durch zeitiges Erweitern der Brut- und Honigräume',
      'Entnahme verdeckelter Honigwaben und Entdeckelung mit der Gabel',
      'Honigschleudern, Klären, Abschäumen und saubere Abfüllung in Gläser und Krüge'
    ],
    spezialisierung: [
      'Zucht sanftmütiger, ertragreicher und krankheitsresistenter Bienenköniginnen',
      'Gewinnung von reinem Gelée Royale, Propolis und hochwertigem Bienenwachs',
      'Brauen von sortenreinem Honigmet und feinstem Gewürzmet',
      'Wanderimkerei: Verlegung von Bienenstöcken in Wald-, Raps- und Heidegebiete'
    ],
    meister: [
      'Leitung des Zeidlerbundes und der städtischen Großimkerei',
      'Ausbildung diplomierter Imker und Vergabe des Zunfthonigsiegels',
      'Erhalt gesunder Bienenpopulationen in Zusammenarbeit mit Förstern und Bauern',
      'Gutachten bei Bienenkrankheiten und Schutz regionaler Trachtgebiete'
    ]
  },
  fischer: {
    lehrling: [
      'Fischernetze, Reusen und Angelgeschirr flicken und entwirren',
      'Bootsplanken schrubben, Bilgenwasser lenzen und Ruder fetten',
      'Köder fangen, Wurmeimer ansetzen und Futterstellen vorbereiten',
      'Fänge sortieren, entschuppen, ausnehmen und auf Eis oder Salz lagern'
    ],
    geselle: [
      'Sicheres Führen von Fischerkähnen auf Flüssen, Seen oder Küstengewässern',
      'Auswerfen und Einholen von Schlepp-, Stell- und Wurfnetzen',
      'Präzises Lesen von Strömungen, Untiefen und Fischschwarm-Bewegungen',
      'Räuchern von Forellen, Aalen und Lachsen im Räucherofen'
    ],
    spezialisierung: [
      'Hochseefischerei bei starkem Wellengang und stürmischer Witterung',
      'Anlage und Bewirtschaftung komplexer Teichwirtschaften und Zuchtbecken',
      'Harpunen- und Großfischfang in tiefen Gewässern',
      'Traditionelles Trocknen (Stockfisch) und Pökeln für Langzeitkonserven'
    ],
    meister: [
      'Fischereiaufseher und Zunftältester der Fischerinnung',
      'Festlegung von Schonzeiten, Fangquoten und Pachtabschnitten',
      'Ausbildung von Fischereigesellen und Bootsführern',
      'Schutz der Gewässerökologie und Verhandlung von Großlieferverträgen'
    ]
  },
  bergmann: {
    lehrling: [
      'Grubenlampen reinigen, mit Öl befüllen und Dochte nachziehen',
      'Schotter, Abraum und Gesteinsbrocken in Förderhunte schaufeln',
      'Schienen und Förderwege von Schlamm und Geröll freihalten',
      'Wetterführung und Frischluftzufuhr mit Handblasebälgen unterstützen'
    ],
    geselle: [
      'Hauen von Erz, Kohle und Gestein mit Schlägel und Eisen vor Ort',
      'Setzen von Holzstempeln und Kappen zur statischen Stollensicherung',
      'Erkennen von Grubengasen und Sauerstoffmangel anhand der Flammenhöhe',
      'Sicheres Schlagen von Bohrlöchern und Vorbereitung des Sprengvortriebs'
    ],
    spezialisierung: [
      'Stollenhauer für schwierige Quer- und Tiefschächte im Urgestein',
      'Sprengmeister: Präziser Einsatz von Schwarzpulverladungen unter Tage',
      'Aufspüren reichhaltiger Erz- und Mineraladern durch Gesteinsschichtung',
      'Grubenwehr: Rettung verschütteter Bergleute bei Stolleneinstürzen'
    ],
    meister: [
      'Obersteiger und Betriebsleiter des Bergwerks',
      'Risszeichnung und geodätische Vermessung neuer Grubenfelder',
      'Sicherheitsabnahme aller Förderschächte, Seilwinden und Wetterkanäle',
      'Repräsentation des Bergamts gegenüber Landesherren und Hüttenwerken'
    ]
  },
  weber: {
    lehrling: [
      'Kettfäden aufbäumen, Litzen einziehen und Weberschiffchen auffüllen',
      'Woll- und Flachsfasern kardieren, bürsten und entwirren',
      'Webstühle säubern, Hebel schmieren und Garnrollen sortieren',
      'Garnbrüche schnell verknüpfen und Weblade gleichmäßig anschlagen'
    ],
    geselle: [
      'Einrichten und Weben auf Tritt- und Schaftwebstühlen',
      'Herstellung feiner Leinen-, Woll- und Baumwollgewebe',
      'Einhaltung gleichmäßiger Webdichte und fehlerfreier Tuchkanten',
      'Walken, Waschen und Spannen fertiger Tuchbahnen auf dem Tuchrahmen'
    ],
    spezialisierung: [
      'Jacquard- und Damastweberei mit komplexen Wappen- und Blumenmustern',
      'Verwebung edler Seiden, Gold- und Silberfäden zu Brokatstoffen',
      'Färben von Garnen mit Naturfarbstoffen (Purpur, Indigo, Krapp)',
      'Herstellung dichter, wasserabweisender Loden- und Segeltuche'
    ],
    meister: [
      'Obermeister der Weberzunft und Tuchhallen-Inspektor',
      'Qualitätssiegelvergabe (Schauamt) für exportierte Tuchballen',
      'Ausbildung von Webergesellen und Musterzeichnern',
      'Großhandel mit Fernkaufleuten und Belieferung fürstlicher Schneidereien'
    ]
  },
  gerber: {
    lehrling: [
      'Rohfelle in Äschergruben mit Kalkmilch wässern und umrühren',
      'Enthaaren und Reinigen der Tierhäute auf dem Schabebaum mit dem Schabeisen',
      'Lohbrühe aus Eichen- und Fichtenrinde ansetzen und kochen',
      'Gerbgruben ausschaufeln und Gerbrinde nachschichten'
    ],
    geselle: [
      'Durchführung der Rot- und Weißgerbung über mehrere Monate',
      'Entfleischen, Spalten und Falzen der Lederhäute auf gleichmäßige Dicke',
      'Walken, Fetten und Dehnen des Leders für optimale Geschmeidigkeit',
      'Glätten, Zurichten und Färben der Lederoberfläche'
    ],
    spezialisierung: [
      'Feingerbung von Saffian-, Corduan- und sämischgegerbtem Hirschleder',
      'Herstellung extrem belastbaren Sohlenleders für Stiefelmacher und Harnische',
      'Prägung von Zierledern mit Punzen und Goldauflagen für Bucheinbände',
      'Wasserfeste Imprägnierung von Leder für Reiter, Schiffer und Krieger'
    ],
    meister: [
      'Zunftmeister der Gerberinnung und Leiter der Gerbereimanufaktur',
      'Qualitätsprüfung aller Lederchargen nach Zunftvorschriften',
      'Ausbildung von Gerbergesellen und Lohmüllern',
      'Einkauf von Rohhäuten auf Viehmärkten und Rindenkontrakte mit Forstämtern'
    ]
  },
  steinmetz: {
    lehrling: [
      'Meißel, Klöpfel, Richtscheite und Schablonen schärfen und bereitlegen',
      'Rohblöcke aus Sandstein, Kalkstein und Granit reinigen und anreißen',
      'Steinstaub abkehren, Hebebäume und Flaschenzüge sichern',
      'Einfache Bruchsteinquader rechtwinklig bossieren und behauen'
    ],
    geselle: [
      'Präzises Behauen von Werksteinen, Gesimsen, Fenstergewänden und Torbögen',
      'Ausarbeiten von Profilen, Hohlkehlen und Wassernasen nach Aufriss',
      'Versetzen von Werksteinen am Bauwerk mit Zement- und Kalkmörtel',
      'Verdübelung und Verbleiung tragender Steinelemente'
    ],
    spezialisierung: [
      'Schlagen filigraner gotischer Maßwerke, Fialen, Kreuzblumen und Wasserspeier',
      'Bildhauerische Porträts, Statuen und Reliefs für Kathedralen und Paläste',
      'Schadensanalyse und schonende Restaurierung historischer Steinmonumente',
      'Berechnung und Konstruktion komplizierter Steinschnittgewölbe'
    ],
    meister: [
      'Bauhüttenmeister / Dombaumeister und Hüter der Steinmetz-Geheimnisse',
      'Gesamtentwurf sakraler und monumentaler Steinarchitektur',
      'Verleihung des persönlichen Steinmetzzeichens an fertige Gesellen',
      'Auswahl bester Steinbrüche und Begutachtung der Gesteinsfestigkeit'
    ]
  },
  schiffbauer: {
    lehrling: [
      'Werfthalle sauber halten, Hobelspäne räumen und Pechkessel beheizen',
      'Holzbohlen, Spanten und Kniehölzer nach Schablone zuschneiden helfen',
      'Werg und Teer zum Kalfatern vorbereiten und Eisenbolzen schmieden',
      'Hellingbalken fetten und Stapellaufbahnen vorbereiten'
    ],
    geselle: [
      'Dämpfen und Biegen dicker Eichenbohlen für die Rumpfbeplankung',
      'Präzises Einpassen von Kiel, Vorsteven, Achtersteven und Spanten',
      'Kalfatern der Rumpfnähte mit Werg und heißem Holzteer zur Wasserdichtigkeit',
      'Einbau von Decksbalken, Mastspuren, Ruderanlagen und Schotten'
    ],
    spezialisierung: [
      'Konstruktion hochseetauglicher Karavellen, Galeonen und Kriegskoggen',
      'Hydrodynamische Rumpfformoptimierung für maximale Geschwindigkeit und Stabilität',
      'Einbau schwerer Geschützpforten und gepanzerter Steven für Kriegsschiffe',
      'Reparatur und Trockendock-Instandsetzung schwer beschädigter Schiffsrümpfe'
    ],
    meister: [
      'Oberwerftmeister und Chefkonstrukteur der Admiralität',
      'Entwurf kompletter Flottenbauprogramme und Risszeichnungen',
      'Ausbildung und Prüfung von Schiffszimmerern und Takelern',
      'Abnahme von Hochseeschiffen und Leitung des feierlichen Stapellaufs'
    ]
  },
  uhrmacher: {
    lehrling: [
      'Uhrmacherlupen, Pinzetten, Feilen und Stichel reinigen und ordnen',
      'Messingplatinen reinigen, polieren und Bohrungen entgraten',
      'Uhrenöle nach Viskosität abfüllen und Reinigungsbäder ansetzen',
      'Einfache Zahnräder entgraten und Zapfen vorpolieren'
    ],
    geselle: [
      'Zerlegen, Reinigen, Ölen und Justieren mechanischer Räderuhren',
      'Einpassen von Zahnrädern, Trieben, Hemmungen und Pendeln',
      'Präzises Richten verbogener Zähne und Ersetzen gebrochener Zapfen',
      'Feinregulierung der Ganggenauigkeit über Unruh und Spiralfeder'
    ],
    spezialisierung: [
      'Konstruktion astronomischer Uhren mit Mondphasen und Tierkreiszeichen',
      'Entwicklung von Schlagwerken (Repetitionen, Glockenspiele, Carillons)',
      'Bau hochpräziser Marinechronometer für die Hochseenavigation',
      'Mikromechanische Fertigung von Tourbillons und ewigen Kalendern'
    ],
    meister: [
      'Hofuhrmacher des Landesherrn und Großmeister der Uhrmacherinnung',
      'Konstruktion monumentaler Turmuhren für Ratshäuser und Kathedralen',
      'Ausbildung von Uhrmachergesellen und Feinmechanikern',
      'Verfassen von Abhandlungen über Chronometrie und mikromechanische Präzision'
    ]
  },
  glasblaser: {
    lehrling: [
      'Glasgemenge (Quarzsand, Pottasche, Kalk) nach Rezeptur mischen',
      'Glasschmelzofen auf konstanter Weißglut halten und Asche ziehen',
      'Glasmacherpfeifen, Wulgerlöffel und Zangen reinigen und kühlen',
      'Kühlofen bestücken und fertige Werkstücke langsam heruntertemperieren'
    ],
    geselle: [
      'Aufnehmen flüssigen Glases mit der Pfeife und Vorblasen des Külbels',
      'Formen von Trinkbechern, Flaschen, Laborgefäßen und Fensterscheiben',
      'Aufschmelzen von Henkeln, Füßen, Noppen und Fadenverzierungen',
      'Zuschneiden und Brechen von Flachglas für Bleiverglasungen'
    ],
    spezialisierung: [
      'Fertigung hauchdünner venezianischer Kristallkelche und Fadengläser (Filigrana)',
      'Herstellung farbiger Buntglasfenster mit Schwarzlotbemalung für Kathedralen',
      'Blasen optischer Linsen, Prismen und alchemistischer Spezialdestillierkolben',
      'Glaskunstskulpturen und farbenprächtige Mosaikgläser'
    ],
    meister: [
      'Hüttenmeister der Glashütte und Zunftvorsitzender',
      'Geheimhaltung und Entwicklung neuer Glasfarbrezepturen (z.B. Rubinglas)',
      'Ausbildung und Abnahme des Glasmacher-Meisterstücks',
      'Großaufträge für Palastverglasungen, Kirchenfenster und Hofservice'
    ]
  },
  seifensieder: {
    lehrling: [
      'Tierische und pflanzliche Fette schmelzen, klären und filtrieren',
      'Pottasche- und Holzaschenlauge ansetzen und Dichte mit der Spindel messen',
      'Siedekessel anheizen, Rührhölzer führen und Schaum abschlagen',
      'Seifenblöcke aus den Kühlformen stürzen und Roste reinigen'
    ],
    geselle: [
      'Führung des Verseifungsprozesses bis zum perfekten Seifenleim',
      'Aussaizen von Kernseife mit Kochsalz und Abtrennung der Unterlauge',
      'Schneiden, Stempeln und Trocknen von Haushalts- und Textilseifen',
      'Herstellung weicher Schmierseifen für Gerbereien und Tuchmacher'
    ],
    spezialisierung: [
      'Kreation parfümierter Toilettenseifen mit Mandelöl, Rosenwasser und Lavendel',
      'Destillation ätherischer Öle und Duftessenzen im Kupferkessel',
      'Medizinische Schwefel-, Teer- und Kräuterseifen für Hospitäler',
      'Herstellung feiner Pomaden, Rasierseifen und Cremes für den Adel'
    ],
    meister: [
      'Zunftmeister der Seifensieder und Hofparfümeur',
      'Entwicklung exklusiver Duftlinien und Seifenrezepturen für Fürstenhäuser',
      'Ausbildung des Sieder- und Parfümeurnachwuchses',
      'Rohstoffeinkauf von Olivenölen, Talg und orientalischen Duftölen'
    ]
  },
  stallmeister: {
    lehrling: [
      'Pferdeboxen ausmisten, frisches Stroh einstreuen und Tränken scheuern',
      'Futter rationieren (Hafer, Heu, Karotten) und Mineralsteine bereitstellen',
      'Pferde putzen, striegeln, Mähnen kämmen und Hufe auskratzen',
      'Sättel, Zaumzeug und Pferdedecken säubern, fetten und lagern'
    ],
    geselle: [
      'Fachgerechtes Aufzäumen, Satteln und Vorbereiten von Reit- und Kutschpferden',
      'Longieren und Basistraining junger Pferde zur Grundausbildung',
      'Erkennung früher Krankheitssymptome, Koliken, Hufprobleme und Erstversorgung',
      'Begleitung von Ausritten und Betreuung der Reitschüler'
    ],
    spezialisierung: [
      'Hohe Schule der Dressur, Springausbildung und Turniervorbereitung',
      'Korrektur schwieriger, scheuender oder traumatisierter Pferde',
      'Ausbildung von Schlachtrössern und Turnierpferden gegen Lärm und Lanzen',
      'Führung von Zuchtstammbüchern, Fohlenaufzucht und Deckstation'
    ],
    meister: [
      'Oberstallmeister des königlichen Hofgestüts / Gestütsdirektor',
      'Zuchtprogrammplanung zur Veredelung edler Pferderassen (z.B. Rappen, Vollblüter)',
      'Ausbildung von Reitlehrern, Bereitern und Hufschmieden',
      'Repräsentation des Gestüts bei fürstlichen Paraden, Parforcejagden und Turnieren'
    ]
  }
};

/**
 * Normalisiert einen Berufsnamen für den Aufgabenabgleich.
 * Liefert den passenden Match-Key oder null für generischen Fallback.
 */
function normalizeJobKey(jobName: string): string | null {
  if (!jobName) return null;
  const clean = jobName.toLowerCase().trim().replace(/[^a-z0-9äöüß]/g, '');

  // 1. Lebensmittel & Winzer & Brauer & Gastro
  if (clean.includes('winz') || clean.includes('wein') || clean.includes('kelter') || clean.includes('kellerm') || clean.includes('reben') || clean.includes('oenolog')) return 'winzer';
  if (clean.includes('brau') || clean.includes('bier') || clean.includes('brenn') || clean.includes('mälz')) return 'brauer';
  if (clean.includes('koch') || clean.includes('küche') || clean.includes('brauhauskoch') || clean.includes('küchenchef')) return 'koch';
  if (clean.includes('bäck') || clean.includes('back') || clean.includes('brot')) return 'baecker';
  if (clean.includes('konditor') || clean.includes('patissier') || clean.includes('zuckerbäcker') || clean.includes('confiseur')) return 'konditor';
  if (clean.includes('metzg') || clean.includes('fleisch') || clean.includes('schlachter') || clean.includes('wurst')) return 'metzger';
  if (clean.includes('wirt') || clean.includes('schank') || clean.includes('taverne') || clean.includes('gastwirt') || clean.includes('herberg')) return 'wirt';
  if (clean.includes('kelln') || clean.includes('bedien') || clean.includes('schankbursch') || clean.includes('service')) return 'kellner';

  // 2. Bau & Holz & Stein
  if (clean.includes('schrein') || clean.includes('tischl') || clean.includes('möbel')) return 'schreiner';
  if (clean.includes('zimm') || clean.includes('holzbau') || clean.includes('dachstuhl')) return 'zimmerer';
  if (clean.includes('steinmetz') || clean.includes('bildhau') || clean.includes('steinbild')) return 'steinmetz';
  if (clean.includes('maur') || clean.includes('putzer') || clean.includes('bauhand')) return 'maurer';
  if (clean.includes('schiffbau') || clean.includes('bootsbau') || clean.includes('werft') || clean.includes('reeder')) return 'schiffbauer';

  // 3. Textil & Leder & Seife & Feinhandwerk
  if (clean.includes('schneid') || clean.includes('gewand') || clean.includes('tuchmacher')) return 'schneider';
  if (clean.includes('web') || clean.includes('spinn') || clean.includes('kürschn')) return 'weber';
  if (clean.includes('gerb') || clean.includes('leder') || clean.includes('fell')) return 'gerber';
  if (clean.includes('uhrmach') || clean.includes('feinmechan') || clean.includes('chronometer')) return 'uhrmacher';
  if (clean.includes('glasblas') || clean.includes('glashütt') || clean.includes('glaser') || clean.includes('glas')) return 'glasblaser';
  if (clean.includes('seif') || clean.includes('parfüm') || clean.includes('parfum') || clean.includes('sieder')) return 'seifensieder';

  // 4. Metall & Schmiede
  if (clean.includes('waffenschmied') || clean.includes('klingenschmied')) return 'waffenschmied';
  if (clean.includes('rüst') || clean.includes('plattner') || clean.includes('harnisch')) return 'ruestungsschmied';
  if (clean.includes('goldschmied') || clean.includes('silberschmied') || clean.includes('juwelier')) return 'goldschmied';
  if (clean.includes('schmied') || clean.includes('schloss') || clean.includes('giesser') || clean.includes('guss')) return 'schmied';

  // 5. Natur, Tiere & Landwirtschaft
  if (clean.includes('gärtn') || clean.includes('garten') || clean.includes('botan') || clean.includes('florist') || clean.includes('pflanz')) return 'gaertner';
  if (clean.includes('imk') || clean.includes('bien') || clean.includes('zeidl')) return 'imker';
  if (clean.includes('fisch') || clean.includes('angler') || clean.includes('netz')) return 'fischer';
  if (clean.includes('stall') || clean.includes('reitlehr') || clean.includes('gestüt') || clean.includes('reit')) return 'stallmeister';
  if (clean.includes('bau') || clean.includes('landwirt') || clean.includes('acker') || clean.includes('vieh') || clean.includes('hirte') || clean.includes('schäf')) return 'bauer';
  if (clean.includes('jäg') || clean.includes('wild') || clean.includes('falkn') || clean.includes('forst')) return 'jaeger';
  if (clean.includes('kraut') || clean.includes('kräut') || clean.includes('herbal') || clean.includes('apothek')) return 'kraeuterkundiger';

  // 6. Bergbau
  if (clean.includes('berg') || clean.includes('hauer') || clean.includes('knapp') || clean.includes('stollen') || clean.includes('zeche') || clean.includes('erz')) return 'bergmann';

  // 7. Medizin & Heilung
  if (clean.includes('arzt') || clean.includes('medicus') || clean.includes('chirurg') || clean.includes('doktor')) return 'arzt';
  if (clean.includes('heil') || clean.includes('sanitäter') || clean.includes('genes')) return 'heiler';

  // 8. Wissenschaft & Magie
  if (clean.includes('forsch') || clean.includes('gelehrt') || clean.includes('wissensch') || clean.includes('astronom')) return 'forscher';
  if (clean.includes('alchem') || clean.includes('trank') || clean.includes('elixier')) return 'alchemist';
  if (clean.includes('magi') || clean.includes('zaub') || clean.includes('arkan') || clean.includes('hex')) return 'magier';

  // 9. Handel & Dienstleistung & Verwaltung
  if (clean.includes('kauf') || clean.includes('händl') || clean.includes('handl') || clean.includes('kräm')) return 'kaufmann';
  if (clean.includes('kutsch') || clean.includes('fuhr') || clean.includes('wagen')) return 'kutscher';
  if (clean.includes('butler') || clean.includes('diener') || clean.includes('hausd') || clean.includes('magd') || clean.includes('zofe')) return 'butler';
  if (clean.includes('schreib') || clean.includes('kanzl') || clean.includes('skript') || clean.includes('notar') || clean.includes('beam')) return 'schreiber';
  if (clean.includes('richt') || clean.includes('jurist') || clean.includes('advokat') || clean.includes('vogt')) return 'richter';

  // 10. Militär, Schutz & Seefahrt
  if (clean.includes('soldat') || clean.includes('krieg') || clean.includes('reiter') || clean.includes('gard') || clean.includes('ritter')) return 'soldat';
  if (clean.includes('wach') || clean.includes('torw') || clean.includes('nachtw') || clean.includes('patrouill')) return 'wachmann';
  if (clean.includes('matros') || clean.includes('seemann') || clean.includes('schiff') || clean.includes('steuermann') || clean.includes('bootsmann')) return 'matrose';

  // 11. Schattenberufe & Unterhaltung & Religion
  if (clean.includes('dieb') || clean.includes('taschendieb') || clean.includes('einbrech') || clean.includes('räub') || clean.includes('bandit')) return 'dieb';
  if (clean.includes('schmugg') || clean.includes('hehler') || clean.includes('schatten')) return 'schmuggler';
  if (clean.includes('bard') || clean.includes('minstrel') || clean.includes('säng') || clean.includes('musik')) return 'barde';
  if (clean.includes('schauspiel') || clean.includes('mime') || clean.includes('akrobat') || clean.includes('tänz')) return 'schauspieler';
  if (clean.includes('priest') || clean.includes('mönch') || clean.includes('klerik') || clean.includes('orden')) return 'priester';

  // 12. Abenteuer & Expedition
  if (clean.includes('monster') || clean.includes('bestie')) return 'monsterjaeger';
  if (clean.includes('schatz') || clean.includes('ruinen') || clean.includes('archäo')) return 'schatzsucher';
  if (clean.includes('abenteu') || clean.includes('kundsch') || clean.includes('entdeck') || clean.includes('wander')) return 'abenteurer';

  return null;
}

/**
 * Fallback-Aufgaben für benutzerdefinierte oder noch nicht spezifisch erfasste Berufe.
 */
function getGenericDutiesForJob(jobName: string, tierKey: 'lehrling' | 'geselle' | 'spezialisierung' | 'meister'): string[] {
  const clean = jobName.trim() || 'Fachkraft';
  switch (tierKey) {
    case 'lehrling':
      return [
        `Arbeitsbereich, Instrumente und Werkzeuge vorbereiten und reinigen (${clean})`,
        `Materialkunde, Sicherheitsvorschriften und fachliche Grundlagen erlernen`,
        `Einfache Grundaufgaben und gewissenhafte Zuarbeit für erfahrene Kollegen`,
        `Ordnung, Sauberkeit und Materiallager sorgfältig verwalten`
      ];
    case 'geselle':
      return [
        `Selbstständige und termingerechte Ausführung aller Standardaufgaben als ${clean}`,
        `Fachgerechte Qualitätsprüfung und Behebung von Fehlern im Arbeitsablauf`,
        `Kunden-, Klienten- oder Auftraggeberbetreuung nach fachlichen Standards`,
        `Anleitung und Unterstützung von Lehrlingen und Hilfskräften`
      ];
    case 'spezialisierung':
      return [
        `Bearbeitung anspruchsvoller Spezialaufträge und vertiefter Aufgaben als ${clean}`,
        `Anwendung seltener Fachtechniken und anspruchsvoller Sonderverfahren`,
        `Koordination von Teilprojekten und fachliche Beratung der Leitung`,
        `Optimierung von Arbeitsabläufen und Einführung von Qualitätsverbesserungen`
      ];
    case 'meister':
      return [
        `Gesamtleitung, strategische Planung und Qualitätsstandards für ${clean}`,
        `Ausbildung, Prüfung und Freisprechung des beruflichen Nachwuchses`,
        `Repräsentation des Berufsstandes gegenüber Institutionen und Auftraggebern`,
        `Kalkulation und meisterhafte Leitung herausragender Großprojekte`
      ];
  }
}

/**
 * Liefert individuelle Aufgaben & Pflichten für einen beliebigen Beruf und Rang/Stufe.
 */
export function getDetailedDutiesForJobAndTier(
  jobName: string,
  tier: 'einstieg' | 'beruf' | 'spezialisierung' | 'meister' | number | string
): string[] {
  let tierKey: 'lehrling' | 'geselle' | 'spezialisierung' | 'meister' = 'geselle';

  if (tier === 0 || tier === 'einstieg' || tier === 'lehrling' || (typeof tier === 'string' && /anwärter|lehrling|gehilfe|anfänger|neuling|einstieg|junge/i.test(tier))) {
    tierKey = 'lehrling';
  } else if (tier === 1 || tier === 'beruf' || tier === 'geselle' || (typeof tier === 'string' && /geselle|fachkraft|grundstufe/i.test(tier))) {
    tierKey = 'geselle';
  } else if (tier === 2 || tier === 'spezialisierung' || (typeof tier === 'string' && /spezial|expert|vertief|kellermeister|meisterhaft/i.test(tier))) {
    tierKey = 'spezialisierung';
  } else if (tier === 3 || tier === 'meister' || (typeof tier === 'string' && /meister|großmeister|koryphäe|leiter|direktor/i.test(tier))) {
    tierKey = 'meister';
  }

  const normKey = normalizeJobKey(jobName);
  if (normKey && DETAILED_PROFESSION_DUTIES[normKey]) {
    const dutySet = DETAILED_PROFESSION_DUTIES[normKey];
    if (dutySet[tierKey] && dutySet[tierKey].length > 0) {
      return dutySet[tierKey];
    }
  }

  return getGenericDutiesForJob(jobName, tierKey);
}
