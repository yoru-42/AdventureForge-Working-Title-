// ============================================================================
// ADVENTUREFORGE BERUFS-FACHKOMPETENZEN NACH STUFEN - TEIL 1
// 1. Lebensmittel & Versorgung
// 2. Bau & Handwerk
// 3. Metall & Feinhandwerk
// 4. Natur & Landwirtschaft
// ============================================================================

export interface JobTierCompetencySet {
  lehrling: string[];
  geselle: string[];
  spezialisierung: string[];
  meister: string[];
}

export const PART1_COMPETENCIES: Record<string, JobTierCompetencySet> = {
  // --------------------------------------------------------------------------
  // 1. LEBENSMITTEL & VERSORGUNG (lebensmittel_versorgung)
  // --------------------------------------------------------------------------
  koch: {
    lehrling: ['Küchenhygiene & Arbeitsplatzvorbereitung', 'Messerführung & Schnitttechniken', 'Zutaten wiegen & parieren', 'Grundbrühen & Fonds ansetzen'],
    geselle: ['Garpunktbestimmung & Hitzezufuhr', 'Saucenbindung & Reduktionen', 'Menüabfolge & Zeitmanagement', 'Fleisch- & Fischzubereitung'],
    spezialisierung: ['Saucier-Feinabstimmung', 'Bankett- & Festmahlorganisation', 'Exotische Gewürzkunde', 'Schon- & Niedrigtemperaturgaren'],
    meister: ['Küchenmeisterliche Kreation', 'Gesamtküchenleitung & Kalkulation', 'Lehrlingsausbildung Gastronomie', 'Hof- & Gourmetmenüführung']
  },
  kuechenhilfe: {
    lehrling: ['Geschirreinigung & Entsorgung', 'Gemüse schälen & putzen', 'Lagerordnung & Vorratskontrolle', 'Sicherheitsregeln Küchenbereich'],
    geselle: ['Mise en Place selbstständig vorbereiten', 'Schnelles Zuarbeiten am Posten', 'Einfache Beilagenzubereitung', 'Kühl- & Trockenlagerhygiene'],
    spezialisierung: ['Postenvorbereitung Großküche', 'Kühlkettenüberwachung', 'Unterstützung am Grill- & Bratposten', 'Materialwirtschaft & Ausgabe'],
    meister: ['Oberküchenhilfe & Schichtleitung', 'Arbeitszeit- & Hygieneaufsicht', 'Anleitung von Hilfskräften', 'Effiziente Spül- & Vorbereitungssysteme']
  },
  baecker: {
    lehrling: ['Mehlsorten & Schüttflüssigkeiten', 'Teigkneten von Hand & Trog', 'Backofen heizen & Asche austragen', 'Backbleche & Formen vorbereiten'],
    geselle: ['Sauerteigführung & Gärzeiten', 'Brotformen & Teigwirken', 'Ofentemperaturen & Schwaden', 'Kleingebäck & Zopfbacken'],
    spezialisierung: ['Langzeitgärung & Urgetreide', 'Krusten- & Aromaperfektion', 'Diät- & Spezialbrote', 'Holzofen- & Steinbacktechnik'],
    meister: ['Backstubenleitung & Rezepturhoheit', 'Zunftmeisterliche Backkunst', 'Ausbildung im Bäckerhandwerk', 'Wirtschaftliche Mehl- & Ofenführung']
  },
  konditor: {
    lehrling: ['Teige & Massen anrühren', 'Spritzbeutelführung Grundlagen', 'Früchte vorbereiten & gelieren', 'Formen ausfetten & blindbacken'],
    geselle: ['Biskuit- & Mürbeteigperfektion', 'Cremes, Ganache & Mousse', 'Torten füllen & eindecken', 'Pralinenhohlkörper gießen'],
    spezialisierung: ['Zuckerziehen & Karamellskulpturen', 'Marzipanmodellierung', 'Schokoladentemperierung & Dekor', 'Mehrstöckige Prunktorten'],
    meister: ['Confiserie-Meisterstück', 'Feinste Patisserie-Kreation', 'Konditoreileitung & Rezepturdesign', 'Schaustückgestaltung für Hoftafeln']
  },
  metzger: {
    lehrling: ['Schärfen von Ausbeintern & Spaltern', 'Arbeitssicherheit & Kühlung', 'Fleischzerlegung Grundlagen', 'Darm- & Pökelvorbereitung'],
    geselle: ['Fachgerechtes Ausbeinen & Zuschnitt', 'Wurstbrät herstellen & würzen', 'Pökeln & Räuchern', 'Fleischqualitätsprüfung'],
    spezialisierung: ['Reifetechniken & Dry Aging', 'Spezialwurstwaren & Schinkenreifung', 'Wildzerlegung & Jagdverarbeitung', 'Wursthüllen- & Füllmeisterei'],
    meister: ['Schlachthof- & Fleischereileitung', 'Wurstmeisterliche Gewürzrezeptur', 'Veterinär- & Hygieneaufsicht', 'Zunftprüfung & Meisterausbildung']
  },
  fischverarbeiter: {
    lehrling: ['Fischarten erkennen', 'Schuppen, Ausnehmen & Waschen', 'Eislagerung & Frischetest', 'Klingenpflege für Filiermesser'],
    geselle: ['Präzises Filetieren & Entgräten', 'Salzen & Heißräuchern', 'Marinieren & Kaltrauchverfahren', 'Fischkonservierung in Fässern'],
    spezialisierung: ['Kalt- & Edelfischräucherei', 'Kaviar- & Rogenverarbeitung', 'Trockenfisch- & Stockfischherstellung', 'Präparation giftiger/spezieller Fischarten'],
    meister: ['Fischereibetriebsleitung', 'Export- & Konservierungsgroßbetrieb', 'Auktionsbewertung & Frischegarantie', 'Meisterliche Räucherrezepturen']
  },
  brauer: {
    lehrling: ['Braukessel säubern & entkalken', 'Malz schroten & einmaischen', 'Hopfengaben abwiegen', 'Gärbottiche desinfizieren'],
    geselle: ['Maischführung & Rastzeiten', 'Würzekochen & Hopfenauskochen', 'Hefeführung & Gärkontrolle', 'Fassabfüllung & Spundung'],
    spezialisierung: ['Starkbier- & Bockbiersud', 'Spontangärung & Eichenfassreifung', 'Kräuter- & Spezialbiere', 'Aroma-Hopfung & Kaltgärung'],
    meister: ['Braumeisterliche Sudhausleitung', 'Rezepturkreation & Reinheitsüberwachung', 'Hefe-Reinzucht & Qualitätslabor', 'Brauzunftführung & Schankverträge']
  },
  brenner: {
    lehrling: ['Maische ansetzen & rühren', 'Brennblase abdichten & reinigen', 'Kühlwasserfluss kontrollieren', 'Alkoholmessspindel ablesen'],
    geselle: ['Vorlauf-, Mittel- & Nachlauftrennung', 'Feinbrandführung & Siedepunkte', 'Frucht- & Getreidemaischen', 'Lagerung in Steingut & Holz'],
    spezialisierung: ['Kräutergeister & Destillate', 'Fassreifung & Holztannin-Steuerung', 'Hochprozentige Brandweine', 'Geheime Destillierverfahren'],
    meister: ['Brennereimeisterschaft', 'Likör- & Spirituosenkomposition', 'Zoll- & Steuerabgabe-Kontrolle', 'Destillierkunst für Arznei & Genuss']
  },
  mueller: {
    lehrling: ['Kornsäcke tragen & lagern', 'Mahlsteine säubern', 'Siebe & Beutelwerke warten', 'Feuchtigkeit des Getreides prüfen'],
    geselle: ['Mahlgang einstellen & Schrotfeinheit', 'Wasserrad- / Windmühlenantrieb steuern', 'Aussieben von Mehl, Grieß & Kleie', 'Silo- & Vorratsschutz'],
    spezialisierung: ['Mahlsteinschärfen (Billeisen)', 'Wasserbau & Wehranlagensteuerung', 'Feinstmehl- & Spezialschrotung', 'Ölmüllerei & Pressverfahren'],
    meister: ['Mühlenbau & Triebwerksleitung', 'Handelsverträge mit Bäckern & Städten', 'Mühlenrechtsverwaltung', 'Lehrlingsausbildung Müllereiwesen']
  },
  wirt: {
    lehrling: ['Gastraum lüften & säubern', 'Fässer anstechen & Leitungen spülen', 'Gläser & Krüge pflegen', 'Gäste empfangen & platzieren'],
    geselle: ['Getränkeausschank & Kassieren', 'Konfliktvermeidung & Zechordnung', 'Zimmervergabe & Gästebuchführung', 'Einkauf von Vorräten & Schankware'],
    spezialisierung: ['Großveranstaltungen & Feste', 'Handelsreisenden-Betreuung', 'Lokales Informationsnetzwerk', 'Schankrechts- & Zunftdiplomatie'],
    meister: ['Gasthof- & Herbergsdirektion', 'Gelage- & Bankettorganisation', 'Schanklizenz- & Gewerbeführung', 'Traditionsgastronomie & Repräsentation']
  },
  gastwirt: {
    lehrling: ['Gästezimmer herrichten', 'Kaminholz & Beleuchtung sichern', 'Gepäckannahme & Stallzuweisung', 'Rechnungszettel führen'],
    geselle: ['Gästeunterbringung & Verköstigung', 'Pferdeversorgung koordinieren', 'Warenwirtschaft & Kellervorräte', 'Umgang mit schwierigen Gästen'],
    spezialisierung: ['Edelherbergen-Komfort', 'Sicherheitslogistik für Kaufleute', 'Reisegruppen- & Botenversorgung', 'Gourmet-Verpflegung für Reisende'],
    meister: ['Leitung renommierter Gasthöfe', 'Stadtrat- & Handelskontakte', 'Verwaltung von Schank- & Beherbergungsprivilegien', 'Ausbildung im Gastgewerbe']
  },
  schankwirt: {
    lehrling: ['Zapfhähne reinigen', 'Humpen spülen & trocknen', 'Bierfässer rollen & lagern', 'Schanktheke sauber halten'],
    geselle: ['Schneller Ausschank zu Stoßzeiten', 'Schaumkrone & Temperaturkontrolle', 'Abrechnung & Falschgeldprüfung', 'Deeskalation bei Raufereien'],
    spezialisierung: ['Mischgetränke & Gewürzweine', 'Met- & Schnapsspezialitäten', 'Umsatzstarke Thekenorganisation', 'Stammkundenpflege & Tavernenklima'],
    meister: ['Schankbetriebsleitung & Pachtführung', 'Lieferantenverträge mit Brauereien', 'Sicherheitskonzepte für Tavernen', 'Ausbildung Schankpersonal']
  },
  kellner: {
    lehrling: ['Tablett tragen & Balance', 'Besteck & Gedecke eindecken', 'Speisekarte auswendig lernen', 'Freundlicher Gästekontakt'],
    geselle: ['Mehrere Teller servieren', 'Bestellungsaufnahme ohne Fehler', 'Schnelle Tischabrechnung', 'Getränkeempfehlungen aussprechen'],
    spezialisierung: ['Flambieren & Tranchieren am Tisch', 'Weinservice & Glasauswahl', 'VIP- & Adelsbedienung', 'Bankett-Servicedirigieren'],
    meister: ['Oberkellner & Serviceleitung', 'Personaleinsatzplanung Gastraum', 'Schulung von Servicekräften', 'Perfektes Protokoll bei Staatsbanketten']
  },
  tavernenkoch: {
    lehrling: ['Eintopfkessel befeuern', 'Fleischknochen auskochen', 'Gemüse grob schneiden', 'Brotlaibe portionieren'],
    geselle: ['Rustikale Schmorgerichte zubereiten', 'Schnelles Kochen bei Hochbetrieb', 'Bratenspeisen & Pfannengerichte', 'Reste- & Vorratsverwertung'],
    spezialisierung: ['Reiseproviant & Räucherwaren', 'Würzige Tavernenklassiker', 'Schnellverpflegung für Karawanen', 'Spezialitäten des Hauses'],
    meister: ['Küchenleitung beliebter Tavernen', 'Kalkulation deftiger Massenverpflegung', 'Rezepturgestaltung für Reisende', 'Effizienz & Wirtschaftlichkeit']
  },
  hofkoch: {
    lehrling: ['Strenge Hofetikette & Sauberkeit', 'Feines Zuarbeiten für Hofgerichte', 'Silbergeschirr vorbereiten', 'Präzises Einhalten von Rezepten'],
    geselle: ['Zubereitung von Hofspeisen', 'Geflügel- & Wildgeflügelperfektion', 'Süßspeisen & Pasteten für die Tafel', 'Strenge Geschmackskontrolle'],
    spezialisierung: ['Schaugerichte & essbare Wappen', 'Historische & exotische Hofmenüs', 'Spezialdiäten für Herrscher', 'Silberhauben- & Bankettservice'],
    meister: ['Hofküchenmeister & Zeremoniendinner', 'Verwaltung des herrschaftlichen Speiseetats', 'Leitung der königlichen Hofköche', 'Kulinarische Repräsentation der Krone']
  },
  kaeser: {
    lehrling: ['Milchkübel reinigen & sterilisieren', 'Milchtemperatur prüfen', 'Lab dosieren & einrühren', 'Käsetücher waschen & spannen'],
    geselle: ['Käsebruch schneiden & wärmen', 'Formen füllen & auspressen', 'Salzbadführung & Salzaufnahme', 'Käselaibe wenden & bürsten'],
    spezialisierung: ['Edelschimmel- & Rotschmierekulturen', 'Hartkäse-Langzeitreifung', 'Kräuter- & Ziegenkäsesorten', 'Klimasteuerung im Reifekeller'],
    meister: ['Käsereimeisterstück', 'Zucht eigener Milchsäurekulturen', 'Käsereibetriebsleitung', 'Handelsbeziehungen & Qualitätsprämierung']
  },
  vorkoster: {
    lehrling: ['Geschmacksnerven schulen', 'Geruchsanalyse von Speisen', 'Beobachtung von Verfärbungen & Bitterkeit', 'Verhaltensprotokoll bei Hofe'],
    geselle: ['Erkennen bekannter Gifte & Verunreinigungen', 'Prüfen von Wein, Saucen & Fleisch', 'Körpersignale & Pulsüberwachung', 'Schnelle Reaktionsschemata'],
    spezialisierung: ['Seltene & schleichende Gifte identifizieren', 'Immunisierung durch Mikrodosierung', 'Erkennen von magischen Beigaben', 'Toxikologische Gefahrenanalyse'],
    meister: ['Leitender Vorkoster des Herrschers', 'Hofapotheken- & Kücheninspektion', 'Entwicklung von Antidoten & Gegengiften', 'Oberste Vertrauensperson des Monarchen']
  },

  // --------------------------------------------------------------------------
  // 2. BAU & HANDWERK (bau_handwerk)
  // --------------------------------------------------------------------------
  schreiner: {
    lehrling: ['Holzarten bestimmen & lagern', 'Hobeln, Sägen & Raspeln', 'Leim anrühren & Zwingen setzen', 'Holzoberflächen schleifen'],
    geselle: ['Zinken, Zapfen & Nuten verbinden', 'Möbelkorpusse montieren', 'Furniere aufbringen & pressen', 'Scharniere & Schlösser einpassen'],
    spezialisierung: ['Intarsien & Einlegearbeiten', 'Bugholz & Formteile', 'Geheime Möbelfächer & Mechaniken', 'Feinste Schellackpolituren'],
    meister: ['Schreinermeisterstück Möbelbau', 'Werkstattleitung & Innenausbau', 'Ausbildung Schreinerlehrlinge', 'Konstruktionsplanung für Paläste']
  },
  zimmermann: {
    lehrling: ['Balken abbinden & ablängen', 'Zimmermannsknoten & Rüstungsbau', 'Stemmarbeiten mit Beiteln', 'Sicherheit auf dem Dachstuhl'],
    geselle: ['Dachstühle richten & verbolzen', 'Fachwerkbau & Holzständer', 'Zapfenverbindungen mit Holznägeln', 'Mess- & Schnurschlagtechnik'],
    spezialisierung: ['Kuppel- & Bogenkonstruktionen', 'Hänge- & Sprengwerke für Brücken', 'Turmbau & Glockenstühle', 'Historisches Fachwerk restaurieren'],
    meister: ['Zimmermeister & Richtfestleitung', 'Statische Gesamtberechnung von Holzbauten', 'Großbaustellenleitung Holzbau', 'Innungs- & Wandergesellenprüfung']
  },
  tischler: {
    lehrling: ['Werkbank & Handwerkzeuge pflegen', 'Faserverlauf im Holz beachten', 'Holz feilen & schleifen', 'Einfache Holzkisten fertigen'],
    geselle: ['Tische, Stühle & Schränke bauen', 'Passgenaue Schubladenführung', 'Verleimen formstabiler Platten', 'Ölen, Wachsen & Beizen'],
    spezialisierung: ['Prunktische & Geschnitzte Lehnen', 'Akustischer Instrumententischbau', 'Maßgefertigte Bibliotheksregale', 'Wandvertäfelungen & Decken'],
    meister: ['Tischlermeisterbetrieb führen', 'Entwurf von Luxusmobiliar', 'Ausbildung im Tischlerhandwerk', 'Prüfung von Zunftstücken']
  },
  maurer: {
    lehrling: ['Mörtel mischen & Konsistenz prüfen', 'Ziegel transportieren & wässern', 'Lot & Wasserwaage anlegen', 'Gerüstbau & Baustellensicherheit'],
    geselle: ['Mauerverbände (Läufer/Binder) setzen', 'Ecken & Pfeiler lotrecht hochziehen', 'Fugen ausstreichen & glätten', 'Fenster- & Türstürze einmauern'],
    spezialisierung: ['Kreuzgrat- & Tonnengewölbe mauern', 'Brandmauer- & Schornsteinbau', 'Festungs- & Wehrmauerbau', 'Natursteinmischmauerwerk'],
    meister: ['Maurermeister & Bauleitung', 'Statische Planung von Steinbauten', 'Großprojektleitung Befestigung', 'Innungsmeisterprüfung Mauerwerk']
  },
  steinmetz: {
    lehrling: ['Steinmetzeisen & Fäustel pflegen', 'Rohblöcke spalten & zurichten', 'Flächen stocken & scharrieren', 'Gesteinsarten (Granit, Sandstein) unterscheiden'],
    geselle: ['Werkstücke maßhaltig behauen', 'Profile & Gesimse schlagen', 'Säulen & Kapitelle formen', 'Steinverankerung & Dübelung'],
    spezialisierung: ['Maßwerk für Kathedralenfenster', 'Gargoyles & Bauornamente meißeln', 'Fassadenrestaurierung', 'Tragende Bogensteine behauen'],
    meister: ['Dombaumeister & Hüttenmeister', 'Bauhüttenleitung & Steinmetzzeichen', 'Entwurf monumentaler Sakralbauten', 'Ausbildung im Steinmetzhandwerk']
  },
  dachdecker: {
    lehrling: ['Aufstiegssicherung & Dachlatten', 'Dachziegel & Schiefer tragen', 'Dachrinnen säubern', 'Dichtmaterialien vorbereiten'],
    geselle: ['Ziegel-, Reet- & Schiefereindeckung', 'Dachkehlen & Grate eindecken', 'Unterspannbahn & Winddichtung', 'Reparatur von Sturmschäden'],
    spezialisierung: ['Altdeutsche Schieferdeckung', 'Turm- & Zwiebeldacheindeckung', 'Kupfer- & Blei-Blechverkleidungen', 'Blitzschutz- & Entwässerungssysteme'],
    meister: ['Dachdeckermeisterbetrieb', 'Komplexe Dachlandschaften planen', 'Gefahren- & Gerüstbauabnahme', 'Innungsleitung Dachdeckerzunft']
  },
  glaser: {
    lehrling: ['Glasschneider führen & brechen', 'Glaserkitt kneten & lagern', 'Glastafeln sicher transportieren', 'Falze reinigen & vorbereiten'],
    geselle: ['Fensterscheiben zuschneiden & einkitten', 'Bleiruten biegen & verlöten', 'Butzenscheiben einsetzen', 'Rahmenanpassung für Glas'],
    spezialisierung: ['Kirchenfenster & Farbglasmalerei', 'Glasätzung & Sandstrahldekor', 'Wappenglasgestaltung', 'Historische Bleiverglasung sanieren'],
    meister: ['Glasermeister & Werkstattleitung', 'Monumentale Sakralverglasung', 'Ausbildung im Glaserhandwerk', 'Farbrezeptur für Glashütten']
  },
  toepfer: {
    lehrling: ['Ton kneten & entlüften', 'Töpferscheibe antreiben', 'Engoben & Glasuren anrühren', 'Brennroste im Ofen stapeln'],
    geselle: ['Töpfern an der Scheibe (Krüge, Schalen)', 'Henkel garnieren & abdrehen', 'Glasieren & Schrühendbrand', 'Salzglasurverfahren'],
    spezialisierung: ['Dünnwandige Feinporzellan-Vorstufen', 'Große Vorratsamphoren drehen', 'Kachelöfen-Keramikplatten', 'Dekorative Relieffiguren'],
    meister: ['Töpfereimeisterbetrieb', 'Ofenbau & Brenntemperaturmeisterei', 'Eigene Glasurrezepturen', 'Zunftmeisterprüfung Töpferei']
  },
  keramiker: {
    lehrling: ['Rohstoffaufbereitung Kaolin & Quarz', 'Gipsformen gießen & pflegen', 'Trocknungsprozesse überwachen', 'Scherbenprüfung'],
    geselle: ['Keramischer Guss & Freihandmodellage', 'Schlickermalerei & Unterglasur', 'Hochtemperaturbrände leiten', 'Präzise Wandstärkenkontrolle'],
    spezialisierung: ['Feinkeramik & Skulpturenkeramik', 'Kristallglasuren & Lüsterbrand', 'Säurefeste Industriekeramik', 'Mosaikfliesen-Komposition'],
    meister: ['Keramikmeister & Atelierleitung', 'Entwicklung neuer keramischer Massen', 'Lehre an Handwerksakademien', 'Internationale Meisterstücke']
  },
  gerber: {
    lehrling: ['Häute weichen, enthaaren & äschern', 'Gerbgruben umwälzen & reinigen', 'Schabebock bedienen & Fleischreste entfernen', 'Gerbstoffe (Eichenrinde) mahlen'],
    geselle: ['Loh- & Weißgerbung durchführen', 'Leder falzen, strecken & trocknen', 'Fetten & Färben von Rohleder', 'Qualitätskontrolle von Lederhäuten'],
    spezialisierung: ['Sämischgerbung (weiches Wildleder)', 'Schweres Rüst- & Sohlenleder gerben', 'Pflanzliche Luxusgerbungen', 'Wasserabweisende Spezialzurichtung'],
    meister: ['Gerbereibetriebsleitung', 'Umwelt- & Flusswassermanagement', 'Großhandelsverträge mit Schustern & Sattlern', 'Meisterausbildung Gerberei']
  },
  lederhandwerker: {
    lehrling: ['Lederzuschnitt mit Halbmondmesser', 'Lochpfeifen & Ahlen führen', 'Lederkanten glätten & wachsen', 'Nieten & Schnallen setzen'],
    geselle: ['Sattlerstich mit zwei Nadeln', 'Gürtel, Taschen & Beutel fertigen', 'Leder punzieren & prägen', 'Futterleder passgenau einnähen'],
    spezialisierung: ['Lederharnische & Armschienen formen', 'Reise- & Kurierkofferbau', 'Aufwendige Punzierkunst & Wappen', 'Wasserfeste Lederbehälter'],
    meister: ['Lederwerkstattmeister', 'Design exklusiver Lederwaren', 'Ausbildung Lederfeintäschner', 'Innungsleitung Lederhandwerk']
  },
  sattler: {
    lehrling: ['Sattelbäume vorbereiten', 'Polstermaterialien (Rosshaar) zupfen', 'Ledergurte schneiden & lochen', 'Zaumzeug reinigen'],
    geselle: ['Reitsättel polstern & beziehen', 'Geschirre für Zugpferde fertigen', 'Steigbügelriemen & Trensen anpassen', 'Reparatur von Riemenzeug'],
    spezialisierung: ['Maßgeschneiderte Prunksättel', 'Kriegsross-Panzergeschirr', 'Kutschen-Zuggeschirre & Kummete', 'Anatomische Passform für jedes Pferd'],
    meister: ['Sattlermeisterbetrieb führen', 'Hofsattlereileitung', 'Zunftprüfung für Reitsport & Militär', 'Ausbildung von Sattlergesellen']
  },
  schuhmacher: {
    lehrling: ['Schuhleisten hobeln & pflegen', 'Oberleder stanzen & zuschneiden', 'Pechdraht drehen & Borsten einfädeln', 'Absatzflecke schichten'],
    geselle: ['Rahmengenähte Schuhe fertigen', 'Sohlen anbringen & doppeln', 'Schuhabsätze aufbauen & ausputzen', 'Maßschuhe nach Fußabdruck anfertigen'],
    spezialisierung: ['Reitstiefel mit steifem Schaft', 'Gepanzerte Kriegsstiefel', 'Orthopädische Ausgleichsschuhe', 'Verzierte Seidenschuhe für Hofdamen'],
    meister: ['Schuhmachermeisterstück', 'Schuhmanufakturleitung', 'Zunftprüfung für Maßschuhmacher', 'Hofschuhmacher der Aristokratie']
  },
  schneider: {
    lehrling: ['Maßband & Kreide handhaben', 'Handnähte (Vorstich, Saumstich)', 'Stoffe bügeln & dämpfen', 'Knöpfe annähen & Knopflöcher stechen'],
    geselle: ['Schnittmuster erstellen & zuschneiden', 'Hosen, Hemden & Wämser nähen', 'Futterstoffe einarbeiten', 'Anproben & Maßkorrekturen'],
    spezialisierung: ['Schwere Prunkmäntel & Roben', 'Waffenröcke & Wappenstickerei', 'Korsetts & Ballkleider', 'Pelz- & Samtverarbeitung'],
    meister: ['Hofschneidermeister', 'Modedesign & Kollektionsentwurf', 'Innungsmeister Schneiderzunft', 'Ausbildung von Näh- & Zuschneidekräften']
  },
  weber: {
    lehrling: ['Webstuhl säubern & ölen', 'Garne spulen & aufbäumen', 'Kettfäden einfädeln', 'Schiffchen auffüllen'],
    geselle: ['Leinwand- & Köperbindung weben', 'Gleichmäßigen Schusseinschlag halten', 'Fadenbrüche erkennen & beheben', 'Stoffbahnen aufwickeln & prüfen'],
    spezialisierung: ['Musterweberei & Jacquard-Vorstufen', 'Samt- & Seidenweberei', 'Dichte Segeltuche & Zeltstoffe', 'Feinste Damaste & Brokate'],
    meister: ['Webereimanufakturleitung', 'Garnhandel & Großaufträge', 'Zunftmeister Weberei', 'Ausbildung am Tritt- & Zugwebstuhl']
  },
  faerber: {
    lehrling: ['Färberkessel heizen & rühren', 'Pflanzenfarbstoffe (Waid, Krapp) mahlen', 'Stoffbahnen spülen & auswringen', 'Beizen vorbereiten'],
    geselle: ['Farbflotten ansetzen & Temperatur halten', 'Gleichmäßige Färbung erzielen', 'Farbechtheit prüfen (Licht/Wasser)', 'Färben von Wolle, Leinen & Seide'],
    spezialisierung: ['Königs- & Kardinalspurpur färben', 'Tiefschwarz- & Indigofärbung', 'Mehrfarben- & Reservetechniken', 'Geheime Fixier- & Beizrezepte'],
    meister: ['Färbermeisterbetrieb', 'Entwicklung neuer Farbtöne', 'Zunftaufsicht Tuchqualität', 'Ausbildung im Färberhandwerk']
  },
  seiler: {
    lehrling: ['Hanf- & Flachsfasern hecheln', 'Seilerbahn sauber halten', 'Spinnrad gleichmäßig drehen', 'Kabelgarne aufwickeln'],
    geselle: ['Schlagen von 3- & 4-schäftigen Seilen', 'Kauschen & Augspleiße anfertigen', 'Seile teeren zum Nässeschutz', 'Prüfen der Zugfestigkeit'],
    spezialisierung: ['Schwere Schiffs- & Ankertaue schlagen', 'Glockenseile & Zugseile für Hebekräne', 'Hängebahnseile & Bergsteigerseile', 'Präzisionsleine für Bogensehnen'],
    meister: ['Seilermeisterwerkstatt', 'Großaufträge für Marine & Baukräne', 'Zunftprüfung Seilerhandwerk', 'Sicherheitszertifizierung von Tauen']
  },
  korbflechter: {
    lehrling: ['Weidenruten schneiden, sortieren & wässern', 'Schäl- & Spaltwerkzeuge pflegen', 'Bodenkreuze anlegen', 'Flechten einfacher Rundböden'],
    geselle: ['Körbe mit Aufsteckern & Kimme flechten', 'Griffe & Henkel stabil anflechten', 'Korbdeckel passgenau fertigen', 'Reusen & Transportkiepen bauen'],
    spezialisierung: ['Korbgeflecht für Kutschenaufbauten', 'Feines Rattan- & Flechtwerk für Möbel', 'Spezialreusen für Fischerei', 'Dekorative Flechtkunst'],
    meister: ['Korbmachermeister', 'Großserienfertigung für Landwirtschaft & Handel', 'Zunftmeister Korbhandwerk', 'Ausbildung von Flechtern']
  },
  papiermacher: {
    lehrling: ['Hadern & Lumpen sortieren & schneiden', 'Stampfwerk überwachen & befeuern', 'Schöpfrahmen säubern & bespannen', 'Filze waschen & wringen'],
    geselle: ['Bogen gleichmäßig schöpfen', 'Gautschen & Wasser abpressen', 'Papiere aufhängen & trocknen', 'Leimen zur Schreibtinte-Tauglichkeit'],
    spezialisierung: ['Wasserzeichen in Schöpfsiebe einweben', 'Büttenpapier für Urkunden & Adelsbriefe', 'Farbige & marmorierte Papiere', 'Pergamentersatz & Spezialkarton'],
    meister: ['Papiermühlenleitung', 'Handelsverträge mit Kanzleien & Universitäten', 'Zunftprüfung Papiermacher', 'Wasser- & Lumpenmonopolverwaltung']
  },
  buchbinder: {
    lehrling: ['Gedruckte/geschriebene Lagen falzen', 'Vorsatzpapiere schneiden & ansetzen', 'Buchleim anrühren', 'Pressbengel bedienen'],
    geselle: ['Heften der Lagen auf echte Bünde', 'Buchblock beschneiden & ableimen', 'Buchdeckel aus Pappe & Holz fertigen', 'Leder- & Pergamenteinbände aufziehen'],
    spezialisierung: ['Goldschnitt & Marmorschnitt anbringen', 'Blindprägung & Goldverzierung', 'Metallschließen & Eckbeschläge montieren', 'Handschriften & Inkunabeln restaurieren'],
    meister: ['Buchbindermeister & Atelierleitung', 'Prachteinbände für Könige & Archive', 'Innungsprüfung Buchbinderei', 'Historische Konservierungswissenschaft']
  },
  wagenbauer: {
    lehrling: ['Holzkanteln zurichten', 'Radnaben vorbohren', 'Beschläge entrosten & fetten', 'Werkstattordnung sichern'],
    geselle: ['Wagenräder speichen & felgen', 'Achsen & Deichseln einpassen', 'Kutschenrahmen & Wagenkästen bauen', 'Bremsvorrichtungen montieren'],
    spezialisierung: ['Federungsbau (Lederriemen- & Stahlfedern)', 'Schwere Planwagen für Fernkarawanen', 'Schnelle Streit- & Rennwagen', 'Verzierte Prunkkarossen für den Hochadel'],
    meister: ['Wagenbaumeister & Manufakturleitung', 'Statik & Fahrwerksdynamik', 'Militärische Fuhrparkleitung', 'Zunftmeisterprüfung Stellmacherei']
  },
  boettcher: {
    lehrling: ['Daubenholz spalten & lagern', 'Daubenhobel bedienen', 'Fassreifen schmieden helfen', 'Fässer wässern & Dichtigkeit prüfen'],
    geselle: ['Dauben fügen & zusammenstellen', 'Fass biegen über Feuer & Seilwinde', 'Böden einpassen & Kimm schneiden', 'Eiserne Fassreifen aufschlagen'],
    spezialisierung: ['Weinfässer mit speziellem Toasting', 'Druckfeste Bierfässer', 'Große Lagerfässer (mehrere tausend Liter)', 'Dichte Butterfässer & Kübel'],
    meister: ['Böttchermeisterbetrieb', 'Kellereiausstattungen leiten', 'Zunftmeister Fassbinder', 'Ausbildung im Böttcherhandwerk']
  },
  brunnenbauer: {
    lehrling: ['Aushub fortschaffen', 'Schachtringe transportieren', 'Wasserstand messen & protokollieren', 'Seilwinden warten'],
    geselle: ['Schachtbrunnen graben & ausmauern', 'Quelladern finden & fassen', 'Schöpfwerke & Handpumpen montieren', 'Brunnendeckel & Einfassungen setzen'],
    spezialisierung: ['Tiefbrunnenbau in Festungen & Bergen', 'Filterkies- & Entsandungssysteme', 'Hebe- & Kunsträder für Großbrunnen', 'Artesische Brunnenbohrungen'],
    meister: ['Brunnenbaumeister & Wasseringenieur', 'Städtische Trinkwasserplanung', 'Festungsbrunnenbau bei Belagerung', 'Innungsprüfung Brunnenbau']
  },
  brueckenbauer: {
    lehrling: ['Pflöcke schlagen & Seile spannen', 'Trägerbalken & Steine transportieren', 'Strömungsmessung Zuarbeit', 'Sicherungsboote führen'],
    geselle: ['Holzbrücken & Bohlenwege errichten', 'Pfeiler im Flussbett gründen (Kastendämme)', 'Brückenlager verankern', 'Geländer & Fahrbahn befestigen'],
    spezialisierung: ['Steinbogenbrücken für schwere Lasten', 'Zugbrücken & Wehranlagenbrücken', 'Hängebrücken über Schluchten', 'Eis- & Hochwasserschutzpfeiler'],
    meister: ['Brückenbauingenieur & Baumeister', 'Statische Strömungs- & Lastberechnung', 'Großbrückenbau über Ströme', 'Königliche Straßen- & Brückenbauleitung']
  },
  architekt: {
    lehrling: ['Bauzeichnungen kopieren & rastern', 'Materialmengen überschlagen', 'Vermessungsstangen halten & nivellieren', 'Bautagebuch führen'],
    geselle: ['Grundrisse & Schnitte zeichnen', 'Materialbedarfs- & Kostenkalkulation', 'Bauaufsicht vor Ort führen', 'Absprache mit Steinmetzen & Zimmerern'],
    spezialisierung: ['Festungsarchitektur & Schusswinkel', 'Monumentale Sakral- & Palastbauten', 'Akustik & Belüftungsplanung', 'Stadtplanung & Abwassersysteme'],
    meister: ['Oberster Hofbaumeister / Generalarchitekt', 'Epochenprägende Monumentalentwürfe', 'Gesamtleitung königlicher Großbauten', 'Ausbildung an der Bauakademie']
  },
  handwerkergehilfe: {
    lehrling: ['Werkzeuge anreichen & säubern', 'Baustellen aufräumen & absichern', 'Materialien schleppen & stapeln', 'Einfache Hilfsarbeiten'],
    geselle: ['Eigenständige Vorbereitungsarbeiten', 'Bedienung von Handmaschinen & Hebezeugen', 'Zuverlässige Zuarbeit für alle Gewerke', 'Arbeitssicherheit überwachen'],
    spezialisierung: ['Spezialisierter Zuarbeiter für Großbaustellen', 'Materiallogistik & Kranbedienung', 'Abbruch- & Entkernungsexperte', 'Montageassistenz schwieriger Bauteile'],
    meister: ['Oberpolier & Baustellenkoordinator', 'Einsatzplanung für Hilfs- & Fachkräfte', 'Sicherheits- & Logistikleitung', 'Effiziente Baustellenorganisation']
  },

  // --------------------------------------------------------------------------
  // 3. METALL & FEINHANDWERK (metall_feinhandwerk)
  // --------------------------------------------------------------------------
  schmied: {
    lehrling: ['Schmiedefeuer entzünden & regulieren', 'Amboss & Zuschlaghammer führen', 'Werkstück sicher mit Zangen halten', 'Glühfarben des Eisens beurteilen'],
    geselle: ['Freiformschmieden am Amboss', 'Härten, Anlassen & Abschrecken', 'Feuerverschweißen von Eisen & Stahl', 'Beschläge, Gitter & Werkzeuge fertigen'],
    spezialisierung: ['Klingenschmieden & Damaszenerfaltung', 'Präzisionshärtung für Spezialwerkzeuge', 'Harnisch- & Plattenteile treiben', 'Huf- & Wagenbeschläge anpassen'],
    meister: ['Meisterschmied & Werkstattleitung', 'Zunftprüfung im Schmiedehandwerk', 'Komplexe Legierungs- & Härteverfahren', 'Ausbildung von Schmiedelehrlingen']
  },
  grobschmied: {
    lehrling: ['Esse schüren & Kohle nachlegen', 'Zuschlaghammer beidhändig führen', 'Glühfarben des Eisens beobachten', 'Schmiedezangen bereitstellen'],
    geselle: ['Pflugschare & Äxte ausschmieden', 'Ketten, Gitter & Beschläge fertigen', 'Feuerverschweißen von Eisenpaketen', 'Härten in Wasser & Öl'],
    spezialisierung: ['Torbeschläge & Wehrelemente', 'Schweres Hebe- & Ankergeschirr', 'Wagenachsen & Pflugkörper', 'Große Schmiedestücke freiformen'],
    meister: ['Grobschmiedemeisterbetrieb', 'Leitung von Hammerwerken & Hufschmieden', 'Zunftprüfung für Grobschmiede', 'Ausbildung kräftiger Schmiedegesellen']
  },
  waffenschmied: {
    lehrling: ['Klingenrohlinge vorschmieden', 'Schleifsteine wässern & abrichten', 'Waffenhölzer & Leder vorbereiten', 'Poliermittel anmischen'],
    geselle: ['Schwerter, Lanzen & Dolche schmieden', 'Klingenhärtung & selektives Anlassen', 'Schlag- & Biegetests durchführen', 'Parierstangen & Knäufe montieren'],
    spezialisierung: ['Damaszener-Klingen mit Musterfaltung', 'Extrem flexible Hohlkehlenschwerter', 'Panzerbrechende Lanzen- & Pfeilspitzen', 'Ergonomische Griffpassung für Duellanten'],
    meister: ['Meisterwaffenschmied der Krone', 'Legendäre Meisterklingen schmieden', 'Waffenmeisterei für Armeen leiten', 'Innungsleitung Waffenschmiedezunft']
  },
  ruestungsschmied: {
    lehrling: ['Bleche zuschneiden & entgraten', 'Treibhämmer & Punzen pflegen', 'Lederriemen & Schnallen stanzen', 'Rostschutzöle auftragen'],
    geselle: ['Brustplatten & Helme kalt- & warmtreiben', 'Gelenkplatten für Ellbogen & Knie nieten', 'Passgenaue Scharniere & Riemen anbringen', 'Poliertes Blankfinish erzielen'],
    spezialisierung: ['Maßgefertigter Feld- & Turnierharnisch', 'Kannelierte Rüstungen (Riefelharnisch)', 'Kugelsichere/beschussfeste Brustpanzer', 'Vollbewegliche Fingerhandschuhe'],
    meister: ['Plattnermeister für den Hochadel', 'Prunkharnische mit Ätzung & Vergoldung', 'Zunftmeisterschaft Plattnerkunst', 'Königlicher Hofharnischmacher']
  },
  goldschmied: {
    lehrling: ['Feilung auffangen & Scheidgut trennen', 'Lötwasser & Flussmittel ansetzen', 'Gold- & Silberdraht ziehen', 'Polierpasten auftragen'],
    geselle: ['Ringe, Broschen & Ketten fertigen', 'Hartlöten mit Mundlötrohr / Blasrohr', 'Fassungen (Zargen- & Krappenfassung) biegen', 'Goldlegierungen schmelzen & gießen'],
    spezialisierung: ['Filigran- & Granulationstechnik', 'Ziselieren & Treiben von Goldreliefs', 'Emaille-Arbeiten (Zellenschmelz)', 'Prunkgefäße & Monstranzen'],
    meister: ['Goldschmiedemeisterstück', 'Schatzkammer- & Kronjuwelenrestaurator', 'Hofgoldschmied & Wappenstecher', 'Ausbildung im Goldschmiedehandwerk']
  },
  silberschmied: {
    lehrling: ['Silberbleche glühen & absäuern', 'Poliertrommel & Bürsten pflegen', 'Silberlot zuschneiden', 'Silbergeschirr reinigen & anlaufen verhindern'],
    geselle: ['Becher, Kannen & Schalen aufziehen', 'Silberteile fugenlos verlöten', 'Tafelsilber garnieren & polieren', 'Feingehaltsprüfung (Punzierstempel)'],
    spezialisierung: ['Große Prunkpokale & Zunftkannen', 'Hammerschlagdekor & getriebene Silberreliefs', 'Kandelaber & Altargeräte', 'Tafelaufsätze für Königshäuser'],
    meister: ['Silberschmiedemeisterbetrieb', 'Silberkammerleitung des Hofes', 'Zunftaufsicht für Feinsilberstempel', 'Innungsprüfung Silberschmiede']
  },
  juwelier: {
    lehrling: ['Edelsteine reinigen & sortieren', 'Präzisionswaage bedienen', 'Fassungsrohlinge polieren', 'Kundenkartei & Vitrinen pflegen'],
    geselle: ['Edelsteine sicher in Fassungen setzen', 'Schmuckstücke anpassen & weiten', 'Perlenketten knüpfen & knoten', 'Echtheitsprüfung von Diamanten & Rubinen'],
    spezialisierung: ['Pavé- & Kanalfassungen für Brillanten', 'Kombination seltener Farb-Edelsteine', 'Antikschmuck-Restaurierung', 'Gutachten & Wertschätzungen für Schatzkammern'],
    meister: ['Juweliermeister & Hofexperte', 'Entwurf von Kronen & Diademen', 'Internationaler Edelsteinhandel', 'Zunftmeister Juwelierkunst']
  },
  edelsteinschleifer: {
    lehrling: ['Schleifscheiben vorbereiten & beölen', 'Rohsteine sichten & reinigen', 'Kittstöckchen erwärmen & Steine aufdoppen', 'Schleifpulver Körnung wählen'],
    geselle: ['Cabochon-Schliff fehlerfrei formen', 'Facettieren von Farbsteinen', 'Winkel am Schleifquadranten einstellen', 'Hochglanzpolitur auf Zinn- & Bleischeiben'],
    spezialisierung: ['Brillantschliff mit exakter Lichtbrechung', 'Gemmen- & Kameen-Gravur in Lagensteine', 'Spalten problematischer Rohdiamanten', 'Rissfreie Bearbeitung von Smaragden'],
    meister: ['Edelsteinschleifermeister', 'Schliff berühmter Großsteine', 'Leitung von Schleifmühlen', 'Ausbildung im Edelsteinschleiferhandwerk']
  },
  werkzeugmacher: {
    lehrling: ['Feilübungen auf Zehntelmillimeter', 'Bohren, Senken & Gewindeschneiden', 'Messschieber & Taster ablesen', 'Stahlsorten für Werkzeuge kennen'],
    geselle: ['Stanz- & Biegewerkzeuge anfertigen', 'Schneidwerkzeuge härten & schleifen', 'Präzise Vorrichtungen & Lehren bauen', 'Passungen auf Maß reiben'],
    spezialisierung: ['Feinmechanische Pressmatrizen', 'Mess- & Prüfwerkzeuge für Zünfte', 'Gesenke für Waffen- & Rüstungsschmiede', 'Uhrwerk- & Zahnradfräswerkzeuge'],
    meister: ['Werkzeugmachermeister', 'Konstruktion komplexer Fertigungsvorrichtungen', 'Qualitätskontrolle für alle Zünfte', 'Ausbildung im Werkzeugbau']
  },
  hufschmied: {
    lehrling: ['Pferdehufe auskratzen & reinigen', 'Hufbock & Werkzeugkiste tragen', 'Hufeisen im Feuer anwärmen', 'Hufnägel schmieden & sortieren'],
    geselle: ['Hufe fachgerecht ausschneiden & raspeln', 'Hufeisen warm anpassen (Aufbrennen)', 'Hufeisen aufnageln & Nieten umbiegen', 'Eisen richten für Gangfehler'],
    spezialisierung: ['Orthopädischer Beschlag für Reit- & Rennpferde', 'Winterbeschlag mit Stollen & Eisnägeln', 'Schwerer Kaltblut-Arbeitsbeschlag', 'Hufkrankheiten (Strahlfäule) behandeln'],
    meister: ['Hufschmiedemeister & Gestütsleiter', 'Veterinärmedizinische Hufkorrekturen', 'Ausbildung staatlich anerkannter Hufschmiede', 'Hofhufschmied der Kavallerie']
  },
  feinmechaniker: {
    lehrling: ['Lupenbrille & Mikropinzetten handhaben', 'Feinstgewinde schneiden', 'Miniaturschrauben & Stifte drehen', 'Späne & Staub peinlich vermeiden'],
    geselle: ['Zahnräder & Triebe passgenau montieren', 'Lagerzapfen polieren & ölen', 'Sperrwerke & Federn spannen', 'Messgeräte & Sextanten justieren'],
    spezialisierung: ['Mechanische Uhrwerke & Chronometer', 'Astronomische Rechengeräte & Astrolabien', 'Schlossmechanismen & Tresorkombinationen', 'Optische Geräte & Fernrohrtuben'],
    meister: ['Feinmechanikermeister & Uhrmacher', 'Erfindung automatischer Getriebe & Automaten', 'Hofuhrmacher & Hofastronom-Techniker', 'Innungsmeister Feinmechanik']
  },
  schlosser: {
    lehrling: ['Bleche kanten & biegen', 'Schlüsselfeilen handhaben', 'Buntbartprofile anreißen', 'Nietverbindungen schlagen'],
    geselle: ['Kastenschlösser & Riegel bauen', 'Schlüssel nach Schlossbart feilen', 'Gittertore & Beschläge montieren', 'Schlossreparaturen vor Ort ausführen'],
    spezialisierung: ['Sicherheitsschlösser mit Fallklinken & Fallen', 'Versteckte Schließmechanismen & Geheimriegel', 'Tresor- & Kerkertorverriegelungen', 'Federnde Mehrfachriegelwerke'],
    meister: ['Schlossermeisterbetrieb', 'Sicherheitskonzepte für Schatzkammern & Burgen', 'Zunftmeister Schlosserhandwerk', 'Ausbildung im Schlosserhandwerk']
  },
  gießer: {
    lehrling: ['Formsand mischen & stampfen', 'Gussmodelle einbetten & ausheben', 'Schmelztiegel anfeuern & Schlacke abziehen', 'Gussstücke entformen & putzen'],
    geselle: ['Bronze-, Messing- & Eisenguss durchführen', 'Gusskanäle & Steiger anlegen', 'Schmelztemperatur nach Farbe prüfen', 'Lunkerfreie Güsse garantieren'],
    spezialisierung: ['Kirchenglockenguss mit reinem Ton', 'Kanonen- & Mörserguss (Büchsengießer)', 'Feinste Bronzestatuen im Wachsausschmelzverfahren', 'Schiffsschrauben- & Zahnradguss'],
    meister: ['Stück- & Glockengießermeister', 'Akustische Klangberechnung für Glockenspiele', 'Großgießereileitung für Artillerie & Kunst', 'Zunftmeister Gießerhandwerk']
  },
  kesselschmied: {
    lehrling: ['Schwere Kupfer- & Eisenbleche tragen', 'Nietlöcher stanzen & vorbohren', 'Nietfeuer bedienen', 'Blechkanten entgraten'],
    geselle: ['Kesselwände runden & biegen', 'Warmvernieten von Druckkesseln', 'Kupferkessel für Brauereien treiben', 'Dichtigkeits- & Druckprüfung mit Wasser'],
    spezialisierung: ['Große Brauerei- & Brennereikessel', 'Dampfkessel & Druckbehälterbau', 'Schiffskessel- & Wärmetauscherbau', 'Löt- & Schweißverbindungen schwerer Platten'],
    meister: ['Kesselschmiedemeister', 'Statik & Druckfestigkeitsberechnungen', 'Leitung industrieller Großkesselfertigung', 'Ausbildung von Kesselschmiedegesellen']
  },
  graveur: {
    lehrling: ['Grabstichel schärfen & abziehen', 'Kupferplatten polieren & grundieren', 'Schrift- & Linienübungen', 'Wachsgrund für Radierungen'],
    geselle: ['Monogramme & Schriften gravieren', 'Wappen in Silber & Gold schneiden', 'Stahlstempel für Münzen & Siegel schneiden', 'Reliefgravuren auf Klingen & Waffen'],
    spezialisierung: ['Tiefdruckplatten für Buchdruck & Landkarten', 'Guillochieren von Uhrdeckeln & Dosen', 'Feinste Porträtgravuren in Härtstahl', 'Geld- & Urkundendruckplatten'],
    meister: ['Hofgraveur & Münzstempelschneider', 'Meisterliche Siegel- & Druckstockgravur', 'Leitung der königlichen Münzprägestätte', 'Ausbildung im Graveurhandwerk']
  },
  runenschmied: {
    lehrling: ['Erze auf arkanische Resonanz prüfen', 'Runenschlegel & Meißel weihen', 'Geometrische Runenproportionen vorzeichnen', 'Schmiedefeuer mit Mana-Asche nähren'],
    geselle: ['Kraftrunen in glühenden Stahl treiben', 'Elementarbindungen im Härtebad verankern', 'Magische Leitfähigkeit des Metalls sichern', 'Schutzrunen auf Schilde & Rüstungen prägen'],
    spezialisierung: ['Klingen mit Schneidrunen verzaubern', 'Schwere Zwergen-Runenharnische binden', 'Resonanzrunen für Magierstäbe', 'Feuerfeste & kälteresistente Legierungen'],
    meister: ['Großmeister der Runenschmiede', 'Erschaffung legendärer Artefaktwaffen', 'Uralte Runengeheimnisse & Zwergenarchive', 'Leitung uralter Hochöfen der Macht']
  },
  artefaktschmied: {
    lehrling: ['Magische Kristalle & Metalle sortieren', 'Tiegel für Himmelsmetall vorbereiten', 'Mana-Flussmessungen protokollieren', 'Schutzamulette gegen Rückkopplung tragen'],
    geselle: ['Gefäße für arkane Essenzen schmieden', 'Metall mit Kristallen fugenlos verschmelzen', 'Konstante magische Ladung im Werkstück halten', 'Reparatur beschädigter Artefaktfassungen'],
    spezialisierung: ['Schmieden von Astral- & Mithrilstahl', 'Speicherkernfassung für unbegrenzte Energie', 'Artefakte mit Eigenwillen/Seelenbindung', 'Fluch- & Dämonenabwehrende Meisterwerke'],
    meister: ['Artefakt-Großmeister', 'Schöpfung von Reichsinsignien der Macht', 'Integration göttlicher/ätherischer Funken', 'Leiter der geheimen Reichs-Manufaktur']
  },

  // --------------------------------------------------------------------------
  // 4. NATUR & LANDWIRTSCHAFT (natur_landwirtschaft)
  // --------------------------------------------------------------------------
  bauer: {
    lehrling: ['Pflug & Egge rüsten', 'Saatgut reinigen & beizen', 'Mist ausbringen & kompostieren', 'Einfache Erntehilfe mit Sichel'],
    geselle: ['Ochsen- & Pferdegespann pflügen', 'Fruchtfolge (Dreifelderwirtschaft) planen', 'Sense dengeln & mähen', 'Getreidedrusch & Worfeln'],
    spezialisierung: ['Trockenheitsresistenter Ackerbau', 'Drainage & Bewässerungsgräben', 'Saatgutselektion & Veredelung', 'Konservierung von Großsilagen'],
    meister: ['Gutshof- & Dorfbauerschaft leiten', 'Agrarwirtschaftliche Gesamtplanung', 'Pachtverhandlungen & Marktbelieferung', 'Ausbildung landwirtschaftlicher Gehilfen']
  },
  feldarbeiter: {
    lehrling: ['Unkraut jäten & Furchen ziehen', 'Erntegüter bündeln & verladen', 'Handwerkzeuge säubern', 'Witterungsschutz errichten'],
    geselle: ['Schnelle Handernte (Korn, Rüben, Kohl)', 'Heu wenden & zu Schobern aufsetzen', 'Stoppelfelder umbrechen', 'Zuverlässige Akkordarbeit im Team'],
    spezialisierung: ['Feldkolonnen-Führung', 'Bedienung schwerer Dresch- & Häckselwerke', 'Spezialkulturen-Pflege', 'Krankheitsbefall an Halmen erkennen'],
    meister: ['Oberfeldmeister & Arbeitsvogt', 'Einsatzplanung für Hunderte Erntehelfer', 'Erntezeitpunkt-Optimierung', 'Logistische Verbindung Feld zu Speicher']
  },
  gaertner: {
    lehrling: ['Beete umgraben & harken', 'Gießwasser schöpfen & temperieren', 'Samen säen & pikieren', 'Komposterde sieben'],
    geselle: ['Gemüse- & Kräuteranbau im Freiland', 'Frühbeete & Glashäuser steuern', 'Sträucher & Hecken formschneiden', 'Schädlingsbekämpfung mit Naturmitteln'],
    spezialisierung: ['Barocke Schlossgarten-Geometrie', 'Exotische Zierpflanzen & Palmenhäuser', 'Heil- & Duftpflanzengärten', 'Veredelung von Rosen & Sträuchern'],
    meister: ['Hofgärtnermeister & Landschaftsplaner', 'Gartengestaltung für Schlösser & Klöster', 'Züchtung prämierter Pflanzensorten', 'Leitung der königlichen Orangerie']
  },
  obstbauer: {
    lehrling: ['Obstkisten zimmern & polstern', 'Fallobst aufsammeln & sortieren', 'Baumstämme kalken', 'Leitern sicher anstellen'],
    geselle: ['Obstbaumschnitt (Winter- & Sommerschnitt)', 'Pfropfen & Okulieren von Edelsorten', 'Schonende Pflücke von Äpfeln & Birnen', 'Kellerlagerung & Reifekontrolle'],
    spezialisierung: ['Spalierobst an Schlossmauern', 'Alte Lokalsorten rekultivieren', 'Dörrobst- & Mostherstellung', 'Frostschutzberegnung & Rauchfeuer'],
    meister: ['Pomologe & Plantagenleiter', 'Züchtung frost- & schädlingsfester Sorten', 'Großhandelsverträge für Tafelobst', 'Ausbildung im Erwerbsobstbau']
  },
  winzer: {
    lehrling: ['Rebstöcke anbinden & biegen', 'Traubenlese mit Rebmesser', 'Lesebottiche reinigen & schwefeln', 'Kelter befüllen'],
    geselle: ['Rebschnitt im Frühjahr & Entlauben', 'Mostkelterung & Oechslegrade messen', 'Gärführung im Weinkeller', 'Abstich & Schönung des Weins'],
    spezialisierung: ['Steillagen-Weinbau an Schieferhängen', 'Auslese- & Eisweinerzeugung', 'Barrique-Ausbau in Eichenfässern', 'Cuvée-Komposition & Sensorik'],
    meister: ['Kellermeister & Weinbaudirektor', 'Prämierte Jahrgangsweine kreieren', 'Weingutsverwaltung & Export', 'Zunftprüfung für Weinbau & Önologie']
  },
  imker: {
    lehrling: ['Smoker / Imkerpfeife anheizen', 'Bienenbeuten zimmern & wachsen', 'Rähmchen drahten & Mittelwände einlöten', 'Schutzkleidung anlegen'],
    geselle: ['Bienenvölker durchsehen & Weisel prüfen', 'Schwarmfang & Ablegerbildung', 'Honigwaben entdeckeln & schleudern', 'Bienenwachs klären & Kerzen ziehen'],
    spezialisierung: ['Königinnenzucht & Rassenreinzucht', 'Wald- & Heideimkerei (Wanderimkerei)', 'Propolis- & Gelée-Royale-Gewinnung', 'Bienenkrankheiten (Faulbrut) bekämpfen'],
    meister: ['Zeidlermeister & Imkereileiter', 'Bewirtschaftung hunderter Völker', 'Bestäubungsverträge mit Obstbauern', 'Innungsprüfung Imkerhandwerk']
  },
  viehzuechter: {
    lehrling: ['Ställe ausmisten & frisch einstreuen', 'Futtertröge füllen & tränken', 'Fellpflege & Bürsten', 'Tiere sicher halftern'],
    geselle: ['Fütterungspläne nach Leistungsstufen', 'Abkalbung & Fohlengeburt begleiten', 'Klauen- & Hufpflege durchführen', 'Fleisch- & Milchleistungsprüfung'],
    spezialisierung: ['Stammbaumbuchführung & Zuchtwahl', 'Künstliche Besamung & Zuchtlinien', 'Prämierungszucht für Fleischrinder', 'Weidemanagement für Großherden'],
    meister: ['Gestüts- & Zuchtbetriebsleiter', 'Zuchtverbandleitung & Auktionen', 'Veterinärmedizinische Zuchtstrategien', 'Ausbildung im Tierzuchtwesen']
  },
  hirte: {
    lehrling: ['Schafhürden aufstellen & abbauen', 'Herdenhunde füttern & bürsten', 'Lämmer tränken', 'Verirrte Tiere aufspüren'],
    geselle: ['Herde im offenen Gelände führen', 'Hütehunde mit Pfeifsignalen dirigieren', 'Schafschur mit Handschere', 'Schutz vor Wölfen & Raubtieren'],
    spezialisierung: ['Almwirtschaft & Hochgebirgsweiden', 'Käseherstellung auf der Almhütte', 'Wollqualitäts-Klassifizierung', 'Heilkräuterkunde für Weidetiere'],
    meister: ['Oberhirte & Almmeister', 'Pachtverträge für Hunderte Quadratkilometer', 'Zucht & Ausbildung legendärer Hütehunde', 'Traditionelle Weiderechtsverwaltung']
  },
  jaeger: {
    lehrling: ['Hochsitze bauen & freischneiden', 'Fütterungen im Winter befüllen', 'Waffen reinigen & einschießen', 'Aufbrechen & Ausweiden lernen'],
    geselle: ['Pirsch- & Ansitzjagd auf Schalenwild', 'Treffsicherer Schuss auf bewegte Ziele', 'Wildbrethygiene & Fleischbeschau', 'Trophäen präparieren & abkochen'],
    spezialisierung: ['Nachtjagd auf Schwarzwild', 'Bogen- & Armbrustjagd ohne Lärm', 'Großwild- & Bärenjagd', 'Führung von Jagdhundemeuten'],
    meister: ['Revierjägermeister & Hofjäger', 'Wildbestandsregulierung & Hegepläne', 'Hofjagden für Könige & Fürsten leiten', 'Ausbildung im Waidwerk']
  },
  foerster: {
    lehrling: ['Jungbäume pflanzen & wässern', 'Waldwege säubern & Markierungen setzen', 'Baumarten nach Rinde & Blatt bestimmen', 'Forstwerkzeuge schärfen'],
    geselle: ['Holzeinschlag auszeichnen (Hiebsreife)', 'Waldverjüngung & Lichtbaumarten fördern', 'Schädlingsbefall (Borkenkäfer) isolieren', 'Holzpolter vermessen & nummerieren'],
    spezialisierung: ['Nachhaltige Plenterwaldbewirtschaftung', 'Bann- & Lawinenschutzwälder pflegen', 'Edelholzanbau (Eiche, Nussbaum)', 'Wildschadensgutachten erstellen'],
    meister: ['Oberförster & Forstamtsleiter', 'Forstwirtschaftspläne über Jahrzehnte', 'Königliche Waldrechtaufsicht', 'Akademische Forstausbildung']
  },
  holzfaeller: {
    lehrling: ['Äste entasten mit dem Beil', 'Motorsägen-/Handsägenketten feilen', 'Keile & Fällheber herantragen', 'Sicherheitszone freiräumen'],
    geselle: ['Fällkerb präzise anlegen & Bruchleiste halten', 'Rückhänger sicher zu Fall bringen', 'Stammabschnitte ablängen & spalten', 'Arbeitssicherheit im Steilhang'],
    spezialisierung: ['Problemfällungen über Häusern & Straßen', 'Starkholzfällung uralter Riesenbäume', 'Holzrücken mit Pferd & Seilwinde', 'Flößerei auf reißenden Gebirgsflüssen'],
    meister: ['Holzhauermeister & Fällkolonnenleiter', 'Forstliche Einschlagskalkulation', 'Arbeitssicherheitsabnahme im Forst', 'Ausbildung professioneller Holzfäller']
  },
  kraeutersammler: {
    lehrling: ['Sammelzeitpunkte nach Sonnenstand lernen', 'Sammelkörbe & Leinentücher pflegen', 'Verwechslung mit Giftpflanzen meiden', 'Kräuter bündeln & schattig trocknen'],
    geselle: ['Seltene Heilkräuter in Mooren & Wäldern finden', 'Wurzeln, Rinden & Blüten fachgerecht ernten', 'Schonende Trocknung & Mazeration', 'Reinheit & Wirkstoffgehalt prüfen'],
    spezialisierung: ['Hochgebirgskräuter an Felswänden sammeln', 'Nachtblühende & mondabhängige Pflanzen', 'Gefährliche Rausch- & Giftkräuter handhaben', 'Magisch aufgeladene Feenkräuter orten'],
    meister: ['Meisterkräuterkundiger & Großsammler', 'Belieferung von Hofapotheken & Alchemisten', 'Geheime Fundortkarten & Anbauversuche', 'Ausbildung im Kräuterhandwerk']
  },
  pflanzenkundler: {
    lehrling: ['Herbarbelege pressen & beschriften', 'Pflanzenfamilien systematisch ordnen', 'Lupen- & Mikroskopbeobachtung', 'Bodenproben entnehmen'],
    geselle: ['Botanische Bestimmungsschlüssel anwenden', 'Wirkstoffanalyse pflanzlicher Extrakte', 'Kreuzungs- & Veredelungsversuche', 'Klimatische Wachstumsfaktoren erforschen'],
    spezialisierung: ['Gift- & Arzneipflanzen-Klassifikation', 'Fleischfressende & monströse Pflanzen erforschen', 'Symbiosen mit Pilzen & Bodenfauna', 'Pflanzengenetische Rekonstruktion'],
    meister: ['Botanischer Universitätsprofessor', 'Leitung des königlichen botanischen Gartens', 'Veröffentlichung monumentaler Florenwerke', 'Internationale Expeditionen für Neuentdeckungen']
  },
  bergarbeiter: {
    lehrling: ['Geleucht (Grubenlampe) pflegen', 'Haspel & Karren bedienen', 'Grubenhölzer schleppen', 'Schlägel & Eisen bereitlegen'],
    geselle: ['Gestein mit Meißel & Pickel brechen', 'Stollenholz setzen & verkeilen', 'Wetterführung & Luftqualität überwachen', 'Erzhaltiges Gestein sortieren'],
    spezialisierung: ['Schieß- & Sprengarbeit unter Tage', 'Abteufen tiefer Richtschächte', 'Wasserhaltung & Pumpenanlagen im Stollen', 'Grubenrettung bei Einstürzen'],
    meister: ['Steiger & Schichtleiter unter Tage', 'Sicherheit & Betriebsablauf im Revier', 'Stollenvortriebsplanung & Vermessung', 'Ausbildung junger Knappen']
  },
  minenarbeiter: {
    lehrling: ['Abraum wegschaufeln', 'Förderkörbe beladen', 'Sicherheitshelme & Ausrüstung prüfen', 'Signalglocken bedienen'],
    geselle: ['Tiefbau-Abbauverfahren anwenden', 'Pfeiler- & Firstenbau absichern', 'Bohrlöcher setzen', 'Transportbänder & Loren rangieren'],
    spezialisierung: ['Gefahrstofferkennung (Schlagwetter, CO2)', 'Großraumstollen für Schwerlastabbau', 'Spezialabbau von Edelmetalladern', 'Tunnelvortriebsmaschinen / schwere Hauen'],
    meister: ['Obersteiger & Minenbetriebsleiter', 'Lagerstättenausbeutung & Statik', 'Krisenmanagement bei Wassereinbrüchen', 'Zertifizierung bergmännischer Prüfungen']
  },
  steinbrucharbeiter: {
    lehrling: ['Schutt abfahren & Steine reinigen', 'Schlegel & Keile anreichen', 'Bohrstaub absaugen/binden', 'Seilzüge ölen'],
    geselle: ['Löcher in Felsreihen meißeln & keilen', 'Rohblöcke aus der Wand spalten', 'Kranverladung tonnenschwerer Blöcke', 'Spaltbarkeit von Marmor & Granit prüfen'],
    spezialisierung: ['Präzisionsspaltung monolithischer Säulenblöcke', 'Schonende Sprengung ohne Haarrisse', 'Abbau seltener Schmuck- & Werksteine', 'Terrassenabbau in steilen Steinbruchwänden'],
    meister: ['Steinbruchmeister & Betriebsleiter', 'Ergiebigkeitsgutachten für Steinbrüche', 'Lieferverträge für Kathedralen & Festungen', 'Ausbildung im Steinbruchwesen']
  },
  prospektor: {
    lehrling: ['Sedimentproben in Flussbetten waschen', 'Probenbeutel beschriften & wiegen', 'Geologische Karten falten & führen', 'Camp & Ausrüstung in der Wildnis sichern'],
    geselle: ['Goldwaschen mit der Pfanne & Sluice Box', 'Gesteinsformationen auf Erzmineralien prüfen', 'Ausbisse von Quarzgängen verfolgen', 'Einfache chemische Säureproben vor Ort'],
    spezialisierung: ['Aufspüren von Edelstein- & Diamantschloten', 'Geothermische & arkanische Erzresonanzerkennung', 'Tiefenbohrungsproben auswerten', 'Schürfrechte-Absteckung & Vermessung'],
    meister: ['Chefgeologe & Montanprospektor', 'Entdeckung gigantischer Bergbaureviere', 'Beratung von Bergbaukonsortien & Königen', 'Expeditionsleitung in unerforschte Kontinente']
  },
  koehler: {
    lehrling: ['Scheitholz gleichmäßig spalten & schichten', 'Rasensoden & Lehm für Meilerdecke stechen', 'Wasser & Löschsand bereithalten', 'Meilerplatz säubern'],
    geselle: ['Holzkohlenmeiler fachgerecht aufbauen', 'Meiler zünden & Zuglöcher regulieren', 'Schwelbrand Tag & Nacht überwachen', 'Kohle ziehen & schonend ablöschen'],
    spezialisierung: ['Hochwertige Schmiedekohle mit hohem Heizwert', 'Retortenverkohlung & Holzteergewinnung', 'Aktivkohle zur Wasser- & Giftreinigung', 'Buchenholzkohle für Schießpulver'],
    meister: ['Köhlermeister & Waldreviermeister', 'Großlieferverträge mit Hüttenwerken & Schmieden', 'Zunftprüfung im Köhlerhandwerk', 'Brandverhütung im gesamten Forstrevier']
  },
  falkner: {
    lehrling: ['Falkenhauben & Geschüh pflegen', 'Greifvogelvolieren reinigen', 'Futterfleisch frisch vorbereiten', 'Handschuhhaltung & ruhiges Auftreten'],
    geselle: ['Falken & Habichte auf das Federspiel abrichten', 'Vögel auf die Faust rufen', 'Beizjagd auf Federwild & Hasen führen', 'Gesundheit & Gefieder der Vögel pflegen'],
    spezialisierung: ['Adlerabrichtung auf Wölfe & Rehe', 'Flugtraining seltener Jagdfalken (Gerfalken)', 'Verletzte Greifvögel schienen & heilen', 'Falkenzucht in Gefangenschaft'],
    meister: ['Königlicher Hofoberfalkner', 'Leitung der herrschaftlichen Hofbeize', 'Diplomatische Falkengeschenke an Kaiserhöfe', 'Meisterprüfung im Falknerwesen']
  },
  pferdezuechter: {
    lehrling: ['Stallungen desinfizieren', 'Jungfohlen striegeln & führen lernen', 'Futterrationen mischen', 'Koppelzäune instand halten'],
    geselle: ['Pferde anreiten & an den Sattel gewöhnen', 'Beurteilung von Gangwerk & Exterieur', 'Trächtigkeitskontrolle & Fohlengeburt', 'Hengstkörung vorbereiten'],
    spezialisierung: ['Zucht von edlen Schlachtrössern / Kriegspferden', 'Hochleistungs-Renn- & Jagdpferdezucht', 'Schwere Kaltblutzucht für Land- & Fuhrwerk', 'Erbfehleranalyse & Pedigree-Design'],
    meister: ['Gestütsdirektor & Oberzuchtmeister', 'Hofgestütsleitung der Krone', 'Internationale Zuchtschauen jurieren', 'Ausbildung von Bereitern & Züchtern']
  },
  fallensteller: {
    lehrling: ['Drahtschlingen & Kastenfallen warten', 'Geruchsneutralisation der Ausrüstung', 'Köder anrühren & lagern', 'Schneeschuhe & Rucksack pflegen'],
    geselle: ['Fallen an Wechseln & Pässen platzieren', 'Schlageisen fachgerecht spannen & sichern', 'Gefangenes Pelzwild balgen & spannen', 'Fallenstrecke im Winter ablaufen'],
    spezialisierung: ['Großwild-Lebendfallen für Bestien', 'Selbstauslösende mechanische Netzfallen', 'Tarnung von Fallgruben gegen Intelligente Ziele', 'Fallen mit Narkose- & Giftmechanismen'],
    meister: ['Meister-Trapper & Pelzhandelsleiter', 'Wildtiermonitoring für Fürstentümer', 'Schutz von Siedlungen vor Raubtierplagen', 'Ausbildung im Fallenstellen']
  },
  faehrtenleser: {
    lehrling: ['Trittsiegel im Schlamm & Schnee erkennen', 'Kompasse & Sonnenstand peilen', 'Lautloses Gehen im Unterholz', 'Beobachtungsnotizen führen'],
    geselle: ['Alter von Spuren auf Stunden bestimmen', 'Gewicht & Gangart des Tieres/Flüchtenden ablesen', 'Versteckte Zeichen & geknickte Zweige deuten', 'Verfolgung über felsiges Terrain'],
    spezialisierung: ['Spurenlesen bei Regen & starkem Wind', 'Verfolgung magischer oder schwebender Kreaturen', 'Rückwärtiges Spurenverwischen (Gegenfährte)', 'Taktische Spurensuche für das Militär'],
    meister: ['Meisterpfadfinder & Chef-Scout', 'Führung von Spezialeinheiten durch Feindesland', 'Unfehlbare Rekonstruktion alter Ereignisse am Ort', 'Ausbildung von Kundschaftern']
  }
};
