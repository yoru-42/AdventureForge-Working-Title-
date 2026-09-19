// -*- coding: utf-8 -*-
import React, { useState } from 'react';
import {
  LoreEntry,
  WorldSetting,
  ItemDefinition
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import {
  ITEM_BUILDER_TYPES,
  ItemBuilderType,
  getBuilderTypeForCategory
} from '../lib/itemCategoriesData';
import {
  STANDARD_ITEMS_CATALOG,
  findStandardItem
} from '../lib/standardItemsData';
import {
  Sparkles,
  Save,
  Trash2,
  Package,
  Info,
  ExternalLink,
  Shield,
  Sword,
  Sparkle,
  Check
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { ALL_WEAPONS } from '../lib/weaponTypesData';

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

// 13 standardisierte Waffenbeherrschungen aus dem Charaktersystem
export const WEAPON_MASTERY_OPTIONS = [
  'Schwertkampf (Einhändig)',
  'Schwertkampf (Zweihändig)',
  'Dolchkampf',
  'Axtkampf',
  'Hämmer & Wuchtwaffen',
  'Stangenwaffen & Speere',
  'Bogenschießen',
  'Armbrustschießen',
  'Wurfwaffen & Schleudern',
  'Faust- & Exotenwaffen',
  'Schildkampf',
  'Schwarzpulverwaffen',
  'Magische Fokuswaffen'
];

export const ItemLoreForm: React.FC<ItemLoreFormProps> = ({
  editForm,
  setEditForm,
  isEditing,
  onSave,
  onDelete,
  onCancel,
  lore,
  world
}) => {
  // Smart Fill state
  const [smartFillInput, setSmartFillInput] = useState('');
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [smartFillError, setSmartFillError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedTemplateTitle, setSelectedTemplateTitle] = useState('');

  // Active Builder Type resolution
  const currentCategoryStr =
    editForm.details?.mainCategory || editForm.details?.itemType || 'Rohstoffe';
  const activeBuilderType: ItemBuilderType =
    (editForm.details?.builderType as ItemBuilderType) ||
    getBuilderTypeForCategory(currentCategoryStr);

  const builderMeta =
    ITEM_BUILDER_TYPES.find(b => b.type === activeBuilderType) || ITEM_BUILDER_TYPES[0];

  const activeSubCat: string =
    editForm.details?.subCategory ||
    (builderMeta.subcategories.length > 0 ? builderMeta.subcategories[0] : '');

  // Helper to update detail fields cleanly
  const updateDetail = (key: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        [key]: value
      }
    }));
  };

  // Umschalten der Gegenstandsart
  const handleSelectBuilderType = (newType: ItemBuilderType) => {
    const newMeta = ITEM_BUILDER_TYPES.find(b => b.type === newType) || ITEM_BUILDER_TYPES[0];
    const defaultSub = newMeta.subcategories.length > 0 ? newMeta.subcategories[0] : '';

    setEditForm(prev => {
      const updatedDetails = { ...(prev.details || {}) };
      updatedDetails.builderType = newType;
      updatedDetails.mainCategory = newMeta.category;
      updatedDetails.subCategory = defaultSub;

      // Clean category-specific fields if switching away from weapon
      if (newType !== 'Waffe') {
        delete updatedDetails.weaponType;
        delete updatedDetails.weaponMastery;
        delete updatedDetails.damageType;
        delete updatedDetails.rangeCategory;
      }

      return {
        ...prev,
        category: 'Gegenstände',
        details: updatedDetails
      };
    });
  };

  // Übernahme einer Vorlage aus dem Katalog
  const handleApplyTemplate = (itemTitle: string) => {
    setSelectedTemplateTitle(itemTitle);
    if (!itemTitle) return;

    // 1. Prüfen auf Waffe im Waffen-Katalog
    const weaponMatch = ALL_WEAPONS.find(w => w.name.toLowerCase() === itemTitle.toLowerCase());
    if (weaponMatch) {
      let matchedMastery = 'Schwertkampf (Einhändig)';
      if (weaponMatch.categoryId === 'schwerter_zweihanendig') matchedMastery = 'Schwertkampf (Zweihändig)';
      else if (weaponMatch.categoryId === 'dolche_messer') matchedMastery = 'Dolchkampf';
      else if (weaponMatch.categoryId === 'aexte_beile') matchedMastery = 'Axtkampf';
      else if (weaponMatch.categoryId === 'haemmer_keulen') matchedMastery = 'Hämmer & Wuchtwaffen';
      else if (weaponMatch.categoryId === 'stangenwaffen_speere') matchedMastery = 'Stangenwaffen & Speere';
      else if (weaponMatch.categoryId === 'boegen_sehnenwaffen') matchedMastery = 'Bogenschießen';
      else if (weaponMatch.categoryId === 'armbrueste') matchedMastery = 'Armbrustschießen';
      else if (weaponMatch.categoryId === 'wurfwaffen_schleudern') matchedMastery = 'Wurfwaffen & Schleudern';
      else if (weaponMatch.categoryId === 'faust_exotisch') matchedMastery = 'Faust- & Exotenwaffen';
      else if (weaponMatch.categoryId === 'schilde') matchedMastery = 'Schildkampf';
      else if (weaponMatch.categoryId === 'schwarzpulver') matchedMastery = 'Schwarzpulverwaffen';
      else if (weaponMatch.categoryId === 'magisch_fokus') matchedMastery = 'Magische Fokuswaffen';

      setEditForm(prev => ({
        ...prev,
        title: weaponMatch.name,
        description: weaponMatch.description,
        details: {
          ...(prev.details || {}),
          builderType: 'Waffe',
          mainCategory: 'Waffen',
          subCategory: weaponMatch.categoryName.includes('Schwert') ? 'Schwerter & Klingen' : weaponMatch.categoryName,
          weaponType: weaponMatch.name,
          weaponMastery: matchedMastery,
          damageType: weaponMatch.damageTypes.join(', '),
          rangeCategory: `${weaponMatch.rangeCategory} (${weaponMatch.wieldingStyles[0] || 'Einhand'})`,
          material: prev.details?.material || 'Gehärteter Stahl'
        }
      }));
      return;
    }

    // 2. Prüfen auf Standard-Item aus dem Katalog
    const std = findStandardItem(itemTitle);
    if (std) {
      setEditForm(prev => ({
        ...prev,
        title: std.title,
        description: std.description,
        details: {
          ...(prev.details || {}),
          builderType: std.builderType,
          mainCategory: std.mainCategory,
          subCategory: std.subCategory,
          material: std.details?.material || prev.details?.material || '',
          specialProperties: std.details?.specialProperties || prev.details?.specialProperties || ''
        }
      }));
    }
  };

  // Intelligentes Ausfüllen (Smart Fill mit Gemini) – Fokus rein auf Gegenstandsdefinition
  const handleSmartFill = async () => {
    if (!smartFillInput.trim()) return;

    setIsSmartFilling(true);
    setSmartFillError(null);

    try {
      const existingItems = lore
        .filter(l => l.category === 'Gegenstände')
        .map(l => l.title)
        .filter(Boolean);

      const promptInstructions = `
Du bist ein Worldbuilding-Assistent für das Spiel AdventureForge.
Erstelle oder vervollständige ausschließlich die Gegenstandsdefinition (Codex: „Was ist das?“).
WICHTIG:
- Keine Preise, keine Kupfer-/Goldkosten, keine Marktwerte!
- Keine Fundorte, Vorkommen oder Dropraten!
- Keine Herstellungsbetriebe, Werkstätten oder Produktionszeiten!
- Keine Händler, Lieferanten oder Verträge!
- Keine konkreten Abnutzungszustände (rostig/alt) – diese gehören in spätere Instanzen.

Gib die Daten im JSON-Format zurück mit folgenden Feldern:
- title: Prägnanter Gegenstandsname
- description: Grundlegende Beschreibung (1-3 Sätze: Was ist das und wozu dient es grundsätzlich?)
- details:
  - builderType: eine passende Gegenstandsart aus: [${ITEM_BUILDER_TYPES.map(b => b.type).join(', ')}]
  - subCategory: passende Unterkategorie
  - material: Grundstoff / Material (z. B. Stahl, Holz, Leder, Erz, Flachs)
  - specialProperties: Besondere Eigenschaften (z. B. "aus besonders hochwertigem Stahl", "witterungsbeständig")
  - weaponType: (nur falls Waffe) konkreter Typ wie z. B. Langschwert
  - weaponMastery: (nur falls Waffe) eine der Waffenbeherrschungen: [${WEAPON_MASTERY_OPTIONS.join(', ')}]
      `.trim();

      const result = await GeminiService.autofillLoreEntry(
        `${smartFillInput}\n\n${promptInstructions}`,
        'Gegenstände',
        undefined,
        undefined,
        existingItems,
        { title: editForm.title, category: 'Gegenstände' },
        world,
        undefined,
        lore
      );

      if (result) {
        setEditForm(prev => {
          const mergedDetails = { ...(prev.details || {}) };
          if (result.details) {
            if (result.details.builderType) mergedDetails.builderType = result.details.builderType;
            if (result.details.subCategory) mergedDetails.subCategory = result.details.subCategory;
            if (result.details.material) mergedDetails.material = result.details.material;
            if (result.details.specialProperties) mergedDetails.specialProperties = result.details.specialProperties;
            if (result.details.weaponType) mergedDetails.weaponType = result.details.weaponType;
            if (result.details.weaponMastery) mergedDetails.weaponMastery = result.details.weaponMastery;
          }

          return {
            ...prev,
            title: result.title || prev.title || smartFillInput.slice(0, 30),
            description: result.description || prev.description || '',
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

  // Validierung und Speichern
  const handleValidateAndSave = () => {
    if (!editForm.title || !editForm.title.trim()) {
      setValidationError('Bitte gib einen Namen für den Gegenstand an.');
      return;
    }

    setValidationError(null);

    // Sicherstellen, dass die Mindeststruktur vorhanden ist
    setEditForm(prev => ({
      ...prev,
      category: 'Gegenstände',
      description: prev.description || '',
      details: {
        ...(prev.details || {}),
        builderType: activeBuilderType,
        mainCategory: builderMeta.category,
        subCategory: activeSubCat
      }
    }));

    onSave();
  };

  // Katalog-Optionen für die aktuelle Gegenstandsart filtern
  const catalogOptionsForCurrentType = STANDARD_ITEMS_CATALOG.filter(
    item => item.builderType === activeBuilderType
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 flex flex-col gap-6 text-slate-200">
      {/* 1. Header mit Status & Aktionen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              {isEditing ? 'Gegenstand bearbeiten' : 'Neuen Gegenstand definieren'}
              {editForm.title && (
                <span className="text-xs font-normal text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                  — {editForm.title}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Definiert die Wissensbasis des Gegenstandstyps („Was ist das?“). Konkrete Exemplare,
              Zustände und Wirtschaftsdaten werden in den jeweiligen Systemen geführt.
            </p>
          </div>
        </div>

        {/* Aktionsleiste */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Abbrechen
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => onDelete(isEditing)}
              className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-lg text-xs transition cursor-pointer"
              title="Gegenstand löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleValidateAndSave}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4" />
            Speichern
          </button>
        </div>
      </div>

      {/* Validierungsfehler */}
      {validationError && (
        <div className="bg-rose-950/60 border border-rose-800/80 rounded-lg p-3 text-xs text-rose-300 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{validationError}</span>
        </div>
      )}

      {/* 2. KI-Unterstützung (Smart Fill) */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            KI-Gegenstandsassistent (Definition vervollständigen)
          </label>
          <span className="text-[10px] text-slate-500">
            Erstellt rein sachliche Beschreibungen ohne Wirtschafts- oder Inventardaten
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
            placeholder="Gegenstandsidee kurz beschreiben (z. B. 'Zwergischer Runenhammer aus Sternenerz, verleiht Blitzfunken')..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            type="button"
            onClick={handleSmartFill}
            disabled={isSmartFilling || !smartFillInput.trim()}
            className="px-3.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSmartFilling ? 'animate-spin' : ''}`} />
            {isSmartFilling ? 'Wird ausgefüllt...' : 'Ausfüllen'}
          </button>
        </div>
        {smartFillError && (
          <p className="text-[11px] text-rose-400 mt-1">{smartFillError}</p>
        )}
      </div>

      {/* 3. Vorlagenkatalog zur schnellen Übernahme */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-300">
            Aus vorhandenem Katalog als Vorlage übernehmen:
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedTemplateTitle}
            onChange={e => handleApplyTemplate(e.target.value)}
            className="w-full sm:w-72 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">-- Vorlage aus Katalog wählen --</option>
            {activeBuilderType === 'Waffe' ? (
              <optgroup label="Standard-Waffen (73 Waffengattungen)">
                {ALL_WEAPONS.map(w => (
                  <option key={w.id} value={w.name}>
                    {w.name} ({w.categoryName})
                  </option>
                ))}
              </optgroup>
            ) : catalogOptionsForCurrentType.length > 0 ? (
              <optgroup label={`Katalog: ${activeBuilderType} (${catalogOptionsForCurrentType.length})`}>
                {catalogOptionsForCurrentType.map(item => (
                  <option key={item.id} value={item.title}>
                    {item.title} ({item.subCategory})
                  </option>
                ))}
              </optgroup>
            ) : (
              <optgroup label="Alle Katalog-Einträge">
                {STANDARD_ITEMS_CATALOG.slice(0, 50).map(item => (
                  <option key={item.id} value={item.title}>
                    {item.title} ({item.builderType})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* 4. Hauptformular: Reduziert auf die Kernfragen: „Was ist das?“ */}
      <div className="flex flex-col gap-5">
        {/* Zeile 1: Gegenstandsart, Unterkategorie, Name (Die 3 Pflichtfelder) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gegenstandsart * */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Gegenstandsart <span className="text-indigo-400">*</span>
            </label>
            <select
              value={activeBuilderType}
              onChange={e => handleSelectBuilderType(e.target.value as ItemBuilderType)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {ITEM_BUILDER_TYPES.map(b => (
                <option key={b.type} value={b.type}>
                  {b.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              {builderMeta.description}
            </p>
          </div>

          {/* Unterkategorie * */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Unterkategorie <span className="text-indigo-400">*</span>
            </label>
            {builderMeta.subcategories && builderMeta.subcategories.length > 0 ? (
              <select
                value={activeSubCat}
                onChange={e => updateDetail('subCategory', e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
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
                onChange={e => updateDetail('subCategory', e.target.value)}
                placeholder="z. B. Spezifische Unterart"
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            )}
            <p className="text-[11px] text-slate-500">
              Spezifische Gruppierung innerhalb der Gegenstandsart
            </p>
          </div>

          {/* Name / Bezeichnung des Gegenstands * */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Name / Bezeichnung <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={editForm.title || ''}
              onChange={e => {
                setEditForm(prev => ({ ...prev, title: e.target.value }));
                if (validationError) setValidationError(null);
              }}
              placeholder="z. B. Langschwert, Eisenerz, Roggenbrot..."
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              Eindeutiger Name des Gegenstandstyps im Welten-Codex
            </p>
          </div>
        </div>

        {/* Dynamischer Bereich: Nur für die gewählte Gegenstandsart relevante Felder */}

        {/* FALL 1: WAFFE */}
        {activeBuilderType === 'Waffe' && (
          <div className="bg-slate-950/70 border border-indigo-950/60 rounded-xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 border-b border-slate-800 pb-2">
              <Sword className="w-4 h-4 text-indigo-400" />
              <span>Waffeneigenschaften & Zuordnung der Waffenbeherrschung</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Waffengattung / Typ */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300">Waffengattung / Modell</label>
                <input
                  type="text"
                  list="weapons-datalist"
                  value={editForm.details?.weaponType || ''}
                  onChange={e => {
                    const val = e.target.value;
                    updateDetail('weaponType', val);
                    const match = ALL_WEAPONS.find(w => w.name.toLowerCase() === val.toLowerCase());
                    if (match) {
                      handleApplyTemplate(match.name);
                    }
                  }}
                  placeholder="z. B. Langschwert, Krummsäbel..."
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <datalist id="weapons-datalist">
                  {ALL_WEAPONS.map(w => (
                    <option key={w.id} value={w.name}>
                      {w.categoryName}
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Waffenbeherrschung (Referenz auf Charaktersystem) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300">
                  Zuständige Waffenbeherrschung
                </label>
                <select
                  value={editForm.details?.weaponMastery || 'Schwertkampf (Einhändig)'}
                  onChange={e => updateDetail('weaponMastery', e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {WEAPON_MASTERY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Schadensart */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300">Schadensart</label>
                <input
                  type="text"
                  value={editForm.details?.damageType || ''}
                  onChange={e => updateDetail('damageType', e.target.value)}
                  placeholder="z. B. Hieb, Stich, Schnitt, Wucht..."
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Reichweite & Führungsstil */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300">Reichweite & Führung</label>
                <input
                  type="text"
                  value={editForm.details?.rangeCategory || ''}
                  onChange={e => updateDetail('rangeCategory', e.target.value)}
                  placeholder="z. B. Nahkampf (Einhand), Fernkampf..."
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Hinweis: Die Waffenbeherrschung bleibt Teil des Charakter- und Progressionssystems. Der
              Gegenstand besitzt keinen eigenen Talentbaum.
            </p>
          </div>
        )}

        {/* FALL 2: RÜSTUNG & KLEIDUNG */}
        {(activeBuilderType === 'Rüstung' || activeBuilderType === 'Kleidung') && (
          <div className="bg-slate-950/70 border border-indigo-950/60 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 border-b border-slate-800 pb-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Rüstungs- und Schutzmerkmale</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300">Rüstungstyp / Schutzkategorie</label>
                <input
                  type="text"
                  value={editForm.details?.armorType || ''}
                  onChange={e => updateDetail('armorType', e.target.value)}
                  placeholder="z. B. Brustpanzer, Schild, Helm, Leichte Kleidung..."
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-300">Schutzart / Wirkungsweise</label>
                <input
                  type="text"
                  value={editForm.details?.armorProtection || ''}
                  onChange={e => updateDetail('armorProtection', e.target.value)}
                  placeholder="z. B. Leichter Schutz, Vollplatte, Kälteresistenz..."
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* FALL 3: TIER */}
        {activeBuilderType === 'Tier' && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <label className="text-xs font-semibold text-slate-300">Tierart / Verwendungszweck</label>
            <input
              type="text"
              value={editForm.details?.animalRole || ''}
              onChange={e => updateDetail('animalRole', e.target.value)}
              placeholder="z. B. Nutztier, Lasttier, Reittier, Jagd- und Wachhund..."
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* FALL 4: NAHRUNG / MEDIZIN / TRÄNKE */}
        {(activeBuilderType === 'Nahrung' ||
          activeBuilderType === 'Medizin / Alchemie' ||
          activeBuilderType === 'Tränke & Elixiere') && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
            <label className="text-xs font-semibold text-slate-300">Verabreichung / Konsumart</label>
            <input
              type="text"
              value={editForm.details?.consumptionType || ''}
              onChange={e => updateDetail('consumptionType', e.target.value)}
              placeholder="z. B. Feste Nahrung, Getränk, Heiltrank, Salbe, Räucherwerk..."
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Grundinformationen: Material, Beschreibung & Besondere Eigenschaften (Für alle Gegenstände) */}
        <div className="flex flex-col gap-4">
          {/* Material / Grundlegende Beschaffenheit (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Material / Grundlegende Beschaffenheit{' '}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={editForm.details?.material || ''}
              onChange={e => updateDetail('material', e.target.value)}
              placeholder="z. B. Gehärteter Stahl, Eichenholz, Leder, Metallerz, Flachs, Obsidian..."
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-500">
              Reine stoffliche Grundzusammensetzung des Gegenstandstyps
            </p>
          </div>

          {/* Grundbeschreibung (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Grundbeschreibung{' '}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <AutoExpandingTextarea
              minRows={3}
              value={editForm.description || ''}
              onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Kurze Grundbeschreibung: Was ist das für ein Gegenstand und wofür dient er grundsätzlich?"
              className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-500">
              Wissensgrundlage für den KI-Erzähler im Chat
            </p>
          </div>

          {/* Besondere Eigenschaften (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Besondere Eigenschaften{' '}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <AutoExpandingTextarea
              minRows={2}
              value={editForm.details?.specialProperties || ''}
              onChange={e => updateDetail('specialProperties', e.target.value)}
              placeholder="Besondere Merkmale, z. B. 'aus besonders hochwertigem Stahl', 'wetterbeständig', 'feuerfest', 'leuchtet bei Dunkelheit'..."
              className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
            <p className="text-[11px] text-slate-500">
              Feste Eigenschaften der Gegenstandsart (konkrete Abnutzungszustände wie rostig oder
              beschädigt werden nicht hier, sondern an konkreten Exemplaren geführt)
            </p>
          </div>
        </div>

        {/* Globale Progression (Nur falls ausdrücklich entwicklungsfähiger Gegenstand / Artefakt) */}
        <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!editForm.details?.isUpgradeable}
              onChange={e => updateDetail('isUpgradeable', e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkle className="w-3.5 h-3.5 text-indigo-400" />
              Ausdrücklich entwicklungsfähiger Gegenstand / Artefakt
            </span>
          </label>

          {editForm.details?.isUpgradeable && (
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-800/60 pl-6">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Referenziert die globale Progressionsregel der Welt:{' '}
                  <strong className="text-indigo-300">
                    {(() => {
                      const logic = world?.techniqueProgressionLogic || (world as any)?.progressionLogic || 'ep';
                      if (logic === 'ep') return 'Erfahrungspunkte (EP-System)';
                      if (logic === 'training') return 'Praxis & Training';
                      if (logic === 'milestone') return 'Meilensteine & Handlungserfolge';
                      if (logic === 'static') return 'Statische Weltregeln';
                      return 'Globale Weltregeln';
                    })()}
                  </strong>
                  . Der Gegenstand besitzt keine eigene Minigame-Progressionslogik.
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <label className="text-[11px] font-medium text-slate-400">
                  Entwicklungspotenzial / Stufenmerkmale (optional)
                </label>
                <AutoExpandingTextarea
                  minRows={2}
                  value={editForm.details?.progressionNotes || ''}
                  onChange={e => updateDetail('progressionNotes', e.target.value)}
                  placeholder="Notizen zur Entfaltung von Kräften nach den globalen Weltregeln..."
                  className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Wirtschafts- & Managementsystem Hinweisbox */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 mt-0.5 sm:mt-0">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-200">
                Wirtschafts- & Managementsystem
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Preise, Herstellungsketten, Betriebe, Berufe, Bestände, Verträge und Händler werden
                im Wirtschafts- & Managementsystem verwaltet. Der Gegenstands-Codex stellt die
                wissensbasierte Definition bereit.
              </p>
            </div>
          </div>
          <div className="text-[11px] text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Im Wirtschaftssystem verknüpft
          </div>
        </div>

        {/* 6. ItemDefinition / ItemInstance Trennungshinweis */}
        <div className="text-[11px] text-slate-500 px-1 flex items-center gap-1.5">
          <span className="font-medium text-slate-400">Codex-Definition:</span>
          <span>
            Beschreibt die unveränderliche Grundart (z. B. „Langschwert“). Konkrete Exemplare mit
            individuellem Zustand (neu, rostig, beschädigt) werden im Inventar oder Lager geführt.
          </span>
        </div>
      </div>

      {/* Fußzeile mit Speichern & Abbrechen */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={handleValidateAndSave}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
        >
          <Save className="w-4 h-4" />
          Gegenstand speichern
        </button>
      </div>
    </div>
  );
};
