// Art for the treasure hunt: the twelve treasures (16x16 each), the pirate
// chest at the X (2 frames, 24x18: shut, then open and spilling gold), the
// big painted X on the rock, the treasure maps (plain and golden), Polly the
// pirate parrot (2 frames), the Treasure Hall building (96x80) and the
// pieces of its room: pedestals, the big plinth, banners, columns and the door.

import { drawMap } from './pixelmap.js';
import { goldify } from './gold.js';

const OUT = '#2a1d2e';
const GOLD = '#ffd84a';
const GOLD_D = '#c8902a';
const GOLD_L = '#fff2a0';
const RAINBOW = ['#ff5a6a', '#ffa64a', '#ffe066', '#6ad07a', '#4ab0ff', '#9a7aff'];

function ell(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}
// an outlined ellipse: the outline one pixel bigger all round
const blob = (ctx, cx, cy, rx, ry, color) => {
  ell(ctx, cx, cy, rx + 1, ry + 1, OUT);
  ell(ctx, cx, cy, rx, ry, color);
};

// ---------- the twelve treasures (16x16) ----------

const TREASURES = {
  // a golden crown with three points and a red and a green jewel
  crown: (ctx, r) => drawMap(ctx, 0, 2, [
    '..o....oo....o..',
    '.oyo..oyyo..oyo.',
    '.oyo..oyyo..oyo.',
    '.oyyooyyyyooyyo.',
    '.oyyyyyyyyyyyyo.',
    '.olyyyyyyyyyyyo.',
    '.olyyrryyggyyyo.',
    '.oyyyrryyggyyyo.',
    '.oyyyyyyyyyyyyo.',
    '.oddddddddddddo.',
    '.oyldyldyldyldo.',
    '.oooooooooooooo.',
  ], { o: OUT, y: GOLD, d: GOLD_D, l: GOLD_L, r: '#e0403a', g: '#3ad07a' }),

  // a little ship sailing inside a glass bottle, a cork in its neck
  bottleship: (ctx, r) => {
    blob(ctx, 7, 8, 6, 5, '#d8f2ff');
    r(OUT, 12, 6, 3, 5);
    r('#d8f2ff', 12, 7, 2, 3);
    r('#c8904e', 14, 7, 2, 3);
    r(OUT, 15, 6, 1, 5);
    ell(ctx, 7, 11, 5, 1, '#4ab0ff');
    // the hull and the sails
    r(OUT, 3, 9, 8, 2);
    r('#a8703a', 4, 9, 6, 1);
    r(OUT, 6, 3, 1, 6);
    drawMap(ctx, 3, 4, ['...w.', '..ww.', '.www.', 'wwww.'], { w: '#ffffff' });
    drawMap(ctx, 7, 4, ['w..', 'ww.', 'www'], { w: '#ffffff' });
    r('#e0403a', 6, 2, 2, 1);
    r('#ffffff', 3, 5, 1, 2);
  },

  // a giant pearl in an open pink clam
  pearl: (ctx, r) => {
    blob(ctx, 8, 5, 6, 3, '#ff9ad0');
    for (let x = 3; x <= 13; x += 2) r('#ffc8e4', x, 3, 1, 4);
    blob(ctx, 8, 12, 7, 2, '#ff9ad0');
    for (let x = 2; x <= 14; x += 2) r('#ffc8e4', x, 12, 1, 2);
    blob(ctx, 8, 9, 4, 4, '#f4f0ff');
    ell(ctx, 9, 10, 3, 3, '#d8d0f0');
    ell(ctx, 8, 9, 3, 3, '#f4f0ff');
    r('#ffffff', 6, 7, 2, 2);
  },

  // a green dragon egg with orange spots (it wobbles in the hall)
  dragonegg: (ctx, r) => {
    blob(ctx, 8, 9, 5, 6, '#5ad06a');
    ell(ctx, 9, 10, 4, 5, '#3ab04a');
    ell(ctx, 8, 9, 4, 5, '#5ad06a');
    for (const [x, y, s] of [[6, 6, 1], [10, 8, 2], [6, 12, 1], [10, 13, 1], [8, 4, 1]]) ell(ctx, x, y, s, s, '#ffa64a');
    r('#c8ffd0', 5, 5, 1, 3);
  },

  // pirate gold: three stacks of coins, the tall one in front
  goldcoins: (ctx, r) => {
    const stack = (x, n) => {
      const top = 15 - n * 2 - 2;
      r(OUT, x, top, 7, n * 2 + 3);
      r(GOLD_L, x + 1, top + 1, 5, 1);
      for (let k = 0; k < n; k++) {
        r(GOLD, x + 1, top + 2 + k * 2, 5, 1);
        r(GOLD_L, x + 1, top + 2 + k * 2, 1, 1);
        r(GOLD_D, x + 1, top + 3 + k * 2, 5, 1);
      }
    };
    stack(0, 4);
    stack(9, 3);
    stack(4, 6);
  },

  // a golden cup with rainbow stripes
  trophy: (ctx, r) => {
    drawMap(ctx, 1, 1, [
      '..oooooooooo..',
      'oooyyyyyyyyooo',
      'o.oy111111yo.o',
      'o.oy222222yo.o',
      '.ooy333333yoo.',
      '...oy4444yo...',
      '...oy5555yo...',
      '....oy66yo....',
      '.....oyyo.....',
      '.....oyyo.....',
      '....oyyyyo....',
      '...oddddddo...',
      '...oooooooo...',
    ], { o: OUT, y: GOLD, d: GOLD_D, 1: RAINBOW[0], 2: RAINBOW[1], 3: RAINBOW[2], 4: RAINBOW[3], 5: RAINBOW[4], 6: RAINBOW[5] });
    r(GOLD_L, 5, 3, 1, 3);
  },

  // a friendly crystal skull, smiling
  skull: (ctx, r) => {
    blob(ctx, 8, 7, 6, 5, '#bfeaff');
    r(OUT, 4, 11, 9, 4);
    r('#bfeaff', 5, 11, 7, 3);
    ell(ctx, 6, 7, 2, 2, '#4a6ab0');
    ell(ctx, 11, 7, 2, 2, '#4a6ab0');
    r('#ffffff', 5, 6, 1, 1);
    r('#ffffff', 10, 6, 1, 1);
    r(OUT, 8, 9, 1, 1);
    // the smile, with teeth
    drawMap(ctx, 5, 11, ['o.....o', '.ooooo.', '.owowo.'], { o: OUT, w: '#ffffff' });
    r('#ffffff', 4, 3, 2, 2);
    r('#e0f8ff', 9, 2, 3, 1);
  },

  // a golden dinosaur bone
  dinobone: (ctx) => drawMap(ctx, 0, 4, [
    '.oo..........oo.',
    'oyyo........oyyo',
    'olyyooooooooyyyo',
    '.oyyllllllllyyo.',
    '.oyyyyyyyyyyyyo.',
    'oyyyoooooooodyyo',
    'oyyo........oddo',
    '.oo..........oo.',
  ], { o: OUT, y: GOLD, l: GOLD_L, d: GOLD_D }),

  // a magic lamp, puffing a little purple smoke
  lamp: (ctx, r) => {
    blob(ctx, 7, 11, 5, 2, GOLD);
    r(GOLD_D, 3, 12, 9, 1);
    // the spout
    drawMap(ctx, 11, 7, ['...oo', '..oyo', '.oyo.', 'oyo..', 'yo...'], { o: OUT, y: GOLD });
    // the handle and the lid
    drawMap(ctx, 0, 8, ['ooo', 'o.o', 'oo.'], { o: OUT });
    blob(ctx, 7, 8, 2, 1, GOLD);
    r(OUT, 7, 5, 1, 2);
    r(GOLD, 6, 6, 3, 1);
    r(OUT, 4, 14, 7, 1);
    r(GOLD_L, 5, 10, 3, 1);
    for (const [x, y, s] of [[14, 4, 1], [13, 2, 1], [15, 1, 0]]) ell(ctx, x, y, s + 1, s + 1, '#c8a0ff');
  },

  // a pastel unicorn horn, spiralling up
  unicorn: (ctx, r) => {
    for (let y = 0; y < 13; y++) {
      const w = Math.max(1, Math.round(y / 2.4));
      r(OUT, 8 - w - 1, y, w * 2 + 2, 1);
      r(['#ffd8f0', '#d8f0ff', '#fff2c0'][Math.floor((y + 1) / 3) % 3], 8 - w, y, w * 2, 1);
    }
    for (let y = 3; y < 13; y += 3) r('#ffffff', 8 - Math.round(y / 2.4), y, Math.round(y / 2.4), 1);
    r(OUT, 7, 0, 2, 1);
    // a gold band at the bottom
    r(OUT, 1, 12, 14, 4);
    r(GOLD, 2, 13, 12, 2);
    r(GOLD_L, 3, 13, 4, 1);
  },

  // a little globe on a golden stand
  globe: (ctx, r) => {
    blob(ctx, 8, 7, 5, 5, '#4ab0ff');
    drawMap(ctx, 4, 3, ['..gg.....', '.gggg..g.', '.ggg..ggg', '..g....gg', '......gg.', '...gg....', '....g....'], { g: '#5ad06a' });
    r('#ffffff', 5, 4, 1, 2);
    // the stand
    drawMap(ctx, 1, 2, ['.o.............', 'o..............', 'o..............', 'o..............', 'o..............', 'o..............', '.o.............', '..o............', '...oooooooo....'], { o: GOLD_D });
    r(OUT, 7, 13, 2, 1);
    r(OUT, 4, 14, 8, 2);
    r(GOLD, 5, 14, 6, 1);
  },

  // a golden rubber duck
  duck: (ctx, r) => {
    blob(ctx, 7, 11, 6, 3, GOLD);
    blob(ctx, 10, 5, 3, 3, GOLD);
    ell(ctx, 7, 11, 6, 3, GOLD);
    r(GOLD_D, 2, 13, 10, 1);
    r(GOLD_L, 3, 9, 5, 1);
    // the wing, the eye and the beak
    drawMap(ctx, 4, 10, ['oddd', '.ood'], { o: GOLD_D, d: GOLD_D });
    r(OUT, 11, 4, 1, 1);
    drawMap(ctx, 13, 5, ['ooo', 'aaao', 'ooo.'], { o: OUT, a: '#ff8a2a' });
    r(GOLD_L, 9, 3, 1, 1);
  },
};

export function drawHuntArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };

  for (const [id, draw] of Object.entries(TREASURES)) one(`treasure-${id}`, 16, 16, draw);

  // the pirate chest at the X: shut with a gold lock, then open, full of gold
  one('hunt-chest', 48, 18, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 24;
      // the box
      r(OUT, ox + 1, 8, 22, 10);
      r('#a8603a', ox + 2, 9, 20, 8);
      r('#8a4a2a', ox + 2, 13, 20, 1);
      for (const x of [3, 19]) { r(GOLD_D, ox + x, 9, 2, 8); r(GOLD, ox + x, 9, 1, 8); }
      if (f === 0) {
        // the rounded lid, shut
        r(OUT, ox + 1, 2, 22, 7);
        r(OUT, ox + 2, 1, 20, 1);
        r('#c8784a', ox + 2, 2, 20, 6);
        r('#e0905a', ox + 2, 2, 20, 1);
        for (const x of [3, 19]) { r(GOLD_D, ox + x, 2, 2, 6); r(GOLD, ox + x, 2, 1, 6); }
        // the lock
        r(OUT, ox + 10, 6, 4, 5);
        r(GOLD, ox + 11, 7, 2, 3);
        r(OUT, ox + 11, 8, 2, 1);
      } else {
        // the lid thrown back, gold heaped up and spilling out
        r(OUT, ox + 1, 0, 22, 4);
        r('#8a4a2a', ox + 2, 1, 20, 2);
        ell(ctx, ox + 12, 8, 9, 3, GOLD_D);
        ell(ctx, ox + 12, 8, 8, 2, GOLD);
        for (const [x, y] of [[6, 7], [10, 6], [14, 7], [17, 8], [12, 5]]) r(GOLD_L, ox + x, y, 2, 1);
        r('#e0403a', ox + 8, 7, 2, 2);
        r('#4ab0ff', ox + 15, 6, 2, 2);
      }
      tex.add(f, 0, ox, 0, 24, 18);
    }
  });

  // the big red X painted on the rock (it glows when you're near), and a
  // golden map's gold one
  for (const [key, paint, shine] of [['hunt-x', '#e0403a', '#ff7a6a'], ['hunt-x-gold', GOLD, GOLD_L]]) one(key, 48, 32, (ctx) => {
    const stroke = (flip, color, w) => {
      ctx.fillStyle = color;
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = 4 + t * 40;
        const y = flip ? 28 - t * 24 : 4 + t * 24;
        ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
      }
    };
    for (const flip of [false, true]) stroke(flip, OUT, 9);
    for (const flip of [false, true]) stroke(flip, paint, 6);
    for (const flip of [false, true]) stroke(flip, shine, 2);
  });

  // the map's compass arrow on the HUD: a fat red arrow pointing right (it turns to the X)
  one('hunt-arrow', 14, 12, (ctx) => drawMap(ctx, 0, 0, [
    '.......oo.....',
    '.......oro....',
    '.......orro...',
    'oooooooorrro..',
    'orrrrrrrrrrro.',
    'orrrrrrrrrrrro',
    'orrrrrrrrrrrro',
    'orrrrrrrrrrro.',
    'oooooooorrro..',
    '.......orro...',
    '.......oro....',
    '.......oo.....',
  ], { o: OUT, r: '#e0403a' }));

  // a rolled-out treasure map with a red X (and a golden one)
  for (const [key, paper, edge] of [['hunt-map', '#f4e4c1', '#c8a070'], ['hunt-map-golden', '#ffe066', GOLD_D]]) {
    one(key, 12, 12, (ctx) => drawMap(ctx, 0, 0, [
      '.oooooooooo.',
      'oeppppppppeo',
      'opdppppppppo',
      'oepdpppppeeo',
      'oppdddpppppo',
      'oepppdpppppo',
      'opppppdxpxpo',
      'oeppppppxpeo',
      'oppppppxpxpo',
      'oeppppppppeo',
      'oppppppppppo',
      '.oooooooooo.',
    ], { o: OUT, p: paper, e: edge, d: edge, x: '#e0403a' }));
  }

  // the grand prize's sticker: a little golden robot on a plinth (the robot's
  // first frame, turned to gold)
  one('hunt-statue-icon', 16, 20, (ctx, r) => {
    if (scene.textures.exists('char-robot')) {
      ctx.drawImage(scene.textures.get('char-robot').getSourceImage(), 0, 0, 16, 16, 0, 0, 16, 16);
      goldify(ctx, 16, 16);
    }
    r(OUT, 1, 16, 14, 4);
    r('#9a7aff', 2, 17, 12, 2);
    r(GOLD, 2, 17, 12, 1);
  });

  // Polly the pirate parrot (16x16, 2 frames: sitting, then wings up)
  one('polly', 32, 16, (ctx, r, tex) => {
    const body = [
      '.....kkkk.......',
      '....kkkkkk......',
      '.....oooo.......',
      '....orrrro......',
      '...orrwkrro.....',
      '...orrrrrryo....',
      '...orrrrryyo....',
      '..ogrrrrro......',
      '..oggrrrro......',
      '..ogggrrbo......',
      '..oggggbbo......',
      '...ogggbbo......',
      '....oyyyyo......',
      '.....ooyo.......',
      '......ooo.......',
    ];
    const pal = { o: OUT, r: '#e0403a', g: '#3ad07a', b: '#4ab0ff', y: '#ffd84a', w: '#ffffff', k: '#2a2a3a' };
    drawMap(ctx, 2, 1, body, pal);
    // frame 2: the same parrot, wings flung up
    drawMap(ctx, 18, 1, body.map((row, i) => (i >= 7 && i <= 11 ? row.replace(/g/g, 'r') : row)), pal);
    drawMap(ctx, 16, 3, ['og..', 'ogg.', 'oggg', '.ogg'], pal);
    drawMap(ctx, 27, 4, ['..ob', '.obb', 'obbb', 'obb.'], pal);
    tex.add(0, 0, 0, 0, 16, 16);
    tex.add(1, 0, 16, 0, 16, 16);
  });

  // the Treasure Hall: a gold-domed hall with columns, a rainbow banner, a big
  // arched door on the right and Polly's perch and price board on the left
  one('bld-treasurehall', 96, 80, (ctx, r) => {
    // the gold dome and its flag (the building hides its lower half)
    ell(ctx, 60, 34, 25, 20, OUT);
    ell(ctx, 60, 34, 24, 19, GOLD);
    ell(ctx, 54, 28, 8, 8, GOLD_L);
    // the building
    r(OUT, 26, 34, 68, 46);
    r('#b07ae0', 27, 35, 66, 44);
    r('#9a5ad0', 27, 72, 66, 7);
    r(OUT, 26, 33, 68, 3);
    r(GOLD_D, 27, 34, 66, 1);
    r(OUT, 59, 4, 2, 12);
    drawMap(ctx, 61, 4, ['oooooo', 'o1122o', 'o3344o', 'o5566o', 'oooooo'], { o: OUT, 1: RAINBOW[0], 2: RAINBOW[1], 3: RAINBOW[2], 4: RAINBOW[3], 5: RAINBOW[4], 6: RAINBOW[5] });
    // the columns
    for (const x of [30, 44, 86]) {
      r(OUT, x - 1, 38, 6, 42);
      r('#fff6e0', x, 39, 4, 40);
      r('#e8d8b8', x + 3, 39, 1, 40);
    }
    // the rainbow banner
    RAINBOW.forEach((c, i) => r(c, 50 + i * 2, 40, 2, 14));
    r(OUT, 49, 39, 14, 1);
    drawMap(ctx, 50, 54, ['o.o.o.o.o.o.', '.o.o.o.o.o.o'], { o: OUT });
    // the big arched door
    ell(ctx, 74, 56, 9, 9, OUT);
    r(OUT, 65, 56, 19, 24);
    ell(ctx, 74, 56, 8, 8, '#6a3a2a');
    r('#6a3a2a', 66, 56, 17, 24);
    r('#8a4a2a', 74, 50, 1, 30);
    r(GOLD, 71, 66, 2, 2);
    r(GOLD, 76, 66, 2, 2);
    // a treasure map pinned up on the wall
    drawMap(ctx, 34, 44, ['oooooooo', 'oppppppo', 'opp.pxpo', 'op.pp.po', 'opppx.po', 'oppppppo', 'oooooooo'], { o: OUT, p: '#f4e4c1', '.': '#c8a070', x: '#e0403a' });
    // Polly's perch on the left: a post with a crossbar (Polly sits on it)
    r(OUT, 7, 36, 3, 44);
    r('#a8703a', 8, 37, 1, 43);
    r(OUT, 2, 34, 13, 3);
    r('#c8904e', 3, 35, 11, 1);
    // the price board on its own little post (the price is drawn on top)
    r(OUT, 3, 47, 21, 20);
    r('#f4e4c1', 4, 48, 19, 18);
    r('#c8a070', 4, 65, 19, 1);
    r(OUT, 12, 67, 2, 13);
    // grass tufts
    for (const x of [1, 18, 24, 90]) drawMap(ctx, x, 77, ['g.g', '.g.'], { g: '#6ad07a' });
  });

  // the room: a pedestal (16x20), the big plinth (96x16), a banner (12x28),
  // a column (12x72) and the door (32x48)
  one('hall-pedestal', 16, 20, (ctx, r) => {
    r(OUT, 2, 0, 12, 4);
    r('#fff6e0', 3, 1, 10, 2);
    r(OUT, 4, 3, 8, 14);
    r('#e8d8b8', 5, 4, 6, 13);
    r('#fff6e0', 5, 4, 2, 13);
    r(OUT, 1, 16, 14, 4);
    r('#fff6e0', 2, 17, 12, 2);
    r(GOLD, 3, 1, 10, 1);
  });
  one('hall-plinth', 96, 16, (ctx, r) => {
    r(OUT, 0, 0, 96, 16);
    r('#9a5ad0', 1, 1, 94, 14);
    r('#b07ae0', 1, 1, 94, 4);
    r(GOLD, 1, 5, 94, 1);
    r(GOLD, 1, 12, 94, 1);
    for (let x = 4; x < 92; x += 8) r(GOLD_L, x, 8, 3, 2);
  });
  one('hall-banner', 12, 28, (ctx, r) => {
    r(OUT, 0, 0, 12, 22);
    RAINBOW.forEach((c, i) => r(c, 1, 1 + i * 3.5, 10, 4));
    drawMap(ctx, 0, 22, ['o.o.o.o.o.o.', 'oo.oo.oo.oo.', '.o..o..o..o.'].map((row) => row.replace(/\./g, ' ')), { o: OUT });
    r(GOLD, 0, 0, 12, 1);
  });
  one('hall-column', 12, 72, (ctx, r) => {
    r(OUT, 0, 0, 12, 6);
    r(GOLD, 1, 1, 10, 4);
    r(OUT, 2, 6, 8, 60);
    r('#fff6e0', 3, 6, 6, 60);
    r('#e8d8b8', 7, 6, 2, 60);
    r(OUT, 0, 66, 12, 6);
    r(GOLD, 1, 67, 10, 4);
  });
  one('hall-door', 32, 48, (ctx, r) => {
    ell(ctx, 16, 16, 15, 15, OUT);
    r(OUT, 1, 16, 30, 32);
    ell(ctx, 16, 16, 13, 13, '#6a3a2a');
    r('#6a3a2a', 3, 16, 26, 32);
    r('#8a4a2a', 16, 4, 1, 44);
    // daylight through the window at the top
    ell(ctx, 16, 12, 6, 5, OUT);
    ell(ctx, 16, 12, 5, 4, '#bfe8ff');
    r(OUT, 16, 7, 1, 10);
    r(GOLD, 12, 28, 2, 2);
    r(GOLD, 19, 28, 2, 2);
  });
}
