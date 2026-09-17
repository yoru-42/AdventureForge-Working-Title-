// -*- coding: utf-8 -*-
/**
 * Datendefinitionen und Schemata für alle Gegenstandskategorien, Subkategorien,
 * Standardwerte, Mengeneinheiten, Produktionsbeziehungen und Wirtschafts-Schnittstellen.
 */

export type ItemMainCategory =
  | 'Rohstoffe'
  | 'Materialien & Zwischenprodukte'
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
  | 'Handelswaren'
  | 'Magische Gegenstände'
  | 'Quest-/Story-Gegenstände'
  | 'Monster-Beute & Drops'
  | 'Dungeon-Vorkommen & Funde'
  | 'Loot-Quellen & Trophäen';

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
      'Edelmetalle & Edelsteine',
      'Bau- & Nutzholz',
      'Pflanzen, Fasern & Kräuter',
      'Tierische Rohstoffe (Häute, Horn, Knochen)',
      'Steine, Erden & Mineralien',
      'Harze, Pech & Naturstoffe',
      'Erz',
      'Holz',
      'Stein',
      'Pflanzen'
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
      'Frischwaren & Grundnahrungsmittel',
      'Brot & Backwaren',
      'Fleisch- & Wurstwaren',
      'Fisch & Meeresfrüchte',
      'Milch- & Käseprodukte',
      'Konserven & Dauerproviant',
      'Getränke & Brauereiprodukte',
      'Gewürzte Speisen & Delikatessen'
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
      'Alltagskleidung',
      'Arbeits- & Schutzkleidung',
      'Berufsbekleidung',
      'Militäruniformen & Truppenkleidung',
      'Festkleidung & Trachten',
      'Adels- & Zeremoniengewänder',
      'Schuhe, Stiefel & Schuhwerk',
      'Mäntel, Umhänge & Wetterkleidung',
      'Kopfbedeckungen & Hüte',
      'Stoffwaren & Meterware'
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
      'Feuerwaffen & Schwarzpulverwaffen',
      'Wurfwaffen',
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

