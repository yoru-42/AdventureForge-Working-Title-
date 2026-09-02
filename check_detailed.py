filepath = 'components/GameView.tsx'
with open(filepath, 'r') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    for j, char in enumerate(line):
        if char == '(':
            stack.append(('(', i+1, j+1))
        elif char == ')':
            if stack and stack[-1][0] == '(':
                stack.pop()
            else:
                print(f"Unexpected ) at {i+1}:{j+1}")

for s in stack:
    print(f"Unclosed {s[0]} at {s[1]}:{s[2]}")
