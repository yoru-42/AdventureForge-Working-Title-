import {
  Character,
  ProfessionCompetency,
  ProfessionProgress,
  ProfessionCompetencyActivity,
  SecondaryProfession,
  ProfessionExperience,
  PositionState,
  SocialTitleState,
  OfficeState
} from '../types';
import {
  getCatalogCompetenciesForProfession,
  findProfessionCatalogEntry,
  ProfessionCompetencyDefinition,
  PROFESSION_FIELDS
} from '../lib/professionCompetencies';

/**
 * Formats structured or numeric experience into a clean string (e.g. "8 Jahre, 4 Monate").
 */
export function formatProfessionExperience(
  exp?: ProfessionExperience | number,
  months?: number,
  days?: number
): string {
  if (!exp && exp !== 0) return '0 Jahre';

  let y = 0;
  let m = 0;
  let d = 0;

  if (typeof exp === 'number') {
    y = Math.max(0, Math.floor(exp));
    m = Math.max(0, Math.floor(months || 0));
    d = Math.max(0, Math.floor(days || 0));
  } else if (typeof exp === 'object') {
    y = Math.max(0, Math.floor(exp.years || 0));
    m = Math.max(0, Math.floor(exp.months || 0));
    d = Math.max(0, Math.floor(exp.days || 0));
  }

  const parts: string[] = [];
  if (y > 0) {
    parts.push(`${y} ${y === 1 ? 'Jahr' : 'Jahre'}`);
  }
  if (m > 0) {
    parts.push(`${m} ${m === 1 ? 'Monat' : 'Monate'}`);
  }
  if (d > 0 && parts.length === 0) {
    parts.push(`${d} ${d === 1 ? 'Tag' : 'Tage'}`);
  }

  return parts.length > 0 ? parts.join(', ') : '0 Jahre';
}

/**
 * Multipliers for talent scores (0 to 5).
 * Higher talent allows learning faster, but never skips practice.
 */
export const TALENT_LEARNING_MULTIPLIERS: Record<number, number> = {
  0: 0.8,  // kein besonderes Talent
  1: 0.9,  // langsam
  2: 1.0,  // eher langsam / basis
  3: 1.2,  // normal
  4: 1.45, // talentiert
  5: 1.75  // außergewöhnliches Talent
};

/**
 * Returns human-readable label for talent levels (neutral, no emojis).
 */
export function getTalentLabel(talent: number): string {
  const t = Math.max(0, Math.min(5, Math.round(talent)));
  switch (t) {
    case 0: return 'Kein Talent (0/5)';
    case 1: return 'Gering (1/5)';
    case 2: return 'Basis (2/5)';
    case 3: return 'Normal (3/5)';
    case 4: return 'Talentiert (4/5)';
    case 5: return 'Außergewöhnlich (5/5)';
    default: return `${t}/5`;
  }
}

/**
 * Normalizes and clamps a competency object to guarantee valid bounds.
 */
export function normalizeCompetency(c: Partial<ProfessionCompetency>): ProfessionCompetency {
  const prof = Math.max(0, Math.min(100, Math.round(Number(c.proficiency ?? 0))));
  const xp = Math.max(0, Math.round(Number(c.experiencePoints ?? 0)));
  const talent = Math.max(0, Math.min(5, Math.round(Number(c.talent ?? 2))));
  const practices = Math.max(0, Math.round(Number(c.practiceCount ?? 0)));

  return {
    id: c.id || `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: (c.name || 'Unbenannte Kompetenz').trim(),
    category: c.category || 'Grundlage',
    proficiency: prof,
    experiencePoints: xp,
    talent: talent,
    description: c.description || '',
    notes: c.notes || '',
    practiceCount: practices,
    lastPracticedAt: c.lastPracticedAt,
    relatedCompetencyIds: Array.isArray(c.relatedCompetencyIds) ? c.relatedCompetencyIds : [],
    professionId: c.professionId
  };
}

/**
 * Normalizes and clamps a profession progress object.
 */
export function normalizeProfessionProgress(p: Partial<ProfessionProgress>, defaultName = ''): ProfessionProgress {
  return {
    professionId: p.professionId,
    professionName: (p.professionName || defaultName || 'Beruf').trim(),
    level: p.level || 'Anfänger',
    overallProficiency: Math.max(0, Math.min(100, Math.round(Number(p.overallProficiency ?? 0)))),
    experiencePoints: Math.max(0, Math.round(Number(p.experiencePoints ?? 0))),
    experienceText: p.experienceText || '',
    promotionConditions: Array.isArray(p.promotionConditions) ? p.promotionConditions : []
  };
}

/**
 * Creates a new instance of a competency from its definition.
 */
export function createCompetencyFromDefinition(
  def: ProfessionCompetencyDefinition,
  initialTalent = 3,
  initialProficiency = 0
): ProfessionCompetency {
  return normalizeCompetency({
    id: def.id,
    name: def.name,
    category: def.category,
    proficiency: initialProficiency,
    experiencePoints: 0,
    talent: initialTalent,
    description: def.description,
    relatedCompetencyIds: def.relatedCompetencyIds || [],
    professionId: def.professionId
  });
}

/**
 * Calculates XP required to advance by 1% based on current proficiency (diminishing returns).
 */
export function getXpPerPercent(currentProficiency: number): number {
  if (currentProficiency < 20) return 15;      // 0-20%: relatively fast
  if (currentProficiency < 50) return 30;      // 20-50%: normal
  if (currentProficiency < 75) return 60;      // 50-75%: slower
  if (currentProficiency < 90) return 130;     // 75-90%: much slower
  if (currentProficiency < 99) return 260;     // 90-99%: very slow
  return 600;                                  // 99-100%: mastery
}

/**
 * Calculates base XP gained for a given activity action and difficulty.
 */
export function calculateActivityBaseXp(activity: ProfessionCompetencyActivity): number {
  let base = 25;
  const diff = (activity.difficulty || 'medium').toLowerCase();
  if (diff === 'easy') base = 15;
  else if (diff === 'medium') base = 30;
  else if (diff === 'hard') base = 55;
  else if (diff === 'extreme') base = 90;

  const action = (activity.action || 'practice').toLowerCase();
  if (action === 'study') base = Math.round(base * 0.7);
  else if (action === 'work') base = Math.round(base * 1.0);
  else if (action === 'practice') base = Math.round(base * 1.15);
  else if (action === 'experiment') base = Math.round(base * 1.25);
  else if (action === 'masterpiece') base = Math.round(base * 1.8);

  if (activity.successful === false) {
    base = Math.round(base * 0.45); // Mistakes still teach, but less
  }

  if (activity.meaningfulPractice === false) {
    base = Math.round(base * 0.4); // Trivial repetition gives little
  }

  return Math.max(5, base);
}

/**
 * Applies progress to a single competency deterministically based on XP and talent.
 */
export function calculateCompetencyProgress(
  competency: ProfessionCompetency,
  rawXpGain: number
): { updatedCompetency: ProfessionCompetency; proficiencyGain: number; effectiveXp: number } {
  const norm = normalizeCompetency(competency);
  const talentMult = TALENT_LEARNING_MULTIPLIERS[norm.talent] ?? 1.0;
  const effectiveXp = Math.max(1, Math.round(rawXpGain * talentMult));

  let currentProf = norm.proficiency;
  let remainingXp = effectiveXp;
  let accumulatedGain = 0;

  // Simulate gradual point increases across diminishing return brackets
  while (remainingXp > 0 && currentProf < 100) {
    const costForOnePercent = getXpPerPercent(currentProf);
    if (remainingXp >= costForOnePercent) {
      remainingXp -= costForOnePercent;
      currentProf += 1;
      accumulatedGain += 1;
    } else {
      // Fractional progress: probabilistically or just accumulate in total XP
      const fraction = remainingXp / costForOnePercent;
      if (fraction >= 0.5 && currentProf < 100) {
        currentProf += 1;
        accumulatedGain += 1;
      }
      break;
    }
  }

  const updated: ProfessionCompetency = {
    ...norm,
    proficiency: Math.min(100, currentProf),
    experiencePoints: norm.experiencePoints + effectiveXp,
    practiceCount: (norm.practiceCount || 0) + 1,
    lastPracticedAt: new Date().toISOString()
  };

  return {
    updatedCompetency: updated,
    proficiencyGain: accumulatedGain,
    effectiveXp
  };
}

/**
 * Finds a matching competency in a list by id or loose name matching.
 */
export function findCompetencyInList(
  list: ProfessionCompetency[],
  query: string
): ProfessionCompetency | undefined {
  if (!query || !Array.isArray(list)) return undefined;
  const qNorm = query.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');

  return list.find(c => {
    if (c.id === query) return true;
    const cNorm = c.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
    return cNorm === qNorm || cNorm.includes(qNorm) || qNorm.includes(cNorm);
  });
}

/**
 * Applies a chat-observed activity to a character or NPC's competencies and overall profession progress.
 * Returns the updated character, notification summary, and detailed changes.
 */
export function applyProfessionCompetencyActivity(
  character: Character,
  activity: ProfessionCompetencyActivity
): {
  updatedCharacter: Character;
  notification?: string;
  applied: boolean;
  gainedXp?: number;
  gainedProficiency?: number;
} {
  if (!character) {
    return { updatedCharacter: character, applied: false };
  }

  // Ensure character has initialized profession data
  const migrated = migrateLegacyProfessionData(character);
  const competencies = [...(migrated.professionCompetencies || [])];
  const query = activity.competencyId || activity.competencyName || '';

  let targetComp = findCompetencyInList(competencies, query);

  // If not found in main, check secondary professions
  let isSecondary = false;
  let secIndex = -1;

  if (!targetComp && migrated.secondaryProfessions && migrated.secondaryProfessions.length > 0) {
    for (let i = 0; i < migrated.secondaryProfessions.length; i++) {
      const sec = migrated.secondaryProfessions[i];
      const secList = sec.professionCompetencies || [];
      const found = findCompetencyInList(secList, query);
      if (found) {
        targetComp = found;
        isSecondary = true;
        secIndex = i;
        break;
      }
    }
  }

  // If still not found, check if it matches a catalog entry for the character's profession and auto-add it with 0%
  if (!targetComp && query.trim().length > 0) {
    const catalog = getCatalogCompetenciesForProfession(migrated.profession || '');
    const def = catalog.find(d => {
      const dNorm = d.name.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
      const qNorm = query.toLowerCase().trim().replace(/[^a-zäöüß0-9]/g, '');
      return dNorm === qNorm || dNorm.includes(qNorm) || qNorm.includes(dNorm);
    });

    if (def) {
      targetComp = createCompetencyFromDefinition(def, 3, 0);
      competencies.push(targetComp);
    }
  }

  if (!targetComp) {
    // Competency couldn't be resolved or created
    return { updatedCharacter: migrated, applied: false };
  }

  const baseXp = calculateActivityBaseXp(activity);
  const { updatedCompetency, proficiencyGain, effectiveXp } = calculateCompetencyProgress(targetComp, baseXp);

  // Handle related competencies side-benefit
  const updatedList: ProfessionCompetency[] = [];
  const relatedIds = updatedCompetency.relatedCompetencyIds || [];

  const targetListToUpdate = isSecondary && secIndex >= 0
    ? [...(migrated.secondaryProfessions![secIndex].professionCompetencies || [])]
    : competencies;

  for (const c of targetListToUpdate) {
    if (c.id === updatedCompetency.id) {
      updatedList.push(updatedCompetency);
    } else if (relatedIds.includes(c.id)) {
      // 15% side XP for directly related skills
      const sideXp = Math.max(3, Math.round(baseXp * 0.15));
      const sideResult = calculateCompetencyProgress(c, sideXp);
      updatedList.push(sideResult.updatedCompetency);
    } else {
      updatedList.push(c);
    }
  }

  // Update overall profession progress
  let updatedProgress: ProfessionProgress;
  let updatedSecProfessions = migrated.secondaryProfessions ? [...migrated.secondaryProfessions] : [];

  if (isSecondary && secIndex >= 0) {
    const sec = updatedSecProfessions[secIndex];
    const secProg = normalizeProfessionProgress(sec.professionProgress || {}, sec.profession);
    const overallXp = secProg.experiencePoints + Math.round(effectiveXp * 0.25);
    const overallProf = Math.min(100, Math.round(secProg.overallProficiency + (proficiencyGain > 0 ? 1 : 0)));

    updatedSecProfessions[secIndex] = {
      ...sec,
      proficiencyScore: overallProf,
      experiencePoints: overallXp,
      professionProgress: {
        ...secProg,
        overallProficiency: overallProf,
        experiencePoints: overallXp
      },
      professionCompetencies: updatedList
    };

    updatedProgress = migrated.professionProgress || normalizeProfessionProgress({}, migrated.profession);
  } else {
    const curProg = normalizeProfessionProgress(migrated.professionProgress || {}, migrated.profession);
    const overallXp = curProg.experiencePoints + Math.round(effectiveXp * 0.25);
    const overallProf = Math.min(100, Math.round(curProg.overallProficiency + (proficiencyGain > 0 ? 1 : 0)));

    updatedProgress = {
      ...curProg,
      overallProficiency: overallProf,
      experiencePoints: overallXp
    };
  }

  const updatedChar: Character = {
    ...migrated,
    professionProficiencyScore: isSecondary ? migrated.professionProficiencyScore : updatedProgress.overallProficiency,
    professionExperiencePoints: isSecondary ? migrated.professionExperiencePoints : updatedProgress.experiencePoints,
    professionProgress: isSecondary ? migrated.professionProgress : updatedProgress,
    professionCompetencies: isSecondary ? migrated.professionCompetencies : updatedList,
    secondaryProfessions: updatedSecProfessions
  };

  const nameStr = updatedCompetency.name;
  const notif = proficiencyGain > 0
    ? `Berufspraxis: ${nameStr} +${proficiencyGain}% (${updatedCompetency.proficiency}%, +${effectiveXp} XP)`
    : `Berufspraxis: ${nameStr} (+${effectiveXp} XP, Übung abgeschlossen)`;

  return {
    updatedCharacter: updatedChar,
    notification: notif,
    applied: true,
    gainedXp: effectiveXp,
    gainedProficiency: proficiencyGain
  };
}

/**
 * Migrates legacy character data cleanly without overwriting existing data.
 */
export function migrateLegacyProfessionData(char: Character): Character {
  if (!char) return char;

  const professionName = (char.profession || char.role || '').trim();
  const catalogEntry = professionName ? findProfessionCatalogEntry(professionName) : undefined;
  const existingProg = char.professionProgress;
  const existingComps = char.professionCompetencies;

  // Resolve profession field
  let profField = char.professionField;
  if (!profField && catalogEntry) {
    profField = catalogEntry.fieldId;
  }

  // Resolve experience
  let profExp: ProfessionExperience = char.professionExperience || { years: 0, months: 0, days: 0 };
  if (!char.professionExperience && char.professionExperienceText) {
    const yrMatch = char.professionExperienceText.match(/(\d+)\s*(?:jahr|jahre|yr|yrs|year|years)/i);
    const moMatch = char.professionExperienceText.match(/(\d+)\s*(?:monat|monate|mo|month|months)/i);
    if (yrMatch || moMatch) {
      profExp = {
        years: yrMatch ? parseInt(yrMatch[1], 10) : 0,
        months: moMatch ? parseInt(moMatch[1], 10) : 0,
        days: 0
      };
    }
  }

  let newProg = existingProg;
  if (!newProg && professionName) {
    newProg = {
      professionName,
      fieldId: profField,
      specialization: char.professionSpecialization,
      rank: char.professionRank,
      level: char.professionLevel || 'Anfänger',
      overallProficiency: char.professionProficiencyScore || 0,
      experiencePoints: char.professionExperiencePoints || 0,
      experienceYears: profExp.years,
      experienceMonths: profExp.months,
      experienceDays: profExp.days,
      experienceText: char.professionExperienceText || formatProfessionExperience(profExp),
      promotionConditions: char.professionPromotionConditions ? [char.professionPromotionConditions] : []
    };
  } else if (newProg) {
    newProg = {
      ...newProg,
      fieldId: newProg.fieldId || profField,
      specialization: newProg.specialization || char.professionSpecialization,
      rank: newProg.rank || char.professionRank,
      experienceYears: newProg.experienceYears ?? profExp.years,
      experienceMonths: newProg.experienceMonths ?? profExp.months,
      experienceDays: newProg.experienceDays ?? profExp.days,
      experienceText: newProg.experienceText || formatProfessionExperience(profExp)
    };
  }

  let newComps = existingComps;
  if (!Array.isArray(newComps)) {
    newComps = [];
  }

  // Initialize arrays safely without overwriting
  const positions = Array.isArray(char.positions) ? [...char.positions] : [];
  const socialTitles = Array.isArray(char.socialTitles) ? [...char.socialTitles] : [];
  const offices = Array.isArray(char.offices) ? [...char.offices] : [];
  const professionHistory = Array.isArray(char.professionHistory) ? [...char.professionHistory] : [];

  // Also migrate secondary professions
  const newSec = (char.secondaryProfessions || []).map(sec => {
    let secProg = sec.professionProgress;
    if (!secProg && sec.profession) {
      secProg = {
        professionName: sec.profession,
        level: sec.professionLevel || 'Anfänger',
        overallProficiency: sec.proficiencyScore || 0,
        experiencePoints: sec.experiencePoints || 0,
        experienceText: sec.experienceText || '',
        promotionConditions: sec.promotionConditions ? [sec.promotionConditions] : []
      };
    }
    return {
      ...sec,
      professionProgress: secProg,
      professionCompetencies: Array.isArray(sec.professionCompetencies) ? sec.professionCompetencies : []
    };
  });

  return {
    ...char,
    professionField: profField,
    professionSpecialization: char.professionSpecialization || newProg?.specialization,
    professionRank: char.professionRank || newProg?.rank,
    professionExperience: profExp,
    positions,
    socialTitles,
    offices,
    professionHistory,
    professionProgress: newProg,
    professionCompetencies: newComps,
    secondaryProfessions: newSec
  };
}

/**
 * Extracts relevant competencies for the Gemini prompt context based on the current scene/action.
 * Keeps context small, focused, and free of unnecessary noise.
 */
export function getRelevantCompetenciesForContext(
  char: Character,
  sceneKeywords = '',
  limit = 7
): {
  professionSummary: string;
  competenciesText: string;
} {
  const norm = migrateLegacyProfessionData(char);
  const prog = norm.professionProgress;
  const comps = norm.professionCompetencies || [];

  const profName = prog?.professionName || norm.profession || norm.role || 'Kein Beruf';
  const profLevel = norm.professionRank || prog?.rank || prog?.level || norm.professionLevel || 'Keine Stufe';
  const profScore = prog?.overallProficiency ?? norm.professionProficiencyScore ?? 0;
  const expStr = formatProfessionExperience(norm.professionExperience);

  const professionSummary = `${profName}${norm.professionSpecialization ? ` (${norm.professionSpecialization})` : ''} - Rang: ${profLevel} | Erfahrung: ${expStr} | Gesamtbeherrschung: ${profScore}%`;

  if (comps.length === 0) {
    return {
      professionSummary,
      competenciesText: 'Keine individuellen Kompetenzen hinterlegt'
    };
  }

  const kw = (sceneKeywords || '').toLowerCase();
  
  // Score competencies based on relevance to scene keywords
  const scored = comps.map(c => {
    let score = 0;
    const nameLower = c.name.toLowerCase();
    const descLower = (c.description || '').toLowerCase();

    if (kw.includes(nameLower) || nameLower.split(' ').some(w => w.length > 3 && kw.includes(w))) {
      score += 10;
    }
    if (descLower.split(' ').some(w => w.length > 4 && kw.includes(w))) {
      score += 4;
    }
    // High proficiency skills are also defining characteristics
    score += c.proficiency * 0.05;

    return { comp: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, limit).map(s => s.comp);

  const lines = top.map(c => {
    return `- ${c.name} [${c.category}]: ${c.proficiency}% | Talent: ${c.talent}/5 (XP: ${c.experiencePoints})`;
  });

  return {
    professionSummary,
    competenciesText: lines.join('\n')
  };
}

/**
 * Formats a character's professions and competencies for the Story AI prompt context.
 * Clean, structured, neutral, no emojis.
 */
export function formatCharacterProfessionsForAI(char: Character): string {
  if (!char) return 'Keine Berufsangaben';

  const migrated = migrateLegacyProfessionData(char);
  const prog = migrated.professionProgress;
  const comps = migrated.professionCompetencies || [];
  const secondary = migrated.secondaryProfessions || [];
  const positions = migrated.positions || [];
  const titles = migrated.socialTitles || [];
  const offices = migrated.offices || [];

  const mainName = prog?.professionName || migrated.profession || 'Kein Hauptberuf';
  const mainField = migrated.professionField ? ` [Feld: ${migrated.professionField}]` : '';
  const mainSpec = migrated.professionSpecialization ? ` [Spezialisierung: ${migrated.professionSpecialization}]` : '';
  const mainRank = migrated.professionRank || prog?.rank || prog?.level || migrated.professionLevel || 'Kein Rang';
  const expStr = formatProfessionExperience(migrated.professionExperience);
  const mainScore = prog?.overallProficiency ?? migrated.professionProficiencyScore ?? 0;
  const mainXp = prog?.experiencePoints ?? 0;

  const lines: string[] = [];
  lines.push(`- Hauptberuf: ${mainName}${mainField}${mainSpec} (Rang: ${mainRank}, Erfahrung: ${expStr}, Gesamtbeherrschung: ${mainScore}%, XP: ${mainXp})`);

  if (comps.length > 0) {
    lines.push(`  * Handwerkliche & Fachliche Kompetenzen:`);
    const categories: Array<'Grundlage' | 'Fortgeschritten' | 'Spezialisierung' | 'Meisterschaft'> = [
      'Grundlage',
      'Fortgeschritten',
      'Spezialisierung',
      'Meisterschaft'
    ];

    categories.forEach(cat => {
      const catComps = comps.filter(c => c.category === cat);
      if (catComps.length > 0) {
        const compSummaries = catComps.map(c => 
          `${c.name} (${c.proficiency}%, Talent: ${c.talent}/5, XP: ${c.experiencePoints}${c.notes ? `, Anmerkung: ${c.notes}` : ''})`
        );
        lines.push(`    - ${cat}: ${compSummaries.join('; ')}`);
      }
    });
  } else {
    lines.push(`  * Kompetenzen: Keine spezifischen Kompetenzen hinterlegt`);
  }

  // Current Positions (separated from professions & competencies)
  if (positions.length > 0) {
    lines.push(`  * Aktuelle Positionen & Rollen (unabhängig von handwerklichen Kompetenzen):`);
    positions.forEach(p => {
      const method = p.acquisitionMethod ? ` (Erworben durch: ${p.acquisitionMethod})` : '';
      const recognized = p.recognizedBy && p.recognizedBy.length > 0 ? ` [Anerkannt von: ${p.recognizedBy.join(', ')}]` : '';
      const reason = p.reason ? ` - Kontext: ${p.reason}` : '';
      lines.push(`    - ${p.title}${method}${recognized}${reason}`);
    });
  }

  // Social Titles & Offices (separated from craft competencies)
  if (titles.length > 0 || offices.length > 0) {
    lines.push(`  * Gesellschaftlicher Status & Ämter (verleihen keine automatischen Fertigkeiten):`);
    titles.forEach(t => {
      const type = t.titleType ? ` (${t.titleType})` : '';
      const granted = t.grantedBy ? ` [Verliehen von: ${t.grantedBy}]` : '';
      lines.push(`    - Adelstitel/Ehrentitel: ${t.title}${type}${granted}`);
    });
    offices.forEach(o => {
      const inst = o.institution ? ` (${o.institution})` : '';
      const app = o.appointedBy ? ` [Ernannt von: ${o.appointedBy}]` : '';
      lines.push(`    - Amt: ${o.name}${inst}${app}`);
    });
  }

  if (secondary.length > 0) {
    lines.push(`  * Nebenberufe:`);
    secondary.forEach(s => {
      const sProf = s.profession || (s as any).professionName || 'Unbenannt';
      const sLvl = s.professionLevel || (s as any).level || 'Anfänger';
      const sScore = s.proficiencyScore ?? 0;
      const sDesc = s.description ? ` - ${s.description}` : '';
      lines.push(`    - ${sProf} (${sLvl}, Beherrschung: ${sScore}%)${sDesc}`);
    });
  }

  return lines.join('\n');
}

