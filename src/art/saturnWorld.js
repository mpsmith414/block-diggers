// Art for Saturn's five layers: its ice and rocks (tiles), back walls, ore
// icons, creatures (penguins, scoop slimes, snow owls, little comets,
// snowflake sprites), decorations, snowballs and snowmen, snow globes, the
// frozen comet, the Saturn Heart, the Gloves, the Yeti Cub, the Saturn badges
// and a few icons.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';
const T = 16;
const fit = (rows, w = 16) => rows.map((r) => (r + '.'.repeat(w)).slice(0, w));

export const SATURN_HOSTS = {
  ice: { base: '#b8e4f8', dark: '#8ac8e8', light: '#e8f8ff' },
  softserve: { base: '#f8e0c8', dark: '#e8c0a8', light: '#fff4e8' },
  aurora: { base: '#1e3a6a', dark: '#162e56', light: '#2e4e88' },
  comet: { base: '#1a2240', dark: '#121830', light: '#2a3458' },
  core: { base: '#f0d890', dark: '#d8b868', light: '#fff4c8' },
};

// ---------- tiles ----------

export function drawSaturnTiles(ctx, at, rng, B, rect, speckle) {
  // ring ice: pale blue with a crack and a bright shine
  const ice = (id) => {
    speckle(ctx, at(id), rng, SATURN_HOSTS.ice, 3);
    const ox = at(id);
    rect(ctx, '#ffffff', ox + 2, 2, 4, 1);
    rect(ctx, '#ffffff', ox + 2, 3, 1, 2);
    rect(ctx, '#8ac8e8', ox + 9, 9, 1, 3);
    rect(ctx, '#8ac8e8', ox + 10, 12, 3, 1);
  };
  ice(B.ICE);
  // frost gems: cyan crystal points in the ice
  ice(B.FROST);
  for (const [x, y] of [[3, 6], [10, 2], [8, 10]]) {
    const ox = at(B.FROST) + x;
    rect(ctx, '#2a6a98', ox, y, 3, 5);
    rect(ctx, '#5ae0ff', ox + 1, y, 1, 5);
    rect(ctx, '#5ae0ff', ox, y + 1, 3, 3);
    rect(ctx, '#ffffff', ox + 1, y + 1, 1, 1);
  }

  // soft-serve rock: vanilla swirls with a pink ripple
  const softserve = (id) => {
    const ox = at(id);
    rect(ctx, SATURN_HOSTS.softserve.base, ox, 0, T, T);
    for (const y of [3, 9, 14]) {
      rect(ctx, SATURN_HOSTS.softserve.dark, ox, y, T, 1);
      rect(ctx, SATURN_HOSTS.softserve.light, ox, y - 1, T, 1);
    }
    rect(ctx, '#ffb0d0', ox + 3, 6, 5, 1);
    rect(ctx, '#ffb0d0', ox + 9, 12, 4, 1);
  };
  softserve(B.SOFTSERVE);
  // ice cream: two scoops (strawberry and mint) poking out
  softserve(B.ICECREAM);
  for (const [x, y, c, h] of [[1, 1, '#ff8ab8', '#ffd0e4'], [8, 8, '#8ae8b8', '#d0ffe8']]) {
    const ox = at(B.ICECREAM) + x;
    rect(ctx, OUT, ox + 1, y, 5, 6);
    rect(ctx, OUT, ox, y + 1, 7, 4);
    rect(ctx, c, ox + 1, y + 1, 5, 4);
    rect(ctx, h, ox + 2, y + 1, 2, 1);
    rect(ctx, '#6a3a1a', ox + 3, y + 3, 1, 1);
    rect(ctx, '#ffe066', ox + 5, y + 2, 1, 1);
  }

  // aurora rock: deep blue with green and violet shimmer streaks
  const aurora = (id) => {
    speckle(ctx, at(id), rng, SATURN_HOSTS.aurora, 5);
    const ox = at(id);
    for (let k = 0; k < 6; k++) rect(ctx, '#3ae0a0', ox + 2 + k * 2, 4 + (k % 2), 2, 1);
    for (let k = 0; k < 5; k++) rect(ctx, '#a06aff', ox + 3 + k * 2, 11 - (k % 2), 2, 1);
  };
  aurora(B.AURORA_ROCK);
  // ring pearls: three shiny pink-white pearls
  aurora(B.PEARL);
  for (const [x, y] of [[2, 1], [9, 6], [4, 10]]) {
    const ox = at(B.PEARL) + x;
    rect(ctx, '#6a4a6a', ox + 1, y, 3, 5);
    rect(ctx, '#6a4a6a', ox, y + 1, 5, 3);
    rect(ctx, '#ffe8f4', ox + 1, y + 1, 3, 3);
    rect(ctx, '#ffffff', ox + 1, y + 1, 1, 1);
    rect(ctx, '#e8b8d8', ox + 3, y + 3, 1, 1);
  }

  // comet rock: dark navy with icy streaks
  const comet = (id) => {
    speckle(ctx, at(id), rng, SATURN_HOSTS.comet, 5);
    const ox = at(id);
    for (let k = 0; k < 5; k++) rect(ctx, '#4a6aa8', ox + 1 + k, 12 - k, 1, 1);
    rect(ctx, '#8ab0e8', ox + 10, 3, 2, 1);
  };
  comet(B.COMET_ROCK);
  // comet chunks: blue lumps with little white tails
  comet(B.COMET);
  for (const [x, y] of [[6, 1], [9, 8]]) {
    const ox = at(B.COMET) + x;
    rect(ctx, 'rgba(255,255,255,0.5)', ox - 5, y + 2, 5, 1);
    rect(ctx, 'rgba(255,255,255,0.3)', ox - 4, y + 3, 4, 1);
    rect(ctx, OUT, ox, y, 5, 5);
    rect(ctx, '#4a8aff', ox + 1, y + 1, 3, 3);
    rect(ctx, '#c8e0ff', ox + 1, y + 1, 1, 1);
  }

  // Saturn's core: warm gold rock with icy sparkles
  const core = (id) => {
    speckle(ctx, at(id), rng, SATURN_HOSTS.core, 6);
    const ox = at(id);
    rect(ctx, '#ffffff', ox + 4, 3, 1, 3);
    rect(ctx, '#ffffff', ox + 3, 4, 3, 1);
    rect(ctx, '#9fe0ff', ox + 11, 10, 2, 2);
  };
  core(B.SATURN_CORE);
  core(B.SATURN_HEART);
  rect(ctx, '#e0a020', at(B.SATURN_HEART) + 2, 8, 6, 1);
  rect(ctx, '#9fe0ff', at(B.SATURN_HEART) + 10, 2, 1, 6);

  // snow: soft white ground with a sparkle
  speckle(ctx, at(B.SNOW), rng, { base: '#f4faff', dark: '#d8e8f4', light: '#ffffff' }, 5);
  rect(ctx, '#ffffff', at(B.SNOW), 0, T, 2);
  rect(ctx, '#bfe0f4', at(B.SNOW) + 9, 7, 1, 1);

  // a snowball: a big round ball of snow (you push it)
  drawMap(ctx, at(B.SNOWBALL), 1, [
    '.....oooooo.....',
    '...oowwwwwwoo...',
    '..owwWWwwwwwwo..',
    '.owwWWwwwwwwwwo.',
    '.owWWwwwwwwwwso.',
    'owwWwwwwwwwwwsso',
    'owwwwwwwwwwwwsso',
    'owwwwwwwwwwwssso',
    'owwwwwwwwwwwssso',
    'owwwwwwwwwwsssso',
    '.owwwwwwwwssssso.',
    '.owwwwwwssssssso',
    '..osssssssssso..',
    '...oosssssssoo..',
    '.....oooooo.....',
  ].map((r) => r.slice(0, 16)), { o: '#6a8aa8', w: '#ffffff', W: '#ffffff', s: '#c8e0f0' });
}

// Back walls for Saturn's layers.
export function drawSaturnBacks(ctx, rect, back, BACK) {
  back(BACK.rings, { base: '#2a4a6a', dark: '#223e5a', light: '#325678' });
  rect(ctx, '#3a6a8a', BACK.rings * T + 4, 5, 3, 1);
  back(BACK.icecream, { base: '#5a3a4a', dark: '#4a2e3e', light: '#664656' });
  rect(ctx, '#7a4a5e', BACK.icecream * T + 3, 10, 4, 1);
  back(BACK.aurora, { base: '#0e1a34', dark: '#0a1428', light: '#142240' });
  rect(ctx, '#1a4a4a', BACK.aurora * T + 2, 4, 5, 1);
  rect(ctx, '#3a2a5a', BACK.aurora * T + 8, 11, 5, 1);
  back(BACK.comets, { base: '#0c1020', dark: '#080c18', light: '#12182c' });
  rect(ctx, '#4a5a8a', BACK.comets * T + 11, 4, 1, 1);
  rect(ctx, '#4a5a8a', BACK.comets * T + 5, 12, 1, 1);
  back(BACK.saturncore, { base: '#4a3e22', dark: '#3e341c', light: '#56482a' });
  rect(ctx, '#7a6a3a', BACK.saturncore * T + 6, 6, 2, 1);
}

// ---------- ore icons (10x10) ----------

export function drawSaturnOreIcon(ctx, rect, ore) {
  if (ore === 'frost') {
    // a pale cyan crystal with points
    drawMap(ctx, 0, 0, [
      '....o.....',
      '...oco....',
      '..occco...',
      '.ocwccco..',
      'occcccccco',
      '.occccco..',
      '..occco...',
      '...oco....',
      '....o.....',
    ], { o: '#2a6a98', c: '#5ae0ff', w: '#ffffff' });
    return true;
  }
  if (ore === 'icecream') {
    // a strawberry scoop on a cone, with a sprinkle
    drawMap(ctx, 0, 0, [
      '..oooooo..',
      '.opphppmo.',
      'oppppppppo',
      'opyppppppo',
      '.oooooooo.',
      '..ocscso..',
      '..oscsco..',
      '...ocso...',
      '....oo....',
    ], { o: OUT, p: '#ff8ab8', h: '#ffd0e4', m: '#8ae8b8', y: '#ffe066', c: '#e0a050', s: '#b87a30' });
    return true;
  }
  if (ore === 'pearl') {
    // a round shiny pearl
    drawMap(ctx, 0, 0, [
      '..oooooo..',
      '.owwppppo.',
      'owwpppppko',
      'owppppppko',
      'opppppppko',
      'oppppppkko',
      '.oppppkko.',
      '..oooooo..',
    ], { o: '#6a4a6a', w: '#ffffff', p: '#ffe8f4', k: '#e8b8d8' });
    return true;
  }
  if (ore === 'comet') {
    // a blue comet chunk with an icy tail
    drawMap(ctx, 0, 0, [
      '..........',
      '.....oooo.',
      't...obbwbo',
      '.tt.obbbbo',
      '..ttobbbbo',
      '.tt.obbbbo',
      't....oooo.',
      '..........',
    ], { o: OUT, b: '#4a8aff', w: '#c8e0ff', t: '#c8e8ff' });
    return true;
  }
  return false;
}

// ---------- creatures (16x12, 2 frames) ----------

// a space penguin in a little bubble helmet (it waddles)
const PENGUIN_0 = fit([
  '.....bbbbb',
  '....b.ooo.b',
  '...b.okkko.b',
  '...boowkwoob',
  '....okkkkyyo',
  '...okwwwwko',
  '..okwwwwwwko',
  '..okwwwwwwko',
  '...okwwwwko',
  '...okkkkkko',
  '....yy..yy',
  '',
]);
const PENGUIN = [PENGUIN_0, fit(['', ...PENGUIN_0.slice(0, 9), '...yy....yy', ''])];

// a scoop slime: a bouncy scoop of strawberry ice cream with sprinkles
const SCOOP_0 = fit([
  '',
  '',
  '.....oooooo',
  '...oopphpppoo',
  '..oppyppppcppo',
  '..opkkppppkkpo',
  '..opkwppppkwpo',
  '..oppppmmppppo',
  '..ocpppppppyp.o',
  '...opppppppppo',
  '....ooooooooo',
  '',
]);
const SCOOP = [SCOOP_0, fit(['', '', '', '...oooooooooo', '..oppyphppcppo', '..opkkppppkkppo', '..opkwppppkwppo', '.oppppppmmpppppo', '.ocppppppppppypo', '..opppppppppppo', '...oooooooooooo', ''])];

// a snow owl (it flaps)
const OWL = [
  fit(['', '....o......o', '....oo....oo', '....owwwwwwo', '...owkywwkyow', '...owwwyywwwo', 'oo.owwwwwwwwo.oo', 'owwowwswwswwowwo', '.owowwwwwwwwowo', '..oowwswwswoo', '....oyoooyo', '']),
  fit(['', '....o......o', '....oo....oo', '....owwwwwwo', '...owkywwkyow', '...owwwyywwwo', '...owwwwwwwwo', '..oowwswwswwoo', '.owwowwwwwwowwo', 'owo.owswwswo.owo', 'o...oyoooyo...o', '']),
];

// a little comet with a sparkly tail (it flies)
const COMETLING = [
  fit(['', '', '..........oooo', '.t.t....obbbbo', 't.t.t..obbwkbbo', '.ttttttbbbbbbbo', 't.t.t..obbkkbbo', '.t.t....obbbbo', '..........oooo', '', '', '']),
  fit(['', '', '..........oooo', 't.t.....obbbbo', '.t.t.t.obbwkbbo', 'tttttttbbbbbbbo', '.t.t.t.obbkkbbo', 't.t.....obbbbo', '..........oooo', '', '', '']),
];

// a snowflake sprite: a six-point flake with a little face
const SNOWFLAKE = [
  fit(['.......w', '...w...w...w', '....w..w..w', '.....wwww', '..w.wwkwkw.w', 'wwwwwwwwwwwwwww', '..w.wwwmww.w', '.....wwww', '....w..w..w', '...w...w...w', '.......w', '']),
  fit(['', '....w..w..w', '.....w.w.w', '...w.wwww.w', '....wwkwkw', '.wwwwwwwwwwwww', '....wwwmww', '...w.wwww.w', '.....w.w.w', '....w..w..w', '', '']),
];

// the Yeti Cub: a small white furry yeti with blue cheeks
const YETI_0 = fit([
  '....oooooo',
  '...owwwwwwo',
  '..owwffffwwo',
  '..owfkffkfwo',
  '..owbffffbwo',
  '...owfmmfwo',
  '..owwwwwwwwo',
  '.owwowwwwowwo',
  '.ow.owwwwo.wo',
  '....owwwwo',
  '....oo..oo',
  '',
]);
const YETI = [YETI_0, fit(['', ...YETI_0.slice(0, 9), '...oo....oo'])];

// ---------- decorations (16x16, 3 variants) ----------

const blank = (n) => Array(n).fill('................');
export const SATURN_DECOR = {
  snowdrift: [
    [...blank(12), '......ssss......', '...ssswwwwss....', '.sswwwwwwwwwss..', 'swwwwwwwwwwwwwss'],
    [...blank(13), '.........sss....', '.sss...sswwwss..', 'swwwsssswwwwwwss'],
    [...blank(14), '..ssss....sss...', 'sswwwwss.swwwss.'],
  ],
  sprinkles: [
    [...blank(13), '..p....y...b....', '....g....p....y.', '.y...b..g...p...'],
    [...blank(14), '.b..p..y..g..p..', '...y..g..b..y...'],
    [...blank(14), '..y.....p..b....', 'p...g.b....y..g.'],
  ],
  cone: [
    [...blank(6), '......oooo......', '.....oppppo.....', '....oppyhppo....', '....opppppppo...', '.....oooooo.....', '.....occcco.....', '......occo......', '......occo......', '.......oo.......', '................'],
    [...blank(8), '......oooo......', '.....ommmmo.....', '.....omhmmo.....', '......oooo......', '......occo......', '.......oo.......', '................', '................'],
    [...blank(10), '.....oooo.......', '....ocscso......', '.....ocso.......', '......oo........', '................', '................'],
  ],
  icicle: [
    ['.iiiiiiiiiiiiii.', '..iIi..iIi..iIi.', '..iIi..iIi...i..', '...i...iIi...i..', '...i....i.......', '........i.......', ...blank(10)],
    ['iiiiiiiiiiiiiiii', '.iIi.iIIi..iIi..', '.iIi..iIi...i...', '..i...iIi...i...', '......iIi.......', '.......i........', '.......i........', ...blank(9)],
    ['.....iiiiii.....', '......iIIi......', '......iIIi......', '.......Ii.......', '.......i........', ...blank(11)],
  ],
};
export const SATURN_DECOR_PAL = {
  snowdrift: { s: '#c8e0f0', w: '#ffffff' },
  sprinkles: { p: '#ff7eb6', y: '#ffe066', b: '#6ad0ff', g: '#7ae07a' },
  cone: { o: OUT, p: '#ff8ab8', h: '#ffd0e4', y: '#ffe066', m: '#8ae8b8', c: '#e0a050', s: '#b87a30' },
  icicle: { i: '#9fd8f0', I: '#ffffff' },
};
export const SATURN_GLOWING = {};

// ---------- the rest ----------

function pxEllipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

export function drawSaturnWorld(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
    return tex;
  };
  const sheet = (key, frames, pal, w = 16, h = 12) => one(key, w * frames.length, h, (ctx, tex) => {
    frames.forEach((rows, i) => {
      drawMap(ctx, i * w, 0, rows, pal);
      tex.add(i, 0, i * w, 0, w, h);
    });
  });

  sheet('penguin', PENGUIN, { b: 'rgba(200,240,255,0.8)', o: OUT, k: '#2a2a4a', w: '#ffffff', y: '#ffb030' });
  sheet('scoop', SCOOP, { o: '#8a2a5a', p: '#ff8ab8', h: '#ffd0e4', y: '#ffe066', c: '#6ad0ff', m: '#ff5a8a', k: OUT, w: '#ffffff' });
  sheet('owl', OWL, { o: '#4a5a7a', w: '#ffffff', k: OUT, y: '#ffb030', s: '#c8d8e8' });
  sheet('cometling', COMETLING, { o: OUT, b: '#4a8aff', w: '#ffffff', k: OUT, t: '#c8e8ff' });
  sheet('snowflake', SNOWFLAKE, { w: '#e8f8ff', k: '#2a4a8a', m: '#ff8ab8' });
  sheet('pet-yeti', YETI, { o: '#5a6a8a', w: '#ffffff', f: '#e0f0ff', k: OUT, b: '#8ad0ff', m: '#ff8ab8' });

  // a snowman (built when two snowballs meet): 16x24
  one('snowman', 16, 24, (ctx) => {
    pxEllipse(ctx, 8, 18, 6, 5, '#6a8aa8');
    pxEllipse(ctx, 8, 18, 5, 4, '#ffffff');
    pxEllipse(ctx, 8, 9, 4, 4, '#6a8aa8');
    pxEllipse(ctx, 8, 9, 3, 3, '#ffffff');
    rect(ctx, OUT, 6, 8, 1, 1); rect(ctx, OUT, 9, 8, 1, 1);
    rect(ctx, '#ff8a2a', 8, 9, 3, 1);
    rect(ctx, '#e0403a', 4, 12, 8, 2);
    rect(ctx, OUT, 8, 16, 1, 1); rect(ctx, OUT, 8, 19, 1, 1);
    rect(ctx, '#2a2a4a', 5, 3, 6, 3); rect(ctx, '#2a2a4a', 4, 5, 8, 1);
    rect(ctx, '#8a5a34', 1, 14, 3, 1); rect(ctx, '#8a5a34', 12, 14, 3, 1);
  });

  // a snow globe on a wooden base (0 still, 1 shaken: snow swirling)
  one('snowglobe', 64, 32, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 32;
      pxEllipse(ctx, ox + 16, 14, 13, 13, '#6a8aa8');
      pxEllipse(ctx, ox + 16, 14, 12, 12, 'rgba(200,240,255,0.35)');
      rect(ctx, '#ffffff', ox + 9, 6, 3, 2);
      rect(ctx, '#ffffff', ox + 8, 8, 1, 3);
      // a little Saturn inside
      pxEllipse(ctx, ox + 16, 16, 4, 4, '#f0d8a0');
      rect(ctx, '#9fe0ff', ox + 10, 16, 12, 1);
      const flakes = f ? [[10, 8], [20, 6], [14, 11], [22, 13], [9, 19], [18, 22], [13, 5]] : [[11, 22], [15, 23], [20, 22], [18, 21]];
      for (const [x, y] of flakes) rect(ctx, '#ffffff', ox + x, y, 1, 1);
      // the base
      rect(ctx, OUT, ox + 5, 25, 22, 7);
      rect(ctx, '#a0703c', ox + 6, 26, 20, 5);
      rect(ctx, '#c8904e', ox + 6, 26, 20, 1);
      rect(ctx, '#ffe066', ox + 14, 28, 4, 1);
      tex.add(f, 0, ox, 0, 32, 32);
    }
  });

  // the frozen comet: a big blue comet in a block of ice (0), cracked open (1)
  one('frozencomet', 96, 28, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 48;
      // the icy tail
      for (let k = 0; k < 16; k++) rect(ctx, `rgba(200,232,255,${0.7 - k * 0.04})`, ox + 2 + k, 12 + Math.round(Math.sin(k / 2) * 2), 2, 3);
      pxEllipse(ctx, ox + 28, 15, 11, 10, OUT);
      pxEllipse(ctx, ox + 28, 15, 10, 9, '#4a8aff');
      pxEllipse(ctx, ox + 25, 11, 3, 2, '#c8e0ff');
      rect(ctx, '#2a5ab8', ox + 30, 17, 4, 2);
      if (f === 0) {
        // a shell of ice all round
        ctx.fillStyle = 'rgba(200,240,255,0.45)';
        ctx.fillRect(ox + 14, 3, 28, 25);
        rect(ctx, '#ffffff', ox + 16, 5, 6, 1);
        rect(ctx, '#ffffff', ox + 16, 6, 1, 4);
        rect(ctx, '#9fd8f0', ox + 14, 3, 28, 1);
      } else {
        // cracked open, treasure sparkling inside
        rect(ctx, '#ffe066', ox + 26, 13, 2, 2);
        rect(ctx, '#ffffff', ox + 31, 11, 1, 1);
        rect(ctx, '#ffe8f4', ox + 23, 17, 2, 2);
        for (const [x, y] of [[13, 24], [40, 22], [16, 3], [39, 5]]) rect(ctx, 'rgba(200,240,255,0.6)', ox + x, y, 4, 3);
      }
      tex.add(f, 0, ox, 0, 48, 28);
    }
  });

  // the Saturn Heart: a gold gem with an icy ring around it (icon and big)
  {
    const { tex, ctx } = canvasTexture(scene, 'saturnheart-gem', 16, 16);
    drawMap(ctx, 0, 0, [
      '................',
      '......oooo......',
      '....oohhhhoo....',
      '...ohwwhhhhHo...',
      'rr.ohwhhhhhHorrr',
      '.rrrrhhhhhHrrr..',
      '..ohrrrrrrrrHo..',
      '..ohhhhhhHHHHo..',
      '...ohhhhHHHHo...',
      '....oohHHHoo....',
      '......oooo......',
      '................',
      '................',
      '................',
      '................',
      '................',
    ], { o: '#6a4a10', h: '#ffd84a', H: '#e0a020', w: '#ffffff', r: '#9fe0ff' });
    tex.refresh();
    const big = canvasTexture(scene, 'saturnheart-big', 48, 48);
    big.ctx.imageSmoothingEnabled = false;
    big.ctx.drawImage(tex.getSourceImage(), 0, 0, 16, 16, 0, 0, 48, 48);
    big.tex.refresh();
  }

  // the Gloves (Sun Suit piece 3), worn: puffy gold mittens on the hands,
  // one frame per character frame (idle, step A, step B, climb: arms up)
  one('suit-gloves-worn', 64, 16, (ctx, tex) => {
    for (let f = 0; f < 4; f++) {
      const ox = f * 16;
      const hands = f === 3 ? [[1, 5], [13, 5]] : [[2, 11], [12, 11]];
      for (const [x, y] of hands) {
        rect(ctx, OUT, ox + x, y, 3, 3);
        rect(ctx, '#ffd84a', ox + x, y, 2, 2);
        rect(ctx, '#fff2a0', ox + x, y, 1, 1);
      }
      tex.add(f, 0, ox, 0, 16, 16);
    }
  });

  // icons: sliding on ice, Ring Station, the flag on Saturn
  one('icon-slide', 16, 14, (ctx) => {
    rect(ctx, '#9fd8f0', 0, 11, 16, 3);
    rect(ctx, '#ffffff', 0, 11, 16, 1);
    for (const [x, y] of [[1, 7], [3, 5], [1, 9]]) rect(ctx, '#c8e8ff', x, y, 3, 1);
    drawMap(ctx, 6, 1, ['..oooo..', '.okkkko.', 'okwkkwko', 'okkyykko', '.owwwwo.', 'owwwwwwo', '.oyyyyo.', '..........'], { o: OUT, k: '#2a2a4a', w: '#ffffff', y: '#ffb030' });
  });
  one('icon-ringstation', 14, 12, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(7, 11, 6, Math.PI, 0); ctx.fill();
    rect(ctx, '#c8e0f0', 2, 8, 10, 1);
    rect(ctx, '#c8e0f0', 3, 6, 8, 1);
    rect(ctx, '#2a3a5a', 6, 8, 3, 3);
    rect(ctx, '#9fd8f0', 0, 11, 14, 1);
  });
  one('saturn-flag', 16, 24, (ctx) => {
    rect(ctx, '#d4dce6', 2, 1, 2, 21);
    rect(ctx, '#8a94a8', 3, 1, 1, 21);
    rect(ctx, OUT, 4, 1, 12, 9);
    rect(ctx, '#ff7eb6', 4, 2, 11, 7);
    rect(ctx, '#ffd1e6', 4, 2, 11, 1);
    rect(ctx, '#ffe066', 9, 3, 1, 5);
    rect(ctx, '#ffe066', 7, 5, 5, 1);
    rect(ctx, '#ffe066', 8, 4, 3, 3);
    pxEllipse(ctx, 3, 23, 5, 2, '#ffffff');
  });
}

// Five more badges (Saturn layers) onto the right of the badge strip.
export function drawSaturnBadges(ctx, rect, ring) {
  // the rings: a frost crystal
  ring(224, '#c8f0ff', '#4a8ab8');
  drawMap(ctx, 224 + 5, 3, ['..o...', '.oco..', 'occco.', 'ocwcco', '.occo.', '..oco.', '...o..'], { o: '#2a6a98', c: '#5ae0ff', w: '#ffffff' });
  // the ice cream caves: a cone
  ring(240, '#ffb0d8', '#a84a7a');
  drawMap(ctx, 240 + 4, 2, ['.oooo..', 'oppppo.', 'opyppo.', '.oooo..', '.occo..', '..oo...', '..o....'], { o: OUT, p: '#ff8ab8', y: '#ffe066', c: '#e0a050' });
  // the aurora caverns: a pearl under green and violet lights
  ring(256, '#3a6ab8', '#162e56');
  rect(ctx, '#3ae0a0', 256 + 4, 4, 8, 1);
  rect(ctx, '#a06aff', 256 + 5, 6, 6, 1);
  drawMap(ctx, 256 + 5, 7, ['.oooo.', 'owppko', 'oppppo', '.oooo.'], { o: '#6a4a6a', w: '#ffffff', p: '#ffe8f4', k: '#e8b8d8' });
  // the comet cave: a comet
  ring(272, '#2a3a6a', '#0c1020');
  drawMap(ctx, 272 + 2, 5, ['t....ooo.', '.tt.obbbo', 'ttttobwbo', '.tt.obbbo', 't....ooo.'], { o: OUT, b: '#4a8aff', w: '#ffffff', t: '#c8e8ff' });
  // the Saturn core: the ringed heart
  ring(288, '#ffe8a0', '#c89a30');
  drawMap(ctx, 288 + 2, 4, ['...oooo...', '..ohhhHo..', 'rrrrhhHrrr', '..ohhHHo..', '...oooo...'], { o: '#6a4a10', h: '#ffd84a', H: '#e0a020', r: '#9fe0ff' });
}
