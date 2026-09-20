// -*- coding: utf-8 -*-
/**
 * Fest codierte Standard-Gegenstände für alle Gegenstandsarten in AdventureForge.
 * Beinhaltet alle Grundrohstoffe, Halbzeuge, Werkzeuge, Ausrüstung, Nahrung,
 * Handelswaren und Alltagsobjekte mit sauberen, granularen Einzelbezeichnungen
 * (ohne Doppel- oder Mischbezeichnungen), optimal abgestimmt auf das
 * Wirtschafts- & Managementsystem sowie das RPG-Inventar.
 */

import { LoreEntry } from '../types';
import { ItemBuilderType } from './itemCategoriesData';
import { PROFESSION_ITEMS_CATALOG } from './professionItemsCatalog';
import { ALL_WEAPONS } from './weaponTypesData';

export interface StandardItemDefinition {
  id: string;
  title: string;
  builderType: ItemBuilderType;
  mainCategory: string;
  subCategory: string;
  unit: string;
  pricePerUnit: number;
  materialQuality: string;
  rarity: string;
  isUnique: boolean;
  condition: string;
  description: string;
  details: Record<string, any>;
}

const BASE_STANDARD_ITEMS_CATALOG: StandardItemDefinition[] = [
  // =========================================================================
  // 1. ROHSTOFFE (Metallerze, Holz, Steine, Mineralien, Pflanzen, Agrar)
  // =========================================================================
  {
    id: 'std-raw-iron-ore',
    title: 'Eisenerz',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Metallerze',
    unit: 'kg',
    pricePerUnit: 3,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Schweres, rotbraunes Rohgestein mit dicht eingelagerten Eisenadern. Grundstoff für Schmelzöfen zur Gewinnung von Schmiedeeisen und Stahl.',
    details: {
      baseRawMaterial: 'Eisenerz',
      purity: '65% metallischer Gehalt',
      abundance: 'Reichhaltig in Bergwerken und Tagebauen',
      specialProperties: 'Schmelzpunkt ca. 1200-1530 °C nach Aufbereitung; magnetisch reagierend.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'abenteuer'],
      applicationArea: 'wirtschaft, abenteuer'
    }
  },
  {
    id: 'std-raw-copper-ore',
    title: 'Kupfererz',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Metallerze',
    unit: 'kg',
    pricePerUnit: 4,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Grünlich schimmerndes Rohgestein mit Chalkopyrit- oder Malachit-Adern. Leicht verhüttbar, unverzichtbar für Bronzelegierungen und Beschläge.',
    details: {
      baseRawMaterial: 'Kupfererz',
      purity: '70% Reingehalt',
      abundance: 'Weit verbreitet in Mittelgebirgen',
      specialProperties: 'Hohe Duktilität nach Verhüttung, hervorragende Wärme- und Magieleitung.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-raw-tin-ore',
    title: 'Zinnerz',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Metallerze',
    unit: 'kg',
    pricePerUnit: 6,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Dunkelbraune Zinnsteine aus Flussseifen oder Bergadern. Unverzichtbarer Zuschlagstoff für das Gießen von robuster Bronze.',
    details: {
      baseRawMaterial: 'Zinnerz',
      purity: '60% Zinnoxidgehalt',
      abundance: 'Regional begrenzt auf granitische Erzgänge',
      specialProperties: 'Niedriger Schmelzpunkt (ca. 232 °C in Reinform), legierungsfähig.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-raw-gold-ore',
    title: 'Golderz',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Edelmetalle & Edelsteine',
    unit: 'g',
    pricePerUnit: 25,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'makellos',
    description: 'Glänzende Goldkörner und Quarzadern aus Flussbetten und Tiefengängen. Korrosionsbeständig, extrem dehnbar und edelster Münzrohstoff.',
    details: {
      baseRawMaterial: 'Golderz',
      purity: '90-98% Feingold',
      abundance: 'Sehr selten, tiefe Quarzgänge oder Flussablagerungen',
      specialProperties: 'Korrosionsresistent, magieresonant, universeller Währungswert.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-raw-silver-ore',
    title: 'Silbererz',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Edelmetalle & Edelsteine',
    unit: 'g',
    pricePerUnit: 8,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Dunkles Silberglanzerz mit hellen Einsprengseln. Geschätzt für feine Münzen, Schmuckarbeiten und Beschläge gegen Unheil.',
    details: {
      baseRawMaterial: 'Silbererz',
      purity: '85% Feinsilbergehalt',
      abundance: 'Mäßig in tiefen Bergwerksstollen',
      specialProperties: 'Hohe Lichtreflexion, reinigende Wirkung gegen finstere Mächte.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'abenteuer'],
      applicationArea: 'wirtschaft, abenteuer'
    }
  },
  {
    id: 'std-raw-coal',
    title: 'Steinkohle',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Minerale & Kristalle',
    unit: 'kg',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Pechschwarze, energiereiche Brocken aus tiefen Flözen. Essentieller Brennstoff für Rennöfen, Schmiedefeuer und Schmelztiegel.',
    details: {
      baseRawMaterial: 'Steinkohle',
      purity: 'Hoher Kohlenstoffgehalt',
      abundance: 'Häufig in Flözen und Zechen',
      specialProperties: 'Sehr hohe Verbrennungstemperatur, bildet reduzierende Ofenatmosphäre.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-raw-charcoal',
    title: 'Holzkohle',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Harze, Pech & Naturstoffe',
    unit: 'kg',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Leichte, in Köhlerreilern verschwelte Holzkohle. Brennt raucharm und heiß, ideal für Feinschmieden, Essen und Glasöfen.',
    details: {
      baseRawMaterial: 'Holzkohle',
      purity: 'Gereinigter Kohlenstoff',
      abundance: 'Köhlereien in Wäldern',
      specialProperties: 'Raucharme Verbrennung, gleichmäßige Glut.',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-raw-wood-oak',
    title: 'Eichenholz',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Bau- & Nutzholz',
    unit: 'kg',
    pricePerUnit: 2,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Dichte, abgelagerte Eichenstämme aus alten Mischwäldern. Extrem tragfähig, witterungsbeständig und ideal für Bauwerke und Festungen.',
    details: {
      baseRawMaterial: 'Eichenrundholz',
      purity: 'Getrockneter Kernholzanteil',
      abundance: 'Weite Wälder und Forste',
      specialProperties: 'Widerstandsfähig gegen Fäulnis, hohe Faserbiegefestigkeit.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-raw-wood-pine',
    title: 'Kiefernholz',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Bau- & Nutzholz',
    unit: 'kg',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Geradwüchsiges Nadelholz aus Nadelwäldern. Leicht zu sägen, verharzt, hervorragend für Dachstühle, Kisten und Alltagsbauten.',
    details: {
      baseRawMaterial: 'Kiefernholz',
      purity: 'Nadelholz',
      abundance: 'Häufig in Berg- und Hügelwäldern',
      specialProperties: 'Geringes Eigengewicht, harzreich, gut spaltbar.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-raw-stone-granite',
    title: 'Granit',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Steine, Erden & Ton',
    unit: 'kg',
    pricePerUnit: 1,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Extrem harter Tiefengesteinsblock aus Steinbrüchen. Verwendung für massive Fundamente, Wehrmauern, Mahlsteine und Pflasterungen.',
    details: {
      baseRawMaterial: 'Granit',
      purity: 'Massives Gesteinsgefüge',
      abundance: 'Reichhaltig in Gebirgen und Steinbrüchen',
      specialProperties: 'Extreme Druckfestigkeit, witterungsbeständig über Jahrhunderte.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-raw-stone-limestone',
    title: 'Kalkstein',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Steine, Erden & Ton',
    unit: 'kg',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Heller, leicht bearbeitbarer Sedimentstein. Unentbehrlich für Mörtel, Branntkalk, Putze und ornamentale Fassadensteine.',
    details: {
      baseRawMaterial: 'Kalkstein',
      purity: 'Kalziumkarbonat',
      abundance: 'Hügelketten und Steinbrüche',
      specialProperties: 'Brennbar zu Baukalk, gut meißelbar.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-raw-stone-clay',
    title: 'Rohton',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Steine, Erden & Ton',
    unit: 'kg',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Feinkörniger, formbarer Naturton aus Flussläufen und Tongruben. Grundstoff für Töpfer, Ziegelbrenner und Ofenbauer.',
    details: {
      baseRawMaterial: 'Rohton',
      purity: 'Plastischer Mineralton',
      abundance: 'Häufig in Tälern und Tongruben',
      specialProperties: 'Wasserhaltig plastisch verformbar, brennt bei 900-1100 °C zu Keramik aus.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'handwerk']
    }
  },
  {
    id: 'std-raw-stone-quartz-sand',
    title: 'Quarzsand',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Steine, Erden & Ton',
    unit: 'kg',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Feiner, gewaschener Quarzsand aus Sandgruben. Unerlässlich für Mörtelmischungen, Feingussformen und Glasherstellung.',
    details: {
      baseRawMaterial: 'Quarzsand',
      purity: 'Siliziumdioxid',
      abundance: 'Sandgruben und Flussauen',
      specialProperties: 'Hoher Schmelzpunkt, abriebfest.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'handwerk']
    }
  },
  {
    id: 'std-raw-raw-hide',
    title: 'Tierhaut',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Tierische Rohstoffe & Jagd',
    unit: 'Stück',
    pricePerUnit: 5,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Gesalzene Rinder- oder Hirschhaut aus Viehzucht und Jagd. Grundstoff für Gerbereien zur Erzeugung von zähem Leder.',
    details: {
      baseRawMaterial: 'Tierhaut',
      purity: 'Gesäubert, entfleischt',
      abundance: 'Regelmäßig durch Viehzucht und Jagd',
      specialProperties: 'Benötigt Gerbung mit Eichenlohe oder Alaun zur Haltbarmachung.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-raw-fur',
    title: 'Fell',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Tierische Rohstoffe & Jagd',
    unit: 'Stück',
    pricePerUnit: 8,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Dichtes Winterfell von Waldwild und Tieren. Wärmendes Naturmaterial für Kragen, Fütterungen, Kälteschutz und Decken.',
    details: {
      baseRawMaterial: 'Tierfell',
      purity: 'Getrocknet & gekämmt',
      abundance: 'Jagd in Wäldern und Tundren',
      specialProperties: 'Hohe Kälteisolation, wasserabweisende Deckhaare.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-raw-game-meat',
    title: 'Wildfleisch',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Tierische Rohstoffe & Jagd',
    unit: 'kg',
    pricePerUnit: 4,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Frisch zerlegtes Fleisch von Hirsch, Reh oder Wildschwein aus der Waldjagd. Magere und geschmacksintensive Grundzutat für Braten und Eintöpfe.',
    details: {
      baseRawMaterial: 'Wildfleisch',
      purity: 'Frisch zerlegt',
      abundance: 'Jagdreviere und Forste',
      specialProperties: 'Proteinreich, aromatisch, kühl lagerbar.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag', 'kochen']
    }
  },
  {
    id: 'std-raw-fresh-fish',
    title: 'Frischfisch',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Tierische Rohstoffe & Jagd',
    unit: 'kg',
    pricePerUnit: 3,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Frisch gefangener Speisefisch aus Flüssen, Seen oder Küstengewässern. Wichtige Proteinquelle für Fischerdörfer und Märkte.',
    details: {
      baseRawMaterial: 'Fisch',
      purity: 'Fangfrisch',
      abundance: 'Gewässer, Flüsse und Meere',
      specialProperties: 'Nährstoffreich, benötigt rasche Verarbeitung oder Salzung.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag', 'kochen']
    }
  },
  {
    id: 'std-raw-wool',
    title: 'Wolle',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Fasern & Textil-Rohstoffe',
    unit: 'kg',
    pricePerUnit: 3,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Geschorene Schafwolle voller natürlichem Wollfett. Wird nach dem Waschen und Kardieren zu wärmenden Garnen und Stoffen versponnen.',
    details: {
      baseRawMaterial: 'Schafwolle',
      purity: 'Ungesponnen, naturfettig',
      abundance: 'Sehr häufig auf Weidehöfen',
      specialProperties: 'Wärmeisolierend, selbstreinigend durch Lanolin, feuchtigkeitsregulierend.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-raw-cotton',
    title: 'Baumwolle',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Fasern & Textil-Rohstoffe',
    unit: 'kg',
    pricePerUnit: 3,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Weiche weiße Faserbüschel von reifen Baumwollpflanzen. Leicht zu entkernen und zu feinen, atmungsaktiven Textilfäden zu spinnen.',
    details: {
      baseRawMaterial: 'Baumwollfaser',
      purity: 'Getrocknete Samenfaser',
      abundance: 'Häufig in warmen Tälern und Plantagen',
      specialProperties: 'Atmungsaktiv, saugstark, hautschonend.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-raw-flax',
    title: 'Flachs',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Fasern & Textil-Rohstoffe',
    unit: 'kg',
    pricePerUnit: 3,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Geerntete Flachsstängel mit langen, reißfesten Bastfasern. Nach dem Riffeln und Hecheln der Ausgangsstoff für kühles Leinentuch.',
    details: {
      baseRawMaterial: 'Flachsfaser',
      purity: 'Getrocknete Bastfaser',
      abundance: 'Agrarflächen und Flussauen',
      specialProperties: 'Hohe Zugfestigkeit, antibakteriell, kühlend.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-raw-hemp',
    title: 'Hanf',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Fasern & Textil-Rohstoffe',
    unit: 'kg',
    pricePerUnit: 2,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Robuste Faserpflanze mit zähen Baststrängen. Essentieller Rohstoff für Seilereien, grobe Säcke, Takelagen und Planen.',
    details: {
      baseRawMaterial: 'Hanffaser',
      purity: 'Bastfaser',
      abundance: 'Weit verbreiteter Agraranbau',
      specialProperties: 'Extrem zug- und reißfest, verrottungsbeständig im Wasser.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-raw-wheat',
    title: 'Weizen',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Getreide & Feldfrüchte',
    unit: 'Sack (50kg)',
    pricePerUnit: 6,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Goldgelbes, gedroschenes Weizenkorn von Feldern. Hauptgrundlage für helles Mehl, Backwaren und die städtische Versorgung.',
    details: {
      baseRawMaterial: 'Weizenkorn',
      purity: 'Gereinigt & gesiebt',
      abundance: 'Großflächiger Ackerbau',
      specialProperties: 'Hoher Gluten- und Energiegehalt.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-raw-rye',
    title: 'Roggen',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Getreide & Feldfrüchte',
    unit: 'Sack (50kg)',
    pricePerUnit: 5,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Widerstandsfähiges, dunkles Getreidekorn. Gedeiht auch auf kargen Böden und liefert kräftiges Mehl für haltbares Sauerteigbrot.',
    details: {
      baseRawMaterial: 'Roggenkorn',
      purity: 'Gereinigt',
      abundance: 'Weit verbreitet auf Geest- und Bergäckern',
      specialProperties: 'Frosthart, mineralstoffreich.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-raw-barley',
    title: 'Gerste',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Getreide & Feldfrüchte',
    unit: 'Sack (50kg)',
    pricePerUnit: 5,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Nahrhaftes Ähregetreide für Brauereien, Mälzereien und Futtermittel. Wichtige Grundlage für Bier, Grütze und Breie.',
    details: {
      baseRawMaterial: 'Gerstenkorn',
      purity: 'Gereinigt',
      abundance: 'Weit verbreiteter Ackerbau',
      specialProperties: 'Ideal zur Mälzung und Fermentation.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'brauwesen']
    }
  },
  {
    id: 'std-raw-potatoes',
    title: 'Kartoffeln',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Getreide & Feldfrüchte',
    unit: 'Sack (25kg)',
    pricePerUnit: 3,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Kräftige Knollen aus dem Ackerboden. Lagerfähiges, sättigendes Grundnahrungsmittel für Suppen, Breie und Rationen.',
    details: {
      baseRawMaterial: 'Kartoffelknolle',
      purity: 'Erdgereinigt',
      abundance: 'Ackerbau und Gemüsegärten',
      specialProperties: 'Lange lagerfähig im kühlen Erdkeller.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag', 'kochen']
    }
  },
  {
    id: 'std-raw-salt',
    title: 'Speisesalz',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Kochzutaten & Gewürze',
    unit: 'kg',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Weißes, kristallines Steinsalz oder Meersalz aus Salinen. Unverzichtbare Zutat für jedes Kochgericht sowie zur Pökelung und Konservierung.',
    details: {
      baseRawMaterial: 'Natriumchlorid',
      purity: '98% Reinsalz',
      abundance: 'Salzbergwerke und Meersalinen',
      specialProperties: 'Konservierend, geschmacksverstärkend, unbegrenzt haltbar.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag', 'kochen']
    }
  },
  {
    id: 'std-raw-spring-water',
    title: 'Quellwasser',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Kochzutaten & Gewürze',
    unit: 'Eimer (10l)',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Klares, frisches Bergquellwasser aus tiefen Felsadern. Reinste Grundlage für Suppen, Sud, Bierbrauen und Teigführung.',
    details: {
      baseRawMaterial: 'Quellwasser',
      purity: 'Trinkwasserqualität',
      abundance: 'Quellen, Brunnen und Bergflüsse',
      specialProperties: 'Mineralstoffreich, keimarm.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag', 'kochen']
    }
  },
  {
    id: 'std-raw-honey',
    title: 'Bienenhonig',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Kochzutaten & Gewürze',
    unit: 'Topf (1kg)',
    pricePerUnit: 4,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Goldgelber, naturbelassener Wald- und Blütenhonig aus Imkereien. Edles Süßungsmittel für Gebäck, Met, Heilsalben und Marinaden.',
    details: {
      baseRawMaterial: 'Blütenhonig',
      purity: 'Unfiltriert & naturbelassen',
      abundance: 'Imkereien und Zeidlereien',
      specialProperties: 'Antibakteriell, unbegrenzt haltbar, energetisch.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag', 'kochen', 'alchemie']
    }
  },
  {
    id: 'std-raw-garlic-herbs',
    title: 'Knoblauch & Gewürzkräuter',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Kochzutaten & Gewürze',
    unit: 'Bündel',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Frisch geernteter Knoblauchzopf gebündelt mit Rosmarin, Thymian und Lorbeer. Verleiht Eintöpfen und Fleischgerichten kräftiges Aroma.',
    details: {
      baseRawMaterial: 'Gewürzpflanzen',
      purity: 'Frisch gebündelt',
      abundance: 'Hausgärten und Kräuterbeete',
      specialProperties: 'Geschmacksintensiv, verdauungsfördernd.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag', 'kochen']
    }
  },
  {
    id: 'std-raw-sulfur',
    title: 'Schwefel',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Minerale & Kristalle',
    unit: 'kg',
    pricePerUnit: 6,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Gelbe, stechend riechende Mineralkristalle aus vulkanischen Schlünden und Geothermalfeldern. Unentbehrlich für Alchemie und Pulvermischungen.',
    details: {
      baseRawMaterial: 'Schwefelkristall',
      purity: '90% Reinschwefel',
      abundance: 'Vulkanische Regionen und Fumarolen',
      specialProperties: 'Leicht entzündlich, reagiert stark mit Metallen und Salpeter.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['alchemie', 'wirtschaft', 'abenteuer']
    }
  },
  {
    id: 'std-raw-healing-herbs',
    title: 'Heilkräuter',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Kräuter & Alchemie',
    unit: 'Bündel',
    pricePerUnit: 4,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Sorgfältig getrocknete Mischung aus Wundklee, Schafgarbe und Königskerze. Grundstoff für Wundsalben, Umschläge und Heilsude.',
    details: {
      baseRawMaterial: 'Wildkräuter',
      purity: 'Schonend schattengetrocknet',
      abundance: 'Waldwiesen und Kräutergärten',
      specialProperties: 'Antiseptisch, blutstillend, fiebersenkend.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'abenteuer', 'alltag'],
      applicationArea: 'wirtschaft, abenteuer, alltag'
    }
  },
  {
    id: 'std-raw-mandrake',
    title: 'Alraunenwurzel',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Kräuter & Alchemie',
    unit: 'Stück',
    pricePerUnit: 15,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Menschenähnlich geformte Knollenwurzel aus mondhellen Waldgründen. Hochwirksames Reagenz für starke Tränke und Schlafessenzen.',
    details: {
      baseRawMaterial: 'Alraunenwurzel',
      purity: 'Unbeschädigte Wurzelknolle',
      abundance: 'Selten in alten Schattenwäldern',
      specialProperties: 'Starke alchemistische und betäubende Wirkkraft.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['abenteuer', 'wirtschaft'],
      applicationArea: 'abenteuer, wirtschaft'
    }
  },
  {
    id: 'std-raw-rock-crystal',
    title: 'Bergkristall',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Minerale & Kristalle',
    unit: 'Stück',
    pricePerUnit: 18,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'makellos',
    description: 'Klar gewachsener hexagonale Quarzkristall. Speichert magische Schwingungen und dient als Fokus für Stäbe, Amulette und arkanes Handwerk.',
    details: {
      baseRawMaterial: 'Bergkristall',
      purity: 'Lupenrein',
      abundance: 'Geoden in tiefen Höhlen und Klüften',
      specialProperties: 'Piezoelektrisch, absorbiert und bündelt astrale Energie.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['abenteuer', 'wirtschaft'],
      applicationArea: 'abenteuer, wirtschaft'
    }
  },
  {
    id: 'std-raw-mithril-ore',
    title: 'Mithrilerz',
    builderType: 'Rohstoff',
    mainCategory: 'Rohstoffe',
    subCategory: 'Metallerze',
    unit: 'kg',
    pricePerUnit: 70,
    materialQuality: 'Perfekt / Makellos',
    rarity: 'Episch / Meisterlich',
    isUnique: false,
    condition: 'makellos',
    description: 'Silbrig-blau pulsierendes Erz aus den tiefsten Bergadern. Äußerst widerstandsfähig gegen Druck und magisch hochgradig leitfähig.',
    details: {
      baseRawMaterial: 'Mithrilerz',
      purity: 'Hochreines Arkangestein',
      abundance: 'Äußerst selten in Urgesteinsschichten',
      specialProperties: 'Federleicht nach Verhüttung, unzerstörbar gegen Rost.',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['abenteuer', 'wirtschaft'],
      applicationArea: 'abenteuer, wirtschaft'
    }
  },

  // =========================================================================
  // 2. MATERIALIEN & ZWISCHENPRODUKTE (Barren, Leder, Stoffe, Bretter, Seile)
  // =========================================================================
  {
    id: 'std-mat-iron-ingot',
    title: 'Eisenbarren',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Barren & Metallhalbzeuge',
    unit: 'Barren',
    pricePerUnit: 12,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Rechteckig gegossener Barren aus gereinigtem Schmiedeeisen. Standardrohstoff für jede Dorf- und Waffenschmiede.',
    details: {
      fabricType: 'Schmiedeeisen',
      refinementGrade: 'Entschlackt & Gegossen',
      durability: 'Sehr zäh, verformbar im Glühzustand',
      requiredBaseMaterial: 'Eisenerz, Steinkohle',
      producingHoldingType: 'Schmiede / Schmelzhütte',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-mat-steel-ingot',
    title: 'Stahlbarren',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Barren & Metallhalbzeuge',
    unit: 'Barren',
    pricePerUnit: 24,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Hochwertiger Kohlenstoffstahl. Ideal für scharfe Klingen, Rüstungsplatten, Werkzeugbahnen und Präzisionsbauteile.',
    details: {
      fabricType: 'Kohlenstoffstahl',
      refinementGrade: 'Mehrfach gefaltet und gehärtet',
      durability: 'Sehr hohe Bruchfestigkeit und Schnitthaltigkeit',
      requiredBaseMaterial: 'Eisenbarren, Holzkohle',
      producingHoldingType: 'Stahlschmiede / Manufaktur',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'abenteuer'],
      applicationArea: 'wirtschaft, abenteuer'
    }
  },
  {
    id: 'std-mat-bronze-ingot',
    title: 'Bronzebarren',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Barren & Metallhalbzeuge',
    unit: 'Barren',
    pricePerUnit: 18,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Goldbraun glänzende Legierung aus Kupfer und Zinn. Hervorragend gießbar für Glocken, Beschläge, Schilde, Schnallen und Statuen.',
    details: {
      fabricType: 'Bronze (Kupfer-Zinn-Legierung)',
      refinementGrade: 'Homogen legiert',
      durability: 'Korrosionsfest, formstabil',
      requiredBaseMaterial: 'Kupfererz, Zinnerz',
      producingHoldingType: 'Erzschmelze / Gießerei',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-mat-copper-ingot',
    title: 'Kupferbarren',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Barren & Metallhalbzeuge',
    unit: 'Barren',
    pricePerUnit: 14,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Gegossener Reinkupferbarren. Geschätzt für Kesselbau, Leitbleche, Dacheindeckungen und Münzprägungen.',
    details: {
      fabricType: 'Reinkupfer',
      refinementGrade: 'Geraffiniert',
      durability: 'Weich, hämmerbar, hohe Wärmeleitung',
      requiredBaseMaterial: 'Kupfererz',
      producingHoldingType: 'Kupferschmelze',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-mat-gold-ingot',
    title: 'Goldbarren',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Barren & Metallhalbzeuge',
    unit: 'Barren',
    pricePerUnit: 150,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'makellos',
    description: 'Gegossener Feingoldbarren mit Siegelprägung. Hohe Währungseinheit in Schatzkammern, Bankhäusern und im Fernhandel.',
    details: {
      fabricType: 'Feingold',
      refinementGrade: '99% Feingehalt',
      durability: 'Anlauffrei, unvergänglich',
      requiredBaseMaterial: 'Golderz',
      producingHoldingType: 'Goldschmiede / Münzanstalt',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-mat-silver-ingot',
    title: 'Silberbarren',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Barren & Metallhalbzeuge',
    unit: 'Barren',
    pricePerUnit: 50,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'makellos',
    description: 'Gegossener Feinsilberbarren mit hellem Metallglanz. Grundmaterial für Tafelsilber, Schmuck und Silbertaler.',
    details: {
      fabricType: 'Feinsilber',
      refinementGrade: '95% Feingehalt',
      durability: 'Oxidiert oberflächlich, gut polierbar',
      requiredBaseMaterial: 'Silbererz',
      producingHoldingType: 'Silberschmiede / Münzanstalt',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-mat-leather',
    title: 'Leder',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Leder, Pergament & Felle',
    unit: 'Haut',
    pricePerUnit: 14,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Gepflegt mit Eichenlohe gegerbtes, geschmeidiges Leder. Unverzichtbar für Stiefel, Rüstungen, Zaumzeug und Scheiden.',
    details: {
      fabricType: 'Pflanzlich gegerbtes Rindsleder',
      refinementGrade: 'Gegerbt & Gefettet',
      durability: 'Zäh, wasserabweisend, langlebig',
      requiredBaseMaterial: 'Tierhaut',
      producingHoldingType: 'Gerberei',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-mat-leather-strips',
    title: 'Lederstreifen',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Leder, Pergament & Felle',
    unit: 'Bündel',
    pricePerUnit: 6,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Gleichmäßig zugeschnittene, geölte Lederriemen. Essenziell für Griffwicklungen, Rüstungsschnallen, Riemen und Zaumzeug.',
    details: {
      fabricType: 'Rindslederstreifen',
      refinementGrade: 'Zugeschnitten & Entgratet',
      durability: 'Reißfest, flexibel',
      requiredBaseMaterial: 'Leder',
      producingHoldingType: 'Sattlerei / Lederwerkstatt',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-mat-linen-cloth',
    title: 'Leinenstoff',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Stoffe, Garne & Seile',
    unit: 'Ballen',
    pricePerUnit: 10,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Dicht gewebtes Tuch aus Flachsfasern. Kühlend, reißfest und ideal für Hemden, Tuniken, Segel, Säcke und Verbände.',
    details: {
      fabricType: 'Leinengewebe',
      refinementGrade: 'Gebleicht & Gewebt',
      durability: 'Reißfest, waschbar',
      requiredBaseMaterial: 'Flachs',
      producingHoldingType: 'Weberei',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-mat-wool-cloth',
    title: 'Wollstoff',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Stoffe, Garne & Seile',
    unit: 'Ballen',
    pricePerUnit: 12,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Dicht gewalkter Stoff aus Schafwolle. Hervorragender Kälteschutz für Mäntel, Umhänge, Decken und Winterkleidung.',
    details: {
      fabricType: 'Loden / Wollgewebe',
      refinementGrade: 'Gewalkt & Gefärbt',
      durability: 'Wasserabweisend, wärmend',
      requiredBaseMaterial: 'Wolle',
      producingHoldingType: 'Walkmühle / Weberei',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-mat-boards',
    title: 'Bretter',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Bretter & Bauholz',
    unit: 'Stück',
    pricePerUnit: 4,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Sauber gesägte und gehobelte Bauholzbretter. Dienen für Hausbau, Möbel, Wagenkästen, Schiffsbeplankung und Transportkisten.',
    details: {
      fabricType: 'Massivholzbrett',
      refinementGrade: 'Getrocknet & Abgerichtet',
      durability: 'Formstabil, nagelbar',
      requiredBaseMaterial: 'Eichenholz / Kiefernholz',
      producingHoldingType: 'Sägewerk',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-mat-rope',
    title: 'Hanfseil',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Stoffe, Garne & Seile',
    unit: 'Stück (15m)',
    pricePerUnit: 6,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Dreisträngig geschlagenes Hanfseil mit hoher Tragkraft. Unverzichtbar für Abenteurer, Fuhrwerke, Lastzüge und Takelagen.',
    details: {
      fabricType: 'Geschlagene Hanffaser',
      refinementGrade: 'Reepschlägerarbeit',
      durability: 'Traglast bis 350 kg',
      requiredBaseMaterial: 'Hanf',
      producingHoldingType: 'Seilerei',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'wirtschaft', 'alltag'],
      applicationArea: 'abenteuer, wirtschaft, alltag'
    }
  },
  {
    id: 'std-mat-glass',
    title: 'Glas',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Glas, Keramik & Ton',
    unit: 'Stück',
    pricePerUnit: 5,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Klares Scheibenglas oder Rohglaskörper aus der Glashütte. Verwendung für Fenster, Butzenscheiben, Laternen und Spiegel.',
    details: {
      fabricType: 'Kalk-Natron-Glas',
      refinementGrade: 'Geschmolzen & Geglättet',
      durability: 'Lichtdurchlässig, bruchempfindlich',
      requiredBaseMaterial: 'Quarzsand, Kalkstein',
      producingHoldingType: 'Glashütte',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-mat-glass-vial',
    title: 'Glasfläschchen',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Glas, Keramik & Ton',
    unit: 'Stück',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Mundgeblasene Glasphiole mit passendem Korken. Bereit zur Aufnahme von Heiltränken, Giften, Ölen oder alchemistischen Essenzen.',
    details: {
      fabricType: 'Hohlglas',
      refinementGrade: 'Mundgeblasen mit Korkverschluss',
      durability: 'Dicht, säurefest',
      requiredBaseMaterial: 'Glas',
      producingHoldingType: 'Glashütte',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'abenteuer'],
      applicationArea: 'wirtschaft, abenteuer'
    }
  },
  {
    id: 'std-mat-paper',
    title: 'Papier',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Papier, Tinte & Schreibstoffe',
    unit: 'Bogen',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Geglättetes Büttenpapier aus geschöpften Hadernfasern. Ideal für Briefe, Buchführung, Skizzen und Rechnungen.',
    details: {
      fabricType: 'Hadernpapier',
      refinementGrade: 'Geschöpft & Geleimt',
      durability: 'Tintentauglich, saugfest',
      requiredBaseMaterial: 'Lumpen / Pflanzenfaser',
      producingHoldingType: 'Papiermühle',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-mat-parchment',
    title: 'Pergament',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Papier, Tinte & Schreibstoffe',
    unit: 'Bogen',
    pricePerUnit: 5,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'makellos',
    description: 'Fein geschabtes, getrocknetes Kalbs- oder Ziegenpergament. Äußerst dauerhaft, ideal für Urkunden, Zauberschriftrollen und Folianten.',
    details: {
      fabricType: 'Tierpergament',
      refinementGrade: 'Geschabt, gekreidet & geglättet',
      durability: 'Jahrhunderte haltbar',
      requiredBaseMaterial: 'Tierhaut',
      producingHoldingType: 'Pergamenter / Skriptorium',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'wirtschaft'],
      applicationArea: 'abenteuer, wirtschaft'
    }
  },
  {
    id: 'std-mat-wheat-flour',
    title: 'Weizenmehl',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Verarbeitete Materialien',
    unit: 'Sack (25kg)',
    pricePerUnit: 5,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Fein ausgemahlenes Weizenmehl aus der Mühle. Unverzichtbare Zutat für weiße Brötchen, Kuchen, Teige und Mehlspeisen.',
    details: {
      fabricType: 'Weizenfeinmehl',
      refinementGrade: 'Fein gesiebt',
      durability: 'Trocken 9 Monate lagerfähig',
      requiredBaseMaterial: 'Weizen',
      producingHoldingType: 'Mühle',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-mat-rye-flour',
    title: 'Roggenmehl',
    builderType: 'Material',
    mainCategory: 'Materialien & Zwischenprodukte',
    subCategory: 'Verarbeitete Materialien',
    unit: 'Sack (25kg)',
    pricePerUnit: 4,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Kräftiges Vollkorn-Roggenmehl aus gemahlenem Roggen. Die Basis für nahrhaftes Bauernbrot und saftige Sauerteiglaibe.',
    details: {
      fabricType: 'Roggenmehl',
      refinementGrade: 'Mittelgrob gemahlen',
      durability: 'Trocken 12 Monate lagerfähig',
      requiredBaseMaterial: 'Roggen',
      producingHoldingType: 'Mühle',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },

  // =========================================================================
  // 3. WERKZEUGE (Schmiedehammer, Spitzhacke, Holzfälleraxt, Dietrich, Alchemieset)
  // =========================================================================
  {
    id: 'std-tool-smith-hammer',
    title: 'Schmiedehammer',
    builderType: 'Werkzeug',
    mainCategory: 'Werkzeuge',
    subCategory: 'Metall- & Schmiedewerkzeuge',
    unit: 'Stück',
    pricePerUnit: 22,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Ausbalancierter 1,5-kg-Hammer mit gehärteter Stahlbahn und Eschenholzstiel für präzise Schläge am Amboss.',
    details: {
      craftProfession: 'Schmiedekunst',
      efficiencyBonus: '+2 auf Schmiedearbeiten und Metallverformung',
      durability: 'Sehr langlebig, gehärteter Stahlkopf',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-tool-pickaxe',
    title: 'Spitzhacke',
    builderType: 'Werkzeug',
    mainCategory: 'Werkzeuge',
    subCategory: 'Bergbau- & Steinmetzwerkzeuge',
    unit: 'Stück',
    pricePerUnit: 18,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Doppelspitzhacke aus geschmiedetem Eisen zum Aufbrechen von Gesteinsadern, Erzstollen und Baugruben.',
    details: {
      craftProfession: 'Bergbau / Steinmetz',
      efficiencyBonus: '+25% Abbaugeschwindigkeit bei Stein und Erz',
      durability: 'Gehärtete Spitzen',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'abenteuer'],
      applicationArea: 'wirtschaft, abenteuer'
    }
  },
  {
    id: 'std-tool-wood-axe',
    title: 'Holzfälleraxt',
    builderType: 'Werkzeug',
    mainCategory: 'Werkzeuge',
    subCategory: 'Holz- & Forstwerkzeuge',
    unit: 'Stück',
    pricePerUnit: 16,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Scharf geschliffene Axt mit langem Schwungstiel zum Fällen von Bäumen, Entasten und Spalten von Bauholz.',
    details: {
      craftProfession: 'Holzfällerei / Schreinerei',
      efficiencyBonus: 'Effizienter Holzeinschlag und Bauholzgewinnung',
      durability: 'Gehärtete Klinge mit langer Schnitthaltigkeit',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-tool-lockpicks',
    title: 'Dietrich-Set',
    builderType: 'Werkzeug',
    mainCategory: 'Werkzeuge',
    subCategory: 'Feinmechanik & Gravurwerkzeuge',
    unit: 'Set',
    pricePerUnit: 35,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'gut',
    description: 'Lederetui mit feinen Federstahlhaken, Spannern und Nadeln zum Öffnen mechanischer Schlösser und Truhen.',
    details: {
      craftProfession: 'Schlosserei / Diebeskunst',
      efficiencyBonus: 'Ermöglicht das Knacken von Vorhängeschlössern und Truhen',
      durability: 'Feinstahlstäbe',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer'],
      applicationArea: 'abenteuer'
    }
  },
  {
    id: 'std-tool-alchemy-kit',
    title: 'Alchemieset',
    builderType: 'Werkzeug',
    mainCategory: 'Werkzeuge',
    subCategory: 'Alchemie-, Labor- & Brauwerkzeuge',
    unit: 'Set',
    pricePerUnit: 45,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Kompaktes Reise-Labor mit Achatmörser, Glaskolben, Brennersockel und Phiolenhalter zur Trankzubereitung.',
    details: {
      craftProfession: 'Alchemie / Kräuterkunde',
      efficiencyBonus: 'Ermöglicht Tränkebrauen im Feld und Labor',
      durability: 'Glaskolben & Messinghalter',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'wirtschaft'],
      applicationArea: 'abenteuer, wirtschaft'
    }
  },

  // =========================================================================
  // 4. WAFFEN (Schwert, Dolch, Bogen, Speer)
  // =========================================================================
  {
    id: 'std-wpn-longsword',
    title: 'Langschwert',
    builderType: 'Waffe',
    mainCategory: 'Waffen',
    subCategory: 'Schwerter',
    unit: 'Stück',
    pricePerUnit: 40,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Zweischneidiges Langschwert aus geschmiedetem Federstahl mit Parierstange und lederumwickeltem Griff.',
    details: {
      weaponType: 'Langschwert',
      damageType: 'Hieb, Stich',
      damageValue: '1W8+2 / 1W10+2 (zweihändig)',
      rangeCategory: 'Nahkampf (1.2m)',
      effects: 'Ausgewogene Balance, Paradebonus +1, Manöver: Entwaffnen',
      requiredWeaponMasteryName: 'Schwerter',
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },
  {
    id: 'std-wpn-dagger',
    title: 'Eisendolch',
    builderType: 'Waffe',
    mainCategory: 'Waffen',
    subCategory: 'Dolche & Messer',
    unit: 'Stück',
    pricePerUnit: 12,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Handlicher Dolch mit zweischneidiger Klinge und Lederscheide. Leicht am Gürtel zu verbergen.',
    details: {
      weaponType: 'Dolch',
      damageType: 'Stich, Schnitt',
      damageValue: '1W4+1',
      rangeCategory: 'Nahkampf / Wurf (bis 6m)',
      effects: 'Heimlicher Angriff +2 Schaden, verbergbar am Gürtel',
      requiredWeaponMasteryName: 'Dolche',
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer', 'alltag'],
      applicationArea: 'kampf, abenteuer, alltag'
    }
  },
  {
    id: 'std-wpn-bow',
    title: 'Kurzbogen',
    builderType: 'Waffe',
    mainCategory: 'Waffen',
    subCategory: 'Bögen & Schleudern',
    unit: 'Stück',
    pricePerUnit: 30,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Biegsamer Bogen aus abgelagertem Eibenholz mit Sehne. Handlich im dichten Gehölz und vom Sattel aus.',
    details: {
      weaponType: 'Kurzbogen',
      damageType: 'Stich / Fernkampf',
      damageValue: '1W6+1',
      rangeCategory: 'Fernkampf (bis 45m)',
      effects: 'Schnelles Nachladen, beritten nutzbar',
      requiredWeaponMasteryName: 'Bögen',
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },
  {
    id: 'std-wpn-spear',
    title: 'Jagdspeer',
    builderType: 'Waffe',
    mainCategory: 'Waffen',
    subCategory: 'Stangenwaffen & Speere',
    unit: 'Stück',
    pricePerUnit: 18,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Eschenholzschaft mit gehärteter Blattspitze und Knebel. Hält heranstürmende Raubtiere und Reiter auf Abstand.',
    details: {
      weaponType: 'Speer',
      damageType: 'Stich',
      damageValue: '1W8+1',
      rangeCategory: 'Reichweite (2.5m) / Wurf (15m)',
      effects: 'Reichweitenvorteil gegen Stürmende Gegner',
      requiredWeaponMasteryName: 'Stangenwaffen',
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },

  // =========================================================================
  // 5. RÜSTUNG & SCHUTZAUSRÜSTUNG (Lederharnisch, Kettenhemd, Rundschild)
  // =========================================================================
  {
    id: 'std-arm-leather',
    title: 'Lederharnisch',
    builderType: 'Rüstung',
    mainCategory: 'Rüstung & Schutzausrüstung',
    subCategory: 'Leichte Rüstung',
    unit: 'Stück',
    pricePerUnit: 35,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Gehärtetes Rindsleder mit Nieten und weichem Innenfutter. Bietet Schutz vor Schnitten ohne Beweglichkeitseinschränkung.',
    details: {
      armorSlot: 'Brust / Oberkörper',
      clothingSlot: 'Leichte Rüstung',
      armorValue: 'RK +3 (Schadensabsorption: 15%)',
      movementRestriction: 'Keine Behinderung',
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },
  {
    id: 'std-arm-chainmail',
    title: 'Kettenhemd',
    builderType: 'Rüstung',
    mainCategory: 'Rüstung & Schutzausrüstung',
    subCategory: 'Mittlere Rüstung',
    unit: 'Stück',
    pricePerUnit: 75,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Vernietetes Geflecht aus Tausenden Stahlringen über einem gepolsterten Wams. Exzellenter Schutz gegen Hiebe und Pfeile.',
    details: {
      armorSlot: 'Körper / Torso',
      clothingSlot: 'Mittlere Rüstung',
      armorValue: 'RK +5 (Schadensabsorption: 30%)',
      movementRestriction: 'Leichte Geräuschentwicklung',
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },
  {
    id: 'std-arm-shield',
    title: 'Rundschild',
    builderType: 'Rüstung',
    mainCategory: 'Rüstung & Schutzausrüstung',
    subCategory: 'Schilde',
    unit: 'Stück',
    pricePerUnit: 20,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Stabiler Schild aus verleimten Eichenplanken mit lederner Bespannung und gehärtetem Eisenbuckel im Zentrum.',
    details: {
      armorSlot: 'Schild / Nebenhand',
      clothingSlot: 'Schild',
      armorValue: 'RK +2 auf Blocken / Geschossabwehr',
      movementRestriction: 'Erfordert freie Nebenhand',
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },

  // =========================================================================
  // 6. KLEIDUNG & TEXTILIEN (Berufs-Outfits, Komplett-Sets, Alltags- & Schutzkleidung)
  // =========================================================================
  {
    id: 'std-cloth-smith-set',
    title: 'Schmiedekluft-Komplettset',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Berufs-Outfits & Zunft-Sets',
    unit: 'Set',
    pricePerUnit: 35,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Vollständige Arbeitsmontur des Schmiedehandwerks. Bietet verlässlichen Schutz vor Funkenflug, heißen Schlacken und glühendem Eisen.',
    details: {
      clothingSlot: 'Komplett-Set / Outfit',
      setPieces: 'Schwere Rindslederschürze, gefütterte Hitzeschutz-Stulpenhandschuhe, feste Arbeitsstiefel, Handgelenksmanschetten',
      professionMatch: 'Schmied / Waffenschmied / Rüstungsschmied',
      fabricType: 'Schweres Rindsleder & gewachster Drillich',
      weatherProtection: 'Hitzeschutz, Funkenflug-resistent',
      socialStatus: 'Handwerkerkluft / Schmiedezunft',
      originSourceType: 'normal_produziert',
      useDomains: ['handwerk', 'wirtschaft', 'alltag'],
      applicationArea: 'handwerk, wirtschaft'
    }
  },
  {
    id: 'std-cloth-alchemist-set',
    title: 'Alchemisten-Arbeitsset',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Berufs-Outfits & Zunft-Sets',
    unit: 'Set',
    pricePerUnit: 48,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Dicht gewebte Robe mit Phiolenhalterungen, gummierter Schutzschürze, dicht schließender Messing-Schutzbrille und feinen Lederstulpen.',
    details: {
      clothingSlot: 'Komplett-Set / Outfit',
      setPieces: 'Gelehrtenkutte mit Reagenzhaltern, säurefeste Schürze, gefütterte Lederhandschuhe, Messing-Schutzbrille mit Kristallglas',
      professionMatch: 'Alchemist / Apotheker / Kräuterkundiger',
      fabricType: 'Gewachste Wolle, gummierte Leinwand, Messingbeschläge',
      weatherProtection: 'Säure- & Spritzschutz, Dämpfefilterung',
      socialStatus: 'Gelehrter / Zunftmeister',
      originSourceType: 'normal_produziert',
      useDomains: ['handwerk', 'abenteuer', 'wirtschaft'],
      applicationArea: 'handwerk, abenteuer'
    }
  },
  {
    id: 'std-cloth-miner-set',
    title: 'Bergmanns-Kluftset',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Berufs-Outfits & Zunft-Sets',
    unit: 'Set',
    pricePerUnit: 30,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Robuste Montur für Bergarbeiter und Steinbrecher. Schützt vor herabfallendem Geröll, Nässe im Stollen und scharfen Felskanten.',
    details: {
      clothingSlot: 'Komplett-Set / Outfit',
      setPieces: 'Grubenkittel mit verstärkten Schultern, feste Lederkappe mit Lampenöse, genagelte Schachtstiefel, Knie- und Ellbogenschoner',
      professionMatch: 'Bergarbeiter / Schürfer / Steinmetz',
      fabricType: 'Zwillich, gehärtetes Rindsleder, Eisenbeschläge',
      weatherProtection: 'Feuchtigkeits- & Stoßschutz',
      socialStatus: 'Bergarbeiter / Knappschaft',
      originSourceType: 'normal_produziert',
      useDomains: ['handwerk', 'wirtschaft'],
      applicationArea: 'handwerk, wirtschaft'
    }
  },
  {
    id: 'std-cloth-ranger-set',
    title: 'Waldläufer-Pirschset',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Berufs-Outfits & Zunft-Sets',
    unit: 'Set',
    pricePerUnit: 42,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Lautloses Gewand aus wetterfestem Loden und weichem Wildleder. Perfekt für lautlose Pirsch im dichten Unterholz und rauem Wetter.',
    details: {
      clothingSlot: 'Komplett-Set / Outfit',
      setPieces: 'Dornenfester Lodenwams in Waldtarnung, tiefe Schnürkapuze, weiche Wildlederstiefel, geräuscharme Hirschlederhose, fingerlose Bogenhandschuhe',
      professionMatch: 'Jäger / Waldläufer / Kundschafter',
      fabricType: 'Gewachster Loden, weiches Hirschleder, Pelzbesatz',
      weatherProtection: 'Wasserabweisend, winddicht, dornenfest, lautlose Bewegung',
      socialStatus: 'Waldhüter / Kundschafter',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'handwerk', 'kampf'],
      applicationArea: 'abenteuer, handwerk'
    }
  },
  {
    id: 'std-cloth-carpenter-set',
    title: 'Zimmermanns-Zunftkluft',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Berufs-Outfits & Zunft-Sets',
    unit: 'Set',
    pricePerUnit: 32,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Traditionelle Kluft der Wandergesellen und Holzhandwerker mit charakteristischer Weste, weiter Schlaghose und Werkzeugösen.',
    details: {
      clothingSlot: 'Komplett-Set / Outfit',
      setPieces: 'Doppelreißer-Weste mit Perlmuttknöpfen und Nageltaschen, Zunfthose mit Schlag, weißes Kragenhemd, breiter Koppelledergürtel, Schnürstiefel',
      professionMatch: 'Zimmermann / Schreiner / Holzhandwerker',
      fabricType: 'Zwirn-Doppelpilot, Trenkercord, Leinen',
      weatherProtection: 'Abrieb- und Spanfest, Windschutz',
      socialStatus: 'Zunftgeselle / Handwerksmeister',
      originSourceType: 'normal_produziert',
      useDomains: ['handwerk', 'wirtschaft'],
      applicationArea: 'handwerk, wirtschaft'
    }
  },
  {
    id: 'std-cloth-healer-set',
    title: 'Feldscher- & Heilerkluft',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Berufs-Outfits & Zunft-Sets',
    unit: 'Set',
    pricePerUnit: 40,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Saubere, helle Wundarztmontur mit gewachster Schürze, Verbandsschlingen und einem geräumigen Kräuter- und Salbengürtel.',
    details: {
      clothingSlot: 'Komplett-Set / Outfit',
      setPieces: 'Helle Wundarztkutte mit Verbandsschlingen, wasserdichte Schürze, Kräuter- und Salbengürtel, feine Lederhandschuhe, Schnallenschuhe',
      professionMatch: 'Heiler / Wundarzt / Feldscher',
      fabricType: 'Gekochte Baumwolle, gewachstes Leinen, Ziegenleder',
      weatherProtection: 'Flüssigkeits- & Schmutzabweisend, hygienisch auswaschbar',
      socialStatus: 'Wundarzt / Heiler',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'handwerk', 'alltag'],
      applicationArea: 'abenteuer, handwerk'
    }
  },
  {
    id: 'std-cloth-merchant-set',
    title: 'Kaufmanns-Reiseornat',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Outfits & Komplette Sets',
    unit: 'Set',
    pricePerUnit: 65,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'makellos',
    description: 'Edles, pelzbesetztes Reiseoutfit für wohlhabende Handelsherren. Strahlt Wohlstand aus und trotzt ungemütlichem Reisewetter auf Handelsstraßen.',
    details: {
      clothingSlot: 'Komplett-Set / Outfit',
      setPieces: 'Pelzverbrämter Reisemantel aus schwerem Wolltuch, besticktes Samtwams, Feintuch-Beinkleid, sicherer Geldkatzen-Gürtel, gefütterte Kalbslederstiefel, Samtbarett',
      professionMatch: 'Händler / Kaufmann / Gildenrat',
      fabricType: 'Feines Wolltuch, Samt, Fuchspelz, Kalbsleder',
      weatherProtection: 'Exzellenter Kälte- und Windschutz',
      socialStatus: 'Patrizier / Großkaufmann / Gildenmeister',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-cloth-traveler-set',
    title: 'Abenteurer-Reiseset',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Outfits & Komplette Sets',
    unit: 'Set',
    pricePerUnit: 28,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Strapazierfähiges Reise- und Marschoutfit für Wege und Wildnis. Widersteht Gestrüpp, Regen und kalten Nächten am Lagerfeuer.',
    details: {
      clothingSlot: 'Komplett-Set / Outfit',
      setPieces: 'Wollener Kapuzenumhang mit Bronzefibel, robuste Kniebundhose, Leinenhemd, hohe Marschstiefel, Lederarmschützer, breiter Gürtel mit Gerätetaschen',
      professionMatch: 'Abenteurer / Söldner / Reisender',
      fabricType: 'Dichte Wolle, strapazierfähiges Leinen, gefettetes Leder',
      weatherProtection: 'Regendicht, windabweisend, allwettertauglich',
      socialStatus: 'Reisender / Abenteurer',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },
  {
    id: 'std-cloth-common-outfit',
    title: 'Bürgerliches Alltagsgewand',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Alltagskleidung',
    unit: 'Garnitur',
    pricePerUnit: 14,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Bequeme und zweckmäßige Alltagskleidung aus gewebtem Leinen und Wolle für das tägliche Leben in Stadt und Siedlung.',
    details: {
      clothingSlot: 'Garnitur (Tunika & Hose)',
      fabricType: 'Leinen und Wolle',
      weatherProtection: 'Leichter Wind- und Kälteschutz',
      socialStatus: 'Bürger / Stadtbewohner',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag'],
      applicationArea: 'alltag'
    }
  },
  {
    id: 'std-cloth-wool-cloak',
    title: 'Wetterfester Wollmantel mit Kapuze',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Mäntel & Wetterkleidung',
    unit: 'Stück',
    pricePerUnit: 22,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Dicker, lanolinreicher Lodenmantel mit geräumiger Kapuze. Hält auch bei starkem Regen und Schneefall stundenlang trocken und warm.',
    details: {
      clothingSlot: 'Mantel / Umhang',
      fabricType: 'Lodenwolle',
      weatherProtection: 'Wasserabweisend, winddicht, hoher Kälteschutz',
      socialStatus: 'Allgemein',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },
  {
    id: 'std-cloth-leather-boots',
    title: 'Feste Lederstiefel',
    builderType: 'Kleidung',
    mainCategory: 'Kleidung & Textilien',
    subCategory: 'Schuhe & Stiefel',
    unit: 'Paar',
    pricePerUnit: 16,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Kniehohe Schnürstiefel aus gefettetem Rindsleder mit robuster Sohle. Ideal für lange Märsche über unwegsames Gelände.',
    details: {
      clothingSlot: 'Schuhe & Stiefel',
      fabricType: 'Gefettetes Rindsleder mit verstärkter Holz- und Ledersohle',
      weatherProtection: 'Wasserabweisend, Trittsicher',
      socialStatus: 'Allgemein',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },

  // =========================================================================
  // 7. NAHRUNG & PROVIANT (Wegration, Roggenbrot, Heiltrank)
  // =========================================================================
  {
    id: 'std-food-ration',
    title: 'Wegration',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Konserven & Dauerproviant',
    unit: 'Tagesration',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Dörrfleisch, Hartkäse, Zwieback und Nüsse im Wachspapier. Hält auf wochenlangen Märschen sättigend und nahrhaft.',
    details: {
      nutritionValue: '100% Tagesenergie (2200 kcal)',
      spoilTime: '3 Monate haltbar',
      tasteNote: 'Kräftig, salzig, nahrhaft',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },
  {
    id: 'std-food-bread',
    title: 'Roggenbrot',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Brot & Backwaren',
    unit: 'Laib',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Frisch im Steinofen gebackenes Roggen-Sauerteigbrot mit knuspriger Kruste und saftiger Krume.',
    details: {
      nutritionValue: 'Reich an Ballaststoffen und Kohlenhydraten',
      spoilTime: '5-7 Tage genießbar',
      tasteNote: 'Herzhaft, säuerlich-aromatisch',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-potion-heal',
    title: 'Heiltrank',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Konserven & Dauerproviant',
    unit: 'Fläschchen',
    pricePerUnit: 25,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Rötlich leuchtender Auszug aus Alraune, Wundklee und Quellwasser. Schließt leichte Wunden und stillt Blutungen rasch.',
    details: {
      nutritionValue: 'Regeneriert 2W6+3 Lebenspunkte',
      spoilTime: 'Unbegrenzt im versiegelten Glas',
      tasteNote: 'Süßlich nach Waldbeeren und Minze',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'kampf'],
      applicationArea: 'abenteuer, kampf'
    }
  },
  {
    id: 'std-food-beer-dunkel',
    title: 'Dunkles Bauernbier',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Krug',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Trübes, dunkles Bier aus Gerstenmalz. Sättigend, herzhaft und beliebt in jeder Schänke.',
    details: {
      nutritionValue: 'Nahrhaft, 100 kcal',
      spoilTime: '2-3 Tage haltbar',
      tasteNote: 'Malzig, herb',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-beer-hell',
    title: 'Helles Lagerbier',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Krug',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Süffiges, golden leuchtendes Bier mit feinporiger Schaumkrone. Erfrischend und leicht hopfig.',
    details: {
      nutritionValue: 'Erfrischend, 90 kcal',
      spoilTime: '3-5 Tage haltbar',
      tasteNote: 'Frisch, leicht hopfig',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-starkbier',
    title: 'Zwergen-Starkbier',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Steinzeugkrug',
    pricePerUnit: 3,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'frisch',
    description: 'Pechschwarzes, hochprozentiges Starkbier nach traditionellem Zwergenrezept. Wärmt Magen und Gemüt.',
    details: {
      nutritionValue: 'Sättigend & Wärmend',
      spoilTime: '2 Wochen haltbar',
      tasteNote: 'Röstmalzig, intensiv, süßlich',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'abenteuer'],
      applicationArea: 'alltag, abenteuer'
    }
  },
  {
    id: 'std-food-wine-red',
    title: 'Roter Landwein',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Flasche',
    pricePerUnit: 3,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Ein kräftiger, rubinroter Landwein aus sonnigen Hängen. Passt zu Fleischgerichten und festlichen Anlässen.',
    details: {
      nutritionValue: 'Leicht stärkend',
      spoilTime: '1 Monat haltbar',
      tasteNote: 'Trocken, fruchtig',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-wine-white',
    title: 'Edler Riesling (Weißwein)',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Flasche',
    pricePerUnit: 5,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'frisch',
    description: 'Feinfruchtiger Weißwein mit eleganter Säure. Sehr beliebt bei Händlern, Adligen und gehobenen Schänken.',
    details: {
      nutritionValue: 'Erfrischend & Belebend',
      spoilTime: '6 Monate haltbar',
      tasteNote: 'Spritzig, pfirsichnote',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-hypocras',
    title: 'Gewürzwein (Hypocras)',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Karaffe',
    pricePerUnit: 6,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Selten / Importiert',
    isUnique: false,
    condition: 'frisch',
    description: 'Gesüßter Rotwein mit Zimt, Nelken, Ingwer und Honig. Wird warm serviert und gilt als erlesenes Wermutgetränk.',
    details: {
      nutritionValue: 'Belebend & Magenschonend',
      spoilTime: '2 Monate haltbar',
      tasteNote: 'Würzig, süß, warm',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-mead',
    title: 'Nordischer Honigmet',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Krug',
    pricePerUnit: 2,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Goldener Honigwein, vergoren aus edlem Blütenhonig. Kraftvoll und wohlschmeckend.',
    details: {
      nutritionValue: 'Stärkend & Energetisch',
      spoilTime: '6 Monate haltbar',
      tasteNote: 'Süß, blumig, süffig',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-cider',
    title: 'Apfelmost (Cider)',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Krug',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Vergorener Fruchtmost aus Saftäpfeln. Erfrischend säuerlich und ein ideales Getränk für die Feldarbeit.',
    details: {
      nutritionValue: 'Durstlöschend, Vitamine',
      spoilTime: '1-2 Wochen haltbar',
      tasteNote: 'Fruchtig-sauer',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-schnaps',
    title: 'Kornbrand & Schnaps',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Fläschchen',
    pricePerUnit: 4,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Hochprozentiger Destillatbrand aus Getreidemaische. Brennt im Hals und betäubt leichten Schmerz.',
    details: {
      nutritionValue: 'Stark alkoholisch',
      spoilTime: 'Jahre haltbar',
      tasteNote: 'Scharf, brennend',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'abenteuer'],
      applicationArea: 'alltag, abenteuer'
    }
  },
  {
    id: 'std-food-water-pouch',
    title: 'Frisches Quellwasser (Leder-Schlauch)',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Wasserschlauch',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Klares, kühlendes Bergquellwasser in einem wasserdicht gefetteten Lederschlauch. Überlebensnotwendig auf Reisen.',
    details: {
      nutritionValue: 'Vitalisierender Durstlöscher',
      spoilTime: '3-4 Tage im Schlauch frisch',
      tasteNote: 'Geschmacksneutral, kühl',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },
  {
    id: 'std-food-herbal-tea',
    title: 'Erfrischender Kräuteraufguss (Tee)',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Becher',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Heiße Zubereitung aus Pfefferminze, Kamille und Lindenblüten. Beruhigt den Magen und vertreibt Kälte.',
    details: {
      nutritionValue: 'Wohltuend & Verdauungsfördernd',
      spoilTime: 'Sofort verzehren',
      tasteNote: 'Kräutrig, erfrischend',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'abenteuer'],
      applicationArea: 'alltag, abenteuer'
    }
  },
  {
    id: 'std-food-milk',
    title: 'Frische Landmilch',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Getränke, Bier & Wein',
    unit: 'Krug',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Nahrhafte Vollmilch von Weidekühen oder Ziegen. Sättigend und reich an Fett.',
    details: {
      nutritionValue: 'Reich an Fett & Kalzium',
      spoilTime: '1-2 Tage genießbar',
      tasteNote: 'Sahnig, mild',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },

  // --- Frischwaren & Feldfrüchte ---
  {
    id: 'std-food-apple-basket',
    title: 'Korb rote Äpfel',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Frischwaren & Feldfrüchte',
    unit: 'Holzkorb',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Frisch geerntete, rote Streuobst-Äpfel. Knackig, saftig und ideal als kleiner Snack.',
    details: {
      nutritionValue: 'Vitaminreich & Erfrischend',
      spoilTime: '2-3 Wochen haltbar',
      tasteNote: 'Süß-säuerlich',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-potato-sack',
    title: 'Sack Speisekartoffeln',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Frischwaren & Feldfrüchte',
    unit: 'Jutesack',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Lagerfähige Acker-Erdäpfel. Ein unverzichtbares Grundnahrungsmittel für Suppen, Brei und Eintöpfe.',
    details: {
      nutritionValue: 'Kohlenhydratreich & Sättigend',
      spoilTime: '3-4 Monate im kühlen Keller',
      tasteNote: 'Erdig, mehlig',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-cabbage',
    title: 'Frischer Weißkohl',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Frischwaren & Feldfrüchte',
    unit: 'Kopf',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Fester, schwerer Weißkohlkopf vom Acker. Perfekt für krautige Eintöpfe oder zur Sauerkrautherstellung.',
    details: {
      nutritionValue: 'Reich an Vitamin C & Ballaststoffen',
      spoilTime: '1 Monat haltbar',
      tasteNote: 'Knackig, herzhaft',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },

  // --- Mehl & Mahlerzeugnisse ---
  {
    id: 'std-food-rye-flour',
    title: 'Sack Roggenmehl (Mühlenware)',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Mehl & Mahlerzeugnisse',
    unit: 'Sack (10kg)',
    pricePerUnit: 3,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'trocken',
    description: 'Fein gemahlenes Roggenmehl aus der Wassermühle. Die wichtigste Grundlage für Bäcker und Haushalte.',
    details: {
      nutritionValue: 'Mehlrohstoff',
      spoilTime: '6 Monate trocken lagern',
      tasteNote: 'Getreidig',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-food-wheat-flour',
    title: 'Feines Weizenmehl (Siebmehl)',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Mehl & Mahlerzeugnisse',
    unit: 'Sack (10kg)',
    pricePerUnit: 4,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'trocken',
    description: 'Mehrfach gesiebtes, helles Weizenmehl. Ideal für feines Weißbrot, Kuchen und Teigwaren.',
    details: {
      nutritionValue: 'Hochwertiges Backmehl',
      spoilTime: '6 Monate trocken lagern',
      tasteNote: 'Mild',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-food-oatmeal',
    title: 'Hafergrütze & Haferflocken',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Mehl & Mahlerzeugnisse',
    unit: 'Stoffbeutel',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'trocken',
    description: 'Gestampfte Haferkörner für nahrhaften Frühstücksbrei. Gibt Kraft für schwere körperliche Arbeit.',
    details: {
      nutritionValue: 'Lang anhaltende Energie',
      spoilTime: '8 Monate haltbar',
      tasteNote: 'Nussig, getreidig',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'abenteuer'],
      applicationArea: 'alltag, abenteuer'
    }
  },

  // --- Brot & Backwaren ---
  {
    id: 'std-food-white-roll',
    title: 'Ofenfrische Semmel',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Brot & Backwaren',
    unit: 'Stück',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Goldgelb gebackenes Weizenbrötchen mit krosser Kruste und weichem Inneren.',
    details: {
      nutritionValue: 'Leichte Kohlenhydrate',
      spoilTime: '1-2 Tage frisch',
      tasteNote: 'Fluffig, milde Kruste',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-pretzels',
    title: 'Laugenbrezeln & Salzgebäck',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Brot & Backwaren',
    unit: 'Korb (5 Stk)',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Mit grobem Siedesalz bestreute Laugengebäcke. Der perfekte Schankhappen zum Bier in der Taverne.',
    details: {
      nutritionValue: 'Herzhafter Imbiss',
      spoilTime: '1 Tag haltbar',
      tasteNote: 'Laugig, salzig, knusprig',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-apple-tart',
    title: 'Feiner Apfelkuchen mit Zimt',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Brot & Backwaren',
    unit: 'Blechkuchen-Stück',
    pricePerUnit: 2,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Mürbeteigboden belegt mit geschnittenen Äpfeln, Rosinen und braunem Zucker.',
    details: {
      nutritionValue: 'Süße Energie (350 kcal)',
      spoilTime: '2-3 Tage haltbar',
      tasteNote: 'Süß, zimtig, fruchtig',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },

  // --- Fleisch- & Wurstwaren ---
  {
    id: 'std-food-sausage-smoke',
    title: 'Geräucherte Mettwurst',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Fleisch- & Wurstwaren',
    unit: 'Paar',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Kräftig im Buchenrauch gereifte Schweinemettwurst. Haltbar, würzig und ideal für den Rucksack.',
    details: {
      nutritionValue: 'Proteine & Fette',
      spoilTime: '3-4 Wochen haltbar',
      tasteNote: 'Rauchig, pfeffrig',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },
  {
    id: 'std-food-roast-pork',
    title: 'Krustenbraten vom Schwein',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Fleisch- & Wurstwaren',
    unit: 'Portion',
    pricePerUnit: 4,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Saftiges Stück Schweinebraten mit kross gebackener Schwarte und Kümmelsoße.',
    details: {
      nutritionValue: 'Festmahl (700 kcal)',
      spoilTime: '2 Tage im kühlen Schrank',
      tasteNote: 'Herzhaft, kross, saftig',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-bacon',
    title: 'Durchwachsener Räucherspeck',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Fleisch- & Wurstwaren',
    unit: 'Seitensegment',
    pricePerUnit: 3,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Pökelspeck mit harter Fettschicht und feinen Fleischstreifen. Gibt Suppen und Bratkartoffeln den Geschmack.',
    details: {
      nutritionValue: 'Sehr energiereich',
      spoilTime: '2 Monate haltbar',
      tasteNote: 'Salzig, stark rauchig',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'abenteuer'],
      applicationArea: 'wirtschaft, abenteuer'
    }
  },

  // --- Fisch & Meeresfrüchte ---
  {
    id: 'std-food-salted-herring',
    title: 'Salzhering im Holzfass',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Fisch & Meeresfrüchte',
    unit: 'Fass (10 Fische)',
    pricePerUnit: 5,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Stark eingesalzene Ostseeheringe. Nach dem Wässern ein geschätztes, lange haltbares Gericht.',
    details: {
      nutritionValue: 'Reich an Omega-3 & Eiweiß',
      spoilTime: '6 Monate im Salzlakenfass',
      tasteNote: 'Intensiv salzig, fischig',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-food-smoked-trout',
    title: 'Geräucherte Flussforelle',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Fisch & Meeresfrüchte',
    unit: 'Stück',
    pricePerUnit: 3,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Über Erlenholz goldbraun geräucherte Bachforelle mit zartem, rosafarbenem Fleisch.',
    details: {
      nutritionValue: 'Leicht bekömmliches Eiweiß',
      spoilTime: '5-7 Tage kühl haltbar',
      tasteNote: 'Rauchig, mild, zart',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },

  // --- Milch- & Käseprodukte ---
  {
    id: 'std-food-hard-cheese',
    title: 'Kräftiger Bergkäse (Laib)',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Milch- & Käseprodukte',
    unit: 'Laib',
    pricePerUnit: 6,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Mindestens 6 Monate gereifter Hartkäse aus Rohmilch. Feste Rinde, würziger Teig.',
    details: {
      nutritionValue: 'Fett & Eiweißreich',
      spoilTime: '4 Monate kellerhaltbar',
      tasteNote: 'Nussig, kräftig, pikant',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-food-butter-pot',
    title: 'Fassbutter im Tontopf',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Milch- & Käseprodukte',
    unit: 'Tontopf',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Im Butterfass aus süßem Rahm geschlagene Butter, leicht gesalzen und in Ton eingetopft.',
    details: {
      nutritionValue: 'Reines Speisefett',
      spoilTime: '2-3 Wochen kühl lagern',
      tasteNote: 'Rahmige Frische',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },

  // --- Konserven & Dauerproviant ---
  {
    id: 'std-food-dried-fruit',
    title: 'Dörrobst-Mischung',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Konserven & Dauerproviant',
    unit: 'Beutel',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'trocken',
    description: 'Schonend getrocknete Apfelscheiben, Pflaumen und Rosinen. Beliebter Proviant für lange Reisen.',
    details: {
      nutritionValue: 'Schnelle Fruchtzucker-Energie',
      spoilTime: '1 Jahr haltbar',
      tasteNote: 'Fruchtig-süß, zäh',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },
  {
    id: 'std-food-hardtack',
    title: 'Schiffszwieback',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Konserven & Dauerproviant',
    unit: 'Beutel (10 Stk)',
    pricePerUnit: 1,
    materialQuality: 'Minderwertig / Einfach',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'trocken',
    description: 'Mehrfach gebackener, steinharter Mehlfladen. Muss vor dem Verzehr in Suppe oder Tee eingeweicht werden.',
    details: {
      nutritionValue: 'Notfall-Kohlenhydrate',
      spoilTime: 'Jahre haltbar (wenn trocken)',
      tasteNote: 'Troken, fad, mehlend',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'wirtschaft'],
      applicationArea: 'abenteuer, wirtschaft'
    }
  },

  // --- Gewürze & Delikatessen ---
  {
    id: 'std-food-rock-salt',
    title: 'Grobes Siederfellsalz',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Gewürze & Delikatessen',
    unit: 'Salzsäckchen',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'trocken',
    description: 'Aus Salzsieden gewonnenes weißes Siedesalz. Essenziell zum Würzen, Pökeln und Verfeinern.',
    details: {
      nutritionValue: 'Mineralstoff / Würze',
      spoilTime: 'Unbegrenzt haltbar',
      tasteNote: 'Rein salzig',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-food-black-pepper',
    title: 'Schwarze Pfefferkörner',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Gewürze & Delikatessen',
    unit: 'Döschen',
    pricePerUnit: 8,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Selten / Importiert',
    isUnique: false,
    condition: 'trocken',
    description: 'Getrocknete Pfefferbeeren aus den Südlanden. Kostbares Luxusgewürz für adlige Tafeln.',
    details: {
      nutritionValue: 'Scharfe Würze',
      spoilTime: '2 Jahre haltbar',
      tasteNote: 'Scharf, feurig, aromatisch',
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-food-honey-comb',
    title: 'Blütenhonig in der Wabe',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Gewürze & Delikatessen',
    unit: 'Wabenstück',
    pricePerUnit: 3,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Naturreiner Bienenhonig direkt im Wachs. Süßungsmittel für Tränke, Gebäck und Met.',
    details: {
      nutritionValue: 'Reiner Naturzucker',
      spoilTime: 'Nahezu unbegrenzt haltbar',
      tasteNote: 'Intensiv blumig, süß',
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-food-mustard',
    title: 'Würziger Steinmühlen-Senf',
    builderType: 'Nahrung',
    mainCategory: 'Nahrung',
    subCategory: 'Gewürze & Delikatessen',
    unit: 'Tontöpfchen',
    pricePerUnit: 2,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'frisch',
    description: 'Aus vermahlenen Senfkörnern, Essig und Gewürzen hergestellte Paste. Passt hervorragend zu Braten und Wurst.',
    details: {
      nutritionValue: 'Appetitanregende Würze',
      spoilTime: '6 Monate haltbar',
      tasteNote: 'Mittelscharf, würzig',
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },


  // =========================================================================
  // 7. ALLTAGSGEGENSTÄNDE (Pechfackel, Zunderbüchse, Lederrucksack)
  // =========================================================================
  {
    id: 'std-item-torch',
    title: 'Pechfackel',
    builderType: 'Alltagsgegenstand',
    mainCategory: 'Alltags- & Haushaltsgegenstände',
    subCategory: 'Beleuchtung (Lampen, Kerzen, Laternen)',
    unit: 'Stück',
    pricePerUnit: 1,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'In Pech und Harz getränktes Tuch um einen Holzstab. Spendet 1 Stunde lang helles, windgeschütztes Licht und Wärme.',
    details: {
      itemType: 'Alltagsgegenstand',
      specialProperties: 'Leuchtet im Radius von 10m, brennt 60 Minuten.',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },
  {
    id: 'std-item-tinderbox',
    title: 'Zunderbüchse',
    builderType: 'Alltagsgegenstand',
    mainCategory: 'Alltags- & Haushaltsgegenstände',
    subCategory: 'Haushaltsgeräte & Reinigungsutensilien (Eimer, Besen)',
    unit: 'Set',
    pricePerUnit: 3,
    materialQuality: 'Gewöhnlich / Standard',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Messingdose mit Feuerstahl, scharfem Feuersteinsplitter und getrocknetem Zunder zum sicheren Entzünden von Feuern.',
    details: {
      itemType: 'Alltagsgegenstand',
      specialProperties: 'Ermöglicht verlässliches Feuermachen in wenigen Augenblicken.',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },
  {
    id: 'std-item-backpack',
    title: 'Lederrucksack',
    builderType: 'Alltagsgegenstand',
    mainCategory: 'Alltags- & Haushaltsgegenstände',
    subCategory: 'Behälter, Truhen & Gefäße',
    unit: 'Stück',
    pricePerUnit: 15,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Wasserabweisender Rucksack aus festem Rindsleder mit Außentaschen, Deckellaschen für Decken und gepolsterten Gurten.',
    details: {
      itemType: 'Alltagsgegenstand',
      specialProperties: 'Fassungsvermögen ca. 25 kg Ausrüstung, wettergeschützt.',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },

  // =========================================================================
  // 8. HANDELSWAREN & LUXUSGÜTER (Salz, Pfeffer, Seide)
  // =========================================================================
  {
    id: 'std-trade-salt',
    title: 'Salz',
    builderType: 'Handelsware',
    mainCategory: 'Handelswaren',
    subCategory: 'Salz & Gewürze',
    unit: 'Sack (25kg)',
    pricePerUnit: 20,
    materialQuality: 'Solide / Gehoben',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Gereinigtes weißes Steinsalz. Essentiell zur Konservierung von Fleisch und Fisch und hochgeschätztes Handelsgut.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },
  {
    id: 'std-trade-pepper',
    title: 'Pfeffer',
    builderType: 'Handelsware',
    mainCategory: 'Handelswaren',
    subCategory: 'Salz & Gewürze',
    unit: 'kg',
    pricePerUnit: 30,
    materialQuality: 'Meisterhaft / Veredelt',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'neu',
    description: 'Aromatischer getrockneter schwarzer Pfeffer aus fernen Handelsrouten. Beliebtes Wertgut in Kaufmannshäusern.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-trade-silk',
    title: 'Seide',
    builderType: 'Handelsware',
    mainCategory: 'Handelswaren',
    subCategory: 'Seide & Edeltuche',
    unit: 'Ballen',
    pricePerUnit: 80,
    materialQuality: 'Perfekt / Makellos',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'makellos',
    description: 'Schimmernder, edler Seidenstoff von höchster Webkunst. Bevorzugt von Adel und wohlhabenden Handelsherren.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },

  // =========================================================================
  // 9. MAGISCHE GEGENSTÄNDE & ARTEFAKTE
  // =========================================================================
  {
    id: 'std-mag-amulet',
    title: 'Lichtkristall-Amulett',
    builderType: 'Magischer Gegenstand',
    mainCategory: 'Magische Gegenstände',
    subCategory: 'Amulette & Talismane',
    unit: 'Stück',
    pricePerUnit: 120,
    materialQuality: 'Perfekt / Makellos',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'makellos',
    description: 'Silberne Fassung mit gefasstem Bergkristall, der auf Befehl blendfreies Licht verströmt und vor Verwirrung schützt.',
    details: {
      magicEffect: 'Spendet magisches Licht (20m Radius); +2 auf geistige Rettungswürfe gegen Furcht.',
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'kampf'],
      applicationArea: 'abenteuer, kampf'
    }
  },

  // =========================================================================
  // 10. QUEST- & STORY-GEGENSTÄNDE
  // =========================================================================
  {
    id: 'std-quest-key',
    title: 'Geheimnisvoller Torschlüssel',
    builderType: 'Quest-/Story-Gegenstand',
    mainCategory: 'Quest-/Story-Gegenstände',
    subCategory: 'Schlüssel & Zugangsobjekte',
    unit: 'Stück',
    pricePerUnit: 0,
    materialQuality: 'Uralt / Verwittert',
    rarity: 'Legendär / Einzigartig',
    isUnique: true,
    condition: 'gut',
    description: 'Schwerer Bronzeschlüssel mit eingravierten Runenzeichen. Passt zu einem uralten Tor tief in den vergessenen Katakomben.',
    details: {
      questSignificance: 'Öffnet das versiegelte Sanktum der Vorväter.',
      originSourceType: 'quest',
      useDomains: ['abenteuer', 'quest'],
      applicationArea: 'abenteuer, quest'
    }
  },

  // =========================================================================
  // 11. BÜCHER, SCHRIFTEN & KARTOGRAFIE
  // =========================================================================
  {
    id: 'std-book-guild-codex',
    title: 'Gilden-Kodex der Händler',
    builderType: 'Buch & Schriftstück',
    mainCategory: 'Bücher & Schriften',
    subCategory: 'Bücher & Kodizes',
    unit: 'Stück',
    pricePerUnit: 45,
    materialQuality: 'Gehoben / Meisterlich',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'gut',
    description: 'In Leder gebundener Wälzer mit Zunftprivilegen, Handelsrouten, Maßtabellen und Satzungen der Kaufmannsgilde.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft'],
      applicationArea: 'wirtschaft'
    }
  },
  {
    id: 'std-scroll-protection',
    title: 'Pergament-Schriftrolle des Schutzzaubers',
    builderType: 'Buch & Schriftstück',
    mainCategory: 'Bücher & Schriften',
    subCategory: 'Schriftrollen & Zauberformeln',
    unit: 'Stück',
    pricePerUnit: 60,
    materialQuality: 'Fein / Pergament',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'neu',
    description: 'Feines Kalbspergament mit vergoldeten Runenzeilen. Beim Verlesen erzeugt die Rolle ein arkanes Schutzschild.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['magie', 'kampf'],
      applicationArea: 'magie, kampf'
    }
  },

  // =========================================================================
  // 12. SCHMUCK & KOSTBARKEITEN
  // =========================================================================
  {
    id: 'std-jewelry-ruby-ring',
    title: 'Rubinbesetzter Siegelring',
    builderType: 'Schmuck & Kostbarkeiten',
    mainCategory: 'Schmuck & Kostbarkeiten',
    subCategory: 'Rings & Siegelringe',
    unit: 'Stück',
    pricePerUnit: 180,
    materialQuality: 'Edel / Vergoldet',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'exzellent',
    description: 'Polierter Silberring mit tiefrotem Rubin und eingraviertem Adelswappen. Statussymbol für Verhandlungen und Hofgesellschaft.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },

  // =========================================================================
  // 13. GIFTE & FALLEN
  // =========================================================================
  {
    id: 'std-poison-shadow-toxin',
    title: 'Schattenläufer-Toxin',
    builderType: 'Gifte & Fallen',
    mainCategory: 'Gifte & Fallen',
    subCategory: 'Toxine & Kontaktgifte',
    unit: 'Dosen',
    pricePerUnit: 55,
    materialQuality: 'Gefährlich / Rein',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'neu',
    description: 'Zähflüssiges, dunkles Giftöl aus Nachtschatten und Schlangenextrakt. Lässt sich auf Klingen oder Pfeilspitzen auftragen.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },

  // =========================================================================
  // 14. RITUAL- & KULTBEDARF
  // =========================================================================
  {
    id: 'std-ritual-censer',
    title: 'Geweihte Silber-Zensorampel',
    builderType: 'Ritual- & Kultbedarf',
    mainCategory: 'Ritual- & Kultbedarf',
    subCategory: 'Altar- & Tempelutensilien',
    unit: 'Stück',
    pricePerUnit: 85,
    materialQuality: 'Sakral / Fein',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'gut',
    description: 'Verzierte silberne Weihrauchampel an drei Ketten. Dient zur Reinigung von Tempelräumen und Altarweihen.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['magie', 'alltag'],
      applicationArea: 'magie, alltag'
    }
  },

  // =========================================================================
  // 15. BERGBAU & ERZE
  // =========================================================================
  {
    id: 'std-mine-star-sapphire-ore',
    title: 'Sternensaphir-Erzstufe',
    builderType: 'Bergbau & Erze',
    mainCategory: 'Bergbau & Erze',
    subCategory: 'Minerale & Gesteinsproben',
    unit: 'kg',
    pricePerUnit: 120,
    materialQuality: 'Selten / Hochrein',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'neu',
    description: 'Dunkles Muttergestein mit tiefblauen, kristallinen Saphireinschlüssen aus tiefen Gebirgsadern.',
    details: {
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'magie'],
      applicationArea: 'wirtschaft, magie'
    }
  },

  // =========================================================================
  // 16. SAATGUT & PFLANZEN
  // =========================================================================
  {
    id: 'std-seed-king-wheat',
    title: 'Königsweizen-Saatgut',
    builderType: 'Saatgut & Pflanzen',
    mainCategory: 'Saatgut & Pflanzen',
    subCategory: 'Getreidesaatgut & Körner',
    unit: 'Säcke',
    pricePerUnit: 14,
    materialQuality: 'Hochertragreich',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Ausgewählte, keimstarke Weizenkörner für ertragreiche Felder und mehlreiche Ernten.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'landwirtschaft'],
      applicationArea: 'wirtschaft, landwirtschaft'
    }
  },

  // =========================================================================
  // 17. NAUTIK & SEEFAHRT
  // =========================================================================
  {
    id: 'std-nautic-spyglass',
    title: 'Präzisions-Messingfernrohr',
    builderType: 'Nautik & Seefahrt',
    mainCategory: 'Nautik & Seefahrt',
    subCategory: 'Navigationsbesteck & Fernrohre',
    unit: 'Stück',
    pricePerUnit: 95,
    materialQuality: 'Feinmechanisch / Poliert',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'exzellent',
    description: 'Ausziehbares Fernrohr aus feinstem Messing mit geschliffenen Linsen zur Fernbeobachtung auf See und Land.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'abenteuer'],
      applicationArea: 'wirtschaft, abenteuer'
    }
  },

  // =========================================================================
  // 18. KUNST & ANTIQUITÄTEN
  // =========================================================================
  {
    id: 'std-art-bronze-statue',
    title: 'Antike Bronze-Statuette',
    builderType: 'Kunst & Antiquitäten',
    mainCategory: 'Kunst & Antiquitäten',
    subCategory: 'Skulpturen, Statuetten & Büsten',
    unit: 'Stück',
    pricePerUnit: 240,
    materialQuality: 'Historisch / Antiquarisch',
    rarity: 'Selten / Kostbar',
    isUnique: true,
    condition: 'gut',
    description: 'Fein gegossene Bronzefigur eines vergessenen Königs mit Edelsteinaugen. Wertvolles Sammlerobjekt für Herrenhäuser.',
    details: {
      originSourceType: 'einzigartiger_fund',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },

  // =========================================================================
  // 19. TRÄNKE & ELIXIERE
  // =========================================================================
  {
    id: 'std-potion-healing-large',
    title: 'Großer Lebens-Heiltrank',
    builderType: 'Tränke & Elixiere',
    mainCategory: 'Tränke & Elixiere',
    subCategory: 'Heil- & Regenerations-Tränke',
    unit: 'Flaschen',
    pricePerUnit: 35,
    materialQuality: 'Hochkonzentriert / Rein',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Rubinrote, leicht glimmende Flüssigkeit in einer verstärkten Glasphiole. Schließt Wunden und regeneriert Lebenskräfte im Kampf.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },

  // =========================================================================
  // 20. BÜCHER, SCHRIFTEN & KARTOGRAFIE
  // =========================================================================
  {
    id: 'std-book-travel-diary',
    title: 'Ledergebundenes Reisetagebuch',
    builderType: 'Buch & Schriftstück',
    mainCategory: 'Bücher & Schriften',
    subCategory: 'Tagebücher, Logbücher & Aufzeichnungen',
    unit: 'Stück',
    pricePerUnit: 18,
    materialQuality: 'Gewöhnlich / Solide',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'gut',
    description: 'Handliches Skizzen- und Notizbuch mit Messingschließe für Aufzeichnungen von Abenteuern und Kartografien.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['abenteuer', 'alltag'],
      applicationArea: 'abenteuer, alltag'
    }
  },
  {
    id: 'std-book-grimoire',
    title: 'Uraltes Zauber-Grimoire',
    builderType: 'Buch & Schriftstück',
    mainCategory: 'Bücher & Schriften',
    subCategory: 'Grimoires & Arkane Schriften',
    unit: 'Stück',
    pricePerUnit: 250,
    materialQuality: 'Meisterhaft / Arkan',
    rarity: 'Sehr selten / Legendär',
    isUnique: true,
    condition: 'alt',
    description: 'Schwerer, mit Schutzrunen geprägter Lederwälzer voller Formeln der Elementarmagie.',
    details: {
      originSourceType: 'dungeon',
      useDomains: ['magie', 'abenteuer'],
      applicationArea: 'magie, abenteuer'
    }
  },

  // =========================================================================
  // 21. SCHMUCK & KOSTBARKEITEN
  // =========================================================================
  {
    id: 'std-jewelry-gold-necklace',
    title: 'Goldene Herzogskette',
    builderType: 'Schmuck & Kostbarkeiten',
    mainCategory: 'Schmuck & Kostbarkeiten',
    subCategory: 'Edelmetallketten & Armreifen',
    unit: 'Stück',
    pricePerUnit: 320,
    materialQuality: 'Meisterhaft / Reingold',
    rarity: 'Sehr selten / Kostbar',
    isUnique: false,
    condition: 'makellos',
    description: 'Schwere, doppelgliedrige Goldkette mit detailliert ausgearbeiteten Löwenköpfen an den Schließen.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },
  {
    id: 'std-jewelry-silver-goblet',
    title: 'Verziertes Silberpokal-Set',
    builderType: 'Schmuck & Kostbarkeiten',
    mainCategory: 'Schmuck & Kostbarkeiten',
    subCategory: 'Kostbares Geschirr, Pokale & Schatullen',
    unit: 'Set',
    pricePerUnit: 140,
    materialQuality: 'Edel / Poliert',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'exzellent',
    description: 'Sechs gravierte Silberbecher in einer samtausschlagenen Eichenholzschatulle für königliche Bankette.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['alltag', 'wirtschaft'],
      applicationArea: 'alltag, wirtschaft'
    }
  },

  // =========================================================================
  // 22. GIFTE & FALLEN
  // =========================================================================
  {
    id: 'std-trap-bear-trap',
    title: 'Schwerer Bärenfang-Tritt',
    builderType: 'Gifte & Fallen',
    mainCategory: 'Gifte & Fallen',
    subCategory: 'Mechanische Fallen & Auslöser',
    unit: 'Stück',
    pricePerUnit: 35,
    materialQuality: 'Robust / Geschmiedet',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Massiver eiserner Fallenbügel mit gezähnten Backen und starker Stahlfeder für die Großwildjagd oder Geländesicherung.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },
  {
    id: 'std-trap-smoke-bomb',
    title: 'Apotheker-Rauchbombe',
    builderType: 'Gifte & Fallen',
    mainCategory: 'Gifte & Fallen',
    subCategory: 'Sprengsätze & Rauchbomben',
    unit: 'Stück',
    pricePerUnit: 25,
    materialQuality: 'Gefährlich / Gemischt',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Tongefäß mit Salpeter, Schwefel und Ruß. Erzeugt bei Entzündung augenblicklich eine blickdichte Rauchwolke.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },

  // =========================================================================
  // 23. RITUAL- & KULTBEDARF
  // =========================================================================
  {
    id: 'std-ritual-candle',
    title: 'Bienenwachs-Ritualkerze',
    builderType: 'Ritual- & Kultbedarf',
    mainCategory: 'Ritual- & Kultbedarf',
    subCategory: 'Ritualkerzen & Salböle',
    unit: 'Stück',
    pricePerUnit: 8,
    materialQuality: 'Geweiht / Rein',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Dickwandige, mit ätherischen Ölen und Kräutern getränkte Kerze für nächtliche Rituale und Schutzkreise.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['magie', 'alltag'],
      applicationArea: 'magie, alltag'
    }
  },
  {
    id: 'std-ritual-holy-water',
    title: 'Segnungs-Weihewasser-Phiole',
    builderType: 'Ritual- & Kultbedarf',
    mainCategory: 'Ritual- & Kultbedarf',
    subCategory: 'Weihewasser & Segnungsgüter',
    unit: 'Flaschen',
    pricePerUnit: 20,
    materialQuality: 'Geweiht / Sakral',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Vom Hohepriester gesegnetes Wasser in einer Kristallsphäre. Verursacht Schaden bei Untoten und reinigt Flüche.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['magie', 'kampf'],
      applicationArea: 'magie, kampf'
    }
  },

  // =========================================================================
  // 24. BERGBAU & ERZE
  // =========================================================================
  {
    id: 'std-mine-crystal-mica',
    title: 'Bergkristall-Glimmerstufe',
    builderType: 'Bergbau & Erze',
    mainCategory: 'Bergbau & Erze',
    subCategory: 'Minerale & Gesteinsproben',
    unit: 'kg',
    pricePerUnit: 45,
    materialQuality: 'Glänzend / Rein',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Sechseckige Doppelender-Kristalle auf Feldspat. Grundstoff für optische Linsen, Fokussteine und Magiespeicher.',
    details: {
      originSourceType: 'natuerliches_vorkommen',
      useDomains: ['wirtschaft', 'magie'],
      applicationArea: 'wirtschaft, magie'
    }
  },

  // =========================================================================
  // 25. SAATGUT & PFLANZEN
  // =========================================================================
  {
    id: 'std-seed-herbal-mix',
    title: 'Heilkräuter-Samenmischung',
    builderType: 'Saatgut & Pflanzen',
    mainCategory: 'Saatgut & Pflanzen',
    subCategory: 'Heilpflanzensamen & Kräutersaat',
    unit: 'Beutel',
    pricePerUnit: 16,
    materialQuality: 'Gekeimt / Sortiert',
    rarity: 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: 'Ausgewogene Mischung aus Arnika-, Kamille- und Breitwegerichsaat für Alchemie-Gärten und Arzneibeete.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'landwirtschaft'],
      applicationArea: 'wirtschaft, landwirtschaft'
    }
  },

  // =========================================================================
  // 26. NAUTIK & SEEFAHRT
  // =========================================================================
  {
    id: 'std-nautic-compass',
    title: 'Nautischer Schiffskompass',
    builderType: 'Nautik & Seefahrt',
    mainCategory: 'Nautik & Seefahrt',
    subCategory: 'Nautische Instrumente & Kompasse',
    unit: 'Stück',
    pricePerUnit: 75,
    materialQuality: 'Präzise / Messing',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'exzellent',
    description: 'Kardanisch aufgehängte Magnetnadel in einem wasserdichten Messinggehäuse für sturmsichere Kursbestimmung.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'abenteuer'],
      applicationArea: 'wirtschaft, abenteuer'
    }
  },

  // =========================================================================
  // 27. KUNST & ANTIQUITÄTEN
  // =========================================================================
  {
    id: 'std-art-tapestry',
    title: 'Meisterhafter Wandteppich der Schlacht',
    builderType: 'Kunst & Antiquitäten',
    mainCategory: 'Kunst & Antiquitäten',
    subCategory: 'Gemälde & Wandteppiche',
    unit: 'Stück',
    pricePerUnit: 350,
    materialQuality: 'Meisterhaft / Handgewebt',
    rarity: 'Sehr selten / Kostbar',
    isUnique: false,
    condition: 'gut',
    description: 'Großformatiger Gobelin aus Seide und Goldfäden, der die historische Gründung der Kaiserstadt darstellt.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['wirtschaft', 'alltag'],
      applicationArea: 'wirtschaft, alltag'
    }
  },

  // =========================================================================
  // 28. TRÄNKE, MONSTER-DROPS, DUNGEON & QUESTS
  // =========================================================================
  {
    id: 'std-potion-mana-elixir',
    title: 'Arkanes Manatrank-Elixier',
    builderType: 'Tränke & Elixiere',
    mainCategory: 'Tränke & Elixiere',
    subCategory: 'Mana- & Magie-Essenzen',
    unit: 'Flaschen',
    pricePerUnit: 45,
    materialQuality: 'Arkan / Leuchtend',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'neu',
    description: 'Saphirblau schimmernde Tinktur aus Sternenstaub und Mondblüten. Füllt verbrauchte Magiepunkte blitzartig auf.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['magie', 'kampf'],
      applicationArea: 'magie, kampf'
    }
  },
  {
    id: 'std-potion-strength',
    title: 'Stärkungselixier des Bären',
    builderType: 'Tränke & Elixiere',
    mainCategory: 'Tränke & Elixiere',
    subCategory: 'Stärkungselixiere & Zauberöle',
    unit: 'Flaschen',
    pricePerUnit: 50,
    materialQuality: 'Konzentriert / Magisch',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'neu',
    description: 'Dicke, erdig riechende Brause, die dem Zechenden für kurze Zeit bärenstarke Muskelkraft und Zähigkeit verleiht.',
    details: {
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  },
  {
    id: 'std-loot-wolf-pelt',
    title: 'Schattenwolf-Fell',
    builderType: 'Monster-Beute',
    mainCategory: 'Monster-Beute & Drops',
    subCategory: 'Häute, Felle & Schuppen',
    unit: 'Stück',
    pricePerUnit: 30,
    materialQuality: 'Dicht / Geschmeidig',
    rarity: 'Ungewöhnlich / Regional',
    isUnique: false,
    condition: 'gut',
    description: 'Dunkelgrauer, dichter Pelz eines erlegten Schattenwolfs. Hervorragend geeignet für kältefeste Umhänge.',
    details: {
      originSourceType: 'monster_drop',
      useDomains: ['wirtschaft', 'abenteuer'],
      applicationArea: 'wirtschaft, abenteuer'
    }
  },
  {
    id: 'std-dungeon-chest-loot',
    title: 'Verrosteter Katakomben-Beutel',
    builderType: 'Dungeon-Fund',
    mainCategory: 'Dungeon-Vorkommen & Funde',
    subCategory: 'Schatztruhen-Beute & Relikte',
    unit: 'Stück',
    pricePerUnit: 65,
    materialQuality: 'Uralt / Verwittert',
    rarity: 'Selten / Kostbar',
    isUnique: false,
    condition: 'gebraucht',
    description: 'Verzierter Lederbeutel aus einer alten Schatztruhe mit antiken Silbermünzen und Edelsteinsplittern.',
    details: {
      originSourceType: 'dungeon',
      useDomains: ['abenteuer', 'wirtschaft'],
      applicationArea: 'abenteuer, wirtschaft'
    }
  },
  {
    id: 'std-quest-royal-decree',
    title: 'Königlicher Erlass mit Wachssiegel',
    builderType: 'Quest-/Story-Gegenstand',
    mainCategory: 'Quest-/Story-Gegenstände',
    subCategory: 'Siegel, Wappen & Amtsurkunden',
    unit: 'Stück',
    pricePerUnit: 0,
    materialQuality: 'Offiziell / Versiegelt',
    rarity: 'Legendär / Einzigartig',
    isUnique: true,
    condition: 'makellos',
    description: 'Auf schwerem Büttenpapier verfasster Haftbefehl und Freibrief des Kronrats mit rotem Königssiegel.',
    details: {
      questSignificance: 'Gewährt freien Durchpass an allen Grenzfestungen des Reiches.',
      originSourceType: 'quest',
      useDomains: ['abenteuer', 'quest'],
      applicationArea: 'abenteuer, quest'
    }
  }
];

// Helper mapping for weapon category to item subcategory in Lore Database
function mapWeaponCategoryToSubCategory(categoryId: string): string {
  switch (categoryId) {
    case 'schwerter_einhaendig':
    case 'schwerter_zweihanendig':
      return 'Schwerter & Klingen';
    case 'dolche_messer':
      return 'Dolche & Messer';
    case 'aexte_beile':
      return 'Äxte & Beile';
    case 'haemmer_keulen':
      return 'Hämmer & Streitkolben';
    case 'stangenwaffen_speere':
      return 'Stangenwaffen & Speere';
    case 'boegen_sehnenwaffen':
      return 'Bögen & Pfeile';
    case 'armbrueste':
      return 'Armbrüste & Bolzen';
    case 'wurfwaffen_schleudern':
      return 'Wurfwaffen';
    case 'faust_exotisch':
      return 'Faust- & Exotenwaffen';
    case 'schilde':
      return 'Schilde & Parierschilde';
    case 'schwarzpulver':
      return 'Feuerwaffen & Schwarzpulver';
    case 'magisch_fokus':
      return 'Magische & Runenwaffen';
    default:
      return 'Schwerter & Klingen';
  }
}

function estimateWeaponPrice(categoryId: string, id: string): number {
  switch (categoryId) {
    case 'dolche_messer': return 12;
    case 'wurfwaffen_schleudern': return 8;
    case 'schwerter_einhaendig': return 35;
    case 'schwerter_zweihanendig': return 75;
    case 'aexte_beile': return 25;
    case 'haemmer_keulen': return 30;
    case 'stangenwaffen_speere': return 22;
    case 'boegen_sehnenwaffen': return 40;
    case 'armbrueste': return 65;
    case 'faust_exotisch': return 20;
    case 'schilde': return 25;
    case 'schwarzpulver': return 150;
    case 'magisch_fokus': return 90;
    default: return 30;
  }
}

function estimateWeaponDamage(weapon: typeof ALL_WEAPONS[0]): string {
  const cat = weapon.categoryId;
  if (cat === 'dolche_messer' || cat === 'wurfwaffen_schleudern' || cat === 'faust_exotisch') {
    return '1W4+1 / 1W6+1';
  }
  if (cat === 'schwerter_einhaendig' || cat === 'aexte_beile' || cat === 'haemmer_keulen') {
    return '1W8+2 / 1W10+2';
  }
  if (cat === 'schwerter_zweihanendig' || cat === 'stangenwaffen_speere') {
    return '2W6+3 / 1W12+2';
  }
  if (cat === 'boegen_sehnenwaffen' || cat === 'armbrueste') {
    return '1W8+3 (Fernkampf)';
  }
  if (cat === 'schwarzpulver') {
    return '2W8+4 (Schwarzpulver-Durchschlag)';
  }
  if (cat === 'magisch_fokus') {
    return '1W8+2 (Arkan / Magisch)';
  }
  if (cat === 'schilde') {
    return '1W4+1 (Schildstoß) / Abwehr +2';
  }
  return '1W8+2';
}

export const WEAPON_MASTERY_STANDARD_ITEMS: StandardItemDefinition[] = ALL_WEAPONS.map(wpn => {
  const isExoticOrMagic = wpn.categoryId === 'schwarzpulver' || wpn.categoryId === 'magisch_fokus';
  const subCategory = mapWeaponCategoryToSubCategory(wpn.categoryId);
  
  return {
    id: `std-wpn-${wpn.id}`,
    title: wpn.name,
    builderType: (wpn.categoryId === 'schilde' ? 'Rüstung' : 'Waffe') as ItemBuilderType,
    mainCategory: wpn.categoryId === 'schilde' ? 'Rüstung & Schutzausrüstung' : 'Waffen',
    subCategory: subCategory,
    unit: 'Stück',
    pricePerUnit: estimateWeaponPrice(wpn.categoryId, wpn.id),
    materialQuality: isExoticOrMagic ? 'Meisterhaft / Veredelt' : 'Solide / Gehoben',
    rarity: isExoticOrMagic ? 'Selten / Importiert' : 'Gewöhnlich / Alltäglich',
    isUnique: false,
    condition: 'neu',
    description: wpn.description,
    details: {
      weaponType: wpn.name,
      damageType: wpn.damageTypes.join(', '),
      damageValue: estimateWeaponDamage(wpn),
      rangeCategory: wpn.rangeCategory,
      effects: `Führungsstile: ${wpn.wieldingStyles.join(', ')} | Manöver: ${wpn.maneuvers.join(', ')}`,
      requiredWeaponMasteryName: wpn.categoryName,
      originSourceType: 'normal_produziert',
      useDomains: ['kampf', 'abenteuer'],
      applicationArea: 'kampf, abenteuer'
    }
  };
});

// Merge base items, weapon mastery items, and profession items (ensuring unique IDs)
const seenItemIds = new Set<string>();
const mergedItems: StandardItemDefinition[] = [];

for (const item of [...BASE_STANDARD_ITEMS_CATALOG, ...WEAPON_MASTERY_STANDARD_ITEMS, ...PROFESSION_ITEMS_CATALOG]) {
  if (!seenItemIds.has(item.id)) {
    seenItemIds.add(item.id);
    mergedItems.push(item);
  }
}

export const STANDARD_ITEMS_CATALOG: StandardItemDefinition[] = mergedItems;

/**
 * Wandelt die Standard-Gegenstandsdefinitionen in reine Gegenstands-Codex LoreEntry-Objekte um.
 * Entfernt instanz- und wirtschaftsspezifische Daten (Preise, Zustände, Bestände) aus der Codex-Definition.
 */
export function createStandardLoreEntries(): LoreEntry[] {
  return STANDARD_ITEMS_CATALOG.map(item => {
    const rawDetails = item.details || {};
    // Dynamic instance / economic fields stripped from Codex definition
    const {
      pricePerUnit: _p,
      condition: _c,
      stockAmount: _s,
      marketValue: _m,
      owner: _o,
      location: _l,
      ...cleanDetails
    } = rawDetails;

    return {
      id: item.id,
      category: 'Gegenstände',
      title: item.title,
      description: item.description,
      isUnlocked: true,
      details: {
        builderType: item.builderType,
        mainCategory: item.mainCategory,
        subCategory: item.subCategory,
        itemType: item.builderType,
        recommendedUnit: item.unit,
        ...cleanDetails
      }
    };
  });
}

/**
 * Filtert Standard-Gegenstände nach Gegenstandsart
 */
export function getStandardItemsByBuilderType(builderType: ItemBuilderType): StandardItemDefinition[] {
  return STANDARD_ITEMS_CATALOG.filter(item => item.builderType === builderType);
}

/**
 * Sucht eine Standard-Gegenstandsdefinition anhand des Namens oder IDs.
 * Unterstützt auch flexible Fallback-Suchen für abgeleitete oder historische Bezeichnungen.
 */
export function findStandardItem(query: string): StandardItemDefinition | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  // 1. Exakter Treffer auf ID oder Titel
  const exact = STANDARD_ITEMS_CATALOG.find(
    item => item.id.toLowerCase() === q || item.title.toLowerCase() === q
  );
  if (exact) return exact;

  // 2. Präfix- oder Enthält-Treffer
  const prefix = STANDARD_ITEMS_CATALOG.find(
    item =>
      item.title.toLowerCase().startsWith(q) ||
      q.startsWith(item.title.toLowerCase()) ||
      item.title.toLowerCase().includes(q)
  );
  if (prefix) return prefix;

  // 3. Fallback über baseRawMaterial oder fabricType
  return STANDARD_ITEMS_CATALOG.find(
    item =>
      (item.details.baseRawMaterial && item.details.baseRawMaterial.toLowerCase().includes(q)) ||
      (item.details.fabricType && item.details.fabricType.toLowerCase().includes(q))
  );
}
