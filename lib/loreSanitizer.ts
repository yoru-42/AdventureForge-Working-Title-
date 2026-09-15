import { normalizeRelationships } from './relationshipHelper';

/**
 * Robust helper to safely trim any value (including numbers, null, undefined) without throwing TypeError
 */
export function safeTrim(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    const str = String(val).trim();
    return str.length > 0 ? str : fallback;
  }
  return fallback;
}

// Comprehensive list of profession and title words in fantasy/historical German RPG contexts
const PROFESSION_TITLE_LIST = [
  'Bauer', 'Bäuerin', 'Landwirt', 'Landwirtin', 'Freibauer', 'Freibäuerin',
  'Wirt', 'Wirtin', 'Schankwirt', 'Schankwirtin', 'Tavernenwirt', 'Tavernenwirtin', 'Gastwirt', 'Gastwirtin',
  'Dorfschulze', 'Schulze', 'Dorfältester', 'Dorfälteste', 'Ältester', 'Älteste', 'Dorfvorsteher', 'Dorfvorsteherin', 'Ortsvorsteher', 'Ortsvorsteherin',
  'Schmied', 'Schmiedin', 'Waffenschmied', 'Waffenschmiedin', 'Hufschmied', 'Grobschmied', 'Feinschmied',
  'Müller', 'Müllerin',
  'Schneider', 'Schneiderin',
  'Schreiner', 'Schreinerin', 'Tischler', 'Tischlerin',
  'Zimmermann', 'Zimmerin', 'Zimmerer',
  'Förster', 'Försterin', 'Waldläufer', 'Waldläuferin', 'Jäger', 'Jägerin',
  'Fischer', 'Fischerin',
  'Händler', 'Händlerin', 'Kaufmann', 'Kauffrau', 'Krämer', 'Krämerin',
  'Priester', 'Priesterin', 'Pfarrer', 'Pfarrerin', 'Mönch', 'Nonne', 'Abt', 'Äbtissin', 'Kleriker', 'Klerikerin',
  'Heiler', 'Heilerin', 'Kräuterkundiger', 'Kräuterkundige', 'Kräuterfrau', 'Kräuterweib', 'Kräuterhexe', 'Apotheker', 'Apothekerin',
  'Magier', 'Magierin', 'Zauberer', 'Zauberin', 'Hexe', 'Hexer', 'Alchemist', 'Alchemistin',
  'Soldat', 'Soldatin', 'Wächter', 'Wächterin', 'Wache', 'Stadtwache', 'Nachtwächter', 'Torwächter',
  'Hauptmann', 'Hauptfrau', 'Kommandant', 'Kommandantin', 'Offizier', 'Feldwebel',
  'Ritter', 'Ritterin', 'Paladin',
  'Söldner', 'Söldnerin',
  'Dieb', 'Diebin', 'Räuber', 'Räuberin', 'Bandit', 'Banditin', 'Gauner', 'Gaunerin',
  'Schankmaid', 'Magd', 'Knecht', 'Stallbursche', 'Stallknecht', 'Tagelöhner', 'Tagelöhnerin',
  'Hirte', 'Hirtin', 'Schäfer', 'Schäferin',
  'Bürgermeister', 'Bürgermeisterin', 'Vogt', 'Vögtin', 'Ratsherr', 'Ratsfrau', 'Ratsmitglied', 'Stadtrat',
  'Graf', 'Gräfin', 'Baron', 'Baronin', 'Freiherr', 'Freifrau', 'Fürst', 'Fürstin', 'Herzog', 'Herzogin', 'König', 'Königin', 'Prinz', 'Prinzessin', 'Kaiser', 'Kaiserin',
  'Kapitän', 'Kapitänin', 'Maat', 'Steuermann', 'Seemann', 'Matrose', 'Bootsmann',
  'Meister', 'Meisterin', 'Großmeister', 'Großmeisterin', 'Lehrmeister', 'Lehrmeisterin', 'Geselle', 'Lehrling',
  'Doktor', 'Dr.', 'Gelehrter', 'Gelehrte', 'Chronist', 'Chronistin', 'Schreiber', 'Schreiberin', 'Barde', 'Bardin', 'Spielmann'
];

const PROFESSION_REGEX_PART = PROFESSION_TITLE_LIST
  .map(p => p.replace('.', '\\.'))
  .join('|');

// Matches prefix e.g. "Bauer Jochen", "Wirtin Martha", "Dorfschulze Kuno"
const PREFIX_REGEX = new RegExp(`^(?:(${PROFESSION_REGEX_PART})\\s+)(.+)$`, 'i');

// Matches suffix e.g. "Jochen, Bauer", "Martha (Wirtin)", "Kuno - Dorfschulze", "Jochen der Bauer"
const SUFFIX_REGEX = new RegExp(`^(.+?)(?:,\\s*|\\s*[-–]\\s+|\\s*\\()\\s*(?:der|die|das)?\\s*(${PROFESSION_REGEX_PART})\\s*\\)?$`, 'i');

/**
 * Sanitizes a character name by stripping profession/title prefixes or suffixes,
 * and extracts the true profession and call name.
 */
export function sanitizeCharacterNameAndProfession(
  rawName: any,
  existingProfession?: any,
  existingRole?: any
): { cleanName: string; extractedProfession: string; callName: string } {
  const trimmed = safeTrim(rawName);
  const exProf = safeTrim(existingProfession);
  const exRole = safeTrim(existingRole);

  if (!trimmed) {
    return {
      cleanName: '',
      extractedProfession: exProf || exRole || '',
      callName: ''
    };
  }

  let cleanName = trimmed;
  let detectedProfession = '';

  const prefixMatch = trimmed.match(PREFIX_REGEX);
  if (prefixMatch && prefixMatch[1] && prefixMatch[2]) {
    detectedProfession = prefixMatch[1].trim();
    cleanName = prefixMatch[2].trim();
  } else {
    const suffixMatch = trimmed.match(SUFFIX_REGEX);
    if (suffixMatch && suffixMatch[1] && suffixMatch[2]) {
      cleanName = suffixMatch[1].trim();
      detectedProfession = suffixMatch[2].trim();
    }
  }

  // Remove surrounding quotes or dashes if present
  cleanName = cleanName.replace(/^["'„“”]+|["'„“”]+$/g, '').trim();

  // If cleanName starts with another title word, run once more
  const secondPrefixMatch = cleanName.match(PREFIX_REGEX);
  if (secondPrefixMatch && secondPrefixMatch[1] && secondPrefixMatch[2]) {
    if (!detectedProfession) detectedProfession = secondPrefixMatch[1].trim();
    cleanName = secondPrefixMatch[2].trim();
  }

  const finalProfession = exProf || exRole || detectedProfession;
  
  // Call name is first word of the clean name
  const callName = cleanName.split(/\s+/)[0] || cleanName;

  return {
    cleanName: cleanName || trimmed,
    extractedProfession: finalProfession,
    callName: callName || cleanName || trimmed
  };
}

/**
 * Sanitizes a territory ruler name and separates title from name.
 * e.g. "Dorfschulze Kuno" -> cleanRuler: "Kuno", rulingTitle: "Dorfschulze"
 */
export function sanitizeRulerNameAndTitle(
  rawRuler: any,
  existingTitle?: any
): { cleanRuler: string; rulingTitle: string } {
  const trimmed = safeTrim(rawRuler);
  const exTitle = safeTrim(existingTitle);

  if (!trimmed) {
    return {
      cleanRuler: '',
      rulingTitle: exTitle
    };
  }

  const sanitized = sanitizeCharacterNameAndProfession(trimmed, existingTitle);
  const cleanRuler = sanitized.cleanName;
  const rulingTitle = exTitle || sanitized.extractedProfession || '';

  return {
    cleanRuler: cleanRuler || trimmed,
    rulingTitle
  };
}

/**
 * Generates plausible daily crafting and everyday skills based on a character's profession
 */
function getPlausibleSkillsForProfession(profession: any, name: any): {
  craftingSkills: string;
  everydaySkills: string;
  talents: string;
} {
  const p = safeTrim(profession).toLowerCase();

  if (p.includes('bauer') || p.includes('bäuerin') || p.includes('landwirt')) {
    return {
      craftingSkills: 'Feldbestellung, Holz hacken, Zaunreparatur, Pflug instand halten',
      everydaySkills: 'Ackerbau, Saat und Ernte, Viehzucht, Wetterkunde, körperliche Ausdauer',
      talents: 'Robustheit gegen Witterung, Gespür für fruchtbare Böden'
    };
  }

  if (p.includes('wirt') || p.includes('wirtin') || p.includes('gastwirt')) {
    return {
      craftingSkills: 'Bier brauen, Vorratshaltung, Fleisch pökeln, Herd- und Küchenführung',
      everydaySkills: 'Schankwirtschaft, Kochen, Buchführung, Menschenkenntnis, Schlichtung von Wirtshausstreit',
      talents: 'Gerüchtesammler, feines Gespür für die Stimmung der Gäste'
    };
  }

  if (p.includes('schulze') || p.includes('vorsteher') || p.includes('ältester') || p.includes('vogt') || p.includes('bürgermeister')) {
    return {
      craftingSkills: 'Urkundenprüfung, Siegelung von Verträgen, Grundriss- und Grenzkarten',
      everydaySkills: 'Gemeinderecht, Schlichtung lokaler Streitigkeiten, Zehnteinzug, Verhandlung mit Lehnsherren',
      talents: 'Autorität, diplomatisches Verhandlungsgeschick, unerschütterliche Geduld'
    };
  }

  if (p.includes('schmied')) {
    return {
      craftingSkills: 'Eisen verhütten, Werkzeuge und Hufeisen schmieden, Waffen ausbessern',
      everydaySkills: 'Metallbearbeitung, Hufbeschlag, Feuerführung, handwerkliche Zähigkeit',
      talents: 'Hohe Kraft, feines Gespür für Materialspannungen im erhitzten Eisen'
    };
  }

  if (p.includes('jäger') || p.includes('förster') || p.includes('waldläufer')) {
    return {
      craftingSkills: 'Pfeilschnitzen, Bogenbau, Tierhäute gerben und zubereiten',
      everydaySkills: 'Spurenlesen, lautlose Pirsch, Bogenschießen, Tierkunde, Orientierung im Forst',
      talents: 'Scharfe Sinne im Unterholz, Instinkt für Wildwechsel'
    };
  }

  if (p.includes('müller')) {
    return {
      craftingSkills: 'Mahlwerk warten, Mühlsteine schärfen, Wasserrad instand halten',
      everydaySkills: 'Kornprüfung, Mahlgut wiegen, Getreidelagerung, Mehlkunde',
      talents: 'Akustisches Gespür für Laufruhe des Mühlrads'
    };
  }

  if (p.includes('händler') || p.includes('kaufmann') || p.includes('krämer')) {
    return {
      craftingSkills: 'Warenprüfung, Feingewichtsmessung, Verpackung und Transportverstauung',
      everydaySkills: 'Feilschen, Buchhaltung, Rechnen, Karawanenlogistik, Währungsumtausch',
      talents: 'Gespür für Profit und Marktlücken, scharfer Blick für Falschmünzen'
    };
  }

  return {
    craftingSkills: 'Grundlegende Ausbesserung von Alltagsgegenständen und Kleidung',
    everydaySkills: 'Alltagsarbeit, Hauswirtschaft, handwerkliches Geschick',
    talents: 'Zuverlässigkeit und Ausdauer bei der täglichen Arbeit'
  };
}

/**
 * Enriches and ensures complete form fields for a character entry in the background.
 */
export function enrichAndCompleteCharacterDetails(entry: any, worldContext?: any): any {
  if (!entry) return entry;
  const details = entry.details || {};
  
  // Sanitize title and extract clean name and profession
  const { cleanName, extractedProfession, callName } = sanitizeCharacterNameAndProfession(
    entry.title || '',
    details.profession,
    details.role
  );

  const finalTitle = cleanName || safeTrim(entry.title) || 'Unbenannt';
  const effectiveProfession = extractedProfession || safeTrim(details.profession) || safeTrim(details.role) || 'Dorfbewohner';
  const finalCallName = safeTrim(details.callName) || safeTrim(details.rufName) || callName || finalTitle;

  const skillsData = getPlausibleSkillsForProfession(effectiveProfession, finalTitle);

  // Appearance with genetic/familial inheritance support
  const playerObj = worldContext?.player || {};
  const playerApp = playerObj?.appearance || {};
  const isPlayerFamily = !!(
    (details.relationship && (details.relationship.toLowerCase().includes('spieler') || (playerObj.name && details.relationship.toLowerCase().includes(playerObj.name.toLowerCase())))) ||
    (details.family && playerObj.family && details.family.toLowerCase().includes(playerObj.family.toLowerCase())) ||
    (details.family && playerObj.name && details.family.toLowerCase().includes(playerObj.name.toLowerCase()))
  );

  const defaultRace = (isPlayerFamily && playerApp.race) ? playerApp.race : 'Mensch';
  const defaultRaceFeatures = (isPlayerFamily && playerApp.raceFeatures) ? playerApp.raceFeatures : 'Keine Auffälligkeiten';
  const defaultHairColor = (isPlayerFamily && playerApp.hairColor) ? playerApp.hairColor : 'Dunkelbraun';
  const defaultEyeColor = (isPlayerFamily && playerApp.eyeColor) ? playerApp.eyeColor : 'Braun';
  const defaultOrigin = (isPlayerFamily && (playerApp.origin || playerObj.origin)) ? (playerApp.origin || playerObj.origin) : safeTrim(worldContext?.title, 'Heimatort');
  const defaultFamily = (isPlayerFamily && (playerApp.family || playerObj.family)) ? (playerApp.family || playerObj.family) : '';

  const enrichedDetails = {
    ...details,
    // Clean name fields without profession prefix
    callName: finalCallName,
    rufName: finalCallName,
    nickname: safeTrim(details.nickname, finalCallName),
    
    // Profession and role fields
    role: effectiveProfession,
    profession: effectiveProfession,
    jobTitle: safeTrim(details.jobTitle, effectiveProfession),
    professionLevel: safeTrim(details.professionLevel, 'Erfahren'),
    professionDescription: safeTrim(details.professionDescription, `${finalTitle} ist im Ort als verlässliche(r) ${effectiveProfession} tätig.`),
    secondaryProfessions: Array.isArray(details.secondaryProfessions) ? details.secondaryProfessions : [],

    // Everyday, crafting and talent skills
    craftingSkills: safeTrim(details.craftingSkills, skillsData.craftingSkills),
    everydaySkills: safeTrim(details.everydaySkills, skillsData.everydaySkills),
    talents: safeTrim(details.talents, skillsData.talents),

    // Appearance
    gender: safeTrim(details.gender, 'Männlich'),
    age: safeTrim(details.age, '38'),
    build: safeTrim(details.build, 'Kräftig'),
    race: safeTrim(details.race, defaultRace),
    raceFeatures: safeTrim(details.raceFeatures, defaultRaceFeatures),
    hairColor: safeTrim(details.hairColor, defaultHairColor),
    eyeColor: safeTrim(details.eyeColor, defaultEyeColor),
    height: safeTrim(details.height, '178 cm'),
    measurements: safeTrim(details.measurements, ''),
    cupSize: safeTrim(details.cupSize, '-'),
    outfit: safeTrim(details.outfit, 'Zweckmäßige, wetterfeste Arbeitskleidung aus Leinen und Loden'),
    looks: safeTrim(details.looks, 'Wettergegerbtes Gesicht mit aufmerksamem, ruhigem Blick'),
    origin: safeTrim(details.origin, defaultOrigin),
    family: safeTrim(details.family, defaultFamily),
    faction: safeTrim(details.faction, ''),

    // Personality & Mindset
    personality: safeTrim(details.personality, 'Bodenständig, pragmatisch und der Gemeinschaft treu verbunden'),
    personalityArchetype: safeTrim(details.personalityArchetype || details.archetype, 'Pragmatiker'),
    archetype: safeTrim(details.archetype || details.personalityArchetype, 'Pragmatiker'),
    personalityTraits: details.personalityTraits || { 'Zuverlässigkeit': 85, 'Fleiß': 80, 'Besonnenheit': 75 },

    // Biography & Status
    bio: safeTrim(details.bio) || safeTrim(entry.description) || `${finalTitle} wuchs in einfachen, aber geordneten Verhältnissen auf und erlernte von klein auf den Beruf als ${effectiveProfession}. Die Kindheit war geprägt von harter Arbeit und familiärem Zusammenhalt. Besondere Prägung erfuhr ${finalTitle} durch die Werte der Dorfgemeinschaft. Nach Jahren des Lernens übernahm ${finalTitle} die Verantwortung für den eigenen Betrieb und genießt heute das Vertrauen der Nachbarn. Bereut wird bisweilen, wenig von der weiten Welt gesehen zu haben, doch das Wohl der Familie und die Zufriedenheit im Alltag stehen stets an erster Stelle.`,
    currentSituation: (() => {
      const rawSit = safeTrim(details.currentSituation);
      if (rawSit.length >= 35) return rawSit;
      if (rawSit.length > 0) {
        return `${rawSit}. Kümmert sich gewissenhaft um die täglichen Pflichten als ${effectiveProfession} und sorgt für das Auskommen der Familie sowie den Frieden im Ort.`;
      }
      return `Geht täglich von früh bis spät den gewohnten Pflichten als ${effectiveProfession} nach und sorgt verlässlich für das Auskommen der Familie und die Erhaltung des Hofes.`;
    })(),
    goal: safeTrim(details.goal, 'Die tägliche Existenz sichern, Wohlstand der Familie mehren und den Frieden in der Nachbarschaft wahren.'),
    motivationCore: details.motivationCore || {
      mainGoal: safeTrim(details.goal, 'Sicherung der Lebensgrundlage'),
      whyGoal: 'Verantwortung für die eigene Familie und das Ansehen im Ort',
      currentPriorities: 'Tägliche Pflichten zuverlässig erfüllen',
      needs: 'Gute Ernten, stabiler Frieden und faire Abgaben',
      fears: 'Missernten, Willkür der Herrschenden oder marodierende Banden'
    },
    goals: Array.isArray(details.goals) ? details.goals : [],

    // Social & Relationships
    relationship: safeTrim(details.relationship, 'Respektiert und geschätzt'),
    conduct: safeTrim(details.conduct, 'Freundlich, zurückhaltend und hilfsbereit'),
    relationships: normalizeRelationships(details.relationships),

    // Combat & Powers (grounded)
    skills: safeTrim(details.skills, 'Körperliche Ausdauer, geübter Umgang mit einfachen Werkzeugen'),
    powerSource: safeTrim(details.powerSource, 'Körperliche Fitness und Fleiß'),
    powerCost: safeTrim(details.powerCost, 'Körperliche Anstrengung'),
    techniques: safeTrim(details.techniques, ''),
    abilities: Array.isArray(details.abilities) ? details.abilities : [],
    campaignPowerLevels: details.campaignPowerLevels || {
      physical: { value: 35, potentialMax: 50 },
      mental: { value: 30, potentialMax: 45 },
      social: { value: 40, potentialMax: 60 }
    }
  };

  return {
    ...entry,
    title: finalTitle,
    secretsStage1: safeTrim(entry.secretsStage1, 'Im Ort allgemein als fleißig und redlich geschätzt'),
    secretsStage2: safeTrim(entry.secretsStage2, 'Hegt im Stillen Zweifel an neuen Vorschriften oder steigenden Abgaben'),
    secretsStage3: safeTrim(entry.secretsStage3, 'Besitzt einen kleinen geheimen Notgroschen für schwere Zeiten'),
    details: enrichedDetails
  };
}

/**
 * Enriches and ensures complete form fields for a territory / location entry in the background.
 */
export function enrichAndCompleteTerritoryDetails(entry: any, worldContext?: any): any {
  if (!entry) return entry;
  const details = entry.details || {};
  const territoryType = safeTrim(details.type, 'dorf').toLowerCase();
  const placeName = safeTrim(entry.title, 'Unbenannt');

  // Sanitize ruler if it contains a title prefix like "Dorfschulze Kuno"
  const { cleanRuler, rulingTitle } = sanitizeRulerNameAndTitle(
    details.ruler || '',
    details.rulingTitle
  );

  let enrichedDetails: any = {
    ...details,
    ruler: cleanRuler || safeTrim(details.ruler, ''),
    rulingTitle: rulingTitle || safeTrim(details.rulingTitle, '')
  };

  // Village specific completeness
  if (territoryType === 'dorf' || territoryType === 'weiler' || territoryType === 'siedlung') {
    enrichedDetails = {
      ...enrichedDetails,
      ruler: cleanRuler || safeTrim(enrichedDetails.ruler, 'Kuno'),
      rulingTitle: rulingTitle || safeTrim(enrichedDetails.rulingTitle, 'Dorfschulze'),
      overlord: safeTrim(details.overlord, 'Baron von Weißstein (Lehnsherrschaft)'),
      feudalRank: safeTrim(details.feudalRank, 'Dorf unter Lehnsherrschaft der Baronie'),
      lawEnforcement: safeTrim(details.lawEnforcement, 'Dorf-Büttel, Nachtwächter und Ältestenrat'),
      
      population: safeTrim(details.population, '200'),
      combatReadyPopulation: safeTrim(details.combatReadyPopulation, 'ca. 50 wehrfähige Bewohner (Bauernwehr)'),
      standingArmy: safeTrim(details.standingArmy, 'Keine stehende Truppe, 2 Nachtwächter'),
      militiaAndConscripts: safeTrim(details.militiaAndConscripts, 'Dorfmiliz mit Heugabeln, Äxten und Jagdbögen'),
      defenseStructures: safeTrim(details.defenseStructures, 'Holzpalisade, Erdwall und verstärktes Wehrtor'),
      armamentAndSupply: safeTrim(details.armamentAndSupply, 'Einfache Waffen, Jagdbögen, Knüppel, kein schweres Gerät'),
      dangerLevel: safeTrim(details.dangerLevel, 'Wilde Tiere im Wald, vereinzelte Wegelagerer'),

      dailyJobs: safeTrim(details.dailyJobs, '65% Ackerbau und Feldarbeit, 20% Viehzucht und Forst, 15% Handwerk und Schank'),
      localTasks: safeTrim(details.localTasks, 'Feldbestellung, Holzschlag für den Winter, Wehrtordienst, Brunnenpflege'),
      tradeGoods: safeTrim(details.tradeGoods, 'Getreide, Wolle, Honig, Schnittholz, frisches Gemüse'),
      tradeDemands: safeTrim(details.tradeDemands, 'Eisenwerkzeuge, Salz, Arzneien, feine Webstoffe'),
      merchantsAndFairs: safeTrim(details.merchantsAndFairs, 'Wöchentlicher Markttag, reisende Händlerkarawanen'),
      tradeContracts: safeTrim(details.tradeContracts, 'Zehntabgabe an den Lehnsherrn, Wegegeld-Befreiung'),

      accessRoutes: safeTrim(details.accessRoutes, 'Befestigte Landstraße und Karrenweg durch den Forst'),
      travelDangers: safeTrim(details.travelDangers, 'Morastige Wegabschnitte bei Regen, Wolfsrudel im tiefen Wald'),
      landmarks: safeTrim(details.landmarks, 'Dorfplatz mit Ziehbrunnen, Dorfschänke, alte Dorfeiche'),
      pointsOfInterest: safeTrim(details.pointsOfInterest, 'Dorfschmiede, Backhaus, Mühle am Bach'),
      
      climate: safeTrim(details.climate, 'Gemäßigtes mitteleuropäisches Binnenklima mit vier Jahreszeiten'),
      culture: safeTrim(details.culture, 'Bodenständige Dorfgemeinschaft, traditionsreiche Erntefeste'),
      terrain: safeTrim(details.terrain || details.terrainTile, 'Sanfte Hügel, Ackerflächen und angrenzende Mischwälder'),
      faction: safeTrim(details.faction, `Gemeinde ${placeName}`)
    };
  } else if (territoryType === 'stadt' || territoryType === 'hafen' || territoryType === 'festung') {
    enrichedDetails = {
      ...enrichedDetails,
      ruler: cleanRuler || safeTrim(enrichedDetails.ruler, 'Stadtvogt'),
      rulingTitle: rulingTitle || safeTrim(enrichedDetails.rulingTitle, 'Bürgermeister'),
      overlord: safeTrim(details.overlord, 'Direkt der Krone / dem Herzogtum unterstellt'),
      feudalRank: safeTrim(details.feudalRank, 'Freie Handels- und Provinzhauptstadt'),
      government: safeTrim(details.government, 'Patrizier- und Gildenrat unter Vorsitz des Vogts'),
      lawEnforcement: safeTrim(details.lawEnforcement, 'Stadtwache, Torwachen und Stadtgericht'),

      population: safeTrim(details.population, '8.500'),
      combatReadyPopulation: safeTrim(details.combatReadyPopulation, 'ca. 2.000 Bürgerwehr und Milizen'),
      standingArmy: safeTrim(details.standingArmy, '150 bezahlte Stadtwachen und 50 Armbrustschützen'),
      militiaAndConscripts: safeTrim(details.militiaAndConscripts, 'Zunftmilizen der Handwerker mit Piken und Schildern'),
      defenseStructures: safeTrim(details.defenseStructures, 'Massiver Steinmauerring, Wehrtürme, Zugbrücke und Graben'),
      armamentAndSupply: safeTrim(details.armamentAndSupply, 'Städtisches Zeughaus mit Kettenhemden, Piken, Ballisten'),
      dangerLevel: safeTrim(details.dangerLevel, 'Niedrig (Geschützt hinter Mauern, Taschendiebe in Gassen)'),

      dailyJobs: safeTrim(details.dailyJobs, 'Handwerk (Schmiede, Weber, Gerber), Fernhandel, Schifffahrt, Verwaltung'),
      localTasks: safeTrim(details.localTasks, 'Mauerwache, Torzoll-Erhebung, Marktordnung, Hafenlogistik'),
      tradeGoods: safeTrim(details.tradeGoods, 'Geprägte Waren, Werkzeuge, Tuchwaren, Waffen, Schiffe'),
      tradeDemands: safeTrim(details.tradeDemands, 'Getreide, Nutzholz, Vieh, Roherze aus den Umländern'),
      merchantsAndFairs: safeTrim(details.merchantsAndFairs, 'Täglicher Marktplatz, große Herbstmesse der Gilden'),
      tradeContracts: safeTrim(details.tradeContracts, 'Handelsprivileg mit Nachbarstädten, 5% Einfuhrzoll'),
      currency: safeTrim(details.currency, 'Silbermünzen und Goldgulden'),

      accessRoutes: safeTrim(details.accessRoutes, 'Gepflasterte Reichsstraße, schiffbarer Flusslauf'),
      travelDangers: safeTrim(details.travelDangers, 'Zollstationen, dichte Passagen vor den Stadttoren'),
      landmarks: safeTrim(details.landmarks, 'Rathaus am Marktplatz, Hohe Stadtkirche, Festungsturm'),
      pointsOfInterest: safeTrim(details.pointsOfInterest, 'Gildenhaus der Kaufleute, Gerberviertel, Alter Hafen')
    };
  }

  return {
    ...entry,
    secretsStage1: safeTrim(entry.secretsStage1, 'Weithin bekannt für die florierende lokale Gemeinschaft'),
    secretsStage2: safeTrim(entry.secretsStage2, 'Gerüchte über Zwistigkeiten bezüglich anstehender Pachtverträge'),
    secretsStage3: safeTrim(entry.secretsStage3, 'Ein altes, vergessenes Kellargewölbe unter dem Ortszentrum'),
    details: enrichedDetails
  };
}

/**
 * Enriches and ensures complete form fields for a faction entry in the background.
 */
export function enrichAndCompleteFactionDetails(entry: any, worldContext?: any): any {
  if (!entry) return entry;
  const details = entry.details || {};
  const factionName = safeTrim(entry.title, 'Fraktion');

  const { cleanRuler: cleanLeader } = sanitizeRulerNameAndTitle(details.leader || '');

  const enrichedDetails = {
    ...details,
    foundingReason: safeTrim(details.foundingReason, 'Gemeinsamer Schutz, Wahrung lokaler Interessen und gegenseitige Hilfe'),
    originalGoal: safeTrim(details.originalGoal, 'Sicherung des Friedens und geordneter Alltag im Territorium'),
    currentGoal: safeTrim(details.currentGoal, 'Wahrung von Autonomie, Wohlstand und Abwehr äußerer Bedrohungen'),
    keyHistoricalEvents: safeTrim(details.keyHistoricalEvents, 'Erfolgreiche Bewältigung eines harten Winters und Beilegung eines Grenzstreits'),
    evolutionAndChange: safeTrim(details.evolutionAndChange, 'Wuchs von einer kleinen Notgemeinschaft zu einer festen Institution heran'),
    leadershipStructure: safeTrim(details.leadershipStructure, 'Vorsitzender Ältestenrat und gewählter Sprecher'),
    leader: cleanLeader || safeTrim(details.leader, 'Gemeinderat'),
    cohesion: safeTrim(details.cohesion, 'Gegenseitige Abhängigkeit, Tradition und gemeinsame Eide'),
    internalConflicts: safeTrim(details.internalConflicts, 'Meinungsverschiedenheiten über Ressourceneinteilung und Ausgaben'),
    
    // Relations
    allies: safeTrim(details.allies, 'Benachbarte Siedlungen und befreundete Händler'),
    rivals: safeTrim(details.rivals, 'Gierige Steuereintreiber oder konkurrierende Händler'),
    enemies: safeTrim(details.enemies, 'Wegelagerer und wilde Bestien im Umland'),
    convenienceAlliances: safeTrim(details.convenienceAlliances, 'Zweckbündnis mit den Holzfällern des Nachbartals'),
    unresolvedConflicts: safeTrim(details.unresolvedConflicts, 'Ungeklärte Nutzungsrechte am Waldrand'),
    status: safeTrim(details.status, 'Neutral und vorsichtig gegenüber Durchreisenden'),

    // Resources & Power
    resourceEconomy: safeTrim(details.resourceEconomy, 'Stabile Agrarwirtschaft und Handwerksüberschüsse'),
    resourceTerritory: safeTrim(details.resourceTerritory, 'Siedlungsgebiet samt bewirtschafteten Feldern und Weiden'),
    resourceMaterials: safeTrim(details.resourceMaterials, 'Holz, Stein, Getreide, Wolle, Leder'),
    resourceMembers: safeTrim(details.resourceMembers, 'Alle sesshaften Bewohner und Meister des Gebiets'),
    resourceMilitary: safeTrim(details.resourceMilitary, 'Ortsmiliz und ausgerüstete Bürgerwehr'),
    resourceInfluence: safeTrim(details.resourceInfluence, 'Starke lokale Autorität im Siedlungsbereich'),
    resourceKnowledge: safeTrim(details.resourceKnowledge, 'Generationenaltes Wissen über Ackerbau, Kräuter und Handwerk'),
    resourceTrade: safeTrim(details.resourceTrade, 'Regelmäßiger Warenaustausch mit Wanderhändlern'),
    philosophy: safeTrim(details.philosophy, 'Eintracht nährt, Zwietracht verzehrt.'),
    maxMembers: typeof details.maxMembers === 'number' ? details.maxMembers : (parseInt(details.maxMembers, 10) || 250)
  };

  return {
    ...entry,
    secretsStage1: safeTrim(entry.secretsStage1, 'Gilt in der Region als loyale und arbeitsame Gemeinschaft'),
    secretsStage2: safeTrim(entry.secretsStage2, 'Streitigkeiten hinter verschlossenen Türen über Abgabenhöhen'),
    secretsStage3: safeTrim(entry.secretsStage3, 'Ein geheimer Notfallplan für den Fall feindlicher Belagerung'),
    details: enrichedDetails
  };
}

/**
 * Universal enricher that routes to the correct category handler,
 * sanitizes character names and completely fills out all background form fields.
 */
export function enrichAndCompleteLoreEntry(entry: any, worldContext?: any): any {
  if (!entry) return entry;

  const category = safeTrim(entry.category);

  switch (category) {
    case 'Charaktere':
      return enrichAndCompleteCharacterDetails(entry, worldContext);
    case 'Orte':
      return enrichAndCompleteTerritoryDetails(entry, worldContext);
    case 'Fraktionen':
      return enrichAndCompleteFactionDetails(entry, worldContext);
    default:
      return {
        ...entry,
        secretsStage1: safeTrim(entry.secretsStage1, 'Allgemein bekanntes Wissen im Reich'),
        secretsStage2: safeTrim(entry.secretsStage2, 'Verborgene Einzelheiten oder Gerüchte'),
        secretsStage3: safeTrim(entry.secretsStage3, 'Ein gehütetes persönliches oder geschichtliches Geheimnis'),
        details: entry.details || {}
      };
  }
}
