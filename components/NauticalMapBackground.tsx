import React, { useMemo } from 'react';
import { LoreEntry } from '../types';
import { generateLandmassPathD } from '../lib/landmassShapes';
import { generateOrganicShape } from '../utils/mapUtils';

interface NauticalMapBackgroundProps {
  lore: LoreEntry[];
  mapZoomLevel: 'macro' | 'meso' | 'micro' | 'building';
  selectedMacroId?: string;
  selectedMesoId?: string;
  selectedMicroId?: string;
  worldTitle?: string;
  world?: any;
  zoomScale?: number;
  suppressTerritoryLandmasses?: boolean;
}

// Simple deterministic PRNG based on seed string to make map generation stable
const createPRNG = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = seed.charCodeAt(i) + ((h << 5) - h);
  }
  return (index: number) => {
    const x = Math.sin(h + index) * 10000;
    return x - Math.floor(x);
  };
};

// Map style themes matching "9. KARTEN-STILE (FARB & TEXTUR)" from the reference image
const themes = {
  watercolor: {
    waterFill: 'radial-gradient', // custom radial gradient handled below
    waterGridStroke: '#cae8f5',
    rhumbStroke: '#cbd5e1',
    coastlineColor: '#0284c7',
    beachFill: '#fef9c3',
    grassGrad: { stop1: '#668f23', stop2: '#4d8014', stop3: '#2e6910' }, // Natural cartographic green
    desertGrad: { stop1: '#cbb085', stop2: '#b28a52', stop3: '#9e7a40' },
    arcticGrad: { stop1: '#ffffff', stop2: '#e8ecef', stop3: '#cbd5e1' },
    swampGrad: { stop1: '#556847', stop2: '#3d4d32', stop3: '#23301c' },
    volcanoGrad: { stop1: '#64748b', stop2: '#475569', stop3: '#1e293b' },
    mountainFillLit: '#cbd5e1',
    mountainFillShadow: '#94a3b8',
    treeFill: '#15803d',
    textOpacity: 0.65,
    textColor: '#0369a1',
  },
  handdrawn: {
    waterFill: '#FAF7EE', // Creamy hand-sketched paper
    waterGridStroke: '#e2e2d5',
    rhumbStroke: '#cbd5e1',
    coastlineColor: '#4b5563', // Pencil gray
    beachFill: '#FAF7EE',
    grassGrad: { stop1: '#f1f5f9', stop2: '#cbd5e1', stop3: '#94a3b8' }, // Shaded pencil styles
    desertGrad: { stop1: '#FAF7EE', stop2: '#ebdcc4', stop3: '#d7c0ae' },
    arcticGrad: { stop1: '#ffffff', stop2: '#f1f5f9', stop3: '#cbd5e1' },
    swampGrad: { stop1: '#cbd5e1', stop2: '#94a3b8', stop3: '#64748b' },
    volcanoGrad: { stop1: '#94a3b8', stop2: '#64748b', stop3: '#475569' },
    mountainFillLit: '#f1f5f9',
    mountainFillShadow: '#94a3b8',
    treeFill: '#4b5563',
    textOpacity: 0.8,
    textColor: '#374151',
  },
  realistic: {
    waterFill: 'radial-gradient',
    waterGridStroke: '#1e293b',
    rhumbStroke: '#334155',
    coastlineColor: '#2563eb',
    beachFill: '#f1f5f9',
    grassGrad: { stop1: '#668f23', stop2: '#4d8014', stop3: '#2e6910' },
    desertGrad: { stop1: '#cbb085', stop2: '#b28a52', stop3: '#9e7a40' },
    arcticGrad: { stop1: '#ffffff', stop2: '#e2e8f0', stop3: '#cbd5e1' },
    swampGrad: { stop1: '#14532d', stop2: '#0f172a', stop3: '#020617' },
    volcanoGrad: { stop1: '#475569', stop2: '#334155', stop3: '#1e293b' },
    mountainFillLit: '#cbd5e1',
    mountainFillShadow: '#475569',
    treeFill: '#166534',
    textOpacity: 0.5,
    textColor: '#3b82f6',
  },
  parchment: {
    waterFill: '#e5d1a2', // Classic antique brown/sepia parchment
    waterGridStroke: '#cca15c',
    rhumbStroke: '#b0833a',
    coastlineColor: '#78551a',
    beachFill: '#e5d1a2',
    grassGrad: { stop1: '#dfcca2', stop2: '#c99f57', stop3: '#78551a' },
    desertGrad: { stop1: '#eed9aa', stop2: '#c99f57', stop3: '#aa823c' },
    arcticGrad: { stop1: '#faf7f0', stop2: '#dfcca2', stop3: '#c99f57' },
    swampGrad: { stop1: '#78551a', stop2: '#4a330a', stop3: '#dfcca2' },
    volcanoGrad: { stop1: '#4a330a', stop2: '#dfcca2', stop3: '#7c2d12' },
    mountainFillLit: '#eed9aa',
    mountainFillShadow: '#78551a',
    treeFill: '#78551a',
    textOpacity: 0.75,
    textColor: '#78551a',
  },
  fantasy_saturated: {
    waterFill: 'radial-gradient',
    waterGridStroke: '#1e3a8a',
    rhumbStroke: '#38bdf8',
    coastlineColor: '#0284c7',
    beachFill: '#dfcda7',
    grassGrad: { stop1: '#4d7c0f', stop2: '#65a30d', stop3: '#3f6212' },
    desertGrad: { stop1: '#fef08a', stop2: '#eab308', stop3: '#ca8a04' },
    arcticGrad: { stop1: '#ffffff', stop2: '#bae6fd', stop3: '#7dd3fc' },
    swampGrad: { stop1: '#31511e', stop2: '#4f6f52', stop3: '#1a3c40' },
    volcanoGrad: { stop1: '#1e293b', stop2: '#475569', stop3: '#0f172a' },
    mountainFillLit: '#8fa2b2',
    mountainFillShadow: '#4d5d6d',
    treeFill: '#1b431e',
    textOpacity: 0.55,
    textColor: '#38bdf8',
  },
  minimalist: {
    waterFill: '#f8fafc', // Modern layout
    waterGridStroke: '#f1f5f9',
    rhumbStroke: '#e2e8f0',
    coastlineColor: '#cbd5e1',
    beachFill: '#f8fafc',
    grassGrad: { stop1: '#f1f5f9', stop2: '#e2e8f0', stop3: '#cbd5e1' },
    desertGrad: { stop1: '#f8fafc', stop2: '#f1f5f9', stop3: '#e2e8f0' },
    arcticGrad: { stop1: '#ffffff', stop2: '#f8fafc', stop3: '#f1f5f9' },
    swampGrad: { stop1: '#e2e8f0', stop2: '#cbd5e1', stop3: '#94a3b8' },
    volcanoGrad: { stop1: '#f1f5f9', stop2: '#e2e8f0', stop3: '#cbd5e1' },
    mountainFillLit: '#f1f5f9',
    mountainFillShadow: '#cbd5e1',
    treeFill: '#64748b',
    textOpacity: 0.8,
    textColor: '#475569',
  }
};

export const NauticalMapBackground: React.FC<NauticalMapBackgroundProps> = ({
  lore,
  mapZoomLevel,
  selectedMacroId,
  selectedMesoId,
  selectedMicroId,
  worldTitle = 'Adventure',
  world,
  zoomScale,
  suppressTerritoryLandmasses = false
}) => {
  const zScale = zoomScale || 1;
  // Dynamic scale factor for text elements: larger when zoomed out (e.g., 400x400 container),
  // scaling back down to standard screen proportion when zoomed in to avoid clutter.
  const textScale = (1.35 + 1.6 / Math.sqrt(zScale));

  const seed = useMemo(() => `${worldTitle}-${mapZoomLevel}`, [worldTitle, mapZoomLevel]);
  const rnd = useMemo(() => createPRNG(seed), [seed]);

  const isOnePieceWorld = useMemo(() => {
    return !!world?.isOnePiece;
  }, [world?.isOnePiece]);

  const mapConfig = useMemo(() => {
    return world?.mapConfig || {
      continentStencil: 'none',
      coastlineStyle: 'rugged',
      mountainStyle: 'young',
      riverStyle: 'branched',
      biomeStyle: 'grassland',
      mapStyle: 'fantasy_saturated',
      decorations: ['compass', 'scale', 'banner', 'border'],
      mapWidth: 100,
      mapHeight: 100
    };
  }, [world?.mapConfig]);

  const mapWidth = mapConfig.mapWidth || 100;
  const mapHeight = mapConfig.mapHeight || 100;

  const mapStyle = mapConfig.mapStyle || 'fantasy_saturated';
  const theme = themes[mapStyle as keyof typeof themes] || themes.fantasy_saturated;

  // Extract active locations for the current zoom level to build landmasses around them
  const activePlaces = useMemo(() => {
    return lore.filter(l => {
      if (l.category !== 'Orte') return false;
      const coords = l.details?.coordinates;
      if (!coords || typeof coords.x !== 'number' || typeof coords.y !== 'number') return false;
      if (coords.x === 0 && coords.y === 0) return false; // filter out uninitialized/placeholder coordinates
      
      const type = (l.details?.type || '').toLowerCase();
      const biome = (l.details?.biome || '').toLowerCase();
      if (
        type.includes('see') || type.includes('meer') || type.includes('ozean') || type.includes('ocean') || type.includes('wasser') || type.includes('gulf') || type.includes('bay') || type.includes('bucht') ||
        biome.includes('see') || biome.includes('meer') || biome.includes('ozean') || biome.includes('ocean') || biome.includes('wasser') || biome.includes('gulf') || biome.includes('bay') || biome.includes('bucht')
      ) {
        return false;
      }

      const lvl = l.details?.mapLevel || 'meso';
      if (mapZoomLevel === 'macro') return lvl === 'macro';
      if (mapZoomLevel === 'meso') {
        if (lvl !== 'meso') return false;
        return selectedMacroId ? l.details?.parentPlaceId === selectedMacroId : true;
      }
      if (mapZoomLevel === 'micro') {
        if (lvl !== 'micro') return false;
        return selectedMesoId ? l.details?.parentPlaceId === selectedMesoId : true;
      }
      if (mapZoomLevel === 'building') {
        if (lvl !== 'building') return false;
        return selectedMicroId ? l.details?.parentPlaceId === selectedMicroId : true;
      }
      return false;
    });
  }, [lore, mapZoomLevel, selectedMacroId, selectedMesoId, selectedMicroId]);

  // Determine if Fog of War should be active
  const isFogActive = useMemo(() => {
    if (mapZoomLevel === 'building') return false;
    const totalPlaces = activePlaces.length;
    if (totalPlaces === 0) return false;
    const lockedPlaces = activePlaces.filter(p => p.isUnlocked === false).length;
    return lockedPlaces > 0;
  }, [activePlaces, mapZoomLevel]);

  // Dynamic Camera Viewbox Calculation
  const viewBox = useMemo(() => {
    if (activePlaces.length === 0) {
      return `0 0 ${mapWidth} ${mapHeight}`;
    }

    const visibleNodesForCamera = isFogActive 
      ? activePlaces.filter(p => p.isUnlocked) 
      : activePlaces;

    const targets = visibleNodesForCamera.length > 0 ? visibleNodesForCamera : activePlaces;

    let minX = mapWidth, maxX = 0, minY = mapHeight, maxY = 0;
    targets.forEach(n => {
      const x = n.details?.coordinates?.x ?? (mapWidth / 2);
      const y = n.details?.coordinates?.y ?? (mapHeight / 2);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const padding = 16;
    const rawW = (maxX - minX) + padding * 2;
    const rawH = (maxY - minY) + padding * 2;

    const size = Math.max(32, Math.min(Math.max(mapWidth, mapHeight), Math.max(rawW, rawH)));

    let left = cx - size / 2;
    let top = cy - size / 2;

    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left + size > mapWidth) left = mapWidth - size;
    if (top + size > mapHeight) top = mapHeight - size;

    return `${left.toFixed(2)} ${top.toFixed(2)} ${size.toFixed(2)} ${size.toFixed(2)}`;
  }, [activePlaces, isFogActive, mapWidth, mapHeight]);

  // Helper to generate a rugged polygon path for natural-looking shorelines
  const generateRuggedPoints = (cx: number, cy: number, r: number, placeSeed: string): string => {
    const points: Array<{ x: number; y: number }> = [];
    const steps = 120;
    const localRnd = createPRNG(placeSeed);
    const coastlineStyle = mapConfig.coastlineStyle || 'rugged';

    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;

      let noise = 0;
      if (coastlineStyle === 'smooth' || coastlineStyle === 'beach') {
        // "Sanft & Rund"
        noise += 0.05 * Math.sin(angle * 3 + localRnd(1) * 3);
        noise += 0.02 * Math.cos(angle * 6);
      } else if (coastlineStyle === 'fjord') {
        // "Fjordküste" - very deep rugged cut-ins
        noise += 0.22 * Math.sin(angle * 4 + localRnd(1) * 6);
        noise += 0.12 * Math.cos(angle * 9 - localRnd(2) * 8);
        if (Math.sin(angle * 6 + localRnd(3) * 5) > 0.45) {
          noise -= 0.32 * Math.abs(Math.sin(angle * 5));
        }
      } else if (coastlineStyle === 'lagoon') {
        // "Lagunen & Riffe"
        noise += 0.12 * Math.sin(angle * 5);
        noise += 0.05 * Math.cos(angle * 12);
        if (Math.cos(angle * 8) > 0.6) {
          noise += 0.15 * Math.sin(angle * 2);
        }
      } else {
        // "Zerklüftet" or "Klippenküste" (default)
        noise += 0.16 * Math.sin(angle * 3 + localRnd(1) * 8);
        noise += 0.08 * Math.cos(angle * 7 - localRnd(2) * 8);
        noise += 0.04 * Math.sin(angle * 13 + localRnd(3) * 8);
        noise += 0.015 * Math.cos(angle * 27);
      }

      const finalR = r * (1 + noise);
      const px = cx + finalR * Math.cos(angle);
      const py = cy + finalR * Math.sin(angle);

      points.push({
        x: Math.max(3, Math.min(mapWidth - 3, px)),
        y: Math.max(3, Math.min(mapHeight - 3, py))
      });
    }

    let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
    for (let i = 0; i < points.length; i++) {
      const nextIdx = (i + 1) % points.length;
      const p1 = points[i];
      const p2 = points[nextIdx];
      const xc = (p1.x + p2.x) / 2;
      const yc = (p1.y + p2.y) / 2;
      d += ` Q ${p1.x.toFixed(2)},${p1.y.toFixed(2)} ${xc.toFixed(2)},${yc.toFixed(2)}`;
    }
    d += ' Z';
    return d;
  };

  // 2. Procedural Landmass Generator incorporating "1. KONTINENT-SCHABLONEN" from image
  const stencilLandmasses = useMemo(() => {
    // In One Piece mode, disable procedural stencil continents to preserve the accurate ocean and Calm Belt layout
    const stencil = isOnePieceWorld ? 'none' : (mapConfig.continentStencil || 'none');

    // If stencil is 'none' or procedural islands are disabled, do not draw automatic landmass blobs
    if (stencil === 'none' || mapConfig.showProceduralIslands === false) {
      return [];
    }

    if (stencil === 'complete') {
      // "Komplettkontinent" - one giant center continent
      return [
        {
          id: 'complete-main',
          cx: mapWidth / 2,
          cy: mapHeight / 2,
          radius: Math.min(mapWidth, mapHeight) * 0.35,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(mapWidth / 2, mapHeight / 2, Math.min(mapWidth, mapHeight) * 0.35, 'complete-main-seed')
        }
      ];
    } else if (stencil === 'divided') {
      // "Geteilt" - split into two big landmasses left & right
      return [
        {
          id: 'divided-left',
          cx: mapWidth * 0.28,
          cy: mapHeight / 2,
          radius: Math.min(mapWidth, mapHeight) * 0.22,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(mapWidth * 0.28, mapHeight / 2, Math.min(mapWidth, mapHeight) * 0.22, 'divided-left-seed')
        },
        {
          id: 'divided-right',
          cx: mapWidth * 0.72,
          cy: mapHeight / 2,
          radius: Math.min(mapWidth, mapHeight) * 0.20,
          color: '#ca8a04',
          gradientId: 'desert-grad',
          biome: 'Desert',
          pointsStr: generateRuggedPoints(mapWidth * 0.72, mapHeight / 2, Math.min(mapWidth, mapHeight) * 0.20, 'divided-right-seed')
        }
      ];
    } else if (stencil === 'peninsula') {
      // "Halbinsel" - connects deeply to a corner
      return [
        {
          id: 'peninsula-main',
          cx: mapWidth * 0.10,
          cy: mapHeight / 2,
          radius: Math.min(mapWidth, mapHeight) * 0.40,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(mapWidth * 0.10, mapHeight / 2, Math.min(mapWidth, mapHeight) * 0.40, 'peninsula-seed')
        },
        {
          id: 'peninsula-island',
          cx: mapWidth * 0.75,
          cy: mapHeight * 0.45,
          radius: Math.min(mapWidth, mapHeight) * 0.12,
          color: '#0284c7',
          gradientId: 'arctic-grad',
          biome: 'Arctic',
          pointsStr: generateRuggedPoints(mapWidth * 0.75, mapHeight * 0.45, Math.min(mapWidth, mapHeight) * 0.12, 'peninsula-island-seed')
        }
      ];
    } else if (stencil === 'ring' || stencil === 'central_sea') {
      // "Ringkontinent" or "Zentrale See" - circular ring of islands
      const ringIslands = [];
      const count = 7;
      const baseRadius = Math.min(mapWidth, mapHeight);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        const rx = mapWidth / 2 + baseRadius * 0.26 * Math.cos(angle);
        const ry = mapHeight / 2 + baseRadius * 0.26 * Math.sin(angle);
        ringIslands.push({
          id: `ring-island-${i}`,
          cx: Math.round(rx),
          cy: Math.round(ry),
          radius: baseRadius * 0.11,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(Math.round(rx), Math.round(ry), baseRadius * 0.11, `ring-island-seed-${i}`)
        });
      }
      return ringIslands;
    } else if (stencil === 'island_group' || stencil === 'archipelago') {
      // "Inselgruppe" / "Archipel" - scattered islands
      const baseRadius = Math.min(mapWidth, mapHeight);
      return [
        {
          id: 'island-1',
          cx: mapWidth * 0.30,
          cy: mapHeight * 0.30,
          radius: baseRadius * 0.14,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(mapWidth * 0.30, mapHeight * 0.30, baseRadius * 0.14, 'isl-1')
        },
        {
          id: 'island-2',
          cx: mapWidth * 0.68,
          cy: mapHeight * 0.35,
          radius: baseRadius * 0.12,
          color: '#d97706',
          gradientId: 'desert-grad',
          biome: 'Desert',
          pointsStr: generateRuggedPoints(mapWidth * 0.68, mapHeight * 0.35, baseRadius * 0.12, 'isl-2')
        },
        {
          id: 'island-3',
          cx: mapWidth * 0.48,
          cy: mapHeight * 0.72,
          radius: baseRadius * 0.15,
          color: '#3f5e31',
          gradientId: 'swamp-grad',
          biome: 'Swamp',
          pointsStr: generateRuggedPoints(mapWidth * 0.48, mapHeight * 0.72, baseRadius * 0.15, 'isl-3')
        },
        {
          id: 'island-4',
          cx: mapWidth * 0.82,
          cy: mapHeight * 0.74,
          radius: baseRadius * 0.08,
          color: '#0284c7',
          gradientId: 'arctic-grad',
          biome: 'Arctic',
          pointsStr: generateRuggedPoints(mapWidth * 0.82, mapHeight * 0.74, baseRadius * 0.08, 'isl-4')
        }
      ];
    } else if (stencil === 'bsp_1_large_continent_peninsulas' || stencil === 'bsp_1' || stencil === 'bsp1') {
      // "Beispiel 1: Großer Kontinent + Halbinseln" - Center supercontinent with 4 protruding peninsulas & fringing islands
      const baseR = Math.min(mapWidth, mapHeight);
      return [
        {
          id: 'bsp1-center-main',
          cx: mapWidth * 0.48,
          cy: mapHeight * 0.50,
          radius: baseR * 0.28,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(mapWidth * 0.48, mapHeight * 0.50, baseR * 0.28, 'bsp1-center-seed')
        },
        {
          id: 'bsp1-nw-peninsula',
          cx: mapWidth * 0.28,
          cy: mapHeight * 0.28,
          radius: baseR * 0.16,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(mapWidth * 0.28, mapHeight * 0.28, baseR * 0.16, 'bsp1-nw-seed')
        },
        {
          id: 'bsp1-se-peninsula',
          cx: mapWidth * 0.68,
          cy: mapHeight * 0.68,
          radius: baseR * 0.17,
          color: '#d97706',
          gradientId: 'desert-grad',
          biome: 'Desert',
          pointsStr: generateRuggedPoints(mapWidth * 0.68, mapHeight * 0.68, baseR * 0.17, 'bsp1-se-seed')
        },
        {
          id: 'bsp1-ne-peninsula',
          cx: mapWidth * 0.70,
          cy: mapHeight * 0.32,
          radius: baseR * 0.13,
          color: '#3f5e31',
          gradientId: 'swamp-grad',
          biome: 'Swamp',
          pointsStr: generateRuggedPoints(mapWidth * 0.70, mapHeight * 0.32, baseR * 0.13, 'bsp1-ne-seed')
        },
        {
          id: 'bsp1-sw-island',
          cx: mapWidth * 0.22,
          cy: mapHeight * 0.75,
          radius: baseR * 0.10,
          color: '#0284c7',
          gradientId: 'arctic-grad',
          biome: 'Arctic',
          pointsStr: generateRuggedPoints(mapWidth * 0.22, mapHeight * 0.75, baseR * 0.10, 'bsp1-sw-seed')
        }
      ];
    } else if (stencil === 'bsp_2_archipelago_world' || stencil === 'bsp_2' || stencil === 'bsp2') {
      // "Beispiel 2: Archipelwelt" - 4 distinct island clusters scattered across the map
      const baseR = Math.min(mapWidth, mapHeight);
      return [
        { id: 'bsp2-1', cx: mapWidth * 0.25, cy: mapWidth * 0.25, radius: baseR * 0.12, color: '#65a30d', gradientId: 'grass-grad', biome: 'Grassland', pointsStr: generateRuggedPoints(mapWidth * 0.25, mapWidth * 0.25, baseR * 0.12, 'bsp2-1') },
        { id: 'bsp2-2', cx: mapWidth * 0.45, cy: mapWidth * 0.30, radius: baseR * 0.10, color: '#65a30d', gradientId: 'grass-grad', biome: 'Grassland', pointsStr: generateRuggedPoints(mapWidth * 0.45, mapWidth * 0.30, baseR * 0.10, 'bsp2-2') },
        { id: 'bsp2-3', cx: mapWidth * 0.75, cy: mapWidth * 0.28, radius: baseR * 0.13, color: '#d97706', gradientId: 'desert-grad', biome: 'Desert', pointsStr: generateRuggedPoints(mapWidth * 0.75, mapWidth * 0.28, baseR * 0.13, 'bsp2-3') },
        { id: 'bsp2-4', cx: mapWidth * 0.32, cy: mapWidth * 0.65, radius: baseR * 0.14, color: '#3f5e31', gradientId: 'swamp-grad', biome: 'Swamp', pointsStr: generateRuggedPoints(mapWidth * 0.32, mapWidth * 0.65, baseR * 0.14, 'bsp2-4') },
        { id: 'bsp2-5', cx: mapWidth * 0.65, cy: mapWidth * 0.68, radius: baseR * 0.11, color: '#0284c7', gradientId: 'arctic-grad', biome: 'Arctic', pointsStr: generateRuggedPoints(mapWidth * 0.65, mapWidth * 0.68, baseR * 0.11, 'bsp2-5') },
        { id: 'bsp2-6', cx: mapWidth * 0.85, cy: mapWidth * 0.72, radius: baseR * 0.08, color: '#65a30d', gradientId: 'grass-grad', biome: 'Grassland', pointsStr: generateRuggedPoints(mapWidth * 0.85, mapWidth * 0.72, baseR * 0.08, 'bsp2-6') },
        { id: 'bsp2-7', cx: mapWidth * 0.50, cy: mapWidth * 0.50, radius: baseR * 0.09, color: '#b91c1c', gradientId: 'desert-grad', biome: 'Volcano', pointsStr: generateRuggedPoints(mapWidth * 0.50, mapWidth * 0.50, baseR * 0.09, 'bsp2-7') },
      ];
    } else if (stencil === 'bsp_3_two_continents' || stencil === 'bsp_3' || stencil === 'bsp3') {
      // "Beispiel 3: Zwei Kontinente" - West & East Continents separated by a central rift strait with an island bridge
      const baseR = Math.min(mapWidth, mapHeight);
      return [
        {
          id: 'bsp3-west',
          cx: mapWidth * 0.28,
          cy: mapHeight * 0.48,
          radius: baseR * 0.24,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(mapWidth * 0.28, mapHeight * 0.48, baseR * 0.24, 'bsp3-west-seed')
        },
        {
          id: 'bsp3-east',
          cx: mapWidth * 0.72,
          cy: mapHeight * 0.52,
          radius: baseR * 0.23,
          color: '#d97706',
          gradientId: 'desert-grad',
          biome: 'Desert',
          pointsStr: generateRuggedPoints(mapWidth * 0.72, mapHeight * 0.52, baseR * 0.23, 'bsp3-east-seed')
        },
        {
          id: 'bsp3-bridge-island',
          cx: mapWidth * 0.50,
          cy: mapHeight * 0.50,
          radius: baseR * 0.08,
          color: '#3f5e31',
          gradientId: 'swamp-grad',
          biome: 'Swamp',
          pointsStr: generateRuggedPoints(mapWidth * 0.50, mapHeight * 0.50, baseR * 0.08, 'bsp3-bridge-seed')
        }
      ];
    } else if (stencil === 'bsp_4_ring_inland_sea' || stencil === 'bsp_4' || stencil === 'bsp4') {
      // "Beispiel 4: Ringkontinent mit Binnenmeer" - Ring of 8 landmasses enclosing central sea + middle sanctuary island
      const ringIslands = [];
      const count = 8;
      const baseR = Math.min(mapWidth, mapHeight);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * 2 * Math.PI;
        const rx = mapWidth / 2 + baseR * 0.27 * Math.cos(angle);
        const ry = mapHeight / 2 + baseR * 0.27 * Math.sin(angle);
        ringIslands.push({
          id: `bsp4-ring-${i}`,
          cx: Math.round(rx),
          cy: Math.round(ry),
          radius: baseR * 0.12,
          color: i % 2 === 0 ? '#65a30d' : '#3f5e31',
          gradientId: i % 2 === 0 ? 'grass-grad' : 'swamp-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(Math.round(rx), Math.round(ry), baseR * 0.12, `bsp4-ring-seed-${i}`)
        });
      }
      // Central Sanctuary Island
      ringIslands.push({
        id: 'bsp4-center-sanctuary',
        cx: mapWidth / 2,
        cy: mapHeight / 2,
        radius: baseR * 0.08,
        color: '#ca8a04',
        gradientId: 'desert-grad',
        biome: 'Sanctuary',
        pointsStr: generateRuggedPoints(mapWidth / 2, mapHeight / 2, baseR * 0.08, 'bsp4-sanctuary-seed')
      });
      return ringIslands;
    } else if (stencil === 'bsp_5_rugged_island_land' || stencil === 'bsp_5' || stencil === 'bsp5') {
      // "Beispiel 5: Zerklüftetes Land mit Inseln" - Fjord-carved mainland + barrier islands shield
      const baseR = Math.min(mapWidth, mapHeight);
      return [
        {
          id: 'bsp5-main-fjord',
          cx: mapWidth * 0.45,
          cy: mapHeight * 0.45,
          radius: baseR * 0.28,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(mapWidth * 0.45, mapHeight * 0.45, baseR * 0.28, 'bsp5-main-seed')
        },
        { id: 'bsp5-island-1', cx: mapWidth * 0.18, cy: mapHeight * 0.25, radius: baseR * 0.09, color: '#0284c7', gradientId: 'arctic-grad', biome: 'Arctic', pointsStr: generateRuggedPoints(mapWidth * 0.18, mapHeight * 0.25, baseR * 0.09, 'bsp5-1') },
        { id: 'bsp5-island-2', cx: mapWidth * 0.78, cy: mapHeight * 0.35, radius: baseR * 0.10, color: '#d97706', gradientId: 'desert-grad', biome: 'Desert', pointsStr: generateRuggedPoints(mapWidth * 0.78, mapHeight * 0.35, baseR * 0.10, 'bsp5-2') },
        { id: 'bsp5-island-3', cx: mapWidth * 0.25, cy: mapHeight * 0.72, radius: baseR * 0.11, color: '#3f5e31', gradientId: 'swamp-grad', biome: 'Swamp', pointsStr: generateRuggedPoints(mapWidth * 0.25, mapHeight * 0.72, baseR * 0.11, 'bsp5-3') },
        { id: 'bsp5-island-4', cx: mapWidth * 0.72, cy: mapHeight * 0.75, radius: baseR * 0.08, color: '#65a30d', gradientId: 'grass-grad', biome: 'Grassland', pointsStr: generateRuggedPoints(mapWidth * 0.72, mapHeight * 0.75, baseR * 0.08, 'bsp5-4') }
      ];
    } else if (stencil === 'bsp_6_continent_arc_archipelago' || stencil === 'bsp_6' || stencil === 'bsp6') {
      // "Beispiel 6: Kontinentbogen & Archipel" - Sweeping arc continent + curving island chain
      const baseR = Math.min(mapWidth, mapHeight);
      return [
        { id: 'bsp6-arc-1', cx: mapWidth * 0.25, cy: mapHeight * 0.28, radius: baseR * 0.16, color: '#65a30d', gradientId: 'grass-grad', biome: 'Grassland', pointsStr: generateRuggedPoints(mapWidth * 0.25, mapHeight * 0.28, baseR * 0.16, 'bsp6-arc1') },
        { id: 'bsp6-arc-2', cx: mapWidth * 0.42, cy: mapHeight * 0.45, radius: baseR * 0.18, color: '#65a30d', gradientId: 'grass-grad', biome: 'Grassland', pointsStr: generateRuggedPoints(mapWidth * 0.42, mapHeight * 0.45, baseR * 0.18, 'bsp6-arc2') },
        { id: 'bsp6-arc-3', cx: mapWidth * 0.62, cy: mapHeight * 0.62, radius: baseR * 0.17, color: '#d97706', gradientId: 'desert-grad', biome: 'Desert', pointsStr: generateRuggedPoints(mapWidth * 0.62, mapHeight * 0.62, baseR * 0.17, 'bsp6-arc3') },
        // Parallel Archipelago Chain
        { id: 'bsp6-chain-1', cx: mapWidth * 0.55, cy: mapHeight * 0.22, radius: baseR * 0.09, color: '#3f5e31', gradientId: 'swamp-grad', biome: 'Swamp', pointsStr: generateRuggedPoints(mapWidth * 0.55, mapHeight * 0.22, baseR * 0.09, 'bsp6-ch1') },
        { id: 'bsp6-chain-2', cx: mapWidth * 0.72, cy: mapHeight * 0.32, radius: baseR * 0.10, color: '#0284c7', gradientId: 'arctic-grad', biome: 'Arctic', pointsStr: generateRuggedPoints(mapWidth * 0.72, mapHeight * 0.32, baseR * 0.10, 'bsp6-ch2') },
        { id: 'bsp6-chain-3', cx: mapWidth * 0.82, cy: mapHeight * 0.48, radius: baseR * 0.08, color: '#65a30d', gradientId: 'grass-grad', biome: 'Grassland', pointsStr: generateRuggedPoints(mapWidth * 0.82, mapHeight * 0.48, baseR * 0.08, 'bsp6-ch3') }
      ];
    } else if (stencil === 'rugged') {
      // "Zerklüftet"
      const baseRadius = Math.min(mapWidth, mapHeight);
      return [
        {
          id: 'rugged-main',
          cx: mapWidth * 0.48,
          cy: mapHeight * 0.48,
          radius: baseRadius * 0.25,
          color: '#65a30d',
          gradientId: 'grass-grad',
          biome: 'Grassland',
          pointsStr: generateRuggedPoints(mapWidth * 0.48, mapHeight * 0.48, baseRadius * 0.25, 'rugged-main-seed')
        },
        {
          id: 'rugged-sub1',
          cx: mapWidth * 0.20,
          cy: mapHeight * 0.25,
          radius: baseRadius * 0.10,
          color: '#d97706',
          gradientId: 'desert-grad',
          biome: 'Desert',
          pointsStr: generateRuggedPoints(mapWidth * 0.20, mapHeight * 0.25, baseRadius * 0.10, 'rugged-sub1-seed')
        }
      ];
    }

    return [];
  }, [mapWidth, mapHeight, mapConfig.continentStencil, mapConfig.showProceduralIslands]);

  const customLandmasses = useMemo(() => {
    const fromBorders = (isOnePieceWorld || suppressTerritoryLandmasses || !world?.borders || !Array.isArray(world.borders)) ? [] : world.borders
      .filter((b: any) => {
        // Exclude ocean, belt, and structural water/barrier zones from being treated as landmasses
        if (b.isOcean || b.isWater) return false;
        
        // Exclude all system-generated automatic wireframe borders (influence zones) from rendering as filled geographical landmasses
        if (b.id?.startsWith('auto-')) return false;
        
        const bName = b.name || '';
        if (/ozean|meer|gürtel|blue|line|belt|grand|paradise|welt|calm/i.test(bName)) {
          return false;
        }

        return b.isLandmass || b.isClosed || (b.points && b.points.length >= 3);
      })
      .map((b: any, idx: number) => {
        const pts = b.points || [];
        if (pts.length < 3) return null;
        const ptsPath = generateLandmassPathD(pts);
        const color = b.color || '#65a30d';
        const bId = b.id || '';
        const bName = b.name || '';

        // Assign gradient IDs dynamically based on island names, IDs, or colors
        let gradId = 'grass-grad';
        let biome = 'grasland';

        if (bId === 'op-canon-punkhazard' || bName.toLowerCase().includes('punk hazard')) {
          gradId = 'punk-hazard-grad';
          biome = 'vulkan eis schnee';
        } else if (
          bId === 'op-canon-wholecake' || 
          bId?.startsWith('op-canon-totto-') ||
          bName.toLowerCase().includes('whole cake') ||
          bName.toLowerCase().includes('sweet city') ||
          ['candy', 'biscuits', 'nuts', 'jam', 'cheese', 'milk', 'cacao', 'margarine', 'liqueur', 'jelly', 'fruits', 'komugi', 'yakyogashi', 'rokumitsu', 'sanshoku', 'funwari', 'kimi', 'kinko', 'milenge'].some(sw => bName.toLowerCase().includes(sw))
        ) {
          gradId = 'sweet-candy-grad';
          biome = 'grasland dschungel';
        } else if (bId === 'op-canon-drum' || bId === 'op-canon-flevance' || bId === 'op-canon-minion' || color === '#cbd5e1' || color === '#f1f5f9' || color === '#f8fafc') {
          gradId = 'arctic-grad';
          biome = 'schnee eis';
        } else if (color === '#ca8a04' || color === '#d97706' || color === '#eab308') {
          gradId = 'desert-grad';
          biome = 'wüste';
        } else if (color === '#3f5e31' || color === '#047857' || color === '#15803d' || color === '#16a34a' || color === '#22c55e') {
          gradId = 'grass-grad';
          biome = 'wald dschungel';
        } else if (color === '#94a3b8' || color === '#64748b' || color === '#475569') {
          gradId = 'volcano-grad';
          biome = 'vulkan';
        }

        return {
          id: bId || `custom-landmass-${idx}`,
          cx: b.cx || pts[0].x,
          cy: b.cy || pts[0].y,
          radius: b.radius || 15,
          color: color,
          gradientId: gradId,
          biome: biome,
          title: bName || bId,
          pointsStr: ptsPath
        };
      })
      .filter(Boolean);

    const fromTerritories = (suppressTerritoryLandmasses || !world?.territories || !Array.isArray(world.territories)) ? [] : world.territories
      .filter((t: any) => {
        if (t.type === 'meer' || t.type === 'welt' || t.type === 'region' || t.type === 'zone') return false;
        if (t.id?.startsWith('op-redline-') || t.id?.startsWith('op-calmbelt-') || t.id?.startsWith('op-grandline-') || t.id?.startsWith('op-northblue') || t.id?.startsWith('op-eastblue') || t.id?.startsWith('op-westblue') || t.id?.startsWith('op-southblue')) return false;
        if (t.type !== 'insel' && t.type !== 'kontinent') return false;
        return true;
      })
      .map((t: any, idx: number) => {
        const radius = t.radius || 20;
        let organicPoints = t.points;
        if (!organicPoints || organicPoints.length < 3) {
           organicPoints = generateOrganicShape(t.type, undefined, t.name);
        }

        const absolutePts = organicPoints.map((p: any) => ({
          x: t.x + p.x * radius,
          y: t.y + p.y * radius
        }));
        
        const ptsPath = generateLandmassPathD(absolutePts);
        const color = t.color || '#65a30d';
        const tId = t.id || '';
        const tName = t.name || '';

        let gradId = 'grass-grad';
        let biome = 'grasland';

        if (tId === 'op-canon-punkhazard' || tName.toLowerCase().includes('punk hazard')) {
          gradId = 'punk-hazard-grad';
          biome = 'vulkan eis schnee';
        } else if (
          tId === 'op-canon-wholecake' || 
          tId?.startsWith('op-canon-totto-') ||
          tName.toLowerCase().includes('whole cake') ||
          tName.toLowerCase().includes('sweet city') ||
          ['candy', 'biscuits', 'nuts', 'jam', 'cheese', 'milk', 'cacao', 'margarine', 'liqueur', 'jelly', 'fruits', 'komugi', 'yakyogashi', 'rokumitsu', 'sanshoku', 'funwari', 'kimi', 'kinko', 'milenge'].some(sw => tName.toLowerCase().includes(sw))
        ) {
          gradId = 'sweet-candy-grad';
          biome = 'grasland dschungel';
        } else if (tId === 'op-canon-drum' || tId === 'op-canon-flevance' || tId === 'op-canon-minion' || color === '#cbd5e1' || color === '#f1f5f9' || color === '#f8fafc') {
          gradId = 'arctic-grad';
          biome = 'schnee eis';
        } else if (color === '#ca8a04' || color === '#d97706' || color === '#eab308') {
          gradId = 'desert-grad';
          biome = 'wüste';
        } else if (color === '#3f5e31' || color === '#047857' || color === '#15803d' || color === '#16a34a' || color === '#22c55e') {
          gradId = 'grass-grad';
          biome = 'wald dschungel';
        } else if (color === '#94a3b8' || color === '#64748b' || color === '#475569') {
          gradId = 'volcano-grad';
          biome = 'vulkan';
        }

        return {
          id: tId || `custom-territory-${idx}`,
          cx: t.x,
          cy: t.y,
          radius: radius,
          color: color,
          gradientId: gradId,
          biome: biome,
          title: tName || tId,
          pointsStr: ptsPath
        };
      })
      .filter(Boolean);

    return [...fromBorders, ...fromTerritories];
  }, [world?.borders, world?.territories, world?.regionMarkers]);

  const landmasses = useMemo(() => {
    return [...stencilLandmasses, ...customLandmasses];
  }, [stencilLandmasses, customLandmasses]);

  // 3. Dynamic Terrains (Mountains, Forests, Rivers, Lakes, etc.)
  const proceduralElements = useMemo(() => {
    const mountainsList: Array<{ x: number; y: number; h: number; w: number; isVolcano?: boolean }> = [];
    const forestsList: Array<{ x: number; y: number; size: number }> = [];
    const riversList: Array<{ d: string }> = [];
    const dunesList: Array<{ x: number; y: number; w: number }> = [];

    // Prioritize actual generated world terrains
    if (world?.terrains && world.terrains.length > 0) {
      world.terrains.forEach((t: any, idx: number) => {
        const tx = t.x ?? 50;
        const ty = t.y ?? 50;
        const type = t.type;
        const localRnd = createPRNG(`${t.name}-${idx}`);

        if (type === 'Gebirge' || type === 'Hügel') {
          mountainsList.push({ x: tx, y: ty, h: 4.5 + localRnd(1) * 2.5, w: 7 + localRnd(2) * 3 });
          mountainsList.push({ x: tx - 3.5, y: ty + 0.8, h: 3.2, w: 5 });
          mountainsList.push({ x: tx + 3.5, y: ty + 0.5, h: 3.5, w: 5.5 });
        } else if (type === 'Vulkan') {
          mountainsList.push({ x: tx, y: ty, h: 6, w: 9, isVolcano: true });
        } else if (type === 'Wald') {
          forestsList.push({ x: tx, y: ty, size: 4 });
          for (let k = 0; k < 4; k++) {
            forestsList.push({ x: tx + (localRnd(k * 5) - 0.5) * 6, y: ty + (localRnd(k * 7) - 0.5) * 6, size: 2.2 });
          }
        } else if (type === 'Fluss') {
          riversList.push({
            d: `M ${tx},${ty} Q ${tx + (localRnd(1) - 0.5) * 12},${ty + 5} ${tx + (localRnd(2) - 0.5) * 20},${ty + 15}`
          });
        } else if (type === 'Wüste') {
          for (let k = 0; k < 3; k++) {
            dunesList.push({ x: tx + (localRnd(k * 3) - 0.5) * 8, y: ty + (localRnd(k * 5) - 0.5) * 6, w: 4 + localRnd(k) * 3 });
          }
        }
      });
    } else {
      // Fallback procedural placement
      landmasses.forEach((lm, idx) => {
        const localRnd = createPRNG(`${lm.title}-${idx}`);
        
        if (lm.radius < 10) return;

        // Seeding Mountains
        if (!lm.biome.includes('sumpf') && !lm.biome.includes('insel')) {
          const numPeaks = lm.biome.includes('gebirge') || lm.biome.includes('berg') ? 4 : 2;
          for (let p = 0; p < numPeaks; p++) {
            const mx = lm.cx + (localRnd(p * 2) - 0.5) * (lm.radius * 0.6);
            const my = lm.cy + (localRnd(p * 3) - 0.5) * (lm.radius * 0.6);
            mountainsList.push({
              x: mx,
              y: my,
              h: 3.8 + localRnd(p * 4) * 2.5,
              w: 6.5 + localRnd(p * 5) * 3,
              isVolcano: lm.biome.includes('vulkan')
            });
          }
        }

        // Seeding Forests
        if (!lm.biome.includes('wüste') && !lm.biome.includes('eis')) {
          const numGroves = lm.biome.includes('wald') || lm.biome.includes('dschungel') ? 6 : 3;
          for (let f = 0; f < numGroves; f++) {
            const fx = lm.cx + (localRnd(f * 4) - 0.5) * (lm.radius * 0.7);
            const fy = lm.cy + (localRnd(f * 6) - 0.5) * (lm.radius * 0.7);
            forestsList.push({
              x: fx,
              y: fy,
              size: 2.2 + localRnd(f) * 1.5
            });
          }
        }

        // Seeding Dunes
        if (lm.biome.includes('wüste') || lm.biome.includes('sand')) {
          for (let d = 0; d < 5; d++) {
            const dx = lm.cx + (localRnd(d * 2) - 0.5) * (lm.radius * 0.7);
            const dy = lm.cy + (localRnd(d * 3) - 0.5) * (lm.radius * 0.7);
            dunesList.push({
              x: dx,
              y: dy,
              w: 3.5 + localRnd(d) * 3
            });
          }
        }
      });
    }

    return {
      mountains: mountainsList,
      forests: forestsList,
      rivers: riversList,
      dunes: dunesList
    };
  }, [landmasses, world]);

  // Building floor plan renderer
  if (mapZoomLevel === 'building') {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden select-none bg-[#1e140d] border border-amber-900/60 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: 'linear-gradient(to right, #451a03 1px, transparent 1px), linear-gradient(to bottom, #451a03 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />

        <div className="relative w-full h-full border border-amber-950/80 bg-[#170e09] rounded-2xl p-4 overflow-hidden flex flex-col justify-between z-10 shadow-inner">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(to bottom, transparent 95%, #000000 95%)',
            backgroundSize: '100% 24px'
          }} />

          <div className="flex items-center justify-between border-b border-amber-950 pb-2 mb-2">
            <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest flex items-center gap-1">
              🛠️ Innenraum-Bauplan
            </span>
            <span className="text-xs font-serif text-slate-300 font-black tracking-wide">{worldTitle} - Erdgeschoss</span>
          </div>

          <div className="flex-1 w-full relative min-h-[140px]">
            <svg className="w-full h-full" viewBox="0 0 100 60">
              <rect x="2" y="2" width="96" height="56" fill="none" stroke="#2e1f15" strokeWidth="2.5" />
              <rect x="2" y="2" width="96" height="56" fill="none" stroke="#4a3728" strokeWidth="1.2" strokeDasharray="3,1" />

              <path d="M 12,10 L 45,10 L 45,22" fill="none" stroke="#7c2d12" strokeWidth="3" strokeLinecap="square" />
              <text x="24" y="16" fill="#ca8a04" fontSize="2.5" fontFamily="monospace" opacity="0.75" fontWeight="bold">TRESEN</text>

              <circle cx="16" cy="14" r="1.5" fill="#451a03" stroke="#9a3412" strokeWidth="0.4" />
              <circle cx="23" cy="14" r="1.5" fill="#451a03" stroke="#9a3412" strokeWidth="0.4" />
              <circle cx="30" cy="14" r="1.5" fill="#451a03" stroke="#9a3412" strokeWidth="0.4" />
              <circle cx="37" cy="14" r="1.5" fill="#451a03" stroke="#9a3412" strokeWidth="0.4" />
              <circle cx="41" cy="18" r="1.5" fill="#451a03" stroke="#9a3412" strokeWidth="0.4" />

              <g transform="translate(85, 30)">
                <radialGradient id="fire-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </radialGradient>
                <circle r="14" fill="url(#fire-glow)" className="animate-pulse" />
                <path d="M 6,-10 A 10,10 0 0,0 6,10" fill="none" stroke="#451a03" strokeWidth="2.5" />
                <path d="M 2,-4 L 0,0 L 2,4" fill="none" stroke="#f97316" strokeWidth="1" className="animate-bounce" />
                <text x="-6" y="2" fill="#ea580c" fontSize="2.2" fontWeight="bold" textAnchor="middle">KAMIN</text>
              </g>

              <g transform="translate(25, 42)">
                <circle r="4.5" fill="#7c2d12" stroke="#451a03" strokeWidth="0.5" />
                <circle cx="-6.2" cy="0" r="1.2" fill="#451a03" />
                <circle cx="6.2" cy="0" r="1.2" fill="#451a03" />
                <circle cx="0" cy="-6.2" r="1.2" fill="#451a03" />
                <circle cx="0" cy="6.2" r="1.2" fill="#451a03" />
                <text x="0" y="1" fill="#ea580c" fontSize="1.8" textAnchor="middle" opacity="0.6">TISCH</text>
              </g>

              <g transform="translate(56, 42)">
                <circle r="4.5" fill="#7c2d12" stroke="#451a03" strokeWidth="0.5" />
                <circle cx="-6.2" cy="0" r="1.2" fill="#451a03" />
                <circle cx="6.2" cy="0" r="1.2" fill="#451a03" />
                <circle cx="0" cy="-6.2" r="1.2" fill="#451a03" />
                <circle cx="0" cy="6.2" r="1.2" fill="#451a03" />
                <text x="0" y="1" fill="#ea580c" fontSize="1.8" textAnchor="middle" opacity="0.6">TISCH</text>
              </g>

              <g transform="translate(62, 16)">
                <rect x="-5" y="-5" width="10" height="10" rx="1" fill="#7c2d12" stroke="#451a03" strokeWidth="0.5" />
                <circle cx="-7.5" cy="0" r="1.2" fill="#451a03" />
                <circle cx="7.5" cy="0" r="1.2" fill="#451a03" />
                <text x="0" y="1.5" fill="#ea580c" fontSize="1.8" textAnchor="middle" opacity="0.6">NISCHE</text>
              </g>

              <g transform="translate(48, 58)">
                <line x1="-5" y1="0" x2="5" y2="0" stroke="#f97316" strokeWidth="1.8" />
                <text x="0" y="-3.5" fill="#eab308" fontSize="2.2" textAnchor="middle" fontWeight="bold">EINGANG</text>
              </g>
            </svg>
          </div>

          <div className="text-[9px] text-amber-600/70 border-t border-amber-950/40 pt-1.5 flex justify-between items-center select-none font-mono">
            <span>* Gebäude-Innenraum *</span>
            <span>1 Feld = ca. 1.5m</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <svg 
      id="nautical-map-background" 
      className="pointer-events-none select-none" 
      width={mapWidth}
      height={mapHeight}
      viewBox={`0 0 ${mapWidth} ${mapHeight}`}
    >
      <defs>
          <style>{`
            @keyframes reverseMountainSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .whirlpool-spin {
              transform-origin: center;
              animation: reverseMountainSpin 15s linear infinite;
            }
          `}</style>
          <filter id="fantasyPaperGrain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#f9f5eb" surfaceScale="1.4" result="light">
              <feDistantLight azimuth="50" elevation="60" />
            </feDiffuseLighting>
            <feBlend mode="multiply" in="SourceGraphic" in2="light" />
          </filter>

          <filter id="fog-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>

          {/* Style-based radial gradient for Water */}
          <radialGradient id="deep-sea-glow" cx="50%" cy="50%" r="70%">
            {mapStyle === 'watercolor' ? (
              <>
                <stop offset="0%" stopColor="#f0f9ff" />
                <stop offset="50%" stopColor="#cae8f5" />
                <stop offset="100%" stopColor="#bae6fd" />
              </>
            ) : mapStyle === 'realistic' ? (
              <>
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="60%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </>
            ) : mapStyle === 'handdrawn' ? (
              <>
                <stop offset="0%" stopColor="#FAF7EE" />
                <stop offset="100%" stopColor="#eedec9" />
              </>
            ) : mapStyle === 'parchment' ? (
              <>
                <stop offset="0%" stopColor="#fcf0d3" />
                <stop offset="60%" stopColor="#eedfb3" />
                <stop offset="100%" stopColor="#dfcca2" />
              </>
            ) : mapStyle === 'minimalist' ? (
              <>
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="50%" stopColor="#0f2b5c" />
                <stop offset="100%" stopColor="#07152b" />
              </>
            )}
          </radialGradient>

          {/* Biome Gradients with styling values */}
          <linearGradient id="punk-hazard-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" /> {/* Fire Red */}
            <stop offset="47%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#e2e8f0" /> {/* Icy Divide */}
            <stop offset="53%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#f8fafc" /> {/* Ice White */}
          </linearGradient>

          <linearGradient id="sweet-candy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" /> {/* Sweet Pink */}
            <stop offset="60%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>

          <linearGradient id="grass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.grassGrad.stop1} />
            <stop offset="60%" stopColor={theme.grassGrad.stop2} />
            <stop offset="100%" stopColor={theme.grassGrad.stop3} />
          </linearGradient>

          <linearGradient id="desert-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.desertGrad.stop1} />
            <stop offset="40%" stopColor={theme.desertGrad.stop2} />
            <stop offset="100%" stopColor={theme.desertGrad.stop3} />
          </linearGradient>

          <linearGradient id="arctic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.arcticGrad.stop1} />
            <stop offset="70%" stopColor={theme.arcticGrad.stop2} />
            <stop offset="100%" stopColor={theme.arcticGrad.stop3} />
          </linearGradient>

          <linearGradient id="swamp-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.swampGrad.stop1} />
            <stop offset="75%" stopColor={theme.swampGrad.stop2} />
            <stop offset="100%" stopColor={theme.swampGrad.stop3} />
          </linearGradient>

          <linearGradient id="volcano-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.volcanoGrad.stop1} />
            <stop offset="50%" stopColor={theme.volcanoGrad.stop2} />
            <stop offset="100%" stopColor={theme.volcanoGrad.stop3} />
          </linearGradient>

          {/* Red Line Mountain Wall Gradient */}
          <linearGradient id="red-line-rock-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#450a0a" />
            <stop offset="20%" stopColor="#881337" />
            <stop offset="50%" stopColor="#be123c" />
            <stop offset="80%" stopColor="#881337" />
            <stop offset="100%" stopColor="#450a0a" />
          </linearGradient>

          {/* Calm Belt Glassy Sea Gradient */}
          <linearGradient id="calm-belt-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.45" />
          </linearGradient>

          {/* Grand Line Paradise Water */}
          <linearGradient id="paradise-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.4" />
          </linearGradient>

          {/* Grand Line New World Water */}
          <linearGradient id="new-world-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#312e81" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#1e1b4b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#312e81" stopOpacity="0.5" />
          </linearGradient>

          {/* Quadrant Ocean Tones */}
          <linearGradient id="north-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="east-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="west-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369a1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="south-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.12" />
          </linearGradient>

          {isFogActive && (
            <mask id="fog-mask">
              <rect width="100" height="100" fill="black" />
              {activePlaces.map((p) => {
                if (!p.isUnlocked) return null;
                const px = p.details?.coordinates?.x ?? 50;
                const py = p.details?.coordinates?.y ?? 50;
                return (
                  <circle 
                    key={`reveal-${p.id}`} 
                    cx={px} 
                    cy={py} 
                    r="34" 
                    fill="white" 
                    filter="url(#fog-blur)" 
                  />
                );
              })}
            </mask>
          )}
        </defs>

        {/* --- WATER BASE LAYER --- */}
        <rect width="100%" height="100%" fill={isOnePieceWorld ? "url(#deep-sea-glow)" : "#000000"} />

        {isOnePieceWorld && (
          <>
            {/* --- REGIONAL OCEAN SECTORS & TILES --- */}
            <g id="game-ocean-tiles">
              {/* North Blue (NW) */}
              <rect x="0" y="0" width={mapWidth * 0.485} height={mapHeight * 0.38} fill="url(#north-blue-grad)" />
              {/* East Blue (NE) */}
              <rect x={mapWidth * 0.515} y="0" width={mapWidth * 0.455} height={mapHeight * 0.38} fill="url(#east-blue-grad)" />
              {/* West Blue (SW) */}
              <rect x="0" y={mapHeight * 0.62} width={mapWidth * 0.485} height={mapHeight * 0.38} fill="url(#west-blue-grad)" />
              {/* South Blue (SE) */}
              <rect x={mapWidth * 0.515} y={mapHeight * 0.62} width={mapWidth * 0.455} height={mapHeight * 0.38} fill="url(#south-blue-grad)" />

              {/* Calm Belt Nord-West */}
              <rect x="0" y={mapHeight * 0.38} width={mapWidth * 0.485} height={mapHeight * 0.04} fill="url(#calm-belt-grad)" />
              {/* Calm Belt Nord-Ost */}
              <rect x={mapWidth * 0.515} y={mapHeight * 0.38} width={mapWidth * 0.455} height={mapHeight * 0.04} fill="url(#calm-belt-grad)" />

              {/* Calm Belt Süd-West */}
              <rect x="0" y={mapHeight * 0.58} width={mapWidth * 0.485} height={mapHeight * 0.04} fill="url(#calm-belt-grad)" />
              {/* Calm Belt Süd-Ost */}
              <rect x={mapWidth * 0.515} y={mapHeight * 0.58} width={mapWidth * 0.455} height={mapHeight * 0.04} fill="url(#calm-belt-grad)" />

              {/* Calm Belt Dotted Boundary Lines */}
              <line x1="0" y1={mapHeight * 0.38} x2={mapWidth * 0.485} y2={mapHeight * 0.38} stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1.5,1.5" opacity="0.6" />
              <line x1={mapWidth * 0.515} y1={mapHeight * 0.38} x2={mapWidth * 0.97} y2={mapHeight * 0.38} stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1.5,1.5" opacity="0.6" />
              
              <line x1="0" y1={mapHeight * 0.42} x2={mapWidth * 0.485} y2={mapHeight * 0.42} stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1.5,1.5" opacity="0.6" />
              <line x1={mapWidth * 0.515} y1={mapHeight * 0.42} x2={mapWidth * 0.97} y2={mapHeight * 0.42} stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1.5,1.5" opacity="0.6" />

              <line x1="0" y1={mapHeight * 0.58} x2={mapWidth * 0.485} y2={mapHeight * 0.58} stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1.5,1.5" opacity="0.6" />
              <line x1={mapWidth * 0.515} y1={mapHeight * 0.58} x2={mapWidth * 0.97} y2={mapHeight * 0.58} stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1.5,1.5" opacity="0.6" />

              <line x1="0" y1={mapHeight * 0.62} x2={mapWidth * 0.485} y2={mapHeight * 0.62} stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1.5,1.5" opacity="0.6" />
              <line x1={mapWidth * 0.515} y1={mapHeight * 0.62} x2={mapWidth * 0.97} y2={mapHeight * 0.62} stroke="#22d3ee" strokeWidth="0.2" strokeDasharray="1.5,1.5" opacity="0.6" />

              {/* Grand Line Paradise */}
              <rect x={mapWidth * 0.515} y={mapHeight * 0.42} width={mapWidth * 0.455} height={mapHeight * 0.16} fill="url(#paradise-grad)" />
              {/* Grand Line Neue Welt */}
              <rect x="0" y={mapHeight * 0.42} width={mapWidth * 0.485} height={mapHeight * 0.16} fill="url(#new-world-grad)" />
            </g>

            {/* --- RED LINE CONTINENT WALL --- */}
            <g id="red-line-continents">
              {/* Central Red Line Organic Landmass Path */}
              {(() => {
                const mW = mapWidth;
                const mH = mapHeight;

                const centralPath = `
                  M ${mW * 0.485},0
                  C ${mW * 0.47},${mH * 0.04} ${mW * 0.465},${mH * 0.08} ${mW * 0.48},${mH * 0.14}
                  C ${mW * 0.49},${mH * 0.18} ${mW * 0.47},${mH * 0.23} ${mW * 0.48},${mH * 0.29}
                  C ${mW * 0.485},${mH * 0.34} ${mW * 0.475},${mH * 0.39} ${mW * 0.48},${mH * 0.43}
                  C ${mW * 0.485},${mH * 0.47} ${mW * 0.475},${mH * 0.50} ${mW * 0.48},${mH * 0.53}
                  C ${mW * 0.485},${mH * 0.57} ${mW * 0.47},${mH * 0.61} ${mW * 0.48},${mH * 0.66}
                  C ${mW * 0.485},${mH * 0.71} ${mW * 0.465},${mH * 0.77} ${mW * 0.48},${mH * 0.84}
                  C ${mW * 0.485},${mH * 0.90} ${mW * 0.47},${mH * 0.96} ${mW * 0.485},${mH}
                  L ${mW * 0.515},${mH}
                  C ${mW * 0.53},${mH * 0.95} ${mW * 0.515},${mH * 0.89} ${mW * 0.52},${mH * 0.82}
                  C ${mW * 0.53},${mH * 0.76} ${mW * 0.515},${mH * 0.69} ${mW * 0.52},${mH * 0.63}
                  C ${mW * 0.525},${mH * 0.57} ${mW * 0.525},${mH * 0.50} ${mW * 0.52},${mH * 0.43}
                  C ${mW * 0.515},${mH * 0.38} ${mW * 0.525},${mH * 0.32} ${mW * 0.515},${mH * 0.26}
                  C ${mW * 0.51},${mH * 0.20} ${mW * 0.525},${mH * 0.14} ${mW * 0.515},${mH * 0.08}
                  C ${mW * 0.51},${mH * 0.04} ${mW * 0.52},0 ${mW * 0.515},0
                  Z
                `;

                const eastPath = `
                  M ${mW * 0.97},0
                  C ${mW * 0.96},${mH * 0.08} ${mW * 0.98},${mH * 0.16} ${mW * 0.965},${mH * 0.24}
                  C ${mW * 0.955},${mH * 0.32} ${mW * 0.985},${mH * 0.40} ${mW * 0.965},${mH * 0.48}
                  C ${mW * 0.955},${mH * 0.56} ${mW * 0.985},${mH * 0.64} ${mW * 0.965},${mH * 0.72}
                  C ${mW * 0.955},${mH * 0.80} ${mW * 0.985},${mH * 0.88} ${mW * 0.965},${mH * 0.96}
                  C ${mW * 0.955},${mH * 0.98} ${mW * 0.975},${mH} ${mW * 0.97},${mH}
                  L ${mW},${mH}
                  L ${mW},0
                  Z
                `;

                return (
                  <g id="red-line-polygons">
                    <path d={centralPath} fill="none" stroke="#22d3ee" strokeWidth="2.8" opacity="0.3" />
                    <path d={centralPath} fill="none" stroke="#e0f2fe" strokeWidth="1.2" opacity="0.5" />
                    <path d={eastPath} fill="none" stroke="#22d3ee" strokeWidth="2.8" opacity="0.3" />
                    <path d={eastPath} fill="none" stroke="#e0f2fe" strokeWidth="1.2" opacity="0.5" />

                    <path d={centralPath} fill="url(#red-line-rock-grad)" stroke="#450a0a" strokeWidth="0.5" />
                    <path d={eastPath} fill="url(#red-line-rock-grad)" stroke="#450a0a" strokeWidth="0.5" />

                    <path d={centralPath} fill="none" stroke="#7f1d1d" strokeWidth="0.4" strokeDasharray="2,0.8" />
                    <path d={eastPath} fill="none" stroke="#7f1d1d" strokeWidth="0.4" strokeDasharray="2,0.8" />
                  </g>
                );
              })()}

              {/* Realistic 3D Mountain Peak Clusters along Central Red Line */}
              <g id="red-line-center-mountain-ranges">
                {Array.from({ length: 54 }).map((_, i) => {
                  const py = (i / 54) * mapHeight + 1.2;
                  const t = py / mapHeight;
                  const curveX = Math.sin(t * Math.PI * 4) * (mapWidth * 0.012);
                  const px = mapWidth * 0.50 + curveX + (((i * 13) % 5) - 2) * 0.2;
                  const w = 2.6 + ((i * 7) % 5) * 0.3;
                  const h = 2.2 + ((i * 11) % 4) * 0.3;

                  if (py > mapHeight * 0.46 && py < mapHeight * 0.54) {
                    return null;
                  }

                  const peakX = px;
                  const peakY = py - h;
                  const baseLeftX = px - w / 2;
                  const baseRightX = px + w / 2;
                  const baseCenterY = py;
                  const ridgeCenterX = px - w * 0.04;
                  const ridgeCenterY = py - h * 0.38;

                  return (
                    <g key={`redline-center-3d-peak-${i}`} className="redline-3d-peak">
                      <ellipse cx={px} cy={py + h * 0.08} rx={w * 0.55} ry={h * 0.18} fill="#000000" opacity="0.3" />
                      <polygon points={`${baseLeftX},${baseCenterY} ${ridgeCenterX},${ridgeCenterY} ${peakX},${peakY} ${px - w * 0.1},${baseCenterY}`} fill="#be123c" stroke="#450a0a" strokeWidth="0.12" />
                      <polygon points={`${baseLeftX + w * 0.12},${baseCenterY} ${ridgeCenterX},${ridgeCenterY} ${peakX},${peakY}`} fill="#fb7185" opacity="0.4" />
                      <polygon points={`${peakX},${peakY} ${ridgeCenterX},${ridgeCenterY} ${px - w * 0.1},${baseCenterY} ${baseRightX},${baseCenterY}`} fill="#881337" stroke="#450a0a" strokeWidth="0.12" />
                      <polygon points={`${peakX},${peakY} ${ridgeCenterX},${ridgeCenterY} ${baseRightX - w * 0.15},${baseCenterY} ${baseRightX},${baseCenterY}`} fill="#450a0a" opacity="0.5" />
                      <path d={`M ${peakX},${peakY} Q ${ridgeCenterX},${ridgeCenterY} ${px - w * 0.05},${baseCenterY}`} fill="none" stroke="#450a0a" strokeWidth="0.28" />
                      <path d={`M ${ridgeCenterX},${ridgeCenterY} Q ${px - w * 0.2},${py - h * 0.22} ${baseLeftX + w * 0.08},${baseCenterY}`} fill="none" stroke="#450a0a" strokeWidth="0.15" opacity="0.7" />
                      <path d={`M ${ridgeCenterX},${ridgeCenterY} Q ${px + w * 0.12},${py - h * 0.20} ${baseRightX - w * 0.08},${baseCenterY}`} fill="none" stroke="#450a0a" strokeWidth="0.15" opacity="0.7" />
                      {h > 4.0 && (
                        <polygon points={`${peakX},${peakY} ${peakX - w * 0.12},${peakY + h * 0.32} ${peakX},${peakY + h * 0.25} ${peakX + w * 0.12},${peakY + h * 0.32}`} fill="#fecdd3" opacity="0.85" stroke="#881337" strokeWidth="0.1" />
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Realistic 3D Mountain Peak Clusters along East Red Line */}
              <g id="red-line-east-mountain-ranges">
                {Array.from({ length: 36 }).map((_, i) => {
                  const py = (i / 36) * mapHeight + 1.2;
                  const t = py / mapHeight;
                  const curveX = Math.cos(t * Math.PI * 3) * (mapWidth * 0.008);
                  const px = mapWidth * 0.985 + curveX;
                  const w = 2.2 + ((i * 5) % 4) * 0.25;
                  const h = 1.8 + ((i * 9) % 3) * 0.25;

                  const peakX = px;
                  const peakY = py - h;
                  const baseLeftX = px - w / 2;
                  const baseRightX = px + w / 2;
                  const baseCenterY = py;

                  return (
                    <g key={`redline-east-3d-peak-${i}`}>
                      <ellipse cx={px} cy={py + h * 0.08} rx={w * 0.5} ry={h * 0.18} fill="#000000" opacity="0.3" />
                      <polygon points={`${baseLeftX},${baseCenterY} ${px - w * 0.05},${py - h * 0.4} ${peakX},${peakY} ${px - w * 0.1},${baseCenterY}`} fill="#991b1b" stroke="#450a0a" strokeWidth="0.12" />
                      <polygon points={`${peakX},${peakY} ${px - w * 0.05},${py - h * 0.4} ${px - w * 0.1},${baseCenterY} ${baseRightX},${baseCenterY}`} fill="#7f1d1d" stroke="#450a0a" strokeWidth="0.12" />
                      <path d={`M ${peakX},${peakY} Q ${px - w * 0.05},${py - h * 0.4} ${px},${baseCenterY}`} fill="none" stroke="#450a0a" strokeWidth="0.25" />
                    </g>
                  );
                })}
              </g>

              {/* Large Stylized "RED LINE" Map Title on Continent */}
              <g textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, serif" fontWeight="900" className="select-none pointer-events-none">
                <text x={mapWidth * 0.50} y={mapHeight * 0.22} fontSize={(4.8 * textScale) / zScale} fill="#881337" stroke="#450a0a" strokeWidth={(0.3 * textScale) / zScale} letterSpacing="0.2em" opacity="0.85" paintOrder="stroke fill">RED</text>
                <text x={mapWidth * 0.50} y={mapHeight * 0.27} fontSize={(4.8 * textScale) / zScale} fill="#881337" stroke="#450a0a" strokeWidth={(0.3 * textScale) / zScale} letterSpacing="0.2em" opacity="0.85" paintOrder="stroke fill">LINE</text>
                <text x={mapWidth * 0.50} y={mapHeight * 0.72} fontSize={(4.8 * textScale) / zScale} fill="#881337" stroke="#450a0a" strokeWidth={(0.3 * textScale) / zScale} letterSpacing="0.2em" opacity="0.85" paintOrder="stroke fill">RED</text>
                <text x={mapWidth * 0.50} y={mapHeight * 0.77} fontSize={(4.8 * textScale) / zScale} fill="#881337" stroke="#450a0a" strokeWidth={(0.3 * textScale) / zScale} letterSpacing="0.2em" opacity="0.85" paintOrder="stroke fill">LINE</text>
              </g>

              {/* Reverse Mountain Summit & 4 Ocean River Canals */}
              <g id="reverse-mountain-system">
                {(() => {
                  const mW = mapWidth;
                  const mH = mapHeight;

                  const nwCoast = { x: mW * 0.47, y: mH * 0.32 };
                  const neCoast = { x: mW * 0.53, y: mH * 0.32 };
                  const swCoast = { x: mW * 0.47, y: mH * 0.68 };
                  const seCoast = { x: mW * 0.53, y: mH * 0.68 };
                  const summit = { x: mW * 0.50, y: mH * 0.50 };
                  const glExit = { x: mW * 0.55, y: mH * 0.50 };

                  const pathNW = `M ${nwCoast.x},${nwCoast.y} Q ${mW * 0.485},${mH * 0.39} ${summit.x},${summit.y}`;
                  const pathNE = `M ${neCoast.x},${neCoast.y} Q ${mW * 0.515},${mH * 0.39} ${summit.x},${summit.y}`;
                  const pathSW = `M ${swCoast.x},${swCoast.y} Q ${mW * 0.485},${mH * 0.61} ${summit.x},${summit.y}`;
                  const pathSE = `M ${seCoast.x},${seCoast.y} Q ${mW * 0.515},${mH * 0.61} ${summit.x},${summit.y}`;
                  const pathGL = `M ${summit.x},${summit.y} L ${glExit.x},${glExit.y}`;

                  return (
                      <g id="carved-canals">
                        {/* 1. Deep Rock Carving Outlines (Canyons) */}
                        <g fill="none" stroke="#2a050d" strokeWidth="5.0" strokeLinecap="round" strokeLinejoin="round" opacity="0.95">
                          <path d={pathNW} />
                          <path d={pathNE} />
                          <path d={pathSW} />
                          <path d={pathSE} />
                          <path d={pathGL} />
                        </g>
                        {/* 2. Canyon Inner Shading Walls */}
                        <g fill="none" stroke="#4a0815" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d={pathNW} />
                          <path d={pathNE} />
                          <path d={pathSW} />
                          <path d={pathSE} />
                          <path d={pathGL} />
                        </g>
                        {/* 3. Deep Water Beds */}
                        <g fill="none" stroke="#013b5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d={pathNW} />
                          <path d={pathNE} />
                          <path d={pathSW} />
                          <path d={pathSE} />
                          <path d={pathGL} stroke="#024d7a" strokeWidth="3.0" />
                        </g>
                        {/* 4. Rushing Core Torrents */}
                        <g fill="none" stroke="#0ea5e9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d={pathNW} />
                          <path d={pathNE} />
                          <path d={pathSW} />
                          <path d={pathSE} />
                          <path d={pathGL} stroke="#0ea5e9" strokeWidth="1.8" />
                        </g>
                        {/* 5. Shimmer and Foam Highlight Paths */}
                        <g fill="none" stroke="#e0f2fe" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
                          <path d={pathNW} strokeDasharray="2,2" />
                          <path d={pathNE} strokeDasharray="2,2" />
                          <path d={pathSW} strokeDasharray="2,2" />
                          <path d={pathSE} strokeDasharray="2,2" />
                          <path d={pathGL} stroke="#fef08a" strokeWidth="0.8" strokeDasharray="3,2" />
                        </g>

                        {[
                          { c: nwCoast, label: "North Blue Fluss-Eingang" },
                          { c: neCoast, label: "East Blue Fluss-Eingang" },
                          { c: swCoast, label: "West Blue Fluss-Eingang" },
                          { c: seCoast, label: "South Blue Fluss-Eingang" },
                        ].map((item, i) => (
                          <g key={`ocean-canal-entry-${i}`} transform={`translate(${item.c.x}, ${item.c.y})`}>
                            <circle r="1.4" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.3" />
                            <circle r="0.7" fill="#38bdf8" />
                            <circle r="0.3" fill="#ffffff" />
                            <text x={i % 2 === 0 ? (-2.0 * textScale) / zScale : (2.0 * textScale) / zScale} y={(0.3 * textScale) / zScale} fontSize={(1.4 * textScale) / zScale} fontFamily="sans-serif" fontWeight="bold" fill="#38bdf8" textAnchor={i % 2 === 0 ? "end" : "start"}>
                              {item.label}
                            </text>
                          </g>
                        ))}
                        <g fill="#e0f2fe" fontSize={1.6 / zScale} fontWeight="bold" textAnchor="middle" className="select-none">
                          <text x={mW * 0.485} y={mH * 0.44} transform={`rotate(25, ${mW * 0.485}, ${mH * 0.44})`}>▲</text>
                          <text x={mW * 0.515} y={mH * 0.44} transform={`rotate(-25, ${mW * 0.515}, ${mH * 0.44})`}>▲</text>
                          <text x={mW * 0.485} y={mH * 0.56} transform={`rotate(155, ${mW * 0.485}, ${mH * 0.56})`}>▲</text>
                          <text x={mW * 0.515} y={mH * 0.56} transform={`rotate(-155, ${mW * 0.515}, ${mH * 0.56})`}>▲</text>
                          <text x={mW * 0.53} y={mH * 0.495} fill="#fef08a">►</text>
                        </g>
                      </g>
                  );
                })()}

                {/* Reverse Mountain Central Whirlpool Summit Basin */}
                <g transform={`translate(${mapWidth * 0.50}, ${mapHeight * 0.50})`}>
                  <ellipse rx="3.0" ry="2.5" fill="#7f1d1d" stroke="#fbbf24" strokeWidth="0.35" />
                  <g className="whirlpool-spin">
                    <circle r="2.0" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="1.2,0.8" />
                    <circle r="1.2" fill="#0ea5e9" stroke="#e0f2fe" strokeWidth="0.2" strokeDasharray="0.6,0.3" />
                    <path d="M -1.5,0 A 1.5,1.5 0 0,1 1.5,0" fill="none" stroke="#ffffff" strokeWidth="0.3" opacity="0.6" />
                  </g>
                  <circle r="0.5" fill="#38bdf8" />
                  <circle r="0.2" fill="#ffffff" />

                  <g transform="translate(0, -3.8)" textAnchor="middle" className="select-none">
                    <rect x="-10" y={(-1.6 * textScale) / zScale} width={20 * textScale} height={(3.2 * textScale) / zScale} rx="0.8" fill="#450a0a" stroke="#fbbf24" strokeWidth="0.2" opacity="0.9" />
                    <text x="0" y={(-0.3 * textScale) / zScale} fontSize={(2.0 * textScale) / zScale} fontFamily="Georgia, serif" fontWeight="bold" fill="#fef08a">
                      REVERSE MOUNTAIN
                    </text>
                    <text x="0" y={(1.0 * textScale) / zScale} fontSize={(1.3 * textScale) / zScale} fontFamily="sans-serif" fontWeight="bold" fill="#38bdf8">
                      ▲ EINGANG ZUR GRAND LINE ▲
                    </text>
                  </g>
                </g>

                {/* Kap Twin LANDMARKE */}
                <g transform={`translate(${mapWidth * 0.55}, ${mapHeight * 0.50})`}>
                  <polygon points="0,-1.5 1.5,0 0,1.5 -1.5,0" fill="#0f172a" stroke="#fbbf24" strokeWidth="0.25" />
                  <path d="M -0.4,-1.8 Q 1.0,-1.8 1.2,-0.6 L 0.4,0 Z" fill="#7f1d1d" stroke="#450a0a" strokeWidth="0.15" />
                  <path d="M -0.4,1.8 Q 1.0,1.8 1.2,0.6 L 0.4,0 Z" fill="#7f1d1d" stroke="#450a0a" strokeWidth="0.15" />
                  <g transform="translate(0, -0.6)">
                    <polygon points="0,0 5,-2.5 5,2.5" fill="#fef08a" opacity="0.45" />
                    <rect x="-0.5" y="0" width="1.0" height="1.8" fill="#f8fafc" stroke="#334155" strokeWidth="0.12" />
                    <polygon points="-0.6,0 0.6,0 0,-0.7" fill="#dc2626" />
                    <circle cx="0" cy="-0.2" r="0.3" fill="#fef08a" />
                  </g>
                  <g transform="translate(1.8, 0)" textAnchor="start" className="select-none">
                    <rect x="0" y={(-1.6 * textScale) / zScale} width={16 * textScale} height={(3.2 * textScale) / zScale} rx="0.5" fill="#0f172a" stroke="#fbbf24" strokeWidth="0.25" opacity="0.95" />
                    <text x="0.6" y={(-0.5 * textScale) / zScale} fontSize={(1.2 * textScale) / zScale} fontFamily="sans-serif" fontWeight="bold" fill="#fbbf24" letterSpacing="0.05em">
                      ★ LANDMARKE
                    </text>
                    <text x="0.6" y={(0.3 * textScale) / zScale} fontSize={(1.5 * textScale) / zScale} fontFamily="Georgia, serif" fontWeight="bold" fill="#ffffff">
                      Kap Twin (Twins Cape)
                    </text>
                    <text x="0.6" y={(1.1 * textScale) / zScale} fontSize={(1.2 * textScale) / zScale} fontFamily="sans-serif" fontWeight="bold" fill="#38bdf8">
                      Ausgang zur Grand Line (Paradise)
                    </text>
                  </g>
                </g>
              </g>

              {/* Mariejoa Citadel */}
              <g transform={`translate(${mapWidth * 0.985}, ${mapHeight * 0.50})`}>
                <polygon points="0,-2.2 -1.8,1.4 1.8,1.4" fill="#fbbf24" stroke="#78350f" strokeWidth="0.2" />
                <circle cx="0" cy="-2.5" r="0.5" fill="#fef08a" />
              </g>
            </g>

            {/* FANTASY GAME MAP TYPOGRAPHY */}
            <g textAnchor="middle" dominantBaseline="middle" fontFamily="Georgia, serif" fontWeight="900" className="select-none pointer-events-none">
              <text x={mapWidth * 0.24} y={mapHeight * 0.18} fontSize={(9.5 * textScale) / Math.sqrt(zScale)} fill="#e0f2fe" stroke="#0284c7" strokeWidth={(0.8 * textScale) / Math.sqrt(zScale)} letterSpacing="0.35em" opacity="0.8" paintOrder="stroke fill">NORTH BLUE</text>
              <text x={mapWidth * 0.745} y={mapHeight * 0.18} fontSize={(9.5 * textScale) / Math.sqrt(zScale)} fill="#e0f2fe" stroke="#0284c7" strokeWidth={(0.8 * textScale) / Math.sqrt(zScale)} letterSpacing="0.35em" opacity="0.8" paintOrder="stroke fill">EAST BLUE</text>
              <text x={mapWidth * 0.24} y={mapHeight * 0.82} fontSize={(9.5 * textScale) / Math.sqrt(zScale)} fill="#e0f2fe" stroke="#0284c7" strokeWidth={(0.8 * textScale) / Math.sqrt(zScale)} letterSpacing="0.35em" opacity="0.8" paintOrder="stroke fill">WEST BLUE</text>
              <text x={mapWidth * 0.745} y={mapHeight * 0.82} fontSize={(9.5 * textScale) / Math.sqrt(zScale)} fill="#e0f2fe" stroke="#0284c7" strokeWidth={(0.8 * textScale) / Math.sqrt(zScale)} letterSpacing="0.35em" opacity="0.8" paintOrder="stroke fill">SOUTH BLUE</text>
              <text x={mapWidth * 0.745} y={mapHeight * 0.50} fontSize={(8.5 * textScale) / Math.sqrt(zScale)} fill="#fef08a" stroke="#78350f" strokeWidth={(0.7 * textScale) / Math.sqrt(zScale)} letterSpacing="0.22em" opacity="0.9" paintOrder="stroke fill">PARADISE • GRAND LINE I</text>
              <text x={mapWidth * 0.24} y={mapHeight * 0.50} fontSize={(8.5 * textScale) / Math.sqrt(zScale)} fill="#fef08a" stroke="#78350f" strokeWidth={(0.7 * textScale) / Math.sqrt(zScale)} letterSpacing="0.22em" opacity="0.9" paintOrder="stroke fill">NEUE WELT • GRAND LINE II</text>
              <text x={mapWidth * 0.24} y={mapHeight * 0.38} fontSize={(6.0 * textScale) / Math.sqrt(zScale)} fill="#67e8f9" stroke="#0e7490" strokeWidth={(0.5 * textScale) / Math.sqrt(zScale)} letterSpacing="0.22em" opacity="0.9" paintOrder="stroke fill">CALM BELT NORD-WEST</text>
              <text x={mapWidth * 0.745} y={mapHeight * 0.38} fontSize={(6.0 * textScale) / Math.sqrt(zScale)} fill="#67e8f9" stroke="#0e7490" strokeWidth={(0.5 * textScale) / Math.sqrt(zScale)} letterSpacing="0.22em" opacity="0.9" paintOrder="stroke fill">CALM BELT NORD-OST</text>
              <text x={mapWidth * 0.24} y={mapHeight * 0.62} fontSize={(6.0 * textScale) / Math.sqrt(zScale)} fill="#67e8f9" stroke="#0e7490" strokeWidth={(0.5 * textScale) / Math.sqrt(zScale)} letterSpacing="0.22em" opacity="0.9" paintOrder="stroke fill">CALM BELT SÜD-WEST</text>
              <text x={mapWidth * 0.745} y={mapHeight * 0.62} fontSize={(6.0 * textScale) / Math.sqrt(zScale)} fill="#67e8f9" stroke="#0e7490" strokeWidth={(0.5 * textScale) / Math.sqrt(zScale)} letterSpacing="0.22em" opacity="0.9" paintOrder="stroke fill">CALM BELT SÜD-OST</text>
            </g>
          </>
        )}

        {/* --- GEOGRAPHIC GRID (Latitudes and Longitudes) --- */}
        <g stroke={theme.waterGridStroke} strokeWidth="0.08" strokeDasharray="1,2" opacity="0.35">
          {/* Vertical Grid Lines */}
          {Array.from({ length: Math.ceil(mapWidth / 20) + 1 }).map((_, i) => {
            const x = (i + 1) * 20 - 5;
            if (x >= mapWidth) return null;
            return <line key={`v-grid-${i}`} x1={x} y1="0" x2={x} y2={mapHeight} />;
          })}
          {/* Horizontal Grid Lines */}
          {Array.from({ length: Math.ceil(mapHeight / 20) + 1 }).map((_, i) => {
            const y = (i + 1) * 20 - 5;
            if (y >= mapHeight) return null;
            return <line key={`h-grid-${i}`} x1="0" y1={y} x2={mapWidth} y2={y} />;
          })}
        </g>

        {/* Lat/Long Labels */}
        <g fill={theme.textColor} fontSize={1.8 / zScale} fontFamily="monospace" fontWeight="bold" opacity="0.4">
          {Array.from({ length: Math.ceil(mapHeight / 20) + 1 }).map((_, i) => {
            const y = (i + 1) * 20 - 5;
            if (y >= mapHeight) return null;
            const labels = ["30° N", "15° N", "0° EQ", "15° S", "30° S"];
            const label = labels[i % labels.length];
            return <text key={`lat-${i}`} x={1 / zScale} y={y + 1.2 / zScale}>{label}</text>;
          })}

          {Array.from({ length: Math.ceil(mapWidth / 20) + 1 }).map((_, i) => {
            const x = (i + 1) * 20 - 5;
            if (x >= mapWidth) return null;
            const labels = ["45° W", "15° W", "15° E", "45° E", "75° E"];
            const label = labels[i % labels.length];
            return <text key={`lon-${i}`} x={x + 1.2 / zScale} y={mapHeight - 1 / zScale}>{label}</text>;
          })}
        </g>

        {/* --- WINDING COMPASS NAVIGATION LINES (Rhumb Lines) --- */}
        <g stroke={theme.rhumbStroke} strokeWidth="0.04" opacity="0.08">
          {(() => {
            const lines = [];
            const emitters = [
              { x: mapWidth * 0.25, y: mapHeight * 0.25 },
              { x: mapWidth * 0.75, y: mapHeight * 0.75 }
            ];
            emitters.forEach((em, eIdx) => {
              const maxDim = Math.max(mapWidth, mapHeight);
              for (let a = 0; a < 12; a++) {
                const rad = (a / 12) * 2 * Math.PI;
                const x2 = em.x + maxDim * 1.5 * Math.cos(rad);
                const y2 = em.y + maxDim * 1.5 * Math.sin(rad);
                lines.push(<line key={`rhumb-${eIdx}-${a}`} x1={em.x} y1={em.y} x2={x2} y2={y2} />);
              }
            });
            return lines;
          })()}
        </g>

        {/* --- MAIN RENDERING LAYER --- */}
        <g id="mappable-terrain" mask={isFogActive ? 'url(#fog-mask)' : undefined}>
          
          {/* A. Coastline Waves Shading */}
          <g fill="none" strokeLinejoin="round" strokeLinecap="round">
            {landmasses.map((lm, idx) => (
              <g key={`shallows-${lm.id}-${idx}`}>
                <path d={lm.pointsStr} stroke={theme.coastlineColor} strokeWidth="2.0" strokeOpacity="0.75" />
                <path d={lm.pointsStr} stroke={theme.coastlineColor} strokeWidth="4.0" strokeOpacity="0.4" />
                <path d={lm.pointsStr} stroke={theme.coastlineColor} strokeWidth="6.0" strokeOpacity="0.15" strokeDasharray="1,2" />
              </g>
            ))}
          </g>

          {/* B. Coast Beach Outline */}
          <g fill="none" strokeLinejoin="round" strokeLinecap="round">
            {landmasses.map((lm, idx) => (
              <path 
                key={`sandy-beach-${lm.id}-${idx}`} 
                d={lm.pointsStr} 
                fill={theme.beachFill} 
                stroke={theme.coastlineColor} 
                strokeWidth="0.35" 
              />
            ))}
          </g>

          {/* C. The Procedural Land Biomes Fill */}
          <g>
            {landmasses.map((lm, idx) => (
              <path 
                key={`land-biome-${lm.id}-${idx}`} 
                d={lm.pointsStr} 
                fill={`url(#${lm.gradientId})`} 
              />
            ))}
          </g>

          {/* Prominent Cartographic Border Outline around the entire landmass area */}
          <g fill="none" strokeLinejoin="round" strokeLinecap="round">
            {landmasses.map((lm, idx) => (
              <path 
                key={`prominent-land-border-${lm.id}-${idx}`} 
                d={lm.pointsStr} 
                stroke={theme.textColor || '#1e293b'} 
                strokeWidth="1.1" 
                strokeOpacity="0.85"
                strokeDasharray="4,1.5,1.5,1.5" 
              />
            ))}
            {landmasses.map((lm, idx) => (
              <path 
                key={`prominent-land-border-inner-${lm.id}-${idx}`} 
                d={lm.pointsStr} 
                stroke={theme.coastlineColor || '#0f172a'} 
                strokeWidth="0.4" 
                strokeOpacity="0.9"
              />
            ))}
          </g>

          {/* D. Rivers */}
          <g fill="none" stroke={theme.coastlineColor} strokeWidth="0.38" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
            {proceduralElements.rivers.map((riv, idx) => (
              <path key={`river-${idx}`} d={riv.d} />
            ))}
          </g>

          {/* E. Mountain Peaks ("4. GEBIRGS-STILE" from image) */}
          <g id="rendered-peaks">
            {proceduralElements.mountains.map((mtn, idx) => {
              const { x, y, h, w, isVolcano } = mtn;
              const mountainStyle = mapConfig.mountainStyle || 'young';

              if (mountainStyle === 'rounded') {
                // "Alte Abgerundete Berge" - smooth dome-like mounds
                return (
                  <g key={`peak-${idx}`}>
                    <path 
                      d={`M ${x - w / 2},${y} Q ${x},${y - h * 1.2} ${x + w / 2},${y} Z`}
                      fill={theme.mountainFillLit} 
                      stroke={theme.coastlineColor} 
                      strokeWidth="0.15" 
                    />
                    <path 
                      d={`M ${x},${y - h * 1.2} Q ${x + w / 4},${y - h * 0.4} ${x + w / 2},${y}`}
                      fill="none"
                      stroke={theme.mountainFillShadow}
                      strokeWidth="0.15"
                    />
                  </g>
                );
              } else if (mountainStyle === 'plateau') {
                // "Hochplateau / Tafelberge" - flat trapezoids
                const topW = w * 0.4;
                const pathLit = `M ${x - w / 2},${y} L ${x - topW / 2},${y - h} L ${x},${y - h} L ${x},${y} Z`;
                const pathShadow = `M ${x},${y - h} L ${x + topW / 2},${y - h} L ${x + w / 2},${y} L ${x},${y} Z`;
                return (
                  <g key={`peak-${idx}`}>
                    <polygon points={pathLit} fill={theme.mountainFillLit} stroke={theme.coastlineColor} strokeWidth="0.15" />
                    <polygon points={pathShadow} fill={theme.mountainFillShadow} stroke={theme.coastlineColor} strokeWidth="0.15" />
                    <line x1={x} y1={y - h} x2={x} y2={y} stroke={theme.coastlineColor} strokeWidth="0.15" />
                  </g>
                );
              } else {
                // "Junge Faltengebirge" / "Gezackte Gipfel" / "Vulkanisch" (Realistic 3D Hand-Drawn Mountain Structure)
                const peakX = x;
                const peakY = y - h;
                const baseLeftX = x - w / 2;
                const baseRightX = x + w / 2;
                const baseCenterY = y;
                const ridgeCenterX = x - w * 0.05;
                const ridgeCenterY = y - h * 0.4;

                const litFill = isVolcano ? theme.volcanoGrad.stop2 : theme.mountainFillLit;
                const shadowFill = isVolcano ? theme.volcanoGrad.stop3 : theme.mountainFillShadow;

                return (
                  <g key={`peak-${idx}`} className="procedural-3d-peak">
                    {/* Foot Soft Drop Shadow */}
                    <ellipse cx={x} cy={y + h * 0.08} rx={w * 0.52} ry={h * 0.16} fill="#000000" opacity="0.18" />

                    {/* Left Slope (Lit Facet) */}
                    <polygon
                      points={`${baseLeftX},${baseCenterY} ${ridgeCenterX},${ridgeCenterY} ${peakX},${peakY} ${x - w * 0.1},${baseCenterY}`}
                      fill={litFill}
                      stroke={theme.coastlineColor}
                      strokeWidth="0.12"
                    />

                    {/* Right Slope (Shadow Facet) */}
                    <polygon
                      points={`${peakX},${peakY} ${ridgeCenterX},${ridgeCenterY} ${x - w * 0.1},${baseCenterY} ${baseRightX},${baseCenterY}`}
                      fill={shadowFill}
                      stroke={theme.coastlineColor}
                      strokeWidth="0.12"
                    />

                    {/* Main Central Ridgeline */}
                    <path
                      d={`M ${peakX},${peakY} Q ${ridgeCenterX},${ridgeCenterY} ${x - w * 0.05},${baseCenterY}`}
                      fill="none"
                      stroke={theme.coastlineColor}
                      strokeWidth="0.22"
                    />

                    {/* Secondary Erosion Flange Ridgelines */}
                    <path
                      d={`M ${ridgeCenterX},${ridgeCenterY} Q ${x - w * 0.22},${y - h * 0.22} ${baseLeftX + w * 0.08},${baseCenterY}`}
                      fill="none"
                      stroke={theme.coastlineColor}
                      strokeWidth="0.12"
                      opacity="0.6"
                    />
                    <path
                      d={`M ${ridgeCenterX},${ridgeCenterY} Q ${x + w * 0.14},${y - h * 0.20} ${baseRightX - w * 0.08},${baseCenterY}`}
                      fill="none"
                      stroke={theme.coastlineColor}
                      strokeWidth="0.12"
                      opacity="0.6"
                    />

                    {/* Snow Peak Cap for tall non-volcano mountains */}
                    {!isVolcano && h > 4.2 && (
                      <polygon
                        points={`${peakX},${peakY} ${peakX - w * 0.12},${peakY + h * 0.3} ${peakX},${peakY + h * 0.24} ${peakX + w * 0.12},${peakY + h * 0.3}`}
                        fill="#ffffff"
                        opacity="0.9"
                        stroke={theme.coastlineColor}
                        strokeWidth="0.1"
                      />
                    )}

                    {/* Volcano Lava Glowing Cone */}
                    {isVolcano && (
                      <g>
                        <ellipse cx={peakX} cy={peakY + h * 0.15} rx={w * 0.12} ry={h * 0.08} fill="#ef4444" stroke="#f97316" strokeWidth="0.1" />
                        <circle cx={peakX} cy={peakY + h * 0.15} r={w * 0.05} fill="#fef08a" />
                      </g>
                    )}
                  </g>
                );
              }
            })}
          </g>

          {/* F. Forest Trees */}
          <g id="rendered-forests" fill={theme.treeFill} stroke={theme.coastlineColor} strokeWidth="0.15" opacity="0.85">
            {proceduralElements.forests.map((tree, idx) => {
              const { x, y, size } = tree;
              return (
                <g key={`tree-${idx}`} transform={`translate(${x}, ${y})`}>
                  <polygon points={`0,${-size} ${-size / 2.2},0 ${size / 2.2},0`} />
                  <polygon points={`0,${-size * 0.7} ${-size / 2.8},${-size * 0.3} ${size / 2.8},${-size * 0.3}`} fill="#a3e635" fillOpacity="0.25" />
                  <line x1="0" y1="0" x2="0" y2={size * 0.25} stroke="#78350f" strokeWidth="0.25" />
                </g>
              );
            })}
          </g>

          {/* G. Dunes */}
          <g id="rendered-dunes" fill="none" stroke={theme.textColor} strokeWidth="0.22" strokeLinecap="round" opacity="0.5">
            {proceduralElements.dunes.map((dn, idx) => (
              <path key={`dune-${idx}`} d={`M ${dn.x - dn.w / 2},${dn.y} Q ${dn.x},${dn.y - 1} ${dn.x + dn.w / 2},${dn.y}`} />
            ))}
          </g>

          {/* H. Custom Realm & Kingdom Borders */}
          {world?.borders && world.borders.length > 0 && (
            <g id="custom-realm-borders">
              {world.borders
                .filter((border: any) => {
                  if (border.isOcean || border.isWater) return false;
                  if (border.id?.startsWith('auto-')) return false;
                  const bName = border.name || '';
                  if (/ozean|meer|gürtel|blue|line|belt|grand|paradise|welt|calm/i.test(bName)) {
                    return false;
                  }
                  return true;
                })
                .map((border: any, bIdx: number) => {
                  if (!border.points || border.points.length < 3) return null;
                  const pointsStr = border.points.map((p: any) => `${(p.x / 100) * mapWidth},${(p.y / 100) * mapHeight}`).join(' ');
                  const color = border.color || '#38bdf8';
                  const avgX = (border.points.reduce((acc: number, p: any) => acc + p.x, 0) / border.points.length / 100) * mapWidth;
                  const avgY = (border.points.reduce((acc: number, p: any) => acc + p.y, 0) / border.points.length / 100) * mapHeight;

                  return (
                    <g key={`custom-border-${border.id || bIdx}`}>
                      <polygon points={pointsStr} fill={color} fillOpacity="0.15" stroke={color} strokeWidth="0.6" strokeDasharray="1.5,1" />
                      {border.name && (
                        <g transform={`translate(${avgX}, ${avgY})`} textAnchor="middle">
                          {(() => {
                            const nameLength = border.name.length;
                            const fs = (1.5 * textScale) / zScale;
                            const boxWidth = nameLength * fs * 0.52 + 1.6;
                            const boxHeight = fs * 1.35;
                            return (
                              <>
                                <rect
                                  x={-boxWidth / 2}
                                  y={-boxHeight / 2}
                                  width={boxWidth}
                                  height={boxHeight}
                                  rx={0.25 * fs}
                                  fill="#0f172a"
                                  fillOpacity="0.85"
                                  stroke={color}
                                  strokeWidth={0.15 * fs}
                                />
                                <text
                                  y={fs * 0.3}
                                  fill="#ffffff"
                                  fontSize={fs}
                                  fontFamily="Georgia, serif"
                                  fontWeight="bold"
                                >
                                  {border.name}
                                </text>
                              </>
                            );
                          })()}
                        </g>
                      )}
                    </g>
                  );
                })}
            </g>
          )}

          {/* I. Custom Terrains from World Data */}
          {world?.terrains && world.terrains.length > 0 && (
            <g id="custom-world-terrains">
              {world.terrains.map((terrain: any, tIdx: number) => {
                const tx = ((terrain.x ?? 50) / 100) * mapWidth;
                const ty = ((terrain.y ?? 50) / 100) * mapHeight;
                const color = terrain.color || '#f59e0b';
                const terrScale = (1.5 * textScale) / zScale;

                if (terrain.type === 'Gebirge' || terrain.type === 'Mountain') {
                  return (
                    <g key={`custom-mtn-${tIdx}`} transform={`translate(${tx}, ${ty}) scale(${terrScale})`}>
                      <polygon points="0,-3.5 -3,1.5 3,1.5" fill="#64748b" stroke="#1e293b" strokeWidth="0.15" />
                      <polygon points="0,-3.5 -1.2,-0.5 0,0.5 1.2,-0.5" fill="#ffffff" opacity="0.9" />
                      <text y="3.5" fontSize="0.75" fontFamily="sans-serif" fontWeight="bold" fill={theme.textColor} textAnchor="middle" stroke="#000000" strokeWidth="0.12" paintOrder="stroke fill">
                        {terrain.name}
                      </text>
                    </g>
                  );
                }
                if (terrain.type === 'Vulkan' || terrain.type === 'Volcano') {
                  return (
                    <g key={`custom-volcano-${tIdx}`} transform={`translate(${tx}, ${ty}) scale(${terrScale})`}>
                      <polygon points="0,-3 -2.5,1.5 2.5,1.5" fill="#475569" stroke="#0f172a" strokeWidth="0.2" />
                      <circle cx="0" cy="-2.5" r="0.8" fill="#ef4444" />
                      <text y="3.5" fontSize="0.75" fontFamily="sans-serif" fontWeight="bold" fill="#dc2626" textAnchor="middle" stroke="#ffffff" strokeWidth="0.1" paintOrder="stroke fill">
                        {terrain.name}
                      </text>
                    </g>
                  );
                }
                if (terrain.type === 'Wald' || terrain.type === 'Forest') {
                  return (
                    <g key={`custom-forest-${tIdx}`} transform={`translate(${tx}, ${ty}) scale(${terrScale})`}>
                      <circle r="2.2" fill="#16a34a" fillOpacity="0.6" stroke="#14532d" strokeWidth="0.15" />
                      <text y="4.0" fontSize="0.75" fontFamily="sans-serif" fontWeight="bold" fill="#15803d" textAnchor="middle" stroke="#ffffff" strokeWidth="0.1" paintOrder="stroke fill">
                        {terrain.name}
                      </text>
                    </g>
                  );
                }
                if (terrain.type === 'See' || terrain.type === 'Lake' || terrain.type === 'Ozean') {
                  return (
                    <g key={`custom-water-${tIdx}`} transform={`translate(${tx}, ${ty}) scale(${terrScale})`}>
                      <ellipse rx="3.5" ry="2.2" fill="#0284c7" fillOpacity="0.7" stroke="#38bdf8" strokeWidth="0.2" />
                      <text y="3.8" fontSize="0.75" fontFamily="sans-serif" fontWeight="bold" fill="#0369a1" textAnchor="middle" stroke="#ffffff" strokeWidth="0.1" paintOrder="stroke fill">
                        {terrain.name}
                      </text>
                    </g>
                  );
                }
                return (
                  <g key={`custom-terrain-gen-${tIdx}`} transform={`translate(${tx}, ${ty}) scale(${terrScale})`}>
                    <circle r="1.5" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="0.3" />
                    <text y="3.0" fontSize="0.75" fontFamily="sans-serif" fontWeight="bold" fill={theme.textColor} textAnchor="middle" stroke="#000000" strokeWidth="0.1" paintOrder="stroke fill">
                      {terrain.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>

        {/* --- DECORATIONS (10. KARTEN-ELEMENTE DEKORATION) --- */}
        {/* COMPASS ROSE */}
        {(!mapConfig.decorations || mapConfig.decorations.includes('compass')) && (
          <g id="compass-rose" transform={`translate(${mapWidth - 14}, 17)`}>
            <circle r="5.5" fill={theme.waterFill === 'radial-gradient' ? '#1b1e32' : theme.waterFill} fillOpacity="0.8" stroke={theme.textColor} strokeWidth="0.2" />
            <circle r="4.5" fill="none" stroke={theme.textColor} strokeWidth="0.08" strokeDasharray="0.3,0.3" />
            
            <polygon points="0,0 -0.5,-0.3 0,-4.5" fill={theme.textColor} />
            <polygon points="0,0 0.5,-0.3 0,-4.5" fill="#785933" />
            <polygon points="0,0 -0.5,0.3 0,4.5" fill="#785933" />
            <polygon points="0,0 0.5,0.3 0,4.5" fill={theme.textColor} />
            
            <polygon points="0,0 0.3,-0.5 4.5,0" fill={theme.textColor} />
            <polygon points="0,0 0.3,0.5 4.5,0" fill="#785933" />
            <polygon points="0,0 -0.3,-0.5 -4.5,0" fill="#785933" />
            <polygon points="0,0 -0.3,0.5 -4.5,0" fill={theme.textColor} />

            <circle r="0.7" fill="#785933" stroke={theme.textColor} strokeWidth="0.1" />
            <text x="0" y="-5.2" fill={theme.textColor} fontSize="1.4" fontFamily="Georgia, serif" fontWeight="black" textAnchor="middle">N</text>
          </g>
        )}

        {/* SAILING SHIP / SEA SERPENT OVERLAYS */}
        {(!mapConfig.decorations || mapConfig.decorations.includes('scale')) && (
          <g id="galleon-ship" transform={`translate(${mapWidth * 0.18}, ${mapHeight * 0.42})`}>
            <g transform="scale(0.32)">
              <path d="M -4,2 C -2,3 2,3 4,2 L 5.5,0.2 L 5.5,-1 C 4.5,-0.5 2,-0.8 1,-0.8 L -4.5,-0.5 Z" fill="#8c6239" stroke="#3b2314" strokeWidth="0.25" />
              <line x1="-1.8" y1="-0.6" x2="-1.8" y2="-6.2" stroke="#3b2314" strokeWidth="0.3" />
              <line x1="1.2" y1="-0.8" x2="1.2" y2="-7.2" stroke="#3b2314" strokeWidth="0.3" />
              <path d="M -1.8,-5.4 C -0.8,-4.4 -0.6,-2.2 -1.8,-1.2 L -1.8,-5.2" fill="#fcf9ec" stroke="#caa267" strokeWidth="0.15" />
              <path d="M 1.2,-6.5 C 2.8,-5.4 3.0,-2.4 1.2,-1.4 L 1.2,-6.2" fill="#fcf9ec" stroke="#caa267" strokeWidth="0.15" />
              <path d="M -1.8,-6.2 L -3.2,-5.8 L -1.8,-5.4 Z" fill="#b45309" />
            </g>
            <path d="M -1.2,1.1 Q 0,1.4 1.2,1.1" fill="none" stroke={theme.coastlineColor} strokeWidth="0.18" />
          </g>
        )}

        {/* SCALE (Maßstab) */}
        {(!mapConfig.decorations || mapConfig.decorations.includes('scale')) && (
          <g id="map-scale-bar" transform={`translate(${mapWidth - 24}, ${mapHeight - 8})`} fill={theme.textColor} stroke={theme.textColor} strokeWidth="0.15">
            <line x1="0" y1="0" x2="16" y2="0" />
            <line x1="0" y1="-1" x2="0" y2="1" />
            <line x1="8" y1="-0.8" x2="8" y2="0.8" />
            <line x1="16" y1="-1" x2="16" y2="1" />
            <rect x="0" y="-0.4" width="8" height="0.8" fill={theme.textColor} stroke="none" />
            <text x="8" y={-2 / zScale} fontSize={1.8 / zScale} fontFamily="monospace" fontWeight="bold" textAnchor="middle" stroke="none">100 MILES</text>
          </g>
        )}

        {/* WORLD TITLE BANNER (Dekoratives Banner) */}
        {(!mapConfig.decorations || mapConfig.decorations.includes('banner')) && (
          <g id="world-title-banner" transform={`translate(${mapWidth / 2}, 7)`}>
            <path d="M -22,-2 L 22,-2 L 24,1.5 L 22,5 L -22,5 L -24,1.5 Z" fill="#FAF7EE" stroke={theme.textColor} strokeWidth="0.4" />
            <path d="M -22,-2 L -19,1.5 L -22,5" fill="none" stroke={theme.textColor} strokeWidth="0.25" />
            <path d="M 22,-2 L 19,1.5 L 22,5" fill="none" stroke={theme.textColor} strokeWidth="0.25" />
            <text x="0" y={2.5 / Math.sqrt(zScale)} fill={theme.textColor} fontSize={2.8 / Math.sqrt(zScale)} fontFamily="Georgia, serif" fontWeight="black" letterSpacing="1" textAnchor="middle">
              {worldTitle.toUpperCase()}
            </text>
          </g>
        )}

        {/* UNEXPLORED TEXT OVERLAY */}
        {isFogActive && (
          <g opacity="0.3">
            <text 
              x={mapWidth / 2} 
              y={mapHeight - 12 / zScale} 
              fill={theme.textColor} 
              fontSize={3.2 / zScale} 
              fontFamily="Georgia, serif" 
              fontWeight="black" 
              fontStyle="italic" 
              letterSpacing={3 / zScale}
              textAnchor="middle"
            >
              TERRA INCOGNITA
            </text>
            <text 
              x={mapWidth / 2} 
              y={mapHeight - 9 / zScale} 
              fill={theme.textColor} 
              fontSize={1.8 / zScale} 
              fontFamily="monospace" 
              fontWeight="bold" 
              letterSpacing={1 / zScale}
              textAnchor="middle"
            >
              * Unerforschtes Territorium *
            </text>
          </g>
        )}
    </svg>
  );
};
