import { ProfessionCompetency, EconomyRoleTalent } from '../../types';
import { getFieldIdForJob, JOB_CATEGORIES } from '../jobPresets';
import { 
  findProfessionCatalogEntry, 
  getCatalogCompetenciesForProfession,
  getProfessionFieldDisplayName 
} from '../../lib/professionCompetencies';
import { getDutiesForProfessionAndLevel } from '../professionDuties';

export interface BranchInfo {
  fieldId: string;
  fieldName: string;
  branchName: string;
  defaultRank: string;
  defaultLevel: string;
  suggestedDuties: string[];
  suggestedCompetencies: ProfessionCompetency[];
  suggestedTalents: EconomyRoleTalent[];
  defaultExperienceYears: number;
  defaultPracticeHours: number;
  defaultXp: number;
  defaultProgressPercent: number;
}

// Tailored talents & gifts per profession branch / archetype
export function getTalentsForJobAndBranch(roleTitle: string, branchName?: string): EconomyRoleTalent[] {
  const lower = (roleTitle + ' ' + (branchName || '')).toLowerCase();

  // 1. Gastronomie & Beherbergung / Wirt / Service
  if (/wirt|gast|herberg|schank|tresen|saal|maid|kellner|bedienung|barkeep/i.test(lower)) {
    return [
      { name: 'Gastfreundschaft & Gästebetreuung', score: 4, description: 'Echtes Gespür für das Wohlbefinden und die Wünsche der Gäste.' },
      { name: 'Menschenkenntnis & Verhandlungsführung', score: 4, description: 'Schnelles Einschätzen von Absichten, Launen und Zahlungsbereitschaft.' },
      { name: 'Trinkfestigkeit & Belastbarkeit', score: 3, description: 'Standfestigkeit auch bei langen Nächten und heiklen Gelagen.' },
      { name: 'Gedächtnis für Gesichter & Namen', score: 4, description: 'Wiedererkennen von Stammgästen und deren bevorzugten Speisen & Getränken.' },
      { name: 'Konfliktschlichtung & Hausrecht', score: 3, description: 'Beruhigen erregter Gemüter vor dem ersten Faustschlag.' }
    ];
  }

  // 2. Küche & Kochen / Backen / Brauen
  if (/koch|köchin|küch|bäcker|konditor|brau|braten|speis|fleisch|metzg/i.test(lower)) {
    return [
      { name: 'Feiner Geschmacks- & Geruchssinn', score: 4, description: 'Präzises Abschmecken und Erkennen subtilster Kräuter und Nuancen.' },
      { name: 'Rezeptur- & Gewürzgedächtnis', score: 4, description: 'Sicheres Abrufen traditioneller und regionaler Zubereitungsweisen.' },
      { name: 'Hitzebeständigkeit & Schnitttempo', score: 3, description: 'Sicheres, schnelles Arbeiten an offener Glut und messerscharfen Klingen.' },
      { name: 'Vorratswirtschaft & Frischeprüfung', score: 4, description: 'Zuverlässiges Erkennen von Reifezustand und Verderblichkeit der Vorräte.' },
      { name: 'Timing & Menükoordination', score: 3, description: 'Pünktliches zeitgleiches Servieren mehrgängiger Mahlzeiten.' }
    ];
  }

  // 3. Schmiede / Metall / Feinhandwerk
  if (/schmied|metall|amboss|klinge|rüst|huf|feinmechanik|schlosser|goldschmied/i.test(lower)) {
    return [
      { name: 'Kraft & Ausdauer am Amboss', score: 4, description: 'Ermüdungsfreies Führen schwerer Zuschlag- und Formhämmer.' },
      { name: 'Glut- & Temperaturgespür', score: 4, description: 'Exaktes Bestimmen der Hitzegrade an der Färbung des glühenden Werkstücks.' },
      { name: 'Formgefühl & Schlagpräzision', score: 3, description: 'Gezielte Materialverdrängung mit minimalem Nachbearbeitungsaufwand.' },
      { name: 'Material- & Härtewissen', score: 4, description: 'Kombinieren verschiedener Eisen- und Stahlsorten zum perfekten Verbund.' },
      { name: 'Werkzeugdisziplin & Pflege', score: 3, description: 'Ständige Einsatzbereitschaft aller Zangen, Hämmer und Meißel.' }
    ];
  }

  // 4. Sicherheit / Wachdienst / Tor / Schutz
  if (/wache|wächter|türsteher|posten|patrouille|sicherheit|tor|schütze|garde/i.test(lower)) {
    return [
      { name: 'Wachsamkeit & Gefahreninstinkt', score: 4, description: 'Sofortiges Bemerken verdächtiger Bewegungen und verdeckter Waffen.' },
      { name: 'Körperliche Standfestigkeit', score: 4, description: 'Unnachgiebiges Beharren auf Einlasskriterien und Hausordnung.' },
      { name: 'Deeskalation & Einschüchterung', score: 3, description: 'Autoritäres Auftreten zur Verhinderung von Handgreiflichkeiten.' },
      { name: 'Reflexe & Nahkampfroutine', score: 3, description: 'Schnelles Entwaffnen und Fixieren aggressiver Ruhestörer.' },
      { name: 'Streifendisziplin', score: 3, description: 'Gewissenhaftes Abschreiten der Kontrollwege bei jedem Wetter.' }
    ];
  }

  // 5. Verwaltung / Handel / Rezeption / Buchhaltung
  if (/verwalter|rezeption|empfang|buchhalter|kaufmann|händler|schreiber|kasse|kontor/i.test(lower)) {
    return [
      { name: 'Kaufmännische Rechenschärfe', score: 4, description: 'Fehlerfreies Kopfrechnen von Rabatten, Zöllen und Wechselkursen.' },
      { name: 'Verhandlungsgeschick & Feilschen', score: 4, description: 'Erzielen optimaler Einkaufspreise bei Händlern und Zulieferern.' },
      { name: 'Münz- & Siegelsicherheit', score: 4, description: 'Erkennen von Falschgeld, beschnittenen Silbermünzen und gefälschten Siegeln.' },
      { name: 'Ordnungs- & Registratursinn', score: 3, description: 'Strukturierte Buchführung und Auffinden aller Verträge in Sekunden.' },
      { name: 'Diplomatisches Auftreten', score: 3, description: 'Höflicher, respektvoller Tonfall auch bei anspruchsvollen Kunden.' }
    ];
  }

  // 6. Haushalt / Zimmerservice / Stall / Hilfskraft
  if (/zimmer|hausdame|magd|knecht|diener|stall|bursche|reinigung|gehilfe/i.test(lower)) {
    return [
      { name: 'Sinn für Sauberkeit & Gründlichkeit', score: 4, description: 'Aufspüren von Staub, Ungeziefer und Schmutz in jeder Ecke.' },
      { name: 'Diskretion & Zuverlässigkeit', score: 4, description: 'Verschwiegenheit über die privaten Belange und Gespräche der Gäste.' },
      { name: 'Körperliche Zähigkeit & Fleiß', score: 4, description: 'Unermüdlicher Einsatz bei schweren Trage- und Reinigungsarbeiten.' },
      { name: 'Tiergespür & Pflegegeschick', score: 3, description: 'Ruhiger, vertrauensbildender Umgang mit Reit- und Zugtieren.' },
      { name: 'Umsichtige Zuarbeit', score: 3, description: 'Erledigen wichtiger Handgriffe, bevor überhaupt danach gefragt wird.' }
    ];
  }

  // Universal Fallback Talents
  return [
    { name: 'Fachliche Sorgfalt & Gewissenhaftigkeit', score: 3, description: 'Präzise Ausführung der berufsüblichen Arbeitsschritte.' },
    { name: 'Auffassungsgabe & Lernwille', score: 3, description: 'Schnelles Begreifen neuer Arbeitsmethoden und Anweisungen.' },
    { name: 'Belastbarkeit im Alltag', score: 3, description: 'Konstante Leistung auch bei hoher Arbeitslast oder Schichtbetrieb.' },
    { name: 'Kollegiale Zusammenarbeit', score: 3, description: 'Reibungslose Abstimmung mit anderen Angestellten im Betrieb.' }
  ];
}

// Detect branch name and professional field
export function detectBranchForRole(roleTitle: string, holdingType?: string): { fieldId: string; fieldName: string; branchName: string } {
  const cleanTitle = (roleTitle || '').trim();
  const lower = cleanTitle.toLowerCase();

  // Try catalog first
  const catalogEntry = findProfessionCatalogEntry(cleanTitle);
  if (catalogEntry) {
    return {
      fieldId: catalogEntry.fieldId,
      fieldName: catalogEntry.fieldName,
      branchName: catalogEntry.specializations?.[0] || catalogEntry.professionName
    };
  }

  // Try field mapping from jobPresets
  const detectedFieldId = getFieldIdForJob(cleanTitle);
  if (detectedFieldId) {
    const jobCat = JOB_CATEGORIES.find(c => c.fieldId === detectedFieldId);
    const fieldName = jobCat?.category || getProfessionFieldDisplayName(detectedFieldId);
    
    // Derive sensible branch
    let branchName = 'Fachbereich ' + fieldName;
    if (/wirt|herberg|schank|kellner|maid/i.test(lower)) {
      branchName = 'Gastronomie & Beherbergung';
    } else if (/koch|küch|speis|essen|menü/i.test(lower)) {
      branchName = 'Küche & Verköstigung';
    } else if (/bäcker|back/i.test(lower)) {
      branchName = 'Bäckerei & Teigwaren';
    } else if (/brauer|brau|bier/i.test(lower)) {
      branchName = 'Brauerei & Kellerei';
    } else if (/metzger|fleisch/i.test(lower)) {
      branchName = 'Fleischerei & Räucherei';
    } else if (/wache|wächter|türsteher|tor/i.test(lower)) {
      branchName = 'Objektschutz & Wachdienst';
    } else if (/schmied|amboss|metall/i.test(lower)) {
      branchName = 'Metallverarbeitung & Schmiede';
    } else if (/schreiner|tischler|holz/i.test(lower)) {
      branchName = 'Holzhandwerk & Schreinerei';
    } else if (/zimmer|magd|diener|knecht|stall/i.test(lower)) {
      branchName = 'Hauswirtschaft & Gästeservice';
    } else if (/buchhalter|schreiber|kaufmann|rezeption/i.test(lower)) {
      branchName = 'Betriebsführung & Handel';
    }

    return {
      fieldId: detectedFieldId,
      fieldName,
      branchName
    };
  }

  // Holding type context fallback
  const hType = (holdingType || '').toLowerCase();
  if (hType.includes('taverne') || hType.includes('gasthaus') || hType.includes('herberge')) {
    if (/wache|türsteher|sicherheit/i.test(lower)) {
      return { fieldId: 'militaer', fieldName: 'Militär & Sicherheit', branchName: 'Objektschutz & Wachdienst' };
    }
    if (/zimmer|magd|knecht|diener|stall/i.test(lower)) {
      return { fieldId: 'dienstleistung', fieldName: 'Dienstleistung', branchName: 'Hauswirtschaft & Gästeservice' };
    }
    if (/koch|küch/i.test(lower)) {
      return { fieldId: 'lebensmittel_versorgung', fieldName: 'Lebensmittel & Versorgung', branchName: 'Küche & Verköstigung' };
    }
    return { fieldId: 'lebensmittel_versorgung', fieldName: 'Lebensmittel & Versorgung', branchName: 'Gastronomie & Beherbergung' };
  }

  if (hType.includes('schmiede') || hType.includes('werkstatt')) {
    return { fieldId: 'metall_feinhandwerk', fieldName: 'Metall & Feinhandwerk', branchName: 'Metallverarbeitung & Schmiede' };
  }

  if (hType.includes('bauernhof') || hType.includes('muehle') || hType.includes('gutshof')) {
    return { fieldId: 'natur_landwirtschaft', fieldName: 'Natur & Landwirtschaft', branchName: 'Agrarwirtschaft & Tierhaltung' };
  }

  if (hType.includes('kontor') || hType.includes('laden') || hType.includes('gilde')) {
    return { fieldId: 'handel_wirtschaft', fieldName: 'Handel & Wirtschaft', branchName: 'Kaufmannstum & Güterhandel' };
  }

  return {
    fieldId: 'dienstleistung',
    fieldName: 'Dienstleistung & Handwerk',
    branchName: 'Gewerblicher Betrieb'
  };
}

// Build complete initial branch info for a role
export function getBranchInfoForRole(roleTitle: string, holdingType?: string, currentLevel?: string): BranchInfo {
  const { fieldId, fieldName, branchName } = detectBranchForRole(roleTitle, holdingType);
  const lower = roleTitle.toLowerCase();

  const isLeader = /direktor|meister|chef|geschäftsführer|haupt|leiter|wirt|vater/i.test(lower);
  const isLehrling = /hilfe|bursche|lehrling|novize|junge|anwärter/i.test(lower);

  const defaultLevel = currentLevel || (isLeader ? 'Meister / Führungskraft' : isLehrling ? 'Lehrling / Auszubildender' : 'Geselle / Fortgeschritten');
  const defaultRank = isLeader ? 'Meister' : isLehrling ? 'Lehrling' : 'Geselle';

  // Duties
  const duties = getDutiesForProfessionAndLevel(roleTitle, defaultLevel);

  // Competencies
  const rawDefs = getCatalogCompetenciesForProfession(roleTitle);
  let suggestedCompetencies: ProfessionCompetency[] = [];

  if (rawDefs && rawDefs.length > 0) {
    suggestedCompetencies = rawDefs.map(def => ({
      id: def.id,
      name: def.name,
      category: def.category,
      proficiency: isLeader ? 85 : isLehrling ? 35 : 60,
      experiencePoints: isLeader ? 1500 : isLehrling ? 150 : 600,
      talent: 3,
      description: def.description
    }));
  } else {
    const cleanId = (roleTitle || 'rolle').toLowerCase().replace(/[^a-z0-9]/g, '_');
    suggestedCompetencies = [
      {
        id: `${cleanId}_grundlagen`,
        name: `Grundlagen: ${roleTitle}`,
        category: 'Grundlage',
        proficiency: isLeader ? 85 : isLehrling ? 30 : 60,
        experiencePoints: isLeader ? 1200 : isLehrling ? 120 : 500,
        talent: 3,
        description: `Beherrschung der täglichen Standard-Handgriffe und Werkzeuge im Bereich ${branchName}.`
      },
      {
        id: `${cleanId}_sicherheit`,
        name: `Betriebsordnung & Sorgfalt`,
        category: 'Grundlage',
        proficiency: isLeader ? 90 : isLehrling ? 40 : 70,
        experiencePoints: isLeader ? 1400 : isLehrling ? 200 : 700,
        talent: 3,
        description: `Einhaltung von Sicherheits-, Qualitäts- und Hygienevorschriften am Arbeitsplatz.`
      },
      {
        id: `${cleanId}_praxis`,
        name: `Praktische Ausführung (${branchName})`,
        category: 'Fortgeschritten',
        proficiency: isLeader ? 80 : isLehrling ? 20 : 55,
        experiencePoints: isLeader ? 1100 : isLehrling ? 100 : 450,
        talent: 3,
        description: `Selbstständige und gewissenhafte Umsetzung anspruchsvoller Arbeitsaufträge.`
      },
      {
        id: `${cleanId}_effizienz`,
        name: `Effizienz & Koordination`,
        category: 'Spezialisierung',
        proficiency: isLeader ? 75 : isLehrling ? 15 : 45,
        experiencePoints: isLeader ? 900 : isLehrling ? 50 : 350,
        talent: 3,
        description: `Optimierung von Arbeitszeit, Materialverbrauch und Zusammenarbeit mit Kollegen.`
      }
    ];
  }

  // Talents
  const suggestedTalents = getTalentsForJobAndBranch(roleTitle, branchName);

  return {
    fieldId,
    fieldName,
    branchName,
    defaultRank,
    defaultLevel,
    suggestedDuties: duties.length > 0 ? duties : ['Tagesaufgaben im Betrieb wahrnehmen', 'Zuarbeit und Unterstützung des Betriebsablaufs'],
    suggestedCompetencies,
    suggestedTalents,
    defaultExperienceYears: isLeader ? 8 : isLehrling ? 1 : 4,
    defaultPracticeHours: isLeader ? 2400 : isLehrling ? 250 : 950,
    defaultXp: isLeader ? 3500 : isLehrling ? 450 : 1500,
    defaultProgressPercent: isLeader ? 85 : isLehrling ? 25 : 55
  };
}
