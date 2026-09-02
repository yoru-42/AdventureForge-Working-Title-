export interface HeterochromiaState {
  hasHeterochromia: boolean;
  eyeColorLeft: string;
  eyeColorRight: string;
}

export function parseHeterochromiaDetails(
  hasHeterochromiaProp?: boolean,
  eyeColor?: string,
  eyeColorLeft?: string,
  eyeColorRight?: string
): HeterochromiaState {
  const eyeStr = (eyeColor || '').trim();
  const isExplicit = hasHeterochromiaProp !== undefined ? Boolean(hasHeterochromiaProp) : false;
  const containsHeteroKeyword = /heterochrom/i.test(eyeStr);
  const hasSplitValues = Boolean(eyeColorLeft || eyeColorRight);

  const isHetero = isExplicit || containsHeteroKeyword || hasSplitValues;

  let left = eyeColorLeft || '';
  let right = eyeColorRight || '';

  if (isHetero && !left && !right && eyeStr) {
    // 1. Check for "Links: X, Rechts: Y" or "(Links: X, Rechts: Y)"
    const matchLR = eyeStr.match(/links:?\s*([^,;/\)]+)[,;/]\s*rechts:?\s*([^,\)]+)/i);
    if (matchLR) {
      left = matchLR[1].trim();
      right = matchLR[2].trim();
    } else {
      // 2. Check for "X / Y" or "X | Y"
      const clean = eyeStr.replace(/^heterochromie:?\s*/i, '').trim();
      const matchSlash = clean.split(/[\/|]/);
      if (matchSlash.length === 2) {
        left = matchSlash[0].trim();
        right = matchSlash[1].trim();
      } else {
        // 3. Simple single color provided after keyword like "Heterochromie rubinrot"
        left = clean;
      }
    }
  }

  return {
    hasHeterochromia: isHetero,
    eyeColorLeft: left,
    eyeColorRight: right
  };
}

export function formatHeterochromiaEyeColor(left: string, right: string): string {
  const l = (left || '').trim();
  const r = (right || '').trim();
  if (!l && !r) return 'Heterochromie';
  if (l && r) return `Heterochromie (Links: ${l}, Rechts: ${r})`;
  if (l) return `Heterochromie (Links: ${l})`;
  return `Heterochromie (Rechts: ${r})`;
}
