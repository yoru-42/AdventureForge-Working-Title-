import { readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

console.log('=== RUNNING ALL ADVENTUREFORGE TEST SUITES ===\n');

const testsDir = fileURLToPath(new URL('.', import.meta.url));
const files = readdirSync(testsDir)
  .filter(f => (f.endsWith('.test.ts') || f.endsWith('Tests.ts')) && f !== 'runAllTests.ts')
  .sort();

let allPassed = true;
let totalSuites = 0;
let passedSuites = 0;
let failedSuites = 0;

for (const file of files) {
  const filePath = join(testsDir, file);
  totalSuites++;
  console.log(`\n======================================================`);
  console.log(`[SUITE ${totalSuites}/${files.length}] Running ${file}...`);
  console.log(`======================================================`);

  const result = spawnSync('npx', ['tsx', filePath], {
    stdio: 'inherit',
    env: process.env
  });

  if (result.status === 0) {
    passedSuites++;
    console.log(`[PASS] Suite ${file} completed successfully.`);
  } else {
    failedSuites++;
    allPassed = false;
    console.error(`[FAIL] Suite ${file} exited with code ${result.status}`);
  }
}

console.log('\n======================================================');
console.log('=== ADVENTUREFORGE GLOBAL TEST SUMMARY ===');
console.log(`Total Suites: ${totalSuites}`);
console.log(`Passed Suites: ${passedSuites}`);
console.log(`Failed Suites: ${failedSuites}`);
console.log('======================================================\n');

if (!allPassed) {
  process.exit(1);
}
