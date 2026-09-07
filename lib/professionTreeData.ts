import { ProfessionCompetency, ProfessionExperience, ProfessionProgress } from '../types';

export type ProfessionNodeTier = 'einstieg' | 'beruf' | 'spezialisierung' | 'meister';

export interface ProfessionPrerequisite {
  type: 'profession' | 'experience_years' | 'competency' | 'rank' | 'social_recognition' | 'exam_or_master';
  label: string;
  targetId?: string;
  minValue?: number;
  description?: string;
}

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
  tier: ProfessionNodeTier;
  parentIds: string[];
  childIds: string[];
  specializationOf?: string;
  description: string;
  prerequisites: ProfessionPrerequisite[];
  careerRoutes: ProfessionCareerRoute[];
  suggestedCompetencies: string[];
  possibleRanks: string[];
}

export interface ProfessionTreeField {
  fieldId: string;
  fieldName: string;
  description: string;
  rootNodeId: string;
  nodes: ProfessionTreeNode[];
}

export interface NodeEvaluationResult {
  isAvailable: boolean;
  isActive: boolean;
  missingPrerequisites: string[];
  fulfilledPrerequisites: string[];
}

/**
 * Evaluates whether a character meets the prerequisites for a specific tree node.
 */
export function evaluateNodePrerequisites(
  node: ProfessionTreeNode,
  currentCharacter: {
    profession?: string;
    professionField?: string;
    professionSpecialization?: string;
    professionRank?: string;
    experienceYears?: number;
    competencies?: ProfessionCompetency[];
  }
): NodeEvaluationResult {
  const currentProf = (currentCharacter.profession || '').toLowerCase().trim();
  const currentSpec = (currentCharacter.professionSpecialization || '').toLowerCase().trim();
  const nodeNameLower = node.name.toLowerCase().trim();

  // Active check
  const isActive = currentProf === nodeNameLower || currentSpec === nodeNameLower || (node.tier === 'einstieg' && !currentProf);

  const missingPrerequisites: string[] = [];
  const fulfilledPrerequisites: string[] = [];

  if (node.tier === 'einstieg' || node.prerequisites.length === 0) {
    return {
      isAvailable: true,
      isActive,
      missingPrerequisites: [],
      fulfilledPrerequisites: ['Keine Vorbedingungen erforderlich']
    };
  }

  const expYears = currentCharacter.experienceYears || 0;
  const comps = currentCharacter.competencies || [];

  for (const req of node.prerequisites) {
    if (req.type === 'experience_years') {
      const minYears = req.minValue || 1;
      if (expYears >= minYears) {
        fulfilledPrerequisites.push(`Berufserfahrung: ${expYears}/${minYears} Jahre`);
      } else {
        missingPrerequisites.push(`Mindestens ${minYears} ${minYears === 1 ? 'Jahr' : 'Jahre'} Berufserfahrung erforderlich (aktuell: ${expYears} J.)`);
      }
    } else if (req.type === 'profession') {
      const target = (req.targetId || '').toLowerCase();
      const match = currentProf.includes(target) || (target.length >= 4 && target.includes(currentProf));
      if (match) {
        fulfilledPrerequisites.push(`Basisberuf: ${req.label}`);
      } else {
        missingPrerequisites.push(`Basisberuf „${req.label}“ erforderlich`);
      }
    } else if (req.type === 'competency') {
      const minScore = req.minValue || 50;
      const target = (req.targetId || '').toLowerCase();
      const foundComp = comps.find(c => c.name.toLowerCase().includes(target));
      if (foundComp && (foundComp.proficiency || 0) >= minScore) {
        fulfilledPrerequisites.push(`Kompetenz „${foundComp.name}“ ≥ ${minScore}% (aktuell: ${foundComp.proficiency}%)`);
      } else if (foundComp) {
        missingPrerequisites.push(`Kompetenz „${foundComp.name}“ benötigt ${minScore}% (aktuell: ${foundComp.proficiency}%)`);
      } else {
        missingPrerequisites.push(`Kompetenz „${req.label}“ (min. ${minScore}%) noch nicht erlernt`);
      }
    } else if (req.type === 'rank') {
      fulfilledPrerequisites.push(req.label);
    } else {
      fulfilledPrerequisites.push(req.label);
    }
  }

  return {
    isAvailable: missingPrerequisites.length === 0,
    isActive,
    missingPrerequisites,
    fulfilledPrerequisites
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
        name: 'Küchen- & Lebensmittelhilfe',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['koch', 'baecker', 'metzger', 'brauer', 'kaeser', 'mueller', 'winzer'],
        description: 'Einstieg in lebensmittelverarbeitende Betriebe, Küchenhilfsdienste und Grundversorgung.',
        prerequisites: [],
        careerRoutes: [
          { id: 'r1', name: 'Grundausbildung / Lehrzeit', type: 'exam', description: 'Beginn einer regulären Zunftlehre.', requirementsSummary: 'Offener Einstieg' },
          { id: 'r2', name: 'Praktische Küchenhilfe', type: 'experience', description: 'Lernen durch Zuarbeit in Schankhäusern und Feldlagern.', requirementsSummary: 'Keine Vorkenntnisse' }
        ],
        suggestedCompetencies: ['Lebensmittelhygiene', 'Zutaten vorverarbeiten', 'Feuerstelle beaufsichtigen'],
        possibleRanks: ['Helfer', 'Küchenjunge', 'Lehrling']
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
        name: 'Handwerkslehrling / Handlanger',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['schmied', 'schreiner', 'zimmermann', 'maurer', 'gerber', 'schneider'],
        description: 'Grundlegende Hilfsarbeiten auf Baustellen, in Werkstätten und an Werktischen.',
        prerequisites: [],
        careerRoutes: [
          { id: 'h_open', name: 'Einstieg in Werkstatt', type: 'experience', description: 'Lehre oder Handlangerdienst.', requirementsSummary: 'Offen' }
        ],
        suggestedCompetencies: ['Werkzeuge pflegen', 'Materialtransport', 'Arbeitsplatzsicherheit'],
        possibleRanks: ['Handlanger', 'Lehrling']
      },
      // SCHMIED BRANCH
      {
        id: 'schmied',
        fieldId: 'bau_handwerk',
        name: 'Schmied',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: ['waffenschmied', 'ruestungsschmied', 'werkzeugschmied', 'hufschmied'],
        description: 'Umformen von Eisen, Bronze und Stahl am glühenden Amboss.',
        prerequisites: [
          { type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }
        ],
        careerRoutes: [
          { id: 's_exam', name: 'Gesellenstück', type: 'exam', description: 'Erfolgreiche Schmiedegesellenprüfung.', requirementsSummary: 'Zunftprüfung' },
          { id: 's_exp', name: 'Hammerschlagpraxis', type: 'experience', description: '1+ Jahr tägliches Schmieden.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Schmiedefeuer regulieren', 'Ambossführung', 'Härten & Anlassen'],
        possibleRanks: ['Schmiedegeselle', 'Grobschmied', 'Schmiedemeister']
      },
      {
        id: 'waffenschmied',
        fieldId: 'bau_handwerk',
        name: 'Waffenschmied & Klingenschmied',
        tier: 'spezialisierung',
        specializationOf: 'schmied',
        parentIds: ['schmied'],
        childIds: ['damastmeister'],
        description: 'Fertigung von Schwertern, Dolchen, Lanzen und Klingenwaffen mit exakter Härtung.',
        prerequisites: [
          { type: 'profession', label: 'Schmied', targetId: 'schmied' },
          { type: 'experience_years', label: '2 Jahre Schmiedeerfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'ws_exp', name: 'Klingenschmiedelehre', type: 'experience', description: 'Spezialisierung auf Klingenstahl.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Langschwerter schmieden', 'Hohlkehlen schlagen', 'Selektive Härtung'],
        possibleRanks: ['Klingenschmied', 'Waffenmeister']
      },
      {
        id: 'ruestungsschmied',
        fieldId: 'bau_handwerk',
        name: 'Rüstungsschmied & Plattner',
        tier: 'spezialisierung',
        specializationOf: 'schmied',
        parentIds: ['schmied'],
        childIds: ['damastmeister'],
        description: 'Treiben maßgeschneiderter Plattenharnische, Helme, Schilde und Schutzpanzer.',
        prerequisites: [
          { type: 'profession', label: 'Schmied', targetId: 'schmied' },
          { type: 'experience_years', label: '2 Jahre Schmiedeerfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'rs_exp', name: 'Plattnerkunst', type: 'experience', description: 'Treiben von Blechen auf Bossierklötzen.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Plattenrüstung treiben', 'Harnischpassung', 'Visierbau'],
        possibleRanks: ['Plattner', 'Harnischmeister']
      },
      {
        id: 'werkzeugschmied',
        fieldId: 'bau_handwerk',
        name: 'Werkzeug- & Feinschmied',
        tier: 'spezialisierung',
        specializationOf: 'schmied',
        parentIds: ['schmied'],
        childIds: [],
        description: 'Äxte, Beile, Meißel, Zangen, Schlösser und Präzisionswerkzeuge.',
        prerequisites: [
          { type: 'profession', label: 'Schmied', targetId: 'schmied' }
        ],
        careerRoutes: [
          { id: 'wzs_exp', name: 'Zeugschmiede', type: 'experience', description: 'Herstellung zäher Handwerkzeuge.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Werkzeugstähle verschweißen', 'Schlossmechanik'],
        possibleRanks: ['Zeugschmied', 'Schlossmacher']
      },
      {
        id: 'hufschmied',
        fieldId: 'bau_handwerk',
        name: 'Hufschmied',
        tier: 'spezialisierung',
        specializationOf: 'schmied',
        parentIds: ['schmied'],
        childIds: [],
        description: 'Beschlag von Pferden, Maultieren und Ochsen sowie Hufpflege.',
        prerequisites: [
          { type: 'profession', label: 'Schmied', targetId: 'schmied' }
        ],
        careerRoutes: [
          { id: 'hs_exp', name: 'Stall- & Wanderpraxis', type: 'experience', description: 'Beschlagpraxis an Reit- und Zugtieren.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Hufeisen anpassen', 'Hufkorrektur', 'Nagelung'],
        possibleRanks: ['Hufschmied']
      },
      {
        id: 'damastmeister',
        fieldId: 'bau_handwerk',
        name: 'Damastmeister & Meisterschmied',
        tier: 'meister',
        parentIds: ['waffenschmied', 'ruestungsschmied'],
        childIds: [],
        description: 'Feuerverschweißen mehrlagiger Damaszenerstähle und Meisterwerke von legendärer Schärfe.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Schmiedeerfahrung', minValue: 5 },
          { type: 'rank', label: 'Meistergrad' }
        ],
        careerRoutes: [
          { id: 'dm_exam', name: 'Meisterprüfung', type: 'exam', description: 'Schmieden einer Meisterklinge vor der Zunft.', requirementsSummary: '5 Jahre Praxis + Meisterstück' }
        ],
        suggestedCompetencies: ['Damaszenerstahl falten', 'Katana schmieden', 'Rüstungsmeisterwerk'],
        possibleRanks: ['Zunftmeister', 'Großschmied']
      },
      // SCHREINER / ZIMMERMANN / MAURER / GERBER / SCHNEIDER
      {
        id: 'schreiner',
        fieldId: 'bau_handwerk',
        name: 'Schreiner & Tischler',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: [],
        description: 'Möbelbau, Türen, Fenster, Holzverbindungen und Schnitzarbeiten.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'schr_exam', name: 'Tischlergeselle', type: 'exam', description: 'Zunftabschluss.', requirementsSummary: 'Zunftnachweis' }],
        suggestedCompetencies: ['Zinken & Zapfen', 'Hobeln', 'Oberflächenbeize'],
        possibleRanks: ['Geselle', 'Schreinermeister']
      },
      {
        id: 'zimmermann',
        fieldId: 'bau_handwerk',
        name: 'Zimmermann & Dachdecker',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: [],
        description: 'Dachstühle, Fachwerkbauten, Brücken und schwere Holzkonstruktionen.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'zim_exam', name: 'Walz & Wanderschaft', type: 'experience', description: 'Wanderschaft auf traditioneller Walz.', requirementsSummary: '1+ Jahr Praxis' }],
        suggestedCompetencies: ['Fachwerk abbinden', 'Dachstuhl richten', 'Holzverbinder'],
        possibleRanks: ['Wandergeselle', 'Zimmermeister']
      },
      {
        id: 'maurer',
        fieldId: 'bau_handwerk',
        name: 'Maurer & Steinmetz',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: [],
        description: 'Mauerwerk, Gewölbebau, Natursteinbearbeitung und Fundamentlegung.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'mau_exp', name: 'Bauhuttenpraxis', type: 'experience', description: 'Arbeit an Burgen und Sakralbauten.', requirementsSummary: 'Praxis' }],
        suggestedCompetencies: ['Bruchsteinmauerwerk', 'Gewölbebogen setzen', 'Mörtelmischung'],
        possibleRanks: ['Steinmetzgeselle', 'Bauhüttenmeister']
      },
      {
        id: 'gerber',
        fieldId: 'bau_handwerk',
        name: 'Gerber & Lederer',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: [],
        description: 'Pflanzliche und mineralische Gerbung von Häuten zu Rüst-, Sohl- und Bekleidungsleder.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'ger_exp', name: 'Gerberhof', type: 'experience', description: 'Praxis in Gerbbottichen und Trockenböden.', requirementsSummary: 'Praxis' }],
        suggestedCompetencies: ['Leder gerben', 'Zurichten & Falzen', 'Rüstleder härten'],
        possibleRanks: ['Lohgerber', 'Gerbermeister']
      },
      {
        id: 'schneider',
        fieldId: 'bau_handwerk',
        name: 'Schneider & Gewandmacher',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: [],
        description: 'Zuschnitt, Nähen, Passform und Veredelung von Stoff- und Lederkleidung.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'schn_exam', name: 'Schneiderzunft', type: 'exam', description: 'Zunftnachweis für Gewandmacherei.', requirementsSummary: 'Zunftbrief' }],
        suggestedCompetencies: ['Schnittmuster erstellen', 'Handnaht', 'Gewandverzierung'],
        possibleRanks: ['Schneidergeselle', 'Gewandmeister']
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
        name: 'Rekrut / Wachanwärter',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['soldat', 'stadtwache', 'soeldner', 'jaeger_militaer'],
        description: 'Grundausbildung an Wehrwaffen, Disziplin und militärischer Drill.',
        prerequisites: [],
        careerRoutes: [
          { id: 'm_enlist', name: 'Musterung & Dienstantritt', type: 'experience', description: 'Einschreibung in die Wehrliste.', requirementsSummary: 'Diensttauglich' }
        ],
        suggestedCompetencies: ['Waffengrundlagen', 'Marschdisziplin', 'Wachdienst'],
        possibleRanks: ['Rekrut', 'Gemeiner']
      },
      {
        id: 'soldat',
        fieldId: 'militaer_sicherheit',
        name: 'Soldat / Infanterist',
        tier: 'beruf',
        parentIds: ['militaer_root'],
        childIds: ['offizier', 'veteran', 'gardist'],
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
        name: 'Kommandant & Feldherr',
        tier: 'meister',
        parentIds: ['offizier', 'wachtmeister', 'gardist', 'soeldnerfuehrer'],
        childIds: [],
        description: 'Oberbefehlshaber von Festungen, Heeresabteilungen oder der gesamten Stadtwache.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Führungserfahrung', minValue: 5 }
        ],
        careerRoutes: [
          { id: 'kom_formal', name: 'Hohe Ernennung / Patent', type: 'exam', description: 'Bestallungsurkunde durch Landesherrn.', requirementsSummary: 'Bestallung' },
          { id: 'kom_emergency', name: 'Anerkennung in der Not', type: 'emergency', description: 'Truppen ernennen fähigen Veteranen zum Oberbefehl.', requirementsSummary: 'Kriegsnotwendigkeit' }
        ],
        suggestedCompetencies: ['Heeresführung', 'Festungsverteidigung', 'Kriegsrat leiten', 'Großstrategie'],
        possibleRanks: ['Garnisonskommandant', 'Festungskommandant', 'General', 'Feldmarschall']
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
        name: 'Schiffsjunge / Deckshelfer',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['seemann', 'lotse'],
        description: 'Deck schrubben, Taue klarieren, Hilfsdienste auf See und im Hafen.',
        prerequisites: [],
        careerRoutes: [
          { id: 's_muster', name: 'Heuern auf Schiff', type: 'experience', description: 'Erste Ausfahrt auf Frachter oder Kutter.', requirementsSummary: 'Heuervertrag' }
        ],
        suggestedCompetencies: ['Seemannsknoten', 'Seefestigkeit', 'Decksdienst'],
        possibleRanks: ['Schiffsjunge', 'Leichtmatrose']
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
        name: 'Hofhelfer / Forstarbeiter',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['bauer', 'jaeger', 'foerster', 'fischer', 'kraeutersammler'],
        description: 'Einfache Feldarbeit, Hege, Holzeinschlag und Pflege der Ländereien.',
        prerequisites: [],
        careerRoutes: [{ id: 'n_start', name: 'Dienst auf Hof oder Gut', type: 'experience', description: 'Mitarbeit auf Landgütern.', requirementsSummary: 'Offen' }],
        suggestedCompetencies: ['Bodenbearbeitung', 'Wetterbeobachtung', 'Werkzeugpflege'],
        possibleRanks: ['Knecht', 'Helfer']
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
  }
};

/**
 * Creates a generic fallback tree for any field that does not have custom nodes configured.
 */
export function generateGenericTreeForField(fieldId: string, fieldName: string): ProfessionTreeField {
  const rootId = `${fieldId}_root`;
  return {
    fieldId,
    fieldName,
    description: `Berufsentwicklung und Karrierepfade im Bereich ${fieldName}`,
    rootNodeId: rootId,
    nodes: [
      {
        id: rootId,
        fieldId,
        name: `Lehrling (${fieldName})`,
        tier: 'einstieg',
        parentIds: [],
        childIds: [`${fieldId}_core_1`, `${fieldId}_core_2`],
        description: `Grundausbildung und Einstieg in das Berufsfeld ${fieldName}.`,
        prerequisites: [],
        careerRoutes: [
          { id: 'gen_start', name: 'Grundlehre', type: 'experience', description: 'Beginn der Tätigkeit.', requirementsSummary: 'Offener Einstieg' }
        ],
        suggestedCompetencies: [`Grundlagen von ${fieldName}`, 'Fachkunde', 'Materialvorbereitung'],
        possibleRanks: ['Lehrling', 'Anfänger']
      },
      {
        id: `${fieldId}_core_1`,
        fieldId,
        name: `Facharbeiter (${fieldName})`,
        tier: 'beruf',
        parentIds: [rootId],
        childIds: [`${fieldId}_spec_1`, `${fieldId}_master`],
        description: `Selbstständige Ausführung aller zentralen Aufgaben im Bereich ${fieldName}.`,
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [
          { id: 'gen_geselle', name: 'Gesellenprüfung', type: 'exam', description: 'Abschlussprüfung.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Hauptaufgaben', 'Praxisfertigkeit', 'Qualitätskontrolle'],
        possibleRanks: ['Geselle', 'Fachkraft']
      },
      {
        id: `${fieldId}_core_2`,
        fieldId,
        name: `Praktiker / Gehilfe (${fieldName})`,
        tier: 'beruf',
        parentIds: [rootId],
        childIds: [`${fieldId}_spec_1`],
        description: `Erfahrene Hilfskraft mit breitem Wissen in ${fieldName}.`,
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxis', minValue: 1 }],
        careerRoutes: [
          { id: 'gen_exp', name: 'Praxisweg', type: 'experience', description: 'Tägliche Arbeit.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Assistenztätigkeit', 'Arbeitsorganisation'],
        possibleRanks: ['Gehilfe', 'Altgeselle']
      },
      {
        id: `${fieldId}_spec_1`,
        fieldId,
        name: `Spezialist (${fieldName})`,
        tier: 'spezialisierung',
        parentIds: [`${fieldId}_core_1`, `${fieldId}_core_2`],
        childIds: [`${fieldId}_master`],
        description: `Vertiefte Spezialisierung auf anspruchsvolle Sonderaufgaben.`,
        prerequisites: [
          { type: 'experience_years', label: '2 Jahre Fachpraxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'gen_spec', name: 'Fachvertiefung', type: 'experience', description: 'Spezialisierung im Betrieb.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Spezialtechnik', 'Schwierige Aufträge'],
        possibleRanks: ['Fachspezialist', 'Sonderbeauftragter']
      },
      {
        id: `${fieldId}_master`,
        fieldId,
        name: `Meister & Leiter (${fieldName})`,
        tier: 'meister',
        parentIds: [`${fieldId}_spec_1`, `${fieldId}_core_1`],
        childIds: [],
        description: `Höchste Meisterschaft, Leitung von Betrieben und Ausbildungsbefugnis.`,
        prerequisites: [
          { type: 'experience_years', label: '4 Jahre Erfahrung', minValue: 4 },
          { type: 'rank', label: 'Meistergrad oder Ernennung' }
        ],
        careerRoutes: [
          { id: 'gen_m_exam', name: 'Meisterprüfung', type: 'exam', description: 'Anerkennung durch die Zunft.', requirementsSummary: 'Meisterstück' },
          { id: 'gen_m_soc', name: 'Ernennung / Auszeichnung', type: 'social_recognition', description: 'Ernennung durch Vorgesetzte oder Rat.', requirementsSummary: 'Besondere Verdienste' }
        ],
        suggestedCompetencies: ['Betriebsleitung', 'Meisterwerke', 'Lehrlingsausbildung'],
        possibleRanks: ['Meister', 'Zunftmeister', 'Oberleiter']
      }
    ]
  };
}

/**
 * Returns the complete ProfessionTreeField for a given fieldId.
 */
export function getProfessionTreeForField(fieldId: string, fieldName?: string): ProfessionTreeField {
  if (PROFESSION_TREES[fieldId]) {
    return PROFESSION_TREES[fieldId];
  }
  return generateGenericTreeForField(fieldId, fieldName || fieldId);
}

/**
 * Finds a specific node in all available trees.
 */
export function findTreeNodeByNameOrId(term: string, fieldId?: string): ProfessionTreeNode | undefined {
  if (!term) return undefined;
  const lower = term.toLowerCase().trim();

  // If fieldId is given, search that tree first
  if (fieldId && PROFESSION_TREES[fieldId]) {
    const found = PROFESSION_TREES[fieldId].nodes.find(
      n => n.id.toLowerCase() === lower || n.name.toLowerCase() === lower || n.name.toLowerCase().includes(lower)
    );
    if (found) return found;
  }

  // Search all registered trees
  for (const tree of Object.values(PROFESSION_TREES)) {
    const found = tree.nodes.find(
      n => n.id.toLowerCase() === lower || n.name.toLowerCase() === lower || n.name.toLowerCase().includes(lower)
    );
    if (found) return found;
  }

  return undefined;
}
