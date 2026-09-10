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
      },

      // GERBER / LEDERER BRANCH
      {
        id: 'gerber',
        fieldId: 'bau_handwerk',
        name: 'Gerber & Lederer',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: ['ruestleder_gerber', 'feingerber', 'saemischgerber'],
        description: 'Pflanzliche und mineralische Gerbung von Häuten zu Rüst-, Sohl- und Bekleidungsleder.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'ger_exp', name: 'Gerberhof', type: 'experience', description: 'Praxis in Gerbbottichen und Trockenböden.', requirementsSummary: 'Praxis' }],
        suggestedCompetencies: ['Leder gerben', 'Zurichten & Falzen', 'Rüstleder härten'],
        possibleRanks: ['Lohgerber', 'Gerbermeister']
      },
      {
        id: 'ruestleder_gerber',
        fieldId: 'bau_handwerk',
        name: 'Rüstleder- & Harnischgerber',
        tier: 'spezialisierung',
        specializationOf: 'gerber',
        parentIds: ['gerber'],
        childIds: ['gerbermeister'],
        description: 'Gehärtetes Leder (Cuir Bouilli), stoßfeste Schutzkragen, Schilde und Rüstungsleder.',
        prerequisites: [
          { type: 'profession', label: 'Gerber & Lederer', targetId: 'gerber' },
          { type: 'experience_years', label: '2 Jahre Gerberpraxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'rl_exp', name: 'Harnischlederpraxis', type: 'experience', description: 'Kombiniertes Wachsen und Heißhärten.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Cuir-Bouilli-Härtung', 'Schweres Rinderleder zurichten', 'Sohlleder walzen'],
        possibleRanks: ['Rüstlederer']
      },
      {
        id: 'feingerber',
        fieldId: 'bau_handwerk',
        name: 'Fein- & Weißgerber',
        tier: 'spezialisierung',
        specializationOf: 'gerber',
        parentIds: ['gerber'],
        childIds: ['gerbermeister'],
        description: 'Mineralgerbung mit Alaun für geschmeidige Handschuh-, Pergament- und Buchbinderleder.',
        prerequisites: [
          { type: 'profession', label: 'Gerber & Lederer', targetId: 'gerber' }
        ],
        careerRoutes: [
          { id: 'fg_exp', name: 'Weißgerberei', type: 'experience', description: 'Verarbeitung von Ziegen- und Kalbhäuten.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Pergament schaben', 'Alaungerbung', 'Leder färben'],
        possibleRanks: ['Weißgerber', 'Pergamentmacher']
      },
      {
        id: 'saemischgerber',
        fieldId: 'bau_handwerk',
        name: 'Sämischgerber & Wildlederer',
        tier: 'spezialisierung',
        specializationOf: 'gerber',
        parentIds: ['gerber'],
        childIds: [],
        description: 'Tran- und Fettgerbung von Hirsch-, Reh- und Gamsfellen zu samtigem, wasserabweisendem Leder.',
        prerequisites: [
          { type: 'profession', label: 'Gerber & Lederer', targetId: 'gerber' }
        ],
        careerRoutes: [
          { id: 'sg_exp', name: 'Fettgerberei', type: 'experience', description: 'Walken mit Tran und Schabetechniken.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Fettgerbung', 'Wildfelle zurichten', 'Samtleder walken'],
        possibleRanks: ['Sämischgerber']
      },
      {
        id: 'gerbermeister',
        fieldId: 'bau_handwerk',
        name: 'Zunftmeister der Gerber & Lederer',
        tier: 'meister',
        parentIds: ['ruestleder_gerber', 'feingerber'],
        childIds: [],
        description: 'Oberaufsicht über Gerbereien, Gerbbrühen-Reinheit, Wasserrechte und Luxuslederfertigung.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Erfahrung', minValue: 5 },
          { type: 'rank', label: 'Meistergrad' }
        ],
        careerRoutes: [
          { id: 'gm_exam', name: 'Gerbermeisterstück', type: 'exam', description: 'Herstellung makellosen Meisterleders.', requirementsSummary: '5 Jahre Praxis + Prüfung' }
        ],
        suggestedCompetencies: ['Lohgrubenmanagement', 'Luxuslederzurichtung', 'Wasserrechtekontrolle'],
        possibleRanks: ['Obermeister', 'Zunftältester']
      },

      // SCHNEIDER / GEWANDMACHER BRANCH
      {
        id: 'schneider',
        fieldId: 'bau_handwerk',
        name: 'Schneider & Gewandmacher',
        tier: 'beruf',
        parentIds: ['handwerk_root'],
        childIds: ['harnischschneider', 'hofschneider', 'tuchmacher'],
        description: 'Zuschnitt, Nähen, Passform und Veredelung von Stoff- und Lederkleidung.',
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [{ id: 'schn_exam', name: 'Schneiderzunft', type: 'exam', description: 'Zunftnachweis für Gewandmacherei.', requirementsSummary: 'Zunftbrief' }],
        suggestedCompetencies: ['Schnittmuster erstellen', 'Handnaht', 'Gewandverzierung'],
        possibleRanks: ['Schneidergeselle', 'Gewandmeister']
      },
      {
        id: 'harnischschneider',
        fieldId: 'bau_handwerk',
        name: 'Harnisch- & Waffenschneider',
        tier: 'spezialisierung',
        specializationOf: 'schneider',
        parentIds: ['schneider'],
        childIds: ['gewandmeister'],
        description: 'Mehrlagige gesteppte Gambesons, Lederwämser, Polsterhauben und Waffenröcke.',
        prerequisites: [
          { type: 'profession', label: 'Schneider & Gewandmacher', targetId: 'schneider' },
          { type: 'experience_years', label: '2 Jahre Schneidererfahrung', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'hs_exp', name: 'Waffenschneiderei', type: 'experience', description: 'Arbeit für Kriegsknechte und Rittergefolge.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Gambeson steppen', 'Lederdopplung', 'Waffenrockpassung'],
        possibleRanks: ['Waffenschneider']
      },
      {
        id: 'hofschneider',
        fieldId: 'bau_handwerk',
        name: 'Hof- & Prachtgewandmacher',
        tier: 'spezialisierung',
        specializationOf: 'schneider',
        parentIds: ['schneider'],
        childIds: ['gewandmeister'],
        description: 'Kostbare Seidengewänder, Samtumhänge, Goldborten und edle Festkleidung.',
        prerequisites: [
          { type: 'profession', label: 'Schneider & Gewandmacher', targetId: 'schneider' }
        ],
        careerRoutes: [
          { id: 'hfs_exp', name: 'Hofschneiderei', type: 'experience', description: 'Fertigung für Edelleute und Hofgesellschaft.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Goldstickerei', 'Seidenzuschnitt', 'Plissieren'],
        possibleRanks: ['Hofschneider', 'Gewandschöpfer']
      },
      {
        id: 'tuchmacher',
        fieldId: 'bau_handwerk',
        name: 'Tuchmacher & Pelzer',
        tier: 'spezialisierung',
        specializationOf: 'schneider',
        parentIds: ['schneider'],
        childIds: [],
        description: 'Schwere Wolllodentuche, wetterfeste Reisemäntel, Futterpelze und Kappen.',
        prerequisites: [
          { type: 'profession', label: 'Schneider & Gewandmacher', targetId: 'schneider' }
        ],
        careerRoutes: [
          { id: 'tm_exp', name: 'Tuch- & Pelzpraxis', type: 'experience', description: 'Verarbeitung von Loden und Pelzwerk.', requirementsSummary: 'Praxis' }
        ],
        suggestedCompetencies: ['Loden walken', 'Pelznaht', 'Wetterfeste Trachten'],
        possibleRanks: ['Tuchmacher', 'Kürschner']
      },
      {
        id: 'gewandmeister',
        fieldId: 'bau_handwerk',
        name: 'Zunftmeister der Gewandmacher',
        tier: 'meister',
        parentIds: ['harnischschneider', 'hofschneider'],
        childIds: [],
        description: 'Oberaufsicht über die Gewandschneiderzunft, Krönungsgewänder und Schnittmeisterwerke.',
        prerequisites: [
          { type: 'experience_years', label: '5 Jahre Erfahrung', minValue: 5 },
          { type: 'rank', label: 'Meistergrad' }
        ],
        careerRoutes: [
          { id: 'gwm_exam', name: 'Meistergewand', type: 'exam', description: 'Herstellung eines maßgeschneiderten Meisterornats.', requirementsSummary: '5 Jahre Praxis + Prüfung' }
        ],
        suggestedCompetencies: ['Meisterornat entwerfen', 'Zunftordnung', 'Heraldische Gewandkunst'],
        possibleRanks: ['Obermeister', 'Gewandmeister']
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
        name: 'Magieschüler / Arkan-Novize',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['arkanist', 'elementarist', 'runenschmied_node'],
        description: 'Studium magischer Grundlagen, Manakontrolle, Formeln und arkaner Meditation.',
        prerequisites: [],
        careerRoutes: [
          { id: 'mag_init', name: 'Arkanes Initiationsritual', type: 'exam', description: 'Erweckung des inneren Manaflusses.', requirementsSummary: 'Manaprüfung' }
        ],
        suggestedCompetencies: ['Manakontrolle', 'Zauberformeln', 'Arkane Schriften'],
        possibleRanks: ['Magieschüler', 'Arkan-Novize', 'Adept']
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
        name: 'Novize / Tempelanwärter',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['kleriker', 'moench', 'schreindiener'],
        description: 'Einführung in heilige Schriften, Gebete, Tempeldienst und sakrale Reinigungsriten.',
        prerequisites: [],
        careerRoutes: [
          { id: 'rel_init', name: 'Tempelaufnahme & Gelübde', type: 'exam', description: 'Ablegen des ersten Gelübdes.', requirementsSummary: 'Gelübde' }
        ],
        suggestedCompetencies: ['Liturgie', 'Sakraltexte', 'Gebetsordnung', 'Tempeldienst'],
        possibleRanks: ['Postulant', 'Novize', 'Akoluth']
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
        name: 'Amtsanwärter / Schreibergehilfe',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['schreiber_beruf', 'steuereintreiber_beruf'],
        description: 'Kalligraphie, Aktenablage, Kopieren von Erlassen und Urkundenpflege.',
        prerequisites: [],
        careerRoutes: [
          { id: 'adm_entry', name: 'Amtsprüfung für Anwärter', type: 'exam', description: 'Eignungsprüfung im Schreiben und Rechnen.', requirementsSummary: 'Schreibprüfung' }
        ],
        suggestedCompetencies: ['Kopieren', 'Rechnen & Buchführung', 'Aktenordnung', 'Siegelwachs'],
        possibleRanks: ['Kopist', 'Schreibergehilfe', 'Amtsanwärter']
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
        name: 'Gassenjunge / Kleinkrimineller',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['dieb_beruf', 'schurke_beruf', 'kopfgeldjaeger_beruf'],
        description: 'Überleben auf der Straße, Taschentricks, Warnpfiffe und Kenntnis dunkler Hinterhöfe.',
        prerequisites: [],
        careerRoutes: [
          { id: 'ab_init', name: 'Gassenbewährung', type: 'experience', description: 'Erster geglückter Streifzug.', requirementsSummary: 'Straßenerfahrung' }
        ],
        suggestedCompetencies: ['Taschendiebstahl', 'Schleichen', 'Gassenschwatz', 'Ablenkung'],
        possibleRanks: ['Gassenläufer', 'Späher', 'Gelegenheitsdieb']
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
        name: 'Student / Scholar',
        tier: 'einstieg',
        parentIds: [],
        childIds: ['forscher_gelehrter', 'kartograph_beruf'],
        description: 'Studium der Grundlagenfächer, Bibliotheksarbeit, Exzerpieren und lateinische Quellen.',
        prerequisites: [],
        careerRoutes: [
          { id: 'acad_matric', name: 'Immatrikulation & Grundstudium', type: 'exam', description: 'Aufnahme in die Fakultät.', requirementsSummary: 'Immatrikulation' }
        ],
        suggestedCompetencies: ['Quellenstudium', 'Handschriften entziffern', 'Logik', 'Bibliotheksrecherche'],
        possibleRanks: ['Scholar', 'Forschungsassistent', 'Student']
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
  }
};

/**
 * Maps each domain to appropriate career vocabulary so that no universal "Lehrling" or "Meister" is forced where unsuited.
 */
export function getDomainCareerVocabulary(fieldId: string, fieldName: string) {
  switch (fieldId) {
    case 'adel_herrschaft':
      return {
        entryName: 'Edle Page / Hofgehilfe',
        entryRanks: ['Page', 'Junker'],
        entryDesc: 'Hofetikette, Ahnenkunde und Dienst am herzoglichen Hofe.',
        core1Name: 'Ritter & Edler',
        core1Ranks: ['Ritter', 'Edler'],
        core2Name: 'Berater & Diplomat',
        core2Ranks: ['Gefolgsmann', 'Unterhändler'],
        spec1Name: 'Taktiker & Paladin',
        spec1Ranks: ['Landvogt', 'Kommandeur'],
        apexName: 'Fürst, Herzog & Kanzler',
        apexRanks: ['Fürst', 'Herzog', 'Großkanzler'],
        promotionRouteName: 'Dynastischer Erbfolgebrief & Landeskrone',
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
        entryDesc: 'Materialauswahl von Leder, Seil, Glas und Holz.',
        core1Name: 'Gerber & Kürschner',
        core1Ranks: ['Geselle', 'Fachhandwerker'],
        core2Name: 'Glasmacher & Zimmermann',
        core2Ranks: ['Handwerksgeselle', 'Polier'],
        spec1Name: 'Meister-Wagner & Seilermeister',
        spec1Ranks: ['Altgeselle', 'Meister'],
        apexName: 'Zunftoberhaupt der Werkstoffe',
        apexRanks: ['Zunftoberhaupt', 'Obermeister'],
        promotionRouteName: 'Zunftbrief & Meisterprüfung',
        routeType: 'exam' as const
      };
    case 'luxus_spezial':
      return {
        entryName: 'Luxusgewerbe-Lehrling',
        entryRanks: ['Apprentice', 'Eleve'],
        entryDesc: 'Feingefühl für Gerüche, Edelsteine, Braukunst und Feinkost.',
        core1Name: 'Juwelier & Brauer',
        core1Ranks: ['Goldschmied', 'Braumeister'],
        core2Name: 'Koch & Florist',
        core2Ranks: ['Chef de Partie', 'Floristmeister'],
        spec1Name: 'Edelsteinschmied & Parfümeur',
        spec1Ranks: ['Maître', 'Feinparfümeur'],
        apexName: 'Großmeister des Luxusgewerbes',
        apexRanks: ['Hofjuwelier', 'Starkoch'],
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
        core2Name: 'Fischer & Bergmann',
        core2Ranks: ['Fischergeselle', 'Bergknappe'],
        spec1Name: 'Kräutersammler & Verkäufer',
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
    case 'private_gesellschaftsrollen':
      return {
        entryName: 'Schüler / Anwärter',
        entryRanks: ['Schüler', 'Junior'],
        entryDesc: 'Grundausbildung, Lernen und Erfüllung täglicher Lebensaufgaben.',
        core1Name: 'Student & Hausfrau / Hausmann',
        core1Ranks: ['Student', 'Hausvorstand'],
        core2Name: 'Gesellschaftlicher Stand',
        core2Ranks: ['Bürger', 'Standesvertreter'],
        spec1Name: 'Akademischer Anwärter & Patron',
        spec1Ranks: ['Absolvent', 'Familienoberhaupt'],
        apexName: 'Patriarch / Matriarch & Ehrengast',
        apexRanks: ['Patriarch', 'Matriarch', 'Ehrenbürger'],
        promotionRouteName: 'Anerkennung des Lebenswerks',
        routeType: 'social_recognition' as const
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

/**
 * Creates a generic fallback tree for any field using domain-appropriate vocabulary.
 */
export function generateGenericTreeForField(fieldId: string, fieldName: string): ProfessionTreeField {
  const rootId = `${fieldId}_root`;
  const vocab = getDomainCareerVocabulary(fieldId, fieldName);

  return {
    fieldId,
    fieldName,
    description: `Berufsentwicklung und Karrierepfade im Bereich ${fieldName}`,
    rootNodeId: rootId,
    nodes: [
      {
        id: rootId,
        fieldId,
        name: vocab.entryName,
        tier: 'einstieg',
        parentIds: [],
        childIds: [`${fieldId}_core_1`, `${fieldId}_core_2`],
        description: vocab.entryDesc,
        prerequisites: [],
        careerRoutes: [
          { id: 'gen_start', name: 'Grundausbildung & Dienstantritt', type: 'experience', description: 'Beginn der praktischen Tätigkeit.', requirementsSummary: 'Offener Einstieg' }
        ],
        suggestedCompetencies: [`Grundlagen von ${fieldName}`, 'Fachkunde', 'Praxisdisziplin'],
        possibleRanks: vocab.entryRanks
      },
      {
        id: `${fieldId}_core_1`,
        fieldId,
        name: vocab.core1Name,
        tier: 'beruf',
        parentIds: [rootId],
        childIds: [`${fieldId}_spec_1`, `${fieldId}_master`],
        description: `Selbstständige Ausführung aller zentralen Aufgaben im Bereich ${fieldName}.`,
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxiserfahrung', minValue: 1 }],
        careerRoutes: [
          { id: 'gen_exam1', name: 'Fachprüfung & Befähigung', type: 'exam', description: 'Nachweis selbstständiger Arbeitsfähigkeit.', requirementsSummary: '1 Jahr Praxis' }
        ],
        suggestedCompetencies: ['Hauptaufgaben', 'Praxisfertigkeit', 'Qualitätskontrolle'],
        possibleRanks: vocab.core1Ranks
      },
      {
        id: `${fieldId}_core_2`,
        fieldId,
        name: vocab.core2Name,
        tier: 'beruf',
        parentIds: [rootId],
        childIds: [`${fieldId}_spec_1`],
        description: `Praktischer Tätigkeitszweig mit breitem Praxiswissen in ${fieldName}.`,
        prerequisites: [{ type: 'experience_years', label: '1 Jahr Praxis', minValue: 1 }],
        careerRoutes: [
          { id: 'gen_exp2', name: 'Praxisweg im Einsatz', type: 'experience', description: 'Tägliche praktische Arbeit.', requirementsSummary: 'Praxisbewährung' }
        ],
        suggestedCompetencies: ['Assistenztätigkeit', 'Arbeitsorganisation'],
        possibleRanks: vocab.core2Ranks
      },
      {
        id: `${fieldId}_spec_1`,
        fieldId,
        name: vocab.spec1Name,
        tier: 'spezialisierung',
        parentIds: [`${fieldId}_core_1`, `${fieldId}_core_2`],
        childIds: [`${fieldId}_master`],
        description: `Vertiefte Spezialisierung auf anspruchsvolle Sonderaufgaben und besondere Verfahren.`,
        prerequisites: [
          { type: 'experience_years', label: '2 Jahre Fachpraxis', minValue: 2 }
        ],
        careerRoutes: [
          { id: 'gen_spec', name: 'Fachvertiefung', type: 'experience', description: 'Spezialisierung im Einsatz.', requirementsSummary: '2 Jahre Praxis' }
        ],
        suggestedCompetencies: ['Spezialtechnik', 'Schwierige Aufträge', 'Methodenvertiefung'],
        possibleRanks: vocab.spec1Ranks
      },
      {
        id: `${fieldId}_master`,
        fieldId,
        name: vocab.apexName,
        tier: 'meister',
        parentIds: [`${fieldId}_spec_1`, `${fieldId}_core_1`],
        childIds: [],
        description: `Höchste Stufe fachlicher und leitender Reife im Bereich ${fieldName}.`,
        prerequisites: [
          { type: 'experience_years', label: '4 Jahre Erfahrung', minValue: 4 },
          { type: 'rank', label: 'Höhere Befähigung oder Ernennung' }
        ],
        careerRoutes: [
          { id: 'gen_m_route', name: vocab.promotionRouteName, type: vocab.routeType, description: 'Anerkennung durch Kollegium, Orden oder Landesherrn.', requirementsSummary: 'Meisterschaft' }
        ],
        suggestedCompetencies: ['Gesamtleitung', 'Ausbildungsbefugnis', 'Meisterwerke & Strategie'],
        possibleRanks: vocab.apexRanks
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
