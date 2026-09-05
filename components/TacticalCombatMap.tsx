import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlacedCombatObject, 
  Territory, 
  TacticalFormation, 
  TacticalDirection, 
  TacticalEntity, 
  TacticalGroup, 
  CombatState 
} from '../types';
import { 
  spawnTacticalGroup, 
  changeTacticalGroupFormation, 
  splitTacticalGroup,
  executeTacticalCommand,
  moveTacticalEntity,
  moveTacticalGroup,
  parseTacticalCommandsFromText
} from '../utils/tacticalEngine';
import { formatDisplayLocationName } from '../utils/mapUtils';

interface NPC {
  id: string;
  name: string;
  role?: string;
  isHostile?: boolean;
  hp?: number;
  maxHp?: number;
}

interface Opponent {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  role?: string;
  count?: number;
  isFodder?: boolean;
  spawnSource?: string;
}

interface LoreNode {
  id: string;
  title: string;
  category: string;
  details?: {
    coordinates?: { x: number; y: number };
    mapLevel?: 'macro' | 'meso' | 'micro';
    parentPlaceId?: string;
    isActiveTarget?: boolean;
    description?: string;
    currentLocation?: string;
  };
}

interface TacticalCombatMapProps {
  adventure: any;
  onUpdateAdventure: (updated: any) => void;
  messages: any[];
  isCombatActive: boolean;
  opponents: Opponent[];
}

const TACTICAL_FORMATIONS: { id: TacticalFormation; label: string }[] = [
  { id: 'line', label: 'Linie' },
  { id: 'column', label: 'Kolonne' },
  { id: 'wedge', label: 'Keil' },
  { id: 'square', label: 'Quadrat' },
  { id: 'circle', label: 'Kreis' },
  { id: 'loose', label: 'Locker' },
  { id: 'swarm', label: 'Schwarm' },
  { id: 'spread', label: 'Verteilt' },
  { id: 'defensive_line', label: 'Verteidigung' },
  { id: 'archer_line', label: 'Schützen' },
  { id: 'wall', label: 'Mauer' },
  { id: 'scattered', label: 'Gestreut' }
];

const TACTICAL_DIRECTIONS: { id: TacticalDirection; label: string }[] = [
  { id: 'north', label: 'Norden' },
  { id: 'south', label: 'Süden' },
  { id: 'east', label: 'Osten' },
  { id: 'west', label: 'Westen' },
  { id: 'northeast', label: 'Nordost' },
  { id: 'northwest', label: 'Nordwest' },
  { id: 'southeast', label: 'Südost' },
  { id: 'southwest', label: 'Südwest' }
];

export const isBuildingObject = (obj: any): boolean => {
  if (!obj) return false;
  const cat = (obj.category || '').toLowerCase();
  const name = (obj.name || '').toLowerCase();
  const icon = (obj.icon || '');
  return (
    cat.includes('gebäude') || 
    cat.includes('festung') || 
    cat.includes('building') || 
    cat.includes('structure') ||
    cat.includes('konstruktion') ||
    name.includes('haus') ||
    name.includes('hütte') ||
    name.includes('turm') ||
    name.includes('schmiede') ||
    name.includes('lagerhaus') ||
    name.includes('gildehaus') ||
    name.includes('mausoleum') ||
    name.includes('festung') ||
    name.includes('burg') ||
    name.includes('schloss') ||
    name.includes('tempel') ||
    name.includes('gasthaus') ||
    name.includes('taverne') ||
    icon === '🏰' ||
    icon === '🏠' ||
    icon === '🗼' ||
    icon === '🏛️' ||
    icon === '🏫' ||
    icon === '🏬' ||
    icon === '🏘️'
  );
};

// 7 Universal Object Classes across 7 Settings
export const MAP_ASSETS = [
  // FANTASY
  {
    setting: 'Fantasy',
    category: 'Deckung / Hindernis',
    name: 'Steinsäule',
    icon: '🪨',
    description: 'Bietet schwere Deckung vor Fernkampfangriffen.',
    rules: 'Volle Deckung (+4 RK gegen Fernkampf, blockiert Sicht).'
  },
  {
    setting: 'Fantasy',
    category: 'Deckung / Hindernis',
    name: 'Baumstamm',
    icon: '🪵',
    description: 'Umgestürzter moosiger Baumstamm.',
    rules: 'Halbe Deckung (+2 RK). Erfordert doppelte Bewegung zum Überwinden.'
  },
  {
    setting: 'Fantasy',
    category: 'Durchgänge / Barrieren',
    name: 'Verschlossene Eisentür',
    icon: '🚪',
    description: 'Eine schwere Eisentür blockiert den Raum.',
    rules: 'Blockiert Durchgang. Kann geknackt (SG 15) oder eingetreten werden.'
  },
  {
    setting: 'Fantasy',
    category: 'Durchgänge / Barrieren',
    name: 'Spinnennetz',
    icon: '🕸️',
    description: 'Klebrige Riesen-Spinnennetze.',
    rules: 'Verwickelt Einheiten (Bewegung 0). Kann mit Feuer verbrannt werden.'
  },
  {
    setting: 'Fantasy',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Lavariß',
    icon: '🌋',
    description: 'Glühender Magmafluß im felsigen Boden.',
    rules: 'Verursacht 2d6 Feuerschaden beim Betreten oder Beenden der Runde darin.'
  },
  {
    setting: 'Fantasy',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Speer-Fallgrube',
    icon: '🕳️',
    description: 'Eine getarnte Fallgrube mit gespitzten Holzpfählen.',
    rules: 'Wahrnehmungswurf nötig. Verursacht 1d10 physischen Schaden und verlangsamt.'
  },
  {
    setting: 'Fantasy',
    category: 'Behälter / Schätze',
    name: 'Schatztruhe',
    icon: '🧰',
    description: 'Eine edle alte Holztruhe mit Messingbeschlägen.',
    rules: 'Verschlossen oder offen. Enthält Beute, Waffen, Gold oder Tränke.'
  },
  {
    setting: 'Fantasy',
    category: 'Behälter / Schätze',
    name: 'Antike Urne',
    icon: '🏺',
    description: 'Eine staubige Tonurne aus vergangenen Zeitaltern.',
    rules: 'Kann zerschlagen werden (1 HP). Lässt zufällig Münzen oder Tränke fallen.'
  },
  {
    setting: 'Fantasy',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Rostiger Hebel',
    icon: '⚙️',
    description: 'Ein großer mechanischer Hebel an einer Wandhalterung.',
    rules: 'Interaktions-Aktion: Öffnet Tore, senkt Brücken oder löst Fallen aus.'
  },
  {
    setting: 'Fantasy',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Runen-Druckplatte',
    icon: '🔮',
    description: 'Ein magischer Kreis auf einer Bodenplatte.',
    rules: 'Löst beim Betreten Effekte aus (Feuerfalle, Teleportation, Geheimtür).'
  },
  {
    setting: 'Fantasy',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Holzkarren',
    icon: '🛒',
    description: 'Ein alter Händlerkarren, mit Heu gefüllt.',
    rules: 'Kann geschoben werden. Bietet bewegliche halbe Deckung.'
  },
  {
    setting: 'Fantasy',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Ruderboot',
    icon: '🛶',
    description: 'Ein kleines, wackliges Holzboot.',
    rules: 'Ermöglicht das Überqueren von Gewässern ohne Abzug.'
  },
  {
    setting: 'Fantasy',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Tavernentisch',
    icon: '🪑',
    description: 'Massiver Eichentisch für Gäste.',
    rules: 'Kann umgeworfen werden, um halbe Deckung zu erzeugen.'
  },
  {
    setting: 'Fantasy',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Kerzenständer',
    icon: '🕯️',
    description: 'Ein mannshoher, schwerer Eisenleuchter.',
    rules: 'Spendet Licht. Kann umgestoßen werden, um Feinde zu blenden/anzuzünden.'
  },

  // SCI-FI
  {
    setting: 'Sci-Fi',
    category: 'Deckung / Hindernis',
    name: 'Durastahl-Kiste',
    icon: '🛢️',
    description: 'Militärischer Behälter aus gehärtetem Durastahl.',
    rules: 'Bietet unzerstörbare Deckung vor Projektilen und Laserstrahlen.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Deckung / Hindernis',
    name: 'Kryo-Kapsel',
    icon: '🧊',
    description: 'Mit flüssigem Stickstoff gefüllte Schlafkapsel.',
    rules: 'Halbe Deckung. Bei Zerstörung explodiert sie und friert angrenzende Ziele ein.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Durchgänge / Barrieren',
    name: 'Laser-Barriere',
    icon: '⚡',
    description: 'Ein rotes Netz aus hochenergetischen Laserstrahlen.',
    rules: 'Blockiert Durchgang. Verursacht 3d6 Energieschaden beim Durchqueren.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Durchgänge / Barrieren',
    name: 'Kraftfeld-Generator',
    icon: '🛡️',
    description: 'Ein tragbarer Generator, der ein blaues Schutzschild projiziert.',
    rules: 'Blockiert Fernkampfschüsse, erlaubt aber das Durchgehen von Einheiten.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Plasmareaktor',
    icon: '☢️',
    description: 'Ein flackernder, instabiler Fusionsreaktor.',
    rules: 'Verursacht jede Runde Strahlungsschaden (1d6) im Umkreis von 1 Feld.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Giftrohr-Leck',
    icon: '🌫️',
    description: 'Ein geborstenes Rohr, aus dem grünes Kühlgas strömt.',
    rules: 'Reduziert die Sichtweite auf 0 und verursacht Giftschaden (1d8) pro Runde.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Behälter / Schätze',
    name: 'Kargokiste',
    icon: '🦾',
    description: 'Holografisch gesicherte Hightech-Kiste.',
    rules: 'Erfordert Hacken. Enthält Plasmagewehre, Stimpacks oder Nanobots.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Behälter / Schätze',
    name: 'Plasmakern',
    icon: '🔋',
    description: 'Ein hochenergetisches, leuchtendes Energiemodul.',
    rules: 'Kann als Sprengstoff geworfen werden oder Energieanlagen reaktivieren.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Sicherheits-Terminal',
    icon: '🖥️',
    description: 'Ein blinkendes holografisches Kontrollterminal.',
    rules: 'Ermöglicht das Hacken von Verteidigungstürmen, Kameras oder Türen.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Not-Aus-Knopf',
    icon: '🔴',
    description: 'Ein gut sichtbarer roter Taster unter Glas.',
    rules: 'Aktion: Deaktiviert alle Laser-Barrieren oder startet den Selbstzerstörungs-Stopp.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Hoverboard',
    icon: '🛸',
    description: 'Schwebegleiter für eine Person.',
    rules: 'Erhöht die Bewegungsrate des Nutzers um +3 Felder pro Runde.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Bergbau-Drohne',
    icon: '🤖',
    description: 'Eine schwebende Hilfsdrohne mit Greifarm.',
    rules: 'Kann ferngesteuert werden, um Gegenstände über Gefahren hinwegzutragen.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Holo-Projektor',
    icon: '📡',
    description: 'Projiziert dreidimensionale Sternenkarten.',
    rules: 'Spendet bläuliches Licht, irritiert optische Sensoren von Robotern.'
  },
  {
    setting: 'Sci-Fi',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Medi-Liege',
    icon: '🧬',
    description: 'Automatisierte Heilstation für Raumschiffe.',
    rules: 'Aktion darin beenden heilt 2d4 Trefferpunkte (einmalig nutzbar).'
  },

  // CYBERPUNK
  {
    setting: 'Cyberpunk',
    category: 'Deckung / Hindernis',
    name: 'Müllcontainer',
    icon: '🗑️',
    description: 'Schwerer Stahlcontainer voller Elektroschrott.',
    rules: 'Bietet massive, unzerstörbare Deckung gegen Handfeuerwaffen.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Deckung / Hindernis',
    name: 'Neon-Holo-Säule',
    icon: '🗼',
    description: 'Flackernde Lichtsäule, die Cola oder Implantate bewirbt.',
    rules: 'Sichtschutz. Angreifer erleiden Nachteil durch blendendes Neonlicht.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Durchgänge / Barrieren',
    name: 'Sicherheits-Drehkreuz',
    icon: '🚧',
    description: 'Ein stabiles Drehkreuz mit Netzhaut-Scanner.',
    rules: 'Blockiert Durchgang. Kann gehackt oder mit gefälschtem Ausweis passiert werden.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Durchgänge / Barrieren',
    name: 'Elektro-Zaun',
    icon: '⛓️',
    description: 'Hochspannungszaun zum Schutz von Konzerngebäuden.',
    rules: 'Verursacht 2d6 Schockschaden bei Berührung. Macht Opfer kurzzeitig handlungsunfähig.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Stromkabel im Wasser',
    icon: '💥',
    description: 'Ein abgerissenes Stromkabel funkelt in einer nassen Pfütze.',
    rules: 'Elektrisiert die Pfütze. Betreten verursacht 1d10 Blitzschaden und Betäubung.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Säurefass',
    icon: '🧪',
    description: 'Ein korrodiertes Fass mit Industriesäure.',
    rules: 'Explodiert bei Beschuss (Säurespritzer im Umkreis von 2 Feldern, verätzt Rüstung).'
  },
  {
    setting: 'Cyberpunk',
    category: 'Behälter / Schätze',
    name: 'Chiffrierter Koffer',
    icon: '💼',
    description: 'Ein modischer Aluminiumkoffer mit biometrischem Schloss.',
    rules: 'Enthält illegale Cyberware, Credsticks (Geld) oder illegale Booster-Drogen.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Behälter / Schätze',
    name: 'Konzern-Datenspeicher',
    icon: '💾',
    description: 'Ein verschlüsselter Mainframe-Einschub.',
    rules: 'Erfordert Netrunning zum Auslesen. Bietet wertvolle Missions-Geheimdaten.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Cyberdeck-Port',
    icon: '📠',
    description: 'Eine physische Netrun-Schnittstelle an der Wand.',
    rules: 'Ermöglicht Cyberpunk-Netrunnern das direkte Eindringen in das lokale Subnetz.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Sicherungskasten',
    icon: '🎛️',
    description: 'Verteilerkasten für die lokale Stromversorgung.',
    rules: 'Aktion: Schaltet die Lichter aus (Nachtsichtvorteil) oder überlastet Steckdosen.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Yaiba Neon-Bike',
    icon: '🏍️',
    description: 'Ein windschnittiges Motorrad mit leuchtenden Felgen.',
    rules: 'Ermöglicht extrem schnelle Flucht oder schnelles Überbrücken von Distanzen.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Delamain Cyber-Taxi',
    icon: '🚗',
    description: 'Ein gepanzertes autonomes Fahrzeug.',
    rules: 'Bietet fahrbare schwere Deckung. KI kann gerufen werden, um Gegner zu rammen.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Nudel-Stand',
    icon: '🍜',
    description: 'Ein dampfender Ramen-Stand am Straßenrand.',
    rules: 'Spendet Wärme, verdeckt Gerüche. Essen regeneriert Ausdauer.'
  },
  {
    setting: 'Cyberpunk',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Geldautomat',
    icon: '🏧',
    description: 'Ein gepanzerter Geldautomat an einer Betonwand.',
    rules: 'Kann gehackt oder gesprengt werden, um 500 Credits freizusetzen (löst Alarm aus).'
  },

  // STEAMPUNK
  {
    setting: 'Steampunk',
    category: 'Deckung / Hindernis',
    name: 'Zahnrad-Stapel',
    icon: '⚙️',
    description: 'Haufenweise schwere Messing- und Eisenzahnräder.',
    rules: 'Schwere Deckung. Mechanisch rotierende Teile können Kleidung erfassen!'
  },
  {
    setting: 'Steampunk',
    category: 'Deckung / Hindernis',
    name: 'Holzkisten-Barrikade',
    icon: '📦',
    description: 'Stapelbarrikade aus Frachtkisten.',
    rules: 'Solide halbe Deckung. Kann durch schweren Beschuss zerstört werden.'
  },
  {
    setting: 'Steampunk',
    category: 'Durchgänge / Barrieren',
    name: 'Dampfgatter',
    icon: '⛓️',
    description: 'Ein eisernes Fallgitter, betrieben mit pneumatischen Kolben.',
    rules: 'Massive Barriere. Erfordert Hebelbetätigung oder Dampfdruckablass.'
  },
  {
    setting: 'Steampunk',
    category: 'Durchgänge / Barrieren',
    name: 'Dampfventil-Sperre',
    icon: '💨',
    description: 'Ein defektes Ventil bläst heißen, dichten Dampf aus.',
    rules: 'Verbrüht Passanten (1d6 Feuerschaden) und blockiert Sichtlinie vollständig.'
  },
  {
    setting: 'Steampunk',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Dampfkessel',
    icon: '♨️',
    description: 'Ein runder Kupferkessel unter enormem Überdruck.',
    rules: 'Explodiert bei Beschädigung (3d6 physischer & Feuerschaden im Umkreis).'
  },
  {
    setting: 'Steampunk',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Äther-Entlader',
    icon: '🔌',
    description: 'Ein glühender Äther-Kondensator.',
    rules: 'Blitzt unregelmäßig. Verursacht 1d12 Ätherschaden bei unvorsichtiger Annäherung.'
  },
  {
    setting: 'Steampunk',
    category: 'Behälter / Schätze',
    name: 'Leder-Koffer',
    icon: '💼',
    description: 'Feiner viktorianischer Koffer aus Rindsleder.',
    rules: 'Enthält Chronometer, Äthertränke, Konstruktionspläne oder Münzen.'
  },
  {
    setting: 'Steampunk',
    category: 'Behälter / Schätze',
    name: 'Mechanischer Safe',
    icon: '🪙',
    description: 'Messingtresor mit komplexem Uhrwerk-Schloss.',
    rules: 'Erfordert Dietrich oder feines Gehör (Schlossknacken SG 18). Enthält Vermögen.'
  },
  {
    setting: 'Steampunk',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Dampf-Steuerrad',
    icon: '🎡',
    description: 'Ein schweres gusseisernes Handrad.',
    rules: 'Aktion: Reguliert den Dampffluss, öffnet Brücken oder deaktiviert Kessel.'
  },
  {
    setting: 'Steampunk',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Messing-Hebelzug',
    icon: '🎚️',
    description: 'Ein polierter Zughebel mit Skalenanzeige.',
    rules: 'Schaltet mechanische Zahnradgatter oder pneumatische Aufzüge.'
  },
  {
    setting: 'Steampunk',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Dampf-Draisine',
    icon: '🚲',
    description: 'Ein Schienenfahrzeug mit Handhebel und Minikessel.',
    rules: 'Erlaubt schnelle Bewegung entlang von Schienensträngen.'
  },
  {
    setting: 'Steampunk',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Dampfwagen',
    icon: '🚂',
    description: 'Ein dreirädriges mechanisches Vehikel.',
    rules: 'Kann als fahrbare Barrikade genutzt oder gezielt gegen Feinde gelenkt werden.'
  },
  {
    setting: 'Steampunk',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Messing-Standuhr',
    icon: '🕰️',
    description: 'Tickende Uhr mit freiliegendem Pendelwerk.',
    rules: 'Gibt ein rhythmisches Ticken von sich. Kann manipuliert werden, um abzulenken.'
  },
  {
    setting: 'Steampunk',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Alchemie-Apparat',
    icon: '🧪',
    description: 'Glaskolben, Kupferrohre und brennende Spirituslampen.',
    rules: 'Kann beschossen werden, um eine blendende Säurewolke freizusetzen.'
  },

  // POST-APOKALYPTISCH
  {
    setting: 'Post-Apokalyptisch',
    category: 'Deckung / Hindernis',
    name: 'Schutthaufen',
    icon: '🧱',
    description: 'Trümmer einer eingestürzten Wand aus Beton und Ziegeln.',
    rules: 'Bietet hervorragende Deckung. Schwieriges Gelände beim Durchqueren.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Deckung / Hindernis',
    name: 'Autowrack',
    icon: '🚗',
    description: 'Skelett eines verrosteten Familienwagens.',
    rules: 'Schwere Deckung. Schützt vollständig vor direktem Gewehrfeuer.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Durchgänge / Barrieren',
    name: 'Stacheldraht',
    icon: '🕸️',
    description: 'Rostiger, scharfer NATO-Draht.',
    rules: 'Bewegung wird geviertelt. Verursacht 1d4 Blutungsschaden pro Bewegungsfeld.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Durchgänge / Barrieren',
    name: 'Paletten-Barrikade',
    icon: '🪵',
    description: 'Provisorische Barrikade aus Holzpaletten und Blech.',
    rules: 'Halbe Deckung. Kann durch Beschuss leicht zerstört werden.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Radioaktiver Müll',
    icon: '☢️',
    description: 'Auslaufende Fässer mit neongrünem Atomschlamm.',
    rules: 'Verursacht Strahlungsschaden (1d8) pro Runde. Kann Vergiftung verursachen.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Bärenfalle',
    icon: '🐻',
    description: 'Rostiges Fangeisen mit starken Sprungfedern im Boden.',
    rules: 'Macht Opfer bewegungsunfähig (Festhalten) und verursacht 1d10 physischen Schaden.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Behälter / Schätze',
    name: 'Munitionskiste',
    icon: '📦',
    description: 'Militärkiste der alten Welt.',
    rules: 'Enthält kostbare Munition, funktionierende Sturmgewehre oder Granaten.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Behälter / Schätze',
    name: 'Überlebensrucksack',
    icon: '🎒',
    description: 'Ein alter Militärrucksack mit Flicken.',
    rules: 'Enthält medizinisches Verbandszeug, sauberes Wasser und Konserven.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Behelfs-Generator',
    icon: '🎛️',
    description: 'Ein knatternder, lauter Dieselgenerator.',
    rules: 'Aktion: Liefert Strom für Tore, macht jedoch extremen Lärm (lockt Monster an).'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Altes Funkgerät',
    icon: '📻',
    description: 'Röhrenfunkgerät im Militärgehäuse.',
    rules: 'Aktion: Ermöglicht das Absetzen eines Notsignals oder das Belauschen von Banditen.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Wüsten-Buggy',
    icon: '🚜',
    description: 'Zusammengeschweißtes Ödland-Fahrzeug mit Überrollkäfig.',
    rules: 'Schnelle Bewegung. Kann Feinde rammen (3d8 physischer Schaden).'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Rostiges Fahrrad',
    icon: '🚲',
    description: 'Klappriges Zweirad ohne Gangschaltung.',
    rules: 'Erhöht Bewegungsweite lautlos um +2 Felder.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Rostiges Ölfass',
    icon: '🛢️',
    description: 'Metallfass, gefüllt mit brennbarem Teer.',
    rules: 'Kann entzündet werden. Spendet Wärme im Ödland oder brennt Feinde nieder.'
  },
  {
    setting: 'Post-Apokalyptisch',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Behelfszelt',
    icon: '🏚️',
    description: 'Aus Planen und Stöcken gebauter Unterstand.',
    rules: 'Sichtschutz vor saurem Regen. Bietet minimale Deckung.'
  },

  // HORROR
  {
    setting: 'Horror',
    category: 'Deckung / Hindernis',
    name: 'Gothic Grabstein',
    icon: '🪦',
    description: 'Ein verwitterter Kreuzgrabstein mit Moos.',
    rules: 'Bietet solide Deckung. Schützt gläubige Charaktere vor Geisterangriffen.'
  },
  {
    setting: 'Horror',
    category: 'Deckung / Hindernis',
    name: 'Vernagelter Sarg',
    icon: '🪵',
    description: 'Ein schwerer Eichensarg, fest verschlossen.',
    rules: 'Bietet Deckung. Bei Zerstörung bricht ein gieriger Ghul oder Zombie hervor!'
  },
  {
    setting: 'Horror',
    category: 'Durchgänge / Barrieren',
    name: 'Friedhofstor',
    icon: '⛓️',
    description: 'Schwarzes, knarzendes Gusseisentor.',
    rules: 'Blockiert Durchgang. Schlossknacken oder physische Gewalt nötig.'
  },
  {
    setting: 'Horror',
    category: 'Durchgänge / Barrieren',
    name: 'Dornenranken',
    icon: '🥀',
    description: 'Tote, scharfkantige Dornenrosen.',
    rules: 'Verlangsamen Bewegung. Verursachen Stichschaden und Fesseln bei Fehlwurf.'
  },
  {
    setting: 'Horror',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Blutbrunnen',
    icon: '🩸',
    description: 'Ein steinerner Brunnen, aus dem frisches Blut quillt.',
    rules: 'Anblick senkt geistige Gesundheit (Sanity). Trinken verursacht Vergiftung.'
  },
  {
    setting: 'Horror',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Alptraum-Spiegel',
    icon: '🕸️',
    description: 'Ein antiker, rissiger Spiegel im Silberrahmen.',
    rules: 'Spiegelt die tiefsten Ängste. Betrachten senkt Willenskraft dauerhaft.'
  },
  {
    setting: 'Horror',
    category: 'Behälter / Schätze',
    name: 'Prunksarg',
    icon: '⚰️',
    description: 'Edler Samtsarg eines Adligen.',
    rules: 'Enthält finstere Reliquien, Silberschmuck oder einen schlafenden Vampir.'
  },
  {
    setting: 'Horror',
    category: 'Behälter / Schätze',
    name: 'Staubige Truhe',
    icon: '📦',
    description: 'Truhe, mit Spinnweben bedeckt.',
    rules: 'Enthält verbotene Folianten, Weihwasser, Kreuze oder Silberschwerter.'
  },
  {
    setting: 'Horror',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Kerzenleuchter-Zug',
    icon: '🕯️',
    description: 'Ein Kerzenhalter an der Wand, der verdächtig schief hängt.',
    rules: 'Aktion: Zieht man daran, schwenkt das Bücherregal zur Seite (Geheimgang).'
  },
  {
    setting: 'Horror',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Wasserspeier-Statue',
    icon: '🗿',
    description: 'Ein hämisch grinsender Gargoyle aus Stein.',
    rules: 'Aktion: Verlangt ein Blutopfer, um magische Schranken aufzuheben.'
  },
  {
    setting: 'Horror',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Schwarze Kutsche',
    icon: '🛞',
    description: 'Kutsche ohne Kutscher, bespannt mit geisterhaften Pferden.',
    rules: 'Erlaubt die sofortige Flucht vor Bossgegnern oder schnelles Reisen.'
  },
  {
    setting: 'Horror',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Nebel-Boot',
    icon: '🛶',
    description: 'Ein morscher Kahn auf einem schwarzen, nebligen See.',
    rules: 'Fährt vollkommen lautlos. Schützt vor Entdeckung durch aquatische Ungeheuer.'
  },
  {
    setting: 'Horror',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Skelett',
    icon: '💀',
    description: 'Echtes menschliches Skelett in Ketten.',
    rules: 'Kann durchsucht werden (Gegenstandschance). Erhöht das Gruseln.'
  },
  {
    setting: 'Horror',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Kult-Altar',
    icon: '🕯️',
    description: 'Ein schwarzer Altar mit Pentagramm und Blutspritzern.',
    rules: 'Spendet unheilige Energie. Erhöht die Stärke dunkler Magie in der Nähe.'
  },

  // MODERN
  {
    setting: 'Modern',
    category: 'Deckung / Hindernis',
    name: 'Betonpfeiler',
    icon: '🧱',
    description: 'Tragender Pfeiler aus massivem Stahlbeton.',
    rules: 'Unzerstörbare schwere Deckung gegen jegliches Gewehrfeuer.'
  },
  {
    setting: 'Modern',
    category: 'Deckung / Hindernis',
    name: 'Pappkartons',
    icon: '📦',
    description: 'Haufenweise leere Versandkartons.',
    rules: 'Sichtschutz, bietet aber keinerlei physische Deckung.'
  },
  {
    setting: 'Modern',
    category: 'Durchgänge / Barrieren',
    name: 'Sicherheitstür',
    icon: '🚪',
    description: 'Stahltür mit elektronischem Nummernschloss.',
    rules: 'Blockiert Weg. Erfordert Schlüsselkarte, Pin-Code oder Sprengung.'
  },
  {
    setting: 'Modern',
    category: 'Durchgänge / Barrieren',
    name: 'Baustellenabsperrung',
    icon: '🚧',
    description: 'Reflektierendes Kunststoffgitter.',
    rules: 'Leichtes Hindernis. Kann leicht beiseite geschoben werden.'
  },
  {
    setting: 'Modern',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Gasaustritt',
    icon: '💥',
    description: 'Zischendes Gasrohr in einem Kellerraum.',
    rules: 'Hochexplosiv bei Funkenbildung (Feuerwaffen/Feuerzauber lösen Explosion aus).'
  },
  {
    setting: 'Modern',
    category: 'Gefahrenquellen / Umweltfallen',
    name: 'Nasse Fliesen',
    icon: '💦',
    description: 'Frisch gewischter Marmorboden ohne Warnschild.',
    rules: 'Rutschgefahr. Schnelle Bewegung führt zu Sturz und Aussetzen einer Runde.'
  },
  {
    setting: 'Modern',
    category: 'Behälter / Schätze',
    name: 'Wandtresor',
    icon: '🧳',
    description: 'Unterputz-Safe hinter einem Gemälde.',
    rules: 'Verschlossen. Enthält Bargeld, Diamanten, Geheimdokumente oder Pistolen.'
  },
  {
    setting: 'Modern',
    category: 'Behälter / Schätze',
    name: 'Paketbox',
    icon: '📦',
    description: 'Gelivered Paket eines Onlinehändlers.',
    rules: 'Interaktion: Enthält Elektronikgeräte, Nahrungsmittel oder nützliche Gadgets.'
  },
  {
    setting: 'Modern',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Feuermelder',
    icon: '🚨',
    description: 'Roter Handfeuermelder an der Wand.',
    rules: 'Aktion: Aktiviert Sprinkleranlage (löscht Brände, blendet feindliche Sensoren).'
  },
  {
    setting: 'Modern',
    category: 'Konsolen / Schalter / Hebel',
    name: 'Gegensprechanlage',
    icon: '📟',
    description: 'Anlage an der Eingangstür.',
    rules: 'Aktion: Erlaubt Verhandlungen mit den Bewohnern oder Ablenkung von Wachen.'
  },
  {
    setting: 'Modern',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Limousine',
    icon: '🚗',
    description: 'Eine schwarze, gepanzerte Luxuslimousine.',
    rules: 'Fluchtfahrzeug. Kann gestartet werden, um rasant vom Kampfplatz zu entkommen.'
  },
  {
    setting: 'Modern',
    category: 'Transportmittel / Fahrzeuge',
    name: 'Lieferwagen',
    icon: '🚚',
    description: 'Weißer Lieferwagen mit Schiebetür.',
    rules: 'Fahrbare Barrikade. Türen können geöffnet werden, um zusätzlichen Schutz zu bieten.'
  },
  {
    setting: 'Modern',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Büroschreibtisch',
    icon: '🖥️',
    description: 'Holztisch mit Monitor, Tastatur und Kaffeetasse.',
    rules: 'Kann umgeworfen werden für Deckung. PC kann nützliche Infos enthalten.'
  },
  {
    setting: 'Modern',
    category: 'Reines Alltagsobjekt / Statisch',
    name: 'Getränkeautomat',
    icon: '🥤',
    description: 'Großer Automat mit Softdrinks und Snacks.',
    rules: 'Aktion: Gegenbestoßen liefert erfrischende Cola (heilt 1d4 Ausdauer).'
  }
];

// Visual tile themes (Biome & Textures Library)
const BIOMES = {
  forest: {
    bg: 'from-emerald-950 to-teal-900',
    tileColor: 'bg-emerald-900/50 border-emerald-800/40',
    icon: 'fa-solid fa-tree text-emerald-500/30 text-lg',
    label: 'Finsterwald',
    gridBg: 'bg-[radial-gradient(#10b981_0.8px,transparent_0.8px)] [background-size:12px_12px] opacity-15',
    ambientColor: 'bg-emerald-500/5'
  },
  sea: {
    bg: 'from-blue-950 to-indigo-900',
    tileColor: 'bg-blue-950/60 border-blue-800/40',
    icon: 'fa-solid fa-water text-blue-400/30 text-lg',
    label: 'Offenes Meer',
    gridBg: 'bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25',
    ambientColor: 'bg-cyan-500/5'
  },
  tunnel: {
    bg: 'from-slate-950 to-stone-900',
    tileColor: 'bg-stone-900/60 border-stone-800/40',
    icon: 'fa-solid fa-mountain text-stone-500/30 text-lg',
    label: 'Dunkler Tunnel / Kerker',
    gridBg: 'bg-[radial-gradient(#78716c_0.8px,transparent_0.8px)] [background-size:16px_16px] opacity-20',
    ambientColor: 'bg-amber-900/5'
  },
  building: {
    bg: 'from-amber-950/80 to-amber-900/40',
    tileColor: 'bg-amber-900/20 border-amber-800/30',
    icon: 'fa-solid fa-house-chimney text-amber-600/20 text-lg',
    label: 'Gebäude / Taverne',
    gridBg: 'bg-[linear-gradient(to_right,#3b2314_1px,transparent_1px),linear-gradient(to_bottom,#3b2314_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-20',
    ambientColor: 'bg-amber-500/5'
  },
  volcano: {
    bg: 'from-stone-950 via-red-950 to-stone-950',
    tileColor: 'bg-stone-900/80 border-orange-900/40',
    icon: 'fa-solid fa-fire text-orange-600/20 text-lg',
    label: 'Vulkanisches Gebiet',
    gridBg: 'bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:14px_14px] opacity-15',
    ambientColor: 'bg-red-500/5'
  },
  ice: {
    bg: 'from-sky-950 via-slate-900 to-sky-950',
    tileColor: 'bg-sky-950/40 border-sky-800/30',
    icon: 'fa-solid fa-snowflake text-sky-400/20 text-lg',
    label: 'Eisgletscher',
    gridBg: 'bg-[radial-gradient(#38bdf8_0.8px,transparent_0.8px)] [background-size:16px_16px] opacity-15',
    ambientColor: 'bg-sky-500/5'
  },
  desert: {
    bg: 'from-amber-950 via-stone-900 to-amber-950',
    tileColor: 'bg-amber-950/30 border-amber-900/30',
    icon: 'fa-solid fa-sun text-yellow-600/20 text-lg',
    label: 'Endlose Wüste',
    gridBg: 'bg-[radial-gradient(#eab308_0.8px,transparent_0.8px)] [background-size:12px_12px] opacity-10',
    ambientColor: 'bg-yellow-500/5'
  },
  grass: {
    bg: 'from-slate-950 to-emerald-950/40',
    tileColor: 'bg-emerald-950/20 border-emerald-900/20',
    icon: 'fa-solid fa-seedling text-emerald-600/20 text-lg',
    label: 'Grassteppe',
    gridBg: 'bg-[radial-gradient(#059669_0.5px,transparent_0.5px)] [background-size:10px_10px] opacity-15',
    ambientColor: 'bg-emerald-500/3'
  }
};

export const renderTokenIconElement = (icon: string, label: string) => {
  const normLabel = (label || '').toLowerCase();
  
  if (normLabel.includes('holzbarrikade')) {
    return (
      <svg className="w-full h-full p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <line x1="4" y1="20" x2="20" y2="4" stroke="#ea580c" />
        <line x1="4" y1="4" x2="20" y2="20" stroke="#ea580c" />
        <rect x="2" y="9" width="20" height="6" rx="1" fill="#78350f" stroke="#b45309" strokeWidth="1.5" />
        <circle cx="5" cy="12" r="1" fill="#cbd5e1" />
        <circle cx="19" cy="12" r="1" fill="#cbd5e1" />
      </svg>
    );
  }
  
  if (normLabel.includes('palisadenmauer')) {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M4,20 L4,8 L6,5 L8,8 L8,20 Z" fill="#78350f" stroke="#b45309" />
        <path d="M9,20 L9,6 L11,3 L13,6 L13,20 Z" fill="#854d0e" stroke="#ca8a04" />
        <path d="M14,20 L14,7 L16,4 L18,7 L18,20 Z" fill="#78350f" stroke="#b45309" />
        <line x1="3" y1="13" x2="19" y2="13" stroke="#451a03" strokeWidth="2" />
      </svg>
    );
  }
  
  if (normLabel.includes('palisadentor')) {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <rect x="2" y="2" width="4" height="20" fill="#451a03" stroke="#78350f" />
        <rect x="18" y="2" width="4" height="20" fill="#451a03" stroke="#78350f" />
        <rect x="6" y="4" width="12" height="16" fill="#78350f" stroke="#ca8a04" />
        <line x1="6" y1="4" x2="18" y2="20" stroke="#ca8a04" strokeWidth="2" />
        <line x1="2" y1="7" x2="10" y2="7" stroke="#475569" strokeWidth="2" />
        <line x1="2" y1="16" x2="10" y2="16" stroke="#475569" strokeWidth="2" />
        <circle cx="15" cy="12" r="2" stroke="#ca8a04" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  
  if (normLabel.includes('steinmauer') || normLabel.includes('stadtmauer-segment')) {
    const isCity = normLabel.includes('stadtmauer');
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <rect x="2" y="3" width="20" height="18" rx="1.5" fill={isCity ? "#475569" : "#64748b"} stroke="#1e293b" />
        <line x1="2" y1="9" x2="22" y2="9" stroke="#1e293b" />
        <line x1="8" y1="3" x2="8" y2="9" stroke="#1e293b" />
        <line x1="16" y1="3" x2="16" y2="9" stroke="#1e293b" />
        <line x1="2" y1="15" x2="22" y2="15" stroke="#1e293b" />
        <line x1="12" y1="9" x2="12" y2="15" stroke="#1e293b" />
        <line x1="6" y1="15" x2="6" y2="21" stroke="#1e293b" />
        <line x1="18" y1="15" x2="18" y2="21" stroke="#1e293b" />
      </svg>
    );
  }
  
  if (normLabel.includes('festungsmauer') || normLabel.includes('zinnen')) {
    const isFortress = normLabel.includes('festungsmauer');
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M2,21 L2,8 L6,8 L6,4 L11,4 L11,8 L13,8 L13,4 L18,4 L18,8 L22,8 L22,21 Z" fill={isFortress ? "#334155" : "#475569"} stroke="#0f172a" />
        <line x1="2" y1="12" x2="22" y2="12" stroke="#0f172a" />
        <line x1="2" y1="16" x2="22" y2="16" stroke="#0f172a" />
        <line x1="7" y1="8" x2="7" y2="12" stroke="#0f172a" />
        <line x1="17" y1="8" x2="17" y2="12" stroke="#0f172a" />
        <line x1="12" y1="12" x2="12" y2="16" stroke="#0f172a" />
        <line x1="6" y1="16" x2="6" y2="21" stroke="#0f172a" />
        <line x1="18" y1="16" x2="18" y2="21" stroke="#0f172a" />
        <rect x="8" y="13" width="1.5" height="5" rx="0.5" fill="#0f172a" stroke="none" />
        <rect x="14" y="13" width="1.5" height="5" rx="0.5" fill="#0f172a" stroke="none" />
      </svg>
    );
  }
  
  if (normLabel.includes('gittertor')) {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M2,22 L2,7 C2,4 6,2 12,2 C18,2 22,4 22,7 L22,22" fill="none" stroke="#475569" strokeWidth="3" />
        <line x1="6" y1="3" x2="6" y2="22" stroke="#1e293b" strokeWidth="2" />
        <line x1="10" y1="3" x2="10" y2="22" stroke="#1e293b" strokeWidth="2" />
        <line x1="14" y1="3" x2="14" y2="22" stroke="#1e293b" strokeWidth="2" />
        <line x1="18" y1="3" x2="18" y2="22" stroke="#1e293b" strokeWidth="2" />
        <line x1="2" y1="8" x2="22" y2="8" stroke="#1e293b" strokeWidth="1.5" />
        <line x1="2" y1="14" x2="22" y2="14" stroke="#1e293b" strokeWidth="1.5" />
        <line x1="2" y1="19" x2="22" y2="19" stroke="#1e293b" strokeWidth="1.5" />
      </svg>
    );
  }
  
  if (normLabel.includes('wehrgang')) {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <line x1="5" y1="21" x2="5" y2="10" stroke="#78350f" strokeWidth="2.5" />
        <line x1="19" y1="21" x2="19" y2="10" stroke="#78350f" strokeWidth="2.5" />
        <line x1="12" y1="21" x2="12" y2="10" stroke="#78350f" strokeWidth="2" />
        <line x1="5" y1="15" x2="12" y2="10" stroke="#78350f" strokeWidth="1.5" />
        <line x1="19" y1="15" x2="12" y2="10" stroke="#78350f" strokeWidth="1.5" />
        <rect x="2" y="9" width="20" height="3" fill="#854d0e" stroke="#b45309" strokeWidth="1" />
        <line x1="4" y1="9" x2="4" y2="3" stroke="#b45309" strokeWidth="1.5" />
        <line x1="12" y1="9" x2="12" y2="3" stroke="#b45309" strokeWidth="1.5" />
        <line x1="20" y1="9" x2="20" y2="3" stroke="#b45309" strokeWidth="1.5" />
        <line x1="3" y1="3" x2="21" y2="3" stroke="#b45309" strokeWidth="1.5" />
      </svg>
    );
  }
  
  if (normLabel.includes('schutzgraben')) {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <rect x="1" y="1" width="22" height="22" rx="2" fill="#1c1917" stroke="#44403c" strokeWidth="1.5" />
        <path d="M4,4 L7,18 L17,18 L20,4 Z" fill="#0c0a09" stroke="#78716c" strokeWidth="1.5" />
        <polygon points="7,18 9,11 11,18" fill="#d97706" stroke="#b45309" />
        <polygon points="10,18 12,10 14,18" fill="#d97706" stroke="#b45309" />
        <polygon points="13,18 15,11 17,18" fill="#d97706" stroke="#b45309" />
      </svg>
    );
  }

  // Lucide Icon Name Mapping
  const iconLower = (icon || '').toLowerCase();
  if (iconLower === 'shield') {
    return (
      <svg className="w-full h-full p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#1e293b" />
      </svg>
    );
  }
  if (iconLower === 'swords') {
    return (
      <svg className="w-full h-full p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" fill="#1e293b" />
        <line x1="13" y1="19" x2="19" y2="13" />
        <line x1="16" y1="16" x2="20" y2="20" />
        <line x1="19" y1="21" x2="21" y2="19" />
        <polyline points="9.5 17.5 21 6 21 3 18 3 6.5 14.5" fill="#1e293b" />
        <line x1="11" y1="19" x2="5" y2="13" />
        <line x1="8" y1="16" x2="4" y2="20" />
        <line x1="5" y1="21" x2="3" y2="19" />
      </svg>
    );
  }
  if (iconLower === 'sword') {
    return (
      <svg className="w-full h-full p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" fill="#1e293b" />
        <line x1="13" y1="19" x2="19" y2="13" />
        <line x1="16" y1="16" x2="20" y2="20" />
        <line x1="19" y1="21" x2="21" y2="19" />
      </svg>
    );
  }
  if (iconLower === 'target') {
    return (
      <svg className="w-full h-full p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }

  // 🌲 WALDBAUM / TREE
  if (normLabel.includes('waldbaum') || normLabel.includes('baum') || icon === '🌲' || icon === '🌳' || iconLower === 'tree') {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M12,2 L19,9 L15,9 L20,14 L14,14 L21,19 L3,19 L10,14 L4,14 L9,9 L5,9 Z" fill="#166534" stroke="#14532d" />
        <rect x="11" y="19" width="2" height="4" fill="#78350f" />
      </svg>
    );
  }

  // 🪨 FELSBROCKEN / ROCK
  if (normLabel.includes('felsbrocken') || normLabel.includes('stein') || icon === '🪨') {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M12,3 L19,7 L21,14 L17,20 L7,20 L3,14 L5,7 Z" fill="#475569" stroke="#1e293b" />
        <path d="M12,3 L14,10 L17,20" stroke="#334155" strokeWidth="1" />
        <path d="M5,7 L12,11 L17,20" stroke="#334155" strokeWidth="1" />
        <path d="M3,14 L12,11" stroke="#334155" strokeWidth="1" />
      </svg>
    );
  }

  // 🌵 KAKTUS / CACTUS
  if (normLabel.includes('kaktus') || icon === '🌵') {
    return (
      <svg className="w-full h-full p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <rect x="11" y="3" width="2" height="18" rx="1" fill="#15803d" stroke="#14532d" />
        <path d="M7,10 L11,10 M7,6 L7,10" stroke="#14532d" strokeWidth="1.8" fill="none" />
        <path d="M13,12 L17,12 M17,8 L17,12" stroke="#14532d" strokeWidth="1.8" fill="none" />
      </svg>
    );
  }

  // 🌋 LAVARISS / MAGMA
  if (normLabel.includes('lavariss') || icon === '🌋') {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M2,20 L6,5 L11,13 L15,3 L22,20 Z" fill="#3b200a" stroke="#1c1917" />
        <polygon points="11,13 15,3 17,13" fill="#ea580c" stroke="#f97316" />
        <circle cx="13" cy="9" r="1.5" fill="#facc15" />
      </svg>
    );
  }

  // 🪦 GRABSTEIN / TOMBSTONE
  if (normLabel.includes('grabstein') || icon === '🪦') {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M5,20 C5,10 9,5 12,5 C15,5 19,10 19,20 Z" fill="#64748b" stroke="#334155" />
        <line x1="12" y1="9" x2="12" y2="15" stroke="#334155" strokeWidth="1.5" />
        <line x1="10" y1="11" x2="14" y2="11" stroke="#334155" strokeWidth="1.5" />
        <line x1="4" y1="20" x2="20" y2="20" stroke="#334155" strokeWidth="2" />
      </svg>
    );
  }

  // 💀 SKELETT / SKULL / BONES
  if (normLabel.includes('skelett') || icon === '💀') {
    return (
      <svg className="w-full h-full p-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M12,3 C8,3 6,6 6,10 C6,14 8,17 12,17 C16,17 18,14 18,10 C18,6 16,3 12,3 Z" fill="#f8fafc" stroke="#94a3b8" />
        <circle cx="9.5" cy="9.5" r="1.5" fill="#334155" stroke="none" />
        <circle cx="14.5" cy="9.5" r="1.5" fill="#334155" stroke="none" />
        <line x1="11" y1="14" x2="11" y2="17" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="13" y1="14" x2="13" y2="17" stroke="#94a3b8" strokeWidth="1.5" />
      </svg>
    );
  }

  // 🏚️ RUINE
  if (normLabel.includes('ruine') || icon === '🏚️') {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <path d="M3,20 L3,11 L12,4 L18,9 L18,11" fill="none" stroke="#475569" strokeWidth="1.5" />
        <rect x="5" y="13" width="4" height="7" fill="#1e293b" stroke="#475569" />
        <path d="M12,20 L19,13 L21,20 Z" fill="#334155" stroke="#1e293b" />
        <line x1="2" y1="20" x2="22" y2="20" stroke="#1e293b" strokeWidth="2" />
      </svg>
    );
  }

  // ⚓ ANKER / ANCHOR
  if (normLabel.includes('anker') || icon === '⚓') {
    return (
      <svg className="w-full h-full p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', width: '1.25em', height: '1.25em' }}>
        <circle cx="12" cy="5" r="2" fill="none" stroke="#475569" strokeWidth="2" />
        <line x1="12" y1="7" x2="12" y2="18" stroke="#475569" strokeWidth="2.5" />
        <line x1="8" y1="11" x2="16" y2="11" stroke="#475569" strokeWidth="2" />
        <path d="M6,14 C6,19 18,19 18,14" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M5,13 L7,14" stroke="#475569" strokeWidth="2.5" />
        <path d="M19,13 L17,14" stroke="#475569" strokeWidth="2.5" />
      </svg>
    );
  }

  return <span className="select-none leading-none">{icon}</span>;
};

export const getCustomTerrainStyle = (type: string) => {
  const normalized = (type || '').toLowerCase().trim();
  switch (normalized) {
    // Fantasy & Natur / Ozeane & Weltkarten
    case 'ozean':
    case 'meer':
    case 'wasser':
    case 'tiefwasser':
    case 'ocean':
    case 'sea':
    case 'water':
      return { color: '#1d4ed8', border: '#3b82f6', icon: '🌊', label: 'Ozean / Meer' };
    case 'insel':
    case 'island':
    case 'eiland':
      return { color: '#16a34a', border: '#4ade80', icon: '🏝️', label: 'Insel / Landmasse' };
    case 'landfläche':
    case 'festland':
    case 'kontinent':
    case 'mainland':
      return { color: '#b45309', border: '#f59e0b', icon: '🗺️', label: 'Landfläche / Festland' };
    case 'hafen':
    case 'port':
    case 'harbor':
    case 'pier':
      return { color: '#854d0e', border: '#facc15', icon: '⚓', label: 'Hafen / Pier' };
    case 'roteline':
    case 'felsen':
    case 'fels':
    case 'klippe':
      return { color: '#991b1b', border: '#dc2626', icon: '🧱', label: 'Rote Felswand / Red Line' };
    case 'grandline':
    case 'sturmzone':
    case 'magiezone':
      return { color: '#6b21a8', border: '#a855f7', icon: '⚡', label: 'Sturmzone / Strömung' };
    case 'gras':
    case 'wiese':
      return { color: '#22c55e', border: '#86efac', icon: '🌿', label: 'Gras / Wiese' };
    case 'weg':
    case 'pfad':
    case 'strasse':
      return { color: '#eab308', border: '#fef08a', icon: '🛣️', label: 'Weg / Pfad' };
    case 'wald':
    case 'dschungel':
    case 'baeume':
      return { color: '#166534', border: '#15803d', icon: '🌲', label: 'Wald / Dschungel' };
    case 'haus':
    case 'mauer':
    case 'gebaeude':
      return { color: '#b91c1c', border: '#ef4444', icon: '🏠', label: 'Haus / Mauer' };
    case 'berg':
    case 'gebirge':
      return { color: '#374151', border: '#6b7280', icon: '🏔️', label: 'Berg / Fels' };
    case 'fluss':
    case 'bach':
      return { color: '#0284c7', border: '#38bdf8', icon: '🌊', label: 'Fluss / Wasser' };
    case 'sumpf':
    case 'morast':
      return { color: '#365314', border: '#4d7c0f', icon: '🐸', label: 'Sumpf / Morast' };
    case 'wueste':
    case 'sand':
      return { color: '#ca8a04', border: '#fde047', icon: '🏜️', label: 'Wüste / Sand' };
    case 'schnee':
    case 'eis':
    case 'ice':
    case 'frost':
      return { color: '#0284c7', border: '#38bdf8', icon: '❄️', label: 'Schnee / Eis' };
    case 'vulkan':
    case 'lava':
    case 'magma':
      return { color: '#7f1d1d', border: '#f97316', icon: '🌋', label: 'Magma / Lava' };
    case 'fire':
    case 'feuer':
    case 'brand':
    case 'flammen':
      return { color: '#991b1b', border: '#f97316', icon: '🔥', label: 'Feuer / Brand' };
    case 'steam':
    case 'dampf':
    case 'nebel':
      return { color: '#334155', border: '#94a3b8', icon: '💨', label: 'Dampf / Nebel' };
    case 'ash':
    case 'asche':
    case 'verbrannt':
    case 'scorched':
      return { color: '#18181b', border: '#52525b', icon: '⬛', label: 'Verbrannte Erde / Asche' };
    case 'obsidian':
    case 'erstarrt':
      return { color: '#09090b', border: '#581c87', icon: '🪨', label: 'Obsidian / Erstarrtes Magma' };
    case 'hoehle':
    case 'kerker':
      return { color: '#18181b', border: '#3f3f46', icon: '🕳️', label: 'Höhle / Kerker' };
    case 'strand':
    case 'kueste':
      return { color: '#eab308', border: '#fef08a', icon: '🏖️', label: 'Strand / Küste' };
    case 'bruecke':
    case 'steg':
      return { color: '#78350f', border: '#d97706', icon: '🌉', label: 'Brücke / Steg' };
    case 'ruine':
    case 'tempel':
      return { color: '#451a03', border: '#b45309', icon: '🏛️', label: 'Ruine / Tempel' };

    // Sci-Fi & Cyberpunk
    case 'metall':
      return { color: '#0f172a', border: '#0284c7', icon: '🏢', label: 'Metallboden / Deck' };
    case 'plasma':
      return { color: '#581c87', border: '#c084fc', icon: '🧪', label: 'Plasma-Pool' };
    case 'neonweg':
      return { color: '#030712', border: '#ec4899', icon: '🌆', label: 'Neon-Boulevard' };
    case 'server':
      return { color: '#0284c7', border: '#38bdf8', icon: '💻', label: 'Server-Terminal' };
    case 'laserwand':
      return { color: '#991b1b', border: '#f87171', icon: '🚨', label: 'Kraftfeld / Laser' };
    case 'weltraum':
      return { color: '#020617', border: '#1e293b', icon: '🌌', label: 'Weltraum / Abgrund' };
    case 'biolabor':
      return { color: '#064e3b', border: '#34d399', icon: '🧬', label: 'Bio-Silo / Kapsel' };

    // Modern & Endzeit
    case 'asphalt':
      return { color: '#1f2937', border: '#4b5563', icon: '🛣️', label: 'Asphaltstrasse' };
    case 'gehweg':
      return { color: '#374151', border: '#9ca3af', icon: '🧱', label: 'Gehweg / Beton' };
    case 'schutt':
      return { color: '#292524', border: '#78716c', icon: '🪨', label: 'Schutt / Trümmer' };
    case 'saeure':
      return { color: '#713f12', border: '#eab308', icon: '☢️', label: 'Säure-Toxisch' };
    case 'zaun':
      return { color: '#525252', border: '#a3a3a3', icon: '🚧', label: 'Barrikade / Zaun' };

    // Horror & Okkult
    case 'blut':
      return { color: '#450a0a', border: '#ef4444', icon: '🩸', label: 'Blutpool / Opferplatz' };
    case 'krypta':
      return { color: '#09090b', border: '#52525b', icon: '🪦', label: 'Krypta / Friedhof' };
    case 'knochen':
      return { color: '#27272a', border: '#f5f5f4', icon: '🦴', label: 'Knochenfeld' };
    case 'schatten':
      return { color: '#111827', border: '#6b21a8', icon: '👁️', label: 'Schattennebel' };

    default:
      return null;
  }
};

export const getSettingTileStyle = (terrainId: string, setting: string) => {
  switch (setting) {
    case 'Sci-Fi':
    case 'Cyberpunk':
      switch (terrainId) {
        case 'flüssigkeit': return { color: '#090d16', border: '#701a75', icon: '🧪', label: 'Plasma-Kühlmittel' };
        case 'natur_dicht': return { color: '#022c22', border: '#10b981', icon: '🔋', label: 'Bio-Silo' };
        case 'natur_offen': return { color: '#030712', border: '#1e293b', icon: '🟩', label: 'Digital-Gitter' };
        case 'struktur': return { color: '#0f172a', border: '#0284c7', icon: '💾', label: 'Metallplatten' };
        case 'fels': return { color: '#1e293b', border: '#475569', icon: '🎛️', label: 'Konsolen-Racks' };
        case 'landfläche': return { color: '#131924', border: '#475569', icon: '🌎', label: 'Kontinental-Sektor' };
        default: return { color: '#030712', border: '#111827', icon: '⚙️', label: 'Server-Boden' };
      }
    case 'Modern':
      switch (terrainId) {
        case 'flüssigkeit': return { color: '#1e3a8a', border: '#3b82f6', icon: '🕳️', label: 'Siel-Abfluss' };
        case 'natur_dicht': return { color: '#064e3b', border: '#10b981', icon: '🌳', label: 'Hecken' };
        case 'natur_offen': return { color: '#065f46', border: '#34d399', icon: '🌿', label: 'Rasenfläche' };
        case 'struktur': return { color: '#334155', border: '#64748b', icon: '🛣️', label: 'Asphalt' };
        case 'fels': return { color: '#44403c', border: '#78716c', icon: '🧱', label: 'Trümmer' };
        case 'landfläche': return { color: '#44403c', border: '#78716c', icon: '⛰️', label: 'Umland-Gelände' };
        default: return { color: '#1e293b', border: '#334155', icon: '👣', label: 'Gehweg' };
      }
    case 'Post-Apokalyptisch':
      switch (terrainId) {
        case 'flüssigkeit': return { color: '#451a03', border: '#f59e0b', icon: '☢️', label: 'Säure-Sumpf' };
        case 'natur_dicht': return { color: '#1c1917', border: '#44403c', icon: '🌵', label: 'Aschebüsche' };
        case 'natur_offen': return { color: '#292524', border: '#57534e', icon: '🌾', label: 'Verdörrte Steppe' };
        case 'struktur': return { color: '#27272a', border: '#52525b', icon: '🏚️', label: 'Wellblech-Ruine' };
        case 'fels': return { color: '#18181b', border: '#3f3f46', icon: '🪨', label: 'Schuttberge' };
        case 'landfläche': return { color: '#1c1917', border: '#3f3f46', icon: '🏜️', label: 'Trockenes Festland' };
        default: return { color: '#0c0a09', border: '#1c1917', icon: '💀', label: 'Ödland' };
      }
    case 'Horror':
      switch (terrainId) {
        case 'flüssigkeit': return { color: '#450a0a', border: '#991b1b', icon: '🩸', label: 'Blutweiher' };
        case 'natur_dicht': return { color: '#09090b', border: '#27272a', icon: '🪦', label: 'Friedhof-Hecke' };
        case 'natur_offen': return { color: '#171717', border: '#262626', icon: '🕸️', label: 'Verliesboden' };
        case 'struktur': return { color: '#2d1e18', border: '#451a03', icon: '🚪', label: 'Mansion-Holzboden' };
        case 'fels': return { color: '#1c1917', border: '#292524', icon: '🦴', label: 'Krypta-Stein' };
        case 'landfläche': return { color: '#18181b', border: '#262626', icon: '🪦', label: 'Düsteres Umland' };
        default: return { color: '#0a0a0a', border: '#171717', icon: '👁️', label: 'Schatten' };
      }
    default: // Fantasy / Pirates / Goblins / Default
      switch (terrainId) {
        case 'flüssigkeit': return { color: '#1d4ed8', border: '#2563eb', icon: '🌊', label: 'Meer / Wasser' };
        case 'natur_dicht': return { color: '#064e3b', border: '#059669', icon: '🌴', label: 'Urwald' };
        case 'natur_offen': return { color: '#15803d', border: '#22c55e', icon: '🍀', label: 'Inselgras' };
        case 'trockenheit': return { color: '#fef08a', border: '#eab308', icon: '🏖️', label: 'Strand' };
        case 'struktur': return { color: '#78350f', border: '#b45309', icon: '🪵', label: 'Schiffsplanken' };
        case 'fels': return { color: '#4b5563', border: '#9ca3af', icon: '🧱', label: 'Palisadenwand' };
        case 'landfläche': return { color: '#854d0e', border: '#a16207', icon: '🌍', label: 'Festland / Landfläche' };
        default: return { color: '#022c22', border: '#047857', icon: '🌲', label: 'Wiese' };
      }
  }
};

export const getCharacterSprite = (name: string, type: 'player' | 'companion' | 'enemy', setting: string) => {
  const nameLower = name.toLowerCase();
  
  if (type === 'player') {
    if (nameLower.includes('luffy') || nameLower.includes('strohhut')) return '👒';
    if (nameLower.includes('zoro') || nameLower.includes('schwert')) return '⚔️';
    if (nameLower.includes('nami') || nameLower.includes('klima')) return '🍊';
    return '⚡';
  }

  if (setting === 'Sci-Fi' || setting === 'Cyberpunk') {
    if (type === 'companion') return '🤖';
    return '🛸';
  }

  if (setting === 'Horror') {
    if (type === 'companion') return '🐕';
    return '🧛';
  }

  // Fantasy / Pirates / Default
  if (nameLower.includes('marine') || nameLower.includes('soldat')) return '⚓';
  if (nameLower.includes('pirat')) return '🏴‍☠️';
  if (nameLower.includes('goblin')) return '👺';
  if (nameLower.includes('ork') || nameLower.includes('orc')) return '👹';
  
  if (type === 'companion') return '🛡️';
  return '👹';
};

export const getCharacterStats = (name: string, type: 'player' | 'companion' | 'enemy') => {
  let seed = 0;
  for (let i = 0; i < name.length; i++) {
    seed += name.charCodeAt(i);
  }
  
  const baseHp = 30 + (seed % 25);
  const hp = baseHp;
  const maxHp = baseHp;
  const atk = 8 + (seed % 10);
  const def = 4 + (seed % 8);
  const spd = 6 + (seed % 12);
  const hit = 70 + (seed % 26);
  const crit = seed % 15;
  
  let charClass = 'Söldner';
  if (type === 'player') {
    charClass = seed % 3 === 0 ? 'Abenteurer' : seed % 3 === 1 ? 'Kampfmagier' : 'Krieger';
  } else if (type === 'companion') {
    charClass = seed % 2 === 0 ? 'Paladin' : 'Unterstützer';
  } else {
    charClass = seed % 3 === 0 ? 'Goblin-Krieger' : seed % 3 === 1 ? 'Banditen-Anführer' : 'Ungetüm';
  }

  const nameLower = name.toLowerCase();
  if (nameLower.includes('luffy')) {
    charClass = 'Strohhut-Kapitän';
  } else if (nameLower.includes('zoro')) {
    charClass = 'Schwertmeister';
  } else if (nameLower.includes('marine')) {
    charClass = 'Marine-Infanterist';
  }

  return { hp, maxHp, atk, def, spd, hit, crit, charClass };
};

export const TacticalCombatMap: React.FC<TacticalCombatMapProps> = ({
  adventure,
  onUpdateAdventure,
  messages,
  isCombatActive,
  opponents: rawOpponents
}) => {
  const loreDatabase: LoreNode[] = adventure.loreDatabase || [];
  const combatState: CombatState = adventure.combatState || {};
  const gridWidth = combatState.gridWidth || 30;
  const gridHeight = combatState.gridHeight || 20;
  const maxX = gridWidth - 1;
  const maxY = gridHeight - 1;

  const playerCurrentLocation = adventure.player?.appearance?.currentLocation || '';
  const playerName = adventure.player?.name || 'Spieler';

  const displayLocationName = formatDisplayLocationName(playerCurrentLocation);

  const parseCoordsFromLocation = (locStr: string) => {
    if (!locStr) return null;
    let match = locStr.match(/x\s*[:=]?\s*(\d+)\s*[,;/]?\s*y\s*[:=]?\s*(\d+)/i);
    if (!match) {
      match = locStr.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    }
    if (match) {
      const x = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      if (!isNaN(x) && !isNaN(y)) {
        return { x: Math.min(maxX, Math.max(0, x)), y: Math.min(maxY, Math.max(0, y)) };
      }
    }
    return null;
  };

  const isNpcAtPlayerLocation = (npc: any) => {
    const playerLoc = (adventure.player?.appearance?.currentLocation || '').trim().toLowerCase();
    const npcLocation = (npc.appearance?.currentLocation || npc.details?.currentLocation || npc.currentLocation || '').trim().toLowerCase();
    const cleanPlayerLoc = playerLoc.replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim();
    const cleanNpcLocation = npcLocation.replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim();
    return cleanNpcLocation === cleanPlayerLoc;
  };

  const opponents = useMemo(() => {
    return rawOpponents.filter(opp => {
      const npc = (adventure.npcs || []).find((n: any) => n.id === opp.id || n.name.toLowerCase().trim() === opp.name.toLowerCase().trim());
      if (npc) {
        return isNpcAtPlayerLocation(npc);
      }
      return true; // Dynamic spawned foes, keep them
    });
  }, [rawOpponents, adventure.npcs, playerCurrentLocation]);

  const cleanPlayerLocName = formatDisplayLocationName(playerCurrentLocation);

  const activeTerritory = useMemo(() => {
    const territories: Territory[] = adventure.world?.territories || adventure.worldSetting?.territories || [];
    if (!cleanPlayerLocName || cleanPlayerLocName === 'Unbekannt') return territories[0] || null;
    const cleanLower = cleanPlayerLocName.toLowerCase().trim();
    return territories.find(t => {
      const tClean = formatDisplayLocationName(t.name).toLowerCase().trim();
      return tClean === cleanLower || tClean.includes(cleanLower) || cleanLower.includes(tClean);
    }) || null;
  }, [adventure.world?.territories, adventure.worldSetting?.territories, cleanPlayerLocName]);

  const activeLocation = useMemo(() => {
    if (!cleanPlayerLocName || cleanPlayerLocName === 'Unbekannt') {
      return loreDatabase.find(l => l.category === 'Orte' && l.details?.isActiveTarget) || loreDatabase.find(l => l.category === 'Orte');
    }
    const cleanLower = cleanPlayerLocName.toLowerCase().trim();
    return loreDatabase.find(l => l.category === 'Orte' && (
      formatDisplayLocationName(l.title).toLowerCase().trim() === cleanLower ||
      l.title.toLowerCase().trim().includes(cleanLower) ||
      cleanLower.includes(l.title.toLowerCase().trim())
    )) || loreDatabase.find(l => l.category === 'Orte' && l.details?.isActiveTarget) || {
      id: 'player-loc-virtual',
      category: 'Orte',
      title: cleanPlayerLocName,
      description: 'Dein aktueller Aufenthaltsort.',
      details: {
        description: 'Dein aktueller Aufenthaltsort.',
        mapLevel: 'micro',
        coordinates: { x: 50, y: 50 }
      }
    };
  }, [loreDatabase, cleanPlayerLocName]);

  // Combined custom tiles from activeTerritory, activeLocation and combatState
  const customTiles: Record<string, string> = useMemo(() => {
    const terrTiles = activeTerritory?.tileData?.tiles || {};
    const locTiles = (activeLocation?.details as any)?.tileData?.tiles || (activeLocation?.details as any)?.tiles || {};
    const combatTiles = combatState.tiles || {};
    return {
      ...terrTiles,
      ...locTiles,
      ...combatTiles
    };
  }, [activeTerritory, activeLocation, combatState.tiles]);

  // Combined placed objects from activeTerritory, activeLocation, combatState, and default location items
  const locationPlacedObjects = useMemo(() => {
    const terrObjs = activeTerritory?.tileData?.placedObjects || (activeTerritory as any)?.placedObjects || [];
    const locObjs = (activeLocation?.details as any)?.tileData?.placedObjects || (activeLocation?.details as any)?.placedObjects || [];
    const combatObjs = combatState.placedObjects || [];

    const mapById = new Map<string, PlacedCombatObject>();

    const addObjs = (list: any[]) => {
      (list || []).forEach(obj => {
        if (obj && (obj.id || obj.name)) {
          const idKey = obj.id || `obj-${obj.name}-${obj.x || 0}-${obj.y || 0}`;
          mapById.set(idKey, { ...obj, id: idKey });
        }
      });
    };

    addObjs(terrObjs);
    addObjs(locObjs);
    addObjs(combatObjs);

    let merged = Array.from(mapById.values());

    // Fallback: If no placed objects exist yet for this location, generate location-specific default objects
    if (merged.length === 0) {
      const locTitle = (activeLocation?.title || activeTerritory?.name || cleanPlayerLocName || '').toLowerCase();
      const isHarborOrCoast = locTitle.includes('hafen') || locTitle.includes('port') || locTitle.includes('meer') || locTitle.includes('küste') || locTitle.includes('ouka') || locTitle.includes('insel');
      
      const width = combatState.gridWidth || 30;
      const height = combatState.gridHeight || 30;

      const initialTokens: PlacedCombatObject[] = [];

      if (isHarborOrCoast) {
        initialTokens.push({
          id: 'ship-sunny',
          name: 'Thousand Sunny',
          icon: '⛵',
          category: 'Schiffe & Fahrzeuge',
          description: 'Gefährten-Schiff der Strohhut-Bande im Hafen.',
          x: Math.floor(width / 2),
          y: height - 3
        });
        initialTokens.push({
          id: 'building-kontor',
          name: 'Hafenkontor',
          icon: '🏗️',
          category: 'Gebäude & Bauwerke',
          description: 'Verwaltung & Docks des Hafens.',
          x: Math.floor(width / 2) - 4,
          y: height - 8
        });
        initialTokens.push({
          id: 'chest-hafen',
          name: 'Schatzkiste',
          icon: '💎',
          category: 'Schätze & Interaktionen',
          description: 'Versteckte Truhe am Pier.',
          x: Math.floor(width / 2) + 4,
          y: height - 7
        });
      }

      merged = initialTokens;
    }

    return merged;
  }, [activeTerritory, activeLocation, combatState.placedObjects, combatState.gridWidth, combatState.gridHeight, cleanPlayerLocName]);

  // Read zoomLevel dynamically from state, defaulting to micro
  const zoomLevel = adventure.combatState?.combatZoomLevel || 'micro';

  // Keep track of the last processed playerCurrentLocation to prevent redundant updates
  const lastProcessedLocationRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastProcessedLocationRef.current === playerCurrentLocation) return;
    lastProcessedLocationRef.current = playerCurrentLocation;

    const parsedCoords = parseCoordsFromLocation(playerCurrentLocation) || { x: 10, y: 15 };
    const positions = adventure.combatState?.positions || {};
    const currentPos = positions[playerName];
    if (!currentPos || currentPos.x !== parsedCoords.x || currentPos.y !== parsedCoords.y) {
      const updatedPositions = {
        ...positions,
        [playerName]: parsedCoords
      };
      onUpdateAdventure({
        ...adventure,
        combatState: {
          ...(adventure.combatState || {}),
          positions: updatedPositions
        }
      });
    }
  }, [playerCurrentLocation, playerName]);

  // Selected item/token for inspection or dragging
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [showLocationDetailModal, setShowLocationDetailModal] = useState(false);

  // Asset Library State
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<'Fantasy' | 'Sci-Fi' | 'Cyberpunk' | 'Steampunk' | 'Post-Apokalyptisch' | 'Horror' | 'Modern'>('Fantasy');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePlacingAsset, setActivePlacingAsset] = useState<any | null>(null);
  const [keepPlacingMode, setKeepPlacingMode] = useState(false);
  const [selectedPlacedObjectId, setSelectedPlacedObjectId] = useState<string | null>(null);

  // Auto-detect setting from tags
  const detectedSetting = useMemo(() => {
    const eraLower = (adventure.world?.era || '').toLowerCase();
    const descLower = (adventure.world?.description || '').toLowerCase();
    const worldTitleLower = (adventure.world?.title || '').toLowerCase();
    const text = `${eraLower} ${descLower} ${worldTitleLower}`;
    
    if (text.includes('sci-fi') || text.includes('space') || text.includes('weltraum') || text.includes('zukunft')) return 'Sci-Fi';
    if (text.includes('cyberpunk') || text.includes('neon') || text.includes('cyber')) return 'Cyberpunk';
    if (text.includes('steampunk') || text.includes('äther') || text.includes('messing') || text.includes('victor')) return 'Steampunk';
    if (text.includes('post-apokalyptisch') || text.includes('apokalypse') || text.includes('ödland') || text.includes('ruinen') || text.includes('wasteland')) return 'Post-Apokalyptisch';
    if (text.includes('horror') || text.includes('gothic') || text.includes('grusel') || text.includes('vampir') || text.includes('tod')) return 'Horror';
    if (text.includes('modern') || text.includes('heute') || text.includes('gegenwart') || text.includes('stadt') || text.includes('realität')) return 'Modern';
    
    return 'Fantasy';
  }, [adventure]);

  useEffect(() => {
    if (detectedSetting) {
      setSelectedSetting(detectedSetting as any);
    }
  }, [detectedSetting]);
  
  // Local transient visual effect lines (e.g. clash attack paths)
  const [activeClash, setActiveClash] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    attacker: string;
    defender: string;
    type: string;
  } | null>(null);

  // References for tracking previous state to fire changes
  const prevMsgCountRef = useRef(messages.length);

  // Tactical Formations & Group Management State
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupMoveMode, setIsGroupMoveMode] = useState<boolean>(false);

  const tacticalEntities: Record<string, TacticalEntity> = combatState.tacticalEntities || {};
  const tacticalGroups: Record<string, TacticalGroup> = combatState.tacticalGroups || {};

  const allTacticalGroups = Object.values(tacticalGroups);
  const activeTacticalGroup = (selectedGroupId && tacticalGroups[selectedGroupId]) 
    ? tacticalGroups[selectedGroupId] 
    : allTacticalGroups[0] || null;

  // Auto-spawn tactical entities for opponents with count > 1 (e.g. 50 Goblins)
  useEffect(() => {
    if (!isCombatActive) return;
    const currentGroups = combatState.tacticalGroups || {};
    let currentState: CombatState = { ...combatState };
    let hasChanges = false;

    opponents.forEach(opp => {
      if (opp.count && opp.count > 1) {
        const cleanName = opp.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
        const exists = Object.values(currentGroups).some(g => {
          const gClean = g.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
          return gClean.includes(cleanName) || cleanName.includes(gClean);
        });

        if (!exists) {
          const res = spawnTacticalGroup({
            combatState: currentState,
            groupName: opp.name,
            count: opp.count,
            formation: 'loose',
            direction: 'south',
            spawnSource: opp.spawnSource || 'point',
            unitDisplayName: opp.name.replace(/\s*\d+x?$/, '').trim(),
            baseHp: opp.hp ? Math.max(10, Math.round(opp.hp / opp.count)) : 50
          });
          currentState = res.updatedCombatState;
          hasChanges = true;
        }
      }
    });

    if (hasChanges && onUpdateAdventure) {
      onUpdateAdventure((prev: any) => ({
        ...prev,
        combatState: currentState
      }));
    }
  }, [opponents, isCombatActive]);

  const handleTacticalFormationSelect = (newFormation: TacticalFormation) => {
    if (!activeTacticalGroup) return;
    try {
      const res = changeTacticalGroupFormation({
        combatState,
        groupId: activeTacticalGroup.id,
        newFormation,
        newDirection: activeTacticalGroup.direction || 'south'
      });
      onUpdateAdventure((prev: any) => ({
        ...prev,
        combatState: res.updatedCombatState
      }));
    } catch (err) {
      console.error('Fehler beim Formations-Wechsel:', err);
    }
  };

  const handleTacticalDirectionSelect = (newDirection: TacticalDirection) => {
    if (!activeTacticalGroup) return;
    try {
      const res = changeTacticalGroupFormation({
        combatState,
        groupId: activeTacticalGroup.id,
        newFormation: activeTacticalGroup.formation || 'loose',
        newDirection
      });
      onUpdateAdventure((prev: any) => ({
        ...prev,
        combatState: res.updatedCombatState
      }));
    } catch (err) {
      console.error('Fehler beim Richtungs-Wechsel:', err);
    }
  };

  const handleTacticalSplit = (count: number = 20) => {
    if (!activeTacticalGroup || activeTacticalGroup.unitIds.length <= count) return;
    try {
      const res = splitTacticalGroup({
        combatState,
        sourceGroupId: activeTacticalGroup.id,
        countToSplit: count,
        newGroupName: `${activeTacticalGroup.name} Flanke`,
        newFormation: 'wedge',
        newCenter: {
          x: Math.min(gridWidth - 3, Math.max(2, (activeTacticalGroup.center?.x || 15) - 6)),
          y: activeTacticalGroup.center?.y || 10
        }
      });
      onUpdateAdventure((prev: any) => ({
        ...prev,
        combatState: res.updatedCombatState
      }));
      setSelectedGroupId(res.newGroup.id);
    } catch (err) {
      console.error('Fehler beim Aufteilen des Verbands:', err);
    }
  };

  const handleQuickSpawnGoblins = () => {
    try {
      const res = spawnTacticalGroup({
        combatState,
        groupName: 'Goblin-Horde',
        count: 50,
        formation: 'loose',
        direction: 'south',
        unitDisplayName: 'Goblin'
      });
      onUpdateAdventure((prev: any) => ({
        ...prev,
        combatState: res.updatedCombatState
      }));
      setSelectedGroupId(res.group.id);
    } catch (err) {
      console.error('Fehler beim Aufstellen der Test-Horde:', err);
    }
  };

  // --- MINI-MAP PROCEDURAL RPG-MAKER BACKGROUND GRID ---
  const miniMapTiles = useMemo(() => {
    const gridWidth = combatState.gridWidth || 30;
    const gridHeight = combatState.gridHeight || 20;
    
    // Seed and details
    const worldTitle = adventure.worldTitle || adventure.worldSetting?.title || '';
    const worldDesc = adventure.worldSetting?.description || '';
    const titleLower = worldTitle.toLowerCase();
    const fullText = `${titleLower} ${worldDesc.toLowerCase()}`;
    
    let defaultBaseTerrain = 'natur_offen';
    if (fullText.includes('one piece') || fullText.includes('meer') || fullText.includes('ozean') || fullText.includes('pirat') || fullText.includes('insel') || fullText.includes('ocean') || fullText.includes('sea') || fullText.includes('island')) {
      defaultBaseTerrain = 'flüssigkeit';
    } else if (fullText.includes('wüste') || fullText.includes('desert') || fullText.includes('düne') || fullText.includes('sand') || fullText.includes('steppe')) {
      defaultBaseTerrain = 'trockenheit';
    } else if (fullText.includes('eis') || fullText.includes('schnee') || fullText.includes('frost') || fullText.includes('gletscher') || fullText.includes('kalt') || fullText.includes('ice') || fullText.includes('snow')) {
      defaultBaseTerrain = 'kälte';
    } else if (fullText.includes('höhle') || fullText.includes('cave') || fullText.includes('untergrund') || fullText.includes('dungeon') || fullText.includes('mine') || fullText.includes('katakombe')) {
      defaultBaseTerrain = 'untergrund';
    } else if (fullText.includes('wald') || fullText.includes('forest') || fullText.includes('dschungel') || fullText.includes('jungle') || fullText.includes('sumpf')) {
      defaultBaseTerrain = 'natur_dicht';
    }

    const currentNodes = loreDatabase.map(l => {
      if (l.category !== 'Orte') return l;
      const details = l.details || {};
      let mapLevel = details.mapLevel;
      let coordinates = details.coordinates;
      
      if (!mapLevel) {
        const combined = (l.title + ' ' + (l.details?.description || '')).toLowerCase();
        if (/gilde|taverne|haus|höhle|shop|laden|markt|zimmer|poi|bar|herberge|schrein|ruine|tempel|palast|platz|arena|zuhause|kerker/i.test(combined)) {
          mapLevel = 'micro';
        } else if (/kontinent|welt|reich|königreich|ozean|meer|insel/i.test(combined)) {
          mapLevel = 'macro';
        } else {
          mapLevel = 'meso';
        }
      }
      
      if (!coordinates || typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number') {
        let hash = 0;
        for (let i = 0; i < l.title.length; i++) {
          hash = l.title.charCodeAt(i) + ((hash << 5) - hash);
        }
        const x = Math.abs((hash * 13) % 70) + 15;
        const y = Math.abs((hash * 37) % 70) + 15;
        coordinates = { x, y };
      }
      
      return {
        ...l,
        details: {
          ...details,
          mapLevel,
          coordinates
        }
      };
    }).filter(l => {
      if (l.category !== 'Orte') return false;
      return l.details?.mapLevel === zoomLevel;
    });

    const currentLocText = `${cleanPlayerLocName} ${activeLocation?.title || ''} ${(activeLocation as any)?.description || activeLocation?.details?.description || ''} ${activeTerritory?.name || ''}`.toLowerCase();
    
    let overrideBaseTerrain = '';
    let specialTheme = '';
    
    if (currentLocText.includes('hafen') || currentLocText.includes('port') || currentLocText.includes('pier') || currentLocText.includes('anlegestelle') || currentLocText.includes('ouka') || currentLocText.includes('dock')) {
      specialTheme = 'hafen';
      overrideBaseTerrain = 'flüssigkeit';
    } else if (currentLocText.includes('stadt') || currentLocText.includes('dorf') || currentLocText.includes('siedlung') || currentLocText.includes('markt') || currentLocText.includes('marktplatz')) {
      specialTheme = 'stadt';
      overrideBaseTerrain = 'natur_offen';
    } else if (currentLocText.includes('schmiede') || currentLocText.includes('forge') || currentLocText.includes('vulkan') || currentLocText.includes('schmelze') || currentLocText.includes('lava') || currentLocText.includes('werkstatt')) {
      specialTheme = 'schmiede';
      overrideBaseTerrain = 'hitze';
    } else if (currentLocText.includes('taverne') || currentLocText.includes('gasthaus') || currentLocText.includes('wirtshaus') || currentLocText.includes('gilde') || currentLocText.includes('schänke') || currentLocText.includes('tavern') || currentLocText.includes('inn') || currentLocText.includes('shop') || currentLocText.includes('zimmer')) {
      specialTheme = 'taverne';
      overrideBaseTerrain = 'struktur';
    } else if (currentLocText.includes('höhle') || currentLocText.includes('cave') || currentLocText.includes('tunnel') || currentLocText.includes('mine') || currentLocText.includes('katakomben') || currentLocText.includes('verlies') || currentLocText.includes('dungeon')) {
      specialTheme = 'höhle';
      overrideBaseTerrain = 'untergrund';
    } else if (currentLocText.includes('wald') || currentLocText.includes('forest') || currentLocText.includes('dschungel') || currentLocText.includes('jungle') || currentLocText.includes('sumpf') || currentLocText.includes('hügel')) {
      specialTheme = 'wald';
      overrideBaseTerrain = 'natur_dicht';
    }

    const baseTerrain = overrideBaseTerrain || defaultBaseTerrain;
    
    // Simple deterministic PRNG
    let h = 0;
    const seedStr = `${titleLower}-${zoomLevel}-${activeLocation?.id || 'none'}`;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
    }
    const rng = () => {
      let t = h += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const tiles: { col: number; row: number; terrainId: string }[] = [];

    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        const cx = c * (100 / gridWidth) + (100 / (2 * gridWidth));
        const cy = r * (100 / gridHeight) + (100 / (2 * gridHeight));
        let chosenTerrain = baseTerrain;

        if (specialTheme === 'hafen') {
          // Bottom 5 rows: harbor water/ocean
          if (r >= gridHeight - 5) {
            chosenTerrain = 'flüssigkeit';
          } else if (r === gridHeight - 6) {
            chosenTerrain = 'struktur'; // Pier/dock
          } else if (c === Math.floor(gridWidth * 0.5) || r === Math.floor(gridHeight * 0.45)) {
            chosenTerrain = 'natur_offen'; // Road
          } else if ((c === Math.floor(gridWidth * 0.3) || c === Math.floor(gridWidth * 0.7)) && r >= Math.floor(gridHeight * 0.2) && r <= Math.floor(gridHeight * 0.6)) {
            chosenTerrain = 'struktur'; // Buildings
          } else {
            const val = rng();
            chosenTerrain = val < 0.65 ? 'natur_offen' : val < 0.85 ? 'natur_dicht' : 'fels';
          }
        } else if (specialTheme === 'stadt') {
          if (c === Math.floor(gridWidth * 0.5) || r === Math.floor(gridHeight * 0.5)) {
            chosenTerrain = 'natur_offen'; // Main street
          } else if ((c % 4 === 0) && (r % 4 === 0)) {
            chosenTerrain = 'struktur'; // Buildings
          } else {
            const val = rng();
            chosenTerrain = val < 0.7 ? 'natur_offen' : 'natur_dicht';
          }
        } else if (specialTheme === 'schmiede') {
          const val = rng();
          if (val < 0.25) chosenTerrain = 'hitze';
          else if (val < 0.70) chosenTerrain = 'struktur';
          else chosenTerrain = 'fels';
        } else if (specialTheme === 'taverne') {
          const val = rng();
          const minCol = Math.floor(gridWidth * 0.2);
          const maxCol = Math.floor(gridWidth * 0.8);
          const minRow = Math.floor(gridHeight * 0.2);
          const maxRow = Math.floor(gridHeight * 0.8);
          if (c >= minCol && c <= maxCol && r >= minRow && r <= maxRow) {
            chosenTerrain = val < 0.8 ? 'struktur' : 'untergrund';
          } else {
            if (val < 0.6) chosenTerrain = 'natur_offen';
            else if (val < 0.8) chosenTerrain = 'natur_dicht';
            else chosenTerrain = 'struktur';
          }
        } else if (specialTheme === 'höhle') {
          const val = rng();
          if (val < 0.50) chosenTerrain = 'untergrund';
          else if (val < 0.80) chosenTerrain = 'fels';
          else if (val < 0.90) chosenTerrain = 'ungewissheit';
          else chosenTerrain = 'flüssigkeit';
        } else if (specialTheme === 'wald') {
          const val = rng();
          if (val < 0.45) chosenTerrain = 'natur_dicht';
          else if (val < 0.85) chosenTerrain = 'natur_offen';
          else if (val < 0.95) chosenTerrain = 'flüssigkeit';
          else chosenTerrain = 'fels';
        } else {
          let closestNode: any = null;
          let minDistance = 999999;

          currentNodes.forEach(node => {
            if (node.details?.coordinates) {
              const nx = node.details.coordinates.x;
              const ny = node.details.coordinates.y;
              const dist = Math.sqrt((cx - nx) ** 2 + (cy - ny) ** 2);
              if (dist < minDistance) {
                minDistance = dist;
                closestNode = node;
              }
            }
          });

          if (closestNode && minDistance < 32) {
            const nodeTile = closestNode.details?.terrainTile;
            if (nodeTile) {
              const influenceChance = 0.85 * (1 - minDistance / 32);
              if (rng() < influenceChance) {
                chosenTerrain = nodeTile;
              } else {
                const roll = rng();
                if (nodeTile === 'flüssigkeit') {
                  chosenTerrain = roll < 0.3 ? 'natur_offen' : 'flüssigkeit';
                } else if (nodeTile === 'struktur') {
                  chosenTerrain = roll < 0.4 ? 'natur_offen' : 'struktur';
                } else if (nodeTile === 'fels') {
                  chosenTerrain = roll < 0.5 ? 'natur_dicht' : 'fels';
                } else if (nodeTile === 'hitze') {
                  chosenTerrain = roll < 0.4 ? 'fels' : 'hitze';
                }
              }
            }
          } else {
            const roll = rng();
            if (baseTerrain === 'flüssigkeit') {
              if (roll < 0.08) chosenTerrain = 'natur_offen';
              else if (roll < 0.12) chosenTerrain = 'trockenheit';
              else if (roll < 0.15) chosenTerrain = 'fels';
            } else if (baseTerrain === 'trockenheit') {
              if (roll < 0.05) chosenTerrain = 'flüssigkeit';
              else if (roll < 0.15) chosenTerrain = 'natur_offen';
              else if (roll < 0.30) chosenTerrain = 'fels';
            } else if (baseTerrain === 'natur_offen') {
              if (roll < 0.25) chosenTerrain = 'natur_dicht';
              else if (roll < 0.35) chosenTerrain = 'fels';
              else if (roll < 0.42) chosenTerrain = 'flüssigkeit';
              else if (roll < 0.45) chosenTerrain = 'struktur';
            }
          }
        }

        tiles.push({
          col: c,
          row: r,
          terrainId: chosenTerrain
        });
      }
    }

    return tiles;
  }, [loreDatabase, zoomLevel, adventure]);

  const getTileColor = (terrainId: string): string => {
    switch (terrainId) {
      case 'flüssigkeit': return '#0a304e';
      case 'hitze': return '#3e0a0a';
      case 'kälte': return '#0f3544';
      case 'natur_dicht': return '#053225';
      case 'natur_offen': return '#0f3a1e';
      case 'trockenheit': return '#3a200a';
      case 'fels': return '#242c38';
      case 'struktur': return '#2d2b28';
      case 'untergrund': return '#2b0e40';
      case 'ungewissheit': return '#202023';
      default: return '#10151f';
    }
  };

  const getTileIcon = (terrainId: string): string => {
    switch (terrainId) {
      case 'flüssigkeit': return 'fa-solid fa-droplet';
      case 'hitze': return 'fa-solid fa-fire';
      case 'kälte': return 'fa-solid fa-snowflake';
      case 'natur_dicht': return 'fa-solid fa-tree';
      case 'natur_offen': return 'fa-solid fa-seedling';
      case 'trockenheit': return 'fa-solid fa-sun-plant-wilt';
      case 'fels': return 'fa-solid fa-mountain';
      case 'struktur': return 'fa-solid fa-city';
      case 'untergrund': return 'fa-solid fa-dungeon';
      case 'ungewissheit': return 'fa-solid fa-smog';
      default: return '';
    }
  };

  // 1. Detect biome automatically based on active location and chat history keywords
  const recentText = messages.slice(-2).map(m => m.text).join(' ');
  const locationTitle = activeLocation?.title || '';
  const locationDesc = activeLocation?.details?.description || '';

  const detectBiome = (title: string, desc: string, text: string) => {
    const titleLower = title.toLowerCase();
    const descLower = desc.toLowerCase();
    const textLower = text.toLowerCase();

    // 1. If active location has a title, check for specific primary terrain keywords
    if (titleLower) {
      if (titleLower.includes('schmiede') || titleLower.includes('werkstatt') || titleLower.includes('forge') || titleLower.includes('schmelze')) return 'building';
      if (titleLower.includes('taverne') || titleLower.includes('gasthaus') || titleLower.includes('haus') || titleLower.includes('gebäude') || titleLower.includes('anwesen') || titleLower.includes('gilde') || titleLower.includes('palast') || titleLower.includes('schloss') || titleLower.includes('burg')) return 'building';
      if (titleLower.includes('wald') || titleLower.includes('forst') || titleLower.includes('jungle') || titleLower.includes('dschungel') || titleLower.includes('sumpf')) return 'forest';
      if (titleLower.includes('höhle') || titleLower.includes('cave') || titleLower.includes('tunnel') || titleLower.includes('kerker') || titleLower.includes('dungeon') || titleLower.includes('mine') || titleLower.includes('stollen')) return 'tunnel';
      if (titleLower.includes('vulkan') || titleLower.includes('lava') || titleLower.includes('magma')) return 'volcano';
      if (titleLower.includes('eis') || titleLower.includes('schnee') || titleLower.includes('gletscher') || titleLower.includes('kalt') || titleLower.includes('frost')) return 'ice';
      if (titleLower.includes('wüste') || titleLower.includes('sand') || titleLower.includes('steppe')) return 'desert';
      if (titleLower.includes('meer') || titleLower.includes('ozean') || titleLower.includes('see') || titleLower.includes('schiff') || titleLower.includes('insel') || titleLower.includes('strand')) return 'sea';
    }

    // 2. If title didn't match specific indicators, check description of the place
    if (descLower) {
      if (descLower.includes('wald') || descLower.includes('forst') || descLower.includes('baum') || descLower.includes('bäume') || descLower.includes('dschungel')) return 'forest';
      if (descLower.includes('tunnel') || descLower.includes('höhle') || descLower.includes('cave') || descLower.includes('kerker') || descLower.includes('dungeon') || descLower.includes('mine')) return 'tunnel';
      if (descLower.includes('gebäude') || descLower.includes('haus') || descLower.includes('burg') || descLower.includes('schloss') || descLower.includes('schmiede') || descLower.includes('taverne') || descLower.includes('anwesen')) return 'building';
      if (descLower.includes('magma') || descLower.includes('lava') || descLower.includes('vulkan')) return 'volcano';
      if (descLower.includes('eis') || descLower.includes('schnee') || descLower.includes('gletscher') || descLower.includes('frost')) return 'ice';
      if (descLower.includes('wüste') || descLower.includes('sand') || descLower.includes('düne')) return 'desert';
      if (descLower.includes('meer') || descLower.includes('ozean') || descLower.includes('see') || descLower.includes('schiff')) return 'sea';
    }

    // 3. Fallback to chat history text keywords if no active location title/desc matched
    if (textLower) {
      if (textLower.includes('wald') || textLower.includes('forst') || textLower.includes('dschungel')) return 'forest';
      if (textLower.includes('tunnel') || textLower.includes('höhle') || textLower.includes('cave') || textLower.includes('kerker') || textLower.includes('dungeon') || textLower.includes('mine')) return 'tunnel';
      if (textLower.includes('gebäude') || textLower.includes('haus') || textLower.includes('burg') || textLower.includes('schloss') || textLower.includes('schmiede') || textLower.includes('taverne') || textLower.includes('anwesen')) return 'building';
      if (textLower.includes('magma') || textLower.includes('lava') || textLower.includes('vulkan')) return 'volcano';
      if (textLower.includes('eis') || textLower.includes('schnee') || textLower.includes('gletscher') || textLower.includes('frost')) return 'ice';
      if (textLower.includes('wüste') || textLower.includes('sand')) return 'desert';
      if (textLower.includes('meer') || textLower.includes('ozean') || textLower.includes('see') || textLower.includes('schiff')) return 'sea';
    }

    return 'grass';
  };

  const detectedBiomeKey = detectBiome(locationTitle, locationDesc, recentText);
  const biome = BIOMES[detectedBiomeKey as keyof typeof BIOMES] || BIOMES.grass;

  // Derive all active combatants & positions on the micro battlefield (8x8 grid)
  const companions: NPC[] = (adventure.npcs || [])
    .filter((n: any) => !n.isHostile && n.status !== 'unbekannt')
    .filter(isNpcAtPlayerLocation);

  // Load positions from state, or set defaults
  const positions: Record<string, { x: number; y: number }> = combatState.positions || {};
  const isInitialized = combatState.positions !== undefined;
  const tiles: Record<string, string> = customTiles;
  const fireTurnCount = combatState.fireTurnCount || 0;

  const syncPlayerLocation = (x: number, y: number, currentAdventure: any) => {
    const coordKey = `${x},${y}`;
    const customTileType = tiles[coordKey];
    let tileName = 'Weg / Pfad';
    if (customTileType) {
      const customStyle = getCustomTerrainStyle(customTileType);
      tileName = customStyle ? customStyle.label : customTileType;
    } else {
      const tile = miniMapTiles.find(t => t.col === x && t.row === y);
      if (tile) {
        const style = getSettingTileStyle(tile.terrainId, selectedSetting);
        if (style) tileName = style.label;
      }
    }

    if (tileName) {
      tileName = tileName.split(' / ')[0]; // E.g. simplify "Weg / Pfad" to "Weg"
    }

    const activeOrt = activeLocation || currentAdventure.loreDatabase?.find((l: any) => l.category === 'Orte' && l.details?.isActiveTarget)
      || currentAdventure.loreDatabase?.find((l: any) => l.category === 'Orte');
    const placeName = activeOrt?.title || 'Startgebiet';
    const newLocationStr = `${placeName} (${tileName}) (X:${x}, Y:${y})`;

    let updatedPlayer = {
      ...currentAdventure.player,
      appearance: {
        ...(currentAdventure.player?.appearance || {}),
        currentLocation: newLocationStr
      }
    };

    let updatedLore = currentAdventure.loreDatabase;
    if (updatedLore) {
      const loreIdx = updatedLore.findIndex((entry: any) => entry.category === 'Charaktere' && entry.title === currentAdventure.player?.name);
      if (loreIdx > -1) {
        updatedLore = [...updatedLore];
        updatedLore[loreIdx] = {
          ...updatedLore[loreIdx],
          details: {
            ...(updatedLore[loreIdx].details || {}),
            currentLocation: newLocationStr
          }
        };
      }
    }

    let updatedStatus = currentAdventure.statusElements ? [...currentAdventure.statusElements] : [];
    const locIdx = updatedStatus.findIndex((item: any) => (item.label || '').toLowerCase().includes('standort') || (item.label || '').toLowerCase().includes('ort'));
    if (locIdx > -1) {
      updatedStatus[locIdx] = { ...updatedStatus[locIdx], value: newLocationStr };
    } else if (updatedStatus.length > 0) {
      updatedStatus.push({ id: 'def-loc', label: 'Standort', value: newLocationStr });
    } else {
      updatedStatus = [
        { id: 'def-zeit', label: 'Uhrzeit', value: '12:00' },
        { id: 'def-loc', label: 'Standort', value: newLocationStr },
        { id: 'def-money', label: 'Vermögen', value: '100 Gold' }
      ];
    }

    return {
      player: updatedPlayer,
      loreDatabase: updatedLore,
      statusElements: updatedStatus,
      initialStatusElements: currentAdventure.initialStatusElements && currentAdventure.initialStatusElements.length > 0 ? currentAdventure.initialStatusElements : updatedStatus
    };
  };

  // Setup default positions if not initialized
  const initializedPositions = { ...positions };
  let needsPosUpdate = false;

  if (!isInitialized) {
    initializedPositions[playerName] = { x: 10, y: 15 };
    companions.forEach((comp, idx) => {
      initializedPositions[comp.name] = { x: 8, y: 13 + idx };
    });
    opponents.forEach((opp, idx) => {
      initializedPositions[opp.name] = { x: 18 + Math.floor(idx / 3), y: 11 + (idx % 4) };
    });
    needsPosUpdate = true;
  } else {
    // Even if initialized, ensure ANY missing players, companions, or opponents get a default position!
    if (!initializedPositions[playerName]) {
      initializedPositions[playerName] = { x: 10, y: 15 };
      needsPosUpdate = true;
    }
    companions.forEach((comp, idx) => {
      if (!initializedPositions[comp.name]) {
        initializedPositions[comp.name] = { x: 8, y: 13 + idx };
        needsPosUpdate = true;
      }
    });
    opponents.forEach((opp, idx) => {
      if (!initializedPositions[opp.name]) {
        // Find terrain match in placedObjects on the map!
        const placedObjs = combatState.placedObjects || [];
        const spawnSearch = (opp.spawnSource || opp.role || opp.name || '').toLowerCase();

        let terrainObj = placedObjs.find((obj: PlacedCombatObject) => {
          const oName = obj.name.toLowerCase();
          const oCat = (obj.category || '').toLowerCase();
          return (
            (spawnSearch.includes('wald') && (oName.includes('wald') || oCat.includes('natur') || oName.includes('baum'))) ||
            (spawnSearch.includes('schiff') && (oName.includes('schiff') || oCat.includes('fahrzeug') || oName.includes('boot'))) ||
            (spawnSearch.includes('festung') && (oName.includes('festung') || oName.includes('burg') || oCat.includes('gebäude'))) ||
            (spawnSearch.includes('haus') && (oName.includes('haus') || oName.includes('hütten') || oCat.includes('gebäude'))) ||
            (spawnSearch.includes('höhle') && (oName.includes('höhle') || oName.includes('berg'))) ||
            (spawnSearch.includes('tor') && (oName.includes('tor') || oName.includes('portal'))) ||
            (spawnSearch.includes('lager') && (oName.includes('lager') || oName.includes('zelt'))) ||
            (spawnSearch.includes('strand') && (oName.includes('strand') || oName.includes('küste'))) ||
            (opp.spawnSource && oName.includes(opp.spawnSource.toLowerCase()))
          );
        });

        // Fallback: If opp is fodder/squad and no exact spawn match, look for any building/ship/nature object on map
        if (!terrainObj && (opp.count || opp.isFodder) && placedObjs.length > 0) {
          terrainObj = placedObjs.find((obj: PlacedCombatObject) => {
            const cat = (obj.category || '').toLowerCase();
            const name = obj.name.toLowerCase();
            return cat.includes('gebäude') || cat.includes('schiff') || cat.includes('natur') || name.includes('wald') || name.includes('schiff') || name.includes('festung') || name.includes('haus') || name.includes('höhle');
          });
        }

        let basePos = { x: 18, y: 11 };
        if (terrainObj) {
          basePos = { x: terrainObj.x, y: terrainObj.y };
        } else {
          // If there's an existing opponent with a similar base name (e.g. "Marine-Soldaten A"), try to place nearby!
          const baseNameMatch = opp.name.replace(/\s+[A-Z]$/, '');
          const similarOpponent = opponents.find(o => o.name !== opp.name && o.name.startsWith(baseNameMatch) && initializedPositions[o.name]);
          if (similarOpponent) {
            basePos = initializedPositions[similarOpponent.name];
          } else if (opponents[0] && initializedPositions[opponents[0].name]) {
            basePos = initializedPositions[opponents[0].name];
          }
        }
        
        // Find nearby free coordinate
        let foundX = basePos.x;
        let foundY = basePos.y;
        let offset = 1;
        let found = false;
        
        while (offset < 5 && !found) {
          const candidateDirs = [
            { dx: offset, dy: 0 }, { dx: 0, dy: offset }, { dx: -offset, dy: 0 }, { dx: 0, dy: -offset },
            { dx: offset, dy: offset }, { dx: -offset, dy: offset }, { dx: offset, dy: -offset }, { dx: -offset, dy: -offset }
          ];
          for (const d of candidateDirs) {
            const cx = basePos.x + d.dx;
            const cy = basePos.y + d.dy;
            if (cx >= 0 && cx < 30 && cy >= 0 && cy < 30) {
              const occupied = Object.values(initializedPositions).some((p: any) => p.x === cx && p.y === cy);
              if (!occupied) {
                foundX = cx;
                foundY = cy;
                found = true;
                break;
              }
            }
          }
          offset++;
        }
        
        initializedPositions[opp.name] = { x: foundX, y: foundY };
        needsPosUpdate = true;
      }
    });
  }

  // Clamping coordinates safely between 0 and maxX/maxY
  Object.keys(initializedPositions).forEach(key => {
    const pos = initializedPositions[key];
    if (pos) {
      if (pos.x < 0 || pos.x > maxX || pos.y < 0 || pos.y > maxY) {
        initializedPositions[key] = {
          x: Math.min(maxX, Math.max(0, pos.x)),
          y: Math.min(maxY, Math.max(0, pos.y))
        };
        needsPosUpdate = true;
      }
    }
  });

  // Handle automatic changes on each message turn (terrain elements, movement, clash attacks)
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      const secondLastMsg = messages[messages.length - 2];
      const msgText = (lastMsg?.text || '') + ' ' + (secondLastMsg?.text || '');
      const lowerText = msgText.toLowerCase();

      let nextTiles = { ...tiles };
      let updatedPositions = { ...initializedPositions };
      let updatedFireTurn = fireTurnCount;
      let updatedWeather = combatState.weather;
      let updatedTimeOfDay = combatState.timeOfDay || 'day';
      let hasGridChanges = false;

      // Time of Day Auto-Detection and parsing
      const timeMatches = msgText.matchAll(/\[\[STATUS:\s*Time\s*=\s*([^\s\]]+)\s*\]\]/gi);
      for (const tMatch of timeMatches) {
        const tType = tMatch[1].toLowerCase().trim();
        if (['morning', 'day', 'evening', 'night'].includes(tType)) {
          updatedTimeOfDay = tType as any;
          hasGridChanges = true;
        }
      }

      const timeNarrative = lowerText.includes('die sonne geht auf') || lowerText.includes('morgendämmerung') || lowerText.includes('es wird tag') || lowerText.includes('sonnenuntergang') || lowerText.includes('dämmerung bricht herein') || lowerText.includes('die sonne geht unter') || lowerText.includes('es wird nacht') || lowerText.includes('die nacht bricht herein') || lowerText.includes('mitternacht');
      if (timeNarrative && !msgText.includes('[[STATUS: Time=')) {
        if (lowerText.includes('die sonne geht auf') || lowerText.includes('morgendämmerung')) updatedTimeOfDay = 'morning';
        else if (lowerText.includes('es wird tag') || lowerText.includes('mittags')) updatedTimeOfDay = 'day';
        else if (lowerText.includes('sonnenuntergang') || lowerText.includes('dämmerung bricht herein') || lowerText.includes('die sonne geht unter')) updatedTimeOfDay = 'evening';
        else if (lowerText.includes('es wird nacht') || lowerText.includes('die nacht bricht herein') || lowerText.includes('mitternacht')) updatedTimeOfDay = 'night';
        hasGridChanges = true;
      }

      // Weather Auto-Detection and parsing
      const weatherMatches = msgText.matchAll(/\[\[STATUS:\s*Weather\s*=\s*([^\s\]]+)\s*\]\]/gi);
      for (const wMatch of weatherMatches) {
        const wType = wMatch[1].toLowerCase().trim();
        updatedWeather = wType === 'klar' || wType === 'clear' ? undefined : wType;
        hasGridChanges = true;
      }

      const weatherNarrative = lowerText.includes('es fängt an zu regnen') || lowerText.includes('starker regen') || lowerText.includes('sturm zieht auf') || lowerText.includes('gewitter zieht auf') || lowerText.includes('schneefall') || lowerText.includes('dichter nebel') || lowerText.includes('wetter klart auf') || lowerText.includes('die sonne kommt raus');
      if (weatherNarrative && !msgText.includes('[[STATUS: Weather=')) {
        if (lowerText.includes('sturm') || lowerText.includes('gewitter')) updatedWeather = 'sturm';
        else if (lowerText.includes('regen')) updatedWeather = 'regen';
        else if (lowerText.includes('schnee') || lowerText.includes('blizzard')) updatedWeather = 'schnee';
        else if (lowerText.includes('nebel') || lowerText.includes('dichter nebel')) updatedWeather = 'nebel';
        else if (lowerText.includes('klart auf') || lowerText.includes('sonne')) updatedWeather = undefined;
        hasGridChanges = true;
      }

      // 1. Forest Fire Spreading & Burnt Earth (Verbrannte Erde) Algorithm
      const isFireMentioned = lowerText.includes('feuer') || lowerText.includes('brennt') || lowerText.includes('brand') || lowerText.includes('zündet') || lowerText.includes('waldbrand') || lowerText.includes('flammen');
      const isExtinguished = lowerText.includes('lösch') || lowerText.includes('gelöscht') || lowerText.includes('regen') || lowerText.includes('flut') || lowerText.includes('löscht') || lowerText.includes('ausgelöscht');
      
      if (isExtinguished) {
        // Fire is extinguished by rain, water or spell -> leaves burnt ash earth and steam!
        hasGridChanges = true;
        Object.keys(nextTiles).forEach(coord => {
          if (nextTiles[coord] === 'fire') {
            nextTiles[coord] = Math.random() > 0.5 ? 'ash' : 'steam';
          }
        });
      } else if (isFireMentioned) {
        updatedFireTurn += 1;
        hasGridChanges = true;

        const currentFireCoords = Object.entries(nextTiles)
          .filter(([_, value]) => value === 'fire')
          .map(([coord]) => coord.split(',').map(Number));

        if (currentFireCoords.length === 0) {
          // Initialize first fire on a random tile near the enemies or battlefield center
          const rx = 15 + Math.floor(Math.random() * 5);
          const ry = 12 + Math.floor(Math.random() * 5);
          nextTiles[`${rx},${ry}`] = 'fire';
        } else {
          // Spread fire to adjacent tiles and burn out old fire tiles into burnt ash earth!
          currentFireCoords.forEach(([fx, fy]) => {
            const directions = [[1,0], [-1,0], [0,1], [0,-1]];
            directions.forEach(([dx, dy]) => {
              const nx = fx + dx;
              const ny = fy + dy;
              if (nx >= 0 && nx < 30 && ny >= 0 && ny < 30) {
                if (!nextTiles[`${nx},${ny}`] && Math.random() < 0.6) {
                  nextTiles[`${nx},${ny}`] = 'fire';
                }
              }
            });

            // 30% chance for an old fire tile to burn out into scorched ash
            if (Math.random() < 0.35) {
              nextTiles[`${fx},${fy}`] = 'ash';
            }
          });

          // Add 1-2 new fires
          for (let i = 0; i < 2; i++) {
            const rx = Math.floor(Math.random() * 30);
            const ry = Math.floor(Math.random() * 30);
            if (!nextTiles[`${rx},${ry}`]) {
              nextTiles[`${rx},${ry}`] = 'fire';
            }
          }
        }
      }

      // 2. Dynamic Ice and Magma Clash Algorithm
      // "Eis und Magma treffen aufeinander"
      const hasIce = lowerText.includes('eis') || lowerText.includes('frost') || lowerText.includes('kälte');
      const hasMagma = lowerText.includes('magma') || lowerText.includes('lava') || lowerText.includes('vulkan');

      if (hasIce && hasMagma) {
        hasGridChanges = true;
        const pCoord = updatedPositions[playerName] || { x: 10, y: 15 };
        const eName = opponents[0]?.name || 'Gegner';
        const eCoord = updatedPositions[eName] || { x: 18, y: 11 };

        const midX = Math.floor((pCoord.x + eCoord.x) / 2);
        const midY = Math.floor((pCoord.y + eCoord.y) / 2);

        // Generate directional clash field across the grid
        for (let x = 0; x < 30; x++) {
          for (let y = 0; y < 30; y++) {
            const distToPlayer = Math.hypot(x - pCoord.x, y - pCoord.y);
            const distToEnemy = Math.hypot(x - eCoord.x, y - eCoord.y);
            const distToMid = Math.hypot(x - midX, y - midY);

            if (distToMid <= 2.5) {
              // Clash collision boundary: steam, obsidian & ash!
              nextTiles[`${x},${y}`] = distToMid <= 1 ? 'steam' : (x + y) % 2 === 0 ? 'obsidian' : 'steam';
            } else if (distToPlayer < distToEnemy) {
              // Caster side ice domain
              if (distToPlayer < 10) nextTiles[`${x},${y}`] = 'ice';
            } else {
              // Enemy side magma domain
              if (distToEnemy < 10) nextTiles[`${x},${y}`] = 'magma';
            }
          }
        }

        // Trigger heavy elemental shockwave animation
        setActiveClash({
          from: pCoord,
          to: eCoord,
          attacker: playerName,
          defender: eName,
          type: 'elemental-clash'
        });

        setTimeout(() => setActiveClash(null), 3000);
      }

      // 3. Regular Attacks visual line clash animation
      if (!lowerText.includes('eis') && (lowerText.includes('greift') || lowerText.includes('trifft') || lowerText.includes('schlag') || lowerText.includes('attacke') || lowerText.includes('zauber') || lowerText.includes('feuerball'))) {
        // Find an attacker and defender in the narration
        const allNames = [playerName, ...companions.map(c => c.name), ...opponents.map(o => o.name)];
        let foundAttacker = playerName;
        let foundDefender = opponents[0]?.name || '';

        // Scan which entities are named
        allNames.forEach(n => {
          if (lowerText.includes(n.toLowerCase())) {
            if (opponents.some(o => o.name === n)) {
              foundDefender = n;
            } else {
              foundAttacker = n;
            }
          }
        });

        if (foundAttacker && foundDefender && updatedPositions[foundAttacker] && updatedPositions[foundDefender]) {
          setActiveClash({
            from: updatedPositions[foundAttacker],
            to: updatedPositions[foundDefender],
            attacker: foundAttacker,
            defender: foundDefender,
            type: 'attack'
          });
          setTimeout(() => setActiveClash(null), 1500);
        }
      }

      // Save changes back to database immediately
      if (hasGridChanges || needsPosUpdate) {
        onUpdateAdventure({
          ...adventure,
          combatState: {
            ...combatState,
            positions: updatedPositions,
            tiles: nextTiles,
            fireTurnCount: updatedFireTurn,
            weather: updatedWeather,
            timeOfDay: updatedTimeOfDay
          }
        });
      }

      // 4. Dynamic turn-based movement for Characters, Opponents, and Transport Vehicles / Placed Objects
      let updatedPlacedObjects = [...(combatState.placedObjects || [])];
      const movedEntities = new Set<string>();
      const movedObjects = new Set<string>();

      // A) Parse explicit status tags: [[STATUS: Position_Name=X,Y]] or [[STATUS: Move_Name=X,Y]] or [[STATUS: Terrain_X_Y=Type]]
      const terrainMatches = msgText.matchAll(/\[\[STATUS:\s*Terrain_(\d+)_(\d+)\s*=\s*([^\s\]]+)\s*\]\]/gi);
      for (const tMatch of terrainMatches) {
        const tx = Math.min(maxX, Math.max(0, parseInt(tMatch[1])));
        const ty = Math.min(maxY, Math.max(0, parseInt(tMatch[2])));
        const tType = tMatch[3].toLowerCase().trim();
        nextTiles[`${tx},${ty}`] = tType;
        hasGridChanges = true;
      }

      // Building Construction Tag: [[STATUS: Build_Dorf=15,12]] or [[STATUS: Build_Festung=20,10]]
      const buildMatches = msgText.matchAll(/\[\[STATUS:\s*Build_([^\s=]+)\s*=\s*(\d+)\s*,\s*(\d+)\s*\]\]/gi);
      for (const bMatch of buildMatches) {
        const rawName = bMatch[1].replace(/_/g, ' ').trim();
        const bx = Math.min(maxX, Math.max(0, parseInt(bMatch[2])));
        const by = Math.min(maxY, Math.max(0, parseInt(bMatch[3])));
        
        let icon = '🏘️';
        let category = 'Dorf & Siedlung';
        const lowerN = rawName.toLowerCase();
        if (lowerN.includes('festung') || lowerN.includes('burg') || lowerN.includes('kastell')) {
          icon = '🏰'; category = 'Gebäude & Festung';
        } else if (lowerN.includes('haus') || lowerN.includes('hütte')) {
          icon = '🏠'; category = 'Gebäude & Festung';
        } else if (lowerN.includes('turm') || lowerN.includes('außenposten') || lowerN.includes('posten')) {
          icon = '🗼'; category = 'Gebäude & Festung';
        } else if (lowerN.includes('schmiede') || lowerN.includes('werkstatt')) {
          icon = '⚒️'; category = 'Gebäude & Festung';
        } else if (lowerN.includes('lager') || lowerN.includes('zelt')) {
          icon = '⛺'; category = 'Gebiet & Zone';
        } else if (lowerN.includes('brücke')) {
          icon = '🌉'; category = 'Gebäude & Festung';
        }

        const existingIdx = updatedPlacedObjects.findIndex(o => o.x === bx && o.y === by && o.name.toLowerCase() === lowerN);
        if (existingIdx >= 0) {
          updatedPlacedObjects[existingIdx] = {
            ...updatedPlacedObjects[existingIdx],
            condition: 'intact',
            isDestroyed: false
          };
        } else {
          updatedPlacedObjects.push({
            id: 'bld-' + Math.random().toString(36).substr(2, 9),
            name: rawName || 'Neue Siedlung',
            icon,
            x: bx,
            y: by,
            category,
            description: 'In dieser Region neu errichtete Struktur.',
            condition: 'intact',
            isDestroyed: false
          });
        }
        hasGridChanges = true;
      }

      // Building Destruction Tag: [[STATUS: Destroy_Festung]] or [[STATUS: Ruin_Dorf]]
      const destroyMatches = msgText.matchAll(/\[\[STATUS:\s*(?:Destroy|Ruin|Demolish)_([^\s\]]+)\s*\]\]/gi);
      for (const dMatch of destroyMatches) {
        const rawName = dMatch[1].replace(/_/g, ' ').trim().toLowerCase();
        updatedPlacedObjects = updatedPlacedObjects.map(obj => {
          if (obj.name.toLowerCase().includes(rawName) || rawName.includes(obj.name.toLowerCase())) {
            hasGridChanges = true;
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const tx = Math.min(maxX, Math.max(0, obj.x + dx));
                const ty = Math.min(maxY, Math.max(0, obj.y + dy));
                nextTiles[`${tx},${ty}`] = 'ash';
              }
            }
            return {
              ...obj,
              condition: 'ruined',
              isDestroyed: true
            };
          }
          return obj;
        });
      }

      // Building Repair Tag: [[STATUS: Repair_Festung]] or [[STATUS: Rebuild_Dorf]]
      const repairMatches = msgText.matchAll(/\[\[STATUS:\s*(?:Repair|Rebuild|Fix)_([^\s\]]+)\s*\]\]/gi);
      for (const rMatch of repairMatches) {
        const rawName = rMatch[1].replace(/_/g, ' ').trim().toLowerCase();
        updatedPlacedObjects = updatedPlacedObjects.map(obj => {
          if (obj.name.toLowerCase().includes(rawName) || rawName.includes(obj.name.toLowerCase())) {
            hasGridChanges = true;
            return {
              ...obj,
              condition: 'intact',
              isDestroyed: false
            };
          }
          return obj;
        });
      }

      // Narrative Auto-Detection for Construction, Destruction, and Reconstruction
      const buildNarrative = lowerText.includes('baut ein dorf') || lowerText.includes('errichtet eine festung') || lowerText.includes('baut ein haus') || lowerText.includes('errichtet einen turm') || lowerText.includes('gründet eine siedlung') || lowerText.includes('baut eine schmiede') || lowerText.includes('errichtet ein lager') || lowerText.includes('baut ein lagerfeuer') || lowerText.includes('baut eine brücke');
      if (buildNarrative && !msgText.includes('[[STATUS: Build_')) {
        const pCurrent = updatedPositions[playerName] || { x: 10, y: 15 };
        const bx = Math.min(maxX - 1, Math.max(1, pCurrent.x + 2));
        const by = Math.min(maxY - 1, Math.max(1, pCurrent.y + 1));

        let bName = 'Neues Dorf';
        let bIcon = '🏘️';
        if (lowerText.includes('festung') || lowerText.includes('burg')) { bName = 'Holzfestung'; bIcon = '🏰'; }
        else if (lowerText.includes('haus') || lowerText.includes('hütte')) { bName = 'Wohnhaus'; bIcon = '🏠'; }
        else if (lowerText.includes('turm') || lowerText.includes('außenposten')) { bName = 'Wachturm'; bIcon = '🗼'; }
        else if (lowerText.includes('schmiede')) { bName = 'Dorfschmiede'; bIcon = '⚒️'; }
        else if (lowerText.includes('lager')) { bName = 'Feldlager'; bIcon = '⛺'; }

        const exists = updatedPlacedObjects.some(o => Math.abs(o.x - bx) <= 1 && Math.abs(o.y - by) <= 1 && o.name === bName);
        if (!exists) {
          updatedPlacedObjects.push({
            id: 'bld-' + Math.random().toString(36).substr(2, 9),
            name: bName,
            icon: bIcon,
            x: bx,
            y: by,
            category: 'Dorf & Siedlung',
            description: 'Von den Helden in dieser Region neu errichtetes Bauwerk.',
            condition: 'intact',
            isDestroyed: false
          });
          hasGridChanges = true;
        }
      }

      const destroyNarrative = lowerText.includes('stürzt ein') || lowerText.includes('wird zerstört') || lowerText.includes('brennt nieder') || lowerText.includes('in schutt und asche') || lowerText.includes('zerstören das dorf') || lowerText.includes('festung brennt') || lowerText.includes('haus stürzt ein') || lowerText.includes('siedlung ruiniert');
      if (destroyNarrative && !msgText.includes('[[STATUS: Destroy_')) {
        updatedPlacedObjects = updatedPlacedObjects.map(obj => {
          const isBuilding = obj.category?.includes('Gebäude') || obj.category?.includes('Siedlung') || obj.category?.includes('Dorf') || ['festung', 'haus', 'hütte', 'turm', 'dorf', 'siedlung', 'burg', 'schmiede'].some(k => obj.name.toLowerCase().includes(k));
          if (isBuilding && !obj.isDestroyed) {
            hasGridChanges = true;
            for (let dx = -1; dx <= 1; dx++) {
              for (let dy = -1; dy <= 1; dy++) {
                const tx = Math.min(maxX, Math.max(0, obj.x + dx));
                const ty = Math.min(maxY, Math.max(0, obj.y + dy));
                nextTiles[`${tx},${ty}`] = 'ash';
              }
            }
            return { ...obj, condition: 'ruined', isDestroyed: true };
          }
          return obj;
        });
      }

      const repairNarrative = lowerText.includes('wieder aufgebaut') || lowerText.includes('wiederhergestellt') || lowerText.includes('repariert') || lowerText.includes('restauriert') || lowerText.includes('baut das dorf wieder auf') || lowerText.includes('baut die festung wieder auf');
      if (repairNarrative && !msgText.includes('[[STATUS: Repair_')) {
        updatedPlacedObjects = updatedPlacedObjects.map(obj => {
          if (obj.isDestroyed || obj.condition === 'ruined') {
            hasGridChanges = true;
            return { ...obj, condition: 'intact', isDestroyed: false };
          }
          return obj;
        });
      }

      const posMatches = msgText.matchAll(/\[\[STATUS:\s*(?:Position|Pos|Move)_([^\s=]+)\s*=\s*(\d+)\s*,\s*(\d+)\s*\]\]/gi);
      for (const match of posMatches) {
        const rawTargetName = match[1].replace(/_/g, ' ').trim();
        const tx = Math.min(maxX, Math.max(0, parseInt(match[2])));
        const ty = Math.min(maxY, Math.max(0, parseInt(match[3])));

        let matchedCharKey = Object.keys(updatedPositions).find(k => k.toLowerCase() === rawTargetName.toLowerCase());
        if (!matchedCharKey && rawTargetName.toLowerCase() === 'spieler') {
          matchedCharKey = playerName;
        }

        if (matchedCharKey) {
          updatedPositions[matchedCharKey] = { x: tx, y: ty };
          movedEntities.add(matchedCharKey);
          hasGridChanges = true;
        } else {
          const objIdx = updatedPlacedObjects.findIndex(o => o.name.toLowerCase() === rawTargetName.toLowerCase() || o.id === rawTargetName);
          if (objIdx >= 0) {
            const targetObj = updatedPlacedObjects[objIdx];
            if (isBuildingObject(targetObj)) {
              console.log(`Bewegung verboten: Gebäude/Bauwerk ${targetObj.name} darf nicht weggesetzt werden.`);
            } else {
              updatedPlacedObjects[objIdx] = { ...targetObj, x: tx, y: ty };
              movedObjects.add(targetObj.id);
              hasGridChanges = true;
            }
          }
        }
      }

      // B) Movement direction helpers based on narrative text
      let headingDx = 0;
      let headingDy = 0;
      if (lowerText.includes('nach rechts') || lowerText.includes('osten') || lowerText.includes('vorwärts') || lowerText.includes('segeln') || lowerText.includes('seget') || lowerText.includes('fahren') || lowerText.includes('reiten') || lowerText.includes('marsch')) {
        headingDx = 1;
      } else if (lowerText.includes('nach links') || lowerText.includes('westen') || lowerText.includes('zurück') || lowerText.includes('rückzug')) {
        headingDx = -1;
      }
      if (lowerText.includes('nach oben') || lowerText.includes('norden') || lowerText.includes('klettern')) {
        headingDy = -1;
      } else if (lowerText.includes('nach unten') || lowerText.includes('süden') || lowerText.includes('abstieg')) {
        headingDy = 1;
      }
      if (headingDx === 0 && headingDy === 0) {
        headingDx = 1; // Default forward progression
      }

      // C) Transport Vehicles & Placed Objects Movement (Schiffe, Boote, Kutschen, Wagen, Reittiere, etc.)
      const isTransport = (o: PlacedCombatObject) => {
        const cat = (o.category || '').toLowerCase();
        const n = o.name.toLowerCase();
        const d = (o.description || '').toLowerCase();
        return (
          cat.includes('schiff') || cat.includes('fahrzeug') || cat.includes('reittier') ||
          ['schiff', 'boot', 'kutsche', 'wagen', 'pferd', 'reittier', 'drache', 'fahrzeug', 'auto', 'panzer', 'luftschiff', 'floss', 'yacht', 'kanu', 'galleone', 'heißluftballon', 'drachen', 'kutschen', 'reitpferd', 'kameltier', 'besen', 'transport'].some(k => n.includes(k) || d.includes(k))
        );
      };

      updatedPlacedObjects = updatedPlacedObjects.map(obj => {
        if (isTransport(obj) && !movedObjects.has(obj.id)) {
          const moveStepX = headingDx;
          const moveStepY = headingDy;
          const newX = Math.min(maxX, Math.max(0, obj.x + moveStepX));
          const newY = Math.min(maxY, Math.max(0, obj.y + moveStepY));

          if (newX !== obj.x || newY !== obj.y) {
            hasGridChanges = true;
            // Also move characters if they are standing on or right beside the transport vehicle (passenger tracking)
            Object.keys(updatedPositions).forEach(charKey => {
              const charPos = updatedPositions[charKey];
              if (charPos && Math.abs(charPos.x - obj.x) <= 2 && Math.abs(charPos.y - obj.y) <= 2 && !movedEntities.has(charKey)) {
                updatedPositions[charKey] = {
                  x: Math.min(maxX, Math.max(0, charPos.x + moveStepX)),
                  y: Math.min(maxY, Math.max(0, charPos.y + moveStepY))
                };
                movedEntities.add(charKey);
              }
            });
            return { ...obj, x: newX, y: newY };
          }
        }
        return obj;
      });

      // D) Tactical Movement & Command Execution Engine
      let currentCombat: CombatState = {
        ...combatState,
        positions: updatedPositions,
        placedObjects: updatedPlacedObjects,
        tiles: nextTiles,
        fireTurnCount: updatedFireTurn,
        weather: updatedWeather,
        timeOfDay: updatedTimeOfDay
      };

      // 1. Process structured TacticalCommands from chat / AI
      const parsedTacticalCmds = parseTacticalCommandsFromText(msgText, currentCombat);
      if (parsedTacticalCmds.length > 0) {
        for (const cmd of parsedTacticalCmds) {
          const cmdResult = executeTacticalCommand(currentCombat, cmd);
          if (cmdResult.success) {
            currentCombat = cmdResult.updatedCombatState;
            updatedPositions = { ...(currentCombat.positions || updatedPositions) };
            hasGridChanges = true;
          }
        }
      }

      // Tactical movement happens strictly and exclusively through the Movement Engine.
      // Legacy character auto-movement toward opponents has been disabled to prevent conflicting state updates.

      // Save updated positions and placed objects back to adventure state
      if (hasGridChanges || needsPosUpdate) {
        const nextPlayerPos = updatedPositions[playerName] || { x: 10, y: 15 };
        const prevPlayerPos = initializedPositions[playerName] || { x: 10, y: 15 };
        const playerMoved = nextPlayerPos.x !== prevPlayerPos.x || nextPlayerPos.y !== prevPlayerPos.y;
        const syncResult: any = playerMoved ? syncPlayerLocation(nextPlayerPos.x, nextPlayerPos.y, adventure) : {};
        if (playerMoved && syncResult.player?.appearance?.currentLocation) {
          lastProcessedLocationRef.current = syncResult.player.appearance.currentLocation;
        }

        onUpdateAdventure({
          ...adventure,
          ...syncResult,
          combatState: {
            ...currentCombat,
            positions: updatedPositions,
            placedObjects: updatedPlacedObjects,
            tiles: nextTiles,
            fireTurnCount: updatedFireTurn,
            weather: updatedWeather,
            timeOfDay: updatedTimeOfDay
          }
        });
      }

      prevMsgCountRef.current = messages.length;
    }
  }, [messages, tiles, initializedPositions, fireTurnCount, opponents, playerName, companions, adventure, combatState, onUpdateAdventure, needsPosUpdate]);

  // Handle immediate coordinates changes on first load if default setup occurred
  useEffect(() => {
    if (needsPosUpdate) {
      const playerPos = initializedPositions[playerName] || { x: 10, y: 15 };
      const syncResult: any = syncPlayerLocation(playerPos.x, playerPos.y, adventure);
      if (syncResult.player?.appearance?.currentLocation) {
        lastProcessedLocationRef.current = syncResult.player.appearance.currentLocation;
      }
      onUpdateAdventure({
        ...adventure,
        ...syncResult,
        combatState: {
          ...combatState,
          positions: initializedPositions
        }
      });
    }
  }, []);



  // Update zoom level state
  const handleZoomChange = (level: 'macro' | 'meso' | 'micro') => {
    onUpdateAdventure({
      ...adventure,
      combatState: {
        ...combatState,
        combatZoomLevel: level
      }
    });
  };

  // Move token or place asset on micro-grid cell click
  const handleCellClick = (x: number, y: number) => {
    if (activePlacingAsset) {
      const currentPlaced = combatState.placedObjects || [];
      
      // Check if there is already an object or token here so the user can easily manage
      const newObject: PlacedCombatObject = {
        id: `placed-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: activePlacingAsset.name,
        icon: activePlacingAsset.icon,
        category: activePlacingAsset.category,
        description: activePlacingAsset.description,
        rules: activePlacingAsset.rules,
        setting: activePlacingAsset.setting,
        x,
        y
      };

      const updatedObjects = [...currentPlaced, newObject];

      onUpdateAdventure({
        ...adventure,
        combatState: {
          ...combatState,
          placedObjects: updatedObjects
        }
      });

      if (!keepPlacingMode) {
        setActivePlacingAsset(null);
      }
      return;
    }

    if (isGroupMoveMode && activeTacticalGroup) {
      const moveRes = executeTacticalCommand(combatState, {
        id: `cmd_user_group_${Date.now()}`,
        type: 'move_group',
        groupId: activeTacticalGroup.id,
        targetPosition: { x, y },
        formation: activeTacticalGroup.formation,
        source: 'player',
        status: 'pending'
      });

      if (moveRes.success) {
        onUpdateAdventure({
          ...adventure,
          combatState: moveRes.updatedCombatState
        });
        setIsGroupMoveMode(false);
      }
      return;
    }

    if (selectedToken) {
      if (tacticalEntities[selectedToken]) {
        const moveRes = executeTacticalCommand(combatState, {
          id: `cmd_user_ent_${Date.now()}`,
          type: 'move_entity',
          entityId: selectedToken,
          targetPosition: { x, y },
          source: 'player',
          status: 'pending'
        });

        if (moveRes.success) {
          onUpdateAdventure({
            ...adventure,
            combatState: moveRes.updatedCombatState
          });
          setSelectedToken(null);
          return;
        }
      }

      const updated = {
        ...initializedPositions,
        [selectedToken]: { x, y }
      };

      const isPlayer = selectedToken === playerName;
      const syncResult: any = isPlayer ? syncPlayerLocation(x, y, adventure) : {};
      if (isPlayer && syncResult.player?.appearance?.currentLocation) {
        lastProcessedLocationRef.current = syncResult.player.appearance.currentLocation;
      }

      onUpdateAdventure({
        ...adventure,
        ...syncResult,
        combatState: {
          ...combatState,
          positions: updated
        }
      });

      setSelectedToken(null);
    }
  };

  // Move nodes in regional/world map mode
  const handleRegionalNodeClick = (node: LoreNode) => {
    // When clicking a node in Meso or Macro, make it the player's primary location
    const updatedLore = loreDatabase.map(l => {
      if (l.category === 'Orte') {
        return {
          ...l,
          details: {
            ...l.details,
            isActiveTarget: l.id === node.id
          }
        };
      }
      return l;
    });

    const nodeCoords = node.details?.coordinates || { x: 50, y: 50 };
    const microX = Math.min(maxX, Math.max(0, Math.floor(nodeCoords.x * gridWidth / 100)));
    const microY = Math.min(maxY, Math.max(0, Math.floor(nodeCoords.y * gridHeight / 100)));
    const newLocationStr = `${node.title} (X:${microX}, Y:${microY})`;

    // Update player character's current location in lore database too
    const pName = adventure.player?.name;
    if (pName) {
      const pIdx = updatedLore.findIndex(entry => entry.category === 'Charaktere' && entry.title === pName);
      if (pIdx > -1) {
        updatedLore[pIdx] = {
          ...updatedLore[pIdx],
          details: {
            ...(updatedLore[pIdx].details || {}),
            currentLocation: newLocationStr
          }
        };
      }
    }

    // Update player's appearance currentLocation
    const updatedPlayer = {
      ...adventure.player,
      appearance: {
        ...(adventure.player?.appearance || {}),
        currentLocation: newLocationStr
      }
    };

    // Update location in statusElements
    let updatedStatus = adventure.statusElements ? [...adventure.statusElements] : [];
    const locIdx = updatedStatus.findIndex(item => (item.label || '').toLowerCase().includes('standort') || (item.label || '').toLowerCase().includes('ort'));
    if (locIdx > -1) {
      updatedStatus[locIdx] = { ...updatedStatus[locIdx], value: newLocationStr };
    } else {
      updatedStatus.push({ id: 'def-loc', label: 'Standort', value: newLocationStr });
    }

    // Update token positions in combatState
    const currentPositions = combatState.positions || {};
    const updatedPositions = {
      ...currentPositions,
      [playerName]: { x: microX, y: microY }
    };

    // Sync to prevent double loop triggers
    lastProcessedLocationRef.current = newLocationStr;

    onUpdateAdventure({
      ...adventure,
      player: updatedPlayer,
      loreDatabase: updatedLore,
      statusElements: updatedStatus,
      initialStatusElements: adventure.initialStatusElements && adventure.initialStatusElements.length > 0 ? adventure.initialStatusElements : updatedStatus,
      combatState: {
        ...combatState,
        positions: updatedPositions,
        combatZoomLevel: 'micro' // Auto zoom in to local tactical grid!
      }
    });
  };

  return (
    <div id="tactical-combat-map" className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Background ambient color */}
      <div className={`absolute inset-0 transition-all duration-700 pointer-events-none ${biome.ambientColor} blur-3xl opacity-30`}></div>

      {/* Header with zoom level info */}
      <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>
          <h3 className="text-[10px] font-extrabold text-slate-100 uppercase tracking-wider truncate">TACTICAL RADAR</h3>
        </div>

        {/* Map Level / Zoom Selector */}
        <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 shrink-0 z-20">
          {(['micro', 'meso', 'macro'] as const).map((level) => (
            <button
              key={level}
              onClick={() => handleZoomChange(level)}
              className={`px-2 py-1 text-[8px] font-extrabold uppercase rounded-md transition-all duration-200 ${
                zoomLevel === level
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {level === 'micro' ? 'Raster' : level === 'meso' ? 'Region' : 'Welt'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowLocationDetailModal(true)}
          className="text-[9px] font-extrabold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider select-none shrink-0 truncate max-w-[150px] text-right flex items-center justify-end gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
          title={`Standort: ${displayLocationName}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
          <span className="truncate">{displayLocationName}</span>
        </button>
      </div>

      {/* RENDER BODY BASED ON ZOOM LEVEL */}
      <div className="flex-1 overflow-hidden relative flex flex-col items-center justify-center min-h-[220px]">
        {zoomLevel === 'micro' ? (
          /* MICRO GRID: 10x10 WORLD MAP PROCEDURAL GRID WITH CHARACTERS AND PLACED OBJECTS */
          <div className="absolute inset-0 bg-slate-950 flex flex-col overflow-hidden select-none">
            {/* Soft ambient gradient overlay to blend map edges nicely */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-slate-950/30 pointer-events-none z-20"></div>

            {/* PROMINENT STANDORT RADAR HUD BANNER */}
            <div className="absolute top-2 left-2 z-30 bg-slate-950/90 border border-amber-500/40 rounded-xl px-2.5 py-1 flex items-center gap-2 backdrop-blur-md shadow-2xl">
              <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                <i className="fa-solid fa-location-crosshairs text-[10px] animate-spin" style={{ animationDuration: '6s' }}></i>
                <span className="absolute -inset-1 rounded-full border border-amber-400/50 animate-ping pointer-events-none"></span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[7px] font-black text-amber-400 uppercase tracking-widest leading-none">
                    AKTUELLES RASTER
                  </span>
                  <span className="bg-amber-500/20 text-amber-300 font-mono text-[7.5px] font-extrabold px-1 py-0.2 rounded border border-amber-500/30">
                    X:{(initializedPositions[playerName] || { x: 10, y: 15 }).x}, Y:{(initializedPositions[playerName] || { x: 10, y: 15 }).y}
                  </span>
                </div>
                <span className="font-extrabold text-slate-100 text-[9.5px] leading-tight truncate max-w-[140px] sm:max-w-[200px]">
                  {displayLocationName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationDetailModal(true)}
                className="ml-0.5 px-1.5 py-0.5 bg-amber-500 text-slate-950 hover:bg-amber-400 font-black rounded-md text-[8px] uppercase tracking-wider flex items-center gap-1 shadow transition-all cursor-pointer shrink-0"
                title="Standort-Details & Vor-Ort-Analyse öffnen"
              >
                <i className="fa-solid fa-circle-info"></i>
                <span>Info</span>
              </button>
            </div>

            {/* TACTICAL FORMATION HUD BAR */}
            <div className="absolute top-2 right-2 z-30 bg-slate-950/90 border border-slate-700/80 rounded-xl px-2 py-1.5 flex items-center gap-2 backdrop-blur-md shadow-2xl max-w-[92vw] overflow-x-auto select-none">
              {allTacticalGroups.length > 0 ? (
                <>
                  {/* Active Group Selector / Badge */}
                  {allTacticalGroups.length > 1 ? (
                    <select
                      value={activeTacticalGroup?.id || ''}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-amber-300 font-bold text-[9px] rounded-lg px-2 py-1 outline-none cursor-pointer"
                    >
                      {allTacticalGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.unitIds.length})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-bold">
                      <span>{activeTacticalGroup?.name}</span>
                      <span className="font-mono text-[8px] opacity-80">({activeTacticalGroup?.unitIds.length})</span>
                    </div>
                  )}

                  {/* Formation Selector Dropdown */}
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Formation:</span>
                    <select
                      value={activeTacticalGroup?.formation || 'loose'}
                      onChange={(e) => handleTacticalFormationSelect(e.target.value as TacticalFormation)}
                      className="bg-slate-900 border border-amber-500/50 text-amber-200 font-bold text-[9px] rounded-lg px-2 py-1 outline-none cursor-pointer"
                    >
                      {TACTICAL_FORMATIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Direction Selector Dropdown */}
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Richtung:</span>
                    <select
                      value={activeTacticalGroup?.direction || 'south'}
                      onChange={(e) => handleTacticalDirectionSelect(e.target.value as TacticalDirection)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 font-bold text-[9px] rounded-lg px-1.5 py-1 outline-none cursor-pointer"
                    >
                      {TACTICAL_DIRECTIONS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Move Group Button */}
                  {activeTacticalGroup && (
                    <button
                      type="button"
                      onClick={() => setIsGroupMoveMode(prev => !prev)}
                      className={`px-2 py-1 text-[8.5px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap border ${
                        isGroupMoveMode
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                      }`}
                      title="Gruppe auf ein beliebiges Zielfeld im Raster bewegen"
                    >
                      {isGroupMoveMode ? 'Zielfeld wählen...' : 'Marschieren'}
                    </button>
                  )}

                  {/* Split Button if >= 10 units */}
                  {activeTacticalGroup && activeTacticalGroup.unitIds.length >= 10 && (
                    <button
                      type="button"
                      onClick={() => handleTacticalSplit(Math.min(20, Math.floor(activeTacticalGroup.unitIds.length / 2)))}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[8.5px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
                      title="Spaltet Einheiten ab, um eine Flanke zu bilden"
                    >
                      Aufteilen
                    </button>
                  )}
                </>
              ) : (
                /* Quick test spawn horde button */
                <button
                  type="button"
                  onClick={handleQuickSpawnGoblins}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 text-[9px] font-black rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm"
                  title="Spawnt eine Test-Horde mit 50 Einheiten im Raster"
                >
                  50 Goblins aufstellen
                </button>
              )}
            </div>

            {/* Time of Day Overlay */}
            {combatState.timeOfDay && combatState.timeOfDay !== 'day' && (
              <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${
                combatState.timeOfDay === 'morning' ? 'bg-orange-500/10 mix-blend-color-burn' :
                combatState.timeOfDay === 'evening' ? 'bg-rose-700/20 mix-blend-multiply' :
                combatState.timeOfDay === 'night' ? 'bg-indigo-950/40 mix-blend-overlay' : ''
              }`}>
                {combatState.timeOfDay === 'morning' && <div className="absolute inset-0 bg-gradient-to-tr from-amber-200/10 via-transparent to-transparent pointer-events-none mix-blend-overlay"></div>}
                {combatState.timeOfDay === 'evening' && <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/15 via-transparent to-indigo-900/10 pointer-events-none mix-blend-overlay"></div>}
                {combatState.timeOfDay === 'night' && <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-indigo-950/20 to-transparent pointer-events-none mix-blend-multiply"></div>}
                {combatState.timeOfDay === 'morning' && <div className="absolute top-4 left-4 text-amber-300 text-xs font-bold drop-shadow-md flex items-center gap-2"><i className="fa-solid fa-sun animate-pulse"></i> Morgen</div>}
                {combatState.timeOfDay === 'evening' && <div className="absolute top-4 left-4 text-rose-300 text-xs font-bold drop-shadow-md flex items-center gap-2"><i className="fa-solid fa-moon opacity-80"></i> Abenddämmerung</div>}
                {combatState.timeOfDay === 'night' && <div className="absolute top-4 left-4 text-indigo-300 text-xs font-bold drop-shadow-md flex items-center gap-2"><i className="fa-solid fa-moon"></i> Nacht</div>}
              </div>
            )}

            {/* Dynamic Weather Overlay */}
            {combatState.weather && (
              <div className={`absolute inset-0 z-40 pointer-events-none transition-opacity duration-1000 flex items-center justify-center overflow-hidden ${
                combatState.weather === 'sturm' ? 'bg-slate-950/50 mix-blend-hard-light opacity-100' :
                combatState.weather === 'regen' ? 'bg-sky-900/20 mix-blend-overlay opacity-80' :
                combatState.weather === 'schnee' ? 'bg-white/10 mix-blend-screen opacity-90' :
                combatState.weather === 'nebel' ? 'bg-slate-400/20 backdrop-blur-[2px] mix-blend-screen opacity-100' : ''
              }`}>
                {combatState.weather === 'sturm' && (
                  <>
                    <div className="absolute inset-0 bg-white/5 mix-blend-overlay animate-[ping_4s_ease-in-out_infinite]"></div>
                    <div className="absolute w-full h-[200%] bg-[linear-gradient(rgba(255,255,255,0)_0%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0)_100%)] bg-[length:2px_50px] opacity-30 origin-top -skew-x-12 translate-y-[-50%] animate-[bounce_0.2s_linear_infinite]"></div>
                    <div className="absolute top-4 right-4 text-slate-300 text-xs font-bold drop-shadow-md flex items-center gap-2"><i className="fa-solid fa-bolt text-yellow-400 animate-pulse"></i> Sturm</div>
                  </>
                )}
                {combatState.weather === 'regen' && (
                  <>
                    <div className="absolute w-full h-[200%] bg-[linear-gradient(rgba(255,255,255,0)_0%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0)_100%)] bg-[length:2px_40px] opacity-20 origin-top -skew-x-6 translate-y-[-50%] animate-[bounce_0.3s_linear_infinite]"></div>
                    <div className="absolute top-4 right-4 text-sky-200 text-xs font-bold drop-shadow-md flex items-center gap-2"><i className="fa-solid fa-cloud-rain animate-pulse"></i> Regen</div>
                  </>
                )}
                {combatState.weather === 'schnee' && (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white_1.5px,transparent_2px)] bg-[length:16px_16px] opacity-40 animate-[ping_6s_linear_infinite]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white_1px,transparent_1.5px)] bg-[length:24px_24px] opacity-20 animate-[ping_4s_linear_infinite_reverse]"></div>
                    <div className="absolute top-4 right-4 text-white text-xs font-bold drop-shadow-md flex items-center gap-2"><i className="fa-solid fa-snowflake animate-[spin_4s_linear_infinite]"></i> Schneefall</div>
                  </>
                )}
                {combatState.weather === 'nebel' && (
                  <div className="absolute top-4 right-4 text-slate-200 text-xs font-bold drop-shadow-md flex items-center gap-2"><i className="fa-solid fa-smog animate-pulse"></i> Dichter Nebel</div>
                )}
              </div>
            )}

            {fireTurnCount > 0 && (
              <div className="absolute top-2 right-2 text-[10px] font-bold text-slate-400 z-30">
                <span className="text-red-400 animate-pulse flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-full border border-slate-800">
                  <i className="fa-solid fa-flame"></i> Stufe {fireTurnCount}
                </span>
              </div>
            )}

            {/* Grid Container */}
            <div 
              style={{
                gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${gridHeight}, minmax(0, 1fr))`
              }}
              className="flex-1 w-full h-full grid gap-[0.5px] relative overflow-hidden bg-slate-950 z-10"
            >
              
              {/* Render background tiles */}
              {miniMapTiles.map((tile, idx) => {
                const x = tile.col;
                const y = tile.row;
                const coordKey = `${x},${y}`;
                const customTileType = tiles[coordKey];
                const isHighlighted = selectedToken !== null;
                
                const adaptiveStyle = getSettingTileStyle(tile.terrainId, selectedSetting);

                let cellBgClass = '';
                let cellOverlayStyle: React.CSSProperties = {};

                const customStyle = customTileType ? getCustomTerrainStyle(customTileType) : null;

                if (customStyle) {
                  cellOverlayStyle = {
                    backgroundColor: customStyle.color,
                    borderColor: customStyle.border + '50'
                  };
                } else if (!customTileType) {
                  cellOverlayStyle = {
                    backgroundColor: adaptiveStyle.color,
                    borderColor: adaptiveStyle.border + '50'
                  };
                }

                const playerPos = initializedPositions[playerName] || { x: 10, y: 15 };
                const isPlayerLocationCell = x === playerPos.x && y === playerPos.y;

                return (
                  <div
                    key={`cell-${coordKey}-${idx}`}
                    onClick={() => handleCellClick(x, y)}
                    className={`relative flex items-center justify-center aspect-square border-[1.5px] transition-all duration-200 cursor-pointer border-t-white/15 border-l-white/15 border-b-black/40 border-r-black/40 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.08),_inset_-1px_-1px_1px_rgba(0,0,0,0.35)] ${
                      isPlayerLocationCell
                        ? 'ring-2 ring-amber-400/90 z-20'
                        : customTileType === 'fire' 
                        ? 'bg-red-950/85 border-red-500/50 text-red-400' 
                        : customTileType === 'ice'
                        ? 'bg-sky-950/70 border-sky-400/40 text-sky-300'
                        : customTileType === 'magma'
                        ? 'bg-amber-950/90 border-amber-600/50 text-amber-500'
                        : customTileType === 'steam'
                        ? 'bg-slate-800/80 border-slate-500/40 text-slate-200'
                        : customTileType === 'ash' || customTileType === 'verbrannt' || customTileType === 'asche'
                        ? 'bg-zinc-950/90 border-zinc-700/60 text-zinc-500'
                        : customTileType === 'obsidian'
                        ? 'bg-purple-950/90 border-purple-800/60 text-purple-400'
                        : 'hover:bg-white/10'
                    } ${isHighlighted ? 'hover:border-amber-400/80 hover:bg-white/5' : ''}`}
                    style={cellOverlayStyle}
                    title={isPlayerLocationCell ? `DEIN STANDORT: ${displayLocationName} (X:${x}, Y:${y})` : (customStyle ? customStyle.label : adaptiveStyle.label)}
                  >
                    {/* Background pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-black pointer-events-none"></div>

                    {/* Radar Location Beacon for Player Cell */}
                    {isPlayerLocationCell && (
                      <div className="absolute inset-0 border-2 border-amber-400 bg-amber-500/25 z-10 pointer-events-none flex items-center justify-center animate-pulse shadow-[inset_0_0_10px_rgba(245,158,11,0.8)]">
                        <div className="absolute inset-0 border border-amber-300 animate-ping opacity-75 rounded-sm"></div>
                        <span className="text-[9px] text-amber-300 drop-shadow-[0_0_4px_rgba(0,0,0,1)] font-extrabold z-10">⚡</span>
                      </div>
                    )}

                    {/* Custom visual status overlays for fire/ice/magma/steam/ash/obsidian */}
                    {customTileType === 'fire' ? (
                      <span className="absolute animate-pulse"><i className="fa-solid fa-fire text-red-500 text-[9px]"></i></span>
                    ) : customTileType === 'ice' ? (
                      <span className="absolute opacity-60"><i className="fa-solid fa-snowflake text-sky-300 text-[8px]"></i></span>
                    ) : customTileType === 'magma' ? (
                      <span className="absolute animate-pulse opacity-90"><i className="fa-solid fa-volcano text-amber-500 text-[9px]"></i></span>
                    ) : customTileType === 'steam' ? (
                      <span className="absolute animate-pulse opacity-50"><i className="fa-solid fa-cloud text-slate-300 text-[8px]"></i></span>
                    ) : customTileType === 'ash' || customTileType === 'verbrannt' || customTileType === 'asche' ? (
                      <span className="absolute opacity-40"><i className="fa-solid fa-skull text-zinc-600 text-[7px]"></i></span>
                    ) : customTileType === 'obsidian' ? (
                      <span className="absolute opacity-70"><i className="fa-solid fa-gem text-purple-400 text-[8px]"></i></span>
                    ) : null}
                  </div>
                );
              })}

              {/* DRAW CONNECTOR CLASH ANIMATION LINES */}
              <AnimatePresence>
                {activeClash && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                    <motion.line
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: activeClash.type === 'elemental-clash' ? 2 : 1, ease: 'easeInOut' }}
                      x1={`${(activeClash.from.x + 0.5) * (100 / gridWidth)}%`}
                      y1={`${(activeClash.from.y + 0.5) * (100 / gridHeight)}%`}
                      x2={`${(activeClash.to.x + 0.5) * (100 / gridWidth)}%`}
                      y2={`${(activeClash.to.y + 0.5) * (100 / gridHeight)}%`}
                      stroke={activeClash.type === 'elemental-clash' ? '#f59e0b' : '#ef4444'}
                      strokeWidth={activeClash.type === 'elemental-clash' ? '4' : '2'}
                      strokeDasharray={activeClash.type === 'elemental-clash' ? '6,3' : 'none'}
                    />
                    {/* Visual burst effect at destination */}
                    <motion.circle
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 2, 0], opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      cx={`${(activeClash.to.x + 0.5) * (100 / gridWidth)}%`}
                      cy={`${(activeClash.to.y + 0.5) * (100 / gridHeight)}%`}
                      r="12"
                      fill={activeClash.type === 'elemental-clash' ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)'}
                    />
                  </svg>
                )}
              </AnimatePresence>
              
              {/* RENDER PLACED MAP OBJECTS */}
              {(locationPlacedObjects || []).map((obj: PlacedCombatObject, oIdx: number) => {
                const isSelected = selectedPlacedObjectId === obj.id;
                const isSummonObj = obj.isSummon || obj.category === 'Beschwörung & Illusion';
                const isRuined = obj.isDestroyed || obj.condition === 'ruined';
                const isUnderConstruction = obj.condition === 'under_construction';

                return (
                  <motion.div
                    key={`placed-${obj.id || oIdx}-${oIdx}`}
                    style={{
                      left: `${obj.x * (100 / gridWidth)}%`,
                      top: `${obj.y * (100 / gridHeight)}%`,
                      width: `${100 / gridWidth}%`,
                      height: `${100 / gridHeight}%`
                    }}
                    className="absolute p-0.5 z-10 flex items-center justify-center"
                    layout
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlacedObjectId(isSelected ? null : obj.id);
                        setSelectedToken(null); // Deselect tokens when selecting map objects
                      }}
                      className={`w-full h-full rounded-md flex items-center justify-center text-sm cursor-pointer select-none relative group transition-all duration-300 border ${
                        isRuined
                          ? (isSelected
                              ? 'bg-red-950/90 border-red-500 ring-2 ring-red-500 scale-110 z-30 shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                              : 'bg-red-950/80 border-red-800/80 ring-1 ring-red-900/40 hover:scale-105 opacity-90 shadow-[0_0_8px_rgba(185,28,28,0.4)]')
                          : isUnderConstruction
                          ? (isSelected
                              ? 'bg-amber-950/90 border-amber-400 ring-2 ring-amber-500 scale-110 z-30 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                              : 'bg-amber-950/70 border-amber-700/60 ring-1 ring-amber-600/30 hover:scale-105')
                          : isSummonObj
                          ? (isSelected 
                              ? 'bg-indigo-950/90 border-amber-400 ring-2 ring-amber-500 scale-110 z-30 shadow-[0_0_12px_rgba(129,140,248,0.7)]' 
                              : 'bg-indigo-950/80 border-indigo-400/80 ring-1 ring-indigo-500/40 hover:scale-105 hover:bg-indigo-900 shadow-[0_0_8px_rgba(99,102,241,0.5)]')
                          : (isSelected 
                              ? 'scale-110 ring-2 ring-amber-500 z-30 border-amber-400 bg-amber-950/40' 
                              : 'bg-slate-850/90 border-slate-700/60 hover:scale-105 hover:bg-slate-800')
                      }`}
                    >
                      <span className="flex items-center justify-center w-full h-full text-lg p-0.5">
                        {isRuined ? '🏚️' : renderTokenIconElement(obj.icon, obj.name)}
                      </span>
                      
                      {/* Condition badges */}
                      {isRuined ? (
                        <span className="absolute -top-1 -right-1 bg-red-800 text-[6.5px] font-extrabold px-1 py-0.2 rounded-full text-red-100 shadow-sm border border-red-500 pointer-events-none">
                          Ruine
                        </span>
                      ) : isUnderConstruction ? (
                        <span className="absolute -top-1 -right-1 bg-amber-700 text-[6.5px] font-extrabold px-1 py-0.2 rounded-full text-amber-100 shadow-sm border border-amber-400 pointer-events-none">
                          Aufbau
                        </span>
                      ) : isSummonObj ? (
                        <span className="absolute -top-1 -right-1 bg-indigo-600 text-[7px] font-extrabold px-1 py-0.2 rounded-full text-white shadow-sm border border-indigo-300 pointer-events-none">
                          Klon
                        </span>
                      ) : null}

                      {/* Name tooltip hover display */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded text-[8.5px] font-bold shadow-lg pointer-events-none whitespace-nowrap border bg-slate-950 border-slate-700 text-slate-200 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all z-40 duration-200">
                        <div className={`font-extrabold ${isRuined ? 'text-red-400' : 'text-amber-400'}`}>
                          {obj.name} {isRuined ? '(Ruine)' : ''}
                        </div>
                        <div className="text-[7.5px] text-indigo-300 font-normal">{obj.category}</div>
                      </div>

                      {/* Selector indicator */}
                      {isSelected && (
                        <span className="absolute -inset-0.5 rounded-md animate-pulse border-2 border-amber-500 opacity-80"></span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* RENDER INDIVIDUAL TACTICAL SQUAD ENTITIES (FORMATIONS) */}
              {Object.values(tacticalEntities).map((entity) => {
                const group = entity.groupId ? tacticalGroups[entity.groupId] : null;
                const isSelected = selectedToken === entity.id;
                const pos = entity.position;
                if (!pos) return null;

                const isSelectedGroup = activeTacticalGroup?.id === entity.groupId;

                return (
                  <motion.div
                    key={`tactical-entity-${entity.id}`}
                    style={{
                      left: `${pos.x * (100 / gridWidth)}%`,
                      top: `${pos.y * (100 / gridHeight)}%`,
                      width: `${100 / gridWidth}%`,
                      height: `${100 / gridHeight}%`
                    }}
                    className="absolute p-0.5 z-20 flex items-center justify-center pointer-events-auto"
                    layout
                    transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedToken(isSelected ? null : entity.id);
                        if (entity.groupId) setSelectedGroupId(entity.groupId);
                      }}
                      className={`w-full h-full rounded-full flex items-center justify-center text-[9px] sm:text-[11px] font-bold border cursor-pointer select-none relative group transition-all duration-300 ${
                        isSelected 
                          ? 'scale-125 ring-4 ring-amber-500/50 z-30 border-amber-400 bg-red-600 shadow-[0_0_14px_rgba(245,158,11,0.9)]' 
                          : isSelectedGroup
                            ? 'ring-2 ring-red-400/40 bg-red-700/90 border-red-400 hover:scale-115'
                            : 'bg-red-800/80 border-red-500/80 hover:scale-110'
                      }`}
                    >
                      {getCharacterSprite(entity.displayName, 'enemy', selectedSetting)}

                      {/* Index badge */}
                      <span className="absolute -bottom-1 -right-1 bg-slate-950/90 text-amber-300 font-mono text-[6.5px] px-0.5 py-0.1 rounded border border-slate-700 pointer-events-none">
                        {entity.assignedSlotIndex !== undefined ? entity.assignedSlotIndex + 1 : ''}
                      </span>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded text-[8.5px] font-extrabold shadow-lg pointer-events-none whitespace-nowrap border scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all z-50 duration-200 bg-slate-950 text-red-200 border-red-800">
                        {entity.displayName} #{entity.assignedSlotIndex !== undefined ? entity.assignedSlotIndex + 1 : ''} {group ? `• ${group.name} [${group.formation || 'Locker'}]` : ''} ({pos.x}, {pos.y})
                      </div>

                      {isSelected && (
                        <span className="absolute -inset-0.5 rounded-full animate-ping border border-amber-500 opacity-70"></span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* RENDER TOKENS FOR CHARACTERS */}
              {Object.entries(initializedPositions).map(([name, pos]) => {
                const isPlayer = name === playerName;
                const isCompanion = companions.some(c => c.name === name);
                const isEnemy = opponents.some(o => o.name === name);
                const oppObj = isEnemy ? opponents.find(o => o.name === name) : null;
                const squadCount = oppObj?.count;
                const spawnSrc = oppObj?.spawnSource;
                const isSelected = selectedToken === name;

                if (!pos || (!isPlayer && !isCompanion && !isEnemy)) return null;

                // If this enemy squad already has individual tactical entities rendered, skip the redundant single token
                const hasTacticalRepresentation = Object.values(tacticalGroups).some(g => {
                  const gName = g.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
                  const nName = name.toLowerCase().replace(/[^a-z0-9]+/g, '');
                  return gName.includes(nName) || nName.includes(gName);
                });
                if (hasTacticalRepresentation && !isPlayer && !isCompanion) {
                  return null;
                }

                // Color themes for different token allegiances
                let tokenColor = 'bg-slate-900 border-slate-700 text-slate-300';
                let tokenLabelColor = 'bg-slate-950 text-slate-300';

                if (isPlayer) {
                  tokenColor = 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-amber-600 border-2 border-amber-300 text-white shadow-[0_0_16px_rgba(245,158,11,0.9)] ring-2 ring-amber-400/50';
                  tokenLabelColor = 'bg-indigo-950 border-amber-500/50 text-amber-200';
                } else if (isCompanion) {
                  tokenColor = 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]';
                  tokenLabelColor = 'bg-emerald-950 border-emerald-800 text-emerald-200';
                } else if (isEnemy) {
                  tokenColor = 'bg-red-600 border-red-400 text-white shadow-[0_0_12px_rgba(239,68,68,0.6)] ring-1 ring-red-500/30';
                  tokenLabelColor = 'bg-red-950 border-red-800 text-red-200';
                }

                return (
                  <motion.div
                    key={`token-${name}`}
                    style={{
                      left: `${pos.x * (100 / gridWidth)}%`,
                      top: `${pos.y * (100 / gridHeight)}%`,
                      width: `${100 / gridWidth}%`,
                      height: `${100 / gridHeight}%`
                    }}
                    className="absolute p-0.5 z-20 flex items-center justify-center"
                    layout
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedToken(isSelected ? null : name);
                      }}
                      className={`w-full h-full rounded-full flex items-center justify-center text-[10px] sm:text-[12px] font-bold border cursor-pointer select-none relative group transition-all duration-300 ${
                        isSelected ? 'scale-125 ring-4 ring-amber-500/40 z-30 border-amber-400' : 'hover:scale-110'
                      } ${tokenColor}`}
                    >
                      {getCharacterSprite(name, isPlayer ? 'player' : isCompanion ? 'companion' : 'enemy', selectedSetting)}
                      
                      {/* Squad count badge for mass units */}
                      {!!squadCount && squadCount > 1 && (
                        <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-extrabold font-mono text-[7.5px] px-1 py-0.2 rounded-full border border-amber-200 shadow-md pointer-events-none">
                          x{squadCount}
                        </span>
                      )}

                      {/* Name tooltip hover display */}
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 rounded text-[8.5px] font-extrabold shadow-lg pointer-events-none whitespace-nowrap border scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all z-40 duration-200 ${tokenLabelColor}`}>
                        {name} {squadCount ? `(${squadCount}x)` : ''} {spawnSrc ? `• ${spawnSrc}` : ''}
                      </div>

                      {/* Active indicator dot */}
                      {isSelected && (
                        <span className="absolute -inset-0.5 rounded-full animate-ping border border-amber-500 opacity-70"></span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

            </div>





            {/* INSPECT PLACED OBJECT PANEL */}
            {(() => {
              const selectedObj = (locationPlacedObjects || []).find((o: PlacedCombatObject) => o.id === selectedPlacedObjectId);
              if (!selectedObj) return null;
              return (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  className="absolute bottom-0 inset-x-0 bg-slate-900/95 border-t border-slate-800 z-40 p-2.5 rounded-t-2xl flex flex-col backdrop-blur-md shadow-2xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base shrink-0">{selectedObj.icon}</span>
                      <div className="min-w-0">
                        <h4 className="text-[10px] font-black text-slate-100 leading-tight truncate">{selectedObj.name}</h4>
                        <p className="text-[7.5px] font-bold text-amber-500 uppercase tracking-wider leading-none truncate">{selectedObj.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isBuildingObject(selectedObj) ? (
                        <span className="bg-slate-950/65 border border-slate-800 text-slate-400 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase transition-all select-none" title="Gebäude können auf diesem Gelände nicht weggesetzt oder entfernt werden">
                          Gebäude fixiert
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            const updated = (locationPlacedObjects || []).filter((o: PlacedCombatObject) => o.id !== selectedObj.id);
                            
                            let updatedAdv = {
                              ...adventure,
                              combatState: {
                                ...combatState,
                                placedObjects: updated
                              }
                            };

                            if (activeTerritory && updatedAdv.world?.territories) {
                              updatedAdv.world = {
                                ...updatedAdv.world,
                                territories: updatedAdv.world.territories.map((t: Territory) => {
                                  if (t.id === activeTerritory.id) {
                                    return {
                                      ...t,
                                      tileData: {
                                        ...(t.tileData || {}),
                                        placedObjects: updated
                                      }
                                    };
                                  }
                                  return t;
                                })
                              };
                            }

                            if (activeLocation && activeLocation.id !== 'player-loc-virtual' && updatedAdv.loreDatabase) {
                              updatedAdv.loreDatabase = updatedAdv.loreDatabase.map((l: LoreNode) => {
                                if (l.id === activeLocation.id) {
                                  return {
                                    ...l,
                                    details: {
                                      ...(l.details || {}),
                                      tileData: {
                                        ...((l.details as any)?.tileData || {}),
                                        placedObjects: updated
                                      }
                                    }
                                  };
                                }
                                return l;
                              });
                            }

                            onUpdateAdventure(updatedAdv);
                            setSelectedPlacedObjectId(null);
                          }}
                          className="bg-red-950/45 hover:bg-red-950/60 border border-red-900/50 text-red-300 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase transition-all cursor-pointer"
                          title="Vom Spielfeld entfernen"
                        >
                          Entfernen
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedPlacedObjectId(null)}
                        className="text-slate-400 hover:text-slate-200 p-0.5 text-xs cursor-pointer"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </div>

                  <p className="text-[8px] font-normal text-slate-300 leading-snug">{selectedObj.description}</p>
                  
                  {selectedObj.rules && (
                    <div className="mt-1.5 bg-slate-950/70 p-1.5 rounded text-[7.5px] text-amber-300 border border-slate-850/80 font-mono">
                      <span className="font-extrabold text-amber-500 uppercase text-[7px] block mb-0.5">Tactical Regeln:</span>
                      {selectedObj.rules}
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </div>
        ) : (
          /* REGIONAL MAP (MESO / MACRO LEVELS) CONNECTED TO LORE Orte DATABASE */
          <div className="absolute inset-0 bg-slate-950 flex flex-col overflow-hidden select-none">
            <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-400 z-30 flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-full border border-slate-800">
              <i className="fa-solid fa-network-wired text-amber-500"></i>
              <span>{zoomLevel === 'macro' ? 'Makro-Kontinentknoten' : 'Meso-Zonen & Orte'}</span>
            </div>

            {/* SVG Connector lines */}
            <div className="flex-1 w-full h-full relative bg-slate-950/60 overflow-hidden flex items-center justify-center">
              {/* RPG-Maker Procedural Terrain Background Grid for Mini-Map */}
              <div 
                style={{
                  gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridHeight}, minmax(0, 1fr))`
                }}
                className="absolute inset-0 grid pointer-events-none select-none overflow-hidden"
              >
                {miniMapTiles.map((tile, idx) => {
                  const iconClass = getTileIcon(tile.terrainId);
                  return (
                    <div 
                      key={`mini-bg-tile-${tile.col}-${tile.row}-${idx}`}
                      className="relative flex items-center justify-center border-[0.5px] border-slate-950/25 transition-all duration-500"
                      style={{
                        backgroundColor: getTileColor(tile.terrainId),
                      }}
                    >
                      {/* Subtle pattern overlay */}
                      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-black pointer-events-none"></div>
                      {iconClass && <i className={`${iconClass} text-[8px] opacity-15 text-slate-100/80`} />}
                    </div>
                  );
                })}
              </div>
              {/* Soft ambient gradient overlay to blend map edges nicely */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-slate-950/20 pointer-events-none"></div>

              {/* No connector lines needed since user only sees current location */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              </svg>

              {/* Render Location Nodes */}
              {(() => {
                const currentNodes = loreDatabase.map(l => {
                  if (l.category !== 'Orte') return l;
                  const details = l.details || {};
                  let mapLevel = details.mapLevel;
                  let coordinates = details.coordinates;
                  
                  if (!mapLevel) {
                    const combined = (l.title + ' ' + (l.details?.description || '')).toLowerCase();
                    if (/gilde|taverne|haus|höhle|shop|laden|markt|zimmer|poi|bar|herberge|schrein|ruine|tempel|palast|platz|arena|zuhause|kerker/i.test(combined)) {
                      mapLevel = 'micro';
                    } else if (/kontinent|welt|reich|königreich|ozean|meer|insel/i.test(combined)) {
                      mapLevel = 'macro';
                    } else {
                      mapLevel = 'meso';
                    }
                  }
                  
                  if (!coordinates || typeof coordinates.x !== 'number' || typeof coordinates.y !== 'number') {
                    let hash = 0;
                    for (let i = 0; i < l.title.length; i++) {
                      hash = l.title.charCodeAt(i) + ((hash << 5) - hash);
                    }
                    const x = Math.abs((hash * 13) % 70) + 15;
                    const y = Math.abs((hash * 37) % 70) + 15;
                    coordinates = { x, y };
                  }
                  
                  return {
                    ...l,
                    details: {
                      ...details,
                      mapLevel,
                      coordinates
                    }
                  };
                }).filter(l => {
                  if (l.category !== 'Orte') return false;
                  return l.details?.mapLevel === zoomLevel;
                });

                if (currentNodes.length === 0) {
                  const activeNode = loreDatabase.find(l => l.category === 'Orte' && l.details?.isActiveTarget);
                  return (
                    <div className="text-slate-500 text-[10px] text-center p-4 z-10 max-w-[240px]">
                      <i className="fa-solid fa-location-dot text-lg text-slate-500 mb-1.5 animate-pulse"></i>
                      <p className="font-bold mb-0.5 text-slate-300">Anderer Standort</p>
                      <p className="text-[9px] text-slate-400">
                        Dein aktueller Standort <span className="text-amber-500">"{activeNode?.title || 'Unbekannt'}"</span> liegt auf der <span className="font-bold uppercase text-amber-500">{activeNode?.details?.mapLevel || 'micro'}</span>-Ebene.
                      </p>
                    </div>
                  );
                }

                return currentNodes.map((node, nodeIdx) => {
                  const coords = node.details?.coordinates || { x: 50, y: 50 };
                  const isPlayerLocation = !!node.details?.isActiveTarget;

                  return (
                    <div
                      key={node.id ? `node-${node.id}-${nodeIdx}` : `node-${nodeIdx}`}
                      style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
                    >
                      {isPlayerLocation && (
                        <span className="absolute -inset-3.5 rounded-full animate-ping pointer-events-none opacity-40 bg-red-500 duration-1000"></span>
                      )}
                      
                      <button 
                        onClick={() => handleRegionalNodeClick(node)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-2 outline-none focus:ring-1 focus:ring-amber-500 ${
                          isPlayerLocation 
                            ? 'bg-red-600 border-white scale-125 shadow-[0_0_10px_rgba(239,68,68,0.5)] cursor-default' 
                            : 'bg-slate-900 border-slate-700 hover:scale-115 hover:border-amber-500 cursor-pointer'
                        }`}
                      >
                        {isPlayerLocation ? (
                          <span className="text-[8px]">📍</span>
                        ) : zoomLevel === 'macro' ? (
                          <i className="fa-solid fa-globe text-[8px] text-slate-300"></i>
                        ) : (
                          <i className="fa-solid fa-mountain text-[8px] text-slate-300"></i>
                        )}
                      </button>

                      <div className={`absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap px-1.5 py-0.5 rounded text-[8px] font-bold shadow-md pointer-events-none border transition-all ${
                        isPlayerLocation 
                          ? 'bg-red-950 border-red-700 text-red-200 opacity-100 scale-105' 
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}>
                        {node.title}
                        {isPlayerLocation && <span className="ml-1 text-[7px]">Hier</span>}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-center text-slate-400 font-semibold bg-slate-950/85 py-1 px-2.5 rounded-full border border-slate-800/80 z-30 shadow-lg whitespace-nowrap">
              📍 Aktueller Standort (Synchronisiert mit Weltkarte & Codex)
            </div>
          </div>
        )}
      </div>

      {/* STANDORT RADAR DETAIL MODAL */}
      {showLocationDetailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowLocationDetailModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white text-lg w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
                <i className="fa-solid fa-location-crosshairs animate-pulse"></i>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Tactical Radar Standort-Analyse</h3>
                <p className="text-sm font-extrabold text-white leading-tight truncate">{displayLocationName}</p>
                {playerCurrentLocation && playerCurrentLocation !== displayLocationName && (
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{playerCurrentLocation}</p>
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Raster-Koordinaten</span>
                  <span className="font-mono text-amber-300 font-extrabold text-sm">
                    X: {(initializedPositions[playerName] || { x: 10, y: 15 }).x}, Y: {(initializedPositions[playerName] || { x: 10, y: 15 }).y}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Kachel-Bodentyp</span>
                  <span className="font-bold text-slate-200 text-xs">
                    {(() => {
                      const pPos = initializedPositions[playerName] || { x: 10, y: 15 };
                      const tileType = tiles[`${pPos.x},${pPos.y}`];
                      if (tileType) {
                        const customStyle = getCustomTerrainStyle(tileType);
                        return customStyle ? customStyle.label : tileType;
                      }
                      const tile = miniMapTiles.find(t => t.col === pPos.x && t.row === pPos.y);
                      if (tile) {
                        const style = getSettingTileStyle(tile.terrainId, selectedSetting);
                        if (style) return style.label;
                      }
                      return 'Standard-Gelände';
                    })()}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Tageszeit</span>
                  <span className="font-bold text-slate-200 text-xs uppercase">{combatState.timeOfDay || 'Tag'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase block">Wetter</span>
                  <span className="font-bold text-slate-200 text-xs uppercase">{combatState.weather || 'Klar'}</span>
                </div>
              </div>

              {(activeLocation?.details?.description || (activeLocation as any)?.description) && (
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[9px] font-extrabold text-amber-400/80 uppercase block">Ortsbeschreibung (Codex / Weltkarte)</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed italic">{activeLocation?.details?.description || (activeLocation as any)?.description}</p>
                </div>
              )}

              {/* Anwesende Einheiten an diesem Standort */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Anwesende Einheiten am Standort:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-1 bg-indigo-950 border border-indigo-500/40 text-indigo-200 text-[10px] font-bold rounded-lg flex items-center gap-1">
                    <span>{getCharacterSprite(playerName, 'player', selectedSetting)}</span> {playerName} (Du)
                  </span>
                  {companions.map(c => (
                    <span key={c.id || c.name} className="px-2 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-200 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      <span>🟢</span> {c.name}
                    </span>
                  ))}
                  {opponents.map(o => (
                    <span key={o.id || o.name} className="px-2 py-1 bg-red-950 border border-red-500/40 text-red-200 text-[10px] font-bold rounded-lg flex items-center gap-1">
                      <span>🔴</span> {o.name} {o.count ? `(${o.count}x)` : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLocationDetailModal(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
