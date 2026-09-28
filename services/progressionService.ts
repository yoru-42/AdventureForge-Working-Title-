// -*- coding: utf-8 -*-
import {
  CharacterRank,
  DevelopmentProfileType,
  DevelopmentProfile,
  ProgressionConfig,
  ProgressionState,
  ProgressionResult,
  CharacterAttribute,
  Character
} from '../types';

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
  }
};

/**
 * Standard-Progressionskonfiguration für AdventureForge.
 */
export const DEFAULT_PROGRESSION_CONFIG: ProgressionConfig = {
  rankSystem: {
    enabled: true,
    ranks: [...STANDARD_RANKS],
    requiresMaxLevelForRankUp: true,
    minXpForRankUp: 0
  },
  levelSystem: {
    enabled: true,
    levelsPerRank: 10,
    maxLevel: 100,
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
    maxAttributeValue: 1000,
    minAttributeValue: 0,
    enforcePotentialCap: true
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
   * Unterstützt:
   * - Modus A ('fixed'): Fester EP-Bedarf unabhängig von Level und Rang.
   * - Modus B ('level_growth'): Linear/formelhaft ansteigender Bedarf pro Level.
   * - Modus C ('level_and_rank_growth'): Steigender Bedarf anhand von Level und Rang.
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
   * Berechnet den effektiven EP-Gewinn unter Berücksichtigung von Entwicklungsrate und Profil.
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
   * Prüft, ob ein Rangaufstieg möglich ist.
   */
  static checkRankUpConditions(
    currentRank: string = 'F',
    currentLevel: number = 1,
    currentXp: number = 0,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
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
      const levelsPerRank = config.levelSystem?.levelsPerRank ?? 10;
      if (currentLevel < levelsPerRank) {
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
        reason: `Mindest-EP für Rangaufstieg (${minXp}) nicht erreicht (aktuell: ${currentXp})`
      };
    }

    return { canRankUp: true, nextRank };
  }

  /**
   * Wendet einen EP-Gewinn auf einen ProgressionState an.
   * Führt bei ausreichenden EP deterministische Level-Ups durch, verarbeitet eventuelle Rangaufstiege
   * und erhält überschüssige EP präzise ohne Rundungsverluste.
   */
  static applyXpGain(
    currentState: ProgressionState,
    rawXpGain: number,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG,
    profileOverride?: DevelopmentProfileType
  ): ProgressionResult {
    const profileKey = profileOverride || currentState.developmentProfile || config.activeProfile || 'normal';
    const effectiveGain = this.calculateEffectiveXpGain(rawXpGain, config, profileKey);

    let currentLvl = currentState.level ?? 1;
    let currentXp = (currentState.xp ?? 0) + effectiveGain;
    let currentRank = currentState.rank || (config.rankSystem.enabled ? String(config.rankSystem.ranks[0] || 'F') : undefined);
    const maxLvl = currentState.maxLevel ?? config.levelSystem?.maxLevel ?? 100;
    const levelsPerRank = config.levelSystem?.levelsPerRank ?? 10;

    let levelsGained = 0;
    const rankUps: { fromRank: string; toRank: string }[] = [];
    const levelUpEvents: { level: number; rank?: string; xpNeeded: number }[] = [];

    // Iterative Level-Up Berechnung
    while (currentLvl < maxLvl) {
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

        // Rangaufstieg prüfen, wenn Levelgrenze des Rangs erreicht ist
        if (config.rankSystem?.enabled && currentRank) {
          const rankCheck = this.checkRankUpConditions(currentRank, currentLvl, currentXp, config);
          if (rankCheck.canRankUp && rankCheck.nextRank) {
            const oldRank = currentRank;
            currentRank = rankCheck.nextRank;
            rankUps.push({ fromRank: oldRank, toRank: currentRank });

            if (config.levelSystem?.resetLevelOnRankUp) {
              currentLvl = 1;
            }
          }
        }
      } else {
        break;
      }
    }

    // Falls maxLevel erreicht, überschüssige EP begrenzen
    if (currentLvl >= maxLvl) {
      currentXp = 0;
    }

    const nextXpNeeded = currentLvl < maxLvl
      ? this.calculateXpRequirement(currentLvl, currentRank, config, profileKey)
      : 0;

    const rankIdx = currentRank ? this.getRankIndex(currentRank, config) : undefined;
    const pointsEarned = levelsGained * (config.attributeProgression?.baseGrowthPerLevel ?? 2);

    const newState: ProgressionState = {
      ...currentState,
      level: currentLvl,
      xp: currentXp,
      xpNeeded: nextXpNeeded,
      rank: currentRank,
      rankIndex: rankIdx,
      developmentProfile: profileKey,
      points: (currentState.points ?? 0) + pointsEarned
    };

    return {
      previousState: { ...currentState },
      newState,
      gainedXp: effectiveGain,
      levelsGained,
      rankUps,
      levelUpEvents,
      attributePointsEarned: pointsEarned
    };
  }

  /**
   * Passt Charakter-Attribute anhand gewonnener Level-Ups deterministisch an.
   * Berücksichtigt Attribute-Wachstums-Multiplikatoren und das individuelle Entwicklungspotenzial.
   */
  static applyLevelUpToAttributes(
    attributes: CharacterAttribute[],
    levelsGained: number,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG,
    profileType?: DevelopmentProfileType,
    potentials?: Record<string, number>
  ): CharacterAttribute[] {
    if (!attributes || attributes.length === 0 || levelsGained <= 0) {
      return attributes || [];
    }

    const profile = this.getDevelopmentProfile(profileType, config);
    const baseGrowth = config.attributeProgression?.baseGrowthPerLevel ?? 2;
    const growthMult = (config.developmentRate?.attributeGrowthMultiplier ?? 1.0) * (profile.attributeGrowthMultiplier ?? 1.0);
    const gainPerStat = Math.max(1, Math.round(baseGrowth * growthMult));
    const totalGain = gainPerStat * levelsGained;

    const minVal = config.attributeProgression?.minAttributeValue ?? 0;
    const maxVal = config.attributeProgression?.maxAttributeValue ?? 1000;
    const enforceCap = config.attributeProgression?.enforcePotentialCap ?? true;

    return attributes.map(attr => {
      const currentVal = typeof attr.value === 'number' ? attr.value : minVal;
      const potentialLimit = potentials?.[attr.name] ?? attr.max ?? maxVal;

      let nextVal = currentVal + totalGain;

      if (enforceCap && potentialLimit > 0) {
        nextVal = Math.min(nextVal, potentialLimit);
      }

      nextVal = Math.min(maxVal, Math.max(minVal, nextVal));

      return {
        ...attr,
        value: nextVal,
        max: Math.max(nextVal, potentialLimit)
      };
    });
  }

  /**
   * Normalisiert oder initialisiert den ProgressionState eines Charakters.
   */
  static resolveCharacterProgression(
    char: Character,
    config: ProgressionConfig = DEFAULT_PROGRESSION_CONFIG
  ): ProgressionState {
    const existingProg = char.progression || {};
    const rank = char.rank || existingProg.rank || (config.rankSystem.enabled ? String(config.rankSystem.ranks[0] || 'F') : undefined);
    const level = existingProg.level ?? 1;
    const xp = existingProg.xp ?? 0;
    const profile = char.developmentProfile || existingProg.developmentProfile || config.activeProfile || 'normal';
    const xpNeeded = this.calculateXpRequirement(level, rank, config, profile);
    const rankIndex = rank ? this.getRankIndex(rank, config) : undefined;

    return {
      ...existingProg,
      level,
      xp,
      xpNeeded,
      rank,
      rankIndex,
      developmentProfile: profile,
      potential: char.potential ?? existingProg.potential ?? 1000,
      progressionLogic: existingProg.progressionLogic || 'ep'
    };
  }
}
