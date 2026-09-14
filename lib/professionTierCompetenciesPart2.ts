// ============================================================================
// ADVENTUREFORGE BERUFS-FACHKOMPETENZEN NACH STUFEN - TEIL 2
// 5. Medizin
// 6. Wissenschaft
// 7. Handel & Wirtschaft
// 8. Dienstleistung
// ============================================================================

import { JobTierCompetencySet } from './professionTierCompetenciesPart1';

export const PART2_COMPETENCIES: Record<string, JobTierCompetencySet> = {
  // --------------------------------------------------------------------------
  // 5. MEDIZIN (medizin)
  // --------------------------------------------------------------------------
  arzt: {
    lehrling: ['Puls & Fieber messen', 'Verbandwechsel & Wundreinigung', 'Arzneien mörsern & abwiegen', 'Krankengeschichte aufnehmen'],
    geselle: ['Klinische Diagnostik & Symptomdeutung', 'Aderlass, Schröpfen & Wundverschluss', 'Fiebersenkung & Infektionsbekämpfung', 'Rezepturherstellung nach Arzneibuch'],
    spezialisierung: ['Innere Medizin & Organerkrankungen', 'Epidemie- & Seuchenkontrolle', 'Schmerztherapie mit Opiaten/Kräutern', 'Gerichtliche Obduktion & Toxikologie'],
    meister: ['Oberster Stadtphysikus & Hofarzt', 'Leitung von Spitälern & Lazaretten', 'Verfassen medizinischer Lehrwerke', 'Königliche Gesundheitsaufsicht']
  },
  heiler: {
    lehrling: ['Tröstende Zuwendung & Krankenbettpflege', 'Kräutertees & Wundsalben bereiten', 'Körperwärme regulieren', 'Hygienische Maßnahmen im Krankenzimmer'],
    geselle: ['Ganzheitliche Diagnose nach Körpersäften', 'Knochenbrüche richten & schienen', 'Wundbrand verhindern & säubern', 'Fieberkrämpfe & Schockzustände behandeln'],
    spezialisierung: ['Energetische Handauflegung & Vitalisierung', 'Behandlung hartnäckiger chronischer Leiden', 'Trauma- & Schockbehandlung nach Schlachten', 'Natürliche Schmerz- & Krampflinderung'],
    meister: ['Erzheiler & Sanatoriumsleiter', 'Wundersame Heilerfolge bei Todkranken', 'Leitung spiritueller Heilhäuser', 'Ausbildung von Heilern']
  },
  feldarzt: {
    lehrling: ['Verbandszeug & Tourniquets packen', 'Wundhaken & Zangen sterilisieren', 'Verletzte aus der Gefahrenzone bergen', 'Wundschnellverbände anlegen'],
    geselle: ['Schnelle Triage & Verwundetenkategorisierung', 'Notfall-Amputationen & Blutstillung', 'Pfeil- & Splitterentfernung', 'Feldlazarett-Hygiene unter Kriegsbedingungen'],
    spezialisierung: ['Kriegschirurgie bei schweren Bauchtraumata', 'Brandwunden-Behandlung (Öl/Magie)', 'Behandlung von Kampfstoff- & Giftpfeilen', 'Mobiler Lazarettaufbau in Frontnähe'],
    meister: ['Generalarzt der Streitkräfte', 'Militärsanitätswesen einer ganzen Armee', 'Strategische Seuchenprävention im Feldlager', 'Ausbildung aller Militärärzte']
  },
  militaerarzt: {
    lehrling: ['Medizinische Ausrüstung marschbereit halten', 'Soldaten auf Tauglichkeit prüfen', 'Wasserquellen auf Trinkbarkeit testen', 'Basisversorgung bei Märschen'],
    geselle: ['Schuss- & Hiebwunden chirurgisch versorgen', 'Knochensplitterung im Feld operieren', 'Bekämpfung von Ruhr & Fleckfieber in Kasernen', 'Traumaversorgung im Gefecht'],
    spezialisierung: ['Rehabilitation verkrüppelter Veteranen', 'Toxikologische Abwehr feindlicher Gifte', 'Gefechtsfeldchirurgie unter Beschuss', 'Organisation von Verwundetentransporten'],
    meister: ['Oberstabsarzt & Chef des Militärhospitals', 'Entwicklung militärmedizinischer Leitfäden', 'Sanitätslogistik bei Belagerungen', 'Meisterprüfung im Sanitätsdienst']
  },
  feldscher: {
    lehrling: ['Rasiermesser & Scheren schleifen', 'Blutegel ansetzen & pflegen', 'Zähne ziehen Grundlagen', 'Pflaster & Leinenbinden schneiden'],
    geselle: ['Schnelle Wundnaht auf dem Schlachtfeld', 'Abszesse spalten & drainieren', 'Verrenkungen & Frakturen einrenken', 'Kauterisation (Wundausbrennen)'],
    spezialisierung: ['Präzise Knochensägung bei Amputationen', 'Brandblasen- & Quetschungsbehandlung', 'Herausziehen tief sitzender Geschosse', 'Schnelle Schmerzdämpfung'],
    meister: ['Oberster Zunftmeister der Wundärzte', 'Leitung der Feldscherer-Korps', 'Innungsprüfung für Barbiere & Wundärzte', 'Privilegierte Zivil- & Heerespraxis']
  },
  chirurg: {
    lehrling: ['Skalpelle & Knochensägen desinfizieren', 'Präparationstische vorbereiten', 'Blutung mit Kompressen stillen', 'Anatomische Atlanten studieren'],
    geselle: ['Gewebe schichtweise eröffnen & nähen', 'Adern unterbinden & Ligaturen setzen', 'Schwere Schnitt- & Pfählungsverletzungen operieren', 'Sterilität & Wunddrainagen sichern'],
    spezialisierung: ['Schädelöffnungen (Trepanation)', 'Entfernung von Blasensteinen & Tumoren', 'Wiederherstellung von Sehnen & Muskeln', 'Schonende Weichteil- & Gefäßchirurgie'],
    meister: ['Chirurgischer Ordinarius & Spitalleiter', 'Entwicklung neuer Operationstechniken', 'Erfolgreiche Eingriffe am offenen Körper', 'Ausbildung an chirurgischen Akademien']
  },
  apotheker: {
    lehrling: ['Standgefäße beschriften & reinigen', 'Drogen & Mineralien pulverisieren', 'Feinwaage auf Milligramm bedienen', 'Tinkturen filtrieren & lagern'],
    geselle: ['Salben, Pillen & Elixiere ansetzen', 'Dosiermengen & Giftgrenzen berechnen', 'Haltbarmachung von Wirkstoffen', 'Prüfung auf Verfälschung von Drogen'],
    spezialisierung: ['Komplexe Theriak- & Universalrezepturen', 'Extraktion hochwirksamer Alkaloide', 'Spezifische Gegenmittel (Antidote)', 'Konservierung flüchtiger Essenzen'],
    meister: ['Apothekenbesitzer & Ratsapotheker', 'Hofapothekenleitung & Privilegführung', 'Apothekerkammer-Vorsitz', 'Monopol auf seltene pharmazeutische Substanzen']
  },
  kraeuterkundiger: {
    lehrling: ['Frische von getrockneten Kräutern prüfen', 'Kräuterbündel schnüren & lüften', 'Teesud & Aufgüsse bereiten', 'Einfache Salben mit Bienenwachs rühren'],
    geselle: ['Gezielte Kräutermischungen gegen Symptome', 'Alkoholische Tinkturen & Ölauszüge', 'Wickel & Umschläge fachgerecht anlegen', 'Erkennen toxischer Doppelgänger'],
    spezialisierung: ['Potenzierung pflanzlicher Wirkstoffe', 'Mazerate aus seltenen Hochlandpflanzen', 'Pflanzliche Schmerz- & Betäubungsmittel', 'Heilmittel gegen magische Vergiftungen'],
    meister: ['Großmeister der Pflanzenheilkunde', 'Eigene Rezeptur-Enzyklopädien', 'Internationale Kräuternetzwerke', 'Meisterausbildung Naturheilkunde']
  },
  hebamme: {
    lehrling: ['Leinentücher & warmes Wasser bereiten', 'Schwangere beruhigen & stützen', 'Kräuter für Wehentee mischen', 'Geburtszimmer heizen'],
    geselle: ['Lage des Kindes im Bauch ertasten', 'Geburt sicher anleiten & Nabelschnur trennen', 'Erstversorgung & Atmung des Neugeborenen', 'Nachgeburt kontrollieren & Blutungen stillen'],
    spezialisierung: ['Wendungen bei Steiß- & Querlage', 'Geburtsstillstand auflösen & Wehen anregen', 'Versorgung von Dammrissen & Verletzungen', 'Pflege von Frühgeborenen & Mehrlingen'],
    meister: ['Oberhebamme der Stadt / des Hofes', 'Aufsicht über das Hebammenwesen', 'Lehrbücher für Geburtshilfe verfassen', 'Entbindung königlicher Thronfolger']
  },
  krankenpfleger: {
    lehrling: ['Betten frisch beziehen & reinigen', 'Mahlzeiten an Kranke verteilen', 'Krankensaal lüften & desinfizieren', 'Nachttöpfe leeren & desinfizieren'],
    geselle: ['Bettlägerige Patienten schonend umlagern', 'Wundverbände wechseln & Haut pflegen', 'Medikamente pünktlich verabreichen', 'Vitalzeichen protokollieren'],
    spezialisierung: ['Intensivpflege Schwerstkranker', 'Sterbebegleitung & Palliativpflege', 'Infektionsisolation & Quarantänestation', 'Psychische Beruhigung bei Delirium'],
    meister: ['Pflegedirektor & Stationsleitung', 'Personaleinsatz in Großspitälern', 'Hygiene- & Pflegestandards festlegen', 'Ausbildung von Pflegekräften']
  },
  giftkundiger: {
    lehrling: ['Umgang mit Schutzhandschuhen & Masken', 'Giftige Tiere & Pflanzen katalogisieren', 'Sichere Glasbehälter luftdicht verschließen', 'Reinigung toxischer Arbeitsflächen'],
    geselle: ['Pflanzliche & tierische Gifte extrahieren', 'Wirkungsdauer & tödliche Dosis ermitteln', 'Nachweis von Giften in Flüssigkeiten', 'Herstellung einfacher Gegengifte'],
    spezialisierung: ['Geruchlose & geschmacklose Kontaktgifte', 'Lähmende & halluzinogene Nervengifte', 'Schleichende Gifte mit verzögerter Wirkung', 'Gegengifte für exotische Monstergifte'],
    meister: ['Großmeister der Toxikologie', 'Kreation unnachweisbarer Hofgifte', 'Entwicklung legendärer Universalantidote', 'Leiter geheimer Giftkabinette']
  },
  anatom: {
    lehrling: ['Präparierbesteck schärfen', 'Konservierungsflüssigkeiten (Weingeist) ansetzen', 'Leichen fachgerecht einlagern', 'Anatomische Skizzen nachzeichnen'],
    geselle: ['Systematische Sektion von Muskeln & Nerven', 'Organe freilegen & vermessen', 'Präparation von Skeletten & Knochenbau', 'Identifikation von Todesursachen am Leichnam'],
    spezialisierung: ['Präparation des Nervensystems & Gehirns', 'Pathologische Gewebeveränderungen erkennen', 'Anatomie seltener Völker & Bestien', 'Gefäßinjektionen mit Farbwachs'],
    meister: ['Lehrstuhlinhaber Anatomie & Pathologie', 'Leitung des großen Anatomischen Theaters', 'Herausgabe maßgeblicher Anatomie-Atlanten', 'Gerichtsmedizinischer Obergutachter']
  },
  tierarzt: {
    lehrling: ['Tiere fixieren & beruhigen', 'Fieber bei Großvieh messen', 'Verbandszeug für Tierläufe vorbereiten', 'Arzneien ins Futter mischen'],
    geselle: ['Diagnose von Nutztier- & Pferdekrankheiten', 'Geburtshilfe bei Rindern & Pferden', 'Wundversorgung von Biss- & Trittverletzungen', 'Huf- & Klauenoperationen'],
    spezialisierung: ['Bekämpfung von Rinderpest & Milzbrand', 'Chirurgie an edlen Rennpferden & Falken', 'Behandlung exotischer Reittiere (Greifen, Echsen)', 'Parasitenbekämpfung bei Großherden'],
    meister: ['Reichs-Veterinärdirektor', 'Tiergesundheitsüberwachung des gesamten Landes', 'Leitung königlicher Gestüts-Kliniken', 'Ausbildung im Veterinärwesen']
  },
  schiffsarzt: {
    lehrling: ['Medizinkiste seefest verstauen', 'Schiffszwieback & Wasser kontrollieren', 'Krankenkojen reinigen', 'Knoten für Verwundetentragen lernen'],
    geselle: ['Behandlung von Skorbut & Mangelkrankheiten', 'Wundversorgung bei Seegang & Sturm', 'Tropenfieber & Seekrankheit therapieren', 'Amputationen auf schwankenden Planken'],
    spezialisierung: ['Quarantäneführung bei Hafenanläufen', 'Behandlung von Ertrinkungsunfällen', 'Expeditionsmedizin in unbekannten Gewässern', 'Schiffshygiene & Trinkwasserkonservierung'],
    meister: ['Flottenarzt der Admiralität', 'Militärische Sanitätsplanung ganzer Flotten', 'Hafenquarantäne-Generalinspektion', 'Ausbildung von Schiffschirurgen']
  },
  magieheiler: {
    lehrling: ['Aura-Wahrnehmung schulen', 'Magische Schockzustände erkennen', 'Fokussteine reinigen & laden', 'Sanfte Beruhigungszauber weben'],
    geselle: ['Kanalisieren von Lebensenergie in Wunden', 'Knochenregeneration durch Arkanfluss', 'Flüche & magische Seuchen reinigen', 'Beseitigung von Mana-Vergiftung'],
    spezialisierung: ['Wiederbelebung frisch Verstorbener', 'Heilung von Seelen- & Geistschäden', 'Permanent wirkende Regenerationsauren', 'Rekonstruktion verlorener Gliedmaßen'],
    meister: ['Erz-Thaumaturg der Heilung', 'Massensegnung auf dem Schlachtfeld', 'Bruch uralter titanischer Flüche', 'Leitung arkaner Heiligtümer']
  },

  // --------------------------------------------------------------------------
  // 6. WISSENSCHAFT (wissenschaft)
  // --------------------------------------------------------------------------
  gelehrter: {
    lehrling: ['Schriften sichten & indexieren', 'Federkiele schneiden & Tinte bereiten', 'Latein- & Alttextübungen', 'Zitate & Fußnoten nachschlagen'],
    geselle: ['Quellenkritik & Textvergleich', 'Verfassen wissenschaftlicher Abhandlungen', 'Disputation nach logischen Regeln', 'Systematische Sammlungsverwaltung'],
    spezialisierung: ['Universalgelehrsamkeit über mehrere Disziplinen', 'Entzifferung verlorener Schriften', 'Leitung wissenschaftlicher Korrespondenz', 'Logik, Rhetorik & Naturphilosophie'],
    meister: ['Rektor der Universität & Hofgelehrter', 'Begründung neuer Wissenschaftszweige', 'Leitung der königlichen Akademie', 'Herausgabe wegweisender Enzyklopädien']
  },
  forscher: {
    lehrling: ['Versuchsaufbauten säubern & justieren', 'Messdaten gewissenhaft protokollieren', 'Probenetikettierung & Sortierung', 'Hypothesen sauber formulieren'],
    geselle: ['Systematische Versuchsreihen durchführen', 'Statistische Auswertung von Experimenten', 'Entwicklung neuer Untersuchungsmethoden', 'Publikation von Forschungsergebnissen'],
    spezialisierung: ['Pionierforschung in Grenzbereichen', 'Konstruktion neuartiger Forschungsapparate', 'Interdisziplinäre Forschungsreisen', 'Kritische Falsifikation alter Theorien'],
    meister: ['Leiter des Forschungsinstituts', 'Wegweisende wissenschaftliche Durchbrüche', 'Akademiepräsident & Forschungsförderung', 'Ausbildung führender Forscherpersönlichkeiten']
  },
  historiker: {
    lehrling: ['Alte Urkunden entstauben', 'Zeitleisten zeichnen', 'Herrscherlisten auswendig lernen', 'Archivordnung verstehen'],
    geselle: ['Quellenabgleich & Echtheitsprüfung', 'Rekonstruktion historischer Schlachten & Verträge', 'Kritische Analyse von Propagandaschriften', 'Epochen- & Kulturvergleiche anstellen'],
    spezialisierung: ['Militärgeschichte & Taktikanalysen', 'Dynastische Genealogie des Hochadels', 'Wirtschafts- & Sozialgeschichte vergangener Reiche', 'Geschichte verbotener Kulte & Orden'],
    meister: ['Reichshistoriker & Hofchronist', 'Gesamtgeschichtswerk des Reiches verfassen', 'Schlichtung historischer Grenzansprüche', 'Direktor der Reichshistorischen Archive']
  },
  chronist: {
    lehrling: ['Tagesberichte sammeln', 'Kalendarien führen', 'Schreibmaterialien pflegen', 'Wetter- & Marktpreise notieren'],
    geselle: ['Laufende Reichsannalen niederschreiben', 'Augenzeugenberichte protokollieren', 'Feierliche Staatsakte dokumentieren', 'Objektive Chronikführung ohne Verfälschung'],
    spezialisierung: ['Geheime Chroniken für Fürsten & Könige', 'Kriegschronik direkt im Heerlager', 'Stadt- & Klosterchroniken verfassen', 'Illustration wichtiger Chronikseiten'],
    meister: ['Oberster Reichschronist', 'Verwaltung des ewigen Reichsarchivs', 'Siegelung & Beglaubigung historischer Epochenwerke', 'Ausbildung von Chronisten']
  },
  archaeologe: {
    lehrling: ['Grabungsraster abstecken', 'Pinsel & Spachtel handhaben', 'Scherben waschen & nummerieren', 'Fundschichten fotografieren/zeichnen'],
    geselle: ['Stratigraphische Schichtenanalyse', 'Vorsichtige Freilegung von Artefakten', 'Konservierung brüchiger Fundstücke', 'Typologische Datierung von Keramik & Metall'],
    spezialisierung: ['Gruft- & Grabkammeröffnung ohne Zerstörung', 'Entschärfung antiker Grabfallen', 'Unterwasserarchäologie an Schiffswracks', 'Rekonstruktion antiker Tempelanlagen'],
    meister: ['Leiter königlicher Ausgrabungen', 'Entdeckung verschollener Zivilisationen', 'Museumskurator & Ausstellungsleiter', 'Akademische Grabungsleitung']
  },
  kartograph: {
    lehrling: ['Kartenblätter spannen & rastern', 'Zirkel, Lineal & Peilscheibe führen', 'Signaturen & Schraffuren zeichnen', 'Farbgebung von Gewässern & Bergen'],
    geselle: ['Triangulation & Geländevermessung', 'Maßstabsgetreue Kartenzeichnung', 'Küstenlinien & Schifffahrtsrouten erfassen', 'Orientierung nach Sternen & Kompass'],
    spezialisierung: ['Präzise Seekarten mit Tiefenangaben', 'Militärische Relief- & Höhenschichtenkarten', 'Globusbau & Projektionsrechnungen', 'Karten verfallener Reiche & Dungeons'],
    meister: ['Königlicher Hofgeograph & Großkartograph', 'Kartenmonopol für die Admiralität', 'Leitung der Reichslandesvermessung', 'Ausbildung an der Geodäsie-Akademie']
  },
  astronom: {
    lehrling: ['Fernrohrtubus ausrichten', 'Sternenkataloge aufschlagen', 'Uhrzeitmessungen synchronisieren', 'Linsen polieren & vor Tau schützen'],
    geselle: ['Planetenbahnen & Finsternisse berechnen', 'Sternbilder & Himmelskoordinaten bestimmen', 'Sonnenwenden & Kalendarien festlegen', 'Aufzeichnung von Kometenbahnen'],
    spezialisierung: ['Astrolabienbau & Himmelsgloben', 'Konstellationsanalyse für Schifffahrt & Magie', 'Berechnung kosmischer Zyklen', 'Spektralanalyse arkaner Sternenstrahlen'],
    meister: ['Leiter der Königlichen Sternwarte', 'Hofastronom des Monarchen', 'Kalenderreform des gesamten Reiches', 'Entdeckung neuer Gestirne & Himmelskörper']
  },
  naturkundler: {
    lehrling: ['Tier- & Pflanzenpräparate anlegen', 'Feldtagebuch führen', 'Probenbehälter mit Alkohol füllen', 'Lupenuntersuchungen durchführen'],
    geselle: ['Klassifikation von Tierarten & Insekten', 'Beobachtung von Tierverhalten in freier Wildbahn', 'Ökosysteme & Nahrungsketten dokumentieren', 'Vergleichende Morphologie betreiben'],
    spezialisierung: ['Kryptobiologie seltener magischer Wesen', 'Tiefsee- & Höhlenfauna-Forschung', 'Präparation lebensgroßer Museumsexemplare', 'Verhaltensforschung an Bestien'],
    meister: ['Direktor des Naturhistorischen Museums', 'Monumentalwerke über die Tierwelt verfassen', 'Wissenschaftliche Expeditionen leiten', 'Ausbildung im Fach Naturkunde']
  },
  geograph: {
    lehrling: ['Gesteins- & Bodenproben sammeln', 'Klimatabellen führen', 'Geländeskizzen anfertigen', 'Reiseberichte exzerpieren'],
    geselle: ['Landschaftsformen & Flusssysteme analysieren', 'Klimazonen & Vegetationszonen kartieren', 'Handelswege & Passstraßen erforschen', 'Besiedlungs- & Kulturgeographie betreiben'],
    spezialisierung: ['Geomorphologie vulkanischer Regionen', 'Wüsten- & Polarexpeditionen leiten', 'Strategische Geographie für Kriegsführung', 'Erforschung unerreichbarer Kontinente'],
    meister: ['Leiter der Geographischen Gesellschaft', 'Gesamterdwerk / Weltatlas herausgeben', 'Berater für koloniale Expansion & Grenzen', 'Akademische Geographie-Führung']
  },
  sprachgelehrter: {
    lehrling: ['Grammatiktabellen abschreiben', 'Vokabeln alter Sprachen pauken', 'Lautschrift & Phonetik üben', 'Wörterbücher ordnen'],
    geselle: ['Übersetzung antiker Schriften & Dialekte', 'Sprachvergleiche & Etymologie erforschen', 'Simultandolmetschen bei Verhandlungen', 'Entzifferung von Runen & Keilschriften'],
    spezialisierung: ['Verlorene & tote Sprachen rekonstruieren', 'Arkane Sprachformen & Zauberworte verstehen', 'Kryptographie & Geheimsprachen entschlüsseln', 'Sprachen außereuropäischer/fremder Völker'],
    meister: ['Großmeister der Philologie', 'Entschlüsselung uralter Schöpfungssprachen', 'Chefdolmetscher für imperiale Friedensgipfel', 'Leitung der Fakultät für Linguistik']
  },
  alchemist: {
    lehrling: ['Retorten & Kolben reinigen', 'Zutaten im Mörser pulverisieren', 'Wasserbad- & Sandbadtemperaturen halten', 'Sicherheitsabstände bei Reaktionen einhalten'],
    geselle: ['Destillation & Sublimation durchführen', 'Heiltränke, Säuren & Leuchtfeuer brauen', 'Elementare Reaktionen steuern', 'Reinheitsprüfung alchemistischer Salze'],
    spezialisierung: ['Alchemistisches Feuer & Sprengmittel', 'Elixiere der Verjüngung & Kraftsteigerung', 'Transmutation unedler Metalle', 'Hass- & Liebestränke / Geisteselixiere'],
    meister: ['Großalchemist & Suche nach dem Stein der Weisen', 'Vollendung der Großen Transmutation', 'Leitung der königlichen Alchemie-Manufaktur', 'Gilde-Vorsitz der Alchemisten']
  },
  magieforscher: {
    lehrling: ['Mana-Kondensatoren laden', 'Messungen arkaner Strahlung notieren', 'Schutzkreise vor Experimenten ziehen', 'Magische Lehrbücher abschreiben'],
    geselle: ['Analytische Zerlegung fremder Zauberwirkungen', 'Spektralanalyse von Mana-Fäden', 'Resonanztests an magischen Artefakten', 'Dokumentation von Zaubervariationen'],
    spezialisierung: ['Erforschung magischer Anomalien & Risse', 'Synthese neuer Zaubersprüche', 'Meta-Magie & Zauber-Verstärkungsmethoden', 'Arkan-ökologische Feldstudien'],
    meister: ['Oberster Magieforscher des Arkanums', 'Entwicklung neuer Magieschulen', 'Stabilisierung weltbedrohlicher Manastürme', 'Lehrstuhlinhaber Arkanwissenschaft']
  },
  magietheoretiker: {
    lehrling: ['Grundlegende Axiome der Magie memorieren', 'Formeln magischer Geometrie zeichnen', 'Fehler in Zauberkonstrukten suchen', 'Arkanphilosophische Texte exzerpieren'],
    geselle: ['Mathematische Modellierung von Zaubermatrizen', 'Berechnung von Zauberdauer & Mana-Verbrauch', 'Theorie der Elementar-Wechselwirkungen', 'Kritik fehlerhafter Zauberkonstruktionen'],
    spezialisierung: ['Mehrdimensionale Magietheorie & Ebenenlehre', 'Theoretische Grundlagen von Zeit- & Raumzaubern', 'Paradoxiefreie Zauberformel-Entwicklung', 'Arkan-Kosmologie'],
    meister: ['Großtheoretiker der Arkanistik', 'Begründung fundamentaler Naturgesetze der Magie', 'Dekan der Fakultät für Magietheorie', 'Beratung der Erzmagier bei Großritualen']
  },
  kristallkundiger: {
    lehrling: ['Kristalle reinigen & polieren', 'Bruchkanten & Härtegrad bestimmen', 'Kristallgitter skizzieren', 'Sonnenspiegel für Bestrahlung ausrichten'],
    geselle: ['Magische Resonanzfrequenzen in Quarzen messen', 'Kristalline Energiespeicher aufladen', 'Kristalle spalten ohne Ladungsverlust', 'Prismen für magische Lichtbrechung schleifen'],
    spezialisierung: ['Kristalline Daten- & Gedankenspeicher programmieren', 'Fokuskristalle für Großlaser/Kanonen', 'Schwingungsabstimmung für Kristallkommunikation', 'Resonanzvernetzung mehrerer Kristallsysteme'],
    meister: ['Meister-Kristallurg & Schatzhüter', 'Erschaffung lebendiger Kristallstrukturen', 'Leitung der Kristallgroßmine & Labore', 'Ausbildung im Kristallhandwerk']
  },
  lehrer: {
    lehrling: ['Tafeln & Kreide bereitstellen', 'Unterrichtsmaterialien kopieren', 'Anwesenheitslisten führen', 'Schüler bei Übungsaufgaben beaufsichtigen'],
    geselle: ['Strukturierte Unterrichtsstunden halten', 'Schüler individuell fördern & korrigieren', 'Didaktische Methoden zielgerichtet anwenden', 'Leistungskontrollen & Prüfungen erstellen'],
    spezialisierung: ['Förderung hochbegabter Ausnahmeschüler', 'Entwicklung moderner Lehrpläne & Fibeln', 'Rhetorik- & Debattiertraining leiten', 'Umgang mit schwierigen/verhaltensauffälligen Schülern'],
    meister: ['Schuldirektor & Pädagogikmeister', 'Gründung & Leitung renommierter Lehranstalten', 'Lehrerausbildung & Bildungsreform', 'Hoflehrer königlicher Prinzen']
  },
  ausbilder: {
    lehrling: ['Übungsgeräte & Waffen vorbereiten', 'Sicherheitsregeln durchsetzen', 'Lehrlinge beim Antreten disziplinieren', 'Trainingsprotokolle führen'],
    geselle: ['Praktische Fertigkeiten schrittweise vermitteln', 'Fehler in Haltung & Ausführung korrigieren', 'Körperliche & geistige Belastbarkeit aufbauen', 'Gesellenprüfungen abnehmen'],
    spezialisierung: ['Drill- & Intensivausbildung für Elite-Einheiten', 'Didaktik handwerklicher Meistertechniken', 'Mentales Stärketraining unter Stress', 'Maßgeschneiderte Ausbildungsprogramme'],
    meister: ['Oberster Ausbildungsleiter / Generalinspektor', 'Festlegung nationaler Ausbildungsstandards', 'Leitung der zentralen Kadetten- & Zunftakademie', 'Prüfungsvorsitz aller Gewerke']
  },
  professor: {
    lehrling: ['Vorlesungsskripte zusammenstellen', 'Hörsaal lüften & Experimente aufbauen', 'Quellenangaben prüfen', 'Kolloquien protokollieren'],
    geselle: ['Universitätsvorlesungen selbstständig halten', 'Doktoranden & Magister anleiten', 'Fachgutachten für Gerichte & Fürsten erstellen', 'Wissenschaftliche Streitgespräche führen'],
    spezialisierung: ['Führende Koryphäe auf dem Spezialgebiet', 'Herausgabe internationaler Fachzeitschriften', 'Einwerbung fürstlicher Forschungsgelder', 'Organisation akademischer Kongresse'],
    meister: ['Universitätskanzler & Doyen der Wissenschaft', 'Repräsentant der höchsten Bildungsebene', 'Königlicher Berater in Staats- & Wissenschaftsfragen', 'Lebenslange Ehrungen & Ehrendoktorwürden']
  },

  // --------------------------------------------------------------------------
  // 7. HANDEL & WIRTSCHAFT (handel_wirtschaft)
  // --------------------------------------------------------------------------
  haendler: {
    lehrling: ['Waren wiegen, zählen & verpacken', 'Preisschilder schreiben', 'Kunden freundlich begrüßen', 'Kassenbuch sauber führen'],
    geselle: ['Preise kalkulieren & verhandeln', 'Warenqualität prüfen & aussortieren', 'Transportlogistik organisieren', 'Zahlungsmodalitäten & Kredite abwickeln'],
    spezialisierung: ['Export- & Importhandel über Grenzen', 'Großhandelsrabatte & Mengenverträge', 'Handelsrouten-Sicherung gegen Räuber', 'Spekulation auf Ernte- & Rohstoffpreise'],
    meister: ['Handelsgildenmeister & Ratsherr', 'Leitung von Handelskontoren im Ausland', 'Finanzierung von Handelskonglomeraten', 'Zunftmeisterprüfung für Kaufleute']
  },
  kaufmann: {
    lehrling: ['Doppelte Buchführung erlernen', 'Wechselbriefe ausstellen & buchen', 'Geschäftskorrespondenz kopieren', 'Inventur im Warenlager aufnehmen'],
    geselle: ['Kaufverträge rechtssicher aufsetzen', 'Margenkalkulation & Frachtkostenabrechnung', 'Handelsvertretungen koordinieren', 'Währungsrisiken absichern'],
    spezialisierung: ['Fernhandelskompanien gründen', 'Schiffsfrachtcharterung & Seeversicherungen', 'Handelsmonopole für Luxuswaren erwerben', 'Großkredite für Städte & Adlige vergeben'],
    meister: ['Patrizier & Handelsfürst', 'Einfluss auf die Stadtpolitik & Reichsfinanzen', 'Leitung eines weltweiten Handelshauses', 'Senator & Präsident der Kaufmannsgilde']
  },
  markthaendler: {
    lehrling: ['Marktstand im Morgengrauen aufbauen', 'Waren attraktiv auslegen', 'Kupfermünzen wechseln', 'Marktabfälle wegräumen'],
    geselle: ['Marktschreierei & Kundenanlockung', 'Schnelles Handeln & Feilschen', 'Frischeprüfung vor Marktöffnung', 'Tagesumsatz kalkulieren & Standgebühr zahlen'],
    spezialisierung: ['Beste Standplätze auf Jahrmärkten sichern', 'Saisonale Spezialangebote platzieren', 'Großkundenbelieferung an Tavernen', 'Schutz vor Taschendieben am Stand'],
    meister: ['Marktmeister & Sprecher der Marktgilde', 'Organisation städtischer Wochen- & Jahrmärkte', 'Schlichtung von Standstreitigkeiten', 'Eich- & Preiskontrolle auf dem Markt']
  },
  fernhaendler: {
    lehrling: ['Reiseausrüstung & Planwagen packen', 'Zollpapiere & Geleitbriefe ordnen', 'Fremde Währungen umrechnen lernen', 'Nachtwache im Lager halten'],
    geselle: ['Karawanen über Pässe & Wüsten führen', 'Verhandlungen mit fremden Fürsten & Häuptlingen', 'Beschaffung seltener Gewürze, Seide & Erze', 'Geleitschutzverträge aushandeln'],
    spezialisierung: ['Pionierrouten durch Krisengebiete erschließen', 'Handel mit verbotenen/exotischen Gütern', 'Dolmetschen & fremde Geschäftskulturen nutzen', 'Spezialfrachttransport (zerbrechlich/lebendig)'],
    meister: ['Karawanen-Magnat & Seidenstraßenleiter', 'Eigene befestigte Karawansereien betreiben', 'Großverträge zwischen Imperien', 'Ausbildung im Fernhandelswesen']
  },
  grosshaendler: {
    lehrling: ['Großgebinde kontrollieren & stapeln', 'Lieferscheine abstempeln', 'Warenproben entnehmen', 'Temperatur im Großlager überwachen'],
    geselle: ['Einkauf ganzer Schiffsladungen & Ernten', 'Vertriebsnetze für Einzelhändler steuern', 'Lieferantenkredite & Zahlungsziele setzen', 'Umlaufgeschwindigkeit der Bestände optimieren'],
    spezialisierung: ['Schüttgut-Logistik (Korn, Salz, Kohle)', 'Zollfreilager & Umschlagplätze leiten', 'Preiskartell- & Kontingentabsprachen', 'Monopolbildung bei Grundnahrungsmitteln'],
    meister: ['Großhandelsdirektor & Hanse-Syndikus', 'Versorgungssicherheit ganzer Metropolen garantieren', 'Großhandelsgerichtsbarkeit ausüben', 'Innungsleitung Großhandel']
  },
  kraemer: {
    lehrling: ['Regale einräumen & abstauben', 'Essig, Öl & Mehl abfüllen', 'Pfennigbeträge zusammenrechnen', 'Krämerladen kehren'],
    geselle: ['Vollsortiment des täglichen Bedarfs führen', 'Gute Beziehungen zur Nachbarschaft pflegen', 'Anschreiben auf Kredit & Eintreiben von Schulden', 'Lieferanten für Kleinwaren auswählen'],
    spezialisierung: ['Kombination aus Krämerladen & Poststelle', 'Spezialitäten aus Übersee anbieten', 'Notkreditvergabe an Dorfbewohner', 'Exklusive Kolonialwaren führen'],
    meister: ['Krämerzunftmeister', 'Zentraler Einkaufsverbund für Krämer', 'Schlichtung von Nachbarschafts- & Preiskonflikten', 'Ausbildung im Krämerhandwerk']
  },
  warenhaendler: {
    lehrling: ['Warenmuster sortieren', 'Gewichte & Maße eichen', 'Kisten vernageln & beschriften', 'Rechnungsdurchschläge abheften'],
    geselle: ['Warenströme zwischen Produzent & Abnehmer leiten', 'Qualitätsgutachten erstellen', 'Kommissionsgeschäfte abwickeln', 'Lieferverzögerungen managen'],
    spezialisierung: ['Spezialisierung auf Manufakturwaren', 'Großvolumige B2B-Lieferverträge', 'Schadensregulierung bei Frachtschäden', 'Termingeschäfte & Vorverträge'],
    meister: ['Warenbörsen-Präsident', 'Festlegung standardisierter Warenklassen', 'Leitung der städtischen Warenbörse', 'Meisterprüfung im Warenhandel']
  },
  lebensmittelhaendler: {
    lehrling: ['Obst & Gemüse auf Fäulnis prüfen', 'Kühlkeller sauber halten', 'Pökelwaren umschichten', 'Waagen kalibrieren'],
    geselle: ['Frischegarantien kalkulieren & abschreiben', 'Einkauf bei Bauern & Gärtnern koordinieren', 'Saisonale Preisschwankungen nutzen', 'Hygienestandards beim Verkauf einhalten'],
    spezialisierung: ['Exotische Früchte & Feinkostimport', 'Großlieferung an Adelshäuser & Klöster', 'Trocken- & Konservierungsgroßlager', 'Kühlkettenmanagement per Eiskeller'],
    meister: ['Feinkost-Hoflieferant', 'Lebensmittelinspektor der Stadtverwaltung', 'Großhändlerverband Lebensmittel leiten', 'Zunftmeisterprüfung Lebensmittelhandel']
  },
  stoffhaendler: {
    lehrling: ['Stoffballen rollen & stapeln', 'Ellenbogenmaß / Tuchmesslatte anlegen', 'Motten- & Feuchtigkeitsschutz sicherstellen', 'Musterkarten schneiden'],
    geselle: ['Gewebequalität (Fadendichte, Walkung) prüfen', 'Seide, Samt, Woll- & Leinentuche verkaufen', 'Maßzuschnitt ohne Verschnitt', 'Farbabstimmung für Schneider & Kunden'],
    spezialisierung: ['Import kostbarster Brokate & Damaste', 'Großbelieferung der Schneiderzünfte & Heere', 'Echtheitsprüfung von Purpur & Goldfäden', 'Tuchhandel auf internationalen Messen'],
    meister: ['Gewandschneider- & Tuchherrenmeister', 'Ratsmitglied der Tuchhändlergilde', 'Zollprivilegien für Tuchexporte', 'Ausbildung von Stoffkaufleuten']
  },
  waffenhaendler: {
    lehrling: ['Klingen ölen & Rost entfernen', 'Waffenständer bestücken', 'Waffenscheine & Kundendaten prüfen', 'Schwerter sicher verpacken'],
    geselle: ['Waffenqualität nach Schmiedemarke beurteilen', 'Kunden nach Statur & Kampfstil beraten', 'Munition, Bolzen & Zubehör verkaufen', 'Waffengesetze & Trageverbote beachten'],
    spezialisierung: ['Großlieferungen für Söldnerheere & Stadtwachen', 'Handel mit magischen & meisterhaften Waffen', 'Schwarzmarkt für verbotene Waffen', 'Exotische Kampfgeräte aus fernen Ländern'],
    meister: ['Hofwaffenhändler & Rüstmeisterberater', 'Monopolist für staatliche Waffenbeschaffung', 'Waffengildenpräsident', 'Lizenzierung aller Waffengeschäfte']
  },
  ruestungshaendler: {
    lehrling: ['Rüstungen polieren & entfetten', 'Lederriemen an Harnischen ersetzen', 'Schaufensterpuppen ankleiden', 'Helme sortieren'],
    geselle: ['Anpassung von Rüstungsteilen vor Ort', 'Qualitätsprüfung von Nietung & Materialstärke', 'Kombination von Ketten-, Leder- & Plattenpanzern', 'Finanzierungs- & Mietpläne für Turniere'],
    spezialisierung: ['Turnierrüstungen & Prunkharnische handeln', 'Großausrüstung kompletter Garderegimenter', 'Magisch gehärtete & verzauberte Schutzrüstungen', 'Maßanfertigungs-Auftragsvergabe an Plattner'],
    meister: ['Harnischkammer-Großhändler', 'Ausrüster der königlichen Ritterschaft', 'Zunftprüfung für Rüstungshandel', 'Leitung internationaler Rüstungsbörsen']
  },
  juwelenhaendler: {
    lehrling: ['Edelsteine im Samttuch vorlegen', 'Lupen & Präzisionswaagen reinigen', 'Sicherheitstresore öffnen & verriegeln', 'Kataloge führen'],
    geselle: ['Reinheit, Schliff, Farbe & Karat bestimmen', 'Schmuckstücke taxieren & anrechnen', 'Diskrete Verkaufsgespräche mit Aristokraten', 'Fälschungen & Glasimitate entlarven'],
    spezialisierung: ['Handel mit weltberühmten Großdiamanten', 'Ankauf von Schatzkammer- & Krongütern', 'Diskrete Vermittlung fürstlicher Erbschaften', 'Magisch aktive Resonanzsteine handeln'],
    meister: ['Hofjuwelenhändler der Krone', 'Präsident der internationalen Edelsteinbörse', 'Gutachter für Staatskassen & Tribute', 'Ausbildung von Gemmologen']
  },
  viehhaendler: {
    lehrling: ['Viehtränken füllen & treiben', 'Tiere auf Krankheitsanzeichen prüfen', 'Treibpeitschen & Stricke bereitstellen', 'Viehwaggons/Koppeln reinigen'],
    geselle: ['Zustand, Fleischansatz & Alter am Gebiss erkennen', 'Tiere auf Viehmärkten ersteigern & versteigern', 'Viehtriebe über weite Strecken organisieren', 'Verhandlungen mit Metzgern & Bauern'],
    spezialisierung: ['Edelpferde- & Zuchtrinderhandel', 'Großlieferungen von Schlachtvieh an Städte', 'Pferdehandel für Armee & Kavallerie', 'Viehquarantäne & Seuchenabwehr'],
    meister: ['Oberster Viehgildenmeister', 'Organisation nationaler Viehauktionen', 'Veterinärvertragsaufsicht', 'Schlichtung von Gewährleistungsstreitigkeiten']
  },
  antiquitaetenhaendler: {
    lehrling: ['Altertümer vorsichtig entstauben', 'Herkunftsnotizen abheften', 'Konservierungsöle auftragen', 'Vitrinen abschließen'],
    geselle: ['Epochen- & Herkunftsbestimmung von Objekten', 'Restaurierungsbedarf ermitteln', 'Feilschen bei Haushaltsauflösungen & Nachlässen', 'Fälschungen von echten Relikten unterscheiden'],
    spezialisierung: ['Handel mit verbotenen & okkulten Relikten', 'Historische Waffen- & Rüstungsantiquitäten', 'Entschlüsselung geheimer Inschriften auf Objekten', 'Belieferung von Privatmuseen & Sammlern'],
    meister: ['Chef-Kurator & Hoftaxator für Altertümer', 'Untersuchung von Reichsinsignien & Ur-Relikten', 'Leitung der Antiquitätengilde', 'Experte für unschätzbare Kulturdenkmäler']
  },
  geldwechsler: {
    lehrling: ['Münzsorten fremder Länder erkennen', 'Münzwaage auf Zehntelgramm justieren', 'Prüfsteine & Salpetersäure bereitlegen', 'Kassenbücher führen'],
    geselle: ['Feingehalt von Gold- & Silbermünzen prüfen', 'Wechselkurse nach Marktlage berechnen', 'Münzentwertung (Kippen & Wippen) aufdecken', 'Wechselgebühren & Aufgeld einbehalten'],
    spezialisierung: ['Großwechsel für internationale Kaufleute', 'Ausstellung von Wechselbriefen statt Bargeld', 'Arbitrage zwischen Währungsräumen', 'Devisenhandel an Messeplätzen'],
    meister: ['Münzmeister & Wechselbörsenleiter', 'Aufsicht über das städtische Münzwesen', 'Festlegung offizieller Wechselkurstabellen', 'Ausbildung im Geldwechselhandwerk']
  },
  bankier: {
    lehrling: ['Kontobücher führen & abgleichen', 'Zinsberechnungen durchführen', 'Kreditakten archivieren', 'Schatzkammertresore überwachen'],
    geselle: ['Kreditwürdigkeit von Kaufleuten prüfen', 'Kontoeröffnung & Einlagengeschäft', 'Zahlungsanweisungen & Schuldscheine ausstellen', 'Verpfändungen von Immobilien & Schiffen'],
    spezialisierung: ['Staatsanleihen & Fürstenkredite vergeben', 'Finanzierung von Kriegen & Großbauten', 'Beteiligung an Handels- & Minenkompanien', 'Internationales Filialnetz verwalten'],
    meister: ['Privatbankier des Hochadels / Bankhausleiter', 'Prägung der Finanzpolitik ganzer Nationen', 'Sanierung von Staatsfinanzen', 'Präsident der Bankiersvereinigung']
  },
  schiffshaendler: {
    lehrling: ['Schiffsregister einsehen & kopieren', 'Trockendocks besichtigen', 'Takelagen & Rümpfe auf Schäden prüfen', 'Vertragsurkunden stempeln'],
    geselle: ['Wertermittlung von Karavellen, Galeonen & Kähnen', 'Kauf- & Charterverträge für Reeder aufsetzen', 'Schiffsauktionen leiten', 'Vermittlung von Neubauten an Werften'],
    spezialisierung: ['Kriegsschiff- & Galeerenhandel für Seemächte', 'Abwicklung von Prisen & gekaperten Schiffen', 'Havarie- & Wrackbergungsgeschäfte', 'Finanzierung ganzer Handelsflotten'],
    meister: ['Admiralitätsmakler & Großreeder', 'Präsident der Schifffahrtsbörse', 'Flottenverträge zwischen Königtümern', 'Ausbildung von Schiffskaufleuten']
  },
  strassenverkaeufer: {
    lehrling: ['Bauchladen packen & balancieren', 'Lautstarke Rufe & Reime üben', 'Kupferkleingeld wechseln', 'Stadtwachen & Patrouillen beobachten'],
    geselle: ['Schneller Straßenverkauf von Kleinwaren & Snacks', 'Flucht bei unbefugtem Verkauf / Kontrollen', 'Gespür für belebte Kreuzungen & Plätze', 'Tageseinnahmen sichern'],
    spezialisierung: ['Vertrieb exklusiver Neuheiten auf Straßen', 'Anführer eines Straßenverkäufer-Netzwerks', 'Verkauf von Gerüchten & Stadtneuigkeiten', 'Geschicktes Umgehen von Verkaufsverboten'],
    meister: ['Oberhaupt der Straßenhändlergilde', 'Zuteilung lukrativer Straßenbezirke', 'Schutzverträge mit Stadtwachen & Banden', 'Effiziente mobile Kleinhandelslogistik']
  },
  marktverkaeufer: {
    lehrling: ['Stände reinigen & Waren drapieren', 'Preise ausrufen', 'Tüten & Körbe packen', 'Geldbeutel vor Dieben schützen'],
    geselle: ['Verkaufstechnik & Kundengespräch führen', 'Frischware schnell vor Marktschluss abverkaufen', 'Mengenrabatte geschickt einsetzen', 'Kassenabschluss fehlerfrei machen'],
    spezialisierung: ['Großkundenbetreuung auf dem Markt', 'Exklusive Probierstände betreiben', 'Vertrieb eigener Manufakturprodukte', 'Marktpsychologie & Standoptimierung'],
    meister: ['Chef-Verkaufsleiter auf Zentralmärkten', 'Schulung von Verkaufspersonal', 'Organisation von Marktschreier-Wettbewerben', 'Gildenprüfung für Verkaufskräfte']
  },
  warenpruefer: {
    lehrling: ['Eichmaße & Prüfgewichte bereithalten', 'Prüfsiegel & Brennstempel säubern', 'Warenproben ziehen', 'Prüfprotokolle führen'],
    geselle: ['Qualitäts- & Echtheitsprüfung von Tuchen, Getreide & Metall', 'Aussortieren mangelhafter / gepanschter Ware', 'Vergabe amtlicher Gütesiegel & Stempel', 'Zoll- & Normkontrollen durchführen'],
    spezialisierung: ['Aufspüren raffinierter Fälschungen & Streckungen', 'Prüfung gefährlicher Alchemika & Pulver', 'Schiedsgutachten bei Handelsstreitigkeiten', 'Spezialprüfung für Hoflieferungen'],
    meister: ['Oberster Revisionsrat & Chefprüfer', 'Festlegung reichsweiter Gütestandards & Normen', 'Leitung des Eich- & Warenprüfamtes', 'Zunftrichterliche Gutachtenhoheit']
  },
  makler: {
    lehrling: ['Immobilien- & Grundstückslisten führen', 'Besichtigungstermine koordinieren', 'Grundbuchauszüge einholen', 'Kundenanfragen sortieren'],
    geselle: ['Kauf- & Mietinteressenten zusammenbringen', 'Objektbewertung nach Lage & Zustand', 'Verhandlungen & Courtagevereinbarungen führen', 'Notarielle Beurkundung vorbereiten'],
    spezialisierung: ['Vermittlung von Stadtpalästen & Rittergütern', 'Gewerbeimmobilien & Werftanlagen vermakeln', 'Diskrete Übernahme verschuldeter Ländereien', 'Internationale Immobilienportfolios'],
    meister: ['Großmakler & Ratsbeauftragter für Liegenschaften', 'Stadtentwicklungsprojekte vermitteln', 'Präsident des Maklerverbandes', 'Ausbildung im Maklerwesen']
  },
  haendleragent: {
    lehrling: ['Telegramme & Eilbriefe überbringen', 'Musterkollektionen transportieren', 'Reisetagebuch & Spesen abrechnen', 'Lokale Handelssitten studieren'],
    geselle: ['Außendienst für große Handelshäuser', 'Neuakquise von Kaufleuten & Betrieben', 'Marktbeobachtung & Preismeldung an die Zentrale', 'Vertragsabschlüsse vor Ort besiegeln'],
    spezialisierung: ['Agentur in feindlichen/unsicheren Regionen', 'Exklusivverträge mit Monopolisten sichern', 'Krisenintervention bei vertragsbrüchigen Partnern', 'Spionage über fremde Handelsflotten'],
    meister: ['Generalbevollmächtigter eines Imperiums-Kontors', 'Leitung des globalen Agentennetzwerks', 'Strategische Allianzen auf höchster Ebene', 'Kaufmännische Diplomatie']
  },
  auktionator: {
    lehrling: ['Auktionskataloge drucken & verteilen', 'Auktionsstücke auf der Bühne präsentieren', 'Bieterkarten ausgeben', 'Auktionsprotokoll führen'],
    geselle: ['Auktionen souverän leiten & Bietergefechte anheizen', 'Schätzpreise & Mindestgebote festlegen', 'Hammerschlag & Zuschlag rechtssicher erteilen', 'Abrechnung & Auszahlung an Einlieferer'],
    spezialisierung: ['Versteigerung fürstlicher Nachlässe & Kunstsammlungen', 'Zwangsversteigerungen verschuldeter Schiffe & Burgen', 'Auktionen seltener Artefakte & magischer Relikte', 'Geheime Auktionen für den Hochadel'],
    meister: ['Präsident des Auktionshauses', 'Rekordzuschläge bei Weltraritäten', 'Offizieller Staatsauktionator für Kriegsbeute', 'Innungsprüfung für Auktionatoren']
  },
  lagerverwalter: {
    lehrling: ['Lagerkisten etikettieren & nummerieren', 'Lagergänge freihalten & fegen', 'Feuchtigkeitsmesser ablesen', 'Schädlingsfallen kontrollieren'],
    geselle: ['Lagerorganisation (First In, First Out)', 'Bestandsüberwachung & Nachbestellungen auslösen', 'Ein- & Auslagerungsscheine quittieren', 'Sicherung vor Diebstahl & Brandschäden'],
    spezialisierung: ['Kühl- & Gefrierlagerverwaltung', 'Gefahrgut- & Sprengstofflagerung', 'Hochsicherheitslager für Edelmetalle & Juwelen', 'Zolllagerverwaltung am Seehafen'],
    meister: ['Logistikdirektor & Großlagerleiter', 'Planung riesiger Zentrallagerkomplexe', 'Umschlagoptimierung für Handelskonzerne', 'Ausbildung von Lagerfachkräften']
  },
  lagerarbeiter: {
    lehrling: ['Kisten & Fässer sicher greifen & heben', 'Sackkarren & Rollwagen schieben', 'Gurtungen & Sicherungskeile anlegen', 'Arbeitsschutzschuhe & Handschuhe tragen'],
    geselle: ['Schnelles Be- & Entladen von Schiffen & Fuhrwerken', 'Bedienung von Seilzügen, Flaschenzügen & Winden', 'Schwere Güter ohne Bruch bewegen', 'Teamarbeit bei Schwerlasten'],
    spezialisierung: ['Bedienung gigantischer Hafenkräne & Tretkräne', 'Verladung empfindlicher Luxusgüter & Glas', 'Schwerlasttransporte bis zu mehreren Tonnen', 'Sicherheits- & Rettungseinsätze bei Lagerunfällen'],
    meister: ['Oberlagermeister & Kolonnenführer', 'Schichtplanung für hunderte Lagerarbeiter', 'Unfallverhütung & Arbeitszeitoptimierung', 'Lagerlogistik-Leitung']
  },

  // --------------------------------------------------------------------------
  // 8. DIENSTLEISTUNG (dienstleistung)
  // --------------------------------------------------------------------------
  barbier: {
    lehrling: ['Rasierschaum schlagen & heißes Tuch auflegen', 'Rasiermesser auf Leder abziehen', 'Haare zusammenkehren', 'Kunden bedienen'],
    geselle: ['Klassische Rasur mit der offenen Klinge', 'Bartstutzen & Haarschnitt nach Mode', 'Kopfhautmassagen & Haarwasser anwenden', 'Blutstillung bei Schnittwunden'],
    spezialisierung: ['Aufwendige Bartfrisuren & Schnurrbartzwirbeln', 'Zähne ziehen & kleine Abszesse öffnen', 'Perückenanpassung & Toupets', 'Duft- & Pomadenherstellung'],
    meister: ['Barbiermeister & Salondekoration', 'Zunftmeister Barbiere & Friseure', 'Hofbarbier des Adels', 'Ausbildung von Barbierlehrlingen']
  },
  friseur: {
    lehrling: ['Haare waschen & ausspülen', 'Lockenwickler eindrehen', 'Scheren & Kämme desinfizieren', 'Kundenservice im Salon'],
    geselle: ['Präzise Haarschnitte nach Maß', 'Haare färben & tönen mit Naturfarben', 'Hochsteckfrisuren für Bälle & Feste', 'Föhnen, Ondulieren & Glätten'],
    spezialisierung: ['Komplexe Flecht- & Hochfrisuren für Hofdamen', 'Verarbeitung von Echthaarverlängerungen', 'Bühnenfrisuren für Theater & Oper', 'Entwicklung eigener Haarpflegeprodukte'],
    meister: ['Salonleiter & Starcoiffeur', 'Hofhairstylist für königliche Hochzeiten', 'Modetrends & Trendkollektionen kreieren', 'Innungsprüfung Friseurhandwerk']
  },
  kosmetiker: {
    lehrling: ['Gesichtsmasken anrühren', 'Schminkpinsel reinigen', 'Hauttypen bestimmen lernen', 'Öle & Essenzen bereithalten'],
    geselle: ['Gesichtsreinigungen & Peelings durchführen', 'Make-up für Alltag & Abendveranstaltungen', 'Augenbrauenzupfen & Wimpernfärben', 'Hautpflegeberatung & Cremeanwendung'],
    spezialisierung: ['Theaterschminke & Spezialeffekte (Wunden/Narben)', 'Königliche Hofkosmetik mit Gold- & Perlenstaub', 'Anti-Aging-Kuren & Faltenbehandlung', 'Körperbemalung & Schönheitsflecken'],
    meister: ['Hofkosmetiker & Visagistikmeister', 'Eigene Kosmetiklinie entwickeln', 'Schulungszentrum für Schönheitspflege leiten', 'Persönlicher Schönheitsberater von Königen']
  },
  waescher: {
    lehrling: ['Wäschekörbe schleppen & sortieren', 'Wasser aus dem Fluss/Brunnen schöpfen', 'Seifenlauge ansetzen', 'Wäscheleinen spannen'],
    geselle: ['Hartnäckige Flecken (Blut, Fett, Wein) entfernen', 'Wäsche auf Waschbrettern rubbeln & kochen', 'Wäsche mangeln, stärken & glätten', 'Feine Stoffe (Seide, Spitze) schonend waschen'],
    spezialisierung: ['Großwäscherei für Spitäler & Kasernen leiten', 'Aufbereitung kostbarster Hofgewänder & Brokate', 'Duftwäsche mit Lavendel & Rosenwasser', 'Chemische Fleckentfernung mit Speziallaugen'],
    meister: ['Wäschereibetriebsleiter', 'Großaufträge von Palästen & Hotels', 'Zunftprüfung Wäschereihandwerk', 'Ausbildung im Wäschereiwesen']
  },
  reinigungskraft: {
    lehrling: ['Besen & Schrubber führen', 'Mülleimer leeren & Asche entsorgen', 'Spinnweben entfernen', 'Putzmittel sparsam dosieren'],
    geselle: ['Systematische Grundreinigung von Räumen', 'Böden scheuern, wachsen & polieren', 'Fenster streifenfrei putzen', 'Desinfektion von Sanitärbereichen'],
    spezialisierung: ['Tatort- & Seuchenhaus-Reinigung', 'Reinigung von Palastsälen & Kronleuchtern', 'Industriereinigung in Bergwerken & Mühlen', 'Schädlingsbeseitigung & Geruchsneutralisation'],
    meister: ['Oberinspektor für Gebäudereinigung', 'Personaleinsatzpläne für Großbauten', 'Hygienekonzepte für Festungen & Spitäler', 'Leitung des städtischen Reinigungsdienstes']
  },
  dienstbote: {
    lehrling: ['Hausregeln lernen & gehorchen', 'Feuerholz tragen & Kamine anzünden', 'Klopfen & Türen öffnen', 'Schuhe putzen'],
    geselle: ['Aufträge im Haus zügig & diskret erledigen', 'Speisen & Getränke zutragen', 'Gäste ankündigen & Mäntel abnehmen', 'Hauswäsche & Botengänge übernehmen'],
    spezialisierung: ['Persönlicher Kammerdiener / Kammerzofe', 'Diskrete Übermittlung vertraulicher Nachrichten', 'Reisebegleitung & Kofferpacken', 'Perfektes Benehmen in Adelskreisen'],
    meister: ['Erster Diener des Haushalts', 'Anleitung des gesamten Dienstbotenpersonals', 'Vertrauensperson der Herrschaft', 'Dienstbotenvermittlung & Prüfung']
  },
  hausdiener: {
    lehrling: ['Gänge kehren & Lampen ölen', 'Geschirr abräumen', 'Klopfer bedienen', 'Uniform stets sauber halten'],
    geselle: ['Empfang & Bewirtung von Hausgästen', 'Silbergeschirr & Kristall pflegen', 'Hausordnung durchsetzen', 'Gepäck auf Zimmer bringen'],
    spezialisierung: ['Hausmeisterliche Kleinreparaturen', 'Weinkellerverwaltung & Schankaufsicht', 'Sicherheitsrundgänge bei Nacht', 'Festsaalvorbereitung'],
    meister: ['Chef-Hausdiener im Herrenhaus', 'Dienstplanerstellung für Personal', 'Budgetverwaltung für Haushaltsmittel', 'Schulung von Hausdienern']
  },
  butler: {
    lehrling: ['Diskrete Haltung & Etikette üben', 'Silberbesteck auf Millimeter eindecken', 'Tür- & Telefondienst / Glockenzugdienst', 'Weinflaschen entkorken lernen'],
    geselle: ['Menüfolge & Weinservice leiten', 'Herrenbekleidung pflegen & vorbereiten', 'Gästebetreuung auf höchstem Niveau', 'Hausorganisation im Hintergrund führen'],
    spezialisierung: ['Verwaltung kostbarster Weinkeller', 'Organisation von Staatsbanketten', 'Persönlicher Assistent von Monarchen & Milliardären', 'Absolute Diskretion & Sicherheitskoordination'],
    meister: ['Chefbutler / Majordomus eines Schlosses', 'Gesamtleitung des fürstlichen Haushalts', 'Ausbildung an der Internationalen Butler-Akademie', 'Höchste Instanz der Hauskultur']
  },
  haushaelter: {
    lehrling: ['Einkaufszettel schreiben', 'Haushaltsausgaben notieren', 'Speisekammer kontrollieren', 'Putzkolonnen einweisen'],
    geselle: ['Wöchentlichen Haushaltsplan erstellen', 'Personal anstellen & überwachen', 'Einkauf von Lebensmitteln & Textilien', 'Budgetierung der Haushaltskasse'],
    spezialisierung: ['Wirtschaftliche Führung großer Landgüter', 'Nachlass- & Inventarverwaltung', 'Großveranstaltungs-Catering planen', 'Personalverträge & Schlichtung'],
    meister: ['Herrschaftlicher Hausverwalter / Haushofmeister', 'Alleinige Finanz- & Sachhoheit über Residenzen', 'Verwaltung von Palästen & Landsitzen', 'Ausbildung von Haushaltsmanagern']
  },
  kinderbetreuer: {
    lehrling: ['Spiele anleiten & beaufsichtigen', 'Kindern Mahlzeiten servieren', 'Schlafenszeiten überwachen', 'Erste Hilfe bei Schürfwunden'],
    geselle: ['Erziehung & Benehmen spielerisch vermitteln', 'Förderung von Sprache & Motorik', 'Konfliktschlichtung zwischen Kindern', 'Tagesabläufe strukturiert gestalten'],
    spezialisierung: ['Gouvernante / Hauslehrer für Adelskinder', 'Mehrsprachige Früherziehung', 'Betreuung von Kindern mit besonderen Bedürfnissen', 'Musik- & Kunstförderung'],
    meister: ['Leitung von Waisenhäusern & Erziehungsheimen', 'Oberste Hofgouvernante für Kronprinzen', 'Pädagogische Konzeptentwicklung', 'Ausbildung von Erziehern']
  },
  pfleger: {
    lehrling: ['Patienten beim Aufstehen helfen', 'Essen anreichen', 'Rollstühle & Tragen schieben', 'Geduldig zuhören'],
    geselle: ['Tägliche Körperpflege durchführen', 'Geh- & Bewegungsübungen anleiten', 'Dokumentation des Pflegezustands', 'Notfallmaßnahmen bei Stürzen'],
    spezialisierung: ['Demenziell erkrankte & verwirrte Personen pflegen', 'Rehabilitationspflege nach Schlaganfällen', 'Schwerst- & Hospizpflege', 'Aktivierende Langzeitpflege'],
    meister: ['Pflegeheimleiter & Pflegedienstleiter', 'Qualitätsstandards in der Seniorenpflege', 'Ausbildung von Pflegeassistenten', 'Pflegegutachten für Behörden']
  },
  stallknecht: {
    lehrling: ['Mist aus Boxen schaufeln', 'Strohballen aufschütteln', 'Wassertröge schrubben & füllen', 'Pferdeäpfel von Stallgasse entfernen'],
    geselle: ['Pferde striegeln, bürsten & waschen', 'Fütterung nach Futterplan durchführen', 'Halfter, Trensen & Decken anlegen', 'Kranke Tiere isolieren & melden'],
    spezialisierung: ['Hengsthaltung & Betreuung schwieriger Pferde', 'Turnierbegleitung & Stallzeltaufbau', 'Wundversorgung & Umschläge an Pferdebeinen', 'Schnelles Verladen auf Transporter/Schiffe'],
    meister: ['Oberknecht & Stallvorsteher', 'Einsatzplanung für Stallhilfen', 'Hygiene & Futterwirtschaft im Großstall', 'Ausbildung von Pferdepflegern']
  },
  pferdepfleger: {
    lehrling: ['Hufpflege & Hufe fetten', 'Mähnen kämmen & verlesen', 'Führmaschine bedienen', 'Paddock-Sauberkeit sichern'],
    geselle: ['Pferde bandagieren & transportfertig machen', 'Longieren & Bewegen an der Longe', 'Futterrationen mineralstoffreich mischen', 'Zustand von Fell, Augen & Gang beurteilen'],
    spezialisierung: ['Groom / Pfleger für internationale Sportpferde', 'Turnierzöpfe & Schaufrisuren flechten', 'Physiotherapeutische Massagen für Pferde', 'Fohlenaufzucht & Stutenbetreuung'],
    meister: ['Gestütsoberpfleger & Stallmanager', 'Gesamtverantwortung für wertvolle Zuchtherden', 'Leitung der Pferdepflegerausbildung', 'Zertifizierung von Reitanlagen']
  },
  stallmeister: {
    lehrling: ['Stallbücher kontrollieren', 'Sattelkammer organisieren', 'Veterinärbesuche vorbereiten', 'Reitplatzpflege überwachen'],
    geselle: ['Fütterungs- & Trainingspläne koordinieren', 'Einteilung von Pferden nach Reiterniveau', 'Einkauf von Heu, Stroh & Kraftfutter', 'Überwachung der Hufbeschläge & Impfungen'],
    spezialisierung: ['Leitung königlicher Marställe', 'Kavallerie-Pferdepark verwalten', 'Organisation großer Reitturniere & Raufereien', 'Ankauf & Körung von Gestütspferden'],
    meister: ['Königlicher Oberstallmeister', 'Verwaltung des herrschaftlichen Fuhr- & Reitparks', 'Höchster Rang im Pferdesport & Marstall', 'Ausbildung von Reitmeistern & Gestütsleitern']
  },
  bote: {
    lehrling: ['Stadtpläne & Gassen auswendig lernen', 'Feste Schuhe & wetterfeste Kleidung pflegen', 'Pakete & Briefe sicher verstauen', 'Schnelles Laufen trainieren'],
    geselle: ['Eilige Nachrichten pünktlich zustellen', 'Empfangsbestätigungen einholen', 'Wegfindung bei Tag & Nacht', 'Widerstand gegen Wegelagerer & Hunde'],
    spezialisierung: ['Geheimbote mit versiegelter Depesche', 'Langstreckenläufer zwischen Städten', 'Überwindung von Burgmauern & Sperren', 'Unauffälliges Einschleusen von Briefen'],
    meister: ['Botenmeister der Stadt', 'Leitung des städtischen Botennetzwerks', 'Organisation von Botenrelais & Wechselstationen', 'Zunftprüfung für Botengewerbe']
  },
  kurier: {
    lehrling: ['Pferde für Eilritte satteln', 'Kuriertaschen plombieren', 'Waffen für Eigenschutz pflegen', 'Kartenlesen auf Distanz'],
    geselle: ['Reitstafetten über Hunderte Kilometer', 'Schneller Pferdewechsel an Relaisstationen', 'Schutz wichtiger Dokumente unter Lebensgefahr', 'Zollfreier Durchritt an Grenzen'],
    spezialisierung: ['Diplomatische Kurierreisen zu fernen Höfen', 'Durchquerung von Kriegsgebieten & Belagerungsringen', 'Verschlüsselte Depeschen mündlich memorieren', 'Wetterunabhängige Extremritte'],
    meister: ['Reichs-Oberpostmeister & Chefkurier', 'Leitung des gesamten staatlichen Kurierkorps', 'Diplomatenstatus an allen Königshöfen', 'Aufbau kontinentaler Nachrichtennetze']
  },
  postbote: {
    lehrling: ['Posttasche nach Straßen sortieren', 'Briefporto berechnen', 'Klingel- & Klopfordnung beachten', 'Postkutsche beladen'],
    geselle: ['Zuverlässige tägliche Zustelltouren', 'Einschreiben & Geldbeträge übergeben', 'Umgang mit unzustellbaren Sendungen', 'Pflege des Postbezirks'],
    spezialisierung: ['Poststellenleiter in Kleinstädten', 'Zustellung in entlegenen Bergdörfern & Inseln', 'Wertpost- & Geldtransportbegleitung', 'Postlogistik & Routenoptimierung'],
    meister: ['Postdirektor & Amtsleiter', 'Verwaltung regionaler Postämter', 'Planung von Postkutschenlinien', 'Beamtenprüfung im Postwesen']
  },
  fuhrmann: {
    lehrling: ['Zuggeschirre anlegen & prüfen', 'Wagenräder fetten', 'Ladung mit Seilen sichern', 'Pferde & Ochsen tränken'],
    geselle: ['Schwere Fuhrwerke mit 4-6 Tieren lenken', 'Bremsen an Steilabfahrten handhaben', 'Wegesicherheit & Achsenbrüche reparieren', 'Pünktliche Frachtablieferung garantieren'],
    spezialisierung: ['Schwertransporte monolithischer Steine/Kanonen', 'Gefahrgut- & Pulvertransport über Land', 'Fahrten durch Eis, Schlamm & Hochwasser', 'Führung von Fuhrunternehmer-Kolonnen'],
    meister: ['Fuhrunternehmer & Fuhrmannsgildenmeister', 'Große Speditionsflotten betreiben', 'Frachtverträge mit Großkaufleuten', 'Innungsleitung Fuhrmannsgewerbe']
  },
  kutscher: {
    lehrling: ['Kutsche waschen & Scheiben putzen', 'Kutschenlaternen mit Öl füllen', 'Pferde einspannen & Zügel halten', 'Trittbretter für Gäste ausklappen'],
    geselle: ['Eleganter Vierspänner-Fahrstil in der Stadt', 'Sichere Navigation durch dichten Stadtverkehr', 'Repräsentatives Auftreten & Höflichkeit', 'Pferdeschonende Fahrweise auf Reisen'],
    spezialisierung: ['Hofkutscher für Staatskarossen', 'Nachtkutschen & Expressverbindungen', 'Abwehr von Straßenräubern vom Kutschbock aus', 'Fahren von Sechs- & Achtspännern'],
    meister: ['Königlicher Leibkutscher', 'Leitung des Hofkutscherstalls', 'Ausbildung von Berufskutschern', 'Fahrprüfungsvorsitz der Kutschergilde']
  },
  reisefuehrer: {
    lehrling: ['Sehenswürdigkeiten & Stadtgeschichte lernen', 'Gruppen zusammenhalten & zählen', 'Reisegepäck organisieren', 'Fremdsprachen-Grundlagen üben'],
    geselle: ['Spannende Führungen durch historische Stätten', 'Unterkunft & Verpflegung für Reisende sichern', 'Gefahrenzonen & Fallen meiden', 'Kulturelle Bräuche & Gesetze vermitteln'],
    spezialisierung: ['Führungen durch antike Ruinen & Dungeons', 'Expeditionen in unerforschte Urwälder', 'Reisen für VIPs & Adelige organisieren', 'Überlebenstraining für Touristengruppen'],
    meister: ['Präsident des Reiseleiterverbands', 'Verfassen maßgeblicher Reiseführerwerke', 'Leitung staatlicher Tourismusprogramme', 'Ausbildung von Stadt- & Bergführern']
  },
  karawanenfuehrer: {
    lehrling: ['Kamele & Maultiere beladen', 'Wasserschläuche dicht halten', 'Zeltlager im Kreis aufbauen', 'Sandsturm-Schutzmaßnahmen ergreifen'],
    geselle: ['Navigation nach den Sternen in Wüsten & Steppen', 'Wasserstellen & Oasen treffsicher ansteuern', 'Verhandlungen über Durchzugsrechte mit Nomaden', 'Verteidigung der Karawane gegen Plünderer'],
    spezialisierung: ['Durchquerung tödlicher Salzwüsten & Eiswüsten', 'Karawanen mit hunderten Lasttieren leiten', 'Schmugglerrouten & geheime Bergpässe', 'Logistik für Riesenexpeditionen'],
    meister: ['Groß-Karawanenmeister', 'Beherrscher der transkontinentalen Handelswege', 'Verträge mit Wüstenemiren & Königen', 'Meisterausbildung für Wüstenführer']
  },
  kurtisane: {
    lehrling: ['Höfische Etikette & Körperhaltung', 'Kosmetik, Düfte & elegante Kleidung', 'Konversation über Kunst & Politik', 'Tanz- & Musikunterricht'],
    geselle: ['Gehobene Unterhaltung adliger Gesellschaften', 'Diplomatisches Taktgefühl & Vertraulichkeit', 'Verführungskunst & erotische Raffinesse', 'Sammeln wertvoller Gesellschaftsinformationen'],
    spezialisierung: ['Mätresse von Fürsten & Königen', 'Politischer Einfluss hinter den Kulissen', 'Leitung exklusiver literarischer Salons', 'Spionage & Erpressung im Auftrag von Mächten'],
    meister: ['Großmeisterin der Verführung & Hofdame', 'Unantastbare Stellung in der Hochgesellschaft', 'Vermögensverwaltung & Einfluss auf Kronen', 'Ausbildung junger Gesellschafterinnen']
  },
  maid: {
    lehrling: ['Zimmer lüften & Kissen aufschütteln', 'Krug & Waschschüssel bringen', 'Kamin anfeuern', 'Knicksen & höflich antworten'],
    geselle: ['Gästezimmer makellos herrichten', 'Wäsche bügeln & Garderobe pflegen', 'Servieren von Frühstück & Tee auf Zimmern', 'Diskretion bei privaten Vorkommnissen'],
    spezialisierung: ['Erste Zofe der Schlossherrin', 'Präparation fürstlicher Schlafgemächer', 'Geheime Botendienste im Schloss', 'Leitung der Zimmermädchen-Etage'],
    meister: ['Oberzofe / Chefgouvernante der Residenz', 'Aufsicht über das gesamte weibliche Hauspersonal', 'Verwaltung der königlichen Privatgemächer', 'Ausbildung junger Zofen']
  },
  leibeigener: {
    lehrling: ['Befehle widerspruchslos ausführen', 'Harte Fronarbeit auf dem Feld verrichten', 'Gutsbesitz nicht unbefugt verlassen', 'Einfachste Werkzeuge pflegen'],
    geselle: ['Ertragreiche Arbeit auf den Feldern des Grundherrn', 'Bauarbeiten an Burgen & Gutshöfen', 'Abgaben & Frondienste pünktlich leisten', 'Zusammenhalt der Dorfgemeinschaft stärken'],
    spezialisierung: ['Vorarbeiter der Guts-Fronkolonne', 'Spezialhandwerker im Fronverhältnis', 'Verwalter der dörflichen Allmende', 'Freikauf-Ersparnisse erwirtschaften'],
    meister: ['Dorfältester / Schultheiß der Gutsuntertanen', 'Vertretung der Dorfgemeinschaft beim Grundherrn', 'Erlangung des Freibriefs durch Verdienste', 'Bewahrung von Rechten & Brauchtum']
  }
};
