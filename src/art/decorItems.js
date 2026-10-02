// Camp decorations you can buy and place, plus the hand and heart icons.

import { drawMap } from './pixelmap.js';

const OUT = '#3a2a24';

export function drawDecorItems(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx);
    tex.refresh();
  };

  one('deco-lamp', 10, 28, (ctx) => {
    rect(ctx, OUT, 4, 8, 2, 20);
    rect(ctx, '#55505e', 3, 26, 4, 2);
    rect(ctx, OUT, 1, 0, 8, 9);
    rect(ctx, '#ffd86b', 2, 2, 6, 6);
    rect(ctx, '#fff4c0', 3, 3, 2, 2);
    rect(ctx, OUT, 2, 0, 6, 1);
  });
  one('deco-crystallamp', 10, 24, (ctx) => {
    rect(ctx, OUT, 4, 10, 2, 14);
    rect(ctx, '#55505e', 3, 22, 4, 2);
    drawMap(ctx, 1, 0, [
      '...oo...',
      '..oxxo..',
      '.oxXxxo.',
      '.oxxXxo.',
      '.oxxxxo.',
      '..oxxo..',
      '...oo...',
    ], { o: '#2a1d4a', x: '#b98cff', X: '#f0e0ff' });
    rect(ctx, '#9a7ab8', 3, 7, 4, 3);
  });
  one('deco-fence', 16, 12, (ctx) => {
    for (const x of [1, 7, 13]) { rect(ctx, OUT, x, 0, 3, 12); rect(ctx, '#c8904e', x + 1, 1, 1, 11); }
    rect(ctx, '#9a5f2c', 0, 3, 16, 2);
    rect(ctx, '#9a5f2c', 0, 8, 16, 2);
  });
  one('deco-flowerbed', 24, 10, (ctx) => {
    rect(ctx, OUT, 0, 5, 24, 5);
    rect(ctx, '#6b4424', 1, 6, 22, 3);
    const colors = ['#ff7eb6', '#ffd84a', '#8ec5ff', '#ffffff', '#ff9a3a'];
    for (let i = 0; i < 6; i++) {
      const x = 2 + i * 4;
      rect(ctx, '#3d8a48', x + 1, 2, 1, 4);
      rect(ctx, colors[i % colors.length], x, 0, 3, 3);
      rect(ctx, '#fff6c0', x + 1, 1, 1, 1);
    }
  });
  one('deco-bench', 22, 12, (ctx) => {
    rect(ctx, OUT, 0, 0, 22, 3);
    rect(ctx, '#b87a44', 1, 1, 20, 1);
    rect(ctx, OUT, 0, 5, 22, 3);
    rect(ctx, '#c8904e', 1, 6, 20, 1);
    for (const x of [2, 18]) rect(ctx, OUT, x, 8, 2, 4);
    rect(ctx, OUT, 3, 3, 2, 2);
    rect(ctx, OUT, 17, 3, 2, 2);
  });
  one('deco-pumpkin', 16, 12, (ctx) => drawMap(ctx, 0, 0, [
    '.......gg.......',
    '......gg........',
    '...oooooooooo...',
    '..ooOOoOOoOOoo..',
    '.oOOoOOoOOoOOOo.',
    '.oOoOOoOOoOOoOo.',
    '.oOoOOoOOoOOoOo.',
    '.oOoOOoOOoOOoOo.',
    '.oOOoOOoOOoOOOo.',
    '..ooOOoOOoOOoo..',
    '...oooooooooo...',
    '................',
  ], { o: '#8a3a10', O: '#f08a2a', g: '#3d8a48' }));
  one('deco-mailbox', 10, 18, (ctx) => {
    rect(ctx, OUT, 4, 8, 2, 10);
    rect(ctx, OUT, 0, 1, 10, 8);
    rect(ctx, '#4a92b8', 1, 2, 8, 6);
    rect(ctx, '#8ec5ff', 1, 2, 8, 1);
    rect(ctx, '#e0503a', 8, 0, 2, 4);
    rect(ctx, OUT, 3, 4, 4, 1);
  });
  one('deco-pond', 32, 8, (ctx) => {
    ctx.fillStyle = '#5a7a4a';
    ctx.beginPath(); ctx.ellipse(16, 4, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a92b8';
    ctx.beginPath(); ctx.ellipse(16, 4, 14, 3, 0, 0, Math.PI * 2); ctx.fill();
    rect(ctx, '#bfe8ff', 8, 3, 5, 1);
    rect(ctx, '#bfe8ff', 20, 5, 3, 1);
    rect(ctx, '#3d8a48', 25, 2, 4, 2);
  });
  one('deco-windmill', 24, 40, (ctx) => {
    for (let y = 0; y < 30; y++) {
      const w = 8 + Math.floor(y / 3);
      rect(ctx, OUT, 12 - w / 2 - 1, 10 + y, w + 2, 1);
      rect(ctx, y % 6 < 3 ? '#e8c89a' : '#d4b080', 12 - w / 2, 10 + y, w, 1);
    }
    rect(ctx, '#8a5a34', 10, 32, 4, 8);
    rect(ctx, '#ffd86b', 11, 20, 2, 3);
    rect(ctx, OUT, 7, 6, 10, 5);
    rect(ctx, '#c94c45', 8, 7, 8, 3);
  });
  one('deco-blades', 24, 24, (ctx) => {
    for (let k = 0; k < 4; k++) {
      ctx.save();
      ctx.translate(12, 12);
      ctx.rotate((Math.PI / 2) * k);
      ctx.fillStyle = OUT;
      ctx.fillRect(-1, -12, 3, 12);
      ctx.fillStyle = '#fff6e0';
      ctx.fillRect(1, -11, 4, 9);
      ctx.restore();
    }
    rect(ctx, OUT, 10, 10, 4, 4);
  });
  one('fish', 5, 3, (ctx) => { rect(ctx, '#ff9a3a', 0, 0, 4, 3); rect(ctx, '#ff9a3a', 4, 1, 1, 1); });
  one('icon-hand', 12, 12, (ctx) => drawMap(ctx, 0, 0, [
    '....oo......',
    '...osso.....',
    '...osso.....',
    '...ossoooo..',
    '.oooossossoo',
    'ossoossossso',
    'osssssssssso',
    'osssssssssso',
    '.osssssssso.',
    '..osssssso..',
    '...oooooo...',
    '............',
  ], { o: OUT, s: '#f2c29b' }));
  one('heart', 9, 8, (ctx) => drawMap(ctx, 0, 0, [
    '.oo...oo.',
    'orroorrro',
    'orRrrrrro',
    'orrrrrrro',
    '.orrrrro.',
    '..orrro..',
    '...oro...',
    '....o....',
  ], { o: '#7a1f3a', r: '#ff5a8a', R: '#ffd0e0' }));
}

// Where each decoration sits: its texture and how it stands on the ground.
export const DECOR_LOOK = {
  lamp: { key: 'deco-lamp', glow: 0xffc860, glowY: 24, nightOnly: true },
  crystallamp: { key: 'deco-crystallamp', glow: 0xb98cff, glowY: 20, nightOnly: false },
  fence: { key: 'deco-fence' },
  flowerbed: { key: 'deco-flowerbed' },
  bench: { key: 'deco-bench' },
  pumpkin: { key: 'deco-pumpkin' },
  mailbox: { key: 'deco-mailbox' },
  pond: { key: 'deco-pond', sink: 2 },
  windmill: { key: 'deco-windmill' },
  brickcastle: { key: 'deco-brickcastle' },
  brickcar: { key: 'deco-brickcar' },
  rainbowarch: { key: 'deco-rainbowarch' },
  brickrobot: { key: 'deco-brickrobot' },
  // Rainbow Village's (drawn in rainbowShops.js)
  candytree: { key: 'deco-candytree' },
  lollipop: { key: 'deco-lollipop' },
  gumdrop: { key: 'deco-gumdrop' },
  canefence: { key: 'deco-canefence' },
  fountain: { key: 'deco-fountain' },
  cloudlamp: { key: 'deco-cloudlamp', glow: 0xfff0a0, glowY: 22, nightOnly: true },
  icecream: { key: 'deco-icecream' },
  dinostatue: { key: 'deco-dinostatue' },
  balloons: { key: 'deco-balloons' },
  gempile: { key: 'deco-gempile', glow: 0xff9ad0, glowY: 6, nightOnly: true },
  jellypond: { key: 'deco-jellypond', sink: 2 },
  cupcake: { key: 'deco-cupcake' },
};
export const decorLook = (id) => DECOR_LOOK[id] ?? { key: id, scale: 1.5 };
