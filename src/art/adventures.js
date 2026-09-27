// Art for the player's own ideas: the Lava Monster sticker, the Big Drink
// sticker, and the burp bubble.

import { drawMap } from './pixelmap.js';

export function drawAdventures(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx);
    tex.refresh();
  };
  one('adv-lavamonster', 16, 16, (ctx) => drawMap(ctx, 0, 0, [
    '...y......y.....',
    '..yoy....yoy....',
    '..oooooooooo....',
    '.oOOrrOOrrOOo...',
    '.oOrOOOOOOrOo...',
    'oOOyyOOOOyyOOo..',
    'oOOykOOOOykOOo..',
    'oOOOOOOOOOOOOo..',
    'oOrOkkkkkkOrOo..',
    'oOOOkwkwkwOOOo..',
    '.oOOOOOOOOOOo...',
    '.oOrOOrrOOrOo...',
    '..oOOOOOOOOo....',
    '..oOo.oo.oOo....',
    '..ooo....ooo....',
    '................',
  ], { o: '#3a1208', O: '#f06a2a', r: '#a8321a', y: '#ffe066', k: '#2a0a04', w: '#fff6c0' }));
  one('adv-drink', 16, 16, (ctx) => drawMap(ctx, 0, 0, [
    '.......o........',
    '......owo...o...',
    '.......o...owo..',
    '..oooooooooo.o..',
    '..owwwwwwwwo....',
    '..obbbbbbbbo....',
    '..obbwbbbbbo....',
    '..obbbbbwbbo....',
    '..obbbbbbbbo....',
    '..obwbbbbbbo....',
    '..obbbbbbbbo....',
    '..obbbbbbbbo....',
    '...obbbbbbo.....',
    '...oooooooo.....',
    '................',
    '................',
  ], { o: '#1a3a50', w: '#e8f8ff', b: '#4ab0e0' }));
  one('burp', 14, 14, (ctx) => {
    ctx.fillStyle = 'rgba(190, 235, 255, 0.35)';
    ctx.beginPath(); ctx.arc(7, 7, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(220, 245, 255, 0.95)';
    ctx.lineWidth = 1;
    ctx.stroke();
    rect(ctx, '#ffffff', 3, 3, 3, 2);
    rect(ctx, '#ffffff', 3, 5, 1, 1);
  });
}
