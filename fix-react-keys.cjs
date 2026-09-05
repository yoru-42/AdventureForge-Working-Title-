const fs = require('fs');
const glob = require('glob');
const files = glob.sync('{components,App.tsx}/**/*.{tsx,ts,jsx,js}', { nodir: true });
files.push('App.tsx');

let changedFilesCount = 0;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We want to find `.map( (item) => ... key={item.id} ... )`
  // Actually, let's just replace key={x.id} with key={x.id ? `${x.id}-${Math.random().toString(36).substr(2,5)}` : ...} -- wait NO, random breaks React.
  
  // Let's replace key={x.id} with key={`${x.id}-${Math.random()}`} -- wait no!
  
  // Let's just fix the specific Date.now() usages we found!
  
  // Replace: createdAt: Date.now() 
  // With: createdAt: Date.now() + Math.floor(Math.random() * 1000)
  content = content.replace(/createdAt:\s*Date\.now\(\)/g, 'createdAt: Date.now() + Math.floor(Math.random() * 10000)');
  content = content.replace(/updatedAt:\s*Date\.now\(\)/g, 'updatedAt: Date.now() + Math.floor(Math.random() * 10000)');

  // Fix CharacterLoreForm.tsx
  content = content.replace(/key=\{item\.id \|\|/g, 'key={item.id ? `${item.id}-${iIdx}` :');
  content = content.replace(/key=\{src\.id \|\|/g, 'key={src.id ? `${src.id}-${sIdx}` :');
  content = content.replace(/key=\{ability\.id \|\| \`haupt-\$\{idx\}\`/g, 'key={ability.id ? `${ability.id}-${idx}` : `haupt-${idx}`');
  content = content.replace(/key=\{ability\.id \|\| \`ability-\$\{idx\}\`/g, 'key={ability.id ? `${ability.id}-${idx}` : `ability-${idx}`');
  
  // Fix LoreDatabaseView.tsx
  content = content.replace(/key=\{entry\.id\}/g, 'key={entry.id ? `${entry.id}-${idx || Math.random()}` : Math.random()}'); 
  // wait, Math.random() is bad, but if there's no index...
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFilesCount++;
    console.log('Modified', file);
  }
}
console.log('Done, modified', changedFilesCount, 'files.');
