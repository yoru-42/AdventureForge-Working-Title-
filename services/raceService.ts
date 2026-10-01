// -*- coding: utf-8 -*-
import { RaceDetails, LoreEntry } from '../types';

export interface RaceDefinition {
  id: string;
  name: string;
  description: string;
  baseParameters?: Record<string, number>;
  growthFactors: Record<string, number>;
  defaultFeatures?: string;
  defaultFreePoints?: number;
  details?: any;
}

export const HUMAN_BASE_PARAMETERS: Record<string, number> = {
  'Stärke': 10,
  'Geschicklichkeit': 10,
  'Konstitution': 10,
  'Intelligenz': 10,
  'Willenskraft': 10,
  'Magie': 10
};

export const HUMAN_RACE_DEFINITION: RaceDefinition = {
  id: 'human',
  name: 'Mensch',
  description: 'Anpassungsfähig und vielseitig. Dient als biologischer Standard ohne ausgeprägte Stärken oder Schwächen.',
  baseParameters: { ...HUMAN_BASE_PARAMETERS },
  growthFactors: {
    'Stärke': 1.0,
    'Geschicklichkeit': 1.0,
    'Konstitution': 1.0,
    'Intelligenz': 1.0,
    'Willenskraft': 1.0,
    'Magie': 1.0
  },
  defaultFeatures: 'Anpassungsfähiger Körperbau, hohe Ausdauer und Lernfähigkeit.',
  defaultFreePoints: 5
};

export const DEFAULT_RACES: RaceDefinition[] = [HUMAN_RACE_DEFINITION];

export class RaceService {
  /**
   * Holt die Rassendefinition anhand des Namens.
   * Gibt für leere oder unbekannte Rassen 'Mensch' als sicheren Fallback zurück.
   */
  static getRaceDefinition(raceName?: string, customRaces?: RaceDefinition[]): RaceDefinition {
    if (!raceName || !raceName.trim()) {
      return HUMAN_RACE_DEFINITION;
    }
    const cleanName = raceName.trim().toLowerCase();

    // 1. In customRaces suchen
    if (customRaces && customRaces.length > 0) {
      const match = customRaces.find(
        r => r.name.toLowerCase() === cleanName || r.id.toLowerCase() === cleanName
      );
      if (match) return match;
    }

    // 2. In vordefinierten Rassen suchen
    const defaultMatch = DEFAULT_RACES.find(
      r => r.name.toLowerCase() === cleanName || r.id.toLowerCase() === cleanName
    );
    if (defaultMatch) return defaultMatch;

    // 3. Wenn es sich um den Begriff "Mensch" oder Variante handelt
    if (cleanName.includes('mensch') || cleanName.includes('human')) {
      return HUMAN_RACE_DEFINITION;
    }

    // 4. Fallback: Erzeuge eine dynamische Rassendefinition mit neutralen Wachstumsfaktoren
    return {
      id: cleanName.replace(/\s+/g, '_'),
      name: raceName.trim(),
      description: `Spezies ${raceName.trim()}`,
      growthFactors: {
        'Stärke': 1.0,
        'Geschicklichkeit': 1.0,
        'Konstitution': 1.0,
        'Intelligenz': 1.0,
        'Willenskraft': 1.0,
        'Magie': 1.0
      }
    };
  }

  /**
   * Holt die Rassenwachstumsfaktoren für eine gegebene Rasse.
   */
  static getRaceGrowthFactors(raceName?: string, customRaces?: RaceDefinition[]): Record<string, number> {
    const def = this.getRaceDefinition(raceName, customRaces);
    return def.growthFactors;
  }

  /**
   * Holt die Startparameter für eine gegebene Rasse (Standard: Mensch Level 1 = 10 auf alle Parameter).
   */
  static getBaseParameters(raceName?: string, customRaces?: RaceDefinition[]): Record<string, number> {
    const def = this.getRaceDefinition(raceName, customRaces);
    return def.baseParameters || { ...HUMAN_BASE_PARAMETERS };
  }

  /**
   * Stellt sicher, dass ein Rassenname niemals leer ist (Fallback: 'Mensch').
   */
  static normalizeRaceName(raceName?: string): string {
    if (!raceName || !raceName.trim()) {
      return HUMAN_RACE_DEFINITION.name;
    }
    return raceName.trim();
  }

  /**
   * Konvertiert LoreEntry-Einträge aus der Kategorie 'Rassen' in RaceDefinitions.
   */
  static parseRaceLoreEntries(loreEntries?: LoreEntry[]): RaceDefinition[] {
    if (!loreEntries) return DEFAULT_RACES;
    const raceEntries = loreEntries.filter(
      e => (e.category as string) === 'Rassen' || (e.category as string) === 'Rasse'
    );
    if (raceEntries.length === 0) return DEFAULT_RACES;

    const parsed: RaceDefinition[] = raceEntries.map(entry => {
      const growthFactors: Record<string, number> = {
        'Stärke': 1.0,
        'Geschicklichkeit': 1.0,
        'Konstitution': 1.0,
        'Intelligenz': 1.0,
        'Willenskraft': 1.0,
        'Magie': 1.0
      };

      if (entry.details && (entry.details as any).growthFactors) {
        Object.assign(growthFactors, (entry.details as any).growthFactors);
      }

      return {
        id: entry.id || entry.title.toLowerCase().replace(/\s+/g, '_'),
        name: entry.title,
        description: entry.description || '',
        growthFactors,
        defaultFeatures: (entry.details as any)?.distinctiveFeatures || '',
        details: entry.details
      };
    });

    if (!parsed.some(r => r.name.toLowerCase() === 'mensch')) {
      parsed.unshift(HUMAN_RACE_DEFINITION);
    }

    return parsed;
  }
}

export default RaceService;
