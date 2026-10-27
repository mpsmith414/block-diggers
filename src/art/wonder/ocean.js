// Ocean Planet's art: the sea's tiles, clams (shut, then open with a pearl),
// the sea turtle, glowing jellyfish, the pufferfish (and puffed up), little
// fish to tint, the Giant Clam, kelp, coral, the palm tree on the island, the
// sunken ship's mast, the anglerfish with its lantern, and the waves.

import { drawMap } from '../pixelmap.js';
import { OUT, ell, blob } from './common.js';

export function drawOceanArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };
  const frames = (tex, n, w, h) => { for (let f = 0; f < n; f++) tex.add(f, 0, f * w, 0, w, h); };

  // tiles (16x16): 0 sand top, 1 deep sand, 2 rock, 3 coral rock, 4 planks, 5 grass top, 6 island sand
  one('ocean-tiles', 112, 16, (ctx, r, tex) => {
    r('#e8c878', 0, 0, 16, 16); r('#f8e0a0', 0, 0, 16, 3); r('#d0a858', 3, 8, 2, 1); r('#d0a858', 11, 12, 2, 1); r('#ff9ad0', 8, 2, 2, 1);
    r('#b08a58', 16, 0, 16, 16); r('#9a7448', 19, 4, 2, 2); r('#9a7448', 27, 10, 3, 2); r('#c8a070', 22, 13, 2, 1);
    r('#3a4a6a', 32, 0, 16, 16); r('#4a5a7a', 33, 1, 8, 6); r('#2a3a5a', 40, 9, 7, 6); r('#5a6a8a', 34, 1, 3, 1);
    r('#5a4a6a', 48, 0, 16, 16); r('#ff7a8a', 48, 0, 16, 4); r('#ffa64a', 50, 1, 3, 2); r('#ff5aa0', 58, 1, 4, 2); r('#7a5a8a', 52, 8, 4, 4);
    r('#6a4a2a', 64, 0, 16, 16); r('#5a3a1a', 64, 5, 16, 1); r('#5a3a1a', 64, 11, 16, 1); r('#7a5a3a', 64, 0, 16, 1);
    r('#3a2a1a', 68, 2, 1, 1); r('#3a2a1a', 75, 8, 1, 1); r('#4a7a5a', 70, 12, 4, 3);
    r('#f0d890', 80, 0, 16, 16); r('#5aa63c', 80, 0, 16, 4); r('#7cc95a', 80, 0, 16, 2); r('#5aa63c', 84, 4, 2, 2); r('#5aa63c', 91, 4, 2, 1);
    r('#f0d890', 96, 0, 16, 16); r('#e0c070', 99, 5, 2, 2); r('#e0c070', 106, 11, 3, 2);
    frames(tex, 7, 16, 16);
  });

  // a clam (16x12): shut, then open with a shining pearl
  one('ocean-clam', 32, 12, (ctx, r, tex) => {
    blob(ctx, 8, 8, 7, 3, '#b07ae0');
    for (let x = 3; x <= 13; x += 3) r('#d0a8ff', x, 6, 1, 4);
    r('#8a5ac0', 2, 10, 13, 1);
    // open
    blob(ctx, 24, 4, 7, 3, '#b07ae0');
    for (let x = 19; x <= 29; x += 3) r('#d0a8ff', x, 2, 1, 4);
    blob(ctx, 24, 10, 7, 1, '#b07ae0');
    ell(ctx, 24, 8, 2, 2, '#ffffff'); r('#e8e0ff', 25, 9, 1, 1);
    frames(tex, 2, 16, 12);
  });

  // the sea turtle (32x20, 2 frames: flippers forward, flippers back)
  one('ocean-turtle', 64, 20, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 32;
      // flippers
      const fy = f ? 2 : -2;
      for (const [x, y] of [[8, 12 + fy], [20, 12 - fy]]) { blob(ctx, ox + x, y, 4, 2, '#5ac08a'); }
      blob(ctx, ox + 26, 10, 4, 3, '#8ad0a0');
      r(OUT, ox + 28, 9, 1, 1);
      blob(ctx, ox + 14, 9, 10, 6, '#3a9a5a');
      for (const [x, y] of [[9, 6], [14, 5], [19, 6], [11, 10], [17, 10]]) { r('#6ad08a', ox + x, y, 3, 2); }
      r('#2a7a4a', ox + 5, 13, 18, 1);
      r(OUT, ox + 3, 9, 2, 2);
    }
    frames(tex, 2, 32, 20);
  });

  // a jellyfish (16x20, 2 frames: bell wide, bell squeezed), glowing pink
  one('ocean-jelly', 32, 20, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      const w = f ? 5 : 6;
      blob(ctx, ox + 8, 6, w, 5, '#ff9ad0');
      r('#ffd0e8', ox + 5, 3, 3, 2);
      r(OUT, ox + 6, 6, 1, 1); r(OUT, ox + 10, 6, 1, 1);
      for (const x of [4, 7, 10, 12]) { r('#ff9ad0', ox + x, 11, 1, 5 + ((x + f) % 3) * 2); }
    }
    frames(tex, 2, 16, 20);
  });

  // the pufferfish (16x16): normal, then puffed up and spiky
  one('ocean-puffer', 32, 16, (ctx, r, tex) => {
    blob(ctx, 7, 9, 5, 4, '#ffd84a');
    r(OUT, 4, 8, 1, 1); r('#ff8a2a', 1, 10, 2, 1);
    drawMap(ctx, 12, 7, ['o.', 'oo', 'o.', 'oo', 'o.'], { o: '#ffb04a' });
    blob(ctx, 24, 8, 7, 7, '#ffd84a');
    for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; r(OUT, 24 + Math.round(Math.cos(a) * 8), 8 + Math.round(Math.sin(a) * 8), 1, 1); }
    r(OUT, 21, 6, 2, 2); r(OUT, 26, 6, 2, 2); ell(ctx, 24, 11, 2, 1, '#ff8a2a');
    frames(tex, 2, 16, 16);
  });

  // a little fish (10x6), pale so it can be tinted
  one('ocean-fish', 10, 6, (ctx, r) => {
    drawMap(ctx, 0, 0, ['o..ooo....', 'oo.wwwo...', '.owwwwwko.', 'oo.wwwwo..', 'o..ooo....'], { o: OUT, w: '#ffffff', k: OUT });
  });

  // the anglerfish (28x20), its lantern glowing on a stalk
  one('ocean-angler', 28, 20, (ctx, r) => {
    r(OUT, 18, 0, 1, 7); r(OUT, 18, 0, 6, 1); ell(ctx, 24, 2, 2, 2, '#ffe066');
    blob(ctx, 12, 12, 10, 7, '#3a3a6a');
    r('#ffffff', 14, 15, 1, 2); r('#ffffff', 17, 15, 1, 2); r('#ffffff', 20, 15, 1, 2);
    r(OUT, 13, 14, 9, 1);
    ell(ctx, 16, 9, 2, 2, '#ffffff'); r(OUT, 17, 9, 1, 1);
    drawMap(ctx, 0, 8, ['o..', 'oo.', 'ooo', 'oo.', 'o..'], { o: '#2a2a5a' });
  });

  // the Giant Clam (64x44, 2 frames: shut tight, then wide open)
  one('ocean-giantclam', 128, 44, (ctx, r, tex) => {
    // shut
    blob(ctx, 32, 32, 29, 10, '#9a5ad0');
    for (let x = 8; x <= 56; x += 6) r('#c08af0', x, 25, 2, 14);
    r('#7a3ab0', 4, 40, 56, 2);
    r('#ffe066', 30, 23, 4, 2);
    // open: the lid tilted up behind, the golden glow inside
    blob(ctx, 96, 14, 28, 11, '#9a5ad0');
    for (let x = 72; x <= 120; x += 6) r('#c08af0', x, 7, 2, 14);
    blob(ctx, 96, 36, 29, 6, '#9a5ad0');
    ell(ctx, 96, 32, 22, 5, '#ffe9a0');
    ell(ctx, 96, 32, 16, 3, '#fff6d0');
    frames(tex, 2, 64, 44);
  });

  // kelp (8x40) and coral (16x20: a branchy one, a fan)
  one('ocean-kelp', 8, 40, (ctx, r) => {
    for (let y = 0; y < 40; y++) r('#3a9a4a', 3 + Math.round(Math.sin(y / 5) * 2), y, 2, 1);
    for (const y of [6, 14, 22, 30]) { r('#5ac06a', 3 + Math.round(Math.sin(y / 5) * 2) + 2, y, 3, 2); r('#5ac06a', 3 + Math.round(Math.sin((y + 4) / 5) * 2) - 3, y + 4, 3, 2); }
  });
  one('ocean-coral', 32, 20, (ctx, r, tex) => {
    // branchy pink
    for (const [x, y, h] of [[7, 6, 14], [3, 10, 8], [11, 9, 9], [5, 2, 6], [10, 4, 6]]) r('#ff6a9a', x, y, 2, h);
    r('#ff9ac0', 5, 2, 2, 1); r('#ff9ac0', 10, 4, 2, 1);
    // an orange fan
    ell(ctx, 24, 10, 7, 8, '#ff9a3a');
    for (let k = 0; k < 5; k++) r('#ffc080', 18 + k * 3, 4 + (k % 2) * 3, 1, 10);
    r('#c8661a', 23, 14, 2, 6);
    frames(tex, 2, 16, 20);
  });

  // the island's palm tree (48x64)
  one('ocean-palm', 48, 64, (ctx, r) => {
    for (let y = 18; y < 64; y++) r('#9a6a3a', 22 + Math.round(Math.sin(y / 12) * 3), y, 4, 1);
    for (let y = 22; y < 64; y += 5) r('#7a4a2a', 22 + Math.round(Math.sin(y / 12) * 3), y, 4, 1);
    for (const [dx, dy] of [[-20, 6], [20, 6], [-14, -6], [14, -6], [0, -10]]) {
      ctx.strokeStyle = '#3a9a3a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(24, 18); ctx.quadraticCurveTo(24 + dx * 0.6, 18 + dy - 8, 24 + dx, 18 + dy + 4); ctx.stroke();
    }
    ell(ctx, 21, 20, 2, 2, '#8a5a2a'); ell(ctx, 26, 21, 2, 2, '#8a5a2a');
  });

  // the sunken ship's broken mast and torn sail (32x72)
  one('ocean-mast', 32, 72, (ctx, r) => {
    r(OUT, 14, 0, 4, 72); r('#6a4a2a', 15, 0, 2, 72);
    r(OUT, 4, 10, 24, 2);
    ctx.fillStyle = 'rgba(232,224,200,0.85)';
    ctx.beginPath(); ctx.moveTo(5, 12); ctx.lineTo(27, 12); ctx.lineTo(24, 40); ctx.lineTo(18, 34); ctx.lineTo(12, 42); ctx.lineTo(6, 36); ctx.fill();
    // a pirate flag with a smile
    r(OUT, 18, 0, 10, 7); r('#2a2a3a', 19, 1, 8, 5); r('#ffffff', 21, 2, 1, 1); r('#ffffff', 24, 2, 1, 1); r('#ffffff', 21, 4, 4, 1);
  });

  // the waves along the surface (32x6), tiled and scrolled
  one('ocean-waves', 32, 6, (ctx, r) => {
    for (let x = 0; x < 32; x++) {
      const y = Math.round(2 + Math.sin((x / 32) * Math.PI * 2) * 1.5);
      r('#ffffff', x, y, 1, 1);
      r('rgba(160,230,255,0.8)', x, y + 1, 1, 6 - y);
    }
  });

  // a rising bubble (6x6)
  one('ocean-bubble', 6, 6, (ctx, r) => {
    ctx.strokeStyle = 'rgba(220,245,255,0.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(3, 3, 2.2, 0, Math.PI * 2); ctx.stroke();
    r('#ffffff', 2, 1, 1, 1);
  });
}
