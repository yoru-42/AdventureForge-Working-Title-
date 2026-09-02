import sys

with open('components/GameView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """                const isPnr = labelLower.includes('point of no return') || labelLower.includes('pnr');
                const isAbkling = labelLower.includes('abklingzeit') || labelLower.includes('cooldown');
                const isVerwandlung = labelLower.includes('verwandlungsstufe') || labelLower.includes('mutationsgrad');

                let finalValue = el.value || '';
                let isReadonly = false;
                let colorClass = 'text-amber-400';

                if (isPnr) {
                  finalValue = `${formatNum(transSettings.pnrThreshold)}%`;
                  isReadonly = true;
                  colorClass = 'text-red-400';
                } else if (isVerwandlung) {
                  finalValue = `${formatNum(resolvedApp.transformationIntensityVal || 0)}%`;
                  isReadonly = true;
                  colorClass = 'text-purple-400';
                } else if (isAbkling) {
                  finalValue = `-${formatNum(transSettings.abklingenStep)}%/${transSettings.timeUnit}`;
                  isReadonly = true;
                  colorClass = 'text-sky-400';
                }"""

replacement = """                const isPnr = labelLower.includes('point of no return') || labelLower.includes('pnr');
                const isAbkling = labelLower.includes('abklingzeit') || labelLower.includes('cooldown');
                const isVerwandlung = labelLower.includes('verwandlungsstufe') || labelLower.includes('mutationsgrad') || labelLower.includes('verwandlung');

                // Special system elements (Verwandlungsstufe, Point of No Return, Abklingzeit)
                // are already rendered as high-detail composite badges above. Skip rendering them as duplicate generic boxes.
                if (isPnr || isVerwandlung || isAbkling) {
                  return null;
                }

                let finalValue = el.value || '';
                let isReadonly = false;
                let colorClass = 'text-amber-400';"""

if target in content:
    new_content = content.replace(target, replacement, 1)
    with open('components/GameView.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("PATCH SUCCESSFUL")
else:
    print("TARGET NOT FOUND")
