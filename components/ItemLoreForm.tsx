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
  CRAFTING_PROFESSIONS
} from '../lib/itemCategoriesData';
import {
  STANDARD_ITEMS_CATALOG,
  StandardItemDefinition,
  findStandardItem
} from '../lib/standardItemsData';
import {
  Sparkles,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Package,
  Database,
  Check,
  Plus,
  Sliders,
  ShieldCheck
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { ALL_WEAPONS } from '../lib/weaponTypesData';
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

  // Switch builder type
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

  // Usage Domain Helpers
  const activeDomains: string[] = Array.isArray(editForm.details?.useDomains)
    ? editForm.details.useDomains
    : typeof editForm.details?.applicationArea === 'string' && editForm.details.applicationArea
    ? editForm.details.applicationArea.split(',').map((s: string) => s.trim().toLowerCase())
    : ['alltag'];

  // Apply standard predefined item
  const handleApplyStandardItem = (stdItem: StandardItemDefinition) => {
    setEditForm(prev => ({
      ...prev,
      category: 'Gegenstände',
      title: stdItem.title,
      description: stdItem.description,
      details: {
        ...(prev.details || {}),
        builderType: stdItem.builderType,
        mainCategory: stdItem.mainCategory,
        subCategory: stdItem.subCategory,
        itemType: stdItem.builderType,
        unit: stdItem.unit,
        pricePerUnit: stdItem.pricePerUnit,
        materialQuality: stdItem.materialQuality,
        rarity: stdItem.rarity,
        isUnique: stdItem.isUnique,
        condition: stdItem.condition,
        ...stdItem.details
      }
    }));
  };

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

  // Origin Type Resolution
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

  // Progression Logic State & Resolution
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

  // Economy Sync Handlers
  const handleSyncToEconomyHolding = (holdingId?: string) => {
    const targetHoldingId = holdingId || editForm.details?.producingHoldingId;
    if (!targetHoldingId || !world?.economyConfig) {
      setSyncNotice('Bitte zuerst einen Betriebsstandort auswählen.');
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
      setSyncNotice('Bitte zuerst ein Monster auswählen oder einen Monsternamen eingeben.');
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
      setSyncNotice('Bitte zuerst einen Dungeon oder Ort auswählen.');
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-200 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              {isEditing ? 'Gegenstand bearbeiten' : 'Neuer Gegenstand'}
            </h2>
            <p className="text-xs text-slate-400">
              Gegenstandserstellung, Eigenschaften, Wirtschaft und Spielwelt-Verknüpfung in einem Formular.
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
              Gegenstand automatisch beschreiben und befüllen
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
            placeholder="Kurze Idee oder Notiz eingeben (z. B. 'Zwergischer Runenhammer, Sternenerz, verleiht Blitzschaden')..."
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
      {/* ZUSAMMENGEFASSTES HAUPTFORMULAR (Alle Angaben in einem zusammenhängenden Feld) */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/40 border border-slate-800/90 rounded-xl p-4 sm:p-5 flex flex-col gap-6">

        {/* 1. ART, NAME & GRUNDDATEN */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Gegenstand & Grunddaten
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-indigo-950/90 border border-indigo-700/80 text-indigo-300 font-semibold">
              {activeBuilderType}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Gegenstandsart */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Gegenstandsart auswählen *</span>
                <span className="text-[11px] font-normal text-slate-400">Passt Wirtschaft, Produktionskette & Eigenschaften an</span>
              </label>
              <select
                value={activeBuilderType}
                onChange={e => handleSelectBuilderType(e.target.value as ItemBuilderType)}
                className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg px-3 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 transition shadow-inner"
              >
                <optgroup label="Urproduktion, Rohstoffe, Erze & Baustoffe">
                  <option value="Rohstoff">Rohstoff (Holz, Stein, Kohle, Faser, Naturstoff)</option>
                  <option value="Bergbau & Erze">Bergbau & Erze (Metallerz, Edelgestein, Erzadern, Mineralien)</option>
                  <option value="Material">Material (Zwischenprodukt, Barren, Leder, Stoff, Halbzeug)</option>
                  <option value="Baustoff">Baustoff & Konstruktion (Ziegel, Mörtel, Werkstein, Balken, Beschläge)</option>
                  <option value="Landwirtschaft">Landwirtschaft (Futtermittel, Stroh, Dünger, Bodenstoffe)</option>
                  <option value="Saatgut & Pflanzen">Saatgut & Pflanzen (Getreidesaat, Setzlinge, Kräutersamen, Zaubersaaten)</option>
                </optgroup>
                <optgroup label="Verarbeitung, Nahrung, Tränke & Alchemie">
                  <option value="Nahrung">Nahrung (Ration, Brot, Fleisch, Fisch, Käse, Bier, Wein)</option>
                  <option value="Medizin / Alchemie">Medizin & Alchemie (Heilkräuter, Tinkturen, Salben, Reagenzien, Gegengifte)</option>
                  <option value="Tränke & Elixiere">Tränke & Elixiere (Heiltrank, Manatrank, Elixier, Zauberöl, Phiole)</option>
                  <option value="Werkzeug">Werkzeug (Schmiedehammer, Hobel, Kelle, Spitzhacke, Medizinerbesteck)</option>
                </optgroup>
                <optgroup label="Schurken, Kult, Schriften & Schmuck">
                  <option value="Gifte & Fallen">Gifte & Fallen (Toxine, Betäubungsgift, Bärenfalle, Rauchbombe, Schurkenzeug)</option>
                  <option value="Ritual- & Kultbedarf">Ritual- & Kultbedarf (Reliquien, Altarleuchter, Weihrauch, Weihewasser, Salböl)</option>
                  <option value="Buch & Schriftstück">Buch & Schriftstück (Kodex, Schriftrolle, Seekarte, Urkunde, Tagebuch, Grimoire)</option>
                  <option value="Schmuck & Kostbarkeiten">Schmuck & Kostbarkeiten (Siegelring, Amulett, Krone, Edelmetallkette, Pokal)</option>
                  <option value="Kunst & Antiquitäten">Kunst & Antiquitäten (Gemälde, Wandteppich, Skulptur, Antike Vase, Relief)</option>
                </optgroup>
                <optgroup label="Ausrüstung, Kleidung & Militär">
                  <option value="Waffe">Waffe (Schwert, Bogen, Lanze, Axt, Armbrust, Munition)</option>
                  <option value="Rüstung">Rüstung & Schutz (Helm, Brustplatte, Schild, Kette, Vollplatte)</option>
                  <option value="Kleidung">Kleidung & Textilien (Berufs-Outfit, Zunftkluft, Mantel, Stiefel, Uniform)</option>
                  <option value="Militärbedarf">Militärbedarf (Belagerungsgerät, Munitionskisten, Trossbedarf, Schanzzeug)</option>
                </optgroup>
                <optgroup label="Logistik, Nautik, Tiere & Haushalt">
                  <option value="Tier">Tier (Nutzvieh, Zugtier, Reittier, Lasttier, Wachhund, Zuchttier)</option>
                  <option value="Transportmittel">Transportmittel (Handkarren, Planwagen, Kutsche, Lastkahn, Schiff)</option>
                  <option value="Nautik & Seefahrt">Nautik & Seefahrt (Kompass, Seekarte, Takelage, Fernrohr, Anker)</option>
                  <option value="Alltagsgegenstand">Alltagsgegenstand (Geschirr, Beleuchtung/Öl, Möbel, Hygiene, Schreibbedarf)</option>
                </optgroup>
                <optgroup label="Handel, Magie, Drops & Story">
                  <option value="Handelsware">Handelsware (Gewürze, Seide, Salz, Luxusgüter, Münzbarren)</option>
                  <option value="Magischer Gegenstand">Magischer Gegenstand (Artefakt, Amulett, Zauberstab, Fokusstein, Rolle)</option>
                  <option value="Monster-Beute">Monster-Beute & Drops (Trophäen, Drüsen, Schuppen, Gifte, Felle)</option>
                  <option value="Dungeon-Fund">Dungeon-Fund (Truhenbeute, Kryptafund, Höhlenkristall, Boss-Relikt)</option>
                  <option value="Quest-/Story-Gegenstand">Quest-/Story-Gegenstand (Schlüssel, Urkunde, Siegel, Beweisstück)</option>
                </optgroup>
              </select>
            </div>

            {/* Unterkategorie */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Unterkategorie ({activeBuilderType})</span>
                <span className="text-[11px] font-normal text-slate-400">Präzise Zuordnung</span>
              </label>
              {builderMeta.subcategories.length > 0 ? (
                <select
                  value={activeSubCat}
                  onChange={e => handleSubCategoryChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg px-3 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 transition shadow-inner"
                >
                  {builderMeta.subcategories.map(sub => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={activeSubCat}
                  onChange={e => handleSubCategoryChange(e.target.value)}
                  placeholder="Individuelle Unterkategorie..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>
          </div>

          {/* Name & Mengeneinheit / Zustand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Name / Bezeichnung des Gegenstands *
              </label>
              <input
                type="text"
                list="standard-item-suggestions"
                value={editForm.title || ''}
                onChange={e => {
                  const val = e.target.value;
                  setEditForm(prev => ({ ...prev, title: val }));
                  const matched = findStandardItem(val);
                  if (matched && (!editForm.description || editForm.description.trim() === '')) {
                    handleApplyStandardItem(matched);
                  }
                }}
                placeholder="z. B. Eisen, Kupfer, Stahl, Leder, Holz, Stein, Mehl, Langschwert..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="standard-item-suggestions">
                {STANDARD_ITEMS_CATALOG.map(std => (
                  <option key={`dl-${std.id}`} value={std.title} />
                ))}
              </datalist>
            </div>

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

          {/* Qualität, Seltenheit, Einzigartigkeit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          {/* Hauptbeschreibung */}
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
        </div>

        {/* 2. SPEZIFISCHE EIGENSCHAFTEN NACH GEGENSTANDSART */}
        <div className="border-t border-slate-850 pt-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Spezifische Eigenschaften ({activeBuilderType})
            </span>
            <span className="text-[11px] text-slate-400">
              Automatisch angepasst an die gewählte Art
            </span>
          </div>

          {/* Rohstoff */}
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

          {/* Material */}
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
                  Materialeigenschaften & Besonderheiten
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

          {/* Baustoff & Konstruktion */}
          {activeBuilderType === 'Baustoff' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Baustoffklasse</label>
                  <input
                    type="text"
                    value={editForm.details?.buildingClass || ''}
                    onChange={e => updateDetail('buildingClass', e.target.value)}
                    placeholder="z. B. Mauerwerk, Holzbau, Bedachung, Bindemittel, Fundament..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Tragfähigkeit & Festigkeit</label>
                  <input
                    type="text"
                    value={editForm.details?.loadBearingCapacity || ''}
                    onChange={e => updateDetail('loadBearingCapacity', e.target.value)}
                    placeholder="z. B. Hohe Druckfestigkeit, Tragende Wände, Brandschutz..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Holding-Einsatzbereich</label>
                  <input
                    type="text"
                    value={editForm.details?.constructionArea || ''}
                    onChange={e => updateDetail('constructionArea', e.target.value)}
                    placeholder="z. B. Befestigung, Werkstatt-Ausbau, Wohnbauten, Mühlen, Straßen..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Konstruktionseigenschaften & Witterungsbeständigkeit
                </label>
                <AutoExpandingTextarea
                  minRows={2}
                  value={editForm.details?.specialProperties || ''}
                  onChange={e => updateDetail('specialProperties', e.target.value)}
                  placeholder="Frostbeständig, benötigt Kalkmörtel, Trocknungszeit, Feuerfestigkeit, Verbindungstechnik..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Landwirtschaft & Saatgut */}
          {activeBuilderType === 'Landwirtschaft' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Agrar-Kategorie</label>
                  <input
                    type="text"
                    value={editForm.details?.agriType || ''}
                    onChange={e => updateDetail('agriType', e.target.value)}
                    placeholder="z. B. Saatgut, Setzlinge, Futtermittel, Dünger, Silage..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Wachstumsdauer / Reifezyklus</label>
                  <input
                    type="text"
                    value={editForm.details?.growthPeriod || ''}
                    onChange={e => updateDetail('growthPeriod', e.target.value)}
                    placeholder="z. B. 1 Saison, 60 Tage, Frühjahrsaussaat, Winterhart..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Ertragserwartung</label>
                  <input
                    type="text"
                    value={editForm.details?.yieldRate || ''}
                    onChange={e => updateDetail('yieldRate', e.target.value)}
                    placeholder="z. B. 10-facher Kornertrag, 35 Scheffel/Morgen..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Lagerungsanforderungen & Besonderheiten
                </label>
                <AutoExpandingTextarea
                  minRows={2}
                  value={editForm.details?.specialProperties || ''}
                  onChange={e => updateDetail('specialProperties', e.target.value)}
                  placeholder="Trocken in Silos lagern, Nagetierschutz erforderlich, frostempfindlich, Bodenverbesserung..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Werkzeug */}
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
                  placeholder="Erforderliche Vorbildung, Zweihändige Führung, Spezielle Pflege notwendig..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Waffe */}
          {activeBuilderType === 'Waffe' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Waffengattung</label>
                  <input
                    type="text"
                    list="all-weapons-catalog"
                    value={editForm.details?.weaponType || ''}
                    onChange={e => {
                      const val = e.target.value;
                      updateDetail('weaponType', val);
                      handleSelectStandardWeapon(val);
                    }}
                    placeholder="z. B. Langschwert, Bogen, Kriegshammer..."
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
                    placeholder="z. B. Nahkampf (1m), Fernkampf (50m), Einhändig..."
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
                  placeholder="Rüstungsdurchdringung, Paradebonus, Blutungswirkung, Verzauberung..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Rüstung */}
          {activeBuilderType === 'Rüstung' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Rüstungsplatz (Slot)</label>
                  <input
                    type="text"
                    value={editForm.details?.armorSlot || ''}
                    onChange={e => updateDetail('armorSlot', e.target.value)}
                    placeholder="z. B. Kopf / Helm, Brust / Kürass, Schild, Beine..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Rüstungsklasse / Typ</label>
                  <input
                    type="text"
                    value={editForm.details?.clothingSlot || ''}
                    onChange={e => updateDetail('clothingSlot', e.target.value)}
                    placeholder="z. B. Lederharnisch, Kette, Schuppenpanzer, Vollplatte..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Schutzwert</label>
                  <input
                    type="text"
                    value={editForm.details?.armorValue || ''}
                    onChange={e => updateDetail('armorValue', e.target.value)}
                    placeholder="z. B. RK +4, 25% Schadensabsorption, 8 Schutzpunkte..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Traglast & Bewegungsmalus</label>
                  <input
                    type="text"
                    value={editForm.details?.encumbrance || ''}
                    onChange={e => updateDetail('encumbrance', e.target.value)}
                    placeholder="z. B. Leicht (kein Malus), Mittelschwer (-1 Bewegung)..."
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

          {/* Kleidung */}
          {activeBuilderType === 'Kleidung' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Kleidungsart / Slot</label>
                  <input
                    type="text"
                    value={editForm.details?.clothingSlot || ''}
                    onChange={e => updateDetail('clothingSlot', e.target.value)}
                    placeholder="z. B. Komplett-Set / Outfit, Mantel, Tunika, Stiefel, Hose, Hut..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Passender Beruf / Zunft</label>
                  <input
                    type="text"
                    value={editForm.details?.professionMatch || ''}
                    onChange={e => updateDetail('professionMatch', e.target.value)}
                    placeholder="z. B. Schmied, Alchemist, Bergmann, Jäger, Zimmermann..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Stoffart & Material</label>
                  <input
                    type="text"
                    value={editForm.details?.fabricType || ''}
                    onChange={e => updateDetail('fabricType', e.target.value)}
                    placeholder="z. B. Wolle, Leinen, Leder, Samt, Loden, Zwillich..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Set-Bestandteile bei Outfits / Sets */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                  <span>Enthaltene Set-Bestandteile (bei Outfits & Sets)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Kombinierte Einzelteile des Outfits</span>
                </label>
                <AutoExpandingTextarea
                  minRows={2}
                  value={editForm.details?.setPieces || ''}
                  onChange={e => updateDetail('setPieces', e.target.value)}
                  placeholder="z. B. Schwere Lederschürze, Hitzeschutz-Fäustlinge, Arbeitsstiefel, Armmanschetten..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Wetterschutz & Schutzwirkung</label>
                  <input
                    type="text"
                    value={editForm.details?.weatherProtection || ''}
                    onChange={e => updateDetail('weatherProtection', e.target.value)}
                    placeholder="z. B. Hitzeschutz, Regendicht, Kälteschutz, Funkenflug-resistent..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Sozialer Stand & Repräsentation
                  </label>
                  <input
                    type="text"
                    value={editForm.details?.socialStatus || ''}
                    onChange={e => updateDetail('socialStatus', e.target.value)}
                    placeholder="z. B. Handwerkerkluft, Zunftmeister, Bürgerlich, Adelstracht..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Militärbedarf */}
          {activeBuilderType === 'Militärbedarf' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Bedarfs-Kategorie</label>
                  <input
                    type="text"
                    value={editForm.details?.militaryRole || ''}
                    onChange={e => updateDetail('militaryRole', e.target.value)}
                    placeholder="z. B. Belagerungsgerät, Munitionskiste, Schanzzeug, Signalmittel, Feldlager..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Truppen-Einsatzbereich</label>
                  <input
                    type="text"
                    value={editForm.details?.troopType || ''}
                    onChange={e => updateDetail('troopType', e.target.value)}
                    placeholder="z. B. Infanterie, Schützenregiment, Kavallerie, Festungsgarnison..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Packmaß & Transportbedarf</label>
                  <input
                    type="text"
                    value={editForm.details?.packingSize || ''}
                    onChange={e => updateDetail('packingSize', e.target.value)}
                    placeholder="z. B. 1 Kiste pro 10 Mann, Fuhrwerkladung, Tornister..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Taktische Funktion & Wirkung
                </label>
                <AutoExpandingTextarea
                  minRows={2}
                  value={editForm.details?.specialProperties || ''}
                  onChange={e => updateDetail('specialProperties', e.target.value)}
                  placeholder="Mauerdurchbruch, 120m Reichweite, Alarmierung, Schutzwall-Errichtung, Versorgung..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Nahrung */}
          {activeBuilderType === 'Nahrung' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Nahrungsart</label>
                  <input
                    type="text"
                    value={editForm.details?.foodType || ''}
                    onChange={e => updateDetail('foodType', e.target.value)}
                    placeholder="z. B. Grundnahrungsmittel, Feldration, Frischware, Backware..."
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

          {/* Medizin & Alchemie */}
          {activeBuilderType === 'Medizin / Alchemie' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Zubereitungsform & Kategorie</label>
                  <input
                    type="text"
                    value={editForm.details?.medicineForm || ''}
                    onChange={e => updateDetail('medicineForm', e.target.value)}
                    placeholder="z. B. Heiltinktur, Wundsalbe, Gegengift, Essenz, Elixier, Pulver..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Wirkungsgrad & Potenz</label>
                  <input
                    type="text"
                    value={editForm.details?.potencyGrade || ''}
                    onChange={e => updateDetail('potencyGrade', e.target.value)}
                    placeholder="z. B. Grad I (Milde Linderung), Meisterliche Potenz, Sofortwirkung..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Labor- / Alchemiestufe</label>
                  <input
                    type="text"
                    value={editForm.details?.labTier || ''}
                    onChange={e => updateDetail('labTier', e.target.value)}
                    placeholder="z. B. Mörser & Destille, Alchemielabor Stufe 2, Kräuterkunde..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Wirkungsweise, Dosierung & Nebenwirkungen
                </label>
                <AutoExpandingTextarea
                  minRows={2}
                  value={editForm.details?.specialProperties || editForm.details?.consumptionEffect || ''}
                  onChange={e => {
                    updateDetail('specialProperties', e.target.value);
                    updateDetail('consumptionEffect', e.target.value);
                  }}
                  placeholder="Blutstillung, Schmerzlinderung, Giftneutralisierung, Überdosierungsrisiko, Vor Licht schützen..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Alltagsgegenstand */}
          {activeBuilderType === 'Alltagsgegenstand' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Verwendungszweck</label>
                  <input
                    type="text"
                    value={editForm.details?.householdFunction || ''}
                    onChange={e => updateDetail('householdFunction', e.target.value)}
                    placeholder="z. B. Beleuchtung, Aufbewahrung, Kochen, Schreiben..."
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
                  Handhabung & Besonderheiten
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

          {/* Tier */}
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
                    placeholder="z. B. Reittier, Lasttier, Nutztier, Jagdbegleiter..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Tragkraft / Zugkraft</label>
                  <input
                    type="text"
                    value={editForm.details?.animalCapacity || ''}
                    onChange={e => updateDetail('animalCapacity', e.target.value)}
                    placeholder="z. B. 120 kg Traglast, Zweispänner..."
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

          {/* Transportmittel */}
          {activeBuilderType === 'Transportmittel' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Fahrzeugart</label>
                  <input
                    type="text"
                    value={editForm.details?.vehicleType || ''}
                    onChange={e => updateDetail('vehicleType', e.target.value)}
                    placeholder="z. B. Planwagen, Kutsche, Boot, Schiff, Karren..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Ladekapazität</label>
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
                    placeholder="z. B. 4 Passagiere, 2 Besatzung..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Antrieb & Reisegeschwindigkeit</label>
                  <input
                    type="text"
                    value={editForm.details?.propulsion || ''}
                    onChange={e => updateDetail('propulsion', e.target.value)}
                    placeholder="z. B. 2 Zugpferde, Segel, Ruder / 35 km/Tag..."
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

          {/* Magischer Gegenstand */}
          {activeBuilderType === 'Magischer Gegenstand' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Magieschule & Ausrichtung</label>
                  <input
                    type="text"
                    value={editForm.details?.magicSchool || ''}
                    onChange={e => updateDetail('magicSchool', e.target.value)}
                    placeholder="z. B. Abjuration, Evokation, Nekromantie, Alchemie..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Manakosten & Aufladungen</label>
                  <input
                    type="text"
                    value={editForm.details?.charges || ''}
                    onChange={e => updateDetail('charges', e.target.value)}
                    placeholder="z. B. 3 Ladungen pro Tag, 15 Mana pro Nutzung..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Aktivierungsvoraussetzung</label>
                  <input
                    type="text"
                    value={editForm.details?.activationCost || ''}
                    onChange={e => updateDetail('activationCost', e.target.value)}
                    placeholder="z. B. Seelenbindung, Zauberwort, Reagenz..."
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
                  placeholder="Genaue Beschreibung der arkanen Wirkung, Verzauberung, Schutzfelder..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Handelsware */}
          {activeBuilderType === 'Handelsware' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Warengruppe</label>
                  <input
                    type="text"
                    value={editForm.details?.targetMarket || ''}
                    onChange={e => updateDetail('targetMarket', e.target.value)}
                    placeholder="z. B. Gewürze, Luxusgüter, Salz, Seidentuche..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Handelsspanne & Nachfrage</label>
                  <input
                    type="text"
                    value={editForm.details?.demandRegions || ''}
                    onChange={e => updateDetail('demandRegions', e.target.value)}
                    placeholder="z. B. Hohe Nachfrage in Städten, Mangelware..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Transportrisiko & Zölle</label>
                  <input
                    type="text"
                    value={editForm.details?.transportRisk || ''}
                    onChange={e => updateDetail('transportRisk', e.target.value)}
                    placeholder="z. B. Feuchtigkeitsempfindlich, Diebstahlrisiko..."
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
                  placeholder="Typische Karawanenrouten, Seehäfen, Zunftmonopole..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Dungeon-Fund */}
          {activeBuilderType === 'Dungeon-Fund' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Fundorttyp</label>
                  <input
                    type="text"
                    value={editForm.details?.dungeonSourceType || ''}
                    onChange={e => updateDetail('dungeonSourceType', e.target.value)}
                    placeholder="z. B. Schatztruhe, Bosskammer, Wandkristall..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Gefahrenstufe / Ebene</label>
                  <input
                    type="text"
                    value={editForm.details?.dungeonFloorLevel || ''}
                    onChange={e => updateDetail('dungeonFloorLevel', e.target.value)}
                    placeholder="z. B. Ebene 3, Tiefkrypta, Fallenkammer..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Bergungsvoraussetzung</label>
                  <input
                    type="text"
                    value={editForm.details?.dungeonAccessCondition || ''}
                    onChange={e => updateDetail('dungeonAccessCondition', e.target.value)}
                    placeholder="z. B. Dietrich Stufe 3, Bergbau-Spitzhacke..."
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
                  placeholder="Uralt verwittert, Arkane Versiegelung, Verfluchtes Relikt..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Monster-Beute & Drops */}
          {activeBuilderType === 'Monster-Beute' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Kreaturen-Herkunft / Monster-Art</label>
                  <input
                    type="text"
                    value={editForm.details?.creatureOrigin || ''}
                    onChange={e => updateDetail('creatureOrigin', e.target.value)}
                    placeholder="z. B. Drachenbrut, Höhlenspinne, Schattenwolf, Golem, Basilisk..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Beutegut-Verwertung</label>
                  <input
                    type="text"
                    value={editForm.details?.lootCategory || ''}
                    onChange={e => updateDetail('lootCategory', e.target.value)}
                    placeholder="z. B. Alchemie-Reagenz, Trophäe, Panzerungsmaterial, Giftgewinnung..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Drop-Seltenheit</label>
                  <input
                    type="text"
                    value={editForm.details?.dropRarity || ''}
                    onChange={e => updateDetail('dropRarity', e.target.value)}
                    placeholder="z. B. Selten (15%), Meistertrophäe, Gewöhnliche Beute..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Konservierung, Haltbarkeit & Besondere Eigenschaften
                </label>
                <AutoExpandingTextarea
                  minRows={2}
                  value={editForm.details?.specialProperties || ''}
                  onChange={e => updateDetail('specialProperties', e.target.value)}
                  placeholder="Muss frisch verarbeitet werden, Ausgekocht haltbar, Giftig bei Hautkontakt, Glühend..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Quest-/Story-Gegenstand */}
          {activeBuilderType === 'Quest-/Story-Gegenstand' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Rolle in der Handlung</label>
                  <input
                    type="text"
                    value={editForm.details?.questContext || ''}
                    onChange={e => updateDetail('questContext', e.target.value)}
                    placeholder="z. B. Schlüssel zum Portal, Beweisstück für Verrat..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Beständigkeit & Bindung</label>
                  <input
                    type="text"
                    value={editForm.details?.specialProperties || ''}
                    onChange={e => updateDetail('specialProperties', e.target.value)}
                    placeholder="z. B. Unzerstörbar, Einweg-Schlüssel, Seelengebunden..."
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
                  placeholder="Welches Wissen, welche Tür oder welches Ereignis schaltet dieser Gegenstand frei?..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. HERSTELLUNG & WIRTSCHAFT */}
        <div className="border-t border-slate-850 pt-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Herstellung, Wirtschaft & Wert
            </span>
            <span className="text-[11px] text-slate-400">
              Produktionskette, Handwerk, Betrieb & Marktpreis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                {activeBuilderType === 'Rohstoff'
                  ? 'Ausgangsressource / Vorkommen'
                  : activeBuilderType === 'Tier'
                  ? 'Aufzucht / Zuchtbedarf & Futter'
                  : activeBuilderType === 'Transportmittel'
                  ? 'Baukomponenten (Holz, Beschläge, Räder)'
                  : activeBuilderType === 'Nahrung'
                  ? 'Zutaten & Rezeptur'
                  : activeBuilderType === 'Landwirtschaft'
                  ? 'Ausgangssaat / Bodenart / Zuchtstamm'
                  : activeBuilderType === 'Baustoff'
                  ? 'Rohmaterialien (Kalk, Lehm, Sand, Holz)'
                  : activeBuilderType === 'Medizin / Alchemie'
                  ? 'Reagenzien, Kräuter & Trägerstoffe'
                  : activeBuilderType === 'Militärbedarf'
                  ? 'Materialbedarf & Fertigungsteile'
                  : activeBuilderType === 'Monster-Beute'
                  ? 'Kreaturen-Quelle & Beuteanteil'
                  : 'Rohstoffe (Benötigte Ausgangsstoffe & Rezeptur)'}
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.producedFrom || editForm.details?.craftingRecipe || ''}
                onChange={e => {
                  updateDetail('producedFrom', e.target.value);
                  updateDetail('craftingRecipe', e.target.value);
                }}
                placeholder={
                  activeBuilderType === 'Rohstoff'
                    ? 'z. B. Natürliche Ader im Erzgebirge, Flussbett...'
                    : activeBuilderType === 'Tier'
                    ? 'z. B. Fohlen aus Zucht, Heu, Hafer...'
                    : activeBuilderType === 'Transportmittel'
                    ? 'z. B. 20x Eichenbohlen, 4x Eisenräder...'
                    : activeBuilderType === 'Nahrung'
                    ? 'z. B. 500g Mehl, 1 Prise Salz, Quellwasser...'
                    : activeBuilderType === 'Landwirtschaft'
                    ? 'z. B. Auslese-Saatgut, Kompost, Schwarzerde...'
                    : activeBuilderType === 'Baustoff'
                    ? 'z. B. 100x Ton, Brennholz, Quarzsand...'
                    : activeBuilderType === 'Medizin / Alchemie'
                    ? 'z. B. 3x Sonnenkraut, Reinalkohol, Quellwasser...'
                    : activeBuilderType === 'Militärbedarf'
                    ? 'z. B. Eschenholz, geschmiedete Pfeilspitzen...'
                    : activeBuilderType === 'Monster-Beute'
                    ? 'z. B. Schuppen eines ausgewachsenen Schattendrachen...'
                    : 'z. B. 2x Eisenbarren, 1x Hartholzstiel, 1x Lederband...'
                }
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                {activeBuilderType === 'Rohstoff'
                  ? 'Verarbeitung zu Zwischenprodukten & Endwaren'
                  : activeBuilderType === 'Material'
                  ? 'Weiterverarbeitung zu Fertigwaren & Werkzeugen'
                  : activeBuilderType === 'Tier'
                  ? 'Erzeugnisse & Nutzung (Milch, Wolle, Reittier)'
                  : activeBuilderType === 'Landwirtschaft'
                  ? 'Ernteertrag -> Verarbeitung in Mühlen/Bäckereien'
                  : activeBuilderType === 'Baustoff'
                  ? 'Verwendung in Bauprojekten & Holding-Erweiterungen'
                  : activeBuilderType === 'Medizin / Alchemie'
                  ? 'Verwendung in Lazaretten, Alchemielaboren & Apotheken'
                  : activeBuilderType === 'Monster-Beute'
                  ? 'Veredelung zu Elixieren, Rüstungen & Trophäen'
                  : 'Produktionskette (Vorstufen & Weiterverarbeitung)'}
              </label>
              <AutoExpandingTextarea
                minRows={2}
                value={editForm.details?.processedInto || ''}
                onChange={e => updateDetail('processedInto', e.target.value)}
                placeholder={
                  activeBuilderType === 'Rohstoff'
                    ? 'z. B. Eisenerz -> Eisenbarren -> Waffen & Rüstungen...'
                    : activeBuilderType === 'Material'
                    ? 'z. B. Leder -> Rüstung / Eisenbarren -> Klingen...'
                    : activeBuilderType === 'Tier'
                    ? 'z. B. Fohlen -> Reitpferd -> Schlachtross...'
                    : activeBuilderType === 'Landwirtschaft'
                    ? 'z. B. Saatgut -> Weizen -> Mehl -> Brot...'
                    : activeBuilderType === 'Baustoff'
                    ? 'z. B. Mauerziegel -> Wehrmauer / Werkstattausbau...'
                    : activeBuilderType === 'Medizin / Alchemie'
                    ? 'z. B. Wundsalbe -> Notfall-Verbandskasten...'
                    : activeBuilderType === 'Monster-Beute'
                    ? 'z. B. Drachenschuppen -> Meisterharnisch...'
                    : 'z. B. Eisenerz -> Eisenbarren -> Waffe / Rohleder -> Leder -> Harnisch...'
                }
                className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                {activeBuilderType === 'Rohstoff'
                  ? 'Gewinnung durch Beruf'
                  : activeBuilderType === 'Tier'
                  ? 'Zuständiger Beruf'
                  : activeBuilderType === 'Landwirtschaft'
                  ? 'Zuständiger Agrarberuf'
                  : activeBuilderType === 'Monster-Beute'
                  ? 'Erlegende / Bergende Zunft'
                  : 'Zuständiger Beruf / Handwerker'}
              </label>
              <input
                type="text"
                list="crafting-professions-list"
                value={editForm.details?.requiredProfession || editForm.details?.craftProfession || ''}
                onChange={e => {
                  updateDetail('requiredProfession', e.target.value);
                  updateDetail('craftProfession', e.target.value);
                }}
                placeholder="z. B. Schmied, Schneider, Bergmann, Alchemist, Bauer, Jäger..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="crafting-professions-list">
                {CRAFTING_PROFESSIONS.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                {activeBuilderType === 'Rohstoff'
                  ? 'Abbaustätte / Förderbetrieb'
                  : activeBuilderType === 'Tier'
                  ? 'Haltung / Gehege / Stallung'
                  : activeBuilderType === 'Landwirtschaft'
                  ? 'Anbaufläche / Gutshof / Feld'
                  : activeBuilderType === 'Baustoff'
                  ? 'Ziegelei / Steinbruch / Sägewerk'
                  : activeBuilderType === 'Medizin / Alchemie'
                  ? 'Alchemielabor / Apotheke / Kräutergarten'
                  : 'Herstellungsbetrieb / Werkstatt'}
              </label>
              <input
                type="text"
                list="producing-holding-types-list"
                value={editForm.details?.productionHoldingType || ''}
                onChange={e => updateDetail('productionHoldingType', e.target.value)}
                placeholder="z. B. Schmiede, Ziegelei, Mine, Sägewerk, Weberei, Bauernhof..."
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <datalist id="producing-holding-types-list">
                {TYPICAL_PRODUCING_HOLDING_TYPES.map(h => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Handelswert (Richtpreis)
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
                  Kupfer pro {editForm.details?.unit || builderMeta.defaultUnit}
                </span>
              </div>
            </div>
          </div>

          {/* Anbindung an Betriebsstandort */}
          {availableHoldings.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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

        {/* 4. VERWENDUNG & ANWENDUNGSBEREICH */}
        <div className="border-t border-slate-850 pt-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Verwendung & Anwendungsbereiche
            </span>
            <span className="text-[11px] text-slate-400">
              Einsatzbereiche in der Spielwelt
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
            {ITEM_USE_DOMAINS.map(domain => {
              const isDomainActive = activeDomains.includes(domain.id);
              return (
                <button
                  key={domain.id}
                  type="button"
                  onClick={() => toggleDomain(domain.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                    isDomainActive
                      ? 'bg-indigo-950/80 text-indigo-200 border-indigo-600 shadow-sm ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-200">{domain.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                        isDomainActive
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isDomainActive && <Check className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 leading-relaxed">
                    {domain.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1">
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

        {/* 5. PROGRESSION & BEHERRSCHUNG */}
        <div className="border-t border-slate-850 pt-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Progression & Beherrschung
            </span>
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
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  Gegenstands-Entwicklung & Stufenskalierung
                </div>
                <div className="text-[11px] text-slate-400">
                  Ermöglicht Stufenaufstiege, EP-Zuwachs oder Trainingsfortschritt für diesen Gegenstand.
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200 shrink-0">
              <input
                type="checkbox"
                checked={hasProgression}
                onChange={e => updateDetail('hasProgression', e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              Entwicklung aktivieren
            </label>
          </div>

          {hasProgression && (
            <div className="flex flex-col gap-4 bg-slate-900/40 border border-slate-800/80 rounded-xl p-3.5">
              {/* EP LOGIC UI */}
              {activeProgressionLogic === 'ep' && (
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">
                          {editForm.details?.progressionLevel || `Stufe ${currentLevel}`}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({currentXp} / {xpToNextLevel} EP - {xpPercent}%)
                        </span>
                      </div>
                      <span className="text-[11px] text-indigo-400 font-medium">
                        Noch {Math.max(0, xpToNextLevel - currentXp)} EP bis Stufe {currentLevel + 1}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${xpPercent}%` }}
                      ></div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddXp(10)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-md text-[11px] font-medium transition"
                      >
                        +10 EP
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

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Stufen-Zuwachs & Boni je Level
                    </label>
                    <AutoExpandingTextarea
                      minRows={2}
                      value={editForm.details?.scalingWithLevel || ''}
                      onChange={e => updateDetail('scalingWithLevel', e.target.value)}
                      placeholder="z. B. +2 Angriffskraft und +1 Parade je Stufe..."
                      className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TRAINING LOGIC UI */}
              {activeProgressionLogic === 'training' && (
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        Übungseinheiten zur nächsten Meisterschaftsstufe ({trainingUnits} / 4 Einheiten):
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
                      Übungsanleitung & Meisterschafts-Hinweise
                    </label>
                    <AutoExpandingTextarea
                      minRows={2}
                      value={editForm.details?.trainingNotes || ''}
                      onChange={e => updateDetail('trainingNotes', e.target.value)}
                      placeholder="z. B. Gezielte Hieb- und Parierübungen verbessern die Handhabung..."
                      className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Träger-Anforderung & Beherrschung */}
              <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Beherrschungs-Voraussetzung & Träger-Anforderung
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Vorausgesetzte Fähigkeit / Beherrschung
                    </label>
                    <input
                      type="text"
                      value={editForm.details?.requiredSkill || editForm.details?.requiredWeaponMasteryName || ''}
                      onChange={e => {
                        updateDetail('requiredSkill', e.target.value);
                        updateDetail('requiredWeaponMasteryName', e.target.value);
                      }}
                      placeholder="z. B. Einhandschwerter, Reitkunst, Arkanes Wissen..."
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Erforderlicher Rang
                    </label>
                    <select
                      value={editForm.details?.requiredMasteryRank || 'Keine'}
                      onChange={e => updateDetail('requiredMasteryRank', e.target.value)}
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Keine">Keine Voraussetzung</option>
                      <option value="Novize">Novize / Lehrling</option>
                      <option value="Geselle">Geselle</option>
                      <option value="Experte">Experte</option>
                      <option value="Meister">Meister</option>
                      <option value="Großmeister">Großmeister</option>
                    </select>
                  </div>

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
                    placeholder="z. B. -30% Angriffsgeschwindigkeit, doppelter Ausdauerverbrauch..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. HERKUNFT & FUNDQUELLE */}
        <div className="border-t border-slate-850 pt-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Herkunft & Fundquelle
            </span>
            <span className="text-[11px] text-slate-400">
              Quelle, Vorkommen & Ursprung
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {ITEM_ORIGIN_TYPES.map(origin => {
              const isSelected = activeOriginType === origin.id;
              return (
                <button
                  key={origin.id}
                  type="button"
                  onClick={() => handleSelectOriginType(origin.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-slate-800 text-slate-100 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-200 capitalize">
                      {origin.label}
                    </span>
                    {isSelected ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-600/80 text-indigo-300 font-semibold shrink-0">
                        Gewählt
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 leading-relaxed">
                    {origin.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Context fields based on selected origin */}
          {activeOriginType === 'normal_produziert' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="z. B. 4 Arbeitsstunden, 3 Tage..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {activeOriginType === 'natuerliches_vorkommen' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  placeholder="z. B. Kräutersammeln im Herbst, Bergbau, Jagd..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {activeOriginType === 'dungeon' && (
            <div className="flex flex-col gap-3">
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
            <div className="flex flex-col gap-3">
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
                    placeholder="z. B. Fell, Giftbeutel, Zähne, Kristallkern..."
                    className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-300">Drop-Chance (%)</label>
                  <input
                    type="text"
                    value={editForm.details?.dropChance || '50%'}
                    onChange={e => updateDetail('dropChance', e.target.value)}
                    placeholder="z. B. 75%, 100%, 15%..."
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Quest / Auftraggeber</label>
                <input
                  type="text"
                  value={editForm.details?.questContext || ''}
                  onChange={e => updateDetail('questContext', e.target.value)}
                  placeholder="z. B. Belohnung von Fürst Vaelin, Stadtwache..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Übergabebedingung</label>
                <input
                  type="text"
                  value={editForm.details?.specialProperties || ''}
                  onChange={e => updateDetail('specialProperties', e.target.value)}
                  placeholder="z. B. Nach Abschluss der Hauptmission..."
                  className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {activeOriginType === 'einzigartiger_fund' && (
            <div className="flex flex-col gap-1">
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

      </div>

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <div className="text-[11px] text-slate-400">
          Alle Gegenstandsdaten werden konsistent in der persistenten Spielwelt gespeichert.
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
