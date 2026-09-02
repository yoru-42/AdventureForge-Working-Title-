import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Loader2,
  Ruler,
  Wand2,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  ChevronDown,
  ChevronUp,
  Ship,
  Users,
  Gem,
  Swords,
  BookOpen,
  Trash2,
  Plus,
  MapPin,
  Globe,
  Edit3,
  Search,
  ExternalLink,
  Shield,
  Anchor,
  Compass,
  Building2,
  BrickWall,
  Hotel,
  Store,
  Factory,
  Move,
  Paintbrush,
  Square,
  Circle,
  Grid,
  PaintBucket,
  Eraser,
  Layers,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { getCustomTerrainStyle, renderTokenIconElement } from './TacticalCombatMap';
import { GeminiService } from '../services/geminiService';
import { Territory, WorldSetting, LoreEntry } from '../types';

interface TacticalCanvasEditorProps {
  player: any;
  combatState: any;
  onChangeCombatState: (state: any) => void;
  territory?: Territory | null;
  worldSetting?: WorldSetting;
  loreDatabase?: LoreEntry[];
  onUpdateTerritoryFields?: (fields: Partial<Territory>) => void;
}

interface ActiveToken {
  name: string;
  icon: string;
  category: string;
  description: string;
  loreEntryId?: string;
  faction?: string;
  population?: number;
  minCrew?: number;
  maxCapacity?: number;
  shipSize?: 'klein' | 'mittel' | 'groß';
  defense?: number;
  attack?: number;
  durability?: number;
}

export const getShipStatsForSize = (shipTitle: string, size: 'klein' | 'mittel' | 'groß') => {
  const t = (shipTitle || '').toLowerCase();
  
  if (t.includes('ruderboot') || t.includes('beiboot') || t.includes('fischerboot') || t.includes('kanu') || t.includes('floß') || t.includes('floss') || t.includes('kutter')) {
    if (size === 'klein') return { minCrew: 1, maxCapacity: 4, population: 2, defense: 5, attack: 0, durability: 20 };
    if (size === 'mittel') return { minCrew: 2, maxCapacity: 8, population: 5, defense: 10, attack: 2, durability: 50 };
    return { minCrew: 3, maxCapacity: 15, population: 8, defense: 15, attack: 5, durability: 100 };
  }

  if (t.includes('kutsche') || t.includes('karren') || t.includes('planwagen') || t.includes('wagen') || t.includes('schlitten')) {
    if (size === 'klein') return { minCrew: 1, maxCapacity: 4, population: 2, defense: 5, attack: 0, durability: 30 };
    if (size === 'mittel') return { minCrew: 2, maxCapacity: 8, population: 5, defense: 12, attack: 3, durability: 75 };
    return { minCrew: 4, maxCapacity: 20, population: 12, defense: 20, attack: 8, durability: 150 };
  }

  if (t.includes('galeone') || t.includes('flaggschiff') || t.includes('linienschiff') || t.includes('kriegsschiff') || t.includes('fregatte')) {
    if (size === 'klein') return { minCrew: 15, maxCapacity: 50, population: 35, defense: 45, attack: 35, durability: 200 };
    if (size === 'mittel') return { minCrew: 40, maxCapacity: 140, population: 90, defense: 75, attack: 80, durability: 600 };
    return { minCrew: 80, maxCapacity: 350, population: 220, defense: 95, attack: 150, durability: 1200 };
  }

  if (t.includes('pirat') || t.includes('kaper')) {
    if (size === 'klein') return { minCrew: 6, maxCapacity: 20, population: 14, defense: 25, attack: 15, durability: 100 };
    if (size === 'mittel') return { minCrew: 15, maxCapacity: 60, population: 45, defense: 50, attack: 40, durability: 300 };
    return { minCrew: 35, maxCapacity: 160, population: 110, defense: 80, attack: 85, durability: 750 };
  }

  if (t.includes('handel') || t.includes('fracht') || t.includes('dampf') || t.includes('transportschiff')) {
    if (size === 'klein') return { minCrew: 4, maxCapacity: 15, population: 8, defense: 15, attack: 5, durability: 80 };
    if (size === 'mittel') return { minCrew: 10, maxCapacity: 50, population: 30, defense: 35, attack: 15, durability: 250 };
    return { minCrew: 25, maxCapacity: 180, population: 100, defense: 60, attack: 35, durability: 600 };
  }

  // Standard Segelschiff / Luftschiff / U-Boot / Elfenbarke
  if (size === 'klein') return { minCrew: 3, maxCapacity: 12, population: 6, defense: 15, attack: 10, durability: 90 };
  if (size === 'mittel') return { minCrew: 10, maxCapacity: 45, population: 28, defense: 35, attack: 25, durability: 280 };
  return { minCrew: 25, maxCapacity: 150, population: 85, defense: 70, attack: 60, durability: 650 };
};

export interface ExtractedLocationToken {
  id: string;
  name: string;
  icon: string;
  category: string;
  group: 'garrison' | 'ships' | 'structures' | 'characters' | 'places';
  description: string;
  population?: number;
  minCrew?: number;
  maxCapacity?: number;
  shipSize?: 'klein' | 'mittel' | 'groß';
  defense?: number;
  attack?: number;
  durability?: number;
  loreEntryId?: string;
  sourceText?: string;
}

export const extractLocationTokens = (
  locationEntry: LoreEntry | null,
  loreDatabase: LoreEntry[] = [],
  worldSetting?: WorldSetting
): ExtractedLocationToken[] => {
  if (!locationEntry) return [];

  const tokens: ExtractedLocationToken[] = [];
  const title = (locationEntry.title || '').trim();
  const desc = (locationEntry.description || '');
  const details = locationEntry.details || {};
  const militaryStr = details.militaryStrength || details.military || details.militär || details.garrison || '';
  const defenseStr = details.defense || '';
  const landmarks = details.landmarks || details.pointsOfInterest || '';
  const buildingsStr = details.buildings || '';
  const shipsStr = details.ships || '';
  let popVal = 0;
  if (details.population) {
    const popClean = String(details.population).replace(/\./g, '').trim();
    const matchDigits = popClean.match(/\d+/);
    if (matchDigits) {
      popVal = parseInt(matchDigits[0], 10);
    }
  }

  const rawType = (details.rawType || details.territoryType || '').toLowerCase();
  let inferredPopVal = popVal;
  if (inferredPopVal === 0) {
    if (rawType === 'stadt') {
      inferredPopVal = 3200;
    } else if (rawType === 'dorf') {
      inferredPopVal = 450;
    } else if (rawType === 'hafen') {
      inferredPopVal = 1500;
    } else if (rawType === 'festung') {
      inferredPopVal = 800;
    } else if (rawType === 'ort') {
      inferredPopVal = 600;
    }
  }

  const government = details.government || '';
  const ruler = details.ruler || '';
  const culture = details.culture || details.kultur || '';
  const exportsStr = details.exports || '';
  const importsStr = details.imports || '';
  const trade = details.trade || '';
  const pointsOfInterest = details.pointsOfInterest || '';
  const dungeons = details.dungeons || '';
  const magicPlaces = details.magicPlaces || '';
  const naturalWonders = details.naturalWonders || '';
  const climate = details.climate || '';
  const resources = details.resources || '';
  const religion = details.religion || '';

  const combinedText = `${desc} ${militaryStr} ${defenseStr} ${landmarks} ${buildingsStr} ${shipsStr} ${government} ${ruler} ${culture} ${exportsStr} ${importsStr} ${trade} ${pointsOfInterest} ${dungeons} ${magicPlaces} ${naturalWonders} ${climate} ${resources} ${religion} ${rawType}`;
  const textLower = combinedText.toLowerCase();

  const parseGermanNumber = (str: string): number => {
    const cleaned = str.trim().toLowerCase();
    if (/^\d+$/.test(cleaned)) return parseInt(cleaned, 10);
    if (cleaned.startsWith('ein')) return 1;
    if (cleaned === 'zwei') return 2;
    if (cleaned === 'drei') return 3;
    if (cleaned === 'vier') return 4;
    if (cleaned === 'fünf') return 5;
    if (cleaned === 'sechs') return 6;
    if (cleaned === 'sieben') return 7;
    if (cleaned === 'acht') return 8;
    if (cleaned === 'neun') return 9;
    if (cleaned === 'zehn') return 10;
    if (cleaned === 'elf') return 11;
    if (cleaned === 'zwölf') return 12;
    if (cleaned === 'fünfzehn') return 15;
    if (cleaned === 'zwanzig') return 20;
    if (cleaned === 'fünfzig') return 50;
    if (cleaned === 'hundert') return 100;
    if (cleaned === 'zweihundert') return 200;
    if (cleaned === 'dreihundert') return 300;
    if (cleaned === 'fünfhundert') return 500;
    if (cleaned === 'tausend') return 1000;
    return 1;
  };

  // Split text into readable clauses / sentences to preserve context and avoid cross-boundary matches
  const clauses = combinedText.split(/[.!?;\n\r]+|(?:\s+und\s+|\s+sowie\s+|\s+mit\s+)/i).map(s => s.trim()).filter(Boolean);

  // 1. EXTRACT GARRISON & MILITARY UNITS
  const seenUnitNames = new Set<string>();

  // Prepended counts: e.g., "ca. 200 Mann Hafenwache", "Zwei breitschulterige Männer", "3 bewaffnete Soldaten"
  const prependedUnitRegex = /(?:ca\.\s*|etwa\s*|rund\s*|bis\s+zu\s*)?(\d+|ein[en]?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|fünfzehn|zwanzig|fünfzig|hundert|zweihundert|dreihundert|fünfhundert|tausend)\s*(?:Mann|Soldaten|Krieger|Wachen|Personen|Einwohner)?\s*(?:von\s+der\s+|von\s+|aus\s+|an\s+)?(?:(?:[a-zäöüß-]+)\s+){0,3}\s*(Hafenwache|Stadtwache|Garde|Patrouille|Soldaten|Krieger|Wachen|Ritter|Schützen|Bogenschützen|Infanterie|Miliz|Seemänner|Matrosen|Piraten|Militär|Garnison|Truppen|Kanoniere|Feuerwehr|Bürgerwehr|Söldner|Reiter|Kavallerie|Männer|Kerle|Gestalten|Typen|Angreifer|Eindringlinge|Schergen|Banditen|Bestien-Piraten)/i;

  // Postpended counts: e.g., "Hafenwache von ca. 200 Mann", "Garde aus 50 Kriegern", "Truppe von 15 Rittern"
  const postpendedUnitRegex = /(Hafenwache|Stadtwache|Garde|Patrouille|Soldaten|Krieger|Wachen|Ritter|Schützen|Bogenschützen|Infanterie|Miliz|Seemänner|Matrosen|Piraten|Militär|Garnison|Truppen|Kanoniere|Feuerwehr|Bürgerwehr|Söldner|Reiter|Kavallerie|Männer|Kerle|Gestalten|Typen|Angreifer|Eindringlinge|Schergen|Banditen|Bestien-Piraten)\s*(?:von|aus|mit|bestehend\s+aus)?\s*(?:ca\.|etwa|rund|bis\s+zu)?\s*(\d+|ein[en]?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|fünfzehn|zwanzig|fünfzig|hundert|zweihundert|dreihundert|fünfhundert|tausend)\s*(?:Mann|Soldaten|Krieger|Wachen|Personen|Einwohner)?/i;

  clauses.forEach(clause => {
    let match;
    // Try postpended first as it's more specific in German descriptive sentences
    if ((match = clause.match(postpendedUnitRegex))) {
      const unitType = match[1];
      const numRaw = match[2];
      const parsedPop = parseGermanNumber(numRaw);
      const formattedType = unitType.charAt(0).toUpperCase() + unitType.slice(1);
      const nameKey = `${unitType.toLowerCase()}-${parsedPop}`;

      if (!seenUnitNames.has(nameKey)) {
        seenUnitNames.add(nameKey);
        const icon = unitType.toLowerCase().includes('hafen') ? 'Shield' :
                     unitType.toLowerCase().includes('garde') ? 'Swords' :
                     unitType.toLowerCase().includes('schütz') ? 'Target' :
                     unitType.toLowerCase().includes('ritter') ? 'Shield' : 'Sword';

        tokens.push({
          id: `loc-garrison-${title}-${tokens.length}`,
          name: `${formattedType} (${parsedPop > 1 ? `ca. ${parsedPop} Mann` : 'Einheit'})`,
          icon,
          category: 'Gegner & Monster',
          group: 'garrison',
          description: `Sicherheits- & Kampfeinheit vor Ort.`,
          population: parsedPop,
          defense: Math.min(100, Math.max(15, Math.round(parsedPop / 4))),
          attack: Math.min(100, Math.max(10, Math.round(parsedPop / 5))),
          durability: 100,
          sourceText: clause
        });
      }
    } else if ((match = clause.match(prependedUnitRegex))) {
      const numRaw = match[1];
      const unitType = match[2];
      const parsedPop = parseGermanNumber(numRaw);
      const formattedType = unitType.charAt(0).toUpperCase() + unitType.slice(1);
      const nameKey = `${unitType.toLowerCase()}-${parsedPop}`;

      if (!seenUnitNames.has(nameKey)) {
        seenUnitNames.add(nameKey);
        const icon = unitType.toLowerCase().includes('hafen') ? 'Shield' :
                     unitType.toLowerCase().includes('garde') ? 'Swords' :
                     unitType.toLowerCase().includes('schütz') ? 'Target' :
                     unitType.toLowerCase().includes('ritter') ? 'Shield' : 'Sword';

        tokens.push({
          id: `loc-garrison-${title}-${tokens.length}`,
          name: `${formattedType} (${parsedPop > 1 ? `ca. ${parsedPop} Mann` : 'Einheit'})`,
          icon,
          category: 'Gegner & Monster',
          group: 'garrison',
          description: `Sicherheits- & Kampfeinheit vor Ort.`,
          population: parsedPop,
          defense: Math.min(100, Math.max(15, Math.round(parsedPop / 4))),
          attack: Math.min(100, Math.max(10, Math.round(parsedPop / 5))),
          durability: 100,
          sourceText: clause
        });
      }
    }
  });

  // Fallback garrison if no garrison extracted and description matches fortress/harbor keywords
  if (tokens.filter(t => t.group === 'garrison').length === 0) {
    if (textLower.includes('hafen') || title.toLowerCase().includes('hafen')) {
      tokens.push({
        id: `loc-garrison-fallback-${title}-1`,
        name: `Hafenwache (${title})`,
        icon: 'Shield',
        category: 'Gegner & Monster',
        group: 'garrison',
        description: `Hafenwache & Sicherheitstruppe von ${title}.`,
        population: 50,
        defense: 25,
        attack: 15,
        durability: 100,
        sourceText: 'Standard Hafengarnison'
      });
    } else if (textLower.includes('festung') || textLower.includes('burg') || textLower.includes('garnison') || textLower.includes('stadt')) {
      tokens.push({
        id: `loc-garrison-fallback-${title}-1`,
        name: `Stadtwache & Garnison (${title})`,
        icon: '⚔️',
        category: 'Gegner & Monster',
        group: 'garrison',
        description: `Stationierte Truppen zur Verteidigung von ${title}.`,
        population: 80,
        defense: 35,
        attack: 25,
        durability: 120,
        sourceText: 'Standard Ortsgarnison'
      });
    }
  }

  // 2. EXTRACT SHIPS
  let shipCountFound = 0;
  // Regex 2a: Count before ship name ("drei bewaffnete Patrouillenschiffe", "2 Kriegsschiffe")
  const prependedShipRegex = /(?:ca\.\s*|etwa\s*|rund\s*|bis\s+zu\s*)?(\d+|ein[en]?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\s*(?:bewaffnete[rn]?|große[rn]?|schwere[rn]?|schnelle[rn]?)?\s*(Patrouillenschiff[en]*|Kriegsschiff[en]*|Fregatte[n]*|Galeone[n]*|Handelsschiff[en]*|Frachter[n]*|Segelschiff[en]*|Boot[en]*|Schiff[en]*|Dampfschiff[en]*|Luftschiff[en]*|Elfenbarke[n]*)/i;

  // Regex 2b: Ship name followed by count ("Patrouillenschiffe (3)", "Schiffe: zwei")
  const postpendedShipRegex = /(Patrouillenschiff[en]*|Kriegsschiff[en]*|Fregatte[n]*|Galeone[n]*|Handelsschiff[en]*|Frachter[n]*|Segelschiff[en]*|Boot[en]*|Schiff[en]*|Dampfschiff[en]*|Luftschiff[en]*|Elfenbarke[n]*)\s*(?:von|aus|mit|bestehend\s+aus)?\s*(?:ca\.|etwa|rund|bis\s+zu)?\s*(\d+|ein[en]?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)/i;

  clauses.forEach(clause => {
    let match;
    let count = 0;
    let rawShipType = '';

    if ((match = clause.match(postpendedShipRegex))) {
      rawShipType = match[1];
      count = parseGermanNumber(match[2]);
    } else if ((match = clause.match(prependedShipRegex))) {
      count = parseGermanNumber(match[1]);
      rawShipType = match[2];
    }

    if (count > 0 && rawShipType) {
      let cleanShipType = 'Patrouillenschiff';
      if (rawShipType.toLowerCase().includes('krieg')) cleanShipType = 'Kriegsschiff';
      else if (rawShipType.toLowerCase().includes('fregatte')) cleanShipType = 'Fregatte';
      else if (rawShipType.toLowerCase().includes('galeone')) cleanShipType = 'Galeone';
      else if (rawShipType.toLowerCase().includes('handel')) cleanShipType = 'Handelsschiff';
      else if (rawShipType.toLowerCase().includes('fracht')) cleanShipType = 'Frachtschiff';
      else if (rawShipType.toLowerCase().includes('dampf')) cleanShipType = 'Dampfschiff';
      else if (rawShipType.toLowerCase().includes('luft')) cleanShipType = 'Luftschiff';
      else if (rawShipType.toLowerCase().includes('barke')) cleanShipType = 'Elfenbarke';

      for (let i = 1; i <= Math.min(count, 8); i++) {
        shipCountFound++;
        const isLarge = cleanShipType === 'Galeone' || cleanShipType === 'Kriegsschiff';
        tokens.push({
          id: `loc-ship-${title}-${shipCountFound}`,
          name: `${cleanShipType} #${i} (${title})`,
          icon: '⛵',
          category: 'Gegenstände',
          group: 'ships',
          description: `Wasserfahrzeug der Flotte von ${title}.`,
          shipSize: isLarge ? 'groß' : 'mittel',
          minCrew: isLarge ? 15 : 5,
          population: isLarge ? 40 : 15,
          defense: isLarge ? 50 : 25,
          attack: isLarge ? 35 : 15,
          durability: isLarge ? 200 : 100,
          sourceText: clause
        });
      }
    }
  });

  // Fallback ship generation if place is harbor/water and no ships found
  if (shipCountFound === 0 && (textLower.includes('hafen') || title.toLowerCase().includes('hafen') || textLower.includes('docks') || textLower.includes('bucht'))) {
    for (let i = 1; i <= 2; i++) {
      tokens.push({
        id: `loc-ship-fallback-${title}-${i}`,
        name: `Patrouillenschiff #${i}`,
        icon: '⛵',
        category: 'Gegenstände',
        group: 'ships',
        description: `Patrouillenschiff im Hafen von ${title}.`,
        shipSize: 'mittel',
        minCrew: 5,
        population: 12,
        defense: 25,
        attack: 15,
        durability: 100,
        sourceText: 'Standard-Hafeneffekte'
      });
    }
  }

  // 3. EXTRACT BUILDINGS & STRUCTURES
  const structureKeywords: Array<{ kw: string; name: string; icon: string; def: number; dur: number }> = [
    { kw: 'hafen', name: 'Hafenbecken & Anlegekais', icon: '⚓', def: 20, dur: 150 },
    { kw: 'werft', name: 'Schiffswerft & Trockendock', icon: '🏗️', def: 25, dur: 120 },
    { kw: 'zoll', name: 'Zollstation & Hafenkontor', icon: '🏪', def: 15, dur: 80 },
    { kw: 'lager', name: 'Großes Lagerhaus', icon: '📦', def: 15, dur: 90 },
    { kw: 'wachturm', name: 'Massiver Wachturm', icon: '🗼', def: 35, dur: 120 },
    { kw: 'turm', name: 'Verteidigungsturm', icon: '🗼', def: 30, dur: 100 },
    { kw: 'festung', name: 'Festungsanlage & Zinnen', icon: '🏯', def: 60, dur: 250 },
    { kw: 'burg', name: 'Wehrhafte Burgmauer', icon: '🏰', def: 50, dur: 200 },
    { kw: 'torhaus', name: 'Befestigtes Torhaus', icon: '🏯', def: 45, dur: 180 },
    { kw: 'kaserne', name: 'Militärkaserne', icon: '🏠', def: 25, dur: 110 },
    { kw: 'schenke', name: 'Hafenschenke / Taverne', icon: '🍺', def: 10, dur: 60 },
    { kw: 'leuchtturm', name: 'Signal-Leuchtturm', icon: '🗼', def: 20, dur: 100 },
    { kw: 'mauer', name: 'Befestigte Kaimauer', icon: '🧱', def: 30, dur: 150 },
    { kw: 'tempel', name: 'Orts-Tempel', icon: '⛪', def: 20, dur: 100 }
  ];

  const addedStructureKws = new Set<string>();

  structureKeywords.forEach(({ kw, name, icon, def, dur }) => {
    if (textLower.includes(kw) && !addedStructureKws.has(kw)) {
      addedStructureKws.add(kw);
      tokens.push({
        id: `loc-struct-${title}-${kw}`,
        name: `${name} (${title})`,
        icon,
        category: 'Marker & Orte',
        group: 'structures',
        description: `Bauwerk / Infrastruktur in ${title}.`,
        defense: def,
        durability: dur,
        sourceText: `Kodex-Begriff: "${kw}"`
      });
    }
  });

  // --- DYNAMIC LORE FIELD EXTRACTION ---

  // A. HERRSCHER & REGIERUNG
  if (ruler) {
    tokens.push({
      id: `loc-ruler-${title}-${ruler.replace(/\s+/g, '-').toLowerCase()}`,
      name: `Sitz des Herrschers (${ruler})`,
      icon: '🏰',
      category: 'Marker & Orte',
      group: 'structures',
      description: `Wohn- und Regierungssitz von ${ruler}. Ein herrschaftliches Gebäude, das Macht und Pracht ausstrahlt.`,
      defense: 40,
      durability: 180,
      sourceText: `Herrscher: "${ruler}"`
    });
  } else if (government && (government.toLowerCase().includes('monarch') || government.toLowerCase().includes('könig') || government.toLowerCase().includes('adel') || government.toLowerCase().includes('herzog'))) {
    tokens.push({
      id: `loc-government-palace-${title}`,
      name: `Herrenhaus / Adelsresidenz (${title})`,
      icon: '🏰',
      category: 'Marker & Orte',
      group: 'structures',
      description: `Regierungssitz und Residenz der lokalen Herrschaftskaste. Regierungsform: ${government}.`,
      defense: 35,
      durability: 160,
      sourceText: `Regierungsform: "${government}"`
    });
  } else if (government) {
    tokens.push({
      id: `loc-government-townhall-${title}`,
      name: `Rathaus & Kanzlei (${title})`,
      icon: '🏛️',
      category: 'Marker & Orte',
      group: 'structures',
      description: `Das administrative Zentrum von ${title}. Regierungsform: ${government}.`,
      defense: 25,
      durability: 120,
      sourceText: `Regierungsform: "${government}"`
    });
  }

  // B. KULTUR & SCHMIEDE (Schmiedekultur, Handwerk, etc.)
  const hasSmithKeywords = [textLower, culture.toLowerCase(), resources.toLowerCase(), exportsStr.toLowerCase()].some(text => 
    text.includes('schmied') || text.includes('eisen') || text.includes('metall') || text.includes('stahl') || text.includes('erz') || text.includes('bronze') || text.includes('waffen')
  );

  if (hasSmithKeywords || inferredPopVal >= 1000) {
    const isLarge = inferredPopVal >= 2500 || culture.toLowerCase().includes('schmiedekultur');
    tokens.push({
      id: `loc-blacksmith-${title}`,
      name: isLarge ? `Große Waffenschmiede & Eisenwerk` : `Dorfschmiede & Handwerk`,
      icon: '🔨',
      category: 'Marker & Orte',
      group: 'structures',
      description: isLarge 
        ? `Eine mächtige Schmiede mit glühenden Hochöfen für schwere Rüstungen und meisterhafte Waffen.` 
        : `Die örtliche Schmiede für Hufeisen, Werkzeuge und einfache Klingen.`,
      defense: 20,
      durability: isLarge ? 120 : 80,
      sourceText: culture ? `Kultur: "${culture}"` : `Einwohnerzahl: ${inferredPopVal}`
    });
  }

  // C. EXPORTE, IMPORTE & HANDEL (Marktplatz, Läden, Karawanserei)
  const hasTrade = exportsStr || importsStr || trade || inferredPopVal >= 500;
  if (hasTrade) {
    // 1. Central Marketplace
    tokens.push({
      id: `loc-market-${title}`,
      name: `Zentraler Marktplatz & Handelsstände`,
      icon: '⚖️',
      category: 'Marker & Orte',
      group: 'structures',
      description: `Ein geschäftiger Platz gesäumt von Verkaufsständen für feilschende Bürger und auswärtige Reisende.`,
      defense: 10,
      durability: 60,
      sourceText: trade ? `Handel: "${trade}"` : `Marktplatz für Bürger`
    });

    // 2. Export / Import Depot
    if (exportsStr || importsStr) {
      tokens.push({
        id: `loc-trade-office-${title}`,
        name: `Handelskontor & Exporthalle`,
        icon: '🏪',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Das Kontor überwacht Importe und Exporte. Exportiert wird: ${exportsStr || 'nichts'}. Importiert wird: ${importsStr || 'nichts'}.`,
        defense: 20,
        durability: 100,
        sourceText: `Export: "${exportsStr}" / Import: "${importsStr}"`
      });
    }

    // 3. Traveling merchant caravansary / tavern
    tokens.push({
      id: `loc-caravansary-${title}`,
      name: `Herberge & Händler-Ausspann`,
      icon: '🎪',
      category: 'Marker & Orte',
      group: 'structures',
      description: `Rastplatz für wandernde Händler, Karawanen und Packtiere. Ideal zum Tauschen exotischer Waren.`,
      defense: 12,
      durability: 80,
      sourceText: `Handelsverkehr`
    });

    // 4. Dedicated stores based on commodities
    const goodsLower = `${exportsStr} ${importsStr} ${resources}`.toLowerCase();
    if (goodsLower.includes('fisch') || goodsLower.includes('krabbe') || goodsLower.includes('muschel')) {
      tokens.push({
        id: `loc-store-fish-${title}`,
        name: `Fischmarkt & Trockenhalle`,
        icon: '🐟',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Marktplatz für frischen Fang und getrockneten Fisch der Fischergilde.`,
        defense: 10,
        durability: 50,
        sourceText: `Ressourcen: Fisch`
      });
    }
    if (goodsLower.includes('getreide') || goodsLower.includes('reis') || goodsLower.includes('weizen') || goodsLower.includes('mehl') || goodsLower.includes('korn')) {
      tokens.push({
        id: `loc-store-grain-${title}`,
        name: `Kornspeicher & Mühle`,
        icon: '🌾',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Zentrales Getreidelager für die Ernährung der Bevölkerung und Mehlproduktion.`,
        defense: 15,
        durability: 90,
        sourceText: `Nahrungshandel`
      });
    }
    if (goodsLower.includes('holz') || goodsLower.includes('borke') || goodsLower.includes('stamm') || goodsLower.includes('timber')) {
      tokens.push({
        id: `loc-store-wood-${title}`,
        name: `Sägewerk & Holzstapel`,
        icon: '🪵',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Umschlagplatz für geschlagenes Holz, Balken und Bauholz für den Schiffbau oder Häuserbau.`,
        defense: 12,
        durability: 70,
        sourceText: `Exporte: Holz`
      });
    }
    if (goodsLower.includes('gewürz') || goodsLower.includes('tee') || goodsLower.includes('tabak') || goodsLower.includes('kräuter')) {
      tokens.push({
        id: `loc-store-spice-${title}`,
        name: `Gewürz- & Teekontor`,
        icon: '🏺',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Duftendes Handelslager für seltene Gewürze, feine Teeblätter und Heilkräuter.`,
        defense: 15,
        durability: 80,
        sourceText: `Exotische Güter`
      });
    }
    if (goodsLower.includes('erz') || goodsLower.includes('gold') || goodsLower.includes('silber') || goodsLower.includes('edelstein') || goodsLower.includes('kristall')) {
      tokens.push({
        id: `loc-store-gems-${title}`,
        name: `Edelstein- & Schatzkammer`,
        icon: '💎',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Gesicherter Verwahrort für wertvolle Erze, Rohdiamanten, edle Metalle und Kristalle.`,
        defense: 30,
        durability: 110,
        sourceText: `Luxusgüter`
      });
    }
  }

  // D. WAHRZEICHEN, SEHENSWÜRDIGKEITEN, DUNGEONS & BESONDERHEITEN (Custom Parser)
  const extractCustomSpecialTokens = (text: string, defaultGroup: 'structures' | 'places', labelSource: string) => {
    if (!text || text.trim() === '') return [];
    // Split by comma, semicolon, newline, or bullet points, and " und "
    const parts = text.split(/[;,|\n\r]+|(?:\s+und\s+)/i)
      .map(p => p.replace(/^[-*•\s]+/, '').trim())
      .filter(p => p.length > 3 && p.length < 100);
    
    return parts.map((part, idx) => {
      const partLower = part.toLowerCase();
      let icon = '🌟';
      let defense = 20;
      let durability = 100;
      let description = `Einzigartiges Wahrzeichen / Sehenswürdigkeit in ${title}.`;

      if (partLower.includes('bad') || partLower.includes('quelle') || partLower.includes('therme') || partLower.includes('wasser') || partLower.includes('spring') || partLower.includes('badestelle')) {
        icon = '♨️';
        description = `Heiße Thermalquellen oder Geothermale Bäder zum Entspannen in ${title}.`;
      } else if (partLower.includes('statue') || partLower.includes('monument') || partLower.includes('denkmal') || partLower.includes('bildnis')) {
        icon = '🗿';
        description = `Erhabenes Monument oder Statue in ${title}.`;
        durability = 150;
      } else if (partLower.includes('turm') || partLower.includes('leuchtturm') || partLower.includes('obelisk') || partLower.includes('pagode')) {
        icon = '🗼';
        description = `Ein markanter Turm in ${title}, weithin sichtbar.`;
        defense = 35;
        durability = 120;
      } else if (partLower.includes('baum') || partLower.includes('hain') || partLower.includes('wald') || partLower.includes('eiche') || partLower.includes('garten') || partLower.includes('park')) {
        icon = '🌳';
        description = `Ein prachtvoller uralter Baum, schattiger Hain oder heiliger Garten.`;
      } else if (partLower.includes('stein') || partLower.includes('fels') || partLower.includes('monolith') || partLower.includes('kristall') || partLower.includes('steinkreis')) {
        icon = '🪨';
        description = `Ein mystischer Felsen, riesiger Monolith oder leuchtender Kristall.`;
        durability = 200;
      } else if (partLower.includes('tempel') || partLower.includes('kirche') || partLower.includes('schrein') || partLower.includes('kapelle') || partLower.includes('kloster') || partLower.includes('altar')) {
        icon = '⛩️';
        description = `Ein heiliger Tempel oder Schrein zur andächtigen Einkehr.`;
        defense = 25;
        durability = 120;
      } else if (partLower.includes('burg') || partLower.includes('schloss') || partLower.includes('festung') || partLower.includes('palast') || partLower.includes('zitadelle')) {
        icon = '🏰';
        description = `Prächtiges Hauptgebäude, Festungswerk oder Residenz.`;
        defense = 50;
        durability = 200;
      } else if (partLower.includes('höhle') || partLower.includes('dungeon') || partLower.includes('gruft') || partLower.includes('grab') || partLower.includes('katakomben')) {
        icon = '🕳️';
        description = `Dunkle Gänge, unterirdische Gewölbe oder Grabstätten.`;
      }

      return {
        id: `loc-custom-${part.replace(/\s+/g, '-').toLowerCase()}-${idx}`,
        name: part,
        icon,
        category: 'Marker & Orte',
        group: defaultGroup,
        description,
        defense,
        durability,
        sourceText: `${labelSource}: "${part}"`
      };
    });
  };

  const customPOI = extractCustomSpecialTokens(pointsOfInterest, 'structures', 'Sehenswürdigkeit');
  const customLandmarks = extractCustomSpecialTokens(landmarks, 'structures', 'Wahrzeichen');
  const customDungeons = extractCustomSpecialTokens(dungeons, 'places', 'Dungeon');
  const customMagicPlaces = extractCustomSpecialTokens(magicPlaces, 'structures', 'Magischer Ort');
  const customNaturalWonders = extractCustomSpecialTokens(naturalWonders, 'places', 'Naturwunder');

  tokens.push(...customPOI, ...customLandmarks, ...customDungeons, ...customMagicPlaces, ...customNaturalWonders);

  // E. GEOTHERMALE WÄRME (Heiße Quellen / Heilbäder)
  const hasGeothermal = [textLower, climate.toLowerCase(), resources.toLowerCase(), desc.toLowerCase()].some(text =>
    text.includes('geothermal') || text.includes('heiß') || text.includes('thermal') || text.includes('vulkan') || text.includes('quelle') || text.includes('badehaus') || text.includes('erdwärme')
  );
  const alreadyHasBaths = tokens.some(t => t.icon === '♨️' || t.name.toLowerCase().includes('bad') || t.name.toLowerCase().includes('quelle'));

  if (hasGeothermal && !alreadyHasBaths) {
    tokens.push({
      id: `loc-geothermal-baths-${title}`,
      name: `Heiße Quellen & Thermalbad`,
      icon: '♨️',
      category: 'Marker & Orte',
      group: 'structures',
      description: `Natürliche, dampfende Warmwasserbecken, die durch die geothermale Aktivität des Bodens erhitzt werden.`,
      defense: 10,
      durability: 80,
      sourceText: `Geothermale Aktivität`
    });
  }

  // F. MILITÄR & RECHTSORDNUNG (Watch buildings, guard house, barracks)
  const isMilitaryPresence = militaryStr || defenseStr || textLower.includes('wache') || textLower.includes('garnison') || textLower.includes('truppe');
  if (isMilitaryPresence) {
    tokens.push({
      id: `loc-guardhouse-${title}`,
      name: `Lokale Hauptwache & Arrestzellen`,
      icon: '🛡️',
      category: 'Marker & Orte',
      group: 'structures',
      description: `Wachstation und Verwaltungszentrum der lokalen Sicherheitskräfte. Beinhaltet Waffenständer und Arrestzellen.`,
      defense: 35,
      durability: 140,
      sourceText: militaryStr ? `Militär: "${militaryStr}"` : `Sicherheitspräsenz`
    });

    if (defenseStr && (defenseStr.toLowerCase().includes('mauer') || defenseStr.toLowerCase().includes('wehr') || defenseStr.toLowerCase().includes('graben') || defenseStr.toLowerCase().includes('wall'))) {
      tokens.push({
        id: `loc-armory-${title}`,
        name: `Rüstungskammer & Wehrgang`,
        icon: '🏹',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Gesicherte Waffenkammer für Bögen, Schilde, Pfeile und Belagerungsgerät für die Verteidigung.`,
        defense: 40,
        durability: 120,
        sourceText: `Verteidigung: "${defenseStr}"`
      });
    }
  }

  // G. MEDIZIN & HEILUNG (Heiler, Ärzte, Krankenhäuser, Apotheken, Kräuterkundige)
  const hasMedicalKeywords = [textLower, culture.toLowerCase(), resources.toLowerCase()].some(text =>
    text.includes('arzt') || text.includes('ärzte') || text.includes('heiler') || text.includes('heilung') || 
    text.includes('hospital') || text.includes('krankenhaus') || text.includes('apotheke') || 
    text.includes('kräuter') || text.includes('alchemist') || text.includes('quacksalber') || 
    text.includes('lazarett') || text.includes('sanatorium') || text.includes('therme') || 
    text.includes('quelle') || text.includes('bad') || text.includes('medizin') || text.includes('doctor')
  );

  // We determine healing options based on inferredPopVal
  if (inferredPopVal > 0 || hasMedicalKeywords) {
    if (inferredPopVal >= 5000) {
      // 1. Grand City Hospital / Sanatorium
      tokens.push({
        id: `loc-heal-hospital-${title}`,
        name: `Mächtiges Stadt-Hospital & Sanatorium`,
        icon: '🏥',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Ein imposanter Krankenhaushauskomplex mit Isolationsflügel für Seuchen, Operationssälen der Chirurgen und einem Flügel für magische Heilung.`,
        defense: 25,
        durability: 180,
        sourceText: `Einwohner: ${inferredPopVal} (Großstadt-Medizin)`
      });

      // 2. High Alchemist & Apothecary Hall
      tokens.push({
        id: `loc-heal-apothecary-${title}`,
        name: `Zentral-Apotheke & Alchemistische Gilde`,
        icon: '🧪',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Prunkvolles Hauptquartier der staatlich lizenzierten Apotheker. Hier werden starke Elixiere, Gegengifte und seltener Heilsaft destilliert.`,
        defense: 20,
        durability: 100,
        sourceText: `Zunftwesen`
      });

      // 3. Garrison Infirmary
      tokens.push({
        id: `loc-heal-garrison-lazarett-${title}`,
        name: `Garnisons-Lazarett der Garde`,
        icon: '⛺',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Militärische Krankenstation zur schnellen Versorgung verletzter Wachtruppen, Gardisten und Abenteurer. Beinhaltet Feldbetten und OP-Tische.`,
        defense: 30,
        durability: 110,
        sourceText: `Militärmedizin`
      });

      // 4. Team of Doctors & Clerics (NPC/Unit)
      tokens.push({
        id: `loc-heal-physicus-${title}`,
        name: `Erster Stadtphysikus & Heiler-Klerus`,
        icon: '🧑‍⚕️',
        category: 'Marker & Orte',
        group: 'garrison',
        description: `Ein Team aus studierten Ärzten und geweihten Heilerpriestern, die Verletzte versorgen und Epidemien eindämmen.`,
        defense: 15,
        durability: 60,
        sourceText: `Ärzteschaft`
      });

    } else if (inferredPopVal >= 2000) {
      // 1. Bürger-Hospital & Hospiz
      tokens.push({
        id: `loc-heal-hospital-${title}`,
        name: `Bürger-Hospital & Heilanstalt`,
        icon: '🏥',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Ein von Stiftungen und Bürgern finanziertes Hospital zur Pflege von Kranken und verletzten Seeleuten oder Handwerkern.`,
        defense: 20,
        durability: 130,
        sourceText: `Einwohner: ${inferredPopVal} (Städtische Heilanstalt)`
      });

      // 2. Apotheke / Kräuterhaus
      tokens.push({
        id: `loc-heal-apothecary-${title}`,
        name: `Stadt-Apotheke & Kräuterey`,
        icon: '🧪',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Die örtliche Apotheke, gefüllt mit Schubladen voller getrockneter Blätter, Wurzeln, Mörsern und Alchemiefläschchen.`,
        defense: 15,
        durability: 90,
        sourceText: `Apotheker`
      });

      // 3. Stadtarzt / Feldscher (NPC/Unit)
      tokens.push({
        id: `loc-heal-physicus-${title}`,
        name: `Meister-Wundarzt & Feldscher`,
        icon: '🧑‍⚕️',
        category: 'Marker & Orte',
        group: 'garrison',
        description: `Ein erfahrener Chirurg und Wundarzt, der Wunden näht, Pfeilspitzen entfernt und Tränke verabreicht.`,
        defense: 15,
        durability: 50,
        sourceText: `Wundarzt`
      });

    } else if (inferredPopVal >= 500) {
      // 1. Apothecary & Doctor's clinic
      tokens.push({
        id: `loc-heal-clinic-${title}`,
        name: `Praxis des Wundarztes & Apotheke`,
        icon: '🩺',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Das Haus des lokalen Mediziners, kombiniert mit einer kleinen Apotheken-Theke für Tees und Elixiere.`,
        defense: 12,
        durability: 80,
        sourceText: `Einwohner: ${inferredPopVal} (Medizinische Grundversorgung)`
      });

      // 2. Herbalist Garden
      tokens.push({
        id: `loc-heal-garden-${title}`,
        name: `Kräutergarten & Trockenschuppen`,
        icon: '🌿',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Ein bewirtschaftetes Feld voller Heilkräuter mit einem Holzschuppen, in dem Kräuterbündel zum Trocknen aufgehängt werden.`,
        defense: 10,
        durability: 60,
        sourceText: `Heilkräuteranbau`
      });

      // 3. Medicus / Hebamme (NPC/Unit)
      tokens.push({
        id: `loc-heal-physicus-${title}`,
        name: `Dorf-Medicus & Kräuterkundige`,
        icon: '🧑‍⚕️',
        category: 'Marker & Orte',
        group: 'garrison',
        description: `Zwei angesehene Heiler des Ortes, die über Generationen überliefertes Kräuterwissen besitzen.`,
        defense: 10,
        durability: 40,
        sourceText: `Dorfmedizin`
      });

    } else {
      // Small village, fallback, or just keywords
      // 1. Herbalist hut
      tokens.push({
        id: `loc-heal-hut-${title}`,
        name: `Hütte der Kräuterheilerin`,
        icon: '🏡',
        category: 'Marker & Orte',
        group: 'structures',
        description: `Am Waldrand gelegen braut hier eine weise Hexe oder kräuterkundige Heilerin ihre heilsamen Salben und Tränke.`,
        defense: 8,
        durability: 50,
        sourceText: `Kräuterheilerin`
      });

      // 2. Village healer (NPC/Unit)
      tokens.push({
        id: `loc-heal-healer-${title}`,
        name: `Kräuterheilerin (Dorfheiler)`,
        icon: '🧑‍⚕️',
        category: 'Marker & Orte',
        group: 'garrison',
        description: `Die gute Seele des Ortes, die Fieber senkt, Wunden mit Moos verbindet und Tee kocht.`,
        defense: 8,
        durability: 35,
        sourceText: `Dorfheilerin`
      });
    }
  }

  // 4. CONNECTED CODEX CHARACTERS / NPCS
  const titleLower = title.toLowerCase();
  (loreDatabase || []).forEach(e => {
    if (e.category === 'Charaktere' || e.category === 'Gegner' || (e.category as any) === 'NPCs') {
      const charLoc = (e.details?.location || '').toLowerCase();
      const charSit = (e.details?.currentSituation || '').toLowerCase();
      const charDesc = (e.description || '').toLowerCase();
      
      if (charLoc.includes(titleLower) || charSit.includes(titleLower) || charDesc.includes(titleLower)) {
        tokens.push({
          id: `loc-char-${e.id}`,
          name: e.title,
          icon: e.category === 'Gegner' ? '🔴' : '🟢',
          category: e.category === 'Gegner' ? 'Gegner & Monster' : 'Charaktere & NPCs',
          group: 'characters',
          description: e.description || `Anwesend in ${title}.`,
          loreEntryId: e.id,
          sourceText: `Mitglied / Bewohner: ${e.title}`
        });
      }
    }
  });

  // 5. CONNECTED SUB-PLACES / SUB-LOCATIONS
  (loreDatabase || []).forEach(e => {
    if (((e.category as string) === 'Orte' || (e.category as string) === 'Weltkarte') && e.id !== locationEntry.id) {
      const parent = (e.details?.parentPlaceId || e.details?.parentTerritoryId || e.details?.parent || '').toLowerCase();
      if (parent && (parent === titleLower || parent === locationEntry.id.toLowerCase())) {
        tokens.push({
          id: `loc-subplace-${e.id}`,
          name: e.title,
          icon: '📍',
          category: 'Marker & Orte',
          group: 'places',
          description: e.description || `Teilort von ${title}.`,
          loreEntryId: e.id,
          sourceText: `Zugehöriger Teilort`
        });
      }
    }
  });

  return tokens;
};

const getDefaultStatsForToken = (name: string, category: string): { population?: number; minCrew?: number; maxCapacity?: number; shipSize?: 'klein' | 'mittel' | 'groß'; defense?: number; attack?: number; durability?: number } => {
  const cat = (category || '').toLowerCase();
  const nm = (name || '').toLowerCase();

  if (cat.includes('schiff') || cat.includes('fahrzeug') || nm.includes('schiff') || nm.includes('boot') || nm.includes('galeone') || nm.includes('fregatte') || nm.includes('kanu') || nm.includes('barke') || nm.includes('kutsche') || nm.includes('karren') || nm.includes('luftschiff') || nm.includes('u-boot') || nm.includes('floß') || nm.includes('floss')) {
    const s = getShipStatsForSize(name, 'mittel');
    return {
      population: s.population,
      minCrew: s.minCrew,
      maxCapacity: s.maxCapacity,
      shipSize: 'mittel',
      defense: s.defense,
      attack: s.attack,
      durability: s.durability
    };
  }

  const isStructureOrLocation = 
    cat.includes('gebäude') || 
    cat.includes('siedlung') || 
    cat.includes('orte') || 
    cat.includes('konstruktion') || 
    cat.includes('place') || 
    cat.includes('construction') || 
    cat.includes('building') ||
    cat.includes('marker') ||
    cat.includes('schiff') ||
    cat.includes('fahrzeug') ||
    cat.includes('gegenständ') ||
    cat.includes('struktur') ||
    nm.includes('burg') || 
    nm.includes('turm') || 
    nm.includes('haus') || 
    nm.includes('hütte') || 
    nm.includes('stadt') || 
    nm.includes('dorf') ||
    nm.includes('hotel') ||
    nm.includes('wirtshaus') ||
    nm.includes('herberge') ||
    nm.includes('gasth') ||
    nm.includes('schenke') ||
    nm.includes('spelunke') ||
    nm.includes('taverne') ||
    nm.includes('inn') ||
    nm.includes('laden') ||
    nm.includes('händler') ||
    nm.includes('markt') ||
    nm.includes('schmiede') ||
    nm.includes('bäckerei') ||
    nm.includes('mühle') ||
    nm.includes('werft') ||
    nm.includes('mine') ||
    nm.includes('bauernhof') ||
    nm.includes('manufaktur');

  if (isStructureOrLocation) {
    let pop = 0;
    let def = 0;

    // 1. Hotels & Gastgewerbe (Hotels, Inns, Taverns, Lodgings)
    if (nm.includes('grand hotel') || nm.includes('luxushotel') || nm.includes('palast-hotel')) {
      pop = 120;
      def = 20;
    } else if (nm.includes('hotel') || nm.includes('große herberge') || nm.includes('gasthof')) {
      pop = 60;
      def = 15;
    } else if (nm.includes('wirtshaus') || nm.includes('gasthaus') || nm.includes('taverne') || nm.includes('inn') || nm.includes('schlafhaus')) {
      pop = 35;
      def = 12;
    } else if (nm.includes('herberge') || nm.includes('pension')) {
      pop = 25;
      def = 10;
    } else if (nm.includes('schenke') || nm.includes('spelunke') || nm.includes('kneipe') || nm.includes('bar')) {
      pop = 20;
      def = 10;

    // 2. Händler, Geschäfte & Märkte (Trade, General Store, Weapons, Groceries, Alchemy, etc.)
    } else if (nm.includes('marktplatz') || nm.includes('basar') || nm.includes('handelsplatz')) {
      pop = 80;
      def = 12;
    } else if (nm.includes('marktstand') || nm.includes('verkaufsstand') || nm.includes('bude')) {
      pop = 2;
      def = 2;
    } else if (nm.includes('gemischtwaren') || nm.includes('krämer') || nm.includes('kramer') || nm.includes('allzweckladen') || nm.includes('general store') || nm.includes('geschäft') || (nm.includes('händler') && !nm.includes('schiff'))) {
      pop = 6;
      def = 10;
    } else if (nm.includes('waffenladen') || nm.includes('büchsenmacher') || nm.includes('rüstungsschmied') || nm.includes('waffenschmied')) {
      pop = 8;
      def = 25;
    } else if (nm.includes('bäckerei') || nm.includes('lebensmittel') || nm.includes('metzgerei') || nm.includes('fleischerei') || nm.includes('obsthändler') || nm.includes('proviant')) {
      pop = 5;
      def = 8;
    } else if (nm.includes('alchemist') || nm.includes('apotheke') || nm.includes('tränkebrauer') || nm.includes('kräuterladen')) {
      pop = 4;
      def = 15;
    } else if (nm.includes('schneiderei') || nm.includes('weberei') || nm.includes('schuster') || nm.includes('kleidung')) {
      pop = 6;
      def = 8;
    } else if (nm.includes('juwelier') || nm.includes('schmuckladen') || nm.includes('goldhändler')) {
      pop = 6;
      def = 30;
    } else if (nm.includes('bank') || nm.includes('kontor') || nm.includes('auktionshaus') || nm.includes('gildehaus') || nm.includes('gildenhalle')) {
      pop = 25;
      def = 35;
    } else if (nm.includes('laden') || nm.includes('shop')) {
      pop = 5;
      def = 10;

    // 3. Produktion, Gewerbe & Handwerk (Manufacturing, Farms, Mines, Mills)
    } else if (nm.includes('manufaktur') || nm.includes('fabrik') || nm.includes('werkstatt')) {
      pop = 30;
      def = 12;
    } else if (nm.includes('mühle') || nm.includes('windmühle') || nm.includes('wassermühle')) {
      pop = 8;
      def = 10;
    } else if (nm.includes('sägewerk') || nm.includes('holzfäller')) {
      pop = 15;
      def = 10;
    } else if (nm.includes('schmiede') || nm.includes('grobschmiede') || nm.includes('gießerei')) {
      pop = 10;
      def = 18;
    } else if (nm.includes('brauerei') || nm.includes('kelterei') || nm.includes('brennerei') || nm.includes('destille')) {
      pop = 20;
      def = 12;
    } else if (nm.includes('werft') || nm.includes('dock') || nm.includes('trockendock')) {
      pop = 45;
      def = 22;
    } else if (nm.includes('bergwerk') || nm.includes('mine') || nm.includes('stollen') || nm.includes('steinbruch')) {
      pop = 65;
      def = 18;
    } else if (nm.includes('plantage') || nm.includes('gutshof')) {
      pop = 50;
      def = 10;
    } else if (nm.includes('bauernhof') || nm.includes('hof') || nm.includes('gehöft') || nm.includes('landgut')) {
      pop = 12;
      def = 8;

    // 4. Militär & Verteidigung (Castles, Fortresses, Barracks, Towers)
    } else if (nm.includes('zitadelle') || nm.includes('festung') || nm.includes('kastell') || nm.includes('fort')) {
      pop = 250;
      def = 95;
    } else if (nm.includes('burg') || nm.includes('schloss') || nm.includes('palast')) {
      pop = 120;
      def = 85;
    } else if (nm.includes('kaserne') || nm.includes('garnison') || nm.includes('zeughaus') || nm.includes('arsenal')) {
      pop = 150;
      def = 70;
    } else if (nm.includes('turm') || nm.includes('wachturm') || nm.includes('wehrturm') || nm.includes('torhaus') || nm.includes('bastei')) {
      pop = 12;
      def = 55;
    } else if (nm.includes('pulverturm') || nm.includes('waffenkammer')) {
      pop = 8;
      def = 60;
    } else if (nm.includes('außenposten') || nm.includes('feldlager') || nm.includes('lager')) {
      pop = 35;
      def = 30;
    } else if (nm.includes('barrikade') || nm.includes('palisade') || nm.includes('mauer') || nm.includes('stadtmauer')) {
      pop = 0;
      def = 45;
    } else if (nm.includes('graben') || nm.includes('zugbrücke') || nm.includes('fallgatter') || nm.includes('gittertor')) {
      pop = 0;
      def = 30;

    // 5. Öffentliche & Religiöse Bauten (Temples, Hospitals, Town Halls)
    } else if (nm.includes('kathedrale') || nm.includes('münster')) {
      pop = 45;
      def = 35;
    } else if (nm.includes('tempel') || nm.includes('kloster') || nm.includes('abtei')) {
      pop = 25;
      def = 25;
    } else if (nm.includes('kapelle') || nm.includes('schrein')) {
      pop = 3;
      def = 10;
    } else if (nm.includes('rathaus') || nm.includes('gericht') || nm.includes('parlament')) {
      pop = 30;
      def = 30;
    } else if (nm.includes('krankenhaus') || nm.includes('lazarett') || nm.includes('siechenhaus')) {
      pop = 40;
      def = 10;
    } else if (nm.includes('akademie') || nm.includes('bibliothek') || nm.includes('magierturm')) {
      pop = 35;
      def = 25;

    // 6. Schiffe, Luftschiffe & Wasserfahrzeuge (Ships, Airships, Vessels & Land Vehicles)
    // 6a. Sehr große Kriegsschiffe, Linienschiffe, Flaggschiffe, Galeonen & Schlachtschiffe
    } else if (
      nm.includes('linienschiff') || nm.includes('schlachtschiff') || nm.includes('dreadnought') || 
      nm.includes('flaggschiff') || nm.includes('man-of-war') || nm.includes('dreimaster') || 
      (nm.includes('groß') && (nm.includes('galeone') || nm.includes('galleone') || nm.includes('fregatte') || nm.includes('kriegsschiff')))
    ) {
      pop = 180;
      def = 85;
    } else if (
      nm.includes('galeone') || nm.includes('galleone') || nm.includes('fregatte') || 
      nm.includes('kriegsschiff') || nm.includes('panzerschiff')
    ) {
      pop = 120;
      def = 75;
    // 6b. Große Segelschiffe, Frachter, Ozeandampfer & Große Luftschiffe
    } else if (
      (nm.includes('groß') && (nm.includes('schiff') || nm.includes('luftschiff') || nm.includes('transporter') || nm.includes('frachter') || nm.includes('dampfschiff'))) ||
      nm.includes('passagierschiff') || nm.includes('ozeandampfer') || nm.includes('kreuzfahrtschiff')
    ) {
      pop = 85;
      def = 55;
    // 6c. Piratenschiffe, Kaperschiffe, Korvetten, Langschiffe & Wikingerboote
    } else if (
      nm.includes('pirat') || nm.includes('kaperschiff') || nm.includes('korvette') || 
      nm.includes('langboot') || nm.includes('langschiff') || nm.includes('wikinger') || nm.includes('sloop')
    ) {
      pop = 50;
      def = 45;
    // 6d. Mittlere Handelsschiffe, Frachtschiffe, Dampfschiffe, Karavellen, Dschunken & Luftschiffe
    } else if (
      nm.includes('handelsschiff') || nm.includes('frachtschiff') || nm.includes('transporter') || 
      nm.includes('karavelle') || nm.includes('dschunke') || nm.includes('koga') || nm.includes('dampfschiff') ||
      nm.includes('luftschiff') || nm.includes('u-boot') || nm.includes('tauchboot') || 
      nm.includes('elfenbarke') || nm.includes('geisterschiff')
    ) {
      pop = 35;
      def = 30;
    // 6e. Mittlere & Allgemeine Segelschiffe / Schiffe ("Schiff", "Segelschiff", "Barke", "Yacht")
    } else if (nm.includes('schiff') || nm.includes('segler') || nm.includes('barke') || nm.includes('yacht')) {
      pop = 30;
      def = 25;
    // 6f. Kutter, Fischerboote, Patrouillenboote & Binnenboote
    } else if (nm.includes('kutter') || nm.includes('fischerboot') || nm.includes('patrouillenboot') || nm.includes('barkasse')) {
      pop = 8;
      def = 10;
    // 6g. Kleine Boote, Kanus, Ruderboote & Flöße
    } else if (
      nm.includes('ruderboot') || nm.includes('boot') || nm.includes('jolle') || 
      nm.includes('kanu') || nm.includes('kajak') || nm.includes('beiboot') || nm.includes('floss') || nm.includes('floß')
    ) {
      pop = 4;
      def = 5;
    // 6h. Landfahrzeuge, Kutschen & Karawanen
    } else if (nm.includes('karawane') || nm.includes('planwagen')) {
      pop = 16;
      def = 18;
    } else if (nm.includes('kutsche') || nm.includes('postkutsche') || nm.includes('streitwagen')) {
      pop = 6;
      def = 10;
    } else if (nm.includes('karren') || nm.includes('wagen') || nm.includes('schlitten')) {
      pop = 3;
      def = 5;

    // 7. Siedlungen & Großorte (Towns, Cities, Villages)
    } else if (nm.includes('metropole') || nm.includes('großstadt') || nm.includes('hauptstadt')) {
      pop = 5000;
      def = 85;
    } else if (nm.includes('hafenstadt') || nm.includes('handelsstadt') || nm.includes('stadt')) {
      pop = 1200;
      def = 55;
    } else if (nm.includes('dorf') || nm.includes('fischerdorf') || nm.includes('bergdorf')) {
      pop = 120;
      def = 18;
    } else if (nm.includes('weiler') || nm.includes('siedlung')) {
      pop = 35;
      def = 12;

    // 8. General house/building/place fallback
    } else if (nm.includes('hütte') || nm.includes('zelt') || nm.includes('blockhaus')) {
      pop = 4;
      def = 5;
    } else if (nm.includes('haus') || cat.includes('gebäude') || cat.includes('orte') || cat.includes('konstruktionen')) {
      pop = 8;
      def = 10;
    }

    if (pop > 0 || def > 0) {
      let atk = 0;
      let dur = def * 5;
      if (nm.includes('zitadelle') || nm.includes('festung') || nm.includes('kastell') || nm.includes('fort')) {
        atk = 60; dur = 1200;
      } else if (nm.includes('burg') || nm.includes('schloss')) {
        atk = 40; dur = 800;
      } else if (nm.includes('turm') || nm.includes('wachturm') || nm.includes('wehrturm') || nm.includes('bastei')) {
        atk = 25; dur = 400;
      } else if (nm.includes('kaserne') || nm.includes('garnison') || nm.includes('zeughaus')) {
        atk = 35; dur = 500;
      } else if (dur === 0) {
        dur = 100;
      }
      return { population: pop, defense: def, attack: atk, durability: dur };
    }
  }

  if (cat.includes('gegner') || cat.includes('monster') || nm.includes('ork') || nm.includes('drache') || nm.includes('goblin') || nm.includes('vampir') || nm.includes('skelett') || nm.includes('zombie')) {
    let atk = 12;
    let dur = 45;
    if (nm.includes('drache') || nm.includes('wyrm')) { atk = 85; dur = 450; }
    else if (nm.includes('troll') || nm.includes('golem')) { atk = 35; dur = 200; }
    else if (nm.includes('häuptling') || nm.includes('graf') || nm.includes('nekromant')) { atk = 28; dur = 120; }
    return { attack: atk, durability: dur, defense: 15 };
  }

  if (cat.includes('charakter') || cat.includes('npc') || cat.includes('spieler')) {
    return { attack: 8, durability: 30, defense: 10 };
  }

  return {};
};

const FACTION_COLORS = [
  { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-300', dotBg: '#2563eb', label: 'Blau' },
  { bg: 'bg-cyan-600', border: 'border-cyan-400', text: 'text-cyan-300', dotBg: '#0891b2', label: 'Zyan' },
  { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-300', dotBg: '#059669', label: 'Smaragd' },
  { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-300', dotBg: '#9333ea', label: 'Violett' },
  { bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-amber-300', dotBg: '#d97706', label: 'Bernstein' },
  { bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-indigo-300', dotBg: '#4f46e5', label: 'Indigo' },
  { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-rose-300', dotBg: '#e11d48', label: 'Rosa' },
  { bg: 'bg-teal-600', border: 'border-teal-400', text: 'text-teal-300', dotBg: '#0d9488', label: 'Türkis' },
];

const getCharacterFaction = (entry: LoreEntry): string | null => {
  if (entry.details?.faction) return entry.details.faction;
  if ((entry as any).faction) return (entry as any).faction;
  const match = entry.description?.match(/fraktion:\s*([^\n.,;]+)/i);
  if (match) return match[1].trim();
  return null;
};


// Helper to determine icon for LoreEntry if missing
const getIconForLoreEntry = (entry: LoreEntry): string => {
  const titleLower = (entry.title || '').toLowerCase();
  const catLower = (entry.category || '').toLowerCase();

  if (titleLower.includes('schiff') || titleLower.includes('sunny') || titleLower.includes('merry') || titleLower.includes('galleone') || titleLower.includes('boot')) return '⛵';
  if (titleLower.includes('pirat')) return '🏴‍☠️';
  if (titleLower.includes('marine') || titleLower.includes('soldat') || titleLower.includes('flotte')) return '⚓';
  if (titleLower.includes('schatz') || titleLower.includes('frucht') || titleLower.includes('kiste') || titleLower.includes('gold')) return '💎';
  if (titleLower.includes('schwert') || titleLower.includes('waffe')) return '⚔️';
  if (titleLower.includes('burg') || titleLower.includes('schloss') || titleLower.includes('turm') || titleLower.includes('festung')) return '🏰';
  if (titleLower.includes('haus') || titleLower.includes('dorf') || titleLower.includes('stadt') || titleLower.includes('bar')) return '🏠';
  if (titleLower.includes('insel') || titleLower.includes('strand') || titleLower.includes('küste')) return '🏝️';
  if (titleLower.includes('vulkan') || titleLower.includes('feuer')) return '🌋';
  if (titleLower.includes('drache') || titleLower.includes('monster') || titleLower.includes('bestie')) return '🐉';

  if (catLower.includes('charaktere') || catLower.includes('npc')) return '👤';
  if (catLower.includes('fraktionen') || catLower.includes('gruppen')) return '🛡️';
  if (catLower.includes('gegenstände') || catLower.includes('artefakte')) return '🎒';
  if (catLower.includes('orte') || catLower.includes('landschaften')) return '📍';

  return '📌';
};

// --- PRE-DEFINED STANDARD TOKENS ---
const DEFAULT_CHARACTERS = [
  { id: 'def-char-1', title: 'Menschlicher Krieger', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein kampferprobter menschlicher Soldat mit Schwert und Schild.' },
  { id: 'def-char-2', title: 'Elfen-Magierin', icon: '🟢', category: 'Charaktere & NPCs', description: 'Eine Beherrscherin arkaner Zauber und elementarer Mächte.' },
  { id: 'def-char-3', title: 'Zwergen-Priester', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein frommer Zwerg, der die Macht der Götter zur Heilung anruft.' },
  { id: 'def-char-4', title: 'Halblings-Schurke', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein flinker Taschendieb, Späher und Meister der Heimlichkeit.' },
  { id: 'def-char-5', title: 'Waldläufer / Scharfschütze', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein treffsicherer Schütze, der sich im Unterholz lautlos bewegt.' },
  { id: 'def-char-6', title: 'Paladin des Lichts', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein edler Streiter in schwerer Rüstung, geschützt von heiligem Segen.' },
  { id: 'def-char-7', title: 'Tiefling-Hexenmeister', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein finsterer Magier, der einen Pakt mit einer mächtigen Entität schloss.' },
  { id: 'def-char-8', title: 'Bardischer Geschichtenerzähler', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein reisender Musiker, der Lieder über alte Legenden singt.' },
  { id: 'def-char-9', title: 'Wirt & Schankmaid', icon: '🟢', category: 'Charaktere & NPCs', description: 'Betreiben die lokale Gaststätte und kennen alle Gerüchte.' },
  { id: 'def-char-10', title: 'Dorfältester', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein weiser Anführer mit historischem Wissen über diese Ländereien.' },
  { id: 'def-char-11', title: 'Fremder Reisender', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein geheimnisvoller Gast, der seine Absichten unter einer Kapuze verbirgt.' },
  { id: 'def-char-12', title: 'Königlicher Bote', icon: '🟢', category: 'Charaktere & NPCs', description: 'Trägt versiegelte Depeschen und reist auf direktem Befehl der Krone.' },
  { id: 'def-char-13', title: 'Schmiedemeister', icon: '🟢', category: 'Charaktere & NPCs', description: 'Schmiedet feinsten Stahl und repariert beschädigte Rüstungen.' },
  { id: 'def-char-14', title: 'Alchemist & Kräuterkundler', icon: '🟢', category: 'Charaktere & NPCs', description: 'Braut wirksame Elixiere und kennt die Kräfte jeder Heilpflanze.' },
  { id: 'def-char-15', title: 'Straßenräuber / Outlaw', icon: '🟢', category: 'Charaktere & NPCs', description: 'Lauert unachtsamen Reisenden an verlassenen Weggabelungen auf.' },
  { id: 'def-char-16', title: 'Gelehrter Archivar', icon: '🟢', category: 'Charaktere & NPCs', description: 'Verbringt seine Tage in staubigen Bibliotheken auf der Suche nach Wahrheit.' },
  { id: 'def-char-17', title: 'Hofnarr', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein Akrobat und Spötter, der hinter Witzen tiefe Wahrheiten verbirgt.' },
  { id: 'def-char-18', title: 'Fischer am Steg', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein ruhiger Geist, der die Gewässer besser kennt als jeder andere.' },
  { id: 'def-char-19', title: 'Fahrender Händler', icon: '🟢', category: 'Charaktere & NPCs', description: 'Bietet exotische Waren aus fernen Ländern auf seinem Karren an.' },
  { id: 'def-char-20', title: 'Söldnerführer', icon: '🟢', category: 'Charaktere & NPCs', description: 'Kämpft für den Meistbietenden und führt eine treue Truppe an.' },
  { id: 'def-char-21', title: 'Gefangener / Geisel', icon: '🟢', category: 'Charaktere & NPCs', description: 'In Ketten gelegt und wartet sehnsüchtig auf Rettung oder Urteil.' },
  { id: 'def-char-22', title: 'Hohepriester', icon: '🟢', category: 'Charaktere & NPCs', description: 'Der geistliche Führer des örtlichen Tempels mit mächtigen Segnungen.' },
  { id: 'def-char-23', title: 'Hafenarbeiter', icon: '🟢', category: 'Charaktere & NPCs', description: 'Ein kräftiger Arbeiter, der Kisten schleppt und Gerüchte aufschnappt.' }
];

const DEFAULT_FACTIONS = [
  {
    name: 'Stadtwache / Imperium',
    color: { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-300', dotBg: '#3b82f6' },
    members: [
      { id: 'def-fac-1-1', title: 'Stadtwache-Soldat', description: 'Ein einfacher Stadtwächter mit einer Hellebarde auf Patrouille.' },
      { id: 'def-fac-1-2', title: 'Wach-Scharfschütze', description: 'Sichert die Stadtmauern mit einer schweren Armbrust.' },
      { id: 'def-fac-1-3', title: 'Wachhauptmann', description: 'Der erfahrene und pflichtbewusste Anführer der Stadtwache.' },
      { id: 'def-fac-1-4', title: 'Königlicher Inquisitor', description: 'Sucht im Namen des Königs nach Verrat und Ketzerei.' }
    ]
  },
  {
    name: 'Diebesgilde / Schattennetz',
    color: { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-300', dotBg: '#a855f7' },
    members: [
      { id: 'def-fac-2-1', title: 'Taschendieb-Lehrling', description: 'Ein flinker Beutelschneider auf den Straßen.' },
      { id: 'def-fac-2-2', title: 'Meuchelmörder', description: 'Ein tödlicher Assassine, der im Schatten lauert.' },
      { id: 'def-fac-2-3', title: 'Hehler & Informant', description: 'Verkauft gestohlene Waren und wertvolle Informationen.' },
      { id: 'def-fac-2-4', title: 'Gildenmeister', description: 'Der listige Kopf hinter allen kriminellen Aktivitäten der Stadt.' }
    ]
  },
  {
    name: 'Ritterorden der Silberhand',
    color: { bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-amber-300', dotBg: '#d97706' },
    members: [
      { id: 'def-fac-3-1', title: 'Knappe des Ordens', description: 'Ein junger Krieger in Ausbildung, der seinem Ritter dient.' },
      { id: 'def-fac-3-2', title: 'Ordensritter', description: 'Ein disziplinierter Kämpfer des Ordens in prunkvoller Rüstung.' },
      { id: 'def-fac-3-3', title: 'Silberhand-Kleriker', description: 'Unterstützt die Ritter mit heiligen Gebeten und Heilzaubern.' },
      { id: 'def-fac-3-4', title: 'Ordens-Großmeister', description: 'Der oberste, weise Befehlshaber des gesamten Ritterordens.' }
    ]
  },
  {
    name: 'Söldnerkompanie "Eisenschädel"',
    color: { bg: 'bg-orange-600', border: 'border-orange-400', text: 'text-orange-300', dotBg: '#ea580c' },
    members: [
      { id: 'def-fac-4-1', title: 'Söldner-Rekrut', description: 'Frisch angeworben, kämpft für Sold und Abenteuer.' },
      { id: 'def-fac-4-2', title: 'Schwerer Infanterist', description: 'Trägt eine schwere Axt und bricht feindliche Linien auf.' },
      { id: 'def-fac-4-3', title: 'Eisenschädel-Armbrustschütze', description: 'Bietet tödlichen Deckungsschuss für die Nahkämpfer.' },
      { id: 'def-fac-4-4', title: 'Veteranen-Hauptmann', description: 'Ein Veteran unzähliger Schlachten, der die Söldner anführt.' }
    ]
  },
  {
    name: 'Aschezirkel (Kultisten)',
    color: { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-rose-300', dotBg: '#e11d48' },
    members: [
      { id: 'def-fac-5-1', title: 'Kultisten-Initiant', description: 'Ein verblendeter Anhänger, der ein einfaches Ritualmesser führt.' },
      { id: 'def-fac-5-2', title: 'Asche-Ritualist', description: 'Führt dunkle Riten durch, um jenseitige Mächte zu rufen.' },
      { id: 'def-fac-5-3', title: 'Schattenbeschwörer', description: 'Erzeugt Portale und hüllt Schlachtfelder in Dunkelheit.' },
      { id: 'def-fac-5-4', title: 'Hohepriester des Zirkels', description: 'Ein mächtiger Hexer, der dem dunklen Gott opfert.' }
    ]
  },
  {
    name: 'Waldläufer & Druidenbündnis',
    color: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-300', dotBg: '#059669' },
    members: [
      { id: 'def-fac-6-1', title: 'Grüner Hüter (Druide)', description: 'Ein Hüter der Natur, der Pflanzen und Winde befehligt.' },
      { id: 'def-fac-6-2', title: 'Waldläufer-Späher', description: 'Lautloser Wächter der Grenzen im dichten Wald.' },
      { id: 'def-fac-6-3', title: 'Bestienbändiger', description: 'Kämpft Seite an Seite mit einem gezähmten Wolf.' },
      { id: 'def-fac-6-4', title: 'Erzdruide', description: 'Der weise Älteste des Bündnisses, eins mit der Erde.' }
    ]
  }
];

const DEFAULT_ENEMIES = [
  { id: 'def-enemy-1', title: 'Goblin-Späher', icon: '👿', description: 'Ein flinker und hinterhältiger kleiner Goblin mit einem Kurzbogen.' },
  { id: 'def-enemy-2', title: 'Goblin-Schamane', icon: '🧙', description: 'Wirkt instabile Naturzauber und stärkt andere Goblins.' },
  { id: 'def-enemy-3', title: 'Ork-Krieger', icon: '👹', description: 'Ein ungestümer, wilder Ork mit einer schweren Streitaxt.' },
  { id: 'def-enemy-4', title: 'Ork-Häuptling', icon: '🐗', description: 'Ein massiver Anführer, der seine Horde durch Furcht kontrolliert.' },
  { id: 'def-enemy-5', title: 'Skelett-Krieger', icon: '💀', description: 'Ein untoter Soldat mit verrostetem Schwert, der keinen Schmerz kennt.' },
  { id: 'def-enemy-6', title: 'Zombie / Untoter', icon: '🧟', description: 'Ein langsamer, aber zäher schlurfender Leichnam.' },
  { id: 'def-enemy-7', title: 'Geist / Gruftschrecken', icon: '👻', description: 'Eine immaterielle Erscheinung, die Lebenskraft entzieht.' },
  { id: 'def-enemy-8', title: 'Dunkler Nekromant', icon: '🧙‍♂️', description: 'Ein finsterer Magier, der die Toten aus ihren Gräbern erhebt.' },
  { id: 'def-enemy-9', title: 'Riesenspinne', icon: '🕷️', description: 'Eine haushohe giftige Spinne, die Beute in klebrigen Netzen fängt.' },
  { id: 'def-enemy-10', title: 'Schwerer Troll', icon: '🧌', description: 'Ein gewaltiger Riese, dessen Wunden sich rasend schnell regenerieren.' },
  { id: 'def-enemy-11', title: 'Feuerdrache', icon: '🐉', description: 'Ein legendäres, schuppiges Monster, das alles zu Asche verbrennt.' },
  { id: 'def-enemy-12', title: 'Frost-Wyrm', icon: '❄️', description: 'Ein uralter Drache des ewigen Eises mit eisigem Atem.' },
  { id: 'def-enemy-13', title: 'Giftiger Schleim', icon: '🧪', description: 'Eine geleeartige, ätzende Masse, die sich teilt, wenn sie angegriffen wird.' },
  { id: 'def-enemy-14', title: 'Stein-Golem', icon: '🪨', description: 'Ein magisch belebter Wächter aus massivem Felsstein.' },
  { id: 'def-enemy-15', title: 'Räubergast / Bandit', icon: '⚔️', description: 'Ein gesetzloser Gesetzeshüter-Feind mit Dolch und leichter Rüstung.' },
  { id: 'def-enemy-16', title: 'Werwolf / Lykaner', icon: '🐺', description: 'Eine wilde Bestie, halb Mensch halb Wolf, getrieben von Blutdurst.' },
  { id: 'def-enemy-17', title: 'Vampir-Graf', icon: '🧛', description: 'Ein edler, aber blutsaugender Herrscher der Nacht mit hypnotischem Blick.' },
  { id: 'def-enemy-18', title: 'Höllenhund', icon: '🐕‍🦺', description: 'Ein zähnefletschendes Ungeheuer aus der Unterwelt mit glühenden Augen.' },
  { id: 'def-enemy-19', title: 'Sumpf-Kriecher', icon: '🐊', description: 'Ein getarntes Reptilienmonster, das im trüben Sumpfwasser lauert.' },
  { id: 'def-enemy-20', title: 'Mimic (Truhenmonster)', icon: '📦', description: 'Tarnte sich als Schatztruhe, wartet nur auf unvorsichtige Abenteurer.' },
  { id: 'def-enemy-21', title: 'Riesige Krake', icon: '🐙', description: 'Ein Meeresungeheuer, das Schiffe mit seinen Tentakeln in die Tiefe zieht.' }
];

const DEFAULT_SHIPS = [
  // --- Standard & Kriegsschiffe ---
  { id: 'def-ship-1', title: 'Klassisches Segelschiff', icon: '⛵', description: 'Mehrmastiges Segelschiff für Seereisen und Erkundung.' },
  { id: 'def-ship-2', title: 'Handelsschiff / Frachter', icon: '🚢', description: 'Klassisches Frachtschiff mit großem Laderaum für Handelsgüter.' },
  { id: 'def-ship-3', title: 'Kriegsschiff / Fregatte', icon: '🚢', description: 'Schwer bewaffnetes Patrouillen- und Kriegsschiff der Flotte.' },
  { id: 'def-ship-4', title: 'Piratenschiff / Kaperschiff', icon: '⛵', description: 'Wendiges, bewaffnetes Schiff für kühne Kapitäne und Entermannschaften.' },
  { id: 'def-ship-5', title: 'Galeone / Flaggschiff', icon: '🚢', description: 'Mächtiges, mehrdeckiges Kriegsschiff für Schatztransporte und Flottenführung.' },

  // --- Boote & Kleine Wasserfahrzeuge ---
  { id: 'def-ship-6', title: 'Fischerboot / Kutter', icon: '🚣', description: 'Robustes Boot für Küstengewässer und Fischfang.' },
  { id: 'def-ship-7', title: 'Ruderboot / Beiboot', icon: '🚣', description: 'Wendiges Beiboot zum Anlegen an Stränden oder Erkunden von Buchten.' },
  { id: 'def-ship-8', title: 'Kanu & Einbaum', icon: '🛶', description: 'Schmales, schnelles Boot für Flüsse und Moraste.' },
  { id: 'def-ship-9', title: 'Holzfloß / Flussfloß', icon: '🛶', description: 'Einfache Holzkonstruktion für Flussüberquerungen.' },

  // --- Magische & Exotische Schiffe ---
  { id: 'def-ship-10', title: 'Fliegendes Luftschiff', icon: '🚢', description: 'Magisch schwebendes Luftfahrzeug für Himmelsreisen.' },
  { id: 'def-ship-11', title: 'Geisterschiff / Untotes Wrack', icon: '⛵', description: 'Modriges, im Nebel treibendes Geisterschiff mit untoter Mannschaft.' },
  { id: 'def-ship-12', title: 'Unterwasser-Schiff / U-Boot', icon: '🛳️', description: 'Mechanisches Tauchboot aus Messing, Dampf und Zahnrädern.' },
  { id: 'def-ship-13', title: 'Magische Elfenbarke', icon: '⛵', description: 'Flüsterleises, magisch verstärktes Schiff aus schneeweißem Holz.' },
  { id: 'def-ship-14', title: 'Dampfschiff / Eisenschiff', icon: '⛴️', description: 'Schweres, dampfbetriebenes Schiff mit Metallbeplankung.' },

  // --- Landfahrzeuge & Karren ---
  { id: 'def-ship-15', title: 'Reise-Pferdekutsche (Land)', icon: '🐎', description: 'Gepolsterte Reisekutsche mit Kutscherbock.' },
  { id: 'def-ship-16', title: 'Planwagen & Karawane (Land)', icon: '🚛', description: 'Überdachter Frachtwagen für Handelsrouten.' },
  { id: 'def-ship-17', title: 'Handkarren & Ochsenkarren (Land)', icon: '🛒', description: 'Einfacher Arbeitswagen für Transportaufgaben.' },
  { id: 'def-ship-18', title: 'Kriegs-Streitwagen (Land)', icon: '🐎', description: 'Wendiger Kampfwagen für schnelle Sturmangriffe.' }
];

const DEFAULT_TREASURES = [
  { id: 'def-treasure-1', title: 'Eiserne Truhe (Verschlossen)', icon: '🔒', description: 'Eine schwere Truhe mit massiven Beschlägen. Benötigt einen Schlüssel.' },
  { id: 'def-treasure-2', title: 'Geöffnete Schatztruhe', icon: '🔓', description: 'Die Truhe steht offen und glänzt voller Gold und Juwelen.' },
  { id: 'def-treasure-3', title: 'Prall gefüllter Goldbeutel', icon: '💰', description: 'Ein lederner Sack gefüllt mit glänzenden Goldmünzen.' },
  { id: 'def-treasure-4', title: 'Fläschchen mit Heiltrank', icon: '🧪', description: 'Eine rote, magisch pulsierende Flüssigkeit zur Wundheilung.' },
  { id: 'def-treasure-5', title: 'Mana-Elixier', icon: '🧪', description: 'Ein Fläschchen mit blau leuchtender Essenz zur Manaregeneration.' },
  { id: 'def-treasure-6', title: 'Magisches Relikt / Artefakt', icon: '🔮', description: 'Ein antiker, runenbeschriebener Stein mit unbändiger Energie.' },
  { id: 'def-treasure-7', title: 'Runen-Schild', icon: '🛡️', description: 'Ein robuster Holz- und Metallschild, geschützt durch Schutzrunen.' },
  { id: 'def-treasure-8', title: 'Legendäres Breitschwert', icon: '⚔️', description: 'Eine meisterhaft geschmiedete Klinge, die im Dunkeln schwach blau leuchtet.' },
  { id: 'def-treasure-9', title: 'Alte Schatzkarte', icon: '📜', description: 'Ein vergilbtes Pergament mit Hinweisen auf vergrabene Reichtümer.' },
  { id: 'def-treasure-10', title: 'Seltene Juwelen & Kristalle', icon: '💎', description: 'Rohsteine von unschätzbarem Wert für Alchemie oder Reichtum.' },
  { id: 'def-treasure-11', title: 'Dietriche & Werkzeug', icon: '🗝️', description: 'Ermöglicht das lautlose Öffnen von Schlössern und Truhen.' },
  { id: 'def-treasure-12', title: 'Weinfass & Rationen', icon: '🍺', description: 'Stärkt die Moral und regeneriert Ausdauer nach einer langen Reise.' }
];

const DEFAULT_BUILDINGS = [
  // --- Wohnhäuser & Behausungen ---
  { id: 'def-bld-1', title: 'Waldhütte / Jagdhütte', icon: '🛖', description: 'Eine kleine, einfache Holzhütte tief im dichten Wald.' },
  { id: 'def-bld-2', title: 'Einfache Lehmhütte', icon: '🛖', description: 'Eine bescheidene Behausung mit getrocknetem Strohdach.' },
  { id: 'def-bld-3', title: 'Militär-Zelt', icon: '⛺', description: 'Ein großes, robustes Leinen-Zelt für Truppenlager.' },
  { id: 'def-bld-4', title: 'Schlichtes Blockhaus', icon: '🏠', description: 'Ein stabiles Holzhaus für ländliche Familien.' },
  { id: 'def-bld-5', title: 'Fachwerkhaus (Variante A)', icon: '🏠', description: 'Ein klassisches, zweistöckiges Stadt-Fachwerkhaus.' },
  { id: 'def-bld-6', title: 'Fachwerkhaus (Variante B)', icon: '🏡', description: 'Ein gepflegtes Wohnhaus mit kleinem Vorgarten.' },
  { id: 'def-bld-7', title: 'Bürgerhaus aus Stein', icon: '🏡', description: 'Ein massives, sicheres Wohnhaus der wohlhabenden Mittelschicht.' },
  { id: 'def-bld-8', title: 'Prachtvolles Herrenhaus', icon: '🏛️', description: 'Ein prunkvolles adliges Anwesen mit Säulen und breitem Portal.' },

  // --- Wirtshäuser & Herbergen ---
  { id: 'def-bld-9', title: 'Hafenspelunke / Kaschemme', icon: '🏚️', description: 'Ein verrauchtes, zwielichtiges Gasthaus am Hafenbecken.' },
  { id: 'def-bld-10', title: 'Wirtshaus "Zum Hufeisen"', icon: '🏠', description: 'Ein gut besuchtes, gemütliches Gasthaus mit Schankraum.' },
  { id: 'def-bld-11', title: 'Nobel-Herberge / Grand-Hotel', icon: '🏛️', description: 'Ein vornehm geschmücktes Gebäude für wohlhabende Reisende.' },

  // --- Handwerk & Produktion ---
  { id: 'def-bld-12', title: 'Dorfschmiede (Gebäude)', icon: '🏭', description: 'Eine rußgeschwärzte Werkstatt mit Schornstein und Amboss.' },
  { id: 'def-bld-13', title: 'Wassermühle (Gebäude)', icon: '🛖', description: 'Ein hölzernes Mühlengebäude direkt an einem Bachlauf.' },
  { id: 'def-bld-14', title: 'Hohe Windmühle', icon: '🛖', description: 'Eine steinerne Mühle mit großen, hölzernen Flügeln.' },
  { id: 'def-bld-15', title: 'Großes Lagerhaus', icon: '🏬', description: 'Ein weites Steingebäude zur sicheren Aufbewahrung von Waren.' },
  { id: 'def-bld-16', title: 'Gildehaus der Alchemisten', icon: '🏫', description: 'Ein Laborgebäude mit mehreren seltsam dampfenden Schornsteinen.' },

  // --- Militär & Befestigungen ---
  { id: 'def-bld-17', title: 'Holz-Wachturm', icon: '🗼', description: 'Ein hoher, hölzerner Aussichtspunkt für Grenzpatrouillen.' },
  { id: 'def-bld-18', title: 'Runder Stein-Wehrturm', icon: '🗼', description: 'Ein massiver Verteidigungsturm mit Zinnen und Schießscharten.' },
  { id: 'def-bld-19', title: 'Befestigtes Torhaus', icon: '🏯', description: 'Ein schweres Steintor mit Fallgitter zur Stadtverteidigung.' },
  { id: 'def-bld-20', title: 'Wehrhafte Ritterburg', icon: '🏰', description: 'Eine befestigte Burganlage mit dicken Außenmauern.' },
  { id: 'def-bld-21', title: 'Trutzige Festung', icon: '🏯', description: 'Ein uneinnehmbares militärisches Hauptquartier auf einem Hügel.' },

  // --- Sakrale & Magische Orte ---
  { id: 'def-bld-22', title: 'Kleine Kapelle', icon: '⛪', description: 'Ein stiller, friedlicher Andachtsort am Wegesrand.' },
  { id: 'def-bld-23', title: 'Großer Tempel des Lichts', icon: '⛪', description: 'Eine geweihte Kathedrale mit Buntglasfenstern.' },
  { id: 'def-bld-24', title: 'Hoher Magierturm', icon: '🗼', description: 'Ein mystischer, hoch aufragender Turm voller arkaner Energien.' },

  // --- Ruinen & Verfall ---
  { id: 'def-bld-25', title: 'Uralte Ruine', icon: '🏚️', description: 'Ein verfallenes Gemäuer, überwuchert von dichtem Efeu.' },
  { id: 'def-bld-26', title: 'Verlassenes Mausoleum', icon: '🏛️', description: 'Ein staubiges, steinernes Grabgebäude als Dungeon-Eingang.' }
];

const DEFAULT_HOSPITALITY = [
  { id: 'def-hsp-1', title: 'Grand Hotel & Resort', icon: '🏨', description: 'Ein prunkvolles Luxushotel für gehobene Gäste mit Suiten und Ballsaal.' },
  { id: 'def-hsp-2', title: 'Hotel "Königlicher Hof"', icon: '🏢', description: 'Ein vornehmes Stadt-Hotel für Reisende, Händler und Diplomaten.' },
  { id: 'def-hsp-3', title: 'Wirtshaus "Zum Tänzelnden Pony"', icon: '🍻', description: 'Ein uriges, dicht besuchtes Gasthaus mit kühlem Bier und warmer Suppe.' },
  { id: 'def-hsp-4', title: 'Gasthof "Zur Goldenen Gans"', icon: '🏠', description: 'Klassischer Landgasthof mit Schankraum und gemütlichen Gastzimmern.' },
  { id: 'def-hsp-5', title: 'Hafenspelunke / Kaschemme', icon: '🍺', description: 'Ein zwielichtiges Lokal am Kai für Seebären, Abenteurer und Piraten.' },
  { id: 'def-hsp-6', title: 'Pforten-Herberge & Schlafsaal', icon: '🛌', description: 'Günstige Herberge mit Betten für Pilger, Söldner und Durchreisende.' },
  { id: 'def-hsp-7', title: 'Poststation & Kutscher-Rast', icon: '🐴', description: 'Raststätte mit Pferdewechsel, warmem Ofen und Schlafplätzen.' },
  { id: 'def-hsp-8', title: 'Taverne & Weinkeller', icon: '🍷', description: 'Exquisite Schenke mit edlen Weinen und Musikeinlagen.' },
  { id: 'def-hsp-9', title: 'Schankgarten / Biergarten', icon: '🌳', description: 'Großer Außenbereich unter Lindenbäumen für Speisen und Feste.' },
  { id: 'def-hsp-10', title: 'Badehaus & Thermalquelle', icon: '♨️', description: 'Entspannende Bäder, Massagen und Ruhegemächer für müde Helden.' }
];

const DEFAULT_SHOPS = [
  { id: 'def-shp-1', title: 'Großer Marktplatz & Basar', icon: '🏪', description: 'Buntes Markttreiben mit Ständen für Lebensmittel, Stoffe und Gewürze.' },
  { id: 'def-shp-2', title: 'Gemischtwarenladen / Kramer', icon: '🛒', description: 'Verkauft Seile, Fackeln, Rationen, Werkzeug und Alltagsgüter.' },
  { id: 'def-shp-3', title: 'Waffen- & Rüstungshändler', icon: '⚔️', description: 'Schwerter, Schilde, Armbrüste und maßgefertigte Harnische.' },
  { id: 'def-shp-4', title: 'Bäckerei & Konditorei', icon: '🥖', description: 'Frisch gebackenes Brot, Gebäck und nahrhafter Reiseproviant.' },
  { id: 'def-shp-5', title: 'Alchemist & Kräuterladen', icon: '🧪', description: 'Heiltränke, Gegengifte, seltene Elixiere und Zauberzutaten.' },
  { id: 'def-shp-6', title: 'Metzgerei & Fleischer', icon: '🥩', description: 'Dörrfleisch, Schinken, Wurstwaren und frische Rationen.' },
  { id: 'def-shp-7', title: 'Schneider & Tuchhändler', icon: '🧵', description: 'Robuste Reisekleidung, Umhänge, Stoffe und feine Seide.' },
  { id: 'def-shp-8', title: 'Juwelier & Goldhändler', icon: '💎', description: 'Edelsteine, Geschmeide, Silberbesteck und magische Foki.' },
  { id: 'def-shp-9', title: 'Handels-Kontor & Bank', icon: '🏦', description: 'Geldwechsel, Schließfächer, Wechselbriefe und Handelsverträge.' },
  { id: 'def-shp-10', title: 'Zauberladen & Antiquariat', icon: '📜', description: 'Alte Schriftrollen, Magie-Bücher, Artefakte und Kuriositäten.' },
  { id: 'def-shp-11', title: 'Marktstand / Verkaufsbude', icon: '🎪', description: 'Ein kleiner Händlerstand für regionale Spezialitäten.' }
];

const DEFAULT_INDUSTRY = [
  { id: 'def-ind-1', title: 'Dampf-Manufaktur & Fabrik', icon: '🏭', description: 'Große Produktionshalle mit rauchenden Schornsteinen und Zahnrädern.' },
  { id: 'def-ind-2', title: 'Großes Sägewerk & Holzplatz', icon: '🪵', description: 'Verarbeitet Baumstämme zu Balke, Planken und Bauholz.' },
  { id: 'def-ind-3', title: 'Dorfschmiede & Hütte', icon: '⚒️', description: 'Glühendes Eisen, Amboss und Hämmer zur Metallverarbeitung.' },
  { id: 'def-ind-4', title: 'Wassermühle & Mühlenhaus', icon: '⚙️', description: 'Angetrieben durch Wasserkraft zur Mehl- und Kornverarbeitung.' },
  { id: 'def-ind-5', title: 'Windmühle', icon: '🌬️', description: 'Kornmühle auf dem Hügel mit großen Holzflügeln.' },
  { id: 'def-ind-6', title: 'Brauerei & Brennerei', icon: '🍺', description: 'Große Sudkessel für hopfiges Bier, Schnaps und Met.' },
  { id: 'def-ind-7', title: 'Schiffswerft & Trockendock', icon: '🏗️', description: 'Mächtiges Holzgerüst zum Bau und zur Reparatur von Schiffen.' },
  { id: 'def-ind-8', title: 'Erz-Bergwerk & Mine', icon: '⛏️', description: 'Tiefere Stollen für Eisenerz, Kohle, Gold und Kristalle.' },
  { id: 'def-ind-9', title: 'Steinbruch & Ziegelei', icon: '🧱', description: 'Förderung von Granitquadern und Ziegelherstellung für Festungen.' },
  { id: 'def-ind-10', title: 'Bauernhof & Landgut', icon: '🚜', description: 'Weitläufige Ställe, Scheunen und Felder zur Nahrungsherstellung.' },
  { id: 'def-ind-11', title: 'Gießerei & Metallwerk', icon: '🔥', description: 'Gießt flüssiges Erz in Formen für Kanonen, Glocken und Werkzeug.' }
];

const DEFAULT_CONSTRUCTIONS = [
  // --- Schutzmauern & Befestigungen ---
  { id: 'def-bld-wall-1', title: 'Einfache Holzbarrikade', icon: '🚧', description: 'Eine eilig errichtete Barrikade aus Baumstämmen und Kisten.' },
  { id: 'def-bld-wall-2', title: 'Palisadenmauer (Holz)', icon: '🪵', description: 'Eine Reihe angespitzter Holzpfähle, die vor leichten Angriffen schützt.' },
  { id: 'def-bld-wall-3', title: 'Palisadentor (Holz)', icon: '🚪', description: 'Ein verriegelbares Tor aus dicken Holzbohlen innerhalb einer Palisadenwand.' },
  { id: 'def-bld-wall-4', title: 'Einfache Steinmauer', icon: '🧱', description: 'Eine niedrige Mauer aus lose geschichteten Feldsteinen.' },
  { id: 'def-bld-wall-5', title: 'Stadtmauer-Segment', icon: '🧱', description: 'Ein massiver Abschnitt einer wehrhaften, gemauerten Stadtmauer.' },
  { id: 'def-bld-wall-6', title: 'Hohe Festungsmauer', icon: '🏯', description: 'Eine gewaltige, dicke Mauer aus behauenem Granit mit Wehrgang.' },
  { id: 'def-bld-wall-7', title: 'Mauersegment mit Zinnen', icon: '🏰', description: 'Ein Wehrgang mit Brustwehr und Zinnen zum Schutz für Bogenschützen.' },
  { id: 'def-bld-wall-8', title: 'Schweres Eisen-Gittertor', icon: '🚪', description: 'Ein massives Schmiedeeisentor, das Zugänge unpassierbar macht.' },
  { id: 'def-bld-wall-9', title: 'Palisaden-Wehrgang', icon: '🪜', description: 'Ein erhöhter Holzsteg hinter den Palisaden für Wachposten.' },
  { id: 'def-bld-wall-10', title: 'Schutzgraben mit Pfählen', icon: '🕳️', description: 'Ein tiefer Graben gespickt mit spitzen Holzpfählen am Boden.' }
];

const DEFAULT_PLACES = [
  // --- Siedlungen: Dörfer (Klein bis Groß) ---
  { id: 'def-place-vlg-1', title: 'Weiler / Einsiedelei (Sehr klein)', icon: '🏡', description: 'Zwei bis drei einfache Holzhäuser umgeben von unberührter Natur.' },
  { id: 'def-place-vlg-2', title: 'Fischerdorf (Klein)', icon: '🛖', description: 'Ein kleines Dorf an der Küste mit Stegen, Netzen und Bootshütten.' },
  { id: 'def-place-vlg-3', title: 'Landwirtschaftliches Dorf (Mittel)', icon: '🏘️', description: 'Ein friedliches Bauerndorf mit Scheunen, Windmühlen und Kornfeldern.' },
  { id: 'def-place-vlg-4', title: 'Großes Handelsdorf', icon: '🏡', description: 'Ein florierendes Dorf mit einem Marktplatz, einer Schenke und Handwerkern.' },

  // --- Siedlungen: Städte (Klein bis Groß) ---
  { id: 'def-place-cty-1', title: 'Kleinstadt / Markt (Klein)', icon: '🏘️', description: 'Eine kleine Siedlung mit eigener Stadtmauer, Rathaus und Wochenmarkt.' },
  { id: 'def-place-cty-2', title: 'Provinzstadt (Mittel)', icon: '🏢', description: 'Eine etablierte Stadt mit gepflasterten Straßen, Gilden und Wachposten.' },
  { id: 'def-place-cty-3', title: 'Große Handelsmetropole', icon: '🏛️', description: 'Eine gewaltige Stadt mit Häfen, Palästen, Tempeln und dichtem Gedränge.' },
  { id: 'def-place-cty-4', title: 'Kaiserliche Residenzstadt (Riesig)', icon: '🏰', description: 'Das glanzvolle politische und kulturelle Zentrum des gesamten Reiches.' },

  // --- Siedlungen: Festungen & Militär (Klein bis Groß) ---
  { id: 'def-place-fort-1', title: 'Grenz-Wachtposten (Sehr klein)', icon: '🗼', description: 'Ein einzelner hölzerner Turm mit einer Palisade und kleinem Lager.' },
  { id: 'def-place-fort-2', title: 'Befestigtes Lager / Camp (Klein)', icon: '⛺', description: 'Ein provisorischer Militärstützpunkt mit Gräben, Zelten und Palisaden.' },
  { id: 'def-place-fort-3', title: 'Wehrhafte Ritterburg (Mittel)', icon: '🏰', description: 'Eine steinerne Trutzburg mit Zinnen, Burggraben und einem Hauptturm.' },
  { id: 'def-place-fort-4', title: 'Große Grenzfestung (Groß)', icon: '🏯', description: 'Eine gewaltige Festungsanlage zur Sicherung strategischer Bergpässe.' },
  { id: 'def-place-fort-5', title: 'Uneinnehmbare Zitadelle (Riesig)', icon: '🛡️', description: 'Ein gigantisches militärisches Hauptquartier mit mehreren Verteidigungsringen.' },

  // --- Siedlungen: Schlösser & Herrschaftssitze ---
  { id: 'def-place-cas-1', title: 'Jagdschloss (Klein)', icon: '🏡', description: 'Ein edler Rückzugsort für adlige Jagdausflüge im Wald.' },
  { id: 'def-place-cas-2', title: 'Barockes Lustschloss (Mittel)', icon: '🏛️', description: 'Ein prunkvolles Schloss mit weitläufigen Gärten und Wasserspielen.' },
  { id: 'def-place-cas-3', title: 'Prachtvolles Königsschloss (Groß)', icon: '🏰', description: 'Ein monumentaler Palast voller Prunk, Säle und goldener Verzierungen.' },

  // --- Siedlungen: Basen & Zufluchten ---
  { id: 'def-place-base-1', title: 'Geheimes Versteck / Schlupfwinkel (Klein)', icon: '🕳️', description: 'Ein getarntes Lager von Gesetzlosen oder Widerstandskämpfern.' },
  { id: 'def-place-base-2', title: 'Abenteurer-Gilde / Basis (Mittel)', icon: '🏠', description: 'Der gut ausgerüstete Stützpunkt einer Abenteurergruppe.' },
  { id: 'def-place-base-3', title: 'Unterirdische Geheimbasis (Groß)', icon: '🕸️', description: 'Ein weit verzweigtes Tunnel- und Kammersystem tief im Fels.' },
  { id: 'def-place-base-4', title: 'Außenposten der Allianz', icon: '📡', description: 'Ein strategischer Stützpunkt zur Überwachung feindlicher Aktivitäten.' },

  // --- Besondere & Natürliche Orte ---
  { id: 'def-place-spc-1', title: 'Dorfplatz & Brunnen', icon: '⛲', description: 'Der lebhafte Mittelpunkt jeder Siedlung für Treffen und Handel.' },
  { id: 'def-place-spc-2', title: 'Geheimnisvolle Höhle', icon: '🕳️', description: 'Ein finsterer, feuchter Spalt, der tief in die Unterwelt führt.' },
  { id: 'def-place-spc-3', title: 'Uralter Elfenwald', icon: '🌲', description: 'Dichte Baumkronen, mystisches Leuchten und uralter Zauber.' },
  { id: 'def-place-spc-4', title: 'Aussichtspunkt / Klippe', icon: '🔭', description: 'Ermöglicht einen weiten Panoramablick über das gesamte Umland.' },
  { id: 'def-place-spc-5', title: 'Brodelnder Vulkan', icon: '🌋', description: 'Ein rauchender Riese mit herabfließenden Lavaströmen.' },
  { id: 'def-place-spc-6', title: 'Magisches Portal', icon: '🌀', description: 'Ein wabernder Energiewirbel für sofortige Reisen durch Welten.' },
  { id: 'def-place-spc-7', title: 'Antiker Steinkreis', icon: '🪨', description: 'Ein ritueller Treffpunkt von Druiden voller mystischer Energien.' },
  { id: 'def-place-spc-8', title: 'Düsterer Friedhof', icon: '🪦', description: 'Alte Grabsteine, Nebelschwaden und eine andächtige Stille.' },
  { id: 'def-place-spc-9', title: 'Knisterndes Lagerfeuer', icon: '🔥', description: 'Ein sicherer Zufluchtsort für Abenteurer zur Rast und Regeneration.' },
  { id: 'def-place-spc-10', title: 'Hängebrücke über Schlucht', icon: '🌉', description: 'Eine wackelige Holzkonstruktion über einem reißenden Fluss.' },
  { id: 'def-place-spc-11', title: 'Heiliger Schrein', icon: '⛩️', description: 'Ein friedvoller, kleiner Altar inmitten der Natur für Opfergaben.' }
];

const DEFAULT_GEOGRAPHY = [
  // --- Kontinente & Landmassen ---
  { id: 'def-geo-1', title: 'Haupt-Kontinent / Hauptland', icon: '🌍', description: 'Die größte zusammenhängende Landmasse des Reiches.' },
  { id: 'def-geo-2', title: 'Nördlicher Kontinent / Nordland', icon: '❄️', description: 'Ein eisiger, lebensfeindlicher Kontinent im hohen Norden.' },
  { id: 'def-geo-3', title: 'Südlicher Kontinent / Südland', icon: '☀️', description: 'Ein von Wüsten und Dschungeln geprägter Kontinent.' },
  { id: 'def-geo-4', title: 'Vergessener Kontinent / Urland', icon: '🦖', description: 'Ein unentdecktes Land voller urzeitlicher Kreaturen und Magie.' },

  // --- Inseln & Archipele ---
  { id: 'def-geo-5', title: 'Große Insel', icon: '🏝️', description: 'Eine eigenständige Insel mit eigenen Städten und Häfen.' },
  { id: 'def-geo-6', title: 'Kleine tropische Insel', icon: '🏝️', description: 'Eine paradiesische, einsame Insel mit Sandstränden.' },
  { id: 'def-geo-7', title: 'Inselgruppe / Archipel', icon: '🗺️', description: 'Eine Kette kleinerer Inseln, die dicht beieinander liegen.' },
  { id: 'def-geo-8', title: 'Vulkaninsel', icon: '🌋', description: 'Eine rauchende Insel, geformt von vulkanischer Aktivität.' },
  { id: 'def-geo-9', title: 'Nebelinsel / Mystische Insel', icon: '🌫️', description: 'Eine im ewigen Nebel verborgene Insel voller Geheimnisse.' },

  // --- Gewässer & Ozeane ---
  { id: 'def-geo-10', title: 'Großer Ozean / Weltmeer', icon: '🌊', description: 'Die endlosen Tiefen des Meeres zwischen den Kontinenten.' },
  { id: 'def-geo-11', title: 'Mittleres Meer / Binnenmeer', icon: '🌊', description: 'Ein von Landmassen umschlossenes, ruhigeres Gewässer.' },
  { id: 'def-geo-12', title: 'Großer See', icon: '💧', description: 'Ein riesiger Süßwassersee im Herzen des Landes.' },
  { id: 'def-geo-13', title: 'Breite Bucht / Naturhafen', icon: '⚓', description: 'Ein geschütztes Küstengewässer, ideal für Schiffshäfen.' },
  { id: 'def-geo-14', title: 'Reißende Meerenge', icon: '🌀', description: 'Eine schmale, gefährliche Passage zwischen zwei Landmassen.' },

  // --- Naturdenkmäler & Landschaften ---
  { id: 'def-geo-15', title: 'Gewaltiges Gebirge', icon: '🏔️', description: 'Eine Kette schneebedeckter Gipfel, die den Himmel berühren.' },
  { id: 'def-geo-16', title: 'Riesiger Urwald / Dschungel', icon: '🌳', description: 'Ein dichter, ungezähmter Urwald voller exotischer Lebensformen.' },
  { id: 'def-geo-17', title: 'Unergründliche Wüste', icon: '🏜️', description: 'Eine endlose Sand- oder Steinwüste unter brennender Sonne.' },
  { id: 'def-geo-18', title: 'Riesiger Sumpf / Morast', icon: '🐊', description: 'Ein tückisches, nebliges Feuchtgebiet voll von Gefahren.' }
];

export const AUTO_DECORATIONS: Record<string, { name: string; icon: string; category: string; description: string }> = {
  wald: {
    name: 'Waldbaum',
    icon: '🌲',
    category: 'Marker & Orte',
    description: 'Ein dichter Nadelbaum, der Deckung und Sichtschutz bietet.'
  },
  berg: {
    name: 'Felsbrocken',
    icon: '🪨',
    category: 'Marker & Orte',
    description: 'Ein massiver, unpassierbarer Felsbrocken.'
  },
  ruine: {
    name: 'Uralte Ruine',
    icon: '🏚️',
    category: 'Marker & Orte',
    description: 'Ein verfallenes Steingebäude voller Moos.'
  },
  vulkan: {
    name: 'Lavariss',
    icon: '🌋',
    category: 'Marker & Orte',
    description: 'Ein heißer Riss voller rot glühender Lava.'
  },
  wueste: {
    name: 'Wüstenkaktus',
    icon: '🌵',
    category: 'Marker & Orte',
    description: 'Ein großer Kaktus, der Wasser speichern kann.'
  },
  schnee: {
    name: 'Eiskristall',
    icon: '❄️',
    category: 'Marker & Orte',
    description: 'Eine eisige Barriere aus reinem Gletschereis.'
  },
  krypta: {
    name: 'Grabstein',
    icon: '🪦',
    category: 'Marker & Orte',
    description: 'Ein bemooster, uralter Grabstein.'
  },
  knochen: {
    name: 'Skelettreste',
    icon: '💀',
    category: 'Marker & Orte',
    description: 'Verwitterte Gebeine eines längst vergangenen Wesens.'
  },
  zaun: {
    name: 'Holzbarrikade',
    icon: '🚧',
    category: 'Marker & Orte',
    description: 'Eine provisorische Barrikade aus Holzpfählen.'
  },
  laserwand: {
    name: 'Laserbarriere',
    icon: '🚨',
    category: 'Marker & Orte',
    description: 'Ein hochenergetisches Warnlicht.'
  }
};

export const groupPlacedObjects = (objects: any[]): any[] => {
  const groupable = objects.filter((obj: any) => {
    const isSpecial = obj.loreEntryId || obj.faction || obj.currentCount !== undefined || obj.maxCapacity !== undefined;
    const isPlayer = obj.isPlayer || obj.category === 'Spieler';
    return !isSpecial && !isPlayer;
  });

  const nonGroupable = objects.filter((obj: any) => {
    const isSpecial = obj.loreEntryId || obj.faction || obj.currentCount !== undefined || obj.maxCapacity !== undefined;
    const isPlayer = obj.isPlayer || obj.category === 'Spieler';
    return isSpecial || isPlayer;
  });

  // Group by (name, icon) key
  const groupsByKey: Record<string, any[]> = {};
  groupable.forEach(obj => {
    const key = `${obj.name}|||${obj.icon}`;
    if (!groupsByKey[key]) groupsByKey[key] = [];
    groupsByKey[key].push(obj);
  });

  const finalItems: any[] = [...nonGroupable];

  Object.entries(groupsByKey).forEach(([key, list]) => {
    const [name, icon] = key.split('|||');
    
    // Connected component analysis on this list
    const unvisited = new Set<string>(list.map(obj => obj.id));
    const objMap = new Map<string, any>(list.map(obj => [obj.id, obj]));

    while (unvisited.size > 0) {
      const startId = unvisited.values().next().value!;
      unvisited.delete(startId);
      const component: any[] = [objMap.get(startId)!];
      const queue: any[] = [objMap.get(startId)!];

      while (queue.length > 0) {
        const current = queue.shift()!;
        
        // Find adjacent neighbors in unvisited of the same type
        const neighbors = list.filter(other => {
          if (!unvisited.has(other.id)) return false;
          const dx = Math.abs(current.x - other.x);
          const dy = Math.abs(current.y - other.y);
          return dx <= 1 && dy <= 1; // 8-connectivity
        });

        neighbors.forEach(neighbor => {
          unvisited.delete(neighbor.id);
          component.push(neighbor);
          queue.push(neighbor);
        });
      }

      if (component.length > 1) {
        // Group them!
        const xs = component.map(c => c.x);
        const ys = component.map(c => c.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const avgX = Math.round(xs.reduce((sum, val) => sum + val, 0) / component.length);
        const avgY = Math.round(ys.reduce((sum, val) => sum + val, 0) / component.length);

        // Name of the zone
        let zoneName = `${name}-Zone`;
        const lowerName = name.toLowerCase();
        if (lowerName.includes('baum') || lowerName.includes('wald')) {
          zoneName = 'Zusammenhängende Waldzone';
        } else if (lowerName.includes('fels') || lowerName.includes('stein')) {
          zoneName = 'Zusammenhängende Felsformation';
        } else if (lowerName.includes('kaktus')) {
          zoneName = 'Zusammenhängendes Kaktusfeld';
        } else if (lowerName.includes('ruine')) {
          zoneName = 'Zusammenhängendes Ruinenareal';
        } else if (lowerName.includes('grabstein') || lowerName.includes('friedhof')) {
          zoneName = 'Zusammenhängendes Gräberfeld';
        } else if (lowerName.includes('skelett') || lowerName.includes('knochen')) {
          zoneName = 'Zusammenhängende Knochenstätte';
        } else if (lowerName.includes('vulkan') || lowerName.includes('lava')) {
          zoneName = 'Zusammenhängende Lavaspalte';
        } else if (lowerName.includes('barrikade') || lowerName.includes('zaun')) {
          zoneName = 'Zusammenhängende Barrikadenlinie';
        } else if (lowerName.includes('mauer')) {
          zoneName = 'Zusammenhängender Mauerabschnitt';
        }

        finalItems.push({
          id: `zone-${component[0].id}`,
          isGroup: true,
          name: zoneName,
          icon: icon,
          category: component[0].category,
          description: `Zusammenhängendes Gebiet aus ${component.length} x ${name}.`,
          items: component,
          x: avgX,
          y: avgY,
          minX, maxX, minY, maxY
        });
      } else {
        // Size is 1, keep as single item
        finalItems.push(component[0]);
      }
    }
  });

  return finalItems;
};

export const TacticalCanvasEditor: React.FC<TacticalCanvasEditorProps> = ({
  player,
  combatState,
  onChangeCombatState,
  territory,
  worldSetting,
  loreDatabase = [],
  onUpdateTerritoryFields
}) => {
  const [activeTool, setActiveTool] = useState<'terrain' | 'player' | 'token' | 'eraser' | 'pan' | 'zone'>('terrain');
  const [selectedTerrainCategory, setSelectedTerrainCategory] = useState<'fantasy' | 'scifi' | 'modern' | 'horror'>('fantasy');
  const [selectedTerrain, setSelectedTerrain] = useState<string>('gras');
  const [autoDecorate, setAutoDecorate] = useState<boolean>(true);
  
  // Zone / Area Selector State
  const [selectedZoneCells, setSelectedZoneCells] = useState<Array<{ col: number; row: number }>>([]);
  const [zoneNameInput, setZoneNameInput] = useState<string>('');
  const [zoneIconInput, setZoneIconInput] = useState<string>('🗺️');
  const [zoneColorInput, setZoneColorInput] = useState<string>('#10b981');
  const [zoneLoreEntryId, setZoneLoreEntryId] = useState<string>('');
  const [zoneBrushMode, setZoneBrushMode] = useState<'brush' | 'box'>('brush');

  // Token Placement State
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [tokenMainTab, setTokenMainTab] = useState<'location' | 'units' | 'structures'>('location');
  const [tokenSubTab, setTokenSubTab] = useState<'characters' | 'factions' | 'enemies' | 'ships' | 'treasures' | 'buildings' | 'hospitality' | 'shops' | 'industry' | 'constructions' | 'places' | 'geography' | 'custom'>('characters');
  const [activeToken, setActiveToken] = useState<ActiveToken>({
    name: 'Menschlicher Krieger',
    icon: '🟢',
    category: 'Charaktere & NPCs',
    description: 'Unabhängiger Charakter (Grüner Kreis).'
  });

  // Codex Picker State
  const [codexCategoryFilter, setCodexCategoryFilter] = useState<string>('all');
  const [codexSearchQuery, setCodexSearchQuery] = useState<string>('');
  const [codexDropdownFilter, setCodexDropdownFilter] = useState<'auto' | 'all' | 'Orte' | 'Charaktere' | 'Gegenstände' | 'Fraktionen'>('auto');
  const [showAllLoreCategories, setShowAllLoreCategories] = useState<boolean>(false);

  // Editing Placed Token State
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [editingTokenData, setEditingTokenData] = useState<{ name: string; icon: string; category: string; description?: string; loreEntryId?: string; currentCount?: number; maxCapacity?: number; color?: string; population?: number; minCrew?: number; shipSize?: 'klein' | 'mittel' | 'groß'; defense?: number; attack?: number; durability?: number } | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [inspectingLoreEntry, setInspectingLoreEntry] = useState<LoreEntry | null>(null);
  const [movingObjectId, setMovingObjectId] = useState<string | null>(null);

  // Terrain Area / Brush Tools State
  const [terrainBrushMode, setTerrainBrushMode] = useState<'brush' | 'box' | 'fill'>('brush');
  const [terrainBrushSize, setTerrainBrushSize] = useState<number>(1);
  const [terrainBrushShape, setTerrainBrushShape] = useState<'square' | 'circle'>('square');
  const [boxStartCell, setBoxStartCell] = useState<{ col: number; row: number } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);

  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isGeneratingAiMap, setIsGeneratingAiMap] = useState(false);
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Tile size & Camera Pan
  const [tilePx, setTilePx] = useState<number>(48);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanDragging, setIsPanDragging] = useState<boolean>(false);
  const [panDragStart, setPanDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(false);
  const [isPlacedListExpanded, setIsPlacedListExpanded] = useState<boolean>(true);

  const gridRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const handleCellActionRef = useRef<((col: number, row: number, isDrag?: boolean) => void) | null>(null);
  
  useEffect(() => {
    handleCellActionRef.current = handleCellAction;
  }, [handleCellAction]);

  const gridWidth = combatState.gridWidth || 30;
  const gridHeight = combatState.gridHeight || 30;

  // Calculate affected brush cells based on size and shape
  const getAffectedBrushCells = useCallback((centerCol: number, centerRow: number, size: number, shape: 'square' | 'circle') => {
    const affected: Array<{ col: number; row: number }> = [];
    if (size <= 1) {
      if (centerCol >= 0 && centerCol < gridWidth && centerRow >= 0 && centerRow < gridHeight) {
        affected.push({ col: centerCol, row: centerRow });
      }
      return affected;
    }

    const radius = Math.floor(size / 2);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const c = centerCol + dx;
        const r = centerRow + dy;
        if (c >= 0 && c < gridWidth && r >= 0 && r < gridHeight) {
          if (shape === 'square') {
            affected.push({ col: c, row: r });
          } else {
            if (dx * dx + dy * dy <= radius * radius + 0.5) {
              affected.push({ col: c, row: r });
            }
          }
        }
      }
    }
    return affected;
  }, [gridWidth, gridHeight]);

  // Flood fill algorithm for bucket tool
  const handleFloodFill = useCallback((startCol: number, startRow: number) => {
    const currentTiles = { ...(combatState.tiles || {}) };
    const targetTerrain = activeTool === 'eraser' ? undefined : selectedTerrain;
    const startKey = `${startCol},${startRow}`;
    const startTerrain = currentTiles[startKey];

    if (startTerrain === targetTerrain) return;

    // Forbidden to flood-fill 'haus' on path terrain
    const isStartPath = startTerrain === 'weg' || startTerrain === 'neonweg' || startTerrain === 'asphalt' || startTerrain === 'gehweg' || startTerrain === 'strasse';
    if (targetTerrain === 'haus' && isStartPath) {
      return;
    }

    const queue: Array<[number, number]> = [[startCol, startRow]];
    const visited = new Set<string>();
    visited.add(startKey);

    let processed = 0;
    const maxTiles = gridWidth * gridHeight;

    while (queue.length > 0 && processed < maxTiles) {
      const [c, r] = queue.shift()!;
      processed++;
      const key = `${c},${r}`;

      if (targetTerrain === undefined) {
        delete currentTiles[key];
      } else {
        const currentT = currentTiles[key] || '';
        const isPathTerrain = currentT === 'weg' || currentT === 'neonweg' || currentT === 'asphalt' || currentT === 'gehweg' || currentT === 'strasse';
        if (targetTerrain === 'haus' && isPathTerrain) {
          // Keep the path, skip overwriting
        } else {
          currentTiles[key] = targetTerrain;
        }
      }

      const neighbors: Array<[number, number]> = [
        [c + 1, r],
        [c - 1, r],
        [c, r + 1],
        [c, r - 1]
      ];

      for (const [nc, nr] of neighbors) {
        if (nc >= 0 && nc < gridWidth && nr >= 0 && nr < gridHeight) {
          const nKey = `${nc},${nr}`;
          if (!visited.has(nKey) && currentTiles[nKey] === startTerrain) {
            visited.add(nKey);
            queue.push([nc, nr]);
          }
        }
      }
    }

    onChangeCombatState({
      ...combatState,
      tiles: currentTiles
    });
  }, [combatState, activeTool, selectedTerrain, gridWidth, gridHeight, onChangeCombatState]);

  // Box rectangle fill
  const handleBoxFill = useCallback((c1: number, r1: number, c2: number, r2: number) => {
    const currentTiles = { ...(combatState.tiles || {}) };
    let currentObjects = [...(combatState.placedObjects || [])];
    const targetTerrain = activeTool === 'eraser' ? undefined : selectedTerrain;

    const minCol = Math.max(0, Math.min(c1, c2));
    const maxCol = Math.min(gridWidth - 1, Math.max(c1, c2));
    const minRow = Math.max(0, Math.min(r1, r2));
    const maxRow = Math.min(gridHeight - 1, Math.max(r1, r2));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const key = `${c},${r}`;
        if (targetTerrain === undefined) {
          delete currentTiles[key];
          currentObjects = currentObjects.filter(obj => !(obj.x === c && obj.y === r));
        } else {
          const currentT = currentTiles[key] || '';
          const isPathTerrain = currentT === 'weg' || currentT === 'neonweg' || currentT === 'asphalt' || currentT === 'gehweg' || currentT === 'strasse';
          if (targetTerrain === 'haus' && isPathTerrain) {
            continue; // Forbidden to place building on path terrain!
          }
          currentTiles[key] = targetTerrain;
        }
      }
    }

    onChangeCombatState({
      ...combatState,
      tiles: currentTiles,
      placedObjects: currentObjects
    });
  }, [combatState, activeTool, selectedTerrain, gridWidth, gridHeight, onChangeCombatState]);

  // Box selection for zone mode
  const handleZoneBoxSelect = useCallback((c1: number, r1: number, c2: number, r2: number) => {
    const minCol = Math.max(0, Math.min(c1, c2));
    const maxCol = Math.min(gridWidth - 1, Math.max(c1, c2));
    const minRow = Math.max(0, Math.min(r1, r2));
    const maxRow = Math.min(gridHeight - 1, Math.max(r1, r2));

    setSelectedZoneCells(prev => {
      const newCells = [...prev];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          const exists = newCells.some(cell => cell.col === c && cell.row === r);
          if (!exists) {
            newCells.push({ col: c, row: r });
          }
        }
      }
      return newCells;
    });
  }, [gridWidth, gridHeight]);

  // Bulk fill whole grid or empty tiles
  const handleFillEntireGrid = useCallback((mode: 'all' | 'empty' | 'clear') => {
    const currentTiles = { ...(combatState.tiles || {}) };
    let currentObjects = [...(combatState.placedObjects || [])];

    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        const key = `${c},${r}`;
        if (mode === 'all') {
          currentTiles[key] = selectedTerrain;
        } else if (mode === 'empty') {
          if (!currentTiles[key]) {
            currentTiles[key] = selectedTerrain;
          }
        } else if (mode === 'clear') {
          delete currentTiles[key];
          currentObjects = currentObjects.filter(obj => !(obj.x === c && obj.y === r));
        }
      }
    }

    onChangeCombatState({
      ...combatState,
      tiles: currentTiles,
      placedObjects: currentObjects
    });
  }, [combatState, selectedTerrain, gridWidth, gridHeight, onChangeCombatState]);

  // Compute active brush / box highlight keys
  const activeHighlightKeys = useMemo(() => {
    if (!hoverCell) return new Set<string>();

    const keys = new Set<string>();
    if (activeTool === 'terrain' || activeTool === 'eraser') {
      if (terrainBrushMode === 'box') {
        const startC = boxStartCell ? boxStartCell.col : hoverCell.col;
        const startR = boxStartCell ? boxStartCell.row : hoverCell.row;
        const minCol = Math.max(0, Math.min(startC, hoverCell.col));
        const maxCol = Math.min(gridWidth - 1, Math.max(startC, hoverCell.col));
        const minRow = Math.max(0, Math.min(startR, hoverCell.row));
        const maxRow = Math.min(gridHeight - 1, Math.max(startR, hoverCell.row));
        for (let r = minRow; r <= maxRow; r++) {
          for (let c = minCol; c <= maxCol; c++) {
            keys.add(`${c},${r}`);
          }
        }
      } else if (terrainBrushMode === 'brush') {
        const affected = getAffectedBrushCells(hoverCell.col, hoverCell.row, terrainBrushSize, terrainBrushShape);
        affected.forEach(pt => keys.add(`${pt.col},${pt.row}`));
      } else if (terrainBrushMode === 'fill') {
        keys.add(`${hoverCell.col},${hoverCell.row}`);
      }
    } else if (activeTool === 'zone' && zoneBrushMode === 'box') {
      const startC = boxStartCell ? boxStartCell.col : hoverCell.col;
      const startR = boxStartCell ? boxStartCell.row : hoverCell.row;
      const minCol = Math.max(0, Math.min(startC, hoverCell.col));
      const maxCol = Math.min(gridWidth - 1, Math.max(startC, hoverCell.col));
      const minRow = Math.max(0, Math.min(startR, hoverCell.row));
      const maxRow = Math.min(gridHeight - 1, Math.max(startR, hoverCell.row));
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          keys.add(`${c},${r}`);
        }
      }
    }
    return keys;
  }, [hoverCell, boxStartCell, activeTool, terrainBrushMode, zoneBrushMode, terrainBrushSize, terrainBrushShape, gridWidth, gridHeight, getAffectedBrushCells]);

  // Scale: meters per tile
  const tileSizeMeters = combatState.tileSizeMeters || 5;
  const totalWidthMeters = gridWidth * tileSizeMeters;
  const totalHeightMeters = gridHeight * tileSizeMeters;
  const totalAreaM2 = totalWidthMeters * totalHeightMeters;

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km`;
    }
    return `${meters} m`;
  };

  // Spacebar pan listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement)?.tagName !== 'INPUT' && (e.target as HTMLElement)?.tagName !== 'TEXTAREA') {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Global mouseup handler
  useEffect(() => {
    const handleMouseUp = () => {
      if (boxStartCell && hoverCell) {
        if (terrainBrushMode === 'box' && (activeTool === 'terrain' || activeTool === 'eraser')) {
          handleBoxFill(boxStartCell.col, boxStartCell.row, hoverCell.col, hoverCell.row);
        } else if (zoneBrushMode === 'box' && activeTool === 'zone') {
          handleZoneBoxSelect(boxStartCell.col, boxStartCell.row, hoverCell.col, hoverCell.row);
        }
      }
      setBoxStartCell(null);
      setIsMouseDown(false);
      setIsPanDragging(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [terrainBrushMode, zoneBrushMode, boxStartCell, hoverCell, activeTool, handleBoxFill, handleZoneBoxSelect]);

  // Global mousemove and auto-scroll on drag effect
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isMouseDown || isPanDragging || isSpacePressed || activeTool === 'pan') {
      lastMousePos.current = null;
      return;
    }

    const handleMouseMoveGlobal = (e: MouseEvent) => {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMoveGlobal);

    let animationFrameId: number;
    
    const scrollLoop = () => {
      if (!lastMousePos.current || !viewportRef.current || !gridRef.current) {
        animationFrameId = requestAnimationFrame(scrollLoop);
        return;
      }

      const rect = viewportRef.current.getBoundingClientRect();
      const mouseX = lastMousePos.current.x;
      const mouseY = lastMousePos.current.y;

      const margin = 80; // edge zone in pixels
      const maxSpeed = 12; // maximum speed in pixels per frame

      let dx = 0;
      let dy = 0;

      // Check horizontal edges
      if (mouseX < rect.left + margin) {
        const ratio = Math.max(0, (rect.left + margin - mouseX) / margin);
        dx = Math.min(maxSpeed, ratio * maxSpeed);
      } else if (mouseX > rect.right - margin) {
        const ratio = Math.max(0, (mouseX - (rect.right - margin)) / margin);
        dx = -Math.min(maxSpeed, ratio * maxSpeed);
      }

      // Check vertical edges
      if (mouseY < rect.top + margin) {
        const ratio = Math.max(0, (rect.top + margin - mouseY) / margin);
        dy = Math.min(maxSpeed, ratio * maxSpeed);
      } else if (mouseY > rect.bottom - margin) {
        const ratio = Math.max(0, (mouseY - (rect.bottom - margin)) / margin);
        dy = -Math.min(maxSpeed, ratio * maxSpeed);
      }

      if (dx !== 0 || dy !== 0) {
        // Update panOffset
        setPanOffset(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));

        // Calculate and update hoverCell manually since grid shifted under a possibly stationary mouse
        const gridRect = gridRef.current!.getBoundingClientRect();
        const relativeX = mouseX - gridRect.left;
        const relativeY = mouseY - gridRect.top;

        const col = Math.floor(relativeX / tilePx);
        const row = Math.floor(relativeY / tilePx);

        const clampedCol = Math.max(0, Math.min(gridWidth - 1, col));
        const clampedRow = Math.max(0, Math.min(gridHeight - 1, row));

        setHoverCell({ col: clampedCol, row: clampedRow });

        // If in brush mode, trigger cell action continuously
        if (
          ((activeTool === 'terrain' || activeTool === 'eraser') && terrainBrushMode === 'brush') ||
          activeTool === 'player' ||
          activeTool === 'token' ||
          (activeTool === 'zone' && zoneBrushMode === 'brush')
        ) {
          handleCellActionRef.current?.(clampedCol, clampedRow, true);
        }
      }

      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMouseDown, isPanDragging, isSpacePressed, activeTool, tilePx, gridWidth, gridHeight, terrainBrushMode, zoneBrushMode]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
      e.preventDefault();
      setIsPanDragging(true);
      setPanDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    } else if (e.button === 0) {
      setIsMouseDown(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanDragging) {
      setPanOffset({
        x: e.clientX - panDragStart.x,
        y: e.clientY - panDragStart.y
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanDragging(false);
    setIsMouseDown(false);
  };

  const handleGenerateAiMapFromLore = async () => {
    setIsGeneratingAiMap(true);
    setAiSuccessMessage(null);
    try {
      const res = await GeminiService.generateRpgTileMapFromLoreAndCanon({
        territory,
        worldSetting,
        loreEntries: loreDatabase,
        customInstruction: customAiPrompt
      });

      if (res) {
        const playerKey = player?.name || 'Spieler';
        const newPositions = res.positions || { [playerKey]: { x: 3, y: 10 } };

        const targetGridWidth = res.gridWidth || gridWidth;
        const targetGridHeight = res.gridHeight || gridHeight;
        const newTiles = res.tiles || {};
        let mergedPlacedObjects = (res.placedObjects || []).map((obj: any) => {
          const defaults = getDefaultStatsForToken(obj.name || '', obj.category || '');
          return {
            population: defaults.population,
            minCrew: defaults.minCrew,
            maxCapacity: defaults.maxCapacity,
            shipSize: defaults.shipSize,
            defense: defaults.defense,
            attack: defaults.attack,
            durability: defaults.durability,
            ...obj
          };
        });

        // Connect "Aus Kodex generieren" with "Orte-Ausstattung":
        // Extract the location tokens for this territory, reflecting any newly updated fields from the AI!
        const matchEntry = allLocationEntries.find(l => 
          l.id === territory?.id || 
          l.id === `terr-${territory?.id}` || 
          (l.title && territory?.name && l.title.trim().toLowerCase() === territory.name.trim().toLowerCase())
        ) || activeLocationEntry;

        if (matchEntry) {
          const aiUpdatedFields = (res.updatedTerritoryFields || {}) as any;
          const mergedDetails = {
            ...(matchEntry.details || {}),
            population: aiUpdatedFields.population ?? matchEntry.details?.population ?? territory?.population,
            militaryStrength: aiUpdatedFields.militaryStrength ?? matchEntry.details?.militaryStrength ?? territory?.militaryStrength,
            defense: aiUpdatedFields.defense ?? matchEntry.details?.defense ?? territory?.defense,
            culture: aiUpdatedFields.culture ?? matchEntry.details?.culture ?? territory?.culture,
            trade: aiUpdatedFields.trade ?? matchEntry.details?.trade ?? territory?.trade,
            exports: aiUpdatedFields.exports ?? matchEntry.details?.exports ?? territory?.exports,
            imports: aiUpdatedFields.imports ?? matchEntry.details?.imports ?? territory?.imports,
            resources: aiUpdatedFields.resources ?? matchEntry.details?.resources ?? territory?.resources,
            rawType: aiUpdatedFields.type ?? territory?.type ?? matchEntry.details?.rawType ?? 'ort'
          };

          const temporaryEntry: LoreEntry = {
            ...matchEntry,
            description: aiUpdatedFields.description ?? matchEntry.description ?? territory?.description,
            details: mergedDetails
          };

          const locTokens = extractLocationTokens(temporaryEntry, loreDatabase, worldSetting);
          if (locTokens.length > 0) {
            // Find empty/available cells based on mergedPlacedObjects
            const occupied = new Set<string>();
            mergedPlacedObjects.forEach(obj => {
              occupied.add(`${obj.x},${obj.y}`);
            });

            const waterCells: Array<{ x: number; y: number }> = [];
            const landCells: Array<{ x: number; y: number }> = [];

            for (let r = 0; r < targetGridHeight; r++) {
              for (let c = 0; c < targetGridWidth; c++) {
                const key = `${c},${r}`;
                if (!occupied.has(key)) {
                  const tType = (newTiles[key] || 'gras').toLowerCase();
                  if (tType.includes('wasser') || tType.includes('ozean') || tType.includes('fluss') || tType.includes('see')) {
                    waterCells.push({ x: c, y: r });
                  } else {
                    landCells.push({ x: c, y: r });
                  }
                }
              }
            }

            // Proper Fisher-Yates shuffle for natural, distributed token placement
            const fyShuffle = (arr: any[]) => {
              for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
              }
            };
            fyShuffle(waterCells);
            fyShuffle(landCells);

            locTokens.forEach((tok) => {
              // Check if a token with the same name already exists in mergedPlacedObjects to prevent duplicates
              const exists = mergedPlacedObjects.some(obj => 
                (obj.name && tok.name && obj.name.toLowerCase().trim() === tok.name.toLowerCase().trim()) ||
                (obj.loreEntryId && tok.loreEntryId && obj.loreEntryId === tok.loreEntryId)
              );

              if (!exists) {
                let targetCell: { x: number; y: number } | undefined;

                if (tok.group === 'ships' && waterCells.length > 0) {
                  targetCell = waterCells.pop();
                } else if (landCells.length > 0) {
                  targetCell = landCells.pop();
                } else if (waterCells.length > 0) {
                  targetCell = waterCells.pop();
                }

                if (targetCell) {
                  mergedPlacedObjects.push({
                    id: `placed-autoloc-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
                    name: tok.name,
                    icon: tok.icon,
                    category: tok.category,
                    description: tok.description,
                    loreEntryId: tok.loreEntryId,
                    population: tok.population,
                    minCrew: tok.minCrew,
                    maxCapacity: tok.maxCapacity,
                    shipSize: tok.shipSize,
                    defense: tok.defense,
                    attack: tok.attack,
                    durability: tok.durability,
                    x: targetCell.x,
                    y: targetCell.y
                  });
                  occupied.add(`${targetCell.x},${targetCell.y}`);
                }
              }
            });
          }
        }

        onChangeCombatState({
          ...combatState,
          gridWidth: targetGridWidth,
          gridHeight: targetGridHeight,
          tileSizeMeters: res.tileSizeMeters || tileSizeMeters,
          tiles: newTiles,
          placedObjects: mergedPlacedObjects,
          positions: newPositions
        });

        if (onUpdateTerritoryFields && res.updatedTerritoryFields) {
          onUpdateTerritoryFields(res.updatedTerritoryFields);
        }

        setAiSuccessMessage('Kachelkarte & Canon-Kodex erfolgreich aus der Weltgeschichte generiert!');
        setTimeout(() => setAiSuccessMessage(null), 5000);
      }
    } catch (e: any) {
      console.error('Error generating AI map:', e);
      alert(`Fehler bei der KI-Kartengenerierung: ${e.message || String(e)}`);
    } finally {
      setIsGeneratingAiMap(false);
    }
  };

  const updateGridSize = (width: number, height: number) => {
    const clampedW = Math.max(10, Math.min(50, width));
    const clampedH = Math.max(10, Math.min(40, height));
    
    const cleanTiles = { ...(combatState.tiles || {}) };
    Object.keys(cleanTiles).forEach(key => {
      const [x, y] = key.split(',').map(Number);
      if (x >= clampedW || y >= clampedH) {
        delete cleanTiles[key];
      }
    });

    const cleanObjects = (combatState.placedObjects || []).filter((obj: any) => {
      return obj.x < clampedW && obj.y < clampedH;
    });

    const cleanPositions = { ...(combatState.positions || {}) };
    const playerKey = player?.name || 'Spieler';
    if (cleanPositions[playerKey]) {
      cleanPositions[playerKey].x = Math.min(clampedW - 1, cleanPositions[playerKey].x);
      cleanPositions[playerKey].y = Math.min(clampedH - 1, cleanPositions[playerKey].y);
    }

    onChangeCombatState({
      ...combatState,
      gridWidth: clampedW,
      gridHeight: clampedH,
      tiles: cleanTiles,
      placedObjects: cleanObjects,
      positions: cleanPositions
    });
  };

  const handleSwitchMainTab = (tab: 'location' | 'units' | 'structures') => {
    setTokenMainTab(tab);
    if (tab === 'units') {
      if (tokenSubTab !== 'custom' && tokenSubTab !== 'characters' && tokenSubTab !== 'factions' && tokenSubTab !== 'enemies') {
        setTokenSubTab('characters');
      }
    } else if (tab === 'structures') {
      if (tokenSubTab !== 'custom' && tokenSubTab !== 'buildings' && tokenSubTab !== 'hospitality' && tokenSubTab !== 'shops' && tokenSubTab !== 'industry' && tokenSubTab !== 'constructions' && tokenSubTab !== 'places' && tokenSubTab !== 'ships' && tokenSubTab !== 'treasures' && tokenSubTab !== 'geography') {
        setTokenSubTab('buildings');
      }
    }
  };

  // Click / drag handler for cell actions
  function handleCellAction(col: number, row: number, isDrag = false) {
    if (activeTool === 'zone') {
      setSelectedZoneCells(prev => {
        const exists = prev.some(c => c.col === col && c.row === row);
        if (exists) {
          if (isDrag) return prev;
          return prev.filter(c => !(c.col === col && c.row === row));
        }
        return [...prev, { col, row }];
      });
      return;
    }

    let currentObjects = [...(combatState.placedObjects || [])];

    if (movingObjectId) {
      currentObjects = currentObjects.map(obj => {
        if (obj.id === movingObjectId) {
          return { ...obj, x: col, y: row };
        }
        return obj;
      });
      setMovingObjectId(null);
      onChangeCombatState({
        ...combatState,
        placedObjects: currentObjects
      });
      return;
    }

    const currentTiles = { ...(combatState.tiles || {}) };
    const currentPositions = { ...(combatState.positions || {}) };
    const playerKey = player?.name || 'Spieler';

    if (activeTool === 'terrain' || activeTool === 'eraser') {
      if (terrainBrushMode === 'fill') {
        handleFloodFill(col, row);
        return;
      }

      if (terrainBrushMode === 'box') {
        // Box fill is handled via mouse drag (boxStartCell to hoverCell on mouse up)
        return;
      }

      // Brush mode with brush size & shape
      const affected = getAffectedBrushCells(col, row, terrainBrushSize, terrainBrushShape);
      const targetTerrain = activeTool === 'eraser' ? undefined : selectedTerrain;

      affected.forEach(({ col: c, row: r }) => {
        const key = `${c},${r}`;
        if (targetTerrain === undefined) {
          delete currentTiles[key];
          currentObjects = currentObjects.filter(obj => !(obj.x === c && obj.y === r));
          if (currentPositions[playerKey] && currentPositions[playerKey].x === c && currentPositions[playerKey].y === r) {
            delete currentPositions[playerKey];
          }
        } else {
          const currentT = currentTiles[key] || '';
          const isPathTerrain = currentT === 'weg' || currentT === 'neonweg' || currentT === 'asphalt' || currentT === 'gehweg' || currentT === 'strasse';
          if (targetTerrain === 'haus' && isPathTerrain) {
            return; // Forbidden to place building on path terrain!
          }
          currentTiles[key] = targetTerrain;
        }
      });

      // Auto-Decoration (Kombi-Modus): Place matching tokens for terrain brush
      if (activeTool === 'terrain' && autoDecorate && AUTO_DECORATIONS[selectedTerrain]) {
        const deco = AUTO_DECORATIONS[selectedTerrain];
        const sampleCount = terrainBrushSize === 1 ? 1 : Math.max(1, Math.floor(affected.length * 0.15));
        const sampleCells = [...affected].sort(() => 0.5 - Math.random()).slice(0, sampleCount);

        sampleCells.forEach(({ col: c, row: r }) => {
          const alreadyHasDeco = currentObjects.some(obj => obj.x === c && obj.y === r && obj.icon === deco.icon);
          if (!alreadyHasDeco) {
            const cellObjs = currentObjects.filter(obj => obj.x === c && obj.y === r);
            const isPlayerHere = currentPositions[playerKey] && currentPositions[playerKey].x === c && currentPositions[playerKey].y === r;
            const totalTokensInCell = cellObjs.length + (isPlayerHere ? 1 : 0);

            if (totalTokensInCell < 4) {
              currentObjects.push({
                id: `placed-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                name: deco.name,
                icon: deco.icon,
                category: deco.category,
                description: deco.description,
                x: c,
                y: r
              });
            }
          }
        });
      }
    } else if (activeTool === 'player') {
      currentPositions[playerKey] = { x: col, y: row };
    } else if (activeTool === 'token') {
      // Rule: Check if a Codex character (or other Codex entry with loreEntryId) is already on the map
      if (activeToken.loreEntryId) {
        const entry = allLocationEntries.find(l => l.id === activeToken.loreEntryId) || loreDatabase.find(l => l.id === activeToken.loreEntryId);
        const isMassenware = entry?.details?.isUnique === 'Massenware / Gewöhnlich' || 
                             (entry?.details?.isUnique && entry.details.isUnique.toLowerCase().includes('massenware'));

        if (!isMassenware) {
          const alreadyPlaced = currentObjects.find(obj => obj.loreEntryId === activeToken.loreEntryId);
          if (alreadyPlaced) {
            setWarningMessage(`"${activeToken.name}" ist bereits auf Position X: ${alreadyPlaced.x}, Y: ${alreadyPlaced.y} platziert! Ein Charakter/Eintrag aus dem Kodex darf nur einmal auf der Karte liegen.`);
            setTimeout(() => setWarningMessage(null), 6000);
            return;
          }
        }
      }

      // Max 4 objects/units per tile rule
      const cellObjs = currentObjects.filter(obj => obj.x === col && obj.y === row);
      const isPlayerHere = currentPositions[playerKey] && currentPositions[playerKey].x === col && currentPositions[playerKey].y === row;
      const totalTokensInCell = cellObjs.length + (isPlayerHere ? 1 : 0);
      
      if (totalTokensInCell >= 4) {
        setWarningMessage(`Auf dieser Kachel befinden sich bereits ${totalTokensInCell} Objekte/Einheiten. Maximal 4 können auf einer Kachel platziert werden!`);
        setTimeout(() => setWarningMessage(null), 5000);
        return;
      }
      
      let maxCapacity: number | undefined = undefined;
      let currentCount: number | undefined = undefined;
      if (activeToken.loreEntryId) {
        const entry = allLocationEntries.find(l => l.id === activeToken.loreEntryId) || loreDatabase.find(l => l.id === activeToken.loreEntryId);
        maxCapacity = entry?.details?.maxCapacity || entry?.details?.maxMembers;
        if (maxCapacity !== undefined) {
          currentCount = 1;
        }
      }
      
      const defaultStats = getDefaultStatsForToken(activeToken.name || '', activeToken.category || '');
      const population = activeToken.population !== undefined ? activeToken.population : defaultStats.population;
      const minCrew = activeToken.minCrew !== undefined ? activeToken.minCrew : defaultStats.minCrew;
      const finalMaxCap = activeToken.maxCapacity !== undefined ? activeToken.maxCapacity : (maxCapacity !== undefined ? maxCapacity : defaultStats.maxCapacity);
      const shipSize = activeToken.shipSize || defaultStats.shipSize;
      const defense = activeToken.defense !== undefined ? activeToken.defense : defaultStats.defense;
      const attack = activeToken.attack !== undefined ? activeToken.attack : defaultStats.attack;
      const durability = activeToken.durability !== undefined ? activeToken.durability : defaultStats.durability;
      
      currentObjects.push({
        id: `placed-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name: activeToken.name || 'Unbenannter Marker',
        icon: activeToken.icon || '📌',
        category: activeToken.category || 'Marker',
        description: activeToken.description || '',
        loreEntryId: activeToken.loreEntryId,
        currentCount,
        maxCapacity: finalMaxCap,
        minCrew,
        shipSize,
        population,
        defense,
        attack,
        durability,
        x: col,
        y: row
      });
    }

    onChangeCombatState({
      ...combatState,
      tiles: currentTiles,
      placedObjects: currentObjects,
      positions: currentPositions
    });
  };

  const handleClearAll = () => {
    const playerKey = player?.name || 'Spieler';
    onChangeCombatState({
      ...combatState,
      tiles: {},
      placedObjects: [],
      positions: { [playerKey]: { x: 3, y: 10 } }
    });
  };

  const handleRemovePlacedObject = (idOrIds: string | string[]) => {
    const idsToRemove = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const currentObjects = (combatState.placedObjects || []).filter((o: any) => !idsToRemove.includes(o.id));
    onChangeCombatState({
      ...combatState,
      placedObjects: currentObjects
    });
  };

  const handleMovePlacedObject = (id: string, newX: number, newY: number) => {
    const clampedX = Math.max(0, Math.min(gridWidth - 1, isNaN(newX) ? 0 : newX));
    const clampedY = Math.max(0, Math.min(gridHeight - 1, isNaN(newY) ? 0 : newY));
    const currentObjects = (combatState.placedObjects || []).map((o: any) => {
      if (o.id === id) {
        return { ...o, x: clampedX, y: clampedY };
      }
      return o;
    });
    onChangeCombatState({
      ...combatState,
      placedObjects: currentObjects
    });
  };

  const handleCenterOnObject = (col: number, row: number) => {
    // Center view calculated based on grid and tilePx
    const targetX = -(col * tilePx - 200);
    const targetY = -(row * tilePx - 200);
    setPanOffset({ x: targetX, y: targetY });
  };

  const handleSaveEditedToken = (id: string) => {
    if (!editingTokenData) return;
    const currentObjects = (combatState.placedObjects || []).map((o: any) => {
      if (o.id === id) {
        return {
          ...o,
          ...editingTokenData,
          loreEntryId: editingTokenData.loreEntryId || undefined
        };
      }
      return o;
    });
    onChangeCombatState({
      ...combatState,
      placedObjects: currentObjects
    });
    setEditingTokenId(null);
    setEditingTokenData(null);
  };

  const handleQuickLinkTokenToLore = (tokenId: string, loreEntryId: string) => {
    const entry = allLocationEntries.find(l => l.id === loreEntryId) || loreDatabase.find(l => l.id === loreEntryId);
    const currentObjects = (combatState.placedObjects || []).map((o: any) => {
      if (o.id === tokenId) {
        return {
          ...o,
          loreEntryId: loreEntryId || undefined,
          name: entry ? entry.title : o.name
        };
      }
      return o;
    });
    onChangeCombatState({
      ...combatState,
      placedObjects: currentObjects
    });
  };

  const handleGenerateVillage = () => {
    const width = gridWidth;
    const height = gridHeight;
    const newTiles: Record<string, string> = {};
    const newPlacedObjects: any[] = [];
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        newTiles[`${x},${y}`] = 'gras';
      }
    }
    
    const mainRoadY = Math.floor(height / 2);
    for (let x = 0; x < width; x++) {
      newTiles[`${x},${mainRoadY}`] = 'weg';
    }
    
    const mainRoadX = Math.floor(width / 3);
    for (let y = 0; y < height; y++) {
      newTiles[`${mainRoadX},${y}`] = 'weg';
    }
    
    const houseWidth = 3;
    const houseHeight = 3;
    const houses = [
      { x: 3, y: 2, name: 'Bauernhaus' },
      { x: 15, y: 3, name: 'Gasthaus Zum Anker' },
      { x: 10, y: 14, name: 'Hafenschmiede' }
    ];
    
    houses.forEach(house => {
      for (let hx = house.x; hx < house.x + houseWidth; hx++) {
        for (let hy = house.y; hy < house.y + houseHeight; hy++) {
          if (hx < width && hy < height) {
            const currentT = newTiles[`${hx},${hy}`] || '';
            const isPath = currentT === 'weg' || currentT === 'neonweg' || currentT === 'asphalt' || currentT === 'gehweg' || currentT === 'strasse';
            if (!isPath) {
              newTiles[`${hx},${hy}`] = 'haus';
            }
          }
        }
      }
    });
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if ((y < 2 || y > height - 3) && Math.random() < 0.45 && newTiles[`${x},${y}`] === 'gras') {
          newTiles[`${x},${y}`] = 'wald';
        }
        if (x < 2 && Math.random() < 0.3 && newTiles[`${x},${y}`] === 'gras') {
          newTiles[`${x},${y}`] = 'berg';
        }
        if (x > width - 4 && y > 2 && y < height - 2 && Math.random() < 0.5) {
          newTiles[`${x},${y}`] = 'ozean';
        }
      }
    }
    
    const playerKey = player?.name || 'Spieler';
    const newPositions = {
      [playerKey]: { x: 2, y: mainRoadY }
    };
    
    // Default placed tokens
    const sampleTokens = [
      { id: 'st1', name: 'Thousand Sunny', x: width - 2, y: mainRoadY, icon: '⛵', category: 'Schiffe & Fahrzeuge', description: 'Gefährten-Schiff der Strohhut-Bande.' },
      { id: 'st2', name: 'Bauer Alwin', x: mainRoadX - 1, y: mainRoadY - 1, icon: '👤', category: 'Charaktere & NPCs', description: 'Ein fleißiger Bauer.' },
      { id: 'st3', name: 'Schatzkiste', x: 11, y: 13, icon: '💎', category: 'Schätze & Interaktionen', description: 'Eine Truhe mit Beute.' },
      { id: 'st4', name: 'Goblin-Krieger', x: width - 4, y: mainRoadY - 2, icon: '👿', category: 'Gegner & Fraktionen', description: 'Ein feindseliger Späher.' }
    ];
    
    sampleTokens.forEach(t => {
      if (t.x < width && t.y < height) {
        newPlacedObjects.push({
          id: `placed-${Date.now()}-${t.id}`,
          name: t.name,
          icon: t.icon,
          category: t.category,
          description: t.description,
          x: t.x,
          y: t.y
        });
      }
    });
    
    onChangeCombatState({
      ...combatState,
      tiles: newTiles,
      positions: newPositions,
      placedObjects: newPlacedObjects
    });
  };

  // Combined Location & Weltkarte Entries from both loreDatabase AND worldSetting.territories
  const allLocationEntries = useMemo(() => {
    const idMap = new Map<string, LoreEntry>();
    const seenTitles = new Set<string>();

    // 1. Add all loreDatabase 'Orte' entries
    const rawTerritories = worldSetting?.territories || [];
    (loreDatabase || []).filter(l => (l.category as string) === 'Orte' || (l.category as string) === 'Weltkarte').forEach(entry => {
      if (!entry || !entry.id) return;
      const normalizedTitle = (entry.title || '').trim().toLowerCase();
      if (!idMap.has(entry.id) && (!normalizedTitle || !seenTitles.has(normalizedTitle))) {
        // Find matching territory to set rawType
        const matchingTerr = rawTerritories.find((t: any) => {
          const tName = (t.name || t.title || '').trim().toLowerCase();
          const tSynthId = t.id?.startsWith('terr-') ? t.id : `terr-${t.id}`;
          return t.id === entry.id || tSynthId === entry.id || tName === normalizedTitle;
        });

        const updatedEntry: LoreEntry = {
          ...entry,
          details: {
            ...entry.details,
            rawType: matchingTerr?.type || (entry.details?.rawType || 'ort'),
            territoryType: matchingTerr?.type || (entry.details?.territoryType || 'ort'),
            population: matchingTerr?.population || entry.details?.population || '',
            ruler: matchingTerr?.ruler || entry.details?.ruler || '',
            culture: matchingTerr?.culture || entry.details?.culture || entry.details?.kultur || '',
            climate: matchingTerr?.climate || entry.details?.climate || '',
            terrain: matchingTerr?.terrain || entry.details?.terrain || '',
            faction: matchingTerr?.faction || entry.details?.faction || '',
            government: matchingTerr?.government || entry.details?.government || '',
            resources: matchingTerr?.resources || entry.details?.resources || '',
            trade: matchingTerr?.trade || entry.details?.trade || '',
            currency: matchingTerr?.currency || entry.details?.currency || '',
            exports: matchingTerr?.exports || entry.details?.exports || '',
            imports: matchingTerr?.imports || entry.details?.imports || '',
            dangerLevel: matchingTerr?.dangerLevel || entry.details?.dangerLevel || '',
            militaryStrength: matchingTerr?.militaryStrength || entry.details?.militaryStrength || entry.details?.military || '',
            defense: matchingTerr?.defense || entry.details?.defense || '',
            landmarks: matchingTerr?.landmarks || entry.details?.landmarks || '',
            pointsOfInterest: matchingTerr?.pointsOfInterest || entry.details?.pointsOfInterest || '',
            dungeons: matchingTerr?.dungeons || entry.details?.dungeons || '',
            magicPlaces: matchingTerr?.magicPlaces || entry.details?.magicPlaces || '',
            naturalWonders: matchingTerr?.naturalWonders || entry.details?.naturalWonders || ''
          }
        };

        idMap.set(entry.id, updatedEntry);
        if (normalizedTitle) seenTitles.add(normalizedTitle);
      }
    });

    // 2. Add all worldSetting.territories as LoreEntry if not already present
    const seenTerrIds = new Set<string>();
    const territories: any[] = [];
    for (const t of rawTerritories) {
      if (t && t.id && !seenTerrIds.has(t.id)) {
        seenTerrIds.add(t.id);
        territories.push(t);
      }
    }

    territories.forEach((t: any) => {
      const nameStr = t.name || t.title;
      if (!nameStr) return;
      const key = nameStr.trim().toLowerCase();
      const synthId = t.id?.startsWith('terr-') ? t.id : `terr-${t.id}`;

      const existingById = idMap.has(t.id) || idMap.has(synthId);
      const existingByKey = seenTitles.has(key);

      if (!existingById && !existingByKey) {
        const typeLabel = t.type === 'welt' ? 'Welt'
          : t.type === 'meer' ? 'Ozean / Meer'
          : t.type === 'kontinent' ? 'Kontinent'
          : t.type === 'insel' ? 'Insel'
          : t.type === 'stadt' ? 'Stadt'
          : t.type === 'region' ? 'Region'
          : t.type === 'zone' ? 'Zone'
          : t.type === 'gebäude' ? 'Bauwerk'
          : 'Weltkarte';

        const synthEntry: LoreEntry = {
          id: synthId,
          category: 'Weltregeln',
          title: nameStr,
          description: t.description || `Weltkarte-Gebiet (${typeLabel})`,
          isUnlocked: true,
          details: {
            mapLevel: t.type === 'welt' || t.type === 'meer' || t.type === 'kontinent' ? 'macro'
                    : t.type === 'insel' || t.type === 'region' ? 'meso'
                    : 'micro',
            isWeltkarteTerritory: true,
            territoryType: typeLabel,
            rawType: t.type,
            population: t.population || '',
            ruler: t.ruler || '',
            culture: t.culture || '',
            climate: t.climate || '',
            terrain: t.terrain || '',
            faction: t.faction || '',
            government: t.government || '',
            resources: t.resources || '',
            trade: t.trade || '',
            currency: t.currency || '',
            exports: t.exports || '',
            imports: t.imports || '',
            dangerLevel: t.dangerLevel || '',
            militaryStrength: t.militaryStrength || t.military || '',
            defense: t.defense || '',
            landmarks: t.landmarks || '',
            pointsOfInterest: t.pointsOfInterest || '',
            dungeons: t.dungeons || '',
            magicPlaces: t.magicPlaces || '',
            naturalWonders: t.naturalWonders || ''
          }
        };
        idMap.set(synthEntry.id, synthEntry);
        seenTitles.add(key);
      } else if (existingById) {
        const existingId = idMap.has(t.id) ? t.id : synthId;
        const existing = idMap.get(existingId);
        if (existing) {
          existing.details = {
            ...existing.details,
            rawType: t.type,
            territoryType: t.type,
            population: t.population || existing.details?.population || '',
            ruler: t.ruler || existing.details?.ruler || '',
            culture: t.culture || existing.details?.culture || existing.details?.kultur || '',
            climate: t.climate || existing.details?.climate || '',
            terrain: t.terrain || existing.details?.terrain || '',
            faction: t.faction || existing.details?.faction || '',
            government: t.government || existing.details?.government || '',
            resources: t.resources || existing.details?.resources || '',
            trade: t.trade || existing.details?.trade || '',
            currency: t.currency || existing.details?.currency || '',
            exports: t.exports || existing.details?.exports || '',
            imports: t.imports || existing.details?.imports || '',
            dangerLevel: t.dangerLevel || existing.details?.dangerLevel || '',
            militaryStrength: t.militaryStrength || existing.details?.militaryStrength || existing.details?.military || '',
            defense: t.defense || existing.details?.defense || '',
            landmarks: t.landmarks || existing.details?.landmarks || '',
            pointsOfInterest: t.pointsOfInterest || existing.details?.pointsOfInterest || '',
            dungeons: t.dungeons || existing.details?.dungeons || '',
            magicPlaces: t.magicPlaces || existing.details?.magicPlaces || '',
            naturalWonders: t.naturalWonders || existing.details?.naturalWonders || ''
          };
        }
      }
    });

    const uniqueList = Array.from(idMap.values());
    return uniqueList.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'de'));
  }, [loreDatabase, worldSetting?.territories]);

  // Active Location Entry & Extracted Dynamic Tokens
  const activeLocationEntry = useMemo(() => {
    if (!selectedLocationId) {
      return allLocationEntries[0] || null;
    }
    return allLocationEntries.find(l => l.id === selectedLocationId) || loreDatabase.find(l => l.id === selectedLocationId) || null;
  }, [selectedLocationId, allLocationEntries, loreDatabase]);

  const extractedLocationTokens = useMemo(() => {
    if (!activeLocationEntry) return [];
    return extractLocationTokens(activeLocationEntry, loreDatabase, worldSetting);
  }, [activeLocationEntry, loreDatabase, worldSetting]);

  useEffect(() => {
    if (territory?.id) {
      const match = allLocationEntries.find(l => 
        l.id === territory.id || 
        l.id === `terr-${territory.id}` || 
        (l.title && territory.name && l.title.trim().toLowerCase() === territory.name.trim().toLowerCase())
      );
      if (match) {
        setSelectedLocationId(match.id);
      } else {
        setSelectedLocationId(territory.id);
      }
      setTokenMainTab('location');
    } else if (!selectedLocationId && allLocationEntries.length > 0) {
      setSelectedLocationId(allLocationEntries[0].id);
    }
  }, [territory?.id, territory?.name, allLocationEntries]);

  const handleAutoPlaceLocationGarrison = (locationTokens: ExtractedLocationToken[]) => {
    if (!locationTokens || locationTokens.length === 0) return;

    const currentObjects = [...(combatState.placedObjects || [])];
    const tiles = combatState.tiles || {};
    
    // Find empty/available cells
    const occupied = new Set<string>();
    currentObjects.forEach(obj => {
      occupied.add(`${obj.x},${obj.y}`);
    });

    const waterCells: Array<{ x: number; y: number }> = [];
    const landCells: Array<{ x: number; y: number }> = [];

    for (let r = 0; r < gridHeight; r++) {
      for (let c = 0; c < gridWidth; c++) {
        const key = `${c},${r}`;
        if (!occupied.has(key)) {
          const tType = (tiles[key] || selectedTerrain || 'gras').toLowerCase();
          if (tType.includes('wasser') || tType.includes('ozean') || tType.includes('fluss') || tType.includes('see')) {
            waterCells.push({ x: c, y: r });
          } else {
            landCells.push({ x: c, y: r });
          }
        }
      }
    }

    // Proper Fisher-Yates shuffle for natural, distributed token placement
    const fyShuffleManual = (arr: any[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };
    fyShuffleManual(waterCells);
    fyShuffleManual(landCells);

    let placedCount = 0;

    locationTokens.forEach((tok) => {
      let targetCell: { x: number; y: number } | undefined;

      if (tok.group === 'ships' && waterCells.length > 0) {
        targetCell = waterCells.pop();
      } else if (landCells.length > 0) {
        targetCell = landCells.pop();
      } else if (waterCells.length > 0) {
        targetCell = waterCells.pop();
      }

      if (targetCell) {
        currentObjects.push({
          id: `placed-autoloc-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          name: tok.name,
          icon: tok.icon,
          category: tok.category,
          description: tok.description,
          loreEntryId: tok.loreEntryId,
          population: tok.population,
          minCrew: tok.minCrew,
          maxCapacity: tok.maxCapacity,
          shipSize: tok.shipSize,
          defense: tok.defense,
          attack: tok.attack,
          durability: tok.durability,
          x: targetCell.x,
          y: targetCell.y
        });
        placedCount++;
      }
    });

    onChangeCombatState({
      ...combatState,
      placedObjects: currentObjects
    });

    setAiSuccessMessage(`✨ ${placedCount} Orts-Einheiten, Schiffe & Gebäude wurden auf der Rasterkarte angeordnet!`);
    setTimeout(() => setAiSuccessMessage(null), 5000);
  };

  const subTerritoriesCount = useMemo(() => {
    const allTerritories: any[] = worldSetting?.territories || [];
    const currentTerritoryId = territory?.id;
    const currentTerritoryName = territory?.name;

    let subs = allTerritories.filter((t: any) => {
      if (!currentTerritoryId && !currentTerritoryName) return false;
      if (t.id === currentTerritoryId) return false;
      return t.parentId === currentTerritoryId || t.parentId === currentTerritoryName;
    });

    if (subs.length === 0 && allTerritories.length > 0) {
      if (!territory || territory.type === 'welt' || territory.type === 'meer' || !territory.parentId) {
        subs = allTerritories.filter((t: any) => t.id !== currentTerritoryId);
      }
    }

    return subs.length;
  }, [worldSetting?.territories, territory]);

  // Contextual helper to filter lore entries based on token context (e.g. Orte -> strictly 'Orte' & Weltkarte)
  const getContextualLoreEntries = (tokenCategory?: string, subTab?: string) => {
    let targetCategory: string | null = null;

    if (
      subTab === 'places' ||
      subTab === 'buildings' ||
      subTab === 'hospitality' ||
      subTab === 'shops' ||
      subTab === 'industry' ||
      subTab === 'constructions' ||
      tokenCategory === 'Marker & Orte' ||
      tokenCategory === 'Siedlungen & Orte' ||
      tokenCategory === 'Gebäude & Bauwerke' ||
      tokenCategory === 'Ort'
    ) {
      targetCategory = 'Orte';
    } else if (
      subTab === 'characters' ||
      tokenCategory === 'Charaktere & NPCs' ||
      tokenCategory === 'Charakter'
    ) {
      targetCategory = 'Charaktere';
    } else if (
      subTab === 'factions' ||
      tokenCategory === 'Gegner & Fraktionen' ||
      tokenCategory === 'Fraktion'
    ) {
      targetCategory = 'Fraktionen';
    } else if (
      subTab === 'ships' ||
      subTab === 'treasures' ||
      tokenCategory === 'Schiffe & Fahrzeuge' ||
      tokenCategory === 'Schätze & Interaktionen'
    ) {
      targetCategory = 'Gegenstände';
    }

    if (targetCategory === 'Orte') {
      return allLocationEntries;
    } else if (targetCategory) {
      const matches = loreDatabase.filter(e => e.category === targetCategory);
      if (matches.length > 0) return matches;
    }

    const nonOrte = loreDatabase.filter(e => (e.category as string) !== 'Orte' && (e.category as string) !== 'Weltkarte');
    return [...allLocationEntries, ...nonOrte];
  };

  // Helper to group lore entries by category with 'Orte' at the top
  const getGroupedLoreEntries = (entries: LoreEntry[]) => {
    const categoryOrder: string[] = [
      'Orte',
      'Charaktere',
      'Fraktionen',
      'Gegenstände',
      'Story & Quests',
      'Weltregeln',
      'Gegner',
      'Verbotenes Wissen',
      'Zeitlinie'
    ];

    const categoryLabels: Record<string, string> = {
      'Orte': '📍 Orte & Weltkarte (Kodex & Karte)',
      'Charaktere': '👥 Charaktere & NPCs',
      'Fraktionen': '🛡️ Fraktionen & Gruppen',
      'Gegenstände': '🎒 Gegenstände & Schiffe',
      'Story & Quests': '📜 Story & Quests',
      'Weltregeln': '📜 Weltregeln',
      'Gegner': '⚔️ Gegner',
      'Verbotenes Wissen': '🔮 Verbotenes Wissen',
      'Zeitlinie': '⏳ Zeitlinie'
    };

    const grouped: { label: string; category: string; items: LoreEntry[] }[] = [];

    categoryOrder.forEach(cat => {
      const items = entries.filter(e => {
        if (cat === 'Orte') {
          return (e.category as string) === 'Orte' || (e.category as string) === 'Weltkarte' || (e.details as any)?.isWeltkarteTerritory;
        }
        return e.category === cat;
      });
      if (items.length > 0) {
        grouped.push({
          label: categoryLabels[cat] || cat,
          category: cat,
          items
        });
      }
    });

    const handledCategories = new Set(categoryOrder);
    const remaining = entries.filter(e => !handledCategories.has(e.category as any));
    if (remaining.length > 0) {
      grouped.push({
        label: '📂 Weitere Kodex-Einträge',
        category: 'Andere',
        items: remaining
      });
    }

    return grouped;
  };

  // Filtered Codex Entries for Picker Tab
  const filteredCodexEntries = loreDatabase.filter(entry => {
    if (codexCategoryFilter !== 'all' && entry.category !== codexCategoryFilter) return false;
    if (codexSearchQuery.trim()) {
      const q = codexSearchQuery.toLowerCase();
      const titleMatch = (entry.title || '').toLowerCase().includes(q);
      const descMatch = (entry.description || '').toLowerCase().includes(q);
      return titleMatch || descMatch;
    }
    return true;
  });

  // Characters without any Faction from Codex (including those with deleted/invalid factions)
  const independentCharacters = useMemo(() => {
    const officialFactionNames = new Set(
      loreDatabase.filter(e => e.category === 'Fraktionen').map(e => e.title.toLowerCase().trim())
    );
    return loreDatabase.filter(e => {
      const isChar = e.category === 'Charaktere' || (e.category as any) === 'NPCs';
      if (!isChar) return false;
      const faction = getCharacterFaction(e);
      if (!faction) return true;
      // If faction is set but does not match any official faction, treat as independent
      const fNames = faction.split(',').map(f => f.trim().toLowerCase()).filter(Boolean);
      return fNames.every(fName => !officialFactionNames.has(fName));
    });
  }, [loreDatabase]);

  // Factions & Grouped characters from Codex (each getting a distinct color circle)
  const factionGroups = useMemo(() => {
    const factionEntries = loreDatabase.filter(e => e.category === 'Fraktionen');
    const map = new Map<string, { factionEntry?: LoreEntry; members: LoreEntry[] }>();

    factionEntries.forEach(f => {
      if (!map.has(f.title)) {
        map.set(f.title, { factionEntry: f, members: [] });
      }
    });

    const officialFactionNamesLower = new Set(factionEntries.map(f => f.title.toLowerCase().trim()));

    loreDatabase.forEach(e => {
      if (e.category === 'Charaktere' || e.category === 'Gegner' || (e.category as any) === 'NPCs' || (e.category as any) === 'Monster' || (e.category as any) === 'Feinde') {
        const fNameRaw = getCharacterFaction(e);
        if (fNameRaw) {
          // Split by comma in case the character belongs to multiple factions
          const fNames = fNameRaw.split(',').map(f => f.trim()).filter(Boolean);
          fNames.forEach(fName => {
            if (fName && officialFactionNamesLower.has(fName.toLowerCase())) {
              // Use the canonical casing from the official faction entry
              const canonicalEntry = factionEntries.find(f => f.title.toLowerCase() === fName.toLowerCase());
              const canonicalName = canonicalEntry ? canonicalEntry.title : fName;

              if (!map.has(canonicalName)) {
                map.set(canonicalName, { members: [] });
              }
              const groupObj = map.get(canonicalName)!;
              if (!groupObj.members.some(m => m.id === e.id)) {
                groupObj.members.push(e);
              }
            }
          });
        }
      }
    });

    const result: { name: string; factionEntry?: LoreEntry; members: LoreEntry[]; color: typeof FACTION_COLORS[0] }[] = [];
    let idx = 0;
    map.forEach((val, name) => {
      // Sort members alphabetically by title for a better overview!
      const sortedMembers = [...val.members].sort((a, b) => a.title.localeCompare(b.title, 'de'));
      result.push({
        name,
        factionEntry: val.factionEntry,
        members: sortedMembers,
        color: FACTION_COLORS[idx % FACTION_COLORS.length]
      });
      idx++;
    });

    return result;
  }, [loreDatabase]);

  const allFactionNames = useMemo(() => factionGroups.map(f => f.name), [factionGroups]);

  // All Enemies/Monsters (from Codex + active combat) -> All RED circles
  const enemyEntries = useMemo(() => {
    const codexEnemies = loreDatabase.filter(e => 
      e.category === 'Gegner' || (e.category as any) === 'Monster' || (e.category as any) === 'Feinde'
    );
    const combatEnemies = (combatState.opponents || []).map((opp: any) => ({
      id: opp.id,
      title: opp.name,
      category: 'Gegner',
      description: `${opp.role || 'Gegner'} - HP: ${opp.hp}/${opp.maxHp}`,
      isUnlocked: true
    }));
    return [...codexEnemies, ...combatEnemies];
  }, [loreDatabase, combatState.opponents]);

  // Filtered Codex items for ships & vehicles
  const codexShips = useMemo(() => {
    return loreDatabase.filter(e => 
      e.category === 'Gegenstände' && 
      (e.details?.itemType?.toLowerCase().includes('schiff') || 
       e.details?.itemType?.toLowerCase().includes('fahrzeug') || 
       e.details?.itemType?.toLowerCase().includes('transport') || 
       e.details?.shipSize !== undefined ||
       e.title.toLowerCase().includes('schiff') || 
       e.title.toLowerCase().includes('boot') || 
       e.title.toLowerCase().includes('galleone') || 
       e.title.toLowerCase().includes('sunny') || 
       e.title.toLowerCase().includes('merry') || 
       e.title.toLowerCase().includes('luftschiff') || 
       e.title.toLowerCase().includes('zeppelin') || 
       e.title.toLowerCase().includes('vehikel') || 
       e.title.toLowerCase().includes('fahrzeug') || 
       e.title.toLowerCase().includes('karren') || 
       e.title.toLowerCase().includes('kutsche'))
    );
  }, [loreDatabase]);

  // All other Gegenstände are treasures & interactions
  const codexTreasures = useMemo(() => {
    const shipIds = new Set(codexShips.map(s => s.id));
    return loreDatabase.filter(e => e.category === 'Gegenstände' && !shipIds.has(e.id));
  }, [loreDatabase, codexShips]);

  // Filtered location entries for buildings & landmarks vs places
  const codexBuildings = useMemo(() => {
    const ortsBuildings = allLocationEntries.filter(e => 
      ((e.category as string) === 'Orte' || (e.category as string) === 'Weltkarte') && 
      (e.title.toLowerCase().includes('turm') || 
       e.title.toLowerCase().includes('festung') || 
       e.title.toLowerCase().includes('burg') || 
       e.title.toLowerCase().includes('schloss') || 
       e.title.toLowerCase().includes('palast') || 
       e.title.toLowerCase().includes('haus') || 
       e.title.toLowerCase().includes('hütte') || 
       e.title.toLowerCase().includes('tempel') || 
       e.title.toLowerCase().includes('ruine') || 
       e.title.toLowerCase().includes('gebäude') || 
       e.title.toLowerCase().includes('schmiede') || 
       e.title.toLowerCase().includes('mühle') || 
       e.title.toLowerCase().includes('werft') || 
       e.title.toLowerCase().includes('hafen') || 
       e.title.toLowerCase().includes('schenke') || 
       e.title.toLowerCase().includes('gasthaus') || 
       e.title.toLowerCase().includes('friedhof') || 
       e.title.toLowerCase().includes('krypta') || 
       e.details?.territoryType?.toLowerCase()?.includes('bauwerk') ||
       e.details?.type === 'gebäude')
    );
    const itemBuildings = loreDatabase.filter(e =>
      e.category === 'Gegenstände' &&
      (e.details?.itemType?.toLowerCase().includes('gebäude') ||
       e.details?.itemType?.toLowerCase().includes('festung') ||
       e.details?.itemType?.toLowerCase().includes('bauwerk') ||
       e.details?.itemType?.toLowerCase().includes('geschütz') ||
       e.details?.itemType?.toLowerCase().includes('belagerungs'))
    );
    return [...ortsBuildings, ...itemBuildings];
  }, [allLocationEntries, loreDatabase]);

  const codexPlaces = useMemo(() => {
    const bldIds = new Set(codexBuildings.map(b => b.id));
    return allLocationEntries.filter(e => ((e.category as string) === 'Orte' || (e.category as string) === 'Weltkarte') && !bldIds.has(e.id));
  }, [allLocationEntries, codexBuildings]);

  // Get color circle dot style for a token
  const getTokenCircleStyle = (category: string, factionName?: string, isPlayer?: boolean) => {
    if (isPlayer) {
      return { bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-amber-300', dotBg: '#f59e0b', label: 'Spieler' };
    }
    const cat = (category || '').toLowerCase();
    if (cat.includes('gegner') || cat.includes('monster') || cat.includes('feind')) {
      return { bg: 'bg-red-600', border: 'border-red-400', text: 'text-red-300', dotBg: '#ef4444', label: 'Gegner' };
    }
    if (factionName) {
      const color = FACTION_COLORS[allFactionNames.indexOf(factionName) % FACTION_COLORS.length] || FACTION_COLORS[0];
      return { bg: color.bg, border: color.border, text: color.text, dotBg: color.dotBg, label: factionName };
    }
    if (cat.includes('schiff') || cat.includes('fahrzeug')) {
      return { bg: 'bg-sky-600', border: 'border-sky-400', text: 'text-sky-300', dotBg: '#0ea5e9', label: 'Schiff' };
    }
    if (cat.includes('schatz') || cat.includes('beute') || cat.includes('interaktion')) {
      return { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-300', dotBg: '#a855f7', label: 'Schatz' };
    }
    if (cat.includes('charaktere') || cat.includes('npc') || cat.includes('bewohner')) {
      return { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-300', dotBg: '#10b981', label: 'Charakter' };
    }
    if (cat.includes('fraktion') || cat.includes('gruppe')) {
      return { bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-indigo-300', dotBg: '#6366f1', label: 'Fraktion' };
    }
    if (cat.includes('gebäude') || cat.includes('bauwerk')) {
      return { bg: 'bg-amber-700', border: 'border-amber-400', text: 'text-amber-300', dotBg: '#d97706', label: 'Gebäude' };
    }
    if (cat.includes('ort') || cat.includes('siedlung') || cat.includes('landmark')) {
      return { bg: 'bg-orange-600', border: 'border-orange-400', text: 'text-orange-300', dotBg: '#f97316', label: 'Ort' };
    }
    return { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-300', dotBg: '#10b981', label: 'Marker' };
  };

  // Grid cells preparation
  const cells = [];
  const tiles = combatState.tiles || {};
  const placedObjects = combatState.placedObjects || [];
  const positions = combatState.positions || {};
  const playerKey = player?.name || 'Spieler';

  for (let r = 0; r < gridHeight; r++) {
    for (let c = 0; c < gridWidth; c++) {
      const coordKey = `${c},${r}`;
      const terrainType = tiles[coordKey];
      const customStyle = terrainType ? getCustomTerrainStyle(terrainType) : null;
      
      const cellTokens = [];

      // Check if player is on this tile
      if (positions[playerKey] && positions[playerKey].x === c && positions[playerKey].y === r) {
        cellTokens.push({
          id: 'player-token',
          icon: '⚡',
          label: playerKey,
          category: 'Spieler',
          isPlayer: true
        });
      }

      // Check if other placed objects are on this tile (excluding zones, which are handled separately)
      const matchingObjs = placedObjects.filter((o: any) => o.x === c && o.y === r && o.category !== 'Gebiet & Zone');
      matchingObjs.forEach((obj: any) => {
        const typeLower = (obj.typeLabel || obj.type || '').toLowerCase();
        const nameLower = (obj.name || '').toLowerCase();
        const catLower = (obj.category || '').toLowerCase();

        const icon = obj.icon || (
          typeLower.includes('vulkan') || nameLower.includes('vulkan') ? '🌋' :
          typeLower.includes('stadt') || nameLower.includes('stadt') ? '🏙️' :
          typeLower.includes('hafen') || nameLower.includes('hafen') ? '⚓' :
          typeLower.includes('dorf') || typeLower.includes('ort') || nameLower.includes('dorf') ? '🏘️' :
          typeLower.includes('berg') || nameLower.includes('berg') ? '🏔️' :
          typeLower.includes('ruine') || nameLower.includes('ruine') ? '🏛️' :
          catLower.includes('schiff') ? '⛵' :
          catLower.includes('gegner') ? '⚔️' :
          catLower.includes('schatz') ? '💎' :
          '📍'
        );

        let loreEntry: LoreEntry | undefined = undefined;
        if (obj.loreEntryId) {
          loreEntry = allLocationEntries.find(l => l.id === obj.loreEntryId) || loreDatabase.find(l => l.id === obj.loreEntryId);
        }

        cellTokens.push({
          id: obj.id,
          icon,
          label: obj.name,
          category: obj.category || 'Objekt',
          loreEntryId: obj.loreEntryId,
          loreEntry,
          faction: obj.faction,
          isPlayer: false,
          currentCount: obj.currentCount,
          maxCapacity: obj.maxCapacity,
          color: obj.color,
          population: obj.population,
          defense: obj.defense,
          attack: obj.attack,
          durability: obj.durability
        });
      });

      // Check if this cell belongs to any custom zone
      const cellZones = placedObjects
        .filter((o: any) => 
          (o.category === 'Gebiet & Zone' || o.zoneCells) && 
          o.zoneCells?.some((cz: any) => cz.x === c && cz.y === r)
        )
        .map((zone: any) => {
          let loreEntry: LoreEntry | undefined = undefined;
          if (zone.loreEntryId) {
            loreEntry = allLocationEntries.find(l => l.id === zone.loreEntryId) || loreDatabase.find(l => l.id === zone.loreEntryId);
          }
          return {
            ...zone,
            loreEntry
          };
        });

      cells.push({
        col: c,
        row: r,
        coordKey,
        terrainType,
        customStyle,
        tokenIcon: cellTokens[0]?.icon || '',
        tokenLabel: cellTokens[0]?.label || '',
        tokenCategory: cellTokens[0]?.category || '',
        tokenLoreEntryId: cellTokens[0]?.loreEntryId || '',
        tokenLoreEntry: cellTokens[0]?.loreEntry,
        tokenFaction: cellTokens[0]?.faction,
        isPlayer: cellTokens[0]?.isPlayer || false,
        tokens: cellTokens,
        cellZones: cellZones
      });
    }
  }

  // Get color styles for placed tokens based on category
  const getTokenColorStyle = (category: string, isPlayer: boolean, customColor?: string) => {
    if (isPlayer) {
      return 'bg-amber-600 border-amber-300 text-white shadow-amber-500/50';
    }
    const cat = (category || '').toLowerCase();
    if (cat.includes('gebiet') || cat.includes('zone') || cat.includes('region')) {
      return 'bg-amber-600/90 border-amber-400 text-white shadow-amber-500/50';
    }
    if (cat.includes('schiff') || cat.includes('fahrzeug')) {
      return 'bg-sky-600 border-sky-300 text-white shadow-sky-500/50';
    }
    if (cat.includes('schatz') || cat.includes('beute') || cat.includes('interaktion')) {
      return 'bg-purple-600 border-purple-300 text-white shadow-purple-500/50';
    }
    if (cat.includes('gegner') || cat.includes('monster') || cat.includes('feind')) {
      return 'bg-red-600 border-red-300 text-white shadow-red-500/50';
    }
    if (cat.includes('charaktere') || cat.includes('npc') || cat.includes('bewohner')) {
      return 'bg-emerald-600 border-emerald-300 text-white shadow-emerald-500/50';
    }
    if (cat.includes('fraktion') || cat.includes('gruppe')) {
      return 'bg-indigo-600 border-indigo-300 text-white shadow-indigo-500/50';
    }
    if (cat.includes('gebäude') || cat.includes('bauwerk')) {
      return 'bg-amber-700 border-amber-300 text-white shadow-amber-500/50';
    }
    if (cat.includes('ort') || cat.includes('siedlung') || cat.includes('landmark')) {
      return 'bg-orange-600 border-orange-300 text-white shadow-orange-500/50';
    }
    return 'bg-amber-700 border-amber-400 text-white shadow-amber-500/50';
  };

  const getZoneRgba = (hexColor: string = '#f59e0b', alpha: number = 0.15) => {
    const hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } else if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return `rgba(245, 158, 11, ${alpha})`;
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-5 shadow-2xl">
      {/* Header Info */}
      <div className="space-y-1 border-b border-slate-800 pb-4">
        <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
          <i className="fa-solid fa-gamepad text-amber-500"></i> Taktisches Schlachtfeld & Raster-Designer
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Zeichne Geländetypen, platziere Schiffe, Fahrzeuge, NPCs, Schätze & Gegner direkt aus dem Kodex oder erstelle eigene Token.
        </p>
      </div>

      {/* 🛠️ Werkzeug- & Modus-Menüleiste */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Left: Mode Selection Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTool('terrain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTool === 'terrain'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30 font-black'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🌿 Gelände</span>
          </button>

          <button
            onClick={() => setActiveTool('token')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTool === 'token'
                ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
            }`}
          >
            <span>🎭 Token / Einheiten platzieren</span>
          </button>

          <button
            onClick={() => setActiveTool('player')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTool === 'player'
                ? 'bg-amber-600 border-amber-400 text-white shadow-md font-black'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>⚡ Spieler</span>
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTool === 'eraser'
                ? 'bg-red-600 border-red-400 text-white shadow-md font-black'
                : 'bg-slate-900 border-slate-800 text-red-400 hover:bg-slate-800'
            }`}
          >
            <span>🧹 Radiergummi</span>
          </button>

          <button
            onClick={() => setActiveTool('zone')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTool === 'zone'
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md font-black ring-2 ring-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>🗺️ Zone markieren</span>
          </button>

          <button
            onClick={() => setActiveTool('pan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeTool === 'pan'
                ? 'bg-sky-600 border-sky-400 text-white shadow-md font-black'
                : 'bg-slate-900 border-slate-800 text-sky-400 hover:bg-slate-800'
            }`}
          >
            <Hand className="w-3.5 h-3.5" /> Kamera bewegen
          </button>
        </div>

        {/* Right: Quick Settings & Camera Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPanOffset({ x: 0, y: 0 })}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer"
            title="Kamera-Position zentrieren"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> <span className="hidden sm:inline">Kamera Reset</span>
          </button>

          <button
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isSettingsExpanded
                ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <i className="fa-solid fa-sliders text-amber-500"></i>
            <span>Maße & KI</span>
            {isSettingsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 🌿 SUB-BAR: Geländewahl & Flächenwerkzeuge (Wenn Terrain oder Eraser Modus aktiv) */}
      {(activeTool === 'terrain' || activeTool === 'eraser') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-950/90 p-3.5 rounded-xl border border-emerald-500/40 space-y-3 shadow-2xl"
        >
          {/* Top Row: Category, Pattern & Auto-Decorate */}
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-800/80 pb-3">
            {activeTool === 'terrain' && (
              <>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  🌿 Kategorie:
                </span>
                <select
                  value={selectedTerrainCategory}
                  onChange={(e) => {
                    const cat = e.target.value as any;
                    setSelectedTerrainCategory(cat);
                    if (cat === 'fantasy') setSelectedTerrain('gras');
                    else if (cat === 'scifi') setSelectedTerrain('metall');
                    else if (cat === 'modern') setSelectedTerrain('asphalt');
                    else setSelectedTerrain('blut');
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs px-2.5 py-1 rounded-lg outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="fantasy">⚔️ Fantasy, Ozean & Natur</option>
                  <option value="scifi">🚀 Sci-Fi & Cyberpunk</option>
                  <option value="modern">🏚️ Endzeit & Modern</option>
                  <option value="horror">🩸 Horror & Okkult</option>
                </select>

                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Muster:</span>
                <select
                  value={selectedTerrain}
                  onChange={(e) => setSelectedTerrain(e.target.value)}
                  className="bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs px-3 py-1 rounded-lg outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {(
                    selectedTerrainCategory === 'fantasy' ? [
                      { id: 'gras', label: '🌿 Gras (Normal)' },
                      { id: 'ozean', label: '🌊 Ozean / Meer' },
                      { id: 'insel', label: '🏝️ Insel / Strand' },
                      { id: 'landfläche', label: '🗺️ Landfläche / Festland' },
                      { id: 'hafen', label: '⚓ Hafen / Steg' },
                      { id: 'roteline', label: '🧱 Red Line / Felsmauer' },
                      { id: 'grandline', label: '⚡ Strömung / Seewind' },
                      { id: 'weg', label: '🛣️ Weg (Schnell)' },
                      { id: 'wald', label: '🌲 Wald (Langsam)' },
                      { id: 'haus', label: '🏠 Gebäude / Mauer' },
                      { id: 'berg', label: '🏔️ Berg (Blockiert)' },
                      { id: 'fluss', label: '🌊 Fluss (Wasser)' },
                      { id: 'sumpf', label: '🐸 Sumpf (Sehr Langsam)' },
                      { id: 'wueste', label: '🏜️ Wüste (Sand)' },
                      { id: 'schnee', label: '❄️ Schnee (Eis)' },
                      { id: 'vulkan', label: '🌋 Lava (Gefahr)' },
                      { id: 'hoehle', label: '🕳️ Höhle' },
                      { id: 'strand', label: '🏖️ Strand' },
                      { id: 'bruecke', label: '🌉 Brücke' },
                      { id: 'ruine', label: '🏛️ Ruine / Tempel' }
                    ] : selectedTerrainCategory === 'scifi' ? [
                      { id: 'metall', label: '🏢 Metall-Platten' },
                      { id: 'plasma', label: '🧪 Plasma-Feld (Gefahr)' },
                      { id: 'neonweg', label: '🌆 Neonweg' },
                      { id: 'server', label: '💻 Server-Rack' },
                      { id: 'laserwand', label: '🚨 Laserbarriere' },
                      { id: 'weltraum', label: '🌌 All/Vakuum' },
                      { id: 'biolabor', label: '🧬 Bio-Silo' }
                    ] : selectedTerrainCategory === 'modern' ? [
                      { id: 'asphalt', label: '🛣️ Asphaltstrasse' },
                      { id: 'gehweg', label: '🧱 Gehweg' },
                      { id: 'schutt', label: '🪨 Schutt/Ruinen' },
                      { id: 'saeure', label: '☢️ Säurepool' },
                      { id: 'zaun', label: '🚧 Zaun / Barrikade' }
                    ] : [
                      { id: 'blut', label: '🩸 Blutpool' },
                      { id: 'krypta', label: '🪦 Krypta' },
                      { id: 'knochen', label: '🦴 Knochenfeld' },
                      { id: 'schatten', label: '👁️ Schattengrund' }
                    ]
                  ).map(item => (
                    <option key={item.id} value={item.id} className="bg-slate-950 text-slate-200">
                      {item.label}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 md:ml-auto bg-emerald-950/30 border border-emerald-500/30 px-3 py-1 rounded-lg select-none hover:bg-emerald-950/50 transition-all">
                  <input
                    id="auto-decorate-toggle"
                    type="checkbox"
                    checked={autoDecorate}
                    onChange={(e) => setAutoDecorate(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-slate-700 bg-slate-950 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="auto-decorate-toggle" className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-1.5">
                    🌳 <span className="text-emerald-400 font-extrabold">Kombi-Modus:</span> Token miterzeugen
                  </label>
                </div>
              </>
            )}

            {activeTool === 'eraser' && (
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                <span>🧹 Radiergummi-Modus: Wähle Pinselgröße, Rechteck-Auswahl oder Farbeimer zum Entfernen von Gelände!</span>
              </div>
            )}
          </div>

          {/* Bottom Row: Area Editing Tools (Pinselmodus, Pinselgröße, Rechteck, Farbeimer, Bulk Fill) */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Tool Mode Selection */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Flächen-Werkzeug:</span>
              
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTerrainBrushMode('brush')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    terrainBrushMode === 'brush'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Standard Pinsel (Einzeln oder Radius)"
                >
                  <Paintbrush className="w-3.5 h-3.5" /> Pinsel
                </button>

                <button
                  type="button"
                  onClick={() => setTerrainBrushMode('box')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    terrainBrushMode === 'box'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Rechteckbereich mit der Maus aufziehen"
                >
                  <Square className="w-3.5 h-3.5" /> Rechteck (Ziehen)
                </button>

                <button
                  type="button"
                  onClick={() => setTerrainBrushMode('fill')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    terrainBrushMode === 'fill'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Farbeimer: Zusammenhängende Fläche automatisch füllen"
                >
                  <PaintBucket className="w-3.5 h-3.5" /> Farbeimer (Flood Fill)
                </button>
              </div>

              {/* Brush Size Picker (if brush mode) */}
              {terrainBrushMode === 'brush' && (
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Größe:</span>
                  {[1, 2, 3, 5, 7].map(sz => (
                    <button
                      key={`brush-sz-${sz}`}
                      type="button"
                      onClick={() => setTerrainBrushSize(sz)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-black transition-all cursor-pointer border ${
                        terrainBrushSize === sz
                          ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {sz}x{sz}
                    </button>
                  ))}

                  {/* Brush Shape Toggle */}
                  {terrainBrushSize > 1 && (
                    <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 ml-1">
                      <button
                        type="button"
                        onClick={() => setTerrainBrushShape('square')}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          terrainBrushShape === 'square' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500'
                        }`}
                        title="Quadratische Form"
                      >
                        <Square className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTerrainBrushShape('circle')}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          terrainBrushShape === 'circle' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-500'
                        }`}
                        title="Runde Form"
                      >
                        <Circle className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Schnell-Aktionen (Massen-Füllen / Raster füllen) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleFillEntireGrid('all')}
                className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Füllt das komplette Raster (alle Kacheln) mit dem gewählten Gelände"
              >
                <Maximize2 className="w-3 h-3 text-emerald-400" /> Ganzes Raster füllen
              </button>

              <button
                type="button"
                onClick={() => handleFillEntireGrid('empty')}
                className="px-2.5 py-1 bg-sky-900/50 hover:bg-sky-800 text-sky-200 border border-sky-700/50 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Füllt nur noch unbesetzte/leere Kacheln"
              >
                <Layers className="w-3 h-3 text-sky-400" /> Leere füllen
              </button>

              <button
                type="button"
                onClick={() => handleFillEntireGrid('clear')}
                className="px-2 py-1 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/60 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ml-1"
                title="Setzt alle Geländekacheln zurück"
              >
                <Trash2 className="w-3 h-3 text-red-400" /> Alles leeren
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 🗺️ SUB-BAR: GEBIET & ZONE MARKIEREN (Wenn Zone-Modus aktiv) */}
      {activeTool === 'zone' && (
        <motion.div
          id="zone-tool-subbar"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-3.5 shadow-xl"
        >
          {/* Header & Instructions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                🗺️ {editingZoneId ? 'Gebiet & Zone bearbeiten' : 'Gebiet & Zone markieren'}
              </span>
            </div>
            {selectedZoneCells.length > 0 && (
              <button
                onClick={() => setSelectedZoneCells([])}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0"
              >
                Auswahl aufheben
              </button>
            )}
          </div>

          {/* Form & Config for Zone */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Codex Link dropdown (Col-span-7) */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Verknüpfter Kodex-Eintrag:</label>
                <select
                  value={zoneLoreEntryId}
                  onChange={(e) => setZoneLoreEntryId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 outline-none font-bold cursor-pointer hover:border-amber-500/50 focus:border-amber-500 transition-all"
                >
                  <option value="">-- Wähle den Kodex-Eintrag für dieses Gebiet --</option>
                  {(() => {
                    // Collect entries of type 'locations'
                    const entries = [...allLocationEntries];
                    // Filter duplicates by ID
                    const uniqueEntries: LoreEntry[] = [];
                    const seen = new Set();
                    entries.forEach(item => {
                      if (item && item.id && !seen.has(item.id)) {
                        seen.add(item.id);
                        uniqueEntries.push(item);
                      }
                    });

                    // Only keep entries whose rawType or territoryType is welt, region, meer, zone, kontinent
                    const filteredEntries = uniqueEntries.filter(entry => {
                      const rt = (entry.details?.rawType || '').toLowerCase();
                      const tt = (entry.details?.territoryType || '').toLowerCase();

                      return (
                        rt === 'welt' || rt === 'weltkarte' || rt === 'region' || rt === 'meer' || rt === 'zone' || rt === 'kontinent' ||
                        tt === 'welt' || tt === 'weltkarte' || tt === 'region' || tt === 'meer' || tt === 'zone' || tt === 'kontinent' ||
                        tt === 'ozean / meer' || tt === 'ocean / meer' || tt === 'ozean' ||
                        entry.description?.toLowerCase().includes('weltkarte-gebiet')
                      );
                    });

                    // Fallback to all Orte if no filtered matching ones exist yet
                    const entriesToUse = filteredEntries.length > 0 ? filteredEntries : uniqueEntries;

                    // Group by type/category
                    const getGroupLabel = (entry: LoreEntry) => {
                      const rt = (entry.details?.rawType || '').toLowerCase();
                      const tt = (entry.details?.territoryType || '').toLowerCase();

                      if (rt === 'welt' || rt === 'weltkarte' || tt === 'welt' || tt === 'weltkarte') {
                        return 'Weltkarte';
                      }
                      if (rt === 'meer' || tt === 'meer' || tt === 'ozean / meer' || tt === 'ocean / meer' || tt === 'ozean') {
                        return 'Ozean / Meer';
                      }
                      if (rt === 'region' || tt === 'region') {
                        return 'Regionen';
                      }
                      if (rt === 'zone' || tt === 'zone') {
                        return 'Zonen';
                      }
                      if (rt === 'kontinent' || tt === 'kontinent') {
                        return 'Kontinente';
                      }
                      return 'Andere Gebiete';
                    };

                    const grouped: Record<string, LoreEntry[]> = {};
                    entriesToUse.forEach(entry => {
                      const grp = getGroupLabel(entry);
                      if (!grouped[grp]) grouped[grp] = [];
                      grouped[grp].push(entry);
                    });

                    const groupOrder = ['Weltkarte', 'Kontinente', 'Ozean / Meer', 'Regionen', 'Zonen', 'Andere Gebiete'];
                    return groupOrder.filter(grp => grouped[grp] && grouped[grp].length > 0).map(grp => (
                      <optgroup key={`grp-${grp}`} label={grp} className="bg-slate-900 text-amber-300 font-bold">
                        {grouped[grp].map(entry => (
                          <option key={entry.id} value={entry.id} className="bg-slate-950 text-slate-100 font-normal">
                            {entry.title}
                          </option>
                        ))}
                      </optgroup>
                    ));
                  })()}
                </select>
              </div>
            </div>

            {/* Flächen-Werkzeug Mode Selection (Col-span-5) */}
            <div className="md:col-span-5 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Flächen-Werkzeug:</label>
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 w-fit">
                  <button
                    type="button"
                    onClick={() => setZoneBrushMode('brush')}
                    className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      zoneBrushMode === 'brush'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Pinsel: Über Kacheln ziehen zum Markieren"
                  >
                    <Paintbrush className="w-3.5 h-3.5" /> Pinsel
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoneBrushMode('box')}
                    className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      zoneBrushMode === 'box'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Rechteck (Ziehen): Bereich aufziehen"
                  >
                    <Square className="w-3.5 h-3.5" /> Rechteck (Ziehen)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-end pt-2.5 border-t border-slate-800/80 bg-slate-950">
            {editingZoneId && (
              <button
                type="button"
                onClick={() => {
                  setEditingZoneId(null);
                  setSelectedZoneCells([]);
                  setZoneLoreEntryId('');
                }}
                className="mr-2 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg cursor-pointer transition-all"
              >
                Abbrechen
              </button>
            )}
            <button
              onClick={() => {
                if (selectedZoneCells.length === 0) return;
                const entries = [...allLocationEntries, ...(loreDatabase || [])];
                const selectedEntry = entries.find(l => l.id === zoneLoreEntryId);
                if (!selectedEntry) {
                  setWarningMessage('Bitte wähle einen Kodex-Eintrag für dieses Gebiet!');
                  setTimeout(() => setWarningMessage(null), 4000);
                  return;
                }

                // Compute center col/row as anchor
                const cols = selectedZoneCells.map(c => c.col);
                const rows = selectedZoneCells.map(c => c.row);
                const centerCol = Math.round(cols.reduce((sum, c) => sum + c, 0) / cols.length);
                const centerRow = Math.round(rows.reduce((sum, r) => sum + r, 0) / rows.length);

                const currentObjects = [...(combatState.placedObjects || [])];
                
                if (editingZoneId) {
                  // Update existing zone
                  const updatedObjects = currentObjects.map(obj => {
                    if (obj.id === editingZoneId) {
                      return {
                        ...obj,
                        name: selectedEntry.title,
                        icon: getIconForLoreEntry(selectedEntry) || '🗺️',
                        loreEntryId: zoneLoreEntryId,
                        description: `Gebiet verknüpft mit Kodex: ${selectedEntry.title}.`,
                        x: centerCol,
                        y: centerRow,
                        zoneCells: selectedZoneCells.map(c => ({ x: c.col, y: c.row }))
                      };
                    }
                    return obj;
                  });
                  onChangeCombatState({
                    ...combatState,
                    placedObjects: updatedObjects
                  });
                  setEditingZoneId(null);
                } else {
                  // Create new zone
                  currentObjects.push({
                    id: `placed-zone-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                    name: selectedEntry.title,
                    icon: getIconForLoreEntry(selectedEntry) || '🗺️',
                    category: 'Gebiet & Zone',
                    description: `Gebiet verknüpft mit Kodex: ${selectedEntry.title}.`,
                    loreEntryId: zoneLoreEntryId,
                    color: '#f59e0b', // standard unified amber
                    x: centerCol,
                    y: centerRow,
                    zoneCells: selectedZoneCells.map(c => ({ x: c.col, y: c.row }))
                  });

                  onChangeCombatState({
                    ...combatState,
                    placedObjects: currentObjects
                  });
                }

                // Reset selection & input
                setSelectedZoneCells([]);
                setZoneLoreEntryId('');
              }}
              disabled={selectedZoneCells.length === 0 || !zoneLoreEntryId}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                selectedZoneCells.length > 0 && zoneLoreEntryId
                  ? 'bg-amber-500 hover:bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>{editingZoneId ? '💾 Änderungen speichern' : '💾 Zone erstellen & verknüpfen'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* 🎭 SUB-BAR: TOKEN & MARKER SELECTION SUITE (Wenn Token-Modus aktiv) */}
      {activeTool === 'token' && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-3.5 shadow-xl"
        >
          {/* 🎛️ Main Category Tabs: Ort-Ausstattung vs. Einheiten vs. Gebäude */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => handleSwitchMainTab('location')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                tokenMainTab === 'location'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-950/20 ring-1 ring-amber-400/30'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0 text-amber-400" />
              <span>📍 Orts-Ausstattung ({extractedLocationTokens.length})</span>
            </button>
            <button
              onClick={() => handleSwitchMainTab('units')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                tokenMainTab === 'units'
                  ? 'bg-emerald-600/10 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Einheiten & Charaktere</span>
            </button>
            <button
              onClick={() => handleSwitchMainTab('structures')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                tokenMainTab === 'structures'
                  ? 'bg-amber-600/10 border-amber-500 text-amber-300 shadow-lg shadow-amber-950/20'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Gebäude & Sonstiges</span>
            </button>
          </div>

          {/* DYNAMISCHER ORT-REITER */}
          {tokenMainTab === 'location' && (
            <div className="space-y-4">
              {/* Ort-Auswahl Header Box */}
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-amber-500/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider shrink-0">
                      Orts-Kodex:
                    </span>
                    <select
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="bg-slate-950 border border-amber-500/50 text-amber-100 text-xs rounded-lg px-2.5 py-1.5 outline-none font-extrabold cursor-pointer hover:border-amber-400 focus:border-amber-400 transition-all shadow-inner flex-1 min-w-0 truncate"
                    >
                      {allLocationEntries.map((loc) => (
                        <option key={loc.id} value={loc.id} className="bg-slate-950 text-slate-100 font-medium">
                          {getIconForLoreEntry(loc)} {loc.title} {loc.details?.territoryType ? `(${loc.details.territoryType})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {extractedLocationTokens.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAutoPlaceLocationGarrison(extractedLocationTokens)}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white text-xs font-black rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 border border-amber-300/40"
                      title="Sämtliche aus dem Kodex ermittelten Einheiten, Schiffe und Gebäude direkt auf der Rasterkarte anordnen"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Alle {extractedLocationTokens.length} Objekte auf Raster platzieren</span>
                    </button>
                  )}
                </div>

                {/* Active Location Details Summary Card */}
                {activeLocationEntry && (
                  <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base p-1 bg-slate-900 rounded border border-slate-800">
                          {getIconForLoreEntry(activeLocationEntry)}
                        </span>
                        <span className="font-extrabold text-slate-100 text-sm">
                          {activeLocationEntry.title}
                        </span>
                        {activeLocationEntry.details?.territoryType && (
                          <span className="bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {activeLocationEntry.details.territoryType}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        {activeLocationEntry.details?.population && (
                          <span className="bg-slate-900 border border-slate-800 text-sky-300 px-2 py-0.5 rounded font-bold">
                            👥 Einwohner: {activeLocationEntry.details.population}
                          </span>
                        )}
                        {activeLocationEntry.details?.defense && (
                          <span className="bg-slate-900 border border-slate-800 text-emerald-300 px-2 py-0.5 rounded font-bold">
                            🛡️ Abwehr: {activeLocationEntry.details.defense}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Military / Garrison quote from Codex */}
                    {(activeLocationEntry.details?.militaryStrength || activeLocationEntry.details?.military) && (
                      <div className="bg-amber-950/20 border border-amber-500/30 p-2 rounded text-[11px] text-amber-200/90 leading-relaxed italic">
                        <span className="font-bold not-italic text-amber-400 mr-1.5">🛡️ Militär-Kodexeintrag:</span>
                        "{activeLocationEntry.details?.militaryStrength || activeLocationEntry.details?.military}"
                      </div>
                    )}

                    {activeLocationEntry.description && !activeLocationEntry.details?.militaryStrength && (
                      <p className="text-slate-300 text-[11px] line-clamp-2 leading-relaxed">
                        {activeLocationEntry.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Extracted Tokens Grid grouped by group */}
              {extractedLocationTokens.length === 0 ? (
                <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-400">
                    Keine spezifischen Einheiten oder Bauwerke im Codex-Eintrag für diesen Ort gefunden.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const garrisons = extractedLocationTokens.filter(t => t.group === 'garrison');
                    const ships = extractedLocationTokens.filter(t => t.group === 'ships');
                    const structures = extractedLocationTokens.filter(t => t.group === 'structures');
                    const chars = extractedLocationTokens.filter(t => {
                      if (t.group !== 'characters') return false;
                      const entry = loreDatabase.find(e => e.id === t.loreEntryId);
                      if (!entry) return false;
                      const faction = getCharacterFaction(entry);
                      return !!faction && faction.trim() !== '';
                    });
                    const subPlaces = extractedLocationTokens.filter(t => t.group === 'places');

                    const renderTokenCard = (token: ExtractedLocationToken) => {
                      const isSelected = activeToken.name === token.name && activeToken.category === token.category;
                      return (
                        <button
                          key={token.id}
                          type="button"
                          onClick={() => {
                            setActiveToken({
                              name: token.name,
                              icon: token.icon,
                              category: token.category,
                              description: token.description,
                              loreEntryId: token.loreEntryId,
                              population: token.population,
                              minCrew: token.minCrew,
                              maxCapacity: token.maxCapacity,
                              shipSize: token.shipSize,
                              defense: token.defense,
                              attack: token.attack,
                              durability: token.durability
                            });
                            setActiveTool('token');
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 shadow-lg ring-2 ring-amber-400/50'
                              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xl shrink-0 p-1 bg-slate-950 rounded-lg border border-slate-800 leading-none">
                              {token.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-black text-slate-100 truncate" title={token.name}>
                                {token.name}
                              </h5>
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                                {token.description}
                              </p>
                              {token.sourceText && (
                                <p className="text-[9px] text-amber-300/80 italic mt-1 leading-snug border-l-2 border-amber-500/40 pl-1.5 truncate" title={`Textstelle: "${token.sourceText}"`}>
                                  "{token.sourceText}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 text-[9.5px]">
                            {token.population !== undefined && (
                              <span className="bg-sky-950/60 border border-sky-500/30 text-sky-300 px-1.5 py-0.5 rounded font-extrabold">
                                👥 {token.group === 'ships' ? `Besatzung: ${token.population}` : `${token.population} Mann`}
                              </span>
                            )}
                            {token.shipSize && (
                              <span className="bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded font-extrabold capitalize">
                                ⛵ {token.shipSize}
                              </span>
                            )}
                            {token.defense !== undefined && (
                              <span className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded font-extrabold">
                                🛡️ Def: {token.defense}
                              </span>
                            )}
                            {token.attack !== undefined && token.attack > 0 && (
                              <span className="bg-red-950/60 border border-red-500/30 text-red-300 px-1.5 py-0.5 rounded font-extrabold">
                                ⚔️ Atk: {token.attack}
                              </span>
                            )}
                            {isSelected && (
                              <span className="ml-auto text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded animate-pulse">
                                Platzieren
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    };

                    return (
                      <div className="space-y-4">
                        {/* Garnison Section */}
                        {garrisons.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                              <span>🛡️ Garnison & Militäreinheiten ({garrisons.length})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {garrisons.map(renderTokenCard)}
                            </div>
                          </div>
                        )}

                        {/* Flotte & Schiffe Section */}
                        {ships.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                              <span>⛵ Flotte & Schiffe ({ships.length})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {ships.map(renderTokenCard)}
                            </div>
                          </div>
                        )}

                        {/* Gebäude Section */}
                        {structures.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                              <span>🏰 Gebäude & Befestigungen ({structures.length})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {structures.map(renderTokenCard)}
                            </div>
                          </div>
                        )}

                        {/* Characters Section */}
                        {chars.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                              <span>👤 Vor Ort anwesende Charaktere & Personen ({chars.length})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {chars.map(renderTokenCard)}
                            </div>
                          </div>
                        )}

                        {/* Sub-Places Section */}
                        {subPlaces.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                              <span>📍 Zugehörige Teil-Orte ({subPlaces.length})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {subPlaces.map(renderTokenCard)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Category Tabs with Colored Circle Dots */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            {tokenMainTab === 'units' && (
              <>
                <button
                  onClick={() => setTokenSubTab('characters')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'characters'
                      ? 'bg-emerald-600 border border-emerald-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300 shrink-0 shadow-sm" />
                  <span>Charaktere (Ohne Fraktion)</span>
                </button>

                <button
                  onClick={() => setTokenSubTab('factions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'factions'
                      ? 'bg-blue-600 border border-blue-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-300 shrink-0 shadow-sm" />
                  <span>Fraktionen & Gruppen</span>
                </button>

                <button
                  onClick={() => setTokenSubTab('enemies')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'enemies'
                      ? 'bg-red-600 border border-red-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300 shrink-0 shadow-sm" />
                  <span>Gegner & Monster</span>
                </button>
              </>
            )}

            {tokenMainTab === 'structures' && (
              <>
                <button
                  onClick={() => setTokenSubTab('buildings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'buildings'
                      ? 'bg-amber-600 border border-amber-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-300" /> Gebäude
                </button>

                <button
                  onClick={() => setTokenSubTab('hospitality')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'hospitality'
                      ? 'bg-rose-600 border border-rose-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Hotel className="w-3.5 h-3.5 text-rose-300" /> Hotels & Gastgewerbe
                </button>

                <button
                  onClick={() => setTokenSubTab('shops')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'shops'
                      ? 'bg-emerald-600 border border-emerald-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-emerald-300" /> Händler & Geschäfte
                </button>

                <button
                  onClick={() => setTokenSubTab('industry')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'industry'
                      ? 'bg-cyan-600 border border-cyan-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Factory className="w-3.5 h-3.5 text-cyan-300" /> Produktion & Industrie
                </button>

                <button
                  onClick={() => setTokenSubTab('constructions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'constructions'
                      ? 'bg-orange-600 border border-orange-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <BrickWall className="w-3.5 h-3.5 text-orange-300" /> Bauwerke & Mauern
                </button>

                <button
                  onClick={() => setTokenSubTab('places')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'places'
                      ? 'bg-amber-700 border border-amber-500 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Orte & Siedlungen
                </button>

                <button
                  onClick={() => setTokenSubTab('geography')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'geography'
                      ? 'bg-emerald-700 border border-emerald-500 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> Geografie & Natur
                </button>

                <button
                  onClick={() => setTokenSubTab('ships')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'ships'
                      ? 'bg-sky-600 border border-sky-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Ship className="w-3.5 h-3.5 text-sky-300" /> Schiffe & Fahrzeuge
                </button>

                <button
                  onClick={() => setTokenSubTab('treasures')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    tokenSubTab === 'treasures'
                      ? 'bg-purple-600 border border-purple-400 text-white shadow font-black'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Gem className="w-3.5 h-3.5 text-purple-300" /> Schätze & Interaktionen
                </button>
              </>
            )}

            {/* Common / Helper tabs shown in both */}
            <button
              onClick={() => setTokenSubTab('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tokenSubTab === 'custom'
                  ? 'bg-indigo-600 border border-indigo-400 text-white shadow font-black'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-indigo-300" /> Custom Marker
            </button>
          </div>

          {/* Tab 1: CHARAKTERE (OHNE FRAKTION) - Grüner Kreis */}
          {tokenSubTab === 'characters' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-2 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300 shrink-0 shadow-sm" />
                <span>Charaktere ohne Fraktionszugehörigkeit (Grüner Kreis)</span>
              </div>

              {independentCharacters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Einträge aus deinem Kodex</div>
                  <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {independentCharacters.map(entry => {
                      const isSelected = activeToken.loreEntryId === entry.id;
                      return (
                        <button
                          key={`indep-${entry.id}`}
                          onClick={() => {
                            setActiveToken({
                              name: entry.title,
                              icon: '🟢',
                              category: 'Charaktere & NPCs',
                              description: entry.description || 'Unabhängiger Charakter aus dem Kodex.',
                              loreEntryId: entry.id
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-400 text-white ring-1 ring-emerald-500'
                              : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-500 border border-emerald-300 shrink-0 shadow-md" />
                          <div className="overflow-hidden min-w-0 flex-1">
                            <div className="text-xs font-bold truncate text-slate-100">{entry.title}</div>
                            <div className="text-[10px] text-emerald-400 truncate">Kodex-Charakter</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Standard-Vorlagen</div>
                <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {DEFAULT_CHARACTERS.map(entry => {
                    const isSelected = activeToken.name === entry.title && !activeToken.loreEntryId;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => {
                          setActiveToken({
                            name: entry.title,
                            icon: entry.icon,
                            category: entry.category,
                            description: entry.description
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 text-white ring-1 ring-emerald-500'
                            : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-emerald-500 border border-emerald-300 shrink-0 shadow-md" />
                        <div className="overflow-hidden min-w-0 flex-1">
                          <div className="text-xs font-bold truncate text-slate-100">{entry.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">Standard</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: FRAKTIONEN & MITGLIEDER - Pro Fraktion ein farbiger Kreis */}
          {tokenSubTab === 'factions' && (
            <div className="space-y-5">
              <div className="text-xs font-bold text-sky-300 flex items-center gap-2 bg-blue-950/40 p-2.5 rounded-xl border border-blue-500/30">
                <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-300 shrink-0 shadow-sm" />
                <span>Fraktionen & Gruppen — Jede Fraktion hat ihren eigenen farbigen Kreis</span>
              </div>

              {factionGroups.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400">Gruppen aus deinem Kodex</div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {factionGroups.map((group) => (
                      <div key={`fg-${group.name}`} className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                          <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md border border-slate-950" style={{ backgroundColor: group.color.dotBg }} />
                          <span className="text-sm font-extrabold text-white">{group.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${group.color.bg} text-white`}>
                            {group.members.length} Mitglieder
                          </span>
                        </div>

                        {group.members.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {group.members.map((member) => {
                              const isSelected = activeToken.name === member.title && activeToken.faction === group.name && activeToken.loreEntryId === member.id;
                              return (
                                <button
                                  key={`fac-mem-${member.id}`}
                                  onClick={() => {
                                    setActiveToken({
                                      name: member.title,
                                      icon: member.category === 'Gegner' ? '🔴' : '🔵',
                                      category: member.category === 'Gegner' ? 'Gegner & Monster' : 'Fraktions-Mitglied',
                                      description: member.description || `Mitglied der Fraktion ${group.name}`,
                                      loreEntryId: member.id,
                                      faction: group.name
                                    });
                                  }}
                                  className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-500/20 border-blue-400 text-white ring-1 ring-blue-500'
                                      : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                                  }`}
                                >
                                  <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-slate-950" style={{ backgroundColor: group.color.dotBg }} />
                                  <div className="overflow-hidden min-w-0 flex-1">
                                    <div className="text-xs font-bold truncate text-slate-100">{member.title}</div>
                                    <div className="text-[10px] text-slate-400 truncate">{group.name}</div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">
                            Keine zugeordneten Charaktere im Kodex für diese Fraktion.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Standard-Fraktionen</div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {DEFAULT_FACTIONS.map((group) => (
                    <div key={`def-fg-${group.name}`} className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                        <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md border border-slate-950" style={{ backgroundColor: group.color.dotBg }} />
                        <span className="text-sm font-extrabold text-white">{group.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300`}>
                          {group.members.length} Mitglieder
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {group.members.map((member) => {
                          const isSelected = activeToken.name === member.title && activeToken.faction === group.name && !activeToken.loreEntryId;
                          return (
                            <button
                              key={`def-fac-mem-${member.id}`}
                              onClick={() => {
                                setActiveToken({
                                  name: member.title,
                                  icon: '🔵',
                                  category: 'Fraktions-Mitglied',
                                  description: member.description,
                                  faction: group.name
                                });
                              }}
                              className={`p-2 rounded-lg border text-left transition-all flex items-center gap-2 cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-500/20 border-blue-400 text-white ring-1 ring-blue-500'
                                  : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-slate-950" style={{ backgroundColor: group.color.dotBg }} />
                              <div className="overflow-hidden min-w-0 flex-1">
                                <div className="text-xs font-bold truncate text-slate-100">{member.title}</div>
                                <div className="text-[10px] text-slate-400 truncate">Standard</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: GEGNER & MONSTER - Alle als Roter Kreis */}
          {tokenSubTab === 'enemies' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-red-300 flex items-center gap-2 bg-red-950/40 p-2.5 rounded-xl border border-red-500/30">
                <span className="w-3 h-3 rounded-full bg-red-500 border border-red-300 shrink-0 shadow-sm" />
                <span>Gegner & Monster — Werden als Roter Kreis dargestellt</span>
              </div>

              {enemyEntries.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-400">Einträge aus deinem Kodex</div>
                  <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {enemyEntries.map((enemy: any) => {
                      const isSelected = activeToken.name === enemy.title && activeToken.loreEntryId === enemy.id;
                      return (
                        <button
                          key={`enemy-entry-${enemy.id}`}
                          onClick={() => {
                            setActiveToken({
                              name: enemy.title,
                              icon: '🔴',
                              category: 'Gegner',
                              description: enemy.description || 'Feindliche Einheit.',
                              loreEntryId: enemy.id
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-red-500/20 border-red-400 text-white ring-1 ring-red-500'
                              : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-red-500/50 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-red-500 border border-red-300 shrink-0 shadow-md" />
                          <div className="overflow-hidden min-w-0 flex-1">
                            <div className="text-xs font-bold truncate text-slate-100">{enemy.title}</div>
                            <div className="text-[10px] text-red-400 truncate">Kodex-Gegner</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Standard-Gegner</div>
                <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {DEFAULT_ENEMIES.map((enemy) => {
                    const isSelected = activeToken.name === enemy.title && !activeToken.loreEntryId;
                    return (
                      <button
                        key={enemy.id}
                        onClick={() => {
                          setActiveToken({
                            name: enemy.title,
                            icon: enemy.icon || '🔴',
                            category: 'Gegner',
                            description: enemy.description
                          });
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-red-500/20 border-red-400 text-white ring-1 ring-red-500'
                            : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-red-500/50 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="text-xl p-1 bg-slate-950 rounded-lg border border-slate-800 shrink-0">{enemy.icon}</span>
                        <div className="overflow-hidden min-w-0 flex-1">
                          <div className="text-xs font-bold truncate text-slate-100">{enemy.title}</div>
                          <div className="text-[10px] text-slate-400 truncate font-semibold">Standard</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Preset Buttons Grid for Ships, Treasures, Buildings, Hospitality, Shops, Industry, Constructions, Places */}
          {(tokenSubTab === 'ships' || tokenSubTab === 'treasures' || tokenSubTab === 'buildings' || tokenSubTab === 'hospitality' || tokenSubTab === 'shops' || tokenSubTab === 'industry' || tokenSubTab === 'constructions' || tokenSubTab === 'places' || tokenSubTab === 'geography') && (
            <div className="space-y-4">
              {(() => {
                const defaultList = 
                  tokenSubTab === 'ships' ? DEFAULT_SHIPS :
                  tokenSubTab === 'treasures' ? DEFAULT_TREASURES :
                  tokenSubTab === 'buildings' ? DEFAULT_BUILDINGS :
                  tokenSubTab === 'hospitality' ? DEFAULT_HOSPITALITY :
                  tokenSubTab === 'shops' ? DEFAULT_SHOPS :
                  tokenSubTab === 'industry' ? DEFAULT_INDUSTRY :
                  tokenSubTab === 'constructions' ? DEFAULT_CONSTRUCTIONS :
                  tokenSubTab === 'places' ? DEFAULT_PLACES :
                  tokenSubTab === 'geography' ? DEFAULT_GEOGRAPHY : [];

                const defaultIcon = 
                  tokenSubTab === 'ships' ? '⛵' :
                  tokenSubTab === 'treasures' ? '💎' :
                  tokenSubTab === 'buildings' ? '🏰' :
                  tokenSubTab === 'hospitality' ? '🏨' :
                  tokenSubTab === 'shops' ? '🏪' :
                  tokenSubTab === 'industry' ? '🏭' :
                  tokenSubTab === 'constructions' ? '🧱' :
                  tokenSubTab === 'geography' ? '🗺️' : '📍';

                const subTabCategory = tokenSubTab === 'ships' || tokenSubTab === 'treasures' ? 'Gegenstände' : 'Marker & Orte';

                const codexList = 
                  tokenSubTab === 'ships' ? codexShips :
                  tokenSubTab === 'buildings' ? codexBuildings :
                  tokenSubTab === 'treasures' ? codexTreasures : [];

                return (
                  <div className="space-y-4">
                    {/* Kodex-Einträge für diesen Tab */}
                    {codexList.length > 0 && (
                      <div className="space-y-2 pb-3 border-b border-slate-800">
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                          <span>📖 Aus deinem Kodex ({codexList.length})</span>
                        </div>
                        <div className="max-h-52 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {codexList.map(entry => {
                            const isSelected = activeToken.loreEntryId === entry.id;
                            const icon = getIconForLoreEntry(entry);
                            const details = entry.details || {};
                            return (
                              <button
                                key={`codex-subtab-${entry.id}`}
                                type="button"
                                onClick={() => {
                                  const entryCategory = tokenSubTab === 'ships' || tokenSubTab === 'treasures' ? 'Gegenstände' : 'Marker & Orte';
                                  const stats = getDefaultStatsForToken(entry.title, entryCategory);
                                  setActiveToken({
                                    name: entry.title,
                                    icon: icon,
                                    category: entryCategory,
                                    description: entry.description || '',
                                    loreEntryId: entry.id,
                                    ...stats,
                                    ...(details.shipSize ? { shipSize: details.shipSize } : {}),
                                    ...(details.minCrew !== undefined ? { minCrew: details.minCrew } : {}),
                                    ...(details.maxCapacity !== undefined ? { maxCapacity: details.maxCapacity } : {}),
                                    ...(details.population !== undefined ? { population: details.population } : {}),
                                    ...(details.defense !== undefined ? { defense: details.defense } : {}),
                                    ...(details.attack !== undefined ? { attack: details.attack } : {}),
                                    ...(details.durability !== undefined ? { durability: details.durability } : {}),
                                  });
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-500'
                                    : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-amber-500/50 hover:bg-slate-800/60'
                                }`}
                              >
                                <span className="text-xl p-1.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0 flex items-center justify-center w-[38px] h-[38px]">
                                  {renderTokenIconElement(icon, entry.title)}
                                </span>
                                <div className="overflow-hidden min-w-0 flex-1">
                                  <div className="text-xs font-bold text-slate-100 leading-snug truncate">{entry.title}</div>
                                  <div className="text-[10px] text-amber-400/80 font-medium truncate flex items-center gap-1">
                                    <span>{details.itemType || entry.category}</span>
                                    {(details.attack !== undefined || details.durability !== undefined) && (
                                      <span className="text-red-400 font-bold ml-0.5">⚔️{details.attack || 0} 🧱{details.durability || 0}</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Standard-Vorlagen</div>
                      <div className="max-h-60 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {defaultList.map((entry) => {
                          const isSelected = activeToken.name === entry.title && !activeToken.loreEntryId;
                          const icon = entry.icon || defaultIcon;
                          return (
                            <button
                              key={`def-preset-${entry.id}`}
                              onClick={() => {
                                const stats = getDefaultStatsForToken(entry.title, subTabCategory);
                                const entryPop = (entry as any).population;
                                const entryDef = (entry as any).defense;
                                setActiveToken({
                                  name: entry.title,
                                  icon: icon,
                                  category: subTabCategory,
                                  description: entry.description,
                                  ...stats,
                                  ...(entryPop !== undefined ? { population: entryPop } : {}),
                                  ...(entryDef !== undefined ? { defense: entryDef } : {})
                                });
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-500'
                                  : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                              }`}
                            >
                              <span className="text-xl p-1.5 bg-slate-950 rounded-lg border border-slate-800 shrink-0 flex items-center justify-center w-[38px] h-[38px]">
                                {renderTokenIconElement(icon, entry.title)}
                              </span>
                              <div className="overflow-hidden min-w-0">
                                <div className="text-xs font-bold text-slate-100 leading-snug break-words">{entry.title}</div>
                                <div className="text-[10px] text-slate-400 truncate">Standard</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Custom Marker Tab */}
          {tokenSubTab === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Icon / Emoji:</label>
                <input
                  type="text"
                  value={activeToken.icon}
                  onChange={(e) => setActiveToken({ ...activeToken, icon: e.target.value })}
                  placeholder="⛵"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-center text-lg outline-none focus:border-amber-500 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Name / Bezeichnung:</label>
                <input
                  type="text"
                  value={activeToken.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const stats = getDefaultStatsForToken(newName, activeToken.category);
                    setActiveToken(prev => ({
                      ...prev,
                      name: newName,
                      loreEntryId: undefined,
                      ...(stats.population !== undefined ? { population: stats.population } : {}),
                      ...(stats.defense !== undefined ? { defense: stats.defense } : {})
                    }));
                  }}
                  placeholder="z. B. Schatzkarte, Handelsschiff..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-500 text-slate-200 font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kategorie:</label>
                <select
                  value={activeToken.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const stats = getDefaultStatsForToken(activeToken.name, newCat);
                    setActiveToken(prev => ({
                      ...prev,
                      category: newCat,
                      ...(stats.population !== undefined ? { population: stats.population } : {}),
                      ...(stats.defense !== undefined ? { defense: stats.defense } : {})
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-amber-500 text-slate-200 font-bold cursor-pointer"
                >
                  <option value="Schiffe & Fahrzeuge">⛵ Schiffe & Fahrzeuge</option>
                  <option value="Charaktere & NPCs">👤 Charaktere & NPCs</option>
                  <option value="Schätze & Interaktionen">💎 Schätze & Interaktionen</option>
                  <option value="Gegner & Fraktionen">⚔️ Gegner & Fraktionen</option>
                  <option value="Marker & Orte">📌 Marker & Orte</option>
                </select>
              </div>
            </div>
          )}

          {/* 📖 Quick Codex Link Selector for Active Token */}
          <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mit Kodex-Eintrag verknüpfen:</span>
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => setCodexDropdownFilter('auto')}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    codexDropdownFilter === 'auto'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-amber-300 hover:text-white'
                  }`}
                  title="Automatisch nur zur Kategorie passende Einträge anzeigen"
                >
                  🎯 Passender Kontext
                </button>
                <button
                  onClick={() => setCodexDropdownFilter('Orte')}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    codexDropdownFilter === 'Orte'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📍 Nur Orte & Weltkarte ({allLocationEntries.length})
                </button>
                <button
                  onClick={() => setCodexDropdownFilter('all')}
                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    codexDropdownFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🌐 Alle ({loreDatabase.length + allLocationEntries.filter(e => e.id?.startsWith('terr-')).length})
                </button>
              </div>
            </div>

            <div className="flex-1 min-w-0 flex items-center gap-2">
              <select
                value={activeToken.loreEntryId || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) {
                    setActiveToken(prev => ({ ...prev, loreEntryId: undefined }));
                  } else {
                    const entry = allLocationEntries.find(l => l.id === selectedId) || loreDatabase.find(l => l.id === selectedId);
                    if (entry) {
                      const entryIcon = getIconForLoreEntry(entry);
                      const entryCategory = activeToken.category || (((entry.category as string) === 'Orte' || (entry.category as string) === 'Weltkarte') ? 'Marker & Orte' : entry.category);
                      const stats = getDefaultStatsForToken(entry.title, entryCategory);
                      setActiveToken({
                        name: entry.title,
                        icon: activeToken.icon && activeToken.icon !== '📌' ? activeToken.icon : entryIcon,
                        category: entryCategory,
                        description: entry.description || activeToken.description || '',
                        loreEntryId: entry.id,
                        ...stats
                      });
                    }
                  }
                }}
                className="w-full bg-slate-950 border border-amber-500/50 text-amber-200 text-xs rounded-lg px-3 py-1.5 outline-none font-bold cursor-pointer hover:border-amber-400 focus:border-amber-400 transition-all shadow-inner"
              >
                <option value="">-- Kein Kodex-Eintrag verknüpft (Standard Token) --</option>
                {getGroupedLoreEntries(
                  codexDropdownFilter === 'all'
                    ? [...allLocationEntries, ...loreDatabase.filter(e => (e.category as string) !== 'Orte' && (e.category as string) !== 'Weltkarte')]
                    : codexDropdownFilter === 'auto'
                    ? getContextualLoreEntries(activeToken.category, tokenSubTab)
                    : (codexDropdownFilter as string) === 'Orte'
                    ? allLocationEntries
                    : loreDatabase.filter(e => e.category === codexDropdownFilter)
                ).map(group => (
                  <optgroup key={group.category} label={group.label} className="bg-slate-900 text-amber-300 font-bold">
                    {group.items.map(entry => (
                      <option key={entry.id} value={entry.id} className="bg-slate-950 text-slate-100 font-normal">
                        {entry.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {activeToken.loreEntryId && (
                <button
                  onClick={() => setActiveToken(prev => ({ ...prev, loreEntryId: undefined }))}
                  className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 text-red-300 text-xs font-bold rounded-lg shrink-0 transition-all cursor-pointer"
                  title="Verknüpfung entfernen"
                >
                  Lösen
                </button>
              )}
            </div>
          </div>

          {/* Active Token Preview & Placement Instructions Banner */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 p-3 rounded-xl flex flex-col gap-3 shadow-inner w-full max-w-full overflow-hidden">
            {/* Top Row: Token Icon, Name, Codex link & Description */}
            <div className="flex items-start gap-3 min-w-0 w-full">
              <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-amber-500/40 shadow-md shrink-0">
                {activeToken.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-amber-300 leading-snug break-words">{activeToken.name}</span>
                  {activeToken.loreEntryId && (
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono shrink-0">
                      📖 Kodex-Verknüpfung
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                  {activeToken.description || 'Klicke jetzt auf ein beliebiges Feld im Raster, um diesen Token zu setzen.'}
                </p>
              </div>
            </div>

            {/* Bottom Row: Ship / Structure Stats controls */}
            {(() => {
              const catL = (activeToken.category || '').toLowerCase();
              const nmL = (activeToken.name || '').toLowerCase();
              const isShip = tokenSubTab === 'ships' || catL.includes('schiff') || catL.includes('fahrzeug') || nmL.includes('schiff') || nmL.includes('boot') || nmL.includes('galeone') || nmL.includes('fregatte') || nmL.includes('kanu') || nmL.includes('barke') || nmL.includes('kutsche') || nmL.includes('karren') || nmL.includes('luftschiff') || nmL.includes('u-boot') || nmL.includes('floß') || nmL.includes('floss');

              const currentSize = activeToken.shipSize || 'mittel';

              return (
                <div className="flex flex-wrap items-center gap-2 bg-slate-950/90 p-2.5 rounded-xl border border-amber-500/30 shadow-md w-full">
                  {isShip && (
                    <div className="flex flex-col gap-1 bg-slate-900 border border-slate-800/85 rounded-lg px-2 py-1.5">
                      <span className="text-[7.5px] text-slate-400 font-extrabold uppercase leading-none">Schiffsgröße</span>
                      <div className="flex items-center gap-1">
                        {(['klein', 'mittel', 'groß'] as const).map(size => {
                          const isSel = currentSize === size;
                          return (
                            <button
                              key={`size-btn-${size}`}
                              type="button"
                              onClick={() => {
                                const newStats = getShipStatsForSize(activeToken.name, size);
                                setActiveToken(prev => ({
                                  ...prev,
                                  shipSize: size,
                                  minCrew: newStats.minCrew,
                                  maxCapacity: newStats.maxCapacity,
                                  population: newStats.population,
                                  defense: newStats.defense,
                                  attack: newStats.attack,
                                  durability: newStats.durability
                                }));
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Min Crew (For Ships) */}
                  {isShip && (
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/85 rounded-lg px-2.5 py-1.5 focus-within:border-amber-500/50 transition-all">
                      <span className="text-xs shrink-0 select-none" title="Mindestbesatzung (nötig zum Segeln)">⚓</span>
                      <div className="flex flex-col">
                        <span className="text-[7.5px] text-slate-400 font-extrabold uppercase leading-none mb-0.5">Min. Crew</span>
                        <input
                          type="number"
                          min="0"
                          value={activeToken.minCrew !== undefined ? activeToken.minCrew : ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            setActiveToken(prev => ({ ...prev, minCrew: val }));
                          }}
                          placeholder="Min"
                          className="w-12 bg-transparent text-amber-300 text-[11px] font-black outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Population / An Bord Input */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/85 rounded-lg px-2.5 py-1.5 focus-within:border-amber-500/50 transition-all">
                    <span className="text-xs shrink-0 select-none" title="Aktuelle Besatzung an Bord / Bewohner">👥</span>
                    <div className="flex flex-col">
                      <span className="text-[7.5px] text-slate-400 font-extrabold uppercase leading-none mb-0.5">
                        {isShip ? 'An Bord' : 'Bewohner'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={activeToken.population !== undefined ? activeToken.population : ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          setActiveToken(prev => ({ ...prev, population: val }));
                        }}
                        placeholder="Keine"
                        className="w-14 bg-transparent text-sky-300 text-[11px] font-black outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {/* Max Capacity (For Ships / Buildings) */}
                  {isShip && (
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/85 rounded-lg px-2.5 py-1.5 focus-within:border-amber-500/50 transition-all">
                      <span className="text-xs shrink-0 select-none" title="Maximalbesatzung / Kapazität">🏛️</span>
                      <div className="flex flex-col">
                        <span className="text-[7.5px] text-slate-400 font-extrabold uppercase leading-none mb-0.5">Max. Cap</span>
                        <input
                          type="number"
                          min="0"
                          value={activeToken.maxCapacity !== undefined ? activeToken.maxCapacity : ''}
                          onChange={(e) => {
                            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            setActiveToken(prev => ({ ...prev, maxCapacity: val }));
                          }}
                          placeholder="Max"
                          className="w-12 bg-transparent text-emerald-300 text-[11px] font-black outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Defense Input */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/85 rounded-lg px-2.5 py-1.5 focus-within:border-amber-500/50 transition-all">
                    <span className="text-xs shrink-0 select-none" title="Verteidigungswert">🛡️</span>
                    <div className="flex flex-col">
                      <span className="text-[7.5px] text-slate-400 font-extrabold uppercase leading-none mb-0.5">Verteidigung</span>
                      <input
                        type="number"
                        min="0"
                        value={activeToken.defense !== undefined ? activeToken.defense : ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          setActiveToken(prev => ({ ...prev, defense: val }));
                        }}
                        placeholder="Keine"
                        className="w-12 bg-transparent text-slate-100 text-[11px] font-black outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {/* Angriffskraft Input */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/85 rounded-lg px-2.5 py-1.5 focus-within:border-amber-500/50 transition-all">
                    <span className="text-xs shrink-0 select-none" title="Angriffskraft / Feuerkraft">⚔️</span>
                    <div className="flex flex-col">
                      <span className="text-[7.5px] text-slate-400 font-extrabold uppercase leading-none mb-0.5">Angriffskraft</span>
                      <input
                        type="number"
                        min="0"
                        value={activeToken.attack !== undefined ? activeToken.attack : ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          setActiveToken(prev => ({ ...prev, attack: val }));
                        }}
                        placeholder="0"
                        className="w-12 bg-transparent text-red-300 text-[11px] font-black outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {/* Haltbarkeit / Trefferpunkte Input */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/85 rounded-lg px-2.5 py-1.5 focus-within:border-amber-500/50 transition-all">
                    <span className="text-xs shrink-0 select-none" title="Haltbarkeit / Rumpf-Strukturpunkte">🧱</span>
                    <div className="flex flex-col">
                      <span className="text-[7.5px] text-slate-400 font-extrabold uppercase leading-none mb-0.5">Haltbarkeit</span>
                      <input
                        type="number"
                        min="0"
                        value={activeToken.durability !== undefined ? activeToken.durability : ''}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                          setActiveToken(prev => ({ ...prev, durability: val }));
                        }}
                        placeholder="Max"
                        className="w-12 bg-transparent text-rose-300 text-[11px] font-black outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* Main Canvas Viewport Container */}
      <div className="flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative shadow-2xl">
        {/* Top Control Bar: Tile Size, Zoom, Legend */}
        <div className="flex flex-wrap items-center justify-between p-3 bg-slate-900/90 border-b border-slate-800/80 text-[10px] font-bold text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <i className="fa-solid fa-border-all text-amber-500"></i> Raster: {gridWidth} × {gridHeight} Kacheln
            </span>

            {/* Total Population, Ship Crew, Defense, Attack & Durability Summary across all placed objects on grid */}
            {(() => {
              const isShipObj = (obj: any) => {
                const cat = (obj.category || '').toLowerCase();
                const nm = (obj.name || obj.title || '').toLowerCase();
                return (
                  cat.includes('schiff') || cat.includes('fahrzeug') ||
                  nm.includes('schiff') || nm.includes('boot') || nm.includes('galeone') ||
                  nm.includes('fregatte') || nm.includes('kanu') || nm.includes('barke') ||
                  nm.includes('luftschiff') || nm.includes('u-boot') || obj.shipSize !== undefined ||
                  obj.minCrew !== undefined
                );
              };

              const totalPopulation = (combatState.placedObjects || [])
                .filter((obj: any) => !isShipObj(obj))
                .reduce((acc: number, obj: any) => {
                  const defaults = getDefaultStatsForToken(obj.name || '', obj.category || '');
                  const popVal = obj.population !== undefined && obj.population !== null ? Number(obj.population) : (defaults.population || 0);
                  return acc + (isNaN(popVal) ? 0 : popVal);
                }, 0);

              const totalShipCrew = (combatState.placedObjects || [])
                .filter((obj: any) => isShipObj(obj))
                .reduce((acc: number, obj: any) => {
                  const defaults = getDefaultStatsForToken(obj.name || '', obj.category || '');
                  const popVal = obj.population !== undefined && obj.population !== null ? Number(obj.population) : (defaults.population || 0);
                  return acc + (isNaN(popVal) ? 0 : popVal);
                }, 0);

              const totalDefense = (combatState.placedObjects || []).reduce((acc: number, obj: any) => {
                const defaults = getDefaultStatsForToken(obj.name || '', obj.category || '');
                const defVal = obj.defense !== undefined && obj.defense !== null ? Number(obj.defense) : (defaults.defense || 0);
                return acc + (isNaN(defVal) ? 0 : defVal);
              }, 0);

              const totalAttack = (combatState.placedObjects || []).reduce((acc: number, obj: any) => {
                const defaults = getDefaultStatsForToken(obj.name || '', obj.category || '');
                const atkVal = obj.attack !== undefined && obj.attack !== null ? Number(obj.attack) : (defaults.attack || 0);
                return acc + (isNaN(atkVal) ? 0 : atkVal);
              }, 0);

              const totalDurability = (combatState.placedObjects || []).reduce((acc: number, obj: any) => {
                const defaults = getDefaultStatsForToken(obj.name || '', obj.category || '');
                const durVal = obj.durability !== undefined && obj.durability !== null ? Number(obj.durability) : (defaults.durability || 0);
                return acc + (isNaN(durVal) ? 0 : durVal);
              }, 0);
              
              if (totalPopulation > 0 || totalShipCrew > 0 || totalDefense > 0 || totalAttack > 0 || totalDurability > 0) {
                return (
                  <div className="flex flex-wrap items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[10.5px]">
                    {totalPopulation > 0 && (
                      <span className="text-sky-300 font-black flex items-center gap-1" title="Gesamtanzahl aller Bewohner auf dem Land/Raster (ohne Schiffsbesatzung)">
                        <span>👥</span> {totalPopulation.toLocaleString()}
                        <span className="text-[8.5px] text-slate-400 font-bold uppercase hidden lg:inline">Bewohner</span>
                      </span>
                    )}
                    {totalShipCrew > 0 && (
                      <span className="text-cyan-300 font-black flex items-center gap-1" title="Gesamtanzahl der Besatzung an Bord von Schiffen/Fahrzeugen">
                        <span>⛵</span> {totalShipCrew.toLocaleString()}
                        <span className="text-[8.5px] text-slate-400 font-bold uppercase hidden lg:inline">Besatzung</span>
                      </span>
                    )}
                    {totalDefense > 0 && (
                      <span className="text-emerald-300 font-black flex items-center gap-1" title="Gesamter Verteidigungswert auf dem Raster">
                        <span>🛡️</span> {totalDefense.toLocaleString()}
                        <span className="text-[8.5px] text-slate-400 font-bold uppercase hidden lg:inline">Verteidigung</span>
                      </span>
                    )}
                    {totalAttack > 0 && (
                      <span className="text-red-400 font-black flex items-center gap-1" title="Gesamte Angriffskraft auf dem Raster">
                        <span>⚔️</span> {totalAttack.toLocaleString()}
                        <span className="text-[8.5px] text-slate-400 font-bold uppercase hidden lg:inline">Angriff</span>
                      </span>
                    )}
                    {totalDurability > 0 && (
                      <span className="text-rose-300 font-black flex items-center gap-1" title="Gesamte Haltbarkeit/Struktur auf dem Raster">
                        <span>🧱</span> {totalDurability.toLocaleString()}
                        <span className="text-[8.5px] text-slate-400 font-bold uppercase hidden lg:inline">Haltbarkeit</span>
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase tracking-wider text-[9.5px]">Kachel-Größe:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setTilePx(prev => Math.max(20, prev - 8))}
                className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-all cursor-pointer"
                title="Kacheln verkleinern"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-amber-400 font-mono font-bold w-10 text-center text-xs">{tilePx}px</span>
              <button
                onClick={() => setTilePx(prev => Math.min(120, prev + 8))}
                className="p-1 hover:bg-slate-800 text-slate-300 rounded transition-all cursor-pointer"
                title="Kacheln vergrößern"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1">
              {[
                { size: 28, label: '28px' },
                { size: 48, label: '48px' },
                { size: 64, label: '64px' },
                { size: 84, label: '84px' }
              ].map(preset => (
                <button
                  key={preset.size}
                  onClick={() => setTilePx(preset.size)}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-bold border transition-all cursor-pointer ${
                    tilePx === preset.size
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPanOffset({ x: 0, y: 0 })}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1 text-[10px] font-bold transition-all shadow-sm cursor-pointer"
              title="Kamera-Position zentrieren"
            >
              <RotateCcw className="w-3 h-3 text-amber-400" /> Zentrieren
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="flex items-center gap-1 text-amber-400">⚡ Spieler</span>
            <span className="flex items-center gap-1 text-sky-400">⛵ Schiffe</span>
            <span className="flex items-center gap-1 text-emerald-400">👤 NPCs</span>
            <span className="flex items-center gap-1 text-purple-400">💎 Schätze</span>
            <span className="flex items-center gap-1 text-red-400">👿 Gegner</span>
          </div>
        </div>

        {/* Grid Viewport */}
        <div 
          ref={viewportRef}
          className={`p-6 min-h-[550px] max-h-[700px] overflow-hidden flex items-center justify-center bg-slate-950/90 relative select-none ${
            isPanDragging || activeTool === 'pan' || isSpacePressed ? 'cursor-grabbing' : 'cursor-crosshair'
          }`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          {/* Active Relocation Mode Banner */}
          {movingObjectId && (() => {
            const movingObj = (combatState.placedObjects || []).find((o: any) => o.id === movingObjectId);
            return (
              <div className="absolute top-3 left-3 right-3 z-30 bg-amber-500/25 border-2 border-amber-400 text-amber-100 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2 truncate">
                  <Move className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="truncate">Versetzen aktiv für <strong>"{movingObj?.name || 'Objekt'}"</strong>: Klicke auf eine Kachel im Raster, um die neue Position festzulegen!</span>
                </div>
                <button
                  onClick={() => setMovingObjectId(null)}
                  className="px-3 py-1 bg-slate-950 hover:bg-slate-900 border border-amber-400 text-amber-300 text-xs font-bold rounded-lg cursor-pointer transition-all shrink-0"
                >
                  Abbrechen
                </button>
              </div>
            );
          })()}

          {/* Unique Codex Entry Warning Banner */}
          {warningMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 left-3 right-3 z-40 bg-red-950/95 border border-red-500/60 text-red-100 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-extrabold shrink-0">⚠️ Warnung:</span>
                <span>{warningMessage}</span>
              </div>
              <button
                onClick={() => setWarningMessage(null)}
                className="text-red-400 hover:text-red-200 font-extrabold text-xs ml-2 cursor-pointer shrink-0"
              >
                ✕
              </button>
            </motion.div>
          )}

          {/* Active Pan Position Badge */}
          {(activeTool === 'pan' || isSpacePressed || panOffset.x !== 0 || panOffset.y !== 0) && (
            <div className="absolute top-2 left-2 z-10 bg-slate-900/90 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg text-[10px] font-mono shadow-md backdrop-blur flex items-center gap-2">
              <Hand className="w-3 h-3" />
              <span>Kamera: X: {Math.round(panOffset.x)}px, Y: {Math.round(panOffset.y)}px</span>
              {(panOffset.x !== 0 || panOffset.y !== 0) && (
                <button 
                  onClick={() => setPanOffset({ x: 0, y: 0 })}
                  className="underline text-slate-300 hover:text-amber-300 ml-1 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          )}

          <div 
            ref={gridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridWidth}, ${tilePx}px)`,
              gridTemplateRows: `repeat(${gridHeight}, ${tilePx}px)`,
              width: `${gridWidth * tilePx}px`,
              height: `${gridHeight * tilePx}px`,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              transition: isPanDragging ? 'none' : 'transform 0.05s ease-out'
            }}
            className="gap-[0.5px] bg-slate-900 border border-slate-800/80 shadow-2xl shrink-0"
          >
            {cells.map(cell => {
              let cellBg = '#1e293b';
              let cellBorder = 'rgba(255,255,255,0.05)';

              if (cell.customStyle) {
                cellBg = cell.customStyle.color;
                cellBorder = cell.customStyle.border + '35';
              }

              const isHighlighted = activeHighlightKeys.has(cell.coordKey);
              const isSelectedInZoneTool = selectedZoneCells.some(cz => cz.col === cell.col && cz.row === cell.row);

              return (
                <div
                  key={cell.coordKey}
                  onMouseDown={(e) => {
                    if (e.button === 1 || isSpacePressed || activeTool === 'pan') {
                      return;
                    }
                    e.preventDefault();
                    if (
                      ((activeTool === 'terrain' || activeTool === 'eraser') && terrainBrushMode === 'box') ||
                      (activeTool === 'zone' && zoneBrushMode === 'box')
                    ) {
                      setBoxStartCell({ col: cell.col, row: cell.row });
                    }
                    setIsMouseDown(true);
                    handleCellAction(cell.col, cell.row, false);
                  }}
                  onMouseEnter={() => {
                    setHoverCell({ col: cell.col, row: cell.row });
                    if (isMouseDown && !isPanDragging && !isSpacePressed && activeTool !== 'pan') {
                      if (
                        ((activeTool === 'terrain' || activeTool === 'eraser') && terrainBrushMode === 'brush') ||
                        activeTool === 'player' ||
                        activeTool === 'token' ||
                        (activeTool === 'zone' && zoneBrushMode === 'brush')
                      ) {
                        handleCellAction(cell.col, cell.row, true);
                      }
                    }
                  }}
                  style={{
                    backgroundColor: cellBg,
                    borderColor: cellBorder,
                    width: `${tilePx}px`,
                    height: `${tilePx}px`
                  }}
                  className={`border-[0.5px] relative flex items-center justify-center transition-colors duration-100 cursor-pointer group ${
                    isHighlighted
                      ? `ring-2 ${activeTool === 'zone' ? 'ring-amber-400' : 'ring-emerald-400'} z-10 brightness-125`
                      : 'hover:brightness-125'
                  }`}
                  title={`${cell.col}, ${cell.row} (${cell.terrainType || 'Standard'})${
                    cell.cellZones && cell.cellZones.length > 0 
                      ? ` [Zone: ${cell.cellZones.map((z: any) => z.name).join(', ')}]` 
                      : ''
                  }`}
                >
                  {/* Brush / Box Preview Highlight Overlay */}
                  {isHighlighted && (
                    <div className={`absolute inset-0 pointer-events-none animate-pulse border ${
                      activeTool === 'zone'
                        ? 'bg-amber-500/25 border-amber-400/60'
                        : 'bg-emerald-400/25 border-emerald-300/60'
                    }`} />
                  )}

                  {/* Zone Tool Selection Overlay */}
                  {activeTool === 'zone' && isSelectedInZoneTool && (
                    <div className="absolute inset-0 bg-amber-500/35 border-2 border-dashed border-amber-400 z-10 pointer-events-none animate-pulse" />
                  )}

                  {/* Saved Zones Overlay & Anchor Name Label */}
                  {cell.cellZones && cell.cellZones.map((zone: any) => {
                    const isAnchor = zone.x === cell.col && zone.y === cell.row;
                    return (
                      <div
                        key={zone.id}
                        className="absolute inset-0 pointer-events-none border border-dashed border-amber-500/40 bg-amber-500/5 z-0 opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center overflow-visible"
                      >
                        {isAnchor && (
                          <div className="absolute bg-slate-950/85 border border-amber-500/40 rounded px-1.5 py-0.5 text-[8px] text-amber-300 font-bold text-center select-none z-10 pointer-events-none whitespace-nowrap shadow-md scale-90 md:scale-100 max-w-[120px] truncate uppercase tracking-tight">
                            {zone.name}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Token Overlay */}
                  {cell.tokens && cell.tokens.length > 0 && (
                    cell.tokens.length === 1 ? (
                      // Single token rendering (centered)
                      (() => {
                        const t = cell.tokens[0];
                        const tCat = (t.category || '').toLowerCase();
                        const isChar = t.isPlayer || 
                          tCat.includes('gegner') || tCat.includes('monster') || tCat.includes('feind') || 
                          tCat.includes('charakter') || tCat.includes('npc') || tCat.includes('bewohner') || 
                          tCat.includes('fraktion') || tCat.includes('gruppe') ||
                          t.category === 'Fraktions-Mitglied';
                        
                        const isReduced = t.isPlayer || 
                          tCat.includes('gegner') || tCat.includes('monster') || tCat.includes('feind') || 
                          tCat.includes('charakter') || tCat.includes('npc') || tCat.includes('bewohner') || 
                          tCat.includes('fraktion') || tCat.includes('gruppe') ||
                          t.category === 'Fraktions-Mitglied';
                        
                        const tokenColorStyle = getTokenColorStyle(t.category, t.isPlayer, t.color);

                        const containerClassName = isChar
                          ? `absolute rounded-full flex items-center justify-center font-black shadow-lg select-none border group/token relative ${
                              isReduced ? 'w-1/2 h-1/2' : 'inset-0.5 w-[calc(100%-4px)] h-[calc(100%-4px)]'
                            } ${tokenColorStyle}`
                          : `absolute flex items-center justify-center font-black select-none group/token relative ${
                              isReduced ? 'w-1/2 h-1/2' : 'inset-0.5 w-[calc(100%-4px)] h-[calc(100%-4px)]'
                            } bg-transparent text-slate-100 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]`;

                        const computedFontSize = isChar
                          ? `${Math.max(
                              isReduced ? 8 : 12,
                              Math.floor(tilePx * (isReduced ? 0.28 : 0.48))
                            )}px`
                          : `${Math.max(
                              isReduced ? 11 : 16,
                              Math.floor(tilePx * (isReduced ? 0.40 : 0.68))
                            )}px`;
                        
                        return (
                          <motion.div
                            key={t.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={containerClassName}
                            style={{
                              fontSize: computedFontSize,
                              backgroundColor: t.color ? `${t.color}cc` : undefined,
                              borderColor: t.color ? t.color : undefined
                            }}
                          >
                            {renderTokenIconElement(t.icon, t.label)}

                            {/* Count Badge on Cell */}
                            {t.currentCount !== undefined && (
                              <span
                                className={`absolute -bottom-1 -left-1 rounded-full bg-red-600 border border-slate-950 flex items-center justify-center text-white font-black shadow-md z-10 font-mono ${
                                  isReduced ? 'px-0.5 min-w-[12px] h-3 text-[6px]' : 'px-1 min-w-[16px] h-4 text-[8px]'
                                }`}
                                title={`Anzahl: ${t.currentCount}${t.maxCapacity ? ` / ${t.maxCapacity}` : ''}`}
                              >
                                {t.currentCount}
                              </span>
                            )}

                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold shadow-2xl pointer-events-none whitespace-nowrap border bg-slate-950 border-amber-500/50 text-slate-200 scale-90 opacity-0 group-hover/token:opacity-100 group-hover/token:scale-100 transition-all z-50 duration-150">
                              <div className="text-amber-300 font-extrabold flex items-center gap-1">
                                <span>{t.icon}</span> {t.label}
                              </div>
                              {t.loreEntry && (
                                <div className="text-amber-400 font-semibold text-[8.5px] flex items-center gap-1 mt-0.5">
                                  <BookOpen className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                  <span>Kodex: {t.loreEntry.title}</span>
                                </div>
                              )}
                              {(t.population !== undefined || t.defense !== undefined) && (
                                <div className="flex items-center gap-2 mt-1 py-0.5 border-t border-slate-800 text-[8.5px] font-bold">
                                  {t.population !== undefined && (
                                    <span className="text-sky-300 flex items-center gap-0.5">
                                      <span>👥 Bewohner:</span> {t.population}
                                    </span>
                                  )}
                                  {t.defense !== undefined && (
                                    <span className="text-emerald-300 flex items-center gap-0.5">
                                      <span>🛡️ Verteidigung:</span> {t.defense}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="text-[8px] text-slate-400 font-normal">{t.category} (X:{cell.col}, Y:{cell.row})</div>
                            </div>
                          </motion.div>
                        );
                      })()
                    ) : (
                      // Multiple tokens rendering (dynamic grid depending on count)
                      (() => {
                        const tokenCount = cell.tokens.length;
                        const gridLayoutClass = tokenCount === 2 
                          ? "grid-cols-2 grid-rows-1" 
                          : "grid-cols-2 grid-rows-2";
                        
                        const fontSizePx = tokenCount === 2
                          ? Math.max(8, Math.floor(tilePx * 0.32))
                          : Math.max(6, Math.floor(tilePx * 0.22));

                        return (
                          <div className={`absolute inset-0 grid ${gridLayoutClass} gap-0.5 p-0.5 w-full h-full`}>
                            {cell.tokens.map((t) => {
                              const tCat = (t.category || '').toLowerCase();
                              const isChar = t.isPlayer || 
                                tCat.includes('gegner') || tCat.includes('monster') || tCat.includes('feind') || 
                                tCat.includes('charakter') || tCat.includes('npc') || tCat.includes('bewohner') || 
                                tCat.includes('fraktion') || tCat.includes('gruppe') ||
                                t.category === 'Fraktions-Mitglied';
                              
                              const tokenColorStyle = getTokenColorStyle(t.category, t.isPlayer, t.color);

                              const itemClassName = isChar
                                ? `flex items-center justify-center font-black shadow-md select-none border group/token relative w-full h-full rounded-full ${tokenColorStyle}`
                                : `flex items-center justify-center font-black select-none group/token relative w-full h-full bg-transparent text-slate-100 filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.85)]`;

                              const computedFontSize = isChar
                                ? `${fontSizePx}px`
                                : `${Math.floor(fontSizePx * 1.35)}px`;
                              
                              return (
                                <motion.div
                                  key={t.id}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className={itemClassName}
                                  style={{
                                    fontSize: computedFontSize,
                                    backgroundColor: t.color ? `${t.color}cc` : undefined,
                                    borderColor: t.color ? t.color : undefined
                                  }}
                                >
                                  {renderTokenIconElement(t.icon, t.label)}

                                  {/* Count Badge on Cell */}
                                  {t.currentCount !== undefined && (
                                    <span
                                      className="absolute -bottom-0.5 -left-0.5 rounded-full bg-red-600 border border-slate-950 flex items-center justify-center text-white font-black shadow-sm z-10 w-2.5 h-2.5 text-[5px] font-mono"
                                      title={`Anzahl: ${t.currentCount}${t.maxCapacity ? ` / ${t.maxCapacity}` : ''}`}
                                    >
                                      {t.currentCount}
                                    </span>
                                  )}

                                  {/* Tooltip on hover */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold shadow-2xl pointer-events-none whitespace-nowrap border bg-slate-950 border-amber-500/50 text-slate-200 scale-90 opacity-0 group-hover/token:opacity-100 group-hover/token:scale-100 transition-all z-50 duration-150">
                                    <div className="text-amber-300 font-extrabold flex items-center gap-1">
                                      <span>{t.icon}</span> {t.label}
                                    </div>
                                    {t.loreEntry && (
                                      <div className="text-amber-400 font-semibold text-[8.5px] flex items-center gap-1 mt-0.5">
                                        <BookOpen className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                        <span>Kodex: {t.loreEntry.title}</span>
                                      </div>
                                    )}
                                    {(t.population !== undefined || t.defense !== undefined) && (
                                      <div className="flex items-center gap-2 mt-1 py-0.5 border-t border-slate-800 text-[8.5px] font-bold">
                                        {t.population !== undefined && (
                                          <span className="text-sky-300 flex items-center gap-0.5">
                                            <span>👥 {(t.category || '').toLowerCase().includes('schiff') || (t.name || '').toLowerCase().includes('schiff') || (t.name || '').toLowerCase().includes('boot') || (t.name || '').toLowerCase().includes('galeone') ? 'Besatzung:' : 'Bewohner:'}</span> {t.population}
                                          </span>
                                        )}
                                        {t.defense !== undefined && (
                                          <span className="text-emerald-300 flex items-center gap-0.5">
                                            <span>🛡️ Verteidigung:</span> {t.defense}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    <div className="text-[8px] text-slate-400 font-normal">{t.category} (X:{cell.col}, Y:{cell.row})</div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        );
                      })()
                    )
                  )}

                  {/* Custom Zone Tooltip on Cell Hover (only if there are no other tokens in the way) */}
                  {cell.cellZones && cell.cellZones.length > 0 && (!cell.tokens || cell.tokens.length === 0) && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold shadow-2xl pointer-events-none whitespace-nowrap border bg-slate-950 border-amber-500/50 text-slate-200 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all z-50 duration-150">
                      {cell.cellZones.map((zone: any) => (
                        <div key={zone.id} className="space-y-0.5">
                          <div className="text-amber-300 font-extrabold flex items-center gap-1">
                            <span>🗺️</span> {zone.name}
                          </div>
                          {zone.loreEntry && (
                            <div className="text-amber-400 font-semibold text-[8.5px] flex items-center gap-1 mt-0.5">
                              <BookOpen className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span>Kodex: {zone.loreEntry.title}</span>
                            </div>
                          )}
                          <div className="text-[8px] text-slate-400 font-normal">Zone (X:{cell.col}, Y:{cell.row})</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📍 PLATZIERTE EINHEITEN & OBJEKTE MANAGEMENT DRAWER */}
      <div className="bg-slate-950/90 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
        <button
          onClick={() => setIsPlacedListExpanded(!isPlacedListExpanded)}
          className="w-full p-3.5 bg-slate-900/80 hover:bg-slate-800/80 flex items-center justify-between text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-amber-300">
              Platziertes Inventar, Schiffe & Figuren auf der Karte ({groupPlacedObjects(placedObjects).length} Einträge)
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">
              {placedObjects.length} Objekte
            </span>
            {isPlacedListExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {isPlacedListExpanded && (() => {
          const displayObjects = groupPlacedObjects(placedObjects);
          return (
            <div className="p-4 space-y-3 border-t border-slate-800/80">
              {displayObjects.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs italic">
                  Es wurden noch keine Einheiten, Schiffe oder Schätze auf dem Raster platziert.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {displayObjects.map((obj: any) => {
                    const isEditing = editingTokenId === obj.id;
                    const linkedEntry = obj.loreEntryId ? (allLocationEntries.find(l => l.id === obj.loreEntryId) || loreDatabase.find(l => l.id === obj.loreEntryId)) : undefined;

                    if (obj.isGroup) {
                      return (
                        <div
                          key={obj.id}
                          className="bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/40 p-3.5 rounded-xl flex flex-col justify-between gap-3 shadow-md transition-all overflow-hidden w-full min-w-0 relative group/zone"
                        >
                          {/* Decorative badge */}
                          <div className="absolute top-0 right-0 p-1 text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border-b border-l border-emerald-500/20 rounded-bl-lg select-none">
                            Zusammenhängend
                          </div>

                          {/* Name, Category, Icon & Position */}
                          <div className="flex items-start justify-between gap-2 min-w-0 w-full">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-lg shrink-0 p-1 bg-emerald-950 rounded-lg border border-emerald-800 leading-none">
                                {obj.icon}
                              </span>
                              <div className="min-w-0 flex-1">
                                <h5 className="text-sm font-extrabold text-slate-100 truncate leading-snug flex items-center gap-1.5 flex-wrap" title={obj.name}>
                                  <span>{obj.name}</span>
                                  <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                                    {obj.items.length} Felder
                                  </span>
                                </h5>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                                  <span className="text-emerald-400 font-medium truncate">{obj.category}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="font-mono text-slate-300 font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]" title={`Bereich: X:${obj.minX}-${obj.maxX}, Y:${obj.minY}-${obj.maxY}`}>
                                    Bereich: X:{obj.minX}-{obj.maxX}, Y:{obj.minY}-{obj.maxY}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Description of the Zone */}
                          <p className="text-xs text-slate-400 leading-relaxed italic bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/10">
                            {obj.description}
                          </p>

                          {/* Main Action Bar */}
                          <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80 flex-wrap">
                            <div className="text-[10px] text-slate-500 font-bold uppercase select-none">
                              Zonen-Aktionen
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Zentrieren */}
                              <button
                                onClick={() => handleCenterOnObject(obj.x, obj.y)}
                                className="p-1.5 bg-slate-950 hover:bg-emerald-900/40 text-slate-300 hover:text-emerald-300 rounded-lg border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer"
                                title="Kamera auf Zentrum der Zone ausrichten"
                              >
                                <Compass className="w-3.5 h-3.5" />
                              </button>

                              {/* Löschen */}
                              <button
                                onClick={() => handleRemovePlacedObject(obj.items.map((i: any) => i.id))}
                                className="p-1.5 bg-slate-950 hover:bg-red-950/80 text-red-400 hover:text-red-300 rounded-lg border border-slate-800 transition-all cursor-pointer"
                                title="Gesamte Zone (alle Objekte) löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                    <div
                      key={obj.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex flex-col justify-between gap-3 shadow-md transition-all overflow-hidden w-full min-w-0"
                    >
                      {/* Name, Category, Icon & Position */}
                      <div className="flex items-start justify-between gap-2 min-w-0 w-full">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {obj.faction || ['🟢', '🔵', '🔴'].includes(obj.icon) ? (
                            <span
                              className="w-4 h-4 rounded-full shrink-0 shadow-md border-2 border-slate-950"
                              style={{ backgroundColor: getTokenCircleStyle(obj.category, obj.faction, false).dotBg }}
                              title={obj.faction || obj.category}
                            />
                          ) : (
                            <span className="text-lg shrink-0 p-1 bg-slate-950 rounded-lg border border-slate-800/80 leading-none">
                              {obj.icon || '📌'}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <h5 className="text-sm sm:text-base font-extrabold text-slate-100 truncate leading-snug flex items-center gap-1.5 flex-wrap" title={obj.name}>
                              <span>{obj.name}</span>
                              {obj.currentCount !== undefined && (
                                <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                                  Anzahl: {obj.currentCount}
                                  {obj.maxCapacity !== undefined ? ` / ${obj.maxCapacity}` : ''}
                                </span>
                              )}
                            </h5>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                              <span className="text-amber-400 font-medium truncate">{obj.category}</span>
                              {obj.faction && (
                                <>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-sky-300 font-bold truncate">{obj.faction}</span>
                                </>
                              )}
                              <span className="text-slate-600">•</span>
                              <span className="font-mono text-slate-300 font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
                                X: {obj.x}, Y: {obj.y}
                              </span>
                            </div>
                            {/* Ship / Structure Stats Badges */}
                            {(obj.shipSize || obj.minCrew !== undefined || obj.population !== undefined || obj.defense !== undefined) && (
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] mt-1.5 font-bold">
                                {obj.shipSize && (
                                  <span className="bg-sky-950 text-sky-300 border border-sky-800/80 px-1.5 py-0.5 rounded capitalize text-[9px]">
                                    ⛵ {obj.shipSize}
                                  </span>
                                )}
                                {obj.minCrew !== undefined && (
                                  <span className="bg-amber-950/60 text-amber-300 border border-amber-800/50 px-1.5 py-0.5 rounded text-[9px]">
                                    ⚓ Min: {obj.minCrew}
                                  </span>
                                )}
                                {obj.population !== undefined && (
                                  <span className="bg-slate-950 text-sky-300 border border-slate-800 px-1.5 py-0.5 rounded text-[9px]">
                                    👥 Besatzung: {obj.population}{obj.maxCapacity !== undefined ? ` / ${obj.maxCapacity}` : ''}
                                  </span>
                                )}
                                {obj.defense !== undefined && (
                                  <span className="bg-slate-950 text-emerald-300 border border-slate-800 px-1.5 py-0.5 rounded text-[9px]">
                                    🛡️ Def: {obj.defense}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Main Action Bar */}
                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80 flex-wrap">
                        {/* Versetzen (Move on map) */}
                        <button
                          onClick={() => {
                            setMovingObjectId(obj.id);
                            gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                            movingObjectId === obj.id
                              ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                          }`}
                          title="Marker auf der Raster-Karte versetzen"
                        >
                          <Move className="w-3.5 h-3.5" />
                          <span>{movingObjectId === obj.id ? 'Aktiv...' : 'Versetzen'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {/* Zentrieren */}
                          <button
                            onClick={() => handleCenterOnObject(obj.x, obj.y)}
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-lg border border-slate-800 transition-all cursor-pointer"
                            title="Kamera auf Marker zentrieren"
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </button>

                          {/* Bearbeiten */}
                          <button
                            onClick={() => {
                              if (obj.category === 'Gebiet & Zone' || obj.zoneCells) {
                                setActiveTool('zone');
                                setEditingZoneId(obj.id);
                                setSelectedZoneCells((obj.zoneCells || []).map((cz: any) => ({ col: cz.x, row: cz.y })));
                                setZoneLoreEntryId(obj.loreEntryId || '');
                                // Scroll up to the zone tool subbar
                                setTimeout(() => {
                                  const toolEl = document.getElementById('zone-tool-subbar');
                                  if (toolEl) {
                                    toolEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  } else {
                                    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 100);
                              } else {
                                if (isEditing) {
                                  setEditingTokenId(null);
                                } else {
                                  setEditingTokenId(obj.id);
                                  setEditingTokenData({
                                    name: obj.name,
                                    icon: obj.icon,
                                    category: obj.category,
                                    description: obj.description || '',
                                    loreEntryId: obj.loreEntryId || '',
                                    currentCount: obj.currentCount,
                                    maxCapacity: obj.maxCapacity,
                                    minCrew: obj.minCrew,
                                    shipSize: obj.shipSize,
                                    population: obj.population,
                                    defense: obj.defense,
                                    attack: obj.attack,
                                    durability: obj.durability
                                  });
                                }
                              }
                            }}
                            className={`p-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg border transition-all cursor-pointer ${
                              editingZoneId === obj.id
                                ? 'text-amber-500 border-amber-500/50 bg-slate-900 animate-pulse'
                                : 'text-sky-400 hover:text-sky-300 border-slate-800'
                            }`}
                            title={obj.category === 'Gebiet & Zone' || obj.zoneCells ? 'Zone-Zellen & Kodex bearbeiten' : 'Bearbeiten'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Löschen */}
                          <button
                            onClick={() => handleRemovePlacedObject(obj.id)}
                            className="p-1.5 bg-slate-950 hover:bg-red-950/80 text-red-400 hover:text-red-300 rounded-lg border border-slate-800 transition-all cursor-pointer"
                            title="Löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Kodex-Verknüpfung / Bearbeitungsbereich */}
                      <div className="w-full min-w-0 overflow-hidden">
                        {isEditing ? (
                          <div className="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-amber-500/40 w-full min-w-0">
                            <div className="text-[10px] font-bold text-amber-300">Marker bearbeiten:</div>
                            <input
                              type="text"
                              value={editingTokenData?.name || ''}
                              onChange={(e) => setEditingTokenData(prev => prev ? { ...prev, name: e.target.value } : null)}
                              className="w-full bg-slate-900 border border-slate-700 text-white text-xs px-2 py-1 rounded font-bold outline-none focus:border-amber-500"
                              placeholder="Name des Tokens"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingTokenData?.icon || ''}
                                onChange={(e) => setEditingTokenData(prev => prev ? { ...prev, icon: e.target.value } : null)}
                                className="w-10 bg-slate-900 border border-slate-700 text-center text-xs p-1 rounded font-bold shrink-0 outline-none focus:border-amber-500"
                                placeholder="Emoji"
                              />
                              <select
                                value={editingTokenData?.loreEntryId || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const entry = allLocationEntries.find(l => l.id === val) || loreDatabase.find(l => l.id === val);
                                  const autoMax = entry?.details?.maxCapacity || entry?.details?.maxMembers;
                                  setEditingTokenData(prev => prev ? {
                                    ...prev,
                                    loreEntryId: val,
                                    name: entry ? entry.title : prev.name,
                                    maxCapacity: autoMax !== undefined ? autoMax : prev.maxCapacity
                                  } : null);
                                }}
                                className="w-full max-w-full truncate bg-slate-900 border border-slate-700 text-amber-200 text-[11px] p-1 rounded font-bold outline-none"
                              >
                                <option value="">-- Kein Kodex-Eintrag --</option>
                                {getGroupedLoreEntries(getContextualLoreEntries(editingTokenData?.category || obj.category)).map(group => (
                                  <optgroup key={group.category} label={group.label} className="bg-slate-900 text-amber-300 font-bold">
                                    {group.items.map(entry => (
                                      <option key={entry.id} value={entry.id} className="bg-slate-950 text-slate-100 font-normal truncate">
                                        {entry.title}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>

                            {/* Belegung / Anzahl & Kapazität Bearbeitung */}
                            <div className="grid grid-cols-2 gap-2 mt-1.5 border-t border-slate-800 pt-1.5">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase">Aktuelle Anzahl</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={editingTokenData?.currentCount || ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                    setEditingTokenData(prev => prev ? { ...prev, currentCount: val } : null);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 text-white text-[11px] px-2 py-1 rounded outline-none focus:border-amber-500"
                                  placeholder="Anzahl"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase">Max. Kapazität</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={editingTokenData?.maxCapacity || ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                    setEditingTokenData(prev => prev ? { ...prev, maxCapacity: val } : null);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 text-white text-[11px] px-2 py-1 rounded outline-none focus:border-amber-500"
                                  placeholder="Max."
                                />
                              </div>
                            </div>

                            {/* Schiffsgröße & Mindestbesatzung (if ship) */}
                            {((obj.category || '').toLowerCase().includes('schiff') || (obj.category || '').toLowerCase().includes('fahrzeug') || (obj.name || '').toLowerCase().includes('schiff') || (obj.name || '').toLowerCase().includes('boot') || (obj.name || '').toLowerCase().includes('galeone') || editingTokenData?.minCrew !== undefined || editingTokenData?.shipSize) && (
                              <div className="grid grid-cols-2 gap-2 mt-1.5 border-t border-slate-800 pt-1.5">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase">⛵ Schiffsgröße</label>
                                  <select
                                    value={editingTokenData?.shipSize || 'mittel'}
                                    onChange={(e) => {
                                      const sz = e.target.value as 'klein' | 'mittel' | 'groß';
                                      const newStats = getShipStatsForSize(editingTokenData?.name || obj.name, sz);
                                      setEditingTokenData(prev => prev ? {
                                        ...prev,
                                        shipSize: sz,
                                        minCrew: newStats.minCrew,
                                        maxCapacity: newStats.maxCapacity,
                                        population: newStats.population,
                                        defense: newStats.defense,
                                        attack: newStats.attack,
                                        durability: newStats.durability
                                      } : null);
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 text-amber-300 text-[11px] px-2 py-1 rounded outline-none focus:border-amber-500 font-bold cursor-pointer"
                                  >
                                    <option value="klein">Klein</option>
                                    <option value="mittel">Mittel</option>
                                    <option value="groß">Groß</option>
                                  </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] text-slate-400 font-bold uppercase">⚓ Min. Besatzung</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editingTokenData?.minCrew !== undefined ? editingTokenData.minCrew : ''}
                                    onChange={(e) => {
                                      const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                      setEditingTokenData(prev => prev ? { ...prev, minCrew: val } : null);
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-bold text-[11px] px-2 py-1 rounded outline-none focus:border-amber-500"
                                    placeholder="Min. Crew"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Bewohnerzahl, Verteidigung, Angriffskraft & Haltbarkeit Bearbeitung */}
                            <div className="grid grid-cols-2 gap-2 mt-1.5 border-t border-slate-800 pt-1.5">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase">👥 Besatzung (An Bord)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingTokenData?.population !== undefined ? editingTokenData.population : ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                    setEditingTokenData(prev => prev ? { ...prev, population: val } : null);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 text-sky-300 font-bold text-[11px] px-2 py-1 rounded outline-none focus:border-amber-500"
                                  placeholder="An Bord"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase">🛡️ Verteidigung</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingTokenData?.defense !== undefined ? editingTokenData.defense : ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                    setEditingTokenData(prev => prev ? { ...prev, defense: val } : null);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 text-white text-[11px] px-2 py-1 rounded outline-none focus:border-amber-500"
                                  placeholder="z.B. 45"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase">⚔️ Angriffskraft</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingTokenData?.attack !== undefined ? editingTokenData.attack : ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                    setEditingTokenData(prev => prev ? { ...prev, attack: val } : null);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 text-red-300 font-bold text-[11px] px-2 py-1 rounded outline-none focus:border-amber-500"
                                  placeholder="0"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] text-slate-400 font-bold uppercase">🧱 Haltbarkeit</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editingTokenData?.durability !== undefined ? editingTokenData.durability : ''}
                                  onChange={(e) => {
                                    const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                                    setEditingTokenData(prev => prev ? { ...prev, durability: val } : null);
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 text-rose-300 font-bold text-[11px] px-2 py-1 rounded outline-none focus:border-amber-500"
                                  placeholder="Max"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                onClick={() => setEditingTokenId(null)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded cursor-pointer"
                              >
                                Abbrechen
                              </button>
                              <button
                                onClick={() => handleSaveEditedToken(obj.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded cursor-pointer shadow"
                              >
                                Speichern
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {linkedEntry ? (
                              <div className="flex items-center justify-between gap-1.5 w-full bg-amber-950/30 border border-amber-500/30 px-2.5 py-1.5 rounded-lg overflow-hidden min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="text-[11px] font-bold text-amber-200 truncate">{linkedEntry.title}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => setInspectingLoreEntry(linkedEntry)}
                                    className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer shrink-0"
                                    title="Kodex-Eintrag im Detail lesen"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" /> Kodex
                                  </button>
                                  <button
                                    onClick={() => handleQuickLinkTokenToLore(obj.id, '')}
                                    className="p-0.5 text-slate-400 hover:text-red-400 text-[10px] font-bold transition-all cursor-pointer"
                                    title="Verknüpfung auflösen"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full min-w-0 overflow-hidden">
                                <select
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleQuickLinkTokenToLore(obj.id, e.target.value);
                                    }
                                  }}
                                  className="w-full max-w-full truncate bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-[11px] rounded-lg px-2.5 py-1.5 outline-none font-medium cursor-pointer transition-all"
                                >
                                  <option value="">📖 Mit Kodex-Eintrag verknüpfen...</option>
                                  {getGroupedLoreEntries(getContextualLoreEntries(obj.category)).map(group => (
                                    <optgroup key={group.category} label={group.label} className="bg-slate-900 text-amber-300 font-bold">
                                      {group.items.map(entry => (
                                        <option key={entry.id} value={entry.id} className="bg-slate-950 text-slate-100 font-normal truncate">
                                          {entry.title}
                                        </option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
      </div>

      {/* ⚙️ Sekundäre Einstellungen (Raster-Abmessungen & KI) */}
      {isSettingsExpanded && (
        <div className="pt-4 border-t border-slate-800 space-y-5">
          {/* Row 1: Abmessungen & Vorlagen */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <i className="fa-solid fa-sliders text-amber-500"></i> Raster-Abmessungen & Vorlagen
              </h4>
              <p className="text-[10.5px] text-slate-400">
                Passe die Gesamtgröße an oder generiere ein Musterdorf als Zeichengrundlage.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400">Breite:</span>
                <input
                  type="number"
                  min={10}
                  max={50}
                  value={gridWidth}
                  onChange={(e) => updateGridSize(parseInt(e.target.value) || 30, gridHeight)}
                  className="w-12 bg-slate-900 text-xs font-bold text-center text-white border border-slate-800 rounded p-0.5 outline-none focus:border-amber-500"
                />
                <span className="text-[10px] font-bold text-slate-400 ml-1.5">Höhe:</span>
                <input
                  type="number"
                  min={10}
                  max={40}
                  value={gridHeight}
                  onChange={(e) => updateGridSize(gridWidth, parseInt(e.target.value) || 20)}
                  className="w-12 bg-slate-900 text-xs font-bold text-center text-white border border-slate-800 rounded p-0.5 outline-none focus:border-amber-500"
                />
              </div>

              <button
                onClick={handleGenerateVillage}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                title="Generiert ein Standard-Musterdorf"
              >
                <Wand2 className="w-3.5 h-3.5" /> Musterdorf
              </button>

              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-red-950/40 hover:bg-red-950/60 border border-red-900/40 text-red-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                title="Löscht das gesamte Feld"
              >
                <Trash2 className="w-3.5 h-3.5" /> Alles Löschen
              </button>
            </div>
          </div>

          {/* Row 2: 📐 Entfernung & Maßstab (Meter pro Kachel) */}
          <div className="bg-slate-950/90 border border-amber-500/30 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 shrink-0">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Kachel-Maßstab:</span>
                  <span className="text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    1 Kachel = {formatDistance(tileSizeMeters)}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-300 mt-0.5">
                  Gesamtfläche: <span className="text-amber-400 font-bold">{formatDistance(totalWidthMeters)} × {formatDistance(totalHeightMeters)}</span> ({totalAreaM2 >= 1000000 ? `${(totalAreaM2 / 1000000).toFixed(2)} km²` : `${totalAreaM2.toLocaleString('de-DE')} m²`})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Entfernung/Kachel:</span>
              {[
                { scale: 1, label: '1 m (Raum)' },
                { scale: 5, label: '5 m (Siedlung)' },
                { scale: 25, label: '25 m (Bezirk/Wald)' },
                { scale: 100, label: '100 m (Region)' },
                { scale: 500, label: '500 m (Grafschaft)' },
                { scale: 10000, label: '10 km (Welt/Ozean)' }
              ].map(preset => (
                <button
                  key={preset.scale}
                  onClick={() => onChangeCombatState({ ...combatState, tileSizeMeters: preset.scale })}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                    tileSizeMeters === preset.scale
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow font-black'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: ✨ KI Kachelkarte & Canon-Kodex Generierung Bar */}
          <div className="bg-gradient-to-r from-slate-950 via-amber-950/20 to-slate-950 border border-amber-500/40 p-4 rounded-xl space-y-2.5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 rounded-lg shadow-md font-black shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 flex-wrap">
                    <span>✨ KI-Kartograf aus Kodex, Canon & Weltkarte</span>
                    {loreDatabase && loreDatabase.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono">
                        {loreDatabase.length} Kodex-Einträge
                      </span>
                    )}
                    {subTerritoriesCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono">
                        {subTerritoriesCount} Untergebiete (Weltkarte)
                      </span>
                    )}
                  </h4>
                  <p className="text-[10.5px] text-slate-300 leading-snug">
                    Verwendet den Kodex, Kanon & alle vorhandenen Untergebiete der Weltkarte als Grundlage. Erstellt die 2D-Kachelkarte und platziert interaktive Tokens für jedes Untergebiet.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateAiMapFromLore}
                disabled={isGeneratingAiMap}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isGeneratingAiMap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analysiere Kodex & erzeuge Karte...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Aus Kodex & Canon generieren</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customAiPrompt}
                onChange={(e) => setCustomAiPrompt(e.target.value)}
                placeholder="Optionaler Zusatzwunsch (z. B. 'Baue ein Piratennest mit Tempel & Hafen' oder leer lassen)..."
                className="flex-1 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-amber-500"
              />
            </div>

            {aiSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{aiSuccessMessage}</span>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* 📖 KODEX-EINTRAG DETAIL MODAL */}
      <AnimatePresence>
        {inspectingLoreEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl relative text-slate-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-amber-500/30">
                    {getIconForLoreEntry(inspectingLoreEntry)}
                  </span>
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-wider">
                      {inspectingLoreEntry.category}
                    </span>
                    <h3 className="text-lg font-black text-amber-300 mt-0.5">
                      {inspectingLoreEntry.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setInspectingLoreEntry(null)}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Image if present */}
              {inspectingLoreEntry.image && (
                <div className="rounded-xl overflow-hidden border border-slate-800 max-h-56 bg-slate-950 flex items-center justify-center">
                  <img
                    src={inspectingLoreEntry.image}
                    alt={inspectingLoreEntry.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Beschreibung / Kanon:</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800 whitespace-pre-wrap">
                  {inspectingLoreEntry.description || 'Keine nähere Beschreibung vorhanden.'}
                </p>
              </div>

              {/* Secrets or Knowledge if present */}
              {inspectingLoreEntry.secretsStage1 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Öffentliches Wissen / Legenden:</h4>
                  <p className="text-xs text-slate-300 bg-amber-950/20 p-2.5 rounded-xl border border-amber-800/40">
                    {inspectingLoreEntry.secretsStage1}
                  </p>
                </div>
              )}

              {/* Footer Close Button */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setInspectingLoreEntry(null)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md cursor-pointer"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
