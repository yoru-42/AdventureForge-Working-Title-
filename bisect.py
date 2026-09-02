import subprocess
import os

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The error is at the end, so some block is unclosed.
# Let's delete chunks of lines from 8000 upwards until the error goes away or changes.

def test_file():
    res = subprocess.run(['npx', 'esbuild', 'test.tsx', '--outfile=out.js'], capture_output=True, text=True)
    return res.returncode == 0, res.stderr

print("Starting bisection...")
for start_idx in range(9400, 7000, -50):
    with open('test.tsx', 'w', encoding='utf-8') as f:
        # replace the lines with empty lines to preserve line numbers
        new_lines = lines[:start_idx] + ['\n'] * (9450 - start_idx) + lines[9450:]
        f.writelines(new_lines)
    
    ok, err = test_file()
    if ok:
        print(f"Error went away when deleting {start_idx} to 9450!")
        break
    else:
        if "Unterminated regular expression" not in err:
            print(f"Error changed at {start_idx}: {err.strip()}")
            
