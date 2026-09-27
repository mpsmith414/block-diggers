// The three pets (two frames each) and the nest they hatch in.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

const MOLE = [
  [
    '................',
    '................',
    '.....oooooo.....',
    '...oobbbbbboo...',
    '..obbbbbbbbbbo..',
    '.obbbkbbbbkbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbrbppbrbbbo.',
    '.obbbbbppbbbbbo.',
    '..obbbbbbbbbbo..',
    '..occo....occo..',
    '...oo......oo...',
  ],
  [
    '................',
    '.....oooooo.....',
    '...oobbbbbboo...',
    '..obbbbbbbbbbo..',
    '.obbbkbbbbkbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbrbppbrbbbo.',
    '.obbbbbppbbbbbo.',
    '..obbbbbbbbbbo..',
    '...occo..occo...',
    '....oo....oo....',
    '................',
  ],
];

const BUG = [
  [
    '..w......w..',
    '.www.oo.www.',
    '.wwwoyyowww.',
    '..woyYyyow..',
    '...oyykyyo..',
    '...oyyyyyo..',
    '...oyrryyo..',
    '....oyyyo...',
    '.....ooo....',
    '............',
  ],
  [
    '............',
    '.....oo.....',
    '..w.oyyo.w..',
    '.wwoyYyyoww.',
    'wwwoyykyyowww',
    '.w.oyyyyyo.w.',
    '...oyrryyo..',
    '....oyyyo...',
    '.....ooo....',
    '............',
  ],
];

const BAT = [
  [
    '..o........o....',
    '.oto......oto...',
    'otto.oooo.otto..',
    'otttottttottto..',
    '.oottttttttoo...',
    '...otkttktto....',
    '...otttttttto...',
    '...ottrwwrtto...',
    '....otttttto....',
    '.....oooooo.....',
    '................',
    '................',
  ],
  [
    '................',
    '................',
    '......oooo......',
    '.oo..otttto..oo.',
    'ottoottttttootto',
    'otttotkttktottto',
    '.ootottttttotoo.',
    '...ottrwwrtto...',
    '....otttttto....',
    '.....oooooo.....',
    '................',
    '................',
  ],
];

function strip(scene, canvasTexture, key, frames, w, h, pal) {
  const { tex, ctx } = canvasTexture(scene, key, w * frames.length, h);
  frames.forEach((rows, i) => {
    drawMap(ctx, i * w, 0, rows, pal);
    tex.add(i, 0, i * w, 0, w, h);
  });
  tex.refresh();
}

export function drawPets(scene, canvasTexture, rect) {
  strip(scene, canvasTexture, 'pet-mole', MOLE, 16, 12, { o: OUT, b: '#8a6450', k: OUT, r: '#ff9ab0', p: '#ff7eb6', c: '#f4e4c1' });
  strip(scene, canvasTexture, 'pet-glowbug', BUG, 13, 10, { o: '#6a5a10', y: '#ffe066', Y: '#fff8d0', k: OUT, r: '#ff9ab0', w: 'rgba(230,250,255,0.85)' });
  strip(scene, canvasTexture, 'pet-batbuddy', BAT, 16, 12, { o: '#1a3a40', t: '#4ad0c8', k: OUT, r: '#ff9ab0', w: '#ffffff' });
  // a cosy twig nest
  const { tex, ctx } = canvasTexture(scene, 'nest', 26, 10);
  rect(ctx, '#5a3a20', 1, 4, 24, 5);
  rect(ctx, '#7a5230', 0, 3, 26, 3);
  for (let x = 1; x < 25; x += 3) rect(ctx, '#a0703c', x, 2 + (x % 2), 3, 1);
  rect(ctx, '#c8904e', 3, 6, 20, 1);
  rect(ctx, '#f0d070', 6, 3, 14, 1);
  tex.refresh();
}
