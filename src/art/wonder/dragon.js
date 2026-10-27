// Dragon Planet's art: the islands' tiles and the cloud sea, the baby
// dragons (green and blue, wings up and down), a fireball, balloons (pale,
// to tint), a golden ring, waterfalls, a little castle, Mama Dragon (asleep,
// then awake) and her nest.

import { drawMap } from '../pixelmap.js';
import { OUT, ell, blob } from './common.js';

const DRAGONS = [
  { body: '#3ac05a', belly: '#c8f0a0', wing: '#2a9a4a', spikes: '#ffb02a' },
  { body: '#4a9ae8', belly: '#c8e8ff', wing: '#2a6ac0', spikes: '#ff8ac8' },
];

export function drawDragonArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };
  const frames = (tex, n, w, h) => { for (let f = 0; f < n; f++) tex.add(f, 0, f * w, 0, w, h); };

  // tiles (16x16): 0 grass top, 1 earth, 2 underside, 3 cloud sea
  one('dragon-tiles', 64, 16, (ctx, r, tex) => {
    r('#8a5a34', 0, 0, 16, 16); r('#5aa63c', 0, 0, 16, 6); r('#7cc95a', 0, 0, 16, 2);
    for (const x of [2, 7, 12]) r('#5aa63c', x, 6, 2, 2);
    r('#ffe066', 5, 1, 1, 1); r('#ff8ac8', 11, 2, 1, 1);
    r('#8a5a34', 16, 0, 16, 16); r('#6a4224', 19, 4, 3, 2); r('#6a4224', 26, 10, 2, 2); r('#a8703a', 22, 13, 2, 1);
    r('#6a4224', 32, 0, 16, 16); r('#5a3a1a', 34, 6, 3, 2); r('#7a5228', 40, 2, 4, 1);
    r('#ffffff', 48, 0, 16, 16); ell(ctx, 52, 3, 4, 3, '#ffffff'); r('#e8f2ff', 48, 8, 16, 8); r('#d8e8f8', 53, 11, 4, 1);
    frames(tex, 4, 16, 16);
  });

  // baby dragons (32x24, 2 colours x wings up / wings down); the rider sits on the back
  one('dragon-baby', 128, 24, (ctx, r, tex) => {
    DRAGONS.forEach((c, ci) => {
      for (let f = 0; f < 2; f++) {
        const ox = (ci * 2 + f) * 32;
        // tail
        drawMap(ctx, ox, 12, ['ooo.....', 'obboo...', '.oobbo..', '...oooo.'], { o: OUT, b: c.body });
        // wing (behind)
        if (f === 0) drawMap(ctx, ox + 8, 0, ['....oo..', '...owwo.', '..owwwo.', '.owwwwo.', 'owwwwwo.', '.ooowwo.', '....oo..'], { o: OUT, w: c.wing });
        // body
        blob(ctx, ox + 15, 15, 8, 5, c.body);
        ell(ctx, ox + 16, 17, 6, 2, c.belly);
        for (const x of [10, 14, 18]) r(c.spikes, ox + x, 9, 2, 2);
        // head
        blob(ctx, ox + 26, 10, 5, 4, c.body);
        r(OUT, ox + 27, 8, 2, 2); r('#ffffff', ox + 27, 8, 1, 1);
        r(OUT, ox + 30, 11, 1, 1);
        r(c.spikes, ox + 23, 5, 2, 2); r(c.spikes, ox + 26, 4, 2, 2);
        // legs
        r(OUT, ox + 11, 19, 3, 4); r(OUT, ox + 18, 19, 3, 4);
        // wing (down)
        if (f === 1) drawMap(ctx, ox + 9, 15, ['owwwwwwo', '.owwwwo.', '..owwo..', '...oo...'], { o: OUT, w: c.wing });
        tex.add(ci * 2 + f, 0, ox, 0, 32, 24);
      }
    });
  });

  // a fireball (14x10, 2 frames)
  one('dragon-fire', 28, 10, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 14;
      ell(ctx, ox + 9, 5, 4, 4, '#ff5a1a');
      ell(ctx, ox + 9, 5, 3, 3, '#ffb02a');
      ell(ctx, ox + 10, 5, 1, 1, '#fff6c0');
      for (let k = 0; k < 4; k++) r(k % 2 ? '#ffb02a' : '#ff5a1a', ox + 1 + k * 2, 3 + ((k + f) % 3), 2, 2);
    }
    frames(tex, 2, 14, 10);
  });

  // a balloon (12x22), pale for tinting, with a string
  one('dragon-balloon', 12, 22, (ctx, r) => {
    blob(ctx, 6, 6, 4, 5, '#ffffff');
    r('#e8e8f0', 7, 8, 2, 2); r('#ffffff', 4, 3, 1, 2);
    r(OUT, 5, 12, 3, 1);
    for (let y = 13; y < 22; y++) r('rgba(60,40,60,0.6)', 6 + Math.round(Math.sin(y / 2)), y, 1, 1);
  });

  // a golden ring to fly through (24x52)
  one('dragon-ring', 24, 52, (ctx) => {
    ctx.strokeStyle = OUT; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(12, 26, 8, 22, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(12, 26, 8, 22, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#fff6c0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(12, 26, 8, 22, 0, Math.PI * 0.8, Math.PI * 1.3); ctx.stroke();
  });

  // falling water (8x16), tiled and scrolled down
  one('dragon-water', 8, 16, (ctx, r) => {
    r('#8ad8ff', 0, 0, 8, 16);
    for (const [x, y] of [[1, 2], [5, 7], [2, 11], [6, 14]]) r('#ffffff', x, y, 1, 3);
  });

  // a little castle (48x56)
  one('dragon-castle', 48, 56, (ctx, r) => {
    for (const [x, w, top] of [[2, 12, 12], [34, 12, 12], [12, 24, 24]]) {
      r(OUT, x, top, w, 56 - top); r('#e8dcc8', x + 1, top + 1, w - 2, 55 - top);
      for (let k = 0; k < w; k += 4) r(OUT, x + k, top - 3, 2, 3);
    }
    for (const x of [7, 39]) { r(OUT, x - 1, 2, 2, 10); drawMap(ctx, x + 1, 2, ['rrr', 'rr.'], { r: '#ff5a6a' }); }
    ell(ctx, 24, 46, 5, 5, OUT); r(OUT, 19, 46, 11, 10); ell(ctx, 24, 46, 4, 4, '#8a5a34'); r('#8a5a34', 20, 46, 9, 10);
    r('#8ad0ff', 6, 22, 4, 6); r('#8ad0ff', 38, 22, 4, 6);
  });

  // Mama Dragon (96x64, 2 frames: curled up asleep, then head up, awake)
  one('dragon-mama', 192, 64, (ctx, r, tex) => {
    const c = DRAGONS[0];
    for (let f = 0; f < 2; f++) {
      const ox = f * 96;
      // body and tail
      blob(ctx, ox + 46, 46, 30, 14, c.body);
      ell(ctx, ox + 48, 52, 24, 6, c.belly);
      drawMap(ctx, ox + 4, 44, ['oooo.......', 'obbboooo...', '.ooobbbbo..', '....ooobbo.', '.......ooo.'], { o: OUT, b: c.body });
      for (let x = 28; x < 66; x += 8) r(c.spikes, ox + x, 31, 4, 3);
      // a big folded wing
      blob(ctx, ox + 44, 38, 16, 7, c.wing);
      // the head: down on the paws asleep, up and smiling awake
      const hy = f ? 16 : 44;
      const hx = f ? 76 : 80;
      blob(ctx, ox + hx, hy, 12, 9, c.body);
      ell(ctx, ox + hx + 4, hy + 4, 7, 3, c.belly);
      r(c.spikes, ox + hx - 6, hy - 11, 3, 4); r(c.spikes, ox + hx, hy - 12, 3, 4);
      if (f) {
        ell(ctx, ox + hx + 2, hy - 2, 3, 3, OUT); r('#ffffff', ox + hx + 2, hy - 4, 1, 1);
        r(OUT, ox + hx + 4, hy + 5, 6, 1);
        // the neck
        r(c.body, ox + 64, 22, 10, 20);
      } else {
        r(OUT, ox + hx - 1, hy - 1, 5, 1); // eyes shut
        drawMap(ctx, ox + 86, 24, ['zzz.', '..z.', '.z..', 'zzz.'], { z: '#ffffff' });
      }
    }
    frames(tex, 2, 96, 64);
  });
  // her nest (80x20): woven twigs
  one('dragon-nest', 80, 20, (ctx, r) => {
    ell(ctx, 40, 12, 38, 8, OUT);
    ell(ctx, 40, 12, 37, 7, '#a8703a');
    for (let x = 6; x < 76; x += 5) r('#7a4a2a', x, 8 + (x % 3), 4, 1);
    for (let x = 4; x < 76; x += 7) r('#c8904e', x, 13 + (x % 2) * 2, 5, 1);
  });
}
