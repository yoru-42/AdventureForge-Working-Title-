import { Character, Appearance, NPC, PhysicalChangeItem, PhysicalChangeHistoryEntry, NPCAppearanceObservation } from '../types';
import { ResolvedBodyAppearance } from '../components/bodyConditionResolver';

/**
 * Parses numeric measurement safely
 */
const parseNumeric = (val: any, fallback: number): number => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const match = String(val).match(/-?\d+(\.\d+)?/);
  if (match) {
    const n = parseFloat(match[0]);
    return isNaN(n) ? fallback : n;
  }
  return fallback;
};

/**
 * Calculates physical changes and deltas comparing current resolved appearance with baseline standard appearance.
 */
export const calculatePhysicalChanges = (
  resolvedApp: ResolvedBodyAppearance,
  baseApp?: Appearance
): PhysicalChangeItem[] => {
  const changes: PhysicalChangeItem[] = [];

  // 1. Körpergröße (Height in cm)
  const stdHeight = resolvedApp.standardHeightCm || 170;
  const effHeight = resolvedApp.effectiveHeightCm || stdHeight;
  const heightDelta = Math.round((effHeight - stdHeight) * 10) / 10;
  if (Math.abs(heightDelta) >= 0.5) {
    changes.push({
      id: 'height',
      category: 'dimension',
      label: 'Körpergröße',
      type: 'numeric',
      baseValue: `${stdHeight} cm`,
      currentValue: `${effHeight} cm`,
      deltaDisplay: `${heightDelta > 0 ? `+${heightDelta}` : heightDelta} cm (${effHeight} cm)`,
      deltaNumeric: heightDelta,
      unit: 'cm',
      isSignificant: Math.abs(heightDelta) >= 3
    });
  }

  // 2. Gewicht (Weight in kg)
  const stdWeight = resolvedApp.standardWeightKg || 65;
  const effWeight = resolvedApp.effectiveWeightKg || stdWeight;
  const weightDelta = Math.round((effWeight - stdWeight) * 10) / 10;
  if (Math.abs(weightDelta) >= 0.5) {
    changes.push({
      id: 'weight',
      category: 'dimension',
      label: 'Gewicht',
      type: 'numeric',
      baseValue: `${stdWeight} kg`,
      currentValue: `${effWeight} kg`,
      deltaDisplay: `${weightDelta > 0 ? `+${weightDelta}` : weightDelta} kg (${effWeight} kg)`,
      deltaNumeric: weightDelta,
      unit: 'kg',
      isSignificant: Math.abs(weightDelta) >= 3
    });
  }

  // 3. Körpermaße (Bust - Waist - Hips)
  const stdMeasurements = resolvedApp.standardMeasurements || '88-60-90 cm';
  const effMeasurements = resolvedApp.effectiveMeasurements || stdMeasurements;
  
  const parseParts = (str: string) => {
    const cleaned = str.replace(/cm/gi, '').trim();
    const parts = cleaned.split('-').map(p => parseInt(p.trim()) || 0);
    return { bust: parts[0] || 0, waist: parts[1] || 0, hips: parts[2] || 0 };
  };

  const stdM = parseParts(stdMeasurements);
  const effM = parseParts(effMeasurements);

  if (stdM.bust > 0 && effM.bust > 0 && Math.abs(effM.bust - stdM.bust) >= 1) {
    const d = effM.bust - stdM.bust;
    changes.push({
      id: 'bust',
      category: 'dimension',
      label: 'Brustumfang',
      type: 'numeric',
      baseValue: `${stdM.bust} cm`,
      currentValue: `${effM.bust} cm`,
      deltaDisplay: `${d > 0 ? `+${d}` : d} cm (${effM.bust} cm)`,
      deltaNumeric: d,
      unit: 'cm',
      isSignificant: Math.abs(d) >= 3
    });
  }

  if (stdM.waist > 0 && effM.waist > 0 && Math.abs(effM.waist - stdM.waist) >= 1) {
    const d = effM.waist - stdM.waist;
    changes.push({
      id: 'waist',
      category: 'dimension',
      label: 'Taillenumfang',
      type: 'numeric',
      baseValue: `${stdM.waist} cm`,
      currentValue: `${effM.waist} cm`,
      deltaDisplay: `${d > 0 ? `+${d}` : d} cm (${effM.waist} cm)`,
      deltaNumeric: d,
      unit: 'cm',
      isSignificant: Math.abs(d) >= 3
    });
  }

  if (stdM.hips > 0 && effM.hips > 0 && Math.abs(effM.hips - stdM.hips) >= 1) {
    const d = effM.hips - stdM.hips;
    changes.push({
      id: 'hips',
      category: 'dimension',
      label: 'Hüftumfang',
      type: 'numeric',
      baseValue: `${stdM.hips} cm`,
      currentValue: `${effM.hips} cm`,
      deltaDisplay: `${d > 0 ? `+${d}` : d} cm (${effM.hips} cm)`,
      deltaNumeric: d,
      unit: 'cm',
      isSignificant: Math.abs(d) >= 3
    });
  }

  // 4. Körbchengröße (Cup size)
  const stdCup = resolvedApp.standardCupSize || '-';
  const effCup = resolvedApp.effectiveCupSize || stdCup;
  if (stdCup !== effCup && effCup !== '-') {
    changes.push({
      id: 'cupSize',
      category: 'dimension',
      label: 'Körbchengröße',
      type: 'qualitative',
      baseValue: stdCup,
      currentValue: effCup,
      deltaDisplay: `${stdCup} → ${effCup}`,
      isSignificant: true
    });
  }

  // 5. Körperfettanteil & Muskelmasse
  const stdFat = resolvedApp.standardBodyFat || 20;
  const effFat = resolvedApp.effectiveBodyFat || stdFat;
  const fatDelta = effFat - stdFat;
  if (Math.abs(fatDelta) >= 1) {
    changes.push({
      id: 'bodyFat',
      category: 'dimension',
      label: 'Körperfett',
      type: 'numeric',
      baseValue: `${stdFat}%`,
      currentValue: `${effFat}%`,
      deltaDisplay: `${fatDelta > 0 ? `+${fatDelta}` : fatDelta}% (${effFat}%)`,
      deltaNumeric: fatDelta,
      unit: '%',
      isSignificant: Math.abs(fatDelta) >= 3
    });
  }

  const stdMuscle = resolvedApp.standardMuscleMass || 30;
  const effMuscle = resolvedApp.effectiveMuscleMass || stdMuscle;
  const muscleDelta = effMuscle - stdMuscle;
  if (Math.abs(muscleDelta) >= 1) {
    changes.push({
      id: 'muscleMass',
      category: 'dimension',
      label: 'Muskelmasse',
      type: 'numeric',
      baseValue: `${stdMuscle}%`,
      currentValue: `${effMuscle}%`,
      deltaDisplay: `${muscleDelta > 0 ? `+${muscleDelta}` : muscleDelta}% (${effMuscle}%)`,
      deltaNumeric: muscleDelta,
      unit: '%',
      isSignificant: Math.abs(muscleDelta) >= 3
    });
  }

  // 6. Qualitative Merkmale (Geschlecht, Rasse, Statur, Haare, Augen, Haut)
  if (resolvedApp.standardGender && resolvedApp.effectiveGender && resolvedApp.standardGender.toLowerCase() !== resolvedApp.effectiveGender.toLowerCase()) {
    changes.push({
      id: 'gender',
      category: 'appearance',
      label: 'Geschlecht',
      type: 'qualitative',
      baseValue: resolvedApp.standardGender,
      currentValue: resolvedApp.effectiveGender,
      deltaDisplay: `verändert (${resolvedApp.standardGender} → ${resolvedApp.effectiveGender})`,
      isSignificant: true
    });
  }

  if (resolvedApp.standardRace && resolvedApp.effectiveRace && resolvedApp.standardRace.toLowerCase() !== resolvedApp.effectiveRace.toLowerCase()) {
    changes.push({
      id: 'race',
      category: 'appearance',
      label: 'Rasse',
      type: 'qualitative',
      baseValue: resolvedApp.standardRace,
      currentValue: resolvedApp.effectiveRace,
      deltaDisplay: `verändert (${resolvedApp.standardRace} → ${resolvedApp.effectiveRace})`,
      isSignificant: true
    });
  }

  if (resolvedApp.standardBuild && resolvedApp.effectiveBuild && resolvedApp.standardBuild.toLowerCase() !== resolvedApp.effectiveBuild.toLowerCase()) {
    changes.push({
      id: 'build',
      category: 'appearance',
      label: 'Körperbau',
      type: 'qualitative',
      baseValue: resolvedApp.standardBuild,
      currentValue: resolvedApp.effectiveBuild,
      deltaDisplay: `verändert (${resolvedApp.standardBuild} → ${resolvedApp.effectiveBuild})`,
      isSignificant: true
    });
  }

  if (resolvedApp.standardHairColor && resolvedApp.effectiveHairColor && resolvedApp.standardHairColor.toLowerCase() !== resolvedApp.effectiveHairColor.toLowerCase()) {
    changes.push({
      id: 'hairColor',
      category: 'appearance',
      label: 'Haare',
      type: 'qualitative',
      baseValue: resolvedApp.standardHairColor,
      currentValue: resolvedApp.effectiveHairColor,
      deltaDisplay: `verändert (${resolvedApp.standardHairColor} → ${resolvedApp.effectiveHairColor})`,
      isSignificant: true
    });
  }

  const stdEye = resolvedApp.standardEyeColor || '';
  const effEye = resolvedApp.effectiveHasHeterochromia
    ? `Heterochromie (${resolvedApp.effectiveEyeColorLeft || stdEye} / ${resolvedApp.effectiveEyeColorRight || stdEye})`
    : (resolvedApp.effectiveEyeColor || stdEye);
  
  if (stdEye.toLowerCase() !== effEye.toLowerCase() && effEye) {
    changes.push({
      id: 'eyeColor',
      category: 'appearance',
      label: 'Augen',
      type: 'qualitative',
      baseValue: stdEye,
      currentValue: effEye,
      deltaDisplay: `verändert (${stdEye} → ${effEye})`,
      isSignificant: true
    });
  }

  const stdSkin = resolvedApp.standardSkinTone || 'Natürlich';
  const effSkin = resolvedApp.effectiveSkinTone || stdSkin;
  if (stdSkin.toLowerCase() !== effSkin.toLowerCase()) {
    changes.push({
      id: 'skinTone',
      category: 'appearance',
      label: 'Hautton',
      type: 'qualitative',
      baseValue: stdSkin,
      currentValue: effSkin,
      deltaDisplay: `verändert (${stdSkin} → ${effSkin})`,
      isSignificant: true
    });
  }

  // 7. Besondere Merkmale (Flügel, Hörner)
  if (resolvedApp.effectiveWings) {
    changes.push({
      id: 'wings',
      category: 'feature',
      label: 'Flügel',
      type: 'qualitative',
      baseValue: 'Keine',
      currentValue: 'Aktiv',
      deltaDisplay: 'Neu gewachsen / aktiv',
      isSignificant: true
    });
  }

  if (resolvedApp.effectiveHorns) {
    changes.push({
      id: 'horns',
      category: 'feature',
      label: 'Hörner',
      type: 'qualitative',
      baseValue: 'Keine',
      currentValue: 'Sichtbar',
      deltaDisplay: 'Neu gewachsen / sichtbar',
      isSignificant: true
    });
  }

  // 8. Aktive körperliche Zustände / Flüche
  if (resolvedApp.activeConditionList && resolvedApp.activeConditionList.length > 0) {
    resolvedApp.activeConditionList.forEach(cond => {
      changes.push({
        id: `cond-${cond.id}`,
        category: 'condition',
        label: cond.name,
        type: 'qualitative',
        baseValue: 'Inaktiv',
        currentValue: cond.description,
        deltaDisplay: `Aktiv (${cond.name})`,
        isSignificant: true
      });
    });
  }

  return changes;
};

/**
 * Returns a concise, compact single-line string summarizing physical changes for HUD.
 */
export const getCompactChangesSummary = (changes: PhysicalChangeItem[]): string => {
  if (!changes || changes.length === 0) {
    return 'Keine Veränderungen';
  }

  const parts: string[] = [];

  // Prioritize dimensional deltas
  const height = changes.find(c => c.id === 'height');
  if (height) parts.push(`Größe: ${height.deltaNumeric && height.deltaNumeric > 0 ? `+${height.deltaNumeric}` : height.deltaNumeric} cm`);

  const bust = changes.find(c => c.id === 'bust');
  if (bust) parts.push(`Brust: ${bust.deltaNumeric && bust.deltaNumeric > 0 ? `+${bust.deltaNumeric}` : bust.deltaNumeric} cm`);

  const weight = changes.find(c => c.id === 'weight');
  if (weight) parts.push(`Gewicht: ${weight.deltaNumeric && weight.deltaNumeric > 0 ? `+${weight.deltaNumeric}` : weight.deltaNumeric} kg`);

  const build = changes.find(c => c.id === 'build');
  if (build) parts.push('Körperbau: verändert');

  const hair = changes.find(c => c.id === 'hairColor');
  if (hair) parts.push('Haare: verändert');

  const eye = changes.find(c => c.id === 'eyeColor');
  if (eye) parts.push('Augen: verändert');

  const wings = changes.find(c => c.id === 'wings');
  if (wings) parts.push('Flügel: aktiv');

  const horns = changes.find(c => c.id === 'horns');
  if (horns) parts.push('Hörner: sichtbar');

  const gender = changes.find(c => c.id === 'gender');
  if (gender) parts.push('Geschlecht: verändert');

  const race = changes.find(c => c.id === 'race');
  if (race) parts.push('Rasse: verändert');

  if (parts.length === 0) {
    // Other qualitative or subtle changes
    const firstOther = changes[0];
    return `${firstOther.label}: ${firstOther.deltaDisplay || 'verändert'}`;
  }

  return parts.slice(0, 3).join(' · ') + (parts.length > 3 ? ` (+${parts.length - 3})` : '');
};

/**
 * Evaluates the player's general physical condition for the HUD badge.
 */
export const getCompactBodyConditionSummary = (
  player: Character,
  resolvedApp: ResolvedBodyAppearance
): { statusText: string; detailText: string; isHealthy: boolean; severity: 'healthy' | 'minor' | 'moderate' | 'severe' } => {
  const injuries = resolvedApp.effectiveInjuries || '';
  const activeConditions = resolvedApp.activeConditionList || [];
  const silState = (player.appearance as any)?.silhouetteState || {};
  
  const painLevel = silState.painLevel || 'keine'; // keine, leicht, mittel, stark, unerträglich
  const fatigueLevel = silState.fatigueLevel || 'normal'; // normal, leicht, mittel, erschöpft, kollaps
  const pregMonthNum = typeof resolvedApp.pregnancyMonth === 'number' ? resolvedApp.pregnancyMonth : parseInt(String(resolvedApp.pregnancyMonth || '0'), 10) || 0;
  const isPregnant = pregMonthNum > 0 || (silState.pregnancyMonth > 0);
  const showPregnancyInHud = isPregnant && (silState.pregnancyTestDone || silState.pregnancyChangesVisible);

  const hasInjuries = injuries.trim().length > 0;
  const hasCurses = activeConditions.some(c => c.type === 'curse');
  const hormonalCond = activeConditions.find(c => 
    c.name.toLowerCase().includes('hormon') || 
    c.name.toLowerCase().includes('instabil') ||
    (c.description && (c.description.toLowerCase().includes('hormon') || c.description.toLowerCase().includes('erregung')))
  );
  const mentalCond = activeConditions.find(c => 
    c.name.toLowerCase().includes('mental') || 
    c.name.toLowerCase().includes('geist') || 
    (c.description && (c.description.toLowerCase().includes('mental') || c.description.toLowerCase().includes('kontrolle')))
  );
  const hasNegativeEffects = hasInjuries || hasCurses || Boolean(hormonalCond) || Boolean(mentalCond) || painLevel === 'stark' || fatigueLevel === 'erschöpft' || fatigueLevel === 'kollaps';

  const details: string[] = [];
  if (hasInjuries) {
    const firstInjury = injuries.split('|')[0]?.trim() || injuries;
    details.push(firstInjury);
  }
  if (hormonalCond) {
    details.push(hormonalCond.description ? (hormonalCond.description.length > 50 ? hormonalCond.description.substring(0, 48) + '...' : hormonalCond.description) : 'Hormonelle Beeinflussung');
  }
  if (mentalCond && mentalCond.id !== hormonalCond?.id) {
    details.push(mentalCond.name);
  }
  if (painLevel && painLevel !== 'keine') {
    details.push(`Schmerzen: ${painLevel}`);
  }
  if (fatigueLevel && fatigueLevel !== 'normal') {
    details.push(`Erschöpfung: ${fatigueLevel}`);
  }
  if (hasCurses && !hormonalCond && !mentalCond) {
    details.push('Fluch aktiv');
  }
  if (showPregnancyInHud) {
    const defaultDays = Math.max(0, 270 - (pregMonthNum - 1) * 30);
    const daysRemaining = silState.pregnancyDaysRemaining !== undefined ? silState.pregnancyDaysRemaining : defaultDays;
    details.push(`Schwanger (Noch ${daysRemaining} Tage bis Geburt)`);
  }

  if (!hasNegativeEffects && activeConditions.length === 0 && !showPregnancyInHud) {
    return {
      statusText: 'Gesund',
      detailText: 'Keine Verletzungen oder Beschwerden',
      isHealthy: true,
      severity: 'healthy'
    };
  }

  if (!hasNegativeEffects && activeConditions.length === 0) {
    return {
      statusText: 'Gesund',
      detailText: details.slice(0, 3).join(' · ') || 'Keine Beschwerden',
      isHealthy: true,
      severity: 'healthy'
    };
  }

  let statusText = 'Angeschlagen';
  let severity: 'healthy' | 'minor' | 'moderate' | 'severe' = 'minor';

  if (fatigueLevel === 'kollaps' || painLevel === 'unerträglich' || injuries.toLowerCase().includes('schwer') || injuries.toLowerCase().includes('tödlich')) {
    statusText = 'Kritisch';
    severity = 'severe';
  } else if (hormonalCond) {
    statusText = hormonalCond.name;
    severity = 'minor';
  } else if (mentalCond) {
    statusText = mentalCond.name;
    severity = 'minor';
  } else if (hasInjuries && hasCurses) {
    statusText = 'Geschwächt';
    severity = 'moderate';
  } else if (hasInjuries || hasCurses) {
    statusText = 'Angeschlagen';
    severity = 'minor';
  } else if (activeConditions.length > 0) {
    statusText = activeConditions[0].name;
    severity = 'minor';
  }

  return {
    statusText,
    detailText: details.slice(0, 3).join(' · ') || 'Leichte Beeinträchtigung',
    isHealthy: false,
    severity
  };
};

/**
 * Calculates which physical changes a specific NPC can actually observe and recognize.
 * Separation of physical reality vs. NPC perception threshold.
 */
export const calculateNpcPerceivedChanges = (
  player: Character,
  npc: NPC,
  currentApp: ResolvedBodyAppearance,
  observationMemory?: NPCAppearanceObservation
): {
  familiarity: 'unbekannt' | 'fluechtig' | 'bekannt' | 'vertraut' | 'intim';
  canNoticePastComparison: boolean;
  perceivedChanges: PhysicalChangeItem[];
  perceptionSummary: string;
} => {
  // Determine familiarity from relationship or observation memory
  let familiarity: 'unbekannt' | 'fluechtig' | 'bekannt' | 'vertraut' | 'intim' = observationMemory?.familiarity || 'unbekannt';

  // Check relationship definitions on player or NPC
  const rel = (npc.relationships || []).find(r => r.targetCharacter === player.name || r.id === player.name);
  if (rel) {
    const stance = (rel.type || rel.relationshipStatus || '').toLowerCase();
    if (stance.includes('ehe') || stance.includes('partner') || stance.includes('geliebte') || stance.includes('intim')) {
      familiarity = 'intim';
    } else if (stance.includes('freund') || stance.includes('familie') || stance.includes('geschwister') || stance.includes('vertraut')) {
      familiarity = 'vertraut';
    } else if (stance.includes('kollege') || stance.includes('bekannt') || stance.includes('rivale') || stance.includes('kamerad')) {
      familiarity = 'bekannt';
    } else if (stance.includes('flüchtig') || stance.includes('bekanntschaft')) {
      familiarity = 'fluechtig';
    }
  }

  // Strangers cannot compare to past appearances because they never saw the character before!
  if (familiarity === 'unbekannt') {
    return {
      familiarity: 'unbekannt',
      canNoticePastComparison: false,
      perceivedChanges: [],
      perceptionSummary: `${npc.name} ist ein Fremder und kennt das frühere Aussehen nicht. Der NPC bemerkt KEINE Veränderung und darf nicht sagen 'Du hast dich verändert', sondern nimmt nur das aktuelle Erscheinungsbild wahr.`
    };
  }

  // For known NPCs, compare against standard or last observed appearance
  const allChanges = calculatePhysicalChanges(currentApp);
  const perceivedChanges: PhysicalChangeItem[] = [];

  allChanges.forEach(change => {
    // Drastic changes (Wings, Horns, Gender, Race, large height changes)
    if (change.id === 'wings' || change.id === 'horns' || change.id === 'gender' || change.id === 'race') {
      perceivedChanges.push(change);
      return;
    }

    // Hair color or eye color change
    if (change.id === 'hairColor' || change.id === 'eyeColor') {
      if (familiarity !== 'fluechtig' || change.isSignificant) {
        perceivedChanges.push(change);
      }
      return;
    }

    // Height & Weight changes
    if (change.id === 'height' || change.id === 'weight') {
      const delta = Math.abs(change.deltaNumeric || 0);
      if (familiarity === 'intim' && delta >= 1) perceivedChanges.push(change);
      else if (familiarity === 'vertraut' && delta >= 2) perceivedChanges.push(change);
      else if (familiarity === 'bekannt' && delta >= 5) perceivedChanges.push(change);
      else if (familiarity === 'fluechtig' && delta >= 10) perceivedChanges.push(change);
      return;
    }

    // Measurements / Breast / Body build
    if (change.id === 'bust' || change.id === 'cupSize' || change.id === 'build') {
      if (familiarity === 'intim') perceivedChanges.push(change);
      else if (familiarity === 'vertraut' && change.isSignificant) perceivedChanges.push(change);
      else if (familiarity === 'bekannt' && (change.id === 'build' || change.id === 'cupSize')) perceivedChanges.push(change);
      return;
    }

    // Other changes
    if (familiarity === 'intim' || (familiarity === 'vertraut' && change.isSignificant)) {
      perceivedChanges.push(change);
    }
  });

  const changeListStr = perceivedChanges.map(c => `${c.label} (${c.deltaDisplay})`).join(', ');
  const perceptionSummary = perceivedChanges.length > 0
    ? `${npc.name} (Vertrautheitsgrad: ${familiarity}) kann folgende Veränderungen bemerken: ${changeListStr}.`
    : `${npc.name} bemerkt bei der aktuellen Veränderungsintensität noch keine auffälligen Abweichungen vom gewohnten Bild.`;

  return {
    familiarity,
    canNoticePastComparison: true,
    perceivedChanges,
    perceptionSummary
  };
};

/**
 * Builds the comprehensive AI context block for Gemini ensuring strict realism:
 * 1. True physical condition (wounds, pain, fatigue)
 * 2. True physical changes & deltas
 * 3. NPC perception boundaries (stranger vs. acquaintance)
 */
export const buildPhysicalStatusAndPerceptionPrompt = (
  player: Character,
  resolvedApp: ResolvedBodyAppearance,
  activeInterlocutorNpc?: NPC | null,
  allNpcs?: NPC[],
  npcMemory?: Record<string, NPCAppearanceObservation>
): string => {
  const parts: string[] = [];

  // 1. Physischer Gesamtzustand
  const condSummary = getCompactBodyConditionSummary(player, resolvedApp);
  parts.push(`[KÖRPERLICHER ZUSTAND DES SPIELERS]: Status: ${condSummary.statusText} (${condSummary.detailText}).`);
  if (resolvedApp.effectiveInjuries) {
    parts.push(`- Wunden & Verletzungen: ${resolvedApp.effectiveInjuries}. (Die Umwelt und Reaktionen müssen diese Wunden respektieren).`);
  }

  // 2. Tatsächliche körperliche Veränderungen & Deltas
  const changes = calculatePhysicalChanges(resolvedApp);
  if (changes.length > 0) {
    parts.push(`[TATSÄCHLICHE KÖRPERLICHE VERÄNDERUNGEN (PHYSICAL CHANGE TRACKER)]:
${changes.map(c => `* ${c.label}: ${c.deltaDisplay} [Ursprung: ${c.baseValue} → Aktuell: ${c.currentValue}]`).join('\n')}`);
  } else {
    parts.push(`[TATSÄCHLICHE KÖRPERLICHE VERÄNDERUNGEN]: Keine aktiven Abweichungen von der Standardgestalt.`);
  }

  // 3. NPC-Wahrnehmungsgrenzen (Appearance Memory & Familiarity)
  if (activeInterlocutorNpc) {
    const memory = npcMemory ? npcMemory[activeInterlocutorNpc.id || activeInterlocutorNpc.name] : undefined;
    const npcPerception = calculateNpcPerceivedChanges(player, activeInterlocutorNpc, resolvedApp, memory);

    parts.push(`[NPC-WAHRNEHMUNG BEI "${activeInterlocutorNpc.name}"]:
- Bekanntheitsgrad: ${npcPerception.familiarity}
- ${npcPerception.perceptionSummary}
- REGEL FÜR DIE KI: ${npcPerception.canNoticePastComparison ? 'Der NPC darf auf die oben genannten bemerkbaren Veränderungen reagieren (subtil oder erstaunt, passend zur Persönlichkeit).' : 'Der NPC ist ein FREMDER und hat den Spieler noch nie zuvor gesehen. Er darf NIEMALS sagen "Du hast dich verändert" oder Veränderungen kommentieren, als kenne er ein Vorher-Bild! Er nimmt den Spieler genau so wahr, wie er jetzt vor ihm steht.'}`);
  } else {
    parts.push(`[NPC-WAHRNEHMUNG]: Fremde NPCs nehmen den Spieler rein im aktuellen Zustand wahr und kennen keine Vorher-Bilder.`);
  }

  return parts.join('\n');
};
