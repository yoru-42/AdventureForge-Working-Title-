import { WorldSetting, LoreEntry, Territory } from '../../types';
import polygonClipping from 'polygon-clipping';

// 5 Zoom levels for detail filtering
export type ZoomDetailLevel = 'world' | 'region' | 'city' | 'district' | 'building';

export const DETAIL_LEVEL_CONFIG: Record<ZoomDetailLevel, { level: number; name: string; minScale: number; maxScale: number; icon: string; desc: string }> = {
  world: { level: 1, name: 'Welt & Ozeane', minScale: 0.7, maxScale: 1.6, icon: '', desc: 'Kontinente, Meere, Imperien' },
  region: { level: 2, name: 'Region & Königreich', minScale: 1.6, maxScale: 2.8, icon: '', desc: 'Provinzen, Handelsrouten, Gebirge' },
  city: { level: 3, name: 'Stadt & Außenposten', minScale: 2.8, maxScale: 4.8, icon: '', desc: 'Stadtmauern, Häfen, Festungen' },
  district: { level: 4, name: 'Stadtviertel & Distrikte', minScale: 4.8, maxScale: 7.5, icon: '', desc: 'Straßen, Viertel, Bandenterritorien' },
  building: { level: 5, name: 'Gebäude & POIs', minScale: 7.5, maxScale: 12.0, icon: '', desc: 'Tavernen, Gilden, Kontore, Türme' }
};

// =========================================================================
// WIDE 240 x 140 GEOGRAPHIC LANDMASS DEFINITIONS (Universal Continents & Shelves)
// =========================================================================

export const LANDMASS_POLYGONS: Array<{
  id: string;
  name: string;
  points: { x: number; y: number }[];
  fill: string;
  innerFill: string;
  beachColor: string;
  stroke: string;
  reefColor: string;
}> = [];

export interface IslandBiomeStyle {
  biome: 'lush_tropical' | 'desert_dunes' | 'winter_snow' | 'volcanic_rock' | 'mangrove_swamp' | 'mountain_highland' | 'fortress_navy' | 'royal_city' | 'sky_island';
  label: string;
  fill: string;           // Tactical terrain core fill
  innerFill: string;      // Tactical elevated / dense core
  beachColor: string;     // Sand coast / beach rim
  reefColor: string;      // Shallow ocean reef glow
  accentIcon: string;     // Micro landscape icon (tree, mountain, castle)
  typeIcon: string;       // Badge icon
}

/**
 * Returns authentic tactical battlefield terrain colors & coastal styles based on location lore.
 */
export function getIslandBiomeStyle(
  name: string = '',
  desc: string = '',
  faction: string = '',
  type: string = ''
): IslandBiomeStyle {
  const text = `${name} ${desc} ${faction} ${type}`.toLowerCase();

  // 1. Sky Island / Cloud Domain
  if (text.includes('himmel') || text.includes('wolke') || text.includes('schwebend') || text.includes('astral') || text.includes('äther')) {
    return {
      biome: 'sky_island',
      label: 'Himmelsinsel & Wolkenmeer',
      fill: '#f8fafc',
      innerFill: '#e2e8f0',
      beachColor: '#bae6fd',
      reefColor: '#7dd3fc',
      accentIcon: '',
      typeIcon: ''
    };
  }

  // 2. Desert / Arid Dunes
  if (text.includes('wüste') || text.includes('sand') || text.includes('düne') || text.includes('oase') || text.includes('ödland') || text.includes('savanne') || text.includes('steppe')) {
    return {
      biome: 'desert_dunes',
      label: 'Wüstenregion & Sanddünen',
      fill: '#d97706',
      innerFill: '#b45309',
      beachColor: '#fde047',
      reefColor: '#38bdf8',
      accentIcon: '',
      typeIcon: ''
    };
  }

  // 3. Winter / Snow / Glacier
  if (text.includes('eis') || text.includes('schnee') || text.includes('frost') || text.includes('gletscher') || text.includes('polar') || text.includes('winter') || text.includes('tundra') || text.includes('nord')) {
    return {
      biome: 'winter_snow',
      label: 'Eisland & Schneegebirge',
      fill: '#f1f5f9',
      innerFill: '#cbd5e1',
      beachColor: '#93c5fd',
      reefColor: '#38bdf8',
      accentIcon: '',
      typeIcon: ''
    };
  }

  // 4. Volcanic / Dark Rock / Magma
  if (text.includes('vulkan') || text.includes('magma') || text.includes('lava') || text.includes('feuer') || text.includes('asche') || text.includes('schatten') || text.includes('dunkel') || text.includes('düster')) {
    return {
      biome: 'volcanic_rock',
      label: 'Vulkanland & Felsformation',
      fill: '#292524',
      innerFill: '#7f1d1d',
      beachColor: '#78716c',
      reefColor: '#ef4444',
      accentIcon: '',
      typeIcon: ''
    };
  }

  // 5. Mangrove Swamp / Wetland / Rainforest
  if (text.includes('sumpf') || text.includes('moor') || text.includes('mangrove') || text.includes('dschungel') || text.includes('regenwald') || text.includes('lagune') || text.includes('feuchtgebiet')) {
    return {
      biome: 'mangrove_swamp',
      label: 'Mangroven & Feuchtbiom',
      fill: '#047857',
      innerFill: '#064e3b',
      beachColor: '#34d399',
      reefColor: '#38bdf8',
      accentIcon: '',
      typeIcon: ''
    };
  }

  // 6. Fortress / Navy / Citadel / Garrison
  if (text.includes('festung') || text.includes('burg') || text.includes('bastion') || text.includes('garnison') || text.includes('festung') || text.includes('wachturm') || text.includes('militär') || text.includes('zitadelle')) {
    return {
      biome: 'fortress_navy',
      label: 'Militärische Bastion & Festung',
      fill: '#334155',
      innerFill: '#1e293b',
      beachColor: '#64748b',
      reefColor: '#38bdf8',
      accentIcon: '',
      typeIcon: ''
    };
  }

  // 7. Mountain / Highland / Plateau
  if (text.includes('berg') || text.includes('gebirge') || text.includes('gipfel') || text.includes('hochland') || text.includes('plateau') || text.includes('fels') || text.includes('klippe')) {
    return {
      biome: 'mountain_highland',
      label: 'Hochland & Bergregion',
      fill: '#475569',
      innerFill: '#1e293b',
      beachColor: '#eab308',
      reefColor: '#38bdf8',
      accentIcon: '',
      typeIcon: ''
    };
  }

  // 8. Royal City / Metropolis / Harbor Town
  if (text.includes('stadt') || text.includes('hafen') || text.includes('metropole') || text.includes('hauptstadt') || text.includes('siedlung') || text.includes('reich') || text.includes('königreich')) {
    return {
      biome: 'royal_city',
      label: 'Königreich & Hafenstadt',
      fill: '#78350f',
      innerFill: '#92400e',
      beachColor: '#fbbf24',
      reefColor: '#38bdf8',
      accentIcon: '',
      typeIcon: ''
    };
  }

  // Default: Lush Tropical / Temperate Island
  return {
    biome: 'lush_tropical',
    label: 'Grüne Insel & Naturreich',
    fill: '#15803d',
    innerFill: '#166534',
    beachColor: '#facc15',
    reefColor: '#38bdf8',
    accentIcon: '',
    typeIcon: ''
  };
}

export const MAP_BIOMES: Array<{ id: string; name: string; fill: string; stroke: string; opacity: number; path: string }> = [];
export const MAP_COASTAL_SHELVES: Array<{ id: string; d: string; stroke: string; strokeWidth: number; opacity: number }> = [];
export const MAP_CLIFF_VECTORS: Array<{ id: string; d: string; stroke: string; strokeWidth: number; opacity: number }> = [];
export const MAP_LAKES: Array<{ id: string; cx: number; cy: number; rx: number; ry: number; fill: string; stroke: string }> = [];
export const MAP_RIVERS: Array<{ id: string; d: string; stroke: string; strokeWidth: number; opacity: number }> = [];
export const MAP_BRIDGES: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> = [];
export const MAP_MOUNTAIN_PEAKS: Array<{ x: number; y: number; w: number; h: number; name: string; type: string }> = [];
export const MAP_FOREST_CLUSTERS: Array<{ x: number; y: number; r: number; label: string; type: string }> = [];

export const MAP_ROUTES_VECTOR: Array<{
  id: string;
  name: string;
  d: string;
  stroke: string;
  dash: string;
  width: number;
  type: string;
}> = [];

// =========================================================================
// UNIVERSAL DEFAULT PRESET TERRITORIES WITH 240x140 WIDE COORDINATES
// =========================================================================

export const DEFAULT_PRESET_TERRITORIES: Territory[] = [
  // 0. ROOT-GEBIET
  {
    id: 'terr-world',
    name: 'Weltatlas (Gesamte Welt & Reiche)',
    type: 'welt',
    description: 'Das übergeordnete Gefüge der bekannten Welt, bestehend aus Ozeanen, Kontinenten, Archipelen und Königreichen.',
    parentId: null,
    x: 120,
    y: 70,
    shapeType: 'circle',
    color: '#6366f1',
    faction: 'Freie Welt',
    dangerLevel: 'Variiert',
    isUnlocked: true
  },

  // 1. MEERE & OZEANE
  {
    id: 'terr-sea-ostmeer',
    name: 'Östlicher Ozean',
    type: 'meer',
    description: 'Weitläufiger Ozean im Osten mit florierenden Handelsrouten, Inselstaaten und Häfen.',
    parentId: 'terr-world',
    x: 180,
    y: 35,
    shapeType: 'circle',
    color: '#0284c7',
    faction: 'Handelsgilde',
    dangerLevel: 'Niedrig',
    isUnlocked: true
  },
  {
    id: 'terr-sea-nordmeer',
    name: 'Nördlicher Ozean',
    type: 'meer',
    description: 'Kühles Meer des Nordens mit kühlen Strömungen, Erzminen und stolzen Küstenstädten.',
    parentId: 'terr-world',
    x: 60,
    y: 35,
    shapeType: 'circle',
    color: '#0284c7',
    faction: 'Nordischer Bund',
    dangerLevel: 'Mittel',
    isUnlocked: true
  },
  {
    id: 'terr-sea-westmeer',
    name: 'Westlicher Ozean',
    type: 'meer',
    description: 'Weiter westlicher Seeraum mit tiefen Buchten, alten Legenden und Freibeutern.',
    parentId: 'terr-world',
    x: 60,
    y: 105,
    shapeType: 'circle',
    color: '#0284c7',
    faction: 'Freie Händler',
    dangerLevel: 'Mittel',
    isUnlocked: true
  },
  {
    id: 'terr-sea-suedmeer',
    name: 'Südlicher Ozean',
    type: 'meer',
    description: 'Warmer tropischer Ozean mit sonnigen Atollen, Korallenriffen und Gewürzinseln.',
    parentId: 'terr-world',
    x: 180,
    y: 105,
    shapeType: 'circle',
    color: '#0284c7',
    faction: 'Südliche Reiche',
    dangerLevel: 'Niedrig',
    isUnlocked: true
  },
  {
    id: 'terr-sea-zentral',
    name: 'Zentralmeer & Große Passage',
    type: 'meer',
    description: 'Die zentrale Meeresstraße und Hauptader für weltweiten Handel und Entdecker.',
    parentId: 'terr-world',
    x: 120,
    y: 70,
    shapeType: 'circle',
    color: '#0369a1',
    faction: 'Freier Seebund',
    dangerLevel: 'Mittel',
    isUnlocked: true
  }
];

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

export function getTerritoryLineage(targetId: string, all: Territory[]): Territory[] {
  const chain: Territory[] = [];
  let curr: Territory | undefined = all.find(t => t.id === targetId);
  const visited = new Set<string>();

  while (curr && !visited.has(curr.id)) {
    visited.add(curr.id);
    chain.unshift(curr);
    if (!curr.parentId) break;
    curr = all.find(t => t.id === curr!.parentId);
  }
  return chain;
}

const islandPointsCache = new Map<string, { x: number; y: number }[]>();
const svgPathCache = new Map<string, string>();

export function generateNaturalFreehandZonePoints(
  cx: number,
  cy: number,
  radius: number,
  type: string = 'koenigreich',
  seed: number = 42,
  roughness: number = 0.45
): { x: number; y: number }[] {
  const numVertices = Math.max(36, Math.min(64, Math.round(36 + roughness * 24)));
  const points: { x: number; y: number }[] = [];
  
  // Natural multi-octave harmonic parameters for smooth hand-drawn coastlines & borders
  const isWater = type === 'meer' || type === 'ozean' || type === 'see';
  const isIsland = type === 'insel';
  const isBiome = type.startsWith('biome_');

  // Varying coastal lobes
  const lobeFreq1 = isIsland ? 3 : isWater ? 2 : 3;
  const lobeFreq2 = isIsland ? 5 : isWater ? 4 : 5;
  const lobeFreq3 = 7;

  const amp1 = isIsland ? 0.22 : isWater ? 0.18 : 0.24;
  const amp2 = isIsland ? 0.12 : isWater ? 0.10 : 0.14;
  const amp3 = 0.06;

  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI;
    
    // Multi-octave continuous waves
    const h1 = Math.sin(angle * lobeFreq1 + (seed * 0.73)) * (amp1 * (0.8 + roughness * 0.4));
    const h2 = Math.cos(angle * lobeFreq2 + (seed * 1.37)) * (amp2 * (0.8 + roughness * 0.4));
    const h3 = Math.sin(angle * lobeFreq3 + (seed * 2.19)) * amp3;
    const microWobble = Math.sin(i * 1.7 + seed * 3.11) * 0.03;

    let varFactor = 1.0 + h1 + h2 + h3 + microWobble;

    // Asymmetry & natural bay indentations
    if (!isBiome) {
      const bay = Math.sin(angle * 2 + seed) * 0.12;
      varFactor += bay;
    }

    varFactor = Math.max(0.65, Math.min(1.45, varFactor));
    const r = radius * varFactor;

    const px = Math.round((cx + Math.cos(angle) * r) * 10) / 10;
    const py = Math.round((cy + Math.sin(angle) * r) * 10) / 10;
    points.push({ x: px, y: py });
  }

  return points;
}

export function createOrganicIslandPoints(
  cx: number,
  cy: number,
  radius: number,
  seed: number,
  scale: number = 1.0,
  roughness: number = 0.5,
  openDirection: string = 'none'
): { x: number; y: number }[] {
  const cacheKey = `${cx.toFixed(1)}_${cy.toFixed(1)}_${radius.toFixed(2)}_${seed}_${scale.toFixed(2)}_${roughness.toFixed(2)}_${openDirection}`;
  const cached = islandPointsCache.get(cacheKey);
  if (cached) return cached;

  const points: { x: number; y: number }[] = [];
  const numVertices = Math.max(32, Math.min(56, Math.round(32 + roughness * 20)));
  const effectiveRadius = radius * scale;

  // Direction angle mapping for open coast (e.g. stretching / opening out towards ocean)
  const dirAngles: Record<string, number> = {
    east: 0,
    southeast: Math.PI / 4,
    south: Math.PI / 2,
    southwest: (3 * Math.PI) / 4,
    west: Math.PI,
    northwest: (5 * Math.PI) / 4,
    north: (3 * Math.PI) / 2,
    northeast: (7 * Math.PI) / 4
  };

  const targetAngle = dirAngles[openDirection] !== undefined ? dirAngles[openDirection] : null;

  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI;
    const rFactor = roughness * 0.35;
    const harmonic1 = Math.sin((seed * 1.7) + angle * 3) * (0.16 + rFactor * 0.2);
    const harmonic2 = Math.cos((seed * 3.1) + angle * 5) * (0.09 + rFactor * 0.15);
    const harmonic3 = Math.sin((seed * 0.9) + angle * 7) * 0.05;
    
    let varFactor = 0.98 + harmonic1 + harmonic2 + harmonic3;

    // If an open coast direction is selected, expand/flatten the shape towards that direction
    if (targetAngle !== null) {
      let angleDiff = Math.abs(angle - targetAngle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      const dirAlignment = Math.cos(angleDiff);
      varFactor += dirAlignment * 0.25;
    }

    varFactor = Math.max(0.65, Math.min(1.45, varFactor));
    
    const r = effectiveRadius * varFactor;
    const px = Math.round((cx + Math.cos(angle) * r) * 10) / 10;
    const py = Math.round((cy + Math.sin(angle) * r) * 10) / 10;
    points.push({ x: px, y: py });
  }

  if (islandPointsCache.size > 2000) {
    islandPointsCache.clear();
  }
  islandPointsCache.set(cacheKey, points);
  return points;
}

export function pointsToOpenSvgPath(points: { x: number; y: number }[]): string {
  if (!points || points.length === 0) return '';
  return `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
}

/**
 * Helper: Checks if two 2D line segments intersect.
 */
function doSegmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  const ccw = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) =>
    (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

/**
 * Helper: Counts self-intersections in a polygon ring.
 */
function countSelfIntersections(pts: { x: number; y: number }[]): number {
  let count = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const p3 = pts[j];
      const p4 = pts[(j + 1) % n];
      if (doSegmentsIntersect(p1, p2, p3, p4)) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Connects a drawn path (starting/ending near an existing territory's border)
 * by extracting the perimeter boundary segment of the adjacent territory,
 * strictly selecting the non-self-intersecting border path.
 */
export function closeDrawnPointsWithNeighbors(
  rawPoints: { x: number; y: number }[],
  territories: Territory[]
): { x: number; y: number }[] {
  if (!rawPoints || rawPoints.length < 2) return rawPoints;

  const startPt = rawPoints[0];
  const endPt = rawPoints[rawPoints.length - 1];

  // 1. Check if start & end are already close to each other (< 6 units) -> standard self-closing polygon
  const distStartEnd = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y);
  if (distStartEnd < 6) {
    return rawPoints;
  }

  // 2. Check if start & end connect to an existing territory
  let bestNeighbor: { terr: Territory; polyPoints: { x: number; y: number }[] } | null = null;
  let minCombinedDist = Infinity;

  for (const terr of territories) {
    if (!terr || terr.type === 'welt') continue;

    const polyPoints = getTerritoryOrganicPoints(terr, 1.0, territories);
    if (!polyPoints || polyPoints.length < 3) continue;

    let minDistS = Infinity;
    let minDistE = Infinity;

    for (const p of polyPoints) {
      const dS = Math.hypot(startPt.x - p.x, startPt.y - p.y);
      const dE = Math.hypot(endPt.x - p.x, endPt.y - p.y);
      if (dS < minDistS) minDistS = dS;
      if (dE < minDistE) minDistE = dE;
    }

    const combined = minDistS + minDistE;
    // Both start & end must be reasonably near the territory border (< 35 units)
    if (minDistS < 35 && minDistE < 35 && combined < minCombinedDist) {
      minCombinedDist = combined;
      bestNeighbor = { terr, polyPoints };
    }
  }

  // 3. If connected to an existing neighbor's border:
  if (bestNeighbor) {
    const poly = bestNeighbor.polyPoints;
    const n = poly.length;

    let idxStart = 0;
    let minDistS = Infinity;
    let idxEnd = 0;
    let minDistE = Infinity;

    poly.forEach((p, i) => {
      const dS = Math.hypot(startPt.x - p.x, startPt.y - p.y);
      if (dS < minDistS) { minDistS = dS; idxStart = i; }
      const dE = Math.hypot(endPt.x - p.x, endPt.y - p.y);
      if (dE < minDistE) { minDistE = dE; idxEnd = i; }
    });

    if (idxStart !== idxEnd) {
      // Forward path along neighbor boundary from idxEnd to idxStart
      const segA: { x: number; y: number }[] = [];
      let curr = idxEnd;
      while (curr !== idxStart) {
        segA.push(poly[curr]);
        curr = (curr + 1) % n;
      }
      segA.push(poly[idxStart]);

      // Backward path along neighbor boundary from idxEnd to idxStart
      const segB: { x: number; y: number }[] = [];
      curr = idxEnd;
      while (curr !== idxStart) {
        segB.push(poly[curr]);
        curr = (curr - 1 + n) % n;
      }
      segB.push(poly[idxStart]);

      const candidateA = [...rawPoints, ...segA];
      const candidateB = [...rawPoints, ...segB];

      const xCountA = countSelfIntersections(candidateA);
      const xCountB = countSelfIntersections(candidateB);

      // Select candidate with strictly FEWEST self-intersections
      if (xCountA < xCountB) {
        return candidateA;
      } else if (xCountB < xCountA) {
        return candidateB;
      } else {
        const lenA = segA.reduce((acc, p, i) => i === 0 ? 0 : acc + Math.hypot(p.x - segA[i-1].x, p.y - segA[i-1].y), 0);
        const lenB = segB.reduce((acc, p, i) => i === 0 ? 0 : acc + Math.hypot(p.x - segB[i-1].x, p.y - segB[i-1].y), 0);
        return lenA <= lenB ? candidateA : candidateB;
      }
    }
  }

  // 4. Freehand open curve in open water (smooth organic closing arc instead of a rigid straight line)
  const numArcPts = Math.max(3, Math.min(8, Math.floor(distStartEnd / 5)));
  const arcPoints: { x: number; y: number }[] = [];
  const dx = endPt.x - startPt.x;
  const dy = endPt.y - startPt.y;
  const perpX = -dy / distStartEnd;
  const perpY = dx / distStartEnd;
  const curveMagnitude = distStartEnd * 0.12;

  for (let i = 1; i <= numArcPts; i++) {
    const t = i / (numArcPts + 1);
    const arcHeight = Math.sin(t * Math.PI) * curveMagnitude;
    const px = endPt.x + (startPt.x - endPt.x) * t + perpX * arcHeight;
    const py = endPt.y + (startPt.y - endPt.y) * t + perpY * arcHeight;
    arcPoints.push({
      x: Math.round(px * 10) / 10,
      y: Math.round(py * 10) / 10
    });
  }

  return [...rawPoints, ...arcPoints];
}

export function calculatePolygonArea(points: { x: number; y: number }[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2.0;
}

/**
 * Universally calculates area for any nested geometry format:
 * - Point objects: [{x, y}, ...]
 * - Linear ring: [ [x, y], ... ]
 * - Polygon: [ Ring, Hole1, ... ] -> [ [ [x, y], ... ] ]
 * - MultiPolygon: [ Polygon1, Polygon2, ... ] -> [ [ [ [x, y], ... ] ] ]
 */
export function calculateAnyPolyArea(polyData: any): number {
  if (!polyData || !Array.isArray(polyData) || polyData.length === 0) return 0;

  // Case 1: Point objects [{ x: 10, y: 20 }, ...]
  if (typeof polyData[0] === 'object' && polyData[0] !== null && 'x' in polyData[0] && 'y' in polyData[0]) {
    return calculatePolygonArea(polyData);
  }

  // Case 2: Linear ring [ [10, 20], [30, 40], ... ]
  if (Array.isArray(polyData[0]) && typeof polyData[0][0] === 'number') {
    const pts = polyData.map((p: any) => ({ x: Number(p[0]) || 0, y: Number(p[1]) || 0 }));
    return calculatePolygonArea(pts);
  }

  // Case 3: Polygon with outer ring & optional holes: [ [ [x,y], ... ], [ [hole_x, hole_y], ... ] ]
  if (Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) && typeof polyData[0][0][0] === 'number') {
    const outerRing = polyData[0];
    const outerPts = outerRing.map((p: any) => ({ x: Number(p[0]) || 0, y: Number(p[1]) || 0 }));
    let area = calculatePolygonArea(outerPts);
    for (let i = 1; i < polyData.length; i++) {
      const holeRing = polyData[i];
      if (Array.isArray(holeRing)) {
        const holePts = holeRing.map((p: any) => ({ x: Number(p[0]) || 0, y: Number(p[1]) || 0 }));
        area -= calculatePolygonArea(holePts);
      }
    }
    return Math.max(0, area);
  }

  // Case 4: MultiPolygon: [ [ [ [x, y], ... ] ] ]
  if (Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) && Array.isArray(polyData[0][0][0])) {
    let total = 0;
    for (const polygon of polyData) {
      total += calculateAnyPolyArea(polygon);
    }
    return total;
  }

  return 0;
}

export function calculateMultiPolygonArea(multiPoly: any): number {
  return calculateAnyPolyArea(multiPoly);
}

/**
 * Calculates the exact surface area for any territory (drawn points, conformed clipping, template or radius).
 */
export function calculateTerritoryArea(terr: Territory, allTerritories: Territory[] = []): number {
  if (!terr) return 0;

  // 1. Direct hand-drawn polygon points
  if (terr.points && terr.points.length >= 3) {
    const raw = calculatePolygonArea(terr.points);
    if (raw > 0) return raw;
  }

  // 2. Conformed geometry (handles clipping & shared borders)
  try {
    const conformed = getConformedTerritoryGeometry(terr, allTerritories);
    if (conformed) {
      if (conformed.points && conformed.points.length >= 3) {
        const raw = calculatePolygonArea(conformed.points);
        if (raw > 0) return raw;
      }
      if (conformed.multiPoly) {
        const raw = calculateAnyPolyArea(conformed.multiPoly);
        if (raw > 0) return raw;
      }
    }
  } catch (e) {
    // Ignore and fallback
  }

  // 3. Fallback to organic points / radius
  const organicPts = getTerritoryOrganicPoints(terr, 1.0, allTerritories);
  if (organicPts && organicPts.length >= 3) {
    const raw = calculatePolygonArea(organicPts);
    if (raw > 0) return raw;
  }

  if (terr.radius && terr.radius > 0) {
    return Math.PI * terr.radius * terr.radius;
  }

  return 0;
}

export type ScaleDirection = 'center' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

/**
 * Rescales a territory (points and radius) so that its geographic area precisely matches targetAreaSqKm,
 * expanding in a chosen direction (center, north, south, east, west, nw, ne, sw, se).
 */
export function scaleTerritoryToAreaWithDirection(
  terr: Territory,
  targetAreaSqKm: number,
  direction: ScaleDirection = 'center',
  unitSqKm: number = 0.01
): Territory {
  if (!terr || targetAreaSqKm <= 0) return terr;

  const currentRawArea = calculateTerritoryArea(terr);
  const targetRawArea = targetAreaSqKm / Math.max(0.001, unitSqKm);

  // If territory has no existing area, create a reasonable baseline radius
  if (currentRawArea <= 0.1) {
    const newRad = Math.max(2, Math.round(Math.sqrt(targetRawArea / Math.PI) * 10) / 10);
    return { ...terr, radius: newRad };
  }

  const scaleFactor = Math.sqrt(targetRawArea / currentRawArea);
  if (Math.abs(scaleFactor - 1.0) < 0.001) return terr;

  const oldRadius = terr.radius || 10;
  const newRadius = Math.max(1, Math.round(oldRadius * scaleFactor * 10) / 10);

  if (terr.points && terr.points.length >= 3) {
    const xs = terr.points.map(p => p.x);
    const ys = terr.points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    let anchorX = cx;
    let anchorY = cy;

    switch (direction) {
      case 'n':
        anchorX = cx;
        anchorY = maxY;
        break;
      case 's':
        anchorX = cx;
        anchorY = minY;
        break;
      case 'e':
        anchorX = minX;
        anchorY = cy;
        break;
      case 'w':
        anchorX = maxX;
        anchorY = cy;
        break;
      case 'nw':
        anchorX = maxX;
        anchorY = maxY;
        break;
      case 'ne':
        anchorX = minX;
        anchorY = maxY;
        break;
      case 'sw':
        anchorX = maxX;
        anchorY = minY;
        break;
      case 'se':
        anchorX = minX;
        anchorY = minY;
        break;
      case 'center':
      default:
        anchorX = cx;
        anchorY = cy;
        break;
    }

    const newPoints = terr.points.map(p => ({
      x: Math.round((anchorX + (p.x - anchorX) * scaleFactor) * 10) / 10,
      y: Math.round((anchorY + (p.y - anchorY) * scaleFactor) * 10) / 10
    }));

    const newCx = Math.round((newPoints.reduce((s, p) => s + p.x, 0) / newPoints.length) * 10) / 10;
    const newCy = Math.round((newPoints.reduce((s, p) => s + p.y, 0) / newPoints.length) * 10) / 10;
    const computedMaxR = Math.max(...newPoints.map(p => Math.hypot(p.x - newCx, p.y - newCy)));

    return {
      ...terr,
      x: newCx,
      y: newCy,
      radius: Math.max(newRadius, Math.round(computedMaxR * 10) / 10),
      points: newPoints
    };
  }

  // Non-polygon / circular / procedural shape: calculate shift from center
  const radiusDelta = newRadius - oldRadius;
  let shiftX = 0;
  let shiftY = 0;

  switch (direction) {
    case 'n': shiftY = -radiusDelta; break;
    case 's': shiftY = radiusDelta; break;
    case 'e': shiftX = radiusDelta; break;
    case 'w': shiftX = -radiusDelta; break;
    case 'nw': shiftX = -radiusDelta; shiftY = -radiusDelta; break;
    case 'ne': shiftX = radiusDelta; shiftY = -radiusDelta; break;
    case 'sw': shiftX = -radiusDelta; shiftY = radiusDelta; break;
    case 'se': shiftX = radiusDelta; shiftY = radiusDelta; break;
    case 'center': default: break;
  }

  return {
    ...terr,
    radius: newRadius,
    x: Math.round((terr.x + shiftX) * 10) / 10,
    y: Math.round((terr.y + shiftY) * 10) / 10
  };
}

/**
 * Rescales a territory so that its geographic area precisely matches targetAreaSqKm.
 */
export function scaleTerritoryToArea(
  terr: Territory,
  targetAreaSqKm: number,
  unitSqKm: number = 0.01
): Territory {
  return scaleTerritoryToAreaWithDirection(terr, targetAreaSqKm, 'center', unitSqKm);
}

export function generateSmoothRoundedBoxPoints(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  cornerR: number = 10,
  pointsPerCorner: number = 5
): { x: number; y: number }[] {
  const width = maxX - minX;
  const height = maxY - minY;
  const r = Math.max(1, Math.min(cornerR, width / 2 - 0.5, height / 2 - 0.5));

  const points: { x: number; y: number }[] = [];

  // Top-Right corner arc
  for (let i = 0; i <= pointsPerCorner; i++) {
    const angle = -Math.PI / 2 + (Math.PI / 2) * (i / pointsPerCorner);
    points.push({
      x: Math.round((maxX - r + Math.cos(angle) * r) * 10) / 10,
      y: Math.round((minY + r + Math.sin(angle) * r) * 10) / 10
    });
  }

  // Bottom-Right corner arc
  for (let i = 0; i <= pointsPerCorner; i++) {
    const angle = (Math.PI / 2) * (i / pointsPerCorner);
    points.push({
      x: Math.round((maxX - r + Math.cos(angle) * r) * 10) / 10,
      y: Math.round((maxY - r + Math.sin(angle) * r) * 10) / 10
    });
  }

  // Bottom-Left corner arc
  for (let i = 0; i <= pointsPerCorner; i++) {
    const angle = Math.PI / 2 + (Math.PI / 2) * (i / pointsPerCorner);
    points.push({
      x: Math.round((minX + r + Math.cos(angle) * r) * 10) / 10,
      y: Math.round((maxY - r + Math.sin(angle) * r) * 10) / 10
    });
  }

  // Top-Left corner arc
  for (let i = 0; i <= pointsPerCorner; i++) {
    const angle = Math.PI + (Math.PI / 2) * (i / pointsPerCorner);
    points.push({
      x: Math.round((minX + r + Math.cos(angle) * r) * 10) / 10,
      y: Math.round((minY + r + Math.sin(angle) * r) * 10) / 10
    });
  }

  return points;
}

export function isAxisAlignedBox(pts: { x: number; y: number }[]): boolean {
  if (!pts || (pts.length !== 4 && pts.length !== 5)) return false;
  const xs = new Set(pts.map(p => Math.round(p.x * 10) / 10));
  const ys = new Set(pts.map(p => Math.round(p.y * 10) / 10));
  return xs.size <= 2 && ys.size <= 2;
}

/**
 * Automatically adjusts parent container boundaries so scaled or moved child territories
 * are never clipped or covered by the parent boundary.
 */
export function autoAdjustParentContainerBounds(
  updatedTerr: Territory,
  allTerritories: Territory[]
): Territory[] {
  let updatedList = allTerritories.map(t => t.id === updatedTerr.id ? updatedTerr : t);

  if (updatedTerr.parentId) {
    const parentIdx = updatedList.findIndex(t => t.id === updatedTerr.parentId);
    if (parentIdx >= 0) {
      const parent = updatedList[parentIdx];
      const siblings = updatedList.filter(t => t.parentId === parent.id || t.id === updatedTerr.id);

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      siblings.forEach(child => {
        if (child.points && child.points.length >= 3) {
          child.points.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
          });
        } else {
          const r = child.radius || 10;
          if (child.x - r < minX) minX = child.x - r;
          if (child.x + r > maxX) maxX = child.x + r;
          if (child.y - r < minY) minY = child.y - r;
          if (child.y + r > maxY) maxY = child.y + r;
        }
      });

      const padding = 10;
      minX -= padding;
      maxX += padding;
      minY -= padding;
      maxY += padding;

      let parentNeedsExpansion = false;
      if (parent.points && parent.points.length >= 3) {
        const pxs = parent.points.map(p => p.x);
        const pys = parent.points.map(p => p.y);
        if (minX < Math.min(...pxs) || maxX > Math.max(...pxs) || minY < Math.min(...pys) || maxY > Math.max(...pys)) {
          parentNeedsExpansion = true;
        }
      } else {
        const pr = parent.radius || 30;
        if (minX < parent.x - pr || maxX > parent.x + pr || minY < parent.y - pr || maxY > parent.y + pr) {
          parentNeedsExpansion = true;
        }
      }

      if (parentNeedsExpansion) {
        const newCx = Math.round(((minX + maxX) / 2) * 10) / 10;
        const newCy = Math.round(((minY + maxY) / 2) * 10) / 10;
        const neededW = maxX - minX;
        const neededH = maxY - minY;
        const newRadius = Math.round(Math.max(neededW / 2, neededH / 2, parent.radius || 30) * 10) / 10;

        let newParentPoints: { x: number; y: number }[] | undefined = undefined;
        if (parent.points && parent.points.length > 4 && !isAxisAlignedBox(parent.points)) {
          const currPxs = parent.points.map(p => p.x);
          const currPys = parent.points.map(p => p.y);
          const currMinX = Math.min(...currPxs);
          const currMaxX = Math.max(...currPxs);
          const currMinY = Math.min(...currPys);
          const currMaxY = Math.max(...currPys);
          const currW = Math.max(1, currMaxX - currMinX);
          const currH = Math.max(1, currMaxY - currMinY);

          const scaleX = Math.max(1.0, neededW / currW);
          const scaleY = Math.max(1.0, neededH / currH);
          const scale = Math.max(scaleX, scaleY);

          const parentCx = (currMinX + currMaxX) / 2;
          const parentCy = (currMinY + currMaxY) / 2;

          newParentPoints = parent.points.map(p => ({
            x: Math.round((newCx + (p.x - parentCx) * scale) * 10) / 10,
            y: Math.round((newCy + (p.y - parentCy) * scale) * 10) / 10
          }));
        } else {
          // Generate a smooth rounded polygon with soft curved corners
          newParentPoints = generateSmoothRoundedBoxPoints(minX, minY, maxX, maxY, Math.min(16, neededW / 3, neededH / 3));
        }

        updatedList[parentIdx] = {
          ...parent,
          x: newCx,
          y: newCy,
          radius: newRadius,
          points: newParentPoints
        };
      }
    }
  }

  return updatedList;
}

export interface WorldMapBiomeDef {
  id: string;
  name: string;
  category: 'natur' | 'klima' | 'magisch' | 'gewaesser' | 'gelaende';
  color: string;
  innerFill: string;
  stroke: string;
  icon: string;
  labelColor: string;
  description: string;
}

export const WORLDMAP_BIOMES: WorldMapBiomeDef[] = [
  // Natur
  { id: 'gras', name: 'Grasland & Aue', category: 'natur', color: '#15803d', innerFill: '#166534', stroke: '#86efac', icon: '', labelColor: '#bbf7d0', description: 'Fruchtbare Ebenen und saftige Weiden' },
  { id: 'wald', name: 'Urwald & Laubwald', category: 'natur', color: '#065f46', innerFill: '#064e3b', stroke: '#34d399', icon: '', labelColor: '#6ee7b7', description: 'Dichte Baumkronen und tiefe Laub- & Mischwälder' },
  { id: 'dschungel', name: 'Dschungel & Tropen', category: 'natur', color: '#059669', innerFill: '#047857', stroke: '#10b981', icon: '', labelColor: '#6ee7b7', description: 'Tropischer dichter Regenwald mit exotischer Flora' },
  { id: 'taiga', name: 'Taiga & Herbstwald', category: 'natur', color: '#b45309', innerFill: '#92400e', stroke: '#f59e0b', icon: '', labelColor: '#fcd34d', description: 'Goldener Herbstwald und boreale Nadelzone' },
  { id: 'sumpf', name: 'Nebelmoor & Morast', category: 'natur', color: '#365314', innerFill: '#1a2e05', stroke: '#84cc16', icon: '', labelColor: '#bef264', description: 'Trübe Sümpfe, Sumpflichter und Nebelschwaden' },

  // Gelände
  { id: 'gebirge', name: 'Felsgebirge & Klippen', category: 'gelaende', color: '#334155', innerFill: '#1e293b', stroke: '#94a3b8', icon: '', labelColor: '#cbd5e1', description: 'Schroffe Bergmassive, Pässe und Steilhänge' },
  { id: 'hochland', name: 'Hochplateau & Felsen', category: 'gelaende', color: '#475569', innerFill: '#334155', stroke: '#cbd5e1', icon: '', labelColor: '#e2e8f0', description: 'Windgepeitschte Hochebene und Felsplateaus' },
  { id: 'vulkan', name: 'Vulkanglut & Lava', category: 'gelaende', color: '#292524', innerFill: '#7f1d1d', stroke: '#ef4444', icon: '', labelColor: '#fca5a5', description: 'Brodelnde Magmaströme, Basalt und Schwefeldämpfe' },
  { id: 'ruinen', name: 'Ruinenfeld & Gräber', category: 'gelaende', color: '#3f3f46', innerFill: '#27272a', stroke: '#e4e4e7', icon: '', labelColor: '#e4e4e7', description: 'Überreste uralter Zivilisationen und Nekropolen' },

  // Klima & Arid
  { id: 'wueste', name: 'Sandwüste & Dünen', category: 'klima', color: '#d97706', innerFill: '#b45309', stroke: '#fde047', icon: '', labelColor: '#fef08a', description: 'Glühende Sanddünen, Karawanenrouten und Canyons' },
  { id: 'savanne', name: 'Savanne & Steppe', category: 'klima', color: '#a16207', innerFill: '#854d0e', stroke: '#facc15', icon: '', labelColor: '#fef08a', description: 'Weite Steppenlandschaft, Akazien und Trockengras' },
  { id: 'schnee', name: 'Schneeöde & Gletscher', category: 'klima', color: '#f1f5f9', innerFill: '#cbd5e1', stroke: '#93c5fd', icon: '', labelColor: '#e0f2fe', description: 'Ewiges Eis, Permafrost und Schneefelder' },
  { id: 'tundra', name: 'Frosttundra & Eiswind', category: 'klima', color: '#64748b', innerFill: '#475569', stroke: '#38bdf8', icon: '', labelColor: '#bae6fd', description: 'Karge Moostundra mit eisigen Winden' },

  // Magisch & Arkan
  { id: 'zauberwald', name: 'Zauberhain & Pilzwald', category: 'magisch', color: '#6b21a8', innerFill: '#581c87', stroke: '#c084fc', icon: '', labelColor: '#e9d5ff', description: 'Mystischer Feenwald mit leuchtenden Sporen & Pilzen' },
  { id: 'kristall', name: 'Kristallwüste & Arkan', category: 'magisch', color: '#1e1b4b', innerFill: '#312e81', stroke: '#818cf8', icon: '', labelColor: '#c7d2fe', description: 'Arkane Energiefelder und schwebende Kristallsäulen' },
  { id: 'schatten', name: 'Schattenland & Verderbnis', category: 'magisch', color: '#18181b', innerFill: '#27272a', stroke: '#a855f7', icon: '', labelColor: '#d8b4fe', description: 'Verdorbene Erde, Geisternebel und finstere Mächte' },

  // Gewässer
  { id: 'wasser', name: 'Binnensee & Lagune', category: 'gewaesser', color: '#0284c7', innerFill: '#0369a1', stroke: '#38bdf8', icon: '', labelColor: '#bae6fd', description: 'Klares Quellwasser, Lagunen und Binnenseen' },
  { id: 'ozean', name: 'Tiefsee & Ozean', category: 'gewaesser', color: '#0c4a6e', innerFill: '#082f49', stroke: '#0284c7', icon: '', labelColor: '#7dd3fc', description: 'Tiefblaues Meer und offene Ozeane' }
];

export function getBiomeConfig(biomeOrType: string): WorldMapBiomeDef {
  const cleanId = (biomeOrType || '').replace('biome_', '').toLowerCase();
  const found = WORLDMAP_BIOMES.find(b => b.id === cleanId);
  if (found) return found;
  return WORLDMAP_BIOMES[0]; // fallback to gras
}

/**
 * Point-in-polygon test (standard ray casting algorithm)
 */
export function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Checks if a territory/place is geographically located inside a given zone/territory.
 */
export function isTerritoryInsideZone(
  child: Territory,
  zone: Territory,
  allTerritories: Territory[] = []
): boolean {
  if (!child || !zone || child.id === zone.id) return false;
  
  // World is root and cannot be inside anything
  if (child.type === 'welt') return false;

  // Major independent geographic entities (islands, continents, seas, kingdoms, regions)
  // are never treated as children of another territory for drag/movement grouping
  const isMajorIndependent = (t: Territory) =>
    t.type === 'insel' ||
    t.type === 'kontinent' ||
    t.type === 'meer' ||
    t.type === 'ozean' ||
    t.type === 'wasser' ||
    t.type === 'see' ||
    t.type === 'koenigreich' ||
    t.type === 'land' ||
    t.type === 'region' ||
    t.type === 'unabhaengiges_gebiet' ||
    t.type === 'unbekanntes_land' ||
    t.type === 'geografische_flaeche';

  if (isMajorIndependent(child)) {
    return false;
  }

  // Explicit parent link for sub-features (e.g. cities, fortresses, buildings on this island/continent)
  if (child.parentId === zone.id) return true;

  // If child already explicitly belongs to another specific territory, do not treat it as geographically inside this one.
  if (child.parentId && child.parentId !== zone.id && child.parentId !== 'welt-root') {
    return false;
  }

  const childPt = { x: child.x ?? 0, y: child.y ?? 0 };

  // 1. Hand-drawn polygon of zone
  if (zone.points && zone.points.length >= 3) {
    if (isPointInPolygon(childPt, zone.points)) {
      return true;
    }
  } else {
    // 2. Procedural template polygon / circle
    const organicRing = getTerritoryOrganicPoints(zone, 1.0, allTerritories);
    if (organicRing && organicRing.length >= 3) {
      if (isPointInPolygon(childPt, organicRing)) {
        return true;
      }
    } else if (zone.radius && zone.radius > 0) {
      const dist = Math.hypot((zone.x ?? 0) - childPt.x, (zone.y ?? 0) - childPt.y);
      if (dist <= zone.radius * 0.85) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Returns all child territories, settlements, rivers, fortresses and features
 * that are situated inside the given zone.
 */
export function getContainedTerritories(
  parentZone: Territory,
  allTerritories: Territory[]
): Territory[] {
  if (!parentZone || !allTerritories) return [];
  return allTerritories.filter(t => isTerritoryInsideZone(t, parentZone, allTerritories));
}

/**
 * Moves a territory and its direct sub-elements (settlements, POIs) by the given delta.
 * Independent territories (islands, continents, seas) are never dragged along.
 */
export function moveTerritoryWithChildren(
  targetTerritoryId: string,
  newX: number,
  newY: number,
  allTerritories: Territory[]
): Territory[] {
  const target = allTerritories.find(t => t.id === targetTerritoryId);
  if (!target) return allTerritories;

  const dx = Math.round((newX - (target.x ?? 0)) * 10) / 10;
  const dy = Math.round((newY - (target.y ?? 0)) * 10) / 10;

  if (dx === 0 && dy === 0) return allTerritories;

  // Major independent territories must NEVER move as a side effect
  const isMajorIndependent = (t: Territory) =>
    t.type === 'insel' ||
    t.type === 'kontinent' ||
    t.type === 'meer' ||
    t.type === 'ozean' ||
    t.type === 'wasser' ||
    t.type === 'see' ||
    t.type === 'welt' ||
    t.type === 'koenigreich' ||
    t.type === 'land' ||
    t.type === 'region' ||
    t.type === 'unabhaengiges_gebiet' ||
    t.type === 'unbekanntes_land' ||
    t.type === 'geografische_flaeche';

  // Find direct child settlements/POIs belonging exclusively to this target
  const containedIds = new Set<string>();
  allTerritories.forEach(t => {
    if (t.id === target.id) return;

    // Explicit parent link (e.g. sub-seas, or cities located on this island/continent)
    if (t.parentId === target.id) {
      containedIds.add(t.id);
      return;
    }

    if (isMajorIndependent(t)) return;

    // Micro-elements (settlements, fortresses, buildings) geographically inside this landmass
    if (
      (t.type === 'stadt' || t.type === 'dorf' || t.type === 'gebäude' || t.type === 'festung' || t.type === 'hafen' || t.type === 'ort' || t.type === 'poi' || t.type.startsWith('biome_')) &&
      isTerritoryInsideZone(t, target, allTerritories)
    ) {
      containedIds.add(t.id);
    }
  });

  return allTerritories.map(t => {
    if (t.id === target.id) {
      let newPoints = t.points;
      if (newPoints && newPoints.length >= 2) {
        newPoints = newPoints.map(p => ({
          x: Math.round((p.x + dx) * 10) / 10,
          y: Math.round((p.y + dy) * 10) / 10
        }));
      }
      return {
        ...t,
        x: newX,
        y: newY,
        points: newPoints
      };
    }

    if (containedIds.has(t.id)) {
      const childNewX = Math.round(((t.x ?? 0) + dx) * 10) / 10;
      const childNewY = Math.round(((t.y ?? 0) + dy) * 10) / 10;
      let newPoints = t.points;
      if (newPoints && newPoints.length >= 2) {
        newPoints = newPoints.map(p => ({
          x: Math.round((p.x + dx) * 10) / 10,
          y: Math.round((p.y + dy) * 10) / 10
        }));
      }
      return {
        ...t,
        x: childNewX,
        y: childNewY,
        points: newPoints
      };
    }

    return t;
  });
}

export function pointsToSvgPath(points: { x: number; y: number }[], smooth: boolean = true): string {
  if (!points || points.length === 0) return '';
  
  const cacheKey = points.map(p => `${p.x},${p.y}`).join(';') + (smooth ? '_s' : '_r');
  const cached = svgPathCache.get(cacheKey);
  if (cached) return cached;

  if (points.length < 3) {
    const simple = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
    svgPathCache.set(cacheKey, simple);
    return simple;
  }
  
  if (!smooth || points.length < 4) {
    const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')} Z`;
    svgPathCache.set(cacheKey, d);
    return d;
  }

  // Smooth curved path like hand-drawn zones
  const startMidX = (points[0].x + points[1].x) / 2;
  const startMidY = (points[0].y + points[1].y) / 2;
  let d = `M ${startMidX.toFixed(1)},${startMidY.toFixed(1)} `;
  for (let i = 0; i < points.length; i++) {
    const curr = points[(i + 1) % points.length];
    const next = points[(i + 2) % points.length];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    d += `Q ${curr.x.toFixed(1)},${curr.y.toFixed(1)} ${midX.toFixed(1)},${midY.toFixed(1)} `;
  }
  d += 'Z';

  if (svgPathCache.size > 2000) {
    svgPathCache.clear();
  }
  svgPathCache.set(cacheKey, d);
  return d;
}

export type BorderAdaptationMode = 'selected_only' | 'all' | 'off';

/**
 * Generates an organic polygon ring [ [x, y], ... ] for a territory,
 * dynamically conforming to all adjacent land & sea neighbors.
 */
export function getTerritoryPolygonRing(
  terr: Territory,
  scale: number = 1.0,
  roughnessOverride?: number,
  allTerritories: Territory[] = [],
  selectedTerritoryId?: string | null,
  adaptationMode: BorderAdaptationMode = 'selected_only'
): [number, number][] {
  const points = getTerritoryOrganicPoints(terr, scale, allTerritories, selectedTerritoryId, adaptationMode);
  const ring: [number, number][] = points.map(p => [p.x, p.y]);
  if (ring.length > 0) {
    ring.push([ring[0][0], ring[0][1]]);
  }
  return ring;
}

/**
 * Converts a polygon ring into SVG path `d`
 */
export function ringToSvgPath(pts: [number, number][], smooth: boolean = false): string {
  if (!pts || pts.length < 3) return '';
  const clean = pts.slice();
  if (clean.length > 3 && clean[0][0] === clean[clean.length - 1][0] && clean[0][1] === clean[clean.length - 1][1]) {
    clean.pop();
  }
  if (clean.length < 3) return '';

  if (!smooth || clean.length < 4) {
    return `M ${clean.map(p => `${p[0]},${p[1]}`).join(' L ')} Z`;
  }

  let d = `M ${(clean[0][0] + clean[1][0]) / 2},${(clean[0][1] + clean[1][1]) / 2} `;
  for (let i = 0; i < clean.length; i++) {
    const curr = clean[(i + 1) % clean.length];
    const next = clean[(i + 2) % clean.length];
    const midX = (curr[0] + next[0]) / 2;
    const midY = (curr[1] + next[1]) / 2;
    d += `Q ${curr[0]},${curr[1]} ${midX},${midY} `;
  }
  return d + 'Z';
}

/**
 * Converts MultiPolygon from polygon-clipping to SVG path string `d`
 */
export function multiPolyToSvgPath(multiPoly: any, smooth: boolean = false): string {
  if (!multiPoly || !Array.isArray(multiPoly) || multiPoly.length === 0) return '';
  return multiPoly
    .map((polygon: any) =>
      Array.isArray(polygon)
        ? polygon.map((ring: any) => ringToSvgPath(ring, smooth)).join(' ')
        : ''
    )
    .join(' ')
    .trim();
}

export interface SeaGeometryResult {
  path: string;
  hasOverlappingLand: boolean;
  overlappingLandIds: string[];
}

export interface CoastlineContact {
  adjacentSea: Territory;
  contactAngle: number;
  contactPoint: { x: number; y: number };
  distance: number;
}

export interface CoastlineData {
  mainCoastPath: string;
  shallowWaterGlowPath: string;
  waveRipple1Path: string;
  waveRipple2Path: string;
  beachRimPath: string;
  hasWaterContact: boolean;
}

export function isLandTerritory(terr: Territory): boolean {
  if (!terr || !terr.type) return false;
  return (
    terr.type === 'kontinent' ||
    terr.type === 'koenigreich' ||
    terr.type === 'land' ||
    terr.type === 'region' ||
    terr.type === 'unabhaengiges_gebiet' ||
    terr.type === 'unbekanntes_land' ||
    terr.type === 'geografische_flaeche' ||
    terr.type === 'insel' ||
    terr.type.startsWith('biome_')
  );
}

export function isSeaTerritory(terr: Territory): boolean {
  if (!terr || !terr.type) return false;
  return terr.type === 'meer' || terr.type === 'ozean' || terr.type === 'wasser' || terr.type === 'see';
}

export interface BorderNeighbor {
  x: number;
  y: number;
  radius: number;
  seed?: number;
  isLand?: boolean;
  staticPoints?: { x: number; y: number }[];
}

/**
 * Calculates ray intersection distance with a static polygon.
 */
function getRayPolygonIntersection(
  cx: number,
  cy: number,
  angle: number,
  polyPoints: { x: number; y: number }[]
): number | null {
  if (!polyPoints || polyPoints.length < 3) return null;

  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let minDist: number | null = null;

  for (let i = 0; i < polyPoints.length; i++) {
    const p1 = polyPoints[i];
    const p2 = polyPoints[(i + 1) % polyPoints.length];

    const vx = p2.x - p1.x;
    const vy = p2.y - p1.y;

    const det = dy * vx - dx * vy;
    if (Math.abs(det) < 1e-6) continue;

    const lambda = ((p1.x - cx) * (-vy) - (p1.y - cy) * (-vx)) / det;
    const t = (dx * (p1.y - cy) - dy * (p1.x - cx)) / det;

    if (lambda > 0.5 && t >= -0.05 && t <= 1.05) {
      if (minDist === null || lambda < minDist) {
        minDist = lambda;
      }
    }
  }

  return minDist;
}

/**
 * Generates natural, organic polygon points based on the 8 LandShapeTemplates defined in the System Instructions.
 * Seamlessly and dynamically conforms shared borders when territories are placed adjacent to each other.
 */
export function createShapeTemplatePoints(
  cx: number,
  cy: number,
  radius: number,
  template: string = 'organisch',
  seed: number = 42,
  scale: number = 1.0,
  roughness: number = 0.5,
  openDirection: string = 'none',
  neighbors: BorderNeighbor[] = []
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const effectiveRadius = radius * scale;
  const numVertices = Math.max(20, Math.min(36, Math.round(20 + roughness * 16)));

  const dirAngles: Record<string, number> = {
    east: 0,
    southeast: Math.PI / 4,
    south: Math.PI / 2,
    southwest: (3 * Math.PI) / 4,
    west: Math.PI,
    northwest: (5 * Math.PI) / 4,
    north: (3 * Math.PI) / 2,
    northeast: (7 * Math.PI) / 4
  };
  const targetAngle = dirAngles[openDirection] !== undefined ? dirAngles[openDirection] : null;

  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI;
    let varFactor = 1.0;

    switch (template) {
      case 'rund': {
        // Smooth circular / gentle oval contour
        const harmonic = Math.sin(seed * 1.3 + i * 1.5) * (0.08 + roughness * 0.12);
        varFactor = 1.0 + harmonic;
        break;
      }
      case 'laenglich': {
        // Elongated oblong shape with articulated jagged tips
        const elongation = Math.cos(angle * 2 + (seed % 3.14)) * 0.45;
        const noise = Math.sin(seed * 1.7 + i * 2.3) * (0.15 + roughness * 0.25);
        varFactor = 1.0 + elongation + noise;
        break;
      }
      case 'schmal': {
        // Narrow land bridge / isthmus / slender peninsula
        const narrowness = Math.cos(angle * 2 + (seed % 1.57)) * 0.65;
        const noise = Math.sin(seed * 2.1 + i * 3.1) * (0.15 + roughness * 0.2);
        varFactor = Math.max(0.35, 1.0 + narrowness + noise);
        break;
      }
      case 'grossflaechig': {
        // Expansive continental / imperial landmass with dramatic pointy capes and fjords
        const lobe1 = Math.sin(angle * 3 + seed) * (0.28 + roughness * 0.25);
        const lobe2 = Math.cos(angle * 2 + seed * 2) * 0.22;
        const microNoise = Math.sin(seed * 3.7 + i * 4.1) * (0.14 + roughness * 0.2);
        varFactor = 1.1 + lobe1 + lobe2 + microNoise;
        break;
      }
      case 'insel': {
        // Natural island contour with pointy peninsulas and reef bays
        const bay1 = Math.sin(seed * 1.5 + i * 2.4) * (0.25 + roughness * 0.35);
        const bay2 = Math.cos(seed * 2.8 + i * 3.7) * (0.16 + roughness * 0.2);
        varFactor = 0.95 + bay1 + bay2;
        break;
      }
      case 'kuestengebiet': {
        // Coastal zone: smooth seaward arc and articulated pointy landward boundary
        const seaward = Math.sin(angle) * 0.35;
        const noise = Math.sin(seed * 1.9 + i * 2.7) * (0.18 + roughness * 0.25);
        varFactor = 1.0 + seaward + noise;
        break;
      }
      case 'binnengebiet': {
        // Landlocked inland region: distinct faceted borders & mountain ridges
        const facet = Math.sin(angle * 4 + seed) * (0.18 + roughness * 0.2);
        const noise = Math.cos(seed * 1.1 + i * 2.1) * (0.14 + roughness * 0.15);
        varFactor = 0.98 + facet + noise;
        break;
      }
      case 'organisch':
      default: {
        // Default dramatic pointy & jagged fantasy contour (capes, fjords, pointy land lobes)
        const rFactor = 0.5 + roughness * 0.8;
        const harmonic1 = Math.sin((seed * 1.7) + i * 2.1) * (0.24 * rFactor);
        const harmonic2 = Math.cos((seed * 3.1) + i * 4.3) * (0.16 * rFactor);
        const harmonic3 = Math.sin((seed * 0.9) + i * 1.1) * (0.12 * rFactor);
        varFactor = 0.95 + harmonic1 + harmonic2 + harmonic3;
        break;
      }
    }

    // Directional coastal stretch / open sea expansion
    if (targetAngle !== null) {
      let angleDiff = Math.abs(angle - targetAngle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      const dirAlignment = Math.cos(angleDiff);
      varFactor += dirAlignment * 0.35;
    }

    varFactor = Math.max(0.35, Math.min(2.4, varFactor));
    let r = effectiveRadius * varFactor;

    // DYNAMIC BORDER ADAPTATION:
    // Conforms this territory's boundary seamlessly along the shared dividing plane
    // between adjacent territories, eliminating gaps and overlaps with zero spikes.
    if (neighbors && neighbors.length > 0) {
      for (const n of neighbors) {
        if (!n || !n.radius) continue;
        const dx = n.x - cx;
        const dy = n.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.1 || dist > (effectiveRadius + n.radius) * 1.35) continue;

        const neighborAngle = Math.atan2(dy, dx);
        let delta = angle - neighborAngle;
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;

        const contactSpan = Math.min(1.25, Math.asin(Math.min(0.9, n.radius / dist)) * 1.25);

        if (Math.abs(delta) < contactSpan) {
          // Proportional contact distance along the line connecting the two territory centers
          const dContact = dist * (effectiveRadius / (effectiveRadius + n.radius));

          // Radius from center (cx, cy) along direction `angle` to the straight dividing line
          const cosDelta = Math.max(0.35, Math.cos(delta));
          let targetR = dContact / cosDelta;

          // Strictly clamp targetR to prevent any spike creation or deep penetration
          targetR = Math.min(targetR, dist * 0.95, effectiveRadius * 1.35);
          targetR = Math.max(effectiveRadius * 0.3, targetR);

          // Smooth cosine blend factor (1 at center of contact zone, 0 at edge)
          const blendT = 0.5 + 0.5 * Math.cos((delta / contactSpan) * Math.PI);

          // Blend current organic radius smoothly into the target contact radius
          r = (1 - blendT) * r + blendT * targetR;
        }
      }
    }

    const px = Math.round((cx + Math.cos(angle) * r) * 10) / 10;
    const py = Math.round((cy + Math.sin(angle) * r) * 10) / 10;
    points.push({ x: px, y: py });
  }

  return points;
}

/**
 * Calculates authentic coordinates for a new territory relative to an existing anchor territory.
 */
export function computeSpatialRelationPosition(
  anchor: Territory,
  relationType: 'noerdlich_von' | 'suedlich_von' | 'oestlich_von' | 'westlich_von' | 'grenzt_direkt_an' | 'getrennt_durch_meer' | 'insel' | 'innerhalb',
  newRadius: number,
  allTerritories: Territory[] = []
): { x: number; y: number } {
  const anchorR = anchor.radius || (anchor.type === 'kontinent' ? 35 : anchor.type === 'insel' ? 15 : 12);
  const totalR = anchorR + newRadius;

  let posX = anchor.x;
  let posY = anchor.y;

  switch (relationType) {
    case 'noerdlich_von':
      posX = anchor.x + (Math.random() * 6 - 3);
      posY = Math.max(12, anchor.y - totalR * 0.92);
      break;
    case 'suedlich_von':
      posX = anchor.x + (Math.random() * 6 - 3);
      posY = Math.min(130, anchor.y + totalR * 0.92);
      break;
    case 'oestlich_von':
      posX = Math.min(228, anchor.x + totalR * 0.92);
      posY = anchor.y + (Math.random() * 6 - 3);
      break;
    case 'westlich_von':
      posX = Math.max(12, anchor.x - totalR * 0.92);
      posY = anchor.y + (Math.random() * 6 - 3);
      break;
    case 'grenzt_direkt_an': {
      // Snaps directly to the nearest free edge to form a continuous connected landmass
      const angle = (anchor.seed ?? 42) % (Math.PI * 2);
      posX = anchor.x + Math.cos(angle) * (totalR * 0.88);
      posY = anchor.y + Math.sin(angle) * (totalR * 0.88);
      break;
    }
    case 'getrennt_durch_meer': {
      // Separated by an ocean channel (adds a 14-unit sea water gap)
      const angle = (anchor.seed ?? 42) % (Math.PI * 2);
      const seaGap = 14;
      posX = anchor.x + Math.cos(angle) * (totalR + seaGap);
      posY = anchor.y + Math.sin(angle) * (totalR + seaGap);
      break;
    }
    case 'insel': {
      // Offshore island situated in open waters
      const angle = ((anchor.seed ?? 42) * 1.7) % (Math.PI * 2);
      const islandDist = totalR + 18;
      posX = anchor.x + Math.cos(angle) * islandDist;
      posY = anchor.y + Math.sin(angle) * islandDist;
      break;
    }
    case 'innerhalb': {
      // Sub-region or enclave inside anchor territory
      posX = anchor.x + (Math.random() * (anchorR * 0.4) - anchorR * 0.2);
      posY = anchor.y + (Math.random() * (anchorR * 0.4) - anchorR * 0.2);
      break;
    }
  }

  posX = Math.round(posX * 10) / 10;
  posY = Math.round(posY * 10) / 10;

  return { x: posX, y: posY };
}

/**
 * Returns authentic organic points for any territory, respecting its LandShapeTemplate
 * and dynamically conforming to neighboring land/sea boundaries.
 */
export function getTerritoryOrganicPoints(
  terr: Territory,
  scale: number = 1.0,
  allTerritories: Territory[] = [],
  selectedTerritoryId?: string | null,
  adaptationMode: BorderAdaptationMode = 'all'
): { x: number; y: number }[] {
  // If territory has custom points from drawing or bounds, use them (smoothing axis-aligned boxes into rounded shapes)
  if (terr.points && terr.points.length >= 3) {
    let effectivePts = terr.points;

    // Check if points are normalized offsets around (0, 0) rather than absolute map coordinates
    const numPts = effectivePts.length;
    const avgX = effectivePts.reduce((acc, p) => acc + (p?.x || 0), 0) / numPts;
    const avgY = effectivePts.reduce((acc, p) => acc + (p?.y || 0), 0) / numPts;
    const distFromOrigin = Math.hypot(avgX, avgY);
    const distFromCenter = Math.hypot(avgX - (terr.x || 50), avgY - (terr.y || 50));

    if (distFromOrigin < 6 && (terr.x > 8 || terr.y > 8) && distFromCenter > 6) {
      const effRadius = terr.radius || (terr.type === 'kontinent' ? 35 : terr.type === 'insel' ? 20 : 15);
      effectivePts = effectivePts.map(p => ({
        x: Math.round(((terr.x || 50) + (p.x || 0) * effRadius) * 10) / 10,
        y: Math.round(((terr.y || 50) + (p.y || 0) * effRadius) * 10) / 10
      }));
    }

    if (isAxisAlignedBox(effectivePts)) {
      const xs = effectivePts.map(p => p.x);
      const ys = effectivePts.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const w = maxX - minX;
      const h = maxY - minY;
      effectivePts = generateSmoothRoundedBoxPoints(minX, minY, maxX, maxY, Math.min(12, w / 3, h / 3));
    }
    if (scale === 1.0) return effectivePts;
    const cx = terr.x || 50;
    const cy = terr.y || 50;
    return effectivePts.map(p => ({
      x: Math.round((cx + (p.x - cx) * scale) * 10) / 10,
      y: Math.round((cy + (p.y - cy) * scale) * 10) / 10
    }));
  }
  const baseRadius = (terr.radius || (terr.type === 'kontinent' ? 35 : terr.type === 'meer' ? 40 : terr.type === 'insel' ? 15 : 24)) * scale;
  const roughness = terr.coastlineRoughness ?? (terr.type === 'meer' ? 0.35 : 0.4);
  const openDir = terr.coastOpenDirection || 'none';
  const seed = terr.seed ?? 42;
  const template = terr.landShapeTemplate || (terr.type === 'insel' ? 'insel' : terr.type === 'kontinent' ? 'grossflaechig' : 'organisch');

  // Should this territory perform border adaptation?
  // In 'selected_only' mode: ONLY the selected territory adapts its shape to its static neighbors!
  const shouldAdapt =
    adaptationMode === 'all' ||
    (adaptationMode === 'selected_only' && Boolean(selectedTerritoryId) && terr.id === selectedTerritoryId);

  // Find index of current territory in allTerritories array
  const currIndex = allTerritories.findIndex(t => t.id === terr.id);

  // Find land & sea neighbors to seamlessly conform shared borders
  let neighbors: BorderNeighbor[] = [];
  if (shouldAdapt && allTerritories && allTerritories.length > 0) {
    neighbors = allTerritories
      .filter((other, idx) => {
        if (!other || other.id === terr.id) return false;

        // Fundamental Rule: Existing territories must NOT be altered when new territories are added.
        // A territory only adapts to neighbors that were created BEFORE it (or lower array index).
        if (currIndex >= 0 && idx > currIndex) {
          return false;
        }

        const otherRadius = (other.radius || (other.type === 'kontinent' ? 35 : other.type === 'meer' ? 40 : 24)) * scale;
        const dx = other.x - terr.x;
        const dy = other.y - terr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const isExplicitDirect =
          (terr.spatialRelation?.targetTerritoryId === other.id && terr.spatialRelation.relationType === 'grenzt_direkt_an') ||
          (other.spatialRelation?.targetTerritoryId === terr.id && other.spatialRelation.relationType === 'grenzt_direkt_an');

        return isExplicitDirect || (dist < (baseRadius + otherRadius) * 1.35);
      })
      .map(other => {
        const otherRadius = (other.radius || (other.type === 'kontinent' ? 35 : other.type === 'meer' ? 40 : 24)) * scale;
        return {
          x: other.x,
          y: other.y,
          radius: otherRadius,
          seed: other.seed ?? 42,
          isLand: isLandTerritory(other)
        };
      });
  }

  return createShapeTemplatePoints(terr.x, terr.y, baseRadius, template, seed, 1.0, roughness, openDir, neighbors);
}

export interface ConformedTerritoryResult {
  path: string;
  points: { x: number; y: number }[];
  isClipped: boolean;
  multiPoly?: any;
}

export function getTerritoryLayer(type: string): number {
  if (type === 'meer' || type === 'ozean' || type === 'wasser') return 0;
  if (type === 'kontinent' || type === 'insel') return 1;
  if (type === 'region' || type === 'geografische_flaeche' || type === 'unbekanntes_land') return 2;
  if (type === 'koenigreich' || type === 'land' || type === 'unabhaengiges_gebiet') return 3;
  if (type === 'zone' || type === 'see' || type.startsWith('biome_')) return 4;
  if (type === 'fluss' || type === 'weg') return 5;
  return 6; // stadt, dorf, festung, etc.
}

/**
 * Computes non-overlapping conformed geometry for ANY territory (drawn or template):
 * - Constrains it to its parent territory (intersection) so it doesn't spill over.
 * - Subtracts older peers of the SAME layer so they don't overlap each other.
 */
export function getConformedTerritoryGeometry(
  terr: Territory,
  allTerritories: Territory[] = [],
  selectedTerritoryId: string | null = null
): ConformedTerritoryResult {
  if (!terr) {
    return { path: '', points: [], isClipped: false };
  }

  const myRing = getTerritoryPolygonRing(terr, 1.0, undefined, allTerritories, null, 'all');

  if (!myRing || myRing.length < 4) {
    const rawPts = terr.points || [];
    const simplePoly = [[[...rawPts.map(p => [p.x, p.y] as [number, number]), [rawPts[0]?.x ?? 0, rawPts[0]?.y ?? 0]]]];
    return { path: pointsToSvgPath(rawPts), points: rawPts, isClipped: false, multiPoly: simplePoly };
  }

  // Sea layers aren't clipped by landmasses here (this is handled in getConformedSeaGeometry)
  // But they CAN be subtracted by older seas to prevent overlap!
  const isSea = terr.type === 'meer' || terr.type === 'ozean' || terr.type === 'wasser';

  const myLayer = getTerritoryLayer(terr.type);
  const currIndex = allTerritories.findIndex(t => t.id === terr.id);

  let currentPoly: any = [myRing];
  let isClipped = false;

  try {
    // 1. Constrain to Parent (Intersection) - "Nicht über die Grenze zeichnen"
    // Independent landmasses (islands, continents) are never clipped to a parent container
    const isMajorLand = terr.type === 'insel' || terr.type === 'kontinent';
    if (terr.parentId && !isSea && !isMajorLand) {
      const parent = allTerritories.find(t => t.id === terr.parentId);
      // Only constrain if parent is lower layer (e.g. continent)
      if (parent && getTerritoryLayer(parent.type) < myLayer && parent.shapeType !== 'circle') {
        const parentRing = getTerritoryPolygonRing(parent, 1.0, undefined, allTerritories, null, 'all');
        if (parentRing && parentRing.length >= 4) {
          const intersection = polygonClipping.intersection(currentPoly, [parentRing]);
          if (intersection && intersection.length > 0) {
            currentPoly = intersection;
            isClipped = true;
          }
        }
      }
    }

    // 2. Subtract older peers (Same layer) to prevent overlap among siblings
    if (!isMajorLand) {
      const olderPeers = allTerritories.filter((other, idx) => {
        if (!other || !other.id || other.id === terr.id) return false;
        // Do not subtract older peers when territory is selected so scaling is never covered or cut off
        if (selectedTerritoryId && terr.id === selectedTerritoryId) return false;
        // Only clip against territories placed BEFORE it (lower index)
        if (currIndex >= 0 && idx >= currIndex) return false;
        return getTerritoryLayer(other.type) === myLayer;
      });

      const olderPeerPolys = olderPeers
        .map(other => {
          const ring = getTerritoryPolygonRing(other, 1.0, undefined, allTerritories, null, 'all');
          return ring && ring.length >= 4 ? [ring] : null;
        })
        .filter((poly): poly is [number, number][][] => poly !== null);

      if (olderPeerPolys.length > 0) {
        const diff = polygonClipping.difference(currentPoly, ...(olderPeerPolys as any));
        if (diff && diff.length > 0) {
          currentPoly = diff;
          isClipped = true;
        }
      }
    }

    const firstPoly = currentPoly[0];
    const mainRing = firstPoly && firstPoly[0] ? firstPoly[0] : myRing;
    const cleanPts = mainRing.slice(0, -1).map(p => ({
      x: Math.round(p[0] * 10) / 10,
      y: Math.round(p[1] * 10) / 10
    }));

    return { path: multiPolyToSvgPath(currentPoly, false), points: cleanPts, isClipped, multiPoly: currentPoly };
  } catch (err) {
    console.warn("Polygon clipping fallback in getConformedTerritoryGeometry:", err);
  }

  const rawPts = myRing.slice(0, -1).map(p => ({ x: p[0], y: p[1] }));
  return { path: ringToSvgPath(myRing, false), points: rawPts, isClipped: false, multiPoly: [myRing] };
}

/**
 * Generates automatic coastlines, shallow water shelves, and concentric surf ripples
 * whenever a landmass is placed on the ocean or adjacent to sea zones.
 */
export function getAutomaticCoastline(
  terr: Territory,
  allTerritories: Territory[] = [],
  selectedTerritoryId?: string | null,
  adaptationMode: BorderAdaptationMode = 'all'
): CoastlineData {
  const conformed = getConformedTerritoryGeometry(terr, allTerritories);
  const mainCoastPath = conformed.path || pointsToSvgPath(getTerritoryOrganicPoints(terr, 1.0, allTerritories, selectedTerritoryId, adaptationMode));

  const beachPoints = getTerritoryOrganicPoints(terr, 1.04, allTerritories, selectedTerritoryId, adaptationMode);
  const shallowPoints = getTerritoryOrganicPoints(terr, 1.12, allTerritories, selectedTerritoryId, adaptationMode);
  const wave1Points = getTerritoryOrganicPoints(terr, 1.20, allTerritories, selectedTerritoryId, adaptationMode);
  const wave2Points = getTerritoryOrganicPoints(terr, 1.28, allTerritories, selectedTerritoryId, adaptationMode);

  const beachRimPath = pointsToSvgPath(beachPoints);
  const shallowWaterGlowPath = pointsToSvgPath(shallowPoints);
  const waveRipple1Path = pointsToSvgPath(wave1Points);
  const waveRipple2Path = pointsToSvgPath(wave2Points);

  // Check if touching any explicit sea territory or simply situated in the world ocean
  const contacts = getCoastlineContacts(terr, allTerritories);
  const hasWaterContact = contacts.length > 0 || terr.type === 'insel' || terr.type === 'kontinent';

  return {
    mainCoastPath,
    shallowWaterGlowPath,
    waveRipple1Path,
    waveRipple2Path,
    beachRimPath,
    hasWaterContact
  };
}

/**
 * Computes sea geometry dynamically:
 * When landmasses (continents, islands, biomes) meet or overlap the sea zone,
 * the sea automatically subtracts the landmasses so the water flows seamlessly
 * right up to the land's coastline with 0 overlap and 0 gaps.
 */
export function getConformedSeaGeometry(
  seaTerr: Territory,
  allTerritories: Territory[],
  selectedTerritoryId?: string | null,
  adaptationMode: BorderAdaptationMode = 'selected_only'
): SeaGeometryResult {
  // If territory has custom hand-drawn points, render them directly without clipping against each other
  // But we still clip them against land!
  
  const seaRing = getTerritoryPolygonRing(seaTerr, 1.0, undefined, allTerritories, selectedTerritoryId, adaptationMode);
  
  if (!seaRing || seaRing.length < 4) {
    const rawPts = seaTerr.points || [];
    return {
      path: pointsToSvgPath(rawPts),
      hasOverlappingLand: false,
      overlappingLandIds: []
    };
  }

  const seaRadius = seaTerr.radius || 40;

  // Find all landmasses that touch or intersect this sea zone
  const overlappingLands = allTerritories.filter(t => {
    if (!t || t.id === seaTerr.id || !isLandTerritory(t)) return false;
    const landRadius = t.radius || (t.type === 'kontinent' ? 35 : t.type === 'insel' ? 15 : 8);
    const dx = t.x - seaTerr.x;
    const dy = t.y - seaTerr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (seaRadius + landRadius + 8);
  });

  if (overlappingLands.length === 0) {
    return {
      path: ringToSvgPath(seaRing, false),
      hasOverlappingLand: false,
      overlappingLandIds: []
    };
  }

  const landPolys = overlappingLands.map(l => [getTerritoryPolygonRing(l, 1.0, undefined, allTerritories, selectedTerritoryId, adaptationMode)]);
  const overlappingLandIds = overlappingLands.map(l => l.id);

  try {
    const diff = polygonClipping.difference([seaRing], ...landPolys as any);
    const path = multiPolyToSvgPath(diff, false) || ringToSvgPath(seaRing, false);
    return {
      path,
      hasOverlappingLand: true,
      overlappingLandIds
    };
  } catch (err) {
    return {
      path: ringToSvgPath(seaRing, false),
      hasOverlappingLand: false,
      overlappingLandIds: []
    };
  }
}

/**
 * Detects whether a land territory touches or is surrounded by sea territories.
 */
export function getCoastlineContacts(
  terr: Territory,
  allTerritories: Territory[]
): CoastlineContact[] {
  if (!isLandTerritory(terr)) return [];

  const r1 = terr.radius || (terr.type === 'kontinent' ? 35 : terr.type === 'insel' ? 15 : 8);
  const contacts: CoastlineContact[] = [];

  for (const other of allTerritories) {
    if (!other || other.id === terr.id || !isSeaTerritory(other)) continue;
    const r2 = other.radius || 40;
    const contactDistance = r1 + r2;

    const dx = other.x - terr.x;
    const dy = other.y - terr.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If touching or overlapping within sea boundary
    if (dist <= contactDistance + 4.0) {
      const angle = Math.atan2(dy, dx);
      const contactPoint = {
        x: Math.round((terr.x + Math.cos(angle) * (r1 * 0.95)) * 10) / 10,
        y: Math.round((terr.y + Math.sin(angle) * (r1 * 0.95)) * 10) / 10
      };
      contacts.push({
        adjacentSea: other,
        contactAngle: angle,
        contactPoint,
        distance: dist
      });
    }
  }

  return contacts;
}

/**
 * Clean, unhindered drag positioning within the nautical coordinate system.
 * Allows fluid, exact placement of islands, continents, and territories.
 */
export function resolveDragCollision(
  draggingTerr: Territory,
  targetX: number,
  targetY: number,
  allTerritories: Territory[] = []
): { x: number; y: number } {
  // Completely unrestricted positioning across the infinite map
  return {
    x: Math.round(targetX * 10) / 10,
    y: Math.round(targetY * 10) / 10
  };
}

/**
 * Generates organic vertices that dynamically conform to adjacent puzzle pieces (e.g. land conforming to sea boundaries).
 */
export function createPuzzleConformedPoints(
  terr: Territory,
  allTerritories: Territory[],
  seed: number,
  scale: number = 1.0
): { x: number; y: number }[] {
  const baseRadius = (terr.radius || (terr.type === 'kontinent' ? 35 : terr.type === 'insel' ? 15 : terr.type === 'meer' ? 40 : 8)) * scale;
  const roughness = terr.coastlineRoughness ?? 0.5;
  const openDir = terr.coastOpenDirection || 'none';
  const currentSeed = terr.seed ?? seed;

  return createOrganicIslandPoints(terr.x, terr.y, baseRadius, currentSeed, 1.0, roughness, openDir);
}

export type SectorType = 'north_quadrant' | 'east_quadrant' | 'west_quadrant' | 'south_quadrant' | 'central_quadrant';

export interface SectorBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  parentId: string;
}

export const SECTOR_BOUNDS_MAP: Record<SectorType, SectorBounds> = {
  north_quadrant: { minX: 16, maxX: 108, minY: 12, maxY: 56, parentId: 'terr-sea-nordmeer' },
  east_quadrant: { minX: 132, maxX: 228, minY: 12, maxY: 56, parentId: 'terr-sea-ostmeer' },
  west_quadrant: { minX: 16, maxX: 108, minY: 84, maxY: 130, parentId: 'terr-sea-westmeer' },
  south_quadrant: { minX: 132, maxX: 228, minY: 84, maxY: 130, parentId: 'terr-sea-suedmeer' },
  central_quadrant: { minX: 80, maxX: 160, minY: 55, maxY: 85, parentId: 'terr-sea-zentral' }
};

/**
 * Classifies a place from the Codex into its canonical geographic sector.
 */
export function classifyMaritimeSector(
  name: string,
  desc: string = '',
  parentName?: string,
  extraDetails?: Record<string, any>
): SectorType {
  const text = `${name} ${desc} ${parentName || ''} ${extraDetails?.sea || ''} ${extraDetails?.region || ''} ${extraDetails?.ocean || ''}`.toLowerCase();

  if (text.includes('ost') || text.includes('east') || text.includes('morgenland')) return 'east_quadrant';
  if (text.includes('west') || text.includes('abendland')) return 'west_quadrant';
  if (text.includes('nord') || text.includes('north') || text.includes('polar') || text.includes('eis')) return 'north_quadrant';
  if (text.includes('süd') || text.includes('south') || text.includes('tropen')) return 'south_quadrant';
  if (text.includes('zentral') || text.includes('mitte') || text.includes('hauptstadt') || text.includes('pass') || text.includes('kanal')) return 'central_quadrant';

  // Balanced Hash Fallback
  const sectorsCycle: SectorType[] = ['east_quadrant', 'north_quadrant', 'west_quadrant', 'south_quadrant', 'central_quadrant'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return sectorsCycle[Math.abs(hash) % sectorsCycle.length];
}

/**
 * Calculates a balanced, non-overlapping coordinate within a sector's bounds.
 */
export function calculateSectorSlot(
  sector: SectorType,
  indexInSector: number,
  totalInSector: number,
  seed: number = 0
): { x: number; y: number } {
  const bounds = SECTOR_BOUNDS_MAP[sector] || SECTOR_BOUNDS_MAP.central_quadrant;

  const cols = Math.min(5, Math.max(2, Math.ceil(Math.sqrt(totalInSector * 1.6))));
  const rows = Math.ceil(totalInSector / cols);

  const colIdx = indexInSector % cols;
  const rowIdx = Math.floor(indexInSector / cols);

  const colStep = (bounds.maxX - bounds.minX) / (cols + 1);
  const rowStep = (bounds.maxY - bounds.minY) / (rows + 1);

  const jitterX = Math.sin(seed * 3.7 + indexInSector * 1.9) * (colStep * 0.28);
  const jitterY = Math.cos(seed * 2.3 + indexInSector * 2.7) * (rowStep * 0.28);

  const x = Math.round((bounds.minX + colStep * (colIdx + 1) + jitterX) * 10) / 10;
  const y = Math.round((bounds.minY + rowStep * (rowIdx + 1) + jitterY) * 10) / 10;

  return {
    x,
    y
  };
}

/**
 * Builds the map territories dynamically from the user's Codex (strict 1:1 sync).
 * If the Codex has no location entries, returns an empty array for a clean fresh start.
 */
export function buildTerritoriesFromCodexAndWorld(
  world: WorldSetting,
  loreDatabase: LoreEntry[] = []
): Territory[] {
  const LOCATION_CATEGORIES = [
    'Orte', 
    'Geografie', 
    'Regionen', 
    'Städte & Siedlungen', 
    'Staaten & Inseln', 
    'Bauwerke', 
    'Gebäude', 
    'Zonen'
  ];

  // Filter only actual location entries from Codex
  const codexLocations = (loreDatabase || []).filter(entry => {
    if (!entry || !entry.title) return false;
    if (LOCATION_CATEGORIES.includes(entry.category)) return true;
    const roleType = (entry.details?.role || entry.details?.type || '').toLowerCase();
    return ['insel', 'stadt', 'dorf', 'hafen', 'festung', 'burg', 'meer', 'kontinent', 'ozean', 'region', 'zone', 'ort', 'gebäude'].some(t => roleType.includes(t));
  });

  // Strict 1:1 sync: If the Codex is empty / has no locations, map is clean & empty
  if (codexLocations.length === 0) {
    return [];
  }

  // Lookup existing world map customizations (to preserve user's manually dragged coordinates / custom radius / colors)
  const existingMap = new Map<string, Territory>();
  if (Array.isArray(world.territories) && world.territories.length > 0) {
    world.territories.forEach(t => {
      if (t && t.name) {
        existingMap.set(t.name.toLowerCase().trim(), { ...t });
      }
    });
  }

  const normalizeTitleKey = (str: string) => {
    return str.toLowerCase().trim().replace(/^(die|der|das|ein|eine|einen|einem|eines|einer|the|a|an)\s+/, '');
  };

  const sectorGroups: Record<SectorType, typeof codexLocations> = {
    north_quadrant: [],
    east_quadrant: [],
    west_quadrant: [],
    south_quadrant: [],
    central_quadrant: []
  };

  const resultMap = new Map<string, Territory>();
  const seenKeys = new Set<string>();

  codexLocations.forEach((entry) => {
    const key = normalizeTitleKey(entry.title);
    if (!key || seenKeys.has(key)) return;
    seenKeys.add(key);

    // Check if this Codex entry was already placed on the map
    const existing = Array.from(existingMap.values()).find(
      ex => normalizeTitleKey(ex.name) === key || (ex.id && ex.id === entry.id)
    );

    if (existing) {
      // Keep existing custom coordinates, points, and colors, but sync metadata from Codex
      resultMap.set(key, {
        ...existing,
        name: entry.title,
        description: entry.description || existing.description,
        faction: entry.details?.faction || existing.faction || 'Neutral',
        ruler: entry.details?.ruler || existing.ruler,
        dangerLevel: entry.details?.dangerLevel || existing.dangerLevel
      });
      return;
    }

    // New location: classify sector
    const sector = classifyMaritimeSector(
      entry.title, 
      entry.description, 
      entry.details?.parentRegion || entry.details?.parentPlaceId
    );
    sectorGroups[sector].push(entry);
  });

  // Assign coordinates for new Codex entries
  Object.keys(sectorGroups).forEach((secKey) => {
    const sector = secKey as SectorType;
    const entriesInSec = sectorGroups[sector];
    const totalInSec = entriesInSec.length;

    entriesInSec.forEach((entry, idx) => {
      const key = normalizeTitleKey(entry.title);
      const roleType = (entry.details?.role || entry.details?.type || '').toLowerCase();
      const lowerName = entry.title.toLowerCase();
      const details = entry.details || {};

      let territoryType: Territory['type'] = 'ort';
      let shapeType: 'circle' | 'rectangle' | 'polygon' = 'circle';
      let color = '#0284c7';

      const isSea = roleType.includes('meer') || lowerName.includes('meer') || 
                    roleType.includes('ozean') || lowerName.includes('ozean') || 
                    roleType.includes('bucht') || roleType.includes('gewässer');

      const catStr = entry.category as string;
      const isIsland = roleType.includes('insel') || lowerName.includes('insel') || 
                       lowerName.includes('island') || roleType.includes('archipel') || 
                       lowerName.includes('archipel') || lowerName.includes('königreich') ||
                       lowerName.includes('land') || roleType.includes('region') ||
                       catStr === 'Staaten & Inseln' || catStr === 'Geografie';

      if (isSea) {
        territoryType = 'meer';
        shapeType = 'circle';
        color = '#0284c7';
      } else if (roleType.includes('kontinent') || lowerName.includes('kontinent')) {
        territoryType = 'kontinent';
        shapeType = 'polygon';
        color = '#15803d';
      } else if (isIsland) {
        territoryType = 'insel';
        shapeType = 'polygon';
        color = '#15803d';
      } else if (roleType.includes('festung') || lowerName.includes('burg') || lowerName.includes('festung') || lowerName.includes('basis') || catStr === 'Bauwerke') {
        territoryType = 'festung';
        color = '#e11d48';
      } else if (roleType.includes('stadt') || lowerName.includes('stadt') || lowerName.includes('metropole') || lowerName.includes('hafen') || catStr === 'Städte & Siedlungen') {
        territoryType = 'stadt';
        color = '#8b5cf6';
      } else if (roleType.includes('gebäude') || lowerName.includes('akademie') || lowerName.includes('taverne') || catStr === 'Gebäude') {
        territoryType = 'gebäude';
        color = '#f59e0b';
      } else if (roleType.includes('zone')) {
        territoryType = 'zone';
        shapeType = 'circle';
        color = '#10b981';
      }

      let posX: number;
      let posY: number;

      if (details.coordinates && typeof details.coordinates.x === 'number' && typeof details.coordinates.y === 'number') {
        posX = details.coordinates.x;
        posY = details.coordinates.y;
      } else {
        const slot = calculateSectorSlot(sector, idx, totalInSec, idx * 17);
        posX = slot.x;
        posY = slot.y;
      }

      const parentName = details.parentRegion || details.parentPlaceId;
      const parentId = parentName 
        ? (Array.from(resultMap.values()).find(e => e.name.toLowerCase().includes(parentName.toLowerCase()))?.id || SECTOR_BOUNDS_MAP[sector].parentId)
        : SECTOR_BOUNDS_MAP[sector].parentId;

      let polygonPoints: { x: number; y: number }[] | undefined = undefined;
      const itemRadius = territoryType === 'kontinent' ? 35.0 : territoryType === 'insel' ? 15.0 : territoryType === 'meer' ? 40.0 : 3.0;
      if (territoryType === 'insel' || territoryType === 'kontinent' || shapeType === 'polygon') {
        polygonPoints = createOrganicIslandPoints(posX, posY, itemRadius, idx + 10);
      }

      const createdTerritory: Territory = {
        id: `terr-codex-${sector}-${idx}-${Date.now()}`,
        name: entry.title,
        type: territoryType,
        description: entry.description || `${entry.title} aus dem Codex.`,
        parentId,
        x: posX,
        y: posY,
        radius: itemRadius,
        shapeType,
        points: polygonPoints,
        color,
        faction: details.faction || 'Neutral',
        ruler: details.ruler,
        dangerLevel: details.dangerLevel,
        isUnlocked: true,
        travelTime: details.travelTime,
        distance: details.distance,
        direction: details.direction,
        routeFrom: details.routeFrom
      };

      resultMap.set(key, createdTerritory);
    });
  });

  const resultList = Array.from(resultMap.values());
  return resolveTerritoryCollisions(resultList);
}

export function resolveTerritoryCollisions(items: Territory[]): Territory[] {
  const MIN_DIST = 6.8;
  const placed: { x: number; y: number }[] = [];

  return items.map((item, idx) => {
    // Keep master oceans and root fixed
    if (item.type === 'welt' || item.type === 'meer') {
      placed.push({ x: item.x, y: item.y });
      return item;
    }

    let x = item.x ?? (20 + ((idx * 29) % 200));
    let y = item.y ?? (20 + ((idx * 37) % 100));

    let attempts = 0;
    while (attempts < 40) {
      const isTooClose = placed.some(p => {
        const dx = p.x - x;
        const dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) < MIN_DIST;
      });

      if (!isTooClose) break;

      const angle = (attempts * 137.5) * (Math.PI / 180);
      const step = 2.4 + Math.floor(attempts / 4) * 1.5;
      x = Math.round((x + Math.cos(angle) * step) * 10) / 10;
      y = Math.round((y + Math.sin(angle) * step) * 10) / 10;
      attempts++;
    }
    placed.push({ x, y });

    let updatedPoints = item.points;
    const islandRadius = item.radius || (item.type === 'kontinent' ? 35.0 : item.type === 'insel' ? 15.0 : 12.0);
    if (item.type === 'insel' || item.shapeType === 'polygon' || item.type === 'kontinent') {
      if (!updatedPoints || updatedPoints.length === 0) {
        updatedPoints = createOrganicIslandPoints(x, y, islandRadius, idx + 10);
      }
    }

    const itemTypeStr = item.type as string;
    return {
      ...item,
      x,
      y,
      radius: item.radius ?? (itemTypeStr === 'meer' ? 40 : itemTypeStr === 'kontinent' ? 35 : itemTypeStr === 'insel' ? 15 : 3.0),
      points: updatedPoints
    };
  });
}

/**
 * Merges a newly drawn polygon into an existing territory, expanding its shape seamlessly.
 */
export function mergePointsIntoTerritory(
  targetTerr: Territory,
  newPoints: { x: number; y: number }[],
  allTerritories: Territory[] = []
): { mergedPoints: { x: number; y: number }[]; cx: number; cy: number; radius: number } {
  if (!newPoints || newPoints.length < 3) {
    return {
      mergedPoints: targetTerr.points || [],
      cx: targetTerr.x,
      cy: targetTerr.y,
      radius: targetTerr.radius || 20
    };
  }

  // Get existing polygon ring
  const existingRing = getTerritoryPolygonRing(targetTerr, 1.0, undefined, allTerritories, null, 'selected_only');
  const newRing: [number, number][] = newPoints.map(p => [p.x, p.y]);
  if (newRing.length > 0) {
    newRing.push([newPoints[0].x, newPoints[0].y]);
  }

  try {
    const existingPoly: any = [existingRing];
    const newPoly: any = [newRing];
    const unionRes = polygonClipping.union(existingPoly, newPoly);
    
    if (unionRes && unionRes.length > 0 && unionRes[0].length > 0) {
      const mainRing = unionRes[0][0];
      const merged = mainRing.slice(0, -1).map(p => ({
        x: Math.round(p[0] * 10) / 10,
        y: Math.round(p[1] * 10) / 10
      }));

      if (merged.length >= 3) {
        const cx = Math.round((merged.reduce((sum, p) => sum + p.x, 0) / merged.length) * 10) / 10;
        const cy = Math.round((merged.reduce((sum, p) => sum + p.y, 0) / merged.length) * 10) / 10;
        const maxR = Math.max(...merged.map(p => Math.hypot(p.x - cx, p.y - cy)));

        return {
          mergedPoints: merged,
          cx,
          cy,
          radius: Math.max(targetTerr.radius || 10, Math.round(maxR))
        };
      }
    }
  } catch (err) {
    console.warn("Polygon union fallback in mergePointsIntoTerritory:", err);
  }

  // Fallback: simple combination of points
  const combined = [...(targetTerr.points || []), ...newPoints];
  const cx = Math.round((combined.reduce((sum, p) => sum + p.x, 0) / combined.length) * 10) / 10;
  const cy = Math.round((combined.reduce((sum, p) => sum + p.y, 0) / combined.length) * 10) / 10;
  const maxR = Math.max(...combined.map(p => Math.hypot(p.x - cx, p.y - cy)));

  return {
    mergedPoints: combined,
    cx,
    cy,
    radius: Math.max(targetTerr.radius || 10, Math.round(maxR))
  };
}

// =========================================================================
// ZONE SUBDIVISION & PARTITIONING ENGINE (Meer & Landflächen in Zonen teilen)
// =========================================================================

export type ZonePartitionMode = 
  | 'one_piece_belts'     // Calm Belt Nord, Grandline / Neue Welt, Calm Belt Süd, Blues
  | 'horizontal_bands'    // 2, 3 oder 4 Meeresstreifen (Nord, Mitte, Süd)
  | 'vertical_sectors'    // 2, 3 oder 4 Meeressektoren (West, Zentral, Ost)
  | 'quadrants'           // 4 Quadranten (NW, NE, SW, SE)
  | 'concentric'          // Inneres Meer vs. Äußere Gewässer
  | 'custom';             // Benutzerdefinierte Zonen

export interface ZonePartitionItemConfig {
  id?: string;
  name: string;
  type?: Territory['type'];
  color?: string;
  description?: string;
  dangerLevel?: string;
  weight?: number; // Relative Dicke / Breite
  tags?: string[];
  climate?: string;
  terrain?: string;
  faction?: string;
}

export interface SubdivideTerritoryOptions {
  mode: ZonePartitionMode;
  zones: ZonePartitionItemConfig[];
  keepParentAsContainer?: boolean;
  reassignInnerPlaces?: boolean;
}

/**
 * Standard-Presets für Meeres- und Landzonen-Gliederungen
 */
export const SUBDIVIDE_PRESETS: Record<ZonePartitionMode, {
  label: string;
  icon: string;
  description: string;
  defaultZones: ZonePartitionItemConfig[];
}> = {
  one_piece_belts: {
    label: 'One Piece: Grand Line & Calm Belts',
    icon: '',
    description: 'Unterteilt das Meer in Calm Belt Nord, Grandline/Neue Welt-Korridor, Calm Belt Süd und Außengewässer.',
    defaultZones: [
      {
        name: 'Calm Belt (Nord)',
        type: 'meer',
        color: '#0284c7',
        description: 'Absolute Windstille und Nistplatz gigantischer Seekönige.',
        dangerLevel: 'Extrem hoch',
        weight: 0.18,
        tags: ['Calm Belt', 'Seekönige', 'Windstille'],
        climate: 'Windstill & schwül'
      },
      {
        name: 'Grandline: Neue Welt',
        type: 'meer',
        color: '#0369a1',
        description: 'Tückische Gewässer mit unberechenbaren Meeresströmungen und Magnetfeldern.',
        dangerLevel: 'Sehr gefährlich',
        weight: 0.44,
        tags: ['Neue Welt', 'Grandline', 'Piratenmeer', 'Stürme'],
        climate: 'Chaotisch & stürmisch'
      },
      {
        name: 'Calm Belt (Süd)',
        type: 'meer',
        color: '#0284c7',
        description: 'Südliche monsterverseuchte Todeszone ohne Wind.',
        dangerLevel: 'Extrem hoch',
        weight: 0.18,
        tags: ['Calm Belt', 'Seekönige', 'Windstille'],
        climate: 'Windstill & schwül'
      },
      {
        name: 'South Blue Gewässer',
        type: 'meer',
        color: '#0ea5e9',
        description: 'Ruhigere Außengewässer jenseits des südlichen Calm Belts.',
        dangerLevel: 'Moderat',
        weight: 0.20,
        tags: ['South Blue', 'Außenmeer', 'Handelsgewässer'],
        climate: 'Gemäßigt maritim'
      }
    ]
  },
  horizontal_bands: {
    label: '3 Horizontale Meeresbänder',
    icon: '',
    description: 'Teilt das Gewässer von Nord nach Süd in 3 zusammenhängende Streifen auf.',
    defaultZones: [
      {
        name: 'Nördliche Meeresstraße',
        type: 'meer',
        color: '#0284c7',
        description: 'Kühle nördliche Gewässer mit mäßigem Seegang.',
        dangerLevel: 'Normal',
        weight: 0.33,
        tags: ['Nordmeer', 'Fischerei'],
        climate: 'Kühl maritim'
      },
      {
        name: 'Zentraler Ozean-Korridor',
        type: 'meer',
        color: '#0369a1',
        description: 'Hauptschifffahrtsroute und zentrale Handelsgewässer.',
        dangerLevel: 'Mittel',
        weight: 0.34,
        tags: ['Zentralmeer', 'Handelsroute'],
        climate: 'Mild maritim'
      },
      {
        name: 'Südliche Weite',
        type: 'meer',
        color: '#0ea5e9',
        description: 'Warme tropische Gewässer mit vielen seichten Riffen.',
        dangerLevel: 'Niedrig',
        weight: 0.33,
        tags: ['Südmeer', 'Tropen'],
        climate: 'Tropisch warm'
      }
    ]
  },
  vertical_sectors: {
    label: '3 Vertikale Meeressektoren',
    icon: '',
    description: 'Teilt das Gewässer von West nach Ost in 3 Längs-Sektoren auf.',
    defaultZones: [
      {
        name: 'Westliches Küstenmeer',
        type: 'meer',
        color: '#0284c7',
        description: 'Gewässer nahe den westlichen Gestaden und Häfen.',
        dangerLevel: 'Niedrig',
        weight: 0.33,
        tags: ['Westsektor', 'Küstennähe'],
        climate: 'Gemäßigt'
      },
      {
        name: 'Zentraler Archipel-Sektor',
        type: 'meer',
        color: '#0369a1',
        description: 'Offene Tiefsee mit Inselgruppen und Kreuzungspunkten.',
        dangerLevel: 'Mittel',
        weight: 0.34,
        tags: ['Zentralsektor', 'Tiefsee'],
        climate: 'Wechselhaft'
      },
      {
        name: 'Östliche Hochsee',
        type: 'meer',
        color: '#0ea5e9',
        description: 'Weitläufige ungezähmte Hochsee am östlichen Horizont.',
        dangerLevel: 'Gefährlich',
        weight: 0.33,
        tags: ['Ostsektor', 'Hochsee', 'Nebel'],
        climate: 'Rau & neblig'
      }
    ]
  },
  quadrants: {
    label: '4 Meeres-Quadranten (2x2)',
    icon: '',
    description: 'Unterteilt die Wasserfläche in 4 gleichmäßige Quadranten.',
    defaultZones: [
      { name: 'Nordwest-Quadrant', type: 'meer', color: '#0284c7', description: 'Nordwestlicher Ozeansektor.', weight: 0.25 },
      { name: 'Nordost-Quadrant', type: 'meer', color: '#0369a1', description: 'Nordöstlicher Ozeansektor.', weight: 0.25 },
      { name: 'Südwest-Quadrant', type: 'meer', color: '#0ea5e9', description: 'Südwestlicher Ozeansektor.', weight: 0.25 },
      { name: 'Südost-Quadrant', type: 'meer', color: '#38bdf8', description: 'Südöstlicher Ozeansektor.', weight: 0.25 }
    ]
  },
  concentric: {
    label: 'Zentrales Kernmeer & Äußere Hochsee',
    icon: '',
    description: 'Unterteilt das Meer in ein inneres Kernbecken und eine umschließende Außenzone.',
    defaultZones: [
      { name: 'Inneres Meeresbecken', type: 'meer', color: '#0369a1', description: 'Geschütztes zentrales Becken.', weight: 0.45 },
      { name: 'Äußere Hochsee-Zone', type: 'meer', color: '#0284c7', description: 'Umschließende offene Ozeanregion.', weight: 0.55 }
    ]
  },
  custom: {
    label: 'Benutzerdefinierte Zonen (KI / Manuell)',
    icon: '',
    description: 'Individuelle Zoneneinteilung nach deinem Wunsch oder mit KI-Generierung.',
    defaultZones: [
      { name: 'Zone Alpha: Küstengewässer', type: 'meer', color: '#0284c7', weight: 0.5 },
      { name: 'Zone Beta: Tiefsee-Graben', type: 'meer', color: '#0369a1', weight: 0.5 }
    ]
  }
};

/**
 * Subdivides an existing sea or territory polygon into seamless, non-overlapping sub-zones.
 */
export function subdivideTerritoryIntoZones(
  parentTerritory: Territory,
  options: SubdivideTerritoryOptions,
  allTerritories: Territory[] = []
): {
  createdTerritories: Territory[];
  updatedParentTerritory?: Territory;
  updatedAllTerritories: Territory[];
} {
  const { mode, zones, keepParentAsContainer = true, reassignInnerPlaces = true } = options;

  if (!zones || zones.length === 0) {
    return {
      createdTerritories: [],
      updatedAllTerritories: allTerritories
    };
  }

  // 1. Get the base boundary ring of the parent territory
  const parentRing = getTerritoryPolygonRing(parentTerritory, 1.0, undefined, allTerritories, null, 'selected_only');
  
  // Calculate bounding box of parent
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const pt of parentRing) {
    if (pt[0] < minX) minX = pt[0];
    if (pt[0] > maxX) maxX = pt[0];
    if (pt[1] < minY) minY = pt[1];
    if (pt[1] > maxY) maxY = pt[1];
  }

  // Ensure sensible fallback bounds
  if (!isFinite(minX) || !isFinite(maxX) || minX >= maxX) {
    const r = parentTerritory.radius || 35;
    minX = parentTerritory.x - r;
    maxX = parentTerritory.x + r;
  }
  if (!isFinite(minY) || !isFinite(maxY) || minY >= maxY) {
    const r = parentTerritory.radius || 35;
    minY = parentTerritory.y - r;
    maxY = parentTerritory.y + r;
  }

  const width = maxX - minX;
  const height = maxY - minY;

  const totalWeight = zones.reduce((sum, z) => sum + (z.weight || 1), 0);
  const createdList: Territory[] = [];

  const parentPoly: any = [parentRing];

  if (mode === 'vertical_sectors') {
    // Slice along X-axis
    let currentX = minX;
    zones.forEach((z, idx) => {
      const zoneWeight = z.weight || 1;
      const zoneWidth = (zoneWeight / totalWeight) * width;
      const x0 = currentX;
      const x1 = idx === zones.length - 1 ? maxX : currentX + zoneWidth;
      currentX = x1;

      // Slice box
      const sliceBox: [number, number][] = [
        [x0, minY - 10],
        [x1, minY - 10],
        [x1, maxY + 10],
        [x0, maxY + 10],
        [x0, minY - 10]
      ];

      let clippedRing: { x: number; y: number }[] = [];
      try {
        const inter = polygonClipping.intersection(parentPoly, [[sliceBox]]);
        if (inter && inter.length > 0 && inter[0].length > 0) {
          const mainRing = inter[0][0];
          clippedRing = mainRing.slice(0, -1).map(p => ({
            x: Math.round(p[0] * 10) / 10,
            y: Math.round(p[1] * 10) / 10
          }));
        }
      } catch (err) {
        console.warn("Intersection failed for vertical sector:", err);
      }

      if (clippedRing.length < 3) {
        // Fallback rectangular slice
        clippedRing = [
          { x: Math.round(x0 * 10) / 10, y: Math.round(minY * 10) / 10 },
          { x: Math.round(x1 * 10) / 10, y: Math.round(minY * 10) / 10 },
          { x: Math.round(x1 * 10) / 10, y: Math.round(maxY * 10) / 10 },
          { x: Math.round(x0 * 10) / 10, y: Math.round(maxY * 10) / 10 }
        ];
      }

      const cx = Math.round((clippedRing.reduce((sum, p) => sum + p.x, 0) / clippedRing.length) * 10) / 10;
      const cy = Math.round((clippedRing.reduce((sum, p) => sum + p.y, 0) / clippedRing.length) * 10) / 10;
      const r = Math.max(10, Math.round(Math.max(...clippedRing.map(p => Math.hypot(p.x - cx, p.y - cy)))));

      const newId = `subzone_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      createdList.push({
        id: newId,
        name: z.name || `Sektor ${idx + 1}`,
        type: z.type || 'meer',
        description: z.description || `Teilsektor von ${parentTerritory.name}`,
        parentId: keepParentAsContainer ? parentTerritory.id : null,
        x: cx,
        y: cy,
        radius: r,
        color: z.color || '#0284c7',
        points: clippedRing,
        shapeType: 'polygon',
        tags: z.tags || ['Meereszone'],
        climate: z.climate || parentTerritory.climate,
        dangerLevel: z.dangerLevel || parentTerritory.dangerLevel,
        isUnlocked: true
      });
    });
  } else if (mode === 'quadrants') {
    // 2x2 grid: NW, NE, SW, SE
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const quadrantBoxes: [number, number][][] = [
      [[minX - 5, minY - 5], [midX, minY - 5], [midX, midY], [minX - 5, midY], [minX - 5, minY - 5]], // NW
      [[midX, minY - 5], [maxX + 5, minY - 5], [maxX + 5, midY], [midX, midY], [midX, minY - 5]],     // NE
      [[minX - 5, midY], [midX, midY], [midX, maxY + 5], [minX - 5, maxY + 5], [minX - 5, midY]],     // SW
      [[midX, midY], [maxX + 5, midY], [maxX + 5, maxY + 5], [midX, maxY + 5], [midX, midY]]          // SE
    ];

    zones.slice(0, 4).forEach((z, idx) => {
      const sliceBox = quadrantBoxes[idx % 4];
      let clippedRing: { x: number; y: number }[] = [];
      try {
        const inter = polygonClipping.intersection(parentPoly, [[sliceBox]]);
        if (inter && inter.length > 0 && inter[0].length > 0) {
          const mainRing = inter[0][0];
          clippedRing = mainRing.slice(0, -1).map(p => ({
            x: Math.round(p[0] * 10) / 10,
            y: Math.round(p[1] * 10) / 10
          }));
        }
      } catch (err) {
        console.warn("Intersection failed for quadrant:", err);
      }

      if (clippedRing.length < 3) {
        clippedRing = sliceBox.slice(0, -1).map(p => ({ x: p[0], y: p[1] }));
      }

      const cx = Math.round((clippedRing.reduce((sum, p) => sum + p.x, 0) / clippedRing.length) * 10) / 10;
      const cy = Math.round((clippedRing.reduce((sum, p) => sum + p.y, 0) / clippedRing.length) * 10) / 10;
      const r = Math.max(8, Math.round(Math.max(...clippedRing.map(p => Math.hypot(p.x - cx, p.y - cy)))));

      const newId = `subzone_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      createdList.push({
        id: newId,
        name: z.name || `Quadrant ${idx + 1}`,
        type: z.type || 'meer',
        description: z.description || `Quadrant von ${parentTerritory.name}`,
        parentId: keepParentAsContainer ? parentTerritory.id : null,
        x: cx,
        y: cy,
        radius: r,
        color: z.color || '#0284c7',
        points: clippedRing,
        shapeType: 'polygon',
        tags: z.tags || ['Quadrant'],
        climate: z.climate || parentTerritory.climate,
        dangerLevel: z.dangerLevel || parentTerritory.dangerLevel,
        isUnlocked: true
      });
    });
  } else {
    // Default: Horizontal bands (top to bottom) - Perfect for One Piece Calm Belts & Grand Line!
    let currentY = minY;
    zones.forEach((z, idx) => {
      const zoneWeight = z.weight || 1;
      const zoneHeight = (zoneWeight / totalWeight) * height;
      const y0 = currentY;
      const y1 = idx === zones.length - 1 ? maxY : currentY + zoneHeight;
      currentY = y1;

      // Slice box
      const sliceBox: [number, number][] = [
        [minX - 10, y0],
        [maxX + 10, y0],
        [maxX + 10, y1],
        [minX - 10, y1],
        [minX - 10, y0]
      ];

      let clippedRing: { x: number; y: number }[] = [];
      try {
        const inter = polygonClipping.intersection(parentPoly, [[sliceBox]]);
        if (inter && inter.length > 0 && inter[0].length > 0) {
          const mainRing = inter[0][0];
          clippedRing = mainRing.slice(0, -1).map(p => ({
            x: Math.round(p[0] * 10) / 10,
            y: Math.round(p[1] * 10) / 10
          }));
        }
      } catch (err) {
        console.warn("Intersection failed for horizontal band:", err);
      }

      if (clippedRing.length < 3) {
        // Fallback rectangular slice
        clippedRing = [
          { x: Math.round(minX * 10) / 10, y: Math.round(y0 * 10) / 10 },
          { x: Math.round(maxX * 10) / 10, y: Math.round(y0 * 10) / 10 },
          { x: Math.round(maxX * 10) / 10, y: Math.round(y1 * 10) / 10 },
          { x: Math.round(minX * 10) / 10, y: Math.round(y1 * 10) / 10 }
        ];
      }

      const cx = Math.round((clippedRing.reduce((sum, p) => sum + p.x, 0) / clippedRing.length) * 10) / 10;
      const cy = Math.round((clippedRing.reduce((sum, p) => sum + p.y, 0) / clippedRing.length) * 10) / 10;
      const r = Math.max(10, Math.round(Math.max(...clippedRing.map(p => Math.hypot(p.x - cx, p.y - cy)))));

      const newId = `subzone_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
      createdList.push({
        id: newId,
        name: z.name || `Meereszone ${idx + 1}`,
        type: z.type || 'meer',
        description: z.description || `Teilzone von ${parentTerritory.name}`,
        parentId: keepParentAsContainer ? parentTerritory.id : null,
        x: cx,
        y: cy,
        radius: r,
        color: z.color || '#0284c7',
        points: clippedRing,
        shapeType: 'polygon',
        tags: z.tags || ['Meeresgürtel'],
        climate: z.climate || parentTerritory.climate,
        dangerLevel: z.dangerLevel || parentTerritory.dangerLevel,
        isUnlocked: true
      });
    });
  }

  // Update territory collection
  let updatedAll: Territory[] = [];

  if (keepParentAsContainer) {
    // Keep parent territory, insert newly created sub-zones
    updatedAll = [...allTerritories, ...createdList];
  } else {
    // Replace parent territory with the new partition zones
    updatedAll = allTerritories
      .filter(t => t.id !== parentTerritory.id)
      .concat(createdList);
  }

  // If reassignInnerPlaces is true, assign islands/settlements inside subzones to their matching subzone parentId
  if (reassignInnerPlaces && createdList.length > 0) {
    updatedAll = updatedAll.map(item => {
      // Don't reassign subzones themselves, master world, or major independent landmasses/oceans
      if (
        createdList.some(z => z.id === item.id) ||
        item.id === parentTerritory.id ||
        item.type === 'welt' ||
        item.type === 'meer' ||
        item.type === 'ozean' ||
        item.type === 'wasser' ||
        item.type === 'kontinent' ||
        item.type === 'land' ||
        item.type === 'koenigreich' ||
        item.type === 'region' ||
        item.type === 'insel'
      ) {
        return item;
      }

      // Check if this item is geometrically inside one of the newly created subzones
      for (const subzone of createdList) {
        if (subzone.points && subzone.points.length >= 3) {
          if (isPointInPolygon({ x: item.x, y: item.y }, subzone.points)) {
            return {
              ...item,
              parentId: subzone.id
            };
          }
        }
      }
      return item;
    });
  }

  return {
    createdTerritories: createdList,
    updatedParentTerritory: keepParentAsContainer ? parentTerritory : undefined,
    updatedAllTerritories: updatedAll
  };
}
