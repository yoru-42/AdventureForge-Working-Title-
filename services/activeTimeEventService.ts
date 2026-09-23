import {
  ActiveTimeEvent,
  ATEStage,
  ATEParticipant,
  ATEStatus,
  ATECategory,
  ATERevealLevel,
  Adventure,
  WorldTime,
  ATEConvergenceCondition
} from '../types';
import { CharacterKnowledgeService } from './characterKnowledgeService';
import { WorldSimulationService } from './worldSimulationService';

export interface ATEEvaluationResult {
  updatedAdventure: Adventure;
  advancedATEs: ActiveTimeEvent[];
  newCluesGenerated: string[];
  convergedATEs: ActiveTimeEvent[];
}

export class ActiveTimeEventService {
  /**
   * Helper to ensure activeTimeEvents array is synchronized between adventure.activeTimeEvents and adventure.world.activeTimeEvents
   */
  public static getActiveTimeEvents(adventure: Adventure): ActiveTimeEvent[] {
    if (adventure.activeTimeEvents && Array.isArray(adventure.activeTimeEvents)) {
      return adventure.activeTimeEvents;
    }
    if (adventure.world?.activeTimeEvents && Array.isArray(adventure.world.activeTimeEvents)) {
      return adventure.world.activeTimeEvents;
    }
    return [];
  }

  /**
   * Helper to update ATE array back onto adventure object
   */
  public static setActiveTimeEvents(adventure: Adventure, ates: ActiveTimeEvent[]): Adventure {
    const cloned = { ...adventure, activeTimeEvents: ates };
    if (cloned.world) {
      cloned.world = { ...cloned.world, activeTimeEvents: ates };
    }
    return cloned;
  }

  /**
   * Creates a new ActiveTimeEvent with default grounding, stages, participants and motivations.
   */
  public static createATE(params: {
    id?: string;
    title: string;
    summary: string;
    category?: ATECategory;
    status?: ATEStatus;
    revealLevel?: ATERevealLevel;
    originLocationId?: string;
    originLocationName?: string;
    backgroundContext?: string;
    participants?: Partial<ATEParticipant>[];
    stages?: Partial<ATEStage>[];
    convergenceCondition?: string;
    structuredConvergenceCondition?: ATEConvergenceCondition;
    convergenceConsequence?: string;
    worldTime?: WorldTime;
  }): ActiveTimeEvent {
    const id = params.id || `ate_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const currentTime = params.worldTime ? { day: params.worldTime.day, hour: params.worldTime.hour, minute: params.worldTime.minute } : { day: 1, hour: 8, minute: 0 };

    const formattedParticipants: ATEParticipant[] = (params.participants || []).map((p, idx) => ({
      id: p.id || `part_${id}_${idx + 1}`,
      characterId: p.characterId,
      characterName: p.characterName || 'Unbekannte Person',
      factionId: p.factionId,
      factionName: p.factionName,
      goal: p.goal || 'Verfolgt eigene Interessen im Hintergrund',
      motivation: p.motivation || 'Handelt aus Selbsterhaltung und Verantwortung',
      knowledgeState: p.knowledgeState || 'Beweist allgemeine Kenntnis der lokalen Umstände',
      attitudeToPlayer: p.attitudeToPlayer || 'unaware',
      currentLocationName: p.currentLocationName || params.originLocationName || 'Unbekannter Ort',
      nextStep: p.nextStep || 'Plant den nächsten Schritt'
    }));

    const formattedStages: ATEStage[] = (params.stages || []).map((s, idx) => ({
      stageIndex: s.stageIndex ?? idx,
      title: s.title || `Phase ${idx + 1}`,
      description: s.description || 'Der Handlungsstrang entwickelt sich im Hintergrund weiter.',
      internalTruth: s.internalTruth || s.description || 'Interne Entwicklung ohne direkte Spielerinteraktion.',
      triggerConditionText: s.triggerConditionText || 'Zeitablauf oder Ortswechsel',
      triggerTimeMinutes: s.triggerTimeMinutes ?? (idx === 0 ? 0 : 120),
      triggerLocations: s.triggerLocations || [],
      triggerFacts: s.triggerFacts || [],
      foreshadowingClues: s.foreshadowingClues || [],
      revealedToPlayer: s.revealedToPlayer || false,
      executedAtWorldTime: idx === 0 ? currentTime : undefined
    }));

    if (formattedStages.length === 0) {
      formattedStages.push({
        stageIndex: 0,
        title: 'Ausgangslage',
        description: 'Der Hintergrundprozess beginnt.',
        internalTruth: 'Die ersten Beteiligten nehmen ihre Arbeit auf.',
        triggerConditionText: 'Aktivierung',
        triggerTimeMinutes: 0,
        revealedToPlayer: false,
        executedAtWorldTime: currentTime
      });
    }

    return {
      id,
      title: params.title,
      summary: params.summary,
      category: params.category || 'investigation',
      status: params.status || 'active',
      revealLevel: params.revealLevel || 'hidden',
      currentStageIndex: 0,
      stages: formattedStages,
      participants: formattedParticipants,
      originLocationId: params.originLocationId,
      originLocationName: params.originLocationName,
      backgroundContext: params.backgroundContext || 'Etablierte Hintergrundgeschichte in der Spielwelt.',
      convergenceCondition: params.convergenceCondition || 'Sobald der Spieler und die Beteiligten aufeinandertreffen und Vorbereitungen abgeschlossen sind.',
      structuredConvergenceCondition: params.structuredConvergenceCondition,
      convergenceConsequence: params.convergenceConsequence || 'Der Handlungsstrang bricht direkt in das Hauptgeschehen ein.',
      isConverged: false,
      playerImpactLogs: [],
      createdAtWorldTime: currentTime,
      lastUpdatedWorldTime: currentTime,
      accumulatedTimeMinutes: 0
    };
  }

  /**
   * Evaluates structured or textual convergence conditions.
   * CRITICAL: Reaching the final stage index or being in the same location ALONE does NOT automatically trigger convergence!
   */
  public static evaluateConvergenceCondition(
    ate: ActiveTimeEvent,
    adventure: Adventure,
    currentLocationName?: string
  ): { satisfied: boolean; reason?: string } {
    if (ate.status !== 'active') {
      return { satisfied: false, reason: `ATE is not in active status (current: ${ate.status}).` };
    }

    // Evaluate structured convergence condition if present
    if (ate.structuredConvergenceCondition) {
      const sCond = ate.structuredConvergenceCondition;

      // 1. Stage Index requirement
      if (sCond.requiredStageIndex !== undefined) {
        if (ate.currentStageIndex < sCond.requiredStageIndex) {
          return { satisfied: false, reason: `Stage index ${ate.currentStageIndex} is lower than required ${sCond.requiredStageIndex}.` };
        }
      }

      // 2. Location Requirement
      if (sCond.requiredLocationName || sCond.requiredLocationId) {
        const playerLocName = currentLocationName || adventure.currentLocation?.locationName || '';
        const playerLocId = adventure.currentLocation?.locationId || '';

        const nameMatch = sCond.requiredLocationName
          ? playerLocName.toLowerCase().includes(sCond.requiredLocationName.toLowerCase())
          : true;
        const idMatch = sCond.requiredLocationId
          ? playerLocId === sCond.requiredLocationId
          : true;

        if (!nameMatch && !idMatch) {
          return { satisfied: false, reason: `Player location '${playerLocName}' does not match required location.` };
        }
      }

      // 3. Required World Facts / Knowledge
      if (sCond.requiredWorldFacts && sCond.requiredWorldFacts.length > 0) {
        const worldFacts = adventure.world?.facts || [];
        const knowledgeEntries = adventure.characterKnowledge?.discoveredInformation || [];

        const allMet = sCond.requiredWorldFacts.every(rf => {
          const inFacts = worldFacts.some((f: any) => f.predicate === rf || f.factText?.includes(rf) || f.note?.includes(rf));
          const inKnowledge = knowledgeEntries.some((k: any) => k.summary?.includes(rf) || k.description?.includes(rf));
          return inFacts || inKnowledge;
        });

        if (!allMet) {
          return { satisfied: false, reason: 'Required world facts or character knowledge missing.' };
        }
      }

      // 4. Minimum Elapsed World Time
      if (sCond.minWorldTimeMinutes !== undefined) {
        const currentWorldTime = adventure.worldTime || { day: 1, hour: 8, minute: 0 };
        const createdWorldTime = ate.createdAtWorldTime || { day: 1, hour: 8, minute: 0 };
        const totalElapsed = WorldSimulationService.toTotalMinutes(currentWorldTime) - WorldSimulationService.toTotalMinutes(createdWorldTime);

        if (totalElapsed < sCond.minWorldTimeMinutes) {
          return { satisfied: false, reason: `Elapsed time (${totalElapsed}m) is less than required minimum (${sCond.minWorldTimeMinutes}m).` };
        }
      }

      return { satisfied: true };
    }

    // Textual condition evaluation:
    // Requires that the final stage (or stage >= 1) is reached AND player location matches or explicit player impact/trigger recorded
    const isAtFinalStage = ate.currentStageIndex >= ate.stages.length - 1;
    const playerLoc = currentLocationName || adventure.currentLocation?.locationName || '';
    const isAtTargetLocation = ate.originLocationName && playerLoc
      ? playerLoc.toLowerCase().includes(ate.originLocationName.toLowerCase()) || ate.originLocationName.toLowerCase().includes(playerLoc.toLowerCase())
      : false;
    const hasPlayerImpact = ate.playerImpactLogs && ate.playerImpactLogs.length > 0;

    // Convergence requires: at final stage AND (player at target location OR player interacted with thread)
    if (isAtFinalStage && (isAtTargetLocation || hasPlayerImpact)) {
      return { satisfied: true };
    }

    return { satisfied: false, reason: 'Textual convergence criteria not yet met.' };
  }

  /**
   * Evaluates all active ATEs against cumulative elapsed world time, current player location, and world facts.
   * Advances stages using cumulative time, generates foreshadowing clues into CharacterKnowledge, and handles convergence via structured conditions.
   */
  public static evaluateAndAdvanceATEs(params: {
    adventure: Adventure;
    elapsedMinutes: number;
    currentLocationName?: string;
  }): ATEEvaluationResult {
    let currentAdventure = { ...params.adventure };
    const ates = this.getActiveTimeEvents(currentAdventure);
    if (ates.length === 0) {
      return {
        updatedAdventure: currentAdventure,
        advancedATEs: [],
        newCluesGenerated: [],
        convergedATEs: []
      };
    }

    const currentWorldTime = currentAdventure.worldTime || { day: 1, hour: 8, minute: 0 };
    const currentTotalMins = WorldSimulationService.toTotalMinutes(currentWorldTime);
    const advancedATEs: ActiveTimeEvent[] = [];
    const newCluesGenerated: string[] = [];
    const convergedATEs: ActiveTimeEvent[] = [];

    const updatedATEs = ates.map(ate => {
      if (ate.status !== 'active') return ate;

      let updatedAte = { ...ate };

      // Compute cumulative elapsed time from ATE creation
      const createdTotalMins = WorldSimulationService.toTotalMinutes(updatedAte.createdAtWorldTime || currentWorldTime);
      const totalElapsedMinutes = Math.max(0, currentTotalMins - createdTotalMins);
      updatedAte.accumulatedTimeMinutes = totalElapsedMinutes;

      // Stage Advancement Loop (sequential step through ALL due stages)
      let stageAdvanced = true;
      while (stageAdvanced && updatedAte.currentStageIndex < updatedAte.stages.length - 1) {
        const candidateNextIndex = updatedAte.currentStageIndex + 1;
        const nextStage = updatedAte.stages[candidateNextIndex];

        let isTriggered = false;

        // 1. Cumulative Time Trigger (evaluated against total elapsed minutes from ATE creation)
        if (nextStage.triggerTimeMinutes !== undefined && nextStage.triggerTimeMinutes > 0) {
          if (totalElapsedMinutes >= nextStage.triggerTimeMinutes) {
            isTriggered = true;
          }
        }

        // 2. Location Trigger (player location)
        if (params.currentLocationName && nextStage.triggerLocations && nextStage.triggerLocations.length > 0) {
          const locMatch = nextStage.triggerLocations.some(
            loc => loc.toLowerCase() === params.currentLocationName?.toLowerCase()
          );
          if (locMatch) {
            isTriggered = true;
          }
        }

        // 3. Fact Trigger
        if (nextStage.triggerFacts && nextStage.triggerFacts.length > 0) {
          const worldFacts = currentAdventure.world?.facts || [];
          const allFactsPresent = nextStage.triggerFacts.every(
            tf => worldFacts.some((f: any) => f.predicate === tf || f.factText?.includes(tf) || f.note?.includes(tf))
          );
          if (allFactsPresent) {
            isTriggered = true;
          }
        }

        if (isTriggered) {
          updatedAte.currentStageIndex = candidateNextIndex;
          updatedAte.lastUpdatedWorldTime = { ...currentWorldTime };
          updatedAte.lastExecutedStageWorldTime = { ...currentWorldTime };

          const updatedStages = [...updatedAte.stages];
          updatedStages[candidateNextIndex] = {
            ...nextStage,
            executedAtWorldTime: { ...currentWorldTime }
          };
          updatedAte.stages = updatedStages;

          if (!advancedATEs.some(a => a.id === updatedAte.id)) {
            advancedATEs.push(updatedAte);
          }

          // Handle foreshadowing clues (without revealing internal truth)
          if (nextStage.foreshadowingClues && nextStage.foreshadowingClues.length > 0) {
            if (updatedAte.revealLevel === 'hidden') {
              updatedAte.revealLevel = 'foreshadowed';
            }

            nextStage.foreshadowingClues.forEach(clue => {
              newCluesGenerated.push(clue);
              currentAdventure = CharacterKnowledgeService.addKnowledgeEntry(currentAdventure, {
                category: 'lore',
                entityId: updatedAte.id,
                entityName: updatedAte.title,
                summary: `Gerücht: ${clue}`,
                sourceType: 'conversation',
                sourceCharacterName: 'Beobachtung / Gerücht',
                reliability: 'rumor',
                description: clue
              });
            });
          }
          // Continue loop to see if the next stage is ALSO due in this time window!
        } else {
          stageAdvanced = false;
        }
      }

      // Evaluate Convergence (Controlled convergence based on structured or textual conditions)
      const convEval = this.evaluateConvergenceCondition(updatedAte, currentAdventure, params.currentLocationName);
      if (convEval.satisfied) {
        updatedAte.status = 'converged';
        updatedAte.isConverged = true;
        updatedAte.revealLevel = 'fully_revealed';
        convergedATEs.push(updatedAte);

        // Add convergence revelation to Character Knowledge
        currentAdventure = CharacterKnowledgeService.addKnowledgeEntry(currentAdventure, {
          category: 'lore',
          entityId: updatedAte.id,
          entityName: updatedAte.title,
          summary: `Ereignis-Konvergenz: ${updatedAte.convergenceConsequence || updatedAte.title}`,
          sourceType: 'observation',
          sourceCharacterName: 'Eigenes Erleben',
          reliability: 'certain',
          description: updatedAte.convergenceConsequence || `Der Hintergrundstrang '${updatedAte.title}' trifft direkt mit der Hauptgeschichte zusammen.`
        });
      }

      return updatedAte;
    });

    currentAdventure = this.setActiveTimeEvents(currentAdventure, updatedATEs);

    return {
      updatedAdventure: currentAdventure,
      advancedATEs,
      newCluesGenerated,
      convergedATEs
    };
  }

  /**
   * Logs player action impact on an ATE (e.g. destroying evidence, helping a participant, leaving town).
   */
  public static recordPlayerImpact(params: {
    adventure: Adventure;
    ateId: string;
    actionDescription: string;
    effectOnThread: string;
    delayMinutes?: number;
    accelerateStage?: boolean;
    newStageIndex?: number;
    newStatus?: ATEStatus;
  }): Adventure {
    const ates = this.getActiveTimeEvents(params.adventure);
    const worldTime = params.adventure.worldTime || { day: 1, hour: 8, minute: 0 };
    const timeStr = `Tag ${worldTime.day}, ${String(worldTime.hour).padStart(2, '0')}:${String(worldTime.minute).padStart(2, '0')}`;

    const updatedATEs = ates.map(ate => {
      if (ate.id !== params.ateId) return ate;

      const logs = ate.playerImpactLogs || [];
      const updatedLogs = [
        ...logs,
        {
          timestamp: timeStr,
          actionDescription: params.actionDescription,
          effectOnThread: params.effectOnThread
        }
      ];

      let newStageIdx = ate.currentStageIndex;
      if (params.newStageIndex !== undefined) {
        newStageIdx = Math.min(ate.stages.length - 1, Math.max(0, params.newStageIndex));
      } else if (params.accelerateStage && ate.currentStageIndex < ate.stages.length - 1) {
        newStageIdx += 1;
      }

      let updatedAte: ActiveTimeEvent = {
        ...ate,
        currentStageIndex: newStageIdx,
        status: params.newStatus || ate.status,
        playerImpactLogs: updatedLogs,
        revealLevel: ate.revealLevel === 'hidden' ? 'partially_revealed' : ate.revealLevel
      };

      return updatedAte;
    });

    return this.setActiveTimeEvents(params.adventure, updatedATEs);
  }

  /**
   * Generates formatted prompt text for Gemini, passing ATE causal background without spoiling secrets directly to the player.
   */
  public static getATEContextForAI(adventure: Adventure): string {
    const ates = this.getActiveTimeEvents(adventure);
    const activeAndForeshadowed = ates.filter(a => a.status === 'active' || a.status === 'converged');

    if (activeAndForeshadowed.length === 0) {
      return '';
    }

    const lines: string[] = [
      '=== PARALLELE HINTERGRUND-HANDLUNGSSTRÄNGE (ACTIVE TIME EVENTS / ATE) ===',
      'WICHTIG FÜR DIE ERZÄHLUNG & SPIELLEITUNG:',
      '1. Diese ATEs beschreiben Ereignisse, die sich unabhängig vom Spieler im Hintergrund abspielen.',
      '2. Verwende die enthaltene "interne Wahrheit" als KAUSALE GRUNDLAGE für die Welt und das Handeln der NPCs.',
      '3. VERRATE DEM SPIELER NICHT direkt die interne Wahrheit/Geheimnisse, sondern nur kaskadierend wahrnehmbare Gerüchte/Hinweise (Foreshadowing).',
      '4. Figuren reagieren konsistent nach ihren angegebenen Zielen & Motivationen. Keine Figuren dürfen grundlos aus dem Nichts auftauchen.',
      '5. Bestimme NIEMALS automatisch die Handlungen, Gefühle oder Dialoge des Spielers. Der Spieler behält die volle Autonomie.',
      ''
    ];

    activeAndForeshadowed.forEach((ate, index) => {
      const currentStage = ate.stages[ate.currentStageIndex] || ate.stages[0];
      lines.push(`--- ATE #${index + 1}: ${ate.title} [Status: ${ate.status} | Reveal-Level: ${ate.revealLevel}] ---`);
      lines.push(`Kategorie: ${ate.category || 'Allgemein'}`);
      if (ate.originLocationName) lines.push(`Ursprungsort: ${ate.originLocationName}`);
      lines.push(`Hintergrund: ${ate.backgroundContext || 'N/A'}`);
      lines.push(`Aktuelle Phase (${ate.currentStageIndex + 1}/${ate.stages.length}): "${currentStage?.title}"`);
      lines.push(` - Beschreibung: ${currentStage?.description}`);
      lines.push(` - Interne Wahrheit (Nur für KI-Logik!): ${currentStage?.internalTruth}`);

      if (currentStage?.foreshadowingClues && currentStage.foreshadowingClues.length > 0) {
        lines.push(` - Wahrnehmbare Hinweise/Gerüchte: ${currentStage.foreshadowingClues.join('; ')}`);
      }

      if (ate.participants && ate.participants.length > 0) {
        lines.push(' Beteiligte Akteure & Motivationen:');
        ate.participants.forEach(p => {
          lines.push(`   * ${p.characterName}${p.factionName ? ` (${p.factionName})` : ''}: Ziel="${p.goal}" | Motivation="${p.motivation}" | Ort="${p.currentLocationName || 'unbekannt'}" | Nächster Schritt="${p.nextStep || 'N/A'}"`);
        });
      }

      if (ate.convergenceCondition) {
        lines.push(` Konvergenz-Bedingung: ${ate.convergenceCondition}`);
      }
      if (ate.convergenceConsequence) {
        lines.push(` Konvergenz-Folge: ${ate.convergenceConsequence}`);
      }

      if (ate.playerImpactLogs && ate.playerImpactLogs.length > 0) {
        lines.push(' Einfluss des Spielers bisher:');
        ate.playerImpactLogs.forEach(log => {
          lines.push(`   * [${log.timestamp}] ${log.actionDescription} -> ${log.effectOnThread}`);
        });
      }

      lines.push('');
    });

    return lines.join('\n');
  }
}
