import { Character, Appearance, BodyCondition, TransformationState, PhysicalChangeItem } from '../types';
import { BODY_CONDITION_PRESETS } from './bodyConditionPresets';
import { getTransformationCardSettings } from './TransformationIntensityCard';
import { calculatePhysicalChanges, getCompactChangesSummary, getCompactBodyConditionSummary } from '../utils/changeTracker';

export interface ResolvedBodyAppearance extends Appearance {
  effectiveGender: string;
  effectiveRace: string;
  effectiveRaceFeatures: string;
  effectiveHeightCm: number;
  effectiveWeightKg: number;
  effectiveBodyFat: number;
  effectiveMuscleMass: number;
  effectiveCupSize: string;
  effectiveBuild: string;
  effectiveMeasurements: string;
  effectiveHairColor: string;
  effectiveEyeColor: string;
  effectiveHasHeterochromia?: boolean;
  effectiveEyeColorLeft?: string;
  effectiveEyeColorRight?: string;
  effectiveSkinTone: string;
  effectiveWings: boolean;
  effectiveHorns: boolean;
  effectiveHealingFactor: number;
  effectiveInjuries: string;
  isVirgin: boolean;
  hasChildren: boolean;
  childrenCount: number;

  // Base Standardgestalt Physical Attributes
  standardGender: string;
  standardRace: string;
  standardRaceFeatures: string;
  standardHeightCm: number;
  standardWeightKg: number;
  standardBodyFat: number;
  standardMuscleMass: number;
  standardCupSize: string;
  standardBuild: string;
  standardMeasurements: string;
  standardHairColor: string;
  standardEyeColor: string;
  standardHasHeterochromia?: boolean;
  standardEyeColorLeft?: string;
  standardEyeColorRight?: string;
  standardSkinTone: string;

  // Three Transformation Dimensions & Rates
  transformationIntensityVal: number; // Aktuelle Verwandlungsintensität (0-100%)
  metamorphosisProgressVal: number; // Dauerhafter Metamorphose-Fortschritt (0-100%)
  powerUsageVal: number; // Kraftnutzung (0-100%)
  powerSource: string; // z.B. "MP", "Mana", "Ausdauer"
  baseConversionRate: number; // Basis-Kraftumwandlung
  currentConversionRate: number; // Aktuelle dynamische Kraftumwandlung (%)
  isPastPNR: boolean; // Point of No Return erreicht
  pnrThreshold: number; // PNR Schwelle (%)
  permanentLockedFeatures: Record<string, boolean>;

  transformationStageName: string;
  activeConditionList: BodyCondition[];
  specialFeaturesList: string[];
  hudStatusTags: string[];
  dmPromptSummary: string;
  physicalChanges: PhysicalChangeItem[];
  compactChangesSummary: string;
  bodyConditionSummary: { statusText: string; detailText: string; isHealthy: boolean; severity: 'healthy' | 'minor' | 'moderate' | 'severe' };
}

export const parseMeasurements = (str: string | undefined, defaultBust: number, defaultWaist: number, defaultHips: number) => {
  if (!str || typeof str !== 'string') return { bust: defaultBust, waist: defaultWaist, hips: defaultHips };
  const cleaned = str.replace(/cm/gi, '').trim();
  const parts = cleaned.split('-').map(p => parseInt(p.trim()));
  return {
    bust: parts[0] && !isNaN(parts[0]) ? parts[0] : defaultBust,
    waist: parts[1] && !isNaN(parts[1]) ? parts[1] : defaultWaist,
    hips: parts[2] && !isNaN(parts[2]) ? parts[2] : defaultHips,
  };
};

/**
 * Calculates dynamic conversion rate from base rate and metamorphosis progress
 */
export const calculateCurrentConversionRate = (
  baseRate: number = 15,
  progress: number = 0,
  maxRate: number = 35,
  curve: 'linear' | 'stepped' | 'smooth' | 'exponential' | 'custom' = 'smooth'
): number => {
  const norm = Math.max(0, Math.min(1, (progress || 0) / 100));
  let curveFactor = norm;
  if (curve === 'smooth') {
    curveFactor = norm * norm * (3 - 2 * norm);
  } else if (curve === 'exponential') {
    curveFactor = Math.pow(norm, 1.8);
  } else if (curve === 'stepped') {
    curveFactor = Math.floor(norm * 4) / 4;
  }
  const effectiveMax = Math.max(baseRate, maxRate);
  const rate = baseRate + (effectiveMax - baseRate) * curveFactor;
  return Math.round(rate * 10) / 10;
};

/**
 * Calculates metamorphosis progress gain from resource consumption
 */
export const calculateMetamorphosisGain = (
  resourceCost: number,
  influencePercent: number = 100,
  conversionRate: number = 15
): number => {
  if (resourceCost <= 0) return 0;
  const influence = Math.max(0, influencePercent) / 100;
  const rate = Math.max(0, conversionRate) / 100;
  // Scaled resource consumption into metamorphosis points
  const rawGain = (resourceCost * influence * rate * 0.1);
  return Math.round(rawGain * 100) / 100;
};

/**
 * Parses numeric value from a string (e.g. "175 cm" -> 175, "65 kg" -> 65, "22%" -> 22)
 */
export const parseNumericValue = (val: any, fallback: number): number => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const match = String(val).match(/-?\d+(\.\d+)?/);
  if (match) {
    const num = parseFloat(match[0]);
    return isNaN(num) ? fallback : num;
  }
  return fallback;
};

/**
 * Resolves the full physical body state by combining:
 * 1. Base Character Appearance (Standardgestalt)
 * 2. Active Transformation Profile
 * 3. Metamorphosis Progress & Current Intensity Blending
 * 4. Active Body Conditions (Gender Shifts, Race Morphs, Curses, Blessings, Mutations)
 */
export const resolveBodyAppearance = (character: Character): ResolvedBodyAppearance => {
  const baseApp: Appearance = character.appearance || {
    hairColor: 'Schwarz',
    eyeColor: 'Braun',
    age: '20',
    build: 'Schlank',
    gender: 'Weiblich'
  };

  const cardSettings = getTransformationCardSettings();
  const tState: Partial<TransformationState> = baseApp.transformationState || {};

  // 1. Metamorphosis Values Resolution
  const rawMetamorphosis = baseApp.metamorphosisProgress ?? tState.metamorphosisProgress ?? 0;
  const rawIntensity = baseApp.transformationIntensity ?? tState.currentIntensity ?? 0;
  const rawPowerUsage = baseApp.powerUsage ?? tState.powerUsage ?? 0;

  const metamorphosisProgressVal = Math.max(0, Math.min(100, Math.round(rawMetamorphosis * 100) / 100));
  const transformationIntensityVal = Math.max(0, Math.min(100, Math.round(rawIntensity * 100) / 100));
  const powerUsageVal = Math.max(0, Math.min(100, Math.round(rawPowerUsage * 100) / 100));

  const pnrThreshold = tState.pointOfNoReturn ?? cardSettings.pnrThreshold ?? 80;
  const isPastPNR = (metamorphosisProgressVal >= pnrThreshold) || (transformationIntensityVal >= pnrThreshold) || Boolean(tState.permanent);
  const powerSource = tState.powerSource || 'MP';
  const baseConversionRate = tState.baseConversionRate ?? cardSettings.kraftStep ?? 15;
  const currentConversionRate = calculateCurrentConversionRate(
    baseConversionRate,
    metamorphosisProgressVal,
    tState.maxConversionRate ?? 35,
    tState.conversionCurve ?? 'smooth'
  );
  const permanentLockedFeatures = tState.permanentChanges || {};

  // Effective progress for silhouette blending is the highest of permanent metamorphosis and active intensity
  const effectiveProgress = Math.max(metamorphosisProgressVal, transformationIntensityVal);

  // Base Standardgestalt Physical Attributes (Unverwandelt Backup / Baseline)
  const origApp = baseApp.originalStandardAppearance || baseApp;
  const standardGender = origApp.gender || baseApp.gender || 'Weiblich';
  const standardRace = origApp.race || baseApp.race || 'Mensch';
  const standardRaceFeatures = origApp.raceFeatures ?? baseApp.raceFeatures ?? '';
  const stdIsFemale = standardGender.toLowerCase() === 'weiblich';

  let standardHeightCm = parseNumericValue(origApp.height || baseApp.height, stdIsFemale ? 168 : 180);
  let standardWeightKg = parseNumericValue(origApp.weight || baseApp.weight, stdIsFemale ? 62 : 78);
  let standardBodyFat = parseNumericValue(origApp.bodyFat || baseApp.bodyFat, stdIsFemale ? 22 : 15);
  let standardMuscleMass = parseNumericValue(origApp.muscleMass || baseApp.muscleMass, stdIsFemale ? 30 : 40);
  const standardCupSize = origApp.cupSize || baseApp.cupSize || (stdIsFemale ? 'B' : '-');
  const standardBuild = origApp.build || baseApp.build || 'Schlank';
  const standardHairColor = origApp.hairColor || baseApp.hairColor || 'Dunkelbraun';
  const standardEyeColor = origApp.eyeColor || baseApp.eyeColor || 'Braun';
  const standardHasHeterochromia = origApp.hasHeterochromia ?? baseApp.hasHeterochromia ?? false;
  const standardEyeColorLeft = origApp.eyeColorLeft || baseApp.eyeColorLeft || standardEyeColor;
  const standardEyeColorRight = origApp.eyeColorRight || baseApp.eyeColorRight || standardEyeColor;
  const standardSkinTone = (origApp as any)?.skinTone || (baseApp as any)?.skinTone || 'Natürlich';

  // Auto-heal corrupted baseline weight/fat/muscle if standard race is a normal humanoid
  const isGiantRace = standardRace.toLowerCase().includes('riese') || standardRace.toLowerCase().includes('koloss') || standardRace.toLowerCase().includes('drache');
  if (!isGiantRace && standardWeightKg > 200) {
    standardWeightKg = stdIsFemale ? 62 : 78;
  }
  if (standardBodyFat > 55) {
    standardBodyFat = stdIsFemale ? 22 : 15;
  }
  if (standardMuscleMass > 75) {
    standardMuscleMass = stdIsFemale ? 30 : 40;
  }

  const defaultStdBust = stdIsFemale ? Math.round(standardHeightCm * 0.52 + (standardBodyFat * 0.4) + (standardCupSize === 'AA' ? 0 : standardCupSize === 'A' ? 3 : standardCupSize === 'B' ? 6 : standardCupSize === 'C' ? 10 : standardCupSize === 'D' ? 14 : standardCupSize === 'E' ? 18 : standardCupSize === 'F' ? 22 : 26)) : Math.round(standardHeightCm * 0.56 + standardMuscleMass * 0.4);
  const defaultStdWaist = stdIsFemale ? Math.round(standardHeightCm * 0.38 + (standardBodyFat * 0.5)) : Math.round(standardHeightCm * 0.45 + (standardBodyFat * 0.4));
  const defaultStdHips = stdIsFemale ? Math.round(standardHeightCm * 0.53 + (standardBodyFat * 0.6)) : Math.round(standardHeightCm * 0.50 + (standardBodyFat * 0.3));

  const stdM = parseMeasurements(origApp.measurements || baseApp.measurements, defaultStdBust, defaultStdWaist, defaultStdHips);
  const standardMeasurements = `${stdM.bust}-${stdM.waist}-${stdM.hips} cm`;

  let transformationStageName = 'Standardgestalt (0%)';
  if (effectiveProgress > 0) {
    if (effectiveProgress <= 25) transformationStageName = `Subtil / Vorstufe (${Math.round(effectiveProgress)}%)`;
    else if (effectiveProgress <= 50) transformationStageName = `Gesteigert / Sichtbare Mutation (${Math.round(effectiveProgress)}%)`;
    else if (effectiveProgress <= 75) transformationStageName = `Manifestiert / Starke Metamorphose (${Math.round(effectiveProgress)}%)`;
    else transformationStageName = `Vollendete Form / Maximale Macht (${Math.round(effectiveProgress)}%)`;
  }

  // 2. Active & Target Transformation Resolution
  const activeTransId = baseApp.activeTransformationId || tState.activeTransformationId || 'standard';
  const transformationAbilities = (character.abilities || []).filter(a => a.category === 'Transformationen');
  const activeTrans = activeTransId !== 'standard'
    ? (transformationAbilities.find(a => a.id === activeTransId || a.name === activeTransId || a.transformName === activeTransId) || null)
    : null;

  // If standard is active, pick the first transformation ability as morphological target
  const targetTrans = activeTrans || (transformationAbilities.length > 0 ? transformationAbilities[0] : null);
  const isExplicitTransformActive = Boolean(activeTrans);

  // When an explicit transformation is activated, default to full form (1.0) unless intensity is specified
  const morphProgressFactor = Math.max(0, Math.min(1, effectiveProgress / 100));
  const effectiveBlend = isExplicitTransformActive 
    ? (transformationIntensityVal > 0 ? transformationIntensityVal / 100 : 1.0) 
    : morphProgressFactor;
  const blendFactor = effectiveBlend;

  // Keywords and theme defaults for transformation
  const tName = (targetTrans?.name || targetTrans?.transformName || '').toLowerCase();
  const tDesc = (targetTrans?.description || '').toLowerCase();
  const isYouth = tName.includes('jungbrunn') || tName.includes('verjüng') || tName.includes('kind') || tDesc.includes('jungbrunn') || tDesc.includes('verjüng') || tDesc.includes('metamorphose');
  const isGiant = tName.includes('riese') || tName.includes('koloss') || tName.includes('giant') || tDesc.includes('riese') || tDesc.includes('koloss');
  const isBeast = tName.includes('bestie') || tName.includes('beast') || tName.includes('dämon') || tName.includes('werwolf');

  // Parse Transformation Target Properties
  const transGender = targetTrans?.transformGender || targetTrans?.gender || standardGender;
  const transIsFemale = transGender.toLowerCase() === 'weiblich';
  const transRace = targetTrans?.transformRace || targetTrans?.race || standardRace;
  const transRaceFeatures = targetTrans?.transformRaceFeatures ?? targetTrans?.raceFeatures ?? standardRaceFeatures;
  const transHeightCm = parseNumericValue(targetTrans?.transformHeight, isYouth ? 125 : isGiant ? 380 : (transIsFemale ? 170 : 185));
  const transWeightKg = parseNumericValue(targetTrans?.transformWeight, isYouth ? 28 : isGiant ? 450 : (transIsFemale ? 65 : 85));
  const transBodyFat = parseNumericValue(targetTrans?.transformBodyFat, isYouth ? 14 : (transIsFemale ? 20 : 12));
  const transMuscleMass = parseNumericValue(targetTrans?.transformMuscleMass, isYouth ? 18 : (transIsFemale ? 35 : 50));
  const transCupSize = targetTrans?.transformCupSize || (isYouth ? 'AA' : (transIsFemale ? 'C' : '-'));
  const transBuild = targetTrans?.transformBuild || (isYouth ? 'Kindlich / Zierlich' : isGiant ? 'Kolossal / Muskelbepackt' : isBeast ? 'Muskulös / Bestialisch' : (transIsFemale ? 'Athletisch' : 'Muskulös'));
  const transHairColor = targetTrans?.transformHairColor || standardHairColor;
  const transEyeColor = targetTrans?.transformEyeColor || standardEyeColor;
  const transHasHeterochromia = (targetTrans as any)?.transformHasHeterochromia ?? false;
  const transEyeColorLeft = (targetTrans as any)?.transformEyeColorLeft || transEyeColor;
  const transEyeColorRight = (targetTrans as any)?.transformEyeColorRight || transEyeColor;
  const transSkinTone = targetTrans?.transformSkinTone || standardSkinTone;

  if (isExplicitTransformActive && activeTrans) {
    transformationStageName = activeTrans.transformName || activeTrans.name || 'Aktive Transformation (100%)';
  }

  // 3. Continuous Morphing Calculations
  let heightCm = Math.round(standardHeightCm + (transHeightCm - standardHeightCm) * blendFactor);
  let weightKg = Math.round(standardWeightKg + (transWeightKg - standardWeightKg) * blendFactor);
  let bodyFat = Math.round(standardBodyFat + (transBodyFat - standardBodyFat) * blendFactor);
  let muscleMass = Math.round(standardMuscleMass + (transMuscleMass - standardMuscleMass) * blendFactor);

  const CUP_SCALE = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const stdCupIdx = Math.max(0, CUP_SCALE.indexOf(standardCupSize.trim().toUpperCase()));
  const transCupIdx = Math.max(0, CUP_SCALE.indexOf(transCupSize.trim().toUpperCase()));
  const blendedCupIdx = Math.round(stdCupIdx + (transCupIdx - stdCupIdx) * blendFactor);
  let cupSize = CUP_SCALE[blendedCupIdx] || transCupSize || standardCupSize;

  // Progressive Categorical Blending
  let hairColor = (isExplicitTransformActive || blendFactor >= 0.15 || permanentLockedFeatures.hair) && targetTrans ? transHairColor : standardHairColor;
  let eyeColor = (isExplicitTransformActive || blendFactor >= 0.20 || permanentLockedFeatures.eyes) && targetTrans ? transEyeColor : standardEyeColor;
  
  let eyeColorLeft = (isExplicitTransformActive || blendFactor >= 0.20 || permanentLockedFeatures.eyes) && targetTrans ? transEyeColorLeft : standardEyeColorLeft;
  let eyeColorRight = (isExplicitTransformActive || blendFactor >= 0.20 || permanentLockedFeatures.eyes) && targetTrans ? transEyeColorRight : standardEyeColorRight;
  let hasHeterochromia = (isExplicitTransformActive || blendFactor >= 0.20 || permanentLockedFeatures.eyes) && targetTrans
    ? (transHasHeterochromia || transEyeColorLeft !== transEyeColorRight)
    : (standardHasHeterochromia || standardEyeColorLeft !== standardEyeColorRight);

  let skinTone = (isExplicitTransformActive || blendFactor >= 0.25 || permanentLockedFeatures.skin) && targetTrans ? transSkinTone : standardSkinTone;
  let build = (isExplicitTransformActive || blendFactor >= 0.35 || permanentLockedFeatures.build) && targetTrans ? transBuild : standardBuild;

  let gender = standardGender;
  if (isExplicitTransformActive && targetTrans) {
    gender = transGender;
  } else if (permanentLockedFeatures.gender && targetTrans) {
    gender = transGender;
  } else if (standardGender.toLowerCase() !== transGender.toLowerCase()) {
    gender = (blendFactor >= 0.50 && targetTrans) ? transGender : standardGender;
  } else {
    gender = standardGender;
  }

  let race = (isExplicitTransformActive || blendFactor >= 0.60 || permanentLockedFeatures.race) && targetTrans ? transRace : standardRace;
  let raceFeatures = (isExplicitTransformActive || blendFactor >= 0.60 || permanentLockedFeatures.race) && targetTrans ? transRaceFeatures : standardRaceFeatures;

  const stateObj = baseApp.silhouetteState || {};
  let healingFactor = parseNumericValue((baseApp as any).healingFactor || stateObj.healingFactor, 1);
  let hasWings = Boolean(
    (targetTrans?.transformWings !== undefined && targetTrans.transformWings && (blendFactor >= 0.25 || permanentLockedFeatures.wings)) ||
    stateObj.hasWings ||
    (raceFeatures.toLowerCase().includes('flügel') || raceFeatures.toLowerCase().includes('wings'))
  );
  let hasHorns = Boolean(
    (targetTrans?.transformHorns !== undefined && targetTrans.transformHorns && (blendFactor >= 0.25 || permanentLockedFeatures.horns)) ||
    stateObj.hasHorns ||
    (raceFeatures.toLowerCase().includes('horn') || raceFeatures.toLowerCase().includes('hörner'))
  );

  // 4. Active Conditions layer
  const activeConditions: BodyCondition[] = (baseApp.activeConditions || []).filter(c => c.isActive);
  const specialFeatures: string[] = [];
  const hudTags: string[] = [];

  for (const cond of activeConditions) {
    if (cond.statusTag) {
      hudTags.push(cond.statusTag);
    } else if (cond.name) {
      hudTags.push(cond.name);
    }

    if (cond.overrideGender && blendFactor >= 0.50) {
      gender = cond.overrideGender;
    }
    if (cond.overrideRace && blendFactor >= 0.60) {
      race = cond.overrideRace;
    }
    if (cond.overrideRaceFeatures && blendFactor >= 0.60) {
      raceFeatures = raceFeatures ? `${raceFeatures}, ${cond.overrideRaceFeatures}` : cond.overrideRaceFeatures;
    }
    if (cond.hairColorOverride && blendFactor >= 0.15) {
      hairColor = cond.hairColorOverride;
    }
    if (cond.eyeColorOverride && blendFactor >= 0.20) {
      eyeColor = cond.eyeColorOverride;
    }
    if (cond.skinToneOverride && blendFactor >= 0.25) {
      skinTone = cond.skinToneOverride;
    }
    if (cond.cupSizeOverride && blendFactor >= 0.35) {
      const cIdx = Math.max(0, CUP_SCALE.indexOf(cond.cupSizeOverride.trim().toUpperCase()));
      const curIdx = Math.max(0, CUP_SCALE.indexOf(cupSize.trim().toUpperCase()));
      const finalCIdx = Math.round(curIdx + (cIdx - curIdx) * blendFactor);
      cupSize = CUP_SCALE[finalCIdx] || cond.cupSizeOverride;
    }
    if (cond.heightModifierCm) {
      heightCm += Math.round(cond.heightModifierCm * blendFactor);
    }
    if (cond.weightModifierKg) {
      weightKg += Math.round(cond.weightModifierKg * blendFactor);
    }
    if (cond.bodyFatModifier) {
      bodyFat = Math.max(3, Math.min(65, bodyFat + Math.round(cond.bodyFatModifier * blendFactor)));
    }
    if (cond.muscleMassModifier) {
      muscleMass = Math.max(5, Math.min(80, muscleMass + Math.round(cond.muscleMassModifier * blendFactor)));
    }
    if (cond.wingsOverride !== undefined && blendFactor >= 0.25) {
      hasWings = cond.wingsOverride;
    }
    if (cond.hornsOverride !== undefined && blendFactor >= 0.25) {
      hasHorns = cond.hornsOverride;
    }
    if (cond.healingFactorModifier) {
      healingFactor = Math.max(1, Math.min(5, healingFactor + cond.healingFactorModifier));
    }
    if (cond.specialFeatures && cond.specialFeatures.length > 0) {
      specialFeatures.push(...cond.specialFeatures);
    }
  }

  // 5. Pregnancy Physical Adjustments
  const rawPreg = baseApp.pregnancyMonth !== undefined ? baseApp.pregnancyMonth : stateObj.pregnancyMonth;
  const pregMonthVal = parseNumericValue(rawPreg, 0);
  const isPregnant = Boolean(stateObj.isPregnant || (character.appearance as any)?.isPregnant || pregMonthVal > 0);
  const isFemale = gender.toLowerCase() === 'weiblich';
  const effPregMonth = (isFemale && isPregnant) ? Math.max(1, pregMonthVal) : 0;

  if (effPregMonth > 0) {
    weightKg += Math.round(effPregMonth * 1.4);
    bodyFat += Math.round(effPregMonth * 0.6);
    const pregCupSteps = Math.min(3, Math.ceil(effPregMonth / 3));
    const curCupIdx = Math.max(0, CUP_SCALE.indexOf(cupSize.trim().toUpperCase()));
    if (curCupIdx > 0) {
      const newCupIdx = Math.min(CUP_SCALE.length - 1, curCupIdx + pregCupSteps);
      cupSize = CUP_SCALE[newCupIdx];
    }
  }

  // Ensure minimums
  if (heightCm < 30) heightCm = 30;
  if (weightKg < 5) weightKg = 5;

  const defaultTransBust = transIsFemale ? Math.round(transHeightCm * 0.52 + (transBodyFat * 0.4) + (transCupSize === 'AA' ? 0 : transCupSize === 'A' ? 3 : transCupSize === 'B' ? 6 : transCupSize === 'C' ? 10 : transCupSize === 'D' ? 14 : transCupSize === 'E' ? 18 : transCupSize === 'F' ? 22 : 26)) : Math.round(transHeightCm * 0.56 + transMuscleMass * 0.4);
  const defaultTransWaist = transIsFemale ? Math.round(transHeightCm * 0.38 + (transBodyFat * 0.5)) : Math.round(transHeightCm * 0.45 + (transBodyFat * 0.4));
  const defaultTransHips = transIsFemale ? Math.round(transHeightCm * 0.53 + (transBodyFat * 0.6)) : Math.round(transHeightCm * 0.50 + (transBodyFat * 0.3));

  const transM = parseMeasurements(targetTrans?.transformMeasurements, defaultTransBust, defaultTransWaist, defaultTransHips);

  let bust = Math.round(stdM.bust + (transM.bust - stdM.bust) * blendFactor);
  let waist = Math.round(stdM.waist + (transM.waist - stdM.waist) * blendFactor);
  let hips = Math.round(stdM.hips + (transM.hips - stdM.hips) * blendFactor);

  if (effPregMonth > 0) {
    const pregCupSteps = Math.min(3, Math.ceil(effPregMonth / 3));
    waist += Math.round(effPregMonth * 4.8);
    hips += Math.round(effPregMonth * 0.9);
    bust += Math.round(effPregMonth * 1.5) + (pregCupSteps * 4);
  }

  const fatDiff = bodyFat - Math.round(standardBodyFat + (transBodyFat - standardBodyFat) * blendFactor);
  const muscleDiff = muscleMass - Math.round(standardMuscleMass + (transMuscleMass - standardMuscleMass) * blendFactor);

  if (isFemale) {
    bust += Math.round(fatDiff * 0.4);
    waist += Math.round(fatDiff * 0.5);
    hips += Math.round(fatDiff * 0.6);
  } else {
    bust += Math.round(muscleDiff * 0.4);
    waist += Math.round(fatDiff * 0.4);
    hips += Math.round(fatDiff * 0.3);
  }

  if (isFemale) {
    const defaultCupBustOffset = (cup: string) => {
      return cup === 'AA' ? 0 : cup === 'A' ? 3 : cup === 'B' ? 6 : cup === 'C' ? 10 : cup === 'D' ? 14 : cup === 'E' ? 18 : cup === 'F' ? 22 : 26;
    };
    const oldCupOffset = defaultCupBustOffset(CUP_SCALE[blendedCupIdx] || standardCupSize);
    const newCupOffset = defaultCupBustOffset(cupSize);
    bust += (newCupOffset - oldCupOffset);
  }

  const measurements = `${bust}-${waist}-${hips} cm`;

  // Compile Injuries
  const injuriesRecord = stateObj.injuries || {};
  const injuryParts: string[] = [];
  Object.entries(injuriesRecord).forEach(([bodyPart, injuryList]) => {
    const list = injuryList as string[];
    if (list && list.length > 0) {
      injuryParts.push(`${bodyPart}: ${list.join(', ')}`);
    }
  });
  const effectiveInjuries = injuryParts.length > 0 ? injuryParts.join(' | ') : '';

  // Build DM summary text
  const promptParts: string[] = [];
  promptParts.push(`[PHYSISCHE GESTALT]: ${gender}, Rasse: ${race}${raceFeatures ? ` (${raceFeatures})` : ''}, Größe: ${heightCm}cm, Gewicht: ${weightKg}kg, Statur: ${build}, KFA: ${bodyFat}%, Muskelmasse: ${muscleMass}%, Maße: ${measurements}${isFemale && cupSize !== '-' ? `, Körbchengröße: ${cupSize}` : ''}`);
  promptParts.push(`[HAUT, HAARE & AUGEN]: Teint: ${skinTone}, Haare: ${hairColor}, Augen: ${hasHeterochromia ? `Heterochromie (L: ${eyeColorLeft}, R: ${eyeColorRight})` : eyeColor}${hasWings ? ', Flügelexistenz: Aktiv am Rücken' : ''}${hasHorns ? ', Hörner: Sichtbar am Kopf' : ''}`);
  
  if (effectiveInjuries) {
    promptParts.push(`[VERLETZUNGEN & WUNDEN]: ${effectiveInjuries}. Die Welt und NPCs reagieren auf diese Verletzungen.`);
  }

  promptParts.push(`[TRANSFORMATIONS-STATUS]: Metamorphose-Fortschritt: ${metamorphosisProgressVal}%, Aktuelle Intensität: ${transformationIntensityVal}%, Kraftnutzung: ${powerUsageVal}%, Kraftquelle: ${powerSource}, Kraftumwandlungsrate: ${currentConversionRate}%, PNR-Schwelle: ${pnrThreshold}%. ${isPastPNR ? 'ACHTUNG: Point of No Return ist erreicht! Transformation ist permanent in Standardform verankert.' : ''}`);

  const childrenCount = stateObj.childrenCount !== undefined ? stateObj.childrenCount : ((character.appearance as any).childrenCount || 0);
  const hasChildren = stateObj.hasChildren !== undefined ? !!stateObj.hasChildren : (childrenCount > 0 || !!(character.appearance as any).hasChildren);
  const hasChildrenOrPregnant = hasChildren || childrenCount > 0 || isPregnant || effPregMonth > 0;

  const isVirgin = hasChildrenOrPregnant 
    ? false 
    : (stateObj.isVirgin !== undefined ? !!stateObj.isVirgin : ((character.appearance as any).isVirgin !== undefined ? !!(character.appearance as any).isVirgin : true));

  if (isVirgin) {
    promptParts.push('Jungfräulichkeitsstatus: Jungfrau');
  } else {
    promptParts.push('Jungfräulichkeitsstatus: Keine Jungfrau');
  }
  if (hasChildren || childrenCount > 0) {
    promptParts.push(`Nachkommen: Hat Kinder (Anzahl: ${childrenCount})`);
  }

  if (activeConditions.length > 0) {
    promptParts.push(`[AKTIVE KÖRPERLICHE BEDINGUNGEN, FLÜCHE & SEGEN]: ${activeConditions.map(c => `(${c.category?.toUpperCase() || 'EFFEKT'}: "${c.name}" - ${c.description}${c.triggerCondition ? ` [Auslöser/Bedingung: ${c.triggerCondition}]` : ''} [Quelle: ${c.source || 'Unbekannt'}, Dauer: ${c.duration || 'Aktiv'}])`).join(' | ')}`);
  }

  const result: ResolvedBodyAppearance = {
    ...baseApp,
    gender,
    race,
    raceFeatures,
    height: `${heightCm} cm`,
    weight: `${weightKg} kg`,
    bodyFat: `${bodyFat}%`,
    muscleMass: `${muscleMass}%`,
    cupSize,
    build,
    measurements,
    hairColor,
    eyeColor,
    skinTone,
    hasHeterochromia,
    eyeColorLeft,
    eyeColorRight,
    effectiveGender: gender,
    effectiveRace: race,
    effectiveRaceFeatures: raceFeatures,
    effectiveHeightCm: heightCm,
    effectiveWeightKg: weightKg,
    effectiveBodyFat: bodyFat,
    effectiveMuscleMass: muscleMass,
    effectiveCupSize: cupSize,
    effectiveBuild: build,
    effectiveMeasurements: measurements,
    effectiveHairColor: hairColor,
    effectiveEyeColor: eyeColor,
    effectiveHasHeterochromia: hasHeterochromia,
    effectiveEyeColorLeft: eyeColorLeft,
    effectiveEyeColorRight: eyeColorRight,
    effectiveSkinTone: skinTone,
    effectiveWings: hasWings,
    effectiveHorns: hasHorns,
    effectiveHealingFactor: healingFactor,
    effectiveInjuries,
    isVirgin,
    hasChildren,
    childrenCount,

    standardGender,
    standardRace,
    standardRaceFeatures,
    standardHeightCm,
    standardWeightKg,
    standardBodyFat,
    standardMuscleMass,
    standardCupSize,
    standardBuild,
    standardMeasurements,
    standardHairColor,
    standardEyeColor,
    standardHasHeterochromia,
    standardEyeColorLeft,
    standardEyeColorRight,
    standardSkinTone,

    transformationIntensityVal,
    metamorphosisProgressVal,
    powerUsageVal,
    powerSource,
    baseConversionRate,
    currentConversionRate,
    isPastPNR,
    pnrThreshold,
    permanentLockedFeatures,

    transformationStageName,
    activeConditionList: activeConditions,
    specialFeaturesList: Array.from(new Set(specialFeatures)),
    hudStatusTags: Array.from(new Set(hudTags)),
    dmPromptSummary: promptParts.join('\n'),
    physicalChanges: [],
    compactChangesSummary: '',
    bodyConditionSummary: { statusText: 'Gesund', detailText: 'Keine Verletzungen oder Beschwerden', isHealthy: true, severity: 'healthy' }
  };

  const changes = calculatePhysicalChanges(result, baseApp);
  const compactChanges = getCompactChangesSummary(changes);
  const bodyCond = getCompactBodyConditionSummary(character, result);

  result.physicalChanges = changes;
  result.compactChangesSummary = compactChanges;
  result.bodyConditionSummary = bodyCond;

  return result;
};

/**
 * Metamorphosis threshold definitions for auto-synchronizing standard form attributes.
 */
export interface MetamorphosisThresholdConfig {
  threshold: number;
  name: string;
  description: string;
}

export const METAMORPHOSIS_THRESHOLDS: MetamorphosisThresholdConfig[] = [
  { threshold: 15, name: 'Stufe 1: Subtile Anzeichen (15%+)', description: 'Körpergröße, Gewicht, KFA, Muskelmasse, Haar- & Augenfarbe fangen an sich anzupassen.' },
  { threshold: 35, name: 'Stufe 2: Statur & Körbchengröße (35%+)', description: 'Statur und Körbchengröße verändern sich spürbar.' },
  { threshold: 50, name: 'Stufe 3: Geschlechts-Transformation (50%+)', description: 'Das effektive Geschlecht wechselt zur Zielform.' },
  { threshold: 60, name: 'Stufe 4: Rassen-Metamorphose (60%+)', description: 'Rasse und Rassenmerkmale passen sich der Verwandlungsform an.' },
  { threshold: 80, name: 'Point of No Return (80%+)', description: 'Dauerhafte und unumkehrbare Übernahme aller Verwandlungseigenschaften in die Standardform.' },
];

/**
 * Updates character metamorphosis state without destroying baseline standard appearance.
 */
export const updateCharacterMetamorphosisState = (
  character: Character,
  updates: {
    intensity?: number;
    metamorphosis?: number;
    powerUsage?: number;
    powerSource?: string;
    baseConversionRate?: number;
    pnrThreshold?: number;
    permanent?: boolean;
    durationDeltaMinutes?: number;
  }
): Character => {
  const currentApp = character.appearance || { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' };
  const cardSettings = getTransformationCardSettings();

  // Ensure standard baseline is permanently preserved
  let orig: Partial<Appearance>;
  if (currentApp.originalStandardAppearance) {
    orig = currentApp.originalStandardAppearance;
  } else {
    orig = { ...currentApp };
    delete orig.originalStandardAppearance;
    delete orig.transformationState;
    delete orig.transformationIntensity;
    delete orig.metamorphosisProgress;
    delete orig.powerUsage;
    delete orig.activeTransformationId;
    
    // Ensure basic defaults for core fields if they are missing
    orig.gender = orig.gender || 'Weiblich';
    orig.race = orig.race || 'Mensch';
    orig.raceFeatures = orig.raceFeatures || '';
    orig.height = orig.height || '168 cm';
    orig.weight = orig.weight || '62 kg';
    orig.bodyFat = orig.bodyFat || '22%';
    orig.muscleMass = orig.muscleMass || '30%';
    orig.cupSize = orig.cupSize || 'B';
    orig.build = orig.build || 'Schlank';
    orig.hairColor = orig.hairColor || 'Dunkelbraun';
    orig.eyeColor = orig.eyeColor || 'Braun';
    orig.hasHeterochromia = orig.hasHeterochromia ?? false;
    orig.eyeColorLeft = orig.eyeColorLeft || orig.eyeColor || 'Braun';
    orig.eyeColorRight = orig.eyeColorRight || orig.eyeColor || 'Braun';
    orig.measurements = orig.measurements || '';
    (orig as any).skinTone = (orig as any).skinTone || 'Natürlich';
    orig.age = orig.age || '22';
  }

  const currentTState = currentApp.transformationState || {
    powerUsage: currentApp.powerUsage ?? 0,
    currentIntensity: currentApp.transformationIntensity ?? 0,
    metamorphosisProgress: currentApp.metamorphosisProgress ?? 0,
    pointOfNoReturn: cardSettings.pnrThreshold ?? 80,
    permanent: false,
    powerSource: 'MP',
    baseConversionRate: cardSettings.kraftStep ?? 15,
    currentConversionRate: 15,
    durationGameMinutes: 0
  };

  const nextIntensity = updates.intensity !== undefined
    ? Math.max(0, Math.min(100, Math.round(updates.intensity * 100) / 100))
    : (currentTState.currentIntensity ?? currentApp.transformationIntensity ?? 0);

  const nextMetamorphosis = updates.metamorphosis !== undefined
    ? Math.max(0, Math.min(100, Math.round(updates.metamorphosis * 100) / 100))
    : (currentTState.metamorphosisProgress ?? currentApp.metamorphosisProgress ?? 0);

  const nextPowerUsage = updates.powerUsage !== undefined
    ? Math.max(0, Math.min(100, Math.round(updates.powerUsage * 100) / 100))
    : (currentTState.powerUsage ?? currentApp.powerUsage ?? 0);

  const nextPNR = updates.pnrThreshold ?? currentTState.pointOfNoReturn ?? cardSettings.pnrThreshold ?? 80;
  const isNowPermanent = Boolean(updates.permanent || currentTState.permanent || nextMetamorphosis >= nextPNR || nextIntensity >= nextPNR);

  const nextBaseConversionRate = updates.baseConversionRate ?? currentTState.baseConversionRate ?? cardSettings.kraftStep ?? 15;
  const nextCurrentConversionRate = calculateCurrentConversionRate(
    nextBaseConversionRate,
    nextMetamorphosis,
    currentTState.maxConversionRate ?? 35,
    currentTState.conversionCurve ?? 'smooth'
  );

  const nextDuration = (currentTState.durationGameMinutes || 0) + (updates.durationDeltaMinutes || 0);

  const permanentChanges: Record<string, boolean> = {
    ...(currentTState.permanentChanges || {})
  };

  if (isNowPermanent) {
    permanentChanges.gender = true;
    permanentChanges.race = true;
    permanentChanges.build = true;
    permanentChanges.hair = true;
    permanentChanges.eyes = true;
    permanentChanges.skin = true;
    permanentChanges.wings = true;
    permanentChanges.horns = true;
  }

  const updatedTState: TransformationState = {
    ...currentTState,
    activeTransformationId: currentApp.activeTransformationId,
    currentIntensity: nextIntensity,
    metamorphosisProgress: nextMetamorphosis,
    powerUsage: nextPowerUsage,
    pointOfNoReturn: nextPNR,
    permanent: isNowPermanent,
    powerSource: updates.powerSource || currentTState.powerSource || 'MP',
    baseConversionRate: nextBaseConversionRate,
    currentConversionRate: nextCurrentConversionRate,
    durationGameMinutes: nextDuration,
    permanentChanges
  };

  return {
    ...character,
    appearance: {
      ...currentApp,
      transformationIntensity: nextIntensity,
      metamorphosisProgress: nextMetamorphosis,
      powerUsage: nextPowerUsage,
      transformationState: updatedTState,
      originalStandardAppearance: orig
    }
  };
};

/**
 * Automatically updates appearance attributes based on metamorphosis intensity.
 */
export const updateStandardFormFromMetamorphosisThresholds = (character: Character, newIntensity: number): Character => {
  return updateCharacterMetamorphosisState(character, { intensity: newIntensity });
};

/**
 * Updates transformation intensity value (0-100%) on a character
 */
export const updateTransformationIntensity = (character: Character, newIntensity: number): Character => {
  return updateCharacterMetamorphosisState(character, { intensity: newIntensity });
};

/**
 * Increments transformation intensity
 */
export const incrementTransformationIntensity = (character: Character, delta: number): Character => {
  const currentApp = character.appearance || { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' };
  const currentVal = currentApp.transformationIntensity ?? 0;
  return updateCharacterMetamorphosisState(character, { intensity: currentVal + delta });
};

/**
 * Decays transformation intensity over in-game time (respects PNR)
 */
export const decayTransformationIntensity = (character: Character, decayAmount = 20): Character => {
  const currentApp = character.appearance || { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' };
  const tState = currentApp.transformationState;
  if (tState?.permanent || (currentApp.metamorphosisProgress ?? 0) >= (tState?.pointOfNoReturn ?? 80)) {
    return character; // PNR reached: No decay allowed
  }
  const currentVal = currentApp.transformationIntensity ?? 0;
  const nextIntensity = Math.max(currentApp.metamorphosisProgress ?? 0, currentVal - decayAmount);
  return updateCharacterMetamorphosisState(character, { intensity: nextIntensity });
};

/**
 * Processes skill execution and converts consumed resources to Metamorphose
 */
export const processSkillMetamorphosis = (
  character: Character,
  resourceCost: number,
  influencePercent: number = 100,
  powerUsagePercent?: number
): { updatedCharacter: Character; gain: number; conversionRate: number } => {
  const resolved = resolveBodyAppearance(character);
  const conversionRate = resolved.currentConversionRate;
  const gain = calculateMetamorphosisGain(resourceCost, influencePercent, conversionRate);

  const nextMetamorphosis = Math.min(100, resolved.metamorphosisProgressVal + gain);
  const nextIntensity = Math.min(100, Math.max(resolved.transformationIntensityVal, nextMetamorphosis));
  const nextPowerUsage = powerUsagePercent !== undefined ? powerUsagePercent : Math.min(100, Math.max(resolved.powerUsageVal, Math.round(resourceCost * 1.5)));

  const updatedCharacter = updateCharacterMetamorphosisState(character, {
    metamorphosis: nextMetamorphosis,
    intensity: nextIntensity,
    powerUsage: nextPowerUsage
  });

  return {
    updatedCharacter,
    gain,
    conversionRate
  };
};

/**
 * Processes elapsed in-game time (in minutes)
 */
export const processElapsedGameTime = (
  character: Character,
  elapsedMinutes: number,
  decayRatePerHour: number = 10
): Character => {
  if (elapsedMinutes <= 0) return character;
  const resolved = resolveBodyAppearance(character);

  let updated = character;
  if (!resolved.isPastPNR && resolved.transformationIntensityVal > resolved.metamorphosisProgressVal) {
    const decayAmount = (elapsedMinutes / 60) * decayRatePerHour;
    const nextIntensity = Math.max(resolved.metamorphosisProgressVal, resolved.transformationIntensityVal - decayAmount);
    updated = updateCharacterMetamorphosisState(character, {
      intensity: nextIntensity,
      durationDeltaMinutes: elapsedMinutes
    });
  } else {
    updated = updateCharacterMetamorphosisState(character, {
      durationDeltaMinutes: elapsedMinutes
    });
  }

  return updated;
};

/**
 * Toggles an active condition on or off for a character
 */
export const toggleConditionOnCharacter = (character: Character, condition: BodyCondition): Character => {
  const currentApp = character.appearance || { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' };
  const currentActive = [...(currentApp.activeConditions || [])];
  const existingIdx = currentActive.findIndex(c => c.id === condition.id || c.name.toLowerCase() === condition.name.toLowerCase());

  if (existingIdx > -1) {
    currentActive.splice(existingIdx, 1);
  } else {
    currentActive.push({
      ...condition,
      isActive: true
    });
  }

  return {
    ...character,
    appearance: {
      ...currentApp,
      activeConditions: currentActive
    }
  };
};

/**
 * Adds or updates a custom condition
 */
export const saveCustomConditionOnCharacter = (character: Character, condition: BodyCondition): Character => {
  const currentApp = character.appearance || { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' };
  const customList = [...(currentApp.customConditions || [])];
  const idx = customList.findIndex(c => c.id === condition.id);

  if (idx > -1) {
    customList[idx] = condition;
  } else {
    customList.push(condition);
  }

  let activeList = [...(currentApp.activeConditions || [])];
  if (condition.isActive) {
    const actIdx = activeList.findIndex(c => c.id === condition.id);
    if (actIdx > -1) {
      activeList[actIdx] = condition;
    } else {
      activeList.push(condition);
    }
  } else {
    activeList = activeList.filter(c => c.id !== condition.id);
  }

  return {
    ...character,
    appearance: {
      ...currentApp,
      customConditions: customList,
      activeConditions: activeList
    }
  };
};

/**
 * Removes a condition from both active and custom pools
 */
export const removeConditionFromCharacter = (character: Character, conditionId: string): Character => {
  const currentApp = character.appearance || { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' };
  return {
    ...character,
    appearance: {
      ...currentApp,
      activeConditions: (currentApp.activeConditions || []).filter(c => c.id !== conditionId),
      customConditions: (currentApp.customConditions || []).filter(c => c.id !== conditionId)
    }
  };
};
