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
