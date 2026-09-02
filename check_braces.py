import re

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's just run tsc --noEmit in python and get the full error. Oh wait, I can just do that directly.
