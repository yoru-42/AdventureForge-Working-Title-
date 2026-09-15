import { ProfessionPosition, ProfessionPrerequisite } from '../types';

export type { ProfessionPosition };

/**
 * Handcrafted catalog of Profession Positions (Beförderungs-, Leitungs- und Stellvertreterebene)
 * following V7 specification:
 * - Positionen sind getrennt von Berufen und Kompetenzen.
 * - Typen: 'deputy' (Stellvertretung), 'supervisor' (Aufsicht), 'leadership' (Leitung), 'executive' (Höhere Leitung).
 */
export const PROFESSION_POSITIONS: ProfessionPosition[] = [
  // ===========================================================================
  // LEBENSMITTEL & VERSORGUNG / GASTRONOMIE
  // ===========================================================================
  {
    id: 'pos_souschef',
    name: 'Souschef (Stellvertretende Küchenleitung)',
    type: 'deputy',
    professionIds: ['Koch', 'Gourmet- & Saucenkoch', 'Tavernenkoch', 'Hofkoch'],
    prerequisites: [
      { type: 'profession', targetName: 'Koch', required: true, description: 'Abgeschlossene Kochausbildung und Gesellenpraxis' },
      { type: 'competency', targetName: 'Küchenorganisation', minimumValue: 50, required: true },
      { type: 'experience', minimumValue: 3, description: 'Mindestens 3 Jahre Küchenerfahrung' }
    ],
    grantsAuthority: true,
    authorityScope: ['Küchenposten-Aufsicht', 'Vertretung des Küchenchefs', 'Bestellwesen'],
    description: 'Verantwortlich für den reibungslosen Ablauf in der Küche bei Abwesenheit des Küchenchefs und die Koordination der Postenköche.'
  },
  {
    id: 'pos_kuechenchef',
    name: 'Küchenchef / Chef de Cuisine',
    type: 'leadership',
    professionIds: ['Koch', 'Gourmet- & Saucenkoch', 'Hofkoch', 'Hofküchenmeister'],
    prerequisites: [
      { type: 'profession', targetName: 'Koch', required: true },
      { type: 'competency', targetName: 'Küchenleitung', minimumValue: 70, required: true },
      { type: 'experience', minimumValue: 5, description: 'Mindestens 5 Jahre Erfahrung' }
    ],
    grantsAuthority: true,
    authorityScope: ['Gesamte Küchenführung', 'Speisekarten-Konzeption', 'Personalentscheidungen'],
    description: 'Gesamtverantwortung für Menüs, Personal, Einkauf und kulinarische Qualität des Betriebs.'
  },
  {
    id: 'pos_hofkuechenmeister_pos',
    name: 'Hofküchendirektor',
    type: 'executive',
    professionIds: ['Hofküchenmeister', 'Hofkoch', 'Koch'],
    prerequisites: [
      { type: 'profession', targetName: 'Hofküchenmeister', required: true },
      { type: 'experience', minimumValue: 8, description: 'Mindestens 8 Jahre Erfahrung an fürstlichen Höfen' }
    ],
    grantsAuthority: true,
    authorityScope: ['Palastverpflegung', 'Zeremonienbankette', 'Hofhaushalt Küche'],
    description: 'Oberste administrative und kulinarische Leitung aller Palast- und Festküchen eines Landesherrn.'
  },

  // ===========================================================================
  // METALL & HANDWERK
  // ===========================================================================
  {
    id: 'pos_vorarbeiter_schmiede',
    name: 'Vorarbeiter / Schmiedeaufseher',
    type: 'supervisor',
    professionIds: ['Schmied', 'Waffenschmied', 'Rüstungsschmied', 'Grobschmied'],
    prerequisites: [
      { type: 'profession', targetName: 'Schmied', required: true },
      { type: 'competency', targetName: 'Werkstoffkunde Metall', minimumValue: 50, required: true },
      { type: 'experience', minimumValue: 2 }
    ],
    grantsAuthority: true,
    authorityScope: ['Aufsicht über Gesellen und Lehrlinge', 'Materialausgabe', 'Qualitätsprüfung'],
    description: 'Fachliche Aufsicht und Anleitung der Arbeiter an den Essen und Hämmern.'
  },
  {
    id: 'pos_stellv_werkstattleiter',
    name: 'Stellvertretender Werkstattleiter',
    type: 'deputy',
    professionIds: ['Schmied', 'Waffenschmied', 'Zimmermann', 'Schreiner', 'Schlosser'],
    prerequisites: [
      { type: 'profession', targetName: 'Schmied', required: false },
      { type: 'experience', minimumValue: 4 }
    ],
    grantsAuthority: true,
    authorityScope: ['Auftragsabwicklung', 'Werkstattvertretung'],
    description: 'Stellvertretende Führung der Werkstatt und Betreuung größerer Bau- und Fertigungsaufträge.'
  },
  {
    id: 'pos_werkstattleiter',
    name: 'Werkstattleiter / Zeugmeister',
    type: 'leadership',
    professionIds: ['Schmied', 'Meisterschmied', 'Zimmermann', 'Schreiner', 'Waffenschmied'],
    prerequisites: [
      { type: 'experience', minimumValue: 6, description: '6 Jahre Berufspraxis' },
      { type: 'competency', targetName: 'Betriebsführung', minimumValue: 60, required: true }
    ],
    grantsAuthority: true,
    authorityScope: ['Auftragsannahme', 'Kalkulation', 'Gildenvertretung'],
    description: 'Leiter einer Manufaktur, Zeugschmiede oder Handwerkswerkstatt.'
  },
  {
    id: 'pos_gildenmeister',
    name: 'Obermeister / Zunftmeister',
    type: 'executive',
    professionIds: ['Meisterschmied', 'Zimmermeister', 'Bäckermeister', 'Braumeister'],
    prerequisites: [
      { type: 'experience', minimumValue: 10, description: '10 Jahre Meisterpraxis' },
      { type: 'story', description: 'Wahl durch das Gildenkapitel' }
    ],
    grantsAuthority: true,
    authorityScope: ['Zunftgerichtsbarkeit', 'Meisterprüfungen', 'Preisfestsetzung der Zunft'],
    description: 'Gewählter Vorsitzender der Handwerkszunft mit politischer Mitsprache im Stadtrat.'
  },

  // ===========================================================================
  // MEDIZIN & HEILKUNDE
  // ===========================================================================
  {
    id: 'pos_stationsleiter_hospital',
    name: 'Stationsleiter / Lazarettaufseher',
    type: 'supervisor',
    professionIds: ['Arzt', 'Heiler', 'Chirurg', 'Krankenpfleger'],
    prerequisites: [
      { type: 'profession', targetName: 'Arzt', required: false },
      { type: 'experience', minimumValue: 2 }
    ],
    grantsAuthority: true,
    authorityScope: ['Bettenbelegung', 'Pflegeaufsicht', 'Arzneiausgabe'],
    description: 'Koordiniert den täglichen Pflege- und Behandlungsablauf in einer Hospitalstation.'
  },
  {
    id: 'pos_oberarzt',
    name: 'Oberarzt / Stellvertretender Chefarzt',
    type: 'deputy',
    professionIds: ['Arzt', 'Chirurg', 'Fachchirurg', 'Militärarzt'],
    prerequisites: [
      { type: 'profession', targetName: 'Arzt', required: true },
      { type: 'competency', targetName: 'Diagnostik', minimumValue: 70, required: true },
      { type: 'experience', minimumValue: 4 }
    ],
    grantsAuthority: true,
    authorityScope: ['Visitenleitung', 'Freigabe schwerer Operationen', 'Ausbildung von Assistenzärzten'],
    description: 'Erfahrener Facharzt mit Weisungsbefugnis gegenüber praktischen Ärzten und Assistenten.'
  },
  {
    id: 'pos_klinikleiter',
    name: 'Klinikleiter / Hospitaldirektor / Stadtphysikus',
    type: 'leadership',
    professionIds: ['Arzt', 'Leitender Chirurg', 'Meisterarzt & Chefarzt'],
    prerequisites: [
      { type: 'profession', targetName: 'Arzt', required: true },
      { type: 'experience', minimumValue: 6 }
    ],
    grantsAuthority: true,
    authorityScope: ['Klinikverwaltung', 'Seuchenkontrolle der Stadt', 'Ärztliches Kollegium'],
    description: 'Oberste medizinische Leitungsfunktion für ein Hospital oder die gesamte städtische Gesundheitsfürsorge.'
  },

  // ===========================================================================
  // TRANSPORT & SEEFAHRT
  // ===========================================================================
  {
    id: 'pos_bootsmann',
    name: 'Bootsmann / Decksaufseher',
    type: 'supervisor',
    professionIds: ['Matrose', 'Vollmatrose', 'Steuermann', 'Seemann'],
    prerequisites: [
      { type: 'profession', targetName: 'Matrose', required: true },
      { type: 'competency', targetName: 'Seemannschaft & Segelbedienung', minimumValue: 50, required: true },
      { type: 'experience', minimumValue: 2 }
    ],
    grantsAuthority: true,
    authorityScope: ['Deckswachen', 'Tauwerk- & Takelageaufsicht', 'Arbeitseinteilung der Mannschaft'],
    description: 'Oberster Unteroffizier an Deck, der die Befehle der Schiffsführung an die Mannschaft durchsetzt.'
  },
  {
    id: 'pos_erster_offizier',
    name: 'Erster Offizier / Stellvertretender Kapitän',
    type: 'deputy',
    professionIds: ['Steuermann', 'Navigator', 'Matrose', 'Kapitän'],
    prerequisites: [
      { type: 'competency', targetName: 'Navigation', minimumValue: 60, required: true },
      { type: 'experience', minimumValue: 4 }
    ],
    grantsAuthority: true,
    authorityScope: ['Wachführung', 'Disziplin an Bord', 'Kommandoübernahme im Ernstfall'],
    description: 'Rechte Hand des Kapitäns, führt das Schiffstagebuch und übernimmt die Schiffsführung bei Ausfall des Kapitäns.'
  },
  {
    id: 'pos_kapitaen_pos',
    name: 'Kapitän / Schiffsführer',
    type: 'leadership',
    professionIds: ['Kapitän', 'Schiffskommandant', 'Navigator', 'Steuermann'],
    prerequisites: [
      { type: 'competency', targetName: 'Schiffsführung & Kommando', minimumValue: 75, required: true },
      { type: 'experience', minimumValue: 5 }
    ],
    grantsAuthority: true,
    authorityScope: ['Vollständige Bordgewalt', 'Kurs- und Zielentscheidungen', 'Reederverhandlungen'],
    description: 'Uneingeschränkter militärischer oder ziviler Befehlshaber eines Seefahrzeugs.'
  },
  {
    id: 'pos_hafenmeister',
    name: 'Hafenmeister / Hafenpräfekt',
    type: 'leadership',
    professionIds: ['Kapitän', 'Hafenmeister', 'Steuermann', 'Zollbeamter'],
    prerequisites: [
      { type: 'experience', minimumValue: 6 }
    ],
    grantsAuthority: true,
    authorityScope: ['Liegeplatzvergabe', 'Zoll- & Quarantäneüberwachung', 'Hafenbecken-Sicherheit'],
    description: 'Aufsicht über Hafenbecken, Schiffsankünfte, Lotsen und Kaisicherheit.'
  },
  {
    id: 'pos_werftdirektor',
    name: 'Werftdirektor / Flottenadmiral',
    type: 'executive',
    professionIds: ['Schiffszimmermann', 'Kapitän', 'Schiffskommandant'],
    prerequisites: [
      { type: 'experience', minimumValue: 8 }
    ],
    grantsAuthority: true,
    authorityScope: ['Flottenbau', 'Galeeren- und Segelschiffbauverträge', 'Marineetat'],
    description: 'Oberste zivile oder militärische Leitung des Schiffbaus und Flottenkommandos.'
  },

  // ===========================================================================
  // MILITÄR & SICHERHEIT
  // ===========================================================================
  {
    id: 'pos_wachfuehrer',
    name: 'Wachführer / Rottenführer',
    type: 'supervisor',
    professionIds: ['Soldat', 'Stadtwächter', 'Wachsoldat', 'Garde'],
    prerequisites: [
      { type: 'profession', targetName: 'Soldat', required: true },
      { type: 'experience', minimumValue: 1 }
    ],
    grantsAuthority: true,
    authorityScope: ['Torwache', 'Patrouilleneinteilung', 'Verhaftungsanweisungen'],
    description: 'Befehligt eine Wachrotte von 4 bis 10 Wachsoldaten an Stadttoren und Patrouillenstrecken.'
  },
  {
    id: 'pos_feldwebel',
    name: 'Feldwebel / Unteroffizier',
    type: 'deputy',
    professionIds: ['Soldat', 'Garde', 'Feldwebel'],
    prerequisites: [
      { type: 'profession', targetName: 'Soldat', required: true },
      { type: 'experience', minimumValue: 3 }
    ],
    grantsAuthority: true,
    authorityScope: ['Truppendrill', 'Gefechtsformationen', 'Materialverwaltung der Kompanie'],
    description: 'Erfahrener Krieger, der Rekruten drillt und die Ordnung in der Kompanie garantiert.'
  },
  {
    id: 'pos_hauptmann',
    name: 'Hauptmann / Kompanieführer',
    type: 'leadership',
    professionIds: ['Soldat', 'Offizier', 'Hauptmann', 'Ritter'],
    prerequisites: [
      { type: 'competency', targetName: 'Taktik & Truppenführung', minimumValue: 70, required: true },
      { type: 'experience', minimumValue: 5 }
    ],
    grantsAuthority: true,
    authorityScope: ['Befehlsgewalt über eine Kompanie (100–200 Mann)', 'Festungsverteidigung'],
    description: 'Offizier mit operativer Gefechtsführung und Verantwortung für Truppenstandorte.'
  },
  {
    id: 'pos_kommandant',
    name: 'Festungskommandant / General',
    type: 'executive',
    professionIds: ['Offizier', 'Hauptmann', 'General', 'Kommandant'],
    prerequisites: [
      { type: 'experience', minimumValue: 8 }
    ],
    grantsAuthority: true,
    authorityScope: ['Gesamte Armee- oder Garnisonsführung', 'Kriegsrat', 'Kriegsgericht'],
    description: 'Oberbefehlshaber einer Festung oder Heeresformation mit strategischer Gesamtfürsorge.'
  }
];

/**
 * Helper to get available positions for a profession or field.
 */
export function getPositionsForProfession(professionName: string): ProfessionPosition[] {
  if (!professionName) return PROFESSION_POSITIONS;
  const lower = professionName.toLowerCase().trim();
  return PROFESSION_POSITIONS.filter(pos =>
    pos.professionIds?.some(p => p.toLowerCase().includes(lower) || lower.includes(p.toLowerCase()))
  );
}

/**
 * Finds a position by ID or name.
 */
export function findPositionByIdOrName(term: string): ProfessionPosition | undefined {
  if (!term) return undefined;
  const lower = term.toLowerCase().trim();
  return PROFESSION_POSITIONS.find(
    pos => pos.id.toLowerCase() === lower || pos.name.toLowerCase() === lower || pos.name.toLowerCase().includes(lower)
  );
}
