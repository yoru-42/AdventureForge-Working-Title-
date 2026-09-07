export interface JobCategory {
  fieldId: string;
  category: string;
  jobs: string[];
}

export const JOB_CATEGORIES: JobCategory[] = [
  {
    fieldId: "bau_handwerk",
    category: "Bau & Handwerk",
    jobs: [
      "Schmied",
      "Schreiner / Tischler",
      "Schneider",
      "Schuster / Schuhmacher",
      "Töpfer",
      "Glasbläser",
      "Maurer / Bauhandwerker",
      "Bogenbauer",
      "Gerber",
      "Weberei-Handwerker",
      "Steinmetz",
      "Zimmermann",
      "Seiler",
      "Büchsenmacher",
      "Feinmechaniker",
      "Uhrmacher",
      "Goldschmied",
      "Juwelier",
      "Instrumentenbauer",
      "Optiker",
      "Graveur",
      "Siegelstecher"
    ]
  },
  {
    fieldId: "lebensmittel_ernaehrung",
    category: "Lebensmittel & Ernährung",
    jobs: [
      "Bäcker",
      "Metzger / Fleischer",
      "Brauer / Braumeister",
      "Winzer",
      "Müller",
      "Koch / Chefkoch",
      "Käser",
      "Obstbauer"
    ]
  },
  {
    fieldId: "natur_landwirtschaft",
    category: "Natur & Landwirtschaft",
    jobs: [
      "Bauer / Landwirt",
      "Jäger",
      "Förster",
      "Waldläufer",
      "Fischer",
      "Kräutersammler",
      "Holzfäller",
      "Kundschafter",
      "Trapper"
    ]
  },
  {
    fieldId: "tierhaltung",
    category: "Tierhaltung",
    jobs: [
      "Hirte",
      "Viehzüchter",
      "Pferdezüchter",
      "Hundezüchter",
      "Falkner",
      "Imker",
      "Stallmeister"
    ]
  },
  {
    fieldId: "wissenschaft_forschung",
    category: "Wissenschaft & Forschung",
    jobs: [
      "Gelehrter",
      "Kartograf",
      "Astronom",
      "Historiker",
      "Philosoph",
      "Mathematiker"
    ]
  },
  {
    fieldId: "medizin_heilkunde",
    category: "Medizin & Heilkunde",
    jobs: [
      "Arzt / Heiler",
      "Feldscher",
      "Wundarzt",
      "Apotheker",
      "Seuchenarzt",
      "Pfleger",
      "Hebamme",
      "Quacksalber"
    ]
  },
  {
    fieldId: "handel_wirtschaft",
    category: "Handel & Wirtschaft",
    jobs: [
      "Händler",
      "Kaufmann",
      "Krämer",
      "Geldwechsler",
      "Kontorist",
      "Auktionsleiter",
      "Hausierer",
      "Importeur / Exporteur",
      "Marktverkäufer",
      "Großhändler"
    ]
  },
  {
    fieldId: "verwaltung_recht",
    category: "Verwaltung & Recht",
    jobs: [
      "Schreiber",
      "Beamter",
      "Steuereintreiber",
      "Richter",
      "Diplomat",
      "Notar",
      "Verwalter",
      "Kanzler",
      "Herold",
      "Vogt",
      "Ratsherr / Berater",
      "Seneschall",
      "Lehntherr"
    ]
  },
  {
    fieldId: "militaer_sicherheit",
    category: "Militär & Sicherheit",
    jobs: [
      "Soldat",
      "Kommandant",
      "Offizier",
      "Hauptmann",
      "Rekrut",
      "Söldner",
      "Infanterist",
      "Reitersoldat / Kavallerist",
      "Bogenschütze",
      "Armbrustschütze",
      "Strategieberater",
      "Stadtwache",
      "Wache",
      "Leibwächter",
      "Patrouillenführer",
      "Torkontrolleur",
      "Nachtwächter",
      "Turmwächter",
      "Gefängniswärter",
      "Türsteher",
      "Paladin"
    ]
  },
  {
    fieldId: "seefahrt",
    category: "Seefahrt",
    jobs: [
      "Schiffer / Kapitän",
      "Matrose",
      "Steuermann",
      "Fährmann",
      "Hafenarbeiter",
      "Navigator",
      "Bootsmann"
    ]
  },
  {
    fieldId: "transport_logistik",
    category: "Transport & Logistik",
    jobs: [
      "Fuhrmann",
      "Kutschfahrer / Kutscher",
      "Bote / Eilbote",
      "Belademeister / Logistiker",
      "Karrenlenker"
    ]
  },
  {
    fieldId: "kunst_kultur",
    category: "Kunst & Kultur",
    jobs: [
      "Maler",
      "Bildhauer",
      "Dichter",
      "Kunsthandwerker",
      "Buchillustrator"
    ]
  },
  {
    fieldId: "unterhaltung",
    category: "Unterhaltung",
    jobs: [
      "Barde / Musiker",
      "Tänzer",
      "Gaukler / Akrobat",
      "Schauspieler",
      "Hofnarr",
      "Zirkusartist",
      "Jongleur"
    ]
  },
  {
    fieldId: "religion_klerus",
    category: "Religion & Klerus",
    jobs: [
      "Priester",
      "Kleriker",
      "Mönch / Nonne",
      "Inquisitor",
      "Tempeldiener",
      "Exorzist",
      "Orakel",
      "Hohepriester"
    ]
  },
  {
    fieldId: "magie_arkana",
    category: "Magie & Arkane Künste",
    jobs: [
      "Magieforscher",
      "Verzauberer",
      "Elementarmagier",
      "Beschwörer",
      "Nekromant",
      "Illusionist",
      "Artefaktforscher",
      "Ritualmagier",
      "Runenschmied"
    ]
  },
  {
    fieldId: "alchemie",
    category: "Alchemie",
    jobs: [
      "Alchemist",
      "Trankbrauer",
      "Giftmischer",
      "Essenzenforscher"
    ]
  },
  {
    fieldId: "bergbau_rohstoffe",
    category: "Bergbau & Rohstoffe",
    jobs: [
      "Bergmann / Bergarbeiter",
      "Schürfer",
      "Erzsucher",
      "Steinbrecher",
      "Köhler"
    ]
  },
  {
    fieldId: "schrift_bildung",
    category: "Schrift & Bildung",
    jobs: [
      "Bibliothekar",
      "Archivar",
      "Professor / Lehrmeister",
      "Student / Schüler",
      "Kalligraph",
      "Buchbinder"
    ]
  },
  {
    fieldId: "dienstleistungen",
    category: "Dienstleistungen",
    jobs: [
      "Tavernenwirt / Wirt",
      "Kellner",
      "Maid / Hausmädchen",
      "Magd",
      "Barbier / Friseur",
      "Herbergsleiter",
      "Dienstbote",
      "Butler",
      "Haushofmeister",
      "Wascherin"
    ]
  },
  {
    fieldId: "adel_herrschaft",
    category: "Adel & Herrschaft",
    jobs: [
      "Fürst / König",
      "Königin",
      "Herzog / Herzogin",
      "Graf / Gräfin",
      "Baron / Baronin",
      "Freiherr / Freiin",
      "Lord / Lady",
      "Hofdame",
      "Kronprinz / Kronprinzessin",
      "Erbprinz / Erbprinzessin",
      "Prinz / Prinzessin",
      "Herzogstochter",
      "Herzogsohn",
      "Erbherzogstochter",
      "Erbherzog",
      "Grafentochter",
      "Grafensohn",
      "Komtesse",
      "Erbgräfin",
      "Erbgraf",
      "Baronstochter",
      "Baronssohn",
      "Fürstentochter",
      "Fürstensohn",
      "Königstochter",
      "Königssohn",
      "Erbtochter",
      "Erbsohn",
      "Edelfräulein",
      "Junker",
      "Lordstochter",
      "Lordsohn",
      "Adelsnachkomme"
    ]
  },
  {
    fieldId: "abenteuer_sondergewerbe",
    category: "Abenteuer & Sondergewerbe",
    jobs: [
      "Abenteurer",
      "Schatzsucher",
      "Kopfgeldjäger",
      "Monsterjäger",
      "Ruinenerkunder",
      "Dungeon-Scout",
      "Söldner-Garde",
      "Reliktsucher",
      "Dieb",
      "Taschendieb",
      "Schmuggler",
      "Auftragsmörder / Assassine",
      "Hehler",
      "Fälscher",
      "Räuber / Bandit",
      "Schutzgeldeintreiber",
      "Einbrecher"
    ]
  }
];

export const ALL_PRESET_JOBS: string[] = JOB_CATEGORIES.flatMap(c => c.jobs);

export interface NobleChildGroup {
  house: string;
  titles: string[];
}

export const NOBLE_CHILDREN_GROUPS: NobleChildGroup[] = [
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

/**
 * Finds the matching Berufsfeld fieldId for a given job title.
 */
export function getFieldIdForJob(jobName: string): string | undefined {
  if (!jobName || !jobName.trim()) return undefined;
  const lower = jobName.toLowerCase().trim();

  // 1. Check Noble titles
  for (const group of NOBLE_CHILDREN_GROUPS) {
    if (group.titles.some(t => t.toLowerCase() === lower)) {
      return 'adel_herrschaft';
    }
  }

  // 2. Direct match or alias match
  for (const cat of JOB_CATEGORIES) {
    for (const j of cat.jobs) {
      const jLower = j.toLowerCase();
      if (jLower === lower || jLower.split(' / ').some(part => part.trim() === lower)) {
        return cat.fieldId;
      }
    }
  }

  // 3. Substring match for meaningful length strings (>= 4 characters)
  if (lower.length >= 4) {
    for (const cat of JOB_CATEGORIES) {
      for (const j of cat.jobs) {
        const jLower = j.toLowerCase();
        // Check if the job name contains this title or vice versa
        if (lower.includes(jLower) || jLower.split(' / ').some(part => part.trim().length >= 4 && lower.includes(part.trim()))) {
          return cat.fieldId;
        }
      }
    }
  }

  return undefined;
}

/**
 * Returns the category definition for a given fieldId or name.
 */
export function getJobCategoryByFieldId(fieldId: string): JobCategory | undefined {
  return JOB_CATEGORIES.find(c => c.fieldId === fieldId || c.category.toLowerCase() === fieldId.toLowerCase());
}
