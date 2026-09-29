// Art for the Sun's six layers: its rocks and ores (tiles), back walls, ore
// icons, creatures (flame fairies, shadow blobs, plasma jellies, sunbeam
// bunnies, sparkies), fire flowers, the Solar Forge, the Sun's Heart, the
// crown, the giant trophy, the mini-sun, the Baby Sun Dragon, the Sun badges
// and a few icons.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';
const T = 16;
const fit = (rows, w = 16) => rows.map((r) => (r + '.'.repeat(w)).slice(0, w));

export const SUN_HOSTS = {
  corona: { base: '#d88a2a', dark: '#c0741e', light: '#eca040' },
  sunspot: { base: '#5a2a26', dark: '#44201c', light: '#7a3a2e' },
  plasma: { base: '#d85a90', dark: '#b84478', light: '#f080b0' },
  radiant: { base: '#e8d098', dark: '#d8bc80', light: '#f6e6c0' },
  fusion: { base: '#d0522a', dark: '#b03e1c', light: '#e87a44' },
  core: { base: '#f0c050', dark: '#e0a438', light: '#fae0a0' },
};

// ---------- tiles ----------

export function drawSunTiles(ctx, at, rng, B, rect, speckle) {
  // corona: golden sun-rock with wispy flame curls
  const corona = (id) => {
    speckle(ctx, at(id), rng, SUN_HOSTS.corona, 4);
    rect(ctx, '#b86a1a', at(id) + 9, 11, 3, 1);
  };
  corona(B.CORONA_ROCK);
  // sunstone: orange sun-gems
  corona(B.SUNSTONE);
  for (const [x, y] of [[2, 2], [9, 5], [4, 10]]) {
    const ox = at(B.SUNSTONE) + x;
    rect(ctx, '#8a3a0a', ox, y, 5, 5);
    rect(ctx, '#ff7a1a', ox + 1, y + 1, 3, 3);
    rect(ctx, '#ffe080', ox + 1, y + 1, 1, 1);
  }

  // sunspots: dark, cool rock with a soft ring
  const sunspot = (id) => {
    speckle(ctx, at(id), rng, SUN_HOSTS.sunspot, 5);
    rect(ctx, '#8a5a3a', at(id) + 4, 9, 5, 1);
  };
  sunspot(B.SUNSPOT_ROCK);
  // flare gems: white-gold crystal spikes
  sunspot(B.FLARE);
  for (const [x, y] of [[3, 2], [10, 7]]) {
    const ox = at(B.FLARE) + x;
    rect(ctx, '#8a6a10', ox, y, 4, 7);
    rect(ctx, '#fff6c0', ox + 1, y, 2, 6);
    rect(ctx, '#ffffff', ox + 1, y + 1, 1, 2);
  }

  // plasma rock: glowing pink with a brighter streak
  const plasma = (id) => {
    speckle(ctx, at(id), rng, SUN_HOSTS.plasma, 4);
    rect(ctx, '#ffb0d8', at(id) + 3, 5, 6, 1);
  };
  plasma(B.PLASMA_ROCK);
  // plasma orbs: round glowing pink-white balls
  plasma(B.PLASMA);
  for (const [x, y] of [[2, 1], [9, 8]]) {
    const ox = at(B.PLASMA) + x;
    rect(ctx, '#6a1a4a', ox + 1, y, 4, 6);
    rect(ctx, '#6a1a4a', ox, y + 1, 6, 4);
    rect(ctx, '#ff8ac8', ox + 1, y + 1, 4, 4);
    rect(ctx, '#ffffff', ox + 2, y + 2, 1, 1);
  }

  // radiance: bright white-gold crystal rock
  const radiant = (id) => {
    speckle(ctx, at(id), rng, SUN_HOSTS.radiant, 4);
    for (let k = 0; k < 4; k++) rect(ctx, '#e8c860', at(id) + 3 + k, 11 - k, 1, 1);
  };
  radiant(B.RADIANT_ROCK);
  // nova gems: starry blue-white gems
  radiant(B.NOVA);
  for (const [x, y] of [[2, 2], [9, 8]]) {
    const ox = at(B.NOVA) + x;
    rect(ctx, '#1a2a6a', ox, y + 1, 5, 3);
    rect(ctx, '#1a2a6a', ox + 1, y, 3, 5);
    rect(ctx, '#8ab8ff', ox + 1, y + 1, 3, 3);
    rect(ctx, '#ffffff', ox + 2, y + 2, 1, 1);
  }

  // fusion rock: swirling orange
  const fusion = (id) => {
    speckle(ctx, at(id), rng, SUN_HOSTS.fusion, 5);
    const ox = at(id);
    rect(ctx, '#ffb060', ox + 3, 3, 3, 1);
    rect(ctx, '#ffb060', ox + 6, 4, 1, 2);
    rect(ctx, '#a84410', ox + 9, 11, 3, 1);
  };
  fusion(B.FUSION_ROCK);

  // the Sun's core: blazing white-gold
  const core = (id) => {
    speckle(ctx, at(id), rng, SUN_HOSTS.core, 5);
    rect(ctx, '#ffb030', at(id) + 4, 7, 3, 1);
  };
  core(B.SUN_CORE);
  core(B.SUN_HEART);
  rect(ctx, '#ff7a1a', at(B.SUN_HEART) + 2, 10, 6, 1);
  rect(ctx, '#ff7a1a', at(B.SUN_HEART) + 11, 2, 1, 6);
}

// Back walls for the Sun's layers.
export function drawSunBacks(ctx, rect, back, BACK) {
  back(BACK.corona, { base: '#6a3a14', dark: '#5a3010', light: '#7a461a' });
  back(BACK.sunspots, { base: '#2e1810', dark: '#24120c', light: '#381e14' });
  back(BACK.plasmasea, { base: '#4a1a34', dark: '#3a142a', light: '#56203e' });
  back(BACK.radiance, { base: '#5a4a2a', dark: '#4e4024', light: '#665432' });
  back(BACK.fusion, { base: '#5a2a10', dark: '#4a220c', light: '#663216' });
  back(BACK.suncore, { base: '#7a6030', dark: '#6a5228', light: '#866a38' });
  rect(ctx, '#a0803c', BACK.suncore * T + 6, 6, 2, 1);
}

// ---------- ore icons (10x10) ----------

export function drawSunOreIcon(ctx, rect, ore) {
  if (ore === 'sunstone') {
    drawMap(ctx, 0, 0, ['..oooooo..', '.ossyysso.', 'osyyssssso', 'osysssssSo', 'ossssssSSo', '.ossssSSo.', '..oosSoo..', '....oo....'],
      { o: '#8a3a0a', s: '#ff7a1a', S: '#d85a0a', y: '#ffe080' });
    return true;
  }
  if (ore === 'flare') {
    drawMap(ctx, 0, 0, ['....oo....', '...owwo...', '...owyo...', '..owwyyo..', '..owyyyo..', '.owwyyyyo.', '.owyyyyyo.', 'owyyyyyyyo', '.oooooooo.'],
      { o: '#8a6a10', w: '#ffffff', y: '#fff0a0' });
    return true;
  }
  if (ore === 'plasma') {
    drawMap(ctx, 0, 0, ['..oooooo..', '.oppwwppo.', 'oppwwpppPo', 'opppppppPo', 'oppppppPPo', 'opppppPPPo', '.oppPPPPo.', '..oooooo..'],
      { o: '#6a1a4a', p: '#ff8ac8', P: '#d85a9a', w: '#ffffff' });
    return true;
  }
  if (ore === 'nova') {
    drawMap(ctx, 0, 0, ['....o.....', '...obo....', 'ooobbbooo.', '.obbwbbbo.', '..obbbbo..', '.obbobbbo.', '.obo..obo.', '.oo....oo.'],
      { o: '#1a2a6a', b: '#8ab8ff', w: '#ffffff' });
    return true;
  }
  return false;
}

// ---------- creatures (16x12, 2 frames) ----------

// a flame fairy: a tiny glowing sprite with fluttering wings
const FAIRY = [
  fit(['', '..ww......ww', '.wWWw....wWWw', '.wWWWw..wWWWw', '..wWWwooowWWw', '....oyyyyo', '....oykyko', '....oyyyyo', '.....orro', '......rr', '.......r', '']),
  fit(['', '', '', '...wwwooowww', '..wWWWyyyWWWw', '...wWoykykoWw', '....oyyyyo', '.....orro', '......rr', '.......r', '', '']),
];

// a shadow blob: a dark cool-grey wobbly blob with big shy eyes
const SHADOW_0 = fit(['', '', '', '.....oooooo', '...oossssssoo', '..osssssssssso', '..oswwsssswwso', '..oswksssswkso', '.ossssssssssso', '.osssssssssssso', '..oooooooooooo', '']);
const SHADOW = [SHADOW_0, fit(['', '', '', '', '....oooooooo', '..oosssssssssoo', '.osswwsssswwsso', '.osswksssswksso', 'osssssssssssssso', '.ooooooooooooooo', '', ''])];

// a plasma jelly: a glowing pink jellyfish
const PJELLY = [
  fit(['', '.....oooooo', '...oopppppPoo', '..opppwppppPPo', '..opkpppppkpPo', '..opppppppppPo', '..oooooooooooo', '...p.p.p.p.p', '...p..p.p..p', '....p.p..p.p', '....p..p..p', '']),
  fit(['', '', '.....oooooo', '...oopppppPoo', '..opppwppppPPo', '..opkpppppkpPo', '..opppppppppPo', '..oooooooooooo', '..p.p.p.p.p', '..p..p.p..p', '...p.p..p.p', '...p..p..p']),
];

// a sunbeam bunny: a glowing golden bunny
const BUNNY_0 = fit(['...oo...oo', '..oyyo.oyyo', '..oyyo.oyyo', '...oyooyo', '..ooyyyyyoo', '.oyyyyyyyyyo', '.oyykyyyykyo', '.oyyyyppyyyo', '.oyyyyyyyyyo', '..oyyyyyyyo', '..oyoooooyo', '..oo.....oo']);
const SUNBUNNY = [BUNNY_0, fit(['', ...BUNNY_0.slice(0, 1), ...BUNNY_0.slice(2)])];

// a sparky: a crackly little spark with a grin
const SPARKY = [
  fit(['.......y', '..y....y....y', '...y..yyy..y', '....yyyyyyy', '..yyyyooyyyyy', 'yyyyokwokwyyyy', '..yyyyoooyyyy', '....yyyyyyy', '...y..yyy..y', '..y....y....y', '.......y', '']),
  fit(['', '.y.....y.....y', '..y...yyy...y', '....yyyyyyy', '.yyyyyooyyyyyy', '..yyokwokwyyy', '.yyyyyoooyyyyy', '....yyyyyyy', '..y...yyy...y', '.y.....y.....y', '', '']),
];

// the Baby Sun Dragon: a tiny orange dragon with little wings (it flies)
const DRAGON = [
  fit(['', '....ww', '...wWWw....ooo', '...wWWWw..orrko', '....wWWw.orrrro', '.......oorrrryy', '..ooooorrrrro', '.oyrrrrryyro', 'oyyrrrrrrro', '.o..ooooo', '...o.o', '']),
  fit(['', '', '..........ooo', '.........orrko', '.........orrrro', '..wwwwwoorrrryy', '.wWWWWWrrrrrro', '..wWWWWryyyro', '.oyrrrrrrrro', 'oyyoooooo', '..o.o', '']),
];

// ---------- the rest ----------

function pxEllipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

export function drawSunWorld(scene, canvasTexture, rect) {
  const one = (key, w, h, fn) => {
    const { tex, ctx } = canvasTexture(scene, key, w, h);
    fn(ctx, tex);
    tex.refresh();
    return tex;
  };
  const sheet = (key, frames, pal, w = 16, h = 12) => one(key, w * frames.length, h, (ctx, tex) => {
    frames.forEach((rows, i) => {
      drawMap(ctx, i * w, 0, rows, pal);
      tex.add(i, 0, i * w, 0, w, h);
    });
  });

  sheet('fairy', FAIRY, { w: 'rgba(255,240,200,0.85)', W: '#ffe8a0', o: '#8a3a0a', y: '#ffe066', k: OUT, r: '#ff7a1a' });
  sheet('shadow', SHADOW, { o: '#1a1420', s: '#4a4058', w: '#ffffff', k: OUT });
  sheet('plasmajelly', PJELLY, { o: '#8a1a5a', p: '#ff8ac8', P: '#ffd0f0', k: OUT, w: '#ffffff' });
  sheet('sunbunny', SUNBUNNY, { o: '#8a5a10', y: '#ffe066', k: OUT, p: '#ff8ab8' });
  sheet('sparky', SPARKY, { y: '#ffe066', o: '#ff8a1a', k: OUT, w: '#ffffff' });
  sheet('pet-sundragon', DRAGON, { o: '#6a1a0a', r: '#ff7a2a', y: '#ffe066', k: OUT, w: 'rgba(255,220,160,0.9)', W: '#ffb060' });

  // a fire flower: a closed flame bud (0), and bloomed wide open (1) (32x24)
  one('fireflower', 64, 24, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 32;
      rect(ctx, '#3a8a2a', ox + 15, 12, 2, 12);
      rect(ctx, '#5ab04a', ox + 10, 17, 5, 2);
      rect(ctx, '#5ab04a', ox + 17, 15, 5, 2);
      if (f === 0) {
        pxEllipse(ctx, ox + 16, 9, 4, 5, OUT);
        pxEllipse(ctx, ox + 16, 9, 3, 4, '#ff7a1a');
        rect(ctx, '#ffe066', ox + 15, 6, 2, 3);
      } else {
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          pxEllipse(ctx, Math.round(ox + 16 + Math.cos(a) * 8), Math.round(9 + Math.sin(a) * 6), 3, 3, k % 2 ? '#ff5a1a' : '#ffb030');
        }
        pxEllipse(ctx, ox + 16, 9, 4, 4, '#ffe066');
        pxEllipse(ctx, ox + 16, 9, 2, 2, '#ffffff');
      }
      tex.add(f, 0, ox, 0, 32, 24);
    }
  });

  // the Solar Forge: a golden furnace with an anvil (0 resting, 1 hammering, glowing) (48x32)
  one('forge', 96, 32, (ctx, tex) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 48;
      // the furnace
      rect(ctx, OUT, ox + 4, 6, 24, 26);
      rect(ctx, '#c8903a', ox + 5, 7, 22, 25);
      rect(ctx, '#ffd070', ox + 5, 7, 22, 2);
      ell2(ctx, ox + 16, 22, 7, 6, OUT);
      ell2(ctx, ox + 16, 22, 6, 5, f ? '#fff6a0' : '#ff7a1a');
      rect(ctx, OUT, ox + 12, 0, 8, 7);
      rect(ctx, '#8a94a8', ox + 13, 1, 6, 6);
      // the anvil and a hammer
      rect(ctx, OUT, ox + 30, 20, 16, 5);
      rect(ctx, '#55505e', ox + 31, 21, 14, 3);
      rect(ctx, OUT, ox + 35, 25, 6, 7);
      rect(ctx, '#55505e', ox + 36, 25, 4, 6);
      if (f) {
        rect(ctx, '#a0703c', ox + 38, 8, 2, 11);
        rect(ctx, OUT, ox + 34, 5, 10, 5);
        rect(ctx, '#c0c8d8', ox + 35, 6, 8, 3);
        for (const [x, y] of [[33, 17], [44, 15], [40, 14]]) rect(ctx, '#ffe066', ox + x, y, 2, 2);
      } else {
        rect(ctx, '#a0703c', ox + 42, 12, 2, 9);
        rect(ctx, OUT, ox + 40, 10, 8, 4);
        rect(ctx, '#c0c8d8', ox + 41, 11, 6, 2);
      }
      tex.add(f, 0, ox, 0, 48, 32);
    }
  });

  // the Sun's Heart: a blazing gem with a ring of rays (icon and big)
  {
    const { tex, ctx } = canvasTexture(scene, 'sunheart-gem', 16, 16);
    drawMap(ctx, 0, 0, [
      '.......r........',
      '...r...r...r....',
      '....r.ooo.r.....',
      '.....ohhhho.....',
      '....ohwwhhho....',
      'rr.ohwhhhhhHo.rr',
      '...ohhhhhhhHo...',
      '...ohhhhhhHHo...',
      '....ohhhhHHo....',
      '.....ohhHHo.....',
      '....r.ooo.r.....',
      '...r...r...r....',
      '.......r........',
      '................',
      '................',
      '................',
    ], { o: '#8a3a0a', h: '#ffe066', H: '#ff9a2a', w: '#ffffff', r: '#ffb030' });
    tex.refresh();
    const big = canvasTexture(scene, 'sunheart-big', 48, 48);
    big.ctx.imageSmoothingEnabled = false;
    big.ctx.drawImage(tex.getSourceImage(), 0, 0, 16, 16, 0, 0, 48, 48);
    big.tex.refresh();
  }

  // the crown, worn on top of every character's head (16x20: the bottom 16
  // rows line up with the character, so the crown sits just above the helmet)
  one('suit-crown-worn', 16, 20, (ctx) => {
    drawMap(ctx, 4, 0, ['y..y..y.', 'yy.yy.yy', 'yyyryyyy', 'oooooooo'], { y: '#ffd84a', r: '#e0403a', o: '#c89a20' });
  });
  one('crown-icon', 12, 12, (ctx) => {
    drawMap(ctx, 0, 2, ['y....y....y.', 'yy..yyy..yy.', 'yyyyyryyyyy.', 'yybyyyyygyy.', 'yyyyyyyyyyy.', 'ooooooooooo.'], { y: '#ffd84a', r: '#e0403a', b: '#4a8aff', g: '#3ad07a', o: '#c89a20' });
  });

  // the giant gold trophy for the finale (32x40)
  one('trophy-big', 32, 40, (ctx) => {
    rect(ctx, '#7a5a10', 4, 2, 24, 4);
    rect(ctx, '#ffd84a', 5, 3, 22, 2);
    for (let y = 6; y < 22; y++) {
      const w = Math.round(11 - (y - 6) * 0.45);
      rect(ctx, '#7a5a10', 16 - w - 1, y, w * 2 + 2, 1);
      rect(ctx, '#ffd84a', 16 - w, y, w * 2, 1);
      rect(ctx, '#fff2a0', 16 - w + 1, y, 2, 1);
    }
    // handles
    for (const x of [0, 27]) { rect(ctx, '#7a5a10', x, 7, 5, 9); rect(ctx, '#ffd84a', x + 1, 8, 3, 7); rect(ctx, '#7a5a10', x + 2, 9, 1, 5); }
    rect(ctx, '#7a5a10', 13, 22, 6, 8);
    rect(ctx, '#ffd84a', 14, 22, 4, 8);
    rect(ctx, '#7a5a10', 7, 30, 18, 8);
    rect(ctx, '#c89a20', 8, 31, 16, 6);
    rect(ctx, '#ffd84a', 8, 31, 16, 1);
    // a little sun on the cup
    pxEllipse(ctx, 16, 12, 4, 4, '#ff9a2a');
    pxEllipse(ctx, 16, 12, 2, 2, '#fff6a0');
  });

  // the mini-sun that hangs over Earth camp after the finale (24x24)
  one('mini-sun', 24, 24, (ctx) => {
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      rect(ctx, k % 2 ? '#ffb030' : '#ffe066', Math.round(12 + Math.cos(a) * 10) - 1, Math.round(12 + Math.sin(a) * 10) - 1, 2, 2);
    }
    pxEllipse(ctx, 12, 12, 7, 7, '#ff9a2a');
    pxEllipse(ctx, 12, 12, 6, 6, '#ffd84a');
    pxEllipse(ctx, 11, 11, 3, 3, '#fff6c0');
    rect(ctx, OUT, 9, 12, 1, 1);
    rect(ctx, OUT, 14, 12, 1, 1);
    rect(ctx, '#e0603a', 10, 15, 4, 1);
  });

  // icons: a solar flare (the warning and its sticker), the golden monster,
  // Solar Station, the flag, the whole Sun Suit
  one('icon-flare', 14, 14, (ctx) => {
    pxEllipse(ctx, 7, 7, 4, 4, '#ff9a2a');
    pxEllipse(ctx, 7, 7, 3, 3, '#ffe066');
    for (const [x, y] of [[7, 0], [7, 13], [0, 7], [13, 7], [2, 2], [12, 2], [2, 12], [12, 12]]) rect(ctx, '#ffb030', x - (x > 7 ? 1 : 0), y - (y > 7 ? 1 : 0), 1, 1);
    rect(ctx, '#ffffff', 6, 5, 2, 2);
  });
  one('icon-goldmonster', 16, 16, (ctx) => {
    drawMap(ctx, 1, 1, ['....yyyyy.....', '...yooooo y...', '..yoyyyyyoy...', '..yoykyykoy...', '..yoyyyyyoy...', '..yoyyrryoy...', '...yooooo.y...', '..yyyyyyyyy...', '.yooyyyyyooy..', '.yo.yyyyy.oy..', '....yo.oy.....', '...yyo.oyy....'].map((r) => r.replace(/ /g, '.')),
      { y: '#ffd84a', o: '#ff9a2a', k: OUT, r: '#e0403a' });
    for (const [x, y] of [[0, 4], [14, 6], [2, 14], [13, 13]]) rect(ctx, '#fff6a0', x, y, 1, 1);
  });
  one('icon-sunbase', 14, 12, (ctx) => {
    ctx.fillStyle = 'rgba(255,220,120,0.7)';
    ctx.beginPath(); ctx.arc(7, 9, 6, Math.PI, 0); ctx.fill();
    rect(ctx, '#ffd84a', 6, 5, 2, 4);
    rect(ctx, '#e8a030', 0, 9, 14, 3);
    rect(ctx, '#c87818', 0, 11, 14, 1);
    rect(ctx, '#ff7a1a', 11, 1, 2, 8);
    rect(ctx, '#ffe066', 11, 0, 2, 1);
  });
  one('sun-flag', 16, 24, (ctx) => {
    rect(ctx, '#d4dce6', 2, 1, 2, 21);
    rect(ctx, '#8a94a8', 3, 1, 1, 21);
    rect(ctx, OUT, 4, 1, 12, 9);
    rect(ctx, '#ff7eb6', 4, 2, 11, 7);
    rect(ctx, '#ffd1e6', 4, 2, 11, 1);
    rect(ctx, '#ffe066', 9, 3, 1, 5);
    rect(ctx, '#ffe066', 7, 5, 5, 1);
    rect(ctx, '#ffe066', 8, 4, 3, 3);
    pxEllipse(ctx, 3, 23, 5, 2, '#ffb030');
  });
  one('icon-fullsuit', 16, 16, (ctx) => {
    // helmet, gloves, boots and jetpack around a little figure
    pxEllipse(ctx, 8, 4, 3, 3, 'rgba(200,240,255,0.7)');
    rect(ctx, '#ffd84a', 5, 6, 6, 1);
    rect(ctx, '#f2c29b', 7, 3, 2, 2);
    rect(ctx, '#4aa3ff', 6, 7, 4, 4);
    rect(ctx, '#e0503a', 4, 8, 2, 2);
    rect(ctx, '#e0503a', 10, 8, 2, 2);
    rect(ctx, '#e0503a', 12, 7, 3, 5);
    rect(ctx, '#ffb34a', 12, 12, 3, 2);
    rect(ctx, '#e0503a', 5, 12, 3, 2);
    rect(ctx, '#e0503a', 9, 12, 3, 2);
    rect(ctx, '#ffd84a', 5, 14, 3, 1);
    rect(ctx, '#ffd84a', 9, 14, 3, 1);
  });
}

// whole-pixel ellipse (a second name, used by the forge)
function ell2(ctx, cx, cy, rx, ry, color) { pxEllipse(ctx, cx, cy, rx, ry, color); }

// Six more badges (Sun layers) onto the right of the badge strip.
export function drawSunBadges(ctx, rect, ring) {
  ring(384, '#ffd84a', '#c87818');
  drawMap(ctx, 384 + 4, 4, ['..yy....', '.yyyy.y.', 'yyyyyyy.', '.yyyyy..', '..yy.y..', '....y...'], { y: '#fff6a0' });
  ring(400, '#8a4a2a', '#3a1a10');
  drawMap(ctx, 400 + 5, 3, ['..w...', '.wyw..', '.wyw..', 'wyyyw.', 'wyyyw.', '.www..'], { w: '#ffffff', y: '#fff0a0' });
  ring(416, '#ff6ab0', '#8a1a5a');
  drawMap(ctx, 416 + 4, 4, ['.oooooo.', 'oppwwppo', 'oppppppo', 'oppppppo', '.oooooo.'], { o: '#6a1a4a', p: '#ff8ac8', w: '#ffffff' });
  ring(432, '#fff4c0', '#c8a040');
  drawMap(ctx, 432 + 4, 3, ['...o....', '..obo...', 'oobbboo.', '.obwbo..', '.obobo..', 'oo...oo.'], { o: '#1a2a6a', b: '#8ab8ff', w: '#ffffff' });
  ring(448, '#ff8a2a', '#8a3a0a');
  drawMap(ctx, 448 + 3, 4, ['...oooo...', '..ossssoo.', '.oooooooo.', '..oo..oo..', '..oo..oo..'], { o: OUT, s: '#c0c8d8' });
  ring(464, '#ffffff', '#ffb030');
  drawMap(ctx, 464 + 3, 3, ['....r.....', '.r.ooo.r..', '..ohhho...', 'rohwhhhor.', '..ohhho...', '.r.ooo.r..', '....r.....'], { o: '#8a3a0a', h: '#ffe066', w: '#ffffff', r: '#ffb030' });
}
