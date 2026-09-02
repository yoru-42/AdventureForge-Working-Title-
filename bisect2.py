import subprocess

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def test_file():
    res = subprocess.run(['npx', 'esbuild', 'test.tsx', '--outfile=out.js'], capture_output=True, text=True)
    return res.returncode == 0, res.stderr

print("Starting bisection 2...")
for start_idx in range(9400, 9270, -10):
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
            
