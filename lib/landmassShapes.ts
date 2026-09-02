// /lib/landmassShapes.ts
// Catalog definitions and procedural SVG point generators for World Map Continent & Island Building Blocks
// Based on "WELTKARTEN – KONTINENT VORLAGEN / BAUSTEINE FÜR PROZEDURALE WELTGENERIERUNG"

import { LoreCategory } from '../types';

export interface LandmassBuildingBlock {
  id: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  icon: string;
  description: string;
  defaultRadius: number; // in map percentage units (0-100 scale)
}

export interface StencilPreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  badge: string;
}

// 1. CATEGORY CATALOG ITEMS (Categories 1-8)
export class CatalogItems {
  static CATEGORY_1_CONTINENTS: LandmassBuildingBlock[] = [
    { id: 'shape_kompakt', name: 'A. Kompakt', categoryCode: '1', categoryName: '1. Grosse Kontinent-Formen', icon: '⛰️', description: 'Massiver, runder Hauptkontinent mit geschlossener Masse.', defaultRadius: 18 },
    { id: 'shape_langgezogen', name: 'B. Langgezogen', categoryCode: '1', categoryName: '1. Grosse Kontinent-Formen', icon: '🗾', description: 'Elongierter Kontinent, ideal für Nord-Süd Klimazonen.', defaultRadius: 20 },
    { id: 'shape_sichel', name: 'C. Sichelförmig', categoryCode: '1', categoryName: '1. Grosse Kontinent-Formen', icon: '🥐', description: 'Bogenförmige C-Gestalt um eine geschützte Ozeanbucht.', defaultRadius: 18 },
    { id: 'shape_dreieckig', name: 'D. Dreieckig', categoryCode: '1', categoryName: '1. Grosse Kontinent-Formen', icon: '🔺', description: 'Dreiseitige Landmasse mit 3 ausgeprägten Ecken und Kaps.', defaultRadius: 18 },
    { id: 'shape_zerklueftet', name: 'E. Zerklüftet', categoryCode: '1', categoryName: '1. Grosse Kontinent-Formen', icon: '💥', description: 'Wild zerklüfteter Kontinent mit unzähligen Fjorden und Fjelle.', defaultRadius: 20 },
    { id: 'shape_rund', name: 'F. Rund / Oval', categoryCode: '1', categoryName: '1. Grosse Kontinent-Formen', icon: '⭕', description: 'Ebenmäßige ovale Landmasse mit gleichmäßigen Küsten.', defaultRadius: 16 },
    { id: 'shape_unregelmaessig', name: 'G. Unregelmäßig', categoryCode: '1', categoryName: '1. Grosse Kontinent-Formen', icon: '🧩', description: 'Organische, asymmetrische Kontinentform voller Ausbuchtungen.', defaultRadius: 18 },
  ];

  static CATEGORY_2_PENINSULAS: LandmassBuildingBlock[] = [
    { id: 'shape_halbinsel_klassisch', name: 'A. Klassische Halbinsel', categoryCode: '2', categoryName: '2. Halbinseln & Landzungen', icon: '🏝️', description: 'Breite Halbinsel, die tief in den Ozean hineinragt.', defaultRadius: 14 },
    { id: 'shape_landzunge_duenn', name: 'B. Dünne Landzunge', categoryCode: '2', categoryName: '2. Halbinseln & Landzungen', icon: '🥖', description: 'Schmale, nadelartige Landzunge mit Küstenfelsen.', defaultRadius: 12 },
    { id: 'shape_halbinsel_breit', name: 'C. Breite Halbinsel', categoryCode: '2', categoryName: '2. Halbinseln & Landzungen', icon: '⛰️', description: 'Massiver Landsporn mit eigener Gebirgskette.', defaultRadius: 15 },
    { id: 'shape_halbinsel_haken', name: 'D. Hakenförmig', categoryCode: '2', categoryName: '2. Halbinseln & Landzungen', icon: '🪝', description: 'Schildkröten- oder hakenförmig gebogene Küstenzunge.', defaultRadius: 14 },
    { id: 'shape_halbinsel_verzweigt', name: 'E. Verzweigt', categoryCode: '2', categoryName: '2. Halbinseln & Landzungen', icon: '🌿', description: 'Gefächerter Landsporn mit zwei bis drei Nebenarmen.', defaultRadius: 15 },
  ];

  static CATEGORY_3_ISLANDS: LandmassBuildingBlock[] = [
    { id: 'shape_einzelinsel', name: 'A. Einzelinsel', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '🏝️', description: 'Autonome Einzelinsel mitten im tiefen Ozean.', defaultRadius: 8 },
    { id: 'shape_doppelinsel', name: 'B. Doppelt', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '👥', description: 'Paar aus zwei nah beieinander liegenden Eilanden.', defaultRadius: 10 },
    { id: 'shape_dreiergruppe', name: 'C. Dreiergruppe', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '☘️', description: 'Trio-Inselverband mit geschütztem Ankerplatz.', defaultRadius: 11 },
    { id: 'shape_inselkette_gebogen', name: 'D. Inselkette (gebogen)', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '🌙', description: 'Bogenförmige Vulkan-Inselkette im Ozean.', defaultRadius: 15 },
    { id: 'shape_inselkette_gerade', name: 'E. Inselkette (gerade)', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '📏', description: 'Aufreihende lineare Inselkette entlang einer Verwerfung.', defaultRadius: 15 },
    { id: 'shape_kleines_archipel', name: 'F. Kleines Archipel', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '✨', description: 'Kompakte Inselgruppe mit 5-7 Eilanden.', defaultRadius: 14 },
    { id: 'shape_grosses_archipel', name: 'G. Großes Archipel', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '🌌', description: 'Weitläufiges Inselmeer voller Atolle und Klippen.', defaultRadius: 18 },
    { id: 'shape_ring_archipel', name: 'H. Ring-Archipel', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '💫', description: 'Ringförmige Inselansammlung um ein versunkenes Plateau.', defaultRadius: 16 },
    { id: 'shape_vulkaninsel', name: 'I. Vulkaninsel', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '🌋', description: 'Steile Kegelinsel mit Kratersee im Zentrum.', defaultRadius: 10 },
    { id: 'shape_korallenring', name: 'J. Korallenring', categoryCode: '3', categoryName: '3. Inseln & Archipele', icon: '⭕', description: 'Filigraner Korallen-Atollring mit flacher Lagune.', defaultRadius: 12 },
  ];

  static CATEGORY_4_COASTLINES: LandmassBuildingBlock[] = [
    { id: 'shape_kueste_sanft', name: 'A. Sanfte Küste', categoryCode: '4', categoryName: '4. Küstenformen', icon: '🌊', description: 'Geschmeidige Strandküste ohne steile Riffe.', defaultRadius: 12 },
    { id: 'shape_kueste_zerklueftet', name: 'B. Zerklüftete Küste', categoryCode: '4', categoryName: '4. Küstenformen', icon: '⛰️', description: 'Raue Felsküste mit kleinen vorgelagerten Klippen.', defaultRadius: 14 },
    { id: 'shape_kueste_fjord', name: 'C. Fjord-Küste', categoryCode: '4', categoryName: '4. Küstenformen', icon: '🗡️', description: 'Tiefe spaltartige Meereinschnitte zwischen Bergwänden.', defaultRadius: 15 },
    { id: 'shape_kueste_flach', name: 'D. Flache Küste', categoryCode: '4', categoryName: '4. Küstenformen', icon: '🏖️', description: 'Breiter Flachwassersaum mit Sandbänken.', defaultRadius: 13 },
    { id: 'shape_kueste_steilklippen', name: 'E. Steilklippen', categoryCode: '4', categoryName: '4. Küstenformen', icon: '🧱', description: 'Vertikale Kreide- oder Basaltklippen direkt am Ozean.', defaultRadius: 12 },
  ];

  static CATEGORY_5_INLAND_SEAS: LandmassBuildingBlock[] = [
    { id: 'shape_bucht_geschlossen', name: 'A. Geschlossene Bucht', categoryCode: '5', categoryName: '5. Innenmeere & Buchten', icon: '⚓', description: 'Fast vollständig von Land umschlossener Naturhafen.', defaultRadius: 15 },
    { id: 'shape_bucht_offen', name: 'B. Offene Bucht', categoryCode: '5', categoryName: '5. Innenmeere & Buchten', icon: '🌊', description: 'Weit geschwungener Meeresbusen.', defaultRadius: 16 },
    { id: 'shape_bucht_doppel', name: 'C. Doppelbucht', categoryCode: '5', categoryName: '5. Innenmeere & Buchten', icon: '👓', description: 'Zweiteilige Zwillingsbucht mit einer Halbinsel mittig.', defaultRadius: 17 },
    { id: 'shape_binnenmeer_rund', name: 'D. Binnenmeer (rund)', categoryCode: '5', categoryName: '5. Innenmeere & Buchten', icon: '⭕', description: 'Großer Landring, der ein kreisrundes Binnenmeer fasst.', defaultRadius: 18 },
    { id: 'shape_binnenmeer_lang', name: 'E. Binnenmeer (lang)', categoryCode: '5', categoryName: '5. Innenmeere & Buchten', icon: '🥖', description: 'Langgezogenes Binnenmeer zwischen zwei Kontinentalplatten.', defaultRadius: 20 },
    { id: 'shape_lagune', name: 'F. Lagunenlandschaft', categoryCode: '5', categoryName: '5. Innenmeere & Buchten', icon: '🏝️', description: 'Flaches Lagunensystem mit Sandhaken und Inseln.', defaultRadius: 16 },
  ];

  static CATEGORY_6_BRIDGES: LandmassBuildingBlock[] = [
    { id: 'shape_bruecke_schmal', name: 'A. Landbrücke (schmal)', categoryCode: '6', categoryName: '6. Verbindung & Brücken-Formen', icon: '🌉', description: 'Schmaler Landstreifen, der zwei Kontinente verbindet.', defaultRadius: 14 },
    { id: 'shape_bruecke_breit', name: 'B. Landbrücke (breit)', categoryCode: '6', categoryName: '6. Verbindung & Brücken-Formen', icon: '🛣️', description: 'Massiver Landkorridor zwischen zwei Ozeanbecken.', defaultRadius: 16 },
    { id: 'shape_isthmus', name: 'C. Isthmus', categoryCode: '6', categoryName: '6. Verbindung & Brücken-Formen', icon: '⏳', description: 'Sanduhrförmiger Isthmus mit engen Meeresengen.', defaultRadius: 15 },
    { id: 'shape_verbindungsbogen', name: 'D. Verbindungsbogen', categoryCode: '6', categoryName: '6. Verbindung & Brücken-Formen', icon: '🏹', description: 'Arching-Landbogen über eine Ozeanstraße.', defaultRadius: 16 },
    { id: 'shape_dammm', name: 'E. Natürlicher Damm', categoryCode: '6', categoryName: '6. Verbindung & Brücken-Formen', icon: '🦫', description: 'Gerader Riffdamm durch seichte Gewässer.', defaultRadius: 13 },
  ];

  static CATEGORY_7_SPLIT_CONTINENTS: LandmassBuildingBlock[] = [
    { id: 'shape_geteilt_2', name: 'A. Geteilt (2 Teile)', categoryCode: '7', categoryName: '7. Zerbrochene & Split-Kontinente', icon: '⚔️', description: 'Durch Riftsystem in zwei Hälften gespaltener Kontinent.', defaultRadius: 18 },
    { id: 'shape_geteilt_3', name: 'B. Geteilt (3 Teile)', categoryCode: '7', categoryName: '7. Zerbrochene & Split-Kontinente', icon: '📐', description: 'Drei zueinander passendes Kontinentbruchstücke.', defaultRadius: 19 },
    { id: 'shape_bruchstuecke', name: 'C. Viele Bruchstücke', categoryCode: '7', categoryName: '7. Zerbrochene & Split-Kontinente', icon: '💥', description: 'Shattered Kontinent mit zahllosen Fragmenten.', defaultRadius: 20 },
    { id: 'shape_kontinentbogen', name: 'D. Kontinentbogen', categoryCode: '7', categoryName: '7. Zerbrochene & Split-Kontinente', icon: '🌈', description: 'Weit geschwungener Landbogen quer über die Karte.', defaultRadius: 22 },
    { id: 'shape_fragmentiert', name: 'E. Fragmentiert', categoryCode: '7', categoryName: '7. Zerbrochene & Split-Kontinente', icon: '🧩', description: 'Umfangreiches Labyrinth aus Landzungen und Kanälen.', defaultRadius: 20 },
  ];

  static CATEGORY_8_SPECIAL_SHAPES: LandmassBuildingBlock[] = [
    { id: 'shape_ringkontinent', name: 'A. Ringkontinent', categoryCode: '8', categoryName: '8. Spezielle Formen', icon: '🌀', description: 'Mystischer geschlossener Ringkontinent.', defaultRadius: 18 },
    { id: 'shape_hufeisen', name: 'B. Hufeisenform', categoryCode: '8', categoryName: '8. Spezielle Formen', icon: '🧲', description: 'U-förmiger Kontinent mit gigantischer Meeresöffnung.', defaultRadius: 18 },
    { id: 'shape_spiralform', name: 'C. Spiralform', categoryCode: '8', categoryName: '8. Spezielle Formen', icon: '🌀', description: 'Spiralförmig in den Ozean gewundene Landmasse.', defaultRadius: 19 },
    { id: 'shape_sternform', name: 'D. Sternförmig', categoryCode: '8', categoryName: '8. Spezielle Formen', icon: '⭐', description: 'Fünfzackiger sternförmiger Kontinent mit Zacken.', defaultRadius: 18 },
    { id: 'shape_labyrinth', name: 'E. Labyrinthform', categoryCode: '8', categoryName: '8. Spezielle Formen', icon: '🕸️', description: 'Verstricktes Gewirr aus Landstraßen und Fjorden.', defaultRadius: 20 },
  ];

  static getAllBuildingBlocks(): LandmassBuildingBlock[] {
    return [
      ...CatalogItems.CATEGORY_1_CONTINENTS,
      ...CatalogItems.CATEGORY_2_PENINSULAS,
      ...CatalogItems.CATEGORY_3_ISLANDS,
      ...CatalogItems.CATEGORY_4_COASTLINES,
      ...CatalogItems.CATEGORY_5_INLAND_SEAS,
      ...CatalogItems.CATEGORY_6_BRIDGES,
      ...CatalogItems.CATEGORY_7_SPLIT_CONTINENTS,
      ...CatalogItems.CATEGORY_8_SPECIAL_SHAPES,
    ];
  }
}

// 2. STENCIL PRESETS FOR POINT 9 ("9. KOMBINATION & BEISPIELE")
export const STENCIL_PRESETS_POINT_9: StencilPreset[] = [
  {
    id: 'bsp_1_large_continent_peninsulas',
    name: 'Beispiel 1: Großer Kontinent + Halbinseln',
    subtitle: 'Kompaktes Zentrum mit 4 Hauptspornen & Küsteninseln',
    description: 'Massiver Hauptkontinent im Zentrum mit vier weit ausladenden Halbinseln (Nord-Haken, Ost-Spitze, Süd-Horn, West-Kap) und vorgelagerten Küsteninseln.',
    icon: '🗺️',
    badge: 'Kombination 1'
  },
  {
    id: 'bsp_2_archipelago_world',
    name: 'Beispiel 2: Archipelwelt',
    subtitle: 'Vier Insel-Cluster & Vulkanatolle im Ozean',
    description: 'Eine weitläufige Inselwelt aus vier Haupt-Archipelen: Vulkaninseln im Zentrum, Atolle im Osten, langgezogene Ketten im Norden und Korallenringe im Süden.',
    icon: '🏝️',
    badge: 'Kombination 2'
  },
  {
    id: 'bsp_3_two_continents',
    name: 'Beispiel 3: Zwei Kontinente',
    subtitle: 'Ost- & West-Superkontinente mit Ozeanstraße',
    description: 'Zwei machtvolle Kontinentalplatten (Ost & West) getrennt durch eine strategische Ozeanstraße mit verbindender Inselbrücke.',
    icon: '🧭',
    badge: 'Kombination 3'
  },
  {
    id: 'bsp_4_ring_inland_sea',
    name: 'Beispiel 4: Ringkontinent mit Binnenmeer',
    subtitle: 'Kreisförmiger Kontinentgürtel um mythologisches Meer',
    description: 'Ein gewaltiges Kontinentmassiv umschließt ein kreisrundes, ruhiges Binnenmeer mit einer geheimnisvollen Heiligtums-Insel in der Mitte.',
    icon: '🌀',
    badge: 'Kombination 4'
  },
  {
    id: 'bsp_5_rugged_island_land',
    name: 'Beispiel 5: Zerklüftetes Land mit Inseln',
    subtitle: 'Spatenförmiges Fjordland mit Inselvorfeld',
    description: 'Ein extrem zerklüfteter Festlandkern voller tiefer Fjorde, Meerbusen und einem dichten Schild aus gebrochenen Küsteninseln.',
    icon: '⛰️',
    badge: 'Kombination 5'
  },
  {
    id: 'bsp_6_continent_arc_archipelago',
    name: 'Beispiel 6: Kontinentbogen & Archipel',
    subtitle: 'Sichelkontinent spiegelbildlich zu Inselbogen',
    description: 'Ein eleganter, geschwungener Kontinentbogen von Nord-West nach Süd-Ost, begleitet von einer parallelen Vulkan-Inselkette im Ozeanbecken.',
    icon: '🌈',
    badge: 'Kombination 6'
  }
];

// Helper Pseudo-Random Generator
function createPRNG(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return function (offset = 0) {
    h = Math.imul(h ^ (offset * 1299721), 16777619);
    return ((h >>> 0) % 10000) / 10000;
  };
}

/**
 * Generates an array of closed polygon points [{x, y}] in map coordinate units (0-100 scale)
 * tailored to the specific shape type.
 */
export function generateLandmassPolygonPoints(
  shapeId: string,
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number = radiusX,
  seed: string = 'shape-seed'
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const steps = 60;
  const rnd = createPRNG(seed);

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    let rFactor = 1.0;

    if (shapeId.includes('sichel') || shapeId.includes('hufeisen')) {
      // Crescent / Horseshoe notch
      const notch = Math.sin(angle);
      if (notch < 0) {
        rFactor = 0.35 + 0.25 * Math.cos(angle * 2);
      } else {
        rFactor = 1.1 + 0.2 * Math.sin(angle * 3);
      }
    } else if (shapeId.includes('dreieck')) {
      // Triangular (3 lobes)
      rFactor = 0.75 + 0.35 * Math.cos(angle * 3);
    } else if (shapeId.includes('stern')) {
      // 5-Pointed Star
      rFactor = 0.65 + 0.45 * Math.sin(angle * 5);
    } else if (shapeId.includes('langgezogen') || shapeId.includes('landzunge') || shapeId.includes('binnenmeer_lang')) {
      // Oval stretch along angle
      rFactor = 0.8 + 0.4 * Math.cos(angle * 2);
    } else if (shapeId.includes('zerklueftet') || shapeId.includes('bruchstuecke') || shapeId.includes('fragmentiert')) {
      // Highly jagged
      rFactor = 0.7 + 0.4 * Math.sin(angle * 6 + rnd(1) * 3) + 0.2 * Math.cos(angle * 11);
    } else if (shapeId.includes('spiral')) {
      // Spiral radius progression
      const t = angle / (2 * Math.PI);
      rFactor = 0.4 + 0.7 * t;
    } else if (shapeId.includes('ring') || shapeId.includes('binnenmeer')) {
      // Ring shape
      rFactor = 0.85 + 0.2 * Math.sin(angle * 4);
    } else {
      // Generic organic landmass with subtle shoreline wobble
      rFactor = 0.85 + 0.22 * Math.sin(angle * 3 + rnd(1) * 4) + 0.1 * Math.cos(angle * 7);
    }

    // Apply random noise
    const noise = (rnd(i) - 0.5) * 0.12;
    const finalRx = radiusX * (rFactor + noise);
    const finalRy = radiusY * (rFactor + noise);

    const px = Math.max(1, Math.min(99, cx + finalRx * Math.cos(angle)));
    const py = Math.max(1, Math.min(99, cy + finalRy * Math.sin(angle)));

    points.push({
      x: Number(px.toFixed(2)),
      y: Number(py.toFixed(2))
    });
  }

  return points;
}

export interface StencilLandmarkData {
  regionMarkers: Array<{
    name: string;
    type: string;
    description: string;
    x: number;
    y: number;
    color: string;
    hazardLevel?: string;
  }>;
  loreEntries: Array<{
    id: string;
    title: string;
    category: LoreCategory;
    description: string;
    isUnlocked: boolean;
  }>;
}

/**
 * Generates smooth SVG path string (M ... Q ... Z) with quadratic bezier curves for closed points.
 */
export function generateLandmassPathD(points: Array<{ x: number; y: number }>): string {
  if (!points || points.length === 0) return '';
  let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const xc = (p1.x + p2.x) / 2;
    const yc = (p1.y + p2.y) / 2;
    d += ` Q ${p1.x.toFixed(2)},${p1.y.toFixed(2)} ${xc.toFixed(2)},${yc.toFixed(2)}`;
  }
  d += ' Z';
  return d;
}

/**
 * Generates landmark region markers and lore database entries for a given continent stencil or preset.
 */
export function getStencilLandmarksAndLore(stencilId: string): StencilLandmarkData {
  const ts = Date.now();
  
  if (stencilId === 'bsp_1_large_continent_peninsulas' || stencilId === 'bsp_1' || stencilId === 'bsp1') {
    return {
      regionMarkers: [
        { name: 'Hauptkontinent Pangaea Prime', type: 'Inselgruppe', description: 'Zentraler Massivkontinent mit vier großen Halbinseln und reichhaltigen Biomen.', x: 50, y: 50, color: '#ca8a04', hazardLevel: 'Mittel' },
        { name: 'Nord-Haken Halbinsel', type: 'Inselgruppe', description: 'Nordwestliche Halbinsel mit tiefen Fjorden und eisigen Bergpassen.', x: 35, y: 25, color: '#16a34a', hazardLevel: 'Niedrig' },
        { name: 'Ost-Spitze Landzunge', type: 'Inselgruppe', description: 'Östlicher Vorsprung mit fruchtbarem Küstenland und Handels-Ankerplätzen.', x: 75, y: 35, color: '#0284c7', hazardLevel: 'Niedrig' },
        { name: 'Süd-Horn Bucht', type: 'Ruine', description: 'Südliche Meeresbucht mit warmen Passatwinden und Piratenverstecken.', x: 65, y: 75, color: '#eab308', hazardLevel: 'Hoch' },
        { name: 'West-Kap Klippen', type: 'Gebirgspass', description: 'Wilde Steilküste am westlichen Ozeanrand.', x: 22, y: 65, color: '#e11d48', hazardLevel: 'Mittel' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Hauptkontinent Pangaea Prime', category: 'Orte', description: 'Das Herzstück der Bekannten Welt, umschlossen von vier charakteristischen Halbinseln.', isUnlocked: true },
        { id: `lore-st-${ts}-2`, title: 'Nord-Haken & Ost-Spitze', category: 'Orte', description: 'Bedeutende Küstenzungen, die den Zugang zur zentralen Handelssee kontrollieren.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'bsp_2_archipelago_world' || stencilId === 'bsp_2' || stencilId === 'bsp2') {
    return {
      regionMarkers: [
        { name: 'Vulkan-Archipel Zentrum', type: 'Dungeon', description: 'Brodelnde Vulkaninseln mit seltenen Erzen und Geysiren.', x: 50, y: 50, color: '#ef4444', hazardLevel: 'Extrem' },
        { name: 'Atoll-Kette Ost', type: 'Inselgruppe', description: 'Türkisfarbene Korallenatolle mit geschützten Lagunen.', x: 75, y: 28, color: '#06b6d4', hazardLevel: 'Niedrig' },
        { name: 'Nord-Inselverband', type: 'Wald', description: 'Dicht bewaldete Eilande der Nordmeere.', x: 25, y: 25, color: '#22c55e', hazardLevel: 'Niedrig' },
        { name: 'Süd-Ringatoll', type: 'Tempel', description: 'Mystische Ringinseln alter Seefahrer-Legenden.', x: 65, y: 68, color: '#f59e0b', hazardLevel: 'Mittel' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Vulkan-Archipel Zentrum', category: 'Orte', description: 'Feurige Vulkanatolle im Zentrum der Archipelwelt.', isUnlocked: true },
        { id: `lore-st-${ts}-2`, title: 'Korallen-Atolle der Ostsee', category: 'Orte', description: 'Traumhafte Inselketten voller verborgener Korallenriffe und alten Schätzen.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'bsp_3_two_continents' || stencilId === 'bsp_3' || stencilId === 'bsp3') {
    return {
      regionMarkers: [
        { name: 'West-Kontinent Occidentia', type: 'Inselgruppe', description: 'Ehrwürdiger Westkontinent mit weiten Wäldern und alten Festungen.', x: 28, y: 48, color: '#2563eb', hazardLevel: 'Niedrig' },
        { name: 'Ost-Kontinent Orientis', type: 'Inselgruppe', description: 'Sonnenverwöhnte Ostlandmasse voller Wüsten, Basare und Magiergilden.', x: 72, y: 52, color: '#d97706', hazardLevel: 'Mittel' },
        { name: 'Straße von Bifröst', type: 'Gebirgspass', description: 'Strategische Ozeanstraße zwischen den beiden Machtblöcken.', x: 50, y: 50, color: '#0284c7', hazardLevel: 'Hoch' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'West-Kontinent Occidentia', category: 'Orte', description: 'Heimat der alten Reiche und mächtigen Rittergilden.', isUnlocked: true },
        { id: `lore-st-${ts}-2`, title: 'Ost-Kontinent Orientis', category: 'Orte', description: 'Mystisches Land der Handelswege, Wüstenstädte und Sternenbeobachter.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'bsp_4_ring_inland_sea' || stencilId === 'bsp_4' || stencilId === 'bsp4') {
    return {
      regionMarkers: [
        { name: 'Äußerer Ringkontinent', type: 'Inselgruppe', description: 'Ein kreisförmiger Kontinentgürtel, der das Innere Meer schützt.', x: 50, y: 23, color: '#16a34a', hazardLevel: 'Niedrig' },
        { name: 'Heiliges Binnenmeer', type: 'Inselgruppe', description: 'Kristallklares, von Stürmen abgeschirmtes Zentralmeer.', x: 50, y: 50, color: '#0284c7', hazardLevel: 'Niedrig' },
        { name: 'Sanctuarium-Insel', type: 'Tempel', description: 'Uralte Insel in der Mitte des Binnenmeers, Sitz der Alten Hüter.', x: 50, y: 50, color: '#eab308', hazardLevel: 'Hoch' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Der Äußerer Ringkontinent', category: 'Orte', description: 'Umschließt das heilige Binnenmeer als gewaltiger natürlicher Wall.', isUnlocked: true },
        { id: `lore-st-${ts}-2`, title: 'Sanctuarium-Insel', category: 'Orte', description: 'Das sagenumwobene Zentrum der Welt mitten im Binnenmeer.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'bsp_5_rugged_island_land' || stencilId === 'bsp_5' || stencilId === 'bsp5') {
    return {
      regionMarkers: [
        { name: 'Fjord-Festland Skagastöl', type: 'Gebirgspass', description: 'Zerklüftetes Hauptland mit eisigen Fjorden und gewaltigen Bergmassiven.', x: 45, y: 45, color: '#059669', hazardLevel: 'Mittel' },
        { name: 'Äußere Schildinseln', type: 'Inselgruppe', description: 'Ketten von Schutzinseln, die den Ozeanstürmen trotzen.', x: 25, y: 72, color: '#0284c7', hazardLevel: 'Mittel' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Skagastöl Fjordland', category: 'Orte', description: 'Tief eingeschnittene Meeresarme prägen diese raue Festlandsregion.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'bsp_6_continent_arc_archipelago' || stencilId === 'bsp_6' || stencilId === 'bsp6') {
    return {
      regionMarkers: [
        { name: 'Kontinentbogen Koron', type: 'Inselgruppe', description: 'Sichelförmig geschwungene Hauptlandmasse.', x: 42, y: 45, color: '#d97706', hazardLevel: 'Mittel' },
        { name: 'Bogen-Inselkette', type: 'Inselgruppe', description: 'Begleitende Inselkette entlang des Tiefseegrabens.', x: 72, y: 32, color: '#06b6d4', hazardLevel: 'Mittel' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Der Kontinentbogen Koron', category: 'Orte', description: 'Imposanter Landbogen quer durch den Ozean.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'complete' || stencilId === 'rugged') {
    return {
      regionMarkers: [
        { name: 'Hauptkontinent Aethelgard', type: 'Inselgruppe', description: 'Gewaltige zusammenhängende Hauptlandmasse.', x: 50, y: 50, color: '#16a34a', hazardLevel: 'Mittel' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Aethelgard Hauptkontinent', category: 'Orte', description: 'Das geeinte Festland Aethelgard.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'divided') {
    return {
      regionMarkers: [
        { name: 'Nord-Kontinent Borealis', type: 'Gebirgspass', description: 'Eisiger Nordkontinent.', x: 50, y: 25, color: '#0284c7', hazardLevel: 'Hoch' },
        { name: 'Süd-Kontinent Australis', type: 'Inselgruppe', description: 'Fruchtbarer Südkontinent.', x: 50, y: 75, color: '#d97706', hazardLevel: 'Niedrig' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Borealis & Australis', category: 'Orte', description: 'Die geteilten Zwillingskontinente der Welt.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'peninsula') {
    return {
      regionMarkers: [
        { name: 'Hauptland & Landzunge', type: 'Inselgruppe', description: 'Kontinent mit weit ausladenden Halbinseln.', x: 50, y: 45, color: '#16a34a', hazardLevel: 'Niedrig' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Die Große Halbinsel', category: 'Orte', description: 'Weit vorragende Landmasse ins Meer.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'archipelago' || stencilId === 'island_group') {
    return {
      regionMarkers: [
        { name: 'Das Große Inselmeer', type: 'Inselgruppe', description: 'Weitverzweigtes Archipel im offenen Ozean.', x: 50, y: 50, color: '#06b6d4', hazardLevel: 'Mittel' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Das Große Inselmeer', category: 'Orte', description: 'Unzählige Eilande im tiefen Ozean.', isUnlocked: true }
      ]
    };
  }

  if (stencilId === 'ring' || stencilId === 'central_sea') {
    return {
      regionMarkers: [
        { name: 'Ringkontinent & Binnenmeer', type: 'Inselgruppe', description: 'Ringförmiger Landgürtel um ein Zentralmeer.', x: 50, y: 50, color: '#16a34a', hazardLevel: 'Mittel' }
      ],
      loreEntries: [
        { id: `lore-st-${ts}-1`, title: 'Ringkontinent & Binnenmeer', category: 'Orte', description: 'Geschützter Ozeanring der Alten Welt.', isUnlocked: true }
      ]
    };
  }

  return { regionMarkers: [], loreEntries: [] };
}
