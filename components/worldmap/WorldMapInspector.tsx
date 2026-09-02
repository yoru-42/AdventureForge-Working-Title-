import React, { useState, useMemo, useEffect } from 'react';
import { Territory } from '../../types';
import { 
  X, 
  Trash2, 
  Move, 
  Maximize, 
  Waves,
  Mountain,
  Palmtree,
  Building2,
  Castle,
  Sparkles,
  AlignLeft,
  ZoomIn,
  Footprints,
  Clock,
  Compass,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronRight,
  Check,
  Percent,
  Scissors,
  Palette,
  Users,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { DRAW_COLOR_PRESETS } from './WorldMapToolbar';
import TerritorySpecificFields from '../TerritorySpecificFields';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

import { 
  calculateTerritoryArea,
  isTerritoryInsideZone,
  scaleTerritoryToArea,
  scaleTerritoryToAreaWithDirection,
  ScaleDirection,
  WORLDMAP_BIOMES,
  WorldMapBiomeDef
} from './worldMapData';

import {
  calculatePolygonGeometricAreaKm2,
  calculateTerritoryHabitableAreaKm2,
  parsePopulationValue
} from './worldMapDrawingEngine';

interface WorldMapInspectorProps {
  selectedTerritory: Territory;
  territories: Territory[];
  onUpdateTerritory: (updated: Territory) => void;
  onDeleteTerritory: (id: string) => void;
  onClose: () => void;
  onFocusTerritory?: (terr: Territory) => void;
  onOpenLocalMap?: (terr: Territory) => void;
  onSelectTerritoryById?: (id: string) => void;
  onOpenShiftModal?: (id: string) => void;
  onOpenSubdivideModal?: (terr: Territory) => void;
  onSyncToCodex?: () => void;
  onSendToChatLog?: (msg: string) => void;
  onAddChildTerritory?: (parentId: string, parentType: Territory['type'], parentX: number, parentY: number) => void;
  onActivateMoveMode?: () => void;
  readOnly?: boolean;
}

export const WorldMapInspector: React.FC<WorldMapInspectorProps> = ({
  selectedTerritory,
  territories,
  onUpdateTerritory,
  onDeleteTerritory,
  onClose,
  onFocusTerritory,
  onOpenLocalMap,
  onSelectTerritoryById,
  onOpenShiftModal,
  onOpenSubdivideModal,
  onActivateMoveMode,
  readOnly = false
}) => {
  const isSea = selectedTerritory.type === 'meer' || selectedTerritory.type === 'ozean' || selectedTerritory.type === 'wasser';
  const isContinent = selectedTerritory.type === 'kontinent';
  const isIsland = selectedTerritory.type === 'insel';

  // Permanent Scale: 1 grid unit (Kachel) = 100m (0.1 km / 100m per Kachel; 1 Kachel² = 0.01 km²)
  const scaleConfig = useMemo(() => {
    return { unitKm: 0.1, unitSqKm: 0.01, label: '100m / Kachel' };
  }, []);

  const rawArea = calculateTerritoryArea(selectedTerritory, territories);
  const exactAreaSqKm = Math.round(rawArea * scaleConfig.unitSqKm * 10) / 10;
  const areaSqKm = Math.round(rawArea * scaleConfig.unitSqKm);
  const formattedArea = exactAreaSqKm >= 1
    ? `${new Intl.NumberFormat('de-DE').format(exactAreaSqKm)} km²`
    : exactAreaSqKm > 0
      ? `${exactAreaSqKm.toString().replace('.', ',')} km²`
      : '< 0,1 km²';

  // Percentage of total world (480x280 canvas)
  const pctOfWorld = rawArea > 0 ? Math.min(100, (rawArea / (480 * 280)) * 100).toFixed(2) : '0';

  // Sensible default km² value if exact area is 0 or uncalculated
  const defaultTypeArea = useMemo(() => {
    if (exactAreaSqKm > 0) return exactAreaSqKm.toString();
    const t = selectedTerritory.type;
    if (t === 'dorf' || t === 'siedlung' || t === 'hafen' || t === 'festung' || t === 'gebaeude') return '1';
    if (t === 'stadt') return '3';
    if (t === 'insel') return '15';
    if (t === 'kontinent' || t === 'koenigreich') return '100';
    return '5';
  }, [exactAreaSqKm, selectedTerritory.type]);

  // Direct km² input state & handler
  const [kmInput, setKmInput] = useState<string>(defaultTypeArea);
  const [isKmEditing, setIsKmEditing] = useState<boolean>(false);
  const [scaleDirection, setScaleDirection] = useState<ScaleDirection>('center');

  useEffect(() => {
    if (!isKmEditing) {
      setKmInput(defaultTypeArea);
    }
  }, [selectedTerritory.id, defaultTypeArea, isKmEditing]);

  const handleApplyKmArea = (targetVal?: number) => {
    const val = targetVal !== undefined ? targetVal : parseFloat(kmInput.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    const scaledTerr = scaleTerritoryToAreaWithDirection(selectedTerritory, val, scaleDirection, scaleConfig.unitSqKm);
    onUpdateTerritory(scaledTerr);
    setKmInput(Math.round(val).toString());
    setIsKmEditing(false);
  };

  const handleScalePercent = (factor: number) => {
    const currentVal = Math.max(10, areaSqKm);
    const targetVal = Math.max(5, Math.round(currentVal * factor));
    handleApplyKmArea(targetVal);
  };

  // Biome Category Filter
  const [biomeCategory, setBiomeCategory] = useState<'alle' | 'natur' | 'gelaende' | 'klima' | 'magisch' | 'gewaesser'>('alle');

  const filteredBiomes = useMemo(() => {
    if (biomeCategory === 'alle') return WORLDMAP_BIOMES;
    return WORLDMAP_BIOMES.filter(b => b.category === biomeCategory);
  }, [biomeCategory]);

  // 1. ALL INNER PLACES & SUB-ZONES WITHIN THIS ZONE
  const innerPlaces = useMemo(() => {
    return territories.filter(t => t.id !== selectedTerritory.id && isTerritoryInsideZone(t, selectedTerritory, territories));
  }, [selectedTerritory, territories]);

  // Travel calculation between two selected inner places
  const [routeOriginId, setRouteOriginId] = useState<string>('');
  const [routeDestId, setRouteDestId] = useState<string>('');

  // Plausibility & Demography live evaluation for the inspected territory
  const plausibilityData = useMemo(() => {
    const grossKm2 = selectedTerritory.areaKm2 !== undefined && selectedTerritory.areaKm2 > 0
      ? selectedTerritory.areaKm2
      : calculatePolygonGeometricAreaKm2(selectedTerritory.points, selectedTerritory.radius, 10);

    const { habitableAreaKm2 } = calculateTerritoryHabitableAreaKm2(selectedTerritory, territories, 10);
    const habitableKm2 = habitableAreaKm2;
    const popCount = selectedTerritory.populationCount || parsePopulationValue(selectedTerritory.population);

    const effectiveArea = Math.max(0.1, habitableKm2 > 0 ? habitableKm2 : grossKm2);
    const density = popCount !== undefined && popCount > 0
      ? Math.round((popCount / effectiveArea) * 10) / 10
      : undefined;

    let densityClass: 'niedrig' | 'normal' | 'hoch' | 'sehr_hoch' | 'extrem' = 'normal';
    if (density !== undefined) {
      if (density <= 50) densityClass = 'niedrig';
      else if (density <= 250) densityClass = 'normal';
      else if (density <= 1000) densityClass = 'hoch';
      else if (density <= 3000) densityClass = 'sehr_hoch';
      else densityClass = 'extrem';
    }

    const tType = (selectedTerritory.type || '').toLowerCase();
    const isSettlement = tType === 'stadt' || tType === 'dorf' || tType === 'hafen' || tType === 'festung' || tType === 'siedlung';
    const isHarbor = tType === 'hafen' || (selectedTerritory.name || '').toLowerCase().includes('hafen');
    const isCapital = tType === 'hauptstadt' || (selectedTerritory.description || '').toLowerCase().includes('hauptstadt');

    // Contextual checks
    const innerPlaces = territories.filter(t => t.id !== selectedTerritory.id && isTerritoryInsideZone(t, selectedTerritory, territories));
    const hasHarbor = isHarbor || innerPlaces.some(p => p.type === 'hafen' || (p.name || '').toLowerCase().includes('hafen'));
    const hasCapital = isCapital || innerPlaces.some(p => p.type === 'hauptstadt' || p.type === 'stadt');

    const justifications: string[] = [];
    if (hasHarbor) justifications.push('Hafenstadt / Seehandel');
    if (hasCapital) justifications.push('Urbane Hauptstadt / Handelszentrum');
    if (selectedTerritory.trade) justifications.push('Handelsrouten vorhanden');

    let status: 'plausibel' | 'ungewoehnlich_begruendet' | 'unplausibel' = 'plausibel';
    let statusLabel = 'Plausibel';
    let recommendedAreaKm2: number | undefined = undefined;

    if (density !== undefined && popCount) {
      if (isSettlement) {
        status = 'plausibel';
        statusLabel = 'Plausible Siedlungsdichte';
      } else {
        if (densityClass === 'niedrig') {
          statusLabel = 'Geringe Dichte (Weitläufiges Umland)';
        } else if (densityClass === 'normal') {
          statusLabel = 'Normale Dichte für besiedeltes Land';
        } else if (densityClass === 'hoch') {
          statusLabel = justifications.length > 0 ? 'Solide Dichte (durch Infrastruktur gestützt)' : 'Erhöhte Dichte';
        } else if (densityClass === 'sehr_hoch') {
          if (justifications.length > 0) {
            status = 'ungewoehnlich_begruendet';
            statusLabel = 'Dichte Besiedlung (durch Handel/Hafen gestützt)';
          } else {
            status = 'unplausibel';
            statusLabel = 'Hohe Dichte ohne Handelsinfrastruktur';
            recommendedAreaKm2 = Math.max(15, Math.round(popCount / 180));
          }
        } else if (densityClass === 'extrem') {
          if (justifications.length > 0) {
            status = 'ungewoehnlich_begruendet';
            statusLabel = 'Konzentrierter Stadtstaat / Inselhafen';
          } else {
            status = 'unplausibel';
            statusLabel = 'Extreme Dichte auf zu kleiner Fläche';
            recommendedAreaKm2 = Math.max(25, Math.round(popCount / 120));
          }
        }
      }
    }

    return {
      grossKm2,
      habitableKm2,
      popCount,
      density,
      densityClass,
      status,
      statusLabel,
      justifications,
      recommendedAreaKm2
    };
  }, [selectedTerritory, territories]);

  const hasUninhabitableReduction = plausibilityData.grossKm2 > plausibilityData.habitableKm2 && plausibilityData.habitableKm2 > 0;

  const originPlace = innerPlaces.find(p => p.id === routeOriginId) || (innerPlaces.length > 0 ? innerPlaces[0] : null);
  const destPlace = innerPlaces.find(p => p.id === routeDestId) || (innerPlaces.length > 1 ? innerPlaces[1] : null);

  const routeDistanceKm = useMemo(() => {
    if (!originPlace || !destPlace || originPlace.id === destPlace.id) return 0;
    const distUnits = Math.hypot((originPlace.x ?? 0) - (destPlace.x ?? 0), (originPlace.y ?? 0) - (destPlace.y ?? 0));
    return Math.max(0.5, Math.round(distUnits * scaleConfig.unitKm * 10) / 10);
  }, [originPlace, destPlace, scaleConfig.unitKm]);

  // Handle position nudging
  const nudge = (dx: number, dy: number) => {
    onUpdateTerritory({
      ...selectedTerritory,
      x: Math.round((selectedTerritory.x + dx) * 10) / 10,
      y: Math.round((selectedTerritory.y + dy) * 10) / 10
    });
  };

  const getPlaceIcon = (type: Territory['type']) => {
    switch (type) {
      case 'stadt': return '[S]';
      case 'dorf': return '[D]';
      case 'hafen': return '[H]';
      case 'festung': return '[F]';
      case 'ort': return '[O]';
      case 'region': return '[R]';
      case 'land': return '[L]';
      case 'insel': return '[I]';
      case 'see': case 'wasser': return '[W]';
      case 'koenigreich': return '[K]';
      case 'zone': return '[T]';
      case 'unabhaengiges_gebiet': return '[U]';
      default: return '[•]';
    }
  };

  const getPlaceLabel = (type: Territory['type']) => {
    switch (type) {
      case 'stadt': return 'Stadt / Metropole';
      case 'dorf': return 'Dorf / Siedlung';
      case 'hafen': return 'Hafenstadt';
      case 'festung': return 'Festung / Burg';
      case 'ort': return 'Besonderer Ort / Heiligtum';
      case 'region': return 'Teilregion / Provinz';
      case 'land': return 'Teilland';
      case 'insel': return 'Insel';
      case 'see': return 'Binnensee';
      case 'koenigreich': return 'Landmasse';
      case 'zone': return 'Territorium / Reich';
      case 'unabhaengiges_gebiet': return 'Freies Gebiet';
      default: return 'Ortspunkt';
    }
  };

  return (
    <div className="w-full bg-slate-900/98 border-t border-slate-800 p-3 sm:p-4 pb-6 shadow-2xl z-20 shrink-0 select-none max-h-[70vh] overflow-y-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {!readOnly ? (
            <select
              value={selectedTerritory.type || 'zone'}
              onChange={(e) => {
                const newType = e.target.value as any;
                const defaultRadius = 
                  newType === 'meer' || newType === 'ozean' ? 40 : 
                  newType === 'kontinent' ? 35 : 
                  newType === 'koenigreich' || newType === 'land' ? 28 :
                  newType === 'region' || newType === 'unabhaengiges_gebiet' || newType === 'geografische_flaeche' ? 22 :
                  newType === 'see' ? 12 :
                  newType === 'insel' ? 15 : 
                  newType === 'dorf' ? 2.2 :
                  newType === 'hafen' ? 3.8 :
                  newType === 'ort' ? 2.5 :
                  newType === 'festung' ? 3.5 : 4.0;

                const defaultColor = 
                  newType === 'meer' || newType === 'ozean' ? '#0284c7' :
                  newType === 'see' ? '#0369a1' :
                  newType === 'kontinent' ? '#15803d' :
                  newType === 'koenigreich' ? '#15803d' :
                  newType === 'land' ? '#059669' :
                  newType === 'region' ? '#475569' :
                  newType === 'insel' ? '#059669' :
                  newType === 'dorf' ? '#10b981' :
                  newType === 'hafen' ? '#0ea5e9' :
                  newType === 'ort' ? '#f59e0b' :
                  newType === 'festung' ? '#dc2626' :
                  newType === 'stadt' ? '#8b5cf6' : '#6366f1';

                onUpdateTerritory({ 
                  ...selectedTerritory, 
                  type: newType,
                  radius: defaultRadius,
                  color: defaultColor
                });
              }}
              className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-black uppercase tracking-wider focus:outline-none focus:border-amber-400 cursor-pointer shrink-0"
            >
              <option value="koenigreich" className="bg-slate-900 text-amber-300">Landmasse</option>
              <option value="zone" className="bg-slate-900 text-teal-300">Territorium / Reich</option>
              <option value="land" className="bg-slate-900 text-emerald-300">Land</option>
              <option value="region" className="bg-slate-900 text-slate-300">Region</option>
              <option value="kontinent" className="bg-slate-900 text-amber-300">Kontinent</option>
              <option value="insel" className="bg-slate-900 text-emerald-300">Insel</option>
              <option value="unabhaengiges_gebiet" className="bg-slate-900 text-teal-300">Unabhängiges Gebiet</option>
              <option value="unbekanntes_land" className="bg-slate-900 text-purple-300">Unbekanntes Land</option>
              <option value="geografische_flaeche" className="bg-slate-900 text-slate-300">Geogr. Landfläche</option>
              <option value="meer" className="bg-slate-900 text-sky-300">Meer / Ozean</option>
              <option value="see" className="bg-slate-900 text-cyan-300">Binnensee</option>
              <option value="dorf" className="bg-slate-900 text-emerald-300">Dorf / Siedlung</option>
              <option value="stadt" className="bg-slate-900 text-indigo-300">Stadt / Metropole</option>
              <option value="hafen" className="bg-slate-900 text-sky-300">Hafenstadt</option>
              <option value="festung" className="bg-slate-900 text-rose-300">Bastion / Festung</option>
              <option value="ort" className="bg-slate-900 text-amber-300">Besonderer Ort</option>
            </select>
          ) : (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0">
              {isSea ? <Waves className="w-3 h-3 text-sky-400" /> : 
               isContinent ? <Mountain className="w-3 h-3 text-amber-400" /> : 
               isIsland ? <Palmtree className="w-3 h-3 text-emerald-400" /> : 
               selectedTerritory.type === 'stadt' ? <Building2 className="w-3 h-3 text-indigo-400" /> : 
               <Castle className="w-3 h-3 text-rose-400" />}
              <span>{selectedTerritory.type}</span>
            </span>
          )}

          <input
            type="text"
            disabled={readOnly}
            value={selectedTerritory.name || ''}
            onChange={(e) => onUpdateTerritory({ ...selectedTerritory, name: e.target.value })}
            className="text-sm sm:text-base font-black text-slate-100 bg-transparent border-b border-dashed border-slate-700 hover:border-amber-500 focus:border-amber-500 focus:bg-slate-950 px-1 py-0.5 rounded focus:outline-none min-w-[140px] max-w-[320px]"
            title="Klicken zum Umbenennen"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {onOpenLocalMap && (
            <button
              onClick={() => onOpenLocalMap(selectedTerritory)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-black transition-all flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
              title="Detaillierten Stadt- / Dorfplan mit Gebäuden, Wegen und Pflaster auf dem lokalen Raster öffnen und zeichnen"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-950" />
              <span>Ortskarte öffnen & zeichnen</span>
            </button>
          )}
          {onOpenSubdivideModal && (isSea || isContinent || (selectedTerritory.points && selectedTerritory.points.length >= 3)) && (
            <button
              onClick={() => onOpenSubdivideModal(selectedTerritory)}
              className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
              title="Dieses Meer / Gebiet nahtlos in Zonen (z.B. Calm Belts, Grand Line, Sektoren) unterteilen"
            >
              <Scissors className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">In Zonen einteilen</span>
            </button>
          )}
          {onFocusTerritory && (
            <button
              onClick={() => onFocusTerritory(selectedTerritory)}
              className="px-2.5 py-1 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
              title="Zoomt direkt auf dieses Gebiet für detailreiches Zeichnen & Platzieren"
            >
              <ZoomIn className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Fokussieren</span>
            </button>
          )}
          {!readOnly && (
            <button
              onClick={() => onDeleteTerritory(selectedTerritory.id)}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
              title="Dieses Gebiet löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Inspektor schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Details: Fläche, Geografie & Biom-Zuweisung */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
        
        {/* Column 1: Fläche, Geografie & Position */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2.5 min-w-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5 text-amber-400" />
                <span>Fläche & Geografie:</span>
              </span>
              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 text-[10px]">
                <span className="text-slate-400 font-semibold">Maßstab:</span>
                <span className="text-amber-300 font-bold font-mono">100m / Kachel</span>
              </div>
            </div>

            {/* DIRECT KM² INPUT & AREA DISPLAY */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Flächeninhalt (km²):</span>
                <span className="text-[9px] text-emerald-400 font-mono font-bold">Welt: {pctOfWorld}%</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    disabled={readOnly}
                    value={kmInput}
                    onChange={(e) => {
                      setIsKmEditing(true);
                      setKmInput(e.target.value);
                    }}
                    onBlur={() => {
                      setIsKmEditing(false);
                      handleApplyKmArea();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                        handleApplyKmArea();
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-400 pr-10"
                    placeholder="km² eingeben..."
                    title="Gewünschte Fläche in Quadratkilometern eingeben und Enter drücken"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none font-mono">
                    km²
                  </span>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleApplyKmArea()}
                    className="px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-lg font-bold text-xs border border-amber-500/40 transition-all flex items-center gap-1 shrink-0"
                    title="Fläche anwenden (Kartenpunkte und Radius anpassen)"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Setzen</span>
                  </button>
                )}
              </div>

              {/* Direction Selector Grid for Scaling */}
              {!readOnly && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 space-y-1.5 my-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      Skalierungsrichtung:
                    </span>
                    <span className="text-[10px] text-amber-300 font-bold font-mono">
                      {scaleDirection === 'center' ? 'Gleichmäßig (Zentrum)' :
                       scaleDirection === 'n' ? 'Nach Oben (Norden)' :
                       scaleDirection === 's' ? 'Nach Unten (Süden)' :
                       scaleDirection === 'e' ? 'Nach Rechts (Osten)' :
                       scaleDirection === 'w' ? 'Nach Links (Westen)' :
                       scaleDirection === 'nw' ? 'Nordwest' :
                       scaleDirection === 'ne' ? 'Nordost' :
                       scaleDirection === 'sw' ? 'Südwest' : 'Südost'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* 3x3 Direction Pad */}
                    <div className="grid grid-cols-3 gap-0.5 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setScaleDirection('nw')}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${scaleDirection === 'nw' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Nach Nordwesten erweitern"
                      >
                        NW
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleDirection('n')}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${scaleDirection === 'n' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Nach Oben (Norden) erweitern"
                      >
                        N
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleDirection('ne')}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${scaleDirection === 'ne' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Nach Nordosten erweitern"
                      >
                        NO
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleDirection('w')}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${scaleDirection === 'w' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Nach Links (Westen) erweitern"
                      >
                        W
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleDirection('center')}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${scaleDirection === 'center' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Zentriert / Radial gleichmäßig erweitern"
                      >
                        •
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleDirection('e')}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${scaleDirection === 'e' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Nach Rechts (Osten) erweitern"
                      >
                        O
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleDirection('sw')}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${scaleDirection === 'sw' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Nach Südwesten erweitern"
                      >
                        SW
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleDirection('s')}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${scaleDirection === 's' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Nach Unten (Süden) erweitern"
                      >
                        S
                      </button>
                      <button
                        type="button"
                        onClick={() => setScaleDirection('se')}
                        className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold transition-all ${scaleDirection === 'se' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        title="Nach Südosten erweitern"
                      >
                        SO
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-tight">
                      Wähle die Richtung, in die sich die Grenzen beim Vergrößern / Verkleinern verschieben sollen.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick scale buttons */}
              {!readOnly && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[9px] text-slate-500 font-semibold mr-1">Skalieren:</span>
                    <button
                      type="button"
                      onClick={() => handleScalePercent(0.5)}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-mono text-slate-300 transition-colors"
                      title="Fläche halbieren"
                    >
                      ÷2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScalePercent(2.0)}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-mono text-amber-300 font-bold transition-colors"
                      title="Fläche verdoppeln"
                    >
                      x2
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScalePercent(3.0)}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-mono text-amber-300 font-bold transition-colors"
                      title="Fläche verdreifachen"
                    >
                      x3
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScalePercent(5.0)}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-mono text-emerald-400 font-black transition-colors"
                      title="Fläche 5x vergrößern"
                    >
                      x5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScalePercent(10.0)}
                      className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-mono text-rose-400 font-black transition-colors"
                      title="Fläche 10x vergrößern"
                    >
                      x10
                    </button>
                  </div>

                  {/* Neutral Quick Presets */}
                  <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/60">
                    <span className="text-[9px] text-amber-400 font-bold mr-1">Größenvorlagen:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyKmArea(1)}
                      className="px-1.5 py-0.5 bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50 rounded text-[9px] font-bold"
                      title="Setzt die Fläche auf 1 km²"
                    >
                      Insel (1 km²)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyKmArea(5)}
                      className="px-1.5 py-0.5 bg-amber-950/60 hover:bg-amber-800 text-amber-300 border border-amber-700/50 rounded text-[9px] font-bold"
                      title="Setzt die Fläche auf 5 km²"
                    >
                      Region (5 km²)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyKmArea(25)}
                      className="px-1.5 py-0.5 bg-sky-950/60 hover:bg-sky-800 text-sky-300 border border-sky-700/50 rounded text-[9px] font-bold"
                      title="Setzt die Fläche auf 25 km²"
                    >
                      Großgebiet (25 km²)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Position (X, Y) with Nudge Controls */}
          <div className="border-t border-slate-800/60 pt-2 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Move className="w-3.5 h-3.5 text-teal-400" />
              <span>Zentrum (X / Y):</span>
            </span>
            
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {Math.round(selectedTerritory.x)} / {Math.round(selectedTerritory.y)}
              </span>
              {!readOnly && (
                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 gap-0.5">
                  <button onClick={() => nudge(-2, 0)} className="p-1 hover:bg-slate-800 text-slate-300 rounded" title="Nach links"><ArrowLeft className="w-3 h-3" /></button>
                  <button onClick={() => nudge(0, -2)} className="p-1 hover:bg-slate-800 text-slate-300 rounded" title="Nach oben"><ArrowUp className="w-3 h-3" /></button>
                  <button onClick={() => nudge(0, 2)} className="p-1 hover:bg-slate-800 text-slate-300 rounded" title="Nach unten"><ArrowDown className="w-3 h-3" /></button>
                  <button onClick={() => nudge(2, 0)} className="p-1 hover:bg-slate-800 text-slate-300 rounded" title="Nach rechts"><ArrowRight className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          </div>

          {/* PLAUSIBILITÄTS- & DEMOGRAFIE-PRÜFUNG */}
          <div className="border-t border-slate-800/60 pt-2.5 space-y-2 bg-slate-900/40 -mx-3 px-3 pb-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-sky-400" />
                <span>Plausibilität & Demografie</span>
              </span>

              <span className={`px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 border ${
                plausibilityData.status === 'plausibel'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : plausibilityData.status === 'ungewoehnlich_begruendet'
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}>
                {plausibilityData.status === 'plausibel' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : plausibilityData.status === 'ungewoehnlich_begruendet' ? (
                  <Info className="w-3 h-3 text-sky-400" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                )}
                <span>{plausibilityData.statusLabel}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-0.5">
                <div className="text-[9px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                  <span>Bewohnbare Fläche:</span>
                  {hasUninhabitableReduction && (
                    <span className="text-amber-400 font-mono text-[8px]" title="Vulkan- oder Gebirgsabzug">Netto</span>
                  )}
                </div>
                <div className="font-mono text-slate-100 font-bold">
                  {plausibilityData.habitableKm2 > 0
                    ? `${new Intl.NumberFormat('de-DE').format(plausibilityData.habitableKm2)} km²`
                    : `${new Intl.NumberFormat('de-DE').format(plausibilityData.grossKm2)} km²`}
                </div>
                {hasUninhabitableReduction && (
                  <div className="text-[8px] text-slate-400 font-mono">
                    Brutto: {new Intl.NumberFormat('de-DE').format(plausibilityData.grossKm2)} km²
                  </div>
                )}
              </div>

              <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-0.5">
                <div className="text-[9px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                  <Users className="w-3 h-3 text-indigo-400" />
                  <span>Einwohner & Dichte:</span>
                </div>
                <div className="font-mono text-slate-100 font-bold">
                  {plausibilityData.popCount !== undefined && plausibilityData.popCount > 0
                    ? `${new Intl.NumberFormat('de-DE').format(plausibilityData.popCount)} Ew.`
                    : 'k. A.'}
                </div>
                <div className="text-[9px] font-mono text-amber-300">
                  {plausibilityData.density !== undefined
                    ? `${plausibilityData.density.toLocaleString('de-DE')} Ew/km²`
                    : 'Keine Dichte berechenbar'}
                </div>
              </div>
            </div>

            {/* Justifications */}
            {plausibilityData.justifications.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {plausibilityData.justifications.map((j, jIdx) => (
                  <span key={jIdx} className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-300 font-medium">
                    {j}
                  </span>
                ))}
              </div>
            )}

            {/* Unplausible fix suggestion button */}
            {!readOnly && plausibilityData.status === 'unplausibel' && plausibilityData.recommendedAreaKm2 && (
              <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-amber-300 leading-tight">
                  Empfohlene Mindestfläche für {plausibilityData.popCount?.toLocaleString('de-DE')} Ew: <strong className="font-mono">{plausibilityData.recommendedAreaKm2} km²</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyKmArea(plausibilityData.recommendedAreaKm2)}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded transition-all shrink-0"
                  title="Fläche automatisch auf den empfohlenen Wert anpassen"
                >
                  Anpassen
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Biom-Typ Zuweisen & Beschreibung */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2.5 min-w-0">
          {!readOnly && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Biom-Typ ({WORLDMAP_BIOMES.length} zur Auswahl):</span>
                </span>

                {/* Category filter tabs */}
                <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[9px]">
                  {(['alle', 'natur', 'gelaende', 'klima', 'magisch', 'gewaesser'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setBiomeCategory(cat)}
                      className={`px-1.5 py-0.5 rounded capitalize font-semibold transition-all ${
                        biomeCategory === cat
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat === 'alle' ? 'Alle' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Biom Buttons Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-0.5 custom-scrollbar">
                {filteredBiomes.map(b => {
                  const isSelected = selectedTerritory.biome === b.id || selectedTerritory.type === `biome_${b.id}`;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onUpdateTerritory({ 
                        ...selectedTerritory, 
                        biome: b.id, 
                        color: b.color,
                        type: selectedTerritory.type.startsWith('biome_') ? `biome_${b.id}` : selectedTerritory.type 
                      })}
                      title={`${b.name} - ${b.description}`}
                      className={`px-1.5 py-1 rounded-lg text-[10px] font-bold text-left border transition-all flex items-center gap-1 truncate ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-md scale-[1.02] ring-1 ring-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
                      }`}
                    >
                      <span className="shrink-0">{b.icon}</span>
                      <span className="truncate">{b.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color & Visual Appearance (Red Line / Biome / Sea Tint) */}
          <div className="border-t border-slate-800/60 pt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Flächen-Farbe & Tönung:</span>
              </span>
              {selectedTerritory.color && (
                <span className="text-[9px] font-mono text-slate-400">
                  {selectedTerritory.color}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
              {DRAW_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.color}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onUpdateTerritory({ ...selectedTerritory, color: preset.color })}
                  className={`w-5 h-5 rounded-full border transition-transform flex items-center justify-center ${
                    selectedTerritory.color?.toLowerCase() === preset.color.toLowerCase()
                      ? 'border-amber-400 ring-2 ring-amber-400/60 scale-125 z-10 shadow-md'
                      : 'border-slate-700 hover:scale-110 opacity-75 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.label}
                />
              ))}

              <div className="flex items-center ml-1">
                <input
                  type="color"
                  disabled={readOnly}
                  value={selectedTerritory.color || '#15803d'}
                  onChange={(e) => onUpdateTerritory({ ...selectedTerritory, color: e.target.value })}
                  className="w-5 h-5 rounded border border-slate-700 bg-transparent cursor-pointer hover:border-amber-400"
                  title="Eigene Farbe wählen (z.B. für Red Line)"
                />
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          <div className="border-t border-slate-800/60 pt-2 space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Notiz / Chronik:</span>
            </span>
            <AutoExpandingTextarea
              disabled={readOnly}
              value={selectedTerritory.description || ''}
              onChange={(e) => onUpdateTerritory({ ...selectedTerritory, description: e.target.value })}
              placeholder="Informationen zu dieser Region..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500 min-h-[40px]"
            />
          </div>

          {/* Type-Specific Fields */}
          <div className="border-t border-slate-800/60 pt-2 space-y-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Spezifische Eigenschaften: {selectedTerritory.type || 'ort'}</span>
            </span>
            <TerritorySpecificFields
              territory={selectedTerritory}
              updateTerritory={(changes) => onUpdateTerritory({ ...selectedTerritory, ...changes })}
            />
          </div>
        </div>
      </div>

      {/* 3. HAUPT-ÜBERSICHTSTABELLE: INNERE ORTE, TEILZONEN, FLÄCHEN & REISEZEITEN */}
      <div className="bg-slate-950 rounded-xl border border-slate-800/90 overflow-hidden shadow-lg">
        {/* Table Header / Title */}
        <div className="bg-slate-900/90 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-100 flex items-center gap-1.5">
                <span>Orte & Teilzonen innerhalb von</span>
                <span className="text-amber-400">{selectedTerritory.name}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {innerPlaces.length} {innerPlaces.length === 1 ? 'Eintrag' : 'Einträge'}
                </span>
              </h3>
            </div>
          </div>

          {onOpenSubdivideModal && (isSea || isContinent || (selectedTerritory.points && selectedTerritory.points.length >= 3)) && (
            <button
              onClick={() => onOpenSubdivideModal(selectedTerritory)}
              className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Dieses Meer / Gebiet nahtlos in Zonen (z.B. Calm Belts, Grand Line, Sektoren) unterteilen"
            >
              <Scissors className="w-3 h-3 text-sky-400" />
              <span>Meer / Gebiet in Zonen unterteilen</span>
            </button>
          )}
        </div>

        {/* Inner Places Table */}
        {innerPlaces.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Ort / Teilzone</th>
                  <th className="py-2 px-3">Typ</th>
                  <th className="py-2 px-3">Fläche</th>
                  <th className="py-2 px-3">Distanz (Zentrum)</th>
                  <th className="py-2 px-3">Reisezeit zu Fuß</th>
                  <th className="py-2 px-3">Reisezeit zu Pferd</th>
                  <th className="py-2 px-3 text-right">Aktion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {innerPlaces.map((place) => {
                  const placeRawArea = calculateTerritoryArea(place, territories);
                  const placeAreaSqKm = Math.round(placeRawArea * scaleConfig.unitSqKm);
                  const placeFormattedArea = placeAreaSqKm > 0 ? `${new Intl.NumberFormat('de-DE').format(placeAreaSqKm)} km²` : '< 1 km²';

                  // Distance from zone center in km
                  const distUnits = Math.hypot((place.x ?? 0) - (selectedTerritory.x ?? 0), (place.y ?? 0) - (selectedTerritory.y ?? 0));
                  const distKm = Math.max(0.2, Math.round(distUnits * scaleConfig.unitKm * 10) / 10);

                  // Travel times from center
                  const walkTime = distKm <= 25 
                    ? (distKm < 4.5 ? `~${Math.max(5, Math.round((distKm / 4.5) * 60))} Min.` : `~${(distKm / 4.5).toFixed(1)} Std.`)
                    : `~${(distKm / 28).toFixed(1)} Reisetage`;

                  const rideTime = distKm <= 50 
                    ? (distKm < 10 ? `~${Math.max(3, Math.round((distKm / 10) * 60))} Min.` : `~${(distKm / 10).toFixed(1)} Std.`)
                    : `~${(distKm / 55).toFixed(1)} Reisetage`;

                  return (
                    <tr 
                      key={place.id}
                      className="hover:bg-slate-900/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectTerritoryById?.(place.id)}
                    >
                      {/* Name & Icon */}
                      <td className="py-2 px-3 font-semibold text-slate-100 flex items-center gap-2">
                        <span className="text-base">{getPlaceIcon(place.type)}</span>
                        <span className="group-hover:text-amber-300 transition-colors">{place.name}</span>
                      </td>

                      {/* Type */}
                      <td className="py-2 px-3 text-slate-400">
                        <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-[10px] font-medium text-slate-300">
                          {getPlaceLabel(place.type)}
                        </span>
                      </td>

                      {/* Area */}
                      <td className="py-2 px-3 font-mono text-amber-300/90 font-bold">
                        {placeFormattedArea}
                      </td>

                      {/* Distance from Center */}
                      <td className="py-2 px-3 font-mono text-slate-300">
                        <span className="flex items-center gap-1">
                          <Compass className="w-3 h-3 text-teal-400" />
                          <span>{distKm} km</span>
                        </span>
                      </td>

                      {/* Walk Time */}
                      <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Footprints className="w-3 h-3" />
                          <span>{walkTime}</span>
                        </span>
                      </td>

                      {/* Ride Time */}
                      <td className="py-2 px-3 text-slate-300 font-mono text-[11px]">
                        <span className="flex items-center gap-1 text-amber-400">
                          <Clock className="w-3 h-3" />
                          <span>{rideTime}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {onFocusTerritory && (
                            <button
                              onClick={() => onFocusTerritory(place)}
                              className="px-2 py-1 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 rounded text-[10px] font-bold transition-all flex items-center gap-1"
                              title="Diesen Ort fokussieren"
                            >
                              <ZoomIn className="w-3 h-3" />
                              <span>Fokus</span>
                            </button>
                          )}
                          {!readOnly && (
                            <button
                              onClick={() => onDeleteTerritory(place.id)}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                              title="Löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 text-center text-slate-400 space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">
              Noch keine Orte oder Teilzonen innerhalb von {selectedTerritory.name} platziert
            </div>
            <div className="text-[11px] text-slate-500 max-w-md mx-auto">
              Klicke oben in der Werkzeugleiste auf <span className="text-indigo-400 font-bold">+ Stadt / Hafen</span> oder <span className="text-amber-400 font-bold">Zone frei zeichnen</span> und setze sie direkt auf dieses Gebiet. Sie erscheinen dann automatisch in dieser Tabelle.
            </div>
          </div>
        )}

        {/* 4. ROUTEN- & REISEZEIT-RECHNER ZWISCHEN ZWEI ORTEN INNERHALB DIESER ZONE */}
        {innerPlaces.length >= 2 && (
          <div className="bg-slate-900/80 border-t border-slate-800 p-3">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-2">
              <Footprints className="w-3.5 h-3.5 text-amber-400" />
              <span>Reisezeit-Rechner (Zwischen zwei Orten in dieser Zone):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
              {/* Origin Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <select
                  value={originPlace?.id || ''}
                  onChange={(e) => setRouteOriginId(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-medium w-full focus:outline-none cursor-pointer"
                >
                  {innerPlaces.map(p => (
                    <option key={`orig-${p.id}`} value={p.id} className="bg-slate-900 text-slate-200">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center text-slate-500">
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </div>

              {/* Dest Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <select
                  value={destPlace?.id || ''}
                  onChange={(e) => setRouteDestId(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-medium w-full focus:outline-none cursor-pointer"
                >
                  {innerPlaces.map(p => (
                    <option key={`dest-${p.id}`} value={p.id} className="bg-slate-900 text-slate-200">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Travel Calculation Results */}
            {originPlace && destPlace && originPlace.id !== destPlace.id ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 pt-2.5 border-t border-slate-800/80 text-center">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Distanz</div>
                  <div className="font-mono text-amber-300 font-black text-sm">{routeDistanceKm} km</div>
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Zu Fuß (4.5 km/h)</div>
                  <div className="font-mono text-emerald-400 font-bold text-xs">
                    {routeDistanceKm <= 25 
                      ? (routeDistanceKm < 4.5 ? `${Math.max(5, Math.round((routeDistanceKm / 4.5) * 60))} Minuten` : `${(routeDistanceKm / 4.5).toFixed(1)} Stunden`)
                      : `${(routeDistanceKm / 28).toFixed(1)} Reisetage`}
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Zu Pferd (10 km/h)</div>
                  <div className="font-mono text-amber-300 font-bold text-xs">
                    {routeDistanceKm <= 50 
                      ? (routeDistanceKm < 10 ? `${Math.max(3, Math.round((routeDistanceKm / 10) * 60))} Minuten` : `${(routeDistanceKm / 10).toFixed(1)} Stunden`)
                      : `${(routeDistanceKm / 55).toFixed(1)} Reisetage`}
                  </div>
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Postkutsche (6 km/h)</div>
                  <div className="font-mono text-cyan-300 font-bold text-xs">
                    {routeDistanceKm <= 35 
                      ? (routeDistanceKm < 6 ? `${Math.max(5, Math.round((routeDistanceKm / 6) * 60))} Minuten` : `${(routeDistanceKm / 6).toFixed(1)} Stunden`)
                      : `${(routeDistanceKm / 35).toFixed(1)} Reisetage`}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
