import React, { useState, useEffect, useRef } from 'react';
import { LoreEntry, LoreCategory } from '../types';
import { GeminiService } from '../services/geminiService';
import { autoCalculateAppearance } from '../utils/appearance';
import CharacterPowerRadar from './CharacterPowerRadar';
import { CampaignPowerParameter } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';

interface Props {
  lore: LoreEntry[];
  onUpdateLore: (lore: LoreEntry[]) => void;
  onClose: () => void;
  worldTitle?: string;
  isNsfw?: boolean;
  worldPowerSettings?: Record<string, number | CampaignPowerParameter>;
  playerName?: string;
  world?: any;
}

const CATEGORIES: LoreCategory[] = ['Charaktere', 'Orte', 'Fraktionen', 'Gegenstände', 'Fähigkeiten', 'Events', 'Weltregeln', 'Gegner'];

const GENDER_OPTIONS = ["Männlich", "Weiblich", "Divers", "Nicht-Binär", "Androgyn", "Unbekannt"];
const BUILD_OPTIONS = ["Schlank", "Sportlich", "Muskulös", "Kräftig", "Zierlich", "Drahtig", "Kurvig", "Stämmig", "Hager", "Unbekannt"];
const CUP_SIZE_OPTIONS = ["-", "AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];

const ITEM_TYPE_OPTIONS = [
  "Verbrauchsgüter",
  "Waffen",
  "Rüstung / Kleidung",
  "Artefakte / Zubehör",
  "Werkzeuge & Alltags-Gegenstände",
  "Questgegenstände / Story-Objekte"
];

const DEFAULT_POWER_SOURCES = ["Mana", "Chakra", "Ausdauer", "Aura", "Zorn", "Glaube", "Blutmagie", "Technologie", "Göttlich", "Keine"];
const DEFAULT_POWER_COSTS = ["MP (Magiepunkte)", "SP (Spezialpunkte)", "HP (Lebenspunkte)", "Ausdauer", "Chakra", "Energie", "Fokus", "Keine"];

const LoreDatabaseView: React.FC<Props> = ({ lore, onUpdateLore, onClose, worldTitle = '', isNsfw = false, worldPowerSettings, playerName = '', world }) => {
  const [activeCategory, setActiveCategory] = useState<LoreCategory>('Charaktere');
  const [loreSmartFill, setLoreSmartFill] = useState<string>('');
  const [isSmartFillingLore, setIsSmartFillingLore] = useState(false);
  const [keepExistingLoreDetails, setKeepExistingLoreDetails] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LoreEntry>>({ category: 'Charaktere' });
  const [isGeneratingImg, setIsGeneratingImg] = useState<boolean>(false);
  const formTopRef = useRef<HTMLDivElement>(null);

  const [newEventStepText, setNewEventStepText] = useState('');
  const [newEventStepTitle, setNewEventStepTitle] = useState('');
  const [newEventStepBranch, setNewEventStepBranch] = useState<'main' | 'side'>('main');
  const [newEventStepConditions, setNewEventStepConditions] = useState('');
  const [newEventStepChatInstruction, setNewEventStepChatInstruction] = useState('');
  const [newEventStepTravelPath, setNewEventStepTravelPath] = useState('');
  const [newEventStepTravelDurationDays, setNewEventStepTravelDurationDays] = useState<number | ''>('');
  const [newEventStepTimeOfDay, setNewEventStepTimeOfDay] = useState('');
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const handleAddManualStep = () => {
    if (!newEventStepText.trim()) return;
    const steps = [...(editForm.details?.eventSteps || [])];
    
    if (editingStepId) {
      // Edit mode
      const updatedSteps = steps.map(s => s.id === editingStepId ? {
        ...s,
        title: newEventStepTitle.trim() || s.title || `Station #${steps.indexOf(s) + 1}`,
        description: newEventStepText.trim(),
        branch: newEventStepBranch,
        unlockConditions: newEventStepConditions.trim() || 'Keine',
        chatInstruction: newEventStepChatInstruction.trim(),
        travelPath: newEventStepTravelPath.trim(),
        travelDurationDays: newEventStepTravelDurationDays !== '' ? Number(newEventStepTravelDurationDays) : undefined,
        timeOfDay: newEventStepTimeOfDay.trim()
      } : s);
      updateAndSyncSteps(updatedSteps);
      setEditingStepId(null);
    } else {
      // Add mode
      const newStep = {
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
        title: newEventStepTitle.trim() || `Station #${steps.length + 1}`,
        description: newEventStepText.trim(),
        status: 'planned' as const,
        branch: newEventStepBranch,
        unlockConditions: newEventStepConditions.trim() || 'Keine',
        chatInstruction: newEventStepChatInstruction.trim(),
        travelPath: newEventStepTravelPath.trim(),
        travelDurationDays: newEventStepTravelDurationDays !== '' ? Number(newEventStepTravelDurationDays) : undefined,
        timeOfDay: newEventStepTimeOfDay.trim()
      };
      const updatedSteps = [...steps, newStep];
      updateAndSyncSteps(updatedSteps);
    }
    
    // Clear inputs
    setNewEventStepText('');
    setNewEventStepTitle('');
    setNewEventStepBranch('main');
    setNewEventStepConditions('');
    setNewEventStepChatInstruction('');
    setNewEventStepTravelPath('');
    setNewEventStepTravelDurationDays('');
    setNewEventStepTimeOfDay('');
  };

  const handleStartEditStep = (step: any) => {
    setEditingStepId(step.id);
    setNewEventStepTitle(step.title || '');
    setNewEventStepText(step.description || '');
    setNewEventStepBranch(step.branch || 'main');
    setNewEventStepConditions(step.unlockConditions || '');
    setNewEventStepChatInstruction(step.chatInstruction || '');
    setNewEventStepTravelPath(step.travelPath || '');
    setNewEventStepTravelDurationDays(step.travelDurationDays !== undefined ? step.travelDurationDays : '');
    setNewEventStepTimeOfDay(step.timeOfDay || '');
  };

  const handleCancelEditStep = () => {
    setEditingStepId(null);
    setNewEventStepText('');
    setNewEventStepTitle('');
    setNewEventStepBranch('main');
    setNewEventStepConditions('');
    setNewEventStepChatInstruction('');
    setNewEventStepTravelPath('');
    setNewEventStepTravelDurationDays('');
    setNewEventStepTimeOfDay('');
  };

  const updateAndSyncSteps = (updatedSteps: any[]) => {
    const prev = editForm;
    const details = { ...(prev.details || {}), eventSteps: updatedSteps };
    const description = updatedSteps.map((s, idx) => `${idx + 1}. [${s.title}] ${s.description}`).join('\n');
    const title = prev.title && prev.title !== 'Ereignis-Timeline' ? prev.title : (updatedSteps[0] ? `Ereignis-Timeline (${updatedSteps[0].description.slice(0, 20)}...)` : 'Ereignis-Timeline');
    const updatedEntry = {
      ...prev,
      title,
      description,
      details
    } as LoreEntry;

    setEditForm(updatedEntry);

    // Automatically persist to the lore database
    if (prev.id) {
      onUpdateLore(lore.map(l => l.id === prev.id ? updatedEntry : l));
    }
  };

  const handleUpdateStepText = (id: string, text: string) => {
    const steps = [...(editForm.details?.eventSteps || [])];
    const updated = steps.map(s => s.id === id ? { ...s, description: text } : s);
    updateAndSyncSteps(updated);
  };

  const handleToggleStepStatus = (id: string) => {
    const steps = [...(editForm.details?.eventSteps || [])];
    const updated = steps.map(s => s.id === id ? { ...s, status: s.status === 'happened' ? 'planned' : 'happened' } : s);
    updateAndSyncSteps(updated);
  };

  const handleMoveStep = (fromIdx: number, toIdx: number) => {
    const steps = [...(editForm.details?.eventSteps || [])];
    if (toIdx < 0 || toIdx >= steps.length) return;
    const temp = steps[fromIdx];
    steps[fromIdx] = steps[toIdx];
    steps[toIdx] = temp;
    
    // Also update titles to reflect new order if it's a default title, otherwise keep custom title!
    const resortedSteps = steps.map((s, idx) => ({ 
      ...s, 
      title: s.title && !s.title.startsWith('Station #') ? s.title : `Station #${idx + 1}` 
    }));
    updateAndSyncSteps(resortedSteps);
  };

  const handleDeleteStep = (id: string) => {
    const steps = [...(editForm.details?.eventSteps || [])];
    const updatedBeforeResort = steps.filter(s => s.id !== id);
    const updated = updatedBeforeResort.map((s, idx) => ({ 
      ...s, 
      title: s.title && !s.title.startsWith('Station #') ? s.title : `Station #${idx + 1}` 
    }));
    updateAndSyncSteps(updated);
    if (editingStepId === id) {
      handleCancelEditStep();
    }
  };

  useEffect(() => {
    if (activeCategory === 'Events') {
      const eventEntry = lore.find(l => l.category === 'Events');
      if (eventEntry) {
        setIsEditing(eventEntry.id);
        setEditForm(eventEntry);
      } else {
        const newEventEntry: LoreEntry = {
          id: 'single-story-events-timeline',
          category: 'Events',
          title: 'Ereignis-Timeline',
          description: 'Chronologischer Ablauf der Geschichte',
          isUnlocked: true,
          details: {
            eventSteps: []
          }
        };
        onUpdateLore([...lore, newEventEntry]);
        setIsEditing(newEventEntry.id);
        setEditForm(newEventEntry);
      }
    } else {
      if (isEditing && lore.find(l => l.id === isEditing)?.category === 'Events') {
        setIsEditing(null);
        setEditForm({ category: activeCategory });
      } else if (!isEditing) {
        setEditForm({ category: activeCategory });
      }
    }
  }, [activeCategory]);

  const handleSave = () => {
    if (!editForm.title || !editForm.description) return;
    
    let newLore;
    if (isEditing) {
      newLore = lore.map(l => l.id === isEditing ? { ...l, ...editForm } as LoreEntry : l);
    } else {
      newLore = [...lore, { 
        ...editForm, 
        id: Date.now().toString(), 
        category: editForm.category || activeCategory,
        isUnlocked: editForm.isUnlocked !== false 
      } as LoreEntry];
    }
    
    onUpdateLore(newLore);
    setIsEditing(null);
    setEditForm({ category: activeCategory });
  };

  const handleDelete = (id: string) => {
    onUpdateLore(lore.filter(l => l.id !== id));
    if (isEditing === id) {
      setIsEditing(null);
      setEditForm({ category: activeCategory });
    }
  };

  const handleLoreSmartFill = async () => {
    if (!loreSmartFill.trim()) return;
    setIsSmartFillingLore(true);
    try {
      const cat = editForm.category || activeCategory;
      const existingCharacterNames: string[] = [];
      lore.filter(l => l.category === 'Charaktere' || l.category === 'Gegner').forEach(l => {
        if (l.title) existingCharacterNames.push(l.title);
        if (l.details?.nickname) existingCharacterNames.push(l.details.nickname);
      });
      const existingFactions = lore
        .filter(l => l.category === 'Fraktionen')
        .map(l => l.title)
        .filter(Boolean);
      const data = await GeminiService.autofillLoreEntry(
        loreSmartFill, 
        cat, 
        worldPowerSettings, 
        playerName, 
        existingCharacterNames,
        keepExistingLoreDetails ? editForm : undefined,
        world,
        existingFactions
      );
      const prev = editForm;
      let generatedAbilities = prev.details?.abilities;
      if ((cat === 'Charaktere' || cat === 'Gegner') && (data.details?.skills || data.details?.powerSource)) {
        const newAbil = {
          id: Date.now().toString(),
          source: data.details.powerSource || '',
          cost: data.details.powerCost || '',
          description: data.details.skills || '',
          techniques: data.details.techniques || '',
          techniqueList: (data.details.techniqueList && Array.isArray(data.details.techniqueList))
            ? data.details.techniqueList.filter((t: any) => t && t.name).map((t: any, index: number) => ({ 
                id: `${Date.now()}-${index}`, 
                name: t.name.trim(), 
                description: t.description ? t.description.trim() : '',
                type: t.type || 'Angriff',
                subtype: t.subtype || 'Einzelschuss',
                level: t.level || 1,
                maxLevel: t.maxLevel || 10,
                xp: t.xp || 0,
                xpNeeded: t.xpNeeded || 100
              }))
            : (data.details.techniques 
                ? data.details.techniques.split(/[,\n;]/).map((s: string) => s.trim()).filter(Boolean).map((name: string, index: number) => ({ 
                    id: `${Date.now()}-${index}`, 
                    name, 
                    description: '',
                    type: 'Angriff',
                    subtype: 'Einzelschuss',
                    level: 1,
                    maxLevel: 10,
                    xp: 0,
                    xpNeeded: 100
                  }))
                : []
              )
        };
        if (keepExistingLoreDetails && prev.details?.abilities && prev.details.abilities.length > 0) {
          generatedAbilities = [...prev.details.abilities, newAbil];
        } else {
          generatedAbilities = [newAbil];
        }
      }
      let processedDetails = { ...data.details };
      if (cat === 'Charaktere' || cat === 'Gegner') {
        // Normalize Gender
        if (processedDetails.gender) {
          const g = processedDetails.gender.trim().toLowerCase();
          if (g === 'male' || g.startsWith('männ')) processedDetails.gender = 'Männlich';
          else if (g === 'female' || g.startsWith('weib')) processedDetails.gender = 'Weiblich';
          else if (g === 'divers') processedDetails.gender = 'Divers';
          else if (g.includes('nicht') || g.includes('non') || g.includes('binär')) processedDetails.gender = 'Nicht-Binär';
          else if (g.startsWith('andro')) processedDetails.gender = 'Androgyn';
          else processedDetails.gender = 'Unbekannt';
        } else {
          processedDetails.gender = 'Unbekannt';
        }

        // Normalize Build
        if (processedDetails.build) {
          const b = processedDetails.build.trim().toLowerCase();
          if (b.startsWith('schlan')) processedDetails.build = 'Schlank';
          else if (b.startsWith('sport')) processedDetails.build = 'Sportlich';
          else if (b.startsWith('musk')) processedDetails.build = 'Muskulös';
          else if (b.startsWith('kräf')) processedDetails.build = 'Kräftig';
          else if (b.startsWith('zier')) processedDetails.build = 'Zierlich';
          else if (b.startsWith('drah')) processedDetails.build = 'Drahtig';
          else if (b.startsWith('kurv')) processedDetails.build = 'Kurvig';
          else if (b.startsWith('stämm')) processedDetails.build = 'Stämmig';
          else if (b.startsWith('hage')) processedDetails.build = 'Hager';
          else processedDetails.build = 'Unbekannt';
        } else {
          processedDetails.build = 'Unbekannt';
        }

        // Normalize Cup Size
        if (processedDetails.cupSize) {
          const c = processedDetails.cupSize.trim().toUpperCase();
          if (["AA", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"].includes(c)) {
            processedDetails.cupSize = c;
          } else {
            processedDetails.cupSize = '-';
          }
        }

        // Trigger auto calculation for character appearance so measurements etc. are beautifully populated
        processedDetails = autoCalculateAppearance(processedDetails, 'build', false);
      }
      
      let mergedRelationships = processedDetails.relationships || [];
      if (keepExistingLoreDetails && prev.details?.relationships && prev.details.relationships.length > 0) {
        const currentRels = [...prev.details.relationships];
        if (Array.isArray(mergedRelationships)) {
          mergedRelationships.forEach((newRel: any) => {
            const existingIdx = currentRels.findIndex((r: any) => r.targetCharacter?.toLowerCase() === newRel.targetCharacter?.toLowerCase());
            if (existingIdx >= 0) {
              currentRels[existingIdx] = { ...currentRels[existingIdx], ...newRel };
            } else {
              currentRels.push(newRel);
            }
          });
        }
        mergedRelationships = currentRels;
      }

      let finalTitle = data.title || prev.title;
      let finalDescription = (keepExistingLoreDetails && prev.description && data.description && prev.description !== data.description)
        ? `${prev.description}\n\n[Zusatz]: ${data.description}`
        : (data.description || prev.description);
      
      if (cat === 'Events') {
        if (processedDetails.eventSteps) {
          processedDetails.eventSteps = processedDetails.eventSteps.map((step: any, idx: number) => ({
            ...step,
            id: step.id || `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            title: step.title || `Station #${idx + 1}`,
            status: step.status || 'planned',
            branch: step.branch || 'main',
            unlockConditions: step.unlockConditions || 'Keine',
            chatInstruction: step.chatInstruction || '',
            travelPath: step.travelPath || '',
            travelDurationDays: step.travelDurationDays !== undefined ? Number(step.travelDurationDays) : undefined,
            timeOfDay: step.timeOfDay || ''
          }));
          finalDescription = processedDetails.eventSteps.map((s: any, idx: number) => `${idx + 1}. [${s.title}] ${s.description || ''}`).join('\n');
          if (!finalTitle || finalTitle === 'Events' || finalTitle === 'Event') {
            finalTitle = processedDetails.eventSteps[0]?.title || 'Ereignis-Timeline';
          }
        } else {
          processedDetails.eventSteps = [];
        }
      }

      const updatedEntry = {
        ...prev,
        title: finalTitle,
        description: finalDescription,
        secretsStage1: data.secretsStage1 !== undefined ? data.secretsStage1 : prev.secretsStage1,
        secretsStage2: data.secretsStage2 !== undefined ? data.secretsStage2 : prev.secretsStage2,
        secretsStage3: data.secretsStage3 !== undefined ? data.secretsStage3 : prev.secretsStage3,
        details: {
          ...prev.details,
          ...processedDetails,
          relationships: mergedRelationships,
          abilities: generatedAbilities,
          campaignPowerLevels: data.details?.campaignPowerLevels || prev.details?.campaignPowerLevels
        }
      } as LoreEntry;

      setEditForm(updatedEntry);

      if (cat === 'Events' && prev.id) {
        onUpdateLore(lore.map(l => l.id === prev.id ? updatedEntry : l));
      }
      setLoreSmartFill('');
    } catch (err: any) {
      console.error(err);
      alert("Fehler beim Smart Fill Lore");
    } finally {
      setIsSmartFillingLore(false);
    }
  };

  const handleEdit = (entry: LoreEntry) => {
    setIsEditing(entry.id);
    setActiveCategory(entry.category);
    setEditForm(entry);
    formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentCategory = editForm.category || activeCategory;

  const handleGenerateImage = async () => {
    if (!editForm.title) return;
    setIsGeneratingImg(true);
    try {
      let prompt = `Erstelle ein cineastisches Bild für den Codexeintrag "${editForm.title}" in der Welt "${worldTitle}".\n\n`;
      
      if (currentCategory === 'Charaktere' || currentCategory === 'Gegner') {
        prompt += `Es handelt sich um einen Charakter. Das Bild ist ein Portrait.
        - Geschlecht: ${editForm.details?.gender || 'Unbekannt'}
        - Rasse: ${editForm.details?.race || 'Unbekannt'}
        - Rassemerkmale: ${editForm.details?.raceFeatures || 'keine'}
        - Alter: ${editForm.details?.age || 'Unbekannt'}
        - Statur: ${editForm.details?.build || 'Unbekannt'}
        - Haare: ${editForm.details?.hairColor || 'Unbekannt'}
        - Augenfarbe: ${editForm.details?.eyeColor || 'Unbekannt'}
        - Kleidung/Rolle: ${editForm.details?.outfit || editForm.details?.role || 'Unbekannt'}
        - Gesinnung/Ziel: ${editForm.details?.goal || 'Neutral'}
        Realistischer, detaillierter Fantasy- oder Sci-Fi-Stil, je nach Welt. Fokus auf das Gesicht. Keine Schrift.`;
      } else if (currentCategory === 'Gegenstände') {
        prompt += `Es handelt sich um einen Gegenstand: ${editForm.details?.itemType || 'Unbekannt'}. Seltenheit: ${editForm.details?.rarity || 'Unbekannt'}.
        Beschreibung: ${editForm.description}.
        Das Bild zeigt den Gegenstand detailliert und von nahem, ohne Hintergrund oder auf einem sauberen Podest. Keine Schrift.`;
      } else if (currentCategory === 'Orte') {
        prompt += `Es handelt sich um einen Ort: ${editForm.details?.type || ''}. Klima: ${editForm.details?.climate || ''}.
        Beschreibung: ${editForm.description}. Landschaftsbild. Keine Schrift.`;
      } else {
        prompt += `Beschreibung: ${editForm.description}. Keine Schrift.`;
      }

      const imageUrl = await GeminiService.generateImage(prompt, isNsfw);
      if (imageUrl) {
        setEditForm(prev => ({ ...prev, image: imageUrl }));
      }
    } catch (e) {
      console.error(e);
      alert("Fehler bei der Bildgenerierung");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const filteredLore = lore
    .filter(l => l.category === activeCategory)
    .filter(l => {
      // Verhindere, dass der Hauptcharakter (Spieler) in der "Bestehende Charaktere" Liste angezeigt wird
      if ((activeCategory === 'Charaktere' || activeCategory === 'Gegner') && playerName && l.title?.trim().toLowerCase() === playerName.trim().toLowerCase()) {
        return false;
      }
      const matchesSearch = l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.description.toLowerCase().includes(searchTerm.toLowerCase());
      if (matchesSearch) return true;
      if (activeCategory === 'Events' && l.details?.eventSteps) {
        return l.details.eventSteps.some((s: any) => 
          (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
          (s.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return false;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const updateDetail = (key: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      details: {
        ...(prev.details || {}),
        [key]: value
      }
    }));
  };

  const updateAppearanceDetail = (key: string, value: any) => {
    setEditForm(prev => {
      const currentDetails = prev.details || {};
      let updatedAppearance = { ...currentDetails, [key]: value };
      updatedAppearance = autoCalculateAppearance(updatedAppearance, key);
      return {
        ...prev,
        details: updatedAppearance
      };
    });
  };

  return (
    <div className="w-full flex gap-6 flex-col">
      <div ref={formTopRef} className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Codex (Lore & Wissen)</h3>
          <p className="text-xs text-slate-400">Verwalte Charaktere, Orte, Fraktionen und Regeln dieser Welt.</p>
        </div>
      </div>

      <div className="w-full flex gap-2 overflow-x-auto pb-2 shrink-0 hide-scrollbar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`text-left px-4 py-2 text-sm rounded-xl transition-all whitespace-nowrap font-medium ${
              activeCategory === c 
              ? 'bg-amber-600 shadow-md shadow-amber-900/20 text-white'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {c === 'Charaktere' && <i className="fa-solid fa-users mr-2 opacity-70"></i>}
            {c === 'Gegner' && <i className="fa-solid fa-skull mr-2 opacity-70"></i>}
            {c === 'Orte' && <i className="fa-solid fa-map mr-2 opacity-70"></i>}
            {c === 'Fraktionen' && <i className="fa-solid fa-flag mr-2 opacity-70"></i>}
            {c === 'Gegenstände' && <i className="fa-solid fa-khanda mr-2 opacity-70"></i>}
            {c === 'Fähigkeiten' && <i className="fa-solid fa-fire mr-2 opacity-70"></i>}
            {c === 'Events' && <i className="fa-solid fa-bolt mr-2 opacity-70"></i>}
            {c === 'Weltregeln' && <i className="fa-solid fa-scale-balanced mr-2 opacity-70"></i>}
            {c}
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${activeCategory === c ? 'bg-black/20' : 'bg-slate-800'}`}>
              {c === 'Events' 
                ? (lore.find(l => l.category === 'Events')?.details?.eventSteps?.length || 0) 
                : lore.filter(l => l.category === c).length
              }
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {/* Editor Form (Always Visible) */}
        <div className="bg-slate-900/80 border border-amber-500/30 p-4 sm:p-6 rounded-2xl flex flex-col gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-amber-600 to-indigo-600 left-0"></div>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {activeCategory === 'Events' ? (
                <>
                  <i className="fa-solid fa-route text-amber-500"></i>
                  <span>Geschichte & Roter Faden der Kampagne</span>
                </>
              ) : (
                <>
                  <i className={`fa-solid ${isEditing ? 'fa-pen text-indigo-400' : 'fa-plus text-amber-500'}`}></i>
                  <span>{isEditing ? `"${editForm.title}" bearbeiten` : `Neuen Eintrag in ${activeCategory}`}</span>
                </>
              )}
            </h2>
          </div>

          {/* Lore Smart Fill */}
          {currentCategory !== 'Events' && (
            <div className="bg-slate-800/30 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3">
              <label className="text-xs text-amber-500 font-bold uppercase flex justify-between items-center">
                <span>Smart Fill {currentCategory}</span>
                <button 
                  onClick={handleLoreSmartFill}
                  disabled={isSmartFillingLore || !loreSmartFill.trim()}
                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-[10px] transition-all flex items-center gap-2"
                >
                  <i className={`fa-solid ${isSmartFillingLore ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
                  Automatisch Ausfüllen
                </button>
              </label>
              <textarea 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-300 text-xs min-h-[60px] outline-none focus:border-amber-500 resize-y" 
                placeholder={`Beschreibe den/die/das ${currentCategory} ausführlich (z.B. 'Ein 25-jähriger Krieger aus dem Nordland, stark gebaut...'). Die KI füllt dann die Felder darunter passend aus.`}
                value={loreSmartFill} 
                onChange={e => setLoreSmartFill(e.target.value)} 
              />
              <div className="flex items-center gap-2 px-1 select-none">
                <input 
                  type="checkbox" 
                  id="keepExistingLoreDetailsCheckbox"
                  checked={keepExistingLoreDetails} 
                  onChange={e => setKeepExistingLoreDetails(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer w-4 h-4 accent-amber-500"
                />
                <label htmlFor="keepExistingLoreDetailsCheckbox" className="text-[11px] text-slate-300 font-medium cursor-pointer">
                  <span className="text-emerald-400 font-bold">Ergänzungs-Modus:</span> Bestehende Daten behalten und neue Informationen hinzufügen
                </label>
              </div>
            </div>
          )}
          
          <div className="grid gap-4">
            {currentCategory !== 'Events' && currentCategory !== 'Charaktere' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Name / Titel <span className="text-red-500">*</span></label>
                <AutoExpandingTextarea 
                  className="bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-amber-500 outline-none w-full text-sm min-h-[46px]"
                  value={editForm.title || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="z.B. König Arthur, Die Schwarze Feste..."
                />
              </div>
            )}



            {(currentCategory === 'Charaktere' || currentCategory === 'Gegner') && (
              <div className="flex flex-col gap-5 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80">
                {/* 1. Name, Rufname, Spitzname & Rolle */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> Name des Charakters <span className="text-red-500">*</span>
                    </label>
                    <AutoExpandingTextarea 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-amber-500 outline-none w-full text-sm min-h-[46px] transition-all font-semibold"
                      value={editForm.title || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="z.B. Son Goku, Monkey D. Ruffy..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-emerald-400">◆</span> Rufname (Kampfanzeige)
                    </label>
                    <AutoExpandingTextarea 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-amber-500 outline-none w-full text-sm min-h-[46px] transition-all font-semibold"
                      value={editForm.details?.rufName || ''}
                      onChange={e => updateDetail('rufName', e.target.value)}
                      placeholder="z.B. Goku, Ruffy (Standard: Name)"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> Spitzname / Titel / Alias
                    </label>
                    <AutoExpandingTextarea 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-amber-500 outline-none w-full text-sm min-h-[46px] transition-all"
                      value={editForm.details?.nickname || ''}
                      onChange={e => updateDetail('nickname', e.target.value)}
                      placeholder="z.B. Akainu, Strohhut..."
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> Rolle / Beruf
                    </label>
                    <AutoExpandingTextarea 
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-white focus:border-amber-500 outline-none w-full text-sm min-h-[46px] transition-all"
                      value={editForm.details?.role || ''}
                      onChange={e => updateDetail('role', e.target.value)}
                      placeholder="z.B. Navigatorin, Kampfsportler..."
                    />
                  </div>
                </div>

                {/* 2. Aussehen Konsole */}
                <div className="p-5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-800/80 pb-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i>
                    Physisches Profil & Attribute
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Geschlecht</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none cursor-pointer focus:border-amber-500/50" 
                        value={editForm.details?.gender || 'Unbekannt'} 
                        onChange={e => updateAppearanceDetail('gender', e.target.value)}
                      >
                        {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Alter</label>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500/50" 
                        value={editForm.details?.age || ''} 
                        onChange={e => updateAppearanceDetail('age', e.target.value)} 
                        placeholder="z.B. 18 Jahre"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Statur</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none cursor-pointer focus:border-amber-500/50" 
                        value={editForm.details?.build || 'Unbekannt'} 
                        onChange={e => updateAppearanceDetail('build', e.target.value)}
                      >
                        {BUILD_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Haarfarbe</label>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500/50" 
                        placeholder="z.B. Orange" 
                        value={editForm.details?.hairColor || ''} 
                        onChange={e => updateAppearanceDetail('hairColor', e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Augenfarbe</label>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500/50" 
                        placeholder="z.B. Braun" 
                        value={editForm.details?.eyeColor || ''} 
                        onChange={e => updateAppearanceDetail('eyeColor', e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Körbchengröße</label>
                      <select 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none cursor-pointer focus:border-amber-500/50" 
                        value={editForm.details?.cupSize || "-"} 
                        onChange={e => updateAppearanceDetail('cupSize', e.target.value)}
                      >
                        {CUP_SIZE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Größe & Körpermaße</label>
                      <div className="flex gap-2">
                        <AutoExpandingTextarea 
                          className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500/50" 
                          placeholder="z.B. 170 cm" 
                          value={editForm.details?.height || ''} 
                          onChange={e => updateAppearanceDetail('height', e.target.value)} 
                        />
                        <AutoExpandingTextarea 
                          className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500/50" 
                          placeholder="z.B. 95-58-88" 
                          value={editForm.details?.measurements || ''} 
                          onChange={e => updateAppearanceDetail('measurements', e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rasse</label>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500/50" 
                        placeholder="z.B. Mensch" 
                        value={editForm.details?.race || ''} 
                        onChange={e => updateAppearanceDetail('race', e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Herkunft</label>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500/50" 
                        placeholder="z.B. East Blue" 
                        value={editForm.details?.origin || ''} 
                        onChange={e => updateAppearanceDetail('origin', e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Familie</label>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500/50" 
                        placeholder="z.B. Unbekannt" 
                        value={editForm.details?.family || ''} 
                        onChange={e => updateAppearanceDetail('family', e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1 col-span-1">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex justify-between">
                        <span>Fraktion</span>
                        {(() => {
                          const createdFactions = Array.from(new Set(lore.filter(l => l.category === 'Fraktionen').map(l => l.title).filter(Boolean)));
                          return createdFactions.length > 0 ? <span className="text-[9px] text-amber-500 font-normal">Wählen</span> : null;
                        })()}
                      </label>
                      <AutoExpandingTextarea 
                        aria-label="Charakter-Fraktion"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs outline-none focus:border-amber-500/50" 
                        placeholder="z.B. Strohhut-Bande" 
                        value={editForm.details?.faction || ''} 
                        onChange={e => updateDetail('faction', e.target.value)} 
                      />
                      {(() => {
                        const createdFactions = Array.from(new Set(lore.filter(l => l.category === 'Fraktionen').map(l => l.title).filter(Boolean)));
                        if (createdFactions.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {createdFactions.map(factionName => (
                              <button
                                key={factionName}
                                type="button"
                                onClick={() => updateDetail('faction', factionName)}
                                className={`text-[9.5px] px-2 py-1 rounded transition-all border ${
                                  editForm.details?.faction?.trim().toLowerCase() === factionName.trim().toLowerCase()
                                  ? 'bg-amber-600/30 text-amber-400 border-amber-500/50 font-semibold shadow-inner'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
                                }`}
                              >
                                {factionName}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Kleidung / Outfit</label>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs min-h-[46px] outline-none focus:border-amber-500/50" 
                        placeholder="z.B. Gestreiftes T-Shirt, brauner Rock..." 
                        value={editForm.details?.outfit || ''} 
                        onChange={e => updateAppearanceDetail('outfit', e.target.value)} 
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Rassemerkmale (Abweichungen von der menschlichen Norm)</label>
                      <AutoExpandingTextarea 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-xs min-h-[46px] outline-none focus:border-amber-500/50" 
                        placeholder="z.B. Katzenohren, Schweif, Krallen, geschlitzte Augen, Fell (Farbe/Muster/Verteilung), Flügel, Hörner etc. oder 'keine'" 
                        value={editForm.details?.raceFeatures || ''} 
                        onChange={e => updateAppearanceDetail('raceFeatures', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Persönliche Geschichte, Bestrebungen & Verhalten */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> Persönlichkeit
                    </label>
                    <AutoExpandingTextarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white min-h-[72px] text-sm outline-none focus:ring-1 focus:ring-amber-500/50" 
                      placeholder="Beschreibung der Charaktereigenschaften..." 
                      value={editForm.details?.personality || ''} 
                      onChange={e => updateDetail('personality', e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> Vergangenheit / Biografie <span className="text-red-500">*</span>
                    </label>
                    <AutoExpandingTextarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white min-h-[120px] text-sm outline-none focus:ring-1 focus:ring-amber-500/50 leading-relaxed" 
                      placeholder="Die detaillierte Lebensgeschichte oder Herkunft des Charakters..." 
                      value={editForm.description || ''} 
                      onChange={e => {
                        const val = e.target.value;
                        setEditForm(prev => ({
                          ...prev,
                          description: val,
                          details: {
                            ...(prev.details || {}),
                            bio: val
                          }
                        }));
                      }} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> Aktuelle Situation
                    </label>
                    <AutoExpandingTextarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white min-h-[80px] text-sm outline-none focus:ring-1 focus:ring-amber-500/50" 
                      placeholder="Was macht der Charakter zum aktuellen Zeitpunkt?" 
                      value={editForm.details?.currentSituation || ''} 
                      onChange={e => updateDetail('currentSituation', e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="text-amber-500">◆</span> Hauptziel / Motivation
                    </label>
                    <AutoExpandingTextarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white min-h-[80px] text-sm outline-none focus:ring-1 focus:ring-amber-500/50" 
                      placeholder="Welches langfristige Ziel treibt den Charakter an?" 
                      value={editForm.details?.goal || ''} 
                      onChange={e => updateDetail('goal', e.target.value)} 
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-3 bg-slate-900/30 p-3.5 border border-slate-800/80 rounded-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
                    <div>
                      <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Beziehungen & Verhalten zu anderen</span>
                      <span className="text-[10px] text-slate-500 block">Wer ist dieser Charakter für andere und wie verhält er sich zu ihnen?</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const newList = [
                          ...(editForm.details?.relationships || []),
                          { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), targetCharacter: '', type: '', behavior: '', _isCustom: false }
                        ];
                        updateDetail('relationships', newList);
                      }}
                      className="px-2 py-1 bg-amber-600/20 border border-amber-500/30 text-amber-500 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-amber-600/30 transition-all font-sans"
                    >
                      <i className="fa-solid fa-plus text-[9px]"></i> Eintrag hinzufügen
                    </button>
                  </div>

                  {(!editForm.details?.relationships || editForm.details.relationships.length === 0) ? (
                    <div className="text-[11px] text-slate-500 italic px-1 py-1">
                      Bisher keine Beziehungen angelegt. Klicke oben auf "+ Eintrag hinzufügen", um eine zu erstellen.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editForm.details.relationships.map((rel: any, idx: number) => (
                        <div key={rel.id || `rel-${idx}`} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex flex-col gap-3 relative animate-in fade-in duration-150">
                          <button 
                            type="button"
                            onClick={() => {
                              updateDetail('relationships', (editForm.details?.relationships || []).filter((r: any) => r.id !== rel.id));
                            }}
                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-400 hover:bg-red-400/20 rounded transition-colors text-xs"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                          
                          <div className="text-xs font-bold text-slate-400 mb-1">Beziehung #{idx + 1}</div>
                          
                          <div className="flex flex-col gap-4">
                            {/* Charakter / Ziel */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Charakter / Ziel</label>
                              {(() => {
                                const codexCharacters = lore.filter(item => (item.category === 'Charaktere' || item.category === 'Gegner') && item.title !== editForm.title && (playerName ? item.title?.trim().toLowerCase() !== playerName.trim().toLowerCase() : true));
                                const isCustom = rel._isCustom || (rel.targetCharacter && !codexCharacters.some(c => c.title === rel.targetCharacter) && (playerName ? rel.targetCharacter !== playerName : true));
                                
                                return !isCustom ? (
                                  <div className="flex gap-1.5 w-full">
                                    <select
                                      value={rel.targetCharacter || ''}
                                      onChange={e => {
                                        const val = e.target.value;
                                        const newList = [...(editForm.details?.relationships || [])];
                                        if (val === '__custom__') {
                                          newList[idx] = { ...rel, targetCharacter: '', _isCustom: true };
                                        } else {
                                          newList[idx] = { ...rel, targetCharacter: val, _isCustom: false };
                                        }
                                        updateDetail('relationships', newList);
                                      }}
                                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer h-[38px] w-full"
                                    >
                                      <option value="">-- Wählen --</option>
                                      {playerName && <option value={playerName}>{playerName} (Spieler)</option>}
                                      {codexCharacters.length > 0 && (
                                        <optgroup label="Codex Charaktere">
                                          {codexCharacters.map(c => (
                                            <option key={c.id} value={c.title}>{c.title}</option>
                                          ))}
                                        </optgroup>
                                      )}
                                      <option value="__custom__">✍️ Freitext...</option>
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newList = [...(editForm.details?.relationships || [])];
                                        newList[idx] = { ...rel, targetCharacter: '', _isCustom: true };
                                        updateDetail('relationships', newList);
                                      }}
                                      title="Freitext eingeben"
                                      className="px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-all flex items-center h-[38px]"
                                    >
                                      <i className="fa-solid fa-pen text-[9px]"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex gap-1.5 w-full">
                                    <input
                                      type="text"
                                      placeholder="Name / Gruppe..."
                                      value={rel.targetCharacter || ''}
                                      onChange={e => {
                                        const newList = [...(editForm.details?.relationships || [])];
                                        newList[idx] = { ...rel, targetCharacter: e.target.value };
                                        updateDetail('relationships', newList);
                                      }}
                                      className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-amber-500 h-[38px] w-full"
                                    />
                                    {(playerName || codexCharacters.length > 0) && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newList = [...(editForm.details?.relationships || [])];
                                          newList[idx] = { ...rel, targetCharacter: '', _isCustom: false };
                                          updateDetail('relationships', newList);
                                        }}
                                        title="Zurück zur Auswahl"
                                        className="px-2.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-all flex items-center h-[38px]"
                                      >
                                        <i className="fa-solid fa-list text-[10px]"></i>
                                      </button>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            
                            {/* Details Row under the target character select */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Beziehung zu ihm/ihr */}
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Beziehung zu ihm/ihr</label>
                                <AutoExpandingTextarea
                                  rows={3}
                                  value={rel.type || ''}
                                  onChange={e => {
                                    const newList = [...(editForm.details?.relationships || [])];
                                    newList[idx] = { ...rel, type: e.target.value };
                                    updateDetail('relationships', newList);
                                  }}
                                  placeholder="z.B. Rivalin, Gefährte"
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 min-h-[96px]"
                                />
                              </div>
                              
                              {/* Verhalten (Conduct) */}
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Verhalten (Conduct)</label>
                                <AutoExpandingTextarea
                                  rows={3}
                                  value={rel.behavior || ''}
                                  onChange={e => {
                                    const newList = [...(editForm.details?.relationships || [])];
                                    newList[idx] = { ...rel, behavior: e.target.value };
                                    updateDetail('relationships', newList);
                                  }}
                                  placeholder="z.B. Distanziert aber treu"
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500 min-h-[96px]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2 flex flex-col gap-4 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-sm font-bold text-slate-300">Fähigkeiten & Kräfte</h4>
                    <button 
                      onClick={() => updateDetail('abilities', [...(editForm.details?.abilities || []), { id: Date.now().toString(), source: '', cost: '', description: '', techniques: '' }])}
                      className="px-2 py-1 bg-amber-600/20 border border-amber-500/30 text-amber-500 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-amber-600/30 transition-all"
                    >
                      <i className="fa-solid fa-plus"></i> Kraft hinzufügen
                    </button>
                  </div>
                  
                  {editForm.details?.abilities && editForm.details.abilities.map((ability: any, idx: number) => (
                    <div key={ability.id || `ability-${idx}`} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex flex-col gap-3 relative">
                      <button 
                        onClick={() => updateDetail('abilities', editForm.details?.abilities?.filter((a: any) => a.id !== ability.id))}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-red-400 hover:bg-red-400/20 rounded transition-colors text-xs"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                      <div className="text-xs font-bold text-slate-400 mb-1">Kraft / Fähigkeit #{idx + 1}</div>
                      {(() => {
                        const customSourceNames = world?.customResourceMappings?.map((m: any) => m.name) || [];
                        const sourceVal = ability.source || '';
                        const isSourceInOptions = customSourceNames.includes(sourceVal);
                        const selectedSourceOpt = sourceVal === '' ? '' : (isSourceInOptions ? sourceVal : '__custom__');

                        const customCostOptions = world?.costResources?.map((r: any) => r.name) || [];
                        const defaultCostFallbacks = customCostOptions.length > 0 ? customCostOptions : ["MP", "Ausdauer"];
                        const costVal = ability.cost || '';
                        const isCostInOptions = defaultCostFallbacks.includes(costVal);
                        const selectedCostOpt = costVal === '' ? '' : (isCostInOptions ? costVal : '__custom__');

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Kraftquelle */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Kraftquelle</label>
                              <select 
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px]"
                                value={sourceVal}
                                onChange={e => {
                                  const val = e.target.value;
                                  updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? {...a, source: val} : a));
                                }}
                              >
                                <option value="">-- Wählen (Keine) --</option>
                                {customSourceNames.length > 0 && (
                                  <optgroup label="Spezial-Ressourcen / Kraftquellen">
                                    {customSourceNames.map((name: string, mIdx: number) => <option key={`lore-custom-${name}-${mIdx}`} value={name}>{name}</option>)}
                                  </optgroup>
                                )}
                              </select>
                            </div>

                            {/* Kosten / Verbrauch */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Kosten / Verbrauch</label>
                              <select 
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px]"
                                value={costVal}
                                onChange={e => {
                                  const val = e.target.value;
                                  updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? {...a, cost: val} : a));
                                }}
                              >
                                <option value="">-- Wählen (Keine) --</option>
                                <optgroup label="Kosten- & Verbrauchs-Ressourcen">
                                  {defaultCostFallbacks.map((name: string, idx: number) => <option key={`lore-cost-${name}-${idx}`} value={name}>{name}</option>)}
                                </optgroup>
                              </select>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Fähigkeit (Beschreibung)</label>
                        <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white min-h-[60px] text-sm outline-none focus:border-amber-500" placeholder="z.B. Mystische Zoan Frucht Modell Eis Fuchs..." value={ability.description || ''} onChange={e => updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? {...a, description: e.target.value} : a))} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Techniken</label>
                          <button 
                            type="button"
                            onClick={() => {
                              const activeWorld = world || {};
                              const defaultRules = activeWorld.techniqueRules || {
                                Angriff: { type: 'Angriff', defaultSubtype: 'Einzelschuss', mainParameter: 'Stärke', progressionCostValue: 100, costResourceName: 'Mana', costValue: 10, levelScaling: 'Linear (+10% Schaden pro Level)' }
                              };
                              const rule = defaultRules['Angriff'] || {
                                type: 'Angriff',
                                defaultSubtype: 'Einzelschuss',
                                mainParameter: 'Stärke',
                                progressionCostValue: 100,
                                costResourceName: 'Mana',
                                costValue: 10,
                                levelScaling: 'Linear (+10% Schaden pro Level)'
                              };
                              const progLogic = activeWorld.techniqueProgressionLogic || 'ep';
                              const newTech = {
                                id: Date.now().toString(),
                                name: '',
                                type: 'Angriff' as const,
                                subtype: rule.defaultSubtype,
                                description: rule.levelScaling,
                                level: 1,
                                maxLevel: 10,
                                xp: 0,
                                xpNeeded: progLogic === 'ep' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 100) : undefined,
                                xpGainPerUse: progLogic === 'ep' ? 10 : undefined,
                                trainingRequired: progLogic === 'training' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 3) : undefined,
                                trainingProgress: progLogic === 'training' ? 0 : undefined,
                                milestoneRequirement: progLogic === 'milestone' ? String(rule.progressionCostValue || 'Nach Bosskampf') : undefined,
                                staticCost: progLogic === 'static' ? String(rule.progressionCostValue || '5 FP') : undefined,
                                cost: `${rule.costValue} ${rule.costResourceName}`,
                                tier: 'Tier 1',
                                baseValue: 0,
                                costResourceName: rule.costResourceName || 'Mana',
                                costValue: rule.costValue || 10,
                                costFormula: 'absolut'
                              };
                              const newTechList = [...(ability.techniqueList || []), newTech];
                              updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? {...a, techniqueList: newTechList} : a));
                            }}
                            className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                          >
                            + Technik hinzufügen
                          </button>
                        </div>
                        {(!ability.techniqueList || ability.techniqueList.length === 0) ? (
                          <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white min-h-[60px] text-sm outline-none focus:border-amber-500" placeholder="z.B. Eis Atem, Angriff mit Eiszapfen..." value={ability.techniques || ''} onChange={e => updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? {...a, techniques: e.target.value} : a))} />
                        ) : (
                          <div className="flex flex-col gap-2.5 mt-1">
                            {ability.techniqueList.map((tech: any, tIdx: number) => (
                              <div key={tech.id || `tech-${tIdx}`} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex flex-col gap-2 relative group">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-slate-500 font-extrabold uppercase">Technik #{tIdx + 1}</span>
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const newTechList = ability.techniqueList?.filter((t: any) => t.id !== tech.id) || [];
                                      updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList, techniques: newTechList.map((t:any) => t.name).join(', ') } : a));
                                    }}
                                    className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20"
                                  >
                                    <i className="fa-solid fa-trash-can text-[9px]"></i> Löschen
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                                  {/* Name der Technik */}
                                  <div className="md:col-span-5 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Name der Technik</label>
                                    <AutoExpandingTextarea 
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-600" 
                                      placeholder="z.B. Eis Atem"
                                      value={tech.name || ''}
                                      onChange={e => {
                                        const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, name: e.target.value } : t) || [];
                                        updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList, techniques: newTechList.map((t:any) => t.name).join(', ') } : a));
                                      }}
                                    />
                                  </div>

                                  {/* Typ */}
                                  <div className="md:col-span-3 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Typ</label>
                                    <select
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] text-slate-200"
                                      value={tech.type || 'Angriff'}
                                      onChange={e => {
                                        const activeWorld = world || {};
                                        const newType = e.target.value as any;
                                        const defaultRules = activeWorld.techniqueRules || {
                                          Angriff: { type: 'Angriff', defaultSubtype: 'Einzelschuss', mainParameter: 'Stärke', progressionCostValue: 100, costResourceName: 'Mana', costValue: 10, levelScaling: 'Linear (+10% Schaden pro Level)' },
                                          Verteidigung: { type: 'Verteidigung', defaultSubtype: 'Schild/Barriere', mainParameter: 'Ausdauer', progressionCostValue: 100, costResourceName: 'Mana', costValue: 8, levelScaling: 'Linear (+15% Absorption pro Level)' },
                                          Transformation: { type: 'Transformation', defaultSubtype: 'Modus/Form', mainParameter: 'Magie', progressionCostValue: 100, costResourceName: 'Mana', costValue: 15, levelScaling: 'Flach (Verlängert Dauer um +5s pro Level)' },
                                          Support: { type: 'Support', defaultSubtype: 'Direkte Heilung', mainParameter: 'Intelligenz', progressionCostValue: 100, costResourceName: 'Mana', costValue: 12, levelScaling: 'Linear (+12% Effekt pro Level)' }
                                        };
                                        const rule = defaultRules[newType] || {
                                          type: newType,
                                          defaultSubtype: newType === 'Angriff' ? 'Einzelschuss' : newType === 'Verteidigung' ? 'Schild/Barriere' : newType === 'Transformation' ? 'Modus/Form' : 'Direkte Heilung',
                                          mainParameter: newType === 'Angriff' ? 'Stärke' : newType === 'Verteidigung' ? 'Ausdauer' : newType === 'Transformation' ? 'Magie' : 'Intelligenz',
                                          progressionCostValue: activeWorld.techniqueProgressionLogic === 'ep' ? 100 : activeWorld.techniqueProgressionLogic === 'training' ? 3 : 'Nach Bosskampf',
                                          costResourceName: 'Mana',
                                          costValue: newType === 'Angriff' ? 10 : newType === 'Verteidigung' ? 8 : newType === 'Transformation' ? 15 : 12,
                                          levelScaling: newType === 'Angriff' ? 'Linear (+10% Schaden pro Level)' : newType === 'Verteidigung' ? 'Linear (+15% Absorption pro Level)' : newType === 'Transformation' ? 'Flach (Verlängert Dauer um +5s pro Level)' : 'Linear (+12% Effekt pro Level)'
                                        };
                                        const progLogic = activeWorld.techniqueProgressionLogic || 'ep';
                                        
                                        const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { 
                                          ...t, 
                                          type: newType, 
                                          subtype: rule.defaultSubtype,
                                          description: rule.levelScaling,
                                          xpNeeded: progLogic === 'ep' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 100) : undefined,
                                          trainingRequired: progLogic === 'training' ? (typeof rule.progressionCostValue === 'number' ? rule.progressionCostValue : 3) : undefined,
                                          milestoneRequirement: progLogic === 'milestone' ? String(rule.progressionCostValue || 'Nach Bosskampf') : undefined,
                                          staticCost: progLogic === 'static' ? String(rule.progressionCostValue || '5 FP') : undefined,
                                          cost: `${rule.costValue} ${rule.costResourceName}`
                                        } : t) || [];
                                        
                                        updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                      }}
                                    >
                                      <option value="Angriff">💥 Angriff</option>
                                      <option value="Transformation">🧬 Transformation</option>
                                      <option value="Verteidigung">🛡️ Verteidigung</option>
                                      <option value="Support">🧪 Support</option>
                                    </select>
                                  </div>

                                  {/* Untertyp */}
                                  <div className="md:col-span-4 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Untertyp</label>
                                    {(() => {
                                      const currentType = tech.type || 'Angriff';
                                      const presets = currentType === 'Angriff' 
                                        ? ['Einzelschuss', 'Flächenangriff', 'Nahkampf', 'Fernkampf', 'Kettenangriff', 'Sonstiges']
                                        : currentType === 'Transformation'
                                        ? ['Modus/Form', 'Teilverwandlung', 'Vollverwandlung', 'Sonstiges']
                                        : currentType === 'Verteidigung'
                                        ? ['Schild/Barriere', 'Parade/Konter', 'Ausweichen', 'Sonstiges']
                                        : ['Direkte Heilung', 'Regeneration', 'Stärkung (Buff)', 'Schwächung (Debuff)', 'Zustandsheilung', 'Sonstiges'];
                                      
                                      const isCustom = tech.subtype && !presets.includes(tech.subtype);
                                      const selectVal = isCustom ? 'Sonstiges' : (tech.subtype || presets[0]);

                                      return (
                                        <div className="flex flex-col gap-1">
                                          <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] text-slate-200"
                                            value={selectVal}
                                            onChange={e => {
                                              const val = e.target.value;
                                              const newSubtype = val === 'Sonstiges' ? '' : val;
                                              const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, subtype: newSubtype } : t) || [];
                                              updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                            }}
                                          >
                                            {presets.map(p => (
                                              <option key={p} value={p}>{p}</option>
                                            ))}
                                          </select>
                                          {(selectVal === 'Sonstiges' || isCustom) && (
                                            <input
                                              type="text"
                                              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-[11px] outline-none focus:border-amber-500 placeholder-slate-600 mt-1"
                                              placeholder="Eigener Untertyp..."
                                              value={tech.subtype || ''}
                                              onChange={e => {
                                                const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, subtype: e.target.value } : t) || [];
                                                updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                              }}
                                            />
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Tier */}
                                  <div className="md:col-span-3 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Tier</label>
                                    <select
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] text-slate-200 font-mono"
                                      value={tech.tier || 'Tier 1'}
                                      onChange={e => {
                                        const val = e.target.value;
                                        const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, tier: val } : t) || [];
                                        updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                      }}
                                    >
                                      <option value="Tier 1">Tier 1</option>
                                      <option value="Tier 2">Tier 2</option>
                                      <option value="Tier 3">Tier 3</option>
                                      <option value="Tier 4">Tier 4</option>
                                    </select>
                                  </div>

                                  {/* Basis-Wert */}
                                  <div className="md:col-span-2 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Basis-Wert</label>
                                    <input
                                      type="number"
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] font-mono text-center"
                                      placeholder="z.B. 15"
                                      value={tech.baseValue !== undefined ? tech.baseValue : 0}
                                      onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, baseValue: val } : t) || [];
                                        updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                      }}
                                    />
                                  </div>

                                  {/* Kosten */}
                                  {(() => {
                                    const activeWorld = world || {};
                                    const createdCostResources = activeWorld.costResources?.map((r: any) => r.name) || [];
                                    const costResourceOptions = createdCostResources.length > 0 
                                      ? createdCostResources 
                                      : ['MP', 'SP'];

                                    return (
                                      <div className="md:col-span-7 flex flex-col gap-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase">Kosten (Ressource, Typ & Wert)</label>
                                        <div className="flex gap-1.5 w-full">
                                          {/* Resource Dropdown */}
                                          <select
                                            className="w-[40%] bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] font-mono text-slate-200"
                                            value={tech.costResourceName || (costResourceOptions[0] || 'MP')}
                                            onChange={e => {
                                              const resName = e.target.value;
                                              const costVal = tech.costValue !== undefined ? tech.costValue : 10;
                                              const formula = tech.costFormula || 'absolut';
                                              const combinedCost = `${costVal}${formula === 'proz.' ? '%' : ''} ${resName}`;
                                              const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { 
                                                ...t, 
                                                costResourceName: resName,
                                                cost: combinedCost
                                              } : t) || [];
                                              updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                            }}
                                          >
                                            {costResourceOptions.map((res: string) => (
                                              <option key={res} value={res}>{res}</option>
                                            ))}
                                          </select>

                                          {/* Formula Selection */}
                                          <select
                                            className="w-[30%] bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 cursor-pointer h-[38px] font-mono text-slate-200"
                                            value={tech.costFormula || 'absolut'}
                                            onChange={e => {
                                              const formula = e.target.value as 'absolut' | 'proz.';
                                              const resName = tech.costResourceName || (costResourceOptions[0] || 'MP');
                                              const costVal = tech.costValue !== undefined ? tech.costValue : 10;
                                              const combinedCost = `${costVal}${formula === 'proz.' ? '%' : ''} ${resName}`;
                                              const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { 
                                                ...t, 
                                                costFormula: formula,
                                                cost: combinedCost
                                              } : t) || [];
                                              updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                            }}
                                          >
                                            <option value="absolut">Abs.</option>
                                            <option value="proz.">Proz.</option>
                                          </select>

                                          {/* Cost Value Input */}
                                          <input
                                            type="number"
                                            min="0"
                                            className="w-[30%] bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px] text-center font-mono"
                                            placeholder="10"
                                            value={tech.costValue !== undefined ? tech.costValue : 10}
                                            onChange={e => {
                                              const costVal = Math.max(0, parseInt(e.target.value) || 0);
                                              const resName = tech.costResourceName || (costResourceOptions[0] || 'MP');
                                              const formula = tech.costFormula || 'absolut';
                                              const combinedCost = `${costVal}${formula === 'proz.' ? '%' : ''} ${resName}`;
                                              const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { 
                                                ...t, 
                                                costValue: costVal,
                                                cost: combinedCost
                                              } : t) || [];
                                              updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()}

                                  {/* Beschreibung / Effekt */}
                                  <div className="md:col-span-12 flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Beschreibung / Effekt (Was macht sie?)</label>
                                    <AutoExpandingTextarea 
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-600 min-h-[64px]" 
                                      placeholder="z.B. Friert Gegner im Umkreis für 10 Sekunden ein."
                                      value={tech.description || ''}
                                      onChange={e => {
                                        const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, description: e.target.value } : t) || [];
                                        updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-2 border-t border-slate-800/60 pt-2.5">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Start-Level (Standard: 1)</label>
                                    <input 
                                      type="number"
                                      min="1"
                                      max={tech.maxLevel || 99}
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                      value={tech.level || 1}
                                      onChange={e => {
                                        const val = Math.max(1, parseInt(e.target.value) || 1);
                                        const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, level: val } : t) || [];
                                        updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                      }}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Maximal-Level (Standard: 10)</label>
                                    <input 
                                      type="number"
                                      min="1"
                                      max="99"
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                      value={tech.maxLevel || 10}
                                      onChange={e => {
                                        const val = Math.max(1, parseInt(e.target.value) || 10);
                                        const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, maxLevel: val } : t) || [];
                                        updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                      }}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase">Start-XP (Standard: 0)</label>
                                    <input 
                                      type="number"
                                      min="0"
                                      max="10000"
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                      value={tech.xp || 0}
                                      onChange={e => {
                                        const val = Math.max(0, parseInt(e.target.value) || 0);
                                        const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, xp: val } : t) || [];
                                        updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Steigerungs-Logik */}
                                <div className="w-full mt-2.5 border-t border-slate-800/60 pt-2.5">
                                  <div className="flex flex-col gap-1">
                                    {(() => {
                                      const globalLogic = world?.techniqueProgressionLogic || 'ep';
                                      if (globalLogic === 'ep') {
                                        return (
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">XP Gewinn / Nutzung</label>
                                              <input 
                                                type="number"
                                                min="1"
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                                value={tech.xpGainPerUse || 25}
                                                onChange={e => {
                                                  const val = Math.max(1, parseInt(e.target.value) || 25);
                                                  const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, xpGainPerUse: val } : t) || [];
                                                  updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">EP bis Level-Up</label>
                                              <input 
                                                type="number"
                                                min="1"
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                                value={tech.xpNeeded || 100}
                                                onChange={e => {
                                                  const val = Math.max(1, parseInt(e.target.value) || 100);
                                                  const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, xpNeeded: val } : t) || [];
                                                  updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                                }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      }

                                      if (globalLogic === 'training') {
                                        return (
                                          <div className="grid grid-cols-2 gap-2">
                                            <div>
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">Übungen für Level-Up</label>
                                              <input 
                                                type="number"
                                                min="1"
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                                value={tech.trainingRequired || 3}
                                                onChange={e => {
                                                  const val = Math.max(1, parseInt(e.target.value) || 3);
                                                  const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, trainingRequired: val } : t) || [];
                                                  updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[9px] text-slate-400 font-bold uppercase">Start-Fortschritt</label>
                                              <input 
                                                type="number"
                                                min="0"
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                                value={tech.trainingProgress || 0}
                                                onChange={e => {
                                                  const val = Math.max(0, parseInt(e.target.value) || 0);
                                                  const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, trainingProgress: val } : t) || [];
                                                  updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                                }}
                                              />
                                            </div>
                                          </div>
                                        );
                                      }

                                      if (globalLogic === 'milestone') {
                                        return (
                                          <div>
                                            <label className="text-[9px] text-slate-400 font-bold uppercase">Bedingung für Aufstieg</label>
                                            <input 
                                              type="text"
                                              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                              placeholder="z.B. Finde das One Piece / Besiege den Boss"
                                              value={tech.milestoneRequirement || ''}
                                              onChange={e => {
                                                const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, milestoneRequirement: e.target.value } : t) || [];
                                                updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                              }}
                                            />
                                          </div>
                                        );
                                      }

                                      if (globalLogic === 'static') {
                                        return (
                                          <div>
                                            <label className="text-[9px] text-slate-400 font-bold uppercase">Freischalt-Kosten / Voraussetzung</label>
                                            <input 
                                              type="text"
                                              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white text-xs outline-none focus:border-amber-500 h-[38px]"
                                              placeholder="z.B. 10 Talentpunkte / 500 Gold"
                                              value={tech.staticCost || ''}
                                              onChange={e => {
                                                const newTechList = ability.techniqueList?.map((t: any) => t.id === tech.id ? { ...t, staticCost: e.target.value } : t) || [];
                                                updateDetail('abilities', editForm.details?.abilities?.map((a: any) => a.id === ability.id ? { ...a, techniqueList: newTechList } : a));
                                              }}
                                            />
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!editForm.details?.abilities || editForm.details.abilities.length === 0) && (
                    <div className="text-center p-4 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
                      Keine speziellen Kräfte definiert. Klicke auf "Kraft hinzufügen" um eine neue Fähigkeit zu erstellen.
                    </div>
                  )}
                </div>

                {worldPowerSettings && Object.keys(worldPowerSettings).length > 0 && (
                  <div className="sm:col-span-2">
                    <CharacterPowerRadar 
                      worldPowerSettings={worldPowerSettings}
                      characterData={editForm.details?.campaignPowerLevels}
                      onChange={(newData) => updateDetail('campaignPowerLevels', newData)}
                    />
                  </div>
                )}
              </div>
            )}

            {currentCategory === 'Orte' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Typ</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.type || ''} onChange={e => updateDetail('type', e.target.value)} placeholder="z.B. Stadt, Wald, Dungeon" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Klima / Atmosphäre</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.climate || ''} onChange={e => updateDetail('climate', e.target.value)} placeholder="z.B. Neblig, düster, kalt" />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Wichtige Landmarken</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.landmarks || ''} onChange={e => updateDetail('landmarks', e.target.value)} placeholder="z.B. Alter Wachturm im Zentrum" />
                </div>
              </div>
            )}

            {currentCategory === 'Fraktionen' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Anführer</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.leader || ''} onChange={e => updateDetail('leader', e.target.value)} placeholder="z.B. Lord Garm" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Beziehung / Status</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.status || ''} onChange={e => updateDetail('status', e.target.value)} placeholder="z.B. Feindlich, Verbündet" />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Philosophie / Motivation</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.philosophy || ''} onChange={e => updateDetail('philosophy', e.target.value)} placeholder="z.B. Wollen die alten Götter wecken" />
                </div>
                
                {/* Mitgliederliste */}
                <div className="sm:col-span-2 flex flex-col gap-3 mt-4 border-t border-slate-800 pt-4">
                  <h4 className="text-xs text-amber-500 font-bold uppercase flex items-center gap-2">
                    <i className="fa-solid fa-users text-amber-500"></i>
                    Mitglieder dieser Fraktion
                  </h4>
                  {(() => {
                    const members = lore.filter(l => 
                      (l.category === 'Charaktere' || l.category === 'Gegner') && 
                      l.details?.faction && 
                      editForm.title && 
                      l.details.faction.trim().toLowerCase() === editForm.title.trim().toLowerCase()
                    );
                    if (members.length === 0) {
                      return (
                        <p className="text-xs text-slate-500 italic pb-2">Noch keine Mitglieder in dieser Fraktion eingetragen.</p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {members.map(m => (
                          <div 
                            key={m.id} 
                            onClick={() => handleEdit(m)}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 transition-colors cursor-pointer group"
                          >
                            {m.image ? (
                              <img src={m.image} alt={m.title} className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-700 group-hover:border-amber-500/40 transition-colors" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-amber-500/40 transition-colors">
                                <i className="fa-solid fa-user text-xs text-slate-400"></i>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-200 truncate group-hover:text-amber-400 transition-colors">{m.title}</div>
                              {m.details?.role && (
                                <div className="text-[10px] text-slate-400 truncate">{m.details.role}</div>
                              )}
                            </div>
                            <span className="text-[9px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 uppercase font-bold tracking-wider shrink-0">Charakter</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {currentCategory === 'Gegenstände' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Typ</label>
                  {(() => {
                    const currentType = editForm.details?.itemType || '';
                    const isCustom = editForm.details?._itemTypeIsCustom || (currentType && !ITEM_TYPE_OPTIONS.includes(currentType));
                    
                    return !isCustom ? (
                      <div className="flex gap-1.5 w-full">
                        <select
                          value={currentType}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              updateDetail('itemType', '');
                              updateDetail('_itemTypeIsCustom', true);
                            } else {
                              updateDetail('itemType', val);
                              updateDetail('_itemTypeIsCustom', false);
                            }
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 text-white rounded p-2 text-sm w-full outline-none focus:border-amber-500 cursor-pointer h-[38px]"
                        >
                          <option value="">-- Typ wählen / Unbekannt --</option>
                          {ITEM_TYPE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="__custom__">✍️ Freitext...</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            updateDetail('itemType', '');
                            updateDetail('_itemTypeIsCustom', true);
                          }}
                          title="Freitext eingeben"
                          className="px-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded transition-all flex items-center h-[38px]"
                        >
                          <i className="fa-solid fa-pen text-[9px]"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 w-full">
                        <input
                          type="text"
                          placeholder="z.B. Trank, Relikt..."
                          value={currentType}
                          onChange={e => updateDetail('itemType', e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 text-white rounded p-2.5 text-sm w-full outline-none focus:border-amber-500 h-[38px]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateDetail('itemType', '');
                            updateDetail('_itemTypeIsCustom', false);
                          }}
                          title="Zurück zur Auswahl"
                          className="px-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded transition-all flex items-center h-[38px]"
                        >
                          <i className="fa-solid fa-rotate-left text-[9px]"></i>
                        </button>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Seltenheit</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.rarity || ''} onChange={e => updateDetail('rarity', e.target.value)} placeholder="z.B. Legendär, Episch" />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Aktueller Besitzer</label>
                  <div className="flex gap-1.5 w-full">
                    {(() => {
                      const codexCharacters = lore.filter(item => (item.category === 'Charaktere' || item.category === 'Gegner') && (playerName ? item.title?.trim().toLowerCase() !== playerName.trim().toLowerCase() : true));
                      const isCustom = editForm.details?._ownerIsCustom || (editForm.details?.owner && !codexCharacters.some(c => c.title === editForm.details?.owner) && (playerName ? editForm.details?.owner !== playerName : true));
                      
                      return !isCustom ? (
                        <div className="flex gap-1.5 w-full">
                          <select
                            value={editForm.details?.owner || ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val === '__custom__') {
                                updateDetail('owner', '');
                                updateDetail('_ownerIsCustom', true);
                              } else {
                                updateDetail('owner', val);
                                updateDetail('_ownerIsCustom', false);
                              }
                            }}
                            className="flex-1 bg-slate-950 border border-slate-800 text-white rounded p-2.5 text-sm w-full outline-none focus:border-amber-500 cursor-pointer h-[38px]"
                          >
                            <option value="">-- Kein Besitzer / Unbekannt --</option>
                            {playerName && <option value={playerName}>{playerName} (Spieler)</option>}
                            {codexCharacters.length > 0 && (
                              <optgroup label="Codex Charaktere">
                                {codexCharacters.map(c => (
                                  <option key={c.id} value={c.title}>{c.title}</option>
                                ))}
                              </optgroup>
                            )}
                            <option value="__custom__">✍️ Freitext...</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              updateDetail('owner', '');
                              updateDetail('_ownerIsCustom', true);
                            }}
                            title="Freitext eingeben"
                            className="px-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded transition-all flex items-center h-[38px]"
                          >
                            <i className="fa-solid fa-pen text-[9px]"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 w-full">
                          <input
                            type="text"
                            placeholder="Name des Besitzers..."
                            value={editForm.details?.owner || ''}
                            onChange={e => updateDetail('owner', e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 text-white rounded p-2.5 text-sm w-full outline-none focus:border-amber-500 h-[38px]"
                          />
                          {(playerName || codexCharacters.length > 0) && (
                            <button
                              type="button"
                              onClick={() => {
                                updateDetail('owner', '');
                                updateDetail('_ownerIsCustom', false);
                              }}
                              title="Zurück zur Auswahl"
                              className="px-2.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 rounded transition-all flex items-center h-[38px]"
                            >
                              <i className="fa-solid fa-list text-[10px]"></i>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Magische Effekte</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.effects || ''} onChange={e => updateDetail('effects', e.target.value)} placeholder="z.B. Heilt 50 HP, verbrennt den Gegner" />
                </div>
              </div>
            )}

            {currentCategory === 'Fähigkeiten' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Typ</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.abilityType || ''} onChange={e => updateDetail('abilityType', e.target.value)} placeholder="z.B. Magie, Passiv, Beschwörung" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Kosten</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.cost || ''} onChange={e => updateDetail('cost', e.target.value)} placeholder="z.B. 20 MP" />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-slate-400 font-bold uppercase">Auswirkungen / Schaden</label>
                  <AutoExpandingTextarea className="bg-slate-950 border border-slate-800 rounded p-2 text-white text-sm w-full outline-none focus:border-amber-500" value={editForm.details?.impact || ''} onChange={e => updateDetail('impact', e.target.value)} placeholder="z.B. Betäubt das Ziel für 1 Runde" />
                </div>
              </div>
            )}

            {currentCategory === 'Events' && (
              <div className="flex flex-col gap-6">
                {/* Simplified Name of the Event Timeline */}
                <div className="flex flex-col gap-1.5 bg-slate-950/30 p-4 border border-slate-800 rounded-xl">
                  <label className="text-xs text-slate-350 font-bold uppercase tracking-wider">Ablauf-Name / Kapitel-Titel</label>
                  <input
                    type="text"
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-amber-500 outline-none w-full text-sm font-semibold"
                    value={editForm.title || ''}
                    onChange={e => {
                      const newTitle = e.target.value;
                      const prev = editForm;
                      const updated = { ...prev, title: newTitle } as LoreEntry;
                      setEditForm(updated);
                      if (prev.id) {
                        onUpdateLore(lore.map(l => l.id === prev.id ? updated : l));
                      }
                    }}
                    placeholder="z.B. Kapitel 1: Das Erwachen der Gilde"
                  />
                  <p className="text-[10px] text-slate-500">Gib dem Ereignisverlauf einen Namen, unter dem er im Codex aufgeführt wird.</p>
                </div>

                {/* Single Smart Fill area specifically styled for events */}
                <div className="bg-slate-800/20 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="text-xs text-amber-500 font-extrabold uppercase flex items-center gap-1.5">
                      <i className="fa-solid fa-sparkles text-amber-500 animate-pulse"></i>
                      Smart Fill (Geschichte automatisch zerlegen)
                    </label>
                    <button 
                      type="button"
                      onClick={handleLoreSmartFill}
                      disabled={isSmartFillingLore || !loreSmartFill.trim()}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-lg text-xs transition-all flex items-center gap-1.5 font-bold shadow-md shadow-amber-950/20"
                    >
                      {isSmartFillingLore ? (
                        <>
                          <i className="fa-solid fa-spinner animate-spin"></i> Zerlege...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-bolt"></i> Story aufteilen
                        </>
                      )}
                    </button>
                  </div>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 text-xs min-h-[70px] outline-none focus:border-amber-500 resize-y" 
                    placeholder="Schreibe einfach den unstrukturierten Verlauf auf (z.B. 'Die Helden kommen im Wirtshaus an, sprechen mit dem Hehler, werden von Meuchelmördern attackiert und fliehen in die Kanalisation.'). Die KI baut daraus automatisch nummerierte Teilschritte."
                    value={loreSmartFill} 
                    onChange={e => setLoreSmartFill(e.target.value)} 
                  />
                </div>

                {/* Input field to add / edit manual steps sequence */}
                <div className="flex flex-col gap-4 bg-slate-800/10 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-bold uppercase flex items-center gap-1.5">
                      <i className="fa-solid fa-plus-circle text-indigo-400"></i>
                      {editingStepId ? 'Station bearbeiten' : 'Neue Station / Meilenstein manuell hinzufügen'}
                    </label>
                    {editingStepId && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-bold animate-pulse">
                        Bearbeitungsmodus aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">Trage hier die Einzelheiten der Station ein. Sie wird der Timeline hinzugefügt oder aktualisiert.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Step Title Input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Titel der Station (optional)</label>
                      <input 
                        type="text"
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-700"
                        placeholder="z.B. Das Geheimnis des Hehlers"
                        value={newEventStepTitle}
                        onChange={e => setNewEventStepTitle(e.target.value)}
                      />
                    </div>

                    {/* Step Branch Selector */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Story-Strang</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNewEventStepBranch('main')}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                            newEventStepBranch === 'main'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <i className="fa-solid fa-crown text-[10px] mr-1.5"></i> Hauptstory
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewEventStepBranch('side')}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                            newEventStepBranch === 'side'
                              ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <i className="fa-solid fa-compass text-[10px] mr-1.5"></i> Nebenquest
                        </button>
                      </div>
                    </div>

                    {/* Step Unlock Conditions */}
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Freischalt-Bedingungen (optional)</label>
                      <input 
                        type="text"
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-700"
                        placeholder="z.B. Kapitel 1 abgeschlossen ODER Hehler befragt"
                        value={newEventStepConditions}
                        onChange={e => setNewEventStepConditions(e.target.value)}
                      />
                    </div>

                    {/* Step Chat Instruction */}
                    <div className="flex flex-col gap-1 md:col-span-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Dungeon Master Chat-Anweisung</label>
                      <input 
                        type="text"
                        className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-700"
                        placeholder="z.B. Hinterhalt von 2 Spinnen im Chat starten"
                        value={newEventStepChatInstruction}
                        onChange={e => setNewEventStepChatInstruction(e.target.value)}
                      />
                    </div>

                    {/* Step Description/Text */}
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Beschreibung des Ablaufs <span className="text-red-500">*</span></label>
                      <AutoExpandingTextarea 
                        className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-700 min-h-[64px]"
                        placeholder="Beschreibe im Detail, was in dieser Station passieren soll..."
                        value={newEventStepText}
                        onChange={e => setNewEventStepText(e.target.value)}
                      />
                    </div>

                    {/* Reise- & Zeitdetails */}
                    <div className="md:col-span-2 border-t border-slate-800/60 pt-3 mt-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Travel Path */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-amber-500/80 font-bold uppercase flex items-center gap-1">
                          <i className="fa-solid fa-route text-[9px]"></i> Der Reise-Pfad / Stationen
                        </label>
                        <input 
                          type="text"
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-700"
                          placeholder="z.B. Von Eldoria nach Silberhafen"
                          value={newEventStepTravelPath}
                          onChange={e => setNewEventStepTravelPath(e.target.value)}
                        />
                      </div>

                      {/* Travel Duration Days */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-amber-500/80 font-bold uppercase flex items-center gap-1">
                          <i className="fa-solid fa-hourglass-half text-[9px]"></i> Reise-Dauer (in Tagen)
                        </label>
                        <input 
                          type="number"
                          min="0"
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-700"
                          placeholder="z.B. 3"
                          value={newEventStepTravelDurationDays}
                          onChange={e => setNewEventStepTravelDurationDays(e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </div>

                      {/* Time of Day */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-amber-500/80 font-bold uppercase flex items-center gap-1">
                          <i className="fa-solid fa-clock text-[9px]"></i> Uhrzeit
                        </label>
                        <input 
                          type="text"
                          className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-700"
                          placeholder="z.B. 14:00 Uhr oder Dämmerung"
                          value={newEventStepTimeOfDay}
                          onChange={e => setNewEventStepTimeOfDay(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end mt-2">
                    {editingStepId && (
                      <button
                        type="button"
                        onClick={handleCancelEditStep}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-all"
                      >
                        Abbrechen
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddManualStep}
                      disabled={!newEventStepText.trim()}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        editingStepId
                          ? 'bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white'
                      }`}
                    >
                      {editingStepId ? (
                        <>
                          <i className="fa-solid fa-floppy-disk"></i> Station aktualisieren
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-plus"></i> Station hinzufügen
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Flowchart Section */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs text-slate-350 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>Dynamisches Flussdiagramm (Hauptstory & Nebenquests)</span>
                    {editForm.details?.eventSteps && editForm.details.eventSteps.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono normal-case">{editForm.details.eventSteps.length} Stationen</span>
                    )}
                  </h4>

                  {editForm.details?.eventSteps && editForm.details.eventSteps.length > 0 ? (
                    <div className="relative border border-slate-800/80 bg-slate-950/40 rounded-2xl p-4 md:p-6 overflow-hidden">
                      {/* Flowchart vertical line */}
                      <div className="absolute top-0 bottom-0 left-[21px] md:left-1/2 w-0.5 bg-gradient-to-b from-amber-500/80 via-indigo-500/50 to-slate-800/20 pointer-events-none"></div>
                      
                      <div className="space-y-8 relative">
                        {editForm.details.eventSteps.map((step: any, idx: number) => {
                          const isMain = step.branch !== 'side';
                          return (
                            <div key={step.id || `flow-${idx}`} className={`flex flex-col md:flex-row items-stretch md:items-center ${isMain ? 'md:justify-start' : 'md:justify-end'} relative group`}>
                              
                              {/* Connector Bullet */}
                              <div className="absolute left-[10px] md:left-1/2 md:-ml-3.5 top-3.5 md:top-1/2 md:-translate-y-1/2 z-10">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStepStatus(step.id)}
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-lg ${
                                    step.status === 'happened'
                                      ? 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600 scale-110 shadow-emerald-500/20'
                                      : isMain
                                      ? 'bg-slate-950 border-amber-500 text-amber-500 hover:border-amber-400 hover:text-amber-400'
                                      : 'bg-slate-950 border-cyan-500 text-cyan-500 hover:border-cyan-400 hover:text-cyan-400'
                                  }`}
                                  title={step.status === 'happened' ? 'Erledigt (Zum Zurücksetzen klicken)' : 'Ausstehend (Als erledigt markieren)'}
                                >
                                  {step.status === 'happened' ? (
                                    <i className="fa-solid fa-check text-[9px]"></i>
                                  ) : (
                                    <span className="text-[9px] font-bold font-mono">{idx + 1}</span>
                                  )}
                                </button>
                              </div>

                              {/* Card body */}
                              <div className={`w-full md:w-[calc(50%-20px)] pl-10 md:pl-0 ${isMain ? 'md:pr-6' : 'md:pl-6'} transition-all`}>
                                <div className={`p-4 rounded-xl border transition-all ${
                                  step.status === 'happened'
                                    ? 'bg-emerald-950/15 border-emerald-800/40 hover:border-emerald-700/60 shadow-md shadow-emerald-950/10'
                                    : isMain
                                    ? 'bg-slate-900/90 border-amber-500/20 hover:border-amber-500/40 shadow-sm shadow-amber-950/5'
                                    : 'bg-slate-900/90 border-cyan-500/20 hover:border-cyan-500/40 shadow-sm shadow-cyan-950/5'
                                }`}>
                                  {/* Header with Title and Branch Badge */}
                                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/50 pb-2 mb-2.5">
                                    <span className="font-bold text-sm text-slate-100 font-sans tracking-tight truncate max-w-[150px] md:max-w-[180px]">
                                      {step.title || `Station #${idx + 1}`}
                                    </span>
                                    
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                        isMain
                                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                      }`}>
                                        {isMain ? 'Hauptstory' : 'Nebenquest'}
                                      </span>
                                      <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                        step.status === 'happened'
                                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                          : 'bg-slate-950 text-slate-400 border border-slate-800'
                                      }`}>
                                        {step.status === 'happened' ? 'Erledigt' : 'Geplant'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Description (Full read text as requested) */}
                                  <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap mb-3 select-text">
                                    {step.description}
                                  </p>

                                  {/* Travel & Time Details */}
                                  {(step.travelPath || step.travelDurationDays !== undefined || step.timeOfDay) && (
                                    <div className="bg-amber-950/10 border border-amber-500/10 rounded-lg p-2.5 mb-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                                      {step.travelPath && (
                                        <div className="sm:col-span-3 flex items-start gap-1.5 border-b border-amber-500/5 pb-1.5 mb-0.5">
                                          <i className="fa-solid fa-route text-amber-500 text-[10px] mt-1"></i>
                                          <div className="flex-1 min-w-0">
                                            <span className="text-[9px] text-amber-500/80 font-bold block uppercase tracking-wider leading-none mb-0.5">Reise-Pfad / Stationen</span>
                                            <span className="text-[11px] text-slate-300 font-medium leading-tight">{step.travelPath}</span>
                                          </div>
                                        </div>
                                      )}
                                      {step.travelDurationDays !== undefined && (
                                        <div className="flex items-start gap-1.5">
                                          <i className="fa-solid fa-hourglass-half text-amber-500 text-[10px] mt-1"></i>
                                          <div>
                                            <span className="text-[9px] text-amber-500/80 font-bold block uppercase tracking-wider leading-none mb-0.5">Reise-Dauer</span>
                                            <span className="text-[11px] text-slate-300 font-medium font-mono">{step.travelDurationDays} {step.travelDurationDays === 1 ? 'Tag' : 'Tage'}</span>
                                          </div>
                                        </div>
                                      )}
                                      {step.timeOfDay && (
                                        <div className="flex items-start gap-1.5 sm:col-span-2">
                                          <i className="fa-solid fa-clock text-amber-500 text-[10px] mt-1"></i>
                                          <div>
                                            <span className="text-[9px] text-amber-500/80 font-bold block uppercase tracking-wider leading-none mb-0.5">Uhrzeit / Tageszeit</span>
                                            <span className="text-[11px] text-slate-300 font-medium">{step.timeOfDay}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Unlock Conditions */}
                                  {step.unlockConditions && step.unlockConditions !== 'Keine' && (
                                    <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-2.5 mb-2 flex items-start gap-2">
                                      <i className="fa-solid fa-key text-yellow-500 text-[10px] mt-0.5"></i>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none mb-1">Freischalt-Bedingung</span>
                                        <span className="text-[11px] text-slate-300 leading-normal">{step.unlockConditions}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Chat instruction for Dungeon Master */}
                                  {step.chatInstruction && (
                                    <div className="bg-indigo-950/15 border border-indigo-500/15 rounded-lg p-2.5 mb-2 flex items-start gap-2">
                                      <i className="fa-solid fa-message-bot text-indigo-400 text-[10px] mt-0.5"></i>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider leading-none mb-1">Chat-Anweisung (Dungeon Master)</span>
                                        <span className="text-[11px] text-indigo-300 leading-normal">{step.chatInstruction}</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Controls */}
                                  <div className="flex items-center justify-between gap-2 border-t border-slate-800/40 pt-2 mt-2">
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => handleMoveStep(idx, idx - 1)}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-10 transition-all text-[9px]"
                                        title="Nach oben verschieben"
                                      >
                                        <i className="fa-solid fa-arrow-up"></i>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === editForm.details.eventSteps.length - 1}
                                        onClick={() => handleMoveStep(idx, idx + 1)}
                                        className="w-6 h-6 flex items-center justify-center rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-10 transition-all text-[9px]"
                                        title="Nach unten verschieben"
                                      >
                                        <i className="fa-solid fa-arrow-down"></i>
                                      </button>
                                    </div>

                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditStep(step)}
                                        className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
                                          editingStepId === step.id
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                                        }`}
                                      >
                                        <i className="fa-solid fa-pen text-[8px]"></i> Bearbeiten
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteStep(step.id)}
                                        className="px-2 py-1 text-[10px] font-bold rounded bg-slate-950 border border-slate-800 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all flex items-center gap-1"
                                      >
                                        <i className="fa-solid fa-trash text-[8px]"></i> Löschen
                                      </button>
                                    </div>
                                  </div>

                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-8 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs bg-slate-950/20">
                      <i className="fa-solid fa-route text-2xl mb-2 text-slate-700"></i>
                      <p>Noch keine Schritte vorhanden.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Verwende das obige Smart Fill oder füge eine Station manuell hinzu.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentCategory !== 'Events' && currentCategory !== 'Charaktere' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Ausführliche Beschreibung <span className="text-red-500">*</span></label>
                <textarea 
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-white min-h-[160px] focus:border-amber-500 outline-none leading-relaxed"
                  value={editForm.description || ''}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Umfassende Details, Historie, Aussehen..."
                />
              </div>
            )}

            {/* Geheimnisse & Verborgenes Wissen (3-Stufen-Logik) */}
            {!['Events', 'Gegenstände'].includes(currentCategory) && (
              <div className="mt-4 p-5 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-2.5">
                  <i className="fa-solid fa-user-shield text-amber-500 text-base"></i>
                  <div>
                    <h4 className="text-xs text-slate-200 font-extrabold uppercase tracking-wider">Geheimnisse & Verborgenes Wissen (3-Stufen-Logik)</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Verwalte hier das Metawissen der KI. Die Stufen steuern, wie tief das Wissen im Chat verborgen bleibt.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {/* Stufe 1 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Stufe 1: Öffentliches Wissen
                    </label>
                    <p className="text-[9px] text-slate-500 leading-tight mb-1">Für alle NPCs und Charaktere von Anfang an bekannt.</p>
                    <AutoExpandingTextarea 
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-white text-xs min-h-[64px] outline-none transition-all resize-none leading-relaxed"
                      placeholder="z.B. Er ist ein registrierter Abenteurer, besitzt ein blaues Schwert..."
                      value={editForm.secretsStage1 || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, secretsStage1: e.target.value }))}
                    />
                  </div>

                  {/* Stufe 2 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Stufe 2: Indizien & Verdacht
                    </label>
                    <p className="text-[9px] text-slate-500 leading-tight mb-1">NPCs wissen es nicht direkt, dürfen aber vorsichtig nachforschen.</p>
                    <AutoExpandingTextarea 
                      className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-white text-xs min-h-[64px] outline-none transition-all resize-none leading-relaxed"
                      placeholder="z.B. Er schaut oft nervös auf seine Taschenuhr, wenn das Wort 'Zeit' fällt..."
                      value={editForm.secretsStage2 || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, secretsStage2: e.target.value }))}
                    />
                  </div>

                  {/* Stufe 3 */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-red-400 font-extrabold uppercase tracking-wide flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span> Stufe 3: Absolutes Geheimnis
                    </label>
                    <p className="text-[9px] text-slate-500 leading-tight mb-1">Absolute Blackbox. Für NPCs streng tabu, bis es bewiesen wird.</p>
                    <AutoExpandingTextarea 
                      className="w-full bg-slate-900 border border-slate-800 focus:border-red-500 rounded-xl p-3 text-white text-xs min-h-[64px] outline-none transition-all resize-none leading-relaxed"
                      placeholder="z.B. Er ist in Wahrheit der gesuchte Schattenmagier, der vor 5 Jahren floh..."
                      value={editForm.secretsStage3 || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, secretsStage3: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeCategory !== 'Events' && (
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-800/50">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={editForm.isUnlocked !== false}
                      onChange={e => setEditForm(prev => ({ ...prev, isUnlocked: e.target.checked }))}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                  <div>
                    <div className="text-sm text-slate-200 font-medium">Sofort verfügbar</div>
                    <div className="text-[10px] text-slate-500">Ist dies dem Spieler zu Beginn bereits bekannt?</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Duplicate Warning */}
          {(() => {
            if (activeCategory !== 'Charaktere' || !editForm.title) return null;
            const titleVal = editForm.title.trim().toLowerCase();
            const rufVal = editForm.details?.rufName?.trim().toLowerCase();
            const nickVal = editForm.details?.nickname?.trim().toLowerCase();

            const duplicate = lore.find(l => {
              if (l.category !== 'Charaktere' || l.id === isEditing) return false;
              
              const t = l.title?.trim().toLowerCase();
              const r = l.details?.rufName?.trim().toLowerCase();
              const n = l.details?.nickname?.trim().toLowerCase();

              const matches = (val: string | undefined) => {
                if (!val) return false;
                return val === titleVal || (rufVal && val === rufVal) || (nickVal && val === nickVal);
              };

              return matches(t) || matches(r) || matches(n);
            });

            if (duplicate) {
              return (
                <div className="flex items-center gap-3 bg-red-950/45 border border-red-900/50 text-red-200 rounded-xl p-4.5 text-xs font-semibold leading-relaxed mt-4 animate-pulse">
                  <i className="fa-solid fa-triangle-exclamation text-red-500 text-base"></i>
                  <div>
                    Achtung: Ein Charakter-Eintrag für <span className="text-white font-extrabold underline">"{duplicate.title}"</span> existiert bereits. Bitte stelle sicher, dass kein doppelter Eintrag erzeugt wird (Prüfung von Name, Rufname und Spitzname/Alias).
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {activeCategory !== 'Events' && (
            <div className="flex gap-4 justify-end mt-4">
              {isEditing && (
                <button 
                  onClick={() => { setIsEditing(null); setEditForm({ category: activeCategory }); }}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-colors"
                >
                  Abbrechen
                </button>
              )}
              <button 
                onClick={handleSave}
                className={`px-8 py-2 rounded-xl text-sm font-bold transition-all shadow-lg text-white ${!editForm.title || !editForm.description ? 'bg-amber-600/50 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 active:scale-95'}`}
              >
                {isEditing ? 'Änderungen Speichern' : `${activeCategory} Hinzufügen`}
              </button>
            </div>
          )}
        </div>

        {/* Database List */}
        {activeCategory !== 'Events' && (
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
               <h3 className="text-xl font-bold text-slate-100">Bestehende {activeCategory}</h3>
            </div>
            
            <div className="relative">
              <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
              <input
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:border-amber-500 outline-none transition-colors shadow-sm"
                placeholder={`Suche in ${activeCategory}...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {filteredLore.length === 0 ? (
                <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-book-open text-2xl opacity-50"></i>
                  </div>
                  <div>
                    <h4 className="text-slate-300 font-medium mb-1">Keine Einträge gefunden</h4>
                    <p className="text-xs">Füge neue Elemente über das Formular hinzu.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredLore.map((entry, idx) => (
                    <div key={entry.id || `lore-${idx}`} onClick={() => handleEdit(entry)} className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer hover:border-amber-500/50 ${
                      entry.isUnlocked ? 'bg-slate-800/80 border-slate-700 shadow-sm' : 'bg-slate-900/50 border-slate-800 opacity-70'
                    }`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        {!entry.isUnlocked ? (
                          <i className="fa-solid fa-lock text-slate-500 text-xs shrink-0" title="Noch geheim"></i>
                        ) : (
                          <i className="fa-solid fa-book text-amber-500/50 text-xs shrink-0"></i>
                        )}
                        
                        <div className="flex items-center gap-2 truncate">
                          <h3 className="text-sm font-bold text-amber-500 truncate">{entry.title}</h3>
                          {(activeCategory === 'Charaktere' || activeCategory === 'Gegner') && entry.details?.role && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-500/30 truncate shrink-0">{entry.details.role}</span>
                          )}
                          {(activeCategory === 'Charaktere' || activeCategory === 'Gegner') && entry.details?.rufName && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/30 truncate shrink-0 font-medium">Rufname: {entry.details.rufName}</span>
                          )}
                          {activeCategory === 'Fraktionen' && (() => {
                            const count = lore.filter(l => 
                              (l.category === 'Charaktere' || l.category === 'Gegner') && 
                              l.details?.faction && 
                              l.details.faction.trim().toLowerCase() === entry.title.trim().toLowerCase()
                            ).length;
                            return count > 0 ? (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/30 shrink-0 font-medium">
                                {count} {count === 1 ? 'Mitglied' : 'Mitglieder'}
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-800 shrink-0 font-medium font-mono">
                                0 Mitglieder
                              </span>
                            );
                          })()}
                          {activeCategory === 'Gegenstände' && entry.details?.owner && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/30 truncate shrink-0 font-medium flex items-center gap-1">
                              <i className="fa-solid fa-user text-[9px] text-amber-400"></i>
                              Besitzer: {entry.details.owner}
                            </span>
                          )}

                        </div>
                      </div>
                      
                      <div className="flex gap-1 shrink-0 bg-slate-900/50 rounded-lg border border-slate-800 p-1 ml-2">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(entry); }} className="p-1 w-7 h-7 flex items-center justify-center text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded transition-colors" title="Bearbeiten / Details ansehen"><i className="fa-solid fa-pen text-xs"></i></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }} className="p-1 w-7 h-7 flex items-center justify-center text-red-400 hover:bg-slate-800 hover:text-red-300 rounded transition-colors" title="Löschen"><i className="fa-solid fa-trash text-xs"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoreDatabaseView;

