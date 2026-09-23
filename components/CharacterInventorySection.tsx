import React, { useState, useEffect, useMemo } from 'react';
import { StructuredInventory, CustomInventoryItem, LoreEntry, WorldSetting } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { GeminiService } from '../services/geminiService';
import { ITEM_MAIN_CATEGORIES } from '../lib/itemCategoriesData';

interface Props {
  structuredInventory: StructuredInventory;
  onChangeStructuredInventory: (inv: StructuredInventory) => void;
  characterName: string;
  characterOutfit?: string;
  lore: LoreEntry[];
  onUpdateLore?: (lore: LoreEntry[]) => void;
  world?: WorldSetting | any;
  isExtractingInventory?: boolean;
  onExtractInventory?: () => void;
  readOnly?: boolean;
}

const RARITY_OPTIONS = [
  'Gewöhnlich',
  'Ungewöhnlich',
  'Selten',
  'Episch',
  'Legendär',
  'Mythisch',
  'Artefakt',
  'Unikat'
];

const SLOT_OPTIONS: { id: CustomInventoryItem['slot']; label: string }[] = [
  { id: 'weapon', label: 'Waffe (Haupthand)' },
  { id: 'shield', label: 'Schild / Nebenhand' },
  { id: 'head', label: 'Kopf' },
  { id: 'chest', label: 'Brust / Torso' },
  { id: 'hands', label: 'Hände / Handschuhe' },
  { id: 'legs', label: 'Beine / Hosen' },
  { id: 'feet', label: 'Füße / Stiefel' },
  { id: 'finger', label: 'Finger / Ring' },
  { id: 'neck', label: 'Hals / Amulett' },
  { id: 'wrist', label: 'Handgelenke / Armreif' },
  { id: 'waist', label: 'Taille / Gürtel' },
  { id: 'back', label: 'Rücken / Umhang' },
  { id: 'pocket', label: 'Gürteltasche / Schnellzugriff' },
  { id: 'bag', label: 'Rucksack / Tasche' },
  { id: 'inventory', label: 'Allgemeines Inventar' }
];

export const CharacterInventorySection: React.FC<Props> = ({
  structuredInventory,
  onChangeStructuredInventory,
  characterName,
  characterOutfit,
  lore,
  onUpdateLore,
  world,
  isExtractingInventory,
  onExtractInventory,
  readOnly = false
}) => {
  const [editingItem, setEditingItem] = useState<CustomInventoryItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [itemPromptText, setItemPromptText] = useState<string>('');
  const [isGeneratingItem, setIsGeneratingItem] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Codex Gegenstände State
  const [codexFilterMode, setCodexFilterMode] = useState<'char' | 'all'>('char');
  const [codexSearchQuery, setCodexSearchQuery] = useState<string>('');
  const [isCodexPickerOpen, setIsCodexPickerOpen] = useState<boolean>(false);
  const [codexCategoryFilter, setCodexCategoryFilter] = useState<string>('all');

  const customItems: CustomInventoryItem[] = structuredInventory?.customItems || [];

  // Helper to extract clean string value from slots that may contain objects
  const getSlotString = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.name) return String(val.name);
    return '';
  };

  // Sanitize weapons array: ensure items are strings and extract names if objects
  const sanitizedWeapons: string[] = useMemo(() => {
    if (!Array.isArray(structuredInventory?.weapons)) return [];
    return structuredInventory.weapons.map((w: any) => {
      if (typeof w === 'string') return w.trim();
      if (w && typeof w === 'object' && w.name) return String(w.name).trim();
      return '';
    }).filter(Boolean);
  }, [structuredInventory?.weapons]);

  // Automatically migrate any object-based weapons, armor, or accessories into clean strings and custom items
  useEffect(() => {
    if (!structuredInventory) return;
    let needsUpdate = false;
    const currentCustomItems: CustomInventoryItem[] = [...(structuredInventory.customItems || [])];

    const addAsCustomItemIfDetailed = (obj: any, defaultSlot: any, defaultCategory: string) => {
      if (!obj || typeof obj !== 'object' || !obj.name) return;
      const name = String(obj.name).trim();
      if (!name) return;
      if (currentCustomItems.some(ci => (ci.name || '').toLowerCase() === name.toLowerCase())) return;

      currentCustomItems.push({
        id: 'custom_item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name,
        category: obj.category || defaultCategory,
        subCategory: obj.type || obj.subCategory || (defaultSlot === 'weapon' ? 'Nahkampfwaffe' : 'Ausrüstung'),
        slot: (obj.slot as any) || defaultSlot,
        equipped: true,
        rarity: (obj.rarity as any) || 'Selten',
        quality: obj.quality || 'Meisterlich geschmiedet',
        material: obj.material || '',
        durability: obj.durability || '100 / 100',
        weight: obj.weight || '',
        value: typeof obj.value === 'number' ? obj.value : 350,
        description: obj.description || '',
        specialEffects: obj.properties || obj.specialEffects || '',
        enchantments: obj.enchantments || '',
        combatStats: {
          damage: typeof obj.damage === 'object' ? JSON.stringify(obj.damage) : (obj.damage || obj.combatStats?.damage || ''),
          damageType: obj.damageType || obj.combatStats?.damageType || '',
          defense: typeof obj.defense === 'object' ? JSON.stringify(obj.defense) : (obj.defense || obj.combatStats?.defense || ''),
          range: obj.range || obj.combatStats?.range || (defaultSlot === 'weapon' ? 'Nahkampf' : ''),
          scalingStat: obj.scalingStat || obj.combatStats?.scalingStat || ''
        }
      });
    };

    // Check weapons
    const cleanWeapons: string[] = [];
    if (Array.isArray(structuredInventory.weapons)) {
      structuredInventory.weapons.forEach((w: any) => {
        if (typeof w === 'string') {
          cleanWeapons.push(w.trim());
        } else if (w && typeof w === 'object') {
          needsUpdate = true;
          const wName = String(w.name || '').trim();
          if (wName) {
            cleanWeapons.push(wName);
            addAsCustomItemIfDetailed(w, 'weapon', 'Waffen');
          }
        }
      });
    }

    // Check armor slots
    const cleanArmor = { ...(structuredInventory.armor || {}) };
    (['head', 'chest', 'hands', 'legs', 'feet'] as const).forEach(slot => {
      const val = cleanArmor[slot];
      if (val && typeof val === 'object') {
        needsUpdate = true;
        const aName = String((val as any).name || '').trim();
        cleanArmor[slot] = aName;
        if (aName) {
          addAsCustomItemIfDetailed(val, slot, 'Rüstung');
        }
      }
    });

    // Check accessories slots
    const cleanAccessories = { ...(structuredInventory.accessories || {}) };
    (['finger', 'neck', 'wrist', 'waist', 'back'] as const).forEach(slot => {
      const val = cleanAccessories[slot];
      if (val && typeof val === 'object') {
        needsUpdate = true;
        const accName = String((val as any).name || '').trim();
        cleanAccessories[slot] = accName;
        if (accName) {
          addAsCustomItemIfDetailed(val, slot, 'Schmuck & Accessoires');
        }
      }
    });

    if (needsUpdate) {
      onChangeStructuredInventory({
        ...structuredInventory,
        weapons: cleanWeapons,
        armor: cleanArmor,
        accessories: cleanAccessories,
        customItems: currentCustomItems
      });
    }
  }, [structuredInventory]);

  const updateInventoryField = (field: keyof StructuredInventory, value: any) => {
    onChangeStructuredInventory({
      ...structuredInventory,
      [field]: value
    });
  };

  const updateArmorSlot = (slot: 'head' | 'chest' | 'hands' | 'legs' | 'feet', value: string) => {
    onChangeStructuredInventory({
      ...structuredInventory,
      armor: {
        ...(structuredInventory.armor || {}),
        [slot]: value
      }
    });
  };

  const updateAccessorySlot = (slot: 'finger' | 'neck' | 'wrist' | 'waist' | 'back', value: string) => {
    onChangeStructuredInventory({
      ...structuredInventory,
      accessories: {
        ...(structuredInventory.accessories || {}),
        [slot]: value
      }
    });
  };

  // Open editor for new item
  const handleStartCreateItem = () => {
    const newItem: CustomInventoryItem = {
      id: 'custom_item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: '',
      category: 'Waffen',
      subCategory: 'Katana',
      slot: 'weapon',
      equipped: true,
      rarity: 'Selten',
      quality: 'Meisterlich geschmiedet',
      material: 'Gefalteter Tamahagane-Stahl',
      durability: '100 / 100',
      weight: '1.2 kg',
      value: 500,
      currency: structuredInventory.currencyLabel || 'Goldstücke',
      description: '',
      specialEffects: '',
      combatStats: {
        damage: '1d10+3 (Schlitzen)',
        damageType: 'Schlitzen',
        defense: '',
        range: 'Nahkampf (1.1m)',
        scalingStat: 'Geschicklichkeit'
      },
      enchantments: '',
      originHistory: '',
      requirements: ''
    };
    setEditingItem(newItem);
    setIsCreatingNew(true);
    setItemPromptText('');
  };

  // Edit existing item
  const handleEditItem = (item: CustomInventoryItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setIsCreatingNew(false);
    setItemPromptText('');
  };

  // Convert simple weapon string to custom item
  const handleConvertWeaponToCustomItem = (weaponName: string) => {
    const isKatana = weaponName.toLowerCase().includes('katana') || weaponName.toLowerCase().includes('klinge') || weaponName.toLowerCase().includes('schwert');
    const newItem: CustomInventoryItem = {
      id: 'custom_item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: weaponName,
      category: 'Waffen',
      subCategory: isKatana ? 'Katana' : 'Nahkampfwaffe',
      slot: 'weapon',
      equipped: true,
      rarity: 'Selten',
      quality: 'Feingeschmiedet',
      material: 'Gehärteter Stahl',
      durability: '100 / 100',
      weight: '1.2 kg',
      value: 350,
      description: `Eine individuell angepasste Waffe (${weaponName}), geführt von ${characterName || 'dem Charakter'}.`,
      specialEffects: '',
      combatStats: {
        damage: '1d8+2 (Schlitzen)',
        damageType: 'Schlitzen',
        range: 'Nahkampf',
        scalingStat: 'Stärke / Geschick'
      }
    };
    setEditingItem(newItem);
    setIsCreatingNew(true);
    setItemPromptText(weaponName);
  };

  // Save edited custom item
  const handleSaveItem = () => {
    if (!editingItem || !editingItem.name.trim()) return;

    let updatedList: CustomInventoryItem[];
    if (isCreatingNew) {
      updatedList = [...customItems, editingItem];
    } else {
      updatedList = customItems.map(it => (it.id === editingItem.id ? editingItem : it));
    }

    // Synchronize weapon list if it is a weapon
    let updatedWeapons = [...(structuredInventory.weapons || [])];
    if (editingItem.slot === 'weapon' && !updatedWeapons.includes(editingItem.name)) {
      updatedWeapons.push(editingItem.name);
    }

    onChangeStructuredInventory({
      ...structuredInventory,
      customItems: updatedList,
      weapons: updatedWeapons
    });

    setEditingItem(null);
    setIsCreatingNew(false);
  };

  // Delete custom item
  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = customItems.find(it => it.id === itemId);
    const updatedList = customItems.filter(it => it.id !== itemId);
    
    let updatedWeapons = structuredInventory.weapons || [];
    if (itemToDelete && itemToDelete.slot === 'weapon') {
      updatedWeapons = updatedWeapons.filter(w => w !== itemToDelete.name);
    }

    onChangeStructuredInventory({
      ...structuredInventory,
      customItems: updatedList,
      weapons: updatedWeapons
    });
  };

  // Toggle equipped state
  const handleToggleEquipped = (itemId: string) => {
    const updatedList = customItems.map(it => {
      if (it.id === itemId) {
        return { ...it, equipped: !it.equipped };
      }
      return it;
    });
    onChangeStructuredInventory({
      ...structuredInventory,
      customItems: updatedList
    });
  };

  // AI item generator
  const handleGenerateItemWithAI = async () => {
    if (!itemPromptText.trim() && (!editingItem || !editingItem.name.trim())) {
      setItemPromptText('Meisterhaftes Katana mit magischen Runen und Schattenschliff');
    }
    const promptToUse = itemPromptText.trim() || (editingItem ? `${editingItem.name} (${editingItem.subCategory || editingItem.category || 'Gegenstand'})` : 'Besonderes Katana');

    setIsGeneratingItem(true);
    try {
      const generated = await GeminiService.generateCustomItem(promptToUse, world, characterName);
      if (generated) {
        setEditingItem(prev => ({
          ...(prev || {}),
          id: prev?.id || 'custom_item_' + Date.now(),
          name: generated.name || prev?.name || 'Neuer Gegenstand',
          category: generated.category || prev?.category || 'Waffen',
          subCategory: generated.subCategory || prev?.subCategory || 'Katana',
          slot: generated.slot || prev?.slot || 'weapon',
          rarity: generated.rarity || prev?.rarity || 'Selten',
          quality: generated.quality || prev?.quality || 'Meisterlich geschmiedet',
          material: generated.material || prev?.material || 'Gefalteter Stahl',
          weight: generated.weight || prev?.weight || '1.2 kg',
          value: typeof generated.value === 'number' ? generated.value : prev?.value || 500,
          durability: generated.durability || prev?.durability || '100 / 100',
          description: generated.description || prev?.description || '',
          specialEffects: generated.specialEffects || prev?.specialEffects || '',
          combatStats: {
            damage: generated.combatStats?.damage || prev?.combatStats?.damage || '',
            damageType: generated.combatStats?.damageType || prev?.combatStats?.damageType || '',
            defense: generated.combatStats?.defense || prev?.combatStats?.defense || '',
            range: generated.combatStats?.range || prev?.combatStats?.range || '',
            scalingStat: generated.combatStats?.scalingStat || prev?.combatStats?.scalingStat || ''
          },
          enchantments: generated.enchantments || prev?.enchantments || '',
          originHistory: generated.originHistory || prev?.originHistory || '',
          requirements: generated.requirements || prev?.requirements || ''
        }));
      }
    } catch (e) {
      console.error("Custom item generation failed:", e);
    } finally {
      setIsGeneratingItem(false);
    }
  };

  // Sync custom item definition to Codex (Gegenstände)
  const handleSyncItemToCodex = (item: CustomInventoryItem) => {
    if (!onUpdateLore || !item.name.trim()) return;

    const existingIndex = lore.findIndex(l => 
      l.category === 'Gegenstände' && 
      (l.id === item.codexItemId || l.title.toLowerCase() === item.name.toLowerCase())
    );

    const codexEntry: LoreEntry = {
      id: existingIndex >= 0 ? lore[existingIndex].id : ('item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
      title: item.name.trim(),
      category: 'Gegenstände',
      description: item.description || `Allgemeine Definition für ${item.name.trim()}.`,
      isUnlocked: true,
      details: {
        builderType: (item.category as any) || 'Waffe',
        mainCategory: (item.category as any) || 'Waffen',
        subCategory: item.subCategory || 'Spezialausrüstung',
        itemType: item.subCategory || item.category || 'Ausrüstung',
        material: item.material || '',
        baseWeight: item.weight || '1.0 kg',
        specialProperties: item.specialEffects || '',
        magicalProperties: item.enchantments || '',
        combatStats: item.combatStats ? {
          damageType: item.combatStats.damageType,
          armorClass: item.combatStats.armorClass,
          range: item.combatStats.range
        } : {}
      }
    };

    let nextLore: LoreEntry[];
    if (existingIndex >= 0) {
      nextLore = [...lore];
      nextLore[existingIndex] = { ...nextLore[existingIndex], ...codexEntry };
    } else {
      nextLore = [...lore, codexEntry];
    }

    onUpdateLore(nextLore);

    // Update item with codex link
    if (editingItem && editingItem.id === item.id) {
      setEditingItem({ ...editingItem, codexItemId: codexEntry.id });
    }
    const updatedCustomList = customItems.map(it => it.id === item.id ? { ...it, codexItemId: codexEntry.id } : it);
    onChangeStructuredInventory({
      ...structuredInventory,
      customItems: updatedCustomList
    });

    setSaveSuccessMsg(`"${item.name}" wurde als Definition im Gegenstands-Codex gespeichert.`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Find Codex items belonging to this character
  // Helper to safely render strings in JSX children
  const renderSafeText = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.map(renderSafeText).filter(Boolean).join(', ');
    if (typeof val === 'object') {
      if (val.name) return String(val.name);
      if (val.description) return String(val.description);
      return JSON.stringify(val);
    }
    return String(val);
  };

  const allCodexGegenstaende = useMemo(() => {
    if (!Array.isArray(lore)) return [];
    return lore.filter(item => item.category === 'Gegenstände');
  }, [lore]);

  const codexItemsForChar = useMemo(() => {
    return allCodexGegenstaende.filter(item => {
      const o = (item.details?.owner || '').trim().toLowerCase();
      const c = (characterName || '').trim().toLowerCase();
      return o && c && (o === c || (c === 'spieler' && o === 'player') || (c === 'player' && o === 'spieler'));
    });
  }, [allCodexGegenstaende, characterName]);

  const checkInInventory = (itemTitle: string, itemId?: string) => {
    const normTitle = (itemTitle || '').toLowerCase().trim();
    if (!normTitle && !itemId) return { inInventory: false, locationLabel: '' };

    // 1. Check customItems
    const customMatch = customItems.find(ci =>
      (itemId && ci.codexItemId === itemId) || (ci.name && ci.name.toLowerCase().trim() === normTitle)
    );
    if (customMatch) {
      return { inInventory: true, locationLabel: 'Spezial-Item', customItem: customMatch };
    }

    // 2. Check weapons
    if (sanitizedWeapons.some(w => w.toLowerCase().trim() === normTitle)) {
      return { inInventory: true, locationLabel: 'Waffe' };
    }

    // 3. Check generalItems
    const genItems = structuredInventory?.generalItems || [];
    if (genItems.some((g: any) => (typeof g === 'string' ? g : g?.name || '').toLowerCase().trim() === normTitle)) {
      return { inInventory: true, locationLabel: 'Allgemeines Item' };
    }

    // 4. Check armor
    const armor = structuredInventory?.armor || {};
    for (const slotKey of Object.keys(armor)) {
      if (getSlotString((armor as any)[slotKey]).toLowerCase().trim() === normTitle) {
        return { inInventory: true, locationLabel: `Kleidung (${slotKey})` };
      }
    }

    // 5. Check accessories
    const accessories = structuredInventory?.accessories || {};
    for (const slotKey of Object.keys(accessories)) {
      if (getSlotString((accessories as any)[slotKey]).toLowerCase().trim() === normTitle) {
        return { inInventory: true, locationLabel: `Schmuck (${slotKey})` };
      }
    }

    return { inInventory: false, locationLabel: '' };
  };

  const handleAddCodexItemToInventory = (item: LoreEntry) => {
    const status = checkInInventory(item.title, item.id);
    if (status.inInventory) return;

    const mainCat = item.details?.mainCategory || (item.details?.itemType === 'Waffe' ? 'Waffen' : 'Werkzeuge & Alltags-Gegenstände');
    const customFromCodex: CustomInventoryItem = {
      id: 'custom_' + item.id + '_' + Date.now(),
      name: item.title,
      category: mainCat,
      subCategory: item.details?.subCategory || item.details?.itemType || 'Codex-Gegenstand',
      slot: (mainCat === 'Waffen' || item.details?.itemType === 'Waffe') ? 'weapon' : 'inventory',
      equipped: true,
      rarity: item.details?.rarity || 'Gewöhnlich',
      quality: item.details?.quality || 'Standard',
      material: item.details?.material || 'Standard',
      durability: item.details?.durability || '100 / 100',
      weight: item.details?.weight || '1.0 kg',
      value: item.details?.pricePerUnit || 50,
      description: item.description || '',
      specialEffects: item.details?.specialProperties || '',
      enchantments: item.details?.magicalProperties || '',
      originHistory: item.details?.loreHistory || '',
      combatStats: item.details?.combatStats || {},
      codexItemId: item.id
    };

    onChangeStructuredInventory({
      ...structuredInventory,
      customItems: [...customItems, customFromCodex]
    });

    setSaveSuccessMsg(`Gegenstand '${item.title}' wurde dem Inventar hinzugefügt.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleRemoveCodexItemFromInventory = (itemTitle: string, itemId?: string) => {
    const normTitle = (itemTitle || '').toLowerCase().trim();

    // 1. Filter customItems
    const nextCustom = customItems.filter(ci => {
      if (itemId && ci.codexItemId === itemId) return false;
      if (ci.name && ci.name.toLowerCase().trim() === normTitle) return false;
      return true;
    });

    // 2. Filter weapons
    const nextWeapons = sanitizedWeapons.filter(w => w.toLowerCase().trim() !== normTitle);

    // 3. Filter generalItems
    const genItems = structuredInventory?.generalItems || [];
    const nextGeneral = genItems.filter((g: any) => (typeof g === 'string' ? g : g?.name || '').toLowerCase().trim() !== normTitle);

    // 4. Remove from armor if matching
    const nextArmor = { ...(structuredInventory?.armor || {}) };
    (Object.keys(nextArmor) as Array<keyof typeof nextArmor>).forEach(slot => {
      if (getSlotString((nextArmor as any)[slot]).toLowerCase().trim() === normTitle) {
        delete (nextArmor as any)[slot];
      }
    });

    // 5. Remove from accessories if matching
    const nextAccessories = { ...(structuredInventory?.accessories || {}) };
    (Object.keys(nextAccessories) as Array<keyof typeof nextAccessories>).forEach(slot => {
      if (getSlotString((nextAccessories as any)[slot]).toLowerCase().trim() === normTitle) {
        delete (nextAccessories as any)[slot];
      }
    });

    onChangeStructuredInventory({
      ...structuredInventory,
      customItems: nextCustom,
      weapons: nextWeapons,
      generalItems: nextGeneral,
      armor: nextArmor,
      accessories: nextAccessories
    });

    setSaveSuccessMsg(`Gegenstand '${itemTitle}' wurde aus dem Inventar entfernt.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const displayedCodexItems = useMemo(() => {
    const sourceList = (codexFilterMode === 'char' && codexItemsForChar.length > 0) ? codexItemsForChar : allCodexGegenstaende;
    return sourceList.filter(item => {
      if (codexCategoryFilter !== 'all') {
        const cat = item.details?.mainCategory || item.details?.itemType || 'Allgemein';
        if (cat !== codexCategoryFilter) return false;
      }
      if (codexSearchQuery.trim()) {
        const q = codexSearchQuery.toLowerCase().trim();
        const t = (item.title || '').toLowerCase();
        const d = (item.description || '').toLowerCase();
        const c = (item.details?.mainCategory || item.details?.itemType || '').toLowerCase();
        const o = (item.details?.owner || '').toLowerCase();
        return t.includes(q) || d.includes(q) || c.includes(q) || o.includes(q);
      }
      return true;
    });
  }, [codexFilterMode, codexItemsForChar, allCodexGegenstaende, codexCategoryFilter, codexSearchQuery]);

  return (
    <div className="space-y-6">
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <i className="fa-solid fa-circle-check text-emerald-400"></i>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-4 md:p-5 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-base shrink-0">
            <i className="fa-solid fa-briefcase"></i>
          </span>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-100">
              Besitz, Ausrüstung &amp; Inventar
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Verwalte Rüstungsslots, Finanzen und erstelle maßgeschneiderte Spezial-Gegenstände (z.B. besondere Katanas, Artefakte oder Meisterstücke).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onExtractInventory && (
            <button
              type="button"
              onClick={onExtractInventory}
              disabled={isExtractingInventory || !characterOutfit}
              className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 disabled:opacity-40 border border-sky-500/30 text-sky-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Extrahiert getragene Kleidung und Waffen aus dem Outfit-Text"
            >
              <i className={`fa-solid ${isExtractingInventory ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'}`}></i>
              <span>Aus Outfit extrahieren</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleStartCreateItem}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Besonderen Gegenstand anpassen</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: BESONDERE / MAßGESCHNEIDERTE GEGENSTÄNDE (z.B. Besonderes Katana) */}
      <div className="p-4 md:p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-amber-400 text-sm"></i>
            <div>
              <span className="text-xs text-slate-200 font-bold uppercase tracking-wider block">
                Maßgeschneiderte Spezial-Ausrüstung &amp; Unikate
              </span>
              <span className="text-[10px] text-slate-500 block">
                Detaillierte Waffen, magische Artefakte, Katanas, Rüstungsteile mit eigenen Werten, Effekten und Lore.
              </span>
            </div>
          </div>

          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold border border-slate-700">
            {customItems.length} {customItems.length === 1 ? 'Spezial-Gegenstand' : 'Spezial-Gegenstände'}
          </span>
        </div>

        {customItems.length === 0 ? (
          <div className="p-6 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-center flex flex-col items-center justify-center gap-2">
            <i className="fa-solid fa-shield-halved text-slate-600 text-2xl mb-1"></i>
            <span className="text-xs text-slate-400 font-medium">
              Noch keine maßgeschneiderten Spezial-Gegenstände angelegt.
            </span>
            <p className="text-[11px] text-slate-500 max-w-md">
              Erstelle ein besonderes Katana (z.B. mit Klingen-Schadenswerten, Schatteneffekten und Schmiedeherkunft) oder passe beliebige Waffen und Rüstungsteile individuell an.
            </p>
            <button
              type="button"
              onClick={handleStartCreateItem}
              className="mt-2 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Ersten Gegenstand anpassen</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {customItems.map((item, itemIdx) => (
              <div
                key={`custom-inv-${item.id || item.name || 'item'}-${itemIdx}`}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  item.equipped
                    ? 'bg-slate-950/80 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-100">{item.name}</span>
                        {item.rarity && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                            item.rarity === 'Legendär' || item.rarity === 'Mythisch' || item.rarity === 'Unikat'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : item.rarity === 'Episch' || item.rarity === 'Artefakt'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : item.rarity === 'Selten'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {item.rarity}
                          </span>
                        )}
                        {item.subCategory && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({item.subCategory})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Slot: <strong className="text-slate-300">{SLOT_OPTIONS.find(s => s.id === item.slot)?.label || item.slot || 'Waffe'}</strong></span>
                        {item.quality && <span>• {item.quality}</span>}
                        {item.material && <span>• {item.material}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleEquipped(item.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        item.equipped
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                      title={item.equipped ? 'Gegenstand ist angelegt' : 'Gegenstand im Gepäck / nicht angelegt'}
                    >
                      {item.equipped ? 'Angelegt' : 'Im Gepäck'}
                    </button>
                  </div>

                  {item.combatStats && (item.combatStats.damage || item.combatStats.defense) && (
                    <div className="flex items-center gap-2 flex-wrap text-[10px] p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                      {item.combatStats.damage && (
                        <div className="flex items-center gap-1 text-red-400">
                          <i className="fa-solid fa-khanda text-[9px]"></i>
                          <span>Schaden: <strong>{renderSafeText(item.combatStats.damage)}</strong></span>
                        </div>
                      )}
                      {item.combatStats.defense && (
                        <div className="flex items-center gap-1 text-sky-400">
                          <i className="fa-solid fa-shield text-[9px]"></i>
                          <span>Rüstung: <strong>{renderSafeText(item.combatStats.defense)}</strong></span>
                        </div>
                      )}
                      {item.combatStats.scalingStat && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <i className="fa-solid fa-scale-balanced text-[9px]"></i>
                          <span>Skalierung: {renderSafeText(item.combatStats.scalingStat)}</span>
                        </div>
                      )}
                      {item.durability && (
                        <div className="text-slate-400 ml-auto font-mono text-[9px]">
                          {renderSafeText(item.durability)}
                        </div>
                      )}
                    </div>
                  )}

                  {item.specialEffects && (
                    <div className="text-[11px] text-amber-200/90 bg-amber-950/20 border border-amber-900/30 rounded-lg p-2 flex items-start gap-1.5">
                      <i className="fa-solid fa-bolt text-amber-400 text-[10px] mt-0.5 shrink-0"></i>
                      <span>{renderSafeText(item.specialEffects)}</span>
                    </div>
                  )}

                  {item.enchantments && (
                    <div className="text-[11px] text-purple-200/90 bg-purple-950/20 border border-purple-900/30 rounded-lg p-2 flex items-start gap-1.5">
                      <i className="fa-solid fa-sparkles text-purple-400 text-[10px] mt-0.5 shrink-0"></i>
                      <span>{renderSafeText(item.enchantments)}</span>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                      "{renderSafeText(item.description)}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {onUpdateLore && (
                      <button
                        type="button"
                        onClick={() => handleSyncItemToCodex(item)}
                        className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Speichert oder aktualisiert diesen Gegenstand im globalen Codex"
                      >
                        <i className="fa-solid fa-scroll text-[9px]"></i>
                        <span>Im Codex {item.codexItemId ? 'aktualisieren' : 'anlegen'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditItem(item)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <i className="fa-solid fa-pen-to-square text-[9px]"></i>
                      <span>Bearbeiten</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] transition-all cursor-pointer"
                      title="Gegenstand entfernen"
                    >
                      <i className="fa-solid fa-trash-can text-[9px]"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: BASIS-AUSRÜSTUNGSSLOTS (Kleidung, Rüstung, Schmuck) */}
      <div className="p-4 md:p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-shirt text-sky-400 text-sm"></i>
            <div>
              <span className="text-xs text-slate-200 font-bold uppercase tracking-wider block">
                Standard-Ausrüstungsslots &amp; Bekleidung
              </span>
              <span className="text-[10px] text-slate-500 block">
                Tragbare Kleidung, Rüstungsteile, Accessoires und Schnellübersicht.
              </span>
            </div>
          </div>
        </div>

        {/* Kleidung / Schutz & Schmuck / Accessoires side-by-side on md, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kleidung & Schutz */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
              <i className="fa-solid fa-shirt"></i> Kleidung &amp; Schutz
            </h5>

            {/* Kopf */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-hat-cowboy text-slate-500"></i> Kopf
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Strohhut, Eisenhelm...)"
                value={getSlotString(structuredInventory?.armor?.head)}
                onChange={e => updateArmorSlot('head', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>

            {/* Brust / Torso */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-vest text-slate-500"></i> Brust / Torso
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Lederharnisch, Robe...)"
                value={getSlotString(structuredInventory?.armor?.chest)}
                onChange={e => updateArmorSlot('chest', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>

            {/* Hände */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-hand text-slate-500"></i> Hände
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Lederhandschuhe...)"
                value={getSlotString(structuredInventory?.armor?.hands)}
                onChange={e => updateArmorSlot('hands', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>

            {/* Beine */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-socks text-slate-500"></i> Beine
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Stoffhose, Beinschienen...)"
                value={getSlotString(structuredInventory?.armor?.legs)}
                onChange={e => updateArmorSlot('legs', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>

            {/* Füße */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-shoe-prints text-slate-500"></i> Füße
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Stiefel, Sandalen...)"
                value={getSlotString(structuredInventory?.armor?.feet)}
                onChange={e => updateArmorSlot('feet', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Schmuck & Accessoires */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 shadow-inner">
            <h5 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
              <i className="fa-solid fa-gem"></i> Schmuck &amp; Accessoires
            </h5>

            {/* Finger */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-ring text-slate-500"></i> Finger
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Siegelring...)"
                value={getSlotString(structuredInventory?.accessories?.finger)}
                onChange={e => updateAccessorySlot('finger', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>

            {/* Hals */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-gem text-slate-500"></i> Hals
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Schutzamulett...)"
                value={getSlotString(structuredInventory?.accessories?.neck)}
                onChange={e => updateAccessorySlot('neck', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>

            {/* Handgelenke */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-clock text-slate-500"></i> Handgelenke
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Armreif, Uhr...)"
                value={getSlotString(structuredInventory?.accessories?.wrist)}
                onChange={e => updateAccessorySlot('wrist', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>

            {/* Taille */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-ring text-slate-500"></i> Taille
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Gürtel, Schärpe...)"
                value={getSlotString(structuredInventory?.accessories?.waist)}
                onChange={e => updateAccessorySlot('waist', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>

            {/* Rücken */}
            <div className="flex flex-col gap-1 bg-slate-900/40 border border-slate-800/80 p-2.5 rounded-xl focus-within:border-sky-500/80 transition-all">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <i className="fa-solid fa-shield text-slate-500"></i> Rücken
              </label>
              <AutoExpandingTextarea
                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                placeholder="Keine (z.B. Umhang, Rucksack...)"
                value={getSlotString(structuredInventory?.accessories?.back)}
                onChange={e => updateAccessorySlot('back', e.target.value)}
                minRows={1}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>

        {/* Finanzen & Waffenliste */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800/60 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Geld</label>
              <input
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500 font-mono font-bold"
                value={structuredInventory?.money ?? 100}
                onChange={e => updateInventoryField('money', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-500 block mb-1 uppercase font-bold">Währung</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
                placeholder="Goldstücke / Berry"
                value={getSlotString(structuredInventory?.currencyLabel) || 'Goldstücke'}
                onChange={e => updateInventoryField('currencyLabel', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] text-slate-500 uppercase font-bold">Waffen (Kommagetrennt)</label>
              <span className="text-[9px] text-slate-500">Schnelleingabe</span>
            </div>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs outline-none focus:border-sky-500"
              placeholder="z.B. Katana, Eisendolch, Zauberstab"
              value={sanitizedWeapons.join(', ')}
              onChange={e => {
                const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                updateInventoryField('weapons', list);
              }}
            />
            {sanitizedWeapons.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {sanitizedWeapons.map((wName, idx) => {
                  const hasCustom = customItems.some(ci => (ci.name || '').toLowerCase() === wName.toLowerCase());
                  return (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-800/90 border border-slate-700 rounded text-[10px] text-slate-200 flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-shield-halved text-amber-400 text-[8px]"></i>
                      <span>{wName}</span>
                      {!hasCustom && (
                        <button
                          type="button"
                          onClick={() => handleConvertWeaponToCustomItem(wName)}
                          className="text-[9px] text-amber-400 hover:text-amber-300 ml-1 font-bold underline cursor-pointer"
                          title="Als detailliertes Spezial-Item anpassen"
                        >
                          Anpassen
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Im Codex vorhandene Gegenstände / Codex-Gegenstände Auswahl */}
        {allCodexGegenstaende.length > 0 && (
          <div className="bg-slate-950/70 border border-amber-500/20 rounded-xl p-3.5 mt-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-scroll text-amber-400 text-xs"></i>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Im Codex vorhandene Gegenstände
                </span>
              </div>

              {/* Filter Tabs & Modal Picker Trigger */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {codexItemsForChar.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCodexFilterMode('char')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      codexFilterMode === 'char'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    Besitzer: {characterName} ({codexItemsForChar.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCodexPickerOpen(true)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
                  <span>Codex durchsuchen</span>
                </button>
              </div>
            </div>

            {/* Quick Search & Category Filter bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 placeholder:text-slate-500"
                  placeholder="Gegenstand im Codex suchen..."
                  value={codexSearchQuery}
                  onChange={e => setCodexSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <select
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                  value={codexCategoryFilter}
                  onChange={e => setCodexCategoryFilter(e.target.value)}
                >
                  <option value="all">Alle Kategorien</option>
                  <option value="Waffen">Waffen</option>
                  <option value="Rüstung">Rüstung &amp; Kleidung</option>
                  <option value="Kleidung">Kleidung &amp; Textilien</option>
                  <option value="Rohstoffe">Rohstoffe &amp; Materialien</option>
                  <option value="Nahrung">Nahrung &amp; Getreide</option>
                  <option value="Medizin">Medizin &amp; Alchemie</option>
                  <option value="Magische">Magische Gegenstände</option>
                  <option value="Werkzeuge">Werkzeuge &amp; Haushalt</option>
                  <option value="Quest">Questgegenstände</option>
                </select>
              </div>
            </div>

            {/* Grid of Codex Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {displayedCodexItems.map((item, itemIdx) => {
                const status = checkInInventory(item.title, item.id);
                return (
                  <div
                    key={`codex-inv-${item.id || item.title || 'item'}-${itemIdx}`}
                    className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl flex flex-col justify-between gap-3 text-xs hover:border-slate-700 transition-all shadow-sm"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-slate-100 block whitespace-normal break-words leading-snug">
                        {item.title}
                      </span>
                      <div className="flex flex-col gap-0.5 text-[10px] text-slate-400">
                        <span>
                          {item.details?.itemType || item.details?.mainCategory || 'Gegenstand'}
                        </span>
                        {item.details?.owner && (
                          <span className="text-slate-500 font-mono text-[9px]">
                            Besitzer: {item.details.owner}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-slate-800/65 pt-2 mt-1">
                      {status.inInventory ? (
                        <>
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-lg text-[9px] font-bold flex items-center gap-1 shrink-0">
                            <i className="fa-solid fa-check text-[8px]"></i>
                            <span>{status.locationLabel}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCodexItemFromInventory(item.title, item.id)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-lg text-[9px] font-bold transition-all cursor-pointer shrink-0"
                            title="Aus Inventar entfernen / löschen"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddCodexItemToInventory(item)}
                          className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <i className="fa-solid fa-plus text-[9px]"></i>
                          <span>Hinzufügen</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {displayedCodexItems.length === 0 && (
                <div className="col-span-full p-6 text-center text-xs text-slate-500 italic bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
                  Keine passenden Codex-Gegenstände gefunden.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL / FORMULAR: GEZIELTE GEGENSTANDSANPASSUNG */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl p-5 md:p-6 shadow-2xl my-auto space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-sm">
                  <i className="fa-solid fa-khanda"></i>
                </span>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-100">
                    {isCreatingNew ? 'Neuen Gegenstand anpassen' : `Gegenstand anpassen: ${editingItem.name || 'Unbenannt'}`}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Passe Eigenschaften, Kampfwerte, Spezialeffekte, Material und Lore gezielt an.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Smart Fill / AI Helper for this Item */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  KI-Gegenstands-Generator &amp; Ausfüllhilfe
                </span>
                {isGeneratingItem && (
                  <span className="text-[10px] text-amber-400 animate-pulse font-medium">
                    Generiere Gegenstands-Attribute...
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  placeholder="z.B. Besonderes Dämonen-Katana Muramasa mit Lebensraub und Schattenschaden..."
                  value={itemPromptText}
                  onChange={e => setItemPromptText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerateItemWithAI();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleGenerateItemWithAI}
                  disabled={isGeneratingItem}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <i className={`fa-solid ${isGeneratingItem ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
                  <span>KI Generieren</span>
                </button>
              </div>
            </div>

            {/* Core Item Information Form */}
            <div className="space-y-4">
              
              {/* Row 1: Name, Category, SubCategory */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Gegenstands-Name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 font-bold"
                    placeholder="Gegenstandsname eingeben"
                    value={editingItem.name}
                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Hauptkategorie
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                    value={editingItem.category || 'Waffen'}
                    onChange={e => {
                      const newCat = e.target.value;
                      const catMeta = ITEM_MAIN_CATEGORIES.find(c => c.id === newCat);
                      const defaultSub = catMeta?.subcategories?.[0] || '';
                      let defaultSlot: CustomInventoryItem['slot'] = 'inventory';
                      if (newCat === 'Waffen' || newCat === 'Militärbedarf') defaultSlot = 'weapon';
                      else if (newCat === 'Rüstung & Schutzausrüstung' || newCat === 'Kleidung & Textilien') defaultSlot = 'chest';
                      else if (newCat === 'Magische Gegenstände') defaultSlot = 'neck';
                      
                      setEditingItem({
                        ...editingItem,
                        category: newCat,
                        subCategory: defaultSub,
                        slot: defaultSlot,
                        unit: catMeta?.defaultUnit || editingItem.unit || 'Stück',
                        value: editingItem.value !== undefined ? editingItem.value : (catMeta?.defaultPrice || 10)
                      });
                    }}
                  >
                    {ITEM_MAIN_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Typ / Subkategorie
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                    placeholder="Unterkategorie / Spezifikation"
                    value={editingItem.subCategory || ''}
                    onChange={e => setEditingItem({ ...editingItem, subCategory: e.target.value })}
                  />
                </div>
              </div>

              {/* Subcategory quick pills */}
              {(() => {
                const currentCatMeta = ITEM_MAIN_CATEGORIES.find(c => c.id === (editingItem.category || 'Waffen'));
                if (!currentCatMeta || !currentCatMeta.subcategories || currentCatMeta.subcategories.length === 0) return null;
                return (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold mr-1">Vorschläge:</span>
                    {currentCatMeta.subcategories.slice(0, 8).map(sub => {
                      const isSelected = editingItem.subCategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, subCategory: sub })}
                          className={`px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600 text-white font-bold'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Row 2: Slot, Equipped, Rarity, Quality */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Ausrüstungs-Slot
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                    value={editingItem.slot || 'inventory'}
                    onChange={e => setEditingItem({ ...editingItem, slot: e.target.value as any })}
                  >
                    {SLOT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Seltenheit
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                    value={editingItem.rarity || 'Selten'}
                    onChange={e => setEditingItem({ ...editingItem, rarity: e.target.value as any })}
                  >
                    {RARITY_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Qualität / Zustand
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                    placeholder="z.B. Meisterlich geschmiedet, Gut, Makellos"
                    value={editingItem.quality || ''}
                    onChange={e => setEditingItem({ ...editingItem, quality: e.target.value })}
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={!!editingItem.equipped}
                      onChange={e => setEditingItem({ ...editingItem, equipped: e.target.checked })}
                      className="accent-amber-500 rounded"
                    />
                    <span className="text-slate-200 font-medium">Aktiv angelegt</span>
                  </label>
                </div>
              </div>

              {/* Row 3: Material, Durability / Stack, Weight, Value */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Material / Grundstoff
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                    placeholder="z.B. Stahl, Leder, Mithril, Seide"
                    value={editingItem.material || ''}
                    onChange={e => setEditingItem({ ...editingItem, material: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Haltbarkeit / Einheiten
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-mono"
                    placeholder="z.B. 100 / 100 oder 10 Stück"
                    value={editingItem.durability || ''}
                    onChange={e => setEditingItem({ ...editingItem, durability: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Gewicht
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                    placeholder="z.B. 1.2 kg"
                    value={editingItem.weight || ''}
                    onChange={e => setEditingItem({ ...editingItem, weight: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Handelswert ({structuredInventory.currencyLabel || 'Gold'})
                  </label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-mono font-bold"
                    placeholder="z.B. 50"
                    value={editingItem.value ?? 50}
                    onChange={e => setEditingItem({ ...editingItem, value: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* DYNAMISCHE KATEGORIE-SPEZIFISCHE FORMULARE */}
              {/* ========================================================================= */}

              {/* 1. WAFFEN & MILITÄRBEDARF */}
              {(editingItem.category === 'Waffen' || editingItem.category === 'Militärbedarf') && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Kampfwerte &amp; Waffenattribute
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{editingItem.subCategory || 'Waffe'}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Schaden / Angriff</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 1d10+4"
                        value={editingItem.combatStats?.damage || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          combatStats: { ...(editingItem.combatStats || {}), damage: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Schadensart</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Schlitzen, Wucht, Magie"
                        value={editingItem.combatStats?.damageType || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          combatStats: { ...(editingItem.combatStats || {}), damageType: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Reichweite</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Nahkampf (1.2m), 30m"
                        value={editingItem.combatStats?.range || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          combatStats: { ...(editingItem.combatStats || {}), range: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Skalierung</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Stärke / Geschick"
                        value={editingItem.combatStats?.scalingStat || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          combatStats: { ...(editingItem.combatStats || {}), scalingStat: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Händigkeit / Tempo</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Einhand, Zweihand"
                        value={editingItem.combatStats?.attackSpeed || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          combatStats: { ...(editingItem.combatStats || {}), attackSpeed: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                        Spezialeffekte &amp; Kampfboni
                      </label>
                      <AutoExpandingTextarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[45px] outline-none focus:border-amber-500"
                        placeholder="z.B. Kritischer Trefferstoß, Rüstungsdurchdringung..."
                        value={editingItem.specialEffects || ''}
                        onChange={e => setEditingItem({ ...editingItem, specialEffects: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                        Verzauberungen &amp; Runen
                      </label>
                      <AutoExpandingTextarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[45px] outline-none focus:border-amber-500"
                        placeholder="z.B. Flammenglut-Rune, Frostverzauberung..."
                        value={editingItem.enchantments || ''}
                        onChange={e => setEditingItem({ ...editingItem, enchantments: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. RÜSTUNG, SCHUTZAUSRÜSTUNG & KLEIDUNG */}
              {(editingItem.category === 'Rüstung & Schutzausrüstung' || editingItem.category === 'Kleidung & Textilien') && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Schutzwerte &amp; Rüstungsattribute
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{editingItem.subCategory || 'Rüstung'}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Rüstungswert / Schutz</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-bold"
                        placeholder="z.B. +14 Rüstung"
                        value={editingItem.combatStats?.defense || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          combatStats: { ...(editingItem.combatStats || {}), defense: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Rüstungsklasse</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Leicht, Mittel, Schwer, Stoff"
                        value={editingItem.combatStats?.armorClass || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          combatStats: { ...(editingItem.combatStats || {}), armorClass: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Schadensresistenzen</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Schnitt +20%, Magieschutz +10%"
                        value={editingItem.combatStats?.resists || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          combatStats: { ...(editingItem.combatStats || {}), resists: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Beweglichkeit / Malus</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Keine Behinderung, -5% Tempo"
                        value={editingItem.combatStats?.mobilityPenalty || ''}
                        onChange={e => setEditingItem({
                          ...editingItem,
                          combatStats: { ...(editingItem.combatStats || {}), mobilityPenalty: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                        Schutzeffekte &amp; Trageboni
                      </label>
                      <AutoExpandingTextarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[45px] outline-none focus:border-amber-500"
                        placeholder="z.B. Erhöht Lebenskraft um +20, Kälteresistenz..."
                        value={editingItem.specialEffects || ''}
                        onChange={e => setEditingItem({ ...editingItem, specialEffects: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                        Sockel, Fütterung &amp; Verzauberungen
                      </label>
                      <AutoExpandingTextarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[45px] outline-none focus:border-amber-500"
                        placeholder="z.B. 1 Freier Runensockel, Mondsilberdraht-Fütterung..."
                        value={editingItem.enchantments || ''}
                        onChange={e => setEditingItem({ ...editingItem, enchantments: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ROHSTOFFE & MATERIALIEN & ZWISCHENPRODUKTE */}
              {(editingItem.category === 'Rohstoffe' || editingItem.category === 'Materialien & Zwischenprodukte') && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Rohstoff- &amp; Materialeigenschaften
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{editingItem.subCategory || 'Rohstoff / Material'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Reinheitsgrad / Güteklasse</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 98% Reinheit, Rohquarz, Feingehalt"
                        value={editingItem.purityGrade || ''}
                        onChange={e => setEditingItem({ ...editingItem, purityGrade: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Vorkommen / Fundort</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Tiefenminen, Flussbett, Hochgebirge"
                        value={editingItem.depositLocation || ''}
                        onChange={e => setEditingItem({ ...editingItem, depositLocation: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Benötigtes Abbauwerkzeug</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Gehärtete Spitzhacke, Handsichel"
                        value={editingItem.miningToolRequired || ''}
                        onChange={e => setEditingItem({ ...editingItem, miningToolRequired: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Verarbeitbar zu</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Barren, Klingen, Rüstungsplatten"
                        value={editingItem.processedInto || ''}
                        onChange={e => setEditingItem({ ...editingItem, processedInto: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Benötigter Betrieb / Beruf</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Schmelzhütte, Schmiedestube, Gerberei"
                        value={editingItem.processingFacility || ''}
                        onChange={e => setEditingItem({ ...editingItem, processingFacility: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Härte / Schmelzpunkt</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 1450 °C, Mohs-Härte 7.5"
                        value={editingItem.hardnessOrMeltingPoint || ''}
                        onChange={e => setEditingItem({ ...editingItem, hardnessOrMeltingPoint: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. NAHRUNG & LANDWIRTSCHAFT */}
              {(editingItem.category === 'Nahrung' || editingItem.category === 'Landwirtschaft') && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Nährwert, Frische &amp; Regeneration
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{editingItem.subCategory || 'Nahrung / Landwirtschaft'}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Sättigungswert / Nährwert</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. +45 Sättigung, Volle Ration"
                        value={editingItem.nutritionSaturation || ''}
                        onChange={e => setEditingItem({ ...editingItem, nutritionSaturation: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Frische &amp; Haltbarkeit</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 7 Tage haltbar, Getrocknet"
                        value={editingItem.freshnessDuration || ''}
                        onChange={e => setEditingItem({ ...editingItem, freshnessDuration: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Zubereitung / Zustand</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Gekocht, Geräuchert, Frisch"
                        value={editingItem.preparationMethod || ''}
                        onChange={e => setEditingItem({ ...editingItem, preparationMethod: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Geschmack / Güte</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Herzhaft, Kräftig, Köstlich"
                        value={editingItem.tasteQuality || ''}
                        onChange={e => setEditingItem({ ...editingItem, tasteQuality: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                      Regenerations- &amp; Statuseffekte bei Verzehr
                    </label>
                    <AutoExpandingTextarea
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px] outline-none focus:border-amber-500"
                      placeholder="z.B. Regeneriert +15 Lebenskraft über 3 Minuten; wärmt den Körper bei eisigem Wetter..."
                      value={editingItem.regenerationEffect || ''}
                      onChange={e => setEditingItem({ ...editingItem, regenerationEffect: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* 5. MEDIZIN, TRÄNKE & ALCHEMIE */}
              {editingItem.category === 'Medizin' && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Medizinische &amp; Alchemistische Wirkung
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{editingItem.subCategory || 'Medizin / Trank'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Heil- / Schutz- / Giftwirkung</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-bold"
                        placeholder="z.B. Sofortige Heilung +50 HP, Neutralisiert Gift"
                        value={editingItem.healingOrPoisonEffect || ''}
                        onChange={e => setEditingItem({ ...editingItem, healingOrPoisonEffect: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Wirkungsdauer &amp; Einsetzzeit</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Sofortwirkung, 10 Runden anhaltend"
                        value={editingItem.effectDuration || ''}
                        onChange={e => setEditingItem({ ...editingItem, effectDuration: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Dosierung &amp; Anwendungen</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 3 Dosen / Schlucke, Einmalige Salbung"
                        value={editingItem.dosesOrUses || ''}
                        onChange={e => setEditingItem({ ...editingItem, dosesOrUses: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                        Toxizität, Risiken &amp; Nebenwirkungen
                      </label>
                      <AutoExpandingTextarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px] outline-none focus:border-amber-500"
                        placeholder="z.B. 0% Toxizität; leichte Schläfrigkeit nach Abklingen..."
                        value={editingItem.toxicityOrSideEffects || ''}
                        onChange={e => setEditingItem({ ...editingItem, toxicityOrSideEffects: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                        Alchemie-Rezeptur &amp; Hauptzutaten
                      </label>
                      <AutoExpandingTextarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px] outline-none focus:border-amber-500"
                        placeholder="z.B. 2x Silberblatt-Extrakt, 1x Mondquellwasser, 1 Tropfen Reines Harz..."
                        value={editingItem.alchemyRecipe || ''}
                        onChange={e => setEditingItem({ ...editingItem, alchemyRecipe: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. MAGISCHE GEGENSTÄNDE & RELIKTE */}
              {editingItem.category === 'Magische Gegenstände' && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Magische Resonanz &amp; Astralenergie
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{editingItem.subCategory || 'Artefakt / Relikt'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Magieschule / Elementaraffinität</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Astralmagie, Schatten, Licht, Arkan"
                        value={editingItem.magicSchoolAffinity || ''}
                        onChange={e => setEditingItem({ ...editingItem, magicSchoolAffinity: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Manakapazität / Ladungen</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-mono"
                        placeholder="z.B. 3 / 3 Ladungen täglich, +25 Mana"
                        value={editingItem.manaCapacityOrCharges || ''}
                        onChange={e => setEditingItem({ ...editingItem, manaCapacityOrCharges: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Seelenbindung &amp; Einstimmung</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Erfordert Einstimmung (Attunement)"
                        value={typeof editingItem.attunementRequired === 'string' ? editingItem.attunementRequired : (editingItem.attunementRequired ? 'Erfordert Einstimmung' : '')}
                        onChange={e => setEditingItem({ ...editingItem, attunementRequired: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                        Aktivierbarer Zaubereffekt
                      </label>
                      <AutoExpandingTextarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[45px] outline-none focus:border-amber-500"
                        placeholder="z.B. Entfesselt auf Kommando eine Barriere aus astralem Licht..."
                        value={editingItem.activatedSpellEffect || editingItem.specialEffects || ''}
                        onChange={e => setEditingItem({ ...editingItem, activatedSpellEffect: e.target.value, specialEffects: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                        Fluch, Astralresonanz &amp; Kosmische Bedingung
                      </label>
                      <AutoExpandingTextarea
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[45px] outline-none focus:border-amber-500"
                        placeholder="z.B. Verlangt bei Vollmond eine Blutopfer-Berührung; flüstert Warnungen vor Unheil..."
                        value={editingItem.curseOrAstralResonance || editingItem.enchantments || ''}
                        onChange={e => setEditingItem({ ...editingItem, curseOrAstralResonance: e.target.value, enchantments: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 7. WERKZEUGE, HAUSHALT & PRODUKTE */}
              {(editingItem.category === 'Werkzeuge' || editingItem.category === 'Alltags- & Haushaltsgegenstände' || editingItem.category === 'Produkte') && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Werkzeugfunktion &amp; Handwerksnutzen
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{editingItem.subCategory || 'Werkzeug / Ausrüstung'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Handwerksdisziplin / Fachbereich</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Schmiedekunst, Schlosserei, Alchemie"
                        value={editingItem.craftingDiscipline || ''}
                        onChange={e => setEditingItem({ ...editingItem, craftingDiscipline: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Handwerks- / Präzisionsbonus</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. +20% Meistererfolg, halbiert Zeit"
                        value={editingItem.craftingBonus || ''}
                        onChange={e => setEditingItem({ ...editingItem, craftingBonus: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Maximale Nutzungen / Haltbarkeit</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 150 Nutzungen, Nachschleifbar"
                        value={editingItem.maxToolUses || ''}
                        onChange={e => setEditingItem({ ...editingItem, maxToolUses: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                      Spezifischer Verwendungszweck &amp; Einsatzgebiet
                    </label>
                    <AutoExpandingTextarea
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px] outline-none focus:border-amber-500"
                      placeholder="z.B. Ermöglicht das Knacken mechanischer Schlösser bis Meisterschaftsgrad 3..."
                      value={editingItem.intendedUsageField || ''}
                      onChange={e => setEditingItem({ ...editingItem, intendedUsageField: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* 8. TIERE, TRANSPORTMITTEL & HANDELSWAREN */}
              {(editingItem.category === 'Tiere' || editingItem.category === 'Transportmittel' || editingItem.category === 'Handelswaren') && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Traglast, Fortbewegung &amp; Versorgung
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{editingItem.subCategory || 'Tier / Transportmittel'}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Tragkraft / Zuladung</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 150 kg Gepäck, 2 Tonnen"
                        value={editingItem.carryingCapacity || ''}
                        onChange={e => setEditingItem({ ...editingItem, carryingCapacity: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Geschwindigkeit / Reittempo</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 45 km/h, Schneller Galopp"
                        value={editingItem.speedOrPace || ''}
                        onChange={e => setEditingItem({ ...editingItem, speedOrPace: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Besatzung / Passagiere</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 1 Reiter + 1 Beifahrer"
                        value={editingItem.crewOrPassengers || ''}
                        onChange={e => setEditingItem({ ...editingItem, crewOrPassengers: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Futter / Instandhaltung</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. 2 Heuballen/Tag, 5 Gold/Monat"
                        value={editingItem.feedOrMaintenanceCost || ''}
                        onChange={e => setEditingItem({ ...editingItem, feedOrMaintenanceCost: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 9. QUEST- & STORY-GEGENSTÄNDE */}
              {editingItem.category === 'Quest-/Story-Gegenstände' && (
                <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      Handlungsrelevanz &amp; Quest-Verbindung
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{editingItem.subCategory || 'Questgegenstand'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Zugehörige Quest / Handlungsstrang</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-bold"
                        placeholder="z.B. Hauptquest 'Das Siegel der Schatten'"
                        value={editingItem.associatedQuestOrLock || ''}
                        onChange={e => setEditingItem({ ...editingItem, associatedQuestOrLock: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">Sprache / Kodierung / Authentizität</label>
                      <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                        placeholder="z.B. Alt-Valyrisch, Originalurkunde mit Königssiegel"
                        value={editingItem.languageOrLoreField || ''}
                        onChange={e => setEditingItem({ ...editingItem, languageOrLoreField: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-300 font-bold uppercase block mb-1">
                      Inschrift, Textauszug oder Geheimnis
                    </label>
                    <AutoExpandingTextarea
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[45px] outline-none focus:border-amber-500"
                      placeholder="z.B. Eingravierter Leitspruch: 'Nur wer im Schatten wandelt, findet das wahre Licht'..."
                      value={editingItem.textExcerptOrInscription || ''}
                      onChange={e => setEditingItem({ ...editingItem, textExcerptOrInscription: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* PROGRESSION (AUTOMATISCH NACH SCHRITT 2 VON 9) */}
              {/* ========================================================================= */}
              {(() => {
                const activeLogic: 'ep' | 'training' | 'milestone' | 'static' =
                  world?.techniqueProgressionLogic ||
                  world?.progressionLogic ||
                  editingItem.progressionLogic ||
                  'ep';

                return (
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                    {/* Progression Form: EP-basiert */}
                    {activeLogic === 'ep' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Gegenstandsstufe / Rang
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-mono font-bold"
                              placeholder="z.B. Stufe 5 (Rang B)"
                              value={editingItem.progressionLevel || ''}
                              onChange={e => setEditingItem({ ...editingItem, progressionLevel: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              EP-Bonus bei Nutzung / Kampf
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-mono"
                              placeholder="z.B. +15% Kampferfahrung"
                              value={editingItem.epBonus || ''}
                              onChange={e => setEditingItem({ ...editingItem, epBonus: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Stufen-Skalierungsfaktor
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                              placeholder="z.B. +1 Angriff je 2 Level"
                              value={editingItem.scalingWithLevel || ''}
                              onChange={e => setEditingItem({ ...editingItem, scalingWithLevel: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Besiegte Feinde bis Aufstieg
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-mono"
                              placeholder="z.B. 0 / 25 Feinde"
                              value={editingItem.killRequirement || ''}
                              onChange={e => setEditingItem({ ...editingItem, killRequirement: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progression Form: Training & Übung */}
                    {activeLogic === 'training' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Übungs- &amp; Trainings-Multiplikator
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-mono font-bold"
                              placeholder="z.B. x1.5 Trainings-Effizienz"
                              value={editingItem.trainingProficiencyBonus || ''}
                              onChange={e => setEditingItem({ ...editingItem, trainingProficiencyBonus: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Meisterschaftsgrad des Gegenstands
                            </label>
                            <select
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer"
                              value={editingItem.masteryRank || 'Novize'}
                              onChange={e => setEditingItem({ ...editingItem, masteryRank: e.target.value })}
                            >
                              <option value="Novize">Novize (Grundlagen)</option>
                              <option value="Geselle">Geselle (Fortgeschritten)</option>
                              <option value="Experte">Experte (Gekonnt)</option>
                              <option value="Meister">Meister (Perfektioniert)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Übungsanwendungen zur Vollendung
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-mono"
                              placeholder="z.B. 12 / 100 Übungseinheiten"
                              value={editingItem.practiceUsageCount || ''}
                              onChange={e => setEditingItem({ ...editingItem, practiceUsageCount: e.target.value })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                            Übungsanleitung &amp; Technik-Fokus
                          </label>
                          <AutoExpandingTextarea
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[40px] outline-none focus:border-amber-500"
                            placeholder="z.B. Verbessert bei regelmäßigen Hiebe-Übungen die Balance und Pariergeschwindigkeit..."
                            value={editingItem.trainingNotes || ''}
                            onChange={e => setEditingItem({ ...editingItem, trainingNotes: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {/* Progression Form: Story-Meilensteine */}
                    {activeLogic === 'milestone' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Freischalt-Meilenstein / Quest
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-bold"
                              placeholder="z.B. Nach Sieg über den Boss in Kapitel 2"
                              value={editingItem.milestoneUnlockReq || ''}
                              onChange={e => setEditingItem({ ...editingItem, milestoneUnlockReq: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Erweckungs- &amp; Siegelstufen
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                              placeholder="z.B. Stufe 1 (Versiegelt) -> Stufe 2 (Erwacht)"
                              value={editingItem.awakeningStages || ''}
                              onChange={e => setEditingItem({ ...editingItem, awakeningStages: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Erforderlicher Titel / Fraktionsrang
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                              placeholder="z.B. Ritter des Ordens, Gildenrang 3"
                              value={editingItem.reputationOrTitle || ''}
                              onChange={e => setEditingItem({ ...editingItem, reputationOrTitle: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Progression Form: Statisch */}
                    {activeLogic === 'static' && (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Talentpunkte-Kosten zum Führen
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 font-mono font-bold"
                              placeholder="z.B. 2 Talentpunkte"
                              value={editingItem.staticTalentCost || ''}
                              onChange={e => setEditingItem({ ...editingItem, staticTalentCost: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-400 block mb-1 uppercase font-bold">
                              Feste Attributs-Mindestgrenzen
                            </label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500"
                              placeholder="z.B. Exakt 16 Stärke erforderlich"
                              value={editingItem.staticRequirements || ''}
                              onChange={e => setEditingItem({ ...editingItem, staticRequirements: e.target.value })}
                            />
                          </div>

                          <div className="flex flex-col justify-end">
                            <label className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer text-xs select-none">
                              <input
                                type="checkbox"
                                checked={editingItem.isFixedStats !== false}
                                onChange={e => setEditingItem({ ...editingItem, isFixedStats: e.target.checked })}
                                className="accent-amber-500 rounded"
                              />
                              <span className="text-slate-300 font-medium text-[11px]">Feste Wertegrenze (Kein Eigen-Wachstum)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Description & Origin */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Beschreibung &amp; Aussehen
                </label>
                <AutoExpandingTextarea
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[60px] outline-none focus:border-amber-500"
                  placeholder="Detaillierte Beschreibung des Gegenstands, Form, Materialbeschaffenheit, Verzierungen..."
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Herkunft, Schöpfer &amp; Lore
                  </label>
                  <AutoExpandingTextarea
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[45px] outline-none focus:border-amber-500"
                    placeholder="z.B. Geschmiedet vom Meisterschmied in den Tiefen des Gebirges..."
                    value={editingItem.originHistory || ''}
                    onChange={e => setEditingItem({ ...editingItem, originHistory: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Nutzungsbedingungen / Anforderungen
                  </label>
                  <AutoExpandingTextarea
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs min-h-[45px] outline-none focus:border-amber-500"
                    placeholder="z.B. Benötigt Waffenbeherrschung Stufe 2 oder Stärke 14..."
                    value={editingItem.requirements || ''}
                    onChange={e => setEditingItem({ ...editingItem, requirements: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {onUpdateLore && (
                  <button
                    type="button"
                    onClick={() => handleSyncItemToCodex(editingItem)}
                    disabled={!editingItem.name.trim()}
                    className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-scroll text-[10px]"></i>
                    <span>Im Gegenstands-Codex speichern</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSaveItem}
                  disabled={!editingItem.name.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-check"></i>
                  <span>Gegenstand Speichern</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CODEX-GEGENSTÄNDE PICKER */}
      {isCodexPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl p-5 md:p-6 shadow-2xl my-auto space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-sm">
                  <i className="fa-solid fa-scroll"></i>
                </span>
                <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-100">
                    Codex-Gegenstände verwalten &amp; auswählen
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Wähle vorhandene Gegenstände aus dem Welt-Codex aus, um sie dem Charakter-Inventar hinzuzufügen oder wieder zu entfernen.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCodexPickerOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Filter controls */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Search */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Suchbegriff
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                      placeholder="Name, Beschreibung, Besitzer oder Kategorie eingeben..."
                      value={codexSearchQuery}
                      onChange={e => setCodexSearchQuery(e.target.value)}
                    />
                    <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-2.5 text-slate-500 text-xs"></i>
                  </div>
                </div>

                {/* Filter mode */}
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Besitzer-Filter
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                    value={codexFilterMode}
                    onChange={e => setCodexFilterMode(e.target.value as any)}
                  >
                    <option value="all">Alle Codex-Gegenstände ({allCodexGegenstaende.length})</option>
                    {characterName && (
                      <option value="char">Nur für {characterName} ({codexItemsForChar.length})</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Item Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
              {displayedCodexItems.map((item, itemIdx) => {
                const status = checkInInventory(item.title, item.id);
                return (
                  <div
                    key={`codex-grid-item-${item.id || item.title || 'item'}-${itemIdx}`}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      status.inInventory
                        ? 'bg-slate-950/90 border-emerald-500/30 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-100">{item.title}</span>
                        {status.inInventory ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold shrink-0 flex items-center gap-1">
                            <i className="fa-solid fa-check text-[9px]"></i>
                            <span>{status.locationLabel}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-medium shrink-0">
                            Nicht im Inventar
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                        <span className="text-amber-400/90 font-medium">{item.details?.mainCategory || item.details?.itemType || 'Gegenstand'}</span>
                        {item.details?.rarity && <span>• {item.details.rarity}</span>}
                        {item.details?.owner && <span className="text-slate-400 font-mono">• Besitzer: {item.details.owner}</span>}
                        {item.details?.pricePerUnit && <span>• Wert: {item.details.pricePerUnit} Münzen</span>}
                      </div>

                      {item.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 italic">
                          "{item.description}"
                        </p>
                      )}

                      {item.details?.specialProperties && (
                        <div className="text-[10px] text-amber-300/90 bg-amber-950/20 border border-amber-900/30 rounded p-1.5">
                          Eigenschaften: {item.details.specialProperties}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-2.5 mt-1">
                      {status.inInventory ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveCodexItemFromInventory(item.title, item.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                          <span>Aus Inventar löschen</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddCodexItemToInventory(item)}
                          className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <i className="fa-solid fa-plus"></i>
                          <span>Ins Inventar übernehmen</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {displayedCodexItems.length === 0 && (
                <div className="col-span-full p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-1">
                  <i className="fa-solid fa-scroll text-slate-600 text-2xl mb-1"></i>
                  <span className="text-xs text-slate-400 block font-medium">
                    Keine passenden Codex-Gegenstände gefunden.
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Passe deine Suchbegriffe an oder erstelle neue Gegenstände im Welten-Codex.
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400">
                Gegenstände im Codex: <strong>{allCodexGegenstaende.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsCodexPickerOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Fertig / Schließen
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterInventorySection;
