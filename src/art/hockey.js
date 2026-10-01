// Art for Saturn's Ice Hockey (the Ice Rink): the goal nets, the giant
// snowball (now just the goal sticker's icon), the real puck, the goal lamp,
// the scoreboard, scarves and sticks for the penguins, the trophy and the
// penguins' flag, and the stickers' icons.

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

  // the real puck: a flat dark disc with a light-blue rim (12x6), and its shadow
  one('hockey-puck', 12, 6, (ctx) => {
    rect(ctx, OUT, 1, 0, 10, 6);
    rect(ctx, OUT, 0, 1, 12, 4);
    rect(ctx, '#1c2440', 1, 1, 10, 4);
    rect(ctx, '#7ad8ff', 1, 1, 10, 1);
    rect(ctx, '#c8f0ff', 3, 1, 3, 1);
    rect(ctx, '#2e3a60', 1, 4, 10, 1);
  });
  one('hockey-puck-shadow', 14, 3, (ctx) => {
    rect(ctx, 'rgba(20,30,70,0.45)', 2, 0, 10, 3);
    rect(ctx, 'rgba(20,30,70,0.45)', 0, 1, 14, 1);
  });

  // scarves to lay over a penguin (16x12 frames): 0 your team (blue), 1 theirs (red)
  one('hockey-scarf', 32, 12, (ctx, tex) => {
    [['#3a8aff', '#9fd0ff'], ['#e0403a', '#ffb0a0']].forEach(([c, stripe], f) => {
      const x = f * 16;
      rect(ctx, OUT, x + 3, 5, 8, 3);
      rect(ctx, c, x + 4, 5, 6, 2);
      rect(ctx, stripe, x + 6, 5, 1, 2);
      rect(ctx, OUT, x + 1, 6, 3, 4);
      rect(ctx, c, x + 2, 6, 1, 3);
      tex.add(f, 0, x, 0, 16, 12);
    });
  });

  // a little hockey stick (8x10): the blade points forward (right)
  one('hockey-stick', 8, 10, (ctx) => {
    for (let y = 0; y < 8; y++) rect(ctx, '#c08850', 1 + Math.floor(y / 2), y, 1, 1);
    rect(ctx, '#8a5a30', 1, 0, 1, 2);
    rect(ctx, OUT, 4, 8, 4, 2);
    rect(ctx, '#ffffff', 5, 8, 2, 1);
  });

  // the winners' trophy (16x18) and the penguins' flag (16x18)
  one('hockey-trophy', 16, 18, (ctx) => {
    rect(ctx, OUT, 2, 0, 12, 9);
    rect(ctx, '#ffd84a', 3, 1, 10, 7);
    rect(ctx, '#fff2a0', 4, 1, 2, 5);
    rect(ctx, OUT, 0, 2, 3, 4);
    rect(ctx, OUT, 13, 2, 3, 4);
    rect(ctx, '#ffd84a', 1, 3, 1, 2);
    rect(ctx, '#ffd84a', 14, 3, 1, 2);
    rect(ctx, OUT, 6, 9, 4, 4);
    rect(ctx, '#e0a020', 7, 9, 2, 4);
    rect(ctx, OUT, 3, 13, 10, 5);
    rect(ctx, '#3a8aff', 4, 14, 8, 3);
    rect(ctx, '#ffffff', 7, 15, 2, 1);
  });
  one('hockey-flag', 16, 18, (ctx) => {
    rect(ctx, OUT, 0, 0, 2, 18);
    rect(ctx, '#c0c8d8', 0, 0, 1, 18);
    rect(ctx, OUT, 2, 1, 14, 10);
    rect(ctx, '#e0403a', 2, 2, 13, 8);
    rect(ctx, '#2a2a4a', 6, 3, 6, 6);
    rect(ctx, '#ffffff', 7, 5, 4, 4);
    rect(ctx, '#ffffff', 7, 4, 1, 1);
    rect(ctx, '#ffffff', 10, 4, 1, 1);
    rect(ctx, '#ffb030', 8, 6, 2, 1);
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

  // the scoreboard (80x36): your face and score on the left, a penguin's on the right
  one('hockey-board', 80, 36, (ctx) => {
    rect(ctx, OUT, 0, 0, 80, 32);
    rect(ctx, '#1a2a5a', 2, 2, 76, 28);
    for (let x = 4; x < 78; x += 6) { rect(ctx, x % 12 === 4 ? '#9fe8ff' : '#ffffff', x, 3, 2, 2); rect(ctx, x % 12 === 4 ? '#ffffff' : '#9fe8ff', x, 27, 2, 2); }
    rect(ctx, '#2e4a8a', 39, 7, 2, 18);
    rect(ctx, OUT, 38, 32, 4, 4);
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
