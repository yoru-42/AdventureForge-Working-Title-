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

export const PRESET_NOBILITY_TITLES: Array<{ title: string; rankOrder: number; description: string }> = [
  { title: 'Kaiser / Kaiserin', rankOrder: 1, description: 'Höchster weltlicher Herrschertitel eines Großreiches oder Imperiums.' },
  { title: 'König / Königin', rankOrder: 2, description: 'Souveräner Herrscher eines Königreiches.' },
  { title: 'Großherzog / Großherzogin', rankOrder: 3, description: 'Souveräner Fürst mit königsgleichen Vorrechten über ein Großherzogtum.' },
  { title: 'Herzog / Herzogin', rankOrder: 4, description: 'Hoher Landesherr über ein historisches Herzogtum.' },
  { title: 'Fürst / Fürstin', rankOrder: 5, description: 'Herrscher über ein autonomes Fürstentum mit Reichsstandschaft.' },
  { title: 'Graf / Gräfin', rankOrder: 6, description: 'Verwalter und Herrscher einer Grafschaft mit eigener Gerichtsbarkeit.' },
  { title: 'Baron / Baronin (Freiherr / Freiin)', rankOrder: 7, description: 'Freier Adelsstand mit eigenem Grundbesitz und Lehnsherrschaft.' },
  { title: 'Edler / Edle', rankOrder: 8, description: 'Niederer erblicher Adelsstand des Landadels.' },
  { title: 'Junker / Edelfräulein', rankOrder: 9, description: 'Nachkomme oder junger Spross einer adligen Familie ohne eigenen Besitz.' },
  { title: 'Kronprinz / Kronprinzessin', rankOrder: 2, description: 'Thronfolger eines Königs- oder Kaiserhauses.' },
  { title: 'Erbprinz / Erbprinzessin', rankOrder: 5, description: 'Erblicher Nachfolger eines regierenden Fürsten- oder Herzogshauses.' }
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
