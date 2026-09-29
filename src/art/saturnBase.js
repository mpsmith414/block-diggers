// Art for Ring Station (Saturn's camp): the Ice Cream Parlour, the Ice
// Lighthouse, the Ski Lift and the Dino Rocket (96x80 each); the igloo, the
// ski-lift chair, the Saturn ship (the Saturn Rocket off its tower) and giant
// Saturn for the skies.

import { drawMap } from './pixelmap.js';
import { drawSaturnShip } from './marsBase.js';

const OUT = '#2a1d2e';

function ell(ctx, cx, cy, rx, ry, color, top = false) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= (top ? 0 : ry); y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

// A pink ice cream shop with a stripy awning and a giant cone on the roof.
function drawParlour(ctx, rect) {
  rect(ctx, OUT, 10, 40, 76, 40);
  rect(ctx, '#ffe0ec', 11, 41, 74, 38);
  rect(ctx, '#ffc0d8', 11, 72, 74, 7);
  // the stripy awning
  for (let i = 0; i < 10; i++) {
    rect(ctx, OUT, 6 + i * 8.4, 34, 9, 9);
    rect(ctx, i % 2 ? '#ffffff' : '#ff7eb6', 7 + i * 8.4, 35, 8, 6);
    ell(ctx, 11 + i * 8.4, 41, 4, 2, i % 2 ? '#ffffff' : '#ff7eb6');
  }
  // the window with tubs of ice cream
  rect(ctx, OUT, 16, 50, 34, 18);
  rect(ctx, '#bfe8ff', 17, 51, 32, 16);
  for (const [x, c] of [[20, '#ff8ab8'], [28, '#8ae8b8'], [36, '#fff0c0'], [44, '#c8905a']]) { ell(ctx, x, 62, 3, 3, c); rect(ctx, '#8a94a8', x - 3, 63, 7, 3); }
  // the door
  rect(ctx, OUT, 58, 52, 16, 28);
  rect(ctx, '#ff8ab8', 59, 53, 14, 27);
  rect(ctx, '#ffffff', 62, 56, 8, 8);
  rect(ctx, '#ffe066', 70, 66, 2, 2);
  // the giant cone on the roof
  for (let k = 0; k < 18; k++) {
    const w = Math.max(2, 16 - Math.floor(k * 0.85));
    rect(ctx, OUT, 48 - w / 2 - 1, 16 + k, w + 2, 1);
    rect(ctx, k % 4 < 2 ? '#e0a050' : '#c8883a', 48 - w / 2, 16 + k, w, 1);
  }
  ell(ctx, 48, 13, 10, 8, OUT);
  ell(ctx, 48, 13, 9, 7, '#ff8ab8');
  ell(ctx, 45, 10, 3, 2, '#ffd0e4');
  ell(ctx, 48, 4, 5, 4, OUT);
  ell(ctx, 48, 4, 4, 3, '#8ae8b8');
  rect(ctx, '#e0403a', 47, -1 + 1, 3, 3);
  for (const [x, y, c] of [[42, 14, '#ffe066'], [52, 12, '#6ad0ff'], [47, 17, '#7ae07a']]) rect(ctx, c, x, y, 2, 1);
}

// A tall striped lighthouse made of ice blocks, with a lamp at the top.
function drawLighthouse(ctx, rect) {
  // the tower, narrowing as it goes up
  for (let y = 18; y < 80; y++) {
    const w = Math.round(14 + (y - 18) * 0.22);
    rect(ctx, OUT, 48 - w - 1, y, w * 2 + 2, 1);
    rect(ctx, Math.floor((y - 18) / 10) % 2 ? '#ffffff' : '#9fd8f0', 48 - w, y, w * 2, 1);
  }
  // ice-block seams
  for (let y = 24; y < 80; y += 6) rect(ctx, '#c8e8f8', 36, y, 24, 1);
  // the lamp room
  rect(ctx, OUT, 34, 8, 28, 11);
  rect(ctx, '#fff6a0', 36, 10, 24, 8);
  rect(ctx, '#ffffff', 44, 11, 8, 5);
  rect(ctx, OUT, 32, 17, 32, 3);
  rect(ctx, '#e0403a', 33, 18, 30, 1);
  ell(ctx, 48, 8, 14, 6, OUT, true);
  ell(ctx, 48, 8, 13, 5, '#e0403a', true);
  rect(ctx, OUT, 47, 0, 2, 3);
  // the door and a round window
  rect(ctx, OUT, 42, 64, 12, 16);
  rect(ctx, '#5a6a8a', 43, 65, 10, 15);
  ell(ctx, 48, 44, 4, 4, OUT);
  ell(ctx, 48, 44, 3, 3, '#6ad0ff');
  // snow at its feet
  ell(ctx, 30, 79, 12, 4, '#ffffff', true);
  ell(ctx, 66, 79, 12, 4, '#ffffff', true);
}

// The ski lift station: a hut with a big wheel; the cable and a chair go up
// and away (the chair moves in the camp).
function drawSkiLift(ctx, rect) {
  // the cable
  for (let x = 30; x < 96; x++) rect(ctx, '#3a3a4a', x, Math.round(26 - (x - 30) * 0.32), 1, 1);
  // a pylon further up the slope
  rect(ctx, OUT, 82, 10, 3, 70);
  rect(ctx, '#8a94a8', 83, 10, 1, 70);
  rect(ctx, OUT, 78, 10, 11, 3);
  // the hut
  rect(ctx, OUT, 6, 44, 52, 36);
  rect(ctx, '#c8683a', 7, 45, 50, 34);
  for (let y = 49; y < 79; y += 5) rect(ctx, '#a8522a', 7, y, 50, 1);
  // a snowy roof
  for (let k = 0; k < 14; k++) {
    rect(ctx, OUT, 2 + k, 44 - k, 60 - k * 2, 1);
    rect(ctx, '#ffffff', 3 + k, 45 - k, 58 - k * 2, 1);
  }
  // the big wheel the cable turns on
  ell(ctx, 32, 26, 9, 9, OUT);
  ell(ctx, 32, 26, 8, 8, '#e0403a');
  ell(ctx, 32, 26, 5, 5, OUT);
  ell(ctx, 32, 26, 4, 4, '#c8ccd8');
  rect(ctx, OUT, 31, 34, 3, 12);
  // the doorway and a snowflake sign
  rect(ctx, OUT, 22, 58, 16, 22);
  rect(ctx, '#2a3a5a', 23, 59, 14, 21);
  rect(ctx, '#ffe066', 12, 52, 5, 5);
  drawMap(ctx, 42, 50, ['..w.w..', 'w..w..w', '.wwwww.', 'wwwwwww', '.wwwww.', 'w..w..w', '..w.w..'], { w: '#ffffff' });
}

// The Dino Rocket: green with spiky orange fins, on a stone tower with vines.
function drawDinoRocket(ctx, rect) {
  // the tower on the left
  rect(ctx, OUT, 8, 6, 14, 74);
  for (let y = 8; y < 78; y += 8) {
    rect(ctx, '#8a8a7a', 9, y, 12, 7);
    rect(ctx, '#6a6a5a', 9, y + 6, 12, 1);
  }
  for (const y of [14, 36, 58]) { rect(ctx, '#4ab05a', 10, y, 2, 8); rect(ctx, '#4ab05a', 18, y + 4, 2, 6); }
  rect(ctx, '#8a94a8', 20, 20, 14, 3);
  // boosters
  for (const bx of [34, 62]) {
    rect(ctx, OUT, bx - 1, 36, 12, 40);
    rect(ctx, '#7ae07a', bx, 37, 10, 38);
    rect(ctx, '#ff8a2a', bx, 37, 10, 5);
    rect(ctx, '#4ab05a', bx + 7, 42, 3, 33);
    rect(ctx, OUT, bx, 74, 10, 5);
    rect(ctx, '#55505e', bx + 1, 74, 8, 4);
    ell(ctx, bx + 5, 37, 5, 6, '#ff8a2a', true);
  }
  // the body, with dino spikes down its back
  rect(ctx, OUT, 41, 14, 22, 62);
  rect(ctx, '#9af0a0', 42, 15, 20, 60);
  rect(ctx, '#6ac87a', 57, 15, 5, 60);
  for (let y = 20; y < 70; y += 8) {
    for (let k = 0; k < 4; k++) rect(ctx, k ? '#ff8a2a' : OUT, 63 + k, y + k, 1, 7 - k * 2);
  }
  for (let k = 0; k < 14; k++) {
    const w = Math.max(2, Math.round(22 * Math.sqrt(1 - k / 14)));
    rect(ctx, OUT, 52 - Math.floor(w / 2) - 1, 14 - k, w + 2, 1);
    rect(ctx, '#ff8a2a', 52 - Math.floor(w / 2), 14 - k, w, 1);
  }
  ell(ctx, 52, 24, 5, 5, OUT);
  ell(ctx, 52, 24, 4, 4, '#8ac0ff');
  rect(ctx, '#ffffff', 50, 22, 2, 2);
  // a dino footprint badge
  ell(ctx, 52, 46, 5, 5, '#2a8a3a');
  for (const [x, y] of [[48, 40], [52, 39], [56, 40]]) ell(ctx, x, y, 1, 2, '#2a8a3a');
  // fins and the nozzle
  rect(ctx, OUT, 37, 62, 5, 14);
  rect(ctx, '#ff8a2a', 38, 63, 3, 12);
  rect(ctx, OUT, 45, 75, 14, 5);
  rect(ctx, '#55505e', 46, 75, 12, 4);
}

export const SATURN_BUILDINGS = { parlour: drawParlour, lighthouse: drawLighthouse, skilift: drawSkiLift, dinorocket: drawDinoRocket };

export function drawSaturnBase(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };
  for (const [id, draw] of Object.entries(SATURN_BUILDINGS)) one(`bld-${id}`, 96, 80, (ctx) => draw(ctx, rect));

  // the Saturn Rocket as a ship on its own (it stands on Ring Station's pad, and flies)
  one('saturn-ship', 96, 80, (ctx) => drawSaturnShip(ctx, rect, 8));

  // an igloo (a house for the diggers)
  one('igloo', 64, 36, (ctx) => {
    ell(ctx, 32, 35, 28, 26, '#6a8aa8', true);
    ell(ctx, 32, 35, 27, 25, '#ffffff', true);
    for (const y of [16, 22, 28]) rect(ctx, '#c8e0f0', 8, y, 48, 1);
    for (const [x, y] of [[20, 13], [36, 13], [14, 19], [30, 19], [46, 19], [22, 25], [40, 25]]) rect(ctx, '#c8e0f0', x, y, 1, 6);
    ell(ctx, 32, 35, 8, 10, '#6a8aa8', true);
    ell(ctx, 32, 35, 7, 9, '#2a3a5a', true);
    rect(ctx, '#ffe066', 30, 30, 4, 3);
    rect(ctx, '#c8e0f0', 2, 33, 60, 3);
  });

  // a chair on the ski lift (2 frames: swinging)
  one('ski-chair', 32, 16, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 16;
      const sw = f ? 1 : 0;
      rect(ctx, '#3a3a4a', ox + 7, 0, 2, 6);
      rect(ctx, OUT, ox + 2 + sw, 6, 12, 2);
      rect(ctx, '#e0403a', ox + 3 + sw, 8, 10, 3);
      rect(ctx, '#ff8a6a', ox + 3 + sw, 8, 10, 1);
      rect(ctx, OUT, ox + 2 + sw, 11, 2, 4);
      rect(ctx, OUT, ox + 12 + sw, 11, 2, 4);
      tex.add(f, 0, ox, 0, 16, 16);
    }
  });

  // giant Saturn for the skies: a banded planet with its rings
  one('saturn-big', 160, 72, (ctx) => {
    // the back of the rings
    for (let x = 0; x < 160; x++) {
      const y = Math.round(36 - Math.sqrt(Math.max(0, 1 - ((x - 80) / 80) ** 2)) * 12);
      rect(ctx, 'rgba(200,230,255,0.55)', x, y, 1, 2);
    }
    ell(ctx, 80, 36, 34, 32, '#8a6a3a');
    ell(ctx, 80, 36, 33, 31, '#f0d8a0');
    for (const [y, c] of [[14, '#e0c080'], [22, '#d8b070'], [30, '#f8e8c0'], [42, '#d8b070'], [52, '#e0c080']]) {
      const w = Math.round(33 * Math.sqrt(1 - ((y - 36) / 31) ** 2));
      rect(ctx, c, 80 - w, y, w * 2, 4);
    }
    ell(ctx, 70, 22, 8, 5, 'rgba(255,255,255,0.35)');
    // the front of the rings, across the planet
    for (let x = 0; x < 160; x++) {
      const y = Math.round(36 + Math.sqrt(Math.max(0, 1 - ((x - 80) / 80) ** 2)) * 12);
      rect(ctx, '#9fe0ff', x, y, 1, 3);
      if (x % 4 === 0) rect(ctx, '#ffffff', x, y + 1, 1, 1);
    }
  });
}
