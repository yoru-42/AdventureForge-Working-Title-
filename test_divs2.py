import subprocess
import os

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

for i in [3, 4]:
    lines = text.split('\n')
    # strip trailing
    while lines and lines[-1].strip() in ('', '}', ');', '</div>', '    </div>'):
        lines.pop()
    
    lines.extend(['    </div>'] * i)
    lines.append('  );')
    lines.append('}')
    
    with open('test.tsx', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    res = subprocess.run(['npx', 'esbuild', 'test.tsx', '--outfile=out.js'], capture_output=True, text=True)
    print(f"Error for {i} divs:\n{res.stderr.strip()}")
