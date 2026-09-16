const fs = require('fs');

const targetContent = `export function getBranchesForField(fieldId: string, fieldName?: string): ProfessionBranchProgression[] {
  const cleanFieldName = fieldName || fieldId;
  const branchKeys = FIELD_BRANCH_MAP[fieldId];

  if (branchKeys && branchKeys.length > 0) {
    return branchKeys.map(key => {
      if (DETAILED_PROFESSION_PROGRESSIONS[key]) {
        return DETAILED_PROFESSION_PROGRESSIONS[key];
      }
      const jobName = key.charAt(0).toUpperCase() + key.slice(1);
      return generateDefaultRanksForJob(jobName, fieldId, cleanFieldName);
    });
  }

  // Fallback to preset jobs in JOB_CATEGORIES
  const categoryPreset = JOB_CATEGORIES.find(c => c.fieldId === fieldId);
  if (categoryPreset && categoryPreset.jobs.length > 0) {
    const rawJobs = categoryPreset.jobs;
    const branches: ProfessionBranchProgression[] = [];
    const seen = new Set<string>();

    for (const rawJob of rawJobs) {
      const parts = rawJob.split(' / ').map(p => p.trim());
      const mainJob = parts[0];
      const mainKey = mainJob.toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (seen.has(mainKey)) continue;
      seen.add(mainKey);

      if (DETAILED_PROFESSION_PROGRESSIONS[mainKey]) {
        branches.push(DETAILED_PROFESSION_PROGRESSIONS[mainKey]);
      } else {
        branches.push(generateDefaultRanksForJob(mainJob, fieldId, cleanFieldName));
      }
    }
    return branches;
  }

  // Ultimate fallback
  return [generateDefaultRanksForJob(\`Fachkraft für \${cleanFieldName}\`, fieldId, cleanFieldName)];
}`;

const replacementContent = `export function getBranchesForField(fieldId: string, fieldName?: string): ProfessionBranchProgression[] {
  const cleanFieldName = fieldName || fieldId;
  const branchKeys = FIELD_BRANCH_MAP[fieldId] || [];

  const branches: ProfessionBranchProgression[] = [];
  const seen = new Set<string>();

  // 1. Process manually mapped branches first
  for (const key of branchKeys) {
    if (seen.has(key)) continue;
    seen.add(key);

    if (DETAILED_PROFESSION_PROGRESSIONS[key]) {
      branches.push(DETAILED_PROFESSION_PROGRESSIONS[key]);
    } else {
      const jobName = key.charAt(0).toUpperCase() + key.slice(1);
      branches.push(generateDefaultRanksForJob(jobName, fieldId, cleanFieldName));
    }
  }

  // 2. Process all preset jobs in JOB_CATEGORIES to ensure no profession is left behind
  const categoryPreset = JOB_CATEGORIES.find(c => c.fieldId === fieldId);
  if (categoryPreset && categoryPreset.jobs.length > 0) {
    const rawJobs = categoryPreset.jobs;
    for (const rawJob of rawJobs) {
      const parts = rawJob.split(' / ').map(p => p.trim());
      const mainJob = parts[0];
      
      // Standard key normalization
      const mainKey = mainJob.toLowerCase().replace(/[^a-z0-9]/g, '_');
      // German umlaut aware normalization
      const umKey = mainJob.toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]/g, '_');

      if (seen.has(mainKey) || seen.has(umKey)) continue;
      
      seen.add(mainKey);
      seen.add(umKey);

      if (DETAILED_PROFESSION_PROGRESSIONS[mainKey]) {
        branches.push(DETAILED_PROFESSION_PROGRESSIONS[mainKey]);
      } else if (DETAILED_PROFESSION_PROGRESSIONS[umKey]) {
        branches.push(DETAILED_PROFESSION_PROGRESSIONS[umKey]);
      } else {
        branches.push(generateDefaultRanksForJob(mainJob, fieldId, cleanFieldName));
      }
    }
  }

  // Ultimate fallback
  if (branches.length === 0) {
    return [generateDefaultRanksForJob(\`Fachkraft für \${cleanFieldName}\`, fieldId, cleanFieldName)];
  }
  
  return branches;
}`;

let code = fs.readFileSync('lib/professionProgressionData.ts', 'utf8');
if (code.includes('if (branchKeys && branchKeys.length > 0) {')) {
  code = code.replace(targetContent, replacementContent);
  fs.writeFileSync('lib/professionProgressionData.ts', code);
  console.log('Replaced successfully');
} else {
  console.log('Target content not found!');
}
