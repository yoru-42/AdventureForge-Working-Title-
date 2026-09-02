import subprocess
import re

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's fix the divs before <form>.
# find the block:
#                  </div>
#                </div>
#              </div>
#              
#              {/* Main Text Input Area */}
text = re.sub(r'                  </div>\n                </div>\n              </div>\n              \n              \{\/\* Main Text Input Area \*\/\}',
              r'                  </div>\n                </div>\n              \n              {/* Main Text Input Area */}', text)

with open('components/GameView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

# Try up to 10 </div> at the end to see which one compiles
for i in range(3, 10):
    lines = text.split('\n')
    # strip trailing lines that are just `</div>`, `);`, `}`
    while lines and lines[-1].strip() in ('', '}', ');', '</div>'):
        lines.pop()
    
    # append `i` divs
    lines.extend(['    </div>'] * i)
    lines.append('  );')
    lines.append('}')
    
    with open('components/GameView.tsx', 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    
    res = subprocess.run(['npx', 'tsc', '--noEmit'], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"Success with {i} divs!")
        break
    else:
        print(f"Failed with {i} divs.")
        # print(res.stdout)
