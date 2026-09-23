import { WorldSimulationService } from '../services/worldSimulationService';
import { GameTurnService } from '../services/gameTurnService';
import { Adventure, WorldTime, WorldSetting } from '../types';

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    failed++;
    errors.push(message);
    console.error(`  ✗ [FAIL] ${message}`);
  }
}

console.log('\n--- STARTING CANONICAL TIME & KI TERMINAL TEST SUITE ---');

// ==========================================
// Test 1: Fall F (Tageswechsel) & Zeitberechnungen
// ==========================================
console.log('\nTest Case 1: Time arithmetic & Day transition (Fall F)');
const timeStart: WorldTime = { day: 1, hour: 23, minute: 50 };
const timeEnd = WorldSimulationService.addMinutes(timeStart, 20);

assert(timeEnd.day === 2, 'Day should advance to Day 2');
assert(timeEnd.hour === 0, 'Hour should wrap around to 00');
assert(timeEnd.minute === 10, 'Minute should be 10');
assert(WorldSimulationService.toTotalMinutes(timeEnd) === 1450, 'Total minutes of Day 2, 00:10 should be 1450');

// ==========================================
// Test 2: Fall A bis E (Relative Zeitdifferenzen)
// ==========================================
console.log('\nTest Case 2: Relative appointments duration (Fall A - E)');
const eventTime: WorldTime = { day: 1, hour: 13, minute: 0 }; // 13:00

// Fall A: 12:00 (60 minutes before)
const currentA: WorldTime = { day: 1, hour: 12, minute: 0 };
const diffA = WorldSimulationService.toTotalMinutes(eventTime) - WorldSimulationService.toTotalMinutes(currentA);
assert(diffA === 60, 'Fall A: 12:00 -> 13:00 must be exactly 60 minutes');

// Fall B: 12:30 (30 minutes before)
const currentB: WorldTime = { day: 1, hour: 12, minute: 30 };
const diffB = WorldSimulationService.toTotalMinutes(eventTime) - WorldSimulationService.toTotalMinutes(currentB);
assert(diffB === 30, 'Fall B: 12:30 -> 13:00 must be exactly 30 minutes');

// Fall C: 12:45 (15 minutes before)
const currentC: WorldTime = { day: 1, hour: 12, minute: 45 };
const diffC = WorldSimulationService.toTotalMinutes(eventTime) - WorldSimulationService.toTotalMinutes(currentC);
assert(diffC === 15, 'Fall C: 12:45 -> 13:00 must be exactly 15 minutes');

// Fall D: 13:00 (event reached)
const currentD: WorldTime = { day: 1, hour: 13, minute: 0 };
const diffD = WorldSimulationService.toTotalMinutes(eventTime) - WorldSimulationService.toTotalMinutes(currentD);
assert(diffD === 0, 'Fall D: 13:00 -> 13:00 must be exactly 0 minutes');

// Fall E: 13:10 (event passed / overdue)
const currentE: WorldTime = { day: 1, hour: 13, minute: 10 };
const diffE = WorldSimulationService.toTotalMinutes(eventTime) - WorldSimulationService.toTotalMinutes(currentE);
assert(diffE === -10, 'Fall E: 13:10 -> 13:00 must be -10 minutes (overdue)');

// ==========================================
// Test 3: Regressionstest des konkreten Fehlers (Section 15)
// ==========================================
console.log('\nTest Case 3: Error regression test (12:00 -> 12:35 and remaining = 25 mins)');
const wt1200: WorldTime = { day: 1, hour: 12, minute: 0 };
const wt1235: WorldTime = { day: 1, hour: 12, minute: 35 };
const wtScheduled: WorldTime = { day: 1, hour: 13, minute: 0 };

const remainingBeforeSim = WorldSimulationService.toTotalMinutes(wtScheduled) - WorldSimulationService.toTotalMinutes(wt1200);
assert(remainingBeforeSim === 60, 'Before turn, minutes remaining should be 60');

const remainingAfterSim = WorldSimulationService.toTotalMinutes(wtScheduled) - WorldSimulationService.toTotalMinutes(wt1235);
assert(remainingAfterSim === 25, 'After turn progresses to 12:35, remaining minutes must be exactly 25, NOT estimated from chat');

// ==========================================
// Test 4: Adventure-Zeit-Synchronisation (Section 17)
// ==========================================
console.log('\nTest Case 4: Adventure-worldTime vs world.worldTime sync');
const baseAdventure: Adventure = {
  id: "test_canonical_time_adv",
  authorId: "test_author",
  isPublic: false,
  prologue: "Story Prologue",
  inventory: [],
  statusElements: [],
  player: {
    id: "p1",
    name: "Gideon",
    role: "Söldner",
    bio: "Ein erfahrener Söldner.",
    goal: "Münzen verdienen",
    currentSituation: "Am Hafen angekommen",
    personality: "Besonnen und pragmatisch",
    attributes: [],
    appearance: {
      currentLocation: "Schattenhafen Markt",
      hairColor: "Dunkel",
      eyeColor: "Blau",
      age: "30",
      build: "Kräftig",
      gender: "Männlich"
    }
  },
  npcs: [],
  chatHistory: [],
  world: {
    title: "Schattenhafen",
    description: "Schattenhafen ist eine Handelsstadt.",
    era: "Mittelalter",
    tone: "Dark Fantasy",
    worldTime: { day: 1, hour: 12, minute: 0, totalMinutes: 720 },
    territories: [],
    connections: []
  },
  worldTime: { day: 1, hour: 12, minute: 0, totalMinutes: 720 }
};

// We execute a simulated action that adds 35 minutes
const simRes = WorldSimulationService.runSimulationStep({
  world: baseAdventure.world,
  adventure: baseAdventure,
  minutesToAdd: 35,
  actionText: "Ich gehe zum Marktplatz"
});

assert(simRes.timeEnd.hour === 12 && simRes.timeEnd.minute === 35, 'Simulation must end at 12:35');
assert(simRes.updatedAdventure?.worldTime?.hour === 12, 'Adventure worldTime hour must be updated');
assert(simRes.updatedAdventure?.worldTime?.minute === 35, 'Adventure worldTime minute must be updated');
assert(simRes.updatedWorld.worldTime.minute === 35, 'World Setting worldTime minute must be updated');

// Check that after turn simulation we run GameTurnService
const turnRes = GameTurnService.processPlayerTurn({
  adventure: baseAdventure,
  mode: 'action',
  actionText: "Ich gehe zum Marktplatz",
  // Inject mock generateAiResponse
  generateAiResponse: async (promptContext) => {
    return "Du gehst zum Markt. <STORY_STATE_CHANGES>{}</STORY_STATE_CHANGES>";
  },
  parserFn: (text, currentAdv, hp, mp, activeWorld) => {
    return {
      cleanedText: text,
      updatedLore: currentAdv.loreDatabase || [],
      updatedPlayer: currentAdv.player,
      updatedNpcs: currentAdv.npcs || [],
      notifications: [],
      updatedStructuredInventory: currentAdv.structuredInventory,
      updatedWorld: activeWorld
    };
  }
});

turnRes.then((res) => {
  const finalAdv = res.updatedAdventure;
  assert(finalAdv.worldTime !== undefined, 'finalAdventure worldTime must exist');
  assert(finalAdv.world.worldTime !== undefined, 'finalAdventure world worldTime must exist');
  assert(
    WorldSimulationService.toTotalMinutes(finalAdv.worldTime) === WorldSimulationService.toTotalMinutes(finalAdv.world.worldTime),
    'finalAdventure.worldTime must be perfectly in sync with finalAdventure.world.worldTime'
  );
  assert(
    finalAdv.worldTime?.minute === 10, // Default 10 minutes action duration
    'Action should advance time by default 10 mins (12:00 -> 12:10)'
  );
}).catch((err) => {
  console.error("Async turn processing failed:", err);
  failed++;
});

// ==========================================
// Test 5: KI-Zeit-Kontext (Section 18)
// ==========================================
console.log('\nTest Case 5: AI Prompt Formatting block presence');
const formattedTimeBlock = WorldSimulationService.formatWorldTimeBlockForAI(wt1235);
assert(formattedTimeBlock.includes("=== AKTUELLE SPIELZEIT ==="), 'Must contain prompt header');
assert(formattedTimeBlock.includes("Tag: 1"), 'Must indicate Tag: 1');
assert(formattedTimeBlock.includes("Uhrzeit: 12:35"), 'Must indicate Uhrzeit: 12:35');
assert(formattedTimeBlock.includes("Gesamtzeit: 755 Minuten"), 'Must indicate total minutes: 755');

const sampleWorld: WorldSetting = {
  title: "Schattenhafen",
  description: "Description",
  era: "Mittelalter",
  tone: "Dark",
  worldTime: wt1235,
  scheduledEvents: [
    {
      id: "evt_meet_cook",
      type: "appointment",
      title: "Treffen in der Gemeinschaftsküche",
      description: "Treffen mit dem Koch Balduin",
      scheduledForWorldTime: wtScheduled,
      createdAtWorldTime: wt1200,
      isPlayerVisible: true,
      status: "scheduled",
      priority: 1
    },
    {
      id: "evt_secret",
      type: "assassination",
      title: "Geheimer Anschlag",
      description: "Geheim",
      scheduledForWorldTime: wtScheduled,
      createdAtWorldTime: wt1200,
      isPlayerVisible: false, // Hidden spoiler event!
      status: "scheduled",
      priority: 2
    }
  ],
  territories: [],
  connections: []
};

const formattedUpcomingEvents = WorldSimulationService.formatUpcomingEventsBlockForAI(sampleWorld);
assert(formattedUpcomingEvents.includes("=== RELEVANTE ANSTEHENDE TERMINE ==="), 'Must include appointments header');
assert(formattedUpcomingEvents.includes("Treffen in der Gemeinschaftsküche"), 'Must include player visible event');
assert(formattedUpcomingEvents.includes("Verbleibende Zeit: (in 25 Min.)"), 'Must calculate remaining duration correctly as "in 25 Min."');
assert(!formattedUpcomingEvents.includes("Geheimer Anschlag"), 'Spoiler event with isPlayerVisible: false must NOT be included in AI block');

setTimeout(() => {
  console.log(`\n=== CANONICAL TIME TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}, 100);
