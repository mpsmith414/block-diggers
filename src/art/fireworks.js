// Art for the Sun's Firework Launcher (the Launch Deck): the balloons (four
// colours and a golden one), the firework rocket, the launch pads, the
// scoreboard, and the stickers' icons.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';
const BALLOON = [
  '...oooooo...',
  '..obbbbbbo..',
  '.obwwbbbbbo.',
  '.obwbbbbbbo.',
  'obbbbbbbbbbo',
  'obbbbbbbbbBo',
  'obbbbbbbbbBo',
  '.obbbbbbbBo.',
  '.obbbbbbBBo.',
  '..obbbbBBo..',
  '...obbBBo...',
  '....oBBo....',
  '.....oo.....',
  '....oBBo....',
  '......s.....',
  '.....s......',
  '......s.....',
  '.......s....',
];
export const BALLOON_COLORS = {
  red: ['#ff5a5a', '#c83a3a'], blue: ['#5aa8ff', '#3a78d0'], green: ['#5ae07a', '#3aa85a'], pink: ['#ff8ad0', '#d05aa8'], gold: ['#ffd84a', '#e0a020'],
};
const FRAMES = ['red', 'blue', 'green', 'pink', 'gold'];
const pal = (kind) => ({ o: OUT, b: BALLOON_COLORS[kind][0], B: BALLOON_COLORS[kind][1], w: '#ffffff', s: '#e0e8f0' });

export function drawFireworksArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };

  // the balloons (12x18): red, blue, green, pink, gold
  one('fw-balloon', 60, 18, (ctx, tex) => {
    FRAMES.forEach((kind, f) => {
      drawMap(ctx, f * 12, 0, BALLOON, pal(kind));
      tex.add(f, 0, f * 12, 0, 12, 18);
    });
  });

  // the firework rocket (6x12), nose up
  one('fw-rocket', 6, 12, (ctx) => {
    drawMap(ctx, 0, 0, ['..yy..', '.yyyy.', '.orro.', '.orwo.', '.orro.', '.orro.', '.orro.', 'oorroo', 'o.rr.o', '..oo..', '..ff..', '...f..'],
      { y: '#ffe066', o: OUT, r: '#e0403a', w: '#ffffff', f: '#ffb030' });
  });

  // a launch pad (20x10): a golden base with a tube and an arrow pointing up
  one('fw-pad', 20, 10, (ctx) => {
    rect(ctx, OUT, 0, 6, 20, 4);
    rect(ctx, '#ffd84a', 1, 7, 18, 2);
    rect(ctx, OUT, 6, 0, 8, 7);
    rect(ctx, '#55505e', 7, 1, 6, 6);
    rect(ctx, '#ffe066', 9, 2, 2, 4);
    rect(ctx, '#ffe066', 8, 3, 4, 1);
  });

  // the scoreboard (64x36): a balloon on the left, room for the number
  one('fw-board', 64, 36, (ctx) => {
    rect(ctx, OUT, 0, 0, 64, 32);
    rect(ctx, '#2a1a4a', 2, 2, 60, 28);
    for (let x = 4; x < 62; x += 6) { rect(ctx, x % 12 === 4 ? '#ffe066' : '#ff5a5a', x, 3, 2, 2); rect(ctx, x % 12 === 4 ? '#ff5a5a' : '#ffe066', x, 27, 2, 2); }
    drawMap(ctx, 10, 6, BALLOON.slice(0, 14), pal('red'));
    rect(ctx, OUT, 30, 32, 4, 4);
  });

  // stickers: the deck (a rocket and a burst), a chain of pops, a star round
  const burst = (ctx, cx, cy, r, c) => {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      rect(ctx, c, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
      rect(ctx, c, Math.round(cx + Math.cos(a) * (r - 2)), Math.round(cy + Math.sin(a) * (r - 2)), 1, 1);
    }
    rect(ctx, '#ffffff', cx, cy, 1, 1);
  };
  one('icon-fwdeck', 16, 16, (ctx) => {
    burst(ctx, 10, 5, 4, '#ffe066');
    drawMap(ctx, 2, 4, ['.yy.', 'orro', 'orro', 'orro', 'o..o', '.ff.'], { y: '#ffe066', o: OUT, r: '#e0403a', f: '#ffb030' });
    rect(ctx, '#ffd84a', 0, 13, 16, 3);
  });
  one('fw-chain', 16, 16, (ctx) => {
    burst(ctx, 4, 5, 3, '#ff5a5a');
    burst(ctx, 11, 4, 3, '#5aa8ff');
    burst(ctx, 8, 11, 3, '#5ae07a');
  });
  one('fw-star', 16, 16, (ctx) => {
    drawMap(ctx, 0, 2, [
      '.......o........',
      '......oyo.......',
      '.....oyyyo......',
      'ooooooyyyooooo..',
      '.oyyyyyyyyyyo...',
      '..oyyyyyyyyo....',
      '...oyyyyyyo.....',
      '..oyyyooyyyo....',
      '.oyyo....oyyo...',
      '.ooo......ooo...',
    ], { o: '#8a6a10', y: '#ffd84a' });
    burst(ctx, 12, 3, 3, '#ff8ad0');
  });
}
