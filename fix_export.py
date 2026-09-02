with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text += '\nexport default GameView;\n'

with open('components/GameView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
