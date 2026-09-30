// Art for Earth's Whack-a-Mole (the Mole Fair): the moles (happy, bonked, and
// golden), the molehills (the dark hole behind, the dirt lip in front), the
// toy mallet and its stand, the scoreboard, and the stickers' icons.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

// a mole popping up: a round head, a pink nose, little paws on the rim
const MOLE_UP = [
  '....oooooooo....',
  '...obbbbbbbbo...',
  '..obbbbbbbbbbo..',
  '..obbkbbbbkbbo..',
  '..obbwbbbbwbbo..',
  '..obbbbppbbbbo..',
  '..obbbbppbbbbo..',
  '..obbmbbbbmbbo..',
  '..obbbmmmmbbbo..',
  '..obbbbbbbbbbo..',
  '.oppobbbbbbopp o',
  '.oppobbbbbbopp o',
  '..oo.obbbbo.oo..',
  '.....obbbbo.....',
  '.....obbbbo.....',
  '.....obbbbo.....',
].map((r) => r.replace(/ /g, '.'));
// bonked: squished down, dizzy eyes, a bump
const MOLE_BONK = [
  '................',
  '......rr........',
  '....oorroooo....',
  '...obbbbbbbbo...',
  '..obbbbbbbbbbo..',
  '..obkbkbbkbkbo..',
  '..obbkbbbbkbbo..',
  '..obkbkppkbkbo..',
  '..obbbbppbbbbo..',
  '..obbbbmmbbbbo..',
  '..obbbbbbbbbbo..',
  '.oppobbbbbbopp..',
  '.oppobbbbbbopp..',
  '..oo.obbbbo.oo..',
  '.....obbbbo.....',
  '.....obbbbo.....',
];

export function drawWhackArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };
  const brown = { o: OUT, b: '#8a5a3a', k: OUT, w: '#ffffff', p: '#ff9ab8', m: '#5a3a2a', r: '#ff5a5a' };
  const gold = { o: '#6a4a10', b: '#ffd84a', k: OUT, w: '#ffffff', p: '#ff9ab8', m: '#c89a20', r: '#ff5a5a' };

  // the mole (16x16): 0 up, 1 bonked, 2 golden up, 3 golden bonked
  one('whack-mole', 64, 16, (ctx, tex) => {
    [[MOLE_UP, brown], [MOLE_BONK, brown], [MOLE_UP, gold], [MOLE_BONK, gold]].forEach(([map, pal], f) => {
      drawMap(ctx, f * 16, 0, map, pal);
      tex.add(f, 0, f * 16, 0, 16, 16);
    });
  });

  // the molehill: the dark hole behind the mole (28x8), and the dirt lip in front (32x10)
  one('mole-hole', 28, 8, (ctx) => {
    ctx.fillStyle = '#1a0e0a';
    ctx.beginPath(); ctx.ellipse(14, 5, 12, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  });
  one('mole-mound', 32, 10, (ctx) => {
    for (let x = 0; x < 32; x++) {
      const d = Math.abs(x - 15.5) / 16;
      const h = Math.round(10 - d * d * 9);
      const top = 10 - h;
      rect(ctx, OUT, x, top, 1, 1);
      rect(ctx, '#8a5a34', x, top + 1, 1, h - 1);
      if (x % 5 === 1) rect(ctx, '#6b4424', x, top + 3, 2, 2);
    }
    // the rim of the hole
    rect(ctx, '#a3703f', 7, 3, 18, 1);
  });

  // the toy mallet (16x16), held at the end of its handle (bottom middle)
  one('mallet', 16, 16, (ctx) => {
    rect(ctx, OUT, 7, 5, 3, 11);
    rect(ctx, '#c8904e', 8, 5, 1, 11);
    rect(ctx, OUT, 1, 0, 15, 7);
    rect(ctx, '#e0403a', 2, 1, 13, 5);
    rect(ctx, '#ffe066', 2, 1, 2, 5);
    rect(ctx, '#ffe066', 13, 1, 2, 5);
    rect(ctx, '#ff8a8a', 5, 1, 6, 1);
  });

  // the mallet stand (24x20): a little wooden rack
  one('mallet-stand', 24, 20, (ctx) => {
    rect(ctx, OUT, 2, 6, 3, 14);
    rect(ctx, '#a0703c', 3, 7, 1, 13);
    rect(ctx, OUT, 19, 6, 3, 14);
    rect(ctx, '#a0703c', 20, 7, 1, 13);
    rect(ctx, OUT, 0, 5, 24, 4);
    rect(ctx, '#c8904e', 1, 6, 22, 2);
    rect(ctx, OUT, 0, 18, 24, 2);
  });

  // the scoreboard (64x36): a mole face on the left, room for the number
  one('whack-board', 64, 36, (ctx) => {
    rect(ctx, OUT, 0, 0, 64, 32);
    rect(ctx, '#3a2a5a', 2, 2, 60, 28);
    for (let x = 4; x < 62; x += 6) { rect(ctx, x % 12 === 4 ? '#ffe066' : '#ff7eb6', x, 3, 2, 2); rect(ctx, x % 12 === 4 ? '#ff7eb6' : '#ffe066', x, 27, 2, 2); }
    drawMap(ctx, 5, 8, MOLE_UP.slice(0, 12).map((r) => r.slice(1, 15)), brown);
    rect(ctx, OUT, 30, 32, 4, 4);
  });

  // stickers: the game (a mole and a mallet), the golden mole, a star score
  one('icon-whack', 16, 16, (ctx) => {
    drawMap(ctx, 0, 4, MOLE_UP.slice(0, 10).map((r) => r.slice(0, 12)), brown);
    rect(ctx, '#8a5a34', 0, 14, 12, 2);
    rect(ctx, OUT, 11, 0, 5, 4);
    rect(ctx, '#e0403a', 12, 1, 3, 2);
    rect(ctx, '#c8904e', 13, 4, 1, 6);
  });
  one('whack-golden', 16, 16, (ctx) => {
    drawMap(ctx, 0, 0, MOLE_UP, gold);
    rect(ctx, '#ffffff', 5, 2, 1, 1);
  });
  one('whack-star', 16, 16, (ctx) => {
    drawMap(ctx, 0, 1, [
      '.......o........',
      '......oyo.......',
      '......oyo.......',
      '.....oyyyo......',
      'oooooyyyyyooooo.',
      '.oyyyyywyyyyyo..',
      '..oyyyyyyyyyo...',
      '...oyyyyyyyo....',
      '...oyyyyyyyo....',
      '..oyyyyoyyyyo...',
      '..oyyyo.oyyyo...',
      '.oyyo.....oyyo..',
      '.ooo.......ooo..',
    ], { o: '#8a6a10', y: '#ffd84a', w: '#ffffff' });
    rect(ctx, OUT, 11, 10, 5, 3);
    rect(ctx, '#e0403a', 12, 11, 3, 1);
    rect(ctx, '#c8904e', 13, 13, 1, 3);
  });
}
