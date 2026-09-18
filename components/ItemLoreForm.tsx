// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import {
  LoreEntry,
  WorldSetting,
  EconomyHolding,
  EconomyResource,
  MonsterLootItem
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import {
  ITEM_BUILDER_TYPES,
  ItemBuilderType,
  ITEM_USE_DOMAINS,
  ITEM_ORIGIN_TYPES,
  getBuilderTypeForCategory,
  STANDARD_UNITS,
  RARITY_LEVELS,
  ITEM_CONDITION_OPTIONS,
  TYPICAL_PRODUCING_HOLDING_TYPES,
  CRAFTING_PROFESSIONS,
  ItemMainCategory
} from '../lib/itemCategoriesData';
import {
  Sparkles,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Package,
  Layers,
  Hammer,
  Coins,
  Shield,
  Pickaxe,
  Sword,
  Apple,
  Shirt,
  Home,
  Dog,
  Car,
  Wand2,
  TrendingUp,
  Skull,
  Scroll,
  TreePine,
  Compass,
  ArrowRight,
  Database,
  Crosshair,
  Factory,
  Globe,
  Briefcase,
  Check,
  Plus,
  Minus,
  Sliders,
  Award,
  Zap,
  Activity,
  Target,
  Lock,
  ShieldCheck,
  Dumbbell,
  BookOpen
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { ALL_WEAPONS, WEAPON_CATEGORIES } from '../lib/weaponTypesData';
import {
  EP_DEFAULT_PARAMETERS,
  EP_DEFAULT_STAT_ALLOCATIONS,
  EP_DEFAULT_COST_RESOURCES
} from '../lib/progressionDefaults';

export interface ItemLoreFormProps {
  editForm: Partial<LoreEntry>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<LoreEntry>>>;
  isEditing: string | null;
  setIsEditing: (id: string | null) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  lore: LoreEntry[];
  onUpdateLore?: (newLore: LoreEntry[]) => void;
  worldTitle?: string;
  isNsfw?: boolean;
  world?: WorldSetting;
}

export const ItemLoreForm: React.FC<ItemLoreFormProps> = ({
  editForm,
  setEditForm,
  isEditing,
  setIsEditing,
  onSave,
  onDelete,
  onCancel,
  lore,
  onUpdateLore,
  world
}) => {
  // Smart Fill state
  const [smartFillInput, setSmartFillInput] = useState('');
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [smartFillError, setSmartFillError] = useState<string | null>(null);
  const [appendMode, setAppendMode] = useState(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Codex collections
  const monsterEntries = lore.filter(l => l.category === 'Gegner');
  const locationEntries = lore.filter(l => l.category === 'Orte');
  const availableHoldings: EconomyHolding[] = world?.economyConfig?.holdings || [];

  // Active Builder Type resolution
  const currentCategoryStr = editForm.details?.mainCategory || editForm.details?.itemType || 'Rohstoffe';
  const activeBuilderType: ItemBuilderType =
    (editForm.details?.builderType as ItemBuilderType) ||
    getBuilderTypeForCategory(currentCategoryStr);

  const builderMeta =
    ITEM_BUILDER_TYPES.find(b => b.type === activeBuilderType) || ITEM_BUILDER_TYPES[0];

  const activeSubCat: string =
    editForm.details?.subCategory ||
    (builderMeta.subcategories.length > 0 ? builderMeta.subcategories[0] : '');

  // Helper to update fields in editForm.details
  const updateDetail = (key: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        [key]: value
      }
    }));
  };

  // Switch builder type (Pillar 1)
  const handleSelectBuilderType = (newType: ItemBuilderType) => {
    const meta = ITEM_BUILDER_TYPES.find(b => b.type === newType) || ITEM_BUILDER_TYPES[0];
    const newSubCat = meta.subcategories.length > 0 ? meta.subcategories[0] : '';
    setEditForm(prev => ({
      ...prev,
      category: 'Gegenstände',
      details: {
        ...(prev.details || {}),
        builderType: newType,
        mainCategory: meta.category,
        subCategory: newSubCat,
        itemType: newType,
        unit: prev.details?.unit || meta.defaultUnit,
        pricePerUnit:
          prev.details?.pricePerUnit !== undefined ? prev.details.pricePerUnit : meta.defaultPrice
      }
    }));
  };

  // Switch subcategory
  const handleSubCategoryChange = (newSub: string) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        subCategory: newSub
      }
    }));
  };

  // Usage Domain Helpers (Pillar 5)
  const activeDomains: string[] = Array.isArray(editForm.details?.useDomains)
    ? editForm.details.useDomains
    : typeof editForm.details?.applicationArea === 'string' && editForm.details.applicationArea
    ? editForm.details.applicationArea.split(',').map((s: string) => s.trim().toLowerCase())
    : ['alltag'];

  const toggleDomain = (domainId: string) => {
    let next: string[];
    if (activeDomains.includes(domainId)) {
      next = activeDomains.filter(d => d !== domainId);
      if (next.length === 0) next = ['alltag'];
    } else {
      next = [...activeDomains, domainId];
    }
    updateDetail('useDomains', next);
    updateDetail('applicationArea', next.join(', '));
  };

  // Origin Type Resolution (Pillar 6)
  const activeOriginType: string =
    editForm.details?.originSourceType ||
    (activeBuilderType === 'Dungeon-Fund'
      ? 'dungeon'
      : activeBuilderType === 'Quest-/Story-Gegenstand'
      ? 'quest'
      : activeBuilderType === 'Rohstoff'
      ? 'natuerliches_vorkommen'
      : 'normal_produziert');

  const handleSelectOriginType = (originId: string) => {
    updateDetail('originSourceType', originId);
  };

  // Progression Logic State & Resolution (Pillar 6)
  const worldProgressionLogic: 'ep' | 'training' | 'milestone' | 'static' =
    world?.techniqueProgressionLogic || 'ep';
  const worldProgressionRate: string = world?.techniqueProgressionRate || 'normal';

  const isProgressionOverride = Boolean(editForm.details?.overrideProgressionLogic);
  const activeProgressionLogic: 'ep' | 'training' | 'milestone' | 'static' =
    isProgressionOverride && editForm.details?.progressionLogic
      ? editForm.details.progressionLogic
      : worldProgressionLogic;

  const defaultProgressionTypes: ItemBuilderType[] = [
    'Waffe',
    'Rüstung',
    'Werkzeug',
    'Magischer Gegenstand',
    'Tier',
    'Transportmittel'
  ];
  const hasProgression: boolean =
    editForm.details?.hasProgression !== undefined
      ? Boolean(editForm.details.hasProgression)
      : defaultProgressionTypes.includes(activeBuilderType);

  const availablePowerParameters = React.useMemo(() => {
    if (world?.campaignPowerSettings && Object.keys(world.campaignPowerSettings).length > 0) {
      return Object.keys(world.campaignPowerSettings);
    }
    return Object.keys(EP_DEFAULT_PARAMETERS);
  }, [world?.campaignPowerSettings]);

  const availableStatAllocations = React.useMemo(() => {
    if (world?.customStatAllocations && world.customStatAllocations.length > 0) {
      return world.customStatAllocations;
    }
    return EP_DEFAULT_STAT_ALLOCATIONS;
  }, [world?.customStatAllocations]);

  const availableCostResources = React.useMemo(() => {
    if (world?.costResources && world.costResources.length > 0) {
      return world.costResources;
    }
    return EP_DEFAULT_COST_RESOURCES;
  }, [world?.costResources]);

  // Standard Weapon Catalog Auto-fill
  const handleSelectStandardWeapon = (weaponName: string) => {
    const found = ALL_WEAPONS.find(
      w => w.name.toLowerCase() === weaponName.trim().toLowerCase()
    );
    if (!found) return;
    updateDetail('weaponType', found.name);
    updateDetail('damageType', found.damageTypes.join(', '));
    updateDetail('rangeCategory', `${found.rangeCategory} (${found.wieldingStyles.join('/')})`);
    if (!editForm.details?.effects) {
      updateDetail('effects', `Manöver: ${found.maneuvers.join(', ')}`);
    }
    updateDetail('requiredWeaponMasteryName', found.name);
    updateDetail('requiredWeaponMasteryId', found.id);
  };

  // EP Interactive Helpers
  const currentLevel =
    parseInt(String(editForm.details?.progressionLevel || '1').replace(/\D/g, ''), 10) || 1;
  const currentXp = Number(editForm.details?.currentXp) || 0;
  const xpToNextLevel = Number(editForm.details?.xpToNextLevel) || 100;
  const xpPercent = Math.min(
    100,
    Math.max(0, Math.round((currentXp / Math.max(1, xpToNextLevel)) * 100))
  );

  const handleAddXp = (amount: number) => {
    let nextXp = currentXp + amount;
    let nextLevel = currentLevel;
    if (nextXp >= xpToNextLevel) {
      nextXp = nextXp - xpToNextLevel;
      nextLevel += 1;
    }
    updateDetail('currentXp', Math.max(0, nextXp));
    updateDetail('progressionLevel', `Stufe ${nextLevel}`);
  };

  const handleLevelUp = () => {
    updateDetail('progressionLevel', `Stufe ${currentLevel + 1}`);
    updateDetail('currentXp', 0);
  };

  const handleResetXp = () => {
    updateDetail('currentXp', 0);
  };

  // Training Segments Helper
  const trainingUnits = Number(editForm.details?.trainingUnits) || 0;
  const handleSetTrainingUnits = (units: number) => {
    const newUnits = trainingUnits === units ? 0 : units;
    updateDetail('trainingUnits', newUnits);
    updateDetail('practiceUsageCount', `${newUnits} / 4 Einheiten`);
  };

  // Icon Resolver for 14 Types
  const getTypeIcon = (type: ItemBuilderType) => {
    switch (type) {
      case 'Rohstoff':
        return <Pickaxe className="w-4 h-4 shrink-0" />;
      case 'Material':
        return <Layers className="w-4 h-4 shrink-0" />;
      case 'Werkzeug':
        return <Hammer className="w-4 h-4 shrink-0" />;
      case 'Waffe':
        return <Sword className="w-4 h-4 shrink-0" />;
      case 'Rüstung':
        return <Shield className="w-4 h-4 shrink-0" />;
      case 'Nahrung':
        return <Apple className="w-4 h-4 shrink-0" />;
      case 'Kleidung':
        return <Shirt className="w-4 h-4 shrink-0" />;
      case 'Alltagsgegenstand':
        return <Home className="w-4 h-4 shrink-0" />;
      case 'Tier':
        return <Dog className="w-4 h-4 shrink-0" />;
      case 'Transportmittel':
        return <Car className="w-4 h-4 shrink-0" />;
      case 'Magischer Gegenstand':
        return <Wand2 className="w-4 h-4 shrink-0" />;
      case 'Handelsware':
        return <TrendingUp className="w-4 h-4 shrink-0" />;
      case 'Dungeon-Fund':
        return <Skull className="w-4 h-4 shrink-0" />;
      case 'Quest-/Story-Gegenstand':
        return <Scroll className="w-4 h-4 shrink-0" />;
      default:
        return <Package className="w-4 h-4 shrink-0" />;
    }
  };

  // Economy Sync Handlers
  const handleSyncToEconomyHolding = (holdingId?: string) => {
    const targetHoldingId = holdingId || editForm.details?.producingHoldingId;
    if (!targetHoldingId || !world?.economyConfig) {
      setSyncNotice('Bitte wähle zuerst einen Betriebsstandort aus.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const holding = availableHoldings.find(h => h.id === targetHoldingId);
    if (!holding) {
      setSyncNotice('Betrieb nicht gefunden.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const itemName = editForm.title?.trim() || 'Neuer Gegenstand';
    const amount = Number(editForm.details?.stockAmount) || 10;
    const maxCapacity = Number(editForm.details?.maxCapacity) || 100;
    const unit = editForm.details?.unit || builderMeta.defaultUnit || 'Stück';
    const pricePerUnit =
      Number(editForm.details?.pricePerUnit) || builderMeta.defaultPrice || 10;
    const condition = editForm.details?.condition || 'gut';

    const existingResources = holding.resources || [];
    const existingIdx = existingResources.findIndex(
      r => r.name.toLowerCase() === itemName.toLowerCase()
    );
    let updatedResources: EconomyResource[];
    if (existingIdx >= 0) {
      updatedResources = existingResources.map((r, i) =>
        i === existingIdx
          ? {
              ...r,
              amount,
              maxCapacity,
              unit,
              pricePerUnit,
              condition,
              category: 'goods',
              notes: editForm.description || r.notes
            }
          : r
      );
    } else {
      const newRes: EconomyResource = {
        id: `res-${holding.id}-${Date.now()}`,
        name: itemName,
        category: 'goods',
        amount,
        maxCapacity,
        unit,
        pricePerUnit,
        condition,
        notes: editForm.description || ''
      };
      updatedResources = [...existingResources, newRes];
    }
    holding.resources = updatedResources;
    updateDetail('producingHoldingName', holding.name);
    setSyncNotice(
      `Im Betriebsinventar von "${holding.name}" hinterlegt (${amount} ${unit}).`
    );
    setTimeout(() => setSyncNotice(null), 5000);
  };

  const handleSyncToMonsterCodex = () => {
    if (!onUpdateLore) {
      setSyncNotice('Keine Aktualisierungsfunktion verfügbar.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const monsterTarget =
      editForm.details?.droppedByMonsterName || editForm.details?.chainMonsterOrigin;
    if (!monsterTarget) {
      setSyncNotice('Bitte wähle zuerst ein Monster aus oder gib einen Monsternamen ein.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const targetMonster = monsterEntries.find(
      m =>
        m.id === editForm.details?.droppedByMonsterId ||
        m.title?.toLowerCase() === monsterTarget.toLowerCase()
    );
    const itemName = editForm.title?.trim() || 'Gegenstand';
    if (targetMonster) {
      const existingLoot: MonsterLootItem[] = targetMonster.details?.lootTable || [];
      const isAlreadyIn = existingLoot.some(
        l => l.itemName.toLowerCase() === itemName.toLowerCase()
      );

      const newLootEntry: MonsterLootItem = {
        id: `loot-${Date.now()}`,
        itemName,
        itemId: editForm.id || `item-${Date.now()}`,
        category: builderMeta.category,
        dropChance:
          typeof editForm.details?.dropChance === 'number'
            ? editForm.details.dropChance
            : parseInt(String(editForm.details?.dropChance || '50'), 10) || 50,
        isGuaranteed:
          editForm.details?.lootType === 'Standardbeute' ||
          String(editForm.details?.dropChance).includes('100'),
        minQuantity: 1,
        maxQuantity:
          parseInt(String(editForm.details?.dropQuantityRange || '1').split('-').pop() || '1', 10) ||
          1,
        unit: editForm.details?.unit || 'Stück',
        harvestCondition: editForm.details?.dropConditions || '',
        partType: (editForm.details?.harvestedBodyPart as any) || 'Sonstiges',
        notes: `Ausbeute: ${editForm.details?.harvestedBodyPart || 'Körperteil'}`
      };

      const updatedLoot = isAlreadyIn
        ? existingLoot.map(l =>
            l.itemName.toLowerCase() === itemName.toLowerCase() ? { ...l, ...newLootEntry } : l
          )
        : [...existingLoot, newLootEntry];

      const updatedLore = lore.map(l =>
        l.id === targetMonster.id
          ? {
              ...l,
              details: {
                ...(l.details || {}),
                lootTable: updatedLoot,
                guaranteedDrops:
                  updatedLoot
                    .filter(x => x.isGuaranteed)
                    .map(x => x.itemName)
                    .join(', ') || l.details?.guaranteedDrops,
                rareDrops:
                  updatedLoot
                    .filter(x => !x.isGuaranteed)
                    .map(x => `${x.itemName} (${x.dropChance}%)`)
                    .join(', ') || l.details?.rareDrops
              }
            }
          : l
      );

      onUpdateLore(updatedLore);
      updateDetail('droppedByMonsterId', targetMonster.id);
      updateDetail('droppedByMonsterName', targetMonster.title);
      setSyncNotice(
        `"${itemName}" erfolgreich im Monster-Codex bei "${targetMonster.title}" hinterlegt.`
      );
      setTimeout(() => setSyncNotice(null), 5000);
    } else {
      setSyncNotice(
        `Monster "${monsterTarget}" wurde nicht im Codex gefunden. Bitte zuerst im Monster-Codex anlegen.`
      );
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  const handleSyncToDungeonCodex = () => {
    if (!onUpdateLore) {
      setSyncNotice('Keine Aktualisierungsfunktion verfügbar.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const dungeonTarget =
      editForm.details?.dungeonLocationName || editForm.details?.chainDungeonOrigin;
    if (!dungeonTarget) {
      setSyncNotice('Bitte wähle zuerst einen Dungeon oder Ort aus.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const targetDungeon = locationEntries.find(
      loc =>
        loc.id === editForm.details?.dungeonLocationId ||
        loc.title?.toLowerCase() === dungeonTarget.toLowerCase()
    );
    const itemName = editForm.title?.trim() || 'Gegenstand';
    if (targetDungeon) {
      const existingResources = targetDungeon.details?.economicFocus || '';
      const newFocus = existingResources
        ? existingResources.includes(itemName)
          ? existingResources
          : `${existingResources}, ${itemName}`
        : itemName;

      const updatedLore = lore.map(l =>
        l.id === targetDungeon.id
          ? {
              ...l,
              details: {
                ...(l.details || {}),
                economicFocus: newFocus,
                landmarks: l.details?.landmarks
                  ? l.details.landmarks.includes(itemName)
                    ? l.details.landmarks
                    : `${l.details.landmarks}; Vorkommen: ${itemName} (${editForm.details?.dungeonFloorLevel || 'Ebene 1'})`
                  : `Vorkommen: ${itemName}`
              }
            }
          : l
      );

      onUpdateLore(updatedLore);
      updateDetail('dungeonLocationId', targetDungeon.id);
      updateDetail('dungeonLocationName', targetDungeon.title);
      setSyncNotice(
        `"${itemName}" erfolgreich im Orts-/Dungeon-Codex bei "${targetDungeon.title}" hinterlegt.`
      );
      setTimeout(() => setSyncNotice(null), 5000);
    } else {
      setSyncNotice(
        `Ort/Dungeon "${dungeonTarget}" wurde nicht im Codex gefunden. Bitte zuerst im Orts-Codex anlegen.`
      );
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  // AI Smart Fill
  const handleSmartFill = async () => {
    if (!smartFillInput.trim()) return;
    setIsSmartFilling(true);
    setSmartFillError(null);
    try {
      const existingItems = lore
        .filter(l => l.category === 'Gegenstände')
        .map(l => l.title)
        .filter(Boolean);

      const result = await GeminiService.autofillLoreEntry(
        smartFillInput,
        'Gegenstände',
        undefined,
        undefined,
        existingItems,
        appendMode ? editForm : { title: editForm.title, category: 'Gegenstände' },
        world,
        undefined,
        lore
      );

      if (result) {
        setEditForm(prev => {
          const mergedDetails = { ...(prev.details || {}), ...(result.details || {}) };
          const resolvedBuilder = getBuilderTypeForCategory(
            mergedDetails.mainCategory || mergedDetails.itemType
          );
          mergedDetails.builderType = resolvedBuilder;
          return {
            ...prev,
            title:
              appendMode && prev.title
                ? prev.title
                : result.title || prev.title || smartFillInput.slice(0, 30),
            description:
              appendMode && prev.description && result.description
                ? `${prev.description}\n\n${result.description}`
                : result.description || prev.description,
            secretsStage1: result.secretsStage1 || prev.secretsStage1,
            secretsStage2: result.secretsStage2 || prev.secretsStage2,
            secretsStage3: result.secretsStage3 || prev.secretsStage3,
            details: mergedDetails
          };
        });
        setSmartFillInput('');
      }
    } catch (err: any) {
      console.error('Smart Fill failed:', err);
      setSmartFillError(err.message || 'Fehler beim automatischen Ausfüllen.');
    } finally {
      setIsSmartFilling(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-200 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              {isEditing ? 'Gegenstand bearbeiten' : 'Neuer Gegenstand'}
            </h2>
            <p className="text-xs text-slate-400">
              Strukturierter Gegenstands-Builder für persistente Gegenstände, Handwerk, Wirtschaft und Abenteuer.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={() => onDelete(editForm.id || '')}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Löschen
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-950/40 transition"
          >
            <Save className="w-3.5 h-3.5" />
            Speichern
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncNotice && (
        <div className="bg-emerald-950/60 border border-emerald-700/60 rounded-xl p-3 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Smart Fill Box */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-semibold text-slate-200">
              Gegenstand automatisch beschreiben & befüllen
            </span>
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={appendMode}
              onChange={e => setAppendMode(e.target.checked)}
              className="rounded border-slate-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            Bestehende Daten ergänzen
          </label>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={smartFillInput}
            onChange={e => setSmartFillInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSmartFill();
              }
            }}
            placeholder="Kurze Idee oder Notiz eingeben (z. B. 'Zwergischer Runenhammer, geschmiedet aus Sternenerz, verleiht Blitzschaden')..."
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            disabled={isSmartFilling || !smartFillInput.trim()}
            onClick={handleSmartFill}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition shrink-0"
          >
            {isSmartFilling ? (
              <span className="animate-spin text-xs">...</span>
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Ausfüllen
          </button>
        </div>
        {smartFillError && (
          <div className="text-[11px] text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {smartFillError}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. WAS IST ES? */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              1. Was ist es?
            </span>
            <span className="text-[11px] text-slate-400">
              (Auswahl der Gegenstandsart)
            </span>
          </div>
          <span className="text-[11px] text-indigo-400 font-medium">
            Aktiver Typ: {activeBuilderType}
          </span>
        </div>

        {/* 14 Types Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {ITEM_BUILDER_TYPES.map(item => {
            const isSelected = item.type === activeBuilderType;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => handleSelectBuilderType(item.type)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-slate-800 text-slate-100 border-indigo-500 shadow-md'
                    : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {getTypeIcon(item.type)}
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  )}
                </div>
                <div className="mt-1">
                  <div className="text-xs font-semibold leading-tight text-slate-200">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Subcategories */}
        {builderMeta.subcategories.length > 0 && (
          <div className="mt-1 bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-300">
              Feinabstimmung / Unterkategorie ({activeBuilderType}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {builderMeta.subcategories.map(sub => {
                const isSubSelected = sub === activeSubCat;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleSubCategoryChange(sub)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
                      isSubSelected
                        ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/80'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. GRUNDDATEN */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            2. Grunddaten
          </span>
          <span className="text-[11px] text-slate-400">
            (Name, Beschreibung, Qualität & Seltenheit)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Name / Bezeichnung des Gegenstands *
            </label>
            <input
              type="text"
              value={editForm.title || ''}
              onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="z. B. Damast-Langschwert, Eisenbarren, Heilkraut, Reitpferd..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Mengeneinheit & Zustand */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Mengeneinheit</label>
              <select
                value={editForm.details?.unit || builderMeta.defaultUnit}
                onChange={e => updateDetail('unit', e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {STANDARD_UNITS.map(u => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Zustand</label>
              <select
                value={editForm.details?.condition || 'gut'}
                onChange={e => updateDetail('condition', e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {ITEM_CONDITION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Beschreibung */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-300">
            Hauptbeschreibung & Beschaffenheit
          </label>
          <AutoExpandingTextarea
            minRows={3}
            value={editForm.description || ''}
            onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Detaillierte Beschreibung des Gegenstands, Aussehen, Textur, Geruch, Formgebung, Besonderheiten..."
            className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Qualität & Seltenheit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Qualität</label>
            <select
              value={editForm.details?.materialQuality || 'Gewöhnlich / Standard'}
              onChange={e => updateDetail('materialQuality', e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Minderwertig / Roh">Minderwertig / Roh</option>
              <option value="Gewöhnlich / Standard">Gewöhnlich / Standard</option>
              <option value="Solide / Gehoben">Solide / Gehoben</option>
              <option value="Meisterhaft / Veredelt">Meisterhaft / Veredelt</option>
              <option value="Perfekt / Makellos">Perfekt / Makellos</option>
              <option value="Uralt / Verwittert">Uralt / Verwittert</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Seltenheit</label>
            <select
              value={editForm.details?.rarity || 'Gewöhnlich / Alltäglich'}
              onChange={e => updateDetail('rarity', e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {RARITY_LEVELS.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Einzigartigkeit</label>
            <select
              value={editForm.details?.isUnique ? 'true' : 'false'}
              onChange={e => updateDetail('isUnique', e.target.value === 'true')}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="false">Massenware / Standardartikel</option>
              <option value="true">Unikat / Einzelstück / Legendär</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. EIGENSCHAFTEN (dynamisch passend zum Typ eingeblendet) */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              3. Eigenschaften
            </span>
            <span className="text-[11px] text-slate-400">
              (Spezifische Parameter für: <span className="text-slate-200 font-semibold">{activeBuilderType}</span>)
            </span>
          </div>
        </div>

        {/* --- Typ 1: Rohstoff --- */}
        {activeBuilderType === 'Rohstoff' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Rohstoff-Gattung</label>
                <input
                  type="text"
                  value={editForm.details?.baseRawMaterial || ''}
                  onChange={e => updateDetail('baseRawMaterial', e.target.value)}
                  placeholder="z. B. Eisenerz, Eichenholz, Obsidian, Granit, Alraune..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Reinheitsgrad / Dichte</label>
                <input
                  type="text"
                  value={editForm.details?.purity || ''}
                  onChange={e => updateDetail('purity', e.target.value)}
                  placeholder="z. B. 92% Reinerz, Rohform, Konzentriert..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Vorkommen / Ergiebigkeit</label>
                <input
                  type="text"
                  value={editForm.details?.abundance || ''}
                  onChange={e => updateDetail('abundance', e.target.value)}
                  placeholder="z. B. Reichhaltig, Mäßig, Tiefes Bergwerk, Seltene Ader..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Physikalische & Spezifische Eigenschaften
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.specialProperties || ''}
                onChange={e => updateDetail('specialProperties', e.target.value)}
                placeholder="Härte nach Mohs, Schmelzpunkt, Entflammbarkeit, Toxizität, Magieleitfähigkeit, Zähigkeit..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 2: Material --- */}
        {activeBuilderType === 'Material' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Materialklasse</label>
                <input
                  type="text"
                  value={editForm.details?.fabricType || ''}
                  onChange={e => updateDetail('fabricType', e.target.value)}
                  placeholder="z. B. Barren, Gehärteter Stahl, Leder, Schnittholz, Seidentuch..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Veredelungsgrad</label>
                <input
                  type="text"
                  value={editForm.details?.refinementGrade || ''}
                  onChange={e => updateDetail('refinementGrade', e.target.value)}
                  placeholder="z. B. Rohling, Halbzeug, Gehärtet, Poliert, Gebleicht..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Haltbarkeit & Belastbarkeit</label>
                <input
                  type="text"
                  value={editForm.details?.durability || ''}
                  onChange={e => updateDetail('durability', e.target.value)}
                  placeholder="z. B. Extrem zäh, Bruchsicher, Witterungsbeständig..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Materialeigenschaften & Verarbeitungs-Besonderheiten
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.specialProperties || ''}
                onChange={e => updateDetail('specialProperties', e.target.value)}
                placeholder="Rostbeständigkeit, Elastizität, Wärmeleitung, Magie-Affinität, Schnittfestigkeit..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 3: Werkzeug --- */}
        {activeBuilderType === 'Werkzeug' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Handwerksbereich</label>
                <input
                  type="text"
                  value={editForm.details?.craftProfession || ''}
                  onChange={e => updateDetail('craftProfession', e.target.value)}
                  placeholder="z. B. Schmiedekunst, Schreinerei, Bergbau, Heilkunde, Kochen..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Effizienz- / Qualitätsbonus</label>
                <input
                  type="text"
                  value={editForm.details?.efficiencyBonus || ''}
                  onChange={e => updateDetail('efficiencyBonus', e.target.value)}
                  placeholder="z. B. +2 auf Schmiedearbeiten, 20% Zeitersparnis beim Abbau..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Verschleiß & Haltbarkeit</label>
                <input
                  type="text"
                  value={editForm.details?.durability || ''}
                  onChange={e => updateDetail('durability', e.target.value)}
                  placeholder="z. B. 150 Verwendungen, Gehärtete Klinge, Kaum Abnutzung..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Spezielle Handhabung & Anforderungen
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.specialProperties || ''}
                onChange={e => updateDetail('specialProperties', e.target.value)}
                placeholder="Erforderliche Vorbildung, Zweihändige Führung, Spezielle Pflege oder Ölung notwendig..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 4: Waffe --- */}
        {activeBuilderType === 'Waffe' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Waffengattung</label>
                  <span className="text-[10px] text-indigo-400">Waffenkatalog aktiv</span>
                </div>
                <input
                  type="text"
                  list="all-weapons-catalog"
                  value={editForm.details?.weaponType || ''}
                  onChange={e => {
                    const val = e.target.value;
                    updateDetail('weaponType', val);
                    handleSelectStandardWeapon(val);
                  }}
                  placeholder="z. B. Langschwert, Kriegshammer, Kompositbogen..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <datalist id="all-weapons-catalog">
                  {ALL_WEAPONS.map(w => (
                    <option key={w.id} value={w.name}>
                      {w.categoryName} ({w.rangeCategory})
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Schadensart</label>
                <input
                  type="text"
                  value={editForm.details?.damageType || ''}
                  onChange={e => updateDetail('damageType', e.target.value)}
                  placeholder="z. B. Hieb, Stich, Wucht, Magisch, Feuer, Frost..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Schadenshöhe / Kampfwert</label>
                <input
                  type="text"
                  value={editForm.details?.damageValue || ''}
                  onChange={e => updateDetail('damageValue', e.target.value)}
                  placeholder="z. B. 1W8+2, 14-20 Schaden, Krit x2..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Reichweite & Handhabung</label>
                <input
                  type="text"
                  value={editForm.details?.rangeCategory || ''}
                  onChange={e => updateDetail('rangeCategory', e.target.value)}
                  placeholder="z. B. Nahkampf (1m), Stangenwaffe (2m), Fernkampf (50m), Einhändig / Zweihändig..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Spezielle Kampf-Effekte & Eigenschaften
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.effects || ''}
                onChange={e => updateDetail('effects', e.target.value)}
                placeholder="Rüstungsdurchdringung, Paradebonus, Blutungswirkung, Verzauberung, Gegnergruppen-Schlag..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 5: Rüstung --- */}
        {activeBuilderType === 'Rüstung' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Rüstungsplatz (Slot)</label>
                <input
                  type="text"
                  value={editForm.details?.armorSlot || ''}
                  onChange={e => updateDetail('armorSlot', e.target.value)}
                  placeholder="z. B. Kopf / Helm, Brust / Kürass, Schild, Beine, Handschuhe, Ganzkörper..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Rüstungsklasse / Typ</label>
                <input
                  type="text"
                  value={editForm.details?.clothingSlot || ''}
                  onChange={e => updateDetail('clothingSlot', e.target.value)}
                  placeholder="z. B. Lederharnisch, Kette, Schuppenpanzer, Vollplatte, Robe..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Schutzwert / Rüstungswert</label>
                <input
                  type="text"
                  value={editForm.details?.armorValue || ''}
                  onChange={e => updateDetail('armorValue', e.target.value)}
                  placeholder="z. B. RK +4, 25% Schadensabsorption, 8 Rüstungspunkte..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Traglast & Bewegungsmalus</label>
                <input
                  type="text"
                  value={editForm.details?.encumbrance || ''}
                  onChange={e => updateDetail('encumbrance', e.target.value)}
                  placeholder="z. B. Leicht (kein Malus), Mittelschwer (-1 Bewegung), Schwer (Lärm)..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Resistenzen & Schutz-Besonderheiten
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.resistances || ''}
                onChange={e => updateDetail('resistances', e.target.value)}
                placeholder="Stichschutz, Wuchtpolsterung, Schutz vor Kälte, Feuerresistenz, Pfeilabwehr..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 6: Nahrung --- */}
        {activeBuilderType === 'Nahrung' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Nahrungsart</label>
                <input
                  type="text"
                  value={editForm.details?.foodType || ''}
                  onChange={e => updateDetail('foodType', e.target.value)}
                  placeholder="z. B. Grundnahrungsmittel, Feldration, Frischware, Backware, Getränk..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Sättigung & Nährwert</label>
                <input
                  type="text"
                  value={editForm.details?.nutritionValue || ''}
                  onChange={e => updateDetail('nutritionValue', e.target.value)}
                  placeholder="z. B. 1 Tagesration, Leichte Mahlzeit, Gehaltvoll..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Haltbarkeit & Lagerung</label>
                <input
                  type="text"
                  value={editForm.details?.perishability || ''}
                  onChange={e => updateDetail('perishability', e.target.value)}
                  placeholder="z. B. 3 Tage frisch, 30 Tage Trockenration, Unverderblich..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Wirkung bei Verzehr & Genusseffekte
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.consumptionEffect || ''}
                onChange={e => updateDetail('consumptionEffect', e.target.value)}
                placeholder="Ausdauer-Regeneration, Wärmend, Vitalisierend, Heilwirkung, Stärkung..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 7: Kleidung --- */}
        {activeBuilderType === 'Kleidung' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Kleidungsstück</label>
                <input
                  type="text"
                  value={editForm.details?.clothingSlot || ''}
                  onChange={e => updateDetail('clothingSlot', e.target.value)}
                  placeholder="z. B. Mantel / Umhang, Tunika, Stiefel, Hose, Hut, Handschuhe..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Stoffart & Schnitt</label>
                <input
                  type="text"
                  value={editForm.details?.fabricType || ''}
                  onChange={e => updateDetail('fabricType', e.target.value)}
                  placeholder="z. B. Wolle, Leinen, Seide, Pelzbesatz, Leder, Samt..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Wetterschutz & Isolation</label>
                <input
                  type="text"
                  value={editForm.details?.weatherProtection || ''}
                  onChange={e => updateDetail('weatherProtection', e.target.value)}
                  placeholder="z. B. Kälteschutz, Regendicht, Winddicht, Hitzeschutz..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Sozialer Stand & Repräsentation
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.socialStatus || ''}
                onChange={e => updateDetail('socialStatus', e.target.value)}
                placeholder="Bürgerlich, Arbeitskleidung, Zunftmeistertracht, Adelig, Zeremoniell..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 8: Alltagsgegenstand --- */}
        {activeBuilderType === 'Alltagsgegenstand' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Verwendungszweck</label>
                <input
                  type="text"
                  value={editForm.details?.householdFunction || ''}
                  onChange={e => updateDetail('householdFunction', e.target.value)}
                  placeholder="z. B. Beleuchtung, Aufbewahrung, Körperpflege, Kochen, Schreiben..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Material & Fertigung</label>
                <input
                  type="text"
                  value={editForm.details?.householdMaterial || ''}
                  onChange={e => updateDetail('householdMaterial', e.target.value)}
                  placeholder="z. B. Ton, Holz, Messing, Glas, Schmiedeeisen..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Kapazität & Nutzungsdauer</label>
                <input
                  type="text"
                  value={editForm.details?.maxCapacity || ''}
                  onChange={e => updateDetail('maxCapacity', e.target.value)}
                  placeholder="z. B. 40 Liter Fassungsvermögen, 6 Stunden Brenndauer..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Handhabung, Stapelbarkeit & Besonderheiten
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.specialProperties || ''}
                onChange={e => updateDetail('specialProperties', e.target.value)}
                placeholder="Stapelbar, Wasserfest, Schloss integriert, Leicht zu reinigen..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 9: Tier --- */}
        {activeBuilderType === 'Tier' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Klassifikation</label>
                <select
                  value={editForm.details?.animalTypeClassification || 'species'}
                  onChange={e => updateDetail('animalTypeClassification', e.target.value)}
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="species">Tierart / Rasse (Gattung)</option>
                  <option value="individual">Einzeltier / Individuum</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Verwendungsart</label>
                <input
                  type="text"
                  value={editForm.details?.animalRole || ''}
                  onChange={e => updateDetail('animalRole', e.target.value)}
                  placeholder="z. B. Reittier, Lasttier, Nutztier, Jagdbegleiter, Wachhund..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Tragkraft / Zugkraft</label>
                <input
                  type="text"
                  value={editForm.details?.animalCapacity || ''}
                  onChange={e => updateDetail('animalCapacity', e.target.value)}
                  placeholder="z. B. 120 kg Traglast, Zweispänner-Zugkraft..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Geschwindigkeit & Ausdauer</label>
                <input
                  type="text"
                  value={editForm.details?.speedRange || ''}
                  onChange={e => updateDetail('speedRange', e.target.value)}
                  placeholder="z. B. Schnell, Ausdauernd, Geländegängig..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Futterbedarf, Haltung & Wesen
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.animalPersonality || ''}
                onChange={e => updateDetail('animalPersonality', e.target.value)}
                placeholder="Futterbedarf pro Tag, Stallung, Treue, Zähmung, Temperament..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 10: Transportmittel --- */}
        {activeBuilderType === 'Transportmittel' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Fahrzeugart</label>
                <input
                  type="text"
                  value={editForm.details?.vehicleType || ''}
                  onChange={e => updateDetail('vehicleType', e.target.value)}
                  placeholder="z. B. Planwagen, Kutsche, Handkarren, Segelschiff, Floß..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Ladekapazität & Fracht</label>
                <input
                  type="text"
                  value={editForm.details?.cargoCapacity || ''}
                  onChange={e => updateDetail('cargoCapacity', e.target.value)}
                  placeholder="z. B. 600 kg Fracht, 2 Tonnen Zuladung..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Passagiere & Besatzung</label>
                <input
                  type="text"
                  value={editForm.details?.passengerCapacity || ''}
                  onChange={e => updateDetail('passengerCapacity', e.target.value)}
                  placeholder="z. B. 4 Passagiere, 2 Kutscher/Besatzung..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Antrieb & Reisegeschwindigkeit</label>
                <input
                  type="text"
                  value={editForm.details?.propulsion || ''}
                  onChange={e => updateDetail('propulsion', e.target.value)}
                  placeholder="z. B. 2 Zugpferde, Segel/Wind, Ruder / 35 km/Tag..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Geländetauglichkeit & Zustand
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.maintenanceCondition || ''}
                onChange={e => updateDetail('maintenanceCondition', e.target.value)}
                placeholder="Straßentauglich, Waldwege, Hochsee, Flussbett, Reparaturanfälligkeit..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 11: Magischer Gegenstand --- */}
        {activeBuilderType === 'Magischer Gegenstand' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Magieschule & Ausrichtung</label>
                <input
                  type="text"
                  value={editForm.details?.magicSchool || ''}
                  onChange={e => updateDetail('magicSchool', e.target.value)}
                  placeholder="z. B. Abjuration, Evokation, Nekromantie, Alchemie, Elementar..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Manakosten & Aufladungen</label>
                <input
                  type="text"
                  value={editForm.details?.charges || ''}
                  onChange={e => updateDetail('charges', e.target.value)}
                  placeholder="z. B. 3 Ladungen pro Tag, 15 Mana pro Nutzung, Dauerhaft aktiv..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Aktivierungsvoraussetzung</label>
                <input
                  type="text"
                  value={editForm.details?.activationCost || ''}
                  onChange={e => updateDetail('activationCost', e.target.value)}
                  placeholder="z. B. Seelenbindung, Zauberwort, Reagenz, Kleriker-Klasse..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Magischer Effekt & Zauberwirkung
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.effects || ''}
                onChange={e => updateDetail('effects', e.target.value)}
                placeholder="Genaue Beschreibung der arkanen Wirkung, Verzauberung, Schutzfelder oder Entladungen..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 12: Handelsware --- */}
        {activeBuilderType === 'Handelsware' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Warengruppe</label>
                <input
                  type="text"
                  value={editForm.details?.targetMarket || ''}
                  onChange={e => updateDetail('targetMarket', e.target.value)}
                  placeholder="z. B. Gewürze, Luxusgüter, Salz, Seidentuche, Kolonialwaren..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Handelsspanne & Nachfrage</label>
                <input
                  type="text"
                  value={editForm.details?.demandRegions || ''}
                  onChange={e => updateDetail('demandRegions', e.target.value)}
                  placeholder="z. B. Hohe Nachfrage in Städten, Mangelware im Binnenland..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Transportrisiko & Zölle</label>
                <input
                  type="text"
                  value={editForm.details?.transportRisk || ''}
                  onChange={e => updateDetail('transportRisk', e.target.value)}
                  placeholder="z. B. Feuchtigkeitsempfindlich, Diebstahlrisiko, Wegezollpflicht..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Handelsrouten & Marktbesonderheiten
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.tradeRoute || ''}
                onChange={e => updateDetail('tradeRoute', e.target.value)}
                placeholder="Typische Karawanenrouten, Seehäfen, Zunftmonopole oder Handelslizenzen..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 13: Dungeon-Fund --- */}
        {activeBuilderType === 'Dungeon-Fund' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Fundorttyp</label>
                <input
                  type="text"
                  value={editForm.details?.dungeonSourceType || ''}
                  onChange={e => updateDetail('dungeonSourceType', e.target.value)}
                  placeholder="z. B. Schatztruhe, Bosskammer, Wandkristall, Sarkophag..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Gefahrenstufe / Ebene</label>
                <input
                  type="text"
                  value={editForm.details?.dungeonFloorLevel || ''}
                  onChange={e => updateDetail('dungeonFloorLevel', e.target.value)}
                  placeholder="z. B. Ebene 3, Tiefkrypta, Tödliche Fallenkammer..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Bergungsvoraussetzung</label>
                <input
                  type="text"
                  value={editForm.details?.dungeonAccessCondition || ''}
                  onChange={e => updateDetail('dungeonAccessCondition', e.target.value)}
                  placeholder="z. B. Dietrich Stufe 3, Bergbau-Spitzhacke, Bannzauber..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Relikt-Zustand & Fluch-Status
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.specialProperties || ''}
                onChange={e => updateDetail('specialProperties', e.target.value)}
                placeholder="Uralt verwittert, Arkane Versiegelung, Verfluchtes Relikt, Göttlich geweiht..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* --- Typ 14: Quest-/Story-Gegenstand --- */}
        {activeBuilderType === 'Quest-/Story-Gegenstand' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Rolle in der Handlung</label>
                <input
                  type="text"
                  value={editForm.details?.questContext || ''}
                  onChange={e => updateDetail('questContext', e.target.value)}
                  placeholder="z. B. Schlüssel zum Portal, Beweisstück für den Verrat, Erbstück..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Beständigkeit & Bindung</label>
                <input
                  type="text"
                  value={editForm.details?.specialProperties || ''}
                  onChange={e => updateDetail('specialProperties', e.target.value)}
                  placeholder="z. B. Unzerstörbar, Einweg-Schlüssel, An den Träger gebunden..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Enthülltes Wissen & Quest-Trigger
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.secretsStage1 || ''}
                onChange={e => setEditForm(prev => ({ ...prev, secretsStage1: e.target.value }))}
                placeholder="Welches Wissen, welche Tür oder welches Abenteuer-Ereignis schaltet dieser Gegenstand frei?..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. HERSTELLUNG & WIRTSCHAFT */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            4. Herstellung & Wirtschaft
          </span>
          <span className="text-[11px] text-slate-400">
            (Rohstoffe, Produktionskette, Beruf, Betrieb & Handelswert)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Rohstoffe */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Rohstoffe (Benötigte Ausgangsstoffe & Rezeptur)
            </label>
            <AutoExpandingTextarea
              minRows={2}
              value={editForm.details?.producedFrom || editForm.details?.craftingRecipe || ''}
              onChange={e => {
                updateDetail('producedFrom', e.target.value);
                updateDetail('craftingRecipe', e.target.value);
              }}
              placeholder="z. B. 2x Eisenbarren, 1x Hartholzstiel, 1x Lederband..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Produktionskette */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Produktionskette (Vorstufen & Weiterverarbeitung)
            </label>
            <AutoExpandingTextarea
              minRows={2}
              value={editForm.details?.processedInto || ''}
              onChange={e => updateDetail('processedInto', e.target.value)}
              placeholder="z. B. Eisenerz -> Eisenbarren -> Waffe / Rohleder -> Gegerbtes Leder -> Harnisch..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Beruf */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Beruf (Zuständiger Handwerker)
            </label>
            <input
              type="text"
              list="crafting-professions-list"
              value={editForm.details?.requiredProfession || editForm.details?.craftProfession || ''}
              onChange={e => {
                updateDetail('requiredProfession', e.target.value);
                updateDetail('craftProfession', e.target.value);
              }}
              placeholder="z. B. Schmied (Geselle), Schneider, Brauer, Alchemist..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <datalist id="crafting-professions-list">
              {CRAFTING_PROFESSIONS.map(p => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          {/* Betrieb */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Betrieb (Herstellungsort)
            </label>
            <input
              type="text"
              list="producing-holding-types-list"
              value={editForm.details?.productionHoldingType || ''}
              onChange={e => updateDetail('productionHoldingType', e.target.value)}
              placeholder="z. B. Schmiede, Mühle, Sägewerk, Weberei, Brauerei..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <datalist id="producing-holding-types-list">
              {TYPICAL_PRODUCING_HOLDING_TYPES.map(h => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>

          {/* Handelswert */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Handelswert (Richtpreis / Verkaufswert)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={
                  editForm.details?.pricePerUnit !== undefined
                    ? editForm.details.pricePerUnit
                    : builderMeta.defaultPrice
                }
                onChange={e => updateDetail('pricePerUnit', parseFloat(e.target.value) || 0)}
                placeholder="10"
                className="w-24 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400">
                Kupfer / Einheiten pro {editForm.details?.unit || builderMeta.defaultUnit}
              </span>
            </div>
          </div>
        </div>

        {/* Live Economy Holding Connection */}
        {availableHoldings.length > 0 && (
          <div className="mt-1 bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Direkte Anbindung an Betriebsstandort
                </div>
                <div className="text-[11px] text-slate-400">
                  Diesen Gegenstand direkt im Warenbestand eines registrierten Betriebs führen.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={editForm.details?.producingHoldingId || ''}
                onChange={e => {
                  const selectedId = e.target.value;
                  const holding = availableHoldings.find(h => h.id === selectedId);
                  updateDetail('producingHoldingId', selectedId);
                  updateDetail('producingHoldingName', holding ? holding.name : '');
                }}
                className="flex-1 sm:w-48 bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Betrieb wählen --</option>
                {availableHoldings.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.type || 'Betrieb'})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleSyncToEconomyHolding()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition shrink-0"
              >
                Hinterlegen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. VERWENDUNG */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            5. Verwendung
          </span>
          <span className="text-[11px] text-slate-400">
            (Einsatzbereiche & Anwendungsgebiete)
          </span>
        </div>

        {/* 5 Domains */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {ITEM_USE_DOMAINS.map(domain => {
            const isDomainActive = activeDomains.includes(domain.id);
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => toggleDomain(domain.id)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  isDomainActive
                    ? 'bg-indigo-950/70 text-indigo-200 border-indigo-600/80 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{domain.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isDomainActive
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isDomainActive && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {domain.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Konkrete Anwendungsbeschreibung */}
        <div className="flex flex-col gap-1 mt-1">
          <label className="text-xs font-semibold text-slate-300">
            Spezifische Verwendungsweise in der Spielwelt
          </label>
          <AutoExpandingTextarea
            minRows={2}
            value={editForm.details?.applicationForm || ''}
            onChange={e => updateDetail('applicationForm', e.target.value)}
            placeholder="Beschreibe, wie und wofür der Gegenstand im Alltag, in der Wirtschaft, von Soldaten, Handwerkern oder Magiern verwendet wird..."
            className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. GLOBALE PROGRESSIONS-REGEL & WERTESKALIERUNG */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              6. Globale Progressions-Regel & Werteskalierung
            </span>
            <span className="text-[11px] text-slate-400">
              (Anbindung an Schritt 4 der Spielwelt: Kampagnen-Parameter, Stufen & Meisterschaft)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Weltregel:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 uppercase tracking-wider">
              {worldProgressionLogic === 'ep'
                ? 'Erfahrungspunkte (EP)'
                : worldProgressionLogic === 'training'
                ? 'Training'
                : worldProgressionLogic === 'milestone'
                ? 'Meilenstein'
                : 'Statisch'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-900 border border-slate-800">
              Rate: {worldProgressionRate}
            </span>
          </div>
        </div>

        {/* Global Rule Info & Progression Switch */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 sm:mt-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span>Gegenstands-Entwicklung nach Weltregel</span>
                {hasProgression ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-300">
                    Aktiviert
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                    Deaktiviert (Feste Standardwerte)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {activeProgressionLogic === 'ep' &&
                  'Gegenstand gewinnt durch Kampfeinsatz, besiegte Feinde und Erfahrungspunkte (EP) an Durchschlagskraft und Stufen.'}
                {activeProgressionLogic === 'training' &&
                  'Gegenstand erfordert praktische Anwendung und Übungseinheiten zur Meisterschaftssteigerung.'}
                {activeProgressionLogic === 'milestone' &&
                  'Gegenstand entfaltet seine verborgene Macht durch Story-Meilensteine, Weihen und bestandene Prüfungen.'}
                {activeProgressionLogic === 'static' &&
                  'Gegenstand besitzt feste Werte, die nur durch Schmiede- und Veredelungshandwerk aufgewertet werden.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={hasProgression}
                onChange={e => updateDetail('hasProgression', e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
              />
              <span className="font-medium">Stufenfortschritt & Skalierung</span>
            </label>
          </div>
        </div>

        {hasProgression && (
          <div className="flex flex-col gap-4">
            {/* Logic Mode Selector: Default to World Rule or Custom Override */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                {
                  id: 'ep' as const,
                  label: 'EP-System',
                  sub: 'Erfahrungspunkte & Stufenaufstieg',
                  isWorld: worldProgressionLogic === 'ep'
                },
                {
                  id: 'training' as const,
                  label: 'Trainings-System',
                  sub: 'Übungseinheiten & Meisterschaft',
                  isWorld: worldProgressionLogic === 'training'
                },
                {
                  id: 'milestone' as const,
                  label: 'Meilenstein-System',
                  sub: 'Story-Trigger & Siegel-Erweckung',
                  isWorld: worldProgressionLogic === 'milestone'
                },
                {
                  id: 'static' as const,
                  label: 'Statisches System',
                  sub: 'Werkstatt- & Handwerksaufwertung',
                  isWorld: worldProgressionLogic === 'static'
                }
              ].map(mode => {
                const isSelected = activeProgressionLogic === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      if (mode.id === worldProgressionLogic) {
                        updateDetail('overrideProgressionLogic', false);
                        updateDetail('progressionLogic', mode.id);
                      } else {
                        updateDetail('overrideProgressionLogic', true);
                        updateDetail('progressionLogic', mode.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-slate-800 text-slate-100 border-indigo-500 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{mode.label}</span>
                      {mode.isWorld && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-300">
                          Weltregel
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">{mode.sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Section 6.1: Attribut- & Kampfwert-Skalierung */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">
                  6.1 Attribut- & Kampfwert-Skalierung (Kampagnen-Parameter)
                </span>
                <span className="text-[11px] text-slate-400">
                  (Skalierung mit den Kernattributen der Spielwelt)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Primäres Skalierungs-Attribut */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Primäres Skalierungs-Attribut
                  </label>
                  <select
                    value={editForm.details?.scalingStat || availablePowerParameters[0] || 'Stärke'}
                    onChange={e => updateDetail('scalingStat', e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {availablePowerParameters.map(param => (
                      <option key={param} value={param}>
                        {param}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sekundäres Skalierungs-Attribut */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Sekundäres Attribut (Optional)
                  </label>
                  <select
                    value={editForm.details?.secondaryScalingStat || 'keines'}
                    onChange={e => updateDetail('secondaryScalingStat', e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="keines">Keines</option>
                    {availablePowerParameters.map(param => (
                      <option key={param} value={param}>
                        {param}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Beeinflusster Kampfwert */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Beeinflusster Kampfwert
                  </label>
                  <select
                    value={editForm.details?.statAllocationId || availableStatAllocations[0]?.label || 'Physischer Angriff'}
                    onChange={e => updateDetail('statAllocationId', e.target.value)}
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {availableStatAllocations.map(alloc => (
                      <option key={alloc.id || alloc.label} value={alloc.label}>
                        {alloc.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ressourcen-Verbrauch / Kosten */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Kraftquellen-Verbrauch
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={editForm.details?.consumedResource || availableCostResources[0]?.name || 'SP'}
                      onChange={e => updateDetail('consumedResource', e.target.value)}
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Keine">Keine</option>
                      {availableCostResources.map(res => (
                        <option key={res.id || res.name} value={res.name}>
                          {res.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={editForm.details?.consumedResourceCost ?? 0}
                      onChange={e => updateDetail('consumedResourceCost', Number(e.target.value) || 0)}
                      placeholder="Kosten"
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Skalierungs-Beschreibung */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Wirkungs- & Skalierungsformel
                </label>
                <AutoExpandingTextarea
                  minRows={2}
                  value={editForm.details?.scalingDescription || ''}
                  onChange={e => updateDetail('scalingDescription', e.target.value)}
                  placeholder="z. B. Schaden erhöht sich um +1 je 5 Punkte Stärke; kritische Trefferchance skaliert direkt mit Geschicklichkeit..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Sub-Section 6.2: Stufen- & Meisterschafts-Fortschritt */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">
                  6.2 Stufen- & Entwicklungs-Fortschritt ({activeProgressionLogic.toUpperCase()})
                </span>
                <span className="text-[11px] text-slate-400">
                  (Aktuelle Stufe, Zuwachs & praktische Anwendung)
                </span>
              </div>

              {/* EP LOGIC UI */}
              {activeProgressionLogic === 'ep' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Gegenstandsstufe</label>
                      <input
                        type="text"
                        value={editForm.details?.progressionLevel || `Stufe ${currentLevel}`}
                        onChange={e => updateDetail('progressionLevel', e.target.value)}
                        placeholder="z. B. Stufe 1"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Maximale Stufe</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editForm.details?.maxProgressionLevel ?? 10}
                        onChange={e => updateDetail('maxProgressionLevel', Number(e.target.value) || 10)}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">Aktuelle EP</label>
                      <input
                        type="number"
                        min={0}
                        value={currentXp}
                        onChange={e => updateDetail('currentXp', Number(e.target.value) || 0)}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">EP bis Stufenaufstieg</label>
                      <input
                        type="number"
                        min={1}
                        value={xpToNextLevel}
                        onChange={e => updateDetail('xpToNextLevel', Number(e.target.value) || 100)}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* EP Progress Bar and Quick Buttons */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        Erfahrungs-Fortschritt: {currentXp} / {xpToNextLevel} EP ({xpPercent}%)
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Stufe {currentLevel} / {editForm.details?.maxProgressionLevel || 10}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => handleAddXp(10)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-md text-[11px] font-medium transition"
                      >
                        +10 EP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddXp(25)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-md text-[11px] font-medium transition"
                      >
                        +25 EP
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddXp(50)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-md text-[11px] font-medium transition"
                      >
                        +50 EP
                      </button>
                      <button
                        type="button"
                        onClick={handleLevelUp}
                        className="px-3 py-1 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-md text-[11px] font-semibold transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Stufenaufstieg
                      </button>
                      <button
                        type="button"
                        onClick={handleResetXp}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-md text-[11px] transition ml-auto"
                      >
                        EP zurücksetzen
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">EP-Bonus bei Führung</label>
                      <input
                        type="text"
                        value={editForm.details?.epBonus || ''}
                        onChange={e => updateDetail('epBonus', e.target.value)}
                        placeholder="z. B. +15% Kampferfahrung bei aktiver Führung"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Besiegte Feinde bis Rangaufstieg
                      </label>
                      <input
                        type="text"
                        value={editForm.details?.killRequirement || ''}
                        onChange={e => updateDetail('killRequirement', e.target.value)}
                        placeholder="z. B. 0 / 25 Feinde bezwungen"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Stufen-Zuwachs & Boni je Level
                    </label>
                    <AutoExpandingTextarea
                      minRows={2}
                      value={editForm.details?.scalingWithLevel || ''}
                      onChange={e => updateDetail('scalingWithLevel', e.target.value)}
                      placeholder="z. B. +2 Angriffskraft und +1 Parade je Stufe; auf Stufe 5 schaltet der Gegenstand den Effekt 'Schockwelle' frei..."
                      className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TRAINING LOGIC UI */}
              {activeProgressionLogic === 'training' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Meisterschaftsgrad des Gegenstands
                      </label>
                      <select
                        value={editForm.details?.masteryRank || 'Novize (25%)'}
                        onChange={e => updateDetail('masteryRank', e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Novize (25%)">Novize (25% Effektivität)</option>
                        <option value="Geselle (50%)">Geselle (50% Effektivität)</option>
                        <option value="Experte (75%)">Experte (75% Effektivität)</option>
                        <option value="Meister (95%)">Meister (95% Effektivität)</option>
                        <option value="Großmeister (100%)">Großmeister (100% Volle Meisterung)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Trainings-Multiplikator
                      </label>
                      <input
                        type="text"
                        value={editForm.details?.trainingProficiencyBonus || ''}
                        onChange={e => updateDetail('trainingProficiencyBonus', e.target.value)}
                        placeholder="z. B. x1.5 Übungs-Effizienz"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Übungsanwendungen gesamt
                      </label>
                      <input
                        type="text"
                        value={editForm.details?.practiceUsageCount || ''}
                        onChange={e => updateDetail('practiceUsageCount', e.target.value)}
                        placeholder="z. B. 8 / 25 Einheiten"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 4 Training Segments (Interactive) */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        Übungseinheiten zur nächsten Meisterschaftsstufe ({trainingUnits} / 4 Einheiten):
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {trainingUnits === 4 ? 'Bereit für Rangaufstieg' : 'In Übung'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map(seg => {
                        const isDone = seg <= trainingUnits;
                        return (
                          <button
                            key={seg}
                            type="button"
                            onClick={() => handleSetTrainingUnits(seg)}
                            className={`py-2 rounded-lg text-xs font-semibold border transition text-center ${
                              isDone
                                ? 'bg-indigo-600/90 text-white border-indigo-500'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            Einheit {seg}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Übungsanleitung & Technik-Fokus
                    </label>
                    <AutoExpandingTextarea
                      minRows={2}
                      value={editForm.details?.trainingNotes || ''}
                      onChange={e => updateDetail('trainingNotes', e.target.value)}
                      placeholder="z. B. Gezielte Hieb- und Parierübungen verbessern die Handhabung; nach 4 Einheiten steigt der Schadensausstoß..."
                      className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* MILESTONE LOGIC UI */}
              {activeProgressionLogic === 'milestone' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Erweckungs- & Siegelstufen
                      </label>
                      <input
                        type="text"
                        value={editForm.details?.awakeningStages || ''}
                        onChange={e => updateDetail('awakeningStages', e.target.value)}
                        placeholder="z. B. Stufe 1 (Versiegelt) -> Stufe 2 (Erwacht)"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Freischalt-Meilenstein / Quest-Trigger
                      </label>
                      <input
                        type="text"
                        value={editForm.details?.milestoneUnlockReq || ''}
                        onChange={e => updateDetail('milestoneUnlockReq', e.target.value)}
                        placeholder="z. B. Sieg über den Kerker-Boss in Kapitel 2"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Erforderlicher Titel / Rang
                      </label>
                      <input
                        type="text"
                        value={editForm.details?.reputationOrTitle || ''}
                        onChange={e => updateDetail('reputationOrTitle', e.target.value)}
                        placeholder="z. B. Ritter des Ordens / Gildenrang 3"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Meilenstein-Bedingungen & Weihe-Ritual
                    </label>
                    <AutoExpandingTextarea
                      minRows={2}
                      value={editForm.details?.milestoneNote || ''}
                      onChange={e => updateDetail('milestoneNote', e.target.value)}
                      placeholder="z. B. Muss im Heiligtum des Lichts mit heiligem Quellwasser geweiht werden, um die zweite Stufe freizuschalten..."
                      className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* STATIC LOGIC UI */}
              {activeProgressionLogic === 'static' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Fester Aufwertungsgrad
                      </label>
                      <select
                        value={editForm.details?.staticUpgradeGrade || 'Basis (+0)'}
                        onChange={e => updateDetail('staticUpgradeGrade', e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Basis (+0)">Basis (+0)</option>
                        <option value="Veredelt (+1)">Veredelt (+1)</option>
                        <option value="Geschmiedet (+2)">Geschmiedet (+2)</option>
                        <option value="Meisterstück (+3)">Meisterstück (+3)</option>
                        <option value="Vollendet (+4)">Vollendet (+4)</option>
                        <option value="Legendär (+5)">Legendär (+5)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Schmiede- & Handwerkskosten
                      </label>
                      <input
                        type="text"
                        value={editForm.details?.staticTalentCost || ''}
                        onChange={e => updateDetail('staticTalentCost', e.target.value)}
                        placeholder="z. B. 50 Goldmünzen + 2x Eisenbarren"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Feste Führungs-Voraussetzung
                      </label>
                      <input
                        type="text"
                        value={editForm.details?.staticRequirements || ''}
                        onChange={e => updateDetail('staticRequirements', e.target.value)}
                        placeholder="z. B. Mindestens 20 Stärke, keine Stufenskalierung"
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={editForm.details?.isFixedStats ?? true}
                        onChange={e => updateDetail('isFixedStats', e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                      />
                      <span>Werte sind unveränderliche Festwerte (kein automatischer Erfahrungszuwachs)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-Section 6.3: Beherrschungs-Voraussetzung & Träger-Anforderung */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">
                  6.3 Beherrschungs-Voraussetzung & Träger-Anforderung
                </span>
                <span className="text-[11px] text-slate-400">
                  (Meisterschaftsstufe, Mindestattribute & Handhabungsmalus)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeBuilderType === 'Waffe' ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Zugeordnete Waffenart
                      </label>
                      <input
                        type="text"
                        list="all-weapons-catalog"
                        value={editForm.details?.requiredWeaponMasteryName || editForm.details?.weaponType || ''}
                        onChange={e => {
                          const val = e.target.value;
                          updateDetail('requiredWeaponMasteryName', val);
                          const found = ALL_WEAPONS.find(w => w.name.toLowerCase() === val.trim().toLowerCase());
                          if (found) {
                            updateDetail('requiredWeaponMasteryId', found.id);
                          }
                        }}
                        placeholder="z. B. Langschwert, Bogen, Speer..."
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Erforderlicher Waffen-Meisterschaftsrang
                      </label>
                      <select
                        value={editForm.details?.requiredMasteryRank || 'Keine'}
                        onChange={e => updateDetail('requiredMasteryRank', e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Keine">Keine Voraussetzung</option>
                        <option value="Novize">Novize (25%)</option>
                        <option value="Geselle">Geselle (50%)</option>
                        <option value="Experte">Experte (75%)</option>
                        <option value="Meister">Meister (95%)</option>
                        <option value="Großmeister">Großmeister (100%)</option>
                      </select>
                    </div>
                  </>
                ) : activeBuilderType === 'Werkzeug' ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Zugeordneter Handwerksberuf
                      </label>
                      <input
                        type="text"
                        value={editForm.details?.requiredProfessionName || editForm.details?.craftingProfession || ''}
                        onChange={e => updateDetail('requiredProfessionName', e.target.value)}
                        placeholder="z. B. Schmied, Alchemist, Schreiner..."
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-300">
                        Erforderlicher Berufsrang
                      </label>
                      <select
                        value={editForm.details?.requiredProfessionRank || 'Keine'}
                        onChange={e => updateDetail('requiredProfessionRank', e.target.value)}
                        className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Keine">Keine Voraussetzung</option>
                        <option value="Lehrling">Lehrling</option>
                        <option value="Geselle">Geselle</option>
                        <option value="Meister">Meister</option>
                        <option value="Großmeister">Großmeister</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Handhabungs-Fähigkeit
                    </label>
                    <input
                      type="text"
                      value={editForm.details?.requiredSkill || ''}
                      onChange={e => updateDetail('requiredSkill', e.target.value)}
                      placeholder="z. B. Reitkunst, Arkanes Wissen, Schlösser knacken..."
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Mindest-Attributanforderung
                  </label>
                  <input
                    type="text"
                    value={editForm.details?.requiredMinStat || ''}
                    onChange={e => updateDetail('requiredMinStat', e.target.value)}
                    placeholder="z. B. Stärke 35, Geschicklichkeit 20"
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Malus bei unzureichender Beherrschung
                </label>
                <AutoExpandingTextarea
                  minRows={2}
                  value={editForm.details?.incompetencePenalty || ''}
                  onChange={e => updateDetail('incompetencePenalty', e.target.value)}
                  placeholder="z. B. -30% Angriffsgeschwindigkeit, doppelter Ausdauerverbrauch und Fehlschlaggefahr bei mangelnder Meisterschaft..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 7. HERKUNFT & FUNDQUELLE */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            7. Herkunft & Fundquelle
          </span>
          <span className="text-[11px] text-slate-400">
            (Quelle, Vorkommen & Ursprung des Gegenstands)
          </span>
        </div>

        {/* 6 Origin Types */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {ITEM_ORIGIN_TYPES.map(origin => {
            const isSelected = activeOriginType === origin.id;
            return (
              <button
                key={origin.id}
                type="button"
                onClick={() => handleSelectOriginType(origin.id)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-slate-800 text-slate-100 border-indigo-500 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 capitalize">
                    {origin.label}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {origin.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Context fields based on selected origin */}
        {activeOriginType === 'normal_produziert' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Herstellungsregion / Zunft</label>
              <input
                type="text"
                value={editForm.details?.currentLocation || ''}
                onChange={e => updateDetail('currentLocation', e.target.value)}
                placeholder="z. B. Schmiedeviertel Eisenhafen, Zunfthaus der Gerber..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Fertigungsdauer</label>
              <input
                type="text"
                value={editForm.details?.productionTime || ''}
                onChange={e => updateDetail('productionTime', e.target.value)}
                placeholder="z. B. 4 Arbeitsstunden, 3 Tage Trockenzeit..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {activeOriginType === 'natuerliches_vorkommen' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Biom & Fundregion</label>
              <input
                type="text"
                value={editForm.details?.originHabitat || ''}
                onChange={e => updateDetail('originHabitat', e.target.value)}
                placeholder="z. B. Nebelgebirge, Dichte Eichenwälder, Küstenfelsen..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Abbaumethode & Saison</label>
              <input
                type="text"
                value={editForm.details?.extractionMethod || ''}
                onChange={e => updateDetail('extractionMethod', e.target.value)}
                placeholder="z. B. Kräutersammeln im Herbst, Tiefer Bergbau, Jagd..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {activeOriginType === 'dungeon' && (
          <div className="flex flex-col gap-3 mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Dungeon / Fundort</label>
                <input
                  type="text"
                  list="dungeon-locations-list"
                  value={editForm.details?.dungeonLocationName || ''}
                  onChange={e => updateDetail('dungeonLocationName', e.target.value)}
                  placeholder="z. B. Finsterwald-Krypta, Silbermine..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <datalist id="dungeon-locations-list">
                  {locationEntries.map(l => (
                    <option key={l.id} value={l.title} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Ebene & Kammer</label>
                <input
                  type="text"
                  value={editForm.details?.dungeonFloorLevel || ''}
                  onChange={e => updateDetail('dungeonFloorLevel', e.target.value)}
                  placeholder="z. B. Ebene 2, Bosskammer, Schatzgewölbe..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Fundquelle</label>
                <input
                  type="text"
                  value={editForm.details?.dungeonSourceType || ''}
                  onChange={e => updateDetail('dungeonSourceType', e.target.value)}
                  placeholder="z. B. Schatztruhe, Sarkophag, Wandkristall..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            {onUpdateLore && locationEntries.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSyncToDungeonCodex}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  Im Orts-/Dungeon-Codex hinterlegen
                </button>
              </div>
            )}
          </div>
        )}

        {activeOriginType === 'monster_drop' && (
          <div className="flex flex-col gap-3 mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Monster / Kreatur</label>
                <input
                  type="text"
                  list="monsters-list"
                  value={editForm.details?.droppedByMonsterName || ''}
                  onChange={e => updateDetail('droppedByMonsterName', e.target.value)}
                  placeholder="z. B. Schattenwolf, Höhlentroll, Eisdrache..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <datalist id="monsters-list">
                  {monsterEntries.map(m => (
                    <option key={m.id} value={m.title} />
                  ))}
                </datalist>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Körperteil / Beuteart</label>
                <input
                  type="text"
                  value={editForm.details?.harvestedBodyPart || ''}
                  onChange={e => updateDetail('harvestedBodyPart', e.target.value)}
                  placeholder="z. B. Fell, Giftbeutel, Zähne, Kristallkern, Schuppen..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Drop-Chance (%)</label>
                <input
                  type="text"
                  value={editForm.details?.dropChance || '50%'}
                  onChange={e => updateDetail('dropChance', e.target.value)}
                  placeholder="z. B. 75%, 100% (Garantierter Drop), 15%..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            {onUpdateLore && monsterEntries.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSyncToMonsterCodex}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  Im Monster-Codex hinterlegen
                </button>
              </div>
            )}
          </div>
        )}

        {activeOriginType === 'quest' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Quest / Auftraggeber</label>
              <input
                type="text"
                value={editForm.details?.questContext || ''}
                onChange={e => updateDetail('questContext', e.target.value)}
                placeholder="z. B. Belohnung von Fürst Vaelin, Auftrag der Stadtwache..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">Übergabebedingung</label>
              <input
                type="text"
                value={editForm.details?.specialProperties || ''}
                onChange={e => updateDetail('specialProperties', e.target.value)}
                placeholder="z. B. Nach Abschluss der Hauptmission, Erfordert Rang Geselle..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {activeOriginType === 'einzigartiger_fund' && (
          <div className="flex flex-col gap-1 mt-1">
            <label className="text-xs font-semibold text-slate-300">
              Fundgeschichte & Historischer Ursprung
            </label>
            <AutoExpandingTextarea
              minRows={2}
              value={editForm.secretsStage2 || editForm.details?.specialProperties || ''}
              onChange={e => {
                setEditForm(prev => ({ ...prev, secretsStage2: e.target.value }));
                updateDetail('specialProperties', e.target.value);
              }}
              placeholder="Ausgrabungsort, Historische Epoche, Vorbesitzer oder mythologische Bedeutung..."
              className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <div className="text-[11px] text-slate-400">
          Alle 7 Dimensionen sind konsistent in der persistenten Spielwelt verankert.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-950/40 transition"
          >
            <Save className="w-3.5 h-3.5" />
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
};
