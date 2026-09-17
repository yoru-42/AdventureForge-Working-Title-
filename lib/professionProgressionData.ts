import { ProfessionTreeNode, ProfessionNodeTier, ProfessionNodeType, ProfessionPrerequisite } from './professionTreeData';
import { JOB_CATEGORIES } from '../components/jobPresets';
import { getTierCompetencySetForJob } from './professionTierCompetenciesData';

export interface ProfessionRankStep {
  idSuffix: string;
  name: string;
  tier: ProfessionNodeTier;
  nodeType?: ProfessionNodeType;
  rankOrder: number; // 0 = Ausbildung/Lehrling, 1 = Basisberuf, 2 = Spezialisierung/Fachberuf, 3 = Meister/Leitung
  rankTitle: string;
  description: string;
  suggestedCompetencies: string[];
  possibleRanks: string[];
  requiredExperienceYears?: number;
  prerequisiteJobName?: string;
  prerequisites?: ProfessionPrerequisite[];
  crossBranchRequirements?: {
    fieldId: string;
    fieldName: string;
    competencyName?: string;
    professionName?: string;
  }[];
  nextRankName?: string;
  positionTitle?: string;
}

export interface ProfessionBranchProgression {
  branchKey: string;
  branchName: string;
  category: string;
  description: string;
  ranks: ProfessionRankStep[];
}

/**
 * Handcrafted, richly defined profession progressions with promotions and specializations.
 */
export const DETAILED_PROFESSION_PROGRESSIONS: Record<string, ProfessionBranchProgression> = {
  // ===========================================================================
  // METALLURGIE, SCHMIEDEKUNST & WAFFEN (metall_waffen)
  // ===========================================================================
  schmied: {
    branchKey: 'schmied',
    branchName: 'Schmied',
    category: 'Schmied',
    description: 'Traditionelle Formung von Eisen, Bronze und Stahl am glühenden Amboss.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Schmiedejunge',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Grundausbildung',
        description: 'Einstieg in das Schmiedehandwerk: Esse schüren, Blasebalg bedienen und Eisen zuschlagen.',
        suggestedCompetencies: ['Esse regulieren', 'Blasebalgführung', 'Zuschlaghammer führen', 'Werkstoffkunde Metall'],
        possibleRanks: ['Schmiedejunge', 'Essegehilfe', 'Ambossanwärter'],
        nextRankName: 'Schmied'
      },
      {
        idSuffix: 'geselle',
        name: 'Schmied',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Selbstständiges Schmieden von Werkzeugen, Hufeisen, Beschlägen und Alltagsgeräten.',
        suggestedCompetencies: ['Ambossführung', 'Härten & Anlassen', 'Feuerverschweißung', 'Beschlagfertigung'],
        possibleRanks: ['Schmiedegeselle', 'Grobschmied', 'Hufschmied', 'Blechschmied', 'Kupferschmied'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Schmiedejunge',
        nextRankName: 'Waffenschmied'
      },
      {
        idSuffix: 'waffenschmied',
        name: 'Waffenschmied',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Fertigung von Klingen, Lanzen, Hellebarden, Äxten und Streitkolben für Krieger und Heere.',
        suggestedCompetencies: ['Klingen schmieden', 'Damaszenerfaltung', 'Waffenhärtung', 'Schneidengeometrie'],
        possibleRanks: ['Klingenschmied', 'Waffenschmied', 'Klingenschleifer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Schmied',
        nextRankName: 'Meisterschmied'
      },
      {
        idSuffix: 'ruestungsschmied',
        name: 'Rüstungsschmied',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Treiben von Schutzplatten, Schilden, Helmen und maßgeschneiderten Plattenharnischen.',
        suggestedCompetencies: ['Blechtreiben', 'Harnischpassung', 'Visierbau', 'Gelenkverbindungen'],
        possibleRanks: ['Plattner', 'Harnischmacher', 'Panzerschmied', 'Kettenmacher'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Schmied',
        nextRankName: 'Meisterschmied'
      },
      {
        idSuffix: 'werkzeugmacher',
        name: 'Werkzeugmacher & Nagelschmied',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Präzisionsfertigung gehärteter Werkzeuge, Zangen, Meißel, Kessel, Drähte und Baunägel.',
        suggestedCompetencies: ['Werkzeugstähle', 'Drahtziehen', 'Kesselbau', 'Punzen & Meißel'],
        possibleRanks: ['Werkzeugmacher', 'Kesselschmied', 'Nagelschmied', 'Drahtzieher'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Schmied',
        nextRankName: 'Meisterschmied'
      },
      {
        idSuffix: 'runenschmied',
        name: 'Runenschmied & Artefaktschmied',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Magische Metallurgie & Artefakte',
        description: 'Schmieden magischer Metalle wie Mithril oder Sterneneisen, Einbinden von Runen und arkaner Glut.',
        suggestedCompetencies: ['Mithrilschmieden', 'Runengravur in Stahl', 'Arkanbindung', 'Sterneneisen'],
        possibleRanks: ['Runenschmied', 'Artefaktschmied', 'Sternenschmied'],
        requiredExperienceYears: 3,
        prerequisiteJobName: 'Waffenschmied',
        nextRankName: 'Meisterschmied'
      },
      {
        idSuffix: 'meisterschmied',
        name: 'Meisterschmied',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Höchste zünftige Meisterschaft in Metallverarbeitung, Legierungskunst und Damaszenerstahl.',
        suggestedCompetencies: ['Meisterstückfertigung', 'Metallurgische Meisterschaft', 'Prüfsiegelvergabe', 'Zunftführung'],
        possibleRanks: ['Schmiedemeister', 'Zunftobermeister', 'Hofschmied', 'Großplattner'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Waffenschmied'
      },
      {
        idSuffix: 'schwertschmied',
        name: 'Schwertschmied',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Meisterliche Fertigung vollendeter Schwerter, zeremonieller Prunkwaffen und Klingenbalancierung.',
        suggestedCompetencies: ['Klingenbalancierung', 'Damaszener-Faltkunst', 'Meisterklinge', 'Klingengravur'],
        possibleRanks: ['Schwertmeister', 'Klingengroßmeister', 'Hofschwertschmied', 'Meister-Artefaktschmied'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Waffenschmied'
      }
    ]
  },

  goldschmied: {
    branchKey: 'goldschmied',
    branchName: 'Goldschmied',
    category: 'Goldschmied',
    description: 'Veredelung von Gold, Silber, Platin und Fassung kostbarer Edelsteine zu erlesenem Schmuck.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Probierbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Edelmetallgehilfe',
        description: 'Probierstein bedienen, Schmelztiegel reinigen, Draht walzen und Sägeblätter einspannen.',
        suggestedCompetencies: ['Probiersteinkunde', 'Edelmetallschmelze', 'Feilen & Sägen', 'Lötpaste ansetzen'],
        possibleRanks: ['Probierbursche', 'Goldschmiedelehrling', 'Polierbursche'],
        nextRankName: 'Goldschmied'
      },
      {
        idSuffix: 'geselle',
        name: 'Goldschmied',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Anfertigung von Ringen, Ketten, Broschen, Medaillons und kunstvollem Tafelsilber.',
        suggestedCompetencies: ['Feinlöten', 'Goldlegierungen', 'Silberschmiedearbeiten', 'Oberflächenpolitur'],
        possibleRanks: ['Goldschmied', 'Silberschmied', 'Feinschmied'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Probierbursche',
        nextRankName: 'Juwelier'
      },
      {
        idSuffix: 'juwelier',
        name: 'Juwelier & Edelsteinschleifer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Edelsteinfassung',
        description: 'Präzisionsfassung von Rubinen, Diamanten und Saphiren sowie Facettenschliff und Gemmologie.',
        suggestedCompetencies: ['Krappen- & Zargenfassung', 'Facettenschliff', 'Edelsteinbewertung', 'Mikrooptik'],
        possibleRanks: ['Juwelier', 'Edelsteinschleifer', 'Gemmologe'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Goldschmied',
        nextRankName: 'Goldschmiedemeister'
      },
      {
        idSuffix: 'graveur',
        name: 'Graveur & Feinziseleur',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Feinvergoldung',
        description: 'Gravur von Siegelringen, Wappen, Monogrammen, Feinziselierungen und filigranen Gürtlerarbeiten.',
        suggestedCompetencies: ['Stichelführung', 'Wappengravur', 'Ziselierkunst', 'Gürtlerarbeiten & Beschläge'],
        possibleRanks: ['Graveur', 'Ziseleur', 'Gürtler', 'Siegelstecher'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Goldschmied',
        nextRankName: 'Goldschmiedemeister'
      },
      {
        idSuffix: 'goldschmiedemeister',
        name: 'Goldschmiedemeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Höchste zünftige Meisterschaft in Geschmeide, Kronjuwelen, Hofinsignien und Münzstempelung.',
        suggestedCompetencies: ['Kronjuwelenfertigung', 'Insignienbau', 'Zunftoberprüfung', 'Hofgoldschmiede'],
        possibleRanks: ['Goldschmiedemeister', 'Hofjuwelier', 'Kronjuwelenmeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Juwelier & Edelsteinschleifer'
      }
    ]
  },

  mechaniker: {
    branchKey: 'mechaniker',
    branchName: 'Mechaniker',
    category: 'Mechaniker',
    description: 'Entwicklung und Reparatur von Getrieben, Federn, Hebeln, Winden und Präzisionsantrieben.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Werkstattbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Werkstattgehilfe',
        description: 'Grundausbildung in Zahnradgeometrie, Schmiermitteln, Feilenführung und Passungen.',
        suggestedCompetencies: ['Zahnräder entgraten', 'Werkzeugpflege', 'Gewindeschneiden', 'Werkbankkunde'],
        possibleRanks: ['Werkstattjunge', 'Getriebegehilfe', 'Feilbursche'],
        nextRankName: 'Mechaniker'
      },
      {
        idSuffix: 'geselle',
        name: 'Mechaniker',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Bau und Instandhaltung mechanischer Apparate, Winden, Flaschenzüge, Schlösser und Wasserradantriebe.',
        suggestedCompetencies: ['Getriebebau', 'Hebelgesetze', 'Federspannung', 'Schloss- & Beschlagmontage'],
        possibleRanks: ['Mechanikergeselle', 'Schlosser', 'Getriebetechniker', 'Maschinist'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Werkstattbursche',
        nextRankName: 'Feinmechaniker / Uhrmacher'
      },
      {
        idSuffix: 'feinmechaniker',
        name: 'Feinmechaniker & Uhrmacher',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Fertigung kleinster Zahnräder, Chronometer, Taschenuhren, Navigationsinstrumente und Messgeräte.',
        suggestedCompetencies: ['Mikrogetriebe', 'Unruh & Spiralfeder', 'Uhrwerkhemmung', 'Präzisionsjustierung'],
        possibleRanks: ['Feinmechaniker', 'Uhrmacher', 'Chronometrist'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Mechaniker',
        nextRankName: 'Meistermechaniker'
      },
      {
        idSuffix: 'schlosser_tresor',
        name: 'Kunstschlosser & Tresortechniker',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Sicherheitsmechanik & Schließwerke',
        description: 'Konstruktion diebstahlsicherer Geheimmechanismen, Kombinationsschlösser, Panzerriegel und Tresorgewölbe.',
        suggestedCompetencies: ['Kombinationsschlösser', 'Panzerriegelbau', 'Geheimmechanismen', 'Tresorprüfung'],
        possibleRanks: ['Kunstschlosser', 'Tresorbauer', 'Sicherheitsschlosser'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Mechaniker',
        nextRankName: 'Meistermechaniker'
      },
      {
        idSuffix: 'belagerungsmechaniker',
        name: 'Belagerungsmechaniker',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Konstruktion schwerer Wurfmaschinen, Katapulte, Ballisten, Hebewerke und Rammböcke.',
        suggestedCompetencies: ['Torsionsmechanik', 'Seilzugwinden', 'Belagerungsmaschinen', 'Feldreparatur'],
        possibleRanks: ['Belagerungszeugwart', 'Artilleriemechaniker', 'Geschützmeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Mechaniker',
        nextRankName: 'Meistermechaniker'
      },
      {
        idSuffix: 'meistermechaniker',
        name: 'Meistermechaniker',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Vollendeter Ingenieur und Erfinder monumentaler Getriebe, Automaten, Hofchronometer und Hebevorrichtungen.',
        suggestedCompetencies: ['Automatenkonstruktion', 'Ingenieurmathematik', 'Meisterwerk', 'Hydraulik & Winden'],
        possibleRanks: ['Oberingenieur', 'Mechanicus', 'Meistermechaniker', 'Hofuhrmachermeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Feinmechaniker & Uhrmacher'
      }
    ]
  },

  instrumentenbauer: {
    branchKey: 'instrumentenbauer',
    branchName: 'Instrumentenbauer',
    category: 'Instrumentenbauer',
    description: 'Bau, Stimmung und akustische Veredelung von Saiten-, Tasten-, Blas- und Schlaginstrumenten.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Klangschüler',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Klangschüler',
        description: 'Lernen der Holztrocknung, Resonanzkunde, Leimzubereitung und ersten Saitenspannungen.',
        suggestedCompetencies: ['Resonanzhölzer zurichten', 'Knochenleim bereiten', 'Werkbankpflege', 'Gehörbildung'],
        possibleRanks: ['Klangschüler', 'Holzschnitzerlehrling', 'Saitenwickler'],
        nextRankName: 'Instrumentenbauer'
      },
      {
        idSuffix: 'geselle',
        name: 'Instrumentenbauer',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Fertigung von Flöten, Lauten, Trommeln und Kitharas nach traditionellen Maßverhältnissen.',
        suggestedCompetencies: ['Klangkörperbau', 'Feinstimmung', 'Bundierung & Stegbau', 'Lackierung'],
        possibleRanks: ['Instrumentenbauergeselle', 'Klangmacher'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Klangschüler',
        nextRankName: 'Geigenbauer'
      },
      {
        idSuffix: 'geigenbauer',
        name: 'Geigenbauer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Triebfeder vollendeter Saiteninstrumente: Geigen, Bratschen, Celli, Lauten und Harfen.',
        suggestedCompetencies: ['Wölbung hobeln', 'Stimmstock setzen', 'Resonanzstimmung', 'Saitenspannung'],
        possibleRanks: ['Lautenmacher', 'Geigenbauer', 'Saiteninstrumentenmacher'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Instrumentenbauer',
        nextRankName: 'Klangbaumeister'
      },
      {
        idSuffix: 'orgelbauer',
        name: 'Orgelbauer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Konstruktion von Kirchenorgeln, Pfeifenwerken, Windladen und feinsten Blech- und Holzblasinstrumenten.',
        suggestedCompetencies: ['Pfeifenintonation', 'Windladenbau', 'Ventilmechanik', 'Akustikberechnung'],
        possibleRanks: ['Orgelbauer', 'Pfeifenmacher', 'Blasinstrumentenbauer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Instrumentenbauer',
        nextRankName: 'Klangbaumeister'
      },
      {
        idSuffix: 'klangbaumeister',
        name: 'Klangbaumeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Meisterliche Vollendung legendärer Meisterinstrumente für Fürstenhöfe und Kathedralen.',
        suggestedCompetencies: ['Konzertinstrumente fertigen', 'Akustische Perfektion', 'Resonanzmeisterung', 'Zunftabnahme'],
        possibleRanks: ['Klangbaumeister', 'Hofinstrumentenmacher', 'Meisterluthier'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Geigenbauer'
      }
    ]
  },

  schlosser: {
    branchKey: 'schlosser',
    branchName: 'Schlosser',
    category: 'Schlosser',
    description: 'Fertigung von Schließmechanismen, Gittern, Beschlägen und Tresorvorrichtungen.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Schlosserjunge',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Feilbursche',
        description: 'Feilen, Richten und Entgraten von Blechen und Rohlingen.',
        suggestedCompetencies: ['Feiltechnik', 'Bohren & Senken', 'Blechzuschnitt', 'Grundmechanik'],
        possibleRanks: ['Schlosserjunge', 'Feilbursche', 'Gehilfe'],
        nextRankName: 'Schlosser'
      },
      {
        idSuffix: 'geselle',
        name: 'Schlosser',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Herstellung von Buntbartschlössern, Türbeschlägen und stabilen Riegeln.',
        suggestedCompetencies: ['Schlossmontage', 'Schlüssel feilen', 'Zuhaltungssysteme', 'Gitterbau'],
        possibleRanks: ['Schlossergeselle', 'Bauschlosser'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Schlosserjunge',
        nextRankName: 'Kunstschmied'
      },
      {
        idSuffix: 'kunstschmied',
        name: 'Kunstschmied',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Filigrane Torbögen, historische Verzierungen und kunstvolle Beschläge.',
        suggestedCompetencies: ['Ziergitterbiegen', 'Treibarbeit Eisen', 'Schmiedekunstverzierung', 'Feuervergoldung'],
        possibleRanks: ['Kunstschlosser', 'Zierschmied'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Schlosser',
        nextRankName: 'Schlossermeister'
      },
      {
        idSuffix: 'tresorbauer',
        name: 'Tresortechniker',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Komplexe Zahlenschlösser, Geheimkammern und diebstahlsichere Tresorgewölbe.',
        suggestedCompetencies: ['Kombinationsschlösser', 'Panzerriegelbau', 'Geheimmechanismen', 'Tresorprüfung'],
        possibleRanks: ['Tresorschlosser', 'Sicherheitsschlosser'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Schlosser',
        nextRankName: 'Schlossermeister'
      },
      {
        idSuffix: 'schlossermeister',
        name: 'Schlossermeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Oberste zünftige Schließmeisterprüfung und Konstruktion uneinnehmbarer Tore.',
        suggestedCompetencies: ['Meisterschlosskonstruktion', 'Sicherheitsberatung', 'Zunftabnahme', 'Werkstattleitung'],
        possibleRanks: ['Schlossermeister', 'Zunftobermeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Tresortechniker'
      }
    ]
  },

  giesser: {
    branchKey: 'giesser',
    branchName: 'Gießer',
    category: 'Gießer',
    description: 'Schmelzen und Gießen von Bronze, Messing, Zinn, Eisen und Glockenbronze in Formen.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Schmelzergehilfe',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Tiegelbursche',
        description: 'Formsand aufbereiten, Tiegel heizen, Gussformen vorbereiten und Schmelzöfen reinigen.',
        suggestedCompetencies: ['Formsand mischen', 'Schmelzofen pflegen', 'Tiegelhandhabung', 'Hitzeschutz'],
        possibleRanks: ['Gießerjunge', 'Tiegelbursche', 'Schmelzergehilfe'],
        nextRankName: 'Bronzegießer'
      },
      {
        idSuffix: 'geselle',
        name: 'Gießer',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Selbstständiges Gießen von Statuetten, Beschlägen, Töpfen, Zinnkannen und Geschirr.',
        suggestedCompetencies: ['Formkastenbau', 'Schmelzführung Bronze', 'Gussreinigung', 'Ziselieren'],
        possibleRanks: ['Gussgeselle', 'Bronzegießer', 'Zinngießer', 'Messingschmied', 'Gelbgießer'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Schmelzergehilfe',
        nextRankName: 'Glockengießer'
      },
      {
        idSuffix: 'glockengiesser',
        name: 'Glockengießer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Glockenkunst',
        description: 'Präziser Guss tonreiner Kirchenglocken und monumentaler Klangkörper.',
        suggestedCompetencies: ['Glockenrippe berechnen', 'Klangstimmung Glocke', 'Lehmformverfahren', 'Großschmelze'],
        possibleRanks: ['Glockengießer', 'Klanggießer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Gießer',
        nextRankName: 'Meistergießer'
      },
      {
        idSuffix: 'kanonengiesser',
        name: 'Geschützgießer & Stückgießer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Artillerieguss',
        description: 'Gießen dickwandiger Geschütze, Mörser und Artillerierohre aus schwerer Bronze und Gusseisen.',
        suggestedCompetencies: ['Kanonenguss', 'Kernbohrung', 'Druckfestigkeitsprüfung', 'Hohlformguss'],
        possibleRanks: ['Geschützgießer', 'Zeuggießer', 'Stückgießer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Gießer',
        nextRankName: 'Meistergießer'
      },
      {
        idSuffix: 'kunstgiesser',
        name: 'Kunstgießer & Statuenformer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Wachsausschmelzguss',
        description: 'Monumentale Bronzeplastiken, Zunftreliefs und detailreiche Kunstwerke im Wachsausschmelzverfahren.',
        suggestedCompetencies: ['Wachsausschmelzverfahren', 'Cire-perdue-Guss', 'Ziselierung', 'Patina & Polieren'],
        possibleRanks: ['Kunstgießer', 'Statuengießer', 'Formstecher'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Gießer',
        nextRankName: 'Meistergießer'
      },
      {
        idSuffix: 'meistergiesser',
        name: 'Meistergießer',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Höchste zünftige Meisterschaft in Großguss, Statuenguss, Artillerie und Glockenintonation.',
        suggestedCompetencies: ['Monumentalguss', 'Metallurgische Meisterung', 'Zunftleitung', 'Gussfehlervermeidung'],
        possibleRanks: ['Gießermeister', 'Hofgießer', 'Oberstgießer'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Glockengießer'
      }
    ]
  },

  // ===========================================================================
  // LEBENSMITTEL, BRAUWESEN & GASTRONOMIE (lebensmittel_ernaehrung)
  // ===========================================================================
  koch: {
    branchKey: 'koch',
    branchName: 'Koch',
    category: 'Koch',
    description: 'Zubereitung warmer Speisen, Saucen, Menüs und Festtafeln.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Küchenjunge',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Grundpraxis',
        description: 'Gemüse putzen, Fleisch parieren, Feuer im Herd schüren und Küchenhygiene.',
        suggestedCompetencies: ['Mise en place', 'Messerführung', 'Herdfeuerregulierung', 'Küchenhygiene'],
        possibleRanks: ['Küchenjunge', 'Küchenmädchen', 'Küchengehilfe'],
        nextRankName: 'Koch'
      },
      {
        idSuffix: 'schuerzenbursche',
        name: 'Schürzenbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Küchenhilfe',
        description: 'Küchenabwasch, Vorratsbeförderung, Zutatenwiegen und Tischabräumen.',
        suggestedCompetencies: ['Küchenreinigung', 'Zutatenlagerung', 'Topfpflege', 'Feuerunterhaltung'],
        possibleRanks: ['Schürzenbursche', 'Schürzenmagd', 'Topfwäscher'],
        nextRankName: 'Koch'
      },
      {
        idSuffix: 'geselle',
        name: 'Koch',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Zubereitung vollwertiger Gerichte, Suppen, Eintöpfe und Schankhausmahlzeiten.',
        suggestedCompetencies: ['Grundzubereitung', 'Braten & Schmoren', 'Suppen & Saucen', 'Kräuterkunde'],
        possibleRanks: ['Kochgeselle', 'Gasthauskoch', 'Postenkoch'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Küchenjunge',
        nextRankName: 'Gourmetkoch'
      },
      {
        idSuffix: 'gourmetkoch',
        name: 'Gourmetkoch',
        tier: 'spezialisierung',
        rankOrder: 2,
        nodeType: 'specialization',
        rankTitle: 'Beförderung & Gourmetküche',
        description: 'Erlesene Menüs, feine Speisenabfolgen und Festtagsgerichte für Adlige und Gildenbankette.',
        suggestedCompetencies: ['Festmenü-Konzeption', 'Edle Gewürze', 'Fleischreifung', 'Gourmetpräsentation'],
        possibleRanks: ['Chef de Partie', 'Festkoch', 'Gourmetkoch'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Koch',
        nextRankName: 'Hofküchenmeister'
      },
      {
        idSuffix: 'saucenkoch',
        name: 'Saucenkoch',
        tier: 'spezialisierung',
        rankOrder: 2,
        nodeType: 'specialization',
        rankTitle: 'Spezialisierung / Saucier',
        description: 'Zubereitung meisterhafter Bratensäfte, Fonds, Reduktionen, Buttersaucen und feiner Vinaigrettes.',
        suggestedCompetencies: ['Saucenreduktion', 'Fondherstellung', 'Gewürzbalance', 'Emulgiertechnik'],
        possibleRanks: ['Saucier', 'Saucenkoch', 'Brühenmeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Koch',
        nextRankName: 'Hofküchenmeister'
      },
      {
        idSuffix: 'feldkoch',
        name: 'Feldkoch',
        tier: 'spezialisierung',
        rankOrder: 2,
        nodeType: 'specialization',
        rankTitle: 'Spezialisierung / Feldküche',
        description: 'Verpflegung von Karawanen, Heeren und Wanderlagern unter freiem Himmel.',
        suggestedCompetencies: ['Rationswirtschaft', 'Kesselkochen', 'Proviantlagerung', 'Feuerstellenbau'],
        possibleRanks: ['Feldkoch', 'Quartiermeister-Koch', 'Trosskoch'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Koch',
        nextRankName: 'Hofküchenmeister'
      },
      {
        idSuffix: 'grosskuechenkoch',
        name: 'Großküchenkoch',
        tier: 'spezialisierung',
        rankOrder: 2,
        nodeType: 'specialization',
        rankTitle: 'Spezialisierung / Großverpflegung',
        description: 'Planung und Koordination der Essensausgabe für Festgesellschaften, Gilden, Spitäler und Kasernen.',
        suggestedCompetencies: ['Mengenberechnung', 'Großkesselbetrieb', 'Vorratseinteilung', 'Ausgabelogistik'],
        possibleRanks: ['Großküchenkoch', 'Speisesaalkoch', 'Kantinenkoch'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Koch',
        nextRankName: 'Küchendirektor'
      },
      {
        idSuffix: 'schiffskoch',
        name: 'Schiffskoch (Smutje)',
        tier: 'spezialisierung',
        rankOrder: 2,
        nodeType: 'specialization',
        rankTitle: 'Spezialisierung / Bordküche',
        description: 'Zubereitung von Mahlzeiten unter widrigen Bedingungen auf See, Verwaltung des Schiffsproviants und Schutz vor Skorbut.',
        suggestedCompetencies: ['Pökeln & Konservieren', 'Kochen bei Seegang', 'Rationsrationierung', 'Ernährungsmedizin (Skorbut)'],
        possibleRanks: ['Schiffskoch', 'Smutje', 'Bordkoch'],
        requiredExperienceYears: 2,
        prerequisites: [
          { type: 'profession', label: 'Koch', targetId: 'Koch', required: true },
          { type: 'competence', label: 'Vorratshaltung & Lagerverwaltung', targetId: 'Vorratshaltung', minValue: 30, required: true },
          { type: 'competence', label: 'Lebensmittelkonservierung (Pökeln/Räuchern)', targetId: 'Konservierung', minValue: 30, required: true },
          { type: 'competence', label: 'Seemannschaft & Segelbedienung', targetId: 'Seemannschaft', targetFieldId: 'seefahrt', targetFieldName: 'Seefahrt', minValue: 30, required: true },
          { type: 'competence', label: 'Schiffssicherheit & Havarieschutz', targetId: 'Schiffssicherheit', targetFieldId: 'seefahrt', targetFieldName: 'Seefahrt', minValue: 30, required: true },
          { type: 'competence', label: 'Bordpraxis & Seetauglichkeit', targetId: 'Bordpraxis', targetFieldId: 'seefahrt', targetFieldName: 'Seefahrt', minValue: 30, required: true }
        ],
        nextRankName: 'Hofküchenmeister'
      },
      {
        idSuffix: 'hofkuechenmeister',
        name: 'Hofküchenmeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe / Palastküche',
        description: 'Leiter fürstlicher Palastküchen, Zeremonienbankette und kulinarischer Großveranstaltungen.',
        suggestedCompetencies: ['Küchenmeisterei', 'Bankettinszenierung', 'Gourmetkuration', 'Palastverpflegung'],
        possibleRanks: ['Hofküchenchef', 'Chef de Cuisine', 'Küchenmeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Gourmetkoch'
      },
      {
        idSuffix: 'kuechendirektor',
        name: 'Küchendirektor',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe / Gastronomieleitung',
        description: 'Kaufmännische und organisatorische Gesamtleitung großer Residenz- und Festküchenbetriebe.',
        suggestedCompetencies: ['Gastronomiemanagement', 'Großeinkauf', 'Personaldelegation', 'Qualitätskontrolle'],
        possibleRanks: ['Küchendirektor', 'Oberküchenmeister', 'Gastronomiedirektor'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Großküchenkoch'
      }
    ]
  },

  baecker: {
    branchKey: 'baecker',
    branchName: 'Bäcker',
    category: 'Bäcker',
    description: 'Handwerkliche Herstellung von Broten, Sauerteigen, Gebäcken und feinen Torten.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Bäckerjunge',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Bäckerjunge',
        description: 'Mehlsiebung, Ofenreinigung, Anfeuern des Backofens und Teigkneten.',
        suggestedCompetencies: ['Mehlkunde', 'Teigkneten', 'Backofen heizen', 'Zutaten wiegen'],
        possibleRanks: ['Bäckerjunge', 'Teigkneter', 'Backgehilfe'],
        nextRankName: 'Bäcker'
      },
      {
        idSuffix: 'geselle',
        name: 'Bäcker',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Selbstständiges Backen von Broten, Semmeln, Fladen und traditionellem Sauerteigbrot.',
        suggestedCompetencies: ['Sauerteigführung', 'Gärzeitenüberwachung', 'Backofentemperatur', 'Formgebung'],
        possibleRanks: ['Bäckergeselle', 'Brotbäcker'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Bäckerjunge',
        nextRankName: 'Konditor'
      },
      {
        idSuffix: 'konditor',
        name: 'Konditor',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Herstellung von Marzipan, Festtorten, Fruchttörtchen, Pralinen und feinstem Gebäck.',
        suggestedCompetencies: ['Zuckerguß & Glasur', 'Marzipan modellieren', 'Cremefüllungen', 'Tortenarchitektur'],
        possibleRanks: ['Zuckerbäcker', 'Feinkonditor', 'Patissier'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Bäcker',
        nextRankName: 'Bäckermeister'
      },
      {
        idSuffix: 'baeckermeister',
        name: 'Bäckermeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Leitung einer Zunftbäckerei, Entwicklung von Spezialrezepturen und Lehrlingsausbildung.',
        suggestedCompetencies: ['Rezepturentwicklung', 'Zunftprüfung', 'Backhausleitung', 'Rohstoffbeschaffung'],
        possibleRanks: ['Bäckermeister', 'Zunftbäcker', 'Obermeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Konditor'
      }
    ]
  },

  brauer: {
    branchKey: 'brauer',
    branchName: 'Brauer',
    category: 'Brauer',
    description: 'Brauen von Bier, Met, Ale und Mälzen von Getreide.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Braubursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Braubursche',
        description: 'Fassreinigung, Maische rühren, Darren überwachen und Kessel anheizen.',
        suggestedCompetencies: ['Fässer pechen', 'Sudkessel heizen', 'Getreide reinigen', 'Wasserqualität prüfen'],
        possibleRanks: ['Braubursche', 'Fasswäscher', 'Mälzergehilfe'],
        nextRankName: 'Brauer'
      },
      {
        idSuffix: 'geselle',
        name: 'Brauer',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Mälzen, Maischen, Kochen von Würze und Gärungsüberwachung im Schankbrauhaus.',
        suggestedCompetencies: ['Maischeführung', 'Hopfengabe', 'Gärungskontrolle', 'Hefepflege'],
        possibleRanks: ['Braugeselle', 'Sudgeselle', 'Mälzer'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Braubursche',
        nextRankName: 'Kellermeister'
      },
      {
        idSuffix: 'kellermeister',
        name: 'Kellermeister',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Lagerung, Reifung in Holzfässern, Veredelung alter Ales und Qualitätsverkostung.',
        suggestedCompetencies: ['Fassreifung', 'Geschmacksprofile', 'Klärung & Lagerung', 'Schanksysteme'],
        possibleRanks: ['Kellermeister', 'Biersommelier', 'Sudmeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Brauer',
        nextRankName: 'Braumeister'
      },
      {
        idSuffix: 'braumeister',
        name: 'Braumeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Führung großer Brauhäuser und Brauzünfte, Kreation berühmter Hausmarken.',
        suggestedCompetencies: ['Großbrauereileitung', 'Braurezepturen', 'Zunftabnahme', 'Reinigungsgebotsüberwachung'],
        possibleRanks: ['Braumeister', 'Zunftbrauer', 'Hofbraumeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Kellermeister'
      }
    ]
  },

  metzger: {
    branchKey: 'metzger',
    branchName: 'Metzger',
    category: 'Metzger',
    description: 'Fachgerechtes Schlachten, Zerlegen, Veredeln und Haltbarmachen von Fleisch.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Fleischerbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Fleischerbursche',
        description: 'Reinigung des Schlachthauses, Messer schärfen, Därme putzen und Pökelbottiche füllen.',
        suggestedCompetencies: ['Messer schärfen', 'Schlachthygiene', 'Salzen & Pökeln', 'Kühlung'],
        possibleRanks: ['Fleischerbursche', 'Pökelgehilfe', 'Schlachthofjunge'],
        nextRankName: 'Metzger'
      },
      {
        idSuffix: 'geselle',
        name: 'Metzger',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Zerwirken von Rindern, Schweinen und Wild sowie Zuschnitt bester Fleischteile.',
        suggestedCompetencies: ['Zerlegetechnik', 'Knochen auslösen', 'Fleischreifung', 'Kundenzuschnitt'],
        possibleRanks: ['Fleischergeselle', 'Metzger'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Fleischerbursche',
        nextRankName: 'Wurstmacher'
      },
      {
        idSuffix: 'wurstmacher',
        name: 'Wurstmacher',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Rezepturen für Dauerwürste, Pasteten, Schinken und traditionelle Räucherverfahren.',
        suggestedCompetencies: ['Brätbereitung', 'Wurstabfüllung', 'Heiß- & Kalträuchern', 'Gewürzmischung'],
        possibleRanks: ['Wurstmacher', 'Räuchermeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Metzger',
        nextRankName: 'Metzgermeister'
      },
      {
        idSuffix: 'metzgermeister',
        name: 'Metzgermeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Leitung eines Fleischereibetriebs, Qualitätsprüfung und Zunftgutachten.',
        suggestedCompetencies: ['Fleischbeschau', 'Betriebsführung', 'Zunftvorsitz', 'Großeinkauf'],
        possibleRanks: ['Metzgermeister', 'Oberfleischer', 'Zunftmeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Wurstmacher'
      }
    ]
  },

  // ===========================================================================
  // HAUSHALT & DIENSTE (haushalt_dienste)
  // ===========================================================================
  diener: {
    branchKey: 'diener',
    branchName: 'Diener',
    category: 'Diener',
    description: 'Aufmerksame Bedienung, Gepäckaufsicht, Hausordnung und vertrauensvoller Dienst für die Herrschaft.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Laufbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Hausdienst',
        description: 'Erledigung von Besorgungen, Stiefelputzen, Botengänge und Kaminfeuer entfachen.',
        suggestedCompetencies: ['Botengänge', 'Schuh- & Kleiderpflege', 'Diskretion', 'Hausordnung'],
        possibleRanks: ['Laufbursche', 'Hauspage', 'Hausjunge'],
        nextRankName: 'Diener'
      },
      {
        idSuffix: 'geselle',
        name: 'Diener',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Herrschaftlicher Dienst',
        description: 'Persönliche Bedienung der Herrschaft, Kleiderbürsten, Gepäckannahme und Empfang von Gästen.',
        suggestedCompetencies: ['Umgangsformen', 'Tafeldecken', 'Gepäckdienst', 'Gästeempfang'],
        possibleRanks: ['Hausdiener', 'Livrierter Diener', 'Saaldiener'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Laufbursche',
        nextRankName: 'Kammerdiener'
      },
      {
        idSuffix: 'kammerdiener',
        name: 'Kammerdiener',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Vertrauensstellung & Tafelaufsicht',
        description: 'Vertrauter Leibdienst, Garderobenaufsicht, Tafelbedienung und Verwaltung persönlicher Briefe.',
        suggestedCompetencies: ['Leibdienst', 'Tafelsilberaufsicht', 'Etikette', 'Geheimhaltung'],
        possibleRanks: ['Kammerdiener', 'Valet', 'Tafelmeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Diener',
        nextRankName: 'Haushofmeister'
      },
      {
        idSuffix: 'majordomus',
        name: 'Haushofmeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Hausleitung & Residenzführung',
        description: 'Gesamtleitung des herrschaftlichen Gesindes, Inventarführung, Wirtschaftsrechnung und Bankettkoordination.',
        suggestedCompetencies: ['Gesindeaufsicht', 'Wirtschaftsbuchführung', 'Bankettorganisation', 'Residenzverwaltung'],
        possibleRanks: ['Haushofmeister', 'Majordomus', 'Kastellan'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Kammerdiener'
      }
    ]
  },

  zofe: {
    branchKey: 'zofe',
    branchName: 'Zofe',
    category: 'Zofe',
    description: 'Diskrete Unterstützung von Edeldamen: Frisuren, Garderobe, Schmuckpflege und Vertraulichkeit.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Stubenmädchen',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Gemächerpflege',
        description: 'Herrichten der Gemächer, Wäschepflege, Bügeln und Anreichen des morgendlichen Tees.',
        suggestedCompetencies: ['Wäscheglätten', 'Gemachreinigung', 'Höflichkeit', 'Pünktlichkeit'],
        possibleRanks: ['Stubenmädchen', 'Gemachgehilfin'],
        nextRankName: 'Zofe'
      },
      {
        idSuffix: 'geselle',
        name: 'Zofe',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Herrschaftlicher Damendienst',
        description: 'Ankleiden, Frisieren, Kosmetik und vertrauliche Begleitung der Dame des Hauses.',
        suggestedCompetencies: ['Frisierkunst', 'Kleideranpassung', 'Korsettschnürung', 'Verschwiegenheit'],
        possibleRanks: ['Zofe', 'Kammerzofe'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Stubenmädchen',
        nextRankName: 'Kammerjungfer'
      },
      {
        idSuffix: 'kammerjungfer',
        name: 'Kammerjungfer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Garderoben- & Toilettenaufsicht',
        description: 'Verwaltung erlesener Seidengewänder, Perlen, Ballgarderoben und privater Schatullen.',
        suggestedCompetencies: ['Garderobenverwaltung', 'Schmuckpflege', 'Ballvorbereitung', 'Feine Kosmetik'],
        possibleRanks: ['Kammerjungfer', 'Garderobiere', 'Erste Zofe'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Zofe',
        nextRankName: 'Oberhofdame'
      },
      {
        idSuffix: 'oberhofdame',
        name: 'Oberhofdame',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Residenz- & Damenpalastleitung',
        description: 'Leitung des weiblichen Hauspersonals, Repräsentation und Hofzeremoniell.',
        suggestedCompetencies: ['Hofdamenführung', 'Zeremoniell', 'Etikette-Kodex', 'Palastwirtschaft'],
        possibleRanks: ['Oberhofdame', 'Erste Hausdame', 'Hofgouvernante'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Kammerjungfer'
      }
    ]
  },

  butler: {
    branchKey: 'butler',
    branchName: 'Butler',
    category: 'Butler',
    description: 'Höchste Etikette, Weinkellerführung, Tafelsilberverwaltung und diskrete Leitung nobler Residenzen.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Unterbutler',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Saaldienst',
        description: 'Pflege des Tafelsilbers, Polieren von Gläsern und Vorbereiten der Salons.',
        suggestedCompetencies: ['Silberpolitur', 'Gläserpflege', 'Aufrechte Haltung', 'Diskretes Auftreten'],
        possibleRanks: ['Unterbutler', 'Saalbursche'],
        nextRankName: 'Butler'
      },
      {
        idSuffix: 'geselle',
        name: 'Butler',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Residenz- & Kellereidienst',
        description: 'Betreuung der Festtafel, Weinausschank, Empfang erlesener Gäste und Schlüsselgewalt.',
        suggestedCompetencies: ['Weinservice', 'Tafelprotokoll', 'Türdienst & Ankündigung', 'Schlüsselverwaltung'],
        possibleRanks: ['Butler', 'Hausverwalter'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Unterbutler',
        nextRankName: 'Chefbutler'
      },
      {
        idSuffix: 'chefbutler',
        name: 'Chefbutler',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Silberkammer & Repräsentation',
        description: 'Leitung der Diners, Weinreisekeller, Beaufsichtigung des herrschaftlichen Fuhrparks und Silberschatzes.',
        suggestedCompetencies: ['Jahrgangsweinkunde', 'Protokollarische Rangfolge', 'Silberkammervorsitz', 'VIP-Gästebetreuung'],
        possibleRanks: ['Chefbutler', 'Silberkämmerer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Butler',
        nextRankName: 'Großhofmeister'
      },
      {
        idSuffix: 'seneschall',
        name: 'Großhofmeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Oberste Schloss- & Hofleitung',
        description: 'Vollkommene Schirmherrschaft über den Palast, fürstliche Bankette und diplomatische Empfänge.',
        suggestedCompetencies: ['Seneschallamt', 'Staatsbankette', 'Oberste Etikette', 'Residenzbudget'],
        possibleRanks: ['Großhofmeister', 'Seneschall', 'Oberstkämmerer'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Chefbutler'
      }
    ]
  },

  // ===========================================================================
  // MILITÄR & SCHUTZ (militaer_streitkraefte)
  // ===========================================================================
  soldat: {
    branchKey: 'soldat',
    branchName: 'Soldat',
    category: 'Soldat',
    description: 'Disziplinierte militärische Ausbildung, Nahkampf, Formationsmarsch und Festungswache.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Rekrut',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Rekrutenausbildung',
        description: 'Exerzieren, Waffeninstandhaltung, Lagerbau und Formationsgrundlagen.',
        suggestedCompetencies: ['Waffenpflege', 'Formationsmarsch', 'Wachbereitschaft', 'Schilddeckung'],
        possibleRanks: ['Rekrut', 'Trossknecht', 'Musketieranwärter'],
        nextRankName: 'Infanterist'
      },
      {
        idSuffix: 'geselle',
        name: 'Infanterist',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Garnisons- & Felddienst',
        description: 'Gefechtseinsatz in der Phalanx, Stadtpatrouille und Wehrturmsicherung.',
        suggestedCompetencies: ['Pikenkampf', 'Schildwall', 'Nachtwache', 'Klingenführung'],
        possibleRanks: ['Infanterist', 'Landsknecht', 'Gefreiter'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Rekrut',
        nextRankName: 'Gardist'
      },
      {
        idSuffix: 'gardist',
        name: 'Gardist',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Garde & Gefechtstaktik',
        description: 'Palastgarde, persönliche Leibwacht von Kommandanten und taktische Sturmspitze.',
        suggestedCompetencies: ['Zweikampf', 'Gardeformation', 'Gefechtstaktik', 'Belagerungsabwehr'],
        possibleRanks: ['Gardist', 'Wehrmeister', 'Fähnrich'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Infanterist',
        nextRankName: 'Feldwebel'
      },
      {
        idSuffix: 'hauptmann',
        name: 'Feldwebel',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Truppenkommando & Regimentsleitung',
        description: 'Befehlshaber über Kompanien, Festungsregimenter und strategische Feldzüge.',
        suggestedCompetencies: ['Truppenführung', 'Schlachtfeldstrategie', 'Garnisonsverwaltung', 'Offizierskorps'],
        possibleRanks: ['Feldwebel', 'Hauptmann', 'Festungskommandant'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Gardist'
      }
    ]
  },

  // ===========================================================================
  // SEEFAHRT & NAVIGATION (seefahrt)
  // ===========================================================================
  seemann: {
    branchKey: 'seemann',
    branchName: 'Seemann',
    category: 'Nautik & Schifffahrt',
    description: 'Befahrung der Meere, Segelführung, Takelage, Seemannschaft und nautische Führung.',
    ranks: [
      {
        idSuffix: 'schiffsjunge',
        name: 'Schiffsjunge',
        tier: 'einstieg',
        nodeType: 'training',
        rankOrder: 0,
        rankTitle: 'Seefahrtsanwärter',
        description: 'Deck schrubben, Taue aufschießen, Segel bergen, Ausguck halten und Seemannsknoten schlagen.',
        suggestedCompetencies: ['Knotenkunde', 'Takelage klettern', 'Segelbedienung', 'Ausguckdienst'],
        possibleRanks: ['Schiffsjunge', 'Kajütenwächter', 'Leichtmatrose'],
        nextRankName: 'Matrose / Seemann'
      },
      {
        idSuffix: 'matrose',
        name: 'Matrose / Seemann',
        tier: 'beruf',
        nodeType: 'profession',
        rankOrder: 1,
        rankTitle: 'Vollmatrose & Seemann',
        description: 'Wetterfeste Schiffsbedienung, Rudergänger, Segeltrimmen und Beidrehen bei Sturm.',
        suggestedCompetencies: ['Seemannschaft', 'Ruderdienst', 'Sturmsicherung', 'Takelagereparatur'],
        possibleRanks: ['Vollmatrose', 'Bootsmannsmaat', 'Seemann'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Schiffsjunge',
        nextRankName: 'Erfahrener Seemann'
      },
      {
        idSuffix: 'erfahrener_seemann',
        name: 'Erfahrener Seemann',
        tier: 'spezialisierung',
        nodeType: 'advanced_profession',
        rankOrder: 2,
        rankTitle: 'Befahrener Seemann',
        description: 'Hochseeerprobter Seemann, Bootsmannsaufgaben, Loten bei Untiefen und Enterkampfführung.',
        suggestedCompetencies: ['Hochseenavigation', 'Bootsmannsarbeit', 'Nautisches Loten', 'Enterabwehr'],
        possibleRanks: ['Bootsmann', 'Schirrmeister', 'Altmatrose'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Matrose / Seemann',
        nextRankName: 'Steuermann'
      },
      {
        idSuffix: 'steuermann',
        name: 'Steuermann',
        tier: 'spezialisierung',
        nodeType: 'promotion',
        rankOrder: 2,
        rankTitle: 'Navigation & Schiffssteuerung',
        description: 'Kursberechnung mit Astrolabium und Kompass, Wind- und Strömungsanalyse und Wachführung.',
        suggestedCompetencies: ['Astronavigation', 'Seekartenlesen', 'Kompasspeilung', 'Wachführung auf See'],
        possibleRanks: ['Zweiter Steuermann', 'Erster Steuermann', 'Obersteuermann'],
        requiredExperienceYears: 3,
        prerequisites: [
          { type: 'profession', label: 'Matrose / Seemann', targetId: 'Matrose', required: true },
          { type: 'competence', label: 'Astronavigation & Peilung', targetId: 'Astronavigation', minValue: 50, required: true },
          { type: 'experience_years', label: '3 Jahre Seefahrtserfahrung', minValue: 3, required: true }
        ],
        nextRankName: 'Kapitän / Schiffsführer'
      },
      {
        idSuffix: 'kapitaen',
        name: 'Kapitän / Schiffsführer',
        tier: 'meister',
        nodeType: 'leadership',
        rankOrder: 3,
        rankTitle: 'Kapitän / Schiffsführer',
        description: 'Oberbefehl über Schiff und Besatzung, Schiffsgerichtsbarkeit, Routenwahl und Flottille.',
        suggestedCompetencies: ['Schiffskommando', 'Reedereiwesen', 'Seekriegsführung', 'Internationales Seerecht'],
        possibleRanks: ['Schiffskapitän', 'Flottillenkapitän', 'Kommodore'],
        positionTitle: 'Schiffskommandant / Kapitän',
        requiredExperienceYears: 5,
        prerequisiteJobName: 'Steuermann'
      }
    ]
  },

  // ===========================================================================
  // MAGIE & ARKANA (magie_arkana)
  // ===========================================================================
  magier: {
    branchKey: 'magier',
    branchName: 'Magier',
    category: 'Magier',
    description: 'Erforschung magischer Fäden, Ritualformeln, Zaubersprüche und Mana-Kanalisation.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Arkan-Novize',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Mana-Grundlagen',
        description: 'Lesen alter Folianten, Schriftrollenkopieren, Mana-Meditation und erste Funkenzauber.',
        suggestedCompetencies: ['Mana-Fokussierung', 'Runenschrift lesen', 'Kreidekreis ziehen', 'Foliantenpflege'],
        possibleRanks: ['Novize', 'Akademie-Adept', 'Schriftrollenschüler'],
        nextRankName: 'Magier'
      },
      {
        idSuffix: 'geselle',
        name: 'Magier',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Spruchpraxis & Ritualistik',
        description: 'Stabile Bannungen, Elementargeschosse, Lichtzauber und Identifikation magischer Auren.',
        suggestedCompetencies: ['Spruchkanalisierung', 'Aura wahrnehmen', 'Schutzschilde', 'Gedankendisziplin'],
        possibleRanks: ['Magier', 'Spruchweber', 'Elementarist'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Arkan-Novize',
        nextRankName: 'Elementarmagier'
      },
      {
        idSuffix: 'elementarmagier',
        name: 'Elementarmagier',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Elementarbindung & Runenmatrix',
        description: 'Herrschaft über Feuerstürme, Eiswälle, Teleportation und permanente magische Siegel.',
        suggestedCompetencies: ['Elementare Großzauber', 'Runenmatrix weben', 'Telekinese', 'Dimensionsrisse schließen'],
        possibleRanks: ['Elementarmagier', 'Siegelmeister', 'Arkanweber'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Magier',
        nextRankName: 'Erzmagier'
      },
      {
        idSuffix: 'erzmagier',
        name: 'Erzmagier',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Arkaner Konvent & Hochmagie',
        description: 'Sitz im Hohen Arkanrat, Erschaffung fliegender Zitadellen und Meisterung der Sphärenmagie.',
        suggestedCompetencies: ['Sphärenmagie', 'Großritualleitung', 'Arkane Schöpfung', 'Konventsleitung'],
        possibleRanks: ['Erzmagier', 'Großinquisitor der Magie', 'Magister Artium'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Elementarmagier'
      }
    ]
  },

  // ===========================================================================
  // WIRTSCHAFT & HANDEL (verwaltung_wirtschaft)
  // ===========================================================================
  kaufmann: {
    branchKey: 'kaufmann',
    branchName: 'Kaufmann',
    category: 'Kaufmann',
    description: 'Warenverkehr, Buchführung, Preisfeilschen, Münzkunde und Etablierung profitabler Handelswege.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Kontorbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Kontorarbeiten',
        description: 'Frachtbriefe abstempeln, Kisten wiegen, Münzen wiegen und Botengänge zur Börse.',
        suggestedCompetencies: ['Münzwaage bedienen', 'Rechnen & Buchführen', 'Frachtkontrolle', 'Warenlagern'],
        possibleRanks: ['Kontorbursche', 'Handelsjunge', 'Laufgehilfe'],
        nextRankName: 'Kaufmann'
      },
      {
        idSuffix: 'geselle',
        name: 'Kaufmann',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Warenverkehr & Ladengeschäft',
        description: 'Eigenständiges Führen eines Ladengeschäfts, Einkauf von Kolonial- und Zunftwaren.',
        suggestedCompetencies: ['Feilschkunst', 'Kalkulation & Gewinnspanne', 'Zollabwicklung', 'Kundenbetreuung'],
        possibleRanks: ['Krämer', 'Kaufmann', 'Kontorist'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Kontorbursche',
        nextRankName: 'Fernhändler'
      },
      {
        idSuffix: 'fernhaendler',
        name: 'Fernhändler',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Karawanenhandel & Großposten',
        description: 'Organisation von Handelskarawanen, Schiffsbefrachtung und Verwaltung von Übersee-Faktoreien.',
        suggestedCompetencies: ['Karawanenlogistik', 'Seefrachtverträge', 'Devisenhandel', 'Großhandelsrabatte'],
        possibleRanks: ['Fernhändler', 'Faktoreileiter', 'Hanseat'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Kaufmann',
        nextRankName: 'Handelsherr'
      },
      {
        idSuffix: 'handelsherr',
        name: 'Handelsherr',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Gildevorsitz & Großkapital',
        description: 'Herrschaft über Handelshäuser, Finanzierung von Expeditionen und Sitz im Stadtpatriziat.',
        suggestedCompetencies: ['Handelsimperium leiten', 'Expeditionsfinanzierung', 'Gildevorsitz', 'Monopolpolitik'],
        possibleRanks: ['Handelsherr', 'Großpatrizier', 'Gildeältester'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Fernhändler'
      }
    ]
  },

  // ===========================================================================
  // LANDWIRTSCHAFT (landwirtschaft_versorgung)
  // ===========================================================================
  bauer: {
    branchKey: 'bauer',
    branchName: 'Bauer',
    category: 'Bauer',
    description: 'Bodenbewirtschaftung, Pflügen, Säen, Ernten, Viehhaltung und Wetterbeobachtung.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Hofknecht',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Feldbestellung',
        description: 'Stall ausmisten, Steine vom Acker klauben, Wasser tragen und Ochsen führen.',
        suggestedCompetencies: ['Feldarbeit', 'Viehfütterung', 'Werkzeuginstandhaltung', 'Wetterkunde Grundlagen'],
        possibleRanks: ['Hofknecht', 'Saatjunge', 'Pfluggehilfe'],
        nextRankName: 'Bauer'
      },
      {
        idSuffix: 'geselle',
        name: 'Bauer',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Bodenwirtschaft & Feldbau',
        description: 'Eigenverantwortliches Bestellen der Scholle, Dreifelderwirtschaft, Ernte und Dreschen.',
        suggestedCompetencies: ['Pflügen & Eggen', 'Dreifelderwirtschaft', 'Ernteplanung', 'Kornlagerung'],
        possibleRanks: ['Ackerbauer', 'Freibauer', 'Hufner'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Hofknecht',
        nextRankName: 'Gutspächter'
      },
      {
        idSuffix: 'gutspaechter',
        name: 'Gutspächter',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Saatgutveredelung & Vorratswirtschaft',
        description: 'Zucht widerstandsfähiger Getreidesorten, Bewässerungsgräben und Bewirtschaftung großer Gutshöfe.',
        suggestedCompetencies: ['Saatgutzucht', 'Bewässerungsbau', 'Siloverwaltung', 'Knechte anleiten'],
        possibleRanks: ['Gutspächter', 'Saatzüchter', 'Meier'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Bauer',
        nextRankName: 'Hofbesitzer'
      },
      {
        idSuffix: 'dorfschulze',
        name: 'Hofbesitzer',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Dorfleitung & Großbauernwirtschaft',
        description: 'Repräsentation der bäuerlichen Gemeinschaft, Zehntabrechnung mit dem Grundherrn und Großagrarleitung.',
        suggestedCompetencies: ['Dorfgericht', 'Zehntverwaltung', 'Genossenschaftswesen', 'Agrarökonomie'],
        possibleRanks: ['Dorfschulze', 'Großhofherr', 'Bauernältester'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Gutspächter'
      }
    ]
  },

  // ===========================================================================
  // RELIGION & KLERUS (religion_klerus)
  // ===========================================================================
  priester: {
    branchKey: 'priester',
    branchName: 'Priester',
    category: 'Priester',
    description: 'Liturgie, Seelsorge, Segnungen, Tempeldienst und theologische Auslegung der Gebote.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Akolyth',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Liturgiedienst',
        description: 'Weihrauchschwenken, Altarkerzen entzünden, Gesangsbücher tragen und Gebetszeiten einhalten.',
        suggestedCompetencies: ['Liturgiegesang', 'Weihrauchdienst', 'Heilige Texte rezitieren', 'Altarordnung'],
        possibleRanks: ['Akolyth', 'Tempelnovize', 'Messdiener'],
        nextRankName: 'Priester'
      },
      {
        idSuffix: 'geselle',
        name: 'Priester',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Gemeindeseelsorge & Andacht',
        description: 'Abhalten von Messen, Taufen, Krankenölungen, Segen und geistliche Seelsorge.',
        suggestedCompetencies: ['Seelsorge & Beichte', 'Segnungsriten', 'Predigtlehre', 'Religionsunterricht'],
        possibleRanks: ['Priester', 'Pfarrer', 'Kleriker'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Akolyth',
        nextRankName: 'Dompropst'
      },
      {
        idSuffix: 'dompropst',
        name: 'Dompropst',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Zeremonien & Sakramente',
        description: 'Leitung von Kathedralen, Erteilung hoher Sakramente und Verwaltung der Kirchenschätze.',
        suggestedCompetencies: ['Hochliturgie', 'Kathedralverwaltung', 'Kirchenrecht', 'Theologische Disputation'],
        possibleRanks: ['Dompropst', 'Erzpriester', 'Prälat'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Priester',
        nextRankName: 'Bischof'
      },
      {
        idSuffix: 'bischof',
        name: 'Bischof',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Diözesanleitung & Oberster Konvent',
        description: 'Führung der gesamten Diözese, Priesterweihe, kirchenpolitische Vertretung vor Kronen und Göttern.',
        suggestedCompetencies: ['Priesterweihe', 'Diözesanführung', 'Kirchenkonzil', 'Glaubenskanon'],
        possibleRanks: ['Bischof', 'Erzbischof', 'Patriarch'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Dompropst'
      }
    ]
  },

  // ===========================================================================
  // UNTERWELT & KRIMINALITÄT (kriminelle_berufe)
  // ===========================================================================
  taschendieb: {
    branchKey: 'taschendieb',
    branchName: 'Taschendieb',
    category: 'Taschendieb',
    description: 'Leise Finger, Ablenkungsmanöver, Beutelabschneiden und lautloses Verschwinden in Menschenmengen.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Gassenjunge',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Schattenschritte',
        description: 'Spähen nach Wachen, Ablenken von Markthändlern und Schnelles Fliehen durch enge Gassen.',
        suggestedCompetencies: ['Gassenkunde', 'Ablenkung', 'Wachbeobachtung', 'Schneller Antritt'],
        possibleRanks: ['Gassenjunge', 'Beutelspäher'],
        nextRankName: 'Taschendieb'
      },
      {
        idSuffix: 'geselle',
        name: 'Taschendieb',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Fingerfertigkeit & Ablenkung',
        description: 'Geschicktes Abtrennen von Münzbeuteln, Herausziehen von Uhren und unauffälliger Taschendiebstahl.',
        suggestedCompetencies: ['Fingerfertigkeit', 'Gedränge nutzen', 'Gegenstände weiterreichen', 'Fluchtwege'],
        possibleRanks: ['Beutelschneider', 'Taschendieb', 'Langfinger'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Gassenjunge',
        nextRankName: 'Fingerkünstler'
      },
      {
        idSuffix: 'fingerkuenstler',
        name: 'Fingerkünstler',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Infiltration & Präzisionsdiebstahl',
        description: 'Knacken komplizierter Vorhängeschlösser, Entwenden von Siegelringen vom schlafenden Finger.',
        suggestedCompetencies: ['Dietrichführung', 'Schmuckentwendung', 'Schleichen im Dunkeln', 'Hehlerkontakte'],
        possibleRanks: ['Fingerkünstler', 'Schlösserknacker', 'Schattenkriecher'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Taschendieb',
        nextRankName: 'Meisterdieb'
      },
      {
        idSuffix: 'meisterdieb',
        name: 'Meisterdieb',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Gildenführung & Meisterstreifzug',
        description: 'Leitung der Diebesgilde, Planung legendärer Museumseinbrüche und Schirmherrschaft des Untergrunds.',
        suggestedCompetencies: ['Meistercoups planen', 'Diebesgildenführung', 'Schattensysteme', 'Untergrundkodex'],
        possibleRanks: ['Meisterdieb', 'Schattenfürst', 'Zunftoberhaupt der Diebe'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Fingerkünstler'
      }
    ]
  },

  // ===========================================================================
  // KUNST & MUSIK (kunst_kultur)
  // ===========================================================================
  barde: {
    branchKey: 'barde',
    branchName: 'Barde',
    category: 'Barde',
    description: 'Dichtkunst, Lautenspiel, Moritaten, Inspiration von Gefährten und Bewahrung alter Legenden.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Spiellehrling',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Lautenspiel',
        description: 'Akkorde lernen, Reime finden, Schellen schütteln und Hüte für Kupfermünzen herumreichen.',
        suggestedCompetencies: ['Grundakkorde Laute', 'Reimlehre', 'Stimmbildung', 'Bühnenpräsenz'],
        possibleRanks: ['Spiellehrling', 'Reimschmied', 'Kupfersänger'],
        nextRankName: 'Barde'
      },
      {
        idSuffix: 'geselle',
        name: 'Barde',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Wirtshausgesang & Balladen',
        description: 'Vortrag epischer Balladen, Tanzmusik auf Marktplätzen und Aufheiterung müder Reisender.',
        suggestedCompetencies: ['Balladenvortrag', 'Tanzweisen', 'Geschichtenerzählen', 'Publikumsstimmung'],
        possibleRanks: ['Spielmann', 'Gauklerbarde', 'Sänger'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Spiellehrling',
        nextRankName: 'Minnesänger'
      },
      {
        idSuffix: 'minnesaenger',
        name: 'Minnesänger',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Hoflyrik & Heldenepen',
        description: 'Erlesene Minnelieder für Königinnen, heroische Skaldenepen und diplomatische Spottverse.',
        suggestedCompetencies: ['Minnelyrik', 'Heldenepos dichten', 'Harfenvirtuosität', 'Höfische Gunst'],
        possibleRanks: ['Minnesänger', 'Hofskalde', 'Troubadour'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Barde',
        nextRankName: 'Oberbarde'
      },
      {
        idSuffix: 'oberbarde',
        name: 'Oberbarde',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Akademieleitung & Gesangskrone',
        description: 'Leiter der Sängerakademie, Verleiher der Goldenen Lorbeeren und Hofdichter von Kaisern.',
        suggestedCompetencies: ['Eposkomposition', 'Bardenkollegium', 'Macht des Liedes', 'Kulturelle Schirmherrschaft'],
        possibleRanks: ['Oberbarde', 'Fürstensänger', 'Meistersänger'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Minnesänger'
      }
    ]
  },

  // ===========================================================================
  // MEDIZIN, CHIRURGIE & HEILKUNDE (medizin)
  // ===========================================================================
  arzt: {
    branchKey: 'arzt',
    branchName: 'Arzt',
    category: 'Arzt',
    description: 'Diagnostik, Heilung von Krankheiten, Chirurgie und medizinische Versorgung.',
    ranks: [
      {
        idSuffix: 'ausbildung',
        name: 'Medizinische Ausbildung',
        tier: 'einstieg',
        nodeType: 'training',
        rankOrder: 0,
        rankTitle: 'Medizinische Grundausbildung',
        description: 'Einführung in Anatomie, Kräutertränke, Wundverbände, Desinfektion und Krankenpflege.',
        suggestedCompetencies: ['Anatomiegrundlagen', 'Wundversorgung', 'Kräuterarzneien', 'Krankenbeobachtung'],
        possibleRanks: ['Medizinstudent', 'Hospitalfamulus', 'Heilerlehrling'],
        nextRankName: 'Arzt'
      },
      {
        idSuffix: 'arzt',
        name: 'Arzt',
        tier: 'beruf',
        nodeType: 'profession',
        rankOrder: 1,
        rankTitle: 'Praktizierender Arzt',
        description: 'Selbstständige Behandlung von Kranken, Diagnosefindung, Verordnung von Arzneien und Notfallmedizin.',
        suggestedCompetencies: ['Diagnostik', 'Krankheitslehre', 'Wundnaht & Verband', 'Toxikologie'],
        possibleRanks: ['Praktischer Arzt', 'Stadtarzt', 'Hospitalarzt'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Medizinische Ausbildung',
        nextRankName: 'Chirurg'
      },
      {
        idSuffix: 'chirurg',
        name: 'Chirurg',
        tier: 'spezialisierung',
        nodeType: 'specialization',
        rankOrder: 2,
        rankTitle: 'Chirurgie & Schnittkunst',
        description: 'Operative Eingriffe, Knochenrichten, Geschwür-Exzision und invasive Notfallchirurgie.',
        suggestedCompetencies: ['Chirurgische Schnittführung', 'Amputation & Gefäßligatur', 'Knochenreposition', 'Schmerzstillung'],
        possibleRanks: ['Operateur', 'Chirurg', 'Wundchirurg'],
        requiredExperienceYears: 2,
        prerequisites: [
          { type: 'profession', label: 'Arzt', targetId: 'Arzt', required: true },
          { type: 'competence', label: 'Anatomie & Organlehre', targetId: 'Anatomie', minValue: 50, required: true },
          { type: 'competence', label: 'Wundversorgung & Aderlass', targetId: 'Wundversorgung', minValue: 50, required: true },
          { type: 'experience_years', label: '2 Jahre medizinische Praxis', minValue: 2, required: true },
          { type: 'knowledge', label: 'Praktische Hospitalerfahrung', required: false }
        ],
        nextRankName: 'Fachchirurg'
      },
      {
        idSuffix: 'fachchirurg',
        name: 'Fachchirurg',
        tier: 'spezialisierung',
        nodeType: 'advanced_profession',
        rankOrder: 2,
        rankTitle: 'Fachchirurg & Operateur',
        description: 'Schwere thorax- und bauchchirurgische Eingriffe, Schädelöffnungen und Organrekonstruktionen.',
        suggestedCompetencies: ['Organrekonstruktion', 'Schädelchirurgie', 'Blutstillungstechniken', 'Infektionsprophylaxe'],
        possibleRanks: ['Fachchirurg', 'Oberoperateur', 'Klinischer Chirurg'],
        requiredExperienceYears: 3,
        prerequisiteJobName: 'Chirurg',
        nextRankName: 'Leitender Chirurg'
      },
      {
        idSuffix: 'leitender_chirurg',
        name: 'Leitender Chirurg',
        tier: 'meister',
        nodeType: 'leadership',
        rankOrder: 3,
        rankTitle: 'Leitender Chirurg / Chefarzt',
        description: 'Leitung der chirurgischen Hospitalabteilung, Ausbildung angehender Chirurgen und Gutachten.',
        suggestedCompetencies: ['Operationssaalleitung', 'Komplexe Chirurgie', 'Ärztliches Gutachten', 'Klinikorganisation'],
        possibleRanks: ['Leitender Chirurg', 'Chefarzt der Chirurgie', 'Hospitaldirektor'],
        positionTitle: 'Leitender Chirurg des Hospitals',
        requiredExperienceYears: 5,
        prerequisiteJobName: 'Fachchirurg'
      },
      {
        idSuffix: 'militaerarzt',
        name: 'Militärarzt',
        tier: 'spezialisierung',
        nodeType: 'specialization',
        rankOrder: 2,
        rankTitle: 'Militärischer Sanitätsdienst',
        description: 'Verwundetenversorgung auf dem Schlachtfeld, Lazarettorganisation und Seuchenkontrolle im Felde.',
        suggestedCompetencies: ['Feldlazarett-Logistik', 'Granatsplitter-Extraktion', 'Militärische Triage', 'Feldhygiene'],
        possibleRanks: ['Feldstabsarzt', 'Regimentsarzt', 'Militärarzt'],
        requiredExperienceYears: 2,
        prerequisites: [
          { type: 'profession', label: 'Arzt', targetId: 'Arzt', required: true },
          { type: 'competence', label: 'Militärische Feldversorgung', targetId: 'Feldversorgung', targetFieldId: 'militaer', targetFieldName: 'Militär & Sicherheit', minValue: 45, required: true },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2, required: true }
        ],
        nextRankName: 'Meisterarzt'
      },
      {
        idSuffix: 'chefarzt',
        name: 'Meisterarzt',
        tier: 'meister',
        nodeType: 'leadership',
        rankOrder: 3,
        rankTitle: 'Ärztlicher Direktor / Meisterarzt',
        description: 'Höchste ärztliche Autorität, Aufsicht über alle Heilanstalten der Region und Erforschung neuer Heilmethoden.',
        suggestedCompetencies: ['Medizinische Forschung', 'Hospitalleitung', 'Epidemiekontrolle', 'Kollegiumsführung'],
        possibleRanks: ['Chefarzt', 'Ärztlicher Direktor', 'Leibarzt des Herrschers'],
        positionTitle: 'Ärztlicher Direktor',
        requiredExperienceYears: 5,
        prerequisiteJobName: 'Arzt'
      }
    ]
  },

  chirurg: {
    branchKey: 'chirurg',
    branchName: 'Chirurg',
    category: 'Chirurgie',
    description: 'Spezialdisziplin der operativen Schnittkunst und Organwiederherstellung.',
    ranks: [
      {
        idSuffix: 'ausbildung',
        name: 'Chirurgische Assistenz',
        tier: 'einstieg',
        nodeType: 'training',
        rankOrder: 0,
        rankTitle: 'Operationsassistenz',
        description: 'Instrumentenkunde, Klemmenführung, Nahtmaterial vorbereiten und Wundhaken halten.',
        suggestedCompetencies: ['Instrumentenführung', 'Blutstillung', 'Sterilisation', 'Nahttechnik'],
        possibleRanks: ['Chirurgie-Assistent', 'Operationsfamulus'],
        nextRankName: 'Chirurg'
      },
      {
        idSuffix: 'chirurg',
        name: 'Chirurg',
        tier: 'beruf',
        nodeType: 'profession',
        rankOrder: 1,
        rankTitle: 'Operateur & Chirurg',
        description: 'Eigenständige Durchführung von Schnittoperationen, Knochenrichten und Abszesseröffnungen.',
        suggestedCompetencies: ['Schnittoperationen', 'Knochenreposition', 'Ligatur', 'Wundverschluss'],
        possibleRanks: ['Wundchirurg', 'Klinischer Operateur'],
        requiredExperienceYears: 1,
        prerequisites: [
          { type: 'profession', label: 'Arzt', targetId: 'Arzt', required: true },
          { type: 'competence', label: 'Anatomie', targetId: 'Anatomie', minValue: 45, required: true }
        ],
        nextRankName: 'Fachchirurg'
      },
      {
        idSuffix: 'fachchirurg',
        name: 'Fachchirurg',
        tier: 'spezialisierung',
        nodeType: 'advanced_profession',
        rankOrder: 2,
        rankTitle: 'Fachchirurg',
        description: 'Hochspezialisierte Eingriffe an inneren Organen, Thorax und Knochengelenken.',
        suggestedCompetencies: ['Gelenkrekonstruktion', 'Thoraxeingriffe', 'Feinchirurgie', 'Narkoseführung'],
        possibleRanks: ['Fachchirurg', 'Oberoperateur'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Chirurg',
        nextRankName: 'Leitender Chirurg'
      },
      {
        idSuffix: 'leitender_chirurg',
        name: 'Leitender Chirurg',
        tier: 'meister',
        nodeType: 'leadership',
        rankOrder: 3,
        rankTitle: 'Leitender Chirurg des Hospitals',
        description: 'Führung des gesamten Operationstrakts und Ausbildung neuer Generationen von Chirurgen.',
        suggestedCompetencies: ['Chefarztvisite', 'Krisenintervention', 'Akademische Chirurgie', 'Hospitalleitung'],
        possibleRanks: ['Leitender Chirurg', 'Chefarzt der Chirurgie'],
        positionTitle: 'Leitender Chirurg',
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Fachchirurg'
      }
    ]
  },

  heiler: {
    branchKey: 'heiler',
    branchName: 'Heiler',
    category: 'Heilkunde',
    description: 'Ganzheitliche Naturheilkunde, Kräutertherapie, Wundbehandlung und Pflege.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Kräuterheiler-Lehrling',
        tier: 'einstieg',
        nodeType: 'training',
        rankOrder: 0,
        rankTitle: 'Heiler-Novize',
        description: 'Pflanzensammeln, Salben rühren, Umschläge wickeln und Bettung Kranker.',
        suggestedCompetencies: ['Kräutersuche', 'Salbenherstellung', 'Fiebersenkung', 'Pflege'],
        possibleRanks: ['Heilerlehrling', 'Kräutersammler'],
        nextRankName: 'Heiler'
      },
      {
        idSuffix: 'heiler',
        name: 'Heiler',
        tier: 'beruf',
        nodeType: 'profession',
        rankOrder: 1,
        rankTitle: 'Heilkundiger',
        description: 'Behandlung von Wunden, Fiebern, Vergiftungen und chronischen Leiden mit Naturheilmitteln.',
        suggestedCompetencies: ['Naturheilkunde', 'Wundbehandlung', 'Tinkturenbrauen', 'Antidote'],
        possibleRanks: ['Dorfheiler', 'Heilkundiger', 'Sanitäter'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Kräuterheiler-Lehrling',
        nextRankName: 'Meisterheiler'
      },
      {
        idSuffix: 'meisterheiler',
        name: 'Meisterheiler',
        tier: 'meister',
        nodeType: 'leadership',
        rankOrder: 3,
        rankTitle: 'Oberster Heilkundiger',
        description: 'Vollendetes Wissen um Lebenskräfte, seltene Essenzen und überregionale Heilanstalten.',
        suggestedCompetencies: ['Meisterkräuterkunde', 'Geist- & Körperregeneration', 'Sanatoriumsleitung', 'Lebenselixiere'],
        possibleRanks: ['Meisterheiler', 'Großhospitalar', 'Ordensheiler'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Heiler'
      }
    ]
  },

  apotheker: {
    branchKey: 'apotheker',
    branchName: 'Apotheker',
    category: 'Pharmazie & Arzneikunde',
    description: 'Mischen von Arzneien, Destillaten, Salben und pharmazeutischen Rezepturen.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Offizin-Gehilfe',
        tier: 'einstieg',
        nodeType: 'training',
        rankOrder: 0,
        rankTitle: 'Apothekerlehrling',
        description: 'Mörsern von Wurzeln, Gläser säubern, Kräuter wiegen und Trockenkammer betreuen.',
        suggestedCompetencies: ['Mörsertechnik', 'Substanzen wiegen', 'Trocknungsprozesse', 'Offizinordnung'],
        possibleRanks: ['Apothekerlehrling', 'Offizinbursche'],
        nextRankName: 'Apotheker'
      },
      {
        idSuffix: 'apotheker',
        name: 'Apotheker',
        tier: 'beruf',
        nodeType: 'profession',
        rankOrder: 1,
        rankTitle: 'Pharmazeut & Arzneimeister',
        description: 'Rezepturgerechtes Ansetzen von Tinkturen, Pillen, Schlaftrunken und Gegengiften.',
        suggestedCompetencies: ['Arzneizubereitung', 'Destillationsverfahren', 'Pillendrehen', 'Giftstoffkunde'],
        possibleRanks: ['Apotheker', 'Offizin-Leiter', 'Provisor'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Offizin-Gehilfe',
        nextRankName: 'Stadtapotheker'
      },
      {
        idSuffix: 'stadtapotheker',
        name: 'Stadtapotheker',
        tier: 'meister',
        nodeType: 'leadership',
        rankOrder: 3,
        rankTitle: 'Aufsichtsrat für Arzneiwesen',
        description: 'Prüfung aller Heilstoffe der Stadt, Privilegierte Rezepturen und Hofapothekenleitung.',
        suggestedCompetencies: ['Reichsrezepturen', 'Arzneimonopol', 'Hofpharmazie', 'Gutachterwesen'],
        possibleRanks: ['Stadtapotheker', 'Hofapotheker', 'Oberoffizinmeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Apotheker'
      }
    ]
  },

  // ===========================================================================
  // BAU & HANDWERK (bau_handwerk)
  // ===========================================================================
  zimmermann: {
    branchKey: 'zimmermann',
    branchName: 'Zimmermann',
    category: 'Holzbau & Konstruktion',
    description: 'Errichtung von Dachstühlen, Fachwerken, Brücken und hölzernen Großkonstruktionen.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Zimmermann-Lehrling',
        tier: 'einstieg',
        nodeType: 'training',
        rankOrder: 0,
        rankTitle: 'Zimmererlehrling',
        description: 'Balken zurichten, Zapflöcher stemmen, Holznägel schnitzen und Hebezeuge bedienen.',
        suggestedCompetencies: ['Axtführung', 'Zapfenverbindung', 'Holzsortierung', 'Rüstungsaufbau'],
        possibleRanks: ['Zimmerlehrling', 'Balkenschneider'],
        nextRankName: 'Zimmermann'
      },
      {
        idSuffix: 'zimmermann',
        name: 'Zimmermann',
        tier: 'beruf',
        nodeType: 'profession',
        rankOrder: 1,
        rankTitle: 'Zimmermann & Holzkonstrukteur',
        description: 'Konstruktion von Dachstühlen, Wandgebinden, Treppen und tragendem Holzfachwerk.',
        suggestedCompetencies: ['Dachstuhlabbund', 'Fachwerkbau', 'Statiklehre Holz', 'Holzverbindungstechniken'],
        possibleRanks: ['Zimmergeselle', 'Wandergeselle', 'Holzbaumeister'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Zimmermann-Lehrling',
        nextRankName: 'Schiffszimmermann'
      },
      {
        idSuffix: 'schiffszimmermann',
        name: 'Schiffszimmermann',
        tier: 'spezialisierung',
        nodeType: 'specialization',
        rankOrder: 2,
        rankTitle: 'Werft- & Schiffsbautechnik',
        description: 'Biegen von Spanten, Planken kalfatern, Masten setzen und Rumpfreparaturen auf See.',
        suggestedCompetencies: ['Spantenbau', 'Kalfaterung', 'Dampfbiegen von Hartholz', 'Mastsetzen'],
        possibleRanks: ['Schiffszimmermann', 'Kalfaterer', 'Dockzimmermann'],
        requiredExperienceYears: 2,
        prerequisites: [
          { type: 'profession', label: 'Zimmermann', targetId: 'Zimmermann', required: true },
          { type: 'competence', label: 'Schiffskunde & Rumpfbau', targetId: 'Schiffskunde', targetFieldId: 'seefahrt', targetFieldName: 'Seefahrt', minValue: 40, required: true },
          { type: 'experience_years', label: '2 Jahre Praxis', minValue: 2, required: true }
        ],
        nextRankName: 'Zimmermeister'
      },
      {
        idSuffix: 'zimmermeister',
        name: 'Zimmermeister',
        tier: 'meister',
        nodeType: 'leadership',
        rankOrder: 3,
        rankTitle: 'Zimmermeister / Werftleiter',
        description: 'Bauleitung großer Kathedralendachstühle, Galeerenwerften und Zunftführung.',
        suggestedCompetencies: ['Großkonstruktionsplanung', 'Werftleitung', 'Meisterabbund', 'Zunftobermeister'],
        possibleRanks: ['Zimmermeister', 'Werftmeister', 'Oberbauleiter Holz'],
        positionTitle: 'Werftmeister',
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Zimmermann'
      }
    ]
  }
};

/**
 * Maps field IDs to their primary career branch keys.
 */
export const FIELD_BRANCH_MAP: Record<string, string[]> = {
  // 16 Konsolidierte Kern-Berufsfelder (jeweils 3 bis 7 thematisch vereinte Hauptberufszweige)
  lebensmittel_versorgung: ['koch', 'baecker', 'brauer', 'metzger', 'winzer', 'mueller', 'kaeser'],
  bau_handwerk: ['steinmetz', 'zimmermann', 'tischler', 'schneider', 'gerber', 'toepfer'],
  metall_feinhandwerk: ['schmied', 'goldschmied', 'mechaniker', 'giesser'],
  natur_landwirtschaft: ['bauer', 'jaeger', 'foerster', 'bergmann', 'imker', 'schaefer'],
  medizin: ['arzt', 'heiler', 'apotheker'],
  wissenschaft: ['alchemist', 'gelehrter', 'astronom', 'kartograph'],
  handel_wirtschaft: ['kaufmann', 'bankier', 'lagerverwalter'],
  dienstleistung: ['diener', 'kutscher', 'barbier', 'bote', 'gastwirt'],
  verwaltung: ['schreiber', 'beamter', 'richter', 'diplomat'],
  militaer: ['soldat', 'schuetze', 'kavallerist', 'scout', 'waffenmeister'],
  seefahrt: ['seemann', 'fischer', 'lotse'],
  kriminalitaet: ['taschendieb', 'einbrecher', 'hehler', 'spion', 'bandit'],
  magie: ['magier', 'runenschmied', 'beschwoerer', 'wahrsager'],
  kunst_kultur: ['maler', 'bildhauer', 'barde', 'schauspieler', 'schriftsteller'],
  religion: ['priester', 'paladin', 'moench', 'seelsorger'],
  abenteuer: ['abenteurer', 'soeldner', 'gladiator', 'monsterjaeger'],

  // Legacy Aliases for backwards compatibility
  metall_waffen: ['schmied', 'goldschmied', 'mechaniker', 'giesser'],
  lebensmittel_ernaehrung: ['koch', 'baecker', 'brauer', 'metzger', 'winzer', 'mueller', 'kaeser'],
  militaer_streitkraefte: ['soldat', 'schuetze', 'kavallerist', 'scout', 'waffenmeister'],
  militaer_sicherheit: ['soldat', 'schuetze', 'kavallerist', 'scout', 'waffenmeister'],
  magie_arkana: ['magier', 'runenschmied', 'beschwoerer', 'wahrsager'],
  arkan_magie: ['magier', 'runenschmied', 'beschwoerer', 'wahrsager'],
  wissenschaft_forschung: ['alchemist', 'gelehrter', 'astronom', 'kartograph'],
  verwaltung_wirtschaft: ['kaufmann', 'bankier', 'lagerverwalter'],
  verwaltung_recht: ['schreiber', 'beamter', 'richter', 'diplomat'],
  staatsdienst_diplomatie: ['diplomat', 'richter', 'beamter', 'schreiber'],
  unabhaengige_abenteurer: ['abenteurer', 'soeldner', 'gladiator', 'monsterjaeger'],
  abenteuer_sondergewerbe: ['abenteurer', 'soeldner', 'gladiator', 'monsterjaeger'],
  geheimoperationen_ueberleben: ['spion', 'einbrecher', 'taschendieb', 'bandit'],
  landwirtschaft_versorgung: ['bauer', 'jaeger', 'foerster', 'bergmann', 'imker', 'schaefer'],
  religion_klerus: ['priester', 'paladin', 'moench', 'seelsorger'],
  materialverarbeitung: ['steinmetz', 'zimmermann', 'tischler', 'schneider', 'gerber', 'toepfer'],
  bergbau_rohstoffe: ['bergmann', 'steinmetz'],
  wandernde_erkundung: ['jaeger', 'foerster', 'scout'],
  tierfuehrung_tamer: ['schaefer', 'jaeger'],
  kriminelle_berufe: ['taschendieb', 'einbrecher', 'hehler', 'spion', 'bandit'],
  haushalt_dienste: ['diener', 'kutscher', 'barbier', 'bote', 'gastwirt'],
  unterhaltung_spezial: ['barde', 'schauspieler', 'maler'],
  luxus_spezial: ['goldschmied', 'schmied', 'mechaniker'],
  bildung_erziehung: ['gelehrter', 'schreiber']
};

/**
 * Derives authentic, domain-specific rank names and titles instead of generic "Lehrling/Spezialist/Meister".
 */
export function getRoleSpecificTitles(jobName: string, fieldId: string): {
  entryName: string;
  entryTitle: string;
  journeyName: string;
  journeyTitle: string;
  specName: string;
  specTitle: string;
  masterName: string;
  masterTitle: string;
} {
  const clean = jobName.trim();
  const lower = clean.toLowerCase();

  // Wine & Viticulture
  if (lower.includes('winzer') || lower.includes('wein') || lower.includes('kelter') || lower.includes('reben') || lower.includes('oenolog')) {
    return {
      entryName: 'Weinberggehilfe',
      entryTitle: 'Einstieg & Weinbergpflege',
      journeyName: clean,
      journeyTitle: 'Weinbau & Kellerwirtschaft',
      specName: 'Kellermeister',
      specTitle: 'Fassausbau & Cuvéekunst',
      masterName: 'Weingutsleiter',
      masterTitle: 'Weingutsdirektion & Lagenmeister'
    };
  }
  // Brewing & Malting
  if (lower.includes('brauer') || lower.includes('bier') || lower.includes('mälzer')) {
    return {
      entryName: 'Braubursche',
      entryTitle: 'Einstieg & Sudhausdienst',
      journeyName: clean,
      journeyTitle: 'Braukunst & Gärungskontrolle',
      specName: 'Biersommelier',
      specTitle: 'Spezialsud & Fassreifung',
      masterName: 'Braumeister',
      masterTitle: 'Großbrauereileitung & Zunftvorsitz'
    };
  }
  // Restaurant Service & Waiter
  if (lower.includes('kellner') || lower.includes('schank') || lower.includes('bedienung') || lower.includes('service')) {
    return {
      entryName: 'Schankbursche',
      entryTitle: 'Einstieg & Gästebewirtung',
      journeyName: clean,
      journeyTitle: 'Servierpraxis & Kundenbetreuung',
      specName: 'Bankettleiter',
      specTitle: 'Weinservice & Festsaalkoordination',
      masterName: 'Maître d’Hôtel',
      masterTitle: 'Gastronomieleitung & Serviceinspektion'
    };
  }
  // Gardening & Botany
  if (lower.includes('gärtner') || lower.includes('garten') || lower.includes('pflanz') || lower.includes('botan')) {
    return {
      entryName: 'Gartengehilfe',
      entryTitle: 'Einstieg & Anzuchtpraxis',
      journeyName: clean,
      journeyTitle: 'Gartenbau & Gehölzpflege',
      specName: 'Ziergärtner',
      specTitle: 'Veredelung & Parkgestaltung',
      masterName: 'Hofgärtnermeister',
      masterTitle: 'Gartenarchitektur & Direktion'
    };
  }
  // Beekeeping & Apiary
  if (lower.includes('imker') || lower.includes('bien') || lower.includes('zeidl')) {
    return {
      entryName: 'Zeidlergehilfe',
      entryTitle: 'Einstieg & Bienenstockbetreuung',
      journeyName: clean,
      journeyTitle: 'Imkerei & Honigernte',
      specName: 'Königinnenzüchter',
      specTitle: 'Völkerzucht & Veredelung',
      masterName: 'Zeidlermeister',
      masterTitle: 'Zunftleitung & Bienenschutz'
    };
  }
  // Fishing & Aquaculture
  if (lower.includes('fischer') || lower.includes('fischfang') || lower.includes('netz')) {
    return {
      entryName: 'Netzflicker',
      entryTitle: 'Einstieg & Fangvorbereitung',
      journeyName: clean,
      journeyTitle: 'Fischerei & Gewässerkunde',
      specName: 'Hochseefischer',
      specTitle: 'Schwarmortung & Teichwirtschaft',
      masterName: 'Fischereimeister',
      masterTitle: 'Innungsleitung & Revierverwaltung'
    };
  }
  // Culinary & Food
  if (lower.includes('koch') || lower.includes('küche') || lower.includes('bäcker') || lower.includes('konditor') || lower.includes('metzger') || fieldId.includes('lebensmittel')) {
    return {
      entryName: `Küchenjunge & Gehilfe (${clean})`,
      entryTitle: 'Einstieg & Vorbereitung',
      journeyName: clean,
      journeyTitle: 'Fachpraxis & Zubereitung',
      specName: `Chefkoch & Spezialist (${clean})`,
      specTitle: 'Rezeptur & Veredelung',
      masterName: `Küchenmeister & Zunftältester (${clean})`,
      masterTitle: 'Betriebsleitung & Fachvorsitz'
    };
  }
  // Domestic / Service
  if (lower.includes('diener') || lower.includes('zofe') || lower.includes('butler') || lower.includes('kammer') || lower.includes('page') || fieldId === 'haushalt_dienste') {
    return {
      entryName: `Laufbursche (${clean})`,
      entryTitle: 'Einstieg & Hausdienst',
      journeyName: clean,
      journeyTitle: 'Herrschaftlicher Dienst',
      specName: `Kammer- & Tafeldienst (${clean})`,
      specTitle: 'Vertrauensstellung & Tafelaufsicht',
      masterName: `Haushofmeister (${clean})`,
      masterTitle: 'Hausleitung & Residenzführung'
    };
  }
  // Coachman / Transport
  if (lower.includes('kutscher') || lower.includes('fuhrmann') || lower.includes('karren')) {
    return {
      entryName: 'Stalljunge',
      entryTitle: 'Einstieg & Gespanndienst',
      journeyName: clean,
      journeyTitle: 'Fahrpraxis & Gespannführung',
      specName: 'Postillon',
      specTitle: 'Reisekutsche & Fernrouten',
      masterName: 'Hofkutscher',
      masterTitle: 'Hofstallmeister & Fuhrwerksleitung'
    };
  }
  // Combat / Military / Guard
  if (lower.includes('soldat') || lower.includes('krieg') || lower.includes('wache') || lower.includes('garde') || lower.includes('fecht') || lower.includes('lanzen') || lower.includes('schwert') || fieldId.includes('militaer')) {
    return {
      entryName: `Rekrut & Waffenanwärter (${clean})`,
      entryTitle: 'Einstieg & Rekrutenausbildung',
      journeyName: clean,
      journeyTitle: 'Garnisonsdienst & Feldeinsatz',
      specName: `Gardist (${clean})`,
      specTitle: 'Garde & Gefechtstaktik',
      masterName: `Feldwebel & Waffenmeister (${clean})`,
      masterTitle: 'Truppenkommando & Ausbilder'
    };
  }
  // Ranged / Archer
  if (lower.includes('schütz') || lower.includes('bogen') || lower.includes('armbrust')) {
    return {
      entryName: 'Pfeiljunge',
      entryTitle: 'Einstieg & Schießübungen',
      journeyName: clean,
      journeyTitle: 'Präzisionsschütze',
      specName: 'Scharfschütze',
      specTitle: 'Windkunde & Zielvisierung',
      masterName: 'Meisterschütze',
      masterTitle: 'Schützenkommando & Meisterschaft'
    };
  }
  // Sailor / Nautical
  if (lower.includes('seemann') || lower.includes('matros') || lower.includes('schiff') || lower.includes('fisch') || lower.includes('lotse') || lower.includes('steuermann') || fieldId === 'seefahrt') {
    return {
      entryName: `Schiffsjunge & Decksbursche (${clean})`,
      entryTitle: 'Einstieg & Takelagedienst',
      journeyName: clean,
      journeyTitle: 'Seefahrt & Decksbetrieb',
      specName: `Vollmatrose & Segelmeister (${clean})`,
      specTitle: 'Navigation & Hochseeerfahrung',
      masterName: `Oberbootsmann & Schiffsführer (${clean})`,
      masterTitle: 'Schiffsführung & Flottenkommando'
    };
  }
  // Magic / Arcana
  if (lower.includes('magi') || lower.includes('zauber') || lower.includes('arkan') || lower.includes('hexe') || lower.includes('beschwör') || fieldId.includes('magie')) {
    return {
      entryName: `Arkan-Novize (${clean})`,
      entryTitle: 'Einstieg & Mana-Grundlagen',
      journeyName: clean,
      journeyTitle: 'Spruchpraxis & Ritualistik',
      specName: `Siegelweber & Elementarkundiger (${clean})`,
      specTitle: 'Komplexe Matrix & Arkanbindung',
      masterName: `Erzmagier (${clean})`,
      masterTitle: 'Arkaner Konvent & Hochmagie'
    };
  }
  // Alchemy / Pharmacy / Science
  if (lower.includes('alchem') || lower.includes('apothek') || lower.includes('trank') || lower.includes('elixier') || fieldId.includes('wissenschaft')) {
    return {
      entryName: `Laborgehilfe & Tiegelwäscher (${clean})`,
      entryTitle: 'Einstieg & Destilliergrundlagen',
      journeyName: clean,
      journeyTitle: 'Extrakt- & Tinkturpraxis',
      specName: `Elixierbrauer & Reagenzforscher (${clean})`,
      specTitle: 'Sublimation & Veredelung',
      masterName: `Großalchemist & Philosophicus (${clean})`,
      masterTitle: 'Transmutation & Laboratoriumsleitung'
    };
  }
  // Clergy / Religion
  if (lower.includes('priester') || lower.includes('klerik') || lower.includes('mönch') || lower.includes('nonne') || lower.includes('predig') || lower.includes('akolyth') || fieldId === 'religion_klerus') {
    return {
      entryName: `Akolyth (${clean})`,
      entryTitle: 'Einstieg & Liturgiedienst',
      journeyName: clean,
      journeyTitle: 'Seelsorge & Gemeindeandacht',
      specName: `Dompropst (${clean})`,
      specTitle: 'Sakramente & Heilige Riten',
      masterName: `Bischof (${clean})`,
      masterTitle: 'Diözesanleitung & Oberklerus'
    };
  }
  // Trade / Commerce
  if (lower.includes('kauf') || lower.includes('händl') || lower.includes('kräm') || lower.includes('markt') || fieldId.includes('verwaltung_wirtschaft')) {
    return {
      entryName: `Kontorbursche (${clean})`,
      entryTitle: 'Einstieg & Kontorarbeiten',
      journeyName: clean,
      journeyTitle: 'Warenverkehr & Feilschen',
      specName: `Fernhändler (${clean})`,
      specTitle: 'Karawanenhandel & Kontore',
      masterName: `Handelsherr (${clean})`,
      masterTitle: 'Gildevorsitz & Großkapital'
    };
  }
  // Scribe / Administration / Law
  if (lower.includes('schreib') || lower.includes('notar') || lower.includes('kanzl') || lower.includes('advokat') || lower.includes('chronist') || lower.includes('jurist') || fieldId.includes('verwaltung_recht')) {
    return {
      entryName: `Kopierbursche & Tintenträger (${clean})`,
      entryTitle: 'Einstieg & Kalligraphie',
      journeyName: clean,
      journeyTitle: 'Urkundenwesen & Aktenführung',
      specName: `Protokollar & Notariatssekretär (${clean})`,
      specTitle: 'Rechtsprüfung & Siegelung',
      masterName: `Kanzleidirektor & Hofarchivar (${clean})`,
      masterTitle: 'Staatsarchiv & Kanzleileitung'
    };
  }
  // Rogue / Thief / Subterfuge
  if (lower.includes('dieb') || lower.includes('schurke') || lower.includes('schmugg') || lower.includes('spion') || lower.includes('hehler') || lower.includes('einbrech') || fieldId === 'kriminelle_berufe' || fieldId.includes('geheimoperationen')) {
    return {
      entryName: `Gassenjunge (${clean})`,
      entryTitle: 'Einstieg & Schattenschritte',
      journeyName: clean,
      journeyTitle: 'Fingerfertigkeit & Hehlerei',
      specName: `Fingerkünstler (${clean})`,
      specTitle: 'Infiltration & Mechanik',
      masterName: `Meisterdieb (${clean})`,
      masterTitle: 'Unterweltführung & Zunftleitung'
    };
  }
  // Hunting / Forest / Tracking
  if (lower.includes('jagd') || lower.includes('jäger') || lower.includes('forst') || lower.includes('falk') || lower.includes('wild') || fieldId === 'wandernde_erkundung') {
    return {
      entryName: `Treiber & Pirschgehilfe (${clean})`,
      entryTitle: 'Einstieg & Waldläuferkunde',
      journeyName: clean,
      journeyTitle: 'Waidwerk & Spurenlesen',
      specName: `Fährtenleser & Pirschmeister (${clean})`,
      specTitle: 'Großwildsuche & Fallenbau',
      masterName: `Oberförster & Waidkapitän (${clean})`,
      masterTitle: 'Reviermeister & Jagdherrschaft'
    };
  }
  // Mining / Geology
  if (lower.includes('berg') || lower.includes('hauer') || lower.includes('knappe') || lower.includes('stollen') || lower.includes('erz') || fieldId === 'bergbau_rohstoffe') {
    return {
      entryName: `Grubenjunge & Haspelknecht (${clean})`,
      entryTitle: 'Einstieg & Wetterführung',
      journeyName: clean,
      journeyTitle: 'Gesteinsabbau & Zimmerung',
      specName: `Stollenhauer & Sprengmeister (${clean})`,
      specTitle: 'Tiefbau & Aderverfolgung',
      masterName: `Obersteiger & Grubeninspektor (${clean})`,
      masterTitle: 'Zechenleitung & Bergamt'
    };
  }
  // Agriculture / Livestock
  if (lower.includes('bauer') || lower.includes('acker') || lower.includes('hirte') || lower.includes('schäf') || lower.includes('zucht') || lower.includes('vieh') || fieldId.includes('landwirtschaft')) {
    return {
      entryName: `Hofknecht (${clean})`,
      entryTitle: 'Einstieg & Feldbestellung',
      journeyName: clean,
      journeyTitle: 'Bodenpflege & Ernteführung',
      specName: `Gutspächter & Zuchtmeister (${clean})`,
      specTitle: 'Saatgutveredelung & Stallaufsicht',
      masterName: `Hofbesitzer (${clean})`,
      masterTitle: 'Gutsverwaltung & Agrargroßbetrieb'
    };
  }
  // Tailor / Clothier / Leather
  if (lower.includes('schneider') || lower.includes('weber') || lower.includes('spinn') || lower.includes('kürschner') || lower.includes('tuch') || lower.includes('gerber') || fieldId === 'materialverarbeitung') {
    return {
      entryName: `Zuschneidegehilfe & Nadelbursche (${clean})`,
      entryTitle: 'Einstieg & Stoffzuschnitt',
      journeyName: clean,
      journeyTitle: 'Schnittmuster & Nähpraxis',
      specName: `Feingewandschneider & Tuchgraveur (${clean})`,
      specTitle: 'Seidenstickerei & Prunkgewänder',
      masterName: `Hofschneidermeister & Zunftältester (${clean})`,
      masterTitle: 'Haute Couture & Innungsführung'
    };
  }
  // Mason / Carpentry / Construction
  if (lower.includes('stein') || lower.includes('maurer') || lower.includes('zimmer') || lower.includes('tischler') || lower.includes('bau') || lower.includes('architekt') || fieldId === 'bau_handwerk') {
    return {
      entryName: `Bauhandlanger & Richtjunge (${clean})`,
      entryTitle: 'Einstieg & Baustoffkunde',
      journeyName: clean,
      journeyTitle: 'Konstruktion & Mauerwerk',
      specName: `Polier & Werkmeister (${clean})`,
      specTitle: 'Gewölbebau & Präzisionsstatik',
      masterName: `Baumeister & Archivarius (${clean})`,
      masterTitle: 'Bauherrschaft & Zunftinspektion'
    };
  }
  // Art / Music / Performance
  if (lower.includes('maler') || lower.includes('bild') || lower.includes('barde') || lower.includes('sänger') || lower.includes('musiker') || lower.includes('schauspiel') || fieldId.includes('kunst') || fieldId.includes('unterhaltung')) {
    return {
      entryName: `Farbreiber & Spielschüler (${clean})`,
      entryTitle: 'Einstieg & Harmonielehre',
      journeyName: clean,
      journeyTitle: 'Aufführung & Bildwerk',
      specName: `Porträtist & Virtuose (${clean})`,
      specTitle: 'Komposition & Meistergestaltung',
      masterName: `Hofkünstler & Akademiedirektor (${clean})`,
      masterTitle: 'Kunstkanon & Kulturelle Leitung'
    };
  }
  // Teaching / Education
  if (lower.includes('lehr') || lower.includes('dozent') || lower.includes('prof') || lower.includes('erzieh') || lower.includes('mentor') || fieldId === 'bildung_erziehung') {
    return {
      entryName: `Schulgehilfe & Präzeptoranwärter (${clean})`,
      entryTitle: 'Einstieg & Katechese',
      journeyName: clean,
      journeyTitle: 'Klassenunterricht & Didaktik',
      specName: `Magister & Studienrat (${clean})`,
      specTitle: 'Gelehrtenkolleg & Fachvortrag',
      masterName: `Schulrektor & Dekan (${clean})`,
      masterTitle: 'Universitätsleitung & Bildungskurator'
    };
  }

  // Generic fallback for any other profession
  return {
    entryName: `Lehrling (${clean}) & Nachwuchskraft`,
    entryTitle: 'Einstieg & Grundausbildung',
    journeyName: clean,
    journeyTitle: 'Fachpraxis & Ausführung',
    specName: `Fachspezialist (${clean}) & Experte`,
    specTitle: 'Spezialisierung & Vertiefung',
    masterName: `Leitender ${clean} & Fachmeister`,
    masterTitle: 'Meisterstufe & Fachleitung'
  };
}

export function getRoleSpecificPossibleRanks(
  cleanName: string,
  fieldId: string,
  rankOrder: number,
  titleName: string
): string[] {
  const lower = cleanName.toLowerCase();

  if (rankOrder === 0) {
    if (lower.includes('winzer') || lower.includes('wein') || lower.includes('kelter')) {
      return ['Weinberggehilfe', 'Kelterbursche', 'Jungwinzer'];
    }
    if (lower.includes('brauer') || lower.includes('bier') || lower.includes('mälzer')) {
      return ['Braubursche', 'Sudhausgehilfe', 'Jungbrauer'];
    }
    if (lower.includes('koch') || lower.includes('küche') || lower.includes('gastronomie')) {
      return ['Küchenjunge', 'Beikoch-Lehrling', 'Jungkoch'];
    }
    if (lower.includes('bäcker') || lower.includes('konditor')) {
      return ['Backstubenjunge', 'Teigmacher-Lehrling', 'Jungbäcker'];
    }
    if (lower.includes('gärtner') || lower.includes('garten') || lower.includes('botan')) {
      return ['Gartengehilfe', 'Beetpfleger', 'Jung-Gärtner'];
    }
    if (lower.includes('bauer') || lower.includes('landwirt') || lower.includes('acker') || fieldId.includes('landwirtschaft')) {
      return ['Hofknecht', 'Jungbauer', 'Saatgehilfe'];
    }
    if (lower.includes('fischer') || lower.includes('seemann') || lower.includes('schiff')) {
      return ['Bootsjunge', 'Decksbursche', 'Leichtmatrose'];
    }
    if (lower.includes('magi') || lower.includes('zauber') || lower.includes('arkan')) {
      return ['Arkan-Novize', 'Schriftrollenschüler', 'Adept'];
    }
    if (lower.includes('priester') || lower.includes('klerik') || lower.includes('mönch')) {
      return ['Akolyth', 'Tempelnovize', 'Klosterschüler'];
    }
    if (lower.includes('soldat') || lower.includes('krieg') || lower.includes('wache') || lower.includes('garde')) {
      return ['Rekrut', 'Garde-Anwärter', 'Wachgehilfe'];
    }
    if (lower.includes('schütze') || lower.includes('bogen')) {
      return ['Pfeiljunge', 'Spanngehilfe', 'Jungschütze'];
    }
    if (lower.includes('schmied') || lower.includes('schlosser')) {
      return ['Schmiedejunge', 'Blasebalgtreiber', 'Schmiedelehrling'];
    }
    if (lower.includes('schreiner') || lower.includes('tischler') || lower.includes('zimmer')) {
      return ['Hobeljunge', 'Zimmererlehrling', 'Schreinerlehrling'];
    }
    if (lower.includes('schneider') || lower.includes('weber')) {
      return ['Nadelbursche', 'Zuschneiderlehrling', 'Jungschneider'];
    }
    return [titleName, `Lehrling (${cleanName})`, `Nachwuchskraft (${cleanName})`];
  }

  if (rankOrder === 1) {
    return [cleanName, `Fachkraft (${cleanName})`, `Geselle (${cleanName})`];
  }

  if (rankOrder === 2) {
    return [titleName, `Senior-${cleanName}`, `Fachspezialist (${cleanName})`];
  }

  // rankOrder === 3 (Meister)
  if (lower.includes('winzer') || lower.includes('wein') || lower.includes('kelter')) {
    return ['Weingutsleiter', 'Oberkellermeister', 'Winzermeister'];
  }
  if (lower.includes('brauer') || lower.includes('bier')) {
    return ['Brauereidirektor', 'Braumeister', 'Zunftbraumeister'];
  }
  if (lower.includes('koch') || lower.includes('küche')) {
    return ['Küchenmeister', 'Chef de Cuisine', 'Küchendirektor'];
  }
  if (lower.includes('bauer') || lower.includes('landwirt')) {
    return ['Gutsbesitzer', 'Agrarmeister', 'Dorfschulze'];
  }
  return [titleName, `Zunftmeister (${cleanName})`, `Obermeister (${cleanName})`];
}

/**
 * Creates a generic fallback 4-step progression for any job name that does not have
 * a dedicated handcrafted entry in DETAILED_PROFESSION_PROGRESSIONS.
 */
export function generateDefaultRanksForJob(
  jobName: string,
  fieldId: string,
  fieldName: string
): ProfessionBranchProgression {
  const cleanName = jobName.trim();
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const titles = getRoleSpecificTitles(cleanName, fieldId);
  const tierComps = getTierCompetencySetForJob(cleanName, fieldId);

  return {
    branchKey: slug,
    branchName: cleanName,
    category: cleanName,
    description: `Berufsentwicklung, Spezialisierungen und Meisterstufe für ${cleanName} im Fachbereich ${fieldName}.`,
    ranks: [
      {
        idSuffix: 'lehrling',
        name: titles.entryName,
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: titles.entryTitle,
        description: `Einstieg in das Berufsfeld ${cleanName}: Grundausbildung, Materialkunde und Unterstützung erfahrener Kräfte.`,
        suggestedCompetencies: tierComps.lehrling,
        possibleRanks: getRoleSpecificPossibleRanks(cleanName, fieldId, 0, titles.entryName),
        nextRankName: titles.journeyName
      },
      {
        idSuffix: 'geselle',
        name: titles.journeyName,
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: titles.journeyTitle,
        description: `Reguläre, selbstständige Ausübung des Berufs als ${cleanName} mit solider Fachkenntnis.`,
        suggestedCompetencies: tierComps.geselle,
        possibleRanks: getRoleSpecificPossibleRanks(cleanName, fieldId, 1, titles.journeyName),
        requiredExperienceYears: 1,
        prerequisiteJobName: titles.entryName,
        nextRankName: titles.specName
      },
      {
        idSuffix: 'spezialist',
        name: titles.specName,
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: titles.specTitle,
        description: `Vertiefte Fachrichtung und gehobene Spezialkenntnisse als ${cleanName}.`,
        suggestedCompetencies: tierComps.spezialisierung,
        possibleRanks: getRoleSpecificPossibleRanks(cleanName, fieldId, 2, titles.specName),
        requiredExperienceYears: 2,
        prerequisiteJobName: titles.journeyName,
        nextRankName: titles.masterName
      },
      {
        idSuffix: 'meister',
        name: titles.masterName,
        tier: 'meister',
        rankOrder: 3,
        rankTitle: titles.masterTitle,
        description: `Höchste Befähigung, Ausbildungsberechtigung und meisterhafte Führungskompetenz als ${cleanName}.`,
        suggestedCompetencies: tierComps.meister,
        possibleRanks: getRoleSpecificPossibleRanks(cleanName, fieldId, 3, titles.masterName),
        requiredExperienceYears: 4,
        prerequisiteJobName: titles.specName
      }
    ]
  };
}

/**
 * Converts a ProfessionBranchProgression into an array of ProfessionTreeNodes.
 */
export function convertProgressionToNodes(
  fieldId: string,
  progression: ProfessionBranchProgression
): ProfessionTreeNode[] {
  const branchKey = progression.branchKey;
  const nodes: ProfessionTreeNode[] = [];

  progression.ranks.forEach(rankStep => {
    const nodeId = `${fieldId}.${branchKey}_${rankStep.idSuffix}`;

    // Find all potential parents (rankOrder - 1) and children (rankOrder + 1)
    const prevSteps = progression.ranks.filter(r => r.rankOrder === rankStep.rankOrder - 1);
    const nextSteps = progression.ranks.filter(r => r.rankOrder === rankStep.rankOrder + 1);

    let parentIds: string[] = [];
    if (rankStep.prerequisiteJobName) {
      const match = progression.ranks.find(r => r.name.toLowerCase().trim() === rankStep.prerequisiteJobName?.toLowerCase().trim());
      if (match) {
        parentIds = [`${fieldId}.${branchKey}_${match.idSuffix}`];
      }
    }
    if (parentIds.length === 0 && prevSteps.length > 0) {
      parentIds = prevSteps.map(p => `${fieldId}.${branchKey}_${p.idSuffix}`);
    }

    let childIds: string[] = [];
    // Next steps that explicitly target this rankStep or general next tier
    const explicitChildren = progression.ranks.filter(r => r.prerequisiteJobName?.toLowerCase().trim() === rankStep.name.toLowerCase().trim());
    if (explicitChildren.length > 0) {
      childIds = explicitChildren.map(c => `${fieldId}.${branchKey}_${c.idSuffix}`);
    } else if (nextSteps.length > 0) {
      childIds = nextSteps.map(n => `${fieldId}.${branchKey}_${n.idSuffix}`);
    }

    // Assemble prerequisites
    const prerequisites: ProfessionPrerequisite[] = [];
    if (rankStep.prerequisites && rankStep.prerequisites.length > 0) {
      prerequisites.push(...rankStep.prerequisites);
    } else {
      if (rankStep.prerequisiteJobName) {
        prerequisites.push({
          type: 'profession',
          label: rankStep.prerequisiteJobName,
          targetId: rankStep.prerequisiteJobName,
          required: true
        });
      }
      if (rankStep.requiredExperienceYears) {
        prerequisites.push({
          type: 'experience_years',
          label: `${rankStep.requiredExperienceYears} Jahr(e) Berufserfahrung`,
          minValue: rankStep.requiredExperienceYears,
          required: true
        });
      }
    }

    if (rankStep.crossBranchRequirements && rankStep.crossBranchRequirements.length > 0) {
      rankStep.crossBranchRequirements.forEach(cbr => {
        if (cbr.competencyName) {
          prerequisites.push({
            type: 'competence',
            label: cbr.competencyName,
            targetId: cbr.competencyName,
            targetFieldId: cbr.fieldId,
            targetFieldName: cbr.fieldName,
            minValue: 40,
            required: true
          });
        }
        if (cbr.professionName) {
          prerequisites.push({
            type: 'profession',
            label: cbr.professionName,
            targetId: cbr.professionName,
            targetFieldId: cbr.fieldId,
            targetFieldName: cbr.fieldName,
            required: true
          });
        }
      });
    }

    const nodeType: ProfessionNodeType =
      rankStep.nodeType ||
      (rankStep.rankOrder === 0
        ? 'training'
        : rankStep.rankOrder === 1
        ? 'profession'
        : rankStep.rankOrder === 2
        ? 'specialization'
        : 'leadership');

    nodes.push({
      id: nodeId,
      fieldId,
      name: rankStep.name,
      nodeType,
      tier: rankStep.tier,
      category: progression.branchName,
      rankOrder: rankStep.rankOrder,
      rankTitle: rankStep.rankTitle,
      nextRankProfession: rankStep.nextRankName || (nextSteps.length > 0 ? nextSteps[0].name : undefined),
      previousRankProfession: prevSteps.length > 0 ? prevSteps[0].name : undefined,
      parentIds,
      childIds,
      specializationOf: prevSteps.length > 0 ? `${fieldId}.${branchKey}_${prevSteps[0].idSuffix}` : undefined,
      description: rankStep.description,
      prerequisites,
      careerRoutes: [
        {
          id: `route_${nodeId}`,
          name: `${rankStep.name}-Prüfung / Anerkennung`,
          type: rankStep.rankOrder === 0 ? 'experience' : 'exam',
          description: `Qualifikationsschritt für die Stufe ${rankStep.rankTitle}.`,
          requirementsSummary: rankStep.requiredExperienceYears
            ? `${rankStep.requiredExperienceYears} Jahr(e) Praxis`
            : 'Offener Einstieg'
        }
      ],
      suggestedCompetencies: rankStep.suggestedCompetencies,
      possibleRanks: rankStep.possibleRanks,
      positionTitle: rankStep.positionTitle
    });
  });

  return nodes;
}

/**
 * Retrieves all profession branch progressions for a given fieldId,
 * using handcrafted progressions when available or generating full 4-tier branches.
 */
export function getBranchesForField(fieldId: string, fieldName?: string): ProfessionBranchProgression[] {
  const cleanFieldName = fieldName || fieldId;
  const branchKeys = FIELD_BRANCH_MAP[fieldId] || [];

  const branches: ProfessionBranchProgression[] = [];
  const seen = new Set<string>();

  // 1. Process manually mapped consolidated branches first
  for (const key of branchKeys) {
    if (seen.has(key)) continue;
    seen.add(key);

    if (DETAILED_PROFESSION_PROGRESSIONS[key]) {
      branches.push(DETAILED_PROFESSION_PROGRESSIONS[key]);
    } else {
      const jobName = key.charAt(0).toUpperCase() + key.slice(1);
      branches.push(generateDefaultRanksForJob(jobName, fieldId, cleanFieldName));
    }
  }

  // 2. Only if no mapped branches were defined for this field, fall back to raw preset jobs in JOB_CATEGORIES
  if (branches.length === 0) {
    const categoryPreset = JOB_CATEGORIES.find(c => c.fieldId === fieldId);
    if (categoryPreset && categoryPreset.jobs.length > 0) {
      const rawJobs = categoryPreset.jobs;
      for (const rawJob of rawJobs) {
        const parts = rawJob.split(' / ').map(p => p.trim());
        const mainJob = parts[0];
        
        // Standard key normalization
        const mainKey = mainJob.toLowerCase().replace(/[^a-z0-9]/g, '_');
        // German umlaut aware normalization
        const umKey = mainJob.toLowerCase()
          .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
          .replace(/[^a-z0-9]/g, '_');

        if (seen.has(mainKey) || seen.has(umKey)) continue;
        
        seen.add(mainKey);
        seen.add(umKey);

        if (DETAILED_PROFESSION_PROGRESSIONS[mainKey]) {
          branches.push(DETAILED_PROFESSION_PROGRESSIONS[mainKey]);
        } else if (DETAILED_PROFESSION_PROGRESSIONS[umKey]) {
          branches.push(DETAILED_PROFESSION_PROGRESSIONS[umKey]);
        } else {
          branches.push(generateDefaultRanksForJob(mainJob, fieldId, cleanFieldName));
        }
      }
    }
  }

  // Ultimate fallback
  if (branches.length === 0) {
    return [generateDefaultRanksForJob(`Fachkraft für ${cleanFieldName}`, fieldId, cleanFieldName)];
  }
  
  return branches;
}
