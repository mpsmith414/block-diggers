// Art for Saturn's Ice Hockey (the Ice Rink): the goal nets, the giant
// snowball puck, the goal lamp, the scoreboard, and the stickers' icons.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

export function drawHockeyArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };

  // a goal net (26x30), opening to the right: red posts, a white mesh
  one('hockey-goal', 26, 30, (ctx) => {
    for (let y = 2; y < 30; y += 4) for (let x = 2; x < 24; x += 4) rect(ctx, 'rgba(255,255,255,0.55)', x, y, 1, 1);
    for (let y = 4; y < 30; y += 4) rect(ctx, 'rgba(255,255,255,0.3)', 1, y, 23, 1);
    for (let x = 4; x < 24; x += 4) rect(ctx, 'rgba(255,255,255,0.3)', x, 1, 1, 28);
    rect(ctx, OUT, 0, 0, 26, 3);
    rect(ctx, '#e0403a', 0, 1, 25, 1);
    rect(ctx, OUT, 23, 0, 3, 30);
    rect(ctx, '#e0403a', 24, 1, 1, 29);
    rect(ctx, OUT, 0, 0, 2, 30);
    rect(ctx, '#c0c8d8', 0, 28, 26, 2);
  });

  // the puck: a giant snowball with a painted star (14x14)
  one('hockey-ball', 14, 14, (ctx) => {
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(7, 7, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(7, 7, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c8e0f0';
    ctx.beginPath(); ctx.arc(8, 8, 4, 0, Math.PI * 2); ctx.fill();
    rect(ctx, '#ffffff', 4, 4, 3, 2);
    rect(ctx, '#e0403a', 7, 5, 1, 5);
    rect(ctx, '#e0403a', 5, 7, 5, 1);
    rect(ctx, '#e0403a', 6, 6, 3, 3);
  });

  // the goal lamp: off (0) and flashing (1) (8x6)
  one('goal-lamp', 16, 6, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      rect(ctx, OUT, f * 8, 0, 8, 6);
      rect(ctx, f ? '#ff5a3a' : '#6a2a2a', f * 8 + 1, 1, 6, 4);
      if (f) rect(ctx, '#ffd0a0', f * 8 + 2, 1, 2, 2);
      tex.add(f, 0, f * 8, 0, 8, 6);
    }
  });

  // the scoreboard (64x36): a snowball on the left, room for the number
  one('hockey-board', 64, 36, (ctx) => {
    rect(ctx, OUT, 0, 0, 64, 32);
    rect(ctx, '#1a2a5a', 2, 2, 60, 28);
    for (let x = 4; x < 62; x += 6) { rect(ctx, x % 12 === 4 ? '#9fe8ff' : '#ffffff', x, 3, 2, 2); rect(ctx, x % 12 === 4 ? '#ffffff' : '#9fe8ff', x, 27, 2, 2); }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(16, 16, 7, 0, Math.PI * 2); ctx.fill();
    rect(ctx, '#e0403a', 15, 12, 2, 8);
    rect(ctx, '#e0403a', 12, 15, 8, 2);
    rect(ctx, OUT, 30, 32, 4, 4);
  });

  // stickers: the rink (a net with the puck in it), and five goals (a star of snowballs)
  one('icon-rink', 16, 16, (ctx) => {
    rect(ctx, '#9fd8f0', 0, 13, 16, 3);
    rect(ctx, '#ffffff', 0, 13, 16, 1);
    rect(ctx, OUT, 1, 2, 11, 2);
    rect(ctx, '#e0403a', 1, 2, 10, 1);
    rect(ctx, OUT, 10, 2, 2, 11);
    for (let y = 5; y < 13; y += 3) rect(ctx, 'rgba(255,255,255,0.7)', 2, y, 8, 1);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(7, 10, 3, 0, Math.PI * 2); ctx.fill();
    rect(ctx, '#e0403a', 6, 9, 2, 2);
  });
  one('hockey-five', 16, 16, (ctx) => {
    for (const [x, y] of [[8, 3], [3, 7], [13, 7], [5, 13], [11, 13]]) {
      ctx.fillStyle = OUT;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    drawMap(ctx, 6, 7, ['..y..', '.yyy.', 'yyyyy', '.y.y.'], { y: '#ffd84a' });
  });
}
