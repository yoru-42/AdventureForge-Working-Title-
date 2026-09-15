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
      "Küchenhilfe",
      "Bäcker",
      "Konditor",
      "Metzger",
      "Fischverarbeiter",
      "Brauer",
      "Brenner",
      "Müller",
      "Ölmüller",
      "Räucherer",
      "Wurstmacher",
      "Mälzer",
      "Mostmacher",
      "Lebensmittelkonservierer",
      "Wirt",
      "Gastwirt",
      "Schankwirt",
      "Kellner",
      "Tavernenkoch",
      "Hofkoch",
      "Käser",
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
      "Ziegelmacher",
      "Ziegelbrenner",
      "Töpfer",
      "Keramiker",
      "Drechsler",
      "Holzschnitzer",
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
      "Gewandmacher",
      "Weber",
      "Spinner",
      "Garnmacher",
      "Tuchmacher",
      "Tuchwalker",
      "Teppichweber",
      "Teppichknüpfer",
      "Sticker",
      "Hutmacher",
      "Handschuhmacher",
      "Färber",
      "Seiler",
      "Papiermacher",
      "Buchbinder",
      "Buchdrucker",
      "Glaser",
      "Vergolder",
      "Mosaikleger",
      "Stuckateur",
      "Fliesenleger",
      "Gerüstbauer",
      "Bauzeichner",
      "Vermesser",
      "Wagenbauer",
      "Böttcher",
      "Brunnenbauer",
      "Brückenbauer",
      "Architekt",
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
      "Artefaktschmied"
    ]
  },
  {
    fieldId: "natur_landwirtschaft",
    category: "Natur & Landwirtschaft",
    jobs: [
      "Bauer",
      "Getreidebauer",
      "Gemüsebauer",
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
      "Heilergehilfe",
      "Feldarzt",
      "Militärarzt",
      "Feldscher",
      "Chirurg",
      "Chirurgiegehilfe",
      "Apotheker",
      "Apothekergehilfe",
      "Kräuterkundiger",
      "Hebamme",
      "Geburtshelfer",
      "Krankenpfleger",
      "Krankenwärter",
      "Pflegehelfer",
      "Giftkundiger",
      "Anatom",
      "Tierarzt",
      "Schiffsarzt",
      "Magieheiler"
    ]
  },
  {
    fieldId: "wissenschaft",
    category: "Wissenschaft",
    jobs: [
      "Gelehrter",
      "Forscher",
      "Historiker",
      "Chronist",
      "Archäologe",
      "Kartograph",
      "Astronom",
      "Naturkundler",
      "Geograph",
      "Geologe",
      "Mathematiker",
      "Sprachgelehrter",
      "Kopist",
      "Kalligraf",
      "Übersetzer",
      "Dolmetscher",
      "Privatlehrer",
      "Hauslehrer",
      "Dozent",
      "Bibliotheksgehilfe",
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
      "Ausbilder",
      "Professor"
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
      "Krämer",
      "Warenhändler",
      "Rohstoffhändler",
      "Lebensmittelhändler",
      "Stoffhändler",
      "Waffenhändler",
      "Rüstungshändler",
      "Juwelier / Juwelenhändler",
      "Viehhändler",
      "Antiquitätenhändler",
      "Geldwechsler",
      "Bankier",
      "Pfandleiher",
      "Schiffshändler",
      "Straßenverkäufer",
      "Marktverkäufer",
      "Warenprüfer",
      "Makler",
      "Händleragent",
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
      "Kurtisane",
      "Maid",
      "Leibeigener"
    ]
  },
  {
    fieldId: "verwaltung",
    category: "Verwaltung",
    jobs: [
      "Schreiber",
      "Stadtschreiber",
      "Protokollführer",
      "Aktenverwalter",
      "Sekretär",
      "Buchhalter",
      "Verwalter",
      "Beamter",
      "Steuereintreiber",
      "Zollbeamter",
      "Grenzbeamter",
      "Standesbeamter",
      "Zöllner",
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
      "Versorgungssoldat",
      "Quartiermeister",
      "Militärhandwerker",
      "Waffenmeister",
      "Offizier",
      "Kommandant",
      "General",
      "Kavallerist",
      "Leibwächter",
      "Karawanenwächter"
    ]
  },
  {
    fieldId: "seefahrt",
    category: "Seefahrt",
    jobs: [
      "Matrose",
      "Deckarbeiter",
      "Steuermann",
      "Navigator",
      "Lotse",
      "Schiffszimmermann",
      "Schiffsbauer",
      "Bootsbauer",
      "Segelmacher",
      "Takler",
      "Tauwerkmacher",
      "Schiffsreeder",
      "Werftarbeiter",
      "Fischer",
      "Hafenarbeiter",
      "Hafenmeister",
      "Schiffskoch",
      "Kanonier",
      "Ausguck",
      "Schiffswart",
      "Kapitän",
      "Lotsenführer",
      "Bootsmann",
      "Taucher"
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
      "Magielehrer",
      "Runenschreiber",
      "Verzauberer",
      "Beschwörer",
      "Wahrsager",
      "Ritualist",
      "Arkanist",
      "Elementarmagier",
      "Sigilmancer",
      "Talismanzer",
      "Nekromant",
      "Medium",
      "Traumwandler"
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
      "Orakel"
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
