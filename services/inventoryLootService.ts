import {
  Adventure,
  Character,
  NPC,
  ItemDefinition,
  ItemInstance,
  LootSource,
  LootSourceType,
  PendingPickupProposal,
  PendingItemTransferProposal,
  InventoryNotification,
  CollectionTask,
  WorldDropItem,
  InventorySettings,
  CustomInventoryItem,
  CurrentLocationContext
} from '../types';
import { EquipmentConditionService } from './equipmentConditionService';
import { ProfessionCompetencyService } from './professionCompetencyService';

export class InventoryLootService {
  /**
   * Determine exact weight in kg for an item instance, definition, or custom item.
   */
  public static getItemWeightKg(
    item: Partial<ItemInstance> | Partial<CustomInventoryItem> | Partial<ItemDefinition> | string,
    categoryHint?: string
  ): number {
    if (!item) return 0.5;

    if (typeof item === 'string') {
      const clean = item.trim().toLowerCase();
      return this.inferWeightFromText(clean, categoryHint);
    }

    // 1. Explicit numeric weightKg on ItemInstance
    if (typeof (item as ItemInstance).weightKg === 'number' && (item as ItemInstance).weightKg! >= 0) {
      return (item as ItemInstance).weightKg!;
    }

    // 2. Base weight on ItemDefinition or CustomInventoryItem
    const rawWeight = (item as any).baseWeight || (item as any).weight;
    if (typeof rawWeight === 'number' && rawWeight >= 0) {
      return rawWeight;
    }
    if (typeof rawWeight === 'string' && rawWeight.trim()) {
      const parsed = this.parseWeightString(rawWeight);
      if (parsed !== null) return parsed;
    }

    // 3. Fallback inference by name and category
    const name = ((item as any).name || (item as any).title || '').toLowerCase();
    const cat = categoryHint || (item as any).category || (item as any).subcategory;
    return this.inferWeightFromText(name, cat);
  }

  /**
   * Parse weights like "2.5 kg", "2,5kg", "500g", "0.2"
   */
  public static parseWeightString(str: string): number | null {
    if (!str) return null;
    const clean = str.trim().toLowerCase().replace(',', '.');
    if (clean.endsWith('kg')) {
      const num = parseFloat(clean.replace('kg', '').trim());
      return isNaN(num) ? null : Math.max(0, num);
    }
    if (clean.endsWith('g') && !clean.endsWith('kg')) {
      const num = parseFloat(clean.replace('g', '').trim());
      return isNaN(num) ? null : Math.max(0, num / 1000);
    }
    const num = parseFloat(clean);
    return isNaN(num) ? null : Math.max(0, num);
  }

  /**
   * Weight heuristics based on item names and categories.
   */
  public static inferWeightFromText(name: string, category?: string): number {
    const combined = `${name} ${category || ''}`.toLowerCase();

    // Whole corpses or monster carcasses
    if (
      combined.includes('kadaver') ||
      combined.includes('monsterkörper') ||
      combined.includes('tierkörper') ||
      combined.includes('leiche') ||
      combined.includes('ganzer körper') ||
      combined.includes('wolfskörper') ||
      combined.includes('bärenkörper')
    ) {
      if (combined.includes('bär') || combined.includes('riesen') || combined.includes('drache')) return 80.0;
      if (combined.includes('wolf') || combined.includes('wildschwein')) return 35.0;
      return 40.0;
    }

    // Heavy Armor / Plattenpanzer
    if (combined.includes('plattenpanzer') || combined.includes('vollharnisch') || combined.includes('ritterrüstung')) return 16.0;
    if (combined.includes('kettenhemd') || combined.includes('schuppenpanzer') || combined.includes('brustpanzer')) return 9.0;
    if (combined.includes('lederharnisch') || combined.includes('lederrüstung') || combined.includes('robe') || combined.includes('wams')) return 3.5;
    if (combined.includes('helm') || combined.includes('stiefel') || combined.includes('beinschienen') || combined.includes('armpanzer')) return 2.0;
    if (combined.includes('handschuh') || combined.includes('stirnband') || combined.includes('gürtel')) return 0.6;
    if (combined.includes('schild')) return 4.0;

    // Weapons
    if (combined.includes('zweihänder') || combined.includes('großschwert') || combined.includes('hellebarde') || combined.includes('kriegshammer')) return 4.5;
    if (combined.includes('langschwert') || combined.includes('schwert') || combined.includes('axt') || combined.includes('katana') || combined.includes('morgenstern')) return 2.2;
    if (combined.includes('kurzschwert') || combined.includes('bogen') || combined.includes('armbrust') || combined.includes('speer') || combined.includes('stab')) return 1.5;
    if (combined.includes('dolch') || combined.includes('messer') || combined.includes('wurfmesser')) return 0.5;

    // Consumables, Potions & Alchemy
    if (combined.includes('heiltrank') || combined.includes('trank') || combined.includes('elixier') || combined.includes('flasche') || combined.includes('gift')) return 0.3;
    if (combined.includes('heilkraut') || combined.includes('kraut') || combined.includes('kristall') || combined.includes('münze') || combined.includes('gold')) return 0.05;
    if (combined.includes('brot') || combined.includes('fleisch') || combined.includes('ration') || combined.includes('apfel')) return 0.4;

    // Books, scrolls, keys, jewels
    if (combined.includes('ring') || combined.includes('amulett') || combined.includes('kette') || combined.includes('schlüssel')) return 0.1;
    if (combined.includes('buch') || combined.includes('tome') || combined.includes('grimoire') || combined.includes('pergament')) return 0.8;

    // Shackles & Restraints
    if (combined.includes('fessel') || combined.includes('kette') || combined.includes('schelle')) return 2.5;

    // Default
    return 1.0;
  }

  /**
   * Calculate current carrying capacity and used weight for a target character.
   */
  public static getCarryCapacity(
    adventure: Adventure,
    targetIdentifier: string = 'player'
  ): {
    currentWeightKg: number;
    maxWeightKg: number;
    remainingCapacityKg: number;
    isOverencumbered: boolean;
  } {
    const targetId = EquipmentConditionService.resolveTargetId(adventure, targetIdentifier);
    const character = EquipmentConditionService.getCharacter(adventure, targetId);

    let maxWeightKg = adventure.inventorySettings?.maxCarryCapacityKg;
    if (typeof maxWeightKg !== 'number' || maxWeightKg < 0) {
      let strengthBonus = 0;
      if (character && Array.isArray((character as any).attributes)) {
        const strAttr = (character as any).attributes.find((a: any) =>
          a.name && (a.name.toLowerCase().includes('stärke') || a.name.toLowerCase().includes('strength') || a.name.toLowerCase().includes('kraft'))
        );
        if (strAttr && typeof strAttr.value === 'number') {
          strengthBonus = Math.max(0, (strAttr.value - 10) * 1.5);
        }
      }
      maxWeightKg = Math.round((25.0 + strengthBonus) * 10) / 10;
    }

    let totalWeight = 0;
    const ownedInstances = (adventure.itemInstances || []).filter(i => i.owner === targetId);

    ownedInstances.forEach(inst => {
      const singleWeight = this.getItemWeightKg(inst);
      const qty = typeof inst.quantity === 'number' && inst.quantity > 0 ? inst.quantity : 1;
      totalWeight += singleWeight * qty;
    });

    if (targetId === 'player' && adventure.structuredInventory?.customItems) {
      adventure.structuredInventory.customItems.forEach(ci => {
        const alreadyCounted = ownedInstances.some(inst => inst.id === ci.id || inst.name?.toLowerCase() === ci.name.toLowerCase());
        if (!alreadyCounted) {
          const w = this.getItemWeightKg(ci);
          totalWeight += w;
        }
      });
    }

    const currentWeightKg = Math.round(totalWeight * 10) / 10;
    const remainingCapacityKg = Math.max(0, Math.round((maxWeightKg - currentWeightKg) * 10) / 10);
    const isOverencumbered = currentWeightKg > maxWeightKg;

    return {
      currentWeightKg,
      maxWeightKg,
      remainingCapacityKg,
      isOverencumbered
    };
  }

  /**
   * Determine if an item is allowed to be picked up automatically based on user settings, weight, rarity, and story/quest relevance.
   */
  public static isAutoPickupAllowed(
    item: ItemInstance,
    setting: 'always_confirm' | 'auto_small' | 'auto_all' = 'always_confirm',
    remainingCapacityKg: number = 25.0,
    options?: { isQuestItem?: boolean; isStoryRelevant?: boolean; estimatedValueGold?: number }
  ): boolean {
    if (setting === 'always_confirm') {
      return false;
    }

    const weight = this.getItemWeightKg(item);

    if (item.isCorpseOrBody || weight >= 15.0) {
      return false;
    }

    if (weight > remainingCapacityKg) {
      return false;
    }

    if (item.isHeavyOrRestricted) {
      return false;
    }

    const nameLower = (item.name || '').toLowerCase();
    const catLower = (item.category || '').toLowerCase();
    const qualLower = (item.quality || '').toLowerCase();

    const isQuest = Boolean(
      options?.isQuestItem ||
      options?.isStoryRelevant ||
      (item as any).isQuestItem ||
      (item as any).isStoryRelevant ||
      nameLower.includes('quest') ||
      nameLower.includes('schlüssel') ||
      nameLower.includes('dokument') ||
      nameLower.includes('siegel') ||
      catLower.includes('schlüssel') ||
      catLower.includes('quest')
    );

    const isRareOrEpic = Boolean(
      qualLower.includes('selten') ||
      qualLower.includes('episch') ||
      qualLower.includes('legendä') ||
      qualLower.includes('relikt') ||
      qualLower.includes('artefakt') ||
      qualLower.includes('außergewöhnlich')
    );

    const isHighValue = (options?.estimatedValueGold ?? 0) >= 50;

    if (setting === 'auto_small') {
      if (isQuest || isRareOrEpic || isHighValue) {
        return false;
      }
      return weight <= 1.5;
    }

    if (setting === 'auto_all') {
      if (isQuest) {
        return false;
      }
      return weight <= 5.0;
    }

    return false;
  }

  /**
   * Helper to sync harvestOptions (isCrystalsHarvested / isBodyHarvested) on a LootSource
   * when all generated crystal or butcher items have been removed from the source.
   */
  public static syncLootSourceHarvestState(adventure: Adventure, lootSourceId: string): Adventure {
    const ls = (adventure.lootSources || []).find(s => s.id === lootSourceId);
    if (!ls || !ls.harvestOptions) return adventure;

    const remainingItems = ls.items || [];
    const hasRemainingCrystals = remainingItems.some(i =>
      (i.name || '').toLowerCase().includes('kristall') || (i.category || '').toLowerCase().includes('kristall')
    );
    const hasRemainingButcher = remainingItems.some(i =>
      !(i.name || '').toLowerCase().includes('kristall')
    );

    const updatedHarvestOptions = { ...ls.harvestOptions };

    if (!hasRemainingCrystals && ls.items && ls.items.length >= 0) {
      updatedHarvestOptions.isCrystalsHarvested = true;
    }
    if (!hasRemainingButcher && ls.items && ls.items.length >= 0) {
      updatedHarvestOptions.isBodyHarvested = true;
    }

    return {
      ...adventure,
      lootSources: (adventure.lootSources || []).map(s =>
        s.id === lootSourceId ? { ...s, harvestOptions: updatedHarvestOptions } : s
      )
    };
  }

  /**
   * Explicit confirmation chain wrapper for PendingPickupProposal.
   * Controlled public route for confirmed pickups.
   * STRICT REQUIREMENT: Confirmation is ONLY allowed for items present in an existing adventure.pendingPickup!
   * Never searches lootSources/worldDrops directly if no pendingPickup proposal exists.
   */
  public static confirmPickup(
    adventure: Adventure,
    targetIdentifier: string = 'player',
    proposalOrItems?: PendingPickupProposal | { itemInstanceId?: string; item?: ItemInstance; quantity?: number }[],
    options?: {
      sourceId?: string;
      allowPartial?: boolean;
    }
  ): {
    updatedAdventure: Adventure;
    acceptedItems: ItemInstance[];
    rejectedItems: { item: ItemInstance; reason: string }[];
    notifications: InventoryNotification[];
  } {
    const targetId = EquipmentConditionService.resolveTargetId(adventure, targetIdentifier);
    const pending = adventure.pendingPickup;

    // Determine requested items list
    let requestedItemsList: { itemInstanceId?: string; item?: ItemInstance; quantity?: number }[] = [];
    if (Array.isArray(proposalOrItems)) {
      requestedItemsList = proposalOrItems;
    } else if (proposalOrItems && Array.isArray((proposalOrItems as PendingPickupProposal).items)) {
      requestedItemsList = (proposalOrItems as PendingPickupProposal).items.map(i => ({
        itemInstanceId: i.id,
        item: i,
        quantity: i.quantity || 1
      }));
    } else if (pending && Array.isArray(pending.items)) {
      requestedItemsList = pending.items.map(i => ({
        itemInstanceId: i.id,
        item: i,
        quantity: i.quantity || 1
      }));
    }

    // STRICT RULE 1: confirmPickup MUST FAIL if adventure.pendingPickup does NOT exist!
    if (!pending || !Array.isArray(pending.items) || pending.items.length === 0) {
      return {
        updatedAdventure: adventure,
        acceptedItems: [],
        rejectedItems: requestedItemsList.map(req => ({
          item: req.item || {
            id: req.itemInstanceId || 'unknown',
            itemDefinitionId: 'unknown',
            name: 'Gegenstand'
          },
          reason: 'Bestätigung abgelehnt: Kein ausstehender Aufnahme-Vorschlag (pendingPickup) vorhanden.'
        })),
        notifications: []
      };
    }

    const validatedItemsToTake: { itemInstanceId?: string; item?: ItemInstance; quantity?: number }[] = [];
    const rejectedItems: { item: ItemInstance; reason: string }[] = [];
    let detectedSourceId: string | null = options?.sourceId || pending.lootSourceId || null;

    requestedItemsList.forEach(req => {
      const targetInstId = req.itemInstanceId || req.item?.id;

      if (!targetInstId) {
        rejectedItems.push({
          item: req.item || { id: 'unknown', itemDefinitionId: 'unknown', name: 'Gegenstand' },
          reason: 'Bestätigung abgelehnt: Keine konkrete itemInstanceId angegeben.'
        });
        return;
      }

      // STRICT RULE 2: Item MUST be present in pending.items! NEVER fall back to source/world drops/names!
      const candidateInPending = pending.items.find(i => i.id === targetInstId);
      if (!candidateInPending) {
        rejectedItems.push({
          item: req.item || { id: targetInstId, itemDefinitionId: 'unknown', name: 'Gegenstand' },
          reason: `Bestätigung abgelehnt: Gegenstand (${targetInstId}) ist nicht im ausstehenden Vorschlag enthalten.`
        });
        return;
      }

      // STRICT RULE 3: Requested quantity CANNOT exceed proposed quantity!
      const proposedQty = candidateInPending.quantity || 1;
      const requestedQty = req.quantity ?? proposedQty;

      if (requestedQty > proposedQty) {
        rejectedItems.push({
          item: candidateInPending,
          reason: `Bestätigung abgelehnt: Die angeforderte Menge (${requestedQty}) überschreitet die im Vorschlag enthaltene Menge (${proposedQty}).`
        });
        return;
      }

      // STRICT RULE 4: Check matching sourceId if present
      if (options?.sourceId && pending.lootSourceId && options.sourceId !== pending.lootSourceId) {
        rejectedItems.push({
          item: candidateInPending,
          reason: `Bestätigung abgelehnt: Die angeforderte Quelle (${options.sourceId}) stimmt nicht mit der Quelle des Vorschlags (${pending.lootSourceId}) überein.`
        });
        return;
      }

      // STRICT RULE 5: Check current presence in world/source AFTER proposal validation
      let presentInWorld = false;

      const sourceIdToMatch = options?.sourceId || pending.lootSourceId;
      const targetLs = sourceIdToMatch ? (adventure.lootSources || []).find(s => s.id === sourceIdToMatch) : null;

      if (targetLs) {
        // If tied to a specific loot source, item MUST exist in that loot source's items!
        presentInWorld = (targetLs.items || []).some(i => i.id === targetInstId);
        if (presentInWorld && !detectedSourceId) {
          detectedSourceId = targetLs.id;
        }
      } else {
        // Check lootSources, worldDrops, canonical itemInstances
        for (const ls of (adventure.lootSources || [])) {
          if ((ls.items || []).some(i => i.id === targetInstId)) {
            presentInWorld = true;
            if (!detectedSourceId) detectedSourceId = ls.id;
            break;
          }
        }

        if (!presentInWorld) {
          const wd = (adventure.worldDrops || []).find(w => w.itemInstance.id === targetInstId);
          if (wd) presentInWorld = true;
        }

        if (!presentInWorld) {
          const inCanonical = (adventure.itemInstances || []).find(i => i.id === targetInstId && i.owner !== 'player');
          if (inCanonical) presentInWorld = true;
        }

        // If no lootSource or worldDrop is bound (e.g. AI state change proposal or standalone world item)
        if (!presentInWorld && (pending.sourceType === 'world_item' || !pending.lootSourceId)) {
          presentInWorld = true;
        }
      }

      if (!presentInWorld) {
        rejectedItems.push({
          item: candidateInPending,
          reason: `Bestätigung abgelehnt: Gegenstand (${targetInstId}) existiert nicht mehr an der Quelle oder wurde zwischenzeitlich entfernt.`
        });
        return;
      }

      validatedItemsToTake.push({
        itemInstanceId: targetInstId,
        item: candidateInPending,
        quantity: requestedQty
      });
    });

    if (validatedItemsToTake.length === 0) {
      return {
        updatedAdventure: adventure,
        acceptedItems: [],
        rejectedItems,
        notifications: []
      };
    }

    const executionResult = this.executePickup(
      adventure,
      targetId,
      validatedItemsToTake,
      { ...options, confirmed: true }
    );

    let updatedAdv = executionResult.updatedAdventure;

    // Update pendingPickup proposal after execution
    if (updatedAdv.pendingPickup && Array.isArray(updatedAdv.pendingPickup.items)) {
      const currentPending = updatedAdv.pendingPickup;
      const remainingPendingItems = currentPending.items.filter(pItem => {
        const accepted = executionResult.acceptedItems.find(a => a.id === pItem.id);
        if (!accepted) return true;
        return false;
      });

      if (remainingPendingItems.length === 0) {
        updatedAdv = {
          ...updatedAdv,
          pendingPickup: undefined
        };
      } else {
        updatedAdv = {
          ...updatedAdv,
          pendingPickup: {
            ...currentPending,
            items: remainingPendingItems
          }
        };
      }
    }

    if (options?.sourceId || detectedSourceId) {
      updatedAdv = this.syncLootSourceHarvestState(updatedAdv, (options?.sourceId || detectedSourceId)!);
    }

    return {
      updatedAdventure: updatedAdv,
      acceptedItems: executionResult.acceptedItems,
      rejectedItems: [...rejectedItems, ...executionResult.rejectedItems],
      notifications: executionResult.notifications
    };
  }

  /**
   * Explicitly rejects pending pickup proposal, leaving items in their original source or world drop.
   */
  public static rejectPickup(adventure: Adventure): { updatedAdventure: Adventure; rejectedCount: number } {
    const count = adventure.pendingPickup?.items?.length || 0;
    return {
      updatedAdventure: {
        ...adventure,
        pendingPickup: null
      },
      rejectedCount: count
    };
  }

  /**
   * Confirms an NPC-to-Player Item Transfer.
   */
  public static confirmTransfer(adventure: Adventure, proposal?: PendingItemTransferProposal) {
    return EquipmentConditionService.confirmItemTransfer(adventure, proposal);
  }

  /**
   * Rejects an NPC-to-Player Item Transfer.
   */
  public static rejectTransfer(adventure: Adventure) {
    return EquipmentConditionService.rejectItemTransfer(adventure);
  }

  /**
   * Internal execution method for performing item pickups into character inventory.
   */
  public static executePickup(
    adventure: Adventure,
    targetIdentifier: string = 'player',
    itemsToTake: { itemInstanceId?: string; item?: ItemInstance; quantity?: number }[],
    options?: {
      sourceId?: string;
      allowPartial?: boolean;
      confirmed?: boolean;
    }
  ): {
    updatedAdventure: Adventure;
    acceptedItems: ItemInstance[];
    rejectedItems: { item: ItemInstance; reason: string }[];
    notifications: InventoryNotification[];
  } {
    return this.performPickupExecution(adventure, targetIdentifier, itemsToTake, { ...options, confirmed: true });
  }

  /**
   * Public entry point for item pickup attempts.
   * Under always_confirm, direct unconfirmed calls create a PendingPickupProposal without mutating inventory.
   */
  public static pickupItems(
    adventure: Adventure,
    targetIdentifier: string = 'player',
    itemsToTake: { itemInstanceId?: string; item?: ItemInstance; quantity?: number }[],
    options?: {
      sourceId?: string;
      allowPartial?: boolean;
      confirmed?: boolean;
    }
  ): {
    updatedAdventure: Adventure;
    acceptedItems: ItemInstance[];
    rejectedItems: { item: ItemInstance; reason: string }[];
    notifications: InventoryNotification[];
  } {
    const targetId = EquipmentConditionService.resolveTargetId(adventure, targetIdentifier);

    if (options?.confirmed || targetId !== 'player') {
      return this.performPickupExecution(adventure, targetIdentifier, itemsToTake, options);
    }

    const mode = adventure.inventorySettings?.pickupConfirmationMode || 'always_confirm';
    const capacity = this.getCarryCapacity(adventure, targetId);

    const autoItems: { itemInstanceId?: string; item?: ItemInstance; quantity?: number }[] = [];
    const pendingItems: ItemInstance[] = [];
    const rejectedItems: { item: ItemInstance; reason: string }[] = [];

    itemsToTake.forEach(req => {
      let inst: ItemInstance | null = req.item || null;
      if (req.itemInstanceId) {
        for (const ls of (adventure.lootSources || [])) {
          const f = (ls.items || []).find(i => i.id === req.itemInstanceId);
          if (f) { inst = f; break; }
        }
        if (!inst) {
          const wd = (adventure.worldDrops || []).find(w => w.itemInstance.id === req.itemInstanceId);
          if (wd) inst = wd.itemInstance;
        }
        if (!inst) {
          inst = (adventure.itemInstances || []).find(i => i.id === req.itemInstanceId) || null;
        }
      }

      if (!inst) {
        rejectedItems.push({
          item: { id: req.itemInstanceId || 'unknown', itemDefinitionId: 'def', name: 'Gegenstand' },
          reason: 'Spezifische Gegenstands-ID im Zustand nicht gefunden.'
        });
        return;
      }

      if (this.isAutoPickupAllowed(inst, mode, capacity.remainingCapacityKg)) {
        autoItems.push(req);
      } else {
        pendingItems.push(inst);
        rejectedItems.push({
          item: inst,
          reason: 'Aufnahmebestätigung erforderlich (always_confirm).'
        });
      }
    });

    let updatedAdv = { ...adventure };
    let acceptedItems: ItemInstance[] = [];
    let notifications: InventoryNotification[] = [];

    if (autoItems.length > 0) {
      const autoRes = this.performPickupExecution(updatedAdv, targetIdentifier, autoItems, { ...options, confirmed: true });
      updatedAdv = autoRes.updatedAdventure;
      acceptedItems = autoRes.acceptedItems;
      notifications = autoRes.notifications;
      rejectedItems.push(...autoRes.rejectedItems);
    }

    if (pendingItems.length > 0) {
      const proposal: PendingPickupProposal = {
        id: `pickup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sourceTitle: options?.sourceId ? ((adventure.lootSources || []).find(s => s.id === options.sourceId)?.title || 'Fundstück') : 'Fundstück',
        sourceType: options?.sourceId ? 'defeated_enemy' : 'world_item',
        items: pendingItems,
        timestamp: new Date().toISOString()
      };
      updatedAdv = {
        ...updatedAdv,
        pendingPickup: proposal
      };
    }

    return {
      updatedAdventure: updatedAdv,
      acceptedItems,
      rejectedItems,
      notifications
    };
  }

  /**
   * Internal performPickupExecution performing concrete inventory mutations.
   */
  public static performPickupExecution(
    adventure: Adventure,
    targetIdentifier: string = 'player',
    itemsToTake: { itemInstanceId?: string; item?: ItemInstance; quantity?: number }[],
    options?: {
      sourceId?: string;
      allowPartial?: boolean;
      confirmed?: boolean;
    }
  ): {
    updatedAdventure: Adventure;
    acceptedItems: ItemInstance[];
    rejectedItems: { item: ItemInstance; reason: string }[];
    notifications: InventoryNotification[];
  } {
    const targetId = EquipmentConditionService.resolveTargetId(adventure, targetIdentifier);
    let updatedAdv: Adventure = { ...adventure };

    const acceptedItems: ItemInstance[] = [];
    const rejectedItems: { item: ItemInstance; reason: string }[] = [];
    const notifications: InventoryNotification[] = [];

    let itemInstances = [...(updatedAdv.itemInstances || [])];
    let itemDefinitions = [...(updatedAdv.itemDefinitions || [])];
    let lootSources = [...(updatedAdv.lootSources || [])];
    let worldDrops = [...(updatedAdv.worldDrops || [])];

    itemsToTake.forEach(takeReq => {
      let inst: ItemInstance | null = null;
      let foundInLootSourceId: string | null = null;
      let foundInWorldDropId: string | null = null;

      // 1. Strict resolution by itemInstanceId if provided
      if (takeReq.itemInstanceId) {
        for (const ls of lootSources) {
          const foundInLs = (ls.items || []).find(i => i.id === takeReq.itemInstanceId);
          if (foundInLs) {
            inst = { ...foundInLs };
            foundInLootSourceId = ls.id;
            break;
          }
        }

        if (!inst) {
          const wd = worldDrops.find(w => w.itemInstance.id === takeReq.itemInstanceId);
          if (wd) {
            inst = { ...wd.itemInstance };
            foundInWorldDropId = wd.id;
          }
        }

        if (!inst) {
          inst = itemInstances.find(i => i.id === takeReq.itemInstanceId) || null;
        }

        if (!inst && takeReq.item) {
          inst = { ...takeReq.item };
        }

        if (!inst) {
          rejectedItems.push({
            item: {
              id: takeReq.itemInstanceId,
              itemDefinitionId: 'unknown',
              name: 'Spezifischer Gegenstand'
            },
            reason: 'Spezifische Gegenstands-ID im Zustand nicht gefunden.'
          });
          return;
        }
      } else if (takeReq.item) {
        inst = { ...takeReq.item };
      }

      if (!inst) return;

      const singleWeight = this.getItemWeightKg(inst);
      const totalAvailableQty = inst.quantity || 1;
      const reqQty = takeReq.quantity || totalAvailableQty;
      const capacity = this.getCarryCapacity(updatedAdv, targetId);

      const maxFittingQty = singleWeight <= 0 ? reqQty : Math.floor(capacity.remainingCapacityKg / singleWeight);

      if (maxFittingQty <= 0) {
        rejectedItems.push({
          item: inst,
          reason: `Traglast überschritten (benötigt ${(singleWeight * reqQty).toFixed(1)} kg, verfügbar: ${capacity.remainingCapacityKg.toFixed(1)} kg)`
        });
        return;
      }

      const takenQty = Math.min(reqQty, maxFittingQty);
      const remainingQty = totalAvailableQty - takenQty;

      // When partial quantity is taken, generate a NEW unique ID for the remaining portion
      const restInstanceId = remainingQty > 0
        ? `${inst.id}-rest-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
        : null;

      // Ensure ItemDefinition exists in canonical registry
      let def = itemDefinitions.find(d => d.id === inst!.itemDefinitionId || (inst!.name && d.name.toLowerCase() === inst!.name.toLowerCase()));
      if (!def) {
        def = {
          id: inst.itemDefinitionId || `def-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: inst.name || 'Unbekannter Gegenstand',
          category: inst.category || 'Gegenstände',
          subcategory: 'Fundstück',
          baseWeight: singleWeight
        };
        itemDefinitions.push(def);
      }

      // Update or add ItemInstance for target owner (preserving concrete original itemInstanceId)
      const existingIdx = itemInstances.findIndex(i => i.id === inst!.id);
      const updatedInstance: ItemInstance = {
        ...inst,
        itemDefinitionId: def.id,
        owner: targetId,
        currentState: 'im Inventar',
        location: targetId === 'player' ? 'Inventar' : `Im Besitz von ${targetId}`,
        quantity: takenQty,
        weightKg: singleWeight
      };

      if (existingIdx >= 0) {
        itemInstances[existingIdx] = updatedInstance;
      } else {
        itemInstances.push(updatedInstance);
      }

      // Update source: remove taken quantity, retain remaining quantity with new restInstanceId
      if (foundInLootSourceId || options?.sourceId) {
        const lsId = foundInLootSourceId || options?.sourceId;
        lootSources = lootSources.map(ls => {
          if (ls.id === lsId) {
            const updatedItems = (ls.items || []).reduce<ItemInstance[]>((acc, item) => {
              if (item.id === inst!.id) {
                if (remainingQty > 0 && restInstanceId) {
                  acc.push({ ...item, id: restInstanceId, quantity: remainingQty });
                }
              } else {
                acc.push(item);
              }
              return acc;
            }, []);
            return { ...ls, items: updatedItems };
          }
          return ls;
        });
      }

      if (foundInWorldDropId) {
        if (remainingQty > 0 && restInstanceId) {
          worldDrops = worldDrops.map(wd => wd.id === foundInWorldDropId ? { ...wd, itemInstance: { ...wd.itemInstance, id: restInstanceId, quantity: remainingQty } } : wd);
        } else {
          worldDrops = worldDrops.filter(wd => wd.id !== foundInWorldDropId);
        }
      }

      // If pendingPickup proposal exists, update rest item ID for remaining quantity
      if (updatedAdv.pendingPickup && remainingQty > 0 && restInstanceId) {
        const pending = updatedAdv.pendingPickup;
        const updatedPendingItems = (pending.items || []).map(pi => {
          if (pi.id === inst!.id) {
            return {
              ...pi,
              id: restInstanceId,
              quantity: remainingQty
            };
          }
          return pi;
        });
        updatedAdv.pendingPickup = {
          ...pending,
          items: updatedPendingItems
        };
      }

      acceptedItems.push(updatedInstance);
      notifications.push({
        id: Math.random().toString(),
        itemName: updatedInstance.name || 'Gegenstand',
        quantity: takenQty,
        weightKg: singleWeight * takenQty,
        action: 'gained',
        timestamp: new Date().toISOString()
      });

      if (remainingQty > 0) {
        rejectedItems.push({
          item: { ...inst, id: restInstanceId!, quantity: remainingQty },
          reason: `Teilweise aufgenommen (${takenQty} von ${reqQty} Stück mitgenommen, Rest bleibt an Quelle wegen Traglast)`
        });
      }

      // Advance active collection tasks
      updatedAdv = this.progressCollectionTasks(updatedAdv, updatedInstance, takenQty, targetId);

      // Keep updatedAdv in sync for subsequent carry capacity calculations in the loop
      updatedAdv = {
        ...updatedAdv,
        itemInstances,
        itemDefinitions,
        lootSources,
        worldDrops
      };
    });

    // Ensure strictly unique IDs in itemInstances registry
    const uniqueItemInstancesMap = new Map<string, ItemInstance>();
    itemInstances.forEach(i => {
      uniqueItemInstancesMap.set(i.id, i);
    });
    itemInstances = Array.from(uniqueItemInstancesMap.values());

    // Clear pending pickup proposal if all items were resolved
    let pendingPickup = updatedAdv.pendingPickup;
    if (pendingPickup) {
      const remainingPending = pendingPickup.items.filter(pi => !acceptedItems.some(ai => ai.id === pi.id));
      if (remainingPending.length === 0) {
        pendingPickup = null;
      } else {
        pendingPickup = {
          ...pendingPickup,
          items: remainingPending
        };
      }
    }

    updatedAdv = {
      ...updatedAdv,
      itemInstances,
      itemDefinitions,
      lootSources,
      worldDrops,
      pendingPickup
    };

    if (targetId === 'player') {
      updatedAdv = EquipmentConditionService.syncStructuredInventory(updatedAdv);
    }

    return {
      updatedAdventure: updatedAdv,
      acceptedItems,
      rejectedItems,
      notifications
    };
  }

  /**
   * Helper to find matching everyday competency for an executor.
   */
  public static findMatchingCompetency(
    character: Character | NPC | null,
    actionType: 'harvest_herbs' | 'harvest_crystals' | 'butcher' | 'disassemble' | 'general'
  ): { name: string; proficiency: number; talent: number; competencyObj?: any } {
    if (!character) {
      return { name: 'Grundkenntnisse', proficiency: 0, talent: 2 };
    }

    const competencies: any[] = Array.isArray((character as any).professionCompetencies)
      ? (character as any).professionCompetencies
      : [];

    const keywordsMap: Record<string, string[]> = {
      harvest_herbs: ['kräuterkunde', 'pflanzenkunde', 'sammeln', 'naturkunde', 'überleben', 'alchemie'],
      harvest_crystals: ['kristallkunde', 'magiekunde', 'sonderverwertung', 'monsterkunde', 'zerlegen', 'bergbau'],
      butcher: ['zerlegen', 'jagd', 'häuten', 'anatomie', 'kadaververwertung', 'fleischer', 'tierkunde'],
      disassemble: ['handwerk', 'demontage', 'waffenschmiede', 'metallverarbeitung', 'schlosser'],
      general: ['handwerk', 'sammeln', 'überleben']
    };

    const targetKeywords = keywordsMap[actionType] || keywordsMap.general;

    let bestComp: any = null;
    let highestProf = -1;

    for (const comp of competencies) {
      const nameLower = (comp.name || '').toLowerCase();
      const catLower = (comp.category || '').toLowerCase();
      if (targetKeywords.some(kw => nameLower.includes(kw) || catLower.includes(kw))) {
        const prof = typeof comp.proficiency === 'number' ? comp.proficiency : 0;
        if (prof > highestProf) {
          highestProf = prof;
          bestComp = comp;
        }
      }
    }

    if (bestComp) {
      return {
        name: bestComp.name,
        proficiency: Math.max(0, Math.min(100, bestComp.proficiency || 0)),
        talent: Math.max(0, Math.min(5, bestComp.talent ?? 2)),
        competencyObj: bestComp
      };
    }

    return {
      name: 'Ungeübt',
      proficiency: 0,
      talent: 2
    };
  }

  /**
   * Helper to find matching tool in character's inventory.
   */
  public static findMatchingTool(
    adventure: Adventure,
    targetId: string,
    actionType: 'harvest_herbs' | 'harvest_crystals' | 'butcher' | 'disassemble' | 'general'
  ): { toolInstance?: ItemInstance; name: string; qualityBonus: number; timeBonus: number } {
    const ownedInstances = (adventure.itemInstances || []).filter(i => i.owner === targetId && i.currentState !== 'abgelegt');

    const toolKeywordsMap: Record<string, string[]> = {
      harvest_herbs: ['sichel', 'kräutermesser', 'messer', 'schere'],
      harvest_crystals: ['kristallmeißel', 'meißel', 'spitzhacke', 'hammer', 'spezialwerkzeug'],
      butcher: ['jagdmesser', 'zerlegemesser', 'knochensäge', 'messer', 'beil'],
      disassemble: ['zange', 'hammer', 'meißel', 'schraubendreher', 'werkzeug', 'feile'],
      general: ['messer', 'werkzeug']
    };

    const targetKeywords = toolKeywordsMap[actionType] || toolKeywordsMap.general;

    for (const inst of ownedInstances) {
      const nameLower = (inst.name || '').toLowerCase();
      const catLower = (inst.category || '').toLowerCase();
      if (targetKeywords.some(kw => nameLower.includes(kw) || catLower.includes(kw))) {
        return {
          toolInstance: inst,
          name: inst.name || 'Werkzeug',
          qualityBonus: nameLower.includes('spezial') || nameLower.includes('jagd') || nameLower.includes('kristall') ? 15 : 10,
          timeBonus: 0.3
        };
      }
    }

    return {
      name: 'Kein Spezialwerkzeug',
      qualityBonus: 0,
      timeBonus: 0
    };
  }

  /**
   * Evaluates competency, tools, and source condition to compute harvest/disassembly yield & quality.
   */
  public static evaluateHarvestPerformance(
    executor: Character | NPC | null,
    adventure: Adventure,
    executorId: string,
    actionType: 'harvest_herbs' | 'harvest_crystals' | 'butcher' | 'disassemble' | 'general',
    sourceCondition: string = 'frisch',
    baseYield: { name: string; quantity: number; weightKg?: number; category?: string; quality?: string }[]
  ): {
    computedYield: ItemInstance[];
    proficiencyUsed: number;
    competencyName: string;
    toolUsedName: string;
    timeCostMinutes: number;
    performanceSummary: string;
    updatedAdventure: Adventure;
  } {
    let updatedAdv = { ...adventure };
    const compInfo = this.findMatchingCompetency(executor, actionType);
    const toolInfo = this.findMatchingTool(updatedAdv, executorId, actionType);

    const effectiveProficiency = Math.min(100, compInfo.proficiency + toolInfo.qualityBonus);

    const condClean = sourceCondition.toLowerCase();
    let sourceMultiplier = 1.0;
    if (condClean.includes('verunreinigt') || condClean.includes('schlecht')) sourceMultiplier = 0.85;
    else if (condClean.includes('beschädigt') || condClean.includes('zertrampelt')) sourceMultiplier = 0.7;
    else if (condClean.includes('verwesend') || condClean.includes('alt')) sourceMultiplier = 0.5;

    let yieldMultiplier = 1.0;
    let defaultQuality = 'Solide';
    let defaultCondition = 'gut';
    let baseTime = 10;

    if (effectiveProficiency < 20) {
      yieldMultiplier = 0.6 * sourceMultiplier;
      defaultQuality = 'Gering';
      defaultCondition = 'minderwertig';
      baseTime = 15;
    } else if (effectiveProficiency < 50) {
      yieldMultiplier = 1.0 * sourceMultiplier;
      defaultQuality = 'Solide';
      defaultCondition = 'gut';
      baseTime = 10;
    } else if (effectiveProficiency < 80) {
      yieldMultiplier = 1.25 * sourceMultiplier;
      defaultQuality = 'Hochwertig';
      defaultCondition = 'hervorragend';
      baseTime = 6;
    } else {
      yieldMultiplier = 1.5 * sourceMultiplier;
      defaultQuality = 'Außergewöhnlich';
      defaultCondition = 'makellos';
      baseTime = 3;
    }

    const timeCostMinutes = Math.max(2, Math.round(baseTime * (1 - toolInfo.timeBonus)));

    const computedYield: ItemInstance[] = [];
    baseYield.forEach((by, idx) => {
      const rawQty = Math.max(1, Math.round((by.quantity || 1) * yieldMultiplier));

      computedYield.push({
        id: `inst-harv-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        itemDefinitionId: `def-harv-${by.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: by.name,
        category: by.category || 'Rohstoffe',
        quantity: rawQty,
        weightKg: typeof by.weightKg === 'number' ? by.weightKg : this.inferWeightFromText(by.name, by.category),
        condition: defaultCondition,
        quality: by.quality || defaultQuality,
        currentState: 'am Boden'
      });
    });

    if (compInfo.competencyObj && executor && Array.isArray((executor as any).professionCompetencies)) {
      const activity = {
        action: 'work',
        difficulty: effectiveProficiency < 30 ? 'hard' : effectiveProficiency < 70 ? 'medium' : 'easy',
        successful: true,
        meaningfulPractice: true
      };
      const baseXp = ProfessionCompetencyService.calculateActivityBaseXp(activity as any);
      const progRes = ProfessionCompetencyService.calculateCompetencyProgress(compInfo.competencyObj, baseXp);

      const updatedCompetencies = (executor as any).professionCompetencies.map((c: any) =>
        c.id === compInfo.competencyObj.id ? progRes.updatedCompetency : c
      );

      if (executorId === 'player' && updatedAdv.player) {
        updatedAdv = {
          ...updatedAdv,
          player: { ...updatedAdv.player, professionCompetencies: updatedCompetencies }
        };
      } else if (updatedAdv.npcs) {
        updatedAdv = {
          ...updatedAdv,
          npcs: updatedAdv.npcs.map(n => n.id === executorId ? { ...n, professionCompetencies: updatedCompetencies } : n)
        };
      }
    }

    const performanceSummary = `Kompetenz: ${compInfo.name} (${effectiveProficiency}%), Werkzeug: ${toolInfo.name}, Dauer: ${timeCostMinutes} Min.`;

    return {
      computedYield,
      proficiencyUsed: effectiveProficiency,
      competencyName: compInfo.name,
      toolUsedName: toolInfo.name,
      timeCostMinutes,
      performanceSummary,
      updatedAdventure: updatedAdv
    };
  }

  /**
   * Harvest monster or animal body with competency integration & persistent loot retention.
   * Correct order of operations:
   * 1. Check if items were already generated on LootSource (reuse existing itemInstanceIds!).
   * 2. If not, generate them ONCE and attach to LootSource.
   * 3. Perform pickup attempt into target inventory.
   * 4. Update harvest state (isCrystalsHarvested / isBodyHarvested) ONLY IF ALL generated items have been taken!
   */
  public static harvestMonster(
    adventure: Adventure,
    lootSourceId: string,
    action: 'examine' | 'crystals' | 'butcher' | 'take_body',
    targetIdentifier: string = 'player'
  ): {
    updatedAdventure: Adventure;
    resultMessage: string;
    gainedItems: ItemInstance[];
    rejectedItems: { item: ItemInstance; reason: string }[];
    notifications: InventoryNotification[];
  } {
    const targetId = EquipmentConditionService.resolveTargetId(adventure, targetIdentifier);
    const executor = EquipmentConditionService.getCharacter(adventure, targetId);
    const lootSource = (adventure.lootSources || []).find(ls => ls.id === lootSourceId);

    if (!lootSource) {
      return {
        updatedAdventure: adventure,
        resultMessage: 'Kadaver oder Beutequelle nicht gefunden.',
        gainedItems: [],
        rejectedItems: [],
        notifications: []
      };
    }

    let updatedAdv = { ...adventure };
    const harvestOptions = lootSource.harvestOptions || {};

    if (action === 'examine') {
      return {
        updatedAdventure: adventure,
        resultMessage: `${lootSource.title} sorgfältig untersucht. ${lootSource.description || 'Der Kadaver ist bereit zur Verwertung.'}`,
        gainedItems: [],
        rejectedItems: [],
        notifications: []
      };
    }

    if (action === 'crystals') {
      const existingSourceItems = lootSource.items || [];
      let crystalItemsToTake = existingSourceItems.filter(i =>
        (i.name || '').toLowerCase().includes('kristall') || (i.category || '').toLowerCase().includes('kristall')
      );

      let perfSummary = 'Bereits erzeugte Kristalle';

      // 1. Generate crystal items ONLY IF none exist on LootSource and not yet marked harvested
      if (crystalItemsToTake.length === 0) {
        if (harvestOptions.isCrystalsHarvested) {
          return {
            updatedAdventure: adventure,
            resultMessage: 'Die Kristalle wurden aus diesem Kadaver bereits geborgen.',
            gainedItems: [],
            rejectedItems: [],
            notifications: []
          };
        }

        const baseCrystals = harvestOptions.crystalYield || [
          { name: `Monsterkristall (${lootSource.title})`, quantity: 1, weightKg: 0.2, category: 'Rohstoffe' }
        ];

        const perf = this.evaluateHarvestPerformance(executor, updatedAdv, targetId, 'harvest_crystals', 'frisch', baseCrystals);
        updatedAdv = perf.updatedAdventure;
        crystalItemsToTake = perf.computedYield;
        perfSummary = perf.performanceSummary;

        // Store generated crystal items on LootSource ONCE with concrete itemInstanceIds
        const updatedSourceItems = [...existingSourceItems, ...crystalItemsToTake];
        updatedAdv = {
          ...updatedAdv,
          lootSources: (updatedAdv.lootSources || []).map(ls =>
            ls.id === lootSourceId
              ? { ...ls, items: updatedSourceItems }
              : ls
          )
        };
      }

      // 2. Attempt pickup into target inventory
      const pickupRes = this.pickupItems(
        updatedAdv,
        targetId,
        crystalItemsToTake.map(c => ({ itemInstanceId: c.id, item: c, quantity: c.quantity })),
        { sourceId: lootSourceId, allowPartial: true }
      );
      updatedAdv = pickupRes.updatedAdventure;

      // 3. Inspect remaining crystals on LootSource
      const currentLs = (updatedAdv.lootSources || []).find(ls => ls.id === lootSourceId);
      const remainingCrystalsOnLs = (currentLs?.items || []).filter(i =>
        (i.name || '').toLowerCase().includes('kristall') || (i.category || '').toLowerCase().includes('kristall')
      );

      const isFullyHarvested = remainingCrystalsOnLs.length === 0;

      // Set isCrystalsHarvested ONLY IF no crystals remain on LootSource!
      if (isFullyHarvested) {
        updatedAdv = {
          ...updatedAdv,
          lootSources: (updatedAdv.lootSources || []).map(ls =>
            ls.id === lootSourceId
              ? { ...ls, harvestOptions: { ...(ls.harvestOptions || {}), isCrystalsHarvested: true } }
              : ls
          )
        };
      }

      const gainedMsg = pickupRes.acceptedItems.length > 0
        ? (isFullyHarvested
            ? `Monsterkristalle geborgen (${perfSummary}).`
            : `Teil der Monsterkristalle geborgen (${perfSummary}). Verbleibende Kristalle liegen an der Quelle.`)
        : updatedAdv.pendingPickup
            ? `Monsterkristalle freigelegt (${perfSummary}). Aufnahmebestätigung erforderlich.`
            : `Kristalle erzeugt, konnten aber wegen voller Traglast nicht aufgenommen werden (${perfSummary}). Sie liegen weiterhin am Kadaver.`;

      return {
        updatedAdventure: updatedAdv,
        resultMessage: gainedMsg,
        gainedItems: pickupRes.acceptedItems,
        rejectedItems: pickupRes.rejectedItems,
        notifications: pickupRes.notifications
      };
    }

    if (action === 'butcher') {
      const existingSourceItems = lootSource.items || [];
      let butcherItemsToTake = existingSourceItems.filter(i =>
        !(i.name || '').toLowerCase().includes('kristall')
      );

      let perfSummary = 'Bereits erzeugte Ressourcen';

      if (butcherItemsToTake.length === 0) {
        if (harvestOptions.isBodyHarvested) {
          return {
            updatedAdventure: adventure,
            resultMessage: 'Dieser Kadaver wurde bereits vollständig zerlegt.',
            gainedItems: [],
            rejectedItems: [],
            notifications: []
          };
        }

        const baseButcherYield = harvestOptions.butcherYield || [
          { name: `Bestienleder (${lootSource.title})`, quantity: 2, weightKg: 1.5, category: 'Rohstoffe' },
          { name: `Monsterfleisch (${lootSource.title})`, quantity: 3, weightKg: 2.0, category: 'Nahrung' },
          { name: `Reißzahn (${lootSource.title})`, quantity: 2, weightKg: 0.3, category: 'Rohstoffe' }
        ];

        const perf = this.evaluateHarvestPerformance(executor, updatedAdv, targetId, 'butcher', 'frisch', baseButcherYield);
        updatedAdv = perf.updatedAdventure;
        butcherItemsToTake = perf.computedYield;
        perfSummary = perf.performanceSummary;

        const updatedSourceItems = [...existingSourceItems, ...butcherItemsToTake];
        updatedAdv = {
          ...updatedAdv,
          lootSources: (updatedAdv.lootSources || []).map(ls =>
            ls.id === lootSourceId
              ? { ...ls, items: updatedSourceItems }
              : ls
          )
        };
      }

      const pickupRes = this.pickupItems(
        updatedAdv,
        targetId,
        butcherItemsToTake.map(p => ({ itemInstanceId: p.id, item: p, quantity: p.quantity })),
        { sourceId: lootSourceId, allowPartial: true }
      );
      updatedAdv = pickupRes.updatedAdventure;

      const currentLs = (updatedAdv.lootSources || []).find(ls => ls.id === lootSourceId);
      const remainingButcherItemsOnLs = (currentLs?.items || []).filter(i =>
        !(i.name || '').toLowerCase().includes('kristall')
      );

      const isFullyHarvested = remainingButcherItemsOnLs.length === 0;

      if (isFullyHarvested) {
        updatedAdv = {
          ...updatedAdv,
          lootSources: (updatedAdv.lootSources || []).map(ls =>
            ls.id === lootSourceId
              ? { ...ls, harvestOptions: { ...(ls.harvestOptions || {}), isBodyHarvested: true } }
              : ls
          )
        };
      }

      const gainedMsg = pickupRes.acceptedItems.length > 0
        ? (isFullyHarvested
            ? `Kadaver zerlegt und Ressourcen gewonnen (${perfSummary}).`
            : `Teil der zerlegten Ressourcen aufgenommen (${perfSummary}). Der Rest liegt weiterhin an der Quelle.`)
        : updatedAdv.pendingPickup
            ? `Kadaver zerlegt und Ressourcen freigelegt (${perfSummary}). Aufnahmebestätigung erforderlich.`
            : `Zerlegte Teile liegen an der Quelle, konnten aber wegen Traglast nicht aufgenommen werden (${perfSummary}).`;

      return {
        updatedAdventure: updatedAdv,
        resultMessage: gainedMsg,
        gainedItems: pickupRes.acceptedItems,
        rejectedItems: pickupRes.rejectedItems,
        notifications: pickupRes.notifications
      };
    }

    if (action === 'take_body') {
      if (harvestOptions.isBodyHarvested) {
        return {
          updatedAdventure: adventure,
          resultMessage: 'Der Kadaver wurde bereits zerlegt und kann nicht mehr am Stück mitgenommen werden.',
          gainedItems: [],
          rejectedItems: [],
          notifications: []
        };
      }

      const bodyWeight = harvestOptions.bodyItem?.weightKg || this.getItemWeightKg(lootSource.title, 'Kadaver');
      const bodyInstance: ItemInstance = harvestOptions.bodyItem || {
        id: `inst-body-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemDefinitionId: `def-body-${lootSource.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: `Kadaver: ${lootSource.title}`,
        category: 'Kadaver & Körper',
        quantity: 1,
        weightKg: bodyWeight,
        isCorpseOrBody: true,
        isHarvestable: true,
        condition: 'frisch',
        quality: 'Schwer',
        sourceLootId: lootSourceId
      };

      const pickupRes = this.pickupItems(updatedAdv, targetId, [{ item: bodyInstance, quantity: 1 }], { sourceId: lootSourceId });

      if (pickupRes.acceptedItems.length > 0) {
        updatedAdv = {
          ...pickupRes.updatedAdventure,
          lootSources: (pickupRes.updatedAdventure.lootSources || []).filter(ls => ls.id !== lootSourceId)
        };
        return {
          updatedAdventure: updatedAdv,
          resultMessage: `Gesamten Körper (${lootSource.title}, ${bodyWeight.toFixed(1)} kg) aufgenommen.`,
          gainedItems: pickupRes.acceptedItems,
          rejectedItems: pickupRes.rejectedItems,
          notifications: pickupRes.notifications
        };
      } else {
        return {
          updatedAdventure: updatedAdv,
          resultMessage: `Kadaver (${bodyWeight.toFixed(1)} kg) ist zu schwer für die verfügbare Traglast. Er bleibt am Ort liegen.`,
          gainedItems: [],
          rejectedItems: pickupRes.rejectedItems,
          notifications: pickupRes.notifications
        };
      }
    }

    return {
      updatedAdventure: adventure,
      resultMessage: 'Aktion abgeschlossen.',
      gainedItems: [],
      rejectedItems: [],
      notifications: []
    };
  }

  /**
   * Drop an item from inventory to the ground at current location (WorldDrop).
   */
  public static dropItem(
    adventure: Adventure,
    targetIdentifier: string = 'player',
    itemInstanceId: string,
    locationContext?: CurrentLocationContext
  ): {
    updatedAdventure: Adventure;
    droppedItem: WorldDropItem | null;
    notification?: InventoryNotification;
  } {
    const targetId = EquipmentConditionService.resolveTargetId(adventure, targetIdentifier);
    const itemInstances = [...(adventure.itemInstances || [])];
    const targetInst = itemInstances.find(i => i.id === itemInstanceId && i.owner === targetId);

    if (!targetInst) {
      return {
        updatedAdventure: adventure,
        droppedItem: null
      };
    }

    let unequippedAdv = EquipmentConditionService.detachRestraint(adventure, targetId, itemInstanceId, { itemInstanceId }).updatedAdventure;
    unequippedAdv = EquipmentConditionService.unequipItem(unequippedAdv, targetId, itemInstanceId, { itemInstanceId }).updatedAdventure;

    const updatedInstances = (unequippedAdv.itemInstances || []).map(i => {
      if (i.id === itemInstanceId) {
        return {
          ...i,
          owner: 'world',
          location: 'Am Boden abgelegt',
          currentState: 'abgelegt'
        };
      }
      return i;
    });

    const worldDrop: WorldDropItem = {
      id: `drop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemInstance: { ...targetInst, owner: 'world', location: 'Am Boden', currentState: 'abgelegt' },
      locationContext: locationContext || adventure.currentLocation,
      droppedAtTime: new Date().toISOString(),
      droppedByCharacterId: targetId
    };

    const worldDrops = [...(unequippedAdv.worldDrops || []), worldDrop];

    const notification: InventoryNotification = {
      id: Math.random().toString(),
      itemName: targetInst.name || 'Gegenstand',
      quantity: targetInst.quantity || 1,
      weightKg: this.getItemWeightKg(targetInst),
      action: 'dropped',
      timestamp: new Date().toISOString()
    };

    let updatedAdventure: Adventure = {
      ...unequippedAdv,
      itemInstances: updatedInstances,
      worldDrops
    };

    if (targetId === 'player') {
      updatedAdventure = EquipmentConditionService.syncStructuredInventory(updatedAdventure);
    }

    return {
      updatedAdventure,
      droppedItem: worldDrop,
      notification
    };
  }

  /**
   * Destroy an item instance completely (Wegwerfen != Zerstören).
   */
  public static destroyItem(
    adventure: Adventure,
    targetIdentifier: string = 'player',
    itemInstanceId: string
  ): {
    updatedAdventure: Adventure;
    destroyed: boolean;
  } {
    const resAdv = EquipmentConditionService.destroyItem(adventure, targetIdentifier, itemInstanceId, { itemInstanceId });
    return {
      updatedAdventure: resAdv,
      destroyed: true
    };
  }

  /**
   * Use a consumable or interactive item (healing potion, food, antidote, tool).
   */
  public static useItem(
    adventure: Adventure,
    targetIdentifier: string = 'player',
    itemInstanceId: string
  ): {
    updatedAdventure: Adventure;
    resultMessage: string;
    consumed: boolean;
    notification?: InventoryNotification;
  } {
    const targetId = EquipmentConditionService.resolveTargetId(adventure, targetIdentifier);
    const inst = (adventure.itemInstances || []).find(i => i.id === itemInstanceId && i.owner === targetId);

    if (!inst) {
      return {
        updatedAdventure: adventure,
        resultMessage: 'Gegenstand nicht im Besitz.',
        consumed: false
      };
    }

    const nameLower = (inst.name || '').toLowerCase();
    let updatedAdv = { ...adventure };
    let resultMessage = `${inst.name || 'Gegenstand'} benutzt.`;
    let consumed = false;

    if (nameLower.includes('heiltrank') || nameLower.includes('trank') || nameLower.includes('elixier') || nameLower.includes('medizin')) {
      consumed = true;
      if (targetId === 'player') {
        const currentCombat = updatedAdv.combatState;
        if (currentCombat) {
          const healedHp = Math.min(currentCombat.playerMaxHp, currentCombat.playerHp + 25);
          updatedAdv.combatState = { ...currentCombat, playerHp: healedHp };
          resultMessage = `${inst.name} getrunken. 25 Lebenspunkte wiederhergestellt.`;
        } else {
          resultMessage = `${inst.name} eingenommen. Vitalität aufgefrischt.`;
        }
      }
    } else if (nameLower.includes('gegengift') || nameLower.includes('antidot')) {
      consumed = true;
      const removeRes = EquipmentConditionService.removeCondition(updatedAdv, targetId, 'Gift');
      updatedAdv = removeRes.updatedAdventure;
      resultMessage = `${inst.name} eingenommen. Vergiftungszustand neutralisiert.`;
    } else if (nameLower.includes('brot') || nameLower.includes('ration') || nameLower.includes('apfel') || nameLower.includes('fleisch')) {
      consumed = true;
      resultMessage = `${inst.name} verzehrt.`;
    } else {
      resultMessage = `${inst.name} verwendet.`;
    }

    if (consumed) {
      const currentQty = inst.quantity || 1;
      if (currentQty > 1) {
        updatedAdv = {
          ...updatedAdv,
          itemInstances: (updatedAdv.itemInstances || []).map(i => i.id === inst.id ? { ...i, quantity: currentQty - 1 } : i)
        };
      } else {
        updatedAdv = this.destroyItem(updatedAdv, targetId, inst.id).updatedAdventure;
      }
    }

    const notification: InventoryNotification = {
      id: Math.random().toString(),
      itemName: inst.name || 'Gegenstand',
      quantity: 1,
      action: 'used',
      timestamp: new Date().toISOString()
    };

    return {
      updatedAdventure: updatedAdv,
      resultMessage,
      consumed,
      notification
    };
  }

  /**
   * Register a new LootSource (Corpse, Chest, Battlefield, ResourceNode).
   */
  public static registerLootSource(
    adventure: Adventure,
    sourceInput: Omit<LootSource, 'id' | 'createdAt'> & { id?: string }
  ): {
    updatedAdventure: Adventure;
    lootSource: LootSource;
  } {
    const id = sourceInput.id || `loot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const lootSource: LootSource = {
      ...sourceInput,
      id,
      items: sourceInput.items || [],
      createdAt: new Date().toISOString(),
      isSearched: false
    };

    const existingSources = (adventure.lootSources || []).filter(ls => ls.id !== id);
    const updatedSources = [...existingSources, lootSource];

    return {
      updatedAdventure: {
        ...adventure,
        lootSources: updatedSources
      },
      lootSource
    };
  }

  /**
   * Create a collection task (Sammelauftrag) for battlefield salvage or gathering.
   */
  public static createCollectionTask(
    adventure: Adventure,
    taskInput: Partial<CollectionTask> & { title: string; targetQuantity: number }
  ): {
    updatedAdventure: Adventure;
    task: CollectionTask;
  } {
    const id = taskInput.id || `task-col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const task: CollectionTask = {
      id,
      title: taskInput.title,
      description: taskInput.description || `Sammelauftrag: ${taskInput.title}`,
      targetQuantity: taskInput.targetQuantity,
      collectedQuantity: taskInput.collectedQuantity || 0,
      unit: taskInput.unit || 'Stück',
      itemKeywords: taskInput.itemKeywords || [],
      sourceLocation: taskInput.sourceLocation || adventure.storyState?.currentLocationName,
      assignedToCharacterId: taskInput.assignedToCharacterId || 'player',
      assignedToCharacterName: taskInput.assignedToCharacterName || (taskInput.assignedToCharacterId === 'player' ? (adventure.player?.name || 'Spieler') : 'Begleiter'),
      targetStorage: taskInput.targetStorage || 'player',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const tasks = [...(adventure.collectionTasks || []), task];

    return {
      updatedAdventure: {
        ...adventure,
        collectionTasks: tasks
      },
      task
    };
  }

  /**
   * Progress active collection tasks when items are picked up.
   */
  public static progressCollectionTasks(
    adventure: Adventure,
    item: ItemInstance,
    quantity: number,
    collectorId: string = 'player'
  ): Adventure {
    if (!adventure.collectionTasks || adventure.collectionTasks.length === 0) {
      return adventure;
    }

    const itemNameLower = (item.name || '').toLowerCase();
    const itemCategoryLower = (item.category || '').toLowerCase();

    const updatedTasks = adventure.collectionTasks.map(task => {
      if (task.status !== 'active') return task;

      if (task.assignedToCharacterId && task.assignedToCharacterId !== collectorId && task.assignedToCharacterId !== 'party') {
        return task;
      }

      const keywords = task.itemKeywords || [];
      const matches = keywords.length === 0 || keywords.some(kw =>
        itemNameLower.includes(kw.toLowerCase()) || itemCategoryLower.includes(kw.toLowerCase())
      );

      if (matches) {
        const newCollected = Math.min(task.targetQuantity, task.collectedQuantity + quantity);
        const isCompleted = newCollected >= task.targetQuantity;
        return {
          ...task,
          collectedQuantity: newCollected,
          status: isCompleted ? 'completed' : 'active',
          updatedAt: new Date().toISOString()
        } as CollectionTask;
      }
      return task;
    });

    return {
      ...adventure,
      collectionTasks: updatedTasks
    };
  }

  /**
   * Delegate a collection task to a companion / group / wagon storage.
   */
  public static delegateCollectionTask(
    adventure: Adventure,
    taskId: string,
    assigneeId: string,
    targetStorage: string = 'party'
  ): Adventure {
    const tasks = (adventure.collectionTasks || []).map(t => {
      if (t.id === taskId) {
        const char = EquipmentConditionService.getCharacter(adventure, assigneeId);
        const assigneeName = char ? (char.name || (char as any).rufName) : assigneeId;
        return {
          ...t,
          assignedToCharacterId: assigneeId,
          assignedToCharacterName: assigneeName,
          targetStorage,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    return {
      ...adventure,
      collectionTasks: tasks
    };
  }

  /**
   * Compact combat inventory: filters only immediate combat-usable items (potions, scrolls, throwing weapons).
   */
  public static getCombatUsableItems(
    adventure: Adventure,
    targetIdentifier: string = 'player'
  ): ItemInstance[] {
    const targetId = EquipmentConditionService.resolveTargetId(adventure, targetIdentifier);
    const instances = (adventure.itemInstances || []).filter(i => i.owner === targetId && i.currentState !== 'abgelegt');

    return instances.filter(inst => {
      const name = (inst.name || '').toLowerCase();
      const cat = (inst.category || '').toLowerCase();

      return (
        cat.includes('verbrauch') ||
        cat.includes('medizin') ||
        cat.includes('trank') ||
        cat.includes('alchemie') ||
        name.includes('heiltrank') ||
        name.includes('trank') ||
        name.includes('elixier') ||
        name.includes('gegengift') ||
        name.includes('verband') ||
        name.includes('salbe') ||
        name.includes('schriftrolle') ||
        name.includes('scroll') ||
        name.includes('wurfmesser') ||
        name.includes('bombe') ||
        name.includes('rauchbombe') ||
        name.includes('antidot')
      );
    });
  }
}
