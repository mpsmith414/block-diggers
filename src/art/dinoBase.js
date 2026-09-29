// Art for Dino Camp (Dino Planet's camp): the Dino Nursery, the Treehouse,
// the Ptero Perch and the Sun Rocket (96x80 each); tree ferns, the big
// volcano for the sky, the ptero taxi, and the Dino ship (the Dino Rocket off
// its tower).

import { drawMap } from './pixelmap.js';
import { drawDinoShip } from './saturnBase.js';

const OUT = '#2a1d2e';

function ell(ctx, cx, cy, rx, ry, color, top = false) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= (top ? 0 : ry); y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

// A cosy nursery: a thatched hut, a fence, and a sandpit full of eggs.
function drawNursery(ctx, rect) {
  // the hut
  rect(ctx, OUT, 48, 44, 40, 36);
  rect(ctx, '#c8905a', 49, 45, 38, 35);
  for (let y = 50; y < 80; y += 6) rect(ctx, '#a8703c', 49, y, 38, 1);
  for (let k = 0; k < 18; k++) {
    rect(ctx, OUT, 44 + k, 44 - k, 48 - k * 2, 1);
    rect(ctx, k % 3 ? '#e8c060' : '#c8a040', 45 + k, 45 - k, 46 - k * 2, 1);
  }
  rect(ctx, OUT, 62, 60, 12, 20);
  rect(ctx, '#5a3a1a', 63, 61, 10, 19);
  ell(ctx, 68, 52, 4, 4, OUT);
  ell(ctx, 68, 52, 3, 3, '#ffe066');
  // a sandpit with eggs and a baby dino peeking out
  rect(ctx, '#e8d090', 6, 70, 40, 10);
  rect(ctx, '#d0b870', 6, 70, 40, 1);
  for (const [x, c] of [[12, '#e8f0d0'], [20, '#f0e0c0'], [36, '#e0f0f0']]) { ell(ctx, x, 70, 3, 4, OUT); ell(ctx, x, 70, 2, 3, c); }
  drawMap(ctx, 24, 60, ['..ooo.', '.oggko', '.ogggo', 'ooggo.', 'owwwo.', '.ooo..'], { o: OUT, g: '#7ac04a', k: OUT, w: '#fff8e8' });
  // the fence
  for (let x = 4; x < 48; x += 7) { rect(ctx, OUT, x, 60, 3, 20); rect(ctx, '#a0703c', x + 1, 61, 1, 19); }
  rect(ctx, '#a0703c', 4, 64, 44, 2);
  rect(ctx, '#a0703c', 4, 72, 44, 2);
}

// A treehouse: a big tree with a hut in its branches and a rope ladder.
function drawTreehouse(ctx, rect) {
  // the trunk
  rect(ctx, OUT, 42, 30, 14, 50);
  rect(ctx, '#8a5a2a', 43, 31, 12, 49);
  rect(ctx, '#6a4020', 47, 40, 2, 30);
  // the leafy top
  for (const [x, y, r] of [[30, 16, 14], [50, 10, 16], [70, 18, 14], [48, 24, 18]]) { ell(ctx, x, y, r + 1, r * 0.8 + 1, OUT); ell(ctx, x, y, r, r * 0.8, '#3a9a3a'); }
  for (const [x, y] of [[28, 10], [54, 6], [72, 14], [40, 20]]) ell(ctx, x, y, 5, 3, '#5ac04a');
  // the hut on a platform
  rect(ctx, OUT, 22, 38, 52, 4);
  rect(ctx, '#a0703c', 23, 39, 50, 2);
  rect(ctx, OUT, 30, 22, 36, 17);
  rect(ctx, '#c8905a', 31, 23, 34, 15);
  for (let y = 26; y < 38; y += 4) rect(ctx, '#a8703c', 31, y, 34, 1);
  rect(ctx, OUT, 44, 27, 9, 11);
  rect(ctx, '#2a1810', 45, 28, 7, 10);
  rect(ctx, '#ffe066', 35, 27, 5, 4);
  // a lookout flag
  rect(ctx, OUT, 64, 6, 1, 18);
  rect(ctx, '#ff7eb6', 65, 6, 8, 5);
  // the rope ladder down to the ground
  for (const x of [26, 32]) rect(ctx, '#c8a060', x, 42, 1, 38);
  for (let y = 46; y < 80; y += 5) rect(ctx, '#c8a060', 26, y, 7, 1);
}

// The Ptero Perch: a tall rock with a big nest on top (the ptero flies in the camp).
function drawPteroPerch(ctx, rect) {
  // the rock spire
  for (let y = 24; y < 80; y++) {
    const w = Math.round(12 + (y - 24) * 0.35);
    rect(ctx, OUT, 48 - w - 1, y, w * 2 + 2, 1);
    rect(ctx, (y % 9) < 2 ? '#7a6a5a' : '#9a8a78', 48 - w, y, w * 2, 1);
  }
  for (const [x, y] of [[40, 40], [54, 52], [44, 66]]) rect(ctx, '#6a5a4a', x, y, 6, 2);
  // the nest on top
  ell(ctx, 48, 22, 18, 6, OUT);
  ell(ctx, 48, 22, 17, 5, '#8a5a2a');
  for (let x = 32; x < 64; x += 3) rect(ctx, '#c8905a', x, 19 + (x % 2), 2, 1);
  // a landing flag, and a basket seat
  rect(ctx, OUT, 66, 4, 1, 18);
  rect(ctx, '#ffe066', 67, 4, 8, 5);
  rect(ctx, OUT, 18, 70, 14, 10);
  rect(ctx, '#c8a060', 19, 71, 12, 8);
  for (let x = 20; x < 30; x += 3) rect(ctx, '#a0803c', x, 71, 1, 8);
}

// The Sun Rocket: gold and orange with a sun on its side, on a tower.
function drawSunRocket(ctx, rect) {
  rect(ctx, OUT, 74, 4, 14, 76);
  for (let y = 6; y < 78; y += 8) {
    rect(ctx, '#ff8a2a', 75, y, 12, 2);
    for (let k = 0; k < 6; k++) rect(ctx, '#c85a1a', 76 + k * 2, y + 2 + k, 1, 1);
  }
  rect(ctx, '#8a94a8', 62, 18, 14, 3);
  for (const bx of [22, 50]) {
    rect(ctx, OUT, bx - 1, 34, 12, 42);
    rect(ctx, '#fff0c0', bx, 35, 10, 40);
    rect(ctx, '#ff8a2a', bx, 35, 10, 4);
    rect(ctx, '#e8c880', bx + 7, 39, 3, 36);
    rect(ctx, OUT, bx, 74, 10, 5);
    rect(ctx, '#55505e', bx + 1, 74, 8, 4);
    ell(ctx, bx + 5, 35, 5, 6, '#ff8a2a', true);
  }
  rect(ctx, OUT, 29, 10, 22, 66);
  rect(ctx, '#ffe066', 30, 11, 20, 64);
  rect(ctx, '#e8b830', 45, 11, 5, 64);
  for (const y of [30, 58]) { rect(ctx, '#ff6a2a', 30, y, 20, 3); rect(ctx, '#ffb080', 30, y, 20, 1); }
  for (let k = 0; k < 14; k++) {
    const w = Math.max(2, Math.round(22 * Math.sqrt(1 - k / 14)));
    rect(ctx, OUT, 40 - Math.floor(w / 2) - 1, 10 - k, w + 2, 1);
    rect(ctx, '#ff6a2a', 40 - Math.floor(w / 2), 10 - k, w, 1);
  }
  ell(ctx, 40, 20, 5, 5, OUT);
  ell(ctx, 40, 20, 4, 4, '#8ac0ff');
  rect(ctx, '#ffffff', 38, 18, 2, 2);
  // the sun on its side
  ell(ctx, 40, 44, 6, 6, '#ff8a1a');
  ell(ctx, 40, 44, 4, 4, '#fff6a0');
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    rect(ctx, '#ff6a2a', Math.round(40 + Math.cos(a) * 8), Math.round(44 + Math.sin(a) * 8), 2, 2);
  }
  rect(ctx, OUT, 25, 60, 5, 16);
  rect(ctx, '#ff6a2a', 26, 61, 3, 14);
  rect(ctx, OUT, 50, 60, 5, 16);
  rect(ctx, '#ff6a2a', 51, 61, 3, 14);
  rect(ctx, OUT, 33, 75, 14, 5);
  rect(ctx, '#55505e', 34, 75, 12, 4);
}

export const DINO_BUILDINGS = { nursery: drawNursery, treehouse: drawTreehouse, pteroperch: drawPteroPerch, sunrocket: drawSunRocket };

export function drawDinoBase(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };
  for (const [id, draw] of Object.entries(DINO_BUILDINGS)) one(`bld-${id}`, 96, 80, (ctx) => draw(ctx, rect));

  // the Dino Rocket as a ship on its own (it stands on Dino Camp's pad, and flies)
  one('dino-ship', 96, 80, (ctx) => drawDinoShip(ctx, rect, -4));

  // a tree fern: a tall scaly trunk with drooping fronds
  one('treefern', 48, 64, (ctx) => {
    rect(ctx, OUT, 21, 18, 6, 46);
    rect(ctx, '#7a5a2a', 22, 19, 4, 45);
    for (let y = 22; y < 64; y += 4) rect(ctx, '#5a4020', 22, y, 4, 1);
    for (const [dx, dir] of [[-1, -1], [1, 1], [-1, -1], [1, 1]]) {
      for (let k = 0; k < 20; k++) {
        const x = 24 + dir * k;
        const y = 16 + Math.round((k * k) / 22) + (dx > 0 ? 2 : 0);
        rect(ctx, '#2a8a3a', x, y, 1, 2);
        if (k % 3 === 0) rect(ctx, '#5ac04a', x, y + 2, 1, 2);
      }
    }
    ell(ctx, 24, 16, 5, 3, '#3a9a3a');
  });

  // a big smoking volcano for the sky
  one('volcano-big', 128, 64, (ctx) => {
    for (let y = 8; y < 64; y++) {
      const w = Math.round(8 + (y - 8) * 1.0);
      rect(ctx, '#5a3a3a', 64 - w, y, w * 2, 1);
      rect(ctx, '#6a4848', 64 - w, y, Math.max(1, Math.round(w * 0.6)), 1);
    }
    rect(ctx, '#ff6a2a', 56, 8, 16, 3);
    rect(ctx, '#ffd23f', 60, 8, 8, 1);
    for (const [x, y] of [[62, 11], [58, 18], [66, 26]]) rect(ctx, '#ff6a2a', x, y, 2, 5);
  });

  // the ptero taxi: a friendly pterodactyl carrying a little basket seat (2 frames: flapping)
  one('ptero-taxi', 64, 24, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 32;
      const up = f === 0;
      // wings
      for (let k = 0; k < 13; k++) {
        const y = up ? 8 - Math.round(k * 0.5) : 8 + Math.round(k * 0.3);
        rect(ctx, OUT, ox + 15 - k, y, 1, 3);
        rect(ctx, OUT, ox + 17 + k, y, 1, 3);
        rect(ctx, '#c8905a', ox + 15 - k, y + 1, 1, 1);
        rect(ctx, '#c8905a', ox + 17 + k, y + 1, 1, 1);
      }
      // body and head with a crest
      ell(ctx, ox + 16, 10, 4, 3, OUT);
      ell(ctx, ox + 16, 10, 3, 2, '#e0a060');
      rect(ctx, OUT, ox + 19, 5, 7, 4);
      rect(ctx, '#e0a060', ox + 20, 6, 5, 2);
      rect(ctx, '#ffe066', ox + 25, 7, 3, 1);
      rect(ctx, OUT, ox + 21, 6, 1, 1);
      rect(ctx, '#e04a2a', ox + 17, 4, 4, 2);
      // the basket it carries
      rect(ctx, '#6a4020', ox + 15, 13, 1, 4);
      rect(ctx, OUT, ox + 10, 17, 12, 6);
      rect(ctx, '#c8a060', ox + 11, 18, 10, 4);
      for (let x = 12; x < 21; x += 3) rect(ctx, '#a0803c', ox + x, 18, 1, 4);
      tex.add(f, 0, ox, 0, 32, 24);
    }
  });
}
