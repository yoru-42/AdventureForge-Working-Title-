// -*- coding: utf-8 -*-
import {
  CharacterRank,
  DevelopmentProfileType,
  DevelopmentProfile,
  ProgressionConfig,
  ProgressionState,
  ProgressionResult,
  CharacterAttribute,
  Character,
  CampaignPowerParameter
} from '../types';
import RaceService, { RaceDefinition } from './raceService';

/**
 * Standard-Rangfolge im AdventureForge-System: F -> E -> D -> C -> B -> A -> S
 */
export const STANDARD_RANKS: CharacterRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S'];

/**
 * Vordefinierte Entwicklungsprofile zur flexiblen Steuerung des Entwicklungstempos.
 */
export const DEFAULT_DEVELOPMENT_PROFILES: Record<DevelopmentProfileType, DevelopmentProfile> = {
  verySlow: {
    name: 'verySlow',
    label: 'Sehr langsam',
    description: 'Deutlich verzögerter Fortschritt für langanhaltende, anspruchsvolle Kampagnen.',
    epGainMultiplier: 0.5,
    epRequirementMultiplier: 1.5,
    attributeGrowthMultiplier: 0.5
  },
  slow: {
    name: 'slow',
    label: 'Langsam',
    description: 'Gemächlicher Fortschritt mit leicht erhöhtem EP-Bedarf.',
    epGainMultiplier: 0.75,
    epRequirementMultiplier: 1.25,
    attributeGrowthMultiplier: 0.75
  },
  normal: {
    name: 'normal',
    label: 'Normal',
    description: 'Standardmäßiges, ausgewogenes Entwicklungstempo.',
    epGainMultiplier: 1.0,
    epRequirementMultiplier: 1.0,
    attributeGrowthMultiplier: 1.0
  },
  fast: {
    name: 'fast',
    label: 'Schnell',
    description: 'Beschleunigte Progression für dynamische, rasche Spielentwicklung.',
    epGainMultiplier: 1.5,
    epRequirementMultiplier: 0.85,
    attributeGrowthMultiplier: 1.25
  },
  veryFast: {
    name: 'veryFast',
    label: 'Sehr schnell',
    description: 'Rasanter Fortschritt mit hohem EP-Gewinn.',
    epGainMultiplier: 2.5,
    epRequirementMultiplier: 0.7,
    attributeGrowthMultiplier: 1.5
  },
  custom: {
    name: 'custom',
    label: 'Individuell',
    description: 'Frei definierte Multiplikatoren und Entwicklungswerte.',
    epGainMultiplier: 1.0,
    epRequirementMultiplier: 1.0,
    attributeGrowthMultiplier: 1.0
  },
  balanced: {
    name: 'balanced',
    label: 'Ausgewogen (Standard)',
    description: 'Standardmäßiges, ausgewogenes Entwicklungstempo.',
    epGainMultiplier: 1.0,
    epRequirementMultiplier: 1.0,
    attributeGrowthMultiplier: 1.0
  },
  fast_start: {
    name: 'fast_start',
    label: 'Schneller Einstieg / Frühblüher',
    description: 'Schneller anfänglicher Fortschritt.',
    epGainMultiplier: 1.5,
    epRequirementMultiplier: 0.85,
    attributeGrowthMultiplier: 1.25
  },
  focused: {
    name: 'focused',
    label: 'Fokussiert / Spezialist',
    description: 'Gezielte, konzentrierte Werteentwicklung.',
    epGainMultiplier: 1.25,
    epRequirementMultiplier: 1.0,
    attributeGrowthMultiplier: 1.25
  },
  late_bloomer: {
    name: 'late_bloomer',
    label: 'Spätentwickler (Hohes Potenzial)',
    description: 'Langsamerer Anfang mit gewaltigem Endgame-Potenzial.',
    epGainMultiplier: 0.8,
    epRequirementMultiplier: 1.2,
    attributeGrowthMultiplier: 1.5
  },
  slow_growth: {
    name: 'slow_growth',
    label: 'Langsames Wachstum',
    description: 'Gleichmäßiges, anspruchsvolles Entwicklungstempo.',
    epGainMultiplier: 0.7,
    epRequirementMultiplier: 1.3,
    attributeGrowthMultiplier: 0.8
  }
};

/**
 * Standard-Progressionskonfiguration für AdventureForge.
 */
export const DEFAULT_PROGRESSION_CONFIG: ProgressionConfig = {
  rankSystem: {
    enabled: true,
    ranks: [...STANDARD_RANKS],
    startRank: 'F',
    autoRankUp: true,
    requiresMaxLevelForRankUp: true,
    minXpForRankUp: 0
  },
  levelSystem: {
    enabled: true,
    startLevel: 1,
    levelsPerRank: 10,
    maxLevel: 1000,
    resetLevelOnRankUp: true
  },
  epSystem: {
    enabled: true,
    requirementMode: 'level_and_rank_growth',
    baseRequirement: 100,
    levelGrowth: 20,
    rankGrowth: 100,
    multiplier: 1.0,
    maxRequirement: 50000
  },
  developmentRate: {
    epGainMultiplier: 1.0,
    epRequirementMultiplier: 1.0,
    attributeGrowthMultiplier: 1.0
  },
  attributeProgression: {
    baseGrowthPerLevel: 2,
    rankGrowthMultiplier: 4,
    usePotentialForGrowth: true,
    maxAttributeValue: 1000,
    minAttributeValue: 0,
    enforcePotentialCap: false,
    potentialCap: 1000,
    allowIndividualPotentialVariance: true
  },
  developmentProfiles: DEFAULT_DEVELOPMENT_PROFILES,
  activeProfile: 'normal'
};

/**
 * Zentrale Progressionslogik für AdventureForge.
 * Verwaltet Rang, Level, EP-Bedarf, EP-Gewinn, Attributwachstum und Entwicklungsprofile
 * für Spieler, NPCs, Fähigkeiten, Techniken und automatische Generierung deterministisch.
 */
export class ProgressionService {
  /**
   * Erzeugt eine frische Standardkonfiguration.
   */
  static createDefaultProgressionConfig(): ProgressionConfig {
    return JSON.parse(JSON.stringify(DEFAULT_PROGRESSION_CONFIG));
  }

  /**
   * Ermittelt das aktive Entwicklungsprofil anhand der Konfiguration oder eines Overrides.
   */
  static getDevelopmentProfile(
    profileType?: DevelopmentProfileType,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
  ): DevelopmentProfile {
    const key = profileType || config.activeProfile || 'normal';
    const profiles = config.developmentProfiles || DEFAULT_DEVELOPMENT_PROFILES;
    return profiles[key] || profiles.normal || DEFAULT_DEVELOPMENT_PROFILES.normal;
  }

  /**
   * Ermittelt den Index des Rangs in der Rangliste (0 für 'F', 1 für 'E', etc.).
   */
  static getRankIndex(rank?: string, config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG): number {
    if (!rank || !config.rankSystem?.enabled) return 0;
    const ranks = config.rankSystem.ranks || STANDARD_RANKS;
    const cleanRank = rank.trim().toUpperCase();
    const idx = ranks.findIndex(r => String(r).trim().toUpperCase() === cleanRank);
    return idx >= 0 ? idx : 0;
  }

  /**
   * Berechnet den exakten EP-Bedarf für das Erreichen des nächsten Levels.
   */
  static calculateXpRequirement(
    level: number = 1,
    rank?: string,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG,
    profileType?: DevelopmentProfileType
  ): number {
    if (!config.epSystem?.enabled) {
      return 0;
    }

    const profile = this.getDevelopmentProfile(profileType, config);
    const mode = config.epSystem.requirementMode || 'level_growth';
    const baseReq = config.epSystem.baseRequirement ?? 100;
    const lvlGrowth = config.epSystem.levelGrowth ?? 20;
    const rnkGrowth = config.epSystem.rankGrowth ?? 100;
    const multiplier = config.epSystem.multiplier ?? 1.0;

    const rateReqMult = config.developmentRate?.epRequirementMultiplier ?? 1.0;
    const profileReqMult = profile.epRequirementMultiplier ?? 1.0;
    const totalReqMult = multiplier * rateReqMult * profileReqMult;

    const rankIdx = this.getRankIndex(rank, config);
    const safeLevel = Math.max(1, Math.floor(level));

    let rawRequirement = baseReq;

    switch (mode) {
      case 'fixed':
        rawRequirement = baseReq;
        break;

      case 'level_growth':
        rawRequirement = baseReq + (safeLevel - 1) * lvlGrowth;
        break;

      case 'level_and_rank_growth':
        rawRequirement = baseReq + (safeLevel - 1) * lvlGrowth + rankIdx * rnkGrowth;
        break;

      default:
        rawRequirement = baseReq + (safeLevel - 1) * lvlGrowth;
        break;
    }

    let calculated = Math.round(rawRequirement * totalReqMult);

    if (config.epSystem.maxRequirement && config.epSystem.maxRequirement > 0) {
      calculated = Math.min(calculated, config.epSystem.maxRequirement);
    }

    return Math.max(1, calculated);
  }

  /**
   * Berechnet den effektiven EP-Gewinn unter Berücksichtigung von epGainMultiplier.
   */
  static calculateEffectiveXpGain(
    rawXpGain: number,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG,
    profileType?: DevelopmentProfileType
  ): number {
    if (rawXpGain <= 0) return 0;
    const profile = this.getDevelopmentProfile(profileType, config);
    const rateGainMult = config.developmentRate?.epGainMultiplier ?? 1.0;
    const profileGainMult = profile.epGainMultiplier ?? 1.0;
    const effective = Math.round(rawXpGain * rateGainMult * profileGainMult);
    return Math.max(0, effective);
  }

  /**
   * Prüft, ob ein Charakter den maximal möglichen Entwicklungsstand (letzter Rang & maximales Level des Rangs) erreicht hat.
   */
  static isAtMaxProgression(
    currentRank: string | undefined,
    currentLevel: number,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG,
    levelsPerRankOverride?: number
  ): boolean {
    if (config.rankSystem?.enabled && currentRank) {
      const ranks = config.rankSystem.ranks || STANDARD_RANKS;
      const cleanRank = currentRank.trim().toUpperCase();
      const rankIdx = ranks.findIndex(r => String(r).trim().toUpperCase() === cleanRank);
      const isLastRank = rankIdx >= ranks.length - 1;
      const levelsPerRank = levelsPerRankOverride || config.levelSystem?.levelsPerRank || 10;
      const rankMaxLevel = config.levelSystem?.resetLevelOnRankUp
        ? levelsPerRank
        : (rankIdx + 1) * levelsPerRank;

      return isLastRank && currentLevel >= rankMaxLevel;
    }

    if (config.levelSystem?.enabled) {
      const maxLvl = config.levelSystem.maxLevel ?? 1000;
      return currentLevel >= maxLvl;
    }

    return false;
  }

  /**
   * Prüft, ob ein Rangaufstieg möglich ist.
   */
  static checkRankUpConditions(
    currentRank: string = 'F',
    currentLevel: number = 1,
    currentXp: number = 0,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG,
    levelsPerRankOverride?: number
  ): { canRankUp: boolean; nextRank?: string; reason?: string } {
    if (!config.rankSystem?.enabled) {
      return { canRankUp: false, reason: 'Rangsystem deaktiviert' };
    }

    const ranks = config.rankSystem.ranks || STANDARD_RANKS;
    const cleanRank = currentRank.trim().toUpperCase();
    const rankIndex = ranks.findIndex(r => String(r).trim().toUpperCase() === cleanRank);

    if (rankIndex === -1) {
      return { canRankUp: false, reason: 'Ungültiger Rang' };
    }

    if (rankIndex >= ranks.length - 1) {
      return { canRankUp: false, reason: 'Höchster Rang bereits erreicht' };
    }

    const nextRank = String(ranks[rankIndex + 1]);

    if (config.rankSystem.requiresMaxLevelForRankUp) {
      const levelsPerRank = levelsPerRankOverride || config.levelSystem?.levelsPerRank || 10;
      const currentRankMaxLvl = config.levelSystem?.resetLevelOnRankUp
        ? levelsPerRank
        : (rankIndex + 1) * levelsPerRank;

      if (currentLevel < currentRankMaxLvl) {
        return {
          canRankUp: false,
          nextRank,
          reason: `Maximales Level des Rangs (${levelsPerRank}) noch nicht erreicht (aktuell: ${currentLevel})`
        };
      }
    }

    const minXp = config.rankSystem.minXpForRankUp ?? 0;
    if (minXp > 0 && currentXp < minXp) {
      return {
        canRankUp: false,
        nextRank,
        reason: `Mindest-EP für Rangaufstieg (${minXp}) nicht erreicht (aktuell verfügbar: ${currentXp})`
      };
    }

    return { canRankUp: true, nextRank };
  }

  /**
   * Wendet einen EP-Gewinn auf einen ProgressionState an.
   */
  static applyXpGain(
    currentState: ProgressionState,
    rawXpGain: number,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG,
    profileOverride?: DevelopmentProfileType
  ): ProgressionResult {
    const profileKey = profileOverride || currentState.developmentProfile || config.activeProfile || 'normal';
    
    const rateGainMult = currentState.epGainMultiplier ?? config.developmentRate?.epGainMultiplier ?? 1.0;
    const profileGainMult = this.getDevelopmentProfile(profileKey, config).epGainMultiplier ?? 1.0;
    const effectiveGain = Math.round(rawXpGain * rateGainMult * profileGainMult);

    let currentLvl = currentState.level ?? 1;
    let currentXp = (currentState.xp ?? 0) + Math.max(0, effectiveGain);
    let currentRank: string | undefined = config.rankSystem?.enabled
      ? (currentState.rank || String(config.rankSystem?.ranks?.[0] || 'F'))
      : undefined;

    const levelsPerRank = currentState.levelsPerRank ?? config.levelSystem?.levelsPerRank ?? 10;
    const resetLevelOnRankUp = currentState.resetLevelOnRankUp ?? config.levelSystem?.resetLevelOnRankUp ?? true;

    if (!config.levelSystem?.enabled) {
      return {
        previousState: { ...currentState },
        newState: {
          ...currentState,
          level: currentLvl,
          xp: currentXp,
          xpNeeded: 0,
          rank: currentRank,
          rankIndex: currentRank ? this.getRankIndex(currentRank, config) : undefined,
          developmentProfile: profileKey
        },
        gainedXp: effectiveGain,
        levelsGained: 0,
        rankUps: [],
        levelUpEvents: [],
        attributePointsEarned: 0
      };
    }

    let levelsGained = 0;
    const rankUps: { fromRank: string; toRank: string }[] = [];
    const levelUpEvents: { level: number; rank?: string; xpNeeded: number }[] = [];

    while (true) {
      // 1. Prüfe, ob die absolute Maximalprogression erreicht ist
      if (this.isAtMaxProgression(currentRank, currentLvl, config, levelsPerRank)) {
        break;
      }

      // 2. Prüfe Rangaufstieg, falls aktuelles Level bereits das Maximallevel des Rangs erreicht hat
      if (config.rankSystem?.enabled && currentRank) {
        const currentRankIdx = this.getRankIndex(currentRank, config);
        const currentRankMaxLvl = resetLevelOnRankUp
          ? levelsPerRank
          : (currentRankIdx + 1) * levelsPerRank;

        if (currentLvl >= currentRankMaxLvl) {
          const rankCheck = this.checkRankUpConditions(currentRank, currentLvl, currentXp, config, levelsPerRank);
          if (rankCheck.canRankUp && rankCheck.nextRank) {
            const oldRank = currentRank;
            currentRank = rankCheck.nextRank;
            rankUps.push({ fromRank: oldRank, toRank: currentRank });

            if (resetLevelOnRankUp) {
              currentLvl = 1;
            }
            continue;
          }
        }
      }

      // 3. EP-Bedarf für das aktuelle Level und den aktuellen Rang berechnen
      const xpReq = this.calculateXpRequirement(currentLvl, currentRank, config, profileKey);

      if (currentXp >= xpReq) {
        currentXp -= xpReq;
        currentLvl += 1;
        levelsGained += 1;

        levelUpEvents.push({
          level: currentLvl,
          rank: currentRank,
          xpNeeded: xpReq
        });

        // 4. Prüfe Rangaufstieg bei Erreichen des Maximallevels pro Rang
        if (config.rankSystem?.enabled && currentRank) {
          const currentRankIdx = this.getRankIndex(currentRank, config);
          const currentRankMaxLvl = resetLevelOnRankUp
            ? levelsPerRank
            : (currentRankIdx + 1) * levelsPerRank;

          if (currentLvl >= currentRankMaxLvl) {
            const rankCheck = this.checkRankUpConditions(currentRank, currentLvl, currentXp, config, levelsPerRank);
            if (rankCheck.canRankUp && rankCheck.nextRank) {
              const oldRank = currentRank;
              currentRank = rankCheck.nextRank;
              rankUps.push({ fromRank: oldRank, toRank: currentRank });

              if (resetLevelOnRankUp) {
                currentLvl = 1;
              }
            }
          }
        }
      } else {
        break;
      }
    }

    const atMax = this.isAtMaxProgression(currentRank, currentLvl, config, levelsPerRank);
    const nextXpNeeded = atMax
      ? 0
      : this.calculateXpRequirement(currentLvl, currentRank, config, profileKey);

    const rankIdx = currentRank ? this.getRankIndex(currentRank, config) : undefined;
    const baseGrowth = config.attributeProgression?.baseGrowthPerLevel ?? 2;
    const pointsEarned = levelsGained * baseGrowth;

    // Parameterwachstum anwenden bei gewonnenen Leveln oder Rangaufstiegen
    let updatedPowerLevels: Record<string, { value: number; potentialMax?: number }> | undefined = undefined;
    const rankUpsCount = rankUps.length;
    const charRace = currentState.race || 'Mensch';
    const charRaceFactors = currentState.raceGrowthFactors || RaceService.getRaceGrowthFactors(charRace);
    const charDevRate = currentState.developmentRateMultiplier ?? currentState.developmentRate ?? config.developmentRate?.attributeGrowthMultiplier ?? 1.0;

    if ((levelsGained !== 0 || rankUpsCount > 0) && currentState.campaignPowerLevels) {
      const scaleMax = config.attributeProgression?.maxAttributeValue ?? 1000;
      const scaleMin = config.attributeProgression?.minAttributeValue ?? 0;
      updatedPowerLevels = this.applyLevelUpToPowerLevels(
        currentState.campaignPowerLevels,
        levelsGained,
        config,
        profileKey,
        scaleMax,
        scaleMin,
        undefined,
        {
          potential: currentState.potential,
          parameterGrowthFactors: currentState.parameterGrowthFactors || config.attributeProgression?.parameterGrowthFactors,
          parameterGrowthPoints: currentState.parameterGrowthPoints,
          raceGrowthFactors: charRaceFactors,
          race: charRace,
          rankUpsCount,
          developmentRateMultiplier: charDevRate,
          rankGrowthBonus: currentState.rankGrowthBonus,
          rankGrowthMultiplier: currentState.rankGrowthMultiplier ?? config.attributeProgression?.rankGrowthMultiplier
        }
      );
    }

    const newState: ProgressionState = {
      ...currentState,
      level: currentLvl,
      xp: currentXp,
      xpNeeded: nextXpNeeded,
      rank: currentRank,
      rankIndex: rankIdx,
      developmentProfile: profileKey,
      points: (currentState.points ?? 0) + pointsEarned,
      race: charRace,
      raceGrowthFactors: charRaceFactors,
      campaignPowerLevels: updatedPowerLevels || currentState.campaignPowerLevels
    };

    return {
      previousState: { ...currentState },
      newState,
      gainedXp: effectiveGain,
      levelsGained,
      rankUps,
      levelUpEvents,
      attributePointsEarned: pointsEarned,
      updatedPowerLevels
    };
  }

  /**
   * Berechnet den individuellen Zuwachs für einen einzelnen Parameter.
   * Berücksichtigt:
   * - Basis-Wachstum (baseGrowthPerLevel)
   * - Parameter-/Rassenfaktor (parameterGrowthFactors / raceGrowthFactors)
   * - Potenzialfaktor (Potenzial als Wachstumsgeschwindigkeit, NICHT als Cap)
   * - Globale Entwicklungsrate (developmentRate.attributeGrowthMultiplier)
   * - Entwicklungsprofil (profile.attributeGrowthMultiplier)
   * - Rang-Wachstumsfaktor (rankGrowthMultiplier bei Rangaufstieg)
   */
  static calculateParameterGrowth(params: {
    parameterName: string;
    currentValue?: number;
    baseGrowth?: number;
    parameterGrowthPoints?: Record<string, number>;
    parameterGrowthFactors?: Record<string, number>;
    raceGrowthFactors?: Record<string, number>;
    race?: string;
    customRaces?: RaceDefinition[];
    potential?: number | string;
    parameterPotentialPercentages?: Record<string, number>;
    developmentRateMultiplier?: number;
    profileMultiplier?: number;
    rankGrowthMultiplier?: number;
    rankGrowthBonus?: number;
    isRankUp?: boolean;
    usePotentialForGrowth?: boolean;
  }): number {
    const {
      parameterName,
      baseGrowth = 2,
      parameterGrowthPoints,
      parameterGrowthFactors = {},
      raceGrowthFactors,
      race,
      customRaces,
      potential = 1000,
      parameterPotentialPercentages,
      developmentRateMultiplier = 1.0,
      profileMultiplier = 1.0,
      rankGrowthMultiplier = 4,
      rankGrowthBonus,
      isRankUp = false,
      usePotentialForGrowth = true
    } = params;

    const pKey = (parameterName || '').trim();

    // 1. Rassenfaktoren bestimmen (Fallback: Mensch)
    const effectiveRaceFactors =
      raceGrowthFactors ||
      RaceService.getRaceGrowthFactors(race || 'Mensch', customRaces);

    // 2. Punkt- oder Faktor-Wachstum ermitteln
    let effectivePointBase = baseGrowth;
    if (parameterGrowthPoints && typeof parameterGrowthPoints[pKey] === 'number') {
      effectivePointBase = parameterGrowthPoints[pKey];
    } else if (parameterGrowthPoints) {
      const lowerKey = pKey.toLowerCase();
      const foundKey = Object.keys(parameterGrowthPoints).find(k => k.toLowerCase() === lowerKey);
      if (foundKey && typeof parameterGrowthPoints[foundKey] === 'number') {
        effectivePointBase = parameterGrowthPoints[foundKey];
      }
    } else {
      let paramFactor = 1.0;
      if (parameterGrowthFactors && typeof parameterGrowthFactors[pKey] === 'number') {
        paramFactor = parameterGrowthFactors[pKey];
      } else if (parameterGrowthFactors) {
        const lowerKey = pKey.toLowerCase();
        const foundKey = Object.keys(parameterGrowthFactors).find(k => k.toLowerCase() === lowerKey);
        if (foundKey && typeof parameterGrowthFactors[foundKey] === 'number') {
          paramFactor = parameterGrowthFactors[foundKey];
        }
      }
      effectivePointBase = baseGrowth * paramFactor;
    }

    // 3. Rassenfaktor für den spezifischen Parameter
    let raceFactor = 1.0;
    if (effectiveRaceFactors && typeof effectiveRaceFactors[pKey] === 'number') {
      raceFactor = effectiveRaceFactors[pKey];
    } else if (effectiveRaceFactors) {
      const lowerKey = pKey.toLowerCase();
      const foundKey = Object.keys(effectiveRaceFactors).find(k => k.toLowerCase() === lowerKey);
      if (foundKey && typeof effectiveRaceFactors[foundKey] === 'number') {
        raceFactor = effectiveRaceFactors[foundKey];
      }
    }

    // 4. Potenzialfaktor berechnen (bevorzugt individuelles Parameter-Potential, falls vorhanden)
    let potentialFactor = 1.0;
    if (usePotentialForGrowth) {
      let rawPot: number | undefined = undefined;
      if (parameterPotentialPercentages) {
        if (typeof parameterPotentialPercentages[pKey] === 'number') {
          rawPot = parameterPotentialPercentages[pKey];
        } else {
          const lowerKey = pKey.toLowerCase();
          const found = Object.keys(parameterPotentialPercentages).find(k => k.toLowerCase() === lowerKey);
          if (found && typeof parameterPotentialPercentages[found] === 'number') {
            rawPot = parameterPotentialPercentages[found];
          }
        }
      }

      if (rawPot === undefined) {
        const potNum =
          typeof potential === 'number' && !isNaN(potential)
            ? potential
            : typeof potential === 'string'
            ? parseFloat(potential) || 100
            : 100;
        rawPot = potNum;
      }

      const potPercent = rawPot > 200 ? rawPot / 10 : rawPot;
      potentialFactor = Math.max(0.01, Math.min(3.0, potPercent / 100));
    }

    // 5. Grundformel
    const baseDevGrowth =
      effectivePointBase * raceFactor * potentialFactor * developmentRateMultiplier * profileMultiplier;

    // 6. Rangfaktor anwenden
    let effectiveRankMult = rankGrowthMultiplier;
    if (typeof rankGrowthBonus === 'number') {
      effectiveRankMult = 1 + rankGrowthBonus / 100;
    }
    const rawGrowth = isRankUp ? baseDevGrowth * effectiveRankMult : baseDevGrowth;

    return Math.round(rawGrowth * 100) / 100;
  }

  /**
   * Berechnet den aktuellen Parameterwert aus Basiswert, Level, Rang, Entwicklungspunkten und Wachstumsregeln.
   * Verbindet Level und EP mit der bestehenden Parameter-Progression, ohne das individuelle Maximum anzutasten.
   */
  static calculateParameterValueForLevel(params: {
    parameterName: string;
    baseValue: number;
    level?: number;
    rank?: string;
    xp?: number;
    config?: ProgressionConfig;
    profileType?: DevelopmentProfileType;
    race?: string;
    customRaces?: RaceDefinition[];
    potential?: number | string;
    parameterPotentialPercentages?: Record<string, number>;
    parameterGrowthPoints?: Record<string, number>;
    parameterGrowthFactors?: Record<string, number>;
    developmentRateMultiplier?: number;
    rankGrowthBonus?: number;
    rankGrowthMultiplier?: number;
    levelsPerRank?: number;
    baseGrowthPerLevel?: number;
    potentialMax?: number;
    minValue?: number;
    manualDelta?: number;
  }): number {
    const {
      parameterName,
      baseValue,
      level = 1,
      rank = 'F',
      config = DEFAULT_PROGRESSION_CONFIG,
      profileType = 'normal',
      race = 'Mensch',
      customRaces,
      potential = 100,
      parameterPotentialPercentages,
      parameterGrowthPoints,
      parameterGrowthFactors,
      developmentRateMultiplier = 1.0,
      rankGrowthBonus = 25,
      rankGrowthMultiplier,
      levelsPerRank: levelsPerRankProp,
      baseGrowthPerLevel,
      potentialMax,
      minValue = 1,
      manualDelta = 0
    } = params;

    const safeLevel = Math.max(1, Math.floor(level));
    const effectiveLevelsPerRank = levelsPerRankProp ?? config.levelSystem?.levelsPerRank ?? 10;
    const resetLevelOnRankUp = config.levelSystem?.resetLevelOnRankUp ?? true;
    const rankIndex = this.getRankIndex(rank, config);

    let totalLevelsGained = 0;
    let rankUpsCount = 0;

    if (config.rankSystem?.enabled && rankIndex > 0) {
      rankUpsCount = rankIndex;
      if (resetLevelOnRankUp) {
        totalLevelsGained = rankIndex * effectiveLevelsPerRank + (safeLevel - 1);
      } else {
        totalLevelsGained = Math.max(0, safeLevel - 1);
      }
    } else {
      totalLevelsGained = Math.max(0, safeLevel - 1);
    }

    const effectiveBaseGrowth = typeof baseGrowthPerLevel === 'number' && !isNaN(baseGrowthPerLevel) && baseGrowthPerLevel > 0
      ? baseGrowthPerLevel
      : (config.attributeProgression?.baseGrowthPerLevel ?? 2);

    const profile = this.getDevelopmentProfile(profileType, config);
    const profileMult = profile.attributeGrowthMultiplier ?? 1.0;
    const devRateMult = typeof developmentRateMultiplier === 'number' && !isNaN(developmentRateMultiplier)
      ? developmentRateMultiplier
      : (config.developmentRate?.attributeGrowthMultiplier ?? 1.0);

    const lvlGrowth = this.calculateParameterGrowth({
      parameterName,
      baseGrowth: effectiveBaseGrowth,
      parameterGrowthPoints,
      parameterGrowthFactors: parameterGrowthFactors || config.attributeProgression?.parameterGrowthFactors,
      race,
      customRaces,
      potential,
      parameterPotentialPercentages,
      developmentRateMultiplier: devRateMult,
      profileMultiplier: profileMult,
      rankGrowthMultiplier: rankGrowthMultiplier ?? config.attributeProgression?.rankGrowthMultiplier ?? 4,
      rankGrowthBonus,
      isRankUp: false,
      usePotentialForGrowth: config.attributeProgression?.usePotentialForGrowth ?? true
    });

    let rankGrowth = 0;
    if (rankUpsCount > 0) {
      const rnkGrowthUnit = this.calculateParameterGrowth({
        parameterName,
        baseGrowth: effectiveBaseGrowth,
        parameterGrowthPoints,
        parameterGrowthFactors: parameterGrowthFactors || config.attributeProgression?.parameterGrowthFactors,
        race,
        customRaces,
        potential,
        parameterPotentialPercentages,
        developmentRateMultiplier: devRateMult,
        profileMultiplier: profileMult,
        rankGrowthMultiplier: rankGrowthMultiplier ?? config.attributeProgression?.rankGrowthMultiplier ?? 4,
        rankGrowthBonus,
        isRankUp: true,
        usePotentialForGrowth: config.attributeProgression?.usePotentialForGrowth ?? true
      });
      rankGrowth = rankUpsCount * rnkGrowthUnit;
    }

    const progressionGain = Math.round((totalLevelsGained * lvlGrowth + rankGrowth) * 100) / 100;
    let finalValue = Math.round(baseValue + progressionGain + manualDelta);

    if (typeof potentialMax === 'number' && !isNaN(potentialMax) && potentialMax > 0) {
      finalValue = Math.min(potentialMax, finalValue);
    }
    finalValue = Math.max(minValue, finalValue);

    return finalValue;
  }

  /**
   * Passt Charakter-Attribute anhand gewonnener Level-Ups deterministisch an.
   * Das individuelle Entwicklungspotenzial schränkt das tatsächliche Wachstum aktuell NICHT ein.
   * Die absolute Werteobergrenze wird von der globalen Skala (maxAttributeValue / scaleMax) vorgegeben.
   */
  static applyLevelUpToAttributes(
    attributes: CharacterAttribute[],
    levelsGained: number,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG,
    profileType?: DevelopmentProfileType,
    options?: {
      race?: string;
      potential?: number | string;
      parameterGrowthFactors?: Record<string, number>;
      parameterGrowthPoints?: Record<string, number>;
      raceGrowthFactors?: Record<string, number>;
      developmentRateMultiplier?: number;
      rankGrowthBonus?: number;
      rankGrowthMultiplier?: number;
    }
  ): CharacterAttribute[] {
    if (!attributes || attributes.length === 0 || levelsGained <= 0) {
      return attributes || [];
    }

    const profile = this.getDevelopmentProfile(profileType, config);
    const baseGrowth = config.attributeProgression?.baseGrowthPerLevel ?? 2;
    const devRateMult = options?.developmentRateMultiplier ?? config.developmentRate?.attributeGrowthMultiplier ?? 1.0;
    const profileMult = profile.attributeGrowthMultiplier ?? 1.0;

    const minVal = config.attributeProgression?.minAttributeValue ?? 0;
    const maxVal = config.attributeProgression?.maxAttributeValue ?? 1000;
    const usePot = config.attributeProgression?.usePotentialForGrowth ?? true;

    return attributes.map(attr => {
      const currentVal = typeof attr.value === 'number' ? attr.value : minVal;
      const growthPerLevel = this.calculateParameterGrowth({
        parameterName: attr.name,
        currentValue: currentVal,
        baseGrowth,
        parameterGrowthFactors: options?.parameterGrowthFactors || config.attributeProgression?.parameterGrowthFactors,
        parameterGrowthPoints: options?.parameterGrowthPoints,
        raceGrowthFactors: options?.raceGrowthFactors,
        race: options?.race,
        potential: options?.potential,
        developmentRateMultiplier: devRateMult,
        profileMultiplier: profileMult,
        rankGrowthMultiplier: options?.rankGrowthMultiplier ?? config.attributeProgression?.rankGrowthMultiplier ?? 4,
        rankGrowthBonus: options?.rankGrowthBonus,
        isRankUp: false,
        usePotentialForGrowth: usePot
      });

      let nextVal = currentVal + growthPerLevel * levelsGained;
      nextVal = Math.min(maxVal, Math.max(minVal, nextVal));

      return {
        ...attr,
        value: nextVal,
        max: Math.max(nextVal, typeof attr.max === 'number' ? attr.max : maxVal)
      };
    });
  }

  /**
   * Wendet gewonnene Level-Ups und Rangaufstiege auf campaignPowerLevels (Parameter) an.
   * Die globale Skala (scaleMax) bestimmt die absolute Obergrenze.
   * Das individuelle Potenzial schränkt das tatsächliche Wachstum NICHT ein.
   */
  static applyLevelUpToPowerLevels(
    powerLevels: Record<string, { value: number; potentialMax?: number }> = {},
    levelsGained: number,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG,
    profileType?: DevelopmentProfileType,
    scaleMax: number = 1000,
    scaleMin: number = 0,
    worldPowerSettings?: Record<string, number | CampaignPowerParameter>,
    options?: {
      potential?: number | string;
      parameterPotentialPercentages?: Record<string, number>;
      parameterGrowthFactors?: Record<string, number>;
      parameterGrowthPoints?: Record<string, number>;
      raceGrowthFactors?: Record<string, number>;
      race?: string;
      customRaces?: RaceDefinition[];
      rankUpsCount?: number;
      developmentRateMultiplier?: number;
      rankGrowthBonus?: number;
      rankGrowthMultiplier?: number;
    }
  ): Record<string, { value: number; potentialMax?: number }> {
    const rankUpsCount = options?.rankUpsCount ?? 0;
    if (levelsGained === 0 && rankUpsCount === 0 && powerLevels && Object.keys(powerLevels).length > 0) {
      return powerLevels;
    }

    const profile = this.getDevelopmentProfile(profileType, config);
    const baseGrowth = config.attributeProgression?.baseGrowthPerLevel ?? 2;
    const rankGrowthMult = options?.rankGrowthMultiplier ?? config.attributeProgression?.rankGrowthMultiplier ?? 4;
    const usePot = config.attributeProgression?.usePotentialForGrowth ?? true;

    const devRateMult = options?.developmentRateMultiplier ?? config.developmentRate?.attributeGrowthMultiplier ?? 1.0;
    const profileMult = profile.attributeGrowthMultiplier ?? 1.0;

    const maxVal = config.attributeProgression?.maxAttributeValue ?? scaleMax;
    const minVal = config.attributeProgression?.minAttributeValue ?? scaleMin;

    const updated: Record<string, { value: number; potentialMax?: number }> = { ...(powerLevels || {}) };

    const settingsSource = worldPowerSettings || {};
    const settingsKeys = Object.keys(settingsSource);
    const existingKeys = Object.keys(powerLevels || {});
    const defaultCategories = ['Stärke', 'Geschicklichkeit', 'Konstitution', 'Intelligenz', 'Willenskraft', 'Magie'];

    const targetKeys = Array.from(
      new Set([
        ...existingKeys,
        ...settingsKeys,
        ...(existingKeys.length === 0 && settingsKeys.length === 0 ? defaultCategories : [])
      ])
    );

    targetKeys.forEach(key => {
      const paramData = updated[key] || { value: minVal || 10, potentialMax: maxVal };
      let currentVal = typeof paramData.value === 'number' ? paramData.value : minVal;

      // 1. Zuwachs für gewonnene Level
      if (levelsGained !== 0) {
        const lvlGrowth = this.calculateParameterGrowth({
          parameterName: key,
          currentValue: currentVal,
          baseGrowth,
          parameterGrowthFactors: options?.parameterGrowthFactors || config.attributeProgression?.parameterGrowthFactors,
          parameterGrowthPoints: options?.parameterGrowthPoints,
          raceGrowthFactors: options?.raceGrowthFactors,
          race: options?.race,
          customRaces: options?.customRaces,
          potential: options?.potential,
          parameterPotentialPercentages: options?.parameterPotentialPercentages,
          developmentRateMultiplier: devRateMult,
          profileMultiplier: profileMult,
          rankGrowthMultiplier: rankGrowthMult,
          rankGrowthBonus: options?.rankGrowthBonus,
          isRankUp: false,
          usePotentialForGrowth: usePot
        });
        currentVal += lvlGrowth * levelsGained;
      }

      // 2. Zuwachs für gewonnene Rangaufstiege
      if (rankUpsCount > 0) {
        const rnkGrowth = this.calculateParameterGrowth({
          parameterName: key,
          currentValue: currentVal,
          baseGrowth,
          parameterGrowthFactors: options?.parameterGrowthFactors || config.attributeProgression?.parameterGrowthFactors,
          parameterGrowthPoints: options?.parameterGrowthPoints,
          raceGrowthFactors: options?.raceGrowthFactors,
          race: options?.race,
          customRaces: options?.customRaces,
          potential: options?.potential,
          parameterPotentialPercentages: options?.parameterPotentialPercentages,
          developmentRateMultiplier: devRateMult,
          profileMultiplier: profileMult,
          rankGrowthMultiplier: rankGrowthMult,
          rankGrowthBonus: options?.rankGrowthBonus,
          isRankUp: true,
          usePotentialForGrowth: usePot
        });
        currentVal += rnkGrowth * rankUpsCount;
      }

      const paramPotMax = typeof paramData.potentialMax === 'number' && paramData.potentialMax > 0 && paramData.potentialMax !== 1000 && paramData.potentialMax !== 9999 && paramData.potentialMax !== 100000
        ? paramData.potentialMax
        : maxVal;

      let nextVal = Math.round(currentVal * 100) / 100;
      // Begrenzung durch individuelles potentialMax (Regeln 7, 8, 16)
      nextVal = Math.min(paramPotMax, Math.max(minVal, nextVal));

      updated[key] = {
        value: nextVal,
        potentialMax: paramPotMax
      };
    });

    return updated;
  }

  /**
   * Normalisiert oder initialisiert den ProgressionState eines Charakters.
   */
  static resolveCharacterProgression(
    char: Character,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
  ): ProgressionState {
    const existingProg = char.progression || {};
    const rank = config.rankSystem?.enabled
      ? (char.rank || existingProg.rank || String(config.rankSystem.ranks[0] || 'F'))
      : undefined;
    const level = existingProg.level ?? 1;
    const xp = existingProg.xp ?? 0;
    const profile = char.developmentProfile || existingProg.developmentProfile || config.activeProfile || 'normal';
    const xpNeeded = this.calculateXpRequirement(level, rank, config, profile);
    const rankIndex = rank ? this.getRankIndex(rank, config) : undefined;

    const charRace = char.race || (char.appearance as any)?.race || existingProg.race || 'Mensch';
    const charRaceFactors = existingProg.raceGrowthFactors || RaceService.getRaceGrowthFactors(charRace);
    const devRate = typeof char.developmentRate === 'number'
      ? char.developmentRate
      : (char.developmentRate?.attributeGrowthMultiplier ?? existingProg.developmentRate ?? config.developmentRate?.attributeGrowthMultiplier ?? 1.0);
    const paramFactors = char.parameterGrowthFactors || existingProg.parameterGrowthFactors || {};
    const paramPoints = char.parameterGrowthPoints || existingProg.parameterGrowthPoints;
    const powerLevels = char.campaignPowerLevels || existingProg.campaignPowerLevels;

    return {
      ...existingProg,
      level,
      xp,
      xpNeeded,
      rank,
      rankIndex,
      developmentProfile: profile,
      developmentRate: devRate,
      developmentRateMultiplier: devRate,
      parameterGrowthFactors: paramFactors,
      parameterGrowthPoints: paramPoints,
      developmentPointsPerLevel: char.developmentPointsPerLevel ?? existingProg.developmentPointsPerLevel,
      rankGrowthBonus: char.rankGrowthBonus ?? existingProg.rankGrowthBonus,
      rankGrowthMultiplier: char.rankGrowthMultiplier ?? existingProg.rankGrowthMultiplier,
      campaignPowerLevels: powerLevels,
      race: charRace,
      raceGrowthFactors: charRaceFactors,
      potential: typeof char.potential === 'number' ? char.potential : (typeof char.potential === 'string' ? parseFloat(char.potential) || 1000 : (existingProg.potential ?? 1000)),
      progressionLogic: existingProg.progressionLogic || 'ep'
    };
  }
}
