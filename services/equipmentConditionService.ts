import {
  Adventure,
  Character,
  NPC,
  BodyArea,
  BodyCondition,
  BodyConditionType,
  EquipmentState,
  ItemDefinition,
  ItemInstance,
  InventoryEntry,
  StructuredInventory,
  AIInventoryChange,
  AIBodyConditionChange,
  PendingPickupProposal
} from '../types';
import { InventoryLootService } from './inventoryLootService';

export class EquipmentConditionService {
  /**
   * Normalize character target identifier to 'player' or NPC id.
   */
  public static resolveTargetId(adventure: Adventure, targetIdentifier?: string): string {
    if (!targetIdentifier) return 'player';
    const clean = targetIdentifier.trim().toLowerCase();
    if (clean === 'player' || clean === 'spieler' || clean === 'user' || clean === 'protagonist') {
      return 'player';
    }
    const playerName = (adventure.player?.name || '').trim().toLowerCase();
    const playerNickname = (adventure.player?.nickname || '').trim().toLowerCase();
    if (clean === playerName || (playerNickname && clean === playerNickname)) {
      return 'player';
    }
    const matchedNpc = (adventure.npcs || []).find(n =>
      n.id.toLowerCase() === clean ||
      n.name.toLowerCase() === clean ||
      (n.nickname && n.nickname.toLowerCase() === clean) ||
      (n.rufName && n.rufName.toLowerCase() === clean)
    );
    if (matchedNpc) {
      return matchedNpc.id;
    }
    return targetIdentifier;
  }

  /**
   * Helper to fetch character object by targetId ('player' or NPC id).
   */
  public static getCharacter(adventure: Adventure, targetId: string): Character | NPC | null {
    if (targetId === 'player') {
      return adventure.player;
    }
    return (adventure.npcs || []).find(n => n.id === targetId) || null;
  }

  /**
   * Canonical body area deduction based on item name or description.
   */
  public static inferBodyAreas(itemName: string, description?: string): BodyArea[] {
    const combined = `${itemName} ${description || ''}`.toLowerCase();
    const areas: BodyArea[] = [];

    if (combined.includes('handfessel') || combined.includes('handschell') || combined.includes('handgelenk') || combined.includes('handschuh') || combined.includes('ring') || combined.includes('hände') || combined.includes('haende')) {
      areas.push('hands');
    }
    if (combined.includes('armfessel') || combined.includes('armschelle') || combined.includes('armreif') || combined.includes('armband') || combined.includes('unterarm') || combined.includes('oberarm') || combined.includes('arme')) {
      if (!areas.includes('arms')) areas.push('arms');
    }
    if (combined.includes('beinfessel') || combined.includes('fußfessel') || combined.includes('fussfessel') || combined.includes('beinschelle') || combined.includes('fußschelle') || combined.includes('fusschell') || combined.includes('beine') || combined.includes('hose') || combined.includes('schenkel')) {
      if (!areas.includes('legs')) areas.push('legs');
    }
    if (combined.includes('fuß') || combined.includes('fuss') || combined.includes('stiefel') || combined.includes('schuh')) {
      if (!areas.includes('feet')) areas.push('feet');
    }
    if (combined.includes('halsfessel') || combined.includes('halsband') || combined.includes('halskette') || combined.includes('kragen') || combined.includes('hals')) {
      if (!areas.includes('neck')) areas.push('neck');
    }
    if (combined.includes('knebel') || combined.includes('maske') || combined.includes('augenbinde') || combined.includes('helm') || combined.includes('stirnband') || combined.includes('kopf') || combined.includes('gesicht')) {
      if (combined.includes('knebel') || combined.includes('maske') || combined.includes('augenbinde') || combined.includes('gesicht')) {
        if (!areas.includes('face')) areas.push('face');
      }
      if (!areas.includes('head')) areas.push('head');
    }
    if (combined.includes('brust') || combined.includes('torso') || combined.includes('hemd') || combined.includes('wams') || combined.includes('robe') || combined.includes('rüstung') || combined.includes('panzer') || combined.includes('harnisch')) {
      if (!areas.includes('chest')) areas.push('chest');
    }
    if (combined.includes('ganzkörper') || combined.includes('vollkörper') || combined.includes('vollständig gefesselt') || combined.includes('eingeschnürt')) {
      return ['arms', 'hands', 'legs', 'feet', 'whole_body'];
    }

    if (areas.length === 0) {
      if (combined.includes('fessel') || combined.includes('gebunden') || combined.includes('ketten') || combined.includes('stricke')) {
        return ['hands', 'arms'];
      }
      return ['whole_body'];
    }

    return areas;
  }

  /**
   * Attach a physical restraint to a character (Player or NPC).
   * - Creates/updates ItemInstance & ItemDefinition
   * - Priority 1: itemInstanceId, Priority 2: itemDefinitionId, Priority 3: Name fallback
   * - Creates/updates EquipmentState (slot: 'restraint', isRestraint: true)
   * - Creates/updates persistent BodyCondition in appearance.activeConditions
   * - Guarantees EquipmentState.itemInstanceId === BodyCondition.sourceItemInstanceId
   * - Retains state persistently across turns
   */
  public static attachRestraint(
    adventure: Adventure,
    targetIdentifier: string,
    itemName: string,
    bodyAreasInput?: BodyArea[],
    options?: {
      description?: string;
      condition?: string;
      source?: string;
      itemInstanceId?: string;
      itemDefinitionId?: string;
      severity?: 'leicht' | 'mittel' | 'stark' | 'vollständig';
      duration?: string;
    }
  ): {
    updatedAdventure: Adventure;
    condition: BodyCondition;
    equipment: EquipmentState;
    itemInstance: ItemInstance;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const cleanItemName = itemName.trim();
    const bodyAreas = (bodyAreasInput && bodyAreasInput.length > 0)
      ? bodyAreasInput
      : this.inferBodyAreas(cleanItemName, options?.description);

    const defId = options?.itemDefinitionId || `item-def-${cleanItemName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // 1. Ensure ItemDefinition
    let itemDefs = [...(adventure.itemDefinitions || [])];
    let existingDef = itemDefs.find(d => d.id === defId || d.name.toLowerCase() === cleanItemName.toLowerCase());
    if (!existingDef) {
      existingDef = {
        id: defId,
        name: cleanItemName,
        category: 'Ausrüstung',
        subcategory: 'Fesseln & Fixierung',
        description: options?.description || `Physische Fesselung: ${cleanItemName}`
      };
      itemDefs.push(existingDef);
    }

    // 2. Identify or Create ItemInstance
    // Priority: 1. options.itemInstanceId, 2. unequipped instance of same name for this owner, 3. new instance
    let itemInstances = [...(adventure.itemInstances || [])];
    let targetInstanceIdx = -1;

    if (options?.itemInstanceId) {
      targetInstanceIdx = itemInstances.findIndex(inst => inst.id === options.itemInstanceId);
    } else {
      // Look for an existing UNATTACHED / UNEQUIPPED instance owned by target or unassigned
      targetInstanceIdx = itemInstances.findIndex(inst =>
        inst.name?.toLowerCase() === cleanItemName.toLowerCase() &&
        inst.owner === targetId &&
        inst.currentState !== 'angelegt / aktiv' &&
        inst.currentState !== 'ausgerüstet'
      );
    }

    let itemInstance: ItemInstance;
    if (targetInstanceIdx >= 0) {
      itemInstance = {
        ...itemInstances[targetInstanceIdx],
        condition: options?.condition || itemInstances[targetInstanceIdx].condition || 'stabil angelegt',
        owner: targetId,
        location: `Angelegt an ${targetId === 'player' ? (adventure.player?.name || 'Spieler') : targetId}`,
        currentState: 'angelegt / aktiv'
      };
      itemInstances[targetInstanceIdx] = itemInstance;
    } else {
      const newInstanceId = options?.itemInstanceId || `item-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      itemInstance = {
        id: newInstanceId,
        itemDefinitionId: existingDef.id,
        name: cleanItemName,
        condition: options?.condition || 'stabil angelegt',
        owner: targetId,
        location: `Angelegt an ${targetId === 'player' ? (adventure.player?.name || 'Spieler') : targetId}`,
        quantity: 1,
        currentState: 'angelegt / aktiv'
      };
      itemInstances.push(itemInstance);
    }

    // 3. Ensure EquipmentState
    let adventureEquipment = [...(adventure.equipmentState || [])];
    // Find equipment by itemInstanceId (Priority 1)
    const equipIdx = adventureEquipment.findIndex(e => e.itemInstanceId === itemInstance.id);
    const equipment: EquipmentState = {
      itemInstanceId: itemInstance.id,
      itemDefinitionId: existingDef.id,
      itemName: cleanItemName,
      ownerId: targetId,
      equipped: true,
      isRestraint: true,
      slot: 'restraint',
      bodyAreas,
      condition: itemInstance.condition,
      attachedAt: new Date().toISOString(),
      source: options?.source || 'Fremdeinwirkung',
      description: options?.description || `Fixiert an ${bodyAreas.join(', ')}`
    };

    if (equipIdx >= 0) {
      adventureEquipment[equipIdx] = equipment;
    } else {
      adventureEquipment.push(equipment);
    }

    // 4. Ensure persistent BodyCondition with sourceItemInstanceId === itemInstance.id
    const conditionId = `cond-restraint-${itemInstance.id}`;
    const conditionDesc = options?.description || `Körperlich gefesselt an: ${bodyAreas.join(', ')} (${cleanItemName})`;
    const condition: BodyCondition = {
      id: conditionId,
      name: cleanItemName,
      type: 'restraint',
      category: 'Fesselung / Fixierung',
      icon: '🔒',
      isActive: true,
      severity: options?.severity || 'mittel',
      source: options?.source || cleanItemName,
      duration: options?.duration || 'Bis gelöst',
      description: conditionDesc,
      bodyAreas,
      sourceItemInstanceId: itemInstance.id,
      isRestraint: true,
      statusTag: `Gefesselt (${cleanItemName})`
    };

    // Apply to target character's appearance.activeConditions & equipment
    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      const currentConds = [...(updatedPlayer.appearance?.activeConditions || [])];
      const condIdx = currentConds.findIndex(c =>
        c.id === condition.id ||
        (c.sourceItemInstanceId && c.sourceItemInstanceId === itemInstance.id)
      );
      if (condIdx >= 0) {
        currentConds[condIdx] = { ...currentConds[condIdx], ...condition, isActive: true };
      } else {
        currentConds.push(condition);
      }
      updatedPlayer = {
        ...updatedPlayer,
        appearance: {
          ...(updatedPlayer.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
          activeConditions: currentConds
        },
        equipment: (updatedPlayer.equipment || []).filter(e => e.itemInstanceId !== itemInstance.id).concat(equipment)
      };
    } else {
      const npcIdx = updatedNpcs.findIndex(n => n.id === targetId);
      if (npcIdx >= 0) {
        const npc = updatedNpcs[npcIdx];
        const currentConds = [...(npc.appearance?.activeConditions || [])];
        const condIdx = currentConds.findIndex(c =>
          c.id === condition.id ||
          (c.sourceItemInstanceId && c.sourceItemInstanceId === itemInstance.id)
        );
        if (condIdx >= 0) {
          currentConds[condIdx] = { ...currentConds[condIdx], ...condition, isActive: true };
        } else {
          currentConds.push(condition);
        }
        updatedNpcs[npcIdx] = {
          ...npc,
          appearance: {
            ...(npc.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
            activeConditions: currentConds
          },
          equipment: (npc.equipment || []).filter(e => e.itemInstanceId !== itemInstance.id).concat(equipment)
        };
      }
    }

    const updatedAdventure: Adventure = {
      ...adventure,
      player: updatedPlayer,
      npcs: updatedNpcs,
      itemDefinitions: itemDefs,
      itemInstances,
      equipmentState: adventureEquipment
    };

    return {
      updatedAdventure,
      condition,
      equipment,
      itemInstance
    };
  }

  /**
   * Detach or remove a restraint from a character.
   * Priority:
   * 1. Exact itemInstanceId match (removes ONLY that concrete instance)
   * 2. BodyCondition.id match
   * 3. Name fallback: only remove the first matching instance/condition for that owner, never other instances
   */
  public static detachRestraint(
    adventure: Adventure,
    targetIdentifier: string,
    itemOrConditionIdentifier: string,
    options?: {
      itemInstanceId?: string;
    }
  ): {
    updatedAdventure: Adventure;
    removed: boolean;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const searchKey = (options?.itemInstanceId || itemOrConditionIdentifier).trim();
    const cleanSearchLower = searchKey.toLowerCase();

    let removed = false;
    let adventureEquipment = [...(adventure.equipmentState || [])];
    let itemInstances = [...(adventure.itemInstances || [])];

    // Check if searchKey is an exact itemInstanceId
    const isExactInstanceId = Boolean(options?.itemInstanceId) ||
      adventureEquipment.some(e => e.itemInstanceId === searchKey) ||
      itemInstances.some(i => i.id === searchKey) ||
      searchKey.startsWith('item-inst-');

    const removedInstanceIds = new Set<string>();

    if (isExactInstanceId) {
      const targetInstId = options?.itemInstanceId || searchKey;
      const equipIndex = adventureEquipment.findIndex(e => e.ownerId === targetId && e.itemInstanceId === targetInstId);
      
      const targetChar = this.getCharacter(adventure, targetId);
      const hasCondition = (targetChar?.appearance?.activeConditions || []).some(
        c => (c.sourceItemInstanceId && c.sourceItemInstanceId === targetInstId) || c.id === targetInstId
      );
      const hasOwnedInstance = itemInstances.some(i => i.id === targetInstId && i.owner === targetId);

      if (equipIndex === -1 && !hasCondition && !hasOwnedInstance) {
        // SAFE ABORT: target instance is not attached or owned by targetId. Do NOT remove anything!
        return {
          updatedAdventure: adventure,
          removed: false
        };
      }

      if (equipIndex >= 0) {
        adventureEquipment.splice(equipIndex, 1);
        removed = true;
      }
      if (hasCondition || equipIndex >= 0) {
        removed = true;
      }
      removedInstanceIds.add(targetInstId);
    } else {
      // Fallback: match by exact name or condition ID
      const matchingEquip = adventureEquipment.find(e =>
        e.ownerId === targetId &&
        (e.itemInstanceId === searchKey ||
         e.itemName.toLowerCase() === cleanSearchLower)
      );

      if (matchingEquip) {
        adventureEquipment = adventureEquipment.filter(e => e !== matchingEquip);
        removedInstanceIds.add(matchingEquip.itemInstanceId);
        removed = true;
      }
    }

    if (!removed && removedInstanceIds.size === 0 && !isExactInstanceId) {
      // Check if there is an active condition matching name
      const targetChar = this.getCharacter(adventure, targetId);
      const matchingCond = (targetChar?.appearance?.activeConditions || []).find(
        c => c.name.toLowerCase() === cleanSearchLower || c.id === searchKey
      );
      if (matchingCond) {
        if (matchingCond.sourceItemInstanceId) {
          removedInstanceIds.add(matchingCond.sourceItemInstanceId);
        }
      }
    }

    // Update matching item instance states
    itemInstances = itemInstances.map(inst => {
      if (removedInstanceIds.has(inst.id)) {
        return {
          ...inst,
          currentState: 'abgelegt / gelöst',
          location: 'Am Boden / Inventar'
        };
      }
      return inst;
    });

    // Remove from target character's activeConditions and equipment
    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      let condRemoved = false;
      const currentConds = (updatedPlayer.appearance?.activeConditions || []).filter(c => {
        if (c.sourceItemInstanceId && removedInstanceIds.has(c.sourceItemInstanceId)) {
          condRemoved = true;
          return false;
        }
        if (c.id === searchKey) {
          condRemoved = true;
          return false;
        }
        if (!isExactInstanceId && removedInstanceIds.size === 0 && !condRemoved) {
          if (c.name.toLowerCase() === cleanSearchLower) {
            condRemoved = true;
            return false;
          }
        }
        return true;
      });
      if (condRemoved) removed = true;

      updatedPlayer = {
        ...updatedPlayer,
        appearance: {
          ...(updatedPlayer.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
          activeConditions: currentConds
        },
        equipment: (updatedPlayer.equipment || []).filter(e => !removedInstanceIds.has(e.itemInstanceId) && (isExactInstanceId ? true : e.itemName.toLowerCase() !== cleanSearchLower))
      };
    } else {
      const npcIdx = updatedNpcs.findIndex(n => n.id === targetId);
      if (npcIdx >= 0) {
        const npc = updatedNpcs[npcIdx];
        let condRemoved = false;
        const currentConds = (npc.appearance?.activeConditions || []).filter(c => {
          if (c.sourceItemInstanceId && removedInstanceIds.has(c.sourceItemInstanceId)) {
            condRemoved = true;
            return false;
          }
          if (c.id === searchKey) {
            condRemoved = true;
            return false;
          }
          if (!isExactInstanceId && removedInstanceIds.size === 0 && !condRemoved) {
            if (c.name.toLowerCase() === cleanSearchLower) {
              condRemoved = true;
              return false;
            }
          }
          return true;
        });
        if (condRemoved) removed = true;

        updatedNpcs[npcIdx] = {
          ...npc,
          appearance: {
            ...(npc.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
            activeConditions: currentConds
          },
          equipment: (npc.equipment || []).filter(e => !removedInstanceIds.has(e.itemInstanceId) && (isExactInstanceId ? true : e.itemName.toLowerCase() !== cleanSearchLower))
        };
      }
    }

    return {
      updatedAdventure: {
        ...adventure,
        player: updatedPlayer,
        npcs: updatedNpcs,
        itemInstances,
        equipmentState: adventureEquipment
      },
      removed
    };
  }

  /**
   * Equip an item on a character (Player or NPC).
   * - Priority 1: options.itemInstanceId
   * - Priority 2: existing unequipped ItemInstance
   * - Priority 3: create new ItemInstance
   * - Accurately updates ItemInstance (currentState = 'ausgerüstet', location = 'Ausgerüstet')
   * - Writes the updated instance back into adventure.itemInstances
   * - Exclusively replaces regular armor slots without touching independent body conditions or restraints
   */
  public static equipItem(
    adventure: Adventure,
    targetIdentifier: string,
    itemName: string,
    slot?: string,
    bodyAreasInput?: BodyArea[],
    options?: {
      condition?: string;
      description?: string;
      source?: string;
      itemInstanceId?: string;
      itemDefinitionId?: string;
    }
  ): {
    updatedAdventure: Adventure;
    equipment: EquipmentState;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const cleanItemName = itemName.trim();
    const bodyAreas = (bodyAreasInput && bodyAreasInput.length > 0)
      ? bodyAreasInput
      : this.inferBodyAreas(cleanItemName, options?.description);

    const defId = options?.itemDefinitionId || `item-def-${cleanItemName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // 1. Item Definition
    let itemDefs = [...(adventure.itemDefinitions || [])];
    let existingDef = itemDefs.find(d => d.id === defId || d.name.toLowerCase() === cleanItemName.toLowerCase());
    if (!existingDef) {
      existingDef = {
        id: defId,
        name: cleanItemName,
        category: 'Ausrüstung',
        subcategory: slot || 'Kleidung / Rüstung',
        description: options?.description || `Ausrüstung: ${cleanItemName}`
      };
      itemDefs.push(existingDef);
    }

    // 2. Item Instance: Priority 1: itemInstanceId, 2: unequipped matching instance, 3: new instance
    let itemInstances = [...(adventure.itemInstances || [])];
    let targetInstIdx = -1;

    if (options?.itemInstanceId) {
      targetInstIdx = itemInstances.findIndex(i => i.id === options.itemInstanceId);
    } else {
      // Find unequipped instance for this owner
      targetInstIdx = itemInstances.findIndex(i =>
        i.name?.toLowerCase() === cleanItemName.toLowerCase() &&
        i.owner === targetId &&
        i.currentState !== 'ausgerüstet'
      );
      if (targetInstIdx < 0) {
        // Fallback: any instance of this name owned by targetId
        targetInstIdx = itemInstances.findIndex(i =>
          i.name?.toLowerCase() === cleanItemName.toLowerCase() &&
          i.owner === targetId
        );
      }
    }

    let existingInst: ItemInstance;
    if (targetInstIdx >= 0) {
      existingInst = {
        ...itemInstances[targetInstIdx],
        condition: options?.condition || itemInstances[targetInstIdx].condition || 'gut',
        owner: targetId,
        location: 'Ausgerüstet',
        currentState: 'ausgerüstet'
      };
      // CRITICAL: Write the updated instance back into itemInstances array!
      itemInstances[targetInstIdx] = existingInst;
    } else {
      const newInstId = options?.itemInstanceId || `item-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      existingInst = {
        id: newInstId,
        itemDefinitionId: existingDef.id,
        name: cleanItemName,
        condition: options?.condition || 'gut',
        owner: targetId,
        location: 'Ausgerüstet',
        quantity: 1,
        currentState: 'ausgerüstet'
      };
      itemInstances.push(existingInst);
    }

    // 3. Equipment State & Slot Conflict Resolution
    let adventureEquipment = [...(adventure.equipmentState || [])];
    // Unequip previous item in the same slot if exclusive (excluding restraints)
    if (slot && slot !== 'weapon' && slot !== 'weapons' && slot !== 'accessory' && slot !== 'restraint') {
      const replacedEquip = adventureEquipment.find(e => e.ownerId === targetId && e.slot === slot && !e.isRestraint);
      if (replacedEquip) {
        adventureEquipment = adventureEquipment.filter(e => e !== replacedEquip);
        // Update replaced item instance state to 'im Inventar'
        const replacedInstIdx = itemInstances.findIndex(i => i.id === replacedEquip.itemInstanceId);
        if (replacedInstIdx >= 0) {
          itemInstances[replacedInstIdx] = {
            ...itemInstances[replacedInstIdx],
            currentState: 'im Inventar',
            location: 'Inventar'
          };
        }
      }
    }

    const equipment: EquipmentState = {
      itemInstanceId: existingInst.id,
      itemDefinitionId: existingDef.id,
      itemName: cleanItemName,
      ownerId: targetId,
      equipped: true,
      isRestraint: false,
      slot: slot || 'inventory',
      bodyAreas,
      condition: existingInst.condition,
      attachedAt: new Date().toISOString(),
      source: options?.source || 'Selbst angelegt',
      description: options?.description
    };

    // Remove any prior equipment record for this specific instanceId
    adventureEquipment = adventureEquipment.filter(e => e.itemInstanceId !== existingInst.id);
    adventureEquipment.push(equipment);

    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      updatedPlayer = {
        ...updatedPlayer,
        equipment: (updatedPlayer.equipment || []).filter(e => e.itemInstanceId !== equipment.itemInstanceId && (slot && slot !== 'weapon' && slot !== 'accessory' && slot !== 'restraint' ? e.slot !== slot : true)).concat(equipment)
      };
    } else {
      const npcIdx = updatedNpcs.findIndex(n => n.id === targetId);
      if (npcIdx >= 0) {
        const npc = updatedNpcs[npcIdx];
        updatedNpcs[npcIdx] = {
          ...npc,
          equipment: (npc.equipment || []).filter(e => e.itemInstanceId !== equipment.itemInstanceId && (slot && slot !== 'weapon' && slot !== 'accessory' && slot !== 'restraint' ? e.slot !== slot : true)).concat(equipment)
        };
      }
    }

    let updatedAdventure: Adventure = {
      ...adventure,
      player: updatedPlayer,
      npcs: updatedNpcs,
      itemDefinitions: itemDefs,
      itemInstances,
      equipmentState: adventureEquipment
    };

    // Synchronize to structuredInventory for player
    if (targetId === 'player') {
      updatedAdventure = this.syncStructuredInventory(updatedAdventure);
    }

    return {
      updatedAdventure,
      equipment
    };
  }

  /**
   * Unequip an item from a character.
   * Priority:
   * 1. Exact itemInstanceId match (safe abort if not equipped on target)
   * 2. Slot match (legacy fallback)
   * 3. Name match (legacy fallback)
   * - Accurately updates ItemInstance state (currentState = 'im Inventar', location = 'Inventar')
   */
  public static unequipItem(
    adventure: Adventure,
    targetIdentifier: string,
    itemNameOrSlot: string,
    options?: {
      itemInstanceId?: string;
    }
  ): {
    updatedAdventure: Adventure;
    unequipped: boolean;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const searchKey = (options?.itemInstanceId || itemNameOrSlot).trim();
    const cleanSearchLower = searchKey.toLowerCase();

    let adventureEquipment = [...(adventure.equipmentState || [])];
    let itemInstances = [...(adventure.itemInstances || [])];

    const isExactInstanceId = Boolean(options?.itemInstanceId) ||
      adventureEquipment.some(e => e.itemInstanceId === searchKey) ||
      itemInstances.some(i => i.id === searchKey) ||
      searchKey.startsWith('item-inst-');

    const unequippedInstanceIds = new Set<string>();

    if (isExactInstanceId) {
      const targetInstId = options?.itemInstanceId || searchKey;
      const equipIdx = adventureEquipment.findIndex(e => e.ownerId === targetId && e.itemInstanceId === targetInstId);
      if (equipIdx >= 0) {
        adventureEquipment.splice(equipIdx, 1);
        unequippedInstanceIds.add(targetInstId);
      } else {
        // Safe abort: not equipped on this character
        return {
          updatedAdventure: adventure,
          unequipped: false
        };
      }
    } else {
      // Check for slot match
      const matchingSlotEquip = adventureEquipment.find(e => e.ownerId === targetId && e.slot && e.slot.toLowerCase() === cleanSearchLower && !e.isRestraint);
      if (matchingSlotEquip) {
        unequippedInstanceIds.add(matchingSlotEquip.itemInstanceId);
        adventureEquipment = adventureEquipment.filter(e => e !== matchingSlotEquip);
      } else {
        // Match by item name (first matching only!)
        const matchingNameEquip = adventureEquipment.find(e =>
          e.ownerId === targetId &&
          (e.itemName.toLowerCase() === cleanSearchLower || e.itemName.toLowerCase().includes(cleanSearchLower))
        );
        if (matchingNameEquip) {
          unequippedInstanceIds.add(matchingNameEquip.itemInstanceId);
          adventureEquipment = adventureEquipment.filter(e => e !== matchingNameEquip);
        }
      }
    }

    const unequipped = unequippedInstanceIds.size > 0;
    if (!unequipped) {
      return {
        updatedAdventure: adventure,
        unequipped: false
      };
    }

    // Update unequipped item instances
    itemInstances = itemInstances.map(inst => {
      if (unequippedInstanceIds.has(inst.id)) {
        return {
          ...inst,
          currentState: 'im Inventar',
          location: 'Inventar'
        };
      }
      return inst;
    });

    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      updatedPlayer = {
        ...updatedPlayer,
        equipment: (updatedPlayer.equipment || []).filter(e => !unequippedInstanceIds.has(e.itemInstanceId))
      };
    } else {
      const npcIdx = updatedNpcs.findIndex(n => n.id === targetId);
      if (npcIdx >= 0) {
        const npc = updatedNpcs[npcIdx];
        updatedNpcs[npcIdx] = {
          ...npc,
          equipment: (npc.equipment || []).filter(e => !unequippedInstanceIds.has(e.itemInstanceId))
        };
      }
    }

    let updatedAdventure: Adventure = {
      ...adventure,
      player: updatedPlayer,
      npcs: updatedNpcs,
      itemInstances,
      equipmentState: adventureEquipment
    };

    if (targetId === 'player') {
      updatedAdventure = this.syncStructuredInventory(updatedAdventure);
    }

    return {
      updatedAdventure,
      unequipped
    };
  }

  /**
   * Add a generic or physical BodyCondition to Player or NPC.
   * sourceItemInstanceId is optional (e.g. magical paralysis, beast hold, wounds).
   */
  public static addCondition(
    adventure: Adventure,
    targetIdentifier: string,
    conditionInput: Partial<BodyCondition> & { name: string }
  ): {
    updatedAdventure: Adventure;
    condition: BodyCondition;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const condId = conditionInput.id || `cond-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const condition: BodyCondition = {
      id: condId,
      name: conditionInput.name,
      type: conditionInput.type || 'physical_condition',
      category: conditionInput.category || 'Körperlicher Zustand',
      isActive: conditionInput.isActive ?? true,
      severity: conditionInput.severity || 'leicht',
      source: conditionInput.source || 'Handlung / Welt',
      duration: conditionInput.duration || 'Temporär',
      description: conditionInput.description || conditionInput.name,
      bodyAreas: conditionInput.bodyAreas || this.inferBodyAreas(conditionInput.name, conditionInput.description),
      sourceItemInstanceId: conditionInput.sourceItemInstanceId,
      isRestraint: conditionInput.isRestraint ?? (conditionInput.type === 'restraint' || conditionInput.name.toLowerCase().includes('fessel')),
      statusTag: conditionInput.statusTag || conditionInput.name,
      statBuffs: conditionInput.statBuffs
    };

    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      const conds = [...(updatedPlayer.appearance?.activeConditions || [])];
      const existingIdx = conds.findIndex(c =>
        c.id === condition.id ||
        (c.sourceItemInstanceId && condition.sourceItemInstanceId && c.sourceItemInstanceId === condition.sourceItemInstanceId) ||
        (!c.sourceItemInstanceId && !condition.sourceItemInstanceId && c.name.toLowerCase() === condition.name.toLowerCase())
      );
      if (existingIdx >= 0) {
        conds[existingIdx] = { ...conds[existingIdx], ...condition, isActive: true };
      } else {
        conds.push(condition);
      }
      updatedPlayer = {
        ...updatedPlayer,
        appearance: {
          ...(updatedPlayer.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
          activeConditions: conds
        }
      };
    } else {
      const npcIdx = updatedNpcs.findIndex(n => n.id === targetId);
      if (npcIdx >= 0) {
        const npc = updatedNpcs[npcIdx];
        const conds = [...(npc.appearance?.activeConditions || [])];
        const existingIdx = conds.findIndex(c =>
          c.id === condition.id ||
          (c.sourceItemInstanceId && condition.sourceItemInstanceId && c.sourceItemInstanceId === condition.sourceItemInstanceId) ||
          (!c.sourceItemInstanceId && !condition.sourceItemInstanceId && c.name.toLowerCase() === condition.name.toLowerCase())
        );
        if (existingIdx >= 0) {
          conds[existingIdx] = { ...conds[existingIdx], ...condition, isActive: true };
        } else {
          conds.push(condition);
        }
        updatedNpcs[npcIdx] = {
          ...npc,
          appearance: {
            ...(npc.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
            activeConditions: conds
          }
        };
      }
    }

    return {
      updatedAdventure: {
        ...adventure,
        player: updatedPlayer,
        npcs: updatedNpcs
      },
      condition
    };
  }

  /**
   * Remove a BodyCondition from Player or NPC by ID, sourceItemInstanceId, or name.
   */
  public static removeCondition(
    adventure: Adventure,
    targetIdentifier: string,
    conditionIdentifier: string,
    options?: {
      sourceItemInstanceId?: string;
      conditionId?: string;
    }
  ): {
    updatedAdventure: Adventure;
    removed: boolean;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const searchKey = (options?.sourceItemInstanceId || options?.conditionId || conditionIdentifier).trim();
    const cleanSearchLower = searchKey.toLowerCase();
    let removed = false;

    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    const isExactInstanceId = Boolean(options?.sourceItemInstanceId) ||
      (options?.conditionId && options.conditionId.startsWith('cond-')) ||
      (adventure.itemInstances || []).some(i => i.id === searchKey);

    if (targetId === 'player') {
      let hasRemovedOne = false;
      const conds = (updatedPlayer.appearance?.activeConditions || []).filter(c => {
        if (isExactInstanceId) {
          if (c.sourceItemInstanceId === searchKey || c.id === searchKey) {
            removed = true;
            return false;
          }
          return true;
        }

        // Legacy name match (remove only first)
        if (!hasRemovedOne && (c.name.toLowerCase() === cleanSearchLower || c.id === searchKey)) {
          hasRemovedOne = true;
          removed = true;
          return false;
        }
        return true;
      });
      updatedPlayer = {
        ...updatedPlayer,
        appearance: {
          ...(updatedPlayer.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
          activeConditions: conds
        }
      };
    } else {
      const npcIdx = updatedNpcs.findIndex(n => n.id === targetId);
      if (npcIdx >= 0) {
        const npc = updatedNpcs[npcIdx];
        let hasRemovedOne = false;
        const conds = (npc.appearance?.activeConditions || []).filter(c => {
          if (isExactInstanceId) {
            if (c.sourceItemInstanceId === searchKey || c.id === searchKey) {
              removed = true;
              return false;
            }
            return true;
          }

          // Legacy name match (remove only first)
          if (!hasRemovedOne && (c.name.toLowerCase() === cleanSearchLower || c.id === searchKey)) {
            hasRemovedOne = true;
            removed = true;
            return false;
          }
          return true;
        });
        updatedNpcs[npcIdx] = {
          ...npc,
          appearance: {
            ...(npc.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
            activeConditions: conds
          }
        };
      }
    }

    return {
      updatedAdventure: {
        ...adventure,
        player: updatedPlayer,
        npcs: updatedNpcs
      },
      removed
    };
  }

  /**
   * Transfer an item from one character/owner to another.
   * Priority 1: Exact itemInstanceId. Aborts safely if item doesn't exist or doesn't belong to fromOwner.
   * Priority 2: Legacy fallback by name.
   */
  public static transferItem(
    adventure: Adventure,
    fromTargetIdentifier: string,
    toTargetIdentifier: string,
    itemInstanceIdOrName: string,
    options?: {
      itemInstanceId?: string;
    }
  ): Adventure {
    const fromId = this.resolveTargetId(adventure, fromTargetIdentifier);
    const toId = this.resolveTargetId(adventure, toTargetIdentifier);
    const targetInstId = (options?.itemInstanceId || itemInstanceIdOrName).trim();
    const cleanSearchLower = targetInstId.toLowerCase();

    const itemInstances = [...(adventure.itemInstances || [])];
    const isExactInstanceId = Boolean(options?.itemInstanceId) ||
      itemInstances.some(i => i.id === targetInstId) ||
      (adventure.equipmentState || []).some(e => e.itemInstanceId === targetInstId) ||
      targetInstId.startsWith('item-inst-');

    if (isExactInstanceId) {
      // 1. Must find the exact ItemInstance owned by fromId
      const targetInst = itemInstances.find(i => i.id === targetInstId && i.owner === fromId);
      if (!targetInst) {
        // SAFE ABORT: Do NOT transfer, do NOT search by name, do NOT pick any other instance!
        return adventure;
      }

      // 2. Detach restraint & unequip from fromId for this exact instance
      let detachedAdv = this.detachRestraint(adventure, fromId, targetInstId, { itemInstanceId: targetInstId }).updatedAdventure;
      let unequippedAdv = this.unequipItem(detachedAdv, fromId, targetInstId, { itemInstanceId: targetInstId }).updatedAdventure;

      // 3. Update ONLY this concrete ItemInstance
      const updatedInstances = (unequippedAdv.itemInstances || []).map(inst => {
        if (inst.id === targetInstId) {
          return {
            ...inst,
            owner: toId,
            location: `Im Besitz von ${toId === 'player' ? (adventure.player?.name || 'Spieler') : toId}`,
            currentState: 'im Inventar'
          };
        }
        return inst;
      });

      return {
        ...unequippedAdv,
        itemInstances: updatedInstances
      };
    }

    // Legacy fallback: Search for ONE instance owned by fromId with matching name
    const legacyInst = itemInstances.find(i => i.owner === fromId && i.name?.toLowerCase() === cleanSearchLower);
    if (legacyInst) {
      return this.transferItem(adventure, fromId, toId, legacyInst.id, { itemInstanceId: legacyInst.id });
    }

    // Fallback for legacy string inventory
    if (fromId === 'player') {
      const playerInv = [...(adventure.inventory || [])];
      const invIdx = playerInv.findIndex(i => (typeof i === 'string' ? i : (i as any)?.name)?.toLowerCase() === cleanSearchLower);
      if (invIdx >= 0) {
        const itemObj = playerInv.splice(invIdx, 1)[0];
        let updated = { ...adventure, inventory: playerInv };
        if (toId === 'player') {
          updated.inventory = [...(updated.inventory || []), itemObj];
        }
        return updated;
      }
    }

    return adventure;
  }

  /**
   * Destroy an item instance completely.
   * Priority: Exact itemInstanceId to only destroy that specific instance.
   * Preserves all other identical instances and preserves Story-Info completely.
   */
  public static destroyItem(
    adventure: Adventure,
    targetIdentifier: string,
    itemInstanceIdOrName: string,
    options?: {
      itemInstanceId?: string;
    }
  ): Adventure {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const targetInstId = (options?.itemInstanceId || itemInstanceIdOrName).trim();
    const cleanSearchLower = targetInstId.toLowerCase();

    const itemInstances = [...(adventure.itemInstances || [])];
    const isExactInstanceId = Boolean(options?.itemInstanceId) ||
      itemInstances.some(i => i.id === targetInstId) ||
      (adventure.equipmentState || []).some(e => e.itemInstanceId === targetInstId) ||
      targetInstId.startsWith('item-inst-');

    if (isExactInstanceId) {
      // 1. Must find the exact ItemInstance owned by targetId
      const targetInst = itemInstances.find(i => i.id === targetInstId && i.owner === targetId);
      if (!targetInst) {
        // SAFE ABORT: wrong owner or non-existent instance
        return adventure;
      }

      // 2. Detach & unequip exact instance
      let detachedAdv = this.detachRestraint(adventure, targetId, targetInstId, { itemInstanceId: targetInstId }).updatedAdventure;
      let unequippedAdv = this.unequipItem(detachedAdv, targetId, targetInstId, { itemInstanceId: targetInstId }).updatedAdventure;

      // 3. Remove ONLY that single ItemInstance (NO other instance with same name!)
      const updatedItemInstances = (unequippedAdv.itemInstances || []).filter(inst => inst.id !== targetInstId);

      // 4. In legacy inventory array: remove at most ONE matching entry if player
      let updatedInventory = [...(unequippedAdv.inventory || [])];
      if (targetId === 'player') {
        const itemIdx = updatedInventory.findIndex(i => (typeof i === 'string' ? i : (i as any)?.name)?.toLowerCase() === targetInst.name.toLowerCase());
        if (itemIdx >= 0) {
          updatedInventory.splice(itemIdx, 1);
        }
      }

      // CRITICAL: storyEntities in storyState remain PRESERVED (Story-Info != physical item instance)
      return {
        ...unequippedAdv,
        itemInstances: updatedItemInstances,
        inventory: updatedInventory
      };
    }

    // Legacy fallback: Search for ONE instance owned by targetId with matching name
    const legacyInst = itemInstances.find(i => i.owner === targetId && i.name?.toLowerCase() === cleanSearchLower);
    if (legacyInst) {
      return this.destroyItem(adventure, targetId, legacyInst.id, { itemInstanceId: legacyInst.id });
    }

    // Fallback for legacy string inventory only
    let updatedInventory = [...(adventure.inventory || [])];
    const invIdx = updatedInventory.findIndex(i => (typeof i === 'string' ? i : (i as any)?.name)?.toLowerCase() === cleanSearchLower);
    if (invIdx >= 0) {
      updatedInventory.splice(invIdx, 1);
    }
    let detachedAdv = this.detachRestraint(adventure, targetId, cleanSearchLower).updatedAdventure;
    let unequippedAdv = this.unequipItem(detachedAdv, targetId, cleanSearchLower).updatedAdventure;

    return {
      ...unequippedAdv,
      inventory: updatedInventory
    };
  }

  /**
   * Synchronize `structuredInventory` from canonical `equipmentState` for player.
   * StructuredInventory is purely a derived presentation layer.
   * Fully reconstructs armor, accessories, and weapons to prevent any obsolete items.
   */
  public static syncStructuredInventory(adventure: Adventure): Adventure {
    const playerEquipment = (adventure.equipmentState || []).filter(e => e.ownerId === 'player' && e.equipped);
    let structuredInv: StructuredInventory = adventure.structuredInventory
      ? JSON.parse(JSON.stringify(adventure.structuredInventory))
      : { armor: {}, accessories: {}, weapons: [], generalItems: [], money: 0, currencyLabel: 'Goldstücke' };

    const armorSlots = ['head', 'chest', 'hands', 'legs', 'feet'];
    const accSlots = ['finger', 'wrist', 'waist', 'back', 'neck'];

    const newArmor: Record<string, string> = {};
    armorSlots.forEach(slot => {
      const equip = playerEquipment.find(e => !e.isRestraint && e.slot === slot);
      newArmor[slot] = equip ? equip.itemName : '';
    });

    const newAccessories: Record<string, string> = {};
    accSlots.forEach(slot => {
      const equip = playerEquipment.find(e => !e.isRestraint && e.slot === slot);
      newAccessories[slot] = equip ? equip.itemName : '';
    });

    const equippedWeapons: string[] = [];
    playerEquipment.forEach(e => {
      if (!e.isRestraint && (e.slot === 'weapon' || e.slot === 'weapons' || e.slot === 'waffe' || e.bodyAreas?.includes('hands'))) {
        if (!equippedWeapons.includes(e.itemName)) {
          equippedWeapons.push(e.itemName);
        }
      }
    });

    structuredInv.armor = newArmor;
    structuredInv.accessories = newAccessories;
    structuredInv.weapons = equippedWeapons;

    return {
      ...adventure,
      structuredInventory: structuredInv
    };
  }

  /**
   * Process and apply batch AI Inventory & BodyCondition changes.
   * Ensures that unmentioned conditions and equipment remain strictly active.
   */
  public static processAiStateChanges(
    adventure: Adventure,
    inventoryChanges?: AIInventoryChange[],
    bodyConditionChanges?: AIBodyConditionChange[],
    notifications: any[] = []
  ): Adventure {
    let currentAdventure = adventure;

    // 1. Process Inventory Changes
    if (Array.isArray(inventoryChanges)) {
      inventoryChanges.forEach(inv => {
        if (!inv || !inv.item) return;
        const cleanItem = inv.item.trim();
        if (!cleanItem) return;
        const targetId = this.resolveTargetId(currentAdventure, inv.ownerId || inv.ownerName || 'player');

        if (inv.action === 'attach' || (inv.isRestraint && inv.action !== 'removed' && inv.action !== 'detach' && inv.action !== 'unequip' && inv.action !== 'transfer')) {
          const res = this.attachRestraint(currentAdventure, targetId, cleanItem, inv.bodyAreas, {
            description: inv.description,
            condition: inv.condition,
            itemInstanceId: inv.itemInstanceId,
            itemDefinitionId: inv.itemDefinitionId,
            severity: 'mittel'
          });
          currentAdventure = res.updatedAdventure;
          notifications.push({
            id: Math.random().toString(),
            type: 'add',
            title: `${cleanItem} (Fesselung angelegt)`,
            category: 'Zustand'
          });
        } else if (inv.action === 'detach') {
          const res = this.detachRestraint(currentAdventure, targetId, cleanItem, { itemInstanceId: inv.itemInstanceId });
          currentAdventure = res.updatedAdventure;
          if (res.removed) {
            notifications.push({
              id: Math.random().toString(),
              type: 'unlock',
              title: `${cleanItem} (Fesselung gelöst)`,
              category: 'Zustand'
            });
          }
        } else if (inv.action === 'equip') {
          const res = this.equipItem(currentAdventure, targetId, cleanItem, inv.slot, inv.bodyAreas, {
            condition: inv.condition,
            description: inv.description,
            itemInstanceId: inv.itemInstanceId,
            itemDefinitionId: inv.itemDefinitionId
          });
          currentAdventure = res.updatedAdventure;
        } else if (inv.action === 'unequip') {
          const res = this.unequipItem(currentAdventure, targetId, cleanItem, { itemInstanceId: inv.itemInstanceId });
          currentAdventure = res.updatedAdventure;
        } else if (inv.action === 'transfer') {
          const fromId = this.resolveTargetId(currentAdventure, inv.ownerId || inv.ownerName || 'player');
          const toId = this.resolveTargetId(currentAdventure, (inv as any).toOwnerId || (inv as any).toOwnerName || (inv as any).targetCharacterId || 'player');
          currentAdventure = this.transferItem(currentAdventure, fromId, toId, inv.itemInstanceId || cleanItem, { itemInstanceId: inv.itemInstanceId });
        } else if (inv.action === 'removed') {
          currentAdventure = this.destroyItem(currentAdventure, targetId, inv.itemInstanceId || cleanItem, { itemInstanceId: inv.itemInstanceId });
        } else if (inv.action === 'added') {
          const singleWeight = InventoryLootService.inferWeightFromText(cleanItem, inv.description);
          const instId = inv.itemInstanceId || `item-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const defId = inv.itemDefinitionId || `item-def-${cleanItem.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

          const tempInst: ItemInstance = {
            id: instId,
            itemDefinitionId: defId,
            name: cleanItem,
            condition: inv.condition || 'gut',
            quantity: 1,
            weightKg: singleWeight,
            category: 'Gegenstände',
            owner: targetId
          };

          if (targetId === 'player') {
            const mode = currentAdventure.inventorySettings?.pickupConfirmationMode || 'always_confirm';
            const capacity = InventoryLootService.getCarryCapacity(currentAdventure, 'player');
            const autoAllowed = InventoryLootService.isAutoPickupAllowed(tempInst, mode, capacity.remainingCapacityKg);

            if (autoAllowed) {
              const pickupRes = InventoryLootService.pickupItems(currentAdventure, 'player', [{ item: tempInst }]);
              currentAdventure = pickupRes.updatedAdventure;
              notifications.push(...pickupRes.notifications.map(n => ({
                id: Math.random().toString(),
                type: 'add',
                title: `[Gegenstand erhalten] +1 ${cleanItem}`,
                category: 'Gegenstände'
              })));
            } else {
              // Not auto-picked up -> Create PendingPickupProposal so player can decide
              const proposal: PendingPickupProposal = {
                id: `pickup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                sourceTitle: cleanItem,
                sourceType: 'world_item',
                items: [tempInst],
                timestamp: new Date().toISOString()
              };
              currentAdventure = {
                ...currentAdventure,
                pendingPickup: proposal
              };
              notifications.push({
                id: Math.random().toString(),
                type: 'add',
                title: `[Gegenstand entdeckt] ${cleanItem} (${singleWeight.toFixed(1)} kg) - Aufnahme bestätigen?`,
                category: 'Gegenstände'
              });
            }
          } else {
            // NPC inventory
            const itemInstances = [...(currentAdventure.itemInstances || []), tempInst];
            currentAdventure = {
              ...currentAdventure,
              itemInstances
            };
          }
        }
      });
    }

    // 2. Process Body Condition Changes
    if (Array.isArray(bodyConditionChanges)) {
      bodyConditionChanges.forEach(bc => {
        if (!bc || !bc.name) return;
        const cleanName = bc.name.trim();
        if (!cleanName) return;
        const targetId = this.resolveTargetId(currentAdventure, bc.characterId || bc.characterName || 'player');

        if (bc.action === 'added' || bc.action === 'updated') {
          if (bc.type === 'restraint' || bc.isRestraint) {
            const res = this.attachRestraint(currentAdventure, targetId, cleanName, bc.bodyAreas, {
              description: bc.description,
              severity: bc.severity,
              duration: bc.duration,
              itemInstanceId: bc.sourceItemInstanceId
            });
            currentAdventure = res.updatedAdventure;
          } else {
            const res = this.addCondition(currentAdventure, targetId, {
              name: cleanName,
              type: bc.type || 'physical_condition',
              bodyAreas: bc.bodyAreas,
              sourceItemInstanceId: bc.sourceItemInstanceId,
              isRestraint: bc.isRestraint,
              description: bc.description,
              duration: bc.duration,
              severity: bc.severity,
              isActive: bc.isActive ?? true
            });
            currentAdventure = res.updatedAdventure;
          }

          notifications.push({
            id: Math.random().toString(),
            type: 'add',
            title: `${cleanName} (Körperlicher Zustand)`,
            category: 'Zustand'
          });
        } else if (bc.action === 'removed') {
          if (bc.type === 'restraint' || bc.isRestraint) {
            const res = this.detachRestraint(currentAdventure, targetId, cleanName, { itemInstanceId: bc.sourceItemInstanceId });
            currentAdventure = res.updatedAdventure;
          } else {
            const res = this.removeCondition(currentAdventure, targetId, bc.sourceItemInstanceId || cleanName, { sourceItemInstanceId: bc.sourceItemInstanceId });
            currentAdventure = res.updatedAdventure;
          }
        }
      });
    }

    return currentAdventure;
  }
}
