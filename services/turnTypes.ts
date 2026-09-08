import { Adventure, WorldSetting, NPC, ChatMessage, LoreEntry } from '../types';
import { SimulationStepResult } from './worldSimulationService';
import type { RouteResolution } from './travelService';

export interface ProcessPlayerTurnParams {
  adventure: Adventure;
  mode: 'action' | 'dialogue' | 'travel';
  actionText?: string;
  destinationIdOrName?: string;
  dialogueType?: 'user_npc' | 'npc_npc' | 'group';
  speakerNpc?: NPC | any;
  targetNpc?: NPC | any;
  groupNpcs?: (NPC | any)[];
  speakerName?: string;
  targetName?: string;
  playerHp?: number;
  playerMp?: number;
  
  // Dependency Injections for Testing & Storage
  generateAiResponse?: (promptContext: {
    systemInstruction?: string;
    messages: ChatMessage[];
    activeWorld: WorldSetting;
  }) => Promise<string>;
  
  parserFn?: (
    text: string, 
    currentAdventure: Adventure, 
    forceHp?: number, 
    forceMp?: number, 
    worldOverride?: WorldSetting
  ) => {
    cleanedText: string;
    updatedLore: LoreEntry[];
    updatedPlayer: any;
    updatedNpcs: NPC[];
    notifications: any[];
    updatedStructuredInventory: any;
    updatedCombatState?: any;
    updatedWorld: WorldSetting;
  };
  
  saveAdventure?: (updatedAdventure: Adventure) => Promise<void> | void;
}

export interface ProcessPlayerTurnResult {
  updatedAdventure: Adventure;
  activeWorld: WorldSetting;
  simResult: SimulationStepResult;
  rawAiResponse: string;
  cleanedText: string;
  notifications: any[];
  userMsg: ChatMessage;
  modelMsg: ChatMessage;
  routeResolution?: RouteResolution;
  isInterrupted?: boolean;
  interruptedAtLocation?: string;
}
