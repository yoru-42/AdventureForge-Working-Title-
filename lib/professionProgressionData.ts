import { ProfessionTreeNode, ProfessionNodeTier } from './professionTreeData';
import { JOB_CATEGORIES } from '../components/jobPresets';

export interface ProfessionRankStep {
  idSuffix: string;
  name: string;
  tier: ProfessionNodeTier;
  rankOrder: number; // 0 = Lehrling, 1 = Geselle/Grundstufe, 2 = Spezialisierung/Beförderung, 3 = Meisterstufe
  rankTitle: string;
  description: string;
  suggestedCompetencies: string[];
  possibleRanks: string[];
  requiredExperienceYears?: number;
  prerequisiteJobName?: string;
  nextRankName?: string;
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
        name: 'Schmiedejunge & Essegehilfe',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Essegehilfe',
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
        possibleRanks: ['Schmiedegeselle', 'Grobschmied', 'Dorfschmied'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Schmiedejunge & Essegehilfe',
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
        possibleRanks: ['Klingenschmied', 'Waffenschmied', 'Rüstzeugschmied'],
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
        possibleRanks: ['Plattner', 'Harnischmacher', 'Panzerschmied'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Schmied',
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
        possibleRanks: ['Schmiedemeister', 'Zunftobermeister', 'Hofschmied'],
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
        possibleRanks: ['Schwertmeister', 'Klingengroßmeister', 'Hofschwertschmied'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Waffenschmied'
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
        name: 'Werkstattbursche & Getriebegehilfe',
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
        description: 'Bau und Instandhaltung mechanischer Apparate, Winden, Flaschenzüge und Wasserradantriebe.',
        suggestedCompetencies: ['Getriebebau', 'Hebelgesetze', 'Federspannung', 'Präzisionsmontage'],
        possibleRanks: ['Mechanikergeselle', 'Getriebetechniker', 'Maschinist'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Werkstattbursche & Getriebegehilfe',
        nextRankName: 'Feinmechaniker / Uhrmacher'
      },
      {
        idSuffix: 'feinmechaniker',
        name: 'Feinmechaniker / Uhrmacher',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Fertigung kleinster Zahnräder, Chronometer, Taschenuhren, Schlösser und Messinstrumente.',
        suggestedCompetencies: ['Mikrogetriebe', 'Unruh & Spiralfeder', 'Uhrwerkhemmung', 'Schlossmechanik'],
        possibleRanks: ['Feinmechaniker', 'Uhrmacher', 'Chronometrist'],
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
        description: 'Vollendeter Ingenieur und Erfinder monumentaler Getriebe, Automaten und Hebevorrichtungen.',
        suggestedCompetencies: ['Automatenkonstruktion', 'Ingenieurmathematik', 'Meisterwerk', 'Hydraulik & Winden'],
        possibleRanks: ['Oberingenieur', 'Mechanicus', 'Meistermechaniker'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Feinmechaniker / Uhrmacher'
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
        name: 'Klangschüler & Holzschnitzer',
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
        prerequisiteJobName: 'Klangschüler & Holzschnitzer',
        nextRankName: 'Geigen- & Lautenbauer'
      },
      {
        idSuffix: 'geigenbauer',
        name: 'Geigen- & Lautenbauer',
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
        name: 'Orgel- & Blasinstrumentenbauer',
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
        prerequisiteJobName: 'Geigen- & Lautenbauer'
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
        name: 'Schlosserjunge & Feilbursche',
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
        prerequisiteJobName: 'Schlosserjunge & Feilbursche',
        nextRankName: 'Kunstschmied & Zierschlosser'
      },
      {
        idSuffix: 'kunstschmied',
        name: 'Kunstschmied & Zierschlosser',
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
        name: 'Tresor- & Schließtechniker',
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
        prerequisiteJobName: 'Tresor- & Schließtechniker'
      }
    ]
  },

  giesser: {
    branchKey: 'giesser',
    branchName: 'Gießer',
    category: 'Gießer',
    description: 'Schmelzen und Gießen von Bronze, Messing, Zinn und Glockenbronze in Formen.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Schmelzergehilfe & Tiegelbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Tiegelbursche',
        description: 'Formsand aufbereiten, Tiegel heizen und Schmelzöfen reinigen.',
        suggestedCompetencies: ['Formsand mischen', 'Schmelzofen pflegen', 'Tiegelhandhabung', 'Hitzeschutz'],
        possibleRanks: ['Gießerjunge', 'Tiegelbursche', 'Schmelzergehilfe'],
        nextRankName: 'Bronzegießer'
      },
      {
        idSuffix: 'geselle',
        name: 'Bronzegießer / Metallgießer',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Selbstständiges Gießen von Statuetten, Beschlägen, Töpfen und Glockenrohlingen.',
        suggestedCompetencies: ['Formkastenbau', 'Schmelzführung Bronze', 'Gussreinigung', 'Ziselieren'],
        possibleRanks: ['Gussgeselle', 'Bronzegießer', 'Zinngießer'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Schmelzergehilfe & Tiegelbursche',
        nextRankName: 'Glockengießer'
      },
      {
        idSuffix: 'glockengiesser',
        name: 'Glockengießer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Präziser Guss tonreiner Kirchenglocken und monumentaler Klangkörper.',
        suggestedCompetencies: ['Glockenrippe berechnen', 'Klangstimmung Glocke', 'Lehmformverfahren', 'Großschmelze'],
        possibleRanks: ['Glockengießer', 'Klanggießer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Bronzegießer / Metallgießer',
        nextRankName: 'Meistergießer'
      },
      {
        idSuffix: 'kanonengiesser',
        name: 'Kanonengießer / Zeuggussmeister',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Gießen dickwandiger Geschütze, Mörser und Artillerierohre aus schwerer Bronze.',
        suggestedCompetencies: ['Kanonenguss', 'Kernbohrung', 'Druckfestigkeitsprüfung', 'Hohlformguss'],
        possibleRanks: ['Geschützgießer', 'Zeuggießer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Bronzegießer / Metallgießer',
        nextRankName: 'Meistergießer'
      },
      {
        idSuffix: 'meistergiesser',
        name: 'Meistergießer',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Höchste zünftige Meisterschaft in Großguss, Statuenguss und Glockenintonation.',
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
        name: 'Küchenjunge & Schürzenbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Küchenjunge',
        description: 'Gemüse putzen, Fleisch parieren, Feuer im Herd schüren und Küchenhygiene.',
        suggestedCompetencies: ['Mise en place', 'Messerführung', 'Herdfeuerregulierung', 'Küchenhygiene'],
        possibleRanks: ['Küchenjunge', 'Schürzenbursche', 'Beikoch'],
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
        prerequisiteJobName: 'Küchenjunge & Schürzenbursche',
        nextRankName: 'Gourmet- & Saucenkoch'
      },
      {
        idSuffix: 'gourmetkoch',
        name: 'Gourmet- & Saucenkoch',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Erlesene Menüs, Fonds, feine Saucen und Festtagsgerichte für Adlige und Gildenbankette.',
        suggestedCompetencies: ['Saucenreduktion', 'Festmenü-Konzeption', 'Edle Gewürze', 'Fleischreifung'],
        possibleRanks: ['Saucier', 'Chef de Partie', 'Festkoch'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Koch',
        nextRankName: 'Hofküchenmeister'
      },
      {
        idSuffix: 'feldkoch',
        name: 'Feld- & Großküchenkoch',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Verpflegung von Karawanen, Heeren und Festgesellschaften mit nahrhafter Großverpflegung.',
        suggestedCompetencies: ['Rationswirtschaft', 'Kesselkochen', 'Proviantlagerung', 'Mengenplanung'],
        possibleRanks: ['Feldkoch', 'Quartiermeister-Koch', 'Trosskoch'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Koch',
        nextRankName: 'Hofküchenmeister'
      },
      {
        idSuffix: 'hofkuechenmeister',
        name: 'Hofküchenmeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meisterstufe',
        description: 'Leiter fürstlicher Palastküchen, Zeremonienbankette und kulinarischer Großveranstaltungen.',
        suggestedCompetencies: ['Küchenmeisterei', 'Bankettinszenierung', 'Gourmetkuration', 'Palastverpflegung'],
        possibleRanks: ['Hofküchenchef', 'Chef de Cuisine', 'Küchenmeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Gourmet- & Saucenkoch'
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
        name: 'Bäckerjunge & Teigkneter',
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
        prerequisiteJobName: 'Bäckerjunge & Teigkneter',
        nextRankName: 'Konditor & Zuckerbäcker'
      },
      {
        idSuffix: 'konditor',
        name: 'Konditor & Zuckerbäcker',
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
        prerequisiteJobName: 'Konditor & Zuckerbäcker'
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
        name: 'Braubursche & Fasswäscher',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Braubursche',
        description: 'Fassreinigung, Maische rühren, Darren überwachen und Kessel anheizen.',
        suggestedCompetencies: ['Fässer pechen', 'Sudkessel heizen', 'Getreide reinigen', 'Wasserqualität prüfen'],
        possibleRanks: ['Braubursche', 'Fasswäscher', 'Mälzergehilfe'],
        nextRankName: 'Brauer & Mälzer'
      },
      {
        idSuffix: 'geselle',
        name: 'Brauer & Mälzer',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Mälzen, Maischen, Kochen von Würze und Gärungsüberwachung im Schankbrauhaus.',
        suggestedCompetencies: ['Maischeführung', 'Hopfengabe', 'Gärungskontrolle', 'Hefepflege'],
        possibleRanks: ['Braugeselle', 'Sudgeselle', 'Mälzer'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Braubursche & Fasswäscher',
        nextRankName: 'Kellermeister & Biersommelier'
      },
      {
        idSuffix: 'kellermeister',
        name: 'Kellermeister & Biersommelier',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Lagerung, Reifung in Holzfässern, Veredelung alter Ales und Qualitätsverkostung.',
        suggestedCompetencies: ['Fassreifung', 'Geschmacksprofile', 'Klärung & Lagerung', 'Schanksysteme'],
        possibleRanks: ['Kellermeister', 'Biersommelier', 'Sudmeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Brauer & Mälzer',
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
        prerequisiteJobName: 'Kellermeister & Biersommelier'
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
        name: 'Fleischerbursche & Pökelgehilfe',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Fleischerbursche',
        description: 'Reinigung des Schlachthauses, Messer schärfen, Därme putzen und Pökelbottiche füllen.',
        suggestedCompetencies: ['Messer schärfen', 'Schlachthygiene', 'Salzen & Pökeln', 'Kühlung'],
        possibleRanks: ['Fleischerbursche', 'Pökelgehilfe', 'Schlachthofjunge'],
        nextRankName: 'Metzger & Fleischer'
      },
      {
        idSuffix: 'geselle',
        name: 'Metzger & Fleischer',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Grundstufe / Geselle',
        description: 'Zerwirken von Rindern, Schweinen und Wild sowie Zuschnitt bester Fleischteile.',
        suggestedCompetencies: ['Zerlegetechnik', 'Knochen auslösen', 'Fleischreifung', 'Kundenzuschnitt'],
        possibleRanks: ['Fleischergeselle', 'Metzger'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Fleischerbursche & Pökelgehilfe',
        nextRankName: 'Wurstmacher & Pökelspezialist'
      },
      {
        idSuffix: 'wurstmacher',
        name: 'Wurstmacher & Pökelspezialist',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Beförderung & Spezialisierung',
        description: 'Rezepturen für Dauerwürste, Pasteten, Schinken und traditionelle Räucherverfahren.',
        suggestedCompetencies: ['Brätbereitung', 'Wurstabfüllung', 'Heiß- & Kalträuchern', 'Gewürzmischung'],
        possibleRanks: ['Wurstmacher', 'Räuchermeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Metzger & Fleischer',
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
        prerequisiteJobName: 'Wurstmacher & Pökelspezialist'
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
        name: 'Laufbursche & Hauspage',
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
        prerequisiteJobName: 'Laufbursche & Hauspage',
        nextRankName: 'Kammerdiener & Tafeldiener'
      },
      {
        idSuffix: 'kammerdiener',
        name: 'Kammerdiener & Tafeldiener',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Vertrauensstellung & Tafelaufsicht',
        description: 'Vertrauter Leibdienst, Garderobenaufsicht, Tafelbedienung und Verwaltung persönlicher Briefe.',
        suggestedCompetencies: ['Leibdienst', 'Tafelsilberaufsicht', 'Etikette', 'Geheimhaltung'],
        possibleRanks: ['Kammerdiener', 'Valet', 'Tafelmeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Diener',
        nextRankName: 'Haushofmeister & Majordomus'
      },
      {
        idSuffix: 'majordomus',
        name: 'Haushofmeister & Majordomus',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Hausleitung & Residenzführung',
        description: 'Gesamtleitung des herrschaftlichen Gesindes, Inventarführung, Wirtschaftsrechnung und Bankettkoordination.',
        suggestedCompetencies: ['Gesindeaufsicht', 'Wirtschaftsbuchführung', 'Bankettorganisation', 'Residenzverwaltung'],
        possibleRanks: ['Haushofmeister', 'Majordomus', 'Kastellan'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Kammerdiener & Tafeldiener'
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
        name: 'Stubenmädchen & Gemachgehilfin',
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
        prerequisiteJobName: 'Stubenmädchen & Gemachgehilfin',
        nextRankName: 'Kammerjungfer & Garderobiere'
      },
      {
        idSuffix: 'kammerjungfer',
        name: 'Kammerjungfer & Garderobiere',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Garderoben- & Toilettenaufsicht',
        description: 'Verwaltung erlesener Seidengewänder, Perlen, Ballgarderoben und privater Schatullen.',
        suggestedCompetencies: ['Garderobenverwaltung', 'Schmuckpflege', 'Ballvorbereitung', 'Feine Kosmetik'],
        possibleRanks: ['Kammerjungfer', 'Garderobiere', 'Erste Zofe'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Zofe',
        nextRankName: 'Oberhofdame & Erste Hausdame'
      },
      {
        idSuffix: 'oberhofdame',
        name: 'Oberhofdame & Erste Hausdame',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Residenz- & Damenpalastleitung',
        description: 'Leitung des weiblichen Hauspersonals, Repräsentation und Hofzeremoniell.',
        suggestedCompetencies: ['Hofdamenführung', 'Zeremoniell', 'Etikette-Kodex', 'Palastwirtschaft'],
        possibleRanks: ['Oberhofdame', 'Erste Hausdame', 'Hofgouvernante'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Kammerjungfer & Garderobiere'
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
        name: 'Unterbutler & Saalbursche',
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
        prerequisiteJobName: 'Unterbutler & Saalbursche',
        nextRankName: 'Chefbutler & Silberkämmerer'
      },
      {
        idSuffix: 'chefbutler',
        name: 'Chefbutler & Silberkämmerer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Silberkammer & Repräsentation',
        description: 'Leitung der Diners, Weinreisekeller, Beaufsichtigung des herrschaftlichen Fuhrparks und Silberschatzes.',
        suggestedCompetencies: ['Jahrgangsweinkunde', 'Protokollarische Rangfolge', 'Silberkammervorsitz', 'VIP-Gästebetreuung'],
        possibleRanks: ['Chefbutler', 'Silberkämmerer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Butler',
        nextRankName: 'Großhofmeister & Seneschall'
      },
      {
        idSuffix: 'seneschall',
        name: 'Großhofmeister & Seneschall',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Oberste Schloss- & Hofleitung',
        description: 'Vollkommene Schirmherrschaft über den Palast, fürstliche Bankette und diplomatische Empfänge.',
        suggestedCompetencies: ['Seneschallamt', 'Staatsbankette', 'Oberste Etikette', 'Residenzbudget'],
        possibleRanks: ['Großhofmeister', 'Seneschall', 'Oberstkämmerer'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Chefbutler & Silberkämmerer'
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
        name: 'Rekrut & Trossknecht',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Rekrutenausbildung',
        description: 'Exerzieren, Waffeninstandhaltung, Lagerbau und Formationsgrundlagen.',
        suggestedCompetencies: ['Waffenpflege', 'Formationsmarsch', 'Wachbereitschaft', 'Schilddeckung'],
        possibleRanks: ['Rekrut', 'Trossknecht', 'Musketieranwärter'],
        nextRankName: 'Infanterist & Landsknecht'
      },
      {
        idSuffix: 'geselle',
        name: 'Infanterist & Landsknecht',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Garnisons- & Felddienst',
        description: 'Gefechtseinsatz in der Phalanx, Stadtpatrouille und Wehrturmsicherung.',
        suggestedCompetencies: ['Pikenkampf', 'Schildwall', 'Nachtwache', 'Klingenführung'],
        possibleRanks: ['Infanterist', 'Landsknecht', 'Gefreiter'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Rekrut & Trossknecht',
        nextRankName: 'Gardist & Wehrmeister'
      },
      {
        idSuffix: 'gardist',
        name: 'Gardist & Wehrmeister',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Garde & Gefechtstaktik',
        description: 'Palastgarde, persönliche Leibwacht von Kommandanten und taktische Sturmspitze.',
        suggestedCompetencies: ['Zweikampf', 'Gardeformation', 'Gefechtstaktik', 'Belagerungsabwehr'],
        possibleRanks: ['Gardist', 'Wehrmeister', 'Fähnrich'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Infanterist & Landsknecht',
        nextRankName: 'Feldwebel & Hauptmann'
      },
      {
        idSuffix: 'hauptmann',
        name: 'Feldwebel & Hauptmann',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Truppenkommando & Regimentsleitung',
        description: 'Befehlshaber über Kompanien, Festungsregimenter und strategische Feldzüge.',
        suggestedCompetencies: ['Truppenführung', 'Schlachtfeldstrategie', 'Garnisonsverwaltung', 'Offizierskorps'],
        possibleRanks: ['Feldwebel', 'Hauptmann', 'Festungskommandant'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Gardist & Wehrmeister'
      }
    ]
  },

  // ===========================================================================
  // SEEFAHRT (seefahrt)
  // ===========================================================================
  seemann: {
    branchKey: 'seemann',
    branchName: 'Seemann',
    category: 'Seemann',
    description: 'Hochseeschifffahrt, Takelageklettern, Rudern, Knoten und Sturmbeherrschung.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Schiffsjunge & Decksbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Takelagedienst',
        description: 'Decks schrubben, Tauwerk aufschießen, Rumpfkalfaterung und Segel hissen.',
        suggestedCompetencies: ['Knotenkunde', 'Decksdienst', 'Bilgenpumpen', 'Takelageklettern'],
        possibleRanks: ['Schiffsjunge', 'Decksbursche'],
        nextRankName: 'Leichtmatrose'
      },
      {
        idSuffix: 'geselle',
        name: 'Leichtmatrose',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Wachdienst & Decksarbeit',
        description: 'Selbstständige Seemannschaft, Ausguck, Reffen bei Seegang und Beibootführung.',
        suggestedCompetencies: ['Segel setzen', 'Ausguck & Wetterzeichen', 'Rudergehen', 'Kabelgattpflege'],
        possibleRanks: ['Matrose', 'Vollmatrose'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Schiffsjunge & Decksbursche',
        nextRankName: 'Vollmatrose & Bootsmann'
      },
      {
        idSuffix: 'bootsmann',
        name: 'Vollmatrose & Bootsmann',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Takelageführung & Segelaufsicht',
        description: 'Leitung der Wachen, Havariebekämpfung, Anker- und Takelagemeisterschaft auf hoher See.',
        suggestedCompetencies: ['Bootsmannswache', 'Havariebehebung', 'Strömungskunde', 'Decksdisziplin'],
        possibleRanks: ['Bootsmann', 'Quartiermeister', 'Kabelgattmeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Leichtmatrose',
        nextRankName: 'Oberbootsmann & Segelmeister'
      },
      {
        idSuffix: 'segelmeister',
        name: 'Oberbootsmann & Segelmeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Decksleitung & Schiffsbetrieb',
        description: 'Oberste operative Führung des Schiffsbetriebs unter dem Kapitän, Segel- und Ausrüstungsdirektion.',
        suggestedCompetencies: ['Flottenmanöver', 'Sturmtaktik', 'Schiffsführung', 'Rigg-Konstruktion'],
        possibleRanks: ['Oberbootsmann', 'Segelmeister', 'Schiffer'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Vollmatrose & Bootsmann'
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
        name: 'Arkan-Novize & Schriftrollenschüler',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Mana-Grundlagen',
        description: 'Lesen alter Folianten, Schriftrollenkopieren, Mana-Meditation und erste Funkenzauber.',
        suggestedCompetencies: ['Mana-Fokussierung', 'Runenschrift lesen', 'Kreidekreis ziehen', 'Foliantenpflege'],
        possibleRanks: ['Novize', 'Akademie-Adept', 'Schriftrollenschüler'],
        nextRankName: 'Magier & Zauberer'
      },
      {
        idSuffix: 'geselle',
        name: 'Magier & Zauberer',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Spruchpraxis & Ritualistik',
        description: 'Stabile Bannungen, Elementargeschosse, Lichtzauber und Identifikation magischer Auren.',
        suggestedCompetencies: ['Spruchkanalisierung', 'Aura wahrnehmen', 'Schutzschilde', 'Gedankendisziplin'],
        possibleRanks: ['Magier', 'Spruchweber', 'Elementarist'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Arkan-Novize & Schriftrollenschüler',
        nextRankName: 'Elementarmagier & Siegelweber'
      },
      {
        idSuffix: 'elementarmagier',
        name: 'Elementarmagier & Siegelweber',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Elementarbindung & Runenmatrix',
        description: 'Herrschaft über Feuerstürme, Eiswälle, Teleportation und permanente magische Siegel.',
        suggestedCompetencies: ['Elementare Großzauber', 'Runenmatrix weben', 'Telekinese', 'Dimensionsrisse schließen'],
        possibleRanks: ['Elementarmagier', 'Siegelmeister', 'Arkanweber'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Magier & Zauberer',
        nextRankName: 'Erzmagier & Magister Artium'
      },
      {
        idSuffix: 'erzmagier',
        name: 'Erzmagier & Magister Artium',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Arkaner Konvent & Hochmagie',
        description: 'Sitz im Hohen Arkanrat, Erschaffung fliegender Zitadellen und Meisterung der Sphärenmagie.',
        suggestedCompetencies: ['Sphärenmagie', 'Großritualleitung', 'Arkane Schöpfung', 'Konventsleitung'],
        possibleRanks: ['Erzmagier', 'Großinquisitor der Magie', 'Magister Artium'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Elementarmagier & Siegelweber'
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
        name: 'Kontorbursche & Laufgehilfe',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Kontorarbeiten',
        description: 'Frachtbriefe abstempeln, Kisten wiegen, Münzen wiegen und Botengänge zur Börse.',
        suggestedCompetencies: ['Münzwaage bedienen', 'Rechnen & Buchführen', 'Frachtkontrolle', 'Warenlagern'],
        possibleRanks: ['Kontorbursche', 'Handelsjunge', 'Laufgehilfe'],
        nextRankName: 'Kaufmann & Händler'
      },
      {
        idSuffix: 'geselle',
        name: 'Kaufmann & Händler',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Warenverkehr & Ladengeschäft',
        description: 'Eigenständiges Führen eines Ladengeschäfts, Einkauf von Kolonial- und Zunftwaren.',
        suggestedCompetencies: ['Feilschkunst', 'Kalkulation & Gewinnspanne', 'Zollabwicklung', 'Kundenbetreuung'],
        possibleRanks: ['Krämer', 'Kaufmann', 'Kontorist'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Kontorbursche & Laufgehilfe',
        nextRankName: 'Fernhändler & Faktoreileiter'
      },
      {
        idSuffix: 'fernhaendler',
        name: 'Fernhändler & Faktoreileiter',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Karawanenhandel & Großposten',
        description: 'Organisation von Handelskarawanen, Schiffsbefrachtung und Verwaltung von Übersee-Faktoreien.',
        suggestedCompetencies: ['Karawanenlogistik', 'Seefrachtverträge', 'Devisenhandel', 'Großhandelsrabatte'],
        possibleRanks: ['Fernhändler', 'Faktoreileiter', 'Hanseat'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Kaufmann & Händler',
        nextRankName: 'Handelsherr & Großpatrizier'
      },
      {
        idSuffix: 'handelsherr',
        name: 'Handelsherr & Großpatrizier',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Gildevorsitz & Großkapital',
        description: 'Herrschaft über Handelshäuser, Finanzierung von Expeditionen und Sitz im Stadtpatriziat.',
        suggestedCompetencies: ['Handelsimperium leiten', 'Expeditionsfinanzierung', 'Gildevorsitz', 'Monopolpolitik'],
        possibleRanks: ['Handelsherr', 'Großpatrizier', 'Gildeältester'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Fernhändler & Faktoreileiter'
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
        name: 'Hofknecht & Saatjunge',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Feldbestellung',
        description: 'Stall ausmisten, Steine vom Acker klauben, Wasser tragen und Ochsen führen.',
        suggestedCompetencies: ['Feldarbeit', 'Viehfütterung', 'Werkzeuginstandhaltung', 'Wetterkunde Grundlagen'],
        possibleRanks: ['Hofknecht', 'Saatjunge', 'Pfluggehilfe'],
        nextRankName: 'Bauer & Ackerwirt'
      },
      {
        idSuffix: 'geselle',
        name: 'Bauer & Ackerwirt',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Bodenwirtschaft & Feldbau',
        description: 'Eigenverantwortliches Bestellen der Scholle, Dreifelderwirtschaft, Ernte und Dreschen.',
        suggestedCompetencies: ['Pflügen & Eggen', 'Dreifelderwirtschaft', 'Ernteplanung', 'Kornlagerung'],
        possibleRanks: ['Ackerbauer', 'Freibauer', 'Hufner'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Hofknecht & Saatjunge',
        nextRankName: 'Gutspächter & Saatzüchter'
      },
      {
        idSuffix: 'gutspaechter',
        name: 'Gutspächter & Saatzüchter',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Saatgutveredelung & Vorratswirtschaft',
        description: 'Zucht widerstandsfähiger Getreidesorten, Bewässerungsgräben und Bewirtschaftung großer Gutshöfe.',
        suggestedCompetencies: ['Saatgutzucht', 'Bewässerungsbau', 'Siloverwaltung', 'Knechte anleiten'],
        possibleRanks: ['Gutspächter', 'Saatzüchter', 'Meier'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Bauer & Ackerwirt',
        nextRankName: 'Hofbesitzer & Dorfschulze'
      },
      {
        idSuffix: 'dorfschulze',
        name: 'Hofbesitzer & Dorfschulze',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Dorfleitung & Großbauernwirtschaft',
        description: 'Repräsentation der bäuerlichen Gemeinschaft, Zehntabrechnung mit dem Grundherrn und Großagrarleitung.',
        suggestedCompetencies: ['Dorfgericht', 'Zehntverwaltung', 'Genossenschaftswesen', 'Agrarökonomie'],
        possibleRanks: ['Dorfschulze', 'Großhofherr', 'Bauernältester'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Gutspächter & Saatzüchter'
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
        name: 'Akolyth & Tempelnovize',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Liturgiedienst',
        description: 'Weihrauchschwenken, Altarkerzen entzünden, Gesangsbücher tragen und Gebetszeiten einhalten.',
        suggestedCompetencies: ['Liturgiegesang', 'Weihrauchdienst', 'Heilige Texte rezitieren', 'Altarordnung'],
        possibleRanks: ['Akolyth', 'Tempelnovize', 'Messdiener'],
        nextRankName: 'Priester & Kleriker'
      },
      {
        idSuffix: 'geselle',
        name: 'Priester & Kleriker',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Gemeindeseelsorge & Andacht',
        description: 'Abhalten von Messen, Taufen, Krankenölungen, Segen und geistliche Seelsorge.',
        suggestedCompetencies: ['Seelsorge & Beichte', 'Segnungsriten', 'Predigtlehre', 'Religionsunterricht'],
        possibleRanks: ['Priester', 'Pfarrer', 'Kleriker'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Akolyth & Tempelnovize',
        nextRankName: 'Dompropst & Zeremonienmeister'
      },
      {
        idSuffix: 'dompropst',
        name: 'Dompropst & Zeremonienmeister',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Zeremonien & Sakramente',
        description: 'Leitung von Kathedralen, Erteilung hoher Sakramente und Verwaltung der Kirchenschätze.',
        suggestedCompetencies: ['Hochliturgie', 'Kathedralverwaltung', 'Kirchenrecht', 'Theologische Disputation'],
        possibleRanks: ['Dompropst', 'Erzpriester', 'Prälat'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Priester & Kleriker',
        nextRankName: 'Bischof & Hochkleriker'
      },
      {
        idSuffix: 'bischof',
        name: 'Bischof & Hochkleriker',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Diözesanleitung & Oberster Konvent',
        description: 'Führung der gesamten Diözese, Priesterweihe, kirchenpolitische Vertretung vor Kronen und Göttern.',
        suggestedCompetencies: ['Priesterweihe', 'Diözesanführung', 'Kirchenkonzil', 'Glaubenskanon'],
        possibleRanks: ['Bischof', 'Erzbischof', 'Patriarch'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Dompropst & Zeremonienmeister'
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
        name: 'Gassenjunge & Schnüffler',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Schattenschritte',
        description: 'Spähen nach Wachen, Ablenken von Markthändlern und Schnelles Fliehen durch enge Gassen.',
        suggestedCompetencies: ['Gassenkunde', 'Ablenkung', 'Wachbeobachtung', 'Schneller Antritt'],
        possibleRanks: ['Gassenjunge', 'Beutelspäher'],
        nextRankName: 'Taschendieb & Beutelschneider'
      },
      {
        idSuffix: 'geselle',
        name: 'Taschendieb & Beutelschneider',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Fingerfertigkeit & Ablenkung',
        description: 'Geschicktes Abtrennen von Münzbeuteln, Herausziehen von Uhren und unauffälliger Taschendiebstahl.',
        suggestedCompetencies: ['Fingerfertigkeit', 'Gedränge nutzen', 'Gegenstände weiterreichen', 'Fluchtwege'],
        possibleRanks: ['Beutelschneider', 'Taschendieb', 'Langfinger'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Gassenjunge & Schnüffler',
        nextRankName: 'Fingerkünstler & Schlösserknacker'
      },
      {
        idSuffix: 'fingerkuenstler',
        name: 'Fingerkünstler & Schlösserknacker',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Infiltration & Präzisionsdiebstahl',
        description: 'Knacken komplizierter Vorhängeschlösser, Entwenden von Siegelringen vom schlafenden Finger.',
        suggestedCompetencies: ['Dietrichführung', 'Schmuckentwendung', 'Schleichen im Dunkeln', 'Hehlerkontakte'],
        possibleRanks: ['Fingerkünstler', 'Schlösserknacker', 'Schattenkriecher'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Taschendieb & Beutelschneider',
        nextRankName: 'Meisterdieb & Schattenfürst'
      },
      {
        idSuffix: 'meisterdieb',
        name: 'Meisterdieb & Schattenfürst',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Gildenführung & Meisterstreifzug',
        description: 'Leitung der Diebesgilde, Planung legendärer Museumseinbrüche und Schirmherrschaft des Untergrunds.',
        suggestedCompetencies: ['Meistercoups planen', 'Diebesgildenführung', 'Schattensysteme', 'Untergrundkodex'],
        possibleRanks: ['Meisterdieb', 'Schattenfürst', 'Zunftoberhaupt der Diebe'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Fingerkünstler & Schlösserknacker'
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
        name: 'Spiellehrling & Reimschmied',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Lautenspiel',
        description: 'Akkorde lernen, Reime finden, Schellen schütteln und Hüte für Kupfermünzen herumreichen.',
        suggestedCompetencies: ['Grundakkorde Laute', 'Reimlehre', 'Stimmbildung', 'Bühnenpräsenz'],
        possibleRanks: ['Spiellehrling', 'Reimschmied', 'Kupfersänger'],
        nextRankName: 'Barde & Spielmann'
      },
      {
        idSuffix: 'geselle',
        name: 'Barde & Spielmann',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Wirtshausgesang & Balladen',
        description: 'Vortrag epischer Balladen, Tanzmusik auf Marktplätzen und Aufheiterung müder Reisender.',
        suggestedCompetencies: ['Balladenvortrag', 'Tanzweisen', 'Geschichtenerzählen', 'Publikumsstimmung'],
        possibleRanks: ['Spielmann', 'Gauklerbarde', 'Sänger'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Spiellehrling & Reimschmied',
        nextRankName: 'Minnesänger & Hofskalde'
      },
      {
        idSuffix: 'minnesaenger',
        name: 'Minnesänger & Hofskalde',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Hoflyrik & Heldenepen',
        description: 'Erlesene Minnelieder für Königinnen, heroische Skaldenepen und diplomatische Spottverse.',
        suggestedCompetencies: ['Minnelyrik', 'Heldenepos dichten', 'Harfenvirtuosität', 'Höfische Gunst'],
        possibleRanks: ['Minnesänger', 'Hofskalde', 'Troubadour'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Barde & Spielmann',
        nextRankName: 'Oberbarde & Fürstensänger'
      },
      {
        idSuffix: 'oberbarde',
        name: 'Oberbarde & Fürstensänger',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Akademieleitung & Gesangskrone',
        description: 'Leiter der Sängerakademie, Verleiher der Goldenen Lorbeeren und Hofdichter von Kaisern.',
        suggestedCompetencies: ['Eposkomposition', 'Bardenkollegium', 'Macht des Liedes', 'Kulturelle Schirmherrschaft'],
        possibleRanks: ['Oberbarde', 'Fürstensänger', 'Meistersänger'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Minnesänger & Hofskalde'
      }
    ]
  },

  // ===========================================================================
  // LUXUS & EDELMETALLE (luxus_spezial)
  // ===========================================================================
  goldschmied: {
    branchKey: 'goldschmied',
    branchName: 'Goldschmied',
    category: 'Goldschmied',
    description: 'Veredelung von Gold, Platin und Silber zu erlesenen Diademen, Ketten und Siegelringen.',
    ranks: [
      {
        idSuffix: 'lehrling',
        name: 'Schmelzjunge & Polierlehrling',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Edelmetallwäsche',
        description: 'Goldstaub auffangen, Tiegel polieren, Zieheisen vorbereiten und Feilung trennen.',
        suggestedCompetencies: ['Goldstaubrückgewinnung', 'Lötfeuer bedienen', 'Polieren', 'Feingehalt prüfen'],
        possibleRanks: ['Goldschmiedelehrling', 'Polierjunge'],
        nextRankName: 'Goldschmied'
      },
      {
        idSuffix: 'geselle',
        name: 'Goldschmied',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Edelmetallschmuck & Legierungen',
        description: 'Schmieden von Trauringen, Broschen, Zierfibeln und feinen Goldketten.',
        suggestedCompetencies: ['Löttechnik Gold', 'Drahtziehen & Walzen', 'Gravurwerkzeuge', 'Legierungskunde'],
        possibleRanks: ['Goldschmiedegeselle', 'Juwelenschmied'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Schmelzjunge & Polierlehrling',
        nextRankName: 'Filigranschmied & Gemmensetzer'
      },
      {
        idSuffix: 'filigranschmied',
        name: 'Filigranschmied & Gemmensetzer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Edelsteinfassung & Granulation',
        description: 'Präzises Einbinden von Diamanten, Saphiren und Smaragden in filigrane Krappenfassungen.',
        suggestedCompetencies: ['Krappenfassung', 'Granulationskunst', 'Edelsteinfassungen', 'Mikrogravur'],
        possibleRanks: ['Gemmensetzer', 'Filigranschmied', 'Juwelier'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Goldschmied',
        nextRankName: 'Hofgoldschmied & Kronjuwelier'
      },
      {
        idSuffix: 'kronjuwelier',
        name: 'Hofgoldschmied & Kronjuwelier',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Insignien & Kronjuwelen',
        description: 'Fertigung von Reichskronen, Szeptern, Zeremonienschwertern und kaiserlichen Insignien.',
        suggestedCompetencies: ['Kronenarchitektur', 'Historische Schmuckrestauration', 'Reichsinsignien', 'Zunftgutachten'],
        possibleRanks: ['Hofgoldschmied', 'Kronjuwelier', 'Oberstmeister der Juwelierzunft'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Filigranschmied & Gemmensetzer'
      }
    ]
  }
};

/**
 * Maps field IDs to their primary career branch keys.
 */
export const FIELD_BRANCH_MAP: Record<string, string[]> = {
  metall_waffen: ['schmied', 'mechaniker', 'instrumentenbauer', 'schlosser', 'giesser'],
  lebensmittel_ernaehrung: ['koch', 'baecker', 'brauer', 'metzger', 'winzer', 'mueller', 'kaeser'],
  bau_handwerk: ['architekt', 'steinmetz', 'zimmermann', 'maurer', 'tischler'],
  militaer_streitkraefte: ['soldat', 'schuetze', 'kavallerist', 'scout'],
  militaer_sicherheit: ['soldat', 'schuetze', 'kavallerist', 'scout'],
  seefahrt: ['seemann', 'steuermann', 'schiffszimmermann', 'fischer'],
  magie_arkana: ['magier', 'runenschmied', 'alchemist'],
  arkan_magie: ['magier', 'runenschmied', 'alchemist'],
  wissenschaft_forschung: ['alchemist', 'apotheker', 'astronom', 'kartograph'],
  verwaltung_wirtschaft: ['kaufmann', 'buchhalter', 'notar', 'schreiber'],
  verwaltung_recht: ['kaufmann', 'buchhalter', 'notar', 'schreiber'],
  staatsdienst_diplomatie: ['diplomat', 'leibwaechter', 'kanzler', 'vogt', 'herold'],
  unabhaengige_abenteurer: ['abenteurer', 'soeldner', 'gladiator', 'monsterjaeger'],
  abenteuer_sondergewerbe: ['abenteurer', 'soeldner', 'gladiator', 'monsterjaeger'],
  geheimoperationen_ueberleben: ['spion', 'infiltrator', 'assasine'],
  landwirtschaft_versorgung: ['bauer', 'schaefer', 'imker', 'foerster'],
  natur_landwirtschaft: ['bauer', 'schaefer', 'imker', 'foerster'],
  religion_klerus: ['priester', 'paladin', 'inquisitor'],
  materialverarbeitung: ['gerber', 'schneider', 'weber', 'glasmacher', 'toepfer'],
  bergbau_rohstoffe: ['bergmann', 'steinhauer', 'prospektor', 'schmelzer'],
  wandernde_erkundung: ['jaeger', 'fallensteller', 'faehrtenleser'],
  tierfuehrung_tamer: ['tiertrainer', 'falkner', 'pferdezuechter'],
  kriminelle_berufe: ['taschendieb', 'einbrecher', 'hehler', 'schmuggler'],
  haushalt_dienste: ['diener', 'zofe', 'butler'],
  kunst_kultur: ['maler', 'bildhauer', 'barde'],
  unterhaltung_spezial: ['schauspieler', 'gaukler', 'illusionist'],
  luxus_spezial: ['goldschmied', 'juwelier', 'parfuemeur'],
  bildung_erziehung: ['lehrer', 'fechtmeister', 'dozent']
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

  // Domestic / Service
  if (lower.includes('diener') || lower.includes('zofe') || lower.includes('butler') || lower.includes('kammer') || lower.includes('page') || fieldId === 'haushalt_dienste') {
    return {
      entryName: `Laufbursche & Hauspage (${clean})`,
      entryTitle: 'Einstieg & Hausdienst',
      journeyName: clean,
      journeyTitle: 'Herrschaftlicher Dienst',
      specName: `Kammer- & Tafeldienst (${clean})`,
      specTitle: 'Vertrauensstellung & Tafelaufsicht',
      masterName: `Haushofmeister & Majordomus (${clean})`,
      masterTitle: 'Hausleitung & Residenzführung'
    };
  }
  // Coachman / Transport
  if (lower.includes('kutscher') || lower.includes('fuhrmann') || lower.includes('karren')) {
    return {
      entryName: 'Stalljunge & Wagenknecht',
      entryTitle: 'Einstieg & Gespanndienst',
      journeyName: clean,
      journeyTitle: 'Fahrpraxis & Gespannführung',
      specName: 'Postillon & Karossenlenker',
      specTitle: 'Reisekutsche & Fernrouten',
      masterName: 'Hofkutscher & Fahrmeister',
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
      specName: `Gardist & Wehrmeister (${clean})`,
      specTitle: 'Garde & Gefechtstaktik',
      masterName: `Feldwebel & Waffenmeister (${clean})`,
      masterTitle: 'Truppenkommando & Ausbilder'
    };
  }
  // Ranged / Archer
  if (lower.includes('schütz') || lower.includes('bogen') || lower.includes('armbrust')) {
    return {
      entryName: 'Pfeiljunge & Spanngehilfe',
      entryTitle: 'Einstieg & Schießübungen',
      journeyName: clean,
      journeyTitle: 'Präzisionsschütze',
      specName: 'Scharfschütze & Weitschütze',
      specTitle: 'Windkunde & Zielvisierung',
      masterName: 'Meisterschütze & Schützenhauptmann',
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
      entryName: `Arkan-Novize & Schriftrollenschüler (${clean})`,
      entryTitle: 'Einstieg & Mana-Grundlagen',
      journeyName: clean,
      journeyTitle: 'Spruchpraxis & Ritualistik',
      specName: `Siegelweber & Elementarkundiger (${clean})`,
      specTitle: 'Komplexe Matrix & Arkanbindung',
      masterName: `Erzmagier & Magister Artium (${clean})`,
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
      entryName: `Akolyth & Tempelnovize (${clean})`,
      entryTitle: 'Einstieg & Liturgiedienst',
      journeyName: clean,
      journeyTitle: 'Seelsorge & Gemeindeandacht',
      specName: `Dompropst & Zeremonienmeister (${clean})`,
      specTitle: 'Sakramente & Heilige Riten',
      masterName: `Bischof & Hochkleriker (${clean})`,
      masterTitle: 'Diözesanleitung & Oberklerus'
    };
  }
  // Trade / Commerce
  if (lower.includes('kauf') || lower.includes('händl') || lower.includes('kräm') || lower.includes('markt') || fieldId.includes('verwaltung_wirtschaft')) {
    return {
      entryName: `Kontorbursche & Laufgehilfe (${clean})`,
      entryTitle: 'Einstieg & Kontorarbeiten',
      journeyName: clean,
      journeyTitle: 'Warenverkehr & Feilschen',
      specName: `Fernhändler & Faktoreileiter (${clean})`,
      specTitle: 'Karawanenhandel & Kontore',
      masterName: `Handelsherr & Großpatrizier (${clean})`,
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
      entryName: `Gassenjunge & Schnüffler (${clean})`,
      entryTitle: 'Einstieg & Schattenschritte',
      journeyName: clean,
      journeyTitle: 'Fingerfertigkeit & Hehlerei',
      specName: `Fingerkünstler & Schlösserknacker (${clean})`,
      specTitle: 'Infiltration & Mechanik',
      masterName: `Meisterdieb & Schattenfürst (${clean})`,
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
      entryName: `Hofknecht & Saatjunge (${clean})`,
      entryTitle: 'Einstieg & Feldbestellung',
      journeyName: clean,
      journeyTitle: 'Bodenpflege & Ernteführung',
      specName: `Gutspächter & Zuchtmeister (${clean})`,
      specTitle: 'Saatgutveredelung & Stallaufsicht',
      masterName: `Hofbesitzer & Dorfschulze (${clean})`,
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

  // Artisan / Craft suffix -er
  if (clean.endsWith('er')) {
    return {
      entryName: `${clean}gehilfe & Handwerksanwärter`,
      entryTitle: 'Einstieg & Handwerksgrundlagen',
      journeyName: clean,
      journeyTitle: 'Selbstständige Ausführung',
      specName: `Kunstfertiger ${clean} & Spezialist`,
      specTitle: 'Sonderanfertigung & Vertiefung',
      masterName: `${clean}meister & Werkstattleiter`,
      masterTitle: 'Zunftmeisterschaft & Innungsleitung'
    };
  }

  return {
    entryName: `Anwärter & Gehilfe (${clean})`,
    entryTitle: 'Einstiegsstufe & Einarbeitung',
    journeyName: clean,
    journeyTitle: 'Reguläre Berufsausübung',
    specName: `Fachkundiger ${clean} & Spezialist`,
    specTitle: 'Beförderung & Fachbereich',
    masterName: `Leitender ${clean} & Zunftältester`,
    masterTitle: 'Höchste Leitungsstufe'
  };
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
        suggestedCompetencies: ['Arbeitsplatz vorbereiten', 'Werkzeuge pflegen', 'Sorgfalt & Zuverlässigkeit', 'Grundlegende Handgriffe'],
        possibleRanks: [titles.entryName, 'Gehilfe', 'Anwärter'],
        nextRankName: titles.journeyName
      },
      {
        idSuffix: 'geselle',
        name: titles.journeyName,
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: titles.journeyTitle,
        description: `Reguläre, selbstständige Ausübung des Berufs als ${cleanName} mit solider Fachkenntnis.`,
        suggestedCompetencies: [`Fachpraxis ${cleanName}`, 'Arbeitsorganisation', 'Qualitätskontrolle', 'Selbstständige Ausführung'],
        possibleRanks: [cleanName, `Geselle (${cleanName})`, `Fachkraft`],
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
        suggestedCompetencies: [`Vertiefte Fachkunde`, 'Schwierige Aufgabenstellungen', 'Sondertechniken', 'Fachliche Anleitung'],
        possibleRanks: [titles.specName, `Senior-${cleanName}`, `Fachprüfer`],
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
        suggestedCompetencies: ['Meisterhafte Praxis', 'Betriebsleitung', 'Ausbildung von Nachwuchskräften', 'Qualitätsstandard'],
        possibleRanks: [titles.masterName, `Zunftältester`],
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
    const nextStep = progression.ranks.find(r => r.rankOrder === rankStep.rankOrder + 1);
    const prevStep = progression.ranks.find(r => r.rankOrder === rankStep.rankOrder - 1);

    const parentIds: string[] = prevStep ? [`${fieldId}.${branchKey}_${prevStep.idSuffix}`] : [];
    const childIds: string[] = nextStep ? [`${fieldId}.${branchKey}_${nextStep.idSuffix}`] : [];

    nodes.push({
      id: nodeId,
      fieldId,
      name: rankStep.name,
      tier: rankStep.tier,
      category: progression.branchName,
      rankOrder: rankStep.rankOrder,
      rankTitle: rankStep.rankTitle,
      nextRankProfession: rankStep.nextRankName || nextStep?.name,
      previousRankProfession: prevStep?.name,
      parentIds,
      childIds,
      specializationOf: prevStep ? `${fieldId}.${branchKey}_${prevStep.idSuffix}` : undefined,
      description: rankStep.description,
      prerequisites: rankStep.requiredExperienceYears
        ? [
            ...(rankStep.prerequisiteJobName
              ? [{ type: 'profession' as const, label: rankStep.prerequisiteJobName, targetId: rankStep.prerequisiteJobName }]
              : []),
            {
              type: 'experience_years' as const,
              label: `${rankStep.requiredExperienceYears} Jahr(e) Berufserfahrung`,
              minValue: rankStep.requiredExperienceYears
            }
          ]
        : [],
      careerRoutes: [
        {
          id: `route_${nodeId}`,
          name: `${rankStep.name}-Prüfung / Anerkennung`,
          type: rankStep.rankOrder === 0 ? 'experience' : 'exam',
          description: `Qualifikationsschritt für die Stufe ${rankStep.rankTitle}.`,
          requirementsSummary: rankStep.requiredExperienceYears ? `${rankStep.requiredExperienceYears} Jahr(e) Praxis` : 'Offener Einstieg'
        }
      ],
      suggestedCompetencies: rankStep.suggestedCompetencies,
      possibleRanks: rankStep.possibleRanks
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
  const branchKeys = FIELD_BRANCH_MAP[fieldId];

  if (branchKeys && branchKeys.length > 0) {
    return branchKeys.map(key => {
      if (DETAILED_PROFESSION_PROGRESSIONS[key]) {
        return DETAILED_PROFESSION_PROGRESSIONS[key];
      }
      const jobName = key.charAt(0).toUpperCase() + key.slice(1);
      return generateDefaultRanksForJob(jobName, fieldId, cleanFieldName);
    });
  }

  // Fallback to preset jobs in JOB_CATEGORIES
  const categoryPreset = JOB_CATEGORIES.find(c => c.fieldId === fieldId);
  if (categoryPreset && categoryPreset.jobs.length > 0) {
    const rawJobs = categoryPreset.jobs;
    const branches: ProfessionBranchProgression[] = [];
    const seen = new Set<string>();

    for (const rawJob of rawJobs) {
      const parts = rawJob.split(' / ').map(p => p.trim());
      const mainJob = parts[0];
      const mainKey = mainJob.toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (seen.has(mainKey)) continue;
      seen.add(mainKey);

      if (DETAILED_PROFESSION_PROGRESSIONS[mainKey]) {
        branches.push(DETAILED_PROFESSION_PROGRESSIONS[mainKey]);
      } else {
        branches.push(generateDefaultRanksForJob(mainJob, fieldId, cleanFieldName));
      }
    }
    return branches;
  }

  // Ultimate fallback
  return [generateDefaultRanksForJob(`Fachkraft für ${cleanFieldName}`, fieldId, cleanFieldName)];
}
