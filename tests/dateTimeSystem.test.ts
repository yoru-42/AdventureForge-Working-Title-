import { WorldSimulationService } from '../services/worldSimulationService';
import { TravelService } from '../services/travelService';
import { Adventure, WorldTime, WorldSetting, StatusElement } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${msg}`);
  }
}

console.log('\n=== TESTING DATE & TIME INTEGRATION SYSTEM ===');

// 1. Formatting tests
console.log('\n--- 1. Format Tests ---');
const wt1: WorldTime = { day: 1, hour: 8, minute: 5, totalMinutes: 485 };
assert(WorldSimulationService.formatDate(wt1) === 'Tag 1', 'formatDate should return Tag 1');
assert(WorldSimulationService.formatTime(wt1) === '08:05', 'formatTime should pad with zeros: 08:05');
assert(WorldSimulationService.formatDateTime(wt1) === 'Tag 1, 08:05', 'formatDateTime should return Tag 1, 08:05');

const wt2: WorldTime = { day: 15, hour: 23, minute: 45, totalMinutes: 21585 };
assert(WorldSimulationService.formatDate(wt2) === 'Tag 15', 'formatDate should return Tag 15');
assert(WorldSimulationService.formatTime(wt2) === '23:45', 'formatTime should return 23:45');
assert(WorldSimulationService.formatDateTime(wt2) === 'Tag 15, 23:45', 'formatDateTime should return Tag 15, 23:45');

// 2. Parsing tests
console.log('\n--- 2. Parse Tests ---');
const parsedTime1 = WorldSimulationService.parseTimeString('14:30');
assert(parsedTime1?.hour === 14 && parsedTime1?.minute === 30, 'parseTimeString 14:30');

const parsedTime2 = WorldSimulationService.parseTimeString('9:05 Uhr');
assert(parsedTime2?.hour === 9 && parsedTime2?.minute === 5, 'parseTimeString 9:05 Uhr');

const parsedDate1 = WorldSimulationService.parseDateString('Tag 3');
assert(parsedDate1?.day === 3, 'parseDateString Tag 3');

const parsedDate2 = WorldSimulationService.parseDateString('Tag 42');
assert(parsedDate2?.day === 42, 'parseDateString Tag 42');

const parsedDate3 = WorldSimulationService.parseDateString('5');
assert(parsedDate3?.day === 5, 'parseDateString 5');

// 3. syncStatusElementsWithWorldTime tests
console.log('\n--- 3. syncStatusElementsWithWorldTime Tests ---');
const initialStatus: StatusElement[] = [
  { id: '1', label: 'Standort', value: 'Marktplatz' },
  { id: '2', label: 'Vermögen', value: '50 Gold' }
];

const synced = WorldSimulationService.syncStatusElementsWithWorldTime(initialStatus, { day: 2, hour: 14, minute: 15 });
const dateEl = synced.find(s => s.label.toLowerCase() === 'datum');
const timeEl = synced.find(s => s.label.toLowerCase() === 'uhrzeit');
const locEl = synced.find(s => s.label.toLowerCase() === 'standort');

assert(dateEl !== undefined, 'Datum element must be added when missing');
assert(dateEl?.value === 'Tag 2', 'Datum element value must be Tag 2');
assert(timeEl !== undefined, 'Uhrzeit element must be added when missing');
assert(timeEl?.value === '14:15', 'Uhrzeit element value must be 14:15');
assert(locEl?.value === 'Marktplatz', 'Existing status element Standort must remain untouched');

// Updating existing status elements
const existingStatus: StatusElement[] = [
  { id: 'd1', label: 'Datum', value: 'Tag 1' },
  { id: 't1', label: 'Uhrzeit', value: '08:00' },
  { id: 'hp', label: 'HP', value: '100/100' }
];
const updatedExisting = WorldSimulationService.syncStatusElementsWithWorldTime(existingStatus, { day: 4, hour: 18, minute: 30 });
assert(updatedExisting.find(s => s.id === 'd1')?.value === 'Tag 4', 'Existing Datum must update to Tag 4');
assert(updatedExisting.find(s => s.id === 't1')?.value === '18:30', 'Existing Uhrzeit must update to 18:30');
assert(updatedExisting.find(s => s.id === 'hp')?.value === '100/100', 'Existing HP must remain untouched');

// 4. processWorldTimeAndStatusFromChat tests
console.log('\n--- 4. processWorldTimeAndStatusFromChat Tests ---');

// Case A: AI outputs both Datum and Zeit
const chatResA = WorldSimulationService.processWorldTimeAndStatusFromChat({
  rawAiText: 'Ich sehe mich um. [[STATUS: Datum=Tag 3, Zeit=15:45, HP=90/100]]',
  prevWorldTime: { day: 2, hour: 20, minute: 0, totalMinutes: 2640 },
  statusElements: existingStatus
});
assert(chatResA.updatedWorldTime.day === 3, 'Day must be 3 from AI status tag');
assert(chatResA.updatedWorldTime.hour === 15, 'Hour must be 15');
assert(chatResA.updatedWorldTime.minute === 45, 'Minute must be 45');
assert(chatResA.hadExplicitDate === true, 'hadExplicitDate must be true');
assert(chatResA.hadExplicitTime === true, 'hadExplicitTime must be true');
assert(chatResA.updatedStatusElements.find(s => s.label === 'Datum')?.value === 'Tag 3', 'Status Datum must be Tag 3');
assert(chatResA.updatedStatusElements.find(s => s.label === 'Uhrzeit')?.value === '15:45', 'Status Uhrzeit must be 15:45');

// Case B: Automatic midnight rollover detection
const chatResB = WorldSimulationService.processWorldTimeAndStatusFromChat({
  rawAiText: 'Nachdem die Nacht vergangen ist, erwachst du. [[STATUS: Zeit=07:15, Ausdauer=100%]]',
  prevWorldTime: { day: 1, hour: 23, minute: 30, totalMinutes: 1410 },
  statusElements: existingStatus
});
assert(chatResB.updatedWorldTime.day === 2, 'Day must automatically advance to Day 2 on midnight rollover (23:30 -> 07:15)');
assert(chatResB.updatedWorldTime.hour === 7, 'Hour must be 7');
assert(chatResB.updatedWorldTime.minute === 15, 'Minute must be 15');
assert(chatResB.updatedStatusElements.find(s => s.label === 'Datum')?.value === 'Tag 2', 'Status Datum must be Tag 2');
assert(chatResB.updatedStatusElements.find(s => s.label === 'Uhrzeit')?.value === '07:15', 'Status Uhrzeit must be 07:15');

// Case C: Action duration fallback when AI omits status tag
const chatResC = WorldSimulationService.processWorldTimeAndStatusFromChat({
  rawAiText: 'Du spazierst durch die Gassen und betrachtest die Stände.',
  prevWorldTime: { day: 1, hour: 12, minute: 0, totalMinutes: 720 },
  statusElements: existingStatus,
  fallbackActionText: 'Ich durchsuche die Bibliothek nach Hinweisen'
});
assert(chatResC.hadExplicitTime === false, 'hadExplicitTime must be false');
assert(chatResC.elapsedMinutes === 30, 'Investigate/Search should advance time by 30 mins');
assert(chatResC.updatedWorldTime.hour === 12 && chatResC.updatedWorldTime.minute === 30, 'Time should be 12:30');
assert(chatResC.updatedStatusElements.find(s => s.label === 'Uhrzeit')?.value === '12:30', 'Status Uhrzeit must be 12:30');

// 5. Simulation step status sync
console.log('\n--- 5. Simulation Step & Status Sync Tests ---');
const sampleWorld: WorldSetting = {
  title: 'Testwelt',
  description: 'Testwelt Beschreibung',
  era: 'Mittelalter',
  tone: 'Abenteuer',
  worldTime: { day: 1, hour: 23, minute: 45, totalMinutes: 1425 },
  territories: [],
  connections: []
};

const sampleAdv: Adventure = {
  id: 'adv-date-test',
  authorId: 'auth1',
  isPublic: false,
  prologue: 'Start',
  inventory: [],
  npcs: [],
  chatHistory: [],
  statusElements: [
    { id: 'sd1', label: 'Datum', value: 'Tag 1' },
    { id: 'st1', label: 'Uhrzeit', value: '23:45' }
  ],
  world: sampleWorld,
  player: {
    id: 'p1',
    name: 'Hero',
    role: 'Held',
    bio: '',
    goal: '',
    currentSituation: '',
    personality: '',
    attributes: [],
    appearance: { currentLocation: 'Gasthaus', hairColor: '', eyeColor: '', age: '', build: '', gender: 'Männlich' }
  }
};

const simStep = WorldSimulationService.runSimulationStep({
  world: sampleWorld,
  adventure: sampleAdv,
  minutesToAdd: 30 // Advances from 23:45 -> 00:15 of Tag 2
});

assert(simStep.timeEnd.day === 2, 'Simulation step must roll over to Day 2');
assert(simStep.timeEnd.hour === 0 && simStep.timeEnd.minute === 15, 'Time must be 00:15');
assert(simStep.updatedAdventure?.statusElements?.find(s => s.label === 'Datum')?.value === 'Tag 2', 'Adventure status Datum must be Tag 2');
assert(simStep.updatedAdventure?.statusElements?.find(s => s.label === 'Uhrzeit')?.value === '00:15', 'Adventure status Uhrzeit must be 00:15');

console.log(`\n=== DATE & TIME INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
