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

export type ItemBuilderType =
  | 'Rohstoff'
  | 'Material'
  | 'Werkzeug'
  | 'Waffe'
  | 'Rüstung'
  | 'Nahrung'
  | 'Kleidung'
  | 'Alltagsgegenstand'
  | 'Tier'
  | 'Transportmittel'
  | 'Magischer Gegenstand'
  | 'Handelsware'
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
    description: 'Natürliche Grundstoffe aus Bergbau, Natur, Forst, Steinbruch oder Jagd.',
    category: 'Rohstoffe',
    defaultUnit: 'kg',
    defaultPrice: 5,
    subcategories: ['Metallerze', 'Bau- & Nutzholz', 'Pflanzen & Kräuter', 'Tierische Rohstoffe', 'Steine & Mineralien', 'Harze & Naturstoffe']
  },
  {
    type: 'Material',
    label: 'Material',
    description: 'Vorgefertigte Halbzeuge, Barren, Stoffe und veredelte Werkstoffe.',
    category: 'Materialien & Zwischenprodukte',
    defaultUnit: 'Stück',
    defaultPrice: 15,
    subcategories: ['Barren & Metallhalbzeuge', 'Bretter & Balken', 'Stoffe, Garne & Seile', 'Leder & Felle', 'Glas, Ton & Keramik', 'Legierungen']
  },
  {
    type: 'Werkzeug',
    label: 'Werkzeug',
    description: 'Spezifisches Arbeitsgerät für Handwerk, Bergbau, Feldarbeit und Praxis.',
    category: 'Werkzeuge',
    defaultUnit: 'Stück',
    defaultPrice: 20,
    subcategories: ['Schmiedewerkzeuge', 'Holzbearbeitung', 'Steinbearbeitung', 'Bergbau & Steinbruch', 'Landwirtschaft & Ernte', 'Wundarztbesteck', 'Kochen & Küchenwerkzeuge']
  },
  {
    type: 'Waffe',
    label: 'Waffe',
    description: 'Klingen, Wuchtwaffen, Stangenwaffen, Bögen, Armbrüste und Kampfgerät.',
    category: 'Waffen',
    defaultUnit: 'Stück',
    defaultPrice: 50,
    subcategories: ['Schwerter & Klingen', 'Dolche & Messer', 'Äxte & Beile', 'Hämmer & Streitkolben', 'Stangenwaffen & Speere', 'Bögen & Pfeile', 'Armbrüste & Bolzen', 'Magische & Runenwaffen']
  },
  {
    type: 'Rüstung',
    label: 'Rüstung',
    description: 'Rüstungsteile, Schilde, Helme, Panzerungen und Schutzbekleidung.',
    category: 'Rüstung & Schutzausrüstung',
    defaultUnit: 'Stück',
    defaultPrice: 75,
    subcategories: ['Helme & Kopfschutz', 'Brustpanzer & Kürasse', 'Schilde & Parierschilde', 'Arm- & Handschutz', 'Bein- & Fußschienen', 'Leichte Rüstung (Leder/Stoff)', 'Mittlere Rüstung (Kette)', 'Schwere Rüstung (Platte)']
  },
  {
    type: 'Nahrung',
    label: 'Nahrung',
    description: 'Lebensmittel, Rationen, Feldverpflegung, Backwaren und Getränke.',
    category: 'Nahrung',
    defaultUnit: 'Portionen',
    defaultPrice: 2,
    subcategories: ['Frischwaren & Feldfrüchte', 'Brot & Backwaren', 'Fleisch- & Wurstwaren', 'Fisch & Meeresfrüchte', 'Konserven & Dauerproviant', 'Getränke & Brauereiprodukte']
  },
  {
    type: 'Kleidung',
    label: 'Kleidung',
    description: 'Alltagskleidung, Arbeitskluft, Schutzmäntel, Stiefel und Gewänder.',
    category: 'Kleidung & Textilien',
    defaultUnit: 'Stück',
    defaultPrice: 12,
    subcategories: ['Alltagskleidung', 'Arbeits- & Schutzkleidung', 'Mäntel & Wetterkleidung', 'Schuhe & Stiefel', 'Kopfbedeckungen', 'Fest- & Zeremoniengewänder']
  },
  {
    type: 'Alltagsgegenstand',
    label: 'Alltagsgegenstand',
    description: 'Haushaltsgeräte, Geschirr, Beleuchtung, Möbel und Alltagsbedarf.',
    category: 'Alltags- & Haushaltsgegenstände',
    defaultUnit: 'Stück',
    defaultPrice: 8,
    subcategories: ['Geschirr & Kochgeschirr', 'Beleuchtung & Laternen', 'Möbel & Einrichtung', 'Behälter & Truhen', 'Hygiene & Reinigung', 'Schreib- & Dokumentenbedarf']
  },
  {
    type: 'Tier',
    label: 'Tier',
    description: 'Nutztiere, Reittiere, Lasttiere, Jagdtiere und Arbeitstiere.',
    category: 'Tiere',
    defaultUnit: 'Tiere',
    defaultPrice: 120,
    subcategories: ['Nutztiere & Stallvieh', 'Reittiere', 'Lasttiere & Packtiere', 'Zugtiere', 'Wach- & Schutztiere', 'Jagd- & Arbeitstiere']
  },
  {
    type: 'Transportmittel',
    label: 'Transportmittel',
    description: 'Karren, Wagen, Kutschen, Kähne, Schiffe und Reisezubehör.',
    category: 'Transportmittel',
    defaultUnit: 'Fahrzeuge',
    defaultPrice: 250,
    subcategories: ['Landfahrzeuge (Karren, Wagen, Kutsche)', 'Wasserfahrzeuge (Boot, Kahn, Schiff)', 'Schlitten & Winterfahrzeuge', 'Magische Transportmittel', 'Zugtier-Geschirre & Zubehör']
  },
  {
    type: 'Magischer Gegenstand',
    label: 'Magischer Gegenstand',
    description: 'Verzauberte Artefakte, Relikte, Fokussteine, Schriftrollen und Elixiere.',
    category: 'Magische Gegenstände',
    defaultUnit: 'Stück',
    defaultPrice: 300,
    subcategories: ['Verzauberte Waffen & Rüstungen', 'Artefakte & Relikte', 'Fokussteine & Zauberstäbe', 'Schriftrollen & Zauberformeln', 'Zaubertränke & Alchemie', 'Amulette, Ringe & Talismane']
  },
  {
    type: 'Handelsware',
    label: 'Handelsware',
    description: 'Wertvolle Güter für Fernhandel, Gewürze, Luxusgüter, Tuche und Kolonialwaren.',
    category: 'Handelswaren',
    defaultUnit: 'Ballen',
    defaultPrice: 40,
    subcategories: ['Gewürze & Kolonialwaren', 'Luxusgüter & Schmuck', 'Salz & Konservierungsgüter', 'Edeltuche, Seide & Samt', 'Tee, Kaffee & Genussmittel', 'Handelsballen']
  },
  {
    type: 'Dungeon-Fund',
    label: 'Dungeon-Fund',
    description: 'Schatztruhenbeute, Krypta-Relikte, Erzader-Funde und Bosskammer-Belohnungen.',
    category: 'Dungeon-Vorkommen & Funde',
    defaultUnit: 'Stück',
    defaultPrice: 35,
    subcategories: ['Schatztruhen-Inhalte', 'Krypta- & Ruinenrelikte', 'Erzadern & Höhlenkristalle', 'Versteckte Lagerbeute', 'Bosskammer-Belohnungen']
  },
  {
    type: 'Quest-/Story-Gegenstand',
    label: 'Quest-/Story-Gegenstand',
    description: 'Schlüssel, Siegel, Beweise, Pergamente und handlungsrelevante Unikate.',
    category: 'Quest-/Story-Gegenstände',
    defaultUnit: 'Stück',
    defaultPrice: 0,
    subcategories: ['Schlüssel & Öffnungswerkzeuge', 'Siegel, Wappen & Urkunden', 'Geheime Dokumente & Pergamente', 'Beweisstücke & Tatwerkzeuge', 'Familienerbstücke & Relikte', 'Story-Unikate']
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
    case 'Werkzeuge':
    case 'Werkzeug':
      return 'Werkzeug';
    case 'Waffen':
    case 'Waffe':
      return 'Waffe';
    case 'Rüstung & Schutzausrüstung':
    case 'Rüstung':
      return 'Rüstung';
    case 'Nahrung':
      return 'Nahrung';
    case 'Kleidung & Textilien':
    case 'Kleidung':
      return 'Kleidung';
    case 'Alltags- & Haushaltsgegenstände':
    case 'Alltagsgegenstand':
      return 'Alltagsgegenstand';
    case 'Tiere':
    case 'Tier':
      return 'Tier';
    case 'Transportmittel':
      return 'Transportmittel';
    case 'Magische Gegenstände':
    case 'Magischer Gegenstand':
      return 'Magischer Gegenstand';
    case 'Handelswaren':
    case 'Handelsware':
    case 'Medizin':
      return 'Handelsware';
    case 'Dungeon-Vorkommen & Funde':
    case 'Dungeon-Fund':
    case 'Monster-Beute & Drops':
    case 'Loot-Quellen & Trophäen':
      return 'Dungeon-Fund';
    case 'Quest-/Story-Gegenstände':
    case 'Quest-/Story-Gegenstand':
      return 'Quest-/Story-Gegenstand';
    default:
      return 'Rohstoff';
  }
}

