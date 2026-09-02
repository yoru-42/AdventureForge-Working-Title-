import React, { useState } from 'react';
import { WorldSetting, Territory, LoreEntry } from '../../types';
import { GeminiService } from '../../services/geminiService';
import { generateNaturalFreehandZonePoints } from './worldMapData';
import AutoExpandingTextarea from '../AutoExpandingTextarea';
import {
  Sparkles,
  Mountain,
  Compass,
  MapPin,
  Waves,
  Castle,
  Home,
  Building2,
  RefreshCw,
  X,
  AlertCircle,
  Route,
  Crown,
  Layers,
  Zap,
  Info,
  Target,
  Globe2,
  Wand2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Check,
  Users,
  Scale,
  TreePine,
  Droplets,
  Flame,
  Snowflake,
  Sun,
  Anchor,
  Map as MapIcon,
  Palmtree
} from 'lucide-react';

interface WorldMapSmartFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  world: WorldSetting;
  onSaveWorldMap: (newTerritories: Territory[], updatedWorld: Partial<WorldSetting>, generatedLore?: LoreEntry[]) => void;
  loreDatabase?: LoreEntry[];
}

export type SmartFillScope = 'full_world' | 'targeted_zone';

export interface CustomItemSpec {
  name?: string;
  areaSqKm?: number;
  description?: string;
}

export type TargetedZoneCategory = 
  | 'mountains'
  | 'rivers'
  | 'forest'
  | 'settlements'
  | 'fortresses'
  | 'islands'
  | 'desert'
  | 'snow'
  | 'swamp'
  | 'custom';

export type MapQuadrant = 
  | 'center'
  | 'north'
  | 'northeast'
  | 'east'
  | 'southeast'
  | 'south'
  | 'southwest'
  | 'west'
  | 'northwest';

interface QuickPromptSuggestion {
  label: string;
  category: TargetedZoneCategory;
  quadrant: MapQuadrant;
  prompt: string;
}

const PROMPT_SUGGESTIONS: QuickPromptSuggestion[] = [
  {
    label: 'Schneegipfel & Zwergenbinge',
    category: 'mountains',
    quadrant: 'north',
    prompt: 'Ein schneebedecktes Hochgebirge im Norden mit ca. 25.000 Einwohnern, tiefen Schluchten, 2 Zwergenminen, einem klaren Gletschersee und einer Bergfestung an einem Pass.'
  },
  {
    label: 'Flusstal mit Hafenstadt',
    category: 'rivers',
    quadrant: 'east',
    prompt: 'Ein mächtiger, geschwungener Flusslauf im Osten mit ca. 85.000 Einwohnern, der von den Hügeln zur Küste fließt, mit einer florierenden Hafenstadt an der Mündung und 4 Fischerdörfern.'
  },
  {
    label: 'Zauberwald & Druidenhain',
    category: 'forest',
    quadrant: 'southwest',
    prompt: 'Ein uralter, dichter Urwald mit ca. 12.000 Einwohnern, leuchtender Feenflora im Südwesten, einem heiligen Druidentempel und versteckten Waldweilersiedlungen.'
  },
  {
    label: 'Piraten-Inselarchipel',
    category: 'islands',
    quadrant: 'southeast',
    prompt: 'Ein tropisches Insel-Archipel im Südosten mit ca. 45.000 Einwohnern, 5 Inseln, einem belebten Freibeuter-Hafen, Seefestungen und Korallenbänken.'
  },
  {
    label: 'Grenzland mit Festungswall',
    category: 'fortresses',
    quadrant: 'west',
    prompt: 'Ein befestigtes Grenzgebiet im Westen mit ca. 60.000 Einwohnern, 3 trutzigen Burgen, Wachtürmen entlang einer befestigten Königsstraße und einem umkämpften Marktflecken.'
  },
  {
    label: 'Wüstenreich mit Oase',
    category: 'desert',
    quadrant: 'south',
    prompt: 'Ein endloses Dünenmeer im Süden mit ca. 120.000 Einwohnern, einer blühenden Oasenstadt, Karawanenstraßen, versunkenen Ruinen und Felsenschluchten.'
  }
];

const QUADRANT_CONFIG: Record<MapQuadrant, { name: string; x: number; y: number; desc: string }> = {
  center: { name: 'Zentrum', x: 120, y: 70, desc: 'Kartenmitte' },
  north: { name: 'Norden', x: 120, y: 32, desc: 'Oberer Bereich' },
  northeast: { name: 'Nordost', x: 185, y: 35, desc: 'Obere rechte Ecke' },
  east: { name: 'Osten', x: 190, y: 70, desc: 'Rechte KartENSEITE' },
  southeast: { name: 'Südost', x: 185, y: 108, desc: 'Untere rechte Ecke' },
  south: { name: 'Süden', x: 120, y: 110, desc: 'Unterer Bereich' },
  southwest: { name: 'Südwest', x: 55, y: 108, desc: 'Untere linke Ecke' },
  west: { name: 'Westen', x: 50, y: 70, desc: 'Linke Kartenseite' },
  northwest: { name: 'Nordwest', x: 55, y: 35, desc: 'Obere linke Ecke' }
};

export const WorldMapSmartFillModal: React.FC<WorldMapSmartFillModalProps> = ({
  isOpen,
  onClose,
  world,
  onSaveWorldMap,
  loreDatabase = []
}) => {
  // Mode / Scope
  const existingTerritoriesCount = (world.territories || []).length;
  const [scopeMode, setScopeMode] = useState<SmartFillScope>(existingTerritoriesCount > 0 ? 'targeted_zone' : 'full_world');
  const [replaceMode, setReplaceMode] = useState<'replace' | 'append'>(existingTerritoriesCount > 0 ? 'append' : 'replace');
  const [targetQuadrant, setTargetQuadrant] = useState<MapQuadrant>('center');
  const [targetedCategory, setTargetedCategory] = useState<TargetedZoneCategory>('mountains');

  // Text Prompt
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [isAnalyzingPrompt, setIsAnalyzingPrompt] = useState<boolean>(false);

  // Sliders & Details
  const [showSliders, setShowSliders] = useState<boolean>(true);
  const [population, setPopulation] = useState<number>(scopeMode === 'targeted_zone' ? 25000 : 120000);
  const [autoScaleDensity, setAutoScaleDensity] = useState<boolean>(true);
  const [landScale, setLandScale] = useState<number>(36);
  const [continentsCount, setContinentsCount] = useState<number>(scopeMode === 'targeted_zone' ? 0 : 1);
  const [coastlineRoughness, setCoastlineRoughness] = useState<number>(0.5);

  // Helper to sync land scale & settlement counts to population when changed
  const handlePopulationChange = (newPop: number, forceAuto: boolean = autoScaleDensity) => {
    setPopulation(newPop);
    if (forceAuto) {
      const estScale = Math.min(55, Math.max(20, Math.round(18 + Math.sqrt(newPop / 220))));
      setLandScale(estScale);

      let estCities = 0;
      if (newPop >= 500000) estCities = 4;
      else if (newPop >= 150000) estCities = 3;
      else if (newPop >= 35000) estCities = 2;
      else if (newPop >= 6000) estCities = 1;
      setCitiesCount(estCities);

      const estVillages = Math.min(12, Math.max(1, Math.round(Math.sqrt(newPop / 650))));
      setVillagesCount(estVillages);

      const estFortresses = Math.min(5, Math.max(0, Math.round(Math.sqrt(newPop / 30000))));
      setFortressesCount(estFortresses);
    }
  };

  // Waters
  const [seasCount, setSeasCount] = useState<number>(scopeMode === 'targeted_zone' ? 0 : 2);
  const [lakesCount, setLakesCount] = useState<number>(scopeMode === 'targeted_zone' ? 1 : 1);
  const [islandsCount, setIslandsCount] = useState<number>(scopeMode === 'targeted_zone' ? 0 : 4);
  const [riversCount, setRiversCount] = useState<number>(scopeMode === 'targeted_zone' ? 1 : 2);

  // Mountains & Biomes
  const [mountainsCount, setMountainsCount] = useState<number>(scopeMode === 'targeted_zone' ? 3 : 2);
  const [forestsCount, setForestsCount] = useState<number>(scopeMode === 'targeted_zone' ? 1 : 3);
  const [desertsCount, setDesertsCount] = useState<number>(0);
  const [snowCount, setSnowCount] = useState<number>(0);
  const [swampsCount, setSwampsCount] = useState<number>(0);
  const [volcanoesCount, setVolcanoesCount] = useState<number>(0);

  // Settlements & Infrastructure
  const [villagesCount, setVillagesCount] = useState<number>(scopeMode === 'targeted_zone' ? 3 : 6);
  const [citiesCount, setCitiesCount] = useState<number>(scopeMode === 'targeted_zone' ? 1 : 3);
  const [fortressesCount, setFortressesCount] = useState<number>(scopeMode === 'targeted_zone' ? 2 : 2);
  const [specialPlacesCount, setSpecialPlacesCount] = useState<number>(scopeMode === 'targeted_zone' ? 2 : 2);
  const [autoRoads, setAutoRoads] = useState<boolean>(true);
  const [autoFactions, setAutoFactions] = useState<boolean>(true);
  const [syncToCodex, setSyncToCodex] = useState<boolean>(true);

  // Custom Item Specifications (Names, km², notes)
  const [customItemSpecs, setCustomItemSpecs] = useState<Record<string, CustomItemSpec[]>>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const handleSpecChange = (catKey: string, index: number, field: keyof CustomItemSpec, value: any) => {
    setCustomItemSpecs((prev) => {
      const list = [...(prev[catKey] || [])];
      while (list.length <= index) {
        list.push({});
      }
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [catKey]: list };
    });
  };

  const toggleExpandDetail = (catKey: string) => {
    setExpandedDetails((prev) => ({ ...prev, [catKey]: !(prev[catKey] ?? true) }));
  };

  const buildCustomSpecsSummary = (): string => {
    const lines: string[] = [];
    const CATEGORY_LABELS: Record<string, string> = {
      continents: 'Kontinent/Landmasse',
      seas: 'Meer/Ozean',
      rivers: 'Fluss/Wasserlauf',
      mountains: 'Gebirge/Bergkette',
      lakes: 'Binnensee',
      islands: 'Insel',
      cities: 'Stadt/Hauptstadt',
      villages: 'Dorf/Siedlung',
      fortresses: 'Burg/Festung',
      specialPlaces: 'Besonderer Ort/Ruine',
      forests: 'Wald',
      deserts: 'Wüste',
      snow: 'Schnee/Eisgebiet',
      swamps: 'Sumpfland',
      volcanoes: 'Vulkan'
    };

    Object.entries(customItemSpecs).forEach(([catKey, specs]) => {
      const label = CATEGORY_LABELS[catKey] || catKey;
      if (Array.isArray(specs)) {
        specs.forEach((spec, idx) => {
          if (spec && (spec.name || (spec.areaSqKm !== undefined && !isNaN(spec.areaSqKm)) || spec.description)) {
            const parts: string[] = [];
            if (spec.name) parts.push(`Name: "${spec.name}"`);
            if (spec.areaSqKm !== undefined && !isNaN(spec.areaSqKm)) parts.push(`Fläche: ${spec.areaSqKm} km²`);
            if (spec.description) parts.push(`Anmerkung/Rolle: "${spec.description}"`);
            lines.push(`- ${label} #${idx + 1}: ${parts.join(', ')}`);
          }
        });
      }
    });

    return lines.join('\n');
  };

  // Execution state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const renderCustomSlider = (
    categoryKey: string,
    label: string,
    IconComp: React.ComponentType<{ className?: string }>,
    iconColorClass: string,
    count: number,
    setCount: (val: number) => void,
    min: number = 0,
    max: number = 6,
    accentClass: string = 'accent-amber-500',
    exampleName: string = 'Name',
    unitSuffix: string = '',
    defaultSqKm: number = 5
  ) => {
    const isExpanded = expandedDetails[categoryKey] ?? true;

    return (
      <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-750 transition-colors">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <IconComp className={`w-3.5 h-3.5 ${iconColorClass}`} />
            {label}
          </span>
          <span className={`${iconColorClass} font-mono font-bold`}>{count} {unitSuffix}</span>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value))}
          className={`w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer ${accentClass}`}
        />

        {count >= 1 && (
          <div className="pt-1.5 border-t border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Namen & Details für {label} ({count})</span>
              </span>
              <button
                type="button"
                onClick={() => toggleExpandDetail(categoryKey)}
                className="text-[10px] text-slate-400 hover:text-amber-300 transition-colors flex items-center gap-0.5 font-medium"
              >
                {isExpanded ? (
                  <><span>Einklappen</span> <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <><span>Anpassen ({count})</span> <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="space-y-1.5 pt-0.5">
                {Array.from({ length: count }).map((_, idx) => {
                  const spec = customItemSpecs[categoryKey]?.[idx] || {};
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-mono font-bold text-amber-500/80 w-5 shrink-0 text-center">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder={`${exampleName} ${idx + 1}`}
                        value={spec.name || ''}
                        onChange={(e) => handleSpecChange(categoryKey, idx, 'name', e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-900 border border-slate-750 rounded text-xs text-slate-200 focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
                      />
                      <div className="flex items-center gap-1 w-28 shrink-0">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder={`${defaultSqKm}`}
                          value={spec.areaSqKm !== undefined && !isNaN(spec.areaSqKm) ? spec.areaSqKm : ''}
                          onChange={(e) => handleSpecChange(categoryKey, idx, 'areaSqKm', parseFloat(e.target.value) || undefined)}
                          className="w-16 px-1.5 py-1 bg-slate-900 border border-slate-750 rounded text-xs text-amber-300 font-mono text-right focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
                        />
                        <span className="text-[10px] text-slate-400 font-mono font-bold">km²</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Anmerkung (opt.)"
                        value={spec.description || ''}
                        onChange={(e) => handleSpecChange(categoryKey, idx, 'description', e.target.value)}
                        className="w-32 shrink-0 px-2 py-1 bg-slate-900 border border-slate-750 rounded text-[11px] text-slate-300 focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  // Handle Scope Mode switch
  const handleSwitchScope = (mode: SmartFillScope) => {
    setScopeMode(mode);
    if (mode === 'targeted_zone') {
      setReplaceMode('append');
      setContinentsCount(0);
      setSeasCount(0);
      setLakesCount(1);
      setIslandsCount(0);
      setRiversCount(1);
      setMountainsCount(2);
      setForestsCount(1);
      setVillagesCount(3);
      setCitiesCount(1);
      setFortressesCount(1);
      setSpecialPlacesCount(2);
    } else {
      setReplaceMode('replace');
      setContinentsCount(1);
      setSeasCount(2);
      setLakesCount(1);
      setIslandsCount(4);
      setRiversCount(2);
      setMountainsCount(2);
      setForestsCount(3);
      setVillagesCount(6);
      setCitiesCount(3);
      setFortressesCount(2);
      setSpecialPlacesCount(2);
    }
  };

  // Apply Targeted Zone Category
  const handleSelectTargetedCategory = (cat: TargetedZoneCategory) => {
    setTargetedCategory(cat);
    switch (cat) {
      case 'mountains':
        setContinentsCount(0);
        setSeasCount(0);
        setLakesCount(1);
        setIslandsCount(0);
        setRiversCount(1);
        setMountainsCount(4);
        setForestsCount(1);
        setDesertsCount(0);
        setSnowCount(1);
        setSwampsCount(0);
        setVillagesCount(2);
        setCitiesCount(0);
        setFortressesCount(2);
        setSpecialPlacesCount(3);
        setUserPrompt(prev => prev || 'Ein schroffes Gebirgsmassiv mit schneebedeckten Gipfeln, 2 Minen, Bergfestung und Schluchten.');
        break;
      case 'rivers':
        setContinentsCount(0);
        setSeasCount(0);
        setLakesCount(1);
        setIslandsCount(0);
        setRiversCount(2);
        setMountainsCount(1);
        setForestsCount(2);
        setDesertsCount(0);
        setSnowCount(0);
        setSwampsCount(0);
        setVillagesCount(4);
        setCitiesCount(1);
        setFortressesCount(1);
        setSpecialPlacesCount(1);
        setUserPrompt(prev => prev || 'Ein geschwungener Flusslauf mit fruchtbarem Ackerland, einer Handelsstadt und mehreren Dörfern.');
        break;
      case 'forest':
        setContinentsCount(0);
        setSeasCount(0);
        setLakesCount(1);
        setIslandsCount(0);
        setRiversCount(1);
        setMountainsCount(0);
        setForestsCount(5);
        setDesertsCount(0);
        setSnowCount(0);
        setSwampsCount(1);
        setVillagesCount(3);
        setCitiesCount(1);
        setFortressesCount(1);
        setSpecialPlacesCount(3);
        setUserPrompt(prev => prev || 'Ein tiefer, uralter Wald mit verwunschenen Hainen, Feenquellen, Waldhütten und einem mystischen Heiligtum.');
        break;
      case 'settlements':
        setContinentsCount(0);
        setSeasCount(0);
        setLakesCount(0);
        setIslandsCount(0);
        setRiversCount(1);
        setMountainsCount(0);
        setForestsCount(1);
        setDesertsCount(0);
        setSnowCount(0);
        setSwampsCount(0);
        setVillagesCount(6);
        setCitiesCount(2);
        setFortressesCount(2);
        setSpecialPlacesCount(1);
        setUserPrompt(prev => prev || 'Eine dicht besiedelte Provinz mit großer Handelsstadt, umliegenden Bauerndörfern und gepflasterten Straßen.');
        break;
      case 'fortresses':
        setContinentsCount(0);
        setSeasCount(0);
        setLakesCount(0);
        setIslandsCount(0);
        setRiversCount(0);
        setMountainsCount(2);
        setForestsCount(1);
        setDesertsCount(0);
        setSnowCount(0);
        setSwampsCount(0);
        setVillagesCount(2);
        setCitiesCount(0);
        setFortressesCount(4);
        setSpecialPlacesCount(2);
        setUserPrompt(prev => prev || 'Ein wehrhafter Grenzgürtel mit mächtigen Bastionen, Wachtürmen und befestigten Pässen.');
        break;
      case 'islands':
        setContinentsCount(0);
        setSeasCount(1);
        setLakesCount(0);
        setIslandsCount(6);
        setRiversCount(0);
        setMountainsCount(1);
        setForestsCount(1);
        setDesertsCount(0);
        setSnowCount(0);
        setSwampsCount(0);
        setVillagesCount(3);
        setCitiesCount(1);
        setFortressesCount(1);
        setSpecialPlacesCount(2);
        setUserPrompt(prev => prev || 'Eine Inselgruppe im Meer mit Fischerdörfern, Korallenatollen und einem Piratenhafen.');
        break;
      case 'desert':
        setContinentsCount(0);
        setSeasCount(0);
        setLakesCount(1);
        setIslandsCount(0);
        setRiversCount(0);
        setMountainsCount(1);
        setForestsCount(0);
        setDesertsCount(4);
        setSnowCount(0);
        setSwampsCount(0);
        setVillagesCount(2);
        setCitiesCount(1);
        setFortressesCount(1);
        setSpecialPlacesCount(3);
        setUserPrompt(prev => prev || 'Eine goldene Sandwüste mit Oase, Karawanserei, Felsenhöhlen und antiken Gräbern.');
        break;
      case 'snow':
        setContinentsCount(0);
        setSeasCount(0);
        setLakesCount(1);
        setIslandsCount(0);
        setRiversCount(1);
        setMountainsCount(3);
        setForestsCount(1);
        setDesertsCount(0);
        setSnowCount(4);
        setSwampsCount(0);
        setVillagesCount(2);
        setCitiesCount(1);
        setFortressesCount(2);
        setSpecialPlacesCount(2);
        setUserPrompt(prev => prev || 'Eine eisige Frostöde mit Gletschern, Eishöhlen, Schneefesten und abgehärteten Nordmänner-Siedlungen.');
        break;
      case 'swamp':
        setContinentsCount(0);
        setSeasCount(0);
        setLakesCount(2);
        setIslandsCount(0);
        setRiversCount(1);
        setMountainsCount(0);
        setForestsCount(1);
        setDesertsCount(0);
        setSnowCount(0);
        setSwampsCount(4);
        setVillagesCount(2);
        setCitiesCount(0);
        setFortressesCount(1);
        setSpecialPlacesCount(3);
        setUserPrompt(prev => prev || 'Ein nebliges Sumpfland mit versunkenen Ruinen, Hexenhütten, Holzstegen und tiefen Mooren.');
        break;
      default:
        break;
    }
  };

  // Apply Prompt Suggestion
  const handleApplySuggestion = (sug: QuickPromptSuggestion) => {
    setUserPrompt(sug.prompt);
    setScopeMode('targeted_zone');
    setTargetQuadrant(sug.quadrant);
    handleSelectTargetedCategory(sug.category);
  };

  // AI Prompt Analysis to auto-adjust sliders
  const handleAnalyzePromptWithAI = async () => {
    setIsAnalyzingPrompt(true);
    try {
      const qCoord = QUADRANT_CONFIG[targetQuadrant];
      const result = await GeminiService.generateSmartFillFromPrompt({
        userPrompt: userPrompt.trim() || 'Generiere eine ausgewogene Landmasse mit Städten, Dörfern und Landmarken.',
        worldTitle: world.title || 'Welt',
        genres: (world as any).genres || [(world as any).genre || 'Fantasy'],
        worldDescription: world.description,
        scopeMode: scopeMode,
        targetQuadrant: QUADRANT_CONFIG[targetQuadrant].name,
        centerCoords: { x: qCoord.x, y: qCoord.y }
      });

      if (result && result.parsedCounts) {
        const c = result.parsedCounts;
        if (c.population !== undefined) {
          setPopulation(c.population);
          if (c.landScale === undefined && autoScaleDensity) {
            handlePopulationChange(c.population, true);
          }
        }
        if (c.landScale !== undefined) setLandScale(c.landScale);
        if (c.continentsCount !== undefined) setContinentsCount(c.continentsCount);
        if (c.seasCount !== undefined) setSeasCount(c.seasCount);
        if (c.lakesCount !== undefined) setLakesCount(c.lakesCount);
        if (c.islandsCount !== undefined) setIslandsCount(c.islandsCount);
        if (c.riversCount !== undefined) setRiversCount(c.riversCount);
        if (c.mountainsCount !== undefined) setMountainsCount(c.mountainsCount);
        if (c.forestsCount !== undefined) setForestsCount(c.forestsCount);
        if (c.desertsCount !== undefined) setDesertsCount(c.desertsCount);
        if (c.snowCount !== undefined) setSnowCount(c.snowCount);
        if (c.swampsCount !== undefined) setSwampsCount(c.swampsCount);
        if (c.citiesCount !== undefined) setCitiesCount(c.citiesCount);
        if (c.villagesCount !== undefined) setVillagesCount(c.villagesCount);
        if (c.fortressesCount !== undefined) setFortressesCount(c.fortressesCount);
        if (c.specialPlacesCount !== undefined) setSpecialPlacesCount(c.specialPlacesCount);
      }
    } catch (err) {
      console.warn("AI prompt analysis soft fail:", err);
    } finally {
      setIsAnalyzingPrompt(false);
    }
  };

  // PROCEDURAL ENGINE (Aligned to Quadrant / Scope)
  const generateProceduralElements = (): { newTerritories: Territory[]; newLoreEntries: LoreEntry[] } => {
    const ts = Date.now();
    const result: Territory[] = [];
    const loreEntries: LoreEntry[] = [];

    const factionPool = [
      { name: 'Königreich Valoria', ruler: 'König Alden II.' },
      { name: 'Kaiserreich Eisenmark', ruler: 'Kaiserin Vaeloria' },
      { name: 'Smaragd-Bund der Waldlande', ruler: 'Erzdruide Oakhaven' },
      { name: 'Handelsliga von Neu-Hafen', ruler: 'Großmeister Corvus' }
    ];

    const jitter = (range: number) => (Math.random() - 0.5) * range;

    // Anchor center based on quadrant
    const quadrantInfo = QUADRANT_CONFIG[targetQuadrant];
    const targetCenterX = scopeMode === 'targeted_zone' ? quadrantInfo.x : 120;
    const targetCenterY = scopeMode === 'targeted_zone' ? quadrantInfo.y : 70;
    const areaRadius = scopeMode === 'targeted_zone' ? 24 : landScale;

    // 1. MEERE
    if (seasCount > 0) {
      const seaPositions = [
        { x: 35, y: 30, name: 'Nordwest-Meer' },
        { x: 205, y: 30, name: 'Nordost-Meer' },
        { x: 35, y: 110, name: 'Südwest-Meer' },
        { x: 205, y: 110, name: 'Südost-Meer' }
      ];
      for (let i = 0; i < seasCount; i++) {
        const pos = scopeMode === 'targeted_zone'
          ? { x: targetCenterX + jitter(15), y: targetCenterY + jitter(15), name: `${quadrantInfo.name}-Meer` }
          : seaPositions[i % seaPositions.length];
        
        const sX = pos.x + jitter(6);
        const sY = pos.y + jitter(6);
        const sRad = scopeMode === 'targeted_zone' ? 22 : 38 + Math.random() * 6;
        const sSeed = Math.floor(Math.random() * 10000);

        result.push({
          id: `sea-${ts}-${i}`,
          name: pos.name,
          type: 'meer',
          description: 'Weite Ozeangewässer mit günstigen Winden und Meeresströmungen.',
          parentId: null,
          x: sX,
          y: sY,
          radius: sRad,
          points: generateNaturalFreehandZonePoints(sX, sY, sRad, 'meer', sSeed, 0.35),
          color: '#0284c7',
          climate: 'Ozeanisch',
          terrain: 'Tiefsee',
          seed: sSeed
        });
      }
    }

    // 2. LANDMASSE / KONTINENT (nur wenn continentsCount > 0)
    const continents: { id: string | null; x: number; y: number; radius: number; faction?: string }[] = [];
    if (continentsCount > 0) {
      for (let i = 0; i < continentsCount; i++) {
        const cId = `land-${ts}-${i + 1}`;
        const fact = factionPool[i % factionPool.length];
        const cx = continentsCount === 1 ? targetCenterX : Math.round(targetCenterX + (i === 0 ? -30 : 30));
        const cy = targetCenterY;
        const contRadius = Math.round(areaRadius * (continentsCount > 1 ? 0.75 : 1));
        const cSeed = Math.floor(Math.random() * 10000);

        result.push({
          id: cId,
          name: continentsCount === 1 
            ? (scopeMode === 'targeted_zone' ? `Region ${quadrantInfo.name}` : (world.title ? `Landmasse ${world.title}` : 'Hauptkontinent'))
            : `Landmasse ${i + 1}`,
          type: 'koenigreich',
          description: 'Bedeutende Landmasse voller Siedlungen, Reiche und Ressourcen.',
          parentId: null,
          x: cx,
          y: cy,
          radius: contRadius,
          points: generateNaturalFreehandZonePoints(cx, cy, contRadius, 'koenigreich', cSeed, coastlineRoughness),
          color: '#15803d',
          climate: 'Gemäßigt',
          terrain: 'Mischgelände',
          faction: autoFactions ? fact.name : undefined,
          ruler: autoFactions ? fact.ruler : undefined,
          seed: cSeed,
          coastlineRoughness: coastlineRoughness
        });
        continents.push({ id: cId, x: cx, y: cy, radius: contRadius, faction: fact.name });
      }
    }

    // Fallback anchor: if no new continent is created, anchor to targetCenter or existing territory
    const anchor = continents[0] || {
      id: null,
      x: targetCenterX,
      y: targetCenterY,
      radius: areaRadius,
      faction: autoFactions ? factionPool[0].name : undefined
    };

    // 3. INSELN
    const islandNames = ['Dracheninsel', 'Smaragdeiland', 'Nebelinsel', 'Sonnenginst', 'Möwenfels', 'Perlenatoll'];
    for (let i = 0; i < islandsCount; i++) {
      const customIs = customItemSpecs['islands']?.[i];
      const angle = (i / Math.max(1, islandsCount)) * Math.PI * 2 + jitter(0.4);
      const dist = anchor.radius + 12 + Math.random() * 14;
      const ix = Math.max(15, Math.min(225, Math.round(anchor.x + Math.cos(angle) * dist)));
      const iy = Math.max(15, Math.min(125, Math.round(anchor.y + Math.sin(angle) * (dist * 0.7))));
      const baseIslandRad = Math.max(10, Math.min(35, landScale > 0 ? Math.round(landScale * 0.6) : 16));
      const iRad = customIs?.areaSqKm && customIs.areaSqKm > 0
        ? Math.max(3, Math.round(Math.sqrt(customIs.areaSqKm / Math.PI) * 10))
        : baseIslandRad + Math.random() * 4;
      const iSeed = Math.floor(Math.random() * 10000);
      const iName = customIs?.name || islandNames[i % islandNames.length];
      const iDesc = customIs?.description || 'Eine idyllische, vom Meer umspülte Insel.';

      result.push({
        id: `island-${ts}-${i}`,
        name: iName,
        type: 'insel',
        description: iDesc,
        parentId: anchor.id,
        x: ix,
        y: iy,
        radius: iRad,
        points: generateNaturalFreehandZonePoints(ix, iy, iRad, 'insel', iSeed, 0.45),
        color: '#16a34a',
        climate: 'Maritim',
        terrain: 'Küste & Hügel',
        seed: iSeed
      });
    }

    // 4. BINNENSEEN
    const lakeNames = ['Silbersee', 'Spiegelsee', 'Mondsee', 'Drachenauge', 'Königssee'];
    const lakes: { x: number; y: number }[] = [];
    for (let i = 0; i < lakesCount; i++) {
      const customLk = customItemSpecs['lakes']?.[i];
      const angle = (i / Math.max(1, lakesCount)) * Math.PI * 2;
      const lx = Math.round(anchor.x + Math.cos(angle) * (anchor.radius * 0.35) + jitter(4));
      const ly = Math.round(anchor.y + Math.sin(angle) * (anchor.radius * 0.35) + jitter(4));
      const lRad = customLk?.areaSqKm && customLk.areaSqKm > 0
        ? Math.max(2, Math.round(Math.sqrt(customLk.areaSqKm / Math.PI) * 10))
        : 6 + Math.random() * 3;
      const lSeed = Math.floor(Math.random() * 10000);
      const lName = customLk?.name || lakeNames[i % lakeNames.length];
      const lDesc = customLk?.description || 'Ein klarer, fischreicher Süßwassersee.';
      lakes.push({ x: lx, y: ly });

      result.push({
        id: `lake-${ts}-${i}`,
        name: lName,
        type: 'see',
        description: lDesc,
        parentId: anchor.id,
        x: lx,
        y: ly,
        radius: lRad,
        points: generateNaturalFreehandZonePoints(lx, ly, lRad, 'see', lSeed, 0.35),
        color: '#0ea5e9',
        climate: 'Gemäßigt',
        terrain: 'Binnengewässer',
        seed: lSeed
      });
    }

    // 5. GEBIRGE & BERGMASSIVE
    const mountainNames = ['Drachenkamm', 'Nebelberge', 'Frostgipfel', 'Donnerberge', 'Schattenkamm', 'Eisenspitzen'];
    const mountainPeaks: { x: number; y: number }[] = [];
    for (let i = 0; i < mountainsCount; i++) {
      const customMtn = customItemSpecs['mountains']?.[i];
      const angle = (i / Math.max(1, mountainsCount)) * Math.PI - Math.PI / 4;
      const mx = Math.round(anchor.x + Math.cos(angle) * (anchor.radius * 0.45) + jitter(5));
      const my = Math.round(anchor.y + Math.sin(angle) * (anchor.radius * 0.45) + jitter(4));
      const mRad = customMtn?.areaSqKm && customMtn.areaSqKm > 0
        ? Math.max(3, Math.round(Math.sqrt(customMtn.areaSqKm / Math.PI) * 10))
        : 8 + Math.random() * 3;
      const mName = customMtn?.name || mountainNames[i % mountainNames.length];
      const mDesc = customMtn?.description || 'Ein schroffes, schneebedecktes Bergmassiv mit tiefen Tälern und Pässen.';
      mountainPeaks.push({ x: mx, y: my });

      result.push({
        id: `mountains-${ts}-${i}`,
        name: mName,
        type: 'biome_gebirge',
        description: mDesc,
        parentId: anchor.id,
        x: mx,
        y: my,
        radius: mRad,
        color: '#475569',
        climate: 'Rau & Alpin',
        terrain: 'Hochgebirge',
        seed: Math.floor(Math.random() * 10000)
      });
    }

    // 6. FLÜSSE
    const riverNames = ['Königsstrom', 'Silberfluss', 'Schimmerbach', 'Drachenader', 'Schlangenfluss'];
    for (let i = 0; i < riversCount; i++) {
      const startSource = mountainPeaks[i % mountainPeaks.length] || lakes[i % lakes.length] || { x: anchor.x - 8, y: anchor.y - 8 };
      const startX = startSource.x + jitter(2);
      const startY = startSource.y + jitter(2);

      const flowAngle = (i / Math.max(1, riversCount)) * Math.PI * 2 + Math.PI / 5;
      const flowDist = anchor.radius * 1.1;
      const endX = Math.max(15, Math.min(225, Math.round(anchor.x + Math.cos(flowAngle) * flowDist)));
      const endY = Math.max(15, Math.min(125, Math.round(anchor.y + Math.sin(flowAngle) * flowDist)));

      const p1 = {
        x: Math.round(startX + (endX - startX) * 0.33 + jitter(6)),
        y: Math.round(startY + (endY - startY) * 0.33 + jitter(5))
      };
      const p2 = {
        x: Math.round(startX + (endX - startX) * 0.66 + jitter(6)),
        y: Math.round(startY + (endY - startY) * 0.66 + jitter(5))
      };

      result.push({
        id: `river-${ts}-${i}`,
        name: riverNames[i % riverNames.length],
        type: 'fluss',
        description: 'Ein mäandernder Lebensstrom mit frischem Wasser.',
        parentId: anchor.id,
        x: Math.round((startX + endX) / 2),
        y: Math.round((startY + endY) / 2),
        points: [{ x: startX, y: startY }, p1, p2, { x: endX, y: endY }],
        color: '#38bdf8'
      });
    }

    // 7. BIOME (Wälder, Wüsten, Schnee, Sümpfe, Vulkane)
    for (let i = 0; i < forestsCount; i++) {
      const fx = Math.round(anchor.x + jitter(anchor.radius * 0.5));
      const fy = Math.round(anchor.y + jitter(anchor.radius * 0.5));
      const fRad = 8 + Math.random() * 3;
      const fSeed = Math.floor(Math.random() * 10000);
      result.push({
        id: `forest-${ts}-${i}`,
        name: i === 0 ? 'Smaragdwald' : `Forsthain ${i + 1}`,
        type: 'biome_wald',
        description: 'Dichter, urwüchsiger Wald voller Bäume und Naturleben.',
        parentId: anchor.id,
        x: fx,
        y: fy,
        radius: fRad,
        points: generateNaturalFreehandZonePoints(fx, fy, fRad, 'biome_wald', fSeed, 0.4),
        color: '#065f46',
        climate: 'Gemäßigt',
        terrain: 'Wald',
        seed: fSeed
      });
    }

    for (let i = 0; i < desertsCount; i++) {
      const dx = Math.round(anchor.x + jitter(anchor.radius * 0.5));
      const dy = Math.round(anchor.y + 8 + jitter(anchor.radius * 0.4));
      const dRad = 8 + Math.random() * 2;
      const dSeed = Math.floor(Math.random() * 10000);
      result.push({
        id: `desert-${ts}-${i}`,
        name: 'Golddünental',
        type: 'biome_wueste',
        description: 'Heiße Wüste mit Dünen und Felsen.',
        parentId: anchor.id,
        x: dx,
        y: dy,
        radius: dRad,
        points: generateNaturalFreehandZonePoints(dx, dy, dRad, 'biome_wueste', dSeed, 0.4),
        color: '#d97706',
        climate: 'Heiß & Arid',
        terrain: 'Wüste',
        seed: dSeed
      });
    }

    for (let i = 0; i < snowCount; i++) {
      const sx = Math.round(anchor.x + jitter(anchor.radius * 0.5));
      const sy = Math.round(anchor.y - 8 + jitter(anchor.radius * 0.4));
      const sRad = 8 + Math.random() * 2;
      const sSeed = Math.floor(Math.random() * 10000);
      result.push({
        id: `snow-${ts}-${i}`,
        name: 'Frostöde & Ewiges Eis',
        type: 'biome_schnee',
        description: 'Eisige Landschaft mit tiefem Schnee und Gletschern.',
        parentId: anchor.id,
        x: sx,
        y: sy,
        radius: sRad,
        points: generateNaturalFreehandZonePoints(sx, sy, sRad, 'biome_schnee', sSeed, 0.4),
        color: '#bae6fd',
        climate: 'Polar',
        terrain: 'Gletscher',
        seed: sSeed
      });
    }

    for (let i = 0; i < swampsCount; i++) {
      const swx = Math.round(anchor.x + jitter(anchor.radius * 0.5));
      const swy = Math.round(anchor.y + 6 + jitter(anchor.radius * 0.4));
      const swRad = 7 + Math.random() * 2;
      const swSeed = Math.floor(Math.random() * 10000);
      result.push({
        id: `swamp-${ts}-${i}`,
        name: 'Nebelmoor',
        type: 'biome_sumpf',
        description: 'Feuchtes Sumpf- und Moorland.',
        parentId: anchor.id,
        x: swx,
        y: swy,
        radius: swRad,
        points: generateNaturalFreehandZonePoints(swx, swy, swRad, 'biome_sumpf', swSeed, 0.4),
        color: '#3f6212',
        climate: 'Feucht',
        terrain: 'Moor',
        seed: swSeed
      });
    }

    for (let i = 0; i < volcanoesCount; i++) {
      const vx = anchor.x + jitter(8);
      const vy = anchor.y + jitter(8);
      const vSeed = Math.floor(Math.random() * 10000);
      result.push({
        id: `volcano-${ts}-${i}`,
        name: 'Feuergipfel (Vulkan)',
        type: 'biome_vulkan',
        description: 'Aktiver Vulkan mit Glut und flüssigem Magma.',
        parentId: anchor.id,
        x: vx,
        y: vy,
        radius: 6,
        points: generateNaturalFreehandZonePoints(vx, vy, 6, 'biome_vulkan', vSeed, 0.4),
        color: '#b91c1c',
        climate: 'Vulkanisch',
        terrain: 'Lava',
        seed: vSeed
      });
    }

    // 8. STÄDTE & METROPOLEN
    const cityNames = ['Kronwacht', 'Neu-Hafen', 'Silberglanz', 'Adlerhorst', 'Aethelgard'];
    const placedCities: { id: string; name: string; x: number; y: number }[] = [];
    for (let i = 0; i < citiesCount; i++) {
      const customCity = customItemSpecs['cities']?.[i];
      const cName = customCity?.name || cityNames[i % cityNames.length];
      const isPort = i === 1 || cName.toLowerCase().includes('hafen') || cName.toLowerCase().includes('port');
      const angle = (i / Math.max(1, citiesCount)) * Math.PI * 2 + Math.PI / 4;
      // Ports must sit on the coastline (92% of island radius), interior cities sit closer to center (25% to 40%)
      const dist = isPort ? anchor.radius * 0.92 : anchor.radius * (i === 0 ? 0.22 : 0.42);
      const cx = Math.round(anchor.x + Math.cos(angle) * dist);
      const cy = Math.round(anchor.y + Math.sin(angle) * dist);
      const cRad = customCity?.areaSqKm && customCity.areaSqKm > 0
        ? Math.max(1.5, Math.round(Math.sqrt(customCity.areaSqKm / Math.PI) * 10))
        : (i === 0 ? 4.2 : 3.5);
      const cDesc = customCity?.description || (isPort ? 'Eine geschäftige Hafenstadt an der Küste mit Seehandelsgilden.' : 'Eine blühende Handelsstadt.');
      const cId = `city-${ts}-${i}`;

      placedCities.push({ id: cId, name: cName, x: cx, y: cy });
      result.push({
        id: cId,
        name: cName,
        type: isPort ? 'hafen' : 'stadt',
        description: cDesc,
        parentId: anchor.id,
        x: cx,
        y: cy,
        radius: cRad,
        color: isPort ? '#0ea5e9' : '#6366f1',
        faction: anchor.faction
      });

      if (syncToCodex) {
        loreEntries.push({
          id: `lore-city-${ts}-${i}`,
          title: cName,
          category: 'Orte',
          description: `Bedeutende Stadt in der Region ${quadrantInfo.name}. ${cDesc}`,
          isUnlocked: true
        });
      }
    }

    // 9. DÖRFER & WEILER
    const villageNames = ['Grüntal', 'Mühlenbach', 'Eichenruh', 'Weidengrund', 'Fischerruh', 'Kornfeld', 'Schmiedeberg', 'Moosdorf'];
    const placedVillages: { id: string; name: string; x: number; y: number }[] = [];
    for (let i = 0; i < villagesCount; i++) {
      const customVil = customItemSpecs['villages']?.[i];
      const angle = (i / Math.max(1, villagesCount)) * Math.PI * 2 + Math.PI / 6;
      const dist = anchor.radius * (0.35 + (i % 2) * 0.25);
      const vx = Math.round(anchor.x + Math.cos(angle) * dist + jitter(4));
      const vy = Math.round(anchor.y + Math.sin(angle) * dist + jitter(4));
      const vName = customVil?.name || villageNames[i % villageNames.length];
      const vRad = customVil?.areaSqKm && customVil.areaSqKm > 0
        ? Math.max(1, Math.round(Math.sqrt(customVil.areaSqKm / Math.PI) * 10))
        : 2.2;
      const vDesc = customVil?.description || 'Ein friedliches Dorf mit Bauernhöfen und Gasthaus.';
      const vId = `village-${ts}-${i}`;

      placedVillages.push({ id: vId, name: vName, x: vx, y: vy });
      result.push({
        id: vId,
        name: vName,
        type: 'dorf',
        description: vDesc,
        parentId: anchor.id,
        x: vx,
        y: vy,
        radius: vRad,
        color: '#10b981',
        faction: anchor.faction
      });
    }

    // 10. BURGEN & FESTUNGEN
    const fortNames = ['Festung Drachenfels', 'Kastell Eisenwall', 'Feste Sternenwacht', 'Wachturm Nordmark'];
    for (let i = 0; i < fortressesCount; i++) {
      const customFort = customItemSpecs['fortresses']?.[i];
      const angle = (i / Math.max(1, fortressesCount)) * Math.PI * 2 - Math.PI / 4;
      const fx = Math.round(anchor.x + Math.cos(angle) * (anchor.radius * 0.65) + jitter(4));
      const fy = Math.round(anchor.y + Math.sin(angle) * (anchor.radius * 0.65) + jitter(4));
      const fName = customFort?.name || fortNames[i % fortNames.length];
      const fRad = customFort?.areaSqKm && customFort.areaSqKm > 0
        ? Math.max(1, Math.round(Math.sqrt(customFort.areaSqKm / Math.PI) * 10))
        : 3.0;
      const fDesc = customFort?.description || 'Eine wehrhafte Burg mit massiven Zinnen und Wachtürmen.';

      result.push({
        id: `fort-${ts}-${i}`,
        name: fName,
        type: 'festung',
        description: fDesc,
        parentId: anchor.id,
        x: fx,
        y: fy,
        radius: fRad,
        color: '#dc2626',
        faction: anchor.faction
      });
    }

    // 11. BESONDERE ORTE
    const specialPlaceNames = [
      { name: 'Sonnentempel der Uralten', desc: 'Ein uraltes Heiligtum, geweiht den Göttern des Lichts.' },
      { name: 'Mithril-Mine von Tiefenschacht', desc: 'Eine reiche Erzmine voller Kristalle und Metalle.' },
      { name: 'Vergessene Ruinen von Karth', desc: 'Efeuumrankte Mauerreste einer untergegangenen Zivilisation.' },
      { name: 'Heilende Oase der Geister', desc: 'Eine Quelle mit regenerierendem Zauberwasser.' }
    ];
    for (let i = 0; i < specialPlacesCount; i++) {
      const customSp = customItemSpecs['specialPlaces']?.[i];
      const item = specialPlaceNames[i % specialPlaceNames.length];
      const angle = (i / Math.max(1, specialPlacesCount)) * Math.PI * 2 + Math.PI / 3;
      const px = Math.round(anchor.x + Math.cos(angle) * (anchor.radius * 0.5) + jitter(4));
      const py = Math.round(anchor.y + Math.sin(angle) * (anchor.radius * 0.5) + jitter(4));
      const pName = customSp?.name || item.name;
      const pRad = customSp?.areaSqKm && customSp.areaSqKm > 0
        ? Math.max(1, Math.round(Math.sqrt(customSp.areaSqKm / Math.PI) * 10))
        : 2.4;
      const pDesc = customSp?.description || item.desc;

      result.push({
        id: `special-${ts}-${i}`,
        name: pName,
        type: 'ort',
        description: pDesc,
        parentId: anchor.id,
        x: px,
        y: py,
        radius: pRad,
        color: '#f59e0b',
        faction: anchor.faction
      });
    }

    // 12. HANDELSSTRASSEN
    if (autoRoads && placedCities.length > 0) {
      for (let i = 0; i < placedCities.length - 1; i++) {
        const from = placedCities[i];
        const to = placedCities[i + 1];
        const midX = Math.round((from.x + to.x) / 2 + jitter(3));
        const midY = Math.round((from.y + to.y) / 2 + jitter(3));

        result.push({
          id: `road-city-${ts}-${i}`,
          name: `Handelsstraße (${from.name} - ${to.name})`,
          type: 'weg',
          description: `Verbindungsweg zwischen ${from.name} und ${to.name}.`,
          parentId: anchor.id,
          x: midX,
          y: midY,
          points: [{ x: from.x, y: from.y }, { x: midX, y: midY }, { x: to.x, y: to.y }],
          color: '#d97706'
        });
      }

      placedVillages.forEach((v, vIdx) => {
        let closest = placedCities[0];
        let minDist = Infinity;
        placedCities.forEach(c => {
          const d = Math.hypot(c.x - v.x, c.y - v.y);
          if (d < minDist) {
            minDist = d;
            closest = c;
          }
        });

        if (minDist < 40) {
          const midX = Math.round((v.x + closest.x) / 2 + jitter(2));
          const midY = Math.round((v.y + closest.y) / 2 + jitter(2));
          result.push({
            id: `road-village-${ts}-${vIdx}`,
            name: `Pfad (${v.name} -> ${closest.name})`,
            type: 'weg',
            description: 'Befestigter Weg zwischen Dorf und Stadt.',
            parentId: anchor.id,
            x: midX,
            y: midY,
            points: [{ x: v.x, y: v.y }, { x: midX, y: midY }, { x: closest.x, y: closest.y }],
            color: '#b45309'
          });
        }
      });
    }

    return { newTerritories: result, newLoreEntries: loreEntries };
  };

      // EXECUTE GENERATION
  const handleExecute = async (useAi: boolean) => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const existingList = world.territories || [];

      const normalizeName = (name: string): string => {
        return (name || '')
          .trim()
          .toLowerCase()
          .replace(/^(insel|island|stadt|dorf|burg|festung|hafen|meer|ozean|bucht|königreich|reich|kontinent|gebirge|wald|see)\s+/i, '')
          .replace(/\s+(insel|island|stadt|dorf|burg|festung|hafen|meer|ozean|bucht|königreich|reich|kontinent|gebirge|wald|see)$/i, '')
          .trim();
      };

      const findExistingTerritory = (name: string, list: Territory[]): Territory | undefined => {
        if (!name) return undefined;
        const clean = name.trim().toLowerCase();
        const exact = list.find(t => (t.name || '').trim().toLowerCase() === clean);
        if (exact) return exact;
        const norm = normalizeName(name);
        if (norm.length >= 3) {
          const normMatch = list.find(t => normalizeName(t.name) === norm);
          if (normMatch) return normMatch;
        }
        return undefined;
      };

      const findMatchingCodex = (name: string, loreList: LoreEntry[]): LoreEntry | undefined => {
        if (!name || !loreList || loreList.length === 0) return undefined;
        const clean = name.trim().toLowerCase();
        const exact = loreList.find(l => (l.title || '').trim().toLowerCase() === clean);
        if (exact) return exact;
        const norm = normalizeName(name);
        if (norm.length >= 3) {
          const normMatch = loreList.find(l => normalizeName(l.title) === norm);
          if (normMatch) return normMatch;
        }
        return undefined;
      };

      let rawGeneratedTerritories: any[] = [];
      let rawSuggestedLore: any[] = [];
      let generatedConnections: any[] = [];
      let generatedHoldings: any[] = [];

      if (useAi && userPrompt.trim()) {
        // AI-Powered Smart Fill directly from the User Description with Drawing Engine
        const qCoord = QUADRANT_CONFIG[targetQuadrant];
        const aiResult = await GeminiService.generateSmartFillFromPrompt({
          userPrompt: userPrompt,
          worldTitle: world.title || 'Welt',
          genres: (world as any).genres || [(world as any).genre || 'Fantasy'],
          worldDescription: world.description,
          scopeMode: scopeMode,
          targetQuadrant: QUADRANT_CONFIG[targetQuadrant].name,
          centerCoords: { x: qCoord.x, y: qCoord.y },
          existingTerritoriesCount: existingTerritoriesCount,
          population: population,
          citiesCount: citiesCount,
          villagesCount: villagesCount,
          fortressesCount: fortressesCount,
          specialPlacesCount: specialPlacesCount,
          landScale: landScale,
          customElementsList: buildCustomSpecsSummary(),
          loreDatabase: loreDatabase,
          existingTerritories: existingList,
          world: world
        });

        if (aiResult && aiResult.territories && aiResult.territories.length > 0) {
          rawGeneratedTerritories = aiResult.territories;
          rawSuggestedLore = aiResult.suggestedLore || [];
          generatedConnections = aiResult.connections || [];
          generatedHoldings = aiResult.holdings || [];
        } else {
          const procedural = generateProceduralElements();
          rawGeneratedTerritories = procedural.newTerritories;
          rawSuggestedLore = procedural.newLoreEntries;
        }
      } else {
        // Fast Procedural Generation Mode
        const procedural = generateProceduralElements();
        rawGeneratedTerritories = procedural.newTerritories;
        rawSuggestedLore = procedural.newLoreEntries;
      }

      // Map generated territories, matching against Codex and existing territories (übernehmen & neu zeichnen)
      const updatedExistingMap = new Map<string, Territory>();
      const processedNewTerritories: Territory[] = [];
      const updatedExistingIds = new Set<string>();

      rawGeneratedTerritories.forEach((t: any, idx: number) => {
        const tx = Math.max(15, Math.min(225, Math.round(t.x)));
        const ty = Math.max(15, Math.min(125, Math.round(t.y)));
        const tSeed = Math.floor(Math.random() * 10000);
        
        let normalizedType = t.type || 'ort';
        let normalizedColor = t.color;
        const lowerName = (t.name || '').toLowerCase();

        // Intelligent semantic type corrections
        if (lowerName.includes('calm belt') || lowerName.includes('ozean') || lowerName.includes('meer') || lowerName.includes('blue') || lowerName.includes('bucht')) {
          if (normalizedType === 'koenigreich' || normalizedType === 'land' || normalizedType === 'biome_gras') {
            normalizedType = 'meer';
            if (!normalizedColor || normalizedColor.startsWith('#1') || normalizedColor.startsWith('#2')) {
              normalizedColor = '#0284c7';
            }
          }
        } else if (lowerName.includes('red line') || lowerName.includes('redline') || lowerName.includes('blutberg')) {
          normalizedType = 'biome_gebirge';
          if (!normalizedColor) normalizedColor = '#881337';
        } else if (lowerName.includes('insel') || lowerName.includes('island') || lowerName.includes('atoll') || lowerName.includes('eiland')) {
          if (normalizedType !== 'insel' && normalizedType !== 'hafen' && normalizedType !== 'stadt') {
            normalizedType = 'insel';
          }
        }

        const tRadius = t.radius || (
          normalizedType === 'koenigreich' ? 38 : 
          normalizedType === 'meer' ? 45 : 
          normalizedType === 'insel' ? 6.5 :
          normalizedType === 'see' ? 12 :
          normalizedType.startsWith('biome_') ? 16 :
          normalizedType === 'stadt' ? 4 : 
          normalizedType === 'hafen' ? 4 :
          normalizedType === 'dorf' ? 2.2 : 3
        );
        
        let finalPts = t.points;

        // Generate dedicated geometric structures for known massive geographic features
        if (lowerName.includes('red line') || lowerName.includes('redline')) {
          normalizedType = 'biome_gebirge';
          if (!normalizedColor) normalizedColor = '#881337';
          if (!finalPts || finalPts.length < 4) {
            const wallWidth = 22;
            const leftX = tx - wallWidth / 2;
            const rightX = tx + wallWidth / 2;
            finalPts = [
              { x: Math.round(leftX), y: 10 },
              { x: Math.round(rightX), y: 10 },
              { x: Math.round(rightX + 2.5), y: 35 },
              { x: Math.round(rightX - 1.5), y: 70 },
              { x: Math.round(rightX + 2.0), y: 105 },
              { x: Math.round(rightX), y: 130 },
              { x: Math.round(leftX), y: 130 },
              { x: Math.round(leftX - 2.0), y: 105 },
              { x: Math.round(leftX + 1.5), y: 70 },
              { x: Math.round(leftX - 2.5), y: 35 }
            ];
          }
        } else if (lowerName.includes('calm belt')) {
          normalizedType = 'meer';
          if (!normalizedColor) normalizedColor = '#0ea5e9';
          if (!finalPts || finalPts.length < 4) {
            finalPts = [
              { x: 38, y: 90 },
              { x: 230, y: 90 },
              { x: 230, y: 110 },
              { x: 38, y: 110 }
            ];
          }
        } else if (lowerName.includes('neue welt') || lowerName.includes('new world')) {
          normalizedType = 'meer';
          if (!normalizedColor) normalizedColor = '#0284c7';
          if (!finalPts || finalPts.length < 4) {
            finalPts = [
              { x: 38, y: 10 },
              { x: 230, y: 10 },
              { x: 230, y: 90 },
              { x: 38, y: 90 }
            ];
          }
        } else if (lowerName.includes('south blue') || lowerName.includes('süd-blau') || lowerName.includes('südblau')) {
          normalizedType = 'meer';
          if (!normalizedColor) normalizedColor = '#0369a1';
          if (!finalPts || finalPts.length < 4) {
            finalPts = [
              { x: 10, y: 110 },
              { x: 230, y: 110 },
              { x: 230, y: 130 },
              { x: 10, y: 130 }
            ];
          }
        } else {
          const isZone = normalizedType === 'koenigreich' || normalizedType === 'meer' || normalizedType === 'ozean' || normalizedType === 'see' || normalizedType === 'insel' || normalizedType?.startsWith('biome_') || normalizedType === 'land' || normalizedType === 'region';
          if ((!finalPts || finalPts.length < 3) && isZone) {
            finalPts = generateNaturalFreehandZonePoints(tx, ty, tRadius, normalizedType, tSeed, 0.45);
          }
        }

        // Check if matching territory already exists in world.territories or in Codex
        const existingMatch = findExistingTerritory(t.name, existingList);
        const codexMatch = findMatchingCodex(t.name, loreDatabase);

        if (existingMatch) {
          // ÜBERNEHMEN & NEU ZEICHNEN (Bestehenden Eintrag behalten und Geometrie/Position aktualisieren)
          const mergedTerritory: Territory = {
            ...existingMatch,
            name: existingMatch.name || t.name,
            type: normalizedType || existingMatch.type,
            description: t.description || existingMatch.description || codexMatch?.description || '',
            x: tx,
            y: ty,
            radius: tRadius,
            points: finalPts && finalPts.length >= 3 ? finalPts : existingMatch.points,
            seed: tSeed,
            color: normalizedColor || existingMatch.color,
            climate: t.climate || existingMatch.climate || (codexMatch?.details as any)?.climate,
            terrain: t.terrain || existingMatch.terrain || (codexMatch?.details as any)?.terrain,
            faction: existingMatch.faction || (codexMatch?.details as any)?.faction || t.faction,
            ruler: existingMatch.ruler || (codexMatch?.details as any)?.ruler || t.ruler,
            population: existingMatch.population || (codexMatch?.details as any)?.population || t.population,
            culture: existingMatch.culture || (codexMatch?.details as any)?.culture || t.culture,
            areaKm2: t.areaKm2 || existingMatch.areaKm2,
            habitableAreaKm2: t.habitableAreaKm2 || existingMatch.habitableAreaKm2,
            populationCount: t.populationCount || existingMatch.populationCount,
            populationDensity: t.populationDensity || existingMatch.populationDensity,
            densityClassification: t.densityClassification || existingMatch.densityClassification,
            densityJustification: t.densityJustification || existingMatch.densityJustification,
            plausibilityStatus: t.plausibilityStatus || existingMatch.plausibilityStatus,
            isUnlocked: existingMatch.isUnlocked ?? true
          };

          updatedExistingMap.set(existingMatch.id, mergedTerritory);
          updatedExistingIds.add(existingMatch.id);
        } else {
          // Neues Territorium anlegen, falls im Codex vorhanden, Codex-Daten übernehmen
          const newTerritory: Territory = {
            id: t.id || `ai-gen-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            name: t.name || 'Neuer Ort',
            type: normalizedType,
            description: t.description || codexMatch?.description || '',
            parentId: null,
            x: tx,
            y: ty,
            radius: tRadius,
            color: normalizedColor || undefined,
            climate: t.climate || (codexMatch?.details as any)?.climate || undefined,
            terrain: t.terrain || (codexMatch?.details as any)?.terrain || undefined,
            faction: t.faction || (codexMatch?.details as any)?.faction || undefined,
            ruler: t.ruler || (codexMatch?.details as any)?.ruler || undefined,
            population: t.population || (codexMatch?.details as any)?.population || undefined,
            culture: (codexMatch?.details as any)?.culture || undefined,
            points: finalPts,
            seed: tSeed,
            areaKm2: t.areaKm2,
            habitableAreaKm2: t.habitableAreaKm2,
            populationCount: t.populationCount,
            populationDensity: t.populationDensity,
            densityClassification: t.densityClassification,
            densityJustification: t.densityJustification,
            plausibilityStatus: t.plausibilityStatus,
            isUnlocked: true
          };
          processedNewTerritories.push(newTerritory);
        }
      });

      // Codex-Deduplizierung: Keine doppelten Lore-Einträge generieren
      let finalLore: LoreEntry[] = [];
      if (syncToCodex && rawSuggestedLore.length > 0) {
        const existingLoreTitles = new Set(loreDatabase.map(l => (l.title || '').trim().toLowerCase()));
        rawSuggestedLore.forEach((l: any, lIdx: number) => {
          const lTitle = (l.title || 'Ort').trim();
          if (!existingLoreTitles.has(lTitle.toLowerCase())) {
            finalLore.push({
              id: `lore-ai-${Date.now()}-${lIdx}`,
              title: lTitle,
              category: (l.category as any) || 'Orte',
              description: l.description || '',
              isUnlocked: true
            });
            existingLoreTitles.add(lTitle.toLowerCase());
          }
        });
      }

      // Ensure all ports/harbors sit squarely on the coastline of their parent or nearest landmass
      const ensurePortsOnCoastline = (territories: Territory[]): Territory[] => {
        const islands = territories.filter(
          t => t.type === 'insel' || t.type === 'koenigreich' || t.type === 'land' || (t.name || '').toLowerCase().includes('insel')
        );

        return territories.map(t => {
          const isPortType =
            t.type === 'hafen' ||
            (t.name || '').toLowerCase().includes('hafen') ||
            (t.description || '').toLowerCase().includes('hafen');

          if (!isPortType) return t;

          let parentLand = territories.find(is => is.id === t.parentId);
          if (!parentLand) {
            let minD = Infinity;
            islands.forEach(is => {
              const d = Math.hypot(t.x - is.x, t.y - is.y);
              if (d < minD) {
                minD = d;
                parentLand = is;
              }
            });
          }

          if (parentLand) {
            const dx = t.x - parentLand.x;
            const dy = t.y - parentLand.y;
            const dist = Math.hypot(dx, dy);
            const islandRad = parentLand.radius || 20;
            const targetDist = Math.max(2, islandRad * 0.92);

            if (dist < targetDist) {
              const angle = dist > 0.1 ? Math.atan2(dy, dx) : (Math.PI * 0.75);
              const newX = Math.max(10, Math.min(235, Math.round(parentLand.x + Math.cos(angle) * targetDist)));
              const newY = Math.max(10, Math.min(135, Math.round(parentLand.y + Math.sin(angle) * targetDist)));
              return {
                ...t,
                x: newX,
                y: newY,
                parentId: parentLand.id
              };
            }
          }
          return t;
        });
      };

      // Combine with existing world map & apply deduplication filter
      let combined: Territory[] = [];
      if (replaceMode === 'replace') {
        const mergedList = Array.from(updatedExistingMap.values()).filter(t => updatedExistingIds.has(t.id));
        combined = [...mergedList, ...processedNewTerritories];
      } else {
        const updatedExistingList = existingList.map(t => updatedExistingMap.get(t.id) || t);
        combined = [...updatedExistingList, ...processedNewTerritories];
      }

      // Deduplicate combined by ID and normalized Name (merging duplicates if user already had them)
      const seenIds = new Set<string>();
      const seenNames = new Map<string, Territory>();
      const finalUniqueTerritories: Territory[] = [];

      for (const terr of combined) {
        if (seenIds.has(terr.id)) continue;
        const normN = normalizeName(terr.name);
        
        if (seenNames.has(normN)) {
          // Merge into existing entry instead of adding duplicate
          const prev = seenNames.get(normN)!;
          const merged: Territory = {
            ...prev,
            ruler: prev.ruler || terr.ruler,
            faction: prev.faction || terr.faction,
            population: prev.population || terr.population,
            culture: prev.culture || terr.culture,
            points: (terr.points && terr.points.length >= 3) ? terr.points : prev.points,
            x: terr.x,
            y: terr.y,
            radius: terr.radius || prev.radius,
            areaKm2: terr.areaKm2 || prev.areaKm2,
            habitableAreaKm2: terr.habitableAreaKm2 || prev.habitableAreaKm2,
            populationCount: terr.populationCount || prev.populationCount,
            populationDensity: terr.populationDensity || prev.populationDensity,
            densityClassification: terr.densityClassification || prev.densityClassification,
            densityJustification: terr.densityJustification || prev.densityJustification,
            plausibilityStatus: terr.plausibilityStatus || prev.plausibilityStatus
          };
          seenNames.set(normN, merged);
          const pIdx = finalUniqueTerritories.findIndex(item => item.id === prev.id);
          if (pIdx >= 0) {
            finalUniqueTerritories[pIdx] = merged;
          }
        } else {
          seenIds.add(terr.id);
          seenNames.set(normN, terr);
          finalUniqueTerritories.push(terr);
        }
      }

      const finalAdjusted = ensurePortsOnCoastline(finalUniqueTerritories);

      const existingConnections = (world.connections || []) as any[];
      const combinedConnections = [...existingConnections];
      if (generatedConnections.length > 0) {
        generatedConnections.forEach(gc => {
          if (!combinedConnections.some(c => c.id === gc.id || (c.fromPlace === gc.fromPlace && c.toPlace === gc.toPlace))) {
            combinedConnections.push(gc);
          }
        });
      }

      const existingEconomy = (world as any).economyConfig || (world as any).economy || {};
      const existingHoldings = existingEconomy.holdings || [];
      const combinedHoldings = [...existingHoldings];
      if (generatedHoldings.length > 0) {
        generatedHoldings.forEach(gh => {
          if (!combinedHoldings.some((h: any) => h.id === gh.id || h.name === gh.name)) {
            combinedHoldings.push(gh);
          }
        });
      }

      const updatedWorldData: Partial<WorldSetting> = {
        ...world,
        territories: finalAdjusted,
        connections: combinedConnections.length > 0 ? combinedConnections : world.connections,
        economyConfig: {
          ...existingEconomy,
          holdings: combinedHoldings
        }
      };

      onSaveWorldMap(finalAdjusted, updatedWorldData, syncToCodex ? finalLore : undefined);
      onClose();
    } catch (err: any) {
      console.error("Smart Fill execution error:", err);
      setGenerationError(err.message || 'Fehler beim Generieren der Karte.');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalElementCount = continentsCount + seasCount + lakesCount + islandsCount + mountainsCount + riversCount + forestsCount + desertsCount + snowCount + swampsCount + volcanoesCount + citiesCount + villagesCount + fortressesCount + specialPlacesCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Smart Fill Kartengenerator
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/40">
                  Schritt 4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Zeichne vollständige Weltkarten oder gezielt vereinzelte Zonen (Gebirge, Flüsse, Siedlungen, Inseln) per Textbeschreibung.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* 1. SCOPE SWITCHER: GANZE WELT vs. GEZIELTE TEIL-ZONE */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Was möchtest du generieren?</span>
            </div>

            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSwitchScope('full_world')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  scopeMode === 'full_world'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>Ganze Weltkarte neu anlegen</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchScope('targeted_zone')}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  scopeMode === 'targeted_zone'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Gezielte Teil-Zone zeichnen</span>
              </button>
            </div>
          </div>

          {/* 2. PROMINENTES TEXTEINGABEFELD (KI-PROMPT & BESCHREIBUNG) */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-amber-500/30 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <span>Beschreibe genau, was gezeichnet werden soll:</span>
              </label>

              <button
                type="button"
                onClick={handleAnalyzePromptWithAI}
                disabled={isAnalyzingPrompt}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-40"
                title="Analysiert die Beschreibung und stellt die Regler automatisch ein"
              >
                {isAnalyzingPrompt ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Analysiere Text...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Regler an Text anpassen</span>
                  </>
                )}
              </button>
            </div>

            <AutoExpandingTextarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="z.B. Im Nordosten ein schneebedecktes Gebirge mit 2 Zwergenminen und einem Gletschersee. Ein reißender Fluss fließt nach Süden an einer befestigten Grenzburg und 3 Bauerndörfern vorbei..."
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 min-h-[80px] transition-all leading-relaxed"
            />

            {/* Klickbare Schnell-Inspirationen */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Schnell-Inspirationen zum Anklicken:</span>
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySuggestion(sug)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-200 text-[11px] font-medium transition-all flex items-center gap-1.5"
                  >
                    <span>{sug.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. WENN GEZIELTE TEIL-ZONE: QUADRANT & KATEGORIE-WAHL */}
          {scopeMode === 'targeted_zone' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              {/* Quadrant / Himmelsrichtung */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Compass className="w-3.5 h-3.5" /> Wo auf der Karte platzieren?
                  </span>
                  <span className="text-slate-400 text-[11px] font-normal">
                    {QUADRANT_CONFIG[targetQuadrant].name} ({QUADRANT_CONFIG[targetQuadrant].desc})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {(['northwest', 'north', 'northeast', 'west', 'center', 'east', 'southwest', 'south', 'southeast'] as MapQuadrant[]).map((q) => {
                    const isSelected = targetQuadrant === q;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setTargetQuadrant(q)}
                        className={`p-2 rounded-lg text-center text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                        }`}
                      >
                        {QUADRANT_CONFIG[q].name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ziel-Kategorie */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1 text-amber-400">
                  <Target className="w-3.5 h-3.5" /> Welcher Zonentyp soll im Fokus stehen?
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'mountains', label: 'Gebirge', icon: Mountain },
                    { id: 'rivers', label: 'Flusstal', icon: Waves },
                    { id: 'forest', label: 'Urwald', icon: TreePine },
                    { id: 'settlements', label: 'Städte & Dörfer', icon: Building2 },
                    { id: 'fortresses', label: 'Festungswall', icon: Castle },
                    { id: 'islands', label: 'Inselgruppe', icon: Anchor },
                    { id: 'desert', label: 'Wüste / Oase', icon: Sun },
                    { id: 'snow', label: 'Schnee & Eis', icon: Snowflake },
                    { id: 'swamp', label: 'Sumpfland', icon: Droplets }
                  ].map((cat) => {
                    const isSelected = targetedCategory === cat.id;
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectTargetedCategory(cat.id as TargetedZoneCategory)}
                        className={`p-2 rounded-lg text-left text-[11px] font-bold transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. BEVÖLKERUNG & SIEDLUNGSDICHTE */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Einwohnerzahl & Siedlungsdichte</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium">
                <input
                  type="checkbox"
                  checked={autoScaleDensity}
                  onChange={(e) => {
                    setAutoScaleDensity(e.target.checked);
                    if (e.target.checked) {
                      handlePopulationChange(population, true);
                    }
                  }}
                  className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span>Automatische Kopplung (Fläche & Siedlungen aus Einwohnerzahl berechnen)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Zahleneingabe & Regler */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Ziel-Einwohnerzahl:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="500"
                      max="5000000"
                      step="500"
                      value={population}
                      onChange={(e) => handlePopulationChange(Math.max(100, parseInt(e.target.value) || 0))}
                      className="w-32 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500 text-right"
                    />
                    <span className="text-xs text-slate-400 font-bold">Einwohner</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="1000"
                  value={Math.min(1000000, population)}
                  onChange={(e) => handlePopulationChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                {/* Schnell-Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold">Schnell-Presets:</span>
                  {[5000, 25000, 85000, 250000, 750000].map((presetVal) => (
                    <button
                      key={presetVal}
                      type="button"
                      onClick={() => handlePopulationChange(presetVal)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                        population === presetVal
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {presetVal >= 1000000 ? `${(presetVal/1000000).toFixed(1)}M` : `${presetVal / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Abgeleitete Kennzahlen */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5" /> Abgeleitete Raumgröße
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Maßstab:</span>
                  <span className="font-mono text-amber-300 font-bold">100m / Kachel (1 ha)</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Flächengröße:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    ca. {(Math.PI * Math.pow(landScale * 0.1, 2)).toFixed(1)} km²
                  </span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Siedlungsdichte:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {citiesCount} Stadt / {villagesCount} Dörfer
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. SCHIEBEREGLER FEINABSTIMMUNG (Kollabierbar) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowSliders(!showSliders)}
              className="w-full px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 flex items-center justify-between text-xs font-bold text-slate-300 transition-all border-b border-slate-800"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>Detaillierte Element-Anzahl & Schieberegler anpassen</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-amber-300 font-mono">
                  {totalElementCount} Elemente ausgewählt
                </span>
              </div>
              {showSliders ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showSliders && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GEOGRAFIE & GEWÄSSER */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-850 space-y-3">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center gap-1.5">
                    <Mountain className="w-3.5 h-3.5 text-amber-400" /> Geografie & Gewässer
                  </div>

                  {scopeMode === 'full_world' && (
                    <>
                      <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-300 flex items-center gap-1">
                            <MapIcon className="w-3.5 h-3.5 text-amber-400" /> Landmassen-Größe / Radius
                          </span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-400 text-[11px]">{Math.round(Math.PI * Math.pow(landScale * 0.1, 2))} km²</span>
                            <span className="text-amber-400 font-bold">({landScale} Kacheln)</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="55"
                          value={landScale}
                          onChange={(e) => setLandScale(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      {renderCustomSlider('continents', 'Kontinente', Globe2, 'text-amber-400', continentsCount, setContinentsCount, 0, 3, 'accent-amber-500', 'Kontinent', '', 200)}
                      {renderCustomSlider('seas', 'Meere / Ozeane', Waves, 'text-sky-400', seasCount, setSeasCount, 0, 4, 'accent-sky-500', 'Ozean', '', 150)}
                    </>
                  )}

                  {renderCustomSlider('rivers', 'Flüsse & Wasserläufe', Waves, 'text-sky-300', riversCount, setRiversCount, 0, 6, 'accent-sky-400', 'Fluss', 'Flussläufe', 15)}
                  {renderCustomSlider('mountains', 'Berge & Gebirge', Mountain, 'text-amber-400', mountainsCount, setMountainsCount, 0, 6, 'accent-slate-400', 'Gebirge', 'Gebirge', 30)}
                  {renderCustomSlider('lakes', 'Binnenseen', Droplets, 'text-cyan-400', lakesCount, setLakesCount, 0, 4, 'accent-cyan-400', 'See', '', 8)}
                  {renderCustomSlider('islands', 'Inseln', Anchor, 'text-emerald-400', islandsCount, setIslandsCount, 0, 8, 'accent-emerald-400', 'Insel', '', 20)}
                </div>

                {/* ZIVILISATION & BIOME */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-850 space-y-3">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-wider pb-1 border-b border-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" /> Zivilisation & Biome
                  </div>

                  {renderCustomSlider('cities', 'Städte & Hauptstädte', Building2, 'text-indigo-400', citiesCount, setCitiesCount, 0, 6, 'accent-indigo-500', 'Stadt', '', 5)}
                  {renderCustomSlider('villages', 'Dörfer & Siedlungen', Home, 'text-emerald-400', villagesCount, setVillagesCount, 0, 10, 'accent-emerald-500', 'Dorf', '', 1)}
                  {renderCustomSlider('fortresses', 'Burgen & Festungen', Castle, 'text-rose-400', fortressesCount, setFortressesCount, 0, 5, 'accent-rose-500', 'Burg / Festung', '', 2)}
                  {renderCustomSlider('specialPlaces', 'Besondere Orte (Tempel/Minen)', MapPin, 'text-amber-400', specialPlacesCount, setSpecialPlacesCount, 0, 5, 'accent-amber-500', 'Besonderer Ort', '', 1.5)}

                  {/* Biome */}
                  {renderCustomSlider('forests', 'Wälder', TreePine, 'text-emerald-400', forestsCount, setForestsCount, 0, 6, 'accent-emerald-500', 'Waldgebiet', '', 15)}
                  {renderCustomSlider('deserts', 'Wüste', Sun, 'text-amber-400', desertsCount, setDesertsCount, 0, 4, 'accent-amber-500', 'Wüste', '', 25)}
                  {renderCustomSlider('snow', 'Schnee / Eis', Snowflake, 'text-sky-300', snowCount, setSnowCount, 0, 3, 'accent-sky-400', 'Eisregion', '', 20)}
                  {renderCustomSlider('swamps', 'Sumpf', Droplets, 'text-lime-400', swampsCount, setSwampsCount, 0, 4, 'accent-lime-500', 'Sumpfland', '', 12)}
                  {renderCustomSlider('volcanoes', 'Vulkan', Flame, 'text-rose-400', volcanoesCount, setVolcanoesCount, 0, 3, 'accent-rose-500', 'Vulkan', '', 8)}
                </div>
              </div>
            )}
          </div>

          {/* 5. WEITERE OPTIONEN (STRASSEN, FRAKTIONEN, ERSETZEN/ERWEITERN) */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={autoRoads}
                  onChange={(e) => setAutoRoads(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span className="flex items-center gap-1">
                  <Route className="w-3.5 h-3.5 text-amber-400" />
                  Handelsstraßen verbinden
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={autoFactions}
                  onChange={(e) => setAutoFactions(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span className="flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Fraktionen / Herrscher zuweisen
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={syncToCodex}
                  onChange={(e) => setSyncToCodex(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  In Codex eintragen
                </span>
              </label>
            </div>

            {/* Modus: Ersetzen vs Ergänzen */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Karten-Modus:</span>
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setReplaceMode('replace')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    replaceMode === 'replace' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Neu zeichnen (Ersetzen)
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceMode('append')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    replaceMode === 'append' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Zur Karte hinzufügen
                </button>
              </div>
            </div>
          </div>

          {generationError && (
            <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-950 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Ziel: <strong>{scopeMode === 'targeted_zone' ? `Gezielte Zone (${QUADRANT_CONFIG[targetQuadrant].name})` : 'Ganze Weltkarte'}</strong> &bull; Modus: <strong>{replaceMode === 'replace' ? 'Ersetzen' : 'Hinzufügen'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
            >
              Abbrechen
            </button>

            {/* FAST PROCEDURAL BUTTON */}
            <button
              onClick={() => handleExecute(false)}
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              title="Sofort mit dem schnellen Algorithmus zeichnen"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Sofort zeichnen</span>
            </button>

            {/* GEMINI SMART FILL BUTTON */}
            <button
              onClick={() => handleExecute(true)}
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
              title="Mit KI-Prompt und maßgeschneiderten Lore-Namen zeichnen"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Zeichne Zonen...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                  <span>Mit KI Smart-Fill generieren</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
