import { Territory, WorldSetting, LoreEntry, EconomyHolding } from '../../types';
import {
  generateNaturalFreehandZonePoints,
  subdivideTerritoryIntoZones,
  computeSpatialRelationPosition,
  getTerritoryOrganicPoints,
  getConformedTerritoryGeometry,
  isLandTerritory,
  isSeaTerritory,
  pointsToSvgPath,
  isPointInPolygon,
  ZonePartitionMode
} from './worldMapData';

export type DrawingDirection =
  | 'north'
  | 'northeast'
  | 'east'
  | 'southeast'
  | 'south'
  | 'southwest'
  | 'west'
  | 'northwest'
  | 'center';

export type DrawingAction =
  | {
      tool: 'create_landmass' | 'draw_landmass';
      name: string;
      type?: 'koenigreich' | 'kontinent' | 'insel' | 'land' | 'region' | string;
      relativeTo?: string;
      direction?: DrawingDirection;
      distanceKm?: number;
      center?: { x: number; y: number };
      radius?: number;
      points?: Array<{ x: number; y: number }> | Array<[number, number]>;
      coastlineRoughness?: number;
      shapeDescription?: string;
      climate?: string;
      terrain?: string;
      faction?: string;
      ruler?: string;
      population?: string | number;
      description?: string;
      parent?: string;
      color?: string;
    }
  | {
      tool: 'create_sea' | 'draw_sea';
      name: string;
      relativeTo?: string;
      direction?: DrawingDirection;
      distanceKm?: number;
      center?: { x: number; y: number };
      radius?: number;
      points?: Array<{ x: number; y: number }> | Array<[number, number]>;
      description?: string;
      color?: string;
    }
  | {
      tool: 'create_sea_zone' | 'draw_sea_zone';
      name: string;
      parentSea: string;
      points?: Array<{ x: number; y: number }> | Array<[number, number]>;
      weight?: number;
      color?: string;
      dangerLevel?: string;
      climate?: string;
      description?: string;
      tags?: string[];
    }
  | {
      tool: 'place_settlement' | 'draw_settlement';
      name: string;
      settlementType: 'hauptstadt' | 'grossstadt' | 'stadt' | 'dorf' | 'hafen' | 'festung' | string;
      parent: string;
      position?: { x: number; y: number };
      onCoast?: boolean;
      coastDirection?: DrawingDirection;
      description?: string;
      population?: string | number;
      faction?: string;
      ruler?: string;
      color?: string;
    }
  | {
      tool: 'place_poi';
      name: string;
      poiType: 'taverne' | 'schmiede' | 'tempel' | 'mine' | 'ruine' | 'leuchtturm' | 'bruecke' | 'hoehle' | 'markt' | 'schrein' | 'turm' | 'burg' | 'ort' | string;
      parent: string;
      description?: string;
      level?: number;
      icon?: string;
    }
  | {
      tool: 'create_route' | 'draw_route';
      name?: string;
      routeType: 'seeweg' | 'landweg' | 'handelsroute' | 'pass' | 'flussroute' | string;
      from: string;
      to: string;
      waypoints?: Array<{ x: number; y: number }> | Array<[number, number]>;
      distanceKm?: number;
      description?: string;
      color?: string;
    }
  | {
      tool: 'create_feature' | 'draw_feature';
      name: string;
      featureType: 'gebirge' | 'wald' | 'wueste' | 'sumpf' | 'see' | 'fluss' | 'vulkan' | 'schnee' | 'dschungel' | 'krater' | string;
      parent?: string;
      direction?: DrawingDirection;
      center?: { x: number; y: number };
      size?: 'klein' | 'mittel' | 'gross' | number;
      points?: Array<{ x: number; y: number }> | Array<[number, number]>;
      description?: string;
      color?: string;
    };

export interface DrawingPlan {
  planOverview?: string;
  actions: DrawingAction[];
  suggestedLore?: Array<{
    title: string;
    category: string;
    description: string;
  }>;
}

export interface DrawingValidationIssue {
  code: string;
  level: 'error' | 'warning';
  actionIndex?: number;
  targetName?: string;
  message: string;
  suggestedFix?: string;
}

export interface DrawingValidationResult {
  valid: boolean;
  issues: DrawingValidationIssue[];
}

export interface PlausibilityReportItem {
  territoryId: string;
  name: string;
  type: string;
  isSettlement: boolean;
  parentName?: string;
  areaKm2: number;
  habitableAreaKm2: number;
  populationCount?: number;
  populationDisplay?: string;
  populationDensity?: number;
  densityClassification: 'niedrig' | 'normal' | 'hoch' | 'sehr_hoch' | 'extrem';
  plausibilityStatus: 'plausibel' | 'ungewoehnlich_begruendet' | 'unplausibel_korrigiert';
  statusLabel: string;
  justifications: string[];
  notes: string[];
  suggestedAction?: string;
}

export interface DrawingPlausibilitySummary {
  overallPlausible: boolean;
  hasUnexplainedExtremeDensity: boolean;
  evaluatedTerritories: PlausibilityReportItem[];
  plausibilityFeedbackPrompt?: string;
}

export interface DrawingConnectionItem {
  id: string;
  fromId?: string;
  toId?: string;
  fromPlace: string;
  toPlace: string;
  label: string;
  travelTime?: string;
  distance?: string;
  type: string;
  isUnlocked: boolean;
}

export interface DrawingExecutionResult {
  territories: Territory[];
  holdings: EconomyHolding[];
  connections: DrawingConnectionItem[];
  suggestedLore: LoreEntry[];
  validation: DrawingValidationResult;
  plausibility?: DrawingPlausibilitySummary;
  executedActionsCount: number;
  planOverview?: string;
}

export const WORLD_BOUNDS = {
  minX: 10,
  maxX: 230,
  minY: 10,
  maxY: 130,
  centerX: 120,
  centerY: 70
};

export const DIRECTION_VECTORS: Record<DrawingDirection, { dx: number; dy: number }> = {
  center: { dx: 0, dy: 0 },
  north: { dx: 0, dy: -1 },
  northeast: { dx: 0.7071, dy: -0.7071 },
  east: { dx: 1, dy: 0 },
  southeast: { dx: 0.7071, dy: 0.7071 },
  south: { dx: 0, dy: 1 },
  southwest: { dx: -0.7071, dy: 0.7071 },
  west: { dx: -1, dy: 0 },
  northwest: { dx: -0.7071, dy: -0.7071 }
};

export function normalizeEntityName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/^(insel|island|stadt|dorf|burg|festung|hafen|meer|ozean|bucht|königreich|reich|kontinent|gebirge|wald|see|vulkan)\s+/i, '')
    .replace(/\s+(insel|island|stadt|dorf|burg|festung|hafen|meer|ozean|bucht|königreich|reich|kontinent|gebirge|wald|see|vulkan)$/i, '')
    .trim();
}

/**
 * Normalizes raw points from AI (handling [x,y] tuples or {x,y} objects).
 * Scales and translates if points were defined in local or normalized space.
 */
export function normalizePoints(
  rawPoints: any,
  targetCenter?: { x: number; y: number },
  targetRadius?: number
): { x: number; y: number }[] {
  if (!rawPoints || !Array.isArray(rawPoints) || rawPoints.length < 3) {
    return [];
  }

  const parsed: { x: number; y: number }[] = [];

  rawPoints.forEach((p: any) => {
    if (!p) return;
    let px = 0;
    let py = 0;

    if (Array.isArray(p) && p.length >= 2) {
      px = Number(p[0]);
      py = Number(p[1]);
    } else if (typeof p === 'object' && ('x' in p || 'y' in p)) {
      px = Number(p.x ?? 0);
      py = Number(p.y ?? 0);
    } else {
      return;
    }

    if (!isNaN(px) && !isNaN(py)) {
      parsed.push({ x: px, y: py });
    }
  });

  if (parsed.length < 3) return [];

  // Check if points are local normalized offsets around origin (0, 0)
  const avgX = parsed.reduce((sum, pt) => sum + pt.x, 0) / parsed.length;
  const avgY = parsed.reduce((sum, pt) => sum + pt.y, 0) / parsed.length;
  const distFromOrigin = Math.hypot(avgX, avgY);

  if (distFromOrigin < 6 && targetCenter && (targetCenter.x > 8 || targetCenter.y > 8)) {
    const scaleRad = targetRadius && targetRadius > 0 ? targetRadius : 20;
    return parsed.map(pt => ({
      x: Math.round((targetCenter.x + pt.x * scaleRad) * 10) / 10,
      y: Math.round((targetCenter.y + pt.y * scaleRad) * 10) / 10
    }));
  }

  // Ensure points are within clamped world bounds
  return parsed.map(pt => ({
    x: Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, Math.round(pt.x * 10) / 10)),
    y: Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, Math.round(pt.y * 10) / 10))
  }));
}

/**
 * Resolves self-intersections in simple polygons to ensure clean SVG rendering without black voids.
 */
export function repairPolygonSelfIntersections(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (!points || points.length < 4) return points;

  // Calculate polygon centroid
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;

  // Verify if points are approximately in consecutive angular order
  let isClockwiseOriented = true;
  let lastAngle = -Math.PI;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const ang = Math.atan2(p.y - cy, p.x - cx);
    if (i > 0 && ang < lastAngle && Math.abs(ang - lastAngle) < Math.PI) {
      // Out of order crossing
      isClockwiseOriented = false;
      break;
    }
    lastAngle = ang;
  }

  if (isClockwiseOriented) {
    return points;
  }

  // Sort points by polar angle around centroid to produce a clean non-self-intersecting hull
  return points.slice().sort((a, b) => {
    const angA = Math.atan2(a.y - cy, a.x - cx);
    const angB = Math.atan2(b.y - cy, b.x - cx);
    return angA - angB;
  });
}

/**
 * Calculates world coordinate offset based on physical km distance
 * and configured kmPerCoordinateUnit (default: 10 km per coordinate unit).
 */
export function calculateCoordinateDistance(distanceKm?: number, kmPerCoordinateUnit: number = 10): number {
  if (!distanceKm || isNaN(distanceKm) || distanceKm <= 0) {
    return 30;
  }
  const units = distanceKm / Math.max(0.5, kmPerCoordinateUnit);
  return Math.max(8, Math.min(160, Math.round(units)));
}

/**
 * Generates an organic Fourier contour when no explicit vertex list is provided.
 * Uses dynamic harmonic synthesis uniquely derived from the name and parameters, NEVER a static preset template!
 */
export function generateOrganicContourFromAI(
  cx: number,
  cy: number,
  radius: number,
  roughness: number = 0.45,
  seed: number = 42,
  shapeDescription?: string
): { x: number; y: number }[] {
  const numPoints = Math.max(24, Math.min(44, Math.round(24 + roughness * 20)));
  const points: { x: number; y: number }[] = [];

  // Parse shape hints from AI description if available
  const desc = (shapeDescription || '').toLowerCase();
  const isElongated = desc.includes('lang') || desc.includes('schmal') || desc.includes('gestreckt');
  const isArchipelago = desc.includes('zerklüftet') || desc.includes('bucht') || desc.includes('fjord');

  const harmonicFreq1 = 2 + (seed % 3);
  const harmonicFreq2 = 3 + ((seed * 7) % 4);
  const harmonicFreq3 = 5 + ((seed * 13) % 5);

  const elongationFactor = isElongated ? 0.45 : 0.12;
  const roughnessFactor = isArchipelago ? Math.min(0.65, roughness * 1.3) : roughness;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    // Harmonic expansion
    const wave1 = Math.sin(angle * harmonicFreq1 + seed) * (0.18 * roughnessFactor);
    const wave2 = Math.cos(angle * harmonicFreq2 + seed * 1.7) * (0.12 * roughnessFactor);
    const wave3 = Math.sin(angle * harmonicFreq3 + seed * 2.9) * (0.08 * roughnessFactor);
    const waveElong = Math.cos(angle * 2 + (seed % 3.14)) * elongationFactor;

    const rFactor = Math.max(0.4, 1.0 + waveElong + wave1 + wave2 + wave3);
    const effR = radius * rFactor;

    const px = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, Math.round((cx + Math.cos(angle) * effR) * 10) / 10));
    const py = Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, Math.round((cy + Math.sin(angle) * effR) * 10) / 10));

    points.push({ x: px, y: py });
  }

  return repairPolygonSelfIntersections(points);
}

/**
 * Calculates the exact surface area of a polygon or territory in km²
 * using the Shoelace formula on its coordinate points, scaled by kmPerCoordinateUnit.
 */
export function calculatePolygonGeometricAreaKm2(
  points: { x: number; y: number }[] | undefined,
  fallbackRadius: number = 20,
  kmPerCoordinateUnit: number = 10
): number {
  const kmPerUnit = Math.max(0.1, kmPerCoordinateUnit);
  const sqKmPerUnit = kmPerUnit * kmPerUnit;

  if (points && points.length >= 3) {
    let areaCoordUnits = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      areaCoordUnits += points[i].x * points[j].y;
      areaCoordUnits -= points[j].x * points[i].y;
    }
    areaCoordUnits = Math.abs(areaCoordUnits) / 2.0;

    const areaKm2 = areaCoordUnits * sqKmPerUnit;
    return Math.max(0.1, Math.round(areaKm2 * 10) / 10);
  }

  // Fallback to circle area: π * r²
  const rUnits = Math.max(0.5, fallbackRadius);
  const circleAreaCoord = Math.PI * rUnits * rUnits;
  const areaKm2 = circleAreaCoord * sqKmPerUnit;
  return Math.max(0.1, Math.round(areaKm2 * 10) / 10);
}

/**
 * Safely parses population strings into integer counts (handling '10.000', '10k', 'ca. 10 000', 10000).
 */
export function parseNumericPopulation(pop: string | number | undefined): number | undefined {
  if (pop === undefined || pop === null || pop === '') return undefined;
  if (typeof pop === 'number') return isNaN(pop) || pop <= 0 ? undefined : Math.round(pop);

  const clean = pop.trim().toLowerCase();
  if (clean.includes('k')) {
    const num = parseFloat(clean.replace(/[^\d.]/g, ''));
    if (!isNaN(num)) return Math.round(num * 1000);
  }
  if (clean.includes('mio') || clean.includes('m')) {
    const num = parseFloat(clean.replace(/[^\d.]/g, ''));
    if (!isNaN(num)) return Math.round(num * 1000000);
  }

  // Remove thousand separators, dots, spaces
  const digitsOnly = clean.replace(/[^\d]/g, '');
  if (!digitsOnly) return undefined;
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
}

export const parsePopulationValue = parseNumericPopulation;

/**
 * Calculates habitable area by deducting uninhabitable natural features (volcanoes, deep craters, hostile jagged mountains)
 * located within or belonging to the landmass.
 */
export function calculateTerritoryHabitableAreaKm2(
  landmass: Territory,
  allFeatures: Territory[] = [],
  kmPerCoordinateUnit: number = 10
): { grossAreaKm2: number; uninhabitableKm2: number; habitableAreaKm2: number; deductedFeatures: string[] } {
  const grossAreaKm2 = calculatePolygonGeometricAreaKm2(landmass.points, landmass.radius, kmPerCoordinateUnit);

  const childFeatures = allFeatures.filter(f =>
    (f.parentId === landmass.id || (f.parentId === null && Math.hypot(f.x - landmass.x, f.y - landmass.y) <= (landmass.radius || 20) * 0.75)) &&
    (f.type === 'biome_vulkan' || f.type === 'vulkan' || f.type === 'krater' || f.type === 'biome_gebirge')
  );

  let uninhabitableKm2 = 0;
  const deductedFeatures: string[] = [];

  childFeatures.forEach(feat => {
    const featArea = calculatePolygonGeometricAreaKm2(feat.points, feat.radius, kmPerCoordinateUnit);
    const deduction = Math.min(grossAreaKm2 * 0.65, featArea);
    uninhabitableKm2 += deduction;
    deductedFeatures.push(`${feat.name} (${feat.type.includes('vulkan') ? 'Vulkan' : 'Gebirge'}: -${Math.round(deduction)} km²)`);
  });

  const habitableAreaKm2 = Math.max(0.5, Math.round((grossAreaKm2 - uninhabitableKm2) * 10) / 10);

  return {
    grossAreaKm2,
    uninhabitableKm2: Math.round(uninhabitableKm2 * 10) / 10,
    habitableAreaKm2,
    deductedFeatures
  };
}

/**
 * Comprehensive Plausibility Evaluator: Analyzes geographic area, habitable space, population count,
 * density classification, and economic/lore context without rigid global minimums.
 */
export function evaluateTerritoriesPlausibility(
  allTerritories: Territory[],
  existingLore: LoreEntry[] = [],
  kmPerCoordinateUnit: number = 10
): DrawingPlausibilitySummary {
  const evaluatedItems: PlausibilityReportItem[] = [];
  const loreText = existingLore.map(l => `${l.title} ${l.description || ''}`).join(' ').toLowerCase();

  allTerritories.forEach(t => {
    const isLand = isLandTerritory(t);
    const isSettlement = t.settlementType !== undefined ||
      t.type === 'stadt' ||
      t.type === 'hauptstadt' ||
      t.type === 'grossstadt' ||
      t.type === 'kleinstadt' ||
      t.type === 'dorf' ||
      t.type === 'hafen' ||
      t.type === 'festung';

    if (!isLand && !isSettlement) return;

    const parentTerr = t.parentId ? allTerritories.find(p => p.id === t.parentId) : undefined;
    const { grossAreaKm2, habitableAreaKm2, deductedFeatures } = calculateTerritoryHabitableAreaKm2(
      t,
      allTerritories,
      kmPerCoordinateUnit
    );

    const popCount = parseNumericPopulation(t.population) ?? t.populationCount;
    let density: number | undefined = undefined;
    if (popCount !== undefined && popCount > 0) {
      density = Math.round((popCount / Math.max(0.1, habitableAreaKm2)) * 10) / 10;
    }

    // Qualitative density classification
    let densityClass: 'niedrig' | 'normal' | 'hoch' | 'sehr_hoch' | 'extrem' = 'normal';
    if (density !== undefined) {
      if (density < 15) densityClass = 'niedrig';
      else if (density <= 150) densityClass = 'normal';
      else if (density <= 600) densityClass = 'hoch';
      else if (density <= 2500) densityClass = 'sehr_hoch';
      else densityClass = 'extrem';
    }

    // Search for contextual justifications (Economic, Maritime, Urban, Lore, Magic)
    const justifications: string[] = [];
    const notes: string[] = [];

    const desc = (t.description || '').toLowerCase();
    const tName = t.name.toLowerCase();

    const isHarbor = isSettlement && (t.settlementType === 'hafen' || t.type === 'hafen' || tName.includes('hafen') || desc.includes('hafen'));
    const isCapital = isSettlement && (t.settlementType === 'hauptstadt' || t.type === 'hauptstadt' || tName.includes('hauptstadt') || desc.includes('hauptstadt'));
    const isFortress = isSettlement && (t.settlementType === 'festung' || t.type === 'festung' || tName.includes('festung') || desc.includes('festung'));

    // Check child settlements if this is a landmass
    const childSettlements = allTerritories.filter(c => c.parentId === t.id && (c.settlementType || c.type === 'hafen' || c.type === 'stadt' || c.type === 'dorf'));
    const hasChildHarbor = childSettlements.some(c => c.settlementType === 'hafen' || c.type === 'hafen' || (c.name || '').toLowerCase().includes('hafen'));
    const hasChildCapital = childSettlements.some(c => c.settlementType === 'hauptstadt' || c.type === 'hauptstadt');

    if (isHarbor || hasChildHarbor) justifications.push('Geschäftiger Seehafen mit regem Seehandel & maritimer Versorgung');
    if (isCapital || hasChildCapital) justifications.push('Reichshauptstadt / Politisches & administratives Zentrum');
    if (isFortress) justifications.push('Befestigte Festungsgarnison mit konzentrierter Besiedlung');
    if (desc.includes('handel') || desc.includes('markt') || desc.includes('gilde') || loreText.includes(tName + ' handel')) {
      justifications.push('Bedeutendes Handels- und Wirtschaftszentrum');
    }
    if (desc.includes('fruchtbar') || desc.includes('oase') || desc.includes('agrar')) {
      justifications.push('Fruchtbare Böden mit hoher landwirtschaftlicher Tragfähigkeit');
    }
    if (desc.includes('magie') || desc.includes('magisch') || desc.includes('schrein') || desc.includes('tempel')) {
      justifications.push('Magische Ressourcen oder Zufluchtsort');
    }
    if (deductedFeatures.length > 0) {
      notes.push(`Unbewohnbare Zonen abgezogen: ${deductedFeatures.join(', ')}`);
    }

    // Determine plausibility status
    let plausibilityStatus: 'plausibel' | 'ungewoehnlich_begruendet' | 'unplausibel_korrigiert' = 'plausibel';
    let statusLabel = 'Plausibel';
    let suggestedAction: string | undefined = undefined;

    if (density !== undefined) {
      if (isSettlement) {
        // Settlements are urban footprint points — high density is expected and natural
        if (densityClass === 'extrem') {
          plausibilityStatus = justifications.length > 0 ? 'ungewoehnlich_begruendet' : 'plausibel';
          statusLabel = 'Dichte Siedlung (Urbane Konzentration)';
        } else {
          plausibilityStatus = 'plausibel';
          statusLabel = 'Plausible Siedlungsdichte';
        }
      } else {
        // Landmass / Island
        if (densityClass === 'niedrig') {
          statusLabel = 'Geringe Dichte (Wildnis / Weitläufiges Kulturland)';
        } else if (densityClass === 'normal') {
          statusLabel = 'Normale regionale Bevölkerungsdichte';
        } else if (densityClass === 'hoch') {
          if (justifications.length > 0) {
            statusLabel = 'Erhöhte Dichte (durch Handels- oder Küsteninfrastruktur gestützt)';
          } else {
            statusLabel = 'Solide Dichte für besiedeltes Kernland';
          }
        } else if (densityClass === 'sehr_hoch') {
          if (justifications.length > 0) {
            plausibilityStatus = 'ungewoehnlich_begruendet';
            statusLabel = 'Ungewöhnlich hohe Dichte (durch Kontext & Infrastruktur plausibel)';
          } else {
            plausibilityStatus = 'unplausibel_korrigiert';
            statusLabel = 'Unplausibel hohe Dichte ohne städtische/wirtschaftliche Infrastruktur';
            suggestedAction = `Größere organische Küstenlinie zeichnen (z.B. Radius um 40-70% vergrößern) oder eine befestigte Hafenstadt/Handelsstruktur deklarieren.`;
          }
        } else if (densityClass === 'extrem') {
          if (justifications.length > 0 && (isHarbor || hasChildHarbor || isCapital || hasChildCapital)) {
            plausibilityStatus = 'ungewoehnlich_begruendet';
            statusLabel = 'Extreme Dichte (als konzentrierter Insel-Stadtstaat/Hafen begründet)';
          } else {
            plausibilityStatus = 'unplausibel_korrigiert';
            statusLabel = 'Unplausibel extreme Bevölkerungsdichte auf zu kleiner Fläche';
            suggestedAction = `Fläche anpassen: Küstenlinie frei erweitern, um ${popCount.toLocaleString('de-DE')} Einwohnern angemessenen Raum zu bieten, oder urbane Hafenmetropole mit Lore-Hintergrund etablieren.`;
          }
        }
      }
    }

    evaluatedItems.push({
      territoryId: t.id,
      name: t.name,
      type: t.type,
      isSettlement,
      parentName: parentTerr?.name,
      areaKm2: grossAreaKm2,
      habitableAreaKm2,
      populationCount: popCount,
      populationDisplay: t.population,
      populationDensity: density,
      densityClassification: densityClass,
      plausibilityStatus,
      statusLabel,
      justifications,
      notes,
      suggestedAction
    });
  });

  const hasUnexplainedExtremeDensity = evaluatedItems.some(i => i.plausibilityStatus === 'unplausibel_korrigiert');
  const overallPlausible = !hasUnexplainedExtremeDensity;

  let feedbackPrompt: string | undefined = undefined;
  if (hasUnexplainedExtremeDensity) {
    const unplausibleList = evaluatedItems
      .filter(i => i.plausibilityStatus === 'unplausibel_korrigiert')
      .map(i => `- "${i.name}" (Typ: ${i.type}): Tatsächliche Fläche ${i.areaKm2} km² (bewohnbar: ${i.habitableAreaKm2} km²), Einwohner: ${i.populationCount}, Dichte: ${i.populationDensity} Ew/km². Problem: ${i.statusLabel}. Lösung: ${i.suggestedAction}`)
      .join('\n');

    feedbackPrompt = `Folgende geografische Plausibilitäts-Diskrepanzen wurden bei der Flächen- und Dichteprüfung festgestellt:\n${unplausibleList}\n\nBitte passe den Zeichenplan an: Zeichne für betroffene Landmassen eine größere, natürliche freie Küstenlinie ('radius' vergrößern oder weitere freie Polygonpunkte) ODER platziere eine befestigte Hafenstadt/Handelszentrum ('place_settlement' mit 'hafen'), die die hohe Bevölkerungsdichte logisch trägt.`;
  }

  return {
    overallPlausible,
    hasUnexplainedExtremeDensity,
    evaluatedTerritories: evaluatedItems,
    plausibilityFeedbackPrompt: feedbackPrompt
  };
}

/**
 * Finds coastline points on a landmass polygon in a specific compass direction.
 */
export function findCoastPointOnLandmass(
  landmass: Territory,
  direction?: DrawingDirection
): { x: number; y: number } {
  const pts = landmass.points;
  const cx = landmass.x;
  const cy = landmass.y;
  const rad = landmass.radius || 20;

  if (pts && pts.length >= 3) {
    if (!direction || direction === 'center') {
      let bestPt = pts[0];
      let maxDist = -1;
      pts.forEach(p => {
        const d = Math.hypot(p.x - cx, p.y - cy);
        if (d > maxDist) {
          maxDist = d;
          bestPt = p;
        }
      });
      return { x: bestPt.x, y: bestPt.y };
    }

    const vec = DIRECTION_VECTORS[direction] || DIRECTION_VECTORS.south;
    const targetAngle = Math.atan2(vec.dy, vec.dx);

    let bestPoint = pts[0];
    let smallestAngleDiff = Infinity;

    pts.forEach(p => {
      const angle = Math.atan2(p.y - cy, p.x - cx);
      let diff = Math.abs(angle - targetAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < smallestAngleDiff) {
        smallestAngleDiff = diff;
        bestPoint = p;
      }
    });

    return { x: bestPoint.x, y: bestPoint.y };
  }

  // Fallback
  const vec = (direction && DIRECTION_VECTORS[direction]) ? DIRECTION_VECTORS[direction] : DIRECTION_VECTORS.south;
  const coastDist = rad * 0.94;
  return {
    x: Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, Math.round(cx + vec.dx * coastDist))),
    y: Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, Math.round(cy + vec.dy * coastDist)))
  };
}

/**
 * Validates a DrawingPlan and its generated geometry against cartographic rules and plausibility.
 */
export function validateDrawingPlanAndGeometries(
  plan: DrawingPlan,
  generatedTerritories: Territory[],
  existingTerritories: Territory[],
  existingLore: LoreEntry[] = [],
  kmPerCoordinateUnit: number = 10
): DrawingValidationResult {
  const issues: DrawingValidationIssue[] = [];

  if (!plan || !Array.isArray(plan.actions) || plan.actions.length === 0) {
    return {
      valid: false,
      issues: [{
        code: 'EMPTY_PLAN',
        level: 'error',
        message: 'Der Zeichenplan enthält keine Aktionen.'
      }]
    };
  }

  const allKnownNames = new Set<string>();
  existingTerritories.forEach(t => {
    allKnownNames.add(t.name.trim().toLowerCase());
    allKnownNames.add(normalizeEntityName(t.name));
  });
  generatedTerritories.forEach(t => {
    allKnownNames.add(t.name.trim().toLowerCase());
    allKnownNames.add(normalizeEntityName(t.name));
  });

  plan.actions.forEach((action, idx) => {
    if (!action || !action.tool) {
      issues.push({
        code: 'INVALID_ACTION',
        level: 'error',
        actionIndex: idx,
        message: `Aktion #${idx + 1} besitzt kein gültiges 'tool'-Feld.`
      });
      return;
    }

    switch (action.tool) {
      case 'create_landmass':
      case 'draw_landmass': {
        if (!action.name || !action.name.trim()) {
          issues.push({
            code: 'MISSING_NAME',
            level: 'error',
            actionIndex: idx,
            message: `Landmasse in Aktion #${idx + 1} hat keinen Namen.`
          });
        }
        break;
      }
      case 'create_sea_zone':
      case 'draw_sea_zone': {
        if (!action.parentSea) {
          issues.push({
            code: 'MISSING_PARENT_SEA',
            level: 'error',
            actionIndex: idx,
            targetName: action.name,
            message: `Meereszone "${action.name}" hat kein 'parentSea' angegeben.`
          });
        } else {
          const parentNorm = normalizeEntityName(action.parentSea);
          const hasParent = allKnownNames.has(action.parentSea.trim().toLowerCase()) || allKnownNames.has(parentNorm);
          if (!hasParent) {
            issues.push({
              code: 'PARENT_SEA_NOT_FOUND',
              level: 'warning',
              actionIndex: idx,
              targetName: action.name,
              message: `Übergeordnetes Meer "${action.parentSea}" für Zone "${action.name}" wurde nicht gefunden. Ein Basis-Meer wird automatisch erstellt.`
            });
          }
        }
        break;
      }
      case 'place_settlement':
      case 'draw_settlement': {
        if (!action.name) {
          issues.push({
            code: 'MISSING_NAME',
            level: 'error',
            actionIndex: idx,
            message: `Siedlung in Aktion #${idx + 1} hat keinen Namen.`
          });
        }
        if (!action.parent) {
          issues.push({
            code: 'MISSING_PARENT_LAND',
            level: 'warning',
            actionIndex: idx,
            targetName: action.name,
            message: `Siedlung "${action.name}" hat kein übergeordnetes Land ('parent') angegeben.`
          });
        }
        break;
      }
      case 'create_route':
      case 'draw_route': {
        if (!action.from || !action.to) {
          issues.push({
            code: 'ROUTE_MISSING_ENDPOINTS',
            level: 'error',
            actionIndex: idx,
            targetName: action.name || 'Route',
            message: `Route benötigt sowohl 'from' als auch 'to' Endpunkte.`
          });
        }
        break;
      }
      case 'create_feature':
      case 'draw_feature': {
        if (!action.name) {
          issues.push({
            code: 'MISSING_NAME',
            level: 'error',
            actionIndex: idx,
            message: `Feature in Aktion #${idx + 1} hat keinen Namen.`
          });
        }
        break;
      }
    }
  });

  // Geometry checks on generated territories
  generatedTerritories.forEach(t => {
    // 1. Coordinates inside world bounds
    if (isNaN(t.x) || isNaN(t.y)) {
      issues.push({
        code: 'NAN_COORDINATES',
        level: 'error',
        targetName: t.name,
        message: `Territorium "${t.name}" hat ungültige NaN-Koordinaten.`
      });
    }

    // 2. Closed polygon with >= 3 valid points for polygon territories
    const isPolyType = isLandTerritory(t) || isSeaTerritory(t) || t.type?.startsWith('biome_') || t.type === 'see';
    if (isPolyType && t.points) {
      if (t.points.length < 3) {
        issues.push({
          code: 'INSUFFICIENT_POINTS',
          level: 'error',
          targetName: t.name,
          message: `Polygon für "${t.name}" hat weniger als 3 Punkte (${t.points.length}).`
        });
      }
      const hasNanPts = t.points.some(p => isNaN(p.x) || isNaN(p.y));
      if (hasNanPts) {
        issues.push({
          code: 'NAN_POLYGON_POINTS',
          level: 'error',
          targetName: t.name,
          message: `Polygon für "${t.name}" enthält NaN-Punkte.`
        });
      }
    }

    // 3. Port coastline check
    if (t.type === 'hafen' || (t.name || '').toLowerCase().includes('hafen')) {
      const parentLand = existingTerritories.find(p => p.id === t.parentId) || generatedTerritories.find(p => p.id === t.parentId);
      if (parentLand) {
        const dist = Math.hypot(t.x - parentLand.x, t.y - parentLand.y);
        const landRad = parentLand.radius || 20;
        if (dist < landRad * 0.45) {
          issues.push({
            code: 'PORT_NOT_ON_COAST',
            level: 'warning',
            targetName: t.name,
            message: `Hafen "${t.name}" liegt zu tief im Landesinneren von "${parentLand.name}".`
          });
        }
      }
    }
  });

  // 4. Plausibility analysis
  const plausibility = evaluateTerritoriesPlausibility(
    [...existingTerritories, ...generatedTerritories],
    existingLore,
    kmPerCoordinateUnit
  );

  plausibility.evaluatedTerritories.forEach(item => {
    if (item.plausibilityStatus === 'unplausibel_korrigiert') {
      issues.push({
        code: 'PLAUSIBILITY_UNEXPLAINED_DENSITY',
        level: 'warning',
        targetName: item.name,
        message: `${item.name}: ${item.statusLabel} (${item.areaKm2} km² Fläche, ${item.populationCount} Einwohner, ${item.populationDensity} Ew/km²).`,
        suggestedFix: item.suggestedAction
      });
    }
  });

  const hasErrors = issues.some(i => i.level === 'error');
  return {
    valid: !hasErrors,
    issues
  };
}

/**
 * Main execution function that interprets the AI DrawingPlan into AdventureForge world entities.
 * Ensures zero preset shapes are used: all geometries are free AI-driven polygons and features.
 */
export function executeDrawingPlan(
  plan: DrawingPlan,
  world: WorldSetting,
  existingTerritories: Territory[],
  existingLore: LoreEntry[] = [],
  kmPerCoordinateUnit: number = 10
): DrawingExecutionResult {
  const ts = Date.now();
  const effectiveKmPerUnit = world.mapConfig?.kmPerCoordinateUnit || kmPerCoordinateUnit || 10;

  // Spatial entity index for fast lookup
  const entityMap = new Map<string, Territory>();
  const generatedTerritories: Territory[] = [];
  const generatedHoldings: EconomyHolding[] = [];
  const generatedConnections: DrawingConnectionItem[] = [];
  const generatedLore: LoreEntry[] = [];

  // Register existing territories as immutable anchor references (NEVER mutated or overwritten)
  existingTerritories.forEach(t => {
    entityMap.set(t.id, t);
    entityMap.set(t.name.trim().toLowerCase(), t);
    entityMap.set(normalizeEntityName(t.name), t);
  });

  const findEntity = (nameOrId?: string): Territory | undefined => {
    if (!nameOrId) return undefined;
    const clean = nameOrId.trim().toLowerCase();
    if (entityMap.has(clean)) return entityMap.get(clean);
    const norm = normalizeEntityName(nameOrId);
    if (entityMap.has(norm)) return entityMap.get(norm);
    return undefined;
  };

  const registerNewTerritory = (t: Territory) => {
    entityMap.set(t.id, t);
    entityMap.set(t.name.trim().toLowerCase(), t);
    entityMap.set(normalizeEntityName(t.name), t);
    generatedTerritories.push(t);
  };

  // Group sea zones by parent sea for coherent batch subdivisions
  const pendingSeaZones = new Map<string, DrawingAction[]>();

  // Determine starting reference center if none exists
  let lastAnchorX = WORLD_BOUNDS.centerX;
  let lastAnchorY = WORLD_BOUNDS.centerY;
  if (existingTerritories.length > 0) {
    const firstLand = existingTerritories.find(isLandTerritory) || existingTerritories[0];
    lastAnchorX = firstLand.x;
    lastAnchorY = firstLand.y;
  }

  // 1. Process Landmasses, Seas, Features, Settlements, POIs, Routes
  (plan.actions || []).forEach((action, actionIdx) => {
    if (!action || !action.tool) return;

    switch (action.tool) {
      case 'create_landmass':
      case 'draw_landmass': {
        const anchor = action.relativeTo ? findEntity(action.relativeTo) : undefined;
        const refX = anchor ? anchor.x : (action.center ? action.center.x : lastAnchorX);
        const refY = anchor ? anchor.y : (action.center ? action.center.y : lastAnchorY);

        let posX = refX;
        let posY = refY;

        if (action.center && !isNaN(action.center.x) && !isNaN(action.center.y)) {
          posX = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, action.center.x));
          posY = Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, action.center.y));
        } else if (action.direction && action.direction !== 'center') {
          const vec = DIRECTION_VECTORS[action.direction] || DIRECTION_VECTORS.east;
          const distUnits = calculateCoordinateDistance(action.distanceKm, effectiveKmPerUnit);
          const anchorRad = anchor?.radius || 18;
          posX = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, Math.round(refX + vec.dx * (anchorRad + distUnits))));
          posY = Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, Math.round(refY + vec.dy * (anchorRad + distUnits))));
        } else if (!anchor && generatedTerritories.length === 0 && existingTerritories.length === 0) {
          posX = WORLD_BOUNDS.centerX;
          posY = WORLD_BOUNDS.centerY;
        }

        // Calculate radius
        let radius = 22;
        if (typeof action.radius === 'number' && action.radius > 0) {
          radius = action.radius;
        } else if (action.type === 'insel') radius = 16;
        else if (action.type === 'kontinent') radius = 42;
        else if (action.type === 'koenigreich' || action.type === 'land') radius = 28;

        const lType = action.type || (radius <= 16 ? 'insel' : 'koenigreich');
        const lSeed = Math.floor(Math.random() * 10000);
        const lRoughness = action.coastlineRoughness !== undefined ? action.coastlineRoughness : 0.45;

        // FREE AI GEOMETRY: If AI provided points, normalize and use them. Otherwise, generate an organic Fourier contour.
        let finalPoints: { x: number; y: number }[] = [];
        if (action.points && Array.isArray(action.points) && action.points.length >= 3) {
          const normalized = normalizePoints(action.points, { x: posX, y: posY }, radius);
          finalPoints = repairPolygonSelfIntersections(normalized);
        }

        if (finalPoints.length < 3) {
          finalPoints = generateOrganicContourFromAI(posX, posY, radius, lRoughness, lSeed, action.shapeDescription);
        }

        const parentTerr = action.parent ? findEntity(action.parent) : undefined;
        const defaultColor = lType === 'insel' ? '#16a34a' : '#15803d';

        const newTerr: Territory = {
          id: `ai-land-${ts}-${actionIdx}`,
          name: action.name || `Landmasse ${actionIdx + 1}`,
          type: lType,
          description: action.description || 'Eine gestaltete Landmasse mit lebendiger Geografie.',
          parentId: parentTerr ? parentTerr.id : null,
          x: posX,
          y: posY,
          radius: radius,
          points: finalPoints,
          coastlineRoughness: lRoughness,
          seed: lSeed,
          color: action.color || defaultColor,
          climate: action.climate || 'Gemäßigt',
          terrain: action.terrain || 'Hügel & Wälder',
          faction: action.faction,
          ruler: action.ruler,
          population: action.population ? String(action.population) : undefined,
          isUnlocked: true
        };

        registerNewTerritory(newTerr);
        lastAnchorX = posX;
        lastAnchorY = posY;
        break;
      }

      case 'create_sea':
      case 'draw_sea': {
        const anchor = action.relativeTo ? findEntity(action.relativeTo) : undefined;
        const refX = anchor ? anchor.x : (action.center ? action.center.x : WORLD_BOUNDS.centerX);
        const refY = anchor ? anchor.y : (action.center ? action.center.y : WORLD_BOUNDS.centerY);

        let posX = refX;
        let posY = refY;

        if (action.center && !isNaN(action.center.x) && !isNaN(action.center.y)) {
          posX = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, action.center.x));
          posY = Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, action.center.y));
        } else if (action.direction && action.direction !== 'center') {
          const vec = DIRECTION_VECTORS[action.direction] || DIRECTION_VECTORS.south;
          const distUnits = calculateCoordinateDistance(action.distanceKm, effectiveKmPerUnit);
          posX = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, Math.round(refX + vec.dx * distUnits)));
          posY = Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, Math.round(refY + vec.dy * distUnits)));
        }

        let radius = action.radius || 48;
        const sSeed = Math.floor(Math.random() * 10000);

        let finalPoints: { x: number; y: number }[] = [];
        if (action.points && Array.isArray(action.points) && action.points.length >= 3) {
          const normalized = normalizePoints(action.points, { x: posX, y: posY }, radius);
          finalPoints = repairPolygonSelfIntersections(normalized);
        }

        if (finalPoints.length < 3) {
          finalPoints = generateNaturalFreehandZonePoints(posX, posY, radius, 'meer', sSeed, 0.35);
        }

        const newSea: Territory = {
          id: `ai-sea-${ts}-${actionIdx}`,
          name: action.name || 'Hauptmeer',
          type: 'meer',
          description: action.description || 'Weite, zusammenhängende Meeresfläche mit Seewegen.',
          parentId: null,
          x: posX,
          y: posY,
          radius: radius,
          points: finalPoints,
          seed: sSeed,
          color: action.color || '#0284c7',
          climate: 'Maritim',
          terrain: 'Tiefsee & Ozean',
          isUnlocked: true
        };

        registerNewTerritory(newSea);
        break;
      }

      case 'create_sea_zone':
      case 'draw_sea_zone': {
        const pSeaKey = action.parentSea ? action.parentSea.trim().toLowerCase() : 'default_sea';
        if (!pendingSeaZones.has(pSeaKey)) {
          pendingSeaZones.set(pSeaKey, []);
        }
        pendingSeaZones.get(pSeaKey)!.push(action);
        break;
      }

      case 'place_settlement':
      case 'draw_settlement': {
        const parentLand = findEntity(action.parent);
        const isPort = action.settlementType === 'hafen' ||
          action.onCoast === true ||
          (action.name || '').toLowerCase().includes('hafen') ||
          (action.name || '').toLowerCase().includes('port');

        let sX = action.position ? action.position.x : (parentLand ? parentLand.x : WORLD_BOUNDS.centerX);
        let sY = action.position ? action.position.y : (parentLand ? parentLand.y : WORLD_BOUNDS.centerY);
        const parentRad = parentLand?.radius || 20;

        if (parentLand) {
          if (isPort) {
            // Find coastal coordinate on parent landmass
            const coastPos = findCoastPointOnLandmass(parentLand, action.coastDirection);
            sX = coastPos.x;
            sY = coastPos.y;
          } else if (!action.position) {
            // Inland placement inside parent
            const angle = (actionIdx * 1.9) % (Math.PI * 2);
            const innerDist = parentRad * 0.35;
            sX = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, Math.round(parentLand.x + Math.cos(angle) * innerDist)));
            sY = Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, Math.round(parentLand.y + Math.sin(angle) * innerDist)));
          }
        }

        const sType = action.settlementType || (isPort ? 'hafen' : 'stadt');
        const sRad = (sType === 'hauptstadt' || sType === 'grossstadt') ? 4.5 :
                     (sType === 'stadt' || sType === 'hafen') ? 3.8 :
                     (sType === 'festung') ? 3.2 : 2.2;

        const defaultColor = isPort ? '#0ea5e9' : (sType === 'festung' ? '#dc2626' : (sType === 'dorf' ? '#10b981' : '#6366f1'));

        const newSettlement: Territory = {
          id: `ai-settle-${ts}-${actionIdx}`,
          name: action.name,
          type: sType,
          settlementType: sType,
          description: action.description || (isPort ? 'Geschäftiger Seehafen mit Kaianlagen.' : 'Bedeutende Siedlung.'),
          parentId: parentLand ? parentLand.id : null,
          x: sX,
          y: sY,
          radius: sRad,
          color: action.color || defaultColor,
          faction: action.faction || parentLand?.faction,
          ruler: action.ruler || parentLand?.ruler,
          population: action.population ? String(action.population) : undefined,
          isUnlocked: true
        };

        registerNewTerritory(newSettlement);
        break;
      }

      case 'place_poi': {
        // POIs are registered as Economy Holdings & Codex entries, NEVER giant territory polygons
        const parentEntity = findEntity(action.parent);
        const holdingType = (action.poiType as any) || 'taverne';

        const newHolding: EconomyHolding = {
          id: `holding-ai-${ts}-${actionIdx}`,
          name: action.name,
          type: holdingType,
          description: action.description || `Interessanter Ort (${action.poiType}) im Einflussbereich von ${parentEntity ? parentEntity.name : 'der Region'}.`,
          level: action.level || 1,
          ownerType: 'character',
          assignedCharacterName: parentEntity?.ruler || 'Lokaler Verwalter',
          incomePerInterval: 50,
          upkeepPerInterval: 10,
          staffCount: 3,
          reputation: 60,
          status: 'active'
        };

        generatedHoldings.push(newHolding);

        // Also add lightweight lore entry for the POI
        generatedLore.push({
          id: `lore-poi-${ts}-${actionIdx}`,
          title: action.name,
          category: 'Weltregeln',
          description: action.description || `${action.name} (${action.poiType}) in ${parentEntity?.name || 'der Welt'}.`,
          isUnlocked: true
        });
        break;
      }

      case 'create_route':
      case 'draw_route': {
        const fromEntity = findEntity(action.from);
        const toEntity = findEntity(action.to);

        const x1 = fromEntity ? fromEntity.x : WORLD_BOUNDS.centerX - 30;
        const y1 = fromEntity ? fromEntity.y : WORLD_BOUNDS.centerY;
        const x2 = toEntity ? toEntity.x : WORLD_BOUNDS.centerX + 30;
        const y2 = toEntity ? toEntity.y : WORLD_BOUNDS.centerY;

        const isSeaRoute = action.routeType === 'seeweg' ||
          (action.name || '').toLowerCase().includes('seeweg') ||
          (action.name || '').toLowerCase().includes('ozean') ||
          (action.name || '').toLowerCase().includes('meer');

        let routePoints: { x: number; y: number }[] = [];
        if (action.waypoints && Array.isArray(action.waypoints) && action.waypoints.length > 0) {
          routePoints = normalizePoints(action.waypoints);
        }

        if (routePoints.length < 2) {
          const midX = Math.round((x1 + x2) / 2 + (isSeaRoute ? (Math.random() * 6 - 3) : 0));
          const midY = Math.round((y1 + y2) / 2 + (isSeaRoute ? (Math.random() * 6 - 3) : 0));
          routePoints = [{ x: x1, y: y1 }, { x: midX, y: midY }, { x: x2, y: y2 }];
        }

        const distKm = action.distanceKm || Math.round(Math.hypot(x2 - x1, y2 - y1) * effectiveKmPerUnit);
        const rName = action.name || (isSeaRoute ? `Seeroute (${action.from} - ${action.to})` : `Handelsstraße (${action.from} - ${action.to})`);
        const rColor = action.color || (isSeaRoute ? '#0284c7' : '#d97706');

        const newRouteTerritory: Territory = {
          id: `ai-route-${ts}-${actionIdx}`,
          name: rName,
          type: 'weg',
          description: action.description || `${isSeaRoute ? 'Befahrener Seeweg' : 'Handelsstraße'} zwischen ${action.from} und ${action.to} (ca. ${distKm} km).`,
          parentId: fromEntity?.parentId || null,
          x: Math.round((x1 + x2) / 2),
          y: Math.round((y1 + y2) / 2),
          points: routePoints,
          color: rColor,
          isUnlocked: true
        };

        registerNewTerritory(newRouteTerritory);

        // Also add connection object for game navigation
        generatedConnections.push({
          id: `conn-ai-${ts}-${actionIdx}`,
          fromId: fromEntity?.id,
          toId: toEntity?.id,
          fromPlace: action.from,
          toPlace: action.to,
          label: rName,
          travelTime: `${Math.max(1, Math.round(distKm / 25))} Tage Reisezeit`,
          distance: `${distKm} km`,
          type: isSeaRoute ? 'sea' : 'land',
          isUnlocked: true
        });
        break;
      }

      case 'create_feature':
      case 'draw_feature': {
        const parentLand = findEntity(action.parent);
        const fRefX = parentLand ? parentLand.x : (action.center ? action.center.x : WORLD_BOUNDS.centerX);
        const fRefY = parentLand ? parentLand.y : (action.center ? action.center.y : WORLD_BOUNDS.centerY);
        const pRad = parentLand?.radius || 24;

        let fx = fRefX;
        let fy = fRefY;

        if (action.center && !isNaN(action.center.x) && !isNaN(action.center.y)) {
          fx = action.center.x;
          fy = action.center.y;
        } else if (action.direction && action.direction !== 'center') {
          const vec = DIRECTION_VECTORS[action.direction] || DIRECTION_VECTORS.north;
          fx = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, Math.round(fRefX + vec.dx * (pRad * 0.4))));
          fy = Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, Math.round(fRefY + vec.dy * (pRad * 0.4))));
        }

        let fRad = 8;
        if (typeof action.size === 'number') fRad = action.size;
        else if (action.size === 'klein') fRad = 5;
        else if (action.size === 'mittel') fRad = 9;
        else if (action.size === 'gross') fRad = 15;

        const fType = (action.featureType || 'gebirge').toLowerCase();
        const biomeType = fType === 'gebirge' ? 'biome_gebirge' :
                          fType === 'wald' ? 'biome_wald' :
                          fType === 'dschungel' ? 'biome_dschungel' :
                          fType === 'wueste' ? 'biome_wueste' :
                          fType === 'sumpf' ? 'biome_sumpf' :
                          fType === 'see' ? 'see' :
                          fType === 'fluss' ? 'fluss' :
                          fType === 'vulkan' || fType === 'krater' ? 'biome_vulkan' : 'biome_gebirge';

        const defaultFeatureColor =
          biomeType === 'biome_vulkan' ? '#dc2626' :
          biomeType === 'biome_gebirge' ? '#78716c' :
          biomeType === 'biome_wald' ? '#15803d' :
          biomeType === 'biome_dschungel' ? '#047857' :
          biomeType === 'biome_wueste' ? '#d97706' :
          biomeType === 'biome_sumpf' ? '#4d7c0f' :
          biomeType === 'see' || biomeType === 'fluss' ? '#0284c7' : '#64748b';

        let fPoints: { x: number; y: number }[] = [];
        if (action.points && Array.isArray(action.points) && action.points.length >= 2) {
          fPoints = normalizePoints(action.points, { x: fx, y: fy }, fRad);
          if (biomeType !== 'fluss') {
            fPoints = repairPolygonSelfIntersections(fPoints);
          }
        }

        if (fPoints.length < (biomeType === 'fluss' ? 2 : 3)) {
          if (biomeType === 'fluss') {
            // River polyline flowing from inland to coast
            const coastPt = parentLand ? findCoastPointOnLandmass(parentLand, 'south') : { x: fx + 10, y: fy + 10 };
            fPoints = [{ x: fx, y: fy }, { x: Math.round((fx + coastPt.x) / 2), y: Math.round((fy + coastPt.y) / 2) }, coastPt];
          } else {
            const fSeed = Math.floor(Math.random() * 10000);
            fPoints = generateNaturalFreehandZonePoints(fx, fy, fRad, biomeType, fSeed, 0.45);
          }
        }

        const newFeature: Territory = {
          id: `ai-feature-${ts}-${actionIdx}`,
          name: action.name,
          type: biomeType,
          description: action.description || `Geografisches Feature (${fType}) in ${parentLand ? parentLand.name : 'der Region'}.`,
          parentId: parentLand ? parentLand.id : null,
          x: fx,
          y: fy,
          radius: fRad,
          points: fPoints,
          color: action.color || defaultFeatureColor,
          isUnlocked: true
        };

        registerNewTerritory(newFeature);
        break;
      }
    }
  });

  // 2. Batch process Pending Sea Zones (subdividing parent seas into continuous zones)
  pendingSeaZones.forEach((actions, parentSeaName) => {
    let parentSea = findEntity(parentSeaName);

    // If parent sea doesn't exist yet, create a coherent parent sea first
    if (!parentSea) {
      const sSeed = Math.floor(Math.random() * 10000);
      const points = generateNaturalFreehandZonePoints(WORLD_BOUNDS.centerX, WORLD_BOUNDS.centerY, 60, 'meer', sSeed, 0.35);
      parentSea = {
        id: `ai-sea-master-${ts}`,
        name: parentSeaName !== 'default_sea' ? parentSeaName : 'Hauptmeer',
        type: 'meer',
        description: 'Zusammenhängende Meeresfläche für zonierte Gewässer.',
        parentId: null,
        x: WORLD_BOUNDS.centerX,
        y: WORLD_BOUNDS.centerY,
        radius: 60,
        points: points,
        seed: sSeed,
        color: '#0284c7',
        isUnlocked: true
      };
      registerNewTerritory(parentSea);
    }

    // Subdivide the mother sea into clean child zones
    const zoneConfigs = actions.map((act: any, idx: number) => ({
      name: act.name,
      type: 'meer' as const,
      color: act.color || (idx === 0 ? '#0284c7' : idx === 1 ? '#0ea5e9' : idx === 2 ? '#0369a1' : '#06b6d4'),
      description: act.description || `Maritime Zone ${act.name} in ${parentSea!.name}`,
      dangerLevel: act.dangerLevel || 'Moderat',
      weight: act.weight || 1,
      tags: act.tags || ['Meereszone'],
      climate: act.climate || 'Maritim'
    }));

    const partitionMode: ZonePartitionMode = zoneConfigs.length <= 4 ? 'horizontal_bands' : 'vertical_sectors';
    const subResult = subdivideTerritoryIntoZones(
      parentSea,
      {
        mode: partitionMode,
        zones: zoneConfigs,
        keepParentAsContainer: true,
        reassignInnerPlaces: true
      },
      [...existingTerritories, ...generatedTerritories]
    );

    subResult.createdTerritories.forEach(zoneTerr => {
      registerNewTerritory(zoneTerr);
    });
  });

  // 3. Process suggested lore from the plan
  if (plan.suggestedLore && Array.isArray(plan.suggestedLore)) {
    const existingLoreTitles = new Set(existingLore.map(l => (l.title || '').trim().toLowerCase()));
    plan.suggestedLore.forEach((l, lIdx) => {
      const lTitle = (l.title || 'Ort').trim();
      if (!existingLoreTitles.has(lTitle.toLowerCase())) {
        generatedLore.push({
          id: `lore-plan-${ts}-${lIdx}`,
          title: lTitle,
          category: (l.category as any) || 'Orte',
          description: l.description || '',
          isUnlocked: true
        });
        existingLoreTitles.add(lTitle.toLowerCase());
      }
    });
  }

  // 4. Plausibility & Area Calculations
  const allCurrentTerritories = [...existingTerritories, ...generatedTerritories];
  const allCurrentLore = [...existingLore, ...generatedLore];
  const plausibility = evaluateTerritoriesPlausibility(
    allCurrentTerritories,
    allCurrentLore,
    effectiveKmPerUnit
  );

  const evalMap = new Map<string, PlausibilityReportItem>();
  plausibility.evaluatedTerritories.forEach(item => {
    evalMap.set(item.territoryId, item);
  });

  // Synchronize calculated actual area, population count, density, and plausibility on every generated territory
  generatedTerritories.forEach(t => {
    const pInfo = evalMap.get(t.id);
    if (pInfo) {
      t.areaKm2 = pInfo.areaKm2;
      t.habitableAreaKm2 = pInfo.habitableAreaKm2;
      t.populationCount = pInfo.populationCount;
      t.populationDensity = pInfo.populationDensity;
      t.densityClassification = pInfo.densityClassification;
      t.densityJustification = pInfo.justifications.join('; ') || undefined;
      t.plausibilityStatus = pInfo.plausibilityStatus;
    } else {
      t.areaKm2 = calculatePolygonGeometricAreaKm2(t.points, t.radius, effectiveKmPerUnit);
    }
  });

  // 5. Validate output
  const validation = validateDrawingPlanAndGeometries(
    plan,
    generatedTerritories,
    existingTerritories,
    allCurrentLore,
    effectiveKmPerUnit
  );

  return {
    territories: generatedTerritories,
    holdings: generatedHoldings,
    connections: generatedConnections,
    suggestedLore: generatedLore,
    validation,
    plausibility,
    executedActionsCount: plan.actions ? plan.actions.length : 0,
    planOverview: plan.planOverview
  };
}
