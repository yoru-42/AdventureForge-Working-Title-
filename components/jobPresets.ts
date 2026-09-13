export interface JobCategory {
  fieldId: string;
  category: string;
  jobs: string[];
}

// ============================================================================
// ADVENTUREFORGE BERUFSKATALOG & BERUFSZWEIGE (BEREINIGT & ENTKOPPELT)
// WICHTIGE SYSTEMREGELN:
// 1. Adelstitel (Kaiser, König, Herzog, Graf, Baron, Prinz etc.) sind Standes-
//    und Herrschaftstitel, KEINE Berufe. Sie befinden sich ausschließlich im
//    Tag "Adelige Titel".
// 2. Jeder Beruf besitzt genau EINEN eindeutigen, sachlich passenden Berufszweig.
// 3. Dubletten wurden konsequent entfernt.
// ============================================================================

export const JOB_CATEGORIES: JobCategory[] = [
  {
    fieldId: "staatsdienst_diplomatie",
    category: "Staatswesen, Diplomatie & Hofdienst",
    jobs: [
      "Diplomat / Gesandter",
      "Berater / Konsulent",
      "Unterhändler / Friedensstifter",
      "Kanzler / Siegelbewahrer",
      "Verwalter / Güterverwalter",
      "Kurfürstlicher Beamter",
      "Vogt / Landrichter",
      "Herold / Wappenkundiger",
      "Zeremonienmeister",
      "Hofmarschall / Truchsess",
      "Leibwächter / Personenschützer",
      "Körperdouble"
    ]
  },
  {
    fieldId: "verwaltung_wirtschaft",
    category: "Verwaltung, Recht & Wirtschaft",
    jobs: [
      "Buchhalter",
      "Steuereintreiber / Rentmeister",
      "Händler / Kaufmann",
      "Notar / Justitiar",
      "Schreiber / Kopist",
      "Zöllner / Grenzkontrolleur",
      "Gutsverwalter / Ökonom",
      "Verhandlungsführer",
      "Kurier / Depeschenträger"
    ]
  },
  {
    fieldId: "militaer_streitkraefte",
    category: "Militär & reguläre Streitkräfte",
    jobs: [
      "Soldat / Infanterist",
      "Offizier",
      "Kommandant",
      "General",
      "Admiral",
      "Taktiker / Stratege",
      "Quartiermeister",
      "Grenzpatrouille / Grenzwächter",
      "Belagerungsingenieur",
      "Kanonier / Artillerist",
      "Scharfschütze / Armbrustschütze",
      "Scout / Aufklärer",
      "Duellant / Fechter",
      "Kavallerist / Reiter",
      "Drachenritter / Luftkavallerie"
    ]
  },
  {
    fieldId: "unabhaengige_abenteurer",
    category: "Unabhängige Kämpfer & Abenteurer",
    jobs: [
      "Freier Abenteurer",
      "Söldner",
      "Gladiator / Arenakämpfer",
      "Berserker",
      "Monsterjäger / Drachenjäger",
      "Kopfgeldjäger",
      "Schatzsucher",
      "Dungeon-Pionier"
    ]
  },
  {
    fieldId: "geheimoperationen_ueberleben",
    category: "Geheimdienst & Verdeckte Operationen",
    jobs: [
      "Spion / Agent",
      "Infiltrator / Schattenläufer",
      "Ninja / Shinobi",
      "Auftragskiller / Assasine",
      "Chiffrierer / Geheimkurier",
      "Scharfrichter / Henker",
      "Informant / Horcher",
      "Überlebenskünstler"
    ]
  },
  {
    fieldId: "religion_klerus",
    category: "Religion, Klerus & Seelsorge",
    jobs: [
      "Kleriker / Priester",
      "Hochpriester / Kardinal",
      "Bischof / Propst",
      "Abt / Äbtissin",
      "Kriegspriester",
      "Paladin / Ordensritter",
      "Inquisitor",
      "Exorzist",
      "Pilger",
      "Orakel",
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
    category: "Arkan & Magische Künste",
    jobs: [
      "Magier / Zauberer",
      "Arkanist",
      "Elementarmagier",
      "Sigilmancer",
      "Talismanzer",
      "Runenmeister",
      "Magischer Kunstfertiger",
      "Medium / Seher",
      "Traumwandler",
      "Nekromant",
      "Runenritter",
      "Curseblade / Fluchklinge",
      "Geisterrufer"
    ]
  },
  {
    fieldId: "wissenschaft_forschung",
    category: "Wissenschaft & Forschung",
    jobs: [
      "Gelehrter / Philosoph",
      "Arzt / Mediziner",
      "Alchemist",
      "Apotheker / Pharmazeut",
      "Naturforscher / Biologe",
      "Astronom / Sternkundiger",
      "Archäologe / Historiker",
      "Kryptograph / Sprachforscher",
      "Kartograph / Geograph",
      "Bibliothekar / Archivar",
      "Giftmischer / Toxikologe"
    ]
  },
  {
    fieldId: "bildung_erziehung",
    category: "Bildung, Lehre & Ausbildung",
    jobs: [
      "Lehrer / Schulmeister",
      "Gildenlehrer / Ausbilder",
      "Fechtmeister / Kampfinstruktor",
      "Akademiedozent / Professor",
      "Hofmeister / Prinzenerzieher",
      "Reitmeister"
    ]
  },
  {
    fieldId: "bau_handwerk",
    category: "Bauhandwerk & Architektur",
    jobs: [
      "Architekt / Festungsbauer",
      "Steinmetz / Steinbildhauer",
      "Maurer",
      "Zimmermann",
      "Dachdecker",
      "Brunnenbauer",
      "Brückenbauer",
      "Tischler / Schreinermeister"
    ]
  },
  {
    fieldId: "metall_waffen",
    category: "Metallurgie, Schmiedekunst & Waffen",
    jobs: [
      "Grobschmied",
      "Waffenschmied",
      "Schwertschmied",
      "Rüstungsschmied / Plattner",
      "Runenschmied",
      "Feinmechaniker / Uhrmacher",
      "Schlosser",
      "Gießer / Bronzegießer",
      "Kesselschmied"
    ]
  },
  {
    fieldId: "materialverarbeitung",
    category: "Materialverarbeitung & Textilhandwerk",
    jobs: [
      "Gerber",
      "Kürschner",
      "Seiler / Reepschläger",
      "Glasmacher / Glasbläser",
      "Schneider / Gewandschneider",
      "Weber / Tuchmacher",
      "Töpfer / Keramiker",
      "Wagner / Stellmacher",
      "Böttcher / Fassbinder",
      "Holzschnitzer"
    ]
  },
  {
    fieldId: "bergbau_rohstoffe",
    category: "Bergbau, Erze & Rohstoffgewinnung",
    jobs: [
      "Bergmann / Hauer",
      "Steinhauer / Steinbrecher",
      "Prospektor / Erzsucher",
      "Hüttenarbeiter / Schmelzer",
      "Köhler",
      "Salzsieder",
      "Stollenbauer / Minenzimmerer"
    ]
  },
  {
    fieldId: "lebensmittel_ernaehrung",
    category: "Lebensmittel, Brauwesen & Gastronomie",
    jobs: [
      "Koch / Küchenchef",
      "Bäcker / Konditor",
      "Brauer / Mälzer",
      "Metzger / Fleischer",
      "Müller",
      "Käser",
      "Winzer / Kellermeister",
      "Fischräucherer / Konservierer",
      "Schankwirt / Gastronom"
    ]
  },
  {
    fieldId: "landwirtschaft_versorgung",
    category: "Landwirtschaft & Naturressourcen",
    jobs: [
      "Bauer / Landwirt",
      "Viehzüchter / Rinderhirte",
      "Schäfer / Schafhirte",
      "Milchbauer / Molkereifachmann",
      "Imker / Zeidler",
      "Obstbauer / Pomologe",
      "Kräuterbauer",
      "Holzfäller / Forstwirt"
    ]
  },
  {
    fieldId: "seefahrt",
    category: "Seefahrt & Schifffahrt",
    jobs: [
      "Kapitän / Schiffsführer",
      "Steuermann / Navigator",
      "Seemann / Matrose",
      "Bootsmann",
      "Hochseefischer / Flussfischer",
      "Schiffszimmermann",
      "Lotse / Hafenmeister",
      "Segelmacher",
      "Taucher / Perlentaucher"
    ]
  },
  {
    fieldId: "wandernde_erkundung",
    category: "Wildnis, Erkundung & Jagdwesen",
    jobs: [
      "Jäger / Waidmann",
      "Fallensteller / Trapper",
      "Fährtenleser / Tracker",
      "Kundschafter / Wildnisscout",
      "Expeditionsleiter / Entdecker",
      "Wildnisführer / Bergführer",
      "Kräutersammler / Wildkräuterkundiger",
      "Nomade / Karawanenführer"
    ]
  },
  {
    fieldId: "tierfuehrung_tamer",
    category: "Tierführung, Zucht & Zähmung",
    jobs: [
      "Tiertrainer / Tierabrichter",
      "Falkner / Beizjäger",
      "Pferdezüchter / Gestütsmeister",
      "Hundeführer / Meuteleiter",
      "Mahout (Großtierführer)",
      "Beast Tamer / Bestienbändiger",
      "Drachenzähmer",
      "Tierheilkundiger / Veterinär"
    ]
  },
  {
    fieldId: "kriminelle_berufe",
    category: "Schattenwelt & Kriminelle Professionen",
    jobs: [
      "Dieb / Taschendieb",
      "Einbrecher / Fassadenkletterer",
      "Schmuggler",
      "Pirat / Kaperfahrer",
      "Hehler",
      "Fälscher (Dokumente & Münzen)",
      "Glücksspieler / Trickbetrüger",
      "Schurke / Bandenführer",
      "Bandit / Wegelagerer"
    ]
  },
  {
    fieldId: "haushalt_dienste",
    category: "Haushalt & Persönlicher Dienst",
    jobs: [
      "Butler / Majordomus",
      "Kammerdiener / Zofe",
      "Haushälter / Hauswirtschaftsleiter",
      "Kutscher / Fuhrunternehmer",
      "Vorkoster",
      "Hauswirtschafter",
      "Amme / Erzieher",
      "Hausbursche / Hausgehilfe"
    ]
  },
  {
    fieldId: "kunst_kultur",
    category: "Kunst, Musik & Literatur",
    jobs: [
      "Musiker / Instrumentalist",
      "Maler / Porträtist",
      "Schriftsteller / Dichter",
      "Bänkelsänger / Minnesänger",
      "Komponist / Kapellmeister",
      "Bildhauer / Meistermaler"
    ]
  },
  {
    fieldId: "unterhaltung_spezial",
    category: "Darstellendes Spiel & Unterhaltung",
    jobs: [
      "Schauspieler / Mime",
      "Tänzer / Balletttänzer",
      "Puppenspieler / Marionettenspieler",
      "Akrobat / Gaukler",
      "Artist / Jongleur",
      "Sänger / Diva",
      "Schausteller / Illusionist"
    ]
  },
  {
    fieldId: "luxus_spezial",
    category: "Luxushandwerk & Kunstgewerbe",
    jobs: [
      "Goldschmied / Silberschmied",
      "Juwelier / Gemmologe",
      "Edelsteinschleifer",
      "Parfümeur",
      "Florist / Kunstgärtner",
      "Instrumentenbauer",
      "Buchbinder / Buchmaler",
      "Graveur"
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

  // Backwards compatibility for old field IDs
  if (lower.includes('diplomat') || lower.includes('berater') || lower.includes('kanzler') || lower.includes('herold')) {
    return 'staatsdienst_diplomatie';
  }
  if (lower.includes('lehrer') || lower.includes('ausbilder') || lower.includes('schüler') || lower.includes('student')) {
    return 'bildung_erziehung';
  }

  return undefined;
}

export function getJobCategoryByFieldId(fieldId: string): JobCategory | undefined {
  if (!fieldId) return undefined;
  // Handle backwards compatibility alias
  const normalizedId = fieldId === 'adel_herrschaft' ? 'staatsdienst_diplomatie' :
                       fieldId === 'private_gesellschaftsrollen' ? 'bildung_erziehung' : fieldId;
  return JOB_CATEGORIES.find(c => c.fieldId === normalizedId || c.category.toLowerCase() === normalizedId.toLowerCase());
}
