// Art for Moon Base (the Moon's camp): the Cheese Factory, the Telescope, the
// UFO Hangar and the Mars Rocket (96x80 each); domes, the antenna, the landing
// pad and the hatch; and the star map's planets and Sun Suit pieces.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

// A filled ellipse in whole pixels. `top` draws only the top half.
function ell(ctx, cx, cy, rx, ry, color, top = false) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= (top ? 0 : ry); y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

// ---------- buildings (96x80) ----------

// A giant wedge of cheese with round windows, a door, a chimney and a mouse sign.
function drawCheeseFactory(ctx, rect) {
  // the wedge: sloping from low on the left to tall on the right
  for (let x = 6; x < 90; x++) {
    const top = Math.round(64 - (x - 6) * 0.62);
    rect(ctx, OUT, x, top, 1, 79 - top);
    rect(ctx, x < 88 ? '#ffd84a' : OUT, x, top + 1, 1, 77 - top);
  }
  for (let x = 7; x < 88; x++) rect(ctx, '#fff0a0', x, Math.round(64 - (x - 6) * 0.62) + 1, 1, 1);
  rect(ctx, '#e0b030', 7, 74, 81, 4);
  // cheese holes are the windows (warm light inside)
  for (const [x, y, r] of [[26, 58, 4], [48, 52, 5], [70, 40, 5], [74, 60, 4], [52, 68, 3]]) {
    ell(ctx, x, y, r + 1, r + 1, '#b87a10');
    ell(ctx, x, y, r, r, '#fff6c0');
    rect(ctx, '#ffe066', x - 1, y - r + 1, 2, 2 * r - 1);
  }
  // door
  rect(ctx, OUT, 34, 62, 12, 16);
  rect(ctx, '#8a5a1a', 35, 63, 10, 15);
  rect(ctx, '#ffe066', 42, 70, 2, 2);
  // chimney with a cheesy puff
  rect(ctx, OUT, 78, 2, 8, 20);
  rect(ctx, '#8a94a8', 79, 3, 6, 19);
  rect(ctx, '#c0c8d8', 79, 3, 6, 2);
  // the mouse sign on a pole
  rect(ctx, OUT, 12, 40, 2, 26);
  ell(ctx, 13, 36, 9, 7, OUT);
  ell(ctx, 13, 36, 8, 6, '#f4e4c1');
  drawMap(ctx, 7, 31, ['.oo..oo.....', 'oppoopo.....', '.ogggggo....', 'oggkgggo....', 'ogggggggoo..', '.oooooo...o.'],
    { o: OUT, p: '#ff9ab0', g: '#b8b0c8', k: OUT });
}

// A white observatory dome with the shutter open and a big telescope.
function drawTelescope(ctx, rect) {
  // base building
  rect(ctx, OUT, 16, 44, 64, 36);
  rect(ctx, '#d8dce6', 17, 45, 62, 34);
  rect(ctx, '#f0f2f8', 17, 45, 62, 2);
  rect(ctx, '#a8b0c0', 17, 72, 62, 7);
  rect(ctx, OUT, 42, 58, 12, 21);
  rect(ctx, '#5a6a78', 43, 59, 10, 20);
  rect(ctx, '#3aff7a', 51, 66, 1, 2);
  // the dome
  ell(ctx, 48, 45, 30, 26, OUT, true);
  ell(ctx, 48, 45, 29, 25, '#f0f2f8', true);
  for (let y = 22; y < 45; y += 6) rect(ctx, '#c8ccd8', 20, y, 56, 1);
  // shutter slit and the telescope tube sticking out, up and to the right
  rect(ctx, OUT, 44, 19, 9, 26);
  rect(ctx, '#1a1a38', 45, 20, 7, 25);
  for (let k = 0; k < 22; k++) {
    rect(ctx, OUT, 46 + k, 30 - k, 8, 7);
  }
  for (let k = 0; k < 22; k++) {
    rect(ctx, '#4a6ab0', 47 + k, 31 - k, 6, 5);
    rect(ctx, '#8ab0e8', 47 + k, 31 - k, 6, 1);
  }
  // the lens (twinkles in the camp)
  rect(ctx, OUT, 66, 4, 11, 11);
  rect(ctx, '#9ff6ff', 67, 5, 9, 9);
  rect(ctx, '#ffffff', 68, 6, 3, 3);
  // little stars around
  for (const [x, y] of [[8, 10], [88, 30], [30, 6]]) {
    rect(ctx, '#ffe066', x, y - 2, 1, 5);
    rect(ctx, '#ffe066', x - 2, y, 5, 1);
  }
}

// A curved metal hangar with a big round door (the UFO hovers above it).
function drawHangar(ctx, rect) {
  ell(ctx, 48, 79, 44, 40, OUT, true);
  ell(ctx, 48, 79, 43, 39, '#7a8a98', true);
  for (let x = 12; x < 86; x += 10) rect(ctx, '#5a6a78', x, 42, 1, 38);
  for (let y = 48; y < 79; y += 8) rect(ctx, '#8a9aa8', 8, y, 80, 1);
  // the big round door, open a crack with green light
  ell(ctx, 48, 79, 22, 24, OUT, true);
  ell(ctx, 48, 79, 21, 23, '#46545f', true);
  rect(ctx, '#3aff7a', 46, 60, 4, 19);
  rect(ctx, '#aaffcc', 47, 60, 2, 19);
  // stripes and lights on the arch
  for (let i = 0; i < 7; i++) {
    const a = Math.PI - (i / 6) * Math.PI;
    rect(ctx, i % 2 ? '#ffe066' : '#ff5a5a', Math.round(48 + Math.cos(a) * 40) - 1, Math.round(79 - Math.sin(a) * 36) - 1, 3, 3);
  }
  // a landing ring painted in front
  rect(ctx, '#c0c8d8', 22, 76, 52, 3);
  rect(ctx, '#ffe066', 30, 77, 8, 1);
  rect(ctx, '#ffe066', 58, 77, 8, 1);
}

// The Mars Rocket: bigger, with two boosters, on a launch tower.
function drawMarsRocket(ctx, rect) {
  // launch tower on the left
  rect(ctx, OUT, 8, 6, 14, 74);
  for (let y = 8; y < 78; y += 8) {
    rect(ctx, '#e0503a', 9, y, 12, 2);
    for (let k = 0; k < 6; k++) rect(ctx, '#a83a2a', 10 + k * 2, y + 2 + k, 1, 1);
  }
  rect(ctx, '#8a94a8', 20, 20, 14, 3);
  drawMarsShip(ctx, rect);
}

// The Mars Rocket itself (without its tower): it stands on Mars Base's pad and flies.
export function drawMarsShip(ctx, rect, dx = 0) {
  // boosters
  for (const bx of [34 + dx, 62 + dx]) {
    rect(ctx, OUT, bx - 1, 36, 12, 40);
    rect(ctx, '#f0f0f8', bx, 37, 10, 38);
    rect(ctx, '#e0503a', bx, 37, 10, 5);
    rect(ctx, '#c8ccd8', bx + 7, 42, 3, 33);
    rect(ctx, OUT, bx, 74, 10, 5);
    rect(ctx, '#55505e', bx + 1, 74, 8, 4);
    ell(ctx, bx + 5, 37, 5, 6, '#e0503a', true);
  }
  // the main body
  rect(ctx, OUT, 41 + dx, 14, 22, 62);
  rect(ctx, '#f8f8ff', 42 + dx, 15, 20, 60);
  rect(ctx, '#d0d4e0', 57 + dx, 15, 5, 60);
  for (const y of [30, 52]) { rect(ctx, '#e0503a', 42 + dx, y, 20, 4); rect(ctx, '#ff8a6a', 42 + dx, y, 20, 1); }
  // nose cone
  for (let k = 0; k < 14; k++) {
    const w = Math.max(2, Math.round(22 * Math.sqrt(1 - k / 14)));
    rect(ctx, OUT, 52 + dx - Math.floor(w / 2) - 1, 14 - k, w + 2, 1);
    rect(ctx, '#e0503a', 52 + dx - Math.floor(w / 2), 14 - k, w, 1);
  }
  // round window, with a planet-red Mars sticker below it
  ell(ctx, 52 + dx, 23, 5, 5, OUT);
  ell(ctx, 52 + dx, 23, 4, 4, '#8ac0ff');
  rect(ctx, '#ffffff', 50 + dx, 21, 2, 2);
  ell(ctx, 52 + dx, 43, 5, 5, '#a83a2a');
  ell(ctx, 52 + dx, 43, 4, 4, '#e07a4a');
  rect(ctx, '#c8583a', 50 + dx, 42, 2, 1);
  rect(ctx, '#c8583a', 53 + dx, 45, 2, 1);
  // fins and the nozzle
  rect(ctx, OUT, 37 + dx, 62, 5, 14);
  rect(ctx, '#e0503a', 38 + dx, 63, 3, 12);
  rect(ctx, OUT, 62 + dx, 62, 5, 14);
  rect(ctx, '#e0503a', 63 + dx, 63, 3, 12);
  rect(ctx, OUT, 45 + dx, 75, 14, 5);
  rect(ctx, '#55505e', 46 + dx, 75, 12, 4);
}

export const MOON_BUILDINGS = { cheesefactory: drawCheeseFactory, telescope: drawTelescope, hangar: drawHangar, marsrocket: drawMarsRocket };

// ---------- planets for the star map (and the launch) ----------

function drawPlanet(ctx, rect, id) {
  if (id === 'moon') {
    ell(ctx, 16, 16, 14, 14, '#8a8a9a');
    ell(ctx, 16, 16, 13, 13, '#d0d0dc');
    for (const [x, y, r] of [[11, 11, 3], [20, 18, 4], [12, 21, 2], [21, 9, 2]]) { ell(ctx, x, y, r, r, '#a8a8b8'); ell(ctx, x - 1, y - 1, r - 1, r - 1, '#bcbccc'); }
  } else if (id === 'mars') {
    ell(ctx, 16, 16, 14, 14, '#7a2a1a');
    ell(ctx, 16, 16, 13, 13, '#e0703a');
    for (const [x, y, w] of [[8, 10, 8], [15, 17, 10], [10, 22, 6]]) rect(ctx, '#b84a2a', x, y, w, 2);
    ell(ctx, 16, 5, 5, 2, '#ffffff');
  } else if (id === 'saturn') {
    ell(ctx, 16, 16, 11, 11, '#8a6a3a');
    ell(ctx, 16, 16, 10, 10, '#f0d8a0');
    rect(ctx, '#d8b878', 7, 12, 18, 2);
    rect(ctx, '#d8b878', 8, 19, 16, 2);
    // the rings (icy blue), across the front
    for (let x = 0; x < 32; x++) {
      const y = Math.round(16 + (x - 16) * 0.18);
      rect(ctx, '#9fe0ff', x, y, 1, 2);
      if (x % 3 === 0) rect(ctx, '#ffffff', x, y, 1, 1);
    }
  } else if (id === 'dino') {
    ell(ctx, 16, 16, 14, 14, '#1a4a2a');
    ell(ctx, 16, 16, 13, 13, '#4ab05a');
    ell(ctx, 10, 12, 5, 4, '#2a8a3a');
    ell(ctx, 21, 20, 6, 4, '#2a8a3a');
    // a volcano with a puff
    rect(ctx, '#7a4a2a', 14, 6, 6, 6);
    rect(ctx, '#ff6a2a', 16, 5, 2, 2);
    // a tiny long-neck dino on top
    drawMap(ctx, 6, 20, ['....oo', '....go', '...go.', 'gggg..', 'g..g..'], { o: '#1a3a1a', g: '#1a3a1a' });
  } else if (id === 'sun') {
    // big and glowing, with rays
    ell(ctx, 16, 16, 16, 16, 'rgba(255,200,80,0.35)');
    ell(ctx, 16, 16, 12, 12, '#ff8a1a');
    ell(ctx, 16, 16, 11, 11, '#ffb82a');
    ell(ctx, 14, 14, 7, 7, '#ffe066');
    ell(ctx, 13, 12, 3, 3, '#fff8d0');
  }
}

// ---------- the Sun Suit pieces (12x12 icons) ----------

const SUIT = {
  boots: ['............', '............', '..oooo......', '..orro......', '..orro......', '..orro......', '..orrooooo..', '..orrrrrrro.', '..oyyyyyyyo.', '..oooooooooo', '............', '............'],
  gloves: ['............', '...o.o.o....', '..oroooro...', '..orrrrro...', '..orrrrroo..', '..orrrrrroo.', '..orrrrrro..', '..oyyyyyo...', '..oyyyyyo...', '..ooooooo...', '............', '............'],
  jetpack: ['............', '..oooooooo..', '..osssssso..', '.oosyssysoo.', '.ossyssysso.', '.osssssssso.', '.oosssssoo..', '..oroo.oro..', '..oyo..oyo..', '...y....y...', '..y.y..y.y..', '............'],
};

export function drawMoonBase(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
  };
  for (const [id, draw] of Object.entries(MOON_BUILDINGS)) one(`bld-${id}`, 96, 80, (ctx) => draw(ctx, rect));

  // a glowing glass dome (a house for the diggers)
  one('moon-dome', 64, 36, (ctx) => {
    ell(ctx, 32, 35, 30, 30, OUT, true);
    ell(ctx, 32, 35, 29, 29, '#5a8ab0', true);
    ell(ctx, 32, 35, 27, 27, '#9fd8ff', true);
    for (let x = 8; x < 58; x += 10) rect(ctx, '#7ab8e0', x, 12, 1, 23);
    rect(ctx, '#ffffff', 16, 12, 4, 2);
    rect(ctx, '#ffffff', 13, 16, 2, 4);
    // warm lights inside
    rect(ctx, '#ffe066', 22, 26, 6, 5);
    rect(ctx, '#ffe066', 38, 24, 6, 7);
    rect(ctx, '#c0c8d8', 2, 33, 60, 3);
  });
  // an antenna with a dish and a blinking light
  one('moon-antenna', 24, 48, (ctx) => {
    rect(ctx, OUT, 11, 12, 3, 36);
    rect(ctx, '#c0c8d8', 12, 12, 1, 36);
    for (let k = 0; k < 8; k++) rect(ctx, '#8a94a8', 8 + (k % 2) * 6, 16 + k * 4, 3, 1);
    ell(ctx, 12, 10, 10, 5, OUT, true);
    ell(ctx, 12, 10, 9, 4, '#e0e4f0', true);
    rect(ctx, '#8a94a8', 11, 2, 2, 8);
    rect(ctx, '#ff5a5a', 10, 0, 4, 3);
  });
  // the landing pad: a round metal platform with lights
  one('moon-pad', 96, 10, (ctx) => {
    rect(ctx, OUT, 4, 2, 88, 8);
    rect(ctx, '#8a94a8', 5, 3, 86, 6);
    rect(ctx, '#c0c8d8', 5, 3, 86, 2);
    for (let x = 10; x < 90; x += 12) rect(ctx, '#ffe066', x, 6, 4, 2);
    rect(ctx, '#46545f', 40, 3, 16, 2);
  });
  // the hatch down into the Moon: a round metal lid on a frame
  one('moon-hatch', 32, 20, (ctx) => {
    rect(ctx, OUT, 2, 14, 28, 6);
    rect(ctx, '#8a94a8', 3, 15, 26, 4);
    ell(ctx, 16, 14, 11, 4, OUT, true);
    ell(ctx, 16, 14, 10, 3, '#c0c8d8', true);
    rect(ctx, '#3aff7a', 14, 16, 4, 1);
    rect(ctx, OUT, 6, 4, 2, 11);
    rect(ctx, OUT, 24, 4, 2, 11);
    rect(ctx, '#ffe066', 5, 2, 4, 3);
    rect(ctx, '#ffe066', 23, 2, 4, 3);
  });

  // planets (32x32); the Earth is drawn by the Moon art
  for (const id of ['moon', 'mars', 'saturn', 'dino', 'sun']) one(`planet-${id}`, 32, 32, (ctx) => drawPlanet(ctx, rect, id));
  // Sun Suit pieces
  const SUIT_PAL = { o: OUT, r: '#e0503a', y: '#ffd84a', s: '#c0c8d8' };
  for (const [id, rows] of Object.entries(SUIT)) one(`suit-${id}`, 12, 12, (ctx) => drawMap(ctx, 0, 0, rows, SUIT_PAL));
  // the helmet as a little icon (the one worn is 'suit-helmet', 16x16)
  one('suit-helmet-icon', 12, 12, (ctx) => {
    ell(ctx, 6, 5, 5, 5, 'rgba(200,240,255,0.5)');
    ell(ctx, 6, 5, 4, 4, 'rgba(160,220,255,0.35)');
    rect(ctx, '#ffffff', 3, 2, 2, 1);
    rect(ctx, '#c89a20', 1, 9, 10, 2);
    rect(ctx, '#ffd84a', 1, 9, 10, 1);
    rect(ctx, '#ffe066', 5, 0, 2, 1);
  });
  // "coming soon": a traffic cone and a little clock
  one('icon-cone', 12, 14, (ctx) => {
    rect(ctx, OUT, 5, 0, 2, 2);
    for (let k = 0; k < 10; k++) {
      const w = 2 + Math.round(k * 0.8);
      rect(ctx, OUT, 6 - w / 2 - 1, 1 + k, w + 2, 1);
      rect(ctx, k === 3 || k === 7 ? '#ffffff' : '#ff8a1a', 6 - w / 2, 1 + k, w, 1);
    }
    rect(ctx, OUT, 0, 11, 12, 3);
    rect(ctx, '#ff8a1a', 1, 11, 10, 2);
  });
  one('icon-clock', 12, 12, (ctx) => {
    ell(ctx, 6, 6, 6, 6, OUT);
    ell(ctx, 6, 6, 5, 5, '#fff6e0');
    rect(ctx, OUT, 6, 2, 1, 4);
    rect(ctx, OUT, 6, 6, 3, 1);
  });
}
