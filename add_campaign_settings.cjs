const fs = require('fs');
let content = fs.readFileSync('components/AdventureEditor.tsx', 'utf-8');

const importStatement = `import CampaignPowerSettings from './CampaignPowerSettings';\n`;
if (!content.includes('CampaignPowerSettings')) {
  content = content.replace(/(import .*;\n)(?=\n*interface)/, '$1' + importStatement);
}

const newStepContent = `\n          {step === 2 && mode !== GameViewMode.JOIN_CUSTOM_CHAR && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-100">Kampagnen-Einstellungen</h3>
              </div>
              <CampaignPowerSettings 
                data={world.campaignPowerSettings || {}}
                onChange={(newData) => setWorld({ ...world, campaignPowerSettings: newData })}
              />
            </div>
          )}\n`;

content = content.replace(/(\{\s*step === 3 && mode !== GameViewMode\.JOIN_CUSTOM_CHAR && \()/g, newStepContent + '\n          $1');

fs.writeFileSync('components/AdventureEditor.tsx', content);
console.log('Inserted step 2');
