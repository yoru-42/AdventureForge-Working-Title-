export interface JobCategory {
  fieldId: string;
  category: string;
  jobs: string[];
}

// ============================================================================
// ADVENTUREFORGE BERUFSKATALOG & BERUFSZWEIGE
// 16 KERN-BERUFSZWEIGE NACH SYSTEMVORGABE
// ============================================================================

export const JOB_CATEGORIES: JobCategory[] = [
  {
    fieldId: "lebensmittel_versorgung",
    category: "Lebensmittel & Versorgung",
    jobs: [
      "Koch",
      "Köchin",
      "Küchenhilfe",
      "Bäcker",
      "Konditor",
      "Metzger",
      "Schlachter",
      "Fischverarbeiter",
      "Fischer",
      "Brauer",
      "Brenner",
      "Müller",
      "Ölmüller",
      "Räucherer",
      "Pökler",
      "Wurstmacher",
      "Mälzer",
      "Mostmacher",
      "Lebensmittelkonservierer",
      "Käser",
      "Imker",
      "Winzer",
      "Wirt",
      "Gastwirt",
      "Schankwirt",
      "Kellner",
      "Tavernenkoch",
      "Hofkoch",
      "Vorkoster"
    ]
  },
  {
    fieldId: "bau_handwerk",
    category: "Bau & Handwerk",
    jobs: [
      "Schreiner",
      "Zimmermann",
      "Tischler",
      "Maurer",
      "Steinmetz",
      "Dachdecker",
      "Pflasterer",
      "Straßenbauer",
      "Brunnenbauer",
      "Kanalbauer",
      "Bauarbeiter",
      "Baumeister",
      "Bauingenieur",
      "Vermesser",
      "Festungsbauer",
      "Brückenbauer",
      "Minenbauer",
      "Architekt",
      "Bauplaner",
      "Ziegelmacher",
      "Ziegelbrenner",
      "Töpfer",
      "Keramiker",
      "Drechsler",
      "Schnitzer",
      "Holzschnitzer",
      "Küfer",
      "Böttcher",
      "Korbflechter",
      "Korbmacher",
      "Besenmacher",
      "Bürstenmacher",
      "Kammacher",
      "Seifenmacher",
      "Kerzenmacher",
      "Gerber",
      "Lederhandwerker",
      "Sattler",
      "Riemer",
      "Kürschner",
      "Schuhmacher",
      "Schneider",
      "Näher",
      "Gewandmacher",
      "Weber",
      "Spinner",
      "Garnmacher",
      "Tuchmacher",
      "Tuchwalker",
      "Teppichweber",
      "Teppichknüpfer",
      "Seidenweber",
      "Sticker",
      "Hutmacher",
      "Handschuhmacher",
      "Färber",
      "Seiler",
      "Papiermacher",
      "Buchbinder",
      "Buchdrucker",
      "Graveur",
      "Glaser",
      "Vergolder",
      "Mosaikleger",
      "Stuckateur",
      "Fliesenleger",
      "Gerüstbauer",
      "Bauzeichner",
      "Wagenbauer",
      "Handwerkergehilfe"
    ]
  },
  {
    fieldId: "metall_feinhandwerk",
    category: "Metall & Feinhandwerk",
    jobs: [
      "Schmied",
      "Grobschmied",
      "Waffenschmied",
      "Rüstungsschmied",
      "Plattner",
      "Blechschmied",
      "Kupferschmied",
      "Zinngießer",
      "Messingschmied",
      "Kesselschmied",
      "Nagelschmied",
      "Drahtzieher",
      "Gürtler",
      "Feinschmied",
      "Goldschmied",
      "Silberschmied",
      "Juwelier",
      "Edelsteinschleifer",
      "Werkzeugmacher",
      "Hufschmied",
      "Feinmechaniker",
      "Uhrmacher",
      "Kettenmacher",
      "Klingenschleifer",
      "Schlosser",
      "Gießer",
      "Graveur",
      "Runenschmied",
      "Artefaktschmied",
      "Artefaktmacher",
      "Magiekristall-Schleifer"
    ]
  },
  {
    fieldId: "natur_landwirtschaft",
    category: "Natur & Landwirtschaft",
    jobs: [
      "Bauer",
      "Bäuerin",
      "Getreidebauer",
      "Gemüsebauer",
      "Gemüseanbauer",
      "Obstbauer",
      "Saatgutbauer",
      "Reisbauer",
      "Ölsaatenbauer",
      "Gewürzanbauer",
      "Kräuterbauer",
      "Feldarbeiter",
      "Landarbeiter",
      "Erntehelfer",
      "Drescher",
      "Gärtner",
      "Obstgärtner",
      "Bewässerungsbauer",
      "Winzer",
      "Imker",
      "Viehzüchter",
      "Tierzüchter",
      "Geflügelzüchter",
      "Geflügelhalter",
      "Pferdezüchter",
      "Fischzüchter",
      "Hirte",
      "Viehhirte",
      "Schäfer",
      "Ziegenhirte",
      "Rinderhirte",
      "Schweinehirte",
      "Bereiter",
      "Reitlehrer",
      "Tierpfleger",
      "Tiertrainer",
      "Jagdhundführer",
      "Jäger",
      "Fallensteller",
      "Fährtenleser",
      "Förster",
      "Waldhüter",
      "Waldläuferin",
      "Jägerin",
      "Kräuterfrau",
      "Kräutersammlerin",
      "Holzfäller",
      "Waldarbeiter",
      "Holzsammler",
      "Harzsammler",
      "Flößer",
      "Kräutersammler",
      "Pflanzenkundler",
      "Bergarbeiter",
      "Minenarbeiter",
      "Grubenarbeiter",
      "Erzgräber",
      "Erzaufbereiter",
      "Erzsortierer",
      "Steinbrucharbeiter",
      "Salzarbeiter",
      "Salzsieder",
      "Salzbergmann",
      "Edelsteinabbauer",
      "Kristallabbauer",
      "Prospektor",
      "Köhler",
      "Falkner"
    ]
  },
  {
    fieldId: "medizin",
    category: "Medizin",
    jobs: [
      "Arzt",
      "Wundarzt",
      "Zahnarzt",
      "Bader",
      "Heiler",
      "Heilerin",
      "Heilergehilfe",
      "Feldarzt",
      "Militärarzt",
      "Feldscher",
      "Chirurg",
      "Chirurgiegehilfe",
      "Apotheker",
      "Apothekergehilfe",
      "Kräuterkundiger",
      "Kräuterkundige",
      "Hebamme",
      "Geburtshelfer",
      "Krankenpfleger",
      "Krankenwärter",
      "Pflegehelfer",
      "Giftkundiger",
      "Anatom",
      "Tierarzt",
      "Schiffsarzt",
      "Magieheiler",
      "Alchemist",
      "Bestatter"
    ]
  },
  {
    fieldId: "wissenschaft",
    category: "Wissenschaft",
    jobs: [
      "Gelehrter",
      "Professor",
      "Dozent",
      "Forscher",
      "Historiker",
      "Chronist",
      "Archäologe",
      "Kartograph",
      "Astronom",
      "Naturforscher",
      "Naturkundler",
      "Geograph",
      "Geologe",
      "Mathematiker",
      "Sprachgelehrter",
      "Schreiber",
      "Kopist",
      "Kalligraf",
      "Übersetzer",
      "Dolmetscher",
      "Archivar",
      "Bibliothekar",
      "Bibliotheksgehilfe",
      "Privatlehrer",
      "Hauslehrer",
      "Buchhändler",
      "Verleger",
      "Lektor",
      "Redakteur",
      "Journalist",
      "Alchemist",
      "Magieforscher",
      "Magietheoretiker",
      "Kristallkundiger",
      "Lehrer",
      "Ausbilder"
    ]
  },
  {
    fieldId: "handel_wirtschaft",
    category: "Handel & Wirtschaft",
    jobs: [
      "Händler",
      "Kaufmann",
      "Markthändler",
      "Fernhändler",
      "Großhändler",
      "Einzelhändler",
      "Krämer",
      "Warenhändler",
      "Rohstoffhändler",
      "Händler für Rohstoffe",
      "Lebensmittelhändler",
      "Gewürzhändler",
      "Stoffhändler",
      "Waffenhändler",
      "Rüstungshändler",
      "Juwelier",
      "Viehhändler",
      "Antiquitätenhändler",
      "Händler für magische Gegenstände",
      "Geldwechsler",
      "Bankier",
      "Pfandleiher",
      "Schiffshändler",
      "Straßenverkäufer",
      "Marktverkäufer",
      "Warenprüfer",
      "Makler",
      "Händleragent",
      "Handelsvertreter",
      "Karawanenhändler",
      "Auktionator",
      "Spediteur",
      "Transporteur",
      "Lagerverwalter",
      "Lagerarbeiter"
    ]
  },
  {
    fieldId: "dienstleistung",
    category: "Dienstleistung",
    jobs: [
      "Barbier",
      "Friseur",
      "Kosmetiker",
      "Wäscher",
      "Reinigungskraft",
      "Dienstbote",
      "Hausdiener",
      "Kammerdiener",
      "Butler",
      "Haushälter",
      "Hausmeister",
      "Kinderbetreuer",
      "Pfleger",
      "Stallknecht",
      "Pferdepfleger",
      "Stallmeister",
      "Portier",
      "Türsteher",
      "Wächter",
      "Bote",
      "Kurier",
      "Postbote",
      "Fuhrknecht",
      "Wagenführer",
      "Fuhrmann",
      "Kutscher",
      "Wagenbauer",
      "Lastenträger",
      "Gepäckträger",
      "Lasttierführer",
      "Packtierführer",
      "Fuhrunternehmer",
      "Logistiker",
      "Hafenlogistiker",
      "Hafenlotse",
      "Reiseführer",
      "Karawanenführer",
      "Karawanenorganisator",
      "Bestatter",
      "Müllsammler",
      "Kurtisane",
      "Maid",
      "Leibeigener"
    ]
  },
  {
    fieldId: "verwaltung",
    category: "Verwaltung",
    jobs: [
      "Bürgermeister",
      "Dorfältester",
      "Stadtrat",
      "Stadtmeister",
      "Straßenmeister",
      "Beamter",
      "Schreiber",
      "Stadtschreiber",
      "Protokollführer",
      "Aktenverwalter",
      "Sekretär",
      "Buchhalter",
      "Verwalter",
      "Steuereintreiber",
      "Zollbeamter",
      "Grenzbeamter",
      "Standesbeamter",
      "Zöllner",
      "Polizist / Ordnungshüter",
      "Wache",
      "Gefängniswärter",
      "Feuerwehrmann",
      "Müllsammler",
      "Rechtsgelehrter",
      "Rechtsberater",
      "Richter",
      "Gerichtsschreiber",
      "Gerichtsdiener",
      "Vollstrecker",
      "Notar",
      "Gesandter",
      "Diplomat",
      "Kanzleimitarbeiter",
      "Bibliothekar",
      "Archivar",
      "Archivist",
      "Statthalter",
      "Herold",
      "Zeremonienmeister",
      "Hofmarschall"
    ]
  },
  {
    fieldId: "militaer",
    category: "Militär",
    jobs: [
      "Soldat",
      "Wachsoldat",
      "Gardist",
      "Stadtwache",
      "Wache",
      "Polizist / Ordnungshüter",
      "Grenzwächter",
      "Gefängniswärter",
      "Festungswächter",
      "Bogenschütze",
      "Armbrustschütze",
      "Späher",
      "Aufklärer",
      "Belagerungstechniker",
      "Ingenieur",
      "Militäringenieur",
      "Pionier",
      "Festungsbauer",
      "Versorgungssoldat",
      "Quartiermeister",
      "Militärhandwerker",
      "Waffenmeister",
      "Offizier",
      "Kommandant",
      "General",
      "Kavallerist",
      "Leibwächter",
      "Karawanenwächter",
      "Sohei"
    ]
  },
  {
    fieldId: "seefahrt",
    category: "Seefahrt",
    jobs: [
      "Matrose",
      "Seemann",
      "Deckarbeiter",
      "Steuermann",
      "Navigator",
      "Lotse",
      "Lotsenführer",
      "Schiffszimmermann",
      "Schiffsbauer",
      "Bootsbauer",
      "Segelmacher",
      "Takler",
      "Tauwerkmacher",
      "Schiffsreeder",
      "Werftarbeiter",
      "Fischer",
      "Perlenfischer",
      "Taucher",
      "Fährmann",
      "Hafenarbeiter",
      "Dockarbeiter",
      "Hafenmeister",
      "Schiffskoch",
      "Kanonier",
      "Ausguck",
      "Schiffswart",
      "Kapitän",
      "Admiral",
      "Bootsmann",
      "Pirat",
      "Freibeuter"
    ]
  },
  {
    fieldId: "kriminalitaet",
    category: "Kriminalität",
    jobs: [
      "Dieb",
      "Taschendieb",
      "Einbrecher",
      "Schmuggler",
      "Hehler",
      "Fälscher",
      "Spion",
      "Informant",
      "Glücksspieler",
      "Erpresser",
      "Attentäter",
      "Auftragskiller",
      "Bandit",
      "Pirat",
      "Freibeuter",
      "Straßenräuber",
      "Bandenführer",
      "Scharfrichter"
    ]
  },
  {
    fieldId: "magie",
    category: "Magie",
    jobs: [
      "Magier",
      "Magierin",
      "Hexe",
      "Hexer",
      "Magiehandwerker",
      "Magiekristall-Schleifer",
      "Artefaktschmied",
      "Artefaktmacher",
      "Zaubertrankbrauer",
      "Runengraveur",
      "Siegelmacher",
      "Zauberbuchschreiber",
      "Magischer Schneider",
      "Magischer Juwelier",
      "Beschwörer",
      "Verzauberer",
      "Magieanalytiker",
      "Magielehrer",
      "Runenschreiber",
      "Wahrsager",
      "Ritualist",
      "Arkanist",
      "Elementarmagier",
      "Sigilmancer",
      "Talismanzer",
      "Nekromant",
      "Medium",
      "Traumwandler",
      "Onmyōji"
    ]
  },
  {
    fieldId: "kunst_kultur",
    category: "Kunst & Kultur",
    jobs: [
      "Musiker",
      "Instrumentalist",
      "Sänger",
      "Tänzer",
      "Schauspieler",
      "Regisseur",
      "Choreograf",
      "Bühnenbildner",
      "Kostümbildner",
      "Akrobat",
      "Jongleur",
      "Zirkusartist",
      "Gaukler",
      "Barde",
      "Geschichtenerzähler",
      "Maler",
      "Illustrator",
      "Buchmaler",
      "Bildhauer",
      "Keramikkünstler",
      "Zeichner",
      "Schriftsteller",
      "Dichter",
      "Instrumentenbauer",
      "Tätowierer",
      "Puppenspieler",
      "Komponist",
      "Schausteller"
    ]
  },
  {
    fieldId: "religion",
    category: "Religion",
    jobs: [
      "Priester",
      "Priesterin",
      "Novize",
      "Klosterdiener",
      "Mönch",
      "Nonne",
      "Tempeldiener",
      "Tempelwächter",
      "Hohepriester",
      "Seelsorger",
      "Exorzist",
      "Missionar",
      "Pilgerführer",
      "Ritualmeister",
      "Bestattungspriester",
      "Paladin",
      "Inquisitor",
      "Orakel",
      "Miko",
      "Kannushi",
      "Sohei",
      "Onmyōji"
    ]
  },
  {
    fieldId: "abenteuer",
    category: "Abenteuer",
    jobs: [
      "Abenteurer",
      "Monsterjäger",
      "Schatzsucher",
      "Kopfgeldjäger",
      "Dungeonforscher",
      "Ruinenforscher",
      "Kundschafter",
      "Söldner",
      "Expeditionsteilnehmer",
      "Monsterkundiger",
      "Gladiator",
      "Berserker",
      "Bestienbändiger",
      "Drachenzähmer",
      "Überlebenskünstler"
    ]
  }
];

export const ALL_PRESET_JOBS: string[] = JOB_CATEGORIES.flatMap(c => c.jobs);

export interface NobleChildGroup {
  house: string;
  titles: string[];
}

// Separate System: Dies sind Standes- und Adelstitel, KEINE Berufe!
// Sie gehören ausschließlich in den Tag "Adelige Titel".
export const NOBLE_CHILD_GROUPS: NobleChildGroup[] = [
  {
    house: "Königshaus & Kaiserhaus",
    titles: ["Kronprinz", "Kronprinzessin", "Prinz", "Prinzessin", "Königssohn", "Königstochter", "Kaiserlicher Spross"]
  },
  {
    house: "Herzogshaus",
    titles: ["Erbherzog", "Erbherzogstochter", "Herzogsohn", "Herzogstochter"]
  },
  {
    house: "Fürstentum & Kurfürstentum",
    titles: ["Erbprinz", "Erbprinzessin", "Fürstensohn", "Fürstentochter", "Kurfürstlicher Erbfolger"]
  },
  {
    house: "Grafenhaus",
    titles: ["Erbgraf", "Erbgräfin", "Komtesse", "Grafensohn", "Grafentochter"]
  },
  {
    house: "Baronie & Freihof",
    titles: ["Baronssohn", "Baronstochter", "Freiin", "Freiherr (Nachkomme)"]
  },
  {
    house: "Allgemeiner Adel & Ritterstand",
    titles: ["Erbtochter", "Erbsohn", "Edelfräulein", "Junker", "Lordsohn", "Lordstochter", "Adelsnachkomme", "Knappe / Schildknappe"]
  }
];

// Backwards-compatible export name for existing imports.
export const NOBLE_CHILDREN_GROUPS = NOBLE_CHILD_GROUPS;

export const FIELD_ID_ALIASES: Record<string, string> = {
  staatsdienst_diplomatie: 'verwaltung',
  adel_herrschaft: 'verwaltung',
  verwaltung_wirtschaft: 'verwaltung',
  verwaltung_recht: 'verwaltung',
  militaer_streitkraefte: 'militaer',
  militaer_sicherheit: 'militaer',
  unabhaengige_abenteurer: 'abenteuer',
  abenteuer_sondergewerbe: 'abenteuer',
  geheimoperationen_ueberleben: 'kriminalitaet',
  religion_klerus: 'religion',
  arkan_magie: 'magie',
  magie_arkana: 'magie',
  wissenschaft_forschung: 'wissenschaft',
  alchemie: 'wissenschaft',
  medizin_heilkunde: 'medizin',
  bildung_erziehung: 'wissenschaft',
  schrift_bildung: 'verwaltung',
  private_gesellschaftsrollen: 'dienstleistung',
  metall_waffen: 'metall_feinhandwerk',
  materialverarbeitung: 'bau_handwerk',
  bergbau_rohstoffe: 'natur_landwirtschaft',
  lebensmittel_ernaehrung: 'lebensmittel_versorgung',
  landwirtschaft_versorgung: 'natur_landwirtschaft',
  wandernde_erkundung: 'abenteuer',
  tierfuehrung_tamer: 'natur_landwirtschaft',
  kriminelle_berufe: 'kriminalitaet',
  haushalt_dienste: 'dienstleistung',
  unterhaltung_spezial: 'kunst_kultur',
  luxus_spezial: 'metall_feinhandwerk'
};

/** Finds the profession field for a profession name. */
export function getFieldIdForJob(jobName: string): string | undefined {
  if (!jobName || !jobName.trim()) return undefined;
  const lower = jobName.toLowerCase().trim();

  // Direct and split match
  for (const cat of JOB_CATEGORIES) {
    for (const j of cat.jobs) {
      const jLower = j.toLowerCase();
      if (jLower === lower || jLower.split(' / ').some(part => part.trim() === lower)) {
        return cat.fieldId;
      }
    }
  }

  // Substring match
  if (lower.length >= 4) {
    for (const cat of JOB_CATEGORIES) {
      for (const j of cat.jobs) {
        const jLower = j.toLowerCase();
        if (lower.includes(jLower) || jLower.split(' / ').some(part => part.trim().length >= 4 && lower.includes(part.trim()))) {
          return cat.fieldId;
        }
      }
    }
  }

  return undefined;
}

export function getJobCategoryByFieldId(fieldId: string): JobCategory | undefined {
  if (!fieldId) return undefined;
  const targetId = FIELD_ID_ALIASES[fieldId] || fieldId;
  return JOB_CATEGORIES.find(c => c.fieldId === targetId || c.category.toLowerCase() === targetId.toLowerCase());
}

export type ProfessionType = 'civil' | 'combat';

export const COMBAT_FIELD_IDS = new Set<string>([
  'militaer',
  'abenteuer',
  'kriminalitaet',
  'magie'
]);

export const COMBAT_JOB_KEYWORDS = [
  'soldat', 'krieger', 'schwert', 'ritter', 'paladin', 'berserker', 'duellant',
  'speerkämpfer', 'speer', 'axtkämpfer', 'axt', 'bogenschütze', 'bogen', 'jäger',
  'schütze', 'dieb', 'assassine', 'ninja', 'mönch', 'faustkämpfer', 'magier',
  'schwarzmagier', 'weißmagier', 'rotmagier', 'blaumagier', 'elementarmagier',
  'beschwörer', 'kampfmagier', 'magischer ritter', 'runenritter', 'drachenritter',
  'nekromant', 'exorzist', 'kriegspriester', 'saint', 'saintess', 'held',
  'drachenjäger', 'monsterjäger', 'wächter', 'schildkämpfer', 'waldläufer',
  'scharfschütze', 'armbrustschütze', 'fallensteller', 'erzmagier', 'runenmagier',
  'siegelmagier', 'zeitmagier', 'dimensionsmagier', 'illusionsmagier', 'geistermagier',
  'beast tamer', 'monster tamer', 'drachenzähmer', 'geisterbeschwörer', 'dämonenbeschwörer',
  'golem-beschwörer', 'schwertheiliger', 'magieschwertheiliger', 'dämonenritter',
  'göttlicher ritter', 'schattenmeister', 'drachenblut', 'monsterlord', 'dämonenkönig',
  'dämonenfürst', 'auserwählter', 'weltenwanderer', 'wiedergeborener', 'söldner',
  'waffenmeister', 'gladiator', 'spion', 'meuchelmörder', 'bandit', 'raubritter',
  'stadtwache', 'garde', 'hauptmann', 'kommandant', 'general', 'admiral'
];

export function getProfessionTypeForField(fieldId: string): ProfessionType {
  const norm = (fieldId || '').toLowerCase().trim();
  if (COMBAT_FIELD_IDS.has(norm)) return 'combat';
  return 'civil';
}

export function getProfessionTypeForJob(jobName: string): ProfessionType {
  if (!jobName) return 'civil';
  const norm = jobName.toLowerCase().trim();
  if (COMBAT_JOB_KEYWORDS.some(kw => norm.includes(kw))) {
    return 'combat';
  }
  const fieldId = getFieldIdForJob(jobName);
  if (fieldId && COMBAT_FIELD_IDS.has(fieldId)) {
    return 'combat';
  }
  return 'civil';
}
