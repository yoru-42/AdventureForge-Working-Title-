/**
 * Comprehensive catalog of Operational Authorities & Directives in Economy and RPG Enterprises (V7)
 * (Befugnisse & Weisungsrechte im Betrieb)
 */

export interface AuthorityDefinition {
  name: string;
  category: 'leadership' | 'finance' | 'operations' | 'security';
  categoryLabel: string;
  description: string;
  typicalRoles: string[];
  minLevelTier: 'all' | 'geselle' | 'spezialist' | 'leitung';
}

export const EXPANDED_AUTHORITIES: AuthorityDefinition[] = [
  // ===========================================================================
  // LEITUNG & PERSONAL (Führung & Mitarbeiter)
  // ===========================================================================
  {
    name: 'Tagesgeschäft leiten',
    category: 'leadership',
    categoryLabel: 'Leitung & Personal',
    description: 'Operative Gesamtleitung und Koordination des laufenden Tagesgeschäfts im Betrieb oder Anwesen.',
    typicalRoles: ['Küchenchef', 'Werkstattleiter', 'Haushofmeister', 'Kapitän', 'Hauptmann', 'Betriebsleiter', 'Kontorleiter'],
    minLevelTier: 'leitung'
  },
  {
    name: 'Personal einstellen & entlassen',
    category: 'leadership',
    categoryLabel: 'Leitung & Personal',
    description: 'Befugnis zur eigenständigen Einstellung, Entlohnung und Entlassung von Gesellen, Lehrlingen und Hilfskräften.',
    typicalRoles: ['Meister', 'Haushofmeister', 'Gutsherr', 'Kapitän', 'Klinikleiter', 'Betriebsinhaber'],
    minLevelTier: 'leitung'
  },
  {
    name: 'Aufgaben & Pflichten delegieren',
    category: 'leadership',
    categoryLabel: 'Leitung & Personal',
    description: 'Zuweisung, Steuerung und Überprüfung von operativen Arbeitsaufgaben an Untergebene oder Kollegen.',
    typicalRoles: ['Souschef', 'Vorarbeiter', 'Kammerdiener', 'Feldwebel', 'Bootsmann', 'Oberarzt', 'Schichtleiter'],
    minLevelTier: 'spezialist'
  },
  {
    name: 'Dienst- & Schichtpläne anordnen',
    category: 'leadership',
    categoryLabel: 'Leitung & Personal',
    description: 'Verbindliche Festlegung der Arbeitszeiten, Wachen, Küchenschichten, Urlaube und Rufbereitschaften.',
    typicalRoles: ['Wachführer', 'Haushälterin', 'Bootsmann', 'Stationsleiter', 'Souschef', 'Oberkellner'],
    minLevelTier: 'spezialist'
  },
  {
    name: 'Ausbildung & Lehrlingsaufsicht',
    category: 'leadership',
    categoryLabel: 'Leitung & Personal',
    description: 'Fachliche Anleitung, Aufgabenvergabe und Prüfungsvorbereitung von Auszubildenden, Pagen und Lehrlingen.',
    typicalRoles: ['Lehrmeister', 'Geselle', 'Schmiedemeister', 'Gildenausbilder', 'Magister'],
    minLevelTier: 'geselle'
  },
  {
    name: 'Disziplinar- & Rügegewalt',
    category: 'leadership',
    categoryLabel: 'Leitung & Personal',
    description: 'Verhängung von Verweisen, Abmahnungen, Dienststrafen oder vorübergehendem Wacharrest bei Pflichtverletzungen.',
    typicalRoles: ['Hauptmann', 'Haushofmeister', 'Kapitän', 'Zunftmeister', 'Festungskommandant'],
    minLevelTier: 'leitung'
  },

  // ===========================================================================
  // FINANZEN & HANDEL (Finanzhoheit & Verträge)
  // ===========================================================================
  {
    name: 'Preise festlegen',
    category: 'finance',
    categoryLabel: 'Finanzen & Handel',
    description: 'Festlegung und Anpassung der Verkaufs-, Dienstleistungs- und Mietpreise sowie Aushandlung von Rabatten.',
    typicalRoles: ['Kaufmann', 'Händler', 'Tavernenwirt', 'Schmiedemeister', 'Zunftmeister'],
    minLevelTier: 'spezialist'
  },
  {
    name: 'Budget & Finanzen freigeben',
    category: 'finance',
    categoryLabel: 'Finanzen & Handel',
    description: 'Verwaltung der Betriebskasse, Rechnungsfreigabe, Investitionen und Bewilligung größerer Geldbeträge.',
    typicalRoles: ['Gutsherr', 'Rentmeister', 'Schatzmeister', 'Kontorleiter', 'Klinikdirektor'],
    minLevelTier: 'leitung'
  },
  {
    name: 'Aufträge vergeben & annehmen',
    category: 'finance',
    categoryLabel: 'Finanzen & Handel',
    description: 'Abschluss rechtsgültiger Werk-, Liefer- und Dienstverträge mit Kunden, Lieferanten oder Behörden.',
    typicalRoles: ['Meisterschmied', 'Baumeister', 'Kaufmann', 'Schneider', 'Schreiner'],
    minLevelTier: 'geselle'
  },
  {
    name: 'Verhandlungen führen',
    category: 'finance',
    categoryLabel: 'Finanzen & Handel',
    description: 'Eigenständige Verhandlungsführung bei Handelsabkommen, Pachtverträgen, Zöllen und Gildenverträgen.',
    typicalRoles: ['Großkaufmann', 'Diplomat', 'Gildenvertreter', 'Kapitän', 'Majordomus'],
    minLevelTier: 'spezialist'
  },
  {
    name: 'Gewinne entnehmen',
    category: 'finance',
    categoryLabel: 'Finanzen & Handel',
    description: 'Recht auf Auszahlung von Netto-Betriebserträgen und Gewinnausschüttungen an Eigentümer und Gesellschafter.',
    typicalRoles: ['Eigentümer', 'Gutsherr', 'Patron', 'Partner', 'Gildenmeister'],
    minLevelTier: 'leitung'
  },

  // ===========================================================================
  // BETRIEB, HANDWERK & QUALITÄT (Waren & Produktion)
  // ===========================================================================
  {
    name: 'Lagerbestände & Einkauf verwalten',
    category: 'operations',
    categoryLabel: 'Betrieb & Qualität',
    description: 'Bestandskontrolle, Rohstoffbeschaffung, Nachbestellungen und Inventurverwaltung im Lager.',
    typicalRoles: ['Lagerverwalter', 'Kammerdiener', 'Haushälterin', 'Proviantmeister', 'Quartiermeister'],
    minLevelTier: 'geselle'
  },
  {
    name: 'Qualitätskontrolle & Werkabnahme',
    category: 'operations',
    categoryLabel: 'Betrieb & Qualität',
    description: 'Prüfung, Stempelung und Freigabe von gefertigten Werkstücken, Arzneien, Speisen oder Bauelementen.',
    typicalRoles: ['Altgeselle', 'Güteprüfer', 'Souschef', 'Apotheker', 'Oberarzt', 'Schiffszimmermann'],
    minLevelTier: 'geselle'
  },
  {
    name: 'Ausbauten & Upgrades anordnen',
    category: 'operations',
    categoryLabel: 'Betrieb & Qualität',
    description: 'Beauftragung von Gebäudeerweiterungen, Werkstattmodernisierungen, Wehranbauten oder Schiffsreparaturen.',
    typicalRoles: ['Baumeister', 'Werftleiter', 'Gutsherr', 'Burgherr', 'Hafenmeister'],
    minLevelTier: 'leitung'
  },
  {
    name: 'Rezeptur- & Werkgeheimnisse hüten',
    category: 'operations',
    categoryLabel: 'Betrieb & Qualität',
    description: 'Zugang zu und Sicherung von verschlüsselten Zunftformeln, Veredelungslegierungen, Alchemierezepten und Archivplänen.',
    typicalRoles: ['Alchemist', 'Waffenschmied', 'Braumeister', 'Chefarzt', 'Erzmagier'],
    minLevelTier: 'spezialist'
  },
  {
    name: 'Betriebsbeschlüsse fassen',
    category: 'operations',
    categoryLabel: 'Betrieb & Qualität',
    description: 'Entscheidungen über strategische Ausrichtung, neue Produktionszweige oder Schließungen von Betriebsteilen.',
    typicalRoles: ['Eigentümer', 'Klinikdirektor', 'Zunftvorstand', 'Generaldirektor'],
    minLevelTier: 'leitung'
  },
  {
    name: 'Gilden- & Zunftvertretung',
    category: 'operations',
    categoryLabel: 'Betrieb & Qualität',
    description: 'Offizielle Vertretung des Betriebs bei Zunftversammlungen, vor dem Stadtrat oder dem Handelsgericht.',
    typicalRoles: ['Zunftmeister', 'Obermeister', 'Gildenrat', 'Kanzler'],
    minLevelTier: 'leitung'
  },

  // ===========================================================================
  // SICHERHEIT & LIEGENSCHAFT (Schutz & Hausrecht)
  // ===========================================================================
  {
    name: 'Hausrecht & Sicherheit durchsetzen',
    category: 'security',
    categoryLabel: 'Sicherheit & Liegenschaft',
    description: 'Ausübung des Hausrechts, Erteilung von Hausverboten und Anweisung des Sicherheitspersonals.',
    typicalRoles: ['Haushofmeister', 'Wirt', 'Stadtwächter', 'Burghauptmann', 'Toraufseher', 'Gutsherr'],
    minLevelTier: 'geselle'
  },
  {
    name: 'Schlüsselgewalt & Lagerzugang',
    category: 'security',
    categoryLabel: 'Sicherheit & Liegenschaft',
    description: 'Führung des Hauptschlüsselbundes für Schatzkammern, Waffenkammern, Geheimgänge und Vorratskeller.',
    typicalRoles: ['Majordomus', 'Kammerdiener', 'Burgvogt', 'Kassierer', 'Zeugwart'],
    minLevelTier: 'geselle'
  },
  {
    name: 'Notfall- & Evakuierungskommando',
    category: 'security',
    categoryLabel: 'Sicherheit & Liegenschaft',
    description: 'Befehlsgewalt bei Bränden, Seuchenausbrüchen, Schiffslecks oder feindlichen Angriffen.',
    typicalRoles: ['Kapitän', 'Hauptmann', 'Lazarettleiter', 'Hafenmeister', 'Feuerlöschmeister'],
    minLevelTier: 'spezialist'
  }
];

export const ALL_AUTHORITY_NAMES: string[] = EXPANDED_AUTHORITIES.map(a => a.name);

export const ALL_AUTHORITIES_MAP: Record<string, string> = EXPANDED_AUTHORITIES.reduce((acc, item) => {
  acc[item.name] = item.description;
  return acc;
}, {} as Record<string, string>);

/**
 * Returns plausible authorities according to profession name and hierarchical level
 */
export function getSuggestedAuthoritiesForProfession(
  profession: string,
  levelOrTier?: string | number
): string[] {
  if (!profession) return [];
  const profLower = profession.toLowerCase().trim();
  const res = new Set<string>();

  // Determine hierarchy level
  const isMasterOrDirector = Boolean(
    profLower.includes('meister') ||
    profLower.includes('chef') ||
    profLower.includes('leiter') ||
    profLower.includes('direktor') ||
    profLower.includes('majordomus') ||
    profLower.includes('haushofmeister') ||
    profLower.includes('kapitän') ||
    profLower.includes('hauptmann') ||
    profLower.includes('kommandant') ||
    profLower.includes('oberarzt') ||
    profLower.includes('vogt') ||
    profLower.includes('herr') ||
    profLower.includes('besitzer') ||
    (typeof levelOrTier === 'number' && levelOrTier >= 3) ||
    (typeof levelOrTier === 'string' && (levelOrTier.includes('meister') || levelOrTier.includes('leitung') || levelOrTier.includes('führ')))
  );

  const isSpecialistOrDeputy = Boolean(
    profLower.includes('souschef') ||
    profLower.includes('vorarbeiter') ||
    profLower.includes('kammerdiener') ||
    profLower.includes('tafeldiener') ||
    profLower.includes('steuermann') ||
    profLower.includes('bootsmann') ||
    profLower.includes('chirurg') ||
    profLower.includes('waffenschmied') ||
    profLower.includes('feldwebel') ||
    profLower.includes('wachführer') ||
    profLower.includes('haushälterin') ||
    profLower.includes('schichtleiter') ||
    (typeof levelOrTier === 'number' && levelOrTier === 2) ||
    (typeof levelOrTier === 'string' && (levelOrTier.includes('spezial') || levelOrTier.includes('fort')))
  );

  const isApprenticeOrEntry = Boolean(
    profLower.includes('lehrling') ||
    profLower.includes('page') ||
    profLower.includes('laufbursche') ||
    profLower.includes('schiffsjunge') ||
    profLower.includes('rekrut') ||
    profLower.includes('küchenjunge') ||
    profLower.includes('knecht') ||
    profLower.includes('magd') ||
    profLower.includes('gehilfe') ||
    profLower.includes('anfänger') ||
    (typeof levelOrTier === 'number' && levelOrTier === 0) ||
    (typeof levelOrTier === 'string' && (levelOrTier.includes('lehrling') || levelOrTier.includes('einstieg') || levelOrTier.includes('ausbildung')))
  );

  // 1. DIENER & HAUSHALT (Screenshot 2 Branch Diener)
  if (profLower.includes('diener') || profLower.includes('majordomus') || profLower.includes('haushofmeister') || profLower.includes('page') || profLower.includes('laufbursche') || profLower.includes('butler') || profLower.includes('kammer')) {
    if (profLower.includes('laufbursche') || profLower.includes('page') || isApprenticeOrEntry) {
      // Keine Weisungsbefugnisse für Laufburschen/Pagen
      return [];
    } else if (profLower.includes('haushofmeister') || profLower.includes('majordomus') || isMasterOrDirector) {
      res.add('Tagesgeschäft leiten');
      res.add('Personal einstellen & entlassen');
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Lagerbestände & Einkauf verwalten');
      res.add('Budget & Finanzen freigeben');
      res.add('Hausrecht & Sicherheit durchsetzen');
      res.add('Schlüsselgewalt & Lagerzugang');
      res.add('Disziplinar- & Rügegewalt');
      res.add('Betriebsbeschlüsse fassen');
    } else if (profLower.includes('kammerdiener') || profLower.includes('tafeldiener') || isSpecialistOrDeputy) {
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Lagerbestände & Einkauf verwalten');
      res.add('Schlüsselgewalt & Lagerzugang');
      res.add('Hausrecht & Sicherheit durchsetzen');
    } else {
      // Normaler Diener
      res.add('Schlüsselgewalt & Lagerzugang');
      res.add('Hausrecht & Sicherheit durchsetzen');
    }
  }

  // 2. KOCH & GASTRONOMIE
  else if (profLower.includes('koch') || profLower.includes('küche') || profLower.includes('bäcker') || profLower.includes('brauer') || profLower.includes('taverne') || profLower.includes('wirt')) {
    if (isApprenticeOrEntry) {
      return [];
    } else if (profLower.includes('küchenchef') || profLower.includes('hofküchenmeister') || profLower.includes('braumeister') || isMasterOrDirector) {
      res.add('Tagesgeschäft leiten');
      res.add('Preise festlegen');
      res.add('Personal einstellen & entlassen');
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Aufträge vergeben & annehmen');
      res.add('Lagerbestände & Einkauf verwalten');
      res.add('Budget & Finanzen freigeben');
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Rezeptur- & Werkgeheimnisse hüten');
      res.add('Ausbildung & Lehrlingsaufsicht');
      res.add('Disziplinar- & Rügegewalt');
    } else if (profLower.includes('souschef') || isSpecialistOrDeputy) {
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Lagerbestände & Einkauf verwalten');
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Rezeptur- & Werkgeheimnisse hüten');
    } else {
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Lagerbestände & Einkauf verwalten');
    }
  }

  // 3. SCHMIED & METALLHANDWERK
  else if (profLower.includes('schmied') || profLower.includes('schlosser') || profLower.includes('schreiner') || profLower.includes('zimmermann') || profLower.includes('handwerker')) {
    if (isApprenticeOrEntry) {
      return [];
    } else if (isMasterOrDirector) {
      res.add('Tagesgeschäft leiten');
      res.add('Preise festlegen');
      res.add('Personal einstellen & entlassen');
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Aufträge vergeben & annehmen');
      res.add('Lagerbestände & Einkauf verwalten');
      res.add('Budget & Finanzen freigeben');
      res.add('Ausbauten & Upgrades anordnen');
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Ausbildung & Lehrlingsaufsicht');
      res.add('Gilden- & Zunftvertretung');
      res.add('Rezeptur- & Werkgeheimnisse hüten');
    } else if (isSpecialistOrDeputy) {
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Aufträge vergeben & annehmen');
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Lagerbestände & Einkauf verwalten');
      res.add('Rezeptur- & Werkgeheimnisse hüten');
      res.add('Ausbildung & Lehrlingsaufsicht');
    } else {
      res.add('Aufträge vergeben & annehmen');
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Ausbildung & Lehrlingsaufsicht');
    }
  }

  // 4. MEDIZIN & HEILKUNDE
  else if (profLower.includes('arzt') || profLower.includes('chirurg') || profLower.includes('heiler') || profLower.includes('apotheker') || profLower.includes('physikus') || profLower.includes('mediz')) {
    if (isApprenticeOrEntry) {
      return [];
    } else if (isMasterOrDirector) {
      res.add('Tagesgeschäft leiten');
      res.add('Personal einstellen & entlassen');
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Budget & Finanzen freigeben');
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Rezeptur- & Werkgeheimnisse hüten');
      res.add('Schlüsselgewalt & Lagerzugang');
      res.add('Notfall- & Evakuierungskommando');
      res.add('Betriebsbeschlüsse fassen');
      res.add('Ausbildung & Lehrlingsaufsicht');
    } else if (isSpecialistOrDeputy) {
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Rezeptur- & Werkgeheimnisse hüten');
      res.add('Schlüsselgewalt & Lagerzugang');
      res.add('Notfall- & Evakuierungskommando');
    } else {
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Schlüsselgewalt & Lagerzugang');
      res.add('Notfall- & Evakuierungskommando');
    }
  }

  // 5. SEEFAHRT & SCHIFFBAU
  else if (profLower.includes('matros') || profLower.includes('kapitän') || profLower.includes('seemann') || profLower.includes('steuermann') || profLower.includes('bootsmann') || profLower.includes('hafen')) {
    if (isApprenticeOrEntry) {
      return [];
    } else if (isMasterOrDirector) {
      res.add('Tagesgeschäft leiten');
      res.add('Personal einstellen & entlassen');
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Budget & Finanzen freigeben');
      res.add('Hausrecht & Sicherheit durchsetzen');
      res.add('Disziplinar- & Rügegewalt');
      res.add('Notfall- & Evakuierungskommando');
      res.add('Verhandlungen führen');
      res.add('Betriebsbeschlüsse fassen');
      res.add('Gewinne entnehmen');
    } else if (isSpecialistOrDeputy) {
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Hausrecht & Sicherheit durchsetzen');
      res.add('Disziplinar- & Rügegewalt');
      res.add('Notfall- & Evakuierungskommando');
      res.add('Qualitätskontrolle & Werkabnahme');
    } else {
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Notfall- & Evakuierungskommando');
    }
  }

  // 6. MILITÄR, WACHE & SICHERHEIT
  else if (profLower.includes('soldat') || profLower.includes('wache') || profLower.includes('ritter') || profLower.includes('hauptmann') || profLower.includes('feldwebel') || profLower.includes('garde') || profLower.includes('söldner') || profLower.includes('offizier')) {
    if (isApprenticeOrEntry) {
      res.add('Hausrecht & Sicherheit durchsetzen');
    } else if (isMasterOrDirector) {
      res.add('Tagesgeschäft leiten');
      res.add('Personal einstellen & entlassen');
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Disziplinar- & Rügegewalt');
      res.add('Hausrecht & Sicherheit durchsetzen');
      res.add('Notfall- & Evakuierungskommando');
      res.add('Schlüsselgewalt & Lagerzugang');
      res.add('Ausbauten & Upgrades anordnen');
      res.add('Betriebsbeschlüsse fassen');
    } else if (isSpecialistOrDeputy) {
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Dienst- & Schichtpläne anordnen');
      res.add('Hausrecht & Sicherheit durchsetzen');
      res.add('Disziplinar- & Rügegewalt');
      res.add('Notfall- & Evakuierungskommando');
      res.add('Ausbildung & Lehrlingsaufsicht');
    } else {
      res.add('Hausrecht & Sicherheit durchsetzen');
      res.add('Notfall- & Evakuierungskommando');
    }
  }

  // 7. HANDEL & KAUFLEUTE
  else if (profLower.includes('kaufmann') || profLower.includes('händler') || profLower.includes('kontor') || profLower.includes('bankier') || profLower.includes('gilde')) {
    if (isApprenticeOrEntry) {
      return [];
    } else if (isMasterOrDirector) {
      res.add('Tagesgeschäft leiten');
      res.add('Preise festlegen');
      res.add('Personal einstellen & entlassen');
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Aufträge vergeben & annehmen');
      res.add('Budget & Finanzen freigeben');
      res.add('Verhandlungen führen');
      res.add('Gilden- & Zunftvertretung');
      res.add('Gewinne entnehmen');
      res.add('Betriebsbeschlüsse fassen');
    } else {
      res.add('Preise festlegen');
      res.add('Aufträge vergeben & annehmen');
      res.add('Verhandlungen führen');
      res.add('Lagerbestände & Einkauf verwalten');
    }
  }

  // 8. ALLGEMEINER FALLBACK
  else {
    if (isMasterOrDirector) {
      res.add('Tagesgeschäft leiten');
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Budget & Finanzen freigeben');
      res.add('Personal einstellen & entlassen');
      res.add('Hausrecht & Sicherheit durchsetzen');
    } else if (isSpecialistOrDeputy) {
      res.add('Aufgaben & Pflichten delegieren');
      res.add('Qualitätskontrolle & Werkabnahme');
      res.add('Lagerbestände & Einkauf verwalten');
    } else if (!isApprenticeOrEntry) {
      res.add('Qualitätskontrolle & Werkabnahme');
    }
  }

  return Array.from(res);
}
