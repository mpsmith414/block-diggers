// Art for the Moon Skate Park: the half pipe (with a glowing neon rim and
// painted stars), the skateboard, its rack, the ceiling lamps, and an icon
// for the park and for each trick.

import { drawMap } from './pixelmap.js';
import { SKATE } from '../tuning.js';

const OUT = '#2a1d2e';
const BOARD = { k: OUT, d: '#e0403a', D: '#a82a2a', w: '#ffd84a', g: '#3a3448' };
// a little skater for the trick icons
const KID = { k: OUT, s: '#f2c29b', b: '#4aa3ff', l: '#5a3a2a', h: '#ffd84a' };

export function drawSkateArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };

  // the half pipe: 2R + F wide, with a deck on each side; its lips 16 px
  // below the top, the floor at the bottom
  const { R, F, deck: D } = SKATE;
  const P = 2 * R + F;
  const W = P + 2 * D;
  const H = R + 16;
  one('halfpipe', W, H, (ctx) => {
    // the decks: platforms at the lips, on legs
    for (const dx of [0, W - D]) {
      rect(ctx, '#232c58', dx + 2, 18, 3, H - 18);
      rect(ctx, '#232c58', dx + D - 5, 18, 3, H - 18);
      for (let y = 30; y < H; y += 22) rect(ctx, '#2e3a72', dx + 2, y, D - 4, 2);
      rect(ctx, OUT, dx, 15, D, 4);
      rect(ctx, '#a0703c', dx, 16, D, 2);
    }
    ctx.translate(D, 0);
    const surf = (x) => {
      if (x < R) return H - R + Math.sqrt(Math.max(0, R * R - (R - x) ** 2));
      if (x < R + F) return H;
      const d = x - R - F;
      return H - R + Math.sqrt(Math.max(0, R * R - d * d));
    };
    for (let x = 0; x < P; x++) {
      const y = Math.round(surf(x + 0.5));
      // the ramp's body under the riding surface: dark blue with planks
      for (let yy = y; yy < H; yy++) rect(ctx, (yy - y) % 12 < 1 ? '#2e3a72' : ((x >> 3) % 2 ? '#3a4a8a' : '#36457f'), x, yy, 1, 1);
      // the riding surface: a bright edge, and a neon line just under it
      rect(ctx, '#c8f0ff', x, y - 1, 1, 2);
      rect(ctx, '#3affe0', x, y + 1, 1, 1);
    }
    // the flat bottom's surface
    rect(ctx, '#c8f0ff', R, H - 2, F, 2);
    rect(ctx, '#3affe0', R, H - 3, F, 1);
    // supports inside each quarter
    for (const x of [8, 26, 44, P - 9, P - 27, P - 45]) {
      const top = Math.round(surf(x)) + 3;
      rect(ctx, '#232c58', x, top, 2, H - top);
    }
    // painted stars on the walls
    const star = (cx, cy, c) => {
      rect(ctx, c, cx - 1, cy, 3, 1);
      rect(ctx, c, cx, cy - 1, 1, 3);
      rect(ctx, '#ffffff', cx, cy, 1, 1);
    };
    for (const [x, y, c] of [[16, 70, '#ffe066'], [34, 92, '#ff7eb6'], [P - 17, 70, '#ffe066'], [P - 35, 92, '#6ff0ff'], [22, 104, '#6ff0ff'], [P - 23, 104, '#ff7eb6']]) star(x, y, c);
    // metal coping at the lips
    for (const x of [-2, P - 2]) {
      rect(ctx, OUT, x, 12, 4, 5);
      rect(ctx, '#e0e8f0', x, 13, 4, 3);
      rect(ctx, '#ffffff', x + 1, 13, 2, 1);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  // the skateboard: red deck, grip tape, yellow wheels (16x6)
  one('skateboard', 16, 6, (ctx) => {
    drawMap(ctx, 0, 0, [
      '.kkkkkkkkkkkkkk.',
      'kggggggggggggggk',
      'kddddddddddddddk',
      '.kDDDDDDDDDDDDk.',
      '..kwk......kwk..',
      '...k........k...',
    ], BOARD);
  });

  // the rack the boards lean on (24x18)
  one('skate-rack', 24, 18, (ctx) => {
    rect(ctx, OUT, 1, 2, 3, 16);
    rect(ctx, '#a0703c', 2, 3, 1, 15);
    rect(ctx, OUT, 20, 2, 3, 16);
    rect(ctx, '#a0703c', 21, 3, 1, 15);
    rect(ctx, OUT, 0, 1, 24, 3);
    rect(ctx, '#c8904e', 1, 2, 22, 1);
    rect(ctx, OUT, 0, 16, 24, 2);
    rect(ctx, '#8a5a2a', 1, 16, 22, 1);
    // a little skateboard sign on top
    rect(ctx, '#e0403a', 8, 0, 8, 2);
  });

  // a ceiling lamp (12x10)
  one('skate-lamp', 12, 10, (ctx) => {
    rect(ctx, '#55505e', 5, 0, 2, 3);
    rect(ctx, OUT, 1, 3, 10, 4);
    rect(ctx, '#8a94a8', 2, 3, 8, 3);
    rect(ctx, '#fff6c0', 2, 7, 8, 2);
    rect(ctx, '#ffffff', 4, 7, 4, 1);
  });

  // the park's icon: a tiny half pipe with a board flying over it
  one('icon-skatepark', 16, 16, (ctx) => {
    for (let x = 0; x < 16; x++) {
      const d = Math.abs(x - 7.5);
      const y = d < 3 ? 15 : Math.round(15 - (d - 3) * (d - 3) * 0.4);
      rect(ctx, '#3a4a8a', x, y, 1, 16 - y);
      rect(ctx, '#3affe0', x, y, 1, 1);
    }
    drawMap(ctx, 4, 2, ['.kkkkkk.', 'kddddddk', '.kw..wk.'], BOARD);
    rect(ctx, '#ffe066', 1, 1, 1, 1);
    rect(ctx, '#ffe066', 13, 3, 1, 1);
  });

  // the tricks: a little skater and their board, mid-trick (16x16)
  const TRICK_ICONS = {
    // the board flipping under a jumping kid
    kickflip: ['......hh........', '.....hssh.......', '......ss........', '.....bbbb.......', '....b.bb.b......', '......bb........', '.....l..l.......', '.....l..l.......', '................', '..y......y......', '.y.kkkkkk.y.....', '...kddddk.......', '...kDDDDk.......', '..y.kkkk..y.....', '................', '................'],
    // spinning all the way round (a ring of arrows)
    spin360: ['.....yyyyy......', '...yy.....yy....', '..y...hh....y...', '.y...hssh....y..', '.y....ss.....y..', 'y....bbbb.....y.', 'y...b.bb.b....y.', 'y.....bb......y.', '.y...l..l....y..', '.y...l..l...yy..', '..y.kkkkkk..yyy.', '...kddddddk.....', '....kw..wk......', '...yy.....yy....', '.....yyyyy......', '................'],
    // flying flat like a superhero over the board
    superman: ['................', '................', '...hh...........', '..hssbbbbbbll...', '...sb.bbbb..ll..', '....b...........', '................', '................', '..y...y...y.....', '................', '...kkkkkkkkkk...', '..kggggggggggk..', '..kddddddddddk..', '...kwk....kwk...', '................', '................'],
    // crouched down, holding the board
    grab: ['................', '................', '......hh........', '.....hssh.......', '......ss........', '....bbbbbb......', '...sb.bb.bs.....', '...s.bbbb.s.....', '...s.l..l.s.....', '..kkkkkkkkkk....', '..kddddddddk....', '...kwk..kwk.....', '................', '..y.......y.....', '................', '................'],
    // upside down on the board, feet in the air
    handstand: ['.....l..l.......', '.....l..l.......', '......bb........', '.....bbbb.......', '......bb........', '.....hssh.......', '......hh........', '.....s..s.......', '....kkkkkk......', '...kddddddk.....', '....kw..wk......', '................', '..y......y......', '................', '................', '................'],
    // a full flip backwards (an arrow looping round)
    backflip: ['................', '....yyyyy.......', '...y.....y......', '..y..l.l..y.....', '..y..bbbb..y....', '..y...bb....y...', '.yyy.hssh...y...', '..y...hh....y...', '............y...', '...kkkkkk..y....', '..kddddddk.y....', '...kw..wk.y.....', '.....yyyyy......', '................', '................', '................'],
  };
  for (const [kind, map] of Object.entries(TRICK_ICONS)) {
    one(`trick-${kind}`, 16, 16, (ctx) => drawMap(ctx, 0, 0, map, { ...BOARD, ...KID, y: '#ffe066' }));
  }
}
