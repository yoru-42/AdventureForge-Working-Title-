// -*- coding: utf-8 -*-
/**
 * Datendefinitionen und Schemata für alle Gegenstandskategorien, Subkategorien,
 * Standardwerte, Mengeneinheiten, Produktionsbeziehungen und Wirtschafts-Schnittstellen.
 */

export type ItemMainCategory =
  | 'Rohstoffe'
  | 'Materialien & Zwischenprodukte'
  | 'Baustoffe & Konstruktion'
  | 'Produkte'
  | 'Alltags- & Haushaltsgegenstände'
  | 'Nahrung'
  | 'Kleidung & Textilien'
  | 'Waffen'
  | 'Rüstung & Schutzausrüstung'
  | 'Werkzeuge'
  | 'Landwirtschaft'
  | 'Tiere'
  | 'Transportmittel'
  | 'Militärbedarf'
  | 'Medizin'
  | 'Medizin & Alchemie'
  | 'Handelswaren'
  | 'Magische Gegenstände'
  | 'Quest-/Story-Gegenstände'
  | 'Monster-Beute & Drops'
  | 'Dungeon-Vorkommen & Funde'
  | 'Loot-Quellen & Trophäen'
  | 'Bücher & Schriften'
  | 'Schmuck & Kostbarkeiten'
  | 'Gifte & Fallen'
  | 'Ritual- & Kultbedarf'
  | 'Bergbau & Erze'
  | 'Saatgut & Pflanzen'
  | 'Nautik & Seefahrt'
  | 'Kunst & Antiquitäten'
  | 'Tränke & Elixiere';

export interface ItemCategoryMeta {
  id: ItemMainCategory;
  label: string;
  description: string;
  hasSubcategories: boolean;
  subcategories: string[];
  defaultUnit: string;
  defaultPrice: number;
  economyCategory: 'raw_material' | 'goods' | 'food_drink' | 'equipment' | 'inventory' | 'animals' | 'vehicles' | 'special';
}

export const ITEM_MAIN_CATEGORIES: ItemCategoryMeta[] = [
  {
    id: 'Rohstoffe',
    label: 'Rohstoffe',
    description: 'Natürliche Grundstoffe aus Bergbau, Forstwirtschaft, Steinbrüchen, Natur oder Jagd.',
    hasSubcategories: true,
    subcategories: [
      'Metallerze',
      'Minerale & Kristalle',
      'Edelmetalle & Edelsteine',
      'Steine, Erden & Ton',
      'Bau- & Nutzholz',
      'Kochzutaten & Gewürze',
      'Getreide & Feldfrüchte',
      'Kräuter & Alchemie',
      'Fasern & Textil-Rohstoffe',
      'Tierische Rohstoffe & Jagd',
      'Harze, Pech & Naturstoffe'
    ],
    defaultUnit: 'kg',
    defaultPrice: 5,
    economyCategory: 'raw_material'
  },
  {
    id: 'Materialien & Zwischenprodukte',
    label: 'Materialien & Zwischenprodukte',
    description: 'Vorgefertigte Halbzeuge und veredelte Werkstoffe zur Weiterverarbeitung im Handwerk.',
    hasSubcategories: true,
    subcategories: [
      'Barren & Metallhalbzeuge',
      'Bretter & Bauholz',
      'Stoffe, Garne & Seile',
      'Leder, Pergament & Felle',
      'Platten, Nägel & Beschläge',
      'Glas, Keramik & Ton',
      'Papier, Tinte & Schreibstoffe',
      'Legierungen & Veredelte Metalle',
      'Verarbeitete Materialien'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 15,
    economyCategory: 'raw_material'
  },
  {
    id: 'Baustoffe & Konstruktion',
    label: 'Baustoffe & Konstruktion',
    description: 'Ziegel, Mörtel, Werksteine, Bauholz, Dachschindeln, Beschläge und Fundamente für Bauwirtschaft und Holding-Erweiterungen.',
    hasSubcategories: true,
    subcategories: [
      'Ziegel & Mauersteine',
      'Mörtel, Kalk & Bindemittel',
      'Werksteine & Steinquader',
      'Bauholz, Balken & Dachlatten',
      'Dachziegel & Schieferplatten',
      'Beschläge, Nägel & Bauanker',
      'Pflastersteine & Fundamentsteine',
      'Befestigungselemente & Pfähle'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 18,
    economyCategory: 'raw_material'
  },
  {
    id: 'Produkte',
    label: 'Produkte',
    description: 'Fertige Gebrauchs- und Handwerksgüter für Werkstatt, Gewerbe oder spezialisierten Handel.',
    hasSubcategories: true,
    subcategories: [
      'Handwerksprodukte',
      'Fertigwaren',
      'Gebrauchswaren',
      'Manufakturwaren'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 25,
    economyCategory: 'goods'
  },
  {
    id: 'Alltags- & Haushaltsgegenstände',
    label: 'Alltags- & Haushaltsgegenstände',
    description: 'Geschirr, Kochutensilien, Möbel, Beleuchtung, Seifen, Schreibmaterial und alltägliche Gebrauchsartikel.',
    hasSubcategories: true,
    subcategories: [
      'Geschirr & Kochgeschirr',
      'Beleuchtung (Lampen, Kerzen, Laternen)',
      'Möbel & Einrichtungsgegenstände',
      'Haushaltsgeräte & Reinigungsutensilien (Eimer, Besen)',
      'Hygiene, Seifen & Waschmittel',
      'Schreib- & Dokumentenbedarf',
      'Behälter, Truhen & Gefäße',
      'Bettzeug & Textile Haushaltswaren'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 8,
    economyCategory: 'goods'
  },
  {
    id: 'Nahrung',
    label: 'Nahrung',
    description: 'Lebensmittel, Rationen, Feldverpflegung, Frischwaren und Getränke.',
    hasSubcategories: true,
    subcategories: [
      'Frischwaren & Feldfrüchte',
      'Mehl & Mahlerzeugnisse',
      'Brot & Backwaren',
      'Fleisch- & Wurstwaren',
      'Fisch & Meeresfrüchte',
      'Milch- & Käseprodukte',
      'Konserven & Dauerproviant',
      'Getränke, Bier & Wein',
      'Gewürze & Delikatessen'
    ],
    defaultUnit: 'Portionen',
    defaultPrice: 2,
    economyCategory: 'food_drink'
  },
  {
    id: 'Kleidung & Textilien',
    label: 'Kleidung & Textilien',
    description: 'Alltagskleidung, Arbeitskluft, Schutzmäntel, Festgewänder, Schuhe und Stoffe.',
    hasSubcategories: true,
    subcategories: [
      'Berufs-Outfits & Zunft-Sets',
      'Outfits & Komplette Sets',
      'Arbeits- & Schutzkleidung',
      'Alltagskleidung',
      'Mäntel & Wetterkleidung',
      'Schuhe & Stiefel',
      'Kopfbedeckungen',
      'Fest- & Zeremoniengewänder',
      'Militäruniformen & Truppenkleidung'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 12,
    economyCategory: 'equipment'
  },
  {
    id: 'Waffen',
    label: 'Waffen',
    description: 'Klingen, Wuchtwaffen, Stangenwaffen, Bögen, Armbrüste, Belagerungswaffen und Kampfgerät.',
    hasSubcategories: true,
    subcategories: [
      'Schwerter & Klingen',
      'Dolche & Messer',
      'Äxte & Beile',
      'Hämmer & Streitkolben',
      'Stangenwaffen & Speere',
      'Bögen & Pfeile',
      'Armbrüste & Bolzen',
      'Wurfwaffen',
      'Faust- & Exotenwaffen',
      'Schilde & Parierschilde',
      'Feuerwaffen & Schwarzpulverwaffen',
      'Belagerungswaffen & Geschütze',
      'Magische & Runenwaffen'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 50,
    economyCategory: 'equipment'
  },
  {
    id: 'Rüstung & Schutzausrüstung',
    label: 'Rüstung & Schutzausrüstung',
    description: 'Rüstungsteile, Schilde, Helme, Panzerungen und Schutzbekleidung.',
    hasSubcategories: true,
    subcategories: [
      'Helme & Kopfschutz',
      'Brustpanzer & Kürasse',
      'Schilde & Parierschilde',
      'Arm- & Handschutz (Handschuhe, Armschienen)',
      'Bein- & Fußschienen',
      'Leichte Rüstung (Leder, Stoff, Gambeson)',
      'Mittlere Rüstung (Kette, Schuppenpanzer)',
      'Schwere Rüstung (Vollplatte, Plattenharnisch)',
      'Vollständige Rüstungsgarnituren',
      'Spezial- & Elementarschutz'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 75,
    economyCategory: 'equipment'
  },
  {
    id: 'Werkzeuge',
    label: 'Werkzeuge',
    description: 'Spezifisches Arbeitsgerät für Handwerk, Bergbau, Landwirtschaft und Fachberufe.',
    hasSubcategories: true,
    subcategories: [
      'Schmiedewerkzeuge',
      'Holzbearbeitung & Schreinerei',
      'Steinbearbeitung & Maurerei',
      'Bergbau & Steinbruch',
      'Landwirtschaft & Erntewerkzeuge',
      'Kochen & Küchenwerkzeuge',
      'Fischerei & Fanggerät',
      'Jagd & Fallenbau',
      'Baugewerbe & Zimmerei',
      'Medizin- & Wundarztbesteck',
      'Schreib- & Feinmechanikerwerkzeug'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 20,
    economyCategory: 'equipment'
  },
  {
    id: 'Landwirtschaft',
    label: 'Landwirtschaft',
    description: 'Saatgut, Pflanzgut, Dünger, Futtermittel und landwirtschaftliche Hilfsstoffe.',
    hasSubcategories: true,
    subcategories: [
      'Saatgut & Saatgetreide',
      'Pflanzgut & Setzlinge',
      'Dünger & Bodenhilfsstoffe',
      'Futtermittel & Silage',
      'Landwirtschaftliche Hilfsstoffe',
      'Landwirtschaftliche Arbeitsmittel & Gespanne'
    ],
    defaultUnit: 'Säcke',
    defaultPrice: 8,
    economyCategory: 'raw_material'
  },
  {
    id: 'Tiere',
    label: 'Tiere',
    description: 'Nutztiere, Reittiere, Lasttiere, Wach- und Jagdtiere sowie Schlachtvieh (Art oder Einzeltier).',
    hasSubcategories: true,
    subcategories: [
      'Nutztiere & Stallvieh',
      'Reittiere (Pferde, Reittiere)',
      'Lasttiere & Packtiere',
      'Zugtiere (Ochsen, Zugpferde)',
      'Zuchttiere',
      'Schlachtvieh',
      'Wachtiere & Schutztiere',
      'Jagd- & Spürtiere',
      'Arbeitstiere (Falken, Brieftauben, Hütehunde)',
      'Exotische & Fantastische Tiere'
    ],
    defaultUnit: 'Tiere',
    defaultPrice: 120,
    economyCategory: 'animals'
  },
  {
    id: 'Transportmittel',
    label: 'Transportmittel',
    description: 'Karren, Wagen, Kutschen, Kähne, Schiffe, Luft- oder magische Fahrzeuge.',
    hasSubcategories: true,
    subcategories: [
      'Landfahrzeuge (Handkarren, Planwagen, Fuhrwerk, Kutsche)',
      'Wasserfahrzeuge (Floß, Boot, Lastkahn, Segelschiff, Kriegsschiff)',
      'Luftfahrzeuge (Zeppeline, Gleiter, Hängegleiter)',
      'Magische & Besondere Transportmittel',
      'Reit- & Zugtier-Zubehör (Geschirre, Sättel, Deichseln)'
    ],
    defaultUnit: 'Fahrzeuge',
    defaultPrice: 250,
    economyCategory: 'vehicles'
  },
  {
    id: 'Militärbedarf',
    label: 'Militärbedarf',
    description: 'Munition, Belagerungsgerät, Feldlager-Ausrüstung, Signalmittel und Truppenversorgung.',
    hasSubcategories: true,
    subcategories: [
      'Munition (Pfeile, Bolzen, Bleikugeln, Granaten)',
      'Belagerungsbedarf & Geschützmunition',
      'Feldlager-Ausrüstung (Zelte, Kochkessel, Schanzzeug)',
      'Signal- & Kommunikationsmittel (Hörner, Banner, Trommeln)',
      'Truppenbedarf, Rationen & Feldführung',
      'Militärische Marschausrüstung'
    ],
    defaultUnit: 'Kisten',
    defaultPrice: 60,
    economyCategory: 'equipment'
  },
  {
    id: 'Medizin',
    label: 'Medizin',
    description: 'Heilkräuter, Tinkturen, Salben, Gegengifte, Verbände und Arzneien.',
    hasSubcategories: true,
    subcategories: [
      'Heilkräuter & Naturmedizin',
      'Tinkturen & Elixiere',
      'Salben & Balsame',
      'Gegengifte & Neutralisatoren',
      'Verbände, Schienen & Wundversorgung',
      'Pharmazeutika & Arzneien'
    ],
    defaultUnit: 'Dosen',
    defaultPrice: 18,
    economyCategory: 'goods'
  },
  {
    id: 'Handelswaren',
    label: 'Handelswaren',
    description: 'Wertvolle Güter für Fernhandel, Gewürze, Luxuswaren, Salz, Tuche und Kolonialwaren.',
    hasSubcategories: true,
    subcategories: [
      'Gewürze & Kolonialwaren',
      'Luxusgüter, Schmuck & Edelsteine',
      'Salz & Konservierungsgüter',
      'Edeltuche, Seide & Samt',
      'Tee, Kaffee & Tabakwaren',
      'Handelsballen & Fernhandelsgüter'
    ],
    defaultUnit: 'Ballen',
    defaultPrice: 40,
    economyCategory: 'goods'
  },
  {
    id: 'Magische Gegenstände',
    label: 'Magische Gegenstände',
    description: 'Verzauberte Artefakte, Relikte, Fokussteine, Schriftrollen und magische Trinkets.',
    hasSubcategories: true,
    subcategories: [
      'Verzauberte Waffen & Rüstungen',
      'Artefakte & Relikte',
      'Fokussteine, Kristalle & Zauberstäbe',
      'Schriftrollen & Zauberformeln',
      'Zaubertränke & Alchemie',
      'Magische Ringe, Amulette & Talismane',
      'Wundersame Alltagsartefakte'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 300,
    economyCategory: 'special'
  },
  {
    id: 'Quest-/Story-Gegenstände',
    label: 'Quest-/Story-Gegenstände',
    description: 'Schlüssel, Siegel, Beweise, Pergamente und handlungsrelevante Unikate.',
    hasSubcategories: true,
    subcategories: [
      'Schlüssel, Dietriche & Öffnungswerkzeuge',
      'Siegel, Wappen & Amtsurkunden',
      'Geheime Dokumente, Tagebücher & Pergamente',
      'Beweisstücke, Indizien & Tatwerkzeuge',
      'Relikte & Familienerbstücke',
      'Einzigartige Handlungs-Unikate'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 0,
    economyCategory: 'special'
  },
  {
    id: 'Monster-Beute & Drops',
    label: 'Monster-Beute & Drops',
    description: 'Trophäen, Drüsen, Häute, Zähne, Organe und Beutestücke von Kreaturen und Monstern aus dem Monster-Codex.',
    hasSubcategories: true,
    subcategories: [
      'Kreaturen-Trophäen (Fell, Horn, Zähne)',
      'Drüsen, Gifte & Sekrete',
      'Elementare Essenz & Kristallkerne',
      'Carapace, Chitin & Schuppen',
      'Gestohlene Beute & Ausrüstung'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 20,
    economyCategory: 'raw_material'
  },
  {
    id: 'Dungeon-Vorkommen & Funde',
    label: 'Dungeon-Vorkommen & Funde',
    description: 'Seltene Erze, Schatztruhenbeute, Krypta-Relikte und Vorkommen aus Orts- und Dungeon-Codi.',
    hasSubcategories: true,
    subcategories: [
      'Erzadern & Höhlenkristalle',
      'Schatztruhen-Inhalte & Beutekisten',
      'Krypta- & Ruinenrelikte',
      'Versteckte Lagerbeute',
      'Bosskammer-Belohnungen'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 35,
    economyCategory: 'special'
  },
  {
    id: 'Loot-Quellen & Trophäen',
    label: 'Loot-Quellen & Trophäen',
    description: 'Ökologische Herkunftsgüter, Beute aus Jagd, Fischerei, Botanik, Ausgrabungen und besonderen Ereignissen.',
    hasSubcategories: true,
    subcategories: [
      'Jagdtrophäen & Wildnis-Felle',
      'Fischerei- & Tiefseefunde',
      'Botanische Sammelgüter & Kräuter',
      'Archäologische Ausgrabungen',
      'Saisonale & Ereignis-Beute'
    ],
    defaultUnit: 'Stück',
    defaultPrice: 25,
    economyCategory: 'inventory'
  }
];

export const STANDARD_UNITS = [
  'Stück',
  'kg',
  'Tonnen',
  'Gramm',
  'Portionen',
  'Flaschen',
  'Fässer',
  'Kisten',
  'Säcke',
  'Ballen',
  'Rollen',
  'Barren',
  'Scheite',
  'Dosen',
  'Tiere',
  'Fahrzeuge'
];

export const RARITY_LEVELS = [
  'Gewöhnlich / Alltäglich',
  'Solide / Gehoben',
  'Selten / Hochwertig',
  'Meisterlich / Kostbar',
  'Legendär / Einzigartig',
  'Mythisch / Antik'
];

export const ITEM_CONDITION_OPTIONS = [
  { value: 'exzellent', label: 'Exzellent / Neuwertig' },
  { value: 'gut', label: 'Gut / Einsatzbereit' },
  { value: 'knapp', label: 'Gebraucht / Abgenutzt' },
  { value: 'beschaedigt', label: 'Beschädigt / Reparaturbedürftig' },
  { value: 'verdorben', label: 'Verdorben / Unbrauchbar' }
];

export const TYPICAL_PRODUCING_HOLDING_TYPES = [
  'Schmiede & Waffenschmiede',
  'Bäckerei & Mühle',
  'Bauernhof & Gutshof',
  'Sägewerk & Holzfällerlager',
  'Bergwerk & Steinbruch',
  'Gerberei & Kürschnerei',
  'Weberei & Schneiderei',
  'Brauerei & Brennerei',
  'Alchemielabor & Apotheke',
  'Töpferei & Glashütte',
  'Schreinerei & Stellmacherei',
  'Schiffswerft & Bootsbauer',
  'Gestüt & Tierzuchtbetrieb',
  'Handelskontor & Warenlager'
];

export const CRAFTING_PROFESSIONS = [
  'Schmied / Waffenschmied',
  'Schreiner / Zimmermann',
  'Bäcker / Müller',
  'Bauer / Landwirt',
  'Schneider / Weber',
  'Gerber / Sattler',
  'Alchemist / Apotheker',
  'Brauer / Winzer',
  'Bergmann / Steinmetz',
  'Glaskünstler / Töpfer',
  'Kutscher / Schiffer',
  'Falkner / Gestütsmeister',
  'Kaufmann / Händler'
];

export const MILITARY_SUPPLY_ROLES = [
  'Standardausrüstung (Infantrie)',
  'Fernkampfausrüstung (Schützen)',
  'Reitereiausrüstung (Kavallerie)',
  'Schwere Ausrüstung / Rüstung',
  'Feldlager- & Trossbedarf',
  'Feldverpflegung & Rationen',
  'Feldmedizin & Lazarettbedarf',
  'Belagerungsgerät & Munition'
];

export type ItemBuilderType =
  | 'Rohstoff'
  | 'Material'
  | 'Baustoff'
  | 'Landwirtschaft'
  | 'Bergbau & Erze'
  | 'Saatgut & Pflanzen'
  | 'Nahrung'
  | 'Medizin / Alchemie'
  | 'Tränke & Elixiere'
  | 'Werkzeug'
  | 'Waffe'
  | 'Rüstung'
  | 'Kleidung'
  | 'Militärbedarf'
  | 'Tier'
  | 'Transportmittel'
  | 'Nautik & Seefahrt'
  | 'Alltagsgegenstand'
  | 'Handelsware'
  | 'Schmuck & Kostbarkeiten'
  | 'Kunst & Antiquitäten'
  | 'Buch & Schriftstück'
  | 'Gifte & Fallen'
  | 'Ritual- & Kultbedarf'
  | 'Magischer Gegenstand'
  | 'Monster-Beute'
  | 'Dungeon-Fund'
  | 'Quest-/Story-Gegenstand';

export interface ItemBuilderTypeMeta {
  type: ItemBuilderType;
  label: string;
  description: string;
  category: ItemMainCategory;
  defaultUnit: string;
  defaultPrice: number;
  subcategories: string[];
}

export const ITEM_BUILDER_TYPES: ItemBuilderTypeMeta[] = [
  {
    type: 'Rohstoff',
    label: 'Rohstoff',
    description: 'Natürliche Grundstoffe aus Bergbau, Natur, Forst, Steinbruch oder Urproduktion.',
    category: 'Rohstoffe',
    defaultUnit: 'kg',
    defaultPrice: 5,
    subcategories: [
      'Metallerze',
      'Minerale & Kristalle',
      'Edelmetalle & Edelsteine',
      'Steine, Erden & Ton',
      'Bau- & Nutzholz',
      'Kochzutaten & Gewürze',
      'Getreide & Feldfrüchte',
      'Kräuter & Alchemie',
      'Fasern & Textil-Rohstoffe',
      'Tierische Rohstoffe & Jagd',
      'Harze, Pech & Naturstoffe'
    ]
  },
  {
    type: 'Material',
    label: 'Material',
    description: 'Vorgefertigte Halbzeuge, Barren, Stoffe, Leder und veredelte Werkstoffe.',
    category: 'Materialien & Zwischenprodukte',
    defaultUnit: 'Stück',
    defaultPrice: 15,
    subcategories: [
      'Barren & Metallhalbzeuge',
      'Bretter & Balken',
      'Stoffe, Garne & Seile',
      'Leder, Pergament & Felle',
      'Platten, Nägel & Beschläge',
      'Glas, Ton & Keramik',
      'Papier, Tinte & Schreibstoffe',
      'Legierungen & Veredelte Metalle'
    ]
  },
  {
    type: 'Baustoff',
    label: 'Baustoff & Konstruktion',
    description: 'Ziegel, Mörtel, Werksteine, Balken, Dachziegel und Befestigungselemente für das Bauwesen und Holding-Ausbauten.',
    category: 'Baustoffe & Konstruktion',
    defaultUnit: 'Stück',
    defaultPrice: 18,
    subcategories: [
      'Ziegel & Mauersteine',
      'Mörtel, Kalk & Bindemittel',
      'Werksteine & Steinquader',
      'Bauholz, Balken & Dachlatten',
      'Dachziegel & Schieferplatten',
      'Beschläge, Nägel & Bauanker',
      'Pflastersteine & Fundamentsteine',
      'Befestigungselemente & Pfähle'
    ]
  },
  {
    type: 'Landwirtschaft',
    label: 'Landwirtschaft & Saatgut',
    description: 'Saatgut, Setzlinge, Futtermittel, Heu, Silage und Bodenverbesserer für Agrarbetriebe und Mühlen.',
    category: 'Landwirtschaft',
    defaultUnit: 'Säcke',
    defaultPrice: 8,
    subcategories: [
      'Saatgut & Saatgetreide',
      'Pflanzgut & Setzlinge',
      'Futtermittel, Heu & Silage',
      'Dünger & Bodenhilfsstoffe',
      'Landwirtschaftsbedarf & Stroh',
      'Zucht-Saatgut & Spezialsaaten'
    ]
  },
  {
    type: 'Nahrung',
    label: 'Nahrung',
    description: 'Lebensmittel, Rationen, Mehl, Fleisch, Fisch, Käse, Backwaren und Getränke.',
    category: 'Nahrung',
    defaultUnit: 'Portionen',
    defaultPrice: 3,
    subcategories: [
      'Frischwaren & Feldfrüchte',
      'Mehl & Mahlerzeugnisse',
      'Brot & Backwaren',
      'Fleisch- & Wurstwaren',
      'Fisch & Meeresfrüchte',
      'Milch- & Käseprodukte',
      'Konserven & Dauerproviant',
      'Getränke, Bier & Wein',
      'Gewürze & Delikatessen'
    ]
  },
  {
    type: 'Medizin / Alchemie',
    label: 'Medizin & Alchemie',
    description: 'Heilkräuter, Tinkturen, Salben, Gegengifte, alchemistische Reagenzien, Säuren und Verbände.',
    category: 'Medizin & Alchemie',
    defaultUnit: 'Dosen',
    defaultPrice: 20,
    subcategories: [
      'Heilkräuter & Frischpflanzen',
      'Heilsalben & Balsame',
      'Wundtinkturen & Arzneien',
      'Alchemistische Essenzen & Reagenzien',
      'Gegengifte & Antitoxine',
      'Verbände, Schienen & Wundversorgung',
      'Säuren, Laugen & Lösungsmittel',
      'Elixiere & Stärkungstränke'
    ]
  },
  {
    type: 'Werkzeug',
    label: 'Werkzeug',
    description: 'Spezifisches Arbeitsgerät für Handwerk, Bergbau, Holzbau, Feldarbeit und Praxis.',
    category: 'Werkzeuge',
    defaultUnit: 'Stück',
    defaultPrice: 20,
    subcategories: [
      'Schmiedewerkzeuge',
      'Holzbearbeitung & Schreinerei',
      'Steinmetz- & Maurerwerkzeuge',
      'Bergbau & Steinbruch',
      'Landwirtschafts- & Erntewerkzeuge',
      'Kochen & Küchenwerkzeuge',
      'Fischerei- & Jagdgerät',
      'Wundarzt- & Medizinerbesteck',
      'Feinmechanik- & Uhrmacherwerkzeug'
    ]
  },
  {
    type: 'Waffe',
    label: 'Waffe',
    description: 'Klingen, Wuchtwaffen, Stangenwaffen, Bögen, Armbrüste, Munition und Kampfgerät.',
    category: 'Waffen',
    defaultUnit: 'Stück',
    defaultPrice: 50,
    subcategories: [
      'Schwerter & Klingen',
      'Dolche & Messer',
      'Äxte & Beile',
      'Hämmer & Streitkolben',
      'Stangenwaffen & Speere',
      'Bögen & Pfeile',
      'Armbrüste & Bolzen',
      'Wurfwaffen',
      'Feuerwaffen & Schwarzpulver',
      'Magische & Runenwaffen'
    ]
  },
  {
    type: 'Rüstung',
    label: 'Rüstung',
    description: 'Rüstungsteile, Schilde, Helme, Panzerungen und Schutzbekleidung.',
    category: 'Rüstung & Schutzausrüstung',
    defaultUnit: 'Stück',
    defaultPrice: 75,
    subcategories: [
      'Helme & Kopfschutz',
      'Brustpanzer & Kürasse',
      'Schilde & Parierschilde',
      'Arm- & Handschutz',
      'Bein- & Fußschienen',
      'Leichte Rüstung (Leder/Stoff)',
      'Mittlere Rüstung (Kette/Schuppen)',
      'Schwere Rüstung (Vollplatte)',
      'Spezial- & Elementarschutz'
    ]
  },
  {
    type: 'Kleidung',
    label: 'Kleidung',
    description: 'Berufs-Outfits, Arbeitskluft, Schutzmäntel, Schuhe, Alltagskleidung und Zunftgewänder.',
    category: 'Kleidung & Textilien',
    defaultUnit: 'Stück',
    defaultPrice: 12,
    subcategories: [
      'Berufs-Outfits & Zunft-Sets',
      'Outfits & Komplette Sets',
      'Arbeits- & Schutzkleidung',
      'Alltagskleidung',
      'Mäntel & Wetterkleidung',
      'Schuhe & Stiefel',
      'Kopfbedeckungen',
      'Fest- & Zeremoniengewänder',
      'Militäruniformen'
    ]
  },
  {
    type: 'Militärbedarf',
    label: 'Militärbedarf',
    description: 'Munition, Belagerungsgerät, Feldlager-Ausrüstung, Signalmittel, Trossbedarf und Schanzzeug.',
    category: 'Militärbedarf',
    defaultUnit: 'Kisten',
    defaultPrice: 60,
    subcategories: [
      'Munitionsvorräte (Pfeile, Bolzen, Kugeln)',
      'Belagerungsbedarf & Geschützmunition',
      'Feldlager-Ausrüstung (Zelte, Kochkessel, Schanzzeug)',
      'Signal- & Kommunikationsmittel (Hörner, Banner, Trommeln)',
      'Schanzzeug & Palisadenbau',
      'Lazarett- & Feldarztkisten',
      'Truppenverpflegung & Notrationen'
    ]
  },
  {
    type: 'Tier',
    label: 'Tier',
    description: 'Nutztiere, Stallvieh, Zugtiere, Reittiere, Lasttiere, Jagd- und Arbeitstiere.',
    category: 'Tiere',
    defaultUnit: 'Tiere',
    defaultPrice: 120,
    subcategories: [
      'Nutztiere & Stallvieh',
      'Milchvieh & Rinder',
      'Zugtiere (Ochsen, Zugpferde)',
      'Reittiere (Pferde, Reittiere)',
      'Lasttiere & Packmulis',
      'Zuchttiere',
      'Schlachtvieh',
      'Wachtiere & Schutzhunde',
      'Jagd- & Arbeitstiere'
    ]
  },
  {
    type: 'Transportmittel',
    label: 'Transportmittel',
    description: 'Karren, Handkarren, Wagen, Kutschen, Kähne, Schiffe und Transportbehälter.',
    category: 'Transportmittel',
    defaultUnit: 'Fahrzeuge',
    defaultPrice: 250,
    subcategories: [
      'Landfahrzeuge (Handkarren, Planwagen, Fuhrwerk, Kutsche)',
      'Wasserfahrzeuge (Floß, Boot, Lastkahn, Segelschiff)',
      'Schlitten & Winterfahrzeuge',
      'Transportbehälter (Fässer, Kisten, Packtaschen)',
      'Reit- & Zugtier-Zubehör (Geschirre, Sättel, Deichseln)'
    ]
  },
  {
    type: 'Alltagsgegenstand',
    label: 'Alltagsgegenstand',
    description: 'Haushaltsgeräte, Geschirr, Beleuchtung, Möbel, Behälter, Hygiene und Alltagsbedarf.',
    category: 'Alltags- & Haushaltsgegenstände',
    defaultUnit: 'Stück',
    defaultPrice: 8,
    subcategories: [
      'Geschirr & Kochgeschirr',
      'Beleuchtung (Lampen, Kerzen, Laternen, Öl)',
      'Möbel & Einrichtungsgegenstände',
      'Haushaltsgeräte & Reinigungsutensilien (Eimer, Besen)',
      'Hygiene, Seifen & Waschmittel',
      'Schreib- & Dokumentenbedarf',
      'Behälter, Truhen & Gefäße'
    ]
  },
  {
    type: 'Handelsware',
    label: 'Handelsware',
    description: 'Wertvolle Güter für Fernhandel, Gewürze, Luxusgüter, Salz, Tuche und Kolonialwaren.',
    category: 'Handelswaren',
    defaultUnit: 'Ballen',
    defaultPrice: 40,
    subcategories: [
      'Gewürze & Kolonialwaren',
      'Luxusgüter, Schmuck & Edelsteine',
      'Salz & Konservierungsgüter',
      'Edeltuche, Seide & Samt',
      'Tee, Kaffee & Tabakwaren',
      'Handelsballen & Fernhandelsgüter',
      'Edelmetallbarren & Münzen'
    ]
  },
  {
    type: 'Magischer Gegenstand',
    label: 'Magischer Gegenstand',
    description: 'Verzauberte Artefakte, Relikte, Fokussteine, Schriftrollen, Zauberstäbe und Amulette.',
    category: 'Magische Gegenstände',
    defaultUnit: 'Stück',
    defaultPrice: 300,
    subcategories: [
      'Verzauberte Waffen & Rüstungen',
      'Artefakte & Relikte',
      'Fokussteine, Kristalle & Zauberstäbe',
      'Schriftrollen & Zauberformeln',
      'Zaubertränke & Arkane Essenzen',
      'Magische Ringe, Amulette & Talismane'
    ]
  },
  {
    type: 'Monster-Beute',
    label: 'Monster-Beute',
    description: 'Trophäen, Drüsen, Häute, Zähne, Schuppen, Gifte und Beutestücke von Kreaturen und Bestien.',
    category: 'Monster-Beute & Drops',
    defaultUnit: 'Stück',
    defaultPrice: 20,
    subcategories: [
      'Kreaturen-Trophäen (Fell, Horn, Zähne)',
      'Drüsen, Gifte & Sekrete',
      'Elementare Essenz & Kristallkerne',
      'Carapace, Chitin & Schuppen',
      'Monstersehnen, Krallen & Knochen'
    ]
  },
  {
    type: 'Dungeon-Fund',
    label: 'Dungeon-Fund',
    description: 'Schatztruhenbeute, Krypta-Relikte, Erzader-Funde und Bosskammer-Belohnungen.',
    category: 'Dungeon-Vorkommen & Funde',
    defaultUnit: 'Stück',
    defaultPrice: 35,
    subcategories: [
      'Schatztruhen-Inhalte & Beutekisten',
      'Krypta- & Ruinenrelikte',
      'Erzadern & Höhlenkristalle',
      'Versteckte Lagerbeute',
      'Bosskammer-Belohnungen'
    ]
  },
  {
    type: 'Quest-/Story-Gegenstand',
    label: 'Quest-/Story-Gegenstand',
    description: 'Schlüssel, Siegel, Beweise, Pergamente, Urkunden und handlungsrelevante Unikate.',
    category: 'Quest-/Story-Gegenstände',
    defaultUnit: 'Stück',
    defaultPrice: 0,
    subcategories: [
      'Schlüssel, Dietriche & Öffnungswerkzeuge',
      'Siegel, Wappen & Amtsurkunden',
      'Geheime Dokumente, Tagebücher & Pergamente',
      'Beweisstücke, Indizien & Tatwerkzeuge',
      'Relikte & Familienerbstücke',
      'Einzigartige Handlungs-Unikate'
    ]
  },
  {
    type: 'Buch & Schriftstück',
    label: 'Buch & Schriftstück',
    description: 'Bücher, Kodizes, Schriftrollen, Landkarten, Urkunden, Tagebücher und Grimoires.',
    category: 'Bücher & Schriften',
    defaultUnit: 'Stück',
    defaultPrice: 35,
    subcategories: [
      'Bücher & Kodizes',
      'Schriftrollen & Zauberformeln',
      'Kartografie, Seekarten & Pläne',
      'Urkunden, Verträge & Erlasse',
      'Tagebücher, Logbücher & Aufzeichnungen',
      'Grimoires & Arkane Schriften'
    ]
  },
  {
    type: 'Schmuck & Kostbarkeiten',
    label: 'Schmuck & Kostbarkeiten',
    description: 'Ringe, Amulette, Kronen, Edelmetallketten, Kostbares Geschirr und Zierat.',
    category: 'Schmuck & Kostbarkeiten',
    defaultUnit: 'Stück',
    defaultPrice: 150,
    subcategories: [
      'Ringe & Siegelringe',
      'Amulette & Medaillons',
      'Kronen, Diademe & Reif',
      'Edelmetallketten & Armreifen',
      'Kostbares Geschirr, Pokale & Schatullen',
      'Zierat, Broschen & Gemmen'
    ]
  },
  {
    type: 'Gifte & Fallen',
    label: 'Gifte & Fallen',
    description: 'Toxine, Kontaktgifte, Betäubungsmittel, mechanische Fallen, Rauchbomben und Schurkenbedarf.',
    category: 'Gifte & Fallen',
    defaultUnit: 'Dosen',
    defaultPrice: 45,
    subcategories: [
      'Toxine & Kontaktgifte',
      'Betäubungsmittel & Schlafstoffe',
      'Mechanische Fallen & Auslöser',
      'Sprengsätze & Rauchbomben',
      'Schunken- & Infiltrationswerkzeuge'
    ]
  },
  {
    type: 'Ritual- & Kultbedarf',
    label: 'Ritual- & Kultbedarf',
    description: 'Reliquien, Altarutensilien, Weihrauch, Opfergaben, Ritualkerzen und Weihewasser.',
    category: 'Ritual- & Kultbedarf',
    defaultUnit: 'Stück',
    defaultPrice: 50,
    subcategories: [
      'Reliquien & Heiligtümer',
      'Altar- & Tempelutensilien',
      'Weihrauch & Opfergaben',
      'Ritualkerzen & Salböle',
      'Weihewasser & Segnungsgüter'
    ]
  },
  {
    type: 'Bergbau & Erze',
    label: 'Bergbau & Erze',
    description: 'Edelerze, Metallerze, Gesteinsproben, Mineralien, Erzadern und Flussmittel.',
    category: 'Bergbau & Erze',
    defaultUnit: 'kg',
    defaultPrice: 15,
    subcategories: [
      'Edelerze & Metallerze',
      'Minerale & Gesteinsproben',
      'Erzadern & Flöze',
      'Glimmer & Kristalle',
      'Schlacke & Flussmittel'
    ]
  },
  {
    type: 'Saatgut & Pflanzen',
    label: 'Saatgut & Pflanzen',
    description: 'Getreidesaatgut, Setzlinge, Heilpflanzensamen, Spezialsaaten und Bodenhilfsstoffe.',
    category: 'Saatgut & Pflanzen',
    defaultUnit: 'Säcke',
    defaultPrice: 12,
    subcategories: [
      'Getreidesaatgut & Körner',
      'Setzlinge & Stecklinge',
      'Heilpflanzensamen & Kräutersaat',
      'Spezialsaaten & Zauberpflanzen',
      'Keim- & Bodenhilfsstoffe'
    ]
  },
  {
    type: 'Nautik & Seefahrt',
    label: 'Nautik & Seefahrt',
    description: 'Nautische Instrumente, Kompasse, Seekarten, Schiffsbedarf, Takelage und Fernrohre.',
    category: 'Nautik & Seefahrt',
    defaultUnit: 'Stück',
    defaultPrice: 80,
    subcategories: [
      'Nautische Instrumente & Kompasse',
      'Seekarten & Logbücher',
      'Schiffsbedarf & Takelage',
      'Navigationsbesteck & Fernrohre',
      'Anker, Tauwerk & Blöcke'
    ]
  },
  {
    type: 'Kunst & Antiquitäten',
    label: 'Kunst & Antiquitäten',
    description: 'Gemälde, Wandteppiche, Skulpturen, antike Vasen und historische Fundstücke.',
    category: 'Kunst & Antiquitäten',
    defaultUnit: 'Stück',
    defaultPrice: 200,
    subcategories: [
      'Gemälde & Wandteppiche',
      'Skulpturen, Statuetten & Büsten',
      'Historische Vasen & Keramiken',
      'Antike Artefakte & Funde',
      'Reliefs & Holzschnitzereien'
    ]
  },
  {
    type: 'Tränke & Elixiere',
    label: 'Tränke & Elixiere',
    description: 'Heil- & Manatränke, Stärkungselixiere, Zauberöle, Verwandlungstränke und Phiolen.',
    category: 'Tränke & Elixiere',
    defaultUnit: 'Flaschen',
    defaultPrice: 30,
    subcategories: [
      'Heil- & Regenerations-Tränke',
      'Mana- & Magie-Essenzen',
      'Stärkungselixiere & Zauberöle',
      'Verwandlungs- & Tarnöle',
      'Verzauberte Phiolen & Arkanöle'
    ]
  }
];

export const ITEM_USE_DOMAINS = [
  { id: 'alltag', label: 'Alltag', description: 'Haushalt, Kleidung, Ernährung, Hygiene und Wohnkomfort' },
  { id: 'wirtschaft', label: 'Wirtschaft', description: 'Handel, Produktion, Transport, Betriebe und Landwirtschaft' },
  { id: 'armee', label: 'Armee', description: 'Militärausrüstung, Bewaffnung, Garnisonsbedarf und Feldzug' },
  { id: 'handwerk', label: 'Handwerk', description: 'Werkzeuge, Zwischenprodukte, Reparatur und Veredelung' },
  { id: 'magie', label: 'Magie', description: 'Rituale, Zauberfokus, Alchemie und arkane Speicher' }
] as const;

export type ItemUseDomainId = (typeof ITEM_USE_DOMAINS)[number]['id'];

export const ITEM_ORIGIN_TYPES = [
  { id: 'normal_produziert', label: 'normal produziert', description: 'Handwerkliche Werkstatt, Manufaktur, Zunftbetrieb oder Siedlung' },
  { id: 'natuerliches_vorkommen', label: 'natürliches Vorkommen', description: 'Wildnis, Bergbau, Flora & Fauna, Gewässer oder Sammeln' },
  { id: 'dungeon', label: 'Dungeon', description: 'Ruinen, Katakomben, Schatztruhen, Krypten oder Gewölbe' },
  { id: 'monster_drop', label: 'Monster-Drop', description: 'Beute, Trophäen, Drüsen oder Tierhäute erlegter Kreaturen' },
  { id: 'quest', label: 'Quest', description: 'Missionsbelohnung, Auftraggeber-Geschenk oder Handlungsziel' },
  { id: 'einzigartiger_fund', label: 'einzigartiger Fund', description: 'Uraltes Relikt, historische Ausgrabung oder legendäres Einzelstück' }
] as const;

export type ItemOriginTypeId = (typeof ITEM_ORIGIN_TYPES)[number]['id'];

export function getBuilderTypeForCategory(cat?: string): ItemBuilderType {
  if (!cat) return 'Rohstoff';
  switch (cat) {
    case 'Rohstoffe':
    case 'Rohstoff':
      return 'Rohstoff';
    case 'Materialien & Zwischenprodukte':
    case 'Material':
    case 'Produkte':
      return 'Material';
    case 'Baustoffe & Konstruktion':
    case 'Baustoff':
      return 'Baustoff';
    case 'Landwirtschaft':
    case 'Landwirtschaft & Saatgut':
      return 'Landwirtschaft';
    case 'Nahrung':
      return 'Nahrung';
    case 'Medizin':
    case 'Medizin & Alchemie':
    case 'Medizin / Alchemie':
    case 'Alchemie':
      return 'Medizin / Alchemie';
    case 'Werkzeuge':
    case 'Werkzeug':
      return 'Werkzeug';
    case 'Waffen':
    case 'Waffe':
      return 'Waffe';
    case 'Rüstung & Schutzausrüstung':
    case 'Rüstung':
      return 'Rüstung';
    case 'Kleidung & Textilien':
    case 'Kleidung':
      return 'Kleidung';
    case 'Militärbedarf':
      return 'Militärbedarf';
    case 'Tiere':
    case 'Tier':
      return 'Tier';
    case 'Transportmittel':
      return 'Transportmittel';
    case 'Alltags- & Haushaltsgegenstände':
    case 'Alltagsgegenstand':
    case 'Alltag':
      return 'Alltagsgegenstand';
    case 'Handelswaren':
    case 'Handelsware':
      return 'Handelsware';
    case 'Magische Gegenstände':
    case 'Magischer Gegenstand':
    case 'Magie':
      return 'Magischer Gegenstand';
    case 'Monster-Beute & Drops':
    case 'Monster-Beute':
    case 'Monster-Drop':
    case 'Loot-Quellen & Trophäen':
      return 'Monster-Beute';
    case 'Dungeon-Vorkommen & Funde':
    case 'Dungeon-Fund':
      return 'Dungeon-Fund';
    case 'Quest-/Story-Gegenstände':
    case 'Quest-/Story-Gegenstand':
    case 'Quest & Story':
      return 'Quest-/Story-Gegenstand';
    case 'Bücher & Schriften':
    case 'Buch & Schriftstück':
    case 'Buch':
    case 'Schriftstück':
      return 'Buch & Schriftstück';
    case 'Schmuck & Kostbarkeiten':
    case 'Schmuck':
      return 'Schmuck & Kostbarkeiten';
    case 'Gifte & Fallen':
    case 'Gifte':
    case 'Fallen':
      return 'Gifte & Fallen';
    case 'Ritual- & Kultbedarf':
    case 'Ritual':
    case 'Kult':
      return 'Ritual- & Kultbedarf';
    case 'Bergbau & Erze':
    case 'Bergbau':
    case 'Erze':
      return 'Bergbau & Erze';
    case 'Saatgut & Pflanzen':
    case 'Saatgut':
    case 'Pflanzen':
      return 'Saatgut & Pflanzen';
    case 'Nautik & Seefahrt':
    case 'Nautik':
    case 'Seefahrt':
      return 'Nautik & Seefahrt';
    case 'Kunst & Antiquitäten':
    case 'Kunst':
    case 'Antiquitäten':
      return 'Kunst & Antiquitäten';
    case 'Tränke & Elixiere':
    case 'Tränke':
    case 'Elixiere':
      return 'Tränke & Elixiere';
    default:
      return 'Rohstoff';
  }
}

