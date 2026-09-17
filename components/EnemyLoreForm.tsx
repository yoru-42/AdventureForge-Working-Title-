import React, { useState, useMemo } from 'react';
import { 
  LoreEntry, 
  EnemyDetails, 
  WorldSetting, 
  CampaignPowerParameter,
  CharacterPowerSource,
  MonsterLootItem 
} from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import CharacterPowerRadar from './CharacterPowerRadar';
import { GeminiService } from '../services/geminiService';
import { EP_DEFAULT_PARAMETERS } from '../lib/progressionDefaults';
import { TechniqueHierarchyTree } from './TechniqueHierarchyTree';
import { normalizeAbilityHierarchy, syncCharacterAbilityTree } from '../utils/abilityHierarchy';
import { ITEM_MAIN_CATEGORIES, STANDARD_UNITS } from '../lib/itemCategoriesData';

interface Props {
  editForm: Partial<LoreEntry>;
  setEditForm: React.Dispatch<React.SetStateAction<Partial<LoreEntry>>>;
  isEditing: string | null;
  setIsEditing: (id: string | null) => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
  lore: LoreEntry[];
  onUpdateLore: (lore: LoreEntry[]) => void;
  worldTitle?: string;
  isNsfw?: boolean;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  world?: WorldSetting | any;
}

export interface EnemyAbility {
  id: string;
  name: string;
  category?: string;
  source?: string;
  powerSourceId?: string;
  cost?: string;
  description?: string;
  activationCondition?: string;
  techniques?: string;
  transformName?: string;
  transformTrigger?: string;
  transformBuffs?: string;
}

const ENEMY_TYPE_OPTIONS = [
  'Scherge / Fußsoldat (Minion)',
  'Regulärer Gegner (Standard)',
  'Elite / Champion',
  'Miniboss',
  'Dungeonboss / Gebietsboss',
  'Weltboss / Epischer Boss',
  'Schwarm / Rudel (Swarm)'
];

const SPECIES_OPTIONS = [
  'Humanoid (z.B. Bandit, Söldner, Kultist)',
  'Untoter (z.B. Skelett, Zombie, Lich)',
  'Bestie / Tier (z.B. Wolf, Bär, Raubkatze)',
  'Dämon / Unhold (z.B. Höllenhund, Fiend)',
  'Konstrukt / Automat (z.B. Golem, Kriegsmaschine)',
  'Elementar (z.B. Feuer, Eis, Erde, Blitz)',
  'Monstrum (z.B. Hydra, Chimäre, Basilisk)',
  'Drache / Drachenblut (z.B. Lindwurm, Wyvern)',
  'Pflanze / Pilz (z.B. Würgeranke, Sporenträger)',
  'Geist / Phantom (z.B. Spuk, Schatten, Gespenst)',
  'Aberration / Kosmisch (z.B. Schreckenswesen)',
  'Sonstige Kreatur'
];

const THREAT_OPTIONS = [
  'Harmlos (Stufe 1)',
  'Niedrig (Stufe 2 - 3)',
  'Mittel (Stufe 4 - 5)',
  'Gefährlich (Stufe 6 - 7)',
  'Tödlich (Stufe 8 - 9)',
  'Kataklysmisch (Stufe 10+)'
];

const DIET_OPTIONS = [
  'Fleischfresser (Carnivore / Raubtier)',
  'Pflanzenfresser (Herbivore)',
  'Allesfresser (Omnivore)',
  'Aasfresser (Scavenger)',
  'Magie- & Mana-Fresser (Mana-Drain)',
  'Seelen- & Lebenskraft-Sauger',
  'Blutsauger (Hämatophag)',
  'Mineral- & Metallfresser',
  'Keine Nahrungsaufnahme (Untot / Konstrukt)'
];

const SOCIAL_OPTIONS = [
  'Einzelgänger (Solitär / Territorial)',
  'Rudelverband mit Alphatier',
  'Feste Sippe / Stamm / Familie',
  'Schwarm / Schwarmintelligenz',
  'Bienenstaat / Kastenwesen mit Königin',
  'Symbiotisch / Parasitär',
  'Gesteuert / Diener eines Meisters'
];

const REPRODUCTION_OPTIONS = [
  'Lebendgebärend / Säugetier-Zyklus',
  'Gelege / Eierbrut im Nest',
  'Sporenbildung / Pilzkolonisation',
  'Nekromantische Erweckung / Fluch',
  'Magische Manifestation / Elementarriss',
  'Alchemistische Erschaffung / Konstruktion',
  'Zellteilung / Mutation'
];

const MONSTER_PART_TYPES = [
  'Fell',
  'Leder / Haut',
  'Fleisch',
  'Knochen',
  'Horn / Geweih',
  'Zähne / Fangzähne',
  'Krallen / Klauen',
  'Schuppen / Panzerung',
  'Drüsen / Organe',
  'Gift / Sekret',
  'Federn',
  'Blut / Essenz',
  'Kristallkern / Magiekern',
  'Ausrüstung / Beutegut',
  'Schatz / Edelstein',
  'Sonstiges'
];

const SIZE_OPTIONS = [
  'Winzig',
  'Klein',
  'Mittel (Menschengroß)',
  'Groß (2 - 4 Meter)',
  'Riesig (5 - 10 Meter)',
  'Kolossal (Über 10 Meter)'
];

const GROUP_SIZE_OPTIONS = [
  'Einzelgänger (1)',
  'Kleines Rudel (2 - 4)',
  'Kampftrupp / Patrouille (4 - 8)',
  'Große Horde (10 - 25)',
  'Massenhafter Schwarm (30+)'
];

const FORMATION_OPTIONS = [
  'Keilformation (Wedge / Sturmangriff)',
  'Schlachtlinie (Line / Schildfront)',
  'Umzingelung (Surround / Einkreisung)',
  'Zangenangriff (Flank / Flankieren)',
  'Verstreut / Plänkler (Skirmish / Hit-and-Run)',
  'Keine feste Formation'
];

const BEHAVIOR_OPTIONS = [
  'Aggressiver Sturmangriff (Frontal)',
  'Hinterhalt aus dem Schatten (Tarnung & Überfall)',
  'Distanzkampf & Kiting (Rückzug bei Annäherung)',
  'Defensiver Schildwall & Konter',
  'Rudel-Koordination & Flankieren',
  'Unterstützer / Zauberwirker im Hintergrund',
  'Unberechenbar / Raserei'
];

const TARGET_PRIORITY_OPTIONS = [
  'Magier und Heiler fokussieren',
  'Schwächstes / verletztes Ziel angreifen',
  'Nächstes Ziel / Nahkämpfer',
  'Ziel mit höchster Bedrohung (Aggro/Frontkämpfer)',
  'Zufälliges Ziel / Chaotisch',
  'Fernkämpfer im Rücken attackieren'
];

const MORALE_OPTIONS = [
  'Kämpft bedingungslos bis zum Tod',
  'Flieht bei schweren Verletzungen (<20% LP)',
  'Gerät in Berserker-Raserei bei niedrigen LP',
  'Ruft Verstärkung oder schlägt Alarm',
  'Ergibt sich oder bettelt um Gnade',
  'Löst sich bei Zerstörung des Meisters auf'
];

export const EnemyLoreForm: React.FC<Props> = ({
  editForm,
  setEditForm,
  isEditing,
  onSave,
  onDelete,
  onCancel,
  lore,
  onUpdateLore,
  worldTitle,
  isNsfw,
  worldPowerSettings,
  world
}) => {
  const [activeTab, setActiveTab] = useState<
    'klassifizierung' | 'physis' | 'basiswerte' | 'macht' | 'resistenzen' | 'beute' | 'geheimnisse'
  >('klassifizierung');

  const [activeAbilityTab, setActiveAbilityTab] = useState<string>('Passive Fähigkeiten');
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [smartFillPrompt, setSmartFillPrompt] = useState('');
  const [keepExistingDetails, setKeepExistingDetails] = useState(true);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Stelle sicher, dass stets Power-Settings verfügbar sind (Fallback auf Standard-Parameter der Welt)
  const effectivePowerSettings = React.useMemo(() => {
    if (worldPowerSettings && Object.keys(worldPowerSettings).length > 0) {
      return worldPowerSettings;
    }
    if (world?.campaignPowerSettings && Object.keys(world.campaignPowerSettings).length > 0) {
      return world.campaignPowerSettings;
    }
    return EP_DEFAULT_PARAMETERS;
  }, [worldPowerSettings, world]);

  const getDetail = (field: keyof EnemyDetails, fallback: any = ''): any => {
    return editForm.details?.[field] ?? fallback;
  };

  const updateDetail = (field: keyof EnemyDetails, value: any) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        [field]: value
      }
    }));
  };

  const codexItems = useMemo(() => lore.filter(l => l.category === 'Gegenstände'), [lore]);

  const currentLootTable: MonsterLootItem[] = useMemo(() => {
    return Array.isArray(editForm.details?.lootTable) ? editForm.details.lootTable : [];
  }, [editForm.details?.lootTable]);

  const updateLootTable = (newTable: MonsterLootItem[]) => {
    updateDetail('lootTable', newTable);
  };

  const handleAddLootItem = () => {
    const newItem: MonsterLootItem = {
      id: 'loot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      itemName: '',
      category: 'Rohstoffe',
      partType: 'Sonstiges',
      dropChance: 50,
      minQuantity: 1,
      maxQuantity: 1,
      unit: 'Stück',
      isGuaranteed: false
    };
    updateLootTable([...currentLootTable, newItem]);
  };

  const handleUpdateLootItem = (index: number, patch: Partial<MonsterLootItem>) => {
    const updated = [...currentLootTable];
    updated[index] = { ...updated[index], ...patch };
    updateLootTable(updated);
  };

  const handleRemoveLootItem = (index: number) => {
    updateLootTable(currentLootTable.filter((_, i) => i !== index));
  };

  const handleSelectCodexItemForLoot = (index: number, codexTitle: string) => {
    const found = codexItems.find(c => c.title === codexTitle || c.id === codexTitle);
    if (found) {
      handleUpdateLootItem(index, {
        itemId: found.id,
        itemName: found.title,
        category: (found.details as any)?.mainCategory || 'Rohstoffe',
        unit: (found.details as any)?.unit || 'Stück'
      });
    } else {
      handleUpdateLootItem(index, { itemName: codexTitle });
    }
  };

  const handleCreateCodexItemFromLoot = (lootItem: MonsterLootItem) => {
    if (!lootItem.itemName.trim()) return;
    const existing = lore.find(
      l => l.category === 'Gegenstände' && l.title.toLowerCase() === lootItem.itemName.trim().toLowerCase()
    );
    if (existing) {
      const idx = currentLootTable.indexOf(lootItem);
      if (idx >= 0) handleUpdateLootItem(idx, { itemId: existing.id });
      return;
    }
    const newEntry: LoreEntry = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: lootItem.itemName.trim(),
      category: 'Gegenstände',
      description: `Monster-Beute & Rohstoff von ${editForm.title || 'Kreaturen'}.${lootItem.harvestCondition ? ` Gewinnung: ${lootItem.harvestCondition}` : ''}`,
      isUnlocked: true,
      details: {
        mainCategory: (lootItem.category as any) || 'Rohstoffe',
        subCategory: lootItem.partType || 'Monsterbeute',
        rarity: lootItem.isGuaranteed ? 'Gewöhnlich' : (lootItem.dropChance || 50) < 15 ? 'Episch' : (lootItem.dropChance || 50) < 40 ? 'Selten' : 'Ungewöhnlich',
        unit: lootItem.unit || 'Stück',
        isQuestItem: false,
        dropChance: `${lootItem.dropChance}%`,
        itemLevel: 1
      }
    };
    onUpdateLore([...lore, newEntry]);
    const idx = currentLootTable.indexOf(lootItem);
    if (idx >= 0) {
      handleUpdateLootItem(idx, { itemId: newEntry.id });
    }
  };

  const handleApplyLootPreset = (presetType: 'beast' | 'dragon' | 'alch' | 'crystal') => {
    const timestamp = Date.now();
    let presetItems: MonsterLootItem[] = [];
    if (presetType === 'beast') {
      presetItems = [
        { id: `loot_${timestamp}_1`, itemName: `${editForm.title || 'Bestien'}-Fell`, category: 'Rohstoffe', partType: 'Fell', dropChance: 100, isGuaranteed: true, minQuantity: 1, maxQuantity: 1, unit: 'Stück', harvestCondition: 'Kürschnermesser' },
        { id: `loot_${timestamp}_2`, itemName: `Rohes Fleisch`, category: 'Nahrung', partType: 'Fleisch', dropChance: 100, isGuaranteed: true, minQuantity: 2, maxQuantity: 4, unit: 'Stück' },
        { id: `loot_${timestamp}_3`, itemName: `Spitze Reißzähne`, category: 'Rohstoffe', partType: 'Zähne', dropChance: 75, isGuaranteed: false, minQuantity: 2, maxQuantity: 6, unit: 'Stück' },
        { id: `loot_${timestamp}_4`, itemName: `Bestien-Knochen`, category: 'Rohstoffe', partType: 'Knochen', dropChance: 80, isGuaranteed: false, minQuantity: 1, maxQuantity: 3, unit: 'Stück' }
      ];
    } else if (presetType === 'dragon') {
      presetItems = [
        { id: `loot_${timestamp}_1`, itemName: `Drachenschuppe`, category: 'Rohstoffe', partType: 'Schuppen', dropChance: 100, isGuaranteed: true, minQuantity: 3, maxQuantity: 8, unit: 'Stück', harvestCondition: 'Meister-Kürschner' },
        { id: `loot_${timestamp}_2`, itemName: `Drachenblut`, category: 'Alchemie & Tränke', partType: 'Blut', dropChance: 60, isGuaranteed: false, minQuantity: 1, maxQuantity: 2, unit: 'Fläschchen', harvestCondition: 'Alchemie-Gefäß' },
        { id: `loot_${timestamp}_3`, itemName: `Drachenhorn`, category: 'Rohstoffe', partType: 'Horn', dropChance: 40, isGuaranteed: false, minQuantity: 1, maxQuantity: 2, unit: 'Stück' },
        { id: `loot_${timestamp}_4`, itemName: `Feuerdrüsen-Kern`, category: 'Alchemie & Tränke', partType: 'Drüsen', dropChance: 25, isGuaranteed: false, minQuantity: 1, maxQuantity: 1, unit: 'Stück' }
      ];
    } else if (presetType === 'alch') {
      presetItems = [
        { id: `loot_${timestamp}_1`, itemName: `Giftbeutel`, category: 'Alchemie & Tränke', partType: 'Gift', dropChance: 70, isGuaranteed: false, minQuantity: 1, maxQuantity: 2, unit: 'Beutel', harvestCondition: 'Alchemiewerkzeug' },
        { id: `loot_${timestamp}_2`, itemName: `Schleimdrüse`, category: 'Alchemie & Tränke', partType: 'Drüsen', dropChance: 50, isGuaranteed: false, minQuantity: 1, maxQuantity: 1, unit: 'Stück' },
        { id: `loot_${timestamp}_3`, itemName: `Kreaturen-Auge`, category: 'Alchemie & Tränke', partType: 'Drüsen', dropChance: 35, isGuaranteed: false, minQuantity: 1, maxQuantity: 2, unit: 'Stück' }
      ];
    } else if (presetType === 'crystal') {
      presetItems = [
        { id: `loot_${timestamp}_1`, itemName: `Kristallkern`, category: 'Edelsteine & Mineralien', partType: 'Kristallkern', dropChance: 80, isGuaranteed: false, minQuantity: 1, maxQuantity: 1, unit: 'Stück' },
        { id: `loot_${timestamp}_2`, itemName: `Mana-Staub`, category: 'Alchemie & Tränke', partType: 'Blut', dropChance: 60, isGuaranteed: false, minQuantity: 2, maxQuantity: 5, unit: 'Gramm' },
        { id: `loot_${timestamp}_3`, itemName: `Seelensplitter`, category: 'Magische Artefakte', partType: 'Schatz', dropChance: 20, isGuaranteed: false, minQuantity: 1, maxQuantity: 1, unit: 'Splitter' }
      ];
    }
    updateLootTable([...currentLootTable, ...presetItems]);
  };

  const handleSmartFill = async () => {
    if (!smartFillPrompt.trim()) return;
    setIsSmartFilling(true);
    try {
      const existingEnemies = lore
        .filter(l => l.category === 'Gegner')
        .map(l => l.title)
        .filter(Boolean);

      const data = await GeminiService.autofillLoreEntry(
        smartFillPrompt,
        'Gegner',
        undefined,
        undefined,
        existingEnemies,
        keepExistingDetails ? editForm : { title: editForm.title, category: 'Gegner' },
        world,
        effectivePowerSettings,
        lore
      );

      if (data) {
        setEditForm(prev => ({
          ...prev,
          title: data.title || prev.title || '',
          description: data.description || prev.description || '',
          secretsStage1: data.secretsStage1 || prev.secretsStage1 || '',
          secretsStage2: data.secretsStage2 || prev.secretsStage2 || '',
          secretsStage3: data.secretsStage3 || prev.secretsStage3 || '',
          details: {
            ...(keepExistingDetails ? (prev.details || {}) : {}),
            ...(data.details || {})
          }
        }));
      }
    } catch (err) {
      console.error('Fehler beim automatischen Ausfüllen des Gegners:', err);
    } finally {
      setIsSmartFilling(false);
    }
  };

  const handleGenerateEnemyIllustration = async () => {
    if (!editForm.title?.trim()) return;
    setIsGeneratingImage(true);
    try {
      const title = editForm.title.trim();
      const enemyType = getDetail('enemyType');
      const species = getDetail('species');
      const appearance = getDetail('appearance');
      const habitat = getDetail('habitat');
      const threat = getDetail('threatLevel');

      const style = 'Konzeptkunst, detailreiche Monster- und Gegnerdarstellung, stimmungsvolle Beleuchtung, neutraler bis atmosphärischer Hintergrund, keine Beschriftung';

      const prompt = `Darstellung des Gegnertyps "${title}" (${enemyType || 'Monster'}, Spezies: ${species || 'Kreatur'}) in der Spielwelt "${worldTitle || 'Fantasy'}".
Merkmale & Erscheinung:
- Bedrohungsgrad: ${threat || 'Gefährlich'}
- Physische Merkmale: ${appearance || 'Furchterregende Gestalt mit Panzerung oder Klauen'}
- Lebensraum / Umgebung: ${habitat || 'Dunkle Wildnis'}
- Beschreibung: ${editForm.description || ''}
Stil: ${style}. Hochwertige digitale Illustration.`;

      const imageUrl = await GeminiService.generateImage(prompt, isNsfw);
      if (imageUrl) {
        setEditForm(prev => ({ ...prev, image: imageUrl }));
      }
    } catch (err) {
      console.error('Fehler bei der Bildgenerierung:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async e => {
      const base64 = e.target?.result as string;
      if (base64) {
        try {
          const compressed = await GeminiService.compressImageBase64(base64, 512, 0.75);
          setEditForm(prev => ({ ...prev, image: compressed }));
        } catch {
          setEditForm(prev => ({ ...prev, image: base64 }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const factionOptions = React.useMemo(() => {
    const fromLore = lore
      .filter(l => l.category === 'Fraktionen')
      .map(l => l.title)
      .filter(Boolean);
    return Array.from(new Set(['Wildnis / Monster', 'Ungebunden / Räuber', ...fromLore]));
  }, [lore]);

  const abilitiesList: EnemyAbility[] = (getDetail('abilities', []) as EnemyAbility[]);

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col gap-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-skull text-rose-400"></i>
            <span>
              {isEditing
                ? `Gegner bearbeiten: ${editForm.title || ''}`
                : 'Neuen Gegnertyp anlegen'}
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Erstelle Profile für namenlose Gegnertypen, Monster, Schergen, Truppen und Bosse inklusive Kampfeinstufung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={() => onDelete(isEditing)}
              className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Gegner löschen"
            >
              <i className="fa-solid fa-trash"></i>
              <span>Löschen</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all cursor-pointer"
          >
            Abbrechen
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!editForm.title?.trim()}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>Speichern</span>
          </button>
        </div>
      </div>

      {/* Smart Fill Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>KI-Assistent für Gegnertypen</span>
          </span>

          <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepExistingDetails}
              onChange={e => setKeepExistingDetails(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Bestehende Details beibehalten</span>
          </label>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={smartFillPrompt}
            onChange={e => setSmartFillPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSmartFill()}
            placeholder="z.B. Schattenwölfe des Nordens, Rudeljäger mit Frostbiss und Teleport..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-sans"
          />
          <button
            type="button"
            onClick={handleSmartFill}
            disabled={isSmartFilling || !smartFillPrompt.trim()}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            {isSmartFilling ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <i className="fa-solid fa-sparkles"></i>
            )}
            <span>Smart Fill</span>
          </button>
        </div>
      </div>

      {/* Grunddaten: Name, Kurzbeschreibung, Bild, Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">
              Name des Gegners / Gegnertyps *
            </label>
            <input
              type="text"
              value={editForm.title || ''}
              onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="z.B. Waldgoblin-Kundschafter, Skelettwächter, Frostriese..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-semibold outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">
              Beschreibung &amp; Bestiarium-Eintrag
            </label>
            <AutoExpandingTextarea
              value={editForm.description || ''}
              onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Kurze Übersicht über Herkunft, Natur, Verhalten und Besonderheiten dieses Gegners..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[90px]"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editForm.isUnlocked ?? true}
                onChange={e => setEditForm(prev => ({ ...prev, isUnlocked: e.target.checked }))}
                className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 w-4 h-4"
              />
              <span>Im Codex freigeschaltet (für Spieler sichtbar)</span>
            </label>
          </div>
        </div>

        {/* Bild-Bereich */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-300">Illustration / Bild</label>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center gap-3 min-h-[160px] relative overflow-hidden">
            {editForm.image ? (
              <div className="relative w-full h-36 rounded-lg overflow-hidden border border-slate-800 group">
                <img
                  src={editForm.image}
                  alt={editForm.title || 'Gegner'}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setEditForm(prev => ({ ...prev, image: undefined }))}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-rose-600 text-white rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer"
                  title="Bild entfernen"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-6">
                <i className="fa-solid fa-skull text-3xl mb-2 text-slate-600 block"></i>
                <span className="text-[11px]">Kein Bild vorhanden</span>
              </div>
            )}

            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={handleGenerateEnemyIllustration}
                disabled={isGeneratingImage || !editForm.title?.trim()}
                className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {isGeneratingImage ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                )}
                <span>Generieren</span>
              </button>

              <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0">
                <i className="fa-solid fa-upload text-slate-400"></i>
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {[
          { id: 'klassifizierung', label: 'Klassifizierung & Lebensraum', icon: 'fa-layer-group' },
          { id: 'physis', label: 'Erscheinung & Physis', icon: 'fa-shield-halved' },
          { id: 'basiswerte', label: 'Basis-Kampfwerte & KI-Taktik', icon: 'fa-crosshairs' },
          { id: 'macht', label: 'Macht- & Kampfeinstufung (Power-Level)', icon: 'fa-chart-pie' },
          { id: 'resistenzen', label: 'Resistenzen & Schwachstellen', icon: 'fa-circle-exclamation' },
          { id: 'beute', label: 'Beute & Rohstoffe (Loot)', icon: 'fa-gem' },
          { id: 'geheimnisse', label: 'Geheimnisse & Wissen', icon: 'fa-eye-slash' }
        ].map((tab, tIdx) => (
          <button
            key={`enemy-tab-${tab.id}-${tIdx}`}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[140px] px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <i className={`fa-solid ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}

      {/* 1. Klassifizierung & Lebensraum */}
      {activeTab === 'klassifizierung' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Gegnertyp / Rang</label>
            <select
              value={getDetail('enemyType', ENEMY_TYPE_OPTIONS[1])}
              onChange={e => updateDetail('enemyType', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {ENEMY_TYPE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Spezies / Kreaturen-Familie</label>
            <select
              value={getDetail('species', SPECIES_OPTIONS[0])}
              onChange={e => updateDetail('species', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {SPECIES_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Unterart / Zuchtform / Variante</label>
            <input
              type="text"
              value={getDetail('subSpecies')}
              onChange={e => updateDetail('subSpecies', e.target.value)}
              placeholder="z.B. Schattenwölfe des Hochlands, Frost-Mutation, Alpha-Krieger..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Gefahrenstufe / Bedrohungsgrad</label>
            <select
              value={getDetail('threatLevel', THREAT_OPTIONS[2])}
              onChange={e => updateDetail('threatLevel', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {THREAT_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Ernährungsweise &amp; Beuteschema</label>
            <select
              value={getDetail('diet', DIET_OPTIONS[0])}
              onChange={e => updateDetail('diet', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {DIET_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Sozialverhalten &amp; Rudelstruktur</label>
            <select
              value={getDetail('socialBehavior', SOCIAL_OPTIONS[0])}
              onChange={e => updateDetail('socialBehavior', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {SOCIAL_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Typische Gruppengröße / Schwarm</label>
            <select
              value={getDetail('typicalGroupSize', GROUP_SIZE_OPTIONS[0])}
              onChange={e => updateDetail('typicalGroupSize', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {GROUP_SIZE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Fortpflanzung &amp; Vermehrungszyklus</label>
            <select
              value={getDetail('reproduction', REPRODUCTION_OPTIONS[0])}
              onChange={e => updateDetail('reproduction', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {REPRODUCTION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Taktische Standard-Formation</label>
            <select
              value={getDetail('tacticalFormation', FORMATION_OPTIONS[0])}
              onChange={e => updateDetail('tacticalFormation', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {FORMATION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Zugehörige Fraktion / Organisation</label>
            <input
              type="text"
              list="enemy-faction-list"
              value={getDetail('faction', 'Wildnis / Ungebunden')}
              onChange={e => updateDetail('faction', e.target.value)}
              placeholder="z.B. Schattenkult, Banditen-Kartell..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
            <datalist id="enemy-faction-list">
              {factionOptions.map(f => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">
              Bevorzugter Lebensraum, Spawn-Zonen &amp; Dungeons
            </label>
            <input
              type="text"
              value={getDetail('habitat')}
              onChange={e => updateDetail('habitat', e.target.value)}
              placeholder="z.B. Dunkle Wälder, Verlassene Bergstollen, Katakomben der Hauptstadt..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Gesinnung &amp; Grundwesen</label>
            <input
              type="text"
              value={getDetail('alignment')}
              onChange={e => updateDetail('alignment', e.target.value)}
              placeholder="z.B. Aggressiv-Raubtierhaft, Territorial-Neutral, Fanatisch-Böse, Kontrolliertes Konstrukt..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      )}

      {/* 2. Erscheinung & Physis */}
      {activeTab === 'physis' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Größenkategorie</label>
            <select
              value={getDetail('sizeCategory', SIZE_OPTIONS[2])}
              onChange={e => updateDetail('sizeCategory', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
            >
              {SIZE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Sinne &amp; Wahrnehmung</label>
            <input
              type="text"
              value={getDetail('sensoryPerception')}
              onChange={e => updateDetail('sensoryPerception', e.target.value)}
              placeholder="z.B. Dunkelsicht (30m), Erschütterungssinn, Geruchssinn für Blut, Magiesinn..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">
              Physische Erscheinung, Anatomie &amp; Rüstungsmerkmale
            </label>
            <AutoExpandingTextarea
              value={getDetail('appearance')}
              onChange={e => updateDetail('appearance', e.target.value)}
              placeholder="z.B. Dicke Chitinschuppen, spitze Fangzähne, glühende rote Augen, ledrige Schwingen, schwere Eisenplatten..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[90px]"
            />
          </div>
        </div>
      )}

      {/* 3. Basis-Kampfwerte & KI-Taktik */}
      {activeTab === 'basiswerte' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-150">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Basis-Lebenspunkte (HP)</label>
            <input
              type="text"
              value={getDetail('baseHp', '100')}
              onChange={e => updateDetail('baseHp', e.target.value)}
              placeholder="z.B. 120 oder 450 (Boss)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Basis-Energie / Mana (MP)</label>
            <input
              type="text"
              value={getDetail('baseMp', '50')}
              onChange={e => updateDetail('baseMp', e.target.value)}
              placeholder="z.B. 50 oder 200"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Rüstung / Physische Abwehr</label>
            <input
              type="text"
              value={getDetail('armor', '10')}
              onChange={e => updateDetail('armor', e.target.value)}
              placeholder="z.B. 15 (mittlere Panzerung)"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300">Magiewiderstand / Schild</label>
            <input
              type="text"
              value={getDetail('magicResistance', '5')}
              onChange={e => updateDetail('magicResistance', e.target.value)}
              placeholder="z.B. 25% Magieschild"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 font-mono"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-300">Bewegungsreichweite &amp; Tempo</label>
            <input
              type="text"
              value={getDetail('movementSpeed', 'Normal (Standard-Initiative)')}
              onChange={e => updateDetail('movementSpeed', e.target.value)}
              placeholder="z.B. Sehr schnell (Sprint/Flug), Träge aber unaufhaltsam..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-3 border-t border-slate-800 pt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-300">
                Kampfverhalten &amp; KI-Taktik
              </label>
              <select
                value={getDetail('combatBehavior', BEHAVIOR_OPTIONS[0])}
                onChange={e => updateDetail('combatBehavior', e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer mb-2"
              >
                {BEHAVIOR_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <AutoExpandingTextarea
                value={getDetail('combatBehaviorCustom', '')}
                onChange={e => updateDetail('combatBehaviorCustom', e.target.value)}
                placeholder="Detaillierte taktische Verhaltensanweisungen für die KI (z.B. Greift in Wellen an, wirft Rauchbomben bei Nahkampf-Bedrohung, zieht sich nach 2 Runden zurück)..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-300">Zielpriorität im Gefecht</label>
                <select
                  value={getDetail('targetPriority', TARGET_PRIORITY_OPTIONS[0])}
                  onChange={e => updateDetail('targetPriority', e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                >
                  {TARGET_PRIORITY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-300">Moral- &amp; Fluchtverhalten</label>
                <select
                  value={getDetail('moraleBehavior', MORALE_OPTIONS[0])}
                  onChange={e => updateDetail('moraleBehavior', e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                >
                  {MORALE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Macht- & Kampfeinstufung (Power-Level) */}
      {activeTab === 'macht' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-150">
          {/* Radar-Chart & Macht-Dimensionen */}
          <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-chart-pie text-amber-400"></i>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Macht &amp; Werte (Kampagnen-Skala)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Lege fest, wie stark dieser Gegner in den definierten Macht-Dimensionen deiner Welt ist.
              </span>
            </div>

            <CharacterPowerRadar
              worldPowerSettings={effectivePowerSettings}
              characterData={editForm.details?.campaignPowerData || {}}
              onChange={newData => {
                updateDetail('campaignPowerData', newData);
                // Halte auch campaignPowerLevels synchron
                updateDetail('campaignPowerLevels', newData);
              }}
            />
          </div>

          {/* Einheitliche Fähigkeiten- & Techniken-Hierarchie */}
          {(() => {
            const { powerSources, baseAbilities, techniques } = normalizeAbilityHierarchy(editForm.details || {});
            return (
              <TechniqueHierarchyTree
                powerSources={powerSources}
                baseAbilities={baseAbilities}
                techniques={techniques}
                progressionLogic={world?.techniqueProgressionLogic || 'ep'}
                world={world}
                worldPowerSettings={worldPowerSettings || world?.campaignPowerSettings}
                costResources={world?.costResources}
                costPowerNames={world?.costPowerNames}
                onChange={(newPs, newBa, newTech) => {
                  const updated = syncCharacterAbilityTree(editForm.details || {}, newPs, newBa, newTech);
                  setEditForm(prev => ({
                    ...prev,
                    details: {
                      ...(prev.details || {}),
                      ...updated
                    }
                  }));
                }}
                characterName={editForm.title || ''}
                worldTitle={worldTitle}
              />
            );
          })()}
        </div>
      )}

      {/* 5. Resistenzen & Schwachstellen */}
      {activeTab === 'resistenzen' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-150">
          <div className="flex flex-col gap-1 md:col-span-3">
            <label className="text-xs font-bold text-slate-300">
              Schwachstellen &amp; Verwundbarkeiten (Critical Weaknesses)
            </label>
            <AutoExpandingTextarea
              value={getDetail('vulnerabilities')}
              onChange={e => updateDetail('vulnerabilities', e.target.value)}
              placeholder="z.B. Extrem anfällig für Feuerschaden (+100%), Schwachstelle am ungeschützten Nacken, Heiligschaden bricht den Schild..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[80px]"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-3">
            <label className="text-xs font-bold text-slate-300">
              Schadensresistenzen &amp; Reduktionen
            </label>
            <AutoExpandingTextarea
              value={getDetail('damageResistances')}
              onChange={e => updateDetail('damageResistances', e.target.value)}
              placeholder="z.B. 50% Resistenz gegen Schnitt- und Stichwaffen, Hohe Resistenz gegen Frost- und Kälteschaden..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[80px]"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-3">
            <label className="text-xs font-bold text-slate-300">
              Statuseffekt-Immunitäten
            </label>
            <AutoExpandingTextarea
              value={getDetail('statusImmunities')}
              onChange={e => updateDetail('statusImmunities', e.target.value)}
              placeholder="z.B. Immun gegen Blutung, Gift, Betäubung, Furcht, Bezauberung und Verlangsamung..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[80px]"
            />
          </div>
        </div>
      )}

      {/* 6. Beute & Rohstoffe (Loot) */}
      {activeTab === 'beute' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-150">
          {/* Schnell-Vorlagen für Monster-Beute */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Beutetabellen-Vorlagen &amp; Schnellauswahl
              </span>
              <span className="text-[11px] text-slate-500">
                Fügt typische Rohstoffe &amp; Beutegegenstände hinzu
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyLootPreset('beast')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>Bestien-Beute (Fell, Fleisch, Zähne, Knochen)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyLootPreset('dragon')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>Drachen- &amp; Monstrum-Beute (Schuppen, Blut, Horn)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyLootPreset('alch')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>Alchemie &amp; Organe (Giftbeutel, Drüsen, Auge)</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyLootPreset('crystal')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                <span>Magischer Kern (Kristallkern, Mana-Staub)</span>
              </button>
            </div>
          </div>

          {/* Strukturierte Loot-Tabelle */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Spezifische Beute-Tabelle ({currentLootTable.length} Einträge)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Definiert exakte Beutechancen, Mengen und Verknüpfungen zum Gegenstands-Codex
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddLootItem}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
                <span>Beute-Eintrag hinzufügen</span>
              </button>
            </div>

            {currentLootTable.length === 0 ? (
              <div className="bg-slate-950 border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500 text-xs">
                Keine spezifischen Beuteeinträge hinterlegt. Klicke auf &quot;Beute-Eintrag hinzufügen&quot; oder wähle oben eine Vorlage.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {currentLootTable.map((item, index) => {
                  const linkedCodex = codexItems.find(c => c.id === item.itemId || c.title.toLowerCase() === (item.itemName || '').toLowerCase());
                  return (
                    <div
                      key={item.id || index}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                        {/* Gegenstand Name & Codex Auswahl */}
                        <div className="md:col-span-4 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Beute-Gegenstand
                            </label>
                            {linkedCodex ? (
                              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.2 rounded font-mono">
                                Im Codex verknüpft
                              </span>
                            ) : item.itemName ? (
                              <button
                                type="button"
                                onClick={() => handleCreateCodexItemFromLoot(item)}
                                className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
                                title="Erstellt einen neuen Gegenstands-Codex-Eintrag mit diesen Daten"
                              >
                                + In Codex speichern
                              </button>
                            ) : null}
                          </div>
                          <input
                            type="text"
                            list={`codex-item-list-${index}`}
                            value={item.itemName || ''}
                            onChange={e => handleSelectCodexItemForLoot(index, e.target.value)}
                            placeholder="z.B. Wolfsfell, Drachenschuppe..."
                            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                          />
                          <datalist id={`codex-item-list-${index}`}>
                            {codexItems.map(c => (
                              <option key={c.id} value={c.title} />
                            ))}
                          </datalist>
                        </div>

                        {/* Beute-Teil / Materialtyp */}
                        <div className="md:col-span-3 flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Teil-Art / Material
                          </label>
                          <select
                            value={item.partType || 'Sonstiges'}
                            onChange={e => handleUpdateLootItem(index, { partType: e.target.value as any })}
                            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500 cursor-pointer"
                          >
                            {MONSTER_PART_TYPES.map(pt => (
                              <option key={pt} value={pt}>
                                {pt}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Beutechance & Garantiert */}
                        <div className="md:col-span-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-slate-300">
                              Drop-Chance
                            </label>
                            <span className="text-[11px] font-bold text-amber-400">
                              {item.isGuaranteed ? '100%' : `${item.dropChance ?? 50}%`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="1"
                              max="100"
                              disabled={item.isGuaranteed}
                              value={item.isGuaranteed ? 100 : (item.dropChance ?? 50)}
                              onChange={e => handleUpdateLootItem(index, { dropChance: parseInt(e.target.value, 10) || 1 })}
                              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                            />
                            <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer select-none whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={!!item.isGuaranteed}
                                onChange={e => handleUpdateLootItem(index, { isGuaranteed: e.target.checked, dropChance: e.target.checked ? 100 : item.dropChance })}
                                className="accent-amber-500 rounded"
                              />
                              <span>100%</span>
                            </label>
                          </div>
                        </div>

                        {/* Menge (Min - Max) & Einheit */}
                        <div className="md:col-span-2 flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Menge (Min - Max)
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={item.minQuantity ?? 1}
                              onChange={e => handleUpdateLootItem(index, { minQuantity: parseInt(e.target.value, 10) || 1 })}
                              className="w-12 bg-slate-900 border border-slate-700/80 rounded-lg px-1.5 py-1.5 text-xs text-center text-slate-200 outline-none focus:border-amber-500"
                            />
                            <span className="text-slate-500 text-xs">-</span>
                            <input
                              type="number"
                              min="1"
                              value={item.maxQuantity ?? 1}
                              onChange={e => handleUpdateLootItem(index, { maxQuantity: parseInt(e.target.value, 10) || 1 })}
                              className="w-12 bg-slate-900 border border-slate-700/80 rounded-lg px-1.5 py-1.5 text-xs text-center text-slate-200 outline-none focus:border-amber-500"
                            />
                            <select
                              value={item.unit || 'Stück'}
                              onChange={e => handleUpdateLootItem(index, { unit: e.target.value })}
                              className="bg-slate-900 border border-slate-700/80 rounded-lg px-1.5 py-1.5 text-[11px] text-slate-300 outline-none focus:border-amber-500"
                            >
                              {STANDARD_UNITS.slice(0, 8).map(u => (
                                <option key={u} value={u}>{u}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Löschen */}
                        <div className="md:col-span-1 flex items-end justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLootItem(index)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                            title="Eintrag entfernen"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        </div>
                      </div>

                      {/* Gewinnungs-Bedingung & Alchemie-Voraussetzung */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">
                            Bedingung / Werkzeug:
                          </span>
                          <input
                            type="text"
                            value={item.harvestCondition || ''}
                            onChange={e => handleUpdateLootItem(index, { harvestCondition: e.target.value })}
                            placeholder="z.B. Kürschnermesser, Alchemiewerkzeug, unversehrter Kadaver..."
                            className="w-full bg-slate-900/80 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">
                            Hauptkategorie:
                          </span>
                          <select
                            value={item.category || 'Rohstoffe'}
                            onChange={e => handleUpdateLootItem(index, { category: e.target.value })}
                            className="w-full bg-slate-900/80 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 outline-none focus:border-amber-500"
                          >
                            {ITEM_MAIN_CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Freitext-Zusammenfassungen & Währungsausbeute */}
          <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-300">
              Ergänzende Beuteangaben &amp; Freitext
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Garantierte Beute (Text)</label>
                <AutoExpandingTextarea
                  value={getDetail('guaranteedDrops')}
                  onChange={e => updateDetail('guaranteedDrops', e.target.value)}
                  placeholder="z.B. 1x Wolfsfell, 2x Fangzähne, 1x Bestien-Essenz..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Seltene Drops &amp; Schätze (Text)
                </label>
                <AutoExpandingTextarea
                  value={getDetail('rareDrops')}
                  onChange={e => updateDetail('rareDrops', e.target.value)}
                  placeholder="z.B. 5% Uralter Rubin, 2% Schattenklinge des Anführers..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">
                  Verwertbare Rohstoffe (Harvesting-Text)
                </label>
                <AutoExpandingTextarea
                  value={getDetail('harvestableParts')}
                  onChange={e => updateDetail('harvestableParts', e.target.value)}
                  placeholder="z.B. Giftbeutel (erfordert Stufe 2 Alchemie), Chitin-Panzerplatte..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[50px]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-300">Typische Währungsausbeute</label>
                <input
                  type="text"
                  value={getDetail('goldDrop')}
                  onChange={e => updateDetail('goldDrop', e.target.value)}
                  placeholder="z.B. 5 - 15 Silbermünzen, 50 Goldmünzen (Boss)..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Geheimnisse & Wissen */}
      {activeTab === 'geheimnisse' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-150">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Stufe 1: Allgemeines Wissen / Bestiarium-Eintrag</span>
            </label>
            <AutoExpandingTextarea
              value={editForm.secretsStage1 || ''}
              onChange={e => setEditForm(prev => ({ ...prev, secretsStage1: e.target.value }))}
              placeholder="Was jeder Jäger oder Abenteurer über diesen Gegner weiß..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[70px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Stufe 2: Gerüchte &amp; Schwachstellen-Hinweise</span>
            </label>
            <AutoExpandingTextarea
              value={editForm.secretsStage2 || ''}
              onChange={e => setEditForm(prev => ({ ...prev, secretsStage2: e.target.value }))}
              placeholder="Gerüchte über besondere Taktiken, geheime Nester oder seltene Mutationen..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[70px]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Stufe 3: Absolutes Geheimnis / Verborgene Herkunft</span>
            </label>
            <AutoExpandingTextarea
              value={editForm.secretsStage3 || ''}
              onChange={e => setEditForm(prev => ({ ...prev, secretsStage3: e.target.value }))}
              placeholder="Antike Ursprünge, Schöpfer-Flüche, Zähmbarkeit oder unverwundbare Kerne..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500 min-h-[70px]"
            />
          </div>
        </div>
      )}

      {/* Footer Speichern & Abbrechen */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium transition-all cursor-pointer"
        >
          Abbrechen
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={!editForm.title?.trim()}
          className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
        >
          <i className="fa-solid fa-floppy-disk"></i>
          <span>{isEditing ? 'Änderungen speichern' : 'Gegner anlegen'}</span>
        </button>
      </div>
    </div>
  );
};
