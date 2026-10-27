// Race Planet's art: the karts (four colours, two wheel frames each), the
// start and finish banners, the boost pad, the hoop, the podium, the cheering
// crowd, and a little race tree.

import { drawMap } from '../pixelmap.js';
import { OUT, ell } from './common.js';

export const KART_COLORS = ['#e83a3a', '#3a8ae8', '#3ac05a', '#ffb02a', '#b05ae0'];

export function drawRaceArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };

  // karts (32x20): the body, a seat (the driver sits in it), two wheels; frame
  // 2c is colour c with its wheels turned one way, 2c+1 the other
  one('race-kart', 32 * KART_COLORS.length * 2, 20, (ctx, r, tex) => {
    KART_COLORS.forEach((c, ci) => {
      for (let f = 0; f < 2; f++) {
        const ox = (ci * 2 + f) * 32;
        // body
        r(OUT, ox + 2, 8, 28, 7); r(c, ox + 3, 9, 26, 5); r('rgba(255,255,255,0.4)', ox + 3, 9, 26, 1);
        r(OUT, ox + 22, 5, 9, 5); r(c, ox + 23, 6, 7, 3);
        r('#ffe066', ox + 29, 10, 2, 2); // headlight
        r(OUT, ox + 4, 4, 3, 5); r('#4a4a5a', ox + 5, 5, 1, 4); // the seat back
        r(OUT, ox + 1, 10, 3, 3); r('#ff8a3a', ox + 1, 11, 1, 1); // the exhaust
        // wheels
        for (const wx of [8, 24]) {
          ell(ctx, ox + wx, 15, 4, 4, OUT); ell(ctx, ox + wx, 15, 3, 3, '#3a3a4a'); ell(ctx, ox + wx, 15, 1, 1, '#c8d0dc');
          if (f) { r('#c8d0dc', ox + wx - 3, 15, 1, 1); r('#c8d0dc', ox + wx + 2, 15, 1, 1); } else { r('#c8d0dc', ox + wx, 12, 1, 1); r('#c8d0dc', ox + wx, 17, 1, 1); }
        }
        tex.add(ci * 2 + f, 0, ox, 0, 32, 20);
      }
    });
  });

  // banners (64x80): two posts and a banner; the start is blue, the finish is checkered
  const banner = (key, paint) => one(key, 64, 80, (ctx, r) => {
    for (const x of [2, 58]) { r(OUT, x, 10, 4, 70); r('#e8e8f0', x + 1, 10, 2, 70); }
    r(OUT, 0, 4, 64, 18);
    paint(ctx, r);
  });
  banner('race-start', (ctx, r) => {
    r('#3a8ae8', 1, 5, 62, 16);
    // three yellow arrows pointing the way
    for (const x of [16, 28, 40]) drawMap(ctx, x, 7, ['yy....', '.yy...', '..yy..', '...yy.', '..yy..', '.yy...', 'yy....'], { y: '#ffe066' });
  });
  banner('race-finish', (ctx, r) => {
    for (let y = 0; y < 4; y++) for (let x = 0; x < 15; x++) r((x + y) % 2 ? '#ffffff' : OUT, 2 + x * 4, 5 + y * 4, 4, 4);
  });

  // a boost pad (80x6): glowing chevrons
  one('race-boost', 80, 6, (ctx, r) => {
    r('#ff5aa0', 0, 0, 80, 6);
    for (let x = 2; x < 80; x += 10) drawMap(ctx, x, 0, ['yy....', '.yy...', '..yy..', '.yy...', 'yy....', '......'], { y: '#ffe066' });
  });

  // the hoop (44x64): a golden ring on a stick
  one('race-hoop', 44, 64, (ctx, r) => {
    ctx.strokeStyle = OUT; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(22, 26, 12, 24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(22, 26, 12, 24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff6c0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(22, 26, 12, 24, 0, Math.PI * 0.9, Math.PI * 1.4); ctx.stroke();
  });

  // the podium (112x40): 2nd, 1st, 3rd
  one('race-podium', 112, 40, (ctx, r) => {
    const step = (x, top, color, n) => {
      r(OUT, x, top, 36, 40 - top); r(color, x + 1, top + 1, 34, 39 - top); r('rgba(255,255,255,0.35)', x + 1, top + 1, 34, 2);
      drawMap(ctx, x + 14, top + 6, n, { o: OUT });
    };
    step(0, 16, '#d8e0ec', ['ooo.', '...o', '.oo.', 'o...', 'oooo']);
    step(38, 4, '#ffd84a', ['.o..', 'oo..', '.o..', '.o..', 'ooo.']);
    step(76, 24, '#e0985a', ['ooo.', '...o', '.oo.', '...o', 'ooo.']);
  });

  // the crowd (128x28): rows of cheering heads, waving flags
  one('race-crowd', 128, 28, (ctx, r) => {
    r('#8a5a34', 0, 18, 128, 10); r(OUT, 0, 18, 128, 1);
    const heads = ['#ffd0a8', '#c8946a', '#8a5a3a', '#ffe0c0'];
    const shirts = ['#e83a3a', '#3a8ae8', '#ffd84a', '#3ac05a', '#ff8ac8'];
    for (let i = 0; i < 16; i++) {
      const x = 4 + i * 8;
      const y = i % 2 ? 6 : 9;
      r(shirts[i % 5], x - 3, y + 6, 7, 6);
      ell(ctx, x, y + 3, 3, 3, heads[i % 4]);
      r(OUT, x - 1, y + 2, 1, 1); r(OUT, x + 1, y + 2, 1, 1);
      if (i % 4 === 1) { r(OUT, x + 3, y - 4, 1, 10); r(shirts[(i + 2) % 5], x + 4, y - 4, 5, 4); }
    }
  });

  // a round race-track tree (24x40)
  one('race-tree', 24, 40, (ctx, r) => {
    r(OUT, 10, 22, 5, 18); r('#8a5a34', 11, 22, 3, 18);
    ell(ctx, 12, 13, 11, 12, OUT); ell(ctx, 12, 13, 10, 11, '#3a9a3a'); ell(ctx, 9, 9, 4, 3, '#5ac05a');
  });
}
