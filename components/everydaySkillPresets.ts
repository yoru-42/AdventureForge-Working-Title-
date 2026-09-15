export interface EverydaySkillCategory {
  category: string;
  skills: string[];
}

export const EVERYDAY_SKILL_CATEGORIES: EverydaySkillCategory[] = [
  {
    category: "Überleben, Natur & Orientierung",
    skills: [
      "Lagerfeuer machen",
      "Feuerholz sammeln",
      "Brennmaterial beurteilen",
      "Orientierung im Gelände",
      "Kartenlesen",
      "Navigation nach Sternen",
      "Wegstrecken einschätzen",
      "Spurenlesen",
      "Pflanzen erkennen",
      "Tiere erkennen",
      "Tierspuren erkennen",
      "Wetterkunde",
      "Unterschlupf bauen",
      "Zelt aufbauen",
      "Fallen stellen",
      "Angeln & Fischen",
      "Kräutersammeln",
      "Wasser finden & sammeln",
      "Wasser aufbereiten",
      "Schwimmen",
      "Flussüberquerung"
    ]
  },
  {
    category: "Haushalt & Alltagsversorgung",
    skills: [
      "Kochen & Backen",
      "Proviant haltbar machen",
      "Lebensmittel auf Verderb prüfen",
      "Vorratsverwaltung",
      "Wasser holen",
      "Feuerstelle & Ofen bedienen",
      "Abwaschen",
      "Reinigung & Wäsche",
      "Körperpflege & Hygiene",
      "Bett & Lager herrichten",
      "Haushalt organisieren",
      "Beleuchtung & Lampen",
      "Einfache Haushaltsreparaturen",
      "Möbelpflege",
      "Tischkultur & Bewirtung"
    ]
  },
  {
    category: "Landwirtschaft & Lebensmittel",
    skills: [
      "Ackerbau",
      "Gemüseanbau",
      "Obstbau",
      "Getreideverarbeitung",
      "Tierfütterung",
      "Melken",
      "Tierpflege",
      "Viehhaltung",
      "Schlachten & Zerlegen",
      "Fischverarbeitung",
      "Lebensmittelverarbeitung"
    ]
  },
  {
    category: "Tiere, Reiten & Transport",
    skills: [
      "Reiten",
      "Pferdepflege & Satteln",
      "Kutsche & Wagen fahren",
      "Lasttiere führen",
      "Tierzucht",
      "Tiere beruhigen & führen",
      "Gepäck & Lasten verstauen"
    ]
  },
  {
    category: "Handwerk & Kleidung",
    skills: [
      "Einfache Holzarbeiten",
      "Lederarbeiten",
      "Lederflicken",
      "Nähen",
      "Spinnen",
      "Weben",
      "Kleidung flicken",
      "Schuhe reparieren",
      "Kleidung pflegen",
      "Färben",
      "Seilknüpfen & Knotenkunde",
      "Werkzeugpflege",
      "Werkzeuginstandhaltung",
      "Messer & Werkzeuge schärfen"
    ]
  },
  {
    category: "Körperliche Alltagsfertigkeiten",
    skills: [
      "Tragen & Lasten bewegen",
      "Klettern",
      "Balance",
      "Körperkoordination",
      "Hand-Auge-Koordination",
      "Ausdauer",
      "Geschicklichkeit",
      "Kraft im Alltag"
    ]
  },
  {
    category: "Soziales, Kommunikation & Kultur",
    skills: [
      "Gesprächsführung",
      "Höflichkeit & Etikette",
      "Gastgeber sein",
      "Lokale Bräuche kennen",
      "Feiern organisieren",
      "Geschichten erzählen",
      "Vorlesen",
      "Briefeschreiben",
      "Nachrichten übermitteln",
      "Gerüchte erkennen",
      "Feilschen & Verhandeln",
      "Geselliges Musizieren & Singen",
      "Tanzen",
      "Schauspielkunst",
      "Kartenspielen & Würfeln",
      "Trinkfestigkeit"
    ]
  },
  {
    category: "Schrift, Handel & Wissen",
    skills: [
      "Lesen & Schreiben",
      "Grundrechnen & Zählen",
      "Buchführung",
      "Warenkunde",
      "Preise einschätzen",
      "Handelswaren erkennen",
      "Maße & Gewichte",
      "Fremdsprachen-Grundkenntnisse",
      "Einfache Verwaltung"
    ]
  },
  {
    category: "Gesundheit & Versorgung",
    skills: [
      "Erste Hilfe & Wundverband",
      "Hausmittel & Kräutertees",
      "Pflege von Kranken",
      "Pflege von Verletzten",
      "Krankheiten & Verletzungen erkennen",
      "Hygiene im Umgang mit Lebensmitteln"
    ]
  }
];

export const ALL_EVERYDAY_SKILLS: string[] =
  EVERYDAY_SKILL_CATEGORIES.flatMap(c => c.skills);
