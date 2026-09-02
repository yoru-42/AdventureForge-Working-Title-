import subprocess
import os

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
while lines and lines[-1].strip() in ('', '}', ');', '</div>', '    </div>', ')}'):
    lines.pop()

for before in range(2, 6):
    for after in range(0, 6):
        test_lines = lines[:]
        test_lines.extend(['    </div>'] * before)
        test_lines.append('            )}')
        test_lines.extend(['    </div>'] * after)
        test_lines.append('  );')
        test_lines.append('}')
        
        with open('test.tsx', 'w', encoding='utf-8') as f:
            f.write('\n'.join(test_lines))
        
        res = subprocess.run(['npx', 'esbuild', 'test.tsx', '--outfile=out.js'], capture_output=True, text=True)
        if res.returncode == 0:
            print(f"Success! before={before}, after={after}")
            import sys; sys.exit(0)

