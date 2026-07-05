
import React, { useState, useRef, useEffect } from 'react';
import { Adventure, ChatMessage, GameViewMode, StatusElement, NPC, UserProfile, Character } from '../types';
import { GeminiService, audioUtils } from '../services/geminiService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Modality } from '@google/genai';


const baseEmotions = [
  'lächelnd', 'böse', 'traurig', 'verlegen', 'überrascht', 'wütend', 'emotionslos', 'ernst', 
  'ängstlich', 'arrogant', 'verwirrt', 'glücklich', 'stolz', 'nachdenklich', 'schadenfroh', 
  'erschöpft', 'schockiert', 'skeptisch', 'entschlossen', 'geheimnisvoll', 'erleichtert', 
  'aufgeregt', 'schüchtern', 'besorgt', 'mitleidig', 'angewidert'
];

const baseTones = [
  'freundlich', 'sarkastisch', 'wütend', 'traurig', 'panisch', 'flüsternd', 'zögerlich', 
  'kalt', 'ironisch', 'laut', 'leise', 'bestimmend', 'gelangweilt', 'zärtlich', 'respektvoll', 
  'spöttisch', 'heiser', 'enthusiastisch', 'monoton', 'drohend', 'flehend', 'stotternd', 
  'geheimnisvoll', 'nachdenklich', 'nervös', 'selbstbewusst', 'erhaben', 'verspielt', 
  'melancholisch', 'schreiend', 'geknickt'
];

const calculateCombatPower = (char?: any) => {
  if (!char) return 100;
  let power = 50; // base power
  if (char.attributes) {
    char.attributes.forEach((attr: any) => power += attr.value);
  }
  if (char.abilities) {
    char.abilities.forEach((ability: any) => {
      power += 50;
      if (ability.techniqueList) {
        power += ability.techniqueList.length * 20;
      } else if (ability.techniques) {
        power += ability.techniques.split(',').length * 20;
      }
    });
  }
  if (char.skills) {
    power += char.skills.split(',').length * 15;
  }
  if (char.campaignPowerLevels) {
    Object.values(char.campaignPowerLevels).forEach((lvl: any) => {
      if (lvl && typeof lvl.value === 'number') {
        power += lvl.value;
      }
    });
  }
  return power;
};


interface Props {
  adventure: Adventure;
  onViewChange: (mode: GameViewMode) => void;
  onUpdateAdventure: (adventure: Adventure) => void;
  userProfile?: UserProfile;
}

const GameView: React.FC<Props> = ({ adventure, onViewChange, onUpdateAdventure, userProfile }) => {
  const adventureRef = useRef(adventure);
  useEffect(() => {
    adventureRef.current = adventure;
  }, [adventure]);

  const getPowerLevel = (name?: string) => {
    if (!name) return null;
    const levels = adventureRef.current?.player?.campaignPowerLevels || adventure.player.campaignPowerLevels || {};
    if (levels[name]) return levels[name];
    const lowerName = name.toLowerCase().trim();
    const matchKey = Object.keys(levels).find(k => k.toLowerCase().trim() === lowerName);
    if (matchKey) return levels[matchKey];
    return null;
  };

  const getNPCMaxHp = (npc: NPC | Character): number => {
    const healthPowerNames = adventure.world.healthPowerNames || [];
    const healthPowerName = adventure.world.healthPowerName;
    const isHero = adventure.world.isHeroic !== false;
    const settings = adventure.world.campaignPowerSettings || {};
    
    let npcMaxHp = isHero ? 150 : 100;
    if (adventure.world.dramaLevel === 'Hoch') npcMaxHp = 150;
    else if (adventure.world.dramaLevel === 'Niedrig') npcMaxHp = 75;

    const levels = npc.campaignPowerLevels || (npc as any).details?.campaignPowerLevels || {};

    if (healthPowerNames.length > 0) {
      let sumVal = 0;
      healthPowerNames.forEach(name => {
        const level = levels[name] || Object.entries(levels).find(([k]) => k.toLowerCase().trim() === name.toLowerCase().trim())?.[1];
        if (level && (level as any).value !== undefined) {
          sumVal += (level as any).value;
        } else {
          // Fallback to setting definition min
          const setting = settings[name] || Object.entries(settings).find(([k]) => k.toLowerCase().trim() === name.toLowerCase().trim())?.[1];
          if (setting) {
            sumVal += (setting as any).min !== undefined ? (setting as any).min : 50;
          } else {
            sumVal += 50;
          }
        }
      });
      if (sumVal > 0) {
        npcMaxHp = sumVal;
      }
    } else if (healthPowerName) {
      const level = levels[healthPowerName] || Object.entries(levels).find(([k]) => k.toLowerCase().trim() === healthPowerName.toLowerCase().trim())?.[1];
      if (level && (level as any).value !== undefined) {
        npcMaxHp = (level as any).value;
      } else {
        // Fallback to setting definition min
        const setting = settings[healthPowerName] || Object.entries(settings).find(([k]) => k.toLowerCase().trim() === healthPowerName.toLowerCase().trim())?.[1];
        if (setting) {
          npcMaxHp = (setting as any).min !== undefined ? (setting as any).min : npcMaxHp;
        }
      }
    }
    return npcMaxHp;
  };

  const getFavoriteTechniques = () => {
    const list: any[] = [];
    adventure?.player?.abilities?.forEach((ability: any) => {
      if (ability.techniqueList) {
        ability.techniqueList.forEach((tech: any) => {
          if (tech.isFavorite || tech.favorite) {
            list.push({
              ...tech,
              abilityId: ability.id,
              abilitySource: ability.source,
            });
          }
        });
      }
    });
    return list;
  };

  const findNpcByIdOrName = (id: string, name?: string): any => {
    if (id && id !== 'custom') {
      const found = adventureRef.current?.npcs.find(n => n.id === id) || adventure.npcs.find(n => n.id === id);
      if (found) return found;
    }
    const searchName = name || (id && id !== 'custom' ? id : '');
    if (searchName) {
      const dbNpcs = adventureRef.current?.npcs || adventure.npcs || [];
      const found = dbNpcs.find(n => n.name.toLowerCase().trim() === searchName.toLowerCase().trim());
      if (found) return found;
      
      const dbLore = adventureRef.current?.loreDatabase || adventure.loreDatabase;
      if (dbLore) {
        const foundLore = dbLore.find(item => 
          item.category === 'Charaktere' && 
          item.title.toLowerCase().trim() === searchName.toLowerCase().trim()
        );
        if (foundLore) {
          return {
            id: foundLore.id,
            name: foundLore.title,
            role: foundLore.details?.role || 'Charakter',
            campaignPowerLevels: foundLore.details?.campaignPowerLevels,
            appearance: foundLore.details?.appearance
          };
        }
      }
    }
    return null;
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (adventure.chatHistory && adventure.chatHistory.length > 0) {
      return adventure.chatHistory;
    }
    const initialMsgs: ChatMessage[] = [
      {
        id: 'prologue-msg',
        role: 'model',
        text: adventure.prologue || 'Die Reise beginnt...'
      }
    ];
    if (adventure.firstMessage) {
      initialMsgs.push({
        id: 'first-msg',
        role: 'model',
        text: adventure.firstMessage
      });
    }
    return initialMsgs;
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmotionMenu, setShowEmotionMenu] = useState(false);
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [showFavoritesMenu, setShowFavoritesMenu] = useState(false);

  // Frequency-based usage tracking of emotions/tones (persisted safely in localStorage)
  const [emotionUsage, setEmotionUsage] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('adventure_forge_emotion_usage');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [toneUsage, setToneUsage] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('adventure_forge_tone_usage');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const handleSelectEmotion = (emotion: string) => {
    setEmotionUsage(prev => {
      const updated = { ...prev, [emotion]: (prev[emotion] || 0) + 1 };
      try {
        localStorage.setItem('adventure_forge_emotion_usage', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSelectTone = (tone: string) => {
    setToneUsage(prev => {
      const updated = { ...prev, [tone]: (prev[tone] || 0) + 1 };
      try {
        localStorage.setItem('adventure_forge_tone_usage', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const sortedEmotions = [...baseEmotions].sort((a, b) => {
    const countA = emotionUsage[a] || 0;
    const countB = emotionUsage[b] || 0;
    if (countB !== countA) {
      return countB - countA;
    }
    return baseEmotions.indexOf(a) - baseEmotions.indexOf(b);
  });

  const sortedTones = [...baseTones].sort((a, b) => {
    const countA = toneUsage[a] || 0;
    const countB = toneUsage[b] || 0;
    if (countB !== countA) {
      return countB - countA;
    }
    return baseTones.indexOf(a) - baseTones.indexOf(b);
  });

  const [error, setError] = useState<string | null>(null);
  const [loreNotifications, setLoreNotifications] = useState<{ id: string; type: 'add' | 'unlock'; title: string; category: string }[]>([]);

  // --- JRPG KAMPFSYSTEM STATES ---
  const [isCombatActive, setIsCombatActive] = useState(() => adventure.combatState?.isCombatActive ?? false);
  const [isCombatMenuExpanded, setIsCombatMenuExpanded] = useState(() => adventure.combatState?.isCombatActive ?? false);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>(() => adventure.combatState?.selectedEnemyId ?? '');
  const [selectedEnemyIds, setSelectedEnemyIds] = useState<string[]>(() => adventure.combatState?.selectedEnemyIds ?? (adventure.combatState?.selectedEnemyId ? [adventure.combatState.selectedEnemyId] : []));
  const [customEnemyName, setCustomEnemyName] = useState(() => adventure.combatState?.customEnemyName ?? '');
  const [customAttackText, setCustomAttackText] = useState('');

  const [scannedOpponents, setScannedOpponents] = useState<Record<string, {
    role: string;
    description: string;
    powerSource: string;
    powerCost: string;
    techniques: { name: string; description: string }[];
    campaignPowerLevels: Record<string, { value: number; potentialMax: number }>;
  }>>({});
  const [scanningEnemyId, setScanningEnemyId] = useState<string | null>(null);
  
  // Dynamic Threats/Opponents List States
  const [opponents, setOpponents] = useState<{
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    count?: number;
    role?: string;
    isFodder?: boolean;
  }[]>(() => {
    const saved = adventure.combatState?.opponents ?? [];
    if (saved.length > 0) {
      return saved.map(o => {
        let npc = findNpcByIdOrName(o.id, o.name);
        if (npc) {
          const calculatedMax = getNPCMaxHp(npc);
          if (o.maxHp !== calculatedMax) {
            const currentHp = o.hp === o.maxHp ? calculatedMax : Math.min(calculatedMax, Math.round((o.hp / o.maxHp) * calculatedMax));
            return {
              ...o,
              hp: currentHp,
              maxHp: calculatedMax
            };
          }
        }
        return o;
      });
    }
    return saved;
  });
  const [newOpponentName, setNewOpponentName] = useState('');
  const [newOpponentCount, setNewOpponentCount] = useState<string>('');
  const [newOpponentHp, setNewOpponentHp] = useState<number>(100);
  const [showAddOpponentForm, setShowAddOpponentForm] = useState(false);

  useEffect(() => {
    if (!isCombatActive || !selectedEnemyId) return;
    
    if (scanningEnemyId === selectedEnemyId) return;

    const existingNpc = findNpcByIdOrName(selectedEnemyId);
    if (existingNpc) return;

    const cleanId = selectedEnemyId.trim().toLowerCase();
    const existingLore = (adventure.loreDatabase || []).find(e => 
      (e.category === 'Charaktere' || e.category === 'Gegner') && 
      (e.id === selectedEnemyId || e.title.toLowerCase() === cleanId)
    );
    if (existingLore) return;

    if (scannedOpponents[selectedEnemyId]) return;

    const activeOpponent = opponents.find(o => o.id === selectedEnemyId);
    if (!activeOpponent) return;

    const triggerBackgroundScan = async () => {
      setScanningEnemyId(selectedEnemyId);
      try {
        const factions = (adventure.loreDatabase || []).filter(item => item.category === 'Fraktionen').map(f => f.title);
        const data = await GeminiService.scanCombatant(
          adventure.world,
          activeOpponent.name,
          adventure.player,
          factions
        );
        setScannedOpponents(prev => ({
          ...prev,
          [selectedEnemyId]: data
        }));
      } catch (err) {
        console.error("Auto combat scanning failed:", err);
      } finally {
        setScanningEnemyId(null);
      }
    };

    triggerBackgroundScan();
  }, [selectedEnemyId, isCombatActive, opponents, scannedOpponents, scanningEnemyId, adventure]);

  const handleSaveScannedToCodex = (enemyId: string) => {
    const scanData = scannedOpponents[enemyId];
    if (!scanData) return;

    const activeOpponent = opponents.find(o => o.id === enemyId);
    const title = activeOpponent ? activeOpponent.name : enemyId;

    const exists = (adventure.loreDatabase || []).some(e => e.category === 'Gegner' && e.title.toLowerCase() === title.toLowerCase());
    if (exists) {
      alert("Dieser Gegner ist bereits im Codex eingetragen!");
      return;
    }

    const newEntry = {
      id: 'dyn-' + Math.random().toString(36).substr(2, 9),
      category: 'Gegner' as const,
      title,
      description: scanData.description || 'Ein im Kampf gescannter Widersacher.',
      isUnlocked: true,
      details: {
        role: scanData.role || 'Gegner',
        powerSource: scanData.powerSource || '',
        powerCost: scanData.powerCost || '',
        techniques: scanData.techniques || [],
        campaignPowerLevels: scanData.campaignPowerLevels || {}
      }
    };

    const updatedLore = [...(adventure.loreDatabase || []), newEntry];
    onUpdateAdventure({
      ...adventure,
      loreDatabase: updatedLore
    });

    setLoreNotifications(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type: 'add',
        title,
        category: 'Gegner'
      }
    ]);
  };

  // Dynamische Initialisierung von HP/MP auf Basis der Kampagnen-Einstellungen und Macht-Werten des Charakters
  const initialStats = React.useMemo(() => {
    const isHero = adventure.world.isHeroic !== false;
    const healthPowerNames = adventure.world.healthPowerNames || [];
    const healthPowerName = adventure.world.healthPowerName;
    
    // Calculate Master Max HP and current HP from campaignPowerLevels
    let masterMaxHp = isHero ? 150 : 100;
    let masterCurrentHp = masterMaxHp;

    if (healthPowerNames.length > 0) {
      let sumCurrent = 0;
      healthPowerNames.forEach(name => {
        const hLevel = getPowerLevel(name);
        if (hLevel) {
          sumCurrent += hLevel.value !== undefined ? hLevel.value : 100;
        }
      });
      if (sumCurrent > 0) {
        masterMaxHp = sumCurrent;
        masterCurrentHp = masterMaxHp;
      }
    } else if (healthPowerName) {
      const hLevel = getPowerLevel(healthPowerName);
      if (hLevel) {
        masterMaxHp = hLevel.value !== undefined ? hLevel.value : masterMaxHp;
        masterCurrentHp = masterMaxHp;
      }
    }

    // Calculate Master Max MP and current MP from campaignPowerLevels
    const costResources = adventure.world.costResources || [];
    const costPowerNames = adventure.world.costPowerNames || [];
    const costPowerName = adventure.world.costPowerName;
    let masterMaxMp = isHero ? 120 : 80;
    let masterCurrentMp = masterMaxMp;

    if (costResources.length > 0) {
      const primaryRes = costResources[0];
      const cLevel = primaryRes.radarPowerName ? getPowerLevel(primaryRes.radarPowerName) : null;
      if (cLevel) {
        masterMaxMp = cLevel.value !== undefined ? cLevel.value : (primaryRes.baseMax ?? 100);
        masterCurrentMp = masterMaxMp;
      } else {
        masterMaxMp = primaryRes.baseMax ?? 100;
        masterCurrentMp = masterMaxMp;
      }
    } else if (costPowerNames.length > 0) {
      let sumCurrent = 0;
      costPowerNames.forEach(name => {
        const cLevel = getPowerLevel(name);
        if (cLevel) {
          sumCurrent += cLevel.value !== undefined ? cLevel.value : 100;
        }
      });
      if (sumCurrent > 0) {
        masterMaxMp = sumCurrent;
        masterCurrentMp = masterMaxMp;
      }
    } else if (costPowerName) {
      const cLevel = getPowerLevel(costPowerName);
      if (cLevel) {
        masterMaxMp = cLevel.value !== undefined ? cLevel.value : masterMaxMp;
        masterCurrentMp = masterMaxMp;
      }
    } else {
      // Bestimme Ressourcen-Namen lokal
      const resourcesSet = new Set<string>();
      if (adventure?.world?.campaignPowerSettings) {
        Object.entries(adventure.world.campaignPowerSettings).forEach(([key, val]) => {
          const isPhysical = typeof val === 'object' && (val as any).category === 'physical';
          const lowerKey = key.toLowerCase();
          const matchesResourceWord = [
            'mana', 'mp', 'chakra', 'energie', 'energy', 'ausdauer', 'stamina', 'fokus', 
            'focus', 'zorn', 'rage', 'wut', 'ki', 'chi', 'prana', 'spirit', 'seele', 
            'magie', 'magic', 'willenskraft', 'willpower', 'psi', 'kraft', 'power', 'schwertenergie'
          ].some(kw => lowerKey.includes(kw));
          
          if (!isPhysical || matchesResourceWord) {
            resourcesSet.add(key);
          }
        });
      }
      const primaryRes = Array.from(resourcesSet)[0];
      const pLevel = primaryRes ? getPowerLevel(primaryRes) : null;
      if (pLevel) {
        masterMaxMp = pLevel.value !== undefined ? pLevel.value : masterMaxMp;
        masterCurrentMp = masterMaxMp;
      }
    }

    // If active combat is stored, we preserve active HP/MP from combatState.
    // Otherwise (out of combat), we always trust the master campaign stats.
    const isCombat = adventure.combatState?.isCombatActive ?? false;

    if (isCombat && adventure.combatState) {
      return {
        playerHp: adventure.combatState.playerHp ?? masterCurrentHp,
        playerMaxHp: masterMaxHp,
        playerMp: adventure.combatState.playerMp ?? masterCurrentMp,
        playerMaxMp: masterMaxMp
      };
    }

    return {
      playerHp: masterCurrentHp,
      playerMaxHp: masterMaxHp,
      playerMp: masterCurrentMp,
      playerMaxMp: masterMaxMp
    };
  }, [adventure]);

  const [playerHp, setPlayerHp] = useState(() => initialStats.playerHp);
  const [playerMaxHp, setPlayerMaxHp] = useState(() => initialStats.playerMaxHp);
  const [playerMp, setPlayerMp] = useState(() => initialStats.playerMp);
  const [playerMaxMp, setPlayerMaxMp] = useState(() => initialStats.playerMaxMp);
  
  // Sync HP/MP state variables when initialStats (derived from adventure prop updates) changes.
  // This ensures changes from the Character / World editors are immediately applied without needing a full unmount.
  useEffect(() => {
    setPlayerHp(prev => {
      const target = initialStats.playerHp;
      if (prev === target || (typeof prev === 'number' && typeof target === 'number' && isNaN(prev) && isNaN(target))) {
        return prev;
      }
      return typeof target === 'number' && !isNaN(target) ? target : prev;
    });
    setPlayerMaxHp(prev => {
      const target = initialStats.playerMaxHp;
      if (prev === target || (typeof prev === 'number' && typeof target === 'number' && isNaN(prev) && isNaN(target))) {
        return prev;
      }
      return typeof target === 'number' && !isNaN(target) ? target : prev;
    });
    setPlayerMp(prev => {
      const target = initialStats.playerMp;
      if (prev === target || (typeof prev === 'number' && typeof target === 'number' && isNaN(prev) && isNaN(target))) {
        return prev;
      }
      return typeof target === 'number' && !isNaN(target) ? target : prev;
    });
    setPlayerMaxMp(prev => {
      const target = initialStats.playerMaxMp;
      if (prev === target || (typeof prev === 'number' && typeof target === 'number' && isNaN(prev) && isNaN(target))) {
        return prev;
      }
      return typeof target === 'number' && !isNaN(target) ? target : prev;
    });
  }, [initialStats]);

  const [enemyHp, setEnemyHp] = useState(() => {
    if (adventure.combatState?.enemyHp !== undefined) {
      const selId = adventure.combatState.selectedEnemyId;
      const customNm = adventure.combatState.customEnemyName;
      const char = findNpcByIdOrName(selId, customNm);
      if (char) {
        const calculatedMax = getNPCMaxHp(char);
        if (adventure.combatState.enemyMaxHp !== calculatedMax) {
          return adventure.combatState.enemyHp === adventure.combatState.enemyMaxHp ? calculatedMax : Math.min(calculatedMax, Math.round((adventure.combatState.enemyHp / adventure.combatState.enemyMaxHp) * calculatedMax));
        }
      }
      return adventure.combatState.enemyHp;
    }
    return 100;
  });
  
  const [enemyMaxHp, setEnemyMaxHp] = useState(() => {
    if (adventure.combatState?.enemyMaxHp !== undefined) {
      const selId = adventure.combatState.selectedEnemyId;
      const customNm = adventure.combatState.customEnemyName;
      const char = findNpcByIdOrName(selId, customNm);
      if (char) {
        return getNPCMaxHp(char);
      }
      return adventure.combatState.enemyMaxHp;
    }
    return 100;
  });
  
  const [combatSubMenu, setCombatSubMenu] = useState<'main' | 'attack' | 'skills' | 'defend' | 'items' | 'start'>(() => adventure.combatState?.combatSubMenu ?? 'start');

  // Synchronize main target HP updates back to opponents list
  useEffect(() => {
    if (!isCombatActive || !selectedEnemyId) return;
    setOpponents(prev => {
      const existing = prev.find(o => o.id === selectedEnemyId);
      if (existing && (existing.hp !== enemyHp || existing.maxHp !== enemyMaxHp)) {
        if (typeof enemyHp === 'number' && isNaN(enemyHp)) return prev;
        if (typeof enemyMaxHp === 'number' && isNaN(enemyMaxHp)) return prev;
        return prev.map(o => o.id === selectedEnemyId ? { ...o, hp: enemyHp, maxHp: enemyMaxHp } : o);
      }
      return prev;
    });
  }, [enemyHp, enemyMaxHp, selectedEnemyId, isCombatActive]);

  // Persistent combat state synchronization
  useEffect(() => {
    const currentCombatState = {
      isCombatActive,
      selectedEnemyId,
      selectedEnemyIds,
      customEnemyName,
      opponents,
      playerHp,
      playerMaxHp,
      playerMp,
      playerMaxMp,
      enemyHp,
      enemyMaxHp,
      combatSubMenu
    };

    const stored = adventure.combatState;
    let hasChanged = false;

    if (!isCombatActive) {
      // Wenn der Kampf nicht aktiv ist, müssen wir nur synchronisieren, wenn der gespeicherte Zustand den Kampf noch als aktiv markiert hat
      hasChanged = !stored || stored.isCombatActive !== false;
    } else {
      // Wenn der Kampf aktiv ist, synchronisieren wir alle relevanten Kampfeigenschaften
      hasChanged = !stored ||
        stored.isCombatActive !== isCombatActive ||
        stored.selectedEnemyId !== selectedEnemyId ||
        JSON.stringify(stored.selectedEnemyIds || []) !== JSON.stringify(selectedEnemyIds) ||
        stored.customEnemyName !== customEnemyName ||
        !Object.is(stored.playerHp, playerHp) ||
        !Object.is(stored.playerMaxHp, playerMaxHp) ||
        !Object.is(stored.playerMp, playerMp) ||
        !Object.is(stored.playerMaxMp, playerMaxMp) ||
        !Object.is(stored.enemyHp, enemyHp) ||
        !Object.is(stored.enemyMaxHp, enemyMaxHp) ||
        stored.combatSubMenu !== combatSubMenu ||
        JSON.stringify(stored.opponents) !== JSON.stringify(opponents);
    }

    if (hasChanged) {
      onUpdateAdventure({
        ...adventure,
        combatState: currentCombatState
      });
    }
  }, [
    isCombatActive,
    selectedEnemyId,
    selectedEnemyIds,
    customEnemyName,
    opponents,
    playerHp,
    playerMaxHp,
    playerMp,
    playerMaxMp,
    enemyHp,
    enemyMaxHp,
    combatSubMenu,
    adventure,
    onUpdateAdventure
  ]);

  // Helfer für Gegner-Namen
  const getActiveEnemyName = () => {
    if (selectedEnemyId === 'custom') return customEnemyName || 'Widersacher';
    const npc = adventure.npcs.find(n => n.id === selectedEnemyId);
    return npc ? (npc.rufName || npc.name) : (customEnemyName || 'Widersacher');
  };

  // Check if an NPC is currently present / active in the story / history
  const isNpcCurrentlyPresent = (npc: NPC): boolean => {
    // If the NPC is the active combat target, they are obviously present
    if (isCombatActive && selectedEnemyId === npc.id) return true;

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const regex = new RegExp(`\\b${escapeRegExp(npc.name)}\\b`, 'i');

    // Check if the NPC is mentioned in the recent chat history
    if (!messages || messages.length === 0) {
      // Look in prologue
      const p = adventure.prologue || '';
      return regex.test(p);
    }

    // Combine the text of the last 6 messages (which represents the active scene/encounter)
    const recentMsgs = messages.slice(-6);
    const combinedText = recentMsgs.map(m => m.text || '').join(' ');
    
    // Also check the prologue and first message if there are few messages
    const prologueText = adventure.prologue || '';
    const firstMsgText = adventure.firstMessage || '';

    const isMentioned = regex.test(combinedText) || 
                       (messages.length <= 2 && (regex.test(prologueText) || regex.test(firstMsgText)));

    return isMentioned;
  };

  // Erkennt anwesende Gegner und feindliche Gruppen aus den jüngsten Chat-Ereignissen
  const detectedEnemies = React.useMemo(() => {
    const presentList: { id: string; name: string; type: 'npc' | 'group' | 'dynamic'; subtitle?: string }[] = [];
    const addedNames = new Set<string>();

    if (!messages || messages.length === 0) return presentList;

    // We scan the recent 6 messages for any mentioned characters/factions in our Codex
    const recentMsgs = messages.slice(-6);
    const originalCombinedText = recentMsgs.map(m => m.text || '').join(' ');

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // 1. Check all characters in Codex
    const codexChars = (adventure.loreDatabase || []).filter(item => item.category === 'Charaktere');
    codexChars.forEach(char => {
      const lowerTitle = char.title.toLowerCase();
      // Exclude player name
      if (adventure.player?.name && lowerTitle === adventure.player.name.toLowerCase()) return;

      const regex = new RegExp(`\\b${escapeRegExp(char.title)}\\b`, 'i');
      if (regex.test(originalCombinedText)) {
        // Find corresponding NPC in adventure.npcs
        const npc = (adventure.npcs || []).find(n => n.name.toLowerCase() === lowerTitle);
        presentList.push({
          id: char.id || npc?.id || `detected-char-${lowerTitle}`,
          name: char.title,
          type: 'npc',
          subtitle: char.details?.role || npc?.role || (npc?.isHostile || char.details?.isHostile ? 'Feind' : 'Charakter')
        });
        addedNames.add(lowerTitle);
      }
    });

    // 2. Check all factions in Codex
    const codexFactions = (adventure.loreDatabase || []).filter(item => item.category === 'Fraktionen');
    codexFactions.forEach(frac => {
      const lowerTitle = frac.title.toLowerCase();
      const regex = new RegExp(`\\b${escapeRegExp(frac.title)}\\b`, 'i');
      if (regex.test(originalCombinedText)) {
        presentList.push({
          id: frac.id || `detected-frac-${lowerTitle}`,
          name: frac.title,
          type: 'group',
          subtitle: 'Erkannte Fraktion / Gruppe'
        });
        addedNames.add(lowerTitle);
      }
    });

    return presentList;
  }, [adventure.npcs, adventure.loreDatabase, messages]);

  // Helfer für Fähigkeiten des Spielers
  const getCustomResourceNames = (): string[] => {
    const resourcesSet = new Set<string>();
    
    // 1. Look at campaignPowerSettings supernatural/physical or all categories
    if (adventure?.world?.campaignPowerSettings) {
      Object.entries(adventure.world.campaignPowerSettings).forEach(([key, val]) => {
        // Any parameter that is supernatural or not physical, or matches common resource keywords
        const isPhysical = typeof val === 'object' && (val as any).category === 'physical';
        const lowerKey = key.toLowerCase();
        const matchesResourceWord = [
          'mana', 'mp', 'chakra', 'energie', 'energy', 'ausdauer', 'stamina', 'fokus', 
          'focus', 'zorn', 'rage', 'wut', 'ki', 'chi', 'prana', 'spirit', 'seele', 
          'magie', 'magic', 'willenskraft', 'willpower', 'psi', 'kraft', 'power', 'schwertenergie'
        ].some(kw => lowerKey.includes(kw));
        
        if (!isPhysical || matchesResourceWord) {
          resourcesSet.add(key);
        }
      });
    }

    // 2. Look at player's abilities costs / power source fields to find any custom cost name that matches campaign parameters
    if (adventure?.player?.abilities) {
      adventure.player.abilities.forEach(ability => {
        const costStr = (ability.cost || '').trim();
        const sourceStr = (ability.source || '').trim();
        
        if (adventure?.world?.campaignPowerSettings) {
          Object.keys(adventure.world.campaignPowerSettings).forEach(key => {
            if (costStr.toLowerCase().includes(key.toLowerCase()) || sourceStr.toLowerCase().includes(key.toLowerCase())) {
              resourcesSet.add(key);
            }
          });
        }
      });
    }

    return Array.from(resourcesSet);
  };
  
  const getPlayerAbilitiesFormat = () => {
    let parts = [];
    if (adventure.player.powerSource || adventure.player.skills || adventure.player.techniques) {
      parts.push(`[Kraft] Quelle: ${adventure.player.powerSource || 'Keine'}, Fähigkeiten: ${adventure.player.skills || 'Keine'}, Techniken: ${adventure.player.techniques || 'Angriff'}`);
    }
    if (adventure.player.abilities && adventure.player.abilities.length > 0) {
      adventure.player.abilities.forEach((a, i) => {
        parts.push(`[Kraft ${i+1}] Quelle: ${a.source || 'Unbekannt'}, Kosten: ${a.cost || 'Keine'}, Detail: ${a.description || 'Keine'}, Techniken: ${a.techniques || 'Keine'}`);
      });
    }
    if (parts.length === 0) return 'Keine speziellen Kräfte';
    return parts.join(' | ');
  };

  const getPlayerSkillsList = (): string[] => {
    let allTechniques: string[] = [];
    
    // Legacy support
    if (adventure.player.techniques && adventure.player.techniques.trim().length > 0) {
      allTechniques = [...allTechniques, ...adventure.player.techniques.split(/[,\n;]/).map(s => s.trim())];
    } else if (adventure.player.skills && adventure.player.skills.trim().length > 0) {
      allTechniques = [...allTechniques, ...adventure.player.skills.split(/[,\n;]/).map(s => s.trim())];
    }

    // New abilities support
    if (adventure.player.abilities && adventure.player.abilities.length > 0) {
      adventure.player.abilities.forEach(ability => {
        if (ability.techniques && ability.techniques.trim().length > 0) {
          allTechniques = [...allTechniques, ...ability.techniques.split(/[,\n;]/).map(s => s.trim())];
        }
      });
    }

    return allTechniques.filter(s => s.length > 0);
  };

  const getPlayerDetailedSkillsList = (): { 
    name: string; 
    description?: string; 
    source?: string; 
    cost?: string; 
    type?: string; 
    subtype?: string;
    level?: number;
    xp?: number;
    maxLevel?: number;
    xpNeeded?: number;
  }[] => {
    let list: { 
      name: string; 
      description?: string; 
      source?: string; 
      cost?: string; 
      type?: string; 
      subtype?: string;
      level?: number;
      xp?: number;
      maxLevel?: number;
      xpNeeded?: number;
    }[] = [];
    
    // Check if we have abilities
    const hasAbilities = adventure.player.abilities && adventure.player.abilities.length > 0;

    if (hasAbilities) {
      adventure.player.abilities.forEach(ability => {
        if (ability.techniqueList && ability.techniqueList.length > 0) {
          ability.techniqueList.forEach(t => {
            if (t.name && t.name.trim().length > 0) {
              list.push({ 
                name: t.name.trim(), 
                description: t.description,
                source: ability.source,
                cost: ability.cost,
                type: t.type,
                subtype: t.subtype,
                level: t.level || 1,
                xp: t.xp || 0,
                maxLevel: t.maxLevel || 10,
                xpNeeded: t.xpNeeded || 100
              });
            }
          });
        } else if (ability.techniques && ability.techniques.trim().length > 0) {
          // Fallback to ability-level comma strings only if there is no structured list for this specific ability
          ability.techniques.split(/[,\n;]/).map(s => s.trim()).filter(Boolean).forEach(name => {
            let guessedType: 'Angriff' | 'Transformation' | 'Verteidigung' | 'Support' = 'Angriff';
            const lower = name.toLowerCase();
            if (lower.includes('heil') || lower.includes('regen') || lower.includes('buff') || lower.includes('medizin') || lower.includes('support')) {
              guessedType = 'Support';
            } else if (lower.includes('schild') || lower.includes('abwehr') || lower.includes('barriere') || lower.includes('block') || lower.includes('verteidigung') || lower.includes('schutz')) {
              guessedType = 'Verteidigung';
            } else if (lower.includes('transform') || lower.includes('gestalt') || lower.includes('form') || lower.includes('modus') || lower.includes('frucht')) {
              guessedType = 'Transformation';
            }
            list.push({ name, source: ability.source, cost: ability.cost, type: guessedType, level: 1 });
          });
        }
      });
    } else {
      // 2. Fallback to top-level ONLY if we don't have any abilities at all
      const addedNames = new Set<string>();
      const addLegacy = (txt: string, source?: string, cost?: string) => {
        txt.split(/[,\n;]/).map(s => s.trim()).filter(Boolean).forEach(name => {
          if (!addedNames.has(name.toLowerCase())) {
            let guessedType: 'Angriff' | 'Transformation' | 'Verteidigung' | 'Support' = 'Angriff';
            const lower = name.toLowerCase();
            if (lower.includes('heil') || lower.includes('regen') || lower.includes('buff') || lower.includes('medizin') || lower.includes('support')) {
              guessedType = 'Support';
            } else if (lower.includes('schild') || lower.includes('abwehr') || lower.includes('barriere') || lower.includes('block') || lower.includes('verteidigung') || lower.includes('schutz')) {
              guessedType = 'Verteidigung';
            } else if (lower.includes('transform') || lower.includes('gestalt') || lower.includes('form') || lower.includes('modus') || lower.includes('frucht')) {
              guessedType = 'Transformation';
            }
            list.push({ name, source, cost, type: guessedType, level: 1 });
            addedNames.add(name.toLowerCase());
          }
        });
      };

      if (adventure.player.techniques && adventure.player.techniques.trim().length > 0) {
        addLegacy(adventure.player.techniques, adventure.player.powerSource, adventure.player.powerCost);
      } else if (adventure.player.skills && adventure.player.skills.trim().length > 0) {
        addLegacy(adventure.player.skills, adventure.player.powerSource, adventure.player.powerCost);
      }
    }

    return list;
  };
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current || (document.getElementById('combat-input-field') as HTMLInputElement | null);
    if (!textarea) {
      setInputText(prev => prev + prefix + suffix);
      return;
    }

    const start = textarea.selectionStart ?? inputText.length;
    const end = textarea.selectionEnd ?? inputText.length;
    const currentText = inputText;

    const before = currentText.substring(0, start);
    const selected = currentText.substring(start, end);
    const after = currentText.substring(end);

    const newText = before + prefix + selected + suffix + after;
    setInputText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  // Sync messages if adventure changes from outside
  useEffect(() => {
    if (adventure.chatHistory && adventure.chatHistory.length > 0) {
      setMessages(adventure.chatHistory);
    } else {
      const initialMsgs: ChatMessage[] = [
        {
          id: 'prologue-msg',
          role: 'model',
          text: adventure.prologue || 'Die Reise beginnt...'
        }
      ];
      if (adventure.firstMessage) {
        initialMsgs.push({
          id: 'first-msg',
          role: 'model',
          text: adventure.firstMessage
        });
      }
      setMessages(initialMsgs);
    }
  }, [adventure.id, adventure.chatHistory, adventure.firstMessage, adventure.prologue]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (loreNotifications.length > 0) {
      const timer = setTimeout(() => {
        setLoreNotifications(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loreNotifications]);

  // Automatischer Scanner, der neu erwähnte Charaktere und Fraktionen registriert
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    let hasChanges = false;
    const updatedLore = [...(adventure.loreDatabase || [])];
    const updatedNpcs = [...(adventure.npcs || [])];
    const notifications: any[] = [];

    // Wir verbinden den Text der letzten 6 Nachrichten für das Scanning
    const recentMsgs = messages.slice(-6);
    const combinedText = recentMsgs.map(m => m.text || '').join(' ');

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // Helper für Ähnlichkeitsvergleich zur Vermeidung von Duplikaten (z.B. "Marine" vs "Die Marine")
    const isSimilarTitle = (t1: string, t2: string): boolean => {
      const clean = (s: string) => {
        return s.toLowerCase()
          .replace(/^(die|der|das|the|ein|eine)\s+/g, '') // Artikel entfernen
          .replace(/[^a-zäöüß0-9]/g, '') // Nur alphanumerische Zeichen behalten
          .trim();
      };
      const c1 = clean(t1);
      const c2 = clean(t2);
      if (!c1 || !c2) return false;
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };

    // Helper zur Bereinigung von überlangen gematchen Namen (Satzenden oder Pronomen ausschließen)
    const cleanMatchedName = (fullName: string): string => {
      const parts = fullName.split(/\s+/);
      const filteredParts: string[] = [];
      const exclusions = new Set([
        'Ich', 'Du', 'Er', 'Sie', 'Wir', 'Ihr', 'Es', 'Der', 'Die', 'Das', 'Ein', 'Eine', 
        'Einer', 'Eines', 'Einem', 'Einen', 'Und', 'Aber', 'Oder', 'Wenn', 'Weil', 'Dass', 
        'Ob', 'Wie', 'Wo', 'Wer', 'Was', 'Wann', 'Warum', 'Hier', 'Da', 'Dort', 'Dann', 
        'Nun', 'Nur', 'Auch', 'Noch', 'Schon', 'Sehr', 'Mehr', 'Ganz', 'Viel', 'Wenig', 
        'Gut', 'Besser', 'Schnell', 'Langsam', 'Groß', 'Klein', 'Neu', 'Alt', 'Jung', 
        'Spät', 'Früh', 'In', 'Auf', 'Zu', 'Mit', 'Von', 'Im', 'Am', 'Um', 'Bei', 'Nach', 
        'Vor', 'Über', 'Unter', 'Aus', 'Für', 'Gegen', 'Ohne', 'Wegen', 'Während', 'Als', 
        'Wie', 'So', 'Ja', 'Nein', 'Doch', 'Sehr', 'Sich', 'Mich', 'Dich', 'Uns', 'Euch', 
        'Mein', 'Dein', 'Sein', 'Ihr', 'Unser', 'Euer', 'Kein', 'Alle', 'Viele', 'Einige',
        'Andere', 'Anderen', 'Anderer', 'Anderes', 'Man', 'Jemand', 'Niemand', 'Etwas', 'Nichts'
      ]);
      
      for (const part of parts) {
        if (exclusions.has(part)) {
          break; // Stop beim ersten Pronomen/Satzanfangswort
        }
        filteredParts.push(part);
      }
      return filteredParts.join(' ').trim();
    };

    // Franchise-Erkennung auf Basis der Weltenbeschreibung, des Titels und der Epoche
    const worldTitle = (adventure.world?.title || '').toLowerCase();
    const worldDesc = (adventure.world?.description || '').toLowerCase();
    const worldEra = (adventure.world?.era || '').toLowerCase();

    const isOnePieceWorld = worldTitle.includes('one piece') || 
                            worldDesc.includes('one piece') || 
                            worldTitle.includes('strohhut') || 
                            worldDesc.includes('strohhut') ||
                            worldDesc.includes('grandline') ||
                            worldDesc.includes('marine') ||
                            worldDesc.includes('teufelsfrucht') ||
                            worldEra.includes('one piece') ||
                            worldEra.includes('pirat');

    const isNarutoWorld = worldTitle.includes('naruto') || 
                          worldDesc.includes('naruto') || 
                          worldDesc.includes('shinobi') || 
                          worldDesc.includes('ninja') || 
                          worldDesc.includes('konoha') || 
                          worldDesc.includes('jutsu') || 
                          worldDesc.includes('chakra');

    const isDragonBallWorld = worldTitle.includes('dragon ball') || 
                              worldDesc.includes('dragon ball') || 
                              worldDesc.includes('saiyajin') || 
                              worldDesc.includes('goku') || 
                              worldDesc.includes('vegeta');

    // 1. Scan nach Charakteren in STATUS-Blöcken (z.B., [[STATUS: Akainu_hp=100]])
    const statusHpRegex = /\[\[STATUS:\s*(.*?)\]\]/gi;
    let hpMatch;
    while ((hpMatch = statusHpRegex.exec(combinedText)) !== null) {
      const inner = hpMatch[1];
      const pairs = inner.split(/\s*[,|]\s*(?=[a-zA-ZäöüÄÖÜß_0-9\s-]+\s*=)/);
      for (const pair of pairs) {
        const eq = pair.indexOf('=');
        if (eq > 0) {
          const key = pair.substring(0, eq).trim();
          if (key.toLowerCase().endsWith('_hp')) {
            const name = key.replace(/_hp$/i, '').replace(/_/g, ' ').trim();
            const lowerName = name.toLowerCase();
            if (name && lowerName !== 'spieler' && lowerName !== 'gegner' && name.length >= 3) {
              const exists = updatedLore.some(e => e.category === 'Charaktere' && isSimilarTitle(e.title, name));
              if (!exists) {
                const newId = 'dyn-char-' + lowerName.replace(/\s+/g, '-');
                updatedLore.push({
                  id: newId,
                  category: 'Charaktere',
                  title: name,
                  description: 'Ein im Verlauf der Geschichte entdeckter Charakter.',
                  isUnlocked: true,
                  details: {
                    role: 'Charakter',
                    isHostile: lowerName === 'akainu' || lowerName.includes('admiral') || lowerName.includes('feind')
                  }
                } as any);

                updatedNpcs.push({
                  id: newId,
                  name: name,
                  isHostile: lowerName === 'akainu' || lowerName.includes('admiral') || lowerName.includes('feind'),
                  role: 'Charakter',
                  bio: 'Ein im Verlauf der Geschichte entdeckter Charakter.',
                  goal: 'Unbekannt',
                  personality: 'Unbekannt',
                  currentSituation: 'Anwesend',
                  appearance: {
                    hairColor: '',
                    eyeColor: '',
                    age: '',
                    build: '',
                    gender: ''
                  },
                  campaignPowerLevels: {},
                  attributes: []
                });

                notifications.push({
                  id: Math.random().toString(),
                  type: 'add',
                  title: name,
                  category: 'Charaktere'
                });
                hasChanges = true;
              }
            }
          }
        }
      }
    }

    // 2. Scan nach Fraktionen in STATUS-Blöcken (z.B., [[STATUS: Marine-Soldaten_count=20]])
    const statusCountRegex = /\[\[STATUS:\s*(.*?)\]\]/gi;
    let countMatch;
    while ((countMatch = statusCountRegex.exec(combinedText)) !== null) {
      const inner = countMatch[1];
      const pairs = inner.split(/\s*[,|]\s*(?=[a-zA-ZäöüÄÖÜß_0-9\s-]+\s*=)/);
      for (const pair of pairs) {
        const eq = pair.indexOf('=');
        if (eq > 0) {
          const key = pair.substring(0, eq).trim();
          if (key.toLowerCase().endsWith('_count')) {
            const name = key.replace(/_count$/i, '').replace(/_/g, ' ').trim();
            const lowerName = name.toLowerCase();
            if (name && lowerName !== 'spieler' && lowerName !== 'gegner' && name.length >= 3) {
              const exists = updatedLore.some(e => e.category === 'Fraktionen' && isSimilarTitle(e.title, name));
              if (!exists) {
                const newId = 'dyn-frac-' + lowerName.replace(/\s+/g, '-');
                updatedLore.push({
                  id: newId,
                  category: 'Fraktionen',
                  title: name,
                  description: 'Eine im Verlauf der Geschichte entdeckte Fraktion oder Gruppierung.',
                  isUnlocked: true,
                  details: {
                    isHostile: true
                  }
                } as any);

                notifications.push({
                  id: Math.random().toString(),
                  type: 'add',
                  title: name,
                  category: 'Fraktionen'
                });
                hasChanges = true;
              }
            }
          }
        }
      }
    }

    // 3. Scan nach Charakteren über Titel-Präfixe (z.B. "Admiral Akainu")
    // Wir nutzen Wortgrenzen (\b) und schließen die Case-Insensitivity-Flag aus, um Kleingeschriebenes zu ignorieren.
    const prefixes = [
      'admiral', 'kapitän', 'captain', 'vizeadmiral', 'großadmiral', 'kaiser', 'shogun', 'meister', 'master',
      'lord', 'sir', 'lady', 'prinz', 'prinzessin', 'könig', 'königin', 'general', 'mister', 'miss', 'chef', 'boss',
      'herr', 'frau', 'anführer', 'vize', 'kommandant', 'kommandeur', 'priester', 'arzt', 'doktor', 'agent',
      'vater', 'mutter', 'bruder', 'schwester', 'onkel', 'tante', 'kaiserin', 'bischof', 'senator', 'richter'
    ];
    const dualCasePrefixes = prefixes.flatMap(p => [p, p.charAt(0).toUpperCase() + p.slice(1)]);
    
    // Regexp fängt bis zu 3 großgeschriebene Wörter nach einem Präfix ein
    const titleRegex = new RegExp(`\\b(?:${dualCasePrefixes.join('|')})\\s+([A-ZÄÖÜ][a-zäöüß]+(?:\\s+[A-ZÄÖÜ][a-zäöüß]+){0,2})`, 'g');
    let tMatch;
    while ((tMatch = titleRegex.exec(combinedText)) !== null) {
      const rawName = tMatch[1];
      const name = cleanMatchedName(rawName);
      const lowerName = name.toLowerCase();
      const isPlayer = adventure.player?.name && lowerName === adventure.player.name.toLowerCase();
      
      if (name && name.length >= 3 && !isPlayer) {
        const exists = updatedLore.some(e => e.category === 'Charaktere' && isSimilarTitle(e.title, name));
        if (!exists) {
          const newId = 'dyn-char-' + lowerName.replace(/\s+/g, '-');
          updatedLore.push({
            id: newId,
            category: 'Charaktere',
            title: name,
            description: 'Ein im Verlauf der Geschichte entdeckter Charakter.',
            isUnlocked: true,
            details: {
              role: 'Charakter',
              isHostile: lowerName === 'akainu' || lowerName.includes('admiral') || lowerName.includes('feind')
            }
          } as any);

          updatedNpcs.push({
            id: newId,
            name: name,
            isHostile: lowerName === 'akainu' || lowerName.includes('admiral') || lowerName.includes('feind'),
            role: 'Charakter',
            bio: 'Ein im Verlauf der Geschichte entdeckter Charakter.',
            goal: 'Unbekannt',
            personality: 'Unbekannt',
            currentSituation: 'Anwesend',
            appearance: {
              hairColor: '',
              eyeColor: '',
              age: '',
              build: '',
              gender: ''
            },
            campaignPowerLevels: {},
            attributes: []
          });

          notifications.push({
            id: Math.random().toString(),
            type: 'add',
            title: name,
            category: 'Charaktere'
          });
          hasChanges = true;
        }
      }
    }

    // 4. Scan nach berühmten One Piece Charakteren (nur in One Piece Welten!)
    if (isOnePieceWorld) {
      const famousCharacters = [
        'Ruffy', 'Luffy', 'Zorro', 'Zoro', 'Nami', 'Sanji', 'Usopp', 'Lysop', 'Chopper', 'Robin', 'Franky', 'Brook', 'Jinbei',
        'Akainu', 'Kizaru', 'Aokiji', 'Fujitora', 'Ryokugyu', 'Sengoku', 'Garp', 'Smoker', 'Tashigi', 'Coby', 'Helmeppo',
        'Law', 'Kid', 'Kaido', 'Big Mom', 'Shanks', 'Teach', 'Blackbeard', 'Whitebeard', 'Ace', 'Sabo', 'Dragon', 'Crocodile',
        'Buggy', 'Mihawk', 'Doflamingo', 'Hancock', 'Kuma', 'Moria', 'Lucci', 'Kaku', 'Enel', 'Arlong', 'Krieg', 'Kuro',
        'Alvida', 'Uta', 'Yamato', 'Roger', 'Rayleigh', 'Oden', 'Momonosuke', 'Kinemon', 'Kuzan', 'Borsalino', 'Sakazuki',
        'Ivankov', 'Boa Hancock'
      ];
      famousCharacters.forEach(name => {
        const lowerName = name.toLowerCase();
        const isPlayer = adventure.player?.name && lowerName === adventure.player.name.toLowerCase();
        if (!isPlayer) {
          const boundaryRegex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
          if (boundaryRegex.test(combinedText)) {
            const exists = updatedLore.some(e => e.category === 'Charaktere' && isSimilarTitle(e.title, name));
            if (!exists) {
              const newId = 'dyn-char-' + lowerName.replace(/\s+/g, '-');
              updatedLore.push({
                id: newId,
                category: 'Charaktere',
                title: name,
                description: 'Ein im Verlauf der Geschichte entdeckter Charakter.',
                isUnlocked: true,
                details: {
                  role: 'Charakter',
                  isHostile: lowerName === 'akainu' || lowerName.includes('admiral') || lowerName.includes('feind')
                }
              } as any);

              updatedNpcs.push({
                id: newId,
                name: name,
                isHostile: lowerName === 'akainu' || lowerName.includes('admiral') || lowerName.includes('feind'),
                role: 'Charakter',
                bio: 'Ein im Verlauf der Geschichte entdeckter Charakter.',
                goal: 'Unbekannt',
                personality: 'Unbekannt',
                currentSituation: 'Anwesend',
                appearance: {
                  hairColor: '',
                  eyeColor: '',
                  age: '',
                  build: '',
                  gender: ''
                },
                campaignPowerLevels: {},
                attributes: []
              });

              notifications.push({
                id: Math.random().toString(),
                type: 'add',
                title: name,
                category: 'Charaktere'
              });
              hasChanges = true;
            }
          }
        }
      });
    }

    // 5. Scan nach berühmten Naruto Charakteren (nur in Naruto Welten!)
    if (isNarutoWorld) {
      const narutoCharacters = [
        'Naruto', 'Sasuke', 'Sakura', 'Kakashi', 'Hinata', 'Shikamaru', 'Ino', 'Choji', 'Kiba', 'Shino', 'Neji', 'Tenten', 
        'Rock Lee', 'Gaara', 'Temari', 'Kankuro', 'Jiraiya', 'Tsunade', 'Orochimaru', 'Itachi', 'Kisame', 'Deidara', 'Sasori', 
        'Hidan', 'Kakuzu', 'Pain', 'Konan', 'Obito', 'Madara', 'Minato', 'Kushina', 'Hashirama', 'Tobirama', 'Hiruzen', 'Kurama'
      ];
      narutoCharacters.forEach(name => {
        const lowerName = name.toLowerCase();
        const isPlayer = adventure.player?.name && lowerName === adventure.player.name.toLowerCase();
        if (!isPlayer) {
          const boundaryRegex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
          if (boundaryRegex.test(combinedText)) {
            const exists = updatedLore.some(e => e.category === 'Charaktere' && isSimilarTitle(e.title, name));
            if (!exists) {
              const newId = 'dyn-char-' + lowerName;
              updatedLore.push({
                id: newId,
                category: 'Charaktere',
                title: name,
                description: 'Ein im Verlauf der Geschichte entdeckter Shinobi.',
                isUnlocked: true,
                details: {
                  role: 'Ninja'
                }
              } as any);

              updatedNpcs.push({
                id: newId,
                name: name,
                isHostile: lowerName === 'madara' || lowerName === 'orochimaru' || lowerName === 'itachi',
                role: 'Ninja',
                bio: 'Ein im Verlauf der Geschichte entdeckter Shinobi.',
                goal: 'Unbekannt',
                personality: 'Unbekannt',
                currentSituation: 'Anwesend',
                appearance: {
                  hairColor: '',
                  eyeColor: '',
                  age: '',
                  build: '',
                  gender: ''
                },
                campaignPowerLevels: {},
                attributes: []
              });

              notifications.push({
                id: Math.random().toString(),
                type: 'add',
                title: name,
                category: 'Charaktere'
              });
              hasChanges = true;
            }
          }
        }
      });
    }

    // 6. Scan nach berühmten Dragon Ball Charakteren (nur in Dragon Ball Welten!)
    if (isDragonBallWorld) {
      const dbCharacters = [
        'Goku', 'Son Goku', 'Vegeta', 'Gohan', 'Piccolo', 'Kuririn', 'Krillin', 'Bulma', 'Trunks', 'Goten', 'Freezer', 'Frieza', 
        'Cell', 'Boo', 'Majin Buu', 'Beerus', 'Whis', 'Broly', 'Muten Roshi', 'Yamchu', 'Tenshinhan'
      ];
      dbCharacters.forEach(name => {
        const lowerName = name.toLowerCase();
        const isPlayer = adventure.player?.name && lowerName === adventure.player.name.toLowerCase();
        if (!isPlayer) {
          const boundaryRegex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
          if (boundaryRegex.test(combinedText)) {
            const exists = updatedLore.some(e => e.category === 'Charaktere' && isSimilarTitle(e.title, name));
            if (!exists) {
              const newId = 'dyn-char-' + lowerName;
              updatedLore.push({
                id: newId,
                category: 'Charaktere',
                title: name,
                description: 'Ein im Verlauf der Geschichte entdeckter Krieger.',
                isUnlocked: true,
                details: {
                  role: 'Kämpfer'
                }
              } as any);

              updatedNpcs.push({
                id: newId,
                name: name,
                isHostile: lowerName === 'freezer' || lowerName === 'frieza' || lowerName === 'cell',
                role: 'Kämpfer',
                bio: 'Ein im Verlauf der Geschichte entdeckter Krieger.',
                goal: 'Unbekannt',
                personality: 'Unbekannt',
                currentSituation: 'Anwesend',
                appearance: {
                  hairColor: '',
                  eyeColor: '',
                  age: '',
                  build: '',
                  gender: ''
                },
                campaignPowerLevels: {},
                attributes: []
              });

              notifications.push({
                id: Math.random().toString(),
                type: 'add',
                title: name,
                category: 'Charaktere'
              });
              hasChanges = true;
            }
          }
        }
      });
    }

    // 7. Scan nach bekannten Fraktionen direkt (nur in dazu passenden Welten!)
    if (isOnePieceWorld) {
      const famousFactions = [
        'Marine', 'Weltregierung', 'Revolutionäre', 'Strohhutbande', 'Cipher Pol', 'CP9', 'CP0', 'Baroque Firma',
        'Piraten', 'Banditen', 'Rebellen', 'Buster Call', 'Whitebeard-Piraten', 'Beast-Piraten', 'Big-Mom-Piraten',
        'Rote-Haar-Piraten', 'Kaiser-Crew', 'Donquixote-Familie', 'Cross Guild', 'Arlong-Bande', 'Krieg-Piratenbande'
      ];
      famousFactions.forEach(name => {
        const lowerName = name.toLowerCase();
        const boundaryRegex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
        if (boundaryRegex.test(combinedText)) {
          const exists = updatedLore.some(e => e.category === 'Fraktionen' && isSimilarTitle(e.title, name));
          if (!exists) {
            const newId = 'dyn-frac-' + lowerName;
            updatedLore.push({
              id: newId,
              category: 'Fraktionen',
              title: name,
              description: 'Eine im Verlauf der Geschichte entdeckte Fraktion oder Gruppierung.',
              isUnlocked: true,
              details: {
                isHostile: true
              }
            } as any);

            notifications.push({
              id: Math.random().toString(),
              type: 'add',
              title: name,
              category: 'Fraktionen'
            });
            hasChanges = true;
          }
        }
      });
    } else if (isNarutoWorld) {
      const famousFactions = [
        'Akatsuki', 'Konoha', 'Sunagakure', 'Kirigakure', 'Kumogakure', 'Iwagakure', 'Anbu'
      ];
      famousFactions.forEach(name => {
        const lowerName = name.toLowerCase();
        const boundaryRegex = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');
        if (boundaryRegex.test(combinedText)) {
          const exists = updatedLore.some(e => e.category === 'Fraktionen' && isSimilarTitle(e.title, name));
          if (!exists) {
            const newId = 'dyn-frac-' + lowerName;
            updatedLore.push({
              id: newId,
              category: 'Fraktionen',
              title: name,
              description: 'Eine Shinobi-Fraktion oder Gruppierung.',
              isUnlocked: true,
              details: {
                isHostile: false
              }
            } as any);

            notifications.push({
              id: Math.random().toString(),
              type: 'add',
              title: name,
              category: 'Fraktionen'
            });
            hasChanges = true;
          }
        }
      });
    }

    if (hasChanges) {
      if (notifications.length > 0) {
        setLoreNotifications(prev => [...prev, ...notifications]);
      }
      onUpdateAdventure({
        ...adventure,
        loreDatabase: updatedLore,
        npcs: updatedNpcs
      });
    }
  }, [messages, adventure.id]);

  const parseLoreAndCharUpdates = (text: string, currentAdventure: Adventure, forceHp?: number, forceMp?: number) => {
    let updatedLore = [...(currentAdventure.loreDatabase || [])];
    let updatedNpcs = [...(currentAdventure.npcs || [])];
    let updatedPlayer = { 
      ...currentAdventure.player, 
      appearance: { ...currentAdventure.player.appearance }, 
      campaignPowerLevels: { ...(currentAdventure.player.campaignPowerLevels || {}) } 
    };
    let updatedStructuredInventory = currentAdventure.structuredInventory 
      ? JSON.parse(JSON.stringify(currentAdventure.structuredInventory)) 
      : { armor: {}, accessories: {}, weapons: [], generalItems: [], money: 0, currencyLabel: 'Goldstücke' };
    let cleanedText = text;
    let notifications: any[] = [];

    const isNameMatch = (existingName: string | undefined, existingNickname: string | undefined, incomingName: string | undefined) => {
      if (!existingName || !incomingName) return false;
      
      // Clean function to remove titles, parentheses, extra spaces, and common honorifics/prefixes
      const clean = (s: string) => s.trim().toLowerCase()
        .replace(/\s*\([^)]*\)/g, '') // remove anything in parentheses
        .replace(/^(sir|mr\.|mr|ms\.|ms|captain|kapitän|admiral|vizeadmiral|vize-admiral|yonko|kaiser|shichibukai|samurai)\s+/i, ''); // remove common prefixes
        
      const extClean = clean(existingName);
      const incClean = clean(incomingName);
      if (!extClean || !incClean) return false;
      
      if (extClean === incClean) return true;
      
      // 1. Check direct nickname list if available
      if (existingNickname) {
        const nickClean = clean(existingNickname);
        if (nickClean === incClean) return true;
        
        // Also support comma/slash/semicolon/pipe separated nicknames
        const nicknamesList = existingNickname.split(/[,/;|]+/).map(n => clean(n)).filter(Boolean);
        if (nicknamesList.includes(incClean)) return true;
      }
      
      // 2. Look up in predefined high-fidelity alias dictionary (bi-directional mapping)
      const ALIAS_GROUPS = [
        ['sakazuki', 'akainu', 'roter hund', 'red dog'],
        ['kuzan', 'aokiji', 'blauer fasan', 'blue pheasant'],
        ['borsalino', 'kizaru', 'gelber affe', 'yellow monkey'],
        ['issho', 'fujitora', 'lila tiger', 'wisteria tiger'],
        ['aramaki', 'ryokugyu', 'grüner stier', 'green bull'],
        ['luffy', 'ruffy', 'monkey d. luffy', 'monkey d ruffy', 'strohhut', 'mugiwara', 'straw hat'],
        ['zoro', 'zorro', 'roronoa zoro', 'roronoa zorro', 'piratenjäger', 'pirate hunter'],
        ['usopp', 'lysop', 'sogeking', 'gott usopp', 'god usopp'],
        ['sanji', 'vinsmoke sanji', 'schwarzfuß', 'black leg'],
        ['robin', 'nico robin', 'teufelsmädchen', 'devil child'],
        ['chopper', 'tony tony chopper', 'candy lover'],
        ['brook', 'soul king'],
        ['jinbe', 'jimbei', 'ritter des meeres', 'knight of the sea'],
        ['teach', 'marshall d. teach', 'marshall d teach', 'blackbeard', 'schwarzbart'],
        ['newgate', 'edward newgate', 'whitebeard', 'weißbart', 'shirohige'],
        ['doflamingo', 'donquixote doflamingo', 'joker', 'mingo'],
        ['mihawk', 'dracule mihawk', 'falkenauge', 'hawkeye'],
        ['hancock', 'boa hancock', 'piratenkaiserin', 'snake princess'],
        ['kuma', 'bartholomew kuma', 'tyrann'],
        ['moria', 'gecko moria'],
        ['linlin', 'charlotte linlin', 'big mom', 'bigmom'],
        ['law', 'trafalgar law', 'trafalgar d. water law', 'trafalgar d water law', 'tora-o', 'surgeon of death'],
        ['kid', 'kidd', 'eustass kid', 'eustass kidd'],
        ['rayleigh', 'silvers rayleigh', 'dunkler könig', 'dark king'],
        ['obito', 'tobi', 'obito uchiha'],
        ['madara', 'madara uchiha'],
        ['kakashi', 'kakashi hatake', 'kopier-ninja'],
        ['naruto', 'naruto uzumaki'],
        ['sasuke', 'sasuke uchiha'],
        ['minato', 'minato namikaze', 'gelber blitz'],
        ['jiraiya', 'kröten-eremit', 'ero-sennin'],
        ['tsunade', 'fünfter hokage', 'prinzessin tsunade']
      ];

      for (const group of ALIAS_GROUPS) {
        const matchesExt = group.some(alias => 
          extClean.includes(alias) || alias.includes(extClean) ||
          (existingNickname && clean(existingNickname).includes(alias))
        );
        const matchesInc = group.some(alias => 
          incClean.includes(alias) || alias.includes(incClean)
        );
        if (matchesExt && matchesInc) {
          return true;
        }
      }

      // 3. Smart fallback: if one is a non-trivial substring of another (e.g. "Doflamingo" in "Donquixote Doflamingo")
      const ignoreWords = ['d.', 'd', 'von', 'der', 'die', 'das', 'the', 'of', 'sir', 'mr', 'captain', 'kapitän', 'don'];
      const extWords = extClean.split(/\s+/).filter(w => w.length > 2 && !ignoreWords.includes(w));
      const incWords = incClean.split(/\s+/).filter(w => w.length > 2 && !ignoreWords.includes(w));
      
      for (const extW of extWords) {
        for (const incW of incWords) {
          if (extW === incW) return true;
        }
      }

      return false;
    };

    const isPlayerMatch = (incomingName: string | undefined) => {
      if (!incomingName) return false;
      const incLower = incomingName.trim().toLowerCase();
      return (
        incLower === 'spieler' ||
        incLower === 'player' ||
        isNameMatch(updatedPlayer.name, updatedPlayer.nickname, incomingName)
      );
    };

    // Parse LORE_ADD: [[LORE_ADD: Kategorie | Titel | Beschreibung]]
    const addRegex = /\[\[LORE_ADD:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/g;
    let addMatch;
    while ((addMatch = addRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(addMatch[0], '');
      const rawCategory = addMatch[1].trim();
      const title = addMatch[2].trim();
      const description = addMatch[3].trim();

      let category = 'Weltregeln';
      const catLower = rawCategory.toLowerCase();
      if (catLower.includes('ort')) category = 'Orte';
      else if (catLower.includes('gegner') || catLower.includes('feind') || catLower.includes('monster') || catLower.includes('boss')) category = 'Gegner';
      else if (catLower.includes('char') || catLower.includes('person')) category = 'Charaktere';
      else if (catLower.includes('frakt') || catLower.includes('gild') || catLower.includes('bünd')) category = 'Fraktionen';
      else if (catLower.includes('gegen') || catLower.includes('waff') || catLower.includes('item') || catLower.includes('objekt')) category = 'Gegenstände';
      else if (catLower.includes('fähig') || catLower.includes('kraft') || catLower.includes('magie') || catLower.includes('jutsu')) category = 'Fähigkeiten';
      else if (catLower.includes('event') || catLower.includes('ereignis')) category = 'Events';
      else if (catLower.includes('regel') || catLower.includes('gesetz')) category = 'Weltregeln';

      let existsIdx = -1;
      if (category === 'Charaktere' || category === 'Gegner') {
        existsIdx = updatedLore.findIndex(e => (e.category === 'Charaktere' || e.category === 'Gegner') && isNameMatch(e.title, e.details?.nickname, title));
      } else {
        existsIdx = updatedLore.findIndex(e => e.title.toLowerCase() === title.toLowerCase() && e.category === category);
      }

      if (existsIdx === -1) {
        const newEntry = {
          id: 'dyn-' + Math.random().toString(36).substr(2, 9),
          category,
          title,
          description,
          isUnlocked: true,
          details: {}
        };
        updatedLore.push(newEntry as any);
        notifications.push({
          id: Math.random().toString(),
          type: 'add',
          title,
          category
        });
      }
    }

    // Parse LORE_UNLOCK: [[LORE_UNLOCK: Titel]]
    const unlockRegex = /\[\[LORE_UNLOCK:\s*([^\]]+)\]\]/g;
    let unlockMatch;
    while ((unlockMatch = unlockRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(unlockMatch[0], '');
      const titleToUnlock = unlockMatch[1].trim();

      const idx = updatedLore.findIndex(e => {
        if (e.category === 'Charaktere') {
          return isNameMatch(e.title, e.details?.nickname, titleToUnlock);
        }
        return e.title.toLowerCase() === titleToUnlock.toLowerCase();
      });

      if (idx !== -1) {
        if (!updatedLore[idx].isUnlocked) {
          updatedLore[idx] = { ...updatedLore[idx], isUnlocked: true };
          notifications.push({
            id: Math.random().toString(),
            type: 'unlock',
            title: updatedLore[idx].title,
            category: updatedLore[idx].category
          });
        }
      }
    }

    // Parse RELATIONSHIP: [[RELATIONSHIP: NameA | NameB | Typ | Verhalten]]
    const relRegex = /\[\[RELATIONSHIP:\s*([^|\]]+)\s*\|\s*([^|\]]+)\s*\|\s*([^|\]]+)\s*\|\s*([^\]]+)\]\]/g;
    let relMatch;
    while ((relMatch = relRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(relMatch[0], '');
      const charA = relMatch[1].trim();
      const charB = relMatch[2].trim();
      const relType = relMatch[3].trim();
      const relBehavior = relMatch[4].trim();

      const resolvedCharA = isPlayerMatch(charA) ? updatedPlayer.name : charA;
      const resolvedCharB = isPlayerMatch(charB) ? updatedPlayer.name : charB;

      const addRelationship = (charObj: any, isLore: boolean, targetName: string, typeVal: string, behaviorVal: string) => {
        if (isLore) {
          if (!charObj.details) charObj.details = {};
          if (!charObj.details.relationships || !Array.isArray(charObj.details.relationships)) {
            charObj.details.relationships = [];
          }
          const rels = charObj.details.relationships;
          const existingRelIdx = rels.findIndex((r: any) => r.targetCharacter?.trim().toLowerCase() === targetName.trim().toLowerCase());
          const newRel = {
            id: 'rel-' + Math.random().toString(36).substr(2, 9),
            targetCharacter: targetName,
            type: typeVal,
            behavior: behaviorVal,
            _isCustom: false
          };
          if (existingRelIdx > -1) {
            rels[existingRelIdx] = { ...rels[existingRelIdx], type: typeVal, behavior: behaviorVal };
          } else {
            rels.push(newRel);
          }
        } else {
          if (!charObj.relationships || !Array.isArray(charObj.relationships)) {
            charObj.relationships = [];
          }
          const rels = charObj.relationships;
          const existingRelIdx = rels.findIndex((r: any) => r.targetCharacter?.trim().toLowerCase() === targetName.trim().toLowerCase());
          const newRel = {
            id: 'rel-' + Math.random().toString(36).substr(2, 9),
            targetCharacter: targetName,
            type: typeVal,
            behavior: behaviorVal,
            _isCustom: false
          };
          if (existingRelIdx > -1) {
            rels[existingRelIdx] = { ...rels[existingRelIdx], type: typeVal, behavior: behaviorVal };
          } else {
            rels.push(newRel);
          }
        }
      };

      const updateCharacterRelationships = (subjectName: string, targetName: string, typeVal: string, behaviorVal: string) => {
        let found = false;
        
        // 1. Check Player
        if (isPlayerMatch(subjectName)) {
          addRelationship(updatedPlayer, false, targetName, typeVal, behaviorVal);
          found = true;
        }

        // 2. Check NPC list
        const npcIdx = updatedNpcs.findIndex(n => isNameMatch(n.name, n.nickname, subjectName));
        if (npcIdx > -1) {
          updatedNpcs[npcIdx] = {
            ...updatedNpcs[npcIdx],
            relationships: [...(updatedNpcs[npcIdx].relationships || [])]
          };
          addRelationship(updatedNpcs[npcIdx], false, targetName, typeVal, behaviorVal);
          found = true;
        }

        // 3. Check Lore entry
        const loreIdx = updatedLore.findIndex(e => (e.category === 'Charaktere' || e.category === 'Gegner') && isNameMatch(e.title, e.details?.nickname, subjectName));
        if (loreIdx > -1) {
          updatedLore[loreIdx] = {
            ...updatedLore[loreIdx],
            details: {
              ...(updatedLore[loreIdx].details || {}),
              relationships: [...(updatedLore[loreIdx].details?.relationships || [])]
            }
          };
          addRelationship(updatedLore[loreIdx], true, targetName, typeVal, behaviorVal);
          found = true;
        }
        return found;
      };

      // Set relationship A -> B
      const updatedA = updateCharacterRelationships(charA, resolvedCharB, relType, relBehavior);
      
      // Also reciprocate B -> A
      const updatedB = updateCharacterRelationships(charB, resolvedCharA, relType, `Gegenseitige ${relType}`);

      if (updatedA || updatedB) {
        notifications.push({
          id: Math.random().toString(),
          type: 'add',
          title: `${resolvedCharA} ↔ ${resolvedCharB} (${relType})`,
          category: 'Beziehung'
        });
      }
    }

    // Parse CHAR_SET: [[CHAR_SET: Name | Field=Value | Field=Value]]
    const charRegex = /\[\[CHAR_SET:\s*([^|\]]+)((?:\|(?:[^\]]+))*)\]\]/g;
    let charMatch;
    while ((charMatch = charRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(charMatch[0], '');
      const charName = charMatch[1].trim();
      const fieldsStr = charMatch[2];
      const fields = fieldsStr.split('|').map(x => x.trim()).filter(Boolean);

      let targetCharObj: any = null;
      let targetLoreEntry: any = null;

      if (isPlayerMatch(charName)) {
        targetCharObj = updatedPlayer;
      } else {
        const npcIdx = updatedNpcs.findIndex(n => isNameMatch(n.name, n.nickname, charName));
        if (npcIdx > -1) {
          updatedNpcs[npcIdx] = { 
             ...updatedNpcs[npcIdx], 
             appearance: { ...updatedNpcs[npcIdx].appearance }, 
             campaignPowerLevels: { ...(updatedNpcs[npcIdx].campaignPowerLevels || {}) } 
          };
          targetCharObj = updatedNpcs[npcIdx];
        } else {
          // completely new figure
          const newNpc: any = {
            id: Math.random().toString(36).substring(2, 9),
            name: charName,
            isHostile: false,
            role: 'Unbekannt',
            bio: '',
            goal: '',
            personality: '',
            currentSituation: '',
            appearance: {
              hairColor: '',
              eyeColor: '',
              age: '',
              build: '',
              gender: ''
            },
            campaignPowerLevels: {}
          };
          updatedNpcs.push(newNpc);
          targetCharObj = newNpc;
        }
      }

      const loreIdx = updatedLore.findIndex(e => (e.category === 'Charaktere' || e.category === 'Gegner') && isNameMatch(e.title, e.details?.nickname, charName));
      if (loreIdx > -1) {
        updatedLore[loreIdx] = { ...updatedLore[loreIdx], details: { ...(updatedLore[loreIdx].details || {}) } };
        targetLoreEntry = updatedLore[loreIdx];
      } else {
        const isCombat = isCombatActive;
        const newEntry = {
          id: 'dyn-' + Math.random().toString(36).substr(2, 9),
          category: isCombat ? 'Gegner' : 'Charaktere',
          title: charName,
          description: isCombat ? 'Ein im Kampf benannter Widersacher.' : 'Ein neu entdeckter Charakter.',
          isUnlocked: true,
          details: {}
        };
        updatedLore.push(newEntry as any);
        targetLoreEntry = newEntry as any;
      }

      for (const f of fields) {
        const eqIdx = f.indexOf('=');
        if (eqIdx > -1) {
          const k = f.substring(0, eqIdx).trim();
          const v = f.substring(eqIdx + 1).trim();
          
          const applyToObj = (obj: any, isLore: boolean) => {
            const appFields = ['gender', 'age', 'build', 'hairColor', 'eyeColor', 'cupSize', 'outfit', 'height', 'measurements', 'origin', 'family', 'faction', 'race'];
            const rootFields = ['role', 'bio', 'goal', 'powerSource', 'powerCost', 'skills', 'techniques', 'personality', 'relationship', 'conduct'];
            
            if (appFields.includes(k)) {
              if (isLore) obj.details[k] = v;
              else obj.appearance[k] = v;
            } else if (rootFields.includes(k)) {
              if (isLore) obj.details[k] = v;
              else obj[k] = v;
            } else if (k.startsWith('campaignPowerLevels.')) {
              const parts = k.split('.');
              if (parts.length === 3) {
                const power = parts[1];
                const attr = parts[2]; // 'value' or 'potentialMax'
                let targetLevels = isLore ? obj.details.campaignPowerLevels : obj.campaignPowerLevels;
                if (!targetLevels) {
                  if (isLore) obj.details.campaignPowerLevels = {};
                  else obj.campaignPowerLevels = {};
                  targetLevels = isLore ? obj.details.campaignPowerLevels : obj.campaignPowerLevels;
                }
                if (!targetLevels[power]) targetLevels[power] = { value: 0, potentialMax: 100 };
                targetLevels[power][attr] = parseInt(v, 10) || 0;
              }
            }
          };

          if (targetCharObj) applyToObj(targetCharObj, false);
          if (targetLoreEntry) applyToObj(targetLoreEntry, true);
        }
      }
    }

    // Sync current combat HP/MP or forced HP/MP back to campaignPowerLevels of updatedPlayer
    const customResNames = getCustomResourceNames();
    const primaryRes = customResNames[0];

    // Initialize campaignPowerLevels if undefined
    if (!updatedPlayer.campaignPowerLevels) {
      updatedPlayer.campaignPowerLevels = {};
    }

    // Passive out-of-combat regeneration of custom campaign power levels (only for consumable resource pools, not static stats like Physische Konstitution)
    if (!isCombatActive && updatedPlayer.campaignPowerLevels) {
      const mappedResNames = currentAdventure.world.customResourceMappings?.map(m => m.name) || [];
      const isResource = (key: string) => {
        const lowerKey = key.toLowerCase();
        if (customResNames.some(r => r.toLowerCase() === lowerKey)) return true;
        if (mappedResNames.some(r => r.toLowerCase() === lowerKey)) return true;
        return [
          'mana', 'mp', 'chakra', 'energie', 'energy', 'ausdauer', 'stamina', 'fokus', 
          'focus', 'zorn', 'rage', 'wut', 'ki', 'chi', 'prana', 'spirit', 'seele', 
          'magie', 'magic', 'willenskraft', 'willpower', 'psi', 'kraft', 'power', 'schwertenergie'
        ].some(kw => lowerKey.includes(kw));
      };

      Object.keys(updatedPlayer.campaignPowerLevels).forEach(key => {
        if (!isResource(key)) return; // Skip static stats like Physische Konstitution, Teufelsfrucht, Haki, etc.
        const p = updatedPlayer.campaignPowerLevels[key];
        const maxVal = p.potentialMax || 100;
        const regenAmount = Math.round(maxVal * 0.1); // +10% regeneration out of combat per action
        p.value = Math.min(maxVal, (p.value ?? 50) + regenAmount);
      });
    }

    // Ensure all customResourceMappings are initialized and apply their effects / regeneration
    if (currentAdventure.world.customResourceMappings && currentAdventure.world.customResourceMappings.length > 0) {
      currentAdventure.world.customResourceMappings.forEach(mapping => {
        let maxVal = 0;
        if (mapping.sourcePowers && mapping.sourcePowers.length > 0) {
          mapping.sourcePowers.forEach(pName => {
            maxVal += updatedPlayer.campaignPowerLevels?.[pName]?.value ?? 100;
          });
        } else {
          maxVal = mapping.baseMax || 100;
        }
        maxVal = maxVal || 100;

        if (!updatedPlayer.campaignPowerLevels[mapping.name]) {
          let startVal = maxVal;
          if (mapping.sourcePowers && mapping.sourcePowers.length > 0) {
            let sumCurrent = 0;
            mapping.sourcePowers.forEach(pName => {
              sumCurrent += updatedPlayer.campaignPowerLevels?.[pName]?.value ?? 50;
            });
            startVal = sumCurrent;
          }
          updatedPlayer.campaignPowerLevels[mapping.name] = { value: startVal, potentialMax: maxVal };
        } else {
          // Only overwrite potentialMax if using dynamic source powers! Otherwise, respect the player's custom potentialMax from the editor.
          if (mapping.sourcePowers && mapping.sourcePowers.length > 0) {
            updatedPlayer.campaignPowerLevels[mapping.name].potentialMax = maxVal;
          }
        }

        const p = updatedPlayer.campaignPowerLevels[mapping.name];
        const currentMax = p.potentialMax ?? maxVal;
        if (isCombatActive) {
          if (mapping.effect === 'regen') {
            // Combat regeneration for regen type
            p.value = Math.min(currentMax, (p.value ?? 50) + Math.round(currentMax * 0.05));
          } else if (mapping.effect === 'rage') {
            // Combat build up for rage type
            p.value = Math.min(currentMax, (p.value ?? 10) + 10);
          } else if (mapping.effect === 'shield') {
            // Shield decays slightly during combat turns
            p.value = Math.max(0, (p.value ?? currentMax) - Math.round(currentMax * 0.05));
          }
        } else {
          // Out of combat regeneration
          const regenPct = mapping.effect === 'regen' ? 0.15 : 0.10;
          p.value = Math.min(currentMax, (p.value ?? 50) + Math.round(currentMax * regenPct));
        }
      });
    }

    // 1. Apply forced next values if provided (e.g. from handleSend)
    if (primaryRes && forceMp !== undefined) {
      if (!updatedPlayer.campaignPowerLevels[primaryRes]) {
        updatedPlayer.campaignPowerLevels[primaryRes] = { value: forceMp, potentialMax: playerMaxMp || 100 };
      } else {
        updatedPlayer.campaignPowerLevels[primaryRes].value = forceMp;
      }
    }

    // 2. Parse STATUS block matches within text to get latest updates from AI
    const statusBlockRegex = /\[\[STATUS:\s*(.*?)\]\]/g;
    let statusBlockMatch;
    let tempMp = -1;
    const tempCustomPowerVals: Record<string, number> = {};

    // Create a local copy of text for regex matching
    const textToMatch = text || '';
    while ((statusBlockMatch = statusBlockRegex.exec(textToMatch)) !== null) {
      const innerContent = statusBlockMatch[1];
      const pairs = innerContent.split(/\s*[,|]\s*(?=[a-zA-ZäöüÄÖÜß_0-9\s-]+\s*=)/);
      for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx > 0) {
          const key = pair.substring(0, eqIdx).trim().toLowerCase();
          const value = pair.substring(eqIdx + 1).trim();
          const valNum = parseInt(value, 10);
          if (!isNaN(valNum)) {
            if (key === 'spieler_mp') {
              tempMp = valNum;
            } else {
              // Check if key matches one of our custom resources (e.g. "mana", "chakra")
              const matchedRes = customResNames.find(r => r.toLowerCase() === key);
              if (matchedRes) {
                tempCustomPowerVals[matchedRes] = valNum;
              }
            }
          }
        }
      }
    }

    if (primaryRes && tempMp !== -1) {
      if (!updatedPlayer.campaignPowerLevels[primaryRes]) {
        updatedPlayer.campaignPowerLevels[primaryRes] = { value: tempMp, potentialMax: playerMaxMp || 100 };
      } else {
        updatedPlayer.campaignPowerLevels[primaryRes].value = tempMp;
      }
    }

    Object.entries(tempCustomPowerVals).forEach(([resName, val]) => {
      if (!updatedPlayer.campaignPowerLevels[resName]) {
        updatedPlayer.campaignPowerLevels[resName] = { value: val, potentialMax: 100 };
      } else {
        updatedPlayer.campaignPowerLevels[resName].value = val;
      }
    });

    // Parse INVENTORY_SET: [[INVENTORY_SET: Slot=Wert | Slot2=Wert]]
    const invRegex = /\[\[INVENTORY_SET:\s*([^\]]+)\]\]/g;
    let invMatch;
    while ((invMatch = invRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(invMatch[0], '');
      const fieldsStr = invMatch[1];
      const fields = fieldsStr.split('|').map(x => x.trim()).filter(Boolean);

      for (const f of fields) {
        const eqIdx = f.indexOf('=');
        if (eqIdx > -1) {
          let k = f.substring(0, eqIdx).trim().toLowerCase();
          const v = f.substring(eqIdx + 1).trim();

          // Handle armor
          if (k.startsWith('armor.')) {
            const slot = k.split('.')[1];
            if (!updatedStructuredInventory.armor) updatedStructuredInventory.armor = {};
            updatedStructuredInventory.armor[slot] = v;
          }
          // Handle accessories
          else if (k.startsWith('accessories.')) {
            const slot = k.split('.')[1];
            if (!updatedStructuredInventory.accessories) updatedStructuredInventory.accessories = {};
            updatedStructuredInventory.accessories[slot] = v;
          }
          // Handle weapons
          else if (k.startsWith('weapons')) {
            if (!updatedStructuredInventory.weapons) updatedStructuredInventory.weapons = [];
            if (k.endsWith('+')) {
              if (v && !updatedStructuredInventory.weapons.includes(v)) {
                updatedStructuredInventory.weapons.push(v);
              }
            } else if (k.endsWith('-')) {
              updatedStructuredInventory.weapons = updatedStructuredInventory.weapons.filter((w: string) => w.toLowerCase() !== v.toLowerCase());
            } else {
              updatedStructuredInventory.weapons = v ? v.split(',').map((w: string) => w.trim()).filter(Boolean) : [];
            }
          }
          // Handle generalItems
          else if (k.startsWith('generalitems')) {
            if (!updatedStructuredInventory.generalItems) updatedStructuredInventory.generalItems = [];
            if (k.endsWith('+')) {
              if (v && !updatedStructuredInventory.generalItems.includes(v)) {
                updatedStructuredInventory.generalItems.push(v);
              }
            } else if (k.endsWith('-')) {
              updatedStructuredInventory.generalItems = updatedStructuredInventory.generalItems.filter((i: string) => i.toLowerCase() !== v.toLowerCase());
            } else {
              updatedStructuredInventory.generalItems = v ? v.split(',').map((i: string) => i.trim()).filter(Boolean) : [];
            }
          }
          // Handle money
          else if (k === 'money') {
            updatedStructuredInventory.money = parseInt(v, 10) || 0;
          }
          // Handle currencyLabel
          else if (k === 'currencylabel') {
            updatedStructuredInventory.currencyLabel = v;
          }
        }
      }
    }

    return { cleanedText: cleanedText.trim(), updatedLore, updatedPlayer, updatedNpcs, notifications, updatedStructuredInventory };
  };

  const parseStatusUpdates = (text: string, currentStatus: StatusElement[]) => {
    let newStatus = [...currentStatus];
    let cleanedText = text;
    
    const blockRegex = /\[\[STATUS:\s*(.*?)\]\]/g;
    let blockMatch;

    while ((blockMatch = blockRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(blockMatch[0], '');
      const innerContent = blockMatch[1];
      
      const pairs = innerContent.split(/\s*[,|]\s*(?=[a-zA-ZäöüÄÖÜß_0-9\s-]+\s*=)/);
      
      for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx > 0) {
          const key = pair.substring(0, eqIdx).trim();
          const value = pair.substring(eqIdx + 1).trim();
          
          // Sync JRPG HP/MP in real-time & multiple opponents states
          const lowerKey = key.toLowerCase();
          if (lowerKey === 'gegner_hp') {
            const val = parseInt(value);
            if (!isNaN(val)) setEnemyHp(Math.max(0, val));
          } else if (lowerKey === 'spieler_hp') {
            const val = parseInt(value);
            if (!isNaN(val)) setPlayerHp(Math.max(0, val));
          } else if (lowerKey === 'spieler_mp') {
            const val = parseInt(value);
            if (!isNaN(val)) setPlayerMp(Math.max(0, val));
          } else if (getCustomResourceNames()[0]?.toLowerCase() === lowerKey) {
            const val = parseInt(value);
            if (!isNaN(val)) setPlayerMp(Math.max(0, val));
          } else {
            // Support for multiple/fodder opponents HP and quantity updating
            const hpMatch = key.match(/^(.+?)_hp$/i);
            const countMatch = key.match(/^(.+?)_count$/i);
            
            if (hpMatch) {
              const rawName = hpMatch[1].replace(/_/g, ' ').trim();
              const oName = rawName.toLowerCase();
              const val = parseInt(value);
              if (!isNaN(val)) {
                setOpponents(prev => {
                  const exists = prev.some(o => o.name.toLowerCase() === oName || o.name.toLowerCase().replace(/\s+/g, '') === oName.replace(/\s+/g, ''));
                  if (exists) {
                    return prev.map(o => {
                      if (o.name.toLowerCase() === oName || o.name.toLowerCase().replace(/\s+/g, '') === oName.replace(/\s+/g, '')) {
                        const matchedNpc = findNpcByIdOrName('', rawName);
                        const calcMax = matchedNpc ? getNPCMaxHp(matchedNpc) : o.maxHp;
                        return { ...o, hp: Math.max(0, val), maxHp: calcMax };
                      }
                      return o;
                    });
                  } else {
                    const matchedNpc = findNpcByIdOrName('', rawName);
                    const calcMax = matchedNpc ? getNPCMaxHp(matchedNpc) : Math.max(100, val);
                    return [...prev, {
                      id: matchedNpc?.id || 'auto-' + Math.random().toString(36).substr(2, 9),
                      name: matchedNpc?.name || rawName,
                      hp: Math.min(calcMax, Math.max(0, val)),
                      maxHp: calcMax,
                      role: matchedNpc?.role || 'Hinzugefügter Feind',
                      isFodder: false
                    }];
                  }
                });
              }
            } else if (countMatch) {
              const rawName = countMatch[1].replace(/_/g, ' ').trim();
              const oName = rawName.toLowerCase();
              const val = parseInt(value);
              if (!isNaN(val)) {
                setOpponents(prev => {
                  const exists = prev.some(o => o.name.toLowerCase() === oName || o.name.toLowerCase().replace(/\s+/g, '') === oName.replace(/\s+/g, ''));
                  if (exists) {
                    return prev.map(o => {
                      if (o.name.toLowerCase() === oName || o.name.toLowerCase().replace(/\s+/g, '') === oName.replace(/\s+/g, '')) {
                        return { ...o, count: Math.max(0, val) };
                      }
                      return o;
                    });
                  } else {
                    return [...prev, {
                      id: 'auto-' + Math.random().toString(36).substr(2, 9),
                      name: rawName,
                      hp: 100,
                      maxHp: 100,
                      count: Math.max(0, val),
                      role: 'Zusatzgegner Horde',
                      isFodder: true
                    }];
                  }
                });
              }
            }
          }

          const index = newStatus.findIndex(s => s.label.toLowerCase() === key.toLowerCase());
          if (index !== -1) {
            newStatus[index] = { ...newStatus[index], value };
          }
          // Do not automatically add new fields that do not exist in the configured HUD elements!
          // This keeps the HUD and Interface strictly clean and prevents ad-hoc field pollution.
        }
      }
    }

    return { cleanedText: cleanedText.trim(), newStatus };
  };

  const advanceGameTime = (currentStatus: StatusElement[]) => {
    let newStatus = [...currentStatus];
    
    // Advance Time (2 mins per turn) if it exists
    let zeitIdx = newStatus.findIndex(s => s.label === 'Zeit');
    if (zeitIdx !== -1) {
      const timeVal = newStatus[zeitIdx].value;
      const [hours, minutes] = timeVal.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        let totalMinutes = hours * 60 + minutes + 2;
        let newHours = Math.floor(totalMinutes / 60) % 24;
        let newMinutes = totalMinutes % 60;
        newStatus[zeitIdx] = { 
          ...newStatus[zeitIdx], 
          value: `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}` 
        };
      }
    }

    // Decrease Stamina (-5% per turn) if it exists
    let ausdauerIdx = newStatus.findIndex(s => s.label === 'Ausdauer');
    if (ausdauerIdx !== -1) {
      let staminaVal = parseInt(newStatus[ausdauerIdx].value);
      if (!isNaN(staminaVal)) {
        staminaVal = Math.max(0, staminaVal - 5);
        newStatus[ausdauerIdx] = { ...newStatus[ausdauerIdx], value: `${staminaVal}%` };
      }
    }

    return newStatus;
  };

  const sendActionText = async (textToSend: string, forceNextHp?: number, forceNextMp?: number) => {
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);
    setError(null);

    try {
      const { player, npcs, world } = adventure;
      let hpValToUse = forceNextHp !== undefined ? forceNextHp : playerHp;
      let mpValToUse = forceNextMp !== undefined ? forceNextMp : playerMp;

      if (!isCombatActive) {
        // Passive out-of-combat regeneration (5% of max HP and max MP per action)
        const regenHp = Math.round(playerMaxHp * 0.05);
        const regenMp = Math.round(playerMaxMp * 0.05);
        hpValToUse = Math.min(playerMaxHp, hpValToUse + regenHp);
        mpValToUse = Math.min(playerMaxMp, mpValToUse + regenMp);

        setPlayerHp(hpValToUse);
        setPlayerMp(mpValToUse);
      }
      
      // Advance stats locally first
      const statusWithTime = advanceGameTime(adventure.statusElements || []);
      
      const npcDocs = npcs.map(n => `
      NPC: ${n.name} (${n.role})
      - Portrait: ${n.image ? 'Vorhanden' : 'Keins'}
      - Aussehen: ${n.appearance.gender}, ${n.appearance.age}J, ${n.appearance.build}, Haare: ${n.appearance.hairColor}, Kleidung: ${n.appearance.outfit || 'Standard'}${n.appearance.gender === 'Weiblich' && n.appearance.cupSize && n.appearance.cupSize !== '-' ? `, Körbchen: ${n.appearance.cupSize}` : ''}
      - Vergangenheit: ${n.bio}
      - Aktuelle Situation: ${n.currentSituation || 'Wartet auf Interaktion'}
      - Ziel: ${n.goal || 'Unbekannt'}
      - Fähigkeiten/Jutsus: ${n.skills || 'Unbekannt'}
      - Gesinnung: ${n.isHostile ? 'Feindselig' : 'Freundlich'}
      - Geheimnisse & Verborgenes Wissen (3-Stufen-Logik):
        * Stufe 1 (Öffentlich): ${n.secretsStage1 || 'Keine'}
        * Stufe 2 (Indizien & Verdacht): ${n.secretsStage2 || 'Keine'}
        * Stufe 3 (Absolutes Geheimnis - Blackbox): ${n.secretsStage3 || 'Keine'}
      `).join('\n');

      const currentStatsStr = statusWithTime.map(s => `${s.label}: ${s.value}`).join(', ');

      const lore = adventure.loreDatabase || [];
      
      // build campaign power settings instruction
      let campaignPowerInstruction = '';
      if (world.campaignPowerSettings) {
        const powerDetails = Object.entries(world.campaignPowerSettings).map(([key, val]) => {
          if (val && typeof val === 'object') {
            const sMax = val.scaleMax ?? 100;
            return `- ${key}: Startwert: ${val.min}/${sMax}, Maximum: ${val.max}/${sMax}. Steigerungs-Logik: ${val.levelUpLogic}`;
          }
          return `- ${key}: ${val}/100`;
        }).join('\n      ');
        campaignPowerInstruction = `KAMPAGNEN-GRUNDWERTE (Kräftedifferenz):\n      ${powerDetails}\n      Diese Werte definieren das grundsätzliche Machtniveau, den Startwert (Von), das maximale Limit (Bis) sowie die Steigerungsregeln/Level-Up-Verhalten der Attribute in dieser Welt. Belohne den Spieler bei Kämpfen, Siegen oder Rollenspiel-Interaktionen aktiv mit passendem Fortschritt gemäß diesen Regeln!`;
      }

      // Build technique rules instruction (Master-Matrix & user formulas)
      let techniqueRulesInstruction = `
TECHNIK-REGELN & BALANCING-VORGABEN (MASTER-MATRIX FÜR KAMPFBERECHNUNGEN):
Als DM musst du bei Angriffen, Zaubern und Techniken im Kampf zwingend diese mathematischen Balancing-Formeln für Effekte und Schadenswerte verwenden!

VARIABLEN-DEFINITIONEN:
- B: Der Basis-Wert der Fähigkeit/Technik aus dem Datenblatt.
- R: Der aktuelle Wert der gewählten Kraftquelle / des Radar-Parameters (0 bis 100).
- L: Das Technik-Level / die Meisterschaft der spezifischen Fähigkeit (0,2 für Ungeübt, 0,5 für Geübt, 1,0 für Meisterhaft).
- M: Das Spieler-Level (Charakter-Level von 1 bis 100).
- HP_max / MP_max: Die maximalen Ressourcenpools des Ziels oder Spielers.

FORMELN NACH KATEGORIEN:

1. Kategorie: Angriff
- Untertyp "Einzelschuss": Endschaden = B * (1 + R/100) * L
  Logik: Konzentrierter Direktschaden auf ein einzelnes Opfer.
- Untertyp "Flächenangriff": Endschaden = (B * (1 + R/100) * L) * 0,7
  Logik: Trifft alle anwesenden Gegner, verursacht pro Ziel 30% weniger Schaden als ein Einzelschuss.
- Untertyp "Kettenangriff": Schaden pro Treffer = (B * (1 + R/100) * L) / Anzahl der Treffer
  Logik: Teilt die Gesamtwucht auf X schnelle Schläge auf. Jeder Schlag hat eine eigene Trefferchance.

2. Kategorie: Verteidigung
- Untertyp "Absorber/Schild": Schild-Punkte = B * (1 + R/100) * L
  Logik: Erzeugt eine temporäre Barriere. Eingehender Schaden zieht erst Schild-Punkte ab, bevor die echten HP sinken.
- Untertyp "Evasion/Ausweichen": Zusätzliche Ausweichchance in % = ((R * L) / 2) + (M * 0,5)
  Logik: Erhöht die prozentuale Chance, gegnerischem Schaden komplett mit 0 Schadenspunkten zu entgehen.
- Untertyp "Parade/Konter": Reflektierter Schaden = (Eingesteckter Schaden) * (R/100) * L
  Logik: Fängt den gegnerischen Angriff ab und wirft einen Prozentsatz des Schadens sofort auf den Angreifer zurück.

3. Kategorie: Transformation
- Untertyp "Vollständig": Temporärer Bonus auf alle Radarwerte = +(B * L) in %
  Logik: Der Charakter wechselt die Gestalt. Multipliziere für die Dauer alle Diagramm-Werte mit diesem Faktor.
- Untertyp "Teilweise": Temporärer Bonus auf einen Radarwert = +(B * L)
  Logik: Verwandelt nur ein Körperteil (z.B. Krallen). Addiert einen festen Bonus auf genau ein ausgewähltes Attribut.
- Untertyp "Formwechsel/Stance": Attribut A = Attribut A * 1,25 ∧ Attribut B = Attribut B * 0,75
  Logik: Tauscht Werte permanent, solange die Haltung aktiv ist (z.B. +25% Angriff für -25% Verteidigung).

4. Kategorie: Support
- Untertyp "Heilung/Regeneration": Geheilte HP = B * (1 + R/100) * L
  Logik: Füllt die grüne Lebensleiste im HUD sofort auf (kann HP_max nicht überschreiten).
- Untertyp "Debuff (Sicht/Bewegung)": Gegner-Malus in % = (R * L) / 2
  Logik: Senkt die Treffsicherheit oder Geschwindigkeit des Gegners für eine Anzahl an Runden, die dem Tier-Level entspricht.
- Untertyp "Statuseffekt/Buff": Effekt-Dauer in Runden = Tier-Stufe (Tier 1 = 1 Runde, Tier 2 = 2 Runden, Tier 3 = 3 Runden, Tier 4 = 4 Runden)
  Logik: Verleiht Angriffen Bonuseffekte.
`;

      const rulesList = world.techniqueRulesList && world.techniqueRulesList.length > 0
        ? world.techniqueRulesList
        : [
            { type: 'Angriff', subtype: 'Einzelschuss', baseValue: 15, costResourceName: 'Mana', tier: 'Tier 1', scalingAndEffect: 'Endschaden = B * (1 + R/100) * L' },
            { type: 'Angriff', subtype: 'Flächenangriff', baseValue: 25, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Endschaden = (B * (1 + R/100) * L) * 0,7' },
            { type: 'Angriff', subtype: 'Kettenangriff', baseValue: 20, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Schaden pro Treffer = (B * (1 + R/100) * L) / Anzahl der Treffer' },
            { type: 'Verteidigung', subtype: 'Absorber/Schild', baseValue: 10, costResourceName: 'Mana', tier: 'Tier 1', scalingAndEffect: 'Schild-Punkte = B * (1 + R/100) * L' },
            { type: 'Verteidigung', subtype: 'Evasion/Ausweichen', baseValue: 15, costResourceName: 'Ausdauer', tier: 'Tier 2', scalingAndEffect: 'Zusätzliche Ausweichchance in % = ((R * L) / 2) + (M * 0,5)' },
            { type: 'Verteidigung', subtype: 'Parade/Konter', baseValue: 30, costResourceName: 'Ausdauer', tier: 'Tier 3', scalingAndEffect: 'Reflektierter Schaden = (Eingesteckter Schaden) * (R/100) * L' },
            { type: 'Transformation', subtype: 'Vollständig', baseValue: 25, costResourceName: 'Mana', tier: 'Tier 4', scalingAndEffect: 'Temporärer Bonus auf alle Radarwerte = +(B * L) in %' },
            { type: 'Transformation', subtype: 'Teilweise', baseValue: 12, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Temporärer Bonus auf einen Radarwert = +(B * L)' },
            { type: 'Transformation', subtype: 'Formwechsel/Stance', baseValue: 5, costResourceName: 'Ausdauer', tier: 'Tier 1', scalingAndEffect: 'Attribut A = Attribut A * 1,25 ∧ Attribut B = Attribut B * 0,75' },
            { type: 'Support', subtype: 'Heilung/Regeneration', baseValue: 12, costResourceName: 'Mana', tier: 'Tier 1', scalingAndEffect: 'Geheilte HP = B * (1 + R/100) * L' },
            { type: 'Support', subtype: 'Debuff (Sicht/Bewegung)', baseValue: 8, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Gegner-Malus in % = (R * L) / 2' },
            { type: 'Support', subtype: 'Statuseffekt/Buff', baseValue: 10, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Effekt-Dauer in Runden = Tier-Stufe' }
          ];

      const rulesDetails = rulesList.map(rule => {
        return `- ${rule.type} (${rule.subtype}): Basis-Wert (B) = ${rule.baseValue}, Kraftquelle = ${rule.costResourceName || 'Mana'}, Tier = ${rule.tier || 'Tier 1'}. Skalierungsformel: ${rule.scalingAndEffect}`;
      }).join('\n      ');
      techniqueRulesInstruction += `\nAKTIVE BALANCING-TABELLE AUS DEM DATENBLATT:\n      ${rulesDetails}\n`;

      let loreInstruction = '';
      if (lore.length > 0) {
        const grouped = lore.reduce((acc, curr) => {
          acc[curr.category] = acc[curr.category] || [];
          acc[curr.category].push(curr);
          return acc;
        }, {} as Record<string, typeof lore>);

        loreInstruction = '\nLORE DATENBANK (Wichtige Fakten, Regeln, Geheimnisse & Historie der Welt):\n';
        Object.entries(grouped).forEach(([cat, entries]) => {
          loreInstruction += `[${cat.toUpperCase()}]\n`;
          const sorted = cat === 'Events' ? entries.sort((a,b) => (a.order || 0) - (b.order || 0)) : entries;
          sorted.forEach(e => {
            const secretTag = !e.isUnlocked ? ' [GEHEIM: Der Spieler weiß das noch nicht! Bringe es organisch in die Story ein]' : '';
            let extraDetails = '';
            
            if (cat === 'Charaktere' && e.details) {
              const d = e.details;
              const traits = [];
              if (d.role) traits.push(`Rolle: ${d.role}`);
              if (d.gender || d.age) traits.push(`Aussehen: ${d.gender || ''} ${d.age ? d.age + 'J' : ''}`.trim());
              if (d.goal) traits.push(`Ziel: ${d.goal}`);
              if (d.relationships && d.relationships.length > 0) {
                const relsStr = d.relationships.map((r: any) => `${r.type} zu ${r.targetCharacter}${r.behavior ? ` (Verhalten: ${r.behavior})` : ''}`).join(', ');
                traits.push(`Beziehungen: ${relsStr}`);
              } else if (d.relationship) {
                traits.push(`Beziehung: ${d.relationship}`);
              }
              if (d.conducts && d.conducts.length > 0) {
                const condsStr = d.conducts.map((c: any) => `Verhalten gegenüber ${c.target}: ${c.behavior}`).join(', ');
                traits.push(`Verhaltensweisen: ${condsStr}`);
              } else if (d.conduct) {
                traits.push(`Verhalten: ${d.conduct}`);
              }
              
              if (d.campaignPowerLevels) {
                const powers = Object.entries(d.campaignPowerLevels).map(([k, v]: any) => `${k} (Aktuell: ${v.value}, Potenzial: ${v.potentialMax})`);
                if (powers.length > 0) {
                  traits.push(`Machtniveau: ${powers.join(', ')}`);
                }
              }
              if (traits.length > 0) {
                extraDetails = ` | Details: ${traits.join('. ')}`;
              }
            }
            
            if (cat === 'Events' && e.details?.eventSteps) {
              const steps = e.details.eventSteps.map((s: any, sIdx: number) => 
                `[Station #${sIdx + 1}: ${s.title || 'Unbenannt'} (${s.status === 'happened' ? 'Eingetreten' : 'Ausstehend/Geplant'})${s.description ? ` - ${s.description}` : ''}]`
              );
              if (steps.length > 0) {
                extraDetails = ` | Roter Faden / Geplante Story-Schritte: ${steps.join(' -> ')}`;
              }
            }

            let secretsStr = '';
            if (e.secretsStage1 || e.secretsStage2 || e.secretsStage3) {
              secretsStr = ` | Geheimnisse & Verborgenes Wissen: [Stufe 1 (Öffentlich): ${e.secretsStage1 || 'Keine'}], [Stufe 2 (Indizien & Verdacht): ${e.secretsStage2 || 'Keine'}], [Stufe 3 (Absolutes Geheimnis - Blackbox): ${e.secretsStage3 || 'Keine'}]`;
            }
            
            loreInstruction += `- ${e.title}${e.order !== undefined && cat === 'Events' ? ` (#${e.order})` : ''}${secretTag}: ${e.description}${extraDetails}${secretsStr}\n`;
          });
        });
        loreInstruction += '\nNutze dieses Wissen, um eine konsistente Spielwelt, Regeln und eine durchgängige Story zu erschaffen. Geheime Fakten darfst du langsam durch Hinweise enthüllen.\n';
      }

      const playerPowers = player.campaignPowerLevels ? Object.entries(player.campaignPowerLevels).map(([k, v]: any) => `${k} (Aktuell: ${v.value}, Potenzial: ${v.potentialMax})`).join(', ') : '';
      const playerPowerInstruction = playerPowers ? `\n      - Macht-Einstufungen: ${playerPowers}` : '';

      const profileInfo = userProfile ? `
      WICHTIGE INFO ÜBER DEN SPIELER (Wahren Kern des Helden):
      - Reallife-Hintergrund: ${userProfile.bio}
      - Bevorzugte Spielweise: Fokus auf seine Rolle als ${userProfile.preferredRole}.
      Nutze diese Infos dezent, um die Geschichte auf den Spieler zuzuschneiden.` : "";

      const nsfwInstruction = world.isNsfw ? `
      NSFW-MODUS AKTIVIERT:
      - Diese Geschichte darf explizite, erwachsene Inhalte, Romantik und Gewalt enthalten.
      - Beschreibe solche Szenen geschmackvoll aber unzensiert, wenn die Handlung es erfordert.
      - Achte darauf, dass alle Handlungen einvernehmlich bleiben, es sei denn, das Genre/Szenario gibt etwas anderes vor.` : "";

      const heroicInstruction = world.isHeroic 
        ? "Der Spieler ist der HELD und das ZENTRUM der Geschichte. Die Welt dreht sich um ihn und seine Taten haben großes Gewicht." 
        : "Der Spieler ist ein GEWÖHNLICHER BÜRGER (z.B. Bauernjunge, Wache, Schmied). Er ist NICHT das Zentrum der Welt. Die Geschichte sollte bodenständig sein und sich auf das tägliche Leben und kleine Abenteuer konzentrieren.";

      const dramaInstruction = world.dramaLevel === 'Niedrig'
        ? "Das Drama-Level ist NIEDRIG. NPCs sind überwiegend freundlich, ehrlich und bodenständig. Vermeide unnötige Intrigen oder exzentrische Charaktere, die den Spieler ausnutzen wollen. Die Geschichte ist ruhig und geerdet."
        : world.dramaLevel === 'Hoch'
        ? "Das Drama-Level ist HOCH. Charaktere können exzentrisch, geheimnisvoll oder manipulativ sein. Es gibt viele Wendungen, Intrigen und persönliche Agenden der NPCs."
        : "Das Drama-Level ist MITTEL. Eine ausgewogene Mischung aus alltäglichen Begegnungen und gelegentlichen dramatischen Entwicklungen.";

      // Kampfsystem-Instruktion!
      let combatInstruction = "";
      if (isCombatActive) {
        const opponentsStatusStr = opponents.map(o => {
          const countStr = o.count !== undefined ? ` (Anzahl: x${o.count})` : '';
          const roleStr = o.role ? ` [${o.role}]` : '';
          const targetedStr = selectedEnemyIds.includes(o.id) ? ' [ANVISIERTES ZIEL / TARGETED BY PLAYER]' : '';
          return `- ${o.name}${countStr}${roleStr}: Status ${o.hp}/${o.maxHp} HP${targetedStr}`;
        }).join('\n');

        const customResNames = getCustomResourceNames();
        const primaryRes = customResNames[0];
        const resourceStatusStr = customResNames.length > 0 
          ? customResNames.map(rName => `${rName}: ${rName === primaryRes ? mpValToUse : (adventure.player.campaignPowerLevels?.[rName]?.value ?? 0)}/${rName === primaryRes ? playerMaxMp : (adventure.player.campaignPowerLevels?.[rName]?.potentialMax ?? 100)}`).join(', ')
          : `${mpValToUse}/${playerMaxMp} MP`;

        combatInstruction = `
        [AKTIVES GEGNER-SYSTEM - MULTIPLE FEINDE]
        Es findet ein rundenbasierter, filmreifer Anime-Kampf statt!
        
        SPIELER:
        - ${player.name} (Status: ${hpValToUse}/${playerMaxHp} HP, ${resourceStatusStr})
          Kräfte/Fähigkeiten: ${getPlayerAbilitiesFormat()}
        
        AKTIVE GEGNER IM GEBIET:
        ${opponentsStatusStr}
        
        KAMPF-REGELN ALS DUNGEON MASTER & STORYTELLER:
        1. Der Spieler beschreibt seine Kampfaktionen komplett frei. Nimm seine kreative Formulierung (z.B. Eis-Atem, Teufelsfrucht-Kräfte, Ninja-Jutsus, Zauber) voll auf und beschreibe das Ergebnis filmreif, spektakulär und hochgradig atmosphärisch!
        2. Falls der Spieler Flächenangriffe oder starke Attacken gegen Gruppen/Kanonenfutter (z.B. Marine-Soldaten x50) einsetzt, schildere logisch, wie ein Teil des Trupps besiegt wird (z.B. "dein eisiger Atem friert 21 der 50 Soldaten augenblicklich zu Eisstatuen ein").
        3. Passe die Anzahl der Soldaten/Truppen oder die HP des anvisierten Gegners im [[STATUS]] Block an!
           Z.B. wenn der Spieler eine Gruppe dezimiert: [[STATUS: Marine-Soldaten_count=29, Spieler_HP=85]].
           Z.B. wenn ein spezifischer Gegner Schaden nimmt: [[STATUS: Gegner_HP=45]]. Du kannst auch name_HP benutzen wie [[STATUS: Marine-Soldaten_HP=40]].
           Z.B. wenn der Spieler eine Kraftquelle verbraucht, passe den Wert im Status-Block an: [[STATUS: spieler_mp=40]] oder [[STATUS: ${primaryRes || 'mana'}=40]].
           Trage Änderungen stets per [[STATUS: Feld=Wert]] aus!
        4. NPCs (Gegner oder Gefährten) agieren hochgradig dynamisch! Sie können sprechen, dem Spieler Befehle zurufen ("Laufen wir weg Richtung Hafen!"), den Alarm auslösen ("Alarm! Eindringlinge!") oder neue Verstärkung herbeirufen. Wenn neue feindliche Verstärkungen oder Begleiter eintreffen (z.B. weil Alarm ausgelöst wurde), MUSS die KI/du diese herbeirufen, indem du sie über den [[STATUS]]-Block mit ihrem HP- oder Count-Wert hinzufügst! Zum Beispiel: [[STATUS: Marine-Verstärkung_HP=100]] oder [[STATUS: Wachhunde_count=6]]. Dadurch erscheinen sie sofort im rundenbasierten Kampf-Interface. Der Spieler can dies nicht manuell tun – DU steuerst das Kampffeld vollständig!
        5. Beschreibe am Ende deines Zuges immer die Reaktion/Aktion der verbleibenden Feinde und deren Gegenangriff, der den Spieler fordert und eventuell Schaden anrichtet.
        6. Falls alle Feinde besiegt sind (Anzahl = 0 oder HP = 0), beschreibe ihren spektakulären K.O. oder ihre Flucht und beende den Kampf feierlich!`;
      }

      const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${world.title}".
      
      WELT: ${world.description} (Ton: ${world.tone})
      ${campaignPowerInstruction}
      ${techniqueRulesInstruction}
      ${loreInstruction}

      ${nsfwInstruction}
      ${heroicInstruction}
      ${dramaInstruction}

      ${profileInfo}

      SPIELER-CHARAKTER:
      ${player.name} (${player.role}). 
      - Aussehen: ${player.appearance.hairColor} Haare, ${player.appearance.eyeColor} Augen, Kleidung: ${player.appearance.outfit}.
      - Bio: ${player.bio}
      - Aktuelle Lage: ${player.currentSituation}
      - Ziel: ${player.goal}
      - Kräfte & Fähigkeiten: ${getPlayerAbilitiesFormat()}${playerPowerInstruction}
      - Geheimnisse & Verborgenes Wissen (3-Stufen-Logik):
        * Stufe 1 (Öffentlich): ${player.secretsStage1 || 'Keine'}
        * Stufe 2 (Indizien & Verdacht): ${player.secretsStage2 || 'Keine'}
        * Stufe 3 (Absolutes Geheimnis - Blackbox): ${player.secretsStage3 || 'Keine'}

      AKTUELLE WERTE: ${currentStatsStr}

      NPCs IN DIESER WELT:
      ${npcDocs}

      ${combatInstruction}

      ANWEISUNGEN FÜR DEINE ANTWORTEN (STRENG EINZUHALTEN):
      1. Beschreibe Szenen FILMREIF. Wenn ein Charakter (Spieler oder NPC) erscheint oder handelt, beschreibe detailliert seine FRISUR, seine KLEIDUNG und seine KÖRPERSPRACHE basierend auf den obigen Infos.
      2. Beziehe die VERGANGENHEIT der Figuren mit ein (Andeutungen oder direkte Referenzen).
      3. Lass die NPCs ihre ZIELE verfolgen. Sie sollten nicht nur passiv sein, sondern eigene Agenden haben.
      4. Nutze das HUD für Änderungen: [[STATUS: Feld1=Wert1, Feld2=Wert2]]. Trenne mehrere Änderungen zwingend mit einem Komma! Du KANNST und SOLLST Zeit und Ausdauer anpassen, wenn die Handlung es erfordert (z.B. Schlafen regeneriert Ausdauer und lässt viel Zeit vergehen).
      5. ANTWORTE IMMER AUF DEUTSCH. Gib KEINE Antwortmöglichkeiten (A, B, C) vor. Der Spieler schreibt seine Aktionen frei.
      6. KEINE STANDARD-FRAGEN AM ENDE: Beende deine Nachrichten NIEMALS mit stereotypischen Fragen wie "Was wirst du tun?", "Was tust du?", "Wie reagierst du?", "Wie wirst du reagieren?" oder ähnlichen Fragen. Lass das Ende deiner Antwort atmosphärisch ausklingen, ganz ohne eine abschließende Frage.
      7. KEIN DIKTIEREN DER WAHRNEHMUNG, REAKTION, GEFÜHLE, UNWILLKÜRLICHEN KÖRPERREAKTIONEN ODER DIALOGE DES SPIELERS (ABSOLUTES SPRECH- UND HANDLUNGSVERBOT FÜR DEN NUTZER): Schreibe niemals vor, was der Spieler aktiv tut, denkt, fühlt, bemerkt, empfindet oder wie sein Körper unwillkürlich reagiert. Diktierte Aktionen, Gefühle oder Sätze wie „Du bemerkst, dass dich jemand beobachtet“, „Du spürst Angst aufsteigen“, „Du blickst dich um“, „lässt dein Herz einen Schlag aussetzen“, „Deine Hände umklammern fester“, „Du spürst eine eisige Kälte in deiner Brust“ oder „Du musst jetzt reagieren“ sind STRENGSTENS VERBOTEN. Zudem darfst du NIEMALS wörtliche Rede, Dialoge, Gedanken oder aktive Handlungen im Namen des Spielers/seines Charakters formulieren, erfinden oder diktieren (z.B. darfst du ihm niemals Sätze in den Mund legen wie: „Das war's, du hättest mich nie finden dürfen!“, rufst du). Der Spieler spricht, fühlt und handelt einzig und allein selbst durch seine Eingaben! Beschreibe stattdessen nur die objektive Umwelt und das Verhalten von NPCs (z.B. „Die Temperatur im Raum sinkt merklich und Raureif bildet sich an den Fenstern“ anstatt „Du spürst eine eisige Kälte in deiner Brust“). Der Spieler entscheidet ganz allein über seine Wahrnehmung, Gedanken, unwillkürlichen Körperreaktionen, Gefühle, Dialoge und Reaktionen.
      8. GEHEIMPLÄNE & VERSTECKTE AGENDA (SPOILER-VERMEIDUNG): Wenn NPCs einen verdeckten oder geheimnisvollen Plan verfolgen (z.B. eine geplante Entführung, Sabotage oder Infiltration), darfst du diesen Plan dem Spieler/Leser NIEMALS direkt auf die Nase binden oder vorwegnehmen. Lass die Charaktere sich vollkommen natürlich oder passend zu ihrer Tarnung verhalten. Der wahre Plan darf sich erst verzögert und schrittweise durch diskrete Handlungen und Interaktionen offenbaren, bis es zu einem logischen und packenden Wendepunkt kommt.
      9. VERDECKTE IDENTITÄTEN & PSEUDONYME: Wenn sich NPCs auf einer verdeckten Mission befinden (z.B. getarnt in ein Anwesen schleichen), benutzen sie unter keinen Umständen ihre echten oder allseits bekannten Namen (wie Naruto, Ino, Sakura, Hinata etc.) im Gespräch mit Fremden oder dem Spieler, da dies die Mission sofort auffliegen lassen würde. Sie agieren unter Decknamen, Tarnidentitäten (z.B. als Personal, andere geladene Gäste oder Wachen) oder bleiben bis zum entscheidenden Moment anonym.
      10. TAKTISCHE & LOGISCHE REINSTE KONSISTENZ (FÄHIGKEITEN & JUTSUS): Die Verwendung von Spezialfähigkeiten oder Ninja-Techniken (z.B. Inos Shintenshin no Jutsu) muss absolut logisch und fehlerfrei durchdacht sein. Wenn ein Jutsu den Körper des Anwenders schutzlos oder ohnmächtig macht, muss im Vornherein logisch sichergestellt sein, dass dieser Körper sicher versteckt und bewacht ist (z.B. versteckt draußen auf einem Ast, bewacht von einer Kameradin wie Hinata, während andere wie Naruto und Sakura das Ziel in Reichweite – z.B. an ein Fenster – locken). Ein plötzliches, unbewachtes Umkippen in einer vollen Menschenmenge is unlogisch und tabu. Die NPCs planen und handeln klug und professionell.
      11. INNERE MONOLOGE DER NPCS: Bei passenden Gelegenheiten darfst du den inneren Monolog oder die Gedanken der NPCs (kursiv formatiert) beschreiben. Dies gibt Einblick in ihre Gefühle, Zweifel oder Absichten, ohne jedoch einen möglichen Geheimplan vollständig zu enthüllen. Nutze dies, um die Tiefe der Nebencharaktere zu steigern.
      12. ACTIVE TIME EVENTS (ATE): Wie in Final Fantasy IX kannst und sollst du gelegentlich kurze Szenen einbauen, die "währenddessen an einem anderen Ort" with anderen Charakteren/NPCs geschehen. Beginne solche Abschnitte mit "**[Active Time Event: Titel des Events]**" und trenne sie vom Hauptgeschehen. Das lässt die Welt lebendig wirken, ohne es bei jeder einzelnen Antwort zu erzwingen.
      13. HANDLUNGEN MARKIEREN: Wenn du Handlungen, Bewegungen oder den Gesichtsausdruck beschreibst, umschließe diese bitte mit Sternchen, wie z.B. *Er zieht sein Schwert* oder *schaut böse*. Gesprochener Text bleibt ohne Sterne.
      14. DYNAMISCHES CODEX / LORE UPDATE: Erweitere die Lore-Datenbank (Codex) eigenständig, wenn der Spieler neue Orte entdeckt, bedeutsame Gegenstände erhält, wichtige geschichtliche Ereignisse stattfinden, neue Fraktionen eine Rolle spielen oder neue Gegner/Widersacher/Verbündete (No-Names im Kampf) eingeführt, bekämpft oder benannt werden (z.B. wenn der Spieler nach dem Namen eines No-Names/Gegners fragt oder du ihm einen Namen gibst). Nutze dazu das Format [[LORE_ADD: Gegner | Name | Beschreibung auf Deutsch]] für Gegner oder passende Kategorien wie 'Orte', 'Fraktionen', 'Gegenstände', 'Fähigkeiten', 'Events', 'Weltregeln', 'Charaktere'. Wenn ein bereits existierender, aber bisher geheimer (GEHEIM) Lore-Fakt enthüllt wird, so schalte ihn frei mit dem Format [[LORE_UNLOCK: Name]].
      15. CHARAKTER-WERT-UPDATES: Wenn ein Charakter (Spieler oder NPC) ein neues Detail preisgibt, das im Bogen leer ist oder aktualisiert werden muss (z.B. neues Outfit, Alter bekannt, verbesserte Machtlevel), MUSST du dies sofort aktualisieren mit [[CHAR_SET: Charaktername | Feld=Wert | Feld2=Wert]]. Auch wenn eine komplett neue Figur auftaucht, fülle ihre Felder mit diesem Format!
          > Erlaubte Felder: age, gender, hairColor, eyeColor, build, outfit, role, goal, powerSource, powerCost, techniques, cupSize, chestSize.
          > Kampagnen-Mächte: campaignPowerLevels.Machtname.value oder .potentialMax (z.B. campaignPowerLevels.Mana.value=30). So wird die Machtentwicklung (Wachstum) visualisiert!
      16. UMGANGSFORMEN, ETIKETTE & ANREDE: Beachte die sozialen Rollen und Hierarchien strikt. Wenn ein niederrangiger Charakter (z.B. Schüler, Lehrling, Bürger) einen höherrangigen (z.B. Lehrer/Sensei, König, Meister) nicht mit dem gebührenden Respekt oder der korrekten Anrede (z.B. Sensei, Eure Majestät) anspricht, müssen die NPCs darauf passend reagieren. Sie können Tadel aussprechen, Konsequenzen verhängen oder verärgert reagieren. Gleiches gilt für unangemessene Ausdrucksweise oder mangelnde Etikette.
      17. STRENGES ZITIER- & WIEDERHOLUNGSVERBOT: Du darfst NIEMALS die Worte, Sätze, Aktionen, Fragen oder Ausrufe des Spielers zitieren, wiederholen, umformulieren, umschreiben oder kopieren (auch nicht als wörtliche Rede, Gedanken oder Einleitung). Der Spieler hat seine Nachricht bereits selbst geschrieben/gelesen und will sie unter keinen Umständen in deiner Antwort wiederholt sehen. Beginne deine Antwort direkt mit den unmittelbaren Konsequenzen, NPCs-Reaktionen oder dem weiteren physischen/verbalen Verlauf der Szene. Schreibe absolut keine Einleitung, Zusammenfassung oder Rekapitulation des Spielerbeitrags. Wirf den Leser mitten in die darauffolgende Handlung!
      18. STRENGER GEHEIMNIS- UND SPOILER-SCHUTZ BEI TARNUNGEN UND GEHEIMNISSEN: Erwähne niemals geheime Rollen, verborgene Pläne, verdeckte Zugehörigkeiten oder Undercover-Identitäten von Charakteren direkt oder indirekt in der Narration (z.B. wenn Himiko Frost als Lehrerin auftritt, darfst du sei unter keinen Umständen als "Undercover-Agentin" oder "vermeintliche Lehrerin" bezeichnen, oder durch verdächtige oder unnatürliche Formulierungen ihre Tarnung im Text gefährden, es sei denn, ihre Identität wurde im Handlungsverlauf für die Spielfigur bereits eindeutig und unumstößlich aufgedeckt). Für den Spieler muss sie sich absolut lückenlos und überzeugend wie eine echte Lehrerin verhalten.
      19. INTERAKTIONEN UND DIALOGE ZWISCHEN NPCS: Baue vermehrt lebendige, direkte Dialoge in deine Antworten ein. Lass die anwesenden NPCs nicht nur mit dem Spieler sprechen, sondern auch direkt untereinander interagieren, sich unterhalten, Meinungen austauschen, miteinander diskutieren, scherzen, sich absprechen oder streiten. NPCs sind eigenständige Personen mit Beziehungen zueinander und sollten im Chat aktiv und hörbar miteinander kommunizieren, um Szenen lebendiger und authentischer zu machen.
      20. DYNAMISCHE ZEITSPRÜNGE & STORY-TEMPO: Um Leerlauf und zähe Passagen zu vermeiden, darfst du (und sollst du) eigenständig kleine Zeitsprünge in der Geschichte machen, sobald eine Szene fertig erzählt ist. Wenn der Spieler beispielsweise im Unterricht sitzt und ein Ereignis angekündigt wird, überspringe den restlichen Unterricht oder zähen Alltag und blende direkt zum nächsten spannenden Event, Raumwechsel oder Treffen über. Passe die Zeit im [[STATUS]] Block (z.B. [[STATUS: Zeit=13:30]]) zwingend an, wenn dadurch viel Zeit vergeht!
      21. GEHEIMNISSE & VERBORGENES WISSEN (3-STUFEN-LOGIK): Halte dich strikt an die 3 Stufen des geheimen Wissens. Stufe 1 is allgemein bekannt. Stufe 2 ist NPCs nicht direkt bekannt, kann aber zu begründetem Verdacht oder Nachforschungen führen. Stufe 3 is eine ABSOLUTE BLACKBOX für NPCs; NPCs dürfen dieses Wissen unter keinen Umständen in Dialogen, Handlungen oder Gedanken verwenden! Erst wenn der Spieler das Geheimnis im Chat gesteht, oder wenn NPCs durch gesammelte Indizien im Chat eine unumstößliche Schlussfolgerung ziehen, wird dieses Wissen enthüllt. Jedes Meta-Wissen-Bleeding ist strengstens verboten!
      22. GEHEIMNISSE VON CHARAKTEREN & LORE: Die 3-Stufen-Logik gilt auch für NPCs und Lore-Einträge. Verwende dieses Geheimwissen im Chat, um die Charaktere und die Welt lebendig zu gestalten, ohne das Wissen von Stufe 3 an unbeteiligte NPCs durchsickern zu lassen!
      23. BEZIEHUNGEN & VERHALTEN DYNAMISCH ERSTELLEN: Sobald der Spieler/Nutzer einen Charakter zum ersten Mal trifft, ODER wenn ein Charakter einen anderen Charakter trifft, und im Codex (loreDatabase) noch kein Eintrag für ihre Beziehung (relationships) oder ihr Verhalten (conducts) zueinander existiert, MUSST du zwingend ein Beziehungs- und Verhaltens-Update ausgeben!
          Verwende dazu das Format: [[RELATIONSHIP: CharakterA | CharakterB | Typ/Verbindung | Verhalten]]
          Beispiel: Wenn der Spieler "Himiko Frost" trifft und es noch keine Beziehung im Codex gibt, gib aus: [[RELATIONSHIP: Himiko Frost | Spieler | Mentorin | Distanziert aber schützend]] (und am besten auch umgekehrt [[RELATIONSHIP: Spieler | Himiko Frost | Lehrling | Respektvoll aber neugierig]]). Dadurch wird die Beziehung im Codex für beide Seiten eingetragen, beidseitig verknüpft und visuell im Log erfasst!
      24. INVENTAR- & AUSRÜSTUNGSUPDATES: Wenn der Spieler im Verlauf der Geschichte neue Kleidung/Rüstung anzieht, sich umzieht, Waffen ausrüstet/ablegt, Schmuck/Accessoires anlegt oder sonstige Gegenstände in seine Tasche steckt, MUSST du sein Inventar im Logbuch sofort aktualisieren! Nutze dazu zwingend das Format [[INVENTORY_SET: Feld=Wert | Feld2=Wert]].
          > Erlaubte Rüstungs-Felder (Kleidung & Rüstung): armor.head, armor.chest, armor.hands, armor.legs, armor.feet
          > Erlaubte Schmuck-Felder (Schmuck & Accessoires): accessories.finger, accessories.wrist, accessories.waist, accessories.back, accessories.neck
          > Waffen-Aktionen: weapons+=Waffenname (hinzufügen), weapons-=Waffenname (entfernen)
          > Sonstige Gegenstände (Tasche): generalItems+=Gegenstandsname (hinzufügen), generalItems-=Gegenstandsname (entfernen)
          > Vermögen: money=Zahl (z.B. money=150)
          Beispiel: Wenn sich der Spieler umzieht und ein neues Hemd und ein Schwert erhält, gib aus: [[INVENTORY_SET: armor.chest=Weißes Leinenhemd | weapons+=Eisenschwert]]`;
      
      const response = await GeminiService.chat(updatedMessages, systemInstruction, world.isNsfw, adventure.summaryLog);
      const rawText = response.text || '';
      
      const { cleanedText: statusCleaned, newStatus } = parseStatusUpdates(rawText, statusWithTime);
      const { cleanedText: finalCleanedText, updatedLore, updatedPlayer, updatedNpcs, notifications, updatedStructuredInventory } = parseLoreAndCharUpdates(statusCleaned, adventure, forceNextHp, forceNextMp);

      if (notifications.length > 0) {
        setLoreNotifications(prev => [...prev, ...notifications]);
      }

      const newModelMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: finalCleanedText };
      setMessages(prev => [...prev, newModelMsg]);
      const nextChatHistory: ChatMessage[] = [...updatedMessages, newModelMsg];
      
      // Update adventure state immediately
      onUpdateAdventure({ 
        ...adventureRef.current, 
        player: updatedPlayer,
        npcs: updatedNpcs,
        statusElements: newStatus, 
        loreDatabase: updatedLore,
        chatHistory: nextChatHistory,
        structuredInventory: updatedStructuredInventory
      });

      // Update the chronicle summary log asynchronously in background
      GeminiService.extractChronicle(
        adventure.prologue,
        adventure.summaryLog || '',
        nextChatHistory.slice(-4),
        world.isNsfw
      ).then(newSummary => {
        if (newSummary && newSummary.trim()) {
          onUpdateAdventure({
            ...adventureRef.current,
            player: updatedPlayer,
            npcs: updatedNpcs,
            statusElements: newStatus,
            loreDatabase: updatedLore,
            chatHistory: nextChatHistory,
            summaryLog: newSummary,
            structuredInventory: updatedStructuredInventory
          });
        }
      }).catch(err => {
        console.error("Chronik-Extraktion fehlgeschlagen:", err);
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Ein Fehler ist bei der Übertragung aufgetreten. Bitte versuche es erneut.");
      if (textToSend) {
        setInputText(textToSend);
      }
      // Remove the last message from screen if generating failed
      setMessages(prev => prev.filter(msg => msg.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');

    let nextHp = playerHp;
    let nextMp = playerMp;

    let updatedPowerLevels = adventure.player.campaignPowerLevels ? { ...adventure.player.campaignPowerLevels } : {};
    let powerLevelsChanged = false;

    if (Object.keys(updatedPowerLevels).length === 0 && adventure.world.campaignPowerSettings) {
      Object.entries(adventure.world.campaignPowerSettings).forEach(([key, val]: [string, any]) => {
        const minVal = typeof val === 'object' ? (val?.min ?? 50) : 50;
        const maxVal = typeof val === 'object' ? (val?.max ?? 100) : 100;
        updatedPowerLevels[key] = { value: minVal, potentialMax: maxVal, xp: 0 };
      });
      powerLevelsChanged = true;
    }

    let updatedAbilities = adventure.player.abilities ? JSON.parse(JSON.stringify(adventure.player.abilities)) : [];
    let abilitiesChanged = false;

    const awardTechniqueXP = (techName: string, epToGain: number) => {
      let found = false;
      const rate = adventure.world.techniqueProgressionRate || 'normal';
      let multiplier = 1.0;
      if (rate === 'slow') multiplier = 0.5;
      else if (rate === 'fast') multiplier = 1.5;
      else if (rate === 'extreme') multiplier = 2.5;

      updatedAbilities = updatedAbilities.map((ability: any) => {
        if (!ability.techniqueList) return ability;
        const nextList = ability.techniqueList.map((t: any) => {
          if (t.name.toLowerCase().trim() === techName.toLowerCase().trim()) {
            found = true;
            
            const logic = adventure.world.techniqueProgressionLogic || t.progressionLogic || 'ep';
            const currentLevel = t.level ?? 1;
            const maxLvl = t.maxLevel ?? 10;
            
            if (logic === 'ep') {
              const currentXP = t.xp ?? 0;
              const rawGain = t.xpGainPerUse ?? epToGain;
              const gain = Math.round(rawGain * multiplier);
              const xpNeeded = t.xpNeeded ?? 100;
              
              let nextXP = currentXP + gain;
              let nextLevel = currentLevel;
              
              if (nextLevel < maxLvl) {
                if (nextXP >= xpNeeded) {
                  const numLevels = Math.floor(nextXP / xpNeeded);
                  nextXP = nextXP % xpNeeded;
                  nextLevel = Math.min(maxLvl, nextLevel + numLevels);
                  
                  // Add a notification about level up!
                  setLoreNotifications(prev => [
                    ...prev,
                    {
                      id: Math.random().toString(),
                      type: 'unlock',
                      title: `⚔️ Technik-Aufstieg: ${t.name} ist nun Level ${nextLevel}!`,
                      category: 'Fähigkeit'
                    }
                  ]);
                }
              } else {
                nextXP = 0;
              }
              
              return {
                ...t,
                level: nextLevel,
                xp: nextXP,
                maxLevel: maxLvl,
                xpNeeded: xpNeeded
              };
            } else if (logic === 'training') {
              const req = t.trainingRequired ?? 3;
              let stepsToGive = 1;
              if (rate === 'fast') stepsToGive = 2;
              else if (rate === 'extreme') stepsToGive = 3;
              let nextProg = (t.trainingProgress ?? 0) + stepsToGive;
              let nextLevel = currentLevel;
              
              if (nextLevel < maxLvl) {
                if (nextProg >= req) {
                  nextProg = 0;
                  nextLevel = Math.min(maxLvl, nextLevel + 1);
                  
                  setLoreNotifications(prev => [
                    ...prev,
                    {
                      id: Math.random().toString(),
                      type: 'unlock',
                      title: `🏋️ Training erfolgreich: ${t.name} steigt auf Level ${nextLevel}!`,
                      category: 'Fähigkeit'
                    }
                  ]);
                }
              } else {
                nextProg = 0;
              }
              
              return {
                ...t,
                level: nextLevel,
                trainingProgress: nextProg,
                trainingRequired: req,
                maxLevel: maxLvl
              };
            }
            
            // For milestone and static, we don't auto-level in battle
            return t;
          }
          return t;
        });
        
        if (found) {
          abilitiesChanged = true;
          return { ...ability, techniqueList: nextList };
        }
        return ability;
      });
    };

    const awardActionEP = (actionType: string, costResourceName?: string, actionDetail?: string) => {
      const targetKeys = Object.keys(updatedPowerLevels);
      
      const rate = adventure.world.techniqueProgressionRate || 'normal';
      let multiplier = 1.0;
      if (rate === 'slow') multiplier = 0.5;
      else if (rate === 'fast') multiplier = 1.5;
      else if (rate === 'extreme') multiplier = 2.5;

      // If it's a technique/skill, award experience to the technique as well
      if (actionType === 'skill' && actionDetail) {
        awardTechniqueXP(actionDetail, 25);
      }

      if (targetKeys.length === 0) return;

      const baseEp = actionType === 'skill' ? 20 : 15;
      const epToGain = Math.round(baseEp * multiplier);
      let statsToAward: string[] = [];
      if (costResourceName && updatedPowerLevels[costResourceName]) {
        statsToAward.push(costResourceName);
      } else {
        // Award to a random campaign power level
        statsToAward = [targetKeys[Math.floor(Math.random() * targetKeys.length)]];
      }

      statsToAward.forEach(statKey => {
        const p = updatedPowerLevels[statKey];
        const currentXP = p.xp || 0;
        let nextXP = currentXP + epToGain;
        let nextValue = p.value ?? 50;

        if (nextXP >= 100) {
          const numLevels = Math.floor(nextXP / 100);
          nextXP = nextXP % 100;
          nextValue = Math.min(p.potentialMax || 100, nextValue + (numLevels * 5));
        }

        updatedPowerLevels[statKey] = {
          ...p,
          xp: nextXP,
          value: nextValue
        };
        powerLevelsChanged = true;
      });
    };

    if (queuedCombatActions.length > 0) {
      let currentHp = playerHp;
      let currentMp = playerMp;

      queuedCombatActions.forEach(action => {
        const { actionType, actionDetail, dmgDealt, mpCost, isHeal, costResourceName } = action;
        
        if (actionType === 'attack') {
          setOpponents(prev => prev.map(o => {
            if (selectedEnemyIds.includes(o.id)) {
              const enemyNextHp = Math.max(0, o.hp - dmgDealt);
              if (o.id === selectedEnemyId) {
                setEnemyHp(enemyNextHp);
              }
              return { ...o, hp: enemyNextHp };
            }
            return o;
          }));
          setCustomAttackText('');
        } else if (actionType === 'skill') {
          if (isHeal) {
            currentHp = Math.min(playerMaxHp, currentHp + dmgDealt);
          } else {
            setOpponents(prev => prev.map(o => {
              if (selectedEnemyIds.includes(o.id)) {
                const enemyNextHp = Math.max(0, o.hp - dmgDealt);
                if (o.id === selectedEnemyId) {
                  setEnemyHp(enemyNextHp);
                }
                return { ...o, hp: enemyNextHp };
              }
              return o;
            }));
          }
          if (mpCost > 0) {
            const resInfo = getResourceValueAndMax(costResourceName);
            if (resInfo.isPrimary) {
              currentMp = Math.max(0, currentMp - mpCost);
            } else if (resInfo.radarPowerName) {
              const currentLvl = updatedPowerLevels[resInfo.radarPowerName];
              if (currentLvl) {
                const newValue = Math.max(0, (currentLvl.value ?? 50) - mpCost);
                updatedPowerLevels[resInfo.radarPowerName] = {
                  ...currentLvl,
                  value: newValue
                };
                powerLevelsChanged = true;
              }
            }
          }
        } else if (actionType === 'defend') {
          if (mpCost < 0) {
            currentMp = Math.min(playerMaxMp, currentMp - mpCost);
          }
        } else if (actionType === 'item') {
          if (actionDetail.toLowerCase().includes('heil') || isHeal) {
            currentHp = Math.min(playerMaxHp, currentHp + dmgDealt);
          }
        } else if (actionType === 'flee') {
          setIsCombatActive(false);
          setIsCombatMenuExpanded(false);
        }
        awardActionEP(actionType, costResourceName, actionDetail);
      });

      setPlayerHp(currentHp);
      setPlayerMp(currentMp);
      nextHp = currentHp;
      nextMp = currentMp;

      setCombatSubMenu('main');
      setIsCombatMenuExpanded(false);
      setQueuedCombatActions([]);
      setPendingCombatAction(null);
    } else if (pendingCombatAction) {
      const { actionType, actionDetail, dmgDealt, mpCost, isHeal, costResourceName } = pendingCombatAction;
      
      if (actionType === 'attack') {
        setOpponents(prev => prev.map(o => {
          if (selectedEnemyIds.includes(o.id)) {
            const nextHp = Math.max(0, o.hp - dmgDealt);
            if (o.id === selectedEnemyId) {
              setEnemyHp(nextHp);
            }
            return { ...o, hp: nextHp };
          }
          return o;
        }));
        setCustomAttackText('');
      } else if (actionType === 'skill') {
        if (isHeal) {
          nextHp = Math.min(playerMaxHp, playerHp + dmgDealt);
          setPlayerHp(nextHp);
        } else {
          setOpponents(prev => prev.map(o => {
            if (selectedEnemyIds.includes(o.id)) {
              const nextHp = Math.max(0, o.hp - dmgDealt);
              if (o.id === selectedEnemyId) {
                setEnemyHp(nextHp);
              }
              return { ...o, hp: nextHp };
            }
            return o;
          }));
        }
        if (mpCost > 0) {
          const resInfo = getResourceValueAndMax(costResourceName);
          if (resInfo.isPrimary) {
            nextMp = Math.max(0, playerMp - mpCost);
            setPlayerMp(nextMp);
          } else if (resInfo.radarPowerName) {
            const currentLvl = updatedPowerLevels[resInfo.radarPowerName];
            if (currentLvl) {
              const newValue = Math.max(0, (currentLvl.value ?? 50) - mpCost);
              updatedPowerLevels[resInfo.radarPowerName] = {
                ...currentLvl,
                value: newValue
              };
              powerLevelsChanged = true;
            }
          }
        }
      } else if (actionType === 'defend') {
        if (mpCost < 0) {
          nextMp = Math.min(playerMaxHp, playerMp - mpCost);
          setPlayerMp(nextMp); // Regenerate MP (mpCost is negative e.g. -10)
        }
      } else if (actionType === 'item') {
        if (actionDetail.toLowerCase().includes('heil')) {
          nextHp = Math.min(playerMaxHp, playerHp + dmgDealt);
          setPlayerHp(nextHp);
        }
      } else if (actionType === 'flee') {
        setIsCombatActive(false);
        setIsCombatMenuExpanded(false);
      }
      
      awardActionEP(actionType, costResourceName, actionDetail);
      setCombatSubMenu('main');
      setIsCombatMenuExpanded(false);
      setPendingCombatAction(null);
    }

    if (powerLevelsChanged || abilitiesChanged) {
      onUpdateAdventure({
        ...adventure,
        player: {
          ...adventure.player,
          campaignPowerLevels: powerLevelsChanged ? updatedPowerLevels : adventure.player.campaignPowerLevels,
          abilities: abilitiesChanged ? updatedAbilities : adventure.player.abilities
        }
      });
    }

    await sendActionText(text, nextHp, nextMp);
  };

  const startCombat = (enemyId: string, customName?: string) => {
    setIsCombatActive(true);
    setSelectedEnemyId(enemyId);
    setSelectedEnemyIds([enemyId]);
    if (enemyId === 'custom' && customName) {
      setCustomEnemyName(customName);
    }
    
    // Wir setzen HP/MP nur einmalig falls sie 0 sind (zur Bequemlichkeit)
    const isHero = adventure.world.isHeroic !== false;
    
    // Check multiple custom health mapping from campaign settings
    const healthPowerNames = adventure.world.healthPowerNames || [];
    const healthPowerName = adventure.world.healthPowerName;
    let initialPlayerHp = isHero ? 150 : 100;
    let maxPlayerHp = isHero ? 150 : 100;

    if (healthPowerNames.length > 0) {
      let sumVal = 0;
      let sumMax = 0;
      healthPowerNames.forEach(name => {
        const hLevel = adventure.player.campaignPowerLevels?.[name];
        if (hLevel) {
          sumVal += hLevel.value !== undefined ? hLevel.value : 50;
          sumMax += hLevel.potentialMax !== undefined ? hLevel.potentialMax : 100;
        }
      });
      if (sumMax > 0) {
        initialPlayerHp = sumVal;
        maxPlayerHp = sumMax;
      }
    } else if (healthPowerName && adventure.player.campaignPowerLevels?.[healthPowerName]) {
      const hLevel = adventure.player.campaignPowerLevels[healthPowerName];
      initialPlayerHp = hLevel.value !== undefined ? hLevel.value : initialPlayerHp;
      maxPlayerHp = hLevel.potentialMax !== undefined ? hLevel.potentialMax : maxPlayerHp;
    }

    // Check multiple custom cost mapping from campaign settings
    const costPowerNames = adventure.world.costPowerNames || [];
    const costPowerName = adventure.world.costPowerName;
    let initialPlayerMp = isHero ? 120 : 80;
    let maxPlayerMp = isHero ? 120 : 80;

    if (costPowerNames.length > 0) {
      let sumVal = 0;
      let sumMax = 0;
      costPowerNames.forEach(name => {
        const cLevel = adventure.player.campaignPowerLevels?.[name];
        if (cLevel) {
          sumVal += cLevel.value !== undefined ? cLevel.value : 50;
          sumMax += cLevel.potentialMax !== undefined ? cLevel.potentialMax : 100;
        }
      });
      if (sumMax > 0) {
        initialPlayerMp = sumVal;
        maxPlayerMp = sumMax;
      }
    } else if (costPowerName && adventure.player.campaignPowerLevels?.[costPowerName]) {
      const cLevel = adventure.player.campaignPowerLevels[costPowerName];
      initialPlayerMp = cLevel.value !== undefined ? cLevel.value : initialPlayerMp;
      maxPlayerMp = cLevel.potentialMax !== undefined ? cLevel.potentialMax : maxPlayerMp;
    } else {
      // Fallback to first resource bar if no custom cost is assigned
      const customResNames = getCustomResourceNames();
      const primaryRes = customResNames[0];
      if (primaryRes && adventure.player.campaignPowerLevels?.[primaryRes]) {
        const pLevel = adventure.player.campaignPowerLevels[primaryRes];
        initialPlayerMp = pLevel.value !== undefined ? pLevel.value : initialPlayerMp;
        maxPlayerMp = pLevel.potentialMax !== undefined ? pLevel.potentialMax : maxPlayerMp;
      }
    }

    if (playerMaxHp === 0 || playerHp <= 0) {
      setPlayerHp(initialPlayerHp);
      setPlayerMaxHp(maxPlayerHp);
    }
    if (playerMaxMp === 0 || playerMp <= 0) {
      setPlayerMp(initialPlayerMp);
      setPlayerMaxMp(maxPlayerMp);
    }
    
    const mainNpc = findNpcByIdOrName(enemyId, customName);
    let ehp = 100;
    if (mainNpc) {
      ehp = getNPCMaxHp(mainNpc);
    } else {
      if (adventure.world.dramaLevel === 'Hoch') ehp = 150;
      else if (adventure.world.dramaLevel === 'Niedrig') ehp = 75;
    }
    
    setEnemyHp(ehp);
    setEnemyMaxHp(ehp);

    // Dynamic initial opponents list populating
    const initialOpponentsList: any[] = [];
    const activeEnemyName = mainNpc ? (mainNpc.rufName || mainNpc.name) : (customName || 'Widersacher');
    const activeEnemyRole = mainNpc ? mainNpc.role : 'Bedrohung';
    
    initialOpponentsList.push({
      id: mainNpc?.id || enemyId,
      name: activeEnemyName,
      hp: ehp,
      maxHp: ehp,
      role: activeEnemyRole,
      isFodder: false
    });

    // Add other hostile NPCs in this world zone only if they are active/present in the story
    adventure.npcs.forEach(n => {
      if (n.isHostile && n.id !== enemyId && n.name.toLowerCase().trim() !== (customName || '').toLowerCase().trim() && isNpcCurrentlyPresent(n)) {
        const nHp = getNPCMaxHp(n);
        initialOpponentsList.push({
          id: n.id,
          name: n.rufName || n.name,
          hp: nHp,
          maxHp: nHp,
          role: n.role,
          isFodder: false
        });
      }
    });

    // We no longer pre-populate general fodder/uninvolved reinforcements immediately on combat start.
    // They can be summoned dynamically with the alarm or reinforcement system.

    setOpponents(initialOpponentsList);
    
    setCombatSubMenu('main');
    setIsCombatMenuExpanded(!isCombatMenuExpanded);
  };

  const selectOpponentAsTarget = (oppId: string) => {
    setSelectedEnemyIds(prev => {
      const isAlreadySelected = prev.includes(oppId);
      const next = isAlreadySelected 
        ? prev.filter(id => id !== oppId)
        : [...prev, oppId];
      
      const nextMainId = next.length > 0 ? next[next.length - 1] : '';
      setSelectedEnemyId(nextMainId);
      
      if (nextMainId) {
        const found = opponents.find(o => o.id === nextMainId);
        if (found) {
          setEnemyHp(found.hp);
          setEnemyMaxHp(found.maxHp);
          if (nextMainId === 'custom') {
            setCustomEnemyName(found.name);
          }
        }
      } else {
        setEnemyHp(0);
        setEnemyMaxHp(100);
      }
      return next;
    });
  };

  const handleAddReinforcement = () => {
    if (!newOpponentName.trim()) return;
    const name = newOpponentName.trim();
    const isFod = !!newOpponentCount.trim();
    const countVal = isFod ? parseInt(newOpponentCount.trim()) || 10 : undefined;
    const hpVal = newOpponentHp || 100;
    
    const newOpp = {
      id: 'reinforce-' + Math.random().toString(36).substr(2, 9),
      name: name,
      hp: hpVal,
      maxHp: hpVal,
      count: countVal,
      role: isFod ? 'Frische Verstärkung' : 'Elite Verstärkung',
      isFodder: isFod
    };

    setOpponents(prev => [...prev, newOpp]);
    setNewOpponentName('');
    setNewOpponentCount('');
    setShowAddOpponentForm(false);
  };

  const [pendingCombatAction, setPendingCombatAction] = useState<{
    actionType: string;
    actionDetail: string;
    dmgDealt: number;
    mpCost: number;
    isHeal?: boolean;
    costResourceName?: string;
  } | null>(null);

  const [queuedCombatActions, setQueuedCombatActions] = useState<{
    id: string;
    actionType: string;
    actionDetail: string;
    dmgDealt: number;
    mpCost: number;
    isHeal?: boolean;
    costResourceName?: string;
  }[]>([]);

  const getResourceValueAndMax = (costName?: string) => {
    if (!costName) return { value: playerMp, max: playerMaxMp, isPrimary: true, radarPowerName: undefined };
    const costResources = adventure.world.costResources || [];
    const foundResIndex = costResources.findIndex(r => r.name?.toLowerCase() === costName.toLowerCase());
    
    if (foundResIndex === 0) {
      return { value: playerMp, max: playerMaxMp, isPrimary: true, radarPowerName: costResources[0].radarPowerName };
    } else if (foundResIndex > 0) {
      const res = costResources[foundResIndex];
      const radarPowerName = res.radarPowerName;
      const powerLevel = radarPowerName ? adventure.player.campaignPowerLevels?.[radarPowerName] : null;
      const value = powerLevel?.value ?? res.baseMax ?? 100;
      const max = powerLevel?.potentialMax ?? res.baseMax ?? 100;
      return { value, max, isPrimary: false, radarPowerName };
    }
    
    return { value: playerMp, max: playerMaxMp, isPrimary: true, radarPowerName: undefined };
  };

  const getFormattedActionString = (act: { actionType: string; actionDetail: string }) => {
    if (act.actionType === 'attack') return `*${act.actionDetail || "Standard-Angriff"}*`;
    if (act.actionType === 'skill') return `*Fähigkeit: ${act.actionDetail}*`;
    if (act.actionType === 'defend') return `*Abwehr: ${act.actionDetail}*`;
    if (act.actionType === 'item') return `*Gegenstand: ${act.actionDetail}*`;
    return `*Aktion*`;
  };

  const formatCombatActionsQueue = (actions: { actionType: string; actionDetail: string }[]) => {
    if (actions.length === 0) return "";
    return actions.map(act => getFormattedActionString(act)).join(' ');
  };

  const handleCombatAction = (actionType: string, actionDetail: string, dmgDealt: number, mpCost: number, isHeal: boolean = false, costResourceName?: string) => {
    const { value: availableRes, isPrimary } = getResourceValueAndMax(costResourceName);
    
    const totalCostInQueue = queuedCombatActions
      .filter(act => (act.costResourceName || '').toLowerCase() === (costResourceName || '').toLowerCase())
      .reduce((sum, act) => sum + act.mpCost, 0);

    if (mpCost > 0 && availableRes < (totalCostInQueue + mpCost)) {
      setError(`Nicht genügend ${costResourceName || 'MP'} für diese Kombination!`);
      return;
    }
    
    const newAct = {
      id: Math.random().toString(36).substr(2, 9),
      actionType,
      actionDetail,
      dmgDealt,
      mpCost,
      isHeal,
      costResourceName
    };

    const actionStr = getFormattedActionString(newAct);

    setQueuedCombatActions(prev => {
      const next = [...prev, newAct];
      setInputText(prevText => {
        const trimmed = prevText.trim();
        if (!trimmed) {
          return actionStr;
        }
        return `${trimmed} ${actionStr}`;
      });
      return next;
    });
  };

  const removeCombatActionFromQueue = (id: string) => {
    setQueuedCombatActions(prev => {
      const actToRemove = prev.find(act => act.id === id);
      const next = prev.filter(act => act.id !== id);
      if (actToRemove) {
        const actionStr = getFormattedActionString(actToRemove);
        setInputText(prevText => {
          const index = prevText.indexOf(actionStr);
          if (index !== -1) {
            let updated = prevText.substring(0, index) + prevText.substring(index + actionStr.length);
            updated = updated.replace(/\s+/g, ' ').trim();
            return updated;
          }
          // Fallback if the string wasn't found (e.g. user manually changed it)
          return formatCombatActionsQueue(next);
        });
      } else {
        setInputText(formatCombatActionsQueue(next));
      }
      return next;
    });
  };

  const clearCombatActionQueue = () => {
    setQueuedCombatActions([]);
    setInputText('');
  };

  const handleRestAction = (type: 'short' | 'long') => {
    let hpGain = 0;
    let mpGain = 0;
    let desc = "";

    if (type === 'short') {
      hpGain = Math.round(playerMaxHp * 0.3);
      mpGain = Math.round(playerMaxMp * 0.3);
      desc = "Du legst eine kurze Rast ein. Du setzt dich hin, verschnaufst ein wenig und trinkst etwas Wasser. Deine Kräfte regenerieren sich spürbar (+30%).";
    } else {
      hpGain = playerMaxHp;
      mpGain = playerMaxMp;
      desc = "Du machst eine lange Rast und begibst dich zur Ruhe. Ein tiefer, erholsamer Schlaf umgibt dich. Du erwachst am nächsten Morgen vollkommen regeneriert und voller neuer Energie (100% Heilung).";
    }

    const nextHp = Math.min(playerMaxHp, playerHp + hpGain);
    const nextMp = Math.min(playerMaxMp, playerMp + mpGain);

    setPlayerHp(nextHp);
    setPlayerMp(nextMp);

    // Update campaign power levels values
    const updatedPowerLevels = { ...(adventure.player.campaignPowerLevels || {}) };
    Object.keys(updatedPowerLevels).forEach(key => {
      const p = updatedPowerLevels[key];
      const maxVal = p.potentialMax || 100;
      const gain = type === 'short' ? Math.round(maxVal * 0.3) : maxVal;
      updatedPowerLevels[key] = {
        ...p,
        value: Math.min(maxVal, (p.value ?? 50) + gain)
      };
    });

    // Also update any matching statusElements in the top HUD bar (like "Ausdauer", "HP", "MP")
    let updatedStatus = adventure.statusElements?.map(el => {
      const labelLower = el.label.toLowerCase();
      // HP, MP, Ausdauer, Mana, etc.
      if (labelLower === 'ausdauer' || labelLower === 'stamina') {
        if (type === 'long') {
          return { ...el, value: '100%' };
        } else {
          // Parse current percent if any
          const currPct = parseInt(el.value) || 50;
          const nextPct = Math.min(100, currPct + 30);
          return { ...el, value: `${nextPct}%` };
        }
      }
      if (labelLower === 'zeit' && type === 'long') {
        // Sleep advances time by 8 hours
        const timeParts = el.value.split(':');
        if (timeParts.length === 2) {
          const hour = (parseInt(timeParts[0]) + 8) % 24;
          const formattedHour = String(hour).padStart(2, '0');
          return { ...el, value: `${formattedHour}:${timeParts[1]}` };
        }
      }
      return el;
    }) || [];

    // Save back to database/state
    const updatedAdventure = {
      ...adventure,
      statusElements: updatedStatus,
      player: {
        ...adventure.player,
        campaignPowerLevels: updatedPowerLevels
      }
    };

    onUpdateAdventure(updatedAdventure);

    // Add a system narrative message to messages
    const restMsgId = `rest-msg-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: restMsgId,
        role: 'user',
        text: `*${desc}*`
      }
    ]);

    // Push a notification
    setLoreNotifications(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        title: type === 'short' ? 'Kräfte regeneriert (+30%)' : 'Vollständig regeneriert (100%)',
        category: 'Status',
        type: 'unlock'
      }
    ]);
  };

  const handleResetChat = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }

    const resetMsgs: ChatMessage[] = [
      {
        id: 'prologue-msg',
        role: 'model',
        text: adventure.prologue || 'Die Reise beginnt...'
      }
    ];
    if (adventure.firstMessage) {
      resetMsgs.push({
        id: 'first-msg',
        role: 'model',
        text: adventure.firstMessage
      });
    }
    
    // Reset messages locally
    setMessages(resetMsgs);
    
    // Restore player character state back to starting values
    const resetPlayer = adventure.initialPlayer 
      ? JSON.parse(JSON.stringify(adventure.initialPlayer)) 
      : { ...adventure.player };

    // If we don't have initialPlayer (e.g. legacy/pre-created adventure), let's restore campaignPowerLevels values to original settings (min) or defaults
    if (!adventure.initialPlayer && resetPlayer.campaignPowerLevels) {
      const updatedLevels = { ...resetPlayer.campaignPowerLevels };
      Object.keys(updatedLevels).forEach(key => {
        const setting = adventure.world.campaignPowerSettings?.[key];
        if (setting) {
          const minVal = typeof setting === 'number' ? setting : (setting.min ?? 10);
          updatedLevels[key] = {
            ...updatedLevels[key],
            value: minVal,
            xp: 0
          };
        } else {
          updatedLevels[key] = {
            ...updatedLevels[key],
            value: 10,
            xp: 0
          };
        }
      });
      resetPlayer.campaignPowerLevels = updatedLevels;
    }

    // Now calculate maxHp and maxMp on basis of resetPlayer
    const isHero = adventure.world.isHeroic !== false;
    const healthPowerNames = adventure.world.healthPowerNames || [];
    const healthPowerName = adventure.world.healthPowerName;
    let maxHp = isHero ? 150 : 100;

    if (healthPowerNames.length > 0) {
      let sumVal = 0;
      healthPowerNames.forEach(name => {
        const hLevel = resetPlayer.campaignPowerLevels?.[name];
        if (hLevel) {
          sumVal += hLevel.value !== undefined ? hLevel.value : (hLevel.potentialMax !== undefined ? hLevel.potentialMax : 100);
        }
      });
      if (sumVal > 0) {
        maxHp = sumVal;
      }
    } else if (healthPowerName && resetPlayer.campaignPowerLevels?.[healthPowerName]) {
      const hLevel = resetPlayer.campaignPowerLevels[healthPowerName];
      maxHp = hLevel.value !== undefined ? hLevel.value : (hLevel.potentialMax !== undefined ? hLevel.potentialMax : maxHp);
    }

    const costResources = adventure.world.costResources || [];
    const costPowerNames = adventure.world.costPowerNames || [];
    const costPowerName = adventure.world.costPowerName;
    let maxMp = isHero ? 120 : 80;

    if (costResources.length > 0) {
      const primaryRes = costResources[0];
      if (primaryRes.radarPowerName && resetPlayer.campaignPowerLevels?.[primaryRes.radarPowerName]) {
        const cLevel = resetPlayer.campaignPowerLevels[primaryRes.radarPowerName];
        maxMp = cLevel.value !== undefined ? cLevel.value : (cLevel.potentialMax !== undefined ? cLevel.potentialMax : (primaryRes.baseMax ?? 100));
      } else {
        maxMp = primaryRes.baseMax ?? 100;
      }
    } else if (costPowerNames.length > 0) {
      let sumVal = 0;
      costPowerNames.forEach(name => {
        const cLevel = resetPlayer.campaignPowerLevels?.[name];
        if (cLevel) {
          sumVal += cLevel.value !== undefined ? cLevel.value : (cLevel.potentialMax !== undefined ? cLevel.potentialMax : 100);
        }
      });
      if (sumVal > 0) {
        maxMp = sumVal;
      }
    } else if (costPowerName && resetPlayer.campaignPowerLevels?.[costPowerName]) {
      const cLevel = resetPlayer.campaignPowerLevels[costPowerName];
      maxMp = cLevel.value !== undefined ? cLevel.value : (cLevel.potentialMax !== undefined ? cLevel.potentialMax : maxMp);
    }

    // Reset combat states locally and fully heal
    setIsCombatActive(false);
    setIsCombatMenuExpanded(false);
    setSelectedEnemyId('');
    setSelectedEnemyIds([]);
    setCustomEnemyName('');
    setOpponents([]);
    setPlayerHp(maxHp);
    setPlayerMaxHp(maxHp);
    setPlayerMp(maxMp);
    setPlayerMaxMp(maxMp);
    setEnemyHp(100);
    setEnemyMaxHp(100);
    setCombatSubMenu('start');
    
    // Restore status elements back to starting values
    const resetStatus = adventure.initialStatusElements 
      ? JSON.parse(JSON.stringify(adventure.initialStatusElements)) 
      : (adventure.statusElements || []).map(el => {
          if (el.label === 'Zeit') return { ...el, value: '08:00' };
          if (el.label === 'Ausdauer') return { ...el, value: '100%' };
          return el;
        });

    // Restore structured inventory back to starting values
    const resetStructuredInventory = adventure.initialStructuredInventory 
      ? JSON.parse(JSON.stringify(adventure.initialStructuredInventory)) 
      : undefined;

    onUpdateAdventure({ 
      ...adventureRef.current, 
      chatHistory: resetMsgs,
      player: resetPlayer,
      statusElements: resetStatus,
      structuredInventory: resetStructuredInventory,
      combatState: undefined
    });
    
    setShowResetConfirm(false);
  };

  const handleDeleteLastMessage = () => {
    if (isLoading || messages.length <= 1) return;

    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    const updatedMessages = messages.slice(0, -1);
    setMessages(updatedMessages);
    
    onUpdateAdventure({
      ...adventureRef.current,
      chatHistory: updatedMessages
    });

    setShowDeleteConfirm(false);
  };

  const handleRegenerate = async () => {
    if (isLoading || messages.length === 0) return;

    setError(null);
    setIsLoading(true);

    try {
      let historyToUse = [...messages];
      const lastMsg = historyToUse[historyToUse.length - 1];

      // If the last message is from the model, we pop it to regenerate it
      if (lastMsg.role === 'model') {
        historyToUse.pop();
      }

      // Check if we have at least one message remaining (usually we should, or if the history was completely empty we can't regenerate)
      if (historyToUse.length === 0) {
        setError("Nichts zum Regenerieren vorhanden!");
        setIsLoading(false);
        return;
      }

      // Prepare instructions
      const { player, npcs, world } = adventure;
      const statusElements = adventure.statusElements || [];

      const npcDocs = npcs.map(n => `
      NPC: ${n.name} (${n.role})
      - Portrait: ${n.image ? 'Vorhanden' : 'Keins'}
      - Aussehen: ${n.appearance.gender}, ${n.appearance.age}J, ${n.appearance.build}, Haare: ${n.appearance.hairColor}, Kleidung: ${n.appearance.outfit || 'Standard'}${n.appearance.gender === 'Weiblich' && n.appearance.cupSize && n.appearance.cupSize !== '-' ? `, Körbchen: ${n.appearance.cupSize}` : ''}
      - Vergangenheit: ${n.bio}
      - Aktuelle Situation: ${n.currentSituation || 'Wartet auf Interaktion'}
      - Ziel: ${n.goal || 'Unbekannt'}
      - Fähigkeiten/Jutsus: ${n.skills || 'Unbekannt'}
      - Gesinnung: ${n.isHostile ? 'Feindselig' : 'Freundlich'}
      - Geheimnisse & Verborgenes Wissen (3-Stufen-Logik):
        * Stufe 1 (Öffentlich): ${n.secretsStage1 || 'Keine'}
        * Stufe 2 (Indizien & Verdacht): ${n.secretsStage2 || 'Keine'}
        * Stufe 3 (Absolutes Geheimnis - Blackbox): ${n.secretsStage3 || 'Keine'}
      `).join('\n');

      const currentStatsStr = statusElements.map(s => `${s.label}: ${s.value}`).join(', ');

      const lore = adventure.loreDatabase || [];
      
      // build campaign power settings instruction
      let campaignPowerInstruction = '';
      if (world.campaignPowerSettings) {
        const powerDetails = Object.entries(world.campaignPowerSettings).map(([key, val]) => {
          if (val && typeof val === 'object') {
            const sMax = val.scaleMax ?? 100;
            return `- ${key}: Startwert: ${val.min}/${sMax}, Maximum: ${val.max}/${sMax}. Steigerungs-Logik: ${val.levelUpLogic}`;
          }
          return `- ${key}: ${val}/100`;
        }).join('\n      ');
        campaignPowerInstruction = `KAMPAGNEN-GRUNDWERTE (Kräftedifferenz):\n      ${powerDetails}\n      Diese Werte definieren das grundsätzliche Machtniveau, den Startwert (Von), das maximale Limit (Bis) sowie die Steigerungsregeln/Level-Up-Verhalten der Attribute in dieser Welt. Belohne den Spieler bei Kämpfen, Siegen oder Rollenspiel-Interaktionen aktiv mit passendem Fortschritt gemäß diesen Regeln!`;
      }

      // Build technique rules instruction (Master-Matrix & user formulas)
      let techniqueRulesInstruction = `
TECHNIK-REGELN & BALANCING-VORGABEN (MASTER-MATRIX FÜR KAMPFBERECHNUNGEN):
Als DM musst du bei Angriffen, Zaubern und Techniken im Kampf zwingend diese mathematischen Balancing-Formeln für Effekte und Schadenswerte verwenden!

VARIABLEN-DEFINITIONEN:
- B: Der Basis-Wert der Fähigkeit/Technik aus dem Datenblatt.
- R: Der aktuelle Wert der gewählten Kraftquelle / des Radar-Parameters (0 bis 100).
- L: Das Technik-Level / die Meisterschaft der spezifischen Fähigkeit (0,2 für Ungeübt, 0,5 für Geübt, 1,0 für Meisterhaft).
- M: Das Spieler-Level (Charakter-Level von 1 bis 100).
- HP_max / MP_max: Die maximalen Ressourcenpools des Ziels oder Spielers.

FORMELN NACH KATEGORIEN:

1. Kategorie: Angriff
- Untertyp "Einzelschuss": Endschaden = B * (1 + R/100) * L
  Logik: Konzentrierter Direktschaden auf ein einzelnes Opfer.
- Untertyp "Flächenangriff": Endschaden = (B * (1 + R/100) * L) * 0,7
  Logik: Trifft alle anwesenden Gegner, verursacht pro Ziel 30% weniger Schaden als ein Einzelschuss.
- Untertyp "Kettenangriff": Schaden pro Treffer = (B * (1 + R/100) * L) / Anzahl der Treffer
  Logik: Teilt die Gesamtwucht auf X schnelle Schläge auf. Jeder Schlag hat eine eigene Trefferchance.

2. Kategorie: Verteidigung
- Untertyp "Absorber/Schild": Schild-Punkte = B * (1 + R/100) * L
  Logik: Erzeugt eine temporäre Barriere. Eingehender Schaden zieht erst Schild-Punkte ab, bevor die echten HP sinken.
- Untertyp "Evasion/Ausweichen": Zusätzliche Ausweichchance in % = ((R * L) / 2) + (M * 0,5)
  Logik: Erhöht die prozentuale Chance, gegnerischem Schaden komplett mit 0 Schadenspunkten zu entgehen.
- Untertyp "Parade/Konter": Reflektierter Schaden = (Eingesteckter Schaden) * (R/100) * L
  Logik: Fängt den gegnerischen Angriff ab und wirft einen Prozentsatz des Schadens sofort auf den Angreifer zurück.

3. Kategorie: Transformation
- Untertyp "Vollständig": Temporärer Bonus auf alle Radarwerte = +(B * L) in %
  Logik: Der Charakter wechselt die Gestalt. Multipliziere für die Dauer alle Diagramm-Werte mit diesem Faktor.
- Untertyp "Teilweise": Temporärer Bonus auf einen Radarwert = +(B * L)
  Logik: Verwandelt nur ein Körperteil (z.B. Krallen). Addiert einen festen Bonus auf genau ein ausgewähltes Attribut.
- Untertyp "Formwechsel/Stance": Attribut A = Attribut A * 1,25 ∧ Attribut B = Attribut B * 0,75
  Logik: Tauscht Werte permanent, solange die Haltung aktiv ist (z.B. +25% Angriff für -25% Verteidigung).

4. Kategorie: Support
- Untertyp "Heilung/Regeneration": Geheilte HP = B * (1 + R/100) * L
  Logik: Füllt die grüne Lebensleiste im HUD sofort auf (kann HP_max nicht überschreiten).
- Untertyp "Debuff (Sicht/Bewegung)": Gegner-Malus in % = (R * L) / 2
  Logik: Senkt die Treffsicherheit oder Geschwindigkeit des Gegners für eine Anzahl an Runden, die dem Tier-Level entspricht.
- Untertyp "Statuseffekt/Buff": Effekt-Dauer in Runden = Tier-Stufe (Tier 1 = 1 Runde, Tier 2 = 2 Runden, Tier 3 = 3 Runden, Tier 4 = 4 Runden)
  Logik: Verleiht Angriffen Bonuseffekte.
`;

      const rulesList = world.techniqueRulesList && world.techniqueRulesList.length > 0
        ? world.techniqueRulesList
        : [
            { type: 'Angriff', subtype: 'Einzelschuss', baseValue: 15, costResourceName: 'Mana', tier: 'Tier 1', scalingAndEffect: 'Endschaden = B * (1 + R/100) * L' },
            { type: 'Angriff', subtype: 'Flächenangriff', baseValue: 25, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Endschaden = (B * (1 + R/100) * L) * 0,7' },
            { type: 'Angriff', subtype: 'Kettenangriff', baseValue: 20, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Schaden pro Treffer = (B * (1 + R/100) * L) / Anzahl der Treffer' },
            { type: 'Verteidigung', subtype: 'Absorber/Schild', baseValue: 10, costResourceName: 'Mana', tier: 'Tier 1', scalingAndEffect: 'Schild-Punkte = B * (1 + R/100) * L' },
            { type: 'Verteidigung', subtype: 'Evasion/Ausweichen', baseValue: 15, costResourceName: 'Ausdauer', tier: 'Tier 2', scalingAndEffect: 'Zusätzliche Ausweichchance in % = ((R * L) / 2) + (M * 0,5)' },
            { type: 'Verteidigung', subtype: 'Parade/Konter', baseValue: 30, costResourceName: 'Ausdauer', tier: 'Tier 3', scalingAndEffect: 'Reflektierter Schaden = (Eingesteckter Schaden) * (R/100) * L' },
            { type: 'Transformation', subtype: 'Vollständig', baseValue: 25, costResourceName: 'Mana', tier: 'Tier 4', scalingAndEffect: 'Temporärer Bonus auf alle Radarwerte = +(B * L) in %' },
            { type: 'Transformation', subtype: 'Teilweise', baseValue: 12, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Temporärer Bonus auf einen Radarwert = +(B * L)' },
            { type: 'Transformation', subtype: 'Formwechsel/Stance', baseValue: 5, costResourceName: 'Ausdauer', tier: 'Tier 1', scalingAndEffect: 'Attribut A = Attribut A * 1,25 ∧ Attribut B = Attribut B * 0,75' },
            { type: 'Support', subtype: 'Heilung/Regeneration', baseValue: 12, costResourceName: 'Mana', tier: 'Tier 1', scalingAndEffect: 'Geheilte HP = B * (1 + R/100) * L' },
            { type: 'Support', subtype: 'Debuff (Sicht/Bewegung)', baseValue: 8, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Gegner-Malus in % = (R * L) / 2' },
            { type: 'Support', subtype: 'Statuseffekt/Buff', baseValue: 10, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Effekt-Dauer in Runden = Tier-Stufe' }
          ];

      const rulesDetails = rulesList.map(rule => {
        return `- ${rule.type} (${rule.subtype}): Basis-Wert (B) = ${rule.baseValue}, Kraftquelle = ${rule.costResourceName || 'Mana'}, Tier = ${rule.tier || 'Tier 1'}. Skalierungsformel: ${rule.scalingAndEffect}`;
      }).join('\n      ');
      techniqueRulesInstruction += `\nAKTIVE BALANCING-TABELLE AUS DEM DATENBLATT:\n      ${rulesDetails}\n`;

      let loreInstruction = '';
      if (lore.length > 0) {
        const grouped = lore.reduce((acc, curr) => {
          acc[curr.category] = acc[curr.category] || [];
          acc[curr.category].push(curr);
          return acc;
        }, {} as Record<string, typeof lore>);

        loreInstruction = '\nLORE DATENBANK (Wichtige Fakten, Regeln, Geheimnisse & Historie der Welt):\n';
        Object.entries(grouped).forEach(([cat, entries]) => {
          loreInstruction += `[${cat.toUpperCase()}]\n`;
          const sorted = cat === 'Events' ? entries.sort((a,b) => (a.order || 0) - (b.order || 0)) : entries;
          sorted.forEach(e => {
            const secretTag = !e.isUnlocked ? ' [GEHEIM: Der Spieler weiß das noch nicht! Bringe es organisch in die Story ein]' : '';
            let extraDetails = '';
            
            if (cat === 'Charaktere' && e.details) {
              const d = e.details;
              const traits = [];
              if (d.role) traits.push(`Rolle: ${d.role}`);
              if (d.gender || d.age) traits.push(`Aussehen: ${d.gender || ''} ${d.age ? d.age + 'J' : ''}`.trim());
              if (d.goal) traits.push(`Ziel: ${d.goal}`);
              if (d.relationships && d.relationships.length > 0) {
                const relsStr = d.relationships.map((r: any) => `${r.type} zu ${r.targetCharacter}${r.behavior ? ` (Verhalten: ${r.behavior})` : ''}`).join(', ');
                traits.push(`Beziehungen: ${relsStr}`);
              } else if (d.relationship) {
                traits.push(`Beziehung: ${d.relationship}`);
              }
              if (d.conducts && d.conducts.length > 0) {
                const condsStr = d.conducts.map((c: any) => `Verhalten gegenüber ${c.target}: ${c.behavior}`).join(', ');
                traits.push(`Verhaltensweisen: ${condsStr}`);
              } else if (d.conduct) {
                traits.push(`Verhalten: ${d.conduct}`);
              }
              
              if (d.campaignPowerLevels) {
                const powers = Object.entries(d.campaignPowerLevels).map(([k, v]: any) => `${k} (Aktuell: ${v.value}, Potenzial: ${v.potentialMax})`);
                if (powers.length > 0) {
                  traits.push(`Machtniveau: ${powers.join(', ')}`);
                }
              }
              if (traits.length > 0) {
                extraDetails = ` | Details: ${traits.join('. ')}`;
              }
            }
            
            if (cat === 'Events' && e.details?.eventSteps) {
              const steps = e.details.eventSteps.map((s: any, sIdx: number) => 
                `[Station #${sIdx + 1}: ${s.title || 'Unbenannt'} (${s.status === 'happened' ? 'Eingetreten' : 'Ausstehend/Geplant'})${s.description ? ` - ${s.description}` : ''}]`
              );
              if (steps.length > 0) {
                extraDetails = ` | Roter Faden / Geplante Story-Schritte: ${steps.join(' -> ')}`;
              }
            }

            let secretsStr = '';
            if (e.secretsStage1 || e.secretsStage2 || e.secretsStage3) {
              secretsStr = ` | Geheimnisse & Verborgenes Wissen: [Stufe 1 (Öffentlich): ${e.secretsStage1 || 'Keine'}], [Stufe 2 (Indizien & Verdacht): ${e.secretsStage2 || 'Keine'}], [Stufe 3 (Absolutes Geheimnis - Blackbox): ${e.secretsStage3 || 'Keine'}]`;
            }
            
            loreInstruction += `- ${e.title}${e.order !== undefined && cat === 'Events' ? ` (#${e.order})` : ''}${secretTag}: ${e.description}${extraDetails}${secretsStr}\n`;
          });
        });
        loreInstruction += '\nNutze dieses Wissen, um eine konsistente Spielwelt, Regeln und eine durchgängige Story zu erschaffen. Geheime Fakten darfst du langsam durch Hinweise enthüllen.\n';
      }

      const playerPowers = player.campaignPowerLevels ? Object.entries(player.campaignPowerLevels).map(([k, v]: any) => `${k} (Aktuell: ${v.value}, Potenzial: ${v.potentialMax})`).join(', ') : '';
      const playerPowerInstruction = playerPowers ? `\n      - Macht-Einstufungen: ${playerPowers}` : '';

      const profileInfo = userProfile ? `
      WICHTIGE INFO ÜBER DEN SPIELER (Wahren Kern des Helden):
      - Reallife-Hintergrund: ${userProfile.bio}
      - Bevorzugte Spielweise: Fokus auf seine Rolle als ${userProfile.preferredRole}.
      Nutze diese Infos dezent, um die Geschichte auf den Spieler zuzuschneiden.` : "";

      const nsfwInstruction = world.isNsfw ? `
      NSFW-MODUS AKTIVIERT:
      - Diese Geschichte darf explizite, erwachsene Inhalte, Romantik und Gewalt enthalten.
      - Beschreibe solche Szenen geschmackvoll aber unzensiert, wenn die Handlung es erfordert.
      - Achte darauf, dass alle Handlungen einvernehmlich bleiben, es sei denn, das Genre/Szenario gibt etwas anderes vor.` : "";

      const heroicInstruction = world.isHeroic 
        ? "Der Spieler ist der HELD und das ZENTRUM der Geschichte. Die Welt dreht sich um ihn und seine Taten haben großes Gewicht." 
        : "Der Spieler ist ein GEWÖHNLICHER BÜRGER (z.B. Bauernjunge, Wache, Schmied). Er ist NICHT das Zentrum der Welt. Die Geschichte sollte bodenständig sein und sich auf das tägliche Leben und kleine Abenteuer konzentrieren.";

      const dramaInstruction = world.dramaLevel === 'Niedrig'
        ? "Das Drama-Level ist NIEDRIG. NPCs sind überwiegend freundlich, ehrlich und bodenständig. Vermeide unnötige Intrigen oder exzentrische Charaktere, die den Spieler ausnutzen wollen. Die Geschichte ist ruhig und geerdet."
        : world.dramaLevel === 'Hoch'
        ? "Das Drama-Level ist HOCH. Charaktere können exzentrisch, geheimnisvoll oder manipulativ sein. Es gibt many Wendungen, Intrigen und persönliche Agenden der NPCs."
        : "Das Drama-Level ist MITTEL. Eine ausgewogene Mischung aus alltäglichen Begegnungen und gelegentlichen dramatischen Entwicklungen.";

      let combatInstruction = "";
      if (isCombatActive) {
        const opponentsStatusStr = opponents.map(o => {
          const countStr = o.count !== undefined ? ` (Anzahl: x${o.count})` : '';
          const roleStr = o.role ? ` [${o.role}]` : '';
          const targetedStr = selectedEnemyIds.includes(o.id) ? ' [ANVISIERTES ZIEL / TARGETED BY PLAYER]' : '';
          return `- ${o.name}${countStr}${roleStr}: Status ${o.hp}/${o.maxHp} HP${targetedStr}`;
        }).join('\n');

        combatInstruction = `
        [AKTIVES GEGNER-SYSTEM - MULTIPLE FEINDE]
        Es findet ein rundenbasierter, filmreifer Anime-Kampf statt!
        
        SPIELER:
        - ${player.name} (Status: ${playerHp}/${playerMaxHp} HP, ${playerMp}/${playerMaxMp} MP)
          Kräfte/Fähigkeiten: ${getPlayerAbilitiesFormat()}
        
        AKTIVE GEGNER IM GEBIET:
        ${opponentsStatusStr}
        
        KAMPF-REGELN ALS DUNGEON MASTER & STORYTELLER:
        1. Der Spieler beschreibt seine Kampfaktionen komplett frei. Nimm seine kreative Formulierung (z.B. Eis-Atem, Teufelsfrucht-Kräfte, Ninja-Jutsus, Zauber) voll auf und beschreibe das Ergebnis filmreif, spektakulär und hochgradig atmosphärisch!
        2. Falls der Spieler Flächenangriffe oder starke Attacken gegen Gruppen/Kanonenfutter (z.B. Marine-Soldaten x50) einsetzt, schildere logisch, wie ein Teil des Trupps besiegt wird (z.B. "dein eisiger Atem friert 21 der 50 Soldaten augenblicklich zu Eisstatuen ein").
        3. Passe die Anzahl der Soldaten/Truppen oder die HP des anvisierten Gegners im [[STATUS]] Block an!
           Z.B. wenn der Spieler eine Gruppe dezimiert: [[STATUS: Marine-Soldaten_count=29, Spieler_HP=85]].
           Z.B. wenn ein spezifischer Gegner Schaden nimmt: [[STATUS: Gegner_HP=45]]. Du kannst auch name_HP benutzen wie [[STATUS: Marine-Soldaten_HP=40]].
           Trage Änderungen stets per [[STATUS: Feld=Wert]] aus!
        4. NPCs (Gegner oder Gefährten) agieren hochgradig dynamisch! Sie können sprechen, dem Spieler Befehle zurufen ("Laufen wir weg Richtung Hafen!"), den Alarm auslösen ("Alarm! Eindringlinge!") oder neue Verstärkung herbeirufen. Wenn neue feindliche Verstärkungen oder Begleiter eintreffen (z.B. weil Alarm ausgelöst wurde), MUSS die KI/du diese herbeirufen, indem du sie über den [[STATUS]]-Block mit ihrem HP- oder Count-Wert hinzufügst! Zum Beispiel: [[STATUS: Marine-Verstärkung_HP=100]] oder [[STATUS: Wachhunde_count=6]]. Dadurch erscheinen sie sofort im rundenbasierten Kampf-Interface. Der Spieler kann dies nicht manuell tun – DU steuerst das Kampffeld vollständig!
        5. Beschreibe am Ende deines Zuges immer die Reaktion/Aktion der verbliebenen Feinde und deren Gegenangriff, der den Spieler fordert und eventuell Schaden anrichtet (z.B. Spieler_HP=80).
        6. Falls alle Feinde besiegt sind (Anzahl = 0 oder HP = 0), beschreibe ihren spektakulären K.O. oder ihre Flucht und beende den Kampf feierlich!`;
      }

      const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${world.title}".
      
      WELT: ${world.description} (Ton: ${world.tone})
      ${campaignPowerInstruction}
      ${techniqueRulesInstruction}
      ${loreInstruction}

      ${nsfwInstruction}
      ${heroicInstruction}
      ${dramaInstruction}

      ${profileInfo}

      SPIELER-CHARAKTER:
      ${player.name} (${player.role}). 
      - Aussehen: ${player.appearance.hairColor} Haare, ${player.appearance.eyeColor} Augen, Kleidung: ${player.appearance.outfit}.
      - Bio: ${player.bio}
      - Aktuelle Lage: ${player.currentSituation}
      - Ziel: ${player.goal}
      - Kräfte & Fähigkeiten: ${getPlayerAbilitiesFormat()}${playerPowerInstruction}
      - Geheimnisse & Verborgenes Wissen (3-Stufen-Logik):
        * Stufe 1 (Öffentlich): ${player.secretsStage1 || 'Keine'}
        * Stufe 2 (Indizien & Verdacht): ${player.secretsStage2 || 'Keine'}
        * Stufe 3 (Absolutes Geheimnis - Blackbox): ${player.secretsStage3 || 'Keine'}

      AKTUELLE WERTE: ${currentStatsStr}

      NPCs IN DIESER WELT:
      ${npcDocs}

      ${combatInstruction}

      ANWEISUNGEN FÜR DEINE ANTWORTEN (STRENG EINZUHALTEN):
      1. Beschreibe Szenen FILMREIF. Wenn ein Charakter (Spieler oder NPC) erscheint oder handelt, beschreibe detailliert seine FRISUR, seine KLEIDUNG und seine KÖRPERSPRACHE basierend auf den obigen Infos.
      2. Beziehe die VERGANGENHEIT der Figuren mit ein (Andeutungen oder direkte Referenzen).
      3. Lass die NPCs ihre ZIELE verfolgen. Sie sollten nicht nur passiv sein, sondern eigene Agenden haben.
      4. Nutze das HUD für Änderungen: [[STATUS: Feld1=Wert1, Feld2=Wert2]]. Trenne mehrere Änderungen zwingend mit einem Komma! Du KANNST und SOLLST Zeit und Ausdauer anpassen, wenn die Handlung es erfordert (z.B. Schlafen regeneriert Ausdauer und lässt viel Zeit vergehen).
      5. ANTWORTE IMMER AUF DEUTSCH. Gib KEINE Antwortmöglichkeiten (A, B, C) vor. Der Spieler schreibt seine Aktionen frei.
      6. KEINE STANDARD-FRAGEN AM ENDE: Beende deine Nachrichten NIEMALS mit stereotypischen Fragen wie "Was wirst du tun?", "Was tust du?", "Wie reagierst du?", "Wie wirst du reagieren?" oder ähnlichen Fragen. Lass das Ende deiner Antwort atmosphärisch ausklingen, ganz ohne eine abschließende Frage.
      7. KEIN DIKTIEREN DER WAHRNEHMUNG, REAKTION, GEFÜHLE, UNWILLKÜRLICHEN KÖRPERREAKTIONEN ODER DIALOGE DES SPIELERS (ABSOLUTES SPRECH- UND HANDLUNGSVERBOT FÜR DEN NUTZER): Schreibe niemals vor, was der Spieler aktiv tut, denkt, fühlt, bemerkt, empfindet oder wie sein Körper unwillkürlich reagiert. Diktierte Aktionen, Gefühle oder Sätze wie „Du bemerkst, dass dich jemand beobachtet“, „Du spürst Angst aufsteigen“, „Du blickst dich um“, „lässt dein Herz einen Schlag aussetzen“, „Deine Hände umklammern fester“, „Du spürst eine eisige Kälte in deiner Brust“ oder „Du musst jetzt reagieren“ sind STRENGSTENS VERBOTEN. Zudem darfst du NIEMALS wörtliche Rede, Dialoge, Gedanken oder aktive Handlungen im Namen des Spielers/seines Charakters formulieren, erfinden oder diktieren (z.B. darfst du ihm niemals Sätze in den Mund legen wie: „Das war's, du hättest mich nie finden dürfen!“, rufst du). Der Spieler spricht, fühlt und handelt einzig und allein selbst durch seine Eingaben! Beschreibe stattdessen nur die objektive Umwelt und das Verhalten von NPCs (z.B. „Die Temperatur im Raum sinkt merklich und Raureif bildet sich an den Fenstern“ anstatt „Du spürst eine eisige Kälte in deiner Brust“). Der Spieler entscheidet ganz allein über seine Wahrnehmung, Gedanken, unwillkürlichen Körperreaktionen, Gefühle, Dialoge und Reaktionen.
      8. GEHEIMPLÄNE & VERSTECKTE AGENDA (SPOILER-VERMEIDUNG): Wenn NPCs einen verdeckten oder geheimnisvollen Plan verfolgen (z.B. eine geplante Entführung, Sabotage oder Infiltration), darfst du diesen Plan dem Spieler/Leser NIEMALS direkt auf die Nase binden oder vorwegnehmen. Lass die Charaktere sich vollkommen natürlich oder passend zu ihrer Tarnung verhalten. Der wahre Plan darf sich erst verzögert und schrittweise durch diskrete Handlungen und Interaktionen offenbaren, bis es zu einem logischen und packenden Wendepunkt kommt.
      9. VERDECKTE IDENTITÄTEN & PSEUDONYME: Wenn sich NPCs auf einer verdeckten Mission befinden (z.B. getarnt in ein Anwesen schleichen), benutzen sie unter keinen Umständen ihre echten oder allseits bekannten Namen (wie Naruto, Ino, Sakura, Hinata etc.) im Gespräch mit Fremden oder dem Spieler, da dies die Mission sofort auffliegen lassen würde. Sie agieren unter Decknamen, Tarnidentitäten (z.B. als Personal, andere geladene Gäste oder Wachen) oder bleiben bis zum entscheidenden Moment anonym.
      10. TAKTISCHE & LOGISCHE REINSTE KONSISTENZ (FÄHIGKEITEN & JUTSUS): Die Verwendung von Spezialfähigkeiten oder Ninja-Techniken (z.B. Inos Shintenshin no Jutsu) muss absolut logisch und fehlerfrei durchdacht sein. Wenn ein Jutsu den Körper des Anwenders schutzlos oder ohnmächtig macht, muss im Vornherein logisch sichergestellt sein, dass dieser Körper sicher versteckt und bewacht ist (z.B. versteckt draußen auf einem Ast, bewacht von einer Kameradin wie Hinata, während andere wie Naruto und Sakura das Ziel in Reichweite – z.B. an ein Fenster – locken). Ein plötzliches, unbewachtes Umkippen in einer vollen Menschenmenge ist unlogisch und tabu. Die NPCs planen und handeln klug und professionell.
      11. INNERE MONOLOGE DER NPCS: Bei passenden Gelegenheiten darfst du den inneren Monolog oder die Gedanken der NPCs (kursiv formatiert) beschreiben. Dies gibt Einblick in ihre Gefühle, Zweifel oder Absichten, ohne jedoch einen möglichen Geheimplan vollständig zu enthüllen. Nutze dies, um die Tiefe der Nebencharaktere zu steigern.
      12. ACTIVE TIME EVENTS (ATE): Wie in Final Fantasy IX kannst und sollst du gelegentlich kurze Szenen einbauen, die "währenddessen an einem anderen Ort" mit anderen Charakteren/NPCs geschehen. Beginne solche Abschnitte mit "**[Active Time Event: Titel des Events]**" und trenne sie vom Hauptgeschehen. Das lässt die Welt lebendig wirken, ohne es bei jeder einzelnen Antwort zu erzwingen.
      13. HANDLUNGEN MARKIEREN: Wenn du Handlungen, Bewegungen oder den Gesichtsausdruck beschreibst, umschließe diese bitte mit Sternchen, wie z.B. *Er zieht sein Schwert* oder *schaut böse*. Gesprochener Text bleibt ohne Sterne.
      14. DYNAMISCHES CODEX / LORE UPDATE: Erweitere die Lore-Datenbank (Codex) eigenständig, wenn der Spieler neue Orte entdeckt, bedeutsame Gegenstände erhält, wichtige geschichtliche Ereignisse stattfinden, neue Fraktionen eine Rolle spielen oder neue Gegner/Widersacher/Verbündete (No-Names im Kampf) eingeführt, bekämpft oder benannt werden (z.B. wenn der Spieler nach dem Namen eines No-Names/Gegners fragt oder du ihm einen Namen gibst). Nutze dazu das Format [[LORE_ADD: Gegner | Name | Beschreibung auf Deutsch]] für Gegner oder passende Kategorien wie 'Orte', 'Fraktionen', 'Gegenstände', 'Fähigkeiten', 'Events', 'Weltregeln', 'Charaktere'. Wenn ein bereits existierender, aber bisher geheimer (GEHEIM) Lore-Fakt enthüllt wird, so schalte ihn frei mit dem Format [[LORE_UNLOCK: Name]].
      15. CHARAKTER-WERT-UPDATES: Wenn ein Charakter (Spieler oder NPC) ein neues Detail preisgibt, das im Bogen leer ist oder aktualisiert werden muss (z.B. neues Outfit, Alter bekannt, verbesserte Machtlevel), MUSST du dies sofort aktualisieren mit [[CHAR_SET: Charaktername | Feld=Wert | Feld2=Wert]]. Auch wenn eine komplett neue Figur auftaucht, fülle ihre Felder mit diesem Format!
          > Erlaubte Felder: age, gender, hairColor, eyeColor, build, outfit, role, goal, powerSource, powerCost, techniques, cupSize, chestSize.
          > Kampagnen-Mächte: campaignPowerLevels.Machtname.value oder .potentialMax (z.B. campaignPowerLevels.Mana.value=30). So wird die Machtentwicklung (Wachstum) visualisiert!
      16. UMGANGSFORMEN, ETIKETTE & ANREDE: Beachte die sozialen Rollen und Hierarchien strikt. Wenn ein niederrangiger Charakter (z.B. Schüler, Lehrling, Bürger) einen höherrangigen (z.B. Lehrer/Sensei, König, Meister) nicht mit dem gebührenden Respekt oder der korrekten Anrede (z.B. Sensei, Eure Majestät) anspricht, müssen die NPCs darauf passend reagieren. Sie können Tadel aussprechen, Konsequenzen verhängen oder verärgert reagieren. Gleiches gilt für unangemessene Ausdrucksweise oder mangelnde Etikette.
      17. STRENGES ZITIER- & WIEDERHOLUNGSVERBOT: Du darfst NIEMALS die Worte, Sätze, Aktionen, Fragen oder Ausrufe des Spielers zitieren, wiederholen, umformulieren, umschreiben oder kopieren (auch nicht als wörtliche Rede, Gedanken oder Einleitung). Der Spieler hat seine Nachricht bereits selbst geschrieben/gelesen und will sie unter keinen Umständen in deiner Antwort wiederholt sehen. Beginne deine Antwort direkt mit den unmittelbaren Konsequenzen, NPCs-Reaktionen oder dem weiteren physischen/verbalen Verlauf der Szene. Schreibe absolut keine Einleitung, Zusammenfassung oder Rekapitulation des Spielerbeitrags. Wirf den Leser mitten in die darauffolgende Handlung!
      18. STRENGER GEHEIMNIS- UND SPOILER-SCHUTZ BEI TARNUNGEN UND GEHEIMNISSEN: Erwähne niemals geheime Rollen, verborgene Pläne, verdeckte Zugehörigkeiten oder Undercover-Identitäten von Charakteren direkt oder indirekt in der Narration (z.B. wenn Himiko Frost als Lehrerin auftritt, darfst du sie unter keinen Umständen als "Undercover-Agentin" oder "vermeintliche Lehrerin" bezeichnen, oder durch verdächtige oder unnatürliche Formulierungen ihre Tarnung im Text gefährden, es sei denn, ihre Identität wurde im Handlungsverlauf für die Spielfigur bereits eindeutig und unumstößlich aufgedeckt). Für den Spieler muss sie sich absolut lückenlos und überzeugend wie eine echte Lehrerin verhalten.
      19. INTERAKTIONEN UND DIALOGE ZWISCHEN NPCS: Baue vermehrt lebendige, direkte Dialoge in deine Antworten ein. Lass die anwesenden NPCs nicht nur mit dem Spieler sprechen, sondern auch direkt untereinander interagieren, sich unterhalten, Meinungen austauschen, miteinander diskutieren, scherzen, sich absprechen oder streiten. NPCs sind eigenständige Personen mit Beziehungen zueinander und sollten im Chat aktiv und hörbar miteinander kommunizieren, um Szenen lebendiger und authentischer zu machen.
      20. DYNAMISCHE ZEITSPRÜNGE & STORY-TEMPO: Um Leerlauf und zähe Passagen zu vermeiden, darfst du (und sollst du) eigenständig kleine Zeitsprünge in der Geschichte machen, sobald eine Szene fertig erzählt ist. Wenn der Spieler beispielsweise im Unterricht sitzt und ein Ereignis angekündigt wird, überspringe den restlichen Unterricht oder zähen Alltag und blende direkt zum nächsten spannenden Event, Raumwechsel oder Treffen über. Passe die Zeit im [[STATUS]] Block (z.B. [[STATUS: Zeit=13:30]]) zwingend an, wenn dadurch viel Zeit vergeht!
      21. GEHEIMNISSE & VERBORGENES WISSEN (3-STUFEN-LOGIK): Halte dich strikt an die 3 Stufen des geheimen Wissens. Stufe 1 ist allgemein bekannt. Stufe 2 ist NPCs nicht direkt bekannt, kann aber zu begründetem Verdacht oder Nachforschungen führen. Stufe 3 ist eine ABSOLUTE BLACKBOX für NPCs; NPCs dürfen dieses Wissen unter keinen Umständen in Dialogen, Handlungen oder Gedanken verwenden! Erst wenn der Spieler das Geheimnis im Chat gesteht, oder wenn NPCs durch gesammelte Indizien im Chat eine unumstößliche Schlussfolgerung ziehen, wird dieses Wissen enthüllt. Jedes Meta-Wissen-Bleeding ist strengstens verboten!
      22. GEHEIMNISSE VON CHARAKTEREN & LORE: Die 3-Stufen-Logik gilt auch für NPCs und Lore-Einträge. Verwende dieses Geheimwissen im Chat, um die Charaktere und die Welt lebendig zu gestalten, ohne das Wissen von Stufe 3 an unbeteiligte NPCs durchsickern zu lassen!
      23. BEZIEHUNGEN & VERHALTEN DYNAMISCH ERSTELLEN: Sobald der Spieler/Nutzer einen Charakter zum ersten Mal trifft, ODER wenn ein Charakter einen anderen Charakter trifft, und im Codex (loreDatabase) noch kein Eintrag für ihre Beziehung (relationships) oder ihr Verhalten (conducts) zueinander existiert, MUSST du zwingend ein Beziehungs- und Verhaltens-Update ausgeben!
          Verwende dazu das Format: [[RELATIONSHIP: CharakterA | CharakterB | Typ/Verbindung | Verhalten]]
          Beispiel: Wenn der Spieler "Himiko Frost" trifft und es noch keine Beziehung im Codex gibt, gib aus: [[RELATIONSHIP: Himiko Frost | Spieler | Mentorin | Distanziert aber schützend]] (und am besten auch umgekehrt [[RELATIONSHIP: Spieler | Himiko Frost | Lehrling | Respektvoll aber neugierig]]). Dadurch wird die Beziehung im Codex für beide Seiten eingetragen, beidseitig verknüpft und visuell im Log erfasst!
      24. INVENTAR- & AUSRÜSTUNGSUPDATES: Wenn der Spieler im Verlauf der Geschichte neue Kleidung/Rüstung anzieht, sich umzieht, Waffen ausrüstet/ablegt, Schmuck/Accessoires anlegt oder sonstige Gegenstände in seine Tasche steckt, MUSST du sein Inventar im Logbuch sofort aktualisieren! Nutze dazu zwingend das Format [[INVENTORY_SET: Feld=Wert | Feld2=Wert]].
          > Erlaubte Rüstungs-Felder (Kleidung & Rüstung): armor.head, armor.chest, armor.hands, armor.legs, armor.feet
          > Erlaubte Schmuck-Felder (Schmuck & Accessoires): accessories.finger, accessories.wrist, accessories.waist, accessories.back, accessories.neck
          > Waffen-Aktionen: weapons+=Waffenname (hinzufügen), weapons-=Waffenname (entfernen)
          > Sonstige Gegenstände (Tasche): generalItems+=Gegenstandsname (hinzufügen), generalItems-=Gegenstandsname (entfernen)
          > Vermögen: money=Zahl (z.B. money=150)
          Beispiel: Wenn sich der Spieler umzieht und ein neues Hemd und ein Schwert erhält, gib aus: [[INVENTORY_SET: armor.chest=Weißes Leinenhemd | weapons+=Eisenschwert]]`;

      setMessages(historyToUse);

      const response = await GeminiService.chat(historyToUse, systemInstruction, world.isNsfw, adventure.summaryLog);
      const rawText = response.text || '';
      
      const { cleanedText: statusCleaned, newStatus } = parseStatusUpdates(rawText, statusElements);
      const { cleanedText: finalCleanedText, updatedLore, updatedPlayer, updatedNpcs, notifications, updatedStructuredInventory } = parseLoreAndCharUpdates(statusCleaned, adventure);

      if (notifications.length > 0) {
        setLoreNotifications(prev => [...prev, ...notifications]);
      }

      const newModelMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: finalCleanedText };
      const finalMessages: ChatMessage[] = [...historyToUse, newModelMsg];
      setMessages(finalMessages);
      
      // Update adventure state immediately
      onUpdateAdventure({ 
        ...adventureRef.current, 
        player: updatedPlayer,
        npcs: updatedNpcs,
        statusElements: newStatus, 
        loreDatabase: updatedLore,
        chatHistory: finalMessages,
        structuredInventory: updatedStructuredInventory
      });

      // Update the chronicle summary log asynchronously in background
      GeminiService.extractChronicle(
        adventure.prologue,
        adventure.summaryLog || '',
        finalMessages.slice(-4),
        world.isNsfw
      ).then(newSummary => {
        if (newSummary && newSummary.trim()) {
          onUpdateAdventure({
            ...adventureRef.current,
            player: updatedPlayer,
            npcs: updatedNpcs,
            statusElements: newStatus,
            loreDatabase: updatedLore,
            chatHistory: finalMessages,
            summaryLog: newSummary,
            structuredInventory: updatedStructuredInventory
          });
        }
      }).catch(err => {
        console.error("Chronik-Extraktion fehlgeschlagen:", err);
      });
    } catch (err: any) {
      console.error(err);
      setError("Regenerierung fehlgeschlagen: " + (err?.message || "Fehler"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVisual = async () => {
    setIsGeneratingImg(true);
    try {
      const lastModelMsg = messages.filter(m => m.role === 'model').slice(-1)[0];
      const lastContext = lastModelMsg?.text || adventure.prologue;
      
      // Build a character context string
      const { player, npcs, world } = adventure;
      let charContext = `Hauptcharakter ${player.name}: ${player.appearance.gender}, ${player.appearance.hairColor} Haare, ${player.appearance.eyeColor} Augen, Statur: ${player.appearance.build}, Kleidung: ${player.appearance.outfit || 'Standard'}.`;
      
      // Add NPCs if they are mentioned in the last message
      const mentionedNpcs = npcs.filter(n => lastContext.includes(n.name));
      if (mentionedNpcs.length > 0) {
        charContext += " " + mentionedNpcs.map(n => `NPC ${n.name}: ${n.appearance.gender}, ${n.appearance.hairColor} Haare, ${n.appearance.eyeColor} Augen, Kleidung: ${n.appearance.outfit || 'Standard'}${n.appearance.gender === 'Weiblich' && n.appearance.cupSize && n.appearance.cupSize !== '-' ? `, Körbchen: ${n.appearance.cupSize}` : ''}.`).join(" ");
      }

      // Determine art style based on tags and title/description
      let artStyle = "Realistisch, cineastisch, hoher Detailgrad, atmosphärisch";
      const tags = (world.era || '').toLowerCase();
      const title = (world.title || '').toLowerCase();
      const desc = (world.description || '').toLowerCase();

      if (tags.includes("anime") || tags.includes("manga") || title.includes("dragon ball") || desc.includes("dragon ball") || title.includes("naruto") || title.includes("one piece")) {
        artStyle = "Hochwertiger Anime-Stil, kräftige Farben, dynamische Linienführung, passend zum Genre";
        if (title.includes("dragon ball") || desc.includes("dragon ball")) {
          artStyle += " im Stil von Akira Toriyama (Dragon Ball)";
        }
      } else if (tags.includes("cyberpunk") || desc.includes("cyberpunk")) {
        artStyle = "Cyberpunk-Stil, Neon-Beleuchtung, futuristisch, düster, hoher Kontrast";
      } else if (tags.includes("fantasy") || tags.includes("mittelalter")) {
        artStyle = "Epischer Fantasy-Stil, malerisch, detaillierte Rüstungen und Umgebungen";
      } else if (tags.includes("sci-fi") || tags.includes("zukunft")) {
        artStyle = "Futuristischer Sci-Fi-Stil, sauber, technologisch, weite Landschaften";
      } else if (tags.includes("horror")) {
        artStyle = "Düsterer Horror-Stil, unheimlich, schattig, beklemmende Atmosphäre";
      }

      const prompt = `Ein hochwertiges Bild für das Abenteuer "${world.title}".
      Szenario: ${lastContext}. 
      Charaktere im Bild: ${charContext}
      Stil: ${artStyle}. 
      WICHTIG: Achte auf die Posen und Handlungen der Charaktere wie im Szenario beschrieben. Keine Schrift im Bild.`;

      const imageUrl = await GeminiService.generateImage(prompt, world.isNsfw);
      if (imageUrl) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Die Welt nimmt Gestalt an...', image: imageUrl }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // --- Context-aware reinforcements helpers ---
  const containsReinforcementKeywords = (() => {
    if (!messages || messages.length === 0) return false;
    const lastMsgText = (messages[messages.length - 1].text || '').toLowerCase();
    const keywords = [
      'alarm', 'verstärkung', 'verstärkungen', 'backup', 'wachen', 'wache', 
      'soldaten rufen', 'horde', 'hilferuf', 'unterstützung', 'alarmieren', 
      'guards', 'reinforcement', 'reinforcements'
    ];
    return keywords.some(k => lastMsgText.includes(k));
  })();

  const isLargeNumberAlreadyPresent = (() => {
    const activeHostiles = opponents.filter(o => o.id !== 'custom');
    const hasManySeparateOpponents = activeHostiles.length >= 3;
    const hasLargeCountFodder = opponents.some(o => o.count !== undefined && o.count >= 15);
    return hasManySeparateOpponents || hasLargeCountFodder;
  })();

  const activeLocationName = (() => {
    const locations = (adventure.loreDatabase || []).filter(l => l.category === 'Orte');
    const combinedText = messages.slice(-5).map(m => m.text || '').join(' ').toLowerCase();
    const found = locations.find(loc => combinedText.includes(loc.title.toLowerCase()) || (adventure.prologue || '').toLowerCase().includes(loc.title.toLowerCase()));
    return found ? found.title : null;
  })();

  const potentialHostileNpcs = (adventure.npcs || []).filter(n => n.isHostile && !opponents.some(o => o.id === n.id));

  const thematicPreset1 = (() => {
    const desc = (adventure.world?.description || '').toLowerCase();
    const title = (adventure.world?.title || '').toLowerCase();
    
    if (desc.includes('cyberpunk') || desc.includes('sci-fi') || desc.includes('zukunft') || title.includes('cyber') || title.includes('future')) {
      return { name: 'Sicherheits-Drohnen', count: 12, hp: 60, role: 'Fodder Drohnen' };
    } else if (desc.includes('pirat') || title.includes('pirat') || desc.includes('see') || desc.includes('meer') || desc.includes('ocean')) {
      return { name: 'Marine-Infanteristen', count: 15, hp: 80, role: 'Kanonenfutter Marine' };
    } else if (desc.includes('vampir') || desc.includes('gothic') || desc.includes('schloss') || desc.includes('blut')) {
      return { name: 'Fledermaus-Schwarm', count: 20, hp: 50, role: 'Dunkle Kreaturen' };
    } else if (desc.includes('magie') || desc.includes('fantasy') || desc.includes('magier') || desc.includes('beschwör')) {
      return { name: 'Elementar-Golems', count: 5, hp: 150, role: 'Magische Wächter' };
    }
    return { name: 'Wachsoldaten', count: 10, hp: 90, role: 'Patrouillen-Trupp' };
  })();

  const thematicPreset2 = (() => {
    const desc = (adventure.world?.description || '').toLowerCase();
    const title = (adventure.world?.title || '').toLowerCase();
    
    if (desc.includes('cyberpunk') || desc.includes('sci-fi') || desc.includes('zukunft') || title.includes('cyber') || title.includes('future')) {
      return { name: 'Konzern-Spezialeinheit', count: undefined, hp: 160, role: 'Elite Verstärkung' };
    } else if (desc.includes('pirat') || title.includes('pirat') || desc.includes('see') || desc.includes('meer')) {
      return { name: 'Marine-Offizier', count: undefined, hp: 200, role: 'Elite Anführer' };
    } else if (desc.includes('vampir') || desc.includes('gothic') || desc.includes('schloss')) {
      return { name: 'Blut-Inquisitor', count: undefined, hp: 180, role: 'Blutsauger Elite' };
    } else if (desc.includes('magie') || desc.includes('fantasy')) {
      return { name: 'Erzmagier-Garde', count: undefined, hp: 170, role: 'Zauber-Ritter' };
    }
    return { name: 'Elite-Wachtmeister', count: undefined, hp: 180, role: 'Hauptmann der Wache' };
  })();

  const isReinforcementSuggested = containsReinforcementKeywords || isLargeNumberAlreadyPresent;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 relative overflow-hidden">
      {/* Floating Lore-Updates Notifications */}
      {loreNotifications.length > 0 && (
        <div className="absolute top-[88px] right-4 z-50 flex flex-col gap-2 max-w-xs pointer-events-none">
          {loreNotifications.map(notif => (
            <div 
              key={notif.id} 
              className="bg-amber-950/90 border border-amber-500/30 text-amber-100 px-3.5 py-2.5 rounded-xl text-xs shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-right duration-300 pointer-events-auto backdrop-blur-md"
            >
              <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                <i className="fa-solid fa-book-open text-xs"></i>
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[9px] uppercase tracking-wider text-amber-500">
                  {notif.type === 'add' ? 'Neuer Codex-Eintrag!' : 'Codex freigeschaltet!'}
                </div>
                <div className="truncate text-[11px] font-semibold text-slate-200">
                  [{notif.category}] {notif.title}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setLoreNotifications(prev => prev.filter(n => n.id !== notif.id));
                }}
                className="text-slate-500 hover:text-slate-300 font-bold px-1 py-0.5 ml-1.5 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => onViewChange(GameViewMode.HOME)} className="text-slate-400 p-2"><i className="fa-solid fa-chevron-left"></i></button>
          <div className="flex items-center gap-3">
            {adventure.player.image && <img src={adventure.player.image} className="w-8 h-8 rounded-full border border-amber-500/30 object-cover" />}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-fantasy text-amber-500 text-sm sm:text-lg leading-tight truncate max-w-[120px] sm:max-w-[200px]">{adventure.world.title}</h1>
                {adventure.world.isNsfw && (
                  <span className="bg-red-600/20 text-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-500/30">NSFW</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{adventure.player.name}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleResetChat} 
            onMouseLeave={() => setShowResetConfirm(false)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${showResetConfirm ? 'bg-red-600 border-red-500 text-white w-24 rounded-xl' : 'bg-slate-800 border-slate-700 text-red-400 hover:bg-slate-700'}`} 
            title="Zurücksetzen"
          >
            {showResetConfirm ? <span className="text-[10px] font-bold uppercase">Sicher?</span> : <i className="fa-solid fa-rotate-left"></i>}
          </button>
          <button onClick={handleGenerateVisual} disabled={isGeneratingImg} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-indigo-400 transition-colors hover:bg-slate-700">
            <i className={`fa-solid ${isGeneratingImg ? 'fa-spinner animate-spin' : 'fa-image'}`}></i>
          </button>
          <button onClick={() => onViewChange(GameViewMode.STATUS)} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-500 border border-slate-700 shadow-lg transition-colors hover:bg-slate-700" title="Logbuch">
            <i className="fa-solid fa-scroll"></i>
          </button>
        </div>
      </div>

      <div className="z-20 flex gap-2 overflow-x-auto p-2 px-4 bg-slate-900/50 border-b border-slate-800/50">
        {adventure.statusElements?.map((el, idx) => (
          <div key={`${el.id || el.label}-${idx}`} className="flex-shrink-0 bg-slate-800/80 border border-slate-700/50 rounded-lg px-4 py-1.5 flex flex-col items-center min-w-[120px] shadow-sm">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{el.label}</span>
            <div className="flex items-center gap-1.5 mt-0.5 w-full justify-center">
              {el.label === 'Zeit' && <i className="fa-regular fa-clock text-[10px] text-amber-500/50 shrink-0"></i>}
              {el.label === 'Ausdauer' && <i className="fa-solid fa-bolt text-[10px] text-amber-500/50 shrink-0"></i>}
              <input
                type="text"
                value={el.value || ''}
                onChange={(e) => {
                  const newVal = e.target.value;
                  const updatedStatus = (adventure.statusElements || []).map(item => 
                    (item.id === el.id || item.label === el.label) ? { ...item, value: newVal } : item
                  );
                  const updatedInitialStatus = (adventure.initialStatusElements || []).map(item => 
                    (item.id === el.id || item.label === el.label) ? { ...item, value: newVal } : item
                  );
                  onUpdateAdventure({
                    ...adventure,
                    statusElements: updatedStatus,
                    initialStatusElements: updatedInitialStatus.length > 0 ? updatedInitialStatus : updatedStatus
                  });
                }}
                className="bg-transparent text-amber-400 font-bold text-center text-sm w-full max-w-[100px] focus:bg-slate-950/40 rounded border border-transparent focus:border-amber-500/30 px-1 py-0.5 outline-none transition-all placeholder:text-slate-600"
                placeholder="Wert..."
              />
            </div>
          </div>
        ))}
      </div>

      {!isCombatActive ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 z-10 relative">
            {messages.map((msg, idx) => {
              const isLastMessage = idx === messages.length - 1;
              const isModelMsg = msg.role === 'model';
              const isRegeneratable = isLastMessage && isModelMsg && msg.id !== 'prologue-msg' && msg.id !== 'first-msg';

              return (
                <div key={msg.id || `chat-msg-${idx}`} className="flex flex-col gap-1.5">
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                    <div className={`max-w-[85%] rounded-2xl shadow-xl overflow-hidden relative ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none p-4 text-[15px] md:text-[16px]' : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none italic'} ${isRegeneratable ? 'pb-8' : ''}`}>
                      {msg.image && <img src={msg.image} className="w-full aspect-video object-cover mb-3" />}
                      {msg.role === 'model' ? (
                        <div className="p-4 markdown-body text-slate-300 space-y-4 text-[15px] md:text-[16px] leading-relaxed">
                          <ReactMarkdown 
                            components={{
                              strong: ({node, ...props}) => {
                                const text = String(props.children);
                                const isATE = text.toLowerCase().includes('active time event:');
                                return <strong className={isATE ? "block text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg my-3 uppercase tracking-widest text-xs" : "font-semibold text-slate-100"} {...props} />;
                              },
                              p: ({node, ...props}) => <p className="leading-relaxed" {...props} />
                            }}
                          >{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                      )}

                      {isRegeneratable && (
                        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 animate-in fade-in duration-300 z-10">
                          <button 
                            onClick={handleRegenerate}
                            disabled={isLoading}
                            className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-950/60 hover:bg-slate-950 border border-slate-800 rounded-lg shadow transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            title="Diese Antwort verwerfen und neu generieren"
                          >
                            <i className={`fa-solid fa-arrows-rotate text-[11px] ${isLoading ? 'animate-spin' : ''}`}></i>
                          </button>

                          <button 
                            onClick={handleDeleteLastMessage}
                            onMouseLeave={() => setShowDeleteConfirm(false)}
                            disabled={isLoading}
                            className={`p-1.5 border rounded-lg shadow transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-1 ${
                              showDeleteConfirm 
                                ? 'bg-red-600 border-red-500 text-white text-[10px] font-bold px-2 py-1' 
                                : 'text-red-400/85 hover:text-red-400 bg-slate-950/60 hover:bg-slate-950 border-slate-800'
                            }`}
                            title="Diese Antwort dauerhaft löschen"
                          >
                            <i className="fa-solid fa-trash-can text-[11px]"></i>
                            {showDeleteConfirm && <span className="text-[10px] ml-1">Löschen?</span>}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {isLoading && <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl w-fit animate-pulse flex gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-200"></div></div>}
            <div ref={chatEndRef} />
          </div>

          {/* Aufklappbares JRPG Kampf-Steuerpanel */}
          {isCombatMenuExpanded && (
            <div id="jrpg-combat-menu" className="bg-slate-900/95 border-2 border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-2xl space-y-3 max-w-sm w-[calc(100vw-32px)] absolute bottom-24 left-4 animate-in slide-in-from-bottom duration-200 z-30">
              {/* Kopfzeile */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <i className={`fa-solid ${isCombatActive ? 'fa-hand-fist text-red-500' : 'fa-circle-info text-amber-500'}`}></i>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 font-sans">
                    {isCombatActive ? 'JRPG Kampf-Interface' : 'Kampf vorbereiten'}
                  </span>
                </div>
                <button 
                  onClick={() => setIsCombatMenuExpanded(false)}
                  className="text-slate-500 hover:text-slate-300 transition-colors text-xs p-1"
                >
                  ✕
                </button>
              </div>

              {/* SubMenu: START (Wenn Kampf inaktiv) */}
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Wähle einen anwesenden Gegner oder eine Gruppe aus den jüngsten Chat-Ereignissen, um den Kampf zu starten:
                </p>

                {/* Erkannte anwesende Gegner und Gruppen */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {detectedEnemies.length > 0 ? (
                    detectedEnemies.map(enemy => (
                      <button
                        key={enemy.id}
                        onClick={() => {
                          if (enemy.type === 'npc') {
                            startCombat(enemy.id, enemy.name);
                          } else {
                            startCombat('custom', enemy.name);
                          }
                        }}
                        className="w-full text-left p-2.5 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 hover:border-red-500/50 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-red-500 group-hover:scale-110 transition-transform text-xs">
                            {enemy.type === 'npc' ? '👤' : enemy.type === 'group' ? '👥' : '⚔️'}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-200">
                              {enemy.name}
                            </div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                              {enemy.subtitle || (enemy.type === 'npc' ? 'Anwesender Charakter' : 'Erkannte Bedrohung / Gruppe')}
                            </div>
                          </div>
                        </div>
                        <i className="fa-solid fa-chevron-right text-[10px] text-red-500/60 group-hover:translate-x-0.5 transition-transform"></i>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-3 text-[10px] text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-900">
                      Keine anwesenden Bedrohungen im Chat erkannt.
                    </div>
                  )}
                </div>

                {/* Trennlinie */}
                <div className="flex items-center gap-2 my-2">
                  <div className="h-px bg-slate-800 flex-1"></div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Oder manuell eingeben</span>
                  <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <div className="space-y-1">
                  <input
                    type="text"
                    value={customEnemyName}
                    onChange={e => setCustomEnemyName(e.target.value)}
                    placeholder="z.B. Großer Bär, Ninja-Assassinen, Banditen..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-amber-500 placeholder-slate-600"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!customEnemyName.trim()) {
                      setError("Bitte gib einen Gegner an!");
                      return;
                    }
                    
                    startCombat('custom', customEnemyName);
                  }}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <i className="fa-solid fa-crosshairs"></i> Kampf beginnen
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 pb-6 bg-gradient-to-t from-slate-950 to-transparent z-20">
            {error && (
              <div className="mb-2 p-2 bg-red-950/90 border border-red-800/40 rounded-xl text-red-200 text-xs flex justify-between items-center shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-200 gap-2">
                <span className="flex-1 pr-2">{error}</span>
                <button 
                  onClick={() => {
                    setError(null);
                    handleRegenerate();
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold transition-all shrink-0 uppercase tracking-wider"
                >
                  Wiederholen
                </button>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 font-bold px-2 py-1">✕</button>
              </div>
            )}
            
            {/* Icon-Leiste über dem Chat-Eingabefeld */}
            <div className="flex items-center gap-3 mb-2 px-3">
              <button 
                id="combat-toggle-btn"
                onClick={() => {
                  setIsCombatMenuExpanded(!isCombatMenuExpanded);
                  if (!isCombatMenuExpanded) {
                    setCombatSubMenu(isCombatActive ? 'main' : 'start');
                  }
                }}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                  isCombatActive 
                    ? 'bg-red-600 border-red-400 animate-pulse text-white shadow-red-900/50' 
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-500 shadow-slate-950/50'
                }`}
                title={isCombatActive ? "JRPG Kampf-Steuerung" : "Kampf-Modus starten"}
              >
                <i className="fa-solid fa-bolt text-sm"></i>
              </button>
     
              <div className="w-px h-6 bg-slate-700 mx-1"></div>

              {!isCombatActive && (
                <>
                  <button
                    type="button"
                    onClick={() => handleRestAction('short')}
                    className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 hover:bg-emerald-950 hover:border-emerald-500 hover:text-emerald-350 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                    title="Kurze Rast einlegen (+30% HP, MP & Kräfte)"
                  >
                    <i className="fa-solid fa-mug-hot group-hover:-translate-y-0.5 transition-transform text-sm"></i>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRestAction('long')}
                    className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 hover:bg-indigo-950 hover:border-indigo-500 hover:text-indigo-350 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                    title="Schlafen / Lange Rast (+100% HP, MP, Ausdauer & Kräfte)"
                  >
                    <i className="fa-solid fa-bed group-hover:-translate-y-0.5 transition-transform text-sm"></i>
                  </button>
                  
                  <div className="w-px h-6 bg-slate-700 mx-1"></div>
                </>
              )}
     
              <button
                onClick={() => insertFormatting('*', '*')}
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                title="Handlung beschreiben (*...*)"
              >
                <i className="fa-solid fa-person-running group-hover:-translate-y-0.5 transition-transform"></i>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => { setShowEmotionMenu(!showEmotionMenu); setShowToneMenu(false); setShowFavoritesMenu(false); }}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                  title="Gesichtsausdruck beschreiben"
                >
                  <i className="fa-regular fa-face-smile group-hover:-translate-y-0.5 transition-transform"></i>
                </button>
                {showEmotionMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-1.5 px-3 text-[10px] uppercase font-bold text-slate-400 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                      <span>Emotion</span>
                      <span className="text-[8px] text-slate-500 lowercase">oft benutzt oben</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {sortedEmotions.map(e => {
                        const count = emotionUsage[e] || 0;
                        return (
                          <button
                            key={e}
                            onClick={() => {
                              insertFormatting(`[schaut ${e}] `, '');
                              handleSelectEmotion(e);
                              setShowEmotionMenu(false);
                            }}
                            className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <span className="flex items-center justify-between w-full">
                              <span>{e}</span>
                              {count > 0 && <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 font-mono">🔥 {count}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => { setShowToneMenu(!showToneMenu); setShowEmotionMenu(false); setShowFavoritesMenu(false); }}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                  title="Stimme/Tonart beschreiben"
                >
                  <i className="fa-solid fa-microphone-lines group-hover:-translate-y-0.5 transition-transform"></i>
                </button>
                {showToneMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-1.5 px-3 text-[10px] uppercase font-bold text-slate-400 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                      <span>Tonart</span>
                      <span className="text-[8px] text-slate-500 lowercase">oft benutzt oben</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {sortedTones.map(e => {
                        const count = toneUsage[e] || 0;
                        return (
                          <button
                            key={e}
                            onClick={() => {
                              insertFormatting(`[spricht ${e}] `, '');
                              handleSelectTone(e);
                              setShowToneMenu(false);
                            }}
                            className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <span className="flex items-center justify-between w-full">
                              <span>{e}</span>
                              {count > 0 && <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 font-mono">🔥 {count}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowFavoritesMenu(!showFavoritesMenu); setShowEmotionMenu(false); setShowToneMenu(false); }}
                  className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                  title="Lieblingstechniken (Favoriten)"
                >
                  <i className="fa-solid fa-star text-amber-400 group-hover:scale-110 transition-transform"></i>
                </button>
                {showFavoritesMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="p-2.5 px-3 text-[10px] uppercase font-extrabold text-amber-500 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><i className="fa-solid fa-star text-amber-400"></i> Favoriten-Techniken</span>
                      <button onClick={() => setShowFavoritesMenu(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 bg-slate-950/40">
                      {getFavoriteTechniques().length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 italic leading-relaxed">
                          Keine Favoriten markiert.<br />
                          Markiere Techniken im <span className="text-amber-500/95 font-bold">Logbuch</span> (oben rechts) mit dem Stern-Symbol.
                        </div>
                      ) : (
                        getFavoriteTechniques().map((tech, i) => (
                          <button
                            key={tech.id || i}
                            type="button"
                            onClick={() => {
                              insertFormatting(`*${tech.name}*`, '');
                              setShowFavoritesMenu(false);
                            }}
                            className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-850/60 hover:border-amber-500/30 transition-all flex flex-col gap-0.5"
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="font-bold text-xs text-slate-200">{tech.name}</span>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400 font-bold">Lv. {tech.level || 1}</span>
                            </div>
                            {tech.description && (
                              <p className="text-[10px] text-slate-400 leading-tight line-clamp-2 italic">{tech.description}</p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative flex items-center gap-2 bg-slate-900/80 border border-slate-700/50 rounded-3xl p-1 shadow-2xl backdrop-blur-md">
              <AutoExpandingTextarea 
                ref={textareaRef}
                rows={1} 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                placeholder="Deine Handlung..." 
                className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white outline-none resize-none placeholder:text-slate-500 max-h-40" 
              />
              <button onClick={handleSend} disabled={isLoading || !inputText.trim()} className="w-10 h-10 bg-amber-600 hover:bg-amber-500 rounded-full text-white disabled:opacity-50 flex items-center justify-center shadow-md active:scale-90 transition-all flex-shrink-0"><i className="fa-solid fa-paper-plane text-sm"></i></button>
            </div>
          </div>
        </>
      ) : (
        /* SPEZIELLES DEDIZIERTES KAMPFFELD (MULTI-PANEL COMBAT STAGE) */
        <div className="flex-1 flex flex-col md:flex-row p-3 gap-3 overflow-hidden z-10 relative bg-slate-950/40">
          
          {/* LINKS: LISTE DER VERBÜNDETEN (ALLIES) */}
          <div className="flex-shrink-0 md:w-64 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl backdrop-blur-sm overflow-y-auto max-h-[30vh] md:max-h-full">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 shrink-0">
              <span className="p-1 px-1.5 bg-emerald-500/15 text-emerald-400 font-extrabold uppercase text-[9px] rounded-lg tracking-wider">Allies</span>
              <span className="text-xs font-bold text-slate-300 font-sans tracking-wide">Verbündete</span>
            </div>
            
            {/* Spieler Status Card */}
            <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-emerald-500 text-sm">🟢</span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-white truncate">{adventure.player.name}</div>
                </div>
              </div>
              
              {/* HP Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold text-emerald-400">{adventure.world.healthLabel || 'Gesundheit'}</span>
                  <span>{playerHp}/{playerMaxHp}</span>
                </div>
                <div className="h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    style={{ width: `${Math.min(100, Math.max(0, (playerHp / playerMaxHp) * 100))}%` }}
                  ></div>
                </div>
              </div>

              {/* Cost Resources (e.g. MP, SP, Stamina) */}
              {adventure.world.costResources && adventure.world.costResources.length > 0 ? (
                <div className="space-y-3.5 pt-2 border-t border-slate-900/60">
                  {adventure.world.costResources.map((res, index) => {
                    const radarName = res.radarPowerName;
                    const cPower = radarName ? getPowerLevel(radarName) : null;
                    
                    const isPrimary = index === 0;
                    const isBeginning = messages.length <= 2;
                    const max = isPrimary ? playerMaxMp : (cPower?.value ?? res.baseMax ?? 100);
                    const val = isPrimary 
                      ? (isBeginning ? playerMaxMp : playerMp)
                      : (cPower?.value ?? max);

                    const matchingAbility = adventure.player.abilities?.find(
                      a => (a.cost || '').trim().toLowerCase() === res.name.trim().toLowerCase()
                    );

                    return (
                      <div key={res.id || index} className="space-y-1.5">
                        <div className="flex justify-between items-end text-xs font-mono text-slate-400">
                          <div className="flex flex-col">
                            {matchingAbility && (
                              <span className="font-extrabold text-amber-500 uppercase tracking-wider text-[9.5px] leading-none mb-0.5">
                                {matchingAbility.source}
                              </span>
                            )}
                            <span className="font-bold text-cyan-400 leading-none">{res.name}</span>
                          </div>
                          <span className="font-semibold text-slate-300">{val}/{max}</span>
                        </div>
                        <div className="h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                            style={{ width: `${Math.min(100, Math.max(0, (val / max) * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5 pt-2 border-t border-slate-900/60">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span className="font-bold text-blue-400">MP / Fokus</span>
                    <span>{playerMp}/{playerMaxMp}</span>
                  </div>
                  <div className="h-2.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-300 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                      style={{ width: `${Math.min(100, Math.max(0, (playerMp / playerMaxMp) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Other friendly party members */}
            <div className="flex-1 space-y-4">
              {(() => {
                const activeCompanions = (adventure.npcs || [])
                  .filter(n => !n.isHostile)
                  .filter(isNpcCurrentlyPresent)
                  .filter(n => !opponents.some(o => {
                    const oName = o.name.toLowerCase().trim();
                    const nName = n.name.toLowerCase().trim();
                    return o.id === n.id || oName === nName || oName.includes(nName) || nName.includes(oName);
                  }));
                
                if (activeCompanions.length === 0) {
                  return (
                    <div className="space-y-1.5">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Gefährten</div>
                      <div className="text-[10px] text-slate-500 italic px-1 leading-snug">
                        Keine Gefährten in dieser Szene anwesend.
                      </div>
                    </div>
                  );
                }

                // If player belongs to a faction, separate companion list into same faction and other/independent
                const pFaction = adventure.player.appearance?.faction?.trim().toLowerCase();
                const codexFactions = (adventure.loreDatabase || []).filter(item => item.category === 'Fraktionen');

                if (pFaction) {
                  const sameFactionCompanions = activeCompanions.filter(c => c.appearance?.faction?.trim().toLowerCase() === pFaction);
                  const otherCompanions = activeCompanions.filter(c => c.appearance?.faction?.trim().toLowerCase() !== pFaction);

                  return (
                    <div className="space-y-4">
                      {sameFactionCompanions.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest px-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            🟢 {adventure.player.appearance?.faction} (Bündnis)
                          </div>
                          {sameFactionCompanions.map(npc => (
                            <div key={npc.id} className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2 flex items-center gap-2">
                              {npc.image ? (
                                <img src={npc.image} className="w-6 h-6 rounded-full object-cover border border-emerald-800" />
                              ) : (
                                <span className="text-xs">🤝</span>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-bold text-emerald-200 truncate">{npc.name}</div>
                                <div className="text-[9px] text-slate-400 truncate leading-none">{npc.role || 'Fraktionsmitarbeiter'}</div>
                              </div>
                              <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0">Bündnis</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {otherCompanions.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Neutrale Gefährten</div>
                          {otherCompanions.map(npc => {
                            const npcFaction = npc.appearance?.faction?.trim();
                            return (
                              <div key={npc.id} className="bg-slate-950/40 border border-slate-850 rounded-lg p-2 flex items-center gap-2">
                                {npc.image ? (
                                  <img src={npc.image} className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <span className="text-xs">🧑‍🤝‍🧑</span>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-[11px] font-bold text-slate-300 truncate">{npc.name}</div>
                                  <div className="text-[9px] text-slate-500 truncate leading-none">
                                    {npcFaction ? `🎭 ${npcFaction}` : npc.role || 'Gefährte'}
                                  </div>
                                </div>
                                <span className="text-[7.5px] bg-slate-950 text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded shrink-0 font-bold uppercase font-mono">Aktiv</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // If player is factionless, check if there are 2 or more factions total in the scene (including companions)
                const activeCompanionFactions = Array.from(new Set(activeCompanions.map(c => c.appearance?.faction?.trim()).filter(Boolean) as string[]));
                
                // Active opponents list during combat to count factions
                const activeOpponentsList = opponents.filter(o => {
                  if (o.id === 'custom' || o.id === selectedEnemyId || o.isFodder) return true;
                  const dbNpc = adventure.npcs.find(n => n.id === o.id);
                  if (!dbNpc) return true;
                  return isNpcCurrentlyPresent(dbNpc);
                });

                const getOpponentFactionName = (o: { id: string; name: string; role?: string }) => {
                  const dbNpc = adventure.npcs.find(n => n.id === o.id);
                  if (dbNpc && dbNpc.appearance?.faction) return dbNpc.appearance.faction.trim();
                  const found = codexFactions.find(f => 
                    o.name.toLowerCase().includes(f.title.toLowerCase()) || 
                    (o.role || '').toLowerCase().includes(f.title.toLowerCase())
                  );
                  return found ? found.title.trim() : '';
                };

                const activeOpponentFactions = Array.from(new Set(activeOpponentsList.map(o => getOpponentFactionName(o)).filter(Boolean)));
                const allFactionsInScene = Array.from(new Set([...activeCompanionFactions, ...activeOpponentFactions]));

                if (allFactionsInScene.length >= 2) {
                  // We have a complex multi-faction scene and player is independent! Group companions by faction!
                  const groupedCompanions: Record<string, typeof activeCompanions> = {};
                  activeCompanions.forEach(c => {
                    const fName = c.appearance?.faction?.trim() || 'Fraktionslos / Neutral';
                    if (!groupedCompanions[fName]) groupedCompanions[fName] = [];
                    groupedCompanions[fName].push(c);
                  });

                  return (
                    <div className="space-y-4">
                      {Object.entries(groupedCompanions).map(([factionName, compList]) => (
                        <div key={factionName} className="space-y-1.5">
                          <div className="text-[9px] font-bold text-amber-500/80 uppercase tracking-widest px-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            🛡️ Frak: {factionName}
                          </div>
                          {compList.map(npc => (
                            <div key={npc.id} className="bg-slate-950/60 border border-slate-850 rounded-lg p-2 flex items-center gap-2">
                              {npc.image ? (
                                <img src={npc.image} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <span className="text-xs">🧑‍🤝‍🧑</span>
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-[11px] font-bold text-slate-300 block truncate">{npc.name}</span>
                                <span className="text-[9px] text-slate-500 block truncate leading-tight">{npc.role || 'Gefährte'}</span>
                              </div>
                              <span className="text-[7.5px] bg-emerald-950/30 text-emerald-400 border border-emerald-900 px-1 py-0.5 rounded font-extrabold uppercase shrink-0">Bündnis</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                }

                // Default companion layout when no special faction separation matches
                return (
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Gefährten</div>
                    {activeCompanions.map(npc => (
                      <div key={npc.id} className="bg-slate-950/40 border border-slate-850 rounded-lg p-2 flex items-center gap-2">
                        {npc.image ? (
                          <img src={npc.image} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <span className="text-xs">🧑‍🤝‍🧑</span>
                        )}
                        <div className="min-w-0 flex-1 bg-transparent">
                          <div className="text-[11px] font-bold text-slate-300 truncate">{npc.name}</div>
                          <div className="text-[9px] text-slate-500 truncate leading-none">
                            {npc.appearance?.faction ? `🛡️ ${npc.appearance.faction}` : npc.role}
                          </div>
                        </div>
                        <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded border border-emerald-900 shrink-0 font-bold uppercase font-mono">Aktiv</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* MITTE: ENGE BEGEGNUNG CHAT LOG & RPG EINGABEDECK */}
          <div className="flex-1 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Scrollable log listing recent message elements */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[160px]">
              <div className="text-center pb-2 border-b border-slate-800">
                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">⚔️ Narrativer Kampf-Verlauf ⚔️</span>
              </div>
              
              {messages.slice(-12).map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id || `combat-msg-${idx}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                    <div className={`max-w-[85%] rounded-xl shadow-md p-3.5 text-[14px] md:text-[15px] text-slate-300 ${
                      isUser 
                        ? 'bg-amber-600/15 border border-amber-500/20 rounded-tr-none text-amber-200' 
                        : 'bg-slate-950 border border-slate-850 rounded-tl-none font-sans leading-relaxed'
                    }`}>
                      {msg.image && <img src={msg.image} className="w-full aspect-video object-cover mb-2 rounded-lg" />}
                      {msg.role === 'model' ? (
                        <div className="markdown-body space-y-2 text-slate-300">
                          <ReactMarkdown
                            components={{
                              strong: ({node, ...props}) => {
                                const text = String(props.children);
                                const isATE = text.toLowerCase().includes('active time event:');
                                return <strong className={isATE ? "block text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg my-1.5 uppercase tracking-widest text-xs" : "font-semibold text-white"} {...props} />;
                              },
                              p: ({node, ...props}) => <p className="leading-relaxed" {...props} />
                            }}
                          >{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap italic font-sans">{msg.text}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isLoading && (
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl w-fit animate-pulse flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-200"></div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase ml-1">DM agiert...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* MECHANICAL DECISION GRID COCKPIT */}
            <div className="bg-slate-950 border-t border-slate-800 p-4 space-y-3 shrink-0">
              {/* Cockpit Submenu state header */}
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                <span className="tracking-widest uppercase text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-gamepad text-amber-500"></i>
                  {combatSubMenu === 'main' && '⚔️ KAMPF-ENTSCHEIDUNGEN'}
                  {combatSubMenu === 'skills' && '🔮 SPEZIAL-FÄHIGKEITEN'}
                  {combatSubMenu === 'defend' && '🛡️ DEFENSIVE STELLUNGEN'}
                  {combatSubMenu === 'items' && '🎒 VERWENDBARE GEGENSTÄNDE'}
                </span>
                {combatSubMenu !== 'main' && (
                  <button 
                    onClick={() => setCombatSubMenu('main')}
                    className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 active:scale-95 transition-all text-[9.5px]"
                  >
                    ← HAUPTMENÜ
                  </button>
                )}
              </div>

              {/* Action options contents */}
              {combatSubMenu === 'main' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <button
                    onClick={() => {
                      setCombatSubMenu('attack');
                    }}
                    disabled={isLoading}
                    className="py-3 px-2 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-900/30 hover:text-red-200 hover:border-red-500 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 shadow"
                  >
                    <span className="text-base">⚔️</span>
                    Angriff
                  </button>

                  <button
                    onClick={() => setCombatSubMenu('skills')}
                    disabled={isLoading}
                    className="py-3 px-2 bg-indigo-950/20 border border-indigo-900/40 text-indigo-400 hover:bg-indigo-900/30 hover:text-indigo-200 hover:border-indigo-500 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 shadow"
                  >
                    <span className="text-base">🔮</span>
                    Fähigkeit
                  </button>

                  <button
                    onClick={() => setCombatSubMenu('defend')}
                    disabled={isLoading}
                    className="py-3 px-2 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-200 hover:border-emerald-500 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 shadow"
                  >
                    <span className="text-base">🛡️</span>
                    Verteidigung
                  </button>

                  <button
                    onClick={() => setCombatSubMenu('items')}
                    disabled={isLoading}
                    className="py-3 px-2 bg-amber-950/20 border border-amber-900/40 text-amber-500 hover:bg-amber-900/30 hover:text-amber-200 hover:border-amber-500 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 shadow"
                  >
                    <span className="text-base">🎒</span>
                    Trank / Item
                  </button>
                </div>
              ) : combatSubMenu === 'attack' ? (
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-between">
                    <span>⚔️ Freies Kampf-Manöver formen</span>
                    <span className="text-slate-500 font-mono text-[9px] lowercase italic">Formuliere deine eigene Aktion komplett frei!</span>
                  </div>

                  {/* High Quality freeform text box front & center */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex flex-col gap-3 shadow-inner">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-pen-nib text-red-500"></i> Beschreibe deinen Angriff/Spezialaktion:
                      </label>
                      <textarea
                        value={customAttackText}
                        onChange={(e) => setCustomAttackText(e.target.value)}
                        placeholder="z.B. Ich entfessle meinen Eis-Atem gegen die Marine-Soldaten x50, friere einen Teil ein und weiche geschickt rückwärts aus..."
                        disabled={isLoading}
                        rows={3}
                        className="w-full bg-slate-950/95 border border-slate-800 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/30 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none transition-all font-sans resize-none"
                      />
                    </div>

                    {/* Maneuver Class Selectors */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!customAttackText.trim()) return;
                          const isHero = adventure.world.isHeroic !== false;
                          const minDmg = isHero ? 18 : 10;
                          const maxDmg = isHero ? 28 : 16;
                          const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                          handleCombatAction('attack', customAttackText.trim(), dmg, 0);
                        }}
                        disabled={isLoading || !customAttackText.trim()}
                        className="p-2.5 bg-red-950/15 hover:bg-red-900/30 border border-red-900/40 text-left text-slate-200 rounded-lg transition-all flex flex-col justify-between h-14 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-850 group active:scale-95 text-xs"
                        title="Einfacher physischer Angriff (0 MP)"
                      >
                        <span className="text-[10px] font-extrabold text-red-400 group-hover:text-red-300">🗡️ Physisch</span>
                        <span className="text-[8px] text-slate-500 leading-tight">Mittlerer Schaden, 0 MP.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!customAttackText.trim()) return;
                          const isHero = adventure.world.isHeroic !== false;
                          const minDmg = isHero ? 32 : 18;
                          const maxDmg = isHero ? 48 : 26;
                          const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                          handleCombatAction('attack', `Spezialtechnik entfesselt: "${customAttackText.trim()}"`, dmg, 15);
                        }}
                        disabled={isLoading || !customAttackText.trim() || playerMp < 15}
                        className="p-2.5 bg-indigo-950/15 hover:bg-indigo-900/30 border border-indigo-900/40 text-left text-slate-200 rounded-lg transition-all flex flex-col justify-between h-14 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-850 group active:scale-95 text-xs"
                        title="Starke Spezialkraft / Teufelsfrucht / Jutsu (15 MP)"
                      >
                        <span className="text-[10px] font-extrabold text-indigo-400 group-hover:text-indigo-300">🔮 Spezialkraft</span>
                        <span className="text-[8px] text-slate-500 leading-tight">Hoher Schaden, kostet 15 MP.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!customAttackText.trim()) return;
                          const isHero = adventure.world.isHeroic !== false;
                          const minDmg = isHero ? 22 : 12;
                          const maxDmg = isHero ? 35 : 18;
                          const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                          handleCombatAction('attack', `Flächenangriff gewirkt: "${customAttackText.trim()}"`, dmg, 12);
                        }}
                        disabled={isLoading || !customAttackText.trim() || playerMp < 12}
                        className="p-2.5 bg-amber-950/15 hover:bg-amber-900/30 border border-amber-900/40 text-left text-slate-200 rounded-lg transition-all flex flex-col justify-between h-14 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-850 group active:scale-95 text-xs"
                        title="Optimal gegen Soldatentrupps / Kanonenfutter (12 MP)"
                      >
                        <span className="text-[10px] font-extrabold text-amber-400 group-hover:text-amber-300">🌀 Flächenangriff</span>
                        <span className="text-[8px] text-slate-500 leading-tight">Gegen Trupps, kostet 12 MP.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!customAttackText.trim()) return;
                          handleCombatAction('defend', customAttackText.trim(), 0, -10);
                        }}
                        disabled={isLoading || !customAttackText.trim()}
                        className="p-2.5 bg-emerald-950/15 hover:bg-emerald-900/30 border border-emerald-900/40 text-left text-slate-200 rounded-lg transition-all flex flex-col justify-between h-14 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-850 group active:scale-95 text-xs"
                        title="Ausweichen / Verteidigen / Taktik (Regeneriert 10 MP)"
                      >
                        <span className="text-[10px] font-extrabold text-emerald-400 group-hover:text-emerald-300">🛡️ Taktik / Deckung</span>
                        <span className="text-[8px] text-slate-500 leading-tight">0 Schaden, +10 MP Reg.</span>
                      </button>
                    </div>

                    {/* Backing label & send row */}
                    <div className="flex justify-between items-center bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-850">
                      <span className="text-[9px] text-slate-500 italic">Tippe oben ein Manöver und klicke einen der 4 Aktionstypen zum Ausführen!</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!customAttackText.trim()) return;
                          const isHero = adventure.world.isHeroic !== false;
                          const minDmg = isHero ? 18 : 10;
                          const maxDmg = isHero ? 28 : 16;
                          const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                          handleCombatAction('attack', customAttackText.trim(), dmg, 0);
                        }}
                        disabled={isLoading || !customAttackText.trim()}
                        className="px-3.5 py-1.5 bg-red-850 hover:bg-red-700 disabled:bg-slate-800 disabled:opacity-45 text-slate-200 disabled:text-slate-500 font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow select-none active:scale-95"
                      >
                        ⚡ Manöver entfesseln
                      </button>
                    </div>
                  </div>
                </div>
              ) : combatSubMenu === 'skills' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                  {getPlayerDetailedSkillsList().length > 0 ? (
                    getPlayerDetailedSkillsList().map((skillObj, idx) => {
                      const skill = skillObj.name;
                      
                      const skillType = skillObj.type || 'Angriff';
                      const skillSubtype = skillObj.subtype || '';
                      
                      // Base modifiers from Type & Subtype
                      let costPercent = 0.20; // default 20%
                      let baseDmg = 35;
                      let dmgMultiplier = 1.0;

                      if (skillType === 'Angriff') {
                        costPercent = 0.20;
                        baseDmg = 35;
                        dmgMultiplier = 1.0;
                        
                        if (skillSubtype.toLowerCase().includes('einzel') || skillSubtype.toLowerCase().includes('nahkampf') || skillSubtype.toLowerCase().includes('single')) {
                          costPercent = 0.15;
                          baseDmg = 30;
                          dmgMultiplier = 0.8;
                        } else if (skillSubtype.toLowerCase().includes('fläch') || skillSubtype.toLowerCase().includes('aoe') || skillSubtype.toLowerCase().includes('fern') || skillSubtype.toLowerCase().includes('area')) {
                          costPercent = 0.25;
                          baseDmg = 45;
                          dmgMultiplier = 1.2;
                        } else if (skillSubtype.toLowerCase().includes('kett') || skillSubtype.toLowerCase().includes('multi') || skillSubtype.toLowerCase().includes('chain')) {
                          costPercent = 0.30;
                          baseDmg = 55;
                          dmgMultiplier = 1.5;
                        }
                      } else if (skillType === 'Transformation') {
                        costPercent = 0.20;
                        baseDmg = 35;
                        dmgMultiplier = 0.8;
                        
                        if (skillSubtype.toLowerCase().includes('modus') || skillSubtype.toLowerCase().includes('form') || skillSubtype.toLowerCase().includes('state')) {
                          costPercent = 0.15;
                          baseDmg = 25;
                          dmgMultiplier = 0.6;
                        } else if (skillSubtype.toLowerCase().includes('teil')) {
                          costPercent = 0.20;
                          baseDmg = 35;
                          dmgMultiplier = 0.8;
                        } else if (skillSubtype.toLowerCase().includes('voll') || skillSubtype.toLowerCase().includes('komplett') || skillSubtype.toLowerCase().includes('full')) {
                          costPercent = 0.30;
                          baseDmg = 50;
                          dmgMultiplier = 1.2;
                        }
                      } else if (skillType === 'Verteidigung') {
                        costPercent = 0.15;
                        baseDmg = 30;
                        dmgMultiplier = 0.8;
                        
                        if (skillSubtype.toLowerCase().includes('schild') || skillSubtype.toLowerCase().includes('barriere') || skillSubtype.toLowerCase().includes('wall')) {
                          costPercent = 0.20;
                          baseDmg = 35;
                          dmgMultiplier = 0.9;
                        } else if (skillSubtype.toLowerCase().includes('parad') || skillSubtype.toLowerCase().includes('konter') || skillSubtype.toLowerCase().includes('counter')) {
                          costPercent = 0.15;
                          baseDmg = 25;
                          dmgMultiplier = 0.7;
                        } else if (skillSubtype.toLowerCase().includes('weich') || skillSubtype.toLowerCase().includes('reflex') || skillSubtype.toLowerCase().includes('dodge')) {
                          costPercent = 0.15;
                          baseDmg = 20;
                          dmgMultiplier = 0.6;
                        }
                      } else if (skillType === 'Support') {
                        costPercent = 0.15;
                        baseDmg = 25;
                        dmgMultiplier = 0.7;
                        
                        if (skillSubtype.toLowerCase().includes('direkt') || skillSubtype.toLowerCase().includes('instant') || skillSubtype.toLowerCase().includes('heil')) {
                          costPercent = 0.20;
                          baseDmg = 30;
                          dmgMultiplier = 0.8;
                        } else if (skillSubtype.toLowerCase().includes('regen') || skillSubtype.toLowerCase().includes('hot') || skillSubtype.toLowerCase().includes('zeit')) {
                          costPercent = 0.15;
                          baseDmg = 25;
                          dmgMultiplier = 0.6;
                        } else if (skillSubtype.toLowerCase().includes('stärk') || skillSubtype.toLowerCase().includes('buff')) {
                          costPercent = 0.15;
                          baseDmg = 20;
                          dmgMultiplier = 0.5;
                        } else if (skillSubtype.toLowerCase().includes('schwäch') || skillSubtype.toLowerCase().includes('debuff')) {
                          costPercent = 0.20;
                          baseDmg = 25;
                          dmgMultiplier = 0.6;
                        }
                      }

                      const isSkillHeal = skillType === 'Support' || skill.toLowerCase().includes('heil') || skill.toLowerCase().includes('medizin') || skill.toLowerCase().includes('regen');

                      // Dynamic calculations based on Kraftquelle and Kosten / Verbrauch
                      const sourceName = skillObj.source;
                      const sourcePower = sourceName ? (adventure.player.campaignPowerLevels?.[sourceName]?.value ?? 0) : 0;
                      
                      const costName = skillObj.cost;
                      const costPower = costName ? (adventure.player.campaignPowerLevels?.[costName]?.value ?? 0) : 0;
                      
                      const resInfo = getResourceValueAndMax(costName);
                      const resMax = resInfo.max || 100;

                      // Base dynamic cost is a percentage of player's actual Max Resource
                      let mpCost = Math.max(5, Math.round(resMax * costPercent));
                      
                      const costDiscount = Math.floor(costPower * 0.25);
                      if (costDiscount > 0) {
                        mpCost = Math.max(5, mpCost - costDiscount);
                      }

                      // Global campaign-mapped cost discount (up to 50% reduction)
                      const campaignCostNames = adventure.world.costPowerNames || [];
                      const campaignCostName = adventure.world.costPowerName;
                      
                      let campaignCostPower = 0;
                      if (campaignCostNames.length > 0) {
                        campaignCostNames.forEach(name => {
                          campaignCostPower += adventure.player.campaignPowerLevels?.[name]?.value ?? 0;
                        });
                      } else if (campaignCostName) {
                        campaignCostPower = adventure.player.campaignPowerLevels?.[campaignCostName]?.value ?? 0;
                      }

                      if (campaignCostPower > 0) {
                        const campaignDiscountFactor = Math.max(0.5, 1 - (campaignCostPower * 0.005));
                        mpCost = Math.max(5, Math.floor(mpCost * campaignDiscountFactor));
                      }

                      const hasEnoughRes = resInfo.value >= mpCost;

                      // Calculate dynamic damage/heal/shield
                      // Scales with Source Power if available, otherwise Cost Power, otherwise default
                      const statLevel = sourcePower > 0 ? sourcePower : (costPower > 0 ? costPower : 50);
                      let dmg = baseDmg + Math.floor(statLevel * dmgMultiplier);
                      
                      const skillLevel = skillObj.level || 1;
                      
                      // Scale power with skill level! Every level above 1 adds +10% scaling bonus
                      const levelBonusFactor = 1 + (skillLevel - 1) * 0.10;
                      dmg = Math.round(dmg * levelBonusFactor);

                      let effectLabel = `~${dmg} Dmg`;
                      if (isSkillHeal) {
                        effectLabel = `+${dmg} HP`;
                      } else if (skillType === 'Verteidigung') {
                        effectLabel = `Schutz (~${dmg})`;
                      } else if (skillType === 'Transformation') {
                        effectLabel = `Boost (~${dmg})`;
                      }

                      return (
                        <button
                          key={`${skill}-${idx}`}
                          onClick={() => handleCombatAction('skill', skill, dmg, mpCost, isSkillHeal, costName)}
                          className={`text-left p-2 rounded-lg text-xs font-semibold border bg-slate-900/60 border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-950/20 text-slate-200 transition-all flex flex-col justify-between shadow-md hover:shadow-indigo-500/10 active:scale-95 duration-100 ${!hasEnoughRes ? 'opacity-40 cursor-not-allowed' : ''}`}
                          disabled={!hasEnoughRes || isLoading}
                        >
                          <div className="font-bold truncate text-[10.5px] text-slate-200 w-full" title={skill}>
                            {skill}
                          </div>
                          <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-slate-800/40 text-[9.5px] font-mono w-full">
                            <span className={isSkillHeal ? "text-emerald-400 font-extrabold" : (skillType === 'Verteidigung' ? "text-blue-400 font-extrabold" : "text-rose-400 font-extrabold")}>
                              {effectLabel}
                            </span>
                            <span className="text-indigo-400 font-bold shrink-0">
                              {mpCost} {costName || 'MP'}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    (() => {
                      const campaignCostNames = adventure.world.costPowerNames || [];
                      const campaignCostName = adventure.world.costPowerName;
                      
                      let campaignCostPower = 0;
                      if (campaignCostNames.length > 0) {
                        campaignCostNames.forEach(name => {
                          campaignCostPower += adventure.player.campaignPowerLevels?.[name]?.value ?? 0;
                        });
                      } else if (campaignCostName) {
                        campaignCostPower = adventure.player.campaignPowerLevels?.[campaignCostName]?.value ?? 0;
                      }

                      const campaignDiscountFactor = campaignCostPower > 0 ? Math.max(0.5, 1 - (campaignCostPower * 0.005)) : 1;
                      const kraftangriffCost = Math.max(5, Math.floor(20 * campaignDiscountFactor));
                      const heilauraCost = Math.max(5, Math.floor(25 * campaignDiscountFactor));
                      
                      return (
                        <>
                          <button
                            onClick={() => handleCombatAction('skill', 'Kraftangriff', 30, kraftangriffCost)}
                            disabled={playerMp < kraftangriffCost || isLoading}
                            className={`text-left p-2 rounded-lg text-xs font-semibold border bg-slate-900/60 border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-950/20 text-slate-200 transition-all flex flex-col justify-between shadow-md hover:shadow-indigo-500/10 active:scale-95 duration-100 ${playerMp < kraftangriffCost ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <div className="font-bold truncate text-[10.5px] text-slate-200 w-full" title="Kraftangriff">
                              Kraftangriff
                            </div>
                            <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-slate-800/40 text-[9.5px] font-mono w-full">
                              <span className="text-rose-400 font-extrabold">~30 Dmg</span>
                              <span className="text-indigo-400 font-bold shrink-0">{kraftangriffCost} MP</span>
                            </div>
                          </button>
                          <button
                            onClick={() => handleCombatAction('skill', 'Heilaura', 35, heilauraCost, true)}
                            disabled={playerMp < heilauraCost || isLoading}
                            className={`text-left p-2 rounded-lg text-xs font-semibold border bg-slate-900/60 border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-950/20 text-slate-200 transition-all flex flex-col justify-between shadow-md hover:shadow-indigo-500/10 active:scale-95 duration-100 ${playerMp < heilauraCost ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <div className="font-bold truncate text-[10.5px] text-slate-200 w-full" title="Heilaura">
                              Heilaura
                            </div>
                            <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-slate-800/40 text-[9.5px] font-mono w-full">
                              <span className="text-emerald-400 font-extrabold">+35 HP</span>
                              <span className="text-indigo-400 font-bold shrink-0">{heilauraCost} MP</span>
                            </div>
                          </button>
                        </>
                      );
                    })()
                  )}
                </div>
              ) : combatSubMenu === 'defend' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['Blocken', 'Ausweichen', 'Parieren', 'Kontern'].map(def => (
                    <button
                      key={def}
                      onClick={() => handleCombatAction('defend', def, 0, 0)}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-emerald-500 hover:bg-emerald-950/10 text-slate-200 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1 shadow-sm"
                      disabled={isLoading}
                    >
                      <span>
                        {def === 'Blocken' && '🛡️'}
                        {def === 'Ausweichen' && '🍃'}
                        {def === 'Parieren' && '⚔️'}
                        {def === 'Kontern' && '⚡'}
                      </span>
                      <span>{def}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                  {adventure.inventory && adventure.inventory.length > 0 ? (
                    adventure.inventory.map((item, idx) => (
                      <button
                        key={`${item}-${idx}`}
                        onClick={() => handleCombatAction('item', item, 45, 0)}
                        className="text-left p-2 rounded-lg text-xs font-semibold border bg-slate-900/45 hover:border-amber-500 hover:bg-amber-950/10 text-slate-200 transition-all flex justify-between items-center"
                        disabled={isLoading}
                      >
                        <span>🎒 {item}</span>
                        <span className="text-[10px] font-mono text-amber-500">Heilt ~45 HP</span>
                      </button>
                    ))
                  ) : (
                    <>
                      <button
                        onClick={() => handleCombatAction('item', 'Heiltrank', 40, 0)}
                        className="text-left p-2 rounded-lg text-xs font-semibold border bg-slate-900/45 hover:border-amber-500 hover:bg-amber-950/10 text-slate-200 transition-all flex justify-between items-center w-full"
                        disabled={isLoading}
                      >
                        <span>🍶 Behelfs-Heiltrank</span>
                        <span className="text-[10px] font-mono text-amber-400">Heilt ~40 HP</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Status banner for the active prefilled combat actions in the queue */}
              {queuedCombatActions.length > 0 ? (
                <div className="bg-slate-900/95 border border-amber-550/40 rounded-xl p-3 space-y-2.5 text-xs animate-in slide-in-from-bottom-2 duration-150 shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-amber-400 uppercase tracking-widest text-[9.5px] flex items-center gap-1.5">
                      <span className="animate-pulse">⚡</span> GELADENE KOMBINATION ({queuedCombatActions.length})
                    </span>
                    <button 
                      onClick={clearCombatActionQueue}
                      className="text-[9px] font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded border border-red-500/20 transition-all"
                    >
                      Alle löschen
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {queuedCombatActions.map((act) => {
                      const isHeal = act.isHeal || act.actionDetail.toLowerCase().includes('heil');
                      return (
                        <div 
                          key={act.id} 
                          className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-200"
                        >
                          <span className="text-xs">
                            {act.actionType === 'attack' && '⚔️'}
                            {act.actionType === 'skill' && '🔮'}
                            {act.actionType === 'defend' && '🛡️'}
                            {act.actionType === 'item' && '🎒'}
                          </span>
                          <span className="font-bold truncate max-w-[120px]">{act.actionDetail}</span>
                          {act.dmgDealt > 0 && (
                            <span className={`font-bold ${isHeal ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isHeal ? '+' : '-'}{act.dmgDealt}
                            </span>
                          )}
                          {act.mpCost > 0 ? (
                            <span className="text-indigo-400 font-bold">{act.mpCost} MP</span>
                          ) : act.mpCost < 0 ? (
                            <span className="text-emerald-400 font-bold">+{Math.abs(act.mpCost)} MP</span>
                          ) : null}
                          <button
                            onClick={() => removeCombatActionFromQueue(act.id)}
                            className="text-slate-500 hover:text-red-400 ml-1.5 hover:bg-slate-900 rounded p-0.5 transition-all w-4 h-4 flex items-center justify-center font-bold"
                            title="Entfernen"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary row */}
                  {(() => {
                    const totalDmg = queuedCombatActions.reduce((sum, a) => sum + (a.isHeal ? 0 : a.dmgDealt), 0);
                    const totalHeal = queuedCombatActions.reduce((sum, a) => sum + (a.isHeal ? a.dmgDealt : 0), 0);
                    const totalMp = queuedCombatActions.reduce((sum, a) => sum + a.mpCost, 0);

                    return (
                      <div className="flex justify-between items-center text-[10px] text-slate-400 bg-slate-950/40 p-1.5 rounded border border-slate-850/80 font-mono">
                        <span>Zusammenfassung:</span>
                        <div className="flex gap-3">
                          {totalDmg > 0 && <span className="text-red-400 font-bold">💥 Schaden: {totalDmg} HP</span>}
                          {totalHeal > 0 && <span className="text-emerald-400 font-bold">💚 Heilung: +{totalHeal} HP</span>}
                          {totalMp > 0 ? (
                            <span className="text-indigo-400 font-bold">🔮 Verbrauch: {totalMp} MP</span>
                          ) : totalMp < 0 ? (
                            <span className="text-emerald-400 font-bold">⚡ MP Reg.: +{Math.abs(totalMp)} MP</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : pendingCombatAction ? (
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150 shadow-inner">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base select-none">
                      {pendingCombatAction.actionType === 'attack' && '⚔️'}
                      {pendingCombatAction.actionType === 'skill' && '🔮'}
                      {pendingCombatAction.actionType === 'defend' && '🛡️'}
                      {pendingCombatAction.actionType === 'item' && '🎒'}
                      {pendingCombatAction.actionType === 'flee' && '🏃'}
                    </span>
                    <div className="text-[10px] text-slate-300 min-w-0 truncate">
                      <span className="font-extrabold text-amber-400 uppercase tracking-wider mr-1.5">Geladen:</span>
                      <span className="font-bold text-slate-100">{pendingCombatAction.actionDetail || 'Standard-Angriff'}</span>
                      <span className="text-slate-600 mx-1.5">|</span>
                      {pendingCombatAction.dmgDealt > 0 && (
                        <span className={`font-bold mr-1.5 ${pendingCombatAction.isHeal ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pendingCombatAction.isHeal ? '💚 +' : '💥 -'}{pendingCombatAction.dmgDealt} HP
                        </span>
                      )}
                      {pendingCombatAction.mpCost > 0 ? (
                        <span className="font-bold text-indigo-400">🔮 {pendingCombatAction.mpCost} MP</span>
                      ) : pendingCombatAction.mpCost < 0 ? (
                        <span className="font-bold text-emerald-400">⚡ +{Math.abs(pendingCombatAction.mpCost)} MP</span>
                      ) : null}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setPendingCombatAction(null);
                      setInputText('');
                    }}
                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-[9.5px] font-bold px-2 py-1 rounded-md border border-slate-800 hover:border-red-900/50 transition-all shrink-0 ml-2"
                  >
                    Verwerfen
                  </button>
                </div>
              ) : null}

              {/* Spezielles Custom-Eingabefeld für Rollenspiel-Eingaben im Kampf */}
              <div className="pt-2.5 border-t border-slate-900 space-y-2">
                {/* Icon-Leiste im Kampf-Modus */}
                <div className="flex items-center gap-2 px-1">
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                    title="Handlung beschreiben (*...*)"
                  >
                    <i className="fa-solid fa-person-running group-hover:-translate-y-0.5 transition-transform text-xs"></i>
                  </button>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowEmotionMenu(!showEmotionMenu); setShowToneMenu(false); setShowFavoritesMenu(false); }}
                      className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                      title="Gesichtsausdruck beschreiben"
                    >
                      <i className="fa-regular fa-face-smile group-hover:-translate-y-0.5 transition-transform text-xs"></i>
                    </button>
                    {showEmotionMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-1.5 px-3 text-[10px] uppercase font-bold text-slate-400 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                          <span>Emotion</span>
                          <span className="text-[8px] text-slate-500 lowercase">oft benutzt oben</span>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {sortedEmotions.map(e => {
                            const count = emotionUsage[e] || 0;
                            return (
                              <button
                                key={e}
                                onClick={() => {
                                  insertFormatting(`[schaut ${e}] `, '');
                                  handleSelectEmotion(e);
                                  setShowEmotionMenu(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                              >
                                <span className="flex items-center justify-between w-full">
                                  <span>{e}</span>
                                  {count > 0 && <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 font-mono">🔥 {count}</span>}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowToneMenu(!showToneMenu); setShowEmotionMenu(false); setShowFavoritesMenu(false); }}
                      className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                      title="Stimme/Tonart beschreiben"
                    >
                      <i className="fa-solid fa-microphone-lines group-hover:-translate-y-0.5 transition-transform text-xs"></i>
                    </button>
                    {showToneMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-1.5 px-3 text-[10px] uppercase font-bold text-slate-400 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                          <span>Tonart</span>
                          <span className="text-[8px] text-slate-500 lowercase">oft benutzt oben</span>
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {sortedTones.map(e => {
                            const count = toneUsage[e] || 0;
                            return (
                              <button
                                key={e}
                                onClick={() => {
                                  insertFormatting(`[spricht ${e}] `, '');
                                  handleSelectTone(e);
                                  setShowToneMenu(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                              >
                                <span className="flex items-center justify-between w-full">
                                  <span>{e}</span>
                                  {count > 0 && <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 font-mono">🔥 {count}</span>}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setShowFavoritesMenu(!showFavoritesMenu); setShowEmotionMenu(false); setShowToneMenu(false); }}
                      className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-all flex items-center justify-center shadow-lg active:scale-95 group"
                      title="Lieblingstechniken (Favoriten)"
                    >
                      <i className="fa-solid fa-star text-amber-400 group-hover:scale-110 transition-transform text-xs"></i>
                    </button>
                    {showFavoritesMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-72 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        <div className="p-2.5 px-3 text-[10px] uppercase font-extrabold text-amber-500 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><i className="fa-solid fa-star text-amber-400"></i> Favoriten-Techniken</span>
                          <button onClick={() => setShowFavoritesMenu(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 bg-slate-950/40">
                          {getFavoriteTechniques().length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-500 italic leading-relaxed">
                              Keine Favoriten markiert.<br />
                              Markiere Techniken im <span className="text-amber-500/95 font-bold">Logbuch</span> (oben rechts) mit dem Stern-Symbol.
                            </div>
                          ) : (
                            getFavoriteTechniques().map((tech, i) => (
                              <button
                                key={tech.id || i}
                                type="button"
                                onClick={() => {
                                  insertFormatting(`*${tech.name}*`, '');
                                  setShowFavoritesMenu(false);
                                }}
                                className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-850/60 hover:border-amber-500/30 transition-all flex flex-col gap-0.5"
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className="font-bold text-xs text-slate-200">{tech.name}</span>
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400 font-bold">Lv. {tech.level || 1}</span>
                                </div>
                                {tech.description && (
                                  <p className="text-[10px] text-slate-400 leading-tight line-clamp-2 italic">{tech.description}</p>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 items-center bg-slate-900 border border-slate-800 rounded-xl p-1.5 focus-within:border-amber-500/50 transition-all">
                  <input
                    id="combat-input-field"
                    type="text"
                    value={inputText}
                    placeholder="Eigene, kreative Rollenspiel-Kampfaktion beschreiben..."
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSend())}
                    className="flex-1 bg-transparent border-none text-xs text-white outline-none px-2 py-1 placeholder:text-slate-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !inputText.trim()}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-all shadow active:scale-95 disabled:opacity-40"
                  >
                    Ausführen
                  </button>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
                  <span>Wähle eine Aktion oben oder schreibe deine individuelle Reaktion frei.</span>
                  <button 
                    onClick={() => {
                      setIsCombatActive(false);
                      setIsCombatMenuExpanded(false);
                      setPendingCombatAction(null);
                    }}
                    className="text-red-500 hover:text-red-400 font-bold active:scale-95 text-[9.5px]"
                  >
                    ❌ KAMPF ABBRECHEN
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RECHTS: GEGNERLISTE (ENEMIES / THREATS) */}
          <div className="flex-shrink-0 md:w-64 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl backdrop-blur-sm overflow-y-auto max-h-[40vh] md:max-h-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 bg-red-500/15 text-red-500 font-extrabold uppercase text-[9px] rounded-lg tracking-wider">Hostiles</span>
                <span className="text-xs font-bold text-slate-300 font-sans tracking-wide">Bedrohungen</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 font-semibold uppercase">
                {opponents.filter(o => {
                  if (o.id === 'custom' || o.id === selectedEnemyId || o.isFodder) return true;
                  const dbNpc = adventure.npcs.find(n => n.id === o.id);
                  if (!dbNpc) return true;
                  return isNpcCurrentlyPresent(dbNpc);
                }).length} aktiv
              </span>
            </div>

            {/* List of custom/named dynamic opponents */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {(() => {
                const activeOpponentsList = opponents.filter(o => {
                  if (o.id === 'custom' || o.id === selectedEnemyId || o.isFodder) return true;
                  const dbNpc = adventure.npcs.find(n => n.id === o.id);
                  if (!dbNpc) return true;
                  return isNpcCurrentlyPresent(dbNpc);
                });

                if (activeOpponentsList.length === 0) {
                  return (
                    <div className="text-[10px] text-slate-500 italic text-center py-4 bg-slate-950/20 border border-slate-850 rounded-lg">
                      Keine feindlichen Bedrohungen in dieser Szene aktiv.
                    </div>
                  );
                }

                const codexFactions = (adventure.loreDatabase || []).filter(item => item.category === 'Fraktionen');
                const playerFactionName = adventure.player.appearance?.faction?.trim() || '';

                const getOpponentFactionName = (o: { id: string; name: string; role?: string }) => {
                  const dbNpc = adventure.npcs.find(n => n.id === o.id);
                  if (dbNpc && dbNpc.appearance?.faction) return dbNpc.appearance.faction.trim();
                  const found = codexFactions.find(f => 
                    o.name.toLowerCase().includes(f.title.toLowerCase()) || 
                    (o.role || '').toLowerCase().includes(f.title.toLowerCase())
                  );
                  return found ? found.title.trim() : '';
                };

                const activeCompanions = (adventure.npcs || [])
                  .filter(n => !n.isHostile)
                  .filter(isNpcCurrentlyPresent)
                  .filter(n => !activeOpponentsList.some(o => {
                    const oName = o.name.toLowerCase().trim();
                    const nName = n.name.toLowerCase().trim();
                    return o.id === n.id || oName === nName || oName.includes(nName) || nName.includes(oName);
                  }));

                const companionFactions = Array.from(new Set(activeCompanions.map(c => c.appearance?.faction?.trim()).filter(Boolean) as string[]));
                const activeOpponentFactions = Array.from(new Set(activeOpponentsList.map(o => getOpponentFactionName(o)).filter(Boolean)));
                const allFactionsInScene = Array.from(new Set([...companionFactions, ...activeOpponentFactions]));

                const shouldGroup = !!playerFactionName || allFactionsInScene.length >= 2;

                if (shouldGroup) {
                  const rawGroups: Record<string, typeof activeOpponentsList> = {};
                  activeOpponentsList.forEach(o => {
                    const fName = getOpponentFactionName(o) || 'Fraktionslos / Neutral';
                    if (!rawGroups[fName]) rawGroups[fName] = [];
                    rawGroups[fName].push(o);
                  });

                  const sortedGroups = Object.entries(rawGroups).map(([fName, list]) => {
                    let title = fName;
                    let badgeColor = 'bg-slate-950 text-slate-500 border-slate-850';
                    let icon = '👤';
                    let groupThemeColor = 'text-slate-400';
                    let isOwnFaction = false;

                    if (playerFactionName && fName.toLowerCase() === playerFactionName.toLowerCase()) {
                      title = `${fName} (Rebellen / Abtrünnige)`;
                      badgeColor = 'bg-purple-950/40 text-purple-400 border-purple-900/40';
                      groupThemeColor = 'text-purple-450 font-extrabold';
                      icon = '⚠️';
                      isOwnFaction = true;
                    } else if (fName !== 'Fraktionslos / Neutral') {
                      title = `Fraktion: ${fName}`;
                      badgeColor = 'bg-red-950/40 text-red-400 border-red-900/40';
                      groupThemeColor = 'text-red-400 font-bold';
                      icon = '☠️';
                    } else {
                      title = 'Unabhängige Bedrohungen';
                      badgeColor = 'bg-slate-950/50 text-slate-500 border-slate-900';
                      groupThemeColor = 'text-slate-400 font-medium';
                      icon = '🐾';
                    }

                    const codexDesc = fName !== 'Fraktionslos / Neutral' 
                      ? codexFactions.find(f => f.title.toLowerCase() === fName.toLowerCase())?.description
                      : undefined;

                    return {
                      faction: fName,
                      title,
                      badgeColor,
                      icon,
                      groupThemeColor,
                      isOwnFaction,
                      description: codexDesc,
                      list
                    };
                  });

                  // Sort groups so that player's own faction/rebel and other hostile factions come first
                  sortedGroups.sort((a, b) => {
                    if (a.faction === playerFactionName) return -1;
                    if (b.faction === playerFactionName) return 1;
                    if (a.faction === 'Fraktionslos / Neutral') return 1;
                    if (b.faction === 'Fraktionslos / Neutral') return -1;
                    return a.title.localeCompare(b.title);
                  });

                  return (
                    <div className="space-y-4">
                      {sortedGroups.map(grp => (
                        <div key={grp.faction} className="space-y-2.5">
                          {grp.faction !== 'Fraktionslos / Neutral' && (
                            <div className="flex flex-col gap-0.5 border-b border-slate-805/40 pb-1.5 pt-1">
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${grp.groupThemeColor}`}>
                                  <span>{grp.icon}</span> {grp.title}
                                </span>
                                <span className={`text-[7.5px] font-mono font-extrabold uppercase border rounded px-1.5 py-0.5 ${grp.badgeColor}`}>
                                  {grp.isOwnFaction ? 'Abtrünnig' : grp.faction !== 'Fraktionslos / Neutral' ? 'Feind' : 'Wild'}
                                </span>
                              </div>
                              {grp.description && (
                                <p className="text-[8.5px] text-slate-500 italic leading-tight truncate mt-0.5" title={grp.description}>
                                  {grp.description}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="space-y-2">
                            {grp.list.map(o => {
                              const isTargeted = selectedEnemyIds.includes(o.id);
                              const matchedNpc = findNpcByIdOrName(o.id, o.name);
                              const currentMaxHp = matchedNpc ? getNPCMaxHp(matchedNpc) : o.maxHp;
                              const currentHp = Math.min(o.hp, currentMaxHp);
                              return (
                                <div 
                                  key={o.id}
                                  onClick={() => selectOpponentAsTarget(o.id)}
                                  className={`rounded-xl p-3 space-y-2 cursor-pointer transition-all border text-left ${
                                    isTargeted 
                                      ? 'bg-red-950/25 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)] text-red-100' 
                                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-750 text-slate-400'
                                  }`}
                                >
                                  {/* Name, Fodder quantity badges */}
                                  <div className="flex items-start justify-between gap-1.5">
                                    <div className="min-w-0 flex items-center gap-2">
                                      <input 
                                        type="checkbox" 
                                        checked={isTargeted} 
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          selectOpponentAsTarget(o.id);
                                        }}
                                        className="rounded border-slate-800 bg-slate-950 text-red-500 focus:ring-red-500/30 w-3.5 h-3.5 cursor-pointer accent-red-500"
                                      />
                                      <div className="min-w-0">
                                        <span className="text-xs font-bold block truncate leading-tight text-slate-200">
                                          {o.name}
                                        </span>
                                        <span className="text-[9px] text-slate-500 italic block truncate">
                                          {o.role || (o.isFodder ? 'Kanonenfutter' : 'Elite feind')}
                                        </span>
                                      </div>
                                    </div>
                                    {o.count !== undefined && (
                                      <span className="rounded bg-amber-950/80 text-amber-500 border border-amber-900 px-1.5 py-0.5 text-[9px] font-extrabold shrink-0 uppercase tracking-wider">
                                        x{o.count}
                                      </span>
                                    )}
                                  </div>

                                  {/* Health Progress Indicator */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-mono leading-none">
                                      <span className="text-red-500 font-extrabold">HP</span>
                                      <span className="font-bold">{currentHp}/{currentMaxHp}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                                        style={{ width: `${Math.min(100, Math.max(0, (currentHp / currentMaxHp) * 100))}%` }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Interactive Controls per Opponent */}
                                  {o.count !== undefined && (
                                    <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-900/40 w-full">
                                      {/* Fodder Count adjusters */}
                                      <div className="flex items-center gap-1.5 bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800" onClick={e => e.stopPropagation()}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpponents(prev => prev.map(opp => opp.id === o.id ? { ...opp, count: Math.max(0, (opp.count || 0) - 5) } : opp));
                                          }}
                                          className="text-[10px] text-amber-500 hover:text-amber-300 font-bold leading-none px-0.5"
                                          title="-5 Stück"
                                        >
                                          -
                                        </button>
                                        <span className="text-[8px] text-slate-500 font-bold uppercase select-none">Menge</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpponents(prev => prev.map(opp => opp.id === o.id ? { ...opp, count: (opp.count || 0) + 5 } : opp));
                                          }}
                                          className="text-[10px] text-amber-500 hover:text-amber-300 font-bold leading-none px-0.5"
                                          title="+5 Stück"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                // Default linear layout when no grouping is required
                return activeOpponentsList.map(o => {
                  const isTargeted = selectedEnemyIds.includes(o.id);
                  const matchedNpc = findNpcByIdOrName(o.id, o.name);
                  const currentMaxHp = matchedNpc ? getNPCMaxHp(matchedNpc) : o.maxHp;
                  const currentHp = Math.min(o.hp, currentMaxHp);
                  return (
                    <div 
                      key={o.id}
                      onClick={() => selectOpponentAsTarget(o.id)}
                      className={`rounded-xl p-3 space-y-2 cursor-pointer transition-all border text-left ${
                        isTargeted 
                          ? 'bg-red-950/25 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.15)] text-red-100' 
                          : 'bg-slate-950/60 border-slate-850 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      {/* Name, Fodder quantity badges */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={isTargeted} 
                            onChange={(e) => {
                              e.stopPropagation();
                              selectOpponentAsTarget(o.id);
                            }}
                            className="rounded border-slate-800 bg-slate-950 text-red-500 focus:ring-red-500/30 w-3.5 h-3.5 cursor-pointer accent-red-500"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate leading-tight text-slate-200">
                              {o.name}
                            </span>
                            <span className="text-[9px] text-slate-500 italic block truncate">
                              {o.role || (o.isFodder ? 'Kanonenfutter' : 'Elite feind')}
                            </span>
                          </div>
                        </div>
                        {o.count !== undefined && (
                          <span className="rounded bg-amber-950/80 text-amber-500 border border-amber-900 px-1.5 py-0.5 text-[9px] font-extrabold shrink-0 uppercase tracking-wider">
                            x{o.count}
                          </span>
                        )}
                      </div>

                      {/* Health Progress Indicator */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono leading-none">
                          <span className="text-red-500 font-extrabold">HP</span>
                          <span className="font-bold">{currentHp}/{currentMaxHp}</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, (currentHp / currentMaxHp) * 100))}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Interactive Controls per Opponent */}
                      {o.count !== undefined && (
                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-900/40 w-full">
                          {/* Fodder Count adjusters */}
                          <div className="flex items-center gap-1.5 bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                setOpponents(prev => prev.map(opp => opp.id === o.id ? { ...opp, count: Math.max(0, (opp.count || 0) - 5) } : opp));
                              }}
                              className="text-[10px] text-amber-500 hover:text-amber-300 font-bold leading-none px-0.5"
                              title="-5 Stück"
                            >
                              -
                            </button>
                            <span className="text-[8px] text-slate-500 font-bold uppercase select-none">Menge</span>
                            <button
                              type="button"
                              onClick={() => {
                                setOpponents(prev => prev.map(opp => opp.id === o.id ? { ...opp, count: (opp.count || 0) + 5 } : opp));
                              }}
                              className="text-[10px] text-amber-500 hover:text-amber-300 font-bold leading-none px-0.5"
                              title="+5 Stück"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* GEGNER-ANALYSE CARD */}
            {selectedEnemyId && (() => {
              const activeOpponent = opponents.find(o => o.id === selectedEnemyId);
              if (!activeOpponent) return null;

              const isScanning = scanningEnemyId === selectedEnemyId;
              const scanData = scannedOpponents[selectedEnemyId];

              const alreadyInCodex = (adventure.loreDatabase || []).some(
                e => e.category === 'Gegner' && e.title.toLowerCase() === activeOpponent.name.toLowerCase()
              );

              return (
                <div className="mt-1 border-t border-slate-800/60 pt-2.5 space-y-2 text-left shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                      <i className="fa-solid fa-crosshairs"></i> Gegner-Analyse
                    </span>
                    {alreadyInCodex && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded text-[8px] font-bold uppercase">
                        Codex ✓
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-2.5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] font-extrabold text-slate-200 block">
                          {activeOpponent.name}
                        </span>
                        <span className="text-[8.5px] text-slate-500 italic">
                          {scanData?.role || activeOpponent.role || (activeOpponent.isFodder ? 'Kanonenfutter' : 'Gegner')}
                        </span>
                      </div>
                    </div>

                    {isScanning && (
                      <div className="space-y-1.5 py-1">
                        <div className="flex justify-between items-center text-[8.5px] font-mono text-amber-500/80">
                          <span className="animate-pulse">Analysiere Signatur...</span>
                          <span>KI-Scan</span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300 w-1/2 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    )}

                    {!isScanning && scanData && (
                      <div className="space-y-2.5 text-[10px] leading-normal animate-in fade-in duration-200">
                        {scanData.description && (
                          <p className="text-slate-400 text-[9.5px] italic leading-tight">
                            {scanData.description}
                          </p>
                        )}

                        {(scanData.powerSource || scanData.powerCost) && (
                          <div className="grid grid-cols-2 gap-2 bg-slate-900/40 p-1.5 rounded border border-slate-900 font-mono text-[8px] text-slate-400 font-sans">
                            {scanData.powerSource && (
                              <div>
                                <span className="text-slate-500 block">Kraftquelle:</span>
                                <span className="font-bold text-slate-300">{scanData.powerSource}</span>
                              </div>
                            )}
                            {scanData.powerCost && (
                              <div>
                                <span className="text-slate-500 block">Kosten/Limit:</span>
                                <span className="font-bold text-slate-300">{scanData.powerCost}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {scanData.campaignPowerLevels && Object.keys(scanData.campaignPowerLevels).length > 0 && (
                          <div className="space-y-1.5 border-t border-slate-900 pt-2">
                            <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">
                              Macht & Werte (Kampagnen-Skala)
                            </span>
                            <div className="space-y-1">
                              {Object.entries(scanData.campaignPowerLevels).map(([key, item]) => (
                                <div key={key} className="flex items-center justify-between text-[9px] font-mono">
                                  <span className="text-slate-400">{key}</span>
                                  <span className="text-amber-500 font-bold">{item.value} / {item.potentialMax}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {scanData.techniques && scanData.techniques.length > 0 && (
                          <div className="space-y-1.5 border-t border-slate-900 pt-2 max-h-32 overflow-y-auto pr-0.5">
                            <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">
                              Fähigkeiten & Techniken
                            </span>
                            <div className="space-y-1.5">
                              {scanData.techniques.map((tech, tIdx) => (
                                <div key={tIdx} className="bg-slate-900/50 p-1.5 rounded border border-slate-900/85">
                                  <span className="text-[9px] font-bold text-slate-200 block">
                                    {tech.name}
                                  </span>
                                  <p className="text-[8.5px] text-slate-400 leading-tight">
                                    {tech.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!alreadyInCodex && (
                          <button
                            type="button"
                            onClick={() => handleSaveScannedToCodex(selectedEnemyId)}
                            className="w-full mt-1.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/30 text-amber-250 font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95"
                          >
                            <i className="fa-solid fa-file-invoice"></i> In Codex eintragen
                          </button>
                        )}
                      </div>
                    )}

                    {!isScanning && !scanData && (
                      <p className="text-[9px] text-slate-500 italic py-1">
                        Klicke auf einen Gegner, um dessen Werte und Fähigkeiten automatisch zu scannen.
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Immersive non-interactive Red Alert notice if AI detects alarm trigger context */}
            {isReinforcementSuggested && (
              <div className="border-t border-red-950/60 bg-red-950/15 p-2.5 rounded-lg border border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)] animate-pulse mt-3 text-left space-y-1 select-none shrink-0">
                <div className="text-[10px] font-extrabold text-red-400 flex items-center gap-1.5 uppercase font-sans tracking-wide">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Story-Alarm: Verstärkung droht
                </div>
                <div className="text-[9.2px] text-slate-350 leading-normal font-medium">
                  Der Storyteller (Dungeon Master) analysiert das Geschehen und alarmiert bei Bedarf selbstständig feindliche Truppen über den Status-Kanal.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
