// Art for the deeper world: pterodactyls, toy robots, aliens and ember wisps;
// ferns, bones, toy bricks, space crystals, ember flowers and big dinosaur
// skeletons; the Heart of the World, meteorites and the four layer badges.

import { drawMap } from './pixelmap.js';
import { drawMoonBadges } from './moonWorld.js';
import { drawMarsBadges } from './marsWorld.js';
import { drawSaturnBadges } from './saturnWorld.js';
import { drawDinoBadges } from './dinoWorld.js';
import { drawSunBadges } from './sunWorld.js';

const OUT = '#2a1d2e';
const BONE = '#efe4c8';
const BONE_D = '#b8a888';

// 2-frame creature sheets, 16x12 per frame (like the slime and the bat).
function sheet(scene, canvasTexture, key, frames) {
  const { tex, ctx } = canvasTexture(scene, key, 16 * frames.length, 12);
  frames.forEach((draw, i) => {
    draw(ctx, i * 16);
    tex.add(i, 0, i * 16, 0, 16, 12);
  });
  tex.refresh();
}

const PTERO = [
  // wings up
  ['..............ww', '.w..........www.', '.ww.....c..www..', '..ww...cc.www...', '...wwwwbbbww....',
    '....wwbbbbbhhhh.', '.......bbbbhHhhk', '........bb.hhkkk', '.........f......', '........f.f.....', '................', '................'],
  // wings down
  ['................', '................', '........c.......', '.......cc.......', '......bbbb......',
    '.....bbbbbbhhhh.', '...wwwbbbbbhHhhk', '..wwww.bbbwwhkkk', '.wwww...fwwww...', 'www.....f.wwww..', 'w...........www.', '..............ww'],
];
const PTERO_PAL = { w: '#c86a3a', b: '#e08a4a', c: '#ff5a5a', h: '#f0a060', H: '#2a1d2e', k: '#ffe066', f: '#8a4a2a' };

const ROBOT = [
  ['.......k........', '.......r........', '...oooooooooo...', '...obbbbbbbbo.yy', '...obwwbbwwbo.y.',
    '...obwkbbwkbo.yy', '...obbbbbbbbo...', '...obbrrrrbbo...', '...oooooooooo...', '....og....go....', '....og....go....', '...ooo....ooo...'],
  ['.......k........', '.......r........', '...oooooooooo...', 'yy.obbbbbbbbo...', '.y.obwwbbwwbo...',
    'yy.obwkbbwkbo...', '...obbbbbbbbo...', '...obbrrrrbbo...', '...oooooooooo...', '.....og..go.....', '....oog..goo....', '................'],
];
const ROBOT_PAL = { o: OUT, b: '#5a8ad8', w: '#ffffff', k: '#2a1d2e', r: '#e0403a', y: '#ffd84a', g: '#9aa4b8' };

const ALIEN = [
  ['.....a....a.....', '.....A....A.....', '......a..a......', '....gggggggg....', '...gggggggggg...',
    '...ggwwwwwwgg...', '...ggwkkkkwgg...', '...ggwwwwwwgg...', '....gggggggg....', '....G.G..G.G....', '...G..G..G..G...', '................'],
  ['....a......a....', '....A......A....', '.....a....a.....', '....gggggggg....', '...gggggggggg...',
    '...ggwwwwwwgg...', '...ggwwkkwwgg...', '...ggwwwwwwgg...', '....gggggggg....', '.....G.GG.G.....', '.....G.GG.G.....', '................'],
];
const ALIEN_PAL = { g: '#7ae05a', G: '#4aa83a', w: '#ffffff', k: '#2a1d6e', a: '#b0ff90', A: '#ff8ec0' };

const WISP = [
  ['.......y........', '......yy........', '......yoy.......', '.....yoooy......', '....yoooooy.....',
    '....ooooooo.....', '...oorooroo.....', '...ooooooo......', '....oommoo......', '.....ooooo......', '......rrr.......', '.......r........'],
  ['........y.......', '.......yy.......', '......yoy.......', '.....yoooy......', '.....ooooooy....',
    '....ooooooo.....', '....oorooroo....', '.....ooooooo....', '.....oommoo.....', '......ooooo.....', '.......rrr......', '........r.......'],
];
const WISP_PAL = { y: '#fff2a0', o: '#ffa040', r: '#c83a1a', m: '#ff6a2a' };

// Decorations, 3 variants each (16x16), standing on floors.
const FERN = [
  ['................', '................', '................', '................', '.........f......', '........fF..f...',
    '...f...fF..fF...', '...Ff..fF.fF....', '..fFf.fF.fF..f..', '...fFfF.fF..fF..', '.f..fFffF..fF...', '.Ff..fFF.ffF....',
    '..fFf.FF.fF.....', '...fFfFFfF......', '.....fFFf.......', '......sFs.......'],
  ['................', '................', '................', '................', '................', '................',
    '................', '.......f........', '......fFf.......', '..f..fF.Ff..f...', '..Ff.F...fF.F...', '...fFf...fFf....',
    '....fF..fF......', '.....fFfF.......', '......fF........', '......sFs.......'],
  ['................', '................', '................', '................', '................', '................',
    '................', '................', '................', '................', '..f.......f.....', '..Ff..f..fF..f..',
    '...fF.Ff.F..fF..', '....fFfFfF.fF...', '.....fFFFfF.....', '......sFs.......'],
];
const FERN_PAL = { f: '#6ac04a', F: '#2f7a3a', s: '#6b4a2a' };

const BONES = [
  ['................', '................', '................', '................', '................', '................',
    '................', '................', '................', '................', '................', '................',
    '.oo........oo...', 'owwoooooooowwo..', 'owwwwwwwwwwwwo..', '.oo........oo...'],
  ['................', '................', '................', '................', '................', '................',
    '................', '................', '................', '................', '....oooooo......', '...owwwwwwoo....',
    '..owkkwwwwwwo...', '..owwwwwwwwwwo..', '...owwowowowo...', '....oo.o.o.o....'],
  ['................', '................', '................', '................', '................', '................',
    '................', '................', '................', '.....ooooo......', '....ow...wo.....', '...ow.ooo.wo....',
    '..ow.ow.wo.wo...', '..ow.ow.wo.wo...', '..ow.ow.wo.wo...', '.oooooooooooo...'],
];
const BONES_PAL = { o: '#8a7a5a', w: BONE, k: '#3a2a20' };

// Toy bricks lying about: rows of [x, y, width, colour].
const TOYBLOCKS = [
  [[1, 12, 8, 'r'], [9, 12, 6, 'b'], [4, 8, 6, 'y']],
  [[3, 12, 10, 'g'], [5, 8, 6, 'r'], [6, 4, 4, 'b']],
  [[2, 12, 6, 'y'], [9, 12, 6, 'r']],
];
const TOY_COLORS = {
  r: ['#e0403a', '#ff8a7a', '#8a1a1a'], b: ['#3a7ae0', '#8ac0ff', '#1a3a8a'],
  y: ['#f5c629', '#fff2a0', '#8a6a10'], g: ['#3fbf5a', '#a0f0b0', '#1a6a2a'],
};

export const TOY = Object.fromEntries(Object.entries(TOY_COLORS).map(([k, [c]]) => [k, c]));

// A toy brick: w wide, 4 tall, with studs on top.
export function toyBrick(ctx, rect, x, y, w, [c, hi, dark]) {
  rect(ctx, dark, x, y, w, 4);
  rect(ctx, c, x, y, w, 3);
  rect(ctx, hi, x, y, w, 1);
  for (let k = 1; k + 1 < w; k += 3) {
    rect(ctx, dark, x + k, y - 2, 2, 2);
    rect(ctx, c, x + k, y - 2, 2, 1);
  }
}

// Dinosaur skeletons on the back wall, 48x32: a T-rex and a long-neck.
function drawSkeleton(ctx, rect, ox, kind) {
  const dot = (x, y, s = 2, c = BONE) => rect(ctx, c, ox + Math.round(x), Math.round(y), s, s);
  const line = (pts, s = 2) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) dot(x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, s);
    }
  };
  if (kind === 0) {
    // T-rex: tail down to the left, big head up on the right
    line([[1, 24], [8, 20], [16, 16], [24, 14], [30, 12], [34, 9]]);
    for (let x = 18; x <= 28; x += 3) line([[x, 15], [x - 1, 21]], 1); // ribs
    // skull with teeth
    rect(ctx, BONE, ox + 33, 3, 12, 7);
    rect(ctx, BONE, ox + 44, 5, 3, 4);
    rect(ctx, '#3a2a20', ox + 36, 5, 2, 2); // eye
    rect(ctx, BONE_D, ox + 35, 9, 12, 1);
    for (let x = 36; x < 46; x += 2) rect(ctx, '#ffffff', ox + x, 10, 1, 1);
    rect(ctx, BONE, ox + 36, 11, 10, 2); // jaw
    // tiny arms
    line([[29, 14], [31, 18], [33, 18]], 1);
    // big legs
    line([[22, 16], [20, 23], [23, 29], [20, 31]]);
    line([[26, 15], [28, 22], [26, 29], [29, 31]]);
  } else {
    // long-neck: long tail, round back, neck up high
    line([[0, 26], [6, 22], [12, 17], [18, 14], [24, 13], [30, 14], [35, 11], [38, 6], [40, 3]]);
    rect(ctx, BONE, ox + 39, 1, 7, 4);
    rect(ctx, '#3a2a20', ox + 42, 2, 1, 1);
    for (let x = 15; x <= 30; x += 3) line([[x, 15], [x, 22]], 1); // ribs
    line([[16, 17], [15, 24], [16, 31]]);
    line([[20, 16], [21, 24], [20, 31]]);
    line([[27, 16], [26, 24], [27, 31]]);
    line([[31, 15], [32, 24], [31, 31]]);
  }
}

const HEART_ROWS = [
  '..oooo....oooo..',
  '.ohhhho..ohhhho.',
  'ohwwhhhooohhhhho',
  'ohwhhhhhhhhhhHho',
  'ohhhhhhhhhhhhHho',
  'ohhhhhhhhhhhHHho',
  '.ohhhhhhhhhHHHo.',
  '..ohhhhhhhHHHo..',
  '...ohhhhhHHHo...',
  '....ohhhHHHo....',
  '.....ohHHHo.....',
  '......oHHo......',
  '.......oo.......',
];

export function drawDeep(scene, canvasTexture, rect) {
  sheet(scene, canvasTexture, 'ptero', PTERO.map((rows) => (ctx, ox) => drawMap(ctx, ox, 0, rows, PTERO_PAL)));
  sheet(scene, canvasTexture, 'toyrobot', ROBOT.map((rows) => (ctx, ox) => drawMap(ctx, ox, 0, rows, ROBOT_PAL)));
  sheet(scene, canvasTexture, 'alien', ALIEN.map((rows) => (ctx, ox) => drawMap(ctx, ox, 0, rows, ALIEN_PAL)));
  sheet(scene, canvasTexture, 'wisp', WISP.map((rows) => (ctx, ox) => drawMap(ctx, ox, 0, rows, WISP_PAL)));

  const decor = (kind, draw) => {
    const { tex, ctx } = canvasTexture(scene, `decor-${kind}`, 48, 16);
    for (let i = 0; i < 3; i++) {
      draw(ctx, i * 16, i);
      tex.add(i, 0, i * 16, 0, 16, 16);
    }
    tex.refresh();
  };
  decor('fern', (ctx, ox, i) => drawMap(ctx, ox, 0, FERN[i], FERN_PAL));
  decor('bones', (ctx, ox, i) => drawMap(ctx, ox, 0, BONES[i], BONES_PAL));
  decor('toyblocks', (ctx, ox, i) => {
    for (const [x, y, w, c] of TOYBLOCKS[i]) toyBrick(ctx, rect, ox + x, y, w, TOY_COLORS[c]);
  });

  // big skeletons (two kinds, 48x32 each)
  {
    const { tex, ctx } = canvasTexture(scene, 'decor-skeleton', 96, 32);
    for (let v = 0; v < 2; v++) {
      drawSkeleton(ctx, rect, v * 48, v);
      tex.add(v, 0, v * 48, 0, 48, 32);
    }
    tex.refresh();
  }
  // the sticker: a dino skull
  {
    const { tex, ctx } = canvasTexture(scene, 'skeleton-icon', 16, 16);
    rect(ctx, BONE_D, 1, 4, 13, 8);
    rect(ctx, BONE, 1, 3, 12, 7);
    rect(ctx, BONE, 12, 5, 3, 4);
    rect(ctx, '#3a2a20', 4, 5, 3, 2);
    for (let x = 4; x < 14; x += 2) rect(ctx, '#ffffff', x, 10, 1, 2);
    rect(ctx, BONE, 3, 12, 11, 3);
    rect(ctx, BONE_D, 3, 14, 11, 1);
    tex.refresh();
  }

  // the Heart of the World: a small icon and a big one over its 3x3 cells
  {
    const pal = { o: '#6a1030', h: '#ff5a8a', H: '#c8205a', w: '#ffe0ea' };
    const { tex, ctx } = canvasTexture(scene, 'heart-gem', 16, 16);
    drawMap(ctx, 0, 2, HEART_ROWS, pal);
    tex.refresh();
    const big = canvasTexture(scene, 'heart-big', 48, 48);
    big.ctx.imageSmoothingEnabled = false;
    big.ctx.drawImage(tex.getSourceImage(), 0, 0, 16, 16, 0, 0, 48, 48);
    big.tex.refresh();
  }

  // meteorite (the sticker): dark space rock with glowing star bits
  {
    const { tex, ctx } = canvasTexture(scene, 'find-meteorite', 16, 16);
    ctx.fillStyle = '#1a1830';
    ctx.beginPath(); ctx.arc(8, 9, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3660';
    ctx.beginPath(); ctx.arc(8, 9, 6, 0, Math.PI * 2); ctx.fill();
    rect(ctx, '#5a5690', 4, 5, 3, 2);
    for (const [x, y] of [[9, 7], [5, 11], [11, 12]]) {
      rect(ctx, '#ffe066', x, y, 2, 2);
      rect(ctx, '#fffbe0', x, y, 1, 1);
    }
    rect(ctx, '#ff8a3a', 11, 1, 2, 2);
    rect(ctx, '#ffd23f', 13, 0, 2, 1);
    tex.refresh();
  }

  // layer badges: dino, brick, meteor, core
  {
    const { tex, ctx } = canvasTexture(scene, 'badge', 480, 16);
    const ring = (ox, c, dark) => {
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath(); ctx.arc(ox + 8, 8, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(ox + 8, 8, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(ox + 8, 8, 5.5, 0, Math.PI * 2); ctx.fill();
    };
    ring(0, '#7ac05a', '#3f7a3a');
    drawMap(ctx, 2, 3, ['..oooo....', '.owwwwo...', '.owkwwwo..', '.owwwwwwo.', '..owwwwo..', '..ow.wwo..', '...o..o...'],
      { o: '#2a4a1a', w: '#efe4c8', k: '#2a1d2e' });
    ring(16, '#e0403a', '#8a1a1a');
    toyBrick(ctx, rect, 16 + 3, 8, 10, TOY_COLORS.y);
    ring(32, '#2a2860', '#12102e');
    drawMap(ctx, 32 + 3, 3, ['....y.....', '....y.....', 'yyyyyyyyy.', '..yyyyy...', '..yy.yy...', '.yy...yy..'], { y: '#ffe066' });
    rect(ctx, '#ffffff', 32 + 11, 4, 1, 1);
    ring(48, '#ff8a3a', '#a83a1a');
    drawMap(ctx, 48 + 3, 2, ['....y.....', '...yy.....', '...yoy....', '..yooy....', '..yoooy...', '.yoorooy..', '.yoooooy..', '..yoooy...', '...yyy....'],
      { y: '#fff2a0', o: '#ffc040', r: '#ffffff' });
    drawMoonBadges(ctx, rect, ring);
    drawMarsBadges(ctx, rect, ring);
    drawSaturnBadges(ctx, rect, ring);
    drawDinoBadges(ctx, rect, ring);
    drawSunBadges(ctx, rect, ring);
    for (let i = 0; i < 30; i++) tex.add(i, 0, i * 16, 0, 16, 16);
    tex.refresh();
  }
}
