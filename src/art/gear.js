// Gear art: what the characters wear (hats on a 16x24 canvas whose bottom 16
// rows line up with the character; backs, feet and hands as strips of four
// frames, one per character frame: idle, step A, step B, climb), a picture
// for every power (16x16, for the shop cards and the Gear page), the slot
// icons and the coat hanger for the pause menu.
//
// Characters face right, so the back is on the left and the face on the right.
// Their head fills x 2-13, y 2-10; arms hang at x 3 and 12 (y 11-12), or go up
// at x 2 and 13 (y 6-8) to climb; legs come from LEGS below.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';
const LEGS = [[[5, 14, 2], [9, 14, 2]], [[4, 14, 2], [10, 14, 1]], [[5, 14, 1], [9, 14, 2]], [[5, 14, 2], [9, 14, 2]]];
const HANDS = (f) => (f === 3 ? [[1, 5], [13, 5]] : [[2, 11], [12, 11]]);

// How each gear item is drawn when worn: its texture (won pieces reuse the
// Sun Suit art), whether it follows the character's frames, and whether it
// goes behind the character (the backs: 32x24 frames centred on it, with a
// fifth frame for the Glider Cape spread out while gliding).
const WON_KEY = { helmet: 'suit-helmet', crown: 'suit-crown-worn', jetpack: 'suit-jetpack-worn', boots: 'suit-boots-worn', gloves: 'suit-gloves-worn' };
const FRAMED = new Set(['jetpack', 'boots', 'gloves', 'glider', 'shell', 'balloon', 'bouncy', 'gecko', 'skates', 'clownshoes', 'magnet', 'boxing', 'lucky']);
const BEHIND = new Set(['glider', 'shell', 'balloon']);
export const gearLook = (id) => ({ key: WON_KEY[id] ?? `gear-${id}`, framed: FRAMED.has(id), behind: BEHIND.has(id) });

function ell(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

// ---------- hats (16x24: character row y is canvas row y + 8) ----------

const HATS = {
  // X-Ray Goggles: a strap round the head and two big green lenses at the front
  goggles: (r) => {
    r(OUT, 2, 12, 12, 2);
    r('#6a4a3a', 2, 12, 5, 1);
    drawMap(r.ctx, 6, 10, [
      '.oo..oo.',
      'oggooggo',
      'ogGoogGo',
      'oggooggo',
      '.oo..oo.',
    ], { o: OUT, g: '#5ae07a', G: '#d8ffe0' });
  },
  // Party Hat: a stripy cone with a pompom
  partyhat: (r) => drawMap(r.ctx, 4, 0, [
    '...ww...',
    '...ww...',
    '...oo...',
    '..oyyo..',
    '..oppo..',
    '.oyyyyo.',
    '.oppppo.',
    'oyyyyyyo',
    'oppppppo',
    'oyyyyyyo',
    'oooooooo',
  ], { o: OUT, y: '#ffe066', p: '#ff5aa8', w: '#ffffff' }),
  // Wizard Hat: a tall starry cone with a floppy tip and a wide brim
  wizardhat: (r) => drawMap(r.ctx, 1, 0, [
    '.oo...........',
    'obbo..........',
    '.obbo.........',
    '..obbo........',
    '...obbbo......',
    '....obybo.....',
    '....obbbbo....',
    '...obbbybbo...',
    '...obybbbbo...',
    'oooooooooooooo',
  ], { o: OUT, b: '#4a5ae0', y: '#ffe066' }),
  // Pirate Hat: a black tricorn with a skull
  piratehat: (r) => drawMap(r.ctx, 1, 3, [
    '....oooooo....',
    '...okkkkkko...',
    '..okkkwwkkko..',
    '..okkkwwkkko..',
    'ookkkkkkkkkkoo',
    'okkkkkkkkkkkko',
    'oyyyyyyyyyyyyo',
    '.oooooooooooo.',
  ], { o: OUT, k: '#2a2a3a', w: '#ffffff', y: '#ffd84a' }),
  // Cowboy Hat: a brown hat with a big brim and a band
  cowboyhat: (r) => drawMap(r.ctx, 0, 3, [
    '.....oo..oo.....',
    '....obboobbo....',
    '....obbbbbbo....',
    '....obbbbbbo....',
    '....orrrrrro....',
    'oo..obbbbbbo..oo',
    'oboooooooooooobo',
    '.obbbbbbbbbbbbo.',
    '..oooooooooooo..',
  ], { o: OUT, b: '#a8703a', r: '#e0403a' }),
  // Top Hat: tall, black and very fancy
  tophat: (r) => drawMap(r.ctx, 2, 0, [
    '..oooooooo..',
    '..okkkkkko..',
    '..okkkkkko..',
    '..okkkkkko..',
    '..okkkkkko..',
    '..okkkkkko..',
    '..orrrrrro..',
    '..okkkkkko..',
    'oooooooooooo',
    'okkkkkkkkkko',
    'oooooooooooo',
  ], { o: OUT, k: '#2a2a3a', r: '#e0403a' }),
  // Chef Hat: a big white puff
  chefhat: (r) => {
    for (const [x, y, rad] of [[5, 5, 3], [8, 3, 3], [11, 5, 3], [8, 6, 3]]) ell(r.ctx, x, y, rad + 1, rad + 1, OUT);
    for (const [x, y, rad] of [[5, 5, 3], [8, 3, 3], [11, 5, 3], [8, 6, 3]]) ell(r.ctx, x, y, rad, rad, '#ffffff');
    r(OUT, 4, 8, 9, 4);
    r('#ffffff', 5, 8, 7, 3);
    r('#e0e0e8', 5, 10, 7, 1);
  },
  // Bunny Ears: two tall ears on a headband
  bunnyears: (r) => drawMap(r.ctx, 3, 0, [
    '.oo...oo..',
    'owwo.owwo.',
    'owpo.owpo.',
    'owpo.owpo.',
    'owpo.owpo.',
    'owpo.owpo.',
    'owpo.owpo.',
    '.owwoowwo.',
    'oooooooooo',
    'oppppppppo',
    'oooooooooo',
  ], { o: OUT, w: '#ffffff', p: '#ffb0c8' }),
  // Viking Helmet: a grey dome with two curly horns
  vikinghat: (r) => drawMap(r.ctx, 0, 3, [
    'o..............o',
    'wo............ow',
    'wwo...oooo...oww',
    '.wwo.oggggo.oww.',
    '..wwoggggggoww..',
    '...ogggGgggggo..',
    '...oggggggggo...',
    '..oyyyyyyyyyyo..',
    '..oooooooooooo..',
  ], { o: OUT, w: '#fff4d8', g: '#9aa4b8', G: '#e0e6f0', y: '#d8a030' }),
  // Flower Crown: a ring of little flowers
  flowercrown: (r) => {
    r('#4aa040', 2, 10, 12, 1);
    const flowers = [[2, '#ff6a9a'], [5, '#ffe066'], [8, '#ffffff'], [11, '#6ab0ff'], [13, '#ff9a4a']];
    for (const [x, c] of flowers) {
      r(OUT, x - 1, 8, 3, 3);
      r(c, x - 1, 8, 3, 3);
      r('#ffd84a', x, 9, 1, 1);
    }
  },
  // Duck Hat: a little rubber duck sitting on your head
  duckhat: (r) => drawMap(r.ctx, 3, 0, [
    '......ooo...',
    '.....oyyyo..',
    '.....oyyko..',
    '.....oyyyaa.',
    'o....oyyyoo.',
    'oyoooyyyyo..',
    'oyyyyyyyyyo.',
    'oyyyyyyyyyo.',
    '.oyyyyyyyo..',
    '..ooooooo...',
  ], { o: OUT, y: '#ffd84a', k: OUT, a: '#ff9a2a' }),
};

// ---------- backs (16x24 frames, bottom 16 rows line up with the character) ----------

const BACKS = {
  // the Glider Cape: a purple cape from the shoulders, flapping as you walk
  // (backs are drawn behind the character, and 8 pixels wider on each side:
  // x -8 is the frame's left edge)
  glider: (r, f) => {
    const pal = { o: OUT, v: '#9a4ae0', y: '#ffd84a' };
    if (f === 4) {
      // gliding: spread out over your head like a hang glider
      drawMap(r.ctx, -8, 3, [
        '......oooooooooooooooooooo......',
        '....oovvvvvvvvvvvvvvvvvvvvoo....',
        '..oovvvvvvvvvvvvvvvvvvvvvvvvoo..',
        '.ovvvvvvvvvvvvvvvvvvvvvvvvvvvvo.',
        'oyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyo',
        '.oooooooooooooooooooooooooooooo.',
      ], pal);
      r(OUT, 3, 9, 1, 4);
      r(OUT, 12, 9, 1, 4);
      return;
    }
    drawMap(r.ctx, -8, 16, f === 1 ? [
      '........oooooo',
      '......oovvvvvo',
      '....oovvvvvvvo',
      '..oovvvvvvvvvo',
      '.ovvvvvvvvvvvo',
      'oyyyyyyyyyyyo.',
      '.ooooooooooo..',
    ] : [
      '........oooooo',
      '......oovvvvvo',
      '.....ovvvvvvvo',
      '....ovvvvvvvvo',
      '...ovvvvvvvvvo',
      '..ovvvvvvvvvvo',
      '.oyyyyyyyyyyyo',
      '..ooooooooooo.',
    ], pal);
  },
  // the Turtle Shell: a green shell on your back
  shell: (r) => drawMap(r.ctx, 0, 15, [
    '..ooo..',
    '.oggGo.',
    'ogGgggo',
    'ogggGgo',
    'oGgggGo',
    'ogggggo',
    '.oyyyo.',
    '..ooo..',
  ], { o: OUT, g: '#3a9a4a', G: '#7ad07a', y: '#d8c070' }),
  // the Balloon Pack: three balloons on strings from a little pack
  balloon: (r, f) => {
    const sway = [0, 1, 0, 0][f];
    r('#ffffff', 2, 8, 1, 10);
    for (const [x, y, c] of [[1, 2, '#ff5a6a'], [4 + sway, 4, '#6ab0ff'], [0, 7, '#ffe066']]) {
      ell(r.ctx, x + 2, y + 2, 3, 3, OUT);
      ell(r.ctx, x + 2, y + 2, 2, 2, c);
      r('#ffffff', x + 1, y + 1, 1, 1);
    }
    r(OUT, 0, 17, 5, 6);
    r('#ff9ad0', 1, 18, 3, 4);
  },
};

// ---------- feet (16x16 frames, following each frame's legs) ----------

const FEET = {
  // Bouncy Feet: bright green shoes on springy coils
  bouncy: (r, x, y) => {
    r(OUT, x - 1, y - 1, 5, 3);
    r('#5ae07a', x, y - 1, 3, 2);
    r('#d8ffe0', x, y - 1, 1, 1);
    r('#c0c8d8', x - 1, y + 1, 1, 1); r('#c0c8d8', x + 1, y + 1, 1, 1); r('#c0c8d8', x + 3, y + 1, 1, 1);
    r('#8a94a8', x, y + 2, 1, 1); r('#8a94a8', x + 2, y + 2, 1, 1);
  },
  // Gecko Socks: green socks with round sticky toe pads
  gecko: (r, x, y) => {
    r(OUT, x - 1, y - 1, 4, 4);
    r('#7ad04a', x, y - 1, 2, 3);
    r('#c8f070', x + 2, y + 1, 2, 2);
    r(OUT, x + 4, y + 2, 1, 1);
  },
  // Ice Skates: white boots with silver blades
  skates: (r, x, y) => {
    r(OUT, x - 1, y - 1, 5, 3);
    r('#ffffff', x, y - 1, 3, 2);
    r('#6ab0ff', x, y, 3, 1);
    r('#c0c8d8', x - 1, y + 2, 6, 1);
  },
  // Clown Shoes: huge red shoes that stick out the front
  clownshoes: (r, x, y) => {
    r(OUT, x - 1, y - 1, 7, 4);
    r('#e0403a', x, y, 5, 2);
    r('#ff8a6a', x + 3, y, 1, 1);
    r('#ffffff', x, y - 1, 2, 1);
  },
};

// ---------- hands (16x16 frames) ----------

const GLOVES = {
  // Magnet Mitts: little red horseshoe magnets with silver tips
  magnet: (r, x, y) => {
    r(OUT, x - 1, y - 1, 5, 4);
    r('#e0403a', x, y, 3, 2);
    r(OUT, x + 1, y - 1, 1, 2);
    r('#e0e6f0', x, y - 1, 1, 1); r('#e0e6f0', x + 2, y - 1, 1, 1);
  },
  // Boxing Gloves: big red gloves
  boxing: (r, x, y) => {
    r(OUT, x - 1, y - 1, 5, 5);
    r('#e0403a', x, y, 3, 3);
    r('#ff8a6a', x, y, 1, 1);
    r('#ffffff', x, y + 3, 3, 1);
  },
  // Lucky Mittens: green mittens with a golden star
  lucky: (r, x, y) => {
    r(OUT, x - 1, y - 1, 4, 4);
    r('#3ab04a', x, y, 3, 3);
    r('#ffe066', x + 1, y + 1, 1, 1);
  },
};

// ---------- power pictures (16x16) ----------

const P = { o: OUT, w: '#ffffff', y: '#ffe066', Y: '#fff6c0', r: '#e0403a', R: '#ff8a6a', g: '#5ae07a', G: '#2a8a3a', b: '#6ab0ff', B: '#3a5ab8', p: '#ff5aa8', v: '#9a4ae0', k: '#2a2a3a', s: '#c0c8d8', n: '#a8703a', c: '#d8a030' };
const POWERS = {
  // a lamp shining
  light: [
    '.......y........',
    '..y....y....y...',
    '...y.......y....',
    '.......oo.......',
    '......oYYo......',
    'yy...oYYYYo...yy',
    '.....oYYYYo.....',
    '......oYYo......',
    '.......ss.......',
    '......osso......',
    '...y..oooo..y...',
    '..y..........y..',
    '................',
  ],
  // an eye seeing a chest through rock
  xray: [
    '.....oooooo.....',
    '...oowwwwwwoo...',
    '..owwwoggowwwo..',
    '..owwoggGgowwo..',
    '...oowggggoo....',
    '.....oooooo.....',
    '.......g........',
    'kkkkkkkgkkkkkkkk',
    'kkkkkkoookkkkkkk',
    'kkkkkoccccokkkkk',
    'kkkkkoyoyookkkkk',
    'kkkkkoccccokkkkk',
    'kkkkkkoooookkkkk',
    'kkkkkkkkkkkkkkkk',
  ],
  // confetti bursting
  confetti: [
    '..p.....y....b..',
    '.....g......p...',
    '.y.......b......',
    '....p..y....g...',
    '..b.........y...',
    '......oo........',
    '.g...oppo..p....',
    '....oppppo....b.',
    '...oyyyyyyo.....',
    '..obbbbbbbbo....',
    '..oooooooooo....',
  ],
  // a trail of sparkles behind a wand
  trail: [
    '..........y.....',
    '.........yYy....',
    '..........y.....',
    '.........o......',
    '..y.....o.......',
    '.yYy...o..y.....',
    '..y...o.........',
    '.....o...y......',
    '....o..........',
    '...o...y.......',
    '..o......y.....',
  ],
  // flying up on flames
  jetpack: [
    '.......oo.......',
    '......owwo......',
    '.....owwwwo.....',
    '.......ww.......',
    '......orro......',
    '......orro......',
    '......orro......',
    '......oyyo......',
    '.......yy.......',
    '......yRRy......',
    '.......RR.......',
    '........R.......',
  ],
  // a cape floating down slowly
  glide: [
    '................',
    '.oooooooooooooo.',
    'ovvvvvvvvvvvvvvo',
    '.ovvvvvvvvvvvvo.',
    '..ovvvvvvvvvvo..',
    '...oyyyyyyyyo...',
    '......w..w......',
    '................',
    '.......ww.......',
    '.......ww.......',
    '.....wwwwww.....',
    '......wwww......',
    '.......ww.......',
  ],
  // a balloon rising
  balloon: [
    '.....oooo.......',
    '....orrrro......',
    '...orrwrrro.....',
    '...orwrrrro.....',
    '...orrrrrro.....',
    '....orrrro......',
    '.....orro.......',
    '......oo........',
    '......w.....w...',
    '.......w...www..',
    '......w...wwwww.',
    '.......w....w...',
    '......w.....w...',
  ],
  // a shell with a creature bouncing off
  shell: [
    '..........ooo...',
    '.........obbbo..',
    '.........obkbo..',
    '..ooo.....ooo...',
    '.oggGo..y.......',
    'ogGgggo..y......',
    'ogggGgo.........',
    'oGgggGo.........',
    'ogggggo.........',
    '.oyyyo..........',
    '..ooo...........',
  ],
  // running fast
  boots: [
    '................',
    '..ww....oooo....',
    '.......orrrro...',
    '.www...orrrro...',
    '.......orrrrooo.',
    '..ww...orrrrrrro',
    '.......oyyyyyyyo',
    '........oooooooo',
    '................',
  ],
  // a spring and a big jump arrow
  bouncy: [
    '.......gg.......',
    '......gggg......',
    '.....gggggg.....',
    '.......gg.......',
    '.......gg.......',
    '.......gg.......',
    '....oooooooo....',
    '....oggggggo....',
    '.....s....s.....',
    '......s..s......',
    '.....s....s.....',
    '......s..s......',
    '....oooooooo....',
  ],
  // footprints walking up a wall
  gecko: [
    'kkkk............',
    'kkkk..gg........',
    'kkkk.ggg........',
    'kkkk..g.........',
    'kkkk............',
    'kkkk..gg........',
    'kkkk.ggg........',
    'kkkk..g.........',
    'kkkk............',
    'kkkk..gg........',
    'kkkk.ggg........',
    'kkkk..g.........',
    'kkkkkkkkkkkkkkkk',
  ],
  // a skate swooshing
  skates: [
    '................',
    '.....oooo.......',
    '.....owwo.......',
    '.....owwo.......',
    '.....owwoooo....',
    '.....owwwwwwo...',
    '.....obbbbbbo...',
    '.....oooooooo...',
    '....ssssssssss..',
    '................',
    'bbbbbbbb........',
    '..bbbbbbbbbbb...',
  ],
  // a shoe going squeak
  squeak: [
    '..........k.....',
    '..........kk....',
    '.........kk.....',
    '........kk......',
    '.oooo..k........',
    'orrrro..........',
    'orrrrooooo......',
    'orrrrrrrrrro....',
    'owwrrrrrrrrro...',
    '.oooooooooooo...',
  ],
  // a glove with a pick: dig faster
  gloves: [
    '..........ooo...',
    '.........onnno..',
    '.........ossso..',
    '........oso.....',
    '.oooo..oso......',
    'orrrroooo.......',
    'orRrrrrro.......',
    'orrrrrrro.......',
    'oyyyyyyo........',
    '.oooooo.........',
  ],
  // a magnet pulling a gem
  magnet: [
    '.ooooo..........',
    'orrrrro.........',
    'orooooo....oo...',
    'oro.......obbo..',
    'oro...w..obbbbo.',
    'oro......obbbbo.',
    'orooooo...obbo..',
    'orrrrro....oo...',
    'ossssso.........',
    '.ooooo..........',
  ],
  // a boxing glove going POW
  boxing: [
    '..........y.....',
    '.........yyy..y.',
    '.ooooo..yyyyyy..',
    'orrrrro..yyyy...',
    'orRrrrroyyyyyy..',
    'orrrrrro.yyy....',
    'orrrrro...y.....',
    'owwwwo..........',
    '.oooo...........',
  ],
  // an open chest overflowing, with a clover
  lucky: [
    '....y..y..y.....',
    '...yyy.y.yyy....',
    '..oooooooooo....',
    '..occcccccco.gg.',
    '..oyyyyyyyyogGGg',
    '..occccyyccoggg.',
    '..occccyyccog...',
    '..occccccco.....',
    '..oooooooooo....',
  ],
  // just for looks: a hand mirror
  looks: [
    '.....oooo.......',
    '....owbbbo......',
    '...owbbbbbo.....',
    '...obbbbbbo.....',
    '...obbbbbbo.....',
    '....obbbbo......',
    '.....oooo.......',
    '......nn........',
    '......nn........',
    '......nn........',
    '......oo........',
  ],
};

// ---------- the four slots, and the coat hanger ----------

const SLOT_ICONS = {
  head: [
    '...oooooooo...',
    '..okkkkkkkko..',
    '..okkkkkkkko..',
    '..okkkkkkkko..',
    '..orrrrrrrro..',
    'oooooooooooooo',
    'okkkkkkkkkkkko',
    'oooooooooooooo',
  ],
  back: [
    '....oooooo....',
    '...o......o...',
    '..oooooooooo..',
    '..obbbbbbbbo..',
    '..oBBBBBBBBo..',
    '..obbbbbbbbo..',
    '..obbyybbbbo..',
    '..obbbbbbbbo..',
    '..oooooooooo..',
  ],
  feet: [
    '..ooooo.......',
    '..orrro.......',
    '..orrro.......',
    '..orrroooooo..',
    '..orrrrrrrrro.',
    '..oyyyyyyyyyo.',
    '..ooooooooooo.',
  ],
  hands: [
    '...o.o.o......',
    '..ororoRo.....',
    '..ororoRoo....',
    '..orrrrrror...',
    '..orrrrrrro...',
    '..orrrrrro....',
    '...oyyyyo.....',
    '...oooooo.....',
  ],
};
const HANGER = [
  '.....oo.....',
  '....o..o....',
  '.......o....',
  '......o.....',
  '.....oo.....',
  '...oonnoo...',
  '..onnnnnno..',
  '.onnnnnnnno.',
  'onnnnnnnnnno',
  'oooooooooooo',
];

export function drawGearArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };
  const pen = (ctx, ox = 0) => {
    const r = (c, x, y, w = 1, h = 1) => rect(ctx, c, ox + x, y, w, h);
    r.ctx = ctx;
    return r;
  };

  for (const [id, draw] of Object.entries(HATS)) one(`gear-${id}`, 16, 24, (ctx) => draw(pen(ctx)));
  for (const [id, draw] of Object.entries(BACKS)) {
    one(`gear-${id}`, 32 * 5, 24, (ctx, tex) => {
      for (let f = 0; f < 5; f++) {
        // (shift the canvas to each frame, with the character's 16 columns in the middle)
        ctx.save();
        ctx.translate(f * 32 + 8, 0);
        draw(pen(ctx), f === 4 && id !== 'glider' ? 0 : f);
        ctx.restore();
        tex.add(f, 0, f * 32, 0, 32, 24);
      }
    });
  }
  for (const [id, draw] of Object.entries(FEET)) {
    one(`gear-${id}`, 64, 16, (ctx, tex) => {
      LEGS.forEach((legs, f) => {
        for (const [x, , h] of legs) draw(pen(ctx, f * 16), x, h === 1 ? 12 : 13);
        tex.add(f, 0, f * 16, 0, 16, 16);
      });
    });
  }
  for (const [id, draw] of Object.entries(GLOVES)) {
    one(`gear-${id}`, 64, 16, (ctx, tex) => {
      for (let f = 0; f < 4; f++) {
        for (const [x, y] of HANDS(f)) draw(pen(ctx, f * 16), x + 1, y);
        tex.add(f, 0, f * 16, 0, 16, 16);
      }
    });
  }

  for (const [name, rows] of Object.entries(POWERS)) one(`power-${name}`, 16, 16, (ctx) => drawMap(ctx, 0, Math.floor((16 - rows.length) / 2), rows, P));
  for (const [name, rows] of Object.entries(SLOT_ICONS)) one(`slot-${name}`, 14, 10, (ctx) => drawMap(ctx, 0, Math.floor((10 - rows.length) / 2), rows, P));
  one('icon-hanger', 12, 12, (ctx) => drawMap(ctx, 0, 1, HANGER, { o: OUT, n: '#c8905a' }));
  // a tick for things you own
  one('icon-tick', 10, 9, (ctx) => drawMap(ctx, 0, 0, [
    '........oo',
    '.......ogo',
    '......ogo.',
    'oo...ogo..',
    'ogo.ogo...',
    '.ogoggo...',
    '..oggo....',
    '...oo.....',
  ], { o: OUT, g: '#4cc24a' }));
}
