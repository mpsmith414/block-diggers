// Robot Planet's art: the city's tiles, the Mega Bot (48x56: standing, two
// walking frames and a jump, with a glass dome you see your character in),
// its big punching fist, the little robots (broken and grey, then fixed and
// marching, drawn pale so they can be tinted any colour), the spring pad,
// the conveyor belt's moving strip, the big gear in the sky and the Robot
// Factory.

import { drawMap } from '../pixelmap.js';
import { OUT, ell } from './common.js';

const STEEL = '#8a9ab0';
const STEEL_D = '#5a6a80';
const STEEL_L = '#c8d0dc';

export function drawRobotArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    const r = (color, x, y, ww = 1, hh = 1) => rect(ctx, color, x, y, ww, hh);
    fn(ctx, r, tex);
    tex.refresh();
  };
  const frames = (tex, n, w, h) => { for (let f = 0; f < n; f++) tex.add(f, 0, f * w, 0, w, h); };

  // tiles (16x16): 0 floor, 1 under, 2 crate, 3 scrap, 4 steel, 5 belt base, 6 girder
  one('robot-tiles', 112, 16, (ctx, r, tex) => {
    // the floor: a riveted plate with a hazard stripe along the top
    r(STEEL, 0, 0, 16, 16); r(STEEL_D, 0, 15, 16, 1); r(STEEL_L, 0, 3, 16, 1);
    for (let x = 0; x < 16; x += 4) { r('#ffd84a', x, 0, 2, 3); r(OUT, x + 2, 0, 2, 3); }
    r(STEEL_D, 3, 8, 1, 1); r(STEEL_D, 12, 8, 1, 1);
    // under the floor
    r('#4a5a70', 16, 0, 16, 16); r('#3a4a60', 16, 7, 16, 2); r('#5a6a80', 20, 2, 1, 1); r('#5a6a80', 27, 11, 1, 1);
    // a crate: orange metal with a cross brace and bolts
    r(OUT, 32, 0, 16, 16); r('#e8862a', 33, 1, 14, 14); r('#ffa64a', 33, 1, 14, 2);
    r('#b8641a', 34, 3, 12, 1); r('#b8641a', 34, 12, 12, 1);
    for (let k = 0; k < 10; k++) r('#b8641a', 35 + k, 3 + k, 2, 1);
    for (const [x, y] of [[34, 2], [45, 2], [34, 13], [45, 13]]) r('#ffe0a0', x, y, 1, 1);
    // scrap: a jumble of pipes, a gear and a wheel
    r('#6a6a7a', 48, 0, 16, 16); r(OUT, 48, 0, 16, 1);
    r('#9a5a3a', 49, 2, 10, 3); r(OUT, 49, 5, 10, 1);
    ell(ctx, 59, 10, 4, 4, '#a8a8b8'); ell(ctx, 59, 10, 2, 2, '#6a6a7a');
    r('#4ab0ff', 50, 9, 4, 6); r('#c8d0dc', 52, 6, 6, 2);
    // steel: a solid blue block
    r(OUT, 64, 0, 16, 16); r('#4a7ac8', 65, 1, 14, 14); r('#6a9ae8', 65, 1, 14, 2); r('#3a5a98', 65, 13, 14, 2);
    for (const [x, y] of [[66, 3], [77, 3], [66, 12], [77, 12]]) r('#9ac0ff', x, y, 1, 1);
    // the belt's base (the moving strip goes on top)
    r('#3a3a4a', 80, 0, 16, 16); r('#2a2a3a', 80, 6, 16, 10);
    ell(ctx, 84, 10, 3, 3, '#8a8a9a'); ell(ctx, 92, 10, 3, 3, '#8a8a9a');
    // a girder: a red I-beam with a lattice
    r(OUT, 96, 0, 16, 7); r('#e0503a', 96, 1, 16, 5);
    r('#ff7a5a', 96, 1, 16, 1);
    for (let x = 97; x < 112; x += 4) r(OUT, x, 3, 2, 1);
    frames(tex, 7, 16, 16);
  });

  // the belt's moving strip (16x6), tiled and scrolled
  one('robot-belt', 16, 6, (ctx, r) => {
    r(OUT, 0, 0, 16, 6); r('#4a4a5a', 0, 1, 16, 4);
    drawMap(ctx, 4, 1, ['y..', 'yy.', 'yyy', 'yy.'], { y: '#ffd84a' });
    drawMap(ctx, 12, 1, ['y..', 'yy.', 'yyy', 'yy.'], { y: '#ffd84a' });
  });

  // the spring pad (16x16, 2 frames: ready, squashed)
  one('robot-spring', 32, 16, (ctx, r, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      const top = f ? 9 : 2;
      r(OUT, ox + 1, top, 14, 4); r('#ff5a6a', ox + 2, top + 1, 12, 2);
      for (let y = top + 4; y < 14; y += 2) { r(OUT, ox + 4, y, 8, 1); r('#c8d0dc', ox + 5, y, 6, 1); }
      r(OUT, ox, 13, 16, 3); r(STEEL, ox + 1, 14, 14, 1);
    }
    frames(tex, 2, 16, 16);
  });

  // the Mega Bot (48x56): 0 standing, 1 and 2 walking, 3 jumping. The dome's
  // inside is see-through: your character sits behind it.
  one('robot-mech', 192, 56, (ctx, r, tex) => {
    for (let f = 0; f < 4; f++) {
      const ox = f * 48;
      // legs
      const legs = f === 1 ? [[13, 0], [27, -3]] : f === 2 ? [[13, -3], [27, 0]] : f === 3 ? [[13, -4], [27, -4]] : [[13, 0], [27, 0]];
      for (const [lx, lift] of legs) {
        r(OUT, ox + lx, 40 + lift, 8, 12); r(STEEL_D, ox + lx + 1, 40 + lift, 6, 11);
        r(OUT, ox + lx - 2, 50 + lift, 12, 6); r('#ffd84a', ox + lx - 1, 51 + lift, 10, 4);
      }
      // body
      r(OUT, ox + 6, 20, 36, 22); r(STEEL, ox + 7, 21, 34, 20); r(STEEL_L, ox + 7, 21, 34, 3); r(STEEL_D, ox + 7, 38, 34, 3);
      // a chest panel with lights
      r(OUT, ox + 16, 26, 16, 9); r('#2a2a3a', ox + 17, 27, 14, 7);
      r('#ff5a6a', ox + 18, 29, 3, 3); r('#ffd84a', ox + 23, 29, 3, 3); r('#4de3f0', ox + 28, 29, 2, 3);
      // shoulders and arms (the punching fist is its own sprite)
      for (const sx of [1, 41]) {
        r(OUT, ox + sx, 20, 7, 18); r('#4a7ac8', ox + sx + 1, 21, 5, 16); r('#6a9ae8', ox + sx + 1, 21, 5, 3);
        r(OUT, ox + sx, 36, 7, 6); r(STEEL_L, ox + sx + 1, 37, 5, 4);
      }
      // the dome: an outline and a rim; the inside is left clear
      ctx.fillStyle = OUT;
      for (let y = 0; y < 21; y++) {
        const w = Math.round(13 * Math.sqrt(Math.max(0, 1 - ((20 - y) / 20) ** 2)));
        if (w > 0) { ctx.fillRect(ox + 24 - w - 1, y, 1, 1); ctx.fillRect(ox + 24 + w, y, 1, 1); }
      }
      r(OUT, ox + 9, 19, 30, 2); r(STEEL_L, ox + 10, 19, 28, 1);
      // an antenna
      r(OUT, ox + 23, 0, 2, 2);
    }
    frames(tex, 4, 48, 56);
  });
  // the dome's glass (28x20): a faint blue with a shine, over your character
  one('robot-glass', 28, 20, (ctx) => {
    for (let y = 0; y < 20; y++) {
      const w = Math.round(13 * Math.sqrt(Math.max(0, 1 - ((19 - y) / 19) ** 2)));
      if (w > 0) { ctx.fillStyle = 'rgba(160,220,255,0.22)'; ctx.fillRect(14 - w, y, w * 2, 1); }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(7, 6, 2, 5); ctx.fillRect(9, 4, 2, 2);
  });
  // the fist (14x12)
  one('robot-fist', 14, 12, (ctx, r) => {
    r(OUT, 0, 3, 5, 6); r(STEEL_D, 0, 4, 5, 4);
    r(OUT, 4, 0, 10, 12); r('#4a7ac8', 5, 1, 8, 10); r('#6a9ae8', 5, 1, 8, 2);
    for (const y of [3, 6, 9]) r(OUT, 10, y, 3, 1);
  });

  // the little robots (16x16): 0 broken (grey, slumped, an eye out), 1 and 2
  // fixed and marching (pale, tinted their colour)
  one('robot-bot', 48, 16, (ctx, r, tex) => {
    // broken
    r(OUT, 3, 7, 11, 8); r('#6a6a72', 4, 8, 9, 6); r('#5a5a62', 4, 12, 9, 2);
    r(OUT, 4, 3, 9, 6); r('#7a7a82', 5, 4, 7, 4);
    r(OUT, 6, 5, 2, 2); r('#4a4a52', 9, 5, 2, 1);
    r(OUT, 8, 0, 1, 3); r('#4a4a52', 9, 0, 2, 1);
    r(OUT, 1, 11, 3, 4); r(OUT, 13, 12, 3, 3);
    // fixed: two marching frames
    for (let f = 1; f < 3; f++) {
      const ox = f * 16;
      r(OUT, ox + 7, 0, 2, 3); r('#ff5a6a', ox + 7, 0, 2, 1);
      r(OUT, ox + 3, 2, 10, 7); r('#ffffff', ox + 4, 3, 8, 5);
      r(OUT, ox + 5, 4, 2, 2); r(OUT, ox + 9, 4, 2, 2); r('#4de3f0', ox + 5, 4, 1, 1); r('#4de3f0', ox + 9, 4, 1, 1);
      r(OUT, ox + 6, 7, 4, 1);
      r(OUT, ox + 4, 8, 8, 6); r('#e8e8f0', ox + 5, 9, 6, 4);
      r('#ffd84a', ox + 7, 10, 2, 2);
      r(OUT, ox + 2, 9, 2, 4); r(OUT, ox + 12, 9, 2, 4);
      const [l, rr] = f === 1 ? [0, 1] : [1, 0];
      r(OUT, ox + 5, 14 - l, 2, 2 + l); r(OUT, ox + 9, 14 - rr, 2, 2 + rr);
    }
    frames(tex, 3, 16, 16);
  });

  // the big gear turning in the sky (64x64)
  one('robot-gear', 64, 64, (ctx) => {
    ctx.fillStyle = 'rgba(200,215,235,0.5)';
    for (let k = 0; k < 12; k++) {
      ctx.save(); ctx.translate(32, 32); ctx.rotate((k / 12) * Math.PI * 2); ctx.fillRect(-4, -31, 8, 10); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(32, 32, 23, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(32, 32, 9, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 6; k++) {
      ctx.beginPath(); ctx.arc(32 + Math.cos(k) * 16, 32 + Math.sin(k) * 16, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  });

  // the Robot Factory (224x176): a saw-tooth roof, chimneys, a big gear sign
  // and a wide door (its middle at x=112) that slides up when it opens
  one('robot-factory', 224, 176, (ctx, r) => {
    // chimneys
    for (const cx of [30, 60]) { r(OUT, cx, 8, 14, 50); r('#9a5a3a', cx + 1, 9, 12, 49); r('#ffd84a', cx + 1, 14, 12, 3); }
    // saw-tooth roof
    for (let k = 0; k < 4; k++) {
      const x0 = 8 + k * 52;
      for (let y = 0; y < 30; y++) { r(OUT, x0 + y * 1.7, 46 + y, 52 - y * 1.7, 1); r('#4a7ac8', x0 + y * 1.7 + 1, 46 + y, 50 - y * 1.7, 1); }
      r('#bfe8ff', x0 + 2, 50, 6, 24);
    }
    r(OUT, 4, 74, 216, 102); r(STEEL, 5, 75, 214, 101);
    for (let y = 82; y < 176; y += 10) r(STEEL_D, 5, y, 214, 1);
    // windows lit up
    for (const wx of [20, 172]) { r(OUT, wx, 92, 32, 24); r('#ffd84a', wx + 1, 93, 30, 22); r(OUT, wx + 15, 93, 2, 22); }
    // the gear sign over the door
    ell(ctx, 112, 92, 15, 15, OUT); ell(ctx, 112, 92, 13, 13, '#ffd84a');
    for (let k = 0; k < 8; k++) r('#ffd84a', 112 + Math.round(Math.cos(k * 0.785) * 15) - 2, 92 + Math.round(Math.sin(k * 0.785) * 15) - 2, 4, 4);
    ell(ctx, 112, 92, 5, 5, OUT);
    // the doorway (the door itself is a sprite)
    r(OUT, 78, 112, 68, 64); r('#2a2a3a', 80, 114, 64, 62);
    for (let x = 80; x < 144; x += 8) { r('#ffd84a', x, 112, 4, 3); }
  });
  // the factory's sliding door (64x60)
  one('robot-door', 64, 60, (ctx, r) => {
    r('#5a6a80', 0, 0, 64, 60);
    for (let y = 4; y < 60; y += 8) r('#4a5a70', 0, y, 64, 3);
    r('#ffd84a', 26, 26, 12, 6); r(OUT, 26, 26, 12, 1);
  });

  // the far-off city (128x96): towers with windows, an antenna
  one('robot-skyline', 128, 96, (ctx, r) => {
    const col = 'rgba(90,110,150,0.55)';
    for (const [x, w, h] of [[0, 22, 60], [24, 18, 84], [44, 28, 50], [74, 16, 92], [92, 30, 66], [112, 16, 40]]) {
      r(col, x, 96 - h, w, h);
      for (let y = 96 - h + 6; y < 92; y += 8) for (let wx = x + 3; wx < x + w - 3; wx += 6) r('rgba(255,224,120,0.6)', wx, y, 2, 3);
    }
    r(col, 81, 0, 2, 6);
  });
}
