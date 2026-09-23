import {
  ActiveTimeEvent,
  ATEStage,
  ATEParticipant,
  ATEStatus,
  ATECategory,
  ATERevealLevel,
  Adventure,
  WorldTime,
  CharacterKnowledgeEntry
} from '../types';
import { CharacterKnowledgeService } from './characterKnowledgeService';

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
      convergenceCondition: params.convergenceCondition || 'Sobald der Spieler und die Beteiligten aufeinandertreffen.',
      convergenceConsequence: params.convergenceConsequence || 'Der Handlungsstrang bricht direkt in das Hauptgeschehen ein.',
      isConverged: false,
      playerImpactLogs: [],
      createdAtWorldTime: currentTime,
      lastUpdatedWorldTime: currentTime
    };
  }

  /**
   * Evaluates all active ATEs against elapsed world time, current player location, and world facts.
   * Advances stages, generates indirect non-spoiling foreshadowing clues into CharacterKnowledge, and handles convergence.
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
    const advancedATEs: ActiveTimeEvent[] = [];
    const newCluesGenerated: string[] = [];
    const convergedATEs: ActiveTimeEvent[] = [];

    const updatedATEs = ates.map(ate => {
      if (ate.status !== 'active') return ate;

      let updatedAte = { ...ate };
      let stageChanged = false;

      // Check if next stage exists
      const nextStageIndex = updatedAte.currentStageIndex + 1;
      if (nextStageIndex < updatedAte.stages.length) {
        const nextStage = updatedAte.stages[nextStageIndex];

        // Evaluate trigger conditions
        let isTriggered = false;

        // Time trigger
        if (nextStage.triggerTimeMinutes !== undefined && nextStage.triggerTimeMinutes > 0) {
          if (params.elapsedMinutes >= nextStage.triggerTimeMinutes) {
            isTriggered = true;
          }
        }

        // Location trigger
        if (params.currentLocationName && nextStage.triggerLocations && nextStage.triggerLocations.length > 0) {
          const locMatch = nextStage.triggerLocations.some(
            loc => loc.toLowerCase() === params.currentLocationName?.toLowerCase()
          );
          if (locMatch) {
            isTriggered = true;
          }
        }

        // Advance stage if triggered
        if (isTriggered) {
          updatedAte.currentStageIndex = nextStageIndex;
          updatedAte.lastUpdatedWorldTime = {
            day: currentWorldTime.day,
            hour: currentWorldTime.hour,
            minute: currentWorldTime.minute
          };

          const updatedStages = [...updatedAte.stages];
          updatedStages[nextStageIndex] = {
            ...nextStage,
            executedAtWorldTime: {
              day: currentWorldTime.day,
              hour: currentWorldTime.hour,
              minute: currentWorldTime.minute
            }
          };
          updatedAte.stages = updatedStages;
          stageChanged = true;
          advancedATEs.push(updatedAte);

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
        }
      }

      // Evaluate Convergence
      const isFinalStage = updatedAte.currentStageIndex >= updatedAte.stages.length - 1;
      const isLocConvergence = params.currentLocationName && updatedAte.participants.some(
        p => p.currentLocationName && p.currentLocationName.toLowerCase() === params.currentLocationName?.toLowerCase()
      );

      if ((isFinalStage || isLocConvergence) && updatedAte.status === 'active') {
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

      let updatedAte: ActiveTimeEvent = {
        ...ate,
        playerImpactLogs: updatedLogs,
        revealLevel: ate.revealLevel === 'hidden' ? 'partially_revealed' : ate.revealLevel
      };

      // Accelerate or delay stages if requested
      if (params.accelerateStage && updatedAte.currentStageIndex < updatedAte.stages.length - 1) {
        updatedAte.currentStageIndex += 1;
      }

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
