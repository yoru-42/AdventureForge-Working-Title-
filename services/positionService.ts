import { Character, PositionState, SocialTitleState, OfficeState } from '../types';

export const ACQUISITION_METHODS: Record<string, string> = {
  formal_training: 'Formale Ausbildung',
  exam: 'Prüfung',
  experience: 'Langjährige Erfahrung',
  appointment: 'Ernennung',
  recommendation: 'Empfehlung',
  election: 'Wahl',
  emergency_succession: 'Notfallübernahme',
  forced_assignment: 'Pflichtübernahme / Zwang',
  request: 'Bitte / Ersuchen',
  inheritance: 'Erbschaft',
  political_decision: 'Politische Entscheidung',
  religious_appointment: 'Religiöse Weihe / Einsetzung',
  guild_recognition: 'Gildenanerkennung',
  military_command: 'Militärischer Befehl'
};

export const SOCIAL_TITLE_TYPES: Record<string, string> = {
  nobility: 'Adelstitel',
  honorary: 'Ehrentitel',
  civic: 'Bürgerlicher Titel'
};

export const PRESET_NOBILITY_TITLES: Array<{ title: string; rankOrder: number; description: string; category: 'Höchster Adel' | 'Hoher Adel' | 'Mittlerer Adel' | 'Niederer Adel'; isDynastic?: boolean }> = [
  // 1. Höchster Adel (Imperialer & königlicher Souveränitätsadel, Thronerben)
  { title: 'Kaiser / Kaiserin', rankOrder: 1, description: 'Höchster weltlicher Herrschertitel eines Großreiches oder Imperiums.', category: 'Höchster Adel' },
  { title: 'König / Königin', rankOrder: 2, description: 'Souveräner Herrscher eines Königreiches.', category: 'Höchster Adel' },
  { title: 'Kronprinz / Kronprinzessin', rankOrder: 2, description: 'Direkter Thronfolger eines königlichen oder kaiserlichen Herrscherhauses.', category: 'Höchster Adel', isDynastic: true },
  { title: 'Großherzog / Großherzogin', rankOrder: 3, description: 'Souveräner Fürst mit königsgleichen Vorrechten über ein Großherzogtum.', category: 'Höchster Adel' },

  // 2. Hoher Adel (Fürstlicher Stand, regierende Landesherren, Hochdynastien)
  { title: 'Prinz / Prinzessin', rankOrder: 3, description: 'Nachkomme eines regierenden Königs- oder Kaiserhauses.', category: 'Hoher Adel', isDynastic: true },
  { title: 'Kurfürst / Kurfürstin', rankOrder: 4, description: 'Reichsfürst mit dem exklusiven Vorrecht zur Wahl des Königs oder Kaisers.', category: 'Hoher Adel' },
  { title: 'Herzog / Herzogin', rankOrder: 5, description: 'Hoher Landesherr über ein historisches Herzogtum.', category: 'Hoher Adel' },
  { title: 'Erbherzog / Erbherzogstochter', rankOrder: 5, description: 'Erblicher Nachfolger des regierenden Herzogshauses.', category: 'Hoher Adel', isDynastic: true },
  { title: 'Fürst / Fürstin', rankOrder: 6, description: 'Herrscher über ein autonomes Fürstentum mit Reichsstandschaft.', category: 'Hoher Adel' },
  { title: 'Erbprinz / Erbprinzessin', rankOrder: 6, description: 'Erblicher Nachfolger eines Fürstenhauses.', category: 'Hoher Adel', isDynastic: true },
  { title: 'Landgraf / Landgräfin', rankOrder: 7, description: 'Unmittelbar dem Landesherrn oder Kaiser unterstehender Herrscher einer Landgrafschaft.', category: 'Hoher Adel' },
  { title: 'Markgraf / Markgräfin', rankOrder: 8, description: 'Herrscher über ein kaiserliches Grenzgebiet mit erweiterter militärischer Vollmacht.', category: 'Hoher Adel' },
  { title: 'Pfalzgraf / Pfalzgräfin', rankOrder: 9, description: 'Kaiserlicher Stellvertreter und Statthalter an einer königlichen Pfalz.', category: 'Hoher Adel' },

  // 3. Mittlerer Adel (Grafenstand & freie Herren / Barone)
  { title: 'Graf / Gräfin', rankOrder: 10, description: 'Verwalter und Landesherr einer Grafschaft mit eigener Gerichtsbarkeit.', category: 'Mittlerer Adel' },
  { title: 'Erbgraf / Erbgräfin (Komtesse)', rankOrder: 10, description: 'Erblicher Nachfolger oder Tochter einer regierenden Grafenfamilie.', category: 'Mittlerer Adel', isDynastic: true },
  { title: 'Burggraf / Burggräfin', rankOrder: 11, description: 'Militärischer und richterlicher Herrscher über eine reichsunmittelbare Burg.', category: 'Mittlerer Adel' },
  { title: 'Vizegraf / Vizegräfin (Viscount)', rankOrder: 12, description: 'Stellvertreter des Grafen oder Lehnsherr einer Vizegrafschaft.', category: 'Mittlerer Adel' },
  { title: 'Baron / Baronin (Freiherr / Freiin)', rankOrder: 13, description: 'Freier Adelsstand mit eigenem Grundbesitz und Lehnsherrschaft.', category: 'Mittlerer Adel' },
  { title: 'Baronssohn / Baronstochter', rankOrder: 13, description: 'Nachkomme einer Freiherren- oder Baronsfamilie.', category: 'Mittlerer Adel', isDynastic: true },

  // 4. Niederer Adel (Ritterstand, Dienst- & Landadel, städtisches Patriziat)
  { title: 'Ritter (Adelsstand / Lehnsritter)', rankOrder: 14, description: 'Geweihter oder erblicher ritterlicher Stand mit Wappenrecht.', category: 'Niederer Adel' },
  { title: 'Edler / Edle', rankOrder: 15, description: 'Niederer erblicher Adelsstand des ritterbürtigen Landadels.', category: 'Niederer Adel' },
  { title: 'Junker / Edelfräulein', rankOrder: 16, description: 'Nachkomme oder junger Spross einer adligen Familie ohne eigenen Grundbesitz.', category: 'Niederer Adel' },
  { title: 'Patrizier (Stadtadel)', rankOrder: 17, description: 'Mitglied des erblichen regimentsfähigen Patriziats freier Reichsstädte.', category: 'Niederer Adel' }
];

export const PRESET_HONORARY_TITLES: Array<{ title: string; description: string }> = [
  { title: 'Held / Heldin des Reiches', description: 'Besondere gesellschaftliche Auszeichnung für herausragende Taten.' },
  { title: 'Saint / Saintess', description: 'Sakraler Ehrentitel für anerkannte Heiligsprechung oder göttliche Erwählung.' },
  { title: 'Ehrenbürger', description: 'Bürgerliche Würdigung einer Stadt oder freien Gemeinde.' },
  { title: 'Großkomtur', description: 'Hohe ritterliche Auszeichnung innerhalb eines Ordens.' }
];

export const PRESET_OFFICES: Array<{ name: string; institution: string; description: string }> = [
  { name: 'Kanzler', institution: 'Staatskanzlei / Kronrat', description: 'Leiter der Regierungsgeschäfte und Siegelbewahrer.' },
  { name: 'Verwalter', institution: 'Landesverwaltung / Gutshof', description: 'Ökonomische und organisatorische Leitung von Liegenschaften.' },
  { name: 'Kurfürstlicher Beamter', institution: 'Kurfürstliches Amt', description: 'Behördliche Vertretung und Aktenführung des Kurfürstentums.' },
  { name: 'Richter', institution: 'Stadt- oder Landesgericht', description: 'Ausübung der ordentlichen Gerichtsbarkeit.' },
  { name: 'Bürgermeister', institution: 'Magistrat / Stadtrat', description: 'Gewähltes oder bestelltes Oberhaupt einer freien Stadt.' },
  { name: 'Seneschall', institution: 'Herrscherpalast', description: 'Oberster Verwalter des Hofstaates und der Pfalzen.' },
  { name: 'Bischof / Propst', institution: 'Diözese / Kirchenprovinz', description: 'Geistliche und weltliche Leitung einer kirchlichen Verwaltungseinheit.' },
  { name: 'Abt / Äbtissin', institution: 'Kloster / Abtei', description: 'Vorsteher einer klösterlichen Gemeinschaft.' },
  { name: 'Theokrat', institution: 'Religiöser Staat', description: 'Staatsoberhaupt eines religiös regierten Territoriums.' },
  { name: 'Inquisitor', institution: 'Glaubensgericht', description: 'Untersuchungsrichter für Ketzerei und verbotene Praktiken.' },
  { name: 'Gūji (Oberpriester)', institution: 'Schrein-Kollegium', description: 'Oberster Leiter eines Hauptschreins.' }
];

export const PRESET_POSITIONS: Array<{ title: string; category: string; description: string }> = [
  // 1. Stellvertreterebene (Deputy Level)
  { title: 'Stellvertreter', category: 'Stellvertreterebene', description: 'Allgemeine stellvertretende Führung mit Vertretungsmacht bei Abwesenheit der Leitung.' },
  { title: 'Stellvertretende Leitung', category: 'Stellvertreterebene', description: 'Zweite Leitungsperson einer Abteilung, Einrichtung oder Organisation.' },
  { title: 'Stellvertretender Werkstattleiter', category: 'Stellvertreterebene', description: 'Stellvertreter der handwerklichen Betriebsleitung.' },
  { title: 'Stellvertretender Hafenmeister', category: 'Stellvertreterebene', description: 'Stellvertretende Aufsicht über Hafenbecken, Liegeplätze und Kaianlagen.' },
  { title: 'Stellvertretender Kapitän (Erster Offizier)', category: 'Stellvertreterebene', description: 'Erster Offizier und direkter Stellvertreter des Kapitäns an Bord.' },
  { title: 'Stellvertretender Handelsleiter', category: 'Stellvertreterebene', description: 'Zweiter Verantwortlicher für Handelskontore und kaufmännische Geschäfte.' },
  { title: 'Zweiter Verantwortlicher', category: 'Stellvertreterebene', description: 'Erster Ansprechpartner und Vertretung in Projekten oder Expeditionen.' },
  { title: 'Souschef', category: 'Stellvertreterebene', description: 'Stellvertretender Küchenleiter in Groß- und Hofküchen.' },

  // 2. Aufsicht & Mittlere Führung (Supervisory & Middle Leadership)
  { title: 'Vorarbeiter', category: 'Aufsicht & Führung', description: 'Fachliche Anleitung und Aufsicht über ein Arbeitsteam am Einsatzort.' },
  { title: 'Schichtleiter', category: 'Aufsicht & Führung', description: 'Verantwortlich für den reibungslosen Ablauf einer Arbeitsschicht.' },
  { title: 'Gruppenleiter', category: 'Aufsicht & Führung', description: 'Leitung einer spezifischen Fachgruppe oder Einsatzgruppe.' },
  { title: 'Werkstattaufseher', category: 'Aufsicht & Führung', description: 'Überwachung von Werkstattabläufen, Arbeitsschutz und Materialeinsatz.' },
  { title: 'Baustellenleiter', category: 'Aufsicht & Führung', description: 'Koordinierung von Maurer-, Steinmetz- und Zimmererarbeiten auf der Baustelle.' },
  { title: 'Stationsleiter', category: 'Aufsicht & Führung', description: 'Leitung einer Sanitäts-, Pflegestation oder Postenstation.' },
  { title: 'Wachführer', category: 'Aufsicht & Führung', description: 'Kommandant der täglichen Wachschicht in Stadttoren oder Garnisonen.' },
  { title: 'Ausbildungsleiter', category: 'Aufsicht & Führung', description: 'Verantwortlich für den Ausbildungsplan und die Betreuung von Lehrlingen.' },
  { title: 'Lagerleiter', category: 'Aufsicht & Führung', description: 'Verantwortlicher für Lagerbestände, Inventur und Logistikabwicklung.' },
  { title: 'Frachtmeister', category: 'Aufsicht & Führung', description: 'Aufsicht über Beladung, Verstauung und Transport von Frachtgütern.' },
  { title: 'Bergwerksaufseher', category: 'Aufsicht & Führung', description: 'Überwachung von Stollenbau, Grubensicherheit und Erzförderung.' },

  // 3. Leitung (Management Level)
  { title: 'Leiter', category: 'Leitungsebene', description: 'Gesamtverantwortung für eine operative Einheit oder Einrichtung.' },
  { title: 'Abteilungsleiter', category: 'Leitungsebene', description: 'Führung einer Fachabteilung in Verwaltung, Kontor oder Manufaktur.' },
  { title: 'Werkstattleiter', category: 'Leitungsebene', description: 'Betriebsleiter einer handwerklichen Großwerkstatt oder Manufaktur.' },
  { title: 'Küchenchef', category: 'Leitungsebene', description: 'Oberste Leitung von Brigaden, Speiseplänen und Vorratswirtschaft in Großküchen.' },
  { title: 'Hafenmeister', category: 'Leitungsebene', description: 'Oberste Verwaltungs- und Ordnungsperson eines Hafens.' },
  { title: 'Betriebsleiter', category: 'Leitungsebene', description: 'Gesamtkaufmännische und technische Führung eines Wirtschaftsbetriebs.' },
  { title: 'Schulleiter', category: 'Leitungsebene', description: 'Pädagogische und organisatorische Leitung einer Schule oder Lehranstalt.' },
  { title: 'Klinikleiter', category: 'Leitungsebene', description: 'Medizinische und administrative Führung einer Hospital- oder Kuranstalt.' },
  { title: 'Werftmeister', category: 'Leitungsebene', description: 'Leiter des Schiffbaus und der Trockendocks auf einer Werft.' },
  { title: 'Vorratsverwalter', category: 'Leitungsebene', description: 'Leitung der zentralen Korn- und Vorratsspeicher.' },
  { title: 'Haushofmeister', category: 'Leitungsebene', description: 'Oberster Verwalter des adeligen oder großbürgerlichen Anwesens.' },
  { title: 'Stadtverwalter', category: 'Leitungsebene', description: 'Administrative Führung kommunaler Verwaltungsaufgaben.' },

  // 4. Höhere Leitung (Executive Level)
  { title: 'Direktor', category: 'Höhere Leitung', description: 'Vorstand oder oberster Leiter bedeutender Institutionen.' },
  { title: 'Generaldirektor', category: 'Höhere Leitung', description: 'Oberster Exekutivleiter handelsübergreifender Konsortien oder Gilden.' },
  { title: 'Betriebsdirektor', category: 'Höhere Leitung', description: 'Strategische Leitung großer Produktionsstätten und Bergwerke.' },
  { title: 'Werftdirektor', category: 'Höhere Leitung', description: 'Strategische Führung großer Kriegsschiffs- oder Handelswerften.' },
  { title: 'Hauptverwalter', category: 'Höhere Leitung', description: 'Leiter des gesamten Verwaltungsapparates einer Provinz oder Kronlands.' },
  { title: 'Obermeister', category: 'Höhere Leitung', description: 'Gewählter Vorsitzender des Zunftrats einer gesamten Zunft.' },
  { title: 'Schuldirektor', category: 'Höhere Leitung', description: 'Leitung von Gymnasien, Akademien und Lehranstalten.' },
  { title: 'Rektor', category: 'Höhere Leitung', description: 'Akademischer Oberhaupt einer Universität oder Hochschule.' },

  // 5. Militär- & Marinefunktionen (Military Ranks / Roles)
  { title: 'Unteroffizier', category: 'Militärische Ränge', description: 'Führer kleinerer Truppenteile (Trupps, Gruppen).' },
  { title: 'Feldwebel', category: 'Militärische Ränge', description: 'Dienstältester Unteroffizier mit Aufgaben im Innendienst und der Exerzierausbildung.' },
  { title: 'Deckoffizier', category: 'Marine & Seefahrt', description: 'Offizier mit technischem oder nautischem Spezialaufsichtsbereich an Bord.' },
  { title: 'Erster Offizier', category: 'Marine & Seefahrt', description: 'Erster Stellvertreter des Kapitäns zur See.' },
  { title: 'General', category: 'Militär', description: 'Oberbefehlshaber von Feldheeren und Armeekorps.' },
  { title: 'Admiral', category: 'Marine', description: 'Oberbefehlshaber der Kriegs- und Hochseeflotte.' },
  { title: 'Kommandant', category: 'Militär', description: 'Führungsoffizier einer Garnison, Festung oder Einheit.' },
  { title: 'Taktiker / Strategieberater', category: 'Militär & Hof', description: 'Militärtheoretische Analyse und Ausarbeitung von Schlachtplänen.' },
  { title: 'Quartiermeister', category: 'Logistik', description: 'Verantwortlich für Heeresversorgung, Ausrüstung und Quartier.' },
  { title: 'Diplomat / Gesandter', category: 'Hof & Staat', description: 'Bevollmächtigter Unterhändler für zwischenstaatliche Verträge.' },
  { title: 'Berater / Ratsherr', category: 'Hof & Staat', description: 'Mitglied des Konsultativrates eines Herrschers oder einer Stadt.' },
  { title: 'Leibwächter', category: 'Schutz', description: 'Persönlicher Nahschutz für Würdenträger oder Adlige.' },
  { title: 'Körperdouble', category: 'Geheimdienst', description: 'Täuschungsrolle zur Abwehr von Attentaten auf Schutzpersonen.' },
  { title: 'Grenzpatrouille / Postenführer', category: 'Sicherheit', description: 'Überwachung von Grenzlinien und Reichstoren.' },
  { title: 'Ritter (Ordensritter / Lehnsritter)', category: 'Militär & Stand', description: 'Geweihter oder belehnter berittener Kämpfer.' },
  { title: 'Vorkoster', category: 'Hofdienst', description: 'Prüfung von Speisen und Getränken auf Gifte vor dem Fürsten.' }
];

export const PRESET_SOCIAL_STATUSES: Array<{ status: string; description: string }> = [
  { status: 'Freibürger', description: 'Freier Stadt- oder Landbewohner mit vollen Bürgerrechten.' },
  { status: 'Zunftbürger', description: 'Vollberechtigtes Mitglied einer anerkannten Handwerks- oder Handelsgilde.' },
  { status: 'Adelsstand', description: 'Gebürtiges oder erhobenes Mitglied des herrschenden Standes.' },
  { status: 'Kleriker / Geistlicher', description: 'Person im geweihten geistlichen Dienst.' },
  { status: 'Leibeigener / Höriger', description: 'An die Scholle gebundener Bauer unter grundherrlicher Abhängigkeit.' },
  { status: 'Sklave', description: 'Rechtlich unfreie Person ohne Bürgerrechte im Eigentum eines Besitzers.' },
  { status: 'Schüler / Student', description: 'Person in akademischer oder schulischer Ausbildung.' },
  { status: 'Schutzbefohlener', description: 'Unter rechtlicher Vormundschaft oder Asyl stehende Person.' },
  { status: 'Vogelfrei / Geächtet (Outlaw)', description: 'Person außerhalb des Rechtsschutzes, zur Festnahme oder Tötung freigegeben.' },
  { status: 'Deserteur / Flüchtiger', description: 'Vom Militär oder der Justiz steckbrieflich gesuchte Person.' }
];

export interface PositionChangeEvent {
  positionTitle: string;
  action?: 'appoint' | 'dismiss' | 'resign' | 'recognize';
  method?: string;
  reason?: string;
  appointedBy?: string[];
  recognizedBy?: string[];
  voluntary?: boolean;
}

export interface SocialTitleChangeEvent {
  title: string;
  action?: 'grant' | 'revoke';
  type?: 'nobility' | 'honorary' | 'civic' | string;
  grantedBy?: string;
  inherited?: boolean;
  reason?: string;
}

export interface OfficeChangeEvent {
  name: string;
  action?: 'appoint' | 'dismiss';
  institution?: string;
  appointedBy?: string;
  term?: string;
  description?: string;
}

/**
 * Applies a position change event deterministically to a character.
 * CRITICAL RULE: A position change NEVER arbitrarily increases or modifies craft or combat competencies.
 */
export function applyPositionChange(
  character: Character,
  event: PositionChangeEvent
): { updatedCharacter: Character; notification?: string; applied: boolean } {
  const currentPositions: PositionState[] = Array.isArray(character.positions) ? [...character.positions] : [];
  const action = event.action || 'appoint';
  const cleanTitle = (event.positionTitle || '').trim();

  if (!cleanTitle) {
    return { updatedCharacter: character, applied: false };
  }

  if (action === 'dismiss' || action === 'resign') {
    const nextPositions = currentPositions.filter(p => p.title.toLowerCase() !== cleanTitle.toLowerCase());
    return {
      updatedCharacter: {
        ...character,
        positions: nextPositions
      },
      notification: `Position abgelegt: ${cleanTitle}`,
      applied: true
    };
  }

  // Appoint or recognize
  const existingIdx = currentPositions.findIndex(p => p.title.toLowerCase() === cleanTitle.toLowerCase());
  const method = event.method || 'appointment';
  const voluntary = event.voluntary !== undefined ? event.voluntary : true;

  const newPosition: PositionState = {
    id: existingIdx > -1 ? currentPositions[existingIdx].id : `pos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: cleanTitle,
    holderCharacterId: character.id,
    acquiredAt: new Date().toISOString(),
    acquisitionMethod: method,
    reason: event.reason || (existingIdx > -1 ? currentPositions[existingIdx].reason : undefined),
    appointedBy: event.appointedBy || (existingIdx > -1 ? currentPositions[existingIdx].appointedBy : undefined),
    recognizedBy: event.recognizedBy || (existingIdx > -1 ? currentPositions[existingIdx].recognizedBy : undefined),
    voluntary
  };

  if (existingIdx > -1) {
    currentPositions[existingIdx] = newPosition;
  } else {
    currentPositions.push(newPosition);
  }

  const methodLabel = ACQUISITION_METHODS[method] || method;
  const reasonSuffix = event.reason ? ` (${event.reason})` : '';

  return {
    updatedCharacter: {
      ...character,
      positions: currentPositions
    },
    notification: `Neue Position übernommen: ${cleanTitle} [${methodLabel}]${reasonSuffix}`,
    applied: true
  };
}

/**
 * Applies a social title change (e.g. Baron, Ritter, Ehrenbürger).
 * Titles are strictly detached from competencies.
 */
export function applySocialTitleChange(
  character: Character,
  event: SocialTitleChangeEvent
): { updatedCharacter: Character; notification?: string; applied: boolean } {
  const currentTitles: SocialTitleState[] = Array.isArray(character.socialTitles) ? [...character.socialTitles] : [];
  const action = event.action || 'grant';
  const cleanTitle = (event.title || '').trim();

  if (!cleanTitle) {
    return { updatedCharacter: character, applied: false };
  }

  if (action === 'revoke') {
    const nextTitles = currentTitles.filter(t => t.title.toLowerCase() !== cleanTitle.toLowerCase());
    return {
      updatedCharacter: {
        ...character,
        socialTitles: nextTitles
      },
      notification: `Titel aberkannt / niedergelegt: ${cleanTitle}`,
      applied: true
    };
  }

  const existingIdx = currentTitles.findIndex(t => t.title.toLowerCase() === cleanTitle.toLowerCase());
  const newTitle: SocialTitleState = {
    id: existingIdx > -1 ? currentTitles[existingIdx].id : `title_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: cleanTitle,
    titleType: event.type || 'nobility',
    grantedAt: new Date().toISOString(),
    grantedBy: event.grantedBy,
    inherited: event.inherited,
    reason: event.reason
  };

  if (existingIdx > -1) {
    currentTitles[existingIdx] = newTitle;
  } else {
    currentTitles.push(newTitle);
  }

  return {
    updatedCharacter: {
      ...character,
      socialTitles: currentTitles
    },
    notification: `Gesellschaftlicher Titel verliehen: ${cleanTitle}`,
    applied: true
  };
}

/**
 * Applies an office change (e.g. Bürgermeister, Richter, Gildenmeister).
 */
export function applyOfficeChange(
  character: Character,
  event: OfficeChangeEvent
): { updatedCharacter: Character; notification?: string; applied: boolean } {
  const currentOffices: OfficeState[] = Array.isArray(character.offices) ? [...character.offices] : [];
  const action = event.action || 'appoint';
  const cleanName = (event.name || '').trim();

  if (!cleanName) {
    return { updatedCharacter: character, applied: false };
  }

  if (action === 'dismiss') {
    const nextOffices = currentOffices.filter(o => o.name.toLowerCase() !== cleanName.toLowerCase());
    return {
      updatedCharacter: {
        ...character,
        offices: nextOffices
      },
      notification: `Amt abgegeben: ${cleanName}`,
      applied: true
    };
  }

  const existingIdx = currentOffices.findIndex(o => o.name.toLowerCase() === cleanName.toLowerCase());
  const newOffice: OfficeState = {
    id: existingIdx > -1 ? currentOffices[existingIdx].id : `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    institution: event.institution,
    appointedAt: new Date().toISOString(),
    appointedBy: event.appointedBy,
    term: event.term,
    description: event.description
  };

  if (existingIdx > -1) {
    currentOffices[existingIdx] = newOffice;
  } else {
    currentOffices.push(newOffice);
  }

  const instSuffix = event.institution ? ` (${event.institution})` : '';

  return {
    updatedCharacter: {
      ...character,
      offices: currentOffices
    },
    notification: `In Amt eingesetzt: ${cleanName}${instSuffix}`,
    applied: true
  };
}
