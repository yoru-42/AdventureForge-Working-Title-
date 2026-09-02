import subprocess
import os

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
while lines and lines[-1].strip() in ('', '}', ');', '</div>', '    </div>', ')}'):
    lines.pop()

# Add 4 divs
lines.extend(['    </div>'] * 4)
# Add )}
lines.append('            )}')
# Add main component closers
lines.append('          </div>')
lines.append('        </div>')
lines.append('      </div>')
lines.append('    </div>')
lines.append('  );')
lines.append('}')

with open('test.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

res = subprocess.run(['npx', 'esbuild', 'test.tsx', '--outfile=out.js'], capture_output=True, text=True)
print(f"Error:\n{res.stderr.strip()}")
