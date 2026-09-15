import { Adventure, Character, ChatMessage, LoreEntry, NPC, StoryEntityItem, StoryInfoState } from '../types';

/**
 * Returns all accessible characters/NPCs in the adventure by merging:
 * 1. adventure.npcs
 * 2. adventure.loreDatabase (category === 'Charaktere' | 'Gegner')
 * 3. adventure.storyState.storyEntities (category === 'Charaktere' | 'Gegner')
 */
export function getAllAdventureCharacters(adventure: Adventure): NPC[] {
  const result: NPC[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();

  const isPlayer = (name?: string) => {
    if (!name) return false;
    const clean = name.trim().toLowerCase();
    const pName = (adventure.player?.name || '').trim().toLowerCase();
    const pNick = (adventure.player?.nickname || '').trim().toLowerCase();
    return clean === 'spieler' || clean === 'player' || clean === pName || (pNick && clean === pNick);
  };

  const addNpc = (npc: NPC) => {
    if (!npc || !npc.name) return;
    if (isPlayer(npc.name) || isPlayer(npc.nickname)) return;
    
    const cleanName = (npc.nickname || npc.name).trim().toLowerCase();
    if (!cleanName || seenNames.has(cleanName)) return;
    seenNames.add(cleanName);
    if (npc.id) seenIds.add(npc.id);
    result.push(npc);
  };

  // 1. Existing NPCs
  (adventure.npcs || []).forEach(n => addNpc(n));

  // 2. Lore Database (Charaktere & Gegner)
  (adventure.loreDatabase || []).forEach(lore => {
    if (lore.category === 'Charaktere' || lore.category === 'Gegner') {
      const charName = lore.title;
      if (isPlayer(charName)) return;

      const details = lore.details || {};
      const generatedId = lore.id || 'lore-char-' + charName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      addNpc({
        id: generatedId,
        name: charName,
        nickname: details.nickname || details.rufName,
        role: details.role || (lore.category === 'Gegner' ? 'Gegner' : 'Charakter'),
        bio: lore.description || details.bio || 'Codex-Charakter',
        personality: details.personality || 'Unbekannt',
        personalityTraits: details.personalityTraits || [],
        relationship: details.relationship || details.beziehungZumSpieler || 'Bekanntschaft',
        conduct: details.conduct || 'Neutral',
        currentSituation: details.currentSituation || 'In der Spielwelt',
        appearance: details.appearance || {},
        campaignPowerLevels: details.campaignPowerLevels || {},
        attributes: details.attributes || [],
        isHostile: lore.category === 'Gegner' || !!details.isHostile
      });
    }
  });

  // 3. Story Entities (Temporary story characters)
  (adventure.storyState?.storyEntities || []).forEach(entity => {
    if (entity.category === 'Charaktere' || entity.category === 'Gegner') {
      const charName = entity.title;
      if (isPlayer(charName)) return;

      const details = entity.details || {};
      const generatedId = entity.id || 'story-char-' + charName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      addNpc({
        id: generatedId,
        name: charName,
        nickname: details.nickname,
        role: details.role || (entity.category === 'Gegner' ? 'Gegner' : 'Charakter'),
        bio: entity.description || 'In der aktuellen Szene anwesend',
        personality: details.personality || 'Unbekannt',
        personalityTraits: details.personalityTraits || [],
        relationship: details.relationship || 'Begegnung in der Szene',
        conduct: details.conduct || 'Neutral',
        currentSituation: details.currentSituation || 'In der aktuellen Szene anwesend',
        appearance: details.appearance || {},
        campaignPowerLevels: details.campaignPowerLevels || {},
        attributes: details.attributes || [],
        isHostile: entity.category === 'Gegner' || !!details.isHostile
      });
    }
  });

  return result;
}

/**
 * Intelligent background extractor for Story-Info and Temporary Story-Data.
 * Automatically inspects the current scene / messages / prologue to extract:
 * - Current location and territory
 * - Active situation summary
 * - Active goals / quests
 * - Active character relationships
 * - Story entities (Characters, Enemies, Locations, Items, Factions, Quests)
 */
export function extractDynamicStoryState(
  adventure: Adventure,
  messages: ChatMessage[]
): {
  updatedStoryState: StoryInfoState;
  updatedNpcs: NPC[];
  hasChanges: boolean;
  newEntitiesCount: number;
} {
  const currentStoryState: StoryInfoState = adventure.storyState ? {
    ...adventure.storyState,
    storyEntities: [...(adventure.storyState.storyEntities || [])],
    activeGoals: [...(adventure.storyState.activeGoals || [])],
    relationships: [...(adventure.storyState.relationships || [])]
  } : {
    currentLocationName: '',
    currentTerritoryName: '',
    activeSituation: '',
    activeGoals: [],
    relationships: [],
    storyEntities: [],
    lastUpdatedTime: new Date().toISOString()
  };

  const updatedNpcs = [...(adventure.npcs || [])];
  const loreDatabase = adventure.loreDatabase || [];
  const player = adventure.player;
  const playerName = (player?.name || 'Spieler').trim();

  // Combine text from recent messages, or prologue + firstMessage if messages are minimal
  const allTexts: string[] = [];
  if (adventure.prologue) allTexts.push(adventure.prologue);
  if (adventure.firstMessage) allTexts.push(adventure.firstMessage);
  messages.forEach(m => {
    if (m.text) allTexts.push(m.text);
  });

  const fullCombinedText = allTexts.join('\n\n');
  const lastModelMsg = [...messages].reverse().find(m => m.role === 'model')?.text || adventure.firstMessage || adventure.prologue || '';

  let hasChanges = false;
  let newEntitiesCount = 0;

  const isPlayerMatch = (incomingName?: string): boolean => {
    if (!incomingName) return false;
    const incClean = incomingName.trim().toLowerCase();
    if (incClean === 'spieler' || incClean === 'player') return true;
    if (playerName && (incClean === playerName.toLowerCase() || incClean.includes(playerName.toLowerCase()))) return true;
    if (player?.nickname && incClean === player.nickname.toLowerCase()) return true;
    return false;
  };

  const isAlreadyInEntities = (title: string, category: string): boolean => {
    const cleanTitle = title.trim().toLowerCase();
    return (
      currentStoryState.storyEntities.some(e => e.category === category && (e.title.toLowerCase() === cleanTitle || e.title.toLowerCase().includes(cleanTitle) || cleanTitle.includes(e.title.toLowerCase()))) ||
      loreDatabase.some(l => l.category === category && (l.title.toLowerCase() === cleanTitle || l.title.toLowerCase().includes(cleanTitle) || cleanTitle.includes(l.title.toLowerCase())))
    );
  };

  const addStoryEntity = (
    title: string,
    category: StoryEntityItem['category'],
    description: string,
    details: Record<string, any> = {}
  ) => {
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length < 2 || isPlayerMatch(cleanTitle)) return;

    if (!isAlreadyInEntities(cleanTitle, category)) {
      const newEntity: StoryEntityItem = {
        id: 'story-ent-' + Math.random().toString(36).substring(2, 9),
        category,
        title: cleanTitle,
        description: description.trim() || `In der aktuellen Szene erwähntes Element (${category}).`,
        details,
        createdAt: new Date().toISOString(),
        isNewInStory: true,
        promotedToCodex: false
      };
      currentStoryState.storyEntities.push(newEntity);
      hasChanges = true;
      newEntitiesCount++;

      // If it's a character or enemy, make sure they are available in npcs too
      if (category === 'Charaktere' || category === 'Gegner') {
        const npcExists = updatedNpcs.some(n => n.name.toLowerCase() === cleanTitle.toLowerCase() || (n.nickname && n.nickname.toLowerCase() === cleanTitle.toLowerCase()));
        if (!npcExists) {
          updatedNpcs.push({
            id: newEntity.id,
            name: cleanTitle,
            role: details.role || (category === 'Gegner' ? 'Gegner' : 'Charakter'),
            bio: description || 'In der Szene anwesender Charakter.',
            personality: details.personality || 'Unbekannt',
            relationship: details.relationship || 'Begegnung in der Szene',
            conduct: details.conduct || 'Neutral',
            currentSituation: details.currentSituation || 'In der Szene anwesend',
            appearance: details.appearance || {},
            campaignPowerLevels: details.campaignPowerLevels || {},
            attributes: [],
            isHostile: category === 'Gegner' || !!details.isHostile
          });
        }
      }
    }
  };

  // 1. EXTRACT CURRENT LOCATION & TERRITORY
  const world: any = adventure.world || {};
  let detectedLocation = currentStoryState.currentLocationName || '';
  let detectedTerritory = currentStoryState.currentTerritoryName || '';

  // Check world locations
  if (Array.isArray(world.locations) && world.locations.length > 0) {
    for (const loc of world.locations) {
      if (lastModelMsg.toLowerCase().includes(loc.name.toLowerCase()) || fullCombinedText.toLowerCase().includes(loc.name.toLowerCase())) {
        detectedLocation = loc.name;
        break;
      }
    }
    if (!detectedLocation && world.locations[0]?.name) {
      detectedLocation = world.locations[0].name;
    }
  }

  // Check world territories
  if (Array.isArray(world.territories) && world.territories.length > 0) {
    for (const terr of world.territories) {
      if (lastModelMsg.toLowerCase().includes(terr.name.toLowerCase()) || fullCombinedText.toLowerCase().includes(terr.name.toLowerCase())) {
        detectedTerritory = terr.name;
        break;
      }
    }
    if (!detectedTerritory && world.territories[0]?.name) {
      detectedTerritory = world.territories[0].name;
    }
  }

  // Heuristic location patterns in German (e.g., "Dorfplatz", "Schmiede", "Taverne", "Marktplatz", "Gasse", "Wald", "Hafen", "Burg", "Klassenzimmer")
  const commonLocationPatterns = [
    { name: 'Dorfplatz', regex: /\b(dorfplatz|dorf-platz)\b/i, desc: 'Der zentrale Platz des Dorfes.' },
    { name: 'Schmiede', regex: /\b(schmiede|amboss|hammer)\b/i, desc: 'Die örtliche Schmiede.' },
    { name: 'Taverne', regex: /\b(taverne|gasthaus|herberge|schenke|schankraum)\b/i, desc: 'Ein Treffpunkt für Reisende und Einheimische.' },
    { name: 'Marktplatz', regex: /\b(marktplatz|marktstand|händlergasse)\b/i, desc: 'Der geschäftige Markt.' },
    { name: 'Gasse', regex: /\b(gasse|straße|weg|pfad)\b/i, desc: 'Eine Straße oder Gasse im Ort.' },
    { name: 'Hafen', regex: /\b(hafen|pier|dock|kais)\b/i, desc: 'Der Hafenbereich für Schiffe und Fischer.' },
    { name: 'Waldrand', regex: /\b(wald|waldrand|hübel|forst|gehölz)\b/i, desc: 'Die bewaldete Umgebung.' },
    { name: 'Klassenzimmer', regex: /\b(klassenzimmer|akademie|schule|unterrichtsraum)\b/i, desc: 'Ein Raum zum Lernen und Trainieren.' }
  ];

  for (const locPattern of commonLocationPatterns) {
    if (locPattern.regex.test(lastModelMsg)) {
      if (!detectedLocation || detectedLocation === 'Unbekannter Ort') {
        detectedLocation = locPattern.name;
      }
      addStoryEntity(locPattern.name, 'Orte', locPattern.desc, { sceneLocation: true });
    }
  }

  if (!detectedLocation) {
    detectedLocation = world.startLocationName || (world.locations && world.locations.length > 0 ? world.locations[0].name : 'Startort');
  }
  if (!detectedTerritory) {
    detectedTerritory = world.territories && world.territories.length > 0 ? world.territories[0].name : (world.title ? `${world.title} Region` : 'Hauptgebiet');
  }

  if (detectedLocation !== currentStoryState.currentLocationName) {
    currentStoryState.currentLocationName = detectedLocation;
    hasChanges = true;
  }
  if (detectedTerritory !== currentStoryState.currentTerritoryName) {
    currentStoryState.currentTerritoryName = detectedTerritory;
    hasChanges = true;
  }

  // 2. EXTRACT ACTIVE SITUATION
  // Extract a 1-2 sentence overview from the last model message
  if (lastModelMsg) {
    const cleanMsg = lastModelMsg.replace(/\[\[.*?\]\]/g, '').trim();
    const sentences = cleanMsg.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 15);
    let situationSummary = '';
    if (sentences.length > 0) {
      // Pick the most direct actionable sentence or the first 2 sentences
      situationSummary = sentences.slice(0, 2).join(' ');
      if (situationSummary.length > 250) {
        situationSummary = situationSummary.substring(0, 247) + '...';
      }
    }
    if (situationSummary && situationSummary !== currentStoryState.activeSituation) {
      currentStoryState.activeSituation = situationSummary;
      hasChanges = true;
    }
  }

  // 3. EXTRACT SCENE CHARACTERS & NPCS
  // Look for prominent character mentions (e.g. "junger Mann", "Schmied", "Händler", named characters)
  const characterPatterns = [
    { title: 'Kräftiger junger Mann', regex: /\b(kräftig\w*\s+gebauter\s+junger\s+mann|junger\s+mann\s+mit\s+pferd|junger\s+mann)\b/i, role: 'Dorfbewohner / Reiter', desc: 'Ein junger Mann im lederverstärkten Wams mit Pferd.', conduct: 'Aufmerksam und gesprächssuchend' },
    { title: 'Dorfschmied', regex: /\b(schmied|meister\s+schmied|einsamer\s+schmied)\b/i, role: 'Handwerker', desc: 'Der Schmied des Dorfes, der metallisch im Hintergrund arbeitet.', conduct: 'Fleißig' },
    { title: 'Feldarbeiter', regex: /\b(männer\s+in\s+grober|arbeiter|feldarbeiter|zugtierführer)\b/i, role: 'Arbeiter', desc: 'Arbeiter, die Brennholz tragen und Zugtiere führen.', conduct: 'Beschäftigt' },
    { title: 'Wirt / Schenkwirt', regex: /\b(wirt|schenkwirt|gastwirt|schankmaid)\b/i, role: 'Wirt', desc: 'Der Besitzer der Gaststätte.', conduct: 'Gastfreundlich' },
    { title: 'Stadtwache', regex: /\b(wache|stadtwache|torwache|posten)\b/i, role: 'Wache', desc: 'Aufmerksame Wachen zur Sicherung des Bereichs.', conduct: 'Wachsam' }
  ];

  for (const pat of characterPatterns) {
    if (pat.regex.test(lastModelMsg) || pat.regex.test(fullCombinedText)) {
      addStoryEntity(pat.title, 'Charaktere', pat.desc, {
        role: pat.role,
        conduct: pat.conduct,
        relationship: 'Begegnung am Ort'
      });

      // Also record relationship
      const relExists = currentStoryState.relationships.some(r => r.fromName === pat.title && r.toName === playerName);
      if (!relExists) {
        currentStoryState.relationships.push({
          fromName: pat.title,
          toName: playerName,
          relationType: pat.conduct,
          description: `Begegnet dem Spieler in der aktuellen Szene (${detectedLocation}).`
        });
        hasChanges = true;
      }
    }
  }

  // Look for specific named characters with titles (e.g. "Kapitän ...", "Admiral ...", "Meister ...")
  const titleNameRegex = /\b(?:Kapitän|Captain|Admiral|Meister|Master|Lord|Sir|Lady|Prinz|König|Doktor|Dr\.|Herr|Frau)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)\b/g;
  let titleMatch;
  while ((titleMatch = titleNameRegex.exec(lastModelMsg)) !== null) {
    const fullMatchedTitle = titleMatch[0].trim();
    if (!isPlayerMatch(fullMatchedTitle)) {
      addStoryEntity(fullMatchedTitle, 'Charaktere', `In der Szene auftretender Charakter (${fullMatchedTitle}).`, {
        role: 'Charakter',
        relationship: 'Direkte Begegnung'
      });
    }
  }

  // 4. EXTRACT ITEMS & OBJECTS
  const itemPatterns = [
    { title: 'Arbeitsmesser', regex: /\b(arbeitsmesser|messer|dolch)\b/i, desc: 'Ein stabiles Arbeitsmesser am Gürtel.' },
    { title: 'Pferd & Zügel', regex: /\b(zügel\s+seines\s+pferdes|pferd|zugtier|reittier)\b/i, desc: 'Ein kräftiges Tier mit Zügeln.' },
    { title: 'Schmiedehammer', regex: /\b(hammer|schmiedehammer|amboss)\b/i, desc: 'Schweres Werkzeug für Schmiedearbeiten.' },
    { title: 'Brennstoff & Werkzeuge', regex: /\b(brennholz|werkzeuge|schwere\s+bündel)\b/i, desc: 'Materialien und Werkzeuge für den Alltag.' }
  ];

  for (const itemPat of itemPatterns) {
    if (itemPat.regex.test(lastModelMsg)) {
      addStoryEntity(itemPat.title, 'Gegenstände', itemPat.desc, {
        itemType: 'Alltagsgegenstand / Werkzeug'
      });
    }
  }

  // 5. EXTRACT GROUPS / FACTIONS
  const factionPatterns = [
    { title: 'Dorfbevölkerung & Arbeiter', regex: /\b(männer\s+in\s+grober|dorfbewohner|arbeiter|bauern)\b/i, desc: 'Die arbeitende Landbevölkerung des Tals.' },
    { title: 'Handwerker-Gilde', regex: /\b(schmiede|handwerker|gilde)\b/i, desc: 'Die örtlichen Handwerker und Schmiede.' }
  ];

  for (const facPat of factionPatterns) {
    if (facPat.regex.test(lastModelMsg)) {
      addStoryEntity(facPat.title, 'Fraktionen', facPat.desc, {
        standing: 'Neutral'
      });
    }
  }

  // 6. EXTRACT ACTIVE GOALS
  // If no active goals exist or if dialogue poses a question/choice
  if (currentStoryState.activeGoals.length === 0) {
    if (/begleiten|helfen|unter uns/i.test(lastModelMsg)) {
      currentStoryState.activeGoals.push('Auf das Begleitungs-Angebot des jungen Mannes reagieren.');
      hasChanges = true;
    } else {
      currentStoryState.activeGoals.push(`Die Umgebung in ${detectedLocation} erkunden und erste Kontakte knüpfen.`);
      hasChanges = true;
    }
  }

  if (hasChanges) {
    currentStoryState.lastUpdatedTime = new Date().toISOString();
  }

  return {
    updatedStoryState: currentStoryState,
    updatedNpcs,
    hasChanges,
    newEntitiesCount
  };
}
