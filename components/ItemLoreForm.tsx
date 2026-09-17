// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import { 
  LoreEntry, 
  WorldSetting, 
  EconomyHolding, 
  EconomyResource 
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { 
  ITEM_MAIN_CATEGORIES, 
  ItemMainCategory, 
  STANDARD_UNITS, 
  RARITY_LEVELS, 
  ITEM_CONDITION_OPTIONS,
  TYPICAL_PRODUCING_HOLDING_TYPES,
  CRAFTING_PROFESSIONS,
  MILITARY_SUPPLY_ROLES
} from '../lib/itemCategoriesData';
import { 
  Sparkles, 
  Save, 
  Trash2, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Package, 
  Layers, 
  Hammer, 
  Coins,
  Crosshair,
  Compass,
  Shield,
  ArrowRight,
  Boxes,
  Database,
  Workflow
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { MonsterLootItem } from '../types';

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

  // Active Category & Subcategory resolution
  const activeMainCat: ItemMainCategory = (editForm.details?.mainCategory as ItemMainCategory) || 'Rohstoffe';
  const categoryMeta = ITEM_MAIN_CATEGORIES.find(c => c.id === activeMainCat) || ITEM_MAIN_CATEGORIES[0];
  const activeSubCat: string = editForm.details?.subCategory || (categoryMeta.subcategories ? categoryMeta.subcategories[0] : '');

  // Animal mode (Species vs Individual)
  const isAnimalIndividual = editForm.details?.animalTypeClassification === 'individual';

  // Ensure initial defaults when category changes
  const handleMainCategoryChange = (newCat: ItemMainCategory) => {
    const meta = ITEM_MAIN_CATEGORIES.find(c => c.id === newCat) || ITEM_MAIN_CATEGORIES[0];
    const newSubCat = meta.subcategories && meta.subcategories.length > 0 ? meta.subcategories[0] : '';
    setEditForm(prev => ({
      ...prev,
      category: 'Gegenstände',
      details: {
        ...(prev.details || {}),
        mainCategory: newCat,
        subCategory: newSubCat,
        itemType: newCat,
        unit: prev.details?.unit || meta.defaultUnit,
        pricePerUnit: prev.details?.pricePerUnit !== undefined ? prev.details.pricePerUnit : meta.defaultPrice
      }
    }));
  };

  const handleSubCategoryChange = (newSub: string) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        subCategory: newSub
      }
    }));
  };

  const updateDetail = (key: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        [key]: value
      }
    }));
  };

  // Live Economy Connection helper
  const availableHoldings: EconomyHolding[] = world?.economyConfig?.holdings || [];

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
    const unit = editForm.details?.unit || categoryMeta.defaultUnit || 'Stück';
    const pricePerUnit = Number(editForm.details?.pricePerUnit) || categoryMeta.defaultPrice || 10;
    const condition = editForm.details?.condition || 'gut';

    const existingResources = holding.resources || [];
    const existingIdx = existingResources.findIndex(r => r.name.toLowerCase() === itemName.toLowerCase());

    let updatedResources: EconomyResource[];
    if (existingIdx >= 0) {
      updatedResources = existingResources.map((r, i) => i === existingIdx ? {
        ...r,
        amount,
        maxCapacity,
        unit,
        pricePerUnit,
        condition,
        category: categoryMeta.economyCategory as any,
        notes: editForm.description || r.notes
      } : r);
    } else {
      const newRes: EconomyResource = {
        id: `res-${holding.id}-${Date.now()}`,
        name: itemName,
        category: categoryMeta.economyCategory as any,
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
    setSyncNotice(`Im Betriebsinventar von "${holding.name}" hinterlegt (${amount} ${unit}).`);
    setTimeout(() => setSyncNotice(null), 5000);
  };

  const handleSyncToMonsterCodex = () => {
    if (!onUpdateLore) {
      setSyncNotice('Keine Aktualisierungsfunktion verfügbar.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const monsterTarget = editForm.details?.droppedByMonsterName || editForm.details?.chainMonsterOrigin;
    if (!monsterTarget) {
      setSyncNotice('Bitte wähle zuerst ein Monster aus oder gib einen Monsternamen ein.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const targetMonster = monsterEntries.find(m => m.id === editForm.details?.droppedByMonsterId || m.title?.toLowerCase() === monsterTarget.toLowerCase());
    const itemName = editForm.title?.trim() || 'Gegenstand';

    if (targetMonster) {
      const existingLoot: MonsterLootItem[] = targetMonster.details?.lootTable || [];
      const isAlreadyIn = existingLoot.some(l => l.itemName.toLowerCase() === itemName.toLowerCase());
      
      const newLootEntry: MonsterLootItem = {
        id: `loot-${Date.now()}`,
        itemName,
        itemId: editForm.id || `item-${Date.now()}`,
        category: editForm.details?.mainCategory || 'Rohstoffe',
        dropChance: typeof editForm.details?.dropChance === 'number' ? editForm.details.dropChance : (parseInt(String(editForm.details?.dropChance || '50'), 10) || 50),
        isGuaranteed: editForm.details?.lootType === 'Standardbeute' || String(editForm.details?.dropChance).includes('100'),
        minQuantity: 1,
        maxQuantity: parseInt(String(editForm.details?.dropQuantityRange || '1').split('-').pop() || '1', 10) || 1,
        unit: editForm.details?.unit || 'Stück',
        harvestCondition: editForm.details?.dropConditions || '',
        partType: (editForm.details?.harvestedBodyPart as any) || 'Sonstiges',
        notes: `Ausbeute: ${editForm.details?.harvestedBodyPart || 'Körperteil'}`
      };

      const updatedLoot = isAlreadyIn
        ? existingLoot.map(l => l.itemName.toLowerCase() === itemName.toLowerCase() ? { ...l, ...newLootEntry } : l)
        : [...existingLoot, newLootEntry];

      const updatedLore = lore.map(l => l.id === targetMonster.id ? {
        ...l,
        details: {
          ...(l.details || {}),
          lootTable: updatedLoot,
          guaranteedDrops: updatedLoot.filter(x => x.isGuaranteed).map(x => x.itemName).join(', ') || l.details?.guaranteedDrops,
          rareDrops: updatedLoot.filter(x => !x.isGuaranteed).map(x => `${x.itemName} (${x.dropChance}%)`).join(', ') || l.details?.rareDrops
        }
      } : l);

      onUpdateLore(updatedLore);
      updateDetail('droppedByMonsterId', targetMonster.id);
      updateDetail('droppedByMonsterName', targetMonster.title);
      setSyncNotice(`"${itemName}" erfolgreich im Monster-Codex bei "${targetMonster.title}" hinterlegt.`);
      setTimeout(() => setSyncNotice(null), 5000);
    } else {
      setSyncNotice(`Monster "${monsterTarget}" wurde nicht im Codex gefunden. Bitte zuerst im Monster-Codex anlegen.`);
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  const handleSyncToDungeonCodex = () => {
    if (!onUpdateLore) {
      setSyncNotice('Keine Aktualisierungsfunktion verfügbar.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const dungeonTarget = editForm.details?.dungeonLocationName || editForm.details?.chainDungeonOrigin;
    if (!dungeonTarget) {
      setSyncNotice('Bitte wähle zuerst einen Dungeon oder Ort aus.');
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    const targetDungeon = locationEntries.find(loc => loc.id === editForm.details?.dungeonLocationId || loc.title?.toLowerCase() === dungeonTarget.toLowerCase());
    const itemName = editForm.title?.trim() || 'Gegenstand';

    if (targetDungeon) {
      const existingResources = targetDungeon.details?.economicFocus || '';
      const newFocus = existingResources ? (existingResources.includes(itemName) ? existingResources : `${existingResources}, ${itemName}`) : itemName;
      
      const updatedLore = lore.map(l => l.id === targetDungeon.id ? {
        ...l,
        details: {
          ...(l.details || {}),
          economicFocus: newFocus,
          landmarks: l.details?.landmarks ? (l.details.landmarks.includes(itemName) ? l.details.landmarks : `${l.details.landmarks}; Vorkommen: ${itemName} (${editForm.details?.dungeonFloorLevel || 'Ebene 1'})`) : `Vorkommen: ${itemName}`
        }
      } : l);

      onUpdateLore(updatedLore);
      updateDetail('dungeonLocationId', targetDungeon.id);
      updateDetail('dungeonLocationName', targetDungeon.title);
      setSyncNotice(`"${itemName}" erfolgreich im Orts-/Dungeon-Codex bei "${targetDungeon.title}" hinterlegt.`);
      setTimeout(() => setSyncNotice(null), 5000);
    } else {
      setSyncNotice(`Ort/Dungeon "${dungeonTarget}" wurde nicht im Codex gefunden. Bitte zuerst im Orts-Codex anlegen.`);
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
          if (!mergedDetails.mainCategory) {
            mergedDetails.mainCategory = activeMainCat;
          }
          return {
            ...prev,
            title: appendMode && prev.title ? prev.title : (result.title || prev.title || smartFillInput.slice(0, 30)),
            description: appendMode && prev.description && result.description 
              ? `${prev.description}\n\n${result.description}` 
              : (result.description || prev.description),
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
          <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-700/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              {isEditing ? 'Gegenstand bearbeiten' : 'Neuer Eintrag: Gegenstände'}
            </h2>
            <p className="text-xs text-slate-400">
              Kategorisierung, technische Eigenschaften, Produktionsketten und direkte Anbindung an Wirtschaft und Betriebe.
            </p>
          </div>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => onDelete(isEditing)}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eintrag löschen
          </button>
        )}
      </div>

      {/* Main Categories Navigation */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Hauptkategorie auswählen
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ITEM_MAIN_CATEGORIES.map(cat => {
            const isSelected = activeMainCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleMainCategoryChange(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40 font-bold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subcategory Pills if present */}
      {categoryMeta.hasSubcategories && categoryMeta.subcategories && categoryMeta.subcategories.length > 0 && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Unterkategorie ({categoryMeta.label})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categoryMeta.subcategories.map(sub => {
              const isSelected = activeSubCat === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleSubCategoryChange(sub)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Smart Fill Box */}
      <div className="bg-gradient-to-r from-indigo-950/30 via-slate-950/50 to-indigo-950/20 border border-indigo-500/20 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Automatisch ausfüllen (Gegenstand / {activeMainCat})
          </span>
          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={appendMode}
              onChange={e => setAppendMode(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
            />
            Bestehende Daten ergänzen
          </label>
        </div>

        <div className="flex gap-2">
          <AutoExpandingTextarea
            value={smartFillInput}
            onChange={e => setSmartFillInput(e.target.value)}
            placeholder={`Beschreibe den Gegenstand (Herkunft, Material, Funktion, Produktionskette, Betrieb oder Verwendungszweck)...`}
            minRows={2}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            disabled={isSmartFilling || !smartFillInput.trim()}
            onClick={handleSmartFill}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-end shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isSmartFilling ? 'Generiere...' : 'Ausfüllen'}
          </button>
        </div>
        {smartFillError && (
          <span className="text-xs text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {smartFillError}
          </span>
        )}
      </div>

      {/* 1. Basis- & Stammdaten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Titel / Bezeichnung des Gegenstands
          </label>
          <input
            type="text"
            value={editForm.title || ''}
            onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="z.B. Eisenerz, Damaszener-Langschwert, Festtagskleid, Weizenkorn..."
            className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 outline-none focus:border-amber-500 font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Seltenheitsstufe
            </label>
            <select
              value={editForm.details?.rarity || RARITY_LEVELS[0]}
              onChange={e => updateDetail('rarity', e.target.value)}
              className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            >
              {RARITY_LEVELS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Einzigartigkeit
            </label>
            <select
              value={editForm.details?.isUnique || 'Massenware / Standard'}
              onChange={e => updateDetail('isUnique', e.target.value)}
              className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            >
              <option value="Massenware / Standard">Massenware / Standard</option>
              <option value="Regionale Spezialität">Regionale Spezialität</option>
              <option value="Seltenes Einzelstück">Seltenes Einzelstück</option>
              <option value="Unikat / Legendär">Unikat / Legendär</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Hauptbeschreibung & Beschaffenheit */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Hauptbeschreibung &amp; Beschaffenheit
        </label>
        <AutoExpandingTextarea
          value={editForm.description || ''}
          onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detaillierte Beschreibung des Gegenstands, Aussehen, Textur, Besonderheiten..."
          minRows={3}
          className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 outline-none focus:border-amber-500"
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. KATEGORIE-SPEZIFISCHE DETAILFORMULARE */}
      {/* ========================================================================= */}

      {/* 1. ROHSTOFFE */}
      {activeMainCat === 'Rohstoffe' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Spezifische Rohstoff-Eigenschaften ({activeSubCat || 'Rohstoff'})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Abbau- &amp; Vorkommensort</label>
              <input
                type="text"
                value={editForm.details?.originHabitat || ''}
                onChange={e => updateDetail('originHabitat', e.target.value)}
                placeholder="z.B. Tiefer Stollen, Flussbett, Hochgebirge"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reinheit / Gütegrad</label>
              <input
                type="text"
                value={editForm.details?.purity || ''}
                onChange={e => updateDetail('purity', e.target.value)}
                placeholder="z.B. Gediegen, Unrein, Hohe Reinheit"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vorkommenshäufigkeit</label>
              <input
                type="text"
                value={editForm.details?.abundance || ''}
                onChange={e => updateDetail('abundance', e.target.value)}
                placeholder="z.B. Reichhaltig, Mäßig, Rar"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gewinnungsmethode &amp; Werkzeugbedarf</label>
              <input
                type="text"
                value={editForm.details?.extractionMethod || ''}
                onChange={e => updateDetail('extractionMethod', e.target.value)}
                placeholder="z.B. Tiefbergbau mit Spitzhacken, Erntesichel, Reusenfischerei"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Typische Weiterverarbeitung</label>
              <input
                type="text"
                value={editForm.details?.processingTarget || ''}
                onChange={e => updateDetail('processingTarget', e.target.value)}
                placeholder="z.B. Verhüttung zu Eisenbarren, Gerberei, Kräutersud"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. MATERIALIEN & ZWISCHENPRODUKTE */}
      {activeMainCat === 'Materialien & Zwischenprodukte' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Material- &amp; Halbzeug-Details ({activeSubCat || 'Material'})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ausgangs-Rohstoff</label>
              <input
                type="text"
                value={editForm.details?.baseRawMaterial || ''}
                onChange={e => updateDetail('baseRawMaterial', e.target.value)}
                placeholder="z.B. Eisenerz, Eichenholz, Flachsfaser"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Veredelungsgrad / Stufe</label>
              <input
                type="text"
                value={editForm.details?.refinementGrade || ''}
                onChange={e => updateDetail('refinementGrade', e.target.value)}
                placeholder="z.B. Rohling, Halbfabrikat, Gehärtet, Legiert"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Materialgüte &amp; Festigkeit</label>
              <input
                type="text"
                value={editForm.details?.materialQuality || ''}
                onChange={e => updateDetail('materialQuality', e.target.value)}
                placeholder="z.B. Meisterlich gehärtet, Bruchsicher"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Einsatzbereich in Handwerk &amp; Manufaktur</label>
            <input
              type="text"
              value={editForm.details?.applicationArea || ''}
              onChange={e => updateDetail('applicationArea', e.target.value)}
              placeholder="z.B. Klingenfertigung in Waffenschmiede, Schiffsbau, Rüstungsleder"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      )}

      {/* 3. PRODUKTE */}
      {activeMainCat === 'Produkte' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Produkteigenschaften ({activeSubCat || 'Produkt'})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rezeptur / Materialbedarf</label>
              <input
                type="text"
                value={editForm.details?.craftingRecipe || ''}
                onChange={e => updateDetail('craftingRecipe', e.target.value)}
                placeholder="z.B. 2x Eisenbarren, 1x Holzbrett, 1x Lederband"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Zielgruppe &amp; Marktsegment</label>
              <input
                type="text"
                value={editForm.details?.targetMarket || ''}
                onChange={e => updateDetail('targetMarket', e.target.value)}
                placeholder="z.B. Bürger, Händler, Abenteurer, Adelshaushalte"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. ALLTAGS- & HAUSHALTSGEGENSTÄNDE */}
      {activeMainCat === 'Alltags- & Haushaltsgegenstände' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Alltags- &amp; Haushalts-Parameter ({activeSubCat || 'Gebrauchsartikel'})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Haushaltsfunktion / Verwendungszweck</label>
              <input
                type="text"
                value={editForm.details?.householdFunction || ''}
                onChange={e => updateDetail('householdFunction', e.target.value)}
                placeholder="z.B. Kochen, Beleuchtung, Aufbewahrung, Körperpflege"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Material &amp; Fertigung</label>
              <input
                type="text"
                value={editForm.details?.householdMaterial || ''}
                onChange={e => updateDetail('householdMaterial', e.target.value)}
                placeholder="z.B. Ton, Gusseisen, Zinn, gewachstes Leinen"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Langlebigkeit &amp; Abnutzung</label>
              <input
                type="text"
                value={editForm.details?.durability || ''}
                onChange={e => updateDetail('durability', e.target.value)}
                placeholder="z.B. Jahrelang haltbar, Verbrauchsartikel"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. NAHRUNG */}
      {activeMainCat === 'Nahrung' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Nahrungs- &amp; Verpflegungsdetails
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nahrungstyp</label>
              <input
                type="text"
                value={editForm.details?.foodType || ''}
                onChange={e => updateDetail('foodType', e.target.value)}
                placeholder="z.B. Reise-Ration, Dauerwurst, Festtagsbraten, Starkbier"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sättigungs- &amp; Nährwert</label>
              <input
                type="text"
                value={editForm.details?.nutritionValue || ''}
                onChange={e => updateDetail('nutritionValue', e.target.value)}
                placeholder="z.B. 1 Tagesration, Hohe Ausdauer, Sättigend"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Haltbarkeit &amp; Verderblichkeit</label>
              <input
                type="text"
                value={editForm.details?.perishability || ''}
                onChange={e => updateDetail('perishability', e.target.value)}
                placeholder="z.B. 3 Tage frisch, 6 Monate gedörrt, Haltbar in Salzlake"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verzehreffekt / Zusatzwirkung</label>
            <input
              type="text"
              value={editForm.details?.consumptionEffect || ''}
              onChange={e => updateDetail('consumptionEffect', e.target.value)}
              placeholder="z.B. Lindert Erschöpfung, Wärmt bei Kälte, Leichte Trunkenheit"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      )}

      {/* 6. KLEIDUNG & TEXTILIEN */}
      {activeMainCat === 'Kleidung & Textilien' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Kleidungs- &amp; Textil-Eigenschaften
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ausrüstungs-Slot / Kleidungsart</label>
              <input
                type="text"
                value={editForm.details?.clothingSlot || ''}
                onChange={e => updateDetail('clothingSlot', e.target.value)}
                placeholder="z.B. Gewand, Mantel, Arbeitskluft, Stiefel, Hut"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stoff- &amp; Materialart</label>
              <input
                type="text"
                value={editForm.details?.fabricType || ''}
                onChange={e => updateDetail('fabricType', e.target.value)}
                placeholder="z.B. Grobleinen, Schafwolle, Brokat, Pelzbesatz"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sozialer Status / Wirkung</label>
              <input
                type="text"
                value={editForm.details?.socialStatus || ''}
                onChange={e => updateDetail('socialStatus', e.target.value)}
                placeholder="z.B. Handwerkerstand, Adelsgewand, Bettlerkluft"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wetterschutz &amp; Tragekomfort</label>
            <input
              type="text"
              value={editForm.details?.weatherProtection || ''}
              onChange={e => updateDetail('weatherProtection', e.target.value)}
              placeholder="z.B. Starker Kälteschutz, Wasserabweisend, Leicht & Atmungsaktiv"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      )}

      {/* 7. WAFFEN */}
      {activeMainCat === 'Waffen' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Waffentechnische Werte &amp; Kampfprofil
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Waffentyp</label>
              <input
                type="text"
                value={editForm.details?.weaponType || ''}
                onChange={e => updateDetail('weaponType', e.target.value)}
                placeholder="z.B. Langschwert, Kriegshammer, Kompositbogen"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Schadensart</label>
              <input
                type="text"
                value={editForm.details?.damageType || ''}
                onChange={e => updateDetail('damageType', e.target.value)}
                placeholder="z.B. Hieb, Stich, Wucht, Magisch"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Schadenswert / Kraft</label>
              <input
                type="text"
                value={editForm.details?.damageValue || ''}
                onChange={e => updateDetail('damageValue', e.target.value)}
                placeholder="z.B. 1W8+3, +4 Durchschlag"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reichweite &amp; Führung</label>
              <input
                type="text"
                value={editForm.details?.rangeCategory || ''}
                onChange={e => updateDetail('rangeCategory', e.target.value)}
                placeholder="z.B. Nahkampf (Einhand), 40m Fernkampf"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Klingenmaterial &amp; Schmiedequalität</label>
              <input
                type="text"
                value={editForm.details?.materialQuality || ''}
                onChange={e => updateDetail('materialQuality', e.target.value)}
                placeholder="z.B. Damaszener-Faltstahl, Gehärteter Zwergenstahl"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Besondere Kampfmanöver / Eigenschaften</label>
              <input
                type="text"
                value={editForm.details?.effects || editForm.details?.specialProperties || ''}
                onChange={e => updateDetail('specialProperties', e.target.value)}
                placeholder="z.B. Rüstungsbrechend, Paradebonus +2, Schneller Zug"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 8. RÜSTUNG & SCHUTZAUSRÜSTUNG */}
      {activeMainCat === 'Rüstung & Schutzausrüstung' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Rüstungsschutz &amp; Schutzprofil
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rüstungszone / Typ</label>
              <input
                type="text"
                value={editForm.details?.armorSlot || ''}
                onChange={e => updateDetail('armorSlot', e.target.value)}
                placeholder="z.B. Vollplatte, Brustpanzer, Turmschild, Helm"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rüstungsschutz (RS / Schutzwert)</label>
              <input
                type="text"
                value={editForm.details?.defense || editForm.details?.armorValue || ''}
                onChange={e => updateDetail('armorValue', e.target.value)}
                placeholder="z.B. RS 6, Blockwert +4"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gewicht &amp; Behinderung</label>
              <input
                type="text"
                value={editForm.details?.encumbrance || ''}
                onChange={e => updateDetail('encumbrance', e.target.value)}
                placeholder="z.B. Mittelschwer (BE 2), 14 kg"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Spezifische Schutzresistenzen</label>
            <input
              type="text"
              value={editForm.details?.resistances || ''}
              onChange={e => updateDetail('resistances', e.target.value)}
              placeholder="z.B. Pfeilschutz, Feuerresistent, Hiebgedämpft durch Gambeson"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      )}

      {/* 9. WERKZEUGE */}
      {activeMainCat === 'Werkzeuge' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Werkzeug- &amp; Handwerksdaten
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Handwerksberuf / Einsatzbereich</label>
              <input
                type="text"
                value={editForm.details?.craftProfession || ''}
                onChange={e => updateDetail('craftProfession', e.target.value)}
                placeholder="z.B. Schmiedehandwerk, Bergbau, Alchemie"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Präzisions- &amp; Effizienz-Bonus</label>
              <input
                type="text"
                value={editForm.details?.efficiencyBonus || ''}
                onChange={e => updateDetail('efficiencyBonus', e.target.value)}
                placeholder="z.B. +15% Schmiedequalität, Zeitersparnis"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Haltbarkeit &amp; Abnutzung</label>
              <input
                type="text"
                value={editForm.details?.durability || ''}
                onChange={e => updateDetail('durability', e.target.value)}
                placeholder="z.B. Verschleißfest, Wartung alle 6 Monate"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 10. LANDWIRTSCHAFT */}
      {activeMainCat === 'Landwirtschaft' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Agrar- &amp; Feldbau-Parameter
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Feldfrucht / Zielkultur</label>
              <input
                type="text"
                value={editForm.details?.cropType || ''}
                onChange={e => updateDetail('cropType', e.target.value)}
                placeholder="z.B. Sommerweizen, Braugerste, Flachs, Hopfen"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wachstumsdauer &amp; Erntezeit</label>
              <input
                type="text"
                value={editForm.details?.growthCycle || ''}
                onChange={e => updateDetail('growthCycle', e.target.value)}
                placeholder="z.B. 45 Tage, Spätherbst, 1 Vegetationsperiode"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ertragsfaktor</label>
              <input
                type="text"
                value={editForm.details?.yieldMultiplier || ''}
                onChange={e => updateDetail('yieldMultiplier', e.target.value)}
                placeholder="z.B. 1:8 Kornertrag, Hohe Ausbeute"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 11. TIERE (Art / Rasse vs Einzeltier) */}
      {activeMainCat === 'Tiere' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Tierhaltung &amp; Nutzvieh-Eigenschaften
            </span>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => updateDetail('animalTypeClassification', 'species')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  !isAnimalIndividual ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tierart / Rasse
              </button>
              <button
                type="button"
                onClick={() => updateDetail('animalTypeClassification', 'individual')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  isAnimalIndividual ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Konkretes Einzeltier
              </button>
            </div>
          </div>

          {/* Einzeltier Form */}
          {isAnimalIndividual ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Name des Tieres</label>
                  <input
                    type="text"
                    value={editForm.details?.animalName || ''}
                    onChange={e => updateDetail('animalName', e.target.value)}
                    placeholder="z.B. Schattenwind, Bello, Donnerhuf"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Alter &amp; Geschlecht</label>
                  <input
                    type="text"
                    value={editForm.details?.animalAge || ''}
                    onChange={e => updateDetail('animalAge', e.target.value)}
                    placeholder="z.B. 5 Jahre, Hengst / Stute"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Besitzer / Halter</label>
                  <input
                    type="text"
                    value={editForm.details?.animalOwner || ''}
                    onChange={e => updateDetail('animalOwner', e.target.value)}
                    placeholder="z.B. Graf Aldor, Gestütsmeister, Spieler"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ausbildungsstand &amp; Dressur</label>
                  <input
                    type="text"
                    value={editForm.details?.animalTraining || ''}
                    onChange={e => updateDetail('animalTraining', e.target.value)}
                    placeholder="z.B. Schlachtross-Ausbildung, Jagdhund-Apportieren, Rohling"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Besondere Eigenschaften &amp; Bindung</label>
                  <input
                    type="text"
                    value={editForm.details?.animalPersonality || ''}
                    onChange={e => updateDetail('animalPersonality', e.target.value)}
                    placeholder="z.B. Schreckhaft bei Feuer, Treu ergeben, Sehr schnell"
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Tierart / Rasse Form */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rasse &amp; Verwendungszweck</label>
                <input
                  type="text"
                  value={editForm.details?.animalRole || ''}
                  onChange={e => updateDetail('animalRole', e.target.value)}
                  placeholder="z.B. Streitross, Zugochse, Schlachtvieh, Wachhund"
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Futter- &amp; Pflegekosten pro Tag</label>
                <input
                  type="text"
                  value={editForm.details?.dailyFeedCost || ''}
                  onChange={e => updateDetail('dailyFeedCost', e.target.value)}
                  placeholder="z.B. 0.5 Silber / Weidegang"
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Traglast / Zugkraft / Tempo</label>
                <input
                  type="text"
                  value={editForm.details?.animalCapacity || ''}
                  onChange={e => updateDetail('animalCapacity', e.target.value)}
                  placeholder="z.B. 150 kg Traglast, Hohe Zugkraft"
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 12. TRANSPORTMITTEL */}
      {activeMainCat === 'Transportmittel' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Fahrzeug- &amp; Transportdaten
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fahrzeugtyp</label>
              <input
                type="text"
                value={editForm.details?.vehicleType || ''}
                onChange={e => updateDetail('vehicleType', e.target.value)}
                placeholder="z.B. Planwagen, Lastkahn, Postkutsche, Karavelle"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Passagierkapazität</label>
              <input
                type="text"
                value={editForm.details?.passengerCapacity || ''}
                onChange={e => updateDetail('passengerCapacity', e.target.value)}
                placeholder="z.B. 6 Personen, 20 Passagiere"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Frachtkapazität (Nutzlast)</label>
              <input
                type="text"
                value={editForm.details?.cargoCapacity || ''}
                onChange={e => updateDetail('cargoCapacity', e.target.value)}
                placeholder="z.B. 1.5 Tonnen, 40 Kisten"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Antrieb &amp; Bespannung</label>
              <input
                type="text"
                value={editForm.details?.propulsion || ''}
                onChange={e => updateDetail('propulsion', e.target.value)}
                placeholder="z.B. 2 Zugochsen, 4 Pferde, Rahsegel"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Geschwindigkeit &amp; Reichweite</label>
              <input
                type="text"
                value={editForm.details?.speedRange || ''}
                onChange={e => updateDetail('speedRange', e.target.value)}
                placeholder="z.B. 25 km/Tag, 8 Knoten"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mindestbesatzung</label>
              <input
                type="text"
                value={editForm.details?.minCrew || ''}
                onChange={e => updateDetail('minCrew', e.target.value)}
                placeholder="z.B. 1 Kutscher, 4 Ruderer, 10 Matrosen"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Wartungszustand &amp; Robustheit</label>
              <input
                type="text"
                value={editForm.details?.maintenanceCondition || ''}
                onChange={e => updateDetail('maintenanceCondition', e.target.value)}
                placeholder="z.B. Hochseetauglich, Verstärkte Achsen"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 13. MILITÄRBEDARF */}
      {activeMainCat === 'Militärbedarf' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Militärische Nachschub- &amp; Ausrüstungsdaten
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Militärische Funktion / Rolle</label>
              <select
                value={editForm.details?.militarySupplyRole || MILITARY_SUPPLY_ROLES[0]}
                onChange={e => updateDetail('militarySupplyRole', e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              >
                {MILITARY_SUPPLY_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Zuteilungsbedarf pro Soldat / Einheit</label>
              <input
                type="text"
                value={editForm.details?.supplyPerUnit || ''}
                onChange={e => updateDetail('supplyPerUnit', e.target.value)}
                placeholder="z.B. 1 Bündel (20 Pfeile) pro Schütze / Tag"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Taktischer Nutzen &amp; Kampfwert</label>
              <input
                type="text"
                value={editForm.details?.tacticalValue || ''}
                onChange={e => updateDetail('tacticalValue', e.target.value)}
                placeholder="z.B. +20% Mauerschutz, Fernkampfsalve"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 14. MEDIZIN */}
      {activeMainCat === 'Medizin' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Medizinische &amp; Alchemistische Wirkungsdaten
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hauptwirkung / Heilkraft</label>
              <input
                type="text"
                value={editForm.details?.healingEffect || ''}
                onChange={e => updateDetail('healingEffect', e.target.value)}
                placeholder="z.B. Heilt 2W6 LP, Stillt Blutungen sofort, Fiebersenkend"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Anwendungsform &amp; Dosierung</label>
              <input
                type="text"
                value={editForm.details?.applicationForm || ''}
                onChange={e => updateDetail('applicationForm', e.target.value)}
                placeholder="z.B. Einnehmen (1 Phiole), Salbenumschlag"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nebenwirkungen &amp; Haltbarkeit</label>
              <input
                type="text"
                value={editForm.details?.sideEffects || ''}
                onChange={e => updateDetail('sideEffects', e.target.value)}
                placeholder="z.B. Keine Nebenwirkungen, 1 Jahr lichtgeschützt haltbar"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 15. HANDELSWAREN */}
      {activeMainCat === 'Handelswaren' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Handels- &amp; Marktdaten
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Herkunftsregion &amp; Handelsroute</label>
              <input
                type="text"
                value={editForm.details?.tradeRoute || ''}
                onChange={e => updateDetail('tradeRoute', e.target.value)}
                placeholder="z.B. Gewürzinseln, Südlicher Seeweg"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hauptabsatzmärkte &amp; Nachfrage</label>
              <input
                type="text"
                value={editForm.details?.demandRegions || ''}
                onChange={e => updateDetail('demandRegions', e.target.value)}
                placeholder="z.B. Hauptstädte, Tempelorden, Reichsstädte"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Transportrisiko &amp; Zollsatz</label>
              <input
                type="text"
                value={editForm.details?.transportRisk || ''}
                onChange={e => updateDetail('transportRisk', e.target.value)}
                placeholder="z.B. Feuchtigkeitsempfindlich, 8% Stadtzoll"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 16. MAGISCHE GEGENSTÄNDE */}
      {activeMainCat === 'Magische Gegenstände' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Magische Eigenschaften &amp; Verzauberung
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Magieschule / Aspekt</label>
              <input
                type="text"
                value={editForm.details?.magicSchool || ''}
                onChange={e => updateDetail('magicSchool', e.target.value)}
                placeholder="z.B. Elementarmagie (Feuer), Heilung, Bannmagie"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Aktivierung &amp; Manakosten</label>
              <input
                type="text"
                value={editForm.details?.activationCost || ''}
                onChange={e => updateDetail('activationCost', e.target.value)}
                placeholder="z.B. Befehlswort, 10 Mana, Permanent aktiv"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ladungen &amp; Bindung</label>
              <input
                type="text"
                value={editForm.details?.charges || ''}
                onChange={e => updateDetail('charges', e.target.value)}
                placeholder="z.B. 3/3 täglich regenerierend, Seelengebunden"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Magischer Effekt / Verzauberungswirkung</label>
            <AutoExpandingTextarea
              value={editForm.details?.effects || ''}
              onChange={e => updateDetail('effects', e.target.value)}
              placeholder="Genaue magische Wirkung, Aura, Boni oder Flüche..."
              minRows={2}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* 17. QUEST- / STORY-GEGENSTÄNDE */}
      {activeMainCat === 'Quest-/Story-Gegenstände' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Handlungs- &amp; Quest-Relevanz
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quest-Kontext &amp; Bedeutung</label>
              <input
                type="text"
                value={editForm.details?.questContext || ''}
                onChange={e => updateDetail('questContext', e.target.value)}
                placeholder="z.B. Schlüssel zum Verlies des Grafen, Siegelring des Königs"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fundort &amp; Verbleib</label>
              <input
                type="text"
                value={editForm.details?.currentLocation || ''}
                onChange={e => updateDetail('currentLocation', e.target.value)}
                placeholder="z.B. Geheimes Fach im Studierzimmer, Im Besitz des Schmugglers"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 18. MONSTER-BEUTE & DROPS */}
      {activeMainCat === 'Monster-Beute & Drops' && (
        <div className="bg-amber-950/20 border border-amber-800/60 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-amber-900/50 pb-2">
            <Crosshair className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Monsterbeute- &amp; Codex-Eigenschaften
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Erntbares Gewebe / Organ</label>
              <input
                type="text"
                value={editForm.details?.harvestedBodyPart || ''}
                onChange={e => updateDetail('harvestedBodyPart', e.target.value)}
                placeholder="z.B. Drüse, Chitin, Giftzahn, Fell"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dropchance &amp; Erntemenge</label>
              <input
                type="text"
                value={editForm.details?.dropChance || ''}
                onChange={e => updateDetail('dropChance', e.target.value)}
                placeholder="z.B. 75%, 1-3 Stück"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Häufigste Beutekreatur</label>
              <input
                type="text"
                value={editForm.details?.droppedByMonsterName || ''}
                onChange={e => updateDetail('droppedByMonsterName', e.target.value)}
                placeholder="z.B. Schattenwolf, Höhlenspinne"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 19. DUNGEON-VORKOMMEN & FUNDE */}
      {activeMainCat === 'Dungeon-Vorkommen & Funde' && (
        <div className="bg-sky-950/20 border border-sky-800/60 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-sky-900/50 pb-2">
            <Compass className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
              Dungeon- &amp; Fundort-Eigenschaften
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dungeon / Fundort-Name</label>
              <input
                type="text"
                value={editForm.details?.dungeonLocationName || ''}
                onChange={e => updateDetail('dungeonLocationName', e.target.value)}
                placeholder="z.B. Finsterwald-Krypta, Silbermine"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fundquelle &amp; Ebene</label>
              <input
                type="text"
                value={editForm.details?.dungeonFloorLevel || ''}
                onChange={e => updateDetail('dungeonFloorLevel', e.target.value)}
                placeholder="z.B. Ebene 1-2, Schatztruhe"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Abbauvoraussetzungen</label>
              <input
                type="text"
                value={editForm.details?.dungeonAccessCondition || ''}
                onChange={e => updateDetail('dungeonAccessCondition', e.target.value)}
                placeholder="z.B. Spitzhacke Stufe 2, Dietrich"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 20. LOOT-QUELLEN & TROPHÄEN */}
      {activeMainCat === 'Loot-Quellen & Trophäen' && (
        <div className="bg-emerald-950/20 border border-emerald-800/60 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-emerald-900/50 pb-2">
            <Workflow className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Ökologische Herkunft &amp; Sammel-Details
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Primärer Herkunftsort</label>
              <input
                type="text"
                value={editForm.details?.originSourceType || ''}
                onChange={e => updateDetail('originSourceType', e.target.value)}
                placeholder="z.B. Jagd, Tiefseefischerei, Botanik, Ausgrabung"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Haltbarkeit &amp; Lagerung</label>
              <input
                type="text"
                value={editForm.details?.sideEffects || ''}
                onChange={e => updateDetail('sideEffects', e.target.value)}
                placeholder="z.B. Frisch verarbeiten binnen 3 Tagen"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Erforderliche Werkzeuge</label>
              <input
                type="text"
                value={editForm.details?.requiredTools || ''}
                onChange={e => updateDetail('requiredTools', e.target.value)}
                placeholder="z.B. Kürschnermesser, Spaten, Netz"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ECHTE PRODUKTIONSKETTEN & HANDWERKS-BEZIEHUNGEN */}
      {/* ========================================================================= */}
      <div className="bg-slate-950/50 border border-amber-900/30 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Hammer className="w-4 h-4 text-amber-400" />
          <span className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider">
            Produktionskette &amp; Handwerks-Beziehungen
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ausgangsstoffe / Hergestellt aus (Rohstoffe &amp; Komponenten)
            </label>
            <input
              type="text"
              value={editForm.details?.producedFrom || ''}
              onChange={e => updateDetail('producedFrom', e.target.value)}
              placeholder="z.B. Eisenerz, Steinkohle, Eichenholzbrett, Wolle"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Weiterverarbeitung zu / Verwendet für (Folgeprodukte)
            </label>
            <input
              type="text"
              value={editForm.details?.processedInto || ''}
              onChange={e => updateDetail('processedInto', e.target.value)}
              placeholder="z.B. Langschwerter, Kettenhemden, Baugerüste, Bier"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Benötigter Handwerksberuf
            </label>
            <input
              type="text"
              list="crafting-professions-list"
              value={editForm.details?.requiredProfession || ''}
              onChange={e => updateDetail('requiredProfession', e.target.value)}
              placeholder="z.B. Schmied, Schreiner, Bäcker"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
            <datalist id="crafting-professions-list">
              {CRAFTING_PROFESSIONS.map(p => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Benötigter Betriebstyp
            </label>
            <input
              type="text"
              list="holding-types-list"
              value={editForm.details?.productionHoldingType || ''}
              onChange={e => updateDetail('productionHoldingType', e.target.value)}
              placeholder="z.B. Schmiede, Bäckerei, Sägewerk"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
            <datalist id="holding-types-list">
              {TYPICAL_PRODUCING_HOLDING_TYPES.map(h => (
                <option key={h} value={h} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Benötigte Werkzeuge &amp; Stätte
            </label>
            <input
              type="text"
              value={editForm.details?.requiredTools || ''}
              onChange={e => updateDetail('requiredTools', e.target.value)}
              placeholder="z.B. Amboss & Schmiedehammer, Backofen"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Anfallende Nebenprodukte / Reste
            </label>
            <input
              type="text"
              value={editForm.details?.byproducts || ''}
              onChange={e => updateDetail('byproducts', e.target.value)}
              placeholder="z.B. Schlacke, Späne, Kleie, Asche"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Herstellungsdauer &amp; Aufwand
            </label>
            <input
              type="text"
              value={editForm.details?.productionTime || ''}
              onChange={e => updateDetail('productionTime', e.target.value)}
              placeholder="z.B. 4 Stunden, 1 Arbeitstag pro Charge"
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. WIRTSCHAFTS- & MANAGEMENT-INTEGRATION */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-700/60 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wider">
              Wirtschafts- &amp; Managementsystem-Verknüpfung
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleSyncToEconomyHolding()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Link2 className="w-3.5 h-3.5" />
            In Betriebsinventar übernehmen
          </button>
        </div>

        {syncNotice && (
          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Produzierender Betrieb / Lagerstandort
            </label>
            <select
              value={editForm.details?.producingHoldingId || ''}
              onChange={e => {
                const selected = availableHoldings.find(h => h.id === e.target.value);
                updateDetail('producingHoldingId', e.target.value);
                if (selected) updateDetail('producingHoldingName', selected.name);
              }}
              className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
            >
              <option value="">-- Kein Betrieb zugewiesen --</option>
              {availableHoldings.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.locationName || 'Betrieb'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Verbrauchender / Weiterverarbeitender Betrieb
            </label>
            <select
              value={editForm.details?.consumingHoldingId || ''}
              onChange={e => {
                const selected = availableHoldings.find(h => h.id === e.target.value);
                updateDetail('consumingHoldingId', e.target.value);
                if (selected) updateDetail('consumingHoldingName', selected.name);
              }}
              className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
            >
              <option value="">-- Kein weiterverarbeitender Betrieb --</option>
              {availableHoldings.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.locationName || 'Betrieb'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock, Capacity & Prices */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lagermenge</label>
            <input
              type="number"
              min="0"
              value={editForm.details?.stockAmount !== undefined ? editForm.details.stockAmount : 20}
              onChange={e => updateDetail('stockAmount', Number(e.target.value))}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Max. Kapazität</label>
            <input
              type="number"
              min="0"
              value={editForm.details?.maxCapacity !== undefined ? editForm.details.maxCapacity : 100}
              onChange={e => updateDetail('maxCapacity', Number(e.target.value))}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Einheit</label>
            <select
              value={editForm.details?.unit || categoryMeta.defaultUnit}
              onChange={e => updateDetail('unit', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            >
              {STANDARD_UNITS.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Marktpreis (Gold)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={editForm.details?.pricePerUnit !== undefined ? editForm.details.pricePerUnit : categoryMeta.defaultPrice}
              onChange={e => updateDetail('pricePerUnit', Number(e.target.value))}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Herstellkosten</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={editForm.details?.costPrice !== undefined ? editForm.details.costPrice : Math.round((categoryMeta.defaultPrice || 10) * 0.6)}
              onChange={e => updateDetail('costPrice', Number(e.target.value))}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Zustand</label>
            <select
              value={editForm.details?.condition || 'gut'}
              onChange={e => updateDetail('condition', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            >
              {ITEM_CONDITION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6. Loot-Quellen, Monster-Drops, Dungeon-Vorkommen & Wertschöpfungskette */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-950/70 border border-amber-700/40 flex items-center justify-center text-amber-400 shrink-0">
              <Crosshair className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Loot-Quellen, Monster-Drops, Dungeon-Vorkommen &amp; Wertschöpfungskette
              </span>
              <span className="text-[11px] text-slate-400">
                Ökologische Herkunft, Verknüpfung mit Monster- und Dungeon-Einträgen sowie 5-stufige Produktionskette.
              </span>
            </div>
          </div>
          {syncNotice && (
            <div className="text-xs text-amber-300 bg-amber-950/60 border border-amber-700/50 px-3 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>{syncNotice}</span>
            </div>
          )}
        </div>

        {/* Herkunftsart */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Primäre Herkunftsart
            </label>
            <select
              value={editForm.details?.originSourceType || 'Handwerk / Produktion'}
              onChange={e => updateDetail('originSourceType', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            >
              <option value="Monsterbeute">Monsterbeute &amp; Jagdtrophäe (Kreaturen-Drop)</option>
              <option value="Dungeon-Vorkommen">Dungeon- &amp; Höhlen-Vorkommen (Erzader / Fundort)</option>
              <option value="Handwerk / Produktion">Handwerk &amp; Veredelung (Herstellung im Betrieb)</option>
              <option value="Schatztruhe / Lager">Schatztruhe &amp; Ruinenlager (Beutekiste / Versteck)</option>
              <option value="Landwirtschaft / Ernte">Landwirtschaft &amp; Natur (Feldfrüchte / Pflanzung)</option>
              <option value="Handel / Import">Handel &amp; Fernimport (Karawanenware / Markt)</option>
              <option value="Quest / Relikt">Quest- &amp; Einzigartiges Relikt (Handlungsgegenstand)</option>
              <option value="Unterwasserbeute">Unterwasser- &amp; Ozean-Beute (Schiffswrack / Tiefsee)</option>
              <option value="Wildnisfund">Natur- &amp; Wildnis-Fund (Botanisches Sammelgut)</option>
              <option value="Ausgrabung">Spaten- &amp; Ausgrabungs-Fund (Archäologie / Relikt)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Beute-Klassifizierung
            </label>
            <select
              value={editForm.details?.lootType || 'Standardbeute'}
              onChange={e => updateDetail('lootType', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            >
              <option value="Standardbeute">Standardbeute (Garantierter / Häufiger Drop)</option>
              <option value="Seltene Beute">Seltene Beute (Geringe Dropchance)</option>
              <option value="Bedingte Beute">Bedingte Beute (Spezifische Tötungsart/Voraussetzung)</option>
              <option value="Boss- / Spezialbeute">Boss- &amp; Spezialbeute (Einzigartiger Dungeonboss-Drop)</option>
              <option value="Story- / Questbeute">Story- &amp; Questbeute (Handlungsbezogen)</option>
              <option value="Saisonale Beute">Saisonale &amp; Wetterbedingte Beute (Phänomen / Ereignis)</option>
              <option value="Magische Beute">Magisch Resonante Beute (Elementar / Arkane Aura)</option>
              <option value="Mythische Beute">Legendäre &amp; Mythische Beute (Artefakt-Klasse)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ausbeutbarer Körperteil / Quelle
            </label>
            <select
              value={editForm.details?.harvestedBodyPart || 'Fell'}
              onChange={e => updateDetail('harvestedBodyPart', e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
            >
              <option value="Fell">Fell &amp; Pelz</option>
              <option value="Leder / Haut">Leder, Haut &amp; Chitinpanzer</option>
              <option value="Fleisch">Fleisch, Fett &amp; Innereien</option>
              <option value="Knochen">Knochen, Schädel &amp; Rippen</option>
              <option value="Horn / Geweih">Horn, Stoßzahn &amp; Geweih</option>
              <option value="Zähne">Zähne &amp; Reißzähne</option>
              <option value="Krallen">Krallen &amp; Klauen</option>
              <option value="Schuppen">Schuppen &amp; Panzerplatten</option>
              <option value="Drüsen">Drüsen, Sekrete &amp; Duftstoffe</option>
              <option value="Giftorgan">Giftorgan, Giftstachel &amp; Toxine</option>
              <option value="Federn">Federn &amp; Schwingen</option>
              <option value="Blut">Blut &amp; Lebensessenz</option>
              <option value="Kristallkern">Kristallkern &amp; Elementarherz</option>
              <option value="Besonderes Organ">Besonderes Organ (z.B. Flammenbeutel, Kiemen)</option>
              <option value="Ausrüstung / Beute">Getragene Ausrüstung / Gestohlene Beute</option>
              <option value="Essenz">Essenz &amp; Auralicht</option>
              <option value="Schimären-Gliedmaß">Schimären-Gliedmaß (Tentakel, Flügel, Greifer)</option>
              <option value="Magie-Resonanzkern">Magie-Resonanzkern (Kristalliner Energiespeicher)</option>
              <option value="Sonstiges">Sonstiger Bestandteil</option>
            </select>
          </div>
        </div>

        {/* Verknüpfung Monster-Codex */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              Monster-Codex Verknüpfung (Droppende Kreatur)
            </span>
            {onUpdateLore && (
              <button
                type="button"
                onClick={handleSyncToMonsterCodex}
                className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/50 text-amber-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                Im Monster-Codex als Drop hinterlegen
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Monster / Kreatur auswählen
              </label>
              <select
                value={editForm.details?.droppedByMonsterId || ''}
                onChange={e => {
                  const sel = monsterEntries.find(m => m.id === e.target.value);
                  updateDetail('droppedByMonsterId', e.target.value);
                  if (sel) {
                    updateDetail('droppedByMonsterName', sel.title);
                    if (!editForm.details?.chainMonsterOrigin) {
                      updateDetail('chainMonsterOrigin', sel.title);
                    }
                  }
                }}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              >
                <option value="">-- Freier Name oder Auswahl --</option>
                {monsterEntries.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.details?.species || 'Kreatur'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Monster-Name (Freitext / Referenz)
              </label>
              <input
                type="text"
                value={editForm.details?.droppedByMonsterName || ''}
                onChange={e => {
                  updateDetail('droppedByMonsterName', e.target.value);
                  if (!editForm.details?.chainMonsterOrigin) {
                    updateDetail('chainMonsterOrigin', e.target.value);
                  }
                }}
                placeholder="z.B. Schattenwolf, Höhlenspinne, Feuerdrache"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Dropchance &amp; Wahrscheinlichkeit
              </label>
              <input
                type="text"
                value={editForm.details?.dropChance !== undefined ? editForm.details.dropChance : '75%'}
                onChange={e => updateDetail('dropChance', e.target.value)}
                placeholder="z.B. 100% (Garantie), 65%, 15% (Selten)"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Erntemenge / Drop-Anzahl
              </label>
              <input
                type="text"
                value={editForm.details?.dropQuantityRange || '1 - 3'}
                onChange={e => updateDetail('dropQuantityRange', e.target.value)}
                placeholder="z.B. 1 - 2 Stück, 1 Fell, 50g"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Spezifische Ernte- &amp; Drop-Bedingungen
            </label>
            <AutoExpandingTextarea
              value={editForm.details?.dropConditions || ''}
              onChange={e => updateDetail('dropConditions', e.target.value)}
              placeholder="z.B. Unbeschädigter Kadaver erforderlich; Gezielter Kehlenschnitt; Erfordert Kürschnermesser Stufe 2; Nur bei Vollmond oder im Winter..."
              minRows={2}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Verknüpfung Dungeon- & Fundort-Codex */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              Dungeon- &amp; Fundort-Codex Verknüpfung (Ortslogik)
            </span>
            {onUpdateLore && (
              <button
                type="button"
                onClick={handleSyncToDungeonCodex}
                className="px-2.5 py-1 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-700/50 text-sky-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Link2 className="w-3 h-3" />
                Im Orts-/Dungeon-Codex als Ressource hinterlegen
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Dungeon / Ort auswählen
              </label>
              <select
                value={editForm.details?.dungeonLocationId || ''}
                onChange={e => {
                  const sel = locationEntries.find(loc => loc.id === e.target.value);
                  updateDetail('dungeonLocationId', e.target.value);
                  if (sel) {
                    updateDetail('dungeonLocationName', sel.title);
                    if (!editForm.details?.chainDungeonOrigin) {
                      updateDetail('chainDungeonOrigin', sel.title);
                    }
                  }
                }}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
              >
                <option value="">-- Freier Name oder Auswahl --</option>
                {locationEntries.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.title} ({loc.details?.type || 'Ort'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Dungeon- / Fundort-Name
              </label>
              <input
                type="text"
                value={editForm.details?.dungeonLocationName || ''}
                onChange={e => {
                  updateDetail('dungeonLocationName', e.target.value);
                  if (!editForm.details?.chainDungeonOrigin) {
                    updateDetail('chainDungeonOrigin', e.target.value);
                  }
                }}
                placeholder="z.B. Finsterwald-Krypta, Alte Silbermine"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Fundquelle im Dungeon
              </label>
              <select
                value={editForm.details?.dungeonSourceType || 'Monster-Drop'}
                onChange={e => updateDetail('dungeonSourceType', e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
              >
                <option value="Monster-Drop">Monster-Drop (Kreaturenbeute)</option>
                <option value="Schatztruhe">Schatztruhe &amp; Beutekiste</option>
                <option value="Erzader / Natürliches Vorkommen">Erzader / Natürliches Vorkommen</option>
                <option value="Verstecktes Lager">Verstecktes Lager / Geheimraum</option>
                <option value="Leichen / Trümmer">Leichen / Trümmer vergangener Abenteurer</option>
                <option value="Boss-Kammer">Boss-Kammer (Abschlussbelohnung)</option>
                <option value="Quest-Objekt">Quest-Objekt / Story-Fund</option>
                <option value="Fallen-Mechanismus">Fallen- &amp; Altar-Mechanismus (Ausgelöster Fund)</option>
                <option value="Unterwassersee">Unterwasser- &amp; Höhlensee (Versunkener Schatz)</option>
                <option value="Magischer Riss">Magischer Riss &amp; Arkaner Altar (Erscheinung)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ebene / Dungeon-Bereich
              </label>
              <input
                type="text"
                value={editForm.details?.dungeonFloorLevel || 'Ebene 1-2'}
                onChange={e => updateDetail('dungeonFloorLevel', e.target.value)}
                placeholder="z.B. Ebene 1-2, Tiefste Krypta, Schatzkammer"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fund- &amp; Abbauvoraussetzungen
            </label>
            <input
              type="text"
              value={editForm.details?.dungeonAccessCondition || ''}
              onChange={e => updateDetail('dungeonAccessCondition', e.target.value)}
              placeholder="z.B. Spitzhacke erforderlich; Verschlossene Eisentruhe (Dietrich Stufe 2); Arkane Barriere..."
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* 5-Stufige Wertschöpfungskette */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5" />
              Vollständige 5-Stufen Wertschöpfungskette (Dungeon → Monster → Rohstoff → Handwerk → Endprodukt)
            </span>
            <span className="text-[10px] text-slate-400">
              Systemkette nach Abschlusskriterium
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
            {/* Stufe 1: Dungeon */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                1. Dungeon / Habitat
              </span>
              <input
                type="text"
                value={editForm.details?.chainDungeonOrigin || editForm.details?.dungeonLocationName || ''}
                onChange={e => updateDetail('chainDungeonOrigin', e.target.value)}
                placeholder="z.B. Finsterwald"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-400">Wo die Kreatur lebt / Vorkommen</span>
            </div>

            {/* Stufe 2: Monster */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                2. Monster / Kreatur
              </span>
              <input
                type="text"
                value={editForm.details?.chainMonsterOrigin || editForm.details?.droppedByMonsterName || ''}
                onChange={e => updateDetail('chainMonsterOrigin', e.target.value)}
                placeholder="z.B. Schattenwolf"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-400">Droppendes Wesen</span>
            </div>

            {/* Stufe 3: Rohstoff */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                3. Beute / Rohstoff
              </span>
              <input
                type="text"
                value={editForm.details?.chainRawResource || editForm.title || ''}
                onChange={e => updateDetail('chainRawResource', e.target.value)}
                placeholder="z.B. Wolfsfell"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Dieser Codex-Gegenstand</span>
            </div>

            {/* Stufe 4: Handwerker & Betrieb */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                4. Beruf &amp; Betrieb
              </span>
              <input
                type="text"
                value={editForm.details?.chainRefiningProfession || editForm.details?.requiredProfession || ''}
                onChange={e => updateDetail('chainRefiningProfession', e.target.value)}
                placeholder="z.B. Gerber / Kürschner"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={editForm.details?.chainRefiningHolding || editForm.details?.productionHoldingType || ''}
                onChange={e => updateDetail('chainRefiningHolding', e.target.value)}
                placeholder="Betrieb: z.B. Gerberei"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Stufe 5: Endprodukt */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                5. Endprodukt &amp; Handel
              </span>
              <input
                type="text"
                value={editForm.details?.chainEndProduct || editForm.details?.processedInto || ''}
                onChange={e => updateDetail('chainEndProduct', e.target.value)}
                placeholder="z.B. Wolfslederrüstung"
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400">Ausrüstung / Ware für Handel</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Geheimnis-Stufen & Verborgenes Wissen */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
          Geheimnis-Stufen &amp; Verborgenes Wissen
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">Stufe 1: Gerüchte &amp; Volkswissen</label>
            <AutoExpandingTextarea
              value={editForm.secretsStage1 || ''}
              onChange={e => setEditForm(prev => ({ ...prev, secretsStage1: e.target.value }))}
              placeholder="Was als Gerücht über diesen Gegenstand im Volk kursiert..."
              minRows={2}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">Stufe 2: Eingeweihten-Wissen</label>
            <AutoExpandingTextarea
              value={editForm.secretsStage2 || ''}
              onChange={e => setEditForm(prev => ({ ...prev, secretsStage2: e.target.value }))}
              placeholder="Was Experten, Meister oder Eingeweihte wissen..."
              minRows={2}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-purple-300/80 font-bold uppercase tracking-wider">Stufe 3: Absolute Wahrheit</label>
            <AutoExpandingTextarea
              value={editForm.secretsStage3 || ''}
              onChange={e => setEditForm(prev => ({ ...prev, secretsStage3: e.target.value }))}
              placeholder="Die verborgene, absolute Wahrheit oder der Fluch..."
              minRows={2}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          Abbrechen
        </button>

        <button
          type="button"
          onClick={() => {
            if (editForm.details?.producingHoldingId) {
              handleSyncToEconomyHolding(editForm.details.producingHoldingId);
            }
            onSave();
          }}
          className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Im Codex speichern
        </button>
      </div>
    </div>
  );
};
