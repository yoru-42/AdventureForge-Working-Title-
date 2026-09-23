import { ActiveTimeEventService } from '../services/activeTimeEventService';
import { WorldSimulationService } from '../services/worldSimulationService';
import { AdventureResetService } from '../services/adventureResetService';
import { CharacterKnowledgeService } from '../services/characterKnowledgeService';
import { AIStoryStateProcessor } from '../services/aiStoryStateProcessor';
import { Adventure, ActiveTimeEvent, WorldTime } from '../types';

export function runATETests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${message}`);
    } else {
      failed++;
      errors.push(message);
      console.error(`  ✗ ${message}`);
    }
  }

  console.log('\n--- STARTING ACTIVE TIME EVENT (ATE) V2 TEST SUITE ---');

  const baseWorldTime: WorldTime = { day: 1, hour: 8, minute: 0 };

  function createTestAdventure(): Adventure {
    const ate1 = ActiveTimeEventService.createATE({
      id: 'ate_shadow_family',
      title: 'Das Geheimnis der Kaufmannsfamilie',
      summary: 'Ein unauffälliger Streit unter Händlern weitet sich aus.',
      category: 'investigation',
      originLocationName: 'Schattenhafen',
      backgroundContext: 'Händler Balduin vermutet Verrat in der Kaufmannsgilde.',
      participants: [
        {
          id: 'part_balduin',
          characterName: 'Balduin der Händler',
          goal: 'Beweise für Unterschlagung finden',
          motivation: 'Verlust des Familienvermögens verhindern',
          currentLocationName: 'Schattenhafen Markt',
          nextStep: 'Durchsuche die alten Kontorbücher'
        }
      ],
      stages: [
        {
          stageIndex: 0,
          title: 'Erste Verdachtsmomente',
          description: 'Balduin bemerkt Unregelmäßigkeiten in den Büchern.',
          internalTruth: 'Gildenmeister Corvin zweigt heimlich Gold ab.',
          triggerTimeMinutes: 0,
          foreshadowingClues: ['Im Kontor wird bis spät in die Nacht verhandelt.'],
          executedAtWorldTime: baseWorldTime
        },
        {
          stageIndex: 1,
          title: 'Heimliche Ermittlung',
          description: 'Balduin Heuer den Buchhalter an.',
          internalTruth: 'Der Buchhalter wird bestochen, zu schweigen.',
          triggerTimeMinutes: 120, // 2 hours cumulative
          foreshadowingClues: ['Ein Bote verlässt den Kontor mit Siegelwachs.']
        },
        {
          stageIndex: 2,
          title: 'Offener Konflikt',
          description: 'Balduin fordert eine Audienz vor den Gildenältesten.',
          internalTruth: 'Corvin bereitet die Flucht aus Schattenhafen vor.',
          triggerTimeMinutes: 300, // 5 hours cumulative
          foreshadowingClues: ['Packesel werden am Hinterausgang beladen.']
        }
      ],
      structuredConvergenceCondition: {
        requiredStageIndex: 2,
        requiredLocationName: 'Schattenhafen',
        requiredWorldFacts: ['Beweisakte_Gilde']
      },
      convergenceConsequence: 'Corvin versucht bei der Flucht, den Spieler als Sündenbock zu nutzen.',
      worldTime: baseWorldTime
    });

    const adv: Adventure = {
      id: 'test_adv_ate_1',
      authorId: 'test_author',
      isPublic: false,
      inventory: [],
      statusElements: [],
      prologue: 'Willkommen in Schattenhafen.',
      player: {
        id: 'p1',
        name: 'Gideon',
        role: 'Söldner',
        bio: 'Ein erfahrener Söldner.',
        goal: 'Münzen verdienen',
        currentSituation: 'Am Hafen angekommen',
        personality: 'Besonnen und pragmatisch',
        attributes: [],
        appearance: {
          currentLocation: 'Schattenhafen Markt',
          hairColor: 'Dunkel',
          eyeColor: 'Braun',
          age: '30',
          build: 'Mittel',
          gender: 'männlich'
        }
      },
      world: {
        title: 'Schattenhafen Welt',
        description: 'Eine dichte Hafenstadt.',
        tone: 'Düster & realistisch',
        era: 'Mittelalter',
        locations: [
          { id: 'loc_markt', name: 'Schattenhafen Markt', description: 'Der belebte Marktplatz', territoryId: 't1', type: 'city' },
          { id: 'loc_kontor', name: 'Handelskontor', description: 'Das Verwaltungsgebäude der Gilde', territoryId: 't1', type: 'building' }
        ],
        activeTimeEvents: [ate1]
      },
      activeTimeEvents: [ate1],
      worldTime: { ...baseWorldTime },
      currentLocation: {
        locationId: 'loc_markt',
        locationName: 'Schattenhafen Markt'
      },
      npcs: [],
      loreDatabase: [],
      chatHistory: [],
      characterKnowledge: { discoveredInformation: [] }
    };

    return AdventureResetService.ensureInitialSnapshots(adv, true);
  }

  // -------------------------------------------------------------
  // Test 1: Cumulative Time Advancement
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    // 3 actions: 30m, 40m, 60m => total 130m (exceeds stage 1 trigger of 120m)
    adv.worldTime = { day: 1, hour: 8, minute: 30 };
    let res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 30 });
    adv = res.updatedAdventure;
    assert(res.advancedATEs.length === 0, 'Test 1a: Stage 1 not triggered at 30 elapsed minutes (threshold 120m)');

    adv.worldTime = { day: 1, hour: 9, minute: 10 };
    res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 40 });
    adv = res.updatedAdventure;
    assert(res.advancedATEs.length === 0, 'Test 1b: Stage 1 not triggered at 70 total elapsed minutes (threshold 120m)');

    adv.worldTime = { day: 1, hour: 10, minute: 10 }; // Total elapsed = 130m
    res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 60 });
    adv = res.updatedAdventure;
    
    const ates = ActiveTimeEventService.getActiveTimeEvents(adv);
    assert(ates[0].currentStageIndex === 1, 'Test 1c: Stage 1 triggered at 130 cumulative minutes');
    assert(res.newCluesGenerated.includes('Ein Bote verlässt den Kontor mit Siegelwachs.'), 'Test 1d: Foreshadowing clue generated for stage 1');
  } catch (err: any) {
    failed++;
    errors.push(`Test 1 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 2: Short Action Sequence Accumulation
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    // 12 turns of 10 minutes = 120 total minutes
    for (let i = 1; i <= 12; i++) {
      const totalMins = 8 * 60 + i * 10;
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      adv.worldTime = { day: 1, hour: h, minute: m };
      const res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10 });
      adv = res.updatedAdventure;
    }
    const ates = ActiveTimeEventService.getActiveTimeEvents(adv);
    assert(ates[0].currentStageIndex === 1, 'Test 2: Sequential small turns reach cumulative 120 minutes and advance stage');
  } catch (err: any) {
    failed++;
    errors.push(`Test 2 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 3: Long World Time Jump (Travel / Sleep)
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    // Time jump of 6 hours (360 minutes) => should sequentially cross stage 1 (120m) AND stage 2 (300m)
    adv.worldTime = { day: 1, hour: 14, minute: 0 };
    const res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 360 });
    adv = res.updatedAdventure;

    const ates = ActiveTimeEventService.getActiveTimeEvents(adv);
    assert(ates[0].currentStageIndex === 2, 'Test 3a: Long jump of 360 minutes advances through stage 1 to stage 2');
    assert(ates[0].stages[1].executedAtWorldTime !== undefined, 'Test 3b: Intermediate stage 1 execution time recorded');
    assert(ates[0].stages[2].executedAtWorldTime !== undefined, 'Test 3c: Final stage 2 execution time recorded');
  } catch (err: any) {
    failed++;
    errors.push(`Test 3 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 4: Final Stage Trigger Behavior (Does NOT Auto-Converge)
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    adv.worldTime = { day: 1, hour: 14, minute: 0 }; // 360 cumulative minutes -> stage 2
    const res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 360 });
    adv = res.updatedAdventure;

    const ates = ActiveTimeEventService.getActiveTimeEvents(adv);
    assert(ates[0].currentStageIndex === 2, 'Test 4a: ATE is at stage 2 (final stage)');
    assert(ates[0].status === 'active', 'Test 4b: ATE remains in ACTIVE status at final stage (NOT auto-converged)');
    assert(!ates[0].isConverged, 'Test 4c: isConverged remains false');
  } catch (err: any) {
    failed++;
    errors.push(`Test 4 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 5: Structured Convergence Condition Satisfied
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    adv.worldTime = { day: 1, hour: 14, minute: 0 }; // reach stage 2
    ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 360 });

    // Add required world fact "Beweisakte_Gilde" to world facts
    adv.world.facts = [{ id: 'fact1', subjectId: 'gilde', predicate: 'Beweisakte_Gilde', sourceType: 'established_story', status: 'known', knowledgeType: 'fact', note: 'Beweisakte_Gilde wurde in der Lade von Corvin gefunden' }];

    const res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10, currentLocationName: 'Schattenhafen' });
    adv = res.updatedAdventure;

    const ates = ActiveTimeEventService.getActiveTimeEvents(adv);
    assert(ates[0].status === 'converged', 'Test 5a: ATE transitions to CONVERGED when structured convergence condition is fulfilled');
    assert(ates[0].isConverged === true, 'Test 5b: isConverged is set to true');
    assert(res.convergedATEs.length === 1, 'Test 5c: convergedATEs list returned in evaluation result');
  } catch (err: any) {
    failed++;
    errors.push(`Test 5 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 6: Location-Only Match Does NOT Trigger Auto Convergence
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    // Player is at Schattenhafen Markt, but ATE is only at Stage 0 (time = 0) and missing facts
    const res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10, currentLocationName: 'Schattenhafen Markt' });
    adv = res.updatedAdventure;

    const ates = ActiveTimeEventService.getActiveTimeEvents(adv);
    assert(ates[0].status === 'active', 'Test 6: Same location alone does NOT trigger automatic convergence');
  } catch (err: any) {
    failed++;
    errors.push(`Test 6 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 7: Interne Wahrheit Secrecy
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    adv.worldTime = { day: 1, hour: 11, minute: 0 }; // 180m -> stage 1
    const res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 180 });
    adv = res.updatedAdventure;

    const knowledgeEntries = adv.characterKnowledge?.discoveredInformation || [];
    const truthLeaked = knowledgeEntries.some(k => k.summary?.includes('Der Buchhalter wird bestochen') || k.sourceEvent?.description?.includes('Der Buchhalter wird bestochen'));
    assert(!truthLeaked, 'Test 7: Interne Wahrheit is NOT leaked directly into character knowledge');
  } catch (err: any) {
    failed++;
    errors.push(`Test 7 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 8: Clue erzeugt kein automatisches Wissen (Test A)
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    adv.worldTime = { day: 1, hour: 11, minute: 0 }; // 180m -> stage 1
    const res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 180 });
    adv = res.updatedAdventure;

    const knowledgeEntries = adv.characterKnowledge?.discoveredInformation || [];
    const clueAddedAutomatically = knowledgeEntries.some(k => k.summary?.includes('Ein Bote verlässt den Kontor') || k.entityName?.includes('Ein Bote verlässt den Kontor'));
    assert(!clueAddedAutomatically, 'Test 8a: Foreshadowing clue is NOT automatically added to character knowledge');
    assert(res.newCluesGenerated.includes('Ein Bote verlässt den Kontor mit Siegelwachs.'), 'Test 8b: Clue was successfully generated as a world development element');
  } catch (err: any) {
    failed++;
    errors.push(`Test 8 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 8_B: Zugänglicher Clue kann Wissen erzeugen (Test B)
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    adv.worldTime = { day: 1, hour: 11, minute: 0 }; // 180m -> stage 1
    const res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 180 });
    adv = res.updatedAdventure;

    // Standard knowledge mechanic adds the clue explicitly when the player learns of it
    adv = CharacterKnowledgeService.addKnowledgeEntry(adv, {
      category: 'lore',
      entityId: 'knowledge_ate_clue_1',
      entityName: 'Ein Bote verlässt den Kontor',
      summary: 'Ein Bote verlässt den Kontor mit Siegelwachs.',
      description: 'Der Spieler hört Händler über einen Boten tuscheln.',
      sourceType: 'conversation',
      sourceCharacterName: 'Händler-Getratsch'
    });

    const knowledgeEntries = adv.characterKnowledge?.discoveredInformation || [];
    const clueAddedManually = knowledgeEntries.some(k => k.summary?.includes('Ein Bote verlässt den Kontor mit Siegelwachs.'));
    assert(clueAddedManually, 'Test 8_B: Clue successfully added using the standard knowledge mechanic');
  } catch (err: any) {
    failed++;
    errors.push(`Test 8_B Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 9: Hidden Clues Remain Hidden
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure(); // At stage 0
    const knowledgeEntries = adv.characterKnowledge?.discoveredInformation || [];
    const futureCluePresent = knowledgeEntries.some(k => k.summary?.includes('Packesel werden am Hinterausgang beladen') || k.sourceEvent?.description?.includes('Packesel werden am Hinterausgang beladen'));
    assert(!futureCluePresent, 'Test 9: Future stage clues remain hidden from character knowledge');
  } catch (err: any) {
    failed++;
    errors.push(`Test 9 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 10: Participant Goal & Motivation Persistence
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    adv = ActiveTimeEventService.recordPlayerImpact({
      adventure: adv,
      ateId: 'ate_shadow_family',
      actionDescription: 'Spieler warnt Balduin vor der Bestechung',
      effectOnThread: 'Balduin wechselt Versteck',
      accelerateStage: true
    });

    const ates = ActiveTimeEventService.getActiveTimeEvents(adv);
    assert(ates[0].participants[0].characterName === 'Balduin der Händler', 'Test 10a: Participant character name persisted');
    assert(ates[0].participants[0].goal === 'Beweise für Unterschlagung finden', 'Test 10b: Participant goal persisted');
    assert(ates[0].playerImpactLogs?.length === 1, 'Test 10c: Player impact log recorded successfully');
    assert(ates[0].playerImpactLogs?.[0].actionDescription === 'Spieler warnt Balduin vor der Bestechung', 'Test 10d: Impact log text verified');
  } catch (err: any) {
    failed++;
    errors.push(`Test 10 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 11: Off-Screen Simulation
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    const simRes = WorldSimulationService.runSimulationStep({
      world: adv.world,
      adventure: adv,
      currentLocationName: 'Schattenhafen Markt',
      minutesToAdd: 300 // 5 hours -> stage 2
    });

    const updatedAdv = simRes.updatedAdventure || adv;
    const ates = ActiveTimeEventService.getActiveTimeEvents(updatedAdv);
    assert(ates[0].currentStageIndex === 2, 'Test 11a: Off-screen progression advances ATE through WorldSimulationService');
    assert(simRes.advancedATEs !== undefined && simRes.advancedATEs.length > 0, 'Test 11b: Simulation result returns advancedATEs');
  } catch (err: any) {
    failed++;
    errors.push(`Test 11 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 12: Location Trigger Evaluation
  // -------------------------------------------------------------
  try {
    const locAte = ActiveTimeEventService.createATE({
      id: 'ate_loc_trigger',
      title: 'Geheimes Treffen in der Ruine',
      summary: 'Ein Informant wartet.',
      stages: [
        { stageIndex: 0, title: 'Warten', triggerTimeMinutes: 0 },
        { stageIndex: 1, title: 'Treffen', triggerLocations: ['Alte Ruine'], triggerTimeMinutes: 9999 }
      ]
    });
    let adv = createTestAdventure();
    adv.activeTimeEvents = [locAte];

    // Evaluate without reaching Alte Ruine
    let res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10, currentLocationName: 'Marktplatz' });
    adv = res.updatedAdventure;
    assert(ActiveTimeEventService.getActiveTimeEvents(adv)[0].currentStageIndex === 0, 'Test 12a: Stage not triggered at Marktplatz');

    // Evaluate at Alte Ruine
    res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10, currentLocationName: 'Alte Ruine' });
    adv = res.updatedAdventure;
    assert(ActiveTimeEventService.getActiveTimeEvents(adv)[0].currentStageIndex === 1, 'Test 12b: Stage triggered upon reaching Alte Ruine');
  } catch (err: any) {
    failed++;
    errors.push(`Test 12 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 13: WorldSimulationService Integration & Knowledge Update
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    const simRes = WorldSimulationService.runSimulationStep({
      world: adv.world,
      adventure: adv,
      currentLocationName: 'Schattenhafen Markt',
      minutesToAdd: 150
    });

    const updatedAdv = simRes.updatedAdventure!;
    const knowledgeEntries = updatedAdv.characterKnowledge?.discoveredInformation || [];
    assert(knowledgeEntries.length === 0, 'Test 13a: WorldSimulationStep does NOT automatically generate knowledge entries for player');
    assert(simRes.newCluesGenerated && simRes.newCluesGenerated.length > 0, 'Test 13b: WorldSimulationStep collects newly generated world clues');
  } catch (err: any) {
    failed++;
    errors.push(`Test 13 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 14: Save / Load Persistence
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    adv.worldTime = { day: 1, hour: 11, minute: 0 };
    ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 180 });

    const serialized = JSON.stringify(adv);
    const deserialized: Adventure = JSON.parse(serialized);

    const ates = ActiveTimeEventService.getActiveTimeEvents(deserialized);
    assert(ates.length === 1, 'Test 14a: Deserialized adventure preserves ATE array');
    assert(ates[0].currentStageIndex === 1, 'Test 14b: Deserialized adventure preserves currentStageIndex');
    assert(ates[0].accumulatedTimeMinutes === 180, 'Test 14c: Deserialized adventure preserves accumulatedTimeMinutes');
  } catch (err: any) {
    failed++;
    errors.push(`Test 14 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 15: Adventure Reset Baseline Restoration
  // -------------------------------------------------------------
  try {
    let adv = createTestAdventure();
    // Advance ATE to stage 2
    adv.worldTime = { day: 1, hour: 14, minute: 0 };
    const res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 360 });
    adv = res.updatedAdventure;

    assert(ActiveTimeEventService.getActiveTimeEvents(adv)[0].currentStageIndex === 2, 'Pre-test 15: ATE advanced to stage 2 before reset');

    // Reset adventure
    const resetAdv = AdventureResetService.resetAdventureToInitialState(adv);
    const resetAtes = ActiveTimeEventService.getActiveTimeEvents(resetAdv);

    assert(resetAtes.length === 1, 'Test 15a: Reset adventure has ATE array restored');
    assert(resetAtes[0].currentStageIndex === 0, 'Test 15b: Reset adventure restores initial ATE stage index 0');
    assert(resetAtes[0].status === 'active', 'Test 15c: Reset adventure restores active status');
  } catch (err: any) {
    failed++;
    errors.push(`Test 15 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 16: Player Autonomy & Context Generation
  // -------------------------------------------------------------
  try {
    const adv = createTestAdventure();
    const promptContext = ActiveTimeEventService.getATEContextForAI(adv);

    assert(promptContext.includes('PARALLELE HINTERGRUND-HANDLUNGSSTRÄNGE'), 'Test 16a: Context header present');
    assert(promptContext.includes('Bestimme NIEMALS automatisch die Handlungen, Gefühle oder Dialoge des Spielers'), 'Test 16b: Player autonomy directive explicitly present');
    assert(promptContext.includes('VERRATE DEM SPIELER NICHT direkt die interne Wahrheit'), 'Test 16c: Secrecy & foreshadowing directive present');
  } catch (err: any) {
    failed++;
    errors.push(`Test 16 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 17: Character Presence Verification (requiredCharacterIds)
  // -------------------------------------------------------------
  try {
    const charAte = ActiveTimeEventService.createATE({
      id: 'ate_char_req',
      title: 'Geheimes Treffen der Garde',
      summary: 'Ein Gardist muss anwesend sein.',
      stages: [
        { stageIndex: 0, title: 'Warten', triggerTimeMinutes: 0 }
      ],
      structuredConvergenceCondition: {
        requiredStageIndex: 0,
        requiredCharacterIds: ['guard_npc_01']
      },
      convergenceConsequence: 'Der Gardist spricht mit dem Spieler.'
    });

    let adv = createTestAdventure();
    adv.activeTimeEvents = [charAte];

    // Case 1: NPC is not in npcs array at all
    let res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10 });
    assert(ActiveTimeEventService.getActiveTimeEvents(res.updatedAdventure)[0].status === 'active', 'Test 17a: Does not converge when required NPC is completely missing');

    // Case 2: NPC is in npcs array, but absent
    adv.npcs = [{
      id: 'guard_npc_01',
      name: 'Hauptmann Alistair',
      role: 'Garde-Hauptmann',
      bio: 'Ein erfahrener Soldat.',
      personality: 'Pflichtbewusst',
      relationship: 'Neutral',
      conduct: 'Neutral',
      currentSituation: 'Abwesend',
      presenceState: { state: 'absent', updatedAt: new Date().toISOString() },
      currentLocationContext: {},
      appearance: { hairColor: 'Grau', eyeColor: 'Blau', age: '45', build: 'Kräftig', gender: 'männlich' },
      campaignPowerLevels: {},
      attributes: [],
      isHostile: false
    }];
    res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10 });
    assert(ActiveTimeEventService.getActiveTimeEvents(res.updatedAdventure)[0].status === 'active', 'Test 17b: Does not converge when required NPC is presentState = "absent"');

    // Case 3: NPC is present
    adv.npcs[0].presenceState = { state: 'present', updatedAt: new Date().toISOString() };
    res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10 });
    assert(ActiveTimeEventService.getActiveTimeEvents(res.updatedAdventure)[0].status === 'converged', 'Test 17c: Converges successfully when required NPC is presentState = "present"');
  } catch (err: any) {
    failed++;
    errors.push(`Test 17 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 18: Faction Presence Verification (requiredFactionIds)
  // -------------------------------------------------------------
  try {
    const factionAte = ActiveTimeEventService.createATE({
      id: 'ate_faction_req',
      title: 'Besatzung der Gilde',
      summary: 'Die Gilde muss die Stadt kontrollieren.',
      stages: [
        { stageIndex: 0, title: 'Warten', triggerTimeMinutes: 0 }
      ],
      structuredConvergenceCondition: {
        requiredStageIndex: 0,
        requiredFactionIds: ['gilde_faction_01']
      },
      convergenceConsequence: 'Die Gilde zieht Zölle ein.'
    });

    let adv = createTestAdventure();
    adv.activeTimeEvents = [factionAte];

    // Case 1: Faction is not active/present in world
    let res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10 });
    assert(ActiveTimeEventService.getActiveTimeEvents(res.updatedAdventure)[0].status === 'active', 'Test 18a: Does not converge when faction has no world presence');

    // Case 2: Faction controls a territory
    adv.world.territories = [{
      id: 't1',
      name: 'Marktgebiet',
      controlledByFactionId: 'gilde_faction_01',
      placeMarkers: [],
      connectedTerritoryIds: [],
      connectionMetrics: {}
    } as any];
    res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10 });
    assert(ActiveTimeEventService.getActiveTimeEvents(res.updatedAdventure)[0].status === 'converged', 'Test 18b: Converges successfully when faction controls a territory');
  } catch (err: any) {
    failed++;
    errors.push(`Test 18 Exception: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 19: Multi-condition Structured Convergence Logic (AND check)
  // -------------------------------------------------------------
  try {
    const multiAte = ActiveTimeEventService.createATE({
      id: 'ate_multi_req',
      title: 'Die große Verschwörung',
      summary: 'Erfordert Stufe 1, bestimmten Ort und ein gefundenes Beweisstück.',
      stages: [
        { stageIndex: 0, title: 'Start', triggerTimeMinutes: 0 },
        { stageIndex: 1, title: 'Beweise gesammelt', triggerTimeMinutes: 120 }
      ],
      structuredConvergenceCondition: {
        requiredStageIndex: 1,
        requiredLocationName: 'Rathaus',
        requiredWorldFacts: ['Verschwörungs-Dokument']
      },
      convergenceConsequence: 'Die Verschwörung wird aufgedeckt.'
    });

    let adv = createTestAdventure();
    adv.activeTimeEvents = [multiAte];

    // Case 1: Only stage 1 is reached (time advanced to 120m), but wrong location and no facts
    adv.worldTime = { day: 1, hour: 10, minute: 0 };
    let res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 120, currentLocationName: 'Marktplatz' });
    adv = res.updatedAdventure;
    assert(ActiveTimeEventService.getActiveTimeEvents(adv)[0].currentStageIndex === 1, 'Pre-test 19: ATE advanced to stage 1');
    assert(ActiveTimeEventService.getActiveTimeEvents(adv)[0].status === 'active', 'Test 19a: Does not converge with only stage met');

    // Case 2: Stage 1 and correct location, but missing world facts
    res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10, currentLocationName: 'Rathaus' });
    adv = res.updatedAdventure;
    assert(ActiveTimeEventService.getActiveTimeEvents(adv)[0].status === 'active', 'Test 19b: Does not converge with stage and location met but missing fact');

    // Case 3: All conditions met (stage 1, location Rathaus, fact added to world facts)
    adv.world.facts = [{
      id: 'f1',
      subjectId: 'verschwörung',
      predicate: 'Verschwörungs-Dokument',
      sourceType: 'established_story',
      status: 'known',
      knowledgeType: 'fact',
      note: 'Ein belastendes Schriftstück.'
    }];
    res = ActiveTimeEventService.evaluateAndAdvanceATEs({ adventure: adv, elapsedMinutes: 10, currentLocationName: 'Rathaus' });
    adv = res.updatedAdventure;
    assert(ActiveTimeEventService.getActiveTimeEvents(adv)[0].status === 'converged', 'Test 19c: Converges successfully when ALL conditions (stage, location, and fact) are met simultaneously');
  } catch (err: any) {
    failed++;
    errors.push(`Test 19 Exception: ${err.message}`);
  }

  console.log(`\nATE V2 TEST RESULTS: ${passed} Passed, ${failed} Failed.`);
  return { passed, failed, errors };
}

runATETests();

