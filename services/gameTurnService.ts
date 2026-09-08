import { Adventure, WorldSetting, NPC, ChatMessage, LoreEntry } from '../types';
import { WorldSimulationService, SimulationStepResult } from './worldSimulationService';
import { GeminiService } from './geminiService';

export interface ProcessPlayerTurnParams {
  adventure: Adventure;
  mode: 'action' | 'dialogue';
  actionText?: string;
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
}

export class GameTurnService {
  /**
   * Executes a complete, atomic production turn for the player.
   * Pipeline:
   * 1. Calculate active dialogue participants (if dialogue) or action mode
   * 2. EXACTLY ONE WorldSimulationService.runSimulationStep call
   * 3. Derive activeWorld snapshot
   * 4. Call Gemini AI with activeWorld
   * 5. Run parser with activeWorld as worldOverride
   * 6. Construct updated Adventure state
   * 7. Trigger persistence if callback provided
   */
  public static async processPlayerTurn(params: ProcessPlayerTurnParams): Promise<ProcessPlayerTurnResult> {
    const {
      adventure,
      mode,
      actionText = '',
      dialogueType,
      speakerNpc,
      targetNpc,
      groupNpcs = [],
      speakerName,
      targetName,
      playerHp,
      playerMp,
      generateAiResponse,
      parserFn,
      saveAdventure
    } = params;

    if (!adventure || !adventure.world) {
      throw new Error("Ungültiger Abenteuer-Zustand für Spielerzug.");
    }

    // Step 1: Calculate active dialogue participants & simulation parameters
    let activeParticipantCount = 1;
    if (mode === 'dialogue') {
      let activeNpcs: (NPC | any)[] = [];
      if (dialogueType === 'user_npc') {
        if (speakerNpc) activeNpcs.push(speakerNpc);
      } else if (dialogueType === 'npc_npc') {
        if (speakerNpc) activeNpcs.push(speakerNpc);
        if (targetNpc && targetNpc.id !== speakerNpc?.id) activeNpcs.push(targetNpc);
      } else if (dialogueType === 'group') {
        activeNpcs = Array.isArray(groupNpcs) ? groupNpcs : [];
      }
      const uniqueActiveNpcIds = new Set(activeNpcs.map(n => n?.id || n?.name).filter(Boolean));
      activeParticipantCount = 1 + uniqueActiveNpcIds.size;
    }

    // Step 2: EXACTLY ONE WorldSimulationStep call
    const simResult = mode === 'dialogue'
      ? WorldSimulationService.runSimulationStep({
          world: adventure.world,
          mode: 'dialogue',
          dialogueParticipantCount: activeParticipantCount,
          actionText
        })
      : WorldSimulationService.runSimulationStep({
          world: adventure.world,
          mode: 'action',
          actionText
        });

    const activeWorld = simResult.updatedWorld;

    // Step 3: Construct messages and AI prompt
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      text: actionText,
      isDialogue: mode === 'dialogue',
      dialogueType,
      dialogueSpeakerName: speakerName,
      dialogueTargetName: targetName
    };

    const currentChatHistory = adventure.chatHistory || [];
    const updatedMessagesForAi = [...currentChatHistory, userMsg];

    let rawAiResponse = '';

    if (generateAiResponse) {
      rawAiResponse = await generateAiResponse({
        messages: updatedMessagesForAi,
        activeWorld
      });
    } else {
      // Default production AI invocation
      if (mode === 'dialogue') {
        let simulationInstruction = '';
        if (simResult.playerVisibleSummary) {
          simulationInstruction = `\nDYNAMISCHE WELT-SIMULATION & EREIGNISSE (EINGETRETEN IN DIESEM ZUG):\n${simResult.playerVisibleSummary}\n`;
        }
        const currentStatsStr = (adventure.statusElements || []).map(el => `${el.label}: ${el.value || '0'}`).join(' | ');
        const campaignPowerInstruction = activeWorld.campaignPowerSettings ? "Grundwerte: " + JSON.stringify(activeWorld.campaignPowerSettings) : "";
        
        const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${activeWorld.title || adventure.world.title}".
${simulationInstruction}
WELT: ${activeWorld.description || adventure.world.description} (Ton: ${activeWorld.tone || adventure.world.tone})
${campaignPowerInstruction}

SPIELER-CHARAKTER:
${adventure.player.name} (${adventure.player.role}). 
- Bio: ${adventure.player.bio}
- Aktuelle Lage: ${adventure.player.currentSituation}
- Ziel: ${adventure.player.goal}

AKTUELLE WERTE: ${currentStatsStr}

WICHTIGSTE REGEL:
Halte dich STRIKT an die Anweisung, AUSSCHLIESSLICH gesprochenes Wort auszugeben! Keine Erzählungen, keine Handlungen in Sternchen, keine Szenenbeschreibungen. Nur der nackte, gesprochene Text.`;

        const response = await GeminiService.chat(updatedMessagesForAi, systemInstruction, activeWorld.isNsfw, adventure.summaryLog);
        rawAiResponse = response.text || '';
      } else {
        let simulationInstruction = '';
        if (simResult.playerVisibleSummary) {
          simulationInstruction = `\nDYNAMISCHE WELT-SIMULATION & EREIGNISSE (EINGETRETEN IN DIESEM ZUG):\n${simResult.playerVisibleSummary}\n`;
        }
        const currentStatsStr = (adventure.statusElements || []).map(el => `${el.label}: ${el.value || '0'}`).join(' | ');
        const campaignPowerInstruction = activeWorld.campaignPowerSettings ? "Grundwerte: " + JSON.stringify(activeWorld.campaignPowerSettings) : "";

        const systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${activeWorld.title || adventure.world.title}".
${simulationInstruction}
WELT: ${activeWorld.description || adventure.world.description} (Ton: ${activeWorld.tone || adventure.world.tone})
${campaignPowerInstruction}

SPIELER-CHARAKTER:
${adventure.player.name} (${adventure.player.role}). 
- Bio: ${adventure.player.bio}
- Aktuelle Lage: ${adventure.player.currentSituation}
- Ziel: ${adventure.player.goal}

AKTUELLE WERTE: ${currentStatsStr}`;

        const response = await GeminiService.chat(
          updatedMessagesForAi,
          systemInstruction,
          activeWorld.isNsfw,
          adventure.summaryLog
        );
        rawAiResponse = response.text || '';
      }
    }

    // Step 4: Parse AI response using production parser with activeWorld as worldOverride
    let parsedResult: {
      cleanedText: string;
      updatedLore: LoreEntry[];
      updatedPlayer: any;
      updatedNpcs: NPC[];
      notifications: any[];
      updatedStructuredInventory: any;
      updatedCombatState?: any;
      updatedWorld: WorldSetting;
    };

    if (parserFn) {
      parsedResult = parserFn(rawAiResponse, adventure, playerHp, playerMp, activeWorld);
    } else {
      // Basic fallback merge if no parser function provided
      parsedResult = {
        cleanedText: rawAiResponse.trim(),
        updatedLore: adventure.loreDatabase || [],
        updatedPlayer: adventure.player,
        updatedNpcs: adventure.npcs || [],
        notifications: [],
        updatedStructuredInventory: adventure.structuredInventory,
        updatedWorld: activeWorld
      };
    }

    // Step 5: Construct model message and updated Adventure state
    const modelMsg: ChatMessage = {
      id: `${mode}-model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'model',
      text: parsedResult.cleanedText,
      isDialogue: mode === 'dialogue',
      dialogueType,
      dialogueSpeakerName: speakerName,
      dialogueTargetName: targetName
    };

    const finalChatHistory = [...updatedMessagesForAi, modelMsg];

    const updatedAdventure: Adventure = {
      ...adventure,
      world: parsedResult.updatedWorld,
      player: parsedResult.updatedPlayer,
      npcs: parsedResult.updatedNpcs,
      loreDatabase: parsedResult.updatedLore,
      structuredInventory: parsedResult.updatedStructuredInventory,
      chatHistory: finalChatHistory
    };

    // Step 6: Atomic persistence call on success
    if (saveAdventure) {
      await saveAdventure(updatedAdventure);
    }

    return {
      updatedAdventure,
      activeWorld: parsedResult.updatedWorld,
      simResult,
      rawAiResponse,
      cleanedText: parsedResult.cleanedText,
      notifications: parsedResult.notifications || [],
      userMsg,
      modelMsg
    };
  }
}
