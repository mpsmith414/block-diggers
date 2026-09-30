// Art for Dino Planet's Egg Catch (the Egg Grove): the eggs (speckled,
// golden, rotten), the basket held over your head, an egg splat, the
// scoreboard, and the stickers' icons.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';
const EGG = [
  '...oooo...',
  '..oeeeeo..',
  '.oeesseeo.',
  '.oeeeeeeo.',
  'oeseeeesEo',
  'oeeeeseeEo',
  'oeeseeeeEo',
  'oeeeeeeEEo',
  '.oeeeeEEo.',
  '.oeeeEEEo.',
  '..oEEEEo..',
  '...oooo...',
];
const LOOKS = [
  { o: OUT, e: '#fff4d8', E: '#e0d0a8', s: '#5ab04a' }, // speckled
  { o: '#8a6a10', e: '#ffe066', E: '#e0a020', s: '#ffffff' }, // golden
  { o: '#2a3a1a', e: '#a8c870', E: '#7a9a4a', s: '#6a4a2a' }, // rotten
];

export function drawEggCatchArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };

  // the eggs (10x12): 0 speckled, 1 golden, 2 rotten
  one('catch-egg', 30, 12, (ctx, tex) => {
    LOOKS.forEach((pal, f) => {
      drawMap(ctx, f * 10, 0, EGG, pal);
      tex.add(f, 0, f * 10, 0, 10, 12);
    });
    rect(ctx, '#ffffff', 13, 2, 1, 2); // the golden egg's shine
  });

  // the basket (18x10), woven, held over your head
  one('basket', 18, 10, (ctx) => {
    rect(ctx, OUT, 0, 1, 18, 9);
    rect(ctx, '#c8905a', 1, 2, 16, 7);
    for (let x = 2; x < 17; x += 3) rect(ctx, '#a0703c', x, 2, 1, 7);
    rect(ctx, '#e0b070', 1, 2, 16, 1);
    rect(ctx, '#a0703c', 1, 5, 16, 1);
    rect(ctx, OUT, 0, 0, 2, 3);
    rect(ctx, OUT, 16, 0, 2, 3);
  });

  // an egg splat on the floor (16x6)
  one('egg-splat', 16, 6, (ctx) => {
    ctx.fillStyle = '#fff8e8';
    ctx.beginPath(); ctx.ellipse(8, 4, 7, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffc830';
    ctx.beginPath(); ctx.arc(8, 3.5, 2, 0, Math.PI * 2); ctx.fill();
    for (const [x, y] of [[1, 1], [14, 2], [4, 0], [12, 0]]) rect(ctx, '#e0d0a8', x, y, 1, 1);
  });

  // the scoreboard (64x36): an egg on the left, room for the number
  one('egg-board', 64, 36, (ctx) => {
    rect(ctx, OUT, 0, 0, 64, 32);
    rect(ctx, '#3a5a2a', 2, 2, 60, 28);
    for (let x = 4; x < 62; x += 6) { rect(ctx, x % 12 === 4 ? '#ffe066' : '#ff8a3a', x, 3, 2, 2); rect(ctx, x % 12 === 4 ? '#ff8a3a' : '#ffe066', x, 27, 2, 2); }
    drawMap(ctx, 11, 10, EGG, LOOKS[0]);
    rect(ctx, OUT, 30, 32, 4, 4);
  });

  // stickers: the grove (a basket with an egg), the golden egg, the rotten
  // egg (with its stink), and a star round
  one('icon-eggcatch', 16, 16, (ctx) => {
    drawMap(ctx, 3, 0, EGG, LOOKS[0]);
    rect(ctx, OUT, 0, 7, 16, 9);
    rect(ctx, '#c8905a', 1, 8, 14, 7);
    for (let x = 2; x < 15; x += 3) rect(ctx, '#a0703c', x, 8, 1, 7);
    rect(ctx, '#e0b070', 1, 8, 14, 1);
  });
  one('egg-golden-icon', 16, 16, (ctx) => {
    drawMap(ctx, 3, 2, EGG, LOOKS[1]);
    rect(ctx, '#ffffff', 6, 4, 1, 2);
    for (const [x, y] of [[1, 3], [14, 5], [2, 12], [13, 12]]) rect(ctx, '#ffe066', x, y, 1, 1);
  });
  one('egg-rotten-icon', 16, 16, (ctx) => {
    drawMap(ctx, 3, 4, EGG, LOOKS[2]);
    for (const x of [3, 7, 11]) for (let k = 0; k < 4; k++) rect(ctx, '#9ac870', x + (k % 2), k, 1, 1);
  });
  one('egg-star', 16, 16, (ctx) => {
    drawMap(ctx, 0, 1, [
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
    drawMap(ctx, 8, 5, EGG.slice(0, 10).map((r) => r.slice(0, 8)), LOOKS[0]);
  });
}
