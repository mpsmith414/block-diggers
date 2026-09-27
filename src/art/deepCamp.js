// Camp art for the deeper world: the Dino Park, the Toy Workshop and the
// Rocket Ship; toy-brick decorations; baby T-rex and Triceratops; padlock,
// rocket and Heart icons.

import { drawMap } from './pixelmap.js';
import { toyBrick } from './deep.js';

const OUT = '#3a2a24';
const BRICKS = {
  r: ['#e0403a', '#ff9a8a', '#8a1a1a'], b: ['#3a7ae0', '#8ac0ff', '#1a3a8a'],
  y: ['#f5c629', '#fff2a0', '#8a6a10'], g: ['#3fbf5a', '#a0f0b0', '#1a6a2a'],
};

// ---------- buildings (96x80) ----------

function palm(ctx, rect, x, base, h) {
  for (let i = 0; i < h; i++) {
    const bend = Math.round(Math.sin(i / h * 1.2) * 4);
    rect(ctx, OUT, x + bend - 1, base - i, 5, 1);
    rect(ctx, i % 3 ? '#a0703c' : '#7a5230', x + bend, base - i, 3, 1);
  }
  const tx = x + Math.round(Math.sin(1.2) * 4) + 1;
  const ty = base - h;
  for (const [dx, dy, len] of [[-1, 0, 12], [1, 0, 12], [-1, -1, 8], [1, -1, 8]]) {
    for (let k = 0; k < len; k++) {
      const px = tx + dx * k;
      const py = ty + dy * k + Math.round((k * k) / (dy ? 10 : 14));
      rect(ctx, '#2f7a3a', px, py, 2, 3);
      rect(ctx, '#5cc26a', px, py, 2, 1);
    }
  }
  rect(ctx, '#7a4a22', tx - 1, ty + 1, 2, 2); // coconuts
  rect(ctx, '#7a4a22', tx + 1, ty + 2, 2, 2);
}

function drawDinoPark(ctx, rect) {
  // sandy ground, a little pond, palms, a fence and a sign
  rect(ctx, '#e0c080', 2, 60, 92, 20);
  rect(ctx, '#ecd098', 2, 60, 92, 2);
  rect(ctx, '#3a8ac0', 56, 70, 22, 6);
  rect(ctx, '#8ad0f0', 58, 70, 18, 2);
  palm(ctx, rect, 14, 70, 34);
  palm(ctx, rect, 80, 68, 28);
  // a nest with a speckled egg
  rect(ctx, '#7a5230', 30, 72, 16, 5);
  rect(ctx, '#a0703c', 29, 71, 18, 2);
  rect(ctx, OUT, 35, 64, 7, 8);
  rect(ctx, '#b8e0a0', 36, 65, 5, 7);
  rect(ctx, '#4a8a3a', 37, 67, 1, 1);
  rect(ctx, '#4a8a3a', 39, 69, 1, 1);
  // fence
  for (const y of [54, 64]) rect(ctx, '#b87a44', 0, y, 96, 3);
  for (let x = 0; x < 96; x += 12) {
    rect(ctx, OUT, x, 48, 5, 32);
    rect(ctx, '#9a5f2c', x + 1, 49, 3, 31);
  }
  // sign: a big dinosaur footprint
  rect(ctx, OUT, 46, 26, 2, 24);
  rect(ctx, OUT, 36, 20, 22, 14);
  rect(ctx, '#f4e4c1', 37, 21, 20, 12);
  rect(ctx, '#4a8a3a', 44, 26, 6, 5);
  rect(ctx, '#4a8a3a', 42, 23, 2, 3);
  rect(ctx, '#4a8a3a', 46, 22, 2, 3);
  rect(ctx, '#4a8a3a', 50, 23, 2, 3);
}

function drawWorkshop(ctx, rect) {
  // walls of toy bricks, bottom up
  const cols = ['r', 'b', 'y', 'g'];
  for (let row = 0; row < 8; row++) {
    const y = 76 - row * 5;
    const off = row % 2 ? 6 : 0;
    for (let x = 10 - off, k = 0; x < 86; x += 12, k++) {
      const x0 = Math.max(10, x);
      const w = Math.min(86, x + 12) - x0;
      if (w < 3) continue;
      const [c, hi, dark] = BRICKS[cols[(row + k) % 4]];
      rect(ctx, dark, x0, y, w, 5);
      rect(ctx, c, x0, y, w - 1, 4);
      rect(ctx, hi, x0, y, w - 1, 1);
    }
  }
  // door and windows
  rect(ctx, OUT, 40, 54, 16, 26);
  rect(ctx, '#8a5a34', 41, 55, 14, 25);
  rect(ctx, '#f5c629', 52, 67, 2, 2);
  for (const wx of [16, 66]) {
    rect(ctx, OUT, wx, 50, 14, 12);
    rect(ctx, '#ffd86b', wx + 1, 51, 12, 10);
    rect(ctx, OUT, wx + 7, 51, 1, 10);
  }
  // flat roof with giant studs, and a big spinning gear sign
  rect(ctx, OUT, 6, 36, 84, 5);
  rect(ctx, '#3a7ae0', 7, 37, 82, 3);
  for (let x = 10; x < 86; x += 12) toyBrick(ctx, rect, x, 32, 8, BRICKS.b);
  const cx = 48;
  const cy = 18;
  ctx.fillStyle = OUT;
  ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    rect(ctx, OUT, Math.round(cx + Math.cos(a) * 13) - 2, Math.round(cy + Math.sin(a) * 13) - 2, 5, 5);
    rect(ctx, '#c0c8d8', Math.round(cx + Math.cos(a) * 13) - 1, Math.round(cy + Math.sin(a) * 13) - 1, 3, 3);
  }
  ctx.fillStyle = '#c0c8d8';
  ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = OUT;
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
  rect(ctx, '#ffffff', cx - 6, cy - 7, 3, 2);
  rect(ctx, OUT, cx - 1, 29, 2, 7);
}

function drawRocket(ctx, rect, pad = true) {
  if (pad) drawPad(ctx, rect);
  drawShip(ctx, rect);
}

function drawPad(ctx, rect) {
  // launch pad
  rect(ctx, OUT, 16, 74, 64, 6);
  rect(ctx, '#8a94a8', 17, 75, 62, 4);
  rect(ctx, '#f5c629', 17, 75, 62, 1);
  // gantry tower
  rect(ctx, OUT, 72, 16, 6, 58);
  rect(ctx, '#e0403a', 73, 17, 4, 57);
  for (let y = 20; y < 74; y += 8) rect(ctx, '#f4e4c1', 73, y, 4, 2);
  rect(ctx, OUT, 60, 30, 14, 3);
}

function drawShip(ctx, rect) {
  // fins
  for (const [x, dir] of [[32, -1], [58, 1]]) {
    for (let k = 0; k < 12; k++) rect(ctx, OUT, x + dir * Math.floor(k / 2), 58 + k, 6, 1);
    for (let k = 0; k < 11; k++) rect(ctx, '#e0403a', x + 1 + dir * Math.floor(k / 2), 59 + k, 4, 1);
  }
  // body
  rect(ctx, OUT, 37, 18, 22, 56);
  rect(ctx, '#f0f0f8', 38, 19, 20, 54);
  rect(ctx, '#c8c8d8', 52, 19, 6, 54);
  rect(ctx, '#e0403a', 38, 50, 20, 4);
  // nose cone
  for (let k = 0; k < 16; k++) {
    const w = Math.max(2, 22 - Math.round((k * k) / 11));
    rect(ctx, OUT, 48 - w / 2 - 1, 17 - k, w + 2, 1);
    rect(ctx, '#e0403a', 48 - w / 2, 17 - k, w, 1);
  }
  rect(ctx, '#ff9a8a', 42, 12, 3, 4);
  // porthole
  ctx.fillStyle = OUT;
  ctx.beginPath(); ctx.arc(48, 32, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8ac0ff';
  ctx.beginPath(); ctx.arc(48, 32, 4.5, 0, Math.PI * 2); ctx.fill();
  rect(ctx, '#ffffff', 45, 29, 2, 2);
  // a star on the side
  rect(ctx, '#ffe066', 47, 40, 2, 7);
  rect(ctx, '#ffe066', 44, 43, 8, 2);
  // nozzle
  rect(ctx, OUT, 41, 72, 14, 4);
  rect(ctx, '#55505e', 42, 72, 12, 3);
}

export const DEEP_BUILDINGS = { dinopark: drawDinoPark, workshop: drawWorkshop, rocket: drawRocket };

// ---------- pets (16x12, 2 frames) ----------

const REX = [
  ['................', '.........ooooo..', '........oggggKo.', '........ogkgggoo', '........oggggwwo',
    '..oo...oggggooo.', '.ogg..ogggggo...', 'ogggoogggggpo...', '.ooggggggggoo...', '...oggggggo.....', '....ogo.ogo.....', '....oo..oo......'],
  ['................', '................', '.........ooooo..', '........oggggKo.', '........ogkgggoo',
    '..oo....oggggwwo', '.ogg..oggggooo..', 'ogggoogggggpo...', '.ooggggggggoo...', '...oggggggo.....', '...ogo...ogo....', '...oo.....oo....'],
];
const TRIKE = [
  ['................', '................', '...........w....', '.........ooow...', '..ooo...offfo.w.',
    '.obbboooffbbbo..', 'obbbbbbbfbkbbw..', '.obbbbbbbbbbbo..', '.obbbbbbbbbpo...', '..obbbbbbbbo....', '..obo.obo.obo...', '..oo..oo..oo....'],
  ['................', '...........w....', '.........ooow...', '..ooo...offfo.w.', '.obbboooffbbbo..',
    'obbbbbbbfbkbbw..', '.obbbbbbbbbbbo..', '.obbbbbbbbbpo...', '..obbbbbbbbo....', '..obo.obo.obo...', '.obo...obo..obo.', '.oo.....oo...oo.'],
];

// ---------- decorations ----------

function drawCastle(ctx, rect) {
  const rows = [['r', 'y', 'b', 'g'], ['b', 'g', 'r', 'y'], ['y', 'r', 'g', 'b']];
  rows.forEach((row, r) => row.forEach((c, i) => toyBrick(ctx, rect, i * 7, 24 - r * 4, 7, BRICKS[c])));
  for (const x of [0, 21]) {
    for (let r = 0; r < 3; r++) toyBrick(ctx, rect, x, 12 - r * 4, 7, BRICKS[['g', 'r', 'y'][r]]);
  }
  rect(ctx, OUT, 11, 20, 6, 8);
  rect(ctx, '#2a1d2e', 12, 21, 4, 7);
  rect(ctx, OUT, 3, -2 + 2, 1, 4);
  rect(ctx, '#ff7eb6', 4, 0, 4, 2);
}

function drawCar(ctx, rect) {
  toyBrick(ctx, rect, 1, 10, 18, BRICKS.r);
  toyBrick(ctx, rect, 5, 6, 10, BRICKS.b);
  rect(ctx, '#8ac0ff', 7, 7, 6, 2);
  for (const x of [4, 14]) {
    rect(ctx, OUT, x - 2, 13, 5, 5);
    rect(ctx, '#55505e', x - 1, 14, 3, 3);
    rect(ctx, '#c0c8d8', x, 15, 1, 1);
  }
}

function drawArch(ctx, rect) {
  const cols = ['r', 'y', 'g', 'b'];
  for (let k = 0; k < 7; k++) {
    const a = Math.PI - (k / 6) * Math.PI;
    const x = Math.round(13 + Math.cos(a) * 10) - 3;
    const y = Math.round(22 - Math.sin(a) * 16);
    toyBrick(ctx, rect, x, y, 6, BRICKS[cols[k % 4]]);
  }
  toyBrick(ctx, rect, 0, 26, 6, BRICKS.b);
  toyBrick(ctx, rect, 20, 26, 6, BRICKS.b);
}

const ROBOT = [
  '.....k......',
  '.....r......',
  '.oooooooooo.',
  '.obbbbbbbbo.',
  '.obwwbbwwbo.',
  '.obwkbbwkbo.',
  '.obbbbbbbbo.',
  '.obbrrrrbbo.',
  '.oooooooooo.',
  'ogoyyyyyyogo',
  'ogoyooooyogo',
  '...yyyyyy...',
  '...oy..yo...',
  '..ooo..ooo..',
];

export function drawDeepCamp(scene, canvasTexture, rect) {
  for (const [id, draw] of Object.entries(DEEP_BUILDINGS)) {
    const { tex, ctx } = canvasTexture(scene, `bld-${id}`, 96, 80);
    draw(ctx, rect);
    tex.refresh();
  }
  const strip = (key, frames, pal) => {
    const { tex, ctx } = canvasTexture(scene, key, 16 * frames.length, 12);
    frames.forEach((rows, i) => {
      drawMap(ctx, i * 16, 0, rows, pal);
      tex.add(i, 0, i * 16, 0, 16, 12);
    });
    tex.refresh();
  };
  strip('pet-rex', REX, { o: '#1a3a1a', g: '#6ac04a', k: '#1a1a1a', K: '#9ae67a', w: '#ffffff', p: '#ff9ab0' });
  strip('pet-trike', TRIKE, { o: '#4a2a10', b: '#f0a050', f: '#c86a3a', k: '#1a1a1a', w: '#fff6e0', p: '#ff9ab0' });

  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx);
    tex.refresh();
  };
  one('rocket-ship', 96, 80, (ctx) => drawShip(ctx, rect));
  one('deco-brickcastle', 28, 28, (ctx) => drawCastle(ctx, rect));
  one('deco-brickcar', 20, 18, (ctx) => drawCar(ctx, rect));
  one('deco-rainbowarch', 26, 30, (ctx) => drawArch(ctx, rect));
  one('deco-brickrobot', 12, 14, (ctx) => drawMap(ctx, 0, 0, ROBOT, { o: '#2a1d2e', b: '#5a8ad8', w: '#ffffff', k: '#2a1d2e', r: '#e0403a', y: '#ffd84a', g: '#9aa4b8' }));

  // small icons
  one('icon-lock', 10, 12, (ctx) => {
    rect(ctx, OUT, 2, 0, 6, 2);
    rect(ctx, OUT, 1, 1, 2, 5);
    rect(ctx, OUT, 7, 1, 2, 5);
    rect(ctx, OUT, 0, 5, 10, 7);
    rect(ctx, '#f5c629', 1, 6, 8, 5);
    rect(ctx, '#fff2a0', 1, 6, 8, 1);
    rect(ctx, OUT, 4, 8, 2, 2);
  });
  one('ore-heart', 10, 10, (ctx) => drawMap(ctx, 0, 1, [
    '.oo..oo...',
    'ohhoohho..',
    'ohwhhhho..',
    'ohhhhhHo..',
    '.ohhhHo...',
    '..ohHo....',
    '...oo.....',
  ].map((r) => r.slice(0, 10)), { o: '#6a1030', h: '#ff5a8a', H: '#c8205a', w: '#ffe0ea' }));
  one('icon-rocket', 12, 14, (ctx) => drawMap(ctx, 0, 0, [
    '.....oo.....',
    '....orro....',
    '...orrrro...',
    '...owwwwo...',
    '...owbbwo...',
    '...owbbwo...',
    '...owwwwo...',
    '..oowwwwoo..',
    '.orowwwworo.',
    '.orowwwworo.',
    '.oo.oyyo.oo.',
    '....oyyo....',
    '.....yy.....',
    '.....y......',
  ], { o: OUT, r: '#e0403a', w: '#f0f0f8', b: '#8ac0ff', y: '#ffb34a' }));
}
