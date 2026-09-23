import { Adventure, WorldSetting, NPC, ChatMessage, LoreEntry } from '../types';
import { WorldSimulationService, SimulationStepResult } from './worldSimulationService';
import { GeminiService } from './geminiService';
import { TravelService, RouteResolution } from './travelService';
import { CharacterKnowledgeService } from './characterKnowledgeService';
import { LocationContextService } from './locationContextService';
import { ActiveTimeEventService } from './activeTimeEventService';
import { STRUCTURED_STORY_STATE_DIRECTIVE } from './aiStoryStateProcessor';
import type { ProcessPlayerTurnParams, ProcessPlayerTurnResult } from './turnTypes';

export type { ProcessPlayerTurnParams, ProcessPlayerTurnResult };


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
      destinationIdOrName,
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

    if (mode === 'travel' || destinationIdOrName) {
      const dest = destinationIdOrName || actionText.replace(/^(ich reise nach|reise nach|gehe nach)\s+/i, '').trim();
      return TravelService.executeTravelTurn({
        ...params,
        destinationIdOrName: dest
      });
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
    const currentLocName = adventure.currentLocation?.locationName || adventure.world?.locations?.[0]?.name;
    const simResult = mode === 'dialogue'
      ? WorldSimulationService.runSimulationStep({
          world: adventure.world,
          adventure,
          currentLocationName: currentLocName,
          mode: 'dialogue',
          dialogueParticipantCount: activeParticipantCount,
          actionText
        })
      : WorldSimulationService.runSimulationStep({
          world: adventure.world,
          adventure,
          currentLocationName: currentLocName,
          mode: 'action',
          actionText
        });

    const activeWorld = simResult.updatedWorld;
    const currentAdventure = simResult.updatedAdventure || {
      ...adventure,
      world: activeWorld,
      worldTime: activeWorld.worldTime,
      activeTimeEvents: activeWorld.activeTimeEvents || adventure.activeTimeEvents || []
    };

    // Step 3: Construct messages and AI prompt
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      text: actionText,
      isDialogue: mode === 'dialogue',
      dialogueType,
      dialogueSpeakerId: mode === 'dialogue' ? (dialogueType === 'user_npc' ? 'player' : speakerNpc?.id) : undefined,
      dialogueSpeakerName: mode === 'dialogue' ? (dialogueType === 'user_npc' ? (currentAdventure.player?.nickname || currentAdventure.player?.name) : speakerName) : undefined,
      dialogueTargetId: mode === 'dialogue' ? targetNpc?.id : undefined,
      dialogueTargetName: targetName,
      dialogueParticipantIds: mode === 'dialogue' ? (
        dialogueType === 'group'
          ? (Array.isArray(groupNpcs) ? groupNpcs.map((n: any) => n?.id).filter(Boolean) : [])
          : (dialogueType === 'npc_npc' ? [speakerNpc?.id, targetNpc?.id].filter(Boolean) : ['player', speakerNpc?.id].filter(Boolean))
      ) : undefined
    };

    const currentChatHistory = currentAdventure.chatHistory || [];
    const updatedMessagesForAi = [...currentChatHistory, userMsg];

    let rawAiResponse = '';

    const ateContext = ActiveTimeEventService.getATEContextForAI(currentAdventure);
    const timeBlock = WorldSimulationService.formatWorldTimeBlockForAI(activeWorld.worldTime);
    const appointmentsBlock = WorldSimulationService.formatUpcomingEventsBlockForAI(activeWorld);

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
        const currentStatsStr = (currentAdventure.statusElements || []).map(el => `${el.label}: ${el.value || '0'}`).join(' | ');
        const campaignPowerInstruction = activeWorld.campaignPowerSettings ? "Grundwerte: " + JSON.stringify(activeWorld.campaignPowerSettings) : "";
        
        const locationContext = LocationContextService.resolveCurrentLocation(currentAdventure);
        const locationBlock = LocationContextService.formatLocationPromptBlock(locationContext, 'DIALOG');

        let systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${activeWorld.title || currentAdventure.world.title}".
${simulationInstruction}
WELT: ${activeWorld.description || currentAdventure.world.description} (Ton: ${activeWorld.tone || currentAdventure.world.tone})
${campaignPowerInstruction}

${locationBlock}

${timeBlock}
${appointmentsBlock}

SPIELER-CHARAKTER:
${currentAdventure.player.name} (${currentAdventure.player.role}). 
- Bio: ${currentAdventure.player.bio}
- Aktuelle Lage: ${currentAdventure.player.currentSituation}
- Ziel: ${currentAdventure.player.goal}

AKTUELLE WERTE: ${currentStatsStr}

WICHTIGSTE REGEL:
Halte dich STRIKT an die Anweisung, AUSSCHLIESSLICH gesprochenes Wort auszugeben! Keine Erzählungen, keine Handlungen in Sternchen, keine Szenenbeschreibungen. Nur der nackte, gesprochene Text.`;

        if (ateContext) {
          systemInstruction += `\n\n${ateContext}`;
        }

        const response = await GeminiService.chat(updatedMessagesForAi, systemInstruction, activeWorld.isNsfw, currentAdventure.summaryLog);
        rawAiResponse = response.text || '';
      } else {
        let simulationInstruction = '';
        if (simResult.playerVisibleSummary) {
          simulationInstruction = `\nDYNAMISCHE WELT-SIMULATION & EREIGNISSE (EINGETRETEN IN DIESEM ZUG):\n${simResult.playerVisibleSummary}\n`;
        }
        const currentStatsStr = (currentAdventure.statusElements || []).map(el => `${el.label}: ${el.value || '0'}`).join(' | ');
        const campaignPowerInstruction = activeWorld.campaignPowerSettings ? "Grundwerte: " + JSON.stringify(activeWorld.campaignPowerSettings) : "";
        const locationContext = LocationContextService.resolveCurrentLocation(currentAdventure);
        const locationBlock = LocationContextService.formatLocationPromptBlock(
          locationContext,
          currentAdventure.combatState?.isCombatActive ? 'COMBAT' : 'STORY'
        );

        let systemInstruction = `Du bist ein Weltklasse Dungeon Master für "${activeWorld.title || currentAdventure.world.title}".
${simulationInstruction}
WELT: ${activeWorld.description || currentAdventure.world.description} (Ton: ${activeWorld.tone || currentAdventure.world.tone})
${campaignPowerInstruction}

${locationBlock}

${timeBlock}
${appointmentsBlock}

SPIELER-CHARAKTER:
${currentAdventure.player.name} (${currentAdventure.player.role}). 
- Bio: ${currentAdventure.player.bio}
- Aktuelle Lage: ${currentAdventure.player.currentSituation}
- Ziel: ${currentAdventure.player.goal}

AKTUELLE WERTE: ${currentStatsStr}

${STRUCTURED_STORY_STATE_DIRECTIVE}`;

        if (ateContext) {
          systemInstruction += `\n\n${ateContext}`;
        }

        const response = await GeminiService.chat(
          updatedMessagesForAi,
          systemInstruction,
          activeWorld.isNsfw,
          currentAdventure.summaryLog
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
      parsedResult = parserFn(rawAiResponse, currentAdventure, playerHp, playerMp, activeWorld);
    } else {
      // Basic fallback merge if no parser function provided
      parsedResult = {
        cleanedText: rawAiResponse.trim(),
        updatedLore: currentAdventure.loreDatabase || [],
        updatedPlayer: currentAdventure.player,
        updatedNpcs: currentAdventure.npcs || [],
        notifications: [],
        updatedStructuredInventory: currentAdventure.structuredInventory,
        updatedWorld: activeWorld
      };
    }

    // Clean any AI knowledge tags from display text
    const cleanDisplay = parsedResult.cleanedText.replace(/\[\[KNOWLEDGE_ADD:[^\]]+\]\]/gi, '').trim();

    // Step 5: Construct model message and updated Adventure state
    const modelMsg: ChatMessage = {
      id: `${mode}-model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'model',
      text: cleanDisplay,
      isDialogue: mode === 'dialogue',
      dialogueType,
      dialogueSpeakerId: mode === 'dialogue' ? (dialogueType === 'user_npc' ? speakerNpc?.id : undefined) : undefined,
      dialogueSpeakerName: mode === 'dialogue' ? (dialogueType === 'user_npc' ? speakerName : undefined) : undefined,
      dialogueTargetId: mode === 'dialogue' ? (dialogueType === 'user_npc' ? 'player' : targetNpc?.id) : undefined,
      dialogueTargetName: mode === 'dialogue' ? (dialogueType === 'user_npc' ? (adventure.player?.nickname || adventure.player?.name) : targetName) : undefined,
      dialogueParticipantIds: mode === 'dialogue' ? (
        dialogueType === 'group'
          ? (Array.isArray(groupNpcs) ? groupNpcs.map((n: any) => n?.id).filter(Boolean) : [])
          : (dialogueType === 'npc_npc' ? [speakerNpc?.id, targetNpc?.id].filter(Boolean) : ['player', speakerNpc?.id].filter(Boolean))
      ) : undefined
    };

    const finalChatHistory = [...updatedMessagesForAi, modelMsg];

    let updatedAdventure: Adventure = {
      ...currentAdventure,
      world: parsedResult.updatedWorld,
      player: parsedResult.updatedPlayer,
      npcs: parsedResult.updatedNpcs,
      loreDatabase: parsedResult.updatedLore,
      structuredInventory: parsedResult.updatedStructuredInventory,
      chatHistory: finalChatHistory
    };
    updatedAdventure.worldTime = updatedAdventure.world.worldTime;


    // Step 5b: Parse Character Knowledge tags from AI response
    updatedAdventure = CharacterKnowledgeService.parseKnowledgeTagsFromAI(rawAiResponse, updatedAdventure);

    // Step 5c: Synchronize central location context
    const latestLocStr = parsedResult.updatedPlayer?.appearance?.currentLocation;
    if (latestLocStr && latestLocStr !== adventure.player?.appearance?.currentLocation) {
      updatedAdventure = LocationContextService.updateCurrentLocation(updatedAdventure, latestLocStr);
    } else {
      const currentContext = LocationContextService.resolveCurrentLocation(updatedAdventure);
      updatedAdventure = LocationContextService.updateCurrentLocation(updatedAdventure, currentContext);
    }

    // Step 6: Atomic persistence call on success
    if (saveAdventure) {
      await saveAdventure(updatedAdventure);
    }

    return {
      updatedAdventure,
      activeWorld: parsedResult.updatedWorld,
      simResult,
      rawAiResponse,
      cleanedText: cleanDisplay,
      notifications: parsedResult.notifications || [],
      userMsg,
      modelMsg
    };
  }
}
