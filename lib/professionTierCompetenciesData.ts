// ============================================================================
// ADVENTUREFORGE BERUFS-FACHKOMPETENZEN NACH STUFEN
// Lehrling | Geselle | Spezialisierung | Meister
// Vollständige Abdeckung aller 16 Berufszweige
// ============================================================================

import { PART1_COMPETENCIES, JobTierCompetencySet } from './professionTierCompetenciesPart1';
import { PART2_COMPETENCIES } from './professionTierCompetenciesPart2';
import { PART3_COMPETENCIES } from './professionTierCompetenciesPart3';
import { PART4_COMPETENCIES } from './professionTierCompetenciesPart4';

export type { JobTierCompetencySet };

/**
 * Zusammenführung aller individuell zugeordneten Fachkompetenzen für alle Berufe über alle 16 Berufszweige.
 * 1. Lebensmittel & Versorgung (PART1)
 * 2. Bau & Handwerk (PART1)
 * 3. Metall & Feinhandwerk (PART1)
 * 4. Natur & Landwirtschaft (PART1)
 * 5. Medizin (PART2)
 * 6. Wissenschaft (PART2)
 * 7. Handel & Wirtschaft (PART2)
 * 8. Dienstleistung (PART2)
 * 9. Verwaltung (PART3)
 * 10. Militär (PART3)
 * 11. Seefahrt (PART3)
 * 12. Kriminalität (PART3)
 * 13. Magie (PART4)
 * 14. Kunst & Kultur (PART4)
 * 15. Religion (PART4)
 * 16. Abenteuer (PART4)
 */
export const JOB_TIER_COMPETENCIES: Record<string, JobTierCompetencySet> = {
  ...PART1_COMPETENCIES,
  ...PART2_COMPETENCIES,
  ...PART3_COMPETENCIES,
  ...PART4_COMPETENCIES
};

/**
 * Fallback-Generator für Fachkompetenzen, falls ein Beruf noch nicht explizit erfasst ist.
 */
export function getFallbackTierCompetencies(jobName: string, fieldId: string): JobTierCompetencySet {
  const clean = jobName.trim() || 'Fachkraft';
  return {
    lehrling: [
      `Arbeitsplatz & Werkzeuge vorbereiten (${clean})`,
      `Materialkunde & Sicherheitsregeln (${clean})`,
      `Grundlegende Handgriffe & Abläufe`,
      `Sorgfältige Zuarbeit für erfahrene Kräfte`
    ],
    geselle: [
      `Selbstständige Ausführung: ${clean}`,
      `Fachgerechte Anwendung der Standardverfahren`,
      `Qualitätsprüfung & Fehlerbehebung`,
      `Organisation & Zeitmanagement der Arbeit`
    ],
    spezialisierung: [
      `Vertiefte Fachtechnik & Sonderverfahren (${clean})`,
      `Schwierige Aufträge & Spezialanfertigungen`,
      `Anleitung & Korrektur jüngerer Gesellen`,
      `Präzisions- & Spezialmethoden des Fachs`
    ],
    meister: [
      `Meisterhafte Gesamtausführung & Perfektion (${clean})`,
      `Betriebs- & Projektleitung im Fachbereich`,
      `Ausbildung des Nachwuchses (Lehrlinge & Gesellen)`,
      `Qualitätsstandards & Repräsentation des Gewerks`
    ]
  };
}

/**
 * Ruft die 4-stufigen Fachkompetenzen für einen beliebigen Beruf ab.
 */
export function getTierCompetencySetForJob(jobName: string, fieldId?: string): JobTierCompetencySet {
  if (!jobName) return getFallbackTierCompetencies('Fachkraft', fieldId || '');
  
  const key = jobName.toLowerCase().trim().replace(/[^a-z0-9äöüß]/g, '_');
  
  // Exakter Match
  if (JOB_TIER_COMPETENCIES[key]) {
    return JOB_TIER_COMPETENCIES[key];
  }
  
  // Suche über Aliasse oder Teilstrings
  const entries = Object.entries(JOB_TIER_COMPETENCIES);
  for (const [entryKey, compSet] of entries) {
    if (key.includes(entryKey) || entryKey.includes(key)) {
      return compSet;
    }
  }
  
  return getFallbackTierCompetencies(jobName, fieldId || '');
}

/**
 * Gibt die Fachkompetenzen für eine bestimmte Stufe (0=Lehrling, 1=Geselle, 2=Spezialisierung, 3=Meister) zurück.
 */
export function getCompetenciesForJobTier(
  jobName: string,
  tier: 'einstieg' | 'beruf' | 'spezialisierung' | 'meister' | number,
  fieldId?: string
): string[] {
  const compSet = getTierCompetencySetForJob(jobName, fieldId);
  
  if (tier === 0 || tier === 'einstieg') {
    return compSet.lehrling;
  }
  if (tier === 1 || tier === 'beruf') {
    return compSet.geselle;
  }
  if (tier === 2 || tier === 'spezialisierung') {
    return compSet.spezialisierung;
  }
  if (tier === 3 || tier === 'meister') {
    return compSet.meister;
  }
  
  return compSet.geselle;
}
