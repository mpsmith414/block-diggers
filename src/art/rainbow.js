// Art for Rainbow Planet. The mine's rock, gems, chests, decorations and
// creatures are drawn in pale greys and tinted in the game with each layer's
// own random colours (white shows the colour itself, darker greys a shade of
// it), so every layer can look brand new. Plus the sparkle (its money), the
// planet on the star map, the Rainbow Rocket, and Rainbow Village's lift,
// depth sign and arch.

import { PATTERNS, GEM_SHAPES } from '../world/rainbow.js';

const T = 16;
const OUT = '#2a1d2e';
const RAINBOW = ['#ff5a6a', '#ffa64a', '#ffe066', '#6ad07a', '#4ab0ff', '#9a7aff'];
const grey = (v, a = 1) => `rgba(${v},${v},${v},${a})`;
export const GEM_PX = { tiny: 16, chunky: 32, big: 64, massive: 128 };

// A rock pattern in greys on a 16x16 tile at x = ox (variant v shifts it).
// `base` is the main grey (light for the rock, dark for the back wall).
export function drawPattern(ctx, rect, ox, pattern, v, base) {
  const b = base;
  const d = base - 45;
  const l = Math.min(255, base + 30);
  rect(ctx, grey(b), ox, 0, T, T);
  const px = (x, y, c, w = 1, h = 1) => rect(ctx, grey(c), ox + ((x % T) + T) % T, ((y % T) + T) % T, w, h);
  if (pattern === 'speckles') {
    const spots = [[2, 3], [9, 1], [12, 8], [5, 10], [1, 13], [10, 13], [7, 6]];
    for (const [x, y] of spots) px(x + v * 3, y + v, d, 2, 2);
    for (const [x, y] of [[4, 1], [13, 4], [8, 11]]) px(x + v, y + v * 2, l);
  } else if (pattern === 'stripes') {
    for (let y = v % 4; y < T; y += 4) rect(ctx, grey(d + 15), ox, y, T, 1);
    for (let y = (v + 2) % 4; y < T; y += 8) rect(ctx, grey(l), ox, y, T, 1);
  } else if (pattern === 'swirls') {
    ctx.strokeStyle = grey(d + 10);
    ctx.lineWidth = 1;
    for (const [cx, cy] of [[4 + v, 5], [12 - v, 12]]) {
      ctx.beginPath();
      ctx.arc(ox + cx + 0.5, cy + 0.5, 3, 0.2, Math.PI * 1.6);
      ctx.stroke();
    }
    px(8, 2 + v, l);
  } else if (pattern === 'dots') {
    for (let y = 2 + (v % 2) * 2; y < T; y += 6) for (let x = 2 + v; x < T + 6; x += 6) px(x + (y % 12 === 2 ? 3 : 0), y, d + 10, 2, 2);
  } else if (pattern === 'bubbles') {
    ctx.strokeStyle = grey(d + 15);
    for (const [cx, cy, r] of [[5 + v, 5, 2.5], [11, 11 - v, 3], [12 - v, 3, 1.5]]) {
      ctx.beginPath();
      ctx.arc(ox + cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      px(Math.round(cx - r / 2), Math.round(cy - r / 2), 255);
    }
  } else if (pattern === 'zigzag') {
    for (let x = 0; x < T; x++) {
      const y = 3 + Math.abs(((x + v * 2) % 6) - 3);
      px(x, y, d + 10);
      px(x, y + 8, d + 10);
    }
  }
}

// The outline of a gem shape, in a box from (x, y) of size s.
function gemPath(ctx, shape, x, y, s) {
  const P = (u, v) => [x + u * s, y + v * s];
  const poly = (pts) => {
    ctx.beginPath();
    pts.forEach(([u, v], i) => (i ? ctx.lineTo(...P(u, v)) : ctx.moveTo(...P(u, v))));
    ctx.closePath();
  };
  if (shape === 'round') {
    ctx.beginPath();
    ctx.arc(x + s / 2, y + s / 2, s * 0.44, 0, Math.PI * 2);
  } else if (shape === 'diamond') poly([[0.5, 0.05], [0.95, 0.4], [0.5, 0.95], [0.05, 0.4]]);
  else if (shape === 'hex') poly([[0.27, 0.07], [0.73, 0.07], [0.95, 0.5], [0.73, 0.93], [0.27, 0.93], [0.05, 0.5]]);
  else if (shape === 'star') {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.2 : 0.47;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push([0.5 + Math.cos(a) * r, 0.53 + Math.sin(a) * r]);
    }
    poly(pts);
  } else if (shape === 'heart') {
    ctx.beginPath();
    ctx.moveTo(...P(0.5, 0.92));
    ctx.bezierCurveTo(...P(0.05, 0.6), ...P(0.02, 0.2), ...P(0.28, 0.12));
    ctx.bezierCurveTo(...P(0.4, 0.08), ...P(0.5, 0.2), ...P(0.5, 0.3));
    ctx.bezierCurveTo(...P(0.5, 0.2), ...P(0.6, 0.08), ...P(0.72, 0.12));
    ctx.bezierCurveTo(...P(0.98, 0.2), ...P(0.95, 0.6), ...P(0.5, 0.92));
    ctx.closePath();
  } else if (shape === 'crystal') poly([[0.32, 0.95], [0.15, 0.5], [0.3, 0.2], [0.5, 0.03], [0.7, 0.2], [0.85, 0.5], [0.68, 0.95]]);
  else poly([[0.2, 0.25], [0.45, 0.1], [0.75, 0.15], [0.93, 0.4], [0.88, 0.75], [0.6, 0.92], [0.28, 0.88], [0.07, 0.6]]); // nugget
}

// A gem in greys: a pale body, a white shine at the top left, a shade at
// the bottom right, and a dark rim (tinted, they become the layer's gem).
function drawGem(ctx, shape, s) {
  const pad = Math.max(1, s / 16);
  const x = pad;
  const y = pad;
  const w = s - pad * 2;
  ctx.save();
  gemPath(ctx, shape, x, y, w);
  ctx.fillStyle = grey(215);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = grey(160);
  ctx.beginPath();
  ctx.moveTo(x + w, y + w * 0.35);
  ctx.lineTo(x + w, y + w);
  ctx.lineTo(x + w * 0.3, y + w);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = grey(255);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.62, y);
  ctx.lineTo(x, y + w * 0.62);
  ctx.closePath();
  ctx.fill();
  // facet lines
  ctx.strokeStyle = grey(185);
  ctx.lineWidth = Math.max(1, s / 32);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.5, y);
  ctx.lineTo(x + w * 0.5, y + w);
  ctx.moveTo(x, y + w * 0.5);
  ctx.lineTo(x + w, y + w * 0.5);
  ctx.stroke();
  ctx.restore();
  gemPath(ctx, shape, x, y, w);
  ctx.strokeStyle = grey(70);
  ctx.lineWidth = Math.max(1, s / 16);
  ctx.stroke();
  // a little sparkle
  ctx.fillStyle = grey(255);
  const k = Math.max(1, Math.round(s / 16));
  ctx.fillRect(Math.round(x + w * 0.28), Math.round(y + w * 0.28), k, k);
}

// The block tiles (rock, gems, the floor, the village's candy ground) and the
// tintable pattern frames, drawn into the tileset (see textures.js).
export function drawRainbowTiles(ctx, at, rect, B, frames) {
  drawPattern(ctx, rect, at(B.RAINBOW_ROCK), 'speckles', 0, 225);
  drawPattern(ctx, rect, at(B.RAINBOW_GEM), 'speckles', 1, 225);
  drawPattern(ctx, rect, at(B.RAINBOW_GEM_PART), 'speckles', 2, 225);
  drawPattern(ctx, rect, at(B.RAINBOW_SHINY), 'speckles', 3, 240);
  // the glowing floor: rainbow bands with a shine
  RAINBOW.forEach((c, i) => rect(ctx, c, at(B.RAINBOW_FLOOR), Math.floor((i * T) / 6), T, 3));
  rect(ctx, 'rgba(255,255,255,0.45)', at(B.RAINBOW_FLOOR), 0, T, 1);
  for (const [x, y] of [[3, 4], [11, 10]]) rect(ctx, '#ffffff', at(B.RAINBOW_FLOOR) + x, y);
  // candy ground: pink soil with sprinkles under a striped minty top
  const soil = (ox) => {
    rect(ctx, '#f08ab8', ox, 0, T, T);
    for (const [x, y, c] of [[2, 3, '#ffe066'], [9, 6, '#6ad0ff'], [5, 11, '#ffffff'], [12, 13, '#9a7aff'], [13, 2, '#6ad07a']]) rect(ctx, c, ox + x, y, 2, 1);
  };
  soil(at(B.RAINBOW_SOIL));
  soil(at(B.RAINBOW_TOP));
  rect(ctx, '#7ae0b0', at(B.RAINBOW_TOP), 0, T, 4);
  for (let x = 0; x < T; x += 4) rect(ctx, '#ffffff', at(B.RAINBOW_TOP) + x, 0, 2, 3);
  rect(ctx, '#4ab88a', at(B.RAINBOW_TOP), 4, T, 1);
  // the tintable patterns (4 variants each), then their back walls
  PATTERNS.forEach((p, i) => {
    for (let v = 0; v < 4; v++) drawPattern(ctx, rect, frames.pattern(i, v) * T, p, v, 225);
    drawPattern(ctx, rect, frames.back(i) * T, p, 1, 110);
  });
}

export function drawRainbowArt(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };

  // every gem shape at every size
  for (const shape of GEM_SHAPES) {
    for (const [size, s] of Object.entries(GEM_PX)) one(`rgem-${shape}-${size}`, s, s, (ctx) => drawGem(ctx, shape, s));
  }
  // cracks spreading on a big gem (4 frames: none, a few, more, lots), 64x64, scaled to fit
  one('rgem-crack', 256, 64, (ctx, tex) => {
    const cracks = [[[32, 32], [20, 14], [12, 10]], [[32, 32], [46, 20], [54, 12]], [[32, 32], [40, 48], [44, 58]], [[32, 32], [16, 40], [8, 46]], [[32, 32], [50, 38]], [[32, 32], [28, 52]]];
    for (let f = 0; f < 4; f++) {
      ctx.strokeStyle = 'rgba(42,29,46,0.85)';
      ctx.lineWidth = 2;
      const n = [0, 2, 4, 6][f];
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        cracks[i].forEach(([x, y], k) => (k ? ctx.lineTo(f * 64 + x, y) : ctx.moveTo(f * 64 + x, y)));
        ctx.stroke();
      }
      tex.add(f, 0, f * 64, 0, 64, 64);
    }
  });

  // a treasure chest in greys (tinted to the layer): closed, then open with a glow
  one('rchest', 32, 14, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      rect(ctx, OUT, ox + 1, 3, 14, 11);
      rect(ctx, grey(200), ox + 2, 7, 12, 6);
      rect(ctx, grey(140), ox + 2, 10, 12, 1);
      if (f === 0) {
        rect(ctx, grey(235), ox + 2, 4, 12, 3);
        rect(ctx, grey(255), ox + 7, 6, 2, 3);
      } else {
        rect(ctx, '#fff6c0', ox + 3, 5, 10, 2);
        rect(ctx, OUT, ox + 1, 0, 14, 3);
        rect(ctx, grey(235), ox + 2, 1, 12, 1);
      }
      tex.add(f, 0, ox, 0, 16, 14);
    }
  });

  // decorations, in greys
  one('rdecor-mushroom', 16, 16, (ctx) => {
    rect(ctx, OUT, 6, 8, 4, 8);
    rect(ctx, grey(240), 7, 9, 2, 7);
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(8, 8, 7, Math.PI, 0); ctx.fill();
    ctx.fillStyle = grey(200);
    ctx.beginPath(); ctx.arc(8, 8, 6, Math.PI, 0); ctx.fill();
    for (const [x, y] of [[4, 5], [9, 3], [11, 6]]) rect(ctx, grey(255), x, y, 2, 2);
  });
  one('rdecor-flower', 16, 16, (ctx) => {
    rect(ctx, grey(150), 7, 8, 2, 8);
    rect(ctx, grey(150), 9, 11, 3, 2);
    for (const [x, y] of [[8, 2], [4, 5], [12, 5], [6, 9], [10, 9]]) {
      ctx.fillStyle = grey(225);
      ctx.beginPath(); ctx.arc(x, y + 1, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    rect(ctx, grey(255), 7, 5, 2, 2);
  });
  one('rdecor-bubble', 16, 16, (ctx) => {
    ctx.strokeStyle = grey(255);
    ctx.lineWidth = 1;
    for (const [x, y, r] of [[8, 9, 5], [3, 4, 2], [13, 3, 1.5]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
    rect(ctx, grey(255), 5, 6, 2, 1);
  });
  one('rdecor-vine', 8, 16, (ctx) => {
    for (let y = 0; y < 16; y++) rect(ctx, grey(170), 3 + (Math.floor(y / 3) % 2), y, 2, 1);
    for (const y of [4, 9, 14]) { rect(ctx, grey(230), 1, y, 2, 2); rect(ctx, grey(230), 5, y - 2, 2, 2); }
  });
  one('rdecor-crystal', 16, 16, (ctx) => {
    for (const [x, h] of [[3, 7], [7, 12], [11, 9]]) {
      rect(ctx, OUT, x - 1, 16 - h - 1, 4, h + 1);
      rect(ctx, grey(220), x, 16 - h, 2, h);
      rect(ctx, grey(255), x, 16 - h, 1, h);
    }
  });

  // Rainbow Planet's creatures, in greys (tinted to the layer): a blob that hops
  // (2 frames: sitting, squashed) and a flier that drifts (2 frames: wings up, down)
  one('rblob', 32, 12, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      const h = f ? 8 : 10;
      ctx.fillStyle = OUT;
      ctx.beginPath(); ctx.ellipse(ox + 8, 12 - h / 2, 7, h / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = grey(200);
      ctx.beginPath(); ctx.ellipse(ox + 8, 12 - h / 2, 6, h / 2 - 1, 0, 0, Math.PI * 2); ctx.fill();
      rect(ctx, grey(255), ox + 4, 12 - h + 2, 2, 1);
      rect(ctx, OUT, ox + 6, 12 - h / 2 - 1, 1, 2);
      rect(ctx, OUT, ox + 10, 12 - h / 2 - 1, 1, 2);
      tex.add(f, 0, ox, 0, 16, 12);
    }
  });
  one('rflier', 32, 12, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      const wy = f ? 6 : 1;
      rect(ctx, grey(235), ox + 1, wy, 4, 4);
      rect(ctx, grey(235), ox + 11, wy, 4, 4);
      ctx.fillStyle = OUT;
      ctx.beginPath(); ctx.arc(ox + 8, 6, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = grey(205);
      ctx.beginPath(); ctx.arc(ox + 8, 6, 3.5, 0, Math.PI * 2); ctx.fill();
      rect(ctx, OUT, ox + 6, 5, 1, 2);
      rect(ctx, OUT, ox + 9, 5, 1, 2);
      rect(ctx, grey(255), ox + 6, 3, 2, 1);
      tex.add(f, 0, ox, 0, 16, 12);
    }
  });

  // the sparkle (Rainbow Planet's money): a little four-point star in rainbow colours
  one('ore-sparkle', 10, 10, (ctx) => {
    rect(ctx, OUT, 4, 0, 2, 10);
    rect(ctx, OUT, 0, 4, 10, 2);
    rect(ctx, OUT, 2, 2, 6, 6);
    rect(ctx, '#ff8ac8', 3, 3, 4, 4);
    rect(ctx, '#ffe066', 4, 1, 2, 3);
    rect(ctx, '#6ad0ff', 4, 6, 2, 3);
    rect(ctx, '#9a7aff', 1, 4, 3, 2);
    rect(ctx, '#6ad07a', 6, 4, 3, 2);
    rect(ctx, '#ffffff', 4, 4, 2, 2);
  });

  // Rainbow Planet on the star map (32x32): swirly rainbow bands and a sparkly ring
  one('planet-rainbow', 32, 32, (ctx) => {
    ctx.save();
    ctx.beginPath(); ctx.arc(16, 16, 11, 0, Math.PI * 2); ctx.clip();
    RAINBOW.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(0, 5 + i * 4 + Math.round(Math.sin(i) * 1), 32, 4);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(12, 11, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(16, 16, 11.5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(16, 17, 15, 4, -0.25, 0.15, Math.PI - 0.15); ctx.stroke();
    for (const [x, y] of [[3, 6], [28, 8], [26, 27]]) rect(ctx, '#ffffff', x, y);
  });

  // the Rainbow Rocket (on its own: it stands on Rainbow Village's pad, and flies),
  // and on its tower at the Solar Station
  const ship = (ctx, dx) => {
    for (const bx of [dx + 22, dx + 50]) {
      rect(ctx, OUT, bx - 1, 34, 12, 42);
      rect(ctx, '#ffffff', bx, 35, 10, 40);
      RAINBOW.forEach((c, i) => rect(ctx, c, bx, 41 + i * 5, 10, 2));
      rect(ctx, OUT, bx, 74, 10, 5);
      rect(ctx, '#55505e', bx + 1, 74, 8, 4);
    }
    rect(ctx, OUT, dx + 29, 10, 22, 66);
    rect(ctx, '#ffffff', dx + 30, 11, 20, 64);
    RAINBOW.forEach((c, i) => rect(ctx, c, dx + 30, 32 + i * 5, 20, 5));
    rect(ctx, 'rgba(0,0,0,0.12)', dx + 45, 11, 5, 64);
    for (let k = 0; k < 14; k++) {
      const w = Math.max(2, Math.round(22 * Math.sqrt(1 - k / 14)));
      rect(ctx, OUT, dx + 40 - Math.floor(w / 2) - 1, 10 - k, w + 2, 1);
      rect(ctx, RAINBOW[Math.floor(k / 3) % RAINBOW.length], dx + 40 - Math.floor(w / 2), 10 - k, w, 1);
    }
    ctx.fillStyle = OUT;
    ctx.beginPath(); ctx.arc(dx + 40, 21, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8ac0ff';
    ctx.beginPath(); ctx.arc(dx + 40, 21, 4, 0, Math.PI * 2); ctx.fill();
    rect(ctx, '#ffffff', dx + 38, 19, 2, 2);
    for (const fx of [dx + 25, dx + 50]) {
      rect(ctx, OUT, fx, 60, 5, 16);
      rect(ctx, '#9a7aff', fx + 1, 61, 3, 14);
    }
    rect(ctx, OUT, dx + 33, 75, 14, 5);
    rect(ctx, '#55505e', dx + 34, 75, 12, 4);
  };
  one('rainbow-ship', 96, 80, (ctx) => ship(ctx, 8));
  one('bld-rainbowrocket', 96, 80, (ctx) => {
    rect(ctx, OUT, 74, 4, 14, 76);
    for (let y = 6; y < 78; y += 8) {
      rect(ctx, RAINBOW[(y / 8) % RAINBOW.length | 0], 75, y, 12, 2);
      for (let k = 0; k < 6; k++) rect(ctx, '#8a94a8', 76 + k * 2, y + 2 + k, 1, 1);
    }
    rect(ctx, '#8a94a8', 62, 18, 14, 3);
    ship(ctx, 0);
  });

  // Rainbow Village: the lift down into the mine (a glowing hole under a little
  // cage), the depth sign (a board with a rainbow bar), and the rainbow arch
  one('rainbow-lift', 32, 40, (ctx) => {
    rect(ctx, OUT, 2, 0, 28, 3);
    rect(ctx, '#ffffff', 3, 1, 26, 1);
    for (const x of [3, 27]) { rect(ctx, OUT, x - 1, 2, 4, 30); rect(ctx, '#c8c8e8', x, 3, 2, 29); }
    for (const x of [9, 15, 21]) rect(ctx, 'rgba(200,200,232,0.7)', x, 3, 1, 28);
    rect(ctx, OUT, 4, 30, 24, 3);
    rect(ctx, '#9a7aff', 5, 31, 22, 1);
    RAINBOW.forEach((c, i) => rect(ctx, c, 2 + i * 0, 33 + i, 28, 1));
    rect(ctx, '#ffffff', 2, 39, 28, 1);
  });
  one('rainbow-sign', 56, 44, (ctx) => {
    rect(ctx, OUT, 25, 28, 6, 16);
    rect(ctx, '#c08850', 26, 29, 4, 15);
    rect(ctx, OUT, 0, 0, 56, 30);
    rect(ctx, '#fff4fa', 2, 2, 52, 26);
    // a little shaft going down, with an arrow
    rect(ctx, '#d8c8e8', 6, 6, 8, 18);
    rect(ctx, OUT, 8, 14, 4, 1);
    rect(ctx, OUT, 9, 15, 2, 2);
    rect(ctx, OUT, 9, 9, 2, 5);
  });
  one('rainbow-arch', 120, 64, (ctx) => {
    RAINBOW.forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(60, 64, 56 - i * 5, Math.PI, 0);
      ctx.stroke();
    });
    // little clouds at its feet
    ctx.fillStyle = '#ffffff';
    for (const [x, y] of [[8, 60], [16, 58], [104, 60], [112, 58]]) { ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); }
  });
}
