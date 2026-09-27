import React, { useState, useMemo } from 'react';
import { Adventure, TechniqueItem, Character, ProfessionCompetency } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { CENTRAL_EVERYDAY_SKILLS } from './everydaySkillPresets';
import { ALL_WEAPONS } from '../lib/weaponTypesData';
import { JOB_CATEGORIES } from './jobPresets';
import {
  CharacterCapabilityEntry,
  CapabilityCategory,
  getCharacterCapabilities,
  trainCharacterCapability,
  toggleFavoriteCapability,
  getCapabilityActionText,
  getCategoryLabels,
  getCategoryStyles
} from '../utils/capabilityAdapter';
import {
  parseEverydaySkills,
  serializeEverydaySkills,
  getSkillLabel
} from './EverydaySkillsSelect';

export type SkillCategoryTab =
  | 'all'
  | 'passive'
  | 'technique'
  | 'ultimate'
  | 'weapon'
  | 'competence'
  | 'profession';

interface TrainingSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  adventure: Adventure;
  onUpdateAdventure: (updated: Adventure) => void;
  onSendChatMessage?: (text: string) => void;
  onSetInputText?: (text: string) => void;
  initialTab?: SkillCategoryTab;
}

export const TrainingSkillsModal: React.FC<TrainingSkillsModalProps> = ({
  isOpen,
  onClose,
  adventure,
  onUpdateAdventure,
  onSendChatMessage,
  onSetInputText,
  initialTab = 'all'
}) => {
  const [activeTab, setActiveTab] = useState<SkillCategoryTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'training' | 'mastered'>('all');
  const [freeActionText, setFreeActionText] = useState('');
  
  // Learning & Creation state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addCategory, setAddCategory] = useState<SkillCategoryTab>('technique');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillType, setNewSkillType] = useState('Aktiv');
  const [newSkillDescription, setNewSkillDescription] = useState('');
  const [newSkillCost, setNewSkillCost] = useState('');
  const [newSkillSubtype, setNewSkillSubtype] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<number>(1);
  const [newSkillMaxLevel, setNewSkillMaxLevel] = useState<number>(10);
  const [newSkillProgressionLogic, setNewSkillProgressionLogic] = useState<'ep' | 'training' | 'milestone' | 'static'>('training');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  const player = adventure.player;
  const activeTransId = player?.appearance?.activeTransformationId || 'standard';

  // Zentrale, deduplizierte Liste aller 6 Bereiche aus der gemeinsamen Adapter-Quelle
  const allSkills: CharacterCapabilityEntry[] = useMemo(() => {
    return getCharacterCapabilities(player, activeTransId);
  }, [player, activeTransId]);

  // Filter und Suche
  const filteredSkills = useMemo(() => {
    return allSkills.filter(skill => {
      // Kategorie-Filter
      if (activeTab === 'passive' && skill.category !== 'passive') return false;
      if (activeTab === 'technique' && skill.category !== 'technique') return false;
      if (activeTab === 'ultimate' && skill.category !== 'ultimate') return false;
      if (activeTab === 'weapon' && skill.category !== 'weapon') return false;
      if (activeTab === 'competence' && skill.category !== 'competence') return false;
      if (activeTab === 'profession' && skill.category !== 'profession') return false;

      // Filter-Modi
      if (filterMode === 'favorites' && !skill.isFavorite) return false;
      if (filterMode === 'training' && !skill.canTrain) return false;
      if (filterMode === 'mastered' && skill.canTrain) return false;

      // Textsuche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = (skill.name || '').toLowerCase().includes(query);
        const matchDesc = (skill.description || '').toLowerCase().includes(query);
        const matchSub = (skill.subtype || '').toLowerCase().includes(query);
        const matchType = (skill.type || '').toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchSub && !matchType) return false;
      }

      return true;
    });
  }, [allSkills, activeTab, filterMode, searchQuery]);

  // Zähler für die einzelnen Kategorien
  const categoryCounts = useMemo(() => {
    const counts = {
      all: allSkills.length,
      passive: 0,
      technique: 0,
      ultimate: 0,
      weapon: 0,
      competence: 0,
      profession: 0
    };

    allSkills.forEach(s => {
      if (s.category in counts) {
        counts[s.category]++;
      }
    });

    return counts;
  }, [allSkills]);

  // Favorit umschalten (auf den kanonischen Daten)
  const handleToggleFavorite = (skill: CharacterCapabilityEntry) => {
    const updated = toggleFavoriteCapability(adventure, skill);
    onUpdateAdventure(updated);
  };

  // Aktion im Spiel ausführen
  const handleUseSkill = (skill: CharacterCapabilityEntry) => {
    const actionText = getCapabilityActionText(skill);
    if (onSendChatMessage) {
      onSendChatMessage(actionText);
    } else if (onSetInputText) {
      onSetInputText(actionText);
    }
    onClose();
  };

  // Fertigkeit trainieren (unter Nutzung der globalen Progressionslogik)
  const handleTrainSkill = (skill: CharacterCapabilityEntry) => {
    const { updatedAdventure, roleplayText } = trainCharacterCapability(adventure, skill);
    onUpdateAdventure(updatedAdventure);

    if (onSendChatMessage) {
      onSendChatMessage(roleplayText);
    } else if (onSetInputText) {
      onSetInputText(roleplayText);
    }
    onClose();
  };

  // Stufe anpassen (+ / -) auf den kanonischen Speicherorten
  const handleAdjustLevel = (skill: CharacterCapabilityEntry, delta: number) => {
    if (!player) return;

    if (
      skill.sourceType === 'technique' ||
      skill.sourceType === 'passive' ||
      skill.sourceType === 'weapon'
    ) {
      const targetId = skill.originalTechniqueId || skill.sourceId || skill.id;
      const targetNameLower = (skill.originalTechniqueName || skill.name).trim().toLowerCase();

      const updatedTechList = Array.isArray(player.techniqueList)
        ? player.techniqueList.map(t => {
            if (
              (t.id && (t.id === targetId || t.id === skill.id)) ||
              (t.name && t.name.trim().toLowerCase() === targetNameLower)
            ) {
              const cur = t.level ?? 1;
              const maxL = t.maxLevel ?? 10;
              const next = Math.max(1, Math.min(maxL, cur + delta));
              return { ...t, level: next };
            }
            return t;
          })
        : [];

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          techniqueList: updatedTechList
        }
      });
    } else if (skill.sourceType === 'everyday') {
      const parsed = parseEverydaySkills(player.everydaySkills || '');
      const targetNameLower = skill.name.trim().toLowerCase();

      const updated = parsed.map(item => {
        if (item.name.trim().toLowerCase() === targetNameLower) {
          const cur = item.score || 0;
          const nextScore = Math.max(0, Math.min(100, cur + delta * 20));
          return {
            ...item,
            score: nextScore,
            label: getSkillLabel(nextScore)
          };
        }
        return item;
      });

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          everydaySkills: serializeEverydaySkills(updated)
        }
      });
    } else if (skill.sourceType === 'profession' && Array.isArray(player.professionCompetencies)) {
      const updatedComps = player.professionCompetencies.map(c => {
        if (c.id === skill.sourceId || c.name.trim().toLowerCase() === skill.name.trim().toLowerCase()) {
          const cur = c.proficiency || 0;
          const nextProf = Math.max(0, Math.min(100, cur + delta * 10));
          return { ...c, proficiency: nextProf };
        }
        return c;
      });

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          professionCompetencies: updatedComps
        }
      });
    }
  };

  // Fertigkeit aus dem kanonischen Speicher entfernen
  const handleDeleteSkill = (skill: CharacterCapabilityEntry) => {
    if (!player) return;

    if (
      skill.sourceType === 'technique' ||
      skill.sourceType === 'passive' ||
      skill.sourceType === 'weapon'
    ) {
      const targetId = skill.originalTechniqueId || skill.sourceId || skill.id;
      const targetNameLower = (skill.originalTechniqueName || skill.name).trim().toLowerCase();

      const updatedTechList = Array.isArray(player.techniqueList)
        ? player.techniqueList.filter(
            t => !(
              (t.id && (t.id === targetId || t.id === skill.id)) ||
              (t.name && t.name.trim().toLowerCase() === targetNameLower)
            )
          )
        : [];

      const updatedAbilities = Array.isArray(player.abilities)
        ? player.abilities.map((ability: any) => {
            if (!Array.isArray(ability.techniqueList)) return ability;
            return {
              ...ability,
              techniqueList: ability.techniqueList.filter(
                (t: any) => !(
                  (t.id && (t.id === targetId || t.id === skill.id)) ||
                  (t.name && t.name.trim().toLowerCase() === targetNameLower)
                )
              )
            };
          })
        : player.abilities;

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          techniqueList: updatedTechList,
          abilities: updatedAbilities
        }
      });
    } else if (skill.sourceType === 'everyday') {
      const parsed = parseEverydaySkills(player.everydaySkills || '');
      const targetNameLower = skill.name.trim().toLowerCase();
      const updated = parsed.filter(item => item.name.trim().toLowerCase() !== targetNameLower);

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          everydaySkills: serializeEverydaySkills(updated)
        }
      });
    } else if (skill.sourceType === 'profession' && Array.isArray(player.professionCompetencies)) {
      const updatedComps = player.professionCompetencies.filter(
        c => !(c.id === skill.sourceId || c.name.trim().toLowerCase() === skill.name.trim().toLowerCase())
      );

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          professionCompetencies: updatedComps
        }
      });
    }
  };

  // Beschreibung bearbeiten
  const handleUpdateSkillDetails = (skill: CharacterCapabilityEntry, description: string) => {
    if (!player) return;

    if (
      skill.sourceType === 'technique' ||
      skill.sourceType === 'passive' ||
      skill.sourceType === 'weapon'
    ) {
      const targetId = skill.originalTechniqueId || skill.sourceId || skill.id;
      const targetNameLower = (skill.originalTechniqueName || skill.name).trim().toLowerCase();

      const updatedTechList = Array.isArray(player.techniqueList)
        ? player.techniqueList.map(t => {
            if (
              (t.id && (t.id === targetId || t.id === skill.id)) ||
              (t.name && t.name.trim().toLowerCase() === targetNameLower)
            ) {
              return { ...t, description };
            }
            return t;
          })
        : [];

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          techniqueList: updatedTechList
        }
      });
    } else if (skill.sourceType === 'profession' && Array.isArray(player.professionCompetencies)) {
      const updatedComps = player.professionCompetencies.map(c => {
        if (c.id === skill.sourceId || c.name.trim().toLowerCase() === skill.name.trim().toLowerCase()) {
          return { ...c, description };
        }
        return c;
      });

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          professionCompetencies: updatedComps
        }
      });
    }

    setEditingSkillId(null);
  };

  // Katalog-Auswahl
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;

    if (addCategory === 'competence') {
      const found = CENTRAL_EVERYDAY_SKILLS.find(s => s.id === presetId);
      if (found) {
        setNewSkillName(found.name);
        setNewSkillDescription(found.description);
        setNewSkillType('Alltagskompetenz');
        setNewSkillSubtype(found.category);
        setNewSkillCost('');
      }
    } else if (addCategory === 'weapon') {
      const found = ALL_WEAPONS.find(w => w.id === presetId);
      if (found) {
        setNewSkillName(found.name);
        setNewSkillDescription(found.description);
        setNewSkillType('Waffenbeherrschung');
        setNewSkillSubtype(found.categoryName);
        setNewSkillCost('');
      }
    } else if (addCategory === 'profession') {
      let foundJob = '';
      let foundCategory = '';
      for (const cat of JOB_CATEGORIES) {
        if (cat.jobs && cat.jobs.includes(presetId)) {
          foundJob = presetId;
          foundCategory = cat.category;
          break;
        }
      }
      if (foundJob) {
        setNewSkillName(foundJob);
        setNewSkillDescription(`Fachwissen und handwerkliche Praxis im Berufsfeld ${foundCategory}.`);
        setNewSkillType('Berufskompetenz');
        setNewSkillSubtype(foundCategory);
        setNewSkillCost('');
      }
    }
  };

  // Neue Fähigkeit in den entsprechenden kanonischen Speicherort eintragen
  const handleCreateNewSkill = () => {
    if (!newSkillName.trim() || !player) return;

    const trimmedName = newSkillName.trim();

    if (addCategory === 'competence') {
      const parsed = parseEverydaySkills(player.everydaySkills || '');
      const existing = parsed.find(item => item.name.trim().toLowerCase() === trimmedName.toLowerCase());

      if (!existing) {
        parsed.push({
          name: trimmedName,
          score: 15,
          label: getSkillLabel(15),
          xp: 0,
          trainingUnits: 0,
          points: 1,
          note: newSkillDescription.trim() || undefined
        });
      }

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          everydaySkills: serializeEverydaySkills(parsed)
        }
      });
    } else if (addCategory === 'profession') {
      const comps = Array.isArray(player.professionCompetencies) ? [...player.professionCompetencies] : [];
      const newComp: ProfessionCompetency = {
        id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: trimmedName,
        category: 'Grundlage',
        proficiency: 15,
        experiencePoints: 0,
        talent: 3,
        description: newSkillDescription.trim() || `Fachwissen in ${trimmedName}`
      };

      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          professionCompetencies: [...comps, newComp]
        }
      });
    } else {
      // Techniken, Passive Fähigkeiten, Ultimative Techniken & Waffenbeherrschung
      let targetCategory = 'Techniken';
      if (addCategory === 'passive') targetCategory = 'Passive Fähigkeiten';
      else if (addCategory === 'ultimate') targetCategory = 'Ultimative Techniken';
      else if (addCategory === 'weapon') targetCategory = 'Waffenbeherrschung';

      const newSkill: TechniqueItem = {
        id: `tech_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: trimmedName,
        category: targetCategory,
        type: newSkillType || (addCategory === 'passive' ? 'Passiv' : 'Aktiv'),
        subtype: newSkillSubtype || '',
        description: newSkillDescription.trim(),
        cost: newSkillCost.trim(),
        level: newSkillLevel,
        maxLevel: newSkillMaxLevel,
        trainingUnits: 0,
        trainingProgress: 0,
        trainingRequired: 5,
        progressionLogic: newSkillProgressionLogic,
        isFavorite: true
      };

      const existingTechs = Array.isArray(player.techniqueList) ? player.techniqueList : [];
      onUpdateAdventure({
        ...adventure,
        player: {
          ...player,
          techniqueList: [...existingTechs, newSkill]
        }
      });
    }

    // Formular zurücksetzen
    setNewSkillName('');
    setNewSkillDescription('');
    setNewSkillCost('');
    setNewSkillSubtype('');
    setSelectedPresetId('');
    setIsAddingNew(false);

    // Rollenspiel-Ankündigung
    const { label: catLabel } = getCategoryLabels(
      addCategory === 'all' ? 'technique' : (addCategory as CapabilityCategory)
    );
    const learnAnnouncement = `*beginnt mit dem Training der neuen Fertigkeit '${trimmedName}' (${catLabel})*`;
    if (onSendChatMessage) {
      onSendChatMessage(learnAnnouncement);
    } else if (onSetInputText) {
      onSetInputText(learnAnnouncement);
    }
  };

  // Freie Rollenspiel-Handlung ausführen
  const handleSendFreeAction = () => {
    if (!freeActionText.trim()) return;
    const formatted = `*${freeActionText.trim().replace(/^\*+|\*+$/g, '')}*`;
    if (onSendChatMessage) {
      onSendChatMessage(formatted);
    } else if (onSetInputText) {
      onSetInputText(formatted);
    }
    setFreeActionText('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <i className="fa-solid fa-graduation-cap text-lg"></i>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Training & Erlernbare Fertigkeiten</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  {allSkills.length} Erlernt
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Zentrale Übersicht über Techniken, Meisterungen, Alltagskompetenzen und Berufe.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(!isAddingNew);
                if (!isAddingNew && activeTab !== 'all') {
                  setAddCategory(activeTab);
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                isAddingNew
                  ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-900/30'
              }`}
            >
              <i className={`fa-solid ${isAddingNew ? 'fa-xmark' : 'fa-plus'}`}></i>
              <span>{isAddingNew ? 'Abbrechen' : 'Fähigkeit erlernen'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Schließen"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* FREIE HANDLUNG QUICK BAR */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-slate-400 shrink-0">Freie Handlung:</span>
            <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-slate-600">
              <input
                type="text"
                value={freeActionText}
                onChange={e => setFreeActionText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendFreeAction();
                }}
                placeholder="Handlung im Spiel beschreiben (z.B. pariert mit dem Schild)..."
                className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
              />
              {freeActionText && (
                <button
                  type="button"
                  onClick={() => setFreeActionText('')}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSendFreeAction}
              disabled={!freeActionText.trim()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <i className="fa-solid fa-person-running text-amber-400 text-xs"></i>
              <span>*Handlung ausführen*</span>
            </button>
          </div>
        </div>

        {/* MAIN BODY: SPLIT OR TABS */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* CATEGORY SELECTOR SIDEBAR (DESKTOP) & TABS (MOBILE) */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 p-3 bg-slate-950/50 flex md:flex-col gap-1.5 overflow-x-auto shrink-0 custom-scrollbar">
            
            <button
              type="button"
              onClick={() => { setActiveTab('all'); setIsAddingNew(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-800 border border-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-border-all text-slate-400"></i>
                <span>Alle Bereiche</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-mono">
                {categoryCounts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('passive'); setIsAddingNew(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'passive'
                  ? 'bg-blue-950/70 border border-blue-500/40 text-blue-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-blue-400"></i>
                <span>Passive Fähigkeiten</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-blue-400 font-mono">
                {categoryCounts.passive}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('technique'); setIsAddingNew(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'technique'
                  ? 'bg-indigo-950/70 border border-indigo-500/40 text-indigo-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-bolt text-indigo-400"></i>
                <span>Techniken</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-indigo-400 font-mono">
                {categoryCounts.technique}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('ultimate'); setIsAddingNew(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'ultimate'
                  ? 'bg-amber-950/70 border border-amber-500/40 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-crown text-amber-400"></i>
                <span>Ultimative Techniken</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 font-mono">
                {categoryCounts.ultimate}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('weapon'); setIsAddingNew(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'weapon'
                  ? 'bg-red-950/70 border border-red-500/40 text-red-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-swords text-red-400"></i>
                <span>Waffenbeherrschung</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-red-400 font-mono">
                {categoryCounts.weapon}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('competence'); setIsAddingNew(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'competence'
                  ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-tree text-emerald-400"></i>
                <span>Alltagskompetenzen</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-emerald-400 font-mono">
                {categoryCounts.competence}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('profession'); setIsAddingNew(false); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'profession'
                  ? 'bg-amber-950/70 border border-amber-600/40 text-amber-200'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-hammer text-amber-500"></i>
                <span>Berufe & Handwerk</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 font-mono">
                {categoryCounts.profession}
              </span>
            </button>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50">
            
            {/* ADD / LEARN NEW SKILL FORM */}
            {isAddingNew ? (
              <div className="flex-1 p-6 overflow-y-auto space-y-5 custom-scrollbar">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <i className="fa-solid fa-plus-circle text-indigo-400 text-base"></i>
                    <h3 className="font-bold text-sm text-white">Neue Fähigkeit oder Kompetenz erlernen</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Abbrechen
                  </button>
                </div>

                {/* CATEGORY PICKER */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Kategorie der Fähigkeit:</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { id: 'passive', label: 'Passive Fähigkeit', icon: 'fa-shield-halved', color: 'text-blue-400' },
                      { id: 'technique', label: 'Technik / Zauber', icon: 'fa-bolt', color: 'text-indigo-400' },
                      { id: 'ultimate', label: 'Ultimative Technik', icon: 'fa-crown', color: 'text-amber-400' },
                      { id: 'weapon', label: 'Waffenbeherrschung', icon: 'fa-swords', color: 'text-red-400' },
                      { id: 'competence', label: 'Alltagskompetenz', icon: 'fa-tree', color: 'text-emerald-400' },
                      { id: 'profession', label: 'Beruf & Handwerk', icon: 'fa-hammer', color: 'text-amber-500' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setAddCategory(cat.id as SkillCategoryTab);
                          setSelectedPresetId('');
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${
                          addCategory === cat.id
                            ? 'bg-slate-800 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <i className={`fa-solid ${cat.icon} ${cat.color}`}></i>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PRESET SELECTOR (FOR WEAPONS, EVERYDAY SKILLS, PROFESSIONS) */}
                {addCategory === 'competence' && (
                  <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Aus dem Katalog der 74 Alltagskompetenzen wählen:</span>
                      <span className="text-[10px] text-slate-500">Optional</span>
                    </label>
                    <select
                      value={selectedPresetId}
                      onChange={e => handleSelectPreset(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Kompetenz aus Katalog wählen --</option>
                      {CENTRAL_EVERYDAY_SKILLS.map(sk => (
                        <option key={sk.id} value={sk.id}>
                          {sk.name} ({sk.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {addCategory === 'weapon' && (
                  <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Aus dem Waffen- & Manöverkatalog wählen:</span>
                      <span className="text-[10px] text-slate-500">Optional</span>
                    </label>
                    <select
                      value={selectedPresetId}
                      onChange={e => handleSelectPreset(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Waffengattung wählen --</option>
                      {ALL_WEAPONS.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.categoryName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {addCategory === 'profession' && (
                  <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span>Aus dem Berufs- & Handwerkskatalog wählen:</span>
                      <span className="text-[10px] text-slate-500">Optional</span>
                    </label>
                    <select
                      value={selectedPresetId}
                      onChange={e => handleSelectPreset(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Beruf aus Katalog wählen --</option>
                      {JOB_CATEGORIES.map(cat => (
                        <optgroup key={cat.fieldId} label={cat.category}>
                          {cat.jobs.map(job => (
                            <option key={job} value={job}>
                              {job}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}

                {/* FORM FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Name der Fertigkeit:</label>
                    <input
                      type="text"
                      value={newSkillName}
                      onChange={e => setNewSkillName(e.target.value)}
                      placeholder="z.B. Eisspeer, Erste Hilfe, Parierdolch..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Typ / Spezifikation:</label>
                    <input
                      type="text"
                      value={newSkillType}
                      onChange={e => setNewSkillType(e.target.value)}
                      placeholder="z.B. Angriff, Defensiv, Überleben, Passiv..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Kosten / Ressource (optional):</label>
                    <input
                      type="text"
                      value={newSkillCost}
                      onChange={e => setNewSkillCost(e.target.value)}
                      placeholder="z.B. 15 MP, 10 Ausdauer, Keine..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Unterkategorie / Stil (optional):</label>
                    <input
                      type="text"
                      value={newSkillSubtype}
                      onChange={e => setNewSkillSubtype(e.target.value)}
                      placeholder="z.B. Eismagie, Nahkampf, Feldmedizin..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Wirkung & Beschreibung:</label>
                  <AutoExpandingTextarea
                    value={newSkillDescription}
                    onChange={e => setNewSkillDescription(e.target.value)}
                    minRows={3}
                    placeholder="Beschreibe die Wirkung, Anwendung und Eigenheiten dieser Fertigkeit..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNewSkill}
                    disabled={!newSkillName.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-lg shadow-indigo-900/30 transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>Fertigkeit erlernen & speichern</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* TOOLBAR: SEARCH & FILTER */}
                <div className="p-3 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-950/30">
                  <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
                    <i className="fa-solid fa-magnifying-glass text-slate-500 text-xs"></i>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Fertigkeiten, Techniken, Waffen oder Berufe durchsuchen..."
                      className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-slate-500 hover:text-slate-300 text-xs"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        filterMode === 'all'
                          ? 'bg-slate-800 text-white border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Alle
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('favorites')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        filterMode === 'favorites'
                          ? 'bg-amber-950/70 border border-amber-500/50 text-amber-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <i className="fa-solid fa-star text-amber-400 text-xs"></i>
                      <span>Favoriten</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('training')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        filterMode === 'training'
                          ? 'bg-indigo-950/70 border border-indigo-500/50 text-indigo-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      In Ausbildung
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('mastered')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        filterMode === 'mastered'
                          ? 'bg-slate-800 border border-slate-700 text-emerald-400'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Meisterschaft
                    </button>
                  </div>
                </div>

                {/* SKILLS LIST */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                  {filteredSkills.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <i className="fa-solid fa-book-open text-lg"></i>
                      </div>
                      <div className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Keine Fertigkeiten in diesem Bereich gefunden. Lerne neue Fähigkeiten, Techniken, Waffenbeherrschung oder Berufe über die Schaltfläche &bdquo;Fähigkeit erlernen&ldquo;.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNew(true);
                          if (activeTab !== 'all') setAddCategory(activeTab);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
                      >
                        <i className="fa-solid fa-plus"></i>
                        <span>Jetzt neue Fertigkeit erlernen</span>
                      </button>
                    </div>
                  ) : (
                    filteredSkills.map(skill => {
                      const isEditing = editingSkillId === skill.id;
                      const styles = getCategoryStyles(skill.category);
                      const currentLvl = skill.level || 1;
                      const maxLvl = skill.maxLevel || 10;
                      const progressPct = skill.progress !== undefined ? skill.progress : 0;

                      return (
                        <div
                          key={skill.id}
                          className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition-all space-y-3"
                        >
                          {/* CARD HEADER */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggleFavorite(skill)}
                                className={`p-1.5 rounded-lg border transition-all mt-0.5 ${
                                  skill.isFavorite
                                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                                title={skill.isFavorite ? 'Aus Favoriten entfernen' : 'Als Favorit markieren'}
                              >
                                <i className="fa-solid fa-star text-xs"></i>
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-white">{skill.name}</h4>
                                  
                                  {/* CATEGORY BADGE */}
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${styles.badgeBg} ${styles.badgeBorder} ${styles.badgeText}`}>
                                    {skill.categoryLabel}
                                  </span>

                                  {skill.type && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                      {skill.type}
                                    </span>
                                  )}

                                  {skill.cost && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-mono">
                                      {skill.cost}
                                    </span>
                                  )}
                                </div>

                                {skill.subtype && (
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Bereich: {skill.subtype}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* LEVEL & ACTIONS */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                                <span className="text-xs font-bold text-slate-300 mr-2 font-mono">
                                  Stufe {currentLvl} / {maxLvl}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustLevel(skill, -1)}
                                  disabled={currentLvl <= 1}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 text-xs"
                                  title="Stufe verringern"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustLevel(skill, 1)}
                                  disabled={currentLvl >= maxLvl}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 text-xs font-bold"
                                  title="Stufe erhöhen"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => setEditingSkillId(isEditing ? null : skill.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 text-xs"
                                title="Bearbeiten"
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSkill(skill)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-900 text-xs"
                                title="Entfernen"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>

                          {/* DESCRIPTION / EDIT FORM */}
                          {isEditing ? (
                            <div className="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Beschreibung bearbeiten:</label>
                              <AutoExpandingTextarea
                                value={skill.description || ''}
                                onChange={e => handleUpdateSkillDetails(skill, e.target.value)}
                                minRows={2}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none leading-relaxed"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingSkillId(null)}
                                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                                >
                                  Fertig
                                </button>
                              </div>
                            </div>
                          ) : (
                            skill.description && (
                              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-850 break-words">
                                {skill.description}
                              </p>
                            )
                          )}

                          {/* TRAINING PROGRESS BAR */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span className="font-semibold">Fortschritt:</span>
                              <span className="font-mono">
                                {skill.category === 'competence'
                                  ? `${progressPct}% Beherrschung (${getSkillLabel(progressPct)})`
                                  : skill.category === 'profession'
                                  ? `${progressPct}% Kompetenz (${skill.xp || 0} EP)`
                                  : `${progressPct}% (${skill.progressionLogic === 'training' ? `${skill.trainingUnits || 0}/${skill.trainingRequired || 3} Übungen` : `${skill.xp || 0}/${skill.xpNeeded || 100} EP`})`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            {skill.canTrain ? (
                              <button
                                type="button"
                                onClick={() => handleTrainSkill(skill)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 hover:border-indigo-500/50 text-xs font-bold transition-all flex items-center gap-1.5"
                                title="Trainiert die Fertigkeit und sendet eine Handlungsbeschreibung"
                              >
                                <i className="fa-solid fa-dumbbell text-indigo-400 text-xs"></i>
                                <span>Üben & Trainieren</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500 font-mono italic px-2">
                                Meisterschaft erreicht
                              </span>
                            )}

                            {skill.canUse ? (
                              <button
                                type="button"
                                onClick={() => handleUseSkill(skill)}
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs font-bold transition-all flex items-center gap-1.5"
                                title="Wendet die Fertigkeit direkt im Spiel an"
                              >
                                <i className={`fa-solid ${skill.category === 'profession' ? 'fa-hammer' : 'fa-play'} text-xs`}></i>
                                <span>{skill.category === 'profession' ? 'Ausüben' : skill.category === 'competence' ? 'Anwenden' : 'Einsetzen'}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-blue-400/80 font-mono italic px-2">
                                Dauerhaft aktiv
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-slate-500"></i>
            <span>Trainierte Fertigkeiten werden konsistent im Charakterprofil gespeichert.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
export default TrainingSkillsModal;
