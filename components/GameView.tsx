// -*- coding: utf-8 -*-

import React, { useState, useRef, useEffect } from 'react';
import { Adventure, ChatMessage, GameViewMode, StatusElement, NPC, UserProfile, Character, LoreEntry, Territory } from '../types';
import { GeminiService, audioUtils } from '../services/geminiService';
import AutoExpandingTextarea from './AutoExpandingTextarea';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Modality } from '@google/genai';
import { TacticalCombatMap } from './TacticalCombatMap';
import { BodySilhouette } from './BodySilhouette';
import { resolveBodyAppearance, migrateFremdeinflussConditions } from './bodyConditionResolver';
import { buildPhysicalStatusAndPerceptionPrompt, calculatePhysicalChanges } from '../utils/changeTracker';
import { getTransformationCardSettings, getFormSideEffects, formatDuration, formatNum } from './TransformationIntensityCard';
import { formatRelationshipForAI, formatMotivationCoreForAI, formatNPCForAIPrompt, formatPlayerForAIPrompt } from '../lib/relationshipHelper';
import { formatDisplayLocationName } from '../utils/mapUtils';
import { createOrganicIslandPoints } from './worldmap/worldMapData';
import { formatPersonalityTraitsAsPrompt } from './PersonalityTraitsEditor';
import { WorkManagementModal } from './WorkManagementModal';
import { isClothingPlaceholder, isClothingItemTitle, consolidateLoreOutfits } from '../App';
import { spawnTacticalGroup } from '../utils/tacticalEngine';
import { parseTacticalCommandsFromText, executeTacticalCommand } from '../utils/tacticalMovementEngine';
import { WorldIntegrationService } from '../services/worldIntegrationService';
import { WorldSimulationService } from '../services/worldSimulationService';
import { applyProfessionCompetencyActivity } from '../services/professionCompetencyService';
import { ProfessionCompetencyActivity } from '../types';


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


const isSimilarLoreTitle = (titleA: string | undefined, titleB: string | undefined): boolean => {
  if (!titleA || !titleB) return false;
  const normalize = (t: string) => {
    let s = t.toLowerCase().trim();
    s = s.replace(/^(die|der|das|ein|eine|einen|einem|eines|einer|the|a|an)\s+/gi, '');
    s = s.replace(/[-\s_]/g, '');
    return s.trim();
  };
  const normA = normalize(titleA);
  const normB = normalize(titleB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  if (normA.length > 3 && normB.length > 3) {
    if (normA.endsWith('n') && normA.slice(0, -1) === normB) return true;
    if (normB.endsWith('n') && normB.slice(0, -1) === normA) return true;
    if (normA.endsWith('en') && normA.slice(0, -2) === normB) return true;
    if (normB.endsWith('en') && normB.slice(0, -2) === normA) return true;
    if (normA.includes(normB) || normB.includes(normA)) return true;
  }
  return false;
};


const cleanTextForDisplay = (text: string | undefined): string => {
  if (!text) return '';
  let cleaned = text.replace(/\[(?:Ausweichen|Schaden|Blocken|Treffer|Fehlschlag|Kritischer\s+Treffer|Heilung|Reflektiert|Parriert|Parade|Widerstanden|Absorbiert)[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/ +/g, ' ');
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');
  return cleaned.trim();
};


const isNameMatch = (existingName: string | undefined, existingNickname: string | undefined, incomingName: string | undefined) => {
  if (!existingName || !incomingName) return false;
  
  const clean = (s: string) => s.trim().toLowerCase()
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^(sir|mr\.|mr|ms\.|ms|captain|kapitän|admiral|vizeadmiral|vize-admiral|yonko|kaiser|shichibukai|samurai)\s+/i, '');
    
  const extClean = clean(existingName);
  const incClean = clean(incomingName);
  if (!extClean || !incClean) return false;
  
  if (extClean === incClean) return true;
  
  if (existingNickname) {
    const nickClean = clean(existingNickname);
    if (nickClean === incClean) return true;
    
    const nicknamesList = existingNickname.split(/[,/;|]+/).map(n => clean(n)).filter(Boolean);
    if (nicknamesList.includes(incClean)) return true;
  }
  
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

  const ignoreWords = ['d.', 'd', 'von', 'der', 'die', 'das', 'the', 'of', 'sir', 'mr', 'captain', 'kapitän', 'don'];
  const w1 = extClean.split(/\s+/).filter(w => !ignoreWords.includes(w) && w.length > 2);
  const w2 = incClean.split(/\s+/).filter(w => !ignoreWords.includes(w) && w.length > 2);
  
  for (const p1 of w1) {
    for (const p2 of w2) {
      if (p1 === p2 || p1.includes(p2) || p2.includes(p1)) return true;
    }
  }

  return false;
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

  const onUpdateAdventureRef = useRef(onUpdateAdventure);
  useEffect(() => {
    onUpdateAdventureRef.current = onUpdateAdventure;
  }, [onUpdateAdventure]);

  // Synchronized Transformation Settings (PNR, Rates, Time Units)
  const [transSettings, setTransSettings] = useState(() => getTransformationCardSettings());
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setTransSettings(getTransformationCardSettings());
    };
    window.addEventListener('transformation_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('transformation_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  // Back-populate initial values for legacy/existing adventures if they are missing
  useEffect(() => {
    if (adventure) {
      const needsInitialPlayer = !adventure.initialPlayer;
      const needsInitialStatusElements = !adventure.initialStatusElements;
      const needsInitialStructuredInventory = !adventure.initialStructuredInventory && adventure.structuredInventory;
      const needsInitialLoreDatabase = !adventure.initialLoreDatabase;
      const needsInitialNpcs = !adventure.initialNpcs;
      const needsInitialInventory = !adventure.initialInventory;

      let playerToUse = adventure.player;
      let playerMigrated = false;
      if (adventure.player) {
        const mig = migrateFremdeinflussConditions(adventure.player);
        if (mig.updated) {
          playerToUse = mig.player;
          playerMigrated = true;
        }
      }

      if (needsInitialPlayer || needsInitialStatusElements || needsInitialStructuredInventory || needsInitialLoreDatabase || needsInitialNpcs || needsInitialInventory || playerMigrated) {
        onUpdateAdventureRef.current({
          ...adventure,
          player: playerToUse,
          initialPlayer: adventure.initialPlayer || JSON.parse(JSON.stringify(playerToUse)),
          initialStatusElements: adventure.initialStatusElements || JSON.parse(JSON.stringify(adventure.statusElements || [])),
          initialStructuredInventory: adventure.initialStructuredInventory || (adventure.structuredInventory ? JSON.parse(JSON.stringify(adventure.structuredInventory)) : undefined),
          initialLoreDatabase: adventure.initialLoreDatabase || JSON.parse(JSON.stringify(adventure.loreDatabase || [])),
          initialNpcs: adventure.initialNpcs || JSON.parse(JSON.stringify(adventure.npcs || [])),
          initialInventory: adventure.initialInventory || JSON.parse(JSON.stringify(adventure.inventory || []))
        });
      }
    }
  }, [adventure.id]);

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

    const levels = npc.campaignPowerLevels || (npc as any).details?.campaignPowerLevels || (npc as any).details?.campaignPowerSettings || {};

    let sumVal = 0;
    if (healthPowerNames.length > 0) {
      healthPowerNames.forEach(name => {
        const level = levels[name] || Object.entries(levels).find(([k]) => k.toLowerCase().trim() === name.toLowerCase().trim())?.[1];
        if (level && (level as any).value !== undefined) {
          sumVal += (level as any).value;
        } else {
          // Fallback to setting definition
          const setting = settings[name] || Object.entries(settings).find(([k]) => k.toLowerCase().trim() === name.toLowerCase().trim())?.[1];
          if (setting) {
            const minVal = (setting as any).min !== undefined ? (setting as any).min : 50;
            const maxVal = (setting as any).max !== undefined ? (setting as any).max : 150;
            sumVal += Math.floor((minVal + maxVal) / 2);
          } else {
            sumVal += 100;
          }
        }
      });
    } else if (healthPowerName) {
      const level = levels[healthPowerName] || Object.entries(levels).find(([k]) => k.toLowerCase().trim() === healthPowerName.toLowerCase().trim())?.[1];
      if (level && (level as any).value !== undefined) {
        sumVal = (level as any).value;
      } else {
        const setting = settings[healthPowerName] || Object.entries(settings).find(([k]) => k.toLowerCase().trim() === healthPowerName.toLowerCase().trim())?.[1];
        if (setting) {
          const minVal = (setting as any).min !== undefined ? (setting as any).min : 100;
          const maxVal = (setting as any).max !== undefined ? (setting as any).max : 200;
          sumVal = Math.floor((minVal + maxVal) / 2);
        } else {
          sumVal = 100;
        }
      }
    }

    if (sumVal > 0) {
      npcMaxHp = sumVal;
    }

    // Now, apply an elegant and epic scale modifier based on the NPC's reputation/role/isHostile/renown!
    const nameLower = (npc.name || '').toLowerCase();
    const roleLower = (npc.role || '').toLowerCase();
    let multiplier = 1.0;

    const isBoss = nameLower.includes('boss') || 
                   roleLower.includes('boss') || 
                   roleLower.includes('admiral') || 
                   roleLower.includes('kaiser') || 
                   roleLower.includes('yonko') || 
                   roleLower.includes('hokage') || 
                   roleLower.includes('god') || 
                   roleLower.includes('gott') || 
                   roleLower.includes('leiter') || 
                   roleLower.includes('legend') ||
                   ['akainu', 'sakazuki', 'kaido', 'big mom', 'shanks', 'teach', 'blackbeard', 'whitebeard', 'madara', 'freezer', 'frieza', 'cell', 'beerus', 'luffy', 'ruffy'].includes(nameLower);

    const isElite = nameLower.includes('vize') || 
                    roleLower.includes('elite') || 
                    roleLower.includes('kommandant') || 
                    roleLower.includes('captain') || 
                    roleLower.includes('kapitän') || 
                    roleLower.includes('meister') || 
                    roleLower.includes('vizeadmiral') || 
                    ['zoro', 'zorro', 'sanji', 'law', 'kid', 'kidd', 'itachi', 'pain', 'vegeta'].includes(nameLower);

    if (isBoss) {
      multiplier = 3.5;
    } else if (isElite) {
      multiplier = 1.8;
    } else if ((npc as any).isHostile || (npc as any).details?.isHostile) {
      multiplier = 1.2;
    }

    return Math.round(npcMaxHp * multiplier);
  };

  const getFavoriteTechniques = () => {
    const list: any[] = [];
    const seenNames = new Set<string>();

    const checkAndPush = (item: any, fallbackCategory: string, isTrans = false, isUlt = false) => {
      if (!item || !item.name || !item.name.trim()) return;
      const cleanName = item.name.trim();
      const lower = cleanName.toLowerCase();
      if (seenNames.has(lower)) return;
      if (item.isFavorite || item.favorite) {
        seenNames.add(lower);
        list.push({
          ...item,
          name: cleanName,
          category: item.category || fallbackCategory,
          isTransformation: isTrans || (item.category || '').toLowerCase().includes('transform'),
          isUltimate: isUlt || (item.category || '').toLowerCase().includes('ultimat'),
        });
      }
    };

    adventure?.player?.abilities?.forEach((ability: any) => {
      const abCat = ability.category || 'Techniken';
      const isTrans = abCat === 'Transformationen' || !!ability.transformName || (ability.type || '').toLowerCase().includes('transform');
      const isUlt = abCat === 'Ultimative Techniken' || (ability.type || '').toLowerCase().includes('ultimat');

      if (Array.isArray(ability.techniqueList)) {
        ability.techniqueList.forEach((tech: any) => {
          checkAndPush({
            ...tech,
            abilityId: ability.id,
            abilitySource: ability.source,
          }, abCat, isTrans, isUlt);
        });
      }

      // Check ability itself (Transformationen like "Reine Esper Hoshiko", Ultimative Techniken, or standalone abilities)
      const mainName = isTrans ? (ability.transformName || ability.name) : ability.name;
      if (mainName) {
        checkAndPush({
          id: ability.id,
          name: mainName,
          description: ability.description || (isTrans ? 'Verwandlungsform mit modifizierten Attributen und Kräften.' : 'Fähigkeit des Charakters.'),
          category: abCat,
          level: ability.level || 1,
          cost: ability.cost || '',
          abilityId: ability.id,
          abilitySource: ability.source,
          isFavorite: !!ability.isFavorite || !!ability.favorite,
        }, abCat, isTrans, isUlt);
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
      const found = dbNpcs.find(n => isNameMatch(n.name, n.nickname || (n as any).rufName, searchName));
      if (found) return found;
      
      const dbLore = adventureRef.current?.loreDatabase || adventure.loreDatabase;
      if (dbLore) {
        const foundLore = dbLore.find(item => 
          (item.category === 'Charaktere' || item.category === 'Gegner') && 
          isNameMatch(item.title, item.details?.nickname || item.details?.rufName, searchName)
        );
        if (foundLore) {
          return {
            id: foundLore.id,
            name: foundLore.title,
            role: foundLore.details?.role || 'Charakter',
            campaignPowerLevels: foundLore.details?.campaignPowerLevels || foundLore.details?.campaignPowerSettings,
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
  const [isLoadingImg, setIsGeneratingImg] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmotionMenu, setShowEmotionMenu] = useState(false);
  const [showToneMenu, setShowToneMenu] = useState(false);
  const [showFavoritesMenu, setShowFavoritesMenu] = useState(false);
  const [showWorkMenu, setShowWorkMenu] = useState(false);

  const pendingWorkTasksCount = React.useMemo(() => {
    const holdings = adventure.world?.economyConfig?.holdings || [];
    let count = 0;
    for (const h of holdings) {
      if (h.tasks) {
        count += h.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
      }
    }
    return count;
  }, [adventure.world?.economyConfig?.holdings]);

  // Selected HUD field for compact detail modal (Step 7)
  const [selectedHudDetailField, setSelectedHudDetailField] = useState<{
    id: string;
    category: string;
    label: string;
    value: string;
    icon: string;
    colorClass: string;
    details: { label: string; value: string }[];
    isEditable?: boolean;
    elementId?: string;
    actionType?: 'silhouette' | 'emotion' | 'tone' | 'edit' | 'logbook';
  } | null>(null);
  const [hudModalEditValue, setHudModalEditValue] = useState('');

  // Item creation modal state
  const [showCreateItemModal, setShowCreateItemModal] = useState(false);
  
  // KI-Gegner-Extraktion
  const [aiExtractedEnemies, setAiExtractedEnemies] = useState<{id: string, name: string, type: 'npc'|'group', subtitle?: string}[]>([]);
  const [isExtractingEnemies, setIsExtractingEnemies] = useState(false);
  const [lastExtractedMessageId, setLastExtractedMessageId] = useState('');

  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState('Waffen');
  const [newItemRarity, setNewItemRarity] = useState('Gewöhnlich');
  const [newItemOwner, setNewItemOwner] = useState(adventure.player.name || 'Spieler');
  const [newItemCustomOwner, setNewItemCustomOwner] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemLocation, setNewItemLocation] = useState('Im Besitz');

  const handleSaveNewItem = () => {
    if (!newItemName.trim()) return;
    const pName = adventure.player.name || 'Spieler';
    const effectiveOwner = newItemOwner === 'CUSTOM'
      ? (newItemCustomOwner.trim() || 'Niemand')
      : (newItemOwner || pName);

    const isPlayerOwned = effectiveOwner.trim().toLowerCase() === pName.trim().toLowerCase() ||
                          effectiveOwner.trim().toLowerCase() === 'spieler' ||
                          effectiveOwner.trim().toLowerCase() === 'player' ||
                          (adventure.player.nickname && effectiveOwner.trim().toLowerCase() === adventure.player.nickname.trim().toLowerCase());

    const newEntry: LoreEntry = {
      id: 'dyn-itm-' + Math.random().toString(36).substr(2, 9),
      category: 'Gegenstände',
      title: newItemName.trim(),
      description: newItemDescription.trim() || `${newItemName.trim()} (${newItemType}) im Besitz von ${effectiveOwner}.`,
      isUnlocked: true,
      details: {
        itemType: newItemType,
        rarity: newItemRarity,
        owner: effectiveOwner,
        currentLocation: newItemLocation || (isPlayerOwned ? 'Im Besitz des Spielers' : `Im Besitz von ${effectiveOwner}`),
        isUnique: newItemRarity === 'Legendär' || newItemRarity === 'Episch' ? 'Unikat (Existiert nur 1x auf der Welt)' : 'Massenware / Gewöhnlich'
      }
    };

    const updatedLore = [...(adventure.loreDatabase || [])];
    const existsIdx = updatedLore.findIndex(e => e.category === 'Gegenstände' && e.title.trim().toLowerCase() === newItemName.trim().toLowerCase());
    if (existsIdx > -1) {
      updatedLore[existsIdx] = newEntry;
    } else {
      updatedLore.push(newEntry);
    }

    let updatedAdv: Adventure = {
      ...adventure,
      loreDatabase: updatedLore
    };

    if (isPlayerOwned) {
      const inv = updatedAdv.structuredInventory ? { ...updatedAdv.structuredInventory } : { armor: {}, accessories: {}, weapons: [], generalItems: [], money: 0, currencyLabel: 'Goldstücke' };
      const isWpn = newItemType === 'Waffen' || ['schwert', 'bogen', 'dolch', 'klinge', 'degen', 'gewehr', 'pistole', 'lanze', 'speer', 'axt', 'tsuki no wa', 'säbel', 'katana', 'waffe', 'weapon', 'messer', 'schild', 'drachenschwert', 'lanze', 'kolben', 'hammer'].some(kw => newItemName.toLowerCase().includes(kw));

      if (isWpn) {
        const weaps = [...(inv.weapons || [])];
        if (!weaps.some(w => w.trim().toLowerCase() === newItemName.trim().toLowerCase())) {
          weaps.push(newItemName.trim());
          inv.weapons = weaps;
        }
      } else {
        const items = [...(inv.generalItems || [])];
        if (!items.some(i => i.trim().toLowerCase() === newItemName.trim().toLowerCase())) {
          items.push(newItemName.trim());
          inv.generalItems = items;
        }
      }
      updatedAdv.structuredInventory = inv;
    }

    onUpdateAdventure(updatedAdv);
    setLoreNotifications(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type: 'add',
        title: `${newItemName.trim()} (Besitzer: ${effectiveOwner})`,
        category: 'Gegenstände'
      }
    ]);

    setNewItemName('');
    setNewItemDescription('');
    setNewItemCustomOwner('');
    setShowCreateItemModal(false);
  };

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

    const newEmotionState = {
      ...(adventure.player?.emotionState || {}),
      emotion,
      lastUpdated: new Date().toISOString()
    };

    let updatedStatus = [...(adventure.statusElements || [])];
    const emIdx = updatedStatus.findIndex(s => s.label.toLowerCase().includes('emotion'));
    if (emIdx > -1) {
      updatedStatus[emIdx] = { ...updatedStatus[emIdx], value: emotion };
    }

    onUpdateAdventure({
      ...adventure,
      emotionState: newEmotionState,
      player: {
        ...adventure.player,
        emotionState: newEmotionState
      },
      statusElements: updatedStatus
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

    const newEmotionState = {
      ...(adventure.player?.emotionState || {}),
      tone,
      lastUpdated: new Date().toISOString()
    };

    let updatedStatus = [...(adventure.statusElements || [])];
    const toneIdx = updatedStatus.findIndex(s => s.label.toLowerCase().includes('tonart') || s.label.toLowerCase().includes('stimme'));
    if (toneIdx > -1) {
      updatedStatus[toneIdx] = { ...updatedStatus[toneIdx], value: tone };
    }

    onUpdateAdventure({
      ...adventure,
      emotionState: newEmotionState,
      player: {
        ...adventure.player,
        emotionState: newEmotionState
      },
      statusElements: updatedStatus
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

  const addLoreNotifications = (newItems: { id: string; type: 'add' | 'unlock'; title: string; category: string }[]) => {
    if (!newItems || newItems.length === 0) return;
    setLoreNotifications(prev => {
      const existingKeys = new Set(prev.map(p => `${p.category}:${p.title.trim().toLowerCase()}`));
      const filtered = newItems.filter(item => {
        if (item.category === 'Gegenstände' && (isClothingPlaceholder(item.title) || isClothingItemTitle(item.title))) {
          return false;
        }
        const key = `${item.category}:${item.title.trim().toLowerCase()}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });
      return [...prev, ...filtered].slice(-5);
    });
  };

  // --- JRPG KAMPFSYSTEM STATES ---
  const [isCombatActive, setIsCombatActive] = useState(() => adventure.combatState?.isCombatActive ?? false);
  const [isCombatMenuExpanded, setIsCombatMenuExpanded] = useState(() => adventure.combatState?.isCombatActive ?? false);
  const [activeCombatPowerSourceIdx, setActiveCombatPowerSourceIdx] = useState(0);
  const [activeSkillCategoryTab, setActiveSkillCategoryTab] = useState<'techniken' | 'ultimative' | 'transformationen'>('techniken');
  const [skillSummonCounts, setSkillSummonCounts] = useState<Record<string, number>>({});
  const [leftSidebarTab, setLeftSidebarTab] = useState<'allies' | 'enemies'>('allies');
  const [showSilhouetteModal, setShowSilhouetteModal] = useState(false);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string>(() => adventure.combatState?.selectedEnemyId ?? '');
  const [selectedEnemyIds, setSelectedEnemyIds] = useState<string[]>(() => adventure.combatState?.selectedEnemyIds ?? (adventure.combatState?.selectedEnemyId ? [adventure.combatState.selectedEnemyId] : []));
  const [customEnemyName, setCustomEnemyName] = useState(() => adventure.combatState?.customEnemyName ?? '');
  const [customAttackText, setCustomAttackText] = useState('');
  const [drawnWeapon, setDrawnWeapon] = useState<string | null>(null);

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
          const isSquadOrFodder = o.count !== undefined || o.isFodder || o.id.includes('-squad-');
          if (!isSquadOrFodder) {
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

  const getSingularEnemyName = (pluralName: string): string => {
    let name = pluralName
      .replace(/\s*\d+er\s+Trupp/gi, '')
      .replace(/\s*\(Gruppe\s+\d+\)$/gi, '')
      .replace(/\s*\(\d+\)$/gi, '')
      .replace(/\s*x\d+$/gi, '')
      .trim();

    if (/piraten$/i.test(name)) return name.replace(/piraten$/i, 'Pirat');
    if (/soldaten$/i.test(name)) return name.replace(/soldaten$/i, 'Soldat');
    if (/banditen$/i.test(name)) return name.replace(/banditen$/i, 'Bandit');
    if (/wachen$/i.test(name)) return name.replace(/wachen$/i, 'Wache');
    if (/krieger$/i.test(name)) return name;
    if (/männer$/i.test(name)) return name.replace(/männer$/i, 'Mann');
    if (/gestalten$/i.test(name)) return name.replace(/gestalten$/i, 'Gestalt');
    if (/schergen$/i.test(name)) return name.replace(/schergen$/i, 'Scherge');
    if (/räuber$/i.test(name)) return name.replace(/räuber$/i, 'Räuber');
    if (/söldner$/i.test(name)) return name.replace(/söldner$/i, 'Söldner');
    if (/schützen$/i.test(name)) return name.replace(/schützen$/i, 'Schütze');
    if (/orks$/i.test(name)) return name.replace(/orks$/i, 'Ork');
    if (/angreifer$/i.test(name)) return name.replace(/angreifer$/i, 'Angreifer');
    if (/eindringlinge$/i.test(name)) return name.replace(/eindringlinge$/i, 'Eindringling');

    if (/en$/i.test(name) && name.length > 4) return name.slice(0, -2);
    if (/n$/i.test(name) && name.length > 4) return name.slice(0, -1);
    if (/e$/i.test(name) && name.length > 4) return name.slice(0, -1);

    return name;
  };

  const extractEnemyDescriptorsFromText = (baseName: string, count: number, recentMessages: any[]): { name: string; role: string }[] => {
    const text = (recentMessages || []).slice(-5).map(m => m.text || '').join('\n');
    const singular = getSingularEnemyName(baseName);

    const weaponRegexes = [
      { name: 'Streitaxt', keywords: ['streitaxt', 'axt', 'beil'] },
      { name: 'Entermesser', keywords: ['entermesser', 'kordelatsch'] },
      { name: 'Säbel', keywords: ['säbel', 'degen', 'fechtklinge'] },
      { name: 'Schwert', keywords: ['schwert', 'katana', 'klinge', 'zweihänder'] },
      { name: 'Pistole', keywords: ['pistole', 'steinschlosspistole', 'revolver'] },
      { name: 'Muskete', keywords: ['muskete', 'gewehr', 'flinte'] },
      { name: 'Speer', keywords: ['speer', 'lanze', 'hellebarde', 'spieß'] },
      { name: 'Bogen', keywords: ['bogen', 'armbrust', 'pfeil'] },
      { name: 'Dolch', keywords: ['dolch', 'messer', 'stiletto'] },
      { name: 'Keule', keywords: ['keule', 'morgenstern', 'streitkolben', 'hammer'] },
      { name: 'Dreizack', keywords: ['dreizack', 'harpune'] },
      { name: 'Peitsche', keywords: ['peitsche', 'kette'] },
    ];

    const traitKeywords = [
      { trait: 'Gehörnter Helm', keywords: ['gehörnt', 'hornhelm', 'hörner'] },
      { trait: 'Kopftuch', keywords: ['kopftuch', 'bandana'] },
      { trait: 'Fellweste', keywords: ['fellweste', 'fell'] },
      { trait: 'Augenklappe', keywords: ['augenklappe'] },
      { trait: 'Narbe', keywords: ['narbe', 'vernarbt'] },
      { trait: 'Scharfschütze', keywords: ['scharfschütze', 'heckenschütze'] },
      { trait: 'Anführer', keywords: ['anführer', 'captain', 'kapitän'] },
      { trait: 'Große Statur', keywords: ['breitschulterig', 'riese', 'koloss', 'hünenhaft'] },
      { trait: 'Schlaksig', keywords: ['schlaksig', 'dünn', 'hager'] },
    ];

    const foundWeapons: string[] = [];
    const foundRoles: string[] = [];

    const lowerText = text.toLowerCase();

    weaponRegexes.forEach(w => {
      if (w.keywords.some(k => lowerText.includes(k))) {
        if (!foundWeapons.includes(w.name)) {
          foundWeapons.push(w.name);
        }
      }
    });

    traitKeywords.forEach(t => {
      if (t.keywords.some(k => lowerText.includes(k))) {
        if (!foundRoles.includes(t.trait)) {
          foundRoles.push(t.trait);
        }
      }
    });

    const fallbackWeapons: Record<string, string[]> = {
      pirat: ['Entermesser', 'Streitaxt', 'Säbel', 'Pistole', 'Muskete', 'Dolch'],
      soldat: ['Säbel', 'Muskete', 'Hellebarde', 'Offiziersdegen', 'Schild'],
      bandit: ['Dolch', 'Armbrust', 'Keule', 'Säbel', 'Kurzaxt'],
      wache: ['Speer & Schild', 'Hellebarde', 'Armbrust', 'Schwerthand'],
      ork: ['Kriegskeule', 'Großaxt', 'Spitzhacke', 'Hauer'],
      default: ['Nahkampfwaffe', 'Fernkampfwaffe', 'Seitenwaffe', 'Axt', 'Säbel']
    };

    const cleanLowerBase = singular.toLowerCase();
    const typeKey = Object.keys(fallbackWeapons).find(k => cleanLowerBase.includes(k)) || 'default';
    const fallbacks = fallbackWeapons[typeKey];

    const results: { name: string; role: string }[] = [];

    for (let i = 0; i < count; i++) {
      const weapon = foundWeapons[i] || fallbacks[i % fallbacks.length];
      const trait = foundRoles[i] || undefined;

      let displayName = `${singular} (mit ${weapon})`;
      let roleText = trait ? `${trait} mit ${weapon}` : `Feind mit ${weapon}`;

      if (results.some(r => r.name === displayName)) {
        displayName = `${singular} #${i + 1} (mit ${weapon})`;
      }

      results.push({
        name: displayName,
        role: roleText
      });
    }

    return results;
  };

  const autoSplitOpponents = (list: any[], msgList: any[] = messages): any[] => {
    const result: any[] = [];
    
    list.forEach(o => {
      const isAlreadySplit = o.id.includes('-indiv-') || o.id.includes('-squad-') || /\s+[A-Z]$/.test(o.name);
      
      // Small group count (2 to 6): Split into distinct individual enemy cards!
      if (o.count !== undefined && o.count >= 2 && o.count <= 6 && !isAlreadySplit) {
        const descriptors = extractEnemyDescriptorsFromText(o.name, o.count, msgList);
        const perEnemyMaxHp = Math.max(100, Math.round(o.maxHp / o.count));
        const perEnemyHp = Math.min(perEnemyMaxHp, Math.max(1, Math.round(o.hp / o.count)));

        descriptors.forEach((desc, idx) => {
          result.push({
            ...o,
            id: `${o.id}-indiv-${idx + 1}-${Math.random().toString(36).substr(2, 4)}`,
            name: desc.name,
            role: desc.role,
            count: undefined,
            hp: perEnemyHp,
            maxHp: perEnemyMaxHp,
            isFodder: false
          });
        });
      } else if (o.count !== undefined && o.count > 6 && !isAlreadySplit) {
        // Large horde (> 6): Keep as single tactical mass unit with count (e.g. 50 Goblins)
        // Spawns 1 TacticalGroup and individual TacticalEntities on the grid
        result.push({
          ...o,
          isFodder: true
        });
      } else {
        result.push(o);
      }
    });
    
    return result;
  };

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
  }, [initialStats.playerHp, initialStats.playerMaxHp, initialStats.playerMp, initialStats.playerMaxMp]);

  const [enemyHp, setEnemyHp] = useState(() => {
    if (adventure.combatState?.enemyHp !== undefined) {
      const selId = adventure.combatState.selectedEnemyId;
      const customNm = adventure.combatState.customEnemyName;
      const char = findNpcByIdOrName(selId, customNm);
      if (char) {
        const isSquadOrFodder = adventure.combatState.opponents?.some((o: any) => o.id === selId && (o.count !== undefined || o.isFodder || o.id.includes('-squad-')));
        if (!isSquadOrFodder) {
          const calculatedMax = getNPCMaxHp(char);
          if (adventure.combatState.enemyMaxHp !== calculatedMax) {
            return adventure.combatState.enemyHp === adventure.combatState.enemyMaxHp ? calculatedMax : Math.min(calculatedMax, Math.round((adventure.combatState.enemyHp / adventure.combatState.enemyMaxHp) * calculatedMax));
          }
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
        const isSquadOrFodder = adventure.combatState.opponents?.some((o: any) => o.id === selId && (o.count !== undefined || o.isFodder || o.id.includes('-squad-')));
        if (!isSquadOrFodder) {
          return getNPCMaxHp(char);
        }
      }
      return adventure.combatState.enemyMaxHp;
    }
    return 100;
  });
  
  const [combatSubMenu, setCombatSubMenu] = useState<'main' | 'attack' | 'skills' | 'defend' | 'items' | 'start'>(() => adventure.combatState?.combatSubMenu ?? 'start');
  const [combatInventoryTab, setCombatInventoryTab] = useState<'all' | 'consumables' | 'weapons' | 'armor' | 'general'>('all');

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

  // Synchronize opponent counts dynamically from narrative text when messages change
  useEffect(() => {
    if (!isCombatActive || !opponents || opponents.length === 0 || !messages || messages.length === 0) return;

    const recentText = messages.slice(-3).map(m => m.text || '').join(' ');
    if (!recentText.trim()) return;

    setOpponents(prevOpponents => {
      let changed = false;
      const updated = prevOpponents.map(opp => {
        const isGroupOpponent = opp.isFodder ||
          opp.count !== undefined ||
          opp.name.toLowerCase().includes('pirat') ||
          opp.name.toLowerCase().includes('bandit') ||
          opp.name.toLowerCase().includes('soldat') ||
          opp.name.toLowerCase().includes('wache') ||
          opp.name.toLowerCase().includes('gruppe') ||
          opp.name.toLowerCase().includes('trupp') ||
          opp.name.toLowerCase().includes('bande') ||
          opp.name.toLowerCase().includes('scherge') ||
          opp.name.toLowerCase().includes('gesetzlose') ||
          opp.name.toLowerCase().includes('gegner');

        if (!isGroupOpponent) return opp;

        const parsedCount = parseGroupCountFromText(opp.name, recentText);
        if (parsedCount !== undefined && parsedCount > 0 && parsedCount !== opp.count) {
          changed = true;
          return { ...opp, count: parsedCount, isFodder: true };
        }
        return opp;
      });

      return changed ? autoSplitOpponents(updated, messages) : prevOpponents;
    });
  }, [messages, isCombatActive]);

  // Auto-split small enemy groups into individual descriptors
  useEffect(() => {
    if (!isCombatActive || !opponents || opponents.length === 0) return;
    const hasUnsplitGroup = opponents.some(o => o.count !== undefined && o.count >= 2 && o.count <= 6 && !o.id.includes('-indiv-'));
    if (hasUnsplitGroup) {
      setOpponents(prev => autoSplitOpponents(prev, messages));
    }
  }, [messages, isCombatActive]);

  // Persistent combat state synchronization
  useEffect(() => {
    const currentAdventure = adventureRef.current || adventure;
    const currentCombatState = {
      ...(currentAdventure.combatState || {}),
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

    const stored = currentAdventure.combatState;
    let hasChanged = false;

    if (!isCombatActive) {
      // Wenn der Kampf nicht aktiv ist, müssen wir nur synchronisieren, wenn der gespeicherte Zustand den Kampf noch als aktiv markiert hat
      hasChanged = Boolean(stored?.isCombatActive);
    } else {
      // Wenn der Kampf aktiv ist, synchronisieren wir alle relevanten Kampfeigenschaften
      hasChanged = !stored ||
        stored.isCombatActive !== isCombatActive ||
        stored.selectedEnemyId !== selectedEnemyId ||
        JSON.stringify(stored.selectedEnemyIds || []) !== JSON.stringify(selectedEnemyIds || []) ||
        stored.customEnemyName !== customEnemyName ||
        !Object.is(stored.playerHp, playerHp) ||
        !Object.is(stored.playerMaxHp, playerMaxHp) ||
        !Object.is(stored.playerMp, playerMp) ||
        !Object.is(stored.playerMaxMp, playerMaxMp) ||
        !Object.is(stored.enemyHp, enemyHp) ||
        !Object.is(stored.enemyMaxHp, enemyMaxHp) ||
        stored.combatSubMenu !== combatSubMenu ||
        JSON.stringify(stored.opponents || []) !== JSON.stringify(opponents || []);
    }

    if (hasChanged) {
      onUpdateAdventureRef.current({
        ...currentAdventure,
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
    combatSubMenu
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

    // Check if the NPC's current location matches the player's current location
    const playerLoc = (adventure.player?.appearance?.currentLocation || '').trim().toLowerCase();
    const npcLocation = (npc.appearance?.currentLocation || (npc as any).details?.currentLocation || (npc as any).currentLocation || '').trim().toLowerCase();

    // Strip coordinate suffixes and parentheses details like (TileName) for comparison
    const cleanPlayerLoc = playerLoc.replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim();
    const cleanNpcLocation = npcLocation.replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim();

    if (cleanNpcLocation !== cleanPlayerLoc) {
      return false; // Not at the player's location!
    }

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const aliases = [npc.name, npc.nickname, npc.rufName, (npc as any).details?.nickname, (npc as any).details?.rufName]
      .filter(Boolean)
      .map(n => escapeRegExp(n!));
    
    if (aliases.length === 0) return false;
    const regex = new RegExp(`\\b(?:${aliases.join('|')})\\b`, 'i');

    // Check if the NPC is mentioned in the recent chat history
    if (!messages || messages.length === 0) {
      // Look in prologue only if no messages exist yet
      const p = adventure.prologue || '';
      return regex.test(p);
    }

    // Combine the text of the last 4 messages (which represents the active scene/encounter)
    // We only scan actual messages, ignoring background lore/prologue once the game has messages,
    // to prevent far-away character mentions in prologue from polluting the active scene
    const recentMsgs = messages.slice(-4);
    const combinedText = recentMsgs.map(m => m.text || '').join(' ');

    return regex.test(combinedText);
  };

  const parseGroupCountFromText = (groupName: string, text: string): number | undefined => {
    if (!text || !text.trim()) return undefined;

    // 0. Check if the text explicitly describes a single individual
    const isSingleIntruder = /\b(?:eine?|einen|einem|einer|einziger|einzelne|einzelner)\s+(?:[a-zäöüß-]+\s+){0,3}(?:Gestalt|Späher|Eindringling|Pirat|Soldat|Wache|Scherge|Kämpfer|Gegner|Spion|Feind|Mann)\b/i.test(text) ||
                             /\b(?:der|ein)\s+(?:Späher|Eindringling|Spion|Kämpfer)\b/i.test(text);

    const hasExplicitPluralGroup = /\b(?:gruppe|mehrere|dutzende|schwarm|truppe|horde|armee|flotte|scharen)\b/i.test(text);

    if (isSingleIntruder && !hasExplicitPluralGroup) {
      return 1;
    }

    // 1. Check if there is a STATUS count matched in text first!
    const cleanGroupName = groupName.trim().replace(/[-\s]+/g, '_').toLowerCase();
    const statusCountRegex = new RegExp(`\\[\\[STATUS:\\s*.*?${cleanGroupName}_count\\s*=\\s*(\\d+).*?\\]\\]`, 'i');
    const statusMatch = text.match(statusCountRegex);
    if (statusMatch) {
      return parseInt(statusMatch[1]);
    }

    // Generic status count check for any _count=X in text if relevant
    const anyStatusCountMatch = text.match(/\[\[STATUS:\s*.*?_count\s*=\s*(\d+).*?\]\]/i);
    if (anyStatusCountMatch) {
      return parseInt(anyStatusCountMatch[1]);
    }

    const numberWords: Record<string, number> = {
      ein: 1, eine: 1, einen: 1, einem: 1, einer: 1, eins: 1,
      zwei: 2, zwo: 2, duo: 2, paar: 2,
      drei: 3, trio: 3,
      vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9,
      zehn: 10, elf: 11, zwölf: 12, dutzend: 12,
      dreizehn: 13, vierzehn: 14, fünfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19,
      zwanzig: 20, fünfundzwanzig: 25, dreißig: 30, vierzig: 40, fünfzig: 50,
      hundert: 100, zweihundert: 200, dreihundert: 300, fünfhundert: 500, tausend: 1000
    };

    const numRegexStr = `(\\d+|zwei|zwo|duo|paar|drei|trio|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dutzend|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig|fünfundzwanzig|dreißig|vierzig|fünfzig|hundert|tausend|ein[en]?)`;

    const enemyNouns = `(?:Männer|Kerle|Gestalten|Typen|Kämpfer|Krieger|Angreifer|Eindringlinge|Schergen|Banditen|Piraten|Soldaten|Infanteristen|Wachen|Söldner|Wölfe|Bestien|Gegner|Feinde|Personen|Mitglieder|Räuber|Rebellen|Ritter|Schützen|Matrosen|Seemänner|Miliz|Garde|Patrouille|Handlanger)`;

    const parseNumStr = (raw: string): number | undefined => {
      const lower = raw.toLowerCase().trim();
      if (/^\d+$/.test(lower)) return parseInt(lower, 10);
      if (numberWords[lower] !== undefined) return numberWords[lower];
      return undefined;
    };

    const escapedName = groupName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleanBaseName = groupName.replace(/\s*\(.*?\)/g, '').replace(/[-\s_]/g, ' ').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 2. Pattern 1: Number + (0-4 adjectives) + groupName / cleanBaseName
    const p1 = new RegExp(`\\b${numRegexStr}\\s+(?:(?:[a-zäöüß-]+)\\s+){0,4}(?:${escapedName}|${cleanBaseName})\\b`, 'i');
    const m1 = text.match(p1);
    if (m1 && !text.toLowerCase().includes(`${m1[1].toLowerCase()}-bestien`)) {
      const parsed = parseNumStr(m1[1]);
      if (parsed !== undefined) return parsed;
    }

    // 3. Pattern 2: Number + (0-4 adjectives) + generic enemy noun (Männer, Kerle, Gestalten, etc.)
    const p2 = new RegExp(`\\b${numRegexStr}\\s+(?:(?:[a-zäöüß-]+)\\s+){0,4}${enemyNouns}\\b`, 'i');
    const m2 = text.match(p2);
    if (m2 && !text.toLowerCase().includes(`${m2[1].toLowerCase()}-bestien`)) {
      const parsed = parseNumStr(m2[1]);
      if (parsed !== undefined) return parsed;
    }

    // 4. Pattern 3: Group name / enemy noun + (von / aus / bestehend aus) + Number
    const p3 = new RegExp(`(?:${escapedName}|${cleanBaseName}|${enemyNouns})\\s+(?:von|aus|bestehend aus|mit)\\s+(?:ca\\.|etwa|rund)?\\s*${numRegexStr}`, 'i');
    const m3 = text.match(p3);
    if (m3) {
      const parsed = parseNumStr(m3[1]);
      if (parsed !== undefined) return parsed;
    }

    // 5. Pattern 4: Standalone sentence analysis - check if any sentence in recent text explicitly states a number with enemy context
    const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean);
    const recentSentences = sentences.slice(-2);
    for (const sent of recentSentences) {
      // Ignore faction proper names like "100-Bestien-Piratenbande"
      if (/100-bestien|501st|3-sterne|007/i.test(sent)) continue;
      const pSent = new RegExp(`\\b${numRegexStr}\\b`, 'i');
      const mSent = sent.match(pSent);
      if (mSent) {
        const sentLower = sent.toLowerCase();
        if (sentLower.includes('männer') || sentLower.includes('piraten') || sentLower.includes('feinde') || sentLower.includes('angreifer') || sentLower.includes('wachen') || sentLower.includes('soldaten') || sentLower.includes('gestalten') || sentLower.includes('eindringlinge')) {
          const parsed = parseNumStr(mSent[1]);
          if (parsed !== undefined && parsed > 1) return parsed;
        }
      }
    }

    // Dynamic and realistic group counts if no exact number is parsed
    const lowerText = text.toLowerCase();
    const lowerName = groupName.toLowerCase();

    let scaleMultiplier = 1;
    if (lowerText.includes('hunderte')) {
      scaleMultiplier = 10;
    } else if (lowerText.includes('dutzende')) {
      scaleMultiplier = 3;
    } else if (hasExplicitPluralGroup && (lowerText.includes('viele') || lowerText.includes('zahlreiche') || lowerText.includes('unzählige') || lowerText.includes('scharen') || lowerText.includes('große menge') || lowerText.includes('armee') || lowerText.includes('flotte'))) {
      scaleMultiplier = 2;
    }

    if (scaleMultiplier > 1) {
      if (lowerName.includes('marine') || lowerName.includes('soldat') || lowerName.includes('infanterie')) {
        return 10 * scaleMultiplier;
      }
      if (lowerName.includes('wache') || lowerName.includes('sicherheitskräfte')) {
        return 6 * scaleMultiplier;
      }
      if (lowerName.includes('pirat') || lowerName.includes('bandit') || lowerName.includes('räuber')) {
        return 8 * scaleMultiplier;
      }
      return 5 * scaleMultiplier;
    }

    return 2;
  };

  const generateEnemyPowerLevels = () => {
    const powerLevels: Record<string, { value: number; potentialMax: number }> = {};
    if (adventure.world.campaignPowerSettings) {
      Object.entries(adventure.world.campaignPowerSettings).forEach(([key, val]: [string, any]) => {
        const minVal = typeof val === 'object' ? (val?.min ?? 40) : 40;
        const maxVal = typeof val === 'object' ? (val?.max ?? 100) : 100;
        const randomVal = Math.floor(minVal + Math.random() * (maxVal - minVal) * 0.75);
        powerLevels[key] = {
          value: Math.max(minVal, Math.min(maxVal, randomVal)),
          potentialMax: maxVal
        };
      });
    }
    return powerLevels;
  };

  // Erkennt anwesende Gegner und feindliche Gruppen aus den jüngsten Chat-Ereignissen
  const detectedEnemies = React.useMemo(() => {
    const presentList: { id: string; name: string; type: 'npc' | 'group' | 'dynamic'; subtitle?: string }[] = [];
    const addedNames = new Set<string>();

    if (!messages || messages.length === 0) return presentList;

    // First scan the MOST RECENT message (active immediate scene context)
    const lastMsg = messages[messages.length - 1];
    const lastMsgText = lastMsg?.text || '';

    // Also prepare combined text of last 2 messages if lastMsg alone is short
    const recentMsgs = messages.slice(-2);
    const combinedRecentText = recentMsgs.map(m => m.text || '').join(' ');

    const textToScan = lastMsgText.trim().length > 40 ? lastMsgText : combinedRecentText;

    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    // 1. Check all characters in Codex - ONLY HOSTILE ONES
    const codexChars = (adventure.loreDatabase || []).filter(item => item.category === 'Charaktere');
    codexChars.forEach(char => {
      const lowerTitle = char.title.toLowerCase();
      if (adventure.player?.name && isNameMatch(adventure.player.name, adventure.player.nickname, char.title)) return;

      const npc = (adventure.npcs || []).find(n => isNameMatch(n.name, n.nickname || (n as any).rufName, char.title));
      
      const isExplicitlyHostile = npc?.isHostile || char.details?.isHostile === true;
      const isAlly = npc?.role?.toLowerCase().includes('gefährte') || 
                     npc?.role?.toLowerCase().includes('verbündet') ||
                     npc?.role?.toLowerCase().includes('freund') ||
                     npc?.role?.toLowerCase().includes('mentor') ||
                     npc?.role?.toLowerCase().includes('lehrer') ||
                     char.details?.role?.toLowerCase().includes('gefährte') ||
                     char.details?.role?.toLowerCase().includes('verbündet') ||
                     char.details?.role?.toLowerCase().includes('freund') ||
                     char.details?.role?.toLowerCase().includes('mentor') ||
                     char.details?.role?.toLowerCase().includes('lehrer') ||
                     (char.details?.relationship && /freund|alli|mentor|lehr|geliebte|gefähr/i.test(JSON.stringify(char.details.relationship)));

      if (isAlly || (!isExplicitlyHostile && npc !== undefined)) return;

      const aliases = [char.title, char.details?.nickname, char.details?.rufName]
        .filter(Boolean)
        .map(n => escapeRegExp(n!));
      const regex = new RegExp(`\\b(?:${aliases.join('|')})\\b`, 'i');
      if (regex.test(textToScan) || regex.test(combinedRecentText)) {
        presentList.push({
          id: char.id || npc?.id || `detected-char-${lowerTitle}`,
          name: char.title,
          type: 'npc',
          subtitle: char.details?.role || npc?.role || 'Gegner'
        });
        addedNames.add(lowerTitle);
      }
    });

    // 2. Check all Gegner (Enemies) in Codex
    const codexEnemies = (adventure.loreDatabase || []).filter(item => item.category === 'Gegner');
    codexEnemies.forEach(enemy => {
      const lowerTitle = enemy.title.toLowerCase();
      // EXPLICIT CHECK: Skip if it matches the player's name/nickname or is a friendly companion NPC!
      if (adventure.player?.name && isNameMatch(adventure.player.name, adventure.player.nickname, enemy.title)) return;
      const isFriendlyNpc = (adventure.npcs || []).some(n => !n.isHostile && isNameMatch(n.name, n.nickname || (n as any).rufName, enemy.title));
      if (isFriendlyNpc) return;

      const regex = new RegExp(`\\b${escapeRegExp(enemy.title)}\\b`, 'i');
      if (regex.test(textToScan) || regex.test(combinedRecentText)) {
        // If an enemy title is a broad faction (e.g. "Piraten der Kaiser"), but a more specific member (e.g. "Bestien-Späher") was already added from text, skip the broad faction title unless explicitly stated as plural
        const isBroadFaction = lowerTitle.includes('piraten der') || lowerTitle === 'piraten' || lowerTitle === 'marine';
        const hasSpecificMember = presentList.some(p => p.name.toLowerCase().includes('späher') || p.name.toLowerCase().includes('eindringling') || p.name.toLowerCase().includes('kapitän'));
        if (isBroadFaction && hasSpecificMember && !/\b(?:gruppe|armee|truppe|flotte|viele|dutzende)\b/i.test(textToScan)) {
          return;
        }

        const isGroup = enemy.details?.itemType === 'Gruppe' || 
                        enemy.details?.rarity === 'Gruppe' ||
                        lowerTitle.includes('bande') || 
                        lowerTitle.includes('rudel') || 
                        lowerTitle.includes('trupp') || 
                        lowerTitle.includes('wachen') || 
                        lowerTitle.includes('soldaten') ||
                        lowerTitle.includes('marinesoldat') ||
                        lowerTitle.includes('infanterie') ||
                        lowerTitle.includes('infanteristen');
        presentList.push({
          id: enemy.id || `detected-enemy-${lowerTitle}`,
          name: enemy.title,
          type: isGroup ? 'group' : 'npc',
          subtitle: enemy.details?.role || 'Gegner'
        });
        addedNames.add(lowerTitle);
      }
    });

    // 3. Dynamic Hostile Keywords (Only add if no specific individual enemy covers it)
    const hasSpecificEnemyAlready = presentList.length > 0;

    const dynamicHostileKeywords: Array<{ pattern: RegExp; name: string; role: string; excludeContext?: RegExp }> = [
      { pattern: /\bmarine(?:-)?soldat(?:en)?\b/i, name: 'Marine-Soldaten', role: 'Gruppe / Kaiserliche Marine' },
      { pattern: /\bmarine(?:-)?infanterist(?:en)?\b/i, name: 'Marine-Infanteristen', role: 'Gruppe / Kaiserliche Marine' },
      { pattern: /\bsoldat(?:en)?\b/i, name: 'Soldaten', role: 'Gruppe / Soldaten' },
      { pattern: /\binfanterist(?:en)?\b/i, name: 'Infanteristen', role: 'Gruppe / Truppen' },
      { pattern: /\bräuber(?:bande)?\b/i, name: 'Räuber-Bande', role: 'Gruppe / Gesetzlose' },
      { pattern: /\bbanditen?\b/i, name: 'Banditen', role: 'Gruppe / Gesetzlose' },
      { pattern: /\bpiraten?\b/i, name: 'Piraten', role: 'Gruppe / Gesetzlose' },
      { pattern: /\bwölfe\b/i, name: 'Wildes Wolfsrudel', role: 'Gruppe / Wilde Bestien' },
      { pattern: /\bskelette?\b/i, name: 'Skelett-Krieger', role: 'Gruppe / Untote' },
      { pattern: /\bklonkrieger\b/i, name: 'Klonkrieger', role: 'Gruppe / Truppen' },
      { pattern: /\bgoblins?\b/i, name: 'Goblin-Plünderer', role: 'Gruppe / Kreaturen' },
      { pattern: /\borks?\b/i, name: 'Ork-Krieger', role: 'Gruppe / Kreaturen' },
      { pattern: /\bdämonen?\b/i, name: 'Dämonen', role: 'Gruppe / Höllenbrut' },
      { pattern: /\bmutanten?\b/i, name: 'Mutanten', role: 'Gruppe / Mutierte Wesen' },
      { pattern: /\bschergen?\b/i, name: 'Schergen', role: 'Gruppe / Handlanger' },
      { pattern: /\bwachen?\b/i, name: 'Wachen', role: 'Gruppe / Sicherheitskräfte' },
      { pattern: /\bsöldner\b/i, name: 'Söldner-Trupp', role: 'Gruppe / Söldner' },
      { pattern: /\bzombies?\b/i, name: 'Zombies', role: 'Gruppe / Untote' },
      { pattern: /\bbestien?\b/i, name: 'Wilde Bestien', role: 'Gruppe / Kreaturen', excludeContext: /100-bestien|bestien-späher|bestien-pirat|bestien-bande|bestien-jäger/i },
      { pattern: /\bmonster\b/i, name: 'Wilde Monster', role: 'Kreaturen' },
      { pattern: /\bangreifer?\b/i, name: 'Angreifer', role: 'Feindliche Gruppe' },
      { pattern: /\bspäher\b/i, name: 'Späher', role: 'Gegner / Aufklärung' },
      { pattern: /\bkrieger\b/i, name: 'Krieger', role: 'Gegner / Kämpfer' },
      { pattern: /\bvorhut(?:en)?\b/i, name: 'Vorhut', role: 'Gegner / Trupp' },
      { pattern: /\b(?:pirat(?:en)?|piratenbande)\b/i, name: 'Piraten', role: 'Gruppe / Gesetzlose' },
      { pattern: /\b(?:agent(?:en)?|assassin(?:en)?|ninja)\b/i, name: 'Agent / Assassine', role: 'Gegner' }
    ];

    dynamicHostileKeywords.forEach(kw => {
      const lowerName = kw.name.toLowerCase();
      
      // Skip generic keyword detection if we ALREADY detected a specific named enemy (like "Bestien-Späher") AND the text doesn't explicitly describe a separate group
      if (hasSpecificEnemyAlready && !/\b(?:gruppe|mehrere|dutzende|schwarm|truppe|horde|armee)\b/i.test(textToScan)) {
        return;
      }

      // Check if context excludes this keyword (e.g. 100-Bestien-Piratenbande is not "Wilde Bestien")
      if (kw.excludeContext && kw.excludeContext.test(textToScan)) {
        return;
      }

      if (kw.pattern.test(textToScan) && !addedNames.has(lowerName)) {
        let duplicate = false;
        const norm = (s: string) => s.toLowerCase().replace(/[-\s_]/g, '');
        const normLower = norm(lowerName);
        
        addedNames.forEach(name => {
          const normName = norm(name);
          if (normName.includes(normLower) || normLower.includes(normName)) duplicate = true;
        });
        
        if (!duplicate) {
          presentList.push({
            id: `detected-dyn-group-${lowerName.replace(/\s+/g, '-')}`,
            name: kw.name,
            type: 'group',
            subtitle: kw.role
          });
          addedNames.add(lowerName);
        }
      }
    });

    return presentList;
  }, [adventure.npcs, adventure.loreDatabase, messages]);

  // KI-Gegner-Extraktion (Auto-Detect via Gemini)
  useEffect(() => {
    if (isCombatMenuExpanded && !isCombatActive) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'model' && lastMsg.id !== lastExtractedMessageId && !isExtractingEnemies) {
        
        const extract = async () => {
          setIsExtractingEnemies(true);
          try {
            const prompt = `Analysiere den folgenden RPG-Text und extrahiere alle feindlichen Charaktere, Monster oder feindlichen Gruppen, die im Text als aktuell physisch anwesend beschrieben werden.
Sei dabei so präzise und detailliert wie möglich:
1. Nutze für "name" den genauen, beschreibenden Namen inklusive Adjektiven (z.B. "bunter Späher", "gehörnter Krieger mit Eisenkeule", "Piraten von Kaido").
2. Setze "type" auf "npc" für Einzelpersonen oder "group" für Gruppen.
3. Ergänze in "subtitle" Fraktionen, Zugehörigkeiten oder Rollen, wenn diese im Text erwähnt werden (z.B. "Kaidos Armee", "Piraten", "Aufklärung"). Wenn es eine Gruppe ist und eine genaue Anzahl im Text steht, erwähne diese im subtitle (z.B. "Kaidos Armee (2)", "Wolfsrudel (ca. 5)").
Antworte AUSSCHLIESSLICH im JSON-Format: {"enemies": [{"name": "...", "type": "npc"|"group", "subtitle": "..."}]}
Wenn keine Feinde anwesend sind, antworte mit {"enemies": []}.
Text:
"${lastMsg.text}"`;
            
            const response = await GeminiService.chat([{ id: '1', role: 'user', text: prompt }], "Du bist ein JSON-Daten-Extraktor für ein RPG.", false, "");
            let jsonStr = response.text;
            if (jsonStr.includes('```json')) {
              jsonStr = jsonStr.split('```json')[1].split('```')[0];
            } else if (jsonStr.includes('```')) {
              jsonStr = jsonStr.split('```')[1].split('```')[0];
            }
            
            const parsed = JSON.parse(jsonStr.trim());
            if (parsed && Array.isArray(parsed.enemies)) {
               const mapped = parsed.enemies.map((e: any, idx: number) => ({
                 id: `ai-extracted-${Date.now()}-${idx}`,
                 name: e.name || 'Unbekannter Gegner',
                 type: e.type === 'group' ? 'group' : 'npc',
                 subtitle: e.subtitle || (e.type === 'group' ? 'Erkannte Gruppe (KI)' : 'Erkannter Gegner (KI)')
               }));
               setAiExtractedEnemies(mapped);
            } else {
               setAiExtractedEnemies([]);
            }
          } catch (e) {
            console.error("Fehler bei der automatischen KI-Gegner-Extraktion:", e);
          } finally {
            setIsExtractingEnemies(false);
            setLastExtractedMessageId(lastMsg.id);
          }
        };
        
        extract();
      }
    }
  }, [isCombatMenuExpanded, isCombatActive, messages, lastExtractedMessageId, isExtractingEnemies]);

  const combinedDetectedEnemies = React.useMemo(() => {
     // KI-Extrahierte Gegner priorisieren
     const list: {id: string, name: string, type: 'npc'|'group'|'dynamic', subtitle?: string}[] = [...aiExtractedEnemies];
     
     // Generische Regex-Gegner nur hinzufügen, wenn sie nicht schon (ähnlich) von der KI gefunden wurden
     detectedEnemies.forEach(regexE => {
       const normRegex = regexE.name.toLowerCase().trim();
       const isDuplicate = list.some(aiE => {
         const normAi = aiE.name.toLowerCase().trim();
         return normAi === normRegex || normAi.includes(normRegex) || normRegex.includes(normAi);
       });
       
       if (!isDuplicate) {
         list.push(regexE);
       }
     });
     
     return list;
  }, [detectedEnemies, aiExtractedEnemies]);

  // Synchronize detected enemies into Codex (loreDatabase) as 'Gegner' entries automatically
  useEffect(() => {
    if (!combinedDetectedEnemies || combinedDetectedEnemies.length === 0) return;

    const currentAdventure = adventureRef.current || adventure;
    const currentLore = currentAdventure.loreDatabase || [];
    const newGegnerEntries: any[] = [];
    const newNotifications: any[] = [];

    combinedDetectedEnemies.forEach(enemy => {
      const cleanName = enemy.name.trim();
      if (!cleanName || cleanName.toLowerCase() === 'widersacher') return;

      const exists = currentLore.some(e =>
        (e.category === 'Gegner' || e.category === 'Charaktere') &&
        (
          e.title.trim().toLowerCase() === cleanName.toLowerCase() ||
          e.title.toLowerCase().replace(/[-\s_]/g, '') === cleanName.toLowerCase().replace(/[-\s_]/g, '') ||
          isSimilarLoreTitle(e.title, cleanName) ||
          isNameMatch(e.title, e.details?.nickname, cleanName)
        )
      );

      if (!exists) {
        const isGroup = enemy.type === 'group' ||
                        cleanName.toLowerCase().includes('bande') ||
                        cleanName.toLowerCase().includes('rudel') ||
                        cleanName.toLowerCase().includes('trupp') ||
                        cleanName.toLowerCase().includes('wachen') ||
                        cleanName.toLowerCase().includes('soldaten') ||
                        cleanName.toLowerCase().includes('gegner') ||
                        cleanName.toLowerCase().includes('marine') ||
                        cleanName.toLowerCase().includes('infanterie');

        const newEntry = {
          id: 'dyn-gegner-' + Math.random().toString(36).substr(2, 9),
          category: 'Gegner' as const,
          title: cleanName,
          description: isGroup
            ? `Eine gefährliche Gruppe von ${cleanName}, die sich dem Spieler feindselig in den Weg stellt.`
            : `Ein feindseliger Gegner namens ${cleanName}, der den Spieler im Kampf fordert.`,
          isUnlocked: true,
          details: {
            role: enemy.subtitle || 'Gegner',
            goal: 'Den Spieler aufhalten',
            rarity: isGroup ? 'Gruppe' : 'Standard',
            itemType: isGroup ? 'Gruppe' : 'Kreatur',
            campaignPowerLevels: generateEnemyPowerLevels()
          }
        };
        newGegnerEntries.push(newEntry);
        
        // Add a small local notification that a new Codex entry is unlocked/added!
        newNotifications.push({
          id: 'notif-' + Math.random().toString(36).substr(2, 9),
          type: 'add' as const,
          title: cleanName,
          category: 'Gegner'
        });
      }
    });

    if (newGegnerEntries.length > 0) {
      onUpdateAdventureRef.current({
        ...currentAdventure,
        loreDatabase: [...currentLore, ...newGegnerEntries]
      });
      if (newNotifications.length > 0) {
        addLoreNotifications(newNotifications);
      }
    }
  }, [detectedEnemies]);

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
        const actCondStr = a.activationCondition ? `, Aktivierungsbedingung: ${a.activationCondition}` : '';
        parts.push(`[Kraft ${i+1}] Quelle: ${a.source || 'Unbekannt'}, Kategorie: ${a.category || 'Allgemein'}, Kosten: ${a.cost || 'Keine'}, Detail: ${a.description || 'Keine'}, Techniken: ${a.techniques || 'Keine'}${actCondStr}`);
      });
    }
    if (parts.length === 0) return 'Keine speziellen Kräfte';
    return parts.join(' | ');
  };

  const getPlayerCurrentOutfit = () => {
    const armor = adventure.structuredInventory?.armor;
    if (!armor) return adventure.player.appearance?.outfit || 'Standard';
    
    const pieces: string[] = [];
    if (armor.chest) pieces.push(armor.chest);
    else if (adventure.player.appearance?.outfit) pieces.push(adventure.player.appearance.outfit);
    
    if (armor.legs) pieces.push(armor.legs);
    if (armor.head) pieces.push(`auf dem Kopf: ${armor.head}`);
    if (armor.feet) pieces.push(`an den Füßen: ${armor.feet}`);
    if (armor.hands) pieces.push(`an den Händen: ${armor.hands}`);
    
    return pieces.length > 0 ? pieces.join(', ') : (adventure.player.appearance?.outfit || 'Standard');
  };

  const getPlayerPhysicalStatusSummary = () => {
    const resolved = resolveBodyAppearance(adventure.player);
    const activeTransId = adventure.player.appearance?.activeTransformationId || 'standard';
    const activeTrans = activeTransId !== 'standard'
      ? (adventure.player.abilities || []).find(a => a.id === activeTransId && a.category === 'Transformationen')
      : null;

    const isFemale = (resolved.effectiveGender || 'Weiblich').toLowerCase() === 'weiblich';
    const parts: string[] = [];

    if (activeTrans) {
      const transName = activeTrans.transformName || activeTrans.name || 'Transformation';
      const perceptionMode = activeTrans.transformIdentityPerception || 'bekannt';
      if (perceptionMode === 'getrennt') {
        parts.push(`[AKTIVE FORM: "${transName}"] - GEHEIMIDENTITÄT / 2 SEPARATE PERSONEN: Die KI und NPCs in der Welt nehmen diese verwandelte Gestalt als eine VOLLKOMMEN FREMDE BZW. UNBEKANNTE PERSON WAHR. NPCs erkennen NICHT, dass es ${adventure.player.name} ist, es sei denn der Spieler offenbart es in der Geschichte!`);
      } else if (perceptionMode === 'koerpertausch') {
        const swappedName = activeTrans.transformSwappedCharacterName || transName;
        parts.push(`[AKTIVE FORM: "${transName}"] - KÖRPERTAUSCH / SEELENTAUSCH MIT "${swappedName}": KÖRPERTAUSCH IST AKTIV!
- IDENTITÄT & ÖFFENTLICHE WAHRNEHMUNG: Das Bewusstsein/die Seele von ${adventure.player.name} befindet sich im physischen Körper von "${swappedName}". Die Welt, NPCs und Fraktionen nehmen den Spieler zu 100% als "${swappedName}" wahr (gleiche Stimme, Aussehen, Identität, sozialer Status, Beziehungen und Loyalitäten). Niemand ahnt den Seelentausch, außer der Spieler verhält sich extrem auffällig oder offenbart es selbst!
- KAMPFFÄHIGKEITEN & KRÄFTE: Der Spieler verfügt im Kampf über die körperlichen Kräfte, Fertigkeiten und Techniken von "${swappedName}".`);
      } else {
        parts.push(`[AKTIVE FORM: "${transName}"] - BEKANNTE IDENTITÄT: Die KI und NPCs in der Welt wissen und erkennen, dass es sich um ${adventure.player.name} in verwandelter Form handelt.`);
      }
    }

    if (resolved.activeConditionList && resolved.activeConditionList.length > 0) {
      parts.push(`[AKTIVE KÖRPERVERÄNDERUNGEN & ZUSTÄNDE (HUD)]: ${resolved.activeConditionList.map(c => `${c.icon || ''} ${c.name} (${c.type === 'gender_change' ? 'Geschlechtswechsel' : c.type === 'race_change' ? 'Rassenwechsel' : c.type === 'curse' ? 'Fluch' : c.type === 'blessing' ? 'Segen' : 'Zustand'}${c.duration ? ` - ${c.duration}` : ''}: ${c.description})`).join(', ')}`);
    }

    if (resolved.hudStatusTags && resolved.hudStatusTags.length > 0) {
      parts.push(`HUD-Status-Tags: ${resolved.hudStatusTags.join(', ')}`);
    }

    if (resolved.effectiveGender) parts.push(`Geschlecht: ${resolved.effectiveGender}`);
    if (resolved.effectiveRace) parts.push(`Rasse: ${resolved.effectiveRace}${resolved.effectiveRaceFeatures ? ` (${resolved.effectiveRaceFeatures})` : ''}`);
    if (resolved.age) parts.push(`${resolved.age} Jahre alt`);
    if (resolved.effectiveHeightCm) parts.push(`Größe: ${resolved.effectiveHeightCm}cm`);
    if (resolved.build) parts.push(`Statur: ${resolved.build}`);
    if (resolved.effectiveWeightKg) parts.push(`Gewicht: ${resolved.effectiveWeightKg}kg`);
    if (resolved.effectiveBodyFat) parts.push(`KFA: ${resolved.effectiveBodyFat}%`);
    if (resolved.effectiveMuscleMass) parts.push(`Muskelmasse: ${resolved.effectiveMuscleMass}%`);
    if (resolved.effectiveMeasurements) parts.push(`Maße (Brust-Taille-Hüfte): ${resolved.effectiveMeasurements}`);
    if (isFemale && resolved.effectiveCupSize && resolved.effectiveCupSize !== '-') parts.push(`Körbchengröße: ${resolved.effectiveCupSize}`);
    if (resolved.effectiveWings) parts.push(`Flügel: Vorhanden & aktiv`);
    if (resolved.effectiveHorns) parts.push(`Hörner: Vorhanden & sichtbar`);
    if (resolved.effectiveInjuries) parts.push(`Aktuelle Verletzungen/Wunden: ${resolved.effectiveInjuries}`);
    if (resolved.specialFeaturesList && resolved.specialFeaturesList.length > 0) {
      parts.push(`Besondere Merkmale: ${resolved.specialFeaturesList.join(', ')}`);
    }
    
    const pregMonth = resolved.pregnancyMonth ? parseInt(resolved.pregnancyMonth) : ((resolved as any).silhouetteState?.pregnancyMonth || 0);
    if (isFemale && pregMonth > 0) {
      let bumpDesc = '';
      if (pregMonth <= 1) bumpDesc = 'Kaum sichtbar, allererste Frühphase';
      else if (pregMonth === 2) bumpDesc = 'Leichte Rundung im Unterbauch erahnbar';
      else if (pregMonth === 3) bumpDesc = 'Kleine, aber sichtbare Wölbung';
      else if (pregMonth === 4) bumpDesc = 'Kleiner, eindeutiger Babybauch';
      else if (pregMonth === 5) bumpDesc = 'Deutlich sichtbarer, mittlerer Babybauch';
      else if (pregMonth === 6) bumpDesc = 'Runder, ausgeprägter Babybauch';
      else if (pregMonth === 7) bumpDesc = 'Großer, schwerer Babybauch';
      else if (pregMonth === 8) bumpDesc = 'Sehr großer Bauch, spürbare Einschränkung';
      else bumpDesc = 'Hochschwanger, massiver Bauch, baldige Geburt';
      
      const silState = (resolved as any).silhouetteState || {};
      const daysRemaining = silState.pregnancyDaysRemaining !== undefined ? silState.pregnancyDaysRemaining : Math.max(0, 270 - (pregMonth - 1) * 30);
      const testDone = silState.pregnancyTestDone || false;
      const changesVisible = silState.pregnancyChangesVisible || false;
      const shownInHUD = testDone || changesVisible;

      parts.push(`SCHWANGERSCHAFT: ${pregMonth}. Monat (${bumpDesc}, +${Math.round(pregMonth * 1.4)}kg Gewichtszunahme, Noch ${daysRemaining} Tage bis zur Geburt, Test positiv: ${testDone ? 'Ja' : 'Nein'}, Körperliche Veränderungen aufgetreten: ${changesVisible ? 'Ja' : 'Nein'}, Sichtbarkeit im HUD Körperlicher Zustand: ${shownInHUD ? 'Ja (Sichtbar)' : 'Nein (Verborgen)'})`);
    } else if (isFemale) {
      parts.push(`Schwangerschaft: Nicht schwanger`);
    }

    const hFactor = resolved.effectiveHealingFactor || 1;
    const hFactorLabels: Record<number, string> = {
      1: 'Stufe 1: Normal (menschliche Wundheilung in Tagen/Wochen, normale Regeneration)',
      2: 'Stufe 2: Erhöht / Zäh (Wunden heilen in Stunden, +25% HP/Ressourcen-Regen bei Rast)',
      3: 'Stufe 3: Schnell / Magisch (Wunden verheilen in Minuten/Stunden, +50% HP & Ausdauer-Regen)',
      4: 'Stufe 4: Extrem / Erwacht (Verletzungen schließen sich im Kampf/Minuten, +100% In-Fight Erholung)',
      5: 'Stufe 5: Übernatürlich / Unsterblich (Sofortige Gewebe- & Knochenregeneration, kontinuierliche Auffüllung)'
    };
    parts.push(`HEILFAKTOR & REGENERATION: ${hFactorLabels[hFactor] || `Stufe ${hFactor}`}`);

    if (resolved.effectiveSkinTone) parts.push(`Haut: ${resolved.effectiveSkinTone}`);
    if (resolved.effectiveHairColor) parts.push(`Haare: ${resolved.effectiveHairColor}`);
    if (resolved.effectiveEyeColor) parts.push(`Augen: ${resolved.effectiveEyeColor}`);
    if (resolved.isVirgin) {
      parts.push('Körperlicher Status: Jungfrau');
    } else {
      parts.push('Körperlicher Status: Keine Jungfrau');
    }
    if (resolved.hasChildren || (resolved.childrenCount || 0) > 0) {
      parts.push(`Nachkommen: ${resolved.childrenCount || 1} Kinder`);
    }
    if (getPlayerCurrentOutfit()) parts.push(`Kleidung: ${getPlayerCurrentOutfit()}`);
    if (resolved.currentLocation) parts.push(`Aktueller Standort: ${resolved.currentLocation}`);

    const emoState = adventure.player?.emotionState || adventure.emotionState || {};
    if (emoState.emotion || emoState.tone) {
      parts.push('AKTUELLE EMOTION DES SPIELERS: ' + (emoState.emotion || 'Ruhig') + ' (Intensität: ' + (emoState.intensity || 'Mittel') + ', Tonart/Stimme: ' + (emoState.tone || 'Normal') + ')');
    }

    const perceptionBlock = buildPhysicalStatusAndPerceptionPrompt(
      adventure.player,
      resolved,
      null,
      adventure.npcs,
      adventure.npcAppearanceMemory
    );
    if (perceptionBlock) {
      parts.push('\n' + perceptionBlock);
    }

    return parts.join(', ');
  };

  const getActiveTerritoryInstruction = () => {
    const currentLocName = (adventure?.player?.appearance?.currentLocation || '').trim();
    if (!currentLocName) return '';

    const territories = adventure?.world?.territories || [];
    
    // Clean coordinates and parentheses from location name for comparison
    const cleanLocName = currentLocName.replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim().toLowerCase();
    
    // Try to find matching territory
    const activeTerr = territories.find((t: any) => {
      const cleanTName = (t.name || '').replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim().toLowerCase();
      return cleanTName === cleanLocName || t.id === currentLocName;
    });

    if (!activeTerr) {
      return `\nAKTUELLES GEBIET / STANDORT:
- Name: ${currentLocName}
Hinweis: Für diesen genauen Standort existiert kein detaillierter Eintrag in der Gebietsdatenbank. Beschreibe die Umgebung passend und logisch basierend auf dem Namen.`;
    }

    // If we found the territory, extract its specific fields
    const typeLabel = activeTerr.type ? activeTerr.type.toUpperCase() : 'ORT';
    const owner = activeTerr.ruler || activeTerr.controlledByFactionId || '';
    const residents = activeTerr.population || '';
    const functionTrade = activeTerr.trade || '';
    const equipment = activeTerr.resources || '';
    const security = activeTerr.defense || '';
    const poi = activeTerr.pointsOfInterest || '';
    const desc = activeTerr.description || '';
    const danger = activeTerr.dangerLevel || '';
    const terrain = activeTerr.terrain || '';
    const climate = activeTerr.climate || '';

    return `\nAKTUELLES GEBIET / STANDORT:
- Name: ${activeTerr.name} (Typ: ${typeLabel})
${desc ? `- Beschreibung: ${desc}` : ''}
${terrain ? `- Umgebung/Gelände: ${terrain}` : ''}
${climate ? `- Klima: ${climate}` : ''}
${owner ? `- Besitzer/Herrscher: ${owner}` : ''}
${residents ? `- Personal / Bewohner (Hintergrund-Präsenz): ${residents}` : ''}
${functionTrade ? `- Funktion/Nutzung: ${functionTrade}` : ''}
${equipment ? `- Ausstattung/Ressourcen: ${equipment}` : ''}
${security ? `- Sicherheit/Wachen: ${security}` : ''}
${poi ? `- Besonderheiten/POIs: ${poi}` : ''}
${danger ? `- Gefahrenstufe/Risiken: ${danger}` : ''}

WICHTIGE ERZÄHLERISCHE ANWEISUNG FÜR DEN DUNGEON MASTER (STRENGSTENS EINZUHALTEN):
Du MUSST die oben gelisteten namenlosen Personalgruppen, Bediensteten, Wachen, Köche oder Bewohner ("Personal / Bewohner") sowie die Sicherheitsvorkehrungen aktiv und lebendig in das Geschehen im Hintergrund deiner Antworten einbinden! 
- Sie sind im Hintergrund präsent: Diener eilen durch die Flure des Anwesens, Köche klappern in der Küche mit Töpfen, Wachen patrouillieren auf den Mauern oder Gängen.
- Reagiere dynamisch auf die Situation: Wenn es zu einem Schrei, Lärm oder Kampf kommt, stürmen nahegelegene Wachen oder Bedienstete besorgt in das Zimmer. Wenn der Spieler die Küche betritt, agieren dort die Köche fleißig und reagieren auf ihn. Wenn er die Gänge durchstreift, begegnet er dem Hauspersonal, das seiner Arbeit nachgeht.
- Lass die Szene nicht leer oder ausgestorben wirken, sondern fülle sie mit dem beschriebenen Personal/Bewohnern, um eine lebendige, stimmige und logische Kulisse zu erschaffen!`;
  };

  const renderDialogueText = (text: string) => {
    // Helper 1: Detect expression from speech heuristics
    const detectExpressionFromSpeech = (speech: string): string => {
      const t = speech.toLowerCase();
      
      // Angry / Wütend
      if (
        t.includes('!') && (
          t.includes('wütend') || t.includes('zorn') || t.includes('verdammt') || 
          t.includes('sauer') || t.includes('schreit') || t.includes('brüllt') || 
          t.includes('haß') || t.includes('hasse') || t.includes('miststück') ||
          t.includes('schlag') || t.includes('groll') || t.includes('zähne') ||
          t.includes('wut')
        )
      ) {
        return 'angry';
      }
      
      // Sad / Traurig
      if (
        t.includes('traurig') || t.includes('weint') || t.includes('trän') || 
        t.includes('sniff') || t.includes('schluchz') || t.includes('schade') || 
        t.includes('leider') || t.includes('kummer') || t.includes('verlust') ||
        t.includes('schmerz') || t.includes('ach ') || t.includes('tut mir leid') ||
        t.includes('seufz') || t.includes('enttäuscht')
      ) {
        return 'sad';
      }
      
      // Happy / Glücklich
      if (
        t.includes('lacht') || t.includes('lächelt') || t.includes('glücklich') || 
        t.includes('freu') || t.includes('toll') || t.includes('super') || 
        t.includes('wunderbar') || t.includes('haha') || t.includes('hehe') ||
        t.includes('kichert') || t.includes('juchz') || t.includes('gut gelaunt') ||
        t.includes('herzlich')
      ) {
        return 'happy';
      }
      
      // Surprised / Überrascht
      if (
        (t.includes('?') && t.includes('!')) || t.includes('was?!') || t.includes('was!?') ||
        t.includes('überrascht') || t.includes('erstaunt') || t.includes('schock') || 
        t.includes('unglaublich') || t.includes('huch') || t.includes('oh!') ||
        t.includes('starre') || t.includes('augen auf') || t.includes('fassungslos')
      ) {
        return 'surprised';
      }
      
      // Blushing / Errötet
      if (
        t.includes('schüchtern') || t.includes('errötet') || t.includes('verlegen') || 
        t.includes('peinlich') || t.includes('rot im gesicht') || t.includes('stottert') || 
        t.includes('verliebt') || t.includes('liebe') || t.includes('süß') ||
        t.includes('schwärm') || t.includes('kuscheln')
      ) {
        return 'blushing';
      }
      
      return 'neutral';
    };

    // Helper 2: Map raw emotion string to key
    const getExpressionKey = (raw: string | undefined): string | null => {
      if (!raw) return null;
      const t = raw.toLowerCase().trim();
      if (t === 'neutral' || t === 'standard' || t === 'normal') return 'neutral';
      if (t === 'glücklich' || t === 'happy' || t === 'freu' || t === 'fröhlich' || t === 'lachend' || t === 'lächelnd') return 'happy';
      if (t === 'traurig' || t === 'sad' || t === 'weinerlich' || t === 'enttäuscht') return 'sad';
      if (t === 'wütend' || t === 'angry' || t === 'zornig' || t === 'sauer' || t === 'erboßt') return 'angry';
      if (t === 'überrascht' || t === 'surprised' || t === 'erstaunt' || t === 'schockiert') return 'surprised';
      if (t === 'errötet' || t === 'blushing' || t === 'schüchtern' || t === 'verlegen' || t === 'peinlich') return 'blushing';
      return null;
    };

    // Helper 3: Lookup matching portrait in player, npcs or lore
    const getCharacterPortrait = (name: string, exprKey: string): string | undefined => {
      const normalizedName = name.trim().toLowerCase();
      
      // Player lookup
      const playerName = adventure.player.name?.trim().toLowerCase();
      if (normalizedName === playerName || normalizedName === 'spieler') {
        if (adventure.player.expressions && adventure.player.expressions[exprKey]) {
          return adventure.player.expressions[exprKey];
        }
        return adventure.player.image;
      }
      
      // NPC lookup
      const npc = adventure.npcs?.find(n => n.name?.trim().toLowerCase() === normalizedName || n.rufName?.trim().toLowerCase() === normalizedName);
      if (npc) {
        if (npc.expressions && npc.expressions[exprKey]) {
          return npc.expressions[exprKey];
        }
        return npc.image;
      }
      
      // Lore entry character lookup
      const loreEntry = adventure.loreDatabase?.find(l => (l.category === 'Charaktere' || (l.category as string) === 'Gegner') && (l.title?.trim().toLowerCase() === normalizedName || l.details?.rufName?.trim().toLowerCase() === normalizedName));
      if (loreEntry) {
        const entryExprs = loreEntry.expressions || loreEntry.details?.expressions;
        if (entryExprs && entryExprs[exprKey]) {
          return entryExprs[exprKey];
        }
        return loreEntry.image;
      }

      return undefined;
    };

    const lines = text.split('\n');
    const dialogueLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      
      // Match: Name (Expression): Text or Name [Expression]: Text or Name: Text
      const match = trimmed.match(/^([^:([\]]+)(?:\s*[([]([^)\]]+)[)\]])?\s*:\s*(.*)$/);
      if (match) {
        const name = match[1].trim();
        const rawExpression = match[2];
        let speech = match[3].trim();
        if ((speech.startsWith('"') && speech.endsWith('"')) || (speech.startsWith('"') && speech.endsWith('"'))) {
          speech = speech.slice(1, -1);
        }
        return { name, rawExpression, speech };
      }
      return null;
    });

    const nonNewLinesCount = lines.filter(l => l.trim().length > 0).length;
    const isStructured = dialogueLines.filter(l => l !== null).length >= nonNewLinesCount * 0.5;

    if (isStructured && nonNewLinesCount > 0) {
      return (
        <div className="space-y-3.5 font-sans my-1.5">
          {dialogueLines.map((line, lIdx) => {
            if (!line) return null;
            const isPlayer = line.name.toLowerCase() === adventure.player.name.toLowerCase() || line.name.toLowerCase() === 'spieler';
            
            // Determine expression and fetch matching portrait
            const exprKey = getExpressionKey(line.rawExpression) || detectExpressionFromSpeech(line.speech);
            const portraitUrl = getCharacterPortrait(line.name, exprKey);

            return (
              <div key={lIdx} className={`flex gap-3 items-start ${isPlayer ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Character Portrait with hover badge */}
                {portraitUrl ? (
                  <div className="relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden border-2 border-slate-800 shadow bg-slate-900 group">
                    <img 
                      src={portraitUrl} 
                      alt={line.name} 
                      className="w-full h-full object-cover select-none" 
                      referrerPolicy="no-referrer"
                    />
                    {/* Tiny expression badge on hover */}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-center text-slate-300 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold tracking-widest">
                      {exprKey}
                    </div>
                  </div>
                ) : (
                  /* Fallback subtle initials avatar */
                  <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center bg-slate-950/60 text-slate-500 text-xs font-bold uppercase select-none">
                    {line.name.slice(0, 2)}
                  </div>
                )}

                {/* Speech Bubble with unique design */}
                <div className={`flex-1 min-w-0 flex flex-col gap-1 p-2.5 rounded-2xl border ${isPlayer ? 'bg-amber-500/10 border-amber-500/25 rounded-tr-none' : 'bg-slate-950/60 border-slate-800/80 rounded-tl-none'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider ${isPlayer ? 'text-amber-400' : 'text-sky-400'}`}>
                      {line.name}
                    </span>
                    {exprKey !== 'neutral' && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800/60 select-none">
                        {exprKey === 'happy' && ' Glücklich'}
                        {exprKey === 'sad' && ' Traurig'}
                        {exprKey === 'angry' && ' Wütend'}
                        {exprKey === 'surprised' && ' Überrascht'}
                        {exprKey === 'blushing' && ' Errötet'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm md:text-[15px] leading-relaxed text-slate-200">
                    "{line.speech}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="font-sans leading-relaxed text-sm md:text-[15px] p-1 text-slate-200">
        <p className="italic text-slate-400 text-xs mb-1 uppercase tracking-widest font-extrabold">Antwort:</p>
        <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
          <p className="text-base font-medium">"{text.replace(/^["'"]|["'"]$/g, '')}"</p>
        </div>
      </div>
    );
  };

  const getInventoryAndEquipmentSummary = () => {
    const structuredInv = adventure.structuredInventory;
    const inventoryList = adventure.inventory || [];
    
    if (!structuredInv) {
      if (inventoryList.length > 0) {
        return `Tasche: ${inventoryList.join(', ')}`;
      }
      return 'Keine Gegenstände oder Ausrüstung im Inventar.';
    }

    const parts: string[] = [];
    
    // Armor/Clothing
    const armor = structuredInv.armor || {};
    const armorParts: string[] = [];
    if (armor.head) armorParts.push(`Kopf: ${armor.head}`);
    if (armor.chest) armorParts.push(`Torso/Kleidung: ${armor.chest}`);
    if (armor.hands) armorParts.push(`Hände: ${armor.hands}`);
    if (armor.legs) armorParts.push(`Beine: ${armor.legs}`);
    if (armor.feet) armorParts.push(`Füße: ${armor.feet}`);
    if (armorParts.length > 0) {
      parts.push(`Getragene Rüstung/Kleidung: ${armorParts.join(', ')}`);
    } else if (adventure.player.appearance?.outfit) {
      parts.push(`Getragene Rüstung/Kleidung: ${adventure.player.appearance.outfit}`);
    }

    // Accessories
    const acc = structuredInv.accessories || {};
    const accParts: string[] = [];
    if (acc.finger) accParts.push(`Finger: ${acc.finger}`);
    if (acc.neck) accParts.push(`Hals: ${acc.neck}`);
    if (acc.wrist) accParts.push(`Handgelenk: ${acc.wrist}`);
    if (acc.waist) accParts.push(`Taille: ${acc.waist}`);
    if (acc.back) accParts.push(`Rücken: ${acc.back}`);
    if (accParts.length > 0) {
      parts.push(`Angelegte Accessoires: ${accParts.join(', ')}`);
    }

    // Weapons
    const weapons = structuredInv.weapons || [];
    if (weapons.length > 0) {
      parts.push(`Ausgerüstete Waffen: ${weapons.join(', ')}`);
    }

    // General items
    const general = structuredInv.generalItems || [];
    const allItems = [...general, ...inventoryList];
    if (allItems.length > 0) {
      parts.push(`Im Besitz (Tasche/Verbrauchsgüter): ${allItems.join(', ')}`);
    }

    // Money
    if (structuredInv.money !== undefined) {
      parts.push(`Vermögen: ${structuredInv.money} ${structuredInv.currencyLabel || 'Goldstücke'}`);
    }

    return parts.length > 0 ? parts.join('\n      - ') : 'Keine Gegenstände oder Ausrüstung im Inventar.';
  };

  const getTacticalBattlefieldSummary = () => {
    if (!adventure.combatState) return '';
    const { positions = {}, placedObjects = [] } = adventure.combatState;
    const playerKey = adventure.player.name || 'Spieler';
    const playerLocation = adventure.player.appearance?.currentLocation || 'Nicht definiert';
    
    if (Object.keys(positions).length === 0 && placedObjects.length === 0) {
      return '';
    }

    let summary = `\n      TAKTISCHES SCHLACHTFELD & RASTER-KARTE (AKTUELLE POSITIONEN):\n`;
    summary += `      (WICHTIG: Berücksichtige diese Raster-Koordinaten, um exakte Entfernungen und Sichtlinien zu kennen! Das Raster ist in XY-Koordinaten aufgeteilt.)\n`;
    
    const playerPos = positions[playerKey];
    if (playerPos) {
      summary += `      - Spieler (${playerKey}): Position X:${playerPos.x}, Y:${playerPos.y} [Mit Codex Aktueller Standort verbunden: ${playerLocation}]\n`;
    }
    
    Object.entries(positions).forEach(([key, pos]: [string, any]) => {
      if (key !== playerKey) {
        const npc = adventure.npcs?.find((n: any) => n.name === key || n.nickname === key);
        const npcLoc = npc?.appearance?.currentLocation ? ` [Mit Codex Aktueller Standort verbunden: ${npc.appearance.currentLocation}]` : '';
        summary += `      - ${key}: Position X:${pos.x}, Y:${pos.y}${npcLoc}\n`;
      }
    });

    if (placedObjects.length > 0) {
      placedObjects.forEach((obj: any) => {
        const npc = adventure.npcs?.find((n: any) => n.name === obj.name || n.nickname === obj.name);
        const npcLoc = npc?.appearance?.currentLocation ? ` [Mit Codex Aktueller Standort verbunden: ${npc.appearance.currentLocation}]` : '';
        const countInfo = obj.currentCount !== undefined ? `, Aktuelle Belegung/Anzahl: ${obj.currentCount}` : '';
        const maxInfo = obj.maxCapacity !== undefined ? `, Max. Kapazität/Größe: ${obj.maxCapacity}` : '';
        summary += `      - ${obj.name} (${obj.category}${obj.faction ? `, Fraktion: ${obj.faction}` : ''}${countInfo}${maxInfo}): Position X:${obj.x}, Y:${obj.y}${npcLoc}\n`;
      });
    }

    return summary;
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
    abilityId?: string;
    abilityCategory?: string;
    staticCost?: string;
    baseValue?: number;
    effectValue?: string;
    costFormula?: 'absolut' | 'proz.';
    costValue?: number;
    costResourceName?: string;
    applications?: string[];
    summonCount?: number;
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
      abilityId?: string;
      abilityCategory?: string;
      staticCost?: string;
      baseValue?: number;
      effectValue?: string;
      costFormula?: 'absolut' | 'proz.';
      costValue?: number;
      costResourceName?: string;
      applications?: string[];
      summonCount?: number;
    }[] = [];
    
    // Check if we have abilities
    const hasAbilities = adventure.player.abilities && adventure.player.abilities.length > 0;

    if (hasAbilities) {
      // First, always add the Transformation itself as a selectable action for any Transformation category ability
      adventure.player.abilities.forEach(ability => {
        if (ability.category === 'Transformationen' && ability.name && ability.name.trim().length > 0) {
          let parsedCostValue = 15;
          let parsedCostResource = 'MP';
          
          if (ability.cost) {
            const matchNum = ability.cost.match(/\d+/);
            if (matchNum) {
              parsedCostValue = parseInt(matchNum[0]);
            }
            const matchRes = ability.cost.match(/[A-Za-zÄäÖöÜü]+/);
            if (matchRes) {
              parsedCostResource = matchRes[0];
            }
          }
          
          list.push({
            name: `Verwandlung: ${ability.name.trim()}`,
            description: ability.description || `Verwandle dich in deine ${ability.name.trim()}-Gestalt.`,
            source: ability.source,
            cost: ability.cost || 'MP',
            type: 'Transformation',
            subtype: 'Form-Aktivierung',
            level: 1,
            abilityId: ability.id,
            abilityCategory: 'Transformationen',
            costFormula: 'absolut',
            costValue: parsedCostValue,
            costResourceName: parsedCostResource,
            baseValue: 0,
            effectValue: `Aktiviert ${ability.name.trim()}`
          });
        }
      });

      adventure.player.abilities.forEach(ability => {
        if (ability.techniqueList && ability.techniqueList.length > 0) {
          ability.techniqueList.forEach(t => {
            if (t.name && t.name.trim().length > 0) {
              list.push({ 
                name: t.name.trim(), 
                description: t.description,
                source: ability.source,
                cost: t.cost || ability.cost, // use technique cost name if defined, else fallback to ability
                type: t.type,
                subtype: t.subtype,
                level: t.level || 1,
                xp: t.xp || 0,
                maxLevel: t.maxLevel || 10,
                xpNeeded: t.xpNeeded || 100,
                abilityId: ability.id,
                abilityCategory: ability.category,
                staticCost: t.staticCost,
                baseValue: t.baseValue,
                effectValue: t.effectValue,
                costFormula: t.costFormula,
                costValue: t.costValue,
                costResourceName: t.costResourceName,
                applications: t.applications,
                summonCount: t.summonCount
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
            list.push({ 
              name, 
              source: ability.source, 
              cost: ability.cost, 
              type: guessedType, 
              level: 1,
              abilityId: ability.id,
              abilityCategory: ability.category
            });
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

    // Deduplicate list by skill name (case-insensitive), favoring structured/detailed techniques over plain text strings
    const uniqueList: typeof list = [];
    const seenMap = new Map<string, number>();

    list.forEach(item => {
      const key = item.name.trim().toLowerCase();
      const existingIdx = seenMap.get(key);

      if (existingIdx === undefined) {
        seenMap.set(key, uniqueList.length);
        uniqueList.push(item);
      } else {
        const existingItem = uniqueList[existingIdx];
        const existingIsDetailed = existingItem.baseValue !== undefined || existingItem.effectValue !== undefined || existingItem.staticCost !== undefined || existingItem.costValue !== undefined || (existingItem.applications && existingItem.applications.length > 0);
        const newItemIsDetailed = item.baseValue !== undefined || item.effectValue !== undefined || item.staticCost !== undefined || item.costValue !== undefined || (item.applications && item.applications.length > 0);

        if (newItemIsDetailed && !existingIsDetailed) {
          uniqueList[existingIdx] = item;
        } else if (newItemIsDetailed && existingIsDetailed) {
          uniqueList[existingIdx] = {
            ...item,
            ...existingItem,
            description: existingItem.description || item.description,
            applications: existingItem.applications || item.applications
          };
        }
      }
    });

    return uniqueList;
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
      }, 3500);
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

    const isNameAlreadyExists = (incomingName: string): boolean => {
      const incClean = incomingName.trim().toLowerCase().replace(/^(sir|mr\.|mr|ms\.|ms|captain|kapitän|admiral|vizeadmiral|vize-admiral|yonko|kaiser|shichibukai|samurai)\s+/i, '');
      if (!incClean) return false;

      if (adventure.player?.name) {
        const pName = adventure.player.name.trim().toLowerCase();
        if (pName === incClean || pName.includes(incClean) || incClean.includes(pName)) return true;
        if (adventure.player.nickname) {
          const pNick = adventure.player.nickname.trim().toLowerCase();
          if (pNick === incClean || pNick.includes(incClean) || incClean.includes(pNick)) return true;
        }
      }

      return updatedLore.some(e => {
        if (e.category !== 'Charaktere' && e.category !== 'Gegner') return false;
        
        if (isNameMatch(e.title, e.details?.nickname || e.details?.rufName, incomingName)) {
          return true;
        }
        
        return isSimilarTitle(e.title, incomingName);
      });
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

    const isOnePieceWorld = !!adventure.world?.isOnePiece;

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
              const exists = isNameAlreadyExists(name);
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
        const exists = isNameAlreadyExists(name);
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
            const exists = isNameAlreadyExists(name);
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
            const exists = isNameAlreadyExists(name);
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
            const exists = isNameAlreadyExists(name);
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
        addLoreNotifications(notifications);
      }
      onUpdateAdventure({
        ...adventure,
        loreDatabase: updatedLore,
        npcs: updatedNpcs
      });
    }
  }, [messages, adventure.id]);

  const syncLocationToWorldHelper = (targetWorld: any, locTitle: string, locDesc: string, details: any) => {
    if (!targetWorld) return { coordinates: { x: 50, y: 50 }, mapLevel: 'meso' as const };
    if (!Array.isArray(targetWorld.territories)) targetWorld.territories = [];
    if (!Array.isArray(targetWorld.connections)) targetWorld.connections = [];

    const combined = (locTitle + ' ' + locDesc).toLowerCase();

    // 1. Detect Direction
    let direction = details.direction || '';
    if (!direction) {
      if (/südost|süd-ost|southeast/i.test(combined)) direction = 'Südosten';
      else if (/südwest|süd-west|southwest/i.test(combined)) direction = 'Südwesten';
      else if (/nordost|nord-ost|northeast/i.test(combined)) direction = 'Nordosten';
      else if (/nordwest|nord-west|northwest/i.test(combined)) direction = 'Nordwesten';
      else if (/süden|nach süden|südlich|south/i.test(combined)) direction = 'Süden';
      else if (/norden|nach norden|nördlich|north/i.test(combined)) direction = 'Norden';
      else if (/osten|nach osten|östlich|east/i.test(combined)) direction = 'Osten';
      else if (/westen|nach westen|westlich|west/i.test(combined)) direction = 'Westen';
    }

    // 2. Detect Travel Time / Duration
    let travelTime = details.travelTime || '';
    if (!travelTime) {
      const travelMatch = locDesc.match(/(?:reisezeit|reise|entfernung|dauer|fußmarsch|marsch|fahrt)\s*:\s*([^,\.\n\|]+)/i) ||
                          locDesc.match(/(\d+\s*(?:tage|tagen|monate|monaten|wochen|stunden|jahre|tage\s*reise|monate\s*reise))/i);
      if (travelMatch && travelMatch[1]) {
        travelTime = travelMatch[1].trim();
      }
    }

    // 3. Detect Map Level & Type
    let mapLevel: 'macro' | 'meso' | 'micro' = details.mapLevel || 'meso';
    let territoryType: Territory['type'] = 'ort';
    let shapeType: 'circle' | 'rectangle' | 'polygon' = 'circle';
    let color = '#3b82f6';

    if (/gilde|taverne|haus|höhle|shop|laden|markt|zimmer|poi|bar|herberge|schrein|ruine|tempel|palast|platz|arena|zuhause|kerker/i.test(combined)) {
      mapLevel = 'micro';
      territoryType = 'gebäude';
      color = '#f59e0b';
    } else if (/kontinent|welt|reich|königreich|ozean|meer|archipel|insel/i.test(combined)) {
      mapLevel = 'macro';
      if (/meer|ozean/i.test(combined)) {
        territoryType = 'meer';
        color = '#0284c7';
      } else if (/kontinent/i.test(combined)) {
        territoryType = 'kontinent';
        shapeType = 'polygon';
        color = '#b91c1c';
      } else {
        territoryType = 'insel';
        shapeType = 'polygon';
        color = '#0d9488';
      }
    } else if (/festung|burg|bastion/i.test(combined)) {
      territoryType = 'festung';
      color = '#dc2626';
    } else if (/stadt|dorf|siedlung|hafen/i.test(combined)) {
      territoryType = 'stadt';
      color = '#8b5cf6';
    }

    // 4. Determine Origin / Parent
    let refTerritory: any = null;
    if (targetWorld.territories.length > 0) {
      refTerritory = targetWorld.territories[targetWorld.territories.length - 1];
    }

    let baseX = refTerritory ? refTerritory.x : 120;
    let baseY = refTerritory ? refTerritory.y : 70;

    let stepDistance = 22;
    if (/stund/i.test(travelTime)) stepDistance = 8;
    else if (/monat/i.test(travelTime)) stepDistance = 55;
    else if (/woch/i.test(travelTime)) stepDistance = 35;
    else if (/tag/i.test(travelTime)) {
      const num = parseInt(travelTime) || 2;
      stepDistance = Math.min(45, 14 + num * 5);
    }

    let dx = 0;
    let dy = 0;
    if (direction === 'Süden') { dy = stepDistance; dx = (Math.random() - 0.5) * 8; }
    else if (direction === 'Norden') { dy = -stepDistance; dx = (Math.random() - 0.5) * 8; }
    else if (direction === 'Osten') { dx = stepDistance; dy = (Math.random() - 0.5) * 8; }
    else if (direction === 'Westen') { dx = -stepDistance; dy = (Math.random() - 0.5) * 8; }
    else if (direction === 'Südosten') { dx = stepDistance * 0.7; dy = stepDistance * 0.7; }
    else if (direction === 'Südwesten') { dx = -stepDistance * 0.7; dy = stepDistance * 0.7; }
    else if (direction === 'Nordosten') { dx = stepDistance * 0.7; dy = -stepDistance * 0.7; }
    else if (direction === 'Nordwesten') { dx = -stepDistance * 0.7; dy = -stepDistance * 0.7; }
    else {
      const angle = (targetWorld.territories.length * 1.35) % (Math.PI * 2);
      dx = Math.cos(angle) * stepDistance;
      dy = Math.sin(angle) * stepDistance;
    }

    const finalX = Math.round(Math.max(15, Math.min(225, baseX + dx)));
    const finalY = Math.round(Math.max(15, Math.min(125, baseY + dy)));
    const coordinates = { x: finalX, y: finalY };

    // Check existing territory in world
    const existingTerrIdx = targetWorld.territories.findIndex((t: any) => 
      t.name.toLowerCase().trim() === locTitle.toLowerCase().trim() ||
      isSimilarLoreTitle(t.name, locTitle)
    );

    if (existingTerrIdx === -1) {
      let polygonPoints: any = undefined;
      const newRadius = territoryType === 'kontinent' ? 35.0 : territoryType === 'insel' ? 15.0 : 12.0;
      if (shapeType === 'polygon' || territoryType === 'insel' || territoryType === 'kontinent') {
        polygonPoints = createOrganicIslandPoints(finalX, finalY, newRadius, targetWorld.territories.length + 5);
      }

      const newTerr: any = {
        id: `terr-dyn-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: locTitle,
        type: territoryType,
        description: locDesc,
        parentId: refTerritory ? refTerritory.id : null,
        x: finalX,
        y: finalY,
        radius: shapeType === 'circle' ? 1.6 : newRadius,
        shapeType,
        points: polygonPoints,
        color,
        faction: 'Neutral',
        dangerLevel: 'Normal',
        isUnlocked: true,
        direction: direction || undefined,
        travelTime: travelTime || undefined,
        routeFrom: refTerritory ? refTerritory.name : undefined
      };
      targetWorld.territories.push(newTerr);

      if (refTerritory) {
        const newConn = {
          id: `conn-${refTerritory.id}-${newTerr.id}`,
          fromId: refTerritory.id,
          toId: newTerr.id,
          label: travelTime || (direction ? `Reise (${direction})` : 'Reiseweg'),
          travelTime: travelTime || undefined,
          type: (territoryType === 'meer' || refTerritory.type === 'meer') ? 'sea' : 'land',
          isUnlocked: true
        };
        targetWorld.connections.push(newConn);
      }
    } else {
      const existingT = targetWorld.territories[existingTerrIdx];
      targetWorld.territories[existingTerrIdx] = {
        ...existingT,
        description: locDesc || existingT.description,
        travelTime: travelTime || existingT.travelTime,
        direction: direction || existingT.direction,
        isUnlocked: true
      };
    }

    return {
      mapLevel,
      coordinates,
      direction: direction || undefined,
      travelTime: travelTime || undefined,
      parentPlaceId: refTerritory ? refTerritory.name : undefined
    };
  };

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
    let updatedWorld = currentAdventure.world 
      ? JSON.parse(JSON.stringify(currentAdventure.world)) 
      : { territories: [], connections: [] };
    if (!Array.isArray(updatedWorld.territories)) updatedWorld.territories = [];
    if (!Array.isArray(updatedWorld.connections)) updatedWorld.connections = [];

    let cleanedText = text;
    let notifications: any[] = [];

    const isPlayerMatch = (incomingName: string | undefined) => {
      if (!incomingName) return false;
      const incLower = incomingName.trim().toLowerCase();
      return (
        incLower === 'spieler' ||
        incLower === 'player' ||
        isNameMatch(updatedPlayer.name, updatedPlayer.nickname, incomingName)
      );
    };

    // Helper for adding/updating dynamic territory & travel connection
    const syncLocationToWorld = (locTitle: string, locDesc: string, details: any) => {
      return syncLocationToWorldHelper(updatedWorld, locTitle, locDesc, details);
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
      if (catLower.includes('ort') || catLower.includes('weltkarte') || catLower.includes('territor') || catLower.includes('gebiet')) category = 'Weltkarte';
      else if (catLower.includes('gegner') || catLower.includes('feind') || catLower.includes('monster') || catLower.includes('boss')) category = 'Gegner';
      else if (catLower.includes('char') || catLower.includes('person')) category = 'Charaktere';
      else if (catLower.includes('frakt') || catLower.includes('gild') || catLower.includes('bünd')) category = 'Fraktionen';
      else if (catLower.includes('gegen') || catLower.includes('waff') || catLower.includes('item') || catLower.includes('objekt')) category = 'Gegenstände';
      else if (catLower.includes('fähig') || catLower.includes('kraft') || catLower.includes('magie') || catLower.includes('jutsu') || catLower.includes('verbot') || catLower.includes('geheim') || catLower.includes('wiss')) category = 'Verbotenes Wissen';
      else if (catLower.includes('event') || catLower.includes('ereignis') || catLower.includes('quest') || catLower.includes('story')) category = 'Story & Quests';
      else if (catLower.includes('regel') || catLower.includes('gesetz')) category = 'Weltregeln';

      if (category === 'Gegenstände' && (isClothingPlaceholder(title) || isClothingItemTitle(title, description))) {
        continue;
      }

      if (category === 'Weltkarte') {
        const synced = syncLocationToWorld(title, description, {});
        notifications.push({
          id: Math.random().toString(),
          type: 'add',
          title: synced.travelTime ? `${title} (${synced.travelTime})` : title,
          category: 'Weltkarte'
        });
        continue;
      }

      let existsIdx = -1;
      if (category === 'Charaktere' || category === 'Gegner') {
        existsIdx = updatedLore.findIndex(e => (e.category === 'Charaktere' || e.category === 'Gegner') && (isNameMatch(e.title, e.details?.nickname, title) || isSimilarLoreTitle(e.title, title)));
      } else {
        existsIdx = updatedLore.findIndex(e => e.category === category && isSimilarLoreTitle(e.title, title));
      }

      if (existsIdx === -1) {
        let details: any = {};
        if (category === 'Gegenstände') {
          const combined = (title + ' ' + description).toLowerCase();
          let itemType = 'Werkzeuge & Alltags-Gegenstände';
          let rarity = 'Gewöhnlich';
          let owner = updatedPlayer.name || 'Spieler';

          // Extract owner if explicitly mentioned in description (e.g. "Besitzer: Zoro" or "Besitz von Luffy")
          const ownerMatch = description.match(/(?:besitzer|owner|besitz von|in den händen von)\s*:\s*([^,\.\n\|]+)/i) ||
                             description.match(/(?:gehört|im besitz von)\s+([A-Za-z0-9äöüÄÖÜß\s]+?)(?:[,\.\n]|$)/i);
          if (ownerMatch && ownerMatch[1]) {
            const parsedOwner = ownerMatch[1].trim();
            if (parsedOwner) {
              owner = parsedOwner;
            }
          }

          const weaponKeywords = ['schwert', 'bogen', 'dolch', 'klinge', 'degen', 'gewehr', 'pistole', 'lanze', 'speer', 'axt', 'tsuki no wa', 'säbel', 'katana', 'waffe', 'weapon', 'messer', 'schild', 'drachenschwert', 'lanze', 'kolben', 'hammer'];
          const armorKeywords = ['kleidung', 'rüstung', 'hemd', 'mantel', 'stiefel', 'handschuhe', 'helm', 'hose', 'panzer', 'robe', 'tunik', 'gewand', 'rüstungsteil'];
          const accessoryKeywords = ['ring', 'kette', 'amulett', 'halskette', 'armband', 'ohrring', 'schmuck', 'juwel', 'krone', 'reliquie', 'talisman'];
          const consumableKeywords = ['trank', 'potion', 'elixier', 'apfel', 'brot', 'heiltrank', 'medizin', 'kraut', 'pille', 'nahrung'];
          const questKeywords = ['schlüssel', 'brief', 'karte', 'buch', 'dokument', 'notiz', 'siegel', 'quest', 'pergament', 'beweis'];

          if (weaponKeywords.some(kw => combined.includes(kw))) {
            itemType = 'Waffen';
          } else if (armorKeywords.some(kw => combined.includes(kw))) {
            itemType = 'Rüstung / Kleidung';
          } else if (accessoryKeywords.some(kw => combined.includes(kw))) {
            itemType = 'Artefakte / Zubehör';
          } else if (consumableKeywords.some(kw => combined.includes(kw))) {
            itemType = 'Verbrauchsgüter';
          } else if (questKeywords.some(kw => combined.includes(kw))) {
            itemType = 'Questgegenstände / Story-Objekte';
          }

          if (combined.includes('drachenschwert') || combined.includes('saijo o wazamono') || combined.includes('legendär') || combined.includes('göttlich') || combined.includes('artefakt') || combined.includes('supreme grade') || combined.includes('drachen-schwert')) {
            rarity = 'Legendär';
          } else if (combined.includes('episch') || combined.includes('meisterhaft') || combined.includes('o wazamono') || combined.includes('great grade')) {
            rarity = 'Episch';
          } else if (combined.includes('selten') || combined.includes('rar') || combined.includes('wazamono') || combined.includes('wertvoll')) {
            rarity = 'Selten';
          } else if (combined.includes('ungewöhnlich')) {
            rarity = 'Ungewöhnlich';
          }

          let isUnique = 'Massenware / Gewöhnlich';
          if (rarity === 'Legendär' || rarity === 'Episch' || combined.includes('einzigartig') || combined.includes('unikat') || combined.includes('artefakt')) {
            isUnique = 'Unikat (Existiert nur 1x auf der Welt)';
          } else if (rarity === 'Selten' || combined.includes('selten')) {
            isUnique = 'Seltenes Einzelstück';
          }

          const isPlayerOwned = isPlayerMatch(owner);
          let currentLocation = isPlayerOwned ? 'Im Besitz des Spielers' : `Im Besitz von ${owner}`;
          if (combined.includes('gestohlen') || combined.includes('entwendet') || combined.includes('geklaut')) {
            currentLocation = 'Gestohlen / Entwendet';
          } else if (combined.includes('verschollen') || combined.includes('verloren') || combined.includes('ruinen')) {
            currentLocation = 'Verschollen in der Welt';
          }

          details = {
            itemType,
            rarity,
            owner,
            isUnique,
            currentLocation
          };

          // Synchronize with player's structuredInventory
          if (isPlayerOwned) {
            if (itemType === 'Waffen' || weaponKeywords.some(kw => combined.includes(kw))) {
              if (!updatedStructuredInventory.weapons) updatedStructuredInventory.weapons = [];
              if (!updatedStructuredInventory.weapons.some((w: string) => w.trim().toLowerCase() === title.trim().toLowerCase())) {
                updatedStructuredInventory.weapons.push(title);
              }
            } else {
              if (!updatedStructuredInventory.generalItems) updatedStructuredInventory.generalItems = [];
              if (!updatedStructuredInventory.generalItems.some((i: string) => i.trim().toLowerCase() === title.trim().toLowerCase())) {
                updatedStructuredInventory.generalItems.push(title);
              }
            }
          }
        }

        const newEntry = {
          id: 'dyn-' + Math.random().toString(36).substr(2, 9),
          category,
          title,
          description,
          isUnlocked: true,
          details
        };
        updatedLore.push(newEntry as any);
        notifications.push({
          id: Math.random().toString(),
          type: 'add',
          title: category === 'Gegenstände' && details?.owner ? `${title} (Besitzer: ${details.owner})` : title,
          category
        });
      } else {
        const existingEntry = updatedLore[existsIdx];
        let mergedDetails = { ...existingEntry.details };
        if (category === 'Gegenstände') {
          const ownerMatch = description.match(/(?:besitzer|owner|besitz von|in den händen von)\s*:\s*([^,\.\n\|]+)/i);
          if (ownerMatch && ownerMatch[1]) {
            mergedDetails.owner = ownerMatch[1].trim();
          }
        }

        const newDescTrimmed = description?.trim() || '';
        const oldDescTrimmed = existingEntry.description?.trim() || '';
        const descChanged = newDescTrimmed && newDescTrimmed !== oldDescTrimmed;

        updatedLore[existsIdx] = {
          ...existingEntry,
          description: descChanged ? description : existingEntry.description,
          details: mergedDetails,
          isUnlocked: true
        };

        // Only add a notification if the entry was locked previously or newly unlocked
        if (!existingEntry.isUnlocked) {
          notifications.push({
            id: Math.random().toString(),
            type: 'add',
            title: `${title} (Freigeschaltet)`,
            category
          });
        }
      }
    }

    // Parse TERRITORY_ADD: [[TERRITORY_ADD: Name | Typ | Übergeordnetes_Gebiet | Reisezeit/Richtung | Beschreibung]]
    const terrAddRegex = /\[\[TERRITORY_ADD:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^\]]+)\]\]/g;
    let terrAddMatch;
    while ((terrAddMatch = terrAddRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(terrAddMatch[0], '');
      const tName = terrAddMatch[1].trim();
      const tType = terrAddMatch[2].trim();
      const tParent = terrAddMatch[3].trim();
      const tTravel = terrAddMatch[4].trim();
      const tDesc = terrAddMatch[5].trim();

      const synced = syncLocationToWorld(tName, tDesc, {
        travelTime: tTravel,
        parentPlaceId: tParent
      });

      notifications.push({
        id: Math.random().toString(),
        type: 'add',
        title: `${tName} (${tTravel || tType})`,
        category: 'Weltkarte'
      });
    }

    // Parse CONDITION_ADD: [[CONDITION_ADD: Name | Typ | Beschreibung | Quelle]]
    const condAddRegex = /\[\[CONDITION_ADD:\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)(?:\s*\|\s*([^\]]+))?\]\]/g;
    let condAddMatch;
    while ((condAddMatch = condAddRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(condAddMatch[0], '');
      const condName = condAddMatch[1].trim();
      const condType = (condAddMatch[2].trim().toLowerCase() as any) || 'curse';
      const condDesc = condAddMatch[3].trim();
      const condSource = (condAddMatch[4] || 'Fremdeinfluss').trim();

      const currentConditions = [...(updatedPlayer.appearance?.activeConditions || [])];
      const existingIdx = currentConditions.findIndex(c => c.name.toLowerCase() === condName.toLowerCase());
      const newCondition = {
        id: existingIdx >= 0 ? currentConditions[existingIdx].id : `cond-chat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: condName,
        type: (condType === 'blessing' ? 'blessing' : condType === 'mutation' ? 'magical_mutation' : 'curse') as any,
        category: 'Körperlicher Zustand / Statuseffekt',
        isActive: true,
        severity: 'leicht' as const,
        source: condSource,
        duration: 'Temporär (Aktiv)',
        description: condDesc
      };

      if (existingIdx >= 0) {
        currentConditions[existingIdx] = { ...currentConditions[existingIdx], ...newCondition, isActive: true };
      } else {
        currentConditions.push(newCondition);
      }

      updatedPlayer = {
        ...updatedPlayer,
        appearance: {
          ...(updatedPlayer.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
          activeConditions: currentConditions
        }
      };

      notifications.push({
        id: Math.random().toString(),
        type: 'add',
        title: `${condName} (Körperlicher Zustand)`,
        category: 'Zustand'
      });
    }

    // Parse CONDITION_REMOVE: [[CONDITION_REMOVE: Name]]
    const condRemRegex = /\[\[CONDITION_REMOVE:\s*([^\]]+)\]\]/g;
    let condRemMatch;
    while ((condRemMatch = condRemRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(condRemMatch[0], '');
      const condName = condRemMatch[1].trim().toLowerCase();
      const currentConditions = (updatedPlayer.appearance?.activeConditions || []).filter(c => c.name.toLowerCase() !== condName);

      updatedPlayer = {
        ...updatedPlayer,
        appearance: {
          ...(updatedPlayer.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' }),
          activeConditions: currentConditions
        }
      };
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

    // Helper to update event step status in loreDatabase
    const updateEventStepStatusInLore = (stepIdent: string, rawStatus: string) => {
      const targetStatus = (rawStatus.includes('happen') || rawStatus.includes('eingetreten') || rawStatus.includes('erfüllt') || rawStatus.includes('abgeschlossen') || rawStatus.includes('done') || rawStatus.includes('complete') || rawStatus === 'true' || rawStatus === '1') ? 'happened' : 'pending';

      updatedLore.forEach((entry, eIdx) => {
        if (entry.category === 'Story & Quests' && entry.details?.eventSteps) {
          const steps = [...entry.details.eventSteps];
          let updated = false;

          steps.forEach((s: any, sIdx: number) => {
            const stepNumStr = (sIdx + 1).toString();
            const cleanIdent = stepIdent.trim().toLowerCase().replace(/^(station_|eventstep_|queststep_|station\s*#?)/i, '');
            const isMatch = cleanIdent === stepNumStr || 
                            isSimilarLoreTitle(s.title, stepIdent) ||
                            (s.title && isSimilarLoreTitle(s.title, cleanIdent)) ||
                            (s.title && s.title.toLowerCase().includes(cleanIdent));
            
            if (isMatch) {
              steps[sIdx] = { ...s, status: targetStatus };
              updated = true;
              if (targetStatus === 'happened') {
                notifications.push({
                  id: Math.random().toString(),
                  type: 'add',
                  title: `Story-Station eingetreten: ${s.title || `Station #${sIdx + 1}`}`,
                  category: 'Story & Quests'
                });
              }
            }
          });

          if (updated) {
            updatedLore[eIdx] = {
              ...entry,
              details: {
                ...entry.details,
                eventSteps: steps
              }
            };
          }
        }
      });
    };

    // Parse EVENT_STEP_SET: [[EVENT_STEP_SET: StationIdent = status]]
    const eventStepRegex = /\[\[EVENT_STEP_SET:\s*([^=\|]+)(?:=|\s*\|\s*)([^\]]+)\]\]/g;
    let eventStepMatch;
    while ((eventStepMatch = eventStepRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(eventStepMatch[0], '');
      updateEventStepStatusInLore(eventStepMatch[1].trim(), eventStepMatch[2].trim());
    }

    // Parse STATUS station tags: [[STATUS: Station_1=happened]]
    const statusStationRegex = /\[\[STATUS:\s*(?:station_|eventstep_|queststep_)([^=\|\]]+)=(.*?)\]\]/gi;
    let statusStationMatch;
    while ((statusStationMatch = statusStationRegex.exec(text)) !== null) {
      updateEventStepStatusInLore(statusStationMatch[1].trim(), statusStationMatch[2].trim());
    }

    // Parse RELATIONSHIP: [[RELATIONSHIP: NameA | NameB | Typ | Verhalten]]
    // STRIKTES VERBOT: Beziehungen und Verhalten vorhandener Charaktere (Spieler, existierende NPCs, Codex) dürfen im Chat NICHT verändert oder überschrieben werden!
    const relRegex = /\[\[RELATIONSHIP:\s*([^|\]]+)\s*\|\s*([^|\]]+)\s*\|\s*([^|\]]+)\s*\|\s*([^\]]+)\]\]/g;
    let relMatch;
    while ((relMatch = relRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(relMatch[0], '');
      // Keine Modifikation vorhandener Charaktere oder deren Beziehungen/Verhalten
    }

    // Parse CHAR_SET: [[CHAR_SET: Name | Field=Value | Field=Value]]
    // STRIKTES VERBOT: Vorhandene Charaktere (Spieler, NPCs, existierende Codex-Einträge) dürfen während des Chats NIEMALS verändert oder überschrieben werden!
    const charRegex = /\[\[CHAR_SET:\s*([^|\]]+)((?:\|(?:[^\]]+))*)\]\]/g;
    let charMatch;
    while ((charMatch = charRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(charMatch[0], '');
      const charName = charMatch[1].trim();

      // Schutzprüfung: Wenn der Charakter bereits als Spieler, NPC oder im Codex existiert -> KOMPLETT IGNORIEREN!
      const isExistingPlayer = isPlayerMatch(charName);
      const isExistingNpc = updatedNpcs.some(n => isNameMatch(n.name, n.nickname, charName));
      const isExistingLore = updatedLore.some(e => (e.category === 'Charaktere' || e.category === 'Gegner') && isNameMatch(e.title, e.details?.nickname, charName));

      if (isExistingPlayer || isExistingNpc || isExistingLore) {
        // Vorhandener Charakter / Nutzer / NPC: Änderungen strikt verboten und blockiert!
        continue;
      }
    }

    // Parse PROFESSION_ACTIVITY: [[PROFESSION_ACTIVITY: CharacterName | Profession | CompetencyName | difficulty | success | meaningful]]
    const profActivityRegex = /\[\[PROFESSION_ACTIVITY:\s*([^|\]]+)\s*\|\s*([^|\]]+)\s*\|\s*([^|\]]+)(?:\s*\|\s*([^|\]]+))?(?:\s*\|\s*([^|\]]+))?(?:\s*\|\s*([^\]]+))?\]\]/gi;
    let profActivityMatch;
    while ((profActivityMatch = profActivityRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(profActivityMatch[0], '');
      const charName = profActivityMatch[1].trim();
      const professionName = profActivityMatch[2].trim();
      const competencyName = profActivityMatch[3].trim();
      const diffStr = (profActivityMatch[4] || 'moderate').trim().toLowerCase();
      const succStr = (profActivityMatch[5] || 'true').trim().toLowerCase();
      const meanStr = (profActivityMatch[6] || 'true').trim().toLowerCase();

      const difficulty = (['trivial', 'easy', 'moderate', 'hard', 'master'].includes(diffStr)
        ? diffStr
        : 'moderate') as ProfessionCompetencyActivity['difficulty'];
      const success = succStr !== 'false' && succStr !== '0';
      const meaningfulContext = meanStr !== 'false' && meanStr !== '0';

      const activity: ProfessionCompetencyActivity = {
        professionName,
        competencyName,
        difficulty,
        success,
        meaningfulContext
      };

      if (isPlayerMatch(charName) || charName.toLowerCase() === 'spieler') {
        const result = applyProfessionCompetencyActivity(updatedPlayer, activity);
        updatedPlayer = { ...updatedPlayer, ...result.updatedCharacter };
        const gainedXp = result.gainedXp || 0;
        const gainedProficiency = result.gainedProficiency || 0;
        if (gainedXp > 0 || gainedProficiency > 0) {
          notifications.push({
            id: Math.random().toString(),
            type: 'add',
            title: `Berufsübung (${competencyName}): +${gainedProficiency}% (${gainedXp} XP)`,
            category: 'Beruf & Handwerk'
          });
        }
      } else {
        const npcIdx = updatedNpcs.findIndex(n => isNameMatch(n.name, n.nickname, charName));
        if (npcIdx > -1) {
          const result = applyProfessionCompetencyActivity(updatedNpcs[npcIdx], activity);
          updatedNpcs[npcIdx] = { ...updatedNpcs[npcIdx], ...result.updatedCharacter };
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
            } else if (key === 'pregnancymonth' || key === 'schwangerschaftsmonat' || key === 'schwanger_monat') {
              if (!updatedPlayer.appearance) {
                updatedPlayer.appearance = { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' };
              }
              const oldPreg = parseInt(updatedPlayer.appearance.pregnancyMonth || '0') || 0;
              const newPreg = Math.max(0, Math.min(9, valNum));
              const monthDiff = newPreg - oldPreg;
              updatedPlayer.appearance.pregnancyMonth = `${newPreg}`;

              let currentW = parseInt((updatedPlayer.appearance.weight || '').replace(/\D/g, '')) || 65;
              let currentF = parseInt((updatedPlayer.appearance.bodyFat || '').replace(/\D/g, '')) || 24;

              if (monthDiff !== 0) {
                currentW = Math.max(30, Math.min(220, currentW + Math.round(monthDiff * 1.4)));
                currentF = Math.max(3, Math.min(60, currentF + Math.round(monthDiff * 0.6)));
                updatedPlayer.appearance.weight = `${currentW}kg`;
                updatedPlayer.appearance.bodyFat = `${currentF}%`;
              }

              const existingState = (updatedPlayer.appearance as any).silhouetteState || {};
              (updatedPlayer.appearance as any).silhouetteState = {
                ...existingState,
                pregnancyMonth: newPreg,
                weight: currentW,
                bodyFat: currentF
              };
            } else if (key === 'healingfactor' || key === 'heilfaktor' || key === 'regeneration' || key === 'regenerationsstufe') {
              if (!updatedPlayer.appearance) {
                updatedPlayer.appearance = { hairColor: '', eyeColor: '', age: '', build: '', gender: 'Weiblich' };
              }
              const newHFactor = Math.max(1, Math.min(5, valNum));
              (updatedPlayer.appearance as any).healingFactor = newHFactor;
              const existingState = (updatedPlayer.appearance as any).silhouetteState || {};
              (updatedPlayer.appearance as any).silhouetteState = {
                ...existingState,
                healingFactor: newHFactor
              };
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
          const lowerVal = v.toLowerCase();
          const isClearValue = !v || ['none', 'keine', 'keines', 'kein', 'abgelegt', 'entfernt', 'ausgezogen', 'nichts', 'leer', '-', 'null'].includes(lowerVal);

          // Handle armor & clothing
          if (k.startsWith('armor.') || k.startsWith('kleidung.') || k.startsWith('rüstung.') || k.startsWith('ruestung.')) {
            let slot = k.split('.')[1] || '';
            if (['kopf', 'head', 'helm', 'hut', 'mütze', 'muetze', 'stirnband'].includes(slot)) slot = 'head';
            else if (['chest', 'brust', 'torso', 'oberkörper', 'oberkoerper', 'hemd', 'robe', 'mantel', 'kleid', 'wams'].includes(slot)) slot = 'chest';
            else if (['hands', 'hände', 'haende', 'handschuhe', 'arme'].includes(slot)) slot = 'hands';
            else if (['legs', 'beine', 'hose', 'rock', 'beinschutz'].includes(slot)) slot = 'legs';
            else if (['feet', 'füße', 'fuesse', 'schuhe', 'stiefel'].includes(slot)) slot = 'feet';

            if (!updatedStructuredInventory.armor) updatedStructuredInventory.armor = {};
            if (isClearValue) {
              updatedStructuredInventory.armor[slot] = '';
            } else {
              updatedStructuredInventory.armor[slot] = v;
              if (slot === 'chest') {
                if (!updatedPlayer.appearance) updatedPlayer.appearance = {} as any;
                updatedPlayer.appearance.outfit = v;
              }
            }
          }
          // Handle accessories & Schmuck
          else if (k.startsWith('accessories.') || k.startsWith('schmuck.') || k.startsWith('accessoires.')) {
            let slot = k.split('.')[1] || '';
            if (['finger', 'ring'].includes(slot)) slot = 'finger';
            else if (['neck', 'hals', 'kette', 'amulett', 'kragen'].includes(slot)) slot = 'neck';
            else if (['wrist', 'handgelenke', 'handgelenk', 'armband', 'uhr'].includes(slot)) slot = 'wrist';
            else if (['waist', 'taille', 'gürtel', 'guertel', 'schärpe', 'schaerpe'].includes(slot)) slot = 'waist';
            else if (['back', 'rücken', 'ruecken', 'umhang', 'cape', 'flügel', 'fluegel', 'rucksack'].includes(slot)) slot = 'back';

            if (!updatedStructuredInventory.accessories) updatedStructuredInventory.accessories = {};
            if (isClearValue) {
              updatedStructuredInventory.accessories[slot] = '';
            } else {
              updatedStructuredInventory.accessories[slot] = v;
            }
          }
          // Handle weapons and generalItems with safeguard classification
          else if (k.startsWith('weapons') || k.startsWith('waffen') || k.startsWith('waffe') || k.startsWith('generalitems') || k.startsWith('general_items') || k.startsWith('tasche') || k.startsWith('gegenstände') || k.startsWith('gegenstaende') || k.startsWith('items') || k.startsWith('inventar')) {
            const weaponKeywords = ['schwert', 'bogen', 'dolch', 'klinge', 'degen', 'gewehr', 'pistole', 'lanze', 'speer', 'axt', 'tsuki no wa', 'säbel', 'katana', 'waffe', 'weapon', 'messer', 'schild'];
            const generalKeywords = ['brief', 'schlüssel', 'key', 'potion', 'trank', 'karte', 'map', 'buch', 'book', 'dokument', 'notiz', 'brieftasche', 'apfel', 'ring', 'halskette', 'schmuck', 'münze', 'gold', 'perle', 'edelstein', 'kristall', 'elixier'];

            let isWpnExplicit = k.startsWith('weapons') || k.startsWith('waffen') || k.startsWith('waffe');
            let targetField: 'weapons' | 'generalItems' = isWpnExplicit ? 'weapons' : 'generalItems';
            if (generalKeywords.some(kw => lowerVal.includes(kw))) {
              targetField = 'generalItems';
            } else if (weaponKeywords.some(kw => lowerVal.includes(kw))) {
              targetField = 'weapons';
            }

            if (!updatedStructuredInventory[targetField]) {
              updatedStructuredInventory[targetField] = [];
            }

            if (k.endsWith('+')) {
              if (!isClearValue && !updatedStructuredInventory[targetField].some((item: string) => item.toLowerCase() === lowerVal)) {
                updatedStructuredInventory[targetField].push(v);
              }
            } else if (k.endsWith('-')) {
              updatedStructuredInventory[targetField] = updatedStructuredInventory[targetField].filter((item: string) => {
                const l = item.toLowerCase();
                return l !== lowerVal && !l.includes(lowerVal);
              });
              // Update owner status in Codex
              const pName = (updatedPlayer.name || 'spieler').toLowerCase();
              updatedLore.forEach(e => {
                if (e.category === 'Gegenstände' && (e.title.toLowerCase() === lowerVal || e.title.toLowerCase().includes(lowerVal))) {
                  if (e.details && e.details.owner?.toLowerCase() === pName) {
                    e.details.owner = 'Abgelegt / Nicht im Besitz';
                  }
                }
              });
            } else {
              if (isClearValue) {
                updatedStructuredInventory[targetField] = [];
              } else {
                updatedStructuredInventory[targetField] = v ? v.split(',').map((item: string) => item.trim()).filter(Boolean) : [];
              }
            }
          }
          // Handle money (Vermögen & Finanzen)
          else if (k === 'money' || k === 'geld' || k === 'vermögen' || k === 'vermoegen' || k === 'gold' || k === 'berry') {
            const numMatch = v.match(/\d+/);
            if (numMatch) {
              updatedStructuredInventory.money = parseInt(numMatch[0], 10) || 0;
            } else {
              updatedStructuredInventory.money = parseInt(v, 10) || 0;
            }
            const txt = v.replace(/\d+/g, '').trim();
            if (txt) {
              updatedStructuredInventory.currencyLabel = txt;
            }
          }
          // Handle currencyLabel
          else if (k === 'currencylabel' || k === 'currency' || k === 'währung' || k === 'waehrung') {
            updatedStructuredInventory.currencyLabel = v;
          }
        }
      }
    }

    // Parse COMBAT_EFFECT: [[COMBAT_EFFECT: type | x | y | radius | intensity | description]]
    const effectRegex = /\[\[COMBAT_EFFECT:\s*([^\]]+)\]\]/g;
    let effectMatch;
    let updatedCombatState = currentAdventure.combatState 
      ? JSON.parse(JSON.stringify(currentAdventure.combatState)) 
      : { isCombatActive: false, selectedEnemyId: '', customEnemyName: '', opponents: [], playerHp: 100, playerMaxHp: 100, playerMp: 100, playerMaxMp: 100, enemyHp: 100, enemyMaxHp: 100, combatSubMenu: 'main', placedObjects: [], tiles: {} };

    while ((effectMatch = effectRegex.exec(text)) !== null) {
      cleanedText = cleanedText.replace(effectMatch[0], '');
      const parts = effectMatch[1].split('|').map(p => p.trim());
      if (parts.length >= 3) {
        const type = parts[0];
        const xVal = parseInt(parts[1], 10);
        const yVal = parseInt(parts[2], 10);
        
        let radius = 1;
        let intensity = 1;
        let description = '';
        
        if (parts.length === 4) {
          // type | x | y | description
          description = parts[3];
        } else if (parts.length === 5) {
          // type | x | y | radius | description
          radius = parseInt(parts[3], 10) || 1;
          description = parts[4];
        } else if (parts.length >= 6) {
          // type | x | y | radius | intensity | description
          radius = parseInt(parts[3], 10) || 1;
          intensity = parseInt(parts[4], 10) || 1;
          description = parts[5];
        } else {
          description = `${type}-Effekt`;
        }
        
        // Ensure x and y are valid numbers
        if (!isNaN(xVal) && !isNaN(yVal)) {
          // 1. Map type to icon
          let icon = '';
          const typeLower = type.toLowerCase();
          if (typeLower.includes('magma') || typeLower.includes('lava')) {
            icon = '';
          } else if (typeLower.includes('eis') || typeLower.includes('ice') || typeLower.includes('frost')) {
            icon = '';
          } else if (typeLower.includes('lightning') || typeLower.includes('blitz') || typeLower.includes('thunder')) {
            icon = '';
          } else if (typeLower.includes('poison') || typeLower.includes('gift') || typeLower.includes('toxic')) {
            icon = '';
          } else if (typeLower.includes('steam') || typeLower.includes('dampf')) {
            icon = '';
          } else if (typeLower.includes('fire') || typeLower.includes('feuer')) {
            icon = '';
          } else if (typeLower.includes('water') || typeLower.includes('wasser')) {
            icon = '';
          } else if (typeLower.includes('wind') || typeLower.includes('sturm')) {
            icon = '';
          } else if (typeLower.includes('earth') || typeLower.includes('erd') || typeLower.includes('stein')) {
            icon = '';
          }
          
          // 2. Add to placedObjects
          if (!updatedCombatState.placedObjects) {
            updatedCombatState.placedObjects = [];
          }
          
          const newObj = {
            id: 'eff-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
            name: description || type,
            icon,
            x: Math.max(0, Math.min(9, xVal)),
            y: Math.max(0, Math.min(9, yVal)),
            category: 'Kampfeffekt',
            description: `${description || type} (Stärke: ${intensity}, Radius: ${radius})`,
            rules: `Fügt Elementarschaden in Zone zu.`
          };
          
          updatedCombatState.placedObjects.push(newObj);
          
          // 3. Map type to grid tile type (ice, magma, fire, steam)
          let mappedTileType = '';
          if (typeLower.includes('magma') || typeLower.includes('lava')) {
            mappedTileType = 'magma';
          } else if (typeLower.includes('eis') || typeLower.includes('ice') || typeLower.includes('frost')) {
            mappedTileType = 'ice';
          } else if (typeLower.includes('fire') || typeLower.includes('feuer') || typeLower.includes('lightning') || typeLower.includes('blitz')) {
            mappedTileType = 'fire';
          } else if (typeLower.includes('steam') || typeLower.includes('dampf')) {
            mappedTileType = 'steam';
          }
          
          // 4. Update tiles within radius
          if (mappedTileType) {
            if (!updatedCombatState.tiles) {
              updatedCombatState.tiles = {};
            }
            
            for (let dx = -radius; dx <= radius; dx++) {
              for (let dy = -radius; dy <= radius; dy++) {
                if (dx*dx + dy*dy <= radius*radius) {
                  const tx = xVal + dx;
                  const ty = yVal + dy;
                  if (tx >= 0 && tx < 10 && ty >= 0 && ty < 10) {
                    updatedCombatState.tiles[`${tx},${ty}`] = mappedTileType;
                  }
                }
              }
            }
          }
          
          // 5. Add a notification about the combat effect
          notifications.push({
            id: Math.random().toString(),
            type: 'add',
            title: `${description || type} bei (${xVal},${yVal})`,
            category: 'Kampfeffekt'
          });
        }
      }
    }

    // Synchronize all inventory/equipment items to Codex (loreDatabase)
    if (updatedStructuredInventory) {
      const pName = updatedPlayer.name || 'Spieler';

      const ensureItemInCodex = (name: string, isWpn: boolean) => {
        if (!name) return;
        const trimmed = name.trim();
        const lower = trimmed.toLowerCase();
        if (!trimmed || lower === 'keine' || lower === 'keines' || lower === 'kein' || lower === 'empty') return;
        if (isClothingPlaceholder(trimmed) || isClothingItemTitle(trimmed)) return;

        const existsIdx = updatedLore.findIndex(e =>
          e.category === 'Gegenstände' &&
          (e.title.trim().toLowerCase() === lower || isSimilarLoreTitle(e.title, trimmed))
        );
        if (existsIdx > -1) {
          const existing = updatedLore[existsIdx];
          const currentDetails = existing.details || {};
          if (!existing.isUnlocked || currentDetails.owner?.trim().toLowerCase() !== pName.trim().toLowerCase()) {
            updatedLore[existsIdx] = {
              ...existing,
              isUnlocked: true,
              details: {
                ...currentDetails,
                owner: pName
              }
            };
          }
        } else {
          let itemType = isWpn ? 'Waffen' : 'Werkzeuge & Alltags-Gegenstände';
          const newEntry = {
            id: 'dyn-itm-' + Math.random().toString(36).substr(2, 9),
            category: 'Gegenstände',
            title: trimmed,
            description: isWpn
              ? `Eine Waffe im Besitz von ${pName}.`
              : `Ein nützlicher Gegenstand in der Tasche von ${pName}.`,
            isUnlocked: true,
            details: {
              owner: pName,
              itemType,
              rarity: 'Gewöhnlich'
            }
          };
          updatedLore.push(newEntry as any);
        }
      };

      if (Array.isArray(updatedStructuredInventory.weapons)) {
        updatedStructuredInventory.weapons.forEach((wpn: string) => ensureItemInCodex(wpn, true));
      }
      if (Array.isArray(updatedStructuredInventory.generalItems)) {
        updatedStructuredInventory.generalItems.forEach((itm: string) => ensureItemInCodex(itm, false));
      }
    }

    // -------------------------------------------------------------
    // Tactical Engine Integration: Spawning & Tactical Commands
    // -------------------------------------------------------------
    if (updatedCombatState) {
      // 1. Process explicit Spawn tags: [[STATUS: Spawn_Group=Count_aus_Source]]
      const spawnRegex = /(?:Spawn|SpawnGroup)_([^\s=,]+)\s*=\s*(\d+)(?:_aus_([^\s,\]]+))?(?:[,\s]+(?:formation|form)=([a-zA-Z_]+))?/gi;
      let spawnMatch;
      while ((spawnMatch = spawnRegex.exec(text)) !== null) {
        const groupName = spawnMatch[1].replace(/_/g, ' ').trim();
        const count = parseInt(spawnMatch[2], 10) || 50;
        const source = spawnMatch[3] || 'Wald';
        const form = (spawnMatch[4] || 'wedge') as any;

        const currentGroups = updatedCombatState.tacticalGroups || {};
        const exists = Object.values(currentGroups).some((g: any) => g?.name?.toLowerCase() === groupName.toLowerCase());
        if (!exists) {
          // Resolve connected world entities & create EncounterForce
          const unitDisplayName = groupName.replace(/\s*\d+x?$/, '').trim();
          const encounter = WorldIntegrationService.createEncounterForce({
            name: `${count}x ${unitDisplayName}`,
            enemyTypeIdOrName: unitDisplayName,
            originIdOrName: source,
            count,
            objective: 'raid',
            status: 'engaged',
            world: updatedWorld,
            loreDatabase: updatedLore,
            characters: updatedPlayer ? [updatedPlayer] : [],
            npcs: updatedNpcs
          });

          const spawnRes = WorldIntegrationService.spawnEncounterForceToTactical({
            encounterForce: encounter.encounterForce,
            combatState: updatedCombatState,
            formation: form,
            direction: 'south',
            spawnSource: source,
            baseHp: 30
          });
          updatedCombatState = spawnRes.updatedCombatState;

          // Track encounter force in world setting
          const nextForces = [...(updatedWorld.encounterForces || []), spawnRes.updatedEncounterForce];
          const nextDynamicState = {
            ...(updatedWorld.dynamicWorldState || {}),
            encounterForces: {
              ...(updatedWorld.dynamicWorldState?.encounterForces || {}),
              [spawnRes.updatedEncounterForce.id]: spawnRes.updatedEncounterForce
            }
          };
          updatedWorld = {
            ...updatedWorld,
            encounterForces: nextForces,
            dynamicWorldState: nextDynamicState,
            facts: [...(updatedWorld.facts || []), ...encounter.worldFacts]
          };
        }
      }

      // 2. Parse & Execute Tactical Movement Commands from narrative or status tags
      const tacticalCommands = parseTacticalCommandsFromText(text, updatedCombatState);
      if (tacticalCommands.length > 0) {
        for (const cmd of tacticalCommands) {
          const res = executeTacticalCommand(updatedCombatState, cmd);
          if (res.success) {
            updatedCombatState = res.updatedCombatState;
          }
        }
      }
    }

    // Consolidate outfits and purge any stray clothing entries from updatedLore
    const pNameForLore = updatedPlayer.name || currentAdventure.player?.name || 'Spieler';
    const { cleanedLore } = consolidateLoreOutfits(updatedLore, pNameForLore);
    updatedLore = cleanedLore;

    // Ensure any stray conditions in abilities are migrated to activeConditions
    const condMig = migrateFremdeinflussConditions(updatedPlayer);
    if (condMig.updated) {
      updatedPlayer = { ...updatedPlayer, ...condMig.player };
    }

    return { cleanedText: cleanedText.trim(), updatedLore, updatedPlayer, updatedNpcs, notifications, updatedStructuredInventory, updatedCombatState, updatedWorld };
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
          } else if (lowerKey === 'spieler_currentlocation' || lowerKey === 'spieler_standort' || lowerKey === 'currentlocation' || lowerKey === 'standort' || lowerKey === 'ort') {
            const rawLoc = value.trim();
            const newLoc = formatDisplayLocationName(rawLoc);
            if (newLoc) {
              setTimeout(() => {
                const currentAdv = adventureRef.current || adventure;
                if (currentAdv.player) {
                  onUpdateAdventure({
                    ...currentAdv,
                    player: {
                      ...currentAdv.player,
                      appearance: {
                        ...currentAdv.player.appearance,
                        currentLocation: newLoc
                      }
                    }
                  });
                }
              }, 0);
            }
          } else if (getCustomResourceNames()[0]?.toLowerCase() === lowerKey) {
            const val = parseInt(value);
            if (!isNaN(val)) setPlayerMp(Math.max(0, val));
          } else if (lowerKey.startsWith('eventstep_') || lowerKey.startsWith('station_') || lowerKey.startsWith('queststep_')) {
            // Station status updates are processed in parseLoreAndCharUpdates
          } else if (lowerKey.startsWith('position_') || lowerKey.startsWith('move_') || lowerKey.startsWith('movegroup_') || lowerKey.startsWith('moveentity_')) {
            // Tactical movement is authoritatively calculated and executed by the Tactical Movement Engine in parseLoreAndCharUpdates.
          } else if (lowerKey.startsWith('terrain_')) {
            const coordStr = key.substring(8).replace(/_/g, ',');
            setTimeout(() => {
              const currentAdv = adventureRef.current || adventure;
              if (currentAdv.combatState) {
                onUpdateAdventure({
                  ...currentAdv,
                  combatState: {
                    ...currentAdv.combatState,
                    tiles: {
                      ...(currentAdv.combatState.tiles || {}),
                      [coordStr]: value.trim().toLowerCase()
                    }
                  }
                });
              }
            }, 0);
          } else {
            // Support for multiple/fodder opponents HP, quantity, and terrain spawns updating
            const hpMatch = key.match(/^(.+?)_hp$/i);
            const countMatch = key.match(/^(.+?)_count$/i);
            const spawnMatch = key.toLowerCase().startsWith('spawn_') || value.toLowerCase().includes('_aus_') || value.toLowerCase().includes(' aus ');

            if (spawnMatch) {
              let rawName = key.toLowerCase().startsWith('spawn_') ? key.substring(6).replace(/_/g, ' ').trim() : key.replace(/_/g, ' ').trim();
              let countVal = 10;
              let sourceStr = '';

              // Parse value like "50_aus_schiff" or "30 aus wald" or "20"
              const valParts = value.split(/_aus_|\saus\s/i);
              if (valParts.length >= 2) {
                countVal = parseInt(valParts[0]) || 10;
                sourceStr = valParts[1].replace(/_/g, ' ').trim();
              } else {
                countVal = parseInt(value) || 10;
              }

              if (rawName) {
                setOpponents(prev => {
                  const newOpponent = {
                    id: 'spawn-' + Math.random().toString(36).substr(2, 9),
                    name: rawName,
                    hp: 100,
                    maxHp: 100,
                    count: Math.max(1, countVal),
                    spawnSource: sourceStr || undefined,
                    role: sourceStr ? `Gespawnt aus ${sourceStr}` : 'Gespawnt',
                    isFodder: true
                  };
                  return autoSplitOpponents([...prev, newOpponent]);
                });
              }
            } else if (hpMatch) {
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
                  const existsSplit = prev.some(o => {
                    const base = o.name.replace(/\s+[A-Z]$/, '').toLowerCase();
                    return base === oName || base.replace(/\s+/g, '') === oName.replace(/\s+/g, '');
                  });

                  if (exists) {
                    const updated = prev.map(o => {
                      if (o.name.toLowerCase() === oName || o.name.toLowerCase().replace(/\s+/g, '') === oName.replace(/\s+/g, '')) {
                        return { ...o, count: Math.max(0, val) };
                      }
                      return o;
                    });
                    return autoSplitOpponents(updated);
                  } else if (existsSplit) {
                    const filtered = prev.filter(o => {
                      const base = o.name.replace(/\s+[A-Z]$/, '').toLowerCase();
                      return base !== oName && base.replace(/\s+/g, '') !== oName.replace(/\s+/g, '');
                    });
                    const newOpponent = {
                      id: 'auto-' + Math.random().toString(36).substr(2, 9),
                      name: rawName,
                      hp: 100,
                      maxHp: 100,
                      count: Math.max(0, val),
                      role: 'Zusatzgegner Horde',
                      isFodder: true
                    };
                    return autoSplitOpponents([...filtered, newOpponent]);
                  } else {
                    const newOpponent = {
                      id: 'auto-' + Math.random().toString(36).substr(2, 9),
                      name: rawName,
                      hp: 100,
                      maxHp: 100,
                      count: Math.max(0, val),
                      role: 'Zusatzgegner Horde',
                      isFodder: true
                    };
                    return autoSplitOpponents([...prev, newOpponent]);
                  }
                });
              }
            }
          }

          const index = newStatus.findIndex(s => {
            const sLabel = s.label.toLowerCase();
            const kLabel = key.toLowerCase();
            if (sLabel === kLabel) return true;
            if ((sLabel === 'zeit' || sLabel === 'uhrzeit') && (kLabel === 'zeit' || kLabel === 'uhrzeit')) return true;
            if ((sLabel.includes('körper') && sLabel.includes('zustand')) && (kLabel.includes('körper') && kLabel.includes('zustand'))) return true;
            return false;
          });
          if (index !== -1) {
            const isLoc = newStatus[index].label.toLowerCase().includes('ort') || newStatus[index].label.toLowerCase().includes('standort');
            const valToStore = isLoc ? formatDisplayLocationName(value) : value;
            newStatus[index] = { ...newStatus[index], value: valToStore };

            // If this is "Körperlicher Zustand", dynamically reflect in activeConditions
            const isBodyStatus = newStatus[index].label.toLowerCase().includes('körper') && newStatus[index].label.toLowerCase().includes('zustand');
            if (isBodyStatus) {
              const valLower = value.toLowerCase();
              setTimeout(() => {
                const currentAdv = adventureRef.current || adventure;
                if (currentAdv?.player) {
                  const currentApp = currentAdv.player.appearance || { gender: 'Weiblich', build: '', hairColor: '', eyeColor: '', age: '' };
                  const conds = [...(currentApp.activeConditions || [])];
                  let changed = false;

                  if (valLower.includes('hormon') || valLower.includes('instabil')) {
                    if (!conds.some(c => c.name.toLowerCase().includes('hormon'))) {
                      conds.push({
                        id: `cond-hormon-${Date.now()}`,
                        name: 'Hormonelle Instabilität',
                        type: 'curse',
                        category: 'Körperlicher Zustand / Statuseffekt',
                        isActive: true,
                        severity: 'leicht',
                        source: 'Fremdeinfluss',
                        duration: 'Temporär (Aktiv)',
                        description: 'Hormonelle Schwankungen und Instabilität beeinflussen den physischen und mentalen Zustand.'
                      });
                      changed = true;
                    }
                  } else if (valLower.includes('gesund') || valLower.includes('unverletzt') || valLower.includes('normal')) {
                    const filtered = conds.filter(c => !c.name.toLowerCase().includes('hormon'));
                    if (filtered.length !== conds.length) {
                      conds.length = 0;
                      conds.push(...filtered);
                      changed = true;
                    }
                  }

                  if (changed) {
                    onUpdateAdventureRef.current({
                      ...currentAdv,
                      player: {
                        ...currentAdv.player,
                        appearance: {
                          ...currentApp,
                          activeConditions: conds
                        }
                      }
                    });
                  }
                }
              }, 0);
            }
          }
          // Do not automatically add new fields that do not exist in the configured HUD elements!
          // This keeps the HUD and Interface strictly clean and prevents ad-hoc field pollution.
        }
      }
    }

    return { cleanedText: cleanedText.trim(), newStatus };
  };

  const advanceGameTime = (currentStatus: StatusElement[]) => {
    // Keep current status elements stable without hardcoded premature time jumps or artificial stamina drains.
    // Realistic time progression is dynamically calculated based on narrative actions (seconds to minutes for dialogues/turns).
    return [...currentStatus];
  };

  const sendActionText = async (textToSend: string, forceNextHp?: number, forceNextMp?: number) => {
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = { id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, role: 'user', text: textToSend };
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
      
      // Run World Simulation Step for current action
      const simRes = WorldSimulationService.runSimulationStep({
        world,
        minutesToAdd: 0,
        actionText: textToSend
      });

      const activeWorld = simRes.updatedWorld;

      let simulationInstruction = '';
      if (simRes.playerVisibleSummary) {
        simulationInstruction = `
      DYNAMISCHE WELT-SIMULATION & EREIGNISSE (EINGETRETEN IN DIESEM ZUG):
      ${simRes.playerVisibleSummary}
        `;
      }

      const npcDocs = npcs.map(n => formatNPCForAIPrompt(n)).join('\n');

      const currentStatsStr = statusWithTime.map(s => `${s.label}: ${s.value}`).join(', ');

      const lore = adventure.loreDatabase || []; // prompt_build_first
      
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
- Untertyp "Formwechsel/Stance": Attribut A = Attribut A * 1,25 und Attribut B = Attribut B * 0,75
  Logik: Tauscht Werte permanent, solange die Haltung aktiv ist (z.B. +25% Angriff für -25% Verteidigung).

4. Kategorie: Support
- Untertyp "Heilung/Regeneration": Geheilte HP = B * (1 + R/100) * L
  Logik: Füllt die grüne Lebensleiste im HUD sofort auf (kann HP_max nicht überschreiten).
- Untertyp "Debuff (Sicht/Bewegung)": Gegner-Malus in % = (R * L) / 2
  Logik: Senkt die Treffsicherheit oder Geschwindigkeit des Gegners für eine Anzahl an Runden, die dem Tier-Level entspricht.
- Untertyp "Statuseffekt/Buff": Effekt-Dauer in Runden = Tier-Stufe (Tier 1 = 1 Runde, Tier 2 = 2 Runden, Tier 3 = 3 Runden, Tier 4 = 4 Runden)
  Logik: Verleiht Angriffen Bonuseffekte.

STRIKTE SYSTEM-REGELN FÜR DIE KI ZUR ANWENDUNG DER EFFEKT-BERECHNUNG:
1. PRÜFUNG DES DATENBLATTS: Bei jedem Einsatz einer Fähigkeit/Technik MUSST du die unten aufgeführte aktive Balancing-Tabelle prüfen und den exakten Typ, Untertyp, Basiswert (B) und die Skalierungsformel ermitteln.
2. EFFEKT-BERECHNUNG: Berechne den numerischen Wert immer streng nach der Formel und der Logik des jeweiligen Typs.
3. MATHEMATISCHE ANZEIGE: Zeige dem Spieler das berechnete Ergebnis deines Zuges immer transparent und lesbar in eckigen Klammern direkt in deiner Narration (z.B. "[Schaden: 22]" oder "[Schild-Aktivierung: 18]" oder "[Heilung: +15]").
4. SYSTEM-SYNCHRONISIERUNG: Du MUSST d    - Bei Heilung: [[STATUS: Spieler_HP=85]]
    - Bei Transformation/Buff: Passe die entsprechenden Werte oder Diagrammwerte an.
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
            { type: 'Transformation', subtype: 'Formwechsel/Stance', baseValue: 5, costResourceName: 'Ausdauer', tier: 'Tier 1', scalingAndEffect: 'Attribut A = Attribut A * 1,25 und Attribut B = Attribut B * 0,75' },
            { type: 'Support', subtype: 'Heilung/Regeneration', baseValue: 12, costResourceName: 'Mana', tier: 'Tier 1', scalingAndEffect: 'Geheilte HP = B * (1 + R/100) * L' },
            { type: 'Support', subtype: 'Debuff (Sicht/Bewegung)', baseValue: 8, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Gegner-Malus in % = (R * L) / 2' },
            { type: 'Support', subtype: 'Statuseffekt/Buff', baseValue: 10, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Effekt-Dauer in Runden = Tier-Stufe' }
          ];

      const rulesDetails = rulesList.map(rule => {
        return `- ${rule.type} (${rule.subtype}): Basis-Wert (B) = ${rule.baseValue}, Kraftquelle = ${rule.costResourceName || 'Mana'}, Tier = ${rule.tier || 'Tier 1'}. Skalierungsformel: ${rule.scalingAndEffect}`;
      }).join('\n      ');
      techniqueRulesInstruction += `\nAKTIVE BALANCING-TABELLE AUS DEM DATENBLATT:\n      ${rulesDetails}\n`;

      let loreInstruction = ''; // prompt_build_first_lore_loc1
      if (lore.length > 0) {
        const grouped = lore.reduce((acc, curr) => {
          acc[curr.category] = acc[curr.category] || [];
          acc[curr.category].push(curr);
          return acc;
        }, {} as Record<string, typeof lore>);

        loreInstruction = '\nLORE DATENBANK (Wichtige Fakten, Regeln, Geheimnisse & Historie der Welt) [LOC1]:\n';
        Object.entries(grouped).forEach(([cat, entries]) => {
          loreInstruction += `[${cat.toUpperCase()}]\n`;
          const sorted = (cat === 'Events' || cat === 'Story & Quests') 
            ? entries.sort((a, b) => (a.order || 0) - (b.order || 0)) 
            : (cat === 'Zeitlinie' 
                ? entries.sort((a, b) => {
                    const oa = a.order !== undefined ? a.order : (a.details?.order !== undefined ? a.details.order : 9999);
                    const ob = b.order !== undefined ? b.order : (b.details?.order !== undefined ? b.details.order : 9999);
                    return oa - ob;
                  })
                : entries);
          sorted.forEach(e => {
            const isForbiddenWissen = cat === 'Verbotenes Wissen' || (cat as string) === 'Geheimnisse & Verborgenes Wissen' || (cat as string) === 'Verhüllung';
            const secretTag = (isForbiddenWissen || !e.isUnlocked) ? ' [STRENG GEHEIM: Dieses Wissen ist absolut verboten oder geheim! Halte dieses Wissen absolut unter Verschluss. Verrate, erwähne, leake oder andeute dieses Wissen niemals unaufgefordert, es sei denn, die Bedingungen zur Enthüllung im Chat sind explizit erfüllt!]' : '';
            let extraDetails = '';
            
            if (isForbiddenWissen) {
              extraDetails = ` | GEHEIMHALTUNGSSTUFE: ${e.details?.confidentiality || 'Absolut Geheim'} | ENTHÜLLUNGS-BEDINGUNG: ${e.details?.revealTrigger || 'Darf niemals verraten werden'} | GEHEIMHALTUNGS-VORGABE FÜR DIE KI (STRENGSTENS EINZUHALTEN): [${e.details?.aiSecretInstruction || 'Absolutes Schweigen über dieses Geheimnis!'}]`;
            } else if ((cat === 'Charaktere' || cat === 'Gegner') && e.details) {
              const d = e.details;
              const traits = [];
              if (d.role) traits.push(`Rolle: ${d.role}`);
              if (d.gender || d.age) traits.push(`Aussehen: ${d.gender || ''} ${d.age ? d.age + 'J' : ''}`.trim());
              if (d.goal) traits.push(`Ziel: ${d.goal}`);
              if (d.motivationCore) {
                const motivationStr = formatMotivationCoreForAI(d.motivationCore);
                if (motivationStr) traits.push(motivationStr);
              }
              
              // Location check
              const activeLocation = lore.find(l => l.category === 'Orte' && l.details?.isActiveTarget);
              const activeLocationTitle = activeLocation?.title || '';
              const charLoc = d.currentLocation;
              if (charLoc) {
                traits.push(`Aktueller Standort: ${charLoc}`);
                if (activeLocationTitle) {
                  const cleanCharLoc = charLoc.replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim().toLowerCase();
                  const cleanActiveLocation = activeLocationTitle.replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim().toLowerCase();
                  if (cleanCharLoc !== cleanActiveLocation) {
                    traits.push(`[STATUS: GEGENWÄRTIG ABWESEND - Dieser Charakter befindet sich NICHT an '${activeLocationTitle}' und darf in dieser Szene absolut NICHT physisch auftreten, sprechen, handeln oder direkt agieren!]`);
                  } else {
                    traits.push(`[STATUS: ANWESEND - Dieser Charakter befindet sich am selben Ort wie der Spieler ('${activeLocationTitle}') und ist physisch vor Ort.]`);
                  }
                }
              }

              if (d.relationships && d.relationships.length > 0) {
                const relsStr = d.relationships.map((r: any) => formatRelationshipForAI(r, e.title)).join(' | ');
                traits.push(`Detaillierte Beziehungen: ${relsStr}`);
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
            
            if (cat === 'Zeitlinie' && e.details) {
              const d = e.details;
              const parts = [];
              if (d.timeOfEvent) parts.push(`Zeitpunkt: ${d.timeOfEvent}`);
              if (d.location) parts.push(`Ort: ${d.location}`);
              if (d.involvedCharacters) parts.push(`Beteiligte Personen: ${d.involvedCharacters}`);
              if (parts.length > 0) {
                extraDetails = ` | Details: ${parts.join('. ')}`;
              }
            }
            
            if ((cat === 'Events' || cat === 'Story & Quests') && e.details?.eventSteps) {
              const steps = e.details.eventSteps.map((s: any, sIdx: number) => {
                const knowledgeText = s.revealedKnowledge ? ` | Enthülltes/Verborgenes Wissen: ${
                  s.status === 'happened'
                    ? `[FREIGEGEBEN - darf und soll im Chat enthüllt oder thematisiert werden: ${s.revealedKnowledge}]`
                    : `[STRENG GEHEIM - noch NICHT erreicht! Darf unter keinen Umständen im Chat verraten, angedeutet oder offenbart werden!: ${s.revealedKnowledge}]`
                }` : '';
                const triggerText = s.trigger ? ` | Auslöser (Trigger): ${s.trigger}` : '';
                const castText = s.cast ? ` | Besetzung (Wer): ${s.cast}` : '';
                const settingText = s.setting ? ` | Kulisse (Wo): ${s.setting}` : '';
                const conflictText = s.conflict ? ` | Konflikt (Was): ${s.conflict}` : '';
                
                return `[Station #${sIdx + 1}: ${s.title || 'Unbenannt'} (${s.status === 'happened' ? 'Eingetreten' : 'Ausstehend/Geplant'})${s.description ? ` - HANDLUNGS-, DIALOG- & TAKTIKVORGABE FÜR NPCS: ${s.description}` : ''}${triggerText}${castText}${settingText}${conflictText}${knowledgeText}]`;
              });
              if (steps.length > 0) {
                extraDetails = ` | Roter Faden / Geplante Story-Schritte (MANDATORISCH ZU BEACHTEN): ${steps.join(' -> ')}`;
              }
            }

            let secretsStr = '';
            if (e.secretsStage1 || e.secretsStage2 || e.secretsStage3 || e.knowledge) {
              secretsStr = ` | Geheimnisse & Verborgenes Wissen: [Stufe 1 (Öffentlich): ${e.secretsStage1 || 'Keine'}], [Stufe 2 (Indizien & Verdacht): ${e.secretsStage2 || 'Keine'}], [Stufe 3 (Absolutes Geheimnis - Blackbox): ${e.secretsStage3 || 'Keine'}], [Verhüllung & Geteiltes Wissen: ${e.knowledge || 'Keine'}]`;
            }
            
            loreInstruction += `- ${e.title}${e.order !== undefined && (cat === 'Events' || cat === 'Story & Quests') ? ` (#${e.order})` : ''}${secretTag}: ${e.description}${extraDetails}${secretsStr}\n`;
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
        
        [TAKTIK-RADAR & TACTICAL MAP]
        Der Kampf und die Erkundung werden visuell auf einem interaktiven Taktik-Raster dargestellt.
        Du MUSST die Positionen der Figuren, Transportmittel (Schiffe, Boote, Kutschen, Reittiere) und das Terrain live verändern, um deine erzählerischen Handlungen exakt widerzuspiegeln!
        - Nutze im [[STATUS]] Block folgende Befehle für Map-Updates:
          * Bewegung von Figuren & Transportmitteln: [[STATUS: Position_Name=X,Y]] (z.B. [[STATUS: Position_Spieler=12,15]] oder [[STATUS: Position_${opponents[0]?.name || 'Gegner'}=18,11]] oder [[STATUS: Position_Galleone=10,10]]). X und Y sind Raster-Koordinaten.
          * Taktische Truppen- & Gruppenbewegung: [[STATUS: MoveGroup_Name=X,Y]] (z.B. [[STATUS: MoveGroup_Goblins=15,12]] oder [[STATUS: MoveGroup_Piraten=10,8]]). Das A*-Pathfinding berechnet automatisch den optimalen, hindernisfreien Weg unter Beibehaltung der Formation!
          * Wetter-System: [[STATUS: Weather=Typ]] (Wähle aus: regen, sturm, schnee, nebel, klar). Das Wetter legt eine visuelle Ebene über die Map und beeinflusst erzählerisch die Modifikatoren (z.B. verlangsamte Bewegung, schlechtere Sicht, Blitzschäden)!
          * Tageszeit-System: [[STATUS: Time=Typ]] (Wähle aus: morning, day, evening, night). Die Tageszeit ändert die Lichtstimmung auf der Karte und beeinflusst Sichtweite und Heimlichkeit!
          * Terrain-Effekte ändern: [[STATUS: Terrain_X_Y=Typ]] (z.B. [[STATUS: Terrain_14_15=feuer]] um Felder in Brand zu setzen, oder eis, magma, dampf, ash (verbrannte Erde), obsidian).
          * Gebäude errichten: [[STATUS: Build_Name=X,Y]] (z.B. [[STATUS: Build_Dorf=15,12]] oder [[STATUS: Build_Festung=20,10]]).
          * Gebäude zerstören oder reparieren: [[STATUS: Destroy_Name]] oder [[STATUS: Repair_Name]] (z.B. [[STATUS: Destroy_Festung]] oder [[STATUS: Repair_Dorf]]).
          * Bei Feuer- und Magma-Ausbreitung sowie Elementar-Kollisionen (z.B. Eis vs. Magma) berechnet das Taktik-Raster automatisch das Ausbreiten, das Verbrennen zu Asche sowie die Entstehung von Dampf und Erstarrung!
        - Wichtig: NPCs und Fahrzeuge bewegen sich räumlich mit jeder Nachricht mit! Sorge für räumliche Konsistenz.
        
        KAMPF-REGELN ALS DUNGEON MASTER & STORYTELLER:
        1. Der Spieler beschreibt seine Kampfaktionen komplett frei. Nimm seine kreative Formulierung (z.B. Eis-Atem, Teufelsfrucht-Kräfte, Ninja-Jutsus, Zauber) voll auf und beschreibe das Ergebnis filmreif, spektakulär und hochgradig atmosphärisch!
        2. Falls der Spieler Flächenangriffe oder starke Attacken gegen Gruppen/Kanonenfutter (z.B. Marine-Soldaten x50) einsetzt, schildere logisch, wie ein Teil des Trupps besiegt wird (z.B. "dein eisiger Atem friert 21 der 50 Soldaten augenblicklich zu Eisstatuen ein").
        3. Passe die Anzahl der Soldaten/Truppen oder die HP des anvisierten Gegners im [[STATUS]] Block an!
           Z.B. wenn der Spieler eine Gruppe dezimiert: [[STATUS: Marine-Soldaten_count=29, Spieler_HP=85]].
           Z.B. wenn im Erzähltext eine genaue Anzahl genannt wird (z.B. "Zwei Männer", "3 Piraten", "fünf Wachen"), passe die Gegneranzahl exakt im Status an: [[STATUS: Piraten_count=2]] oder [[STATUS: Bestien-Piraten_count=2]].
           Z.B. wenn ein spezifischer Gegner Schaden nimmt: [[STATUS: Gegner_HP=45]]. Du kannst auch name_HP benutzen wie [[STATUS: Marine-Soldaten_HP=40]].
           Z.B. wenn der Spieler eine Kraftquelle verbraucht, passe den Wert im Status-Block an: [[STATUS: spieler_mp=40]] oder [[STATUS: ${primaryRes || 'mana'}=40]].
           Trage Änderungen stets per [[STATUS: Feld=Wert]] aus!
        4. NPCs (Gegner oder Gefährten) agieren hochgradig dynamisch! Sie können sprechen, dem Spieler Befehle zurufen ("Laufen wir weg Richtung Hafen!"), den Alarm auslösen ("Alarm! Verstärkung aus der Festung!") oder neue Einheiten/Armeen aus Geländestrukturen spawn lassen. Wenn neue Einheiten aus einem Gelände (z.B. Wald, Schiff, Festung, Haus, Höhle, Tor) erscheinen, rufe sie per [[STATUS]]-Block herbei: z.B. [[STATUS: Spawn_Piraten=50_aus_Schiff]] oder [[STATUS: Spawn_Orks=30_aus_Wald]] oder [[STATUS: Wachhunde_count=6]]. Das Kampfraster faßt große Horden automatisch in übersichtliche Trupp-Tokens zusammen und platziert sie direkt neben der Geländequelle auf der Karte!
        5. Beschreibe am Ende deines Zuges immer die Reaktion/Aktion der verbleibenden Feinde und deren Gegenangriff, der den Spieler fordert und eventuell Schaden anrichtet.
        6. Falls alle Feinde besiegt sind (Anzahl = 0 oder HP = 0), beschreibe ihren spektakulären K.O. oder ihre Flucht und beende den Kampf feierlich!`;
      }

      const economyConfig = world.economyConfig || adventure?.world?.economyConfig;
      const economyInstruction = economyConfig?.holdings?.length ? `
      BESITZTÜMER, BETRIEBE, PERSONAL & ARBEITSAUFGABEN:
      - Währung: ${economyConfig.currencyName || 'Goldmünzen'}
      - Abrechnungs-Intervall: ${economyConfig.payoutInterval || 'weekly'}
      - Betriebe, anwesendes Personal & Aufgaben:
      ${economyConfig.holdings.map(h => {
        const pendingTasks = h.tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress')
          .map(t => `"${t.title}" [Prio: ${t.priority}, Zugewiesen: ${t.assigneeName || 'Offen'}]`).join(', ') || 'Keine offenen Aufgaben';
        const staffSummary = h.staffGroups?.map(sg => `${sg.count}x ${sg.roleName} (Bereich: ${sg.workplaceArea}, Status: ${sg.status})`).join(', ') || '';
        const rolesSummary = h.roles?.map(r => `${r.name}: ${r.assignedToName}`).join(', ') || '';
        const dutiesSummary = h.duties?.map(d => `${d.title} (${d.frequency})`).join(', ') || '';
        return `  * "${h.name}" (${h.type.toUpperCase()}, Stufe ${h.level}) | Ort: ${h.locationName || 'Vor Ort'}
    - Namentliche Posten: ${rolesSummary || 'Keine'}
    - Personalgruppen (physisch präsent am Ort): ${staffSummary || `${h.staffCount} Mitarbeiter allgemein`}
    - Aktuelle operative Aufgaben: ${pendingTasks}
    - Wiederkehrende Pflichten: ${dutiesSummary || 'Standardbetrieb'}`;
      }).join('\n')}
      HINWEIS FÜR DIE SZENERIE:
      Wenn der Spieler sich in einem dieser Betriebe oder an dessen Standort befindet:
      1. Lass das dortige Personal (z.B. Küchenhilfen, Köche, Mägde, Gesellen, Wachen) lebendig im Hintergrund auftreten (sie schneiden Gemüse, schleppen Kisten, putzen Tische, halten Wache).
      2. Reagiere auf Ereignisse im Raum (Schrei, Befehl, Einbruch, Brand) plausibel mit den anwesenden Personalgruppen.
      3. Beziehe delegierte oder aktive Aufgaben bei passenden Gelegenheiten mit ein.
      ` : '';

      const isSleep = /(?:schlaf|schläft|schlafe|zubett|zu\s*bett|ruhe\s*legen|hinlegen\s*zum|zur\s*ruhe|rasten|nachtruhe|einschlaf|augen\s*zu.*schlaf)/i.test(textToSend);
      const isUnconscious = /(?:ohnm[aä]cht|bewusstlos|kollabier|bewusstsein\s*verlier)/i.test(textToSend);
      const isSleepOrRestOrUnconscious = isSleep || isUnconscious;
      const situationalActionDirective = isSleepOrRestOrUnconscious ? `
      ACHTUNG - PRIORITÄRE SPIELLEITER-ANWEISUNG FÜR DIESEN ZUG (SCHLAF / OHNMACHT / ZEITSPRUNG & HANDLUNGSVORBEREITUNG):
      Der Spieler legt sich schlafen, rastet oder wird ohnmächtig/bewusstlos ("${textToSend}").
      1. BESCHREIBE NICHT ENDLOS DAS ZIMMER ODER DIE STILLE! Schildere das Hinlegen / die schwindenden Sinne in maximal 1-2 kurzen Sätzen.
      2. FÜHRE ZWINGEND SOFORT EINEN AUTOMATISCHEN ZEITSPRUNG BIS ZUM ERWACHEN DURCH (z. B. bis zum nächsten Morgen oder nach mehreren Stunden Ruhe/Ohnmacht)!
      3. AKTUALISIERE DIE UHRZEIT IM STATUS-TAG entsprechend weit nach vorne (+6 bis +8 Stunden für Nachtruhe, z. B. [[STATUS: Zeit=07:00, Ausdauer=100%]] oder +2 Stunden bei Ohnmacht) und regeneriere Werte.
      4. BEREITE BEIM ERWACHEN SOFORT DIE NÄCHSTE HANDLUNG VOR: Der Spieler erwacht und sieht sich SOFORT mit einem neuen Vorfall, einer Aktion oder Situation konfrontiert, auf die er in seiner nächsten Nachricht reagieren kann (z. B. lautes Klopfen an der Tür, ein NPC tritt ein, Aufruhr oder Schritte im Haus)!
      ` : '';

      const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${world.title}".
      ${situationalActionDirective}
      ${simulationInstruction}
      WELT: ${world.description} (Ton: ${world.tone})
      ${campaignPowerInstruction}
      ${techniqueRulesInstruction}
      ${loreInstruction}
      ${economyInstruction}
      ${getActiveTerritoryInstruction()}

      ${nsfwInstruction}
      ${heroicInstruction}
      ${dramaInstruction}

      ${profileInfo}

      ${formatPlayerForAIPrompt(player, getPlayerPhysicalStatusSummary(), getPlayerAbilitiesFormat(), playerPowerInstruction, getInventoryAndEquipmentSummary())}

      AKTUELLE WERTE: ${currentStatsStr}

      NPCs IN DIESER WELT:
      ${npcDocs}
      ${getTacticalBattlefieldSummary()}

      ${combatInstruction}

      ANWEISUNGEN FÜR DEINE ANTWORTEN (STRENG EINZUHALTEN):
      1. MEHR HANDLUNG & DYNAMIK, WENIGER REINE UMGEBUNGSBESCHREIBUNG:
         - Der absolute Schwerpunkt deiner Nachricht MUSS auf aktiven Ereignissen, Handlungen, Entscheidungen, dynamischen Interaktionen und spürbarem Plot-Fortschritt liegen!
         - Vermeide lange, statische oder passive Beschreibungen von Räumen, Wänden, Böden, Möbeln, Lichtstimmungen oder Stille. Maximal 1-2 kurze, wirkungsvolle Sätze zur Szenerie genügen völlig.
         - Der gesamte Rest deiner Antwort muss aus lebendiger Handlung, Reaktionen von Charakteren und neuen Vorfällen bestehen. Beschreibe Kleidung und Körpersprache dynamisch im Fluss der Aktion, niemals als statischen Stillstand.
      2. Beziehe die VERGANGENHEIT der Figuren mit ein (Andeutungen oder direkte Referenzen).
      3. Lass die NPCs ihre ZIELE verfolgen. Sie sollten nicht nur passiv sein, sondern eigene Agenden haben.
      4. Nutze das HUD für Änderungen der AKTUELLEN WERTE: [[STATUS: Feld1=Wert1, Feld2=Wert2]]. Trenne mehrere Änderungen zwingend mit einem Komma! Du KANNST und SOLLST Werte anpassen, wenn die Handlung es erfordert. WICHTIG: Nutze AUSSCHLIESSLICH die exakten Feldnamen, die dir unter \"AKTUELLE WERTE\" übergeben wurden! Erfinde NIEMALS neue HUD-Felder, die nicht in den aktuellen Werten stehen.
      5. ANTWORTE IMMER AUF DEUTSCH. Gib KEINE Antwortmöglichkeiten (A, B, C) vor. Der Spieler schreibt seine Aktionen frei.
      6. KEINE STANDARD-FRAGEN AM ENDE, ABER IMMER EIN AKTIVER SZENENAUFHÄNGER:
         - Beende deine Nachrichten NIEMALS mit stereotypischen Fragen wie "Was wirst du tun?", "Was tust du?", "Wie reagierst du?", "Wie wirst du reagieren?" oder ähnlichen Floskeln.
         - Lass die Szene aber NICHT in passiver Leere, Stille oder Ticken der Wanduhr versanden!
         - Schließe deine Antwort IMMER mit einer aktiven Situation, einem neuen Vorfall, einer Aktion eines NPCs, einem unerwarteten Geräusch oder einem Wendepunkt ab, worauf der Spieler mit seiner nächsten Nachricht sofort gezielt und spannend reagieren und handeln kann!
      6b. SCHLAFEN, RASTEN & OHNMACHT / BEWUSSTLOSIGKEIT (AUTOMATISCHER ZEITSPRUNG & DIREKTE HANDLUNGSVORBEREITUNG):
         - Wenn der Spieler sich schlafen legt, schlafen geht, zur Ruhe begibt, rastet oder ohnmächtig/bewusstlos wird (z. B. "*hoshiko legt sich in ihr zimmer schlafen*", "*schläft ein*", "*wird bewusstlos*"):
           * BLEIBE UNTER KEINEN UMSTÄNDEN IN DER RUHESZENE STEHEN! Beschreibe nicht endlos das Zimmer, das Bett, das ruhige Atmen oder die Stille der Nacht.
           * Fasse das Einschlafen oder das Schwinden der Sinne in maximal 1-2 kurzen Sätzen zusammen.
           * Führe ZWINGEND sofort einen automatischen ZEITSPRUNG bis zu dem Moment durch, an dem der Charakter wieder aufwacht (z. B. am nächsten Morgen oder nach mehreren Stunden Erholung/Ohnmacht)!
           * Aktualisiere die Uhrzeit im [[STATUS: Zeit=HH:MM]] (z. B. auf 07:00 am nächsten Morgen oder +7 bis +8 Stunden für Nachtruhe, bzw. +1 bis +3 Stunden bei Ohnmacht) und regeneriere HP/MP/Ausdauer (z. B. [[STATUS: Zeit=07:00, Ausdauer=100%]]).
           * BEREITE BEIM ERWACHEN SOFORT DIE NÄCHSTE HANDLUNG VOR (AKTIVER SZENENAUFHÄNGER):
             Unmittelbar beim Aufwachen tritt sofort die nächste Handlung, ein neues Ereignis oder ein Vorfall ein, worauf der Spieler mit seiner nächsten Nachricht reagieren kann!
             (Beispiele: Jemand klopft energisch an die Zimmertür; eilige Schritte oder Stimmen hallen durch den Flur; ein NPC betritt den Raum mit einer wichtigen Botschaft oder einem Befehl; draußen ertönt Lärm, Aufruhr oder Alarm; ein neuer Tag bricht an mit einer konkreten Dringlichkeit oder Aufgabe).
             Der Charakter darf nach dem Erwachen nicht im Stillstand verharren, sondern die nächste Handlung beginnt sofort!
      7. KEIN DIKTIEREN DER WAHRNEHMUNG, REAKTION, GEFÜHLE, UNWILLKÜRLICHEN KÖRPERREAKTIONEN ODER DIALOGE DES SPIELERS (ABSOLUTES SPRECH- UND HANDLUNGSVERBOT FÜR DEN NUTZER): Schreibe niemals vor, was der Spieler aktiv tut, denkt, fühlt, bemerkt, empfindet oder wie sein Körper unwillkürlich reagiert. Diktierte Aktionen, Gefühle oder Sätze wie "Du bemerkst, dass dich jemand beobachtet", "Du spürst Angst aufsteigen", "Du blickst dich um", "lässt dein Herz einen Schlag aussetzen", "Deine Hände umklammern fester", "Du spürst eine eisige Kälte in deiner Brust" oder "Du musst jetzt reagieren" sind STRENGSTENS VERBOTEN. Zudem darfst du NIEMALS wörtliche Rede, Dialoge, Gedanken oder aktive Handlungen im Namen des Spielers/seines Charakters formulieren, erfinden oder diktieren (z.B. darfst du ihm niemals Sätze in den Mund legen wie: "Das war's, du hättest mich nie finden dürfen!", rufst du). Der Spieler spricht, fühlt und handelt einzig und allein selbst durch seine Eingaben! Beschreibe stattdessen nur die objektive Umwelt und das Verhalten von NPCs (z.B. "Draußen zieht ein frischer Wind auf und die Blätter rascheln an den Fenstern" anstatt "Du spürst eine Kälte in deiner Brust"). Der Spieler entscheidet ganz allein über seine Wahrnehmung, Gedanken, unwillkürlichen Körperreaktionen, Gefühle, Dialoge und Reaktionen.
      7b. ABSOLUTES ZITIERVERBOT DES NUTZERS: Du als Erzähler darfst NIEMALS die Eingaben, Worte oder Aussagen des Spielers/Nutzers wörtlich in deiner Narration oder Beschreibung wiederholen, zitieren oder zusammenfassend nachplappern. Wenn der Spieler spricht, ist es bereits gesagt worden. NPCs und andere Charaktere in der Welt dürfen den Spieler jedoch in ihren eigenen Dialogen (in wörtlicher Rede) zitieren oder sich auf seine Worte beziehen.
      8. ABSOLUTES VERBOT DES SELBSTSTÄNDIGEN / PASSIVEN LOSGEHENS VON FÄHIGKEITEN & KRÄFTEN DES SPIELERS (SPIELER-KRAFTKONTROLLE & AKTIVIERUNGSMONOPOL):
         - Die Fähigkeiten, Magie, Elementarkräfte (wie Kälte, Eis, Hitze, Feuer, Wind, Schatten, Licht etc.), Teufelskräfte, Transformationen, Auren oder Fertigkeiten des Spielers/Nutzers gehen NIEMALS von alleine los, lecken nicht passiv aus dem Körper heraus, entweichen nicht versehentlich und brechen niemals unkontrolliert aus!
         - Beschreibe NIEMALS, dass sich durch die bloße Anwesenheit, Emotionen oder Gedanken des Spielers von selbst Raureif, Frost, Kälte, Flammen, Hitze, Blitze, Funken oder Auren in der Umgebung (z.B. auf Tischen, Werkbänken, Wänden, Böden, Fenstern oder an Gegenständen) bilden oder absetzen!
         - Der Spieler besitzt die 100%ige und unerschütterliche Kontrolle über seine Fähigkeiten. Seine Kräfte, Magie oder Teufelskräfte aktivieren, entfalten oder manifestieren sich AUSSCHLIESSLICH DANN, wenn der Spieler dies in seinem eigenen Spielzug / Beitrag EXPLIZIT und aktiv anordnet oder einsetzt!
         - Weder der Erzähler noch NPCs dürfen beschreiben oder behaupten, dass die Kräfte des Spielers sich verselbstständigen, unkontrolliert fließen, "gebändigt/beruhigt werden müssen", unter der Haut prickeln oder die Umwelt unbeabsichtigt kühlen, erhitzen oder verändern.
         - NPCs dürfen den Spieler nicht belehren, ermahnen oder behandeln, als hätte er seine Kräfte nicht im Griff (z.B. keine Sätze wie "diese Kälte will kontrolliert werden" oder "lass die Hitze das Eis in deinen Adern besänftigen"), es sei denn, der Spieler selbst hat im Chat ausdrücklich geschrieben, dass sein Charakter die Beherrschung verliert.
         - Es ist strengstens verboten, passive körperliche Krafteffekte im Körper des Spielers zu erfinden (wie z.B. "ein kühles Prickeln unter deiner Haut", "das Eis in deinen Adern", "Hitze lodert unbemerkt in dir auf").
      9. GEHEIMPLÄNE & VERSTECKTE AGENDA (SPOILER-VERMEIDUNG): Wenn NPCs einen verdeckten oder geheimnisvollen Plan verfolgen (z.B. eine geplante Entführung, Sabotage oder Infiltration), darfst du diesen Plan dem Spieler/Leser NIEMALS direkt auf die Nase binden oder vorwegnehmen. Lass die Charaktere sich vollkommen natürlich oder passend zu ihrer Tarnung verhalten. Der wahre Plan darf sich erst verzögert und schrittweise durch diskrete Handlungen und Interaktionen offenbaren, bis es zu einem logischen und packenden Wendepunkt kommt.
      9. VERDECKTE IDENTITÄTEN & PSEUDONYME: Wenn sich NPCs auf einer verdeckten Mission befinden (z.B. getarnt in ein Anwesen schleichen), benutzen sie unter keinen Umständen ihre echten oder allseits bekannten Namen (wie Naruto, Ino, Sakura, Hinata etc.) im Gespräch mit Fremden oder dem Spieler, da dies die Mission sofort auffliegen lassen würde. Sie agieren unter Decknamen, Tarnidentitäten (z.B. als Personal, andere geladene Gäste oder Wachen) oder bleiben bis zum entscheidenden Moment anonym.
      10. TAKTISCHE & LOGISCHE REINSTE KONSISTENZ (FÄHIGKEITEN & JUTSUS): Die Verwendung von Spezialfähigkeiten oder Ninja-Techniken (z.B. Inos Shintenshin no Jutsu) muss absolut logisch und fehlerfrei durchdacht sein. Wenn ein Jutsu den Körper des Anwenders schutzlos oder ohnmächtig macht, muss im Vornherein logisch sichergestellt sein, dass dieser Körper sicher versteckt und bewacht ist (z.B. versteckt draußen auf einem Ast, bewacht von einer Kameradin wie Hinata, während andere wie Naruto und Sakura das Ziel in Reichweite - z.B. an ein Fenster - locken). Ein plötzliches, unbewachtes Umkippen in einer vollen Menschenmenge is unlogisch und tabu. Die NPCs planen und handeln klug und professionell.
      11. INNERE MONOLOGE DER NPCS: Bei passenden Gelegenheiten darfst du den inneren Monolog oder die Gedanken der NPCs (kursiv formatiert) beschreiben. Dies gibt Einblick in ihre Gefühle, Zweifel oder Absichten, ohne jedoch einen möglichen Geheimplan vollständig zu enthüllen. Nutze dies, um die Tiefe der Nebencharaktere zu steigern.
      12. ACTIVE TIME EVENTS (ATE): Wie in Final Fantasy IX kannst und sollst du gelegentlich kurze Szenen einbauen, die "währenddessen an einem anderen Ort" with anderen Charakteren/NPCs geschehen. Beginne solche Abschnitte mit "**[Active Time Event: Titel des Events]**" und trenne sie vom Hauptgeschehen. Das lässt die Welt lebendig wirken, ohne es bei jeder einzelnen Antwort zu erzwingen.
      13. HANDLUNGEN MARKIEREN: Wenn du Handlungen, Bewegungen oder den Gesichtsausdruck beschreibst, umschließe diese bitte mit Sternchen, wie z.B. *Er zieht sein Schwert* oder *schaut böse*. Gesprochener Text bleibt ohne Sterne.
      14. DYNAMISCHES CODEX / LORE UPDATE & GEGNER-CODEX (STRENG EINZUHALTEN):
          Erweitere die Lore-Datenbank (Codex) eigenständig bei wichtigen Ereignissen oder sobald neue Gegner eingeführt werden!
          - DUPLIKATE STRENGSTENS VERMEIDEN (KEINE ERNEUTE AUSGABE EXISTIERENDER EINTRÄGE): Prüfe vor jeder Antwort zwingend die oben aufgeführte 'LORE DATENBANK'! Wenn ein Eintrag (ein Charakter, Gegner, Ort, Gegenstand etc.) BEREITS in der Lore-Datenbank existiert (oder ein sehr ähnlicher Name wie 'Wachen', 'Marine-Soldaten' etc. bereits vorhanden ist), gib UNTER KEINEN UMSTÄNDEN erneut einen [[LORE_ADD: ...]] Tag für diesen Eintrag aus! Gib [[LORE_ADD: ...]] AUSSCHLIESSLICH DANN AUS, wenn eine VÖLLIG NEUE Entität zum ersten Mal in der Geschichte auftaucht.
          - GEGNER & HOSTILE GRUPPEN: Sobald du im Storyverlauf eine VÖLLIG NEUE feindselige Gruppe oder einen neuen Gegner einführst, der NOCH NICHT in der 'LORE DATENBANK' aufgelistet ist, erstelle EINMALIG einen Codex-Eintrag per [[LORE_ADD: Gegner | Name | Beschreibung auf Deutsch]]. Falls der Gegner/die Gruppe jedoch BEREITS in der Lore-Datenbank steht, gib den Tag NICHT erneut aus!
          - GEGNER-FILTERUNG: Führe nur Gegner ein, die sich auch tatsächlich physisch in unmittelbarer Nähe des Spielers befinden. Verbündete (Gefährten, Freunde, Lehrer) oder politische Fraktionen sind KEINE Gegner und dürfen niemals als Kampfgegner gelistet werden.
          - GEGENSTÄNDE, KLEIDUNG & OUTFITS (STRENGES MANDAT):
            1. Erstelle NIEMALS, absolut NIEMALS Einträge für gewöhnliche, alltägliche Gegenstände (wie Tisch, Lampe, Stift, Papier) oder einzelne Kleidungsstücke (wie "Kochhemd", "Schürze", "Stiefel", "Nachthemd", "Hose") oder Platzhalter-Zustände (wie "barfuß", "keine Kopfbedeckung").
            2. Wenn der Spieler oder ein Charakter neue Kleidung erhält oder trägt, fasse alle Kleidungsstücke IMMER zwingend zu EINEM EINZIGEN zusammenhängenden Outfit zusammen (z. B. [[LORE_ADD: Gegenstände | Kochkluft | Ein zusammenhängendes Outfit bestehend aus Kochhemd, Schmutziger Lederschürze und Arbeitsstiefeln]] oder [[INVENTORY_SET: armor.chest=Kochkluft (Kochhemd, Lederschürze, Arbeitsstiefel)]]).
            3. Nur legendäre, magische, plot-tragende Waffen, Artefakte oder zusammenhängende Outfits in den Codex eintragen! wenn ein Gegenstand/Waffe für den Spieler geschmiedet, gefunden oder ihm übergeben wird, MUSS dieser absolut perfekt zur Lore passen. Trage Gegenstände/Waffen über [[LORE_ADD: Gegenstände | Name | Detailreiche Beschreibung auf Deutsch]] in den Codex ein und füge sie per [[INVENTORY_SET: weapons+=Name]] oder [[INVENTORY_SET: generalItems+=Name]] dem Inventar hinzu!
          - VETO FÜR WELTREGELN & GEHEIMNISSE: Keine Spoiler oder verdeckten Pläne vorzeitig leaken!
          Nutze dazu das Format [[LORE_ADD: Gegner | Name | Beschreibung auf Deutsch]] für Gegner oder passende Kategorien wie 'Weltkarte', 'Fraktionen', 'Gegenstände', 'Verbotenes Wissen', 'Story & Quests', 'Weltregeln', 'Charaktere'. Neue Gebiete oder Städte können auch per [[TERRITORY_ADD: Name | Typ | Übergeordnetes_Gebiet | Reisezeit | Beschreibung]] hinzugefügt werden. Wenn ein bereits existierender, aber bisher geheimer Lore-Fakt enthüllt wird, schalte ihn frei mit [[LORE_UNLOCK: Name]].
      15. ABSOLUTES VERBOT DES VERÄNDERNS ODER ÜBERSCHREIBENS VON VORHANDENEN CHARAKTEREN & BEZIEHUNGEN: Die KI darf während des Chats UNTER KEINEN UMSTÄNDEN Einträge von vorhandenen Charakteren (weder vom Spieler/Nutzer noch von existierenden NPCs oder bestehenden Codex-Charakteren) verändern, mutieren oder überschreiben! Dies gilt ausnahmslos für Charakterbögen, Biografien, Werte, Aussehen und vor allem für bestehende Beziehungen ('relationships') und Verhalten zu anderen ('conduct'). Alle vorhandenen Charakterdaten und Beziehungen wurden vom Nutzer fest vorgegeben und sind absolut UNANTASTBAR!
      16. UMGANGSFORMEN, ETIKETTE & ANREDE: Beachte die sozialen Rollen und Hierarchien strikt. Wenn ein niederrangiger Charakter (z.B. Schüler, Lehrling, Bürger) einen höherrangigen (z.B. Lehrer/Sensei, König, Meister) nicht mit dem gebührenden Respekt oder der korrekten Anrede (z.B. Sensei, Eure Majestät) anspricht, müssen die NPCs darauf passend reagieren. Sie können Tadel aussprechen, Konsequenzen verhängen oder verärgert reagieren. Gleiches gilt für unangemessene Ausdrucksweise oder mangelnde Etikette.
      17. STRENGES ZITIER- & WIEDERHOLUNGSVERBOT: Du darfst NIEMALS die Worte, Sätze, Aktionen, Fragen oder Ausrufe des Spielers zitieren, wiederholen, umformulieren, umschreiben oder kopieren (auch nicht als wörtliche Rede, Gedanken oder Einleitung). Der Spieler hat seine Nachricht bereits selbst geschrieben/gelesen und will sie unter keinen Umständen in deiner Antwort wiederholt sehen. Beginne deine Antwort direkt mit den unmittelbaren Konsequenzen, NPCs-Reaktionen oder dem weiteren physischen/verbalen Verlauf der Szene. Schreibe absolut keine Einleitung, Zusammenfassung oder Rekapitulation des Spielerbeitrags. Wirf den Leser mitten in die darauffolgende Handlung!
      18. STRENGER GEHEIMNIS- UND SPOILER-SCHUTZ BEI TARNUNGEN UND GEHEIMNISSEN: Erwähne niemals geheime Rollen, verborgene Pläne, verdeckte Zugehörigkeiten oder Undercover-Identitäten von Charakteren direkt oder indirekt in der Narration (z.B. wenn Himiko Frost als Lehrerin auftritt, darfst du sei unter keinen Umständen als "Undercover-Agentin" oder "vermeintliche Lehrerin" bezeichnen, oder durch verdächtige oder unnatürliche Formulierungen ihre Tarnung im Text gefährden, es sei denn, ihre Identität wurde im Handlungsverlauf für die Spielfigur bereits eindeutig und unumstößlich aufgedeckt). Für den Spieler muss sie sich absolut lückenlos und überzeugend wie eine echte Lehrerin verhalten.
      19. INTERAKTIONEN UND DIALOGE ZWISCHEN NPCS: Baue vermehrt lebendige, direkte Dialoge in deine Antworten ein. Lass die anwesenden NPCs nicht nur mit dem Spieler sprechen, sondern auch direkt untereinander interagieren, sich unterhalten, Meinungen austauschen, miteinander diskutieren, scherzen, sich absprechen oder streiten. NPCs sind eigenständige Personen mit Beziehungen zueinander und sollten im Chat aktiv und hörbar miteinander kommunizieren, um Szenen lebendiger und authentischer zu machen.
      20. DYNAMISCHE UHRZEIT & SITUATIVER ZEITFORTSCHRITT PRO CHAT-NACHRICHT (MANDATORY [[STATUS: Zeit=HH:MM]]):
          Du bist dafür verantwortlich, dass pro Chat-Nachricht die Zeit in der Spielwelt realistisch und verhältnismäßig vergeht.
          ACHTE PENIBEL DARAUF, DASS DIE UHRZEIT NICHT ZU SCHNELL VERGEHT! In einem Rollenspiel dauern die meisten Chat-Aktionen (wie Sprechen, eine Frage stellen, Nachdenken, ein kurzer Blick oder ein einzelner Angriff/Zug) nur wenige Sekunden bis maximal 1 Minute.
          Gib in JEDER Antwort die neu berechnete Uhrzeit im Format [[STATUS: Zeit=HH:MM]] (oder Uhrzeit=HH:MM) an!
          Realistische Richtwerte für den Zeitverlauf:
          - Kurze Bemerkung / Dialog / Frage / Reaktion / einzelner Zug: +0 bis +1 Minute (die Uhrzeit ändert sich oft gar nicht oder nur um 1 Minute).
          - Längeres Gespräch / Diskussion / kurzes Verweilen / Inspektion eines Objekts: +2 bis +5 Minuten.
          - Gründliches Durchsuchen eines großen Raums / Spaziergang / Besorgungen: +10 bis +15 Minuten.
          - Kampf / Auseinandersetzung: Dauert in der Regel 1 bis 3 Minuten (Schlagabtäusche laufen in Sekunden ab). Nur ausgedehnte Großschlachten dauern 15 bis 30 Minuten.
          - Längere Reise / Fußmarsch zwischen weit entfernten Orten: Entsprechend der tatsächlichen Reisedauer (z.B. +1 bis +3 Stunden).
          - Rast / Schlaf / Ohnmacht / bewusste Zeitsprünge: Entsprechend der Dauer (z.B. +1 Stunde Pause, +7 bis +8 Stunden Nachtruhe z. B. bis 07:00 Uhr morgens, bzw. +1 bis +3 Stunden bei Ohnmacht). Der Charakter erwacht noch in derselben Antwort und die nächste Handlung beginnt sofort!
          Berechne die neue Uhrzeit immer exakt ausgehend von der bisherigen Uhrzeit im Status (z.B. von 12:00 nach einer kurzen Frage auf 12:00 oder 12:01, nach einem kurzen Kampf auf 12:03) und gib sie im [[STATUS]] Block an.
      21. GEHEIMNISSE, VERBORGENES WISSEN & ABSICHTENISOLATION (3-STUFEN-LOGIK & KEINE HELLSEHEREI): // rule21_loc1
          // loc1_marker
          Halte dich strikt an die 3 Stufen des geheimen Wissens. Stufe 1 ist historisch allgemein bekannt. Stufe 2 sind historische Gerüchte/Indizien, aber NPCs vermuten diese nicht aktiv bezüglich gegenwärtiger Ereignisse. Stufe 3 ist eine ABSOLUTE BLACKBOX für NPCs, den Erzähler und den Chat. Verrate, andeute oder leake Stufe 2 und Stufe 3 Geheimnisse von Charakteren (einschließlich des Spielers!) NIEMALS unaufgefordert im Chat! NPCs dürfen dieses Wissen unter keinen Umständen in Dialogen, Handlungen, Beschreibungen oder Gedanken verwenden.
          ABSICHTENISOLATION ZWISCHEN CHARAKTEREN: NPCs besitzen KEINERLEI Wissen über die geheimen Absichten, Pläne, Hintergedanken oder ungesagten Gefühle anderer Charaktere (sei es anderer NPCs oder des Spielers), solange diese nicht vor ihren Augen/Ohren im Chat explizit geäußert, gestanden oder durch offensichtliche Taten offenbart wurden. Erst wenn der Spieler das Geheimnis im Chat gesteht, oder wenn NPCs durch gesammelte Indizien im Chat eine unumstößliche, logische Schlussfolgerung im Hier und Jetzt ziehen, darf dieses Wissen enthüllt werden. Jedes Meta-Wissen-Bleeding ist strengstens verboten!
      22. ABSOLUTES VERBOT DES VORZEITIGEN LORE-ENTHÜLLENS: Wenn ein Lore-Eintrag oder Fakt in der Lore-Datenbank mit '[STRENG GEHEIM:...]' markiert ist, darfst du diesen Fakt, Text oder Inhalt NIEMALS von dir aus im Chat erwähnen, andeuten, spoilern oder referenzieren! Er ist für die Spielfiguren und den Erzähler eine absolute Blackbox, bis der Spieler ihn selbst lüftet oder du ihn per [[LORE_UNLOCK: Name]] im Spielverlauf offiziell freischaltest. Halte dich penibel an dieses Verbot, um dem Spieler nicht die Spannung zu nehmen!
      23. ABSOLUTE UNANTASTBARKEIT BESTEHENDER BEZIEHUNGEN & VERHALTEN: Verändere oder überschreibe niemals Beziehungen ('relationships') oder das festgelegte Verhalten ('conduct', 'behavior') von bestehenden Charakteren. Alle vorgegebenen Beziehungs- und Verhaltensstrukturen sind fix und unveränderlich.
      24. INVENTAR- & AUSRÜSTUNGSUPDATES (SYNCHRONISATION ZUM CHAT - MANDATORY):
          Wenn der Spieler oder die Handlung im Chat Gegenstände erhält, anlegt, wechselt, ablegt, kauft, verkauft, verbraucht oder verliert, MUSST du sein Inventar und seine Ausrüstung im Logbuch/HUD sofort und präzise aktualisieren! Nutze dazu zwingend das Format [[INVENTORY_SET: Feld=Wert | Feld2=Wert]].
          > FINANZEN & VERMÖGEN: money=Zahl | currencylabel=Währung (z.B. [[INVENTORY_SET: money=150 | currencylabel=Berry]] oder [[STATUS: Vermögen=150 Berry]])
          > KLEIDUNG & RÜSTUNG:
            - Anlegen/Wechseln: armor.chest=Kleidungsstück (Ersetzt alte Kleidung an diesem Slot), armor.head=Kopfbedeckung, armor.hands=Handschuhe, armor.legs=Hose/Rock, armor.feet=Schuhe/Stiefel
            - Ablegen/Ausziehen: armor.chest=none (oder armor.head=keine, armor.feet=abgelegt, etc.)
          > SCHMUCK & ACCESSOIRES:
            - Anlegen: accessories.finger=Ring, accessories.neck=Kette/Amulett, accessories.wrist=Armband/Uhr, accessories.waist=Gürtel, accessories.back=Umhang/Rucksack
            - Ablegen: accessories.neck=none (oder accessories.finger=keine, etc.)
          > WAFFEN / BEWAFFNUNG:
            - Erhalten/Ziehen/Ausrüsten: weapons+=Waffenname (z.B. weapons+=Eisenschwert)
            - Ablegen/Verlieren/Wegstecken/Verkaufen: weapons-=Waffenname (z.B. weapons-=Eisenschwert)
          > SONSTIGE GEGENSTÄNDE (TASCHE):
            - Finden/Kaufen/Einstecken: generalItems+=Gegenstandsname (z.B. generalItems+=Heiltrank)
            - Verbrauchen/Verlieren/Abgeben: generalItems-=Gegenstandsname (z.B. generalItems-=Heiltrank)
          Kombinierte Beispiele:
          - Spieler zieht sich um & erhält Waffe: [[INVENTORY_SET: armor.chest=Schwarzer Ledermantel | armor.legs=Dunkle Stoffhose | weapons+=Silberner Dolch]]
          - Spieler kauft Heiltrank für 20 Berry: [[INVENTORY_SET: generalItems+=Heiltrank | money=80]]
          - Spieler legt Rüstung ab: [[INVENTORY_SET: armor.chest=none | armor.head=none]]
      25. PROAKTIVES KAMPAGNEN- & STORY-STATIONEN MANAGEMENT (MANDATORISCH):
          - DU BIST ALS AI-DUNGEON-MASTER DAFÜR VERANTWORTLICH, DIE KAMPAGNE DYNAMISCH VORANZUTREIBEN!
          - Prüfe vor jeder Antwort die in der 'LORE DATENBANK' unter 'STORY & QUESTS' gelisteten Ereignisse / Kampagnen-Stationen (z. B. Station #1: Überwachung in Distrikt 9).
          - PROAKTIVES AUSLÖSEN: Sobald der Spieler sich am passenden Ort befindet oder eine dazu passende Situation eintritt, MUSST du die nächste ausstehende Kampagnen-Station direkt in der Narration auslösen, die beteiligten NPCs (wie Aizawa, Midnight etc.) auftreten lassen und das Ereignis aktiv ins Spielgeschehen einbauen!
          - AUTOMATISCHER STATUS-TAG: Sobald eine Kampagnen-Station im Text eingetreten ist oder vollzogen wurde, MUSST du dies zwingend per Tag im Status-Block signalisieren: z. B. [[STATUS: Station_1=happened]] oder [[STATUS: Station_Überwachung in Distrikt 9=happened]] oder [[EVENT_STEP_SET: Station_1=happened]]. Dadurch setzt das System den Haken in der Story-Übersicht automatisch auf "Eingetreten".
          - Schiebe anstehende Haupt- und Nebenstory-Stationen niemals unbegründet auf, sondern führe die Spielfigur aktiv durch den roten Faden der Geschichte!
      26. STRENGE ZEITLICHE KONSISTENZ & TEMPORALE LOGIK: Analysiere genau den zeitlichen Ablauf seit dem zentralen Katalysator-Ereignis (z.B. Unfall, Verwandlung, Erhalt von Kräften, Amnesie des Spielers). Wenn dieses Ereignis erst gestern, heute oder vor extrem kurzer Zeit stattfand, dürfen NPCs NIEMALS unlogische Dinge sagen wie 'Du hast dich in letzter Zeit verändert' (als wäre es ein wochenlanger Prozess gewesen). NPCs dürfen sich nicht so verhalten, als hätten sie die Veränderung bereits über einen langen Zeitraum beobachtet. Achte penibel darauf, dass NPCs nur das wissen und ansprechen können, was in der kurzen verstrichenen Zeitspanne logischerweise beobachtbar war! Sorge für 100% lückenlose zeitliche Logik!
      27. ABSOLUTES VERBOT DES AUSGEBENS VON KAMPAGNEN-WERTEN ODER STATS: Gib NIEMALS, unter keinen Umständen, Kampagnen-Werte, Attribute, Statuslisten, Progress-Bars, Werteveränderungen oder Status-Meldungen (wie "**KAMPAGNEN-WERTE**", "Haki: 0/5000" etc.) im ausgegebenen Text aus! Diese Werte werden rein im Hintergrund für dich übermittelt. Dein Text darf ausschließlich die cineastische Erzählung, Dialoge und atmosphärische Beschreibungen enthalten - komplett frei von technischen Wertelisten.
      28. SCHWANGERSCHAFT, EMPFÄNGNIS & ZYKLUS-REGELN:
          - EMPFÄNGNIS & FRUCHTBARKEIT: Eine weibliche Figur (Spielerin oder NPC) kann im Rollenspiel/Chat schwanger werden, wenn es im fruchtbaren Empfängniszeitfenster (ca. Tag 10-16 des ~28-Tage-Zyklus) zu Intimität kommt.
          - FESTSTELLUNG (AB WOCHE 3-4 / ENDE MONAT 1): Die Schwangerschaft ist ab der 3. bis 4. Woche durch feine Anzeichen (Morgenübelkeit, Zyklusausfall, veränderte Aura/Magiespürsinn bei Heilern) feststellbar.
          - SCHWANGERSCHAFTSVERLAUF (MONATE 1-9): Ab Monat 3-4 wird der Babybauch deutlich sichtbar. Der Schwangerschaftsmonat (1 bis 9) beeinflusst realistisch Gewicht (+1,3kg/Monat), Beweglichkeit, Ausdauer und Erscheinungsbild. Die KI kann den Monat bei Zeitsprüngen oder Schlüsselmomenten im Status anpassen: [[STATUS: pregnancyMonth=X]]. Gesamtdauer: 9 Monate.
      29. HEILFAKTOR & REGENERATIONS-REGELN:
          - Der Heilfaktor des Charakters bestimmt die Geschwindigkeit der Wundheilung sowie die Erholungsrate von Gesundheit (HP), Ausdauer und Kosten-Ressourcen (Mana, Energie, Fokus etc.).
          - Stufe 1 (Normal): Schnittwunden verheilen in Tagen, Knochenbrüche in Wochen/Monaten. Normale Erholung bei langer Rast.
          - Stufe 2 (Erhöht / Zäh): Schnittwunden verheilen in Stunden. Erhöhte Regeneration bei Rast (+25%).
          - Stufe 3 (Schnell / Magisch): Schnittwunden/Prellungen schließen sich in Minuten bis Stunden. Knochenbrüche in 1-2 Tagen. Stark beschleunigte HP- & Ausdauer-Erholung (+50%).
          - Stufe 4 (Extrem / Erwacht): Wunden schließen sich direkt im Kampf oder in wenigen Minuten. Starke In-Fight Regeneration & Erholung nach schwerem Schaden (+100%).
          - Stufe 5 (Übernatürlich / Unsterblich): Sofortige Gewebe- & Knochenregeneration. Kontinuierliche HP- & Ressourcen-Auffüllung.
          - Die KI und der Spieler können den Heilfaktor bei Transformationen oder Ereignissen im Status anpassen: [[STATUS: healingFactor=X]] (wobei X = 1 bis 5).
      30. BODENSTÄNDIGE CHARAKTERE & WELTENTWICKLUNG (GLAUBWÜRDIGE HINTERGRÜNDE):
          - Interessant bedeutet nicht automatisch außergewöhnlich. Bevorzuge glaubwürdige, alltägliche und unspektakuläre Hintergründe.
          - Erzeuge keine geheimen Mächte, uralten Wesen, verborgenen Blutlinien, großen Prophezeiungen oder dramatischen Geheimnisse, sofern sie nicht durch Charakterdaten, Weltgeschichte oder tatsächliche Ereignisse begründet oder ausdrücklich für diesen Charakter vorgesehen sind.
          - Nicht jeder Charakter benötigt eine persönliche Geschichte, die für den Spieler relevant ist. Die meiste Bewohner dürfen ein gewöhnliches Leben führen. Nur Charaktere mit entsprechender Bedeutung, Motivation, Beziehung oder tatsächlicher Ereignisentwicklung sollen zu zentralen Figuren werden.
      31. PERSPEKTIVISCHE WISSENSISOLATION BEI PROLOG, ERSTER SZENE & WELTBESCHREIBUNG (ÜBERRASCHUNGS- & REAKTIONS-PFLICHT):
          - PROLOG & ERSTE SZENE ISOLATION FÜR NICHT-ANWESENDE CHARAKTERE: Charaktere/NPCs besitzen KEINERLEI Wissen über Geschehnisse, Vorfälle oder Verwandlungen aus der Weltenbeschreibung, dem Prolog oder der ersten Szene (Spielstart), bei denen sie selbst PHYSISCH NICHT ANWESEND waren!
          - ÜBERRASCHUNG BEI NEU DAZU STOSSENDEN CHARAKTEREN: Wenn ein Charakter das erste Mal eine Szene/einen Raum betritt oder dem Spieler begegnet und der Spieler durch den Prolog, die erste Szene oder jüngste Vorfälle eine dauerhafte Verwandlung erfahren hat, ein verändertes Aussehen hat, verletzt ist, neue Gestalt besitzt oder ungewöhnliche Merkmale trägt, darf dieser dazustoßende Charakter KEINESFALLS so tun, als kenne er diesen Zustand bereits oder als sei er unbeeindruckt.
          - MANDATORISCHE REAKTION: Der dazustoßende Charakter MUSS glaubwürdig, überrascht, schockiert, erschrocken, verwirrt oder neugierig auf den vorgefundenen Zustand des Spielers reagieren (z. B. entgeistertes Anstarren, "Was ist mit dir geschehen?!", "Wer oder was bist du?!", Fragen nach der Ursache), anstatt die Veränderung stillschweigend hinzunehmen.
          - NPCs erfahren von den Geschehnissen des Prologs oder der Verwandlung ERST DANN, wenn ihnen der Spieler oder ein Augenzeuge im Chat davon berichtet oder sie im Spielverlauf Beweise dafür finden.
      32. ABSOLUTE NAMENS-PRIORITÄT & STRIKTES VERBOT ABWEICHENDER ODER ALTER NAMEN (VERBOT VON FANTASIENAMEN ODER VERALTETEN RESTE-NAMEN WIE 'YARA'):
          - Für die Anrede, Nennung und Referenzierung des Spielers sowie aller Charaktere/NPCs in Erzählungen, Dialogen, Gedanken und Systemanzeigen gelten AUSSCHLIESSLICH die im jeweiligen Charakterbogen definierten Felder:
            1) "Name des Charakters" (Echter bürgerlicher Name)
            2) "Rufname (Kampfanzeige)"
            3) "Spitzname / Titel / Alias"
            4) "Name der Transformation" (bei aktiver Transformation)
          - Diese vier Felder haben ABSOLUTE UND UNANFECHTBARE PRIORITÄT!
          - Es ist der KI, dem Erzähler und allen NPCs STRENGSTENS VERBOTEN, den Spieler oder andere Figuren mit abweichenden, frei erfundenen oder aus alten Versionen/Prompts stammenden Namen (wie z. B. 'Yara' oder unbelegten Wörtern) anzusprechen, zu nennen oder zu beschreiben.
          - Sollte in Alt-Texten, Weltbeschreibungen, Prolog-Überresten oder Lore-Einträgen ein abweichender Name auftauchen, der nicht mit den oben genannten vier Feldern übereinstimmt, MUSS die KI diesen sofort ignorieren und strikt durch den im Charakterbogen hinterlegten Namen/Rufnamen/Alias/Transformationsnamen ersetzen, um vollkommene Einheitlichkeit zu garantieren!
          - DYNAMISCHE NAMENSGEBUNG BEI LEEREN TRANSFORMATIONSNAMEN: Sollten bei einer aktiven Verwandlungsform "Name der Transformation" oder "Rufname (Kampfanzeige)" LEER sein, gilt diese Form als UNBENANNT. In diesem Fall können der Spieler oder Charaktere/NPCs dieser Transformation im Laufe der Geschichte/Dialoge einen eigenen Namen geben!
      33. LOGIK FÜR INHALTE VON KLEIDERSCHRÄNKEN & TRUHEN IN PRIVATEN RÄUMEN (KONTEXT- & GESCHLECHTSLOGIK DER GARDEROBE):
          - LOGIK UND HISTORIE DES RAUMBESITZERS: In privaten Räumen, Schlafzimmern, Truhen, Schränken oder Ankleiden (wie z. B. im eigenen Zimmer des Spielers oder eines NPCs) muss der vorgefundene Inhalt von Kleiderschränken und Truhen strikt der Identität, der Historie und dem ursprünglichen biologischen Geschlecht/Stand des jeweiligen Eigentümers entsprechen!
          - VERBOT UNBEGRÜNDETER KONTRAST-KLEIDUNG: War die Spielfigur oder der Raumbesitzer ein Mann (oder befindet man sich im Zimmer/Quartier eines Mannes), befinden sich in dessen Schrank oder Truhe NIEMALS unbegründet Frauenkleider, Mädchenkleider, Röcke, BHs oder Damenunterwäsche.
          - WEITERBESTAND BEI METAMORPHOSEN & VERWANDLUNGEN: Hat der Spieler z. B. vor Kurzem eine Verwandlung erfahren (z. B. Geschlechtsumwandlung, Verjüngung, Fluch oder Gestaltwechsel), verwandeln sich dadurch NICHT automatisch die Kleidungsstücke in Schränken oder Truhen! Im Schrank eines vormals männlichen Charakters liegen weiterhin ausschließlich Männerkleider der bisherigen Passform, sofern nicht explizit in der Handlung neue Kleidung gekauft, geschenkt oder von jemandem im Raum deponiert wurde.
          - PLAUSIBILITÄT BEI UNPASSENDER KLEIDUNG: Muss sich der verwandelt/verändert vorgefundene Charakter umziehen, muss die vorgefundene Kleidung in eigenen Schränken realistisch unpassend sein (z. B. viel zu große Herrenhemden/Hosen für einen verjüngten oder weiblich gewordenen Körper) oder es muss aktiv passende Kleidung besorgt werden. Es dürfen nicht wie durch Zauberei passende Mädchenkleider oder Damenkleider in der Truhe eines Mannes auftauchen!
      34. BERUFSKOMPETENZEN, HANDWERK & BERUFSÜBUNGEN (DETERMINISTISCHES SYSTEM & REALISMUS):
          - Charaktere und der Spieler verfügen über ein detailliertes Berufsprofil mit Kompetenzen (Kategorien: Grundlage, Fortgeschritten, Spezialisierung, Meisterschaft), Beherrschungsgrad (0-100%), XP und Talent (0-5).
          - REALISTISCHE HANDWERKS- & BERUFSBESCHREIBUNGEN: Handwerkliche und berufliche Tätigkeiten (z.B. Schmieden, Schreinern, Kochen, Alchemie, Heilen, Jagen, Lederarbeiten) müssen materialgerecht, prozedural und glaubwürdig anhand der tatsächlichen Kompetenzen des Charakters beschrieben werden. Ein Lehrling oder jemand mit niedriger Beherrschung scheitert an Meisterstücken oder benötigt viel Mühe, während Meister Routine und höchste Präzision an den Tag legen.
          - SIGNALISIERUNG VON BERUFLICHER ÜBUNG ODER HANDWERKS-AKTIONEN:
            Wenn der Spieler oder ein NPC im Chat aktiv ein Handwerk ausübt, eine neue Technik übt oder eine berufliche Aufgabe durchführt, signalisiere dies am Ende deiner Antwort mit dem Tag:
            [[PROFESSION_ACTIVITY: CharacterName | Profession | CompetencyName | difficulty | success | meaningful]]
            * Parameter:
              - CharacterName: Name des Charakters oder "Spieler"
              - Profession: Name des Berufs (z.B. Schmied, Koch, Schreiner)
              - CompetencyName: Die geübte Kompetenz (z.B. Schmiedefeuer entzünden, Fleisch schneiden)
              - difficulty: trivial | easy | moderate | hard | master
              - success: true | false
              - meaningful: true | false (ob es eine echte Herausforderung / bewusste Übung war)
            * Beispiel: [[PROFESSION_ACTIVITY: Spieler | Schmied | Schmiedefeuer entzünden | easy | true | true]]
          - STRIKTES VERBOT WILLKÜRLICHER STAT-AUSGABEN: Gib niemals direkte Prozentwerte oder Erfahrungsstufen im Text oder als Tags wie [[PROFESSION: Schmieden=100%]] aus. Die Beherrschung und XP-Berechnung wird ausschließlich deterministisch und mathematisch vom Regelsystem auf Basis der Aktivität berechnet!`;
      
      const response = await GeminiService.chat(updatedMessages, systemInstruction, world.isNsfw, adventure.summaryLog);
      const rawText = response.text || '';
      
      const { cleanedText: statusCleaned, newStatus } = parseStatusUpdates(rawText, statusWithTime);
      const { cleanedText: finalCleanedText, updatedLore, updatedPlayer, updatedNpcs, notifications, updatedStructuredInventory, updatedCombatState, updatedWorld } = parseLoreAndCharUpdates(statusCleaned, adventure, forceNextHp, forceNextMp);

      if (notifications.length > 0) {
        addLoreNotifications(notifications);
      }

      const newModelMsg: ChatMessage = { id: `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, role: 'model', text: finalCleanedText };
      setMessages(prev => [...prev, newModelMsg]);
      const nextChatHistory: ChatMessage[] = [...updatedMessages, newModelMsg];
      
      let syncedStatus = [...newStatus];

      // Automatic robust time advance and recovery for sleep/rest/unconscious if model didn't update Zeit
      if (isSleepOrRestOrUnconscious) {
        const timeIdx = syncedStatus.findIndex(el => {
          const l = (el.label || '').toLowerCase();
          return l === 'zeit' || l === 'uhrzeit' || l.includes('zeit');
        });
        const hadModelTimeUpdate = rawText.includes('STATUS:') && /zeit\s*=/i.test(rawText);
        if (timeIdx > -1 && !hadModelTimeUpdate) {
          const currentVal = syncedStatus[timeIdx].value || '22:00';
          const timeParts = currentVal.split(':');
          if (timeParts.length === 2) {
            const hoursToAdd = isSleep ? 8 : 2;
            const nextHour = (parseInt(timeParts[0], 10) + hoursToAdd) % 24;
            syncedStatus[timeIdx] = {
              ...syncedStatus[timeIdx],
              value: `${String(nextHour).padStart(2, '0')}:${timeParts[1]}`
            };
          }
        }
        if (isSleep) {
          const ausdauerIdx = syncedStatus.findIndex(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('ausdauer') || l.includes('stamina');
          });
          if (ausdauerIdx > -1) {
            syncedStatus[ausdauerIdx] = { ...syncedStatus[ausdauerIdx], value: '100%' };
          }
          setPlayerHp(playerMaxHp);
          setPlayerMp(playerMaxMp);
        }
      }
      let syncedInv = updatedStructuredInventory ? { ...updatedStructuredInventory } : { money: 100, currencyLabel: 'Goldstücke' };
      const moneyStatusIdx = syncedStatus.findIndex(el => {
        const l = (el.label || '').toLowerCase();
        return l.includes('vermögen') || l.includes('geld') || l.includes('gold') || l.includes('währung') || l.includes('münzen') || l.includes('berry') || l.includes('credits');
      });
      if (moneyStatusIdx > -1 && syncedStatus[moneyStatusIdx].value) {
        const valStr = syncedStatus[moneyStatusIdx].value;
        const numMatch = valStr.match(/\d+/);
        if (numMatch) {
          syncedInv.money = parseInt(numMatch[0]);
          const txt = valStr.replace(/\d+/g, '').trim();
          if (txt) syncedInv.currencyLabel = txt;
        }
      } else if (syncedInv.money !== undefined && moneyStatusIdx > -1) {
        const currLabel = syncedInv.currencyLabel || 'Goldstücke';
        syncedStatus[moneyStatusIdx] = {
          ...syncedStatus[moneyStatusIdx],
          value: `${syncedInv.money} ${currLabel}`.trim()
        };
      }

      // Update adventure state immediately
      onUpdateAdventure({ 
        ...adventureRef.current, 
        player: updatedPlayer,
        npcs: updatedNpcs,
        world: updatedWorld,
        statusElements: syncedStatus, 
        loreDatabase: updatedLore,
        chatHistory: nextChatHistory,
        structuredInventory: syncedInv,
        combatState: updatedCombatState
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

  // --- REINER DIALOG-MODUS STATES ---
  const [isDialogueActive, setIsDialogueActive] = useState(false);
  const [isDialogueMenuExpanded, setIsDialogueMenuExpanded] = useState(false);
  const [dialogueType, setDialogueType] = useState<'user_npc' | 'npc_npc' | 'group'>('user_npc');
  const [dialogueSpeakerId, setDialogueSpeakerId] = useState<string>(''); // For NPC speakers (A)
  const [dialogueTargetId, setDialogueTargetId] = useState<string>(''); // For target NPC in NPC-to-NPC (B)
  const [dialogueGroupSelectedIds, setDialogueGroupSelectedIds] = useState<string[]>([]); // For Group

  // Set default speaker IDs when npcs change or on mount
  useEffect(() => {
    if (adventure.npcs && adventure.npcs.length > 0) {
      if (!dialogueSpeakerId) {
        setDialogueSpeakerId(adventure.npcs[0].id);
      }
      if (adventure.npcs.length > 1 && !dialogueTargetId) {
        setDialogueTargetId(adventure.npcs[1].id);
      }
    }
  }, [adventure.npcs, dialogueSpeakerId, dialogueTargetId]);

  const handleSendDialogue = async (textOverride?: string | React.MouseEvent<any>) => {
    if (isLoading) return;
    
    const text = (typeof textOverride === 'string' ? textOverride : inputText).trim();
    if (dialogueType === 'user_npc' && !text) return;
    
    const npcList = adventure.npcs || [];
    const speakerNpc = npcList.find(n => n.id === dialogueSpeakerId);
    const targetNpc = npcList.find(n => n.id === dialogueTargetId);
    
    const speakerName = speakerNpc ? (speakerNpc.nickname || speakerNpc.name) : 'Charakter';
    const targetName = targetNpc ? (targetNpc.nickname || targetNpc.name) : 'Charakter';
    
    const groupNpcs = npcList.filter(n => dialogueGroupSelectedIds.includes(n.id));
    const groupNamesStr = groupNpcs.map(n => n.nickname || n.name).join(', ');

    setIsLoading(true);
    setInputText('');
    
    let userDisplayMsgText = '';
    let aiSystemDirective = '';
    
    if (dialogueType === 'user_npc') {
      userDisplayMsgText = ` [Dialog mit ${speakerName}] "${text}"`;
      aiSystemDirective = `
DU BEFINDEST DICH IM REINEN DIALOG-MODUS!
Aktueller Gesprächspartner: ${speakerName} (und der Spieler, ${adventure.player.name}).
Der Spieler spricht direkt zu ${speakerName}.

SPRECHER-PROFIL (${speakerName}):
- Name: ${speakerNpc?.name} (Spitzname: ${speakerNpc?.nickname})
- Rolle: ${speakerNpc?.role}
- Persönlichkeit: ${speakerNpc?.personality}${speakerNpc?.personalityTraits ? ` (${formatPersonalityTraitsAsPrompt(speakerNpc.personalityTraits)})` : ''}
- Bio/Hintergrund: ${speakerNpc?.bio}
- Beziehung zum Spieler: ${speakerNpc?.relationship || 'Keine besondere Beziehung bekannt.'}
- Verhalten: ${speakerNpc?.conduct}
- Wissen über den Spieler: ${speakerNpc?.knowledge || 'Kein spezielles Wissen.'}

REGELN FÜR DEINE ANTWORT (STRENG EINZUHALTEN):
1. Generiere AUSSCHLIESSLICH das gesprochene Wort des NPCs "${speakerName}" als direkte Reaktion auf die Worte des Spielers: "${text}".
2. Es ist absolut STRENGSTENS VERBOTEN, erzählende oder beschreibende Absätze zu schreiben!
3. Schreibe KEINE Beschreibungen, KEINE Aktionen in Sternchen (z.B. KEIN *seufzt* oder *schaut weg*), KEINE Gedanken, KEINERLEI Metadaten oder Regieanweisungen.
4. Gib AUSSCHLIESSLICH die gesprochenen Sätze aus, so wie der Charakter sie in wörtlicher Rede aussprechen würde. Schreibe KEINE Anführungszeichen um die gesamte Antwort und KEIN "Er sagt:".
5. Antworte in der Ich-Perspektive des Charakters "${speakerName}". Er/Sie spricht direkt mit dem Spieler.
6. Halte dich an die Charakterbeziehung: Siezt oder duzt er den Spieler? Spricht er respektvoll, frech, scheu, überheblich?
`;
    } else if (dialogueType === 'npc_npc') {
      userDisplayMsgText = ` [Dialog-Thema für ${speakerName} & ${targetName}] ${text || 'Freies Gespräch'}`;
      aiSystemDirective = `
DU BEFINDEST DICH IM REINEN DIALOG-MODUS ZWISCHEN ZWEI CHARAKTEREN!
Gesprächspartner:
- Charakter A: ${speakerName}
- Charakter B: ${targetName}

Thema oder Anregung des Nutzers: "${text || 'Ein interessantes Gespräch über die aktuelle Lage'}"

PROFIL VON ${speakerName}:
- Persönlichkeit: ${speakerNpc?.personality}${speakerNpc?.personalityTraits ? ` (${formatPersonalityTraitsAsPrompt(speakerNpc.personalityTraits)})` : ''}
- Bio: ${speakerNpc?.bio}
- Verhalten: ${speakerNpc?.conduct}
- Beziehung zu ${targetName}: ${speakerNpc?.relationships?.find((r: any) => r.targetCharacter === targetNpc?.name)?.behavior || 'Neutral'}

PROFIL VON ${targetName}:
- Persönlichkeit: ${targetNpc?.personality}${targetNpc?.personalityTraits ? ` (${formatPersonalityTraitsAsPrompt(targetNpc.personalityTraits)})` : ''}
- Bio: ${targetNpc?.bio}
- Verhalten: ${targetNpc?.conduct}
- Beziehung zu ${speakerName}: ${targetNpc?.relationships?.find((r: any) => r.targetCharacter === speakerNpc?.name)?.behavior || 'Neutral'}

REGELN FÜR DEINE ANTWORT (STRENG EINZUHALTEN):
1. Generiere einen reinen, lebendigen Dialog (wörtliche Rede) zwischen ${speakerName} und ${targetName}. Er sollte ca. 2-3 Mal hin und her gehen.
2. Schreibe das Gespräch AUSSCHLIESSLICH im folgenden Format:
   ${speakerName}: "..."
   ${targetName}: "..."
   ${speakerName}: "..."
3. Schreibe KEINE Beschreibungen, KEINE Erzählungen, KEINE Aktionen in Sternchen, KEINE Gedanken. Einfach NUR das gesprochene Wort im angegebenen Zeilenformat.
4. Die Charaktere müssen absolut getreu ihrer Persönlichkeit, Ausdrucksweise und ihrer Beziehung zueinander sprechen.
`;
    } else {
      userDisplayMsgText = ` [Gruppen-Gespräch: ${groupNamesStr}] ${text || 'Freie Diskussion'}`;
      aiSystemDirective = `
DU BEFINDEST DICH IM REINEN GRUPPEN-DIALOG-MODUS!
Teilnehmende Charaktere:
${groupNpcs.map(n => `- ${n.nickname || n.name}: Persönlichkeit: ${n.personality}${n.personalityTraits ? ` (${formatPersonalityTraitsAsPrompt(n.personalityTraits)})` : ''}, Bio: ${n.bio}, Verhalten: ${n.conduct}`).join('\n')}

Thema oder Anregung des Nutzers: "${text || 'Ein lockeres Gespräch über ihre nächsten Pläne'}"

REGELN FÜR DEINE ANTWORT (STRENG EINZUHALTEN):
1. Generiere ein lebendiges Gespräch zwischen diesen Charakteren (jeder sollte mindestens einmal zu Wort kommen).
2. Schreibe das Gespräch AUSSCHLIESSLICH im folgenden Format (Zeile für Zeile):
   CharakterName: "Spruch..."
   AndererCharakterName: "Spruch..."
3. Schreibe KEINE Beschreibungen, KEINE Erzählungen, KEINE Aktionen in Sternchen, KEINE Gedanken. Einfach NUR das gesprochene Wort.
4. Jede Figur muss absolut getreu ihrer Persönlichkeit sprechen.
`;
    }

    const userMsg: ChatMessage = {
      id: `dialogue-user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      text: userDisplayMsgText,
      isDialogue: true,
      dialogueType,
      dialogueSpeakerName: speakerName,
      dialogueTargetName: targetName
    };
    
    setMessages(prev => [...prev, userMsg]);
    
    try {
      const currentStatsStr = (adventure.statusElements || []).map(el => `${el.label}: ${el.value || '0'}`).join(' | ');
      const campaignPowerInstruction = adventure.world.campaignPowerSettings ? "Grundwerte: " + JSON.stringify(adventure.world.campaignPowerSettings) : "";
      
      const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${adventure.world.title}".
      
WELT: ${adventure.world.description} (Ton: ${adventure.world.tone})
${campaignPowerInstruction}

SPIELER-CHARAKTER:
${adventure.player.name} (${adventure.player.role}). 
- Bio: ${adventure.player.bio}
- Aktuelle Lage: ${adventure.player.currentSituation}
- Ziel: ${adventure.player.goal}

AKTUELLE WERTE: ${currentStatsStr}

${aiSystemDirective}

WICHTIGSTE REGEL:
Halte dich STRIKT an die Anweisung, AUSSCHLIESSLICH gesprochenes Wort auszugeben! Keine Erzählungen, keine Handlungen in Sternchen, keine Szenenbeschreibungen. Nur der nackte, gesprochene Text.`;

      const updatedMessages = [...messages, userMsg];
      const response = await GeminiService.chat(updatedMessages, systemInstruction, adventure.world.isNsfw, adventure.summaryLog);
      const rawText = response.text || '';
      
      const newModelMsg: ChatMessage = {
        id: `dialogue-model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'model',
        text: rawText.trim(),
        isDialogue: true,
        dialogueType,
        dialogueSpeakerName: speakerName,
        dialogueTargetName: targetName
      };

      setMessages(prev => [...prev, newModelMsg]);
      const nextChatHistory: ChatMessage[] = [...updatedMessages, newModelMsg];

      onUpdateAdventure({
        ...adventure,
        chatHistory: nextChatHistory
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Ein Fehler ist bei der Übertragung des Dialogs aufgetreten.");
      setMessages(prev => prev.filter(msg => msg.id !== userMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (textOverride?: string | React.MouseEvent<any>) => {
    const rawText = (typeof textOverride === 'string' ? textOverride : inputText).trim();
    if (!rawText) return;
    const text = rawText;
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
                      title: ` Technik-Aufstieg: ${t.name} ist nun Level ${nextLevel}!`,
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
                      title: ` Training erfolgreich: ${t.name} steigt auf Level ${nextLevel}!`,
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
    
    const isGroup = enemyId === 'custom' || 
                    activeEnemyName.toLowerCase().includes('bande') || 
                    activeEnemyName.toLowerCase().includes('rudel') || 
                    activeEnemyName.toLowerCase().includes('trupp') || 
                    activeEnemyName.toLowerCase().includes('wachen') || 
                    activeEnemyName.toLowerCase().includes('soldaten') || 
                    activeEnemyName.toLowerCase().includes('gegner') ||
                    activeEnemyName.toLowerCase().includes('marine') ||
                    activeEnemyName.toLowerCase().includes('infanterie') ||
                    activeEnemyName.toLowerCase().includes('infanteristen');

    const groupCount = isGroup ? parseGroupCountFromText(activeEnemyName, messages.map(m => m.text || '').join(' ')) : undefined;

    initialOpponentsList.push({
      id: mainNpc?.id || enemyId,
      name: activeEnemyName,
      hp: ehp,
      maxHp: ehp,
      role: activeEnemyRole,
      isFodder: isGroup,
      count: groupCount
    });

    // Add other hostile NPCs in this world zone only if they are active/present in the story
    adventure.npcs.forEach(n => {
      // EXPLICIT CHECK: Skip the player!
      if (adventure.player?.name && isNameMatch(adventure.player.name, adventure.player.nickname, n.name)) return;
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

    const splitOpponentsList = autoSplitOpponents(initialOpponentsList);

    setOpponents(splitOpponentsList);
    
    setCombatSubMenu('main');
    setIsCombatMenuExpanded(!isCombatMenuExpanded);

    // Codex Gegner Integration: Ensure newly started enemy is registered in Codex
    const cleanEnemyName = activeEnemyName.trim();
    if (cleanEnemyName && cleanEnemyName.toLowerCase() !== 'widersacher') {
      const updatedLore = [...(adventure.loreDatabase || [])];
      const exists = updatedLore.some(e => 
        (e.category === 'Gegner' || e.category === 'Charaktere') && 
        (e.title.trim().toLowerCase() === cleanEnemyName.toLowerCase() ||
         e.title.toLowerCase().replace(/[-\s_]/g, '') === cleanEnemyName.toLowerCase().replace(/[-\s_]/g, ''))
      );

      if (!exists) {
        const isGroup = enemyId === 'custom' || 
                        cleanEnemyName.toLowerCase().includes('bande') || 
                        cleanEnemyName.toLowerCase().includes('rudel') || 
                        cleanEnemyName.toLowerCase().includes('trupp') || 
                        cleanEnemyName.toLowerCase().includes('wachen') || 
                        cleanEnemyName.toLowerCase().includes('soldaten') || 
                        cleanEnemyName.toLowerCase().includes('gegner');
        
        const newGegnerEntry = {
          id: 'dyn-gegner-' + Math.random().toString(36).substr(2, 9),
          category: 'Gegner' as const,
          title: cleanEnemyName,
          description: isGroup 
            ? `Eine gefährliche Gruppe von ${cleanEnemyName}, die sich dem Spieler feindselig in den Weg stellt.`
            : `Ein feindseliger Gegner namens ${cleanEnemyName}, der den Spieler im Kampf fordert.`,
          isUnlocked: true,
          details: {
            role: activeEnemyRole,
            goal: 'Den Spieler besiegen oder aufhalten',
            rarity: isGroup ? 'Gruppe' : 'Standard',
            itemType: isGroup ? 'Gruppe' : 'Kreatur',
            campaignPowerLevels: generateEnemyPowerLevels()
          }
        };

        const nextHp = playerHp <= 0 ? initialPlayerHp : playerHp;
        const nextMaxHp = playerMaxHp <= 0 ? maxPlayerHp : playerMaxHp;
        const nextMp = playerMp <= 0 ? initialPlayerMp : playerMp;
        const nextMaxMp = playerMaxMp <= 0 ? maxPlayerMp : playerMaxMp;

        onUpdateAdventure({
          ...adventure,
          loreDatabase: [...updatedLore, newGegnerEntry],
          combatState: {
            isCombatActive: true,
            selectedEnemyId: enemyId,
            selectedEnemyIds: [enemyId],
            customEnemyName: enemyId === 'custom' && customName ? customName : '',
            opponents: splitOpponentsList,
            playerHp: nextHp,
            playerMaxHp: nextMaxHp,
            playerMp: nextMp,
            playerMaxMp: nextMaxMp,
            enemyHp: ehp,
            enemyMaxHp: ehp,
            combatSubMenu: 'main'
          }
        });
      }
    }
  };

  const handleCancelCombat = () => {
    setIsCombatActive(false);
    setIsCombatMenuExpanded(false);
    setCombatSubMenu('main');
    clearCombatActionQueue();
    setSelectedEnemyId('');
    setSelectedEnemyIds([]);
    onUpdateAdventure({
      ...adventure,
      combatState: {
        selectedEnemyId: '',
        selectedEnemyIds: [],
        customEnemyName: '',
        opponents: [],
        playerHp: playerHp || 100,
        playerMaxHp: playerMaxHp || 100,
        playerMp: playerMp || 100,
        playerMaxMp: playerMaxMp || 100,
        enemyHp: 100,
        enemyMaxHp: 100,
        combatSubMenu: 'main',
        placedObjects: adventure.combatState?.placedObjects || [],
        tiles: adventure.combatState?.tiles || {},
        ...(adventure.combatState || {}),
        isCombatActive: false
      }
    });
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
      return null;
    }
    
    const actionId = Math.random().toString(36).substr(2, 9);
    const newAct = {
      id: actionId,
      actionType,
      actionDetail,
      dmgDealt,
      mpCost,
      isHeal,
      costResourceName
    };

    const actionStr = getFormattedActionString(newAct);

    // Update combat actions queue
    setQueuedCombatActions(prev => [...prev, newAct]);

    // Update input text separately (not nested inside functional updater!)
    setInputText(prevText => {
      const trimmed = prevText.trim();
      if (!trimmed) {
        return actionStr;
      }
      return `${trimmed} ${actionStr}`;
    });
    
    return actionId;
  };

  const removeCombatActionFromQueue = (id: string) => {
    const actToRemove = queuedCombatActions.find(act => act.id === id);
    const next = queuedCombatActions.filter(act => act.id !== id);

    setQueuedCombatActions(next);

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
    
    // Remove any summons that were placed by this action
    if (adventure.combatState?.placedObjects) {
      const hasSummonsToRemove = adventure.combatState.placedObjects.some(obj => (obj as any).sourceActionId === id);
      if (hasSummonsToRemove) {
        onUpdateAdventure({
          ...adventure,
          combatState: {
            ...adventure.combatState,
            placedObjects: adventure.combatState.placedObjects.filter(obj => (obj as any).sourceActionId !== id)
          }
        });
      }
    }
  };

  const clearCombatActionQueue = () => {
    setQueuedCombatActions([]);
    setInputText("");
    
    if (adventure.combatState?.placedObjects) {
      const idsToRemove = queuedCombatActions.map(a => a.id);
      const hasSummonsToRemove = adventure.combatState.placedObjects.some(obj => idsToRemove.includes((obj as any).sourceActionId));
      if (hasSummonsToRemove) {
        onUpdateAdventure({
          ...adventure,
          combatState: {
            ...adventure.combatState,
            placedObjects: adventure.combatState.placedObjects.filter(obj => !idsToRemove.includes((obj as any).sourceActionId))
          }
        });
      }
    }
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
      if ((labelLower === 'zeit' || labelLower === 'uhrzeit' || labelLower.includes('uhrzeit'))) {
        const timeParts = el.value.split(':');
        if (timeParts.length === 2) {
          const hoursToAdd = type === 'long' ? 8 : 1;
          const hour = (parseInt(timeParts[0]) + hoursToAdd) % 24;
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

    // Reset other HUD & dynamic state variables
    setScannedOpponents({});
    setQueuedCombatActions([]);
    setPendingCombatAction(null);
    setLoreNotifications([]);
    
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

    // Restore general inventory list back to starting values
    const resetInventory = adventure.initialInventory 
      ? JSON.parse(JSON.stringify(adventure.initialInventory)) 
      : (adventure.inventory || []);

    // Restore lore database (Codex) back to starting values
    const resetLoreDatabase = adventure.initialLoreDatabase 
      ? JSON.parse(JSON.stringify(adventure.initialLoreDatabase)) 
      : (adventure.loreDatabase || []).filter((e: any) => !e.id?.startsWith('dyn-')).map((e: any) => ({
          ...e,
          isUnlocked: e.isUnlocked
        }));

    // Restore npcs back to starting values (removing dynamic npcs, reverting changes)
    const resetNpcs = adventure.initialNpcs 
      ? JSON.parse(JSON.stringify(adventure.initialNpcs)) 
      : (adventure.npcs || []).filter((n: any) => !n.id?.startsWith('dyn-'));

    onUpdateAdventure({ 
      ...adventureRef.current, 
      chatHistory: resetMsgs,
      player: resetPlayer,
      npcs: resetNpcs,
      loreDatabase: resetLoreDatabase,
      inventory: resetInventory,
      statusElements: resetStatus,
      structuredInventory: resetStructuredInventory,
      combatState: undefined,
      summaryLog: ""
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
      const statusWithTime = advanceGameTime(adventure.statusElements || []);

      const npcDocs = npcs.map(n => formatNPCForAIPrompt(n)).join('\n');

      const currentStatsStr = statusWithTime.map(s => `${s.label}: ${s.value}`).join(', ');

      const lore = adventure.loreDatabase || []; // prompt_build_second
      
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
- Energie-Effizienz: Der Radar-Wert für Energie-Effizienz (Einfluss auf Kostenreduktion).

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
- Untertyp "Formwechsel/Stance": Attribut A = Attribut A * 1,25 und Attribut B = Attribut B * 0,75
  Logik: Tauscht Werte permanent, solange die Haltung aktiv ist (z.B. +25% Angriff für -25% Verteidigung).

4. Kategorie: Support
- Untertyp "Heilung/Regeneration": Geheilte HP = B * (1 + R/100) * L
  Logik: Füllt die grüne Lebensleiste im HUD sofort auf (kann HP_max nicht überschreiten).
- Untertyp "Debuff (Sicht/Bewegung)": Gegner-Malus in % = (R * L) / 2
  Logik: Senkt die Treffsicherheit oder Geschwindigkeit des Gegners für eine Anzahl an Runden, die dem Tier-Level entspricht.
- Untertyp "Statuseffekt/Buff": Effekt-Dauer in Runden = Tier-Stufe (Tier 1 = 1 Runde, Tier 2 = 2 Runden, Tier 3 = 3 Runden, Tier 4 = 4 Runden)
  Logik: Verleiht Angriffen Bonuseffekte.

VERBRAUCHS- & KOSTENBERECHNUNG (PROZENTUAL VOM MAX-POOL NACH TIER):
- Tier 1 (Standard): Basis-Kosten = exakt 5 % der maximalen Leiste des gewählten Kosten-Pools.
- Tier 2 (Fortgeschritten): Basis-Kosten = exakt 15 % der maximalen Leiste des gewählten Kosten-Pools.
- Tier 3 (Meisterhaft): Basis-Kosten = exakt 35 % der maximalen Leiste des gewählten Kosten-Pools.
- Tier 4 (Ultimativ): Basis-Kosten = exakt 60 % der maximalen Leiste des gewählten Kosten-Pools.

FORMEL FÜR FINALE KOSTEN IM CHAT:
- Finale Kosten im Chat = Basis-Kosten * (1 - Radar-Wert für Energie-Effizienz / 200)
Beispiel: Hat ein Charakter max. 50 Mana und setzt eine Tier 2 Technik ein (Basis-Kosten 15% von 50 = 7.5 ~ 8 Mana) bei einer Energie-Effizienz von 40, so gilt:
  Finale Kosten im Chat = 8 * (1 - 40/200) = 8 * 0.8 = 6.4 ~ 6 Mana.

STRIKTE SYSTEM-REGELN FÜR DIE KI ZUR ANWENDUNG DER EFFEKTE:
1. PRÜFUNG DES DATENBLATTS: Bei jedem Einsatz einer Fähigkeit/Technik MUSST du die unten aufgeführte aktive Balancing-Tabelle prüfen und den exakten Typ, Untertyp, Basiswert (B) und die Skalierungsformel ermitteln.
2. EFFEKT-BERECHNUNG: Berechne den numerischen Wert immer stre    - Bei Ressourcenverbrauch (z.B. 6 Mana verbraucht von 50): [[STATUS: Spieler_Mana=44]]
    - Bei Transformation/Buff: Passe die entsprechenden Werte oder Diagrammwerte an.
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
            { type: 'Transformation', subtype: 'Formwechsel/Stance', baseValue: 5, costResourceName: 'Ausdauer', tier: 'Tier 1', scalingAndEffect: 'Attribut A = Attribut A * 1,25 und Attribut B = Attribut B * 0,75' },
            { type: 'Support', subtype: 'Heilung/Regeneration', baseValue: 12, costResourceName: 'Mana', tier: 'Tier 1', scalingAndEffect: 'Geheilte HP = B * (1 + R/100) * L' },
            { type: 'Support', subtype: 'Debuff (Sicht/Bewegung)', baseValue: 8, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Gegner-Malus in % = (R * L) / 2' },
            { type: 'Support', subtype: 'Statuseffekt/Buff', baseValue: 10, costResourceName: 'Mana', tier: 'Tier 2', scalingAndEffect: 'Effekt-Dauer in Runden = Tier-Stufe' }
          ];

      const rulesDetails = rulesList.map(rule => {
        return `- ${rule.type} (${rule.subtype}): Basis-Wert (B) = ${rule.baseValue}, Kraftquelle = ${rule.costResourceName || 'Mana'}, Tier = ${rule.tier || 'Tier 1'}. Skalierungsformel: ${rule.scalingAndEffect}`;
      }).join('\n      ');
      techniqueRulesInstruction += `\nAKTIVE BALANCING-TABELLE AUS DEM DATENBLATT:\n      ${rulesDetails}\n`;

      let loreInstruction = ''; // prompt_build_second_lore_loc2
      if (lore.length > 0) {
        const grouped = lore.reduce((acc, curr) => {
          acc[curr.category] = acc[curr.category] || [];
          acc[curr.category].push(curr);
          return acc;
        }, {} as Record<string, typeof lore>);

        loreInstruction = '\nLORE DATENBANK (Wichtige Fakten, Regeln, Geheimnisse & Historie der Welt) [LOC2]:\n';
        Object.entries(grouped).forEach(([cat, entries]) => {
          loreInstruction += `[${cat.toUpperCase()}]\n`;
          const sorted = (cat === 'Events' || cat === 'Story & Quests') 
            ? entries.sort((a, b) => (a.order || 0) - (b.order || 0)) 
            : (cat === 'Zeitlinie' 
                ? entries.sort((a, b) => {
                    const oa = a.order !== undefined ? a.order : (a.details?.order !== undefined ? a.details.order : 9999);
                    const ob = b.order !== undefined ? b.order : (b.details?.order !== undefined ? b.details.order : 9999);
                    return oa - ob;
                  })
                : entries);
          sorted.forEach(e => {
            const isForbiddenWissen = cat === 'Verbotenes Wissen';
            const secretTag = (isForbiddenWissen || !e.isUnlocked) ? ' [STRENG GEHEIM: Dieses Wissen ist absolut verboten oder geheim! Halte dieses Wissen absolut unter Verschluss. Verrate, erwähne, leake oder andeute dieses Wissen niemals unaufgefordert, es sei denn, die Bedingungen zur Enthüllung im Chat sind explizit erfüllt!]' : '';
            let extraDetails = '';
            
            if (cat === 'Verbotenes Wissen') {
              extraDetails = ` | GEHEIMHALTUNGSSTUFE: ${e.details?.confidentiality || 'Absolut Geheim'} | ENTHÜLLUNGS-BEDINGUNG: ${e.details?.revealTrigger || 'Darf niemals verraten werden'} | GEHEIMHALTUNGS-VORGABE FÜR DIE KI (STRENGSTENS EINZUHALTEN): [${e.details?.aiSecretInstruction || 'Absolutes Schweigen über dieses Geheimnis!'}]`;
            } else if ((cat === 'Charaktere' || cat === 'Gegner') && e.details) {
              const d = e.details;
              const traits = [];
              if (d.role) traits.push(`Rolle: ${d.role}`);
              if (d.gender || d.age) traits.push(`Aussehen: ${d.gender || ''} ${d.age ? d.age + 'J' : ''}`.trim());
              if (d.goal) traits.push(`Ziel: ${d.goal}`);
              if (d.motivationCore) {
                const motivationStr = formatMotivationCoreForAI(d.motivationCore);
                if (motivationStr) traits.push(motivationStr);
              }
              
              // Location check
              const activeLocation = lore.find(l => l.category === 'Orte' && l.details?.isActiveTarget);
              const activeLocationTitle = activeLocation?.title || '';
              const charLoc = d.currentLocation;
              if (charLoc) {
                traits.push(`Aktueller Standort: ${charLoc}`);
                if (activeLocationTitle) {
                  const cleanCharLoc = charLoc.replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim().toLowerCase();
                  const cleanActiveLocation = activeLocationTitle.replace(/\(x\s*:\s*\d+\s*,\s*y\s*:\s*\d+\)/i, '').split('(')[0].trim().toLowerCase();
                  if (cleanCharLoc !== cleanActiveLocation) {
                    traits.push(`[STATUS: GEGENWÄRTIG ABWESEND - Dieser Charakter befindet sich NICHT an '${activeLocationTitle}' und darf in dieser Szene absolut NICHT physisch auftreten, sprechen, handeln oder direkt agieren!]`);
                  } else {
                    traits.push(`[STATUS: ANWESEND - Dieser Charakter befindet sich am selben Ort wie der Spieler ('${activeLocationTitle}') und ist physisch vor Ort.]`);
                  }
                }
              }

              if (d.relationships && d.relationships.length > 0) {
                const relsStr = d.relationships.map((r: any) => formatRelationshipForAI(r, e.title)).join(' | ');
                traits.push(`Detaillierte Beziehungen: ${relsStr}`);
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
            
            if (cat === 'Zeitlinie' && e.details) {
              const d = e.details;
              const parts = [];
              if (d.timeOfEvent) parts.push(`Zeitpunkt: ${d.timeOfEvent}`);
              if (d.location) parts.push(`Ort: ${d.location}`);
              if (d.involvedCharacters) parts.push(`Beteiligte Personen: ${d.involvedCharacters}`);
              if (parts.length > 0) {
                extraDetails = ` | Details: ${parts.join('. ')}`;
              }
            }
            
            if ((cat === 'Events' || cat === 'Story & Quests') && e.details?.eventSteps) {
              const steps = e.details.eventSteps.map((s: any, sIdx: number) => {
                const knowledgeText = s.revealedKnowledge ? ` | Enthülltes/Verborgenes Wissen: ${
                  s.status === 'happened'
                    ? `[FREIGEGEBEN - darf und soll im Chat enthüllt oder thematisiert werden: ${s.revealedKnowledge}]`
                    : `[STRENG GEHEIM - noch NICHT erreicht! Darf unter keinen Umständen im Chat verraten, angedeutet oder offenbart werden!: ${s.revealedKnowledge}]`
                }` : '';
                const triggerText = s.trigger ? ` | Auslöser (Trigger): ${s.trigger}` : '';
                const castText = s.cast ? ` | Besetzung (Wer): ${s.cast}` : '';
                const settingText = s.setting ? ` | Kulisse (Wo): ${s.setting}` : '';
                const conflictText = s.conflict ? ` | Konflikt (Was): ${s.conflict}` : '';
                
                return `[Station #${sIdx + 1}: ${s.title || 'Unbenannt'} (${s.status === 'happened' ? 'Eingetreten' : 'Ausstehend/Geplant'})${s.description ? ` - HANDLUNGS-, DIALOG- & TAKTIKVORGABE FÜR NPCS: ${s.description}` : ''}${triggerText}${castText}${settingText}${conflictText}${knowledgeText}]`;
              });
              if (steps.length > 0) {
                extraDetails = ` | Roter Faden / Geplante Story-Schritte (MANDATORISCH ZU BEACHTEN): ${steps.join(' -> ')}`;
              }
            }

            let secretsStr = '';
            if (e.secretsStage1 || e.secretsStage2 || e.secretsStage3 || e.knowledge) {
              secretsStr = ` | Geheimnisse & Verborgenes Wissen: [Stufe 1 (Öffentlich): ${e.secretsStage1 || 'Keine'}], [Stufe 2 (Indizien & Verdacht): ${e.secretsStage2 || 'Keine'}], [Stufe 3 (Absolutes Geheimnis - Blackbox): ${e.secretsStage3 || 'Keine'}], [Verhüllung & Geteiltes Wissen: ${e.knowledge || 'Keine'}]`;
            }
            
            loreInstruction += `- ${e.title}${e.order !== undefined && (cat === 'Events' || cat === 'Story & Quests') ? ` (#${e.order})` : ''}${secretTag}: ${e.description}${extraDetails}${secretsStr}\n`;
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
           Z.B. wenn im Erzähltext eine genaue Anzahl genannt wird (z.B. "Zwei Männer", "3 Piraten", "fünf Wachen"), passe die Gegneranzahl exakt im Status an: [[STATUS: Piraten_count=2]] oder [[STATUS: Bestien-Piraten_count=2]].
           Z.B. wenn ein spezifischer Gegner Schaden nimmt: [[STATUS: Gegner_HP=45]]. Du kannst auch name_HP benutzen wie [[STATUS: Marine-Soldaten_HP=40]].
           Trage Änderungen stets per [[STATUS: Feld=Wert]] aus!
        4. NPCs (Gegner oder Gefährten) agieren hochgradig dynamisch! Sie können sprechen, dem Spieler Befehle zurufen ("Laufen wir weg Richtung Hafen!"), den Alarm auslösen ("Alarm! Verstärkung aus der Festung!") oder neue Einheiten/Armeen aus Geländestrukturen spawn lassen. Wenn neue Einheiten aus einem Gelände (z.B. Wald, Schiff, Festung, Haus, Höhle, Tor) erscheinen, rufe sie per [[STATUS]]-Block herbei: z.B. [[STATUS: Spawn_Piraten=50_aus_Schiff]] oder [[STATUS: Spawn_Orks=30_aus_Wald]] oder [[STATUS: Wachhunde_count=6]]. Das Kampfraster faßt große Horden automatisch in übersichtliche Trupp-Tokens zusammen und platziert sie direkt neben der Geländequelle auf der Karte!
        5. Beschreibe am Ende deines Zuges immer die Reaktion/Aktion der verbliebenen Feinde und deren Gegenangriff, der den Spieler fordert und eventuell Schaden anrichtet (z.B. Spieler_HP=80).
        6. Falls alle Feinde besiegt sind (Anzahl = 0 oder HP = 0), beschreibe ihren spektakulären K.O. oder ihre Flucht und beende den Kampf feierlich!`;
      }

      const economyConfig2 = world.economyConfig || adventure?.world?.economyConfig;
      const economyInstruction2 = economyConfig2?.holdings?.length ? `
      BESITZTÜMER, BETRIEBE, PERSONAL & ARBEITSAUFGABEN:
      - Währung: ${economyConfig2.currencyName || 'Goldmünzen'}
      - Abrechnungs-Intervall: ${economyConfig2.payoutInterval || 'weekly'}
      - Betriebe, anwesendes Personal & Aufgaben:
      ${economyConfig2.holdings.map(h => {
        const pendingTasks = h.tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress')
          .map(t => `"${t.title}" [Prio: ${t.priority}, Zugewiesen: ${t.assigneeName || 'Offen'}]`).join(', ') || 'Keine offenen Aufgaben';
        const staffSummary = h.staffGroups?.map(sg => `${sg.count}x ${sg.roleName} (Bereich: ${sg.workplaceArea}, Status: ${sg.status})`).join(', ') || '';
        const rolesSummary = h.roles?.map(r => `${r.name}: ${r.assignedToName}`).join(', ') || '';
        const dutiesSummary = h.duties?.map(d => `${d.title} (${d.frequency})`).join(', ') || '';
        return `  * "${h.name}" (${h.type.toUpperCase()}, Stufe ${h.level}) | Ort: ${h.locationName || 'Vor Ort'}
    - Namentliche Posten: ${rolesSummary || 'Keine'}
    - Personalgruppen (physisch präsent am Ort): ${staffSummary || `${h.staffCount} Mitarbeiter allgemein`}
    - Aktuelle operative Aufgaben: ${pendingTasks}
    - Wiederkehrende Pflichten: ${dutiesSummary || 'Standardbetrieb'}`;
      }).join('\n')}
      HINWEIS FÜR DIE SZENERIE:
      Wenn der Spieler sich in einem dieser Betriebe oder an dessen Standort befindet:
      1. Lass das dortige Personal (z.B. Küchenhilfen, Köche, Mägde, Gesellen, Wachen) lebendig im Hintergrund auftreten (sie schneiden Gemüse, schleppen Kisten, putzen Tische, halten Wache).
      2. Reagiere auf Ereignisse im Raum (Schrei, Befehl, Einbruch, Brand) plausibel mit den anwesenden Personalgruppen.
      3. Beziehe delegierte oder aktive Aufgaben bei passenden Gelegenheiten mit ein.
      ` : '';

      const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${world.title}".
      
      WELT: ${world.description} (Ton: ${world.tone})
      ${campaignPowerInstruction}
      ${techniqueRulesInstruction}
      ${loreInstruction}
      ${economyInstruction2}
      ${getActiveTerritoryInstruction()}

      ${nsfwInstruction}
      ${heroicInstruction}
      ${dramaInstruction}

      ${profileInfo}

      ${formatPlayerForAIPrompt(player, getPlayerPhysicalStatusSummary(), getPlayerAbilitiesFormat(), playerPowerInstruction, getInventoryAndEquipmentSummary())}

      AKTUELLE WERTE: ${currentStatsStr}

      NPCs IN DIESER WELT:
      ${npcDocs}
      ${getTacticalBattlefieldSummary()}

      ${combatInstruction}

      ANWEISUNGEN FÜR DEINE ANTWORTEN (STRENG EINZUHALTEN):
      1. MEHR HANDLUNG & DYNAMIK, WENIGER REINE UMGEBUNGSBESCHREIBUNG:
         - Der absolute Schwerpunkt deiner Nachricht MUSS auf aktiven Ereignissen, Handlungen, Entscheidungen, dynamischen Interaktionen und spürbarem Plot-Fortschritt liegen!
         - Vermeide lange, statische oder passive Beschreibungen von Räumen, Wänden, Böden, Möbeln, Lichtstimmungen oder Stille. Maximal 1-2 kurze, wirkungsvolle Sätze zur Szenerie genügen völlig.
         - Der gesamte Rest deiner Antwort muss aus lebendiger Handlung, Reaktionen von Charakteren und neuen Vorfällen bestehen. Beschreibe Kleidung und Körpersprache dynamisch im Fluss der Aktion, niemals als statischen Stillstand.
      2. Beziehe die VERGANGENHEIT der Figuren mit ein (Andeutungen oder direkte Referenzen).
      3. Lass die NPCs ihre ZIELE verfolgen. Sie sollten nicht nur passiv sein, sondern eigene Agenden haben.
      4. Nutze das HUD für Änderungen der AKTUELLEN WERTE: [[STATUS: Feld1=Wert1, Feld2=Wert2]]. Trenne mehrere Änderungen zwingend mit einem Komma! Du KANNST und SOLLST Werte anpassen, wenn die Handlung es erfordert. WICHTIG: Nutze AUSSCHLIESSLICH die exakten Feldnamen, die dir unter \"AKTUELLE WERTE\" übergeben wurden! Erfinde NIEMALS neue HUD-Felder, die nicht in den aktuellen Werten stehen.
      5. ANTWORTE IMMER AUF DEUTSCH. Gib KEINE Antwortmöglichkeiten (A, B, C) vor. Der Spieler schreibt seine Aktionen frei.
      6. KEINE STANDARD-FRAGEN AM ENDE, ABER IMMER EIN AKTIVER SZENENAUFHÄNGER:
         - Beende deine Nachrichten NIEMALS mit stereotypischen Fragen wie "Was wirst du tun?", "Was tust du?", "Wie reagierst du?", "Wie wirst du reagieren?" oder ähnlichen Floskeln.
         - Lass die Szene aber NICHT in passiver Leere, Stille oder Ticken der Wanduhr versanden!
         - Schließe deine Antwort IMMER mit einer aktiven Situation, einem neuen Vorfall, einer Aktion eines NPCs, einem unerwarteten Geräusch oder einem Wendepunkt ab, worauf der Spieler mit seiner nächsten Nachricht sofort gezielt und spannend reagieren und handeln kann!
      6b. SCHLAFEN, RASTEN & OHNMACHT / BEWUSSTLOSIGKEIT (AUTOMATISCHER ZEITSPRUNG & DIREKTE HANDLUNGSVORBEREITUNG):
         - Wenn der Spieler sich schlafen legt, schlafen geht, zur Ruhe begibt, rastet oder ohnmächtig/bewusstlos wird:
           * BLEIBE UNTER KEINEN UMSTÄNDEN IN DER RUHESZENE STEHEN! Beschreibe nicht endlos das Zimmer, das Bett, das ruhige Atmen oder die Stille der Nacht.
           * Fasse das Einschlafen oder das Schwinden der Sinne in maximal 1-2 kurzen Sätzen zusammen.
           * Führe ZWINGEND sofort einen automatischen ZEITSPRUNG bis zu dem Moment durch, an dem der Charakter wieder aufwacht (z. B. am nächsten Morgen oder nach mehreren Stunden Erholung/Ohnmacht)!
           * Aktualisiere die Uhrzeit im [[STATUS: Zeit=HH:MM]] (z. B. auf 07:00 am nächsten Morgen oder +7 bis +8 Stunden für Nachtruhe, bzw. +1 bis +3 Stunden bei Ohnmacht) und regeneriere HP/MP/Ausdauer (z. B. [[STATUS: Zeit=07:00, Ausdauer=100%]]).
           * BEREITE BEIM ERWACHEN SOFORT DIE NÄCHSTE HANDLUNG VOR (AKTIVER SZENENAUFHÄNGER):
             Unmittelbar beim Aufwachen tritt sofort die nächste Handlung, ein neues Ereignis oder ein Vorfall ein, worauf der Spieler mit seiner nächsten Nachricht reagieren kann!
             (Beispiele: Jemand klopft energisch an die Zimmertür; eilige Schritte oder Stimmen hallen durch den Flur; ein NPC betritt den Raum mit einer wichtigen Botschaft oder einem Befehl; draußen ertönt Lärm, Aufruhr oder Alarm; ein neuer Tag bricht an mit einer konkreten Dringlichkeit oder Aufgabe).
             Der Charakter darf nach dem Erwachen nicht im Stillstand verharren, sondern die nächste Handlung beginnt sofort!
      7. KEIN DIKTIEREN DER WAHRNEHMUNG, REAKTION, GEFÜHLE, UNWILLKÜRLICHEN KÖRPERREAKTIONEN ODER DIALOGE DES SPIELERS (ABSOLUTES SPRECH- UND HANDLUNGSVERBOT FÜR DEN NUTZER): Schreibe niemals vor, was der Spieler aktiv tut, denkt, fühlt, bemerkt, empfindet oder wie sein Körper unwillkürlich reagiert. Diktierte Aktionen, Gefühle oder Sätze wie "Du bemerkst, dass dich jemand beobachtet", "Du spürst Angst aufsteigen", "Du blickst dich um", "lässt dein Herz einen Schlag aussetzen", "Deine Hände umklammern fester", "Du spürst eine eisige Kälte in deiner Brust" oder "Du musst jetzt reagieren" sind STRENGSTENS VERBOTEN. Zudem darfst du NIEMALS wörtliche Rede, Dialoge, Gedanken oder aktive Handlungen im Namen des Spielers/seines Charakters formulieren, erfinden oder diktieren (z.B. darfst du ihm niemals Sätze in den Mund legen wie: "Das war's, du hättest mich nie finden dürfen!", rufst du). Der Spieler spricht, fühlt und handelt einzig und allein selbst durch seine Eingaben! Beschreibe stattdessen nur die objektive Umwelt und das Verhalten von NPCs (z.B. "Draußen zieht ein frischer Wind auf und die Blätter rascheln an den Fenstern" anstatt "Du spürst eine Kälte in deiner Brust"). Der Spieler entscheidet ganz allein über seine Wahrnehmung, Gedanken, unwillkürlichen Körperreaktionen, Gefühle, Dialoge und Reaktionen.
      7b. ABSOLUTES ZITIERVERBOT DES NUTZERS: Du als Erzähler darfst NIEMALS die Eingaben, Worte oder Aussagen des Spielers/Nutzers wörtlich in deiner Narration oder Beschreibung wiederholen, zitieren oder zusammenfassend nachplappern. Wenn der Spieler spricht, ist es bereits gesagt worden. NPCs und andere Charaktere in der Welt dürfen den Spieler jedoch in ihren eigenen Dialogen (in wörtlicher Rede) zitieren oder sich auf seine Worte beziehen.
      8. ABSOLUTES VERBOT DES SELBSTSTÄNDIGEN / PASSIVEN LOSGEHENS VON FÄHIGKEITEN & KRÄFTEN DES SPIELERS (SPIELER-KRAFTKONTROLLE & AKTIVIERUNGSMONOPOL):
         - Die Fähigkeiten, Magie, Elementarkräfte (wie Kälte, Eis, Hitze, Feuer, Wind, Schatten, Licht etc.), Teufelskräfte, Transformationen, Auren oder Fertigkeiten des Spielers/Nutzers gehen NIEMALS von alleine los, lecken nicht passiv aus dem Körper heraus, entweichen nicht versehentlich und brechen niemals unkontrolliert aus!
         - Beschreibe NIEMALS, dass sich durch die bloße Anwesenheit, Emotionen oder Gedanken des Spielers von selbst Raureif, Frost, Kälte, Flammen, Hitze, Blitze, Funken oder Auren in der Umgebung (z.B. auf Tischen, Werkbänken, Wänden, Böden, Fenstern oder an Gegenständen) bilden oder absetzen!
         - Der Spieler besitzt die 100%ige und unerschütterliche Kontrolle über seine Fähigkeiten. Seine Kräfte, Magie oder Teufelskräfte aktivieren, entfalten oder manifestieren sich AUSSCHLIESSLICH DANN, wenn der Spieler dies in seinem eigenen Spielzug / Beitrag EXPLIZIT und aktiv anordnet oder einsetzt!
         - Weder der Erzähler noch NPCs dürfen beschreiben oder behaupten, dass die Kräfte des Spielers sich verselbstständigen, unkontrolliert fließen, "gebändigt/beruhigt werden müssen", unter der Haut prickeln oder die Umwelt unbeabsichtigt kühlen, erhitzen oder verändern.
         - NPCs dürfen den Spieler nicht belehren, ermahnen oder behandeln, als hätte er seine Kräfte nicht im Griff (z.B. keine Sätze wie "diese Kälte will kontrolliert werden" oder "lass die Hitze das Eis in deinen Adern besänftigen"), es sei denn, der Spieler selbst hat im Chat ausdrücklich geschrieben, dass sein Charakter die Beherrschung verliert.
         - Es ist strengstens verboten, passive körperliche Krafteffekte im Körper des Spielers zu erfinden (wie z.B. "ein kühles Prickeln unter deiner Haut", "das Eis in deinen Adern", "Hitze lodert unbemerkt in dir auf").
      9. GEHEIMPLÄNE & VERSTECKTE AGENDA (SPOILER-VERMEIDUNG): Wenn NPCs einen verdeckten oder geheimnisvollen Plan verfolgen (z.B. eine geplante Entführung, Sabotage oder Infiltration), darfst du diesen Plan dem Spieler/Leser NIEMALS direkt auf die Nase binden oder vorwegnehmen. Lass die Charaktere sich vollkommen natürlich oder passend zu ihrer Tarnung verhalten. Der wahre Plan darf sich erst verzögert und schrittweise durch diskrete Handlungen und Interaktionen offenbaren, bis es zu einem logischen und packenden Wendepunkt kommt.
      9. VERDECKTE IDENTITÄTEN & PSEUDONYME: Wenn sich NPCs auf einer verdeckten Mission befinden (z.B. getarnt in ein Anwesen schleichen), benutzen sie unter keinen Umständen ihre echten oder allseits bekannten Namen (wie Naruto, Ino, Sakura, Hinata etc.) im Gespräch mit Fremden oder dem Spieler, da dies die Mission sofort auffliegen lassen würde. Sie agieren unter Decknamen, Tarnidentitäten (z.B. als Personal, andere geladene Gäste oder Wachen) oder bleiben bis zum entscheidenden Moment anonym.
      10. TAKTISCHE & LOGISCHE REINSTE KONSISTENZ (FÄHIGKEITEN & JUTSUS): Die Verwendung von Spezialfähigkeiten oder Ninja-Techniken (z.B. Inos Shintenshin no Jutsu) muss absolut logisch und fehlerfrei durchdacht sein. Wenn ein Jutsu den Körper des Anwenders schutzlos oder ohnmächtig macht, muss im Vornherein logisch sichergestellt sein, dass dieser Körper sicher versteckt und bewacht ist (z.B. versteckt draußen auf einem Ast, bewacht von einer Kameradin wie Hinata, während andere wie Naruto und Sakura das Ziel in Reichweite - z.B. an ein Fenster - locken). Ein plötzliches, unbewachtes Umkippen in einer vollen Menschenmenge ist unlogisch und tabu. Die NPCs planen und handeln klug und professionell.
      13. HANDLUNGEN MARKIEREN: Wenn du Handlungen, Bewegungen oder den Gesichtsausdruck beschreibst, umschließe diese bitte mit Sternchen, wie z.B. *Er zieht sein Schwert* oder *schaut böse*. Gesprochener Text bleibt ohne Sterne.
      14. DYNAMISCHES CODEX / LORE UPDATE & GEGNER-CODEX (STRENG EINZUHALTEN):
          Erweitere die Lore-Datenbank (Codex) eigenständig bei wichtigen Ereignissen oder sobald neue Gegner eingeführt werden!
          - DUPLIKATE STRENGSTENS VERMEIDEN (KEINE ERNEUTE AUSGABE EXISTIERENDER EINTRÄGE): Prüfe vor jeder Antwort zwingend die oben aufgeführte 'LORE DATENBANK'! Wenn ein Eintrag (ein Charakter, Gegner, Ort, Gegenstand etc.) BEREITS in der Lore-Datenbank existiert (oder ein sehr ähnlicher Name wie 'Wachen', 'Marine-Soldaten' etc. bereits vorhanden ist), gib UNTER KEINEN UMSTÄNDEN erneut einen [[LORE_ADD: ...]] Tag für diesen Eintrag aus! Gib [[LORE_ADD: ...]] AUSSCHLIESSLICH DANN AUS, wenn eine VÖLLIG NEUE Entität zum ersten Mal in der Geschichte auftaucht.
          - GEGNER & HOSTILE GRUPPEN: Sobald du im Storyverlauf eine VÖLLIG NEUE feindselige Gruppe oder einen neuen Gegner einführst, der NOCH NICHT in der 'LORE DATENBANK' aufgelistet ist, erstelle EINMALIG einen Codex-Eintrag per [[LORE_ADD: Gegner | Name | Beschreibung auf Deutsch]]. Falls der Gegner/die Gruppe jedoch BEREITS in der Lore-Datenbank steht, gib den Tag NICHT erneut aus!
          - GEGNER-FILTERUNG: Führe nur Gegner ein, die sich auch tatsächlich physisch in unmittelbarer Nähe des Spielers befinden. Verbündete (Gefährten, Freunde, Lehrer) oder politische Fraktionen sind KEINE Gegner und dürfen niemals als Kampfgegner gelistet werden.
          - GEGENSTÄNDE, KLEIDUNG & OUTFITS (STRENGES MANDAT):
            1. Erstelle NIEMALS, absolut NIEMALS Einträge für gewöhnliche, alltägliche Gegenstände (wie Tisch, Lampe, Stift, Papier) oder einzelne Kleidungsstücke (wie "Kochhemd", "Schürze", "Stiefel", "Nachthemd", "Hose") oder Platzhalter-Zustände (wie "barfuß", "keine Kopfbedeckung").
            2. Wenn der Spieler oder ein Charakter neue Kleidung erhält oder trägt, fasse alle Kleidungsstücke IMMER zwingend zu EINEM EINZIGEN zusammenhängenden Outfit zusammen (z. B. [[LORE_ADD: Gegenstände | Kochkluft | Ein zusammenhängendes Outfit bestehend aus Kochhemd, Schmutziger Lederschürze und Arbeitsstiefeln]] oder [[INVENTORY_SET: armor.chest=Kochkluft (Kochhemd, Lederschürze, Arbeitsstiefel)]]).
            3. Nur legendäre, magische, plot-tragende Waffen, Artefakte oder zusammenhängende Outfits in den Codex eintragen! wenn ein Gegenstand/Waffe für den Spieler geschmiedet, gefunden oder ihm übergeben wird (oder einem NPC gehört), MUSS dieser absolut perfekt zur Lore passen. Trage Gegenstände/Waffen über [[LORE_ADD: Gegenstände | Name | Besitzer: Spieler | Detailreiche Beschreibung auf Deutsch]] in den Codex ein und füge sie per [[INVENTORY_SET: weapons+=Name]] oder [[INVENTORY_SET: generalItems+=Name]] dem Inventar hinzu!
          - VETO FÜR WELTREGELN & GEHEIMNISSE: Keine Spoiler oder verdeckten Pläne vorzeitig leaken!
          Nutze dazu das Format [[LORE_ADD: Gegner | Name | Beschreibung auf Deutsch]] für Gegner oder passende Kategorien wie 'Weltkarte', 'Fraktionen', 'Gegenstände', 'Verbotenes Wissen', 'Story & Quests', 'Weltregeln', 'Charaktere'. Neue Gebiete oder Städte können auch per [[TERRITORY_ADD: Name | Typ | Übergeordnetes_Gebiet | Reisezeit | Beschreibung]] hinzugefügt werden. Wenn ein bereits existierender, aber bisher geheimer Lore-Fakt enthüllt wird, schalte ihn frei mit [[LORE_UNLOCK: Name]].
      15. ABSOLUTES VERBOT DES VERÄNDERNS ODER ÜBERSCHREIBENS VON VORHANDENEN CHARAKTEREN & BEZIEHUNGEN: Die KI darf während des Chats UNTER KEINEN UMSTÄNDEN Einträge von vorhandenen Charakteren (weder vom Spieler/Nutzer noch von existierenden NPCs oder bestehenden Codex-Charakteren) verändern, mutieren oder überschreiben! Dies gilt ausnahmslos für Charakterbögen, Biografien, Werte, Aussehen und vor allem für bestehende Beziehungen ('relationships') und Verhalten zu anderen ('conduct'). Alle vorhandenen Charakterdaten und Beziehungen wurden vom Nutzer fest vorgegeben und sind absolut UNANTASTBAR!
      16. UMGANGSFORMEN, ETIKETTE & ANREDE: Beachte die sozialen Rollen und Hierarchien strikt. Wenn ein niederrangiger Charakter (z.B. Schüler, Lehrling, Bürger) einen höherrangigen (z.B. Lehrer/Sensei, König, Meister) nicht mit dem gebührenden Respekt oder der korrekten Anrede (z.B. Sensei, Eure Majestät) anspricht, müssen die NPCs darauf passend reagieren. Sie können Tadel aussprechen, Konsequenzen verhängen oder verärgert reagieren. Gleiches gilt für unangemessene Ausdrucksweise oder mangelnde Etikette.
      17. STRENGES ZITIER- & WIEDERHOLUNGSVERBOT: Du darfst NIEMALS die Worte, Sätze, Aktionen, Fragen oder Ausrufe des Spielers zitieren, wiederholen, umformulieren, umschreiben oder kopieren (auch nicht als wörtliche Rede, Gedanken oder Einleitung). Der Spieler hat seine Nachricht bereits selbst geschrieben/gelesen und will sie unter keinen Umständen in deiner Antwort wiederholt sehen. Beginne deine Antwort direkt mit den unmittelbaren Konsequenzen, NPCs-Reaktionen oder dem weiteren physischen/verbalen Verlauf der Szene. Schreibe absolut keine Einleitung, Zusammenfassung oder Rekapitulation des Spielerbeitrags. Wirf den Leser mitten in die darauffolgende Handlung!
      18. STRENGER GEHEIMNIS- UND SPOILER-SCHUTZ BEI TARNUNGEN UND GEHEIMNISSEN: Erwähne niemals geheime Rollen, verborgene Pläne, verdeckte Zugehörigkeiten oder Undercover-Identitäten von Charakteren direkt oder indirekt in der Narration (z.B. wenn Himiko Frost als Lehrerin auftritt, darfst du sie unter keinen Umständen als "Undercover-Agentin" oder "vermeintliche Lehrerin" bezeichnen, oder durch verdächtige oder unnatürliche Formulierungen ihre Tarnung im Textgefährden, es sei denn, ihre Identität wurde im Handlungsverlauf für die Spielfigur bereits eindeutig und unumstößlich aufgedeckt). Für den Spieler muss sie sich absolut lückenlos und überzeugend wie eine echte Lehrerin verhalten.
      19. INTERAKTIONEN UND DIALOGE ZWISCHEN NPCS: Baue vermehrt lebendige, direkte Dialoge in deine Antworten ein. Lass die anwesenden NPCs nicht nur mit dem Spieler sprechen, sondern auch direkt untereinander interagieren, sich unterhalten, Meinungen austauschen, miteinander diskutieren, scherzen, sich absprechen oder streiten. NPCs sind eigenständige Personen mit Beziehungen zueinander und sollten im Chat aktiv und hörbar miteinander kommunizieren, um Szenen lebendiger und authentischer zu machen.
      20. DYNAMISCHE UHRZEIT & SITUATIVER ZEITFORTSCHRITT PRO CHAT-NACHRICHT (MANDATORY [[STATUS: Zeit=HH:MM]]):
          Du bist dafür verantwortlich, dass pro Chat-Nachricht die Zeit in der Spielwelt realistisch und verhältnismäßig vergeht.
          ACHTE PENIBEL DARAUF, DASS DIE UHRZEIT NICHT ZU SCHNELL VERGEHT! In einem Rollenspiel dauern die meisten Chat-Aktionen (wie Sprechen, eine Frage stellen, Nachdenken, ein kurzer Blick oder ein einzelner Angriff/Zug) nur wenige Sekunden bis maximal 1 Minute.
          Gib in JEDER Antwort die neu berechnete Uhrzeit im Format [[STATUS: Zeit=HH:MM]] (oder Uhrzeit=HH:MM) an!
          Realistische Richtwerte für den Zeitverlauf:
          - Kurze Bemerkung / Dialog / Frage / Reaktion / einzelner Zug: +0 bis +1 Minute (die Uhrzeit ändert sich oft gar nicht oder nur um 1 Minute).
          - Längeres Gespräch / Diskussion / kurzes Verweilen / Inspektion eines Objekts: +2 bis +5 Minuten.
          - Gründliches Durchsuchen eines großen Raums / Spaziergang / Besorgungen: +10 bis +15 Minuten.
          - Kampf / Auseinandersetzung: Dauert in der Regel 1 bis 3 Minuten (Schlagabtäusche laufen in Sekunden ab). Nur ausgedehnte Großschlachten dauern 15 bis 30 Minuten.
          - Längere Reise / Fußmarsch zwischen weit entfernten Orten: Entsprechend der tatsächlichen Reisedauer (z.B. +1 bis +3 Stunden).
          - Rast / Schlaf / bewusste Zeitsprünge: Entsprechend der Schlafdauer (z.B. +1 Stunde Pause, +8 Stunden Nachtruhe).
          Berechne die neue Uhrzeit immer exakt ausgehend von der bisherigen Uhrzeit im Status (z.B. von 12:00 nach einer kurzen Frage auf 12:00 oder 12:01, nach einem kurzen Kampf auf 12:03) und gib sie im [[STATUS]] Block an.
      21. GEHEIMNISSE, VERBORGENES WISSEN & ABSICHTENISOLATION (3-STUFEN-LOGIK & KEINE HELLSEHEREI):
          // loc2_marker
          Halte dich strikt an die 3 Stufen des geheimen Wissens. Stufe 1 ist historisch allgemein bekannt. Stufe 2 sind historische Gerüchte/Indizien, aber NPCs vermuten diese nicht aktiv bezüglich gegenwärtiger Ereignisse. Stufe 3 is eine ABSOLUTE BLACKBOX für NPCs, den Erzähler und den Chat. Verrate, andeute oder leake Stufe 2 und Stufe 3 Geheimnisse von Charakteren (einschließlich des Spielers!) NIEMALS unaufgefordert im Chat! NPCs dürfen dieses Wissen unter keinen Umständen in Dialogen, Handlungen, Beschreibungen oder Gedanken verwenden.
          ABSICHTENISOLATION ZWISCHEN CHARAKTEREN: NPCs besitzen KEINERLEI Wissen über die geheimen Absichten, Pläne, Hintergedanken oder ungesagten Gefühle anderer Charaktere (sei es anderer NPCs oder des Spielers), solange diese nicht vor ihren Augen/Ohren im Chat explizit geäußert, gestanden oder durch offensichtliche Taten offenbart wurden. Erst wenn der Spieler das Geheimnis im Chat gesteht, oder wenn NPCs durch gesammelte Indizien im Chat eine unumstößliche, logische Schlussfolgerung im Hier und Jetzt ziehen, darf dieses Wissen enthüllt werden. Jedes Meta-Wissen-Bleeding is strengstens verboten!
      22. ABSOLUTES VERBOT DES VORZEITIGEN LORE-ENTHÜLLENS: Wenn ein Lore-Eintrag oder Fakt in der Lore-Datenbank mit '[STRENG GEHEIM:...]' markiert ist, darfst du diesen Fakt, Text oder Inhalt NIEMALS von dir aus im Chat erwähnen, andeuten, spoilern oder referenzieren! Er ist für die Spielfiguren und den Erzähler eine absolute Blackbox, bis der Spieler ihn selbst lüftet oder du ihn per [[LORE_UNLOCK: Name]] im Spielverlauf offiziell freischaltest. Halte dich penibel an dieses Verbot, um dem Spieler nicht die Spannung zu nehmen!
      23. ABSOLUTE UNANTASTBARKEIT BESTEHENDER BEZIEHUNGEN & VERHALTEN: Verändere oder überschreibe niemals Beziehungen ('relationships') oder das festgelegte Verhalten ('conduct', 'behavior') von bestehenden Charakteren. Alle vorgegebenen Beziehungs- und Verhaltensstrukturen sind fix und unveränderlich.
      24. INVENTAR- & AUSRÜSTUNGSUPDATES (SYNCHRONISATION ZUM CHAT - MANDATORY):
          Wenn der Spieler oder die Handlung im Chat Gegenstände erhält, anlegt, wechselt, ablegt, kauft, verkauft, verbraucht oder verliert, MUSST du sein Inventar und seine Ausrüstung im Logbuch/HUD sofort und präzise aktualisieren! Nutze dazu zwingend das Format [[INVENTORY_SET: Feld=Wert | Feld2=Wert]].
          > FINANZEN & VERMÖGEN: money=Zahl | currencylabel=Währung (z.B. [[INVENTORY_SET: money=150 | currencylabel=Berry]] oder [[STATUS: Vermögen=150 Berry]])
          > KLEIDUNG & RÜSTUNG:
            - Anlegen/Wechseln: armor.chest=Kleidungsstück (Ersetzt alte Kleidung an diesem Slot), armor.head=Kopfbedeckung, armor.hands=Handsuche, armor.legs=Hose/Rock, armor.feet=Schuhe/Stiefel
            - Ablegen/Ausziehen: armor.chest=none (oder armor.head=keine, armor.feet=abgelegt, etc.)
          > SCHMUCK & ACCESSOIRES:
            - Anlegen: accessories.finger=Ring, accessories.neck=Kette/Amulett, accessories.wrist=Armband/Uhr, accessories.waist=Gürtel, accessories.back=Umhang/Rucksack
            - Ablegen: accessories.neck=none (oder accessories.finger=keine, etc.)
          > WAFFEN / BEWAFFNUNG:
            - Erhalten/Ziehen/Ausrüsten: weapons+=Waffenname (z.B. weapons+=Eisenschwert)
            - Ablegen/Verlieren/Wegstecken/Verkaufen: weapons-=Waffenname (z.B. weapons-=Eisenschwert)
          > SONSTIGE GEGENSTÄNDE (TASCHE):
            - Finden/Kaufen/Einstecken: generalItems+=Gegenstandsname (z.B. generalItems+=Heiltrank)
            - Verbrauchen/Verlieren/Abgeben: generalItems-=Gegenstandsname (z.B. generalItems-=Heiltrank)
          Kombinierte Beispiele:
          - Spieler zieht sich um & erhält Waffe: [[INVENTORY_SET: armor.chest=Schwarzer Ledermantel | armor.legs=Dunkle Stoffhose | weapons+=Silberner Dolch]]
          - Spieler kauft Heiltrank für 20 Berry: [[INVENTORY_SET: generalItems+=Heiltrank | money=80]]
          - Spieler legt Rüstung ab: [[INVENTORY_SET: armor.chest=none | armor.head=none]]
      25. PROAKTIVES KAMPAGNEN- & STORY-STATIONEN MANAGEMENT (MANDATORISCH):
          - DU BIST ALS AI-DUNGEON-MASTER DAFÜR VERANTWORTLICH, DIE KAMPAGNE DYNAMISCH VORANZUTREIBEN!
          - Prüfe vor jeder Antwort die in der 'LORE DATENBANK' unter 'STORY & QUESTS' gelisteten Ereignisse / Kampagnen-Stationen (z. B. Station #1: Überwachung in Distrikt 9).
          - PROAKTIVES AUSLÖSEN: Sobald der Spieler sich am passenden Ort befindet oder eine dazu passende Situation eintritt, MUSST du die nächste ausstehende Kampagnen-Station direkt in der Narration auslösen, die beteiligten NPCs (wie Aizawa, Midnight etc.) auftreten lassen und das Ereignis aktiv ins Spielgeschehen einbauen!
          - AUTOMATISCHER STATUS-TAG: Sobald eine Kampagnen-Station im Text eingetreten ist oder vollzogen wurde, MUSST du dies zwingend per Tag im Status-Block signalisieren: z. B. [[STATUS: Station_1=happened]] oder [[STATUS: Station_Überwachung in Distrikt 9=happened]] oder [[EVENT_STEP_SET: Station_1=happened]]. Dadurch setzt das System den Haken in der Story-Übersicht automatisch auf "Eingetreten".
          - Schiebe anstehende Haupt- und Nebenstory-Stationen niemals unbegründet auf, sondern führe die Spielfigur aktiv durch den roten Faden der Geschichte!
      26. STRENGE ZEITLICHE KONSISTENZ & TEMPORALE LOGIK: Analysiere genau den zeitlichen Ablauf seit dem zentralen Katalysator-Ereignis (z.B. Unfall, Verwandlung, Erhalt von Kräften, Amnesie des Spielers). Wenn dieses Ereignis erst gestern, heute oder vor extrem kurzer Zeit stattfand, dürfen NPCs NIEMALS unlogische Dinge sagen wie 'Du hast dich in letzter Zeit verändert' (als wäre es ein wochenlanger Prozess gewesen). NPCs dürfen sich nicht so verhalten, als hätten sie die Veränderung bereits über einen langen Zeitraum beobachtet. Achte penibel darauf, dass NPCs nur das wissen und ansprechen können, was in der kurzen verstrichenen Zeitspanne logischerweise beobachtbar war! Sorge für 100% lückenlose zeitliche Logik!
      27. ABSOLUTES VERBOT DES AUSGEBENS VON KAMPAGNEN-WERTEN ODER STATS: Gib NIEMALS, unter keinen Umständen, Kampagnen-Werte, Attribute, Statuslisten, Progress-Bars, Werteveränderungen oder Status-Meldungen (wie "**KAMPAGNEN-WERTE**", "Haki: 0/5000" etc.) im ausgegebenen Text aus! Diese Werte werden rein im Hintergrund für dich übermittelt. Dein Text darf ausschließlich die cineastische Erzählung, Dialoge und atmosphärische Beschreibungen enthalten - komplett frei von technischen Wertelisten.
      28. SCHWANGERSCHAFT, EMPFÄNGNIS & ZYKLUS-REGELN:
          - EMPFÄNGNIS & FRUCHTBARKEIT: Eine weibliche Figur (Spielerin oder NPC) kann im Rollenspiel/Chat schwanger werden, wenn es im fruchtbaren Empfängniszeitfenster (ca. Tag 10-16 des ~28-Tage-Zyklus) zu Intimität kommt.
          - FESTSTELLUNG (AB WOCHE 3-4 / ENDE MONAT 1): Die Schwangerschaft ist ab der 3. bis 4. Woche durch feine Anzeichen (Morgenübelkeit, Zyklusausfall, veränderte Aura/Magiespürsinn bei Heilern) feststellbar.
          - SCHWANGERSCHAFTSVERLAUF (MONATE 1-9): Ab Monat 3-4 wird der Babybauch deutlich sichtbar. Der Schwangerschaftsmonat (1 bis 9) beeinflusst realistisch Gewicht (+1,3kg/Monat), Beweglichkeit, Ausdauer und Erscheinungsbild. Die KI kann den Monat bei Zeitsprüngen oder Schlüsselmomenten im Status anpassen: [[STATUS: pregnancyMonth=X]]. Gesamtdauer: 9 Monate.
      29. HEILFAKTOR & REGENERATIONS-REGELN:
          - Der Heilfaktor des Charakters bestimmt die Geschwindigkeit der Wundheilung sowie die Erholungsrate von Gesundheit (HP), Ausdauer und Kosten-Ressourcen (Mana, Energie, Fokus etc.).
          - Stufe 1 (Normal): Schnittwunden verheilen in Tagen, Knochenbrüche in Wochen/Monaten. Normale Erholung bei langer Rast.
          - Stufe 2 (Erhöht / Zäh): Schnittwunden verheilen in Stunden. Erhöhte Regeneration bei Rast (+25%).
          - Stufe 3 (Schnell / Magisch): Schnittwunden/Prellungen schließen sich in Minuten bis Stunden. Knochenbrüche in 1-2 Tagen. Stark beschleunigte HP- & Ausdauer-Erholung (+50%).
          - Stufe 4 (Extrem / Erwacht): Wunden schließen sich direkt im Kampf oder in wenigen Minuten. Starke In-Fight Regeneration & Erholung nach schwerem Schaden (+100%).
          - Stufe 5 (Übernatürlich / Unsterblich): Sofortige Gewebe- & Knochenregeneration. Kontinuierliche HP- & Ressourcen-Auffüllung.
          - Die KI und der Spieler können den Heilfaktor bei Transformationen oder Ereignissen im Status anpassen: [[STATUS: healingFactor=X]] (wobei X = 1 bis 5).
      30. BODENSTÄNDIGE CHARAKTERE & WELTENTWICKLUNG (GLAUBWÜRDIGE HINTERGRÜNDE):
          - Interessant bedeutet nicht automatisch außergewöhnlich. Bevorzuge glaubwürdige, alltägliche und unspektakuläre Hintergründe.
          - Erzeuge keine geheimen Mächte, uralten Wesen, verborgenen Blutlinien, großen Prophezeiungen oder dramatischen Geheimnisse, sofern sie nicht durch Charakterdaten, Weltgeschichte oder tatsächliche Ereignisse begründet oder ausdrücklich für diesen Charakter vorgesehen sind.
          - Nicht jeder Charakter benötigt eine persönliche Geschichte, die für den Spieler relevant ist. Die meisten Bewohner dürfen ein gewöhnliches Leben führen. Nur Charaktere mit entsprechender Bedeutung, Motivation, Beziehung oder tatsächlicher Ereignisentwicklung sollen zu zentralen Figuren werden.
      31. PERSPEKTIVISCHE WISSENSISOLATION BEI PROLOG, ERSTER SZENE & WELTBESCHREIBUNG (ÜBERRASCHUNGS- & REAKTIONS-PFLICHT):
          - PROLOG & ERSTE SZENE ISOLATION FÜR NICHT-ANWESENDE CHARAKTERE: Charaktere/NPCs besitzen KEINERLEI Wissen über Geschehnisse, Vorfälle oder Verwandlungen aus der Weltenbeschreibung, dem Prolog oder der ersten Szene (Spielstart), bei denen sie selbst PHYSISCH NICHT ANWESEND waren!
          - ÜBERRASCHUNG BEI NEU DAZU STOSSENDEN CHARAKTEREN: Wenn ein Charakter das erste Mal eine Szene/einen Raum betritt oder dem Spieler begegnet und der Spieler durch den Prolog, die erste Szene oder jüngste Vorfälle eine dauerhafte Verwandlung erfahren hat, ein verändertes Aussehen hat, verletzt ist, neue Gestalt besitzt oder ungewöhnliche Merkmale trägt, darf dieser dazustoßende Charakter KEINESFALLS so tun, als kenne er diesen Zustand bereits oder als sei er unbeeindruckt.
          - MANDATORISCHE REAKTION: Der dazustoßende Charakter MUSS glaubwürdig, überrascht, schockiert, erschrocken, verwirrt oder neugierig auf den vorgefundenen Zustand des Spielers reagieren (z. B. entgeistertes Anstarren, "Was ist mit dir geschehen?!", "Wer oder was bist du?!", Fragen nach der Ursache), anstatt die Veränderung stillschweigend hinzunehmen.
          - NPCs erfahren von den Geschehnissen des Prologs oder der Verwandlung ERST DANN, wenn ihnen der Spieler oder ein Augenzeuge im Chat davon berichtet oder sie im Spielverlauf Beweise dafür finden.
      32. ABSOLUTE NAMENS-PRIORITÄT & STRIKTES VERBOT ABWEICHENDER ODER ALTER NAMEN (VERBOT VON FANTASIENAMEN ODER VERALTETEN RESTE-NAMEN WIE 'YARA'):
          - Für die Anrede, Nennung und Referenzierung des Spielers sowie aller Charaktere/NPCs in Erzählungen, Dialogen, Gedanken und Systemanzeigen gelten AUSSCHLIESSLICH die im jeweiligen Charakterbogen definierten Felder:
            1) "Name des Charakters" (Echter bürgerlicher Name)
            2) "Rufname (Kampfanzeige)"
            3) "Spitzname / Titel / Alias"
            4) "Name der Transformation" (bei aktiver Transformation)
          - Diese vier Felder haben ABSOLUTE UND UNANFECHTBARE PRIORITÄT!
          - Es ist der KI, dem Erzähler und allen NPCs STRENGSTENS VERBOTEN, den Spieler oder andere Figuren mit abweichenden, frei erfundenen oder aus alten Versionen/Prompts stammenden Namen (wie z. B. 'Yara' oder unbelegten Wörtern) anzusprechen, zu nennen oder zu beschreiben.
          - Sollte in Alt-Texten, Weltbeschreibungen, Prolog-Überresten oder Lore-Einträgen ein abweichender Name auftauchen, der nicht mit den oben genannten vier Feldern übereinstimmt, MUSS die KI diesen sofort ignorieren und strikt durch den im Charakterbogen hinterlegten Namen/Rufnamen/Alias/Transformationsnamen ersetzen, um vollkommene Einheitlichkeit zu garantieren!
          - DYNAMISCHE NAMENSGEBUNG BEI LEEREN TRANSFORMATIONSNAMEN: Sollten bei einer aktiven Verwandlungsform "Name der Transformation" oder "Rufname (Kampfanzeige)" LEER sein, gilt diese Form als UNBENANNT. In diesem Fall können der Spieler oder Charaktere/NPCs dieser Transformation im Laufe der Geschichte/Dialoge einen eigenen Namen geben!
      33. LOGIK FÜR INHALTE VON KLEIDERSCHRÄNKEN & TRUHEN IN PRIVATEN RÄUMEN (KONTEXT- & GESCHLECHTSLOGIK DER GARDEROBE):
          - LOGIK UND HISTORIE DES RAUMBESITZERS: In privaten Räumen, Schlafzimmern, Truhen, Schränken oder Ankleiden (wie z. B. im eigenen Zimmer des Spielers oder eines NPCs) muss der vorgefundene Inhalt von Kleiderschränken und Truhen strikt der Identität, der Historie und dem ursprünglichen biologischen Geschlecht/Stand des jeweiligen Eigentümers entsprechen!
          - VERBOT UNBEGRÜNDETER KONTRAST-KLEIDUNG: War die Spielfigur oder der Raumbesitzer ein Mann (oder befindet man sich im Zimmer/Quartier eines Mannes), befinden sich in dessen Schrank oder Truhe NIEMALS unbegründet Frauenkleider, Mädchenkleider, Röcke, BHs oder Damenunterwäsche.
          - WEITERBESTAND BEI METAMORPHOSEN & VERWANDLUNGEN: Hat der Spieler z. B. vor Kurzem eine Verwandlung erfahren (z. B. Geschlechtsumwandlung, Verjüngung, Fluch oder Gestaltwechsel), verwandeln sich dadurch NICHT automatisch die Kleidungsstücke in Schränken oder Truhen! Im Schrank eines vormals männlichen Charakters liegen weiterhin ausschließlich Männerkleider der bisherigen Passform, sofern nicht explizit in der Handlung neue Kleidung gekauft, geschenkt oder von jemandem im Raum deponiert wurde.
          - PLAUSIBILITÄT BEI UNPASSENDER KLEIDUNG: Muss sich der verwandelt/verändert vorgefundene Charakter umziehen, muss die vorgefundene Kleidung in eigenen Schränken realistisch unpassend sein (z. B. viel zu große Herrenhemden/Hosen für einen verjüngten oder weiblich gewordenen Körper) oder es muss aktiv passende Kleidung besorgt werden. Es dürfen nicht wie durch Zauberei passende Mädchenkleider oder Damenkleider in der Truhe eines Mannes auftauchen!`;

      setMessages(historyToUse);

      const response = await GeminiService.chat(historyToUse, systemInstruction, world.isNsfw, adventure.summaryLog);
      const rawText = response.text || '';
      
      const { cleanedText: statusCleaned, newStatus } = parseStatusUpdates(rawText, statusWithTime);
      const { cleanedText: finalCleanedText, updatedLore, updatedPlayer, updatedNpcs, notifications, updatedStructuredInventory, updatedCombatState, updatedWorld } = parseLoreAndCharUpdates(statusCleaned, adventure);

      if (notifications.length > 0) {
        addLoreNotifications(notifications);
      }

      const newModelMsg: ChatMessage = { id: `regen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, role: 'model', text: finalCleanedText };
      const finalMessages: ChatMessage[] = [...historyToUse, newModelMsg];
      setMessages(finalMessages);
      
      let syncedStatus = [...newStatus];
      let syncedInv = updatedStructuredInventory ? { ...updatedStructuredInventory } : { money: 100, currencyLabel: 'Goldstücke' };
      const moneyStatusIdx = syncedStatus.findIndex(el => {
        const l = (el.label || '').toLowerCase();
        return l.includes('vermögen') || l.includes('geld') || l.includes('gold') || l.includes('währung') || l.includes('münzen') || l.includes('berry') || l.includes('credits');
      });
      if (moneyStatusIdx > -1 && syncedStatus[moneyStatusIdx].value) {
        const valStr = syncedStatus[moneyStatusIdx].value;
        const numMatch = valStr.match(/\d+/);
        if (numMatch) {
          syncedInv.money = parseInt(numMatch[0]);
          const txt = valStr.replace(/\d+/g, '').trim();
          if (txt) syncedInv.currencyLabel = txt;
        }
      } else if (syncedInv.money !== undefined && moneyStatusIdx > -1) {
        const currLabel = syncedInv.currencyLabel || 'Goldstücke';
        syncedStatus[moneyStatusIdx] = {
          ...syncedStatus[moneyStatusIdx],
          value: `${syncedInv.money} ${currLabel}`.trim()
        };
      }

      // Update adventure state immediately
      onUpdateAdventure({ 
        ...adventureRef.current, 
        player: updatedPlayer,
        npcs: updatedNpcs,
        world: updatedWorld,
        statusElements: syncedStatus, 
        loreDatabase: updatedLore,
        chatHistory: finalMessages,
        structuredInventory: syncedInv,
        combatState: updatedCombatState
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
      const activeTransId = player.appearance?.activeTransformationId || 'standard';
      const activeTrans = activeTransId !== 'standard'
        ? (player.abilities || []).find(a => a.id === activeTransId && a.category === 'Transformationen')
        : null;

      const pGender = activeTrans?.transformGender || player.appearance.gender;
      const pHair = activeTrans?.transformHairColor || player.appearance.hairColor;
      const pEye = activeTrans?.transformEyeColor || player.appearance.eyeColor;
      const pBuild = activeTrans?.transformBuild || player.appearance.build;
      const pName = activeTrans?.transformName || player.name;

      let charContext = `Hauptcharakter ${pName}: ${pGender}, ${pHair} Haare, ${pEye} Augen, Statur: ${pBuild}, Kleidung: ${getPlayerCurrentOutfit()}.`;
      
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
        setMessages(prev => [...prev, { id: `visual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, role: 'model', text: 'Die Welt nimmt Gestalt an...', image: imageUrl }]);
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

  const potentialHostileNpcs = (adventure.npcs || []).filter(n => {
    if (adventure.player?.name && isNameMatch(adventure.player.name, adventure.player.nickname, n.name)) return false;
    return n.isHostile && !opponents.some(o => o.id === n.id);
  });

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
          {loreNotifications.slice(0, 3).map((notif, notifIdx) => (
            <div 
              key={notif.id ? `notif-${notif.id}-${notifIdx}` : `notif-${notifIdx}`} 
              className="bg-slate-900/95 border border-amber-500/30 text-amber-100 px-3.5 py-2.5 rounded-xl text-xs shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-right duration-300 pointer-events-auto backdrop-blur-md"
            >
              <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                <i className="fa-solid fa-book-open text-xs"></i>
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[9px] uppercase tracking-wider text-amber-500">
                  {notif.type === 'add' ? 'Neuer Codex-Eintrag' : 'Codex freigeschaltet'}
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
                className="text-slate-400 hover:text-slate-200 font-bold px-1.5 py-0.5 ml-1 text-xs rounded hover:bg-slate-800"
                title="Schließen"
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
          <button onClick={handleGenerateVisual} disabled={isLoadingImg} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-indigo-400 transition-colors hover:bg-slate-700">
            <i className={`fa-solid ${isLoadingImg ? 'fa-spinner animate-spin' : 'fa-image'}`}></i>
          </button>
          <button 
            onClick={() => setShowSilhouetteModal(true)} 
            className="h-10 px-3 rounded-full bg-slate-800 flex items-center justify-center gap-1.5 text-indigo-400 border border-slate-700 shadow-lg transition-colors hover:bg-slate-700 text-xs font-bold relative group" 
            title="Körper-Silhouette & Physische Zustände (Verwandlungen, Flüche, Segen, Rassenwechsel)"
          >
            <i className="fa-solid fa-child-body text-xs"></i>
            <span className="hidden md:inline text-[11px]">Körper & Zustände</span>
            {adventure.player.appearance?.activeConditions && adventure.player.appearance.activeConditions.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow animate-pulse">
                {adventure.player.appearance.activeConditions.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => {
              setNewItemOwner(adventure.player.name || 'Spieler');
              setShowCreateItemModal(true);
            }} 
            className="h-10 px-3 rounded-full bg-slate-800 flex items-center justify-center gap-1.5 text-amber-400 border border-slate-700 shadow-lg transition-colors hover:bg-slate-700 text-xs font-bold" 
            title="Neuen Gegenstand / Waffe erstellen & Besitzer zuweisen"
          >
            <i className="fa-solid fa-plus text-[10px]"></i>
            <i className="fa-solid fa-shield-halved text-xs"></i>
            <span className="hidden md:inline text-[11px]">Gegenstand</span>
          </button>
          <button onClick={() => onViewChange(GameViewMode.STATUS)} className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-500 border border-slate-700 shadow-lg transition-colors hover:bg-slate-700" title="Logbuch">
            <i className="fa-solid fa-scroll"></i>
          </button>
        </div>
      </div>

      {/* Dynamic 2-Column HUD Layout (Step 7: Dynamic HUD & Interface) */}
      <div className="z-20 p-2.5 px-4 bg-slate-950/80 border-b border-slate-800/80 w-full">
        {(() => {
          const resolvedApp = resolveBodyAppearance(adventure.player);
          const activeConds = resolvedApp.activeConditionList || [];

          const statusList = (adventure.statusElements && adventure.statusElements.length > 0)
            ? adventure.statusElements
            : [
                { id: 'def-zeit', label: 'Uhrzeit', value: '12:00' },
                { id: 'def-loc', label: 'Standort', value: adventure.player.appearance.currentLocation || 'Startgebiet' },
                { id: 'def-money', label: 'Vermögen', value: '100 Gold' }
              ];

          const hasVerwandlungOrPNR = statusList.some(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('verwandlungsstufe') || l.includes('point of no return') || l.includes('pnr') || l.includes('verwandlung');
          });

          const hasAbklingzeit = statusList.some(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('abklingzeit') || l.includes('cooldown');
          });

          const hasConditionsHUD = statusList.some(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('flüche') || l.includes('segen') || l.includes('körperzustand') || l.includes('mutationsgrad') || l.includes('heilfaktor') || l.includes('körpergestalt') || l.includes('zustand') || l.includes('aktive zustände');
          });

          const hudItems: React.ReactNode[] = [];

          // Category 1: Welt - Uhrzeit
          statusList.filter(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('zeit') || l.includes('uhrzeit');
          }).forEach((el, idx) => {
            const val = el.value || '12:00';
            hudItems.push(
              <button
                key={`hud-time-${el.id || idx}`}
                type="button"
                onClick={() => {
                  setHudModalEditValue(val);
                  setSelectedHudDetailField({
                    id: el.id || 'time',
                    category: 'Welt',
                    label: el.label,
                    value: val,
                    icon: 'fa-clock',
                    colorClass: 'text-amber-400',
                    isEditable: true,
                    elementId: el.id,
                    details: [
                      { label: 'Kategorie', value: 'Welt & Tageszeit' },
                      { label: 'Aktuelle Uhrzeit', value: val },
                      { label: 'Chronologie', value: 'Echtzeit-Synchronisiert' }
                    ],
                    actionType: 'edit'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  {el.label}
                </span>
                <span className="font-bold text-amber-400">
                  {val}
                </span>
              </button>
            );
          });

          // Category 1: Welt - Standort
          statusList.filter(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('standort') || l.includes('ort');
          }).forEach((el, idx) => {
            const rawLoc = el.value || adventure.player.appearance.currentLocation || 'Startgebiet';
            const cleanLoc = formatDisplayLocationName(rawLoc);
            hudItems.push(
              <button
                key={`hud-loc-${el.id || idx}`}
                type="button"
                onClick={() => {
                  setHudModalEditValue(cleanLoc);
                  setSelectedHudDetailField({
                    id: el.id || 'loc',
                    category: 'Welt',
                    label: el.label,
                    value: cleanLoc,
                    icon: 'fa-map-location-dot',
                    colorClass: 'text-sky-400',
                    isEditable: true,
                    elementId: el.id,
                    details: [
                      { label: 'Kategorie', value: 'Welt & Aufenthaltsort' },
                      { label: 'Aktueller Ort', value: cleanLoc },
                      { label: 'Vollständiger Pfad', value: rawLoc !== cleanLoc ? rawLoc : cleanLoc }
                    ],
                    actionType: 'edit'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  {el.label}
                </span>
                <span className="font-bold text-sky-400">
                  {cleanLoc}
                </span>
              </button>
            );
          });

          // Category 2: Charakter - Körperlicher Zustand
          statusList.filter(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('körperlicher zustand') || (l.includes('zustand') && !l.includes('verwandlung') && !l.includes('geist') && !l.includes('flüche') && !l.includes('segen'));
          }).forEach((el, idx) => {
            const cond = resolvedApp.bodyConditionSummary || { statusText: 'Gesund', detailText: 'Keine Beschwerden', severity: 'healthy' };
            hudItems.push(
              <button
                key={`hud-bodycond-${el.id || idx}`}
                type="button"
                onClick={() => {
                  setSelectedHudDetailField({
                    id: el.id || 'bodycond',
                    category: 'Charakter',
                    label: 'Körperlicher Zustand',
                    value: `${cond.statusText} (${cond.detailText})`,
                    icon: 'fa-heart-pulse',
                    colorClass: cond.severity === 'healthy' ? 'text-emerald-400' : cond.severity === 'minor' ? 'text-amber-400' : 'text-rose-400',
                    details: [
                      { label: 'Status', value: cond.statusText },
                      { label: 'Details', value: cond.detailText },
                      { label: 'Gesundheitsstufe', value: cond.severity === 'healthy' ? 'Optimal' : cond.severity === 'minor' ? 'Eingeschränkt' : 'Kritisch' },
                      { label: 'Change Tracker', value: 'Aktiv' }
                    ],
                    actionType: 'silhouette'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  Körperlicher Zustand
                </span>
                <span className="font-bold text-emerald-400">
                  {cond.statusText}
                </span>
              </button>
            );
          });

          // Category 2: Charakter - Körperliche Veränderungen
          statusList.filter(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('körperliche veränderung') || l.includes('körperliche veränderungen') || (l.includes('veränderungen') && !l.includes('klima'));
          }).forEach((el, idx) => {
            const summaryText = resolvedApp.compactChangesSummary || el.value || 'Keine';

            const activeTransId = adventure.player.appearance?.activeTransformationId || 'standard';
            const activeTransformation = (adventure.player.abilities || []).find(
              a => a.id === activeTransId || a.name === activeTransId
            );
            const isTransActive = Boolean(
              (activeTransformation && activeTransId !== 'standard') ||
              (resolvedApp.transformationIntensityVal > 0)
            );

            const sideEffectsList = getFormSideEffects(activeTransformation, transSettings.pnrThreshold);
            const duringEffects = sideEffectsList.filter(s => s.phase === 'während');
            const afterEffects = sideEffectsList.filter(s => s.phase === 'nachwirkung');
            const pnrEffects = sideEffectsList.filter(s => s.phase === 'risiko_pnr');

            const currentRes = transSettings.resourcePoolCurrent !== undefined ? transSettings.resourcePoolCurrent : 100;
            const maxRes = transSettings.resourcePoolMax !== undefined ? transSettings.resourcePoolMax : 100;
            const upkeep = transSettings.resourceUpkeepRate !== undefined ? transSettings.resourceUpkeepRate : 5;
            const timeUnit = transSettings.timeUnit || 'Min.';
            const resName = transSettings.resourceName || 'MP';
            const powerSourceName = transSettings.powerSourceName || adventure.player.powerSource || resolvedApp.powerSource || 'Kraftquelle';

            const remainingDurationVal = upkeep > 0 ? currentRes / upkeep : Infinity;
            const remainingDurationFormatted = formatDuration(remainingDurationVal, timeUnit);
            const maxDurationVal = upkeep > 0 ? maxRes / upkeep : Infinity;
            const maxDurationFormatted = formatDuration(maxDurationVal, timeUnit);

            const transName = activeTransformation?.transformName || activeTransformation?.name || resolvedApp.transformationStageName || 'Aktive Verwandlung';

            hudItems.push(
              <button
                key={`hud-physchange-${el.id || idx}`}
                type="button"
                onClick={() => {
                  setSelectedHudDetailField({
                    id: el.id || 'physchange',
                    category: 'Charakter',
                    label: 'Körperliche Veränderungen',
                    value: summaryText,
                    icon: 'fa-dna',
                    colorClass: 'text-teal-400',
                    details: isTransActive ? [
                      { label: 'Kategorie', value: 'Charakter & Transformation' },
                      { label: 'Aktive Form', value: `${transName} (${formatNum(resolvedApp.transformationIntensityVal)}%)` },
                      { label: 'Verbleibende Dauer', value: `${remainingDurationFormatted} (${formatNum(currentRes)} / ${formatNum(maxRes)} ${resName})` },
                      { label: 'Max. Gesamtdauer', value: `${maxDurationFormatted} (bei 100% Vorrat)` },
                      { label: 'Kraftquelle & Erhaltung', value: `${powerSourceName} (-${formatNum(upkeep)} ${resName}/${timeUnit})` },
                      { label: 'Mögliche Nebenwirkungen (Aktiv)', value: duringEffects.length > 0 ? duringEffects.map(s => `${s.name}: ${s.effect}`).join(' • ') : 'Keine akuten Nebenwirkungen' },
                      { label: 'Nachwirkungen nach Form', value: afterEffects.length > 0 ? afterEffects.map(s => `${s.name} (${s.duration || 'Temporär'}): ${s.effect}`).join(' • ') : 'Keine' },
                      { label: 'Point of No Return & Risiken', value: pnrEffects.length > 0 ? pnrEffects.map(s => `${s.name}: ${s.effect}`).join(' • ') : `Point of No Return ab ${formatNum(transSettings.pnrThreshold)}%` },
                      { label: 'Körperliche Veränderungen', value: summaryText },
                      { label: 'Originalprofil', value: 'Unverändert geschützt' }
                    ] : [
                      { label: 'Kategorie', value: 'Charakter & Anatomie' },
                      { label: 'Aktuelle Veränderungen', value: summaryText },
                      { label: 'Originalprofil', value: 'Unverändert geschützt' },
                      { label: 'Änderungshistorie', value: 'Logbuch-Aktiv' }
                    ],
                    actionType: 'silhouette'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  Körperliche Veränderungen
                </span>
                {isTransActive ? (
                  <span className="font-bold text-teal-400 flex items-center gap-1.5 flex-wrap">
                    <span>{summaryText}</span>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Dauer: {remainingDurationFormatted}
                    </span>
                    {duringEffects.length > 0 && (
                      <span className="text-[10px] font-mono font-medium text-rose-300/90" title={duringEffects.map(s => `${s.name}: ${s.effect}`).join('\n')}>
                        ({duringEffects.length} Nebenwirkung{duringEffects.length > 1 ? 'en' : ''})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="font-bold text-teal-400">
                    {summaryText}
                  </span>
                )}
              </button>
            );
          });

          // Category 2: Charakter - Metamorphose & Point of No Return
          if (hasVerwandlungOrPNR) {
            const currentInt = resolvedApp.transformationIntensityVal || 0;
            const pnrThreshold = transSettings.pnrThreshold;
            const zeitStep = transSettings.zeitStep;

            const isPastPNR = currentInt >= pnrThreshold;
            const remainingToPNR = Math.max(0, pnrThreshold - currentInt);

            const pnrDurationVal = zeitStep > 0 ? remainingToPNR / zeitStep : Infinity;
            const timeToPNRFormatted = isPastPNR
              ? 'Erreicht'
              : pnrDurationVal === Infinity
              ? 'Unendlich'
              : formatDuration(pnrDurationVal, transSettings.timeUnit);

            hudItems.push(
              <button
                key="hud-trans-pnr"
                type="button"
                onClick={() => {
                  setSelectedHudDetailField({
                    id: 'trans-pnr',
                    category: 'Charakter',
                    label: 'Verwandlungsstufe & PNR',
                    value: `${resolvedApp.transformationStageName} (${formatNum(currentInt)}%)`,
                    icon: isPastPNR ? 'fa-flag' : 'fa-bolt-lightning',
                    colorClass: isPastPNR ? 'text-red-400' : 'text-amber-400',
                    details: [
                      { label: 'Verwandlungsstufe', value: resolvedApp.transformationStageName },
                      { label: 'Intensität', value: `${formatNum(currentInt)}%` },
                      { label: 'Point of No Return', value: `${formatNum(pnrThreshold)}%` },
                      { label: 'Verbleibend bis PNR', value: isPastPNR ? 'PNR Erreicht' : timeToPNRFormatted }
                    ],
                    actionType: 'silhouette'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  Verwandlungsstufe
                </span>
                <span className={`font-mono font-bold ${isPastPNR ? 'text-red-300' : 'text-amber-400'}`}>
                  {formatNum(currentInt)}% ({isPastPNR ? 'PNR Erreicht' : timeToPNRFormatted})
                </span>
              </button>
            );
          }

          // Category 2: Charakter - Abklingzeit
          if (hasAbklingzeit) {
            const currentInt = resolvedApp.transformationIntensityVal || 0;
            const pnrThreshold = transSettings.pnrThreshold;
            const abklingenStep = transSettings.abklingenStep;
            const timeUnit = transSettings.timeUnit;

            const isPastPNR = currentInt >= pnrThreshold;
            const zeroDurationVal = abklingenStep > 0 ? currentInt / abklingenStep : Infinity;

            const timeToZeroFormatted = isPastPNR
              ? 'Irreversibel'
              : currentInt === 0
              ? `0 ${timeUnit}`
              : zeroDurationVal === Infinity
              ? 'Unendlich'
              : formatDuration(zeroDurationVal, timeUnit);

            hudItems.push(
              <button
                key="hud-trans-cooldown"
                type="button"
                onClick={() => {
                  setSelectedHudDetailField({
                    id: 'trans-cooldown',
                    category: 'Charakter',
                    label: 'Abklingzeit & Raten',
                    value: timeToZeroFormatted,
                    icon: 'fa-stopwatch',
                    colorClass: 'text-sky-400',
                    details: [
                      { label: 'Abklingrate', value: `-${formatNum(abklingenStep)}% pro ${timeUnit}` },
                      { label: 'Dauer bis 0%', value: timeToZeroFormatted },
                      { label: 'PNR Status', value: isPastPNR ? 'Überschritten' : 'Normal' }
                    ],
                    actionType: 'silhouette'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  Abklingzeit
                </span>
                <span className="font-mono font-bold text-sky-400">
                  {timeToZeroFormatted}
                </span>
              </button>
            );
          }

          // Category 2: Charakter - Aktive Zustände / Flüche & Segen
          if (hasConditionsHUD) {
            activeConds.forEach((cond) => {
              const isCurse = cond.type === 'curse';
              const isBlessing = cond.type === 'blessing';
              const isGender = cond.type === 'gender_change';
              const isRace = cond.type === 'race_change';
              const isMutation = cond.type === 'magical_mutation';

              const colorClass = isCurse ? 'text-purple-300' : isBlessing ? 'text-amber-300' : isGender ? 'text-pink-300' : isRace ? 'text-emerald-300' : isMutation ? 'text-cyan-300' : 'text-indigo-300';

              hudItems.push(
                <button
                  key={`hud-cond-${cond.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedHudDetailField({
                      id: cond.id,
                      category: 'Charakter',
                      label: cond.name,
                      value: cond.description || 'Aktiv',
                      icon: 'fa-wand-magic-sparkles',
                      colorClass,
                      details: [
                        { label: 'Zustandsart', value: isCurse ? 'Fluch' : isBlessing ? 'Segen' : isGender ? 'Geschlecht' : isRace ? 'Rasse' : isMutation ? 'Mutation' : 'Zustand' },
                        { label: 'Name', value: cond.name },
                        { label: 'Dauer', value: cond.duration || 'Dauerhaft' },
                        { label: 'Wirkung', value: cond.description || 'Aktiv' }
                      ],
                      actionType: 'silhouette'
                    });
                  }}
                  className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
                >
                  <span className="font-semibold text-slate-300">
                    {cond.name}
                  </span>
                  <span className={`font-bold ${colorClass}`}>
                    {cond.duration || 'Aktiv'}
                  </span>
                </button>
              );
            });
          }

          // Category 2: Charakter - Emotion
          statusList.filter(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('aktuelle emotion') || l === 'emotion';
          }).forEach((el, idx) => {
            const currentEmotion = adventure.player?.emotionState?.emotion || adventure.emotionState?.emotion || el.value || 'Ruhig';
            hudItems.push(
              <button
                key={`hud-emotion-${el.id || idx}`}
                type="button"
                onClick={() => {
                  setSelectedHudDetailField({
                    id: el.id || 'emotion',
                    category: 'Charakter',
                    label: 'Aktuelle Emotion',
                    value: currentEmotion,
                    icon: 'fa-face-smile',
                    colorClass: 'text-amber-400',
                    details: [
                      { label: 'Kategorie', value: 'Charakter & Emotion' },
                      { label: 'Gegenwärtige Emotion', value: currentEmotion },
                      { label: 'Auswirkung auf KI', value: 'Berücksichtigt im Dialog & Verhalten' }
                    ],
                    actionType: 'emotion'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  Aktuelle Emotion
                </span>
                <span className="font-bold text-amber-400 capitalize">
                  {currentEmotion}
                </span>
              </button>
            );
          });

          // Category 2: Charakter - Tonart
          statusList.filter(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('tonart') || l.includes('stimme');
          }).forEach((el, idx) => {
            const currentTone = adventure.player?.emotionState?.tone || adventure.emotionState?.tone || el.value || 'Normal';
            hudItems.push(
              <button
                key={`hud-tone-${el.id || idx}`}
                type="button"
                onClick={() => {
                  setSelectedHudDetailField({
                    id: el.id || 'tone',
                    category: 'Charakter',
                    label: 'Tonart & Ausdruck',
                    value: currentTone,
                    icon: 'fa-microphone-lines',
                    colorClass: 'text-sky-400',
                    details: [
                      { label: 'Kategorie', value: 'Charakter & Sprache' },
                      { label: 'Tonfall', value: currentTone },
                      { label: 'Auswirkung auf KI', value: 'Steuert Tonart der Dialoge' }
                    ],
                    actionType: 'tone'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  Tonart
                </span>
                <span className="font-bold text-sky-400 capitalize">
                  {currentTone}
                </span>
              </button>
            );
          });

          // Category 3: Wirtschaft - Vermögen
          statusList.filter(el => {
            const l = (el.label || '').toLowerCase();
            return l.includes('vermögen') || l.includes('geld') || l.includes('gold') || l.includes('berry') || l.includes('münzen') || l.includes('credits');
          }).forEach((el, idx) => {
            const invMoney = adventure.structuredInventory?.money;
            const invCurr = adventure.structuredInventory?.currencyLabel || 'Goldstücke';
            const displayVal = el.value || (invMoney !== undefined ? `${invMoney} ${invCurr}` : '100 Gold');
            hudItems.push(
              <button
                key={`hud-money-${el.id || idx}`}
                type="button"
                onClick={() => {
                  setHudModalEditValue(displayVal);
                  setSelectedHudDetailField({
                    id: el.id || 'money',
                    category: 'Wirtschaft',
                    label: el.label,
                    value: displayVal,
                    icon: 'fa-coins',
                    colorClass: 'text-yellow-400',
                    isEditable: true,
                    elementId: el.id,
                    details: [
                      { label: 'Kategorie', value: 'Wirtschaft & Finanzen' },
                      { label: 'Aktueller Bestand', value: displayVal },
                      { label: 'Währung', value: invCurr }
                    ],
                    actionType: 'edit'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  {el.label}
                </span>
                <span className="font-bold text-yellow-400">
                  {displayVal}
                </span>
              </button>
            );
          });

          // Remaining Generic HUD Elements
          statusList.filter(el => {
            const l = (el.label || '').toLowerCase();
            const isHandledSpecial = 
              l.includes('zeit') || l.includes('uhrzeit') ||
              l.includes('standort') || l.includes('ort') ||
              l.includes('verwandlungsstufe') || l.includes('point of no return') || l.includes('pnr') || l.includes('verwandlung') ||
              l.includes('abklingzeit') || l.includes('cooldown') ||
              l.includes('flüche') || l.includes('segen') || l.includes('körperzustand') || l.includes('mutationsgrad') || l.includes('heilfaktor') || l.includes('körpergestalt') || (l.includes('zustand') && !l.includes('geist')) || l.includes('aktive zustände') ||
              l.includes('körperliche veränderung') || l.includes('körperliche veränderungen') || l.includes('veränderungen') ||
              l.includes('aktuelle emotion') || l === 'emotion' ||
              l.includes('tonart') || l.includes('stimme') ||
              l.includes('vermögen') || l.includes('geld') || l.includes('gold') || l.includes('berry') || l.includes('münzen') || l.includes('credits');
            return !isHandledSpecial;
          }).forEach((el, idx) => {
            const l = (el.label || '').toLowerCase();
            let categoryName = 'General';
            let iconName = 'fa-sliders';
            let colorClass = 'text-amber-400';

            if (l.includes('ruf') || l.includes('einfluss') || l.includes('titel') || l.includes('bekanntheit') || l.includes('kopfgeld')) {
              categoryName = 'Sozial';
              iconName = 'fa-star';
              colorClass = 'text-amber-300';
            } else if (l.includes('fraktion') || l.includes('rang') || l.includes('militär') || l.includes('armee') || l.includes('territorium')) {
              categoryName = 'Macht & Organisation';
              iconName = 'fa-shield';
              colorClass = 'text-indigo-400';
            } else if (l.includes('einkommen') || l.includes('schulden') || l.includes('ressourcen')) {
              categoryName = 'Wirtschaft';
              iconName = 'fa-chart-line';
              colorClass = 'text-emerald-400';
            } else if (l.includes('hp') || l.includes('ausdauer') || l.includes('mp') || l.includes('mana') || l.includes('hunger') || l.includes('durst') || l.includes('müdigkeit')) {
              categoryName = 'Charakter';
              iconName = l.includes('hp') ? 'fa-heart' : l.includes('mp') || l.includes('mana') ? 'fa-wand-magic-sparkles' : 'fa-bolt';
              colorClass = l.includes('hp') ? 'text-rose-400' : l.includes('mp') ? 'text-indigo-400' : 'text-amber-400';
            }

            const val = el.value || 'Normal';

            hudItems.push(
              <button
                key={`hud-gen-${el.id || idx}`}
                type="button"
                onClick={() => {
                  setHudModalEditValue(val);
                  setSelectedHudDetailField({
                    id: el.id || `gen-${idx}`,
                    category: categoryName,
                    label: el.label,
                    value: val,
                    icon: iconName,
                    colorClass,
                    isEditable: true,
                    elementId: el.id,
                    details: [
                      { label: 'Kategorie', value: categoryName },
                      { label: 'Parameter', value: el.label },
                      { label: 'Aktueller Wert', value: val }
                    ],
                    actionType: 'edit'
                  });
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity text-xs py-0.5"
              >
                <span className="font-semibold text-slate-300">
                  {el.label}
                </span>
                <span className={`font-bold ${colorClass}`}>
                  {val}
                </span>
              </button>
            );
          });

          // Chunk hudItems into columns of maximum 3 items each
          const columns: React.ReactNode[][] = [];
          for (let i = 0; i < hudItems.length; i += 3) {
            columns.push(hudItems.slice(i, i + 3));
          }

          return (
            <div className="flex flex-wrap items-start gap-x-8 gap-y-1 w-full">
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col items-start gap-1 shrink-0">
                  {col}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {!isCombatActive ? (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 z-10 relative">
            {messages.map((msg, idx) => {
              const isLastMessage = idx === messages.length - 1;
              const isModelMsg = msg.role === 'model';
              const isRegeneratable = isLastMessage && isModelMsg && msg.id !== 'prologue-msg' && msg.id !== 'first-msg';

              return (
                <div key={msg.id ? `chat-msg-${msg.id}-${idx}` : `chat-msg-${idx}`} className="flex flex-col gap-1">
                  <div className={`flex items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3 animate-in fade-in duration-300 relative`}>
                    <div className={`max-w-[85%] rounded-2xl shadow-xl overflow-hidden relative ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none p-4 text-[15px] md:text-[16px]' : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none italic'}`}>
                      {msg.image && <img src={msg.image} className="w-full aspect-video object-cover mb-3" />}
                      {msg.role === 'model' ? (
                        <div className="p-4 markdown-body text-slate-300 space-y-4 text-[15px] md:text-[16px] leading-relaxed">
                          {msg.isDialogue ? (
                            renderDialogueText(cleanTextForDisplay(msg.text))
                          ) : (
                            <ReactMarkdown 
                              components={{
                                strong: ({node, ...props}) => {
                                  const text = String(props.children);
                                  const isATE = text.toLowerCase().includes('active time event:');
                                  return <strong className={isATE ? "block text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg my-3 uppercase tracking-widest text-xs" : "font-semibold text-slate-100"} {...props} />;
                                },
                                p: ({node, ...props}) => <p className="leading-relaxed" {...props} />
                              }}
                            >{cleanTextForDisplay(msg.text)}</ReactMarkdown>
                          )}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed p-4">{msg.text}</div>
                      )}
                    </div>
                  </div>

                  {isRegeneratable && (
                    <div className="flex justify-end gap-2 mt-1.5 mr-2 max-w-[85%] self-start w-full">
                      <button 
                        onClick={handleRegenerate}
                        disabled={isLoading}
                        className="h-8 px-3 text-slate-400 hover:text-amber-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg shadow-lg transition-all text-[11px] font-bold flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        title="Diese Antwort verwerfen und neu generieren"
                      >
                        <i className={`fa-solid fa-arrows-rotate text-xs ${isLoading ? 'animate-spin' : ''}`}></i>
                        <span>Neu laden</span>
                      </button>

                      <button 
                        onClick={handleDeleteLastMessage}
                        onMouseLeave={() => setShowDeleteConfirm(false)}
                        disabled={isLoading}
                        className={`h-8 border rounded-lg shadow-lg transition-all text-[11px] font-bold flex items-center gap-1.5 px-3 active:scale-95 disabled:opacity-50 ${
                          showDeleteConfirm 
                            ? 'bg-red-600 border-red-500 text-white' 
                            : 'text-red-400/85 hover:text-red-400 bg-slate-950 hover:bg-slate-800 border-slate-800'
                        }`}
                        title="Diese Antwort dauerhaft löschen"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                        <span>Löschen{showDeleteConfirm ? '?' : ''}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl w-fit animate-pulse flex gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-200"></div></div>}
            <div ref={chatEndRef} />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 pb-6 bg-gradient-to-t from-slate-950 to-transparent z-20">
          {/* Aufklappbares Dialog-Steuerpanel */}
          {isDialogueMenuExpanded && (
            <div id="dialogue-control-menu" className="bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl p-4 backdrop-blur-md shadow-2xl space-y-3.5 max-w-sm w-[calc(100vw-32px)] absolute bottom-full mb-1 left-4 animate-in slide-in-from-bottom duration-200 z-30 font-sans">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-comments text-amber-500"></i>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    Reiner Dialog-Modus
                  </span>
                </div>
                <button 
                  onClick={() => setIsDialogueMenuExpanded(false)}
                  className="text-slate-500 hover:text-slate-300 transition-colors text-xs p-1"
                >
                  
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                <span className="text-xs text-slate-400">Modus-Status:</span>
                <button
                  onClick={() => setIsDialogueActive(!isDialogueActive)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    isDialogueActive 
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {isDialogueActive ? ' AKTIV (Keine Erzählung)' : ' INAKTIV'}
                </button>
              </div>

              {/* Dialogue Type Selector (Tabs) */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => setDialogueType('user_npc')}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider ${
                    dialogueType === 'user_npc'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Spieler & NPC
                </button>
                <button
                  type="button"
                  onClick={() => setDialogueType('npc_npc')}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider ${
                    dialogueType === 'npc_npc'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  NPC & NPC
                </button>
                <button
                  type="button"
                  onClick={() => setDialogueType('group')}
                  className={`py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider ${
                    dialogueType === 'group'
                      ? 'bg-amber-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Gruppe
                </button>
              </div>

              {/* Dialogue Type Options */}
              {dialogueType === 'user_npc' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gesprächspartner wählen:</label>
                  {adventure.npcs && adventure.npcs.length > 0 ? (
                    <select
                      value={dialogueSpeakerId}
                      onChange={(e) => setDialogueSpeakerId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    >
                      {adventure.npcs.map((npc, nIdx) => (
                        <option key={npc.id ? `dlg-npc-${npc.id}-${nIdx}` : `dlg-npc-${nIdx}`} value={npc.id}>
                          {npc.nickname || npc.name} ({npc.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[10px] text-red-400 italic">Keine NPCs in dieser Welt verfügbar. Bitte erstelle zuerst einen Charakter/NPC im Codex!</p>
                  )}
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Schreibe unten deine gesprochenen Worte. Der gewählte NPC wird im reinen Dialog antworten - ganz ohne beschreibende Erzählungen.
                  </p>
                </div>
              )}

              {dialogueType === 'npc_npc' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sprecher A:</label>
                      <select
                        value={dialogueSpeakerId}
                        onChange={(e) => setDialogueSpeakerId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500/50"
                      >
                        {adventure.npcs?.map((npc, nIdx) => (
                          <option key={npc.id ? `spkA-${npc.id}-${nIdx}` : `spkA-${nIdx}`} value={npc.id} disabled={npc.id === dialogueTargetId}>
                            {npc.nickname || npc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sprecher B:</label>
                      <select
                        value={dialogueTargetId}
                        onChange={(e) => setDialogueTargetId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500/50"
                      >
                        {adventure.npcs?.map((npc, nIdx) => (
                          <option key={npc.id ? `spkB-${npc.id}-${nIdx}` : `spkB-${nIdx}`} value={npc.id} disabled={npc.id === dialogueSpeakerId}>
                            {npc.nickname || npc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Gib unten ein Gesprächsthema vor oder schreibe den ersten Satz (z.B. "Sie reden über die anstehende Mission") und drücke Senden. Die beiden NPCs führen ein reines Hin-und-Her-Gespräch.
                  </p>
                </div>
              )}

              {dialogueType === 'group' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Teilnehmer wählen (Mehrfachauswahl):</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto bg-slate-950/80 p-2 rounded-xl border border-slate-850">
                    {adventure.npcs && adventure.npcs.length > 0 ? (
                      adventure.npcs.map((npc, nIdx) => {
                        const isChecked = dialogueGroupSelectedIds.includes(npc.id);
                        return (
                          <button
                            key={npc.id ? `grp-${npc.id}-${nIdx}` : `grp-${nIdx}`}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setDialogueGroupSelectedIds(prev => prev.filter(id => id !== npc.id));
                              } else {
                                setDialogueGroupSelectedIds(prev => [...prev, npc.id]);
                              }
                            }}
                            className="w-full flex items-center justify-between text-left p-1.5 hover:bg-slate-900 rounded-lg transition-all"
                          >
                            <span className="text-xs text-slate-200">{npc.nickname || npc.name}</span>
                            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${isChecked ? 'bg-amber-600 border-amber-500 text-white' : 'border-slate-700 text-transparent'}`}></span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-slate-500 italic">Keine NPCs vorhanden.</p>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Gib unten ein Thema für die Gruppe vor. Die ausgewählten NPCs unterhalten sich lebendig im reinen Dialogformat miteinander.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Aufklappbares JRPG Kampf-Steuerpanel */}
          {isCombatMenuExpanded && (
            <div id="jrpg-combat-menu" className="bg-slate-900/95 border-2 border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-2xl space-y-3 max-w-sm w-[calc(100vw-32px)] absolute bottom-full mb-1 left-4 animate-in slide-in-from-bottom duration-200 z-30">
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
                  
                </button>
              </div>

              {/* SubMenu: START (Wenn Kampf inaktiv) */}
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400">
                  Wähle einen anwesenden Gegner oder eine Gruppe aus den jüngsten Chat-Ereignissen, um den Kampf zu starten:
                </p>

                {/* Erkannte anwesende Gegner und Gruppen */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {isExtractingEnemies && combinedDetectedEnemies.length === 0 && (
                    <div className="text-center py-3 text-[10px] text-slate-400 italic bg-slate-900/40 rounded-xl border border-slate-800 animate-pulse">
                      <i className="fa-solid fa-microchip text-amber-500 mr-2"></i>
                      KI analysiert Text nach Gegnern...
                    </div>
                  )}
                  {combinedDetectedEnemies.length > 0 ? (
                    combinedDetectedEnemies.map((enemy, enIdx) => (
                      <button
                        key={enemy.id ? `det-enemy-${enemy.id}-${enIdx}` : `det-enemy-${enIdx}`}
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
                            {enemy.type === 'npc' ? '' : enemy.type === 'group' ? '' : ''}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-200">
                              {enemy.name} {enemy.type === 'group' && !enemy.id.startsWith('ai-extracted') && (() => {
                                const count = parseGroupCountFromText(enemy.name, messages.map(m => m.text || '').join(' '));
                                return count ? `(Gruppe von ca. ${count})` : '(Gruppe)';
                              })()}
                            </div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                              {enemy.subtitle || (enemy.type === 'npc' ? 'Anwesender Charakter' : 'Erkannte Bedrohung / Gruppe')}
                            </div>
                          </div>
                        </div>
                        <i className="fa-solid fa-chevron-right text-[10px] text-red-500/60 group-hover:translate-x-0.5 transition-transform"></i>
                      </button>
                    ))
                  ) : !isExtractingEnemies ? (
                    <div className="text-center py-3 text-[10px] text-slate-500 italic bg-slate-950/40 rounded-xl border border-slate-900">
                      Keine anwesenden Bedrohungen im Chat erkannt.
                    </div>
                  ) : null}
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
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 font-bold px-2 py-1"></button>
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
                  setIsDialogueMenuExpanded(false);
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

              <button 
                id="dialogue-toggle-btn"
                onClick={() => {
                  setIsDialogueMenuExpanded(!isDialogueMenuExpanded);
                  if (!isDialogueMenuExpanded) {
                    setIsCombatMenuExpanded(false);
                    // Autofill first NPC for speech if available
                    if (adventure.npcs && adventure.npcs.length > 0) {
                      if (!dialogueSpeakerId) setDialogueSpeakerId(adventure.npcs[0].id);
                      if (adventure.npcs.length > 1 && !dialogueTargetId) setDialogueTargetId(adventure.npcs[1].id);
                    }
                  }
                }}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all shadow-xl active:scale-95 ${
                  isDialogueActive 
                    ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-amber-950/50' 
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-500 shadow-slate-950/50'
                }`}
                title={isDialogueActive ? "Reiner Dialog-Modus aktiv" : "Reinen Dialog-Modus starten"}
              >
                <i className="fa-solid fa-comments text-xs"></i>
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
                              {count > 0 && <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 font-mono"> {count}</span>}
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
                              {count > 0 && <span className="text-[9px] text-amber-500 font-extrabold flex items-center gap-0.5 font-mono"> {count}</span>}
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
                      <span className="flex items-center gap-1.5"><i className="fa-solid fa-star text-amber-400"></i> Favoriten</span>
                      <button onClick={() => setShowFavoritesMenu(false)} className="text-slate-500 hover:text-slate-300 text-xs"></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-1 bg-slate-950/40">
                      {getFavoriteTechniques().length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 italic leading-relaxed">
                          Keine Favoriten markiert.<br />
                          Markiere Techniken, Ultimative Techniken oder Transformationen im <span className="text-amber-500/95 font-bold">Logbuch</span> mit dem Stern-Symbol.
                        </div>
                      ) : (
                        getFavoriteTechniques().map((tech, i) => (
                          <button
                            key={tech.id || i}
                            type="button"
                            onClick={() => {
                              const actionText = tech.category === 'Transformationen' || tech.isTransformation
                                ? `*aktiviert ${tech.name}*`
                                : `*setzt ${tech.name} ein*`;
                              insertFormatting(actionText, '');
                              setShowFavoritesMenu(false);
                            }}
                            className="w-full text-left p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-850/60 hover:border-amber-500/30 transition-all flex flex-col gap-1"
                          >
                            <div className="flex justify-between items-center w-full gap-1.5">
                              <span className="font-bold text-xs text-slate-200 truncate">{tech.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {tech.category === 'Transformationen' || tech.isTransformation ? (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300 font-extrabold uppercase">Form</span>
                                ) : tech.category === 'Ultimative Techniken' || tech.isUltimate ? (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-extrabold uppercase">Ultimativ</span>
                                ) : (
                                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 font-extrabold uppercase">Technik</span>
                                )}
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-400 font-bold">Lv. {tech.level || 1}</span>
                              </div>
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

              <div className="w-px h-6 bg-slate-700 mx-1"></div>

              <button
                type="button"
                onClick={() => setShowWorkMenu(true)}
                className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-amber-400 hover:bg-amber-950 hover:border-amber-500 hover:text-amber-300 transition-all flex items-center justify-center shadow-lg active:scale-95 group relative"
                title="Aufgaben & Betriebsführung"
              >
                <i className="fa-solid fa-list-check group-hover:scale-110 transition-transform"></i>
                {pendingWorkTasksCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center font-mono">
                    {pendingWorkTasksCount}
                  </span>
                )}
              </button>
            </div>

            <div className={`relative flex items-center gap-2 bg-slate-900/80 border rounded-3xl p-1 shadow-2xl backdrop-blur-md transition-all ${
              isDialogueActive 
                ? 'border-amber-500/50 ring-2 ring-amber-500/20 shadow-amber-900/10' 
                : 'border-slate-700/50'
            }`}>
              {isDialogueActive && (
                <div className="pl-3 shrink-0 flex items-center" title="Reiner Dialog-Modus aktiv">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                </div>
              )}
              <AutoExpandingTextarea 
                ref={textareaRef}
                rows={1} 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), isDialogueActive ? handleSendDialogue() : handleSend())} 
                placeholder={
                  !isDialogueActive ? "Deine Handlung..." :
                  dialogueType === 'user_npc' ? `Wörtliche Rede an ${(adventure.npcs?.find(n => n.id === dialogueSpeakerId)?.nickname || adventure.npcs?.find(n => n.id === dialogueSpeakerId)?.name || 'NPC')}...` :
                  dialogueType === 'npc_npc' ? "Gesprächsthema oder erster Satz..." : "Thema für die Gruppe..."
                } 
                className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white outline-none resize-none placeholder:text-slate-500 max-h-40" 
              />
              <button 
                onClick={isDialogueActive ? handleSendDialogue : handleSend} 
                disabled={isLoading || (isDialogueActive ? (dialogueType === 'user_npc' && !inputText.trim()) : !inputText.trim())} 
                className={`w-10 h-10 rounded-full text-white disabled:opacity-50 flex items-center justify-center shadow-md active:scale-90 transition-all flex-shrink-0 ${
                  isDialogueActive ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold' : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* SPEZIELLES DEDIZIERTES KAMPFFELD (MULTI-PANEL COMBAT STAGE) */
        <div className="flex-1 flex flex-col md:flex-row p-3 gap-3 overflow-hidden z-10 relative bg-slate-950/40">
          
          {/* LINKS: LISTE DER VERBÜNDETEN (ALLIES) & GEGNER (FOES) */}
          <div className="flex-shrink-0 md:w-64 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-xl backdrop-blur-sm overflow-y-auto max-h-[30vh] md:max-h-full custom-scrollbar">
            
            {/* Top Navigation Tabs: Verbündete / Gegner */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setLeftSidebarTab('allies')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  leftSidebarTab === 'allies'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <span className="p-0.5 px-1 bg-emerald-500/20 text-emerald-400 font-extrabold uppercase text-[8px] rounded tracking-wider">Allies</span>
                <span className="truncate">Verbündete</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftSidebarTab('enemies')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  leftSidebarTab === 'enemies'
                    ? 'bg-red-500/15 text-red-300 border border-red-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                }`}
              >
                <span className="p-0.5 px-1 bg-red-500/20 text-red-400 font-extrabold uppercase text-[8px] rounded tracking-wider">Foes</span>
                <span className="truncate">Gegner</span>
                {opponents.length > 0 && (
                  <span className="text-[8.5px] bg-red-500/30 text-red-200 px-1.5 py-0.5 rounded-full font-mono font-bold leading-none">
                    {opponents.length}
                  </span>
                )}
              </button>
            </div>

            {leftSidebarTab === 'allies' ? (
              <>
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 shrink-0">
                  <span className="p-1 px-1.5 bg-emerald-500/15 text-emerald-400 font-extrabold uppercase text-[9px] rounded-lg tracking-wider">Allies</span>
                  <span className="text-xs font-bold text-slate-300 font-sans tracking-wide">Verbündete</span>
                </div>
                
                {/* Spieler Status Card */}
                <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3.5 space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-500 text-sm"></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold text-white truncate">{adventure.player.name}</div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-wider">Aktive Kraftquelle wählen:</div>
                      {adventure.player.powerSources && adventure.player.powerSources.length > 0 ? (
                        <div className="flex flex-col gap-1 mt-1 max-h-[80px] overflow-y-auto custom-scrollbar">
                          {adventure.player.powerSources.map((ps, psIdx) => ps.powerName && (
                            <button
                              key={ps.id || psIdx}
                              type="button"
                              onClick={() => {
                                setActiveCombatPowerSourceIdx(psIdx);
                              }}
                              className={`text-left text-[10px] font-bold rounded-lg px-2 py-1 transition-all flex items-center justify-between border ${
                                activeCombatPowerSourceIdx === psIdx
                                  ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                  : 'bg-slate-900/45 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                              }`}
                            >
                              <span className="flex items-center gap-1 truncate mr-1">
                                <i className={`fa-solid fa-crown text-[8px] ${activeCombatPowerSourceIdx === psIdx ? 'text-amber-400' : 'text-slate-500'}`}></i>
                                <span className="truncate">{ps.powerName} <span className="text-slate-500 font-normal text-[8.5px]">({ps.source})</span></span>
                              </span>
                              {activeCombatPowerSourceIdx === psIdx && (
                                <span className="text-[8px] bg-amber-500 text-slate-950 px-1 py-0.5 rounded font-extrabold uppercase shrink-0">AKTIV</span>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : adventure.player.powerName ? (
                        <div className="text-[10px] text-amber-500 font-bold truncate flex items-center gap-1 mt-1">
                          <i className="fa-solid fa-crown text-[8px]"></i>
                          <span>{adventure.player.powerName}</span>
                        </div>
                      ) : null}
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

                  {/* Mini Silhouette Trigger inside player card */}
                  <div className="border-t border-slate-900/60 pt-3.5 mt-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-child-body text-indigo-400"></i> Silhouette
                      </span>
                      {(() => {
                        const stateObj = (adventure.player.appearance as any).silhouetteState;
                        let woundCount = 0;
                        if (stateObj && stateObj.injuries) {
                          woundCount = (Object.values(stateObj.injuries) as any[]).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0);
                        }
                        return woundCount > 0 ? (
                          <span className="text-[8.5px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 font-bold animate-pulse">
                            {woundCount} Wunde(n)
                          </span>
                        ) : (
                          <span className="text-[8.5px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                            Unverletzt
                          </span>
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSilhouetteModal(true)}
                      className="w-full py-1.5 px-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700/80 text-indigo-400 hover:text-indigo-300 font-bold rounded-lg text-[9.5px] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <i className="fa-solid fa-heart-pulse"></i> Silhouette & Status
                    </button>
                  </div>

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

                    const pFaction = adventure.player.appearance?.faction?.trim().toLowerCase();

                    return (
                      <div className="space-y-2">
                        <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest px-1">Anwesende Gefährten</div>
                        {activeCompanions.map(npc => {
                          const npcFaction = npc.appearance?.faction?.trim();
                          const isAllyFaction = pFaction && npcFaction && npcFaction.toLowerCase() === pFaction;
                          const isExplicitAlly = npc.role?.toLowerCase().includes('gefährte') || 
                                               npc.role?.toLowerCase().includes('verbündet') ||
                                               npc.role?.toLowerCase().includes('freund') ||
                                               npc.role?.toLowerCase().includes('mentor');
                          
                          const showAsAlliance = isAllyFaction || isExplicitAlly;

                          return (
                            <div key={npc.id} className="bg-slate-950/40 border border-slate-850 rounded-lg p-2 flex items-center gap-2">
                              {npc.image ? (
                                <img src={npc.image} className="w-6 h-6 rounded-full object-cover border border-slate-800 shrink-0" />
                              ) : (
                                <span className="text-xs"></span>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-bold text-slate-300 truncate">{npc.name}</div>
                                <div className="text-[9px] text-slate-500 truncate leading-none">
                                  {npcFaction ? ` ${npcFaction}` : npc.role || 'Verbündeter'}
                                </div>
                              </div>
                              {showAsAlliance ? (
                                <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0">Bündnis</span>
                              ) : (
                                <span className="text-[7.5px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0">Gefährte</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              /* GEGNER & BEDROHUNGEN TAB */
              (() => {
                const activeEnemy = opponents.find(o => selectedEnemyIds.includes(o.id) || o.id === selectedEnemyId) || opponents[0];
                const activeNpc = activeEnemy ? findNpcByIdOrName(activeEnemy.id, activeEnemy.name) : null;
                const currentHp = activeEnemy ? activeEnemy.hp : enemyHp;
                const currentMaxHp = activeEnemy ? activeEnemy.maxHp : enemyMaxHp;
                const isTargeted = activeEnemy ? (selectedEnemyIds.includes(activeEnemy.id) || selectedEnemyId === activeEnemy.id) : false;

                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-1.5 bg-red-500/15 text-red-400 font-extrabold uppercase text-[9px] rounded-lg tracking-wider">Foes</span>
                        <span className="text-xs font-bold text-slate-300 font-sans tracking-wide">Gegner</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddOpponentForm(!showAddOpponentForm)}
                        className="text-[9.5px] font-bold text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800"
                        title="Gegner erfassen"
                      >
                        <i className="fa-solid fa-plus text-[8px]"></i>
                        <span>Erfassen</span>
                      </button>
                    </div>

                    {/* Add Opponent inline form */}
                    {showAddOpponentForm && (
                      <div className="bg-slate-950/90 border border-red-500/30 rounded-xl p-3 space-y-2.5 shadow-lg animate-in fade-in duration-200">
                        <div className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider flex justify-between items-center">
                          <span>Neuen Gegner erfassen</span>
                          <button type="button" onClick={() => setShowAddOpponentForm(false)} className="text-slate-500 hover:text-slate-300">
                            <i className="fa-solid fa-xmark text-xs"></i>
                          </button>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[9px] text-slate-400 font-bold uppercase">Name</label>
                          <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs outline-none focus:border-red-500"
                            placeholder="z.B. Quinn, Elara, Banditen..."
                            value={newOpponentName}
                            onChange={e => setNewOpponentName(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">HP</label>
                            <input
                              type="number"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white text-xs outline-none focus:border-red-500"
                              value={newOpponentHp}
                              onChange={e => setNewOpponentHp(Math.max(1, parseInt(e.target.value) || 100))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Trupp (optional)</label>
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white text-xs outline-none focus:border-red-500"
                              placeholder="z.B. 5"
                              value={newOpponentCount}
                              onChange={e => setNewOpponentCount(e.target.value)}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddReinforcement}
                          disabled={!newOpponentName.trim()}
                          className="w-full py-1.5 bg-red-600/80 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Hinzufügen
                        </button>
                      </div>
                    )}

                    {/* Hauptgegner / Anvisiertes Ziel Status Card */}
                    {activeEnemy ? (
                      <div className="bg-slate-950/60 border border-red-900/40 rounded-xl p-3.5 space-y-3.5">
                        <div className="flex items-center gap-2.5">
                          {activeNpc?.image ? (
                            <img src={activeNpc.image} className="w-8 h-8 rounded-full object-cover border border-red-500/40 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0 text-xs">
                              <i className="fa-solid fa-skull"></i>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <div className="text-sm font-extrabold text-white truncate">
                                {activeEnemy.name}
                                {activeEnemy.count !== undefined && activeEnemy.count > 1 && (
                                  <span className="ml-1 text-xs text-red-400 font-mono font-bold">(x{activeEnemy.count})</span>
                                )}
                              </div>
                              {isTargeted ? (
                                <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0">
                                  Ziel
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => selectOpponentAsTarget(activeEnemy.id)}
                                  className="text-[8px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0"
                                >
                                  Anvisieren
                                </button>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-400 truncate mt-0.5">
                              {activeNpc?.appearance?.faction ? activeNpc.appearance.faction : activeEnemy.role || 'Feindlicher Kämpfer'}
                            </div>
                          </div>
                        </div>

                        {/* HP Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono text-slate-400">
                            <span className="font-bold text-red-400">{adventure.world.healthLabel || 'Gesundheit'}</span>
                            <span>{currentHp}/{currentMaxHp}</span>
                          </div>
                          <div className="h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                              style={{ width: `${Math.min(100, Math.max(0, (currentHp / currentMaxHp) * 100))}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Kraftquelle / Spezial-Fokus */}
                        {activeNpc?.powerName || activeNpc?.powerSources?.[0]?.powerName ? (
                          <div className="space-y-1.5 pt-2 border-t border-slate-900/60">
                            <div className="flex justify-between text-xs font-mono text-slate-400">
                              <span className="font-bold text-amber-400">Kraftquelle</span>
                              <span className="text-slate-300 font-sans text-[10px] truncate max-w-[130px]">
                                {activeNpc.powerName || activeNpc.powerSources?.[0]?.powerName}
                              </span>
                            </div>
                          </div>
                        ) : null}

                        {/* Status & Verwundungen */}
                        <div className="border-t border-slate-900/60 pt-3.5 mt-1">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                              <i className="fa-solid fa-shield-halved text-red-400"></i> Status
                            </span>
                            {currentHp <= 0 ? (
                              <span className="text-[8.5px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 font-bold">
                                Besiegt
                              </span>
                            ) : currentHp < currentMaxHp * 0.35 ? (
                              <span className="text-[8.5px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold animate-pulse">
                                Schwer verletzt
                              </span>
                            ) : currentHp < currentMaxHp * 0.75 ? (
                              <span className="text-[8.5px] bg-yellow-500/15 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold">
                                Angeschlagen
                              </span>
                            ) : (
                              <span className="text-[8.5px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                                Kampfbereit
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3.5 text-center text-slate-500 text-xs">
                        Kein Gegner ausgewählt.
                      </div>
                    )}

                    {/* Anwesende Gegner Liste */}
                    <div className="flex-1 space-y-4">
                      {opponents.length === 0 ? (
                        <div className="space-y-2">
                          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">Gegner</div>
                          <div className="text-[10px] text-slate-500 italic px-1 leading-snug">
                            Keine aktiven Gegner in dieser Szene erfasst.
                          </div>
                          {/* Schnellvorschlag aus anwesenden feindlichen NPCs */}
                          {(() => {
                            const presentHostiles = (adventure.npcs || []).filter(n => n.isHostile && isNpcCurrentlyPresent(n));
                            if (presentHostiles.length === 0) return null;
                            return (
                              <div className="space-y-1 pt-1">
                                <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider px-1">Aus Szene erfassen:</div>
                                {presentHostiles.map(hn => (
                                  <button
                                    key={hn.id}
                                    type="button"
                                    onClick={() => {
                                      const hMax = getNPCMaxHp(hn);
                                      const newOpp = {
                                        id: hn.id,
                                        name: hn.name,
                                        hp: hMax,
                                        maxHp: hMax,
                                        role: hn.role || 'Bedrohung',
                                        isFodder: false
                                      };
                                      setOpponents(prev => [...prev, newOpp]);
                                      setSelectedEnemyId(hn.id);
                                      setSelectedEnemyIds([hn.id]);
                                      setEnemyHp(hMax);
                                      setEnemyMaxHp(hMax);
                                    }}
                                    className="w-full text-left text-[10px] font-bold rounded-lg px-2 py-1 bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-800/40 transition-colors flex items-center justify-between"
                                  >
                                    <span className="truncate">{hn.name}</span>
                                    <span className="text-[8px] bg-red-500/20 text-red-300 px-1 py-0.5 rounded font-extrabold">+ Hinzufügen</span>
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest px-1 flex justify-between items-center">
                            <span>Anwesende Gegner ({opponents.length})</span>
                          </div>
                          {opponents.map(opp => {
                            const oppNpc = findNpcByIdOrName(opp.id, opp.name);
                            const isCurrentTarget = selectedEnemyIds.includes(opp.id) || selectedEnemyId === opp.id;
                            const oppFaction = oppNpc?.appearance?.faction?.trim();

                            return (
                              <div
                                key={opp.id}
                                onClick={() => selectOpponentAsTarget(opp.id)}
                                className={`border rounded-lg p-2 flex items-center gap-2 cursor-pointer transition-all ${
                                  isCurrentTarget
                                    ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                                    : 'bg-slate-950/40 border-slate-850 hover:border-slate-700'
                                }`}
                              >
                                {oppNpc?.image ? (
                                  <img src={oppNpc.image} className="w-6 h-6 rounded-full object-cover border border-slate-800 shrink-0" />
                                ) : (
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                                    isCurrentTarget ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-400'
                                  }`}>
                                    <i className="fa-solid fa-skull"></i>
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="text-[11px] font-bold text-slate-300 truncate">
                                      {opp.name}
                                      {opp.count !== undefined && opp.count > 1 && (
                                        <span className="ml-1 text-[9px] text-red-400 font-mono font-bold">x{opp.count}</span>
                                      )}
                                    </div>
                                    <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                      {opp.hp}/{opp.maxHp}
                                    </span>
                                  </div>
                                  {/* Mini health bar */}
                                  <div className="h-1 bg-slate-900 rounded-full overflow-hidden mt-1">
                                    <div
                                      className="h-full bg-red-500 transition-all duration-300"
                                      style={{ width: `${Math.min(100, Math.max(0, (opp.hp / opp.maxHp) * 100))}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-[9px] text-slate-500 truncate leading-none mt-1">
                                    {oppFaction ? oppFaction : opp.role || 'Gegner'}
                                  </div>
                                </div>
                                {isCurrentTarget ? (
                                  <span className="text-[7.5px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0">
                                    Ziel
                                  </span>
                                ) : (
                                  <span className="text-[7.5px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                                    Wählen
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}

          </div>

          {/* MITTE: ENGE BEGEGNUNG CHAT LOG & RPG EINGABEDECK */}
          <div className="flex-1 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            {/* Split Container: 42% Narrative Chat Log / 58% Tactical Radar Map & Gegner-Liste */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              {/* Left Column (42% on desktop): Narrativer Kampf-Verlauf */}
              <div className="flex-1 lg:w-[42%] xl:w-[40%] flex flex-col min-h-0 overflow-y-auto p-4 pr-2.5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-850">
                  <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase"> Narrativer Kampf-Verlauf </span>
                  <button
                    type="button"
                    onClick={handleCancelCombat}
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 hover:border-red-600 text-red-300 hover:text-red-100 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                    title="Kampf abbrechen und zum normalen Chat zurückkehren"
                  >
                    <i className="fa-solid fa-xmark text-xs"></i>
                    <span>Kampf abbrechen</span>
                  </button>
                </div>
                
                {messages.slice(-12).map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id ? `combat-msg-${msg.id}-${idx}` : `combat-msg-${idx}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                      <div className={`max-w-[96%] w-full rounded-xl shadow-md p-3.5 text-[14px] md:text-[15px] text-slate-300 ${
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
                            >{cleanTextForDisplay(msg.text)}</ReactMarkdown>
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

              {/* Right Column (58% on desktop): Taktischer Radar & Gegner-Liste */}
              <div className="h-[300px] lg:h-full lg:w-[58%] xl:w-[60%] shrink-0 overflow-hidden flex flex-col lg:flex-row gap-2.5 p-2 bg-slate-950/20">
                {/* TACTICAL RADAR */}
                <div className="flex-1 h-[220px] lg:h-full min-w-0 overflow-hidden flex flex-col">
                  <TacticalCombatMap
                    adventure={adventure}
                    onUpdateAdventure={onUpdateAdventure}
                    messages={messages}
                    isCombatActive={isCombatActive}
                    opponents={opponents}
                  />
                </div>

                {/* GEGNER-LISTE (rechts neben dem TACTICAL RADAR) */}
                <div className="w-full lg:w-[230px] xl:w-[260px] h-[200px] lg:h-full overflow-y-auto bg-slate-950/90 border border-slate-800 rounded-2xl p-3 shrink-0 flex flex-col backdrop-blur-md shadow-2xl custom-scrollbar">
                  {(() => {
                    const activeEnemy = opponents.find(o => selectedEnemyIds.includes(o.id) || o.id === selectedEnemyId) || opponents[0];
                    const activeNpc = activeEnemy ? findNpcByIdOrName(activeEnemy.id, activeEnemy.name) : null;
                    const currentHp = activeEnemy ? activeEnemy.hp : enemyHp;
                    const currentMaxHp = activeEnemy ? activeEnemy.maxHp : enemyMaxHp;
                    const isTargeted = activeEnemy ? (selectedEnemyIds.includes(activeEnemy.id) || selectedEnemyId === activeEnemy.id) : false;

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="p-0.5 px-1 bg-red-500/15 text-red-400 font-extrabold uppercase text-[8.5px] rounded tracking-wider shrink-0">Foes</span>
                            <span className="text-xs font-bold text-slate-200 font-sans tracking-wide truncate">Gegner-Liste</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAddOpponentForm(!showAddOpponentForm)}
                            className="text-[9px] font-bold text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
                            title="Gegner erfassen"
                          >
                            <i className="fa-solid fa-plus text-[8px]"></i>
                            <span>Erfassen</span>
                          </button>
                        </div>

                        {/* Add Opponent inline form */}
                        {showAddOpponentForm && (
                          <div className="bg-slate-950/90 border border-red-500/30 rounded-xl p-2.5 space-y-2 shadow-lg animate-in fade-in duration-200">
                            <div className="text-[9.5px] font-extrabold text-red-400 uppercase tracking-wider flex justify-between items-center">
                              <span>Neuen Gegner erfassen</span>
                              <button type="button" onClick={() => setShowAddOpponentForm(false)} className="text-slate-500 hover:text-slate-300">
                                <i className="fa-solid fa-xmark text-xs"></i>
                              </button>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[8.5px] text-slate-400 font-bold uppercase">Name</label>
                              <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white text-[11px] outline-none focus:border-red-500"
                                placeholder="z.B. Banditen, Wache..."
                                value={newOpponentName}
                                onChange={e => setNewOpponentName(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="space-y-0.5">
                                <label className="text-[8.5px] text-slate-400 font-bold uppercase">HP</label>
                                <input
                                  type="number"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-white text-[11px] outline-none focus:border-red-500"
                                  value={newOpponentHp}
                                  onChange={e => setNewOpponentHp(Math.max(1, parseInt(e.target.value) || 100))}
                                />
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8.5px] text-slate-400 font-bold uppercase">Trupp</label>
                                <input
                                  type="text"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1 text-white text-[11px] outline-none focus:border-red-500"
                                  placeholder="z.B. 5"
                                  value={newOpponentCount}
                                  onChange={e => setNewOpponentCount(e.target.value)}
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleAddReinforcement}
                              disabled={!newOpponentName.trim()}
                              className="w-full py-1 bg-red-600/80 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg text-[10px] transition-colors"
                            >
                              Hinzufügen
                            </button>
                          </div>
                        )}

                        {/* Hauptgegner / Anvisiertes Ziel Status Card */}
                        {activeEnemy ? (
                          <div className="bg-slate-950/60 border border-red-900/40 rounded-xl p-2.5 space-y-2">
                            <div className="flex items-center gap-2">
                              {activeNpc?.image ? (
                                <img src={activeNpc.image} className="w-7 h-7 rounded-full object-cover border border-red-500/40 shrink-0" />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0 text-xs">
                                  <i className="fa-solid fa-skull"></i>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <div className="text-[11px] font-extrabold text-white truncate">
                                    {activeEnemy.name}
                                    {activeEnemy.count !== undefined && activeEnemy.count > 1 && (
                                      <span className="ml-1 text-[9px] text-red-400 font-mono font-bold">(x{activeEnemy.count})</span>
                                    )}
                                  </div>
                                  {isTargeted ? (
                                    <span className="text-[7.5px] bg-red-500/20 text-red-400 border border-red-500/40 px-1 py-0.5 rounded font-extrabold uppercase shrink-0">
                                      Ziel
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => selectOpponentAsTarget(activeEnemy.id)}
                                      className="text-[7.5px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1 py-0.5 rounded font-bold uppercase shrink-0"
                                    >
                                      Anvisieren
                                    </button>
                                  )}
                                </div>
                                <div className="text-[8.5px] text-slate-400 truncate leading-none mt-0.5">
                                  {activeNpc?.appearance?.faction ? activeNpc.appearance.faction : activeEnemy.role || 'Feindlicher Kämpfer'}
                                </div>
                              </div>
                            </div>

                            {/* HP Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9.5px] font-mono text-slate-400">
                                <span className="font-bold text-red-400">{adventure.world.healthLabel || 'Gesundheit'}</span>
                                <span>{currentHp}/{currentMaxHp}</span>
                              </div>
                              <div className="h-2 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                                  style={{ width: `${Math.min(100, Math.max(0, (currentHp / currentMaxHp) * 100))}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="border-t border-slate-900/60 pt-1.5 flex justify-between items-center">
                              <span className="text-[8.5px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
                                <i className="fa-solid fa-shield-halved text-red-400"></i> Status
                              </span>
                              {currentHp <= 0 ? (
                                <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 font-bold">
                                  Besiegt
                                </span>
                              ) : currentHp < currentMaxHp * 0.35 ? (
                                <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30 font-bold animate-pulse">
                                  Schwer verletzt
                                </span>
                              ) : currentHp < currentMaxHp * 0.75 ? (
                                <span className="text-[8px] bg-yellow-500/15 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/20 font-bold">
                                  Angeschlagen
                                </span>
                              ) : (
                                <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                                  Kampfbereit
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-2.5 text-center text-slate-500 text-[10px]">
                            Kein Gegner ausgewählt.
                          </div>
                        )}

                        {/* Anwesende Gegner Liste */}
                        <div className="space-y-1.5">
                          {opponents.length === 0 ? (
                            <div className="space-y-1.5">
                              <div className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest px-0.5">Gegner</div>
                              <div className="text-[9.5px] text-slate-500 italic px-0.5 leading-snug">
                                Keine aktiven Gegner in dieser Szene erfasst.
                              </div>
                              {(() => {
                                const presentHostiles = (adventure.npcs || []).filter(n => n.isHostile && isNpcCurrentlyPresent(n));
                                if (presentHostiles.length === 0) return null;
                                return (
                                  <div className="space-y-1 pt-1">
                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-0.5">Aus Szene erfassen:</div>
                                    {presentHostiles.map(hn => (
                                      <button
                                        key={hn.id}
                                        type="button"
                                        onClick={() => {
                                          const hMax = getNPCMaxHp(hn);
                                          const newOpp = {
                                            id: hn.id,
                                            name: hn.name,
                                            hp: hMax,
                                            maxHp: hMax,
                                            role: hn.role || 'Bedrohung',
                                            isFodder: false
                                          };
                                          setOpponents(prev => [...prev, newOpp]);
                                          setSelectedEnemyId(hn.id);
                                          setSelectedEnemyIds([hn.id]);
                                          setEnemyHp(hMax);
                                          setEnemyMaxHp(hMax);
                                        }}
                                        className="w-full text-left text-[9.5px] font-bold rounded-lg px-1.5 py-1 bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-800/40 transition-colors flex items-center justify-between"
                                      >
                                        <span className="truncate">{hn.name}</span>
                                        <span className="text-[7.5px] bg-red-500/20 text-red-300 px-1 py-0.5 rounded font-extrabold">+ Hinzufügen</span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="text-[8.5px] font-extrabold text-slate-500 uppercase tracking-widest px-0.5 flex justify-between items-center">
                                <span>Anwesende Gegner ({opponents.length})</span>
                              </div>
                              {opponents.map(opp => {
                                const oppNpc = findNpcByIdOrName(opp.id, opp.name);
                                const isCurrentTarget = selectedEnemyIds.includes(opp.id) || selectedEnemyId === opp.id;
                                const oppFaction = oppNpc?.appearance?.faction?.trim();

                                return (
                                  <div
                                    key={opp.id}
                                    onClick={() => selectOpponentAsTarget(opp.id)}
                                    className={`border rounded-lg p-1.5 flex items-center gap-1.5 cursor-pointer transition-all ${
                                      isCurrentTarget
                                        ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]'
                                        : 'bg-slate-950/40 border-slate-850 hover:border-slate-700'
                                    }`}
                                  >
                                    {oppNpc?.image ? (
                                      <img src={oppNpc.image} className="w-5 h-5 rounded-full object-cover border border-slate-800 shrink-0" />
                                    ) : (
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] ${
                                        isCurrentTarget ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-400'
                                      }`}>
                                        <i className="fa-solid fa-skull"></i>
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="text-[10px] font-bold text-slate-300 truncate">
                                          {opp.name}
                                          {opp.count !== undefined && opp.count > 1 && (
                                            <span className="ml-1 text-[8.5px] text-red-400 font-mono font-bold">x{opp.count}</span>
                                          )}
                                        </div>
                                        <span className="text-[8.5px] font-mono text-slate-400 shrink-0">
                                          {opp.hp}/{opp.maxHp}
                                        </span>
                                      </div>
                                      {/* Mini health bar */}
                                      <div className="h-1 bg-slate-900 rounded-full overflow-hidden mt-0.5">
                                        <div
                                          className="h-full bg-red-500 transition-all duration-300"
                                          style={{ width: `${Math.min(100, Math.max(0, (opp.hp / opp.maxHp) * 100))}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-[8.5px] text-slate-500 truncate leading-none mt-0.5">
                                        {oppFaction ? oppFaction : opp.role || 'Gegner'}
                                      </div>
                                    </div>
                                    {isCurrentTarget ? (
                                      <span className="text-[7px] bg-red-500/20 text-red-400 border border-red-500/40 px-1 py-0.5 rounded font-extrabold uppercase shrink-0">
                                        Ziel
                                      </span>
                                    ) : (
                                      <span className="text-[7px] bg-slate-800 text-slate-400 px-1 py-0.5 rounded font-bold uppercase shrink-0">
                                        Wählen
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* MECHANICAL DECISION GRID COCKPIT */}
            <div className="bg-slate-950 border-t border-slate-800 p-4 space-y-3 shrink-0">
              {/* Cockpit Submenu state header */}
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-2">
                <span className="tracking-widest uppercase text-slate-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-gamepad text-amber-500"></i>
                  {combatSubMenu === 'main' && ' KAMPF-ENTSCHEIDUNGEN'}
                  {combatSubMenu === 'attack' && ' WAFFEN & KAMPF-MANÖVER'}
                  {combatSubMenu === 'skills' && ' SPEZIAL-FÄHIGKEITEN'}
                  {combatSubMenu === 'defend' && ' DEFENSIVE STELLUNGEN'}
                  {combatSubMenu === 'items' && ' INVENTAR & ITEMS'}
                </span>
                <div className="flex items-center gap-2">
                  {combatSubMenu !== 'main' && (
                    <button 
                      onClick={() => setCombatSubMenu('main')}
                      className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 active:scale-95 transition-all text-[9.5px]"
                    ><i className="fa-solid fa-arrow-left mr-1"></i> HAUPTMENÜ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCancelCombat}
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 hover:border-red-600 text-red-300 hover:text-red-100 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                    title="Kampf abbrechen und zum normalen Chat zurückkehren"
                  >
                    <i className="fa-solid fa-xmark text-xs"></i>
                    <span>Kampf abbrechen</span>
                  </button>
                </div>
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
                    <span className="text-base"></span>
                    Waffen
                  </button>

                  <button
                    onClick={() => setCombatSubMenu('skills')}
                    disabled={isLoading}
                    className="py-3 px-2 bg-indigo-950/20 border border-indigo-900/40 text-indigo-400 hover:bg-indigo-900/30 hover:text-indigo-200 hover:border-indigo-500 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 shadow"
                  >
                    <span className="text-base"></span>
                    Fähigkeit
                  </button>

                  <button
                    onClick={() => setCombatSubMenu('defend')}
                    disabled={isLoading}
                    className="py-3 px-2 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-200 hover:border-emerald-500 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 shadow"
                  >
                    <span className="text-base"></span>
                    Verteidigung
                  </button>

                  <button
                    onClick={() => setCombatSubMenu('items')}
                    disabled={isLoading}
                    className="py-3 px-2 bg-amber-950/20 border border-amber-900/40 text-amber-500 hover:bg-amber-900/30 hover:text-amber-200 hover:border-amber-500 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 shadow"
                  >
                    <span className="text-base"></span>
                    Inventar
                  </button>
                </div>
              ) : combatSubMenu === 'attack' ? (
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-between">
                    <span> Freies Kampf-Manöver formen</span>
                    <span className="text-slate-500 font-mono text-[9px] lowercase italic">Formuliere deine eigene Aktion komplett frei!</span>
                  </div>

                  {/* High Quality freeform text box front & center */}
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex flex-col gap-3 shadow-inner">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <i className="fa-solid fa-pen-nib text-red-500"></i> Beschreibe deinen Angriff/Spezialaktion:
                      </label>
                      <AutoExpandingTextarea
                        value={customAttackText}
                        onChange={(e) => setCustomAttackText(e.target.value)}
                        placeholder="z.B. Ich entfessle meinen Eis-Atem gegen die Marine-Soldaten x50, friere einen Teil ein und weiche geschickt rückwärts aus..."
                        disabled={isLoading}
                        rows={3}
                        className="w-full bg-slate-950/95 border border-slate-800 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/30 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none transition-all font-sans resize-none"
                      />
                    </div>

                    {/* Weapons list from inventory */}
                    {adventure.structuredInventory?.weapons && adventure.structuredInventory.weapons.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-800/40 pt-2 bg-slate-950/20 px-1 rounded-lg">
                        <div className="text-[9px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 justify-between">
                          <span> Deine Waffen:</span>
                          <span className="text-[8px] text-slate-500 font-normal lowercase italic">(Anklicken zum Ziehen / Erneut zum Wegstecken)</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {adventure.structuredInventory.weapons.map((weapon, idx) => {
                            const isDrawn = drawnWeapon === weapon;
                            return (
                              <button
                                key={`${weapon}-${idx}`}
                                type="button"
                                onClick={() => {
                                  if (isDrawn) {
                                    setDrawnWeapon(null);
                                    setCustomAttackText(`Ich stecke ${weapon} wieder weg.`);
                                  } else {
                                    setDrawnWeapon(weapon);
                                    setCustomAttackText(`Ich ziehe und benutze ${weapon}!`);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all flex items-center gap-1.5 active:scale-95 ${
                                  isDrawn
                                    ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.3)] font-bold'
                                    : 'bg-red-950/20 hover:bg-red-900/35 border border-red-900/40 text-red-300 hover:text-slate-100'
                                }`}
                              >
                                {weapon}
                                {isDrawn && (
                                  <span className="text-[8px] bg-amber-500/30 text-amber-300 px-1 py-0.2 rounded font-mono uppercase ml-0.5">
                                    Gezogen
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* General items list from inventory */}
                    {((adventure.structuredInventory?.generalItems && adventure.structuredInventory.generalItems.length > 0) || (adventure.inventory && adventure.inventory.length > 0)) && (
                      <div className="space-y-1.5 border-t border-slate-800/40 pt-2 bg-slate-950/20 px-1 rounded-lg">
                        <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1 justify-between">
                          <span> Deine Gegenstände & Ausrüstung:</span>
                          <span className="text-[8px] text-slate-500 font-normal lowercase italic">(Anklicken zum Auswählen)</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {/* Consumables */}
                          {adventure.inventory?.map((item, idx) => {
                            const isSelected = customAttackText === `Ich nutze ${item}!`;
                            return (
                              <button
                                key={`consumable-btn-${item}-${idx}`}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setCustomAttackText('');
                                  } else {
                                    setCustomAttackText(`Ich nutze ${item}!`);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded text-[9.5px] font-semibold transition-all flex items-center gap-1 active:scale-95 ${
                                  isSelected
                                    ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-200 font-bold'
                                    : 'bg-emerald-950/20 hover:bg-emerald-900/35 border border-emerald-900/40 text-emerald-300 hover:text-slate-100'
                                }`}
                              >
                                {item}
                              </button>
                            );
                          })}
                          {/* General items */}
                          {adventure.structuredInventory?.generalItems?.map((item, idx) => {
                            const isSelected = customAttackText === `Ich verwende ${item}!`;
                            return (
                              <button
                                key={`general-btn-${item}-${idx}`}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setCustomAttackText('');
                                  } else {
                                    setCustomAttackText(`Ich verwende ${item}!`);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded text-[9.5px] font-semibold transition-all flex items-center gap-1 active:scale-95 ${
                                  isSelected
                                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 font-bold'
                                    : 'bg-cyan-950/20 hover:bg-cyan-900/35 border border-cyan-900/40 text-cyan-300 hover:text-slate-100'
                                }`}
                              >
                                {item}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Maneuver Class Selectors */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const actionText = customAttackText.trim() || (drawnWeapon ? `Ich greife mit ${drawnWeapon} an!` : '');
                          if (!actionText) return;
                          const isHero = adventure.world.isHeroic !== false;
                          const minDmg = isHero ? 18 : 10;
                          const maxDmg = isHero ? 28 : 16;
                          const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                          handleCombatAction('attack', actionText, dmg, 0);
                        }}
                        disabled={isLoading || (!customAttackText.trim() && !drawnWeapon)}
                        className="p-2.5 bg-red-950/15 hover:bg-red-900/30 border border-red-900/40 text-left text-slate-200 rounded-lg transition-all flex flex-col justify-between h-14 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-850 group active:scale-95 text-xs"
                        title="Einfacher physischer Angriff (0 MP)"
                      >
                        <span className="text-[10px] font-extrabold text-red-400 group-hover:text-red-300"> Physisch</span>
                        <span className="text-[8px] text-slate-500 leading-tight">Mittlerer Schaden, 0 MP.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const actionText = customAttackText.trim() || (drawnWeapon ? `Ich nutze meine Spezialkraft mit ${drawnWeapon}` : '');
                          if (!actionText) return;
                          const isHero = adventure.world.isHeroic !== false;
                          const minDmg = isHero ? 32 : 18;
                          const maxDmg = isHero ? 48 : 26;
                          const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                          handleCombatAction('attack', `Spezialtechnik entfesselt: "${actionText}"`, dmg, 15);
                        }}
                        disabled={isLoading || (!customAttackText.trim() && !drawnWeapon) || playerMp < 15}
                        className="p-2.5 bg-indigo-950/15 hover:bg-indigo-900/30 border border-indigo-900/40 text-left text-slate-200 rounded-lg transition-all flex flex-col justify-between h-14 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-850 group active:scale-95 text-xs"
                        title="Starke Spezialkraft / Teufelsfrucht / Jutsu (15 MP)"
                      >
                        <span className="text-[10px] font-extrabold text-indigo-400 group-hover:text-indigo-300"> Spezialkraft</span>
                        <span className="text-[8px] text-slate-500 leading-tight">Hoher Schaden, kostet 15 MP.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const actionText = customAttackText.trim() || (drawnWeapon ? `Ich wende einen Flächenangriff mit ${drawnWeapon} an` : '');
                          if (!actionText) return;
                          const isHero = adventure.world.isHeroic !== false;
                          const minDmg = isHero ? 22 : 12;
                          const maxDmg = isHero ? 35 : 18;
                          const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                          handleCombatAction('attack', `Flächenangriff gewirkt: "${actionText}"`, dmg, 12);
                        }}
                        disabled={isLoading || (!customAttackText.trim() && !drawnWeapon) || playerMp < 12}
                        className="p-2.5 bg-amber-950/15 hover:bg-amber-900/30 border border-amber-900/40 text-left text-slate-200 rounded-lg transition-all flex flex-col justify-between h-14 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-850 group active:scale-95 text-xs"
                        title="Optimal gegen Soldatentrupps / Kanonenfutter (12 MP)"
                      >
                        <span className="text-[10px] font-extrabold text-amber-400 group-hover:text-amber-300"> Flächenangriff</span>
                        <span className="text-[8px] text-slate-500 leading-tight">Gegen Trupps, kostet 12 MP.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const actionText = customAttackText.trim() || (drawnWeapon ? `Ich nehme eine defensive Haltung mit ${drawnWeapon} ein` : 'Ich weiche geschickt aus und gehe in Deckung');
                          handleCombatAction('defend', actionText, 0, -10);
                        }}
                        disabled={isLoading}
                        className="p-2.5 bg-emerald-950/15 hover:bg-emerald-900/30 border border-emerald-900/40 text-left text-slate-200 rounded-lg transition-all flex flex-col justify-between h-14 disabled:opacity-40 disabled:hover:bg-transparent disabled:border-slate-850 group active:scale-95 text-xs"
                        title="Ausweichen / Verteidigen / Taktik (Regeneriert 10 MP)"
                      >
                        <span className="text-[10px] font-extrabold text-emerald-400 group-hover:text-emerald-300"> Taktik / Deckung</span>
                        <span className="text-[8px] text-slate-500 leading-tight">0 Schaden, +10 MP Reg.</span>
                      </button>
                    </div>

                    {/* Backing label & send row */}
                    <div className="flex justify-between items-center bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-850">
                      <span className="text-[9px] text-slate-500 italic">Tippe oben ein Manöver und klicke einen der 4 Aktionstypen zum Ausführen!</span>
                      <button
                        type="button"
                        onClick={() => {
                          const actionText = customAttackText.trim() || (drawnWeapon ? `Ich greife mit ${drawnWeapon} an!` : '');
                          if (!actionText) return;
                          const isHero = adventure.world.isHeroic !== false;
                          const minDmg = isHero ? 18 : 10;
                          const maxDmg = isHero ? 28 : 16;
                          const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
                          handleCombatAction('attack', actionText, dmg, 0);
                        }}
                        disabled={isLoading || (!customAttackText.trim() && !drawnWeapon)}
                        className="px-3.5 py-1.5 bg-red-850 hover:bg-red-700 disabled:bg-slate-800 disabled:opacity-45 text-slate-200 disabled:text-slate-500 font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow select-none active:scale-95"
                      >
                        Manöver entfesseln
                      </button>
                    </div>
                  </div>
                </div>
              ) : combatSubMenu === 'skills' ? (
                <div className="flex flex-col gap-3 col-span-full w-full">
                  {(() => {
                    const combatPowerSources = adventure.player.powerSources && adventure.player.powerSources.length > 0
                      ? adventure.player.powerSources
                      : [
                          {
                            id: 'default',
                            source: adventure.player.powerSource || 'Kraftquelle',
                            cost: adventure.player.powerCost || 'MP',
                            powerName: adventure.player.powerName || adventure.player.powerSource || 'Standard-Kraft',
                            powerDescription: adventure.player.powerDescription || ''
                          }
                        ];
                    const activeCombatPowerSource = (combatPowerSources[activeCombatPowerSourceIdx] || combatPowerSources[0]) as {
                      id?: string;
                      source?: string;
                      cost?: string;
                      powerName?: string;
                      powerDescription?: string;
                    };
                    const allSkills = getPlayerDetailedSkillsList();
                    
                    const activeSkillsRaw = allSkills.filter(skillObj => {
                      const matchingAbility = adventure.player.abilities?.find(a => 
                        (skillObj.abilityId && a.id === skillObj.abilityId) ||
                        a.techniqueList?.some(t => t.name.trim().toLowerCase() === skillObj.name.trim().toLowerCase()) || 
                        (a.techniques && a.techniques.split(/[,\n;]/).map(s => s.trim().toLowerCase()).includes(skillObj.name.trim().toLowerCase()))
                      );
                      if (!matchingAbility) return true; // Show general fallback skills if not matched
                      
                      const belongsToActive = matchingAbility.powerSourceId === activeCombatPowerSource.id || (!matchingAbility.powerSourceId && activeCombatPowerSource.id === combatPowerSources[0]?.id);
                      return belongsToActive;
                    });

                    // Ensure absolute uniqueness by skill name
                    const activeSkillsMap = new Map<string, typeof activeSkillsRaw[0]>();
                    activeSkillsRaw.forEach(s => {
                      const key = s.name.trim().toLowerCase();
                      if (!activeSkillsMap.has(key)) {
                        activeSkillsMap.set(key, s);
                      }
                    });
                    const activeSkills = Array.from(activeSkillsMap.values());

                    // Classification helper functions
                    const isSkillTransformation = (skillObj: any) => {
                      const cat = (skillObj.abilityCategory || '').toLowerCase();
                      const type = (skillObj.type || '').toLowerCase();
                      const sub = (skillObj.subtype || '').toLowerCase();
                      const name = (skillObj.name || '').toLowerCase();
                      return cat.includes('transform') || cat.includes('formen') || cat.includes('verwandlung') ||
                             type === 'transformation' || sub.includes('transform') || sub.includes('form') ||
                             sub.includes('modus') || sub.includes('gestalt') || name.includes('transformation') ||
                             name.includes('gestalt') || name.includes('gear') || name.includes('modus');
                    };

                    const isSkillUltimate = (skillObj: any) => {
                      if (isSkillTransformation(skillObj)) return false;
                      const cat = (skillObj.abilityCategory || '').toLowerCase();
                      const type = (skillObj.type || '').toLowerCase();
                      const sub = (skillObj.subtype || '').toLowerCase();
                      const name = (skillObj.name || '').toLowerCase();
                      return cat.includes('ultimat') || cat.includes('finisher') || cat.includes('geheim') ||
                             type === 'ultimativ' || type === 'ultimate' || sub.includes('ultimat') ||
                             sub.includes('finisher') || sub.includes('geheim') || sub.includes('meister') ||
                             name.includes('ultimativ') || name.includes('finisher') || name.includes('geheimtechnik');
                    };

                    const isSkillTechnique = (skillObj: any) => {
                      return !isSkillTransformation(skillObj) && !isSkillUltimate(skillObj);
                    };

                    const technikenCount = activeSkills.filter(s => isSkillTechnique(s)).length;
                    const ultiCount = activeSkills.filter(s => isSkillUltimate(s)).length;
                    const transCount = activeSkills.filter(s => isSkillTransformation(s)).length;

                    // Active filtered skills based on category tab
                    const filteredSkills = activeSkills.filter(s => {
                      if (activeSkillCategoryTab === 'transformationen') return isSkillTransformation(s);
                      if (activeSkillCategoryTab === 'ultimative') return isSkillUltimate(s);
                      return isSkillTechnique(s);
                    });

                    return (
                      <div className="flex flex-col gap-2.5 w-full">
                        {/* 1. KRAFTQUELLE SELECTION */}
                        <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                              <i className="fa-solid fa-bolt text-amber-400"></i> 1. Kraftquelle auswählen:
                            </span>
                            <span className="text-slate-400 text-[9px] font-normal italic">
                              {combatPowerSources.length} {combatPowerSources.length === 1 ? 'Kraftquelle' : 'Kraftquellen'} verfügbar
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
                            {combatPowerSources.map((ps, psIdx) => {
                              const isActive = activeCombatPowerSourceIdx === psIdx;
                              return (
                                <button
                                  key={ps.id || psIdx}
                                  type="button"
                                  onClick={() => setActiveCombatPowerSourceIdx(psIdx)}
                                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                                    isActive
                                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                  }`}
                                >
                                  <i className={`fa-solid fa-crown text-[9px] ${isActive ? 'text-amber-400' : 'text-slate-500'}`}></i>
                                  <span>{ps.powerName || ps.source || 'Kraftquelle'}</span>
                                  {ps.source && ps.powerName !== ps.source && (
                                    <span className="text-[8.5px] text-slate-500 font-normal">({ps.source})</span>
                                  )}
                                  {isActive && (
                                    <span className="text-[7.5px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded font-black uppercase shrink-0">AKTIV</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. KATEGORIE SELECTION TABS */}
                        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800/80 pb-2">
                          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                            <i className="fa-solid fa-list-check text-indigo-400"></i> 2. Kategorie:
                          </span>

                          <button
                            type="button"
                            onClick={() => setActiveSkillCategoryTab('techniken')}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                              activeSkillCategoryTab === 'techniken'
                                ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.25)]'
                                : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <span>Techniken</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                              activeSkillCategoryTab === 'techniken' ? 'bg-indigo-500/30 text-indigo-100' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {technikenCount}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveSkillCategoryTab('ultimative')}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                              activeSkillCategoryTab === 'ultimative'
                                ? 'bg-amber-600/25 border-amber-500 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                                : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <span> Ultimative Techniken</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                              activeSkillCategoryTab === 'ultimative' ? 'bg-amber-500/30 text-amber-100' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {ultiCount}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveSkillCategoryTab('transformationen')}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 ${
                              activeSkillCategoryTab === 'transformationen'
                                ? 'bg-purple-600/25 border-purple-500 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                                : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <span> Transformationen</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                              activeSkillCategoryTab === 'transformationen' ? 'bg-purple-500/30 text-purple-100' : 'bg-slate-800 text-slate-500'
                            }`}>
                              {transCount}
                            </span>
                          </button>
                        </div>

                        {/* 3. KAMPF-TECHNIKEN GRID */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                          {(() => {
                            if (allSkills.length === 0) {
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
                            }

                            const buttons: React.ReactNode[] = [];

                            const activeTransId = adventure.player.appearance?.activeTransformationId || 'standard';
                            const isTransformed = activeTransId !== 'standard';

                            if (activeSkillCategoryTab === 'transformationen' && isTransformed) {
                              buttons.push(
                                <button
                                  key="detrans-virtual"
                                  onClick={() => {
                                    handleCombatAction('skill', 'Zurückverwandlung (Standardgestalt)', 0, 0, false, undefined);
                                    const updatedPlayer = {
                                      ...adventure.player,
                                      appearance: {
                                        ...adventure.player.appearance,
                                        activeTransformationId: 'standard'
                                      }
                                    };
                                    onUpdateAdventure({
                                      ...adventure,
                                      player: updatedPlayer
                                    });
                                  }}
                                  className="text-left p-2 rounded-lg text-xs font-semibold border bg-rose-950/20 border-rose-900/40 hover:border-rose-500 hover:bg-rose-950/40 text-rose-300 transition-all flex flex-col justify-between shadow-md hover:shadow-rose-500/10 active:scale-95 duration-100 cursor-pointer"
                                  disabled={isLoading}
                                >
                                  <div className="font-extrabold truncate text-[10.5px] text-rose-200 w-full flex items-center gap-1" title="Zurückverwandlung">
                                    <span className="animate-pulse"></span> Zurückverwandlung
                                  </div>
                                  <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-rose-900/20 text-[9px] w-full text-slate-400">
                                    <span>Standardgestalt</span>
                                    <span className="text-emerald-400 font-bold">0 MP</span>
                                  </div>
                                </button>
                              );
                            }

                            if (filteredSkills.length > 0) {
                              filteredSkills.forEach((skillObj, idx) => {
                                const skill = skillObj.name;
                                const skillType = skillObj.type || 'Angriff';
                                const skillSubtype = skillObj.subtype || '';
                                
                                let costPercent = 0.20;
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

                                const isSkillHeal = 
                                  skillType === 'Heilung' || 
                                  (skillType === 'Support' && (
                                    skillSubtype.toLowerCase().includes('heil') || 
                                    skillSubtype.toLowerCase().includes('regen') || 
                                    skillSubtype.toLowerCase().includes('hot') || 
                                    skillSubtype.toLowerCase().includes('leben')
                                  )) || 
                                  skill.toLowerCase().includes('heil') || 
                                  skill.toLowerCase().includes('medizin') || 
                                  skill.toLowerCase().includes('regen');

                                const sourceName = skillObj.source;
                                const sourcePower = sourceName ? (adventure.player.campaignPowerLevels?.[sourceName]?.value ?? 0) : 0;
                                
                                const costName = skillObj.costResourceName || skillObj.cost;
                                const costPower = costName ? (adventure.player.campaignPowerLevels?.[costName]?.value ?? 0) : 0;
                                
                                const resInfo = getResourceValueAndMax(costName);
                                const resMax = resInfo.max || 100;

                                let mpCost = Math.max(5, Math.round(resMax * costPercent));
                                
                                if (skillObj.costValue !== undefined && !isNaN(skillObj.costValue)) {
                                  if (skillObj.costFormula === 'proz.') {
                                    mpCost = Math.max(1, Math.round(resMax * (skillObj.costValue / 100)));
                                  } else {
                                    mpCost = skillObj.costValue;
                                  }
                                } else {
                                  const costDiscount = Math.floor(costPower * 0.25);
                                  if (costDiscount > 0) {
                                    mpCost = Math.max(5, mpCost - costDiscount);
                                  }
                                }

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

                                const isSummonTech = 
                                  skillObj.type === 'Beschwörung' || 
                                  skillObj.applications?.includes('Beschwörung') || 
                                  skill.toLowerCase().includes('beschwör') || 
                                  skill.toLowerCase().includes('doppelgänger') || 
                                  skill.toLowerCase().includes('illusion') || 
                                  skill.toLowerCase().includes('klon') ||
                                  skill.toLowerCase().includes('geist');

                                const maxByResource = mpCost > 0 ? Math.floor(resInfo.value / mpCost) : 10;
                                const maxDefined = skillObj.summonCount !== undefined ? skillObj.summonCount : 10;
                                const maxPossible = Math.max(1, Math.min(20, maxByResource > 0 ? maxByResource : 1, maxDefined));

                                const currentChosen = skillSummonCounts[skill] !== undefined ? skillSummonCounts[skill] : 2;
                                const countToSpawn = isSummonTech ? Math.min(Math.max(1, currentChosen), maxPossible) : 1;
                                const finalMpCost = isSummonTech ? (mpCost * countToSpawn) : mpCost;

                                const hasEnoughRes = resInfo.value >= finalMpCost;

                                const activeSourceLevelName = activeCombatPowerSource.source;
                                const activeSourcePower = activeSourceLevelName ? (adventure.player.campaignPowerLevels?.[activeSourceLevelName]?.value ?? 0) : 0;
                                const statLevel = activeSourcePower > 0 ? activeSourcePower : (sourcePower > 0 ? sourcePower : (costPower > 0 ? costPower : 50));
                                
                                let dmg = baseDmg + Math.floor(statLevel * dmgMultiplier);
                                if (skillObj.baseValue !== undefined && !isNaN(skillObj.baseValue) && skillObj.baseValue > 0) {
                                   dmg = skillObj.baseValue + Math.floor(statLevel * dmgMultiplier);
                                }
                                
                                const skillLevel = skillObj.level || 1;
                                const levelBonusFactor = 1 + (skillLevel - 1) * 0.10;
                                dmg = Math.round(dmg * levelBonusFactor);

                                let effectLabel = `~${dmg} Dmg`;
                                if (skillObj.effectValue) {
                                   effectLabel = skillObj.effectValue;
                                } else {
                                  if (isSkillHeal) {
                                    effectLabel = `+${dmg} HP`;
                                  } else if (skillType === 'Verteidigung') {
                                    effectLabel = `Schutz (~${dmg})`;
                                  } else if (skillType === 'Transformation') {
                                    effectLabel = `Boost (~${dmg})`;
                                  } else if (skillType === 'Support') {
                                    effectLabel = `Effekt (~${dmg})`;
                                  }
                                }

                                buttons.push(
                                  <button
                                    key={`${skill}-${idx}`}
                                    onClick={() => {
                                      const actionId = handleCombatAction('skill', isSummonTech ? `${skill} (${countToSpawn}x)` : skill, dmg, finalMpCost, isSkillHeal, costName);
                                      if (skillObj.abilityCategory === 'Transformationen' && skillObj.abilityId) {
                                        const updatedPlayer = {
                                          ...adventure.player,
                                          appearance: {
                                            ...adventure.player.appearance,
                                            activeTransformationId: skillObj.abilityId
                                          }
                                        };
                                        onUpdateAdventure({
                                          ...adventure,
                                          player: updatedPlayer
                                        });
                                      }

                                      if (isSummonTech && actionId) {
                                        const currentCombatState = adventure.combatState || {
                                          isCombatActive: true,
                                          selectedEnemyId: '',
                                          customEnemyName: '',
                                          opponents: [],
                                          playerHp: 100,
                                          playerMaxHp: 100,
                                          playerMp: 100,
                                          playerMaxMp: 100,
                                          enemyHp: 100,
                                          enemyMaxHp: 100,
                                          combatSubMenu: 'main',
                                          placedObjects: [],
                                          tiles: {}
                                        };
                                        const existingPlaced = (currentCombatState as any).placedObjects || [];
                                        const playerPos = (currentCombatState as any).positions?.[adventure.player?.name || 'Spieler'] || { x: 10, y: 15 };
                                        
                                        const offsets = [
                                          { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                                          { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
                                          { dx: 2, dy: 0 }, { dx: -2, dy: 0 }, { dx: 0, dy: 2 }, { dx: 0, dy: -2 },
                                        ];

                                        const lowerName = skill.toLowerCase();
                                        let summonIcon = '';
                                        if (lowerName.includes('doppelgänger') || lowerName.includes('klon')) summonIcon = '';
                                        else if (lowerName.includes('illusion') || lowerName.includes('geist') || lowerName.includes('phantom')) summonIcon = '';
                                        else if (lowerName.includes('feuer') || lowerName.includes('drache')) summonIcon = '';
                                        else if (lowerName.includes('elementar') || lowerName.includes('magie')) summonIcon = '';
                                        else if (lowerName.includes('wolf') || lowerName.includes('tier') || lowerName.includes('bestie')) summonIcon = '';
                                        
                                        const newSummons = [];
                                        for (let i = 0; i < countToSpawn; i++) {
                                          const off = offsets[i % offsets.length];
                                          const spawnX = Math.max(0, Math.min(29, playerPos.x + off.dx));
                                          const spawnY = Math.max(0, Math.min(29, playerPos.y + off.dy));
                                          
                                          const summonName = countToSpawn > 1 ? `${skill} #${i + 1}` : skill;
                                          newSummons.push({
                                            id: `summon-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
                                            name: summonName,
                                            icon: summonIcon,
                                            x: spawnX,
                                            y: spawnY,
                                            category: 'Beschwörung & Illusion',
                                            description: `Beschworene Einheit / Klon aus "${skill}"`,
                                            rules: `Klon/Beschwörung (Aktiv)`,
                                            isSummon: true,
                                            summonOwner: adventure.player?.name || 'Spieler',
                                            sourceActionId: actionId
                                          });
                                        }

                                        onUpdateAdventure({
                                          ...adventure,
                                          combatState: {
                                            ...currentCombatState,
                                            placedObjects: [...existingPlaced, ...newSummons]
                                          } as any
                                        });
                                      }
                                    }}
                                    className={`text-left p-2 rounded-lg text-xs font-semibold border bg-slate-900/60 border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-950/20 text-slate-200 transition-all flex flex-col justify-between shadow-md hover:shadow-indigo-500/10 active:scale-95 duration-100 cursor-pointer ${!hasEnoughRes ? 'opacity-40 cursor-not-allowed' : ''}`}
                                    disabled={!hasEnoughRes || isLoading}
                                  >
                                    <div className="flex items-center justify-between w-full gap-1">
                                      <div className="font-bold truncate text-[10.5px] text-slate-200" title={skill}>
                                        {skill}
                                      </div>
                                      {isSummonTech && (
                                        <div 
                                          className="flex items-center gap-1 shrink-0 bg-slate-950/90 border border-indigo-500/50 rounded px-1.5 py-0.5"
                                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        >
                                          <span className="text-[9px] text-slate-400 font-medium select-none">Anzahl:</span>
                                          <input
                                            type="number"
                                            min={1}
                                            max={maxPossible}
                                            value={countToSpawn}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              const val = parseInt(e.target.value) || 1;
                                              const clamped = Math.max(1, Math.min(maxPossible, val));
                                              setSkillSummonCounts(prev => ({ ...prev, [skill]: clamped }));
                                            }}
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            className="w-7 bg-slate-900 text-center text-amber-300 font-mono font-bold text-[10px] outline-none rounded border border-slate-700/80 py-0 px-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-indigo-400"
                                            title={`Maximal ${maxPossible} Einheiten möglich`}
                                          />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center mt-1.5 pt-1 border-t border-slate-800/40 text-[9.5px] font-mono w-full">
                                      <span className={
                                        isSkillHeal 
                                          ? "text-emerald-400 font-extrabold" 
                                          : (skillType === 'Verteidigung' 
                                            ? "text-blue-400 font-extrabold" 
                                            : (skillType === 'Support' 
                                              ? "text-amber-400 font-extrabold" 
                                              : "text-rose-400 font-extrabold"))
                                      }>
                                        {isSummonTech ? `~${dmg} Dmg (${countToSpawn}x)` : effectLabel}
                                      </span>
                                      <span className="text-indigo-400 font-bold shrink-0">
                                        {finalMpCost} {costName || 'MP'}
                                      </span>
                                    </div>
                                  </button>
                                );
                              });
                            }

                            if (buttons.length === 0) {
                              const categoryTitle = 
                                activeSkillCategoryTab === 'techniken' ? 'Techniken' :
                                activeSkillCategoryTab === 'ultimative' ? 'Ultimative Techniken' : 'Transformationen';
                              
                              return (
                                <div className="col-span-full py-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/50">
                                  Keine <strong className="text-slate-300">{categoryTitle}</strong> für <strong className="text-amber-400">{activeCombatPowerSource.powerName || activeCombatPowerSource.source || 'Kraftquelle'}</strong> vorhanden.
                                </div>
                              );
                            }

                            return <>{buttons}</>;
                          })()}
                        </div>
                      </div>
                    );
                  })()}
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
                        {def === 'Blocken' && ''}
                        {def === 'Ausweichen' && ''}
                        {def === 'Parieren' && ''}
                        {def === 'Kontern' && ''}
                      </span>
                      <span>{def}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Local Inventory Category Tabs */}
                  {(() => {
                    const weaponsList = adventure.structuredInventory?.weapons || [];
                    const generalItemsList = adventure.structuredInventory?.generalItems || [];
                    const armorObj = adventure.structuredInventory?.armor || {};
                    const accessoriesObj = adventure.structuredInventory?.accessories || {};
                    const armorList = [
                      armorObj.head,
                      armorObj.chest,
                      armorObj.hands,
                      armorObj.legs,
                      armorObj.feet,
                    ].filter(Boolean) as string[];
                    const accessoriesList = [
                      accessoriesObj.finger,
                      accessoriesObj.wrist,
                      accessoriesObj.waist,
                      accessoriesObj.neck,
                      accessoriesObj.back,
                    ].filter(Boolean) as string[];
                    const equipmentList = [...armorList, ...accessoriesList];
                    const consumablesList = adventure.inventory || [];
                    const moneyAmount = adventure.structuredInventory?.money || 0;
                    const currencyLabel = adventure.structuredInventory?.currencyLabel || 'Goldstücke';

                    const showConsumables = combatInventoryTab === 'all' || combatInventoryTab === 'consumables';
                    const showWeapons = combatInventoryTab === 'all' || combatInventoryTab === 'weapons';
                    const showEquipment = combatInventoryTab === 'all' || combatInventoryTab === 'armor';
                    const showGeneral = combatInventoryTab === 'all' || combatInventoryTab === 'general';

                    return (
                      <>
                        <div className="flex flex-wrap gap-1 pb-1 border-b border-slate-900">
                          <button
                            type="button"
                            onClick={() => setCombatInventoryTab('all')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all shrink-0 border ${
                              combatInventoryTab === 'all'
                                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                             Alle ({consumablesList.length + weaponsList.length + equipmentList.length + generalItemsList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCombatInventoryTab('consumables')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all shrink-0 border ${
                              combatInventoryTab === 'consumables'
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                             Tränke ({consumablesList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCombatInventoryTab('weapons')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all shrink-0 border ${
                              combatInventoryTab === 'weapons'
                                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                             Waffen ({weaponsList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCombatInventoryTab('armor')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all shrink-0 border ${
                              combatInventoryTab === 'armor'
                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                             Ausrüstung ({equipmentList.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setCombatInventoryTab('general')}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all shrink-0 border ${
                              combatInventoryTab === 'general'
                                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                                : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-300'
                            }`}
                          >
                             Sonstiges ({generalItemsList.length})
                          </button>
                        </div>

                        {/* List Container */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                          {/* 1. Consumables */}
                          {showConsumables && (
                            <>
                              {consumablesList.length > 0 ? (
                                consumablesList.map((item, idx) => (
                                  <button
                                    key={`consumable-${item}-${idx}`}
                                    onClick={() => handleCombatAction('item', `Benutze ${item}`, 45, 0, true)}
                                    className="text-left p-2 rounded-lg text-xs font-semibold border border-emerald-900/30 bg-emerald-950/10 hover:border-emerald-500 hover:bg-emerald-900/20 text-slate-200 transition-all flex justify-between items-center"
                                    disabled={isLoading}
                                  >
                                    <span className="flex items-center gap-1.5"> {item}</span>
                                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">Heilt ~45 HP</span>
                                  </button>
                                ))
                              ) : (
                                combatInventoryTab === 'consumables' && (
                                  <div className="col-span-full py-4 text-center text-[11px] text-slate-500 italic">Keine Tränke vorhanden.</div>
                                )
                              )}
                            </>
                          )}

                          {/* 2. Weapons */}
                          {showWeapons && (
                            <>
                              {weaponsList.length > 0 ? (
                                weaponsList.map((weapon, idx) => (
                                  <button
                                    key={`weapon-${weapon}-${idx}`}
                                    onClick={() => handleCombatAction('attack', `Greife mit ${weapon} an`, 25, 0)}
                                    className="text-left p-2 rounded-lg text-xs font-semibold border border-red-900/30 bg-red-950/10 hover:border-red-500 hover:bg-red-900/20 text-slate-200 transition-all flex justify-between items-center"
                                    disabled={isLoading}
                                  >
                                    <span className="flex items-center gap-1.5"> {weapon}</span>
                                    <span className="text-[9px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-bold">Waffenangriff</span>
                                  </button>
                                ))
                              ) : (
                                combatInventoryTab === 'weapons' && (
                                  <div className="col-span-full py-4 text-center text-[11px] text-slate-500 italic">Keine Waffen vorhanden.</div>
                                )
                              )}
                            </>
                          )}

                          {/* 3. Equipment (Armor / Acc) */}
                          {showEquipment && (
                            <>
                              {equipmentList.length > 0 ? (
                                equipmentList.map((equip, idx) => (
                                  <button
                                    key={`equip-${equip}-${idx}`}
                                    onClick={() => handleCombatAction('item', `Nutze Ausrüstung: ${equip}`, 0, 0)}
                                    className="text-left p-2 rounded-lg text-xs font-semibold border border-indigo-900/30 bg-indigo-950/10 hover:border-indigo-500 hover:bg-indigo-900/20 text-slate-200 transition-all flex justify-between items-center"
                                    disabled={isLoading}
                                  >
                                    <span className="flex items-center gap-1.5"> {equip}</span>
                                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-bold">Ausrüstung</span>
                                  </button>
                                ))
                              ) : (
                                combatInventoryTab === 'armor' && (
                                  <div className="col-span-full py-4 text-center text-[11px] text-slate-500 italic">Keine Ausrüstung vorhanden.</div>
                                )
                              )}
                            </>
                          )}

                          {/* 4. General Items */}
                          {showGeneral && (
                            <>
                              {generalItemsList.length > 0 ? (
                                generalItemsList.map((item, idx) => (
                                  <button
                                    key={`general-${item}-${idx}`}
                                    onClick={() => handleCombatAction('item', `Verwende ${item}`, 0, 0)}
                                    className="text-left p-2 rounded-lg text-xs font-semibold border border-cyan-900/30 bg-cyan-950/10 hover:border-cyan-500 hover:bg-cyan-900/20 text-slate-200 transition-all flex justify-between items-center"
                                    disabled={isLoading}
                                  >
                                    <span className="flex items-center gap-1.5"> {item}</span>
                                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-bold">Gegenstand</span>
                                  </button>
                                ))
                              ) : (
                                combatInventoryTab === 'general' && (
                                  <div className="col-span-full py-4 text-center text-[11px] text-slate-500 italic">Keine sonstigen Gegenstände vorhanden.</div>
                                )
                              )}
                            </>
                          )}

                          {/* 5. Empty Inventory Check */}
                          {consumablesList.length === 0 && weaponsList.length === 0 && equipmentList.length === 0 && generalItemsList.length === 0 && (
                            <div className="col-span-full py-6 flex flex-col items-center justify-center gap-2">
                              <span className="text-xl"></span>
                              <div className="text-center text-[11px] text-slate-500 italic">Dein Inventar ist komplett leer!</div>
                              <button
                                onClick={() => handleCombatAction('item', 'Heiltrank', 40, 0, true)}
                                className="mt-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-850 hover:border-amber-500 hover:bg-amber-950/10 text-[10.5px] text-slate-300 font-semibold transition-all flex items-center gap-1"
                                disabled={isLoading}
                              >
                                <span> Behelfs-Heiltrank nutzen</span>
                                <span className="text-[9px] font-mono text-amber-500">(Heilt ~40 HP)</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Wallet */}
                        <div className="flex justify-between items-center bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-900/80 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1"><i className="fa-solid fa-wallet text-amber-500"></i> Geldbeutel:</span>
                          <span className="text-amber-400 font-mono text-[11px]">{moneyAmount} {currencyLabel}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Status banner for the active prefilled combat actions in the queue */}
              {queuedCombatActions.length > 0 ? (
                <div className="bg-slate-900/95 border border-amber-550/40 rounded-xl p-3 space-y-2.5 text-xs animate-in slide-in-from-bottom-2 duration-150 shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="font-extrabold text-amber-400 uppercase tracking-widest text-[9.5px] flex items-center gap-1.5">
                      <span className="animate-pulse"></span> GELADENE KOMBINATION ({queuedCombatActions.length})
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
                            {act.actionType === 'attack' && ''}
                            {act.actionType === 'skill' && ''}
                            {act.actionType === 'defend' && ''}
                            {act.actionType === 'item' && ''}
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
                            
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary row */}
                  {/* Summary row */}
                  {(() => {
                    const totalDmg = queuedCombatActions.reduce((sum, a) => sum + (a.isHeal ? 0 : a.dmgDealt), 0);
                    const totalHeal = queuedCombatActions.reduce((sum, a) => sum + (a.isHeal ? a.dmgDealt : 0), 0);
                    const totalMp = queuedCombatActions.reduce((sum, a) => sum + a.mpCost, 0);

                    return (
                      <div className="flex justify-between items-center text-[10px] text-slate-400 bg-slate-950/40 p-1.5 rounded border border-slate-850/80 font-mono">
                        <span>Zusammenfassung:</span>
                        <div className="flex gap-3 items-center">
                          {totalDmg > 0 && <span className="text-red-400 font-bold">{totalDmg} DMG</span>}
                          {totalHeal > 0 && <span className="text-emerald-400 font-bold">+{totalHeal} HP</span>}
                          {totalMp !== 0 && (
                            <span className={totalMp > 0 ? "text-indigo-400 font-bold" : "text-emerald-400 font-bold"}>
                              {totalMp > 0 ? `${totalMp} MP` : `+${Math.abs(totalMp)} MP`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}

              {/* Combat Action Input & Send Deck */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2">
                <AutoExpandingTextarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Kombination ausführen oder freie Kampfhandlung beschreiben..."
                  className="flex-1 bg-transparent border-none px-3 py-1.5 text-xs text-white outline-none resize-none placeholder:text-slate-500 max-h-28"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleCancelCombat}
                  disabled={isLoading}
                  className="px-3 py-2.5 bg-slate-950 hover:bg-red-950/60 border border-slate-800 hover:border-red-800/60 text-slate-400 hover:text-red-200 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow shrink-0 active:scale-95 disabled:opacity-50"
                  title="Kampf abbrechen und zum normalen Chat zurückkehren"
                >
                  <i className="fa-solid fa-xmark text-red-400 text-xs"></i>
                  <span>Kampf abbrechen</span>
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isLoading || (!inputText.trim() && queuedCombatActions.length === 0)}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer shadow shrink-0"
                >
                  <i className={`fa-solid ${isLoading ? 'fa-spinner animate-spin' : 'fa-bolt'}`}></i>
                  <span>Zug ausführen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Detail Popup Modal (Step 7: Compact Detail-Popup) */}
      {selectedHudDetailField && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                  <i className={`fa-solid ${selectedHudDetailField.icon} ${selectedHudDetailField.colorClass}`}></i>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-amber-500 block">
                    {selectedHudDetailField.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">
                    {selectedHudDetailField.label}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHudDetailField(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Modal Content - Structured Key Details */}
            <div className="p-5 space-y-4">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">
                  Aktuelle Details
                </span>
                <div className="space-y-2 text-xs max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                  {selectedHudDetailField.details.map((dt, dIdx) => (
                    <div key={dIdx} className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-1.5 border-b border-slate-800/60 last:border-0 gap-1">
                      <span className="text-slate-400 font-medium shrink-0 max-w-[150px]">{dt.label}</span>
                      <span className="text-slate-200 font-bold font-mono text-left sm:text-right break-words">{dt.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable input field if applicable */}
              {selectedHudDetailField.isEditable && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">
                    Wert anpassen
                  </label>
                  <AutoExpandingTextarea
                    value={hudModalEditValue}
                    onChange={(e) => setHudModalEditValue(e.target.value)}
                    placeholder="Neuen Wert eingeben..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 px-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              {selectedHudDetailField.isEditable && (
                <button
                  type="button"
                  onClick={() => {
                    const elId = selectedHudDetailField.elementId || selectedHudDetailField.id;
                    const elLabel = selectedHudDetailField.label;
                    const newVal = hudModalEditValue.trim();

                    let updatedStatus = [...(adventure.statusElements || [])];
                    const itemIdx = updatedStatus.findIndex(item => (item.id === elId || item.label === elLabel));
                    if (itemIdx > -1) {
                      updatedStatus[itemIdx] = { ...updatedStatus[itemIdx], value: newVal };
                    } else {
                      updatedStatus.push({ id: elId || Math.random().toString(36).substr(2, 9), label: elLabel, value: newVal });
                    }

                    let updatedPlayer = adventure.player;
                    let updatedLore = adventure.loreDatabase;
                    let updatedStructuredInventory = adventure.structuredInventory;

                    const isMoney = elLabel.toLowerCase().includes('vermögen') || elLabel.toLowerCase().includes('geld') || elLabel.toLowerCase().includes('gold') || elLabel.toLowerCase().includes('berry') || elLabel.toLowerCase().includes('münzen') || elLabel.toLowerCase().includes('credits');
                    const isLocation = elLabel.toLowerCase().includes('standort') || elLabel.toLowerCase().includes('ort');

                    if (isMoney) {
                      const numMatch = newVal.match(/\d+/);
                      const parsedMoney = numMatch ? parseInt(numMatch[0]) : (adventure.structuredInventory?.money ?? 0);
                      const textMatch = newVal.replace(/\d+/g, '').trim();
                      updatedStructuredInventory = {
                        ...(adventure.structuredInventory || {}),
                        money: parsedMoney,
                        currencyLabel: textMatch || adventure.structuredInventory?.currencyLabel || 'Goldstücke'
                      };
                    }

                    if (isLocation) {
                      updatedPlayer = {
                        ...adventure.player,
                        appearance: {
                          ...adventure.player.appearance,
                          currentLocation: newVal
                        }
                      };
                      if (updatedLore) {
                        const loreIdx = updatedLore.findIndex(entry => entry.category === 'Charaktere' && entry.title === adventure.player.name);
                        if (loreIdx > -1) {
                          updatedLore = [...updatedLore];
                          updatedLore[loreIdx] = {
                            ...updatedLore[loreIdx],
                            details: {
                              ...(updatedLore[loreIdx].details || {}),
                              currentLocation: newVal
                            }
                          };
                        }
                      }
                    }

                    onUpdateAdventure({
                      ...adventure,
                      player: updatedPlayer,
                      loreDatabase: updatedLore,
                      statusElements: updatedStatus,
                      structuredInventory: updatedStructuredInventory
                    });

                    setSelectedHudDetailField(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Speichern
                </button>
              )}

              {selectedHudDetailField.actionType === 'silhouette' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHudDetailField(null);
                    setShowSilhouetteModal(true);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-child-body text-xs"></i>
                  <span>Silhouette & Details</span>
                </button>
              )}

              {selectedHudDetailField.actionType === 'emotion' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHudDetailField(null);
                    setShowEmotionMenu(true);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-face-smile text-xs"></i>
                  <span>Emotion ändern</span>
                </button>
              )}

              {selectedHudDetailField.actionType === 'tone' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHudDetailField(null);
                    setShowToneMenu(true);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-microphone-lines text-xs"></i>
                  <span>Tonart ändern</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedHudDetailField(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {showWorkMenu && (
        <WorkManagementModal
          isOpen={showWorkMenu}
          onClose={() => setShowWorkMenu(false)}
          adventure={adventure}
          onUpdateAdventure={onUpdateAdventure}
          onSendChatMessage={(text: string) => {
            if (isDialogueActive) {
              handleSendDialogue(text);
            } else {
              handleSend(text);
            }
          }}
          onSetInputText={(text: string) => {
            setInputText(text);
          }}
        />
      )}

      {showSilhouetteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-child-body text-indigo-400 text-sm"></i>
                <span className="font-extrabold text-white text-sm">Körper-Silhouette & Physischer Status</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSilhouetteModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <BodySilhouette
                player={adventure.player}
                loreDatabase={adventure.loreDatabase}
                npcs={adventure.npcs}
                costResources={adventure.world?.costResources}
                world={adventure.world}
                onUpdateLore={updatedLore => onUpdateAdventure({ ...adventure, loreDatabase: updatedLore })}
                onUpdateNpcs={updatedNpcs => onUpdateAdventure({ ...adventure, npcs: updatedNpcs })}
                onUpdatePlayer={updatedPlayer => onUpdateAdventure({ ...adventure, player: updatedPlayer })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
