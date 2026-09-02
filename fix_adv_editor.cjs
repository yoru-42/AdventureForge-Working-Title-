const fs = require('fs');
let content = fs.readFileSync('components/AdventureEditor.tsx', 'utf8');

// Ensure import
if (!content.includes('getTransformationCardSettings')) {
  content = content.replace(
    "import { generateGameSummary } from '../lib/gemini';",
    "import { generateGameSummary } from '../lib/gemini';\nimport { getTransformationCardSettings } from './TransformationIntensityCard';"
  );
}

const targetBlock = `                  const labelLower = (el.label || '').toLowerCase();
                  const isLocation = labelLower.includes('standort') || labelLower.includes('ort');
                  const rawVal = el.value || (isLocation ? (player.appearance.currentLocation || '') : '');
                  const isPnr = labelLower.includes('point of no return') || labelLower.includes('pnr');
                  const isAbkling = labelLower.includes('abklingzeit') || labelLower.includes('cooldown');
                  const isVerwandlung = labelLower.includes('verwandlungsstufe') || labelLower.includes('mutationsgrad');

                  let rawVal = el.value || '';
                  let isReadonly = false;
                  
                  if (isPnr || isAbkling || isVerwandlung) {
                     const transSettings = getTransformationCardSettings();
                     isReadonly = true;
                     if (isPnr) rawVal = \`\${transSettings.pnrThreshold}%\`;
                     if (isAbkling) rawVal = \`-\${transSettings.abklingenStep}%/\${transSettings.timeUnit}\`;
                     if (isVerwandlung) rawVal = \`0% (Live im Spiel)\`;
                  } else {
                     rawVal = el.value || (isLocation ? (player.appearance.currentLocation || '') : '');
                  }
                  
                  const displayValue = isLocation ? formatDisplayLocationName(rawVal) : rawVal;`;

const fixBlock = `                  const labelLower = (el.label || '').toLowerCase();
                  const isLocation = labelLower.includes('standort') || labelLower.includes('ort');
                  const isPnr = labelLower.includes('point of no return') || labelLower.includes('pnr');
                  const isAbkling = labelLower.includes('abklingzeit') || labelLower.includes('cooldown');
                  const isVerwandlung = labelLower.includes('verwandlungsstufe') || labelLower.includes('mutationsgrad');

                  let computedRawVal = el.value || '';
                  let isReadonly = false;
                  
                  if (isPnr || isAbkling || isVerwandlung) {
                     const transSettings = getTransformationCardSettings();
                     isReadonly = true;
                     if (isPnr) computedRawVal = \`\${transSettings.pnrThreshold}%\`;
                     if (isAbkling) computedRawVal = \`-\${transSettings.abklingenStep}%/\${transSettings.timeUnit}\`;
                     if (isVerwandlung) computedRawVal = \`0% (Live im Spiel)\`;
                  } else {
                     computedRawVal = el.value || (isLocation ? (player.appearance.currentLocation || '') : '');
                  }
                  
                  const displayValue = isLocation ? formatDisplayLocationName(computedRawVal) : computedRawVal;`;

content = content.replace(targetBlock, fixBlock);
fs.writeFileSync('components/AdventureEditor.tsx', content);
