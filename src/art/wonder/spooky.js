// Spooky Planet's art: the street's tiles, three houses (purple, teal and
// pumpkin-orange, each with a balcony and glowing windows), the doors, the
// pumpkins (plain, then carved two ways), the friendly ghost, the dancing
// skeleton, the cat in the witch's hat, the spooky tree, tombstones with
// smiles, the lamp post, the iron gate, the Haunted House, the Pumpkin King,
// the ghost sheet you wear, the candy and the big moon. Silly, not scary.

import { drawMap } from '../pixelmap.js';
import { OUT, ell, blob } from './common.js';

const HOUSE_LOOKS = [
  { wall: '#6a3a8a', dark: '#4a2a6a', roof: '#2a1d3a', trim: '#ff9a3a' },
  { wall: '#2a7a7a', dark: '#1a5a5a', roof: '#1a2a3a', trim: '#b0ff6a' },
  { wall: '#b8642a', dark: '#8a4a1a', roof: '#3a2a2a', trim: '#ffe066' },
];
export const HOUSE_LOOK_COUNT = HOUSE_LOOKS.length;
const GLOW = '#ffd860';

export function drawSpookyArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };
  const frames = (tex, n, w, h) => { for (let f = 0; f < n; f++) tex.add(f, 0, f * w, 0, w, h); };

  // tiles (16x16): 0 grass, 1 earth, 2 crate, 3 picket fence, 4 tombstone
  one('spooky-tiles', 80, 16, (ctx, r, tex) => {
    r('#2a1d3a', 0, 0, 16, 16);
    r('#3a6a3a', 0, 0, 16, 5);
    r('#4a8a4a', 0, 0, 16, 2);
    for (let x = 0; x < 16; x += 3) r('#4a8a4a', x, 5, 1, 2);
    r('#3a2a4a', 4, 9, 2, 2); r('#3a2a4a', 11, 12, 2, 2);
    r('#2a1d3a', 16, 0, 16, 16);
    r('#3a2a4a', 19, 3, 2, 2); r('#3a2a4a', 26, 9, 3, 2); r('#3a2a4a', 21, 13, 2, 2);
    // a crate
    r(OUT, 32, 0, 16, 16); r('#8a5a34', 33, 1, 14, 14); r('#a8703a', 33, 1, 14, 2);
    r('#6a4224', 33, 7, 14, 2); r('#6a4224', 39, 1, 2, 14);
    // a picket fence
    for (let x = 49; x < 64; x += 5) { r(OUT, x, 2, 4, 14); r('#d8d0e0', x + 1, 3, 2, 13); r(OUT, x + 1, 1, 2, 1); }
    r(OUT, 48, 7, 16, 3); r('#b8b0c8', 48, 8, 16, 1);
    // a tombstone with a smile
    r(OUT, 66, 2, 12, 14); r('#9a98b0', 67, 3, 10, 13); r(OUT, 67, 1, 10, 1);
    r('#b8b6c8', 67, 3, 2, 12);
    r(OUT, 69, 7, 2, 2); r(OUT, 73, 7, 2, 2); r(OUT, 70, 11, 4, 1); r(OUT, 69, 10, 1, 1); r(OUT, 74, 10, 1, 1);
    r('#4a8a4a', 64, 14, 16, 2);
    frames(tex, 5, 16, 16);
  });

  // houses (80x112): a balcony 64px up (where the ledge is), a pitched roof above
  HOUSE_LOOKS.forEach((L, i) => one(`spooky-house-${i}`, 80, 112, (ctx, r) => {
    // the roof
    for (let k = 0; k < 40; k++) {
      const w = Math.round(4 + k * 1.9);
      r(OUT, 40 - w / 2 - 1, 8 + k, w + 2, 1);
      r(L.roof, 40 - w / 2, 8 + k, w, 1);
    }
    r(OUT, 56, 6, 8, 20); r('#4a3a4a', 57, 7, 6, 19); // the chimney
    // the round attic window
    ell(ctx, 40, 32, 6, 6, OUT); ell(ctx, 40, 32, 5, 5, GLOW); r(OUT, 40, 27, 1, 11); r(OUT, 35, 32, 11, 1);
    // the walls
    r(OUT, 4, 46, 72, 66); r(L.wall, 5, 47, 70, 65);
    for (let y = 52; y < 112; y += 6) r(L.dark, 5, y, 70, 1);
    // the balcony with its railing (64px above the ground)
    r(OUT, 0, 46, 80, 4); r(L.trim, 1, 47, 78, 2);
    for (let x = 2; x < 80; x += 6) { r(OUT, x, 38, 2, 9); }
    r(OUT, 0, 37, 80, 2);
    // two glowing windows, with curtains
    for (const wx of [12, 54]) {
      r(OUT, wx, 60, 14, 16); r(GLOW, wx + 1, 61, 12, 14);
      r(OUT, wx + 6, 61, 2, 14); r(OUT, wx + 1, 67, 12, 2);
      r(L.trim, wx + 1, 61, 3, 14); r(L.trim, wx + 10, 61, 3, 14);
    }
    // the doorway (the door is its own sprite) and a porch light
    r(OUT, 31, 86, 18, 26); r('#1b1428', 32, 87, 16, 25);
    r(OUT, 51, 84, 5, 6); r(GLOW, 52, 85, 3, 4);
    // the step
    r(OUT, 28, 108, 24, 4); r('#9a98b0', 29, 109, 22, 2);
  }));

  // a door (16x24): shut, then open with warm light inside
  one('spooky-door', 32, 24, (ctx, r, tex) => {
    r(OUT, 0, 0, 16, 24); r('#7a4a2a', 1, 1, 14, 23); r('#8a5a34', 2, 2, 5, 9); r('#8a5a34', 9, 2, 5, 9);
    r('#8a5a34', 2, 13, 5, 9); r('#8a5a34', 9, 13, 5, 9); r('#ffd84a', 12, 12, 2, 2);
    r(OUT, 16, 0, 16, 24); r('#ffb04a', 17, 1, 14, 23); r('#ffe0a0', 19, 3, 10, 21);
    r('#7a4a2a', 17, 1, 3, 23); r(OUT, 20, 1, 1, 23);
    frames(tex, 2, 16, 16 + 8);
  });

  // pumpkins (16x16): plain, then carved (two faces), glowing
  one('spooky-pumpkin', 48, 16, (ctx, r, tex) => {
    for (let f = 0; f < 3; f++) {
      const ox = f * 16;
      r(OUT, ox + 7, 0, 3, 4); r('#5aa63c', ox + 8, 1, 1, 3); r('#5aa63c', ox + 9, 2, 3, 1);
      blob(ctx, ox + 8, 10, 6, 5, '#ff8a2a');
      for (const x of [5, 8, 11]) r('#d8661a', ox + x, 6, 1, 9);
      r('#ffb060', ox + 4, 7, 1, 3);
      if (f === 1) drawMap(ctx, ox + 4, 7, ['.y...y.', 'yyy.yyy', '.......', 'yyyyyyy', '.y.y.y.'], { y: '#ffe066' });
      if (f === 2) drawMap(ctx, ox + 4, 7, ['yy...yy', 'yy...yy', '...y...', 'y.....y', '.yyyyy.'], { y: '#ffe066' });
    }
    frames(tex, 3, 16, 16);
  });

  // the friendly ghost (16x16, 2 frames: wavy tail one way, then the other)
  one('spooky-ghost', 32, 16, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      drawMap(ctx, f * 16, 0, [
        '....oooooo......',
        '...owwwwwwo.....',
        '..owwwwwwwwo....',
        '.owwkwwwkwwwo...',
        '.owwkwwwkwwwo...',
        '.owwwwwwwwwwo...',
        '.owppwkkwppwo...',
        '.owwwwkkwwwwo...',
        'owwwwwwwwwwwwo..',
        'owwwwwwwwwwwwo..',
        '.owwwwwwwwwwwo..',
        '.owwwwwwwwwwo...',
        f ? '..owowwowwowo...' : '.owowwowwowo....',
        f ? '...o.oo.oo.o....' : '..o.oo.oo.o.....',
      ], { o: OUT, w: '#ffffff', k: OUT, p: '#ffb0c8' });
    }
    frames(tex, 2, 16, 16);
  });

  // the skeleton (16x24, 2 dance frames: arms up, then arms out)
  one('spooky-skeleton', 32, 24, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      blob(ctx, ox + 8, 4, 4, 4, '#f4f0e8');
      r(OUT, ox + 6, 3, 2, 2); r(OUT, ox + 9, 3, 2, 2); r(OUT, ox + 7, 7, 3, 1);
      r(OUT, ox + 7, 9, 2, 8); r('#f4f0e8', ox + 7, 9, 2, 8);
      for (const y of [10, 12, 14]) { r(OUT, ox + 5, y, 6, 1); }
      // arms
      if (f === 0) { r('#f4f0e8', ox + 3, 6, 1, 5); r('#f4f0e8', ox + 12, 6, 1, 5); r(OUT, ox + 4, 10, 3, 1); r(OUT, ox + 9, 10, 3, 1); }
      else { r('#f4f0e8', ox + 1, 11, 6, 1); r('#f4f0e8', ox + 9, 11, 6, 1); r(OUT, ox + 1, 12, 6, 1); r(OUT, ox + 9, 12, 6, 1); }
      // legs
      r('#f4f0e8', ox + 5, 17, 1, 6); r('#f4f0e8', ox + 10, 17, 1, 6);
      r(OUT, ox + 4, 23, 3, 1); r(OUT, ox + 9, 23, 3, 1);
      r(OUT, ox + 5, 16, 6, 1);
    }
    frames(tex, 2, 16, 24);
  });

  // the cat in a witch's hat (16x16, 2 frames: tail up, tail curled)
  one('spooky-cat', 32, 16, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      drawMap(ctx, f * 16, 0, [
        '.....oo.........',
        '....oppo........',
        '...oppppo.......',
        '..oppppppo......',
        '.oooooooooo.....',
        '..okkkkkko......',
        '..okgkkgko....o.',
        '..okkkkkko...oko',
        '...okkkko....oko',
        '..okkkkkkoooook.',
        '..okkkkkkkkkko..',
        '..okkkkkkkkko...',
        '..okk.okk.oko...',
        '...oo..oo..o....',
      ].map((row) => (f ? row.replace('....oko', '.....ok').replace('...oko', '....ok') : row)), { o: OUT, k: '#2a2a3a', p: '#9a5ad0', g: '#b0ff6a' });
    }
    frames(tex, 2, 16, 16);
  });

  // the ghost sheet you wear in ghost mode (16x16, over the character)
  one('spooky-sheet', 16, 16, (ctx) => drawMap(ctx, 1, 0, [
    '....oooooo....',
    '...owwwwwwo...',
    '..owwwwwwwwo..',
    '..owwkwwkwwo..',
    '.owwwkwwkwwwo.',
    '.owwwwwwwwwwo.',
    '.owwwwoowwwwo.',
    '.owwwwoowwwwo.',
    '.owwwwwwwwwwo.',
    'owwwwwwwwwwwwo',
    'owwwwwwwwwwwwo',
    '.owwwwwwwwwwo.',
    '.owowwowwowwo.',
    '..o.oo.oo.oo..',
  ], { o: OUT, w: 'rgba(255,255,255,0.92)', k: OUT }));

  // the spooky tree (80x96): a twisty trunk, branches either side a block apart
  one('spooky-tree', 80, 96, (ctx, r) => {
    r(OUT, 34, 10, 12, 86); r('#4a3a4a', 35, 10, 10, 86); r('#5a4a5a', 36, 10, 3, 86);
    r(OUT, 30, 90, 20, 6); r('#4a3a4a', 31, 91, 18, 5);
    // branches: their tops are the ledges (16px steps from the ground)
    const branch = (x0, x1, top) => { r(OUT, x0, top - 1, x1 - x0, 6); r('#5a4a5a', x0 + 1, top, x1 - x0 - 2, 4); };
    branch(4, 38, 96 - 16);
    branch(42, 78, 96 - 32);
    branch(4, 38, 96 - 48);
    branch(42, 78, 96 - 64);
    // twigs at the top
    r(OUT, 32, 2, 2, 12); r(OUT, 46, 4, 2, 10); r(OUT, 38, 0, 3, 12);
    // a hole with two eyes peeking
    ell(ctx, 40, 54, 3, 4, '#1b1428'); r('#ffe066', 38, 53, 1, 1); r('#ffe066', 41, 53, 1, 1);
  });

  // a lamp post (12x52)
  one('spooky-lamp', 12, 52, (ctx, r) => {
    r(OUT, 5, 10, 3, 42); r('#3a3a4a', 6, 10, 1, 42);
    r(OUT, 1, 2, 10, 10); r(GLOW, 2, 3, 8, 8); r(OUT, 5, 3, 2, 8); r(OUT, 2, 6, 8, 1);
    r(OUT, 3, 0, 6, 2);
    r(OUT, 2, 48, 9, 4);
  });

  // the iron gate (two halves, 16x160 each), spikes and a pumpkin on top
  one('spooky-gate', 32, 160, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      for (const x of [1, 6, 11]) { r(OUT, ox + x, 10, 3, 150); r('#5a5a6a', ox + x + 1, 10, 1, 150); drawMap(ctx, ox + x, 6, ['.o.', 'ooo', 'ooo', '.o.'], { o: OUT }); }
      for (const y of [30, 80, 130]) { r(OUT, ox, y, 16, 3); r('#5a5a6a', ox, y + 1, 16, 1); }
      r(f ? OUT : OUT, f ? ox : ox + 15, 10, 1, 150);
    }
    frames(tex, 2, 16, 160);
  });

  // the Haunted House (240x208): purple, with two towers, round windows and a big door
  one('spooky-haunted', 240, 208, (ctx, r) => {
    const wall = '#5a2a7a';
    const dark = '#3a1a5a';
    // towers
    for (const tx of [10, 182]) {
      for (let k = 0; k < 46; k++) {
        const w = Math.round(2 + k * 1.1);
        r(OUT, tx + 24 - w / 2 - 1, 4 + k, w + 2, 1);
        r('#2a1d3a', tx + 24 - w / 2, 4 + k, w, 1);
      }
      r(OUT, tx, 50, 48, 158); r(wall, tx + 1, 51, 46, 157);
      ell(ctx, tx + 24, 80, 9, 9, OUT); ell(ctx, tx + 24, 80, 8, 8, '#b0ff6a');
      r(OUT, tx + 24, 72, 1, 17); r(OUT, tx + 16, 80, 17, 1);
      r(OUT, tx + 14, 120, 20, 24); r('#ff9ad0', tx + 15, 121, 18, 22); r(OUT, tx + 23, 121, 2, 22);
    }
    // the middle roof and walls
    for (let k = 0; k < 50; k++) {
      const w = Math.round(30 + k * 2.6);
      r(OUT, 120 - w / 2 - 1, 34 + k, w + 2, 1);
      r('#2a1d3a', 120 - w / 2, 34 + k, w, 1);
    }
    r(OUT, 52, 84, 136, 124); r(wall, 53, 85, 134, 123);
    for (let y = 92; y < 208; y += 8) r(dark, 53, y, 134, 1);
    // the weathervane bat on top
    r(OUT, 119, 14, 2, 22);
    drawMap(ctx, 108, 8, ['o.........o', 'oo.o...o.oo', 'ooooooooooo', '.oo.ooo.oo.', '....ooo....'], { o: OUT });
    // round windows with friendly eyes
    for (const wx of [80, 160]) {
      ell(ctx, wx, 118, 12, 12, OUT); ell(ctx, wx, 118, 11, 11, '#ffe066');
      ell(ctx, wx - 4, 117, 2, 3, OUT); ell(ctx, wx + 4, 117, 2, 3, OUT);
      r('#ffffff', wx - 5, 115, 1, 1); r('#ffffff', wx + 3, 115, 1, 1);
    }
    // the big round door (its middle is at x=120)
    ell(ctx, 120, 168, 20, 20, OUT);
    r(OUT, 100, 168, 41, 40);
    ell(ctx, 120, 168, 18, 18, '#7a3a2a');
    r('#7a3a2a', 102, 168, 37, 40);
    r(OUT, 119, 150, 2, 58);
    r('#ffd84a', 112, 182, 3, 3); r('#ffd84a', 125, 182, 3, 3);
    // jack-o'-lanterns on the steps
    for (const px of [86, 148]) {
      blob(ctx, px, 201, 7, 6, '#ff8a2a');
      drawMap(ctx, px - 4, 198, ['y...y', '.....', 'yyyyy'], { y: '#ffe066' });
    }
    // cobwebs in the corners
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    for (const [cx, cy, sx] of [[53, 85, 1], [187, 85, -1]]) {
      for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.arc(cx, cy, k * 6, sx > 0 ? 0 : Math.PI / 2, sx > 0 ? Math.PI / 2 : Math.PI); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sx * 20, cy + 20); ctx.stroke();
    }
  });

  // the Pumpkin King (48x48): a giant smiling jack-o'-lantern in a gold crown
  one('spooky-king', 48, 48, (ctx, r) => {
    blob(ctx, 24, 31, 21, 15, '#ff8a2a');
    for (const x of [10, 17, 24, 31, 38]) r('#d8661a', x, 15, 2, 30);
    r('#ffb060', 7, 22, 2, 12);
    drawMap(ctx, 9, 20, [
      '..yy.......yy..',
      '.yyyy.....yyyy.',
      'yyyyyy...yyyyyy',
      '.......y.......',
      '......yyy......',
      'y.............y',
      'yy.y.y.y.y.y.yy',
      '.yyyyyyyyyyyyy.',
      '..y.y.y.y.y.y..',
    ], { y: '#ffe066' });
    // the crown, sitting on top
    drawMap(ctx, 15, 11, [
      'o....o....o....o..',
      'yo..oyo..oyo..oy..',
      'yyooyyyooyyyooyy..',
      'yyyyyyrryyyyyyyy..',
      'yyggyyrryyyyggyy..',
      'oooooooooooooooo..',
    ], { o: OUT, y: '#ffd84a', r: '#e0403a', g: '#3ad07a' });
  });

  // candy (10x10, 4 colours)
  one('spooky-candy', 40, 10, (ctx, r, tex) => {
    ['#ff8a2a', '#ff5a9a', '#6ad07a', '#9a7aff'].forEach((c, f) => {
      drawMap(ctx, f * 10, 2, ['o........o', 'oo.oooo.oo', 'oooccccooo', 'ooccwwccoo', 'oooccccooo', 'oo.oooo.oo', 'o........o'], { o: OUT, c, w: '#ffffff' });
    });
    frames(tex, 4, 10, 10);
  });

  // the big moon (64x64), with craters and a sleepy smile
  one('spooky-moon', 64, 64, (ctx, r) => {
    ell(ctx, 32, 32, 30, 30, '#fff4c0');
    ell(ctx, 36, 34, 26, 26, '#fff8d8');
    for (const [x, y, s] of [[20, 20, 4], [42, 44, 5], [44, 18, 3], [18, 42, 3]]) ell(ctx, x, y, s, s, '#efe0a0');
    r('#c8b880', 22, 30, 6, 1); r('#c8b880', 38, 30, 6, 1); r('#c8b880', 28, 40, 10, 1); r('#c8b880', 27, 39, 1, 1); r('#c8b880', 38, 39, 1, 1);
  });
}
