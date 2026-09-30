// Art for the Mars claw machine: the arcade cabinet (glass full of prizes, a
// rail for the claw, a chute on the left, a joystick and a big red button),
// the claw itself (open and closed), the golden robot prize, and its icon.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

export function drawClawArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };

  // the cabinet (144x128): the glass box is x 6..122, y 16..98; the pile's
  // shelf is at y 96; the chute is x 8..30 from y 60; the controls sit on the
  // ledge at the front, right
  one('claw-cabinet', 144, 128, (ctx) => {
    // the body
    rect(ctx, OUT, 0, 0, 144, 128);
    rect(ctx, '#c8583a', 2, 2, 140, 124);
    rect(ctx, '#a8321a', 2, 100, 140, 26);
    rect(ctx, '#e8845a', 2, 2, 140, 2);
    // the marquee: a neon claw and stars, with bulbs round it
    rect(ctx, '#3a1a4a', 6, 3, 132, 12);
    for (let x = 8; x < 136; x += 6) rect(ctx, (x / 6) % 2 ? '#ffe066' : '#ff7eb6', x, 4, 2, 2);
    for (let x = 8; x < 136; x += 6) rect(ctx, (x / 6) % 2 ? '#ff7eb6' : '#ffe066', x, 12, 2, 2);
    rect(ctx, '#3affe0', 68, 6, 8, 1);
    rect(ctx, '#3affe0', 71, 7, 2, 2);
    for (const dx of [-3, 0, 3]) rect(ctx, '#3affe0', 71 + dx, 9, 2, 2);
    for (const x of [30, 108]) { rect(ctx, '#ffe066', x, 8, 3, 1); rect(ctx, '#ffe066', x + 1, 7, 1, 3); }
    // the glass
    rect(ctx, '#1a1030', 6, 16, 116, 82);
    rect(ctx, 'rgba(160,220,255,0.16)', 6, 16, 116, 82);
    // the rail the claw hangs from
    rect(ctx, '#8a94a8', 8, 18, 112, 3);
    rect(ctx, '#c0c8d8', 8, 18, 112, 1);
    // the shelf the prizes sit on
    rect(ctx, '#6a3a24', 6, 96, 116, 2);
    // the chute: a box on the left with a funnel mouth
    rect(ctx, OUT, 7, 60, 25, 38);
    rect(ctx, '#3a2a5a', 9, 62, 21, 36);
    rect(ctx, '#ffe066', 7, 60, 25, 2);
    for (let k = 0; k < 4; k++) rect(ctx, '#ffe066', 17 + (k % 2), 70 + k * 5, 3, 2); // an arrow pointing down
    rect(ctx, '#ffe066', 15, 88, 7, 2);
    rect(ctx, '#ffe066', 17, 90, 3, 2);
    // shine on the glass
    for (let k = 0; k < 20; k++) rect(ctx, 'rgba(255,255,255,0.22)', 96 + k, 22 + k * 3, 2, 3);
    rect(ctx, 'rgba(255,255,255,0.18)', 40, 24, 2, 60);
    // the glass frame
    rect(ctx, OUT, 5, 15, 118, 1);
    rect(ctx, OUT, 5, 98, 118, 2);
    rect(ctx, OUT, 5, 15, 1, 85);
    rect(ctx, OUT, 122, 15, 1, 85);
    // the prize door (bottom left)
    rect(ctx, OUT, 8, 104, 24, 18);
    rect(ctx, '#1a1030', 10, 106, 20, 14);
    rect(ctx, '#55505e', 10, 106, 20, 4);
    // the control ledge, a joystick base and the big red button (the stick is its own sprite)
    rect(ctx, OUT, 88, 100, 54, 6);
    rect(ctx, '#e0e8f0', 89, 101, 52, 4);
    rect(ctx, OUT, 104, 97, 10, 4);
    rect(ctx, '#3a3448', 105, 98, 8, 2);
    rect(ctx, OUT, 122, 96, 10, 5);
    rect(ctx, '#e0403a', 123, 96, 8, 4);
    rect(ctx, '#ff8a8a', 124, 96, 3, 1);
    // a coin slot, and a sticker of a ruby
    rect(ctx, OUT, 60, 110, 8, 10);
    rect(ctx, '#ffd84a', 63, 112, 2, 6);
    drawMap(ctx, 90, 110, ['.oooo.', 'orrrro', 'orwrro', '.orro.', '..oo..'], { o: OUT, r: '#e0204a', w: '#ff8aa0' });
  });

  // the joystick lever (6x10), leaned by the view
  one('claw-stick', 6, 10, (ctx) => {
    rect(ctx, OUT, 0, 0, 6, 5);
    rect(ctx, '#e0403a', 1, 1, 4, 3);
    rect(ctx, '#ff8a8a', 1, 1, 2, 1);
    rect(ctx, '#55505e', 2, 5, 2, 5);
  });

  // the claw (16x14): open (0) and closed (1); its tip is at the bottom
  one('claw', 32, 14, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      rect(ctx, OUT, ox + 5, 0, 6, 5);
      rect(ctx, '#c0c8d8', ox + 6, 1, 4, 3);
      const spread = f ? 0 : 3;
      for (const side of [-1, 1]) {
        for (let k = 0; k < 8; k++) {
          const x = ox + 8 + side * (2 + Math.round((k < 5 ? k : 9 - k) * (spread + 1) / 3)) - (side < 0 ? 1 : 0);
          rect(ctx, OUT, x - 1, 5 + k, 3, 1);
          rect(ctx, '#e0e8f0', x, 5 + k, 1, 1);
        }
      }
      rect(ctx, OUT, ox + 7, 5, 2, 7);
      rect(ctx, '#e0e8f0', ox + 7, 5, 1, 6);
      tex.add(f, 0, ox, 0, 16, 14);
    }
  });

  // the golden robot (16x16): the rarest prize
  one('claw-golden', 16, 16, (ctx) => {
    drawMap(ctx, 0, 0, [
      '.......y........',
      '......yy........',
      '....oooooo......',
      '...oyyyyyyo.....',
      '...oykyykyo.....',
      '...oyyyyyyo.....',
      '...oyywwyyo.....',
      '....oooooo......',
      '..oooyyyyooo....',
      '.oyyoyYYyoyyo...',
      '.oyyoyYYyoyyo...',
      '..oo.oyyyo.oo...',
      '.....oyooyo.....',
      '.....oyooyo.....',
      '....ooo..ooo....',
      '................',
    ], { o: '#8a6a10', y: '#ffd84a', Y: '#fff6c0', k: OUT, w: '#ff8a8a' });
  });

  // the claw machine's icon (16x16): a tiny cabinet with the claw holding a prize
  one('icon-claw', 16, 16, (ctx) => {
    rect(ctx, OUT, 1, 0, 14, 16);
    rect(ctx, '#c8583a', 2, 1, 12, 14);
    rect(ctx, '#ffe066', 3, 1, 10, 2);
    rect(ctx, '#1a1030', 3, 4, 10, 8);
    rect(ctx, '#c0c8d8', 7, 4, 2, 3);
    rect(ctx, '#e0e8f0', 6, 7, 1, 2);
    rect(ctx, '#e0e8f0', 9, 7, 1, 2);
    rect(ctx, '#e0204a', 7, 8, 2, 2);
    rect(ctx, '#3affe0', 4, 11, 8, 1);
    rect(ctx, '#1a1030', 3, 13, 4, 2);
    rect(ctx, '#e0403a', 11, 13, 2, 1);
  });
}
