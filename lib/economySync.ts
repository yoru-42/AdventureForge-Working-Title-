import { 
  WorldSetting, 
  LoreEntry, 
  Territory, 
  EconomyHolding, 
  EconomyConfig
} from '../types';
import { HOLDING_TYPES, getHoldingPresets } from '../components/economy/EconomyPresets';

/**
 * Detects if a lore entry or territory is a manageable economy holding.
 * Uses keywords and type fields to match against HOLDING_TYPES.
 */
export const detectHoldingType = (entry: LoreEntry | Territory): EconomyHolding['type'] | null => {
  const isLore = (entry as any).category !== undefined;
  
  const rawType = isLore
    ? ((entry as LoreEntry).details?.type || (entry as LoreEntry).category)
    : ((entry as Territory).poiType || (entry as Territory).type);
  
  const title = isLore ? (entry as LoreEntry).title : (entry as Territory).name;
  const description = entry.description || '';
  const factionName = isLore 
    ? ((entry as LoreEntry).details?.faction || (entry as LoreEntry).details?.factionName) 
    : (entry as Territory).faction;
  const combined = `${rawType} ${title} ${description} ${factionName || ''}`.toLowerCase();

  // Keyword mapping to EconomyHolding['type']
  if (combined.includes('taverne') || combined.includes('schänke') || combined.includes('gasthof') || combined.includes('wirtshaus') || combined.includes('spelunke') || combined.includes('kneipe')) return 'taverne';
  if (combined.includes('schmiede') || combined.includes('waffenschmiede')) return 'schmiede';
  if (combined.includes('mine') || combined.includes('steinbruch') || combined.includes('grabung') || combined.includes('erzmine')) return 'mine';
  if (combined.includes('handels') || combined.includes('kontor') || combined.includes('laden') || combined.includes('markt') || combined.includes('haendler') || combined.includes('kaufhaus') || combined.includes('geschäft') || combined.includes('krämerei')) return 'haendler';
  if (combined.includes('anwesen') || combined.includes('landgut') || combined.includes('villa') || combined.includes('gutshof')) return 'anwesen';
  if (combined.includes('burg') || combined.includes('festung') || combined.includes('schloss') || combined.includes('fort') || combined.includes('palast') || combined.includes('residenz') || combined.includes('kastell') || combined.includes('zitadelle')) return 'burg';
  if (combined.includes('bauernhof') || combined.includes('farm') || combined.includes('mühle') || combined.includes('plantage')) return 'bauernhof';
  if (combined.includes('werft') || combined.includes('dock') || combined.includes('trockendock')) return 'werft';
  if (combined.includes('hafenbetrieb') || combined.includes('zollstation') || combined.includes('hafenamt') || combined.includes('hafen')) return 'hafenbetrieb';
  if (combined.includes('bäckerei') || combined.includes('baeckerei') || combined.includes('konditorei')) return 'baeckerei';
  if (combined.includes('werkstatt') || combined.includes('atelier') || combined.includes('gießerei')) return 'werkstatt';
  if (combined.includes('gilde') || combined.includes('meisterbund') || combined.includes('zunft') || combined.includes('gildenhaus')) return 'gilde';
  if (combined.includes('gasthaus') || combined.includes('herberge') || combined.includes('hotel') || combined.includes('pension')) return 'gasthaus';
  if (combined.includes('sägewerk') || combined.includes('saegewerk') || combined.includes('holzlager')) return 'saegewerk';
  if (combined.includes('manufaktur') || combined.includes('weberei') || combined.includes('spinnerei')) return 'manufaktur';
  if (combined.includes('magierladen') || combined.includes('labor') || combined.includes('zauberladen') || combined.includes('apotheke') || combined.includes('magiergilde')) return 'magierladen';
  if (combined.includes('adelssitz') || combined.includes('stadtpalais')) return 'adelssitz';
  if (combined.includes('koenigreich') || combined.includes('provinz') || combined.includes('reich') || combined.includes('herzogtum')) return 'koenigreich';
  if (combined.includes('schiff') || combined.includes('fregatte') || combined.includes('galeone') || combined.includes('kutter') || combined.includes('boot')) return 'schiff';
  if (combined.includes('fraktion') || combined.includes('orden') || combined.includes('hauptquartier') || combined.includes('stützpunkt') || combined.includes('stuetzpunkt') || combined.includes('garnison') || combined.includes('kaserne') || combined.includes('zentrale')) return 'fraktionsgebaeude';

  // Fallbacks for manageable entry types
  if (!isLore) {
    const terrType = ((entry as Territory).type || '').toLowerCase();
    const poiType = ((entry as Territory).poiType || '').toLowerCase();
    const manageableTypes = ['gebäude', 'gebaeude', 'ort', 'stadt', 'dorf', 'festung', 'burg', 'hafen', 'mine', 'anwesen', 'gilde', 'lager', 'kontor', 'schloss', 'turm', 'tempel', 'ruine', 'residenz', 'zone', 'unabhaengiges_gebiet'];
    if (manageableTypes.includes(terrType) || poiType) {
      if (factionName || (entry as Territory).controlledByFactionId || (entry as Territory).ownerFactionId) {
        return 'fraktionsgebaeude';
      }
      if (terrType === 'festung' || terrType === 'burg') return 'burg';
      if (terrType === 'hafen') return 'hafenbetrieb';
      if (terrType === 'mine') return 'mine';
      if (terrType === 'stadt' || terrType === 'dorf') return 'koenigreich';
      return 'anwesen';
    }
  } else {
    const cat = (entry as LoreEntry).category as string;
    if (cat === 'Orte' || cat === 'Gebäude' || cat === 'Weltkarte') {
      if (factionName || (entry as LoreEntry).details?.controlledByFactionId) return 'fraktionsgebaeude';
      return 'anwesen';
    }
  }

  return null;
};

/**
 * Creates a new EconomyHolding from a LoreEntry or Territory.
 */
export const createHoldingFromSource = (
  source: LoreEntry | Territory, 
  type: EconomyHolding['type'],
  loreDatabase?: LoreEntry[]
): EconomyHolding => {
  const preset = HOLDING_TYPES.find(t => t.type === type) || HOLDING_TYPES[0];
  const assets = getHoldingPresets(preset.type);
  
  const isLore = (source as any).category !== undefined;
  const name = isLore ? (source as LoreEntry).title : (source as Territory).name;
  const description = source.description;
  const id = isLore ? `holding-lore-${source.id}` : `holding-terr-${source.id}`;
  
  const details = isLore ? (source as LoreEntry).details : {};
  
  // Resolve Faction
  const rawFactionName = isLore 
    ? (details?.faction || details?.factionName) 
    : (source as Territory).faction;
  let ownerFactionId = isLore ? details?.ownerFactionId : (source as Territory).ownerFactionId;
  let controlledByFactionId = isLore ? details?.controlledByFactionId : (source as Territory).controlledByFactionId;
  
  let ownerFactionName: string | undefined = undefined;
  let controlledByFactionName: string | undefined = rawFactionName || undefined;

  if (loreDatabase) {
    const matchedFaction = loreDatabase.find(f => f.category === 'Fraktionen' && (
      (ownerFactionId && f.id === ownerFactionId) ||
      (controlledByFactionId && f.id === controlledByFactionId) ||
      (rawFactionName && f.title?.trim().toLowerCase() === rawFactionName.trim().toLowerCase())
    ));

    if (matchedFaction) {
      ownerFactionId = matchedFaction.id;
      controlledByFactionId = matchedFaction.id;
      ownerFactionName = matchedFaction.title;
      controlledByFactionName = matchedFaction.title;
    }
  }

  if (!ownerFactionName && rawFactionName) {
    ownerFactionName = rawFactionName;
  }

  const ownerCharacterId = isLore ? details?.ownerCharacterId : (source as Territory).ownerCharacterId;
  const ownerType = (ownerFactionId || controlledByFactionId || rawFactionName) ? 'faction' : ownerCharacterId ? 'character' : 'user';

  // Resolve Ruler / Manager
  const ruler = isLore ? (details?.ruler || details?.leader) : ((source as Territory).ruler || (source as Territory).ownerCharacterId);
  const assignedCharacterName = ruler || (ownerFactionName ? `${ownerFactionName}-Verwalter` : 'Spieler');

  const rawType = isLore ? (details?.type || (source as LoreEntry).category) : ((source as Territory).poiType || (source as Territory).type);
  const population = isLore ? details?.population : (source as Territory).population;

  const physicalCondition = details?.physicalCondition || 'Gut';
  const physicalSize = details?.physicalSize || (['stadt', 'burg', 'koenigreich', 'festung'].includes((rawType || '').toLowerCase()) ? 'Groß' : 'Mittel');
  const physicalUsage = details?.physicalUsage || `${preset.label} (${rawType || 'Gebäude'})`;
  const physicalCapacity = details?.capacity || (population ? `${population} Kapazität` : 'Standard-Kapazität');
  const roomsOrAreas = details?.rooms || (rawFactionName 
    ? `Hauptsaal, Kommandoraum, ${preset.label}-Bereich, Waffen- & Materiallager` 
    : `Empfang, Hauptraum, Lagerbereich, Verwalterbüro`);
  const damages = details?.damages || 'Keine bekannten Schäden / Intakt';
  const accessibility = details?.accessibility || (rawFactionName ? `Zugang für Mitglieder von ${rawFactionName} & Befugte` : 'Öffentlich zugänglich');
  const residentsOrVisitors = details?.residents || (ruler ? `${ruler} & Gefolge` : rawFactionName ? `Mitglieder & Belegschaft von ${rawFactionName}` : 'Einheimische, Händler & Gäste');

  return {
    id,
    name,
    type,
    icon: preset.icon,
    description: description || preset.description,
    level: 1,
    ownerType: ownerType as any,
    ownerFactionId,
    ownerFactionName,
    ownerCharacterId,
    assignedCharacterName,
    controlledByFactionId,
    controlledByFactionName,
    loreEntryId: isLore ? source.id : (source as Territory).loreEntryId,
    territoryId: isLore ? undefined : source.id,
    incomePerInterval: preset.defaultIncome,
    upkeepPerInterval: preset.defaultUpkeep,
    staffCount: assets.staffGroups.reduce((acc, g) => acc + (g.count || 0), 0) || 5,
    reputation: 50,
    status: 'active',
    locationName: isLore ? (details?.locationName || '') : (source as Territory).name,
    budget: preset.defaultIncome * 2,
    storageCapacity: 150,
    upgrades: [
      { id: `upg-${id}-1`, name: 'Hauptausbau Stufe 2', cost: preset.defaultIncome * 2, levelRequired: 1, unlocked: false, description: 'Erhöht die Einnahmen um 50%' }
    ],
    resources: assets.resources.map(r => ({ ...r, id: `res-${id}-${Math.random().toString(36).substring(2, 7)}` })),
    tasks: assets.tasks.map(t => ({ ...t, id: `tsk-${id}-${Math.random().toString(36).substring(2, 7)}` })),
    duties: assets.duties.map(d => ({ ...d, id: `dty-${id}-${Math.random().toString(36).substring(2, 7)}` })),
    roles: assets.roles.map(r => ({ ...r, id: `role-${id}-${Math.random().toString(36).substring(2, 7)}` })),
    staffGroups: assets.staffGroups.map(s => ({ ...s, id: `sg-${id}-${Math.random().toString(36).substring(2, 7)}` })),
    orders: assets.orders.map(o => ({ ...o, id: `ord-${id}-${Math.random().toString(36).substring(2, 7)}` })),
    decisions: assets.decisions.map(d => ({ ...d, id: `dec-${id}-${Math.random().toString(36).substring(2, 7)}` })),
    activityLogs: assets.activityLogs.map(l => ({ ...l, id: `log-${id}-${Math.random().toString(36).substring(2, 7)}` })),
    
    physicalCondition,
    physicalSize,
    physicalCapacity,
    physicalUsage,
    roomsOrAreas,
    damages,
    accessibility,
    residentsOrVisitors,
    
    useResourcesModule: true,
    useStaffModule: true,
    useFinanceModule: true,
    useManagementModule: true,
    useOrdersModule: true,
    useDecisionsModule: true,
    useLogsModule: true
  };
};

/**
 * Removes all lore entries with category 'Orte' or linked to holdings from loreDatabase.
 */
export const removeAllOrteLoreEntries = (loreDatabase: LoreEntry[]): { updatedLoreDatabase: LoreEntry[]; removedCount: number } => {
  const initialLength = loreDatabase.length;
  const updatedLoreDatabase = loreDatabase.filter(l => 
    (l.category as string) !== 'Orte' && 
    (l.category as string) !== 'Weltkarte' &&
    !l.id?.startsWith('lore-holding-') && 
    !l.details?.holdingId
  );
  return {
    updatedLoreDatabase,
    removedCount: initialLength - updatedLoreDatabase.length
  };
};

/**
 * Creates a new LoreEntry from an EconomyHolding so it can be registered into the Codex (optional manual action).
 */
export const createLoreEntryFromHolding = (holding: EconomyHolding): LoreEntry => {
  const preset = HOLDING_TYPES.find(t => t.type === holding.type);
  const typeLabel = preset ? preset.label : holding.type;
  
  return {
    id: holding.loreEntryId || `lore-holding-${holding.id}`,
    category: 'Weltregeln',
    title: holding.name,
    description: holding.description || `Ein(e) ${typeLabel} (${holding.locationName ? 'in ' + holding.locationName : 'Wirtschaftsbetrieb'}).`,
    isUnlocked: true,
    details: {
      type: holding.type,
      locationName: holding.locationName,
      ownerType: holding.ownerType,
      ownerFactionId: holding.ownerFactionId,
      ownerCharacterId: holding.ownerCharacterId,
      controlledByFactionId: holding.controlledByFactionId,
      incomePerInterval: holding.incomePerInterval,
      upkeepPerInterval: holding.upkeepPerInterval,
      holdingId: holding.id,
      physicalCondition: holding.physicalCondition,
      physicalSize: holding.physicalSize
    }
  };
};

/**
 * Registers all holdings into the loreDatabase (Codex) that are not yet registered.
 */
export const registerAllHoldingsInCodex = (
  economy: EconomyConfig,
  loreDatabase: LoreEntry[]
): { updatedLoreDatabase: LoreEntry[]; updatedEconomy: EconomyConfig; newCount: number } => {
  const newLoreEntries: LoreEntry[] = [];
  const updatedHoldings = economy.holdings.map(h => {
    const existingLore = loreDatabase.find(l => 
      l.id === h.loreEntryId || 
      (l.title.trim().toLowerCase() === h.name.trim().toLowerCase())
    );

    if (existingLore) {
      if (h.loreEntryId !== existingLore.id) {
        return { ...h, loreEntryId: existingLore.id };
      }
      return h;
    }

    // Create new LoreEntry for Codex
    const newEntry = createLoreEntryFromHolding(h);
    newLoreEntries.push(newEntry);
    return { ...h, loreEntryId: newEntry.id };
  });

  return {
    updatedLoreDatabase: [...loreDatabase, ...newLoreEntries],
    updatedEconomy: { ...economy, holdings: updatedHoldings },
    newCount: newLoreEntries.length
  };
};

/**
 * Synchronizes the economy configuration with the current world state.
 * Scans lore database and territories for manageable buildings.
 */
export const syncEconomyWithWorld = (
  economy: EconomyConfig,
  loreDatabase: LoreEntry[],
  territories: Territory[],
  strictCodexSync: boolean = false
): { updatedEconomy: EconomyConfig; changed: boolean } => {
  let updatedHoldings = [...economy.holdings];
  let changed = false;

  // 1. Process Lore Entries (Codex)
  loreDatabase.forEach(entry => {
    if ((entry.category as string) === 'Orte' || (entry.category as string) === 'Weltkarte' || entry.category === 'Weltregeln') {
      const type = detectHoldingType(entry);
      if (type) {
        const existingIndex = updatedHoldings.findIndex(h => 
          h.loreEntryId === entry.id || 
          h.id === `holding-lore-${entry.id}` ||
          h.name.trim().toLowerCase() === entry.title.trim().toLowerCase()
        );
        if (existingIndex !== -1) {
          const existing = updatedHoldings[existingIndex];
          let holdingChanged = false;
          
          if (!existing.loreEntryId) {
            existing.loreEntryId = entry.id;
            holdingChanged = true;
          }

          if (existing.name !== entry.title) {
            existing.name = entry.title;
            holdingChanged = true;
          }
          
          const details = entry.details || {};
          const ownerFactionId = details.ownerFactionId;
          const ownerCharacterId = details.ownerCharacterId;
          const controlledByFactionId = details.controlledByFactionId;
          
          if (ownerFactionId && existing.ownerFactionId !== ownerFactionId) {
            existing.ownerFactionId = ownerFactionId;
            existing.ownerType = 'faction';
            holdingChanged = true;
          }
          if (ownerCharacterId && existing.ownerCharacterId !== ownerCharacterId) {
            existing.ownerCharacterId = ownerCharacterId;
            existing.ownerType = 'character';
            holdingChanged = true;
          }
          if (controlledByFactionId && existing.controlledByFactionId !== controlledByFactionId) {
            existing.controlledByFactionId = controlledByFactionId;
            const faction = loreDatabase.find(f => f.id === controlledByFactionId);
            if (faction) existing.controlledByFactionName = faction.title;
            holdingChanged = true;
          }
          
          if (holdingChanged) {
            updatedHoldings[existingIndex] = { ...existing };
            changed = true;
          }
        } else {
          // Add new holding from codex
          updatedHoldings.push(createHoldingFromSource(entry, type, loreDatabase));
          changed = true;
        }
      }
    }
  });

  // 2. Process Territories (Map)
  territories.forEach(terr => {
    const manageableTerrTypes = ['gebäude', 'gebaeude', 'ort', 'stadt', 'burg', 'hafen', 'festung', 'mine', 'dorf', 'anwesen', 'gilde', 'lager', 'kontor', 'schloss', 'turm', 'tempel', 'ruine', 'residenz', 'zone', 'unabhaengiges_gebiet'];
    if (manageableTerrTypes.includes((terr.type || '').toLowerCase()) || terr.poiType) {
      const type = detectHoldingType(terr);
      if (type) {
        const existingIndex = updatedHoldings.findIndex(h => 
          h.territoryId === terr.id || 
          h.id === `holding-terr-${terr.id}` ||
          (terr.loreEntryId && h.loreEntryId === terr.loreEntryId) ||
          h.name.trim().toLowerCase() === terr.name.trim().toLowerCase()
        );

        // Resolve faction for this territory
        const rawFactionName = terr.faction;
        let matchedFaction = loreDatabase.find(f => f.category === 'Fraktionen' && (
          (terr.controlledByFactionId && f.id === terr.controlledByFactionId) ||
          (terr.ownerFactionId && f.id === terr.ownerFactionId) ||
          (rawFactionName && f.title?.trim().toLowerCase() === rawFactionName.trim().toLowerCase())
        ));

        const resolvedFactionId = matchedFaction ? matchedFaction.id : (terr.controlledByFactionId || terr.ownerFactionId);
        const resolvedFactionName = matchedFaction ? matchedFaction.title : rawFactionName;
        
        if (existingIndex !== -1) {
          const existing = updatedHoldings[existingIndex];
          let holdingChanged = false;

          if (existing.name !== terr.name) {
            existing.name = terr.name;
            holdingChanged = true;
          }
          if (!existing.territoryId) {
            existing.territoryId = terr.id;
            holdingChanged = true;
          }
          if (!existing.locationName || existing.locationName !== terr.name) {
            existing.locationName = terr.name;
            holdingChanged = true;
          }

          if (resolvedFactionId && (existing.controlledByFactionId !== resolvedFactionId || existing.ownerFactionId !== resolvedFactionId)) {
            existing.controlledByFactionId = resolvedFactionId;
            existing.ownerFactionId = resolvedFactionId;
            existing.ownerFactionName = resolvedFactionName;
            existing.controlledByFactionName = resolvedFactionName;
            existing.ownerType = 'faction';
            holdingChanged = true;
          } else if (resolvedFactionName && existing.controlledByFactionName !== resolvedFactionName) {
            existing.controlledByFactionName = resolvedFactionName;
            existing.ownerFactionName = resolvedFactionName;
            existing.ownerType = 'faction';
            holdingChanged = true;
          }

          if (terr.ruler && existing.assignedCharacterName !== terr.ruler) {
            existing.assignedCharacterName = terr.ruler;
            holdingChanged = true;
          }

          if (terr.description && existing.description !== terr.description) {
            existing.description = terr.description;
            holdingChanged = true;
          }

          if (resolvedFactionName && (!existing.accessibility || existing.accessibility === 'Öffentlich zugänglich')) {
            existing.accessibility = `Zugang für Mitglieder von ${resolvedFactionName} & Befugte`;
            holdingChanged = true;
          }

          if (resolvedFactionName && (!existing.residentsOrVisitors || existing.residentsOrVisitors.includes('Einheimische'))) {
            existing.residentsOrVisitors = terr.ruler 
              ? `${terr.ruler} & Gefolge von ${resolvedFactionName}`
              : `Mitglieder & Belegschaft von ${resolvedFactionName}`;
            holdingChanged = true;
          }

          if (holdingChanged) {
            updatedHoldings[existingIndex] = { ...existing };
            changed = true;
          }
        } else {
          // Add new holding from map
          updatedHoldings.push(createHoldingFromSource(terr, type, loreDatabase));
          changed = true;
        }
      }
    }
  });

  // 3. If strictCodexSync is enabled, keep ONLY holdings that exist in LoreDatabase (or Territory)
  if (strictCodexSync) {
    const validHoldings = updatedHoldings.filter(h => {
      const existsInLore = loreDatabase.some(l => 
        l.id === h.loreEntryId || 
        l.title.trim().toLowerCase() === h.name.trim().toLowerCase()
      );
      const existsInTerr = territories.some(t => 
        t.id === h.territoryId || 
        t.name.trim().toLowerCase() === h.name.trim().toLowerCase()
      );
      return existsInLore || existsInTerr;
    });

    if (validHoldings.length !== updatedHoldings.length) {
      updatedHoldings = validHoldings;
      changed = true;
    }
  }

  // 4. Synchronize faction & lore members into key personnel / roles for each holding
  updatedHoldings = updatedHoldings.map(h => {
    const { updatedRoles, changed: rolesChanged } = syncHoldingRolesFromLoreMembers(h, loreDatabase);
    if (rolesChanged) {
      changed = true;
      return { ...h, roles: updatedRoles };
    }
    return h;
  });

  return { 
    updatedEconomy: changed ? { ...economy, holdings: updatedHoldings } : economy, 
    changed 
  };
};

/**
 * Synchronizes faction and lore database members into key personnel roles for a specific holding.
 */
export const syncHoldingRolesFromLoreMembers = (
  holding: EconomyHolding,
  loreDatabase: LoreEntry[]
): { updatedRoles: EconomyRole[]; changed: boolean } => {
  let changed = false;
  const currentRoles: EconomyRole[] = [...(holding.roles || [])];

  // 1. Find matching direct lore entry for this holding
  const directLore = loreDatabase.find(l => 
    l.id === holding.loreEntryId || 
    l.title.trim().toLowerCase() === holding.name.trim().toLowerCase()
  );

  // 2. Find matching faction lore entry
  const factionName = holding.ownerFactionName || holding.controlledByFactionName || directLore?.details?.faction || directLore?.details?.factionName;
  const factionId = holding.ownerFactionId || holding.controlledByFactionId || directLore?.details?.ownerFactionId || directLore?.details?.controlledByFactionId;

  const factionLore = loreDatabase.find(l => 
    l.category === 'Fraktionen' && (
      (factionId && l.id === factionId) ||
      (factionName && l.title?.trim().toLowerCase() === factionName.trim().toLowerCase())
    )
  );

  // Collect raw members from direct lore entry AND faction lore entry
  const rawMembers: Array<{
    id?: string;
    name: string;
    job?: string;
    tasks?: string;
    characterId?: string;
  }> = [];

  // Direct lore entry members
  if (directLore?.details?.members && Array.isArray(directLore.details.members)) {
    directLore.details.members.forEach((m: any) => {
      if (m.name && m.name.trim()) {
        rawMembers.push({
          id: m.id,
          name: m.name.trim(),
          job: m.job || m.role,
          tasks: m.tasks || m.duties,
          characterId: m.characterId
        });
      }
    });
  }

  // Faction lore entry members
  if (factionLore?.details?.members && Array.isArray(factionLore.details.members)) {
    factionLore.details.members.forEach((m: any) => {
      if (m.name && m.name.trim()) {
        rawMembers.push({
          id: m.id,
          name: m.name.trim(),
          job: m.job || m.role,
          tasks: m.tasks || m.duties,
          characterId: m.characterId
        });
      }
    });
  }

  // Codex Characters matching this faction or location
  const holdingTitleLower = holding.name.trim().toLowerCase();
  const factionTitleLower = factionLore?.title?.trim().toLowerCase() || (factionName ? factionName.trim().toLowerCase() : '');

  loreDatabase.forEach(l => {
    if (l.category === 'Charaktere' || l.category === 'Gegner') {
      const charName = l.title?.trim();
      if (!charName) return;

      const d = l.details || {};
      const cFaction = (d.faction || d.appearance?.faction || d.organization || d.guild || (l as any).faction || '').trim().toLowerCase();
      const cLocation = (d.location || d.locationName || d.currentSituation || '').trim().toLowerCase();

      const matchesFaction = factionTitleLower && cFaction && (cFaction === factionTitleLower || cFaction.includes(factionTitleLower));
      const matchesLocation = holdingTitleLower && cLocation && (cLocation === holdingTitleLower || cLocation.includes(holdingTitleLower));

      if (matchesFaction || matchesLocation) {
        const charJob = d.profession || d.jobTitle || d.role || d.appearance?.role || d.job || 'Mitglied';
        const charTasks = d.professionDescription || d.craftingSkills || d.talents || d.notes || '';
        rawMembers.push({
          id: `codex-${l.id}`,
          name: charName,
          job: charJob,
          tasks: charTasks,
          characterId: l.id
        });
      }
    }
  });

  // Deduplicate rawMembers by normalized name
  const memberMap = new Map<string, {
    id?: string;
    name: string;
    job?: string;
    tasks?: string;
    characterId?: string;
  }>();

  rawMembers.forEach(m => {
    const key = m.name.toLowerCase();
    const existing = memberMap.get(key);
    if (!existing) {
      memberMap.set(key, m);
    } else {
      memberMap.set(key, {
        id: existing.id || m.id,
        name: existing.name,
        job: (existing.job && existing.job !== 'Mitglied' && existing.job !== 'Mitarbeiter') ? existing.job : (m.job || existing.job),
        tasks: existing.tasks || m.tasks,
        characterId: existing.characterId || m.characterId
      });
    }
  });

  // Sync unique members into currentRoles
  const updatedRoles = [...currentRoles];

  memberMap.forEach(m => {
    const normName = m.name.toLowerCase();
    const existingRoleIndex = updatedRoles.findIndex(r => 
      (r.assignedToName && r.assignedToName.trim().toLowerCase() === normName) ||
      (m.characterId && r.assignedCharacterId === m.characterId)
    );

    const jobTitle = m.job && m.job.trim() ? m.job.trim() : 'Mitarbeiter';
    const taskList = m.tasks && m.tasks.trim() ? [m.tasks.trim()] : [`Tätigkeiten als ${jobTitle}`];

    if (existingRoleIndex !== -1) {
      const existing = updatedRoles[existingRoleIndex];
      let roleChanged = false;

      if (existing.name !== jobTitle && jobTitle !== 'Mitarbeiter' && jobTitle !== 'Mitglied') {
        existing.name = jobTitle;
        roleChanged = true;
      }

      if (m.characterId && existing.assignedCharacterId !== m.characterId) {
        existing.assignedCharacterId = m.characterId;
        roleChanged = true;
      }

      if (m.tasks && (!existing.responsibilities || existing.responsibilities.length === 0 || existing.responsibilities[0] === `Tätigkeiten als ${existing.name}`)) {
        existing.responsibilities = taskList;
        roleChanged = true;
      }

      if (roleChanged) {
        updatedRoles[existingRoleIndex] = { ...existing };
        changed = true;
      }
    } else {
      const jobLower = jobTitle.toLowerCase();
      let defaultSalary = 15;
      if (jobLower.includes('wirt') || jobLower.includes('verwalter') || jobLower.includes('besitzer') || jobLower.includes('leiter') || jobLower.includes('führung') || jobLower.includes('inhaber')) {
        defaultSalary = 25;
      } else if (jobLower.includes('hilfe') || jobLower.includes('diener') || jobLower.includes('magd')) {
        defaultSalary = 8;
      }

      let area = 'Betriebsgelände';
      if (jobLower.includes('koch') || jobLower.includes('küche')) area = 'Küche';
      else if (jobLower.includes('wirt') || jobLower.includes('tresen') || jobLower.includes('schank')) area = 'Schankraum / Tresen';
      else if (jobLower.includes('kurtisane') || jobLower.includes('unterhaltung') || jobLower.includes('tanz') || jobLower.includes('salon')) area = 'Salon / Empfang';
      else if (jobLower.includes('wache') || jobLower.includes('schutz') || jobLower.includes('sicherheit')) area = 'Eingang & Sicherheit';

      const authorities = ['Aufgaben & Pflichten delegieren'];
      if (jobLower.includes('wirt') || jobLower.includes('verwalter') || jobLower.includes('leiter') || jobLower.includes('inhaber')) {
        authorities.push('Tagesgeschäft leiten', 'Lagerbestände & Einkauf verwalten');
      }

      const newRole: EconomyRole = {
        id: `role-mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: jobTitle,
        assignedToName: m.name,
        assignedCharacterId: m.characterId,
        authorities,
        responsibilities: taskList,
        salary: defaultSalary,
        workplaceArea: area
      };

      updatedRoles.push(newRole);
      changed = true;
    }
  });

  return { updatedRoles, changed };
};
