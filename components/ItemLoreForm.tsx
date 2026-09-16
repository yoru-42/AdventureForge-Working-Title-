// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
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
  ITEM_CONDITION_OPTIONS 
} from '../lib/itemCategoriesData';
import { Sparkles, Save, X, Trash2, Link2, CheckCircle2, AlertCircle, Building2, Package } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

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
  worldTitle,
  isNsfw,
  world
}) => {
  // Smart Fill state
  const [smartFillInput, setSmartFillInput] = useState('');
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [smartFillError, setSmartFillError] = useState<string | null>(null);
  const [appendMode, setAppendMode] = useState(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Active Category & Subcategory resolution
  const activeMainCat: ItemMainCategory = (editForm.details?.mainCategory as ItemMainCategory) || 'Rohstoffe';
  const categoryMeta = ITEM_MAIN_CATEGORIES.find(c => c.id === activeMainCat) || ITEM_MAIN_CATEGORIES[0];
  const activeSubCat: string = editForm.details?.subCategory || (categoryMeta.subcategories ? categoryMeta.subcategories[0] : '');

  // Ensure initial defaults when category changes
  const handleMainCategoryChange = (newCat: ItemMainCategory) => {
    const meta = ITEM_MAIN_CATEGORIES.find(c => c.id === newCat) || ITEM_MAIN_CATEGORIES[0];
    const newSubCat = meta.subcategories ? meta.subcategories[0] : '';
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
        condition
      } : r);
    } else {
      const newRes: EconomyResource = {
        id: `res-${holding.id}-${Date.now()}`,
        name: itemName,
        category: categoryMeta.economyCategory,
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
    setSyncNotice(`Erfolgreich im Betriebsinventar von "${holding.name}" hinterlegt (${amount} ${unit}).`);
    setTimeout(() => setSyncNotice(null), 5000);
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
              Kategorisierung, technische Eigenschaften und direkte Anbindung an Wirtschaft und Betriebe.
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
      {categoryMeta.hasSubcategories && categoryMeta.subcategories && (
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
            placeholder={`Beschreibe den Gegenstand (z.B. Herkunft, Material, Besonderheiten, Betrieb oder Verwendungszweck)...`}
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

      {/* Core Attributes */}
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

      {/* Main Description */}
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
      {/* CATEGORY SPECIFIC FORM SECTIONS */}
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

      {/* 4. NAHRUNG */}
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

      {/* 5. KLEIDUNG & TEXTILIEN */}
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

      {/* 6. WAFFEN */}
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

      {/* 7. RÜSTUNG & SCHUTZAUSRÜSTUNG */}
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

      {/* 8. WERKZEUGE */}
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

      {/* 9. LANDWIRTSCHAFT */}
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

      {/* 10. TIERE */}
      {activeMainCat === 'Tiere' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Tierhaltung &amp; Nutzvieh-Eigenschaften
            </span>
          </div>

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
        </div>
      )}

      {/* 11. TRANSPORTMITTEL */}
      {activeMainCat === 'Transportmittel' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Fahrzeug- &amp; Schiffsdaten
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
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fracht- &amp; Ladekapazität</label>
              <input
                type="text"
                value={editForm.details?.maxCapacity || ''}
                onChange={e => updateDetail('maxCapacity', e.target.value)}
                placeholder="z.B. 2 Tonnen Fracht, 6 Personen"
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
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Besatzungsbedarf</label>
              <input
                type="text"
                value={editForm.details?.minCrew || ''}
                onChange={e => updateDetail('minCrew', e.target.value)}
                placeholder="z.B. 1 Kutscher, 4 Ruderer"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 12. MILITÄRBEDARF */}
      {activeMainCat === 'Militärbedarf' && (
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Militärische Nachschub- &amp; Ausrüstungsdaten
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nachschubtyp</label>
              <input
                type="text"
                value={editForm.details?.militarySupplyType || ''}
                onChange={e => updateDetail('militarySupplyType', e.target.value)}
                placeholder="z.B. Pfeilbündel, Belagerungsmunition, Feldzelte"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Truppengattung / Verwendung</label>
              <input
                type="text"
                value={editForm.details?.targetUnit || ''}
                onChange={e => updateDetail('targetUnit', e.target.value)}
                placeholder="z.B. Bogenschützen-Kompanie, Festungsgarnison"
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Taktischer Nutzen / Kampfwert</label>
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

      {/* 13. MEDIZIN */}
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

      {/* 14. HANDELSWAREN */}
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

      {/* 15. MAGISCHE GEGENSTÄNDE */}
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

      {/* 16. QUEST- / STORY-GEGENSTÄNDE */}
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

      {/* ========================================================================= */}
      {/* WIRTSCHAFTS- & MANAGEMENT-INTEGRATION */}
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

      {/* Verborgenes Wissen & Geheimnisse */}
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
