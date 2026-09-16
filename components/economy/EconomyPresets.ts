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
  EconomyLogEntry 
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
          { id: 'role-t-2', name: 'Verwalterin / Schankmaid', assignedToName: 'Wirtin Karin', superiorRole: 'Gastwirt', authorities: ['Tagesgeschäft leiten', 'Lagerbestände & Einkauf verwalten', 'Aufgaben & Pflichten delegieren'], responsibilities: ['Ausschank leiten', 'Zimmervergabe'], salary: 18, workplaceArea: 'Tresen' }
        ],
        staffGroups: [
          { id: 'sg-t-1', roleName: 'Mägde & Bedienung', count: 3, workplaceArea: 'Gaststube & Zimmer', duties: ['Tische bedienen', 'Zimmer herrichten', 'Gläser spülen'], status: 'aktiv', assignedLeaderOrManager: 'Wirtin Karin', dailyCostPerUnit: 2 },
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
          { id: 'log-t2', timestamp: 'Heute 14:15', actorName: 'Wirtin Karin', actorRole: 'Verwalterin', type: 'issue_report', message: 'Kräuterschnaps-Vorrat neigt sich dem Ende zu (nur noch 2 Flaschen).', severity: 'warning' }
        ]
      };
  }
};
