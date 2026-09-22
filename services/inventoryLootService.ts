import {
  Adventure,
  Character,
  NPC,
  ItemDefinition,
  ItemInstance,
  LootSource,
  LootSourceType,
  PendingPickupProposal,
  InventoryNotification,
  CollectionTask,
  WorldDropItem,
  InventorySettings,
  CustomInventoryItem,
  CurrentLocationContext
} from '../types';
import { EquipmentConditionService } from './equipmentConditionService';

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

    // Max carry weight: use custom settings or strength calculation
    let maxWeightKg = adventure.inventorySettings?.maxCarryCapacityKg;
    if (!maxWeightKg || maxWeightKg <= 0) {
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

    // Compute current weight of all ItemInstances owned by this character
    let totalWeight = 0;
    const ownedInstances = (adventure.itemInstances || []).filter(i => i.owner === targetId);

    ownedInstances.forEach(inst => {
      const singleWeight = this.getItemWeightKg(inst);
      const qty = typeof inst.quantity === 'number' && inst.quantity > 0 ? inst.quantity : 1;
      totalWeight += singleWeight * qty;
    });

    // If target is player and legacy structuredInventory contains customItems not yet mapped
    if (targetId === 'player' && adventure.structuredInventory?.customItems) {
      adventure.structuredInventory.customItems.forEach(ci => {
        // Only count if not already in itemInstances by name or id
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
   * Determine if an item is allowed to be picked up automatically based on user settings and weight.
   */
  public static isAutoPickupAllowed(
    item: ItemInstance,
    setting: 'always_confirm' | 'auto_small' | 'auto_all' = 'always_confirm',
    remainingCapacityKg: number = 25.0
  ): boolean {
    if (setting === 'always_confirm') {
      return false;
    }

    const weight = this.getItemWeightKg(item);

    // CRITICAL SAFETY RESTRICTIONS (Always require confirmation even in auto mode):
    // 1. Monster or animal carcasses / corpses
    if (item.isCorpseOrBody || weight >= 15.0) {
      return false;
    }

    // 2. Exceeds remaining carry capacity
    if (weight > remainingCapacityKg) {
      return false;
    }

    // 3. Heavy or restricted items
    if (item.isHeavyOrRestricted) {
      return false;
    }

    // If auto_small: only light common items, herbs, consumables, potions under 1.5 kg
    if (setting === 'auto_small') {
      return weight <= 1.5;
    }

    // If auto_all: allows normal items up to 5.0 kg that fit in capacity
    if (setting === 'auto_all') {
      return weight <= 5.0;
    }

    return false;
  }

  /**
   * Execute pickup of items into a character's inventory with weight validation.
   * Priority: Exact itemInstanceId.
   */
  public static pickupItems(
    adventure: Adventure,
    targetIdentifier: string = 'player',
    itemsToTake: { itemInstanceId?: string; item?: ItemInstance; quantity?: number }[],
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
    let updatedAdv: Adventure = { ...adventure };

    const acceptedItems: ItemInstance[] = [];
    const rejectedItems: { item: ItemInstance; reason: string }[] = [];
    const notifications: InventoryNotification[] = [];

    const allowPartial = options?.allowPartial ?? true;
    let itemInstances = [...(updatedAdv.itemInstances || [])];
    let itemDefinitions = [...(updatedAdv.itemDefinitions || [])];

    itemsToTake.forEach(takeReq => {
      // 1. Resolve concrete item instance
      let inst: ItemInstance | null = null;
      if (takeReq.itemInstanceId) {
        inst = itemInstances.find(i => i.id === takeReq.itemInstanceId) || null;
      }
      if (!inst && takeReq.item) {
        inst = { ...takeReq.item };
      }
      if (!inst) return;

      const singleWeight = this.getItemWeightKg(inst);
      const qty = takeReq.quantity || inst.quantity || 1;
      const totalItemWeight = singleWeight * qty;

      // 2. Check carry capacity
      const capacity = this.getCarryCapacity(updatedAdv, targetId);
      if (capacity.remainingCapacityKg < totalItemWeight) {
        rejectedItems.push({
          item: inst,
          reason: `Traglast überschritten (benötigt ${totalItemWeight.toFixed(1)} kg, verfügbar: ${capacity.remainingCapacityKg.toFixed(1)} kg)`
        });
        if (!allowPartial) {
          return;
        }
        return;
      }

      // 3. Ensure ItemDefinition exists in canonical registry
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

      // 4. Update or add ItemInstance with target owner
      const instIndex = itemInstances.findIndex(i => i.id === inst!.id);
      const updatedInstance: ItemInstance = {
        ...inst,
        itemDefinitionId: def.id,
        owner: targetId,
        currentState: 'im Inventar',
        location: targetId === 'player' ? 'Inventar' : `Im Besitz von ${targetId}`,
        quantity: qty,
        weightKg: singleWeight
      };

      if (instIndex >= 0) {
        itemInstances[instIndex] = updatedInstance;
      } else {
        itemInstances.push(updatedInstance);
      }

      // 5. Update legacy inventory array if player
      if (targetId === 'player') {
        const legacyInv = [...(updatedAdv.inventory || [])];
        const cleanName = updatedInstance.name || 'Gegenstand';
        if (!legacyInv.some(i => (typeof i === 'string' ? i : (i as any)?.name)?.toLowerCase() === cleanName.toLowerCase())) {
          legacyInv.push(cleanName);
        }
        updatedAdv = { ...updatedAdv, inventory: legacyInv };
      }

      // 6. Clean up from worldDrops if item was on the ground
      if (updatedAdv.worldDrops) {
        updatedAdv = {
          ...updatedAdv,
          worldDrops: updatedAdv.worldDrops.filter(wd => wd.itemInstance.id !== updatedInstance.id)
        };
      }

      // 7. Clean up from LootSources if item was part of a loot source
      if (updatedAdv.lootSources) {
        updatedAdv = {
          ...updatedAdv,
          lootSources: updatedAdv.lootSources.map(ls => ({
            ...ls,
            items: (ls.items || []).filter(i => i.id !== updatedInstance.id)
          }))
        };
      }

      acceptedItems.push(updatedInstance);
      notifications.push({
        id: Math.random().toString(),
        itemName: updatedInstance.name || 'Gegenstand',
        quantity: qty,
        weightKg: totalItemWeight,
        action: 'gained',
        timestamp: new Date().toISOString()
      });

      // Advance any active CollectionTasks
      updatedAdv = this.progressCollectionTasks(updatedAdv, updatedInstance, qty, targetId);
    });

    // Clear pending pickup if all items were resolved
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
      pendingPickup
    };

    // Synchronize structuredInventory
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
   * Drop an item from inventory to the ground at current location (WorldDrop).
   * Item remains existent with its exact itemInstanceId.
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

    // 1. Unequip & detach if equipped
    let unequippedAdv = EquipmentConditionService.detachRestraint(adventure, targetId, itemInstanceId, { itemInstanceId }).updatedAdventure;
    unequippedAdv = EquipmentConditionService.unequipItem(unequippedAdv, targetId, itemInstanceId, { itemInstanceId }).updatedAdventure;

    // 2. Update ItemInstance location & state to ground / world
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

    // 3. Remove from legacy inventory if player
    let updatedInventory = [...(unequippedAdv.inventory || [])];
    if (targetId === 'player' && targetInst.name) {
      const idx = updatedInventory.findIndex(i => (typeof i === 'string' ? i : (i as any)?.name)?.toLowerCase() === targetInst.name!.toLowerCase());
      if (idx >= 0) {
        updatedInventory.splice(idx, 1);
      }
    }

    // 4. Create WorldDrop record
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
      inventory: updatedInventory,
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

    // 1. Potion / Consumable healing & curing
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
      // Remove poison body conditions
      const removeRes = EquipmentConditionService.removeCondition(updatedAdv, targetId, 'Gift');
      updatedAdv = removeRes.updatedAdventure;
      resultMessage = `${inst.name} eingenommen. Vergiftungszustand neutralisiert.`;
    } else if (nameLower.includes('brot') || nameLower.includes('ration') || nameLower.includes('apfel') || nameLower.includes('fleisch')) {
      consumed = true;
      resultMessage = `${inst.name} verzehrt.`;
    } else {
      resultMessage = `${inst.name} verwendet.`;
    }

    // 2. If consumed, reduce quantity or destroy instance
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
   * Harvest monster or animal body (examine, crystals, butcher, take entire carcass).
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
    const gainedItems: ItemInstance[] = [];
    const rejectedItems: { item: ItemInstance; reason: string }[] = [];
    const notifications: InventoryNotification[] = [];

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
      if (harvestOptions.isCrystalsHarvested) {
        return {
          updatedAdventure: adventure,
          resultMessage: 'Die Kristalle wurden aus diesem Kadaver bereits geborgen.',
          gainedItems: [],
          rejectedItems: [],
          notifications: []
        };
      }

      const crystalYield = harvestOptions.crystalYield || [
        { name: `Monsterkristall (${lootSource.title})`, quantity: 1, weightKg: 0.2, category: 'Rohstoffe' }
      ];

      const crystalInstances: ItemInstance[] = crystalYield.map((cy, idx) => ({
        id: `inst-crys-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        itemDefinitionId: `def-crys-${cy.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: cy.name,
        category: cy.category || 'Rohstoffe',
        quantity: cy.quantity || 1,
        weightKg: cy.weightKg || 0.2,
        condition: 'makellos',
        quality: 'Selten',
        currentState: 'am Boden',
        sourceLootId: lootSourceId
      }));

      const pickupRes = this.pickupItems(updatedAdv, targetId, crystalInstances.map(c => ({ item: c, quantity: c.quantity })));
      updatedAdv = pickupRes.updatedAdventure;
      gainedItems.push(...pickupRes.acceptedItems);
      rejectedItems.push(...pickupRes.rejectedItems);
      notifications.push(...pickupRes.notifications);

      // Mark crystals harvested
      updatedAdv = {
        ...updatedAdv,
        lootSources: (updatedAdv.lootSources || []).map(ls =>
          ls.id === lootSourceId
            ? { ...ls, harvestOptions: { ...(ls.harvestOptions || {}), isCrystalsHarvested: true } }
            : ls
        )
      };

      return {
        updatedAdventure: updatedAdv,
        resultMessage: gainedItems.length > 0 ? `Monsterkristalle erfolgreich aus ${lootSource.title} geborgen.` : 'Kristalle konnten wegen Traglast nicht aufgenommen werden.',
        gainedItems,
        rejectedItems,
        notifications
      };
    }

    if (action === 'butcher') {
      if (harvestOptions.isBodyHarvested) {
        return {
          updatedAdventure: adventure,
          resultMessage: 'Dieser Kadaver wurde bereits vollständig zerlegt.',
          gainedItems: [],
          rejectedItems: [],
          notifications: []
        };
      }

      const butcherYield = harvestOptions.butcherYield || [
        { name: `Bestienleder (${lootSource.title})`, quantity: 2, weightKg: 1.5, category: 'Rohstoffe' },
        { name: `Monsterfleisch (${lootSource.title})`, quantity: 3, weightKg: 2.0, category: 'Nahrung' },
        { name: `Reißzahn (${lootSource.title})`, quantity: 2, weightKg: 0.3, category: 'Rohstoffe' }
      ];

      const partsInstances: ItemInstance[] = butcherYield.map((by, idx) => ({
        id: `inst-part-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        itemDefinitionId: `def-part-${by.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: by.name,
        category: by.category || 'Rohstoffe',
        quantity: by.quantity || 1,
        weightKg: by.weightKg || 1.0,
        condition: 'frisch',
        quality: 'Solide',
        currentState: 'am Boden',
        sourceLootId: lootSourceId
      }));

      const pickupRes = this.pickupItems(updatedAdv, targetId, partsInstances.map(p => ({ item: p, quantity: p.quantity })));
      updatedAdv = pickupRes.updatedAdventure;
      gainedItems.push(...pickupRes.acceptedItems);
      rejectedItems.push(...pickupRes.rejectedItems);
      notifications.push(...pickupRes.notifications);

      // Mark body butchered
      updatedAdv = {
        ...updatedAdv,
        lootSources: (updatedAdv.lootSources || []).map(ls =>
          ls.id === lootSourceId
            ? { ...ls, harvestOptions: { ...(ls.harvestOptions || {}), isBodyHarvested: true } }
            : ls
        )
      };

      return {
        updatedAdventure: updatedAdv,
        resultMessage: gainedItems.length > 0 ? `${lootSource.title} erfolgreich zerlegt und Ressourcen geborgen.` : 'Zerlegte Teile konnten wegen voller Traglast nicht aufgenommen werden.',
        gainedItems,
        rejectedItems,
        notifications
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

      const pickupRes = this.pickupItems(updatedAdv, targetId, [{ item: bodyInstance, quantity: 1 }]);
      updatedAdv = pickupRes.updatedAdventure;
      gainedItems.push(...pickupRes.acceptedItems);
      rejectedItems.push(...pickupRes.rejectedItems);
      notifications.push(...pickupRes.notifications);

      if (pickupRes.acceptedItems.length > 0) {
        // Remove loot source from world since full body is carried
        updatedAdv = {
          ...updatedAdv,
          lootSources: (updatedAdv.lootSources || []).filter(ls => ls.id !== lootSourceId)
        };
        return {
          updatedAdventure: updatedAdv,
          resultMessage: `Gesamten Körper (${lootSource.title}, ${bodyWeight.toFixed(1)} kg) aufgenommen und geschultert.`,
          gainedItems,
          rejectedItems,
          notifications
        };
      } else {
        return {
          updatedAdventure: updatedAdv,
          resultMessage: `Kadaver (${bodyWeight.toFixed(1)} kg) ist zu schwer für die verfügbare Traglast.`,
          gainedItems,
          rejectedItems,
          notifications
        };
      }
    }

    return {
      updatedAdventure: adventure,
      resultMessage: 'Aktion abgeschlossen.',
      gainedItems,
      rejectedItems,
      notifications
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

      // Check assignment
      if (task.assignedToCharacterId && task.assignedToCharacterId !== collectorId && task.assignedToCharacterId !== 'party') {
        return task;
      }

      // Check item keywords match
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

      // Consumables: Potions, Antidotes, Bandages, Scrolls, Throwing Knives, Bombs
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
