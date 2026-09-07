import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export type SideEffectPhase = 'während' | 'nachwirkung' | 'risiko_pnr';
export type SideEffectSeverity = 'leicht' | 'moderat' | 'schwer' | 'kritisch';
export type SideEffectCategory = 'physisch' | 'mental' | 'energetisch' | 'sensorisch' | 'anatomisch' | 'spezifisch';

export interface TransformationSideEffect {
  id: string;
  name: string;
  phase: SideEffectPhase;
  severity: SideEffectSeverity;
  category?: SideEffectCategory;
  trigger: string;
  effect: string;
  duration?: string;
  isCustom?: boolean;
  isFormSpecific?: boolean;
}

/**
 * Reusable Auto-Expanding / Auto-Resizing Textarea component
 */
export const AutoExpandingTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  value,
  onChange,
  rows = 2,
  ...props
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 38)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        adjustHeight();
        onChange?.(e);
      }}
      rows={rows}
      className={`resize-none overflow-hidden ${className}`}
      {...props}
    />
  );
};

export interface TransformationIntensityCardProps {
  intensityVal: number;
  stageName: string;
  onUpdateIntensity: (newVal: number) => void;
  readOnly?: boolean;
  className?: string;
  compact?: boolean;
  timeRateIncrease?: number;
  timeRateDecay?: number;
  timeUnitLabel?: string;
  defaultPointOfNoReturn?: number;
  onUpdatePointOfNoReturn?: (pnr: number) => void;
  
  // Optional context properties for active form, character & body state
  activeTransformation?: any;
  player?: any;
  resolvedBody?: any;
  powerSource?: string;
  powerCost?: string;
  costResources?: any[];
}

// Helper to parse localized decimal string (accepts both ',' and '.')
export const parseDecimal = (valStr: string): number => {
  if (!valStr) return 0;
  const normalized = String(valStr).trim().replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper to format float into clean localized string
export const formatNum = (num: number): string => {
  if (isNaN(num)) return '0';
  const rounded = Math.round(num * 100) / 100;
  return String(rounded).replace('.', ',');
};

// Helper to format duration smartly into days, hours, and minutes if applicable
export const formatDuration = (valueInUnits: number, timeUnit: string): string => {
  if (!isFinite(valueInUnits) || valueInUnits < 0) return 'Unbegrenzt';
  if (valueInUnits === 0) return `0 ${timeUnit}`;

  const unitLower = (timeUnit || 'min.').trim().toLowerCase();

  // Minutes detection (Min., Min, Minuten, min, m)
  const isMinutes = unitLower.startsWith('min') || unitLower === 'm';
  if (isMinutes) {
    const totalMins = valueInUnits;
    if (totalMins < 60) {
      return `${formatNum(totalMins)} ${timeUnit}`;
    }

    const days = Math.floor(totalMins / 1440);
    const remMinsAfterDays = totalMins % 1440;
    const hours = Math.floor(remMinsAfterDays / 60);
    const mins = Math.round((remMinsAfterDays % 60) * 10) / 10;

    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'Tag' : 'Tage'}`);
    }
    if (hours > 0) {
      parts.push(`${hours} Std.`);
    }
    if (mins > 0 || parts.length === 0) {
      parts.push(`${formatNum(mins)} Min.`);
    }

    return `${parts.join(' ')} (${formatNum(totalMins)} ${timeUnit})`;
  }

  // Hours detection (Std., Std, Stunden, h)
  const isHours = unitLower.startsWith('std') || unitLower === 'h' || unitLower.startsWith('stund');
  if (isHours) {
    const totalHours = valueInUnits;
    if (totalHours < 24) {
      return `${formatNum(totalHours)} ${timeUnit}`;
    }
    const days = Math.floor(totalHours / 24);
    const hours = Math.round((totalHours % 24) * 10) / 10;

    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'Tag' : 'Tage'}`);
    }
    if (hours > 0 || parts.length === 0) {
      parts.push(`${formatNum(hours)} Std.`);
    }
    return `${parts.join(' ')} (${formatNum(totalHours)} ${timeUnit})`;
  }

  // Seconds detection (Sek., Sek, Sekunden, s)
  const isSeconds = unitLower.startsWith('sek') || unitLower.startsWith('sec') || unitLower === 's';
  if (isSeconds) {
    const totalSecs = valueInUnits;
    if (totalSecs < 60) {
      return `${formatNum(totalSecs)} ${timeUnit}`;
    }
    const totalMins = totalSecs / 60;
    if (totalMins < 60) {
      const mins = Math.floor(totalMins);
      const secs = Math.round(totalSecs % 60);
      return `${mins} Min. ${secs} Sek. (${formatNum(totalSecs)} ${timeUnit})`;
    }
    const days = Math.floor(totalMins / 1440);
    const remMinsAfterDays = totalMins % 1440;
    const hours = Math.floor(remMinsAfterDays / 60);
    const mins = Math.round(remMinsAfterDays % 60);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} ${days === 1 ? 'Tag' : 'Tage'}`);
    if (hours > 0) parts.push(`${hours} Std.`);
    if (mins > 0 || parts.length === 0) parts.push(`${mins} Min.`);
    return `${parts.join(' ')} (${formatNum(totalSecs)} ${timeUnit})`;
  }

  return `${formatNum(valueInUnits)} ${timeUnit}`;
};

export const CONFIG_STORAGE_KEY = 'transformation_intensity_card_settings_v1';

export interface SavedCardSettings {
  pnrThreshold?: number;
  kraftStep?: number;
  zeitStep?: number;
  abklingenStep?: number;
  timeUnit?: string;
  resourcePoolMax?: number;
  resourcePoolCurrent?: number;
  resourceUpkeepRate?: number;
  resourceName?: string;
  powerSourceName?: string;
  activeSideEffectIds?: string[];
  customSideEffects?: TransformationSideEffect[];
}

export const DEFAULT_TRANSFORMATION_SETTINGS: SavedCardSettings = {
  pnrThreshold: 80,
  kraftStep: 15,
  zeitStep: 10,
  abklingenStep: 20,
  timeUnit: 'Min.',
  resourcePoolMax: 100,
  resourcePoolCurrent: 100,
  resourceUpkeepRate: 5,
  resourceName: 'MP',
  powerSourceName: 'Kraftquelle',
  activeSideEffectIds: [],
  customSideEffects: [],
};

export const getTransformationCardSettings = (): Required<SavedCardSettings> => {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed: SavedCardSettings = JSON.parse(saved);
      return {
        pnrThreshold: typeof parsed.pnrThreshold === 'number' ? parsed.pnrThreshold : DEFAULT_TRANSFORMATION_SETTINGS.pnrThreshold!,
        kraftStep: typeof parsed.kraftStep === 'number' ? parsed.kraftStep : DEFAULT_TRANSFORMATION_SETTINGS.kraftStep!,
        zeitStep: typeof parsed.zeitStep === 'number' ? parsed.zeitStep : DEFAULT_TRANSFORMATION_SETTINGS.zeitStep!,
        abklingenStep: typeof parsed.abklingenStep === 'number' ? parsed.abklingenStep : DEFAULT_TRANSFORMATION_SETTINGS.abklingenStep!,
        timeUnit: typeof parsed.timeUnit === 'string' && parsed.timeUnit.trim() ? parsed.timeUnit : DEFAULT_TRANSFORMATION_SETTINGS.timeUnit!,
        resourcePoolMax: typeof parsed.resourcePoolMax === 'number' ? parsed.resourcePoolMax : (DEFAULT_TRANSFORMATION_SETTINGS.resourcePoolMax || 100),
        resourcePoolCurrent: typeof parsed.resourcePoolCurrent === 'number' ? parsed.resourcePoolCurrent : (DEFAULT_TRANSFORMATION_SETTINGS.resourcePoolCurrent || 100),
        resourceUpkeepRate: typeof parsed.resourceUpkeepRate === 'number' ? parsed.resourceUpkeepRate : (DEFAULT_TRANSFORMATION_SETTINGS.resourceUpkeepRate || 5),
        resourceName: typeof parsed.resourceName === 'string' && parsed.resourceName.trim() ? parsed.resourceName : (DEFAULT_TRANSFORMATION_SETTINGS.resourceName || 'MP'),
        powerSourceName: typeof parsed.powerSourceName === 'string' && parsed.powerSourceName.trim() ? parsed.powerSourceName : (DEFAULT_TRANSFORMATION_SETTINGS.powerSourceName || 'Kraftquelle'),
        activeSideEffectIds: Array.isArray(parsed.activeSideEffectIds) ? parsed.activeSideEffectIds : [],
        customSideEffects: Array.isArray(parsed.customSideEffects) ? parsed.customSideEffects : [],
      };
    }
  } catch (e) {}
  return DEFAULT_TRANSFORMATION_SETTINGS as Required<SavedCardSettings>;
};

export const SIDE_EFFECT_CATEGORIES: { id: SideEffectCategory; label: string; icon: string }[] = [
  { id: 'physisch', label: 'Physisch & Körperlich', icon: 'fa-heart-pulse' },
  { id: 'mental', label: 'Mental & Psychisch', icon: 'fa-brain' },
  { id: 'energetisch', label: 'Magisch & Energetisch', icon: 'fa-bolt' },
  { id: 'sensorisch', label: 'Sinne & Wahrnehmung', icon: 'fa-eye' },
  { id: 'anatomisch', label: 'Anatomisch & PNR', icon: 'fa-dna' },
  { id: 'spezifisch', label: 'Gestalt-Spezifisch', icon: 'fa-shield-halved' },
];

/**
 * Universal catalog of transformation side effects & risks
 */
export const UNIVERSAL_SIDE_EFFECTS_CATALOG: TransformationSideEffect[] = [
  // --- PHYSISCH & KÖRPERLICH ---
  {
    id: 'u-phy-1',
    name: 'Muskelüberlastung & Hypertonie',
    phase: 'während',
    severity: 'moderat',
    category: 'physisch',
    trigger: 'Kontinuierlich bei intensiver Bewegung',
    effect: 'Stark erhöhte Muskelspannung und Mikrorisse im Muskelgewebe durch die vergrößerte Kraftentfaltung.',
    duration: 'Während aktiver Form'
  },
  {
    id: 'u-phy-2',
    name: 'Hypermetabolismus & Kalorienzehrung',
    phase: 'während',
    severity: 'leicht',
    category: 'physisch',
    trigger: 'Bei Intensität > 30%',
    effect: 'Drastisch beschleunigter Stoffwechsel; enormer Kalorien- und Glukoseverbrauch mit plötzlichem Hitzegefühl.',
    duration: 'Während aktiver Form'
  },
  {
    id: 'u-phy-3',
    name: 'Kardiovaskuläre Spitzenbelastung',
    phase: 'während',
    severity: 'schwer',
    category: 'physisch',
    trigger: 'Bei Intensität > 70%',
    effect: 'Stark erhöhter Puls und Blutdruck zur Versorgung des erweiterten Körpers; spürbare Erwärmung der Kernzonen.',
    duration: 'Während Hochstufe'
  },
  {
    id: 'u-phy-4',
    name: 'Muskulärer Entlastungskater & Gliederschwere',
    phase: 'nachwirkung',
    severity: 'moderat',
    category: 'physisch',
    trigger: 'Nach Deaktivierung der Verwandlung',
    effect: 'Schwere Gliedmaßen, Mattigkeit und temporär um 20-30% reduzierte physische Kraft während der Geweberückbildung.',
    duration: '20 bis 45 Minuten'
  },
  {
    id: 'u-phy-5',
    name: 'Zelluläre Erschöpfung & Gewebeschrumpfung',
    phase: 'nachwirkung',
    severity: 'schwer',
    category: 'physisch',
    trigger: 'Nach Rückverwandlung aus Intensität > 80%',
    effect: 'Schmerzhafter Rückbildungsprozess des hypertrophen Gewebes mit spürbarem Bewegungswiderstand.',
    duration: '1 bis 2 Stunden'
  },

  // --- MENTAL & PSYCHISCH ---
  {
    id: 'u-men-1',
    name: 'Emotionale Distanzierung & Hyperfokus',
    phase: 'während',
    severity: 'moderat',
    category: 'mental',
    trigger: 'Bei Intensität > 40%',
    effect: 'Das analytische und logische Denkvermögen steigt drastisch, während Empathie und spontane Gefühle vorübergehend gedämpft werden.',
    duration: 'Während Form aktiv'
  },
  {
    id: 'u-men-2',
    name: 'Kampfrausch & Aggressionsanstieg',
    phase: 'während',
    severity: 'moderat',
    category: 'mental',
    trigger: 'Bei Intensität > 50%',
    effect: 'Starker Anstieg des Offensivdrangs; Schmerzsignale werden unterdrückt und vorsichtige Reaktionen gehemmt.',
    duration: 'Während aktiver Kampfphase'
  },
  {
    id: 'u-men-3',
    name: 'Psionischer & Mentaler Burnout',
    phase: 'nachwirkung',
    severity: 'moderat',
    category: 'mental',
    trigger: 'Nach Deaktivierung der Verwandlung',
    effect: 'Dumpfer Kopfschmerz, verringerte Konzentrationsfähigkeit und um 25% verzögerte Reaktionsschnelligkeit.',
    duration: '15 bis 30 Minuten'
  },
  {
    id: 'u-men-4',
    name: 'Emotionale Leere & Erschöpfungsdepression',
    phase: 'nachwirkung',
    severity: 'schwer',
    category: 'mental',
    trigger: 'Nach Rückverwandlung aus hoher Intensität',
    effect: 'Temporäre emotionale Abstumpfung, Antriebslosigkeit und verlangsamte Sprachverarbeitung.',
    duration: '2 bis 4 Stunden'
  },
  {
    id: 'u-men-5',
    name: 'Temporäre Gedächtnislücken',
    phase: 'nachwirkung',
    severity: 'schwer',
    category: 'mental',
    trigger: 'Nach Deaktivierung bei PNR-Grenze',
    effect: 'Fragmentarische Erinnerung an Geschehnisse während der maximalen Verwandlungsphase.',
    duration: 'Bis zu 24 Stunden'
  },

  // --- MAGISCH & ENERGETISCH ---
  {
    id: 'u-ene-1',
    name: 'Ressourcenzehrung der Kraftquelle',
    phase: 'während',
    severity: 'leicht',
    category: 'energetisch',
    trigger: 'Kontinuierlich während der Verwandlung',
    effect: 'Stetiger Verbrauch des zugewiesenen Vorrats zur Stabilisierung der übermenschlichen Körperform.',
    duration: 'Während Verwandlung aktiv'
  },
  {
    id: 'u-ene-2',
    name: 'Aura-Überhitzung & Astral-Resonanz',
    phase: 'während',
    severity: 'moderat',
    category: 'energetisch',
    trigger: 'Bei Intensität > 60%',
    effect: 'Sichtbares energetisches Flimmern um den Körper; statische Entladungen und Störungen im nahen Umfeld.',
    duration: 'Während Spitzenlast'
  },
  {
    id: 'u-ene-3',
    name: 'Magische & Psionische Kraftquellensperre',
    phase: 'nachwirkung',
    severity: 'schwer',
    category: 'energetisch',
    trigger: 'Nach vollständiger Entladung der Kraftquelle',
    effect: 'Temporäre Blockade aktiver Zauber, Psionik oder Spezialtechniken durch überlastete Energiekanäle.',
    duration: '1 bis 3 Stunden'
  },
  {
    id: 'u-ene-4',
    name: 'Instabile Resonanz-Nachwehen',
    phase: 'nachwirkung',
    severity: 'moderat',
    category: 'energetisch',
    trigger: 'Direkt nach Rückverwandlung',
    effect: 'Unkontrollierte Mikroschockwellen oder Funkenentladungen an den Fingerspitzen und um den Körper.',
    duration: '5 bis 10 Minuten'
  },

  // --- SENSORISCH & SINNE ---
  {
    id: 'u-sen-1',
    name: 'Sensorische Reizüberflutung & Lärmempfindlichkeit',
    phase: 'während',
    severity: 'leicht',
    category: 'sensorisch',
    trigger: 'Bei geschärften Sinnen',
    effect: 'Grelle Lichtquellen und laute Geräusche verursachen Desorientierung und stechende Schmerzen.',
    duration: 'Während Form aktiv'
  },
  {
    id: 'u-sen-2',
    name: 'Tunnelblick & Fokuseinengung',
    phase: 'während',
    severity: 'moderat',
    category: 'sensorisch',
    trigger: 'Bei Intensität > 65%',
    effect: 'Die periphere Wahrnehmung tritt zugunsten einer extremen Fixierung auf das primäre Ziel zurück.',
    duration: 'Während Hochstufe'
  },
  {
    id: 'u-sen-3',
    name: 'Sensorische Dämpfung & Sinnestrübung',
    phase: 'nachwirkung',
    severity: 'moderat',
    category: 'sensorisch',
    trigger: 'Nach Deaktivierung der Verwandlung',
    effect: 'Gedämpftes Seh- und Hörvermögen, verwaschene Kontraste in der normalen Umgebung.',
    duration: '10 bis 20 Minuten'
  },

  // --- POINT OF NO RETURN & IRREVERSIBLE RISIKEN ---
  {
    id: 'u-pnr-1',
    name: 'Morphische Fixierung & Gewebe-Arretierung',
    phase: 'risiko_pnr',
    severity: 'schwer',
    category: 'anatomisch',
    trigger: 'Bei Überschreiten des Point of No Return (≥ Schwelle)',
    effect: 'Veränderte Körpermaße, Muskeldichte und Gestaltmerkmale verhärten sich unumkehrbar in der Normalgestalt.',
    duration: 'Dauerhaft / Permanent'
  },
  {
    id: 'u-pnr-2',
    name: 'Irreversible Aurafixierung & Lichtresonanz',
    phase: 'risiko_pnr',
    severity: 'schwer',
    category: 'energetisch',
    trigger: 'Bei Überschreiten des Point of No Return (≥ Schwelle)',
    effect: 'Leuchtende Augen, Lichtauren oder Partikelkränze brennen sich permanent in die Standardform ein.',
    duration: 'Dauerhaft / Permanent'
  },
  {
    id: 'u-pnr-3',
    name: 'Permanente morphische Merkmale (Hörner / Schwingen)',
    phase: 'risiko_pnr',
    severity: 'schwer',
    category: 'anatomisch',
    trigger: 'Bei Überschreiten des Point of No Return (≥ Schwelle)',
    effect: 'Neu gebildete anatomische Strukturen wie Flügel, Schuppen oder Hörner bleiben physisch erhalten.',
    duration: 'Dauerhaft / Permanent'
  },
  {
    id: 'u-pnr-4',
    name: 'Vital-Kollaps & Koma',
    phase: 'risiko_pnr',
    severity: 'kritisch',
    category: 'physisch',
    trigger: 'Bei 100% Intensität & totaler Entleerung der Kraftquelle',
    effect: 'Vollständiger Bewusstseinsverlust mit Schockzustand des Nervensystems; akute Lebensgefahr ohne Rast.',
    duration: 'Mehrere Stunden bis Tage'
  },
  {
    id: 'u-pnr-5',
    name: 'Verlust der ursprünglichen Identität',
    phase: 'risiko_pnr',
    severity: 'kritisch',
    category: 'mental',
    trigger: 'Bei dauerhaftem Verweilen jenseits der PNR-Schwelle',
    effect: 'Das ursprüngliche Selbst und die Persönlichkeit werden dauerhaft vom Wesen der Verwandlung überlagert.',
    duration: 'Unumkehrbar'
  }
];

export interface DerivedCostResourceResult {
  resourceName: string;
  resourcePoolMax: number;
  resourcePoolCurrent: number;
  resourceUpkeepRate: number;
  powerSourceName: string;
  timeUnit: string;
  radarParamName?: string;
  sourceType: 'campaign_scale' | 'power_level' | 'saved' | 'default';
  campaignScaleValue?: number;
}

/**
 * Calculates the exact cost-resource pool (e.g. Ausdauer, MP, Psi) dynamically from:
 * 1. Macht & Werte (Kampagnen-Skala) / campaignPowerLevels (e.g. Technik: 2252, Ausdauer: 2252)
 * 2. World costResources definition (linked radar parameter, influence parameters)
 * 3. Character power sources & abilities
 */
export const deriveCostResourceFromCampaignScale = (
  player?: any,
  activeTransformation?: any,
  costResources?: any[],
  powerSource?: string,
  powerCost?: string,
  savedSettings?: SavedCardSettings
): DerivedCostResourceResult => {
  // 1. Power source name resolution
  const sourceName = powerSource ||
    activeTransformation?.source ||
    player?.powerSources?.[0]?.powerName ||
    player?.powerName ||
    player?.powerSource ||
    savedSettings?.powerSourceName ||
    'Kraftquelle';

  // 2. Identify explicit cost string from ability/props
  const rawCost = (powerCost || activeTransformation?.cost || '').trim();

  // 3. Extract power levels dictionary from character
  const powerLevels: Record<string, any> = player?.campaignPowerLevels || (player as any)?.details?.campaignPowerLevels || {};

  // 4. Find matching cost resource in world.costResources
  const resourcesList = Array.isArray(costResources) ? costResources : [];
  let foundRes: any = null;

  if (resourcesList.length > 0) {
    if (rawCost) {
      foundRes = resourcesList.find((r: any) => (r.name || '').toLowerCase() === rawCost.toLowerCase()) || null;
    }
    if (!foundRes) {
      // Prefer Ausdauer / Stamina / MP / Mana
      foundRes = resourcesList.find((r: any) => {
        const n = (r.name || '').toLowerCase();
        return n.includes('ausdauer') || n.includes('stamina') || n.includes('mana') || n.includes('mp') || n.includes('energie') || n.includes('psi') || n.includes('quirk');
      }) || resourcesList[0];
    }
  }

  // 5. Determine resource name
  let resName = foundRes?.name || '';
  if (!resName) {
    if (rawCost.toLowerCase().includes('ausdauer') || rawCost.toLowerCase().includes('stamina')) resName = 'Ausdauer';
    else if (rawCost.toLowerCase().includes('mana') || rawCost.toLowerCase().includes('mp')) resName = 'MP';
    else if (rawCost.toLowerCase().includes('psi')) resName = 'Psi';
    else if (rawCost.toLowerCase().includes('energie')) resName = 'Energie';
    else if (rawCost.toLowerCase().includes('chi') || rawCost.toLowerCase().includes('ki')) resName = 'Chi';
    else {
      const keys = Object.keys(powerLevels);
      const staminaKey = keys.find(k => k.toLowerCase().includes('ausdauer') || k.toLowerCase().includes('stamina'));
      if (staminaKey) resName = staminaKey;
      else if (keys.length > 0) resName = 'Ausdauer';
      else resName = savedSettings?.resourceName || 'Ausdauer';
    }
  }

  // 6. Calculate numeric value from Macht & Werte (Kampagnen-Skala)
  let calculatedMax: number | null = null;
  let calculatedCurrent: number | null = null;
  let matchedRadarName: string | undefined = undefined;

  // Case A: Assigned radar parameter from cost resource (e.g. radarPowerName = "Technik")
  if (foundRes?.radarPowerName && powerLevels[foundRes.radarPowerName] !== undefined) {
    const lvl = powerLevels[foundRes.radarPowerName];
    matchedRadarName = foundRes.radarPowerName;
    const numVal = typeof lvl === 'number' ? lvl : (lvl?.value ?? lvl?.potentialMax);
    if (typeof numVal === 'number' && !isNaN(numVal)) {
      calculatedMax = numVal;
      calculatedCurrent = numVal;
    }
  }

  // Case B: Direct match on resource name in campaignPowerLevels (e.g. "Ausdauer", "Technik", "Intelligenz", "Kraft")
  if (calculatedMax === null) {
    const directMatchKey = Object.keys(powerLevels).find(k => k.toLowerCase().trim() === resName.toLowerCase().trim());
    if (directMatchKey && powerLevels[directMatchKey] !== undefined) {
      const lvl = powerLevels[directMatchKey];
      matchedRadarName = directMatchKey;
      const numVal = typeof lvl === 'number' ? lvl : (lvl?.value ?? lvl?.potentialMax);
      if (typeof numVal === 'number' && !isNaN(numVal)) {
        calculatedMax = numVal;
        calculatedCurrent = numVal;
      }
    }
  }

  // Case C: Check influence parameters if defined on cost resource
  if (calculatedMax === null && foundRes?.influenceParameters && Array.isArray(foundRes.influenceParameters) && foundRes.influenceParameters.length > 0) {
    for (const param of foundRes.influenceParameters) {
      const matchK = Object.keys(powerLevels).find(k => k.toLowerCase().trim() === param.toLowerCase().trim());
      if (matchK && powerLevels[matchK] !== undefined) {
        const lvl = powerLevels[matchK];
        matchedRadarName = matchK;
        const numVal = typeof lvl === 'number' ? lvl : (lvl?.value ?? lvl?.potentialMax);
        if (typeof numVal === 'number' && !isNaN(numVal)) {
          calculatedMax = numVal;
          calculatedCurrent = numVal;
          break;
        }
      }
    }
  }

  // Case D: First non-zero campaignPowerLevel
  if (calculatedMax === null) {
    for (const [key, lvl] of Object.entries(powerLevels)) {
      const val = typeof lvl === 'number' ? lvl : lvl?.value;
      if (typeof val === 'number' && val > 0) {
        matchedRadarName = key;
        calculatedMax = val;
        calculatedCurrent = val;
        break;
      }
    }
  }

  // Case E: BaseMax from cost resource or saved settings
  let sourceType: 'campaign_scale' | 'power_level' | 'saved' | 'default' = 'default';
  if (calculatedMax !== null) {
    sourceType = 'campaign_scale';
  } else if (foundRes?.baseMax) {
    calculatedMax = foundRes.baseMax;
    calculatedCurrent = calculatedMax;
    sourceType = 'power_level';
  } else if (savedSettings?.resourcePoolMax) {
    calculatedMax = savedSettings.resourcePoolMax;
    calculatedCurrent = savedSettings.resourcePoolCurrent ?? calculatedMax;
    sourceType = 'saved';
  } else {
    calculatedMax = 100;
    calculatedCurrent = 100;
  }

  // 7. Parse upkeep rate
  let upkeep = savedSettings?.resourceUpkeepRate || 5;
  const costMatch = rawCost.match(/\d+(\.\d+)?/);
  if (costMatch) {
    const p = parseFloat(costMatch[0]);
    if (!isNaN(p) && p > 0) upkeep = p;
  }

  return {
    resourceName: resName,
    resourcePoolMax: calculatedMax,
    resourcePoolCurrent: calculatedCurrent ?? calculatedMax,
    resourceUpkeepRate: upkeep,
    powerSourceName: sourceName,
    timeUnit: savedSettings?.timeUnit || 'Min.',
    radarParamName: matchedRadarName,
    sourceType,
    campaignScaleValue: calculatedMax
  };
};

/**
 * Returns all available side effects (Universal + Form-Specific additions)
 */
export const getFormSideEffects = (
  activeTransformation?: any,
  pnrThreshold: number = 80,
  customSideEffects: TransformationSideEffect[] = []
): TransformationSideEffect[] => {
  const formName = (activeTransformation?.transformName || activeTransformation?.name || '').toLowerCase();
  const formDesc = (activeTransformation?.description || '').toLowerCase();
  const formRace = (activeTransformation?.transformRace || '').toLowerCase();

  const isEsper = formName.includes('esper') || formName.includes('psi') || formDesc.includes('esper') || formDesc.includes('psi') || formDesc.includes('telekin') || formDesc.includes('hoshiko');
  const isVampire = formName.includes('vampir') || formName.includes('blut') || formDesc.includes('vampir') || formDesc.includes('blut') || formRace.includes('vampir');
  const isDemonOrDark = formName.includes('dämon') || formName.includes('schatten') || formName.includes('finsternis') || formDesc.includes('dämon');
  const isBeast = formName.includes('bestie') || formName.includes('wolf') || formName.includes('tier') || formDesc.includes('bestie');
  const isElemental = formName.includes('feuer') || formName.includes('eis') || formName.includes('blitz') || formDesc.includes('elementar');

  const specificList: TransformationSideEffect[] = [];

  if (isEsper) {
    specificList.push(
      {
        id: 'se-esp-1',
        name: 'Psi-Ressourcenverbrauch & Synapsenbelastung',
        phase: 'während',
        severity: 'leicht',
        category: 'spezifisch',
        trigger: 'Kontinuierlich bei aktiver Form',
        effect: 'Konstanter Verbrauch der mentalen Kraftquelle. Erhöhte Reizempfindlichkeit gegenüber elektromagnetischen und telepathischen Feldern.',
        duration: 'Während Verwandlung aktiv',
        isFormSpecific: true
      },
      {
        id: 'se-esp-2',
        name: 'Telekinetische Resonanz-Aura',
        phase: 'während',
        severity: 'moderat',
        category: 'spezifisch',
        trigger: 'Bei Intensität > 50%',
        effect: 'Schwebende Gegenstände und feine Mikrovibrationen in 3m Umkreis; erhöht die Entdeckbarkeit durch sensible Wesen.',
        duration: 'Während aktiver Hochstufe',
        isFormSpecific: true
      },
      {
        id: 'se-esp-3',
        name: 'Psionischer Burnout & Synapsenpause',
        phase: 'nachwirkung',
        severity: 'moderat',
        category: 'spezifisch',
        trigger: 'Nach Deaktivierung der Verwandlung',
        effect: 'Körperliche Mattigkeit, pochender Stirnkopfschmerz und um 25% reduzierte Reaktionsschnelligkeit.',
        duration: '15 bis 30 Minuten',
        isFormSpecific: true
      }
    );
  }

  if (isVampire) {
    specificList.push(
      {
        id: 'se-vam-1',
        name: 'Gesteigerter Blut- und Vitae-Bedarf',
        phase: 'während',
        severity: 'moderat',
        category: 'spezifisch',
        trigger: 'Kontinuierlich während der Form',
        effect: 'Erhöhter Zehrungsdruck auf Lebenskraft- und Blutvorräte zur Stabilisierung des Raubtierinstinkts.',
        duration: 'Während Verwandlung aktiv',
        isFormSpecific: true
      },
      {
        id: 'se-vam-2',
        name: 'Akute Licht- und Sonnenempfindlichkeit',
        phase: 'während',
        severity: 'schwer',
        category: 'spezifisch',
        trigger: 'Bei Einwirkung von Tageslicht',
        effect: 'Empfindlicher Brennschmerz und Verlust der schnellen Zellregeneration unter Sonnenstrahlen.',
        duration: 'Sofort bei Lichteinfall',
        isFormSpecific: true
      },
      {
        id: 'se-vam-3',
        name: 'Vollständiger Verlust der sterblichen Gestalt',
        phase: 'risiko_pnr',
        severity: 'kritisch',
        category: 'spezifisch',
        trigger: `Bei Überschreiten des Point of No Return (≥ ${pnrThreshold}%)`,
        effect: 'Die vampirische Raubgestalt verdrängt die sterbliche Normalform dauerhaft und unumkehrbar.',
        duration: 'Permanent',
        isFormSpecific: true
      }
    );
  }

  if (isDemonOrDark || isBeast || isElemental) {
    specificList.push(
      {
        id: 'se-dem-1',
        name: 'Instinkt- und Wesensverschiebung',
        phase: 'während',
        severity: 'moderat',
        category: 'spezifisch',
        trigger: 'Bei Intensität > 50%',
        effect: 'Aggressivere Kampfbereitschaft und dominantes, raubtierhaftes Verhalten in sozialen Situationen.',
        duration: 'Während aktiver Hochstufe',
        isFormSpecific: true
      },
      {
        id: 'se-dem-2',
        name: 'Permanente morphische Manifestation',
        phase: 'risiko_pnr',
        severity: 'schwer',
        category: 'spezifisch',
        trigger: `Bei Überschreiten des Point of No Return (≥ ${pnrThreshold}%)`,
        effect: 'Anatomische Veränderungen wie Hornansätze, Schwingen oder Schuppen brennen sich fest in die Normalgestalt ein.',
        duration: 'Permanent',
        isFormSpecific: true
      }
    );
  }

  // Adjust universal PNR triggers with current threshold
  const adjustedUniversal = UNIVERSAL_SIDE_EFFECTS_CATALOG.map(se => {
    if (se.phase === 'risiko_pnr') {
      return {
        ...se,
        trigger: se.trigger.replace('≥ Schwelle', `≥ ${pnrThreshold}%`)
      };
    }
    return se;
  });

  return [
    ...specificList,
    ...adjustedUniversal,
    ...(Array.isArray(customSideEffects) ? customSideEffects.map(c => ({ ...c, isCustom: true })) : [])
  ];
};

/**
 * Provides sensible default active side effect IDs based on form context
 */
export const getDefaultActiveSideEffectIds = (activeTransformation?: any): string[] => {
  const formName = (activeTransformation?.transformName || activeTransformation?.name || '').toLowerCase();
  const formDesc = (activeTransformation?.description || '').toLowerCase();
  const formRace = (activeTransformation?.transformRace || '').toLowerCase();

  const isEsper = formName.includes('esper') || formName.includes('psi') || formDesc.includes('esper') || formDesc.includes('psi');
  const isVampire = formName.includes('vampir') || formName.includes('blut') || formDesc.includes('vampir') || formRace.includes('vampir');
  const isDemonOrDark = formName.includes('dämon') || formName.includes('schatten') || formName.includes('finsternis') || formDesc.includes('dämon');

  if (isEsper) {
    return ['se-esp-1', 'u-men-1', 'se-esp-3', 'u-pnr-2'];
  }
  if (isVampire) {
    return ['se-vam-1', 'se-vam-2', 'u-phy-4', 'se-vam-3'];
  }
  if (isDemonOrDark) {
    return ['se-dem-1', 'u-phy-1', 'u-phy-4', 'se-dem-2'];
  }

  // Standard recommended selection
  return ['u-phy-1', 'u-ene-1', 'u-phy-4', 'u-pnr-1'];
};

export const TransformationIntensityCard: React.FC<TransformationIntensityCardProps> = ({
  intensityVal,
  stageName,
  onUpdateIntensity,
  readOnly = false,
  className = '',
  compact = false,
  timeRateIncrease = 10,
  timeRateDecay = 20,
  timeUnitLabel = 'Min.',
  defaultPointOfNoReturn = 80,
  onUpdatePointOfNoReturn,
  activeTransformation,
  player,
  resolvedBody,
  powerSource,
  powerCost,
  costResources,
}) => {
  // Load saved settings
  const initialSettings = useMemo(() => getTransformationCardSettings(), []);

  // Derive power resource parameters dynamically from Macht & Werte (Kampagnen-Skala)
  const campaignResourceData = useMemo(() => {
    return deriveCostResourceFromCampaignScale(
      player,
      activeTransformation,
      costResources,
      powerSource,
      powerCost,
      initialSettings
    );
  }, [player, activeTransformation, costResources, powerSource, powerCost, initialSettings]);

  const [kraftStep, setKraftStep] = useState<number>(initialSettings.kraftStep);
  const [zeitStep, setZeitStep] = useState<number>(initialSettings.zeitStep || timeRateIncrease);
  const [abklingenStep, setAbklingenStep] = useState<number>(initialSettings.abklingenStep || timeRateDecay);
  const [timeUnit, setTimeUnit] = useState<string>(initialSettings.timeUnit || timeUnitLabel);
  const [pnrThreshold, setPnrThreshold] = useState<number>(initialSettings.pnrThreshold || defaultPointOfNoReturn);

  // Resource pool & power source state (initialized from Macht & Werte Kampagnen-Skala)
  const [resourcePoolMax, setResourcePoolMax] = useState<number>(() => campaignResourceData.resourcePoolMax);
  const [resourcePoolCurrent, setResourcePoolCurrent] = useState<number>(() => campaignResourceData.resourcePoolCurrent);
  const [resourceUpkeepRate, setResourceUpkeepRate] = useState<number>(() => campaignResourceData.resourceUpkeepRate);
  const [resourceName, setResourceName] = useState<string>(() => campaignResourceData.resourceName);
  const [customPowerSourceName, setCustomPowerSourceName] = useState<string>(() => campaignResourceData.powerSourceName);

  // Inputs for free text editing
  const [pnrInput, setPnrInput] = useState<string>(() => formatNum(pnrThreshold));
  const [kraftInput, setKraftInput] = useState<string>(() => formatNum(kraftStep));
  const [zeitInput, setZeitInput] = useState<string>(() => formatNum(zeitStep));
  const [abklingenInput, setAbklingenInput] = useState<string>(() => formatNum(abklingenStep));
  const [intensityInput, setIntensityInput] = useState<string>(formatNum(intensityVal));
  const [resMaxInput, setResMaxInput] = useState<string>(() => formatNum(campaignResourceData.resourcePoolMax));
  const [resCurrentInput, setResCurrentInput] = useState<string>(() => formatNum(campaignResourceData.resourcePoolCurrent));
  const [resUpkeepInput, setResUpkeepInput] = useState<string>(() => formatNum(campaignResourceData.resourceUpkeepRate));

  // Sync resource states when campaign power scale or active form changes
  useEffect(() => {
    setResourcePoolMax(campaignResourceData.resourcePoolMax);
    setResourcePoolCurrent(campaignResourceData.resourcePoolCurrent);
    setResMaxInput(formatNum(campaignResourceData.resourcePoolMax));
    setResCurrentInput(formatNum(campaignResourceData.resourcePoolCurrent));
    setResourceName(campaignResourceData.resourceName);
    setCustomPowerSourceName(campaignResourceData.powerSourceName);
    setResourceUpkeepRate(campaignResourceData.resourceUpkeepRate);
    setResUpkeepInput(formatNum(campaignResourceData.resourceUpkeepRate));
  }, [
    campaignResourceData.resourcePoolMax,
    campaignResourceData.resourcePoolCurrent,
    campaignResourceData.resourceName,
    campaignResourceData.powerSourceName,
    campaignResourceData.resourceUpkeepRate
  ]);

  // Simulation timer state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simMode, setSimMode] = useState<'increase' | 'decrease'>('increase');

  // Toggle for configuration panel
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Active view tab: 'uebersicht' | 'ressource' | 'koerper' | 'nebenwirkungen' | 'stufe'
  const [activeTab, setActiveTab] = useState<'uebersicht' | 'ressource' | 'koerper' | 'nebenwirkungen' | 'stufe'>('uebersicht');

  // Side effects selection & custom side effects
  const [activeSideEffectIds, setActiveSideEffectIds] = useState<string[]>(() => {
    if (initialSettings.activeSideEffectIds && initialSettings.activeSideEffectIds.length > 0) {
      return initialSettings.activeSideEffectIds;
    }
    return getDefaultActiveSideEffectIds(activeTransformation);
  });

  const [customSideEffects, setCustomSideEffects] = useState<TransformationSideEffect[]>(() => {
    return initialSettings.customSideEffects || [];
  });

  // Side effects list filters & search
  const [sideEffectFilter, setSideEffectFilter] = useState<'alle' | 'während' | 'nachwirkung' | 'risiko_pnr'>('alle');
  const [sideEffectStatusFilter, setSideEffectStatusFilter] = useState<'alle' | 'aktiv' | 'inaktiv'>('alle');
  const [sideEffectCategoryFilter, setSideEffectCategoryFilter] = useState<'alle' | SideEffectCategory>('alle');
  const [sideEffectSearchQuery, setSideEffectSearchQuery] = useState<string>('');

  // Side effect creation / editing state
  const [isCreatingSideEffect, setIsCreatingSideEffect] = useState<boolean>(false);
  const [editingSideEffectId, setEditingSideEffectId] = useState<string | null>(null);

  const [formSeName, setFormSeName] = useState<string>('');
  const [formSePhase, setFormSePhase] = useState<SideEffectPhase>('während');
  const [formSeCategory, setFormSeCategory] = useState<SideEffectCategory>('physisch');
  const [formSeSeverity, setFormSeSeverity] = useState<SideEffectSeverity>('moderat');
  const [formSeTrigger, setFormSeTrigger] = useState<string>('');
  const [formSeDuration, setFormSeDuration] = useState<string>('');
  const [formSeEffect, setFormSeEffect] = useState<string>('');

  // Calculations for transformation duration
  const maxDurationUnits = resourceUpkeepRate > 0 ? resourcePoolMax / resourceUpkeepRate : Infinity;
  const currentRemainingDurationUnits = resourceUpkeepRate > 0 ? resourcePoolCurrent / resourceUpkeepRate : Infinity;

  const formattedMaxDuration = formatDuration(maxDurationUnits, timeUnit);
  const formattedRemainingDuration = formatDuration(currentRemainingDurationUnits, timeUnit);

  const resourcePercentage = Math.min(100, Math.max(0, Math.round((resourcePoolCurrent / (resourcePoolMax || 1)) * 100)));
  const isPastPNR = intensityVal >= pnrThreshold;

  // Time calculations to Point of No Return & Abklingen
  const remainingToPNR = Math.max(0, pnrThreshold - intensityVal);
  const pnrDurationVal = zeitStep > 0 ? remainingToPNR / zeitStep : Infinity;
  const zeroDurationVal = abklingenStep > 0 ? intensityVal / abklingenStep : Infinity;

  const timeToPNRFormatted = isPastPNR
    ? 'Erreicht (Irreversibel)'
    : pnrDurationVal === Infinity
    ? 'Unbegrenzt'
    : formatDuration(pnrDurationVal, timeUnit);

  const timeToZeroFormatted = isPastPNR
    ? 'Kein Abklingen möglich'
    : intensityVal === 0
    ? `0 ${timeUnit} (Vollständig normal)`
    : zeroDurationVal === Infinity
    ? 'Unbegrenzt'
    : formatDuration(zeroDurationVal, timeUnit);

  // Synchronize inputs when intensity prop changes
  useEffect(() => {
    setIntensityInput(formatNum(intensityVal));
  }, [intensityVal]);

  // Persist settings
  useEffect(() => {
    try {
      const dataToSave: SavedCardSettings = {
        pnrThreshold,
        kraftStep,
        zeitStep,
        abklingenStep,
        timeUnit,
        resourcePoolMax,
        resourcePoolCurrent,
        resourceUpkeepRate,
        resourceName,
        powerSourceName: customPowerSourceName,
        activeSideEffectIds,
        customSideEffects,
      };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {}
  }, [
    pnrThreshold,
    kraftStep,
    zeitStep,
    abklingenStep,
    timeUnit,
    resourcePoolMax,
    resourcePoolCurrent,
    resourceUpkeepRate,
    resourceName,
    customPowerSourceName,
    activeSideEffectIds,
    customSideEffects,
  ]);

  // Auto-simulation interval
  useEffect(() => {
    if (!isSimulating || readOnly) return;
    const interval = setInterval(() => {
      if (simMode === 'increase') {
        if (intensityVal >= 100) {
          setIsSimulating(false);
          return;
        }
        const next = Math.min(100, intensityVal + zeitStep);
        onUpdateIntensity(Math.round(next * 100) / 100);

        // Also drain resource pool synchronously
        setResourcePoolCurrent(prev => {
          const nextRes = Math.max(0, prev - resourceUpkeepRate);
          setResCurrentInput(formatNum(nextRes));
          return nextRes;
        });
      } else {
        if (intensityVal <= 0 || intensityVal >= pnrThreshold) {
          setIsSimulating(false);
          return;
        }
        const next = Math.max(0, intensityVal - abklingenStep);
        onUpdateIntensity(Math.round(next * 100) / 100);

        // Also slowly restore resource pool on recovery
        setResourcePoolCurrent(prev => {
          const nextRes = Math.min(resourcePoolMax, prev + (resourceUpkeepRate * 0.5));
          setResCurrentInput(formatNum(nextRes));
          return nextRes;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulating, simMode, intensityVal, zeitStep, abklingenStep, pnrThreshold, readOnly, onUpdateIntensity, resourceUpkeepRate, resourcePoolMax]);

  const handleTimeStepForward = (units: number) => {
    if (readOnly) return;
    const delta = units * zeitStep;
    const nextVal = Math.min(100, Math.max(0, intensityVal + delta));
    onUpdateIntensity(Math.round(nextVal * 100) / 100);

    const costDelta = units * resourceUpkeepRate;
    setResourcePoolCurrent(prev => {
      const nextRes = Math.max(0, prev - costDelta);
      setResCurrentInput(formatNum(nextRes));
      return nextRes;
    });
  };

  const handleTimeStepBackward = (units: number) => {
    if (readOnly || isPastPNR) return;
    const delta = units * abklingenStep;
    const nextVal = Math.min(100, Math.max(0, intensityVal - delta));
    onUpdateIntensity(Math.round(nextVal * 100) / 100);
  };

  const handlePnrChange = (newPnr: number) => {
    const clamped = Math.max(0.01, Math.min(100, newPnr));
    const rounded = Math.round(clamped * 100) / 100;
    setPnrThreshold(rounded);
    if (onUpdatePointOfNoReturn) {
      onUpdatePointOfNoReturn(rounded);
    }
  };

  const handleIncrease = (step: number) => {
    if (readOnly) return;
    const nextVal = Math.min(100, Math.max(0, intensityVal + step));
    onUpdateIntensity(Math.round(nextVal * 100) / 100);
  };

  const handleDecrease = (step: number) => {
    if (readOnly) return;
    const nextVal = Math.min(100, Math.max(0, intensityVal - step));
    onUpdateIntensity(Math.round(nextVal * 100) / 100);
  };

  const handleReset = () => {
    if (readOnly) return;
    onUpdateIntensity(0);
  };

  const handleDirectInput = (valStr: string) => {
    if (readOnly) return;
    setIntensityInput(valStr);
    const normalized = valStr.trim().replace(',', '.');
    if (normalized === '' || normalized === '.' || normalized === ',') return;
    const parsed = parseFloat(normalized);
    if (isNaN(parsed)) return;
    const clamped = Math.min(100, Math.max(0, parsed));
    onUpdateIntensity(Math.round(clamped * 100) / 100);
  };

  // Compile physical changes breakdown between Standard form and Active form
  const physicalChanges = useMemo(() => {
    const stdApp = resolvedBody || player?.appearance || {};
    const trans = activeTransformation || {};

    // Standard properties
    const stdHeight = resolvedBody?.standardHeightCm || parseDecimal(stdApp.height) || 168;
    const stdWeight = resolvedBody?.standardWeightKg || parseDecimal(stdApp.weight) || 60;
    const stdFat = resolvedBody?.standardBodyFat || parseDecimal(stdApp.bodyFat) || 22;
    const stdMuscle = resolvedBody?.standardMuscleMass || parseDecimal(stdApp.muscleMass) || 30;
    const stdCup = resolvedBody?.standardCupSize || stdApp.cupSize || '-';
    const stdBuild = resolvedBody?.standardBuild || stdApp.build || 'Schlank';
    const stdHair = resolvedBody?.standardHairColor || stdApp.hairColor || 'Dunkelbraun';
    const stdEyes = resolvedBody?.standardEyeColor || stdApp.eyeColor || 'Braun';
    const stdSkin = resolvedBody?.standardSkinTone || stdApp.skinTone || 'Natürlich';
    const stdRace = resolvedBody?.standardRace || stdApp.race || 'Mensch';
    const stdMeasurements = resolvedBody?.standardMeasurements || stdApp.measurements || '86-62-90 cm';

    // Target/Effective Form properties
    const effHeight = resolvedBody?.effectiveHeightCm || parseDecimal(trans.transformHeight) || stdHeight;
    const effWeight = resolvedBody?.effectiveWeightKg || parseDecimal(trans.transformWeight) || stdWeight;
    const effFat = resolvedBody?.effectiveBodyFat || parseDecimal(trans.transformBodyFat) || stdFat;
    const effMuscle = resolvedBody?.effectiveMuscleMass || parseDecimal(trans.transformMuscleMass) || stdMuscle;
    const effCup = resolvedBody?.effectiveCupSize || trans.transformCupSize || stdCup;
    const effBuild = resolvedBody?.effectiveBuild || trans.transformBuild || stdBuild;
    const effHair = resolvedBody?.effectiveHairColor || trans.transformHairColor || stdHair;
    const effEyes = resolvedBody?.effectiveEyeColor || trans.transformEyeColor || stdEyes;
    const effSkin = resolvedBody?.effectiveSkinTone || trans.transformSkinTone || stdSkin;
    const effRace = resolvedBody?.effectiveRace || trans.transformRace || stdRace;
    const effMeasurements = resolvedBody?.effectiveMeasurements || trans.transformMeasurements || stdMeasurements;

    const diffHeight = effHeight - stdHeight;
    const diffWeight = effWeight - stdWeight;
    const diffFat = effFat - stdFat;
    const diffMuscle = effMuscle - stdMuscle;

    const hasWings = Boolean(trans.transformWings || resolvedBody?.effectiveWings);
    const hasHorns = Boolean(trans.transformHorns || resolvedBody?.effectiveHorns);
    const hasHeterochromia = Boolean(trans.transformHasHeterochromia || resolvedBody?.effectiveHasHeterochromia);

    const items: {
      category: string;
      label: string;
      standardVal: string;
      activeVal: string;
      deltaText?: string;
      isChanged: boolean;
      manifestationStage: string;
    }[] = [
      {
        category: 'Statur & Größe',
        label: 'Körpergröße',
        standardVal: `${stdHeight} cm`,
        activeVal: `${effHeight} cm`,
        deltaText: diffHeight !== 0 ? `${diffHeight > 0 ? '+' : ''}${diffHeight} cm` : undefined,
        isChanged: diffHeight !== 0,
        manifestationStage: 'Ab 15% Verwandlung'
      },
      {
        category: 'Statur & Größe',
        label: 'Körperbau / Statur',
        standardVal: stdBuild,
        activeVal: effBuild,
        isChanged: stdBuild.toLowerCase() !== effBuild.toLowerCase(),
        manifestationStage: 'Ab 35% Verwandlung'
      },
      {
        category: 'Statur & Größe',
        label: 'Spezies / Rasse',
        standardVal: stdRace,
        activeVal: effRace,
        isChanged: stdRace.toLowerCase() !== effRace.toLowerCase(),
        manifestationStage: 'Ab 60% Verwandlung'
      },
      {
        category: 'Proportionen & Maße',
        label: 'Körbchengröße',
        standardVal: stdCup,
        activeVal: effCup,
        isChanged: stdCup.toUpperCase() !== effCup.toUpperCase(),
        manifestationStage: 'Ab 35% Verwandlung'
      },
      {
        category: 'Proportionen & Maße',
        label: 'Körpermaße (Brust-Taille-Hüfte)',
        standardVal: stdMeasurements,
        activeVal: effMeasurements,
        isChanged: stdMeasurements !== effMeasurements,
        manifestationStage: 'Ab 30% Verwandlung'
      },
      {
        category: 'Proportionen & Maße',
        label: 'Gewicht & Zusammensetzung',
        standardVal: `${stdWeight} kg (KFA ${stdFat}%, Muskeln ${stdMuscle}%)`,
        activeVal: `${effWeight} kg (KFA ${effFat}%, Muskeln ${effMuscle}%)`,
        deltaText: `${diffWeight !== 0 ? `${diffWeight > 0 ? '+' : ''}${diffWeight} kg` : ''} ${diffMuscle !== 0 ? `| Muskeln ${diffMuscle > 0 ? '+' : ''}${diffMuscle}%` : ''}`,
        isChanged: diffWeight !== 0 || diffFat !== 0 || diffMuscle !== 0,
        manifestationStage: 'Ab 20% Verwandlung'
      },
      {
        category: 'Farben & Sinnesmerkmale',
        label: 'Haarfarbe & Haarstruktur',
        standardVal: stdHair,
        activeVal: effHair,
        isChanged: stdHair.toLowerCase() !== effHair.toLowerCase(),
        manifestationStage: 'Ab 15% Verwandlung'
      },
      {
        category: 'Farben & Sinnesmerkmale',
        label: 'Augenfarbe & Iris',
        standardVal: stdEyes,
        activeVal: hasHeterochromia && resolvedBody?.effectiveEyeColorLeft && resolvedBody?.effectiveEyeColorRight
          ? `Heterochromie (${resolvedBody.effectiveEyeColorLeft} / ${resolvedBody.effectiveEyeColorRight})`
          : effEyes,
        isChanged: stdEyes.toLowerCase() !== effEyes.toLowerCase() || hasHeterochromia,
        manifestationStage: 'Ab 20% Verwandlung'
      },
      {
        category: 'Farben & Sinnesmerkmale',
        label: 'Hautton & Teint',
        standardVal: stdSkin,
        activeVal: effSkin,
        isChanged: stdSkin.toLowerCase() !== effSkin.toLowerCase(),
        manifestationStage: 'Ab 25% Verwandlung'
      },
      {
        category: 'Besondere Gestaltmerkmale',
        label: 'Flügel & Schwebestruktur',
        standardVal: 'Keine Flügel',
        activeVal: hasWings ? 'Flügel aktiv am Rücken' : 'Keine Flügel',
        isChanged: hasWings,
        manifestationStage: 'Ab 25% Verwandlung'
      },
      {
        category: 'Besondere Gestaltmerkmale',
        label: 'Hörner & Scheitelstrukturen',
        standardVal: 'Keine Hörner',
        activeVal: hasHorns ? 'Hörner sichtbar' : 'Keine Hörner',
        isChanged: hasHorns,
        manifestationStage: 'Ab 25% Verwandlung'
      },
      {
        category: 'Besondere Gestaltmerkmale',
        label: 'Aussehen & Gestaltmerkmale',
        standardVal: 'Menschliche Normalgestalt',
        activeVal: trans.transformLooks || trans.transformRaceFeatures || 'Spezifische Verwandlungsmerkmale aktiv',
        isChanged: Boolean(trans.transformLooks || trans.transformRaceFeatures),
        manifestationStage: 'Voll ausgeprägt bei 100%'
      }
    ];

    return items;
  }, [resolvedBody, player?.appearance, activeTransformation]);

  // Handlers for Side Effects customization
  const handleToggleSideEffect = (id: string) => {
    if (readOnly) return;
    setActiveSideEffectIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllSideEffects = () => {
    if (readOnly) return;
    const allIds = sideEffectsList.map(se => se.id);
    setActiveSideEffectIds(Array.from(new Set([...activeSideEffectIds, ...allIds])));
  };

  const handleDeselectAllSideEffects = () => {
    if (readOnly) return;
    setActiveSideEffectIds([]);
  };

  const handleResetToDefaultSideEffects = () => {
    if (readOnly) return;
    setActiveSideEffectIds(getDefaultActiveSideEffectIds(activeTransformation));
  };

  const handleStartCreateSideEffect = () => {
    setEditingSideEffectId(null);
    setFormSeName('');
    setFormSePhase('während');
    setFormSeCategory('physisch');
    setFormSeSeverity('moderat');
    setFormSeTrigger('Bei aktiver Verwandlung');
    setFormSeDuration('Während Form aktiv');
    setFormSeEffect('');
    setIsCreatingSideEffect(true);
  };

  const handleStartEditSideEffect = (se: TransformationSideEffect) => {
    setEditingSideEffectId(se.id);
    setFormSeName(se.name);
    setFormSePhase(se.phase);
    setFormSeCategory(se.category || 'physisch');
    setFormSeSeverity(se.severity);
    setFormSeTrigger(se.trigger);
    setFormSeDuration(se.duration || '');
    setFormSeEffect(se.effect);
    setIsCreatingSideEffect(true);
  };

  const handleCancelEditSideEffect = () => {
    setIsCreatingSideEffect(false);
    setEditingSideEffectId(null);
  };

  const handleSaveSideEffect = () => {
    if (!formSeName.trim() || !formSeEffect.trim()) return;

    if (editingSideEffectId) {
      const isExistingCustom = customSideEffects.some(se => se.id === editingSideEffectId);
      if (isExistingCustom) {
        setCustomSideEffects(prev =>
          prev.map(se =>
            se.id === editingSideEffectId
              ? {
                  ...se,
                  name: formSeName.trim(),
                  phase: formSePhase,
                  category: formSeCategory,
                  severity: formSeSeverity,
                  trigger: formSeTrigger.trim() || 'Bei Verwandlung',
                  duration: formSeDuration.trim() || 'Während Form aktiv',
                  effect: formSeEffect.trim(),
                }
              : se
          )
        );
      } else {
        const newCustomEntry: TransformationSideEffect = {
          id: editingSideEffectId,
          name: formSeName.trim(),
          phase: formSePhase,
          category: formSeCategory,
          severity: formSeSeverity,
          trigger: formSeTrigger.trim() || 'Bei Verwandlung',
          duration: formSeDuration.trim() || 'Während Form aktiv',
          effect: formSeEffect.trim(),
          isCustom: true,
        };
        setCustomSideEffects(prev => [...prev.filter(se => se.id !== editingSideEffectId), newCustomEntry]);
      }
    } else {
      const newId = `custom-se-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newEntry: TransformationSideEffect = {
        id: newId,
        name: formSeName.trim(),
        phase: formSePhase,
        category: formSeCategory,
        severity: formSeSeverity,
        trigger: formSeTrigger.trim() || 'Bei aktiver Verwandlung',
        duration: formSeDuration.trim() || 'Während Form aktiv',
        effect: formSeEffect.trim(),
        isCustom: true,
      };
      setCustomSideEffects(prev => [newEntry, ...prev]);
      setActiveSideEffectIds(prev => [...prev, newId]);
    }

    setIsCreatingSideEffect(false);
    setEditingSideEffectId(null);
  };

  const handleDeleteCustomSideEffect = (id: string) => {
    if (readOnly) return;
    setCustomSideEffects(prev => prev.filter(se => se.id !== id));
    setActiveSideEffectIds(prev => prev.filter(itemId => itemId !== id));
    if (editingSideEffectId === id) {
      setIsCreatingSideEffect(false);
      setEditingSideEffectId(null);
    }
  };

  // Compile side effects list (integrates specific, universal catalog, and custom effects)
  const sideEffectsList = useMemo(() => {
    return getFormSideEffects(activeTransformation, pnrThreshold, customSideEffects);
  }, [activeTransformation, pnrThreshold, customSideEffects]);

  const countPhaseWahrend = useMemo(() => sideEffectsList.filter(s => s.phase === 'während').length, [sideEffectsList]);
  const countPhaseNachwirkung = useMemo(() => sideEffectsList.filter(s => s.phase === 'nachwirkung').length, [sideEffectsList]);
  const countPhasePnr = useMemo(() => sideEffectsList.filter(s => s.phase === 'risiko_pnr').length, [sideEffectsList]);

  const filteredSideEffects = useMemo(() => {
    return sideEffectsList.filter(se => {
      const isActive = activeSideEffectIds.includes(se.id);
      if (sideEffectStatusFilter === 'aktiv' && !isActive) return false;
      if (sideEffectStatusFilter === 'inaktiv' && isActive) return false;
      if (sideEffectFilter !== 'alle' && se.phase !== sideEffectFilter) return false;
      if (sideEffectCategoryFilter !== 'alle' && (se.category || 'physisch') !== sideEffectCategoryFilter) return false;
      if (sideEffectSearchQuery.trim()) {
        const q = sideEffectSearchQuery.toLowerCase();
        const matchName = se.name.toLowerCase().includes(q);
        const matchEffect = se.effect.toLowerCase().includes(q);
        const matchTrigger = se.trigger.toLowerCase().includes(q);
        const matchDur = (se.duration || '').toLowerCase().includes(q);
        if (!matchName && !matchEffect && !matchTrigger && !matchDur) return false;
      }
      return true;
    });
  }, [sideEffectsList, activeSideEffectIds, sideEffectStatusFilter, sideEffectFilter, sideEffectCategoryFilter, sideEffectSearchQuery]);

  return (
    <div className={`bg-slate-950/90 p-4 rounded-2xl border ${isPastPNR ? 'border-red-500/60 shadow-red-950/30' : 'border-amber-500/30'} space-y-3.5 shadow-xl backdrop-blur-sm ${className}`}>
      {/* HEADER SECTION WITH TABS & QUICK CONTROLS */}
      <div className="flex flex-col gap-2.5 pb-2 border-b border-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <i className={`fa-solid ${isPastPNR ? 'fa-triangle-exclamation text-red-400' : 'fa-bolt text-amber-400'} text-sm`}></i>
            <div>
              <span className="text-xs font-bold text-amber-300 tracking-wide block">
                Verwandlungs-Simulation & Gestaltstatus
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {stageName || 'Aktive Verwandlung'} • {formatNum(intensityVal)}% Intensität
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            {!readOnly && (
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                  showSettings
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300 hover:border-slate-700'
                }`}
                title="Ressourcen, Kraftquelle & PNR-Werte konfigurieren"
              >
                <i className="fa-solid fa-sliders"></i>
              </button>
            )}

            <div className="flex items-center bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-0.5 gap-1">
              <input
                type="text"
                inputMode="decimal"
                disabled={readOnly}
                value={intensityInput}
                onChange={(e) => handleDirectInput(e.target.value)}
                onBlur={() => {
                  const parsed = parseDecimal(intensityInput);
                  const clamped = Math.min(100, Math.max(0, parsed));
                  const rounded = Math.round(clamped * 100) / 100;
                  setIntensityInput(formatNum(rounded));
                  onUpdateIntensity(rounded);
                }}
                className={`w-12 bg-transparent text-xs font-mono font-bold text-right outline-none transition-all ${isPastPNR ? 'text-red-400' : 'text-amber-400'}`}
                title="Klicken oder tippen, um exakte Intensität (0-100%) einzustellen"
              />
              <span className="text-[10px] font-bold text-amber-400/80 pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE SUB-NAVIGATION TABS */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs font-medium gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('uebersicht')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'uebersicht' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-gauge-high text-xs"></i>
            <span>Übersicht</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ressource')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ressource' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-battery-three-quarters text-xs"></i>
            <span>Dauer & Kraftquelle</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('koerper')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'koerper' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-person text-xs"></i>
            <span>Körper-Änderungen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nebenwirkungen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'nebenwirkungen' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-triangle-exclamation text-xs"></i>
            <span>Nebenwirkungen & Risiken</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stufe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'stufe' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-sliders text-xs"></i>
            <span>Stufe & PNR</span>
          </button>
        </div>
      </div>

      {/* POINT OF NO RETURN BANNER IF TRIGGERED */}
      {isPastPNR && (
        <div className="bg-red-950/80 border border-red-500/60 p-2.5 rounded-xl flex items-center justify-between text-red-200 text-xs shadow-lg animate-pulse">
          <div className="flex items-center gap-2 font-bold">
            <i className="fa-solid fa-triangle-exclamation text-red-400 text-base shrink-0"></i>
            <span>Point of No Return ({formatNum(pnrThreshold)}%) überschritten! Diese Verwandlungsmerkmale sind dauerhaft in die Standardgestalt übergegangen.</span>
          </div>
          <span className="font-mono bg-red-900/60 px-2 py-0.5 rounded border border-red-500/40 font-black text-white shrink-0">
            {formatNum(intensityVal)}%
          </span>
        </div>
      )}

      {/* TAB 1: ÜBERSICHT (DASHBOARD) */}
      {activeTab === 'uebersicht' && (
        <div className="space-y-3">
          {/* TOP KEY METRICS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* CARD 1: VERWANDLUNGSDAUER AUF BASIS DER KRAFTQUELLE */}
            <div className="bg-slate-900/70 border border-amber-500/30 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-hourglass-half text-amber-400"></i>
                  <span>Verwandlungsdauer</span>
                </span>
                <span className="font-mono text-slate-400 font-bold">Limit</span>
              </div>
              <div className="text-sm font-black font-mono text-amber-300">
                {formattedRemainingDuration}
              </div>
              <p className="text-[9.5px] text-slate-400 leading-tight">
                Verbleibend bei aktuellem Vorrat ({formatNum(resourcePoolCurrent)} {resourceName}) und {formatNum(resourceUpkeepRate)} {resourceName}/{timeUnit} Verbrauch.
              </p>
            </div>

            {/* CARD 2: KRAFTQUELLE & VORRAT */}
            <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-sky-400 font-extrabold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-battery-half text-sky-400"></i>
                  <span>Kraftquelle & Vorrat</span>
                </span>
                <span className="font-mono text-sky-300 font-bold">{resourcePercentage}%</span>
              </div>
              <div className="text-sm font-black font-mono text-slate-100 flex items-center justify-between">
                <span>{customPowerSourceName}</span>
                <span className="text-xs text-sky-300 font-bold">{formatNum(resourcePoolCurrent)} / {formatNum(resourcePoolMax)} {resourceName}</span>
              </div>
              {/* Mini Resource Bar */}
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-300 ${resourcePercentage > 30 ? 'bg-sky-500' : 'bg-red-500'}`}
                  style={{ width: `${resourcePercentage}%` }}
                />
              </div>
            </div>

            {/* CARD 3: POINT OF NO RETURN STATUS */}
            <div className={`p-3 rounded-xl space-y-1.5 border ${isPastPNR ? 'bg-red-950/40 border-red-500/50' : 'bg-slate-900/70 border-slate-800'}`}>
              <div className="flex items-center justify-between text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-flag text-orange-400"></i>
                  <span>Point of No Return</span>
                </span>
                <span className="font-mono text-orange-300 font-bold">{formatNum(pnrThreshold)}%</span>
              </div>
              <div className={`text-sm font-black font-mono ${isPastPNR ? 'text-red-300' : 'text-orange-200'}`}>
                {timeToPNRFormatted}
              </div>
              <p className="text-[9.5px] text-slate-400 leading-tight">
                {isPastPNR ? 'Schwelle überschritten – dauerhafte Formverankerung.' : `Zeit bis zum Erreichen der irreversiblen Metamorphose (+${formatNum(zeitStep)}%/${timeUnit}).`}
              </p>
            </div>
          </div>

          {/* MAIN INTENSITY BAR */}
          <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-[10.5px]">
              <span className="text-slate-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-layer-group text-amber-400"></i>
                <span>Verwandlungsstufe & Ausprägungsgrad</span>
              </span>
              <span className="font-bold text-amber-300">
                {stageName || 'Standard'} ({formatNum(intensityVal)}%)
              </span>
            </div>

            <div className="space-y-1">
              <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative shadow-inner">
                <div
                  className={`h-full transition-all duration-300 ${
                    isPastPNR
                      ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, intensityVal))}%` }}
                />
                {/* PNR Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                  style={{ left: `${pnrThreshold}%` }}
                  title={`Point of No Return: ${formatNum(pnrThreshold)}%`}
                >
                  <div className="absolute -top-1 -translate-x-1/2 bg-red-600 text-[8px] font-mono font-black text-white px-1 rounded-sm uppercase tracking-tighter shadow">
                    PNR
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-0.5">
                <span>0% (Standard)</span>
                <span className="text-red-400 font-bold">Point of No Return: {formatNum(pnrThreshold)}%</span>
                <span>100% (Maximum)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAUER & KRAFTQUELLE (RESSOURCENBERECHNUNG) */}
      {activeTab === 'ressource' && (
        <div className="space-y-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-battery-three-quarters text-amber-400"></i>
                <span>Kosten-Ressourcen, Kraftquelle & Zeitdauer</span>
              </span>
              {campaignResourceData.radarParamName && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  Macht & Werte: {campaignResourceData.radarParamName} ({formatNum(resourcePoolMax)} {resourceName})
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Verbrauch: {formatNum(resourceUpkeepRate)} {resourceName} / {timeUnit}
            </span>
          </div>

          {/* DURATION BREAKDOWN GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Verbleibende Verwandlungszeit
                </span>
                <span className="text-xs font-mono font-black text-amber-400">
                  {formatNum(resourcePoolCurrent)} {resourceName}
                </span>
              </div>
              <div className="text-lg font-mono font-black text-amber-300">
                {formattedRemainingDuration}
              </div>
              <p className="text-[9.5px] text-slate-400">
                Berechnet aus dem aktuellen Vorrat von {formatNum(resourcePoolCurrent)} {resourceName} geteilt durch den Erhaltungsverbrauch von {formatNum(resourceUpkeepRate)} {resourceName}/{timeUnit}.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Maximale Dauer (bei 100% Vorrat)
                </span>
                <span className="text-xs font-mono font-black text-sky-400">
                  {formatNum(resourcePoolMax)} {resourceName}
                </span>
              </div>
              <div className="text-lg font-mono font-black text-sky-300">
                {formattedMaxDuration}
              </div>
              <p className="text-[9.5px] text-slate-400">
                Maximale Zeitspanne aus Kampagnen-Skala ({formatNum(resourcePoolMax)} {resourceName}), die die Gestalt ohne Unterbrechung aufrechterhalten werden kann.
              </p>
            </div>
          </div>

          {/* RESOURCE STATUS DETAILS */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10.5px]">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <i className="fa-solid fa-atom text-amber-400"></i>
                <span>Zugrunde liegende Kraftquelle:</span>
                <span className="text-amber-300 font-black">{customPowerSourceName}</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">
                Vorrat: {formatNum(resourcePoolCurrent)} / {formatNum(resourcePoolMax)} {resourceName} ({resourcePercentage}%)
              </span>
            </div>

            {/* Visual Resource Bar */}
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
              <div
                className={`h-full transition-all duration-300 ${resourcePercentage > 40 ? 'bg-gradient-to-r from-sky-500 to-indigo-500' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}
                style={{ width: `${resourcePercentage}%` }}
              />
            </div>

            {!readOnly && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[9.5px]">
                <span className="text-slate-400">Vorrat schnell anpassen:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {resourcePoolMax >= 500 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const delta = Math.round(resourcePoolMax * 0.1);
                          const next = Math.max(0, resourcePoolCurrent - delta);
                          setResourcePoolCurrent(next);
                          setResCurrentInput(formatNum(next));
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9.5px] font-mono font-bold cursor-pointer"
                      >
                        -10% (-{formatNum(Math.round(resourcePoolMax * 0.1))})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const delta = Math.round(resourcePoolMax * 0.1);
                          const next = Math.min(resourcePoolMax, resourcePoolCurrent + delta);
                          setResourcePoolCurrent(next);
                          setResCurrentInput(formatNum(next));
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9.5px] font-mono font-bold cursor-pointer"
                      >
                        +10% (+{formatNum(Math.round(resourcePoolMax * 0.1))})
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const next = Math.max(0, resourcePoolCurrent - 10);
                          setResourcePoolCurrent(next);
                          setResCurrentInput(formatNum(next));
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9.5px] font-mono font-bold cursor-pointer"
                      >
                        -10 {resourceName}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = Math.min(resourcePoolMax, resourcePoolCurrent + 10);
                          setResourcePoolCurrent(next);
                          setResCurrentInput(formatNum(next));
                        }}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-[9.5px] font-mono font-bold cursor-pointer"
                      >
                        +10 {resourceName}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setResourcePoolCurrent(resourcePoolMax);
                      setResCurrentInput(formatNum(resourcePoolMax));
                    }}
                    className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded text-[9.5px] font-mono font-bold cursor-pointer"
                  >
                    Voll (100%)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: KÖRPERLICHE VERÄNDERUNGEN (WAS SICH GENAU AM KÖRPER ÄNDERT) */}
      {activeTab === 'koerper' && (
        <div className="space-y-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-person text-amber-400"></i>
                <span>Physische & Anatomische Veränderungen</span>
              </span>
              <p className="text-[9.5px] text-slate-400 mt-0.5">
                Detaillierter Vergleich zwischen Standardgestalt und der aktiven Verwandlung:
              </p>
            </div>
            <span className="text-[9.5px] font-mono text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {physicalChanges.filter(c => c.isChanged).length} Veränderungen aktiv
            </span>
          </div>

          {/* TABLE OF PHYSICAL ATTRIBUTE DELTAS */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-[10.5px] border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[9.5px] text-slate-400 uppercase tracking-wider bg-slate-900/80">
                  <th className="py-2 px-3 font-extrabold">Körpermerkmal</th>
                  <th className="py-2 px-3 font-extrabold">Standardgestalt</th>
                  <th className="py-2 px-3 font-extrabold">Aktive Form</th>
                  <th className="py-2 px-3 font-extrabold">Differenz / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {physicalChanges.map((item, idx) => (
                  <tr key={idx} className={item.isChanged ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-slate-900/40'}>
                    <td className="py-2 px-3">
                      <span className="font-bold text-slate-200 block">{item.label}</span>
                      <span className="text-[8.5px] text-slate-400">{item.category}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 font-mono">
                      {item.standardVal}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-300">
                      {item.activeVal}
                    </td>
                    <td className="py-2 px-3">
                      {item.isChanged ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 w-fit">
                            {item.deltaText || 'Verändert'}
                          </span>
                          <span className="text-[8px] text-slate-400">{item.manifestationStage}</span>
                        </div>
                      ) : (
                        <span className="text-[9.5px] text-slate-400 italic">Unverändert</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MÖGLICHE NEBENWIRKUNGEN & RISIKEN */}
      {activeTab === 'nebenwirkungen' && (
        <div className="space-y-3.5 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
          {/* HEADER & QUICK ACTION TOOLBAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-slate-800 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-triangle-exclamation text-amber-400"></i>
                  <span>Mögliche Nebenwirkungen & Risiken</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  {activeSideEffectIds.length} von {sideEffectsList.length} aktiv
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 mt-0.5">
                Universelle und gestaltspezifische Risiken verwalten, an- oder abwählen und eigene Nebenwirkungen definieren:
              </p>
            </div>

            {/* Quick bulk actions */}
            {!readOnly && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleStartCreateSideEffect}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow transition cursor-pointer"
                >
                  <i className="fa-solid fa-plus text-[9px]"></i>
                  <span>Eigene Nebenwirkung erstellen</span>
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllSideEffects}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[9.5px] font-medium transition cursor-pointer"
                  title="Alle Nebenwirkungen aktivieren"
                >
                  Alle an
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllSideEffects}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[9.5px] font-medium transition cursor-pointer"
                  title="Alle Nebenwirkungen deaktivieren"
                >
                  Alle aus
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaultSideEffects}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[9.5px] font-medium transition cursor-pointer"
                  title="Auf empfohlene Standardauswahl zurücksetzen"
                >
                  Standard
                </button>
              </div>
            )}
          </div>

          {/* CREATION & EDITING FORM (DRAWER / CARD) */}
          {isCreatingSideEffect && !readOnly && (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 space-y-3 shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <i className={`fa-solid ${editingSideEffectId ? 'fa-pen-to-square' : 'fa-plus'} text-amber-400`}></i>
                  <span>{editingSideEffectId ? 'Nebenwirkung bearbeiten' : 'Neue benutzerdefinierte Nebenwirkung erstellen'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCancelEditSideEffect}
                  className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded hover:bg-slate-900 cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[10.5px]">
                {/* Name */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 block">
                    Bezeichnung der Nebenwirkung / des Risikos:
                  </label>
                  <input
                    type="text"
                    value={formSeName}
                    onChange={(e) => setFormSeName(e.target.value)}
                    placeholder="z. B. Temporärer Muskelschwund oder Psionische Trübung"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Phase */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 block">
                    Wirkungsphase:
                  </label>
                  <select
                    value={formSePhase}
                    onChange={(e) => setFormSePhase(e.target.value as SideEffectPhase)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="während">Während aktiver Form</option>
                    <option value="nachwirkung">Nachwirkung nach Rückverwandlung</option>
                    <option value="risiko_pnr">Point of No Return (Überlastungsrisiko)</option>
                  </select>
                </div>

                {/* Schweregrad */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 block">
                    Schweregrad:
                  </label>
                  <select
                    value={formSeSeverity}
                    onChange={(e) => setFormSeSeverity(e.target.value as SideEffectSeverity)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="leicht">Leicht (Geringfügig)</option>
                    <option value="moderat">Moderat (Spürbar)</option>
                    <option value="schwer">Schwer (Belastend)</option>
                    <option value="kritisch">Kritisch (Gefährlich/Irreversibel)</option>
                  </select>
                </div>

                {/* Kategorie */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 block">
                    Kategorie:
                  </label>
                  <select
                    value={formSeCategory}
                    onChange={(e) => setFormSeCategory(e.target.value as SideEffectCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {SIDE_EFFECT_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Auslöser */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 block">
                    Auslöser / Bedingung:
                  </label>
                  <input
                    type="text"
                    value={formSeTrigger}
                    onChange={(e) => setFormSeTrigger(e.target.value)}
                    placeholder="z. B. Bei Intensität > 60% oder nach Deaktivierung"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Dauer */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 block">
                    Wirkungsdauer:
                  </label>
                  <input
                    type="text"
                    value={formSeDuration}
                    onChange={(e) => setFormSeDuration(e.target.value)}
                    placeholder="z. B. Während Form aktiv, 15 bis 30 Minuten oder Permanent"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Auswirkung / Beschreibung */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-400 block">
                  Auswirkung & Beschreibung des Effekts:
                </label>
                <AutoExpandingTextarea
                  value={formSeEffect}
                  onChange={(e) => setFormSeEffect(e.target.value)}
                  placeholder="Detaillierte Beschreibung der physischen, mentalen oder energetischen Einschränkungen und Reaktionen..."
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                <button
                  type="button"
                  onClick={handleCancelEditSideEffect}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg text-xs transition cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveSideEffect}
                  disabled={!formSeName.trim() || !formSeEffect.trim()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs shadow transition cursor-pointer"
                >
                  <i className="fa-solid fa-check mr-1.5"></i>
                  <span>{editingSideEffectId ? 'Änderungen übernehmen' : 'Speichern & Aktivieren'}</span>
                </button>
              </div>
            </div>
          )}

          {/* FILTER & SEARCH TOOLBAR */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-[9.5px]">
            {/* Phase Filters */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSideEffectFilter('alle')}
                className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer ${
                  sideEffectFilter === 'alle' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Alle ({sideEffectsList.length})
              </button>
              <button
                type="button"
                onClick={() => setSideEffectFilter('während')}
                className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer ${
                  sideEffectFilter === 'während' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Während Form ({countPhaseWahrend})
              </button>
              <button
                type="button"
                onClick={() => setSideEffectFilter('nachwirkung')}
                className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer ${
                  sideEffectFilter === 'nachwirkung' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Nachwirkungen ({countPhaseNachwirkung})
              </button>
              <button
                type="button"
                onClick={() => setSideEffectFilter('risiko_pnr')}
                className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer ${
                  sideEffectFilter === 'risiko_pnr' ? 'bg-red-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                PNR-Risiken ({countPhasePnr})
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Status Filter */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setSideEffectStatusFilter('alle')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    sideEffectStatusFilter === 'alle' ? 'bg-slate-700 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Alle
                </button>
                <button
                  type="button"
                  onClick={() => setSideEffectStatusFilter('aktiv')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    sideEffectStatusFilter === 'aktiv' ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Aktiv ({activeSideEffectIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSideEffectStatusFilter('inaktiv')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    sideEffectStatusFilter === 'inaktiv' ? 'bg-slate-800 text-slate-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Inaktiv ({Math.max(0, sideEffectsList.length - activeSideEffectIds.length)})
                </button>
              </div>

              {/* Category Dropdown Filter */}
              <select
                value={sideEffectCategoryFilter}
                onChange={(e) => setSideEffectCategoryFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-amber-500 text-[9.5px]"
              >
                <option value="alle">Alle Kategorien</option>
                {SIDE_EFFECT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>

              {/* Search input */}
              <div className="relative min-w-[120px] flex-1">
                <input
                  type="text"
                  value={sideEffectSearchQuery}
                  onChange={(e) => setSideEffectSearchQuery(e.target.value)}
                  placeholder="Suchen..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-2 py-1 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-[9.5px]"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-[8.5px]"></i>
                {sideEffectSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSideEffectSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-[8.5px] cursor-pointer"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LIST OF SIDE EFFECTS & RISKS */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredSideEffects.length === 0 ? (
              <div className="bg-slate-950/70 p-6 rounded-xl border border-slate-800 text-center space-y-2">
                <i className="fa-solid fa-filter text-slate-600 text-lg"></i>
                <p className="text-xs text-slate-400">
                  Keine Nebenwirkungen oder Risiken für die aktuellen Filterkriterien gefunden.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSideEffectFilter('alle');
                    setSideEffectStatusFilter('alle');
                    setSideEffectCategoryFilter('alle');
                    setSideEffectSearchQuery('');
                  }}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-[10px] cursor-pointer font-medium"
                >
                  Filter zurücksetzen
                </button>
              </div>
            ) : (
              filteredSideEffects.map((se) => {
                const isActive = activeSideEffectIds.includes(se.id);
                const isPnrRisk = se.phase === 'risiko_pnr';
                const isAfterEffect = se.phase === 'nachwirkung';
                const categoryDef = SIDE_EFFECT_CATEGORIES.find(c => c.id === se.category);

                return (
                  <div
                    key={se.id}
                    className={`p-3 rounded-xl border space-y-2 transition-all ${
                      !isActive
                        ? 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-90'
                        : isPnrRisk
                        ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                        : isAfterEffect
                        ? 'bg-orange-950/20 border-orange-500/40'
                        : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      {/* Left: Active Toggle & Name */}
                      <div className="flex items-center gap-2.5">
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleToggleSideEffect(se.id)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                              isActive
                                ? isPnrRisk
                                  ? 'bg-red-500 border-red-400 text-white'
                                  : 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'bg-slate-900 border-slate-700 text-transparent hover:border-slate-500'
                            }`}
                            title={isActive ? 'Deaktivieren' : 'Aktivieren'}
                          >
                            <i className="fa-solid fa-check text-[10px] font-black"></i>
                          </button>
                        )}

                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              !isActive
                                ? 'bg-slate-600'
                                : se.severity === 'kritisch'
                                ? 'bg-red-500 animate-ping'
                                : se.severity === 'schwer'
                                ? 'bg-red-400'
                                : se.severity === 'moderat'
                                ? 'bg-orange-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className={`text-xs font-bold ${isActive ? 'text-slate-100' : 'text-slate-400 line-through'}`}>
                            {se.name}
                          </span>
                        </div>
                      </div>

                      {/* Right: Badges */}
                      <div className="flex items-center gap-1.5 text-[9px] font-mono flex-wrap">
                        {/* Category Badge */}
                        {categoryDef && (
                          <span className="px-2 py-0.5 rounded font-bold bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1">
                            <i className={`${categoryDef.icon} text-[8.5px] text-amber-400`}></i>
                            <span>{categoryDef.label.split(' ')[0]}</span>
                          </span>
                        )}

                        {/* Phase Badge */}
                        <span
                          className={`px-2 py-0.5 rounded font-bold uppercase ${
                            se.phase === 'während'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : se.phase === 'nachwirkung'
                              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {se.phase === 'während' ? 'Während Form' : se.phase === 'nachwirkung' ? 'Nachwirkung' : 'PNR-Risiko'}
                        </span>

                        {/* Severity Badge */}
                        <span className="px-2 py-0.5 rounded font-bold uppercase bg-slate-900 text-slate-400 border border-slate-800">
                          {se.severity}
                        </span>

                        {/* Custom / Specific Indicator */}
                        {se.isCustom && (
                          <span className="px-1.5 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Eigene
                          </span>
                        )}
                        {se.isFormSpecific && (
                          <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Gestalt
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Effect Description */}
                    <p className={`text-[10px] leading-relaxed ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {se.effect}
                    </p>

                    {/* Footer with Trigger, Duration & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-900/80 text-[9px] text-slate-400 font-mono">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          Auslöser: <strong className={isActive ? 'text-slate-200' : 'text-slate-500'}>{se.trigger}</strong>
                        </span>
                        {se.duration && (
                          <span>
                            Dauer: <strong className={isActive ? 'text-slate-200' : 'text-slate-500'}>{se.duration}</strong>
                          </span>
                        )}
                      </div>

                      {/* Edit / Delete actions */}
                      {!readOnly && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleStartEditSideEffect(se)}
                            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-slate-700 transition cursor-pointer text-[9px]"
                            title="Nebenwirkung bearbeiten"
                          >
                            <i className="fa-solid fa-pen-to-square mr-1 text-[8px]"></i>
                            <span>Bearbeiten</span>
                          </button>
                          {se.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomSideEffect(se.id)}
                              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-red-950/50 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900/60 transition cursor-pointer text-[9px]"
                              title="Benutzerdefinierte Nebenwirkung löschen"
                            >
                              <i className="fa-solid fa-trash-can mr-1 text-[8px]"></i>
                              <span>Löschen</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 5: STUFE & POINT OF NO RETURN / ABKLINGZEIT */}
      {activeTab === 'stufe' && (
        <div className="space-y-3 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-[10px] border-b border-slate-800 pb-2">
            <span className="text-slate-300 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-clock-rotate-left text-sky-400"></i>
              <span>Abklingzeit & Rückverwandlungs-Dauer</span>
            </span>
            <span className="font-mono font-bold text-sky-300">
              Rate: -{formatNum(abklingenStep)}% / {timeUnit}
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-[10.5px]">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <i className="fa-solid fa-stopwatch text-sky-400"></i>
              <span>Dauer bis wieder 0% (Standardgestalt) erreicht ist:</span>
            </span>
            <span className={`font-mono font-black text-xs ${isPastPNR ? 'text-red-400' : intensityVal === 0 ? 'text-emerald-400' : 'text-sky-300'}`}>
              {timeToZeroFormatted}
            </span>
          </div>

          {/* ZEITEINHEITEN SCHNELL-STEUERUNG */}
          {!readOnly && (
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[9.5px]">
                <span className="text-slate-200 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-hourglass-start text-amber-400"></i>
                  <span>Zeiteinheiten Steuern ({timeUnit}) – Steigen & Fallen</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  Rate: +{formatNum(zeitStep)}% / -{formatNum(abklingenStep)}%
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5">
                {/* Fallende Zeiteinheiten */}
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-sky-400 uppercase mr-0.5">Fallen:</span>
                  <button
                    type="button"
                    disabled={isPastPNR}
                    onClick={() => handleTimeStepBackward(10)}
                    className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all ${
                      isPastPNR
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 cursor-pointer active:scale-95'
                    }`}
                    title={`10 ${timeUnit} abklingen (-${formatNum(10 * abklingenStep)}%)`}
                  >
                    -10 {timeUnit}
                  </button>
                  <button
                    type="button"
                    disabled={isPastPNR}
                    onClick={() => handleTimeStepBackward(1)}
                    className={`px-2 py-1 rounded text-[9.5px] font-mono font-bold border transition-all ${
                      isPastPNR
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 cursor-pointer active:scale-95'
                    }`}
                    title={`1 ${timeUnit} abklingen (-${formatNum(abklingenStep)}%)`}
                  >
                    -1 {timeUnit}
                  </button>
                </div>

                {/* Steigende Zeiteinheiten */}
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-orange-400 uppercase mr-0.5">Steigen:</span>
                  <button
                    type="button"
                    onClick={() => handleTimeStepForward(1)}
                    className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                    title={`1 ${timeUnit} vergangen (+${formatNum(zeitStep)}%)`}
                  >
                    +1 {timeUnit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeStepForward(10)}
                    className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                    title={`10 ${timeUnit} vergangen (+${formatNum(10 * zeitStep)}%)`}
                  >
                    +10 {timeUnit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTimeStepForward(60)}
                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded text-[9.5px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                    title={`60 ${timeUnit} vergangen (+${formatNum(60 * zeitStep)}%)`}
                  >
                    +1 Std. (+{formatNum(60 * zeitStep)}%)
                  </button>
                </div>

                {/* Auto-Simulation Toggles */}
                <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSimulating && simMode === 'increase') {
                        setIsSimulating(false);
                      } else {
                        setSimMode('increase');
                        setIsSimulating(true);
                      }
                    }}
                    className={`px-2 py-1 rounded text-[9.5px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                      isSimulating && simMode === 'increase'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black animate-pulse'
                        : 'bg-slate-900 text-amber-400 border-slate-700 hover:border-amber-500/50'
                    }`}
                    title="Auto-Simulation: Verwandlungsstufe steigt kontinuierlich pro Sekunde"
                  >
                    <i className={`fa-solid ${isSimulating && simMode === 'increase' ? 'fa-pause' : 'fa-play'}`}></i>
                    <span>Auto-Steigen</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPastPNR}
                    onClick={() => {
                      if (isSimulating && simMode === 'decrease') {
                        setIsSimulating(false);
                      } else {
                        setSimMode('decrease');
                        setIsSimulating(true);
                      }
                    }}
                    className={`px-2 py-1 rounded text-[9.5px] font-bold border transition-all flex items-center gap-1 ${
                      isPastPNR
                        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                        : isSimulating && simMode === 'decrease'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 font-black animate-pulse cursor-pointer'
                        : 'bg-slate-900 text-sky-400 border-slate-700 hover:border-sky-500/50 cursor-pointer'
                    }`}
                    title="Auto-Simulation: Verwandlungsstufe fällt kontinuierlich pro Sekunde"
                  >
                    <i className={`fa-solid ${isSimulating && simMode === 'decrease' ? 'fa-pause' : 'fa-play'}`}></i>
                    <span>Auto-Fallen</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUICK STEP ACTION BUTTONS */}
      {!readOnly && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleIncrease(kraftStep)}
            className="px-2.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-[10.5px] uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm group"
            title={`Kraftaufwand & Kampf steigern die Intensität (+${formatNum(kraftStep)}%)`}
          >
            <i className="fa-solid fa-fire text-xs text-amber-400 group-hover:scale-110 transition-transform"></i>
            <span>Kraft +{formatNum(kraftStep)}%</span>
          </button>

          <button
            type="button"
            onClick={() => handleIncrease(zeitStep)}
            className="px-2.5 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-bold rounded-xl text-[10.5px] uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm group"
            title={`Verstrichene Zeit im verwandelten Zustand (+${formatNum(zeitStep)}% pro ${timeUnit})`}
          >
            <i className="fa-solid fa-hourglass-half text-xs text-orange-400 group-hover:scale-110 transition-transform"></i>
            <span>Zeit +{formatNum(zeitStep)}% / {timeUnit}</span>
          </button>

          <button
            type="button"
            onClick={() => handleDecrease(abklingenStep)}
            disabled={isPastPNR}
            className={`px-2.5 py-2 border font-bold rounded-xl text-[10.5px] uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm group ${
              isPastPNR
                ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 cursor-pointer'
            }`}
            title={`Rast / Inaktivität lässt Effekt abklingen (-${formatNum(abklingenStep)}% pro ${timeUnit})`}
          >
            <i className="fa-solid fa-feather text-xs text-sky-400 group-hover:scale-110 transition-transform"></i>
            <span>Abklingen -{formatNum(abklingenStep)}%</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-xl text-[10.5px] uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm group"
            title="Intensität vollständig zurücksetzen (0%)"
          >
            <i className="fa-solid fa-rotate-left text-xs group-hover:-rotate-45 transition-transform"></i>
            <span>Reset (0%)</span>
          </button>
        </div>
      )}

      {/* CONFIGURATION / STEP & RESOURCE SETTINGS PANEL */}
      {!readOnly && showSettings && (
        <div className="bg-slate-900/95 p-3.5 rounded-xl border border-amber-500/40 space-y-3.5 animate-in fade-in duration-200 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1.5">
              <i className="fa-solid fa-sliders text-amber-400"></i>
              <span>Ressourcen, Kraftquelle & Point of No Return konfigurieren</span>
            </span>
            <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <i className="fa-solid fa-floppy-disk text-[9px]"></i>
              <span>Automatisch gespeichert</span>
            </span>
          </div>

          {/* ROW 1: RESOURCE POOL & UPKEEP PARAMETERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Kraftquelle Name */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-amber-300 flex items-center justify-between gap-1">
                <span className="truncate">Name der Kraftquelle</span>
                <span className="text-[9px] text-slate-400 font-mono">Quelle</span>
              </label>
              <input
                type="text"
                value={customPowerSourceName}
                onChange={(e) => setCustomPowerSourceName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-none transition-all"
                placeholder="z.B. Esper-Kraft"
              />
            </div>

            {/* Ressource Einheiten-Name (MP, Mana etc.) */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-amber-300 flex items-center justify-between gap-1">
                <span className="truncate">Ressourcen-Kürzel</span>
                <span className="text-[9px] text-slate-400 font-mono">Einheit</span>
              </label>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="MP"
              />
            </div>

            {/* Max Resource Pool */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-sky-300 flex items-center justify-between gap-1">
                <span className="truncate">Maximaler Vorrat</span>
                <span className="text-[9px] text-sky-400 font-mono font-bold">{resourceName}</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={resMaxInput}
                onChange={(e) => {
                  setResMaxInput(e.target.value);
                  const parsed = parseDecimal(e.target.value);
                  if (!isNaN(parsed) && parsed > 0) {
                    setResourcePoolMax(parsed);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="100"
              />
            </div>

            {/* Upkeep Cost Rate */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-orange-300 flex items-center justify-between gap-1">
                <span className="truncate">Erhaltungskosten</span>
                <span className="text-[9px] text-orange-400 font-mono font-bold">/{timeUnit}</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={resUpkeepInput}
                onChange={(e) => {
                  setResUpkeepInput(e.target.value);
                  const parsed = parseDecimal(e.target.value);
                  if (!isNaN(parsed) && parsed >= 0) {
                    setResourceUpkeepRate(parsed);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-orange-400 focus:ring-1 focus:ring-orange-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="5"
              />
            </div>
          </div>

          {/* ROW 2: POINT OF NO RETURN & TIME ADVANCE RATES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 border-t border-slate-800/80">
            {/* PNR */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-red-500/30 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-red-400 flex items-center justify-between gap-1">
                <span className="truncate">Point of No Return</span>
                <span className="text-[10px] text-red-400 font-mono font-black">%</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={pnrInput}
                onChange={(e) => {
                  setPnrInput(e.target.value);
                  const parsed = parseDecimal(e.target.value);
                  if (!isNaN(parsed) && parsed > 0) {
                    handlePnrChange(parsed);
                  }
                }}
                className="w-full bg-slate-900 border border-red-500/40 focus:border-red-400 focus:ring-1 focus:ring-red-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="80"
              />
            </div>

            {/* Kraft Step */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-amber-300 flex items-center justify-between gap-1">
                <span className="truncate">Kraft-Zuwachs</span>
                <span className="text-[10px] text-amber-400 font-mono font-black">%</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={kraftInput}
                onChange={(e) => {
                  setKraftInput(e.target.value);
                  const parsed = parseDecimal(e.target.value);
                  if (!isNaN(parsed)) setKraftStep(parsed);
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="15"
              />
            </div>

            {/* Zeit Step */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-orange-300 flex items-center justify-between gap-1">
                <span className="truncate">Zeit-Zuwachs</span>
                <span className="text-[9px] text-orange-400 font-mono font-black">%/{timeUnit}</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={zeitInput}
                onChange={(e) => {
                  setZeitInput(e.target.value);
                  const parsed = parseDecimal(e.target.value);
                  if (!isNaN(parsed)) setZeitStep(parsed);
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-orange-400 focus:ring-1 focus:ring-orange-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="10"
              />
            </div>

            {/* Abkling Step */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-sky-300 flex items-center justify-between gap-1">
                <span className="truncate">Abkling-Rate</span>
                <span className="text-[9px] text-sky-400 font-mono font-black">%/{timeUnit}</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={abklingenInput}
                onChange={(e) => {
                  setAbklingenInput(e.target.value);
                  const parsed = parseDecimal(e.target.value);
                  if (!isNaN(parsed)) setAbklingenStep(parsed);
                }}
                className="w-full bg-slate-900 border border-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="20"
              />
            </div>

            {/* Zeiteinheit Label */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <label className="text-[10px] font-bold uppercase text-slate-300 flex items-center justify-between gap-1">
                <span className="truncate">Zeiteinheit</span>
                <span className="text-[9px] text-slate-400 font-mono">Text</span>
              </label>
              <input
                type="text"
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold text-center outline-none transition-all"
                placeholder="Min."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransformationIntensityCard;
