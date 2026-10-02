// Art for Rainbow Village's shops (96x80 each): the Hat Shop (a round shop
// under a giant party hat), the Shoe Shop (a house that is a giant boot), the
// Gadget Lab (a domed lab with flasks and a spinning gear) and the Decoration
// Workshop (a candy cottage); and the twelve Rainbow Village decorations.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';
const RAINBOW = ['#ff5a6a', '#ffa64a', '#ffe066', '#6ad07a', '#4ab0ff', '#9a7aff'];

function ell(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

// A round pink shop with hats in the window, under a giant stripy party hat.
function drawHatShop(ctx, rect) {
  rect(ctx, OUT, 12, 44, 72, 36);
  rect(ctx, '#ffd8ec', 13, 45, 70, 34);
  rect(ctx, '#ffb8d8', 13, 73, 70, 6);
  // the giant party hat roof
  for (let k = 0; k < 34; k++) {
    const w = Math.round(2 + k * 1.2);
    rect(ctx, OUT, 48 - w - 1, 8 + k, w * 2 + 2, 1);
    rect(ctx, Math.floor(k / 5) % 2 ? '#ffe066' : '#ff5aa8', 48 - w, 8 + k, w * 2, 1);
  }
  rect(ctx, OUT, 6, 42, 84, 4);
  rect(ctx, '#ffffff', 7, 43, 82, 2);
  ell(ctx, 48, 6, 6, 6, OUT);
  ell(ctx, 48, 6, 5, 5, '#ffffff');
  ell(ctx, 46, 4, 2, 2, '#ffe0f0');
  // the window: three hats on stands
  rect(ctx, OUT, 16, 52, 40, 20);
  rect(ctx, '#bfe8ff', 17, 53, 38, 18);
  drawMap(ctx, 19, 56, ['..oooo..', '..okko..', '..okko..', '..orro..', 'oooooooo'], { o: OUT, k: '#2a2a3a', r: '#e0403a' });
  drawMap(ctx, 29, 55, ['...oo...', '..oyyo..', '..oppo..', '.oyyyyo.', '.oppppo.', 'oooooooo'], { o: OUT, y: '#ffe066', p: '#ff5aa8' });
  drawMap(ctx, 41, 57, ['...oo...', '..obbo..', '.obbbbo.', 'oooooooo'], { o: OUT, b: '#a8703a' });
  for (const x of [22, 32, 44]) rect(ctx, '#8a94a8', x + 1, 61, 2, 10);
  // the door
  rect(ctx, OUT, 62, 52, 16, 28);
  rect(ctx, '#ff8ab8', 63, 53, 14, 27);
  ell(ctx, 70, 60, 4, 4, '#ffffff');
  drawMap(ctx, 67, 57, ['.oooo.', '.okko.', 'oooooo'], { o: OUT, k: '#2a2a3a' });
  rect(ctx, '#ffe066', 74, 68, 2, 2);
}

// A house that is a giant red boot, with a lace-up front and round windows.
function drawShoeShop(ctx, rect) {
  // the leg of the boot (the tall part, on the left)
  rect(ctx, OUT, 14, 10, 38, 70);
  rect(ctx, '#e0503a', 15, 11, 36, 68);
  rect(ctx, '#ff8a6a', 15, 11, 4, 68);
  // the top cuff
  rect(ctx, OUT, 12, 6, 42, 8);
  rect(ctx, '#ffffff', 13, 7, 40, 6);
  // the foot, sticking out to the right
  rect(ctx, OUT, 46, 46, 44, 34);
  rect(ctx, '#e0503a', 47, 47, 42, 32);
  ell(ctx, 84, 63, 6, 16, OUT);
  ell(ctx, 83, 63, 5, 15, '#e0503a');
  // the sole
  rect(ctx, OUT, 12, 74, 82, 6);
  rect(ctx, '#ffe066', 13, 75, 80, 4);
  // laces up the front
  for (let y = 18; y < 58; y += 7) {
    rect(ctx, '#ffffff', 44, y, 10, 2);
    rect(ctx, OUT, 43, y + 2, 2, 2);
    rect(ctx, OUT, 53, y + 2, 2, 2);
  }
  // round windows and a door in the toe
  for (const [x, y] of [[28, 26], [28, 46]]) {
    ell(ctx, x, y, 6, 6, OUT);
    ell(ctx, x, y, 5, 5, '#bfe8ff');
    rect(ctx, OUT, x - 5, y, 10, 1);
  }
  rect(ctx, OUT, 62, 56, 14, 19);
  rect(ctx, '#8a4a2a', 63, 57, 12, 18);
  rect(ctx, '#ffe066', 72, 65, 2, 2);
  // a little chimney with smoke rings
  rect(ctx, OUT, 66, 36, 8, 12);
  rect(ctx, '#8a94a8', 67, 37, 6, 10);
  ell(ctx, 72, 30, 3, 2, '#ffffff');
  ell(ctx, 76, 24, 2, 2, '#ffffff');
}

// A white lab with a glass dome, bubbling flasks, a gear and a jetpack sign.
function drawGadgetLab(ctx, rect) {
  rect(ctx, OUT, 8, 38, 80, 42);
  rect(ctx, '#e8ecf4', 9, 39, 78, 40);
  rect(ctx, '#c8d0dc', 9, 72, 78, 7);
  // the dome on top, with a telescope-ish antenna
  ell(ctx, 48, 38, 26, 22, OUT);
  ell(ctx, 48, 38, 25, 21, '#9ad8ff');
  ell(ctx, 40, 30, 7, 6, '#d8f4ff');
  rect(ctx, OUT, 8, 37, 80, 3);
  rect(ctx, '#6a7488', 9, 38, 78, 1);
  rect(ctx, OUT, 47, 6, 3, 12);
  ell(ctx, 48, 5, 3, 3, '#ff5a6a');
  // the gear (on the left)
  ell(ctx, 22, 52, 9, 9, OUT);
  ell(ctx, 22, 52, 8, 8, '#ffd84a');
  for (const [dx, dy] of [[0, -10], [0, 9], [-10, 0], [9, 0]]) rect(ctx, OUT, 21 + dx, 51 + dy, 3, 3);
  ell(ctx, 22, 52, 3, 3, OUT);
  // flasks on a shelf in the window
  rect(ctx, OUT, 36, 48, 30, 18);
  rect(ctx, '#2a3a5a', 37, 49, 28, 16);
  for (const [x, c] of [[41, '#5ae07a'], [50, '#ff5aa8'], [59, '#6ab0ff']]) {
    rect(ctx, '#e8ecf4', x - 1, 52, 3, 4);
    ell(ctx, x, 60, 4, 4, '#e8ecf4');
    ell(ctx, x, 61, 3, 3, c);
    rect(ctx, '#ffffff', x - 2, 59, 1, 1);
  }
  // the door
  rect(ctx, OUT, 70, 54, 14, 26);
  rect(ctx, '#6a7488', 71, 55, 12, 25);
  rect(ctx, '#9ad8ff', 73, 58, 8, 6);
  rect(ctx, '#ffe066', 80, 68, 2, 2);
  // a little jetpack sign over the door
  drawMap(ctx, 72, 41, ['.oooooo.', 'orrooRRo', 'orrooRRo', 'oyyooyyo', '.y....y.'], { o: OUT, r: '#e0503a', R: '#e0503a', y: '#ffb34a' });
}

// A candy cottage: gingerbread walls, an icing roof with sweets, a paintbrush sign.
function drawDecoShop(ctx, rect) {
  rect(ctx, OUT, 14, 40, 68, 40);
  rect(ctx, '#c8803a', 15, 41, 66, 38);
  rect(ctx, '#a8682a', 15, 73, 66, 6);
  // the icing roof
  for (let k = 0; k < 28; k++) {
    const w = Math.round(6 + k * 1.45);
    rect(ctx, OUT, 48 - w - 1, 12 + k, w * 2 + 2, 1);
    rect(ctx, k > 23 ? '#ffffff' : '#ff9ad0', 48 - w, 12 + k, w * 2, 1);
  }
  // icing drips and sweets on the roof
  for (let x = 10; x < 88; x += 6) ell(ctx, x, 41, 2, 3, '#ffffff');
  for (const [x, y, c] of [[40, 22, RAINBOW[0]], [52, 26, RAINBOW[4]], [34, 32, RAINBOW[2]], [60, 33, RAINBOW[3]], [48, 16, RAINBOW[5]]]) {
    ell(ctx, x, y, 3, 3, OUT);
    ell(ctx, x, y, 2, 2, c);
  }
  // candy cane posts at the corners
  for (const x of [14, 78]) {
    for (let y = 44; y < 80; y++) rect(ctx, Math.floor(y / 3) % 2 ? '#ffffff' : '#e0403a', x, y, 4, 1);
  }
  // a round window with a lollipop
  ell(ctx, 32, 56, 8, 8, OUT);
  ell(ctx, 32, 56, 7, 7, '#bfe8ff');
  ell(ctx, 32, 54, 3, 3, '#ff5aa8');
  rect(ctx, '#ffffff', 32, 57, 1, 5);
  // the door: a chocolate bar
  rect(ctx, OUT, 54, 52, 16, 28);
  rect(ctx, '#6a3a1a', 55, 53, 14, 27);
  for (let y = 56; y < 78; y += 6) rect(ctx, '#8a4a2a', 56, y, 12, 1);
  rect(ctx, '#8a4a2a', 61, 53, 1, 27);
  // a paintbrush sign
  drawMap(ctx, 40, 2, ['..........ooo', '.........oyyo', 'ooooooooonyo.', 'onnnnnnnnoo..', 'ooooooooo....'], { o: OUT, n: '#c8905a', y: '#ff5aa8' });
}

export const RAINBOW_BUILDINGS = { hatshop: drawHatShop, shoeshop: drawShoeShop, gadgetlab: drawGadgetLab, decoshop: drawDecoShop };

// ---------- the twelve decorations ----------

const DECOR = {
  // a tree made of a giant swirly lollipop top
  candytree: [22, 30, (ctx, rect) => {
    rect(ctx, OUT, 9, 14, 4, 16);
    rect(ctx, '#ffffff', 10, 14, 2, 16);
    ell(ctx, 11, 10, 10, 10, OUT);
    RAINBOW.forEach((c, i) => ell(ctx, 11, 10, 9 - i * 1.5, 9 - i * 1.5, c));
    ell(ctx, 8, 6, 2, 2, '#ffffff');
  }],
  lollipop: [12, 24, (ctx, rect) => {
    rect(ctx, '#ffffff', 5, 10, 2, 14);
    ell(ctx, 6, 6, 6, 6, OUT);
    ell(ctx, 6, 6, 5, 5, '#ff5aa8');
    ell(ctx, 6, 6, 3, 3, '#ffe066');
    ell(ctx, 6, 6, 1, 1, '#ff5aa8');
  }],
  gumdrop: [14, 12, (ctx) => {
    for (const [x, y, c] of [[4, 7, '#6ad07a'], [10, 7, '#ff5a6a'], [7, 4, '#ffe066']]) {
      ell(ctx, x, y, 4, 4, OUT);
      ell(ctx, x, y, 3, 3, c);
      ell(ctx, x - 1, y - 1, 1, 1, '#ffffff');
    }
  }],
  canefence: [18, 14, (ctx, rect) => {
    for (const x of [1, 7, 13]) {
      for (let y = 4; y < 14; y++) rect(ctx, Math.floor(y / 2) % 2 ? '#ffffff' : '#e0403a', x, y, 3, 1);
      rect(ctx, '#e0403a', x, 1, 4, 2);
      rect(ctx, '#ffffff', x + 3, 2, 1, 2);
    }
    rect(ctx, '#ff9ad0', 0, 8, 18, 2);
  }],
  fountain: [30, 26, (ctx, rect) => {
    ell(ctx, 15, 22, 15, 4, OUT);
    ell(ctx, 15, 21, 14, 3, '#ff9ad0');
    ell(ctx, 15, 20, 11, 2, '#9ad8ff');
    rect(ctx, OUT, 13, 8, 4, 12);
    rect(ctx, '#ffd8ec', 14, 8, 2, 12);
    ell(ctx, 15, 8, 6, 2, OUT);
    ell(ctx, 15, 8, 5, 1, '#9ad8ff');
    for (const [x, y] of [[9, 4], [21, 4], [15, 1], [6, 10], [24, 10]]) rect(ctx, '#c8f0ff', x, y, 1, 2);
    for (const [x, y, c] of [[11, 2, RAINBOW[2]], [19, 6, RAINBOW[0]], [8, 13, RAINBOW[4]]]) rect(ctx, c, x, y, 1, 1);
  }],
  cloudlamp: [12, 28, (ctx, rect) => {
    rect(ctx, OUT, 5, 10, 2, 18);
    rect(ctx, '#ffffff', 3, 26, 6, 2);
    for (const [x, y, r] of [[3, 6, 3], [6, 4, 4], [9, 6, 3]]) ell(ctx, x, y, r + 1, r + 1, OUT);
    for (const [x, y, r] of [[3, 6, 3], [6, 4, 4], [9, 6, 3]]) ell(ctx, x, y, r, r, '#ffffff');
    ell(ctx, 6, 6, 2, 2, '#fff6a0');
  }],
  icecream: [12, 22, (ctx, rect) => {
    for (let k = 0; k < 12; k++) {
      const w = Math.max(1, 5 - Math.floor(k / 2.4));
      rect(ctx, OUT, 6 - w - 1, 10 + k, w * 2 + 2, 1);
      rect(ctx, k % 3 ? '#e0a050' : '#c8883a', 6 - w, 10 + k, w * 2, 1);
    }
    ell(ctx, 6, 8, 6, 4, OUT);
    ell(ctx, 6, 8, 5, 3, '#ff9ad0');
    ell(ctx, 6, 4, 4, 3, OUT);
    ell(ctx, 6, 4, 3, 2, '#8ae8b8');
    rect(ctx, '#e0403a', 5, 0, 2, 2);
  }],
  dinostatue: [24, 26, (ctx, rect) => {
    rect(ctx, OUT, 2, 22, 20, 4);
    rect(ctx, '#e8ecf4', 3, 23, 18, 2);
    drawMap(ctx, 2, 2, [
      '..........oooo.....',
      '.........orrrro....',
      '.........orrkro....',
      '.........orrrrro...',
      '..........ooorro...',
      '...........oyyo....',
      '..oo......oyyyo....',
      '.ogggo...ogggggo...',
      'oggggggggggggggo...',
      '.obbbbbbbbbbbbbo...',
      '..obbbbbbbbbbbo....',
      '...ovvvvvvvvvo.....',
      '....ov.ov.ov.......',
      '....oo.oo.oo.......',
    ], { o: OUT, r: RAINBOW[0], k: OUT, y: RAINBOW[2], g: RAINBOW[3], b: RAINBOW[4], v: RAINBOW[5] });
    for (const [x, y] of [[8, 9], [12, 8], [16, 9]]) rect(ctx, RAINBOW[1], x, y, 2, 2);
  }],
  balloons: [14, 30, (ctx, rect) => {
    for (const [x, y, c] of [[4, 5, RAINBOW[0]], [10, 4, RAINBOW[4]], [7, 10, RAINBOW[2]]]) {
      ctx.fillStyle = '#ffffff';
      for (let k = y + 4; k < 28; k++) ctx.fillRect(Math.round(x + (7 - x) * ((k - y) / (28 - y))), k, 1, 1);
      ell(ctx, x, y, 4, 5, OUT);
      ell(ctx, x, y, 3, 4, c);
      rect(ctx, '#ffffff', x - 1, y - 2, 1, 2);
    }
    rect(ctx, OUT, 5, 27, 5, 3);
    rect(ctx, '#ff9ad0', 6, 28, 3, 1);
  }],
  gempile: [20, 12, (ctx) => {
    const gems = [[4, 9, RAINBOW[0]], [10, 9, RAINBOW[4]], [16, 9, RAINBOW[3]], [7, 5, RAINBOW[2]], [13, 5, RAINBOW[5]], [10, 2, RAINBOW[1]]];
    for (const [x, y, c] of gems) {
      drawMap(ctx, x - 3, y - 2, ['.ooo.', 'occco', 'ocwco', '.oco.', '..o..'].map((r) => r), { o: OUT, c, w: '#ffffff' });
    }
  }],
  jellypond: [32, 8, (ctx) => {
    ell(ctx, 16, 4, 16, 4, OUT);
    ell(ctx, 16, 4, 15, 3, '#9a4ae0');
    ell(ctx, 16, 3, 12, 2, '#c890ff');
    ell(ctx, 10, 3, 2, 1, '#ffffff');
    for (const [x, c] of [[19, RAINBOW[2]], [24, RAINBOW[3]]]) ell(ctx, x, 4, 1, 1, c);
  }],
  cupcake: [26, 24, (ctx, rect) => {
    // the paper case (a little house with a door)
    for (let y = 12; y < 24; y++) {
      const w = 10 - Math.floor((y - 12) / 4);
      rect(ctx, OUT, 13 - w - 1, y, w * 2 + 2, 1);
      rect(ctx, y % 2 ? '#ffffff' : '#9ad8ff', 13 - w, y, w * 2, 1);
    }
    for (let x = 6; x < 21; x += 3) rect(ctx, '#6ab0ff', x, 12, 1, 12);
    rect(ctx, OUT, 11, 17, 5, 7);
    rect(ctx, '#c8803a', 12, 18, 3, 6);
    // the icing top and a cherry
    ell(ctx, 13, 10, 12, 5, OUT);
    ell(ctx, 13, 10, 11, 4, '#ff9ad0');
    ell(ctx, 13, 6, 7, 3, OUT);
    ell(ctx, 13, 6, 6, 2, '#ffd8ec');
    ell(ctx, 13, 2, 2, 2, '#e0403a');
    for (const [x, y, c] of [[7, 10, RAINBOW[2]], [17, 9, RAINBOW[4]], [11, 7, RAINBOW[3]], [20, 11, RAINBOW[5]]]) rect(ctx, c, x, y, 2, 1);
  }],
};

export function drawRainbowShops(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx);
    tex.refresh();
  };
  for (const [id, draw] of Object.entries(RAINBOW_BUILDINGS)) one(`bld-${id}`, 96, 80, (ctx) => draw(ctx, rect));
  for (const [id, [w, h, draw]] of Object.entries(DECOR)) one(`deco-${id}`, w, h, (ctx) => draw(ctx, rect));
}
