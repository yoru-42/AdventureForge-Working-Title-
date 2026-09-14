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
      "Glaser",
      "Töpfer",
      "Keramiker",
      "Gerber",
      "Lederhandwerker",
      "Sattler",
      "Schuhmacher",
      "Schneider",
      "Weber",
      "Färber",
      "Seiler",
      "Korbflechter",
      "Papiermacher",
      "Buchbinder",
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
      "Goldschmied",
      "Silberschmied",
      "Juwelier",
      "Edelsteinschleifer",
      "Werkzeugmacher",
      "Hufschmied",
      "Feinmechaniker",
      "Schlosser",
      "Gießer",
      "Kesselschmied",
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
      "Feldarbeiter",
      "Gärtner",
      "Obstbauer",
      "Winzer",
      "Imker",
      "Viehzüchter",
      "Hirte",
      "Jäger",
      "Förster",
      "Holzfäller",
      "Kräutersammler",
      "Pflanzenkundler",
      "Bergarbeiter",
      "Minenarbeiter",
      "Steinbrucharbeiter",
      "Prospektor",
      "Köhler",
      "Falkner",
      "Pferdezüchter",
      "Fallensteller",
      "Fährtenleser"
    ]
  },
  {
    fieldId: "medizin",
    category: "Medizin",
    jobs: [
      "Arzt",
      "Heiler",
      "Feldarzt",
      "Militärarzt",
      "Feldscher",
      "Chirurg",
      "Apotheker",
      "Kräuterkundiger",
      "Hebamme",
      "Krankenpfleger",
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
      "Sprachgelehrter",
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
      "Lebensmittelhändler",
      "Stoffhändler",
      "Waffenhändler",
      "Rüstungshändler",
      "Juwelier / Juwelenhändler",
      "Viehhändler",
      "Antiquitätenhändler",
      "Geldwechsler",
      "Bankier",
      "Schiffshändler",
      "Straßenverkäufer",
      "Marktverkäufer",
      "Warenprüfer",
      "Makler",
      "Händleragent",
      "Auktionator",
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
      "Butler",
      "Haushälter",
      "Kinderbetreuer",
      "Pfleger",
      "Stallknecht",
      "Pferdepfleger",
      "Stallmeister",
      "Bote",
      "Kurier",
      "Postbote",
      "Fuhrmann",
      "Kutscher",
      "Reiseführer",
      "Karawanenführer",
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
      "Sekretär",
      "Buchhalter",
      "Verwalter",
      "Beamter",
      "Steuereintreiber",
      "Zollbeamter",
      "Zöllner",
      "Richter",
      "Gerichtsschreiber",
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
      "Gardist",
      "Stadtwache",
      "Grenzwächter",
      "Bogenschütze",
      "Armbrustschütze",
      "Späher",
      "Aufklärer",
      "Belagerungstechniker",
      "Ingenieur",
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
      "Schiffszimmermann",
      "Segelmacher",
      "Fischer",
      "Hafenarbeiter",
      "Hafenmeister",
      "Schiffskoch",
      "Kanonier",
      "Ausguck",
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
      "Sänger",
      "Tänzer",
      "Schauspieler",
      "Akrobat",
      "Jongleur",
      "Barde",
      "Geschichtenerzähler",
      "Maler",
      "Bildhauer",
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
