import { 
  EconomyHolding, 
  EconomicUnitCategory,
  EconomyResource, 
  EconomyTask, 
  EconomyDuty, 
  EconomyRole, 
  EconomyStaffGroup, 
  EconomyOrder, 
  EconomyDecision, 
  EconomyLogEntry,
  HoldingRoom 
} from '../../types';

export interface HoldingTypePreset {
  type: EconomyHolding['type'];
  category: EconomicUnitCategory;
  label: string;
  icon: string;
  defaultIncome: number;
  defaultUpkeep: number;
  description: string;
}

export const HOLDING_TYPES: HoldingTypePreset[] = [
  // -------------------------------------------------------------
  // 1. WIRTSCHAFTLICHE EINHEITEN: BETRIEBE
  // -------------------------------------------------------------
  { 
    type: 'taverne', 
    category: 'betrieb',
    label: 'Taverne / Schänke', 
    icon: 'Beer', 
    defaultIncome: 160, 
    defaultUpkeep: 35, 
    description: 'Ausschank, Verpflegung, Geselligkeit und lokale Gerüchtebörse.' 
  },
  { 
    type: 'gasthaus', 
    category: 'betrieb',
    label: 'Gasthaus / Schankwirtschaft', 
    icon: 'Hotel', 
    defaultIncome: 200, 
    defaultUpkeep: 45, 
    description: 'Gastwirtschaft mit Schankraum, Gästezimmern und warmer Küche.' 
  },
  { 
    type: 'schmiede', 
    category: 'betrieb',
    label: 'Schmiede / Waffenschmiede', 
    icon: 'Hammer', 
    defaultIncome: 240, 
    defaultUpkeep: 50, 
    description: 'Herstellung und Instandsetzung von Waffen, Rüstungen und Werkzeugen.' 
  },
  { 
    type: 'baeckerei', 
    category: 'betrieb',
    label: 'Bäckerei / Mühle', 
    icon: 'Bread', 
    defaultIncome: 150, 
    defaultUpkeep: 30, 
    description: 'Mehlverarbeitung, Backwaren und Grundnahrungsversorgung.' 
  },
  { 
    type: 'werkstatt', 
    category: 'betrieb',
    label: 'Handwerkswerkstatt / Atelier', 
    icon: 'Wrench', 
    defaultIncome: 220, 
    defaultUpkeep: 45, 
    description: 'Handwerkliche Maßanfertigungen, Feinmechanik und Reparaturen.' 
  },
  { 
    type: 'manufaktur', 
    category: 'betrieb',
    label: 'Manufaktur / Weberei', 
    icon: 'Cutter', 
    defaultIncome: 280, 
    defaultUpkeep: 60, 
    description: 'Serielle Veredelung von Textilien, Leder, Glas oder Keramik.' 
  },
  { 
    type: 'magierladen', 
    category: 'betrieb',
    label: 'Magierladen / Alchemielabor', 
    icon: 'FlaskConical', 
    defaultIncome: 340, 
    defaultUpkeep: 80, 
    description: 'Tränke, Schriftrollen, seltene Reagenzien und arkane Artefakte.' 
  },

  // -------------------------------------------------------------
  // 2. WIRTSCHAFTLICHE EINHEITEN: PRODUKTION
  // -------------------------------------------------------------
  { 
    type: 'bauernhof', 
    category: 'produktion',
    label: 'Bauernhof / Agrarbetrieb', 
    icon: 'Wheat', 
    defaultIncome: 210, 
    defaultUpkeep: 40, 
    description: 'Getreideanbau, Feldfrüchte, Nutztierhaltung und Rohstoffgewinnung.' 
  },
  { 
    type: 'mine', 
    category: 'produktion',
    label: 'Mine / Steinbruch', 
    icon: 'Pickaxe', 
    defaultIncome: 520, 
    defaultUpkeep: 110, 
    description: 'Abbau von Erzen, Kohle, Edelsteinen und mineralischem Baumaterial.' 
  },
  { 
    type: 'saegewerk', 
    category: 'produktion',
    label: 'Sägewerk / Holzlager', 
    icon: 'Axe', 
    defaultIncome: 250, 
    defaultUpkeep: 55, 
    description: 'Holzeinschlag, Stammverarbeitung und Bauholz für Siedlungen.' 
  },
  { 
    type: 'fischerei', 
    category: 'produktion',
    label: 'Fischerei / Räucherei', 
    icon: 'Fish', 
    defaultIncome: 190, 
    defaultUpkeep: 35, 
    description: 'Fischfang, Reusenwirtschaft, Salzfisch und Fischverarbeitung.' 
  },

  // -------------------------------------------------------------
  // 3. WIRTSCHAFTLICHE EINHEITEN: HANDEL & DIENSTLEISTUNGEN
  // -------------------------------------------------------------
  { 
    type: 'markt', 
    category: 'handel',
    label: 'Marktstand / Basar', 
    icon: 'Tent', 
    defaultIncome: 260, 
    defaultUpkeep: 45, 
    description: 'Warenbörse, Direktverkauf und Umschlag regionaler Güter.' 
  },
  { 
    type: 'haendler', 
    category: 'handel',
    label: 'Handelskontor / Warenhaus', 
    icon: 'CircleDollarSign', 
    defaultIncome: 380, 
    defaultUpkeep: 80, 
    description: 'Warenimport, Exportkontrakte, Fernhandel und Großlagerung.' 
  },
  { 
    type: 'herberge', 
    category: 'handel',
    label: 'Herberge / Gästehaus', 
    icon: 'Bed', 
    defaultIncome: 180, 
    defaultUpkeep: 40, 
    description: 'Reisendenunterkunft mit Schlafsälen, Einzelkammern und Stallung.' 
  },
  { 
    type: 'werft', 
    category: 'handel',
    label: 'Werft / Trockendock', 
    icon: 'Anchor', 
    defaultIncome: 490, 
    defaultUpkeep: 115, 
    description: 'Schiffsbau, Takelage, Rumpfinstandsetzung und Ausrüstung.' 
  },
  { 
    type: 'hafenbetrieb', 
    category: 'handel',
    label: 'Hafenbetrieb / Zollstation', 
    icon: 'Ship', 
    defaultIncome: 430, 
    defaultUpkeep: 95, 
    description: 'Kai-Liegeplätze, Entladestationen, Hafenzoll und Logistik.' 
  },
  { 
    type: 'schiff', 
    category: 'handel',
    label: 'Handelsschiff / Frachtsegler', 
    icon: 'Sailboat', 
    defaultIncome: 460, 
    defaultUpkeep: 125, 
    description: 'Seetransport, Frachtkontrakte, Handelsexpeditionen und Frachtraum.' 
  },
  { 
    type: 'gilde', 
    category: 'handel',
    label: 'Zunfthaus / Handelsgilde', 
    icon: 'Scale', 
    defaultIncome: 420, 
    defaultUpkeep: 85, 
    description: 'Zunftverwaltung, Marktregeln, Meisterbriefe und Standeskasse.' 
  },

  // -------------------------------------------------------------
  // 4. GEBÄUDE / ANWESEN
  // -------------------------------------------------------------
  { 
    type: 'wohnhaus', 
    category: 'gebaeude_anwesen',
    label: 'Wohnhaus / Bürgerhaus', 
    icon: 'Home', 
    defaultIncome: 50, 
    defaultUpkeep: 15, 
    description: 'Privater Wohnsitz für Bewohner, Hausstand und persönliche Vorräte.' 
  },
  { 
    type: 'rathaus', 
    category: 'gebaeude_anwesen',
    label: 'Rathaus / Verwaltungssitz', 
    icon: 'Landmark', 
    defaultIncome: 280, 
    defaultUpkeep: 90, 
    description: 'Ortsverwaltung, Schreiberstube, Archiv, Gerichtssaal und Standesamt.' 
  },
  { 
    type: 'gutshof', 
    category: 'gebaeude_anwesen',
    label: 'Gutshof / Landwirtschaftsanwesen', 
    icon: 'Trees', 
    defaultIncome: 310, 
    defaultUpkeep: 65, 
    description: 'Herrschaftliches Gehöft mit Hauptgebäude, Gesindeunterkünften und Scheunen.' 
  },
  { 
    type: 'herrenhaus', 
    category: 'gebaeude_anwesen',
    label: 'Herrenhaus / Landsitz', 
    icon: 'Building', 
    defaultIncome: 350, 
    defaultUpkeep: 80, 
    description: 'Repräsentatives Landsitz-Anwesen mit Salon, Gesindeflügel und Parkanlage.' 
  },
  { 
    type: 'burg', 
    category: 'gebaeude_anwesen',
    label: 'Burg / Wehrfestung', 
    icon: 'Shield', 
    defaultIncome: 480, 
    defaultUpkeep: 130, 
    description: 'Befestigte Wehranlage mit Bergfried, Mauern, Kaserne und Zeughaus.' 
  },
  { 
    type: 'schloss', 
    category: 'gebaeude_anwesen',
    label: 'Schloss / Residenz', 
    icon: 'Castle', 
    defaultIncome: 580, 
    defaultUpkeep: 150, 
    description: 'Herrschaftlicher Prachtbau mit Thronsaal, Gemächern und Verwaltungskanzlei.' 
  },
  { 
    type: 'lagerhaus', 
    category: 'gebaeude_anwesen',
    label: 'Lagerhaus / Speicher', 
    icon: 'Boxes', 
    defaultIncome: 180, 
    defaultUpkeep: 40, 
    description: 'Schutzsicherer Speicher für Schüttgüter, Kisten, Ballen und Vorräte.' 
  },
  { 
    type: 'anwesen', 
    category: 'gebaeude_anwesen',
    label: 'Anwesen / Landsitz', 
    icon: 'Home', 
    defaultIncome: 320, 
    defaultUpkeep: 70, 
    description: 'Klassisches Anwesen mit Wohngebäude, Pachtland und Wirtschaftsflügel.' 
  },
  { 
    type: 'adelssitz', 
    category: 'gebaeude_anwesen',
    label: 'Adelssitz / Stadtpalais', 
    icon: 'Church', 
    defaultIncome: 450, 
    defaultUpkeep: 120, 
    description: 'Innerstädtischer Adelspalast mit Dienerstab, Festsaal und Salon.' 
  },
  { 
    type: 'fraktionsgebaeude', 
    category: 'gebaeude_anwesen',
    label: 'Fraktionssitz / Ordenshaus', 
    icon: 'Flag', 
    defaultIncome: 390, 
    defaultUpkeep: 90, 
    description: 'Stützpunkt einer Fraktion mit Ratsstube, Zeughaus und Quartieren.' 
  },

  // -------------------------------------------------------------
  // BENUTZERDEFINIERT
  // -------------------------------------------------------------
  { 
    type: 'custom', 
    category: 'betrieb',
    label: 'Benutzerdefinierte Einheit', 
    icon: 'Settings', 
    defaultIncome: 150, 
    defaultUpkeep: 30, 
    description: 'Individuell gestaltete wirtschaftliche oder bauliche Einheit.' 
  }
];

import { EXPANDED_AUTHORITIES, ALL_AUTHORITY_NAMES } from '../../lib/professionAuthoritiesData';

export const STANDARD_AUTHORITIES = ALL_AUTHORITY_NAMES;

export const AUTHORITY_DUTIES_MAP: Record<string, string> = {
  'Tagesgeschäft leiten': 'Operative Leitung und Koordination des laufenden Tagesgeschäfts',
  'Preise festlegen': 'Festlegung und Überwachung der Preis- und Gebührenstrukturen',
  'Personal einstellen & entlassen': 'Personalplanung, Rekrutierung und Mitarbeiterführung',
  'Aufgaben & Pflichten delegieren': 'Zuweisung, Steuerung und Überprüfung von Arbeitsaufgaben',
  'Aufträge vergeben & annehmen': 'Prüfung, Vergabe und Abnahme von Arbeits- und Lieferaufträgen',
  'Lagerbestände & Einkauf verwalten': 'Warenwirtschaft, Bestandskontrolle und Rohstoffbeschaffung',
  'Budget & Finanzen freigeben': 'Finanzkontrolle, Buchungsprüfung und Freigabe von Betriebsmitteln',
  'Ausbauten & Upgrades anordnen': 'Planung und Beaufsichtigung baulicher Erweiterungen und Reparaturen',
  'Hausrecht & Sicherheit durchsetzen': 'Sicherheitskontrollen, Durchsetzung der Ordnung und des Hausrechts',
  'Gewinne entnehmen': 'Abrechnung und Verwaltung von Betriebsüberschüssen',
  'Verhandlungen führen': 'Verhandlungsführung mit Handelspartnern, Kunden und Behörden',
  'Betriebsbeschlüsse fassen': 'Entscheidungsfindung bei betrieblichen Grundsatzfragen',
  'Qualitätskontrolle & Werkabnahme': 'Qualitätsprüfung und finale Abnahme von Erzeugnissen, Rezepturen und Arbeiten',
  'Ausbildung & Lehrlingsaufsicht': 'Fachliche Unterweisung, Prüfungsvorbereitung und Aufsicht von Auszubildenden',
  'Dienst- & Schichtpläne anordnen': 'Verbindliche Festlegung der Dienst-, Wach- und Küchenpläne',
  'Schlüsselgewalt & Lagerzugang': 'Führung der Hauptschlüssel für Kassen, Vorratskammern und Archive',
  'Disziplinar- & Rügegewalt': 'Verhängung von Verweisen, Dienststrafen und Disziplinarmaßnahmen',
  'Gilden- & Zunftvertretung': 'Offizielle Standesvertretung vor Gilden, Zünften und Behörden',
  'Rezeptur- & Werkgeheimnisse hüten': 'Wahrung und Verwaltung von Meisterrezepturen, Legierungen und Formeln',
  'Notfall- & Evakuierungskommando': 'Befehlsgewalt bei Notfällen, Brandbekämpfung, Seuchen oder Verteidigung'
};

export interface DefaultJobPosition {
  name: string;
  workplaceArea: string;
  salary: number;
  responsibilities: string[];
  authorities?: string[];
}

/**
 * Liefert Standardräume passend zum Betriebs- / Gebäudetyp und der gewählten Größe.
 */
export const getDefaultRoomsForHolding = (type: string, size: string = 'Mittel'): HoldingRoom[] => {
  const normSize = (size || 'Mittel').toLowerCase();
  const isKlein = normSize.includes('klein');
  const isGross = normSize.includes('groß') || normSize.includes('gross');
  const isMonumental = normSize.includes('monumental') || normSize.includes('riesig');

  switch (type) {
    case 'taverne':
    case 'gasthaus':
    case 'herberge':
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Schankraum & Gaststube', count: 1, purpose: 'Ausschank & Bewirtung (ca. 15 Gäste)' },
          { id: 'room-2', name: 'Kleine Küche', count: 1, purpose: 'Einfache Speisenzubereitung' },
          { id: 'room-3', name: 'Schlafzimmer für Gäste', count: 2, purpose: 'Gästeunterkunft' },
          { id: 'room-4', name: 'Schlafzimmer für Personal', count: 1, purpose: 'Personalunterkunft' },
          { id: 'room-5', name: 'Vorratskammer', count: 1, purpose: 'Lebensmittel- & Faßlager' }
        ];
      }
      if (isGross) {
        return [
          { id: 'room-1', name: 'Großer Schankraum', count: 1, purpose: 'Hauptgaststube (ca. 80 Gäste)' },
          { id: 'room-2', name: 'Separater Festsaal / Clubzimmer', count: 1, purpose: 'Gesellschaften & geschlossene Runden' },
          { id: 'room-3', name: 'Großküche & Backstube', count: 1, purpose: 'Warme Küche & Vorbereitung' },
          { id: 'room-4', name: 'Schlafzimmer für Gäste', count: 12, purpose: 'Gästeunterkunft (Einzel- & Doppelzimmer)' },
          { id: 'room-5', name: 'Schlafzimmer für Personal', count: 5, purpose: 'Personalunterkunft' },
          { id: 'room-6', name: 'Gewölbekeller für Bier & Vorräte', count: 1, purpose: 'Fässer, Weine & Kühlung' },
          { id: 'room-7', name: 'Pferdestall & Kutschenremise', count: 1, purpose: 'Gastpferde & Reisewagen' },
          { id: 'room-8', name: 'Büro des Wirts / Schreibstube', count: 1, purpose: 'Buchführung & Kasse' }
        ];
      }
      if (isMonumental) {
        return [
          { id: 'room-1', name: 'Prunkvoller Hauptsaal', count: 1, purpose: 'Großbewirtung & Festlichkeiten (150+ Gäste)' },
          { id: 'room-2', name: 'Nebensäle & Séparées', count: 2, purpose: 'Exklusive Runden & VIP-Gäste' },
          { id: 'room-3', name: 'Großgastronomieküche mit Kühlkellern', count: 1, purpose: 'Vollgastronomie' },
          { id: 'room-4', name: 'Schlafzimmer für Gäste (Suiten)', count: 25, purpose: 'Gästeunterkunft gehobener Güte' },
          { id: 'room-5', name: 'Schlafzimmer für Personal', count: 10, purpose: 'Personalunterkunft' },
          { id: 'room-6', name: 'Große Hausbrauerei & Weinkeller', count: 1, purpose: 'Braustube & Großlager' },
          { id: 'room-7', name: 'Große Stallung & Wagenhalle', count: 1, purpose: 'Gespann- & Pferdewechsel' },
          { id: 'room-8', name: 'Direktionskontor & Geldkammer', count: 1, purpose: 'Geschäftsleitung' },
          { id: 'room-9', name: 'Badehaus & Waschküche', count: 1, purpose: 'Gästekomfort & Wäscheservice' }
        ];
      }
      // Mittel (Standard) - Vorgabe: 1 Küche, 5 Gästezimmer, 3 Personalzimmer etc.
      return [
        { id: 'room-1', name: 'Schankraum & Gaststube', count: 1, purpose: 'Ausschank & Bewirtung (ca. 40 Gäste)' },
        { id: 'room-2', name: 'Küche', count: 1, purpose: 'Speisenzubereitung' },
        { id: 'room-3', name: 'Schlafzimmer für Gäste', count: 5, purpose: 'Gästeunterkunft' },
        { id: 'room-4', name: 'Schlafzimmer für Personal', count: 3, purpose: 'Personalunterkunft' },
        { id: 'room-5', name: 'Vorratskeller & Bierlager', count: 1, purpose: 'Fässer & Vorräte' },
        { id: 'room-6', name: 'Pferdestall & Innenhof', count: 1, purpose: 'Reittiere der Reisenden' }
      ];

    case 'schmiede':
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Werkstatt mit Esse & Amboss', count: 1, purpose: 'Schmiedearbeiten' },
          { id: 'room-2', name: 'Werkzeug- & Kohlelager', count: 1, purpose: 'Brennstoff & Arbeitsgeräte' },
          { id: 'room-3', name: 'Wohnstube des Schmieds', count: 1, purpose: 'Wohnbereich' }
        ];
      }
      if (isGross) {
        return [
          { id: 'room-1', name: 'Grobschmiede & Hufbeschlag', count: 1, purpose: 'Werkzeuge & Hufeisen' },
          { id: 'room-2', name: 'Waffenschmiede & Feinarbeit', count: 1, purpose: 'Klingen & Rüstungsteile' },
          { id: 'room-3', name: 'Gießerei & Härtebecken', count: 1, purpose: 'Guss & thermische Härtung' },
          { id: 'room-4', name: 'Großes Material- & Erzlager', count: 1, purpose: 'Barren & Kohlevorräte' },
          { id: 'room-5', name: 'Waffenkammer & Ausstellungsraum', count: 1, purpose: 'Verkauf & Kundenpräsentation' },
          { id: 'room-6', name: 'Schlafzimmer für Gesellen & Knechte', count: 4, purpose: 'Personalunterkunft' },
          { id: 'room-7', name: 'Meisterwohnung & Schreibstube', count: 1, purpose: 'Leitung & Buchhaltung' }
        ];
      }
      if (isMonumental) {
        return [
          { id: 'room-1', name: 'Große Rüstungsschmiede & Zeughaus', count: 1, purpose: 'Serienfertigung von Rüstzeug' },
          { id: 'room-2', name: 'Waffenmanufaktur', count: 1, purpose: 'Schwerter, Stangenwaffen, Schilde' },
          { id: 'room-3', name: 'Erzschmelze & Großhochofen', count: 1, purpose: 'Erzveredelung' },
          { id: 'room-4', name: 'Zentralmagazin für Metalle & Kohle', count: 2, purpose: 'Rohstoffdepots' },
          { id: 'room-5', name: 'Schlafzimmer für Handwerker & Gesellen', count: 8, purpose: 'Personalunterkunft' },
          { id: 'room-6', name: 'Verwaltungskanzlei & Prüfstelle', count: 1, purpose: 'Güteprüfung & Auftragsvergabe' }
        ];
      }
      // Mittel (Standard)
      return [
        { id: 'room-1', name: 'Hauptschmiede (2 Essen, 2 Ambosse)', count: 1, purpose: 'Tagesproduktion & Reparaturen' },
        { id: 'room-2', name: 'Material- & Kohlebunker', count: 1, purpose: 'Rohstoffe & Brennmaterial' },
        { id: 'room-3', name: 'Verkaufs- & Schauraum', count: 1, purpose: 'Warenpräsentation & Auftragsannahme' },
        { id: 'room-4', name: 'Schlafzimmer für Gesellen', count: 2, purpose: 'Personalunterkunft' },
        { id: 'room-5', name: 'Beschlagplatz im Hof', count: 1, purpose: 'Pferdebeschlag & Wagenräder' }
      ];

    case 'baeckerei':
    case 'muehle':
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Backstube mit Steinofen', count: 1, purpose: 'Teigbereitung & Backen' },
          { id: 'room-2', name: 'Verkaufsladen', count: 1, purpose: 'Theke & Warenausgabe' },
          { id: 'room-3', name: 'Mehl- & Vorratskammer', count: 1, purpose: 'Zutatenlager' }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { id: 'room-1', name: 'Großbackstube mit 3 Backöfen', count: 1, purpose: 'Großproduktion von Brot & Gebäck' },
          { id: 'room-2', name: 'Konditorei & Feingebäck-Stube', count: 1, purpose: 'Spezialitäten & Kuchen' },
          { id: 'room-3', name: 'Großer Verkaufsraum & Probierstube', count: 1, purpose: 'Kundenbedienung' },
          { id: 'room-4', name: 'Mehl- & Getreidesilo', count: 2, purpose: 'Rohstoffsicherung' },
          { id: 'room-5', name: 'Schlafzimmer für Bäckergesellen', count: 4, purpose: 'Personalunterkunft' },
          { id: 'room-6', name: 'Expedition & Auslieferungshof', count: 1, purpose: 'Beladung von Marktkarren' }
        ];
      }
      return [
        { id: 'room-1', name: 'Backstube mit 2 Backöfen', count: 1, purpose: 'Tagesproduktion' },
        { id: 'room-2', name: 'Verkaufsraum mit Theke', count: 1, purpose: 'Kundenbedienung & Kasse' },
        { id: 'room-3', name: 'Mehlkammer & Getreidelager', count: 1, purpose: 'Zutatenvorrat' },
        { id: 'room-4', name: 'Schlafzimmer für Bäcker & Gesellen', count: 2, purpose: 'Personalunterkunft' },
        { id: 'room-5', name: 'Holz- & Geräteschuppen', count: 1, purpose: 'Ofenholz & Mulden' }
      ];

    case 'bauernhof':
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Wohnstube & Bauernküche', count: 1, purpose: 'Wohnbereich der Bauernfamilie' },
          { id: 'room-2', name: 'Viehstall für Kleinvieh', count: 1, purpose: 'Hühner, Ziegen, Schwein' },
          { id: 'room-3', name: 'Heuboden & Gerätescheune', count: 1, purpose: 'Heu & Werkzeug' },
          { id: 'room-4', name: 'Erdkeller für Wurzelgemüse', count: 1, purpose: 'Wintervorräte' }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { id: 'room-1', name: 'Hof-Herrenhaus mit Gesindeküche', count: 1, purpose: 'Hauptwohnsitz & Verwaltung' },
          { id: 'room-2', name: 'Großstallungen (Rinder & Pferde)', count: 2, purpose: 'Nutztierhaltung' },
          { id: 'room-3', name: 'Schweinestall & Geflügelhof', count: 1, purpose: 'Zucht & Mast' },
          { id: 'room-4', name: 'Große Getreidescheune & Dreschplatz', count: 2, purpose: 'Erntegut' },
          { id: 'room-5', name: 'Schlafzimmer für Mägde & Knechte', count: 6, purpose: 'Personalunterkunft' },
          { id: 'room-6', name: 'Räucherkammer, Käserei & Mostkeller', count: 1, purpose: 'Veredelung von Hofgütern' },
          { id: 'room-7', name: 'Remise für Pflüge & Fuhrwerke', count: 1, purpose: 'Geräteunterstand' }
        ];
      }
      return [
        { id: 'room-1', name: 'Bauernhaus mit Wohnstube', count: 1, purpose: 'Wohnbereich & Speisekammer' },
        { id: 'room-2', name: 'Großviehställe', count: 1, purpose: 'Kühe & Arbeitspferde' },
        { id: 'room-3', name: 'Schweinestall & Hühnerstall', count: 1, purpose: 'Kleinvieh' },
        { id: 'room-4', name: 'Getreidescheune & Heulager', count: 1, purpose: 'Erntevorräte' },
        { id: 'room-5', name: 'Schlafzimmer für Mägde & Knechte', count: 3, purpose: 'Personalunterkunft' },
        { id: 'room-6', name: 'Vorrats- & Vorratskeller', count: 1, purpose: 'Haltbarmachung' }
      ];

    case 'mine':
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Mundloch & Förderstollen', count: 1, purpose: 'Erzabbau' },
          { id: 'room-2', name: 'Werkzeug- & Gezäheschuppen', count: 1, purpose: 'Spitzhacken, Lampen & Seile' },
          { id: 'room-3', name: 'Unterstand für Knappen', count: 1, purpose: 'Pausenraum & Schichtwechsel' }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { id: 'room-1', name: 'Hauptförderschächte & Tiefsohlen', count: 3, purpose: 'Untertageabbau' },
          { id: 'room-2', name: 'Zechenverwaltung & Kasse', count: 1, purpose: 'Schichtleitung & Lohnvergabe' },
          { id: 'room-3', name: 'Große Kaue mit Waschgelegenheit', count: 1, purpose: 'Umkleide & Mannschaftsraum' },
          { id: 'room-4', name: 'Erzaufbereitung & Pochwerk', count: 1, purpose: 'Zerkleinerung & Sortierung' },
          { id: 'room-5', name: 'Zechenschmiede & Zimmererwerkstatt', count: 1, purpose: 'Gezähe-Instandhaltung & Stützbalken' },
          { id: 'room-6', name: 'Schlafzimmer für Bergleute (Baracken)', count: 6, purpose: 'Knappschaftsquartiere' },
          { id: 'room-7', name: 'Großes Erzlager & Verladestation', count: 1, purpose: 'Abtransport' }
        ];
      }
      return [
        { id: 'room-1', name: 'Förderschacht & Hauptstrecke', count: 1, purpose: 'Erz- & Gesteinsförderung' },
        { id: 'room-2', name: 'Zechenkontor & Erzwaage', count: 1, purpose: 'Erfassung des Abbaus' },
        { id: 'room-3', name: 'Mannschaftskaue', count: 1, purpose: 'Aufenthalt & Ausrüstung' },
        { id: 'room-4', name: 'Erzlagerplatz im Freien', count: 1, purpose: 'Zwischenlagerung von Rohstein' },
        { id: 'room-5', name: 'Bergschmiede', count: 1, purpose: 'Schärfen von Meißeln & Hacken' },
        { id: 'room-6', name: 'Schlafzimmer für Bergleute', count: 2, purpose: 'Personalunterkunft' }
      ];

    case 'werkstatt':
    case 'atelier':
    case 'manufaktur':
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Werkstattraum mit Werkbank', count: 1, purpose: 'Handwerkliche Fertigung' },
          { id: 'room-2', name: 'Material- & Werkzeugkammer', count: 1, purpose: 'Lagerung' },
          { id: 'room-3', name: 'Wohnstube des Handwerkers', count: 1, purpose: 'Wohnbereich' }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { id: 'room-1', name: 'Große Werkhalle mit Spezialstationen', count: 2, purpose: 'Serienfertigung & Zuschnitt' },
          { id: 'room-2', name: 'Feinarbeits- & Veredelungsraum', count: 1, purpose: 'Präzisionshandwerk' },
          { id: 'room-3', name: 'Schauraum & Kundenkontor', count: 1, purpose: 'Musterstücke & Bestellungen' },
          { id: 'room-4', name: 'Großlager für Rohstoffe & Fertigwaren', count: 2, purpose: 'Logistik' },
          { id: 'room-5', name: 'Schlafzimmer für Gesellen & Arbeiter', count: 5, purpose: 'Personalunterkunft' },
          { id: 'room-6', name: 'Meisterbüro & Entwurfszimmer', count: 1, purpose: 'Pläne & Kalkulation' }
        ];
      }
      return [
        { id: 'room-1', name: 'Hauptwerkstatt mit Werkbänken', count: 1, purpose: 'Fertigung & Reparaturen' },
        { id: 'room-2', name: 'Material- & Rohstofflager', count: 1, purpose: 'Holz, Leder, Metalle' },
        { id: 'room-3', name: 'Schauraum & Auslage', count: 1, purpose: 'Verkauf' },
        { id: 'room-4', name: 'Schlafzimmer für Gesellen', count: 2, purpose: 'Personalunterkunft' },
        { id: 'room-5', name: 'Lagerplatz für Fertigwaren', count: 1, purpose: 'Versandbereit' }
      ];

    case 'magierladen':
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Kleiner Verkaufsraum & Kuriositätenecke', count: 1, purpose: 'Kundenkontakt' },
          { id: 'room-2', name: 'Alchemiekabinett & Destille', count: 1, purpose: 'Brauen von Tinkturen' },
          { id: 'room-3', name: 'Kräuterkammer', count: 1, purpose: 'Trocknen von Reagenzien' }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { id: 'room-1', name: 'Arkanes Verkaufskontor & Schauraum', count: 1, purpose: 'Artefakte & Spruchrollen' },
          { id: 'room-2', name: 'Meisterlaboratorium mit Abzugsanlage', count: 1, purpose: 'Komplexe Alchemie' },
          { id: 'room-3', name: 'Ritualkammer & Bannkreis', count: 1, purpose: 'Magische Verzauberungen & Prüfungen' },
          { id: 'room-4', name: 'Arkane Bibliothek & Skriptorium', count: 1, purpose: 'Schriftrollen kopieren & Forschen' },
          { id: 'room-5', name: 'Reagenzien- & Essenzengewölbe', count: 1, purpose: 'Gefahrstoffe & seltene Mineralien' },
          { id: 'room-6', name: 'Schlafzimmer für Adepten & Schüler', count: 4, purpose: 'Personalunterkunft' },
          { id: 'room-7', name: 'Magus-Gemach', count: 1, purpose: 'Leitung' }
        ];
      }
      return [
        { id: 'room-1', name: 'Verkaufs- & Beratungsstube', count: 1, purpose: 'Kundenannahme & Tränkeverkauf' },
        { id: 'room-2', name: 'Laboratorium mit 2 Arbeitsplätzen', count: 1, purpose: 'Tränke & Salben zubereiten' },
        { id: 'room-3', name: 'Kräuter- & Trockenspeicher', count: 1, purpose: 'Pflanzen, Wurzeln, Pilze' },
        { id: 'room-4', name: 'Verschlossene Gift- & Reagenzkammer', count: 1, purpose: 'Wertvolle Essenzen' },
        { id: 'room-5', name: 'Schlafzimmer für Adepten', count: 2, purpose: 'Personalunterkunft' }
      ];

    case 'burg':
    case 'adelssitz':
    case 'herrenhaus':
    case 'anwesen':
    case 'gutshof':
    case 'schloss':
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Kamin- & Speisestube', count: 1, purpose: 'Gemeinschaftsraum' },
          { id: 'room-2', name: 'Herrschaftliches Schlafgemach', count: 2, purpose: 'Herrschaftsunterkunft' },
          { id: 'room-3', name: 'Burgküche & Speisekammer', count: 1, purpose: 'Mahlzeiten' },
          { id: 'room-4', name: 'Schlafzimmer für Dienerschaft', count: 2, purpose: 'Personalunterkunft' },
          { id: 'room-5', name: 'Wachstube & Waffenkammer', count: 1, purpose: 'Verteidigung' }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { id: 'room-1', name: 'Großer Thronsaal & Bankettsaal', count: 1, purpose: 'Feste & Staatsgeschäfte' },
          { id: 'room-2', name: 'Empfangssalon & Audienzsaal', count: 1, purpose: 'Besucher & Bittsteller' },
          { id: 'room-3', name: 'Prunkvolle Gemächer & Suiten', count: 10, purpose: 'Herrschaftsfamilie & Ehrengäste' },
          { id: 'room-4', name: 'Herrschaftsküche mit Vorratsgewölben', count: 1, purpose: 'Bankette & Tafelrunden' },
          { id: 'room-5', name: 'Zeughaus & Kasernenflügel', count: 2, purpose: 'Burgbesatzung & Waffen' },
          { id: 'room-6', name: 'Schlafzimmer für Dienerschaft', count: 8, purpose: 'Personalunterkunft' },
          { id: 'room-7', name: 'Schlosskapelle / Andachtsraum', count: 1, purpose: 'Kult & Besinnung' },
          { id: 'room-8', name: 'Bibliothek & Kartenzimmer', count: 1, purpose: 'Wissen & Kriegspläne' },
          { id: 'room-9', name: 'Marstall & Kutschenhalle', count: 1, purpose: 'Edelpferde & Kutschen' },
          { id: 'room-10', name: 'Schatzkammer & Verliese', count: 1, purpose: 'Sicherheit' }
        ];
      }
      return [
        { id: 'room-1', name: 'Empfangs- & Rittersaal', count: 1, purpose: 'Repräsentation & Speisen' },
        { id: 'room-2', name: 'Herrschaftliche Gemächer', count: 4, purpose: 'Wohnbereich der Gutsherren' },
        { id: 'room-3', name: 'Schlossküche & Vorratskeller', count: 1, purpose: 'Speisenzubereitung' },
        { id: 'room-4', name: 'Waffenkammer & Wachstube', count: 1, purpose: 'Garde & Wehr' },
        { id: 'room-5', name: 'Schlafzimmer für Dienerschaft', count: 3, purpose: 'Personalunterkunft' },
        { id: 'room-6', name: 'Pferdestall & Remise', count: 1, purpose: 'Kutschen & Reittiere' }
      ];

    case 'haendler':
    case 'markt':
    case 'lagerhaus':
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Verkaufsraum mit Schaufenster / Stand', count: 1, purpose: 'Warenverkauf' },
          { id: 'room-2', name: 'Hinterer Lagerraum', count: 1, purpose: 'Warenkisten' },
          { id: 'room-3', name: 'Schreibstube & Kasse', count: 1, purpose: 'Buchführung' }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { id: 'room-1', name: 'Großes Handelskabinett & Börsensaal', count: 1, purpose: 'Großhandel & Verträge' },
          { id: 'room-2', name: 'Ladenlokal für Einzelkunden', count: 1, purpose: 'Direktverkauf' },
          { id: 'room-3', name: 'Mehrstöckiges Lagerhaus (Kisten, Ballen, Fässer)', count: 2, purpose: 'Großlager' },
          { id: 'room-4', name: 'Zoll- & Buchhaltungsbüro', count: 1, purpose: 'Finanzen' },
          { id: 'room-5', name: 'Schlafzimmer für Schreiber & Lagerknechte', count: 5, purpose: 'Personalunterkunft' },
          { id: 'room-6', name: 'Verladerampe & Fuhrparkremise', count: 1, purpose: 'Spedition' }
        ];
      }
      return [
        { id: 'room-1', name: 'Verkaufsraum mit Ladentresen', count: 1, purpose: 'Kundenbedienung' },
        { id: 'room-2', name: 'Warenlager mit Regalen & Paletten', count: 1, purpose: 'Warenlagerung' },
        { id: 'room-3', name: 'Schreibstube des Kaufmanns', count: 1, purpose: 'Kontor & Kasse' },
        { id: 'room-4', name: 'Schlafzimmer für Handlungsgehilfen', count: 2, purpose: 'Personalunterkunft' },
        { id: 'room-5', name: 'Ladehof für Karren', count: 1, purpose: 'Anlieferung' }
      ];

    default:
      if (isKlein) {
        return [
          { id: 'room-1', name: 'Hauptarbeitsraum', count: 1, purpose: 'Betriebstätigkeit' },
          { id: 'room-2', name: 'Material- & Vorratskammer', count: 1, purpose: 'Lager' },
          { id: 'room-3', name: 'Wohn- / Schlafraum', count: 1, purpose: 'Unterkunft' }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { id: 'room-1', name: 'Haupthalle / Betriebsraum', count: 2, purpose: 'Betriebstätigkeit' },
          { id: 'room-2', name: 'Verwaltungsbüro & Kasse', count: 1, purpose: 'Leitung' },
          { id: 'room-3', name: 'Großlager & Depot', count: 2, purpose: 'Waren & Vorräte' },
          { id: 'room-4', name: 'Schlafzimmer für Personal', count: 5, purpose: 'Personalunterkunft' },
          { id: 'room-5', name: 'Küche & Gemeinschaftsraum', count: 1, purpose: 'Versorgung' }
        ];
      }
      return [
        { id: 'room-1', name: 'Haupthalle / Betriebsraum', count: 1, purpose: 'Betriebstätigkeit' },
        { id: 'room-2', name: 'Schreibstube & Kasse', count: 1, purpose: 'Verwaltung' },
        { id: 'room-3', name: 'Lagerraum', count: 1, purpose: 'Material & Waren' },
        { id: 'room-4', name: 'Schlafzimmer für Mitarbeiter', count: 2, purpose: 'Personalunterkunft' }
      ];
  }
};

/**
 * Liefert Standard-Berufsbilder passend zum Betriebs- / Gebäudetyp UND der gewählten Größe.
 * Klein: 2-3 Stellen (Kompakt)
 * Mittel: 5-7 Stellen (Standard)
 * Groß: 9-12 Stellen (Erweitert)
 * Monumental: 14-18 Stellen (Großbetrieb)
 */
export const getDefaultJobPositionsForHoldingType = (
  type: EconomyHolding['type'], 
  size: string = 'Mittel'
): DefaultJobPosition[] => {
  const normSize = (size || 'Mittel').toLowerCase();
  const isKlein = normSize.includes('klein');
  const isGross = normSize.includes('groß') || normSize.includes('gross');
  const isMonumental = normSize.includes('monumental') || normSize.includes('riesig');

  switch (type) {
    case 'taverne':
      if (isKlein) {
        return [
          { name: 'Gastwirt / Schankwirt', workplaceArea: 'Schankraum & Kontor', salary: 25, responsibilities: ['Tagesgeschäft & Finanzen leiten', 'Ausschank & Einkauf'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben'] },
          { name: 'Schankmaid / Bedienung', workplaceArea: 'Gaststube', salary: 12, responsibilities: ['Gäste bedienen', 'Gläser spülen', 'Tische abwischen'] },
          { name: 'Küchenhilfe & Allrounder', workplaceArea: 'Küche & Lager', salary: 10, responsibilities: ['Einfache Speisen zubereiten', 'Holz holen', 'Saubermachen'] }
        ];
      }
      if (isGross) {
        return [
          { name: 'Gastwirt / Geschäftsführer', workplaceArea: 'Kontor & Festsaal', salary: 45, responsibilities: ['Gesamtleitung & Verträge', 'Finanz- & Personalplanung'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen', 'Preise festlegen'] },
          { name: 'Oberschankmaid / Saalchefin', workplaceArea: 'Großer Schankraum', salary: 24, responsibilities: ['Saalleitung', 'Gästeempfang & Kasse', 'Schichtaufsicht'], authorities: ['Tagesgeschäft leiten', 'Dienst- & Schichtpläne anordnen'] },
          { name: 'Küchenchef', workplaceArea: 'Großküche', salary: 28, responsibilities: ['Speisekarte gestalten', 'Große Gesellschaften bekochen', 'Einkauf leiten'], authorities: ['Qualitätskontrolle & Werkabnahme'] },
          { name: 'Beikoch / Bratenmeister', workplaceArea: 'Küche & Herd', salary: 18, responsibilities: ['Fleisch braten', 'Tagesgerichte kochen', 'Saucen zubereiten'] },
          { name: 'Erste Bedienung', workplaceArea: 'Schankraum', salary: 14, responsibilities: ['Ausschank koordinieren', 'Stammgäste betreuen'] },
          { name: 'Zweite Bedienung', workplaceArea: 'Festsaal', salary: 13, responsibilities: ['Tische abräumen', 'Getränke servieren', 'Nachschub holen'] },
          { name: 'Hausdame / Zimmeraufsicht', workplaceArea: 'Gästeetagen', salary: 18, responsibilities: ['Zimmerkontrolle', 'Wäschebestand prüfen', 'Zimmermädchen anleiten'] },
          { name: 'Zimmermädchen / Gehilfe', workplaceArea: 'Gästezimmer', salary: 11, responsibilities: ['12 Gästezimmer reinigen', 'Betten beziehen', 'Heizen'] },
          { name: 'Stallmeister & Kutscher', workplaceArea: 'Stallungen & Remise', salary: 16, responsibilities: ['Gastpferde versorgen', 'Fuhrwerke sicher unterstellen'] },
          { name: 'Stallknecht / Hofbursche', workplaceArea: 'Hof & Keller', salary: 10, responsibilities: ['Mist ausmisten', 'Bierfässer rollen', 'Brennholz spalten'] },
          { name: 'Haupttürsteher & Sicherheitsmann', workplaceArea: 'Eingang & Saal', salary: 20, responsibilities: ['Hausfrieden sichern', 'Waffen abnehmen', 'Raufbolde verweisen'], authorities: ['Hausrecht & Sicherheit durchsetzen'] },
          { name: 'Kellermeister / Buchhalter', workplaceArea: 'Gewölbekeller & Büro', salary: 22, responsibilities: ['Fässer anzapfen', 'Weinbestand prüfen', 'Kassenbuch führen'], authorities: ['Schlüsselgewalt & Lagerzugang'] }
        ];
      }
      if (isMonumental) {
        return [
          { name: 'Generaldirektor des Hauses', workplaceArea: 'Direktionskontor', salary: 65, responsibilities: ['Gesamtleitung des Etablissements', 'Repräsentanz & Bankette'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen', 'Preise festlegen'] },
          { name: 'Betriebsleiter / Maître', workplaceArea: 'Prunksaal', salary: 40, responsibilities: ['Veranstaltungsleitung & Gästebetreuung'], authorities: ['Tagesgeschäft leiten', 'Disziplinar- & Rügegewalt'] },
          { name: 'Küchendirektor / Chefkoch', workplaceArea: 'Gastronomieküche', salary: 45, responsibilities: ['Menüfolge & Festessen leiten'], authorities: ['Qualitätskontrolle & Werkabnahme'] },
          { name: '2x Köche & Bäcker', workplaceArea: 'Küche & Backstube', salary: 22, responsibilities: ['Braten, Backen & Kochen'] },
          { name: '4x Servierkräfte & Barkeeper', workplaceArea: 'Säle & Séparées', salary: 15, responsibilities: ['Gästebedienung & Ausschank'] },
          { name: 'Oberhausdame', workplaceArea: 'Etagenflügel', salary: 25, responsibilities: ['Aufsicht über 25 Gästesuiten'], authorities: ['Dienst- & Schichtpläne anordnen'] },
          { name: '3x Zimmer- & Wäschehilfen', workplaceArea: 'Suiten & Wäscherei', salary: 12, responsibilities: ['Suitenpflege & Gästewäsche'] },
          { name: 'Braumeister & Kellermeister', workplaceArea: 'Brauhaus & Weinkeller', salary: 30, responsibilities: ['Hausbrauerei betreiben', 'Weine reifen lassen'], authorities: ['Rezeptur- & Werkgeheimnisse hüten'] },
          { name: 'Stallmeister mit 2 Knechten', workplaceArea: 'Großstallungen', salary: 20, responsibilities: ['Karawanen & Reitpferde versorgen'] },
          { name: 'Sicherheitsgarde (3 Wachposten)', workplaceArea: 'Tore & Säle', salary: 22, responsibilities: ['Objektschutz & Einlasskontrolle'], authorities: ['Hausrecht & Sicherheit durchsetzen'] }
        ];
      }
      // Mittel (Standard)
      return [
        { name: 'Gastwirt / Schankwirt', workplaceArea: 'Schankraum & Kontor', salary: 30, responsibilities: ['Tagesgeschäft & Finanzen leiten', 'Einkauf & Personal koordinieren'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen'] },
        { name: 'Verwalterin / Schankmaid', workplaceArea: 'Tresen', salary: 18, responsibilities: ['Ausschank leiten', 'Gäste bewirten', 'Zimmervergabe'], authorities: ['Tagesgeschäft leiten', 'Lagerbestände & Einkauf verwalten'] },
        { name: 'Koch / Küchenleiter', workplaceArea: 'Tavernenküche', salary: 20, responsibilities: ['Tagesgerichte zubereiten', 'Vorräte prüfen & einwecken'] },
        { name: 'Bedienung / Schankbursche', workplaceArea: 'Gaststube', salary: 12, responsibilities: ['Tische bedienen', 'Gläser spülen', 'Getränke servieren'] },
        { name: 'Stallknecht / Hausdiener', workplaceArea: 'Hof & Ställe', salary: 10, responsibilities: ['Reittiere der Gäste versorgen', 'Brennholz beschaffen', 'Hof säubern'] },
        { name: 'Türsteher / Schankwache', workplaceArea: 'Eingangsbereich', salary: 18, responsibilities: ['Ruhe & Hausordnung sichern', 'Zechpreller & Raufbolde abwehren'], authorities: ['Hausrecht & Sicherheit durchsetzen'] }
      ];

    case 'gasthaus':
    case 'herberge':
      if (isKlein) {
        return [
          { name: 'Herbergswirt', workplaceArea: 'Empfang & Schankraum', salary: 28, responsibilities: ['Gäste empfangen', 'Zimmer vermieten', 'Kasse führen'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben'] },
          { name: 'Herbergsmagd', workplaceArea: 'Gästezimmer & Küche', salary: 13, responsibilities: ['Zimmer richten', 'Frühstück bereiten', 'Saubermachen'] },
          { name: 'Hausbursche', workplaceArea: 'Hof & Holzstapel', salary: 10, responsibilities: ['Gästepferde anbinden', 'Wasser holen', 'Heizen'] }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { name: 'Direktor / Herbergsvater', workplaceArea: 'Empfangsbüro', salary: 50, responsibilities: ['Geschäftsleitung', 'Kontrakte mit Händlern & Reisegilden'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen'] },
          { name: 'Empfangschef / Rezeptionist', workplaceArea: 'Empfangshalle', salary: 25, responsibilities: ['Gästeempfang', 'Zimmerbuchungen & Schlüsselverwaltung'], authorities: ['Schlüsselgewalt & Lagerzugang'] },
          { name: 'Küchenchef', workplaceArea: 'Gasthausküche', salary: 30, responsibilities: ['Frühstücks- & Abendtafel leiten', 'Einkauf frischer Waren'] },
          { name: 'Beikoch & Bäcker', workplaceArea: 'Backofen & Herd', salary: 18, responsibilities: ['Täglich frisches Brot backen', 'Warme Speisen'] },
          { name: 'Hausdame / Erste Schankmaid', workplaceArea: 'Speisesaal & Etagen', salary: 22, responsibilities: ['Aufsicht über Zimmer & Service'], authorities: ['Dienst- & Schichtpläne anordnen'] },
          { name: '2x Zimmermädchen', workplaceArea: 'Gästezimmer', salary: 12, responsibilities: ['Betten frisch beziehen', 'Zimmerreinigung', 'Wäschewaschen'] },
          { name: '2x Servierer', workplaceArea: 'Speisesaal', salary: 13, responsibilities: ['Frühstück & Abendessen servieren'] },
          { name: 'Stallmeister & Kutscher', workplaceArea: 'Remise & Ställe', salary: 18, responsibilities: ['Pferdepflege', 'Fahrdienste für vornehme Gäste'] },
          { name: 'Nachtwächter & Pförtner', workplaceArea: 'Torhaus', salary: 16, responsibilities: ['Nachtglocke bedienen', 'Sicherheit im Haus garantieren'], authorities: ['Hausrecht & Sicherheit durchsetzen'] }
        ];
      }
      return [
        { name: 'Gastwirt / Herbergsvater', workplaceArea: 'Empfang & Büro', salary: 35, responsibilities: ['Betriebsleitung', 'Zimmervergabe & Abrechnung'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen'] },
        { name: 'Hausdame / Schankmaid', workplaceArea: 'Gaststube & Etagen', salary: 20, responsibilities: ['Zimmerkontrolle', 'Gästeempfang & Ausschank'], authorities: ['Tagesgeschäft leiten'] },
        { name: 'Küchenchef', workplaceArea: 'Gasthausküche', salary: 25, responsibilities: ['Menüs kochen', 'Frischwaren beschaffen', 'Küchenhygiene'] },
        { name: 'Zimmermädchen / Gehilfe', workplaceArea: 'Gästezimmer', salary: 12, responsibilities: ['Betten frisch beziehen', 'Zimmer reinigen', 'Wäsche waschen'] },
        { name: 'Kutscher & Stallmeister', workplaceArea: 'Remise & Ställe', salary: 15, responsibilities: ['Gästepferde versorgen', 'Fuhrwerke instand halten'] }
      ];

    case 'schmiede':
      if (isKlein) {
        return [
          { name: 'Schmiedemeister', workplaceArea: 'Esse & Amboss', salary: 35, responsibilities: ['Hufbeschlag & Werkzeuge reparieren', 'Betrieb leiten'], authorities: ['Tagesgeschäft leiten', 'Preise festlegen'] },
          { name: 'Schmiedelehrling', workplaceArea: 'Blasebalg & Schleifstein', salary: 8, responsibilities: ['Feuer anheizen', 'Eisen vorwärmen', 'Schleifen'] },
          { name: 'Hilfskraft / Träger', workplaceArea: 'Hof', salary: 9, responsibilities: ['Kohle heranschaffen', 'Pferde halten'] }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { name: 'Zeugschmiedemeister', workplaceArea: 'Meisterkontor', salary: 55, responsibilities: ['Gesamtbetrieb, Großaufträge für Stadtwache & Heer'], authorities: ['Tagesgeschäft leiten', 'Aufträge vergeben & annehmen', 'Personal einstellen & entlassen', 'Qualitätskontrolle & Werkabnahme'] },
          { name: 'Erster Waffenschmied', workplaceArea: 'Klingenschmiede', salary: 28, responsibilities: ['Schwerter, Lanzen & Qualitätsklingen schmieden'], authorities: ['Qualitätskontrolle & Werkabnahme'] },
          { name: 'Plattner / Rüstungsschmied', workplaceArea: 'Harnischwerkstatt', salary: 27, responsibilities: ['Brustpanzer, Helme & Schilde anpassen'] },
          { name: 'Grobschmied & Hufschmied', workplaceArea: 'Esse 2', salary: 20, responsibilities: ['Beschläge, Karrenachsen & Hufeisen fertigen'] },
          { name: 'Härtemeister & Gießer', workplaceArea: 'Härtebecken & Schmelze', salary: 22, responsibilities: ['Öl- & Wasserhärtung, Legierungen ansetzen'], authorities: ['Rezeptur- & Werkgeheimnisse hüten'] },
          { name: '2x Schmiedegesellen', workplaceArea: 'Zuschlagstation', salary: 16, responsibilities: ['Vorschlaghammer führen', 'Rohlinge austreiben'] },
          { name: '2x Schmiedelehrlinge', workplaceArea: 'Blasebälge & Esse', salary: 8, responsibilities: ['Feuerglut unterhalten', 'Schlacke räumen'] },
          { name: 'Lagerverwalter & Materialeinkäufer', workplaceArea: 'Erz- & Kohlelager', salary: 18, responsibilities: ['Eisenbarren wiegen', 'Kohlenlieferungen sichern'] }
        ];
      }
      return [
        { name: 'Schmiedemeister', workplaceArea: 'Hauptschmiede', salary: 40, responsibilities: ['Meisterstücke schmieden', 'Betrieb führen & Aufträge prüfen'], authorities: ['Tagesgeschäft leiten', 'Aufträge vergeben & annehmen', 'Qualitätskontrolle & Werkabnahme'] },
        { name: 'Waffenschmied-Geselle', workplaceArea: 'Werkbank & Amboss', salary: 22, responsibilities: ['Schwerter, Dolche & Klingen schmieden'], authorities: ['Tagesgeschäft leiten'] },
        { name: 'Grobschmied-Geselle', workplaceArea: 'Zweitamposs', salary: 18, responsibilities: ['Beschläge, Werkzeuge & Hufeisen herstellen'] },
        { name: 'Schmiedelehrling', workplaceArea: 'Esse & Blasebalg', salary: 8, responsibilities: ['Blasebalg betätigen', 'Esse anheizen', 'Schlacke räumen'] },
        { name: 'Materialträger & Kohlegehilfe', workplaceArea: 'Materiallager', salary: 10, responsibilities: ['Eisenbarren transportieren', 'Schmiedekohle auffüllen'] }
      ];

    case 'baeckerei':
    case 'muehle':
      if (isKlein) {
        return [
          { name: 'Bäckermeister', workplaceArea: 'Backofen', salary: 28, responsibilities: ['Brot backen', 'Laden führen'], authorities: ['Tagesgeschäft leiten', 'Preise festlegen'] },
          { name: 'Ladenhilfe / Verkäufer', workplaceArea: 'Theke', salary: 12, responsibilities: ['Brot verkaufen', 'Kasse abrechnen'] },
          { name: 'Backbursche', workplaceArea: 'Mehlkammer', salary: 9, responsibilities: ['Holz nachlegen', 'Mehl sieben', 'Backbleche fetten'] }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { name: 'Oberbäckermeister', workplaceArea: 'Backkontor', salary: 45, responsibilities: ['Betriebsleitung', 'Großlieferverträge mit Gasthöfen & Heer'], authorities: ['Tagesgeschäft leiten', 'Preise festlegen', 'Personal einstellen & entlassen'] },
          { name: 'Teigmacher / Knetmeister', workplaceArea: 'Knetstation', salary: 22, responsibilities: ['Sauerteig ansetzen', 'Mehlmischungen abstimmen'] },
          { name: 'Ofenmeister', workplaceArea: 'Hauptöfen', salary: 22, responsibilities: ['Backhitze steuern', 'Einschießen & Ausbacken überwachen'] },
          { name: 'Feinbäcker & Konditor', workplaceArea: 'Konditorstube', salary: 24, responsibilities: ['Torten, Honigkuchen & Feingebäck anfertigen'] },
          { name: '2x Bäckergesellen', workplaceArea: 'Backtisch', salary: 16, responsibilities: ['Laibe formen', 'Teig portionieren'] },
          { name: '2x Ladenverkäuferinnen', workplaceArea: 'Verkaufsladen', salary: 14, responsibilities: ['Kundschaft bedienen', 'Tageseinnahmen sichern'] },
          { name: 'Fuhrmann / Auslieferer', workplaceArea: 'Hof & Wagen', salary: 14, responsibilities: ['Morgenlieferungen zu Abnehmern fahren'] },
          { name: 'Mühl- & Mehllagerist', workplaceArea: 'Silo & Lager', salary: 12, responsibilities: ['Getreidesäcke schleppen', 'Vorratsgüte sichern'] }
        ];
      }
      return [
        { name: 'Bäckermeister', workplaceArea: 'Backstube', salary: 30, responsibilities: ['Rezepturen überwachen', 'Ofenhitze & Teigansatz steuern'], authorities: ['Tagesgeschäft leiten', 'Preise festlegen'] },
        { name: 'Bäckergeselle', workplaceArea: 'Backofen & Knettrog', salary: 18, responsibilities: ['Teig kneten', 'Brote formen & einschießen'] },
        { name: 'Ladenverkäuferin', workplaceArea: 'Verkaufstresen', salary: 14, responsibilities: ['Frische Backwaren verkaufen', 'Tageskasse abrechnen'] },
        { name: 'Mühlgehilfe & Kneter', workplaceArea: 'Mehlkammer & Mahlwerk', salary: 10, responsibilities: ['Mehlsäcke schleppen', 'Getreide mahlen'] }
      ];

    case 'bauernhof':
      if (isKlein) {
        return [
          { name: 'Kleinbauer', workplaceArea: 'Hof & Acker', salary: 22, responsibilities: ['Feldarbeit & Vieh versorgen'], authorities: ['Tagesgeschäft leiten'] },
          { name: 'Bäuerin / Allrounderin', workplaceArea: 'Küche & Stall', salary: 14, responsibilities: ['Melken, Gemüsegarten, Kochen'] },
          { name: 'Hofknecht', workplaceArea: 'Scheune', salary: 10, responsibilities: ['Misten, Füttern, Holz hacken'] }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { name: 'Gutsverwalter / Hofherr', workplaceArea: 'Gutskontor', salary: 45, responsibilities: ['Wirtschaftspläne, Pachtabrechnungen, Viehhandel'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen'] },
          { name: 'Oberstallmeister / Viehwirt', workplaceArea: 'Viehställe', salary: 22, responsibilities: ['Zucht, Tiergesundheit & Fütterung leiten'], authorities: ['Tagesgeschäft leiten'] },
          { name: 'Ackerbaumeister / Vorarbeiter', workplaceArea: 'Felder', salary: 20, responsibilities: ['Feldarbeit, Pflügen, Aussaat & Ernte koordinieren'] },
          { name: 'Molkereimeisterin / Käserin', workplaceArea: 'Käserei & Milchkammer', salary: 18, responsibilities: ['Käse reifen, Butter schlagen, Milch verarbeiten'] },
          { name: '3x Feldknechte', workplaceArea: 'Ackerflächen', salary: 11, responsibilities: ['Schwere Feldarbeit, Mähen, Ernten'] },
          { name: '2x Stallmägde', workplaceArea: 'Stallungen', salary: 10, responsibilities: ['Melken, Einstreuen, Kleinvieh versorgen'] },
          { name: 'Fuhrmann & Wagenschmied', workplaceArea: 'Remise', salary: 15, responsibilities: ['Gespanne lenken', 'Ernte zur Stadt fahren'] },
          { name: 'Scheunenmeister / Vorratsverwalter', workplaceArea: 'Getreidespeicher', salary: 16, responsibilities: ['Korn säubern', 'Dreschen leiten', 'Mäuse fernhalten'] }
        ];
      }
      return [
        { name: 'Hofbauer / Verwalter', workplaceArea: 'Hofhaus', salary: 30, responsibilities: ['Aussaat, Ernte & Viehbestand planen'], authorities: ['Tagesgeschäft leiten', 'Lagerbestände & Einkauf verwalten'] },
        { name: 'Viehwirt / Stallmeister', workplaceArea: 'Stallungen', salary: 16, responsibilities: ['Rinder, Schafe & Schweine versorgen', 'Melken'] },
        { name: 'Feldknecht', workplaceArea: 'Felder & Äcker', salary: 10, responsibilities: ['Pflügen, Hacken & Ernten'] },
        { name: 'Erntemagd', workplaceArea: 'Scheune & Vorratskammer', salary: 10, responsibilities: ['Getreide dreschen', 'Früchte einlagern'] }
      ];

    case 'mine':
      if (isKlein) {
        return [
          { name: 'Schachtführer / Steiger', workplaceArea: 'Stollenmund', salary: 35, responsibilities: ['Abbau anweisen & Grubenluft prüfen'], authorities: ['Tagesgeschäft leiten', 'Hausrecht & Sicherheit durchsetzen'] },
          { name: 'Hauer', workplaceArea: 'Stollen', salary: 20, responsibilities: ['Gestein hauen'] },
          { name: 'Schlepper / Förderer', workplaceArea: 'Schienen', salary: 12, responsibilities: ['Karren schieben & Erz ausladen'] }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { name: 'Zechenleiter / Oberbergmeister', workplaceArea: 'Bergamt & Kontor', salary: 60, responsibilities: ['Gesamtverwaltung der Mine, Förderquoten, Schmelzkontrakte'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen'] },
          { name: 'Schachtmeister / Fahrsteiger', workplaceArea: 'Tiefsohlen', salary: 32, responsibilities: ['Sicherheit unter Tage, Wetterführung & Sprengaufsicht'], authorities: ['Hausrecht & Sicherheit durchsetzen'] },
          { name: 'Grubenzimmermeister', workplaceArea: 'Holzzimmerung', salary: 25, responsibilities: ['Stollenabstützung gegen Einstürze leiten'] },
          { name: '4x Hauer & Mineure', workplaceArea: 'Abbaufront', salary: 22, responsibilities: ['Erzadern schlagen, Bohrlöcher setzen'] },
          { name: '3x Schlepper & Fördermaschinisten', workplaceArea: 'Förderturm & Schienen', salary: 14, responsibilities: ['Erzloren zutage fördern'] },
          { name: 'Poch- & Sortiermeister', workplaceArea: 'Aufbereitung', salary: 18, responsibilities: ['Erz von taubem Gestein trennen'] },
          { name: 'Bergschmied', workplaceArea: 'Zechenschmiede', salary: 22, responsibilities: ['Gezähe schärfen, Ketten & Loren reparieren'] },
          { name: 'Grubenwächter / Lampenmeister', workplaceArea: 'Kaue', salary: 16, responsibilities: ['Grubenlampen warten, Anwesenheit zählen'] }
        ];
      }
      return [
        { name: 'Obersteiger / Grubenmeister', workplaceArea: 'Zechenkontor & Schacht', salary: 45, responsibilities: ['Stollensicherheit, Bewetterung & Schichten leiten'], authorities: ['Tagesgeschäft leiten', 'Hausrecht & Sicherheit durchsetzen'] },
        { name: 'Hauer / Bergmann', workplaceArea: 'Tiefsohle', salary: 22, responsibilities: ['Gestein schlagen', 'Erzadern abbauen'] },
        { name: 'Grubenzimmermann', workplaceArea: 'Stollenausbau', salary: 20, responsibilities: ['Stützbalken setzen', 'Einsturzgefahr sichern'] },
        { name: 'Förderknecht / Schlepper', workplaceArea: 'Schienen & Förderschacht', salary: 12, responsibilities: ['Erzkästen & Loren zutage fördern'] }
      ];

    default:
      if (isKlein) {
        return [
          { name: 'Betriebsleiter / Meister', workplaceArea: 'Hauptbereich', salary: 25, responsibilities: ['Betrieb führen & Arbeit verrichten'], authorities: ['Tagesgeschäft leiten'] },
          { name: 'Gehilfe / Lehrling', workplaceArea: 'Arbeitsbereich', salary: 10, responsibilities: ['Handreichungen & Saubermachen'] }
        ];
      }
      if (isGross || isMonumental) {
        return [
          { name: 'Geschäftsführer / Obermeister', workplaceArea: 'Geschäftszimmer', salary: 50, responsibilities: ['Gesamtleitung, Finanzen & Verträge'], authorities: ['Tagesgeschäft leiten', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen'] },
          { name: 'Werkstattleiter / Vorarbeiter', workplaceArea: 'Werkhalle', salary: 28, responsibilities: ['Tagesabläufe & Schichten koordinieren'], authorities: ['Tagesgeschäft leiten', 'Qualitätskontrolle & Werkabnahme'] },
          { name: '3x Fachkräfte / Gesellen', workplaceArea: 'Produktion', salary: 18, responsibilities: ['Hauptarbeiten ausführen'] },
          { name: '2x Hilfskräfte / Packer', workplaceArea: 'Lager & Versand', salary: 12, responsibilities: ['Waren stapeln, Material transportieren'] },
          { name: 'Schreiber / Buchhalter', workplaceArea: 'Kontor', salary: 20, responsibilities: ['Bücher & Kasse führen'] }
        ];
      }
      return [
        { name: 'Betriebsleiter / Meister', workplaceArea: 'Hauptbereich', salary: 30, responsibilities: ['Geschäftsleitung & Koordination'], authorities: ['Tagesgeschäft leiten'] },
        { name: 'Fachgeselle / Mitarbeiter', workplaceArea: 'Arbeitsbereich', salary: 18, responsibilities: ['Haupttätigkeit ausführen'] },
        { name: 'Gehilfe / Hilfskraft', workplaceArea: 'Betriebsgelände', salary: 10, responsibilities: ['Unterstützung & Routinearbeiten'] }
      ];
  }
};

export const getHoldingPresets = (type: EconomyHolding['type']): {
  resources: EconomyResource[];
  tasks: EconomyTask[];
  duties: EconomyDuty[];
  roles: EconomyRole[];
  staffGroups: EconomyStaffGroup[];
  orders: EconomyOrder[];
  decisions: EconomyDecision[];
  activityLogs: EconomyLogEntry[];
} => {
  switch (type) {
    case 'schmiede':
      return {
        resources: [
          { id: 'res-sm1', name: 'Eisenbarren & Rohstahl', category: 'raw_material', amount: 60, maxCapacity: 180, unit: 'Barren', pricePerUnit: 12, condition: 'gut' },
          { id: 'res-sm2', name: 'Schmiedekohle', category: 'raw_material', amount: 90, maxCapacity: 220, unit: 'Säcke', pricePerUnit: 4, condition: 'gut' },
          { id: 'res-sm3', name: 'Waffenklingen & Beschläge', category: 'goods', amount: 25, maxCapacity: 70, unit: 'Stück', pricePerUnit: 28, condition: 'exzellent' }
        ],
        roles: [
          { id: 'role-sm-1', name: 'Schmiedemeister', assignedToName: '', isUserPosition: false, authorities: ['Preise festlegen', 'Aufträge vergeben & annehmen', 'Personal einstellen & entlassen', 'Budget & Finanzen freigeben'], responsibilities: ['Meisterwerke schmieden', 'Betrieb führen'], salary: 40, workplaceArea: 'Hauptschmiede' },
          { id: 'role-sm-2', name: 'Geselle', assignedToName: 'Schmiedegeselle Anton', superiorRole: 'Schmiedemeister', authorities: ['Tagesgeschäft leiten', 'Aufgaben & Pflichten delegieren'], responsibilities: ['Standardklingen schmieden', 'Kohlevorrat sichern'], salary: 18, workplaceArea: 'Werkbank' }
        ],
        staffGroups: [
          { id: 'sg-sm-1', roleName: 'Lehrlinge', count: 3, workplaceArea: 'Esse & Blasebalg', duties: ['Blasebalg bedienen', 'Schlacke wegräumen', 'Material herbeischaffen'], status: 'aktiv', dailyCostPerUnit: 2 },
          { id: 'sg-sm-2', roleName: 'Hilfsarbeiter / Träger', count: 2, workplaceArea: 'Lager & Anlieferung', duties: ['Kohlesäcke schleppen', 'Eisen anliefern'], status: 'aktiv', dailyCostPerUnit: 2 }
        ],
        tasks: [
          { id: 'tsk-sm1', title: 'Garnisons-Schwerter schmieden', description: 'Großauftrag für die Stadtwache anfertigen.', status: 'pending', priority: 'high', deadline: 'In 5 Tagen', progress: 20, reward: '+150 Gold & +10 Ansehen' },
          { id: 'tsk-sm2', title: 'Mithril-Legierung veredeln', description: 'Seltene Legierung für Meisterklinge vorbereiten.', status: 'pending', priority: 'medium', progress: 0, reward: '+1 Meisterwaffe' }
        ],
        duties: [
          { id: 'dty-sm1', title: 'Esse anheizen & Blasebalg prüfen', description: 'Gleichmäßige Hitze für die Tagesproduktion sichern.', frequency: 'daily', isFulfilled: true },
          { id: 'dty-sm2', title: 'Ambosse ölen & Werkzeuge schleifen', description: 'Gute Ordnung und Sicherheit am Arbeitsplatz.', frequency: 'daily', isFulfilled: false }
        ],
        orders: [
          { id: 'ord-sm1', title: 'Eilauftrag Stadtwachen-Beschläge', issuerName: 'Hauptmann der Wache', recipientName: 'Schmiedemeister', targetGoal: '50 Schildbuckel und Klingen herstellen', deadline: 'Ende der Woche', priority: 'hoch', progress: 35, reward: '180 Gold', status: 'in_bearbeitung' }
        ],
        decisions: [
          { id: 'dec-sm1', title: 'Kohlelieferant will Preise um 20% erhöhen', description: 'Der bisherige Händler verlangt mehr Gold wegen Straßensperren.', category: 'finanzen', urgency: 'mittel', requiredAuthority: 'Budget & Finanzen freigeben', options: [
            { id: 'opt-1', label: 'Preiserhöhung akzeptieren', outcomeDescription: 'Zuverlässige Lieferung gesichert, Unterhalt steigt leicht.', cost: 30 },
            { id: 'opt-2', label: 'Neuen Lieferanten aus dem Umland suchen', outcomeDescription: 'Kosten bleiben gleich, Qualität muss geprüft werden.', reputationChange: -2 }
          ], status: 'offen' }
        ],
        activityLogs: [
          { id: 'log-sm1', timestamp: 'Heute 07:30', actorName: 'Geselle Anton', actorRole: 'Geselle', type: 'staff_action', message: 'Esse auf 1100°C angeheizt und Kohlevorrat geprüft.', severity: 'info' },
          { id: 'log-sm2', timestamp: 'Gestern 16:45', actorName: 'Lehrling Fritz', actorRole: 'Lehrling', type: 'incident', message: 'Kleiner Funkenflug am Lagerbalken schnell gelöscht.', severity: 'warning' }
        ]
      };

    case 'anwesen':
    case 'adelssitz':
    case 'herrenhaus':
    case 'gutshof':
      return {
        resources: [
          { id: 'res-a1', name: 'Getreide & Mehlvorräte', category: 'food_drink', amount: 160, maxCapacity: 400, unit: 'Säcke', pricePerUnit: 3, condition: 'gut' },
          { id: 'res-a2', name: 'Zuchtvieh & Pferde', category: 'animals', amount: 24, maxCapacity: 50, unit: 'Tiere', pricePerUnit: 40, condition: 'exzellent' },
          { id: 'res-a3', name: 'Edelwein & Vorratskammer', category: 'goods', amount: 45, maxCapacity: 100, unit: 'Flaschen', pricePerUnit: 15, condition: 'gut' }
        ],
        roles: [
          { id: 'role-a-1', name: 'Gutsherr / Besitzer', assignedToName: '', isUserPosition: false, authorities: ['Betriebsbeschlüsse fassen', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen', 'Gewinne entnehmen'], responsibilities: ['Gesamtleitung', 'Repräsentation'], salary: 60, workplaceArea: 'Herrenhaus' },
          { id: 'role-a-2', name: 'Butler / Majordomus', assignedToName: 'Butler Johann', superiorRole: 'Gutsherr / Besitzer', authorities: ['Tagesgeschäft leiten', 'Aufgaben & Pflichten delegieren', 'Hausrecht & Sicherheit durchsetzen'], responsibilities: ['Haushalt führen', 'Bedienstete anleiten', 'Gäste empfangen'], salary: 25, workplaceArea: 'Haupthaus' },
          { id: 'role-a-3', name: 'Haushälterin', assignedToName: 'Frau Martha', superiorRole: 'Butler / Majordomus', authorities: ['Lagerbestände & Einkauf verwalten', 'Aufgaben & Pflichten delegieren'], responsibilities: ['Wäsche & Zimmeraufsicht', 'Küche kontrollieren'], salary: 20, workplaceArea: 'Wirtschaftsflügel' }
        ],
        staffGroups: [
          { id: 'sg-a-1', roleName: 'Mägde & Zofen', count: 8, workplaceArea: 'Gästezimmer & Säle', duties: ['Zimmer reinigen', 'Wäsche waschen', 'Tische decken'], status: 'aktiv', assignedLeaderOrManager: 'Haushälterin', dailyCostPerUnit: 2 },
          { id: 'sg-a-2', roleName: 'Diener & Lakaien', count: 6, workplaceArea: 'Speisesaal & Foyer', duties: ['Gäste bewirten', 'Kaminholz tragen', 'Botengänge'], status: 'aktiv', assignedLeaderOrManager: 'Butler Johann', dailyCostPerUnit: 2 },
          { id: 'sg-a-3', roleName: 'Guts- & Torwachen', count: 6, workplaceArea: 'Tore & Garten', duties: ['Nachtwache', 'Besucher kontrollieren', 'Streife laufen'], status: 'aktiv', assignedLeaderOrManager: 'Butler Johann', dailyCostPerUnit: 3 },
          { id: 'sg-a-4', roleName: 'Köche & Küchenhilfen', count: 4, workplaceArea: 'Großküche', duties: ['Mahlzeiten zubereiten', 'Vorräte einwecken', 'Brot backen'], status: 'aktiv', assignedLeaderOrManager: 'Haushälterin', dailyCostPerUnit: 3 },
          { id: 'sg-a-5', roleName: 'Stallknechte & Gärtner', count: 5, workplaceArea: 'Ställe & Park', duties: ['Pferde striegeln', 'Kutschen warten', 'Garten pflegen'], status: 'aktiv', dailyCostPerUnit: 2 }
        ],
        tasks: [
          { id: 'tsk-a1', title: 'Empfang für Gesandtschaft vorbereiten', description: 'Festsaal dekorieren und Feinschmecker-Menü planen.', status: 'pending', priority: 'high', deadline: 'In 3 Tagen', progress: 40, reward: '+20 Ansehen' },
          { id: 'tsk-a2', title: 'Westflügel-Dach neu eindecken', description: 'Morsche Schindeln austauschen vor der Regenzeit.', status: 'pending', priority: 'medium', progress: 10, reward: 'Schadensprävention' }
        ],
        duties: [
          { id: 'dty-a1', title: 'Morgen-Appell & Dienstplan-Besprechung', description: 'Butler verteilt die Aufgaben an die Abteilungen.', frequency: 'daily', isFulfilled: true },
          { id: 'dty-a2', title: 'Pacht- & Ausgabenbuch prüfen', description: 'Finanzen und Inventar kontrollieren.', frequency: 'weekly', isFulfilled: false }
        ],
        orders: [
          { id: 'ord-a1', title: 'Vorratskeller auffüllen', issuerName: 'Gutsherr / Besitzer', recipientName: 'Haushälterin', targetGoal: 'Zusätzliche 30 Kisten Räucherfleisch und Wein einlagern', deadline: 'Bis Monatsende', priority: 'normal', progress: 50, reward: 'Prämie für Personal', status: 'in_bearbeitung' }
        ],
        decisions: [
          { id: 'dec-a1', title: 'Die Pächter fordern Reparaturhilfe nach Sturm', description: 'Zwei Bauernhäuser wurden beschädigt.', category: 'personal', urgency: 'mittel', requiredAuthority: 'Budget & Finanzen freigeben', options: [
            { id: 'opt-1', label: 'Reparaturholz & Helfer stellen', outcomeDescription: 'Hohe Loyalität der Pächter, kleine Holzkosten.', cost: 45, reputationChange: 5 },
            { id: 'opt-2', label: 'Pächter selbst instand setzen lassen', outcomeDescription: 'Keine Kosten, aber Unruhe unter den Pächtern.', reputationChange: -4 }
          ], status: 'offen' }
        ],
        activityLogs: [
          { id: 'log-a1', timestamp: 'Heute 08:15', actorName: 'Butler Johann', actorRole: 'Butler', type: 'staff_action', message: 'Speisesaal für das Frühstück der Herrschaft vorbereitet.', severity: 'info' },
          { id: 'log-a2', timestamp: 'Heute 10:30', actorName: 'Magd Elsa', actorRole: 'Magd', type: 'staff_action', message: 'Frische Bettwäsche im Westflügel bezogen.', severity: 'info' },
          { id: 'log-a3', timestamp: 'Gestern 22:40', actorName: 'Torwache Boris', actorRole: 'Wache', type: 'incident', message: 'Verdächtige Geräusche am Nordtor überprüft - Fehlalarm durch Rehwild.', severity: 'positive' }
        ]
      };

    case 'mine':
      return {
        resources: [
          { id: 'res-m1', name: 'Roherz & Gestein', category: 'raw_material', amount: 120, maxCapacity: 300, unit: 'Loren', pricePerUnit: 18, condition: 'gut' },
          { id: 'res-m2', name: 'Grubenholz & Stützbalken', category: 'raw_material', amount: 80, maxCapacity: 200, unit: 'Balken', pricePerUnit: 5, condition: 'gut' },
          { id: 'res-m3', name: 'Öllampen & Werkzeuge', category: 'goods', amount: 45, maxCapacity: 100, unit: 'Stück', pricePerUnit: 8, condition: 'gut' }
        ],
        roles: [
          { id: 'role-m-1', name: 'Grubenbesitzer / Zechenherr', assignedToName: '', isUserPosition: false, authorities: ['Betriebsbeschlüsse fassen', 'Preise festlegen', 'Budget & Finanzen freigeben'], responsibilities: ['Gesamtleitung', 'Verkauf der Erze'], salary: 60, workplaceArea: 'Zechenkontor' },
          { id: 'role-m-2', name: 'Steiger / Grubenmeister', assignedToName: 'Meister Goran', superiorRole: 'Grubenbesitzer / Zechenherr', authorities: ['Tagesgeschäft leiten', 'Aufgaben & Pflichten delegieren', 'Hausrecht & Sicherheit durchsetzen'], responsibilities: ['Stollensicherheit', 'Schichtaufsicht'], salary: 28, workplaceArea: 'Tiefstollen' }
        ],
        staffGroups: [
          { id: 'sg-m-1', roleName: 'Hauer', count: 12, workplaceArea: 'Abbaufront', duties: ['Erz abbauen', 'Sprenglöcher meißeln', 'Flöze freilegen'], status: 'aktiv', assignedLeaderOrManager: 'Meister Goran', dailyCostPerUnit: 3 },
          { id: 'sg-m-2', roleName: 'Förderknechte', count: 8, workplaceArea: 'Schienen & Schacht', duties: ['Loren schieben', 'Gestein zutage fördern'], status: 'aktiv', assignedLeaderOrManager: 'Meister Goran', dailyCostPerUnit: 2 },
          { id: 'sg-m-3', roleName: 'Zimmerleute', count: 4, workplaceArea: 'Stollenbau', duties: ['Stützbalken einziehen', 'Wasserrinnen warten'], status: 'aktiv', assignedLeaderOrManager: 'Meister Goran', dailyCostPerUnit: 3 }
        ],
        tasks: [
          { id: 'tsk-m1', title: 'Tieferen Silberstollen erschließen', description: 'Neue Ader in Sohle 3 freilegen und abstützen.', status: 'pending', priority: 'high', deadline: 'In 7 Tagen', progress: 30, reward: '+120 Gold Förderertrag' }
        ],
        duties: [
          { id: 'dty-m1', title: 'Wetterführung & Schlagwetterkontrolle', description: 'Tägliche Belüftungsmessung vor Schichtbeginn.', frequency: 'daily', isFulfilled: true },
          { id: 'dty-m2', title: 'Stützpfeiler auf Druckrisse prüfen', description: 'Sicherheitsinspektion aller aktiven Abbauzonen.', frequency: 'daily', isFulfilled: true }
        ],
        orders: [
          { id: 'ord-m1', title: 'Lieferung für die Waffenschmiede', issuerName: 'Gilde der Schmiede', recipientName: 'Zechenherr', targetGoal: '50 Barren Eisenerz bereitstellen', deadline: 'Nächster Markttag', priority: 'normal', progress: 60, reward: '140 Gold', status: 'in_bearbeitung' }
        ],
        decisions: [
          { id: 'dec-m1', title: 'Wassereinbruch in Sohle 2 gemeldet', description: 'Grundwasser drückt durch den Schieferfels. Pumpen müssen verstärkt werden.', category: 'sicherheit', urgency: 'hoch', requiredAuthority: 'Ausbauten & Upgrades anordnen', options: [
            { id: 'opt-m1', label: 'Schöpfwerk zügig ausbauen', outcomeDescription: 'Stollen bleibt trocken, Investition erforderlich.', cost: 60 },
            { id: 'opt-m2', label: 'Sohle temporär fluten und abriegeln', outcomeDescription: 'Keine Kosten, aber Erzförderung sinkt.', reputationChange: -3 }
          ], status: 'offen' }
        ],
        activityLogs: [
          { id: 'log-m1', timestamp: 'Heute 06:00', actorName: 'Meister Goran', actorRole: 'Steiger', type: 'staff_action', message: 'Frühschicht eingefahren, Bewetterung im Hauptquerschlag einwandfrei.', severity: 'info' }
        ]
      };

    case 'fischerei':
      return {
        resources: [
          { id: 'res-f1', name: 'Fangfrischer Fisch', category: 'food_drink', amount: 80, maxCapacity: 200, unit: 'Körbe', pricePerUnit: 4, condition: 'gut' },
          { id: 'res-f2', name: 'Salz- & Räucherfisch', category: 'food_drink', amount: 110, maxCapacity: 250, unit: 'Holzkisten', pricePerUnit: 7, condition: 'exzellent' },
          { id: 'res-f3', name: 'Netze, Taue & Fässer', category: 'goods', amount: 35, maxCapacity: 80, unit: 'Stück', pricePerUnit: 6, condition: 'gut' }
        ],
        roles: [
          { id: 'role-f-1', name: 'Fischereimeister / Eigner', assignedToName: '', isUserPosition: false, authorities: ['Preise festlegen', 'Aufträge vergeben & annehmen', 'Gewinne entnehmen'], responsibilities: ['Kutterleitung', 'Verkauf am Fischmarkt'], salary: 35, workplaceArea: 'Anlegesteg & Räucherhaus' },
          { id: 'role-f-2', name: 'Bootsführer / Vorsteher', assignedToName: 'Kapitän Keno', superiorRole: 'Fischereimeister / Eigner', authorities: ['Tagesgeschäft leiten', 'Aufgaben & Pflichten delegieren'], responsibilities: ['Fahrten leiten', 'Netze warten'], salary: 22, workplaceArea: 'Fischkutter' }
        ],
        staffGroups: [
          { id: 'sg-f-1', roleName: 'Fischer & Kutterbesatzung', count: 6, workplaceArea: 'Kutter & Bucht', duties: ['Netze einholen', 'Fang sortieren', 'Boot manövrieren'], status: 'aktiv', assignedLeaderOrManager: 'Kapitän Keno', dailyCostPerUnit: 2 },
          { id: 'sg-f-2', roleName: 'Räucherer & Ausnehmer', count: 4, workplaceArea: 'Räucherkammer & Steg', duties: ['Fisch säubern', 'Pökeln', 'Räucheröfen heizen'], status: 'aktiv', assignedLeaderOrManager: 'Fischereimeister / Eigner', dailyCostPerUnit: 2 }
        ],
        tasks: [
          { id: 'tsk-f1', title: 'Heringsschwarm vor der Landzunge abfischen', description: 'Günstiges Gezeitenfenster nutzen.', status: 'pending', priority: 'high', deadline: 'Heute Abend', progress: 50, reward: '+80 Körbe Fisch' }
        ],
        duties: [
          { id: 'dty-f1', title: 'Schleppnetze flicken & trocknen', description: 'Risse nach Grundberührung beseitigen.', frequency: 'daily', isFulfilled: true },
          { id: 'dty-f2', title: 'Räucherholz nachlegen', description: 'Buchenspäne gleichmäßig glimmen lassen.', frequency: 'daily', isFulfilled: true }
        ],
        orders: [
          { id: 'ord-f1', title: 'Fischversorgung für das Marktviertel', issuerName: 'Marktvogt', recipientName: 'Fischereimeister', targetGoal: '30 Fässer Salzfisch anliefern', deadline: 'Freitag', priority: 'normal', progress: 40, reward: '90 Gold', status: 'in_bearbeitung' }
        ],
        decisions: [],
        activityLogs: [
          { id: 'log-f1', timestamp: 'Heute 05:30', actorName: 'Kapitän Keno', actorRole: 'Bootsführer', type: 'staff_action', message: 'Kutter mit Morgenbrise ausgelaufen, Netze planmäßig ausgebracht.', severity: 'info' }
        ]
      };

    case 'rathaus':
      return {
        resources: [
          { id: 'res-rh1', name: 'Amtssiegel, Pergament & Akten', category: 'goods', amount: 50, maxCapacity: 120, unit: 'Bündel', pricePerUnit: 10, condition: 'exzellent' },
          { id: 'res-rh2', name: 'Stadtkasse & Steuererträge', category: 'capacity', amount: 450, maxCapacity: 1200, unit: 'Taler', pricePerUnit: 1, condition: 'gut' }
        ],
        roles: [
          { id: 'role-rh-1', name: 'Stadtvogt / Bürgermeister', assignedToName: '', isUserPosition: false, authorities: ['Betriebsbeschlüsse fassen', 'Budget & Finanzen freigeben', 'Hausrecht & Sicherheit durchsetzen', 'Verhandlungen führen'], responsibilities: ['Ortsverwaltung', 'Rechtsprechung'], salary: 55, workplaceArea: 'Ratsstube' },
          { id: 'role-rh-2', name: 'Ratsschreiber / Kanzler', assignedToName: 'Schreiber Valerius', superiorRole: 'Stadtvogt / Bürgermeister', authorities: ['Tagesgeschäft leiten', 'Aufgaben & Pflichten delegieren', 'Schlüsselgewalt & Lagerzugang'], responsibilities: ['Aktenführung', 'Steuerregister', 'Bürgeranliegen'], salary: 28, workplaceArea: 'Schreibstube' }
        ],
        staffGroups: [
          { id: 'sg-rh-1', roleName: 'Kanzlisten & Schreiber', count: 4, workplaceArea: 'Kanzlei & Archiv', duties: ['Urkunden ausstellen', 'Register fortschreiben', 'Meldungen erfassen'], status: 'aktiv', assignedLeaderOrManager: 'Schreiber Valerius', dailyCostPerUnit: 3 },
          { id: 'sg-rh-2', roleName: 'Rathausboten', count: 3, workplaceArea: 'Stadtgebiet & Umland', duties: ['Erlasse aushängen', 'Vorladungen zustellen', 'Meldungen überbringen'], status: 'aktiv', assignedLeaderOrManager: 'Schreiber Valerius', dailyCostPerUnit: 2 }
        ],
        tasks: [
          { id: 'tsk-rh1', title: 'Grundsteuer-Register für den Herbst aktualisieren', description: 'Neu vermessene Grundstücke und Besitzwechsel eintragen.', status: 'pending', priority: 'medium', deadline: 'Ende des Monats', progress: 45, reward: 'Verwaltungsklarheit' }
        ],
        duties: [
          { id: 'dty-rh1', title: 'Bürgersprechstunde abhalten', description: 'Anhörung von Gesuchen und Klagen der Einwohnerschaft.', frequency: 'weekly', isFulfilled: true },
          { id: 'dty-rh2', title: 'Stadtkassenauszug prüfen', description: 'Rechnungsprüfung aller Einnahmen und Ausgaben.', frequency: 'weekly', isFulfilled: false }
        ],
        orders: [],
        decisions: [],
        activityLogs: [
          { id: 'log-rh1', timestamp: 'Heute 09:00', actorName: 'Schreiber Valerius', actorRole: 'Ratsschreiber', type: 'staff_action', message: 'Siegellack erneuert und Marktverordnung im Foyer ausgehängt.', severity: 'info' }
        ]
      };

    case 'burg':
    case 'schloss':
      return {
        resources: [
          { id: 'res-b1', name: 'Waffenkammer & Rüstzeug', category: 'goods', amount: 80, maxCapacity: 200, unit: 'Garnituren', pricePerUnit: 30, condition: 'exzellent' },
          { id: 'res-b2', name: 'Belagerungsvorräte & Pökelfleisch', category: 'food_drink', amount: 200, maxCapacity: 500, unit: 'Fässer', pricePerUnit: 5, condition: 'gut' },
          { id: 'res-b3', name: 'Garnisonskasse', category: 'capacity', amount: 350, maxCapacity: 1000, unit: 'Goldtaler', pricePerUnit: 1, condition: 'gut' }
        ],
        roles: [
          { id: 'role-b-1', name: 'Kastellan / Burgvogt', assignedToName: '', isUserPosition: false, authorities: ['Betriebsbeschlüsse fassen', 'Budget & Finanzen freigeben', 'Hausrecht & Sicherheit durchsetzen', 'Notfall- & Evakuierungskommando'], responsibilities: ['Festungsleitung', 'Verteidigungsbereitschaft'], salary: 50, workplaceArea: 'Kommandantur' },
          { id: 'role-b-2', name: 'Hauptmann der Garnison', assignedToName: 'Hauptmann Torin', superiorRole: 'Kastellan / Burgvogt', authorities: ['Tagesgeschäft leiten', 'Aufgaben & Pflichten delegieren', 'Disziplinar- & Rügegewalt'], responsibilities: ['Wachdienst', 'Militärische Übungen'], salary: 32, workplaceArea: 'Wehrgänge & Kaserne' }
        ],
        staffGroups: [
          { id: 'sg-b-1', roleName: 'Tor- & Mauerwachen', count: 14, workplaceArea: 'Wehrgänge & Zinnen', duties: ['Wachposten besetzen', 'Zugbrücke sichern', 'Fernsicht melden'], status: 'aktiv', assignedLeaderOrManager: 'Hauptmann Torin', dailyCostPerUnit: 3 },
          { id: 'sg-b-2', roleName: 'Festungsdiener & Handwerker', count: 6, workplaceArea: 'Zeughaus & Schmiede', duties: ['Pfeile fiedern', 'Katapulte warten', 'Pferde versorgen'], status: 'aktiv', assignedLeaderOrManager: 'Kastellan / Burgvogt', dailyCostPerUnit: 2 }
        ],
        tasks: [
          { id: 'tsk-b1', title: 'Schießscharten und Zinnenmörtel prüfen', description: 'Ausbesserungen an der Nordmauer durchführen.', status: 'pending', priority: 'medium', deadline: 'In 5 Tagen', progress: 20, reward: 'Verteidigungswert +5' }
        ],
        duties: [
          { id: 'dty-b1', title: 'Wachablösung & Torverschluss zur Dämmerung', description: 'Regulärer Dienstplan für Tag- und Nachtposten.', frequency: 'daily', isFulfilled: true },
          { id: 'dty-b2', title: 'Waffenkammer-Inspektion', description: 'Ölen aller Armbrüste, Schwerter und Hellebarden.', frequency: 'weekly', isFulfilled: true }
        ],
        orders: [],
        decisions: [],
        activityLogs: [
          { id: 'log-b1', timestamp: 'Gestern 21:00', actorName: 'Hauptmann Torin', actorRole: 'Hauptmann', type: 'staff_action', message: 'Nachtwache angetreten, Zugbrücke planmäßig eingeholt.', severity: 'info' }
        ]
      };

    case 'lagerhaus':
      return {
        resources: [
          { id: 'res-lh1', name: 'Stapelkisten & Schüttgut', category: 'goods', amount: 150, maxCapacity: 400, unit: 'Kisten', pricePerUnit: 8, condition: 'gut' },
          { id: 'res-lh2', name: 'Ölfässer & Teer', category: 'raw_material', amount: 40, maxCapacity: 100, unit: 'Fässer', pricePerUnit: 12, condition: 'gut' }
        ],
        roles: [
          { id: 'role-lh-1', name: 'Lagermeister', assignedToName: '', isUserPosition: false, authorities: ['Preise festlegen', 'Lagerbestände & Einkauf verwalten', 'Aufträge vergeben & annehmen', 'Schlüsselgewalt & Lagerzugang'], responsibilities: ['Frachtpapiere', 'Ein- und Auslagerung'], salary: 30, workplaceArea: 'Lagerbüro' }
        ],
        staffGroups: [
          { id: 'sg-lh-1', roleName: 'Packknechte & Träger', count: 6, workplaceArea: 'Verladerampen', duties: ['Karren entladen', 'Waren stapeln', 'Schwergut heben'], status: 'aktiv', assignedLeaderOrManager: 'Lagermeister', dailyCostPerUnit: 2 },
          { id: 'sg-lh-2', roleName: 'Nachtwächter', count: 2, workplaceArea: 'Lagerhallen', duties: ['Feuerwache', 'Diebstahlschutz', 'Streife'], status: 'aktiv', assignedLeaderOrManager: 'Lagermeister', dailyCostPerUnit: 2 }
        ],
        tasks: [
          { id: 'tsk-lh1', title: 'Großlieferung Tuchballen verzollen und einlagern', description: 'Kisten sortieren und im Trockenlager einräumen.', status: 'pending', priority: 'high', deadline: 'Heute', progress: 65, reward: '+50 Gold Lagergebühr' }
        ],
        duties: [
          { id: 'dty-lh1', title: 'Lagerbuch mit Frachtzetteln abgleichen', description: 'Vollständigkeit aller Ein- und Ausgänge prüfen.', frequency: 'daily', isFulfilled: true }
        ],
        orders: [],
        decisions: [],
        activityLogs: []
      };

    case 'haendler':
    case 'markt':
      return {
        resources: [
          { id: 'res-h1', name: 'Handelswaren & Tuchballen', category: 'goods', amount: 90, maxCapacity: 220, unit: 'Ballen', pricePerUnit: 14, condition: 'exzellent' },
          { id: 'res-h2', name: 'Gewürze & Kolonialwaren', category: 'luxury', amount: 25, maxCapacity: 60, unit: 'Kistchen', pricePerUnit: 35, condition: 'exzellent' }
        ],
        roles: [
          { id: 'role-h-1', name: 'Kaufmann / Kontorleiter', assignedToName: '', isUserPosition: false, authorities: ['Preise festlegen', 'Aufträge vergeben & annehmen', 'Budget & Finanzen freigeben', 'Verhandlungen führen'], responsibilities: ['Handelsverträge', 'Kontorführung'], salary: 45, workplaceArea: 'Kontor' },
          { id: 'role-h-2', name: 'Handlungsgehilfe / Schreiber', assignedToName: 'Schreiber Elias', superiorRole: 'Kaufmann / Kontorleiter', authorities: ['Tagesgeschäft leiten', 'Lagerbestände & Einkauf verwalten'], responsibilities: ['Kundenbedienung', 'Buchhaltung'], salary: 20, workplaceArea: 'Verkaufstresen' }
        ],
        staffGroups: [
          { id: 'sg-h-1', roleName: 'Ladenhilfen & Packer', count: 3, workplaceArea: 'Verkaufsraum & Lager', duties: ['Waren auspreisen', 'Kunden bedienen', 'Pakete schnüren'], status: 'aktiv', assignedLeaderOrManager: 'Handlungsgehilfe / Schreiber', dailyCostPerUnit: 2 }
        ],
        tasks: [
          { id: 'tsk-h1', title: 'Handelsvertrag mit Karawanenführer aushandeln', description: 'Günstigen Einkaufspreis für Seide sichern.', status: 'pending', priority: 'high', deadline: 'Morgen', progress: 10, reward: '+20% Handelsspanne' }
        ],
        duties: [
          { id: 'dty-h1', title: 'Kassabuch und Wechselkurse prüfen', description: 'Tagesabschluss und Münzgewicht kontrollieren.', frequency: 'daily', isFulfilled: true }
        ],
        orders: [],
        decisions: [],
        activityLogs: []
      };

    default: // Taverne / Gasthaus / etc.
      return {
        resources: [
          { id: 'res-t1', name: 'Getränke & Edelkorn', category: 'food_drink', amount: 50, maxCapacity: 140, unit: 'Fässer', pricePerUnit: 6, condition: 'gut' },
          { id: 'res-t2', name: 'Zutaten & Frischwaren', category: 'food_drink', amount: 35, maxCapacity: 90, unit: 'Kisten', pricePerUnit: 8, condition: 'gut' },
          { id: 'res-t3', name: 'Gästezimmer & Betten', category: 'capacity', amount: 8, maxCapacity: 14, unit: 'Zimmer', pricePerUnit: 16, condition: 'exzellent' }
        ],
        roles: [
          { id: 'role-t-1', name: 'Gastwirt', assignedToName: '', isUserPosition: false, authorities: ['Preise festlegen', 'Personal einstellen & entlassen', 'Gewinne entnehmen', 'Ausbauten & Upgrades anordnen'], responsibilities: ['Finanzen', 'Hauptentscheidungen'], salary: 30, workplaceArea: 'Schankraum' },
          { id: 'role-t-2', name: 'Verwalterin / Schankmaid', assignedToName: '', superiorRole: 'Gastwirt', authorities: ['Tagesgeschäft leiten', 'Lagerbestände & Einkauf verwalten', 'Aufgaben & Pflichten delegieren'], responsibilities: ['Ausschank leiten', 'Zimmervergabe'], salary: 18, workplaceArea: 'Tresen' }
        ],
        staffGroups: [
          { id: 'sg-t-1', roleName: 'Mägde & Bedienung', count: 3, workplaceArea: 'Gaststube & Zimmer', duties: ['Tische bedienen', 'Zimmer herrichten', 'Gläser spülen'], status: 'aktiv', assignedLeaderOrManager: '', dailyCostPerUnit: 2 },
          { id: 'sg-t-2', roleName: 'Köche & Küchenjungen', count: 2, workplaceArea: 'Küche', duties: ['Eintöpfe kochen', 'Braten zubereiten', 'Spülen'], status: 'aktiv', dailyCostPerUnit: 3 },
          { id: 'sg-t-3', roleName: 'Türsteher / Wache', count: 1, workplaceArea: 'Eingang', duties: ['Raufbolde hinauswerfen', 'Ruhe sichern'], status: 'aktiv', dailyCostPerUnit: 3 }
        ],
        tasks: [
          { id: 'tsk-t1', title: 'Hafengerüchte aufschnappen', description: 'Gäste nach Hinweisen auf seltene Handelswaren befragen.', status: 'pending', priority: 'medium', progress: 10, reward: '+15 Ansehen' },
          { id: 'tsk-t2', title: 'Fassbier-Nachschub sichern', description: 'Großbestellung bei der Stadtbrauerei auslösen.', status: 'pending', priority: 'high', progress: 0, reward: '+20 Fässer Bier' }
        ],
        duties: [
          { id: 'dty-t1', title: 'Schankraum lüften & Tische wischen', description: 'Für Sauberkeit und gute Atmosphäre sorgen.', frequency: 'daily', isFulfilled: true },
          { id: 'dty-t2', title: 'Tageseinnahmen abrechnen & Kasse zählen', description: 'Tagesabschluss mit Verwalterin durchführen.', frequency: 'daily', isFulfilled: false }
        ],
        orders: [
          { id: 'ord-t1', title: 'Sondergelage für Handelsgilde ausrichten', issuerName: 'Gildenmeister', recipientName: 'Gastwirt', targetGoal: 'Festtafel für 15 Ehrengäste eindecken', deadline: 'Freitagabend', priority: 'hoch', progress: 20, reward: '120 Gold & Handelsrabatt', status: 'in_bearbeitung' }
        ],
        decisions: [
          { id: 'dec-t1', title: 'Barde bietet regelmäßige Auftritte an', description: 'Ein reisender Lautenspieler möchte jeden Abend auftreten gegen freie Kost und 5 Gold.', category: 'kunden', urgency: 'niedrig', requiredAuthority: 'Personal einstellen & entlassen', options: [
            { id: 'opt-1', label: 'Barden anstellen (+Gästeaufkommen)', outcomeDescription: 'Einnahmen steigen um 15%, Unterhalt um 5 Gold.', cost: 5, reputationChange: 4 },
            { id: 'opt-2', label: 'Ablehnen (Ruhe bewahren)', outcomeDescription: 'Schankraum bleibt ruhig, keine Zusatzkosten.' }
          ], status: 'offen' }
        ],
        activityLogs: [
          { id: 'log-t1', timestamp: 'Heute 12:00', actorName: 'Magd Elsa', actorRole: 'Magd', type: 'staff_action', message: 'Mittagstisch für 18 Gäste reibungslos serviert.', severity: 'positive' },
          { id: 'log-t2', timestamp: 'Heute 14:15', actorName: 'Verwalterin', actorRole: 'Verwalterin', type: 'issue_report', message: 'Kräuterschnaps-Vorrat neigt sich dem Ende zu (nur noch 2 Flaschen).', severity: 'warning' }
        ]
      };
  }
};
