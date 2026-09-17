import { ProfessionCompetency, ProfessionExperience, ProfessionProgress, SecondaryProfession } from '../types';
import { JOB_CATEGORIES } from '../components/jobPresets';
import { getBranchesForField, convertProgressionToNodes } from './professionProgressionData';
import { getSuggestedAuthoritiesForProfession } from './professionAuthoritiesData';

export type ProfessionNodeType =
  | 'training'
  | 'profession'
  | 'specialization'
  | 'advanced_profession'
  | 'promotion'
  | 'leadership';

export type ProfessionNodeTier = 'einstieg' | 'beruf' | 'spezialisierung' | 'meister';

export type ProfessionPrerequisiteType =
  | 'profession'
  | 'specialization'
  | 'competence'
  | 'competency'
  | 'experience'
  | 'experience_years'
  | 'attribute'
  | 'equipment'
  | 'knowledge'
  | 'location'
  | 'institution'
  | 'mentor'
  | 'title'
  | 'position'
  | 'story_requirement'
  | 'rank'
  | 'social_recognition'
  | 'exam_or_master';

export interface ProfessionPrerequisite {
  type: ProfessionPrerequisiteType;
  label: string;
  id?: string;
  targetId?: string;
  targetFieldId?: string;
  targetFieldName?: string;
  minValue?: number;
  value?: number;
  description?: string;
  required?: boolean; // true by default (hard vs soft requirement)
}

export interface EvaluatedPrerequisite {
  prerequisite: ProfessionPrerequisite;
  isFulfilled: boolean;
  detail: string;
  isHard: boolean;
  crossField?: {
    fieldId: string;
    fieldName: string;
  };
}

export type NodeStatus = 'learned' | 'unlocked' | 'locked' | 'training';

export interface ProfessionCareerRoute {
  id: string;
  name: string;
  type: 'experience' | 'exam' | 'social_recognition' | 'emergency';
  description: string;
  requirementsSummary: string;
}

export interface ProfessionTreeNode {
  id: string;
  fieldId: string;
  name: string;
  nodeType?: ProfessionNodeType;
  tier: ProfessionNodeTier;
  parentIds: string[];
  childIds: string[];
  specializationOf?: string;
  description: string;
  prerequisites: ProfessionPrerequisite[];
  careerRoutes: ProfessionCareerRoute[];
  suggestedCompetencies: string[];
  possibleRanks: string[];
  category?: string;
  rankOrder?: number;
  rankTitle?: string;
  nextRankProfession?: string;
  previousRankProfession?: string;
  competenceIds?: string[];
  specializationIds?: string[];
  unlocks?: string[];
  isMainProfession?: boolean;
  isSecondaryProfession?: boolean;
  positionTitle?: string;
  authorities?: string[];
  suggestedAuthorities?: string[];
  grantedAuthorities?: string[];
  categoryId?: string;
  professionType?: 'civil' | 'combat';
  isMasterQualification?: boolean;
  isTitleQualification?: boolean;
}

export interface ProfessionTreeField {
  fieldId: string;
  fieldName: string;
  description: string;
  rootNodeId: string;
  nodes: ProfessionTreeNode[];
}

export interface NodeEvaluationResult {
  status: NodeStatus;
  isAvailable: boolean;
  isActive: boolean;
  isLearned: boolean;
  missingPrerequisites: string[];
  fulfilledPrerequisites: string[];
  softPrerequisites: EvaluatedPrerequisite[];
  allEvaluations: EvaluatedPrerequisite[];
}

/**
 * Evaluates whether a character meets the prerequisites for a specific tree node,
 * taking into account main profession, secondary professions, cross-branch requirements,
 * competencies, experience years, and hard vs. soft requirements.
 */
export function evaluateNodePrerequisites(
  node: ProfessionTreeNode,
  currentCharacter: {
    profession?: string;
    professionField?: string;
    professionSpecialization?: string;
    professionRank?: string;
    secondaryProfessions?: (SecondaryProfession | string)[];
    additionalDirections?: string[];
    experienceYears?: number;
    competencies?: ProfessionCompetency[];
  }
): NodeEvaluationResult {
  const currentProf = (currentCharacter.profession || '').toLowerCase().trim();
  const currentSpec = (currentCharacter.professionSpecialization || '').toLowerCase().trim();
  const nodeNameLower = node.name.toLowerCase().trim();

  // Extract all learned professions and directions
  const learnedProfessions = new Set<string>();
  if (currentProf) learnedProfessions.add(currentProf);
  if (currentSpec) learnedProfessions.add(currentSpec);

  if (Array.isArray(currentCharacter.secondaryProfessions)) {
    currentCharacter.secondaryProfessions.forEach(sp => {
      if (typeof sp === 'string') {
        learnedProfessions.add(sp.toLowerCase().trim());
      } else if (sp && typeof sp === 'object') {
        if (sp.profession) learnedProfessions.add(sp.profession.toLowerCase().trim());
        if (sp.specialization) learnedProfessions.add(sp.specialization.toLowerCase().trim());
        if (sp.jobTitle) learnedProfessions.add(sp.jobTitle.toLowerCase().trim());
      }
    });
  }

  if (Array.isArray(currentCharacter.additionalDirections)) {
    currentCharacter.additionalDirections.forEach(dir => {
      if (typeof dir === 'string') {
        learnedProfessions.add(dir.toLowerCase().trim());
      }
    });
  }

  // Active & Learned check
  const isMain = currentProf === nodeNameLower || (node.tier === 'einstieg' && !currentProf);
  const isLearned = isMain || learnedProfessions.has(nodeNameLower);

  const missingPrerequisites: string[] = [];
  const fulfilledPrerequisites: string[] = [];
  const softPrerequisites: EvaluatedPrerequisite[] = [];
  const allEvaluations: EvaluatedPrerequisite[] = [];

  const expYears = currentCharacter.experienceYears || 0;
  const comps = currentCharacter.competencies || [];

  for (const req of node.prerequisites) {
    const isHard = req.required !== false;
    let isFulfilled = false;
    let detail = '';

    const crossField = req.targetFieldId
      ? {
          fieldId: req.targetFieldId,
          fieldName: req.targetFieldName || req.targetFieldId
        }
      : undefined;

    if (req.type === 'experience_years' || req.type === 'experience') {
      const minYears = req.minValue || req.value || 1;
      if (expYears >= minYears) {
        isFulfilled = true;
        detail = `Berufserfahrung: ${expYears}/${minYears} Jahre`;
      } else {
        isFulfilled = false;
        detail = `Mindestens ${minYears} ${minYears === 1 ? 'Jahr' : 'Jahre'} Berufserfahrung erforderlich (aktuell: ${expYears} J.)`;
      }
    } else if (req.type === 'profession' || req.type === 'specialization') {
      const target = (req.targetId || req.label || '').toLowerCase().trim();
      const match = Array.from(learnedProfessions).some(
        lp => lp === target || lp.includes(target) || (target.length >= 4 && target.includes(lp))
      );
      if (match) {
        isFulfilled = true;
        detail = `Basisberuf „${req.label}“ erlernt`;
      } else {
        isFulfilled = false;
        if (crossField) {
          detail = `Basisberuf „${req.label}“ (benötigt aus Berufszweig ${crossField.fieldName})`;
        } else {
          detail = `Basisberuf „${req.label}“ erforderlich`;
        }
      }
    } else if (req.type === 'competence' || req.type === 'competency') {
      const minScore = req.minValue || req.value || 40;
      const target = (req.targetId || req.label || '').toLowerCase().trim();
      const foundComp = comps.find(c => c.name.toLowerCase().includes(target) || target.includes(c.name.toLowerCase()));
      if (foundComp && (foundComp.proficiency || 0) >= minScore) {
        isFulfilled = true;
        detail = `Kompetenz „${foundComp.name}“ ≥ ${minScore}% (aktuell: ${foundComp.proficiency}%)`;
      } else if (foundComp) {
        isFulfilled = false;
        detail = `Kompetenz „${foundComp.name}“ benötigt ${minScore}% (aktuell: ${foundComp.proficiency}%)`;
      } else {
        isFulfilled = false;
        if (crossField) {
          detail = `Kompetenz „${req.label}“ (min. ${minScore}%, benötigt aus Berufszweig ${crossField.fieldName})`;
        } else {
          detail = `Kompetenz „${req.label}“ (min. ${minScore}%) noch nicht erlernt`;
        }
      }
    } else {
      // General or soft requirement
      isFulfilled = true;
      detail = req.label;
    }

    const evalItem: EvaluatedPrerequisite = {
      prerequisite: req,
      isFulfilled,
      detail,
      isHard,
      crossField
    };

    allEvaluations.push(evalItem);

    if (isHard) {
      if (isFulfilled) {
        fulfilledPrerequisites.push(detail);
      } else {
        missingPrerequisites.push(detail);
      }
    } else {
      softPrerequisites.push(evalItem);
    }
  }

  const isAvailable = missingPrerequisites.length === 0;

  let status: NodeStatus = 'locked';
  if (isLearned) {
    status = 'learned';
  } else if (isAvailable) {
    status = node.nodeType === 'training' ? 'training' : 'unlocked';
  } else {
    status = 'locked';
  }

  return {
    status,
    isAvailable,
    isActive: isMain,
    isLearned,
    missingPrerequisites,
    fulfilledPrerequisites,
    softPrerequisites,
    allEvaluations
  };
}

/**
 * 21 Profession Trees with interconnected nodes (Root -> Core Professions -> Specializations -> Mastery).
 */
export const PROFESSION_TREES: Record<string, ProfessionTreeField> = {
  // ---------------------------------------------------------------------------
  // 1. LEBENSMITTEL & ERNÄHRUNG
  // ---------------------------------------------------------------------------
  lebensmittel_ernaehrung: {
    fieldId: 'lebensmittel_ernaehrung',
    fieldName: 'Lebensmittel & Ernährung',
    description: 'Herstellung, Veredelung und Zubereitung von Speisen, Backwaren und Getränken',
    rootNodeId: 'lebensmittel_root',
    nodes: [
      {
        id: 'lebensmittel_root',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['koch', 'baecker', 'metzger', 'brauer', 'kaeser', 'mueller', 'winzer'],
        description: 'Einstieg in den Berufszweig „Lebensmittel & Ernährung“',
        prerequisites: [],
        careerRoutes: [
          { id: 'r1', name: 'Grundausbildung / Lehrzeit', type: 'exam', description: 'Beginn einer regulären Zunftlehre.', requirementsSummary: 'Offener Einstieg' },
          { id: 'r2', name: 'Praktische Küchenhilfe', type: 'experience', description: 'Lernen durch Zuarbeit in Schankhäusern und Feldlagern.', requirementsSummary: 'Keine Vorkenntnisse' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      // KOCH BRANCH
      {
        id: 'koch',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Koch',
        tier: 'beruf',
        parentIds: ['lebensmittel_root'],
        childIds: ['fleischkueche', 'fischkueche', 'gourmetkueche', 'schankkueche'],
        description: 'Zubereitung warmer Speisen, Saucen, Eintöpfe und Menüs für Gasthöfe, Heere oder Bürgerhaushalte.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'k_exp', name: 'Erfahrungsweg', type: 'experience', description: 'Praxis in Schank- und Gasthäusern.', requirementsSummary: '1+ Jahr Kochpraxis' },
          { id: 'k_exam', name: 'Gesellenprüfung', type: 'exam', description: 'Abschluss einer zünftigen Kochlehre.', requirementsSummary: 'Lehrzeit bei Kochmeister' },
          { id: 'k_soc', name: 'Anerkennung durch Küchenleitung', type: 'social_recognition', description: 'Beförderung bei Bewährung in Großküchen.', requirementsSummary: 'Zuweisung durch Vorgesetzte' }
        ],
        suggestedCompetencies: ['Grundzubereitung', 'Fleisch anbraten', 'Saucen & Fonds', 'Gewürzkunde'],
        possibleRanks: ['Jungkoch', 'Kochgeselle', 'Oberkoch', 'Küchenchef']
      },
      {
        id: 'fleischkueche',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Fleischküche & Grillmeister',
        tier: 'spezialisierung',
        specializationOf: 'koch',
        parentIds: ['koch'],
        childIds: ['hofkuechenmeister'],
        description: 'Spezialisierung auf Braten, Räuchern, Marinieren und anspruchsvolle Wild- und Fleischgerichte.',
        prerequisites: [
          { type: 'profession', label: 'Koch', targetId: 'koch' },
          { type: 'experience_years', label: '2 Jahre Kocherfahrung', minValue: 2 },
          { type: 'competency', label: 'Fleisch', targetId: 'fleisch', minValue: 50 }
        ],
        careerRoutes: [
          { id: 'fk_exp', name: 'Jahrelange Fleischverarbeitung', type: 'experience', description: 'Beherrschung von Drehspießen und Großbratöfen.', requirementsSummary: '2 Jahre Kochpraxis' }
        ],
        suggestedCompetencies: ['Fleisch schneiden & parieren', 'Grillen & Spießbraten', 'Pökeln & Räuchern'],
        possibleRanks: ['Bratmeister', 'Spezialkoch']
      },
      {
        id: 'fischkueche',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Fischküche & Meeresfrüchte',
        tier: 'spezialisierung',
        specializationOf: 'koch',
        parentIds: ['koch'],
        childIds: ['hofkuechenmeister'],
        description: 'Zubereitung frischer und geräucherter Fluss- und Meeresfische sowie Schalentiere.',
        prerequisites: [
          { type: 'profession', label: 'Koch', targetId: 'koch' },
          { type: 'experience_years', label: '2 Jahre Kocherfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'fisk_exp', name: 'Küstengastronomie', type: 'experience', description: 'Erfahrung in Hafenstädten und Fischerdörfern.', requirementsSummary: '2 Jahre Fischzubereitung' }
        ],
        suggestedCompetencies: ['Fisch filetieren', 'Krustentiere zubereiten', 'Fischfonds ansetzen'],
        possibleRanks: ['Fischkoch', 'Seefahrts-Smutje']
      },
      {
        id: 'gourmetkueche',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Gourmet- & Festküche',
        tier: 'spezialisierung',
        specializationOf: 'koch',
        parentIds: ['koch'],
        childIds: ['hofkuechenmeister'],
        description: 'Exquisite Menüfolgen für Bankette, Adelsfeste und gehobene Tafeln.',
        prerequisites: [
          { type: 'profession', label: 'Koch', targetId: 'koch' },
          { type: 'experience_years', label: '3 Jahre Kocherfahrung', minValue: 3 },
          { type: 'competency', label: 'Gourmet', targetId: 'sauce', minValue: 60 }
        ],
        careerRoutes: [
          { id: 'gk_exam', name: 'Hofausbildung', type: 'exam', description: 'Dienst als Gehilfe an einer Hofküche.', requirementsSummary: '3 Jahre Erfahrung & Empfehlungsschreiben' },
          { id: 'gk_soc', name: 'Berufung durch Adelshaus', type: 'social_recognition', description: 'Engagiert für fürstliche Festessen.', requirementsSummary: 'Gefallen bei Adelsbankett' }
        ],
        suggestedCompetencies: ['Gourmet-Saucen', 'Bankettplanung', 'Exotische Zutaten', 'Tafelpräsentation'],
        possibleRanks: ['Hofkoch-Anwärter', 'Chef de Cuisine']
      },
      {
        id: 'schankkueche',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Schank- & Feldküche',
        tier: 'spezialisierung',
        specializationOf: 'koch',
        parentIds: ['koch'],
        childIds: [],
        description: 'Effiziente Versorgung großer Gruppen, Reisetrupps, Söldnerlager oder Tavernen.',
        prerequisites: [
          { type: 'profession', label: 'Koch', targetId: 'koch' },
          { type: 'experience_years', label: '1 Jahr Kocherfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'sk_notfall', name: 'Feldversorger in der Not', type: 'emergency', description: 'Übernahme der Lagerküche bei Feldzügen.', requirementsSummary: 'Tross-Ernennung' }
        ],
        suggestedCompetencies: ['Großmengen-Kochen', 'Haltbarmachung unterwegs', 'Rationswirtschaft'],
        possibleRanks: ['Feldkoch', 'Quartiermeister-Koch']
      },
      // BÄCKER BRANCH
      {
        id: 'baecker',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Bäcker',
        tier: 'beruf',
        parentIds: ['lebensmittel_root'],
        childIds: ['konditor', 'feinbaecker'],
        description: 'Herstellung von Broten, Fladen, Sauerteigen und Backwaren.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'b_exam', name: 'Bäckerlehre & Gesellenbrief', type: 'exam', description: 'Abschluss in einer Zunftbäckerei.', requirementsSummary: 'Zunftbrief' }
        ],
        suggestedCompetencies: ['Teigführung', 'Holzbackofen befeuern', 'Sauerteig pflegen'],
        possibleRanks: ['Bäckergeselle', 'Bäckermeister']
      },
      {
        id: 'konditor',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Konditor & Zuckerbäcker',
        tier: 'spezialisierung',
        specializationOf: 'baecker',
        parentIds: ['baecker'],
        childIds: ['hofkuechenmeister'],
        description: 'Feinste Torten, Marzipan, Pasteten und süße Kunstwerke.',
        prerequisites: [
          { type: 'profession', label: 'Bäcker', targetId: 'baecker' },
          { type: 'experience_years', label: '2 Jahre Bäckererfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'kon_exam', name: 'Zuckerbäckerprüfung', type: 'exam', description: 'Zunftnachweis für Süßwaren.', requirementsSummary: '2 Jahre Gesellenzeit' }
        ],
        suggestedCompetencies: ['Zuckerguss & Glasur', 'Marzipan modellieren', 'Feingebäck'],
        possibleRanks: ['Zuckerbäcker', 'Feinkonditor']
      },
      {
        id: 'feinbaecker',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Feinbäcker & Teigspezialist',
        tier: 'spezialisierung',
        specializationOf: 'baecker',
        parentIds: ['baecker'],
        childIds: [],
        description: 'Gefüllte Teigtaschen, Blätterteige, Festtagsgebäcke und Spezialbrote.',
        prerequisites: [
          { type: 'profession', label: 'Bäcker', targetId: 'baecker' }
        ],
        careerRoutes: [
          { id: 'fb_exp', name: 'Spezialisierung im Betrieb', type: 'experience', description: 'Entwicklung eigener Rezepturen.', requirementsSummary: '1+ Jahr Praxis' }
        ],
        suggestedCompetencies: ['Blätterteig tourieren', 'Festtagsgebäck'],
        possibleRanks: ['Spezialbäcker']
      },
      // METZGER BRANCH
      {
        id: 'metzger',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Metzger & Fleischer',
        tier: 'beruf',
        parentIds: ['lebensmittel_root'],
        childIds: ['wurstmacher', 'raeuchermeister'],
        description: 'Schlachten, Zerwirken, Fleischverarbeitung und Konservierung.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'm_exam', name: 'Metzgergeselle', type: 'exam', description: 'Traditionelle Fleischerlehre.', requirementsSummary: 'Zunftlehrzeit' }
        ],
        suggestedCompetencies: ['Schlachten & Zerlegen', 'Knochen auslösen', 'Fleischreifung'],
        possibleRanks: ['Fleischergeselle', 'Metzgermeister']
      },
      {
        id: 'wurstmacher',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Wurstmacher & Pökelspezialist',
        tier: 'spezialisierung',
        specializationOf: 'metzger',
        parentIds: ['metzger'],
        childIds: [],
        description: 'Herstellung haltbarer Würste, Schinken, Pökelwaren und Sulzen.',
        prerequisites: [
          { type: 'profession', label: 'Metzger', targetId: 'metzger' }
        ],
        careerRoutes: [
          { id: 'wm_exp', name: 'Handwerkliche Reifung', type: 'experience', description: 'Rezepturgut und Pökelkammerpraxis.', requirementsSummary: 'Praxiserfahrung' }
        ],
        suggestedCompetencies: ['Wurstbrät würzen', 'Därme füllen', 'Nass- & Trockenpökeln'],
        possibleRanks: ['Wurster', 'Wurstmachermeister']
      },
      {
        id: 'raeuchermeister',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Räuchermeister',
        tier: 'spezialisierung',
        specializationOf: 'metzger',
        parentIds: ['metzger'],
        childIds: [],
        description: 'Kalt- und Heißräuchern von Fleisch, Speck und Würsten über edlen Hölzern.',
        prerequisites: [
          { type: 'profession', label: 'Metzger', targetId: 'metzger' }
        ],
        careerRoutes: [
          { id: 'rm_exp', name: 'Räucherkammergeheimnis', type: 'experience', description: 'Meisterung von Holzrauch und Feuchte.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Räucherkammer steuern', 'Holzauswahl', 'Schinkenreifung'],
        possibleRanks: ['Räuchermeister']
      },
      // BRAUER BRANCH
      {
        id: 'brauer',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Brauer & Mälzer',
        tier: 'beruf',
        parentIds: ['lebensmittel_root'],
        childIds: ['braumeister'],
        description: 'Brauen von Bier, Ale, Met und Getreidegetränken.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'br_exam', name: 'Brauerzunft', type: 'exam', description: 'Braurecht & Zunftbrief.', requirementsSummary: 'Zunftnachweis' }
        ],
        suggestedCompetencies: ['Maischen & Läutern', 'Hopfenkochen', 'Gärführung'],
        possibleRanks: ['Brauergeselle', 'Braumeister']
      },
      {
        id: 'braumeister',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Braumeister & Metbrauer',
        tier: 'spezialisierung',
        specializationOf: 'brauer',
        parentIds: ['brauer'],
        childIds: [],
        description: 'Kreation eigener Rezepturen, Starkbiere, Gewürzmet und Großsud-Leitung.',
        prerequisites: [
          { type: 'profession', label: 'Brauer', targetId: 'brauer' },
          { type: 'experience_years', label: '3 Jahre Braupraxis', minValue: 3 }
        ],
        careerRoutes: [
          { id: 'bm_exp', name: 'Brauhausleitung', type: 'experience', description: 'Leitung eines Sudhauses.', requirementsSummary: '3 Jahre Erfahrung' }
        ],
        suggestedCompetencies: ['Spezialsude entwickeln', 'Kellerlagerung', 'Metgärung'],
        possibleRanks: ['Brauherr', 'Zunftbraumeister']
      },
      // KÄSER & MÜLLER BRANCHES
      {
        id: 'kaeser',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Käser & Milchverarbeiter',
        tier: 'beruf',
        parentIds: ['lebensmittel_root'],
        childIds: [],
        description: 'Herstellung von Hart-, Weich- und Schnittkäse, Butter und Milchprodukten.',
        prerequisites: [],
        careerRoutes: [
          { id: 'k_exp', name: 'Alm- und Sennereipraxis', type: 'experience', description: 'Arbeit in Käsereien.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Milch dicklegen', 'Bruch schneiden', 'Käselaibe pflegen'],
        possibleRanks: ['Senner', 'Käsermeister']
      },
      {
        id: 'winzer',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Winzer & Kelterer',
        tier: 'beruf',
        parentIds: ['lebensmittel_root'],
        childIds: [],
        description: 'Weinbau, Keltern, Fassausbau und Weinkellerpflege.',
        prerequisites: [],
        careerRoutes: [
          { id: 'w_exp', name: 'Weingutpraxis', type: 'experience', description: 'Weinjahre auf Rebhängen.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Rebschnitt', 'Traubenpressen', 'Fasskellerpflege'],
        possibleRanks: ['Weinbauer', 'Kellermeister']
      },
      {
        id: 'mueller',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Müller',
        tier: 'beruf',
        parentIds: ['lebensmittel_root'],
        childIds: [],
        description: 'Betrieb von Wind- und Wassermühlen, Mahlen von Getreide und Kornsortierung.',
        prerequisites: [],
        careerRoutes: [
          { id: 'mu_exp', name: 'Mühlenbetrieb', type: 'experience', description: 'Bedienung des Mühlwerks.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Mühlsteine schärfen', 'Mahlgrad einstellen', 'Getreidereinigung'],
        possibleRanks: ['Müllersknecht', 'Müllermeister']
      },
      // APEX MASTER
      {
        id: 'hofkuechenmeister',
        fieldId: 'lebensmittel_ernaehrung',
        name: 'Hofküchenmeister & Großmeister',
        tier: 'meister',
        parentIds: ['fleischkueche', 'fischkueche', 'gourmetkueche', 'konditor'],
        childIds: [],
        description: 'Höchste Meisterschaft der Kochkunst, Leitung fürstlicher Palastküchen und Zunftführung.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Berufserfahrung', minValue: 5 },
          { type: 'rank', label: 'Meistergrad oder fürstliche Ernennung' }
        ],
        careerRoutes: [
          { id: 'hkm_exam', name: 'Große Meisterprüfung', type: 'exam', description: 'Anerkennung durch den gesamten Verband.', requirementsSummary: '5 Jahre Erfahrung + Meisterstück' },
          { id: 'hkm_soc', name: 'Fürstlicher Hoferlass', type: 'social_recognition', description: 'Offizielle Ernennung zum Hofspeisenmeister.', requirementsSummary: 'Fürstliches Patent' }
        ],
        suggestedCompetencies: ['Großbankette leiten', 'Geheime Gewürzkunst', 'Küchenreglement', 'Zunftgerichtsbarkeit'],
        possibleRanks: ['Hofküchenmeister', 'Zunftobermeister', 'Großspeisenmeister']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 2. BAU & HANDWERK
  // ---------------------------------------------------------------------------
  bau_handwerk: {
    fieldId: 'bau_handwerk',
    fieldName: 'Bau & Handwerk',
    description: 'Holz-, Stein-, Metall- und Werkstoffbearbeitung sowie Hoch- und Tiefbau',
    rootNodeId: 'handwerk_root',
    nodes: [
      {
        id: 'handwerk_root',
        fieldId: 'bau_handwerk',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['architekt', 'maurer', 'zimmermann', 'dachdecker', 'brunnenbauer', 'schreiner'],
        description: 'Einstieg in den Berufszweig „Bauhandwerk & Architektur“',
        prerequisites: [],
        careerRoutes: [
          { id: 'h_open', name: 'Einstieg in Werkstatt', type: 'experience', description: 'Lehre oder Handlangerdienst.', requirementsSummary: 'Offen' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      // ARCHITEKT & FESTUNGSBAUER BRANCH
      {
        id: 'architekt',
        fieldId: 'bau_handwerk',
        name: 'Architekt & Festungsbauer',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: ['festungsbaumeister', 'palastarchitekt'],
        description: 'Entwurf, Statik und Konstruktionsleitung von Bauwerken, Mauern, Wehrtürmen und Hallen.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'arch_exam', name: 'Architektenbestallung', type: 'exam', description: 'Risszeichnung und statische Bemessung.', requirementsSummary: '1 Jahr Baupraxis' }
        ],
        suggestedCompetencies: ['Bauplanung & Risszeichnung', 'Baustatik', 'Materialbedarfsrechnung'],
        possibleRanks: ['Bauleiter', 'Architekt', 'Festungsbaumeister']
      },
      {
        id: 'festungsbaumeister',
        fieldId: 'bau_handwerk',
        name: 'Festungsbaumeister',
        tier: 'spezialisierung',
        specializationOf: 'architekt',
        parentIds: ['architekt'],
        childIds: ['generalbaumeister'],
        description: 'Bastionen, Wehrmauern, Kurtinen, Grabenwerke und ballistische Verteidigungsanlagen.',
        prerequisites: [
          { type: 'profession', label: 'Architekt & Festungsbauer', targetId: 'architekt' },
          { type: 'experience_years', label: '2 Jahre Baupraxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'fb_exp', name: 'Wehrbaupraxis', type: 'experience', description: 'Errichtung von Wehranlagen.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Bastionsentwurf', 'Schusswinkelberechnung', 'Grabensysteme'],
        possibleRanks: ['Festungsbaumeister', 'Wehrbau-Ingenieur']
      },
      {
        id: 'palastarchitekt',
        fieldId: 'bau_handwerk',
        name: 'Palast- & Sakralarchitekt',
        tier: 'spezialisierung',
        specializationOf: 'architekt',
        parentIds: ['architekt'],
        childIds: ['generalbaumeister'],
        description: 'Monumentale Repräsentationsbauten, Paläste, Kathedralen und Kuppelkonstruktionen.',
        prerequisites: [
          { type: 'profession', label: 'Architekt & Festungsbauer', targetId: 'architekt' },
          { type: 'experience_years', label: '2 Jahre Baupraxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'pa_exp', name: 'Monumentalbau', type: 'experience', description: 'Entwurf von Residenzen und Sakralbauten.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Kuppelstatik', 'Prachtarchitektur', 'Säulenordnungen'],
        possibleRanks: ['Hofarchitekt', 'Sakralbaumeister']
      },
      {
        id: 'generalbaumeister',
        fieldId: 'bau_handwerk',
        name: 'Generalbaumeister & Stadtplaner',
        tier: 'meister',
        parentIds: ['festungsbaumeister', 'palastarchitekt'],
        childIds: [],
        description: 'Oberaufsicht über das gesamte Bauwesen einer Stadt oder Herrschaft sowie Festungsringe.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Erfahrung', minValue: 5 },
          { type: 'rank', label: 'Meistergrad' }
        ],
        careerRoutes: [
          { id: 'gb_pat', name: 'Königliches Baupatent', type: 'social_recognition', description: 'Ernennung zum Generalbaumeister der Krone.', requirementsSummary: '5 Jahre Praxis + Großprojekt' }
        ],
        suggestedCompetencies: ['Stadtplanung', 'Großbaustellenlogistik', 'Festungsring-Architektur'],
        possibleRanks: ['Generalbaumeister', 'Oberhofbaumeister']
      },

      // DACHDECKER BRANCH
      {
        id: 'dachdecker',
        fieldId: 'bau_handwerk',
        name: 'Dachdecker & Schieferdecker',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: ['schieferdecker', 'turmdecker'],
        description: 'Eindeckung von Dächern mit Schiefer, Schindeln, Reet, Ziegeln und Metallabdeckungen.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'dd_exam', name: 'Dachdeckergesellenbrief', type: 'exam', description: 'Prüfung in Dacheindeckung und Sturmsicherung.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Dacheindeckung', 'Schwind- & Schieferhauen', 'Sturmsicherung', 'Schwindelfreiheit'],
        possibleRanks: ['Dachdeckergeselle', 'Schieferdecker', 'Dachdeckermeister']
      },
      {
        id: 'schieferdecker',
        fieldId: 'bau_handwerk',
        name: 'Schieferdecker & Blechspengler',
        tier: 'spezialisierung',
        specializationOf: 'dachdecker',
        parentIds: ['dachdecker'],
        childIds: [],
        description: 'Feine Bogenschnitt-Schieferdeckungen, Kehlen und metallene Ableitungen.',
        prerequisites: [
          { type: 'profession', label: 'Dachdecker & Schieferdecker', targetId: 'dachdecker' }
        ],
        careerRoutes: [
          { id: 'sd_exp', name: 'Schieferpraxis', type: 'experience', description: 'Altdeutsche Schieferdeckung.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Altdeutsche Deckung', 'Spenglerarbeit', 'Ortgang & First'],
        possibleRanks: ['Schieferdecker', 'Spengler']
      },
      {
        id: 'turmdecker',
        fieldId: 'bau_handwerk',
        name: 'Kupfer- & Turmdecker',
        tier: 'spezialisierung',
        specializationOf: 'dachdecker',
        parentIds: ['dachdecker'],
        childIds: [],
        description: 'Eindeckung steiler Kirchtürme, Kuppeln und Helmdächer mit Kupfer- und Bleiplatten.',
        prerequisites: [
          { type: 'profession', label: 'Dachdecker & Schieferdecker', targetId: 'dachdecker' }
        ],
        careerRoutes: [
          { id: 'td_exp', name: 'Turmhaubenpraxis', type: 'experience', description: 'Höhenarbeiten an Kirchtürmen und Burgen.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Kupferblechfalzung', 'Turmhaubendeckung', 'Höhensicherheit'],
        possibleRanks: ['Turmdecker', 'Kupferdeckermeister']
      },

      // BRUNNENBAUER BRANCH
      {
        id: 'brunnenbauer',
        fieldId: 'bau_handwerk',
        name: 'Brunnen- & Brückenbauer',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: ['tiefbrunnenbauer', 'wasserbaumeister'],
        description: 'Aushub und Fassung von Tiefbrunnen, Zisternen, Pfeilerfundamenten und Brückenjochen.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'bb_exam', name: 'Brunnenbauerprüfung', type: 'exam', description: 'Prüfung in Schachtbau und Grundwassersicherung.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Schachtabstützung', 'Grundwasserprüfung', 'Pfeilergründung', 'Pumpenmechanik'],
        possibleRanks: ['Brunnenbauergeselle', 'Brunnenmeister']
      },
      {
        id: 'tiefbrunnenbauer',
        fieldId: 'bau_handwerk',
        name: 'Tiefbrunnen- & Schachtbauer',
        tier: 'spezialisierung',
        specializationOf: 'brunnenbauer',
        parentIds: ['brunnenbauer'],
        childIds: [],
        description: 'Tiefste Burgbrunnen, Felsstollen und versiegelte Quellfassungen.',
        prerequisites: [
          { type: 'profession', label: 'Brunnen- & Brückenbauer', targetId: 'brunnenbauer' }
        ],
        careerRoutes: [
          { id: 'tb_exp', name: 'Burgbrunnenpraxis', type: 'experience', description: 'Abteufen von Felsbrunnen.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Felsaushub', 'Senkbrunnenbau', 'Luftzufuhr in Tiefen'],
        possibleRanks: ['Tiefbrunnenmeister']
      },
      {
        id: 'wasserbaumeister',
        fieldId: 'bau_handwerk',
        name: 'Wasserbau- & Zisternenmeister',
        tier: 'spezialisierung',
        specializationOf: 'brunnenbauer',
        parentIds: ['brunnenbauer'],
        childIds: [],
        description: 'Wasserleitungen, Aquädukte, Schleusen und städtische Frischwasserversorgung.',
        prerequisites: [
          { type: 'profession', label: 'Brunnen- & Brückenbauer', targetId: 'brunnenbauer' }
        ],
        careerRoutes: [
          { id: 'wb_exp', name: 'Wasserbaupraxis', type: 'experience', description: 'Kanäle, Schleusen und Leitungen.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Aquäduktstatik', 'Schleusenbau', 'Wasserdruckberechnung'],
        possibleRanks: ['Wasserbaumeister', 'Röhrenmeister']
      },
      // SCHREINER / TISCHLER BRANCH
      {
        id: 'schreiner',
        fieldId: 'bau_handwerk',
        name: 'Schreiner & Tischler',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: ['kunsttischler', 'bautischler', 'drechsler'],
        description: 'Möbelbau, Türen, Fenster, Holzverbindungen und Schnitzarbeiten.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'schr_exam', name: 'Tischlergeselle', type: 'exam', description: 'Zunftabschluss.', requirementsSummary: 'Zunftnachweis' }],
        suggestedCompetencies: ['Zinken & Zapfen', 'Hobeln', 'Oberflächenbeize'],
        possibleRanks: ['Geselle', 'Schreinermeister']
      },
      {
        id: 'kunsttischler',
        fieldId: 'bau_handwerk',
        name: 'Kunsttischler & Intarsienschneider',
        tier: 'spezialisierung',
        specializationOf: 'schreiner',
        parentIds: ['schreiner'],
        childIds: ['tischlermeister'],
        description: 'Edelmöbel, Furniertechniken, feine Einlegearbeiten und kunstvolle Schnitzereien.',
        prerequisites: [
          { type: 'profession', label: 'Schreiner & Tischler', targetId: 'schreiner' },
          { type: 'experience_years', label: '2 Jahre Tischlererfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'kt_exp', name: 'Kunsttischlerei', type: 'experience', description: 'Arbeit an Prunkmöbeln und Chorgestühl.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Furnieren & Intarsien', 'Holzschnitzerei', 'Schellackpolitur'],
        possibleRanks: ['Kunsttischler', 'Kabinettmacher']
      },
      {
        id: 'bautischler',
        fieldId: 'bau_handwerk',
        name: 'Bautischler & Treppenbauer',
        tier: 'spezialisierung',
        specializationOf: 'schreiner',
        parentIds: ['schreiner'],
        childIds: ['tischlermeister'],
        description: 'Passgenaue Tore, Schiebefenster, Wendeltreppen und wetterfester Holzausbau.',
        prerequisites: [
          { type: 'profession', label: 'Schreiner & Tischler', targetId: 'schreiner' }
        ],
        careerRoutes: [
          { id: 'bt_exp', name: 'Bauausbaupraxis', type: 'experience', description: 'Ausbau städtischer Häuser und Herrensitze.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Treppenwangen anreißen', 'Fensterbeschläge', 'Bautischlerei'],
        possibleRanks: ['Bautischler']
      },
      {
        id: 'drechsler',
        fieldId: 'bau_handwerk',
        name: 'Drechsler & Holzgestalter',
        tier: 'spezialisierung',
        specializationOf: 'schreiner',
        parentIds: ['schreiner'],
        childIds: [],
        description: 'Drechseln von Säulen, Geländersprossen, Schalen, Griffen und Pfeifenkörpern.',
        prerequisites: [
          { type: 'profession', label: 'Schreiner & Tischler', targetId: 'schreiner' }
        ],
        careerRoutes: [
          { id: 'dr_exp', name: 'Drechselbankpraxis', type: 'experience', description: 'Rotationstechnik an Drehbank und Werkbank.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Drehbankführung', 'Langholzdrehen', 'Querholzdrehen'],
        possibleRanks: ['Drechsler']
      },
      {
        id: 'tischlermeister',
        fieldId: 'bau_handwerk',
        name: 'Zunftmeister des Tischlerhandwerks',
        tier: 'meister',
        parentIds: ['kunsttischler', 'bautischler'],
        childIds: [],
        description: 'Höchste Möbelbaukunst, Meisterstücke, Zunftleitung und Bauleitung nobler Innenausbauten.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Erfahrung', minValue: 5 },
          { type: 'rank', label: 'Meistergrad' }
        ],
        careerRoutes: [
          { id: 'tm_exam', name: 'Meisterstück', type: 'exam', description: 'Meistermöbel vor der Prüfungskommission.', requirementsSummary: '5 Jahre Praxis + Meisterprüfung' }
        ],
        suggestedCompetencies: ['Meisterstückbau', 'Zunftgerichtsbarkeit', 'Restaurierung'],
        possibleRanks: ['Zunftmeister', 'Hofebenist']
      },

      // ZIMMERMANN / DACHDECKER BRANCH
      {
        id: 'zimmermann',
        fieldId: 'bau_handwerk',
        name: 'Zimmermann & Dachdecker',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: ['fachwerkzimmermann', 'brueckenbauer', 'schiffszimmermann'],
        description: 'Dachstühle, Fachwerkbauten, Brücken und schwere Holzkonstruktionen.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'zim_exam', name: 'Walz & Wanderschaft', type: 'experience', description: 'Wanderschaft auf traditioneller Walz.', requirementsSummary: '1+ Jahr Praxis' }],
        suggestedCompetencies: ['Fachwerk abbinden', 'Dachstuhl richten', 'Holzverbinder'],
        possibleRanks: ['Wandergeselle', 'Zimmermeister']
      },
      {
        id: 'fachwerkzimmermann',
        fieldId: 'bau_handwerk',
        name: 'Fachwerk- & Dachstuhlbauer',
        tier: 'spezialisierung',
        specializationOf: 'zimmermann',
        parentIds: ['zimmermann'],
        childIds: ['zimmermeister'],
        description: 'Monumentale Dachstühle, Hängewerke, Giebelbindungen und mehrgeschossige Fachwerkbauten.',
        prerequisites: [
          { type: 'profession', label: 'Zimmermann & Dachdecker', targetId: 'zimmermann' },
          { type: 'experience_years', label: '2 Jahre Zimmermannserfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'fw_exp', name: 'Fachwerkabbund', type: 'experience', description: 'Großprojekte für Rathäuser und Scheunen.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Hängewerke berechnen', 'Kerve & Zapfen', 'Firstausrichtung'],
        possibleRanks: ['Fachwerkzimmermann']
      },
      {
        id: 'brueckenbauer',
        fieldId: 'bau_handwerk',
        name: 'Brücken- & Mühlenbauer',
        tier: 'spezialisierung',
        specializationOf: 'zimmermann',
        parentIds: ['zimmermann'],
        childIds: ['zimmermeister'],
        description: 'Tragfähige Flussbrücken, Wasserradkonstruktionen, Windmühlenflügel und Hebewerke.',
        prerequisites: [
          { type: 'profession', label: 'Zimmermann & Dachdecker', targetId: 'zimmermann' }
        ],
        careerRoutes: [
          { id: 'bb_exp', name: 'Ingenieurholzbau', type: 'experience', description: 'Bau von Wehranlagen und Mühlengetrieben.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Wasserräder zimmern', 'Pfahlgründung im Wasser', 'Kammräder verzapfen'],
        possibleRanks: ['Mühlenbaumeister']
      },
      {
        id: 'schiffszimmermann',
        fieldId: 'bau_handwerk',
        name: 'Schiffszimmermann & Werftbauer',
        tier: 'spezialisierung',
        specializationOf: 'zimmermann',
        parentIds: ['zimmermann'],
        childIds: [],
        description: 'Kiellegung, Spantenbiegen unter Dampf, Decksbeplankung und Kalfatern von Schiffskörpern.',
        prerequisites: [
          { type: 'profession', label: 'Zimmermann & Dachdecker', targetId: 'zimmermann' }
        ],
        careerRoutes: [
          { id: 'sz_exp', name: 'Werftarbeit', type: 'experience', description: 'Bau von Koggen, Galeeren und Flusskähnen.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Spanten anreißen', 'Planken dämpfen', 'Kalfatern'],
        possibleRanks: ['Schiffszimmermann']
      },
      {
        id: 'zimmermeister',
        fieldId: 'bau_handwerk',
        name: 'Großzimmermeister & Werkbaumeister',
        tier: 'meister',
        parentIds: ['fachwerkzimmermann', 'brueckenbauer'],
        childIds: [],
        description: 'Oberleitung gewaltiger Holzgroßbauten, Festungsbrücken und städtischer Dachlandschaften.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Erfahrung', minValue: 5 },
          { type: 'rank', label: 'Meistergrad' }
        ],
        careerRoutes: [
          { id: 'zm_exam', name: 'Großmeisterprüfung', type: 'exam', description: 'Statische Abnahme eines Hallendachstuhls.', requirementsSummary: '5 Jahre Praxis + Prüfung' }
        ],
        suggestedCompetencies: ['Großbaustellenleitung', 'Holzstatik', 'Kran- und Hebewerkbau'],
        possibleRanks: ['Werkmeister', 'Oberzimmermann']
      },

      // MAURER / STEINMETZ BRANCH
      {
        id: 'maurer',
        fieldId: 'bau_handwerk',
        name: 'Maurer & Steinmetz',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: ['steinmetz', 'gewoelbemeister', 'stuckateur'],
        description: 'Mauerwerk, Gewölbebau, Natursteinbearbeitung und Fundamentlegung.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'mau_exp', name: 'Bauhüttenpraxis', type: 'experience', description: 'Arbeit an Burgen und Sakralbauten.', requirementsSummary: 'Praxis' }],
        suggestedCompetencies: ['Bruchsteinmauerwerk', 'Gewölbebogen setzen', 'Mörtelmischung'],
        possibleRanks: ['Steinmetzgeselle', 'Bauhüttenmeister']
      },
      {
        id: 'steinmetz',
        fieldId: 'bau_handwerk',
        name: 'Steinmetz & Bildhauer',
        tier: 'spezialisierung',
        specializationOf: 'maurer',
        parentIds: ['maurer'],
        childIds: ['bauhuettenmeister'],
        description: 'Filigranes Maßwerk, Fialen, Wappenreliefs, Skulpturen und präzise Werksteinquader.',
        prerequisites: [
          { type: 'profession', label: 'Maurer & Steinmetz', targetId: 'maurer' },
          { type: 'experience_years', label: '2 Jahre Steinmetzerfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'sm_exp', name: 'Dombauhütte', type: 'experience', description: 'Steinschnitt an Kathedralen und Palästen.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Maßwerk behauen', 'Reliefschnitt', 'Steinverankerung'],
        possibleRanks: ['Steinbildhauer', 'Hüttengeselle']
      },
      {
        id: 'gewoelbemeister',
        fieldId: 'bau_handwerk',
        name: 'Gewölbe- & Festungsbauer',
        tier: 'spezialisierung',
        specializationOf: 'maurer',
        parentIds: ['maurer'],
        childIds: ['bauhuettenmeister'],
        description: 'Kreuzrippengewölbe, Wehrgänge, Pechnasen, Zugbrückenportale und massive Wehrmauern.',
        prerequisites: [
          { type: 'profession', label: 'Maurer & Steinmetz', targetId: 'maurer' }
        ],
        careerRoutes: [
          { id: 'gm_exp', name: 'Festungsbau', type: 'experience', description: 'Befestigung von Stadtmauern und Bergfrieden.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Gewölbeschalung setzen', 'Wehrbauten konstruieren', 'Schießscharten schneiden'],
        possibleRanks: ['Festungsmaurer']
      },
      {
        id: 'stuckateur',
        fieldId: 'bau_handwerk',
        name: 'Stuckateur & Fassadenputzer',
        tier: 'spezialisierung',
        specializationOf: 'maurer',
        parentIds: ['maurer'],
        childIds: [],
        description: 'Kalkglättung, Reliefstuckaturen, Sgraffito und wasserfester Außenschutz.',
        prerequisites: [
          { type: 'profession', label: 'Maurer & Steinmetz', targetId: 'maurer' }
        ],
        careerRoutes: [
          { id: 'st_exp', name: 'Putz- & Stuckpraxis', type: 'experience', description: 'Gestaltung repräsentativer Hallen.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Kalkputz zubereiten', 'Stuckgesimse ziehen', 'Sgraffito'],
        possibleRanks: ['Stuckateur']
      },
      {
        id: 'bauhuettenmeister',
        fieldId: 'bau_handwerk',
        name: 'Bauhüttenmeister & Dombaumeister',
        tier: 'meister',
        parentIds: ['steinmetz', 'gewoelbemeister'],
        childIds: [],
        description: 'Gesamtleitung der Bauhütte, statische Berechnungen, Risszeichnungen und Sakralarchitektur.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Erfahrung', minValue: 5 },
          { type: 'rank', label: 'Meistergrad' }
        ],
        careerRoutes: [
          { id: 'bm_exam', name: 'Hüttenprüfung', type: 'exam', description: 'Prüfung der Hüttengeheimnisse und Bauplanzeichnung.', requirementsSummary: '5 Jahre Praxis + Bauwerksabnahme' }
        ],
        suggestedCompetencies: ['Bauplanung & Risszeichnung', 'Hüttengeheimnisse', 'Gewölbestatik'],
        possibleRanks: ['Dombaumeister', 'Hüttenmeister']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 3. MILITÄR & SICHERHEIT
  // ---------------------------------------------------------------------------
  militaer_sicherheit: {
    fieldId: 'militaer_sicherheit',
    fieldName: 'Militär & Sicherheit',
    description: 'Stadtwache, Garnisonsdienst, Wehrwesen, Taktik und Befestigung',
    rootNodeId: 'militaer_root',
    nodes: [
      {
        id: 'militaer_root',
        fieldId: 'militaer_sicherheit',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['soldat', 'stadtwache', 'soeldner', 'jaeger_militaer'],
        description: 'Einstieg in den Berufszweig „Militär & Sicherheit“',
        prerequisites: [],
        careerRoutes: [
          { id: 'm_enlist', name: 'Musterung & Dienstantritt', type: 'experience', description: 'Einschreibung in die Wehrliste.', requirementsSummary: 'Diensttauglich' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      {
        id: 'soldat',
        fieldId: 'militaer_sicherheit',
        name: 'Soldat / Infanterist',
        tier: 'beruf',
        parentIds: ['militaer_root'],
        childIds: ['spezialkaempfer', 'scout_militaer', 'kanonier_militaer', 'taktiker_militaer', 'offizier', 'gardist'],
        description: 'Regulärer Militärdienst in Linienformation, Belagerung und Feldschlacht.',
        prerequisites: [{ type: 'experience_years', label: '1 Dienstjahr', minValue: 1 }],
        careerRoutes: [
          { id: 'sol_exp', name: 'Garnisonsdienst', type: 'experience', description: 'Dienst in Feldzügen und Garnisonen.', requirementsSummary: '1 Jahr Dienst' },
          { id: 'sol_notfall', name: 'Bewährung im Gefecht', type: 'emergency', description: 'Auszeichnung nach einer Schlacht.', requirementsSummary: 'Kampfeinsatz' }
        ],
        suggestedCompetencies: ['Schildwall', 'Nahkampftechnik', 'Formation halten'],
        possibleRanks: ['Gefreiter', 'Korporal', 'Feldwebel']
      },
      {
        id: 'spezialkaempfer',
        fieldId: 'militaer_sicherheit',
        name: 'Spezialkämpfer & Sturminfanterist',
        tier: 'spezialisierung',
        specializationOf: 'soldat',
        parentIds: ['soldat'],
        childIds: ['offizier'],
        description: 'Ausgebildeter Elitesoldat für Breschensturm, Nahkampf im Graben und Spezialeinsätze.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Kampfdienst', minValue: 2 }],
        careerRoutes: [
          { id: 'sk_exp', name: 'Sturmfront-Bewährung', type: 'experience', description: 'Einsatz in vorderster Frontlinie.', requirementsSummary: 'Kampferfahrung' }
        ],
        suggestedCompetencies: ['Sturmangriff', 'Breschenkampf', 'Zweikampf', 'Zähigkeit'],
        possibleRanks: ['Sturmsoldat', 'Eliteschütze', 'Stoßtruppführer']
      },
      {
        id: 'scout_militaer',
        fieldId: 'militaer_sicherheit',
        name: 'Scout & Pfadfinder',
        tier: 'spezialisierung',
        specializationOf: 'soldat',
        parentIds: ['soldat'],
        childIds: ['offizier'],
        description: 'Vorhutaufklärung, Erkundung feindlicher Truppenbewegungen und Pfadsuche im Terrain.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Militärpraxis', minValue: 1 }],
        careerRoutes: [
          { id: 'sc_exp', name: 'Aufklärungsdienst', type: 'experience', description: 'Späheinsatz im Niemandsland.', requirementsSummary: 'Geländeerfahrung' }
        ],
        suggestedCompetencies: ['Geländeaufklärung', 'Tarnung & Lautlosigkeit', 'Meldereiten', 'Geländekizzen'],
        possibleRanks: ['Aufklärer', 'Kundschafter', 'Vorhutspäher']
      },
      {
        id: 'kanonier_militaer',
        fieldId: 'militaer_sicherheit',
        name: 'Kanonier & Artillerist',
        tier: 'spezialisierung',
        specializationOf: 'soldat',
        parentIds: ['soldat'],
        childIds: ['offizier'],
        description: 'Bedienung von Feldgeschützen, Katapulten, Mörsern und Ballisten im Gefecht.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Artilleriedienst', minValue: 1 }],
        careerRoutes: [
          { id: 'kan_exam', name: 'Büchsenmeisterprüfung', type: 'exam', description: 'Prüfung in Ballistik und Pulverhandhabung.', requirementsSummary: 'Pulverprüfung' }
        ],
        suggestedCompetencies: ['Pulverkunde & Munition', 'Ballistik & Ausrichten', 'Belagerungsdeckung', 'Rohrwartung'],
        possibleRanks: ['Kanonier', 'Stückmeister', 'Feuerwerker']
      },
      {
        id: 'taktiker_militaer',
        fieldId: 'militaer_sicherheit',
        name: 'Taktiker & Manöverplaner',
        tier: 'spezialisierung',
        specializationOf: 'soldat',
        parentIds: ['soldat'],
        childIds: ['offizier'],
        description: 'Analyse von Schlachtfeldern, Versorgungslinien, Aufstellungen und Gegenmanövern.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Stabs- oder Kampfdienst', minValue: 2 }],
        careerRoutes: [
          { id: 'tak_acad', name: 'Kriegsakademie', type: 'exam', description: 'Ausbildung im strategischen Planungsstab.', requirementsSummary: 'Kriegsakademie' }
        ],
        suggestedCompetencies: ['Schlachttaktik', 'Kartenanalyse', 'Logistikberechnung', 'Feindaufklärung'],
        possibleRanks: ['Stabsunteroffizier', 'Taktischer Adjutant']
      },
      {
        id: 'stadtwache',
        fieldId: 'militaer_sicherheit',
        name: 'Stadtwache & Ordnungshüter',
        tier: 'beruf',
        parentIds: ['militaer_root'],
        childIds: ['wachtmeister'],
        description: 'Patrouille, Torsicherung, Festnahmen und Schutz der städtischen Ordnung.',
        prerequisites: [{ type: 'experience_years', label: '1 Dienstjahr', minValue: 1 }],
        careerRoutes: [
          { id: 'wache_exam', name: 'Stadteid', type: 'exam', description: 'Eid auf die Stadtordnung.', requirementsSummary: 'Bürgerprüfung' }
        ],
        suggestedCompetencies: ['Festnahmetechnik', 'Gassenkampf', 'Deeskalation & Torwache'],
        possibleRanks: ['Torwächter', 'Rottmeister', 'Wachtmeister']
      },
      {
        id: 'soeldner',
        fieldId: 'militaer_sicherheit',
        name: 'Söldner & Freischärler',
        tier: 'beruf',
        parentIds: ['militaer_root'],
        childIds: ['soeldnerfuehrer'],
        description: 'Vertragsgebundener Kampfdienst für wechselnde Kriegsherren und Gilden.',
        prerequisites: [],
        careerRoutes: [
          { id: 'soeld_exp', name: 'Vertragserfüllung', type: 'experience', description: 'Dienst in freien Kompanien.', requirementsSummary: 'Kampferfahrung' }
        ],
        suggestedCompetencies: ['Waffenvielfalt', 'Kompanietaktik', 'Beuterecht'],
        possibleRanks: ['Söldner', 'Doppelsöldner', 'Hauptmann']
      },
      {
        id: 'jaeger_militaer',
        fieldId: 'militaer_sicherheit',
        name: 'Scharfschütze / Späher',
        tier: 'spezialisierung',
        parentIds: ['militaer_root'],
        childIds: [],
        description: 'Präziser Fernkampf mit Langbogen oder Armbrust und Geländeaufklärung.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Kampfpraxis', minValue: 1 }],
        careerRoutes: [
          { id: 'sp_exp', name: 'Spähdienst', type: 'experience', description: 'Vorhut im feindlichen Hinterland.', requirementsSummary: 'Erfahrung' }
        ],
        suggestedCompetencies: ['Armbrust zielen', 'Tarnung & Schleichen', 'Hinterhalt'],
        possibleRanks: ['Freischütz', 'Spähführer']
      },
      {
        id: 'offizier',
        fieldId: 'militaer_sicherheit',
        name: 'Offizier & Taktiker',
        tier: 'spezialisierung',
        specializationOf: 'soldat',
        parentIds: ['soldat'],
        childIds: ['kommandant'],
        description: 'Befehlsführung, Manöverplanung, Truppenversorgung und strategische Führung.',
        prerequisites: [
          { type: 'experience_years', label: '3 Jahre Militärdienst', minValue: 3 }
        ],
        careerRoutes: [
          { id: 'off_exam', name: 'Militärakademie / Patent', type: 'exam', description: 'Erwerb eines Offizierspatents.', requirementsSummary: 'Patent / Prüfung' },
          { id: 'off_emergency', name: 'Ernennung im Felde (Notfall)', type: 'emergency', description: 'Übernahme des Kommandos nach Ausfall der Führung.', requirementsSummary: 'Ernennung durch Truppe' }
        ],
        suggestedCompetencies: ['Truppenführung', 'Schlachttaktik', 'Befestigungslehre'],
        possibleRanks: ['Leutnant', 'Hauptmann', 'Major']
      },
      {
        id: 'wachtmeister',
        fieldId: 'militaer_sicherheit',
        name: 'Wachtmeister / Stadtvogt',
        tier: 'spezialisierung',
        specializationOf: 'stadtwache',
        parentIds: ['stadtwache'],
        childIds: ['kommandant'],
        description: 'Leitung einer Wacheinheit, Untersuchungsführung und Kasernenaufsicht.',
        prerequisites: [
          { type: 'experience_years', label: '3 Jahre Wachdienst', minValue: 3 }
        ],
        careerRoutes: [
          { id: 'wm_soc', name: 'Beförderung durch Stadtrat', type: 'social_recognition', description: 'Ernennung zum Wachtmeister durch Ratsbeschluss.', requirementsSummary: 'Dienstbewährung' }
        ],
        suggestedCompetencies: ['Wachaufsicht', 'Vernehmung', 'Garnisonsverwaltung'],
        possibleRanks: ['Oberwachtmeister', 'Wachhauptmann']
      },
      {
        id: 'gardist',
        fieldId: 'militaer_sicherheit',
        name: 'Palastgardist & Leibwächter',
        tier: 'spezialisierung',
        specializationOf: 'soldat',
        parentIds: ['soldat'],
        childIds: ['kommandant'],
        description: 'Ausgewählter Schutz von Herrschern, Adeligen und strategischen Prunkbauten.',
        prerequisites: [
          { type: 'experience_years', label: '2 Jahre Militärdienst', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'gard_soc', name: 'Aufnahme in die Garde', type: 'social_recognition', description: 'Auswahl durch den Palastkommandanten.', requirementsSummary: 'Treueeid & Bewährung' }
        ],
        suggestedCompetencies: ['Personenschutz', 'Paradeformation', 'Ehrenwache'],
        possibleRanks: ['Gardist', 'Gardeoffizier']
      },
      {
        id: 'soeldnerfuehrer',
        fieldId: 'militaer_sicherheit',
        name: 'Söldnerführer / Kondottiere',
        tier: 'spezialisierung',
        specializationOf: 'soeldner',
        parentIds: ['soeldner'],
        childIds: ['kommandant'],
        description: 'Führung einer freien Söldnerkompanie, Verhandlung von Soldverträgen.',
        prerequisites: [
          { type: 'experience_years', label: '3 Jahre Kampfpraxis', minValue: 3 }
        ],
        careerRoutes: [
          { id: 'sf_exp', name: 'Kompaniegründung / Wahl', type: 'social_recognition', description: 'Gewählt von den Söldnern der Kompanie.', requirementsSummary: 'Wahl durch Söldnerrat' }
        ],
        suggestedCompetencies: ['Soldverhandlungen', 'Schlachtfeld-Kommando', 'Logistik'],
        possibleRanks: ['Kompanieführer', 'Kondottiere']
      },
      {
        id: 'kommandant',
        fieldId: 'militaer_sicherheit',
        name: 'Kommandant & Befehlshaber',
        tier: 'spezialisierung',
        parentIds: ['offizier', 'wachtmeister', 'gardist', 'soeldnerfuehrer'],
        childIds: ['general'],
        description: 'Oberbefehlshaber von Festungen, Heeresabteilungen oder Garnisonen.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Führungserfahrung', minValue: 5 }
        ],
        careerRoutes: [
          { id: 'kom_formal', name: 'Hohe Ernennung / Patent', type: 'exam', description: 'Bestallungsurkunde durch Landesherrn.', requirementsSummary: 'Bestallung' },
          { id: 'kom_emergency', name: 'Anerkennung in der Not', type: 'emergency', description: 'Truppen ernennen fähigen Veteranen zum Oberbefehl.', requirementsSummary: 'Kriegsnotwendigkeit' }
        ],
        suggestedCompetencies: ['Heeresführung', 'Festungsverteidigung', 'Kriegsrat leiten', 'Großstrategie'],
        possibleRanks: ['Garnisonskommandant', 'Festungskommandant', 'Oberst']
      },
      {
        id: 'general',
        fieldId: 'militaer_sicherheit',
        name: 'General & Feldherr',
        tier: 'meister',
        parentIds: ['kommandant'],
        childIds: [],
        description: 'Höchster militärischer Rang, Oberbefehl über Feldheere, Korps und strategische Kriegsoperationen.',
        prerequisites: [
          { type: 'experience_years', label: '7 Jahre Diensterfahrung', minValue: 7 }
        ],
        careerRoutes: [
          { id: 'gen_patent', name: 'Generalspatent des Herrschers', type: 'exam', description: 'Höchste Ernennung durch Krone oder Reichstag.', requirementsSummary: 'Königliches Patent' },
          { id: 'gen_soc', name: 'Triumph & Ruhm', type: 'social_recognition', description: 'Ernennung zum Oberbefehlshaber nach kriegsentscheidendem Sieg.', requirementsSummary: 'Kriegsruhm' }
        ],
        suggestedCompetencies: ['Großstrategie', 'Kriegsratleitung', 'Schlachtfeld-Disposition', 'Diplomatisches Kriegsrecht'],
        possibleRanks: ['Generalmajor', 'Generalleutnant', 'General der Infanterie', 'Generalfeldmarschall']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 4. SEEFAHRT
  // ---------------------------------------------------------------------------
  seefahrt: {
    fieldId: 'seefahrt',
    fieldName: 'Seefahrt',
    description: 'Nautik, Takelage, Schiffsführung, Küsten- und Hochseefahrt',
    rootNodeId: 'seefahrt_root',
    nodes: [
      {
        id: 'seefahrt_root',
        fieldId: 'seefahrt',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['seemann', 'lotse'],
        description: 'Einstieg in den Berufszweig „Seefahrt & Schifffahrt“',
        prerequisites: [],
        careerRoutes: [
          { id: 's_muster', name: 'Heuern auf Schiff', type: 'experience', description: 'Erste Ausfahrt auf Frachter oder Kutter.', requirementsSummary: 'Heuervertrag' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      {
        id: 'seemann',
        fieldId: 'seefahrt',
        name: 'Seemann / Vollmatrose',
        tier: 'beruf',
        parentIds: ['seefahrt_root'],
        childIds: ['steuermann', 'bootsmann', 'harpunier'],
        description: 'Segel setzen, Rigg klettern, Rudergehen und Schiffsunterhalt bei Sturm und Flaute.',
        prerequisites: [{ type: 'experience_years', label: '1 Seefahrtsjahr', minValue: 1 }],
        careerRoutes: [
          { id: 'sm_exp', name: 'Jahre auf hoher See', type: 'experience', description: 'Fahrten über raue Meere.', requirementsSummary: '1+ Jahr Seefahrt' }
        ],
        suggestedCompetencies: ['Takelage bedienen', 'Segel reffen', 'Rudergehen', 'Schiffszimmerei'],
        possibleRanks: ['Vollmatrose', 'Obermatrose']
      },
      {
        id: 'lotse',
        fieldId: 'seefahrt',
        name: 'Lotse & Küstenschiffer',
        tier: 'beruf',
        parentIds: ['seefahrt_root'],
        childIds: [],
        description: 'Sichere Durchfahrt durch Riffe, Untiefen, Flussmündungen und Hafeneinfahrten.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Revierkenntnis', minValue: 2 }],
        careerRoutes: [
          { id: 'lot_exam', name: 'Lotsenpatent', type: 'exam', description: 'Nachweis genauer Tiefenkartenkenntnis.', requirementsSummary: 'Revierprüfung' }
        ],
        suggestedCompetencies: ['Untiefen peilen', 'Strömungslesen', 'Hafenlotsung'],
        possibleRanks: ['Hafenlotse', 'Revierlotse']
      },
      {
        id: 'steuermann',
        fieldId: 'seefahrt',
        name: 'Steuermann & Navigator',
        tier: 'spezialisierung',
        specializationOf: 'seemann',
        parentIds: ['seemann'],
        childIds: ['kapitaen'],
        description: 'Navigation nach Sternen, Kompass und Seekarte sowie Logbuchführung.',
        prerequisites: [
          { type: 'profession', label: 'Seemann', targetId: 'seemann' },
          { type: 'experience_years', label: '2 Jahre Seefahrt', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'st_exam', name: 'Steuermannspatent', type: 'exam', description: 'Nautische Navigationsprüfung.', requirementsSummary: 'Patent' },
          { id: 'st_exp', name: 'Erfahrung auf Langstrecke', type: 'experience', description: 'Praxis bei Ozeanüberquerungen.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Sternennavigation', 'Seekarten lesen', 'Koppelkurs berechnen'],
        possibleRanks: ['Zweiter Steuermann', 'Erster Steuermann']
      },
      {
        id: 'bootsmann',
        fieldId: 'seefahrt',
        name: 'Bootsmann / Takelmeister',
        tier: 'spezialisierung',
        specializationOf: 'seemann',
        parentIds: ['seemann'],
        childIds: ['kapitaen'],
        description: 'Aufsicht über Decksmannschaft, Takelwerk, Taue, Anker und Schiffsinstandhaltung.',
        prerequisites: [
          { type: 'profession', label: 'Seemann', targetId: 'seemann' },
          { type: 'experience_years', label: '2 Jahre Seefahrt', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'bm_soc', name: 'Beförderung durch Kapitän', type: 'social_recognition', description: 'Ernennung zum Decksvorsteher.', requirementsSummary: 'Beförderung' }
        ],
        suggestedCompetencies: ['Decksführung', 'Schiffsreparatur auf See', 'Sturmtakelung'],
        possibleRanks: ['Bootsmannsmaat', 'Bootsmann']
      },
      {
        id: 'harpunier',
        fieldId: 'seefahrt',
        name: 'Harpunier & Walfänger',
        tier: 'spezialisierung',
        specializationOf: 'seemann',
        parentIds: ['seemann'],
        childIds: [],
        description: 'Jagd auf Großfische, Meeresungeheuer und Robben mit Wurfgeschossen.',
        prerequisites: [{ type: 'profession', label: 'Seemann', targetId: 'seemann' }],
        careerRoutes: [{ id: 'harp_exp', name: 'Eismeerfahrten', type: 'experience', description: 'Fahrten in Nordgewässern.', requirementsSummary: 'Praxis' }],
        suggestedCompetencies: ['Harpunenwurf', 'Ungeheuerkunde', 'Trangewinnung'],
        possibleRanks: ['Harpunier']
      },
      {
        id: 'kapitaen',
        fieldId: 'seefahrt',
        name: 'Kapitän & Schiffsherr',
        tier: 'meister',
        parentIds: ['steuermann', 'bootsmann'],
        childIds: [],
        description: 'Gesamtbefehl über Schiff, Ladung, Besatzung und Verteidigung auf hoher See.',
        prerequisites: [
          { type: 'experience_years', label: '4 Jahre Seefahrt', minValue: 4 }
        ],
        careerRoutes: [
          { id: 'kap_formal', name: 'Kapitänspatent', type: 'exam', description: 'Offizielle Zertifizierung durch Admiralität oder Reeder.', requirementsSummary: 'Kapitänspatent' },
          { id: 'kap_emergency', name: 'Anerkennung in Not (Gefecht)', type: 'emergency', description: 'Kapitän fällt im Gefecht – Besatzung anerkennt den erfahrensten Seemann als neuen Kapitän.', requirementsSummary: 'Anerkennung durch Besatzung' },
          { id: 'kap_own', name: 'Schiffserwerb / Kaperung', type: 'social_recognition', description: 'Eigener Schiffsbesitz oder erobertes Kaperschiff.', requirementsSummary: 'Schiffsberechtigung' }
        ],
        suggestedCompetencies: ['Schiffsführung im Gefecht', 'Seerecht & Handelsverträge', 'Mannschaftsmotivation', 'Havariebeherrschung'],
        possibleRanks: ['Schiffskapitän', 'Flottillenkapitän', 'Kommodore', 'Admiral']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 5. NATUR & LANDWIRTSCHAFT
  // ---------------------------------------------------------------------------
  natur_landwirtschaft: {
    fieldId: 'natur_landwirtschaft',
    fieldName: 'Natur & Landwirtschaft',
    description: 'Feldbau, Forstwirtschaft, Jagd, Fischerei und Hege natürlicher Ressourcen',
    rootNodeId: 'natur_root',
    nodes: [
      {
        id: 'natur_root',
        fieldId: 'natur_landwirtschaft',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['bauer', 'jaeger', 'foerster', 'fischer', 'kraeutersammler'],
        description: 'Einstieg in den Berufszweig „Natur & Landwirtschaft“',
        prerequisites: [],
        careerRoutes: [{ id: 'n_start', name: 'Dienst auf Hof oder Gut', type: 'experience', description: 'Mitarbeit auf Landgütern.', requirementsSummary: 'Offen' }],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      {
        id: 'bauer',
        fieldId: 'natur_landwirtschaft',
        name: 'Bauer / Landwirt',
        tier: 'beruf',
        parentIds: ['natur_root'],
        childIds: ['hofbesitzer'],
        description: 'Ackerbau, Getreidezucht, Pflugführung und saisonale Ernte.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Landpraxis', minValue: 1 }],
        careerRoutes: [{ id: 'b_exp', name: 'Jahreszyklus', type: 'experience', description: 'Erfahrung durch Saat und Ernte.', requirementsSummary: '1 Jahr Praxis' }],
        suggestedCompetencies: ['Pflügen & Säen', 'Fruchtfolge', 'Getreideernte'],
        possibleRanks: ['Bauer', 'Hofverwalter']
      },
      {
        id: 'jaeger',
        fieldId: 'natur_landwirtschaft',
        name: 'Jäger & Fährtenleser',
        tier: 'beruf',
        parentIds: ['natur_root'],
        childIds: ['waldlaeufer', 'oberjaeger'],
        description: 'Pirsch, Spurensuche, Wildhege und Treffsicherheit im dichten Unterholz.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Waldpraxis', minValue: 1 }],
        careerRoutes: [{ id: 'j_exp', name: 'Fährtenpraxis', type: 'experience', description: 'Jahre im Dickicht.', requirementsSummary: '1 Jahr Praxis' }],
        suggestedCompetencies: ['Fährtenlesen', 'Fallenstellen', 'Bogenjagd', 'Wild aufbrechen'],
        possibleRanks: ['Jungjäger', 'Revierjäger']
      },
      {
        id: 'waldlaeufer',
        fieldId: 'natur_landwirtschaft',
        name: 'Waldläufer & Wildnisführer',
        tier: 'spezialisierung',
        specializationOf: 'jaeger',
        parentIds: ['jaeger'],
        childIds: ['wildnismeister'],
        description: 'Überleben in unberührter Wildnis, Orientierung abseits von Pfaden und Spurenlesen.',
        prerequisites: [
          { type: 'profession', label: 'Jäger', targetId: 'jaeger' },
          { type: 'experience_years', label: '2 Jahre Wildniserfahrung', minValue: 2 }
        ],
        careerRoutes: [{ id: 'wl_exp', name: 'Expeditionen ins Unbekannte', type: 'experience', description: 'Reisen fernab der Zivilisation.', requirementsSummary: '2 Jahre Praxis' }],
        suggestedCompetencies: ['Überlebenstechnik', 'Lautlose Bewegung', 'Naturinstinkt'],
        possibleRanks: ['Kundschafter', 'Waldläufer']
      },
      {
        id: 'foerster',
        fieldId: 'natur_landwirtschaft',
        name: 'Förster & Hegemeister',
        tier: 'beruf',
        parentIds: ['natur_root'],
        childIds: ['wildnismeister'],
        description: 'Verwaltung herrschaftlicher Wälder, Holzvergabe, Baumfällung und Schutz vor Wilderei.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Forstpraxis', minValue: 2 }],
        careerRoutes: [{ id: 'for_soc', name: 'Bestallung als Revierförster', type: 'social_recognition', description: 'Ernennung durch Grundherrn.', requirementsSummary: 'Ernennung' }],
        suggestedCompetencies: ['Baumprüfung', 'Forstverwaltung', 'Wildschutz'],
        possibleRanks: ['Revierförster', 'Oberförster']
      },
      {
        id: 'fischer',
        fieldId: 'natur_landwirtschaft',
        name: 'Fischer & Teichwirt',
        tier: 'beruf',
        parentIds: ['natur_root'],
        childIds: [],
        description: 'Netzfischerei, Reusenbau, Fluss- und Seeabfischung sowie Teichzucht.',
        prerequisites: [],
        careerRoutes: [{ id: 'f_exp', name: 'Gewässerpraxis', type: 'experience', description: 'Fischen auf Binnengewässern.', requirementsSummary: 'Praxis' }],
        suggestedCompetencies: ['Netzknüpfen & Werfen', 'Fischkunde', 'Räuchern'],
        possibleRanks: ['Fischer', 'Fischermeister']
      },
      {
        id: 'kraeutersammler',
        fieldId: 'natur_landwirtschaft',
        name: 'Kräutersammler & Sammler',
        tier: 'beruf',
        parentIds: ['natur_root'],
        childIds: [],
        description: 'Auffinden und schonendes Ernten seltener Heilpflanzen, Pilze und Waldfrüchte.',
        prerequisites: [],
        careerRoutes: [{ id: 'k_exp', name: 'Kräuterkunde in freier Natur', type: 'experience', description: 'Sammeln in Mooren und Bergen.', requirementsSummary: 'Praxis' }],
        suggestedCompetencies: ['Heilpflanzen erkennen', 'Schonende Ernte', 'Trocknung'],
        possibleRanks: ['Kräuterweib / Kräutermann', 'Meistersammler']
      },
      {
        id: 'hofbesitzer',
        fieldId: 'natur_landwirtschaft',
        name: 'Gutsverwalter / Meier',
        tier: 'meister',
        parentIds: ['bauer'],
        childIds: [],
        description: 'Leitung großer landwirtschaftlicher Güter, Speicheraufsicht und Pachtwirtschaft.',
        prerequisites: [{ type: 'experience_years', label: '4 Jahre Hofpraxis', minValue: 4 }],
        careerRoutes: [{ id: 'meier_soc', name: 'Pachtvertrag / Meierbestallung', type: 'social_recognition', description: 'Einsetzung durch Grundherrn.', requirementsSummary: 'Gutshof-Leitung' }],
        suggestedCompetencies: ['Ertragsrechnung', 'Großspeicherverwaltung', 'Vieh- und Saatguthandel'],
        possibleRanks: ['Meier', 'Gutsherr']
      },
      {
        id: 'wildnismeister',
        fieldId: 'natur_landwirtschaft',
        name: 'Oberforstmeister / Großwildheger',
        tier: 'meister',
        parentIds: ['waldlaeufer', 'foerster'],
        childIds: [],
        description: 'Oberste Verwaltung aller Forste und Jagdgebiete eines Fürstentums.',
        prerequisites: [{ type: 'experience_years', label: '5 Jahre forstliche Führung', minValue: 5 }],
        careerRoutes: [{ id: 'ofm_soc', name: 'Fürstliches Forstrecht', type: 'social_recognition', description: 'Ernennung zum Oberstforstmeister.', requirementsSummary: 'Fürstenerlass' }],
        suggestedCompetencies: ['Jagdgerichtsbarkeit', 'Großforstplanung', 'Herrschaftsjagd leiten'],
        possibleRanks: ['Oberstjägermeister', 'Landforstmeister']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 6. MAGIE & ARKANA
  // ---------------------------------------------------------------------------
  magie_arkana: {
    fieldId: 'magie_arkana',
    fieldName: 'Magie & Arkane Künste',
    description: 'Arkanistik, Elementarmagie, Runenkunde, Verzauberung und okkulte Studien',
    rootNodeId: 'magie_root',
    nodes: [
      {
        id: 'magie_root',
        fieldId: 'magie_arkana',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['arkanist', 'elementarist', 'runenschmied_node'],
        description: 'Einstieg in den Berufszweig „Magie & Arkana“',
        prerequisites: [],
        careerRoutes: [
          { id: 'mag_init', name: 'Arkanes Initiationsritual', type: 'exam', description: 'Erweckung des inneren Manaflusses.', requirementsSummary: 'Manaprüfung' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      {
        id: 'arkanist',
        fieldId: 'magie_arkana',
        name: 'Arkanist & Magiewirker',
        tier: 'beruf',
        parentIds: ['magie_root'],
        childIds: ['sigilmancer', 'nekromant', 'traumwandler', 'erzmagier'],
        description: 'Voll ausgebildeter Magier zur Lenkung arkaner Gewalten und magischer Resonanzen.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre magische Praxis', minValue: 2 }],
        careerRoutes: [
          { id: 'ark_exam', name: 'Magisterprüfung der Akademie', type: 'exam', description: 'Bestätigung des Magistergrades.', requirementsSummary: 'Akademieprüfung' }
        ],
        suggestedCompetencies: ['Arkanblitze', 'Magische Schilde', 'Telekinese', 'Spruchwebung'],
        possibleRanks: ['Magus', 'Arkanist', 'Magister']
      },
      {
        id: 'elementarist',
        fieldId: 'magie_arkana',
        name: 'Elementarist & Naturmagier',
        tier: 'beruf',
        parentIds: ['magie_root'],
        childIds: ['curseblade', 'erzmagier'],
        description: 'Meisterung der vier Urelemente Feuer, Wasser, Erde und Luft.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }],
        careerRoutes: [
          { id: 'elem_att', name: 'Elementare Einstimmung', type: 'experience', description: 'Harmonisierung an elementaren Kraftorten.', requirementsSummary: 'Elementarpakt' }
        ],
        suggestedCompetencies: ['Feuerlenkung', 'Erdformung', 'Wassermanipulation', 'Windböen'],
        possibleRanks: ['Elementarmagier', 'Pyromant / Kryomant', 'Elementarherr']
      },
      {
        id: 'runenschmied_node',
        fieldId: 'magie_arkana',
        name: 'Runenschmied & Verzauberer',
        tier: 'beruf',
        parentIds: ['magie_root'],
        childIds: ['runenmeister', 'erzmagier'],
        description: 'Bindung magischer Ströme in Metalle, Artefakte, Glyphen und Waffen.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Schmiede- oder Runenpraxis', minValue: 2 }],
        careerRoutes: [
          { id: 'run_exam', name: 'Prüfung der Runengilde', type: 'exam', description: 'Herstellung eines beständigen Runenartefakts.', requirementsSummary: 'Meisterrune' }
        ],
        suggestedCompetencies: ['Runenschnitzen', 'Verzauberung', 'Artefaktanalyse', 'Materialresonanz'],
        possibleRanks: ['Runenschmied', 'Artefaktwirker']
      },
      {
        id: 'sigilmancer',
        fieldId: 'magie_arkana',
        name: 'Sigilmancer & Talismanzer',
        tier: 'spezialisierung',
        specializationOf: 'arkanist',
        parentIds: ['arkanist'],
        childIds: ['erzmagier'],
        description: 'Schaffung magischer Siegelsiegel, Schutzkreise, Amulette und flüchtiger Talismane.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre arkanes Wirken', minValue: 3 }],
        careerRoutes: [
          { id: 'sig_exp', name: 'Siegelstudien', type: 'experience', description: 'Entschlüsselung uralter Schutzsiegel.', requirementsSummary: 'Siegelkunde' }
        ],
        suggestedCompetencies: ['Siegelzeichnung', 'Talismanbindung', 'Bannkreise', 'Sofort-Glyphen'],
        possibleRanks: ['Siegelschreiber', 'Großtalismanzer']
      },
      {
        id: 'nekromant',
        fieldId: 'magie_arkana',
        name: 'Nekromant & Geisterbeschwörer',
        tier: 'spezialisierung',
        specializationOf: 'arkanist',
        parentIds: ['arkanist'],
        childIds: ['erzmagier'],
        description: 'Manipulation von Lebenskraft, Kommunikation mit Seelen und Bündelung finsterer Energien.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre okkulte Praxis', minValue: 3 }],
        careerRoutes: [
          { id: 'nek_pakt', name: 'Pakt der Schattenlande', type: 'experience', description: 'Tiefes Verständnis des Übergangs.', requirementsSummary: 'Okkulte Riten' }
        ],
        suggestedCompetencies: ['Seelengeflüster', 'Knochenbelebung', 'Lebensraub', 'Geisterbann'],
        possibleRanks: ['Nekromant', 'Schattenbeschwörer']
      },
      {
        id: 'curseblade',
        fieldId: 'magie_arkana',
        name: 'Curseblade & Klingenflucher',
        tier: 'spezialisierung',
        specializationOf: 'elementarist',
        parentIds: ['elementarist'],
        childIds: ['erzmagier'],
        description: 'Arkan-kriegerische Fusion: Zauberladungen und Flüche direkt über Waffenangriffe entladen.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Kampf- und Magiepraxis', minValue: 2 }],
        careerRoutes: [
          { id: 'cb_exp', name: 'Klingenweihe', type: 'experience', description: 'Bindung des Schwertes an den Geist.', requirementsSummary: 'Klingenschwur' }
        ],
        suggestedCompetencies: ['Fluchklinge', 'Kanalisierter Hieb', 'Arkanausweichschritt', 'Waffenverzauberung'],
        possibleRanks: ['Fluchklinge', 'Runenfechter']
      },
      {
        id: 'traumwandler',
        fieldId: 'magie_arkana',
        name: 'Traumwandler & Medium',
        tier: 'spezialisierung',
        specializationOf: 'arkanist',
        parentIds: ['arkanist'],
        childIds: ['erzmagier'],
        description: 'Eindringen in Träume, Visionen fremder Gedankenwelten und Geisterbefragung.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre meditative Praxis', minValue: 2 }],
        careerRoutes: [
          { id: 'tw_exp', name: 'Luzide Durchdringung', type: 'experience', description: 'Beherrschung des Traumreiches.', requirementsSummary: 'Traumprüfung' }
        ],
        suggestedCompetencies: ['Traumprojektion', 'Gedankenlesen', 'Geistermedium', 'Visionsdeutung'],
        possibleRanks: ['Träumer', 'Traumwandler', 'Seelenmedium']
      },
      {
        id: 'runenmeister',
        fieldId: 'magie_arkana',
        name: 'Runenmeister & Meister-Artefaktbauer',
        tier: 'spezialisierung',
        specializationOf: 'runenschmied_node',
        parentIds: ['runenschmied_node'],
        childIds: ['erzmagier'],
        description: 'Vollendete Schöpfung legendärer Runengegenstände und unzerstörbarer Schutzzauber.',
        prerequisites: [{ type: 'experience_years', label: '4 Jahre Runenpraxis', minValue: 4 }],
        careerRoutes: [
          { id: 'rm_exam', name: 'Schöpfung eines Meisterartefakts', type: 'exam', description: 'Nachweis einer vollendeten Meisterrune.', requirementsSummary: 'Meisterwerk' }
        ],
        suggestedCompetencies: ['Uralte Runen', 'Permanente Bindung', 'Mysterienmetallurgie'],
        possibleRanks: ['Runenmeister', 'Großmeister des Siegels']
      },
      {
        id: 'erzmagier',
        fieldId: 'magie_arkana',
        name: 'Erzmagier & Akademieleiter',
        tier: 'meister',
        parentIds: ['arkanist', 'elementarist', 'runenschmied_node'],
        childIds: [],
        description: 'Höchster Rang magischer Erkenntnis, Leitung arkaner Kollegien und Ratgeber von Herrschern.',
        prerequisites: [{ type: 'experience_years', label: '6 Jahre arkanes Wirken', minValue: 6 }],
        careerRoutes: [
          { id: 'erz_conclave', name: 'Wahl durch das Hohe Konklave', type: 'social_recognition', description: 'Ernennung zum Erzmagier.', requirementsSummary: 'Konklave-Wahl' }
        ],
        suggestedCompetencies: ['Großrituale', 'Raumverzerrung', 'Arkanes Staatsrecht', 'Manastromlenkung'],
        possibleRanks: ['Erzmagier', 'Großmagister', 'Primas der Arkana']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 7. RELIGION & KLERUS
  // ---------------------------------------------------------------------------
  religion_klerus: {
    fieldId: 'religion_klerus',
    fieldName: 'Religion & Klerus',
    description: 'Liturgie, Seelsorge, heilige Rituale, Schreinriten und religiöser Dienst',
    rootNodeId: 'religion_root',
    nodes: [
      {
        id: 'religion_root',
        fieldId: 'religion_klerus',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['kleriker', 'moench', 'schreindiener'],
        description: 'Einstieg in den Berufszweig „Religion & Klerus“',
        prerequisites: [],
        careerRoutes: [
          { id: 'rel_init', name: 'Tempelaufnahme & Gelübde', type: 'exam', description: 'Ablegen des ersten Gelübdes.', requirementsSummary: 'Gelübde' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      {
        id: 'kleriker',
        fieldId: 'religion_klerus',
        name: 'Kleriker & Priester',
        tier: 'beruf',
        parentIds: ['religion_root'],
        childIds: ['kriegspriester', 'exorzist_inquisitor', 'orakel_seher', 'hohepriester'],
        description: 'Geweihte Amtsträger für Messen, Segnungen, Beichten und seelsorgerische Führung.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Tempeldienst', minValue: 2 }],
        careerRoutes: [
          { id: 'priest_ord', name: 'Priesterweihe', type: 'exam', description: 'Feierliche Weihe durch Bischof oder Abt.', requirementsSummary: 'Weihe' }
        ],
        suggestedCompetencies: ['Segnung', 'Seelsorge', 'Glaubenslehre', 'Heilungsgebete'],
        possibleRanks: ['Diakon', 'Priester', 'Pfarrer']
      },
      {
        id: 'moench',
        fieldId: 'religion_klerus',
        name: 'Mönch & Asket',
        tier: 'beruf',
        parentIds: ['religion_root'],
        childIds: ['sohei', 'yamabushi', 'hohepriester'],
        description: 'Klösterliches Leben der Kontemplation, Handarbeit, Meditation und Kräuterkunde.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Klosterpraxis', minValue: 1 }],
        careerRoutes: [
          { id: 'monk_vow', name: 'Ewiges Klostergelübde', type: 'experience', description: 'Vollständige Bindung an den Orden.', requirementsSummary: 'Ewige Profess' }
        ],
        suggestedCompetencies: ['Meditation', 'Klostergarten & Kräuter', 'Abschreiben', 'Fastendisziplin'],
        possibleRanks: ['Ordensbruder', 'Pater', 'Klostervorsteher']
      },
      {
        id: 'schreindiener',
        fieldId: 'religion_klerus',
        name: 'Kannushi & Miko (Schreinpriester)',
        tier: 'beruf',
        parentIds: ['religion_root'],
        childIds: ['onmyoji', 'ajari', 'hohepriester'],
        description: 'Shintoistische Riten, Schreinpflege, Sakraltänze (Kagura) und Kamisegnung.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Schreinpraxis', minValue: 1 }],
        careerRoutes: [
          { id: 'shinto_rit', name: 'Schrein-Einsetzung', type: 'exam', description: 'Anerkennung durch das Schrein-Kollegium.', requirementsSummary: 'Reinigungsprüfung' }
        ],
        suggestedCompetencies: ['Harae-Riten', 'Kagura-Sakraltanz', 'Ofuda-Herstellung', 'Naturgeisterverehrung'],
        possibleRanks: ['Miko / Kannagi', 'Gon-Negi', 'Negi', 'Kannushi']
      },
      {
        id: 'kriegspriester',
        fieldId: 'religion_klerus',
        name: 'Kriegspriester & Kreuzritter',
        tier: 'spezialisierung',
        specializationOf: 'kleriker',
        parentIds: ['kleriker'],
        childIds: ['hohepriester'],
        description: 'Kampferprobter Klerus für Truppensegen, Feldschlachtbegleitung und wehrhaften Glaubensschutz.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Dienst', minValue: 2 }],
        careerRoutes: [
          { id: 'kp_exp', name: 'Feldzugbewährung', type: 'experience', description: 'Dienst als Divisionspriester.', requirementsSummary: 'Schlachterfahrung' }
        ],
        suggestedCompetencies: ['Streitkolbenkampf', 'Mutsegen', 'Krankenfeldlazarett', 'Schutzgebet'],
        possibleRanks: ['Feldprediger', 'Kriegspriester', 'Paladin-Kaplan']
      },
      {
        id: 'exorzist_inquisitor',
        fieldId: 'religion_klerus',
        name: 'Exorzist & Inquisitor',
        tier: 'spezialisierung',
        specializationOf: 'kleriker',
        parentIds: ['kleriker'],
        childIds: ['hohepriester'],
        description: 'Aufdeckung von Ketzerei, Vertreibung böser Wesenheiten und Durchsetzung des Glaubensrechts.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre kirchlicher Dienst', minValue: 3 }],
        careerRoutes: [
          { id: 'inq_patent', name: 'Inquisitionsvollmacht', type: 'exam', description: 'Bevollmächtigung durch den Hohen Rat.', requirementsSummary: 'Inquisitionsbrief' }
        ],
        suggestedCompetencies: ['Dämonenbannung', 'Verhörtechnik', 'Ketzereiaufspürung', 'Weihwasser & Riten'],
        possibleRanks: ['Exorzist', 'Inquisitor', 'Großinquisitor']
      },
      {
        id: 'orakel_seher',
        fieldId: 'religion_klerus',
        name: 'Orakel & Sakraler Seher',
        tier: 'spezialisierung',
        specializationOf: 'kleriker',
        parentIds: ['kleriker'],
        childIds: ['hohepriester'],
        description: 'Verkündigung göttlicher Weissagungen, Deutung heiliger Omen und spirituelle Vorsehung.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre sakrale Praxis', minValue: 2 }],
        careerRoutes: [
          { id: 'or_vision', name: 'Göttliche Epiphanie', type: 'experience', description: 'Empfang einer anerkannten Offenbarung.', requirementsSummary: 'Offenbarung' }
        ],
        suggestedCompetencies: ['Omendeutung', 'Prophezeiung', 'Trance & Vision', 'Sternenschau'],
        possibleRanks: ['Seher', 'Tempelorakel', 'Großes Orakel']
      },
      {
        id: 'sohei',
        fieldId: 'religion_klerus',
        name: 'Sohei (Kriegermönch)',
        tier: 'spezialisierung',
        specializationOf: 'moench',
        parentIds: ['moench'],
        childIds: ['hohepriester'],
        description: 'Mit Naginata und Glaube bewaffneter Schutzmönch zur Verteidigung heiliger Tempelberge.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Kampf- & Meditationspraxis', minValue: 2 }],
        careerRoutes: [
          { id: 'sohei_exp', name: 'Tempelverteidigung', type: 'experience', description: 'Kampfeinsatz für den Tempel.', requirementsSummary: 'Verteidigungserfahrung' }
        ],
        suggestedCompetencies: ['Naginata-Kampf', 'Disziplinierter Geist', 'Tempelschutz'],
        possibleRanks: ['Kriegermönch', 'Tempelwächter-Hauptmann']
      },
      {
        id: 'yamabushi',
        fieldId: 'religion_klerus',
        name: 'Yamabushi (Bergasket)',
        tier: 'spezialisierung',
        specializationOf: 'moench',
        parentIds: ['moench'],
        childIds: ['hohepriester'],
        description: 'Shugendo-Praktizierender mit übernatürlichen Kräften durch Askese unter Wasserfällen und Bergen.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Wildnisaskese', minValue: 2 }],
        careerRoutes: [
          { id: 'yama_asc', name: 'Besteigung des Heiligen Berges', type: 'experience', description: 'Prüfung in Eis und Kälte.', requirementsSummary: 'Bergweihe' }
        ],
        suggestedCompetencies: ['Bergüberleben', 'Muschelblasen (Horagai)', 'Geistervertreibung'],
        possibleRanks: ['Bergasket', 'Shugensha']
      },
      {
        id: 'onmyoji',
        fieldId: 'religion_klerus',
        name: 'Onmyōji (Kosmologe & Divinationsmeister)',
        tier: 'spezialisierung',
        specializationOf: 'schreindiener',
        parentIds: ['schreindiener'],
        childIds: ['hohepriester'],
        description: 'Yin-Yang-Meister für Kalenderwesen, Geisterbannung mit Shikigami und Schicksalslenkung.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre esoterische Studien', minValue: 3 }],
        careerRoutes: [
          { id: 'onmyo_exam', name: 'Kaiserliches Onmyō-Amt', type: 'exam', description: 'Prüfung am Hofe.', requirementsSummary: 'Hofpatent' }
        ],
        suggestedCompetencies: ['Shikigami-Führung', 'Yin-Yang-Astrologie', 'Fluchabwendung', 'Kalenderkunst'],
        possibleRanks: ['Onmyōji', 'Oberster Hofonmyōji']
      },
      {
        id: 'ajari',
        fieldId: 'religion_klerus',
        name: 'Ajari (Hoher Meister)',
        tier: 'spezialisierung',
        specializationOf: 'schreindiener',
        parentIds: ['schreindiener'],
        childIds: ['hohepriester'],
        description: 'Meister esoterischer Geheimrituale und Einweihungen nach langen Askeseprüfungen.',
        prerequisites: [{ type: 'experience_years', label: '4 Jahre Praxis', minValue: 4 }],
        careerRoutes: [
          { id: 'ajari_rite', name: 'Abhisheka-Einweihung', type: 'exam', description: 'Krönungsweihe des Meisters.', requirementsSummary: 'Meisterweihe' }
        ],
        suggestedCompetencies: ['Esoterische Rituale', 'Mudra & Mantra', 'Reinigungsfeuer (Goma)'],
        possibleRanks: ['Ajari', 'Dai-Ajari']
      },
      {
        id: 'hohepriester',
        fieldId: 'religion_klerus',
        name: 'Abt & Hohepriester',
        tier: 'meister',
        parentIds: ['kleriker', 'moench', 'schreindiener'],
        childIds: [],
        description: 'Höchste religiöse Würde und geistliche Führung einer Glaubensgemeinschaft oder Abtei.',
        prerequisites: [{ type: 'experience_years', label: '5 Jahre Priesteramt', minValue: 5 }],
        careerRoutes: [
          { id: 'hp_invest', name: 'Bischöfliche Investitur', type: 'social_recognition', description: 'Ernennung zum Abt oder Hohepriester.', requirementsSummary: 'Investitur' }
        ],
        suggestedCompetencies: ['Oberste Liturgie', 'Kirchenrecht', 'Diözesenverwaltung', 'Heiligsprechung'],
        possibleRanks: ['Abt', 'Bischof', 'Hohepriester', 'Kardinal']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 8. VERWALTUNG & RECHT
  // ---------------------------------------------------------------------------
  verwaltung_recht: {
    fieldId: 'verwaltung_recht',
    fieldName: 'Verwaltung & Recht',
    description: 'Schriftwesen, Steuern, Buchhaltung, Beurkundung, Justiz und Kanzleidienst',
    rootNodeId: 'verwaltung_root',
    nodes: [
      {
        id: 'verwaltung_root',
        fieldId: 'verwaltung_recht',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['schreiber_beruf', 'steuereintreiber_beruf'],
        description: 'Einstieg in den Berufszweig „Verwaltung & Recht“',
        prerequisites: [],
        careerRoutes: [
          { id: 'adm_entry', name: 'Amtsprüfung für Anwärter', type: 'exam', description: 'Eignungsprüfung im Schreiben und Rechnen.', requirementsSummary: 'Schreibprüfung' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      {
        id: 'schreiber_beruf',
        fieldId: 'verwaltung_recht',
        name: 'Schreiber & Buchhalter',
        tier: 'beruf',
        parentIds: ['verwaltung_root'],
        childIds: ['sekretaer_amt', 'notar_amt', 'verwalter_amt', 'ratsschreiber'],
        description: 'Erstellung offizieller Dokumente, Rechnungsführung, Kontoreinträge und Register.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Kanzleipraxis', minValue: 1 }],
        careerRoutes: [
          { id: 'schr_cert', name: 'Kanzleibrief', type: 'exam', description: 'Bestätigung als vollwertiger Kanzleischreiber.', requirementsSummary: 'Kanzleibrief' }
        ],
        suggestedCompetencies: ['Rechtsdeutsch / Kanzleistil', 'Buchhaltung', 'Urkundensiegel', 'Zensusprüfung'],
        possibleRanks: ['Amtsschreiber', 'Buchhalter', 'Kontorführer']
      },
      {
        id: 'steuereintreiber_beruf',
        fieldId: 'verwaltung_recht',
        name: 'Steuereintreiber & Zöllner',
        tier: 'beruf',
        parentIds: ['verwaltung_root'],
        childIds: ['verwalter_amt', 'ratsschreiber'],
        description: 'Erhebung von Zöllen, Akzisen, Wegezöllen und landesherrlichen Steuern.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxis', minValue: 1 }],
        careerRoutes: [
          { id: 'tax_appt', name: 'Zollpatent des Landesherrn', type: 'exam', description: 'Bestallung als Zollerheber.', requirementsSummary: 'Bestallung' }
        ],
        suggestedCompetencies: ['Zolltarifprüfung', 'Münzwaage', 'Steuerlisten', 'Durchsetzungskraft'],
        possibleRanks: ['Zöllner', 'Rentmeister', 'Steuersekretär']
      },
      {
        id: 'sekretaer_amt',
        fieldId: 'verwaltung_recht',
        name: 'Sekretär & Kanzlist',
        tier: 'spezialisierung',
        specializationOf: 'schreiber_beruf',
        parentIds: ['schreiber_beruf'],
        childIds: ['ratsschreiber'],
        description: 'Persönliche Korrespondenz, Terminkoordination und vertrauliche Akten für Herren und Räte.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Schreiberpraxis', minValue: 2 }],
        careerRoutes: [
          { id: 'sek_soc', name: 'Vertrauensbestallung', type: 'social_recognition', description: 'Ernennung zum Privatsekretär.', requirementsSummary: 'Vertrauensprüfung' }
        ],
        suggestedCompetencies: ['Chiffrierung', 'Vertraulichkeit', 'Protokollführung', 'Diplomatenkorrespondenz'],
        possibleRanks: ['Privatsekretär', 'Kanzlist', 'Amtsrat']
      },
      {
        id: 'notar_amt',
        fieldId: 'verwaltung_recht',
        name: 'Notar & Verhandlungsführer',
        tier: 'spezialisierung',
        specializationOf: 'schreiber_beruf',
        parentIds: ['schreiber_beruf'],
        childIds: ['ratsschreiber'],
        description: 'Beglaubigung von Verträgen, Testamenten, Erbschaften und zwischenparteiliche Einigungen.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre Rechtspraxis', minValue: 3 }],
        careerRoutes: [
          { id: 'not_exam', name: 'Staatliche Notarprüfung', type: 'exam', description: 'Reichsweite Anerkennung als Notar.', requirementsSummary: 'Rechtsexamen' }
        ],
        suggestedCompetencies: ['Vertragsrecht', 'Beglaubigung', 'Streitschlichtung', 'Erbrecht'],
        possibleRanks: ['Notar', 'Syndikus', 'Rechtsbeistand']
      },
      {
        id: 'verwalter_amt',
        fieldId: 'verwaltung_recht',
        name: 'Guts- & Liegenschaftsverwalter',
        tier: 'spezialisierung',
        specializationOf: 'schreiber_beruf',
        parentIds: ['schreiber_beruf', 'steuereintreiber_beruf'],
        childIds: ['ratsschreiber'],
        description: 'Wirtschaftliche und personelle Verwaltung von Domänen, Stadtgütern und Mietshäusern.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre Verwaltungspraxis', minValue: 3 }],
        careerRoutes: [
          { id: 'verw_soc', name: 'Herrschaftliche Bestallung', type: 'social_recognition', description: 'Einsetzung als Gutsverwalter.', requirementsSummary: 'Bestallung' }
        ],
        suggestedCompetencies: ['Pachtrecht', 'Liegenschaftskataster', 'Personalaufsicht', 'Lagerwirtschaft'],
        possibleRanks: ['Verwalter', 'Vogt', 'Kastellan']
      },
      {
        id: 'ratsschreiber',
        fieldId: 'verwaltung_recht',
        name: 'Kanzler & Oberster Ratsschreiber',
        tier: 'meister',
        parentIds: ['schreiber_beruf', 'steuereintreiber_beruf'],
        childIds: [],
        description: 'Leitung der Kanzlei, Reichssiegelbewahrung und rechtliche Beratung des Stadtrats oder Fürsten.',
        prerequisites: [{ type: 'experience_years', label: '5 Jahre höhere Kanzleiführung', minValue: 5 }],
        careerRoutes: [
          { id: 'kanz_elect', name: 'Wahl durch den Kronrat', type: 'social_recognition', description: 'Ernennung zum Kanzleidirektor oder Kanzler.', requirementsSummary: 'Ratsbeschluss' }
        ],
        suggestedCompetencies: ['Staatsrecht', 'Reichssiegel', 'Diplomatisches Protokoll', 'Verfassungslehre'],
        possibleRanks: ['Ratsschreiber', 'Kanzleidirektor', 'Kanzler']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 9. ABENTEUER & SONDERGEWERBE
  // ---------------------------------------------------------------------------
  abenteuer_sondergewerbe: {
    fieldId: 'abenteuer_sondergewerbe',
    fieldName: 'Abenteuer & Sondergewerbe',
    description: 'Infiltration, Kundschaft, Schmuggel, Kopfgeldjagd, Schattenoperationen und Ruinenerkundung',
    rootNodeId: 'abenteuer_root',
    nodes: [
      {
        id: 'abenteuer_root',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['dieb_beruf', 'schurke_beruf', 'kopfgeldjaeger_beruf'],
        description: 'Einstieg in den Berufszweig „Abenteuer & Sondergewerbe“',
        prerequisites: [],
        careerRoutes: [
          { id: 'ab_init', name: 'Gassenbewährung', type: 'experience', description: 'Erster geglückter Streifzug.', requirementsSummary: 'Straßenerfahrung' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      {
        id: 'dieb_beruf',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Dieb & Schurke (Rogue)',
        tier: 'beruf',
        parentIds: ['abenteuer_root'],
        childIds: ['phantomdieb', 'schmuggler', 'faelscher', 'schattenmeister'],
        description: 'Schlösserknacken, lautlose Infiltration, Beutesicherung und Ausweichen.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxis im Schatten', minValue: 1 }],
        careerRoutes: [
          { id: 'dieb_gilde', name: 'Gildenprüfung', type: 'exam', description: 'Beweis vor der Diebesgilde.', requirementsSummary: 'Meisterdiebstahl' }
        ],
        suggestedCompetencies: ['Schlösser knacken', 'Fassadenklettern', 'Fallen umgehen', 'Schleichen'],
        possibleRanks: ['Taschendieb', 'Fassadenkletterer', 'Einbrecher']
      },
      {
        id: 'schurke_beruf',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Schurke & Schwindler',
        tier: 'beruf',
        parentIds: ['abenteuer_root'],
        childIds: ['ninja_assassine', 'schattenmeister'],
        description: 'Falschspiel, Täuschung, Verkleidung und Ausnutzung fremder Arglosigkeit.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Unterweltpraxis', minValue: 1 }],
        careerRoutes: [
          { id: 'schurk_exp', name: 'Großer Coup', type: 'experience', description: 'Erfolgreicher Betrug an einem Reichen.', requirementsSummary: 'Coup-Erfahrung' }
        ],
        suggestedCompetencies: ['Falschspiel', 'Lügen & Schmeicheln', 'Verkleidung', 'Giftkunde'],
        possibleRanks: ['Schwindler', 'Falschspieler', 'Hehler']
      },
      {
        id: 'kopfgeldjaeger_beruf',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Kopfgeldjäger & Fährtenaufspürer',
        tier: 'beruf',
        parentIds: ['abenteuer_root'],
        childIds: ['untotenjaeger', 'schattenmeister'],
        description: 'Aufspüren von Flüchtigen, Gesuchten und Verbrechern für Stadtprämien.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Jagdpraxis', minValue: 1 }],
        careerRoutes: [
          { id: 'kopfg_bounty', name: 'Erfüllter Steckbrief', type: 'experience', description: 'Erfolgreiche Auslieferung eines Geächteten.', requirementsSummary: 'Auslieferung' }
        ],
        suggestedCompetencies: ['Personenjagd', 'Fesseln & Festnahme', 'Hinterhalt', 'Informantennetz'],
        possibleRanks: ['Kopfgeldjäger', 'Prämienjäger', 'Vollstrecker']
      },
      {
        id: 'phantomdieb',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Phantom-Dieb & Einbrecher',
        tier: 'spezialisierung',
        specializationOf: 'dieb_beruf',
        parentIds: ['dieb_beruf'],
        childIds: ['schattenmeister'],
        description: 'Legendärer Einbruch in bestgesicherte Schatzkammern und Paläste ohne Spur.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre Diebespraxis', minValue: 3 }],
        careerRoutes: [
          { id: 'pd_exp', name: 'Palasteinbruch', type: 'social_recognition', description: 'Raub eines königlichen Juwels.', requirementsSummary: 'Mythos-Tat' }
        ],
        suggestedCompetencies: ['Akrobatik', 'Uralte Schlösser', 'Tarnmantel', 'Fluchtwege'],
        possibleRanks: ['Meisterdieb', 'Phantom-Dieb']
      },
      {
        id: 'schmuggler',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Schmuggler & Schleuser',
        tier: 'spezialisierung',
        specializationOf: 'dieb_beruf',
        parentIds: ['dieb_beruf'],
        childIds: ['schattenmeister'],
        description: 'Transport verbotener Güter, Geheimgänge durch Stadtwälle und Schwarzmärkte.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }],
        careerRoutes: [
          { id: 'schm_route', name: 'Etablierung einer Geheimroute', type: 'experience', description: 'Feste Route an den Zöllnern vorbei.', requirementsSummary: 'Routenkenntnis' }
        ],
        suggestedCompetencies: ['Verstecke bauen', 'Geheimrouten', 'Schmiergeldverhandlung', 'Nachtfahrt'],
        possibleRanks: ['Schmuggler', 'Passagenmeister']
      },
      {
        id: 'faelscher',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Fälscher & Dokumentenkünstler',
        tier: 'spezialisierung',
        specializationOf: 'dieb_beruf',
        parentIds: ['dieb_beruf'],
        childIds: ['schattenmeister'],
        description: 'Täuschend echte Nachbildung von Siegeln, Pässen, Münzen und königlichen Urkunden.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }],
        careerRoutes: [
          { id: 'fael_exam', name: 'Ununterscheidbare Signatur', type: 'exam', description: 'Fälschung übersteht königliche Prüfung.', requirementsSummary: 'Siegelprüfung' }
        ],
        suggestedCompetencies: ['Siegelschnitt', 'Tintenmischung', 'Münzprägung', 'Schriftnachahmung'],
        possibleRanks: ['Passfälscher', 'Meisterfälscher']
      },
      {
        id: 'ninja_assassine',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Ninja & Auftragskiller',
        tier: 'spezialisierung',
        specializationOf: 'schurke_beruf',
        parentIds: ['schurke_beruf'],
        childIds: ['schattenmeister'],
        description: 'Lautlose Beseitigung von Zielpersonen, Rauchpulver, Klettern und Schattenwaffen.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre Schattenpraxis', minValue: 3 }],
        careerRoutes: [
          { id: 'ass_contract', name: 'Erfüllung eines Hochadelskontrakts', type: 'experience', description: 'Abschluss einer heiklen Mission.', requirementsSummary: 'Schattenkontrakt' }
        ],
        suggestedCompetencies: ['Lautloser Stich', 'Wurfwaffen (Shuriken)', 'Rauchbomben', 'Giftapplikation'],
        possibleRanks: ['Assassine', 'Ninja / Shinobi', 'Schattenklinge']
      },
      {
        id: 'untotenjaeger',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Untotenjäger & Monstertracker',
        tier: 'spezialisierung',
        specializationOf: 'kopfgeldjaeger_beruf',
        parentIds: ['kopfgeldjaeger_beruf'],
        childIds: ['schattenmeister'],
        description: 'Jagd auf Ghule, Vampire, Wiedergänger und Dämonenwesen mit Silber und Weihrauch.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre Monsterjagd', minValue: 3 }],
        careerRoutes: [
          { id: 'uj_bounty', name: 'Bannung einer Gruft', type: 'experience', description: 'Säuberung einer alten Grabkammer.', requirementsSummary: 'Gruftbefreiung' }
        ],
        suggestedCompetencies: ['Silberklingen', 'Vampir- & Ghulkunde', 'Weihrauchfallen', 'Zähigkeit'],
        possibleRanks: ['Untotenjäger', 'Gruftwächter', 'Monsterjäger-Meister']
      },
      {
        id: 'schattenmeister',
        fieldId: 'abenteuer_sondergewerbe',
        name: 'Gildenmeister der Schatten',
        tier: 'meister',
        parentIds: ['dieb_beruf', 'schurke_beruf', 'kopfgeldjaeger_beruf'],
        childIds: [],
        description: 'Führung des Unterwelt-Syndikats, Kontrolle aller Hehlerrouten und Schattenpolitik.',
        prerequisites: [{ type: 'experience_years', label: '6 Jahre Unterweltführung', minValue: 6 }],
        careerRoutes: [
          { id: 'schatt_rat', name: 'Anerkennung durch das Schatten-Konklave', type: 'social_recognition', description: 'Wahl zum Gildenmeister.', requirementsSummary: 'Unterwelt-Votum' }
        ],
        suggestedCompetencies: ['Syndikatsführung', 'Schwarze Kassen', 'Spionagenetzwerke', 'Mordverträge'],
        possibleRanks: ['Gildenmeister', 'Schattenfürst', 'Unterwelt-Syndikus']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 10. WISSENSCHAFT & FORSCHUNG
  // ---------------------------------------------------------------------------
  wissenschaft_forschung: {
    fieldId: 'wissenschaft_forschung',
    fieldName: 'Wissenschaft & Forschung',
    description: 'Kartographie, Astronomie, Archäologie, Historie, Kryptographie und Naturforschung',
    rootNodeId: 'wissenschaft_root',
    nodes: [
      {
        id: 'wissenschaft_root',
        fieldId: 'wissenschaft_forschung',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['forscher_gelehrter', 'kartograph_beruf'],
        description: 'Einstieg in den Berufszweig „Wissenschaft & Forschung“',
        prerequisites: [],
        careerRoutes: [
          { id: 'acad_matric', name: 'Immatrikulation & Grundstudium', type: 'exam', description: 'Aufnahme in die Fakultät.', requirementsSummary: 'Immatrikulation' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      {
        id: 'forscher_gelehrter',
        fieldId: 'wissenschaft_forschung',
        name: 'Forscher & Gelehrter',
        tier: 'beruf',
        parentIds: ['wissenschaft_root'],
        childIds: ['archaeologe', 'kryptograph', 'astronom_astrologe', 'akademievorsteher'],
        description: 'Eigenständige wissenschaftliche Untersuchungen, Publikationen und Disputationen.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Forschungspraxis', minValue: 2 }],
        careerRoutes: [
          { id: 'mag_disp', name: 'Magister-Disputation', type: 'exam', description: 'Verteidigung der wissenschaftlichen Schrift.', requirementsSummary: 'Magistergrad' }
        ],
        suggestedCompetencies: ['Theorienbildung', 'Empirie & Experiment', 'Wissenschaftliche Dokumentation'],
        possibleRanks: ['Baccalaureus', 'Magister Artium', 'Dozent']
      },
      {
        id: 'kartograph_beruf',
        fieldId: 'wissenschaft_forschung',
        name: 'Kartograph & Landvermesser',
        tier: 'beruf',
        parentIds: ['wissenschaft_root'],
        childIds: ['archaeologe', 'akademievorsteher'],
        description: 'Triangulation, Geländevermessung, Erstellung präziser Land- und Seekarten.',
        prerequisites: [{ type: 'experience_years', label: '2 Jahre Vermessungspraxis', minValue: 2 }],
        careerRoutes: [
          { id: 'kart_exam', name: 'Prüfung der Geographengilde', type: 'exam', description: 'Vorlage eines vollständigen Gebietsatlas.', requirementsSummary: 'Atlas-Prüfung' }
        ],
        suggestedCompetencies: ['Triangulation', 'Kartenzeichnung', 'Kompass & Astrolabium', 'Höhenmessung'],
        possibleRanks: ['Landvermesser', 'Kartograph', 'Kartenzeichner']
      },
      {
        id: 'archaeologe',
        fieldId: 'wissenschaft_forschung',
        name: 'Archäologe & Antikenforscher',
        tier: 'spezialisierung',
        specializationOf: 'forscher_gelehrter',
        parentIds: ['forscher_gelehrter', 'kartograph_beruf'],
        childIds: ['akademievorsteher'],
        description: 'Ausgrabungen in alten Tempeln und Gruften, Altersbestimmung von Relikten.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre Feldpraxis', minValue: 3 }],
        careerRoutes: [
          { id: 'arch_exp', name: 'Expeditionsleitung', type: 'experience', description: 'Freilegung einer versunkenen Ausgrabungsstätte.', requirementsSummary: 'Ausgrabungsfund' }
        ],
        suggestedCompetencies: ['Schonende Ausgrabung', 'Reliktenklassifikation', 'Architekturhistorie'],
        possibleRanks: ['Feldarchäologe', 'Kurator antiker Funde']
      },
      {
        id: 'kryptograph',
        fieldId: 'wissenschaft_forschung',
        name: 'Kryptograph & Sprachforscher',
        tier: 'spezialisierung',
        specializationOf: 'forscher_gelehrter',
        parentIds: ['forscher_gelehrter'],
        childIds: ['akademievorsteher'],
        description: 'Entschlüsselung geheimer Codes, altertümlicher Schriften und diplomatischer Chiffren.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre Studienpraxis', minValue: 3 }],
        careerRoutes: [
          { id: 'krypt_exam', name: 'Lösung des Großen Chiffrier-Rätsels', type: 'exam', description: 'Dekodierung einer ungelösten Schrift.', requirementsSummary: 'Chiffrenprüfung' }
        ],
        suggestedCompetencies: ['Codeknacken', 'Sprachanalyse', 'Chiffrenerstellung', 'Alte Glyphen'],
        possibleRanks: ['Chiffrierer', 'Oberkryptograph']
      },
      {
        id: 'astronom_astrologe',
        fieldId: 'wissenschaft_forschung',
        name: 'Astronom & Hofastrologe',
        tier: 'spezialisierung',
        specializationOf: 'forscher_gelehrter',
        parentIds: ['forscher_gelehrter'],
        childIds: ['akademievorsteher'],
        description: 'Himmelsbeobachtung, Planetenbahnen, Sonnenfinsternisse und astrologische Deutung am Hof.',
        prerequisites: [{ type: 'experience_years', label: '3 Jahre Beobachtungspraxis', minValue: 3 }],
        careerRoutes: [
          { id: 'ast_soc', name: 'Hofastronomen-Bestallung', type: 'social_recognition', description: 'Ernennung zum Berater des Königs.', requirementsSummary: 'Hofpatent' }
        ],
        suggestedCompetencies: ['Teleskopbedienung', 'Sternenkarten', 'Konstellationsdeutung', 'Ephemeridenrechnung'],
        possibleRanks: ['Astronom', 'Hofastrologe']
      },
      {
        id: 'akademievorsteher',
        fieldId: 'wissenschaft_forschung',
        name: 'Akademie-Vorsteher & Chefbibliothekar',
        tier: 'meister',
        parentIds: ['forscher_gelehrter', 'kartograph_beruf'],
        childIds: [],
        description: 'Rektor der Hohen Akademie, Hüter des gesamten Wissens und Großgelehrter des Reiches.',
        prerequisites: [{ type: 'experience_years', label: '6 Jahre Forschungsführung', minValue: 6 }],
        careerRoutes: [
          { id: 'ak_elect', name: 'Rektoratswahl der Fakultäten', type: 'social_recognition', description: 'Wahl zum Vorsteher der Hohen Universität.', requirementsSummary: 'Rektoratswahl' }
        ],
        suggestedCompetencies: ['Universitätsleitung', 'Forschungsförderung', 'Große Disputationen', 'Enzyklopädie'],
        possibleRanks: ['Professor Ordinarius', 'Rektor', 'Akademie-Vorsteher']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 11. LUXUS & SPEZIAL
  // ---------------------------------------------------------------------------
  luxus_spezial: {
    fieldId: 'luxus_spezial',
    fieldName: 'Luxus & Spezial',
    description: 'Veredelung, Genussmittel, Braukunst, Juwelierwesen und Blumenkunst',
    rootNodeId: 'luxus_spezial_root',
    nodes: [
      {
        id: 'luxus_spezial_root',
        fieldId: 'luxus_spezial',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['luxus_spezial.juwelier', 'luxus_spezial.parfuemeur_beruf', 'luxus_spezial.uhrmacher', 'luxus_spezial.florist'],
        description: 'Einstieg in den Berufszweig „Luxus & Spezial“',
        prerequisites: [],
        careerRoutes: [
          { id: 'ls_start', name: 'Grundausbildung & Werkstattpraxis', type: 'experience', description: 'Erste Schritte in Werkstätten und Manufakturen.', requirementsSummary: 'Offener Einstieg' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      // 1. Juwelier
      {
        id: 'luxus_spezial.juwelier',
        fieldId: 'luxus_spezial',
        name: 'Juwelier',
        tier: 'beruf',
        parentIds: ['luxus_spezial_root'],
        childIds: ['luxus_spezial.edelsteinschmied'],
        description: 'Bearbeitung und Fassung edler Metalle, Gemmen und feiner Geschmeide.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'j_exam', name: 'Juwelierprüfung', type: 'exam', description: 'Gesellenprüfung der Zunft.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Edelsteinkunde', 'Feinlöten', 'Schmuckfassungen', 'Polieren'],
        possibleRanks: ['Juweliergeselle', 'Goldschmied', 'Juweliermeister']
      },
      {
        id: 'luxus_spezial.edelsteinschmied',
        fieldId: 'luxus_spezial',
        name: 'Edelsteinschmied',
        tier: 'spezialisierung',
        specializationOf: 'luxus_spezial.juwelier',
        parentIds: ['luxus_spezial.juwelier'],
        childIds: ['luxus_spezial.hofjuwelier'],
        description: 'Fassen und Schleifen seltenster Kristalle, Diamanten und Runensteine.',
        prerequisites: [
          { type: 'profession', label: 'Juwelier', targetId: 'luxus_spezial.juwelier' },
          { type: 'experience_years', label: '2 Jahre Juwelierpraxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'es_exp', name: 'Edelstein-Schlifflehre', type: 'experience', description: 'Spezialisierung auf Diamanten und Gemmen.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Facettenschliff', 'Krappenfassung', 'Gemmologie'],
        possibleRanks: ['Edelsteinschleifer', 'Gemmologe']
      },
      // 2. Parfümeur & Essenzenbrenner
      {
        id: 'luxus_spezial.parfuemeur_beruf',
        fieldId: 'luxus_spezial',
        name: 'Parfümeur & Duftmischer',
        tier: 'beruf',
        parentIds: ['luxus_spezial_root'],
        childIds: ['luxus_spezial.hofparfuemeur'],
        description: 'Kreation kostbarer Wohlgerüche, Duftwässer, Salben und aromatischer Essenzen.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'pf_exam', name: 'Duftgilden-Zulassung', type: 'exam', description: 'Prüfung der Duftnoten und Destillation.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Duftnotenharmonie', 'Destillation edler Blüten', 'Fixierung & Mazeration'],
        possibleRanks: ['Duftmischer', 'Parfümeur', 'Essenzenmeister']
      },
      {
        id: 'luxus_spezial.hofparfuemeur',
        fieldId: 'luxus_spezial',
        name: 'Hofparfümeur & Alchemistischer Duftmeister',
        tier: 'spezialisierung',
        specializationOf: 'luxus_spezial.parfuemeur_beruf',
        parentIds: ['luxus_spezial.parfuemeur_beruf'],
        childIds: [],
        description: 'Exklusive Duftkreationen für Königshäuser, sakrale Weihrauchmischungen und Elixiere.',
        prerequisites: [
          { type: 'profession', label: 'Parfümeur & Duftmischer', targetId: 'luxus_spezial.parfuemeur_beruf' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'hp_rec', name: 'Hoflieferantenpatent', type: 'social_recognition', description: 'Bestallung zum königlichen Hofparfümeur.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Signaturdüfte kreieren', 'Seltene Amber- & Moschusverarbeitung', 'Salbenveredelung'],
        possibleRanks: ['Hofparfümeur', 'Meister der Wohlgerüche']
      },

      // 3. Uhrmacher & Feinmechaniker
      {
        id: 'luxus_spezial.uhrmacher',
        fieldId: 'luxus_spezial',
        name: 'Uhrmacher & Feinmechaniker',
        tier: 'beruf',
        parentIds: ['luxus_spezial_root'],
        childIds: ['luxus_spezial.chronometermeister'],
        description: 'Präzise Fertigung mechanischer Räderuhren, Astrolabien und kunstvoller Spielwerke.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'uhr_exam', name: 'Uhrmachermeisterstück', type: 'exam', description: 'Konstruktion eines funktionierenden Hemmungswerks.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Zahnradverzahnung', 'Hemmungsmechanik', 'Federstahljustierung', 'Präzisionsfeilen'],
        possibleRanks: ['Uhrmachergeselle', 'Feinmechanicus', 'Uhrmachermeister']
      },
      {
        id: 'luxus_spezial.chronometermeister',
        fieldId: 'luxus_spezial',
        name: 'Chronometermeister & Astronomischer Mechanicus',
        tier: 'spezialisierung',
        specializationOf: 'luxus_spezial.uhrmacher',
        parentIds: ['luxus_spezial.uhrmacher'],
        childIds: [],
        description: 'Astronomische Kunstuhren, Glockenspiele, Planetarien und Marine-Chronometer.',
        prerequisites: [
          { type: 'profession', label: 'Uhrmacher & Feinmechaniker', targetId: 'luxus_spezial.uhrmacher' },
          { type: 'experience_years', label: '2 Jahre Uhrmacherpraxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'cm_exam', name: 'Chronometerprüfung', type: 'exam', description: 'Eichung an Sternzeit und Sonnenhöchststand.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Astronomische Räderwerke', 'Temperaturkompensation', 'Automatenbau'],
        possibleRanks: ['Chronometermeister', 'Großmechanicus']
      },
      // 4. Florist
      {
        id: 'luxus_spezial.florist',
        fieldId: 'luxus_spezial',
        name: 'Florist',
        tier: 'beruf',
        parentIds: ['luxus_spezial_root'],
        childIds: ['luxus_spezial.floristmeister', 'luxus_spezial.bluetenarrangeur'],
        description: 'Gestaltung kunstvoller Blumenarrangements, Kränze und Zierpflanzungen.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'fl_exam', name: 'Floristenprüfung', type: 'exam', description: 'Prüfung in Blumengestaltung und Frischekonservierung.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Blütenkunde', 'Gesteckgestaltung', 'Frischekonservierung'],
        possibleRanks: ['Floristgeselle', 'Floristmeister']
      },
      {
        id: 'luxus_spezial.floristmeister',
        fieldId: 'luxus_spezial',
        name: 'Floristmeister',
        tier: 'spezialisierung',
        specializationOf: 'luxus_spezial.florist',
        parentIds: ['luxus_spezial.florist'],
        childIds: [],
        description: 'Meisterliche Raum- und Festfloristik für Paläste und Kathedralen.',
        prerequisites: [
          { type: 'profession', label: 'Florist', targetId: 'luxus_spezial.florist' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'fm_exam', name: 'Floristmeisterbrief', type: 'exam', description: 'Meisterprüfung im Blumenhandwerk.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Großinstallationen', 'Kryptogamen & Exoten', 'Konservierungskunst'],
        possibleRanks: ['Floristmeister', 'Ziergartengroßmeister']
      },
      {
        id: 'luxus_spezial.bluetenarrangeur',
        fieldId: 'luxus_spezial',
        name: 'Blütenarrangeur',
        tier: 'spezialisierung',
        specializationOf: 'luxus_spezial.florist',
        parentIds: ['luxus_spezial.florist'],
        childIds: [],
        description: 'Farb- und Duftkompositionen aus seltenen Zier- und Heilpflanzen.',
        prerequisites: [
          { type: 'profession', label: 'Florist', targetId: 'luxus_spezial.florist' },
          { type: 'experience_years', label: '1 Jahr Floristenpraxis', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'ba_exp', name: 'Arrangementpraxis', type: 'experience', description: 'Kunstfertigkeit in Harmonielehre.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Ikebana & Formenlehre', 'Farbharmonie', 'Kräuterarrangements'],
        possibleRanks: ['Arrangeur', 'Gartenkünstler']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 12. METALL & WAFFEN
  // ---------------------------------------------------------------------------
  metall_waffen: {
    fieldId: 'metall_waffen',
    fieldName: 'Metall & Waffen',
    description: 'Schmiedekunst, Rüstungsbau, Waffenfertigung, Feinmechanik und Instrumentenbau',
    rootNodeId: 'metall_waffen_root',
    nodes: [
      {
        id: 'metall_waffen_root',
        fieldId: 'metall_waffen',
        name: 'Lehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['metall_waffen.schmied', 'metall_waffen.mechaniker', 'metall_waffen.instrumentenbauer'],
        description: 'Einstieg in den Berufszweig „Metall & Waffen“',
        prerequisites: [],
        careerRoutes: [
          { id: 'mw_start', name: 'Grundausbildung & Werkstattpraxis', type: 'experience', description: 'Erste Schritte am Amboss und an der Werkbank.', requirementsSummary: 'Offener Einstieg' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Auszubildender']
      },
      {
        id: 'metall_waffen.schmied',
        fieldId: 'metall_waffen',
        name: 'Schmied',
        tier: 'beruf',
        parentIds: ['metall_waffen_root'],
        childIds: ['metall_waffen.waffenschmied', 'metall_waffen.ruestungsschmied'],
        description: 'Umformen von Eisen, Bronze und Stahl am glühenden Amboss.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'mw_s_exam', name: 'Schmiedegesellenprüfung', type: 'exam', description: 'Gesellenprüfung der Schmiedezunft.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Schmiedefeuer regulieren', 'Ambossführung', 'Härten & Anlassen'],
        possibleRanks: ['Schmiedegeselle', 'Grobschmied', 'Schmiedemeister']
      },
      {
        id: 'metall_waffen.waffenschmied',
        fieldId: 'metall_waffen',
        name: 'Waffenschmied',
        tier: 'spezialisierung',
        specializationOf: 'metall_waffen.schmied',
        parentIds: ['metall_waffen.schmied'],
        childIds: ['metall_waffen.schwertschmied'],
        description: 'Fertigung von Klingenwaffen, Lanzen, Äxten und Streitkolben.',
        prerequisites: [
          { type: 'profession', label: 'Schmied', targetId: 'metall_waffen.schmied' },
          { type: 'experience_years', label: '2 Jahre Schmiedeerfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'mw_ws_exp', name: 'Klingenschmiedelehre', type: 'experience', description: 'Spezialisierung auf Klingenstahl.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Klingen härten', 'Schwerter auswiegen', 'Waffenschärfen'],
        possibleRanks: ['Klingenschmied', 'Waffenmeister']
      },
      {
        id: 'metall_waffen.schwertschmied',
        fieldId: 'metall_waffen',
        name: 'Schwertschmied',
        tier: 'meister',
        specializationOf: 'metall_waffen.waffenschmied',
        parentIds: ['metall_waffen.waffenschmied'],
        childIds: [],
        description: 'Meisterhafte Schwerter, Damaszenerklingen und vollendete Balancierung.',
        prerequisites: [
          { type: 'profession', label: 'Waffenschmied', targetId: 'metall_waffen.waffenschmied' },
          { type: 'experience_years', label: '3 Jahre Waffenpraxis', minValue: 3 }
        ],
        careerRoutes: [
          { id: 'mw_ss_master', name: 'Meisterschwert-Prüfung', type: 'exam', description: 'Schmieden einer fehlerfreien Meisterklinge.', requirementsSummary: 'Zunftprüfung' }
        ],
        suggestedCompetencies: ['Damaszenerstahl falten', 'Klingenbalancierung', 'Meisterschlag'],
        possibleRanks: ['Schwertmeister', 'Klingengroßmeister']
      },
      {
        id: 'metall_waffen.ruestungsschmied',
        fieldId: 'metall_waffen',
        name: 'Rüstungsschmied',
        tier: 'spezialisierung',
        specializationOf: 'metall_waffen.schmied',
        parentIds: ['metall_waffen.schmied'],
        childIds: [],
        description: 'Treiben maßgeschneiderter Plattenharnische, Helme, Schilde und Schutzpanzer.',
        prerequisites: [
          { type: 'profession', label: 'Schmied', targetId: 'metall_waffen.schmied' },
          { type: 'experience_years', label: '2 Jahre Schmiedeerfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'mw_rs_exp', name: 'Plattnerkunst', type: 'experience', description: 'Treiben von Blechen auf Bossierklötzen.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Plattenrüstung treiben', 'Harnischpassung', 'Visierbau'],
        possibleRanks: ['Plattner', 'Harnischmeister']
      },
      {
        id: 'metall_waffen.mechaniker',
        fieldId: 'metall_waffen',
        name: 'Mechaniker',
        tier: 'beruf',
        parentIds: ['metall_waffen_root'],
        childIds: [],
        description: 'Konstruktion und Wartung von Zahnrädern, Winden, Uhren und Feinmechanik.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'mw_m_exam', name: 'Mechanikerprüfung', type: 'exam', description: 'Prüfung in Getriebebau und Hebelgesetzen.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Zahnradgetriebe', 'Federspannung', 'Präzisionsmontage'],
        possibleRanks: ['Mechanikergeselle', 'Uhrmacher', 'Mechanicus']
      },
      {
        id: 'metall_waffen.instrumentenbauer',
        fieldId: 'metall_waffen',
        name: 'Instrumentenbauer',
        tier: 'beruf',
        parentIds: ['metall_waffen_root'],
        childIds: [],
        description: 'Bau und Stimmung von Saiten-, Blas- und Schlaginstrumenten.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'mw_i_exam', name: 'Instrumentenbauerprüfung', type: 'exam', description: 'Bau eines vollwertigen Klangkörpers.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Akustik & Resonanz', 'Feinstimmung', 'Metallbiegen'],
        possibleRanks: ['Geigenbauer', 'Lautenbauer', 'Klangmeister']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 13. MATERIALVERARBEITUNG
  // ---------------------------------------------------------------------------
  materialverarbeitung: {
    fieldId: 'materialverarbeitung',
    fieldName: 'Materialverarbeitung',
    description: 'Gerberei, Kürschnerei, Textilhandwerk, Glasbläserei, Töpferei und Seilerkunst',
    rootNodeId: 'materialverarbeitung_root',
    nodes: [
      {
        id: 'materialverarbeitung_root',
        fieldId: 'materialverarbeitung',
        name: 'Werkstofflehrling',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['materialverarbeitung.gerber', 'materialverarbeitung.schneider', 'materialverarbeitung.glasmacher', 'materialverarbeitung.toepfer'],
        description: 'Einstieg in den Berufszweig „Materialverarbeitung“',
        prerequisites: [],
        careerRoutes: [
          { id: 'mat_start', name: 'Grundausbildung & Materialkunde', type: 'experience', description: 'Erste Handgriffe in Gerbereien, Webereien und Hütten.', requirementsSummary: 'Offener Einstieg' }
        ],
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge sicher benutzen', 'Materialkunde', 'Handgeschick', 'Lernfähigkeit', 'Sorgfalt'],
        possibleRanks: ['Lehrling', 'Handlanger']
      },
      // 1. Gerber & Lederer
      {
        id: 'materialverarbeitung.gerber',
        fieldId: 'materialverarbeitung',
        name: 'Gerber & Lederer',
        tier: 'beruf',
        parentIds: ['materialverarbeitung_root'],
        childIds: ['materialverarbeitung.kuerschner', 'materialverarbeitung.feingerber'],
        description: 'Enthaaren, Beizen und Gerben von Häuten zu robustem Leder für Rüstungen und Stiefel.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [
          { id: 'gerb_exam', name: 'Gerberprüfung', type: 'exam', description: 'Meisterstück in Loh- oder Weißgerbung.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Lohgerbung', 'Hautentfleischung', 'Beizverfahren', 'Lederfettung'],
        possibleRanks: ['Gerbergeselle', 'Lohgerber', 'Gerbermeister']
      },
      {
        id: 'materialverarbeitung.kuerschner',
        fieldId: 'materialverarbeitung',
        name: 'Kürschner & Pelzveredler',
        tier: 'spezialisierung',
        specializationOf: 'materialverarbeitung.gerber',
        parentIds: ['materialverarbeitung.gerber'],
        childIds: [],
        description: 'Verarbeitung edler Pelze, Felle und wärmender Wintergewänder für Adel und Bürger.',
        prerequisites: [
          { type: 'profession', label: 'Gerber & Lederer', targetId: 'materialverarbeitung.gerber' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'kuer_exp', name: 'Pelzzunft-Anerkennung', type: 'experience', description: 'Spezialisierung auf Hermelin, Zobel und Pelzfütterung.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Pelzzuschnitt', 'Fellkonservierung', 'Muff- & Kragenanfertigung'],
        possibleRanks: ['Kürschner', 'Pelzmeister']
      },
      {
        id: 'materialverarbeitung.feingerber',
        fieldId: 'materialverarbeitung',
        name: 'Feingerber & Sämischgerber',
        tier: 'spezialisierung',
        specializationOf: 'materialverarbeitung.gerber',
        parentIds: ['materialverarbeitung.gerber'],
        childIds: [],
        description: 'Veredelung feinsten Ziegen- und Lammleders für Handschuhe, Bucheinbände und Pergament.',
        prerequisites: [
          { type: 'profession', label: 'Gerber & Lederer', targetId: 'materialverarbeitung.gerber' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'fein_exam', name: 'Feingerberbrief', type: 'exam', description: 'Prüfung in Tran- und Alaungerbung.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Sämischgerbung', 'Pergamentherstellung', 'Lederfärbung'],
        possibleRanks: ['Feingerber', 'Pergamenter']
      },
      // 2. Schneider & Gewandmacher
      {
        id: 'materialverarbeitung.schneider',
        fieldId: 'materialverarbeitung',
        name: 'Schneider & Gewandmacher',
        tier: 'beruf',
        parentIds: ['materialverarbeitung_root'],
        childIds: ['materialverarbeitung.harnischschneider', 'materialverarbeitung.gewandmeister'],
        description: 'Zuschnitt, Nähen und Veredeln von Stoffen, Wolle, Leinen und Seide zu Kleidungsstücken.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [
          { id: 'schn_exam', name: 'Schneidergesellenprüfung', type: 'exam', description: 'Anfertigung eines passgenauen Maßgewands.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Schnittmuster erstellen', 'Nadel- & Nahttechniken', 'Stoffkunde', 'Maßnehmen'],
        possibleRanks: ['Schneidergeselle', 'Gewandschneider', 'Schneidermeister']
      },
      {
        id: 'materialverarbeitung.harnischschneider',
        fieldId: 'materialverarbeitung',
        name: 'Harnisch- & Gambesonmacher',
        tier: 'spezialisierung',
        specializationOf: 'materialverarbeitung.schneider',
        parentIds: ['materialverarbeitung.schneider'],
        childIds: [],
        description: 'Steppen mehrlagiger Schutzgewänder (Gambesons), Waffenröcke und Lederwämser.',
        prerequisites: [
          { type: 'profession', label: 'Schneider & Gewandmacher', targetId: 'materialverarbeitung.schneider' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'harn_exp', name: 'Rüstungszunft-Erfahrung', type: 'experience', description: 'Zusammenarbeit mit Rüstungsschmieden.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Stepppanzerung', 'Waffenrockherstellung', 'Verstärkte Nahttechnik'],
        possibleRanks: ['Rüstungsschneider', 'Gambesonmacher']
      },
      {
        id: 'materialverarbeitung.gewandmeister',
        fieldId: 'materialverarbeitung',
        name: 'Gewandmeister & Hofschneider',
        tier: 'meister',
        parentIds: ['materialverarbeitung.schneider'],
        childIds: [],
        description: 'Prachtvolle Staatsgewänder, Krönungsmäntel und Seidenroben mit Goldstickerei.',
        prerequisites: [{ type: 'experience_years', label: '4 Jahre Schneiderpraxis', minValue: 4 }],
        careerRoutes: [
          { id: 'hof_rec', name: 'Hofschneider-Bestallung', type: 'social_recognition', description: 'Ernennung durch den fürstlichen Hof.', requirementsSummary: '4 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Gold- & Silberstickerei', 'Brokat-Verarbeitung', 'Hofzeremoniell-Mode'],
        possibleRanks: ['Gewandmeister', 'Hofschneider']
      },
      // 3. Glasmacher & Glasbläser
      {
        id: 'materialverarbeitung.glasmacher',
        fieldId: 'materialverarbeitung',
        name: 'Glasmacher & Glasbläser',
        tier: 'beruf',
        parentIds: ['materialverarbeitung_root'],
        childIds: ['materialverarbeitung.buntglasmacher'],
        description: 'Schmelzen von Quarzsand zu Hohlglas, Flaschen, Trinkbechern und Alchemiekolben.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [
          { id: 'glas_exam', name: 'Glasbläserprüfung', type: 'exam', description: 'Formen dünnwandiger Glashohlkörper an der Pfeife.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Glasbläserpfeife führen', 'Schmelzofenführung', 'Glasformung', 'Kühlofenkühlung'],
        possibleRanks: ['Glasmachergeselle', 'Hüttenmeister']
      },
      {
        id: 'materialverarbeitung.buntglasmacher',
        fieldId: 'materialverarbeitung',
        name: 'Buntglasmacher & Kathedralenglaser',
        tier: 'spezialisierung',
        specializationOf: 'materialverarbeitung.glasmacher',
        parentIds: ['materialverarbeitung.glasmacher'],
        childIds: [],
        description: 'Färben von Glas mit Metalloxiden und Verbleiung kunstvoller Sakralfenster.',
        prerequisites: [
          { type: 'profession', label: 'Glasmacher & Glasbläser', targetId: 'materialverarbeitung.glasmacher' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'bunt_exp', name: 'Kathedralfenster-Meisterwerk', type: 'experience', description: 'Schaffung eines mehrfarbigen Bleiglasfensters.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Bleirutenfassung', 'Glasmalerei & Schwarzlot', 'Metalloxid-Färbung'],
        possibleRanks: ['Buntglaser', 'Kathedralenglasmeister']
      },
      // 4. Töpfer & Keramiker
      {
        id: 'materialverarbeitung.toepfer',
        fieldId: 'materialverarbeitung',
        name: 'Töpfer & Keramiker',
        tier: 'beruf',
        parentIds: ['materialverarbeitung_root'],
        childIds: ['materialverarbeitung.ofensetzer'],
        description: 'Formen von Ton auf der Drehscheibe zu Krügen, Vorratsgefäßen, Ziegeln und Schüsseln.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [
          { id: 'toepf_exam', name: 'Töpfergesellenprüfung', type: 'exam', description: 'Drehen und brennen gleichförmiger Krüge und Amphoren.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Tondrehscheibe führen', 'Glasurauftrag', 'Holzbrennofen steuern'],
        possibleRanks: ['Töpfergeselle', 'Hafner', 'Töpfermeister']
      },
      {
        id: 'materialverarbeitung.ofensetzer',
        fieldId: 'materialverarbeitung',
        name: 'Kachelofenbauer & Brennofensetzer',
        tier: 'spezialisierung',
        specializationOf: 'materialverarbeitung.toepfer',
        parentIds: ['materialverarbeitung.toepfer'],
        childIds: [],
        description: 'Brandfeste Schamotte, glasierte Reliefkacheln und Setzen wärmespeichernder Öfen.',
        prerequisites: [
          { type: 'profession', label: 'Töpfer & Keramiker', targetId: 'materialverarbeitung.toepfer' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'ofen_exp', name: 'Ofensetzer-Meisterprüfung', type: 'exam', description: 'Konstruktion eines rauchfreien Kachelofens.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Schamotteverarbeitung', 'Zug- & Rauchrohrführung', 'Kachelglasur'],
        possibleRanks: ['Ofensetzer', 'Hafnermeister']
      }
    ]
  },

  // ---------------------------------------------------------------------------
  // 14. STAATSWESEN, DIPLOMATIE & HOFDIENST
  // ---------------------------------------------------------------------------
  staatsdienst_diplomatie: {
    fieldId: 'staatsdienst_diplomatie',
    fieldName: 'Staatswesen, Diplomatie & Hofdienst',
    description: 'Diplomatischer Dienst, Staatskanzlei, Gesandtschaften, Rechtspflege, Hofzeremoniell und Personenschutz',
    rootNodeId: 'staatsdienst_root',
    nodes: [
      {
        id: 'staatsdienst_root',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Lehrling',
        tier: 'einstieg',
        category: 'Grundausbildung',
        rankOrder: 0,
        rankTitle: 'Einstiegsstufe',
        parentIds: [],
        childIds: ['unterhaendler', 'konsulent', 'vogt', 'herold', 'koerperdouble'],
        description: 'Einstieg in den diplomatischen Dienst, das Kanzleiwesen und die Hofämter.',
        prerequisites: [],
        careerRoutes: [
          { id: 'sd_r1', name: 'Grundausbildung Hofpage / Kanzleigehilfe', type: 'experience', description: 'Dienst in Kanzlei, Gesandtschaft oder Hofstaat.', requirementsSummary: 'Offener Einstieg' }
        ],
        suggestedCompetencies: ['Hofetikette', 'Schrift & Kanzleideutsch', 'Urkundenkunde', 'Aufmerksamkeit', 'Verschwiegenheit', 'Höflichkeit'],
        possibleRanks: ['Hofpage', 'Kanzleigehilfe', 'Amtsanwärter']
      },

      // -----------------------------------------------------------------------
      // KATEGORIE: Diplomatie & Gesandtschaft
      // -----------------------------------------------------------------------
      {
        id: 'unterhaendler',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Unterhändler',
        tier: 'beruf',
        category: 'Diplomatie & Gesandtschaft',
        rankOrder: 1,
        rankTitle: 'Grundstufe',
        nextRankProfession: 'Diplomat',
        parentIds: ['staatsdienst_root'],
        childIds: ['diplomat'],
        description: 'Führt Erstgespräche vor Ort bei Grenzstreitigkeiten, Waffenstillständen, Verträgen und Vergleichen.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'uh_r1', name: 'Verhandlungsprüfung', type: 'exam', description: 'Prüfung in Schlichtung und Verhandlungstaktik.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Verhandlungsführung', 'Rhetorik & Überzeugung', 'Menschenkenntnis', 'Rechtliche Grundlagen'],
        possibleRanks: ['Unterhändler-Gehilfe', 'Unterhändler', 'Erster Unterhändler']
      },
      {
        id: 'diplomat',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Diplomat',
        tier: 'beruf',
        category: 'Diplomatie & Gesandtschaft',
        rankOrder: 2,
        rankTitle: 'Fachstufe',
        previousRankProfession: 'Unterhändler',
        nextRankProfession: 'Gesandter',
        parentIds: ['unterhaendler'],
        childIds: ['gesandter'],
        description: 'Akkreditierter Repräsentant der Krone bei internationalen Beziehungen, Abkommen und Bündnissen.',
        prerequisites: [
          { type: 'profession', label: 'Unterhändler', targetId: 'unterhaendler' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'dip_r1', name: 'Diplomatenakkreditierung', type: 'social_recognition', description: 'Ernennung durch das Außenministerium oder den Hofrat.', requirementsSummary: 'Anerkennung durch Hof' }
        ],
        suggestedCompetencies: ['Diplomatisches Protokoll', 'Fremdsprachen & Dialekte', 'Staatsvertragsrecht', 'Taktische Zurückhaltung'],
        possibleRanks: ['Legationssekretär', 'Botschaftsrat', 'Diplomat']
      },
      {
        id: 'gesandter',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Gesandter',
        tier: 'beruf',
        category: 'Diplomatie & Gesandtschaft',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        previousRankProfession: 'Diplomat',
        nextRankProfession: 'Friedensstifter',
        parentIds: ['diplomat'],
        childIds: ['friedensstifter'],
        description: 'Außerordentlicher Gesandter und bevollmächtigter Minister an fremden Herrscherhöfen.',
        prerequisites: [
          { type: 'profession', label: 'Diplomat', targetId: 'diplomat' },
          { type: 'experience_years', label: '4 Jahre Praxis', minValue: 4 }
        ],
        careerRoutes: [
          { id: 'ges_r1', name: 'Beglaubigungsschreiben des Monarchen', type: 'social_recognition', description: 'Verleihung der vollen Gesandtschaftsbefugnis.', requirementsSummary: 'Beglaubigung' }
        ],
        suggestedCompetencies: ['Geopolitische Strategie', 'Hohe Staatsdiplomatie', 'Bündnisverhandlungen', 'Staatsrecht'],
        possibleRanks: ['Gesandter', 'Außerordentlicher Gesandter', 'Botschafter']
      },
      {
        id: 'friedensstifter',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Friedensstifter',
        tier: 'beruf',
        category: 'Diplomatie & Gesandtschaft',
        rankOrder: 4,
        rankTitle: 'Spitzenamt',
        previousRankProfession: 'Gesandter',
        parentIds: ['gesandter'],
        childIds: [],
        description: 'Chefunterhändler bei Reichsfriedensschlüssen, Großallianzen und epochalen Konfliktbeilegungen.',
        prerequisites: [
          { type: 'profession', label: 'Gesandter', targetId: 'gesandter' },
          { type: 'experience_years', label: '6 Jahre Praxis', minValue: 6 }
        ],
        careerRoutes: [
          { id: 'fs_r1', name: 'Friedensdiplom & Reichsanerkennung', type: 'social_recognition', description: 'Ehrentitel für die Schlichtung kriegerischer Konflikte.', requirementsSummary: 'Kaiserliche Würdigung' }
        ],
        suggestedCompetencies: ['Internationale Friedensarchitektur', 'Krisenintervention', 'Historische Staatsverträge', 'Maximale Autorität'],
        possibleRanks: ['Chefvermittler', 'Großgesandter', 'Friedensstifter']
      },

      // -----------------------------------------------------------------------
      // KATEGORIE: Staatsführung & Kanzlei
      // -----------------------------------------------------------------------
      {
        id: 'konsulent',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Konsulent',
        tier: 'beruf',
        category: 'Staatsführung & Kanzlei',
        rankOrder: 1,
        rankTitle: 'Grundstufe',
        nextRankProfession: 'Berater',
        parentIds: ['staatsdienst_root'],
        childIds: ['berater'],
        description: 'Sach- und Rechtsverständiger für die Vorbereitung staatlicher Vorhaben, Gutachten und Kanzleientwürfe.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'kon_r1', name: 'Gutachterprüfung', type: 'exam', description: 'Abschluss in Rechts- und Verwaltungsgutachten.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Gutachtenerstellung', 'Rechtskunde', 'Aktenführung', 'Analytisches Denken'],
        possibleRanks: ['Kanzleikonsulent', 'Rechtskonsulent', 'Oberkonsulent']
      },
      {
        id: 'berater',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Berater',
        tier: 'beruf',
        category: 'Staatsführung & Kanzlei',
        rankOrder: 2,
        rankTitle: 'Fachstufe',
        previousRankProfession: 'Konsulent',
        nextRankProfession: 'Siegelbewahrer',
        parentIds: ['konsulent'],
        childIds: ['siegelbewahrer'],
        description: 'Vertrauter Ratgeber des Herrschers oder Landesfürsten mit ständiger Stimme im Hofrat.',
        prerequisites: [
          { type: 'profession', label: 'Konsulent', targetId: 'konsulent' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'ber_r1', name: 'Hofratspatent', type: 'social_recognition', description: 'Ernennung zum stimmberechtigten Hofrat.', requirementsSummary: 'Patent des Landesherrn' }
        ],
        suggestedCompetencies: ['Strategische Staatsberatung', 'Finanz- & Innenpolitik', 'Rhetorik & Debatte', 'Verschwiegenheit'],
        possibleRanks: ['Regierungsrat', 'Hofrat', 'Geheimer Rat']
      },
      {
        id: 'siegelbewahrer',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Siegelbewahrer',
        tier: 'beruf',
        category: 'Staatsführung & Kanzlei',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        previousRankProfession: 'Berater',
        nextRankProfession: 'Kanzler',
        parentIds: ['berater'],
        childIds: ['kanzler'],
        description: 'Hüter der Reichssiegel und Siegelringe; beglaubigt alle Gesetze, Schenkungen und königlichen Erlasse.',
        prerequisites: [
          { type: 'profession', label: 'Berater', targetId: 'berater' },
          { type: 'experience_years', label: '4 Jahre Praxis', minValue: 4 }
        ],
        careerRoutes: [
          { id: 'sb_r1', name: 'Siegelbestallung', type: 'social_recognition', description: 'Offizielle Übergabe des Staats- und Kanzleisiegels.', requirementsSummary: 'Kanzleibestallung' }
        ],
        suggestedCompetencies: ['Siegel- & Urkundenrecht', 'Fälschungserkennung', 'Staatsrechtliche Prüfung', 'Aktenkontrolle'],
        possibleRanks: ['Geheimer Siegelbewahrer', 'Großsiegelbewahrer']
      },
      {
        id: 'kanzler',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Kanzler',
        tier: 'beruf',
        category: 'Staatsführung & Kanzlei',
        rankOrder: 4,
        rankTitle: 'Spitzenamt',
        previousRankProfession: 'Siegelbewahrer',
        parentIds: ['siegelbewahrer'],
        childIds: [],
        description: 'Leiter der Staatskanzlei, erster Minister der Krone und oberster Koordinator aller Regierungsgeschäfte.',
        prerequisites: [
          { type: 'profession', label: 'Siegelbewahrer', targetId: 'siegelbewahrer' },
          { type: 'experience_years', label: '6 Jahre Praxis', minValue: 6 }
        ],
        careerRoutes: [
          { id: 'kz_r1', name: 'Kanzlerpatent des Monarchen', type: 'social_recognition', description: 'Erhebung zum Staatskanzler durch den Herrscher.', requirementsSummary: 'Kanzlerbestallung' }
        ],
        suggestedCompetencies: ['Staatsführung & Exekutive', 'Regierungskoordination', 'Verfassungs- & Reichspolitik', 'Kabinettsleitung'],
        possibleRanks: ['Vizekanzler', 'Staatskanzler', 'Großkanzler']
      },

      // -----------------------------------------------------------------------
      // KATEGORIE: Rechtspflege & Landesverwaltung
      // -----------------------------------------------------------------------
      {
        id: 'vogt',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Vogt',
        tier: 'beruf',
        category: 'Rechtspflege & Landesverwaltung',
        rankOrder: 1,
        rankTitle: 'Grundstufe',
        nextRankProfession: 'Verwalter',
        parentIds: ['staatsdienst_root'],
        childIds: ['verwalter'],
        description: 'Landesherrlicher Amtmann für Bezirksordnung, Abgabenerhebung und niedere Gerichtsbarkeit.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'vg_r1', name: 'Vogteibestallung', type: 'exam', description: 'Nachweis der Kenntnisse im Abgaben- und Polizeirecht.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Abgabenerhebung', 'Ordnungsaufsicht', 'Niedere Gerichtsbarkeit', 'Lokale Verwaltung'],
        possibleRanks: ['Untervogt', 'Vogt', 'Amtsvogt']
      },
      {
        id: 'verwalter',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Verwalter',
        tier: 'beruf',
        category: 'Rechtspflege & Landesverwaltung',
        rankOrder: 2,
        rankTitle: 'Fachstufe',
        previousRankProfession: 'Vogt',
        nextRankProfession: 'Güterverwalter',
        parentIds: ['vogt'],
        childIds: ['gueterverwalter'],
        description: 'Leiter von Ämtern, Speicherhäusern und landesherrlichen Domänen.',
        prerequisites: [
          { type: 'profession', label: 'Vogt', targetId: 'vogt' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'vw_r1', name: 'Amtsverwalter-Patent', type: 'exam', description: 'Prüfung über Rechnungslegung und Domänenverwaltung.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Wirtschaftsführung', 'Kämmereiwesen', 'Personalaufsicht', 'Vertragswesen'],
        possibleRanks: ['Amtsverwalter', 'Oberverwalter']
      },
      {
        id: 'gueterverwalter',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Güterverwalter',
        tier: 'beruf',
        category: 'Rechtspflege & Landesverwaltung',
        rankOrder: 3,
        rankTitle: 'Fachstufe',
        previousRankProfession: 'Verwalter',
        nextRankProfession: 'Kurfürstlicher Beamter',
        parentIds: ['verwalter'],
        childIds: ['kurfuerstlicher_beamter'],
        description: 'Oberste ökonomische Verwaltung aller Krongüter, Pachten, Forste und Bergregale eines Landesteils.',
        prerequisites: [
          { type: 'profession', label: 'Verwalter', targetId: 'verwalter' },
          { type: 'experience_years', label: '3 Jahre Praxis', minValue: 3 }
        ],
        careerRoutes: [
          { id: 'gv_r1', name: 'Domänenpatent', type: 'social_recognition', description: 'Betrauung mit der Oberaufsicht über Krongüter.', requirementsSummary: '3 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Domänenökonomie', 'Ertragsrechnung', 'Pachtverträge', 'Ressourcenplanung'],
        possibleRanks: ['Güterverwalter', 'Oberrentmeister', 'Domänendirektor']
      },
      {
        id: 'kurfuerstlicher_beamter',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Kurfürstlicher Beamter',
        tier: 'beruf',
        category: 'Rechtspflege & Landesverwaltung',
        rankOrder: 4,
        rankTitle: 'Meisterstufe',
        previousRankProfession: 'Güterverwalter',
        nextRankProfession: 'Landrichter',
        parentIds: ['gueterverwalter'],
        childIds: ['landrichter'],
        description: 'Bestallter Regierungsbeamter mit Aufsicht über landesweite Verwaltungsbezirke und landesherrliche Dekrete.',
        prerequisites: [
          { type: 'profession', label: 'Güterverwalter', targetId: 'gueterverwalter' },
          { type: 'experience_years', label: '4 Jahre Praxis', minValue: 4 }
        ],
        careerRoutes: [
          { id: 'kb_r1', name: 'Beamtenbestallung des Kurfürsten', type: 'social_recognition', description: 'Urkunde über hoheitliche Amtsbefugnisse.', requirementsSummary: 'Kurfürstliches Patent' }
        ],
        suggestedCompetencies: ['Hoheitsverwaltung', 'Dekretumsetzung', 'Reichssteueraufsicht', 'Bezirksinspektion'],
        possibleRanks: ['Amtsrat', 'Oberregierungsbeamter', 'Kurfürstlicher Rat']
      },
      {
        id: 'landrichter',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Landrichter',
        tier: 'beruf',
        category: 'Rechtspflege & Landesverwaltung',
        rankOrder: 5,
        rankTitle: 'Spitzenamt',
        previousRankProfession: 'Kurfürstlicher Beamter',
        parentIds: ['kurfuerstlicher_beamter'],
        childIds: [],
        description: 'Oberster Richter des Landgerichts mit Befugnis über Blut- und Hochgerichtsbarkeit im gesamten Fürstentum.',
        prerequisites: [
          { type: 'profession', label: 'Kurfürstlicher Beamter', targetId: 'kurfuerstlicher_beamter' },
          { type: 'experience_years', label: '5 Jahre Praxis', minValue: 5 }
        ],
        careerRoutes: [
          { id: 'lr_r1', name: 'Richterweihe & Schöffenbestallung', type: 'social_recognition', description: 'Ernennung zum Obersten Richter durch den Fürsten.', requirementsSummary: 'Richterpatent' }
        ],
        suggestedCompetencies: ['Hoch- & Blutgerichtsbarkeit', 'Reichsgesetzgebung', 'Urteilsfindung', 'Verfassungsrecht'],
        possibleRanks: ['Landrichter', 'Oberlandrichter', 'Präsident des Landgerichts']
      },

      // -----------------------------------------------------------------------
      // KATEGORIE: Hofzeremoniell & Protokoll
      // -----------------------------------------------------------------------
      {
        id: 'herold',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Herold',
        tier: 'beruf',
        category: 'Hofzeremoniell & Protokoll',
        rankOrder: 1,
        rankTitle: 'Grundstufe',
        nextRankProfession: 'Wappenkundiger',
        parentIds: ['staatsdienst_root'],
        childIds: ['wappenkundiger'],
        description: 'Zeremonieller Bote der Krone, Ausrufer bei Festen, Turnieren und offiziellen Proklamationen.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'he_r1', name: 'Heroldseid', type: 'exam', description: 'Eid auf Neutralität und exakte Nachrichtenübermittlung.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Stimmbeherrschung & Vortrag', 'Proklamationsrecht', 'Hofzeremonien', 'Reitsicherheit'],
        possibleRanks: ['Knappe des Herolds', 'Herold', 'Oberherold']
      },
      {
        id: 'wappenkundiger',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Wappenkundiger',
        tier: 'beruf',
        category: 'Hofzeremoniell & Protokoll',
        rankOrder: 2,
        rankTitle: 'Fachstufe',
        previousRankProfession: 'Herold',
        nextRankProfession: 'Zeremonienmeister',
        parentIds: ['herold'],
        childIds: ['zeremonienmeister'],
        description: 'Gelehrter der Heraldik, Genealogie, Wappenrollen, Standesnachweise und Adelsmatrikel.',
        prerequisites: [
          { type: 'profession', label: 'Herold', targetId: 'herold' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'wk_r1', name: 'Wappenmeisterprüfung', type: 'exam', description: 'Nachweis profunder Kenntnisse der Reichsheraldik.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Heraldik & Blasonierung', 'Adelsgenealogie', 'Urkundenkunde', 'Turnierregeln'],
        possibleRanks: ['Wappenmaler', 'Wappenkundiger', 'Reichswappenmeister']
      },
      {
        id: 'zeremonienmeister',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Zeremonienmeister',
        tier: 'beruf',
        category: 'Hofzeremoniell & Protokoll',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        previousRankProfession: 'Wappenkundiger',
        nextRankProfession: 'Truchsess',
        parentIds: ['wappenkundiger'],
        childIds: ['truchsess'],
        description: 'Leiter des Hofprotokolls, imperialer Krönungsfeiern, Staatsempfänge, Hoffeste und diplomatischer Audienzen.',
        prerequisites: [
          { type: 'profession', label: 'Wappenkundiger', targetId: 'wappenkundiger' },
          { type: 'experience_years', label: '3 Jahre Praxis', minValue: 3 }
        ],
        careerRoutes: [
          { id: 'zm_r1', name: 'Protokollbestallung', type: 'social_recognition', description: 'Ernennung zum Obersten Zeremonienmeister am Hofe.', requirementsSummary: '3 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Imperiales Hofprotokoll', 'Sitzordnungen & Ränge', 'Fest- & Feierregie', 'Etikette-Aufsicht'],
        possibleRanks: ['Vizezeremonienmeister', 'Zeremonienmeister', 'Oberzeremonienmeister']
      },
      {
        id: 'truchsess',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Truchsess',
        tier: 'beruf',
        category: 'Hofzeremoniell & Protokoll',
        rankOrder: 4,
        rankTitle: 'Meisterstufe',
        previousRankProfession: 'Zeremonienmeister',
        nextRankProfession: 'Hofmarschall',
        parentIds: ['zeremonienmeister'],
        childIds: ['hofmarschall'],
        description: 'Erzamt der Hofhaltung mit Aufsicht über die fürstliche Tafel, Festbankette und Vorräte des Hofstaates.',
        prerequisites: [
          { type: 'profession', label: 'Zeremonienmeister', targetId: 'zeremonienmeister' },
          { type: 'experience_years', label: '4 Jahre Praxis', minValue: 4 }
        ],
        careerRoutes: [
          { id: 'tr_r1', name: 'Truchsessenpatent', type: 'social_recognition', description: 'Verleihung des Erzamtes durch den Hof.', requirementsSummary: 'Erzamtsverleihung' }
        ],
        suggestedCompetencies: ['Hofwirtschaft', 'Tafelzeremoniell', 'Festbankett-Koordination', 'Hoflogistik'],
        possibleRanks: ['Tafelmeister', 'Truchsess', 'Erobertruchsess']
      },
      {
        id: 'hofmarschall',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Hofmarschall',
        tier: 'beruf',
        category: 'Hofzeremoniell & Protokoll',
        rankOrder: 5,
        rankTitle: 'Spitzenamt',
        previousRankProfession: 'Truchsess',
        parentIds: ['truchsess'],
        childIds: [],
        description: 'Oberster Beamter des fürstlichen Hofstaats und oberster Leiter der gesamten Palast- und Hofstaatsverwaltung.',
        prerequisites: [
          { type: 'profession', label: 'Truchsess', targetId: 'truchsess' },
          { type: 'experience_years', label: '5 Jahre Praxis', minValue: 5 }
        ],
        careerRoutes: [
          { id: 'hm_r1', name: 'Hofmarschallbestallung', type: 'social_recognition', description: 'Höchste Bestallung im Hofstaat durch den Herrscher.', requirementsSummary: 'Hofpatent' }
        ],
        suggestedCompetencies: ['Hofstaatsführung', 'Palastverwaltung', 'Sicherheits- & Hofaufsicht', 'Staatshaushalt Hof'],
        possibleRanks: ['Vizehofmarschall', 'Hofmarschall', 'Obersthofmarschall']
      },

      // -----------------------------------------------------------------------
      // KATEGORIE: Hofschutz & Sicherheit
      // -----------------------------------------------------------------------
      {
        id: 'koerperdouble',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Körperdouble',
        tier: 'beruf',
        category: 'Hofschutz & Sicherheit',
        rankOrder: 1,
        rankTitle: 'Grundstufe',
        nextRankProfession: 'Leibwächter',
        parentIds: ['staatsdienst_root'],
        childIds: ['leibwaechter'],
        description: 'Täuschungsfigur zur Ablenkung von Anschlägen und Absicherung hochgefährlicher öffentlicher Auftritte.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 'kd_r1', name: 'Schattenprüfung', type: 'exam', description: 'Prüfung in Gestik, Mimik und Täuschungskunst.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Nachahmung & Mimik', 'Körperbeherrschung', 'Gefahrenerkennung', 'Täuschung'],
        possibleRanks: ['Double', 'Geheimdouble', 'Chefdoublant']
      },
      {
        id: 'leibwaechter',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Leibwächter',
        tier: 'beruf',
        category: 'Hofschutz & Sicherheit',
        rankOrder: 2,
        rankTitle: 'Fachstufe',
        previousRankProfession: 'Körperdouble',
        nextRankProfession: 'Personenschützer',
        parentIds: ['koerperdouble'],
        childIds: ['personenschuetzer'],
        description: 'Bewaffneter Nahschutz der Herrscherfamilie und Gefahrenabwehr in Palasträumen und auf Reisen.',
        prerequisites: [
          { type: 'profession', label: 'Körperdouble', targetId: 'koerperdouble' },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'lw_r1', name: 'Nahschutz-Eignungsprüfung', type: 'exam', description: 'Prüfung im bewaffneten und unbewaffneten Personenschutz.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Nahkampf & Parieren', 'Aufmerksamkeit & Wachsamkeit', 'Fluchtwegesicherung', 'Körperlicher Schutz'],
        possibleRanks: ['Leibgardist', 'Leibwächter', 'Oberleibwächter']
      },
      {
        id: 'personenschuetzer',
        fieldId: 'staatsdienst_diplomatie',
        name: 'Personenschützer',
        tier: 'beruf',
        category: 'Hofschutz & Sicherheit',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        previousRankProfession: 'Leibwächter',
        parentIds: ['leibwaechter'],
        childIds: [],
        description: 'Taktischer Leiter des Personenschutzes, Routensicherer, Ermittler und Koordinator des Sicherheitsstabs.',
        prerequisites: [
          { type: 'profession', label: 'Leibwächter', targetId: 'leibwaechter' },
          { type: 'experience_years', label: '4 Jahre Praxis', minValue: 4 }
        ],
        careerRoutes: [
          { id: 'ps_r1', name: 'Kommandoprüfung Leibwache', type: 'exam', description: 'Führung und taktische Leitung des Personenschutzkommandos.', requirementsSummary: '4 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Taktische Einsatzleitung', 'Bedrohungsanalyse', 'Konvoi- & Routenführung', 'Krisenentschärfung'],
        possibleRanks: ['Einsatzleiter Personenschutz', 'Hauptmann der Leibwache', 'Kommandeur des Personenschutzes']
      }
    ]
  }
};

/**
 * Maps each domain to appropriate career vocabulary so that no universal "Lehrling" or "Meister" is forced where unsuited.
 */
export function getDomainCareerVocabulary(fieldId: string, fieldName: string) {
  switch (fieldId) {
    case 'staatsdienst_diplomatie':
    case 'adel_herrschaft':
      return {
        entryName: 'Hofpage / Kanzleigehilfe',
        entryRanks: ['Page', 'Kanzleigehilfe'],
        entryDesc: 'Hofetikette, Urkundenkunde, Gesandtschaftslehre und diplomatischer Dienst.',
        core1Name: 'Herold & Zeremonienmeister',
        core1Ranks: ['Wappenkundler', 'Herold'],
        core2Name: 'Diplomat & Gesandter',
        core2Ranks: ['Legationssekretär', 'Gesandter'],
        spec1Name: 'Hofmarschall & Berater',
        spec1Ranks: ['Hofberater', 'Hofmarschall'],
        apexName: 'Großkanzler & Minister',
        apexRanks: ['Kanzler', 'Großkanzler'],
        promotionRouteName: 'Kanzleibestallung & Hofratspatent',
        routeType: 'social_recognition' as const
      };
    case 'militaer_streitkraefte':
    case 'militaer_sicherheit':
      return {
        entryName: 'Rekrut / Wachanwärter',
        entryRanks: ['Rekrut', 'Gemeiner'],
        entryDesc: 'Grundausbildung an Waffen, Disziplin und militärischer Drill.',
        core1Name: 'Soldat / Infanterist',
        core1Ranks: ['Gefreiter', 'Korporal'],
        core2Name: 'Stadtwache / Ordnungshüter',
        core2Ranks: ['Torwächter', 'Rottmeister'],
        spec1Name: 'Spezialkämpfer & Taktiker',
        spec1Ranks: ['Unteroffizier', 'Feldwebel'],
        apexName: 'Kommandant & General',
        apexRanks: ['Hauptmann', 'Major', 'General'],
        promotionRouteName: 'Offizierspatent & Bestallung',
        routeType: 'exam' as const
      };
    case 'unabhaengige_abenteurer':
      return {
        entryName: 'Anfänger-Abenteurer',
        entryRanks: ['Anfänger', 'Grünhorn'],
        entryDesc: 'Erste Gildenaufträge, Kartenlesen und Grundlagen des Überlebens.',
        core1Name: 'Söldner & Gladiator',
        core1Ranks: ['Söldner', 'Arena-Kämpfer'],
        core2Name: 'Gelehrter & Detektiv',
        core2Ranks: ['Ermittler', 'Forscher'],
        spec1Name: 'Drachenjäger & Kryptograph',
        spec1Ranks: ['Veteranenjäger', 'Experte'],
        apexName: 'Gilden-Champion & Großforscher',
        apexRanks: ['Gildenlegende', 'Großmeister'],
        promotionRouteName: 'S-Rang Gildenpatent & Helden-Anerkennung',
        routeType: 'social_recognition' as const
      };
    case 'arkan_magie':
    case 'magie_arkana':
      return {
        entryName: 'Magieschüler / Arkan-Novize',
        entryRanks: ['Novize', 'Adept'],
        entryDesc: 'Grundlagen des Manas, Meditation und erste arkanische Formeln.',
        core1Name: 'Arkanist & Magiewirker',
        core1Ranks: ['Arkanist', 'Magier'],
        core2Name: 'Elementarist & Forscher',
        core2Ranks: ['Elementarmagier', 'Thaumaturg'],
        spec1Name: 'Runenmeister & Verzauberer',
        spec1Ranks: ['Magister Artium', 'Großmagier'],
        apexName: 'Erzmagier & Akademieleiter',
        apexRanks: ['Erzmagier', 'Großmeister der Arkana'],
        promotionRouteName: 'Magische Weihe & Zirkelaufnahme',
        routeType: 'exam' as const
      };
    case 'religion_klerus':
      return {
        entryName: 'Novize / Tempelanwärter',
        entryRanks: ['Postulant', 'Novize'],
        entryDesc: 'Liturgie, Gebete und Dienst am heiligen Tempel.',
        core1Name: 'Kleriker & Priester',
        core1Ranks: ['Diakon', 'Priester'],
        core2Name: 'Kriegspriester & Exorzist',
        core2Ranks: ['Tempelwächter', 'Inquisitor'],
        spec1Name: 'Orakel & Sakraler Seher',
        spec1Ranks: ['Kanonikus', 'Dekan'],
        apexName: 'Abt & Hohepriester',
        apexRanks: ['Abt', 'Bischof', 'Hohepriester'],
        promotionRouteName: 'Priesterweihe & Kirchliche Investitur',
        routeType: 'exam' as const
      };
    case 'verwaltung_wirtschaft':
    case 'verwaltung_recht':
      return {
        entryName: 'Amtsanwärter / Schreibergehilfe',
        entryRanks: ['Kopist', 'Amtsgehilfe'],
        entryDesc: 'Kanzleiformulare, Aktenkopieren und Schriftgutablage.',
        core1Name: 'Schreiber & Buchhalter',
        core1Ranks: ['Amtsschreiber', 'Buchhalter'],
        core2Name: 'Steuereintreiber & Zöllner',
        core2Ranks: ['Zollerheber', 'Rentmeister'],
        spec1Name: 'Verwalter & Notar',
        spec1Ranks: ['Notar', 'Vogt'],
        apexName: 'Kanzler & Ratsschreiber',
        apexRanks: ['Kanzleidirektor', 'Kanzler'],
        promotionRouteName: 'Bestallungsdekret & Staatsexamen',
        routeType: 'exam' as const
      };
    case 'metall_waffen':
      return {
        entryName: 'Schmiedelehrling / Metallgehilfe',
        entryRanks: ['Lehrling', 'Anfänger'],
        entryDesc: 'Feuerführung, Materialauswahl und Hammerführung.',
        core1Name: 'Schmied & Waffenschmied',
        core1Ranks: ['Geselle', 'Altgeselle'],
        core2Name: 'Rüstungsschmied & Mechaniker',
        core2Ranks: ['Mechanicus', 'Feinschmied'],
        spec1Name: 'Schwertschmied & Instrumentenbauer',
        spec1Ranks: ['Spezialschmied', 'Klingenmeister'],
        apexName: 'Großschmiedemeister',
        apexRanks: ['Zunftmeister', 'Großschmied'],
        promotionRouteName: 'Großes Meisterstück der Schmiedezunft',
        routeType: 'exam' as const
      };
    case 'materialverarbeitung':
      return {
        entryName: 'Werkstofflehrling',
        entryRanks: ['Lehrling', 'Handlanger'],
        entryDesc: 'Materialauswahl von Leder, Textil, Glas und Ton.',
        core1Name: 'Gerber & Kürschner',
        core1Ranks: ['Geselle', 'Fachhandwerker'],
        core2Name: 'Schneider & Gewandmacher',
        core2Ranks: ['Handwerksgeselle', 'Schneider'],
        spec1Name: 'Glasmacher & Töpfer',
        spec1Ranks: ['Hüttenmeister', 'Meister'],
        apexName: 'Zunftoberhaupt der Werkstoffe',
        apexRanks: ['Zunftoberhaupt', 'Obermeister'],
        promotionRouteName: 'Zunftbrief & Meisterprüfung',
        routeType: 'exam' as const
      };
    case 'luxus_spezial':
      return {
        entryName: 'Luxusgewerbe-Lehrling',
        entryRanks: ['Apprentice', 'Eleve'],
        entryDesc: 'Feingefühl für Gemmen, seltene Düfte, Uhrmacherei und Zierpflanzen.',
        core1Name: 'Juwelier & Goldschmied',
        core1Ranks: ['Goldschmied', 'Juwelier'],
        core2Name: 'Parfümeur & Duftmischer',
        core2Ranks: ['Duftkünstler', 'Essenzenbrenner'],
        spec1Name: 'Uhrmacher & Florist',
        spec1Ranks: ['Feinmechanicus', 'Floristmeister'],
        apexName: 'Großmeister des Luxusgewerbes',
        apexRanks: ['Hofjuwelier', 'Hoflieferant'],
        promotionRouteName: 'Hoflieferanten-Patent',
        routeType: 'social_recognition' as const
      };
    case 'landwirtschaft_versorgung':
      return {
        entryName: 'Knecht / Jungbauer',
        entryRanks: ['Knecht', 'Jungbauer'],
        entryDesc: 'Feldarbeit, Bodenvorbereitung und Erntehelfer.',
        core1Name: 'Bauer & Landwirt',
        core1Ranks: ['Hofbauer', 'Kätner'],
        core2Name: 'Fischer & Teichwirt',
        core2Ranks: ['Fischergeselle', 'Teichmeister'],
        spec1Name: 'Kräutersammler & Imker',
        spec1Ranks: ['Fachlandwirt', 'Hofverwalter'],
        apexName: 'Hofbesitzer & Agrarmeister',
        apexRanks: ['Großbauer', 'Gutsverwalter'],
        promotionRouteName: 'Gutsbrief & Hofübernahme',
        routeType: 'exam' as const
      };
    case 'wandernde_erkundung':
      return {
        entryName: 'Pfadfinder-Anwärter',
        entryRanks: ['Wanderer', 'Späher'],
        entryDesc: 'Kompassnutzung, Orientierung und Wildnis-Grundregeln.',
        core1Name: 'Nomade & Entdecker',
        core1Ranks: ['Nomadenführer', 'Erkunder'],
        core2Name: 'Prospektor & Tracker',
        core2Ranks: ['Schürfer', 'Spurensucher'],
        spec1Name: 'Meister-Jäger & Trapper',
        spec1Ranks: ['Grenzläufer', 'Hauptmann'],
        apexName: 'Pionier der unbekannten Lande',
        apexRanks: ['Pionier', 'Expeditionsleiter'],
        promotionRouteName: 'Kartographisches Meisterwerk & Expeditionsbrief',
        routeType: 'social_recognition' as const
      };
    case 'tierfuehrung_tamer':
      return {
        entryName: 'Stallgehilfe / Jung-Tamer',
        entryRanks: ['Anfänger', 'Futtermeister'],
        entryDesc: 'Tierpflege, Fütterung und erstes Vertrauensbildungstraining.',
        core1Name: 'Tiertrainer & Falkner',
        core1Ranks: ['Tiertrainer', 'Falkner'],
        core2Name: 'Mahout & Beast Tamer',
        core2Ranks: ['Beast Tamer', 'Elefantenführer'],
        spec1Name: 'Drachenzähmer & Bug Tamer',
        spec1Ranks: ['Drachenbändiger', 'Groß-Tamer'],
        apexName: 'Großmeister-Dämonen-Tamer',
        apexRanks: ['Oberster Tamer', 'Legendenbändiger'],
        promotionRouteName: 'Meisterbändiger-Siegel',
        routeType: 'exam' as const
      };
    case 'kriminelle_berufe':
      return {
        entryName: 'Gassenjunge / Taschendieb',
        entryRanks: ['Gassenjunge', 'Späher'],
        entryDesc: 'Aufpassen an Straßenecken und schnelle Finger.',
        core1Name: 'Dieb & Schurke',
        core1Ranks: ['Taschendieb', 'Einbrecher'],
        core2Name: 'Schmuggler & Pirat',
        core2Ranks: ['Kapergast', 'Passfälscher'],
        spec1Name: 'Outlaw & Phantom-Dieb',
        spec1Ranks: ['Schattenläufer', 'Meisterdieb'],
        apexName: 'Syndikatsfürst der Unterwelt',
        apexRanks: ['Gildenlord', 'Schattenkönig'],
        promotionRouteName: 'Schattenpakt & Unterwelt-Krönung',
        routeType: 'social_recognition' as const
      };
    case 'geheimoperationen_ueberleben':
      return {
        entryName: 'Schatten-Anwärter / Rekrut',
        entryRanks: ['Anwärter', 'Späher'],
        entryDesc: 'Tarnung, geräuschlose Fortbewegung und Spurenbeseitigung.',
        core1Name: 'Spion & Kopfgeldjäger',
        core1Ranks: ['Agent', 'Kopfgeldjäger'],
        core2Name: 'Ninja & Deserteur',
        core2Ranks: ['Shinobi', 'Überlebender'],
        spec1Name: 'Auftragskiller & Untotenjäger',
        spec1Ranks: ['Assassine', 'Schattenmeister'],
        apexName: 'Meisterspion & Schattenkommandeur',
        apexRanks: ['Großmeister', 'Schattenleiter'],
        promotionRouteName: 'Meisterauftrag & Geheimkodex',
        routeType: 'exam' as const
      };
    case 'haushalt_dienste':
      return {
        entryName: 'Hausgehilfe / Dienstmädchen',
        entryRanks: ['Dienstbote', 'Junior-Maid'],
        entryDesc: 'Reinigung, Menüabfolge und Hausordnung im Anwesen.',
        core1Name: 'Maid & Kutscher',
        core1Ranks: ['Maid', 'Kutscher'],
        core2Name: 'Haushälterin & Vorkoster',
        core2Ranks: ['Haushälterin', 'Vorkoster'],
        spec1Name: 'Butler & Privatsekretär',
        spec1Ranks: ['Erster Butler', 'Privatsekretär'],
        apexName: 'Oberster Haushofmeister',
        apexRanks: ['Haushofmeister', 'Chef-Maitre'],
        promotionRouteName: 'Ernennung zum Obersten Haushofmeister',
        routeType: 'social_recognition' as const
      };
    case 'unterhaltung_spezial':
      return {
        entryName: 'Bühnen-Eleve',
        entryRanks: ['Bühnenkind', 'Eleve'],
        entryDesc: 'Stimmtraining, Körperbeherrschung und Lampenfieberüberwindung.',
        core1Name: 'Akrobat & Tänzer',
        core1Ranks: ['Artist', 'Tänzer'],
        core2Name: 'Puppenspieler & Totengräber',
        core2Ranks: ['Puppenspieler', 'Totengräber'],
        spec1Name: 'Kurtisane & Vogelabrichter',
        spec1Ranks: ['Solokünstler', 'Spezialdarsteller'],
        apexName: 'Gefeierte Diva & Magical Girl',
        apexRanks: ['Diva', 'Sternenkünstlerin'],
        promotionRouteName: 'Bühnenkrönung & Ehrenplatz',
        routeType: 'social_recognition' as const
      };
    case 'bildung_erziehung':
    case 'private_gesellschaftsrollen':
      return {
        entryName: 'Schulmeister-Anwärter & Gehilfe',
        entryRanks: ['Schulgehilfe', 'Hilfslehrer'],
        entryDesc: 'Didaktische Grundausbildung, Lektüre und Betreuung von Lernenden.',
        core1Name: 'Lehrer & Erzieher',
        core1Ranks: ['Lehrer', 'Schulmeister'],
        core2Name: 'Gilden-Ausbilder & Fechtmeister',
        core2Ranks: ['Instruktor', 'Gildenmeister'],
        spec1Name: 'Dozent & Prinzenerzieher',
        spec1Ranks: ['Oberlehrer', 'Akademiedozent'],
        apexName: 'Professor & Rektor',
        apexRanks: ['Professor', 'Rektor', 'Großmeister der Lehre'],
        promotionRouteName: 'Akademische Bestallung & Lehrpatent',
        routeType: 'exam' as const
      };
    default:
      return {
        entryName: `Lehrling (${fieldName})`,
        entryRanks: ['Lehrling', 'Anfänger'],
        entryDesc: `Grundausbildung und Einstieg in das Berufsfeld ${fieldName}.`,
        core1Name: `Facharbeiter (${fieldName})`,
        core1Ranks: ['Geselle', 'Fachkraft'],
        core2Name: `Praktiker / Gehilfe (${fieldName})`,
        core2Ranks: ['Gehilfe', 'Altgeselle'],
        spec1Name: `Spezialist (${fieldName})`,
        spec1Ranks: ['Fachspezialist', 'Vorarbeiter'],
        apexName: `Meister & Leiter (${fieldName})`,
        apexRanks: ['Meister', 'Zunftmeister', 'Oberleiter'],
        promotionRouteName: 'Meisterprüfung / Zunftabschluss',
        routeType: 'exam' as const
      };
  }
}

const NOBLE_TITLES = new Set([
  'kaiser', 'kaiserin', 'könig', 'königin', 'großherzog', 'großherzogin', 'kurfürst', 'kurfürstin',
  'herzog', 'herzogin', 'fürst', 'fürstin', 'landgraf', 'landgräfin', 'markgraf', 'markgräfin',
  'pfalzgraf', 'pfalzgräfin', 'graf', 'gräfin', 'burggraf', 'burggräfin', 'vizegraf', 'vizegräfin',
  'baron', 'baronin', 'freiherr', 'freiin', 'ritter', 'edler', 'edle', 'junker', 'edelfräulein',
  'patrizier', 'prinz', 'prinzessin', 'kronprinz', 'kronprinzessin', 'erbprinz', 'erbprinzessin',
  'erbherzog', 'erbherzogstochter', 'erbgraf', 'erbgräfin', 'komtesse', 'baronssohn', 'baronstochter',
  'lord', 'lady', 'monarch', 'regent', 'adel'
]);

/**
 * Enriches any tree field ensuring all nodes have category, rankOrder, rankTitle,
 * and links to the previous/next rank in their respective progression chain.
 */
export function enrichTreeNodesWithHierarchy(tree: ProfessionTreeField): ProfessionTreeField {
  const nodeMap = new Map<string, ProfessionTreeNode>();
  for (const n of tree.nodes) {
    nodeMap.set(n.id, n);
  }

  // Derive categories and rank details if not explicitly set
  const enrichedNodes = tree.nodes.map(node => {
    let category = node.category;
    let rankOrder = node.rankOrder;
    let rankTitle = node.rankTitle;
    let nextRankProfession = node.nextRankProfession;
    let previousRankProfession = node.previousRankProfession;

    // Determine category from specialization, parent, or tree name
    if (!category) {
      if (node.tier === 'einstieg') {
        category = 'Grundausbildung';
      } else if (node.specializationOf && nodeMap.has(node.specializationOf)) {
        category = nodeMap.get(node.specializationOf)!.name;
      } else if (node.parentIds.length > 0 && nodeMap.has(node.parentIds[0]) && nodeMap.get(node.parentIds[0])!.tier !== 'einstieg') {
        category = nodeMap.get(node.parentIds[0])!.name;
      } else {
        category = node.name;
      }
    }

    // Determine rank order and title based on tier
    if (rankOrder === undefined) {
      if (node.tier === 'einstieg') {
        rankOrder = 0;
        rankTitle = 'Einstiegsstufe';
      } else if (node.tier === 'beruf') {
        rankOrder = 1;
        rankTitle = 'Grundstufe / Geselle';
      } else if (node.tier === 'spezialisierung') {
        rankOrder = 2;
        rankTitle = 'Fachstufe / Spezialist';
      } else if (node.tier === 'meister') {
        rankOrder = 3;
        rankTitle = 'Meisterstufe';
      }
    }

    // Determine previous and next profession names if available
    if (!nextRankProfession && node.childIds && node.childIds.length > 0) {
      const firstChild = nodeMap.get(node.childIds[0]);
      if (firstChild) {
        nextRankProfession = firstChild.name;
      }
    }

    if (!previousRankProfession && node.parentIds && node.parentIds.length > 0) {
      const parent = nodeMap.get(node.parentIds[0]);
      if (parent && parent.tier !== 'einstieg') {
        previousRankProfession = parent.name;
      }
    }

    const suggestedAuthorities =
      node.suggestedAuthorities ||
      node.authorities ||
      getSuggestedAuthoritiesForProfession(node.name, rankOrder ?? node.tier);

    return {
      ...node,
      category,
      rankOrder,
      rankTitle,
      nextRankProfession,
      previousRankProfession,
      suggestedAuthorities,
      authorities: suggestedAuthorities
    };
  });

  return {
    ...tree,
    nodes: enrichedNodes
  };
}

/**
 * Creates a generic fallback tree for any field using domain-appropriate vocabulary,
 * grouping raw presets into structured categories and sequential hierarchical ranks.
 */
export function generateGenericTreeForField(fieldId: string, fieldName: string): ProfessionTreeField {
  const rootId = `${fieldId}_root`;
  const cleanFieldName = fieldName || fieldId;

  // Normalize fieldId for backwards compatibility
  const normalizedFieldId = fieldId === 'adel_herrschaft' ? 'staatsdienst_diplomatie' :
                           fieldId === 'private_gesellschaftsrollen' ? 'bildung_erziehung' : fieldId;

  // Find jobs defined in JOB_CATEGORIES for this field
  const categoryPreset = JOB_CATEGORIES.find(c => c.fieldId === normalizedFieldId || c.fieldId === fieldId);
  const rawJobs = categoryPreset ? categoryPreset.jobs : [];

  // Group raw jobs into category branches.
  // In jobPresets, entries are often grouped naturally or contain slash-pairs ("JobA / JobB")
  interface JobHierarchyItem {
    name: string;
    category: string;
    rankOrder: number;
    rankTitle: string;
    nextRank?: string;
    prevRank?: string;
  }

  const items: JobHierarchyItem[] = [];
  let categoryCounter = 1;

  for (let entryIdx = 0; entryIdx < rawJobs.length; entryIdx++) {
    const rawEntry = rawJobs[entryIdx];
    const parts = rawEntry.split(' / ').map(p => p.trim()).filter(p => !NOBLE_TITLES.has(p.toLowerCase()));
    if (parts.length === 0) continue;

    // Use clean category label derived from the entry or group
    let categoryName = cleanFieldName;
    if (parts.length >= 2) {
      categoryName = `${parts[0]} & ${parts[1]}`;
    } else {
      categoryName = parts[0];
    }

    // Rank titles according to depth
    const rankTitles = ['Grundstufe', 'Fachstufe', 'Meisterstufe', 'Spitzenamt', 'Ehrenrang'];

    parts.forEach((jobName, pIdx) => {
      // Avoid duplicate names in the field
      if (items.some(it => it.name.toLowerCase() === jobName.toLowerCase())) return;

      const rankOrder = pIdx + 1;
      const rankTitle = rankTitles[Math.min(pIdx, rankTitles.length - 1)];
      const nextRank = pIdx + 1 < parts.length ? parts[pIdx + 1] : undefined;
      const prevRank = pIdx > 0 ? parts[pIdx - 1] : undefined;

      items.push({
        name: jobName,
        category: categoryName,
        rankOrder,
        rankTitle,
        nextRank,
        prevRank
      });
    });
    categoryCounter++;
  }

  // If no preset jobs found, provide clean default profession nodes
  if (items.length === 0) {
    items.push(
      { name: `Fachmann für ${cleanFieldName}`, category: cleanFieldName, rankOrder: 1, rankTitle: 'Fachstufe', nextRank: `Meister für ${cleanFieldName}` },
      { name: `Meister für ${cleanFieldName}`, category: cleanFieldName, rankOrder: 2, rankTitle: 'Meisterstufe', prevRank: `Fachmann für ${cleanFieldName}` }
    );
  }

  const childNodes: ProfessionTreeNode[] = items.map((item, index) => {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const nodeId = `${fieldId}.${slug}_${index}`;
    return {
      id: nodeId,
      fieldId,
      name: item.name,
      tier: 'beruf',
      category: item.category,
      rankOrder: item.rankOrder,
      rankTitle: item.rankTitle,
      nextRankProfession: item.nextRank,
      previousRankProfession: item.prevRank,
      parentIds: item.prevRank ? [] : [rootId],
      childIds: [],
      description: `Fachausbildung und selbstständige Berufsausübung als ${item.name} im Fachbereich ${cleanFieldName}.`,
      prerequisites: [{ type: 'experience_years', label: `${item.rankOrder} Jahr(e) Praxiserfahrung`, minValue: item.rankOrder }],
      careerRoutes: [
        {
          id: `route_${nodeId}`,
          name: `${item.name}-Fachprüfung`,
          type: 'exam',
          description: `Nachweis selbstständiger Fachbefähigung als ${item.name}.`,
          requirementsSummary: `${item.rankOrder} Jahr(e) Praxis`
        }
      ],
      suggestedCompetencies: [`Fachkunde ${item.name}`, 'Arbeitsorganisation', 'Qualitätskontrolle', 'Sorgfalt'],
      possibleRanks: [item.rankTitle, item.name]
    };
  });

  const rootNode: ProfessionTreeNode = {
    id: rootId,
    fieldId,
    name: 'Lehrling',
    tier: 'einstieg',
    category: 'Grundausbildung',
    rankOrder: 0,
    rankTitle: 'Einstiegsstufe',
    parentIds: [],
    childIds: childNodes.filter(c => c.rankOrder === 1).map(c => c.id),
    description: `Einstieg in den Berufszweig „${cleanFieldName}“`,
    prerequisites: [],
    careerRoutes: [
      {
        id: `${fieldId}_entry_route`,
        name: 'Grundausbildung & Dienstantritt',
        type: 'experience',
        description: 'Beginn der beruflichen Grundausbildung.',
        requirementsSummary: 'Offener Einstieg'
      }
    ],
    suggestedCompetencies: [
      'Arbeitsplatz vorbereiten',
      'Werkzeuge sicher benutzen',
      'Materialkunde',
      'Handgeschick',
      'Lernfähigkeit',
      'Sorgfalt'
    ],
    possibleRanks: ['Lehrling', 'Auszubildender', 'Anwärter']
  };

  return enrichTreeNodesWithHierarchy({
    fieldId,
    fieldName: cleanFieldName,
    description: `Berufsentwicklung und hierarchische Karrierepfade im Bereich ${cleanFieldName}`,
    rootNodeId: rootId,
    nodes: [rootNode, ...childNodes]
  });
}

/**
 * Returns the complete ProfessionTreeField for a given fieldId,
 * with normalized aliases and enriched category / hierarchy information.
 * Each branch contains its own Lehrling entry at the top, followed by Geselle,
 * promotions/specializations, and master ranks.
 */
export function getProfessionTreeForField(fieldId: string, fieldName?: string): ProfessionTreeField {
  // Check domain aliases
  const ALIASES: Record<string, string> = {
    adel_herrschaft: 'staatsdienst_diplomatie',
    militaer_streitkraefte: 'militaer_sicherheit',
    verwaltung_wirtschaft: 'verwaltung_recht',
    arkan_magie: 'magie_arkana',
    unabhaengige_abenteurer: 'abenteuer_sondergewerbe',
    landwirtschaft_versorgung: 'natur_landwirtschaft'
  };

  const normalizedFieldId = ALIASES[fieldId] || fieldId;

  // Build full hierarchical branches (Lehrling -> Geselle -> Beförderung/Spezialisierung -> Meister)
  const branches = getBranchesForField(normalizedFieldId, fieldName);
  const allNodes: ProfessionTreeNode[] = branches.flatMap(b => convertProgressionToNodes(normalizedFieldId, b));

  const cleanFieldName =
    fieldName ||
    JOB_CATEGORIES.find(c => c.fieldId === normalizedFieldId)?.category ||
    normalizedFieldId;

  return enrichTreeNodesWithHierarchy({
    fieldId: normalizedFieldId,
    fieldName: cleanFieldName,
    description: `Hierarchische Berufe, Spezialisierungen und Meisterstufen im Fachbereich ${cleanFieldName}.`,
    rootNodeId: allNodes[0]?.id || `${normalizedFieldId}_root`,
    nodes: allNodes
  });
}

/**
 * Finds a specific node in all available trees.
 */
export function findTreeNodeByNameOrId(term: string, fieldId?: string): ProfessionTreeNode | undefined {
  if (!term) return undefined;
  const lower = term.toLowerCase().trim();

  // If fieldId is given, search that tree first
  if (fieldId) {
    const tree = getProfessionTreeForField(fieldId);
    const found = tree.nodes.find(
      n => n.id.toLowerCase() === lower || n.name.toLowerCase() === lower || n.name.toLowerCase().includes(lower)
    );
    if (found) return found;
  }

  // Search through standard fields
  for (const cat of JOB_CATEGORIES) {
    const tree = getProfessionTreeForField(cat.fieldId);
    const found = tree.nodes.find(
      n => n.id.toLowerCase() === lower || n.name.toLowerCase() === lower || n.name.toLowerCase().includes(lower)
    );
    if (found) return found;
  }

  return undefined;
}

/**
 * Validates a ProfessionTreeField according to V7 rules:
 * - No cycles (A -> B -> C -> A)
 * - No self-prerequisites (node requires itself)
 * - Reachability (all nodes reachable from entry/training)
 */
export function validateProfessionTree(tree: ProfessionTreeField): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeMap = new Map<string, ProfessionTreeNode>();
  tree.nodes.forEach(n => nodeMap.set(n.id, n));

  // 1. Check self prerequisites
  for (const node of tree.nodes) {
    if (node.prerequisites) {
      for (const req of node.prerequisites) {
        if (req.targetId === node.id || req.targetId === node.name) {
          errors.push(`Selbstvoraussetzung gefunden: Knoten "${node.name}" (${node.id}) verlangt sich selbst.`);
        }
      }
    }
  }

  // 2. Check cycle detection (DFS with visited states: 0=unvisited, 1=visiting, 2=visited)
  const visitState = new Map<string, number>();
  function dfsCycle(nodeId: string, path: string[]): boolean {
    visitState.set(nodeId, 1);
    const node = nodeMap.get(nodeId);
    if (node && node.childIds) {
      for (const childId of node.childIds) {
        const state = visitState.get(childId) || 0;
        if (state === 1) {
          errors.push(`Zyklus im Berufstree entdeckt: ${path.join(' -> ')} -> ${childId}`);
          return true;
        }
        if (state === 0) {
          dfsCycle(childId, [...path, childId]);
        }
      }
    }
    visitState.set(nodeId, 2);
    return false;
  }

  for (const node of tree.nodes) {
    if ((visitState.get(node.id) || 0) === 0) {
      dfsCycle(node.id, [node.id]);
    }
  }

  // 3. Reachability check from root or entry/training nodes
  const reachable = new Set<string>();
  const entryNodes = tree.nodes.filter(
    n => n.rankOrder === 0 || n.tier === 'einstieg' || n.nodeType === 'training' || !n.parentIds || n.parentIds.length === 0
  );

  function markReachable(nodeId: string) {
    if (reachable.has(nodeId)) return;
    reachable.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (node?.childIds) {
      for (const childId of node.childIds) {
        markReachable(childId);
      }
    }
  }

  entryNodes.forEach(e => markReachable(e.id));
  if (tree.rootNodeId) markReachable(tree.rootNodeId);

  for (const node of tree.nodes) {
    if (!reachable.has(node.id)) {
      // Mark as warned
      errors.push(`Unerreichbarer Knoten: "${node.name}" (${node.id}) kann nicht von einer Ausbildungs-/Einstiegsstufe erreicht werden.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

