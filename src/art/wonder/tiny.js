// Tiny Planet's art, everything giant: the garden's tiles (soil, leaves,
// mushroom caps, cookie, the sandwich's layers, sugar cubes, the hose, the
// flower pot), a mushroom's stem, a grass blade, a daisy, the sleeping cat,
// the ladybug, an ant carrying a crumb, a strawberry, the watering can, a
// sunflower seed, and the giant sunflower (stem and head).

import { drawMap } from '../pixelmap.js';
import { OUT, ell, blob } from './common.js';

export function drawTinyArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };
  const frames = (tex, n, w, h) => { for (let f = 0; f < n; f++) tex.add(f, 0, f * w, 0, w, h); };

  // tiles (16x16): 0 soil top, 1 soil, 2 leaf, 3 mushroom cap, 4 cookie, 5 cookie
  // with a chip, 6 bread crust, 7 lettuce, 8 tomato, 9 sugar cube, 10 hose,
  // 11 flower pot, 12 the pot's rim
  one('tiny-tiles', 208, 16, (ctx, r, tex) => {
    const at = (i) => i * 16;
    r('#6a4a2a', 0, 0, 16, 16); r('#4a8a2a', 0, 0, 16, 3); r('#5aa63c', 0, 0, 16, 1); r('#8a6a4a', 4, 7, 3, 2); r('#4a3218', 11, 11, 2, 2);
    r('#6a4a2a', at(1), 0, 16, 16); r('#4a3218', at(1) + 3, 4, 2, 2); r('#8a6a4a', at(1) + 10, 9, 3, 2);
    // a leaf: a fat green ledge with a vein
    r(OUT, at(2), 2, 16, 7); r('#4ac04a', at(2), 3, 16, 5); r('#7ae07a', at(2), 3, 16, 1); r('#2a8a2a', at(2), 5, 16, 1);
    // a mushroom cap
    r(OUT, at(3), 0, 16, 10); r('#e83a3a', at(3), 1, 16, 8); r('#ff7a6a', at(3), 1, 16, 2);
    ell(ctx, at(3) + 5, 4, 2, 2, '#ffffff'); ell(ctx, at(3) + 12, 6, 1, 1, '#ffffff');
    // cookie, plain and with a chocolate chip
    for (const i of [4, 5]) {
      r('#d8a058', at(i), 0, 16, 16); r('#e8b870', at(i) + 2, 2, 4, 2); r('#c88a48', at(i) + 9, 11, 3, 2);
      if (i === 5) { ell(ctx, at(i) + 9, 6, 3, 2, '#4a2a1a'); r('#6a3a2a', at(i) + 8, 5, 2, 1); }
    }
    // the sandwich: crust, lettuce, tomato
    r('#c8783a', at(6), 0, 16, 16); r('#f0d098', at(6) + 1, 2, 14, 12); r('#e8c080', at(6) + 4, 6, 3, 2);
    r('#6ad04a', at(7), 0, 16, 16); for (let x = 0; x < 16; x += 4) r('#4aa63a', at(7) + x, 3 + (x % 8) / 2, 3, 8); r('#9ae07a', at(7), 0, 16, 2);
    r('#e83a3a', at(8), 0, 16, 16); r('#ff7a6a', at(8) + 2, 3, 12, 3); r('#ffd84a', at(8) + 4, 9, 2, 2); r('#ffd84a', at(8) + 10, 10, 2, 2);
    // a sugar cube
    r(OUT, at(9), 0, 16, 16); r('#ffffff', at(9) + 1, 1, 14, 14); r('#e8eef8', at(9) + 9, 4, 5, 10); r('#d8e0ec', at(9) + 3, 11, 2, 2);
    // the hose: a green tube
    r(OUT, at(10), 2, 16, 12); r('#3ab05a', at(10), 3, 16, 10); r('#6ad08a', at(10), 4, 16, 2); r('#2a8a4a', at(10), 11, 16, 2);
    // the flower pot and its rim (soil on top)
    r('#c8603a', at(11), 0, 16, 16); r('#e07a4a', at(11), 0, 3, 16); r('#a84a2a', at(11) + 13, 0, 3, 16);
    r(OUT, at(12), 0, 16, 16); r('#e07a4a', at(12), 4, 16, 12); r('#6a4a2a', at(12), 0, 16, 4); r('#ffa070', at(12), 4, 16, 2);
    frames(tex, 13, 16, 16);
  });

  // a mushroom's stem (16x48), standing under its cap
  one('tiny-stem', 16, 48, (ctx, r) => {
    r(OUT, 3, 0, 10, 48); r('#f8eed8', 4, 0, 8, 48); r('#e8dcc0', 9, 0, 3, 48);
    ell(ctx, 8, 46, 7, 2, '#e8dcc0');
  });

  // a giant grass blade (12x160)
  one('tiny-grass', 12, 160, (ctx, r) => {
    for (let y = 0; y < 160; y++) {
      const w = Math.max(1, Math.round(1 + (y / 160) * 9));
      const x = 6 - w / 2 + Math.sin(y / 30) * 2;
      r(y % 7 ? '#4aa63a' : '#3a8a2a', x, y, w, 1);
    }
  });

  // a daisy (48x128): a tall stem and a flower
  one('tiny-daisy', 48, 128, (ctx, r) => {
    r('#3a9a3a', 22, 30, 4, 98);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      ell(ctx, 24 + Math.round(Math.cos(a) * 13), 22 + Math.round(Math.sin(a) * 13), 6, 6, OUT);
      ell(ctx, 24 + Math.round(Math.cos(a) * 13), 22 + Math.round(Math.sin(a) * 13), 5, 5, '#ffffff');
    }
    ell(ctx, 24, 22, 9, 9, OUT); ell(ctx, 24, 22, 8, 8, '#ffd84a'); ell(ctx, 22, 20, 3, 3, '#ffe88a');
  });

  // the sleeping cat (224x96): curled ginger tabby, chin on its paws, tail round
  one('tiny-cat', 224, 96, (ctx, r) => {
    // tail
    ctx.strokeStyle = OUT; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.arc(26, 70, 22, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = '#ff9a3a'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(26, 70, 22, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
    // body
    blob(ctx, 100, 66, 76, 28, '#ff9a3a');
    for (const x of [60, 84, 108, 132]) r('#e07a1a', x, 40, 8, 18);
    ell(ctx, 104, 84, 56, 8, '#ffe0c0');
    // head, resting
    blob(ctx, 190, 64, 30, 24, '#ff9a3a');
    drawMap(ctx, 164, 30, ['oo........', 'oko.......', 'okko......', 'okkko.....'], { o: OUT, k: '#ff9a3a' });
    drawMap(ctx, 206, 30, ['......oo', '.....oko', '....okko', '...okkko'], { o: OUT, k: '#ff9a3a' });
    r('#ffb0c8', 168, 36, 3, 4); r('#ffb0c8', 211, 36, 3, 4);
    // closed eyes, a pink nose, whiskers
    r(OUT, 176, 60, 8, 2); r(OUT, 198, 60, 8, 2);
    r('#ff8ab8', 189, 68, 4, 3);
    r(OUT, 188, 74, 2, 1); r(OUT, 193, 74, 2, 1);
    for (const [x, y, w] of [[156, 70, 14], [156, 74, 14], [214, 70, 14], [214, 74, 14]]) r(OUT, x, y, w, 1);
    // paws
    blob(ctx, 172, 88, 10, 5, '#ffe0c0');
    blob(ctx, 204, 88, 10, 5, '#ffe0c0');
  });

  // a ladybug (28x20, 2 frames: shell shut, wings out flying)
  one('tiny-ladybug', 56, 20, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 28;
      if (f) { ell(ctx, ox + 8, 6, 7, 4, 'rgba(230,240,255,0.8)'); ell(ctx, ox + 18, 5, 7, 4, 'rgba(230,240,255,0.8)'); }
      blob(ctx, ox + 13, 12, 10, 7, '#e83a3a');
      r(OUT, ox + 13, 5, 1, 14);
      for (const [x, y] of [[8, 10], [10, 15], [17, 9], [18, 15]]) ell(ctx, ox + x, y, 2, 2, OUT);
      blob(ctx, ox + 24, 13, 4, 4, '#2a2a3a');
      r('#ffffff', ox + 25, 11, 1, 1);
      r(OUT, ox + 26, 6, 1, 4); r(OUT, ox + 22, 6, 1, 4);
    }
    frames(tex, 2, 28, 20);
  });

  // an ant carrying a crumb (24x16, 2 walking frames)
  one('tiny-ant', 48, 16, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 24;
      r('#d8a058', ox + 7, 0, 8, 6); r('#c88a48', ox + 9, 2, 3, 2);
      ell(ctx, ox + 5, 10, 4, 3, '#3a2a2a'); ell(ctx, ox + 11, 10, 3, 2, '#3a2a2a'); ell(ctx, ox + 17, 9, 3, 3, '#3a2a2a');
      r('#ffffff', ox + 18, 8, 1, 1);
      r('#3a2a2a', ox + 19, 4, 1, 4); r('#3a2a2a', ox + 20, 3, 2, 1);
      for (let k = 0; k < 3; k++) r('#3a2a2a', ox + 7 + k * 4 + (f ? 1 : -1) * (k % 2 ? 1 : -1), 12, 1, 4);
    }
    frames(tex, 2, 24, 16);
  });

  // a strawberry (48x52), the watering can (96x80)
  one('tiny-strawberry', 48, 52, (ctx, r) => {
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.moveTo(4, 14); ctx.quadraticCurveTo(24, 4, 44, 14); ctx.quadraticCurveTo(44, 38, 24, 52); ctx.quadraticCurveTo(4, 38, 4, 14); ctx.fill();
    ctx.fillStyle = '#e83a4a';
    ctx.beginPath(); ctx.moveTo(6, 15); ctx.quadraticCurveTo(24, 6, 42, 15); ctx.quadraticCurveTo(42, 37, 24, 49); ctx.quadraticCurveTo(6, 37, 6, 15); ctx.fill();
    for (let y = 18; y < 44; y += 6) for (let x = 10 + (y % 12) / 2; x < 40; x += 7) r('#ffe066', x, y, 2, 2);
    drawMap(ctx, 12, 2, ['..gg....gg..', '.gggg..gggg.', 'gggggggggggg', '.gg..gg..gg.'], { g: '#3ac05a' });
  });
  one('tiny-can', 96, 80, (ctx, r) => {
    ctx.strokeStyle = OUT; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(46, 22, 18, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#4ab0ff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(46, 22, 18, Math.PI, 0); ctx.stroke();
    r(OUT, 20, 28, 52, 52); r('#4ab0ff', 21, 29, 50, 51); r('#8ad0ff', 24, 29, 8, 51);
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.moveTo(70, 50); ctx.lineTo(92, 20); ctx.lineTo(96, 24); ctx.lineTo(72, 60); ctx.fill();
    r(OUT, 88, 14, 8, 10); r('#4ab0ff', 89, 15, 6, 8);
  });

  // a sunflower seed (10x12)
  one('tiny-seed', 10, 12, (ctx) => drawMap(ctx, 0, 0, [
    '...oooo...',
    '..okwkko..',
    '.okkwkkko.',
    '.okkwkkko.',
    'okkkwkkkko',
    'okkkwkkkko',
    'okkkwkkkko',
    '.okkwkkko.',
    '.okkkkkko.',
    '..okkkko..',
    '...oooo...',
  ], { o: OUT, k: '#3a3a3a', w: '#e8e8e0' }));

  // the giant sunflower: a stem piece (16x16, tiled) and the head (80x80)
  one('tiny-stalk', 16, 16, (ctx, r) => {
    r(OUT, 4, 0, 8, 16); r('#3ab05a', 5, 0, 6, 16); r('#6ad08a', 5, 0, 2, 16);
  });
  one('tiny-sunflower', 80, 80, (ctx) => {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      ell(ctx, 40 + Math.round(Math.cos(a) * 28), 40 + Math.round(Math.sin(a) * 28), 9, 9, OUT);
      ell(ctx, 40 + Math.round(Math.cos(a) * 28), 40 + Math.round(Math.sin(a) * 28), 8, 8, k % 2 ? '#ffd84a' : '#ffc02a');
    }
    ell(ctx, 40, 40, 22, 22, OUT); ell(ctx, 40, 40, 21, 21, '#6a3a1a');
    for (let k = 0; k < 40; k++) { const a = k * 2.4; const d = Math.sqrt(k) * 3.2; ctx.fillStyle = '#8a5a2a'; ctx.fillRect(Math.round(40 + Math.cos(a) * d), Math.round(40 + Math.sin(a) * d), 2, 2); }
    // a happy face
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(32, 34, 3, 3); ctx.fillRect(45, 34, 3, 3);
    ctx.fillRect(33, 46, 14, 2); ctx.fillRect(31, 44, 2, 2); ctx.fillRect(47, 44, 2, 2);
  });
}
