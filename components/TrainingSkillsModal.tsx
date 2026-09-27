import React, { useState, useMemo } from 'react';
import { Adventure, TechniqueItem, Character, BaseAbility } from '../types';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import { CENTRAL_EVERYDAY_SKILLS } from './everydaySkillPresets';
import { WEAPON_CATEGORIES, ALL_WEAPONS } from '../lib/weaponTypesData';
import { JOB_CATEGORIES } from './jobPresets';

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

  // Extract all learned skills & competencies from player
  const player = adventure.player;

  // Normalized skill list
  const allSkills = useMemo(() => {
    if (!player) return [];
    const list: TechniqueItem[] = [];
    const seenIds = new Set<string>();

    // Helper to normalize and add
    const addToList = (item: Partial<TechniqueItem>, fallbackCategory: string) => {
      const id = item.id || `skill-${item.name}-${fallbackCategory}`.toLowerCase().replace(/\s+/g, '-');
      if (seenIds.has(id)) return;
      seenIds.add(id);

      list.push({
        id,
        name: item.name || 'Unbenannte Fähigkeit',
        category: (item.category as any) || fallbackCategory,
        type: item.type || (fallbackCategory === 'Passive Fähigkeiten' ? 'Passiv' : 'Aktiv'),
        subtype: item.subtype || '',
        description: item.description || '',
        level: typeof item.level === 'number' ? item.level : 1,
        maxLevel: typeof item.maxLevel === 'number' ? item.maxLevel : 10,
        xp: item.xp || 0,
        xpNeeded: item.xpNeeded || 100,
        trainingUnits: item.trainingUnits || item.trainingProgress || 0,
        trainingProgress: item.trainingProgress || item.trainingUnits || 0,
        trainingRequired: item.trainingRequired || 5,
        progressionLogic: item.progressionLogic || 'training',
        cost: item.cost || '',
        effects: item.effects || [],
        isFavorite: !!(item.isFavorite || (item as any).favorite),
        weaponType: item.weaponType || '',
        masteryLevel: item.masteryLevel || '',
        tier: item.tier || ''
      });
    };

    // 1. Existing techniqueList
    if (Array.isArray(player.techniqueList)) {
      player.techniqueList.forEach(t => {
        let cat = t.category || 'Techniken';
        if ((t as any).isUltimate || cat.toLowerCase().includes('ultimat')) cat = 'Ultimative Techniken';
        else if (cat.toLowerCase().includes('passiv') || t.type === 'Passiv') cat = 'Passive Fähigkeiten';
        else if (cat.toLowerCase().includes('waffe') || t.weaponType) cat = 'Waffenbeherrschung';
        else if (cat.toLowerCase().includes('alltag') || cat.toLowerCase().includes('kompetenz')) cat = 'Alltagskompetenzen';
        else if (cat.toLowerCase().includes('beruf')) cat = 'Berufe';
        addToList(t, cat);
      });
    }

    // 2. Base abilities if not already covered
    if (Array.isArray(player.baseAbilities)) {
      player.baseAbilities.forEach((ba: BaseAbility) => {
        addToList({
          id: ba.id,
          name: ba.displayName || ba.name,
          category: 'Techniken',
          type: 'Grundfähigkeit',
          description: ba.description,
          level: ba.level || 1,
          maxLevel: ba.maxLevel || 10,
          cost: ba.cost,
          isFavorite: (ba as any).isFavorite
        }, 'Techniken');
      });
    }

    // 3. Profession Competencies
    if (Array.isArray(player.professionCompetencies)) {
      player.professionCompetencies.forEach(pc => {
        addToList({
          id: pc.id,
          name: pc.name,
          category: 'Berufe',
          type: 'Berufskompetenz',
          description: pc.description,
          level: Math.max(1, Math.ceil((pc.proficiency || 10) / 10)),
          maxLevel: 10,
          trainingUnits: pc.experiencePoints || 0,
          trainingRequired: 100,
          progressionLogic: 'ep'
        }, 'Berufe');
      });
    }

    // 4. Everyday skills from string or list if not present
    if (typeof player.everydaySkills === 'string' && player.everydaySkills.trim()) {
      player.everydaySkills.split(',').forEach((s, idx) => {
        const trimmed = s.trim();
        if (trimmed) {
          addToList({
            id: `everyday-preset-${idx}-${trimmed.toLowerCase().replace(/\s+/g, '-')}`,
            name: trimmed,
            category: 'Alltagskompetenzen',
            type: 'Alltagskompetenz',
            description: `Erworbene Alltagskompetenz: ${trimmed}`,
            level: 1,
            maxLevel: 5,
            trainingUnits: 1,
            trainingRequired: 3,
            progressionLogic: 'training'
          }, 'Alltagskompetenzen');
        }
      });
    }

    // 5. Weapon masteries if present in player.skills
    if (typeof player.skills === 'string' && player.skills.trim()) {
      player.skills.split(',').forEach((s, idx) => {
        const trimmed = s.trim();
        if (trimmed && (trimmed.toLowerCase().includes('schwert') || trimmed.toLowerCase().includes('kampf') || trimmed.toLowerCase().includes('bogen') || trimmed.toLowerCase().includes('lanze') || trimmed.toLowerCase().includes('schild'))) {
          addToList({
            id: `weapon-preset-${idx}-${trimmed.toLowerCase().replace(/\s+/g, '-')}`,
            name: trimmed,
            category: 'Waffenbeherrschung',
            type: 'Waffenbeherrschung',
            description: `Waffenbeherrschung und Kampftechnik: ${trimmed}`,
            level: 1,
            maxLevel: 10,
            trainingUnits: 0,
            trainingRequired: 5,
            progressionLogic: 'training'
          }, 'Waffenbeherrschung');
        }
      });
    }

    return list;
  }, [player]);

  // Filter and search
  const filteredSkills = useMemo(() => {
    return allSkills.filter(skill => {
      // Category match
      if (activeTab === 'passive' && skill.category !== 'Passive Fähigkeiten') return false;
      if (activeTab === 'technique' && skill.category !== 'Techniken') return false;
      if (activeTab === 'ultimate' && skill.category !== 'Ultimative Techniken') return false;
      if (activeTab === 'weapon' && skill.category !== 'Waffenbeherrschung') return false;
      if (activeTab === 'competence' && skill.category !== 'Alltagskompetenzen') return false;
      if (activeTab === 'profession' && skill.category !== 'Berufe') return false;

      // Filter modes
      if (filterMode === 'favorites' && !skill.isFavorite) return false;
      if (filterMode === 'training' && (skill.level || 1) >= (skill.maxLevel || 10)) return false;
      if (filterMode === 'mastered' && (skill.level || 1) < (skill.maxLevel || 10)) return false;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = (skill.name || '').toLowerCase().includes(query);
        const matchDesc = (skill.description || '').toLowerCase().includes(query);
        const matchSub = (skill.subtype || '').toLowerCase().includes(query);
        const matchType = (skill.type || '').toLowerCase().includes(query);
        const matchWeapon = (skill.weaponType || '').toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchSub && !matchType && !matchWeapon) return false;
      }

      return true;
    });
  }, [allSkills, activeTab, filterMode, searchQuery]);

  // Category counts
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
      if (s.category === 'Passive Fähigkeiten') counts.passive++;
      else if (s.category === 'Techniken') counts.technique++;
      else if (s.category === 'Ultimative Techniken') counts.ultimate++;
      else if (s.category === 'Waffenbeherrschung') counts.weapon++;
      else if (s.category === 'Alltagskompetenzen') counts.competence++;
      else if (s.category === 'Berufe') counts.profession++;
    });

    return counts;
  }, [allSkills]);

  // Persist skill updates back to Adventure
  const persistSkillsToAdventure = (updatedList: TechniqueItem[]) => {
    const updatedPlayer: Character = {
      ...player,
      techniqueList: updatedList
    };

    const updatedAdventure: Adventure = {
      ...adventure,
      player: updatedPlayer
    };

    onUpdateAdventure(updatedAdventure);
  };

  // Toggle Favorite
  const handleToggleFavorite = (skillId: string) => {
    const updated = allSkills.map(s => {
      if (s.id === skillId) {
        return { ...s, isFavorite: !s.isFavorite };
      }
      return s;
    });
    persistSkillsToAdventure(updated);
  };

  // Execute / Use action in chat
  const handleUseSkill = (skill: TechniqueItem) => {
    let actionText = `*setzt ${skill.name} ein*`;
    if (skill.category === 'Passive Fähigkeiten') {
      actionText = `*nutzt das passive Talent '${skill.name}'*`;
    } else if (skill.category === 'Ultimative Techniken') {
      actionText = `*entfesselt die ultimative Technik: ${skill.name}!*`;
    } else if (skill.category === 'Waffenbeherrschung') {
      actionText = `*führt ein Manöver mit ${skill.name} aus*`;
    } else if (skill.category === 'Alltagskompetenzen') {
      actionText = `*wendet die Alltagskompetenz '${skill.name}' an*`;
    } else if (skill.category === 'Berufe') {
      actionText = `*arbeitet mit der Berufsfähigkeit '${skill.name}'*`;
    }

    if (onSendChatMessage) {
      onSendChatMessage(actionText);
    } else if (onSetInputText) {
      onSetInputText(actionText);
    }
    onClose();
  };

  // Train / Practice action (with progress increment)
  const handleTrainSkill = (skill: TechniqueItem) => {
    const currentLevel = skill.level || 1;
    const maxLevel = skill.maxLevel || 10;
    const currentUnits = (skill.trainingUnits || skill.trainingProgress || 0) + 1;
    const req = skill.trainingRequired || 5;

    let newLevel = currentLevel;
    let newUnits = currentUnits;
    let levelUp = false;

    if (currentLevel < maxLevel && newUnits >= req) {
      newLevel = currentLevel + 1;
      newUnits = 0;
      levelUp = true;
    }

    const updated = allSkills.map(s => {
      if (s.id === skill.id) {
        return {
          ...s,
          level: newLevel,
          trainingUnits: newUnits,
          trainingProgress: newUnits
        };
      }
      return s;
    });

    persistSkillsToAdventure(updated);

    // Insert or send roleplay training message
    let trainingMessage = `*trainiert die Fertigkeit '${skill.name}' intensiv*`;
    if (levelUp) {
      trainingMessage = `*trainiert die Fertigkeit '${skill.name}' erfolgreich und erreicht Stufe ${newLevel}!*`;
    }

    if (onSendChatMessage) {
      onSendChatMessage(trainingMessage);
    } else if (onSetInputText) {
      onSetInputText(trainingMessage);
    }
    onClose();
  };

  // Level adjustment (+ / -)
  const handleAdjustLevel = (skillId: string, delta: number) => {
    const updated = allSkills.map(s => {
      if (s.id === skillId) {
        const cur = s.level || 1;
        const max = s.maxLevel || 10;
        const next = Math.max(1, Math.min(max, cur + delta));
        return { ...s, level: next };
      }
      return s;
    });
    persistSkillsToAdventure(updated);
  };

  // Delete skill
  const handleDeleteSkill = (skillId: string) => {
    const updated = allSkills.filter(s => s.id !== skillId);
    persistSkillsToAdventure(updated);
  };

  // Update existing skill details
  const handleUpdateSkillDetails = (skillId: string, updates: Partial<TechniqueItem>) => {
    const updated = allSkills.map(s => {
      if (s.id === skillId) {
        return { ...s, ...updates };
      }
      return s;
    });
    persistSkillsToAdventure(updated);
    setEditingSkillId(null);
  };

  // Handle Preset selection for learning
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
      // Find job in JOB_CATEGORIES
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
        setNewSkillType('Beruf');
        setNewSkillSubtype(foundCategory);
        setNewSkillCost('');
      }
    }
  };

  // Add newly learned skill
  const handleCreateNewSkill = () => {
    if (!newSkillName.trim()) return;

    let targetCategory = 'Techniken';
    if (addCategory === 'passive') targetCategory = 'Passive Fähigkeiten';
    else if (addCategory === 'technique') targetCategory = 'Techniken';
    else if (addCategory === 'ultimate') targetCategory = 'Ultimative Techniken';
    else if (addCategory === 'weapon') targetCategory = 'Waffenbeherrschung';
    else if (addCategory === 'competence') targetCategory = 'Alltagskompetenzen';
    else if (addCategory === 'profession') targetCategory = 'Berufe';

    const newSkill: TechniqueItem = {
      id: `skill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newSkillName.trim(),
      category: targetCategory,
      type: newSkillType || 'Aktiv',
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

    const updatedList = [...allSkills, newSkill];
    persistSkillsToAdventure(updatedList);

    // Reset creation form
    setNewSkillName('');
    setNewSkillDescription('');
    setNewSkillCost('');
    setNewSkillSubtype('');
    setSelectedPresetId('');
    setIsAddingNew(false);

    // Announce learning in chat
    const learnAnnouncement = `*beginnt mit dem Training der neuen Fertigkeit '${newSkill.name}' (${targetCategory})*`;
    if (onSendChatMessage) {
      onSendChatMessage(learnAnnouncement);
    } else if (onSetInputText) {
      onSetInputText(learnAnnouncement);
    }
  };

  // Submit free roleplay action
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
                <span>Training & Erlernbare Fähigkeiten</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                  {allSkills.length} Erlernt
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Verwalte deine Techniken, Meisterungen, Alltagskompetenzen und Berufe.
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
                <span>Alle Kategorien</span>
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
                    <label className="text-xs font-bold text-slate-300">Name der Fähigkeit / Technik:</label>
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
                    placeholder="Beschreibe die Wirkung, Anwendung und Eigenheiten dieser Fähigkeit..."
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
                    <span>Fähigkeit erlernen & speichern</span>
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
                      placeholder="Fähigkeiten, Techniken oder Berufe durchsuchen..."
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
                        Keine Fähigkeiten in dieser Kategorie gefunden. Lerne neue Fähigkeiten, Techniken, Waffenbeherrschung oder Berufe über die Schaltfläche &bdquo;Fähigkeit erlernen&ldquo;.
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
                        <span>Jetzt neue Fähigkeit erlernen</span>
                      </button>
                    </div>
                  ) : (
                    filteredSkills.map(skill => {
                      const isEditing = editingSkillId === skill.id;
                      const currentLvl = skill.level || 1;
                      const maxLvl = skill.maxLevel || 10;
                      const units = skill.trainingUnits || skill.trainingProgress || 0;
                      const reqUnits = skill.trainingRequired || 5;
                      const progressPct = Math.min(100, Math.round((units / reqUnits) * 100));

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
                                onClick={() => handleToggleFavorite(skill.id)}
                                className={`p-1.5 rounded-lg border transition-all mt-0.5 ${
                                  skill.isFavorite
                                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-400'
                                    : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                                title={skill.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                              >
                                <i className="fa-solid fa-star text-xs"></i>
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-white">{skill.name}</h4>
                                  
                                  {/* CATEGORY BADGE */}
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                                    skill.category === 'Passive Fähigkeiten'
                                      ? 'bg-blue-950/80 border-blue-500/40 text-blue-300'
                                      : skill.category === 'Ultimative Techniken'
                                      ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                                      : skill.category === 'Waffenbeherrschung'
                                      ? 'bg-red-950/80 border-red-500/40 text-red-300'
                                      : skill.category === 'Alltagskompetenzen'
                                      ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                                      : skill.category === 'Berufe'
                                      ? 'bg-amber-950/80 border-amber-600/40 text-amber-200'
                                      : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300'
                                  }`}>
                                    {skill.category}
                                  </span>

                                  {skill.type && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                                      {skill.type}
                                    </span>
                                  )}

                                  {skill.cost && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-mono">
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
                                  onClick={() => handleAdjustLevel(skill.id, -1)}
                                  disabled={currentLvl <= 1}
                                  className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 text-xs"
                                  title="Stufe verringern"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustLevel(skill.id, 1)}
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
                                onClick={() => handleDeleteSkill(skill.id)}
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
                                onChange={e => handleUpdateSkillDetails(skill.id, { description: e.target.value })}
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
                              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-850">
                                {skill.description}
                              </p>
                            )
                          )}

                          {/* TRAINING PROGRESS BAR */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span className="font-semibold">Trainingsfortschritt:</span>
                              <span className="font-mono">
                                {units} / {reqUnits} Übungseinheiten ({progressPct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                              <div
                                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleTrainSkill(skill)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 hover:border-indigo-500/50 text-xs font-bold transition-all flex items-center gap-1.5"
                              title="Trainiert die Fähigkeit und sendet eine Handlungsbeschreibung"
                            >
                              <i className="fa-solid fa-dumbbell text-indigo-400 text-xs"></i>
                              <span>Üben & Trainieren</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUseSkill(skill)}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md text-xs font-bold transition-all flex items-center gap-1.5"
                              title="Wendet die Fähigkeit direkt im Spiel an"
                            >
                              <i className="fa-solid fa-play text-xs"></i>
                              <span>Einsetzen</span>
                            </button>
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
            <span>Trainierte Fähigkeiten werden dauerhaft im Charakterprofil gespeichert.</span>
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
