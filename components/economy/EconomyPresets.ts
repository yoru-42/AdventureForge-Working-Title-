import { EconomyHolding, EconomyResource, EconomyTask, EconomyDuty, EconomyRole, EconomyStaffGroup, EconomyOrder, EconomyDecision, EconomyLogEntry } from '../../types';

export interface HoldingTypePreset {
  type: EconomyHolding['type'];
  label: string;
  icon: string;
  defaultIncome: number;
  defaultUpkeep: number;
  description: string;
}

export const HOLDING_TYPES: HoldingTypePreset[] = [
  { type: 'taverne', label: 'Taverne / Schänke', icon: 'Beer', defaultIncome: 160, defaultUpkeep: 35, description: 'Einnahmen durch Speis & Trank, Geselligkeit und Gerüchtebörse.' },
  { type: 'gasthaus', label: 'Gasthaus / Herberge', icon: 'Hotel', defaultIncome: 200, defaultUpkeep: 45, description: 'Gastwirtschaft, Quartier für Reisende, Stallung und Mahlzeiten.' },
  { type: 'schmiede', label: 'Schmiede / Waffenschmiede', icon: 'Hammer', defaultIncome: 240, defaultUpkeep: 50, description: 'Herstellung und Reparatur von Waffen, Rüstungen und Werkzeugen.' },
  { type: 'baeckerei', label: 'Bäckerei / Mühle', icon: 'Bread', defaultIncome: 150, defaultUpkeep: 30, description: 'Mehlverarbeitung, Backwaren und Grundnahrungsversorgung.' },
  { type: 'markt', label: 'Marktstand / Basar', icon: 'Tent', defaultIncome: 260, defaultUpkeep: 45, description: 'Warenbörse, Handel und Verkauf lokaler Güter.' },
  { type: 'haendler', label: 'Handelskontor / Warenhaus', icon: 'CircleDollarSign', defaultIncome: 380, defaultUpkeep: 80, description: 'Import, Export, Luxusgüter und Fernhandelskontrakte.' },
  { type: 'bauernhof', label: 'Bauernhof / Landgut', icon: 'Wheat', defaultIncome: 210, defaultUpkeep: 40, description: 'Getreideanbau, Nutztierhaltung und Rohstoffproduktion.' },
  { type: 'saegewerk', label: 'Sägewerk / Holzlager', icon: 'Axe', defaultIncome: 250, defaultUpkeep: 55, description: 'Holzverarbeitung, Balken und Bauholz für Siedlungen.' },
  { type: 'mine', label: 'Mine / Steinbruch', icon: 'Pickaxe', defaultIncome: 520, defaultUpkeep: 110, description: 'Abbau von Erzen, Edelsteinen und Baumaterial.' },
  { type: 'werft', label: 'Werft / Trockendock', icon: 'Anchor', defaultIncome: 490, defaultUpkeep: 115, description: 'Schiffsbau, Reparatur und Ausrüstung von Seefahrzeugen.' },
  { type: 'hafenbetrieb', label: 'Hafenbetrieb / Zollstation', icon: 'Ship', defaultIncome: 430, defaultUpkeep: 95, description: 'Liegegebühren, Hafenzölle und Umschlagplatz für Waren.' },
  { type: 'manufaktur', label: 'Manufaktur / Weberei', icon: 'Cutter', defaultIncome: 280, defaultUpkeep: 60, description: 'Veredelung von Textilien, Leder, Glas oder Keramik.' },
  { type: 'magierladen', label: 'Magierladen / Alchemielabor', icon: 'FlaskConical', defaultIncome: 340, defaultUpkeep: 80, description: 'Tränke, Schriftrollen, seltene Reagenzien und magische Artefakte.' },
  { type: 'werkstatt', label: 'Handwerkswerkstatt / Atelier', icon: 'Wrench', defaultIncome: 220, defaultUpkeep: 45, description: 'Handwerkliche Maßanfertigungen, Feinmechanik und Reparaturen.' },
  { type: 'anwesen', label: 'Anwesen / Landgut', icon: 'Home', defaultIncome: 320, defaultUpkeep: 70, description: 'Ernteerträge, Pacht & herrschaftliche Gutshof-Wirtschaft.' },
  { type: 'adelssitz', label: 'Adelssitz / Stadtpalais', icon: 'Church', defaultIncome: 450, defaultUpkeep: 120, description: 'Repräsentativer Wohnsitz mit Dienerstab und Einfluss.' },
  { type: 'schloss', label: 'Schloss / Residenz', icon: 'Castle', defaultIncome: 650, defaultUpkeep: 160, description: 'Steuern, Garnison, Schutzabgaben und Landesverwaltung.' },
  { type: 'burg', label: 'Burg / Wehrfestung', icon: 'Shield', defaultIncome: 550, defaultUpkeep: 140, description: 'Wehranlage, Truppenstandort, Wehrzölle und Waffenkammern.' },
  { type: 'koenigreich', label: 'Königreich / Provinz', icon: 'Crown', defaultIncome: 1600, defaultUpkeep: 420, description: 'Großwirtschaft, Reichszölle, Provinzen und Ministerien.' },
  { type: 'schiff', label: 'Schiff / Fregatte', icon: 'Sailboat', defaultIncome: 460, defaultUpkeep: 125, description: 'Handelsfracht, Kapergut, Expeditionen und Seefahrt.' },
  { type: 'gilde', label: 'Handelsgilde / Meisterbund', icon: 'Scale', defaultIncome: 420, defaultUpkeep: 85, description: 'Zunftkasse, Monopole, Marktanteile und Handelsbriefe.' },
  { type: 'fraktionsgebaeude', label: 'Fraktionssitz / Ordenshaus', icon: 'Flag', defaultIncome: 390, defaultUpkeep: 90, description: 'Stützpunkt, Versammlungssaal und Einflusszentrale.' },
  { type: 'custom', label: 'Benutzerdefinierter Betrieb', icon: 'Settings', defaultIncome: 120, defaultUpkeep: 25, description: 'Individuell gestaltetes Wirtschafts- und Managementobjekt.' }
];

export const STANDARD_AUTHORITIES = [
  'Tagesgeschäft leiten',
  'Preise festlegen',
  'Personal einstellen & entlassen',
  'Aufgaben & Pflichten delegieren',
  'Aufträge vergeben & annehmen',
  'Lagerbestände & Einkauf verwalten',
  'Budget & Finanzen freigeben',
  'Ausbauten & Upgrades anordnen',
  'Hausrecht & Sicherheit durchsetzen',
  'Gewinne entnehmen',
  'Verhandlungen führen',
  'Betriebsbeschlüsse fassen'
];

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
  'Betriebsbeschlüsse fassen': 'Entscheidungsfindung bei betrieblichen Grundsatzfragen'
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
          { id: 'role-sm-1', name: 'Schmiedemeister', assignedToName: 'Spieler', isUserPosition: true, authorities: ['Preise festlegen', 'Aufträge vergeben & annehmen', 'Personal einstellen & entlassen', 'Budget & Finanzen freigeben'], responsibilities: ['Meisterwerke schmieden', 'Betrieb führen'], salary: 40, workplaceArea: 'Hauptschmiede' },
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
      return {
        resources: [
          { id: 'res-a1', name: 'Getreide & Mehlvorräte', category: 'food_drink', amount: 160, maxCapacity: 400, unit: 'Säcke', pricePerUnit: 3, condition: 'gut' },
          { id: 'res-a2', name: 'Zuchtvieh & Pferde', category: 'animals', amount: 24, maxCapacity: 50, unit: 'Tiere', pricePerUnit: 40, condition: 'exzellent' },
          { id: 'res-a3', name: 'Edelwein & Vorratskammer', category: 'goods', amount: 45, maxCapacity: 100, unit: 'Flaschen', pricePerUnit: 15, condition: 'gut' }
        ],
        roles: [
          { id: 'role-a-1', name: 'Gutsherr / Besitzer', assignedToName: 'Spieler', isUserPosition: true, authorities: ['Betriebsbeschlüsse fassen', 'Budget & Finanzen freigeben', 'Personal einstellen & entlassen', 'Gewinne entnehmen'], responsibilities: ['Gesamtleitung', 'Repräsentation'], salary: 60, workplaceArea: 'Herrenhaus' },
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

    default: // Taverne / Gasthaus / etc.
      return {
        resources: [
          { id: 'res-t1', name: 'Getränke & Edelkorn', category: 'food_drink', amount: 50, maxCapacity: 140, unit: 'Fässer', pricePerUnit: 6, condition: 'gut' },
          { id: 'res-t2', name: 'Zutaten & Frischwaren', category: 'food_drink', amount: 35, maxCapacity: 90, unit: 'Kisten', pricePerUnit: 8, condition: 'gut' },
          { id: 'res-t3', name: 'Gästezimmer & Betten', category: 'capacity', amount: 8, maxCapacity: 14, unit: 'Zimmer', pricePerUnit: 16, condition: 'exzellent' }
        ],
        roles: [
          { id: 'role-t-1', name: 'Besitzer / Wirt', assignedToName: 'Spieler', isUserPosition: true, authorities: ['Preise festlegen', 'Personal einstellen & entlassen', 'Gewinne entnehmen', 'Ausbauten & Upgrades anordnen'], responsibilities: ['Finanzen', 'Hauptentscheidungen'], salary: 30, workplaceArea: 'Schankraum' },
          { id: 'role-t-2', name: 'Verwalterin / Schankmaid', assignedToName: 'Wirtin Karin', superiorRole: 'Besitzer / Wirt', authorities: ['Tagesgeschäft leiten', 'Lagerbestände & Einkauf verwalten', 'Aufgaben & Pflichten delegieren'], responsibilities: ['Ausschank leiten', 'Zimmervergabe'], salary: 18, workplaceArea: 'Tresen' }
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
          { id: 'ord-t1', title: 'Sondergelage für Handelsgilde ausrichten', issuerName: 'Gildenmeister', recipientName: 'Besitzer / Wirt', targetGoal: 'Festtafel für 15 Ehrengäste eindecken', deadline: 'Freitagabend', priority: 'hoch', progress: 20, reward: '120 Gold & Handelsrabatt', status: 'in_bearbeitung' }
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
