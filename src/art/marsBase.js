// Art for Mars Base (Mars's camp): the Robot Factory, the Weather Station,
// the Rover Garage and the Saturn Rocket (96x80 each); the greenhouse dome,
// the windsock, the Mars ship (the Mars Rocket off its tower, for flying), the
// rover car, and the anemometer that spins on the Weather Station.

import { drawMap } from './pixelmap.js';
import { drawMarsShip } from './moonBase.js';

const OUT = '#2a1d2e';

function ell(ctx, cx, cy, rx, ry, color, top = false) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= (top ? 0 : ry); y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

// A metal factory with a saw-tooth roof, a big gear, a chimney and a conveyor.
function drawRobotFactory(ctx, rect) {
  // chimney (behind)
  rect(ctx, OUT, 72, 6, 10, 60);
  rect(ctx, '#8a94a8', 73, 7, 8, 59);
  for (const y of [12, 22]) rect(ctx, '#e0503a', 73, y, 8, 3);
  // the main hall
  rect(ctx, OUT, 8, 32, 66, 48);
  rect(ctx, '#c8ccd8', 9, 33, 64, 46);
  rect(ctx, '#e8ecf4', 9, 33, 64, 2);
  rect(ctx, '#e0503a', 9, 46, 64, 3);
  // the saw-tooth roof
  for (let i = 0; i < 3; i++) {
    const x0 = 8 + i * 22;
    for (let k = 0; k < 14; k++) {
      rect(ctx, OUT, x0 + k, 32 - k, 1, k + 1);
      rect(ctx, k < 12 ? '#a8b0c0' : OUT, x0 + k, 33 - k, 1, k);
    }
    rect(ctx, OUT, x0 + 14, 18, 2, 15);
    rect(ctx, '#8ac0ff', x0 + 15, 20, 6, 12);
    rect(ctx, '#d8f0ff', x0 + 15, 20, 2, 12);
  }
  // windows
  for (const x of [14, 50]) {
    rect(ctx, OUT, x, 38, 12, 7);
    rect(ctx, '#8ac0ff', x + 1, 39, 10, 5);
    rect(ctx, '#ffffff', x + 1, 39, 3, 1);
  }
  // the big door with slats
  rect(ctx, OUT, 32, 54, 20, 26);
  rect(ctx, '#8a94a8', 33, 55, 18, 25);
  for (let y = 57; y < 80; y += 4) rect(ctx, '#6a7488', 33, y, 18, 1);
  // a big yellow gear on the wall
  ell(ctx, 20, 64, 9, 9, OUT);
  ell(ctx, 20, 64, 8, 8, '#ffd84a');
  for (const [dx, dy] of [[0, -9], [0, 8], [-9, 0], [8, 0], [-6, -6], [5, -6], [-6, 5], [5, 5]]) rect(ctx, '#ffd84a', 19 + dx, 63 + dy, 3, 3);
  ell(ctx, 20, 64, 3, 3, '#a87a20');
  // a conveyor out the side, with a bolt riding on it
  rect(ctx, OUT, 74, 70, 20, 6);
  rect(ctx, '#55505e', 75, 71, 18, 4);
  for (let x = 76; x < 93; x += 4) rect(ctx, '#8a94a8', x, 72, 2, 2);
  rect(ctx, OUT, 84, 65, 6, 5);
  rect(ctx, '#c0c8d8', 85, 66, 4, 3);
  rect(ctx, '#e8ecf4', 85, 66, 4, 1);
}

// A little white weather station with a dish, a thermometer and a tall mast
// (the anemometer and the windsock on it move in the camp).
function drawWeather(ctx, rect) {
  // the mast
  rect(ctx, OUT, 70, 10, 4, 70);
  rect(ctx, '#e8ecf4', 71, 10, 2, 70);
  for (let y = 16; y < 80; y += 8) rect(ctx, '#e0503a', 71, y, 2, 2);
  // the station
  rect(ctx, OUT, 14, 42, 52, 38);
  rect(ctx, '#f0f2f8', 15, 43, 50, 36);
  rect(ctx, '#c8ccd8', 15, 72, 50, 7);
  rect(ctx, OUT, 12, 38, 56, 5);
  rect(ctx, '#e0503a', 13, 39, 54, 3);
  // door and round window
  rect(ctx, OUT, 42, 56, 12, 23);
  rect(ctx, '#5a6a78', 43, 57, 10, 22);
  rect(ctx, '#3aff7a', 51, 67, 1, 2);
  ell(ctx, 27, 55, 6, 6, OUT);
  ell(ctx, 27, 55, 5, 5, '#8ac0ff');
  rect(ctx, '#ffffff', 25, 52, 2, 2);
  // a big thermometer on the wall
  rect(ctx, OUT, 57, 44, 5, 22);
  rect(ctx, '#ffffff', 58, 45, 3, 18);
  rect(ctx, '#ff3a3a', 58, 54, 3, 9);
  ell(ctx, 59, 65, 3, 3, '#ff3a3a');
  // a dish on the roof
  ell(ctx, 28, 30, 12, 6, OUT, true);
  ell(ctx, 28, 30, 11, 5, '#e0e4f0', true);
  rect(ctx, OUT, 27, 30, 3, 8);
  rect(ctx, '#8a94a8', 28, 22, 1, 8);
  rect(ctx, '#ff5a5a', 27, 20, 3, 2);
  // a little ruby sign: the storms here bring rubies
  rect(ctx, OUT, 4, 60, 2, 20);
  drawMap(ctx, 0, 50, ['.oooooooo.', 'oyyyyyyyyo', 'oyoorrooyo', 'oyorhrroyo', 'oyyorroyyo', 'oyyyooyyyo', 'oyyyyyyyyo', '.oooooooo.'],
    { o: OUT, y: '#f4e4c1', r: '#e0204a', h: '#ff8aa0' });
}

// A garage with a round roof and a big door rolled half up (the rover drives out in the camp).
function drawGarage(ctx, rect) {
  ell(ctx, 48, 50, 42, 26, OUT, true);
  ell(ctx, 48, 50, 41, 25, '#c86a3a', true);
  rect(ctx, OUT, 6, 50, 84, 30);
  rect(ctx, '#d8784a', 7, 50, 82, 29);
  for (let x = 12; x < 88; x += 8) rect(ctx, '#b85a2a', x, 26, 1, 53);
  // the door: rolled half up, dark inside with headlights shining
  rect(ctx, OUT, 22, 44, 52, 36);
  rect(ctx, '#e8ecf4', 23, 45, 50, 14);
  for (let y = 47; y < 59; y += 3) rect(ctx, '#a8b0c0', 23, y, 50, 1);
  rect(ctx, '#1a1418', 23, 59, 50, 21);
  ell(ctx, 36, 70, 4, 3, '#fff6a0');
  ell(ctx, 60, 70, 4, 3, '#fff6a0');
  rect(ctx, '#ffffff', 35, 69, 2, 1);
  rect(ctx, '#ffffff', 59, 69, 2, 1);
  // a sign with a wheel on it
  rect(ctx, OUT, 36, 28, 24, 12);
  rect(ctx, '#f4e4c1', 37, 29, 22, 10);
  ell(ctx, 48, 34, 4, 4, OUT);
  ell(ctx, 48, 34, 2, 2, '#8a94a8');
  // a spare tyre leaning outside
  ell(ctx, 84, 72, 6, 7, OUT);
  ell(ctx, 84, 72, 3, 4, '#8a94a8');
}

// The Saturn Rocket: tall, cream and gold, with a ringed-planet badge, on its tower.
function drawSaturnRocket(ctx, rect) {
  // the launch tower on the right
  rect(ctx, OUT, 74, 4, 14, 76);
  for (let y = 6; y < 78; y += 8) {
    rect(ctx, '#ffd84a', 75, y, 12, 2);
    for (let k = 0; k < 6; k++) rect(ctx, '#c89a30', 76 + k * 2, y + 2 + k, 1, 1);
  }
  rect(ctx, '#8a94a8', 62, 18, 14, 3);
  drawSaturnShip(ctx, rect);
}

// The Saturn Rocket itself (without its tower): it stands on Ring Station's pad and flies.
export function drawSaturnShip(ctx, rect, dx = 0) {
  // boosters
  for (const bx of [22 + dx, 50 + dx]) {
    rect(ctx, OUT, bx - 1, 34, 12, 42);
    rect(ctx, '#f8f0dc', bx, 35, 10, 40);
    rect(ctx, '#d8a040', bx, 35, 10, 4);
    rect(ctx, '#e0c89a', bx + 7, 39, 3, 36);
    rect(ctx, OUT, bx, 74, 10, 5);
    rect(ctx, '#55505e', bx + 1, 74, 8, 4);
    ell(ctx, bx + 5, 35, 5, 6, '#d8a040', true);
  }
  // the main body
  rect(ctx, OUT, 29 + dx, 10, 22, 66);
  rect(ctx, '#fffaf0', 30 + dx, 11, 20, 64);
  rect(ctx, '#e8dcc0', 45 + dx, 11, 5, 64);
  for (const y of [28, 56]) { rect(ctx, '#d8a040', 30 + dx, y, 20, 3); rect(ctx, '#ffe0a0', 30 + dx, y, 20, 1); }
  // nose cone
  for (let k = 0; k < 14; k++) {
    const w = Math.max(2, Math.round(22 * Math.sqrt(1 - k / 14)));
    rect(ctx, OUT, 40 + dx - Math.floor(w / 2) - 1, 10 - k, w + 2, 1);
    rect(ctx, '#d8a040', 40 + dx - Math.floor(w / 2), 10 - k, w, 1);
  }
  // window
  ell(ctx, 40 + dx, 20, 5, 5, OUT);
  ell(ctx, 40 + dx, 20, 4, 4, '#8ac0ff');
  rect(ctx, '#ffffff', 38 + dx, 18, 2, 2);
  // the Saturn badge: a tan planet with an icy ring
  ell(ctx, 40 + dx, 42, 6, 6, OUT);
  ell(ctx, 40 + dx, 42, 5, 5, '#f0d8a0');
  rect(ctx, '#d8b878', 36 + dx, 40, 8, 1);
  for (let x = 31; x < 50; x++) rect(ctx, '#9fe0ff', x + dx, Math.round(43 + (x - 40) * 0.2), 1, 1);
  // fins and the nozzle
  rect(ctx, OUT, 25 + dx, 60, 5, 16);
  rect(ctx, '#d8a040', 26 + dx, 61, 3, 14);
  rect(ctx, OUT, 50 + dx, 60, 5, 16);
  rect(ctx, '#d8a040', 51 + dx, 61, 3, 14);
  rect(ctx, OUT, 33 + dx, 75, 14, 5);
  rect(ctx, '#55505e', 34 + dx, 75, 12, 4);
}

export const MARS_BUILDINGS = { robotfactory: drawRobotFactory, weather: drawWeather, garage: drawGarage, saturnrocket: drawSaturnRocket };

export function drawMarsBase(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };
  for (const [id, draw] of Object.entries(MARS_BUILDINGS)) one(`bld-${id}`, 96, 80, (ctx) => draw(ctx, rect));

  // the Mars Rocket as a ship on its own (it stands on Mars Base's pad, and flies)
  one('mars-ship', 96, 80, (ctx) => drawMarsShip(ctx, rect, -4));

  // the greenhouse: a glass dome full of green plants
  one('mars-dome', 64, 36, (ctx) => {
    ell(ctx, 32, 35, 30, 30, OUT, true);
    ell(ctx, 32, 35, 29, 29, '#6ab07a', true);
    ell(ctx, 32, 35, 27, 27, '#b8f0c8', true);
    for (let x = 8; x < 58; x += 10) rect(ctx, '#8ad0a0', x, 12, 1, 23);
    // plants inside
    for (const [x, h] of [[12, 10], [20, 16], [30, 12], [40, 18], [50, 9]]) {
      rect(ctx, '#2a8a3a', x, 35 - h, 2, h);
      ell(ctx, x + 1, 35 - h, 3, 3, '#4ac05a');
      rect(ctx, '#ff7eb6', x, 34 - h, 1, 1);
    }
    rect(ctx, '#ffffff', 16, 12, 4, 2);
    rect(ctx, '#ffffff', 13, 16, 2, 4);
    rect(ctx, '#c86a3a', 2, 33, 60, 3);
  });

  // a windsock on a pole (2 frames: flapping)
  one('mars-windsock', 40, 32, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 20;
      rect(ctx, OUT, ox + 2, 2, 2, 30);
      rect(ctx, '#e8ecf4', ox + 2, 2, 1, 30);
      const droop = f ? 1 : 0;
      for (let k = 0; k < 14; k++) {
        const h = 6 - Math.floor(k / 4);
        const y = 3 + Math.floor((k * droop) / 5);
        rect(ctx, OUT, ox + 4 + k, y, 1, h + 1);
        rect(ctx, Math.floor(k / 3) % 2 ? '#ffffff' : '#ff6a2a', ox + 4 + k, y + 1, 1, Math.max(1, h - 1));
      }
      tex.add(f, 0, ox, 0, 20, 32);
    }
  });

  // the rover car: six wheels, a big camera head (2 frames: wheels turning)
  one('rover-car', 64, 20, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 32;
      rect(ctx, OUT, ox + 2, 7, 26, 3);
      rect(ctx, '#4a6ad0', ox + 3, 8, 24, 1);
      rect(ctx, OUT, ox + 6, 9, 20, 6);
      rect(ctx, '#e0904a', ox + 7, 10, 18, 4);
      rect(ctx, '#ffc080', ox + 7, 10, 18, 1);
      rect(ctx, OUT, ox + 21, 0, 2, 9);
      rect(ctx, OUT, ox + 19, 0, 7, 4);
      rect(ctx, '#6ad0ff', ox + 22, 1, 3, 2);
      for (const x of [5, 13, 21]) {
        rect(ctx, OUT, x + ox, 14, 6, 6);
        rect(ctx, '#55505e', x + ox + 1, 15, 4, 4);
        rect(ctx, '#c0c8d8', x + ox + (f ? 1 : 3), f ? 15 : 17, 2, 2);
      }
      tex.add(f, 0, ox, 0, 32, 20);
    }
  });

  // the anemometer: three cups on arms (2 frames: spinning)
  one('anemometer', 40, 12, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 20;
      rect(ctx, OUT, ox + 9, 4, 2, 8);
      rect(ctx, OUT, ox + 2, 4, 16, 1);
      const cups = f ? [[1, 1], [14, 1]] : [[4, 0], [11, 2]];
      for (const [x, y] of cups) { rect(ctx, OUT, ox + x, y, 5, 4); rect(ctx, '#ff6a2a', ox + x + 1, y + 1, 3, 2); }
      tex.add(f, 0, ox, 0, 20, 12);
    }
  });
}
