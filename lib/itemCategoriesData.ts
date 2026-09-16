// -*- coding: utf-8 -*-
/**
 * Datendefinitionen und Schemata für alle Gegenstandskategorien, Subkategorien,
 * Standardwerte, Mengeneinheiten und Wirtschafts-Schnittstellen.
 */

export type ItemMainCategory =
  | 'Rohstoffe'
  | 'Materialien & Zwischenprodukte'
  | 'Produkte'
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
  | 'Quest-/Story-Gegenstände';

export interface ItemCategoryMeta {
  id: ItemMainCategory;
  label: string;
  description: string;
  hasSubcategories: boolean;
  subcategories?: string[];
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
    subcategories: ['Erz', 'Holz', 'Stein', 'Pflanzen', 'Tierische Rohstoffe'],
    defaultUnit: 'kg',
    defaultPrice: 5,
    economyCategory: 'raw_material'
  },
  {
    id: 'Materialien & Zwischenprodukte',
    label: 'Materialien & Zwischenprodukte',
    description: 'Vorgefertigte Halbzeuge und veredelte Werkstoffe zur Weiterverarbeitung im Handwerk.',
    hasSubcategories: true,
    subcategories: ['Barren', 'Bretter', 'Stoff', 'Leder', 'Verarbeitete Materialien'],
    defaultUnit: 'Stück',
    defaultPrice: 15,
    economyCategory: 'raw_material'
  },
  {
    id: 'Produkte',
    label: 'Produkte',
    description: 'Fertige Gebrauchs- und Handwerksgüter für Haushalt, Werkstatt oder Handel.',
    hasSubcategories: true,
    subcategories: ['Lebensmittel', 'Werkzeuge', 'Möbel', 'Handwerksprodukte'],
    defaultUnit: 'Stück',
    defaultPrice: 25,
    economyCategory: 'goods'
  },
  {
    id: 'Nahrung',
    label: 'Nahrung',
    description: 'Lebensmittel, Rationen, Feldverpflegung, Frischwaren und Getränke.',
    hasSubcategories: false,
    defaultUnit: 'Portionen',
    defaultPrice: 2,
    economyCategory: 'food_drink'
  },
  {
    id: 'Kleidung & Textilien',
    label: 'Kleidung & Textilien',
    description: 'Alltagskleidung, Arbeitskluft, Schutzmäntel, Festgewänder und Schuhe.',
    hasSubcategories: false,
    defaultUnit: 'Stück',
    defaultPrice: 12,
    economyCategory: 'equipment'
  },
  {
    id: 'Waffen',
    label: 'Waffen',
    description: 'Klingen, Wuchtwaffen, Stangenwaffen, Bögen, Armbrüste und magische Kampfstäbe.',
    hasSubcategories: false,
    defaultUnit: 'Stück',
    defaultPrice: 50,
    economyCategory: 'equipment'
  },
  {
    id: 'Rüstung & Schutzausrüstung',
    label: 'Rüstung & Schutzausrüstung',
    description: 'Rüstungsteile, Schilde, Helme, Panzerungen und Schutzbekleidung.',
    hasSubcategories: false,
    defaultUnit: 'Stück',
    defaultPrice: 75,
    economyCategory: 'equipment'
  },
  {
    id: 'Werkzeuge',
    label: 'Werkzeuge',
    description: 'Spezifisches Arbeitsgerät für Handwerk, Bergbau, Landwirtschaft und Kunstfertigkeit.',
    hasSubcategories: false,
    defaultUnit: 'Stück',
    defaultPrice: 20,
    economyCategory: 'equipment'
  },
  {
    id: 'Landwirtschaft',
    label: 'Landwirtschaft',
    description: 'Saatgut, Pflanzgut, Dünger, Futtermittel und landwirtschaftliche Hilfsstoffe.',
    hasSubcategories: false,
    defaultUnit: 'Säcke',
    defaultPrice: 8,
    economyCategory: 'raw_material'
  },
  {
    id: 'Tiere',
    label: 'Tiere',
    description: 'Nutztiere, Reittiere, Lasttiere, Wach- und Jagdtiere sowie Schlachtvieh.',
    hasSubcategories: false,
    defaultUnit: 'Tiere',
    defaultPrice: 120,
    economyCategory: 'animals'
  },
  {
    id: 'Transportmittel',
    label: 'Transportmittel',
    description: 'Karren, Wagen, Kutschen, Kähne, Schiffe und Fuhrwerke.',
    hasSubcategories: false,
    defaultUnit: 'Fahrzeuge',
    defaultPrice: 250,
    economyCategory: 'vehicles'
  },
  {
    id: 'Militärbedarf',
    label: 'Militärbedarf',
    description: 'Munition, Belagerungsgerät, Feldlager-Ausrüstung, Signalmittel und Truppenbedarf.',
    hasSubcategories: false,
    defaultUnit: 'Kisten',
    defaultPrice: 60,
    economyCategory: 'equipment'
  },
  {
    id: 'Medizin',
    label: 'Medizin',
    description: 'Heilkräuter, Tinkturen, Salben, Gegengifte, Verbände und Arzneien.',
    hasSubcategories: false,
    defaultUnit: 'Dosen',
    defaultPrice: 18,
    economyCategory: 'goods'
  },
  {
    id: 'Handelswaren',
    label: 'Handelswaren',
    description: 'Wertvolle Güter für Fernhandel, Gewürze, Luxuswaren, Salz, Tuche und Kolonialwaren.',
    hasSubcategories: false,
    defaultUnit: 'Ballen',
    defaultPrice: 40,
    economyCategory: 'goods'
  },
  {
    id: 'Magische Gegenstände',
    label: 'Magische Gegenstände',
    description: 'Verzauberte Artefakte, Relikte, Fokussteine, Schriftrollen und magische Trinkets.',
    hasSubcategories: false,
    defaultUnit: 'Stück',
    defaultPrice: 300,
    economyCategory: 'special'
  },
  {
    id: 'Quest-/Story-Gegenstände',
    label: 'Quest-/Story-Gegenstände',
    description: 'Schlüssel, Siegel, Beweise, Pergamente und handlungsrelevante Unikate.',
    hasSubcategories: false,
    defaultUnit: 'Stück',
    defaultPrice: 0,
    economyCategory: 'special'
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
