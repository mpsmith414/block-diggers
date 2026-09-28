// Art for the five-layer Moon: its rocks and ores (tiles), back walls,
// creatures (space mice, jellyfish, UFO drones, star sprites), decorations,
// cheese wheels, singing crystals, teleport pads, the crashed UFO, the Moon
// Heart, the Helmet, the Moon Pup, the new drills and the Moon badges.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';
const T = 16;

export const MOON_HOSTS = {
  moonrock: { base: '#b8b8c8', dark: '#9898aa', light: '#dcdcea' },
  cheese: { base: '#d89a3a', dark: '#b87a2a', light: '#e8b458' },
  crystal: { base: '#34287a', dark: '#281e62', light: '#5a4ab8' },
  panel: { base: '#5a6a78', dark: '#46545f', light: '#7a8a98' },
  core: { base: '#4e78a8', dark: '#3e6490', light: '#8ab8e8' },
};

// ---------- tiles ----------

// Draws every Moon block into the tileset strip. `at(id)` is a block's x.
export function drawMoonTiles(ctx, at, rng, B, rect, speckle) {
  const moonRock = (id) => {
    speckle(ctx, at(id), rng, MOON_HOSTS.moonrock, 5);
    rect(ctx, '#a4a4b6', at(id) + 9, 9, 3, 1);
    rect(ctx, '#a4a4b6', at(id) + 8, 10, 1, 1);
    rect(ctx, '#cacad8', at(id) + 9, 11, 3, 1);
  };
  // moonstone: pale blue glowing pebbles in the moon rock
  moonRock(B.MOONSTONE);
  for (const [x, y] of [[2, 2], [9, 4], [4, 10], [11, 11]]) {
    const ox = at(B.MOONSTONE) + x;
    rect(ctx, '#5a8ab8', ox, y, 4, 3);
    rect(ctx, '#9ad8ff', ox, y, 3, 2);
    rect(ctx, '#e8f8ff', ox, y, 1, 1);
  }
  // old space-crystal ore in moon rock (now drops space gems)
  moonRock(B.SPACE_CRYSTAL);
  gems(ctx, rect, at(B.SPACE_CRYSTAL));

  // cheese rock: warm orange rind-cheese full of holes
  const cheeseRock = (id) => {
    const ox = at(id);
    rect(ctx, MOON_HOSTS.cheese.base, ox, 0, T, T);
    rect(ctx, MOON_HOSTS.cheese.light, ox, 0, T, 1);
    for (const [x, y, r] of [[4, 4, 2], [12, 3, 1], [10, 10, 2], [3, 12, 1], [14, 13, 1]]) {
      rect(ctx, '#9a6420', ox + x - r, y - r + 1, r * 2, r * 2 - 1);
      rect(ctx, '#9a6420', ox + x - r + 1, y - r, r * 2 - 2, r * 2 + 1);
      rect(ctx, '#c88a3a', ox + x - r + 1, y + r - 1, r * 2 - 1, 1);
    }
  };
  cheeseRock(B.CHEESE_ROCK);
  // cheese ore: two chunky bright wedges of cheese poking out of the rock
  cheeseRock(B.CHEESE);
  for (const [x, y] of [[0, 1], [7, 8]]) {
    drawMap(ctx, at(B.CHEESE) + x, y, [
      '......oo.',
      '....ooyyo',
      '..ooyyyyo',
      'ooyyhyyyo',
      'oyyyyyyho',
      'oyhyyyyyo',
      'oYYYYYYYo',
      'ooooooooo',
    ], { o: '#6a4a08', y: '#ffe45a', Y: '#e8b830', h: '#d8a020' });
  }

  // moon crystal rock: deep blue-violet with bright facet lines
  const crystalRock = (id) => {
    speckle(ctx, at(id), rng, MOON_HOSTS.crystal, 5);
    const ox = at(id);
    for (let k = 0; k < 5; k++) rect(ctx, '#6a5ae0', ox + 2 + k, 11 - k, 1, 1);
    for (let k = 0; k < 4; k++) rect(ctx, '#6a5ae0', ox + 10 + k, 3 + k, 1, 1);
    rect(ctx, '#c8c0ff', ox + 6, 7, 1, 1);
    rect(ctx, '#c8c0ff', ox + 13, 6, 1, 1);
  };
  crystalRock(B.MOON_CRYSTAL);
  crystalRock(B.SPACE_GEM);
  gems(ctx, rect, at(B.SPACE_GEM));

  // alien panels: riveted metal plates with a seam and a little green light
  const panel = (id) => {
    const ox = at(id);
    rect(ctx, MOON_HOSTS.panel.base, ox, 0, T, T);
    rect(ctx, MOON_HOSTS.panel.light, ox, 0, T, 1);
    rect(ctx, MOON_HOSTS.panel.light, ox, 0, 1, T);
    rect(ctx, MOON_HOSTS.panel.dark, ox, T - 1, T, 1);
    rect(ctx, MOON_HOSTS.panel.dark, ox + T - 1, 0, 1, T);
    rect(ctx, MOON_HOSTS.panel.dark, ox, 8, T, 1);
    rect(ctx, '#8a9aa8', ox, 9, T, 1);
    for (const [x, y] of [[2, 2], [13, 2], [2, 12], [13, 12]]) rect(ctx, '#2e3a44', ox + x, y, 1, 1);
  };
  panel(B.ALIEN_PANEL);
  rect(ctx, '#3aff7a', at(B.ALIEN_PANEL) + 6, 4, 2, 1);
  rect(ctx, '#2e3a44', at(B.ALIEN_PANEL) + 9, 4, 3, 1);
  // gizmos: green gadgets with a bolt and a light, stuck in the panel
  panel(B.GIZMO);
  for (const [x, y] of [[1, 1], [8, 9]]) {
    const ox = at(B.GIZMO) + x;
    rect(ctx, OUT, ox, y, 7, 6);
    rect(ctx, '#4ac06a', ox + 1, y + 1, 5, 4);
    rect(ctx, '#9affb0', ox + 1, y + 1, 5, 1);
    rect(ctx, '#e0e8f0', ox + 2, y + 2, 1, 2);
    rect(ctx, '#ff5a8a', ox + 4, y + 2, 1, 1);
    rect(ctx, '#e0e8f0', ox + 6, y - 1, 1, 2);
  }

  // the Moon's core: pale glowing rock with sparkling cracks
  const core = (id) => {
    speckle(ctx, at(id), rng, MOON_HOSTS.core, 6);
    const ox = at(id);
    rect(ctx, '#ffffff', ox + 3, 4, 3, 1);
    rect(ctx, '#ffffff', ox + 5, 5, 1, 2);
    rect(ctx, '#6ab8e8', ox + 9, 11, 4, 1);
    rect(ctx, '#ffffff', ox + 11, 11, 1, 1);
  };
  core(B.MOON_CORE);
  // the Moon Heart's cells: core rock with silver-blue veins
  core(B.MOON_HEART);
  rect(ctx, '#4a8ae0', at(B.MOON_HEART) + 2, 8, 5, 1);
  rect(ctx, '#4a8ae0', at(B.MOON_HEART) + 10, 3, 1, 5);

  // cheese wheel: a round wheel of cheese with a slice cut out
  drawMap(ctx, at(B.CHEESE_WHEEL), 1, [
    '.....oooooo.....',
    '...ooRRRRRRoo...',
    '..oRRyyyyyyRRo..',
    '.oRyyyyhyyyyRRo.',
    '.oRyhyyyyyyyooo.',
    'oRyyyyyyyyooYYo.',
    'oRyyyyyyooYYYYo.',
    'oRyyyhyyoYYhYYo.',
    'oRyyyyyyyooYYYo.',
    'oRyyyyyyyyyooYo.',
    '.oRyyhyyyyyyyoo.',
    '.oRRyyyyyhyyRRo.',
    '..oRRyyyyyyRRo..',
    '...ooRRRRRRoo...',
    '.....oooooo.....',
  ], { o: '#6a4008', R: '#d88a20', y: '#ffd84a', h: '#d8a020', Y: '#fff0a0' });

  // teleport pad: a glowing ring on a little metal base (you stand in it)
  {
    const ox = at(B.TELEPORT);
    rect(ctx, '#2e3a44', ox + 1, 13, 14, 3);
    rect(ctx, '#8a9aa8', ox + 1, 13, 14, 1);
    rect(ctx, '#3affe0', ox + 3, 12, 10, 1);
    rect(ctx, 'rgba(58,255,224,0.35)', ox + 4, 6, 8, 6);
    rect(ctx, 'rgba(58,255,224,0.2)', ox + 5, 1, 6, 5);
    rect(ctx, '#e0fffa', ox + 7, 12, 2, 1);
  }
}

// three violet-pink gems (space gems), for tiles
function gems(ctx, rect, ox) {
  for (const [x, y] of [[2, 2], [9, 6], [3, 10]]) {
    rect(ctx, '#3a1060', ox + x, y, 5, 5);
    rect(ctx, '#b070ff', ox + x + 1, y, 3, 5);
    rect(ctx, '#b070ff', ox + x, y + 1, 5, 3);
    rect(ctx, '#ffc0f0', ox + x + 1, y + 1, 1, 1);
    rect(ctx, '#7a40c8', ox + x + 3, y + 3, 1, 1);
  }
}

// Back walls for the Moon's layers, into the raw tile strip at `ox`.
export function drawMoonBacks(ctx, rect, back, BACK) {
  back(BACK.craters, { base: '#44445a', dark: '#383848', light: '#50506a' });
  back(BACK.cheesecaves, { base: '#4a3218', dark: '#3a2610', light: '#56401f' });
  for (const [x, y] of [[4, 4], [11, 10]]) rect(ctx, '#2e1e0c', BACK.cheesecaves * T + x, y, 2, 2);
  back(BACK.mooncrystal, { base: '#16123a', dark: '#100c2e', light: '#1e1a4a' });
  rect(ctx, '#2e2870', BACK.mooncrystal * T + 3, 12, 3, 1);
  rect(ctx, '#2e2870', BACK.mooncrystal * T + 10, 4, 1, 3);
  back(BACK.alienbase, { base: '#1e2a30', dark: '#18222a', light: '#243238' });
  rect(ctx, '#141c22', BACK.alienbase * T, 7, T, 1);
  rect(ctx, '#141c22', BACK.alienbase * T + 7, 0, 1, T);
  rect(ctx, '#1f6a4a', BACK.alienbase * T + 11, 3, 1, 1);
  back(BACK.mooncore, { base: '#2a3a56', dark: '#22304a', light: '#324466' });
  rect(ctx, '#6a8ab8', BACK.mooncore * T + 5, 5, 1, 1);
  rect(ctx, '#6a8ab8', BACK.mooncore * T + 12, 11, 1, 1);
}

// ---------- ore icons (10x10) ----------

export function drawMoonOreIcon(ctx, rect, ore) {
  if (ore === 'moonstone') {
    // a round pale-blue stone with a glow ring
    rect(ctx, '#3a6a98', 2, 1, 6, 8);
    rect(ctx, '#3a6a98', 1, 2, 8, 6);
    rect(ctx, '#9ad8ff', 2, 2, 6, 6);
    rect(ctx, '#c8ecff', 3, 2, 3, 2);
    rect(ctx, '#ffffff', 3, 3, 1, 1);
    rect(ctx, '#6aa8d8', 5, 6, 2, 1);
    return true;
  }
  if (ore === 'spacegem') {
    // a violet faceted gem with a pink shine
    rect(ctx, '#3a1060', 2, 1, 6, 1);
    rect(ctx, '#3a1060', 1, 2, 8, 4);
    rect(ctx, '#3a1060', 2, 6, 6, 1);
    rect(ctx, '#3a1060', 3, 7, 4, 1);
    rect(ctx, '#3a1060', 4, 8, 2, 1);
    rect(ctx, '#b070ff', 2, 2, 6, 4);
    rect(ctx, '#b070ff', 3, 6, 4, 1);
    rect(ctx, '#b070ff', 4, 7, 2, 1);
    rect(ctx, '#ffc0f0', 3, 2, 2, 2);
    rect(ctx, '#7a40c8', 6, 4, 2, 2);
    return true;
  }
  if (ore === 'gizmo') {
    // a little green gadget with an antenna and a blinking light
    rect(ctx, OUT, 1, 3, 8, 6);
    rect(ctx, '#4ac06a', 2, 4, 6, 4);
    rect(ctx, '#9affb0', 2, 4, 6, 1);
    rect(ctx, '#e0e8f0', 3, 5, 1, 2);
    rect(ctx, '#e0e8f0', 5, 5, 2, 1);
    rect(ctx, '#ff5a8a', 6, 6, 1, 1);
    rect(ctx, '#c0c8d8', 7, 0, 1, 3);
    rect(ctx, '#ff5a8a', 7, 0, 1, 1);
    return true;
  }
  return false;
}

// ---------- creatures, decorations, finds ----------

const MOUSE = [
  ['................', '....oo...oo.....', '...opwo.opwo....', '...oppo.oppo....', '....oooooooo....', '...ogggggggggo..',
    '..oggkggggkgggo.', '..ogggggggggggo.', '.nggggppggggggo.', '..oggggggggggo.t', '...oooooooooo.t.', '...oo.....oo.tt..'],
  ['................', '................', '....oo...oo.....', '...opwo.opwo....', '...oppo.oppo....', '....oooooooo....',
    '...ogggggggggo..', '..oggkggggkgggo.', '..ogggggggggggo.', '.nggggppgggggo.t', '..oooooooooooo.t', '....oo...oo..tt.'],
].map((f) => f.map((r) => r.slice(0, 16)));

const JELLY = [
  ['................', '.....oooooo.....', '...oopppppPoo...', '..oppppppppPPo..', '..opkpppppkpPo..', '..opppppppppPo..',
    '..oooooooooooo..', '...p..p..p..p...', '...p..p..p..p...', '....p..p..p..p..', '....p..p..p..p..', '................'],
  ['................', '................', '.....oooooo.....', '...oopppppPoo...', '..oppppppppPPo..', '..opkpppppkpPo..',
    '..opppppppppPo..', '..oooooooooooo..', '..p..p..p..p....', '..p..p..p..p....', '...p..p..p..p...', '...p..p..p..p...'],
];

const DRONE = [
  ['.......r........', '.......o........', '.....oggggo.....', '....ogwgggggo...', '..oooooooooooo..', '.ossssssssssssso',
    'ossyssyssyssysso', '.ossssssssssssso', '..oooooooooooo..', '....o......o....', '................', '................'],
  ['.......R........', '.......o........', '.....oggggo.....', '....ogwgggggo...', '..oooooooooooo..', '.ossssssssssssso',
    'osssyssyssysssso', '.ossssssssssssso', '..oooooooooooo..', '.....o....o.....', '................', '................'],
];

const SPRITE = [
  ['.......y........', '......yYy.......', '......yYy.......', '.yyyyyYYYyyyyy..', '..yYYYYYYYYYy...', '...yYkYYYkYy....',
    '....yYYYYYy.....', '....yYYrYYy.....', '...yYYyyyYYy....', '...yYy...yYy....', '..yy.......yy...', '................'],
  ['................', '.......y........', '......yYy.......', '.yyyyyYYYyyyyy..', '..yYYYYYYYYYy...', '...yYkYYYkYy....',
    '....yYYYYYy.....', '....yYYrYYy.....', '...yYYyyyYYy....', '..yYy.....yYy...', '.yy.........yy..', '................'],
];

// the Moon Pup: a little white puppy in a glass bubble helmet (2 frames, 16x12)
const PUP = [
  ['....bbbbbbb.....', '...b.......b....', '..b..ooooo..b...', '..b.owwwwwo.b...', '..bowwkwkwwob...', '.oobwwwnwwwbo...',
    'oeebwwwwwwwboo..', 'oe.obbbbbbbwwo.t', '...owwwwwwwwwwot', '...owwwwwwwwwwo.', '...oo.oo..oo.oo.', '................'],
  ['................', '....bbbbbbb.....', '...b.......b....', '..b..ooooo..b...', '..b.owwwwwo.b...', '..bowwkwkwwob...',
    '.oobwwwnwwwbo..t', 'oeebwwwwwwwbooot', 'oe.obbbbbbbwwwo.', '...owwwwwwwwwwo.', '....oo.oo.oo.oo.', '................'],
];

// Moon decorations, 3 variants each (16x16)
const blank = (n) => Array(n).fill('................');
export const MOON_DECOR = {
  crumbs: [
    [...blank(13), '...c......c.....', '..cCc..c.cCc..c.', '.cCCCc.ccCCCccCc'],
    [...blank(14), '.c....cc.....c..', 'cCc..cCCc...cCc.'],
    [...blank(12), '.......cc.......', '......cCCc......', '..c..cCCCCc..c..', '.cCccCCCCCCccCc.'],
  ],
  mousehole: [
    [...blank(9), '.....oooooo.....', '....oddddddo....', '...oddddddddo...', '...oddddddddo...', '...odddwwdddo...', '...oddddddddo...', '...oddddddddo...'],
    [...blank(10), '.....oooooo.....', '....oddddddo....', '....oddwdwdo....', '....oddddddo....', '....oddddddo....', '....oddddddo....'],
    [...blank(11), '......oooo......', '.....oddddo.....', '.....oddddo.....', '.....oddddo.....', '.....oddddo.....'],
  ],
  cheesedrip: [
    ['cccccccccccccccc', '.cCCcc.cCCc.cCc.', '..cCc...cc...c..', '..cCc...c.......', '...c............', ...blank(11)],
    ['cccccccccccccccc', 'cCc.cCCCc..cCcc.', '.c...cCc....cc..', '.....cCc....c...', '......c.........', '......c.........', ...blank(10)],
    ['cccccccccccccccc', '..cCc....cCCc...', '...c......cc....', '...........c....', ...blank(12)],
  ],
  crystalspike: [
    ['..oxo....oxxo...', '..oxo....oxXo...', '...o.....oxo....', '..........o.....', ...blank(12)],
    ['.oxXo..oxo..oxo.', '.oxxo..oxo..oxo.', '..oxo...o....o..', '..oo............', '...o............', ...blank(11)],
    ['......oxxXo.....', '......oxxXo.....', '.......oxo......', '.......oxo......', '........o.......', ...blank(11)],
  ],
  antenna: [
    [...blank(6), '.......r........', '.......k........', '.......k........', '.......k........', '......kkk.......', '.......k........', '.......k........', '.....kkkkk......', '....kmmmmmk.....', '....kkkkkkk.....'],
    [...blank(8), '...r......r.....', '...k......k.....', '...k.....k......', '....k...k.......', '.....kkk........', '....kmmmk.......', '....kkkkk.......', '................'],
    [...blank(10), '..........r.....', '..........k.....', '.........kk.....', '........kmmk....', '........kmmk....', '........kkkk....'],
  ],
  blinker: [
    [...blank(10), '...kkkkkkkkk....', '...kmmmmmmmk....', '...kmgmrmbmk....', '...kmmmmmmmk....', '...kmmmmmmmk....', '...kkkkkkkkk....'],
    [...blank(11), '.....kkkkkk.....', '.....kmmmmk.....', '.....kmgrmk.....', '.....kmmmmk.....', '.....kkkkkk.....'],
    [...blank(9), '..kkkkkkkkkkkk..', '..kmmmmmmmmmmk..', '..kmbmmgmmrmmk..', '..kmmmmmmmmmmk..', '..kmmgmmrmmbmk..', '..kmmmmmmmmmmk..', '..kkkkkkkkkkkk..'],
  ],
  cable: [
    ['..k.......k.....', '..k........k....', '...k.......k....', '...k......k.....', '....k....k......', '.....k..k.......', '......kk........', ...blank(9)],
    ['........k.......', '........k.......', '........k.......', '........k.......', '.......kgk......', '.......kkk......', ...blank(10)],
    ['.k...........k..', '..k.........k...', '...kk.....kk....', '.....kkkkk......', ...blank(12)],
  ],
  starflower: [
    [...blank(8), '.......y........', '......yYy.......', '....yyYwYyy.....', '......yYy.......', '.......y........', '.......g........', '......gg........', '.....g.g.g......', '.......g........', '......ggg.......'],
    [...blank(10), '...y.......y....', '..yYy.....yYy...', '...y.......y....', '...g...y...g....', '...g..yYy..g....', '..gg...g...gg...'],
    [...blank(11), '........y.......', '.......yYy......', '......yYwYy.....', '.......yYy......', '........g.......'],
  ],
};
export const MOON_DECOR_PAL = {
  crumbs: { c: '#d8a040', C: '#ffd84a' },
  mousehole: { o: '#6a4a1a', d: '#1a1008', w: '#fff6c0' },
  cheesedrip: { c: '#e0a030', C: '#ffd84a' },
  crystalspike: { o: '#1a1044', x: '#8a6ae0', X: '#e8e0ff' },
  antenna: { k: '#46545f', m: '#8a9aa8', r: '#ff5a5a' },
  blinker: { k: '#2e3a44', m: '#5a6a78', g: '#3aff7a', r: '#ff5a5a', b: '#5ac8ff' },
  cable: { k: '#2e3a44', g: '#3aff7a' },
  starflower: { y: '#ffe066', Y: '#fff8c0', w: '#ffffff', g: '#6ab8e8' },
};
export const MOON_GLOWING = { crystalspike: 0x8a6ae0, blinker: 0x3aff7a, antenna: 0xff5a5a, starflower: 0xffe066, crumbs: 0 };

// A filled ellipse in whole pixels (no soft edges). `top` draws only the top half.
function pxEllipse(ctx, cx, cy, rx, ry, color, top = false) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= (top ? 0 : ry); y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

export function drawMoonWorld(scene, canvasTexture, rect) {
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

  sheet('mouse', MOUSE, { o: OUT, g: '#b8b0c8', k: OUT, p: '#ff9ab0', w: '#ffffff', n: '#ff7eb6', t: '#ff9ab0' });
  sheet('jelly', JELLY, { o: '#6a2a8a', p: '#e08aff', P: '#ffd0ff', k: OUT });
  sheet('drone', DRONE, { o: OUT, g: 'rgba(120,255,160,0.85)', w: '#ffffff', s: '#c0c8d8', y: '#ffe066', r: '#ff5a5a', R: '#3aff7a' });
  sheet('starsprite', SPRITE, { y: '#e0b020', Y: '#fff2a0', k: OUT, r: '#ff8fa3' });
  sheet('pet-moonpup', PUP, { b: 'rgba(200,240,255,0.9)', o: OUT, w: '#ffffff', k: OUT, n: '#ff7eb6', e: '#c8c8d8', t: '#e0e0ec' });

  // the singing crystal: a tall glowing crystal (2 frames: still, ringing)
  one('chime', 32, 24, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      const hi = f ? '#ffffff' : '#e8e0ff';
      const body = f ? '#b8a8ff' : '#8a6ae0';
      rect(ctx, '#1a1044', ox + 5, 2, 6, 22);
      rect(ctx, '#1a1044', ox + 6, 0, 4, 2);
      rect(ctx, body, ox + 6, 2, 4, 21);
      rect(ctx, body, ox + 7, 1, 2, 1);
      rect(ctx, hi, ox + 7, 3, 1, 14);
      rect(ctx, '#1a1044', ox + 1, 12, 4, 12);
      rect(ctx, body, ox + 2, 13, 2, 11);
      rect(ctx, hi, ox + 2, 14, 1, 5);
      rect(ctx, '#1a1044', ox + 11, 15, 4, 9);
      rect(ctx, body, ox + 12, 16, 2, 8);
      tex.add(f, 0, ox, 0, 16, 24);
    }
  });
  one('chime-icon', 16, 16, (ctx) => {
    rect(ctx, '#1a1044', 5, 1, 6, 15); rect(ctx, '#8a6ae0', 6, 2, 4, 14); rect(ctx, '#e8e0ff', 7, 3, 1, 9);
    rect(ctx, '#1a1044', 1, 8, 4, 8); rect(ctx, '#8a6ae0', 2, 9, 2, 7);
    rect(ctx, '#ffe066', 12, 2, 2, 5); rect(ctx, '#ffe066', 11, 6, 2, 2); rect(ctx, '#ffe066', 14, 2, 1, 2);
  });

  // the crashed UFO: a saucer tipped in the ground, hatch shut (0) or open (1)
  one('ufo', 96, 28, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 48;
      // dome
      pxEllipse(ctx, ox + 24, 12, 11, 10, OUT, true);
      pxEllipse(ctx, ox + 24, 12, 10, 9, f ? '#4a9a6a' : '#7affa8', true);
      rect(ctx, '#ffffff', ox + 19, 6, 3, 2);
      rect(ctx, '#ffffff', ox + 18, 8, 1, 2);
      // saucer
      pxEllipse(ctx, ox + 24, 17, 23, 7, OUT);
      pxEllipse(ctx, ox + 24, 16, 22, 6, '#c0c8d8');
      pxEllipse(ctx, ox + 24, 14, 18, 2, '#e8ecf4');
      rect(ctx, '#8a94a8', ox + 4, 19, 40, 2);
      for (let i = 0; i < 6; i++) rect(ctx, ['#ffe066', '#ff5a8a', '#3aff7a'][i % 3], ox + 6 + i * 7, 16, 2, 2);
      // hatch: a door in the middle; open shows light and a little alien waving
      if (f) {
        rect(ctx, '#fff6c0', ox + 20, 18, 8, 7);
        rect(ctx, '#7ae05a', ox + 22, 19, 4, 4);
        rect(ctx, OUT, ox + 23, 20, 1, 1); rect(ctx, OUT, ox + 25, 20, 1, 1);
        rect(ctx, '#7ae05a', ox + 27, 17, 1, 3);
      } else {
        rect(ctx, '#5a6a78', ox + 20, 18, 8, 5);
        rect(ctx, '#46545f', ox + 23, 18, 1, 5);
      }
      // little legs, one bent (it crashed!)
      rect(ctx, '#46545f', ox + 8, 22, 2, 5);
      rect(ctx, '#46545f', ox + 38, 22, 2, 3);
      rect(ctx, '#46545f', ox + 40, 25, 3, 2);
      tex.add(f, 0, ox, 0, 48, 28);
    }
  });

  // the Moon Heart: a big silver-blue crescent gem (icon and big)
  {
    const pal = { o: '#0e1a4a', h: '#6ad0ff', H: '#2a6ad0', w: '#ffffff', y: '#ffe066' };
    const { tex, ctx } = canvasTexture(scene, 'moonheart-gem', 16, 16);
    drawMap(ctx, 0, 0, [
      '......oooo......',
      '....oohhhhoo....',
      '...ohhwwhhhho...',
      '..ohhwhhoooHo...',
      '..ohwhho...oo...',
      '.ohhhho.........',
      '.ohhhho....y....',
      '.ohhhho...yyy...',
      '.ohhhHo....y....',
      '..ohhHHo.....o..',
      '..ohhHHHooooHo..',
      '...ohHHHHHHHo...',
      '....ooHHHHoo....',
      '......oooo......',
      '................',
      '................',
    ], pal);
    tex.refresh();
    const big = canvasTexture(scene, 'moonheart-big', 48, 48);
    big.ctx.imageSmoothingEnabled = false;
    big.ctx.drawImage(tex.getSourceImage(), 0, 0, 16, 16, 0, 0, 48, 48);
    big.tex.refresh();
  }

  // the Helmet (Sun Suit piece 1): a glass bubble with a gold collar and a
  // little lamp, drawn over a 16x16 character frame
  one('suit-helmet', 16, 16, (ctx) => {
    ctx.fillStyle = 'rgba(200,240,255,0.22)';
    ctx.beginPath(); ctx.arc(8, 6.5, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(220,250,255,0.95)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(8, 6.5, 6, 0, Math.PI * 2); ctx.stroke();
    rect(ctx, 'rgba(255,255,255,0.95)', 4, 3, 2, 1);
    rect(ctx, 'rgba(255,255,255,0.95)', 3, 4, 1, 2);
    rect(ctx, '#c89a20', 3, 11, 10, 2);
    rect(ctx, '#ffd84a', 3, 11, 10, 1);
    rect(ctx, '#c89a20', 7, 0, 2, 1);
    rect(ctx, '#fff6a0', 7, -1 + 1, 2, 1);
    rect(ctx, '#ffe066', 6, 0, 4, 1);
  });

  // new drills (tiers 6-8): Moon Drill, Crystal Drill, Laser Drill
  // (drawn by the pick sheet in decor.js; these are just their colours)

  // Moon badges: craters, cheese, crystal, alien, core (frames 4-8 of 'badge'
  // are added in extendBadges below)

  // icons: the star map and Moon Base
  one('icon-starmap', 14, 14, (ctx) => {
    rect(ctx, '#1a1a48', 0, 0, 14, 14);
    rect(ctx, '#ffe066', 1, 10, 3, 3);
    rect(ctx, '#c8c8d8', 5, 6, 2, 2);
    rect(ctx, '#e05a3a', 8, 8, 2, 2);
    rect(ctx, '#ffb34a', 10, 1, 3, 3);
    rect(ctx, '#fff6a0', 11, 2, 1, 1);
    for (const [x, y] of [[3, 9], [4, 8], [6, 8], [7, 8], [9, 6], [9, 5]]) rect(ctx, '#8a8ab8', x, y, 1, 1);
  });
  one('icon-moonbase', 14, 12, (ctx) => {
    ctx.fillStyle = 'rgba(160,230,255,0.6)';
    ctx.beginPath(); ctx.arc(7, 9, 6, Math.PI, 0); ctx.fill();
    rect(ctx, '#c0c8d8', 0, 9, 14, 3);
    rect(ctx, '#8a94a8', 0, 11, 14, 1);
    rect(ctx, '#ffe066', 6, 6, 2, 3);
    rect(ctx, '#c0c8d8', 12, 1, 1, 8);
    rect(ctx, '#ff5a5a', 11, 0, 3, 1);
  });
}

// Five more badges (Moon layers) onto the right of the badge strip.
export function drawMoonBadges(ctx, rect, ring) {
  ring(64, '#b8b8c8', '#6a6a7a');
  ctx.fillStyle = '#8a8a9a';
  ctx.beginPath(); ctx.arc(64 + 6, 7, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(64 + 10, 10, 1.5, 0, Math.PI * 2); ctx.fill();
  ring(80, '#ffd84a', '#b87a2a');
  drawMap(ctx, 80 + 3, 4, ['.......oo.', '.....ooyyo', '...ooyyyyo', '.ooyyhyyyo', 'oyyyyyyhyo', 'oyhyyyyyyo', 'oooooooooo'],
    { o: '#8a6a10', y: '#fff0a0', h: '#d09a20' });
  ring(96, '#8a6ae0', '#34287a');
  drawMap(ctx, 96 + 5, 2, ['..o...', '.oxo..', '.oxXo.', 'oxxXo.', 'oxxXo.', 'oxxXo.', '.oxo..', '..o...'], { o: '#1a1044', x: '#c8b8ff', X: '#ffffff' });
  ring(112, '#5ad07a', '#1f6a4a');
  drawMap(ctx, 112 + 3, 5, ['...gggg...', '..gwgggg..', 'oooooooooo', 'ossysysyso', '.oooooooo.'], { o: OUT, g: '#9affb0', w: '#ffffff', s: '#c0c8d8', y: '#ffe066' });
  ring(128, '#c8f0ff', '#4a8ae0');
  drawMap(ctx, 128 + 4, 3, ['..oooo..', '.ohhhho.', 'ohwhooo.', 'ohho....', 'ohho....', 'ohhhoooo', '.ohhhho.', '..oooo..'], { o: '#1a2a5a', h: '#9ad8ff', w: '#ffffff' });
}
