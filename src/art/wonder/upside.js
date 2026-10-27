// Upside-Down Planet's art. The ground is the ceiling here (grass fringing
// its underside, trees and a house hanging from it) and the floor is made of
// clouds. Tiles, flip pads with glowing arrows, a candy-striped floating
// block, a tree, a little house, a cow, a cloud, and the Topsy Tower.

import { drawMap } from '../pixelmap.js';
import { OUT, ell } from './common.js';

const ARROW_UP = ['...yy...', '..yyyy..', '.yyyyyy.', 'yyyyyyyy', '...yy...', '...yy...', '...yy...'];

export function drawUpsideArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };
  const frames = (tex, n, w, h) => { for (let f = 0; f < n; f++) tex.add(f, 0, f * w, 0, w, h); };

  // tiles (16x16): 0 ceiling with grass underneath, 1 ceiling inside, 2 cloud
  // floor's top, 3 cloud inside, 4 floating block, 5 floor flip pad, 6 ceiling flip pad
  one('upside-tiles', 112, 16, (ctx, r, tex) => {
    const dirt = (ox) => { r('#8a5a34', ox, 0, 16, 16); r('#6a4224', ox + 3, 3, 2, 2); r('#6a4224', ox + 10, 6, 3, 2); r('#a8703a', ox + 7, 1, 2, 1); };
    dirt(0);
    r('#5aa63c', 0, 10, 16, 6); r('#7cc95a', 0, 14, 16, 2);
    for (let x = 1; x < 16; x += 3) r('#5aa63c', x, 16 - 1, 1, 1);
    dirt(16);
    const cloud = (ox, top) => {
      r('#f4faff', ox, 0, 16, 16); r('#dce8f8', ox, 11, 16, 5);
      if (top) { r('#ffffff', ox, 0, 16, 3); ell(ctx, ox + 4, 2, 4, 2, '#ffffff'); ell(ctx, ox + 12, 2, 4, 2, '#ffffff'); }
      r('#c8d8f0', ox + 5, 8, 3, 1);
    };
    cloud(32, true);
    cloud(48, false);
    // the floating block: candy stripes
    r(OUT, 64, 0, 16, 16);
    for (let k = 0; k < 16; k++) r(['#ff8ac8', '#ffffff', '#8ad0ff', '#ffffff'][Math.floor(k / 2) % 4], 65 + Math.min(k, 13), 1, 1, 14);
    r('rgba(255,255,255,0.4)', 65, 1, 14, 2);
    // pads: a cloud with an arrow up, the ceiling with an arrow down
    cloud(80, true);
    drawMap(ctx, 84, 4, ARROW_UP, { y: '#ffd84a' });
    dirt(96);
    r('#5aa63c', 96, 10, 16, 6);
    drawMap(ctx, 100, 3, [...ARROW_UP].reverse(), { y: '#ffd84a' });
    frames(tex, 7, 16, 16);
  });

  // a tree (32x48), drawn the right way up (the scene hangs it upside down)
  one('upside-tree', 32, 48, (ctx, r) => {
    r(OUT, 13, 24, 6, 24); r('#8a5a34', 14, 24, 4, 24);
    ell(ctx, 16, 16, 14, 13, OUT); ell(ctx, 16, 16, 13, 12, '#3a9a3a');
    ell(ctx, 11, 12, 5, 4, '#5ac05a'); ell(ctx, 21, 18, 4, 3, '#5ac05a');
    for (const [x, y] of [[9, 20], [20, 9], [24, 21]]) ell(ctx, x, y, 1, 1, '#ff5a6a');
  });

  // a little house (56x56)
  one('upside-house', 56, 56, (ctx, r) => {
    for (let k = 0; k < 22; k++) { const w = 8 + k * 2.2; r(OUT, 28 - w / 2 - 1, 2 + k, w + 2, 1); r('#e0503a', 28 - w / 2, 2 + k, w, 1); }
    r(OUT, 6, 24, 44, 32); r('#fff0c8', 7, 25, 42, 31);
    r(OUT, 23, 36, 11, 20); r('#8a5a34', 24, 37, 9, 19); r('#ffd84a', 30, 46, 2, 2);
    for (const wx of [11, 37]) { r(OUT, wx, 30, 9, 9); r('#8ad0ff', wx + 1, 31, 7, 7); r(OUT, wx + 4, 31, 1, 7); }
    r(OUT, 38, 4, 6, 12); r('#a85a3a', 39, 5, 4, 11);
  });

  // a cow (32x24), standing; it moos
  one('upside-cow', 32, 24, (ctx, r) => {
    r(OUT, 4, 6, 20, 12); r('#ffffff', 5, 7, 18, 10);
    r(OUT, 8, 8, 5, 4); r(OUT, 16, 12, 4, 3); r(OUT, 19, 7, 3, 2);
    for (const x of [6, 10, 17, 21]) { r(OUT, x, 17, 3, 7); r('#ffffff', x + 1, 17, 1, 5); }
    r(OUT, 22, 2, 10, 11); r('#ffffff', 23, 3, 8, 9);
    r('#ffb0c8', 25, 8, 6, 4); r(OUT, 26, 9, 1, 1); r(OUT, 29, 9, 1, 1);
    r(OUT, 24, 5, 1, 1); r(OUT, 29, 5, 1, 1);
    r(OUT, 22, 0, 2, 3); r(OUT, 30, 0, 2, 3);
    r(OUT, 2, 6, 3, 1); r(OUT, 1, 6, 1, 6); r('#5a3a2a', 0, 11, 2, 2);
  });

  // a fluffy cloud (48x20)
  one('upside-cloud', 48, 20, (ctx) => {
    for (const [x, y, rx, ry] of [[12, 12, 10, 7], [24, 9, 12, 9], [36, 12, 10, 7]]) ell(ctx, x, y, rx, ry, '#ffffff');
    ell(ctx, 24, 15, 20, 4, '#e8f2ff');
  });

  // the Topsy Tower (64x128), drawn the right way up: a striped stone tower
  // with a pointy roof, a flag and a big door
  one('upside-tower', 64, 128, (ctx, r) => {
    r(OUT, 31, 0, 2, 14); drawMap(ctx, 33, 0, ['rrrr.', 'rrrrr', 'rrrr.'], { r: '#ff5a6a' });
    for (let k = 0; k < 34; k++) { const w = 4 + k * 1.5; r(OUT, 32 - w / 2 - 1, 12 + k, w + 2, 1); r(k % 6 < 3 ? '#9a5ad0' : '#b07ae0', 32 - w / 2, 12 + k, w, 1); }
    r(OUT, 6, 46, 52, 82); r('#e8dcc8', 7, 47, 50, 81);
    for (let y = 52; y < 128; y += 10) for (let x = 7 + ((y / 10) % 2) * 6; x < 57; x += 12) r('#d0c4a8', x, y, 10, 1);
    r(OUT, 4, 44, 56, 4); r('#ffd84a', 5, 45, 54, 2);
    // windows and the door
    for (const [x, y] of [[18, 62], [40, 62], [29, 84]]) { r(OUT, x, y, 7, 10); r('#8ad0ff', x + 1, y + 1, 5, 8); }
    ell(ctx, 32, 108, 10, 10, OUT); r(OUT, 22, 108, 21, 20);
    ell(ctx, 32, 108, 9, 9, '#8a5a34'); r('#8a5a34', 23, 108, 19, 20);
    r('#ffd84a', 37, 116, 2, 2);
  });
}
