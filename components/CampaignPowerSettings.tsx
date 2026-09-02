import React, { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { CampaignPowerParameter, CustomResourceMapping, CostResource, CustomStatAllocation } from '../types';
import { 
  EP_DEFAULT_PARAMETERS, 
  EP_DEFAULT_STAT_ALLOCATIONS, 
  EP_DEFAULT_COST_RESOURCES, 
  EP_DEFAULT_HEALTH_NAMES, 
  EP_DEFAULT_COST_NAMES 
} from '../lib/progressionDefaults';

interface Props {
  data: Record<string, number | CampaignPowerParameter>;
  onChange: (newData: Record<string, number | CampaignPowerParameter>) => void;
  healthPowerName?: string;
  onHealthPowerNameChange?: (name: string) => void;
  costPowerName?: string;
  onCostPowerNameChange?: (name: string) => void;
  healthPowerNames?: string[];
  onHealthPowerNamesChange?: (names: string[]) => void;
  costPowerNames?: string[];
  onCostPowerNamesChange?: (names: string[]) => void;
  healthLabel?: string;
  onHealthLabelChange?: (label: string) => void;
  costLabel?: string;
  onCostLabelChange?: (label: string) => void;
  costResources?: CostResource[];
  onCostResourcesChange?: (resources: CostResource[]) => void;
  customResourceMappings?: CustomResourceMapping[];
  onCustomResourceMappingsChange?: (mappings: CustomResourceMapping[]) => void;
  techniqueProgressionLogic?: 'ep' | 'training' | 'milestone' | 'static';
  onTechniqueProgressionLogicChange?: (logic: 'ep' | 'training' | 'milestone' | 'static') => void;
  customStatAllocations?: CustomStatAllocation[];
  onCustomStatAllocationsChange?: (allocations: CustomStatAllocation[]) => void;
}

const PRESET_LOGICS = [
  {
    name: "EP-basiert (Gegnerstärke)",
    text: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du. Sehr schwache Gegner geben fast gar keine EP."
  },
  {
    name: "Nutzungsbasiert (Training)",
    text: "Dieser Wert steigt dynamisch, wenn der Charakter den Wert im Rollenspiel anwendet, trainiert oder im Abenteuer gezielt einsetzt."
  },
  {
    name: "Meilensteine",
    text: "Dieser Wert steigt nur nach dem Erreichen von bedeutenden Meilensteinen in der Story oder nach dem Besieger von Boss-Gegnern."
  },
  {
    name: "Statisch (Konstant)",
    text: "Dieser Wert ist unveränderlich und stellt die feste, naturgegebene bzw. unüberwindbare Grenze des Charakters dar."
  }
];

const CollapsibleParameterSelector: React.FC<{
  categories: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  accentColorClass: 'red' | 'amber' | 'cyan';
  placeholder?: string;
}> = ({ categories, selected, onChange, accentColorClass, placeholder = "Parameter auswählen..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelect = (cat: string) => {
    const isChecked = selected.includes(cat);
    const next = isChecked 
      ? selected.filter(n => n !== cat)
      : [...selected, cat];
    onChange(next);
  };

  const getAccentStyles = () => {
    switch (accentColorClass) {
      case 'red':
        return {
          badge: 'bg-red-500/15 border-red-500/40 text-red-400 font-bold shadow-[0_0_8px_rgba(239,68,68,0.15)] hover:bg-red-500/25',
          dot: 'bg-red-500'
        };
      case 'cyan':
        return {
          badge: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 font-bold shadow-[0_0_8px_rgba(6,182,212,0.15)] hover:bg-cyan-500/25',
          dot: 'bg-cyan-500'
        };
      case 'amber':
      default:
        return {
          badge: 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.15)] hover:bg-amber-500/25',
          dot: 'bg-amber-500'
        };
    }
  };

  const styles = getAccentStyles();

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      {/* Dropdown Input / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-left text-xs text-slate-300 flex items-center justify-between outline-none cursor-pointer transition-all hover:border-slate-700 active:scale-[0.99] select-none ${
          isOpen ? 'border-slate-600 ring-1 ring-slate-800' : ''
        }`}
      >
        <span className="truncate text-slate-400 font-medium">
          {selected.length === 0 ? placeholder : `${selected.length} Parameter gewählt`}
        </span>
        <span className="flex items-center gap-1 text-slate-500 text-[10px]">
          {selected.length > 0 && (
            <span className="bg-slate-900 border border-slate-800/80 rounded px-1.5 py-0.5 text-[8px] font-bold text-slate-400">
              {selected.length}
            </span>
          )}
          <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {categories.map((cat) => {
            const isChecked = selected.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleSelect(cat)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-slate-900/80 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? styles.dot : 'bg-slate-800'}`} />
                  {cat}
                </span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // Controlled dummy handler
                  className="rounded border-slate-800 text-amber-500 focus:ring-0 bg-slate-900 cursor-pointer pointer-events-none w-3.5 h-3.5"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Pills (Wie jetzt angezeigt werden) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selected.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleSelect(cat)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${styles.badge}`}
              title={`${cat} entfernen`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
              <span>{cat}</span>
              <span className="text-[10px] opacity-70 hover:opacity-100 font-extrabold ml-1">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CampaignPowerSettings: React.FC<Props> = ({ 
  data, 
  onChange,
  healthPowerName = '',
  onHealthPowerNameChange,
  costPowerName = '',
  onCostPowerNameChange,
  healthPowerNames = [],
  onHealthPowerNamesChange,
  costPowerNames = [],
  onCostPowerNamesChange,
  healthLabel = 'Gesundheit',
  onHealthLabelChange,
  costLabel = 'Kosten / Verbrauch',
  onCostLabelChange,
  costResources = [],
  onCostResourcesChange,
  customResourceMappings = [],
  onCustomResourceMappingsChange,
  techniqueProgressionLogic = 'ep',
  onTechniqueProgressionLogicChange,
  customStatAllocations = [],
  onCustomStatAllocationsChange
}) => {
  const [newCatName, setNewCatName] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // States to edit main health resource label
  const [isEditingHealthLabel, setIsEditingHealthLabel] = useState(false);
  const [tempHealthLabel, setTempHealthLabel] = useState(healthLabel);

  // Update temp labels when props change
  useEffect(() => {
    setTempHealthLabel(healthLabel);
  }, [healthLabel]);

  // States for CostResource builder
  const [costResName, setCostResName] = useState("");
  const [costResRadar, setCostResRadar] = useState("");
  const [costResSources, setCostResSources] = useState<string[]>([]);
  const [costResBaseMax, setCostResBaseMax] = useState(100);
  const [editingCostResId, setEditingCostResId] = useState<string | null>(null);
  const [showCostResForm, setShowCostResForm] = useState(false);

  // States for CustomStatAllocation builder / editing
  const [editingAllocId, setEditingAllocId] = useState<string | null>(null);
  const [tempAllocLabel, setTempAllocLabel] = useState("");
  const [tempAllocIcon, setTempAllocIcon] = useState("");
  const [tempAllocCoreRole, setTempAllocCoreRole] = useState("");
  const [newAllocName, setNewAllocName] = useState("");
  const [newAllocIcon, setNewAllocIcon] = useState("✨");
  const [newAllocCoreRole, setNewAllocCoreRole] = useState("");

  const handleAddCostResource = () => {
    if (!costResName.trim()) return;

    if (editingCostResId) {
      const updated = costResources.map(r => {
        if (r.id === editingCostResId) {
          return {
            ...r,
            name: costResName.trim(),
            radarPowerName: costResRadar || undefined,
            sourcePowers: costResSources,
            baseMax: costResBaseMax
          };
        }
        return r;
      });
      onCostResourcesChange?.(updated);
      setEditingCostResId(null);
    } else {
      const newRes: CostResource = {
        id: Math.random().toString(36).substr(2, 9),
        name: costResName.trim(),
        radarPowerName: costResRadar || undefined,
        sourcePowers: costResSources,
        baseMax: costResBaseMax
      };
      onCostResourcesChange?.([...costResources, newRes]);
    }

    // Reset states
    setCostResName("");
    setCostResRadar("");
    setCostResSources([]);
    setCostResBaseMax(100);
    setShowCostResForm(false);
  };

  const handleEditCostResource = (res: CostResource) => {
    setEditingCostResId(res.id);
    setCostResName(res.name);
    setCostResRadar(res.radarPowerName || "");
    setCostResSources(res.sourcePowers || []);
    setCostResBaseMax(res.baseMax || 100);
    setShowCostResForm(true);
  };

  const handleCancelEditCostRes = () => {
    setEditingCostResId(null);
    setCostResName("");
    setCostResRadar("");
    setCostResSources([]);
    setCostResBaseMax(100);
    setShowCostResForm(false);
  };

  const handleRemoveCostResource = (id: string) => {
    onCostResourcesChange?.(costResources.filter(r => r.id !== id));
    if (editingCostResId === id) {
      handleCancelEditCostRes();
    }
  };

  // States for custom resource mapping builder
  const [custMapName, setCustMapName] = useState("");
  const [custMapIcon, setCustMapIcon] = useState("⚡");
  const [custMapBaseMax, setCustMapBaseMax] = useState(100);
  const [custMapEffect, setCustMapEffect] = useState<'regen' | 'shield' | 'dmg_buff' | 'cost_reduction' | 'rage' | 'evade' | 'power_source'>('power_source');
  const [custMapSources, setCustMapSources] = useState<string[]>([]);
  const [custMapDesc, setCustMapDesc] = useState("");
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);

  const EFFECTS_INFO = {
    regen: { label: "Passiv-Regeneration", desc: "Regeneriert passiv außerhalb des Kampfes (+15% pro Aktion) oder im Kampf (+5% pro Runde)." },
    shield: { label: "Schild-Barriere & Schutz", desc: "Kanalisiert Energie in einen Schutzschild und verringert erlittenen Schaden im Kampf um 15%." },
    dmg_buff: { label: "Schadens-Verstärkung", desc: "Erhöht den Schaden aller Techniken um +20%, solange diese Kraftquelle aktiv genutzt wird." },
    cost_reduction: { label: "Kosten-Effizienz / Reduzierung", desc: "Reduziert die MP- bzw. Ressourcen-Kosten von Fähigkeiten im Kampf um 25%." },
    rage: { label: "Zorn-Gewinnung & Rache", desc: "Generiert Energie beim Einstecken von Schaden (+10 pro Treffer) anstelle von passiver Regeneration." },
    evade: { label: "Agilitäts-Fokus / Ausweichen", desc: "Erhöht die Ausweichwahrscheinlichkeit im Kampf um +15%, solange Energie in der Kraftquelle vorhanden ist." },
    power_source: { label: "Reine Kraftquelle (Standard)", desc: "Dient ausschließlich als Energie- oder Kraftquelle für Techniken/Fähigkeiten (wie Mana, Haki, Qi) ohne automatischen Zusatz-Effekt." }
  };

  const CORE_ROLES_INFO: Record<string, { label: string; desc: string }> = {
    CORE_MAX_HP: { label: "Maximale Gesundheit (HP)", desc: "Bestimmt die Lebenspunkte des Charakters." },
    CORE_PHYS_DAMAGE: { label: "Physischer Schaden (Nahkampf/Waffen)", desc: "Berechnet den physischen Schaden für Angriffe." },
    CORE_MYSTIC_DAMAGE: { label: "Übernatürlicher Schaden (Magie/Spezialkräfte)", desc: "Berechnet magischen oder übernatürlichen Schaden." },
    CORE_PHYS_DEFENSE: { label: "Körperliche Verteidigung (Rüstung/Zähigkeit)", desc: "Verringert physischen Schaden." },
    CORE_MYSTIC_DEFENSE: { label: "Übernatürlicher Schutz (Barriere/Geistiger Widerstand)", desc: "Verringert übernatürlichen/magischen Schaden." },
    CORE_SPEED_INITIATIVE: { label: "Tempo & Initiative (Ausweichen/Rundenreihenfolge)", desc: "Beeinflusst Initiative und Ausweichrate." },
    CORE_RESOURCE_EFFICIENCY: { label: "Energie-Effizienz (Kosten-Reduzierung)", desc: "Senkt die Kosten von Fähigkeiten und Kräften." },
    CORE_UTILITY_DAILY: { label: "Alltags- & Berufsfertigkeiten (Kochen/Segeln etc.)", desc: "Unterstützt Handwerk und allgemeine Proben." }
  };

  useEffect(() => {
    if (custMapName) {
      setCustMapDesc(`Fördert ${custMapName}. Effekt: ${EFFECTS_INFO[custMapEffect].desc}`);
    } else {
      setCustMapDesc("");
    }
  }, [custMapName, custMapEffect]);

  const handleAddCustomMapping = () => {
    if (!custMapName.trim()) return;

    if (editingMappingId) {
      const updated = customResourceMappings.map(m => {
        if (m.id === editingMappingId) {
          return {
            ...m,
            name: custMapName.trim(),
            icon: custMapIcon,
            sourcePowers: custMapSources,
            baseMax: custMapBaseMax,
            effect: custMapEffect,
            description: custMapDesc || `Erlaubt die Steuerung von ${custMapName.trim()}.`
          };
        }
        return m;
      });
      onCustomResourceMappingsChange?.(updated);
      setEditingMappingId(null);
    } else {
      const newMapping: CustomResourceMapping = {
        id: Math.random().toString(36).substr(2, 9),
        name: custMapName.trim(),
        icon: custMapIcon,
        sourcePowers: custMapSources,
        baseMax: custMapBaseMax,
        effect: custMapEffect,
        description: custMapDesc || `Erlaubt die Steuerung von ${custMapName.trim()}.`
      };
      onCustomResourceMappingsChange?.([...customResourceMappings, newMapping]);
    }
    
    // Reset states
    setCustMapName("");
    setCustMapIcon("⚡");
    setCustMapBaseMax(100);
    setCustMapEffect("power_source");
    setCustMapSources([]);
    setCustMapDesc("");
  };

  const handleEditCustomMapping = (mapping: CustomResourceMapping) => {
    setEditingMappingId(mapping.id);
    setCustMapName(mapping.name);
    setCustMapIcon(mapping.icon || "⚡");
    setCustMapBaseMax(mapping.baseMax || 100);
    setCustMapEffect(mapping.effect || "power_source");
    setCustMapSources(mapping.sourcePowers || []);
    setCustMapDesc(mapping.description || "");
  };

  const handleCancelEdit = () => {
    setEditingMappingId(null);
    setCustMapName("");
    setCustMapIcon("⚡");
    setCustMapBaseMax(100);
    setCustMapEffect("power_source");
    setCustMapSources([]);
    setCustMapDesc("");
  };

  const handleRemoveCustomMapping = (id: string) => {
    onCustomResourceMappingsChange?.(customResourceMappings.filter(m => m.id !== id));
    if (editingMappingId === id) {
      handleCancelEdit();
    }
  };

  // Lokale Text-Inputs zur Vermeidung von lästigen Zurückspring-Effekten beim Löschen/Tippen
  const [scaleMinStr, setScaleMinStr] = useState("");
  const [scaleMaxStr, setScaleMaxStr] = useState("");
  const [minStr, setMinStr] = useState("");
  const [maxStr, setMaxStr] = useState("");

const getAutoCategory = (name: string): 'physical' | 'supernatural' => {
  const n = name.toLowerCase();
  const physicalKeywords = [
    'stärke', 'kraft', 'ausdauer', 'hp', 'defense', 'verteidigung', 'konstitution', 
    'geschicklichkeit', 'geschwindigkeit', 'speed', 'dexterity', 'strength', 
    'physical', 'constitution', 'endurance', 'agilität', 'körperlich', 'nahkampf', 
    'schwertkampf', 'fernkampf', 'reflexe', 'prowess', 'vit', 'str', 'dex', 'con',
    'kampf', 'body', 'körper', 'leben', 'ausweichen', 'blocken', 'rüst'
  ];
  if (physicalKeywords.some(kw => n.includes(kw))) {
    return 'physical';
  }
  return 'supernatural';
};

  // Normalisiere Daten um alte Strukturen (einfache Zahlen) abzufangen
  const normalizedData: Record<string, CampaignPowerParameter> = {};
  Object.entries(data || {}).forEach(([key, val]) => {
    if (typeof val === 'number') {
      normalizedData[key] = {
        min: Math.floor(val * 0.4), // nehme 40% als startpunkt
        max: val,
        levelUpLogic: "Standard EP-Verteilung (100 EP für Level-Up).",
        scaleMin: 0,
        scaleMax: 100,
        category: getAutoCategory(key)
      };
    } else if (val && typeof val === 'object') {
      normalizedData[key] = {
        min: typeof val.min === 'number' ? val.min : 10,
        max: typeof val.max === 'number' ? val.max : 100,
        levelUpLogic: typeof val.levelUpLogic === 'string' ? val.levelUpLogic : "Immer genau 100 EP für ein Level-Up.",
        scaleMin: typeof val.scaleMin === 'number' ? val.scaleMin : 0,
        scaleMax: typeof val.scaleMax === 'number' ? val.scaleMax : 100,
        category: val.category || getAutoCategory(key)
      };
    }
  });

  const categories = Object.keys(normalizedData);

  // Wenn noch keine Kategorie ausgewählt ist, wähle die erste verbleibende
  useEffect(() => {
    if (categories.length > 0 && (!selectedCat || !categories.includes(selectedCat))) {
      setSelectedCat(categories[0]);
    } else if (categories.length === 0 && selectedCat !== null) {
      setSelectedCat(null);
    }
  }, [categories.length, selectedCat]);

  // Pre-populate default allocations if empty
  useEffect(() => {
    if (customStatAllocations.length === 0 && onCustomStatAllocationsChange) {
      // Use EP_DEFAULT_STAT_ALLOCATIONS (11 Kampfeigenschaften)
      const defaults: CustomStatAllocation[] = JSON.parse(JSON.stringify(EP_DEFAULT_STAT_ALLOCATIONS));
      
      // If categories are already defined, filter selected radar names if needed or keep full defaults
      if (categories.length > 0) {
        defaults.forEach(d => {
          const matching = d.selectedRadarNames.filter(cat => categories.includes(cat));
          if (matching.length > 0) {
            d.selectedRadarNames = matching;
          }
        });
      }
      onCustomStatAllocationsChange(defaults);
    }
  }, [customStatAllocations.length, onCustomStatAllocationsChange, categories]);

  const saveAllocLabel = (id: string) => {
    if (!tempAllocLabel.trim()) return;
    const updated = customStatAllocations.map(a => 
      a.id === id ? { 
        ...a, 
        label: tempAllocLabel.trim(), 
        icon: tempAllocIcon.trim() || '⚔️',
        coreRole: tempAllocCoreRole || undefined
      } : a
    );
    onCustomStatAllocationsChange?.(updated);
    setEditingAllocId(null);
  };

  const handleCreateAllocation = () => {
    if (!newAllocName.trim()) return;
    const newAlloc: CustomStatAllocation = {
      id: Math.random().toString(36).substr(2, 9),
      label: newAllocName.trim(),
      icon: newAllocIcon.trim() || '✨',
      selectedRadarNames: [],
      coreRole: newAllocCoreRole || undefined
    };
    onCustomStatAllocationsChange?.([...customStatAllocations, newAlloc]);
    setNewAllocName("");
    setNewAllocIcon("✨");
    setNewAllocCoreRole("");
  };

  // Synchronisiere Eingabefelder mit den aktuellen Werten, sofern die Felder nicht aktiv fokussiert sind
  useEffect(() => {
    if (selectedCat && normalizedData[selectedCat]) {
      const p = normalizedData[selectedCat];
      
      const parsedScaleMin = parseInt(scaleMinStr);
      if (document.activeElement?.id !== 'input-scaleMin' || (!isNaN(parsedScaleMin) && parsedScaleMin !== p.scaleMin)) {
        setScaleMinStr(String(p.scaleMin ?? 0));
      }

      const parsedScaleMax = parseInt(scaleMaxStr);
      if (document.activeElement?.id !== 'input-scaleMax' || (!isNaN(parsedScaleMax) && parsedScaleMax !== p.scaleMax)) {
        setScaleMaxStr(String(p.scaleMax ?? 100));
      }

      const parsedMin = parseInt(minStr);
      if (document.activeElement?.id !== 'input-min' || (!isNaN(parsedMin) && parsedMin !== p.min)) {
        setMinStr(String(p.min));
      }

      const parsedMax = parseInt(maxStr);
      if (document.activeElement?.id !== 'input-max' || (!isNaN(parsedMax) && parsedMax !== p.max)) {
        setMaxStr(String(p.max));
      }
    } else {
      setScaleMinStr("");
      setScaleMaxStr("");
      setMinStr("");
      setMaxStr("");
    }
  }, [selectedCat, data]);

  // Diagramm-Daten für Recharts bauen
  const physicalCategories = categories.filter(cat => normalizedData[cat].category === 'physical');
  const supernaturalCategories = categories.filter(cat => normalizedData[cat].category === 'supernatural' || !normalizedData[cat].category);

  const getChartDataForCats = (cats: string[]) => {
    return cats.map(cat => {
      const sMin = normalizedData[cat]?.scaleMin ?? 0;
      const sMax = normalizedData[cat]?.scaleMax ?? 100;
      const range = sMax - sMin || 100;

      const pMin = normalizedData[cat]?.min ?? 10;
      const pMax = normalizedData[cat]?.max ?? 100;

      const relativeStart = Math.min(100, Math.max(0, Math.round(((pMin - sMin) / range) * 100)));
      const relativeMax = Math.min(100, Math.max(0, Math.round(((pMax - sMin) / range) * 100)));

      return {
        subject: cat,
        Start: relativeStart,
        Maximum: relativeMax,
        fullMark: 100,
        actualMin: pMin,
        actualMax: pMax,
        sMin,
        sMax
      };
    });
  };

  const physicalChartData = getChartDataForCats(physicalCategories);
  const supernaturalChartData = getChartDataForCats(supernaturalCategories);

  const customRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg shadow-2xl text-xs z-50">
          <p className="font-bold text-slate-100 mb-1">{data.subject}</p>
          <p className="text-amber-400 font-medium">Startwert (Min): <span className="font-mono font-bold">{data.actualMin}</span></p>
          <p className="text-rose-400 font-medium">Maximum (Bis): <span className="font-mono font-bold">{data.actualMax}</span></p>
          <p className="text-slate-400 text-[10px] mt-0.5 font-mono">Skala: {data.sMin} bis {data.sMax}</p>
        </div>
      );
    }
    return null;
  };

  const renderFallbackList = (cats: string[], theme: 'physical' | 'supernatural') => {
    const isPhysical = theme === 'physical';
    const bgOpacity = isPhysical ? 'bg-rose-500/10' : 'bg-indigo-500/10';

    return (
      <div className="w-full h-full flex flex-col justify-center space-y-3">
        <div className="text-center pb-1">
          <p className="text-[10px] text-slate-500 italic leading-snug">
            Radar benötigt ≥ 3 Werte. Zeige Balken-Übersicht:
          </p>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {cats.map(cat => {
            const p = normalizedData[cat];
            const sMin = p.scaleMin ?? 0;
            const sMax = p.scaleMax ?? 100;
            const range = sMax - sMin || 100;
            // Prozentuale Position von Min/Max auf der Skala
            const minPos = Math.min(100, Math.max(0, ((p.min - sMin) / range) * 100));
            const maxPos = Math.min(100, Math.max(0, ((p.max - sMin) / range) * 100));

            return (
              <div key={cat} className="space-y-1 text-left">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-bold text-slate-300">{cat}</span>
                  <span className="text-[9.5px] font-mono text-slate-400">
                    Von <strong className="text-amber-450">{p.min}</strong> bis <strong className="text-emerald-450">{p.max}</strong>
                  </span>
                </div>
                
                {/* Visual line with range indicator */}
                <div className="h-2 w-full bg-slate-900 border border-slate-800 rounded-lg relative overflow-hidden">
                  <div 
                    className={`absolute h-full ${bgOpacity} border-l border-r border-[#334155]`}
                    style={{ left: `${minPos}%`, width: `${maxPos - minPos}%` }}
                  />
                  <div 
                    className="absolute h-full w-1 bg-amber-500"
                    style={{ left: `${minPos}%` }}
                  />
                  <div 
                    className="absolute h-full w-1 bg-emerald-500"
                    style={{ left: `${maxPos}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const updateParam = (cat: string, updates: Partial<CampaignPowerParameter>) => {
    const updated = {
      ...normalizedData,
      [cat]: {
        ...normalizedData[cat],
        ...updates
      }
    };
    onChange(updated);
  };

  const handleScaleBoundChange = (cat: string, field: 'scaleMin' | 'scaleMax', value: number) => {
    const currentParam = normalizedData[cat];
    let newScaleMin = field === 'scaleMin' ? value : (currentParam.scaleMin ?? 0);
    let newScaleMax = field === 'scaleMax' ? value : (currentParam.scaleMax ?? 100);

    // Mindestprüfungen
    if (newScaleMin > newScaleMax) {
      if (field === 'scaleMin') {
        newScaleMax = newScaleMin;
      } else {
        newScaleMin = newScaleMax;
      }
    }

    const updated = { ...normalizedData };

    // Aktualisiere alle Parameter auf die neuen Skalenbereiche (neuer Standard)
    Object.keys(updated).forEach(k => {
      updated[k] = {
        ...updated[k],
        scaleMin: newScaleMin,
        scaleMax: newScaleMax,
        min: newScaleMin,
        max: newScaleMax
      };
    });

    onChange(updated);
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (trimmed && !normalizedData[trimmed]) {
      // Nutze den angepassten globalen Skalenbereich der existierenden Parameter als Standard
      const existingKeys = Object.keys(normalizedData);
      const currentScaleMin = existingKeys.length > 0 ? (normalizedData[existingKeys[0]].scaleMin ?? 0) : 0;
      const currentScaleMax = existingKeys.length > 0 ? (normalizedData[existingKeys[0]].scaleMax ?? 100) : 100;

      const updated = {
        ...normalizedData,
        [trimmed]: {
          min: currentScaleMin,
          max: currentScaleMax,
          scaleMin: currentScaleMin,
          scaleMax: currentScaleMax,
          levelUpLogic: "Immer genau 100 EP für ein Level-Up. Je stärker dein Gegner im Kampf ist, desto mehr EP erhältst du.",
          category: getAutoCategory(trimmed)
        }
      };
      onChange(updated);
      setSelectedCat(trimmed);
      setNewCatName("");
    }
  };

  const handleRemoveCategory = (cat: string) => {
    const updated = { ...normalizedData };
    delete updated[cat];
    onChange(updated);
    if (selectedCat === cat) {
      const remaining = Object.keys(updated);
      setSelectedCat(remaining.length > 0 ? remaining[0] : null);
    }
  };

  // Handlers für scaleMin Input-Änderungen und -Validierungen
  const handleScaleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setScaleMinStr(valStr);
    
    const parsed = parseInt(valStr);
    if (!isNaN(parsed) && selectedCat) {
      // Direktes Update dieses Werts für ALLE Parameter, um Konsistenz beim Tippen zu erhalten
      const updated = { ...normalizedData };
      Object.keys(updated).forEach(k => {
        updated[k] = {
          ...updated[k],
          scaleMin: parsed
        };
      });
      onChange(updated);
    }
  };

  const handleScaleMinBlur = () => {
    if (!selectedCat) return;
    const currentParam = normalizedData[selectedCat];
    const parsed = parseInt(scaleMinStr);
    const fallback = currentParam.scaleMin ?? 0;
    const finalVal = isNaN(parsed) ? fallback : parsed;
    
    // Führe Normalisierung, Clamping und globale Synchronisation durch
    handleScaleBoundChange(selectedCat, 'scaleMin', finalVal);
  };

  // Handlers für scaleMax Input-Änderungen und -Validierungen
  const handleScaleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setScaleMaxStr(valStr);
    
    const parsed = parseInt(valStr);
    if (!isNaN(parsed) && selectedCat) {
      // Direktes Update dieses Werts für ALLE Parameter, um Konsistenz beim Tippen zu erhalten
      const updated = { ...normalizedData };
      Object.keys(updated).forEach(k => {
        updated[k] = {
          ...updated[k],
          scaleMax: parsed
        };
      });
      onChange(updated);
    }
  };

  const handleScaleMaxBlur = () => {
    if (!selectedCat) return;
    const currentParam = normalizedData[selectedCat];
    const parsed = parseInt(scaleMaxStr);
    const fallback = currentParam.scaleMax ?? 100;
    const finalVal = isNaN(parsed) ? fallback : parsed;
    
    // Führe Normalisierung, Clamping und globale Synchronisation durch
    handleScaleBoundChange(selectedCat, 'scaleMax', finalVal);
  };

  // Handlers für mIn (Von) Input-Änderungen und -Validierungen
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setMinStr(valStr);
    
    const parsed = parseInt(valStr);
    if (!isNaN(parsed) && selectedCat) {
      updateParam(selectedCat, { min: parsed });
    }
  };

  const handleMinBlur = () => {
    if (!selectedCat) return;
    const currentParam = normalizedData[selectedCat];
    const sMin = currentParam.scaleMin ?? 0;
    const sMax = currentParam.scaleMax ?? 100;
    
    const parsed = parseInt(minStr);
    const fallback = currentParam.min;
    let finalVal = isNaN(parsed) ? fallback : parsed;
    
    // Einhalten des Skalen-Bereichs
    finalVal = Math.max(sMin, Math.min(sMax, finalVal));
    
    // Startwert darf nicht größer als das Maximum sein
    const finalMax = Math.max(finalVal, currentParam.max);
    
    updateParam(selectedCat, {
      min: finalVal,
      max: finalMax
    });
  };

  // Handlers für max (Bis) Input-Änderungen und -Validierungen
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    setMaxStr(valStr);
    
    const parsed = parseInt(valStr);
    if (!isNaN(parsed) && selectedCat) {
      updateParam(selectedCat, { max: parsed });
    }
  };

  const handleMaxBlur = () => {
    if (!selectedCat) return;
    const currentParam = normalizedData[selectedCat];
    const sMin = currentParam.scaleMin ?? 0;
    const sMax = currentParam.scaleMax ?? 100;
    
    const parsed = parseInt(maxStr);
    const fallback = currentParam.max;
    let finalVal = isNaN(parsed) ? fallback : parsed;
    
    // Einhalten des Skalen-Bereichs
    finalVal = Math.max(sMin, Math.min(sMax, finalVal));
    
    // Maximallimit darf nicht kleiner als der Startwert sein
    const finalMin = Math.min(finalVal, currentParam.min);
    
    updateParam(selectedCat, {
      max: finalVal,
      min: finalMin
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h3 className="text-base font-fantasy text-amber-400 mb-2">📊 Kampagnen-Grenzwerte & Kräftedifferenz</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Schaffe deine eigenen Macht-Dimensionen (z.B. <strong>Ninjutsu, Stärke, Magie, Mana</strong>). Du kannst jetzt für jede Dimension das absolute Minimum und Maximum der Skala eingeben, den Einstiegsbereich (Von) sowie das maximale Limit (Bis) definieren und festlegen, wie die Steigerung erfolgen soll.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <div className="flex-1 flex gap-2">
            <input 
              type="text" 
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              placeholder="Neuer Parameter (z.B. Ninjutsu, Magie, Willenskraft...)"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500"
            />
            <button 
              onClick={handleAddCategory}
              disabled={!newCatName.trim()}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
            >
              <i className="fa-solid fa-plus"></i> Hinzufügen
            </button>
          </div>
        </div>
      </div>

      {/* ⚔️ Kampf-Ressourcen & Zuordnungssystem */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-6">
        <div>
          <h3 className="text-base font-fantasy text-amber-400 flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <span>Kampf-Ressourcen & Zuordnungssystem</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">
            Bestimme, welche deiner Kampagnen-Parameter aus dem Radar-Diagramm als Haupt-Ressourcen im rundenbasierten Kampf verwendet werden, oder erstelle völlig eigenständige Kraftquellen für Techniken und Spezial-Ressourcen (wie <strong>Mana, Qi, Ausdauer, Wut, Fokus</strong>) mit individuellen Effekten.
          </p>
        </div>

        {/* Part 1: Unified Kampfeigenschaften-Zuordnungen & Cost Resources */}
        <div className="w-full">
          <div className="bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-slate-800/80">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <span>✊</span> Kampfeigenschaften-Zuordnungen & Ressourcen
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal mb-4">
              Weise deinen Radar-Parametern konkrete Zuordnungen für Gesundheit (HP), Stärke, Verteidigung, Beweglichkeit, Kosten-Ressourcen (MP, SP) oder eigene Kampfeigenschaften zu.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Gesundheit Zuordnung Card */}
              <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    {isEditingHealthLabel ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          className="bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs outline-none focus:border-red-500 flex-1 font-bold"
                          value={tempHealthLabel}
                          onChange={(e) => setTempHealthLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onHealthLabelChange?.(tempHealthLabel.trim() || 'Gesundheit');
                              setIsEditingHealthLabel(false);
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onHealthLabelChange?.(tempHealthLabel.trim() || 'Gesundheit');
                            setIsEditingHealthLabel(false);
                          }}
                          className="p-1 text-emerald-400 hover:text-emerald-300 text-xs"
                          title="Speichern"
                        >
                          <i className="fa-solid fa-check"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTempHealthLabel(healthLabel);
                            setIsEditingHealthLabel(false);
                          }}
                          className="p-1 text-red-400 hover:text-red-300 text-xs"
                          title="Abbrechen"
                        >
                          <i className="fa-solid fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <label className="text-xs text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <span className="text-red-500 text-sm">❤️</span> {healthLabel} (HP)
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsEditingHealthLabel(true)}
                          className="text-slate-500 hover:text-amber-400 p-1 rounded hover:bg-amber-500/10 transition-all text-[10px]"
                          title="Bezeichnung bearbeiten"
                        >
                          <i className="fa-solid fa-edit"></i> Bearbeiten
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-normal mt-2">
                    Wähle alle Parameter aus, die zusammengerechnet deine maximale Gesundheit ({healthLabel}) bestimmen.
                  </p>

                  {categories.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic block mt-2">Keine Parameter definiert. Erstelle zuerst welche im Radar-Diagramm.</span>
                  ) : (
                    <div className="pt-2">
                      <CollapsibleParameterSelector
                        categories={categories}
                        selected={healthPowerNames}
                        accentColorClass="red"
                        placeholder="Parameter für Gesundheit wählen..."
                        onChange={(next) => {
                          onHealthPowerNamesChange?.(next);
                          if (next.length > 0) {
                            onHealthPowerNameChange?.(next[0]);
                          } else {
                            onHealthPowerNameChange?.("");
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-850/60 pt-2 mt-4 font-mono text-[9px] text-slate-500">
                  {healthPowerNames.length > 0 
                    ? `Gewählt: ${healthPowerNames.join(' + ')} (Summiert deinen Lebensbalken)`
                    : 'Standardmäßig wird die Standard-Helden-HP (100-150) verwendet.'
                  }
                </div>
              </div>

              {/* Dynamic Mapped customStatAllocations */}
              {customStatAllocations.map(alloc => (
                <div key={alloc.id} className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-sm relative group/card">
                  
                  {/* Delete icon */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = customStatAllocations.filter(a => a.id !== alloc.id);
                      onCustomStatAllocationsChange?.(next);
                    }}
                    className="absolute top-3.5 right-3 text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-all text-xs opacity-0 group-hover/card:opacity-100 duration-150"
                    title="Zuordnung löschen"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>

                  <div>
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      {editingAllocId === alloc.id ? (
                        <div className="flex flex-col gap-2.5 w-full mr-6">
                          <div className="flex items-center gap-1 w-full">
                            <input
                              type="text"
                              className="bg-slate-950 border border-slate-700 text-white rounded px-1.5 py-1 text-xs outline-none focus:border-amber-500 w-10 text-center font-bold"
                              value={tempAllocIcon}
                              onChange={(e) => setTempAllocIcon(e.target.value)}
                              placeholder="Icon"
                              maxLength={2}
                            />
                            <input
                              type="text"
                              className="bg-slate-950 border border-slate-700 text-white rounded px-2 py-1 text-xs outline-none focus:border-amber-500 flex-1 font-bold"
                              value={tempAllocLabel}
                              onChange={(e) => setTempAllocLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveAllocLabel(alloc.id);
                                }
                              }}
                              autoFocus
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                              Kern-Rolle (Hintergrund-Berechnung):
                            </label>
                            <select
                              value={tempAllocCoreRole}
                              onChange={(e) => setTempAllocCoreRole(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer text-slate-200"
                            >
                              <option value="">-- Keine Kern-Rolle zugeordnet --</option>
                              {Object.entries(CORE_ROLES_INFO).map(([key, info]) => (
                                <option key={key} value={key} className="bg-slate-900">
                                  {info.label} ({key})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex justify-end gap-1.5 mt-0.5">
                            <button
                              type="button"
                              onClick={() => saveAllocLabel(alloc.id)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-bold rounded text-[10px] uppercase tracking-wider flex items-center gap-1"
                              title="Speichern"
                            >
                              <i className="fa-solid fa-check"></i> Speichern
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAllocId(null)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-[10px] uppercase tracking-wider flex items-center gap-1"
                              title="Abbrechen"
                            >
                              <i className="fa-solid fa-times"></i> Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start w-full mr-6">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              <span className="text-amber-500 text-sm">{alloc.icon || '⚔️'}</span> {alloc.label}
                            </label>
                            {alloc.coreRole && CORE_ROLES_INFO[alloc.coreRole] ? (
                              <span className="inline-block text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                                ⚙️ {CORE_ROLES_INFO[alloc.coreRole].label}
                              </span>
                            ) : (
                              <span className="inline-block text-[9px] text-slate-500 italic">
                                Keine Kern-Rolle zugeordnet
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAllocId(alloc.id);
                              setTempAllocLabel(alloc.label);
                              setTempAllocIcon(alloc.icon || '⚔️');
                              setTempAllocCoreRole(alloc.coreRole || "");
                            }}
                            className="text-slate-500 hover:text-amber-400 p-1 rounded hover:bg-amber-500/10 transition-all text-[10px]"
                            title="Eigenschaft bearbeiten"
                          >
                            <i className="fa-solid fa-edit"></i>
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal mt-2">
                      Wähle alle Parameter aus, die zusammengerechnet {alloc.label} bestimmen.
                    </p>

                    {categories.length === 0 ? (
                      <span className="text-[10px] text-slate-600 italic block mt-2">Keine Parameter definiert. Erstelle zuerst welche im Radar-Diagramm.</span>
                    ) : (
                      <div className="pt-2">
                        <CollapsibleParameterSelector
                          categories={categories}
                          selected={alloc.selectedRadarNames}
                          accentColorClass="amber"
                          placeholder={`${alloc.label} Parameter wählen...`}
                          onChange={(nextSelected) => {
                            const updated = customStatAllocations.map(a => 
                              a.id === alloc.id ? { ...a, selectedRadarNames: nextSelected } : a
                            );
                            onCustomStatAllocationsChange?.(updated);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-850/60 pt-2 mt-4 font-mono text-[9px] text-slate-500">
                    {alloc.selectedRadarNames.length > 0
                      ? `Gewählt: ${alloc.selectedRadarNames.join(' + ')}`
                      : 'Keine Parameter zugeordnet.'
                    }
                  </div>
                </div>
              ))}

              {/* Cost & Consumption Resources Card */}
              <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-sm relative">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <label className="text-xs text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="text-cyan-400 text-sm">⚡</span> Kosten-Ressourcen (MP/SP)
                    </label>
                    {!showCostResForm && !editingCostResId && (
                      <button
                        type="button"
                        onClick={() => setShowCostResForm(true)}
                        className="p-1 px-2 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition-all text-[10px] flex items-center gap-1 font-extrabold uppercase tracking-wider bg-slate-950/30 border border-slate-800"
                        title="Neue Kosten-Ressource erstellen"
                      >
                        <i className="fa-solid fa-plus"></i> Hinzufügen
                      </button>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-normal mt-2">
                    Definiere verbrauchbare Kosten-Ressourcen (MP, SP, Ausdauer), die mit Radar-Parametern verknüpft sind.
                  </p>

                  {/* List of current Cost Resources */}
                  <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
                    {costResources.length === 0 ? (
                      <span className="text-[10px] text-slate-500 italic block py-2 bg-slate-950/30 px-3 rounded border border-dashed border-slate-800">
                        Keine Kosten-Ressourcen definiert. Erstelle eine (z.B. &ldquo;MP&rdquo; basierend auf &ldquo;Magie&rdquo;).
                      </span>
                    ) : (
                      costResources.map(res => (
                        <div key={res.id} className="bg-slate-950/80 border border-slate-800/60 p-2.5 rounded-lg flex items-center justify-between gap-2 shadow-sm">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-cyan-400 text-xs font-bold">{res.name}</span>
                              {res.radarPowerName && (
                                <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                                  Radar: {res.radarPowerName}
                                </span>
                              )}
                            </div>
                            <div className="text-[8px] text-slate-500">
                              Max: {res.baseMax || 100} + {res.sourcePowers && res.sourcePowers.length > 0 ? res.sourcePowers.join(' + ') : 'Keine'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditCostResource(res)}
                              className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-850 transition-all text-[10px]"
                              title="Bearbeiten"
                            >
                              <i className="fa-solid fa-edit"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCostResource(res.id)}
                              className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-850 transition-all text-[10px]"
                              title="Löschen"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* CostResource Builder Form */}
                  {(showCostResForm || editingCostResId) && (
                    <div className="bg-slate-950/40 border border-slate-850 rounded-lg p-3 space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider border-b border-slate-850 pb-1.5 flex items-center justify-between">
                        <span>{editingCostResId ? '✍️ Bearbeiten' : '➕ Neue Ressource'}</span>
                        <button
                          type="button"
                          onClick={handleCancelEditCostRes}
                          className="text-slate-500 hover:text-red-400 text-xs p-1 rounded hover:bg-red-500/10 transition-all"
                          title="Schließen"
                        >
                          <i className="fa-solid fa-times"></i>
                        </button>
                      </div>

                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                          Bezeichnung / Kürzel:
                        </label>
                        <input
                          type="text"
                          placeholder="z.B. MP, SP, Ausdauer..."
                          value={costResName}
                          onChange={(e) => setCostResName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white text-xs outline-none focus:border-cyan-500"
                        />
                      </div>

                      {/* Radar-Parameter mapping */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                          Zugeordneter Radar-Parameter:
                        </label>
                        <select
                          value={costResRadar}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCostResRadar(val);
                            if (val && !costResSources.includes(val)) {
                              setCostResSources(prev => [...prev, val]);
                            }
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white text-xs outline-none focus:border-cyan-500 cursor-pointer text-slate-200"
                        >
                          <option value="">-- Kein Radar-Parameter --</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Influence values */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                          Einfluss-Parameter (bestimmen das Maximum):
                        </label>
                        {categories.length === 0 ? (
                          <span className="text-[9px] text-slate-600 italic block">Keine Parameter im Radar.</span>
                        ) : (
                          <div className="pt-0.5">
                            <CollapsibleParameterSelector
                              categories={categories}
                              selected={costResSources}
                              accentColorClass="cyan"
                              placeholder="Einfluss-Parameter wählen..."
                              onChange={(next) => setCostResSources(next)}
                            />
                          </div>
                        )}
                      </div>

                      {/* Base Max */}
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                          Basis-Maximum (ohne Attributeinfluss):
                        </label>
                        <input
                          type="number"
                          value={costResBaseMax}
                          onChange={(e) => setCostResBaseMax(parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white text-xs outline-none focus:border-cyan-500"
                          min="0"
                        />
                      </div>

                      {/* Action button */}
                      <button
                        type="button"
                        onClick={handleAddCostResource}
                        disabled={!costResName.trim()}
                        className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-850 disabled:opacity-40 disabled:text-slate-500 text-slate-100 font-bold rounded text-xs uppercase tracking-wider transition-all"
                      >
                        {editingCostResId ? '💾 Änderungen speichern' : '➕ Ressource hinzufügen'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-850/60 pt-2 mt-4 font-mono text-[9px] text-slate-500">
                  {costResources.length > 0
                    ? `Ressourcen: ${costResources.map(r => r.name).join(', ')}`
                    : 'Verwendet Standard-MP (100).'
                  }
                </div>
              </div>

              {/* Add New Custom Allocation Card */}
              <div className="bg-slate-950/40 border border-slate-850 border-dashed rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="text-xs text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-1.5">
                    <span>➕</span> Neue Kampfeigenschaft
                  </div>
                  
                  <p className="text-[10px] text-slate-500 leading-normal mt-2">
                    Erstelle eine neue Kampfeigenschaft, die sich aus deinen Radar-Parametern zusammensetzt.
                  </p>

                  <div className="space-y-2.5 mt-3">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Icon (z.B. 🏹)"
                        value={newAllocIcon}
                        onChange={(e) => setNewAllocIcon(e.target.value)}
                        className="w-14 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-white text-xs text-center outline-none focus:border-amber-500 font-bold"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        placeholder="Name (z.B. Fernkampf)"
                        value={newAllocName}
                        onChange={(e) => setNewAllocName(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white text-xs outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Kern-Rolle Selection for Creation */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                        Kern-Rolle (System-Berechnung, optional):
                      </label>
                      <select
                        value={newAllocCoreRole}
                        onChange={(e) => setNewAllocCoreRole(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white text-xs outline-none focus:border-amber-500 cursor-pointer text-slate-200"
                      >
                        <option value="">-- Keine Kern-Rolle --</option>
                        {Object.entries(CORE_ROLES_INFO).map(([key, info]) => (
                          <option key={key} value={key} className="bg-slate-900">
                            {info.label} ({key})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateAllocation}
                  disabled={!newAllocName.trim()}
                  className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-850 disabled:opacity-40 disabled:text-slate-500 text-slate-100 font-bold rounded text-[10px] uppercase tracking-wider transition-all mt-4"
                >
                  Hinzufügen
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 my-4"></div>

        {/* Part 2: Custom Resource Mappings list */}
        <div>
          <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span>🔮</span> Registrierte Kraftquellen für Techniken ({customResourceMappings.length})
          </h4>
          
          {customResourceMappings.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic bg-slate-900/40 p-3 rounded-lg border border-slate-900">
              Noch keine benutzerdefinierten Kraftquellen registriert. Nutze den Editor unten, um eine neue Kraftquelle für Techniken zu entwerfen!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-2">
              {customResourceMappings.map(mapping => (
                <div 
                  key={mapping.id} 
                  className={`bg-slate-900 border rounded-xl p-3.5 space-y-2.5 relative group hover:border-slate-700 transition-all ${
                    editingMappingId === mapping.id ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)] bg-slate-900/90' : 'border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-lg bg-slate-950 p-1.5 rounded-lg border border-slate-800 w-8 h-8 flex items-center justify-center">
                        {mapping.icon || "⚡"}
                      </span>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-200">{mapping.name}</h4>
                        <span className="text-[9px] font-mono text-amber-400/90 uppercase tracking-widest font-bold">
                          {EFFECTS_INFO[mapping.effect]?.label || mapping.effect}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditCustomMapping(mapping)}
                        className="text-slate-500 hover:text-amber-400 p-1.5 rounded hover:bg-amber-500/10 transition-all text-[11px]"
                        title="Kraftquelle bearbeiten"
                      >
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomMapping(mapping.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-all text-[11px]"
                        title="Kraftquelle löschen"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 space-y-1 bg-slate-950/40 p-2 rounded-lg border border-slate-900/60 font-mono">
                    <div>
                      <span className="text-slate-500">Max-Wert-Formel:</span>
                    </div>
                    <div className="text-slate-300">
                      {mapping.sourcePowers && mapping.sourcePowers.length > 0 
                        ? `${mapping.sourcePowers.join(' + ')} (Aktueller Wert)` 
                        : `Standard-Max: ${mapping.baseMax}`
                      }
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-normal italic">
                    {mapping.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Part 3: Creator / Editor Form */}
        <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500/90 flex items-center gap-1.5">
            {editingMappingId ? (
              <>
                <span>🔮</span> 
                <span>Kraftquelle &ldquo;{custMapName}&rdquo; bearbeiten</span>
              </>
            ) : (
              <>
                <span>🆕</span> 
                <span>Neue Kraftquelle entwerfen</span>
              </>
            )}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-300 font-extrabold uppercase tracking-wider">Kraftquellen-Name</label>
              <input
                type="text"
                value={custMapName}
                onChange={(e) => setCustMapName(e.target.value)}
                placeholder="z.B. Mana, Wut, Ausdauer, Fokus, Chakra, Qi..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
              />
            </div>

            {/* Icon / Emoji Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-300 font-extrabold uppercase tracking-wider">Symbol / Emoji ({custMapIcon})</label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={custMapIcon}
                  onChange={(e) => setCustMapIcon(e.target.value)}
                  className="w-10 bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-xs outline-none focus:border-amber-500"
                />
                <div className="flex-1 flex flex-wrap gap-1">
                  {["⚡", "🛡️", "💔", "🌀", "🔥", "❄️", "🧪", "🩸", "⚙️", "💀", "🌟"].map(emo => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setCustMapIcon(emo)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs hover:bg-slate-800 transition-all ${custMapIcon === emo ? 'bg-amber-500/20 border border-amber-500/40' : 'border border-transparent'}`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Source powers checklist */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-300 font-extrabold uppercase tracking-wider block">
              🔗 An Kampagnen-Parameter koppeln (Summiert sich für das Maximum)
            </label>
            <p className="text-[9.5px] text-slate-500 leading-tight">
              Wähle die Parameter aus, die das maximale Limit dieser Kraftquelle bestimmen sollen. Wenn nichts gewählt ist, gilt das Basis-Maximum.
            </p>
            {categories.length === 0 ? (
              <span className="text-[10px] text-slate-600 italic block">Keine Parameter definiert. Erstelle zuerst oben Parameter.</span>
            ) : (
              <div className="pt-1">
                <CollapsibleParameterSelector
                  categories={categories}
                  selected={custMapSources}
                  accentColorClass="amber"
                  placeholder="Kraftquellen-Parameter wählen..."
                  onChange={(next) => setCustMapSources(next)}
                />
              </div>
            )}
          </div>

          {/* Effect and description fields removed from UI as requested */}

          <div className="flex justify-end gap-2 pt-1">
            {editingMappingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 border border-slate-700"
              >
                Abbrechen
              </button>
            )}
            <button
              type="button"
              onClick={handleAddCustomMapping}
              disabled={!custMapName.trim()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-950/20"
            >
              {editingMappingId ? (
                <>
                  <i className="fa-solid fa-save"></i> Änderungen speichern
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plus"></i> Kraftquelle registrieren
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detailbereich (Linke Spalte) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Erstellte Parameter</h4>
            
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-4 border-b border-slate-800 pb-3">
                {categories.map(cat => (
                  <div
                    key={cat}
                    className={`inline-flex items-center rounded-lg text-xs font-bold border transition-all ${
                      selectedCat === cat 
                        ? 'bg-amber-600/20 border-amber-500 text-amber-400 shadow-md shadow-amber-950/20' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCat(cat)}
                      className="px-3 py-1.5 flex items-center gap-1.5 focus:outline-none"
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] font-mono opacity-80">({normalizedData[cat].min}-{normalizedData[cat].max})</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Remove confirm as it blocks inside iframes
                        handleRemoveCategory(cat);
                      }}
                      className="px-2 py-1.5 text-slate-500 hover:text-red-400 border-l border-slate-800/40 transition-colors"
                      title={`${cat} löschen`}
                    >
                      <i className="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {selectedCat && normalizedData[selectedCat] ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Eigenschafts-Kategorie Auswahl */}
                <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-850 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">🛡️ Eigenschafts-Kategorie</span>
                    <span className="text-[10px] text-slate-500 font-semibold">Zuteilung für Diagramme</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    Bestimme, ob dieser Parameter auf dem 🩸 <strong>Körperliche Eigenschaften</strong>-Radar oder dem 🔮 <strong>Übernatürliche Kräfte</strong>-Radar angezeigt werden soll.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => updateParam(selectedCat, { category: 'physical' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        normalizedData[selectedCat].category === 'physical'
                          ? 'bg-rose-950/50 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-xs">🩸 Physisch</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateParam(selectedCat, { category: 'supernatural' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                        normalizedData[selectedCat].category === 'supernatural'
                          ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)]'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-xs">🔮 Übernatürlich</span>
                    </button>
                  </div>
                </div>

                {/* ABSOLUTE SCALE MIN/MAX SETTING BOX */}
                <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-850 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">⚙️ 1. Absoluter Skalenbereich</span>
                    <span className="text-[10px] text-slate-500 font-semibold">Grenzwerte der Eigenschaft</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 block font-bold">Skala-Minimum</label>
                      <input 
                        type="text"
                        id="input-scaleMin"
                        value={scaleMinStr}
                        onChange={handleScaleMinChange}
                        onBlur={handleScaleMinBlur}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-lg p-2 text-xs text-slate-100 outline-none font-mono font-bold"
                      />
                      <span className="text-[8px] text-slate-500 block leading-tight">Z.B. Mindestens 0</span>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 block font-bold">Skala-Maximum</label>
                      <input 
                        type="text"
                        id="input-scaleMax"
                        value={scaleMaxStr}
                        onChange={handleScaleMaxChange}
                        onBlur={handleScaleMaxBlur}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-lg p-2 text-xs text-slate-100 outline-none font-mono font-bold"
                      />
                      <span className="text-[8px] text-slate-500 block leading-tight">Z.B. Maximal 1000</span>
                    </div>
                  </div>
                </div>

                {/* SLIDERS / LEVEL UP LOGIC REMOVED FOR A SIMPLER INTERFACE IN SYNCHRONICITY */}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-8 text-center border-dashed border border-slate-800 bg-slate-900/10 rounded-xl">
                Noch kein Parameter vorhanden. Erstelle oben deinen ersten Spielwelt-Parameter!
              </div>
            )}
          </div>
        </div>

        {/* Diagramm-Vorschau (Rechte Spalte) */}
        <div className="lg:col-span-6 flex flex-col gap-6" id="diagramm-vorschau-spalte">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5" id="diagramm-gruppenfeld">
            <div>
              <h4 className="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5" id="diagramm-gruppenfeld-titel">
                <span>📊</span>
                <span>Diagramme & Parameter-Verteilung</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug text-left" id="diagramm-gruppenfeld-desc">
                Diese beiden Radar-Diagramme zeigen die Start- und Grenzwerte deiner erstellten Parameter im physischen und übernatürlichen Bereich und gehören zusammen als fundamentale Verteilung deines Machtniveaus.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {/* 1. KÖRPERLICHE EIGENSCHAFTEN */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 flex flex-col justify-between min-h-[350px] transition-all hover:border-slate-800/80" id="radar-koerperlich">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                    <span className="text-sm">🩸</span>
                    <span>Körperliche Eigenschaften</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug text-left">
                    Radar-Diagramm für Physis, Ausdauer, Nahkampf und körperliche Attribute ({physicalCategories.length} Parameter).
                  </p>
                </div>

                <div className="w-full h-[270px] relative mt-3 flex items-center justify-center" id="radar-koerperlich-container">
                  {physicalCategories.length >= 3 ? (
                    <ResponsiveContainer width="100%" height={270}>
                      <RadarChart cx="50%" cy="50%" outerRadius="60%" data={physicalChartData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#fb7185', fontSize: 10, fontWeight: 'bold' }} />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]} 
                          tick={false}
                          axisLine={false}
                        />
                        <Tooltip content={customRadarTooltip} />
                        <Radar
                          name="Startwert (Min)"
                          dataKey="Start"
                          stroke="#f59e0b"
                          fill="#f59e0b"
                          fillOpacity={0.3}
                        />
                        <Radar
                          name="Maximum (Bis)"
                          dataKey="Maximum"
                          stroke="#f43f5e"
                          fill="#f43f5e"
                          fillOpacity={0.18}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    renderFallbackList(physicalCategories, 'physical')
                  )}
                </div>
              </div>

              {/* 2. ÜBERNATÜRLICHE EIGENSCHAFTEN */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 flex flex-col justify-between min-h-[350px] transition-all hover:border-slate-800/80" id="radar-uebernatuerlich">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                    <span className="text-sm">🔮</span>
                    <span>Übernatürliche Kräfte</span>
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug text-left">
                    Radar-Diagramm für Magie, Mana, Chakra, Seele und übernatürliche Kräfte ({supernaturalCategories.length} Parameter).
                  </p>
                </div>

                <div className="w-full h-[270px] relative mt-3 flex items-center justify-center" id="radar-uebernatuerlich-container">
                  {supernaturalCategories.length >= 3 ? (
                    <ResponsiveContainer width="100%" height={270}>
                      <RadarChart cx="50%" cy="50%" outerRadius="60%" data={supernaturalChartData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#818cf8', fontSize: 10, fontWeight: 'bold' }} />
                        <PolarRadiusAxis 
                          angle={30} 
                          domain={[0, 100]} 
                          tick={false}
                          axisLine={false}
                        />
                        <Tooltip content={customRadarTooltip} />
                        <Radar
                          name="Startwert (Min)"
                          dataKey="Start"
                          stroke="#a5b4fc"
                          fill="#a5b4fc"
                          fillOpacity={0.3}
                        />
                        <Radar
                          name="Maximum (Bis)"
                          dataKey="Maximum"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.18}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    renderFallbackList(supernaturalCategories, 'supernatural')
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignPowerSettings;
