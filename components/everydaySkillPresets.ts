export interface EverydaySkillCategory {
  category: string;
  skills: string[];
}

export const EVERYDAY_SKILL_CATEGORIES: EverydaySkillCategory[] = [
  {
    category: "Überleben, Natur & Orientierung",
    skills: [
      "Lagerfeuer machen",
      "Orientierung im Gelände",
      "Spurenlesen",
      "Angeln & Fischen",
      "Fallen stellen",
      "Kräutersammeln",
      "Zelt- & Unterschlupfbau",
      "Wetterkunde"
    ]
  },
  {
    category: "Haushalt, Kochen & Proviant",
    skills: [
      "Kochen & Backen",
      "Proviant haltbarmachen",
      "Schneidern & Reparieren",
      "Reinigung & Wäsche",
      "Vorratsverwaltung",
      "Tischkultur & Bewirtung"
    ]
  },
  {
    category: "Tiere, Reiten & Transport",
    skills: [
      "Reiten",
      "Pferdepflege & Satteln",
      "Kutsche & Wagen fahren",
      "Tierzucht & Viehhaltung",
      "Lasttiere führen"
    ]
  },
  {
    category: "Handwerk & Werkzeugpflege",
    skills: [
      "Messer & Waffen schärfen",
      "Einfache Holzarbeiten",
      "Lederflicken",
      "Seilknüpfen & Knotenkunde",
      "Werkzeuginstandhaltung"
    ]
  },
  {
    category: "Soziale Fertigkeiten & Zeitvertreib",
    skills: [
      "Kartenspielen & Würfeln",
      "Geselliges Musizieren & Singen",
      "Tanzen",
      "Geschichten erzählen",
      "Trinkfestigkeit",
      "Höflichkeit & Etikette"
    ]
  },
  {
    category: "Gesundheit & Erstversorgung",
    skills: [
      "Erste Hilfe & Wundverband",
      "Hausmittel & Kräutertees",
      "Körperpflege & Hygiene",
      "Pflege von Kranken"
    ]
  },
  {
    category: "Handel, Schrift & Zahlen",
    skills: [
      "Feilschen & Feilschen auf Märkten",
      "Lesen & Schreiben",
      "Grundrechnen & Zählen",
      "Buchführung",
      "Warenkunde"
    ]
  }
];

export const ALL_EVERYDAY_SKILLS: string[] = EVERYDAY_SKILL_CATEGORIES.flatMap(c => c.skills);
