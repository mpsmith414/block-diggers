// Art for the Moon: moon blobs, the flag you plant, the Earth in the sky,
// moon cheese, and the countdown's big flames.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

const BLOB = [
  ['................', '.......a........', '.......A........', '.....oooooo.....', '...oollllllloo..',
    '..olllllllllllo.', '.olllwkllwklllo.', '.ollllllllllllo.', '.olllppllpplllo.', '.olllllllllllllo', '..ollllllllllo..', '...oooooooooo...'],
  ['................', '................', '........a.......', '........A.......', '....ooooooooo...',
    '..oolllllllllo..', '.olllwkllwkllllo', '.ollllllllllllo.', 'olllllppllplllllo', 'olllllllllllllo.', '.oollllllllloo..', '...ooooooooo....'],
].map((rows) => rows.map((r) => r.slice(0, 16)));

export function drawMoonArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
    return tex;
  };

  // moon blob: a soft squishy lilac alien (2 frames, walks like a slime)
  one('moonblob', 32, 12, (ctx, tex) => {
    BLOB.forEach((rows, i) => {
      drawMap(ctx, i * 16, 0, rows, { o: '#4a3a6a', l: '#c8b8f0', w: '#ffffff', k: OUT, p: '#ff9ac8', a: '#ffe066', A: '#8a7ab0' });
      tex.add(i, 0, i * 16, 0, 16, 12);
    });
  });

  // the flag you plant on the Moon
  one('moon-flag', 16, 24, (ctx) => {
    rect(ctx, '#d4dce6', 2, 1, 2, 23);
    rect(ctx, '#8a94a8', 3, 1, 1, 23);
    // the diggers' own flag: a gold star on pink
    rect(ctx, OUT, 4, 1, 12, 9);
    rect(ctx, '#ff7eb6', 4, 2, 11, 7);
    rect(ctx, '#ffd1e6', 4, 2, 11, 1);
    rect(ctx, '#ffe066', 9, 3, 1, 5);
    rect(ctx, '#ffe066', 7, 5, 5, 1);
    rect(ctx, '#ffe066', 8, 4, 3, 3);
    rect(ctx, '#fffbe0', 9, 5, 1, 1);
  });

  // the Earth, seen from the Moon (also the Earth-rise sticker)
  one('earth', 32, 32, (ctx) => {
    ctx.fillStyle = 'rgba(140,200,255,0.25)';
    ctx.beginPath(); ctx.arc(16, 16, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a6ad0';
    ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4ab04a';
    for (const [x, y, r] of [[10, 10, 5], [13, 14, 4], [21, 20, 5], [22, 9, 3], [8, 21, 3]]) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [x, y, w] of [[6, 7, 7], [16, 16, 8], [9, 25, 9], [20, 5, 5]]) rect(ctx, 'rgba(255,255,255,0.85)', x, y, w, 2);
    // night side
    ctx.fillStyle = 'rgba(10,10,40,0.35)';
    ctx.beginPath(); ctx.arc(21, 19, 13, 0, Math.PI * 2); ctx.fill();
  });

  // moon cheese: a yellow wedge with holes
  one('ore-cheese', 10, 10, (ctx) => drawMap(ctx, 0, 0, [
    '..........',
    '.......oo.',
    '.....ooyyo',
    '...ooyyyyo',
    '.ooyyhyyyo',
    'oyyyyyyhyo',
    'oyhyyyyyyo',
    'oyyyyyhyyo',
    'oYYYYYYYYo',
    'oooooooooo',
  ], { o: '#8a6a10', y: '#ffd84a', Y: '#e0b030', h: '#d09a20' }));

  // big launch flames (3 frames, 24x28)
  one('rocket-flame', 72, 28, (ctx, tex) => {
    for (let f = 0; f < 3; f++) {
      const ox = f * 24;
      const len = [22, 27, 18][f];
      for (let y = 0; y < len; y++) {
        const w = Math.max(1, Math.round(12 * (1 - y / len) + (f === 1 ? 1 : 0)));
        rect(ctx, '#ff6a2a', ox + 12 - w / 2 - 1, y, w + 2, 1);
        rect(ctx, '#ffb34a', ox + 12 - w / 2, y, w, 1);
        if (w > 4) rect(ctx, '#fff2a0', ox + 12 - w / 4, y, w / 2, 1);
      }
      tex.add(f, 0, ox, 0, 24, 28);
    }
  });
}
