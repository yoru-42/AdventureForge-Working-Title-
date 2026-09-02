with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const parseStatusUpdates" in line:
        print("".join(lines[i+35:i+60]))
        break
