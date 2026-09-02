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
  
  const typeStr = isLore
    ? (entry as LoreEntry).details?.type || (entry as LoreEntry).category
    : (entry as Territory).poiType || (entry as Territory).type;
  
  const title = isLore ? (entry as LoreEntry).title : (entry as Territory).name;
  const description = entry.description || '';
  const combined = `${typeStr} ${title} ${description}`.toLowerCase();

  // Keyword mapping to EconomyHolding['type']
  if (combined.includes('taverne') || combined.includes('schänke') || combined.includes('gasthof') || combined.includes('wirtshaus') || combined.includes('spelunke')) return 'taverne';
  if (combined.includes('schmiede')) return 'schmiede';
  if (combined.includes('mine') || combined.includes('steinbruch') || combined.includes('grabung')) return 'mine';
  if (combined.includes('handels') || combined.includes('kontor') || combined.includes('laden') || combined.includes('markt') || combined.includes('haendler') || combined.includes('kaufhaus')) return 'haendler';
  if (combined.includes('anwesen') || combined.includes('landgut') || combined.includes('villa')) return 'anwesen';
  if (combined.includes('burg') || combined.includes('festung') || combined.includes('schloss') || combined.includes('fort') || combined.includes('palast') || combined.includes('residenz') || combined.includes('kastell')) return 'burg';
  if (combined.includes('bauernhof') || combined.includes('farm') || combined.includes('mühle') || combined.includes('plantage') || combined.includes('gutshof')) return 'bauernhof';
  if (combined.includes('werft') || combined.includes('dock')) return 'werft';
  if (combined.includes('hafen')) return 'hafenbetrieb';
  if (combined.includes('bäckerei') || combined.includes('baeckerei')) return 'baeckerei';
  if (combined.includes('werkstatt') || combined.includes('atelier')) return 'werkstatt';
  if (combined.includes('gilde') || combined.includes('meisterbund')) return 'gilde';
  if (combined.includes('gasthaus') || combined.includes('herberge') || combined.includes('hotel')) return 'gasthaus';
  if (combined.includes('sägewerk') || combined.includes('saegewerk')) return 'saegewerk';
  if (combined.includes('manufaktur') || combined.includes('weberei')) return 'manufaktur';
  if (combined.includes('magierladen') || combined.includes('labor')) return 'magierladen';
  if (combined.includes('adelssitz')) return 'adelssitz';
  if (combined.includes('koenigreich') || combined.includes('provinz')) return 'koenigreich';
  if (combined.includes('schiff') || combined.includes('fregatte') || combined.includes('galeone')) return 'schiff';
  if (combined.includes('fraktion') || combined.includes('orden')) return 'fraktionsgebaeude';

  // Specific check for categories in Lore
  if (isLore) {
    const cat = (entry as LoreEntry).category;
    if (cat === 'Orte') {
      // If it's a place but didn't match keywords, maybe it's custom
      // but we only want to auto-sync likely businesses.
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
  const ownerFactionId = isLore ? details?.ownerFactionId : (source as Territory).ownerFactionId;
  const ownerCharacterId = isLore ? details?.ownerCharacterId : (source as Territory).ownerCharacterId;
  const controlledByFactionId = isLore ? details?.controlledByFactionId : (source as Territory).controlledByFactionId;
  const ownerType = isLore ? details?.ownerType : undefined;

  let controlledByFactionName = undefined;
  if (controlledByFactionId && loreDatabase) {
    const faction = loreDatabase.find(f => f.id === controlledByFactionId);
    if (faction) controlledByFactionName = faction.title;
  }

  return {
    id,
    name,
    type,
    icon: preset.icon,
    description: description || preset.description,
    level: 1,
    ownerType: (ownerType as any) || (ownerFactionId ? 'faction' : ownerCharacterId ? 'character' : 'user'),
    ownerFactionId,
    ownerCharacterId,
    controlledByFactionId,
    controlledByFactionName,
    loreEntryId: isLore ? source.id : (source as Territory).loreEntryId,
    territoryId: isLore ? undefined : source.id,
    incomePerInterval: preset.defaultIncome,
    upkeepPerInterval: preset.defaultUpkeep,
    staffCount: assets.staffGroups.reduce((acc, g) => acc + (g.count || 0), 0) || 5,
    reputation: 50,
    status: 'active',
    locationName: isLore ? '' : (source as Territory).name,
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
    
    physicalCondition: 'Gut',
    physicalSize: 'Mittel',
    physicalCapacity: 'Standard-Kapazität',
    physicalUsage: 'Gewerbe & Betrieb',
    
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
    l.category !== 'Orte' && 
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
    category: 'Orte',
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
      (l.category === 'Orte' && l.title.trim().toLowerCase() === h.name.trim().toLowerCase())
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
    if (entry.category === 'Orte') {
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
    const manageableTerrTypes = ['gebäude', 'ort', 'stadt', 'burg', 'hafen', 'festung', 'mine', 'dorf'];
    if (manageableTerrTypes.includes(terr.type.toLowerCase()) || terr.poiType) {
      const type = detectHoldingType(terr);
      if (type) {
        const existingIndex = updatedHoldings.findIndex(h => 
          h.territoryId === terr.id || 
          h.id === `holding-terr-${terr.id}` ||
          (terr.loreEntryId && h.loreEntryId === terr.loreEntryId) ||
          h.name.trim().toLowerCase() === terr.name.trim().toLowerCase()
        );
        
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
          if (terr.ownerFactionId && existing.ownerFactionId !== terr.ownerFactionId) {
            existing.ownerFactionId = terr.ownerFactionId;
            existing.ownerType = 'faction';
            holdingChanged = true;
          }
          if (terr.ownerCharacterId && existing.ownerCharacterId !== terr.ownerCharacterId) {
            existing.ownerCharacterId = terr.ownerCharacterId;
            existing.ownerType = 'character';
            holdingChanged = true;
          }
          if (terr.controlledByFactionId && existing.controlledByFactionId !== terr.controlledByFactionId) {
            existing.controlledByFactionId = terr.controlledByFactionId;
            const faction = loreDatabase.find(f => f.id === terr.controlledByFactionId);
            if (faction) existing.controlledByFactionName = faction.title;
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

  return { 
    updatedEconomy: changed ? { ...economy, holdings: updatedHoldings } : economy, 
    changed 
  };
};
