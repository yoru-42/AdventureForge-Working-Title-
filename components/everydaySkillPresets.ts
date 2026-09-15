export interface CentralEverydaySkill {
  id: string;
  name: string;
  category: string;
  description: string;
  aspects: string[]; // Unteraspekte / Anwendungsbereiche (keine eigenständigen Werte)
}

export interface EverydaySkillCategory {
  category: string;
  skills: string[];
}

/**
 * Die 74 zentralen Alltagskompetenzen von AdventureForge.
 * Jede Kompetenz ist einem übergeordneten Lebens- und Handlungsbereich zugeordnet
 * und besitzt konkrete Unteraspekte/Anwendungsbereiche, die jedoch keine
 * separaten Kompetenzwerte darstellen.
 */
export const CENTRAL_EVERYDAY_SKILLS: CentralEverydaySkill[] = [
  // ==========================================================================
  // A. ÜBERLEBEN, NATUR & ORIENTIERUNG
  // ==========================================================================
  {
    id: 'ueberleben',
    name: 'Überleben',
    category: 'Überleben, Natur & Orientierung',
    description: 'Grundlegendes Überleben in der Wildnis, Feuerbereitung, Schutz vor Witterung und Lagerbau.',
    aspects: [
      'Lagerfeuer',
      'Feuerholz',
      'Brennmaterial',
      'Unterschlupf',
      'Zelt/Lager errichten',
      'Grundlegende Überlebensmaßnahmen'
    ]
  },
  {
    id: 'orientierung_navigation',
    name: 'Orientierung & Navigation',
    category: 'Überleben, Natur & Orientierung',
    description: 'Zielsicheres Zurechtfinden im unwegsamen Gelände, Kartenlesen und Wegstreckenbestimmung.',
    aspects: [
      'Orientierung im Gelände',
      'Kartenlesen',
      'Navigation nach Sternen',
      'Wegstrecken einschätzen',
      'Einfache Navigation'
    ]
  },
  {
    id: 'naturkunde',
    name: 'Naturkunde',
    category: 'Überleben, Natur & Orientierung',
    description: 'Wissen über heimische Pflanzen, Wildtiere, Wetterveränderungen und natürliche Gefahren.',
    aspects: [
      'Pflanzen erkennen',
      'Tiere erkennen',
      'Tierspuren erkennen',
      'Wetterkunde',
      'Natürliche Gefahren erkennen'
    ]
  },
  {
    id: 'spurenlesen',
    name: 'Spurenlesen',
    category: 'Überleben, Natur & Orientierung',
    description: 'Erkennen, Unterscheiden, Altersbestimmung und Verfolgen von Wild- und Personenfährten.',
    aspects: [
      'Spuren erkennen',
      'Spuren unterscheiden',
      'Bewegungsrichtung erkennen',
      'Alter einer Spur einschätzen',
      'Einfache Fährten verfolgen'
    ]
  },
  {
    id: 'nahrung_beschaffen',
    name: 'Nahrung beschaffen',
    category: 'Überleben, Natur & Orientierung',
    description: 'Beschaffung von Nahrung in der freien Natur durch Fallen, Angeln und Pflanzensammeln.',
    aspects: [
      'Angeln & Fischen',
      'Fallen stellen',
      'Kräuter sammeln',
      'Nahrung in der Natur finden'
    ]
  },
  {
    id: 'wasserversorgung',
    name: 'Wasserversorgung',
    category: 'Überleben, Natur & Orientierung',
    description: 'Auffinden sicherer Wasserquellen, Auffangen, Abkochen, Filtrieren und Beurteilen von Trinkwasser.',
    aspects: [
      'Wasser finden',
      'Wasser sammeln',
      'Wasser beurteilen',
      'Wasser aufbereiten'
    ]
  },
  {
    id: 'schwimmen_gewaesser',
    name: 'Schwimmen & Gewässer',
    category: 'Überleben, Natur & Orientierung',
    description: 'Sicheres Bewegen in tiefem Wasser, Durchqueren von Furten und Beurteilen von Strömungen.',
    aspects: [
      'Schwimmen',
      'Flüsse überqueren',
      'Gewässer einschätzen'
    ]
  },

  // ==========================================================================
  // B. HAUSHALT & VERSORGUNG
  // ==========================================================================
  {
    id: 'kochen_backen',
    name: 'Kochen & Backen',
    category: 'Haushalt & Versorgung',
    description: 'Zubereitung nahrhafter Speisen, Suppen, Brote und Mahlzeiten für Einzelne und Gemeinschaften.',
    aspects: [
      'Lebensmittel vorbereiten',
      'Kochen',
      'Backen',
      'Einfache Gerichte',
      'Größere Mengen zubereiten',
      'Messerarbeit'
    ]
  },
  {
    id: 'lebensmittelverarbeitung',
    name: 'Lebensmittelverarbeitung',
    category: 'Haushalt & Versorgung',
    description: 'Vorbereitendes Putzen, Zerteilen, Entbeinen und Ausarbeiten von Fleisch, Fisch und Getreide.',
    aspects: [
      'Lebensmittel vorbereiten',
      'Fleisch verarbeiten',
      'Fisch verarbeiten',
      'Getreide verarbeiten',
      'Einfache Verarbeitungsschritte'
    ]
  },
  {
    id: 'lebensmittelkonservierung',
    name: 'Lebensmittelkonservierung',
    category: 'Haushalt & Versorgung',
    description: 'Verfahren zur Haltbarmachung von Lebensmitteln gegen Fäulnis, Schimmel und Schädlinge.',
    aspects: [
      'Trocknen',
      'Salzen',
      'Räuchern',
      'Einlegen',
      'Haltbarkeit beurteilen'
    ]
  },
  {
    id: 'vorratsverwaltung',
    name: 'Vorratsverwaltung',
    category: 'Haushalt & Versorgung',
    description: 'Erfassen von Beständen, Rationsplanung, sachgemäße Lagerung und Überwachung des Verbrauchs.',
    aspects: [
      'Vorräte zählen',
      'Lagerbestände überwachen',
      'Verbrauch einschätzen',
      'Lebensmittel lagern',
      'Vorräte planen'
    ]
  },
  {
    id: 'haushaltsfuehrung',
    name: 'Haushaltsführung',
    category: 'Haushalt & Versorgung',
    description: 'Strukturierte Haushaltsorganisation, tägliche Sauberkeit, Wäschewaschen und Schlaflagerausstattung.',
    aspects: [
      'Haushalt organisieren',
      'Reinigung',
      'Wäsche',
      'Körperpflege',
      'Lager/Bett herrichten'
    ]
  },
  {
    id: 'feuer_ofen_beleuchtung',
    name: 'Feuer, Ofen & Beleuchtung',
    category: 'Haushalt & Versorgung',
    description: 'Sichere Handhabung von Herden, Kachelöfen, Kaminen, Lampen, Talglichtern und Brennstoffen.',
    aspects: [
      'Feuerstellen bedienen',
      'Öfen bedienen',
      'Lampen bedienen',
      'Brennstoff verwalten'
    ]
  },
  {
    id: 'haushaltsreparaturen',
    name: 'Haushaltsreparaturen',
    category: 'Haushalt & Versorgung',
    description: 'Beheben alltäglicher Beschädigungen an Mobiliar, Türen, Riegeln und Haushaltsgegenständen.',
    aspects: [
      'Einfache Reparaturen',
      'Möbelpflege',
      'Kleine Schäden beheben',
      'Einfache Instandhaltung'
    ]
  },
  {
    id: 'bewirtung_gastgeberschaft',
    name: 'Bewirtung & Gastgeberschaft',
    category: 'Haushalt & Versorgung',
    description: 'Herzliche und aufmerksame Versorgung von Gästen, Eindecken von Tischen und Speisenausgabe.',
    aspects: [
      'Gäste versorgen',
      'Tisch vorbereiten',
      'Essen ausgeben',
      'Gastgeber sein'
    ]
  },

  // ==========================================================================
  // C. LANDWIRTSCHAFT & TIERHALTUNG
  // ==========================================================================
  {
    id: 'landwirtschaft',
    name: 'Landwirtschaft',
    category: 'Landwirtschaft & Tierhaltung',
    description: 'Bodenbearbeitung, Aussaat, Pflege von Beeten, Feldern und Obstbäumen sowie Erntearbeiten.',
    aspects: [
      'Ackerbau',
      'Gemüseanbau',
      'Obstbau',
      'Einfache Bodenarbeit',
      'Aussaat und Ernte'
    ]
  },
  {
    id: 'tierhaltung',
    name: 'Tierhaltung',
    category: 'Landwirtschaft & Tierhaltung',
    description: 'Versorgung von Nutztieren mit Futter, Wasser, Einstreu sowie Pflege und Ausmisten von Ställen.',
    aspects: [
      'Tiere füttern',
      'Tiere pflegen',
      'Viehhaltung',
      'Ställe versorgen'
    ]
  },
  {
    id: 'tierpflege_tierfuehrung',
    name: 'Tierpflege & Tierführung',
    category: 'Landwirtschaft & Tierhaltung',
    description: 'Beruhigen erregter Tiere, Halfter- und Strickführung sowie Deuten tierischen Verhaltens.',
    aspects: [
      'Tiere beruhigen',
      'Tiere führen',
      'Tiere versorgen',
      'Verhalten einfacher Nutztiere einschätzen'
    ]
  },
  {
    id: 'tierzucht',
    name: 'Tierzucht',
    category: 'Landwirtschaft & Tierhaltung',
    description: 'Auswahl kräftiger Elterntiere, Begleitung von Trächtigkeiten und Aufzucht gesunden Nachwuchses.',
    aspects: [
      'Zucht',
      'Auswahl geeigneter Tiere',
      'Nachwuchsversorgung'
    ]
  },
  {
    id: 'melken',
    name: 'Melken',
    category: 'Landwirtschaft & Tierhaltung',
    description: 'Zügiges und schonendes Handmelken von Kühen, Ziegen und Schafen unter Beachtung der Euterhygiene.',
    aspects: [
      'Melktechnik',
      'Euterhygiene',
      'Milcheimer reinigen',
      'Milchbehandlung'
    ]
  },
  {
    id: 'schlachten_zerlegen',
    name: 'Schlachten & Zerlegen',
    category: 'Landwirtschaft & Tierhaltung',
    description: 'Betäuben, fachgerechtes Schlachten, Ausbluten, Enthäuten und Grobzerlegen von Nutztieren.',
    aspects: [
      'Schlachten',
      'Ausnehmen',
      'Zerlegen',
      'Fleisch gewinnen'
    ]
  },
  {
    id: 'getreide_pflanzenverarbeitung',
    name: 'Getreide- & Pflanzenverarbeitung',
    category: 'Landwirtschaft & Tierhaltung',
    description: 'Dreschen, Worfeln, Schrotung und Aufbereitung von Erntefrüchten und Pflanzen zur Weiterverarbeitung.',
    aspects: [
      'Getreide verarbeiten',
      'Einfache Mahl- und Verarbeitungsschritte',
      'Pflanzen für Lebensmittel vorbereiten'
    ]
  },

  // ==========================================================================
  // D. REITEN, TIERE & TRANSPORT
  // ==========================================================================
  {
    id: 'reiten',
    name: 'Reiten',
    category: 'Reiten, Tiere & Transport',
    description: 'Sicheres Aufsitzen, Führen in Grundgangarten und ausbalanciertes Reiten auf Straßen und Wegen.',
    aspects: [
      'Aufsitzen',
      'Grundgangarten reiten',
      'Balance im Sattel',
      'Geländereiten',
      'Pferd lenken'
    ]
  },
  {
    id: 'pferdepflege_satteln',
    name: 'Pferdepflege & Satteln',
    category: 'Reiten, Tiere & Transport',
    description: 'Striegeln, Hufe auskratzen, Auflegen von Decke, Sattel und Zaumzeug sowie Nachsorge.',
    aspects: [
      'Pflege',
      'Satteln',
      'Zaumzeug',
      'Versorgung'
    ]
  },
  {
    id: 'tiere_fuehren',
    name: 'Tiere führen',
    category: 'Reiten, Tiere & Transport',
    description: 'Führen von Zug-, Last- und Einzeltieren an Halfter, Leine oder Führstrick bei Ortswechseln.',
    aspects: [
      'Tiere leiten',
      'Zugtiere anleiten',
      'Herde treiben',
      'Verhalten unterwegs'
    ]
  },
  {
    id: 'wagen_kutschen_fuehren',
    name: 'Wagen & Kutschen führen',
    category: 'Reiten, Tiere & Transport',
    description: 'Sicheres Lenken, Bremsen und Rangieren ein- und mehrspänniger Gespanne und Fuhrwerke.',
    aspects: [
      'Kutsche fahren',
      'Wagen fahren',
      'Einfache Fahrzeugkontrolle'
    ]
  },
  {
    id: 'lasttiere_transport',
    name: 'Lasttiere & Transport',
    category: 'Reiten, Tiere & Transport',
    description: 'Ausbalanciertes Bepacken von Saumtieren, Verzurren von Fracht und Vorbereitung von Transporten.',
    aspects: [
      'Lasttiere führen',
      'Gepäck verstauen',
      'Lasten verteilen',
      'Transport vorbereiten'
    ]
  },

  // ==========================================================================
  // E. HANDWERK, KLEIDUNG & WERKZEUGE
  // ==========================================================================
  {
    id: 'holzarbeiten',
    name: 'Holzarbeiten',
    category: 'Handwerk, Kleidung & Werkzeuge',
    description: 'Einfaches Sägen, Hobeln, Beilen und Anfertigen hölzerner Alltagsutensilien und Werkstückteile.',
    aspects: [
      'Holz bearbeiten',
      'Einfache Gegenstände herstellen',
      'Einfache Reparaturen'
    ]
  },
  {
    id: 'lederarbeiten',
    name: 'Lederarbeiten',
    category: 'Handwerk, Kleidung & Werkzeuge',
    description: 'Zuschneiden, Lochen, Nieten und Ausbessern von Lederriemen, Beuteln, Futteralen und Scheiden.',
    aspects: [
      'Leder bearbeiten',
      'Leder zuschneiden',
      'Leder flicken'
    ]
  },
  {
    id: 'textilverarbeitung',
    name: 'Textilverarbeitung',
    category: 'Handwerk, Kleidung & Werkzeuge',
    description: 'Garnspinnen mit der Handspindel, Vorbereitung von Wolle und Flachs sowie einfaches Weben.',
    aspects: [
      'Spinnen',
      'Weben',
      'Stoff bearbeiten'
    ]
  },
  {
    id: 'naehen_kleidung_herstellen',
    name: 'Nähen & Kleidung herstellen',
    category: 'Handwerk, Kleidung & Werkzeuge',
    description: 'Handnähte, Zuschnitt nach einfachen Mustern und Anfertigung elementarer Kleidungsstücke.',
    aspects: [
      'Nähen',
      'Kleidung herstellen',
      'Kleidung anpassen'
    ]
  },
  {
    id: 'kleidung_reparieren_pflegen',
    name: 'Kleidung reparieren & pflegen',
    category: 'Handwerk, Kleidung & Werkzeuge',
    description: 'Stopfen von Löchern, Aufsetzen von Flicken, Säubern und Imprägnieren abgetragener Gewänder.',
    aspects: [
      'Flicken',
      'Waschen',
      'Pflege',
      'Ausbessern'
    ]
  },
  {
    id: 'faerben',
    name: 'Färben',
    category: 'Handwerk, Kleidung & Werkzeuge',
    description: 'Ansetzen von Färbesuden aus Wurzeln, Rinden und Pflanzen sowie Fixieren von Farbtönen.',
    aspects: [
      'Färbeflotten ansetzen',
      'Naturfarben gewinnen',
      'Beizen',
      'Stoffe färben'
    ]
  },
  {
    id: 'seil_knotenkunde',
    name: 'Seil- & Knotenkunde',
    category: 'Handwerk, Kleidung & Werkzeuge',
    description: 'Schlagen sicherer Knoten, Bünde, Steke, Spleißen und zweckmäßige Befestigungen unter Zug.',
    aspects: [
      'Knoten',
      'Seile herstellen/verwenden',
      'Befestigungen'
    ]
  },
  {
    id: 'werkzeughandhabung_pflege',
    name: 'Werkzeughandhabung & Werkzeugpflege',
    category: 'Handwerk, Kleidung & Werkzeuge',
    description: 'Sachgerechter Einsatz gängiger Werkzeuge, Schutz vor Rost, Ölen und einfache Einstellarbeiten.',
    aspects: [
      'Werkzeuge richtig verwenden',
      'Werkzeuge reinigen',
      'Werkzeuge warten',
      'Werkzeuginstandhaltung'
    ]
  },
  {
    id: 'schaerfen',
    name: 'Schärfen',
    category: 'Handwerk, Kleidung & Werkzeuge',
    description: 'Abziehen von Messerklingen, Beilen, Meißeln und Scheren an Wetzstein und Lederriemen.',
    aspects: [
      'Messer schärfen',
      'Werkzeuge schärfen',
      'Schneiden beurteilen'
    ]
  },

  // ==========================================================================
  // F. KÖRPERLICHE FÄHIGKEITEN
  // ==========================================================================
  {
    id: 'koerperliche_faehigkeiten',
    name: 'Körperliche Fähigkeiten',
    category: 'Körperliche Fähigkeiten',
    description: 'Alltägliche physische Gesamtverfassung: Hebekraft, Lastentragen, Klettern, Gewandtheit und Ausdauer.',
    aspects: [
      'Kraft im Alltag',
      'Tragen',
      'Lasten bewegen',
      'Klettern',
      'Balance',
      'Körperkoordination',
      'Hand-Auge-Koordination',
      'Ausdauer',
      'Geschicklichkeit'
    ]
  },

  // ==========================================================================
  // G. WAHRNEHMUNG & GEISTIGE ALLTAGSFÄHIGKEITEN
  // ==========================================================================
  {
    id: 'wahrnehmung',
    name: 'Wahrnehmung',
    category: 'Wahrnehmung & geistige Alltagsfähigkeiten',
    description: 'Wachsame Aufmerksamkeit, Erkennen unauffälliger Details, Geräusche und Lageveränderungen.',
    aspects: [
      'Aufmerksamkeit',
      'Beobachtung',
      'Details erkennen',
      'Veränderungen bemerken',
      'Umgebung wahrnehmen'
    ]
  },
  {
    id: 'konzentration',
    name: 'Konzentration',
    category: 'Wahrnehmung & geistige Alltagsfähigkeiten',
    description: 'Ausdauernde geistige Fokussierung auf schwierige, langwierige oder monotone Tätigkeiten.',
    aspects: [
      'Fokussiertes Arbeiten',
      'Längere Aufmerksamkeit',
      'Ablenkungen widerstehen'
    ]
  },
  {
    id: 'gedaechtnis',
    name: 'Gedächtnis',
    category: 'Wahrnehmung & geistige Alltagsfähigkeiten',
    description: 'Zuverlässiges Merken und Abrufen von Personen, Wegen, Zahlen, Absprachen und Reihenfolgen.',
    aspects: [
      'Personen merken',
      'Orte merken',
      'Informationen behalten',
      'Abläufe erinnern'
    ]
  },
  {
    id: 'problemloesung',
    name: 'Problemlösung',
    category: 'Wahrnehmung & geistige Alltagsfähigkeiten',
    description: 'Analysieren praktischer Hindernisse, logisches Schließen und Entwickeln machbarer Lösungswege.',
    aspects: [
      'Probleme analysieren',
      'Lösungen finden',
      'Zusammenhänge erkennen',
      'Logisches Vorgehen'
    ]
  },
  {
    id: 'improvisation',
    name: 'Improvisation',
    category: 'Wahrnehmung & geistige Alltagsfähigkeiten',
    description: 'Spontanes Lösen unvorhergesehener Probleme mit behelfsmäßigen oder zweckentfremdeten Mitteln.',
    aspects: [
      'Mit vorhandenen Mitteln Lösungen finden',
      'Spontane Anpassung',
      'Ungeplante Situationen bewältigen'
    ]
  },
  {
    id: 'menschenkenntnis',
    name: 'Menschenkenntnis',
    category: 'Wahrnehmung & geistige Alltagsfähigkeiten',
    description: 'Einschätzen von Motiven, Stimmungen, Wahrhaftigkeit und Verhaltensweisen des Gegenübers.',
    aspects: [
      'Verhalten einschätzen',
      'Absichten erkennen',
      'Stimmung wahrnehmen',
      'Personen einschätzen'
    ]
  },

  // ==========================================================================
  // H. SOZIALES & KOMMUNIKATION
  // ==========================================================================
  {
    id: 'kommunikation',
    name: 'Kommunikation',
    category: 'Soziales & Kommunikation',
    description: 'Verständliche Gesprächsführung, aktives Zuhören und präzise mündliche Informationsweitergabe.',
    aspects: [
      'Gesprächsführung',
      'Zuhören',
      'Informationen vermitteln',
      'Nachrichten übermitteln'
    ]
  },
  {
    id: 'sozialkompetenz',
    name: 'Sozialkompetenz',
    category: 'Soziales & Kommunikation',
    description: 'Rücksichtsvoller Umgang mit Mitmenschen, Schlichtung kleiner Konflikte und Einfühlung in Gruppen.',
    aspects: [
      'Zusammenarbeit',
      'Rücksichtnahme',
      'Konflikte im Alltag',
      'Soziale Situationen verstehen'
    ]
  },
  {
    id: 'etikette_verhalten',
    name: 'Etikette & gesellschaftliches Verhalten',
    category: 'Soziales & Kommunikation',
    description: 'Umgangsformen, Höflichkeitsrituale und standesgemäße Verhaltensregeln in Gesellschaft.',
    aspects: [
      'Höflichkeit',
      'Etikette',
      'Gesellschaftliche Regeln',
      'Umgangsformen'
    ]
  },
  {
    id: 'ueberzeugen_verhandeln',
    name: 'Überzeugen & Verhandeln',
    category: 'Soziales & Kommunikation',
    description: 'Sinnvolles Argumentieren, Preisverhandlungen, Feilschen und Finden von Übereinkünften.',
    aspects: [
      'Feilschen',
      'Verhandeln',
      'Argumentieren',
      'Andere überzeugen'
    ]
  },
  {
    id: 'unterhaltung_darbietung',
    name: 'Unterhaltung & Darbietung',
    category: 'Soziales & Kommunikation',
    description: 'Lebendiges Geschichtenerzählen, Vorlesen, geselliges Musizieren, Singen und Tanzen.',
    aspects: [
      'Geschichten erzählen',
      'Vorlesen',
      'Schauspiel',
      'Geselliges Singen',
      'Geselliges Musizieren',
      'Tanzen'
    ]
  },
  {
    id: 'gluecksspiel',
    name: 'Glücksspiel',
    category: 'Soziales & Kommunikation',
    description: 'Regelkenntnis traditioneller Würfel- und Kartenspiele sowie Abschätzen von Gewinnchancen.',
    aspects: [
      'Karten spielen',
      'Würfelspiele',
      'Einfache Wahrscheinlichkeits-/Risikoabschätzung'
    ]
  },
  {
    id: 'trinkfestigkeit',
    name: 'Trinkfestigkeit',
    category: 'Soziales & Kommunikation',
    description: 'Widerstandskraft gegen Alkoholisierung, Wahren der Selbstkontrolle bei Gelagen.',
    aspects: [
      'Alkohol vertragen',
      'Zurechnungsfähigkeit bewahren',
      'Nachwirkungen überwinden'
    ]
  },

  // ==========================================================================
  // I. FÜHRUNG, ORGANISATION & ZUSAMMENARBEIT
  // ==========================================================================
  {
    id: 'fuehrung',
    name: 'Führung',
    category: 'Führung, Organisation & Zusammenarbeit',
    description: 'Anleiten von Personen, Treffen klarer Entscheidungen und Vorangehen mit persönlicher Autorität.',
    aspects: [
      'Menschen anleiten',
      'Verantwortung übernehmen',
      'Entscheidungen treffen',
      'Autorität ausüben',
      'Gruppen führen'
    ]
  },
  {
    id: 'teamfaehigkeit',
    name: 'Teamfähigkeit',
    category: 'Führung, Organisation & Zusammenarbeit',
    description: 'Kooperative Zusammenarbeit, Einordnen in Rollen und gegenseitige Hilfestellung im Team.',
    aspects: [
      'Zusammenarbeit',
      'Rollen verstehen',
      'Andere unterstützen',
      'Gemeinsame Ziele verfolgen'
    ]
  },
  {
    id: 'koordination',
    name: 'Koordination',
    category: 'Führung, Organisation & Zusammenarbeit',
    description: 'Abstimmung verschiedener Arbeitskräfte und synchrones Ineinandergreifen von Teilaufgaben.',
    aspects: [
      'Personen koordinieren',
      'Aufgaben abstimmen',
      'Abläufe synchronisieren'
    ]
  },
  {
    id: 'organisation',
    name: 'Organisation',
    category: 'Führung, Organisation & Zusammenarbeit',
    description: 'Gliedern von Arbeitsschritten, Bereitstellen von Werkstoffen und Schaffen geordneter Abläufe.',
    aspects: [
      'Aufgaben organisieren',
      'Ressourcen organisieren',
      'Arbeitsabläufe strukturieren'
    ]
  },
  {
    id: 'planung',
    name: 'Planung',
    category: 'Führung, Organisation & Zusammenarbeit',
    description: 'Vorausschauendes Setzen von Fristen und Meilensteinen sowie Kalkulation benötigter Mittel.',
    aspects: [
      'Vorausplanen',
      'Prioritäten setzen',
      'Ressourcen einteilen',
      'Abläufe vorbereiten'
    ]
  },
  {
    id: 'delegieren',
    name: 'Delegieren',
    category: 'Führung, Organisation & Zusammenarbeit',
    description: 'Zweckmäßige Verteilung von Pflichten und Verantwortung an fähige Mitarbeiter.',
    aspects: [
      'Aufgaben verteilen',
      'Verantwortlichkeiten übertragen',
      'Geeignete Personen einsetzen'
    ]
  },
  {
    id: 'motivation',
    name: 'Motivation',
    category: 'Führung, Organisation & Zusammenarbeit',
    description: 'Aufmuntern von Gefährten, Stärkung der Moral und Ermutigung in anstrengenden Situationen.',
    aspects: [
      'Andere motivieren',
      'Moral stärken',
      'Menschen unterstützen',
      'Leistungsbereitschaft fördern'
    ]
  },

  // ==========================================================================
  // J. TAKTIK & SITUATIONSBEWERTUNG
  // ==========================================================================
  {
    id: 'taktik',
    name: 'Taktik',
    category: 'Taktik & Situationsbewertung',
    description: 'Zweckmäßige Ausnutzung von Deckung, Gelände, Formationshalt und Timing in Gefahrenmomenten.',
    aspects: [
      'Taktische Entscheidungen',
      'Positionierung',
      'Formation',
      'Gruppenkampf',
      'Gelände nutzen',
      'Gegner einschätzen',
      'Risiko abschätzen',
      'Auf Veränderungen reagieren'
    ]
  },
  {
    id: 'situationsanalyse',
    name: 'Situationsanalyse',
    category: 'Taktik & Situationsbewertung',
    description: 'Schnelles, nüchternes Erfassen einer Gesamtlage und Feststellen verbleibender Handlungsoptionen.',
    aspects: [
      'Situation erfassen',
      'Gefahren erkennen',
      'Optionen erkennen',
      'Veränderungen bewerten'
    ]
  },
  {
    id: 'gefahreneinschaetzung',
    name: 'Gefahreneinschätzung',
    category: 'Taktik & Situationsbewertung',
    description: 'Rechtzeitiges Erkennen drohender Risiken, Hinterhalte, Geländefallen und Gefahrenquellen.',
    aspects: [
      'Risiken erkennen',
      'Gefahrenquellen erkennen',
      'Gefahrensituationen bewerten'
    ]
  },

  // ==========================================================================
  // K. SCHRIFT, HANDEL & VERWALTUNG
  // ==========================================================================
  {
    id: 'lesen_schreiben',
    name: 'Lesen & Schreiben',
    category: 'Schrift, Handel & Verwaltung',
    description: 'Lesen von Handschriften und Drucken, Verfassen von Notizen, Briefen und Urkunden mit Tinte.',
    aspects: [
      'Schriftzeichen erkennen',
      'Texte lesen',
      'Mitteilungen verfassen',
      'Dokumente verstehen'
    ]
  },
  {
    id: 'rechnen',
    name: 'Rechnen',
    category: 'Schrift, Handel & Verwaltung',
    description: 'Sichere Ausführung der Grundrechenarten, Zählen, Runden und Errechnen von Summen.',
    aspects: [
      'Zählen',
      'Grundrechenarten',
      'Mengen vergleichen',
      'Einfache Berechnungen'
    ]
  },
  {
    id: 'buchfuehrung',
    name: 'Buchführung',
    category: 'Schrift, Handel & Verwaltung',
    description: 'Übersichtliche Aufzeichnung von Geldeinnahmen, Ausgaben, offenen Schulden und Salden.',
    aspects: [
      'Einnahmen/Ausgaben',
      'Bestände',
      'Einfache Konten'
    ]
  },
  {
    id: 'warenkunde',
    name: 'Warenkunde',
    category: 'Schrift, Handel & Verwaltung',
    description: 'Beurteilen von Stoff-, Leder-, Metall- und Gewürzqualitäten sowie Erkennen von Fälschungen.',
    aspects: [
      'Waren erkennen',
      'Qualität einschätzen',
      'Materialien unterscheiden'
    ]
  },
  {
    id: 'preis_wertschaetzung',
    name: 'Preis- & Wertschätzung',
    category: 'Schrift, Handel & Verwaltung',
    description: 'Realistisches Einschätzen marktüblicher Preise, Wiederverkaufswerte und Zustand von Waren.',
    aspects: [
      'Preise einschätzen',
      'Wert vergleichen',
      'Angebote beurteilen'
    ]
  },
  {
    id: 'masse_gewichte',
    name: 'Maße & Gewichte',
    category: 'Schrift, Handel & Verwaltung',
    description: 'Sicherer Umgang mit Balkenwaagen, Hohlmaßen, Ellen, Pfund und regionalen Umrechnungen.',
    aspects: [
      'Längen schätzen',
      'Gewichte wiegen',
      'Hohlmaße messen',
      'Maßeinheiten umrechnen'
    ]
  },
  {
    id: 'handel',
    name: 'Handel',
    category: 'Schrift, Handel & Verwaltung',
    description: 'Praktischer Tausch- und Geldhandel, Warentausch auf Märkten und Einschätzen von Geschäftspartnern.',
    aspects: [
      'Warenhandel',
      'Kaufen/Verkaufen',
      'Handelspartner einschätzen'
    ]
  },
  {
    id: 'verwaltung',
    name: 'Verwaltung',
    category: 'Schrift, Handel & Verwaltung',
    description: 'Ordnen behördlicher Unterlagen, Führen von Registern, Quittungen und Verzeichnissen.',
    aspects: [
      'Einfache Dokumentation',
      'Abläufe verwalten',
      'Listen führen',
      'Organisatorische Aufgaben'
    ]
  },
  {
    id: 'fremdsprachen',
    name: 'Fremdsprachen',
    category: 'Schrift, Handel & Verwaltung',
    description: 'Elementare Verständigung in fremden Zungen, Aufschnappen und Deuten wichtiger Redewendungen.',
    aspects: [
      'Grundkenntnisse',
      'Einfache Verständigung',
      'Begriffe verstehen'
    ]
  },

  // ==========================================================================
  // L. GESUNDHEIT & VERSORGUNG
  // ==========================================================================
  {
    id: 'erste_hilfe',
    name: 'Erste Hilfe',
    category: 'Gesundheit & Versorgung',
    description: 'Rasche Erstversorgung von Schnitten, Verbrennungen, Schienen gebrochener Gliedmaßen und Druckverbände.',
    aspects: [
      'Wunden versorgen',
      'Verbände',
      'Blutungen',
      'Einfache Notfallversorgung'
    ]
  },
  {
    id: 'kranken_verletztenpflege',
    name: 'Kranken- & Verletztenpflege',
    category: 'Gesundheit & Versorgung',
    description: 'Fürsorgliche Pflege Bettlägeriger, Fiebersenkung, Verbandswechsel und Erholungserleichterung.',
    aspects: [
      'Kranke versorgen',
      'Verletzte versorgen',
      'Betreuung',
      'Pflege'
    ]
  },
  {
    id: 'krankheiten_verletzungen_erkennen',
    name: 'Krankheiten & Verletzungen erkennen',
    category: 'Gesundheit & Versorgung',
    description: 'Erkennen typischer Krankheitsanzeichen, Infektionen, Wundbrand und Beurteilung der Schwere.',
    aspects: [
      'Symptome erkennen',
      'Verletzungen einschätzen',
      'Verschlechterung bemerken'
    ]
  },
  {
    id: 'hausmittel_kraeuterkunde',
    name: 'Hausmittel & Kräuterkunde',
    category: 'Gesundheit & Versorgung',
    description: 'Zubereitung bewährter Kräutertees, Umschläge, Salben und heilsamer Hausmittel.',
    aspects: [
      'Kräutertees',
      'Einfache Hausmittel',
      'Bekannte Heilpflanzen'
    ]
  },
  {
    id: 'hygiene',
    name: 'Hygiene',
    category: 'Gesundheit & Versorgung',
    description: 'Körperpflege, Sauberkeit bei der Speisenzubereitung, Desinfektion und Reinhaltung der Umgebung.',
    aspects: [
      'Persönliche Hygiene',
      'Lebensmittelhygiene',
      'Umgebungshygiene',
      'Hygienisches Arbeiten'
    ]
  }
];

/**
 * Mapping historischer / kleinteiliger Kompetenznamen auf die neuen zentralen Kompetenzen.
 * Verhindert Datenverlust bei älteren Charakterbögen.
 */
export const LEGACY_SKILL_MAPPING: Record<string, string> = {
  // Überleben
  'Lagerfeuer machen': 'Überleben',
  'Feuerholz sammeln': 'Überleben',
  'Brennmaterial beurteilen': 'Überleben',
  'Unterschlupf bauen': 'Überleben',
  'Zelt aufbauen': 'Überleben',

  // Orientierung & Navigation
  'Kartenlesen': 'Orientierung & Navigation',
  'Navigation nach Sternen': 'Orientierung & Navigation',
  'Wegstrecken einschätzen': 'Orientierung & Navigation',
  'Orientierung im Gelände': 'Orientierung & Navigation',

  // Naturkunde
  'Pflanzen erkennen': 'Naturkunde',
  'Tiere erkennen': 'Naturkunde',
  'Tierspuren erkennen': 'Naturkunde',
  'Wetterkunde': 'Naturkunde',

  // Nahrung beschaffen & Wasser
  'Kräutersammeln': 'Nahrung beschaffen',
  'Fallen stellen': 'Nahrung beschaffen',
  'Angeln & Fischen': 'Nahrung beschaffen',
  'Wasser finden & sammeln': 'Wasserversorgung',
  'Wasser aufbereiten': 'Wasserversorgung',
  'Wasser holen': 'Wasserversorgung',

  // Schwimmen & Gewässer
  'Schwimmen': 'Schwimmen & Gewässer',
  'Flussüberquerung': 'Schwimmen & Gewässer',

  // Haushalt & Versorgung
  'Proviant haltbar machen': 'Lebensmittelkonservierung',
  'Lebensmittel auf Verderb prüfen': 'Lebensmittelkonservierung',
  'Feuerstelle & Ofen bedienen': 'Feuer, Ofen & Beleuchtung',
  'Beleuchtung & Lampen': 'Feuer, Ofen & Beleuchtung',
  'Abwaschen': 'Haushaltsführung',
  'Reinigung & Wäsche': 'Haushaltsführung',
  'Körperpflege & Hygiene': 'Hygiene',
  'Bett & Lager herrichten': 'Haushaltsführung',
  'Haushalt organisieren': 'Haushaltsführung',
  'Einfache Haushaltsreparaturen': 'Haushaltsreparaturen',
  'Möbelpflege': 'Haushaltsreparaturen',
  'Tischkultur & Bewirtung': 'Bewirtung & Gastgeberschaft',
  'Gastgeber sein': 'Bewirtung & Gastgeberschaft',

  // Landwirtschaft & Tiere
  'Tierfütterung': 'Tierhaltung',
  'Tierpflege': 'Tierpflege & Tierführung',
  'Viehhaltung': 'Tierhaltung',
  'Tiere beruhigen & führen': 'Tierpflege & Tierführung',
  'Fischverarbeitung': 'Lebensmittelverarbeitung',
  'Getreideverarbeitung': 'Getreide- & Pflanzenverarbeitung',
  'Ackerbau': 'Landwirtschaft',
  'Gemüseanbau': 'Landwirtschaft',
  'Obstbau': 'Landwirtschaft',

  // Transport
  'Kutsche & Wagen fahren': 'Wagen & Kutschen führen',
  'Gepäck & Lasten verstauen': 'Lasttiere & Transport',

  // Handwerk & Kleidung
  'Einfache Holzarbeiten': 'Holzarbeiten',
  'Lederflicken': 'Lederarbeiten',
  'Nähen': 'Nähen & Kleidung herstellen',
  'Kleidung flicken': 'Kleidung reparieren & pflegen',
  'Schuhe reparieren': 'Kleidung reparieren & pflegen',
  'Kleidung pflegen': 'Kleidung reparieren & pflegen',
  'Seilknüpfen & Knotenkunde': 'Seil- & Knotenkunde',
  'Werkzeugpflege': 'Werkzeughandhabung & Werkzeugpflege',
  'Werkzeuginstandhaltung': 'Werkzeughandhabung & Werkzeugpflege',
  'Messer & Werkzeuge schärfen': 'Schärfen',

  // Physisch
  'Tragen & Lasten bewegen': 'Körperliche Fähigkeiten',
  'Klettern': 'Körperliche Fähigkeiten',
  'Balance': 'Körperliche Fähigkeiten',
  'Körperkoordination': 'Körperliche Fähigkeiten',
  'Hand-Auge-Koordination': 'Körperliche Fähigkeiten',
  'Ausdauer': 'Körperliche Fähigkeiten',
  'Geschicklichkeit': 'Körperliche Fähigkeiten',
  'Kraft im Alltag': 'Körperliche Fähigkeiten',

  // Soziales & Geist
  'Gesprächsführung': 'Kommunikation',
  'Nachrichten übermitteln': 'Kommunikation',
  'Briefeschreiben': 'Kommunikation',
  'Höflichkeit & Etikette': 'Etikette & gesellschaftliches Verhalten',
  'Lokale Bräuche kennen': 'Etikette & gesellschaftliches Verhalten',
  'Feiern organisieren': 'Organisation',
  'Geschichten erzählen': 'Unterhaltung & Darbietung',
  'Vorlesen': 'Unterhaltung & Darbietung',
  'Geselliges Musizieren & Singen': 'Unterhaltung & Darbietung',
  'Schauspielkunst': 'Unterhaltung & Darbietung',
  'Tanzen': 'Unterhaltung & Darbietung',
  'Gerüchte erkennen': 'Menschenkenntnis',
  'Feilschen & Verhandeln': 'Überzeugen & Verhandeln',
  'Kartenspielen & Würfeln': 'Glücksspiel',

  // Schrift & Wissen
  'Grundrechnen & Zählen': 'Rechnen',
  'Warenkunde': 'Warenkunde',
  'Handelswaren erkennen': 'Warenkunde',
  'Preise einschätzen': 'Preis- & Wertschätzung',
  'Fremdsprachen-Grundkenntnisse': 'Fremdsprachen',
  'Einfache Verwaltung': 'Verwaltung',

  // Gesundheit
  'Erste Hilfe & Wundverband': 'Erste Hilfe',
  'Hausmittel & Kräutertees': 'Hausmittel & Kräuterkunde',
  'Pflege von Kranken': 'Kranken- & Verletztenpflege',
  'Pflege von Verletzten': 'Kranken- & Verletztenpflege',
  'Hygiene im Umgang mit Lebensmitteln': 'Hygiene'
};

/**
 * Wandelt einen (möglicherweise historischen) Fertigkeitsnamen in die zentrale Alltagskompetenz um.
 */
export function mapLegacySkillToCentralSkill(rawName: string): string {
  const trimmed = rawName.trim();
  if (LEGACY_SKILL_MAPPING[trimmed]) {
    return LEGACY_SKILL_MAPPING[trimmed];
  }
  const match = CENTRAL_EVERYDAY_SKILLS.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
  if (match) return match.name;
  return trimmed;
}

/**
 * Findet die Metadaten einer zentralen Alltagskompetenz.
 */
export function getCentralSkill(nameOrLegacy: string): CentralEverydaySkill | undefined {
  const normalized = mapLegacySkillToCentralSkill(nameOrLegacy);
  return CENTRAL_EVERYDAY_SKILLS.find(s => s.name.toLowerCase() === normalized.toLowerCase());
}

/**
 * Gibt die Unteraspekte / Anwendungsbereiche einer Kompetenz zurück.
 */
export function getSkillAspects(nameOrLegacy: string): string[] {
  const skill = getCentralSkill(nameOrLegacy);
  return skill ? skill.aspects : [];
}

/**
 * Gibt die Beschreibung einer Alltagskompetenz zurück.
 */
export function getSkillDescription(nameOrLegacy: string): string {
  const skill = getCentralSkill(nameOrLegacy);
  return skill ? skill.description : '';
}

/**
 * Gruppierung der 74 zentralen Alltagskompetenzen nach Kategorien
 * für die bestehende UI-Navigation und Filterung.
 */
export const EVERYDAY_SKILL_CATEGORIES: EverydaySkillCategory[] = (() => {
  const categoryOrder: string[] = [
    'Überleben, Natur & Orientierung',
    'Haushalt & Versorgung',
    'Landwirtschaft & Tierhaltung',
    'Reiten, Tiere & Transport',
    'Handwerk, Kleidung & Werkzeuge',
    'Körperliche Fähigkeiten',
    'Wahrnehmung & geistige Alltagsfähigkeiten',
    'Soziales & Kommunikation',
    'Führung, Organisation & Zusammenarbeit',
    'Taktik & Situationsbewertung',
    'Schrift, Handel & Verwaltung',
    'Gesundheit & Versorgung'
  ];

  return categoryOrder.map(catName => ({
    category: catName,
    skills: CENTRAL_EVERYDAY_SKILLS.filter(s => s.category === catName).map(s => s.name)
  }));
})();

/**
 * Flache Liste aller 74 zentralen Kompetenznamen.
 */
export const ALL_EVERYDAY_SKILLS: string[] =
  CENTRAL_EVERYDAY_SKILLS.map(s => s.name);
