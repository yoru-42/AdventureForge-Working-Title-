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
      "Waffenschmied",
      "Schwertschmied",
      "Rüstungsschmied",
      "Schreiner / Tischler",
      "Schneider",
      "Schuster / Schuhmacher",
      "Töpfer",
      "Glasbläser / Glasmacher",
      "Maurer / Bauhandwerker",
      "Bogenbauer",
      "Gerber",
      "Kürschner",
      "Weberei-Handwerker",
      "Steinmetz",
      "Zimmermann",
      "Seiler",
      "Wagner",
      "Büchsenmacher",
      "Feinmechaniker",
      "Uhrmacher",
      "Goldschmied",
      "Juwelier",
      "Edelsteinschmied",
      "Instrumentenbauer",
      "Optiker",
      "Graveur",
      "Siegelstecher",
      "Architekt (Festungsbau)"
    ]
  },
  {
    fieldId: "lebensmittel_ernaehrung",
    category: "Lebensmittel & Ernährung",
    jobs: [
      "Bäcker",
      "Konditor / Feinbäcker",
      "Metzger / Fleischer",
      "Brauer / Braumeister",
      "Winzer",
      "Müller",
      "Koch / Küchenchef",
      "Käser",
      "Obstbauer",
      "Vorkoster"
    ]
  },
  {
    fieldId: "natur_landwirtschaft",
    category: "Natur & Landwirtschaft",
    jobs: [
      "Bauer / Landwirt",
      "Milchbauer",
      "Jäger",
      "Förster",
      "Waldläufer",
      "Fischer",
      "Kräutersammler",
      "Sammler / Futtersucher",
      "Holzfäller",
      "Kundschafter / Scout",
      "Trapper / Fallensteller",
      "Florist",
      "Nomade",
      "Wanderer"
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
      "Tiertrainer",
      "Falkner",
      "Vogelabrichter",
      "Mahout (Elefantenführer)",
      "Beast Tamer",
      "Bug Tamer",
      "Drachenzähmer",
      "Dämonen-Tamer",
      "Imker",
      "Stallmeister"
    ]
  },
  {
    fieldId: "wissenschaft_forschung",
    category: "Wissenschaft & Forschung",
    jobs: [
      "Gelehrter",
      "Forscher",
      "Kartograf",
      "Astronom / Astrologe",
      "Historiker",
      "Philosoph",
      "Mathematiker",
      "Archäologe",
      "Kryptograph",
      "Detektiv"
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
      "Buchhalter",
      "Vermieter",
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
      "Sekretär",
      "Verhandlungsführer",
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
      "Kurfürstlicher Beamter"
    ]
  },
  {
    fieldId: "militaer_sicherheit",
    category: "Militär & Sicherheit",
    jobs: [
      "Soldat",
      "Infanterist",
      "Spezialkämpfer",
      "Kanonier / Artillerist",
      "Taktiker",
      "Quartiermeister",
      "Belagerungsingenieur",
      "Berserker",
      "Rächer",
      "Duellant",
      "Offizier",
      "Kommandant",
      "Rekrut",
      "Söldner",
      "Gladiator",
      "Riesentöter",
      "Drachenjäger",
      "Reitersoldat / Kavallerist",
      "Bogenschütze / Scharfschütze",
      "Armbrustschütze",
      "Stadtwache",
      "Wache",
      "Leibwächter",
      "Körperdouble",
      "Grenzpatrouille",
      "Patrouillenführer",
      "Torkontrolleur",
      "Nachtwächter",
      "Turmwächter",
      "Gefängniswärter",
      "Türsteher",
      "Paladin",
      "Ritter"
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
      "Bootsmann",
      "Schiffskanonier"
    ]
  },
  {
    fieldId: "transport_logistik",
    category: "Transport & Logistik",
    jobs: [
      "Fuhrmann",
      "Kutschfahrer / Kutscher",
      "Bote / Eilbote",
      "Kurier",
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
      "Schriftsteller / Romancier",
      "Kunsthandwerker",
      "Buchillustrator",
      "Puppenspieler"
    ]
  },
  {
    fieldId: "unterhaltung",
    category: "Unterhaltung",
    jobs: [
      "Barde / Musiker",
      "Bänkelsänger",
      "Idol / Diva",
      "Tänzer",
      "Gaukler / Akrobat",
      "Schauspieler",
      "Hofnarr",
      "Zirkusartist",
      "Jongleur",
      "Kurtisane"
    ]
  },
  {
    fieldId: "religion_klerus",
    category: "Religion & Klerus",
    jobs: [
      "Priester",
      "Kleriker",
      "Kriegspriester",
      "Mönch / Nonne",
      "Inquisitor",
      "Tempeldiener",
      "Exorzist",
      "Orakel",
      "Hohepriester",
      "Kannushi",
      "Miko",
      "Kannagi",
      "Sohei (Kriegermönch)",
      "Yamabushi",
      "Onmyōji",
      "Ajari"
    ]
  },
  {
    fieldId: "magie_arkana",
    category: "Magie & Arkane Künste",
    jobs: [
      "Arkanist",
      "Magieforscher",
      "Elementarist",
      "Sigilmancer",
      "Talismanzer",
      "Runenmeister",
      "Runenschmied",
      "Magischer Kunstfertiger",
      "Verzauberer",
      "Nekromant",
      "Curseblade",
      "Specter-Benutzer",
      "Medium",
      "Traumwandler",
      "Beschwörer",
      "Illusionist",
      "Artefaktforscher",
      "Ritualmagier",
      "Magical Girl"
    ]
  },
  {
    fieldId: "alchemie",
    category: "Alchemie",
    jobs: [
      "Alchemist",
      "Trankbrauer",
      "Giftmischer / Giftbenutzer",
      "Essenzenforscher",
      "Parfümeur"
    ]
  },
  {
    fieldId: "bergbau_rohstoffe",
    category: "Bergbau & Rohstoffe",
    jobs: [
      "Bergmann / Bergarbeiter",
      "Schürfer",
      "Erzsucher / Prospektor",
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
      "Haushälterin",
      "Hausfrau / Hausmann",
      "Totengräber",
      "Wascherin"
    ]
  },
  {
    fieldId: "hof_staatsdienst",
    category: "Hof- & Staatsdienst",
    jobs: [
      "Hofmeister",
      "Kastellan / Burgvogt",
      "Zeremonienmeister",
      "Herold",
      "Hofdame / Kammerherr",
      "Palastverwalter",
      "Seneschall"
    ]
  },
  {
    fieldId: "abenteuer_sondergewerbe",
    category: "Abenteuer & Sondergewerbe",
    jobs: [
      "Abenteurer",
      "Schatzsucher",
      "Kopfgeldjäger",
      "Untotenjäger",
      "Monsterjäger",
      "Ruinenerkunder",
      "Dungeon-Scout",
      "Söldner-Garde",
      "Reliktsucher",
      "Dieb / Rogue",
      "Schurke",
      "Taschendieb",
      "Schmuggler",
      "Pirat",
      "Auftragsmörder / Assassine",
      "Ninja",
      "Spion",
      "Hehler",
      "Fälscher",
      "Glücksspieler",
      "Phantom-Dieb",
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
