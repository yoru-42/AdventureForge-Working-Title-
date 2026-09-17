/**
 * Helper to display profession titles in both masculine and feminine forms (männlich & weiblich).
 * Provides clean German dual-gender representations, e.g.:
 * - "Koch / Köchin"
 * - "Küchenjunge / Küchenmädchen"
 * - "Schürzenbursche / Schürzenmagd"
 * - "Feldkoch / Feldköchin"
 * - "Großküchenkoch / Großküchenköchin"
 * - "Gourmetkoch / Gourmetköchin"
 * - "Saucenkoch / Saucenköchin"
 * - "Schiffskoch / Schiffsköchin (Smutje)"
 * - "Schmied / Schmiedin"
 * - "Kaufmann / Kauffrau"
 * - "Zauberer / Zauberin"
 * - "Arzt / Ärztin"
 */

// Special dictionary for irregular, historical or compound terms
const IRREGULAR_GENDER_MAP: Record<string, { male: string; female: string }> = {
  // Kitchen & Food
  'koch': { male: 'Koch', female: 'Köchin' },
  'küchenjunge': { male: 'Küchenjunge', female: 'Küchenmädchen' },
  'küchengehilfe': { male: 'Küchengehilfe', female: 'Küchengehilfin' },
  'küchenbursche': { male: 'Küchenbursche', female: 'Küchenmagd' },
  'schürzenbursche': { male: 'Schürzenbursche', female: 'Schürzenmagd' },
  'beikoch': { male: 'Beikoch', female: 'Beiköchin' },
  'feldkoch': { male: 'Feldkoch', female: 'Feldköchin' },
  'großküchenkoch': { male: 'Großküchenkoch', female: 'Großküchenköchin' },
  'gourmetkoch': { male: 'Gourmetkoch', female: 'Gourmetköchin' },
  'saucenkoch': { male: 'Saucenkoch', female: 'Saucenköchin' },
  'schiffskoch': { male: 'Schiffskoch', female: 'Schiffsköchin' },
  'hofküchenmeister': { male: 'Hofküchenmeister', female: 'Hofküchenmeisterin' },
  'küchendirektor': { male: 'Küchendirektor', female: 'Küchendirektorin' },
  'chefkoch': { male: 'Chefkoch', female: 'Chefköchin' },
  'patissier': { male: 'Patissier', female: 'Patissière' },
  'saucier': { male: 'Saucier', female: 'Saucière' },
  'bäckerjunge': { male: 'Bäckerjunge', female: 'Bäckermädchen' },
  'teigkneter': { male: 'Teigkneter', female: 'Teigkneterin' },
  'braubursche': { male: 'Braubursche', female: 'Braumagd' },
  'fasswäscher': { male: 'Fasswäscher', female: 'Fasswäscherin' },
  'fleischerbursche': { male: 'Fleischerbursche', female: 'Fleischermagd' },
  'pökelgehilfe': { male: 'Pökelgehilfe', female: 'Pökelgehilfin' },

  // Domestic & Noble
  'diener': { male: 'Diener', female: 'Dienerin' },
  'kammerdiener': { male: 'Kammerdiener', female: 'Kammerzofe' },
  'stubenmädchen': { male: 'Stubenbursche', female: 'Stubenmädchen' },
  'stubenbursche': { male: 'Stubenbursche', female: 'Stubenmädchen' },
  'zofe': { male: 'Kammerdiener', female: 'Zofe' },
  'kammerjungfer': { male: 'Kammerjunker', female: 'Kammerjungfer' },
  'garderobiere': { male: 'Garderobier', female: 'Garderobiere' },
  'oberhofdame': { male: 'Oberhofmeister', female: 'Oberhofdame' },
  'hausdame': { male: 'Hausherr', female: 'Hausdame' },
  'erste hausdame': { male: 'Erster Hausherr', female: 'Erste Hausdame' },
  'laufbursche': { male: 'Laufbursche', female: 'Laufmädchen' },
  'hauspage': { male: 'Hauspage', female: 'Hauspagin' },
  'saalbursche': { male: 'Saalbursche', female: 'Saalmagd' },
  'unterbutler': { male: 'Unterbutler', female: 'Unterbutlerin' },
  'butler': { male: 'Butler', female: 'Butlerin' },
  'chefbutler': { male: 'Chefbutler', female: 'Chefbutlerin' },
  'haushofmeister': { male: 'Haushofmeister', female: 'Haushofmeisterin' },
  'majordomus': { male: 'Majordomus', female: 'Majordoma' },
  'großhofmeister': { male: 'Großhofmeister', female: 'Großhofmeisterin' },
  'seneschall': { male: 'Seneschall', female: 'Seneschallin' },

  // Craft & Smith
  'schmiedejunge': { male: 'Schmiedejunge', female: 'Schmiedemädchen' },
  'essegehilfe': { male: 'Essegehilfe', female: 'Essegehilfin' },
  'werkstattbursche': { male: 'Werkstattbursche', female: 'Werkstattmagd' },
  'schlosserjunge': { male: 'Schlosserjunge', female: 'Schlossermädchen' },
  'feilbursche': { male: 'Feilbursche', female: 'Feilmagd' },
  'schmelzergehilfe': { male: 'Schmelzergehilfe', female: 'Schmelzergehilfin' },
  'tiegelbursche': { male: 'Tiegelbursche', female: 'Tiegelmagd' },
  'schmelzjunge': { male: 'Schmelzjunge', female: 'Schmelzmädchen' },
  'hobeljunge': { male: 'Hobeljunge', female: 'Hobelmädchen' },
  'nadelbursche': { male: 'Nadelbursche', female: 'Nadelmagd' },
  'zimmermann': { male: 'Zimmermann', female: 'Zimmerin' },
  'zimmererlehrling': { male: 'Zimmererlehrling', female: 'Zimmerinlehrling' },

  // Seafaring
  'schiffsjunge': { male: 'Schiffsjunge', female: 'Schiffsmädchen' },
  'decksbursche': { male: 'Decksbursche', female: 'Decksmagd' },
  'seemann': { male: 'Seemann', female: 'Seefrau' },
  'bootsmann': { male: 'Bootsmann', female: 'Bootsfrau' },
  'oberbootsmann': { male: 'Oberbootsmann', female: 'Oberbootsfrau' },
  'steuermann': { male: 'Steuermann', female: 'Steuerfrau' },
  'leichtmatrose': { male: 'Leichtmatrose', female: 'Leichtmatrosin' },
  'vollmatrose': { male: 'Vollmatrose', female: 'Vollmatrosin' },

  // Military & Guard
  'rekrut': { male: 'Rekrut', female: 'Rekrutin' },
  'trossknecht': { male: 'Trossknecht', female: 'Trossmagd' },
  'knecht': { male: 'Knecht', female: 'Magd' },
  'hofknecht': { male: 'Hofknecht', female: 'Hofmagd' },
  'hauptmann': { male: 'Hauptmann', female: 'Hauptfrau' },
  'feldwebel': { male: 'Feldwebel', female: 'Feldwebelin' },
  'landsknecht': { male: 'Landsknecht', female: 'Landsknechtin' },
  'knappe': { male: 'Knappe', female: 'Knappenmaid' },
  'ritter': { male: 'Ritter', female: 'Ritterin' },

  // Commerce, Law & Clergy
  'kaufmann': { male: 'Kaufmann', female: 'Kauffrau' },
  'handelsherr': { male: 'Handelsherr', female: 'Handelsdame' },
  'kontorbursche': { male: 'Kontorbursche', female: 'Kontormagd' },
  'akolyth': { male: 'Akolyth', female: 'Akolythin' },
  'mönch': { male: 'Mönch', female: 'Nonne' },
  'nonne': { male: 'Mönch', female: 'Nonne' },
  'abt': { male: 'Abt', female: 'Äbtissin' },
  'priester': { male: 'Priester', female: 'Priesterin' },
  'bischof': { male: 'Bischof', female: 'Bischöfin' },

  // Underworld & Rogue
  'gassenjunge': { male: 'Gassenjunge', female: 'Gassenmädchen' },
  'taschendieb': { male: 'Taschendieb', female: 'Taschendiebin' },
  'beutelschneider': { male: 'Beutelschneider', female: 'Beutelschneiderin' },
  'schattenfürst': { male: 'Schattenfürst', female: 'Schattenfürstin' },

  // Art & Music
  'barde': { male: 'Barde', female: 'Bardin' },
  'spielmann': { male: 'Spielmann', female: 'Spielfrau' },
  'skalde': { male: 'Skalde', female: 'Skaldin' },
  'hofskalde': { male: 'Hofskalde', female: 'Hofskaldin' },

  // Magic & Scholarly
  'magier': { male: 'Magier', female: 'Magierin' },
  'novize': { male: 'Novize', female: 'Novizin' },
  'arkan-novize': { male: 'Arkan-Novize', female: 'Arkan-Novizin' },
  'erzmagier': { male: 'Erzmagier', female: 'Erzmagierin' },
  'zauberer': { male: 'Zauberer', female: 'Zauberin' },
  'hexe': { male: 'Hexer', female: 'Hexe' },
  'hexer': { male: 'Hexer', female: 'Hexe' },

  // Medicine
  'arzt': { male: 'Arzt', female: 'Ärztin' },
  'wundarzt': { male: 'Wundarzt', female: 'Wundärztin' },
  'militärarzt': { male: 'Militärarzt', female: 'Militärärztin' },
  'meisterarzt': { male: 'Meisterarzt', female: 'Meisterärztin' },
  'chefarzt': { male: 'Chefarzt', female: 'Chefärztin' },
  'heiler': { male: 'Heiler', female: 'Heilerin' },
  'meisterheiler': { male: 'Meisterheiler', female: 'Meisterheilerin' },
  'apotheker': { male: 'Apotheker', female: 'Apothekerin' },
  'stadtapotheker': { male: 'Stadtapotheker', female: 'Stadtapothekerin' },

  // Agriculture & Nature
  'bauer': { male: 'Bauer', female: 'Bäuerin' },
  'jungbauer': { male: 'Jungbauer', female: 'Jungbäuerin' },
  'ackerwirt': { male: 'Ackerwirt', female: 'Ackerwirtin' },
  'saatjunge': { male: 'Saatjunge', female: 'Saatmädchen' },
  'gutspächter': { male: 'Gutspächter', female: 'Gutspächterin' },
  'hofbesitzer': { male: 'Hofbesitzer', female: 'Hofbesitzerin' },
  'dorfschulze': { male: 'Dorfschulze', female: 'Dorfschulzin' },
  'jäger': { male: 'Jäger', female: 'Jägerin' },
  'förster': { male: 'Förster', female: 'Försterin' },
  'oberförster': { male: 'Oberförster', female: 'Oberförsterin' },
  'falkner': { male: 'Falkner', female: 'Falknerin' },
  'imker': { male: 'Imker', female: 'Imkerin' },
  'zeidler': { male: 'Zeidler', female: 'Zeidlerin' }
};

/**
 * Returns clean masculine and feminine forms for any German profession string.
 */
export function getGenderPair(rawName: string): { male: string; female: string; full: string } {
  if (!rawName || !rawName.trim()) {
    return { male: '', female: '', full: '' };
  }

  const trimmed = rawName.trim();

  // If already formatted with '/' e.g. "Kaiser / Kaiserin" or "Koch / Köchin"
  if (trimmed.includes(' / ')) {
    const [m, f] = trimmed.split(' / ').map(s => s.trim());
    return { male: m, female: f || m, full: trimmed };
  }

  // Extract trailing parentheses e.g. "Schiffskoch (Smutje)" or "Lehrling (metall_waffen)"
  let mainPart = trimmed;
  let suffixPart = '';
  const parenMatch = trimmed.match(/^(.*?)\s*(\([^)]+\))$/);
  if (parenMatch) {
    mainPart = parenMatch[1].trim();
    suffixPart = ` ${parenMatch[2].trim()}`;
  }

  const lowerMain = mainPart.toLowerCase();

  // 1. Direct dictionary lookup
  if (IRREGULAR_GENDER_MAP[lowerMain]) {
    const entry = IRREGULAR_GENDER_MAP[lowerMain];
    const male = `${entry.male}${suffixPart}`;
    const female = `${entry.female}${suffixPart}`;
    return { male, female, full: `${male} / ${female}` };
  }

  // 2. Pattern-based derivation for compounds
  let male = mainPart;
  let female = mainPart;

  // Ends with ...junge -> ...mädchen
  if (/junge$/i.test(mainPart)) {
    female = mainPart.replace(/junge$/i, 'mädchen');
  }
  // Ends with ...bursche -> ...magd
  else if (/bursche$/i.test(mainPart)) {
    female = mainPart.replace(/bursche$/i, 'magd');
  }
  // Ends with ...knecht -> ...magd
  else if (/knecht$/i.test(mainPart)) {
    female = mainPart.replace(/knecht$/i, 'magd');
  }
  // Ends with ...mann -> ...frau
  else if (/mann$/i.test(mainPart)) {
    female = mainPart.replace(/mann$/i, 'frau');
  }
  // Ends with ...herr -> ...dame
  else if (/herr$/i.test(mainPart)) {
    female = mainPart.replace(/herr$/i, 'dame');
  }
  // Ends with ...koch -> ...köchin
  else if (/koch$/i.test(mainPart)) {
    female = mainPart.replace(/koch$/i, 'köchin');
  }
  // Ends with ...arzt -> ...ärztin
  else if (/arzt$/i.test(mainPart)) {
    female = mainPart.replace(/arzt$/i, 'ärztin');
  }
  // Ends with ...bauer -> ...bäuerin
  else if (/bauer$/i.test(mainPart)) {
    female = mainPart.replace(/bauer$/i, 'bäuerin');
  }
  // Ends with ...meister -> ...meisterin
  else if (/meister$/i.test(mainPart)) {
    female = mainPart.replace(/meister$/i, 'meisterin');
  }
  // Ends with ...gehilfe -> ...gehilfin
  else if (/gehilfe$/i.test(mainPart)) {
    female = mainPart.replace(/gehilfe$/i, 'gehilfin');
  }
  // Ends with ...diener -> ...dienerin
  else if (/diener$/i.test(mainPart)) {
    female = mainPart.replace(/diener$/i, 'dienerin');
  }
  // Ends with ...novize -> ...novizin
  else if (/novize$/i.test(mainPart)) {
    female = mainPart.replace(/novize$/i, 'novizin');
  }
  // Ends with ...schmied -> ...schmiedin
  else if (/schmied$/i.test(mainPart)) {
    female = mainPart.replace(/schmied$/i, 'schmiedin');
  }
  // Ends with ...ist -> ...istin
  else if (/ist$/i.test(mainPart)) {
    female = mainPart.replace(/ist$/i, 'istin');
  }
  // Ends with ...or -> ...orin
  else if (/or$/i.test(mainPart)) {
    female = mainPart.replace(/or$/i, 'orin');
  }
  // Ends with ...ent -> ...entin
  else if (/ent$/i.test(mainPart)) {
    female = mainPart.replace(/ent$/i, 'entin');
  }
  // Ends with ...er -> ...erin (e.g. Brauer -> Brauerin, Krieger -> Kriegerin, Zauberer -> Zauberin)
  else if (/er$/i.test(mainPart)) {
    female = mainPart.replace(/er$/i, 'erin');
  }
  // Ends with ...e -> ...in (e.g. Barde -> Bardin, Schütze -> Schützin, Knappe -> Knappenmaid)
  else if (/e$/i.test(mainPart)) {
    female = `${mainPart}n`;
  }
  // Ends with ...el -> ...elin (e.g. Feldwebel -> Feldwebelin)
  else if (/el$/i.test(mainPart)) {
    female = `${mainPart}in`;
  }
  // Fallback: append "in"
  else {
    female = `${mainPart}in`;
  }

  // Ensure first character capitalization is preserved
  if (mainPart.length > 0 && mainPart[0] === mainPart[0].toUpperCase()) {
    female = female.charAt(0).toUpperCase() + female.slice(1);
    male = male.charAt(0).toUpperCase() + male.slice(1);
  }

  const fullMale = `${male}${suffixPart}`;
  const fullFemale = `${female}${suffixPart}`;

  return {
    male: fullMale,
    female: fullFemale,
    full: fullMale === fullFemale ? fullMale : `${fullMale} / ${fullFemale}`
  };
}

/**
 * Formats a profession title for dual-gender display: "Männlich / Weiblich"
 * (e.g. "Koch / Köchin", "Küchenjunge / Küchenmädchen", "Feldkoch / Feldköchin")
 */
export function formatGenderedProfessionTitle(name: string): string {
  return getGenderPair(name).full;
}
