// ============================================================================
// ADVENTUREFORGE BERUFS-FACHKOMPETENZEN NACH STUFEN - TEIL 4
// 13. Magie
// 14. Kunst & Kultur
// 15. Religion
// 16. Abenteuer
// ============================================================================

import { JobTierCompetencySet } from './professionTierCompetenciesPart1';

export const PART4_COMPETENCIES: Record<string, JobTierCompetencySet> = {
  // --------------------------------------------------------------------------
  // 13. MAGIE (magie)
  // --------------------------------------------------------------------------
  magier: {
    lehrling: ['Mana-Kanalisation & Atemtechniken', 'Grundlegende Spruchformeln & Gesten', 'Zauberstab- & Fokuspflege', 'Magische Sicherheitskreise ziehen'],
    geselle: ['Gezieltes Wirken von Angriffs- & Schutzsprüchen', 'Mana-Haushalt im Gefecht kontrollieren', 'Erkennen & Abwehren feindlicher Zauber', 'Verfassen eigener Zauberformeln im Grimoire'],
    spezialisierung: ['Kombination mehrerer Magieschulen', 'Lautloses & gestenloses Zaubern', 'Kanalisieren mächtiger Natur- & Elementarkräfte', 'Zauber-Gegenwirkung (Counterspell) in Sekundenbruchteilen'],
    meister: ['Erzmagier & Ratsherr der Arkanen Akademie', 'Erschaffung von Großzaubern mit Geländewirkung', 'Öffnen stabiler Teleportationsportale', 'Ewige Lebensverlängerung durch Magie']
  },
  magielehrer: {
    lehrling: ['Lehrbücher der Magie korrigieren', 'Übungsstäbe austeilen & entladen', 'Mana-Unfälle bei Schülern verhindern', 'Theorietests beaufsichtigen'],
    geselle: ['Didaktischer Aufbau von Zauberlektionen', 'Korrektur fehlerhafter Aussprache & Handhaltung', 'Gefahrlose Demonstration starker Zauber', 'Lehrpläne für Adepten erstellen'],
    spezialisierung: ['Entfesselung blockierter Mana-Quellen bei Novizen', 'Ausbildung im Duell- & Kampfzauber', 'Mentale Stärkung gegen Arkan-Wahn', 'Leitung der Fortgeschrittenen-Klassen'],
    meister: ['Direktor der Hohen Akademie der Künste', 'Ausbildung zukünftiger Hofmagier & Erzmagier', 'Verfassen der Standard-Lehrwerke der Magie', 'Arkan-pädagogischer Großmeister']
  },
  runenschreiber: {
    lehrling: ['Runenalphabete fehlerfrei zeichnen', 'Tinte mit Mondwasser & Silberstaub ansetzen', 'Pergamente mit Schutzglyphen weihen', 'Federkiele für Runenlinien schneiden'],
    geselle: ['Schreiben von Zauberschriftrollen', 'Runenbindungen auf Holz, Stein & Pergament', 'Aktivierungszeitpunkte von Runen festlegen', 'Fehler in fremden Runen aufspüren'],
    spezialisierung: ['Dauerhafte Runenbarrieren & Wächterglyphen', 'Runen auf lebendiger Haut (Schutzrunen)', 'Verborgene Runen mit Zeitzündern', 'Kopieren uralter Götter- & Drachenrunen'],
    meister: ['Großmeister der Runenmagie', 'Erschaffung von Schriften mit welterschütternder Macht', 'Siegelung von Dämonentoren durch Ur-Runen', 'Leiter des Runenskriptoriums']
  },
  verzauberer: {
    lehrling: ['Gegenstände von störenden Auren reinigen', 'Verzauberungssalze & Öle mischen', 'Fokuslinsen polieren', 'Magische Resonanz messen'],
    geselle: ['Waffen mit Elementarkraft belegen', 'Rüstungen mit Schutzverzauberungen versehen', 'Ringe & Amulette mit Alltagszaubern prägen', 'Stabilität von Verzauberungen prüfen'],
    spezialisierung: ['Permanente Verzauberung legendärer Waffen', 'Mehrfachverzauberungen ohne Aurenkonflikt', 'Beseitigung bösartiger Flüche auf Gegenständen', 'Intelligente Verzauberungen mit Eigenlogik'],
    meister: ['Meister-Verzauberer der Krone', 'Schöpfung kaiserlicher Reichsinsignien', 'Verzauberung ganzer Festungsbauwerke', 'Zunftmeisterprüfung Verzauberungskunst']
  },
  beschwoerer: {
    lehrling: ['Beschwörungskreise mit Salz & Silber ziehen', 'Schutzzauber für den Beschwörer weben', 'Kerzen & Weihrauch entzünden', 'Anrufungsformeln fehlerfrei auswendig lernen'],
    geselle: ['Herbeirufung niederer Elementare & Geistwesen', 'Binden von Wesenheiten an vertragliche Pflichten', 'Bannung widerspenstiger Entitäten', 'Telepathische Befehlserteilung an Diener'],
    spezialisierung: ['Beschwörung mächtiger Dschinns & Dämonen', 'Dauerhafte Bindung von Vertrauten & Wächtern', 'Dimensionale Pforten stabilisieren', 'Exorzieren feindlicher Beschwörungen'],
    meister: ['Großbeschwörer & Meister der Sphären', 'Befehlsgewalt über Elementarfürsten & Titanen', 'Erschaffung eigener astraler Taschenwelten', 'Leitung der Beschwörergilde']
  },
  wahrsager: {
    lehrling: ['Tarotkarten mischen & legen', 'Kristallkugeln reinigen & schattenfrei aufstellen', 'Kaffeesatz & Teeblätter deuten', 'Stimmung des Fragenden erfassen'],
    geselle: ['Erkennen von Zukunftstrends & Schicksalslinien', 'Präzise Traumdeutung & Omenlesen', 'Astrologische Horoskope berechnen', 'Vorhersehung von Unwettern & Krisen'],
    spezialisierung: ['Schauung exakter Ereignisse in naher Zukunft', 'Aufspüren verlorener Personen & Schätze per Vision', 'Abwendung drohender Schicksalsschläge', 'Blick in vergangene Epochen'],
    meister: ['Königlicher Hofwahrsager / Hohes Orakel', 'Offenbarung weltweiter Prophezeiungen', 'Verbindung zur kosmischen Schicksalsmatrix', 'Höchste Autorität der Divination']
  },
  ritualist: {
    lehrling: ['Ritualplätze nach Himmelsrichtungen ausrichten', 'Ritualopfer & Essenzen bereitstellen', 'Chor- & Sprechgesänge im Takt halten', 'Fackeln & Schalen entzünden'],
    geselle: ['Leitung mehrstündiger arkaner Gruppenrituale', 'Kanalisation kollektiver magischer Energien', 'Fokussierung gigantischer Zaubereffekte', 'Abbruch von Ritualen bei Instabilität'],
    spezialisierung: ['Wetter- & Sturmrituale leiten', 'Fruchtbarkeits- & Erntesegen über ganze Länder', 'Rituelle Versiegelung ganzer Regionen', 'Blut- & Seelenrituale bei Vollmond'],
    meister: ['Großmeister des Ritus', 'Vollzug epochaler Staats- & Weltenrituale', 'Kanalisierung göttlicher & astraler Großereignisse', 'Ausbildung im Ritualwesen']
  },
  arkanist: {
    lehrling: ['Aura-Wellenformen grafisch darstellen', 'Mana-Dichte im Raum messen', 'Theorie reiner Energie studieren', 'Fokusstäbe eichen'],
    geselle: ['Manipulation reiner arkaner Kraft ohne Elementarbindung', 'Schutzschilde aus reinem Kraftfeld errichten', 'Arkaner Strahl & Druckwellen gezielt einsetzen', 'Auflösung feindlicher Magiekonstrukte'],
    spezialisierung: ['Arkan-Kinetik & Telekinese schwerster Lasten', 'Raumverzerrung & Kurzstrecken-Blink', 'Absorption fremder Zauberenergie als eigenes Mana', 'Erschaffung autarker Energiekugeln'],
    meister: ['Großarkanist & Wächter des Äthers', 'Beherrschung des reinen kosmischen Energieflusses', 'Aufbau arkaner Megastrukturen', 'Dekan der Arkanistik']
  },
  elementarmagier: {
    lehrling: ['Kerzenflammen mit Gedankenkraft lenken', 'Wassertropfen formen', 'Windbrisen erzeugen', 'Erde zu Klumpen formen'],
    geselle: ['Feuerbälle, Eisstacheln & Blitze schleudern', 'Elementare Schutzwälle errichten', 'Wasser manipulieren & atembar machen', 'Gestein erweichen & verhärten'],
    spezialisierung: ['Beherrschung verheerender Feuersbrünste & Blizzards', 'Kombination zweier Elemente (Dampf, Magma, Sand)', 'Flug durch Windkraft & Schweben', 'Elementarverwandlung des eigenen Körpers'],
    meister: ['Primas der Elemente / Elementarfürst', 'Kontrolle über Vulkanausbrüche & Flutwellen', 'Erschaffung permanenter Elementarstürme', 'Höchste Meisterschaft aller vier Elemente']
  },
  sigilmancer: {
    lehrling: ['Sigillen mit Zirkel & Feder zeichnen', 'Symboldrücke auf Pergament stempeln', 'Farbpigmente mit Mana anreichern', 'Bedeutung der 72 Ursigillen lernen'],
    geselle: ['Sigillen auf Türen, Waffen & Rüstungen einprägen', 'Berührungssigillen mit Explosions- oder Lähmungswirkung', 'Fernaktivierung von Siegeln über Schlüsselworte', 'Verblassen von Sigillen verhindern'],
    spezialisierung: ['Mehrschichtige Kaskadensigillen', 'Verborgene unsichtbare Sigillen auf Kleidung & Haut', 'Sigillen zur Gedankenkontrolle & Täuschung', 'Entschärfung feindlicher Sigillensysteme'],
    meister: ['Großmeister der Sigillenmagie', 'Erschaffung von Siegelsystemen für Reichsgrenzen', 'Ewige Bannsiegel für Urwesen', 'Innungsprüfung Sigillenkunde']
  },
  talismanzer: {
    lehrling: ['Amulettgehäuse aus Holz & Horn schnitzen', 'Schutzsteine einpassen', 'Weiheöle & Rauch vorbereiten', 'Schnüre & Lederketten flechten'],
    geselle: ['Fertigung von Glücks- & Schutztalismanen', 'Bindung kleiner Schutzgeister in Amulette', 'Talismane gegen Krankheiten & bösen Blick', 'Wiederaufladung verbrauchter Talismane'],
    spezialisierung: ['Talismane zur vollständigen Magieimmunität', 'Lebensrettende Schutzamulette (Todesstoß-Abwehr)', 'Talismane mit dauerhaftem Unsichtbarkeitseffekt', 'Personengebundene Erbtalismane'],
    meister: ['Großtalismanzer & Meister der Kleinodien', 'Erschaffung von Schutzartefakten für Könige', 'Leitung der Talismanzer-Manufaktur', 'Ausbildung im Talismanhandwerk']
  },
  nekromant: {
    lehrling: ['Totenruhe & Knochenanatomie studieren', 'Balsamierungsöle & Kräuter mischen', 'Grabesstaub & Schattenessenzen sammeln', 'Schutz vor Nekrose & Fäulnis tragen'],
    geselle: ['Animation von Skeletten & Zombies als Diener', 'Lebensentzug im Kampf zur eigenen Heilung', 'Schattenblitze & Furchtzauber wirken', 'Konservierung von Leichnamen gegen Verfall'],
    spezialisierung: ['Erschaffung intelligenter Untoter (Ghoule, Mumien)', 'Seelenfesselung & Geisterbefragung', 'Todesauren & Seuchenwolken erzeugen', 'Verwandlung in einen Lich vorbereiten'],
    meister: ['Erznekromant & Herr über den Tod', 'Befehlsgewalt über Armeen von Untoten', 'Überwindung der Sterblichkeit / Lichdom', 'Beherrscher der Schattenebenen']
  },
  medium: {
    lehrling: ['Trancezustände durch Trommeln & Weihrauch erreichen', 'Schutzgeister anrufen', 'Geistergeräusche von Einbildung unterscheiden', 'Séance-Tische vorbereiten'],
    geselle: ['Kommunikation mit ruhelosen Geistern & Verstorbenen', 'Botschaften aus dem Jenseits übermitteln', 'Geistererscheinungen materialisieren', 'Unerwünschte Spukgeister besänftigen'],
    spezialisierung: ['Kanalisierung der Fähigkeiten eines Geistes durch den Körper', 'Lösung von Verfluchungen durch Ahnengeister', 'Austreibung bösartiger Poltergeister', 'Geisterreisen in die Geisterwelt'],
    meister: ['Hohes Sprachrohr der Ahnen / Meistermedium', 'Ständige Verbindung zu den Ahnenkönigen', 'Schlichtung von Konflikten zwischen Lebenden & Toten', 'Leitung spiritistischer Zirkel']
  },
  traumwandler: {
    lehrling: ['Schlafzyklen kontrollieren', 'Klarträumen (Luzides Träumen) trainieren', 'Traumtagebücher führen', 'Schlaftees mit Baldrian & Mohn zubereiten'],
    geselle: ['Eindringen in die Träume schlafender Personen', 'Erkennen von Ängsten & Wünschen im Traum', 'Übermittlung von Traumbotschaften über Distanz', 'Schutz des eigenen Geistes vor Traumangriffen'],
    spezialisierung: ['Veränderung von Erinnerungen im Traumzustand', 'Gefangennahme von Seelen im Albtraum', 'Traumschaden in reale physische Wunden übertragen', 'Gemeinsame Traumwelten für Besprechungen erschaffen'],
    meister: ['Herr der Träume & Traumarchitekt', 'Vollständige Kontrolle über das kollektive Unterbewusstsein', 'Ewiges Wachen in der Traumdimension', 'Ausbildung im Traumwandeln']
  },

  // --------------------------------------------------------------------------
  // 14. KUNST & KULTUR (kunst_kultur)
  // --------------------------------------------------------------------------
  musiker: {
    lehrling: ['Notenlesen & Rhythmusübungen', 'Instrumente stimmen & reinigen', 'Saiten aufziehen & Blätter wechseln', 'Gehörbildung & Tonleitern'],
    geselle: ['Auftritte in Tavernen, Gasthöfen & Sälen', 'Zusammenspiel im Ensemble & Orchester', 'Improvisation über bekannte Melodien', 'Publikumsstimmung mit Musik lenken'],
    spezialisierung: ['Virtuoses Solospiel auf Meisterinstrumenten', 'Musik mit magischer Resonanz (Bardenmagie)', 'Arrangement komplexer Konzertstücke', 'Leitung von Hofkapellen'],
    meister: ['Konzertmeister & Hofmusikdirektor', 'Ernennung zum kaiserlichen Kammermusiker', 'Komposition gefeierter Musikwerke', 'Ausbildung an Musikakademien']
  },
  saenger: {
    lehrling: ['Atemtechnik & Zwerchfellstütze', 'Einsingen & Tonumfang erweitern', 'Textverständlichkeit & Aussprache', 'Haltung auf der Bühne'],
    geselle: ['Kräftiger Gesang über Orchesterlautstärke', 'Balladen & Arien emotional vortragen', 'Chorgesang & Mehrstimmigkeit', 'Auftritte bei Festen & Opern'],
    spezialisierung: ['Koloratur- & Prunksänger für Hoftheater', 'Zaubergesang zur Beruhigung oder Verzauberung', 'Improvisierter Stegreifgesang', 'Duette mit führenden Künstlern'],
    meister: ['Königlicher Hofsänger / Primadonna', 'Weltruhm auf den großen Opernbühnen', 'Unvergleichliche Stimmkraft & Timbre', 'Lehrstuhlinhaber Gesangskunst']
  },
  taenzer: {
    lehrling: ['Dehnübungen & Körperspannung', 'Grundschritte höfischer Tänze lernen', 'Rhythmusgefühl & Pirouetten', 'Tanzschuhe & Kostüme pflegen'],
    geselle: ['Elegantes Tanzen bei Hofbällen & Festen', 'Bühnentanz & akrobatische Choreographien', 'Ausdruck von Emotionen durch Bewegung', 'Paartanz & Führungskompetenz'],
    spezialisierung: ['Solotanz im Ballett & Theater', 'Kampftanz mit Schleiern, Fächern oder Klingen', 'Ekstatischer Feuertanz', 'Entwicklung neuer Choreographien'],
    meister: ['Ballettmeister & Hofchoreograph', 'Leitung des königlichen Hoftanzensembles', 'Inszenierung epochaler Bühnentanzwerke', 'Ausbildung an der Tanzakademie']
  },
  schauspieler: {
    lehrling: ['Sprecherziehung & laute Artikulation', 'Rollenmonologe auswendig lernen', 'Bühnenpräsenz & Blickkontakt', 'Requisiten & Kostüme ordnen'],
    geselle: ['Verkörperung verschiedenster Charaktere', 'Tragödien- & Komödienspiel vor großem Publikum', 'Improvisation bei Texthängern von Kollegen', 'Zusammenspiel im Theaterensemble'],
    spezialisierung: ['Hauptrollen in königlichen Hoftheatern', 'Bühnenfechten & Schaukampf ohne Verletzung', 'Verwandlungskunst durch Maske & Stimme', 'Method Acting & emotionale Tiefe'],
    meister: ['Theaterdirektor & Schauspiellegende', 'Leitung berühmter Theaterhäuser', 'Ausbildung von Generationen von Schauspielern', 'Königliche Auszeichnung für Lebenswerk']
  },
  akrobat: {
    lehrling: ['Körperbeherrschung & Fallschule', 'Handstand & Rumpfbeugen perfektionieren', 'Sicherheitsmatten auslegen', 'Gelenkigkeit trainieren'],
    geselle: ['Salti, Flic-Flacs & Menschenpyramiden', 'Seiltanz auf schwankendem Seil', 'Trapezkunst & Fangen in der Luft', 'Auftritte auf Jahrmärkten & Zirkusbühnen'],
    spezialisierung: ['Hochseilartistik ohne Sicherung über Abgründen', 'Kontorsionistik (Schlangenmensch)', 'Akrobatik zu Pferde / auf Tieren', 'Kombination von Akrobatik & Kampfsport'],
    meister: ['Zirkusdirektor & Meisterakrobat', 'Atemberaubende Shows vor Königshäusern', 'Erfindung weltberühmter Kunststücke', 'Ausbildung im Akrobatikwesen']
  },
  jongleur: {
    lehrling: ['3 Bälle sicher im Kreis halten', 'Hand-Auge-Koordination schulen', 'Requisiten fangen ohne hinzuschauen', 'Pausenlos lächeln beim Werfen'],
    geselle: ['Jonglieren mit 5-7 Bällen, Keulen & Ringen', 'Jonglieren mit brennenden Fackeln & Messern', 'Zusammenspiel & Passen mit Partnern', 'Unterhaltsame Moderation während des Werfens'],
    spezialisierung: ['Blindes Jonglieren mit gefährlichen Objekten', 'Jonglieren auf dem Einrad oder dem Seil', 'Riesenshows mit 9+ Gegenständen', 'Kontaktjonglage mit Kristallkugeln'],
    meister: ['Großmeister der Jonglierkunst', 'Auftritte bei königlichen Krönungsfeiern', 'Präsident der Gilde der Gaukler', 'Ausbildung im Jonglierhandwerk']
  },
  barde: {
    lehrling: ['Laute spielen & Lieder memorieren', 'Reime schmieden & Metrik verstehen', 'Legenden & Heldengeschichten sammeln', 'Stimme für Schankräume schulen'],
    geselle: ['Vortragen epischer Heldenlieder in Tavernen & Burgen', 'Eigene Lieder über aktuelle Ereignisse dichten', 'Bardenmagie (Motivation & Verzauberung)', 'Freies Wohnen & Speisen durch Gesangskunst'],
    spezialisierung: ['Hofbarde an Königshöfen', 'Kriegsbardentum (Truppenmoral in Schlachten stärken)', 'Geheime Bardenbotschaften & Spionage', 'Besänftigung wilder Bestien durch Musik'],
    meister: ['Erzbarde & Meister der Saiten', 'Hüter des mündlichen Geschichtswissens', 'Leitung des Bardencollegs', 'Legendenstatus im gesamten Reich']
  },
  geschichtenerzaehler: {
    lehrling: ['Märchen & Mythen auswendig lernen', 'Stimmmodulation & Pausensetzung üben', 'Zuhörerkreis um das Feuer versammeln', 'Blickkontakt halten'],
    geselle: ['Fesselnde Erzählung über Stunden ohne Manuskript', 'Spannungsaufbau & emotionale Höhepunkte setzen', 'Anpassung der Geschichte an Kinder oder Erwachsene', 'Gestik & Mimik zur Veranschaulichung nutzen'],
    spezialisierung: ['Erzählen uralter Schöpfungsmythen & Göttersagen', 'Interaktives Erzählen mit Publikumsentscheidungen', 'Reisen von Dorf zu Dorf als Träger der Kultur', 'Heilende & tröstende Geschichten bei Trauer'],
    meister: ['Meistererzähler / Hüter der Volkstradition', 'Verfassen umfassender Märchensammlungen', 'Einfluss auf die nationale Identität', 'Ausbildung junger Erzähler']
  },
  maler: {
    lehrling: ['Farbpigmente reiben & mit Leinöl binden', 'Leinwände auf Keilrahmen spannen & grundieren', 'Pinsel pflegen & Ziegenhaare sortieren', 'Skizzen nach Gipsmodellen zeichnen'],
    geselle: ['Porträts, Landschaften & Stillleben malen', 'Perspektive, Licht & Schatten beherrschen', 'Öl-, Fresko- & Temperatechniken anwenden', 'Lasuren schichten für Tiefenwirkung'],
    spezialisierung: ['Herrscherporträts & monumentale Schlachtenbilder', 'Deckenfresken in Kathedralen & Palästen', 'Trompe-l’œil (optische Täuschungsmalerei)', 'Magisch animierte Gemälde erschaffen'],
    meister: ['Hofmaler & Akademiedirektor', 'Schöpfung unvergänglicher Meisterwerke', 'Leitung einer großen Meisterwerkstatt', 'Kaiserliche Ehrungen & Zunftmeisteramt']
  },
  bildhauer: {
    lehrling: ['Gips anrühren & Ton kneten', 'Punktiergerät & Raspeln pflegen', 'Marmorblöcke auf Risse prüfen', 'Marmorstaub absaugen/schützen'],
    geselle: ['Statuen aus Marmor, Stein & Holz schlagen', 'Anatomische Proportionen fehlerfrei meißeln', 'Faltenwurf von Gewändern in Stein darstellen', 'Oberflächen schleifen & polieren'],
    spezialisierung: ['Monumentale Reiterstandbilder in Bronze gießen', 'Lebensechte Büsten des Hochadels', 'Fassaden- & Altarbildhauerei für Dome', 'Erschaffung belebter Steinfiguren (Golems)'],
    meister: ['Hofbildhauermeister & Monumentalkünstler', 'Werke von welthistorischer Bedeutung schaffen', 'Leitung der königlichen Bildhauerhütte', 'Ausbildung an der Kunstakademie']
  },
  zeichner: {
    lehrling: ['Kohle- & Graphitstifte spitzen', 'Schraffur- & Wischtechniken üben', 'Proportionsraster anlegen', 'Fixiersprays auftragen'],
    geselle: ['Präzise anatomische & architektonische Zeichnungen', 'Porträtskizzen in wenigen Minuten erfassen', 'Illustrationen für Bücher & Chroniken', 'Federzeichnungen mit Tusche & Aquarell'],
    spezialisierung: ['Kupferstich- & Radierplatten zeichnen', 'Gerichts- & Steckbriefzeichnungen für die Wache', 'Karten- & Tierillustrationen für Folianten', 'Karikaturen & politische Satirezeichnungen'],
    meister: ['Meisterzeichner & Chefillustrator', 'Herausgabe berühmter Stichwerke & Bildbände', 'Leitung der Akademie für Grafik & Druck', 'Zunftmeisterprüfung für Zeichner']
  },
  schriftsteller: {
    lehrling: ['Grammatik, Orthographie & Wortschatz schulen', 'Exzerpte aus klassischen Romanen anfertigen', 'Manuskripte binden & lesbar schreiben', 'Ideenotizen strukturieren'],
    geselle: ['Romane, Novellen & Erzählungen verfassen', 'Spannende Handlungsbögen & Charakterentwicklung', 'Verhandlungen mit Druckern & Verlegern führen', 'Kritiken & Rezensionen verfassen'],
    spezialisierung: ['Bestseller-Epen & Fantasy-Sagas', 'Historische Großromane mit akribischer Recherche', 'Theaterstücke & Libretti für Opern', 'Philosophische Essays von epochaler Tragweite'],
    meister: ['Nationaldichter / Großschriftsteller', 'Präsident der Literaturakademie', 'Einfluss auf die Weltsicht ganzer Generationen', 'Auszeichnung mit dem höchsten Literaturpreis']
  },
  dichter: {
    lehrling: ['Versmaße (Jambus, Trochäus, Hexameter) pauken', 'Reimschemata (Kreuzreim, Paarreim) üben', 'Wortklang & Alliterationen erforschen', 'Gedichte berühmter Meister rezitieren'],
    geselle: ['Sonette, Oden & Elegien verfassen', 'Auftragsgedichte für Hochzeiten & Begräbnisse', 'Klangliche Perfektion & bildhafte Sprache', 'Teilnahme an Dichterwettstreiten'],
    spezialisierung: ['Hofdichtung zum Ruhme des Monarchen', 'Epische Heldengedichte in Versform', 'Zaubersprüche in Reimform dichten', 'Liebeslyrik von zeitloser Schönheit'],
    meister: ['Poeta Laureatus / Gekrönter Dichterfürst', 'Hofpoet der kaiserlichen Residenz', 'Begründung neuer literarischer Epochen', 'Höchste Meisterschaft der Sprachkunst']
  },
  instrumentenbauer: {
    lehrling: ['Tonhölzer (Fichte, Ahorn) lagern & prüfen', 'Hobel & Schnitzeisen schärfen', 'Knochenleim anrühren', 'Mechanikbauteile entgraten'],
    geselle: ['Lauten, Violinen, Flöten & Trommeln bauen', 'Resonanzböden auf ideale Schwingung hobeln', 'Saitenlage & Bünde präzise einmessen', 'Akustische Feinabstimmung des Klangs'],
    spezialisierung: ['Konzertflügel- & Cembalobau', 'Kirchenorgelbau mit tausenden Pfeifen', 'Meistergeigenbau (Stradivari-Niveau)', 'Verzierte Prunkinstrumente mit Intarsien'],
    meister: ['Geigenbau- & Orgelbaumeister', 'Legendäre Meisterinstrumente von unschätzbarem Wert', 'Leitung der Instrumentenbauer-Innung', 'Ausbildung im Instrumentenbau']
  },
  taetowierer: {
    lehrling: ['Hygieneregeln & Nadelsterilisation lernen', 'Tuschefarben aus Ruß & Erden anreiben', 'Hautübungen auf Schweineleder', 'Schablonen vorzeichnen'],
    geselle: ['Sauberes Stechen von Linien & Schattierungen', 'Haut nach dem Stechen desinfizieren & pflegen', 'Tribal-, Tier- & Seemannsmotive stechen', 'Kunden bei Schmerzen beruhigen'],
    spezialisierung: ['Magische Tätowierungen mit Schutzeffekten', 'Großflächige Ganzkörper-Kunstwerke', 'Gildentattoos & Geheimbund-Markierungen', 'Narbenüberdeckung & Cover-up-Tattoos'],
    meister: ['Großmeister der Tätowierkunst', 'Meisterhafte arkan-permanente Körpermale', 'Leitung exklusiver Tattoo-Ateliers', 'Innungsprüfung im Tätowiergewerbe']
  },
  puppenspieler: {
    lehrling: ['Fäden an Marionettenkreuzen befestigen', 'Holzköpfe schnitzen & bemalen', 'Stimmenimitation üben', 'Puppentheaterbühne aufbauen'],
    geselle: ['Marionetten lebensecht über die Bühne führen', 'Handpuppen- & Schattenspiele vorführen', 'Spannende & lustige Stücke aufführen', 'Gleichzeitiges Spielen mehrerer Figuren'],
    spezialisierung: ['Mechanische Großpuppen & Automaten steuern', 'Politisches Puppenkabarett mit Satire', 'Magisch beseelte Puppenspiele', 'Riesige Schattentheater-Inszenierungen'],
    meister: ['Meister-Marionettist & Theaterleiter', 'Berühmte Tourneen an königliche Residenzen', 'Erschaffung lebensechter Puppenspiele', 'Ausbildung im Puppenspielhandwerk']
  },
  komponist: {
    lehrling: ['Partituren kopieren & Stimmen ausschreiben', 'Harmonielehre & Kontrapunkt studieren', 'Klavierauszüge anfertigen', 'Instrumentenbereiche kennen'],
    geselle: ['Kammermusik, Tänze & Messen komponieren', 'Arrangement für verschiedene Orchesterbesetzungen', 'Musikalische Themen & Leitmotive entwickeln', 'Proben mit Orchestern leiten'],
    spezialisierung: ['Monumentale Symphonien & Requien komponieren', 'Opernkomposition mit vollem Bühnenwerk', 'Kriegshymnen für ganze Heere verfassen', 'Magische Resonanzkompositionen'],
    meister: ['Hofkomponist & Musikalisches Genie', 'Schöpfung von Werken für die Ewigkeit', 'Direktor der Königlichen Hofoper', 'Höchste Autorität der Musiktheorie']
  },
  schausteller: {
    lehrling: ['Buden & Zelte auf Jahrmärkten aufbauen', 'Fahrgeschäfte schmieren & prüfen', 'Publikum mit Schellen anlocken', 'Eintrittsgelder kassieren'],
    geselle: ['Attraktionen & Kuriositäten vorführen', 'Glücksbuden & Geschicklichkeitsspiele leiten', 'Fahrten von Markt zu Markt organisieren', 'Gute Stimmung & Rummelplatzatmosphäre schaffen'],
    spezialisierung: ['Kabinett der Absurditäten & Wachsfigurenkabinett', 'Große transportable Karussells & Riesenräder', 'Stuntshows & Schauboxkämpfe organisieren', 'Organisation gesamter Vergnügungsparks'],
    meister: ['Präsident des Schaustellerbundes', 'Leitung der größten Jahrmärkte & Vergnügungsfeste', 'Verhandlung von Standplätzen mit Städten', 'Innungsprüfung für Schausteller']
  },

  // --------------------------------------------------------------------------
  // 15. RELIGION (religion)
  // --------------------------------------------------------------------------
  priester: {
    lehrling: ['Heilige Schriften studieren & rezitieren', 'Altar bereiten & Weihrauch entzünden', 'Kirchengesänge & Gebete lernen', 'Demut & Gehorsam üben'],
    geselle: ['Gottesdienste leiten & Predigten halten', 'Spenden der Sakramente (Taufe, Trauung, Beichte)', 'Gemeindeseelsorge & Krankenbesuche', 'Pfarrkirchenverwaltung'],
    spezialisierung: ['Befreiung von Besessenheit (Exorzismus-Assistenz)', 'Theologische Abhandlungen verfassen', 'Segnung von Waffen & Heeren vor Schlachten', 'Leitung großer Wallfahrtskirchen'],
    meister: ['Bischof / Dompropst', 'Geistliche Aufsicht über eine gesamte Diözese', 'Weihe neuer Priester & Kirchenbauten', 'Mitglied des obersten Klerusrates']
  },
  priesterin: {
    lehrling: ['Tempelweihen & Reinigungsrituale', 'Altarschmuck & Opfergaben vorbereiten', 'Meditation & Gebetsdisziplin', 'Kultgesänge einstudieren'],
    geselle: ['Leitung feierlicher Tempelzeremonien', 'Seelsorgerische Beratung von Gläubigen', 'Spendung ritueller Waschungen & Segen', 'Pflege des heiligen Feuers'],
    spezialisierung: ['Orakeldeutung & göttliche Eingebungen', 'Hohe Priesterin des Fruchtbarkeits- oder Kriegskultes', 'Heilungsrituale im Tempelsanktuarium', 'Tempelverwaltung & Schatzkammeraufsicht'],
    meister: ['Hohepriesterin des Heiligtums', 'Direkte Stellvertreterin der Göttin auf Erden', 'Führung aller Priesterinnen des Reiches', 'Einfluss auf die Krönung von Königen']
  },
  moench: {
    lehrling: ['Klosterregeln (Ora et labora) einhalten', 'Gartenarbeit & Schreibarbeiten im Kloster', 'Stundengebete pünktlich besuchen', 'Schweigezeiten wahren'],
    geselle: ['Handschriften im Skriptorium kopieren & illuminieren', 'Klosterbrauerei, Käserei oder Kräutergarten leiten', 'Armenspeisung & Pilgerherberge führen', 'Theologische Studien vertiefen'],
    spezialisierung: ['Asketische Einsiedelei & tiefe Kontemplation', 'Buchmalerei auf Weltklasseniveau', 'Herstellung berühmter Klosterliköre & Arzneien', 'Prior / Stellvertreter des Abts'],
    meister: ['Abt eines Großklosters / Reichsabt', 'Herrscher über ausgedehnte Klosterländereien', 'Vertretung des Ordens beim Papst/Patriarchen', 'Leitung des monastischen Ordens']
  },
  nonne: {
    lehrling: ['Klostergelübde (Armut, Keuschheit, Gehorsam) lernen', 'Klosterküche & Wäscherei unterstützen', 'Chorgebete singen', 'Meditation im Kreuzgang'],
    geselle: ['Krankenpflege im Klosterspital', 'Unterricht von Klosterschülerinnen', 'Paramentenstickerei für Messgewänder', 'Klostergarten- & Heilkräuterpflege'],
    spezialisierung: ['Mystische Schauungen & theologische Schriften', 'Leitung des Klosterspitals oder Waisenhauses', 'Cellerarin (Wirtschaftsleiterin des Konvents)', 'Meisterhafte Buchillumination'],
    meister: ['Äbtissin des Konvents / Reichsäbtissin', 'Souveräne Vorsteherin des Damenstifts', 'Rechts- & Vermögensverwaltung des Klosters', 'Höchste geistliche Frauenwürde']
  },
  tempeldiener: {
    lehrling: ['Tempelhallen fegen & Weihbecken füllen', 'Öllampen auffüllen & Dochte trimmen', 'Opfergaben annehmen & registrieren', 'Besucherströme leiten'],
    geselle: ['Vorbereitung großer Opferrituale', 'Säuberung heiliger Reliquiare & Statuen', 'Assistent der Priesterschaft bei Liturgien', 'Tempelordnung & Ruhe durchsetzen'],
    spezialisierung: ['Verwaltung des Tempelopfer-Magazins', 'Glockendienst & Zeremonialsignalgebung', 'Geheime Wachdienste an Tempelsanktuarien', 'Führung von Pilgergruppen im Tempel'],
    meister: ['Tempelmeister / Kustos des Heiligtums', 'Gesamtleitung des weltlichen Personals des Tempels', 'Sicherheits- & Logistikdirektion des Heiligtums', 'Ausbildung von Tempeldienern']
  },
  tempelwaechter: {
    lehrling: ['Waffenhandhabung mit Tempellanze & Schild', 'Wachposten an den Tempeltoren', 'Pilger auf verbotene Gegenstände kontrollieren', 'Gelübde zur Verteidigung des Heiligtums'],
    geselle: ['Schutz heiliger Reliquien & Priester vor Entweihung', 'Verhaftung von Grabräubern & Ketzern im Tempelbezirk', 'Patrouillen durch Tempelkatakomben', 'Kampfeinsatz im Schildwall'],
    spezialisierung: ['Kampf gegen Dämonen & Untote mit geweihter Klinge', 'Personenschutz für Hohepriester', 'Verteidigung des Allerheiligsten bis zum Tod', 'Magische Resonanz mit geweihter Rüstung'],
    meister: ['Kommandant der Tempelgarde / Paladinmeister', 'Befehlsgewalt über die Streitkräfte des Glaubens', 'Mitglied des Tempelrates', 'Verteidigungsplanung aller Tempelfestungen']
  },
  hohepriester: {
    lehrling: ['Liturgische Dogmatik & Ritenlehre studieren', 'Priesterliche Weihestufen durchlaufen', 'Zeremonielle Gewänder pflegen', 'Theologische Streitfragen analysieren'],
    geselle: ['Leitung des Haupttempels der Gottheit', 'Vollzug der höchsten Staats- & Weiheopfer', 'Predigten vor Tausenden Gläubigen', 'Einsetzung neuer Priester in Ämter'],
    spezialisierung: ['Direkte Kommunikation mit der Gottheit (Offenbarungen)', 'Salbung & Krönung von Kaisern & Königen', 'Verhängung des Kirchenbanns über Herrscher', 'Leitung des obersten Glaubensgerichts'],
    meister: ['Patriarch / Groß-Hohepriester des Glaubens', 'Höchster Stellvertreter der Gottheit auf der Welt', 'Unanfechtbare theologische Unfehlbarkeit', 'Herrscher über den Kirchenstaat']
  },
  seelsorger: {
    lehrling: ['Aktives Zuhören ohne Wertung üben', 'Verschwiegenheitspflicht verinnerlichen', 'Trostgebete & Psalmen auswendig lernen', 'Krankenbett-Besuche begleiten'],
    geselle: ['Führen von Beicht- & Beratungsgesprächen', 'Trost spenden bei Trauer, Krankheit & Schuld', 'Konfliktschlichtung in Familien & Gemeinden', 'Sterbebegleitung & Letzte Ölung'],
    spezialisierung: ['Krisenseelsorge bei Kriegstraumata & Katastrophen', 'Gefängnisseelsorge bei Schwerverbrechern', 'Begleitung von Todgeweihten vor der Hinrichtung', 'Seelische Befreiung von Schuldkomplexen'],
    meister: ['Oberster Seelsorgedirektor', 'Leitung der kirchlichen Beratungs- & Hilfsdienste', 'Ausbildung von Seelsorgern & Beichtvätern', 'Persönlicher Beichtvater des Herrschers']
  },
  exorzist: {
    lehrling: ['Rituale des Rituale Romanum / Bannbuchs lernen', 'Weihwasser, Reliquien & Kruzifixe weihen', 'Erkennen von Besessenheits-Symptomen', 'Schutzkreise für den Exorzisten ziehen'],
    geselle: ['Durchführung des Kleinen & Großen Exorzismus', 'Konfrontation mit Dämonen & unreinen Geistern', 'Befreiung von Besessenen unter körperlicher Gegenwehr', 'Reinigung verfluchter Häuser & Orte'],
    spezialisierung: ['Austreibung uralter Höllenfürsten & Erzdämonen', 'Schutz vor dämonischer Vergeltung & Flüchen', 'Bannung von Dämonen in Seelengefäße', 'Erkennen dämonischer Täuschungsmanöver'],
    meister: ['Großexorzist des Heiligen Stuhls', 'Leitung des päpstlichen / kirchlichen Exorzistenkorps', 'Ausbildung geweihter Dämonenbannungsspezialisten', 'Autorität über alle okkulten Bedrohungen']
  },
  missionar: {
    lehrling: ['Fremde Sprachen & Kulturen studieren', 'Reiseausrüstung & Bibeln / Schriften packen', 'Glaubenslehre in einfachen Worten erklären', 'Wanderpredigt üben'],
    geselle: ['Reisen in ungetaufte / fremde Länder', 'Gründung neuer Missionsstationen & Kapellen', 'Taufe von Neubekehrten', 'Übersetzung heiliger Texte in Eingeborenensprachen'],
    spezialisierung: ['Missionsarbeit unter kriegerischen Stämmen', 'Diplomatische Annäherung an heidnische Fürsten', 'Aufbau von Schulen & Spitälern in Missionsgebieten', 'Märtyrerhafte Standhaftigkeit bei Verfolgung'],
    meister: ['Generalvikar für Weltmission', 'Leitung des weltweiten Missionsnetzwerks', 'Errichtung neuer Diözesen in fernen Ländern', 'Kanonisierung als Glaubensbote']
  },
  pilgerfuehrer: {
    lehrling: ['Pilgerwege & Wallfahrtsorte kartieren', 'Pilgerpässe & Muschelabzeichen ausgeben', 'Gruppenwandern & Erste Hilfe trainieren', 'Herbergsadressen führen'],
    geselle: ['Sichere Führung von Pilgergruppen über Pässe & Routen', 'Organisation von Verpflegung & Herbergen', 'Gemeinsame Andachten an Wegkreuzen & Schreinen', 'Schutz der Pilger vor Wegelagerern'],
    spezialisierung: ['Extrempilgerfahrten ins Heilige Land / durch Krisengebiete', 'Führung kranker & gebrechlicher Pilger zu Wunderquellen', 'Entdeckung verschollener Wallfahrtspfade', 'Abwicklung von Ablass- & Wallfahrtszertifikaten'],
    meister: ['Präsident der Pilgerbruderschaft', 'Gesamtorganisation kontinentaler Wallfahrtszüge', 'Verwaltung des Pilgerstraßennetzes', 'Innungsprüfung für Pilgerführer']
  },
  inquisiteur: {
    lehrling: ['Ketzergesetze & Hexenhammer studieren', 'Verhörprotokolle führen', 'Beweismittelsammlung bei Ketzereiverdacht', 'Geheimhaltung der Ermittlungen'],
    geselle: ['Untersuchung von Häresie, Hexerei & Götzendienst', 'Verhör von Verdächtigen nach kanonischem Recht', 'Überführung von Geheimkulten & Ketzernstern', 'Vorbereitung von Autodafés & Urteilsverkündung'],
    spezialisierung: ['Aufdeckung hochrangiger Ketzer im Adel & Klerus', 'Immunisierung gegen Verführung & Flüche', 'Zerschlagung staatsbedrohender Kulte', 'Letztinstanzliche Häresie-Verurteilung'],
    meister: ['Großinquisitor des Reiches', 'Leitung des Heiligen Offiziums der Inquisition', 'Unumschränkte Vollmacht zur Wahrung des Glaubens', 'Furchtgebietende Instanz über Fürsten']
  },
  kultist: {
    lehrling: ['Geheimzeichen & Erkennungssignale lernen', 'Verhüllte Roben & Masken tragen', 'Teilnahme an nächtlichen Geheimversammlungen', 'Eid des absoluten Schweigens leisten'],
    geselle: ['Vorbereitung verbotener Rituale in Krypten & Wäldern', 'Anwerbung neuer Kultmitglieder aus der Bevölkerung', 'Ausführung geheimer Kultaufträge & Sabotage', 'Anbetung finsterer Gottheiten & Wesenheiten'],
    spezialisierung: ['Leitung einer lokalen Kult-Zelle (Zirkel)', 'Kanalisierung finsterer Mächte & Flüche', 'Infiltration von Stadtverwaltung & Tempeln', 'Vollzug von Blut- & Opferritualen'],
    meister: ['Kult-Hohepriester / Avatar des Verborgenen', 'Führung des gesamten verbotenen Großkultes', 'Heraufbeschwörung von Weltuntergangs-Entitäten', 'Vollendung des Großen Plans']
  },
  eremit: {
    lehrling: ['Alleinsein in der Wildnis ertragen', 'Essbare Wurzeln & Beeren sammeln', 'Bau einer einfachen Einsiedlerklause', 'Tägliche Gebets- & Fastendisziplin'],
    geselle: ['Monatelanges Fasten & Schweigen in der Abgeschiedenheit', 'Wetterhärte & Überleben ohne weltliche Hilfe', 'Tiefe mystische Kontemplation & Naturverbundenheit', 'Ratsuchende Pilger mit Weisheit empfangen'],
    spezialisierung: ['Wundertätige Gebete & Prophezeiungen aus der Einöde', 'Zähmung wilder Tiere durch geistige Reinheit', 'Widerstand gegen dämonische Versuchungen in der Wüste', 'Geistige Schauungen göttlicher Geheimnisse'],
    meister: ['Heiliger Altvater / Wüstenvater', 'Verehrung als lebender Heiliger im ganzen Reich', 'Geistlicher Ratgeber von Päpsten & Königen', 'Legendenstatus in der Kirchengeschichte']
  },
  orakel: {
    lehrling: ['Dämpfe & heilige Quellen inhalieren', 'Tranceatmung & Bewusstseinsverschiebung', 'Rätselhafte Sprache & Metaphern lernen', 'Reinigung am Heiligtum'],
    geselle: ['Verkündung von Weissagungen in Trance', 'Deutung von Zeichen des Himmels & der Erde', 'Antworten auf Lebensfragen von Königen & Kriegern', 'Präzise Vorhersage von Schlachten & Schicksalen'],
    spezialisierung: ['Kryptische Prophezeiungen mit mehrfacher Wahrheitsebene', 'Kanalisation der direkten Stimme der Götter', 'Blick über Jahrhunderte in die Zukunft', 'Schutz vor dem Wahnsinn der Allwissenheit'],
    meister: ['Das Hohe Welt-Orakel', 'Höchste spirituelle Schauungsstätte der Welt', 'Wegweiser für den Untergang & Aufstieg von Imperien', 'Unantastbare göttliche Autorität']
  },

  // --------------------------------------------------------------------------
  // 16. ABENTEUER (abenteuer)
  // --------------------------------------------------------------------------
  abenteurer: {
    lehrling: ['Rucksack packen & Seile sichern', 'Lagerfeuer entfachen bei Nässe', 'Kartenlesen & Himmelsrichtung bestimmen', 'Grundlegende Waffenhandhabung'],
    geselle: ['Erkundung von Dungeons, Höhlen & Ruinen', 'Kampf gegen wilde Kreaturen & Räuber', 'Überleben in feindlicher Wildnis', 'Schatzbergung & Fallenvermeidung'],
    spezialisierung: ['Gruppenführung bei gefährlichen Quests', 'Überwindung extremer Gefahrenzonen (Lava, Eis, Gift)', 'Kampf gegen mythische Bestien', 'Erforschung versunkener Städte'],
    meister: ['Legendärer Heldenabenteurer', 'Vollbringung weltberühmter Heldentaten', 'Leitung kontinentaler Heldenexpeditionen', 'Eintrag in die Chroniken der Unsterblichen']
  },
  monsterjaeger: {
    lehrling: ['Monsteranatomie & Schwachstellen studieren', 'Silberklingen & Öle bereitlegen', 'Fallen & Fesseln für Ungeheuer vorbereiten', 'Bestiarium führen'],
    geselle: ['Aufspüren & Erlegen gefährlicher Monster (Ghoule, Harpyien, Wölfe)', 'Herstellung monster-spezifischer Tränke & Bomben', 'Ausweichmanöver gegen Klauen & Schwänze', 'Trophäen nehmen & Jagdprämien kassieren'],
    spezialisierung: ['Jagd auf Großmonstrositäten (Drachen, Riesen, Mantikore)', 'Immunität gegen Gift & Betörung von Monstern', 'Kampf in beengten Höhlennestern', 'Nutzung von Monsterblut für Alchemie'],
    meister: ['Großmeister der Monsterjägergilde', 'Befreiung ganzer Königreiche von Bestienplagen', 'Entwicklung neuer Jagdtechniken & Waffen', 'Ausbildung von Hexern & Jägern']
  },
  schatzsucher: {
    lehrling: ['Schatzkarten entziffern & abgleichen', 'Sondierstäbe & Schaufeln führen', 'Rätselinschriften kopieren', 'Tragetaschen für Beute sichern'],
    geselle: ['Auffinden verborgener Krypten & Schatztruhen', 'Entschärfung mechanischer Kistenschlösser & Giftnadeln', 'Wertermittlung antiker Goldmünzen & Edelsteine', 'Flucht aus einstürzenden Schatzkammern'],
    spezialisierung: ['Lokalisierung legendärer Schätze (Bundeslade, El Dorado)', 'Enträtselung arkaner Versiegelungen & Schutzbannungen', 'Tauchbergung versunkener Schatzschiffe', 'Umgehung von Flüchen auf Grabbeigaben'],
    meister: ['König der Schatzsucher', 'Entdeckung der reichsten Schätze der Weltgeschichte', 'Leitung gigantischer Bergungskonsortien', 'Eigene Schatzkammer von unschätzbarem Wert']
  },
  kopfgeldjaeger: {
    lehrling: ['Steckbriefe studieren & Gesichter merken', 'Handschellen & Fußeisen warten', 'Gassenjargon & Informantenkontakte nutzen', 'Schnelles Festnehmen üben'],
    geselle: ['Aufspüren von Gesuchten in Städten & Wildnis', 'Lebendfang durch Fangnetze, Bolas & Betäubung', 'Verhandlung mit Auftraggebern & Auszahlung', 'Widerstand gegen Bestechung & Gegenangriffe'],
    spezialisierung: ['Jagd auf gefährliche Mörder, Bandenbosse & Magier', 'Grenzübertritt & Auslieferung über Landesgrenzen', 'Verhör gefangener Verbrecher nach Verstecken', 'Kopfgeldjagd unter extremen Bedingungen'],
    meister: ['Großmeister der Kopfgeldjägergilde', 'Ergreifung der meistgesuchten Staatsfeinde', 'Unfehlbare Erfolgsquote bei allen Aufträgen', 'Innungsprüfung für Kopfgeldjäger']
  },
  dungeonforscher: {
    lehrling: ['Fackeln & Laternenöl rationieren', 'Kreidemarkierungen an Weggabelungen setzen', 'Dungeonkarten im Gehen zeichnen', 'Schritte & Abstände zählen'],
    geselle: ['Sichere Fortbewegung in unterirdischen Labyrinthen', 'Erkennung versteckter Türen & Geheimräume', 'Fallenvermeidung (Druckplatten, Fallbeile)', 'Ressourcenmanagement bei tagelangen Abstiegen'],
    spezialisierung: ['Erforschung tiefster Megadungeons & Weltenrisse', 'Überwindung dimensionaler Dungeon-Anomalien', 'Kartierung unerforschter Tiefensysteme', 'Sichere Evakuierung verletzter Gefährten'],
    meister: ['Dungeon-Pionier & Großkartograph der Tiefe', 'Vollständige Erkundung mythischer Unterwelten', 'Leitung imperialer Dungeon-Ausgrabungen', 'Ausbildung im Dungeonwesen']
  },
  ruinenforscher: {
    lehrling: ['Trümmer & Einsturzgefahren beurteilen', 'Kletterseile an Felsspornen befestigen', 'Antike Reliefs mit Kohle abpausen', 'Bodenproben in Ruinen nehmen'],
    geselle: ['Erkundung verfallener Tempel, Burgen & Urstädte', 'Entzifferung archaischer Wandinschriften', 'Sicherung instabiler Mauerwerke vor dem Betreten', 'Bergung historischer Relikte aus Ruinen'],
    spezialisierung: ['Erforschung versunkener Hochkulturen & Titanenstädte', 'Bannung uralter Geister & Flüche in Ruinen', 'Rekonstruktion antiker Mechanismen & Portale', 'Expeditionen in Dschungelruinen & Wüstenstädte'],
    meister: ['Chef-Ruinenforscher der Krone', 'Entdeckung legendärer verlorener Metropolen', 'Herausgabe der Enzyklopädie antiker Reiche', 'Ausbildung im Ruinenforschungsdienst']
  },
  kundschafter: {
    lehrling: ['Lautloses Bewegen in jedem Terrain', 'Geländeskizzen anfertigen', 'Fernrohre & Ferngläser bedienen', 'Schnelle Berichterstattung üben'],
    geselle: ['Vorausaufklärung unbekannter Landstriche', 'Aufspüren von Trinkwasserquellen & Pässen', 'Erkennung feindlicher Stellungen ohne Entdeckung', 'Sichere Rückführung der Hauptgruppe'],
    spezialisierung: ['Kundschaften in extrem lebensfeindlichen Gebieten', 'Infiltration feindlicher Grenzfestungen', 'Nacht- & Nebelaufklärung', 'Markierung optimaler Angriffs- & Rückzugswege'],
    meister: ['Chef-Kundschafter der Abenteurergilde', 'Pionierführung großer Eroberungs- & Forschungszüge', 'Erstellung der ersten Gesamtkarten neuer Kontinente', 'Ausbildung von Kundschaftern']
  },
  soeldner: {
    lehrling: ['Waffen & Rüstung einsatzbereit halten', 'Soldverträge lesen & verstehen', 'Marschdisziplin im Söldnerhaufen', 'Befehle des Hauptmanns befolgen'],
    geselle: ['Kämpfen für den Meistbietenden in Kriegen & Fehden', 'Disziplinierter Zusammenhalt in Söldnerregimentern', 'Erprobter Umgang mit Schwert, Pike & Armbrust', 'Plünderung & Beuteverteilung nach Vertrag'],
    spezialisierung: ['Führung einer Söldnerrotte / Fähnleins', 'Spezialist für Sturmangriffe & Belagerungen', 'Söldnerdienst für Könige & Republiken', 'Kavallerie- oder Scharfschützen-Söldnertum'],
    meister: ['Condottiere / Söldnergeneral', 'Befehlsgewalt über eine eigene Privatarmee', 'Vertragsverhandlungen mit Kaisern & Päpsten', 'Einflussreicher Kriegsunternehmer']
  },
  expeditionsteilnehmer: {
    lehrling: ['Expeditionskisten packen & wiegen', 'Zelte bei Sturm aufbauen', 'Proviant rationieren & kontrollieren', 'Logbuch der Expedition führen'],
    geselle: ['Teilnahme an gefährlichen Fernreisen & Expeditionen', 'Überleben in fremden Klimazonen (Dschungel, Polar, Wüste)', 'Unterstützung von Wissenschaftlern & Leitern', 'Verteidigung des Lagers gegen wilde Kreaturen'],
    spezialisierung: ['Stellvertretender Expeditionsleiter', 'Spezialist für alpine Hochtouren & Dschungelquerung', 'Bergungslogistik bei extremen Wetterereignissen', 'Erstkontakt mit indigenen Völkern'],
    meister: ['Expeditionsleiter & Entdeckerlegende', 'Leitung weltverändernder Entdeckungsreisen', 'Benennung neuer Gebirge, Ströme & Länder', 'Mitglied der königlichen Geographen-Elite']
  },
  monsterkundiger: {
    lehrling: ['Monsterbeschreibungen katalogisieren', 'Klauen-, Huf- & Bissspuren zeichnen', 'Geruchs- & Verhaltensnotizen anlegen', 'Bestiarium studieren'],
    geselle: ['Bestimmung von Monsterart, Stärke & Schwachstellen', 'Beratung von Jägern & Armeen vor dem Gefecht', 'Identifikation von Monstergiften & Resistenzen', 'Erforschung von Fortpflanzung & Brutstätten'],
    spezialisierung: ['Kryptobiologie extrem seltener legendärer Bestien', 'Zähmung & Dressur junger Monsterspezies', 'Erforschung magischer Mutationen & Chimären', 'Entwicklung neuer Abwehrmittel gegen Ungeheuer'],
    meister: ['Großmeister des Bestiariums & Hof-Monsterologe', 'Verfasser des allumfassenden Monsterlexikons', 'Leitung der königlichen Menagerie für Bestien', 'Höchste Autorität für magische Fauna']
  },
  ueberlebenskuenstler: {
    lehrling: ['Feuerbohren mit Hölzern', 'Notunterkunft aus Ästen & Laub bauen', 'Trinkwasser aus Pflanzen & Tau gewinnen', 'Essbare Insekten & Wurzeln kennen'],
    geselle: ['Überleben in der Wildnis ohne jegliche Ausrüstung', 'Orientierung nach Sternen, Moos & Windrichtung', 'Herstellung primitiver Waffen & Werkzeuge', 'Erste Hilfe mit Naturheilmitteln'],
    spezialisierung: ['Extremüberleben in Eiswüsten, Vulkanzonen & Sümpfen', 'Verstecken vor Verfolgern in der Natur', 'Überleben bei schweren Verletzungen & Vergiftungen', 'Führung von Überlebensgruppen durch Krisen'],
    meister: ['Großmeister des Überlebens / Naturbeherrscher', 'Überwindung tödlichster Todeszonen der Welt', 'Ausbilder für Spezialkräfte & Elite-Abenteurer', 'Legendenstatus des unbezwingbaren Überlebenden']
  },
  fallenentschaerfer: {
    lehrling: ['Fallenmechanismen zeichnen & studieren', 'Spannfäden & Stolperdrähte ertasten', 'Spezialwerkzeuge (Spiegel, Pinzetten) pflegen', 'Sicherheitsabstand halten'],
    geselle: ['Entschärfung mechanischer Fallen (Fallgruben, Pfeilfallen)', 'Blockieren von Druckplatten & Fallbeilen', 'Durchtrennen von Auslösedrähten ohne Auslösung', 'Warnung der Gruppe vor versteckten Gefahren'],
    spezialisierung: ['Entschärfung arkaner Runen- & Teleportfallen', 'Demontage komplexer Uhrenwerk- & Säurefallen', 'Fallenentschärfung unter Zeitdruck / im Gefecht', 'Wiederverwendung & Scharfschalten fremder Fallen'],
    meister: ['Meisterentschärfer & Falleningenieur', 'Überwindung der tödlichsten Grabmalsicherungen', 'Konstruktion uneinnehmbarer Fallensysteme', 'Ausbildung im Entschärfungshandwerk']
  }
};
