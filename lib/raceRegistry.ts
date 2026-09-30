// -*- coding: utf-8 -*-

export interface RaceDefinition {
  id: string;
  name: string;
  description: string;
  growthFactors: Record<string, number>;
  traits?: string[];
}

/**
 * Mensch – Die erste, neutrale Basisrasse im AdventureForge-System.
 * Besitzt ausgeglichene, neutrale Wachstumsfaktoren (1.0).
 */
export const HUMAN_RACE_DEFINITION: RaceDefinition = {
  id: 'human',
  name: 'Mensch',
  description: 'Ausgewogene, anpassungsfähige und vielseitige Spezies mit neutralen Entwicklungsfaktoren.',
  growthFactors: {
    'Stärke': 1.0,
    'Geschicklichkeit': 1.0,
    'Konstitution': 1.0,
    'Intelligenz': 1.0,
    'Willenskraft': 1.0,
    'Magie': 1.0
  },
  traits: ['Vielseitigkeit', 'Anpassungsfähigkeit']
};

/**
 * Zentrale Registratur aller veranlagten Rassen.
 * Kann künftig problemlos um weitere Spezies (Elf, Zwerg, Ork etc.) erweitert werden.
 */
export const RACE_REGISTRY: Record<string, RaceDefinition> = {
  human: HUMAN_RACE_DEFINITION
};

/**
 * Ermittelt deterministisch die Rassendefinition für eine ID oder einen Namen.
 * Bei fehlenden oder unbekannten Rassen wird sicher auf Mensch ("human") zurückgegriffen.
 */
export function getRaceDefinition(raceIdOrName?: string): RaceDefinition {
  if (!raceIdOrName) return HUMAN_RACE_DEFINITION;

  const clean = raceIdOrName.trim().toLowerCase();

  // Direct ID match
  if (RACE_REGISTRY[clean]) {
    return RACE_REGISTRY[clean];
  }

  // Name match or alias match
  const match = Object.values(RACE_REGISTRY).find(
    r => r.name.toLowerCase() === clean || r.id.toLowerCase() === clean
  );

  if (match) {
    return match;
  }

  // Safe fallback for old/custom race strings (e.g. "Mensch", "menschlich" etc.)
  if (clean.includes('mensch') || clean.includes('human')) {
    return HUMAN_RACE_DEFINITION;
  }

  // Generic fallback: Human definition as baseline
  return HUMAN_RACE_DEFINITION;
}
