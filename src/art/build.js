// Art for the Build Yard: the wooden gate (at the end of Earth camp, and at
// the yard's edge to go back), its sign with a stack of blocks, and the
// stickers' icons (the yard, a tall tower, a rainbow build, a hundred blocks).

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

// a little stack of three blocks: brick, grass, crystal
function blocks(ctx, rect, x, y, s = 4) {
  const cube = (cx, cy, c, hi) => {
    rect(ctx, OUT, cx, cy, s + 2, s + 2);
    rect(ctx, c, cx + 1, cy + 1, s, s);
    rect(ctx, hi, cx + 1, cy + 1, s, 1);
  };
  cube(x, y + s + 1, '#e0403a', '#ff8a8a');
  cube(x + s + 1, y + s + 1, '#5aa63c', '#8fd06a');
  cube(x + (s + 1) / 2, y, '#8a7fe0', '#c8c0ff');
}

export function drawBuildArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };

  // the gate (40x48): two posts, an arch, and a sign with blocks on it
  one('yard-gate', 40, 48, (ctx) => {
    for (const x of [3, 31]) {
      rect(ctx, OUT, x, 10, 6, 38);
      rect(ctx, '#a0703c', x + 1, 11, 4, 37);
      rect(ctx, '#c8904e', x + 1, 11, 1, 37);
    }
    rect(ctx, OUT, 0, 8, 40, 5);
    rect(ctx, '#c8904e', 1, 9, 38, 3);
    // the sign
    rect(ctx, OUT, 10, 0, 20, 14);
    rect(ctx, '#f4e4c1', 11, 1, 18, 12);
    blocks(ctx, rect, 14, 2, 3);
    // the little gate doors, swung open
    for (const [x, dir] of [[9, 1], [27, -1]]) {
      for (let k = 0; k < 4; k++) rect(ctx, '#c8904e', x + dir * k, 30 + k, 1, 14);
      rect(ctx, '#a0703c', x - (dir < 0 ? 3 : 0), 34, 4, 2);
      rect(ctx, '#a0703c', x - (dir < 0 ? 3 : 0), 40, 4, 2);
    }
  });

  // where your block will go: a dashed outline (16x16)
  one('build-aim', 16, 16, (ctx) => {
    for (let k = 0; k < 16; k += 4) {
      rect(ctx, '#ffffff', k, 0, 2, 1);
      rect(ctx, '#ffffff', k, 15, 2, 1);
      rect(ctx, '#ffffff', 0, k, 1, 2);
      rect(ctx, '#ffffff', 15, k, 1, 2);
    }
  });

  // stickers
  one('icon-yard', 16, 16, (ctx) => {
    rect(ctx, '#5aa63c', 0, 13, 16, 3);
    rect(ctx, OUT, 1, 3, 2, 10);
    rect(ctx, OUT, 13, 3, 2, 10);
    rect(ctx, '#a0703c', 0, 2, 16, 2);
    blocks(ctx, rect, 4, 5, 3);
  });
  one('build-tower', 16, 16, (ctx) => {
    const colours = ['#e0403a', '#ffd84a', '#5aa63c', '#4aa3ff', '#b070ff'];
    for (let k = 0; k < 5; k++) {
      rect(ctx, OUT, 5, 15 - (k + 1) * 3, 6, 3);
      rect(ctx, colours[k], 6, 15 - (k + 1) * 3 + 1, 4, 2);
    }
    drawMap(ctx, 9, 0, ['..y..', '.yyy.', 'yyyyy', '.y.y.'], { y: '#ffe066' });
  });
  one('build-rainbow', 16, 16, (ctx) => {
    const colours = ['#e0403a', '#ff8a2a', '#ffd84a', '#5aa63c', '#4aa3ff', '#b070ff'];
    colours.forEach((c, k) => {
      rect(ctx, OUT, k * 2 + 1, 4, 3, 10);
      rect(ctx, c, k * 2 + 2, 5, 1, 8);
    });
    rect(ctx, '#5aa63c', 0, 14, 16, 2);
  });
  one('build-100', 16, 16, (ctx) => {
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
      rect(ctx, OUT, 1 + x * 5, 1 + y * 5, 5, 5);
      rect(ctx, ['#e0403a', '#5aa63c', '#8a7fe0', '#ffd84a'][(x + y) % 4], 2 + x * 5, 2 + y * 5, 3, 3);
    }
  });
}
