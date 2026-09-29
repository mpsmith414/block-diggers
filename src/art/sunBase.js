// Art for Solar Station (the Sun's camp): the Sunflower Garden, the Sundial
// Tower, the Sunbeam Lift and the Hall of Heroes (96x80 each); flame
// fountains, solar panels, golden domes, the sunbeam lift car, and the Sun
// ship (the Sun Rocket off its tower).

import { drawSunShip } from './dinoBase.js';

const OUT = '#2a1d2e';

function ell(ctx, cx, cy, rx, ry, color, top = false) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= (top ? 0 : ry); y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

// one giant sunflower: a tall stem, two leaves and a big smiling face
function sunflower(ctx, rect, x, top, r) {
  rect(ctx, OUT, x - 2, top, 4, 80 - top);
  rect(ctx, '#3a9a3a', x - 1, top, 2, 80 - top);
  ell(ctx, x - 6, top + 22, 6, 3, '#4ab04a');
  ell(ctx, x + 6, top + 30, 6, 3, '#4ab04a');
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    ell(ctx, Math.round(x + Math.cos(a) * r), Math.round(top + Math.sin(a) * r), 4, 4, OUT);
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    ell(ctx, Math.round(x + Math.cos(a) * r), Math.round(top + Math.sin(a) * r), 3, 3, k % 2 ? '#ffd84a' : '#ffe880');
  }
  ell(ctx, x, top, r - 2, r - 2, OUT);
  ell(ctx, x, top, r - 3, r - 3, '#8a5a2a');
  rect(ctx, OUT, x - 3, top - 2, 1, 2);
  rect(ctx, OUT, x + 2, top - 2, 1, 2);
  rect(ctx, '#ff9a6a', x - 2, top + 2, 4, 1);
}

// The Sunflower Garden: three giant sunflowers in a golden planter.
function drawSunflowers(ctx, rect) {
  sunflower(ctx, rect, 22, 30, 9);
  sunflower(ctx, rect, 48, 16, 11);
  sunflower(ctx, rect, 74, 34, 9);
  rect(ctx, OUT, 4, 66, 88, 14);
  rect(ctx, '#e8a030', 5, 67, 86, 13);
  rect(ctx, '#ffd070', 5, 67, 86, 2);
  for (let x = 10; x < 90; x += 12) rect(ctx, '#c87818', x, 71, 6, 2);
}

// The Sundial Tower: a golden tower with a big sundial face and a spyglass.
function drawSundial(ctx, rect) {
  rect(ctx, OUT, 34, 30, 28, 50);
  rect(ctx, '#f0c870', 35, 31, 26, 49);
  rect(ctx, '#d8a850', 55, 31, 6, 49);
  for (let y = 40; y < 80; y += 8) rect(ctx, '#c89040', 35, y, 26, 1);
  rect(ctx, OUT, 44, 64, 9, 16);
  rect(ctx, '#6a3a14', 45, 65, 7, 15);
  // the sundial on top: a flat golden disc with a pointer and hour marks
  ell(ctx, 48, 28, 26, 8, OUT);
  ell(ctx, 48, 28, 25, 7, '#ffe066');
  ell(ctx, 48, 28, 20, 5, '#fff2a0');
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    rect(ctx, '#c87818', Math.round(48 + Math.cos(a) * 22), Math.round(28 + Math.sin(a) * 6), 2, 1);
  }
  for (let k = 0; k < 14; k++) rect(ctx, OUT, 48 + Math.floor(k / 2), 27 - k, 2, 1);
  // its shadow pointing at a chest
  rect(ctx, 'rgba(90,50,20,0.5)', 26, 29, 20, 2);
  rect(ctx, '#6b3f1c', 4, 70, 12, 10);
  rect(ctx, '#9a5f2c', 5, 71, 10, 3);
  rect(ctx, '#f5c629', 9, 73, 2, 3);
  // a spyglass at a window
  rect(ctx, OUT, 60, 42, 16, 5);
  rect(ctx, '#c0c8d8', 61, 43, 14, 3);
  rect(ctx, '#ffd84a', 72, 43, 3, 3);
}

// The Sunbeam Lift: a golden gantry with a beam of sunshine going down a hole.
function drawSunbeam(ctx, rect) {
  // the beam
  for (let y = 12; y < 80; y++) {
    const w = 8 + Math.round((y - 12) * 0.12);
    rect(ctx, y % 6 < 3 ? 'rgba(255,240,150,0.75)' : 'rgba(255,220,90,0.75)', 48 - w, y, w * 2, 1);
  }
  rect(ctx, 'rgba(255,255,255,0.6)', 46, 14, 3, 66);
  // the gantry legs and top
  for (const x of [22, 70]) {
    rect(ctx, OUT, x - 2, 10, 6, 70);
    rect(ctx, '#e8a030', x - 1, 11, 4, 69);
    for (let y = 16; y < 80; y += 10) rect(ctx, '#c87818', x - 1, y, 4, 2);
  }
  rect(ctx, OUT, 18, 4, 62, 10);
  rect(ctx, '#ffd84a', 19, 5, 60, 8);
  rect(ctx, '#fff2a0', 19, 5, 60, 2);
  // the sun lamp shining down
  ell(ctx, 48, 12, 8, 6, OUT);
  ell(ctx, 48, 12, 7, 5, '#fff6c0');
  ell(ctx, 48, 11, 4, 3, '#ffffff');
  // the hole
  ell(ctx, 48, 78, 20, 3, OUT);
  ell(ctx, 48, 78, 18, 2, '#3a1a0a');
}

// The Hall of Heroes: a golden hall with columns, a crown on the roof and
// statues of the pets and the suit.
function drawHall(ctx, rect) {
  // the steps
  rect(ctx, OUT, 2, 72, 92, 8);
  rect(ctx, '#f0d890', 3, 73, 90, 7);
  rect(ctx, '#e0c070', 8, 76, 80, 1);
  // the floor and back wall
  rect(ctx, OUT, 8, 34, 80, 39);
  rect(ctx, '#ffe8a0', 9, 35, 78, 38);
  // the columns
  for (const x of [10, 30, 58, 78]) {
    rect(ctx, OUT, x - 1, 34, 10, 39);
    rect(ctx, '#fff6d0', x, 35, 8, 38);
    rect(ctx, '#e8d090', x + 5, 35, 3, 38);
    rect(ctx, '#ffd84a', x - 1, 34, 10, 3);
  }
  // the roof: a triangle with a sun in it
  for (let k = 0; k < 18; k++) {
    rect(ctx, OUT, 4 + k * 2, 34 - k, 88 - k * 4, 1);
    rect(ctx, k % 4 ? '#ffd84a' : '#e8b030', 5 + k * 2, 34 - k, 86 - k * 4, 1);
  }
  ell(ctx, 48, 26, 5, 5, '#ff9a2a');
  ell(ctx, 48, 26, 3, 3, '#fff6a0');
  // a crown on top
  rect(ctx, '#ffd84a', 42, 12, 13, 4);
  for (const x of [42, 47, 52]) rect(ctx, '#ffd84a', x, 8, 3, 4);
  rect(ctx, '#e0403a', 47, 13, 3, 2);
  // statues on plinths: a pet, the helmet, a star
  for (const [x, c] of [[20, '#e8c880'], [48, '#e8c880'], [70, '#e8c880']]) { rect(ctx, OUT, x - 5, 62, 11, 11); rect(ctx, c, x - 4, 63, 9, 10); }
  ell(ctx, 20, 56, 4, 5, '#ffd84a');
  rect(ctx, '#ffd84a', 17, 49, 2, 3);
  rect(ctx, '#ffd84a', 22, 49, 2, 3);
  ell(ctx, 48, 56, 5, 5, '#ffd84a');
  rect(ctx, '#fff6c0', 45, 54, 5, 3);
  for (let k = 0; k < 5; k++) rect(ctx, '#ffd84a', 70 - k, 52 + k, k * 2 + 1, 1);
  rect(ctx, '#ffd84a', 67, 57, 7, 3);
}

export const SUN_BUILDINGS = { sunflowers: drawSunflowers, sundial: drawSundial, sunbeam: drawSunbeam, hall: drawHall };

export function drawSunBase(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };
  for (const [id, draw] of Object.entries(SUN_BUILDINGS)) one(`bld-${id}`, 96, 80, (ctx) => draw(ctx, rect));

  // the Sun Rocket on its own (it stands on Solar Station's pad, and flies)
  one('sun-ship', 96, 80, (ctx) => drawSunShip(ctx, rect, 8));

  // a flame fountain: a golden bowl with a flickering flame (2 frames, 24x40)
  one('flame-fountain', 48, 40, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 24;
      rect(ctx, OUT, ox + 9, 26, 6, 14);
      rect(ctx, '#e8a030', ox + 10, 26, 4, 14);
      ell(ctx, ox + 12, 26, 10, 4, OUT);
      ell(ctx, ox + 12, 26, 9, 3, '#ffd84a');
      const lean = f ? 1 : -1;
      ell(ctx, ox + 12, 18, 6, 8, '#ff6a1a');
      ell(ctx, ox + 12 + lean, 14, 4, 8, '#ff9a2a');
      ell(ctx, ox + 12 + lean * 2, 12, 2, 6, '#ffe066');
      rect(ctx, '#ffffff', ox + 12, 20, 1, 3);
      tex.add(f, 0, ox, 0, 24, 40);
    }
  });

  // a solar panel on a stand (32x28)
  one('solar-panel', 32, 28, (ctx) => {
    rect(ctx, OUT, 15, 14, 3, 14);
    rect(ctx, '#8a94a8', 16, 14, 1, 14);
    for (let k = 0; k < 10; k++) {
      rect(ctx, OUT, 1 + k, 12 - k, 30 - k, 1);
    }
    for (let k = 1; k < 9; k++) rect(ctx, k % 3 ? '#3a5ab0' : '#6a8ae0', 2 + k, 12 - k, 28 - k - 1, 1);
    for (const x of [10, 18]) for (let k = 1; k < 9; k++) rect(ctx, '#c0c8d8', x + k, 12 - k, 1, 1);
  });

  // a golden dome (48x28)
  one('gold-dome', 48, 28, (ctx) => {
    ell(ctx, 24, 27, 22, 22, OUT, true);
    ell(ctx, 24, 27, 21, 21, '#ffd84a', true);
    ell(ctx, 18, 16, 6, 5, '#fff2a0');
    rect(ctx, OUT, 18, 18, 11, 10);
    rect(ctx, '#6a3a14', 19, 19, 9, 9);
    rect(ctx, '#ffe066', 22, 21, 3, 3);
  });

  // the sunbeam lift car: a golden sun-shaped gondola with a seat (2 frames, 32x24)
  one('sun-lift', 64, 24, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 32;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + f * 0.39;
        rect(ctx, '#ffb030', Math.round(ox + 16 + Math.cos(a) * 12) - 1, Math.round(12 + Math.sin(a) * 10) - 1, 3, 3);
      }
      ell(ctx, ox + 16, 12, 9, 8, OUT);
      ell(ctx, ox + 16, 12, 8, 7, '#ffd84a');
      ell(ctx, ox + 14, 9, 3, 2, '#fff6c0');
      rect(ctx, OUT, ox + 9, 13, 14, 5);
      rect(ctx, '#e0503a', ox + 10, 14, 12, 3);
      tex.add(f, 0, ox, 0, 32, 24);
    }
  });
}
