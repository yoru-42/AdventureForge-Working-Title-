import React, { useState, useMemo } from 'react';
import { 
  Adventure, 
  Character,
  EconomyHolding, 
  EconomyTask, 
  EconomyDuty
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { deriveRoleTasksFromChat } from '../services/geminiService';

interface WorkManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: Adventure;
  onUpdateAdventure: (updated: Adventure) => void;
  onSendChatMessage?: (text: string) => void;
  onSetInputText?: (text: string) => void;
}

type TabType = 'tasks' | 'duties' | 'subordinates';

interface RoleProfile {
  category: 'ruler' | 'cook' | 'innkeeper' | 'guard' | 'mage' | 'merchant' | 'artisan' | 'apprentice' | 'general';
  displayTitle: string;
  station: string;
  stationType: string;
  authorityDescription: string;
  responsibilities: string[];
  defaultDuties: { title: string; description: string; frequency: 'daily' | 'weekly' | 'shift' }[];
  defaultTasks: { title: string; description: string; priority: 'low' | 'medium' | 'high' | 'urgent'; deadline: string }[];
  quickActionSuggestions: string[];
}

const resolveRoleProfile = (player: Character, holding: EconomyHolding | null, locationName?: string): RoleProfile => {
  const combinedText = [
    player.role || '',
    player.jobTitle || '',
    player.profession || '',
    player.professionLevel || '',
    holding?.userRoleName || '',
    holding?.name || '',
    holding?.type || ''
  ].join(' ').toLowerCase();

  // 1. Ruler / Monarch / King / Queen / Lord / Count / Emperor
  if (
    combinedText.includes('könig') || 
    combinedText.includes('herrscher') || 
    combinedText.includes('monarch') || 
    combinedText.includes('kaiser') || 
    combinedText.includes('fürst') || 
    combinedText.includes('regent') || 
    combinedText.includes('graf') ||
    combinedText.includes('queen') ||
    combinedText.includes('king')
  ) {
    return {
      category: 'ruler',
      displayTitle: player.jobTitle || player.role || 'König / Herrscher des Reiches',
      station: holding?.name || (locationName ? `Thronsaal (${locationName})` : 'Königlicher Palast & Thronsaal'),
      stationType: 'Herrschaft & Reich',
      authorityDescription: 'Höchste weltliche Autorität im Herrschaftsbereich: Befehlsgewalt über die Streitkräfte, Erlass von Dekreten, Rechtsprechung und Verwaltung der Krone.',
      responsibilities: [
        'Erlass königlicher Dekrete und Durchführung von Gesetzgebungsakten',
        'Abhalten von Audienzen und Prüfung von Bittschriften der Bürger und Adligen',
        'Aufsicht über Reichsfinanzen, Steuereinnahmen und die Schatzkammer',
        'Instruktion von Kronrat, Statthaltern und militärischen Befehlshabern'
      ],
      defaultDuties: [
        {
          title: 'Morgendliche Hofaudienz & Bittsteller anhören',
          description: 'Gesandten, Bürgern und Provinzvertretern Gehör schenken und Entscheidungen treffen.',
          frequency: 'daily'
        },
        {
          title: 'Bericht des Kanzlers & Schatzmeisters prüfen',
          description: 'Laufende Ausgaben für Garnisonen, Bauwerke und Zölle kontrollieren.',
          frequency: 'daily'
        },
        {
          title: 'Wehrbereitschaft & Grenzberichte sichten',
          description: 'Militärische Meldungen über Bedrohungen, Raubzüge oder Truppenbewegungen bewerten.',
          frequency: 'weekly'
        }
      ],
      defaultTasks: [
        {
          title: 'Königliches Dekret zur Reichsordnung erlassen',
          description: 'Eine drängende Frage des Reiches durch bindenden Erlass entscheiden und verkünden.',
          priority: 'high',
          deadline: 'Vor Einbruch der Nacht'
        },
        {
          title: 'Streitfall zwischen Provinzadligen schlichten',
          description: 'Einen Grenzkonflikt oder Steuerstreit im Thronsaal verhandeln und Urteil fällen.',
          priority: 'medium',
          deadline: 'Heute'
        },
        {
          title: 'Inspektion der königlichen Garde anordnen',
          description: 'Den Hauptmann der Palastwache zur Berichterstattung und Parade antreten lassen.',
          priority: 'medium',
          deadline: 'Diese Woche'
        }
      ],
      quickActionSuggestions: [
        'Ich erlasse ein königliches Dekret und befehle die unverzügliche Umsetzung.',
        'Ich gewähre der Delegation eine Audienz im Thronsaal und höre mir ihr Anliegen an.',
        'Ich lasse den Schatzmeister rufen, um die Kassenlage genauestens prüfen zu lassen.',
        'Ich beauftrage den Hauptmann der Wache mit einer eingehenden Untersuchung.'
      ]
    };
  }

  // 2. Cook / Chef / Baker
  if (
    combinedText.includes('koch') || 
    combinedText.includes('küche') || 
    combinedText.includes('bäcker') || 
    combinedText.includes('cook') || 
    combinedText.includes('chef') ||
    combinedText.includes('gastronom')
  ) {
    return {
      category: 'cook',
      displayTitle: player.jobTitle || player.profession || 'Küchenmeister / Koch',
      station: holding?.name || 'Schlossküche & Speisesaal',
      stationType: 'Küche & Verpflegung',
      authorityDescription: 'Leitung des Küchenbereichs: Verantwortung für Qualität, Frische aller Rohstoffe, Speisenfolge, Küchenordnung und Führung der Gehilfen.',
      responsibilities: [
        'Zubereitung erstklassiger Gerichte und Ausgestaltung von Festmälern',
        'Ständige Qualitätskontrolle, Vorkosten und Frischeprüfung aller Vorräte',
        'Anleitung, Zeiteinteilung und Beaufsichtigung der Küchenhilfen und Lehrlinge',
        'Sorgsame Lagerung von Fleisch, Fisch, Gewürzen und kühlbedürftigen Waren'
      ],
      defaultDuties: [
        {
          title: 'Frühe Vorratsprüfung & Frischekontrolle',
          description: 'Zutaten im Kühlraum und Vorratskeller auf Haltbarkeit und Mängel sichten.',
          frequency: 'daily'
        },
        {
          title: 'Mise-en-Place & Einteilung der Küchenhilfen',
          description: 'Schneidearbeiten und Vorbereitungen für den Hauptservice koordinieren.',
          frequency: 'daily'
        },
        {
          title: 'Vorkosten und finale Geschmacksprüfung',
          description: 'Jede Suppe, Soße und jedes Hauptgericht vor dem Heraustragen sorgfältig abschmecken.',
          frequency: 'shift'
        }
      ],
      defaultTasks: [
        {
          title: 'Hauptgericht für den heutigen Service zubereiten',
          description: 'Spezialität des Hauses mit den vorbereiteten Zutaten kochen und abschmecken.',
          priority: 'high',
          deadline: 'Vor Beginn des Service'
        },
        {
          title: 'Zustand der Fleisch- und Gewürzlieferung prüfen',
          description: 'Neu eingetroffene Fässer und Säcke auf Frische und Gewicht kontrollieren.',
          priority: 'urgent',
          deadline: 'Sofort'
        },
        {
          title: 'Küchenburschen bei der Kesselreinigung anweisen',
          description: 'Sicherstellen, dass alle Kupferkessel und Arbeitsflächen sauber geschrubbt sind.',
          priority: 'medium',
          deadline: 'Nach dem Service'
        }
      ],
      quickActionSuggestions: [
        'Ich stelle mich an den Herd, verfeinere die Soße mit Kräutern und schmecke ab.',
        'Ich prüfe die Frische des Fleisches und sortiere verdächtige Stücke sofort aus.',
        'Ich weise den Lehrling energisch an, die Zutaten zügig bereitzustellen.',
        'Ich bereite die Anrichteteller vor und gebe das Signal zum Servieren.'
      ]
    };
  }

  // 3. Innkeeper / Tavern Owner / Barkeep
  if (
    combinedText.includes('wirt') || 
    combinedText.includes('taverne') || 
    combinedText.includes('schank') || 
    combinedText.includes('gasthof') || 
    combinedText.includes('herberg') || 
    combinedText.includes('barkeep')
  ) {
    return {
      category: 'innkeeper',
      displayTitle: player.jobTitle || player.role || 'Tavernenwirt / Schankwirt',
      station: holding?.name || 'Taverne & Schankraum',
      stationType: 'Gastbetrieb & Ausschank',
      authorityDescription: 'Leitung des Gaststättenbetriebs: Wahrung des Hausrechts und der Ordnung im Schankraum, Gästezufriedenheit, Ausschank und Kassenführung.',
      responsibilities: [
        'Leitung des Schankausschanks und persönliche Betreuung der Gäste',
        'Durchsetzung der Hausordnung und Schlichtung von Raufereien',
        'Koordination des Schankpersonals und Überwachung der Fassbestände',
        'Durchführung des Kassenabschlusses und Buchführung der Tageseinnahmen'
      ],
      defaultDuties: [
        {
          title: 'Schankraum lüften, Kamin anheizen & Tische reinigen',
          description: 'Für eine saubere und einladende Atmosphäre vor dem Eintreffen der Gäste sorgen.',
          frequency: 'daily'
        },
        {
          title: 'Fassbestände von Bier, Met und Wein kontrollieren',
          description: 'Prüfen, welche Fässer angeschlagen sind und rechtzeitig Nachschub aus dem Keller holen.',
          frequency: 'daily'
        },
        {
          title: 'Tageseinnahmen abrechnen & Kassenbuch führen',
          description: 'Münzbestand mit den Belegen abgleichen und die Einnahmen sicher verwahren.',
          frequency: 'daily'
        }
      ],
      defaultTasks: [
        {
          title: 'Neu eingetroffene Reisende im Schankraum empfangen',
          description: 'Gäste bewirten, ein Zimmer zuweisen und nach Neuigkeiten aus der Ferne lauschen.',
          priority: 'medium',
          deadline: 'Heute Abend'
        },
        {
          title: 'Ruhe im Schankraum bei hitzigem Streit wiederherstellen',
          description: 'Einen beginnenden Zwist am Ecktisch schlichten, bevor Mobiliar zu Bruch geht.',
          priority: 'urgent',
          deadline: 'Sofort'
        },
        {
          title: 'Bierlieferung für das kommende Wochenende aufgeben',
          description: 'Beim Braumeister neue Fässer ordern und die Bezahlung vereinbaren.',
          priority: 'medium',
          deadline: 'Morgen'
        }
      ],
      quickActionSuggestions: [
        'Ich trete zwischen die Streithähne, schlage auf den Tisch und mahne Hausfrieden an.',
        'Ich zapfe frischen Gerstensaft und serviere ihn dem Gast mit freundlichem Nicken.',
        'Ich zähle die Münzen in der Schatulle und trage den Tagesertrag ins Buch ein.',
        'Ich weise die Schankmagd an, den Tisch in der Ecke zügig abzuräumen.'
      ]
    };
  }

  // 4. Guard / Soldier / Knight / Mercenary / Captain
  if (
    combinedText.includes('wache') || 
    combinedText.includes('soldat') || 
    combinedText.includes('ritter') || 
    combinedText.includes('söldner') || 
    combinedText.includes('hauptmann') || 
    combinedText.includes('krieger') ||
    combinedText.includes('guard')
  ) {
    return {
      category: 'guard',
      displayTitle: player.jobTitle || player.role || 'Wachsoldat / Gardist',
      station: holding?.name || 'Wachstube & Kasernenhof',
      stationType: 'Sicherheit & Wehr',
      authorityDescription: 'Ausübung der öffentlichen Ordnungsgewalt: Sicherung von Toren und Wehrgängen, Festnahme von Delinquenten und Vollzug militärischer Befehle.',
      responsibilities: [
        'Sicherung der Tore und Überprüfung verdächtiger Personen',
        'Durchführung regelmäßiger Patrouillen in den zugewiesenen Quartieren',
        'Wartung und Einsatzbereitschaft von Rüstung, Schilden und Waffen',
        'Verfassen von Vorfallmeldungen an den diensthabenden Vorgesetzten'
      ],
      defaultDuties: [
        {
          title: 'Torwache & Einlasskontrolle',
          description: 'Reisende, Fuhrwerke und Dokumente an den Stadttoren kontrollieren.',
          frequency: 'shift'
        },
        {
          title: 'Rundgang entlang der Wehrgänge und Außenbezirke',
          description: 'Sicherheitsrelevante Punkte und dunkle Winkel auf Anomalien prüfen.',
          frequency: 'daily'
        },
        {
          title: 'Waffen- und Ausrüstungsinspektion',
          description: 'Klingen ölen, Schildbuckel prüfen und Rüstzeug instand halten.',
          frequency: 'daily'
        }
      ],
      defaultTasks: [
        {
          title: 'Verdächtige Aktivität im Hafengebiet überprüfen',
          description: 'Einer Meldung über verbotenen Warenumschlag nachgehen und Bericht erstatten.',
          priority: 'urgent',
          deadline: 'Unverzüglich'
        },
        {
          title: 'Wachbericht an den Hauptmann abliefern',
          description: 'Vorfälle der letzten Schicht zusammenfassen und im Wachbuch festhalten.',
          priority: 'medium',
          deadline: 'Dienstende'
        },
        {
          title: 'Waffenkammer nach Inventarliste prüfen',
          description: 'Speere, Armbrüste und Bolzenbestände auf Vollzähligkeit abgleichen.',
          priority: 'low',
          deadline: 'Morgen'
        }
      ],
      quickActionSuggestions: [
        'Ich ziehe die Waffe halb aus der Scheide und fordere die Papiere zur Einsicht.',
        'Ich nehme zwei Kameraden mit und sichere die Gasse systematisch ab.',
        'Ich melde mich strammstehend beim Kommandanten und erstatte Lagebericht.',
        'Ich setze mich auf die Bank und wetze die Scharte aus meiner Klinge.'
      ]
    };
  }

  // 5. Mage / Alchemist / Scholar / Healer
  if (
    combinedText.includes('magier') || 
    combinedText.includes('alchemist') || 
    combinedText.includes('gelehrter') || 
    combinedText.includes('heiler') || 
    combinedText.includes('druide') ||
    combinedText.includes('wizard') ||
    combinedText.includes('mage')
  ) {
    return {
      category: 'mage',
      displayTitle: player.jobTitle || player.role || 'Arkaner Gelehrter / Alchemist',
      station: holding?.name || 'Arkanes Laboratorium & Bibliothek',
      stationType: 'Forschung & Arkana',
      authorityDescription: 'Verantwortung für magische Sicherheit, Forschung, Rezepturen, Brauprozesse und die sachgerechte Verwahrung flüchtiger Reagenzien.',
      responsibilities: [
        'Herstellung von Elixieren, Heilsalben und alchemistischen Gemischen',
        'Überwachung und Stabilisierung von Schutzbannkreisen und Siegeln',
        'Entzifferung alter Schriften, Glyphen und magischer Vorkommnisse',
        'Gewissenhafte Lagerung seltener Essenzen und gefährlicher Substanzen'
      ],
      defaultDuties: [
        {
          title: 'Bannkreise im Laboratorium auf Schwachstellen prüfen',
          description: 'Schutzzauber erneuern, um unkontrollierte Resonanzen zu verhindern.',
          frequency: 'daily'
        },
        {
          title: 'Temperatur und Destillation der Essenzen überwachen',
          description: 'Alchemieöfen und Glaskolben auf gleichmäßiges Sieden kontrollieren.',
          frequency: 'daily'
        },
        {
          title: 'Studium magischer Folianten & Protokollierung',
          description: 'Beobachtungen und Reaktionsverläufe im Arkan-Journal festhalten.',
          frequency: 'daily'
        }
      ],
      defaultTasks: [
        {
          title: 'Dringenden Heiltrank für Verletzte brauen',
          description: 'Mondwurz und Silberblatt destillieren und zu einem wirksamen Trank verarbeiten.',
          priority: 'urgent',
          deadline: 'Sofort'
        },
        {
          title: 'Unbekanntes Artefakt einer Analyse unterziehen',
          description: 'Magische Schwingungen mit Resonanzkristallen abtasten und Risiken bestimmen.',
          priority: 'high',
          deadline: 'Heute'
        },
        {
          title: 'Zutatenbestand für Reagenzien inventarisieren',
          description: 'Prüfen, welche Kräuter und Mineralien nachbestellt werden müssen.',
          priority: 'medium',
          deadline: 'Diese Woche'
        }
      ],
      quickActionSuggestions: [
        'Ich entzünde die Flamme unter der Retorte und gebe die getrockneten Kräuter hinzu.',
        'Ich zeichne die Schutzzauber-Rune mit Kreide nach und spreche die bindende Formel.',
        'Ich schlage den ledergebundenen Folianten auf und vergleiche die Schriftzeichen.',
        'Ich untersuche das Phänomen mit meinem Resonanzstab auf arkanes Echo.'
      ]
    };
  }

  // 6. Merchant / Trader / Craftsman / Apprentice / General fallback
  const fallbackTitle = player.jobTitle || player.role || player.profession || 'Verantwortungsträger';
  return {
    category: 'general',
    displayTitle: fallbackTitle,
    station: holding?.name || (locationName ? `Dienstort (${locationName})` : 'Persönlicher Tätigkeitsbereich'),
    stationType: holding?.type || 'Persönlicher Bereich',
    authorityDescription: `Handlungsrahmen und Verantwortungsbereich als ${fallbackTitle}. Treffen von Entscheidungen, Erfüllen von Arbeitsaufträgen und Gewährleistung reibungsloser Abläufe.`,
    responsibilities: [
      'Erfüllung der übertragenen Aufgaben und gewissenhafte Pflichterfüllung',
      'Koordination der handwerklichen, logistischen oder organisatorischen Schritte',
      'Laufende Abstimmung mit Vorgesetzten, Partnern und Auftraggebern',
      'Instandhaltung der benötigten Werkzeuge, Ressourcen und Arbeitsmittel'
    ],
    defaultDuties: [
      {
        title: 'Tagesplanung & Einsatzbereitschaft herstellen',
        description: 'Aufgaben des Tages sichten, Arbeitsmittel prüfen und Prioritäten setzen.',
        frequency: 'daily'
      },
      {
        title: 'Ressourcen und Materialbestände abgleichen',
        description: 'Fehlende Gegenstände oder Verbrauchsmaterialien rechtzeitig ergänzen.',
        frequency: 'daily'
      },
      {
        title: 'Tagesabschluss & Lagebericht',
        description: 'Erledigte Arbeiten dokumentieren und Übergabe vorbereiten.',
        frequency: 'daily'
      }
    ],
    defaultTasks: [
      {
        title: 'Wichtigste Tagesaufgabe in Angriff nehmen',
        description: 'Das dringlichste Anliegen im Verantwortungsbereich zügig und sorgsam bearbeiten.',
        priority: 'high',
        deadline: 'Heute'
      },
      {
        title: 'Rücksprache mit Beteiligten halten',
        description: 'Offene Fragen zu Zuständigkeiten, Fristen oder Lieferungen klären.',
        priority: 'medium',
        deadline: 'Heute'
      },
      {
        title: 'Arbeitsplatz und Ausrüstung überprüfen',
        description: 'Sicherstellen, dass alle Gerätschaften voll funktionsfähig sind.',
        priority: 'low',
        deadline: 'Morgen'
      }
    ],
    quickActionSuggestions: [
      'Ich mache mich sofort an die Arbeit und führe die erforderlichen Schritte durch.',
      'Ich prüfe die Gegebenheiten vor Ort und bespreche das Vorgehen mit den Beteiligten.',
      'Ich verfasse eine kurze Notiz über den Stand der Dinge und lege die Werkzeuge bereit.',
      'Ich bitte um eine kurze Rückmeldung, um Missverständnisse auszuräumen.'
    ]
  };
};

export const WorkManagementModal: React.FC<WorkManagementModalProps> = ({
  isOpen,
  onClose,
  adventure,
  onUpdateAdventure,
  onSendChatMessage,
  onSetInputText
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('');

  // Active Task Action Composer (when user clicks "Handeln / Ausführen")
  const [activeActionTask, setActiveActionTask] = useState<EconomyTask | null>(null);
  const [userActionText, setUserActionText] = useState('');
  const [markAsCompletedOnExecute, setMarkAsCompletedOnExecute] = useState(true);

  // Active Duty Action Composer (when user acts on a duty)
  const [activeActionDuty, setActiveActionDuty] = useState<EconomyDuty | null>(null);

  // Quick manual task creation (neutral and unobtrusive)
  const [showQuickCreateTask, setShowQuickCreateTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<EconomyTask['priority']>('medium');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // AI Task derivation from chat
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // All holdings in world
  const holdings = adventure.world?.economyConfig?.holdings || [];

  // Determine active holding based on priority
  const activeHolding = useMemo(() => {
    if (holdings.length === 0) return null;
    if (selectedHoldingId) {
      const found = holdings.find(h => h.id === selectedHoldingId);
      if (found) return found;
    }

    const playerName = (adventure.player?.name || '').toLowerCase();

    // 1. Holding where player works directly
    const directHolding = holdings.find(h => 
      h.userRoleName || 
      h.roles?.some(r => r.isUserPosition || r.assignedToName?.toLowerCase().includes(playerName))
    );
    if (directHolding) return directHolding;

    // 2. Holding matching profession
    const playerProf = (adventure.player?.profession || '').toLowerCase();
    if (playerProf) {
      const profHolding = holdings.find(h => 
        h.type.toLowerCase().includes(playerProf) || 
        h.roles?.some(r => r.name.toLowerCase().includes(playerProf))
      );
      if (profHolding) return profHolding;
    }

    // 3. Holding owned/managed by player
    const ownedHolding = holdings.find(h => h.ownerType === 'user' || h.assignedManagerId === adventure.player?.id);
    if (ownedHolding) return ownedHolding;

    return holdings[0];
  }, [holdings, selectedHoldingId, adventure.player]);

  // Derive rich role profile
  const roleProfile = useMemo(() => {
    return resolveRoleProfile(adventure.player, activeHolding, adventure.world?.startLocationName);
  }, [adventure.player, activeHolding, adventure.world]);

  // Aggregate tasks: Combine holding tasks and player-specific tasks without duplicate IDs
  const tasks = useMemo(() => {
    const rawHoldingTasks = activeHolding?.tasks || [];
    const rawPlayerTasks = adventure.player?.tasks || [];
    
    // Combine and eliminate duplicates
    const map = new Map<string, EconomyTask>();
    rawHoldingTasks.forEach(t => map.set(t.id, t));
    rawPlayerTasks.forEach(t => map.set(t.id, t));

    const combined = Array.from(map.values());

    // If completely empty, auto-populate with role-appropriate default tasks!
    if (combined.length === 0) {
      return roleProfile.defaultTasks.map((dt, idx): EconomyTask => ({
        id: `task-init-${Date.now()}-${idx}`,
        title: dt.title,
        description: dt.description,
        status: 'pending',
        priority: dt.priority,
        deadline: dt.deadline,
        progress: 0,
        reward: '',
        assigneeName: adventure.player?.name || 'Ich',
        taskType: 'routine',
        canDelegate: true,
        generatedReason: `Rollenaufgabe: ${roleProfile.displayTitle}`
      }));
    }

    return combined;
  }, [activeHolding?.tasks, adventure.player?.tasks, roleProfile, adventure.player?.name]);

  // Aggregate duties: Combine holding duties and default role duties
  const duties = useMemo(() => {
    const holdingDuties = activeHolding?.duties || [];
    const playerDuties = adventure.player?.duties || [];

    const map = new Map<string, EconomyDuty>();
    holdingDuties.forEach(d => map.set(d.id, d));
    playerDuties.forEach(d => map.set(d.id, d));

    const combined = Array.from(map.values());
    if (combined.length === 0) {
      return roleProfile.defaultDuties.map((dd, idx) => ({
        id: `duty-init-${Date.now()}-${idx}`,
        title: dd.title,
        description: dd.description,
        frequency: dd.frequency,
        isFulfilled: false,
        assignedRoleName: roleProfile.displayTitle
      }));
    }
    return combined;
  }, [activeHolding?.duties, adventure.player?.duties, roleProfile]);

  // Subordinates / staff
  const subordinates = useMemo(() => {
    const staff = activeHolding?.roles?.filter(r => !r.isUserPosition) || [];
    const groups = activeHolding?.staffGroups || [];
    return { staff, groups };
  }, [activeHolding]);

  if (!isOpen) return null;

  // Persistence helper
  const persistChanges = (updatedTasks: EconomyTask[], updatedDuties: EconomyDuty[]) => {
    let updatedHoldings = adventure.world?.economyConfig?.holdings || [];
    if (activeHolding) {
      updatedHoldings = updatedHoldings.map(h => 
        h.id === activeHolding.id ? { ...h, tasks: updatedTasks, duties: updatedDuties } : h
      );
    }

    onUpdateAdventure({
      ...adventure,
      player: {
        ...adventure.player,
        tasks: updatedTasks,
        duties: updatedDuties
      },
      world: {
        ...adventure.world,
        economyConfig: {
          currencyName: adventure.world?.economyConfig?.currencyName || 'Goldmünzen',
          currencyIcon: adventure.world?.economyConfig?.currencyIcon || 'Münzen',
          payoutInterval: adventure.world?.economyConfig?.payoutInterval || 'weekly',
          allowPassiveIncome: adventure.world?.economyConfig?.allowPassiveIncome ?? true,
          enableRandomEvents: adventure.world?.economyConfig?.enableRandomEvents ?? true,
          holdings: updatedHoldings
        }
      }
    });
  };

  // --- Handlers ---
  const handleUpdateTaskStatus = (taskId: string, status: EconomyTask['status']) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { 
          ...t, 
          status, 
          progress: status === 'completed' ? 100 : t.progress 
        };
      }
      return t;
    });
    persistChanges(updated, duties);
  };

  const handleSaveNewQuickTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: EconomyTask = {
      id: `task-manual-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      status: 'pending',
      priority: newTaskPriority,
      deadline: newTaskDeadline.trim() || undefined,
      reward: '',
      assigneeName: adventure.player?.name || 'Ich',
      createdByName: adventure.player?.name || 'Spieler',
      taskType: 'manual',
      canDelegate: true
    };

    persistChanges([task, ...tasks], duties);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDeadline('');
    setShowQuickCreateTask(false);
    setStatusNotice('Neue Aufgabe wurde zur Liste hinzugefügt.');
  };

  // Open action formulation for a task
  const handleStartTaskAction = (task: EconomyTask) => {
    setActiveActionTask(task);
    setActiveActionDuty(null);
    setUserActionText('');
    setMarkAsCompletedOnExecute(true);
  };

  // Open action formulation for a duty
  const handleStartDutyAction = (duty: EconomyDuty) => {
    setActiveActionDuty(duty);
    setActiveActionTask(null);
    setUserActionText(`Ich nehme meine Pflicht als ${roleProfile.displayTitle} wahr: `);
  };

  // Execute formulated action: Send directly into chat
  const handleExecuteActionIntoChat = () => {
    if (!userActionText.trim()) return;

    let targetTitle = '';
    let updatedTasks = [...tasks];
    let updatedDuties = [...duties];

    if (activeActionTask) {
      targetTitle = activeActionTask.title;
      if (markAsCompletedOnExecute) {
        updatedTasks = updatedTasks.map(t => 
          t.id === activeActionTask.id ? { ...t, status: 'completed', progress: 100 } : t
        );
      } else {
        updatedTasks = updatedTasks.map(t => 
          t.id === activeActionTask.id ? { ...t, status: 'in_progress' } : t
        );
      }
    } else if (activeActionDuty) {
      targetTitle = activeActionDuty.title;
      updatedDuties = updatedDuties.map(d => 
        d.id === activeActionDuty.id ? { ...d, isFulfilled: true } : d
      );
    }

    persistChanges(updatedTasks, updatedDuties);

    // Formatted chat text containing clean roleplay context
    const cleanAction = userActionText.trim();
    const chatPayload = targetTitle 
      ? `[${activeActionTask ? 'Aufgabe' : 'Pflicht'}: ${targetTitle}] ${cleanAction}`
      : cleanAction;

    if (onSendChatMessage) {
      onSendChatMessage(chatPayload);
    }

    onClose();
  };

  // Execute formulated action: Copy into chat input field
  const handleTransferActionToInput = () => {
    if (!userActionText.trim()) return;

    let targetTitle = '';
    let updatedTasks = [...tasks];
    let updatedDuties = [...duties];

    if (activeActionTask) {
      targetTitle = activeActionTask.title;
      if (markAsCompletedOnExecute) {
        updatedTasks = updatedTasks.map(t => 
          t.id === activeActionTask.id ? { ...t, status: 'completed', progress: 100 } : t
        );
      }
    } else if (activeActionDuty) {
      targetTitle = activeActionDuty.title;
      updatedDuties = updatedDuties.map(d => 
        d.id === activeActionDuty.id ? { ...d, isFulfilled: true } : d
      );
    }

    persistChanges(updatedTasks, updatedDuties);

    const cleanAction = userActionText.trim();
    const chatPayload = targetTitle 
      ? `[${activeActionTask ? 'Aufgabe' : 'Pflicht'}: ${targetTitle}] ${cleanAction}`
      : cleanAction;

    if (onSetInputText) {
      onSetInputText(chatPayload);
    }

    onClose();
  };

  // AI: Derive new tasks from chat & recent conversation
  const handleDeriveTasksFromChat = async () => {
    setIsAiLoading(true);
    setStatusNotice(null);

    try {
      const recentChatTexts = (adventure.chatHistory || [])
        .slice(-10)
        .map(m => `${m.role === 'user' ? adventure.player.name : 'Erzähler/NPC'}: ${m.text}`);

      const derivedTasks = await deriveRoleTasksFromChat(
        adventure.player,
        roleProfile.displayTitle,
        roleProfile.station,
        recentChatTexts,
        activeHolding || undefined
      );

      if (derivedTasks.length > 0) {
        const merged = [...derivedTasks, ...tasks];
        persistChanges(merged, duties);
        setStatusNotice(`${derivedTasks.length} neue Aufgaben wurden aus dem aktuellen Spielverlauf abgeleitet.`);
      } else {
        setStatusNotice('Keine neuen offenen Aufträge im aktuellen Gesprächsverlauf festgestellt.');
      }
    } catch (err) {
      setStatusNotice('Aufgaben konnten gerade nicht abgerufen werden.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const pendingTasksCount = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const unfulfilledDutiesCount = duties.filter(d => !d.isFulfilled).length;

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'pending') return task.status === 'pending' || task.status === 'in_progress';
    if (taskFilter === 'completed') return task.status === 'completed' || task.status === 'failed';
    return true;
  });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER: ROLE & STATION CONTEXT */}
        <div className="p-4 sm:px-6 border-b border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
              <i className="fa-solid fa-list-check text-base"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wide">
                  Aufgaben & Verantwortung
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  {roleProfile.stationType}
                </span>
              </div>
              <p className="text-xs text-slate-300 flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="font-bold text-amber-400">{roleProfile.displayTitle}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{adventure.player?.name}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{roleProfile.station}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {holdings.length > 1 && (
              <select
                value={activeHolding?.id || ''}
                onChange={e => setSelectedHoldingId(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none cursor-pointer"
                title="Dienstbereich oder Betrieb auswählen"
              >
                {holdings.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.type})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Schließen"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* ROLE PROFILE BANNER: PERSONALIZED RESPONSIBILITY SUMMARY */}
        <div className="bg-slate-950/40 border-b border-slate-800/80 px-4 sm:px-6 py-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  Verantwortungsbereich & Amt
                </span>
              </div>
              <p className="text-slate-300 text-[11.5px] leading-relaxed">
                {roleProfile.authorityDescription}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isAiLoading}
                onClick={handleDeriveTasksFromChat}
                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                title="Prüft den bisherigen Gesprächsverlauf und ermittelt neue Aufgaben"
              >
                <i className={`fa-solid ${isAiLoading ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'} text-amber-400 text-xs`}></i>
                <span>Aufgaben aus Spielverlauf ableiten</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQuickCreateTask(!showQuickCreateTask)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Eigene Aufgabe formulieren"
              >
                <i className="fa-solid fa-plus text-xs text-slate-400"></i>
                <span>Neue Aufgabe</span>
              </button>
            </div>
          </div>
        </div>

        {/* STATUS NOTIFICATION BANNER */}
        {statusNotice && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-300 animate-in fade-in duration-100">
            <span>{statusNotice}</span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="text-amber-400 hover:text-white font-bold ml-3 cursor-pointer"
            >
              Ausblenden
            </button>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950/30 px-4 sm:px-6 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveTab('tasks');
              setActiveActionTask(null);
              setActiveActionDuty(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Aufgaben & Handlungen</span>
            {pendingTasksCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('duties');
              setActiveActionTask(null);
              setActiveActionDuty(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'duties'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Rollenpflichten & Routinen</span>
            {unfulfilledDutiesCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {unfulfilledDutiesCount}
              </span>
            )}
          </button>

          {(subordinates.staff.length > 0 || subordinates.groups.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('subordinates');
                setActiveActionTask(null);
                setActiveActionDuty(null);
              }}
              className={`px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'subordinates'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Untergebene & Gehilfen</span>
              <span className="text-[10px] font-mono text-slate-500">
                ({subordinates.staff.length + subordinates.groups.length})
              </span>
            </button>
          )}
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/20 space-y-4">
          
          {/* QUICK CREATE TASK FORM */}
          {showQuickCreateTask && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  Neue Aufgabe für {roleProfile.displayTitle} anlegen
                </h4>
                <button
                  type="button"
                  onClick={() => setShowQuickCreateTask(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Abbrechen
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Titel der Aufgabe</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="Kurzer, handlungsbezogener Titel..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Beschreibung & Arbeitsschritte</label>
                  <AutoExpandingTextarea
                    value={newTaskDescription}
                    onChange={e => setNewTaskDescription(e.target.value)}
                    placeholder="Konkrete Anweisung oder erforderliche Handlung..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Priorität</label>
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="low">Niedrig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Hoch</option>
                    <option value="urgent">Dringend</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Frist / Zeitrahmen</label>
                  <input
                    type="text"
                    value={newTaskDeadline}
                    onChange={e => setNewTaskDeadline(e.target.value)}
                    placeholder="z.B. Heute, Vor dem Abend..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQuickCreateTask(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewQuickTask}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer shadow"
                >
                  Aufgabe speichern
                </button>
              </div>
            </div>
          )}

          {/* ACTION FORMULATION COMPOSER (INTERACTIVE INPUT IMPACTING CHAT) */}
          {(activeActionTask || activeActionDuty) && (
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wide">
                      {activeActionTask ? 'Aufgabe ausführen & Entscheidung treffen' : 'Rollenpflicht im Chat wahrnehmen'}
                    </h4>
                    <p className="text-[11px] text-slate-300 font-medium">
                      Gegenstand: <span className="text-amber-200 font-bold">{activeActionTask?.title || activeActionDuty?.title}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveActionTask(null);
                    setActiveActionDuty(null);
                  }}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Schließen"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>

              {/* Description of target item */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                <p className="text-slate-400 font-semibold mb-1">
                  Vorgabe & Sachverhalt:
                </p>
                <p className="text-slate-200">
                  {activeActionTask?.description || activeActionDuty?.description}
                </p>
              </div>

              {/* Quick suggestion chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Handlungsvorschläge für {roleProfile.displayTitle}:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {roleProfile.quickActionSuggestions.map((suggestion, sIdx) => (
                    <button
                      key={`sug-${sIdx}`}
                      type="button"
                      onClick={() => setUserActionText(suggestion)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-300 text-[11px] rounded-lg transition text-left cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-Expanding Textarea for user action */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">
                  Ihre Anweisung, Handlung oder Worte (wird an das Spiel übergeben):
                </label>
                <AutoExpandingTextarea
                  value={userActionText}
                  onChange={e => setUserActionText(e.target.value)}
                  placeholder="Geben Sie Ihre Anweisung, Entscheidung oder Handlung für diese Aufgabe ein..."
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-amber-400 min-h-[75px] leading-relaxed shadow-inner"
                />
              </div>

              {/* Controls & Execution buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
                {activeActionTask && (
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={markAsCompletedOnExecute}
                      onChange={e => setMarkAsCompletedOnExecute(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Aufgabe als erledigt markieren</span>
                  </label>
                )}

                <div className="flex items-center gap-2 self-end sm:self-auto ml-auto">
                  <button
                    type="button"
                    onClick={handleTransferActionToInput}
                    disabled={!userActionText.trim()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Überträgt den formulierten Text in das Chateingabefeld"
                  >
                    <i className="fa-solid fa-pen-to-square text-xs text-slate-400"></i>
                    <span>In Chateingabe übernehmen</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExecuteActionIntoChat}
                    disabled={!userActionText.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                    title="Sendet die Handlung sofort als nächste Nachricht ab"
                  >
                    <i className="fa-solid fa-paper-plane text-xs"></i>
                    <span>Als Nachricht an Chat senden</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: AUFGABEN */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {/* Filter Toolbar */}
              <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold mr-1">Status:</span>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('pending')}
                    className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                      taskFilter === 'pending'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Offen ({pendingTasksCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('completed')}
                    className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                      taskFilter === 'completed'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Erledigt ({tasks.filter(t => t.status === 'completed').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskFilter('all')}
                    className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                      taskFilter === 'all'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Alle ({tasks.length})
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Rolle: <strong className="text-amber-400">{roleProfile.displayTitle}</strong>
                </span>
              </div>

              {/* Tasks List */}
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-xs text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-300">Keine Aufgaben in diesem Filter vorhanden.</p>
                  <p className="text-[11px] text-slate-500">
                    Nutzen Sie &quot;Aufgaben aus Spielverlauf ableiten&quot; oder legen Sie eine neue Aufgabe an.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredTasks.map(task => {
                    const isPending = task.status === 'pending' || task.status === 'in_progress';
                    const isCompleted = task.status === 'completed';

                    return (
                      <div
                        key={task.id}
                        className={`bg-slate-900/90 border rounded-2xl p-4 transition-all space-y-2.5 ${
                          isCompleted
                            ? 'border-slate-800/60 opacity-70 bg-slate-950/40'
                            : task.priority === 'urgent'
                            ? 'border-red-500/40 bg-red-950/10'
                            : task.priority === 'high'
                            ? 'border-amber-500/35 bg-amber-950/5'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Status toggle checkmark */}
                            <button
                              type="button"
                              onClick={() => handleUpdateTaskStatus(task.id, isCompleted ? 'pending' : 'completed')}
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer ${
                                isCompleted
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                                  : 'border-slate-700 bg-slate-950 text-transparent hover:border-amber-500'
                              }`}
                              title={isCompleted ? 'Als offen markieren' : 'Als erledigt markieren'}
                            >
                              <i className="fa-solid fa-check text-[10px]"></i>
                            </button>

                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className={`text-xs font-bold leading-tight ${isCompleted ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                  {task.title}
                                </h4>

                                {task.priority && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                    task.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    task.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    task.priority === 'low' ? 'bg-slate-800 text-slate-400' :
                                    'bg-slate-800 text-slate-300'
                                  }`}>
                                    {task.priority === 'urgent' ? 'Dringend' : task.priority === 'high' ? 'Hoch' : task.priority === 'low' ? 'Niedrig' : 'Mittel'}
                                  </span>
                                )}

                                {task.generatedReason && (
                                  <span className="text-[9px] text-slate-500 italic">
                                    ({task.generatedReason})
                                  </span>
                                )}
                              </div>

                              {task.description && (
                                <p className="text-[11.5px] text-slate-300 leading-relaxed">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-slate-400 pt-0.5">
                                {task.deadline && (
                                  <span className="flex items-center gap-1">
                                    <i className="fa-regular fa-clock text-slate-500 text-[10px]"></i>
                                    <span>Frist: {task.deadline}</span>
                                  </span>
                                )}

                                <span className="flex items-center gap-1 font-medium">
                                  <i className="fa-solid fa-user text-slate-500 text-[10px]"></i>
                                  <span>Zuständig: {task.assigneeName || adventure.player?.name}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button: Handeln / Ausführen */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleStartTaskAction(task)}
                                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                                title="Formulieren Sie Ihre Handlung oder Entscheidung für diese Aufgabe"
                              >
                                <i className="fa-solid fa-pen-to-square text-xs"></i>
                                <span>Handeln</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const remaining = tasks.filter(t => t.id !== task.id);
                                persistChanges(remaining, duties);
                              }}
                              className="p-1.5 text-slate-500 hover:text-red-400 transition cursor-pointer"
                              title="Aufgabe entfernen"
                            >
                              <i className="fa-solid fa-xmark text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PFLICHTEN & ROUTINEN */}
          {activeTab === 'duties' && (
            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <p className="font-bold text-slate-200">
                  Wiederkehrende Pflichten des Amts &quot;{roleProfile.displayTitle}&quot;
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Regelmäßige Aufgaben, die Ihr Charakter in seiner Position wahrnehmen sollte. Bei Ausführung fließen sie direkt in den Spielverlauf ein.
                </p>
              </div>

              <div className="space-y-2.5">
                {duties.map(duty => {
                  return (
                    <div
                      key={duty.id}
                      className={`bg-slate-900 border rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                        duty.isFulfilled 
                          ? 'border-emerald-500/30 bg-emerald-950/5' 
                          : 'border-slate-800'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold ${duty.isFulfilled ? 'text-emerald-300' : 'text-slate-100'}`}>
                            {duty.title}
                          </h4>
                          <span className="text-[9px] px-2 py-0.2 rounded font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {duty.frequency === 'daily' ? 'Täglich' : duty.frequency === 'weekly' ? 'Wöchentlich' : duty.frequency === 'shift' ? 'Pro Schicht' : 'Dauerhaft'}
                          </span>
                          {duty.isFulfilled && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                              Heute wahrgenommen
                            </span>
                          )}
                        </div>

                        <p className="text-[11.5px] text-slate-300 leading-relaxed">
                          {duty.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartDutyAction(duty)}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-amber-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          title="Pflicht im Spielchat wahrnehmen"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs text-amber-400"></i>
                          <span>Im Chat ausführen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updatedDuties = duties.map(d => 
                              d.id === duty.id ? { ...d, isFulfilled: !d.isFulfilled } : d
                            );
                            persistChanges(tasks, updatedDuties);
                          }}
                          className={`w-8 h-8 rounded-xl border flex items-center justify-center transition cursor-pointer ${
                            duty.isFulfilled
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                          title={duty.isFulfilled ? 'Als noch offen markieren' : 'Als erledigt markieren'}
                        >
                          <i className="fa-solid fa-check text-xs"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: UNTERGEBENE & GEHILFEN */}
          {activeTab === 'subordinates' && (
            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <p className="font-bold text-slate-200">
                  Verfügbare Mitarbeiter & Untergebene am Dienstort
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Personen oder Arbeitsgruppen, die Ihnen unterstellt sind und denen Sie Aufgaben anweisen können.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subordinates.staff.map(member => (
                  <div
                    key={member.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-100">
                          {member.name}
                        </h4>
                        {member.workplaceArea ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {member.workplaceArea}
                          </span>
                        ) : member.salary ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-400/80 font-mono">
                            {member.salary} Münzen
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            Aktiv
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-400 font-medium mt-0.5">
                        {member.assignedToName || 'Unbesetzt'}
                      </p>
                      {member.responsibilities && (
                        <p className="text-[10.5px] text-slate-400 line-clamp-2 mt-1">
                          {member.responsibilities}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('tasks');
                        setActiveActionTask({
                          id: `task-del-${Date.now()}`,
                          title: `Anweisung an ${member.assignedToName || member.name}`,
                          description: `Befehl oder Arbeitsauftrag im Rahmen der Zuständigkeit als ${member.name}.`,
                          status: 'pending',
                          priority: 'medium',
                          reward: '',
                          assigneeName: member.assignedToName || member.name,
                          taskType: 'delegated',
                          canDelegate: true
                        });
                        setUserActionText(`Ich weise ${member.assignedToName || member.name} an: `);
                      }}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Befehl / Anweisung erteilen
                    </button>
                  </div>
                ))}

                {subordinates.groups.map(group => (
                  <div
                    key={group.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-100">
                          {group.roleName}
                        </h4>
                        <span className="text-[9px] px-2 py-0.2 rounded-full bg-slate-800 text-amber-300 font-mono font-bold">
                          {group.count} Personen
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 mt-1">
                        Sammelgruppe für routinemäßige Hilfsarbeiten und Unterstützung.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('tasks');
                        setActiveActionTask({
                          id: `task-del-${Date.now()}`,
                          title: `Anweisung an die ${group.roleName}`,
                          description: `Kollektiver Arbeitsauftrag an die Gruppe (${group.count} Personen).`,
                          status: 'pending',
                          priority: 'medium',
                          reward: '',
                          assigneeGroupName: group.roleName,
                          taskType: 'delegated',
                          canDelegate: true
                        });
                        setUserActionText(`Ich befehle den ${group.roleName}: `);
                      }}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Gruppe anweisen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 sm:px-6 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px]">
              Dienstbereich aktiv: {roleProfile.station} ({roleProfile.displayTitle})
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
