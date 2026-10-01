import { WorldSimulationService } from '../services/worldSimulationService';
import { ActiveTimeEventService } from '../services/activeTimeEventService';
import { AdventureResetService } from '../services/adventureResetService';
import { WorldTime, Adventure, StatusElement } from '../types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  } else {
    console.log(`[PASS] ${msg}`);
  }
}

console.log('=== RUNNING WORLD TIME & DATE INTEGRATION TESTS ===');

// Test 1: Date & Time formatting and parsing
console.log('\n--- Test 1: Date & Time formatting and parsing ---');
const wt1: WorldTime = { day: 3, hour: 14, minute: 45 };
assert(WorldSimulationService.formatDate(wt1) === 'Tag 3', 'Format date returns "Tag 3"');
assert(WorldSimulationService.formatTime(wt1) === '14:45', 'Format time returns "14:45"');
assert(WorldSimulationService.formatDateTime(wt1) === 'Tag 3, 14:45', 'Format date & time returns "Tag 3, 14:45"');

const parsedT = WorldSimulationService.parseTimeString('08:30 Uhr');
assert(parsedT !== null && parsedT.hour === 8 && parsedT.minute === 30, 'Parse time string extracts 08:30');

const parsedD = WorldSimulationService.parseDateString('Tag 12');
assert(parsedD !== null && parsedD.day === 12, 'Parse date string extracts day 12');

// Test 2: Status elements synchronization with WorldTime
console.log('\n--- Test 2: Status elements synchronization with WorldTime ---');
const emptyStatus: StatusElement[] = [
  { id: 'loc-1', label: 'Standort', value: 'Hafen' },
  { id: 'money-1', label: 'Vermögen', value: '100 Gold' }
];
const synced = WorldSimulationService.syncStatusElementsWithWorldTime(emptyStatus, wt1);
const dateEl = synced.find(s => s.label.toLowerCase() === 'datum');
const timeEl = synced.find(s => s.label.toLowerCase() === 'uhrzeit');

assert(!!dateEl && dateEl.value === 'Tag 3', 'Datum automatically injected into status elements as "Tag 3"');
assert(!!timeEl && timeEl.value === '14:45', 'Uhrzeit automatically injected into status elements as "14:45"');

// Test 3: AI chat status processing with explicit Tag & Zeit tags
console.log('\n--- Test 3: AI chat status processing with explicit Tag & Zeit tags ---');
const aiOutput1 = 'Der Wind frischt auf.\n[[STATUS: Datum=Tag 4, Zeit=09:15]]';
const processResult1 = WorldSimulationService.processWorldTimeAndStatusFromChat({
  rawAiText: aiOutput1,
  prevWorldTime: wt1,
  statusElements: synced,
  fallbackActionText: 'Ich sehe mich am Hafen um'
});
assert(processResult1.updatedWorldTime.day === 4, 'Day updated to 4 from AI status');
assert(processResult1.updatedWorldTime.hour === 9 && processResult1.updatedWorldTime.minute === 15, 'Time updated to 09:15 from AI status');
assert(processResult1.hadExplicitDate === true, 'Had explicit date flag is true');
assert(processResult1.hadExplicitTime === true, 'Had explicit time flag is true');

// Test 4: Midnight rollover detection
console.log('\n--- Test 4: Midnight rollover detection ---');
const lateEvening: WorldTime = { day: 1, hour: 23, minute: 45, totalMinutes: 1425 };
const aiNight = 'Ihr wacht im Morgengrauen auf.\n[[STATUS: Zeit=06:30]]';
const processResult2 = WorldSimulationService.processWorldTimeAndStatusFromChat({
  rawAiText: aiNight,
  prevWorldTime: lateEvening,
  statusElements: [],
  fallbackActionText: 'Ich schlafe'
});
assert(processResult2.updatedWorldTime.day === 2, 'Day rolled over from 1 to 2 when time crossed midnight (23:45 -> 06:30)');
assert(processResult2.updatedWorldTime.hour === 6 && processResult2.updatedWorldTime.minute === 30, 'Time updated to 06:30');

// Test 5: Fallback realistic advancement when no explicit status tag
console.log('\n--- Test 5: Fallback realistic advancement when no explicit status tag ---');
const dayStart: WorldTime = { day: 2, hour: 10, minute: 0, totalMinutes: 2040 };
const aiNoStatus = 'Der Händler nickt euch freundlich zu.';
const processResult3 = WorldSimulationService.processWorldTimeAndStatusFromChat({
  rawAiText: aiNoNoStatusText(),
  prevWorldTime: dayStart,
  statusElements: [],
  fallbackActionText: 'Hallo sagen'
});
function aiNoNoStatusText() { return 'Der Händler nickt.'; }
assert(processResult3.updatedWorldTime.day === 2, 'Day remains 2 for brief action');
assert(processResult3.elapsedMinutes > 0, 'Time elapsed realistically (> 0 minutes)');

// Test 6: Adventure Reset Service synchronizes Datum & Uhrzeit
console.log('\n--- Test 6: Adventure Reset Service synchronizes Datum & Uhrzeit ---');
const mockAdv: Adventure = {
  id: 'adv-test',
  authorId: 'user-1',
  isPublic: false,
  npcs: [],
  inventory: ['Starterpaket'],
  world: { territories: [], connections: [] } as any,
  player: { name: 'Hero', campaignPowerLevels: {} } as any,
  prologue: 'Start',
  firstMessage: 'First',
  chatHistory: [{ id: '1', role: 'user', text: 'Hello' }, { id: '2', role: 'model', text: 'World' }, { id: '3', role: 'user', text: 'Action' }],
  statusElements: [{ id: 's1', label: 'Standort', value: 'Start' }],
  worldTime: { day: 5, hour: 18, minute: 0 },
  initialWorldTime: { day: 1, hour: 8, minute: 0 }
};

const resetAdv = AdventureResetService.resetAdventureToInitialState(mockAdv);
assert(resetAdv.worldTime?.day === 1, 'Reset worldTime day is 1');
assert(resetAdv.worldTime?.hour === 8, 'Reset worldTime hour is 8');
assert(resetAdv.world?.worldTime?.day === 1, 'Reset world.worldTime day is 1');
const resetDateEl = resetAdv.statusElements?.find(s => s.label.toLowerCase() === 'datum');
const resetTimeEl = resetAdv.statusElements?.find(s => s.label.toLowerCase() === 'uhrzeit');
assert(!!resetDateEl && resetDateEl.value === 'Tag 1', 'Reset statusElements has Datum = "Tag 1"');
assert(!!resetTimeEl && resetTimeEl.value === '08:00', 'Reset statusElements has Uhrzeit = "08:00"');

console.log('\n=== ALL WORLD TIME & DATE INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
