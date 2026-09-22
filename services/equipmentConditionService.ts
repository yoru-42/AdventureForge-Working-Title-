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
  AIBodyConditionChange
} from '../types';

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
      itemInstances.some(i => i.id === searchKey);

    const removedInstanceIds = new Set<string>();

    if (isExactInstanceId) {
      const targetInstId = options?.itemInstanceId || searchKey;
      const equipIndex = adventureEquipment.findIndex(e => e.ownerId === targetId && e.itemInstanceId === targetInstId);
      if (equipIndex >= 0) {
        adventureEquipment.splice(equipIndex, 1);
        removedInstanceIds.add(targetInstId);
        removed = true;
      } else {
        // Even if not in equipmentState, mark instance ID for condition cleanup
        removedInstanceIds.add(targetInstId);
      }
    } else {
      // Fallback: match by name or condition ID
      const matchingEquip = adventureEquipment.find(e =>
        e.ownerId === targetId &&
        (e.itemInstanceId === searchKey ||
         e.itemName.toLowerCase() === cleanSearchLower ||
         e.itemName.toLowerCase().includes(cleanSearchLower) ||
         cleanSearchLower.includes(e.itemName.toLowerCase()))
      );

      if (matchingEquip) {
        adventureEquipment = adventureEquipment.filter(e => e !== matchingEquip);
        removedInstanceIds.add(matchingEquip.itemInstanceId);
        removed = true;
      }
    }

    // Update matching item instance states
    itemInstances = itemInstances.map(inst => {
      if (removedInstanceIds.has(inst.id) || (!isExactInstanceId && inst.owner === targetId && inst.name?.toLowerCase() === cleanSearchLower && inst.currentState === 'angelegt / aktiv')) {
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
      const currentConds = (updatedPlayer.appearance?.activeConditions || []).filter(c => {
        if (c.sourceItemInstanceId && removedInstanceIds.has(c.sourceItemInstanceId)) {
          removed = true;
          return false;
        }
        if (c.id === searchKey) {
          removed = true;
          return false;
        }
        if (!isExactInstanceId && removedInstanceIds.size === 0) {
          if (c.name.toLowerCase() === cleanSearchLower || c.name.toLowerCase().includes(cleanSearchLower) || cleanSearchLower.includes(c.name.toLowerCase())) {
            // Only remove if it doesn't belong to another active restraint instance
            if (!c.sourceItemInstanceId || !adventureEquipment.some(e => e.itemInstanceId === c.sourceItemInstanceId)) {
              removed = true;
              return false;
            }
          }
        }
        return true;
      });
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
        const currentConds = (npc.appearance?.activeConditions || []).filter(c => {
          if (c.sourceItemInstanceId && removedInstanceIds.has(c.sourceItemInstanceId)) {
            removed = true;
            return false;
          }
          if (c.id === searchKey) {
            removed = true;
            return false;
          }
          if (!isExactInstanceId && removedInstanceIds.size === 0) {
            if (c.name.toLowerCase() === cleanSearchLower || c.name.toLowerCase().includes(cleanSearchLower) || cleanSearchLower.includes(c.name.toLowerCase())) {
              if (!c.sourceItemInstanceId || !adventureEquipment.some(e => e.itemInstanceId === c.sourceItemInstanceId)) {
                removed = true;
                return false;
              }
            }
          }
          return true;
        });
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
   * 1. Exact itemInstanceId match
   * 2. Slot match
   * 3. Name fallback
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
      itemInstances.some(i => i.id === searchKey);

    const unequippedInstanceIds = new Set<string>();

    if (isExactInstanceId) {
      const targetInstId = options?.itemInstanceId || searchKey;
      const equipIdx = adventureEquipment.findIndex(e => e.ownerId === targetId && e.itemInstanceId === targetInstId);
      if (equipIdx >= 0) {
        adventureEquipment.splice(equipIdx, 1);
        unequippedInstanceIds.add(targetInstId);
      } else {
        unequippedInstanceIds.add(targetInstId);
      }
    } else {
      // Check for slot match
      const matchingSlotEquip = adventureEquipment.filter(e => e.ownerId === targetId && e.slot && e.slot.toLowerCase() === cleanSearchLower && !e.isRestraint);
      if (matchingSlotEquip.length > 0) {
        matchingSlotEquip.forEach(e => {
          unequippedInstanceIds.add(e.itemInstanceId);
        });
        adventureEquipment = adventureEquipment.filter(e => !matchingSlotEquip.includes(e));
      } else {
        // Match by item name
        const matchingNameEquip = adventureEquipment.filter(e =>
          e.ownerId === targetId &&
          (e.itemName.toLowerCase() === cleanSearchLower || e.itemName.toLowerCase().includes(cleanSearchLower))
        );
        matchingNameEquip.forEach(e => {
          unequippedInstanceIds.add(e.itemInstanceId);
        });
        adventureEquipment = adventureEquipment.filter(e => !matchingNameEquip.includes(e));
      }
    }

    const unequipped = unequippedInstanceIds.size > 0;

    // Update unequipped item instances
    itemInstances = itemInstances.map(inst => {
      if (unequippedInstanceIds.has(inst.id) || (!isExactInstanceId && inst.owner === targetId && inst.name?.toLowerCase() === cleanSearchLower && inst.currentState === 'ausgerüstet')) {
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
        equipment: (updatedPlayer.equipment || []).filter(e => !unequippedInstanceIds.has(e.itemInstanceId) && (isExactInstanceId ? true : e.itemName.toLowerCase() !== cleanSearchLower && (e.slot ? e.slot.toLowerCase() !== cleanSearchLower : true)))
      };
    } else {
      const npcIdx = updatedNpcs.findIndex(n => n.id === targetId);
      if (npcIdx >= 0) {
        const npc = updatedNpcs[npcIdx];
        updatedNpcs[npcIdx] = {
          ...npc,
          equipment: (npc.equipment || []).filter(e => !unequippedInstanceIds.has(e.itemInstanceId) && (isExactInstanceId ? true : e.itemName.toLowerCase() !== cleanSearchLower && (e.slot ? e.slot.toLowerCase() !== cleanSearchLower : true)))
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
    conditionIdentifier: string
  ): {
    updatedAdventure: Adventure;
    removed: boolean;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const cleanSearch = conditionIdentifier.trim().toLowerCase();
    let removed = false;

    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      const conds = (updatedPlayer.appearance?.activeConditions || []).filter(c => {
        if (c.id === conditionIdentifier || (c.sourceItemInstanceId && c.sourceItemInstanceId === conditionIdentifier)) {
          removed = true;
          return false;
        }
        if (c.name.toLowerCase() === cleanSearch) {
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
        const conds = (npc.appearance?.activeConditions || []).filter(c => {
          if (c.id === conditionIdentifier || (c.sourceItemInstanceId && c.sourceItemInstanceId === conditionIdentifier)) {
            removed = true;
            return false;
          }
          if (c.name.toLowerCase() === cleanSearch) {
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
   * Preserves exact itemInstanceId and updates ownership cleanly.
   */
  public static transferItem(
    adventure: Adventure,
    fromTargetIdentifier: string,
    toTargetIdentifier: string,
    itemInstanceIdOrName: string
  ): Adventure {
    const fromId = this.resolveTargetId(adventure, fromTargetIdentifier);
    const toId = this.resolveTargetId(adventure, toTargetIdentifier);
    const searchKey = itemInstanceIdOrName.trim();

    // 1. Detach/Unequip specific instance from source owner
    let detached = this.detachRestraint(adventure, fromId, searchKey);
    let updated = this.unequipItem(detached.updatedAdventure, fromId, searchKey).updatedAdventure;

    // 2. Transfer ItemInstance ownership without duplicating
    let itemInstances = (updated.itemInstances || []).map(inst => {
      if (inst.owner === fromId && (inst.id === searchKey || inst.name?.toLowerCase() === searchKey.toLowerCase())) {
        return {
          ...inst,
          owner: toId,
          location: `Im Besitz von ${toId === 'player' ? 'Spieler' : toId}`,
          currentState: 'im Inventar'
        };
      }
      return inst;
    });

    return {
      ...updated,
      itemInstances
    };
  }

  /**
   * Destroy an item instance completely.
   * Priority: exact itemInstanceId to only destroy that specific instance.
   */
  public static destroyItem(
    adventure: Adventure,
    targetIdentifier: string,
    itemInstanceIdOrName: string
  ): Adventure {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const searchKey = itemInstanceIdOrName.trim();
    const cleanSearchLower = searchKey.toLowerCase();

    let detached = this.detachRestraint(adventure, targetId, searchKey);
    let updated = this.unequipItem(detached.updatedAdventure, targetId, searchKey).updatedAdventure;

    let itemInstances = (updated.itemInstances || []).filter(inst => {
      if (inst.owner === targetId && (inst.id === searchKey || inst.name?.toLowerCase() === cleanSearchLower)) {
        return false;
      }
      return true;
    });

    let inventory = (updated.inventory || []).filter(i => {
      const name = typeof i === 'string' ? i : (i as any)?.name;
      return name?.toLowerCase() !== cleanSearchLower;
    });

    return {
      ...updated,
      itemInstances,
      inventory
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

        if (inv.action === 'attach' || (inv.isRestraint && inv.action !== 'removed' && inv.action !== 'detach' && inv.action !== 'unequip')) {
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
        } else if (inv.action === 'removed') {
          currentAdventure = this.destroyItem(currentAdventure, targetId, inv.itemInstanceId || cleanItem);
        } else if (inv.action === 'added') {
          let updatedInv = [...(currentAdventure.inventory || [])];
          const lower = cleanItem.toLowerCase();
          if (!updatedInv.some(i => typeof i === 'string' ? i.toLowerCase() === lower : (i as any)?.name?.toLowerCase() === lower)) {
            updatedInv.push(cleanItem);
          }
          currentAdventure = {
            ...currentAdventure,
            inventory: updatedInv
          };
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
            const res = this.removeCondition(currentAdventure, targetId, bc.sourceItemInstanceId || cleanName);
            currentAdventure = res.updatedAdventure;
          }
        }
      });
    }

    return currentAdventure;
  }
}
