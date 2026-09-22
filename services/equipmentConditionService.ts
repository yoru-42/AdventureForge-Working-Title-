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
   * - Creates/updates EquipmentState
   * - Creates/updates persistent BodyCondition in appearance.activeConditions
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

    const instanceId = options?.itemInstanceId || `item-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const defId = `item-def-${cleanItemName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

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

    // 2. Ensure ItemInstance
    let itemInstances = [...(adventure.itemInstances || [])];
    let existingInstanceIdx = itemInstances.findIndex(inst => inst.id === instanceId || (inst.name?.toLowerCase() === cleanItemName.toLowerCase() && inst.owner === targetId));
    let itemInstance: ItemInstance;

    if (existingInstanceIdx >= 0) {
      itemInstance = {
        ...itemInstances[existingInstanceIdx],
        condition: options?.condition || itemInstances[existingInstanceIdx].condition || 'stabil angelegt',
        owner: targetId,
        location: `Angelegt an ${targetId === 'player' ? (adventure.player?.name || 'Spieler') : targetId}`,
        currentState: 'angelegt / aktiv'
      };
      itemInstances[existingInstanceIdx] = itemInstance;
    } else {
      itemInstance = {
        id: instanceId,
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
    const equipIdx = adventureEquipment.findIndex(e => e.itemInstanceId === itemInstance.id || (e.itemName.toLowerCase() === cleanItemName.toLowerCase() && e.ownerId === targetId));
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

    // 4. Ensure persistent BodyCondition
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

    // Apply to target character's appearance.activeConditions
    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      const currentConds = [...(updatedPlayer.appearance?.activeConditions || [])];
      const condIdx = currentConds.findIndex(c => c.id === condition.id || (c.sourceItemInstanceId && c.sourceItemInstanceId === itemInstance.id) || (c.name.toLowerCase() === cleanItemName.toLowerCase() && c.isRestraint));
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
        const condIdx = currentConds.findIndex(c => c.id === condition.id || (c.sourceItemInstanceId && c.sourceItemInstanceId === itemInstance.id) || (c.name.toLowerCase() === cleanItemName.toLowerCase() && c.isRestraint));
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
   */
  public static detachRestraint(
    adventure: Adventure,
    targetIdentifier: string,
    itemOrConditionName: string
  ): {
    updatedAdventure: Adventure;
    removed: boolean;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const cleanSearch = itemOrConditionName.trim().toLowerCase();

    let removed = false;
    let adventureEquipment = [...(adventure.equipmentState || [])];
    let itemInstances = [...(adventure.itemInstances || [])];

    // Find matching equipment
    const matchingEquip = adventureEquipment.filter(e =>
      e.ownerId === targetId &&
      (e.itemName.toLowerCase() === cleanSearch ||
       e.itemName.toLowerCase().includes(cleanSearch) ||
       cleanSearch.includes(e.itemName.toLowerCase()) ||
       e.itemInstanceId === itemOrConditionName)
    );

    const removedInstanceIds = new Set<string>();
    matchingEquip.forEach(e => {
      removedInstanceIds.add(e.itemInstanceId);
      removed = true;
    });

    adventureEquipment = adventureEquipment.filter(e => !matchingEquip.includes(e));

    // Update item instance states
    itemInstances = itemInstances.map(inst => {
      if (removedInstanceIds.has(inst.id) || (inst.owner === targetId && inst.name && inst.name.toLowerCase().includes(cleanSearch))) {
        return {
          ...inst,
          currentState: 'abgelegt / gelöst',
          location: 'Am Boden / Inventar'
        };
      }
      return inst;
    });

    // Remove from target character's activeConditions
    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      const currentConds = (updatedPlayer.appearance?.activeConditions || []).filter(c => {
        if (c.sourceItemInstanceId && removedInstanceIds.has(c.sourceItemInstanceId)) {
          removed = true;
          return false;
        }
        if (c.name.toLowerCase() === cleanSearch || c.name.toLowerCase().includes(cleanSearch) || cleanSearch.includes(c.name.toLowerCase())) {
          removed = true;
          return false;
        }
        return true;
      });
      updatedPlayer = {
        ...updatedPlayer,
        appearance: {
          ...(updatedPlayer.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
          activeConditions: currentConds
        },
        equipment: (updatedPlayer.equipment || []).filter(e => !removedInstanceIds.has(e.itemInstanceId) && e.itemName.toLowerCase() !== cleanSearch)
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
          if (c.name.toLowerCase() === cleanSearch || c.name.toLowerCase().includes(cleanSearch) || cleanSearch.includes(c.name.toLowerCase())) {
            removed = true;
            return false;
          }
          return true;
        });
        updatedNpcs[npcIdx] = {
          ...npc,
          appearance: {
            ...(npc.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
            activeConditions: currentConds
          },
          equipment: (npc.equipment || []).filter(e => !removedInstanceIds.has(e.itemInstanceId) && e.itemName.toLowerCase() !== cleanSearch)
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

    const instanceId = `item-inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const defId = `item-def-${cleanItemName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Item Definition
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

    // Item Instance
    let itemInstances = [...(adventure.itemInstances || [])];
    let existingInst = itemInstances.find(i => i.name?.toLowerCase() === cleanItemName.toLowerCase() && i.owner === targetId);
    if (!existingInst) {
      existingInst = {
        id: instanceId,
        itemDefinitionId: existingDef.id,
        name: cleanItemName,
        condition: options?.condition || 'gut',
        owner: targetId,
        location: 'Ausgerüstet',
        quantity: 1,
        currentState: 'ausgerüstet'
      };
      itemInstances.push(existingInst);
    } else {
      existingInst = {
        ...existingInst,
        condition: options?.condition || existingInst.condition || 'gut',
        location: 'Ausgerüstet',
        currentState: 'ausgerüstet'
      };
    }

    // Equipment State
    let adventureEquipment = [...(adventure.equipmentState || [])];
    // Unequip previous item in the same slot if exclusive
    if (slot && slot !== 'weapon' && slot !== 'accessory') {
      adventureEquipment = adventureEquipment.filter(e => !(e.ownerId === targetId && e.slot === slot));
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

    adventureEquipment.push(equipment);

    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      updatedPlayer = {
        ...updatedPlayer,
        equipment: (updatedPlayer.equipment || []).filter(e => e.itemInstanceId !== equipment.itemInstanceId && (slot ? e.slot !== slot : true)).concat(equipment)
      };
    } else {
      const npcIdx = updatedNpcs.findIndex(n => n.id === targetId);
      if (npcIdx >= 0) {
        const npc = updatedNpcs[npcIdx];
        updatedNpcs[npcIdx] = {
          ...npc,
          equipment: (npc.equipment || []).filter(e => e.itemInstanceId !== equipment.itemInstanceId && (slot ? e.slot !== slot : true)).concat(equipment)
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
   */
  public static unequipItem(
    adventure: Adventure,
    targetIdentifier: string,
    itemNameOrSlot: string
  ): {
    updatedAdventure: Adventure;
    unequipped: boolean;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const cleanSearch = itemNameOrSlot.trim().toLowerCase();

    let adventureEquipment = [...(adventure.equipmentState || [])];
    const initialCount = adventureEquipment.length;

    adventureEquipment = adventureEquipment.filter(e => {
      if (e.ownerId !== targetId) return true;
      if (e.itemName.toLowerCase() === cleanSearch || e.itemName.toLowerCase().includes(cleanSearch)) return false;
      if (e.slot && e.slot.toLowerCase() === cleanSearch) return false;
      return true;
    });

    const unequipped = adventureEquipment.length < initialCount;

    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      updatedPlayer = {
        ...updatedPlayer,
        equipment: (updatedPlayer.equipment || []).filter(e => {
          if (e.itemName.toLowerCase() === cleanSearch || e.itemName.toLowerCase().includes(cleanSearch)) return false;
          if (e.slot && e.slot.toLowerCase() === cleanSearch) return false;
          return true;
        })
      };
    } else {
      const npcIdx = updatedNpcs.findIndex(n => n.id === targetId);
      if (npcIdx >= 0) {
        const npc = updatedNpcs[npcIdx];
        updatedNpcs[npcIdx] = {
          ...npc,
          equipment: (npc.equipment || []).filter(e => {
            if (e.itemName.toLowerCase() === cleanSearch || e.itemName.toLowerCase().includes(cleanSearch)) return false;
            if (e.slot && e.slot.toLowerCase() === cleanSearch) return false;
            return true;
          })
        };
      }
    }

    let updatedAdventure: Adventure = {
      ...adventure,
      player: updatedPlayer,
      npcs: updatedNpcs,
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
      const existingIdx = conds.findIndex(c => c.id === condition.id || c.name.toLowerCase() === condition.name.toLowerCase());
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
        const existingIdx = conds.findIndex(c => c.id === condition.id || c.name.toLowerCase() === condition.name.toLowerCase());
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
   * Remove a BodyCondition from Player or NPC by name or ID.
   */
  public static removeCondition(
    adventure: Adventure,
    targetIdentifier: string,
    conditionNameOrId: string
  ): {
    updatedAdventure: Adventure;
    removed: boolean;
  } {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const cleanSearch = conditionNameOrId.trim().toLowerCase();
    let removed = false;

    let updatedPlayer = { ...adventure.player };
    let updatedNpcs = [...(adventure.npcs || [])];

    if (targetId === 'player') {
      const conds = (updatedPlayer.appearance?.activeConditions || []).filter(c => {
        if (c.id.toLowerCase() === cleanSearch || c.name.toLowerCase() === cleanSearch) {
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
          if (c.id.toLowerCase() === cleanSearch || c.name.toLowerCase() === cleanSearch) {
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
   * Cleans up attachments/conditions on the source owner.
   */
  public static transferItem(
    adventure: Adventure,
    fromTargetIdentifier: string,
    toTargetIdentifier: string,
    itemNameOrId: string
  ): Adventure {
    const fromId = this.resolveTargetId(adventure, fromTargetIdentifier);
    const toId = this.resolveTargetId(adventure, toTargetIdentifier);
    const cleanSearch = itemNameOrId.trim().toLowerCase();

    // 1. Detach/Unequip from source owner
    let detached = this.detachRestraint(adventure, fromId, cleanSearch);
    let updated = this.unequipItem(detached.updatedAdventure, fromId, cleanSearch).updatedAdventure;

    // 2. Transfer ItemInstance ownership
    let itemInstances = (updated.itemInstances || []).map(inst => {
      if (inst.owner === fromId && (inst.id === itemNameOrId || inst.name?.toLowerCase() === cleanSearch)) {
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
   */
  public static destroyItem(
    adventure: Adventure,
    targetIdentifier: string,
    itemNameOrId: string
  ): Adventure {
    const targetId = this.resolveTargetId(adventure, targetIdentifier);
    const cleanSearch = itemNameOrId.trim().toLowerCase();

    let detached = this.detachRestraint(adventure, targetId, cleanSearch);
    let updated = this.unequipItem(detached.updatedAdventure, targetId, cleanSearch).updatedAdventure;

    let itemInstances = (updated.itemInstances || []).filter(inst => {
      if (inst.owner === targetId && (inst.id === itemNameOrId || inst.name?.toLowerCase() === cleanSearch)) {
        return false;
      }
      return true;
    });

    let inventory = (updated.inventory || []).filter(i => {
      const name = typeof i === 'string' ? i : (i as any)?.name;
      return name?.toLowerCase() !== cleanSearch;
    });

    return {
      ...updated,
      itemInstances,
      inventory
    };
  }

  /**
   * Synchronize `structuredInventory` from canonical `equipmentState` for player.
   */
  public static syncStructuredInventory(adventure: Adventure): Adventure {
    const playerEquipment = (adventure.equipmentState || []).filter(e => e.ownerId === 'player' && e.equipped);
    let structuredInv: StructuredInventory = adventure.structuredInventory
      ? JSON.parse(JSON.stringify(adventure.structuredInventory))
      : { armor: {}, accessories: {}, weapons: [], generalItems: [], money: 0, currencyLabel: 'Goldstücke' };

    if (!structuredInv.armor) structuredInv.armor = {};
    if (!structuredInv.accessories) structuredInv.accessories = {};
    if (!Array.isArray(structuredInv.weapons)) structuredInv.weapons = [];
    if (!Array.isArray(structuredInv.generalItems)) structuredInv.generalItems = [];

    const armorSlots = ['head', 'chest', 'hands', 'legs', 'feet'];
    const accSlots = ['finger', 'wrist', 'waist', 'back', 'neck'];

    // Update armor slots
    armorSlots.forEach(slot => {
      const equip = playerEquipment.find(e => !e.isRestraint && e.slot === slot);
      (structuredInv.armor as any)[slot] = equip ? equip.itemName : '';
    });

    // Update accessory slots
    accSlots.forEach(slot => {
      const equip = playerEquipment.find(e => !e.isRestraint && e.slot === slot);
      (structuredInv.accessories as any)[slot] = equip ? equip.itemName : '';
    });

    // Weapons
    playerEquipment.forEach(e => {
      if (!e.isRestraint && (e.slot === 'weapon' || e.slot === 'weapons' || e.bodyAreas?.includes('hands'))) {
        if (!structuredInv.weapons.includes(e.itemName)) {
          structuredInv.weapons.push(e.itemName);
        }
      }
    });

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
          const res = this.detachRestraint(currentAdventure, targetId, cleanItem);
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
            description: inv.description
          });
          currentAdventure = res.updatedAdventure;
        } else if (inv.action === 'unequip') {
          const res = this.unequipItem(currentAdventure, targetId, cleanItem);
          currentAdventure = res.updatedAdventure;
        } else if (inv.action === 'removed') {
          currentAdventure = this.destroyItem(currentAdventure, targetId, cleanItem);
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
              duration: bc.duration
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
            const res = this.detachRestraint(currentAdventure, targetId, cleanName);
            currentAdventure = res.updatedAdventure;
          } else {
            const res = this.removeCondition(currentAdventure, targetId, cleanName);
            currentAdventure = res.updatedAdventure;
          }
        }
      });
    }

    return currentAdventure;
  }
}
