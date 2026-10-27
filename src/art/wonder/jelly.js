// Jelly Planet's art: the tower's tiles (the cake at the bottom, crispy wafer
// ledges, the striped walls), wobbly jelly blocks in four colours, jelly
// beans and gummy bears (pale, to tint), the gumball, the bubblegum bubble,
// lollipops, and the Jelly Castle on top.

import { drawMap } from '../pixelmap.js';
import { OUT, ell, blob } from './common.js';

const JELLIES = [
  ['#e83a5a', '#ff7a9a', '#b82a4a'],
  ['#3ac05a', '#7ae08a', '#2a9a4a'],
  ['#ffc83a', '#ffe68a', '#d8a02a'],
  ['#9a5ad0', '#c09af0', '#7a3ab0'],
];

export function drawJellyArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };
  const frames = (tex, n, w, h) => { for (let f = 0; f < n; f++) tex.add(f, 0, f * w, 0, w, h); };

  // tiles (16x16): 0 cake, 1 wafer, 2 wall
  one('jelly-tiles', 48, 16, (ctx, r, tex) => {
    r('#f8e0c0', 0, 0, 16, 16); r('#ff8ab8', 0, 0, 16, 4); r('#ffb0d0', 0, 0, 16, 1);
    for (const x of [2, 7, 12]) r('#ff8ab8', x, 4, 2, 2);
    r('#e8c098', 0, 9, 16, 2); r('#c88a5a', 3, 12, 2, 1); r('#ff5a6a', 10, 13, 2, 2);
    // a wafer: crispy squares
    r(OUT, 16, 0, 16, 9); r('#e8b868', 17, 1, 14, 6); r('#c8904e', 17, 7, 14, 1);
    for (let x = 18; x < 31; x += 4) r('#c8904e', x, 1, 1, 6);
    r('#f8d898', 17, 1, 14, 1);
    // the walls: candy stripes
    for (let y = 0; y < 16; y++) r(['#ffffff', '#ff8ac8'][Math.floor(((y + 32) / 4)) % 2], 32, y, 16, 1);
    r(OUT, 32, 0, 1, 16); r(OUT, 47, 0, 1, 16);
    frames(tex, 3, 16, 16);
  });

  // jelly blocks (80x18, four colours): glossy, with a wobbly bottom edge
  one('jelly-block', 320, 18, (ctx, r, tex) => {
    JELLIES.forEach(([base, light, dark], f) => {
      const ox = f * 80;
      r(OUT, ox, 1, 80, 17);
      r(dark, ox + 1, 2, 78, 15);
      r(base, ox + 1, 2, 78, 11);
      r(light, ox + 3, 3, 30, 2); r(light, ox + 3, 5, 6, 2);
      r('#ffffff', ox + 4, 3, 4, 1);
      for (let x = 2; x < 78; x += 9) r(light, ox + x, 13, 3, 2);
      r(OUT, ox, 0, 80, 1);
    });
    frames(tex, 4, 80, 18);
  });

  // a jelly bean (8x6) and a gummy bear (16x16, 2 frames), pale for tinting
  one('jelly-bean', 8, 6, (ctx, r) => {
    blob(ctx, 4, 3, 3, 2, '#ffffff');
    r('#e8e8e8', 2, 4, 4, 1); r('#ffffff', 2, 1, 2, 1);
  });
  one('jelly-bear', 32, 16, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      drawMap(ctx, ox, 0, [
        '..oo....oo......',
        '.owwo..owwo.....',
        '.owwooooowwo....',
        '..owwwwwwwo.....',
        '..owkwwwkwo.....',
        '..owwwnwwwo.....',
        '...owwwwwo......',
        '..owwwwwwwo.....',
        '.owwowwwowwo....',
        '.owwowwwowwo....',
        '..owwwwwwwo.....',
        '..owwwwwwwo.....',
        f ? '..owwo.owwo.....' : '.owwo...owwo....',
        f ? '..ooo...ooo.....' : '.ooo.....ooo....',
      ], { o: '#5a3a5a', w: '#ffffff', k: OUT, n: '#ffb0c8' });
    }
    frames(tex, 2, 16, 16);
  });

  // the gumball (14x14), and the bubblegum bubble you float up in (28x28)
  one('jelly-gumball', 14, 14, (ctx, r) => {
    blob(ctx, 7, 7, 6, 6, '#ff5aa0');
    ell(ctx, 8, 8, 4, 4, '#e83a80');
    r('#ffffff', 4, 3, 3, 2); r('#ffc0e0', 4, 5, 1, 1);
  });
  one('jelly-bubble', 28, 28, (ctx) => {
    ctx.fillStyle = 'rgba(255,140,200,0.35)';
    ctx.beginPath(); ctx.arc(14, 14, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,90,160,0.9)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(14, 14, 12.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(7, 6, 3, 2); ctx.fillRect(6, 8, 1, 3);
  });

  // a lollipop (16x40)
  one('jelly-lolly', 16, 40, (ctx, r) => {
    r(OUT, 7, 14, 3, 26); r('#ffffff', 8, 14, 1, 26);
    blob(ctx, 8, 8, 6, 6, '#ffd84a');
    ctx.strokeStyle = '#ff5a6a'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let t = 0; t < 12; t += 0.2) ctx.lineTo(8 + Math.cos(t) * t * 0.45, 8 + Math.sin(t) * t * 0.45); ctx.stroke();
  });

  // the Jelly Castle (192x128): pink jelly towers with wafer tops and a big door
  one('jelly-castle', 192, 128, (ctx, r) => {
    const tower = (x, w, top) => {
      r(OUT, x, top, w, 128 - top); r('#ff7aa8', x + 1, top + 1, w - 2, 127 - top); r('#ffa8c8', x + 2, top + 2, 4, 126 - top);
      for (let k = 0; k < w; k += 8) { r(OUT, x + k, top - 6, 6, 7); r('#e8b868', x + k + 1, top - 5, 4, 5); }
      for (let y = top + 10; y < 120; y += 18) { r(OUT, x + w / 2 - 3, y, 7, 10); r('#ffe066', x + w / 2 - 2, y + 1, 5, 8); }
    };
    tower(8, 36, 24);
    tower(148, 36, 24);
    tower(44, 104, 52);
    // the middle tower with a cherry on top
    r(OUT, 80, 14, 32, 40); r('#ff5a8a', 81, 15, 30, 39);
    ell(ctx, 96, 8, 7, 7, OUT); ell(ctx, 96, 8, 6, 6, '#e0203a'); r('#ffffff', 93, 5, 2, 2); r(OUT, 96, 0, 1, 3);
    // the door
    ell(ctx, 96, 100, 14, 14, OUT); r(OUT, 82, 100, 29, 28);
    ell(ctx, 96, 100, 13, 13, '#c82a5a'); r('#c82a5a', 83, 100, 27, 28);
    r('#ffe066', 102, 112, 3, 3);
    // sprinkles
    for (const [x, y, c] of [[54, 64, '#4ab0ff'], [70, 80, '#ffe066'], [124, 70, '#6ad07a'], [134, 90, '#4ab0ff'], [60, 100, '#ffffff'], [128, 108, '#ffe066']]) r(c, x, y, 3, 1);
  });
}
