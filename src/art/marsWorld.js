// Art for the five-layer Mars: its rocks and ores (tiles), back walls, ore
// icons, creatures (dust bunnies, scrap crabs, lava newts, Martians, embers),
// decorations, old rovers, the Mars Heart, the Boots, the Rover Bot, the Mars
// badges and a few icons.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';
const T = 16;
const fit = (rows, w = 16) => rows.map((r) => (r + '.'.repeat(w)).slice(0, w));

export const MARS_HOSTS = {
  sand: { base: '#c8583a', dark: '#a8442a', light: '#e07a4a' },
  rust: { base: '#7a4a32', dark: '#5e3624', light: '#a06a44' },
  basalt: { base: '#3a3036', dark: '#2a2228', light: '#4e4248' },
  ruin: { base: '#d0a060', dark: '#a87a40', light: '#f0c880' },
  core: { base: '#a8321a', dark: '#8a2412', light: '#e05a2a' },
};

// ---------- tiles ----------

export function drawMarsTiles(ctx, at, rng, B, rect, speckle) {
  // red sandstone: speckled with soft wind-blown bands
  const sand = (id) => {
    speckle(ctx, at(id), rng, MARS_HOSTS.sand, 5);
    rect(ctx, '#b84e32', at(id), 5, T, 1);
    rect(ctx, '#e8845a', at(id), 6, T, 1);
    rect(ctx, '#b84e32', at(id) + 3, 12, 10, 1);
  };
  sand(B.MARS_ROCK);
  // rubies: three chunky red gems in the sandstone
  sand(B.RUBY);
  for (const [x, y] of [[2, 1], [9, 5], [3, 10]]) {
    const ox = at(B.RUBY) + x;
    rect(ctx, '#5a0a1a', ox, y, 5, 5);
    rect(ctx, '#e0204a', ox + 1, y, 3, 5);
    rect(ctx, '#e0204a', ox, y + 1, 5, 3);
    rect(ctx, '#ff8aa0', ox + 1, y + 1, 1, 1);
    rect(ctx, '#a0102e', ox + 3, y + 3, 1, 1);
  }

  // rusty rock: brown with orange rust streaks and an old bolt head
  const rust = (id) => {
    speckle(ctx, at(id), rng, MARS_HOSTS.rust, 5);
    rect(ctx, '#c86a2a', at(id) + 2, 3, 1, 5);
    rect(ctx, '#c86a2a', at(id) + 11, 8, 1, 6);
    rect(ctx, '#e08a3a', at(id) + 11, 8, 1, 1);
  };
  rust(B.RUST_ROCK);
  rect(ctx, '#5a5a6a', at(B.RUST_ROCK) + 6, 10, 3, 3);
  rect(ctx, '#9aa0b0', at(B.RUST_ROCK) + 6, 10, 2, 1);
  // bolts: two shiny hex bolts stuck in the rock
  rust(B.BOLT);
  for (const [x, y] of [[1, 2], [8, 8]]) {
    const ox = at(B.BOLT) + x;
    rect(ctx, OUT, ox + 1, y, 5, 6);
    rect(ctx, OUT, ox, y + 1, 7, 4);
    rect(ctx, '#c0c8d8', ox + 1, y + 1, 5, 4);
    rect(ctx, '#e8ecf4', ox + 1, y + 1, 5, 1);
    rect(ctx, '#6a7488', ox + 3, y + 2, 1, 2);
  }

  // basalt: dark volcanic rock with a warm crack
  const basalt = (id) => {
    speckle(ctx, at(id), rng, MARS_HOSTS.basalt, 5);
    rect(ctx, '#6a2a1a', at(id) + 4, 12, 4, 1);
    rect(ctx, '#ff6a2a', at(id) + 5, 12, 1, 1);
  };
  basalt(B.BASALT);
  // fire opals: orange stones with teal flecks
  basalt(B.OPAL);
  for (const [x, y] of [[2, 2], [9, 4], [5, 9]]) {
    const ox = at(B.OPAL) + x;
    rect(ctx, '#5a1a0a', ox, y + 1, 5, 3);
    rect(ctx, '#5a1a0a', ox + 1, y, 3, 5);
    rect(ctx, '#ff8a2a', ox + 1, y + 1, 3, 3);
    rect(ctx, '#5ae0d0', ox + 2, y + 2, 1, 1);
    rect(ctx, '#ffe0a0', ox + 1, y + 1, 1, 1);
  }

  // carved sandstone: big ruin blocks with mortar lines and a little glyph
  const ruin = (id) => {
    const ox = at(id);
    rect(ctx, MARS_HOSTS.ruin.base, ox, 0, T, T);
    rect(ctx, MARS_HOSTS.ruin.light, ox, 0, T, 1);
    rect(ctx, MARS_HOSTS.ruin.dark, ox, 7, T, 1);
    rect(ctx, MARS_HOSTS.ruin.dark, ox, 15, T, 1);
    rect(ctx, MARS_HOSTS.ruin.dark, ox + 6, 0, 1, 7);
    rect(ctx, MARS_HOSTS.ruin.dark, ox + 12, 8, 1, 7);
    rect(ctx, MARS_HOSTS.ruin.light, ox, 8, T, 1);
  };
  ruin(B.RUIN_STONE);
  rect(ctx, '#a87a40', at(B.RUIN_STONE) + 2, 10, 3, 1);
  rect(ctx, '#a87a40', at(B.RUIN_STONE) + 3, 11, 1, 2);
  // Mars coins: two gold coins with a little red planet stamped on
  ruin(B.COIN);
  for (const [x, y] of [[1, 1], [8, 8]]) {
    const ox = at(B.COIN) + x;
    rect(ctx, '#7a5010', ox + 1, y, 5, 7);
    rect(ctx, '#7a5010', ox, y + 1, 7, 5);
    rect(ctx, '#ffd84a', ox + 1, y + 1, 5, 5);
    rect(ctx, '#fff2a0', ox + 1, y + 1, 2, 1);
    rect(ctx, '#e0703a', ox + 3, y + 3, 2, 2);
  }

  // the Mars core: glowing red rock with bright cracks
  const core = (id) => {
    speckle(ctx, at(id), rng, MARS_HOSTS.core, 6);
    rect(ctx, '#ffb04a', at(id) + 2, 4, 4, 1);
    rect(ctx, '#ffb04a', at(id) + 5, 5, 1, 3);
    rect(ctx, '#ffe066', at(id) + 5, 5, 1, 1);
    rect(ctx, '#ff8a2a', at(id) + 9, 11, 5, 1);
  };
  core(B.MARS_CORE);
  // the Mars Heart's cells: core rock with deep red veins
  core(B.MARS_HEART);
  rect(ctx, '#ff2a4a', at(B.MARS_HEART) + 2, 9, 6, 1);
  rect(ctx, '#ff2a4a', at(B.MARS_HEART) + 11, 2, 1, 6);

  // steam geyser: a little volcanic vent with a hot glow in its mouth
  {
    const ox = at(B.GEYSER);
    rect(ctx, OUT, ox + 2, 11, 12, 5);
    rect(ctx, OUT, ox + 4, 9, 8, 2);
    rect(ctx, '#4e4248', ox + 3, 12, 10, 4);
    rect(ctx, '#6a5a60', ox + 5, 10, 6, 2);
    rect(ctx, '#1a1014', ox + 6, 10, 4, 2);
    rect(ctx, '#ff8a2a', ox + 7, 11, 2, 1);
    rect(ctx, 'rgba(255,255,255,0.35)', ox + 7, 4, 2, 5);
    rect(ctx, 'rgba(255,255,255,0.2)', ox + 6, 1, 2, 3);
  }

  // vault wall: dark ancient stone framed in gold (no drill can dig it)
  const vault = (id) => {
    const ox = at(id);
    rect(ctx, '#2e3a4a', ox, 0, T, T);
    rect(ctx, '#c89a30', ox, 0, T, 1);
    rect(ctx, '#c89a30', ox, T - 1, T, 1);
    rect(ctx, '#c89a30', ox, 0, 1, T);
    rect(ctx, '#c89a30', ox + T - 1, 0, 1, T);
    rect(ctx, '#3e4e62', ox + 2, 2, 12, 12);
  };
  vault(B.VAULT);
  rect(ctx, '#ffd84a', at(B.VAULT) + 7, 5, 2, 6);
  rect(ctx, '#ffd84a', at(B.VAULT) + 5, 7, 6, 2);
  // the vault door: stone with a glowing glyph ring and a seam down the middle
  vault(B.VAULT_DOOR);
  {
    const ox = at(B.VAULT_DOOR);
    rect(ctx, '#243040', ox + 7, 1, 2, 14);
    rect(ctx, '#5af0ff', ox + 4, 5, 8, 1);
    rect(ctx, '#5af0ff', ox + 4, 10, 8, 1);
    rect(ctx, '#5af0ff', ox + 4, 5, 1, 6);
    rect(ctx, '#5af0ff', ox + 11, 5, 1, 6);
    rect(ctx, '#e0ffff', ox + 7, 7, 2, 2);
  }
  // the glyph button: a stone slab with a glowing Martian glyph
  {
    const ox = at(B.GLYPH);
    rect(ctx, OUT, ox + 1, 11, 14, 5);
    rect(ctx, '#a87a40', ox + 2, 12, 12, 4);
    rect(ctx, '#f0c880', ox + 2, 12, 12, 1);
    rect(ctx, '#1a6a7a', ox + 4, 9, 8, 3);
    rect(ctx, '#5af0ff', ox + 5, 9, 6, 2);
    rect(ctx, '#e0ffff', ox + 7, 9, 2, 1);
    rect(ctx, 'rgba(90,240,255,0.35)', ox + 5, 5, 6, 4);
  }
}

// Back walls for the Mars layers.
export function drawMarsBacks(ctx, rect, back, BACK) {
  back(BACK.dunes, { base: '#5a2a1e', dark: '#4a2016', light: '#6a3424' });
  rect(ctx, '#4a2016', BACK.dunes * T, 6, T, 1);
  back(BACK.rovers, { base: '#3a261c', dark: '#2e1c14', light: '#462e22' });
  rect(ctx, '#5a3a2a', BACK.rovers * T + 3, 4, 1, 4);
  back(BACK.volcano, { base: '#1e1418', dark: '#160e12', light: '#281c20' });
  rect(ctx, '#6a2a1a', BACK.volcano * T + 9, 10, 1, 1);
  rect(ctx, '#6a2a1a', BACK.volcano * T + 3, 4, 1, 1);
  back(BACK.ruins, { base: '#4a3420', dark: '#3e2a18', light: '#56402a' });
  rect(ctx, '#3a2614', BACK.ruins * T, 7, T, 1);
  rect(ctx, '#3a2614', BACK.ruins * T + 8, 0, 1, 7);
  rect(ctx, '#3a2614', BACK.ruins * T + 3, 8, 1, 8);
  back(BACK.marscore, { base: '#3a120c', dark: '#2e0c08', light: '#461a10' });
  rect(ctx, '#8a2a12', BACK.marscore * T + 5, 6, 3, 1);
}

// ---------- ore icons (10x10) ----------

export function drawMarsOreIcon(ctx, rect, ore) {
  if (ore === 'ruby') {
    // a red faceted gem
    drawMap(ctx, 0, 0, [
      '..oooooo..',
      '.orrhrrro.',
      'orrhhrrrRo',
      'orrrrrrRRo',
      '.orrrrrRo.',
      '..orrrRo..',
      '...orRo...',
      '....oo....',
    ], { o: '#5a0a1a', r: '#e0204a', R: '#a0102e', h: '#ff8aa0' });
    return true;
  }
  if (ore === 'bolt') {
    // a silver hex bolt
    rect(ctx, OUT, 2, 1, 6, 4);
    rect(ctx, OUT, 1, 2, 8, 2);
    rect(ctx, '#c0c8d8', 2, 2, 6, 2);
    rect(ctx, '#e8ecf4', 2, 2, 6, 1);
    rect(ctx, OUT, 3, 5, 4, 5);
    rect(ctx, '#9aa0b0', 4, 5, 2, 4);
    rect(ctx, '#e8ecf4', 4, 6, 1, 1);
    rect(ctx, '#e8ecf4', 4, 8, 1, 1);
    return true;
  }
  if (ore === 'opal') {
    // an orange fire opal with teal flecks
    drawMap(ctx, 0, 0, [
      '..oooooo..',
      '.ooyyooo..',
      'ooyooootoo',
      'oooooooooo',
      'ootoooooro',
      'ooooootooo',
      '.oooooooo.',
      '..oooooo..',
    ], { o: '#ff8a2a', y: '#ff8a2a', t: '#ff8a2a', r: '#ff8a2a' });
    rect(ctx, '#5a1a0a', 2, 0, 6, 1);
    rect(ctx, '#5a1a0a', 0, 2, 1, 4);
    rect(ctx, '#5a1a0a', 9, 2, 1, 4);
    rect(ctx, '#5a1a0a', 2, 7, 6, 1);
    rect(ctx, '#ffe0a0', 3, 1, 2, 1);
    rect(ctx, '#5ae0d0', 6, 2, 1, 1);
    rect(ctx, '#5ae0d0', 2, 4, 1, 1);
    rect(ctx, '#5ae0d0', 6, 5, 1, 1);
    rect(ctx, '#e04a1a', 8, 4, 1, 1);
    return true;
  }
  if (ore === 'coin') {
    // a gold coin with a little red planet on it
    drawMap(ctx, 0, 0, [
      '..oooooo..',
      '.oyyyyyyo.',
      'oyYyyyyyyo',
      'oyyyrryyyo',
      'oyyrrrryyo',
      'oyyyrryyyo',
      'oyyyyyyYyo',
      '.oyyyyyYo.',
      '..oooooo..',
    ], { o: '#7a5010', y: '#ffd84a', Y: '#fff2a0', r: '#e0703a' });
    return true;
  }
  return false;
}

// ---------- creatures (16x12, 2 frames) ----------

// a dust bunny: a fluffy red ball with long ears
const BUNNY_0 = fit([
  '....oo...oo',
  '...oRro.oRro',
  '...oRro.oRro',
  '....oro.oro',
  '...oorrrrroo',
  '..orRRrrrrrro',
  '..oRrkkrrkkro',
  '..orrkwrrkwro',
  '..orrrrpprrro',
  '..ofrrrrrrrfo',
  '...ofrfrrfrfo',
  '....ooooooooo',
]);
const BUNNY = [BUNNY_0, fit(['', ...BUNNY_0.slice(0, 1), ...BUNNY_0.slice(2)])];

// a scrap crab: a little metal crab with eyes on stalks
const CRAB_TOP = [
  '....r.....r',
  '....o.....o',
  '.oo.o.....o.oo',
  'osso.ooooo.osso',
  '.osooossssooso',
  '..osssssssssso',
  '..osSysSSsySSo',
  '...osssssssso',
];
const CRAB = [
  fit([...CRAB_TOP, '..o.o.o..o.o.o', '.o..o.o..o.o..o', '', '']),
  fit([...CRAB_TOP, '...o.o.o.o.o.o', '...o.o.o.o.o.o', '', '']),
];

// a lava newt: an orange lizard with glowing spots
const NEWT_TOP = [
  '',
  '',
  '',
  '..........oooo',
  '.........onnkwo',
  '.oo.....onnnnnno',
  'onNoooooonnnnoo',
  '.onnnNnnNnnnno',
  '..onnnnnnnnno',
];
const NEWT = [
  fit([...NEWT_TOP, '...o.o....o.o', '..o...o..o...o', '']),
  fit([...NEWT_TOP, '....oo....oo', '....oo....oo', '']),
];

// a little Martian on a hover disc
const MARTIAN_TOP = [
  '....y.....y',
  '.....o...o',
  '.....ooooo',
  '....ogggggo',
  '...ogwkgwkgo',
  '...oggggggo',
  '....oGgggGo',
  '.....ooooo',
  '..oddddddddo',
  '.oDyDDyDDyDDo',
  '..oooooooooo',
];
const MARTIAN = [
  fit([...MARTIAN_TOP, '....b....b']),
  fit([...MARTIAN_TOP.map((r, i) => (i === 0 ? '....a.....a' : r)), '...b......b']),
];

// an ember: a little flickering flame with a face
const EMBER = [
  fit([
    '.......r', '......rr', '.....rorr', '....rooor.r', '...rooyoorr', '...royyyoor',
    '..rooyyyyoor', '..roykyykyor', '..royyyyyyor', '...royywyor', '....roooor', '.....rrrr',
  ]),
  fit([
    '........r', '.......rr', '.....rrorr', '....rooor', '...rrooyoor', '...royyyoor',
    '..rooyyyyoor', '..roykyykyor', '..royyyyyyor', '...royywyor', '....roooor', '.....rrrr',
  ]),
];

// ---------- decorations (16x16, 3 variants) ----------

const blank = (n) => Array(n).fill('................');
export const MARS_DECOR = {
  dunegrass: [
    [...blank(11), '...d.....d......', '..dD.d..dD..d...', '..dDdD..dDddD...', '.ddDdD.ddDdDd...', 'ddddddddddddddd.'],
    [...blank(12), '.......d........', '......dDd..d....', '..d..ddDd.dD....', '.dDddddDdddDd...'],
    [...blank(13), '.d......d.......', 'dDd....dDd......', 'dddd..ddddd.....'],
  ],
  scrap: [
    [...blank(11), '.....kk.........', '....kssk..k.....', '...kssssk.kk....', '..kkssSsskkssk..', '.kkkkkkkkkkkkkk.'],
    [...blank(12), '..k.......k.....', '..sk.....kss....', '..ssk...kssSk...', '.kkkkkkkkkkkkk..'],
    [...blank(10), '.........r......', '........kk......', '.......kssk.....', '......ksSssk....', '.....kkssssk....', '....kkkkkkkkk...'],
  ],
  gear: [
    [...blank(8), '......y.y.......', '....yyyyyyy.....', '....yyooyyy.....', '...yyo..oyyy....', '....yyooyyy.....', '....yyyyyyy.....', '......y.y.......', '................'],
    [...blank(10), '.........s.s....', '........sssss...', '.......ssoossS..', '........sssss...', '.........s.s....', '................'],
    [...blank(11), '...y.y...s.s....', '..yyyyy.sssss...', '..yyoyy.ssoss...', '..yyyyy.sssss...', '...y.y...s.s....'],
  ],
  urn: [
    [...blank(8), '......oooo......', '.....oyyyyo.....', '......oyyo......', '.....oyyyyo.....', '....oyrrrryo....', '....oyyyyyyo....', '.....oyyyyo.....', '......oooo......'],
    [...blank(10), '.....oooooo.....', '....oyrryyyo....', '....oyyyyyyo....', '.....oyyyyo.....', '......oooo......', '................'],
    [...blank(11), '..oo............', '.oyyo...........', '.oyryo..........', '.oyyyo..........', '..ooo...........'],
  ],
  glyphstone: [
    [...blank(7), '.....oooooo.....', '....ossssss.....', '....osccsso.....', '....ossscso.....', '....osccsso.....', '....ossssso.....', '....ossssso.....', '....ossssso.....', '....oooooooo....'],
    [...blank(10), '......oooo......', '.....ossccso....', '.....oscsso.....', '.....ossccso....', '.....osssso.....', '.....oooooo.....'],
    [...blank(11), '..ooooo.........', '..osccso........', '..oscsso........', '..osssso........', '..oooooo........'],
  ],
};
export const MARS_DECOR_PAL = {
  dunegrass: { d: '#8a3a2a', D: '#c8683a' },
  scrap: { k: '#3a3a4a', s: '#8a94a8', S: '#c0c8d8', r: '#e0503a' },
  gear: { y: '#c89a30', o: '#5a4010', s: '#8a94a8', S: '#c0c8d8' },
  urn: { o: '#6a3a1a', y: '#d8904a', r: '#5ae0d0' },
  glyphstone: { o: '#6a4a20', s: '#c89858', c: '#5af0ff' },
};
export const MARS_GLOWING = { glyphstone: 0x5af0ff };

// ---------- the rest ----------

function pxEllipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

export function drawMarsWorld(scene, canvasTexture, rect) {
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

  sheet('dustbunny', BUNNY, { o: '#6a2a1a', r: '#e0784a', R: '#ffb080', k: OUT, w: '#ffffff', p: '#ff7eb6', f: '#f0a070' });
  sheet('crab', CRAB, { o: OUT, s: '#c0c8d8', S: '#8a94a8', r: '#ff4a4a', y: '#ffd84a' });
  sheet('newt', NEWT, { o: '#5a1a0a', n: '#ff7a2a', N: '#ffe066', k: OUT, w: '#ffffff' });
  sheet('martian', MARTIAN, { g: '#6ae07a', G: '#3a9a4a', o: '#1a3a1a', k: OUT, w: '#ffffff', d: '#c0c8d8', D: '#8a94a8', y: '#ffe066', a: '#ff7eb6', b: '#9ff6ff' });
  sheet('ember', EMBER, { r: '#ff4a1a', o: '#ff9a2a', y: '#ffe066', w: '#ffffff', k: OUT });

  // an old rover, half buried: shut and dusty (0), or popped open with its lights on (1)
  one('oldrover', 96, 24, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 48;
      const lit = f === 1;
      // solar panel wings
      rect(ctx, OUT, ox + 2, 9, 44, 4);
      rect(ctx, lit ? '#4a6ad0' : '#3a4060', ox + 3, 10, 42, 2);
      for (let x = 6; x < 44; x += 5) rect(ctx, lit ? '#8ab0ff' : '#50587a', ox + x, 10, 1, 2);
      // the body
      rect(ctx, OUT, ox + 12, 8, 24, 10);
      rect(ctx, lit ? '#e0904a' : '#b06a3a', ox + 13, 9, 22, 8);
      rect(ctx, lit ? '#ffc080' : '#c8845a', ox + 13, 9, 22, 1);
      rect(ctx, '#7a4428', ox + 13, 16, 22, 1);
      if (lit) {
        // the lid popped up, bolts glinting inside
        rect(ctx, OUT, ox + 14, 3, 20, 6);
        rect(ctx, '#e0904a', ox + 15, 4, 18, 4);
        rect(ctx, '#2a2a3a', ox + 15, 8, 18, 2);
        for (const x of [17, 21, 25, 29]) rect(ctx, '#e8ecf4', ox + x, 8, 2, 1);
        rect(ctx, '#3aff7a', ox + 16, 12, 2, 1);
        rect(ctx, '#ffe066', ox + 20, 12, 2, 1);
      } else {
        rect(ctx, '#5a3a2a', ox + 16, 12, 2, 1);
        rect(ctx, '#5a3a2a', ox + 20, 12, 2, 1);
      }
      // the camera mast: bent over when asleep, standing tall when awake
      if (lit) {
        rect(ctx, OUT, ox + 30, 0, 2, 9);
        rect(ctx, OUT, ox + 28, 0, 6, 3);
        rect(ctx, '#6ad0ff', ox + 29, 1, 4, 1);
      } else {
        rect(ctx, OUT, ox + 31, 4, 2, 5);
        rect(ctx, OUT, ox + 32, 3, 6, 3);
        rect(ctx, '#3a4a5a', ox + 33, 4, 4, 1);
      }
      // six wheels
      for (const x of [11, 19, 27, 35]) {
        rect(ctx, OUT, ox + x, 17, 5, 5);
        rect(ctx, '#55505e', ox + x + 1, 18, 3, 3);
        rect(ctx, '#8a94a8', ox + x + 2, 19, 1, 1);
      }
      // red dust piled against it
      rect(ctx, '#c8583a', ox + 4, 21, 40, 3);
      rect(ctx, '#e07a4a', ox + 6, 21, 8, 1);
      rect(ctx, '#e07a4a', ox + 30, 21, 10, 1);
      if (!lit) rect(ctx, '#c8583a', ox + 12, 14, 6, 4);
      tex.add(f, 0, ox, 0, 48, 24);
    }
  });

  // the Mars Heart: a big red crystal heart (icon and big)
  {
    const { tex, ctx } = canvasTexture(scene, 'marsheart-gem', 16, 16);
    drawMap(ctx, 0, 0, [
      '................',
      '..oooo....oooo..',
      '.ohhhho..ohhhho.',
      'ohwwhhhooohhhhHo',
      'ohwhhhhhhhhhhHHo',
      'ohhhhhhhhhhhhHHo',
      'ohhhhhhhhhhhHHHo',
      '.ohhhhhhhhhHHHo.',
      '..ohhhhhhhHHHo..',
      '...ohhhhhHHHo...',
      '....ohhhHHHo....',
      '.....ohHHHo.....',
      '......oHHo......',
      '.......oo.......',
      '................',
      '................',
    ], { o: '#4a0a14', h: '#ff4a5a', H: '#c8203a', w: '#ffffff' });
    tex.refresh();
    const big = canvasTexture(scene, 'marsheart-big', 48, 48);
    big.ctx.imageSmoothingEnabled = false;
    big.ctx.drawImage(tex.getSourceImage(), 0, 0, 16, 16, 0, 0, 48, 48);
    big.tex.refresh();
  }

  // the Boots (Sun Suit piece 2), worn: red rocket boots over each leg, one
  // frame per character frame (idle, step A, step B, climb)
  one('suit-boots-worn', 64, 16, (ctx, tex) => {
    const LEGS = [[[5, 14, 2], [9, 14, 2]], [[4, 14, 2], [10, 14, 1]], [[5, 14, 1], [9, 14, 2]], [[5, 14, 2], [9, 14, 2]]];
    LEGS.forEach((legs, f) => {
      const ox = f * 16;
      for (const [x, , h] of legs) {
        const y = h === 1 ? 12 : 13;
        rect(ctx, OUT, ox + x - 1, y - 1, 5, 4);
        rect(ctx, '#e0503a', ox + x, y, 3, 2);
        rect(ctx, '#ff8a6a', ox + x, y, 1, 1);
        rect(ctx, '#ffd84a', ox + x, y + 2, 3, 1);
      }
      tex.add(f, 0, ox, 0, 16, 16);
    });
  });

  // the Rover Bot: a tiny robot rover pulling a trailer. Six frames: three
  // loads in the trailer (empty, some, heaped) × two wheel turns.
  one('pet-rover', 24 * 6, 12, (ctx, tex) => {
    for (let load = 0; load < 3; load++) {
      for (let anim = 0; anim < 2; anim++) {
        const f = load * 2 + anim;
        const ox = f * 24;
        // trailer (behind, on the left)
        rect(ctx, OUT, ox + 1, 5, 9, 5);
        rect(ctx, '#8a94a8', ox + 2, 6, 7, 3);
        rect(ctx, '#c0c8d8', ox + 2, 6, 7, 1);
        rect(ctx, OUT, ox + 9, 8, 3, 1);
        if (load >= 1) {
          rect(ctx, '#e0204a', ox + 3, 4, 2, 2);
          rect(ctx, '#ffd84a', ox + 5, 4, 2, 2);
          rect(ctx, '#ff8a2a', ox + 6, 5, 2, 1);
        }
        if (load >= 2) {
          rect(ctx, '#c0c8d8', ox + 4, 2, 2, 2);
          rect(ctx, '#ff8a2a', ox + 3, 3, 1, 1);
          rect(ctx, '#e0204a', ox + 6, 3, 2, 1);
          rect(ctx, '#ffd84a', ox + 2, 4, 1, 1);
          rect(ctx, '#ffd84a', ox + 8, 4, 1, 1);
        }
        // the rover: antenna, round head with a screen face, red body
        rect(ctx, OUT, ox + 17, 0, 1, 3);
        rect(ctx, anim ? '#ffe066' : '#ff5a5a', ox + 17, 0, 1, 1);
        rect(ctx, OUT, ox + 14, 2, 8, 5);
        rect(ctx, '#d0d8e4', ox + 15, 3, 6, 3);
        rect(ctx, '#2a3a5a', ox + 17, 3, 4, 2);
        rect(ctx, '#6ad0ff', ox + 18, 3, 1, 1);
        rect(ctx, '#6ad0ff', ox + 20, 3, 1, 1);
        rect(ctx, OUT, ox + 11, 6, 12, 4);
        rect(ctx, '#e0503a', ox + 12, 7, 10, 2);
        rect(ctx, '#ff8a6a', ox + 12, 7, 10, 1);
        // wheels (the hub turns)
        for (const x of [2, 6, 12, 16, 20]) {
          rect(ctx, OUT, ox + x, 9, 3, 3);
          rect(ctx, anim ? '#c0c8d8' : '#55505e', ox + x + 1, 10, 1, 1);
        }
        tex.add(f, 0, ox, 0, 24, 12);
      }
    }
  });

  // Mars badges are drawn onto the badge strip (see drawMarsBadges)

  // icons: a windsock (the storm warning), Mars Base, the flag on Mars, the two moons
  one('icon-windsock', 14, 14, (ctx) => {
    rect(ctx, OUT, 1, 1, 2, 13);
    rect(ctx, '#c0c8d8', 1, 1, 1, 13);
    drawMap(ctx, 3, 2, ['oooo.......', 'oWWRRWWRRo.', 'oWWRRWWRRWo', 'oWWRRWWRRo.', 'oooooooo...'], { o: OUT, W: '#ffffff', R: '#ff6a2a' });
  });
  one('icon-marsbase', 14, 12, (ctx) => {
    ctx.fillStyle = 'rgba(160,255,190,0.55)';
    ctx.beginPath(); ctx.arc(7, 9, 6, Math.PI, 0); ctx.fill();
    rect(ctx, '#3a9a4a', 4, 6, 2, 3);
    rect(ctx, '#6ae07a', 8, 5, 2, 4);
    rect(ctx, '#c8583a', 0, 9, 14, 3);
    rect(ctx, '#a8442a', 0, 11, 14, 1);
    rect(ctx, '#c0c8d8', 12, 1, 1, 8);
    rect(ctx, '#ff6a2a', 11, 1, 3, 2);
  });
  one('mars-flag', 16, 24, (ctx) => {
    rect(ctx, '#d4dce6', 2, 1, 2, 21);
    rect(ctx, '#8a94a8', 3, 1, 1, 21);
    rect(ctx, OUT, 4, 1, 12, 9);
    rect(ctx, '#ff7eb6', 4, 2, 11, 7);
    rect(ctx, '#ffd1e6', 4, 2, 11, 1);
    rect(ctx, '#ffe066', 9, 3, 1, 5);
    rect(ctx, '#ffe066', 7, 5, 5, 1);
    rect(ctx, '#ffe066', 8, 4, 3, 3);
    pxEllipse(ctx, 3, 23, 5, 2, '#c8583a');
  });
  one('mars-moons', 16, 16, (ctx) => {
    pxEllipse(ctx, 8, 8, 8, 8, '#e8a08a');
    pxEllipse(ctx, 5, 6, 3, 2, '#9a8a80');
    rect(ctx, '#bcae9e', 4, 5, 2, 1);
    pxEllipse(ctx, 11, 11, 2, 2, '#8a7a70');
    rect(ctx, '#bcae9e', 10, 10, 1, 1);
  });
}

// Five more badges (Mars layers) onto the right of the badge strip.
export function drawMarsBadges(ctx, rect, ring) {
  // the dunes: a ruby
  ring(144, '#e0703a', '#8a3a1a');
  drawMap(ctx, 144 + 4, 4, ['.oooooo.', 'orrhrrro', 'orhhrrRo', '.orrrRo.', '..orRo..', '...oo...'], { o: '#5a0a1a', r: '#e0204a', R: '#a0102e', h: '#ff8aa0' });
  // the rover graveyard: a bolt
  ring(160, '#a86a4a', '#5a3424');
  drawMap(ctx, 160 + 5, 3, ['.oooo.', 'osssso', 'oSSSSo', '.oooo.', '..os..', '..os..', '..os..', '..oo..'], { o: OUT, s: '#e8ecf4', S: '#c0c8d8' });
  // the volcano caves: a little volcano
  ring(176, '#ff8a2a', '#4a3a3a');
  drawMap(ctx, 176 + 3, 4, ['...yry....', '....r.....', '...orro...', '..obbbbo..', '.obbbbbbo.', 'obbbbbbbbo'], { o: OUT, b: '#6a5a60', r: '#ff6a2a', y: '#ffe066' });
  // the Martian city: a glowing glyph
  ring(192, '#e0b060', '#8a6a30');
  drawMap(ctx, 192 + 4, 3, ['..cccc..', '.c....c.', 'c..cc..c', 'c.c..c.c', 'c..cc..c', '.c....c.', '..cccc..'], { c: '#5af0ff' });
  // the Mars core: the red heart
  ring(208, '#ff5a2a', '#8a1a0a');
  drawMap(ctx, 208 + 3, 4, ['.oo..oo..', 'ohhoohhHo', 'ohhhhhHHo', '.ohhhHHo.', '..ohHHo..', '...oHo...', '....o....'], { o: '#4a0a14', h: '#ff4a5a', H: '#c8203a' });
}
