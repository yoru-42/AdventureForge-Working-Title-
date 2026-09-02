const fs = require('fs');
const content = fs.readFileSync('components/GameView.tsx', 'utf8');
const elseBlockStart = "        /* SPEZIELLES DEDIZIERTES KAMPFFELD (MULTI-PANEL COMBAT STAGE) */";
const startIdx = content.indexOf(elseBlockStart);
const endAnchor = 'fa-paper-plane text-sm"></i>\n                  </button>\n                </div>\n              </div>';
const endIdx = content.lastIndexOf(endAnchor) + endAnchor.length;
const combatStr = content.slice(startIdx, endIdx);

let open = (combatStr.match(/<div/g) || []).length;
let close = (combatStr.match(/<\/div>/g) || []).length;
console.log("Open: ", open, "Close: ", close, "Diff: ", open - close);
