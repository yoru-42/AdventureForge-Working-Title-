import React, { useState, useMemo } from 'react';
import { WorldSetting, Territory, LoreEntry } from '../types';
import { generateOrganicShape } from '../utils/mapUtils';
import { GeminiService } from '../services/geminiService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import {
  Globe2, Sparkles, Waves, Mountain, Palmtree, Compass,
  Sliders, Check, RefreshCw, Layers, MapPin, X, ArrowRight,
  Anchor, Castle, Shield, Eye, BookOpen, AlertCircle
} from 'lucide-react';

interface WorldMapCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  world: WorldSetting;
  onSaveWorldMap: (newTerritories: Territory[], updatedWorld: Partial<WorldSetting>, generatedLore?: LoreEntry[]) => void;
  loreDatabase?: LoreEntry[];
  selectedTags?: string[];
}

export type WorldArchetype = 
  | 'blank'
  | 'archipelago' 
  | 'continents' 
  | 'island_realm' 
  | 'dual_continents' 
  | 'pangea' 
  | 'magical_shards' 
  | 'custom';

interface ArchetypeOption {
  id: WorldArchetype;
  name: string;
  subtitle: string;
  icon: string;
  seasCount: number;
  continentsCount: number;
  islandsCount: number;
  description: string;
  bgGradient: string;
  borderAccent: string;
}

const ARCHETYPES: ArchetypeOption[] = [
  {
    id: 'blank',
    name: 'Leere Karte / Minimaler Start',
    subtitle: 'Bedarfsgesteuerter Aufbau ohne Vorab-Gebiete',
    icon: '',
    seasCount: 0,
    continentsCount: 0,
    islandsCount: 0,
    description: 'Startet mit einem leeren Weltrahmen. Gebiete können manuell gezeichnet oder schrittweise während des Spielverlaufs hinzugefügt werden.',
    bgGradient: 'from-slate-950 to-slate-900',
    borderAccent: 'border-slate-800'
  },
  {
    id: 'archipelago',
    name: 'Ozeanwelt & Grand-Archipel',
    subtitle: 'Endlose Weiten, Ozeane, Inselketten & Seewege',
    icon: '',
    seasCount: 4,
    continentsCount: 1,
    islandsCount: 36,
    description: '4 gewaltige Ozeane (z.B. 4 Blues/Meere), getrennt von einer Kontinental-Barriere oder Calm Belts, mit linearen Inselketten und Schatzinseln.',
    bgGradient: 'from-sky-950/60 to-blue-900/30',
    borderAccent: 'border-sky-500/40'
  },
  {
    id: 'continents',
    name: 'Kontinente & Reiche',
    subtitle: 'Große Landmassen, Gebirge, Küsten & Königreiche',
    icon: '',
    seasCount: 2,
    continentsCount: 3,
    islandsCount: 16,
    description: 'Mehrere stolze Kontinente mit Binnenmeeren, mächtigen Gebirgen, weitläufigen Regionen, Küstenstädten und vorgelagerten Inseln.',
    bgGradient: 'from-emerald-950/60 to-slate-900/40',
    borderAccent: 'border-emerald-500/40'
  },
  {
    id: 'island_realm',
    name: 'Inselreich & Südsee-Atolle',
    subtitle: 'Tropische Inselgruppen, Buchten & Lagunen',
    icon: '',
    seasCount: 3,
    continentsCount: 0,
    islandsCount: 48,
    description: 'Keine großen Landmassen – stattdessen dutzende tropische Atolle, Vulkaninseln, Korallenriffe und geheime Piratenhäfen.',
    bgGradient: 'from-teal-950/60 to-cyan-900/30',
    borderAccent: 'border-teal-500/40'
  },
  {
    id: 'dual_continents',
    name: 'Zwillings-Kontinente (Dualität)',
    subtitle: 'Zwei Welten, getrennt durch ein tosendes Meer',
    icon: '',
    seasCount: 2,
    continentsCount: 2,
    islandsCount: 20,
    description: 'Zwei monumentale Hauptkontinente (z.B. Ost & West oder Licht & Schatten), getrennt durch einen gefährlichen Zentral-Ozean mit Brückeninseln.',
    bgGradient: 'from-purple-950/60 to-indigo-900/30',
    borderAccent: 'border-purple-500/40'
  },
  {
    id: 'pangea',
    name: 'Urkontinent (Pangea)',
    subtitle: 'Ein gigantischer Superkontinent & ein Weltozean',
    icon: '',
    seasCount: 1,
    continentsCount: 1,
    islandsCount: 14,
    description: 'Eine einzige gigantische Landmasse mit allen Klimazonen vom ewigen Eis im Norden bis zu heißen Wüsten, umgeben vom Weltozean.',
    bgGradient: 'from-amber-950/60 to-orange-900/30',
    borderAccent: 'border-amber-500/40'
  },
  {
    id: 'magical_shards',
    name: 'Bruchstücke & Magische Sphären',
    subtitle: 'Schwebende Inseln, Äther-Meere & Vulkane',
    icon: '',
    seasCount: 3,
    continentsCount: 2,
    islandsCount: 28,
    description: 'Zersplitterte Magie- und Urwelten, getrennt durch Nebel- oder Lavameere, mit mystischen Kristallinseln und uralten Bauten.',
    bgGradient: 'from-rose-950/60 to-amber-900/30',
    borderAccent: 'border-rose-500/40'
  },
  {
    id: 'custom',
    name: 'Benutzerdefiniert / Eigenes Setting',
    subtitle: 'Freie Konfiguration für jedes Genre & Setting',
    icon: '',
    seasCount: 3,
    continentsCount: 2,
    islandsCount: 24,
    description: 'Passe die Anzahl der Meere, Kontinente und Inseln exakt nach deinen eigenen Vorstellungen an oder nutze freie Textvorgaben.',
    bgGradient: 'from-slate-900 to-slate-950',
    borderAccent: 'border-slate-700'
  }
];

export const WorldMapCreatorModal: React.FC<WorldMapCreatorModalProps> = ({
  isOpen,
  onClose,
  world,
  onSaveWorldMap,
  loreDatabase = [],
  selectedTags = []
}) => {
  // Active Archetype
  const [selectedArchetype, setSelectedArchetype] = useState<WorldArchetype>('archipelago');

  // Generator Options
  const [worldTitle, setWorldTitle] = useState<string>(world.title || 'Meine Neue Welt');
  const [worldDescription, setWorldDescription] = useState<string>(world.description || '');
  
  const [seasCount, setSeasCount] = useState<number>(4);
  const [continentsCount, setContinentsCount] = useState<number>(1);
  const [islandDensity, setIslandDensity] = useState<'few' | 'medium' | 'dense' | 'epic'>('dense');
  const [islandLayoutPattern, setIslandLayoutPattern] = useState<'linear' | 'clusters' | 'ring' | 'scattered'>('linear');
  
  const [dominantBiome, setDominantBiome] = useState<string>('Kontrastreich & Vielfältig');
  const [civilizationLevel, setCivilizationLevel] = useState<'wild' | 'balanced' | 'dense'>('balanced');
  const [includeCitiesAndPorts, setIncludeCitiesAndPorts] = useState<boolean>(true);
  const [syncToCodex, setSyncToCodex] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Generation state
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [previewTerritories, setPreviewTerritories] = useState<Territory[]>([]);
  const [generationSuccess, setGenerationSuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync archetype presets when clicking archetype cards
  const handleSelectArchetype = (archId: WorldArchetype) => {
    setSelectedArchetype(archId);
    const found = ARCHETYPES.find(a => a.id === archId);
    if (found) {
      setSeasCount(found.seasCount);
      setContinentsCount(found.continentsCount);
      if (found.islandsCount > 40) setIslandDensity('epic');
      else if (found.islandsCount > 25) setIslandDensity('dense');
      else if (found.islandsCount > 15) setIslandDensity('medium');
      else setIslandDensity('few');

      if (archId === 'archipelago') {
        setIslandLayoutPattern('linear');
        setDominantBiome('Ozeanisch & Abenteuerlich');
      } else if (archId === 'continents') {
        setIslandLayoutPattern('clusters');
        setDominantBiome('Gemäßigt, Gebirgig & Wälder');
      } else if (archId === 'island_realm') {
        setIslandLayoutPattern('ring');
        setDominantBiome('Tropisch & Vulkanisch');
      } else if (archId === 'dual_continents') {
        setIslandLayoutPattern('clusters');
        setDominantBiome('Dual / Kontrastreich');
      } else if (archId === 'pangea') {
        setIslandLayoutPattern('scattered');
        setDominantBiome('Vielfältig (Pol bis Äquator)');
      } else if (archId === 'magical_shards') {
        setIslandLayoutPattern('scattered');
        setDominantBiome('Magisch & Elementar');
      }
    }
  };

  // Convert islandDensity into a numeric count
  const getIslandCountNumber = () => {
    switch (islandDensity) {
      case 'few': return 10;
      case 'medium': return 22;
      case 'dense': return 38;
      case 'epic': return 65;
    }
  };

  // FAST PROCEDURAL GENERATOR (Instant algorithm without waiting)
  const generateProceduralWorld = () => {
    const rootWorldId = 'welt-root';
    const totalIslands = getIslandCountNumber();
    const result: Territory[] = [];

    // 1. Root World Container (1000x1000 canvas)
    const rootWorld: Territory = {
      id: rootWorldId,
      name: worldTitle || 'Die Welt',
      type: 'welt',
      description: worldDescription || `Die Welt von ${worldTitle} mit all ihren Ozeanen, Kontinenten und Inseln.`,
      parentId: null,
      x: 500,
      y: 500,
      width: 1000,
      height: 1000,
      shapeType: 'rectangle',
      color: '#070a13'
    };
    result.push(rootWorld);

    // 2. Seas & Oceans (Meere)
    const generatedSeas: Territory[] = [];
    const countSeas = seasCount;

    if (countSeas === 1) {
      const s1: Territory = {
        id: `sea-${Date.now()}-1`,
        name: 'Der Weltozean',
        type: 'meer',
        description: 'Der allumfassende Ozean, der die bekannte Welt umspült.',
        parentId: rootWorldId,
        x: 500,
        y: 500,
        width: 1000,
        height: 1000,
        shapeType: 'rectangle',
        color: '#0284c7',
        climate: dominantBiome
      };
      result.push(s1);
      generatedSeas.push(s1);
    } else if (countSeas === 2) {
      const s1: Territory = {
        id: `sea-${Date.now()}-1`,
        name: 'Westliches Meer',
        type: 'meer',
        description: 'Die weiten Gewässer der westlichen Hemisphäre.',
        parentId: rootWorldId,
        x: 250,
        y: 500,
        width: 500,
        height: 1000,
        shapeType: 'rectangle',
        color: '#0284c7',
        climate: dominantBiome
      };
      const s2: Territory = {
        id: `sea-${Date.now()}-2`,
        name: 'Östliches Meer',
        type: 'meer',
        description: 'Die tiefen Meere der östlichen Hemisphäre.',
        parentId: rootWorldId,
        x: 750,
        y: 500,
        width: 500,
        height: 1000,
        shapeType: 'rectangle',
        color: '#0369a1',
        climate: dominantBiome
      };
      result.push(s1, s2);
      generatedSeas.push(s1, s2);
    } else if (countSeas === 3) {
      const bandNames = ['Nordmeer', 'Zentralmeer', 'Südmeer'];
      const colors = ['#0284c7', '#0369a1', '#075985'];
      const h = Math.round(1000 / 3);
      for (let i = 0; i < 3; i++) {
        const sy = Math.round(h * i + h / 2);
        const s: Territory = {
          id: `sea-${Date.now()}-${i + 1}`,
          name: bandNames[i],
          type: 'meer',
          description: `Meereszone ${i + 1}.`,
          parentId: rootWorldId,
          x: 500,
          y: sy,
          width: 1000,
          height: h,
          shapeType: 'rectangle',
          color: colors[i],
          climate: dominantBiome
        };
        result.push(s);
        generatedSeas.push(s);
      }
    } else if (countSeas >= 4) {
      const quadrants = [
        { name: 'Nordwest-Meer (North Blue)', x: 250, y: 250, color: '#0284c7' },
        { name: 'Nordost-Meer (East Blue)', x: 750, y: 250, color: '#0369a1' },
        { name: 'Südwest-Meer (West Blue)', x: 250, y: 750, color: '#0284c7' },
        { name: 'Südost-Meer (South Blue)', x: 750, y: 750, color: '#075985' },
      ];
      quadrants.forEach((q, idx) => {
        const seaZone: Territory = {
          id: `sea-${Date.now()}-${idx + 1}`,
          name: q.name,
          type: 'meer',
          description: `Eines der vier großen Meere.`,
          parentId: rootWorldId,
          x: q.x,
          y: q.y,
          width: 500,
          height: 500,
          shapeType: 'rectangle',
          color: q.color,
          climate: dominantBiome
        };
        result.push(seaZone);
        generatedSeas.push(seaZone);
      });
    }

    // 3. Continents (Kontinente)
    const countContinents = continentsCount;
    const continentNamesPool = [
      'Valyria / Urkontinent', 'Nordland / Frostkrone', 'Sonnenreich-Kontinent',
      'Westreich (Aethelgard)', 'Ostreich (Kuroshima)', 'Dunkelkontinent (Umbra)'
    ];

    const generatedContinents: Territory[] = [];

    if (countContinents === 1) {
      // Central single continent (or central divider like Red Line)
      const isLinearBarrier = selectedArchetype === 'archipelago';
      const cId = `cont-${Date.now()}-1`;
      const pts = generateOrganicShape('kontinent', 'Gebirge', 'Hauptkontinent', cId);

      const cont: Territory = {
        id: cId,
        name: isLinearBarrier ? 'Zentraler Kontinentalwall (Rote Kette)' : (worldTitle ? `Kontinent ${worldTitle}` : 'Hauptkontinent'),
        type: 'kontinent',
        description: isLinearBarrier 
          ? 'Eine gigantische, felsige Kontinental-Mauer, die sich senkrecht über die Welt erstreckt und Meere trennt.'
          : 'Die mächtige zentrale Hauptlandmasse dieser Welt mit ausgedehnten Reichen und Gebirgen.',
        parentId: rootWorldId,
        x: 500,
        y: 500,
        width: isLinearBarrier ? 70 : 480,
        height: isLinearBarrier ? 960 : 420,
        shapeType: isLinearBarrier ? 'rectangle' : 'polygon',
        points: isLinearBarrier ? undefined : pts,
        color: isLinearBarrier ? '#991b1b' : '#22c55e',
        terrain: 'Gebirge',
        climate: dominantBiome
      };
      result.push(cont);
      generatedContinents.push(cont);
    } else if (countContinents === 2) {
      // Dual continents
      const c1Id = `cont-${Date.now()}-1`;
      const c2Id = `cont-${Date.now()}-2`;
      const pts1 = generateOrganicShape('kontinent', 'Wald', 'Nordkontinent', c1Id);
      const pts2 = generateOrganicShape('kontinent', 'Wüste', 'Südkontinent', c2Id);

      const c1: Territory = {
        id: c1Id,
        name: 'Westkontinent (Aethelgard)',
        type: 'kontinent',
        description: 'Eine uralte, bewaldete und gebirgige Landmasse voller Königreiche.',
        parentId: rootWorldId,
        x: 280,
        y: 500,
        width: 340,
        height: 500,
        shapeType: 'polygon',
        points: pts1,
        color: '#22c55e',
        terrain: 'Wald',
        climate: 'Gemäßigt'
      };
      const c2: Territory = {
        id: c2Id,
        name: 'Ostkontinent (Kuroshima)',
        type: 'kontinent',
        description: 'Ein geheimnisvoller Kontinent mit rauen Steppen, Bergen und Wüsten.',
        parentId: rootWorldId,
        x: 720,
        y: 500,
        width: 340,
        height: 500,
        shapeType: 'polygon',
        points: pts2,
        color: '#eab308',
        terrain: 'Gebirge',
        climate: 'Warm & Kontrastreich'
      };
      result.push(c1, c2);
      generatedContinents.push(c1, c2);
    } else if (countContinents > 2) {
      for (let i = 0; i < countContinents; i++) {
        const cId = `cont-${Date.now()}-${i}`;
        const angle = (i / countContinents) * Math.PI * 2 - Math.PI / 2;
        const dist = 280;
        const cx = Math.round(500 + Math.cos(angle) * dist);
        const cy = Math.round(500 + Math.sin(angle) * dist);
        const name = continentNamesPool[i % continentNamesPool.length];
        const pts = generateOrganicShape('kontinent', 'Gebirge', name, cId);

        const cont: Territory = {
          id: cId,
          name,
          type: 'kontinent',
          description: `Ein bedeutender Kontinent mit vielfältigen Völkern und Regionen.`,
          parentId: rootWorldId,
          x: cx,
          y: cy,
          width: 260,
          height: 240,
          shapeType: 'polygon',
          points: pts,
          color: i % 2 === 0 ? '#22c55e' : '#eab308',
          climate: dominantBiome
        };
        result.push(cont);
        generatedContinents.push(cont);
      }
    }

    // 4. Islands & POIs (Inseln, Archipele, Häfen, Hauptstädte)
    const islandNamesPool = [
      'Whiskey Peak', 'Alabasta', 'Jaya', 'Skypiea (Himmelsinsel)', 'Water 7', 'Enies Lobby',
      'Thriller Bark', 'Sabaody Archipel', 'Amazon Lily', 'Impel Down', 'Marineford',
      'Fischmenschen-Insel', 'Punk Hazard', 'Dressrosa', 'Zou (Elefanteninsel)', 'Totland (Whole Cake)',
      'Wano Kuni', 'Egghead (Zukunftsinsel)', 'Elban (Rieseninsel)', 'Lodestar', 'Laugh Tale',
      'Schattenbucht', 'Smaragd-Atoll', 'Drachenhort', 'Windmühlendorf', 'Baratie (Seerestaurant)',
      'Loguetown', 'Syrup Village', 'Kranichinsel', 'Klingenkamm', 'Frosthafen', 'Sonnenbucht'
    ];

    const islandTypes: Territory['type'][] = ['insel', 'insel', 'stadt', 'hafen', 'festung', 'region'];

    for (let i = 0; i < totalIslands; i++) {
      const islandId = `isl-${Date.now()}-${i}`;
      let ix = 500;
      let iy = 500;

      if (islandLayoutPattern === 'linear') {
        // Grand Line style route (Equatorial horizontal or diagonal highway)
        const progress = i / totalIslands;
        ix = Math.round(120 + progress * 760 + (Math.sin(i * 1.8) * 45));
        iy = Math.round(500 + Math.sin(progress * Math.PI * 3) * 160 + (Math.cos(i * 2.3) * 40));
      } else if (islandLayoutPattern === 'ring') {
        // Ring archipelago
        const angle = (i / totalIslands) * Math.PI * 2;
        const radius = 220 + (i % 3) * 70;
        ix = Math.round(500 + Math.cos(angle) * radius);
        iy = Math.round(500 + Math.sin(angle) * radius);
      } else if (islandLayoutPattern === 'clusters') {
        // Clustered around continents or sea centers
        const clusterIdx = i % Math.max(1, generatedContinents.length + generatedSeas.length);
        const anchor = clusterIdx < generatedContinents.length ? generatedContinents[clusterIdx] : generatedSeas[clusterIdx - generatedContinents.length];
        const offsetAngle = (i * 2.4);
        const offsetDist = 50 + (i % 5) * 35;
        ix = Math.round((anchor ? anchor.x : 500) + Math.cos(offsetAngle) * offsetDist);
        iy = Math.round((anchor ? anchor.y : 500) + Math.sin(offsetAngle) * offsetDist);
      } else {
        // Scattered across map
        const randX = (Math.sin(i * 997 + 13) * 0.5 + 0.5);
        const randY = (Math.cos(i * 773 + 37) * 0.5 + 0.5);
        ix = Math.round(150 + randX * 700);
        iy = Math.round(150 + randY * 700);
      }

      // Clamp coordinates safely within canvas
      ix = Math.max(80, Math.min(920, ix));
      iy = Math.max(80, Math.min(920, iy));

      // Choose parent (Sea or Continent closest to this island)
      let parentId: string = rootWorldId;
      if (generatedSeas.length > 0) {
        // Find closest sea
        let minDist = Infinity;
        let closestSea = generatedSeas[0];
        generatedSeas.forEach(s => {
          const d = Math.hypot(s.x - ix, s.y - iy);
          if (d < minDist) {
            minDist = d;
            closestSea = s;
          }
        });
        parentId = closestSea.id;
      }

      const rawName = islandNamesPool[i % islandNamesPool.length];
      const name = i >= islandNamesPool.length ? `${rawName} ${Math.floor(i / islandNamesPool.length) + 1}` : rawName;
      const tType = islandTypes[i % islandTypes.length];
      const pts = generateOrganicShape(tType === 'insel' ? 'insel' : 'stadt', 'Wald', name, islandId);

      const isl: Territory = {
        id: islandId,
        name,
        type: tType,
        description: `Ein faszinierender Schauplatz voller Abenteuer, Bewohner und Geheimnisse.`,
        parentId,
        x: ix,
        y: iy,
        radius: tType === 'stadt' || tType === 'hafen' ? 18 : 28 + (i % 4) * 8,
        shapeType: 'polygon',
        points: pts,
        color: tType === 'hafen' ? '#06b6d4' : tType === 'stadt' ? '#a855f7' : tType === 'festung' ? '#f43f5e' : '#84cc16',
        climate: dominantBiome,
        culture: 'Seefahrer & Entdecker'
      };

      result.push(isl);
    }

    setPreviewTerritories(result);
    setGenerationSuccess(true);
    setStatusMessage(`Weltkarte für "${worldTitle}" erfolgreich generiert! (${result.length} Gebiete: 1 Weltozean mit ${countSeas > 1 ? `${countSeas} Zonen` : 'einheitlicher Fläche'}, ${generatedContinents.length} Kontinente, ${totalIslands} Inseln/Häfen)`);
  };

  // AI WELTEN-SCHMIEDE GENERATOR (High intelligence with Gemini)
  const handleGenerateWithAi = async () => {
    setIsAiGenerating(true);
    setStatusMessage(null);
    try {
      const tags = selectedTags.length > 0 ? selectedTags : ['Fantasy', 'Abenteuer', 'Erkundung'];
      const totalIslands = getIslandCountNumber();

      const userSettings = {
        worldSize: 'Groß',
        continentsCount: continentsCount,
        climateZones: dominantBiome
      };

      const geoResult = await GeminiService.generateNaturalGeography(
        worldTitle,
        `${worldDescription} ${customPrompt}`.trim(),
        tags,
        userSettings,
        world.isNsfw
      );

      // Convert generated natural geography into full Territory Hierarchy
      const rootWorldId = 'welt-root';
      const territories: Territory[] = [];

      const rootWorld: Territory = {
        id: rootWorldId,
        name: worldTitle || 'Die Welt',
        type: 'welt',
        description: worldDescription || geoResult?.physicalGeography?.worldSize || 'Die Weltkarte für dieses Setting.',
        parentId: null,
        x: 500,
        y: 500,
        width: 1000,
        height: 1000,
        shapeType: 'rectangle',
        color: '#070a13'
      };
      territories.push(rootWorld);

      // Generate Meere: Discrete sea zones if requested
      const countSeas = seasCount;
      const generatedSeas: Territory[] = [];

      if (countSeas === 1) {
        const s1: Territory = {
          id: `sea-${Date.now()}-1`,
          name: geoResult?.physicalGeography?.oceans ? 'Der Große Weltozean' : 'Weltozean',
          type: 'meer',
          description: geoResult?.physicalGeography?.oceans || 'Der allumfassende Ozean, der die bekannte Welt umspült.',
          parentId: rootWorldId,
          x: 500,
          y: 500,
          width: 1000,
          height: 1000,
          shapeType: 'rectangle',
          color: '#0284c7',
          climate: dominantBiome
        };
        territories.push(s1);
        generatedSeas.push(s1);
      } else if (countSeas === 2) {
        const s1: Territory = {
          id: `sea-${Date.now()}-1`,
          name: 'Westlicher Ozeansektor',
          type: 'meer',
          description: 'Die Gewässer der westlichen Hemisphäre.',
          parentId: rootWorldId,
          x: 250,
          y: 500,
          width: 500,
          height: 1000,
          shapeType: 'rectangle',
          color: '#0284c7',
          climate: dominantBiome
        };
        const s2: Territory = {
          id: `sea-${Date.now()}-2`,
          name: 'Östlicher Ozeansektor',
          type: 'meer',
          description: 'Die Gewässer der östlichen Hemisphäre.',
          parentId: rootWorldId,
          x: 750,
          y: 500,
          width: 500,
          height: 1000,
          shapeType: 'rectangle',
          color: '#0369a1',
          climate: dominantBiome
        };
        territories.push(s1, s2);
        generatedSeas.push(s1, s2);
      } else if (countSeas === 3) {
        const bandNames = ['Nordmeer-Zone', 'Zentralmeer-Zone', 'Südmeer-Zone'];
        const colors = ['#0284c7', '#0369a1', '#075985'];
        const h = Math.round(1000 / 3);
        for (let i = 0; i < 3; i++) {
          const sy = Math.round(h * i + h / 2);
          const s: Territory = {
            id: `sea-${Date.now()}-${i + 1}`,
            name: bandNames[i],
            type: 'meer',
            description: `Meereszone ${i + 1} des Weltozeans.`,
            parentId: rootWorldId,
            x: 500,
            y: sy,
            width: 1000,
            height: h,
            shapeType: 'rectangle',
            color: colors[i],
            climate: dominantBiome
          };
          territories.push(s);
          generatedSeas.push(s);
        }
      } else if (countSeas >= 4) {
        const quadrants = [
          { name: 'Nordwest-Meereszone (North Blue)', x: 250, y: 250, color: '#0284c7' },
          { name: 'Nordost-Meereszone (East Blue)', x: 750, y: 250, color: '#0369a1' },
          { name: 'Südwest-Meereszone (West Blue)', x: 250, y: 750, color: '#0284c7' },
          { name: 'Südost-Meereszone (South Blue)', x: 750, y: 750, color: '#075985' },
        ];
        quadrants.forEach((q, idx) => {
          const seaZone: Territory = {
            id: `sea-${Date.now()}-${idx + 1}`,
            name: q.name,
            type: 'meer',
            description: `Einer der vier großen Ozeansektoren.`,
            parentId: rootWorldId,
            x: q.x,
            y: q.y,
            width: 500,
            height: 500,
            shapeType: 'rectangle',
            color: q.color,
            climate: dominantBiome
          };
          territories.push(seaZone);
          generatedSeas.push(seaZone);
        });
      }

      // Generate Continents
      const countConts = continentsCount;
      const generatedContinents: Territory[] = [];

      for (let i = 0; i < countConts; i++) {
        const cId = `cont-${Date.now()}-${i}`;
        const angle = (i / Math.max(1, countConts)) * Math.PI * 2 - Math.PI / 2;
        const dist = 280;
        const cx = Math.round(500 + Math.cos(angle) * dist);
        const cy = Math.round(500 + Math.sin(angle) * dist);
        const cName = `Kontinent ${i === 0 ? worldTitle : `Region ${i + 1}`}`;
        const pts = generateOrganicShape('kontinent', 'Gebirge', cName, cId);

        const cont: Territory = {
          id: cId,
          name: cName,
          type: 'kontinent',
          description: geoResult?.physicalGeography?.mountains || 'Eine große Landmasse.',
          parentId: rootWorldId,
          x: cx,
          y: cy,
          width: 320,
          height: 280,
          shapeType: 'polygon',
          points: pts,
          color: '#22c55e',
          climate: dominantBiome
        };
        territories.push(cont);
        generatedContinents.push(cont);
      }

      // Populate terrains & AI landmarks as Islands, Zones and POIs
      const aiTerrains = geoResult?.terrains || [];
      const usedNames = new Set<string>();

      aiTerrains.forEach((t: any, index: number) => {
        const tid = `poi-${Date.now()}-${index}`;
        const mappedX = Math.round(100 + (t.x / 100) * 800);
        const mappedY = Math.round(100 + (t.y / 100) * 800);
        const isSeaFeature = t.type === 'Ozean' || t.type === 'Meer';
        const tType = isSeaFeature ? 'zone' : t.type === 'Inselgruppe' ? 'insel' : 'ort';
        const pts = generateOrganicShape(tType === 'insel' ? 'insel' : 'stadt', t.type, t.name, tid);

        usedNames.add((t.name || '').toLowerCase());

        territories.push({
          id: tid,
          name: t.name || `Landmarke ${index + 1}`,
          type: tType as any,
          description: t.description || '',
          parentId: generatedSeas[0]?.id || rootWorldId,
          tags: isSeaFeature ? ['Meeresregion'] : undefined,
          x: mappedX,
          y: mappedY,
          radius: isSeaFeature ? 35 : 25,
          shapeType: 'polygon',
          points: pts,
          color: isSeaFeature ? '#0284c7' : '#84cc16',
          climate: dominantBiome
        });
      });

      // Fill remaining islands up to target count
      const remainingIslands = Math.max(0, totalIslands - aiTerrains.length);
      for (let i = 0; i < remainingIslands; i++) {
        const islId = `isl-ai-${Date.now()}-${i}`;
        const angle = (i / remainingIslands) * Math.PI * 2;
        const dist = 180 + (i % 4) * 60;
        const ix = Math.round(500 + Math.cos(angle) * dist);
        const iy = Math.round(500 + Math.sin(angle) * dist);
        const name = `Insel ${i + 1}`;
        const pts = generateOrganicShape('insel', 'Wald', name, islId);

        territories.push({
          id: islId,
          name,
          type: 'insel',
          description: 'Eine unentdeckte Insel mit Reichtümern und Gefahren.',
          parentId: generatedSeas[i % generatedSeas.length]?.id || rootWorldId,
          x: ix,
          y: iy,
          radius: 22,
          shapeType: 'polygon',
          points: pts,
          color: '#84cc16',
          climate: dominantBiome
        });
      }

      setPreviewTerritories(territories);
      setGenerationSuccess(true);
      setStatusMessage(`Kartengenerierung für "${worldTitle}" erfolgreich abgeschlossen (${territories.length} Gebiete: 1 Weltozean mit Zonen, Kontinente und Inseln).`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Fehler bei der KI-Generierung: ${err.message || 'Unbekannter Fehler'}. Generiere stattdessen prozedural...`);
      generateProceduralWorld();
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Apply and save the generated map into setting and optionally sync to Codex
  const handleApplyWorldMap = () => {
    if (previewTerritories.length === 0) {
      generateProceduralWorld();
    }

    const finalTerritories = previewTerritories.length > 0 ? previewTerritories : [];
    if (finalTerritories.length === 0) return;

    // Generate Codex entries for places if requested (with strict content & title deduplication)
    let generatedLore: LoreEntry[] = [];
    if (syncToCodex) {
      const existingLoreTitles = new Set((loreDatabase || []).map(l => l.title.trim().toLowerCase()));
      const existingDescriptions = new Set((loreDatabase || []).map(l => (l.description || '').trim().toLowerCase()));

      finalTerritories.forEach(t => {
        const titleLower = t.name.trim().toLowerCase();
        const descLower = (t.description || '').trim().toLowerCase();
        const isDuplicateTitle = existingLoreTitles.has(titleLower);
        const isDuplicateContent = descLower.length > 15 && existingDescriptions.has(descLower);

        if (t.type !== 'welt' && !isDuplicateTitle && !isDuplicateContent) {
          generatedLore.push({
            id: `lore-${t.id}`,
            category: 'Orte',
            title: t.name,
            description: t.description || `Ein bedeutsamer Ort (${t.type}) in der Weltkarte von ${worldTitle}.`,
            isUnlocked: true,
            details: {
              type: t.type,
              mapLevel: t.type === 'meer' || t.type === 'kontinent' ? 'macro' : t.type === 'region' || t.type === 'zone' ? 'meso' : 'micro',
              climate: t.climate || dominantBiome,
              coordinates: { x: Math.round((t.x / 1000) * 100), y: Math.round((t.y / 1000) * 100) },
              parentPlaceId: t.parentId ? finalTerritories.find(p => p.id === t.parentId)?.name : undefined
            }
          });
          existingLoreTitles.add(titleLower);
          if (descLower.length > 15) {
            existingDescriptions.add(descLower);
          }
        }
      });
    }

    const updatedWorldConfig: Partial<WorldSetting> = {
      title: worldTitle,
      description: worldDescription,
      worldStructure: {
        worldName: worldTitle,
        type: selectedArchetype,
        continentsCount,
        seasCount,
        islandsCount: getIslandCountNumber()
      },
      mapConfig: {
        ...(world?.mapConfig || {}),
        mapWidth: 1000,
        mapHeight: 1000,
        mapStyle: 'fantasy_saturated'
      }
    };

    onSaveWorldMap(finalTerritories, updatedWorldConfig, generatedLore);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-200 overflow-y-auto" id="world-map-creator-modal">
      <div className="bg-slate-900 border border-amber-500/40 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 via-sky-500/20 to-indigo-500/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Globe2 className="w-6 h-6 animate-spin-very-slow text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-amber-300 uppercase tracking-wider">
                  Weltkarten-Schöpfer & Generator
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Meere, Kontinente & Inseln
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Erschaffe für jedes Setting eine komplett eigenständige, interaktive Weltkarte mit Ozeanen, Landmassen, Inseln und Häfen.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (TWO COLUMNS: SETTINGS & VISUAL PREVIEW) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto custom-scrollbar divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          
          {/* LEFT COLUMN: ARCHETYPE & PARAMETERS (7 COLS) */}
          <div className="lg:col-span-7 p-5 sm:p-6 space-y-6">
            
            {/* Setting Info Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest block">1. Setting & Name der Welt</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Name der Welt / des Settings</label>
                  <input
                    type="text"
                    value={worldTitle}
                    onChange={(e) => setWorldTitle(e.target.value)}
                    placeholder="z.B. Grand Line, Mittelerde, Solaris..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Dominierendes Klima & Biome</label>
                  <input
                    type="text"
                    value={dominantBiome}
                    onChange={(e) => setDominantBiome(e.target.value)}
                    placeholder="z.B. Tropisch & Seefahrt, Eis & Gebirge..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Archetype Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest block">2. Welten-Typ & Geographie-Archetyp</span>
                <span className="text-[10px] text-slate-400 font-medium">Klicke eine Vorlage an:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ARCHETYPES.map((arch) => {
                  const isSelected = selectedArchetype === arch.id;
                  return (
                    <div
                      key={arch.id}
                      onClick={() => handleSelectArchetype(arch.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
                        isSelected 
                          ? `bg-gradient-to-br ${arch.bgGradient} ${arch.borderAccent} shadow-lg ring-1 ring-amber-500/50`
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl shrink-0">{arch.icon}</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-100 leading-tight">{arch.name}</h4>
                            <p className="text-[9.5px] text-slate-400 leading-snug">{arch.subtitle}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 text-[10px] font-black">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 border-t border-slate-800/60 pt-2">
                        <span className="text-sky-400">{arch.seasCount} Meereszonen</span>
                        <span className="text-emerald-400">{arch.continentsCount} Kontinente</span>
                        <span className="text-lime-400">{arch.islandsCount} Inseln</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Granular Sliders & Custom Controls */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-4">
              <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest block">3. Detail-Parameter anpassen</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seas Count */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <Waves className="w-3.5 h-3.5 text-sky-400" /> Anzahl Meere / Ozeane
                    </span>
                    <span className="font-mono font-bold text-sky-400 text-xs">{seasCount}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={seasCount}
                    onChange={(e) => setSeasCount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>1 (Ein Weltozean)</span>
                    <span>4 (Vier Blues)</span>
                    <span>8 (Viele Meere)</span>
                  </div>
                </div>

                {/* Continents Count */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-300 flex items-center gap-1">
                      <Mountain className="w-3.5 h-3.5 text-emerald-400" /> Anzahl Kontinente
                    </span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">{continentsCount}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={continentsCount}
                    onChange={(e) => setContinentsCount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                    <span>0 (Reine Inselwelt)</span>
                    <span>1 (Pangea / Red Line)</span>
                    <span>6 (Viele Reiche)</span>
                  </div>
                </div>

                {/* Island Density */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-300 block flex items-center gap-1">
                    <Palmtree className="w-3.5 h-3.5 text-lime-400" /> Insel-Dichte & POIs
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'few', label: '10 Inseln' },
                      { id: 'medium', label: '22 Inseln' },
                      { id: 'dense', label: '38 Inseln' },
                      { id: 'epic', label: '65 Inseln' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setIslandDensity(d.id as any)}
                        className={`py-1.5 text-[9px] font-bold rounded-lg border transition-all ${
                          islandDensity === d.id
                            ? 'bg-lime-500/20 border-lime-500/50 text-lime-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Island Layout Pattern */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-300 block flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-amber-400" /> Insel-Verteilungsmuster
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'linear', label: 'Linear (Route)' },
                      { id: 'clusters', label: 'Cluster' },
                      { id: 'ring', label: 'Ring / Atoll' },
                      { id: 'scattered', label: 'Gestreut' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setIslandLayoutPattern(p.id as any)}
                        className={`py-1.5 text-[9px] font-bold rounded-lg border transition-all ${
                          islandLayoutPattern === p.id
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Checkbox Options */}
              <div className="pt-2 border-t border-slate-900 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCitiesAndPorts}
                    onChange={(e) => setIncludeCitiesAndPorts(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Städte, Häfen & Landmarken automatisch platzieren</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncToCodex}
                    onChange={(e) => setSyncToCodex(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Gebiete automatisch im Codex (Orte) synchronisieren</span>
                </label>
              </div>

            </div>

            {/* Custom AI Prompt (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Zusätzliche Wünsche & Beschreibungen (optional)
                </span>
                <span className="text-[9px] text-slate-500 font-normal">z.B. "Ein gefährliches Eismeer im Norden mit Eisbär-Inseln..."</span>
              </label>
              <AutoExpandingTextarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Füge beliebige Details für die KI hinzu (z.B. 'Ein Vulkanarchipel im Westen, 3 Königreiche im Osten, getrennt durch ein unruhiges Meer')..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:border-amber-500 outline-none min-h-[60px] leading-relaxed"
              />
            </div>

            {/* GENERATE BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={generateProceduralWorld}
                className="w-full py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-sky-400/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sofort-Generator (Prozedural)</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateWithAi}
                disabled={isAiGenerating}
                className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isAiGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>KI schmiedet Weltkarte...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ KI Welten-Schmiede (Gemini)</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN: INTERACTIVE VISUAL PREVIEW (5 COLS) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-950/60 flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black text-amber-500 uppercase tracking-widest block flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Karten-Live-Vorschau
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                  {previewTerritories.length > 0 ? `${previewTerritories.length} Gebiete` : 'Keine Vorschau'}
                </span>
              </div>

              {/* SVG Map Canvas Preview */}
              <div className="w-full aspect-square bg-[#070a13] border border-slate-800 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center">
                {previewTerritories.length === 0 ? (
                  <div className="text-center p-6 space-y-2">
                    <Globe2 className="w-10 h-10 text-slate-700 mx-auto animate-pulse" />
                    <p className="text-xs text-slate-500 font-medium">
                      Klicke links auf <strong className="text-sky-400">Sofort-Generator</strong> oder <strong className="text-amber-400">KI Welten-Schmiede</strong>, um die Weltkarte für dieses Setting zu modellieren.
                    </p>
                  </div>
                ) : (
                  <svg
                    viewBox="0 0 1000 1000"
                    className="w-full h-full object-contain"
                  >
                    {/* Oceans / Seas Backgrounds */}
                    {previewTerritories.filter(t => t.type === 'meer').map(sea => (
                      <rect
                        key={sea.id}
                        x={sea.x - (sea.width || 400) / 2}
                        y={sea.y - (sea.height || 400) / 2}
                        width={sea.width || 400}
                        height={sea.height || 400}
                        fill={sea.color || '#0284c7'}
                        fillOpacity={0.4}
                        stroke="#0369a1"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                        rx="12"
                      />
                    ))}

                    {/* Continents */}
                    {previewTerritories.filter(t => t.type === 'kontinent').map(cont => {
                      if (cont.shapeType === 'polygon' && cont.points && cont.points.length > 0) {
                        const scaleX = (cont.width || 300) / 2;
                        const scaleY = (cont.height || 300) / 2;
                        const pathData = cont.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${cont.x + p.x * scaleX} ${cont.y + p.y * scaleY}`).join(' ') + ' Z';
                        return (
                          <path
                            key={cont.id}
                            d={pathData}
                            fill={cont.color || '#22c55e'}
                            fillOpacity={0.8}
                            stroke="#15803d"
                            strokeWidth="2.5"
                          />
                        );
                      } else {
                        return (
                          <rect
                            key={cont.id}
                            x={cont.x - (cont.width || 300) / 2}
                            y={cont.y - (cont.height || 300) / 2}
                            width={cont.width || 300}
                            height={cont.height || 300}
                            fill={cont.color || '#22c55e'}
                            fillOpacity={0.8}
                            stroke="#15803d"
                            strokeWidth="2.5"
                            rx="16"
                          />
                        );
                      }
                    })}

                    {/* Islands & Cities & POIs */}
                    {previewTerritories.filter(t => t.type !== 'welt' && t.type !== 'meer' && t.type !== 'kontinent').map(node => {
                      const rad = node.radius || 20;
                      if (node.shapeType === 'polygon' && node.points && node.points.length > 0) {
                        const pathData = node.points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${node.x + p.x * rad} ${node.y + p.y * rad}`).join(' ') + ' Z';
                        return (
                          <g key={node.id}>
                            <path
                              d={pathData}
                              fill={node.color || '#84cc16'}
                              fillOpacity={0.9}
                              stroke="#000000"
                              strokeWidth="1.2"
                            />
                            <text
                              x={node.x}
                              y={node.y + rad + 12}
                              fill="#ffffff"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="select-none pointer-events-none drop-shadow"
                            >
                              {node.name}
                            </text>
                          </g>
                        );
                      } else {
                        return (
                          <g key={node.id}>
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={rad}
                              fill={node.color || '#84cc16'}
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                            <text
                              x={node.x}
                              y={node.y + rad + 12}
                              fill="#ffffff"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="select-none pointer-events-none drop-shadow"
                            >
                              {node.name}
                            </text>
                          </g>
                        );
                      }
                    })}
                  </svg>
                )}

                {/* Watermark badge */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-950/80 backdrop-blur-md rounded-lg border border-slate-800 text-[8.5px] font-mono text-slate-400">
                  1000 x 1000 px • 2D Vektor
                </div>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className="p-3 bg-slate-900 border border-amber-500/30 rounded-xl text-xs text-amber-300 leading-relaxed animate-in fade-in duration-200">
                  {statusMessage}
                </div>
              )}

              {/* Territories quick breakdown */}
              {previewTerritories.length > 0 && (
                <div className="space-y-1.5 text-[10.5px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[9px]">Struktur-Übersicht:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-sky-950/40 border border-sky-500/30 p-2 rounded-xl text-center">
                      <span className="text-xs font-black text-sky-400 block">{previewTerritories.filter(t => t.type === 'meer').length}</span>
                      <span className="text-[9px] text-slate-400">Meere</span>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl text-center">
                      <span className="text-xs font-black text-emerald-400 block">{previewTerritories.filter(t => t.type === 'kontinent').length}</span>
                      <span className="text-[9px] text-slate-400">Kontinente</span>
                    </div>
                    <div className="bg-lime-950/40 border border-lime-500/30 p-2 rounded-xl text-center">
                      <span className="text-xs font-black text-lime-400 block">{previewTerritories.filter(t => t.type !== 'welt' && t.type !== 'meer' && t.type !== 'kontinent').length}</span>
                      <span className="text-[9px] text-slate-400">Inseln / Orte</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* APPLY & SAVE BUTTON */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleApplyWorldMap}
                disabled={previewTerritories.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Weltkarte für dieses Setting anwenden & speichern</span>
              </button>

              <p className="text-[9.5px] text-center text-slate-500">
                Speichert alle Meere, Kontinente & Inseln direkt in das Setting und aktualisiert die Weltkarte.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
