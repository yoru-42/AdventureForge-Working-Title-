with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "function parseStatusUpdates" in line or "const parseStatusUpdates" in line:
        print("Found parseStatusUpdates at line", i)
        print("".join(lines[i:i+40]))
        break
