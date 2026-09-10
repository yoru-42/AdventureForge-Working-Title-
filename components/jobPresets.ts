export interface JobCategory {
  fieldId: string;
  category: string;
  jobs: string[];
}

// IMPORTANT: This list contains professions only.
// Nobility/social titles are intentionally NOT professions and are stored separately.
// Duplicate profession names in different fields remain separate entries in their
// respective fields; the UI must never merge unrelated professions into one label.
export const JOB_CATEGORIES: JobCategory[] = [
  {
    fieldId: "adel_herrschaft",
    category: "Hof, Herrschaft & politische Dienste",
    jobs: [
      "Berater",
      "Diplomat / Unterhändler",
      "Taktiker",
      "Kanzler",
      "Verwalter",
      "Kurfürstlicher Beamter",
      "Kommandant",
      "Admiral",
      "General",
      "Paladin / Heiliger Ritter",
      "Runenritter",
      "Drachenritter / Drachenkrieger",
      "Leibwächter",
      "Körperdouble",
      "Grenzpatrouille",
      "Architekt (Festungsbau)",
      "Astrologe",
      "Wahrsager",
      "Held"
    ]
  },
  {
    fieldId: "religion_klerus",
    category: "Religion & Klerus",
    jobs: [
      "Saint / Saintess",
      "Hochpriester / Kardinal",
      "Bischof / Propst",
      "Theokrat",
      "Abt / Äbtissin",
      "Orakel",
      "Kleriker",
      "Kriegspriester",
      "Exorzist",
      "Inquisitor",
      "Pilger",
      "Kannushi / Shinshoku",
      "Gūji (Oberpriester)",
      "Negi / Gon-Negi",
      "Miko",
      "Kannagi",
      "Sohei (Kriegermönch)",
      "Yamabushi",
      "Onmyōji",
      "Ajari"
    ]
  },
  {
    fieldId: "arkan_magie",
    category: "Arkan & Magie",
    jobs: [
      "Arkan",
      "Arkanist",
      "Elementarist",
      "Sigilmancer",
      "Talismanzer",
      "Runenmeister",
      "Runenschmied",
      "Magischer Kunstfertiger",
      "Orakel",
      "Medium",
      "Traumwandler",
      "Nekromant",
      "Curseblade",
      "Specter-Benutzer",
      "Untotenbeschwörer",
      "Giftbenutzer"
    ]
  },
  {
    fieldId: "militaer_streitkraefte",
    category: "Militär & reguläre Streitkräfte",
    jobs: [
      "Soldat",
      "Offizier",
      "Kommandant",
      "General",
      "Admiral",
      "Quartiermeister",
      "Belagerungsingenieur",
      "Berserker",
      "Rächer / Avenger",
      "Duellant",
      "Kanonier / Gunner",
      "Jäger",
      "Scout / Pfadfinder",
      "Taktiker",
      "Riesentöter"
    ]
  },
  {
    fieldId: "unabhaengige_abenteurer",
    category: "Unabhängige Kämpfer & Abenteurer",
    jobs: [
      "Söldner",
      "Gladiator",
      "Ninja",
      "Drachenjäger",
      "Arzt",
      "Alchemist",
      "Apotheker",
      "Forscher",
      "Bibliothekar",
      "Archäologe",
      "Kryptograph",
      "Kartograph",
      "Lehrer / Trainer",
      "Detektiv"
    ]
  },
  {
    fieldId: "verwaltung_wirtschaft",
    category: "Verwaltung & Wirtschaft",
    jobs: [
      "Buchhalter",
      "Steuereintreiber",
      "Händler",
      "Vermieter",
      "Verhandlungsführer",
      "Sekretär",
      "Kurier"
    ]
  },
  {
    fieldId: "kunst_kultur",
    category: "Kunst & Kultur",
    jobs: [
      "Musiker",
      "Maler",
      "Schriftsteller / Romancier",
      "Schauspieler / Tänzer",
      "Bänkelsänger",
      "Puppenspieler",
      "Idol / Diva"
    ]
  },
  {
    fieldId: "metall_waffen",
    category: "Metall & Waffen",
    jobs: [
      "Schmied",
      "Waffenschmied",
      "Schwertschmied",
      "Rüstungsschmied",
      "Mechaniker",
      "Instrumentenbauer"
    ]
  },
  {
    fieldId: "materialverarbeitung",
    category: "Materialverarbeitung",
    jobs: [
      "Gerber",
      "Kürschner",
      "Seiler",
      "Glasmacher",
      "Wagner",
      "Zimmermann",
      "Holzarbeiter"
    ]
  },
  {
    fieldId: "luxus_spezial",
    category: "Luxus & Spezial",
    jobs: [
      "Juwelier",
      "Edelsteinschmied",
      "Parfümeur",
      "Brauer",
      "Koch / Küchenchef",
      "Florist"
    ]
  },
  {
    fieldId: "landwirtschaft_versorgung",
    category: "Landwirtschaft, Versorgung & Sammelberufe",
    jobs: [
      "Bauer / Landwirt",
      "Fischer",
      "Bergmann",
      "Sammler",
      "Kräutersammler",
      "Fallensteller",
      "Verkäufer",
      "Milchbauer",
      "Futtersucher"
    ]
  },
  {
    fieldId: "wandernde_erkundung",
    category: "Wandernde Existenzen & Erkundung",
    jobs: [
      "Nomade",
      "Wanderer",
      "Prospektor",
      "Entdecker",
      "Tracker / Trapper",
      "Jäger"
    ]
  },
  {
    fieldId: "tierfuehrung_tamer",
    category: "Tierführung & Tamer",
    jobs: [
      "Tiertrainer",
      "Falkner",
      "Mahout (Elefantenführer)",
      "Beast Tamer",
      "Bug Tamer",
      "Drachenzähmer",
      "Dämonen-Tamer"
    ]
  },
  {
    fieldId: "kriminelle_berufe",
    category: "Kriminelle Berufe",
    jobs: [
      "Dieb / Rogue",
      "Schurke",
      "Outlaw",
      "Pirat",
      "Schmuggler",
      "Fälscher",
      "Glücksspieler",
      "Phantom-Dieb"
    ]
  },
  {
    fieldId: "geheimoperationen_ueberleben",
    category: "Geheimoperationen & Überleben",
    jobs: [
      "Spion",
      "Auftragskiller / Hitman",
      "Ninja",
      "Deserteur",
      "Überlebenskünstler",
      "Survivor",
      "Flüchtiger",
      "Kopfgeldjäger",
      "Untotenjäger"
    ]
  },
  {
    fieldId: "haushalt_dienste",
    category: "Haushalt & persönliche Dienste",
    jobs: [
      "Butler",
      "Maid / Dienstmädchen",
      "Haushälterin",
      "Koch",
      "Kutscher",
      "Sekretär",
      "Florist",
      "Vorkoster"
    ]
  },
  {
    fieldId: "unterhaltung_spezial",
    category: "Unterhaltung & besondere Tätigkeiten",
    jobs: [
      "Akrobat",
      "Tänzer",
      "Kurtisane",
      "Puppenspieler",
      "Totengräber",
      "Vogelabrichter",
      "Magical Girl"
    ]
  },
  {
    fieldId: "private_gesellschaftsrollen",
    category: "Private / gesellschaftliche Lebensrollen",
    jobs: [
      "Hausfrau / Hausmann",
      "Sklave",
      "Schüler",
      "Student"
    ]
  }
];

export const ALL_PRESET_JOBS: string[] = JOB_CATEGORIES.flatMap(c => c.jobs);

export interface NobleChildGroup {
  house: string;
  titles: string[];
}

// Separate system: these are social/nobility titles, NOT professions.
export const NOBLE_CHILD_GROUPS: NobleChildGroup[] = [
  {
    house: "Herzogshaus",
    titles: ["Herzogstochter", "Herzogsohn", "Erbherzogstochter", "Erbherzog"]
  },
  {
    house: "Grafenhaus",
    titles: ["Grafentochter", "Grafensohn", "Komtesse", "Erbgräfin", "Erbgraf"]
  },
  {
    house: "Baronie & Freihof",
    titles: ["Baronstochter", "Baronssohn", "Freiin", "Freiherr (Nachkomme)"]
  },
  {
    house: "Königshaus & Fürstentum",
    titles: ["Prinzessin", "Prinz", "Königstochter", "Königssohn", "Fürstentochter", "Fürstensohn", "Erbprinzessin", "Erbprinz"]
  },
  {
    house: "Allgemeiner Adel & Erben",
    titles: ["Erbtochter", "Erbsohn", "Edelfräulein", "Junker", "Lordstochter", "Lordsohn", "Adelsnachkomme"]
  }
];

// Backwards-compatible export name for existing imports.
export const NOBLE_CHILDREN_GROUPS = NOBLE_CHILD_GROUPS;

/** Finds the profession field for a profession name. */
export function getFieldIdForJob(jobName: string): string | undefined {
  if (!jobName || !jobName.trim()) return undefined;
  const lower = jobName.toLowerCase().trim();

  for (const cat of JOB_CATEGORIES) {
    for (const j of cat.jobs) {
      const jLower = j.toLowerCase();
      if (jLower === lower || jLower.split(' / ').some(part => part.trim() === lower)) {
        return cat.fieldId;
      }
    }
  }

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
  return JOB_CATEGORIES.find(c => c.fieldId === fieldId || c.category.toLowerCase() === fieldId.toLowerCase());
}
