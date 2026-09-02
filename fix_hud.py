import re

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix instruction 4 in both prompt locations
old_instruction_4 = r"4\. Nutze das HUD für Änderungen: \[\[STATUS: Feld1=Wert1, Feld2=Wert2\]\]\. Trenne mehrere Änderungen zwingend mit einem Komma! Du KANNST und SOLLST Zeit und Ausdauer anpassen, wenn die Handlung es erfordert \(z\.B\. Schlafen regeneriert Ausdauer und lässt viel Zeit vergehen\)\."
new_instruction_4 = r"4. Nutze das HUD für Änderungen der AKTUELLEN WERTE: [[STATUS: Feld1=Wert1, Feld2=Wert2]]. Trenne mehrere Änderungen zwingend mit einem Komma! Du KANNST und SOLLST Werte anpassen, wenn die Handlung es erfordert. WICHTIG: Nutze AUSSCHLIESSLICH die exakten Feldnamen, die dir unter \"AKTUELLE WERTE\" übergeben wurden! Erfinde NIEMALS neue HUD-Felder, die nicht in den aktuellen Werten stehen."

text = re.sub(old_instruction_4, new_instruction_4, text)

with open('components/GameView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Replaced instruction 4:", new_instruction_4 in text)
