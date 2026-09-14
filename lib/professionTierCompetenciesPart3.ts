// ============================================================================
// ADVENTUREFORGE BERUFS-FACHKOMPETENZEN NACH STUFEN - TEIL 3
// 9. Verwaltung
// 10. Militär
// 11. Seefahrt
// 12. Kriminalität
// ============================================================================

import { JobTierCompetencySet } from './professionTierCompetenciesPart1';

export const PART3_COMPETENCIES: Record<string, JobTierCompetencySet> = {
  // --------------------------------------------------------------------------
  // 9. VERWALTUNG (verwaltung)
  // --------------------------------------------------------------------------
  schreiber: {
    lehrling: ['Federkiele schneiden & Tinte mischen', 'Reinschrift & Schönschrift üben', 'Pergament glätten & linieren', 'Abschriften nach Diktat anfertigen'],
    geselle: ['Urkunden & Verträge fehlerfrei verfassen', 'Siegelwachs anbringen & Petschaften drücken', 'Kopieren juristischer Schriftstücke', 'Kurrent- & Frakturschrift beherrschen'],
    spezialisierung: ['Kalligraphische Prunkurkunden mit Initialen', 'Urkundenprüfung auf Fälschungsmerkmale', 'Verschlüsselte Kanzleicodes schreiben', 'Lateinische & fremdsprachige Verträge'],
    meister: ['Kanzleischreiber-Meister', 'Leitung der herrschaftlichen Schreibstube', 'Siegelbewahrer der Kanzlei', 'Ausbildung im Schreibereiwesen']
  },
  stadtschreiber: {
    lehrling: ['Ratsprotokolle abschreiben', 'Bürgeranfragen sortieren', 'Stadtsiegel bereitlegen', 'Stadtarchiv-Register führen'],
    geselle: ['Ratssitzungen protokollieren', 'Stadtrechte & Satzungen ausformulieren', 'Bürgerbriefe & Gewerbebewilligungen ausstellen', 'Amtliche Bekanntmachungen verfassen'],
    spezialisierung: ['Rechtliche Beratung des Bürgermeisters', 'Verhandlungsprotokolle mit Fürsten & Nachbarstädten', 'Verwaltung des städtischen Urkundenarchivs', 'Redaktion der Stadtchronik'],
    meister: ['Erster Stadtsyndikus & Chefjurist', 'Höchster Beamter der Stadtverwaltung', 'Vertretung der Stadt vor Reichsgerichten', 'Herausgabe des Stadtgesetzbuches']
  },
  sekretaer: {
    lehrling: ['Terminkalender führen', 'Postausgang & Eingang erfassen', 'Boten beauftragen', 'Schreibtisch & Dokumente ordnen'],
    geselle: ['Korrespondenz im Auftrag des Dienstherrn führen', 'Besprechungen vorbereiten & nachbereiten', 'Diskrete Vorprüfung von Bittstellern', 'Reiseorganisation & Spesenverwaltung'],
    spezialisierung: ['Privatsekretär von Ministern & Monarchen', 'Entwurf geheimer diplomatischer Schreiben', 'Krisenkommunikation & Terminabwehr', 'Verwaltung geheimer Finanzen'],
    meister: ['Chef des persönlichen Stabes / Kabinettschef', 'Mächtigster Berater im Vorzimmer der Macht', 'Koordination aller Ministerien & Ämter', 'Ausbildung im Sekretariatsdienst']
  },
  buchhalter: {
    lehrling: ['Zahlenkolonnen addieren', 'Kassenbelege abheften', 'Währungsumrechnungen durchführen', 'Haupt- & Nebenbücher säubern'],
    geselle: ['Doppelte Buchführung (Soll und Haben)', 'Monats- & Jahresabschlüsse erstellen', 'Kassenprüfung & Soll-Ist-Vergleich', 'Steuern & Abgaben berechnen'],
    spezialisierung: ['Forensische Buchprüfung & Betrugsaufdeckung', 'Budgetplanung für Großunternehmen & Staaten', 'Kostenrechnung & Rentabilitätsanalysen', 'Zolltarif- & Steueroptimierung'],
    meister: ['Oberfinanzprüfer & Chef-Revisor', 'Finanzdirektion von Handelsimperien & Reichen', 'Entwicklung moderner Rechnungslegungssysteme', 'Ausbildung beeidigter Buchprüfer']
  },
  verwalter: {
    lehrling: ['Inventarlisten aktualisieren', 'Pachtverträge ablegen', 'Objektbegehungen protokollieren', 'Handwerkerrechnungen prüfen'],
    geselle: ['Liegenschaften & Landgüter wirtschaftlich führen', 'Pachtzinsen pünktlich einfordern', 'Instandhaltungsmaßnahmen beauftragen', 'Personal auf Gütern anleiten'],
    spezialisierung: ['Gesamtverwaltung herrschaftlicher Großdomänen', 'Krisenmanagement bei Missernten & Schäden', 'Rechtliche Pachtstreitigkeiten schlichten', 'Ertragssteigerung landwirtschaftlicher Flächen'],
    meister: ['Oberster Güterdirektor / Kammerpräsident', 'Finanz- & Sachhoheit über alle Krongüter', 'Präsidium der Vermögensverwaltung', 'Innungsprüfung für Gutsverwalter']
  },
  beamter: {
    lehrling: ['Verwaltungsvorschriften memorieren', 'Aktenzeichen vergeben & ablegen', 'Formulare ausgeben & stempeln', 'Dienstzeiten peinlich einhalten'],
    geselle: ['Anträge nach Recht & Gesetz bearbeiten', 'Bescheide rechtssicher erlassen', 'Bürgerberatung & Amtsauskünfte', 'Durchsetzung von behördlichen Auflagen'],
    spezialisierung: ['Leitung eines städtischen Amtsreferats', 'Verwaltungsreform & Prozessoptimierung', 'Disziplinaraufsicht über nachgeordnete Stellen', 'Gesetzesfolgenabschätzung'],
    meister: ['Ministerialrat & Behördenleiter', 'Staatsdienstleitung eines Ressorts', 'Ausarbeitung neuer Reichsgesetze', 'Prüfungsvorsitz für den höheren Staatsdienst']
  },
  steuereintreiber: {
    lehrling: ['Steuerlisten tragen & vergleichen', 'Einnahmen zählen & in Truhen sichern', 'Zahlungsquittungen ausstellen', 'Schutzbegleitung anfordern'],
    geselle: ['Steuerschätzungen nach Vermögen durchführen', 'Eintreibung fälliger Zehnten, Zölle & Kopfsteuern', 'Pfändungen bei Zahlungsverzug vollstrecken', 'Deeskalation bei wütenden Steuerzahlern'],
    spezialisierung: ['Aufspüren von Schwarzgeld & Steuerhinterziehung', 'Eintreibung in rebellischen Provinzen mit Eskorte', 'Spezialabgaben auf Luxusgüter & Handel', 'Schattenbuchhaltung entlarven'],
    meister: ['Großsteuermeister / Oberfinanzdirektor', 'Reichsweite Steuererhebungsreform', 'Finanzierung des königlichen Staatshaushalts', 'Oberste Finanzgerichtsbarkeit']
  },
  zollbeamter: {
    lehrling: ['Schranken an Grenzübergängen bedienen', 'Wagenladungen wiegen & messen', 'Zolltariftafeln ablesen', 'Zollquittungen stempeln'],
    geselle: ['Warenbeschau & Frachtbriefkontrolle', 'Zollabgaben nach Warenart berechnen', 'Beschlagnahmung nicht deklarierter Schmuggelware', 'Grenzabsperrung bei Nacht & Alarm'],
    spezialisierung: ['Hafen- & Seerechtszollkontrollen', 'Aufspüren doppelter Böden in Karren & Kisten', 'Prüfung von Geleit- & Freihandelsprivilegien', 'Zollfahndung & Razzien'],
    meister: ['Oberzollinspektor & Grenzschutzdirektor', 'Leitung des gesamten Grenzzollwesens', 'Aushandlung bilateraler Zollabkommen', 'Ausbildung im Zolldienst']
  },
  zoellner: {
    lehrling: ['Brückenzoll kassieren', 'Münzen in Kasse werfen', 'Wegweiser & Zolltafeln sauber halten', 'Widerstand an Wachposten melden'],
    geselle: ['Wegezoll & Torsperre zuverlässig erheben', 'Kontrolle von Durchgangsreisenden & Händlern', 'Falschmünzer & Zechpreller festhalten', 'Kassenabrechnung am Tagesende'],
    spezialisierung: ['Flusszollstationen auf Booten & Wehren leiten', 'Zollerleichterungen für Gilden prüfen', 'Zollabgabe auf Schüttgüter & Vieh berechnen', 'Eigensicherung gegen Überfälle an Zollstationen'],
    meister: ['Zollstation-Kommandant & Pächter', 'Verwaltung lukrativer Reichszollstellen', 'Zolleinnahmen-Pachtverträge verhandeln', 'Innungsprüfung Zöllnergewerbe']
  },
  richter: {
    lehrling: ['Gesetzestexte & Kommentare studieren', 'Gerichtsprotokolle vorbereiten', 'Zeugen vorladen', 'Gerichtssaalordnung sichern'],
    geselle: ['Zivil- & Strafprozesse leiten', 'Beweiswürdigung & Zeugenbefragung', 'Urteile nach geltendem Recht fällen', 'Strafmaße & Schadenersatz festlegen'],
    spezialisierung: ['Hochgerichtsbarkeit (Blutgericht / Todesstrafe)', 'Adels- & Lehnsgerichtsverfahren', 'Handels- & Seerechtskammer leiten', 'Verfassungs- & Staatsgerichtsurteile'],
    meister: ['Oberster Richter am Reichsgericht', 'Höchste juristische Instanz des Landes', 'Letztinstanzliche Urteile im Namen der Krone', 'Reformierung des nationalen Gesetzbuches']
  },
  gerichtsschreiber: {
    lehrling: ['Gerichtsakten binden & nummerieren', 'Zeugenaussagen wortgetreu mitschreiben', 'Gerichtsurkunden stempeln', 'Vorladungen austragen'],
    geselle: ['Verhandlungsprotokolle rechtssicher führen', 'Urteilsbegründungen formulieren', 'Vollstreckungsbefehle ausfertigen', 'Einsichtnahme in Prozessakten gewähren'],
    spezialisierung: ['Geheime Inquisitions- & Hochverratsprotokolle', 'Historische Grundbuch- & Erbstreitakten aufarbeiten', 'Beweismittelarchivierung mit Fälschungsschutz', 'Eidesabnahmen beurkunden'],
    meister: ['Oberster Gerichtsschreiber / Kanzleidirektor', 'Leitung der gesamten Justizverwaltung', 'Archivierung wegweisender Präzedenzfälle', 'Ausbildung von Justizbeamten']
  },
  notar: {
    lehrling: ['Vertragsvorlagen abschreiben', 'Siegel & Stempel pflegen', 'Testamentsakten registrieren', 'Personalien von Klienten prüfen'],
    geselle: ['Testamente, Kaufverträge & Schenkungen beurkunden', 'Rechtliche Belehrung der Parteien durchführen', 'Echtheit von Unterschriften beglaubigen', 'Hinterlegungen von Wertsachen verwalten'],
    spezialisierung: ['Internationale Handels- & Staatsverträge', 'Eheverträge & Erbfolge des Hochadels', 'Stiftungs- & Treuhandverwaltung', 'Beglaubigung staatsrelevanter Verträge'],
    meister: ['Kaiserlich / Königlich privilegierter Notar', 'Präsident der Notarkammer', 'Unanfechtbare Beurkundungshoheit', 'Ausbildung im Notariatswesen']
  },
  gesandter: {
    lehrling: ['Diplomatisches Protokoll lernen', 'Reisegepäck & Beglaubigungsschreiben sichern', 'Fremde Höflichkeitsfloskeln üben', 'Berichte an die Heimat verfassen'],
    geselle: ['Offizielle Botschaften an fremden Höfen vortragen', 'Vertretung der Interessen des Herrschers', 'Stimmungsberichte über fremde Politik liefern', 'Teilnahme an diplomatischen Empfängen'],
    spezialisierung: ['Friedens- & Waffenstillstandsverhandlungen', 'Aushandlung von Heiratsbündnissen der Krone', 'Geheime Vorverhandlungen bei Konflikten', 'Diplomatische Immunität durchsetzen'],
    meister: ['Außerordentlicher Botschafter & Generalgesandter', 'Leitung ständiger Gesandtschaften in Großmächten', 'Gestaltung internationaler Vertragswerke', 'Höchster Rang im diplomatischen Dienst']
  },
  diplomat: {
    lehrling: ['Fremdsprachen & Etikette perfektionieren', 'Geheime Chiffren memorieren', 'Gästelisten für Bankette analysieren', 'Emissärspapiere vorbereiten'],
    geselle: ['Schlichtung internationaler Zwischenfälle', 'Allianzen & Handelsabkommen aushandeln', 'Subtile Einflussnahme auf fremde Berater', 'Vermeidung von Kriegsausbrüchen'],
    spezialisierung: ['Multilaterale Friedenskongresse dirigieren', 'Geheimdiplomatie & Spionagenetzwerke einbinden', 'Krisenintervention bei Thronfolgestreitigkeiten', 'Sanktionen & Embargos verhandeln'],
    meister: ['Reichsaußenminister / Großkanzler der Diplomatie', 'Architekt des kontinentalen Friedenssystems', 'Königlicher Chefberater für Geopolitik', 'Leitung der Diplomatischen Akademie']
  },
  kanzleimitarbeiter: {
    lehrling: ['Postverteilung in der Kanzlei', 'Druckplatten reinigen & Dokumente pressen', 'Aktenmappen sortieren', 'Stempelfarbe auffüllen'],
    geselle: ['Erlasse, Dekrete & Verordnungen ausfertigen', 'Kanzleiregister akribisch führen', 'Bürgeranliegen an zuständige Referate leiten', 'Archivierungsfristen überwachen'],
    spezialisierung: ['Geheime Staatskanzlei für Hochverrat & Spionage', 'Koordination zwischen Ministerien & Fürstenhöfen', 'Redaktion amtlicher Gesetzblätter', 'Kanzleisicherheitsmanagement'],
    meister: ['Kanzleidirektor & Büroleiter des Kabinetts', 'Gesamtorganisation des ministeriellen Apparats', 'Dienstaufsicht über hunderte Kanzleikräfte', 'Staatsorganisationsreform']
  },
  bibliothekar: {
    lehrling: ['Bücher entstauben & einsortieren', 'Signaturschilder beschriften', 'Rückgabefristen kontrollieren', 'Lesepulte säubern'],
    geselle: ['Katalogisierung nach Wissensgebieten', 'Buchbestände pflegen & Lederbände wachsen', 'Recherchehilfe für Forscher & Studenten', 'Bestandsaufbau & Erwerb neuer Schriften'],
    spezialisierung: ['Konservierung seltener Handschriften & Papyri', 'Verwaltung verbotener / arkaner Buchbestände (Giftkabinett)', 'Entzifferung unleserlicher Schriften', 'Handschriftenrestaurierung'],
    meister: ['Präfekt der Königlichen Nationalbibliothek', 'Leitung der größten Wissensspeicher der Welt', 'Rückgewinnung verschollener Universalwerke', 'Ausbildung im Bibliothekswesen']
  },
  archivist: {
    lehrling: ['Kisten mit alten Dokumenten inventarisieren', 'Klima im Archivgewölbe überwachen', 'Schimmel & Ungeziefer fernhalten', 'Findmittel abtippen'],
    geselle: ['Systematische Erschließung historischer Aktenbestände', 'Rechtssichere Aktenaussonderung & Vernichtung', 'Erstellung detaillierter Findbücher & Indices', 'Auskunftserteilung bei Rechts- & Erbansprüchen'],
    spezialisierung: ['Rekonstruktion zerstörter/verbrannter Archive', 'Verwaltung geheimer Kronarchive & Staatsverträge', 'Paläographische Transkription ältester Urkunden', 'Archivsicherheit gegen Einbruch & Spionage'],
    meister: ['General-Archivdirektor des Reiches', 'Herr über alle historischen Akten des Staates', 'Beglaubigung uralter Herrschaftsansprüche', 'Lehre an Archivschulen']
  },
  statthalter: {
    lehrling: ['Provinzberichte studieren', 'Befehlsketten der Verwaltung kennenlernen', 'Militärische & zivile Lageberichte analysieren', 'Provinzinspektion vorbereiten'],
    geselle: ['Zivile Verwaltung einer Stadt / Region leiten', 'Rechtsordnung & Sicherheit vor Ort garantieren', 'Steuerabführung an die Krone sicherstellen', 'Schlichtung lokaler Adelsfehden'],
    spezialisierung: ['Befriedung unruhiger / eroberter Provinzen', 'Autonome Kriegs- & Notstandsbefugnisse ausüben', 'Große Infrastrukturprojekte (Straßen, Häfen) leiten', 'Diplomatische Sonderbevollmächtigung'],
    meister: ['Reichsstatthalter / Vizekönig einer Großprovinz', 'Uneingeschränkte Regentschaft im Namen der Krone', 'Oberbefehl über alle regionalen Truppen', 'Direkter Repräsentant des Monarchen']
  },
  herold: {
    lehrling: ['Stimmübungen für weite Plätze', 'Wappenfarben & Heraldikregeln lernen', 'Fanfarenbläser koordinieren', 'Wappenröcke pflegen'],
    geselle: ['Königliche Proklamationen öffentlich verlesen', 'Turniere ausrufen & Ritterwappen prüfen', 'Kriegserklärungen & Waffenruhen überbringen', 'Ahnentafeln & Adelsgeschlechter verifizieren'],
    spezialisierung: ['Turnierleitung & Schiedsrichterwesen im Ritterturnier', 'Diplomatische Immunität auf Schlachtfeldern wahren', 'Offizieller Wappenprüfer & Wappenverleiher', 'Zeremonielle Krönungsansagen'],
    meister: ['Oberster Reichsherold / Wappenkönig', 'Präsident des Heroldsamtes der Krone', 'Führung der Reichswappenrolle', 'Höchste Autorität im ritterlichen Ehrenkodex']
  },
  zeremonienmeister: {
    lehrling: ['Sitzordnungen nach Ranglisten prüfen', 'Kerzenbeleuchtung & Blumenschmuck timen', 'Gästeankunft protokollieren', 'Verbeugungs- & Knickswinkel üben'],
    geselle: ['Reibungsloser Ablauf höfischer Feste & Bälle', 'Durchsetzung der Hofrangordnung ohne Fehler', 'Präsentation von Geschenken an den Herrscher', 'Koordination von Musik, Speisen & Reden'],
    spezialisierung: ['Krönungs-, Hochzeits- & Begräbniszeremonien', 'Staatsbesuche fremder Monarchen dirigieren', 'Deeskalation diplomatischer Protokollpannen', 'Exklusive Rituale des Hochadels inszenieren'],
    meister: ['Groß-Zeremonienmeister des Königshofes', 'Höchster Wächter über das Hofprotokoll', 'Regisseur imperialer Prunkinszenierungen', 'Ausbildung im Zeremonialwesen']
  },
  hofmarschall: {
    lehrling: ['Hofetats kontrollieren', 'Palastwachen-Dienstpläne abgleichen', 'Lieferanten für Hofbedarf überprüfen', 'Reiseplanung des Hofstaates unterstützen'],
    geselle: ['Wirtschaftliche & personelle Leitung des Hofstaats', 'Sicherheit & Ordnung im Palast garantieren', 'Hofgerichtsbarkeit über Bedienstete ausüben', 'Disziplinaraufsicht über Adelige bei Hofe'],
    spezialisierung: ['Gesamtlogistik königlicher Hofumzüge & Reisen', 'Sicherheitskonzepte bei Attentatsdrohungen', 'Verwaltung des gesamten fürstlichen Haushaltsbudgets', 'Koordination zwischen Militär & Hofstaat'],
    meister: ['Obersthofmarschall / Palastkanzler', 'Höchster Würdenträger des Hofstaats', 'Alleinige administrative Palasthoheit', 'Engster Vertrauter & Vollstrecker des Monarchen']
  },

  // --------------------------------------------------------------------------
  // 10. MILITÄR (militaer)
  // --------------------------------------------------------------------------
  soldat: {
    lehrling: ['Marschordnung & Gleichschritt', 'Waffen reinigen & schleifen', 'Zeltbau & Graben ziehen', 'Befehlsgehorsam unter Stress'],
    geselle: ['Formationskampf mit Schild & Speer', 'Nahkampf mit Schwert & Schild', 'Wachdienst & Wachwechsel', 'Taktischer Rückzug & Vorstoß'],
    spezialisierung: ['Sturmtruppen-Nahkampf', 'Nachtangriffe & Grabenkämpfe', 'Veteranen-Standhaftigkeit gegen Kavallerie', 'Umgang mit Spezialwaffen (Zweihänder, Hellebarde)'],
    meister: ['Feldwebel / Veteranenführer', 'Ausbildung von Rekruten & Gesellen', 'Führung von Stoßtrupps in der Schlacht', 'Ehrenabzeichen für Tapferkeit']
  },
  gardist: {
    lehrling: ['Strammstehen & Paradeübungen', 'Wachposten an Toren & Türen', 'Galauniformen pflegen', 'Passkontrollen an Palasteingängen'],
    geselle: ['Personenschutz für hochrangige Würdenträger', 'Deeskalation & Verhaftungen im Palastbereich', 'Präziser Formationsdrill mit Hellebarde', 'Nachtpatrouillen in Residenzen'],
    spezialisierung: ['Leibwache des Monarchen im Nahkampf', 'Aufspüren verdeckter Attentäter im Saal', 'Abriegelung von Palastflügeln bei Alarm', 'Kampf in engen Schlosskorridoren'],
    meister: ['Gardekapitän & Palastkommandant', 'Gesamtverantwortung für die Sicherheit des Königs', 'Elite-Rekrutierung & Drill der Garde', 'Mitglied des obersten Kriegsrats']
  },
  stadtwache: {
    lehrling: ['Rundgänge in zugewiesenen Vierteln', 'Laternen & Trillerpfeifen führen', 'Bettler & Trunkenbolde zurechtweisen', 'Verhaftete in den Kerker bringen'],
    geselle: ['Stadttore bei Alarm schließen & verteidigen', 'Raufereien & Tavernenstreitigkeiten beenden', 'Tatortsicherung & Verdächtigenverfolgung', 'Durchsetzung von Ausgangssperren & Marktordnungen'],
    spezialisierung: ['Aufdeckung illegaler Spielhöllen & Hehlernester', 'Aufruhrbekämpfung bei Bürgeraufständen', 'Hafen- & Rotlichtviertel-Sicherheit', 'Verhör & Geständnisaufnahme'],
    meister: ['Stadtwachhauptmann & Polizeidirektor', 'Gesamte Sicherheitsstrategie der Stadt', 'Koordination mit Stadtrat & Henker', 'Ausbildung im Stadtwachdienst']
  },
  grenzwaechter: {
    lehrling: ['Grenzsteine abgehen', 'Wachtürme & Signalfackeln warten', 'Witterungsfeste Kleidung pflegen', 'Grenzübertritte im Buch notieren'],
    geselle: ['Aufspüren illegaler Grenzgänger & Schmuggler', 'Besetzung & Verteidigung von Grenzkastellen', 'Fernaufklärung feindlicher Truppenbewegungen', 'Signalfeuerketten entzünden'],
    spezialisierung: ['Grenzschutz in extremem Hochgebirge / Sumpf', 'Hinterhalte an Schleichwegen legen', 'Verhör gefangener feindlicher Späher', 'Grenzvertragskontrolle mit Nachbarreichen'],
    meister: ['Grenzkommandant & Festungsvogt', 'Verteidigungsplanung ganzer Grenzabschnitte', 'Befehlsgewalt über Wachturmlinien', 'Ausbildung von Grenzjägern']
  },
  bogenschuetze: {
    lehrling: ['Bogen wachsen & Sehnen spannen', 'Pfeile befiedern & Spitzen kleben', 'Haltung & Atmung beim Zielen', 'Zielscheibentraining auf 20-50 Schritt'],
    geselle: ['Präzisionsschuss auf weite Distanz (150+ Schritt)', 'Schnellschussfolgen (10 Pfeile pro Minute)', 'Volleyschüsse in Formation über Hindernisse', 'Nutzung von Brand- & Signalpfeilen'],
    spezialisierung: ['Scharfschuss auf bewegte Offiziere & Reiter', 'Panzerbrechende Jagd mit schweren Langbögen', 'Nachtschüsse nach Gehör', 'Meisterschuss bei Sturm & Regen'],
    meister: ['Oberster Bogenmeister & Schützenhauptmann', 'Taktischer Einsatz von Schützenregimentern', 'Entwicklung legendärer Komposit- & Langbögen', 'Innungsprüfung Bogenkunst']
  },
  armbrustschuetze: {
    lehrling: ['Spannhebel / Winde bedienen', 'Bolzen sortieren & Spitzen fetten', 'Nuss & Abzugshebel ölen', 'Sicherheitsrast prüfen'],
    geselle: ['Treffsichere Bolzenschüsse auf Plattenpanzer', 'Schilddeckung (Pavese) aufbauen & nutzen', 'Schnelles Nachladen mit Flaschenzugwinde', 'Schuss durch Schießscharten bei Belagerungen'],
    spezialisierung: ['Schwere Wall- & Hakenarmbrüste bedienen', 'Präzisionsschuss auf Visiere & Gelenke', 'Schuss mit Gift- & Sprengbolzen', 'Scharfschütze bei Festungsverteidigung'],
    meister: ['Armbrustkompanie-Kommandant', 'Ballistische Berechnung für Belagerungsabwehr', 'Ausrüstung & Fertigung von Elite-Armbrüsten', 'Ausbildung im Armbrustschießwesen']
  },
  spaeher: {
    lehrling: ['Tarnkleidung anfertigen & anpassen', 'Lautloses Kriechen im Gras', 'Himmelsrichtungen nach Sternen bestimmen', 'Meldungen präzise auswendig lernen'],
    geselle: ['Infiltration feindlicher Linien', 'Zählung & Aufstellung feindlicher Truppen', 'Gefahrenlose Rückkehr & Lagebericht', 'Nutzung von Geländevorteilen zur Beobachtung'],
    spezialisierung: ['Späheinsätze tief im Feindesland', 'Sabotage von Vorratslagern & Brunnen', 'Gefangennahme feindlicher Offiziere zur Befragung', 'Überleben in feindlicher Wildnis ohne Spuren'],
    meister: ['Chefaufklärer des Heeresstabes', 'Strategische Feindaufklärung vor Entscheidungsschlachten', 'Leitung des Späherkorps', 'Ausbildung im Fernspäherwesen']
  },
  aufklaerer: {
    lehrling: ['Kartenzeichen & Geländeskizzen zeichnen', 'Entfernungen mit Daumensprung schätzen', 'Beobachtungsfernrohre bedienen', 'Meldereiter einweisen'],
    geselle: ['Topographische Erkundung von Schlachtfeldern', 'Erkennung von Hinterhalten & getarnten Truppen', 'Passierbarkeit von Flüssen, Sümpfen & Wäldern prüfen', 'Schnelle schriftliche Meldungsübermittlung'],
    spezialisierung: ['Luft- oder Hochlagen-Aufklärung', 'Aufklärung bei Nacht & Nebel', 'Vorausabteilung für Kavallerieverbände', 'Taktische Bewertung feindlicher Befestigungen'],
    meister: ['Leiter des militärischen Nachrichtendienstes', 'Erstellung umfassender Lagebilder für den Generalstab', 'Strategische Operationsplanung', 'Ausbildung von Heeresaufklärern']
  },
  belagerungstechniker: {
    lehrling: ['Katapultseile flechten & drillen', 'Munition (Felsbrocken, Teertöpfe) wiegen', 'Winden & Zahnräder schmieren', 'Baustellenabsicherung vor Geschossen'],
    geselle: ['Aufbau von Trebuchets, Mangoneln & Rammböcken', 'Ballistische Winkel- & Reichweitenberechnung', 'Beschuss von Burgmauern & Zinnen koordinieren', 'Bau von Belagerungstürmen & Schanztunneln'],
    spezialisierung: ['Präzisionsbeschuss zur Breschebildung', 'Konstruktion feuerfester Belagerungswerke', 'Unterminierung von Festungsmauern mit Sprengminen', 'Gegen-Artillerie (Anti-Katapult-Beschuss)'],
    meister: ['Großmeister der Belagerungskunst / General-Ingenieur', 'Einnahme unbezwingbarer Festungen planen', 'Konstruktion monumentaler Kriegsmaschinen', 'Lehre an der Artillerieakademie']
  },
  ingenieur: {
    lehrling: ['Technische Zeichnungen kopieren', 'Vermessungsketten führen', 'Baumaterialien auf Tragfähigkeit testen', 'Rechenschieber & Tabellen nutzen'],
    geselle: ['Bau von Schanzen, Pontonbrücken & Feldbefestigungen', 'Konstruktion von Hebegeräten & Wassermühlen', 'Statische Berechnungen für Wehranlagen', 'Kanalisation & Drainage im Heerlager'],
    spezialisierung: ['Planung uneinnehmbarer Sternfestungen (Vauban-Stil)', 'Mechanische Sperrwerke & Kettenbarrieren', 'Dampf- & Uhrwerk-Kriegsgeräte entwickeln', 'Unterirdische Stollen- & Bunkeranlagen'],
    meister: ['Königlicher Generalquartiermeister-Ingenieur', 'Gesamtleitung militärischer Monumentalbauten', 'Pionierwesen der gesamten Streitkräfte', 'Ausbildung im Militäringenieurwesen']
  },
  versorgungssoldat: {
    lehrling: ['Mehl- & Haferfässer wiegen', 'Pferdefutter rationieren', 'Planwagen mit Planen verzurren', 'Lagerfeuer & Feldküchen aufbauen'],
    geselle: ['Rationierung von Lebensmitteln & Wasser im Feld', 'Trossverwaltung auf dem Marsch', 'Requisition von Vorräten nach Vorschrift', 'Materialausgabe an Truppenteile'],
    spezialisierung: ['Versorgungslogistik unter extremem Winterwetter', 'Sicherung von Trosskonvois gegen Überfälle', 'Feldinstandsetzung beschädigter Ausrüstung', 'Depotaufbau hinter den Frontlinien'],
    meister: ['Oberversorgungsmeister / Trosskommandant', 'Ernährung & Ausrüstung von Armeen mit zehntausenden Soldaten', 'Strategische Nachschublinienführung', 'Ausbildung von Versorgungsoffizieren']
  },
  quartiermeister: {
    lehrling: ['Unterkunftszettel schreiben', 'Zeltplätze vermessen & abstecken', 'Lagerstroh verteilen', 'Verlustlisten führen'],
    geselle: ['Lageraufbau nach militärischer Ordnung (Castrum)', 'Zuweisung von Quartieren in eroberten Städten', 'Verwaltung von Kleidung, Waffen & Sold', 'Abrechnung von Schäden mit Zivilbevölkerung'],
    spezialisierung: ['Unterbringung riesiger Heere ohne Seuchenausbruch', 'Beschaffung von Winterquartieren im Feindesland', 'Beuteverteilung nach offiziellem Schlüssel', 'Verwaltung der Kriegskasse'],
    meister: ['Generalquartiermeister der Streitkräfte', 'Mitglied des Generalstabs', 'Gesamte materielle & finanzielle Kriegsführung', 'Höchste Instanz der Militärlogistik']
  },
  militaerhandwerker: {
    lehrling: ['Feldwerkbank aufbauen', 'Nägel, Niete & Beschläge sortieren', 'Werkzeuge schleifen', 'Holz & Metallreste verwerten'],
    geselle: ['Schnellreparatur von Waffen & Rüstungen im Lager', 'Instandsetzung von Wagenrädern & Deichseln', 'Hufbeschlag & Lederreparaturen für Reiter', 'Zimmermannsarbeiten an Palisaden'],
    spezialisierung: ['Feldinstandsetzung von Belagerungsmaschinen', 'Umarbeitung erbeuteter feindlicher Ausrüstung', 'Herstellung von Behelfsbrücken unter Feuer', 'Kreative Materialimprovisation'],
    meister: ['Werkmeister des Armeekorps', 'Leitung aller Feldschmieden & Werkstätten des Heeres', 'Standardisierung von Ersatzteilen & Waffen', 'Ausbildung von Militärhandwerkern']
  },
  waffenmeister: {
    lehrling: ['Zeughauswaffen zählen & ölen', 'Waffenständer instand halten', 'Ausgabebelege schreiben', 'Übungswaffen bereitstellen'],
    geselle: ['Fechterische & waffentechnische Ausbildung von Truppen', 'Prüfung der Kampftauglichkeit aller Zeughauswaffen', 'Wartung & Lagerung von Schwarzpulver & Geschützen', 'Zuweisung optimaler Waffen nach Kriegerprofil'],
    spezialisierung: ['Meister des Duell- & Fechtunterrichts', 'Verwaltung magischer & hochtechnologischer Waffen', 'Waffentests unter realistischen Kampfbedingungen', 'Spezialwaffenentwicklung'],
    meister: ['Oberster Zeugmeister / Reichs-Waffenmeister', 'Gesamtverwaltung aller Zeughäuser des Landes', 'Waffendoktrin & Standardisierung der Armee', 'Ausbildung der militärischen Fechtmeister']
  },
  offizier: {
    lehrling: ['Militärtaktik & Kartenlesen lernen', 'Führung kleiner Gruppen (Rotte / Trupp)', 'Befehlsausgabe mit klarer Stimme', 'Dienstvorschriften studieren'],
    geselle: ['Führung einer Kompanie / Einheit im Gefecht', 'Disziplin & Moral der Truppe aufrechterhalten', 'Gefechtsformationen befehlen', 'Lagebeurteilung & schnelle Entscheidungen unter Feuer'],
    spezialisierung: ['Bataillonsführung bei Sturm- & Abwehreinsätzen', 'Nacht- & Stadtkampftaktik', 'Koordination gemischter Waffengattungen', 'Kavallerie- oder Schützenregimentsführung'],
    meister: ['Regimentskommandeur / Oberst', 'Eigenständige Operationsführung im Feld', 'Taktische Planung größerer Schlachten', 'Ausbildung an der Kriegsakademie']
  },
  kommandant: {
    lehrling: ['Garnisonsakten studieren', 'Wachpläne genehmigen', 'Meldungen von Außenposten entgegennehmen', 'Inspektionen begleiten'],
    geselle: ['Befehlsgewalt über eine Garnison / Festung', 'Verteidigungsbereitschaft Tag & Nacht sichern', 'Militärgerichtsbarkeit über die Besatzung', 'Verbindung zur lokalen Zivilverwaltung halten'],
    spezialisierung: ['Monatelange Festungsverteidigung bei Belagerung', 'Kommando über strategische Engpässe & Pässe', 'Krisenmanagement bei Meutereien & Verrat', 'Ausfallangriffe & Gegenbelagerung'],
    meister: ['Festungsgouverneur & Stadtkommandant', 'Oberbefehl über einen gesamten Militärbezirk', 'Befehlsgewalt über alle Streitkräfte der Region', 'Ernennung durch den König']
  },
  general: {
    lehrling: ['Kriegsgeschichte & Schlachtenanalysen studieren', 'Feldherrnhügel-Perspektive & Meldewesen', 'Truppenstärken & Versorgungsketten kalkulieren', 'Stabsübungen am Sandkasten'],
    geselle: ['Führung von Divisionen & Armeekorps', 'Taktisches Manövrieren von Zehntausenden Soldaten', 'Schlachtaufstellung & Flankenmanöver planen', 'Nutzung von Gelände & Wetter zur Vernichtung des Feindes'],
    spezialisierung: ['Kriegskunst über ganze Feldzüge & Theater', 'Täuschungsmanöver & strategische Einkreisungen', 'Koordination von Land- & Seestreitkräften', 'Verhandlungsführung bei Gesamtkapitulationen'],
    meister: ['Generalfeldmarschall / Oberbefehlshaber des Reiches', 'Militärische Gesamtstrategie einer Nation', 'Sieg in weltverändernden Kriegen', 'Vorsitzender des Obersten Kriegsrats']
  },
  kavallerist: {
    lehrling: ['Sattelfestigkeit in allen Gangarten', 'Pferd im Galopp einhändig lenken', 'Lanzenführung im Schilf/Strohziel', 'Reitzeug & Hufeisen pflegen'],
    geselle: ['Kavallerieattacke in geschlossener Linie', 'Fechten vom Pferderücken mit Säbel & Lanze', 'Berittener Bogenschuss oder Pistolenschuss', 'Pferdeschonung bei Gewaltmärschen'],
    spezialisierung: ['Schwere Lanzenreiterei (Rittercharge) durch Infanterie', 'Leichte Husaren- / Kosakentaktik (Aufklärung, Flankenangriff)', 'Kürassierkampf gegen feindliche Reiter', 'Nachtattacken zu Pferde'],
    meister: ['Rittmeister & Kavallerie-Regimentsleiter', 'Taktischer Einsatz der Reiterei als schlachtentscheidende Waffe', 'Ausbildung an der Kavallerieschule', 'Legendäre berittene Kriegsführung']
  },
  leibwaechter: {
    lehrling: ['Umgebung ständig scannen', 'Körper als Schild positionieren', 'Nahkampf & Entwaffnungstechniken', 'Erste Hilfe bei Gift & Stichwunden'],
    geselle: ['Schutzperson in Menschenmengen absichern', 'Verdächtige Gestalten frühzeitig abfangen', 'Fluchtwege aus jedem Raum einprägen', 'Nahkampf auf engstem Raum'],
    spezialisierung: ['Schutz vor magischen Angriffen & Scharfschützen', 'Echtheitsprüfung von Speisen & Geschenken', 'Verdeckter Begleitschutz in Zivil', 'Abwehr koordinierter Attentäterteams'],
    meister: ['Chef der Leibwache / Schildmeister', 'Absolute Sicherheitsgarantie für Staatsoberhäupter', 'Aufbau persönlicher Sicherheitsstäbe', 'Ausbildung im Personenschutz']
  },
  karawanenwaechter: {
    lehrling: ['Wachposten bei Karawanenrast', 'Lagerfeuer & Tiere sichern', 'Armbrust & Speer schussbereit halten', 'Wüstensonne & Kälte ertragen'],
    geselle: ['Abwehr von Banditen- & Raubtierüberfällen', 'Karawanenformation bei Gefahr zur Wagenburg schließen', 'Geleitschutz auf gefährlichen Handelsrouten', 'Waffenumgang im Sattel & zu Fuß'],
    spezialisierung: ['Verteidigung in engen Schluchten & Wüstenstürmen', 'Verhandlung mit Wüstenräubern bei Ausweglosigkeit', 'Führung der Wachmannschaft ganzer Großzüge', 'Schutz hochexplosiver Fracht'],
    meister: ['Hauptmann der Karawanenwache', 'Sicherheitsgarantie für transkontinentale Züge', 'Verträge mit Handelsgilden & Fürsten', 'Ausbildung von Schutzsöldnern']
  },

  // --------------------------------------------------------------------------
  // 11. SEEFAHRT (seefahrt)
  // --------------------------------------------------------------------------
  matrose: {
    lehrling: ['Seemannsknoten (Palstek, Webeleinstek) binden', 'Deck schrubben & Teer kochen', 'In die Wanten steigen & Schwindelfreiheit', 'Hängematte knoten & verstauen'],
    geselle: ['Segel setzen, reffen & bergen im Sturm', 'Ruder gehen nach Kompasskurs', 'Tauwerk spleißen & Blöcke warten', 'Lenzpumpen bei Wassereinbruch bedienen'],
    spezialisierung: ['Toppsgast auf höchster Rah', 'Enterkampf mit Entermesser & Enterhaken', 'Ausguck bei Nebel & schwerem Wetter', 'Bootsführer von Beibooten bei Brandung'],
    meister: ['Oberbootsmannsgast & Veteran der Weltmeere', 'Anleitung der gesamten Decksmannschaft', 'Seemännische Prüfungsvorbereitung', 'Meisterprüfung Seemannshandwerk']
  },
  deckarbeiter: {
    lehrling: ['Laderäume reinigen & lüften', 'Ballaststeine schichten', 'Seile aufschießen', 'Klampen & Poller säubern'],
    geselle: ['Schwere Fracht mit Ladebäumen verstauen', 'Ladungssicherung gegen Verrutschen bei Seegang', 'Verholen von Schiffen im Hafenbecken', 'Rumpfreinigung von Seepocken (Kielholen vorbereiten)'],
    spezialisierung: ['Gefahrgut- & Pulververstauung im Schiffsbauch', 'Schadensbehebung bei Leckagen auf See', 'Schwerlastkranbedienung im Dock', 'Leitung von Ladekolonnen'],
    meister: ['Lademeister / Stauereileiter', 'Gesamtbeladungs- & Stabilitätsberechnung von Schiffen', 'Hafenfrachtlogistik', 'Ausbildung im Stauereiwesen']
  },
  steuermann: {
    lehrling: ['Steuerrad halten & Kurs halten', 'Kompassrosen & Peilscheiben ablesen', 'Logge zur Geschwindigkeitsmessung werfen', 'Karten auf dem Kartentisch glätten'],
    geselle: ['Schiff bei schwerem Seegang auf Kurs halten', 'Koppelnavigation & Besteckrechnung', 'Gezeiten- & Strömungstabellen anwenden', 'Wachhabender Offizier auf der Brücke'],
    spezialisierung: ['Steuern durch Riffe, Flussmündungen & Packeis', 'Nachtnavigation ohne Landmarken', 'Manöver bei Flaute oder Orkan', 'Ausweichmanöver im Flottenverband'],
    meister: ['Erster Offizier & Chefsteuermann', 'Rechte Hand des Kapitäns & Schiffsführung', 'Gesamtnavigation auf Weltumsegelungen', 'Kapitänspatent-Inhaber']
  },
  navigator: {
    lehrling: ['Sextant & Jakobsstab justieren', 'Sternen- & Sonnentafeln aufschlagen', 'Chronometerzeiten sekundengenau stoppen', 'Kartenwinkel messen'],
    geselle: ['Breitengrad- & Längengradbestimmung auf See', 'Monddistanzmethode zur Längenbestimmung', 'Berechnung von Meeresströmungen & Windversatz', 'Routenplanung für Ozeanüberquerungen'],
    spezialisierung: ['Pioniernavigation in unkartierten Ozeanen', 'Arkan-magnetische Anomalien korrigieren', 'Flautenvermeidung durch globale Windsysteme', 'Seekartenerstellung neuer Küsten'],
    meister: ['Großnavigator der Admiralität', 'Leitung königlicher Entdeckungsflotten', 'Ausbildung an der Seefahrtsakademie', 'Herausgabe der nautischen Jahrbücher']
  },
  schiffszimmermann: {
    lehrling: ['Kalfatereisen & Werg bereithalten', 'Holzbohlen säubern & dämpfen', 'Pech & Teer erhitzen', 'Schiffsschrauben & Nägel sortieren'],
    geselle: ['Kalfatern von Plankennähten gegen Wassereinbruch', 'Masten & Rahen zimmern & austauschen', 'Reparatur von Rumpfschäden nach Grundberührung', 'Lenzsysteme & Pumpen instand halten'],
    spezialisierung: ['Notreparatur von Kanonentreffern unter der Wasserlinie', 'Kiel- & Spantenreparatur auf hoher See', 'Neubau von Schiffen im Trockendock', 'Eisverstärkung von Schiffsrümpfen'],
    meister: ['Schiffbaumeister & Werftleiter', 'Entwurf & Konstruktion von Großlinienschiffen', 'Schiffszimmermannszunftmeister', 'Zertifizierung der Seetauglichkeit']
  },
  segelmacher: {
    lehrling: ['Segeltuch zuschneiden', 'Segelhandschuh & Segelnadeln handhaben', 'Garne wachsen', 'Risse & Löcher flicken'],
    geselle: ['Großsegel, Fock & Klüver maßschneidern', 'Liektau an Segelkanten annähen', 'Kauschen & Reffbändsel einarbeiten', 'Segeltuchimprägnierung gegen Fäulnis'],
    spezialisierung: ['Sturmsegel aus schwerstem Segeltuch fertigen', 'Aerodynamische Schnittoptimierung für Regatten', 'Notreparatur zerrissener Segel im Orkan', 'Segelkleider für riesige Viermaster'],
    meister: ['Segelmachermeister & Werkstattleiter', 'Komplette Besegelungspläne für Kriegsschiffe', 'Innungsleitung Segelmacherhandwerk', 'Ausbildung im Segelmacherberuf']
  },
  fischer: {
    lehrling: ['Netze stricken & Maschen flicken', 'Köder an Langleinen stecken', 'Fischkisten mit Eis füllen', 'Bootsdeck reinigen'],
    geselle: ['Schleppnetze & Stellnetze auswerfen & einholen', 'Fischschwärme nach Möwenflug & Wasserfarbe finden', 'Fisch an Bord schlachten & einsalzen', 'Fahrten bei Nebel & kabbeliger See'],
    spezialisierung: ['Hochseefischerei & Walfang', 'Krabben- & Hummerfang in Felsküsten', 'Tiefseelangleinenfischerei', 'Sturmsichere Kutterführung'],
    meister: ['Fischereikapitän & Flottenführer', 'Bewirtschaftung lukrativer Fischereigründe', 'Leitung von Fischereigenossenschaften', 'Schifffahrts- & Fischereipatent']
  },
  hafenarbeiter: {
    lehrling: ['Tauenden an Pollern belegen', 'Gangways anlegen & sichern', 'Kohlensäcke & Fässer rollen', 'Schmierfett für Winden auftragen'],
    geselle: ['Schiffe festmachen & vertäuen', 'Bedienung von Spillanlagen & Tretkränen', 'Schnelle Frachtumladung von Schiff auf Kai', 'Hafenbecken von Treibgut befreien'],
    spezialisierung: ['Schwergutverladung von Kanonen & Masten', 'Taucherassistenz bei Kaianlagenreparatur', 'Leitung von Kai-Arbeitsgruppen', 'Sicherheit bei Sturmanschlag im Hafen'],
    meister: ['Oberkellermeister / Kai-Inspektor', 'Organisation des gesamten Kai-Betriebs', 'Schichtplanung für hunderte Hafenarbeiter', 'Innungsprüfung für Hafengewerbe']
  },
  hafenmeister: {
    lehrling: ['Liegeplatzregister führen', 'Hafengebühren kassieren', 'Wasserstand an Pegeluhren ablesen', 'Signallaternen der Hafeneinfahrt prüfen'],
    geselle: ['Zuweisung von Liegeplätzen nach Schiffsgröße', 'Überwachung der Hafenordnung & Brandschutz', 'Koordination von Schleppern & Lotsen', 'Abfertigung ein- & auslaufender Schiffe'],
    spezialisierung: ['Krisenmanagement bei Hafenbränden & Seuchen', 'Hafenverteidigung & Kettenbarrikaden-Schließung', 'Ausbaggerung & Instandhaltung von Fahrrinnen', 'Schlichtung von Kapitänsstreitigkeiten'],
    meister: ['Oberhafenamtsdirektor & Hafenkapitän', 'Gesamtleitung eines Welthafens', 'Entwicklung moderner Hafenbecken & Docks', 'Königlicher Hafenkommissar']
  },
  schiffskoch: {
    lehrling: ['Kombüsenofen bei Seegang befeuern', 'Pökelfleisch wässern', 'Schiffszwieback auf Maden prüfen', 'Wasser rationieren'],
    geselle: ['Mahlzeiten für 50-100 Mann bei schwerer See kochen', 'Rationierung auf monatelangen Überfahrten', 'Skorbutvermeidung durch Sauerkraut & Zitrus', 'Kombüsenhygiene gegen Verderb'],
    spezialisierung: ['Offiziers- & Kapitänsmenüs auf See zubereiten', 'Fisch- & Schildkrötenzubereitung unterwegs', 'Brotbacken im Kombüsenofen bei Sturm', 'Vorratshaltung für mehrjährige Expeditionen'],
    meister: ['Chefkoch der Flotte / Admiralitätskoch', 'Verpflegungslogistik für ganze Kriegsflotten', 'Rezepturen für Tropenüberquerungen', 'Ausbildung von Schiffsköchen']
  },
  kanonier: {
    lehrling: ['Kanonenrohr mit Wischer reinigen', 'Schwarzpulverkartuschen zutragen', 'Kanonenkugeln & Kartätschen stapeln', 'Luntenspieße bereithalten'],
    geselle: ['Geschütz laden, richten & abfeuern', 'Kanonen nach dem Rücklauf festzurren', 'Höhen- & Seitenrichtung bei Wellengang ausgleichen', 'Kartätschfeuer gegen Entertrupps'],
    spezialisierung: ['Präzisionsschuss auf Masten & Ruder feindlicher Schiffe', 'Glühende Kugeln (Brandgeschosse) laden', 'Schnellfeuerdrill der Geschützmannschaft', 'Reparatur beschädigter Lafetten im Gefecht'],
    meister: ['Feuerwerksmeister & Stückmeister der Flotte', 'Artillerie-Feuerleitung ganzer Breitseiten', 'Ballistische Berechnung für Seeschlachten', 'Ausbildung von Marineartilleristen']
  },
  ausguck: {
    lehrling: ['Krähennest sicher besteigen', 'Horizont systematisch abtasten', 'Rufe & Trillerpfeifen-Signale üben', 'Wetteranzeichen am Himmel beobachten'],
    geselle: ['Erkennen von Segeln, Rauch & Riffen auf maximale Distanz', 'Bestimmung von Schiffstyp & Kurs feindlicher Schiffe', 'Warnung vor Untiefen, Treibgut & Brandung', 'Ausdauer bei Kälte, Wind & Seegang'],
    spezialisierung: ['Nacht- & Nebelbeobachtung mit Nachtgläsern', 'Ortung von Meerestieren & Walfontänen', 'Erkennung von Landmarken & Leuchtfeuern', 'Warnung vor Piraten-Hinterhalten'],
    meister: ['Oberausguck & Signalmeister', 'Schulung von Beobachtern für Flottenverbände', 'Optische Signalübertragung über Meilen', 'Ausbildung im Ausguckdienst']
  },
  kapitaen: {
    lehrling: ['Kommando- & Schiffsregeln studieren', 'Logbuch & Schiffsfinanzen führen', 'Wetterregeln & Seemannsgesetze lernen', 'Offiziersmanieren pflegen'],
    geselle: ['Führung des Schiffes & der Mannschaft auf See', 'Entscheidungen in Stürmen & Notsituationen fällen', 'Schiffsdisziplin & Meutereivermeidung', 'Kaufmännische Verhandlungen in Häfen'],
    spezialisierung: ['Seegefechtsführung mit Linientaktik & Enterung', 'Weltumsegelungen durch gefährliche Gewässer', 'Kapitän von Kriegs- & Kaperschiffen', 'Expeditionsleitung in unentdeckte Regionen'],
    meister: ['Kommodore / Admiral der Flotte', 'Befehlsgewalt über gesamte Geschwader & Flotten', 'Seestrategie zur Beherrschung der Ozeane', 'Mitglied des Admiralitätsrats']
  },
  lotsenfuehrer: {
    lehrling: ['Untiefen & Riffkarten auswendig lernen', 'Lotsenboote steuern', 'Strömungsmesser & Peillote bedienen', 'Nebelhörner bedienen'],
    geselle: ['Sicheres Einlotsen fremder Schiffe durch Klippen', 'Gezeitenstände im Kopf berechnen', 'Übersteigen auf Großschiffe bei schwerer See', 'Fahrrinnenmarkierungen & Tonnen warten'],
    spezialisierung: ['Lotsung schwerster Großkampfschiffe in Flussmündungen', 'Lotsung bei Nacht & dichtestem Seenebel', 'Passage extremer Gezeitenstrudel (Mahlsströme)', 'Notbergung havarierter Schiffe im Riff'],
    meister: ['Oberster Reviermeister & Chef-Lotse', 'Gesamtverantwortung für die Fahrrinnensicherheit', 'Prüfung & Zulassung von Seelotsen', 'Ausbildung an der Seelotsschule']
  },
  bootsmann: {
    lehrling: ['Bootsmannspfeife spielen lernen', 'Tagesarbeitspläne an Deck aushängen', 'Werkzeuge & Seile im Bootshaus ordnen', 'Pünktlichkeit & Disziplin einhalten'],
    geselle: ['Leitung aller Deckarbeiten & Instandhaltung', 'Durchsetzung der Disziplin mit Pfeifsignalen', 'Aufsicht über Ankerung & Takelage', 'Sicherheitsprüfungen vor dem Auslaufen'],
    spezialisierung: ['Organisation des Notfall-Leckabwehrtrupps', 'Sturmvorbereitung des gesamten Schiffes', 'Takelage-Instandsetzung unter Gefechtsfeuer', 'Ausbildung neuer Matrosen an Bord'],
    meister: ['Oberbootsmann / Schirrmeister der Flotte', 'Höchster Unteroffiziersdienstgrad an Bord', 'Seemännische Perfektion & Autorität', 'Meisterprüfung Bootsmannshandwerk']
  },
  taucher: {
    lehrling: ['Atemanhaltetechniken trainieren', 'Druckausgleich in den Ohren durchführen', 'Tauchgewichte & Tauchseile pflegen', 'Unterwasser-Zeichensprache lernen'],
    geselle: ['Freitauchen zur Inspektion von Schiffsrümpfen', 'Bergung verlorener Anker, Kisten & Waffen', 'Tauchen mit Behelfsglocken & Luftschläuchen', 'Orientierung in trübem Hafenwasser'],
    spezialisierung: ['Wracktauchen in gefährlichen Tiefen', 'Unterwasser-Sprengung & Sabotage an Schiffskielen', 'Perlentauchen & Korallenernte', 'Bau & Reparatur von Unterwasserfundamenten'],
    meister: ['Cheftaucher & Tiefseebergungsleiter', 'Konstruktion von Tauchglocken & Taucheranzügen', 'Leitung gigantischer Schatzbergungs-Expeditionen', 'Ausbildung von Berufstauchern']
  },

  // --------------------------------------------------------------------------
  // 12. KRIMINALITÄT (kriminalitaet)
  // --------------------------------------------------------------------------
  dieb: {
    lehrling: ['Lautloses Bewegen auf weichen Sohlen', 'Gegenstände unbemerkt verschwinden lassen', 'Fluchtwege in Gassen erkunden', 'Beuteverstecke anlegen'],
    geselle: ['Einbruch in Wohnhäuser & Speicher', 'Schlösser mit einfachen Dietrichen öffnen', 'Ablenkungsmanöver im Team durchführen', 'Beute schätzen & an Hehler verkaufen'],
    spezialisierung: ['Kletterkunst an Fassaden & Dächern (Fassadenkletterer)', 'Diebstahl gesicherter Wertgegenstände', 'Verkleidung & Infiltration in reiche Häuser', 'Entschärfung einfacher Alarmmechanismen'],
    meister: ['Meisterdieb & Gildenlegende', 'Raubzug auf bestbewachte Schatzkammern', 'Leitung von Diebesbanden', 'Zunftmeisterprüfung der Schatten']
  },
  taschendieb: {
    lehrling: ['Fingerspitzengefühl mit Nadeln & Münzen üben', 'Gedränge auf Märkten nutzen', 'Geldbeutel mit Rasiermesser abschneiden', 'Unschuldige Miene wahren'],
    geselle: ['Blinder Griff in Manteltaschen & Gürtel', 'Weitergabe der Beute an Mittelsmänner in Sekunden', 'Taschendiebstahl im dichten Menschengetümmel', 'Entkommen bei Ertappung ohne Kampf'],
    spezialisierung: ['Stehlen von Ringen & Uhren direkt vom Körper', 'Taschendiebstahl bei Adligen auf Bällen', 'Führung von Gruppen junger Taschendiebe', 'Erkennen von Zivilpolizisten & Wachen'],
    meister: ['König der Taschendiebe', 'Herrschaft über die Straßen & Jahrmärkte', 'Leitung des Netzwerks flinker Hände', 'Ausbildung im Taschendiebstahl']
  },
  einbrecher: {
    lehrling: ['Dietriche & Brechstangen pflegen', 'Gebäude von außen ausspähen', 'Fenstergitter geräuschlos durchsägen', 'Nachtausrüstung schwärzen'],
    geselle: ['Öffnen von Vorhänge- & Kastenschlössern', 'Lautloses Einsteigen durch Dachluken & Schornsteine', 'Vermeidung von Wachen & Wachhunden', 'Gezieltes Ausrauben von Tresoren & Schmuckschatullen'],
    spezialisierung: ['Überwindung komplexer Mehrfachschließanlagen', 'Deaktivierung mechanischer & magischer Fallen', 'Einbruch in Banken, Gilden & Paläste', 'Ausbruch aus Kerkern & Gefängnissen'],
    meister: ['Großeinbrecher & Meister der Riegel', 'Raubzug auf die sichersten Tresore der Welt', 'Planung von Jahrhundert-Einbrüchen', 'Ausbildung in Schlosser- & Einbruchskunst']
  },
  schmuggler: {
    lehrling: ['Geheime Fächer in Kisten zimmern', 'Waren in Teer & Fischgeruch tarnen', 'Kompasse & Nachtpeilung lernen', 'Zollposten beobachten'],
    geselle: ['Schmuggel von Gewürzen, Waffen & Edelsteinen', 'Nachtanlandungen an einsamen Felsenbuchten', 'Nutzung von Geheimgängen in Stadtmauern', 'Bestechung von Zollbeamten & Wachen'],
    spezialisierung: ['Großschmuggel mit getarnten Handelsschiffen', 'Schmuggel von verbotenen Büchern & Magie-Artefakten', 'Etablierung geheimer Höhlen- & Tunnelsysteme', 'Gefahrgutschmuggel durch Kriegsgebiete'],
    meister: ['Schmugglerkönig & Herrscher der Schattenrouten', 'Beherrschung des gesamten Schwarzmarkts', 'Monopol auf illegale Importe & Exporte', 'Gildenmeister der Schmugglergilde']
  },
  hehler: {
    lehrling: ['Gravuren & Wappen von Silber abfeilen', 'Gegenstände reinigen & neu polieren', 'Geheime Verstecke im Laden anlegen', 'Kundenkartei verschlüsseln'],
    geselle: ['Genaue Wertermittlung von Diebesgut', 'Umarbeiten & Einschmelzen von Schmuck & Gold', 'Wiederverkauf von Hehlerware an Ahnungslose', 'Schutz vor Razzien der Stadtwache'],
    spezialisierung: ['Verkauf weltberühmter gestohlener Kunstwerke', 'Geldwäsche über Scheingeschäfte & Wechselstuben', 'Internationales Absatznetz für Großbeute', 'Diskrete Rückvermittlung von Beute gegen Lösegeld'],
    meister: ['Großhehler & Finanzier der Unterwelt', 'Finanzierung von Großverbrechen & Raubzügen', 'Einflussreicher Geschäftsmann bei Tag & Schattenboss bei Nacht', 'Schlichtung von Unterweltstreitigkeiten']
  },
  faelscher: {
    lehrling: ['Papiere & Pergamente künstlich altern', 'Tinten nach alten Rezepturen anrühren', 'Handschriften spiegelverkehrt nachzeichnen', 'Siegelwachsfarben mischen'],
    geselle: ['Täuschend echte Fälschung von Pässen & Siegeln', 'Kopieren fürstlicher Unterschriften', 'Fälschen von Münzen durch Entwertung & Guss', 'Herstellung gefälschter Besitzurkunden'],
    spezialisierung: ['Fälschung historischer Relikte & Meistergemälde', 'Perfekte Fälschung königlicher Siegel & Erlasse', 'Kopieren arkaner Zauberrollen & Grimoires', 'Identitätsfälschung für Gesuchte'],
    meister: ['Meisterfälscher & Unsichtbare Hand', 'Erschaffung von Dokumenten, die Königreiche spalten', 'Unentdeckte Fälschungen in Staatsarchiven', 'Ausbildung im Fälscherhandwerk']
  },
  spion: {
    lehrling: ['Verkleidung & fremde Dialekte üben', 'Geheime Botschaften mit unsichtbarer Tinte schreiben', 'Lippenlesen & Lauschen an Türen', 'Niemals den wahren Namen nennen'],
    geselle: ['Infiltration in Ministerien, Armeen & Gilden', 'Beschaffung von Kriegsplänen & Geheimkorrespondenz', 'Doppelleben unter falscher Identität', 'Unbemerktes Fotografieren/Zeichnen von Befestigungen'],
    spezialisierung: ['Spionage im innersten Zirkel des Monarchen', 'Doppelagent & Zersetzung feindlicher Geheimdienste', 'Anwerbung & Führung von Informantennetzwerken', 'Verhörresistenz & Gedankenschutz'],
    meister: ['Meisterspion / Chef des Geheimdienstes', 'Führung von Spionageringen über ganze Kontinente', 'Sturz feindlicher Regierungen durch Enthüllungen', 'Meister der Schattenpolitik']
  },
  informant: {
    lehrling: ['Ohren in Tavernen offenhalten', 'Gerüchte auf Plausibilität prüfen', 'Notizen verschlüsseln', 'Treffpunkte im Dunkeln wählen'],
    geselle: ['Sammeln von Klatsch, Schulden & Skandalen', 'Gezielter Verkauf von Hinweisen an Wache & Banden', 'Aufbau von Kontakten zu Zofen, Dienern & Wachen', 'Erkennen von Fallen bei Übergaben'],
    spezialisierung: ['Insiderwissen über Hochadel & Wirtschaftsbörsen', 'Frühwarnung vor Razzien & Attentaten', 'Gezieltes Streuen von Desinformation', 'Geheime Informantenringe in Metropolen'],
    meister: ['Die Stimme der Gassen / Meisterinformant', 'Weiß alles, was in der Stadt geschieht', 'Unentbehrliche Quelle für Könige & Gildenbosse', 'Herr über die intimsten Staatsgeheimnisse']
  },
  gluecksspieler: {
    lehrling: ['Karten mischen & austeilen ohne Hektik', 'Würfelbecher blind führen', 'Einsätze schnell zusammenrechnen', 'Pokerface trainieren'],
    geselle: ['Karten zählen & Wahrscheinlichkeiten kalkulieren', 'Falschspieltechniken (Zweites Geben, Gezinkte Würfel)', 'Lesen von Körpersprache & Bluffs der Gegner', 'Verluste minimieren & Gewinne sichern'],
    spezialisierung: ['High-Stakes-Spiele gegen Adlige & Fürsten', 'Manipulation von Spieltischen & Rouletterädern', 'Verdeckte Kartenspiele im Team mit Handzeichen', 'Glücksspielsalon-Management'],
    meister: ['König des Glücksspiels / Großmeister des Bluffs', 'Gewinn ganzer Schlösser & Schiffe am Spieltisch', 'Unbesiegbare Spielstrategie', 'Leitung der größten Spielpaläste']
  },
  erpresser: {
    lehrling: ['Schattenseiten & Laster von Zielpersonen notieren', 'Erpresserbriefe mit Zeitungsschnipseln kleben', 'Tote Briefkästen für Geldübergaben anlegen', 'Fluchtwege bei Übergaben sichern'],
    geselle: ['Beweise für Untreue, Korruption & Verbrechen sammeln', 'Zahlungsforderungen dosieren ohne Eskalation', 'Einschüchterung & psychologischer Druck', 'Geldübergaben ohne Identitätsaufdeckung'],
    spezialisierung: ['Erpressung von Ministern & Kirchenfürsten', 'Kontrolle ganzer Ratsherren über Kompromate', 'Inszenierung von Skandalen bei Nichtzahlung', 'Erpressung durch vertrauliche Staatsgeheimnisse'],
    meister: ['Schatten-Strippenzieher / Meistererpresser', 'Kontrolle über die Mächtigsten des Reiches', 'Unantastbarkeit durch vernichtende Dossiers', 'Meister der Erpressungskunst']
  },
  attentaeter: {
    lehrling: ['Schleichen im Schatten', 'Präziser Dolchstoss in vitale Punkte', 'Geräuschlose Waffenpflege', 'Todesruhe vor dem Zugriff'],
    geselle: ['Infiltration bewachter Anwesen zur Nachtzeit', 'Lautloses Ausschalten von Wachen', 'Flucht über Dächer nach dem Anschlag', 'Nutzung von Wurfgeschossen & Armbrüsten'],
    spezialisierung: ['Attentate auf schwerstbewachte Monarchen', 'Nutzung von Giften & Kontaktgiften', 'Magisch getarnte Anschläge', 'Inszenierung von Morden als Unfälle'],
    meister: ['Großmeister der Attentätergilde', 'Legendäre Auftragsmorde ohne jede Spur', 'Leitung der Bruderschaft der Assassinen', 'Ausbildung im Schattenhandwerk']
  },
  auftragskiller: {
    lehrling: ['Zielbeobachtung & Tagesabläufe protokollieren', 'Waffen nach Auftrag wählen', 'Handschuhe & Maskierung tragen', 'Spuren am Einsatzort vermeiden'],
    geselle: ['Professionelle Beseitigung von Zielpersonen', 'Ausführung von Treffern ohne Kollateralschaden', 'Sichere Geldannahme über Mittelsmänner', 'Beseitigung von Leichen & Tatwaffen'],
    spezialisierung: ['Scharfschützen-Eliminierung auf Extremdistanz', 'Auftragsmorde in Gefängnissen & Festungen', 'Verteidigung gegen Gegenattentate', 'Hinterlassen von Visitenkarten zur Einschüchterung'],
    meister: ['Der Vollstrecker / Meistermörder', 'Höchstbezahlter Schattenprofi des Kontinents', 'Unwiderruflicher Vollzug jedes Auftrags', 'Gildenoberhaupt für Spezialaufträge']
  },
  bandit: {
    lehrling: ['Hinterhalte an Waldwegen errichten', 'Pferde & Waffen pflegen', 'Auf Rufe des Anführers gehorchen', 'Spuren zum Versteck verwischen'],
    geselle: ['Überfall auf Reisende & kleine Fuhrwerke', 'Drohendes Auftreten & Waffengewalt', 'Geiseln nehmen & Lösegeld fordern', 'Verteidigung des Waldlagers gegen Patrouillen'],
    spezialisierung: ['Überfall auf befestigte Postkutschen & Eskorten', 'Organisation eines Banditenlagers in den Bergen', 'Gefangenenbefreiung aus dem Kerker', 'Bandenkampf gegen rivalisierende Banden'],
    meister: ['Räuberhauptmann / Banditenbaron', 'Herrschaft über ganze Wälder & Provinzen', 'Eintreibung von Schutzgeldern von Städten', 'Volksheld oder Schrecken des Reiches']
  },
  pirat: {
    lehrling: ['Enterhaken werfen & entern', 'Entermesser schwingen', 'Kanonen auf Kaperschiffen laden', 'Beute an Deck schleppen'],
    geselle: ['Kaperung von Handelsschiffen auf hoher See', 'Schiff-zu-Schiff-Nahkampf & Einschüchterung', 'Navigation zu geheimen Piratenbuchten', 'Beuteaufteilung nach dem Piratenkodex'],
    spezialisierung: ['Angriff auf bewaffnete Kriegsschiffe & Galeonen', 'Plünderung von Küstenstädten & Forts', 'Verstecken von Schätzen auf einsamen Inseln', 'Taktische Nutzung von Riffen zur Flucht vor der Flotte'],
    meister: ['Piratenfürst / Kaperkönig', 'Befehlsgewalt über eine Piratenflotte', 'Herrscher über freie Piratenhäfen', 'Schrecken der Weltmeere']
  },
  strassenraeuber: {
    lehrling: ['Klaftersteine & Baumstämme über Wege rollen', 'Fluchtwege ins Dickicht markieren', 'Kopfgeldsteckbriefe meiden', 'Waffen bereithalten'],
    geselle: ['Wegelagerei an Fernstraßen & Pässen', 'Reisende zur Herausgabe von Geldbeuteln zwingen', 'Kutschenüberfälle im schnellen Zugriff', 'Rückzug vor der Reitergarde'],
    spezialisierung: ['Schwere Überfälle auf bewachte Geldtransporte', 'Führung lokaler Straßenräuber-Rudel', 'Spione an Relaisstationen platzieren', 'Tarnung als ehrliche Reisende vor dem Zugriff'],
    meister: ['König der Landstraße', 'Totaler Kontrollverlust der Krone über Fernwege', 'Schutzbriefe an Kaufleute verkaufen', 'Ausbildung im Straßenraub']
  },
  bandenfuehrer: {
    lehrling: ['Bandenmitglieder zusammenhalten', 'Beute gerecht verteilen', 'Schlägereien für die Bande gewinnen', 'Territoriumsgrenzen markieren'],
    geselle: ['Leitung einer Stadtviertel-Bande', 'Schutzgelderpressung von Läden & Tavernen', 'Revierkämpfe gegen andere Banden führen', 'Schmierung von Wachen & Beamten'],
    spezialisierung: ['Kontrolle über das gesamte Rotlicht- & Glücksspielviertel', 'Organisation organisierter Kriminalität', 'Bandenkriege strategisch planen & gewinnen', 'Etablierung loyaler Statthalter in Vierteln'],
    meister: ['Pate / Boss der Unterwelt', 'Unumschränkte Herrschaft über das Verbrechen der Metropole', 'Verhandlung auf Augenhöhe mit dem Stadtrat', 'Gildenmeister des organisierten Verbrechens']
  },
  scharfrichter: {
    lehrling: ['Richtschwerter & Äxte polieren & schärfen', 'Galgenstricke knüpfen & Galgen zimmern', 'Brandmarkungseisen erhitzen', 'Schutzkleidung & Kapuze tragen'],
    geselle: ['Vollstreckung von Körperstrafen & Brandmarkungen', 'Enthauptung mit einem einzigen sauberen Hieb', 'Hinrichtungen am Galgen & Rad durchführen', 'Fachgerechte Beseitigung von Gehängten'],
    spezialisierung: ['Peinliche Befragung (Folter nach Gerichtsordnung)', 'Anatomische Kenntnisse zur Schmerzkontrolle', 'Verwertung von Henkerssalben & Galgenblumen', 'Leichenöffnung für Gerichtsärzte'],
    meister: ['Oberster Scharfrichter der Krone', 'Vollstreckung von Urteilen an Hochadeligen & Rebellen', 'Zunftmeister des Scharfrichtergewerbes', 'Hohes Ansehen bei Hofe trotz Stigmas']
  }
};
