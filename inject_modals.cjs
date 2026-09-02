const fs = require('fs');

let content = fs.readFileSync('components/GameView.tsx', 'utf8');
let modals = fs.readFileSync('modals.tsx', 'utf8');

// The end of GameView.tsx is:
//       )}
//     </div>
//   );
// };
// 
// export default GameView;

content = content.replace(
    /      \)}\n    <\/div>\n  \);\n};\n\nexport default GameView;/g, 
    `      )}\n\n${modals}\n    </div>\n  );\n};\n\nexport default GameView;`
);

fs.writeFileSync('components/GameView.tsx', content);
