import fs from 'fs';

const filePath = 'lib/professionProgressionData.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newProfessions = `
  // ===========================================================================
  // NEUE BERUFE (Bauwesen, Textil, Transport, Nahrung)
  // ===========================================================================
  steinmetz: {
    branchKey: 'steinmetz',
    branchName: 'Steinmetz & Baumeister',
    category: 'Bau & Handwerk',
    description: 'Bearbeitung von Stein, Errichtung von Bauwerken, Festungen und Stadtplanung.',
    ranks: [
      {
        idSuffix: 'bauarbeiter',
        name: 'Bauarbeiter',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Schwerstarbeit',
        description: 'Schleppen von Steinen, Ausschachten von Kanälen und Pflastern von Straßen.',
        suggestedCompetencies: ['Steineschleppen', 'Straßenbau', 'Kanalbau', 'Mörtel mischen'],
        possibleRanks: ['Bauarbeiter', 'Straßenbauer', 'Kanalbauer'],
        nextRankName: 'Steinmetz'
      },
      {
        idSuffix: 'steinmetz',
        name: 'Steinmetz & Maurer',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Handwerker',
        description: 'Behauen von Quadern, Hochziehen von Mauern und Dacharbeiten.',
        suggestedCompetencies: ['Steinbearbeitung', 'Maurerhandwerk', 'Dachdecken', 'Brunnenbau'],
        possibleRanks: ['Steinmetz', 'Maurer', 'Dachdecker', 'Brunnenbauer'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Bauarbeiter',
        nextRankName: 'Baumeister'
      },
      {
        idSuffix: 'festungsbauer',
        name: 'Festungs- & Minenbauer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Wehrarchitektur & Untertage',
        description: 'Konstruktion von Festungsanlagen, Schanzen und das Treiben von Stollen und Minen.',
        suggestedCompetencies: ['Wehrbauten', 'Stollenbau', 'Sprengstoffkunde', 'Erdwerke'],
        possibleRanks: ['Festungsbauer', 'Minenbauer', 'Schanzmeister'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Steinmetz & Maurer',
        nextRankName: 'Baumeister'
      },
      {
        idSuffix: 'architekt',
        name: 'Architekt & Bauingenieur',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Planung & Statik',
        description: 'Planung komplexer Bauwerke, Berechnung der Statik und Landvermessung.',
        suggestedCompetencies: ['Statik', 'Bauplanung', 'Vermessungswesen', 'Architekturzeichnung'],
        possibleRanks: ['Architekt', 'Bauingenieur', 'Vermesser', 'Bauplaner'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Steinmetz & Maurer',
        nextRankName: 'Baumeister'
      },
      {
        idSuffix: 'baumeister',
        name: 'Baumeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Gildenmeister',
        description: 'Oberste Leitung großer Kathedralenbauten und herrschaftlicher Residenzen.',
        suggestedCompetencies: ['Bauleitung', 'Gildenführung', 'Stadtplanung', 'Materialwirtschaft'],
        possibleRanks: ['Baumeister', 'Oberbaurat', 'Gildenmeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Architekt & Bauingenieur'
      }
    ]
  },
  schneider: {
    branchKey: 'schneider',
    branchName: 'Schneider & Weber',
    category: 'Textil & Leder',
    description: 'Verarbeitung von Garn, Stoffen und Pelzen zu Kleidung und Textilien.',
    ranks: [
      {
        idSuffix: 'spinner',
        name: 'Spinner & Näher',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Garn- & Nadelarbeit',
        description: 'Spinnen von Wolle zu Garn, einfache Flickarbeiten und Zuarbeit am Webstuhl.',
        suggestedCompetencies: ['Spinnen', 'Einfaches Nähen', 'Wollverarbeitung', 'Flicken'],
        possibleRanks: ['Spinner', 'Näher', 'Spuljunge'],
        nextRankName: 'Weber'
      },
      {
        idSuffix: 'weber',
        name: 'Weber & Schneider',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Textilhandwerk',
        description: 'Weben von Tuchen am Webstuhl und Schustern passgenauer Alltagskleidung.',
        suggestedCompetencies: ['Weben', 'Schnittmuster', 'Maßnehmen', 'Gewandfertigung'],
        possibleRanks: ['Weber', 'Schneider', 'Gewandschneider'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Spinner & Näher',
        nextRankName: 'Tuchmacher'
      },
      {
        idSuffix: 'tuchmacher',
        name: 'Tuchmacher & Färber',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Edelstoffe & Farbe',
        description: 'Herstellung von feinen Tuche, Seidenweberei und das meisterhafte Färben von Stoffen.',
        suggestedCompetencies: ['Tuchfärben', 'Seidenweberei', 'Farbenchemie', 'Stoffveredelung'],
        possibleRanks: ['Tuchmacher', 'Färber', 'Seidenweber'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Weber & Schneider',
        nextRankName: 'Meisterschneider'
      },
      {
        idSuffix: 'kuerschner',
        name: 'Kürschner & Hutmacher',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Pelz & Kopfbedeckung',
        description: 'Verarbeitung edler Pelze zu Mänteln und Fertigung von feinen Hüten und Kappen.',
        suggestedCompetencies: ['Pelzverarbeitung', 'Hutformung', 'Lederzier', 'Fellkunde'],
        possibleRanks: ['Kürschner', 'Hutmacher', 'Pelzhändler'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Weber & Schneider',
        nextRankName: 'Meisterschneider'
      },
      {
        idSuffix: 'meisterschneider',
        name: 'Meisterschneider',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Hofausstatter',
        description: 'Leiter der Zunft, Ausstatter des Hofadels und Schöpfer neuer Modetrends.',
        suggestedCompetencies: ['Hofmode', 'Zunftmeister', 'Luxusstoffe', 'Prunkgewänder'],
        possibleRanks: ['Meisterschneider', 'Hofschneider', 'Zunftmeister'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Tuchmacher & Färber'
      }
    ]
  },
  lederhandwerker: {
    branchKey: 'lederhandwerker',
    branchName: 'Lederhandwerker',
    category: 'Textil & Leder',
    description: 'Verarbeitung von Leder zu Schuhen, Sätteln, Rüstungen und Riemen.',
    ranks: [
      {
        idSuffix: 'gerbergehilfe',
        name: 'Gerbergehilfe',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Lederaufbereitung',
        description: 'Schaben von Häuten, Einweichen in Lohe und schmutzige Gerberarbeiten.',
        suggestedCompetencies: ['Häuten', 'Ledergerbung', 'Fettung', 'Tierkunde'],
        possibleRanks: ['Gerbergehilfe', 'Häuteschaber', 'Lohbursche'],
        nextRankName: 'Lederhandwerker'
      },
      {
        idSuffix: 'lederhandwerker',
        name: 'Lederhandwerker & Schuhmacher',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Gebrauchsleder',
        description: 'Herstellung von robusten Schuhen, Stiefeln, Taschen und Alltagslederwaren.',
        suggestedCompetencies: ['Schuhmacherei', 'Lederzuschnitt', 'Punziertechnik', 'Ledernaht'],
        possibleRanks: ['Lederhandwerker', 'Schuhmacher', 'Taschner'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Gerbergehilfe',
        nextRankName: 'Sattler'
      },
      {
        idSuffix: 'sattler',
        name: 'Sattler & Riemer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Reitbedarf & Schweres Leder',
        description: 'Fertigung von Sätteln, Zaumzeug, schweren Lederriemen und Kutschenbedarf.',
        suggestedCompetencies: ['Sattlerei', 'Riemenfertigung', 'Pferdegeschirr', 'Zaumzeug'],
        possibleRanks: ['Sattler', 'Riemer', 'Geschirrmacher'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Lederhandwerker & Schuhmacher',
        nextRankName: 'Lederermeister'
      },
      {
        idSuffix: 'lederrustungsmacher',
        name: 'Lederrüstungsmacher',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Gefechtsleder & Harnische',
        description: 'Fertigung von gehärteten Lederpanzern, Brigantinen, Waffengurten und Scheiden.',
        suggestedCompetencies: ['Lederhärtung', 'Schuppenpanzer', 'Waffenscheiden', 'Nieten & Beschläge'],
        possibleRanks: ['Lederrüstungsmacher', 'Schwertfegergehilfe', 'Harnischmacher'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Lederhandwerker & Schuhmacher',
        nextRankName: 'Lederermeister'
      },
      {
        idSuffix: 'lederermeister',
        name: 'Lederermeister',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Meister des Leders',
        description: 'Führt große Manufakturen für Reitbedarf, stattet Kavallerie-Regimenter aus.',
        suggestedCompetencies: ['Manufakturleitung', 'Armeelieferant', 'Prunksättel', 'Zunftrecht'],
        possibleRanks: ['Lederermeister', 'Hofsattler', 'Zunftvorsteher'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Sattler'
      }
    ]
  },
  mueller: {
    branchKey: 'mueller',
    branchName: 'Müller & Fischer',
    category: 'Nahrung & Landwirtschaft',
    description: 'Produktion von Lebensmitteln abseits des klassischen Ackerbaus, Fischerei und Bienenhaltung.',
    ranks: [
      {
        idSuffix: 'hafenarbeiter',
        name: 'Hafenarbeiter & Mühlenbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Einstieg & Schwerarbeit',
        description: 'Netze flicken, Mehlsäcke schleppen, Boote teeren und Bienenstöcke räuchern.',
        suggestedCompetencies: ['Netzeflicken', 'Kisten schleppen', 'Räuchern', 'Wassertauglichkeit'],
        possibleRanks: ['Hafenarbeiter', 'Mühlenbursche', 'Käsegehilfe'],
        nextRankName: 'Müller'
      },
      {
        idSuffix: 'mueller',
        name: 'Müller, Käser & Imker',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Nahrungsproduktion',
        description: 'Betrieb von Wind/Wassermühlen, Milchverarbeitung zu Käse oder Honigernte.',
        suggestedCompetencies: ['Mühlradbedienung', 'Käseherstellung', 'Imkerei', 'Getreidekunde'],
        possibleRanks: ['Müller', 'Käser', 'Imker'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Hafenarbeiter & Mühlenbursche',
        nextRankName: 'Fischer'
      },
      {
        idSuffix: 'fischer',
        name: 'Fischer',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Fluss- & Seefischerei',
        description: 'Fangen von Fischen und Krustentieren auf Flüssen, Seen oder hoher See.',
        suggestedCompetencies: ['Netzwerfen', 'Reusenbau', 'Seemannschaft', 'Fischkunde'],
        possibleRanks: ['Fischer', 'Hochseefischer', 'Flussfischer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Müller, Käser & Imker',
        nextRankName: 'Meisterproduzent'
      },
      {
        idSuffix: 'muehlenmeister',
        name: 'Mühlenmeister & Hoflieferant',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Großproduktion',
        description: 'Verwaltung großer Pachtmühlen, Honigweinherstellung in großen Mengen oder Großmolkereien.',
        suggestedCompetencies: ['Wirtschaftsverwaltung', 'Großmüllerei', 'Metbrauen', 'Export'],
        possibleRanks: ['Mühlenmeister', 'Großkäser', 'Meisterimker'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Müller, Käser & Imker',
        nextRankName: 'Meisterproduzent'
      },
      {
        idSuffix: 'meisterproduzent',
        name: 'Gildenmeister der Nahrungsmacher',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Zunftleitung',
        description: 'Leitung von Fischereigilden, Mühlenkartellen oder Hofpächter für Spezialgüter.',
        suggestedCompetencies: ['Gildenrecht', 'Preispolitik', 'Handelsmonopole', 'Zunftabzeichen'],
        possibleRanks: ['Mühlenherr', 'Fischereimeister', 'Hoflieferant'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Fischer'
      }
    ]
  },
  fuhrmann: {
    branchKey: 'fuhrmann',
    branchName: 'Fuhrmann & Logistik',
    category: 'Handel & Logistik',
    description: 'Transport von Waren und Personen, Kurierdienste und Fahrzeuginstandhaltung.',
    ranks: [
      {
        idSuffix: 'stallbursche',
        name: 'Stallbursche',
        tier: 'einstieg',
        rankOrder: 0,
        rankTitle: 'Pferde- & Wagenpflege',
        description: 'Ausmisten von Ställen, Striegeln von Pferden und Fetten von Wagenachsen.',
        suggestedCompetencies: ['Pferdepflege', 'Achsenfetten', 'Stallarbeit', 'Lastentragen'],
        possibleRanks: ['Stallbursche', 'Knecht', 'Pferdebetreuer'],
        nextRankName: 'Fuhrmann'
      },
      {
        idSuffix: 'fuhrmann',
        name: 'Fuhrmann & Kutscher',
        tier: 'beruf',
        rankOrder: 1,
        rankTitle: 'Warentransport',
        description: 'Lenken von Frachtwagen, Kutschen für Reisende und sichere Navigation auf Landstraßen.',
        suggestedCompetencies: ['Kutschenlenken', 'Orientierung (Land)', 'Tierheilkunde', 'Ladungssicherung'],
        possibleRanks: ['Fuhrmann', 'Kutscher', 'Gespannführer'],
        requiredExperienceYears: 1,
        prerequisiteJobName: 'Stallbursche',
        nextRankName: 'Wagenbauer'
      },
      {
        idSuffix: 'wagenbauer',
        name: 'Wagenbauer & Stellmacher',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Fahrzeugtechnik',
        description: 'Konstruktion und Reparatur von Wagenrädern, Achsen, Kutschenaufbauten und Reisewagen.',
        suggestedCompetencies: ['Radmacherei', 'Wagenkonstruktion', 'Federung', 'Holzbiegen'],
        possibleRanks: ['Wagenbauer', 'Stellmacher', 'Kutschenbauer'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Fuhrmann & Kutscher',
        nextRankName: 'Fuhrunternehmer'
      },
      {
        idSuffix: 'kurier',
        name: 'Kurier & Postbote',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Eil- & Nachrichtendienst',
        description: 'Schnelle Übermittlung von Briefen, wichtigen Depeschen und Paketen auf schnellen Pferden.',
        suggestedCompetencies: ['Reiten (schnell)', 'Geländekunde', 'Nachrichtenschutz', 'Ausdauer'],
        possibleRanks: ['Kurier', 'Postbote', 'Eilreiter'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Fuhrmann & Kutscher',
        nextRankName: 'Fuhrunternehmer'
      },
      {
        idSuffix: 'stallmeister',
        name: 'Stallmeister & Karawanenhändler',
        tier: 'spezialisierung',
        rankOrder: 2,
        rankTitle: 'Logistik & Pferdehandel',
        description: 'Organisation großer Transportzüge, Zucht und Handel mit Zug- und Reitpferden.',
        suggestedCompetencies: ['Pferdezucht', 'Karawanenführung', 'Logistik', 'Handelsrouten'],
        possibleRanks: ['Stallmeister', 'Karawanenführer', 'Pferdehändler'],
        requiredExperienceYears: 2,
        prerequisiteJobName: 'Fuhrmann & Kutscher',
        nextRankName: 'Fuhrunternehmer'
      },
      {
        idSuffix: 'fuhrunternehmer',
        name: 'Fuhrunternehmer',
        tier: 'meister',
        rankOrder: 3,
        rankTitle: 'Logistik-Imperium',
        description: 'Besitzer großer Fuhrparks, Verwalter von Postkutschennetzwerken und Großspediteur.',
        suggestedCompetencies: ['Speditionsleitung', 'Routenmonopole', 'Wagenparkverwaltung', 'Diplomatisches Reisen'],
        possibleRanks: ['Fuhrherr', 'Postmeister', 'Karawanenherr'],
        requiredExperienceYears: 4,
        prerequisiteJobName: 'Wagenbauer'
      }
    ]
  }
};
`

// Replace the closing tag of DETAILED_PROFESSION_PROGRESSIONS
content = content.replace('};', newProfessions);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Added new professions.');
