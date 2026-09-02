filepath = 'components/GameView.tsx'
with open(filepath, 'r') as f:
    content = f.read()

def count_occurrences(content, start_tag, end_tag):
    starts = content.count(start_tag)
    ends = content.count(end_tag)
    return starts, ends

print('div:', count_occurrences(content, '<div', '</div'))
print('span:', count_occurrences(content, '<span', '</span'))
print('button:', count_occurrences(content, '<button', '</button'))
print('p:', count_occurrences(content, '<p', '</p'))
print('curly:', count_occurrences(content, '{', '}'))
print('paren:', count_occurrences(content, '(', ')'))
