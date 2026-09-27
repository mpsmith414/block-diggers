// Visitors (bear baker, rabbit shopkeeper, owl explorer), the sticker-book
// icon, the lectern the book rests on, and the market stall.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

const BEAR = [
  [
    '..oo......oo....',
    '.obbo....obbo...',
    '.obbooooooobbo..',
    '..obbbbbbbbbo...',
    '.obbwwbbbbwwbo..',
    '.obbbkbbbbkbbo..',
    '.obbbbmmmmbbbo..',
    '.obrbbmnnmbrbo..',
    '..obbbbmmbbbo...',
    '..owwwwwwwwwo...',
    '.owwwwwwwwwwwo..',
    '.obowwwwwwwobo..',
    '..owwwwwwwwwo...',
    '..owwwwwwwwwo...',
    '...obbo..obbo...',
    '...oooo..oooo...',
  ],
  [
    '..oo......oo....',
    '.obbo....obbo...',
    '.obbooooooobbo..',
    '..obbbbbbbbbo...',
    '.obbwwbbbbwwbo..',
    '.obbbkbbbbkbbo..',
    '.obbbbmmmmbbbo..',
    '.obrbbmnnmbrbo..',
    '..obbbbmmbbbo...',
    '..owwwwwwwwwo...',
    '.owwwwwwwwwwwo..',
    'obboowwwwwwoobo.',
    '..owwwwwwwwwo...',
    '..owwwwwwwwwo...',
    '....obbo.obbo...',
    '....oooo.oooo...',
  ],
];

const RABBIT = [
  [
    '...oo....oo.....',
    '..owwo..owwo....',
    '..owpo..owpo....',
    '..owpo..owpo....',
    '..owwoooowwo....',
    '..owwwwwwwwo....',
    '.owwkwwwwkwwo...',
    '.owwwwwwwwwwo...',
    '.owrwwnnwwrwo...',
    '..owwwwwwwwo....',
    '..ogggggggggo...',
    '.oggyggggyggo...',
    '..ogggggggggo...',
    '..oggggggggo....',
    '...owwo.owwo....',
    '...oooo.oooo....',
  ],
  [
    '..oo......oo....',
    '.owwo....owwo...',
    '.owpo...owpo....',
    '..owpo..owpo....',
    '..owwoooowwo....',
    '..owwwwwwwwo....',
    '.owwkwwwwkwwo...',
    '.owwwwwwwwwwo...',
    '.owrwwnnwwrwo...',
    '..owwwwwwwwo....',
    '..ogggggggggo...',
    '.oggyggggyggo...',
    '..ogggggggggo...',
    '..oggggggggo....',
    '....owwo.owwo...',
    '....oooo.oooo...',
  ],
];

const OWL = [
  [
    '..o........o....',
    '..oooooooooo....',
    '.ohhhhhhhhhho...',
    '.ohwwwhhwwwho...',
    '.ohwkwhhwkwho...',
    '.ohwwwyywwwho...',
    '.ohhhhyyhhhho...',
    '.ohhcchhcchho...',
    '.ohcchhhhcchho..',
    '.ohhcchhcchhho..',
    '..ohhhhhhhhho...',
    '..ohhhhhhhhho...',
    '..ogggggggggo...',
    '...oyo..oyo.....',
    '...oyyo.oyyo....',
    '...oooo.oooo....',
  ],
  [
    '..o........o....',
    '..oooooooooo....',
    '.ohhhhhhhhhho...',
    '.ohwwwhhwwwho...',
    '.ohwkwhhwkwho...',
    '.ohwwwyywwwho...',
    '.ohhhhyyhhhho...',
    'oohhcchhcchhoo..',
    'ohhcchhhhcchhho.',
    '.ohhcchhcchhho..',
    '..ohhhhhhhhho...',
    '..ohhhhhhhhho...',
    '..ogggggggggo...',
    '...oyo..oyo.....',
    '...oyyo.oyyo....',
    '...oooo.oooo....',
  ],
];

function strip(scene, canvasTexture, key, frames, pal) {
  const { tex, ctx } = canvasTexture(scene, key, 16 * frames.length, 16);
  frames.forEach((rows, i) => {
    drawMap(ctx, i * 16, 0, rows, pal);
    tex.add(i, 0, i * 16, 0, 16, 16);
  });
  tex.refresh();
}

export function drawFriends(scene, canvasTexture, rect) {
  strip(scene, canvasTexture, 'friend-bear', BEAR, { o: OUT, b: '#a0703c', w: '#fff6e8', k: OUT, m: '#d8b890', n: OUT, r: '#ff9ab0' });
  strip(scene, canvasTexture, 'friend-rabbit', RABBIT, { o: OUT, w: '#fbf7ee', p: '#ffb0c8', k: OUT, n: '#ff7eb6', r: '#ff9ab0', g: '#6bbf59', y: '#ffe066' });
  strip(scene, canvasTexture, 'friend-owl', OWL, { o: OUT, h: '#9a7a5a', w: '#fff6e0', k: OUT, y: '#f5c629', c: '#7a5a3a', g: '#4a92b8' });

  // the sticker book icon
  {
    const { tex, ctx } = canvasTexture(scene, 'icon-book', 12, 12);
    drawMap(ctx, 0, 0, [
      '.oooooooooo.',
      'orrrrrrrrrro',
      'orggrrrrrrro',
      'orgYgrrrrrro',
      'orggrrrrrrro',
      'orrrrryrrrro',
      'orrrryyyrrro',
      'orrrrryrrrro',
      'orrrrrrrrrro',
      'owwwwwwwwwwo',
      'owwwwwwwwwwo',
      '.oooooooooo.',
    ], { o: OUT, r: '#c94c45', g: '#6be26a', Y: '#fff2a0', y: '#ffd84a', w: '#f4e4c1' });
    tex.refresh();
  }
  // a lectern with the open book on it
  {
    const { tex, ctx } = canvasTexture(scene, 'lectern', 18, 26);
    rect(ctx, OUT, 7, 10, 4, 14);
    rect(ctx, '#9a5f2c', 8, 10, 2, 14);
    rect(ctx, OUT, 3, 23, 12, 3);
    rect(ctx, '#7a4a22', 4, 23, 10, 2);
    rect(ctx, OUT, 1, 5, 16, 6);
    rect(ctx, '#b87a44', 2, 6, 14, 4);
    rect(ctx, '#f4e4c1', 2, 2, 7, 5);
    rect(ctx, '#f4e4c1', 9, 2, 7, 5);
    rect(ctx, '#c94c45', 8, 2, 2, 5);
    rect(ctx, '#6be26a', 4, 3, 2, 2);
    rect(ctx, '#ffd84a', 12, 3, 2, 2);
    tex.refresh();
  }
  // the market stall: striped awning over a little counter
  {
    const { tex, ctx } = canvasTexture(scene, 'stall', 48, 40);
    for (let x = 0; x < 48; x += 8) {
      rect(ctx, x % 16 ? '#fff6e0' : '#e0503a', x, 2, 8, 9);
      rect(ctx, x % 16 ? '#fff6e0' : '#e0503a', x + 1, 11, 6, 2);
    }
    rect(ctx, OUT, 0, 1, 48, 1);
    rect(ctx, OUT, 3, 12, 3, 28);
    rect(ctx, OUT, 42, 12, 3, 28);
    rect(ctx, '#9a5f2c', 4, 12, 1, 28);
    rect(ctx, '#9a5f2c', 43, 12, 1, 28);
    rect(ctx, OUT, 2, 26, 44, 14);
    rect(ctx, '#b87a44', 3, 27, 42, 12);
    rect(ctx, '#9a5f2c', 3, 32, 42, 1);
    // goods on the counter
    rect(ctx, '#ff7eb6', 8, 22, 5, 4);
    rect(ctx, '#ffe066', 16, 21, 4, 5);
    rect(ctx, '#8ec5ff', 24, 22, 6, 4);
    rect(ctx, '#7ad65a', 34, 21, 5, 5);
    tex.refresh();
  }
}
