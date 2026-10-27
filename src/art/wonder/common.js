// Art shared by the whole Wonder Galaxy: the eight planets on the star map
// (32x32), their prizes (16x16, all golden but the jelly crown), the fun
// sticker icons (16x16), the goal icons on the HUD (10x10), the book's tab
// icon, the swirl portal on the star map, and the Wonder Rocket (96x80).

import { drawMap } from '../pixelmap.js';

export const OUT = '#2a1d2e';
const GOLD = '#ffd84a';
const GOLD_D = '#c8902a';
const GOLD_L = '#fff2a0';

export function ell(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}
// an outlined ellipse: the outline one pixel bigger all round
export const blob = (ctx, cx, cy, rx, ry, color) => {
  ell(ctx, cx, cy, rx + 1, ry + 1, OUT);
  ell(ctx, cx, cy, rx, ry, color);
};

// A round planet (radius 11 at the middle of 32x32), painted by `paint`
// inside its circle, with an outline and a shine.
function planet(ctx, paint, { shine = true } = {}) {
  ctx.save();
  ctx.beginPath(); ctx.arc(16, 16, 11, 0, Math.PI * 2); ctx.clip();
  paint(ctx);
  if (shine) {
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.arc(12, 11, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(16, 16, 11.5, 0, Math.PI * 2); ctx.stroke();
}
const fill = (ctx, color, x, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

const PLANETS = {
  // a purple planet with a jack-o'-lantern's glowing face, and a bat
  spooky: (ctx) => {
    planet(ctx, (c) => {
      fill(c, '#5a2a8a', 0, 0, 32, 32);
      fill(c, '#7a3aa8', 0, 22, 32, 10);
      // the face: triangle eyes and a toothy grin, glowing orange
      c.fillStyle = '#ffb030';
      c.beginPath(); c.moveTo(9, 15); c.lineTo(12, 10); c.lineTo(15, 15); c.fill();
      c.beginPath(); c.moveTo(17, 15); c.lineTo(20, 10); c.lineTo(23, 15); c.fill();
      fill(c, '#ffb030', 9, 19, 14, 3);
      fill(c, '#ffb030', 11, 22, 10, 1);
      fill(c, '#5a2a8a', 12, 19, 2, 1);
      fill(c, '#5a2a8a', 17, 19, 2, 1);
      fill(c, '#5a2a8a', 14, 21, 2, 2);
    }, { shine: false });
    drawMap(ctx, 21, 1, ['o.....o', 'oo.o.oo', 'ooooooo', '.o...o.'], { o: OUT });
    fill(ctx, '#ffe066', 24, 3, 1, 1);
  },
  // a steel planet with a robot face, rivets and an antenna
  robot: (ctx) => {
    fill(ctx, OUT, 15, 1, 2, 5);
    ell(ctx, 16, 2, 2, 2, '#ff4a4a');
    planet(ctx, (c) => {
      fill(c, '#8a9ab0', 0, 0, 32, 32);
      fill(c, '#6a7a90', 0, 23, 32, 9);
      fill(c, '#a8b8c8', 0, 6, 32, 2);
      // eyes and a grille mouth
      fill(c, OUT, 9, 11, 6, 6); fill(c, '#4de3f0', 10, 12, 4, 4);
      fill(c, OUT, 18, 11, 6, 6); fill(c, '#4de3f0', 19, 12, 4, 4);
      fill(c, OUT, 11, 20, 11, 3);
      for (let x = 12; x < 22; x += 2) fill(c, '#ffe066', x, 21, 1, 1);
      for (const [x, y] of [[6, 9], [26, 9], [6, 21], [26, 21]]) fill(c, '#c8d0dc', x, y, 1, 1);
    });
  },
  // a blue ocean planet with waves and a little fish
  ocean: (ctx) => {
    planet(ctx, (c) => {
      fill(c, '#2a7ad8', 0, 0, 32, 32);
      fill(c, '#1a5ab0', 0, 18, 32, 14);
      fill(c, '#123a80', 0, 25, 32, 7);
      for (const y of [8, 15, 22]) for (let x = 2; x < 30; x += 6) { fill(c, '#bfe8ff', x, y, 3, 1); fill(c, '#bfe8ff', x + 1, y - 1, 1, 1); }
      // a fish
      fill(c, '#ffa64a', 15, 18, 6, 3); fill(c, '#ffa64a', 13, 17, 2, 5); fill(c, OUT, 19, 18, 1, 1);
    });
  },
  // the Upside-Down Planet: grass on top, sky underneath, a tree hanging down
  upside: (ctx) => {
    planet(ctx, (c) => {
      fill(c, '#8ec5ff', 0, 0, 32, 32);
      fill(c, '#5aa63c', 0, 0, 32, 13);
      fill(c, '#7cc95a', 0, 12, 32, 2);
      // a tree growing down from the grass
      fill(c, '#8a5a34', 11, 13, 2, 5);
      ell(c, 12, 21, 4, 3, '#3a8a3a');
      // a cloud low down, the wrong way round
      ell(c, 21, 23, 4, 2, '#ffffff');
      ell(c, 18, 22, 2, 2, '#ffffff');
    });
    // a curly flip arrow beside it
    drawMap(ctx, 25, 2, ['.ooo.', 'o...o', '...oo', '..ooo'], { o: '#ffe066' });
  },
  // a wobbly red jelly planet, shiny, with drips
  jelly: (ctx) => {
    planet(ctx, (c) => {
      fill(c, '#e83a5a', 0, 0, 32, 32);
      fill(c, '#c82a4a', 0, 20, 32, 12);
      for (const [x, w] of [[7, 3], [14, 4], [22, 3]]) { fill(c, '#ff6a8a', x, 6, w, 7); fill(c, '#ff8aa8', x, 6, 1, 7); }
      fill(c, '#ffffff', 9, 8, 2, 2);
    }, { shine: true });
    for (const [x, h] of [[10, 3], [17, 4], [22, 2]]) { fill(ctx, OUT, x - 1, 26, 4, h + 1); fill(ctx, '#e83a5a', x, 26, 2, h); }
  },
  // a green racing planet with a checkered ring round it
  race: (ctx) => {
    planet(ctx, (c) => {
      fill(c, '#5aa63c', 0, 0, 32, 32);
      fill(c, '#7a7a8a', 0, 14, 32, 5);
      for (let x = 0; x < 32; x += 4) fill(c, '#ffffff', x, 16, 2, 1);
    });
    for (let i = 0; i < 16; i++) {
      const a = Math.PI * 0.08 + (i / 15) * Math.PI * 0.84;
      const x = Math.round(16 - Math.cos(a) * 15);
      const y = Math.round(19 + Math.sin(a) * 4);
      fill(ctx, i % 2 ? '#ffffff' : OUT, x, y, 2, 2);
    }
  },
  // a teal sky planet with floating islands, and little dragon wings
  dragon: (ctx) => {
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? 0 : 26;
      drawMap(ctx, x0, 9, s < 0 ? ['oo....', 'ogoo..', 'oggg o', '.oggg.', '..ooo.'] : ['....oo', '..oogo', 'o gggo', '.gggo.', '.ooo..'], { o: OUT, g: '#3ac06a' });
    }
    planet(ctx, (c) => {
      fill(c, '#6ad0e8', 0, 0, 32, 32);
      fill(c, '#ffffff', 0, 25, 32, 7);
      ell(c, 11, 12, 5, 2, '#5aa63c'); fill(c, '#8a5a34', 8, 13, 6, 2);
      ell(c, 21, 19, 4, 2, '#5aa63c'); fill(c, '#8a5a34', 18, 20, 6, 2);
      fill(c, '#bfe8ff', 23, 21, 1, 4);
    });
  },
  // a leafy planet with a giant daisy
  tiny: (ctx) => {
    planet(ctx, (c) => {
      fill(c, '#4aa63c', 0, 0, 32, 32);
      for (let x = 3; x < 32; x += 4) fill(c, '#3a8a2a', x, 4 + (x % 3) * 3, 1, 20);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        ell(c, 16 + Math.round(Math.cos(a) * 5), 16 + Math.round(Math.sin(a) * 5), 2, 2, '#ffffff');
      }
      ell(c, 16, 16, 3, 3, '#ffd84a');
    });
  },
};

// the prizes (16x16)
const PRIZES = {
  pumpkin: (ctx, r) => {
    r(OUT, 7, 0, 3, 4); r('#5aa63c', 8, 1, 1, 3);
    blob(ctx, 8, 9, 7, 6, GOLD);
    for (const x of [5, 8, 11]) r(GOLD_D, x, 4, 1, 11);
    drawMap(ctx, 4, 6, ['.l...l.', 'lll.lll', '.......', 'l.lll.l', '.lllll.'], { l: '#fff6c0' });
    r('#ffffff', 3, 6, 1, 2);
  },
  megabot: (ctx, r) => {
    r(OUT, 7, 0, 2, 3); r('#ff4a4a', 7, 0, 2, 1);
    r(OUT, 3, 2, 10, 7); r(GOLD, 4, 3, 8, 5);
    r('#8ac0ff', 5, 4, 6, 3); r('#ffffff', 5, 4, 1, 1);
    r(OUT, 2, 8, 12, 6); r(GOLD, 3, 9, 10, 4); r(GOLD_D, 3, 12, 10, 1);
    r(OUT, 0, 9, 3, 4); r(GOLD_L, 1, 10, 1, 2);
    r(OUT, 13, 9, 3, 4); r(GOLD_L, 14, 10, 1, 2);
    r(OUT, 3, 13, 4, 3); r(OUT, 9, 13, 4, 3); r(GOLD_D, 4, 14, 2, 1); r(GOLD_D, 10, 14, 2, 1);
  },
  submarine: (ctx, r) => {
    r(OUT, 7, 2, 4, 4); r(GOLD, 8, 3, 2, 3); r(OUT, 9, 0, 3, 1); r(OUT, 9, 0, 1, 3);
    blob(ctx, 8, 9, 7, 4, GOLD);
    r(GOLD_D, 2, 11, 12, 1);
    for (const x of [4, 8, 12]) { ell(ctx, x, 9, 1, 1, OUT); r('#8ac0ff', x, 9, 1, 1); }
    r(OUT, 0, 7, 1, 5); r(GOLD_L, 3, 6, 4, 1);
  },
  topsy: (ctx, r) => {
    // a trophy with swirly arrows going round it
    r(OUT, 3, 1, 10, 7); r(GOLD, 4, 2, 8, 5); r(GOLD_L, 5, 2, 1, 4);
    r(OUT, 1, 2, 2, 3); r(OUT, 13, 2, 2, 3);
    r(OUT, 7, 8, 2, 3); r(GOLD_D, 7, 8, 2, 2);
    r(OUT, 4, 11, 8, 3); r(GOLD, 5, 12, 6, 1);
    drawMap(ctx, 0, 9, ['o..', 'oo.', 'ooo'], { o: '#4ab0ff' });
    drawMap(ctx, 13, 13, ['ooo', '.oo', '..o'], { o: '#ff5a9a' });
  },
  jellycrown: (ctx, r) => {
    drawMap(ctx, 0, 3, [
      '.o....oo....o..',
      'opo..oppo..opo.',
      'opo..oppo..opo.',
      'oppoopppppoppo.',
      'opppppppppppppo',
      'oplppppppppppo.',
      'opppyypppbbppo.',
      'oppppppppppppo.',
      'oddddddddddddo.',
      'oooooooooooooo.',
    ], { o: OUT, p: '#ff5a8a', l: '#ffb0c8', d: '#c82a5a', y: '#ffe066', b: '#4ab0ff' });
  },
  cup: (ctx, r) => {
    r(OUT, 2, 0, 12, 9); r(GOLD, 3, 1, 10, 7); r(GOLD_L, 4, 1, 2, 6); r(GOLD_D, 11, 1, 2, 7);
    r(OUT, 0, 1, 3, 1); r(OUT, 0, 1, 1, 4); r(OUT, 0, 4, 3, 1);
    r(OUT, 13, 1, 3, 1); r(OUT, 15, 1, 1, 4); r(OUT, 13, 4, 3, 1);
    r(OUT, 6, 9, 4, 3); r(GOLD_D, 7, 9, 2, 3);
    r(OUT, 3, 12, 10, 4); r(GOLD, 4, 13, 8, 2);
    r('#ffffff', 7, 3, 2, 2);
  },
  dragonegg: (ctx, r) => {
    blob(ctx, 8, 9, 5, 6, GOLD);
    for (const [x, y] of [[5, 6], [10, 9], [6, 12], [9, 4]]) { r(GOLD_D, x, y, 2, 2); }
    r(GOLD_L, 6, 4, 1, 3);
    r('#ffffff', 5, 5, 1, 1);
  },
  acorn: (ctx, r) => {
    r(OUT, 7, 0, 2, 3); r('#8a5a34', 7, 1, 1, 2);
    blob(ctx, 8, 5, 6, 3, GOLD_D);
    for (let x = 3; x < 14; x += 2) r('#a8701a', x, 4, 1, 2);
    blob(ctx, 8, 10, 5, 5, GOLD);
    r(OUT, 3, 7, 11, 1);
    r(GOLD_L, 5, 9, 1, 3);
  },
};

// the fun stickers (16x16)
const FUN = {
  ghost: (ctx) => drawMap(ctx, 1, 1, [
    '....oooooo....',
    '...owwwwwwo...',
    '..owwwwwwwwo..',
    '.owwowwwowwwo.',
    '.owwowwwowwwo.',
    '.owwwwwwwwwwo.',
    '.owwwwoowwwwo.',
    '.owwwwoowwwwo.',
    '.owwwwwwwwwwo.',
    '.owwwwwwwwwwo.',
    '.owwwwwwwwwwo.',
    '.owowwowwowwo.',
    '.oo.oo.oo.oo..',
  ], { o: OUT, w: '#ffffff' }),
  stomp: (ctx, r) => {
    // a big robot foot, and crate bits flying
    r(OUT, 4, 2, 8, 9); r('#9aa4b0', 5, 3, 6, 7);
    r(OUT, 2, 10, 12, 4); r('#c8d0dc', 3, 11, 10, 2);
    for (const [x, y] of [[0, 8], [14, 7], [1, 14], [14, 14]]) r('#c8904e', x, y, 2, 2);
    r('#ffe066', 0, 4, 2, 1); r('#ffe066', 14, 3, 2, 1);
  },
  turtle: (ctx, r) => {
    blob(ctx, 7, 9, 5, 4, '#3a9a5a');
    for (const [x, y] of [[5, 7], [8, 7], [6, 10], [9, 10]]) r('#6ad08a', x, y, 2, 2);
    blob(ctx, 13, 9, 2, 2, '#8ad0a0');
    r(OUT, 14, 8, 1, 1);
    for (const x of [3, 9]) { r(OUT, x, 12, 3, 3); r('#8ad0a0', x + 1, 13, 1, 1); }
  },
  flips: (ctx) => drawMap(ctx, 0, 0, [
    '.....oooooo.....',
    '...oo......o....',
    '..o.........o...',
    '.o.........ooo..',
    '.o........ooooo.',
    'o...............',
    'o.......cc......',
    'o......cccc.....',
    '.......cccc.....',
    '........cc.....o',
    '...............o',
    '.ooooo........o.',
    '..ooo.........o.',
    '...o.........o..',
    '....o......oo...',
    '.....oooooo.....',
  ], { o: '#4ab0ff', c: '#ffe066' }),
  superbounce: (ctx, r) => {
    blob(ctx, 8, 12, 6, 3, '#e83a5a');
    r('#ff8aa8', 4, 11, 3, 1);
    drawMap(ctx, 3, 0, ['..o.......', '.ooo...o..', 'ooooo.ooo.', '..o..ooooo', '..o....o..', '.......o..'], { o: '#ffe066' });
  },
  loop: (ctx, r) => {
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(8, 7, 5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#8a8aa0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(8, 7, 5, 0, Math.PI * 2); ctx.stroke();
    r(OUT, 0, 12, 16, 3); r('#8a8aa0', 0, 13, 16, 1);
    r('#ff4a4a', 3, 1, 4, 3); r(OUT, 3, 4, 1, 1); r(OUT, 6, 4, 1, 1);
  },
  ring: (ctx, r) => {
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(8, 8, 4, 7, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(8, 8, 4, 7, 0, 0, Math.PI * 2); ctx.stroke();
    drawMap(ctx, 11, 0, ['.w.', 'www', '.w.'], { w: '#ffffff' });
    drawMap(ctx, 0, 11, ['.w.', 'www', '.w.'], { w: '#ffffff' });
  },
  cat: (ctx) => drawMap(ctx, 0, 1, [
    '.o..........o...',
    'oko........oko..',
    'okko......okko..',
    'okkkoooooookkko.',
    'okkkkkkkkkkkkko.',
    'okkkkkkkkkkkkko.',
    'okk.ookkkkoo.ko.',
    'okkkkkkppkkkkko.',
    'wokkkkoookkkkow.',
    '.okkkkkkkkkkko..',
    '..ookkkkkkkoo...',
    '....ooooooo.....',
  ], { o: OUT, k: '#ff9a3a', p: '#ff8aa8', w: '#ffffff' }),
};

// the goal icons on the HUD (10x10)
const GOALS = {
  'wonder-candy': (ctx, r) => {
    drawMap(ctx, 0, 2, ['o........o', 'oo.oooo.oo', 'oooyyyyooo', 'ooyyrryyoo', 'oooyyyyooo', 'oo.oooo.oo', 'o........o'], { o: OUT, y: '#ff8a2a', r: '#ffe066' });
    r('#ff5a9a', 0, 3, 1, 1); r('#ff5a9a', 9, 3, 1, 1);
  },
  'wonder-bot': (ctx, r) => {
    r(OUT, 4, 0, 2, 2); r(OUT, 1, 2, 8, 7); r('#9aa4b0', 2, 3, 6, 5);
    r('#4de3f0', 3, 4, 1, 2); r('#4de3f0', 6, 4, 1, 2); r(OUT, 3, 7, 4, 1);
    r(OUT, 0, 4, 1, 3); r(OUT, 9, 4, 1, 3);
  },
  'wonder-pearl': (ctx, r) => { blob(ctx, 5, 5, 3, 3, '#f4f0ff'); ell(ctx, 6, 6, 2, 2, '#d8d0f0'); ell(ctx, 5, 5, 2, 2, '#f4f0ff'); r('#ffffff', 3, 3, 2, 1); },
  'wonder-star': (ctx) => drawMap(ctx, 0, 0, ['....oo....', '...oyyo...', 'oooyyyyooo', 'oyyyyyyyyo', '.oyyyyyyo.', '..oyyyyo..', '.oyyooyyo.', '.oyo..oyo.', '.oo....oo.'], { o: OUT, y: '#ffe066' }),
  'wonder-bean': (ctx, r) => { blob(ctx, 5, 5, 4, 3, '#ff5a8a'); r('#ffb0c8', 3, 3, 2, 1); r(OUT, 4, 7, 2, 1); },
  'wonder-coin': (ctx, r) => { blob(ctx, 5, 5, 4, 4, GOLD); ell(ctx, 5, 5, 2, 3, GOLD_D); r(GOLD_L, 5, 3, 1, 5); },
  'wonder-balloon': (ctx, r) => { blob(ctx, 5, 4, 3, 4, '#ff4a6a'); r('#ffb0c8', 3, 2, 1, 2); r(OUT, 4, 8, 3, 1); r(OUT, 5, 9, 1, 1); },
  'wonder-seed': (ctx, r) => {
    drawMap(ctx, 1, 0, ['...oo...', '..okko..', '.okwkko.', '.okwkko.', 'okkwkkko', 'okkwkkko', '.okkkko.', '.okkkko.', '..okko..', '...oo...'], { o: OUT, k: '#3a3a3a', w: '#e8e8e0' });
  },
};

export function drawWonderCommon(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };
  for (const [id, draw] of Object.entries(PLANETS)) one(`planet-${id}`, 32, 32, draw);
  for (const [id, draw] of Object.entries(PRIZES)) one(`wprize-${id}`, 16, 16, draw);
  for (const [id, draw] of Object.entries(FUN)) one(`wfun-${id}`, 16, 16, draw);
  for (const [key, draw] of Object.entries(GOALS)) one(key, 10, 10, draw);

  // the book's tab: a little pink-and-teal swirl galaxy
  one('icon-wonder', 16, 16, (ctx) => swirl(ctx, 8, 8, 7));
  // the portal on the star map's first page (32x32)
  one('wonder-portal', 32, 32, (ctx) => swirl(ctx, 16, 16, 15));

  // the Wonder Rocket (96x80): purple, with teal stripes, stars and a round window
  one('wonder-ship', 96, 80, (ctx, r) => {
    const dx = 8;
    for (const bx of [dx + 22, dx + 50]) {
      r(OUT, bx - 1, 36, 12, 40);
      r('#9a5ad0', bx, 37, 10, 38);
      r('#3ad0c8', bx, 46, 10, 3);
      r('#3ad0c8', bx, 58, 10, 3);
      r(OUT, bx, 74, 10, 5); r('#55505e', bx + 1, 74, 8, 4);
    }
    r(OUT, dx + 29, 10, 22, 66);
    r('#b07ae0', dx + 30, 11, 20, 64);
    r('#9a5ad0', dx + 44, 11, 6, 64);
    r('#3ad0c8', dx + 30, 40, 20, 4);
    r('#ff8ac8', dx + 30, 46, 20, 2);
    r('#3ad0c8', dx + 30, 60, 20, 4);
    for (let k = 0; k < 14; k++) {
      const w = Math.max(2, Math.round(22 * Math.sqrt(1 - k / 14)));
      r(OUT, dx + 40 - Math.floor(w / 2) - 1, 10 - k, w + 2, 1);
      r(k < 5 ? '#ff8ac8' : '#3ad0c8', dx + 40 - Math.floor(w / 2), 10 - k, w, 1);
    }
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(dx + 40, 24, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9ff6ff';
    ctx.beginPath(); ctx.arc(dx + 40, 24, 5, 0, Math.PI * 2); ctx.fill();
    r('#ffffff', dx + 37, 21, 2, 2);
    for (const [x, y] of [[dx + 33, 52], [dx + 44, 68], [dx + 34, 68], [dx + 46, 33]]) drawMap(ctx, x - 1, y - 1, ['.y.', 'yyy', '.y.'], { y: '#ffe066' });
    for (const fx of [dx + 25, dx + 50]) { r(OUT, fx, 60, 5, 16); r('#3ad0c8', fx + 1, 61, 3, 14); }
    r(OUT, dx + 33, 75, 14, 5); r('#55505e', dx + 34, 75, 12, 4);
  });

  // the HUD's hold-B ring sits on a little rocket badge (16x16)
  one('wonder-badge', 16, 16, (ctx, r) => {
    r(OUT, 6, 1, 4, 12); r('#b07ae0', 7, 2, 2, 10); r('#9ff6ff', 7, 5, 2, 2);
    r(OUT, 4, 9, 2, 5); r(OUT, 10, 9, 2, 5); r('#3ad0c8', 5, 10, 1, 3); r('#3ad0c8', 10, 10, 1, 3);
    r('#ffb34a', 7, 13, 2, 2);
  });
}

// a spiral galaxy: pink and teal arms round a bright middle
function swirl(ctx, cx, cy, rad) {
  ctx.fillStyle = 'rgba(58,26,90,0.9)';
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
  for (let arm = 0; arm < 2; arm++) {
    for (let t = 0; t < 1; t += 0.02) {
      const a = arm * Math.PI + t * Math.PI * 2.2;
      const d = t * rad * 0.95;
      ctx.fillStyle = t < 0.5 ? '#ff8ac8' : '#3ad0c8';
      const s = rad > 10 ? 2 : 1;
      ctx.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), s, s);
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, rad / 5), 0, Math.PI * 2); ctx.fill();
}
