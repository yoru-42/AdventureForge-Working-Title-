import { 
  Adventure, 
  Character, 
  WorldSetting, 
  EconomyHolding, 
  TradeContract, 
  EconomyTask, 
  EconomyDuty,
  CharacterKnowledge, 
  CharacterKnowledgeEntry, 
  InformationEvent, 
  InformationType, 
  InformationSourceType,
  LoreEntry
} from '../types';

export const CHARACTER_KNOWLEDGE_DIRECTIVE = `
### STRIKTE TRENNUNG: WELTZUSTAND, CHARAKTERWISSEN & INFORMATIONSFLUSS:
1. WELTZUSTAND IST NICHT AUTOMATISCH CHARAKTERWISSEN:
   - Die Welt simuliert unabhängig vom Spieler: Orte, Gebäude, Betriebe, Besitzer, Mitarbeiter, Produktion, Waren, Lieferanten, Verträge, Aufgaben, Schulden, politische Verhältnisse und Ereignisse.
   - Der Charakter kennt davon AUSSCHLIESSLICH das, was er selbst erlebt, beobachtet, in Berichten/Dokumenten gelesen hat, oder was ihm durch seine konkrete gesellschaftliche Position/Beruf zugänglich ist.
   - Ein Eintrag im Codex bedeutet NIEMALS, dass der Charakter davon weiß!
   
2. BESTEHENDE WELTBEZIEHUNGEN NICHT KÜNSTLICH NEU ERZEUGEN:
   - Verträge, Lieferanten, Betriebe oder Arbeitsverhältnisse, die in der Welt bereits existieren, werden nicht neu erfunden oder dupliziert, wenn der Charakter davon erfährt.
   - Stattdessen: Der bestehende Vertrag / Sachverhalt wird dem Charakter einfach bekannt (enthüllt).
   - Wenn eine Taverne oder ein Betrieb keine Lieferanten, keine Verträge oder keine Nachfrage hat, darfst du KEINE künstlichen Handelsverträge erfinden!

3. ROLLENABHÄNGIGER INFORMATIONSZUGANG:
   - Baron / Landesherr / Verwalter: Hat Zugang zu Verwaltungsberichten, Abgaben, Grenzmeldungen, offiziellen Verträgen und Aufgaben seines Territoriums.
   - Betriebsleiter / Tavernenbesitzer: Kennt die eigenen Mitarbeiter, Betriebskosten, Einkaufspreise, Lieferanten und laufenden Verträge des eigenen Betriebs.
   - Lehrling / Hilfskraft / Geselle: Kennt den täglichen Arbeitsablauf, eigene Aufgaben, Kunden und was er selbst vor Ort erlebt, aber NICHT automatisch die internen Verträge oder Finanzen des Besitzers (außer jemand erzählt es ihm).
   - Freier Wanderer / Abenteurer: Kennt nur das, was er persönlich sieht, wen er trifft und welche Aufgaben ihm persönlich übertragen werden.

4. REALISTISCHE INFORMATIONSQUELLEN & WEITERGABE:
   - Wissen entsteht nur durch: Persönliche Erfahrung (vor Ort sein), Gespräche mit NPCs, plausible Beobachtung, offizielle Berichte/Briefe oder die berufliche Verantwortung.
   - Wenn ein Charakter im Dialog oder durch ein Dokument von einem Ort, einer Person, einem Betrieb, einem Vertrag oder einem Problem erfährt, kannst du dies im Erzähltext festhalten und bei Bedarf mit dem Tag [[KNOWLEDGE_ADD: Typ | Name_oder_ID | Quelle | Zusammenfassung]] kennzeichnen!
   - Beispiele für KNOWLEDGE_ADD:
     * [[KNOWLEDGE_ADD: location | Eichenhain | Gespräch mit Händler | Nachbardorf mit Brauerei bekannt geworden]]
     * [[KNOWLEDGE_ADD: contract | Metlieferung | Beobachtung Lieferant | Brauerei beliefert die Taverne]]
     * [[KNOWLEDGE_ADD: task | Brunnenreparatur | Vogt-Bericht | Brunnen im Unterdorf beschädigt]]
`;

export class CharacterKnowledgeService {
  /**
   * Normalizes and returns the current saved knowledge object
   */
  static getRawSavedKnowledge(adventure: Adventure): CharacterKnowledge {
    return (
      adventure.characterKnowledge || 
      adventure.player?.characterKnowledge || 
      adventure.storyState?.characterKnowledge || 
      {}
    );
  }

  /**
   * Determines if a character's profession or role qualifies as ruler/manager/master
   */
  static isRulerOrLord(character?: Character): boolean {
    if (!character) return false;
    const roleText = [
      character.role,
      character.jobTitle,
      character.profession,
      character.socialStatus,
      ...(character.authorities || []),
      ...(character.socialTitles?.map(t => t.title) || []),
      ...(character.offices?.map(o => o.name || (o as any).title) || [])
    ].join(' ').toLowerCase();

    return /baron|graf|fürst|könig|adel|vogt|verwalter|amtmann|bürgermeister|gutsherr|landvogt|burggraf/i.test(roleText);
  }

  /**
   * Determines if a character is an apprentice, laborer, or basic employee
   */
  static isApprenticeOrLaborer(character?: Character): boolean {
    if (!character) return false;
    const roleText = [
      character.role,
      character.jobTitle,
      character.profession,
      character.professionRank,
      character.professionLevel
    ].join(' ').toLowerCase();

    return /lehrling|auszubildend|hilfskraft|knecht|magd|schüler|novize|leibeigen|knecht|diener/i.test(roleText);
  }

  /**
   * Checks if a character owns or manages a given holding
   */
  static isHoldingOwnerOrMaster(character: Character, holding: EconomyHolding): boolean {
    if (!character || !holding) return false;

    // Direct ownership
    if (holding.ownerType === 'user') return true;
    if (holding.ownerCharacterId && (holding.ownerCharacterId === character.id || holding.ownerCharacterId === character.name)) return true;
    if (holding.assignedCharacterId && (holding.assignedCharacterId === character.id || holding.assignedCharacterId === character.name)) return true;
    if (holding.assignedCharacterName && holding.assignedCharacterName.toLowerCase() === character.name.toLowerCase()) return true;

    // Check if player is master / head of holding
    const charRole = (character.profession || character.role || '').toLowerCase();
    const holdingMasterId = (holding as any).masterId;
    const holdingMasterName = (holding as any).masterName;
    if (holdingMasterId && (holdingMasterId === character.id || holdingMasterId === character.name)) return true;
    if (holdingMasterName && holdingMasterName.toLowerCase() === character.name.toLowerCase()) return true;

    // Check if workplace matches and character is not an apprentice
    if (character.workplaceId === holding.id && !this.isApprenticeOrLaborer(character)) {
      if (/meister|leiter|wirt|besitzer|chef|inhaber/i.test(charRole)) return true;
    }

    return false;
  }

  /**
   * Derives baseline knowledge that is logically guaranteed by the character's
   * current position, physical location, and profession role without leaking hidden world state.
   */
  static getBaselineKnowledge(adventure: Adventure): CharacterKnowledge {
    const player = adventure.player;
    const world = adventure.world;
    const holdings = world?.economyConfig?.holdings || [];
    
    const knownLocations = new Set<string>();
    const knownHoldings = new Set<string>();
    const knownContracts = new Set<string>();
    const knownTasks = new Set<string>();
    const knownDuties = new Set<string>();

    // 1. Current physical location is known through direct personal experience
    const currentLoc = player?.appearance?.currentLocation || adventure.storyState?.currentLocationName || world?.startLocationName;
    if (currentLoc && currentLoc.trim()) {
      knownLocations.add(currentLoc.trim().toLowerCase());
    }
    if (world?.startLocationId) {
      knownLocations.add(world.startLocationId.toLowerCase());
    }
    if (adventure.storyState?.currentTerritoryName) {
      knownLocations.add(adventure.storyState.currentTerritoryName.toLowerCase());
    }

    // 2. Workplace & Residence
    if (player?.workplaceId) {
      knownHoldings.add(player.workplaceId.toLowerCase());
    }
    if (player?.workplaceName) {
      knownHoldings.add(player.workplaceName.toLowerCase());
    }
    if (player?.residenceId) {
      knownLocations.add(player.residenceId.toLowerCase());
    }
    if (player?.residenceName) {
      knownLocations.add(player.residenceName.toLowerCase());
    }

    // 3. Personally assigned tasks/duties
    if (Array.isArray(player?.tasks)) {
      player.tasks.forEach(t => {
        if (t.id) knownTasks.add(t.id.toLowerCase());
      });
    }
    if (Array.isArray(player?.duties)) {
      player.duties.forEach(d => {
        if (d.id) knownDuties.add(d.id.toLowerCase());
      });
    }

    // 4. Role-based Holding Knowledge
    const isLord = this.isRulerOrLord(player);

    holdings.forEach(h => {
      const isOwner = this.isHoldingOwnerOrMaster(player, h);
      const isWorkplace = player?.workplaceId === h.id || player?.workplaceName?.toLowerCase() === h.name.toLowerCase();

      if (isOwner) {
        // Owner knows their holding, its location, its contracts, and its tasks
        knownHoldings.add(h.id.toLowerCase());
        knownHoldings.add(h.name.toLowerCase());
        if (h.locationName) knownLocations.add(h.locationName.toLowerCase());
        if (h.locationId) knownLocations.add(h.locationId.toLowerCase());
        if (h.territoryId) knownLocations.add(h.territoryId.toLowerCase());

        // Owner knows contracts of their holding
        if (Array.isArray(h.contracts)) {
          h.contracts.forEach(c => {
            if (c.id) knownContracts.add(c.id.toLowerCase());
          });
        }

        // Owner knows holding tasks and duties
        if (Array.isArray(h.tasks)) {
          h.tasks.forEach(t => {
            if (t.id) knownTasks.add(t.id.toLowerCase());
          });
        }
        if (Array.isArray(h.duties)) {
          h.duties.forEach(d => {
            if (d.id) knownDuties.add(d.id.toLowerCase());
          });
        }
      } else if (isLord) {
        // Baron/Ruler knows holdings and administrative tasks in their jurisdiction
        knownHoldings.add(h.id.toLowerCase());
        knownHoldings.add(h.name.toLowerCase());
        if (h.locationName) knownLocations.add(h.locationName.toLowerCase());
      } else if (isWorkplace) {
        // Employee/apprentice knows the workplace holding itself
        knownHoldings.add(h.id.toLowerCase());
        knownHoldings.add(h.name.toLowerCase());
        if (h.locationName) knownLocations.add(h.locationName.toLowerCase());

        // Tasks assigned to this specific player at their workplace
        if (Array.isArray(h.tasks)) {
          h.tasks.forEach(t => {
            const isAssigned = (t.assigneeId && t.assigneeId === player.id) || 
                               (t.assigneeName && t.assigneeName.toLowerCase() === player.name.toLowerCase());
            if (isAssigned && t.id) {
              knownTasks.add(t.id.toLowerCase());
            }
          });
        }
        if (Array.isArray(h.duties)) {
          h.duties.forEach(d => {
            const roleMatch = d.assignedRoleName || (d as any).assigneeRole;
            const idMatch = (d as any).assigneeId;
            const isAssigned = (roleMatch && player.role && player.role.toLowerCase().includes(roleMatch.toLowerCase())) ||
                               (idMatch && idMatch === player.id);
            if (isAssigned && d.id) {
              knownDuties.add(d.id.toLowerCase());
            }
          });
        }
      }
    });

    return {
      knownLocations: Array.from(knownLocations),
      knownHoldings: Array.from(knownHoldings),
      knownContracts: Array.from(knownContracts),
      knownTasks: Array.from(knownTasks),
      knownDuties: Array.from(knownDuties)
    };
  }

  /**
   * Combines saved knowledge with baseline knowledge
   */
  static getEffectiveKnowledge(adventure: Adventure): CharacterKnowledge {
    const raw = this.getRawSavedKnowledge(adventure);
    const baseline = this.getBaselineKnowledge(adventure);

    const mergeArrays = (a?: string[], b?: string[]): string[] => {
      const set = new Set<string>();
      (a || []).forEach(x => set.add(String(x).trim()));
      (b || []).forEach(x => set.add(String(x).trim()));
      return Array.from(set);
    };

    return {
      ...raw,
      knownLocations: mergeArrays(raw.knownLocations, baseline.knownLocations),
      knownBuildings: raw.knownBuildings || [],
      knownHoldings: mergeArrays(raw.knownHoldings, baseline.knownHoldings),
      knownCharacters: raw.knownCharacters || [],
      knownOrganizations: raw.knownOrganizations || [],
      knownResources: raw.knownResources || [],
      knownProducers: raw.knownProducers || [],
      knownSuppliers: raw.knownSuppliers || [],
      knownContracts: mergeArrays(raw.knownContracts, baseline.knownContracts),
      knownTradeRelations: raw.knownTradeRelations || [],
      knownTasks: mergeArrays(raw.knownTasks, baseline.knownTasks),
      knownDuties: mergeArrays(raw.knownDuties, baseline.knownDuties),
      discoveredInformation: raw.discoveredInformation || [],
      events: raw.events || []
    };
  }

  /**
   * Checks whether a specific location (by id or title/name) is known to the character
   */
  static isLocationKnown(
    loc: { id?: string; name?: string; title?: string; details?: any },
    knowledge: CharacterKnowledge,
    player: Character,
    world?: WorldSetting
  ): boolean {
    const locId = (loc.id || '').toLowerCase();
    const locName = (loc.name || loc.title || '').toLowerCase();

    // Direct check in knownLocations
    const knownList = (knowledge.knownLocations || []).map(l => l.toLowerCase());
    if (locId && knownList.includes(locId)) return true;
    if (locName && knownList.includes(locName)) return true;

    // Current player location is always known
    const currentLoc = (player?.appearance?.currentLocation || '').toLowerCase();
    if (currentLoc && (currentLoc === locId || currentLoc === locName || currentLoc.includes(locName) || locName.includes(currentLoc))) {
      return true;
    }

    // Start location is known
    const startLoc = (world?.startLocationName || '').toLowerCase();
    if (startLoc && (startLoc === locId || startLoc === locName)) {
      return true;
    }

    return false;
  }

  /**
   * Checks whether a holding / business / building is known to the character.
   * Supports both (adventure, holdingIdOrName) and (holding, knowledge, player) signatures.
   */
  static isHoldingKnown(
    adventureOrHolding: Adventure | EconomyHolding,
    holdingIdOrKnowledge?: string | CharacterKnowledge | null,
    player?: Character
  ): boolean {
    if (!adventureOrHolding) return false;

    // Check if called as (holding, knowledge, player)
    if ('type' in adventureOrHolding && typeof holdingIdOrKnowledge === 'object') {
      const holding = adventureOrHolding as EconomyHolding;
      const knowledge = (holdingIdOrKnowledge as CharacterKnowledge) || {};
      const char = player;
      if (char && this.isHoldingOwnerOrMaster(char, holding)) return true;
      if (char?.workplaceId === holding.id) return true;
      const q = (holding.id || '').toLowerCase();
      const qName = (holding.name || '').toLowerCase();
      const knownList = (knowledge.knownHoldings || []).map(h => h.toLowerCase());
      if (knownList.includes(q) || knownList.includes(qName)) return true;
      if (knowledge.facts && knowledge.facts.some(f => 
        (f.category === 'holding' || f.category === 'building') && (
          f.entityId?.toLowerCase() === q || 
          f.entityName?.toLowerCase() === qName ||
          (f.title && f.title.toLowerCase().includes(qName))
        )
      )) return true;
      return false;
    }

    // Called as (adventure, holdingIdOrName)
    const adventure = adventureOrHolding as Adventure;
    const holdingIdOrName = holdingIdOrKnowledge as string;
    if (!holdingIdOrName) return false;
    const effective = this.getEffectiveKnowledge(adventure);
    const query = holdingIdOrName.trim().toLowerCase();
    
    // Check knownHoldings set
    const knownList = (effective.knownHoldings || []).map(h => h.toLowerCase());
    if (knownList.includes(query)) {
      return true;
    }

    // Check facts/entries
    if (effective.facts && effective.facts.some(f => 
      (f.category === 'holding' || f.category === 'building') && (
        f.entityId?.toLowerCase() === query || 
        f.entityName?.toLowerCase() === query ||
        (f.title && f.title.toLowerCase().includes(query))
      )
    )) {
      return true;
    }

    // Direct check if player is owner/worker
    const char = adventure.player;
    const holdings = adventure.world?.economyConfig?.holdings || [];
    const targetHolding = holdings.find(h => h.id.toLowerCase() === query || h.name.toLowerCase() === query);
    if (targetHolding && char && this.isHoldingOwnerOrMaster(char, targetHolding)) {
      return true;
    }

    // Player workplace
    if (char?.workplaceId && char.workplaceId.toLowerCase() === query) {
      return true;
    }

    return false;
  }

  /**
   * Checks whether a trade contract is known to the character
   */
  static isContractKnown(
    contract: TradeContract,
    holding: EconomyHolding,
    knowledge: CharacterKnowledge,
    player: Character
  ): boolean {
    if (!contract) return false;

    // Check if contract is explicitly in knownContracts
    const contractId = (contract.id || '').toLowerCase();
    const contractName = ((contract as any).name || (contract.partnerName ? `${contract.contractType || 'Vertrag'} mit ${contract.partnerName}` : '')).toLowerCase();
    const knownList = (knowledge.knownContracts || []).map(c => c.toLowerCase());

    if (contractId && knownList.includes(contractId)) return true;
    if (contractName && knownList.includes(contractName)) return true;

    // If player is holding owner or master, they know all contracts of this holding
    if (this.isHoldingOwnerOrMaster(player, holding)) {
      return true;
    }

    // If player is ruler/lord and holding is in their realm, official contracts are known
    if (this.isRulerOrLord(player) && holding.territoryId) {
      return true;
    }

    // Otherwise, an employee or visitor does NOT automatically know the contract!
    return false;
  }

  /**
   * Checks whether an economy task is known to the character
   */
  static isTaskKnown(
    task: EconomyTask,
    holding: EconomyHolding | undefined,
    knowledge: CharacterKnowledge,
    player: Character
  ): boolean {
    if (!task) return false;

    const taskId = (task.id || '').toLowerCase();
    const taskTitle = (task.title || '').toLowerCase();
    const knownList = (knowledge.knownTasks || []).map(t => t.toLowerCase());

    if (taskId && knownList.includes(taskId)) return true;
    if (taskTitle && knownList.includes(taskTitle)) return true;

    // Directly assigned to player
    if (task.assigneeId && task.assigneeId === player.id) return true;
    if (task.assigneeName && task.assigneeName.toLowerCase() === player.name.toLowerCase()) return true;

    // If player is owner/manager of holding, holding tasks are known
    if (holding && this.isHoldingOwnerOrMaster(player, holding)) {
      return true;
    }

    // If player is a ruler/lord and task is an administrative/public task
    if (this.isRulerOrLord(player) && (task.priority === 'urgent' || task.priority === 'high')) {
      return true;
    }

    return false;
  }

  /**
   * Checks whether an economy duty is known to the character
   */
  static isDutyKnown(
    duty: EconomyDuty,
    holding: EconomyHolding | undefined,
    knowledge: CharacterKnowledge,
    player: Character
  ): boolean {
    if (!duty) return false;

    const dutyId = (duty.id || '').toLowerCase();
    const knownList = (knowledge.knownDuties || []).map(d => d.toLowerCase());

    if (dutyId && knownList.includes(dutyId)) return true;

    // Assigned to player's role or id
    const assignedRole = duty.assignedRoleName || duty.assigneeRole;
    if (duty.assigneeId && duty.assigneeId === player.id) return true;
    if (assignedRole && player.role && player.role.toLowerCase().includes(assignedRole.toLowerCase())) return true;
    if (assignedRole && player.profession && player.profession.toLowerCase().includes(assignedRole.toLowerCase())) return true;

    if (holding && this.isHoldingOwnerOrMaster(player, holding)) {
      return true;
    }

    return false;
  }

  /**
   * Returns all tasks across holdings and player that are known and pending/in_progress
   */
  static getKnownPendingTasks(adventure: Adventure): EconomyTask[] {
    const knowledge = this.getEffectiveKnowledge(adventure);
    const holdings = adventure.world?.economyConfig?.holdings || [];
    const player = adventure.player;
    const taskMap = new Map<string, EconomyTask>();

    // Player personal tasks
    if (Array.isArray(player.tasks)) {
      player.tasks.forEach(t => {
        if (t.status === 'pending' || t.status === 'in_progress') {
          if (this.isTaskKnown(t, undefined, knowledge, player)) {
            taskMap.set(t.id, t);
          }
        }
      });
    }

    // Holding tasks
    holdings.forEach(h => {
      if (Array.isArray(h.tasks)) {
        h.tasks.forEach(t => {
          if (t.status === 'pending' || t.status === 'in_progress') {
            if (this.isTaskKnown(t, h, knowledge, player)) {
              taskMap.set(t.id, t);
            }
          }
        });
      }
    });

    return Array.from(taskMap.values());
  }

  /**
   * Returns known contracts for a specific holding (or all known contracts in world)
   */
  static getKnownContracts(adventure: Adventure, holding?: EconomyHolding | null): TradeContract[] {
    const knowledge = this.getEffectiveKnowledge(adventure);
    const holdings = adventure.world?.economyConfig?.holdings || [];
    const player = adventure.player;
    const targetHoldings = holding ? [holding] : holdings;
    const knownContracts: TradeContract[] = [];

    targetHoldings.forEach(h => {
      if (Array.isArray(h.contracts)) {
        h.contracts.forEach(c => {
          if (this.isContractKnown(c, h, knowledge, player)) {
            knownContracts.push(c);
          }
        });
      }
    });

    return knownContracts;
  }

  /**
   * Adds new knowledge to an adventure immutably, preserving existing state
   */
  static addKnowledgeEntry(
    adventure: Adventure,
    entry: {
      category: CharacterKnowledgeEntry['category'];
      entityId: string;
      entityName: string;
      summary?: string;
      sourceType: InformationSourceType;
      sourceCharacterId?: string;
      sourceCharacterName?: string;
      reliability?: 'certain' | 'likely' | 'uncertain' | 'rumor';
      description?: string;
    }
  ): Adventure {
    const currentKnowledge = this.getEffectiveKnowledge(adventure);
    const entityId = entry.entityId.trim();
    const entityName = entry.entityName.trim();

    // Check if already in knowledge lists
    let isAlreadyKnown = false;
    if (entry.category === 'location') {
      isAlreadyKnown = (currentKnowledge.knownLocations || []).some(
        l => l.toLowerCase() === entityId.toLowerCase() || l.toLowerCase() === entityName.toLowerCase()
      );
    } else if (entry.category === 'contract') {
      isAlreadyKnown = (currentKnowledge.knownContracts || []).some(
        c => c.toLowerCase() === entityId.toLowerCase() || c.toLowerCase() === entityName.toLowerCase()
      );
    } else if (entry.category === 'task') {
      isAlreadyKnown = (currentKnowledge.knownTasks || []).some(
        t => t.toLowerCase() === entityId.toLowerCase() || t.toLowerCase() === entityName.toLowerCase()
      );
    } else if (entry.category === 'holding') {
      isAlreadyKnown = (currentKnowledge.knownHoldings || []).some(
        h => h.toLowerCase() === entityId.toLowerCase() || h.toLowerCase() === entityName.toLowerCase()
      );
    }

    if (isAlreadyKnown) {
      return adventure;
    }

    const eventId = `info_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const event: InformationEvent = {
      id: eventId,
      informationType: (entry.category as InformationType) || 'report',
      sourceType: entry.sourceType,
      sourceCharacterId: entry.sourceCharacterId,
      sourceCharacterName: entry.sourceCharacterName,
      targetEntityId: entityId,
      targetEntityType: entry.category,
      reliability: entry.reliability || 'certain',
      revealedAt: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      description: entry.description || entry.summary
    };

    const newKnowledgeEntry: CharacterKnowledgeEntry = {
      id: `know_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      category: entry.category,
      entityId,
      entityName,
      summary: entry.summary || entry.description,
      sourceEvent: event,
      discoveredAt: event.revealedAt,
      isNew: true,
      isRelevant: true
    };

    const updatedKnownLocations = [...(currentKnowledge.knownLocations || [])];
    const updatedKnownContracts = [...(currentKnowledge.knownContracts || [])];
    const updatedKnownTasks = [...(currentKnowledge.knownTasks || [])];
    const updatedKnownHoldings = [...(currentKnowledge.knownHoldings || [])];
    const updatedKnownCharacters = [...(currentKnowledge.knownCharacters || [])];
    const updatedKnownSuppliers = [...(currentKnowledge.knownSuppliers || [])];

    if (entry.category === 'location') {
      updatedKnownLocations.push(entityName || entityId);
    } else if (entry.category === 'contract') {
      updatedKnownContracts.push(entityId);
    } else if (entry.category === 'task') {
      updatedKnownTasks.push(entityId);
    } else if (entry.category === 'holding') {
      updatedKnownHoldings.push(entityName || entityId);
    } else if (entry.category === 'character') {
      updatedKnownCharacters.push(entityName || entityId);
    } else if (entry.category === 'supplier') {
      updatedKnownSuppliers.push(entityName || entityId);
    }

    const updatedDiscovered = [newKnowledgeEntry, ...(currentKnowledge.discoveredInformation || [])];
    const updatedEvents = [event, ...(currentKnowledge.events || [])];

    const nextKnowledge: CharacterKnowledge = {
      ...currentKnowledge,
      knownLocations: updatedKnownLocations,
      knownContracts: updatedKnownContracts,
      knownTasks: updatedKnownTasks,
      knownHoldings: updatedKnownHoldings,
      knownCharacters: updatedKnownCharacters,
      knownSuppliers: updatedKnownSuppliers,
      discoveredInformation: updatedDiscovered,
      events: updatedEvents
    };

    return {
      ...adventure,
      characterKnowledge: nextKnowledge,
      player: {
        ...adventure.player,
        characterKnowledge: nextKnowledge
      },
      storyState: adventure.storyState ? {
        ...adventure.storyState,
        characterKnowledge: nextKnowledge
      } : undefined
    };
  }

  /**
   * Marks all or specific knowledge entries as acknowledged / read (clearing "new" badge)
   */
  static markKnowledgeAsRead(adventure: Adventure, entryId?: string): Adventure {
    const current = this.getEffectiveKnowledge(adventure);
    const updatedDiscovered = (current.discoveredInformation || []).map(entry => {
      if (!entryId || entry.id === entryId) {
        return { ...entry, isNew: false };
      }
      return entry;
    });

    const nextKnowledge: CharacterKnowledge = {
      ...current,
      discoveredInformation: updatedDiscovered
    };

    return {
      ...adventure,
      characterKnowledge: nextKnowledge,
      player: {
        ...adventure.player,
        characterKnowledge: nextKnowledge
      }
    };
  }

  /**
   * Parses AI responses for [[KNOWLEDGE_ADD: Typ | Name/ID | Quelle | Notiz]] tags
   * and integrates them into the character's knowledge state
   */
  static parseKnowledgeTagsFromAI(aiResponseText: string, adventure: Adventure): Adventure {
    if (!aiResponseText || !aiResponseText.includes('[[KNOWLEDGE_ADD:')) {
      return adventure;
    }

    let updated = adventure;
    const regex = /\[\[KNOWLEDGE_ADD:\s*([^|\]]+)\s*\|\s*([^|\]]+)(?:\s*\|\s*([^|\]]+))?(?:\s*\|\s*([^|\]]+))?\]\]/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(aiResponseText)) !== null) {
      const categoryRaw = (match[1] || '').trim().toLowerCase();
      const entity = (match[2] || '').trim();
      const source = (match[3] || '').trim() || 'story';
      const summary = (match[4] || '').trim() || `Information über ${entity} erhalten`;

      let category: CharacterKnowledgeEntry['category'] = 'report';
      if (/ort|stadt|dorf|region|location/i.test(categoryRaw)) category = 'location';
      else if (/vertrag|contract|trade/i.test(categoryRaw)) category = 'contract';
      else if (/aufgabe|task|pflicht|duty/i.test(categoryRaw)) category = 'task';
      else if (/betrieb|holding|gebäude|taverne|brauerei/i.test(categoryRaw)) category = 'holding';
      else if (/person|charakter|npc/i.test(categoryRaw)) category = 'character';
      else if (/lieferant|supplier|händler/i.test(categoryRaw)) category = 'supplier';

      let sourceType: InformationSourceType = 'story';
      if (/npc|figur|person|gespräch/i.test(source)) sourceType = 'npc';
      else if (/bericht|dokument|brief|briefe/i.test(source)) sourceType = 'report';
      else if (/beobacht/i.test(source)) sourceType = 'observation';
      else if (/erlebnis|erfahrung/i.test(source)) sourceType = 'experience';

      updated = this.addKnowledgeEntry(updated, {
        category,
        entityId: entity,
        entityName: entity,
        summary,
        sourceType,
        sourceCharacterName: source,
        reliability: 'certain'
      });
    }

    return updated;
  }
}
