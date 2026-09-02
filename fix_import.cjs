const fs = require('fs');
let content = fs.readFileSync('components/AdventureEditor.tsx', 'utf8');

if (!content.includes('import { getTransformationCardSettings }')) {
   content = content.replace(
      "import { BodySilhouette } from './BodySilhouette';",
      "import { BodySilhouette } from './BodySilhouette';\nimport { getTransformationCardSettings } from './TransformationIntensityCard';"
   );
   fs.writeFileSync('components/AdventureEditor.tsx', content);
   console.log('Import added!');
} else {
   console.log('Already there');
}
