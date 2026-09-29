// Art for Dino Planet's five layers: its rocks and ores (tiles), back walls,
// ore icons, creatures (dragonflies, baby raptors, frogs, fire beetles, glow
// moths), decorations, the parasaur you ride, dino nests, the T-rex skull,
// the sleeping stegosaurus, the Dino Heart, the Jetpack, the Longneck, the
// Dino Planet badges and a few icons.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';
const T = 16;
const fit = (rows, w = 16) => rows.map((r) => (r + '.'.repeat(w)).slice(0, w));

export const DINO_HOSTS = {
  soil: { base: '#4a6a2a', dark: '#3a5220', light: '#5e8238' },
  fossil: { base: '#d8c8a0', dark: '#bca880', light: '#ece0c0' },
  mud: { base: '#5a5a2a', dark: '#46461e', light: '#6e6e38' },
  volcanic: { base: '#3e2424', dark: '#2e1a1a', light: '#523030' },
  core: { base: '#d8a040', dark: '#b8842e', light: '#f0c060' },
};

// ---------- tiles ----------

export function drawDinoTiles(ctx, at, rng, B, rect, speckle) {
  // jungle soil: green-brown earth with a curly root and a leaf
  const soil = (id) => {
    speckle(ctx, at(id), rng, DINO_HOSTS.soil, 5);
    const ox = at(id);
    rect(ctx, '#7a5a2a', ox + 2, 11, 4, 1);
    rect(ctx, '#7a5a2a', ox + 5, 12, 1, 2);
    rect(ctx, '#7ac04a', ox + 10, 3, 3, 1);
    rect(ctx, '#7ac04a', ox + 11, 2, 1, 3);
  };
  soil(B.JUNGLE_SOIL);
  // jade: green carved gems
  soil(B.JADE);
  for (const [x, y] of [[2, 1], [9, 6], [3, 10]]) {
    const ox = at(B.JADE) + x;
    rect(ctx, '#1a4a2a', ox, y, 5, 5);
    rect(ctx, '#3ad07a', ox + 1, y + 1, 3, 3);
    rect(ctx, '#aaffc8', ox + 1, y + 1, 1, 1);
    rect(ctx, '#2a9a5a', ox + 3, y + 3, 1, 1);
  }

  // fossil rock: pale stone with an old shell pressed in
  const fossil = (id) => {
    speckle(ctx, at(id), rng, DINO_HOSTS.fossil, 5);
    const ox = at(id);
    rect(ctx, '#a8946c', ox + 10, 10, 3, 1);
    rect(ctx, '#a8946c', ox + 12, 11, 1, 2);
    rect(ctx, '#a8946c', ox + 10, 12, 2, 1);
  };
  fossil(B.FOSSIL_ROCK);
  // dino bones: two white bones in the rock
  fossil(B.BONE);
  for (const [x, y] of [[1, 2], [6, 9]]) {
    const ox = at(B.BONE) + x;
    rect(ctx, '#6a5a40', ox, y, 9, 4);
    rect(ctx, '#fff8e8', ox + 2, y + 1, 5, 2);
    rect(ctx, '#fff8e8', ox + 1, y, 2, 2);
    rect(ctx, '#fff8e8', ox + 1, y + 2, 2, 2);
    rect(ctx, '#fff8e8', ox + 6, y, 2, 2);
    rect(ctx, '#fff8e8', ox + 6, y + 2, 2, 2);
  }

  // swamp mud: olive mud with a mossy streak and a bubble
  const mud = (id) => {
    speckle(ctx, at(id), rng, DINO_HOSTS.mud, 5);
    const ox = at(id);
    rect(ctx, '#7a9a3a', ox, 0, T, 1);
    rect(ctx, '#7a9a3a', ox + 3, 1, 3, 1);
    rect(ctx, '#8a8a4a', ox + 10, 9, 2, 2);
  };
  mud(B.SWAMP_MUD);
  // T-rex teeth: big cream fangs
  mud(B.TOOTH);
  for (const [x, y] of [[2, 3], [9, 7]]) {
    const ox = at(B.TOOTH) + x;
    rect(ctx, OUT, ox, y, 5, 7);
    rect(ctx, '#fff4d8', ox + 1, y, 3, 5);
    rect(ctx, '#fff4d8', ox + 2, y + 5, 1, 1);
    rect(ctx, '#e0d0a8', ox + 3, y + 1, 1, 4);
  }

  // volcanic rock: dark red-black with glowing cracks
  const volcanic = (id) => {
    speckle(ctx, at(id), rng, DINO_HOSTS.volcanic, 5);
    const ox = at(id);
    rect(ctx, '#c83a1a', ox + 3, 5, 3, 1);
    rect(ctx, '#c83a1a', ox + 5, 6, 1, 2);
    rect(ctx, '#ff8a2a', ox + 5, 6, 1, 1);
  };
  volcanic(B.VOLCANIC);
  // obsidian: glossy black-purple shards
  volcanic(B.OBSIDIAN);
  for (const [x, y] of [[8, 1], [2, 8]]) {
    const ox = at(B.OBSIDIAN) + x;
    rect(ctx, '#0e0816', ox + 1, y, 4, 6);
    rect(ctx, '#0e0816', ox, y + 1, 6, 4);
    rect(ctx, '#3a2a5a', ox + 1, y + 1, 4, 4);
    rect(ctx, '#8a6ac8', ox + 1, y + 1, 1, 2);
    rect(ctx, '#ffffff', ox + 2, y + 1, 1, 1);
  }

  // the Dino core: warm amber rock with glowing bits
  const core = (id) => {
    speckle(ctx, at(id), rng, DINO_HOSTS.core, 6);
    const ox = at(id);
    rect(ctx, '#fff0a0', ox + 3, 4, 2, 2);
    rect(ctx, '#7ae07a', ox + 11, 10, 2, 1);
    rect(ctx, '#8a5a1a', ox + 8, 3, 1, 4);
  };
  core(B.DINO_CORE);
  core(B.DINO_HEART);
  rect(ctx, '#ff8a2a', at(B.DINO_HEART) + 2, 9, 6, 1);
  rect(ctx, '#3ad07a', at(B.DINO_HEART) + 11, 2, 1, 5);
}

// Back walls for Dino Planet's layers.
export function drawDinoBacks(ctx, rect, back, BACK) {
  back(BACK.jungle, { base: '#1e2e14', dark: '#16240e', light: '#26381a' });
  rect(ctx, '#2e4a1e', BACK.jungle * T + 4, 6, 3, 1);
  back(BACK.bonebeds, { base: '#4a4030', dark: '#3e3526', light: '#564a38' });
  rect(ctx, '#62563e', BACK.bonebeds * T + 9, 10, 3, 1);
  back(BACK.swamp, { base: '#22281a', dark: '#1a2014', light: '#2a3220' });
  rect(ctx, '#3a4a2a', BACK.swamp * T + 3, 11, 4, 1);
  back(BACK.lavalands, { base: '#221010', dark: '#1a0a0a', light: '#2e1616' });
  rect(ctx, '#5a1a0e', BACK.lavalands * T + 10, 5, 2, 1);
  back(BACK.dinocore, { base: '#4a3414', dark: '#3e2c10', light: '#563e1c' });
  rect(ctx, '#7a5a2a', BACK.dinocore * T + 5, 8, 2, 1);
}

// ---------- ore icons (10x10) ----------

export function drawDinoOreIcon(ctx, rect, ore) {
  if (ore === 'jade') {
    drawMap(ctx, 0, 0, [
      '..oooooo..',
      '.ojjwjjjo.',
      'ojjwjjjjjo',
      'ojjjjjjjJo',
      'ojjjjjjJJo',
      '.ojjjjJJo.',
      '..oojJoo..',
      '....oo....',
    ], { o: '#1a4a2a', j: '#3ad07a', J: '#2a9a5a', w: '#aaffc8' });
    return true;
  }
  if (ore === 'bone') {
    drawMap(ctx, 0, 0, [
      '..........',
      '.oo....oo.',
      'owwo..owwo',
      '.owwwwwwo.',
      '..owwwwo..',
      '.owwwwwwo.',
      'owwo..owwo',
      '.oo....oo.',
    ], { o: '#6a5a40', w: '#fff8e8' });
    return true;
  }
  if (ore === 'tooth') {
    drawMap(ctx, 0, 0, [
      '.oooooooo.',
      'owwwwwwwso',
      'owwwwwwwso',
      '.owwwwwso.',
      '.owwwwwso.',
      '..owwwso..',
      '..owwso...',
      '...owo....',
      '....o.....',
    ], { o: OUT, w: '#fff4d8', s: '#e0d0a8' });
    return true;
  }
  if (ore === 'obsidian') {
    drawMap(ctx, 0, 0, [
      '....oo....',
      '...owpo...',
      '..owpppo..',
      '.opppppko.',
      'oppppppkko',
      '.opppkkko.',
      '..oopkoo..',
      '....oo....',
    ], { o: '#0e0816', p: '#3a2a5a', w: '#b89aff', k: '#1e1430' });
    return true;
  }
  return false;
}

// ---------- creatures (16x12, 2 frames) ----------

// a big friendly dragonfly (it flies, wings buzzing)
const DRAGONFLY = [
  fit(['', '..ww......ww', '.wWWw....wWWw', '..wWWw..wWWw', '...wwoooow', '.....obbbko', 'gggggggbbbbo', '.....obbbbo', '...wwoooow', '..wWWw..wWWw', '.wWWw....wWWw', '..ww......ww']),
  fit(['', '', '', '....wWw..wWw', '...wwWwoowWww', '.....obbbko', 'gggggggbbbbo', '.....obbbbo', '...wwWwoowWww', '....wWw..wWw', '', '']),
];

// a baby raptor (it runs about)
const RAPTOR_TOP = ['', '..........ooo', '.........ogggo', '........oggkgwo', '........ogggggo', '.oo....ogggwwo', 'oggooooggggo', '.oggggggggo', '..ogyggygo'];
const RAPTOR = [
  fit([...RAPTOR_TOP, '...oggggo', '...o.o.oo', '..oo..o']),
  fit([...RAPTOR_TOP, '...oggggo', '....oo.o', '....o..oo']),
];

// a round green frog (it hops)
const FROG = [
  fit(['', '', '', '...oo....oo', '..owko..owko', '..oggggggggo', '.oggggggggggo', '.oggggppgggggo', '.ogyggggggyggo', '..oggggggggo', '.ooo.oooo.ooo', '']),
  fit(['', '...oo....oo', '..owko..owko', '..oggggggggo', '.oggggggggggo', '.oggggppgggggo', '.ogyggggggyggo', '..oggggggggo', '..o........o', '.o..........o', 'oo..........oo', '']),
];

// a fire beetle: a shiny red shell with glowing spots
const BEETLE = [
  fit(['', '', '', '', '.....oooooo', '...oorryrrroo', '..orrrrrrrryro', '.korrryrrrrrro', 'kwkooooooooooo', '.o.o..o..o..o', '', '']),
  fit(['', '', '', '', '.....oooooo', '...oorryrrroo', '..orrrrrrrryro', '.korrryrrrrrro', 'kwkooooooooooo', 'o..o..o..o..o', '', '']),
];

// a glow moth: soft wings with glowing spots
const MOTH = [
  fit(['', '.oo........oo', 'owwo......owwo', 'owywo.oo.owywo', 'owwwwokkowwwwo', '.owwwokkowwwo', '..owwokkowwo', '.owyowkkwoywo', '..oo..oo..oo', '', '', '']),
  fit(['', '', '', '..ooo.oo.ooo', '.owywokkowywo', '.owwwokkowwwo', '..owwokkowwo', '...oo.kk.oo', '......oo', '', '', '']),
];

// the Longneck: a baby brachiosaurus (16x16, 2 frames)
const LONGNECK_BODY = ['.............oo.', '............ogko', '............oggo', '...........ogo..', '..........ogo...', '.........ogo....', '........ogo.....', '..oooooogo......', '.ogggggggo......', 'ogggyggyggo.....', 'ogggggggggo.....', '.oggggggggo.....'];
const LONGNECK = [
  [...LONGNECK_BODY, '..og.og.og.o....', '..og.og.og.o....', '..oo.oo.oo.oo...', '................'],
  [...LONGNECK_BODY, '...og.og.og.o...', '...og..og.og....', '...oo..oo.oo....', '................'],
].map((f) => fit(f));

// ---------- decorations (16x16, 3 variants) ----------

const blank = (n) => Array(n).fill('................');
export const DINO_DECOR = {
  fern: [
    [...blank(6), '.......g........', '......gG..g.....', '..g..gGg.gG.....', '..Gg.gG.gG...g..', '...GggGgG...gG..', '.g..GGGG..gGg...', '.Gg..GG..gG.....', '..GGgGGggG......', '....GGGG........', '.....GG.........'],
    [...blank(9), '....g.....g.....', '...gG.g..gG.....', '....GgG.gG......', '..g..GGgG.......', '..GggGG.........', '....GG..........', '....G...........'],
    [...blank(11), '.g.......g......', '.Gg..g..gG......', '..GGgGggG.......', '....GGG.........', '.....G..........'],
  ],
  vine: [
    ['..v.......v.....', '..v.......vl....', '..vl......v.....', '..v.......v.....', '.lv.......v.....', '..v.......lv....', '..v.........v...', '..vl........v...', '...v............', '...v............', '...l............', ...blank(5)],
    ['......v.........', '......vl........', '.....lv.........', '......v.........', '......v.........', '......vl........', '.......v........', ...blank(9)],
    ['...v.....v......', '...vl....v......', '...v....lv......', '..lv.....v......', '...v.....v......', ...blank(11)],
  ],
  bonepile: [
    [...blank(11), '..o......oo.....', '.owo....owwo....', '..owwwwwwwo..oo.', '.owo..oo..o.owwo', 'owwwwwwwwwwwwwwo'],
    [...blank(12), '...oo..oo.......', '..owwoowwo......', '.owwwwwwwwo.....', 'owwwwwwwwwwo....'],
    [...blank(10), '.....ooooo......', '....owwwwwo.....', '...owkwkwwwo....', '...owwwwwwwo....', '....owowowo.....', '.....ooooo......'],
  ],
  reed: [
    [...blank(4), '...b.......b....', '...B.......B....', '...B...b...B....', '...g...B...g....', '...g...B...g....', '...g...g...g....', '..gg...g..gg....', '..g....g..g.....', '.gg...gg..g.....', '.g....g...g.....', '.g....g...g.....', 'gg...gg..gg.....'],
    [...blank(7), '......b.........', '......B.........', '......B...b.....', '......g...B.....', '.....gg...g.....', '.....g...gg.....', '....gg...g......', '....g....g......', '....g...gg......'],
    [...blank(10), '...b....b.......', '...B....B.......', '...g....g.......', '..gg...gg.......', '..g....g........', '..g....g........'],
  ],
};
export const DINO_DECOR_PAL = {
  fern: { g: '#5ac04a', G: '#2a8a3a' },
  vine: { v: '#3a8a2a', l: '#7ae05a' },
  bonepile: { o: '#6a5a40', w: '#fff8e8', k: OUT },
  reed: { g: '#6a9a3a', b: '#8a5a2a', B: '#6a4020' },
};

// ---------- the rest ----------

function pxEllipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

export function drawDinoWorld(scene, canvasTexture, rect) {
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

  sheet('dragonfly', DRAGONFLY, { w: 'rgba(200,240,255,0.8)', W: '#9fe0ff', o: OUT, b: '#3a8aff', k: '#ffffff', g: '#3ad0a0' });
  sheet('raptor', RAPTOR, { o: '#1a3a1a', g: '#7ac04a', k: OUT, w: '#ffffff', y: '#ffe066' });
  sheet('frog', FROG, { o: '#1a4a1a', g: '#5ad05a', k: OUT, w: '#ffffff', p: '#ff7eb6', y: '#ffe066' });
  sheet('beetle', BEETLE, { o: OUT, r: '#e0402a', y: '#ffd84a', k: OUT, w: '#ffe066' });
  sheet('moth', MOTH, { o: '#4a3a1a', w: '#fff0c0', y: '#ffe066', k: '#6a4a2a' });
  sheet('pet-longneck', LONGNECK, { o: '#1a4a2a', g: '#7ad07a', k: OUT, y: '#ffe066' }, 16, 16);

  // the parasaur you ride: a friendly green duck-billed dinosaur with an orange crest (2 frames, 32x24)
  one('parasaur', 64, 24, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 32;
      // tail
      for (let k = 0; k < 9; k++) rect(ctx, k < 8 ? '#5ab04a' : OUT, ox + 1 + k, 11 - Math.floor(k / 3), 1, 3);
      // body
      pxEllipse(ctx, ox + 15, 14, 9, 6, OUT);
      pxEllipse(ctx, ox + 15, 14, 8, 5, '#5ab04a');
      pxEllipse(ctx, ox + 15, 16, 6, 2, '#a8e070');
      // neck and head, with a crest swooping back
      rect(ctx, OUT, ox + 21, 4, 4, 9);
      rect(ctx, '#5ab04a', ox + 22, 5, 2, 8);
      rect(ctx, OUT, ox + 21, 2, 9, 5);
      rect(ctx, '#5ab04a', ox + 22, 3, 7, 3);
      rect(ctx, '#e0c070', ox + 27, 5, 3, 1);
      rect(ctx, OUT, ox + 24, 3, 1, 1);
      rect(ctx, '#ff8a2a', ox + 15, 0, 7, 2);
      rect(ctx, '#ff8a2a', ox + 19, 1, 4, 2);
      // spots
      for (const [x, y] of [[11, 11], [16, 10], [13, 14]]) rect(ctx, '#2a8a3a', ox + x, y, 2, 1);
      // legs (a walking step)
      const legs = f ? [[10, 18], [18, 19]] : [[11, 19], [17, 18]];
      for (const [x, y] of legs) { rect(ctx, OUT, ox + x, y, 3, 24 - y); rect(ctx, '#3a8a3a', ox + x + 1, y, 1, 23 - y); }
      tex.add(f, 0, ox, 0, 32, 24);
    }
  });

  // a dino nest: speckled eggs in a twiggy nest (0), or hatched babies waving (1)
  one('dinonest', 64, 16, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 32;
      if (f === 0) {
        for (const [x, c] of [[9, '#e8f0d0'], [16, '#f0e0c0'], [22, '#e0f0f0']]) {
          pxEllipse(ctx, ox + x, 8, 3, 4, OUT);
          pxEllipse(ctx, ox + x, 8, 2, 3, c);
          rect(ctx, '#8ac06a', ox + x - 1, 7, 1, 1);
        }
      } else {
        for (const [x, c] of [[9, '#7ac04a'], [16, '#e0a050'], [22, '#6ab0e0']]) {
          rect(ctx, OUT, ox + x - 2, 3, 5, 7);
          rect(ctx, c, ox + x - 1, 4, 3, 5);
          rect(ctx, OUT, ox + x, 5, 1, 1);
          rect(ctx, '#fff8e8', ox + x - 2, 9, 5, 2);
        }
      }
      // the nest
      rect(ctx, '#6a4020', ox + 2, 10, 28, 5);
      for (let x = 2; x < 30; x += 3) rect(ctx, '#a0703c', ox + x, 10 + (x % 2), 2, 1);
      rect(ctx, '#8a5a2a', ox + 4, 14, 24, 2);
      tex.add(f, 0, ox, 0, 32, 16);
    }
  });

  // the giant T-rex skull: jaw shut (0), jaw dropped open with teeth tumbling (1) (48x32)
  one('rexskull', 96, 32, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 48;
      const bone = '#f0e4c8';
      const shade = '#c8b890';
      // the top of the skull
      pxEllipse(ctx, ox + 22, 12, 20, 10, OUT);
      pxEllipse(ctx, ox + 22, 12, 19, 9, bone);
      rect(ctx, OUT, ox + 38, 8, 9, 10);
      rect(ctx, bone, ox + 39, 9, 7, 8);
      // the big eye hole and nose hole
      pxEllipse(ctx, ox + 17, 9, 4, 4, OUT);
      pxEllipse(ctx, ox + 36, 11, 2, 2, OUT);
      rect(ctx, shade, ox + 8, 16, 30, 2);
      // the teeth along the top jaw
      for (let x = 14; x < 45; x += 4) { rect(ctx, OUT, ox + x, 18, 3, 4); rect(ctx, '#fff8e8', ox + x, 18, 2, 3); }
      // the lower jaw: closed, or dropped open
      const dy = f ? 8 : 0;
      rect(ctx, OUT, ox + 12, 22 + dy, 34, 5);
      rect(ctx, bone, ox + 13, 23 + dy, 32, 3);
      for (let x = 16; x < 45; x += 5) { rect(ctx, OUT, ox + x, 19 + dy, 3, 4); rect(ctx, '#fff8e8', ox + x, 20 + dy, 2, 3); }
      if (f) {
        rect(ctx, '#2a1810', ox + 13, 21, 32, 7);
        rect(ctx, '#ffe066', ox + 24, 24, 3, 3);
        rect(ctx, '#ffe066', ox + 32, 23, 2, 2);
      }
      tex.add(f, 0, ox, 0, 48, 32);
    }
  });

  // the sleeping stegosaurus: curled up asleep (0), awake and shaking (1) (48x28)
  one('stego', 96, 28, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 48;
      // the plates along its back
      for (const [x, h] of [[12, 6], [18, 8], [24, 9], [30, 8], [36, 6]]) {
        for (let k = 0; k < h; k++) {
          const w = Math.max(1, Math.round((h - k) * 0.6));
          rect(ctx, k === 0 ? OUT : '#ff8a2a', ox + x - w, 12 - k, w * 2, 1);
        }
        if (!f) rect(ctx, '#3a2a5a', ox + x - 1, 9, 2, 2); // a bit of obsidian caught in the plates
      }
      // the body
      pxEllipse(ctx, ox + 24, 18, 16, 7, OUT);
      pxEllipse(ctx, ox + 24, 18, 15, 6, '#8a9a4a');
      pxEllipse(ctx, ox + 24, 21, 11, 2, '#b8c870');
      // the tail with its spikes
      rect(ctx, OUT, ox + 2, 16, 8, 4);
      rect(ctx, '#8a9a4a', ox + 3, 17, 7, 2);
      rect(ctx, '#ffe0a0', ox + 2, 13, 2, 3);
      rect(ctx, '#ffe0a0', ox + 5, 13, 2, 3);
      // the head: resting with closed eyes and a Zzz, or up and awake
      const hy = f ? 12 : 18;
      rect(ctx, OUT, ox + 38, hy, 9, 6);
      rect(ctx, '#8a9a4a', ox + 39, hy + 1, 7, 4);
      if (f) rect(ctx, OUT, ox + 43, hy + 2, 1, 1);
      else rect(ctx, OUT, ox + 42, hy + 2, 2, 1);
      if (!f) drawMap(ctx, ox + 40, 2, ['zzz.', '..z.', '.z..', 'zzz.'], { z: '#ffffff' });
      // legs
      for (const x of [14, 30]) { rect(ctx, OUT, ox + x, 23, 4, 5); rect(ctx, '#6a7a3a', ox + x + 1, 23, 2, 4); }
      tex.add(f, 0, ox, 0, 48, 28);
    }
  });

  // the Dino Heart: a big golden egg-gem with a green dino print (icon and big)
  {
    const { tex, ctx } = canvasTexture(scene, 'dinoheart-gem', 16, 16);
    drawMap(ctx, 0, 0, [
      '......oooo......',
      '....oohhhhoo....',
      '...ohwwhhhhHo...',
      '..ohwhhhhhhhHo..',
      '..ohhhgghhhhHo..',
      '.ohhhgghhghhHHo.',
      '.ohhggggghhhHHo.',
      '.ohhggggghhHHHo.',
      '.ohhhggghhhHHHo.',
      '..ohhhhhhhHHHo..',
      '..ohhhhhhHHHHo..',
      '...ohhhhHHHHo...',
      '....ooHHHHoo....',
      '......oooo......',
      '................',
      '................',
    ], { o: '#6a4a10', h: '#ffd84a', H: '#e0a020', w: '#ffffff', g: '#3ad07a' });
    tex.refresh();
    const big = canvasTexture(scene, 'dinoheart-big', 48, 48);
    big.ctx.imageSmoothingEnabled = false;
    big.ctx.drawImage(tex.getSourceImage(), 0, 0, 16, 16, 0, 0, 48, 48);
    big.tex.refresh();
  }

  // the Jetpack (Sun Suit piece 4), worn on the back (characters face right,
  // so it sits on the left), one frame per character frame
  one('suit-jetpack-worn', 64, 16, (ctx, tex) => {
    for (let f = 0; f < 4; f++) {
      const ox = f * 16;
      rect(ctx, OUT, ox + 0, 8, 4, 6);
      rect(ctx, '#e0503a', ox + 1, 9, 2, 4);
      rect(ctx, '#ff8a6a', ox + 1, 9, 1, 1);
      rect(ctx, '#c0c8d8', ox + 1, 13, 2, 1);
      rect(ctx, '#ffd84a', ox + 3, 10, 1, 2);
      tex.add(f, 0, ox, 0, 16, 16);
    }
  });

  // icons: riding a dino, flying with the Jetpack, Dino Camp, the flag, the volcano
  one('icon-ride', 16, 16, (ctx) => {
    drawMap(ctx, 0, 4, [
      '........oooo....',
      '.......ogggo....',
      '...oo..oggkgo...',
      '..owwo.oggggoo..',
      '..oyyo.oggo.....',
      'ooooooooggo.....',
      'oggggggggo......',
      '.oggggggo.......',
      '..og..og........',
      '..oo..oo........',
    ], { o: OUT, g: '#5ab04a', k: OUT, w: '#f2c29b', y: '#4aa3ff' });
  });
  one('icon-jetfly', 14, 16, (ctx) => {
    rect(ctx, OUT, 4, 1, 6, 9);
    rect(ctx, '#e0503a', 5, 2, 4, 7);
    rect(ctx, '#ff8a6a', 5, 2, 1, 2);
    rect(ctx, '#c0c8d8', 5, 9, 4, 1);
    rect(ctx, '#ffb34a', 5, 10, 4, 2);
    rect(ctx, '#ffe066', 6, 12, 2, 3);
    rect(ctx, '#ff6a2a', 4, 11, 1, 2);
    rect(ctx, '#ff6a2a', 9, 11, 1, 2);
  });
  one('icon-dinobase', 14, 12, (ctx) => {
    rect(ctx, '#6a4020', 6, 3, 2, 9);
    rect(ctx, '#3a9a3a', 0, 0, 14, 4);
    rect(ctx, '#5ac04a', 2, 1, 10, 2);
    rect(ctx, '#a0703c', 3, 5, 8, 4);
    rect(ctx, '#2a1810', 6, 6, 2, 3);
    rect(ctx, '#5ab04a', 0, 11, 14, 1);
  });
  one('dino-flag', 16, 24, (ctx) => {
    rect(ctx, '#d4dce6', 2, 1, 2, 21);
    rect(ctx, '#8a94a8', 3, 1, 1, 21);
    rect(ctx, OUT, 4, 1, 12, 9);
    rect(ctx, '#ff7eb6', 4, 2, 11, 7);
    rect(ctx, '#ffd1e6', 4, 2, 11, 1);
    rect(ctx, '#ffe066', 9, 3, 1, 5);
    rect(ctx, '#ffe066', 7, 5, 5, 1);
    rect(ctx, '#ffe066', 8, 4, 3, 3);
    pxEllipse(ctx, 3, 23, 5, 2, '#5ab04a');
  });
  one('dino-volcano', 16, 16, (ctx) => {
    for (let k = 0; k < 10; k++) rect(ctx, k ? '#6a4a3a' : OUT, 7 - k, 5 + k, 2 + k * 2, 1);
    rect(ctx, '#ff6a2a', 6, 5, 4, 2);
    rect(ctx, '#ffd23f', 7, 5, 2, 1);
    rect(ctx, '#ff6a2a', 7, 7, 1, 3);
    for (const [x, y, r] of [[8, 3, 2], [6, 1, 2], [10, 0, 1]]) pxEllipse(ctx, x, y, r, r, '#b0a8a0');
  });
}

// Five more badges (Dino Planet layers) onto the right of the badge strip.
export function drawDinoBadges(ctx, rect, ring) {
  // the jungle: a fern
  ring(304, '#5ab04a', '#1e4a1e');
  drawMap(ctx, 304 + 4, 3, ['...g....', '..gG.g..', 'g.gG.gG.', 'Gg.GgG..', '.GGgG...', '..GG....', '...G....'], { g: '#aaffa0', G: '#3ad07a' });
  // the bone beds: a bone
  ring(320, '#e8dcc0', '#8a7a58');
  drawMap(ctx, 320 + 3, 4, ['.o......o.', 'owo....owo', '.owwwwwwo.', 'owo....owo', '.o......o.'], { o: '#6a5a40', w: '#ffffff' });
  // the swamp: a tooth
  ring(336, '#6a8a3a', '#2a3a1a');
  drawMap(ctx, 336 + 5, 3, ['oooooo', 'owwwwo', '.owwo.', '.owwo.', '..oo..', '..o...'], { o: OUT, w: '#fff4d8' });
  // the lava lands: obsidian
  ring(352, '#c83a1a', '#4a1010');
  drawMap(ctx, 352 + 5, 3, ['..oo..', '.owpo.', 'opppko', 'oppkko', '.okko.', '..oo..'], { o: '#0e0816', p: '#5a4a8a', w: '#ffffff', k: '#2a1e40' });
  // the dino core: the golden egg-heart
  ring(368, '#ffd84a', '#8a6a10');
  drawMap(ctx, 368 + 4, 2, ['..oooo..', '.ohhhho.', 'ohwhghho', 'ohggghHo', 'ohhghhHo', '.ohhhHo.', '..oooo..'], { o: '#6a4a10', h: '#ffe066', H: '#e0a020', w: '#ffffff', g: '#3ad07a' });
}
