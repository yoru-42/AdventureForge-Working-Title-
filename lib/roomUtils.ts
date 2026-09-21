import { HoldingRoom, HoldingRoomType, RoomOccupancyMode } from '../types';

export type { HoldingRoomType, RoomOccupancyMode };

export interface RoomCategoryDef {
  id: string;
  label: string;
  roomTypes: HoldingRoomType[];
}

export interface RoomTypeMeta {
  type: HoldingRoomType;
  label: string;
  category: string;
  categoryLabel: string;
  defaultBeds: number;
  defaultMode?: RoomOccupancyMode;
  defaultOccupancy?: RoomOccupancyMode;
  hasBeds: boolean;
  isSleepingRoom?: boolean;
  defaultPurpose?: string;
}

export const ROOM_CATEGORIES: RoomCategoryDef[] = [
  {
    id: 'living',
    label: 'Wohn- und Schlafräume',
    roomTypes: [
      'family_room',
      'bedroom',
      'guest_room',
      'staff_room',
      'shared_staff_room',
      'dormitory',
      'servant_room',
      'guard_quarters',
      'barracks_room'
    ]
  },
  {
    id: 'working',
    label: 'Wirtschafts- und Arbeitsräume',
    roomTypes: [
      'kitchen',
      'workshop',
      'forge',
      'office',
      'sales_room',
      'tap_room',
      'dining_room',
      'production_room'
    ]
  },
  {
    id: 'storage',
    label: 'Lagerung',
    roomTypes: [
      'storage',
      'pantry',
      'warehouse_room',
      'cellar',
      'cold_storage'
    ]
  },
  {
    id: 'utility',
    label: 'Versorgung & Sanitär',
    roomTypes: [
      'bathroom',
      'washroom',
      'toilet',
      'utility_room',
      'heating_room'
    ]
  },
  {
    id: 'admin_public',
    label: 'Verwaltung, Öffentlichkeit & Andacht',
    roomTypes: [
      'meeting_room',
      'council_room',
      'archive',
      'classroom',
      'prayer_room',
      'chapel',
      'audience_room'
    ]
  },
  {
    id: 'access',
    label: 'Erschließung (Flure & Treppen)',
    roomTypes: [
      'entrance',
      'hallway',
      'corridor',
      'stairway',
      'stairwell',
      'vestibule'
    ]
  },
  {
    id: 'outdoor',
    label: 'Außen- & Funktionsbereiche',
    roomTypes: [
      'courtyard',
      'yard',
      'garden',
      'terrace',
      'stable_yard',
      'work_yard'
    ]
  }
];

export const ROOM_TYPE_METADATA: Record<string, RoomTypeMeta> = {
  // Wohn- und Schlafräume
  family_room: {
    type: 'family_room',
    label: 'Familienzimmer',
    category: 'living',
    categoryLabel: 'Wohn- und Schlafräume',
    defaultBeds: 2,
    defaultMode: 'family',
    hasBeds: true,
    defaultPurpose: 'Wohnraum & Schlaflager für Familienmitglieder'
  },
  bedroom: {
    type: 'bedroom',
    label: 'Schlafzimmer (Privat)',
    category: 'living',
    categoryLabel: 'Wohn- und Schlafräume',
    defaultBeds: 1,
    defaultMode: 'private',
    hasBeds: true,
    defaultPurpose: 'Rückzugsort & Schlafraum'
  },
  guest_room: {
    type: 'guest_room',
    label: 'Gästezimmer',
    category: 'living',
    categoryLabel: 'Wohn- und Schlafräume',
    defaultBeds: 2,
    defaultMode: 'guest',
    hasBeds: true,
    defaultPurpose: 'Unterkunft für zahlende Gäste und Reisende'
  },
  staff_room: {
    type: 'staff_room',
    label: 'Personal-Einzelzimmer',
    category: 'living',
    categoryLabel: 'Wohn- und Schlafräume',
    defaultBeds: 1,
    defaultMode: 'staff',
    hasBeds: true,
    defaultPurpose: 'Feste Unterkunft für Angestellte (Einzelbelegung)'
  },
  shared_staff_room: {
    type: 'shared_staff_room',
    label: 'Personal-Gemeinschaftszimmer',
    category: 'living',
    categoryLabel: 'Wohn- und Schlafräume',
    defaultBeds: 3,
    defaultMode: 'staff',
    hasBeds: true,
    defaultPurpose: 'Gemeinsame Unterkunft für Hilfskräfte & Bedienstete'
  },
  dormitory: {
    type: 'dormitory',
    label: 'Mehrbettzimmer / Schlafsaal',
    category: 'living',
    categoryLabel: 'Wohn- und Schlafräume',
    defaultBeds: 4,
    defaultMode: 'shared',
    hasBeds: true,
    defaultPurpose: 'Gemeinschafts-Schlaflager für Reisende oder Knechte'
  },
  servant_room: {
    type: 'servant_room',
    label: 'Dienstbotenzimmer',
    category: 'living',
    categoryLabel: 'Wohn- und Schlafräume',
    defaultBeds: 2,
    defaultMode: 'staff',
    hasBeds: true,
    defaultPurpose: 'Quartier für Hausangestellte & Gesellen'
  },
  guard_quarters: {
    type: 'guard_quarters',
    label: 'Wachstube & Quartier',
    category: 'living',
    categoryLabel: 'Wohn- und Schlafräume',
    defaultBeds: 2,
    defaultMode: 'staff',
    hasBeds: true,
    defaultPurpose: 'Bereitschaftsraum & Ruhestätte der Wachposten'
  },
  barracks_room: {
    type: 'barracks_room',
    label: 'Kasernenstube',
    category: 'living',
    categoryLabel: 'Wohn- und Schlafräume',
    defaultBeds: 4,
    defaultMode: 'shared',
    hasBeds: true,
    defaultPurpose: 'Militärische Mannschaftsunterkunft'
  },

  // Wirtschafts- und Arbeitsräume
  kitchen: {
    type: 'kitchen',
    label: 'Küche',
    category: 'working',
    categoryLabel: 'Wirtschafts- und Arbeitsräume',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Speisenzubereitung, Kochen & Backen'
  },
  workshop: {
    type: 'workshop',
    label: 'Werkstatt',
    category: 'working',
    categoryLabel: 'Wirtschafts- und Arbeitsräume',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Handwerkliche Fertigung & Reparaturen'
  },
  forge: {
    type: 'forge',
    label: 'Schmiede / Esse',
    category: 'working',
    categoryLabel: 'Wirtschafts- und Arbeitsräume',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Feuerstelle, Amboss & Metallbearbeitung'
  },
  office: {
    type: 'office',
    label: 'Büro / Schreibstube',
    category: 'working',
    categoryLabel: 'Wirtschafts- und Arbeitsräume',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Verwaltung, Buchführung, Korrespondenz & Archiv'
  },
  sales_room: {
    type: 'sales_room',
    label: 'Verkaufsraum / Ladenstube',
    category: 'working',
    categoryLabel: 'Wirtschafts- und Arbeitsräume',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Warenpräsentation & Kundengeschäft'
  },
  tap_room: {
    type: 'tap_room',
    label: 'Schankraum & Gaststube',
    category: 'working',
    categoryLabel: 'Wirtschafts- und Arbeitsräume',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Bewirtung von Gästen, Ausschank & Geselligkeit'
  },
  dining_room: {
    type: 'dining_room',
    label: 'Speisesaal / Esszimmer',
    category: 'working',
    categoryLabel: 'Wirtschafts- und Arbeitsräume',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Gemeinsame Mahlzeiten & Bankette'
  },
  production_room: {
    type: 'production_room',
    label: 'Produktionsraum',
    category: 'working',
    categoryLabel: 'Wirtschafts- und Arbeitsräume',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Herstellung, Verarbeitung & Veredelung von Gütern'
  },

  // Lagerung
  storage: {
    type: 'storage',
    label: 'Lagerraum / Magazin',
    category: 'storage',
    categoryLabel: 'Lagerung',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Aufbewahrung von Waren, Kisten & Ausrüstung'
  },
  pantry: {
    type: 'pantry',
    label: 'Vorratskammer / Speisekammer',
    category: 'storage',
    categoryLabel: 'Lagerung',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Lagerung von Trockenlebensmitteln & Zutaten'
  },
  warehouse_room: {
    type: 'warehouse_room',
    label: 'Warenlager / Großdepot',
    category: 'storage',
    categoryLabel: 'Lagerung',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Großhandelslagerung auf Paletten & Ballen'
  },
  cellar: {
    type: 'cellar',
    label: 'Gewölbekeller / Bierlager',
    category: 'storage',
    categoryLabel: 'Lagerung',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Kühle Lagerung von Fässern, Weinen & Vorräten'
  },
  cold_storage: {
    type: 'cold_storage',
    label: 'Kühlkeller / Eiskammer',
    category: 'storage',
    categoryLabel: 'Lagerung',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Dauerhafte Kühlung von Fleisch, Fisch & Frischewaren'
  },

  // Versorgung
  bathroom: {
    type: 'bathroom',
    label: 'Badezimmer / Badehaus',
    category: 'utility',
    categoryLabel: 'Versorgung & Sanitär',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Körperpflege, Zuber & Erholung'
  },
  washroom: {
    type: 'washroom',
    label: 'Waschraum / Waschküche',
    category: 'utility',
    categoryLabel: 'Versorgung & Sanitär',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Wäschereinigung & Zuberpflege'
  },
  toilet: {
    type: 'toilet',
    label: 'Toilette / Abort',
    category: 'utility',
    categoryLabel: 'Versorgung & Sanitär',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Sanitäre Einrichtung'
  },
  utility_room: {
    type: 'utility_room',
    label: 'Wirtschaftsraum / Gerätekammer',
    category: 'utility',
    categoryLabel: 'Versorgung & Sanitär',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Putzmittel, Hauswirtschaft & Reparaturmaterial'
  },
  heating_room: {
    type: 'heating_room',
    label: 'Heizraum / Kesselhaus',
    category: 'utility',
    categoryLabel: 'Versorgung & Sanitär',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Ofenfeuerung, Warmwasser & Rauchabzug'
  },

  // Verwaltung / Öffentlichkeit / Religion
  meeting_room: {
    type: 'meeting_room',
    label: 'Sitzungszimmer / Konferenzraum',
    category: 'admin_public',
    categoryLabel: 'Verwaltung, Öffentlichkeit & Andacht',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Besprechungen, Verhandlungen & Tagungen'
  },
  council_room: {
    type: 'council_room',
    label: 'Ratsstube',
    category: 'admin_public',
    categoryLabel: 'Verwaltung, Öffentlichkeit & Andacht',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Amtliche Beschlüsse & Führungsberatung'
  },
  archive: {
    type: 'archive',
    label: 'Archiv / Bibliothek',
    category: 'admin_public',
    categoryLabel: 'Verwaltung, Öffentlichkeit & Andacht',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Aufbewahrung von Dokumenten, Schriftrollen & Büchern'
  },
  classroom: {
    type: 'classroom',
    label: 'Lehrsaal / Schulungsraum',
    category: 'admin_public',
    categoryLabel: 'Verwaltung, Öffentlichkeit & Andacht',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Ausbildung von Lehrlingen & Unterricht'
  },
  prayer_room: {
    type: 'prayer_room',
    label: 'Andachtsraum',
    category: 'admin_public',
    categoryLabel: 'Verwaltung, Öffentlichkeit & Andacht',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Stille Einkehr, Gebet & Besinnung'
  },
  chapel: {
    type: 'chapel',
    label: 'Hauskapelle / Altarraum',
    category: 'admin_public',
    categoryLabel: 'Verwaltung, Öffentlichkeit & Andacht',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Religiöse Zeremonien, Segnungen & Gottesdienst'
  },
  audience_room: {
    type: 'audience_room',
    label: 'Audienzsaal / Empfangszimmer',
    category: 'admin_public',
    categoryLabel: 'Verwaltung, Öffentlichkeit & Andacht',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Formelle Begrüßung von Bittstellern & Würdenträgern'
  },

  // Erschließung
  entrance: {
    type: 'entrance',
    label: 'Eingangsbereich / Foyer',
    category: 'access',
    categoryLabel: 'Erschließung (Flure & Treppen)',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Haupteingang & Empfang von Ankommenden'
  },
  hallway: {
    type: 'hallway',
    label: 'Flur / Gang',
    category: 'access',
    categoryLabel: 'Erschließung (Flure & Treppen)',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Verbindungsweg zwischen Räumen'
  },
  corridor: {
    type: 'corridor',
    label: 'Wandelgang / Galerie',
    category: 'access',
    categoryLabel: 'Erschließung (Flure & Treppen)',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Überdachter Verbindungsgang'
  },
  stairway: {
    type: 'stairway',
    label: 'Treppenhaus',
    category: 'access',
    categoryLabel: 'Erschließung (Flure & Treppen)',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Geschosswechsel & Erschließung'
  },
  stairwell: {
    type: 'stairwell',
    label: 'Treppenaufgang',
    category: 'access',
    categoryLabel: 'Erschließung (Flure & Treppen)',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Treppenzugang zu oberen oder unteren Etagen'
  },
  vestibule: {
    type: 'vestibule',
    label: 'Windfang / Vorhalle',
    category: 'access',
    categoryLabel: 'Erschließung (Flure & Treppen)',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Kälteschutz & Vorraum vor dem Hauptgebäude'
  },

  // Außen-/Funktionsbereiche
  courtyard: {
    type: 'courtyard',
    label: 'Innenhof',
    category: 'outdoor',
    categoryLabel: 'Außen- & Funktionsbereiche',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Zentraler Hof für Aktivitäten & Durchgang'
  },
  yard: {
    type: 'yard',
    label: 'Wirtschaftshof',
    category: 'outdoor',
    categoryLabel: 'Außen- & Funktionsbereiche',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Arbeitsbereich, Be- und Entladung'
  },
  garden: {
    type: 'garden',
    label: 'Garten / Kräutergarten',
    category: 'outdoor',
    categoryLabel: 'Außen- & Funktionsbereiche',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Anbau von Gemüse, Kräutern oder Zierpflanzen'
  },
  terrace: {
    type: 'terrace',
    label: 'Terrasse / Vorplatz',
    category: 'outdoor',
    categoryLabel: 'Außen- & Funktionsbereiche',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Außenbereich für Sitzplätze oder Aussicht'
  },
  stable_yard: {
    type: 'stable_yard',
    label: 'Stallhof / Pferdestallung',
    category: 'outdoor',
    categoryLabel: 'Außen- & Funktionsbereiche',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Unterbringung, Fütterung & Pflege von Reittieren'
  },
  work_yard: {
    type: 'work_yard',
    label: 'Werkhof / Materialplatz',
    category: 'outdoor',
    categoryLabel: 'Außen- & Funktionsbereiche',
    defaultBeds: 0,
    hasBeds: false,
    defaultPurpose: 'Grobarbeiten im Freien & Materialzwischenlager'
  }
};

export const OCCUPANCY_MODE_OPTIONS: { id: RoomOccupancyMode; label: string; description: string }[] = [
  { id: 'guest', label: 'Gäste', description: 'Beherbergung zahlender Gäste' },
  { id: 'staff', label: 'Personal', description: 'Feste Unterkunft für Mitarbeiter' },
  { id: 'family', label: 'Familie', description: 'Wohnbereich der Eigentümerfamilie' },
  { id: 'private', label: 'Privat', description: 'Individuelle Einzelnutzung' },
  { id: 'shared', label: 'Gemeinschaft', description: 'Gemeinsame Nutzung durch mehrere Personen' },
  { id: 'mixed', label: 'Gemischt', description: 'Flexible / kombinierte Belegung' }
];

/**
 * Ermittelt automatisch den passenden Raumtyp anhand des Namens, falls keiner gesetzt ist.
 */
export function inferRoomTypeFromName(name: string): HoldingRoomType | undefined {
  const n = (name || '').toLowerCase();
  if (n.includes('gaststube') || n.includes('schankraum') || n.includes('schenke')) return 'tap_room';
  if (n.includes('küche') || n.includes('backstube')) return 'kitchen';
  if (n.includes('gästezimmer') || n.includes('gastzimmer') || n.includes('herberge')) return 'guest_room';
  if (n.includes('personal') || n.includes('geselle') || n.includes('knecht') || n.includes('magd')) {
    return n.includes('gemeinschaft') || n.includes('mehrbett') ? 'shared_staff_room' : 'staff_room';
  }
  if (n.includes('familie')) return 'family_room';
  if (n.includes('schlafsaal') || n.includes('mehrbett')) return 'dormitory';
  if (n.includes('schlafzimmer') || n.includes('schlafgemach')) return 'bedroom';
  if (n.includes('vorrat') || n.includes('speisekammer')) return 'pantry';
  if (n.includes('keller') || n.includes('gewölbekeller') || n.includes('bierlager')) return 'cellar';
  if (n.includes('lager') || n.includes('magazin') || n.includes('depot')) return 'storage';
  if (n.includes('schmiede') || n.includes('esse')) return 'forge';
  if (n.includes('werkstatt')) return 'workshop';
  if (n.includes('stall') || n.includes('remise') || n.includes('pferde')) return 'stable_yard';
  if (n.includes('büro') || n.includes('schreibstube') || n.includes('kontor')) return 'office';
  if (n.includes('saal') || n.includes('festsaal') || n.includes('speisesaal')) return 'dining_room';
  if (n.includes('laden') || n.includes('verkauf')) return 'sales_room';
  if (n.includes('wasch') || n.includes('bade')) return 'washroom';
  if (n.includes('toilette') || n.includes('abort') || n.includes('wc')) return 'toilet';
  if (n.includes('flur') || n.includes('gang')) return 'hallway';
  if (n.includes('treppe')) return 'stairway';
  if (n.includes('eingang') || n.includes('foyer')) return 'entrance';
  if (n.includes('hof') || n.includes('innenhof')) return 'courtyard';
  return undefined;
}

/**
 * Normalisiert einen HoldingRoom und berechnet Betten, freie Kapazitäten und Standardwerte.
 * Gewährleistet vollständige Abwärtskompatibilität alter Datensätze.
 */
export function normalizeHoldingRoom(raw: Partial<HoldingRoom>): HoldingRoom {
  const count = Math.max(1, Number(raw.count) || 1);
  const name = (raw.name || 'Raum').trim();
  const roomType = raw.roomType || inferRoomTypeFromName(name);
  const meta = roomType ? ROOM_TYPE_METADATA[roomType] : undefined;

  let bedsPerRoom = raw.bedsPerRoom;
  if (bedsPerRoom === undefined || bedsPerRoom === null) {
    if (meta && meta.hasBeds) {
      bedsPerRoom = meta.defaultBeds;
    } else {
      // Inferred from name if relevant
      const n = name.toLowerCase();
      if (n.includes('einzelzimmer') || n.includes('einzel')) bedsPerRoom = 1;
      else if (n.includes('doppelzimmer') || n.includes('doppel')) bedsPerRoom = 2;
      else if (n.includes('schlafzimmer') || n.includes('gäste')) bedsPerRoom = 2;
      else if (n.includes('mehrbett') || n.includes('schlafsaal')) bedsPerRoom = 4;
      else bedsPerRoom = 0;
    }
  }
  bedsPerRoom = Math.max(0, Number(bedsPerRoom) || 0);

  const totalBeds = count * bedsPerRoom;
  const occupiedBeds = Math.min(totalBeds, Math.max(0, Number(raw.occupiedBeds) || 0));
  const freeBeds = Math.max(0, totalBeds - occupiedBeds);

  let occupancyMode = raw.occupancyMode;
  if (!occupancyMode && bedsPerRoom > 0) {
    occupancyMode = meta?.defaultMode || (name.toLowerCase().includes('gast') ? 'guest' : name.toLowerCase().includes('personal') ? 'staff' : 'shared');
  }

  return {
    id: raw.id || `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    count,
    roomType,
    purpose: raw.purpose || meta?.defaultPurpose || '',
    bedsPerRoom,
    totalBeds,
    occupiedBeds,
    freeBeds,
    occupancyMode,
    privacy: raw.privacy || (bedsPerRoom > 0 ? (bedsPerRoom > 2 ? 'shared' : 'private') : 'public'),
    capacity: raw.capacity,
    currentOccupancy: raw.currentOccupancy,
    required: raw.required !== undefined ? raw.required : true,
    optional: raw.optional !== undefined ? raw.optional : false,
    floor: raw.floor || '',
    occupantIds: Array.isArray(raw.occupantIds) ? raw.occupantIds : [],
    occupantNames: Array.isArray(raw.occupantNames) ? raw.occupantNames : [],
    notes: raw.notes || ''
  };
}

/**
 * Berechnet Gesamtstatistiken eines Gebäudes / Holdings über alle definierten Räume.
 */
export function calculateHoldingRoomStats(rooms: (HoldingRoom | Partial<HoldingRoom>)[]) {
  let totalRooms = 0;
  let totalBeds = 0;
  let occupiedBeds = 0;
  let freeBeds = 0;

  const guestBeds = { total: 0, occupied: 0, free: 0 };
  const staffBeds = { total: 0, occupied: 0, free: 0 };
  const familyBeds = { total: 0, occupied: 0, free: 0 };
  const otherBeds = { total: 0, occupied: 0, free: 0 };

  (rooms || []).forEach(r => {
    const norm = normalizeHoldingRoom(r);
    totalRooms += norm.count;
    totalBeds += norm.totalBeds || 0;
    occupiedBeds += norm.occupiedBeds || 0;
    freeBeds += norm.freeBeds || 0;

    const tBeds = norm.totalBeds || 0;
    const oBeds = norm.occupiedBeds || 0;
    const fBeds = norm.freeBeds || 0;

    if (norm.occupancyMode === 'guest') {
      guestBeds.total += tBeds;
      guestBeds.occupied += oBeds;
      guestBeds.free += fBeds;
    } else if (norm.occupancyMode === 'staff') {
      staffBeds.total += tBeds;
      staffBeds.occupied += oBeds;
      staffBeds.free += fBeds;
    } else if (norm.occupancyMode === 'family') {
      familyBeds.total += tBeds;
      familyBeds.occupied += oBeds;
      familyBeds.free += fBeds;
    } else if (tBeds > 0) {
      otherBeds.total += tBeds;
      otherBeds.occupied += oBeds;
      otherBeds.free += fBeds;
    }
  });

  return {
    totalRooms,
    totalBeds,
    occupiedBeds,
    freeBeds,
    guestBeds,
    staffBeds,
    familyBeds,
    otherBeds
  };
}

/**
 * Erzeugt eine lesbare, übersichtliche Text-Zusammenfassung der Räume für `roomsOrAreas`.
 */
export function generateRoomsSummaryString(rooms: HoldingRoom[]): string {
  if (!rooms || rooms.length === 0) return '';
  return rooms.map(r => {
    const c = r.count || 1;
    const b = r.bedsPerRoom ? ` (${c * r.bedsPerRoom} Betten)` : '';
    return `${c}x ${r.name}${b}`;
  }).join(', ');
}

/**
 * Erzeugt eine konsistente Kapazitätsangabe für `physicalCapacity` basierend auf den Betten.
 */
export function generateRoomCapacityString(rooms: HoldingRoom[], fallbackCapacity?: string): string {
  const stats = calculateHoldingRoomStats(rooms);
  if (stats.totalBeds > 0) {
    const parts: string[] = [];
    if (stats.guestBeds.total > 0) {
      parts.push(`${stats.guestBeds.total} Gästebetten (${stats.guestBeds.occupied} belegt, ${stats.guestBeds.free} frei)`);
    }
    if (stats.staffBeds.total > 0) {
      parts.push(`${stats.staffBeds.total} Personalbetten (${stats.staffBeds.occupied} belegt)`);
    }
    if (stats.familyBeds.total > 0) {
      parts.push(`${stats.familyBeds.total} Familienbetten`);
    }
    if (parts.length > 0) {
      return parts.join(', ');
    }
    return `${stats.totalBeds} Betten (${stats.occupiedBeds} belegt, ${stats.freeBeds} frei)`;
  }
  return fallbackCapacity || 'Keine Schlafkapazität';
}
