// Camp art: buildings, animals, props and UI icons. Drawn at boot.

import { drawMap } from './pixelmap.js';

export const BUILDING_SIZE = { w: 96, h: 80 };

const OUT = '#3a2a24';

// ---------- small sprites from pixel maps ----------

const PIG = {
  pal: { o: '#6b3441', p: '#f5a8b8', P: '#e38aa0', k: '#2a1d2e', n: '#d9708a', w: '#ffffff' },
  frames: [
    [
      '................',
      '..........o.o...',
      '..ooooooooopopo.',
      '.oppppppppppppo.',
      'oppppppppppwkppo',
      'oppppppppppkkpnn',
      'oPppppppppppppnn',
      '.oPPppppppppPPo.',
      '..oPPPPPPPPPPo..',
      '..oPo.oPo.oPo...',
      '..oPo..oo.oPo...',
      '...o.......o....',
    ],
    [
      '................',
      '..........o.o...',
      '..ooooooooopopo.',
      '.oppppppppppppo.',
      'oppppppppppwkppo',
      'oppppppppppkkpnn',
      'oPppppppppppppnn',
      '.oPPppppppppPPo.',
      '..oPPPPPPPPPPo..',
      '...oPo.oPo.oPo..',
      '...oPo.oo..oPo..',
      '....o.......o...',
    ],
  ],
};

const SHEEP = {
  pal: { o: '#4a4150', w: '#fbf7ee', W: '#e2dccd', f: '#3d3440', k: '#ffffff' },
  frames: [
    [
      '................',
      '...ooooooo......',
      '..owwwwwwwoo....',
      '.owwWwwwWwwwooo.',
      'owwwwwwwwwwwofo.',
      'owWwwwwwWwwwofkf',
      'owwwwwwwwwwwofff',
      '.owwWwwwwWwwoff.',
      '..owwwwwwwwwo...',
      '...of.of.of.....',
      '...of..o.of.....',
      '....o.....o.....',
    ],
    [
      '................',
      '...ooooooo......',
      '..owwwwwwwoo....',
      '.owwWwwwWwwwooo.',
      'owwwwwwwwwwwofo.',
      'owWwwwwwWwwwofkf',
      'owwwwwwwwwwwofff',
      '.owwWwwwwWwwoff.',
      '..owwwwwwwwwo...',
      '....of.of.of....',
      '....of.o..of....',
      '.....o.....o....',
    ],
  ],
};

const CART = {
  pal: { o: '#2e2a33', b: '#9a5f2c', B: '#6b3f1c', m: '#b8c4d0', g: '#f5c629', k: '#1b1820' },
  frames: [[
    '................',
    '...g..g.g.......',
    '.oooooooooooooo.',
    '.obbbbbbbbbbbbo.',
    '.oBbbbbbbbbbbBo.',
    '.oBBBBBBBBBBBBo.',
    '..oooooooooooo..',
    '...okko...okko..',
    '...okko...okko..',
    '....oo.....oo...',
  ]],
};

const FLAME = [
  [
    '......y.........',
    '.....yy.........',
    '.....yyo........',
    '....yyYoo.......',
    '....yYYo........',
    '...oyYYyo.......',
  ],
  [
    '.......y........',
    '......yy........',
    '.....oyy........',
    '....ooYyy.......',
    '.....oYYy.......',
    '....oyYYyo......',
  ],
  [
    '................',
    '.....y..........',
    '.....yy.y.......',
    '....oyyyy.......',
    '....yYYYo.......',
    '...oyYYyoo......',
  ],
];

const A_BUTTON = [
  '..oooooo..',
  '.oggggggo.',
  'oggGwwGggo',
  'oggwGGwggo',
  'oggwwwwggo',
  'oggwGGwggo',
  'oggwGGwggo',
  'ogggggggGo',
  '.oGGGGGGo.',
  '..oooooo..',
];

const STAR = [
  '....o....',
  '...oyo...',
  '...oyo...',
  'oooyyyooo',
  'oyyyyyyyo',
  '.oyyyyyo.',
  '..oyoyo..',
  '.oyo.oyo.',
  '.oo...oo.',
];

const ARROW = [
  'o....',
  'oo...',
  'owo..',
  'owwo.',
  'owwwo',
  'owwo.',
  'owo..',
  'oo...',
  'o....',
];

function strip(scene, canvasTexture, key, spr, w, h) {
  const n = spr.frames.length;
  const { tex, ctx } = canvasTexture(scene, key, w * n, h);
  spr.frames.forEach((rows, i) => {
    drawMap(ctx, i * w, 0, rows, spr.pal);
    tex.add(i, 0, i * w, 0, w, h);
  });
  tex.refresh();
}

// ---------- buildings (96×80, drawn bottom-up so they can assemble) ----------

function drawGarden(ctx, rect) {
  // tilled beds with flowers, a little fence
  for (let i = 0; i < 3; i++) {
    const x = 8 + i * 28;
    rect(ctx, '#6b4424', x, 58, 24, 14);
    rect(ctx, '#8a5a34', x + 1, 59, 22, 3);
    for (let f = 0; f < 4; f++) {
      const fx = x + 3 + f * 5;
      const colors = [['#ff7eb6', '#ffd1e6'], ['#ffd84a', '#fff4b0'], ['#8ec5ff', '#dff0ff']][(i + f) % 3];
      rect(ctx, '#3d8a48', fx + 1, 50, 1, 9);
      rect(ctx, '#5cc26a', fx + 2, 54, 2, 1);
      rect(ctx, colors[0], fx, 46, 3, 3);
      rect(ctx, colors[1], fx + 1, 47, 1, 1);
    }
  }
  // fence
  rect(ctx, '#9a5f2c', 0, 66, 96, 2);
  for (let x = 2; x < 96; x += 10) rect(ctx, '#7a4a22', x, 62, 3, 16);
  // watering can
  rect(ctx, '#8ec5ff', 80, 70, 8, 6);
  rect(ctx, '#5d93cc', 88, 71, 4, 2);
}

function drawHouse(ctx, rect) {
  // walls
  rect(ctx, OUT, 13, 36, 70, 44);
  rect(ctx, '#e8c89a', 14, 37, 68, 42);
  for (let y = 40; y < 78; y += 6) rect(ctx, '#d4b080', 14, y, 68, 1);
  // door
  rect(ctx, OUT, 41, 54, 16, 26);
  rect(ctx, '#8a5a34', 42, 55, 14, 25);
  rect(ctx, '#6b4424', 48, 55, 1, 25);
  rect(ctx, '#f5c629', 53, 67, 2, 2);
  // windows (warm light)
  for (const wx of [20, 64]) {
    rect(ctx, OUT, wx, 48, 13, 12);
    rect(ctx, '#ffd86b', wx + 1, 49, 11, 10);
    rect(ctx, '#ffefb0', wx + 2, 50, 4, 3);
    rect(ctx, OUT, wx + 6, 49, 1, 10);
    rect(ctx, OUT, wx + 1, 53, 11, 1);
    rect(ctx, '#ff9ab0', wx, 60, 13, 3); // flower box
  }
  // roof
  for (let i = 0; i < 22; i++) {
    const w = 8 + i * 4;
    rect(ctx, OUT, 48 - w / 2 - 1, 14 + i, w + 2, 1);
    rect(ctx, i % 4 === 3 ? '#a33a36' : '#c94c45', 48 - w / 2, 14 + i, w, 1);
  }
  rect(ctx, OUT, 4, 36, 88, 2);
  // chimney
  rect(ctx, OUT, 66, 6, 10, 20);
  rect(ctx, '#9a6a5a', 67, 7, 8, 19);
  rect(ctx, '#7a4a3a', 67, 7, 8, 2);
}

function drawPen(ctx, rect) {
  // grass patch, trough, fence all round
  rect(ctx, '#7cc95a', 2, 56, 92, 22);
  rect(ctx, '#6ab44a', 2, 56, 92, 2);
  rect(ctx, '#8a5a34', 66, 66, 18, 6);
  rect(ctx, '#8ec5ff', 68, 67, 14, 2);
  for (const y of [52, 62]) rect(ctx, '#b87a44', 0, y, 96, 3);
  for (let x = 0; x < 96; x += 12) {
    rect(ctx, OUT, x, 46, 5, 34);
    rect(ctx, '#9a5f2c', x + 1, 47, 3, 33);
  }
  // hay bale
  rect(ctx, OUT, 14, 64, 16, 12);
  rect(ctx, '#f0d070', 15, 65, 14, 10);
  rect(ctx, '#d4b050', 15, 69, 14, 1);
}

function drawTower(ctx, rect) {
  // legs
  for (const x of [24, 66]) {
    rect(ctx, OUT, x, 30, 6, 50);
    rect(ctx, '#9a5f2c', x + 1, 30, 4, 50);
  }
  for (let y = 40; y < 80; y += 12) {
    rect(ctx, '#7a4a22', 28, y, 40, 2);
  }
  // ladder
  rect(ctx, '#c8904e', 44, 32, 2, 48);
  rect(ctx, '#c8904e', 50, 32, 2, 48);
  for (let y = 34; y < 80; y += 5) rect(ctx, '#c8904e', 44, y, 8, 1);
  // cabin
  rect(ctx, OUT, 18, 16, 60, 16);
  rect(ctx, '#b87a44', 19, 17, 58, 14);
  rect(ctx, '#ffd86b', 26, 20, 10, 7);
  rect(ctx, '#ffd86b', 60, 20, 10, 7);
  // roof
  for (let i = 0; i < 10; i++) rect(ctx, i % 3 === 2 ? '#3d7a9a' : '#4a92b8', 14 + i, 6 + i, 68 - i * 2, 1);
  rect(ctx, OUT, 14, 16, 68, 1);
  // flagpole (flag is a separate animated sprite)
  rect(ctx, OUT, 47, 0, 2, 8);
}

function drawTrack(ctx, rect) {
  // an oval rail loop for the minecart
  const cx = 48;
  const cy = 62;
  for (let a = 0; a < Math.PI * 2; a += 0.02) {
    const x = Math.round(cx + Math.cos(a) * 40);
    const y = Math.round(cy + Math.sin(a) * 12);
    rect(ctx, '#6b4424', x - 1, y, 3, 2);
  }
  for (let a = 0; a < Math.PI * 2; a += 0.02) {
    rect(ctx, '#b8c4d0', Math.round(cx + Math.cos(a) * 38), Math.round(cy + Math.sin(a) * 10), 1, 1);
    rect(ctx, '#b8c4d0', Math.round(cx + Math.cos(a) * 42), Math.round(cy + Math.sin(a) * 14), 1, 1);
  }
  // little station sign
  rect(ctx, OUT, 44, 30, 2, 24);
  rect(ctx, OUT, 36, 26, 18, 10);
  rect(ctx, '#f4e4c1', 37, 27, 16, 8);
  rect(ctx, '#9a5f2c', 40, 30, 10, 2);
}

function drawStatue(ctx, rect) {
  // plinth
  rect(ctx, OUT, 26, 62, 44, 18);
  rect(ctx, '#b8b4c8', 27, 63, 42, 17);
  rect(ctx, '#d8d4e8', 27, 63, 42, 2);
  rect(ctx, OUT, 20, 76, 56, 4);
  rect(ctx, '#9894a8', 21, 77, 54, 3);
  // a giant diamond on top
  const D = '#4de3f0';
  const Dh = '#d4fbff';
  const Dd = '#2aa9c0';
  const rows = [[40, 16], [36, 24], [32, 32], [30, 36], [30, 36], [32, 32], [34, 28], [36, 24], [38, 20], [40, 16], [42, 12], [44, 8], [46, 4]];
  rows.forEach(([x, w], i) => {
    rect(ctx, OUT, x - 1, 22 + i * 3, w + 2, 3);
    rect(ctx, i < 4 ? Dh : i < 8 ? D : Dd, x, 22 + i * 3, w, 3);
  });
  rect(ctx, '#ffffff', 40, 26, 6, 3);
  rect(ctx, '#ffffff', 36, 32, 3, 3);
  // emerald gems on the plinth
  for (const x of [32, 58]) {
    rect(ctx, '#2fcf6a', x, 68, 6, 6);
    rect(ctx, '#b8ffcf', x + 1, 69, 2, 2);
  }
}

const BUILDINGS = { garden: drawGarden, house: drawHouse, pen: drawPen, tower: drawTower, minecart: drawTrack, statue: drawStatue };

// ---------- props ----------

function drawTree(ctx, rect, ox) {
  rect(ctx, OUT, ox + 13, 30, 7, 18);
  rect(ctx, '#7a4a22', ox + 14, 30, 5, 18);
  const blobs = [[16, 18, 13], [8, 24, 9], [24, 24, 9], [16, 10, 10]];
  for (const [x, y, r] of blobs) {
    ctx.fillStyle = OUT;
    ctx.beginPath();
    ctx.arc(ox + x, y, r + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [x, y, r] of blobs) {
    ctx.fillStyle = '#4fae52';
    ctx.beginPath();
    ctx.arc(ox + x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#6fcf6a';
  ctx.beginPath();
  ctx.arc(ox + 12, 12, 5, 0, Math.PI * 2);
  ctx.fill();
  // a couple of apples
  rect(ctx, '#e0503a', ox + 20, 20, 3, 3);
  rect(ctx, '#e0503a', ox + 9, 26, 3, 3);
}

function drawBench(ctx, rect) {
  // workbench with an anvil and a pickaxe
  rect(ctx, OUT, 0, 10, 32, 4);
  rect(ctx, '#b87a44', 1, 11, 30, 2);
  for (const x of [2, 26]) {
    rect(ctx, OUT, x, 14, 4, 10);
    rect(ctx, '#9a5f2c', x + 1, 14, 2, 10);
  }
  rect(ctx, OUT, 4, 3, 13, 7);
  rect(ctx, '#6d7480', 5, 4, 11, 3);
  rect(ctx, '#8e96a3', 5, 4, 11, 1);
  rect(ctx, '#6d7480', 8, 7, 5, 3);
  // pickaxe leaning
  rect(ctx, '#8a5a34', 22, 1, 2, 10);
  rect(ctx, '#b8c4d0', 18, 1, 10, 2);
}

function drawShaft(ctx, rect) {
  // mine entrance: timber frame over a dark hole in the ground
  rect(ctx, '#120d1c', 6, 16, 20, 16);
  rect(ctx, OUT, 2, 4, 6, 28);
  rect(ctx, '#9a5f2c', 3, 5, 4, 27);
  rect(ctx, OUT, 24, 4, 6, 28);
  rect(ctx, '#9a5f2c', 25, 5, 4, 27);
  rect(ctx, OUT, 0, 0, 32, 6);
  rect(ctx, '#b87a44', 1, 1, 30, 4);
  rect(ctx, '#c8904e', 11, 16, 2, 16);
  rect(ctx, '#c8904e', 19, 16, 2, 16);
  for (let y = 18; y < 32; y += 4) rect(ctx, '#c8904e', 11, y, 10, 1);
  // lantern
  rect(ctx, OUT, 27, 7, 5, 7);
  rect(ctx, '#ffd86b', 28, 8, 3, 5);
}

function drawStake(ctx, rect) {
  // plot marker: a little sign with a hammer
  rect(ctx, OUT, 7, 8, 2, 8);
  rect(ctx, OUT, 1, 0, 14, 10);
  rect(ctx, '#f4e4c1', 2, 1, 12, 8);
  rect(ctx, '#8a5a34', 7, 3, 1, 5);
  rect(ctx, '#6d7480', 4, 2, 7, 2);
}

function drawIcons(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx);
    tex.refresh();
  };
  one('btn-a', 10, 10, (ctx) => drawMap(ctx, 0, 0, A_BUTTON, { o: '#1f4a1f', g: '#4cc24a', G: '#2f8f34', w: '#ffffff' }));
  one('star', 9, 9, (ctx) => drawMap(ctx, 0, 0, STAR, { o: '#7a5a10', y: '#ffd84a' }));
  one('arrow-r', 5, 9, (ctx) => drawMap(ctx, 0, 0, ARROW, { o: OUT, w: '#fff6e0' }));
  one('arrow-l', 5, 9, (ctx) => drawMap(ctx, 0, 0, ARROW, { o: OUT, w: '#fff6e0' }, { flip: true }));
  one('icon-pick', 12, 12, (ctx) => {
    for (let i = 0; i < 8; i++) rect(ctx, '#8a5a34', 2 + i, 9 - i, 2, 2);
    rect(ctx, '#b8c4d0', 4, 1, 7, 2);
    rect(ctx, '#b8c4d0', 9, 1, 2, 6);
    rect(ctx, '#e8eef4', 5, 1, 3, 1);
  });
  one('icon-lantern', 12, 12, (ctx) => {
    rect(ctx, OUT, 3, 0, 6, 2);
    rect(ctx, OUT, 2, 2, 8, 9);
    rect(ctx, '#ffd86b', 3, 3, 6, 7);
    rect(ctx, '#fff4c0', 4, 4, 2, 3);
    rect(ctx, OUT, 3, 11, 6, 1);
  });
  one('icon-hammer', 12, 12, (ctx) => {
    for (let i = 0; i < 7; i++) rect(ctx, '#8a5a34', 2 + i, 10 - i, 2, 2);
    rect(ctx, '#6d7480', 6, 0, 6, 4);
    rect(ctx, '#8e96a3', 6, 0, 6, 1);
  });
  one('icon-pad', 16, 10, (ctx) => {
    rect(ctx, OUT, 2, 1, 12, 7);
    rect(ctx, OUT, 0, 3, 16, 7);
    rect(ctx, '#e8e4f0', 1, 4, 14, 5);
    rect(ctx, '#e8e4f0', 3, 2, 10, 2);
    rect(ctx, '#55505e', 3, 5, 3, 1);
    rect(ctx, '#55505e', 4, 4, 1, 3);
    rect(ctx, '#4cc24a', 11, 4, 2, 2);
    rect(ctx, '#e03a3a', 13, 6, 2, 2);
  });
  one('icon-pause', 12, 12, (ctx) => {
    rect(ctx, OUT, 1, 0, 4, 12); rect(ctx, '#fff6e0', 2, 1, 2, 10);
    rect(ctx, OUT, 7, 0, 4, 12); rect(ctx, '#fff6e0', 8, 1, 2, 10);
  });
  one('icon-play', 12, 12, (ctx) => drawMap(ctx, 1, 0, [
    'oo........',
    'ogoo......',
    'oggoo.....',
    'ogggoo....',
    'oggggoo...',
    'ogggggoo..',
    'ogggggoo..',
    'oggggoo...',
    'ogggoo....',
    'oggoo.....',
    'ogoo......',
    'oo........',
  ], { o: OUT, g: '#4cc24a' }));
  const speaker = (ctx, on) => {
    rect(ctx, OUT, 1, 4, 4, 5); rect(ctx, '#fff6e0', 2, 5, 2, 3);
    rect(ctx, OUT, 4, 2, 3, 9); rect(ctx, '#fff6e0', 5, 3, 1, 7);
    if (on) {
      rect(ctx, '#4a92b8', 8, 4, 1, 5); rect(ctx, '#4a92b8', 10, 2, 1, 9);
    } else {
      for (let i = 0; i < 4; i++) { rect(ctx, '#d0463a', 8 + i, 4 + i, 1, 1); rect(ctx, '#d0463a', 11 - i, 4 + i, 1, 1); }
    }
  };
  one('icon-sound', 12, 12, (ctx) => speaker(ctx, true));
  one('icon-mute', 12, 12, (ctx) => speaker(ctx, false));
  one('icon-home', 12, 12, (ctx) => {
    // a little house with a rope
    for (let i = 0; i < 5; i++) rect(ctx, '#c94c45', 5 - i, 1 + i, 2 + i * 2, 1);
    rect(ctx, OUT, 2, 6, 8, 6); rect(ctx, '#e8c89a', 3, 6, 6, 5); rect(ctx, '#8a5a34', 5, 8, 2, 3);
    rect(ctx, '#c8904e', 11, 0, 1, 12);
  });
  one('icon-door', 12, 12, (ctx) => {
    rect(ctx, OUT, 2, 0, 8, 12); rect(ctx, '#9a5f2c', 3, 1, 6, 11); rect(ctx, '#f5c629', 7, 6, 1, 2);
    rect(ctx, '#ffffff', 4, 3, 2, 2);
  });
  one('rope', 3, 8, (ctx) => {
    rect(ctx, '#c8904e', 0, 0, 3, 8);
    rect(ctx, '#9a6a34', 0, 1, 3, 1);
    rect(ctx, '#9a6a34', 0, 5, 3, 1);
  });
  one('smoke', 6, 6, (ctx) => {
    ctx.fillStyle = 'rgba(240,235,245,0.9)';
    ctx.beginPath();
    ctx.arc(3, 3, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  one('flag', 12, 16, (ctx) => {
    rect(ctx, '#ff7eb6', 0, 0, 10, 6);
    rect(ctx, '#ffd1e6', 0, 0, 10, 2);
  });
  one('ring', 16, 16, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.stroke();
  });
}

export function drawCampArt(scene, canvasTexture, rect) {
  strip(scene, canvasTexture, 'pig', PIG, 16, 12);
  strip(scene, canvasTexture, 'sheep', SHEEP, 16, 12);
  strip(scene, canvasTexture, 'cart', CART, 16, 10);
  {
    const { tex, ctx } = canvasTexture(scene, 'fire', 48, 16);
    FLAME.forEach((rows, i) => {
      drawMap(ctx, i * 16 + 2, 2, rows, { y: '#ffd84a', Y: '#fff6c0', o: '#ff7a2a' });
      rect(ctx, '#6b3f1c', i * 16 + 1, 12, 14, 2);
      rect(ctx, '#8a5a34', i * 16 + 3, 10, 10, 2);
      rect(ctx, '#7d7d86', i * 16, 13, 2, 3);
      rect(ctx, '#7d7d86', i * 16 + 14, 13, 2, 3);
      tex.add(i, 0, i * 16, 0, 16, 16);
    });
    tex.refresh();
  }
  for (const [id, draw] of Object.entries(BUILDINGS)) {
    const { tex, ctx } = canvasTexture(scene, `bld-${id}`, BUILDING_SIZE.w, BUILDING_SIZE.h);
    draw(ctx, rect);
    tex.refresh();
  }
  {
    const { tex, ctx } = canvasTexture(scene, 'tree', 32, 48);
    drawTree(ctx, rect, 0);
    tex.refresh();
  }
  {
    const { tex, ctx } = canvasTexture(scene, 'bench', 32, 24);
    drawBench(ctx, rect);
    tex.refresh();
  }
  {
    const { tex, ctx } = canvasTexture(scene, 'shaft', 32, 32);
    drawShaft(ctx, rect);
    tex.refresh();
  }
  {
    const { tex, ctx } = canvasTexture(scene, 'stake', 16, 16);
    drawStake(ctx, rect);
    tex.refresh();
  }
  {
    // tiny flowers for the meadow: 3 colours
    const { tex, ctx } = canvasTexture(scene, 'flower', 15, 6);
    ['#ff7eb6', '#ffd84a', '#ffffff'].forEach((c, i) => {
      rect(ctx, '#3d8a48', i * 5 + 2, 3, 1, 3);
      rect(ctx, c, i * 5 + 1, 0, 3, 3);
      rect(ctx, '#ffe066', i * 5 + 2, 1, 1, 1);
      tex.add(i, 0, i * 5, 0, 5, 6);
    });
    tex.refresh();
  }
  drawIcons(scene, canvasTexture, rect);
}
