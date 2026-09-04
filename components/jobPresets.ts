export interface JobCategory {
  category: string;
  jobs: string[];
}

export const JOB_CATEGORIES: JobCategory[] = [
  {
    category: "Handwerk & Produktion",
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
      "Seiler"
    ]
  },
  {
    category: "Landwirtschaft & Lebensmittel",
    jobs: [
      "Bauer / Landwirt",
      "Viehzüchter",
      "Bäcker",
      "Metzger / Fleischer",
      "Brauer / Braumeister",
      "Winzer",
      "Fischer",
      "Imker",
      "Müller",
      "Obstbauer",
      "Hirte",
      "Käser"
    ]
  },
  {
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
    category: "Transport & Logistik",
    jobs: [
      "Fuhrmann",
      "Kutschfahrer / Kutscher",
      "Schiffer / Kapitän",
      "Hafenarbeiter",
      "Bote / Eilbote",
      "Belademeister / Logistiker",
      "Fährmann",
      "Karrenlenker",
      "Matrose"
    ]
  },
  {
    category: "Medizin",
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
    category: "Magische Berufe",
    jobs: [
      "Alchemist",
      "Runenschmied",
      "Magieforscher",
      "Verzauberer",
      "Elementarmagier",
      "Beschwörer",
      "Nekromant",
      "Illusionist",
      "Artefaktforscher",
      "Ritualmagier"
    ]
  },
  {
    category: "Militär",
    jobs: [
      "Soldat",
      "Reitersoldat / Kavallerist",
      "Infanterist",
      "Bogenschütze",
      "Armbrustschütze",
      "Offizier",
      "Söldner",
      "Strategieberater",
      "Kommandant",
      "Rekrut",
      "Hauptmann"
    ]
  },
  {
    category: "Wachen & Sicherheit",
    jobs: [
      "Wache",
      "Stadtwache",
      "Türsteher",
      "Leibwächter",
      "Gefängniswärter",
      "Patrouillenführer",
      "Torkontrolleur",
      "Nachtwächter",
      "Turmwächter"
    ]
  },
  {
    category: "Verwaltung & Staat",
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
      "Vogt"
    ]
  },
  {
    category: "Adel & Herrschaft (Regenten & Amtsträger)",
    jobs: [
      "Fürst / König",
      "Königin",
      "Herzog / Herzogin",
      "Graf / Gräfin",
      "Baron / Baronin",
      "Freiherr / Freiin",
      "Lord / Lady",
      "Hofdame",
      "Ratsherr / Berater",
      "Seneschall",
      "Lehntherr",
      "Kronprinz / Kronprinzessin"
    ]
  },
  {
    category: "Adel & Herrschaft (Kinder & Nachkommen)",
    jobs: [
      "Herzogstochter",
      "Herzogsohn",
      "Grafentochter",
      "Grafensohn",
      "Baronstochter",
      "Baronssohn",
      "Fürstentochter",
      "Fürstensohn",
      "Königstochter",
      "Königssohn",
      "Prinzessin",
      "Prinz",
      "Erbprinzessin",
      "Erbprinz",
      "Erbtochter",
      "Erbsohn",
      "Edelfräulein",
      "Junker",
      "Komtesse",
      "Freiin",
      "Freiherr (Nachkomme)",
      "Lordstochter",
      "Lordsohn",
      "Adelsnachkomme"
    ]
  },
  {
    category: "Religion",
    jobs: [
      "Priester",
      "Kleriker",
      "Mönch / Nonne",
      "Inquisitor",
      "Tempeldiener",
      "Exorzist",
      "Orakel",
      "Hohepriester",
      "Paladin"
    ]
  },
  {
    category: "Forschung & Bildung",
    jobs: [
      "Gelehrter",
      "Kartograf",
      "Bibliothekar",
      "Professor / Lehrmeister",
      "Historiker",
      "Astronom",
      "Student / Schüler",
      "Philosoph",
      "Archivar"
    ]
  },
  {
    category: "Handwerkliche Spezialberufe",
    jobs: [
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
    category: "Natur & Wildnis",
    jobs: [
      "Jäger",
      "Förster",
      "Waldläufer",
      "Falkner",
      "Kräutersammler",
      "Kundschafter",
      "Trapper",
      "Holzfäller"
    ]
  },
  {
    category: "Dienstleistungen",
    jobs: [
      "Tavernenwirt / Wirt",
      "Kellner",
      "Maid / Hausmädchen",
      "Magd",
      "Koch / Chefkoch",
      "Barbier / Friseur",
      "Herbergsleiter",
      "Dienstbote",
      "Butler",
      "Haushofmeister",
      "Wascherin"
    ]
  },
  {
    category: "Unterhaltung",
    jobs: [
      "Barde / Musiker",
      "Tänzer",
      "Gaukler / Akrobat",
      "Schauspieler",
      "Hofnarr",
      "Zirkusartist",
      "Jongleur",
      "Dichter"
    ]
  },
  {
    category: "Kriminelle Berufe",
    jobs: [
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
  },
  {
    category: "Adel & Herrschaftstitel",
    jobs: [
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
      "Freiin",
      "Freiherr (Nachkomme)",
      "Prinzessin",
      "Prinz",
      "Königstochter",
      "Königssohn",
      "Fürstentochter",
      "Fürstensohn",
      "Erbprinzessin",
      "Erbprinz",
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
    category: "Abenteuerberufe",
    jobs: [
      "Abenteurer",
      "Schatzsucher",
      "Kopfgeldjäger",
      "Monsterjäger",
      "Ruinenerkunder",
      "Dungeon-Scout",
      "Söldner-Garde",
      "Reliktsucher"
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
