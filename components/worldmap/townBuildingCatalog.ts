import {
  Home,
  Building2,
  Castle,
  Anchor,
  Hammer,
  ShoppingBag,
  Sparkles,
  Layers,
  Wrench,
  Trees,
  Fish,
  Wheat,
  Shield,
  BookOpen,
  Wine,
  Coins,
  Warehouse,
  Factory,
  Flame,
  Construction,
  AlertTriangle,
  Skull
} from 'lucide-react';

export type BuildingCategoryGroup =
  | 'wohnen'
  | 'handwerk'
  | 'handel'
  | 'landwirtschaft'
  | 'militaer'
  | 'hafen'
  | 'kultur_verwaltung';

export type LocalBuildingCategory =
  // Wohnen & Gemeinschaft
  | 'wohnen_einfach'
  | 'wohnen_fachwerk'
  | 'herrenhaus'
  | 'gasthaus'
  // Handwerk & Produktion
  | 'schmiede'
  | 'schreinerei'
  | 'weberei'
  | 'toepferei'
  | 'alchemie'
  // Handel & Wirtschaft
  | 'markt'
  | 'kontor'
  | 'bankhaus'
  | 'taverne'
  // Landwirtschaft & Ernährung
  | 'muehle'
  | 'speicher'
  | 'fischer'
  | 'brauerei'
  | 'steinmetz'
  // Militär & Verteidigung
  | 'turm'
  | 'kaserne'
  | 'zeughaus'
  | 'torhaus'
  | 'mauer'
  // Hafen & Seefahrt
  | 'hafen'
  | 'werft'
  | 'zollhaus'
  | 'leuchtturm'
  // Kultur, Glaube & Verwaltung
  | 'rathaus'
  | 'tempel'
  | 'kathedrale'
  | 'badehaus'
  | 'bibliothek'
  | 'park';

export type BuildingStatus = 'aktiv' | 'im_bau' | 'beschaedigt' | 'zerstoert';

export interface BuildingEconomyStats {
  income: number; // Gold / Taler pro Monat
  upkeep: number; // Unterhaltskosten
  population: number; // Wohnkapazität / Bürger
  production: number; // Produktionspunkte (Waren / Werkstoffe)
  defense: number; // Verteidigungswert / Schutzpunkte
  morale: number; // Zufriedenheit & Wohlstandseffekt
}

export interface BuildingLevelDef {
  level: number;
  title: string;
  description: string;
  stats: BuildingEconomyStats;
  upgradeCostGold: number;
  upgradeCostMaterials: number;
  constructionTurns: number;
}

export interface BuildingTypeDefinition {
  category: LocalBuildingCategory;
  group: BuildingCategoryGroup;
  name: string;
  shortDesc: string;
  color: string;
  stroke: string;
  accentColor: string;
  size: number;
  levels: BuildingLevelDef[];
}

export interface LocalBuildingSymbol {
  id: string;
  name: string;
  category: LocalBuildingCategory;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  level: number; // 1 to 5
  status: BuildingStatus;
  constructionProgress?: number; // 0 to 100 % (if im_bau)
  description?: string;
  npcOwner?: string;
  notes?: string;
  district?: string;
}

export const CATEGORY_GROUPS: Record<
  BuildingCategoryGroup,
  { label: string; icon: any; color: string; description: string }
> = {
  wohnen: {
    label: 'Wohnen & Gemeinschaft',
    icon: Home,
    color: '#9a3412',
    description: 'Wohnraum für Bürger, Gesinde und Adlige'
  },
  handwerk: {
    label: 'Handwerk & Produktion',
    icon: Hammer,
    color: '#475569',
    description: 'Verarbeitung von Rohstoffen und Waffenherstellung'
  },
  handel: {
    label: 'Handel & Dienstleistung',
    icon: ShoppingBag,
    color: '#d97706',
    description: 'Märkte, Tavernen, Banken und Kontore'
  },
  landwirtschaft: {
    label: 'Landwirtschaft & Rohstoffe',
    icon: Wheat,
    color: '#65a30d',
    description: 'Nahrungsversorgung, Mühlen und Lagerung'
  },
  militaer: {
    label: 'Militär & Verteidigung',
    icon: Shield,
    color: '#b91c1c',
    description: 'Türme, Kasernen, Zeughäuser und Stadtmauern'
  },
  hafen: {
    label: 'Hafen & Schifffahrt',
    icon: Anchor,
    color: '#0284c7',
    description: 'Anlegestellen, Werften, Speicher und Leuchttürme'
  },
  kultur_verwaltung: {
    label: 'Verwaltung, Kultur & Glaube',
    icon: Building2,
    color: '#6366f1',
    description: 'Rathäuser, Tempel, Bibliotheken und Badehäuser'
  }
};

/**
 * Standard generator for 5 level steps for any building
 */
function createLevelHierarchy(
  baseName: string,
  levelTitles: [string, string, string, string, string],
  baseStats: BuildingEconomyStats,
  statMultipliers: {
    income?: number;
    inc?: number;
    upkeep?: number;
    upk?: number;
    pop?: number;
    population?: number;
    prod?: number;
    production?: number;
    def?: number;
    defense?: number;
    mor?: number;
    morale?: number;
  } = {}
): BuildingLevelDef[] {
  const incMult = statMultipliers.income ?? statMultipliers.inc ?? 1.8;
  const upkMult = statMultipliers.upkeep ?? statMultipliers.upk ?? 1.4;
  const popMult = statMultipliers.population ?? statMultipliers.pop ?? 1.8;
  const prodMult = statMultipliers.production ?? statMultipliers.prod ?? 1.7;
  const defMult = statMultipliers.defense ?? statMultipliers.def ?? 1.6;
  const morMult = statMultipliers.morale ?? statMultipliers.mor ?? 1.5;

  return [1, 2, 3, 4, 5].map((lvl, idx) => {
    const inc = Math.round(baseStats.income * (1 + idx * (incMult - 1)));
    const upk = Math.round(baseStats.upkeep * (1 + idx * (upkMult - 1)));
    const pop = Math.round(baseStats.population * (1 + idx * (popMult - 1)));
    const prod = Math.round(baseStats.production * (1 + idx * (prodMult - 1)));
    const def = Math.round(baseStats.defense * (1 + idx * (defMult - 1)));
    const mor = Math.round(baseStats.morale * (1 + idx * (morMult - 1)));

    return {
      level: lvl,
      title: levelTitles[idx] || `Stufe ${lvl}: ${baseName}`,
      description: `Ausbaustufe ${lvl} mit gesteigertem wirtschaftlichen und strukturellen Ertrag.`,
      stats: {
        income: inc,
        upkeep: upk,
        population: pop,
        production: prod,
        defense: def,
        morale: mor
      },
      upgradeCostGold: Math.round(40 * Math.pow(2.2, idx)),
      upgradeCostMaterials: Math.round(25 * Math.pow(2, idx)),
      constructionTurns: idx + 1
    };
  });
}

export const BUILDING_CATALOG: Record<LocalBuildingCategory, BuildingTypeDefinition> = {
  // === WOHNEN & GEMEINSCHAFT ===
  wohnen_einfach: {
    category: 'wohnen_einfach',
    group: 'wohnen',
    name: 'Einfaches Wohnhaus',
    shortDesc: 'Schlichter Lehm- und Holzbau für Tagelöhner und einfache Bürger.',
    color: '#9a3412',
    stroke: '#451a03',
    accentColor: '#f97316',
    size: 14,
    levels: createLevelHierarchy(
      'Wohnhaus',
      ['Einfache Hütte', 'Holzhaus', 'Geräumiges Wohnhaus', 'Doppelhaus', 'Stadtparzelle'],
      { income: 4, upkeep: 1, population: 6, production: 0, defense: 0, morale: 1 },
      { income: 1.6, pop: 1.9 }
    )
  },
  wohnen_fachwerk: {
    category: 'wohnen_fachwerk',
    group: 'wohnen',
    name: 'Bürgerliches Fachwerkhaus',
    shortDesc: 'Mehrstöckiges Fachwerkhaus für Handwerkerfamilien und Kaufleute.',
    color: '#c2410c',
    stroke: '#7c2d12',
    accentColor: '#fb923c',
    size: 16,
    levels: createLevelHierarchy(
      'Fachwerkhaus',
      ['Handwerkerhaus', 'Großes Bürgerhaus', 'Zunfthaus-Wohnflügel', 'Stadthaus', 'Bürgerpalais'],
      { income: 8, upkeep: 2, population: 14, production: 1, defense: 1, morale: 2 },
      { income: 1.8, pop: 1.8 }
    )
  },
  herrenhaus: {
    category: 'herrenhaus',
    group: 'wohnen',
    name: 'Herrenhaus & Patriziervilla',
    shortDesc: 'Prachtvolles Anwesen des Adels oder wohlhabender Fernhändler.',
    color: '#b45309',
    stroke: '#78350f',
    accentColor: '#f59e0b',
    size: 22,
    levels: createLevelHierarchy(
      'Herrenhaus',
      ['Patrizierhaus', 'Großes Herrenhaus', 'Adelsresidenz', 'Stadtschloss', 'Fürstenpalast'],
      { income: 24, upkeep: 8, population: 25, production: 2, defense: 3, morale: 6 },
      { income: 2.0, pop: 1.5, mor: 2.0 }
    )
  },
  gasthaus: {
    category: 'gasthaus',
    group: 'wohnen',
    name: 'Großes Gasthaus & Herberge',
    shortDesc: 'Beherbergung für Reisende, Händler und Gesandte mit Fremdenzimmern.',
    color: '#ea580c',
    stroke: '#9a3412',
    accentColor: '#fdba74',
    size: 18,
    levels: createLevelHierarchy(
      'Gasthaus',
      ['Kleine Herberge', 'Kaufmannsherberge', 'Großes Reise-Gasthaus', 'Poststation & Hotel', 'Kaiserhof'],
      { income: 16, upkeep: 4, population: 12, production: 0, defense: 0, morale: 4 },
      { income: 1.9, pop: 1.7 }
    )
  },

  // === HANDWERK & PRODUKTION ===
  schmiede: {
    category: 'schmiede',
    group: 'handwerk',
    name: 'Schmiede & Waffenschmied',
    shortDesc: 'Essen und Ambosse zur Herstellung von Werkzeugen, Rüstungen und Waffen.',
    color: '#475569',
    stroke: '#0f172a',
    accentColor: '#f97316',
    size: 16,
    levels: createLevelHierarchy(
      'Schmiede',
      ['Dorfschmiede', 'Waffenschmiede', 'Große Zeughausschmiede', 'Meister-Rüstschmiede', 'Königliche Hofschmiede'],
      { income: 10, upkeep: 3, population: 2, production: 12, defense: 4, morale: 1 },
      { prod: 2.1, def: 1.8 }
    )
  },
  schreinerei: {
    category: 'schreinerei',
    group: 'handwerk',
    name: 'Schreinerei & Sägewerk',
    shortDesc: 'Verarbeitung von Bauholz für Karren, Dachstühle, Möbel und Schiffe.',
    color: '#854d0e',
    stroke: '#422006',
    accentColor: '#eab308',
    size: 16,
    levels: createLevelHierarchy(
      'Schreinerei',
      ['Zimmermannsplatz', 'Sägemühle', 'Möbelschreinerei', 'Große Bauhütte', 'Werkmeister-Manufaktur'],
      { income: 8, upkeep: 2, population: 2, production: 10, defense: 0, morale: 1 },
      { prod: 2.0 }
    )
  },
  weberei: {
    category: 'weberei',
    group: 'handwerk',
    name: 'Weberei & Färberei',
    shortDesc: 'Herstellung von Stoffen, Wolltuchen, Segeltuch und feiner Seide.',
    color: '#be185d',
    stroke: '#831843',
    accentColor: '#f472b6',
    size: 15,
    levels: createLevelHierarchy(
      'Weberei',
      ['Spinnstube', 'Tuchmacherei', 'Färberwerkstatt', 'Große Textilmanufaktur', 'Gildenhalle der Seidenweber'],
      { income: 12, upkeep: 3, population: 4, production: 8, defense: 0, morale: 2 },
      { income: 1.9, prod: 1.7 }
    )
  },
  toepferei: {
    category: 'toepferei',
    group: 'handwerk',
    name: 'Töpferei & Glashütte',
    shortDesc: 'Brennöfen für Tonkrüge, Ziegel, Glasfenster und kunstvolle Keramik.',
    color: '#b45309',
    stroke: '#78350f',
    accentColor: '#fbbf24',
    size: 15,
    levels: createLevelHierarchy(
      'Töpferei',
      ['Töpferhütte', 'Ziegelbrennerei', 'Glashütte', 'Kachelmanufaktur', 'Meister-Porzellanwerk'],
      { income: 10, upkeep: 2, population: 2, production: 7, defense: 0, morale: 2 },
      { income: 1.8, prod: 1.8 }
    )
  },
  alchemie: {
    category: 'alchemie',
    group: 'handwerk',
    name: 'Alchemielabor & Apotheke',
    shortDesc: 'Destillation von Tränken, Tinkturen, Schwarzpulver und Arzneien.',
    color: '#7c3aed',
    stroke: '#4c1d95',
    accentColor: '#c084fc',
    size: 16,
    levels: createLevelHierarchy(
      'Alchemie',
      ['Kräuterstube', 'Apotheke', 'Alchemistenlabor', 'Arkanes Transmutorium', 'Große Akademie der Alchemie'],
      { income: 14, upkeep: 5, population: 2, production: 9, defense: 3, morale: 3 },
      { income: 2.1, prod: 1.9, mor: 1.8 }
    )
  },

  // === HANDEL & WIRTSCHAFT ===
  markt: {
    category: 'markt',
    group: 'handel',
    name: 'Marktplatz & Handelsstände',
    shortDesc: 'Zentraler Umschlagplatz für Waren, Nahrung und auswärtige Händler.',
    color: '#059669',
    stroke: '#064e3b',
    accentColor: '#34d399',
    size: 24,
    levels: createLevelHierarchy(
      'Marktplatz',
      ['Wochenmarkt', 'Markthalle', 'Großer Hauptmarkt', 'Handelsbasar', 'Internationaler Messeplatz'],
      { income: 22, upkeep: 4, population: 0, production: 6, defense: 0, morale: 5 },
      { income: 2.2, mor: 1.8 }
    )
  },
  kontor: {
    category: 'kontor',
    group: 'handel',
    name: 'Handelskontor & Gildehaus',
    shortDesc: 'Stützpunkt von Handelskompanien zur Organisation von Übersee- und Karawanenhandel.',
    color: '#0284c7',
    stroke: '#0c4a6e',
    accentColor: '#38bdf8',
    size: 20,
    levels: createLevelHierarchy(
      'Handelskontor',
      ['Kaufmannsbüro', 'Gilde-Kontor', 'Großes Handelshaus', 'Übersee-Niederlassung', 'Handelsgilden-Palast'],
      { income: 28, upkeep: 7, population: 5, production: 8, defense: 1, morale: 4 },
      { income: 2.3, prod: 1.8 }
    )
  },
  bankhaus: {
    category: 'bankhaus',
    group: 'handel',
    name: 'Bankhaus & Geldwechsler',
    shortDesc: 'Verwaltung von Vermögen, Wechselbriefen, Krediten und Münzprägungen.',
    color: '#d97706',
    stroke: '#78350f',
    accentColor: '#fde047',
    size: 18,
    levels: createLevelHierarchy(
      'Bankhaus',
      ['Geldwechsler', 'Leihhaus', 'Kaufmannsbank', 'Großbankhaus', 'Staatliche Noten- & Münzbank'],
      { income: 35, upkeep: 10, population: 3, production: 0, defense: 2, morale: 3 },
      { income: 2.4 }
    )
  },
  taverne: {
    category: 'taverne',
    group: 'handel',
    name: 'Taverne & Schankraum',
    shortDesc: 'Ort für Speis und Trank, Gerüchte, Spiel und Musik.',
    color: '#d97706',
    stroke: '#78350f',
    accentColor: '#fb923c',
    size: 18,
    levels: createLevelHierarchy(
      'Taverne',
      ['Krug / Schenke', 'Dorfschenke', 'Berühmte Taverne', 'Großes Wirtshaus', 'Kaiserlicher Vergnügungspalast'],
      { income: 15, upkeep: 3, population: 4, production: 0, defense: 0, morale: 6 },
      { income: 1.9, mor: 2.1 }
    )
  },

  // === LANDWIRTSCHAFT & ERNÄHRUNG ===
  muehle: {
    category: 'muehle',
    group: 'landwirtschaft',
    name: 'Getreidemühle & Wassermühle',
    shortDesc: 'Mahlen von Korn zu Mehl zur Versorgung von Bäckereien und Siedlung.',
    color: '#ca8a04',
    stroke: '#713f12',
    accentColor: '#facc15',
    size: 18,
    levels: createLevelHierarchy(
      'Mühle',
      ['Kleine Windmühle', 'Große Fluss-Wassermühle', 'Doppel-Mahlwerk', 'Zunft-Großmühle', 'Industrielle Dampfmühle'],
      { income: 12, upkeep: 2, population: 2, production: 14, defense: 0, morale: 3 },
      { prod: 2.1 }
    )
  },
  speicher: {
    category: 'speicher',
    group: 'landwirtschaft',
    name: 'Kornspeicher & Lagerhaus',
    shortDesc: 'Schutz vor Hungersnöten, sichere Lagerung von Vorräten und Saatgut.',
    color: '#a16207',
    stroke: '#713f12',
    accentColor: '#eab308',
    size: 20,
    levels: createLevelHierarchy(
      'Speicher',
      ['Vorratsscheune', 'Kornspeicher', 'Zentrales Lebensmittellager', 'Großer Festungsspeicher', 'Reichs-Kornkammer'],
      { income: 4, upkeep: 3, population: 0, production: 12, defense: 2, morale: 5 },
      { prod: 2.0, mor: 1.8 }
    )
  },
  fischer: {
    category: 'fischer',
    group: 'landwirtschaft',
    name: 'Fischerhütte & Räucherei',
    shortDesc: 'Fang frischer Fische und Verarbeitung von Räucherwaren an Küsten und Flüssen.',
    color: '#0284c7',
    stroke: '#075985',
    accentColor: '#38bdf8',
    size: 15,
    levels: createLevelHierarchy(
      'Fischerei',
      ['Fischerhütte', 'Räucherkate', 'Fischerei-Pier', 'Großer Fischmarkt', 'Hochsee-Fischfangflotte'],
      { income: 10, upkeep: 2, population: 4, production: 11, defense: 0, morale: 3 },
      { prod: 2.0, inc: 1.8 }
    )
  },
  brauerei: {
    category: 'brauerei',
    group: 'landwirtschaft',
    name: 'Brauerei & Kelterei',
    shortDesc: 'Herstellung von Bier, Met, Most und edlen Weinen für Schenken und Export.',
    color: '#b45309',
    stroke: '#78350f',
    accentColor: '#f59e0b',
    size: 17,
    levels: createLevelHierarchy(
      'Brauerei',
      ['Hausbrauerei', 'Sudhaus', 'Große Stadtbrauerei', 'Kloster-Brauerei', 'Hof-Kelterei & Weingut'],
      { income: 18, upkeep: 4, population: 2, production: 10, defense: 0, morale: 7 },
      { inc: 2.0, mor: 2.2 }
    )
  },
  steinmetz: {
    category: 'steinmetz',
    group: 'landwirtschaft',
    name: 'Steinmetzhütte & Bauhof',
    shortDesc: 'Gewinnung und Behauung von Werksteinen für Monumente, Mauern und Prachtbauten.',
    color: '#64748b',
    stroke: '#1e293b',
    accentColor: '#cbd5e1',
    size: 16,
    levels: createLevelHierarchy(
      'Steinmetz',
      ['Steinmetzplatz', 'Steinhauer-Werkstatt', 'Große Dombauhütte', 'Monumental-Steinmetz', 'Königlicher Steinwerkmeister'],
      { income: 8, upkeep: 3, population: 2, production: 16, defense: 3, morale: 1 },
      { prod: 2.2, def: 1.7 }
    )
  },

  // === MILITÄR & VERTEIDIGUNG ===
  turm: {
    category: 'turm',
    group: 'militaer',
    name: 'Wachturm & Spähturm',
    shortDesc: 'Befestigter Ausguck für Wachen und Bogenschützen zur Früherkennung von Gefahren.',
    color: '#b91c1c',
    stroke: '#7f1d1d',
    accentColor: '#f87171',
    size: 16,
    levels: createLevelHierarchy(
      'Wachturm',
      ['Holz-Spähturm', 'Steinerner Wehrturm', 'Verstärkte Bastion', 'Geschützturm', 'Eiserner Wachtturm'],
      { income: 0, upkeep: 4, population: 4, production: 0, defense: 18, morale: 2 },
      { def: 2.3 }
    )
  },
  kaserne: {
    category: 'kaserne',
    group: 'militaer',
    name: 'Kaserne & Exerzierplatz',
    shortDesc: 'Unterkunft und Ausbildungslager für Wachsoldaten, Milizen und Infanterie.',
    color: '#991b1b',
    stroke: '#450a0a',
    accentColor: '#ef4444',
    size: 22,
    levels: createLevelHierarchy(
      'Kaserne',
      ['Milizlager', 'Garnisons-Kaserne', 'Große Kriegskaserne', 'Festungskommandantur', 'Königliche Gardekaserne'],
      { income: 0, upkeep: 12, population: 20, production: 4, defense: 32, morale: 3 },
      { def: 2.2, pop: 2.0 }
    )
  },
  zeughaus: {
    category: 'zeughaus',
    group: 'militaer',
    name: 'Zeughaus & Waffenkammer',
    shortDesc: 'Sichere Einlagerung von Armbrüsten, Harnischen, Belagerungsgeräten und Pfeilen.',
    color: '#7f1d1d',
    stroke: '#450a0a',
    accentColor: '#fca5a5',
    size: 19,
    levels: createLevelHierarchy(
      'Zeughaus',
      ['Waffenkammer', 'Garnisons-Zeughaus', 'Großes Artillerie-Zeughaus', 'Kriegsarsenal', 'Reichs-Waffenarsenal'],
      { income: 0, upkeep: 8, population: 0, production: 8, defense: 25, morale: 2 },
      { def: 2.1, prod: 1.8 }
    )
  },
  torhaus: {
    category: 'torhaus',
    group: 'militaer',
    name: 'Torhaus & Fallgitter',
    shortDesc: 'Kontrollierter Hauptzugang zur Siedlung mit Zugbrücke, Zinnen und Wachstube.',
    color: '#475569',
    stroke: '#0f172a',
    accentColor: '#ef4444',
    size: 20,
    levels: createLevelHierarchy(
      'Torhaus',
      ['Einfaches Stadttor', 'Verstärktes Barbakane-Tor', 'Zwillings-Turmtor', 'Festungstor mit Zugbrücke', 'Monumentales Prunk-Torhaus'],
      { income: 8, upkeep: 5, population: 6, production: 0, defense: 28, morale: 2 },
      { def: 2.2, inc: 1.8 }
    )
  },
  mauer: {
    category: 'mauer',
    group: 'militaer',
    name: 'Befestigung & Stadtmauer',
    shortDesc: 'Wehrgang mit Schießscharten zum Schutz der Bürger vor Überfällen.',
    color: '#334155',
    stroke: '#0f172a',
    accentColor: '#94a3b8',
    size: 16,
    levels: createLevelHierarchy(
      'Stadtmauer',
      ['Holzpalisade', 'Steinmauer', 'Doppelter Wehrgang', 'Gezinnte Festungsmauer', 'Uneinnehmbarer Schildwall'],
      { income: 0, upkeep: 4, population: 0, production: 0, defense: 22, morale: 4 },
      { def: 2.3, mor: 1.8 }
    )
  },

  // === HAFEN & SEEAHRT ===
  hafen: {
    category: 'hafen',
    group: 'hafen',
    name: 'Anlegesteg & Kai',
    shortDesc: 'Ladekräne und Kaianlagen für Frachtsegler, Fischerboote und Handelsschiffe.',
    color: '#0369a1',
    stroke: '#0c4a6e',
    accentColor: '#38bdf8',
    size: 22,
    levels: createLevelHierarchy(
      'Hafenbecken',
      ['Holz-Anlegesteg', 'Steinerner Frachtkai', 'Handelshafen mit Kränen', 'Großer Seehafen', 'Kaiserlicher Tiefseehafen'],
      { income: 24, upkeep: 6, population: 6, production: 12, defense: 4, morale: 4 },
      { inc: 2.2, prod: 1.9 }
    )
  },
  werft: {
    category: 'werft',
    group: 'hafen',
    name: 'Schiffswerft & Trockendock',
    shortDesc: 'Bau und Ausbesserung von Handelsschiffen, Galeeren und Kriegskavellen.',
    color: '#0284c7',
    stroke: '#082f49',
    accentColor: '#7dd3fc',
    size: 22,
    levels: createLevelHierarchy(
      'Werft',
      ['Bootsbucht', 'Schiffszimmerei', 'Große Werft & Slipanlage', 'Kriegsschiff-Werft', 'Königliches Trockendock'],
      { income: 16, upkeep: 8, population: 4, production: 18, defense: 6, morale: 3 },
      { prod: 2.3, inc: 1.9 }
    )
  },
  zollhaus: {
    category: 'zollhaus',
    group: 'hafen',
    name: 'See-Zollhaus & Hafenmeisterei',
    shortDesc: 'Erhebung von Liegegebühren, Hafenzöllen und Schiffsinspektionen.',
    color: '#0e7490',
    stroke: '#164e63',
    accentColor: '#22d3ee',
    size: 17,
    levels: createLevelHierarchy(
      'Zollhaus',
      ['Hafenmeister-Büro', 'Zollinspektion', 'Kaufmännisches Zollamt', 'Große Hafenmeisterei', 'Admiralitäts-Zollpalast'],
      { income: 30, upkeep: 6, population: 4, production: 0, defense: 2, morale: 2 },
      { inc: 2.3 }
    )
  },
  leuchtturm: {
    category: 'leuchtturm',
    group: 'hafen',
    name: 'Leuchtturm & Signalfeuer',
    shortDesc: 'Weithin sichtbares Leuchtfeuer zur sicheren Navigation vor Untiefen.',
    color: '#0284c7',
    stroke: '#0c4a6e',
    accentColor: '#facc15',
    size: 16,
    levels: createLevelHierarchy(
      'Leuchtturm',
      ['Signalfeuer-Korb', 'Steinerner Leuchtturm', 'Optischer Spiegelturm', 'Großer Koloss-Leuchtturm', 'Magischer Astralleuchtturm'],
      { income: 10, upkeep: 4, population: 2, production: 0, defense: 8, morale: 5 },
      { mor: 2.0, def: 1.8 }
    )
  },

  // === VERWALTUNG, KULTUR & GLAUBE ===
  rathaus: {
    category: 'rathaus',
    group: 'kultur_verwaltung',
    name: 'Rathaus & Stadtrat',
    shortDesc: 'Sitz der Stadträte, Bürgermeister und Richter zur Steuerung aller Siedlungsgeschäfte.',
    color: '#4338ca',
    stroke: '#1e1b4b',
    accentColor: '#818cf8',
    size: 26,
    levels: createLevelHierarchy(
      'Rathaus',
      ['Gemeindehaus', 'Stadtratshaus', 'Großes Bürger-Rathaus', 'Prachtvolles Reichsrathaus', 'Palast der Republik'],
      { income: 20, upkeep: 10, population: 10, production: 4, defense: 10, morale: 8 },
      { inc: 2.0, mor: 2.2, def: 1.6 }
    )
  },
  tempel: {
    category: 'tempel',
    group: 'kultur_verwaltung',
    name: 'Tempel & Heiligtum',
    shortDesc: 'Andachtsstätte für Götter und Schutzpatrone mit Priesterschaft und Altären.',
    color: '#0284c7',
    stroke: '#0c4a6e',
    accentColor: '#67e8f9',
    size: 22,
    levels: createLevelHierarchy(
      'Tempel',
      ['Dorffried / Schrein', 'Kapelle', 'Großer Tempel', 'Prächtiges Heiligtum', 'Großtempel der Götter'],
      { income: 8, upkeep: 4, population: 6, production: 0, defense: 4, morale: 12 },
      { mor: 2.3, inc: 1.6 }
    )
  },
  kathedrale: {
    category: 'kathedrale',
    group: 'kultur_verwaltung',
    name: 'Große Kathedrale & Basilika',
    shortDesc: 'Monumentales Wunderwerk der Architektur mit Glockentürmen, Pilgerströmen und Reliquien.',
    color: '#6366f1',
    stroke: '#312e81',
    accentColor: '#a5b4fc',
    size: 28,
    levels: createLevelHierarchy(
      'Kathedrale',
      ['Bischofskirche', 'Große Basilika', 'Monumentale Kathedrale', 'Erzbischöflicher Dom', 'Kaiserdom der Ewigkeit'],
      { income: 25, upkeep: 14, population: 12, production: 0, defense: 8, morale: 22 },
      { mor: 2.5, inc: 2.0 }
    )
  },
  badehaus: {
    category: 'badehaus',
    group: 'kultur_verwaltung',
    name: 'Badehaus & Therme',
    shortDesc: 'Dampfbäder, Massagebecken und Erholungsort zur Steigerung von Hygiene und Wohlbefinden.',
    color: '#06b6d4',
    stroke: '#164e63',
    accentColor: '#67e8f9',
    size: 18,
    levels: createLevelHierarchy(
      'Badehaus',
      ['Badezuber-Stube', 'Bürgerliches Badehaus', 'Große Thermenanlage', 'Prunkvolle Marmortherme', 'Kaiserpalast-Bäder'],
      { income: 14, upkeep: 5, population: 4, production: 0, defense: 0, morale: 10 },
      { mor: 2.2, inc: 1.9 }
    )
  },
  bibliothek: {
    category: 'bibliothek',
    group: 'kultur_verwaltung',
    name: 'Bibliothek & Gelehrtenschule',
    shortDesc: 'Sammlung alter Folianten, Chroniken, Kartensammlungen und Bildungsstätte.',
    color: '#4f46e5',
    stroke: '#1e1b4b',
    accentColor: '#a5b4fc',
    size: 20,
    levels: createLevelHierarchy(
      'Bibliothek',
      ['Skriptorium', 'Gelehrtenschule', 'Große Stadtbibliothek', 'Akademie der Wissenschaften', 'Großes Arkanum'],
      { income: 10, upkeep: 8, population: 4, production: 6, defense: 2, morale: 12 },
      { mor: 2.3, prod: 1.9 }
    )
  },
  park: {
    category: 'park',
    group: 'kultur_verwaltung',
    name: 'Stadtpark & Turnieranger',
    shortDesc: 'Grüne Oase, Statuengärten, Brunnenanlagen und Platz für Ritterturniere.',
    color: '#15803d',
    stroke: '#064e3b',
    accentColor: '#4ade80',
    size: 22,
    levels: createLevelHierarchy(
      'Park',
      ['Dorfanger', 'Bürgerpark', 'Lustgarten & Fontäne', 'Schlossgarten & Orangerie', 'Kaiserlicher Lusthain & Turnierplatz'],
      { income: 5, upkeep: 3, population: 0, production: 2, defense: 0, morale: 14 },
      { mor: 2.4 }
    )
  }
};

/**
 * Calculates real-time economic stats for a single building based on its level & status
 */
export function getBuildingStats(building: LocalBuildingSymbol): BuildingEconomyStats {
  const def = BUILDING_CATALOG[building.category] || BUILDING_CATALOG.wohnen_einfach;
  const currentLvl = Math.max(1, Math.min(5, building.level || 1));
  const lvlDef = def.levels[currentLvl - 1] || def.levels[0];
  const base = { ...lvlDef.stats };

  // Status Modifiers
  switch (building.status) {
    case 'im_bau':
      // Under construction: 0 income, 50% upkeep, 0 pop, 0 prod, 20% def, 0 morale
      return {
        income: 0,
        upkeep: Math.round(base.upkeep * 0.5),
        population: 0,
        production: 0,
        defense: Math.round(base.defense * 0.2),
        morale: 1
      };
    case 'beschaedigt':
      // Damaged: 40% income, full upkeep, 50% pop, 40% prod, 40% def, -50% morale
      return {
        income: Math.round(base.income * 0.4),
        upkeep: base.upkeep,
        population: Math.round(base.population * 0.5),
        production: Math.round(base.production * 0.4),
        defense: Math.round(base.defense * 0.4),
        morale: Math.max(0, Math.round(base.morale * 0.4))
      };
    case 'zerstoert':
      // Destroyed / Ruin: 0 income, 0 upkeep, 0 pop, 0 prod, 0 def, negative morale impact
      return {
        income: 0,
        upkeep: 0,
        population: 0,
        production: 0,
        defense: 0,
        morale: -Math.max(2, Math.round(base.morale * 0.5))
      };
    case 'aktiv':
    default:
      return base;
  }
}

export interface TownEconomySummary {
  totalIncome: number;
  totalUpkeep: number;
  netIncome: number;
  totalPopulation: number;
  totalProduction: number;
  totalDefense: number;
  totalMorale: number;
  counts: {
    total: number;
    active: number;
    underConstruction: number;
    damaged: number;
    destroyed: number;
  };
}

/**
 * Calculates aggregated town economics from all placed buildings
 */
export function calculateTownEconomy(buildings: LocalBuildingSymbol[]): TownEconomySummary {
  const summary: TownEconomySummary = {
    totalIncome: 0,
    totalUpkeep: 0,
    netIncome: 0,
    totalPopulation: 0,
    totalProduction: 0,
    totalDefense: 0,
    totalMorale: 0,
    counts: {
      total: buildings.length,
      active: 0,
      underConstruction: 0,
      damaged: 0,
      destroyed: 0
    }
  };

  buildings.forEach(b => {
    const stats = getBuildingStats(b);
    summary.totalIncome += stats.income;
    summary.totalUpkeep += stats.upkeep;
    summary.totalPopulation += stats.population;
    summary.totalProduction += stats.production;
    summary.totalDefense += stats.defense;
    summary.totalMorale += stats.morale;

    if (b.status === 'im_bau') summary.counts.underConstruction++;
    else if (b.status === 'beschaedigt') summary.counts.damaged++;
    else if (b.status === 'zerstoert') summary.counts.destroyed++;
    else summary.counts.active++;
  });

  summary.netIncome = summary.totalIncome - summary.totalUpkeep;
  return summary;
}
