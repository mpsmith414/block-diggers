// Cave decorations (3 variants each, 16×16), the pickaxe (3 levels) and hint icons.

import { drawMap } from './pixelmap.js';
import { MOON_DECOR, MOON_DECOR_PAL, MOON_GLOWING } from './moonWorld.js';
import { MARS_DECOR, MARS_DECOR_PAL, MARS_GLOWING } from './marsWorld.js';
import { SATURN_DECOR, SATURN_DECOR_PAL } from './saturnWorld.js';

const OUT = '#2a1d2e';

const DECOR = {
  grass: [
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '.......g........', '..g....g...g....',
      '..gg..gG..gg....', '...g.gGg..g..g..', '.g.gGg.gGgg.gG..', 'gGgGgGgGgGgGgGgG'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................', '....g......g....',
      '.g..gg....gg..g.', '.gg..gG..gG..gg.', 'g.gGgGgggGgGg.gG', 'GgGgGgGgGgGgGgGg'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '..........g.....', '.....g....gg....',
      '..g.gg...g.g..g.', '.gG.g.g.gG.gg.gg', 'gGgGgGgGgGgGgGgG', 'gGgGgGgGgGgGgGgG'],
  ],
  flower: [
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '...ppp..........', '...pyp.....bbb..', '...ppp.....byb..',
      '....g......bbb..', '....g..g....g...', '...gg.gg...gg.g.', '..gGgGgGgGgGgGgG'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '.......www......', '.......wyw......',
      '.......www......', '........g.......', '..g....gg...g...', '.gGgGgGgGgGgGgG.'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '..yyy.......ppp.', '..yoy.......pyp.', '..yyy.......ppp.',
      '...g.........g..', '...g....g....g..', '..gg...gg...gg..', 'gGgGgGgGgGgGgGgG'],
  ],
  roots: [
    ['rRrr...rRr....rr', '.rr....rR.....r.', '.r.....r......r.', '.r......r.....R.', '..r.....r......r', '..r.....R.......',
      '..R......r......', '.........r......', '.........r......', '................', '................', '................',
      '................', '................', '................', '................'],
    ['rr....rRrr...Rrr', '.r.....rr....r..', '.R......r....r..', '..r.....R...r...', '..r......r..R...', '...r.....r......',
      '...r......r.....', '..........r.....', '................', '................', '................', '................',
      '................', '................', '................', '................'],
    ['Rrr..rr.....rRrr', '..r...r......rr.', '..r...R.......r.', '...r...r......r.', '...R...r.......r', '.......r........',
      '................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................'],
  ],
  mushroom: [
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '..oooo..........', '.ommmmo.........', 'omMmmMmo...ooo..',
      '.oosso...ommmo..', '...ss....oMmMo..', '...ss.....oso...', '..oSSo....oso...'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '.......oooo.....', '......omMmmo....',
      '......ooosoo....', '........ss......', '........ss......', '.......oSSo.....'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................', '..ooo.....oooo..',
      '.omMmo...ommMmo.', '..oso....oosso..', '..oso......ss...', '..oSo.....oSSo..'],
  ],
  pebbles: [
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................', '................',
      '................', '...kk.......kkk.', '..kKkk..kk.kKkkk', '.kkkkkk.kKkkkkkk'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................', '................',
      '................', '.....kkk........', '.kk.kKkkk....kk.', 'kKkkkkkkkk..kKkk'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................', '................',
      '................', '........kk......', '..kkk..kKkk..kk.', '.kKkkk.kkkkkkKkk'],
  ],
  glowshroom: [
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '.....ooooo......', '....occCcco.....', '...occcccCco....', '...oooossooo....',
      '......ss....ooo.', '......ss...ocCo.', '......ss....so..', '.....oSSo...so..'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '..ooo...ooooo...', '.ocCco.occcCco..',
      '..oso..oooosoo..', '..oso.....ss....', '..oso.....ss....', '..oSo....oSSo...'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '.......oooooo...', '......occCcccO..', '......ooossooo..',
      '.ooo.....ss.....', 'ocCco....ss.....', '.oso.....ss.....', '.oSo....oSSo....'],
  ],
  crystal: [
    ['................', '................', '................', '................', '................', '................',
      '................', '.......o........', '......oxo.......', '......oxxo......', '..o...oxXxo..o..', '.oxo..oxXxo.oxo.',
      '.oxxo.oxxxooxXo.', '.oxXo.oxXxooxxo.', '.oxxooxxxxoxxxo.', 'oooooooooooooooo'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '.........o......', '..o.....oxo.....', '.oxo....oxXo....', '.oxxo..oxxxo..o.',
      '.oxXo..oxXxo.oxo', '.oxxo..oxxxxooxo', 'ooxxooooxxxxoxxo', 'oooooooooooooooo'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '....o......o....', '...oxo....oxo...', '...oxxo..oxXo...',
      '..oxXxo.oxxxo.o.', '..oxxxooxxXxooxo', '.ooxxxxoxxxxoxxo', 'oooooooooooooooo'],
  ],
  stalactite: [
    ['kkkkkkkkkkkkkkkk', '.kKkk.kkKk..kkk.', '.kkk..kkk...kKk.', '..kk...kk....k..', '..k....kk....k..', '..k.....k.......',
      '........k.......', '................', '................', '................', '................', '................',
      '................', '................', '................', '................'],
    ['kkkkkkkkkkkkkkkk', '.kkKk....kKkkk..', '..kkk....kkkk...', '..kk......kk....', '...k......kk....', '...k.......k....',
      '...........k....', '................', '................', '................', '................', '................',
      '................', '................', '................', '................'],
    ['kkkkkkkkkkkkkkkk', 'kKkk...kkKk..kKk', '.kk....kkk...kk.', '.kk.....kk...k..', '..k.....k....k..', '........k.......',
      '................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................'],
  ],
  giantshroom: [
    ['................', '................', '.....oooooo.....', '...ooccCccCoo...', '..occcccccccCo..', '.occCccccccccco.', '.oooooossoooooo.', '.......ss.......',
      '.......ss.......', '......oSSo......', '.......ss.......', '.......ss.......', '.......ss.......', '......oSSo......', '.....ossss o....', '....oSSSSSSo....'],
    ['................', '................', '................', '......ooooo.....', '....ooccCcco....', '...occcccccCo...', '...ooooossooo...', '........ss......',
      '........ss......', '.ooo....ss......', 'occCo...ss......', '.oso....ss......', '.oso...oSSo.....', '.oso....ss......', '.oSo...ossso....', '.oSo..oSSSSSo...'],
    ['................', '..ooooo.........', '.occCcco........', 'occccccCo.......', 'ooooosooo.......', '....ss....ooooo.', '....ss...ocCccCo', '....ss...oooosoo',
      '....ss......ss..', '...oSSo.....ss..', '....ss......ss..', '....ss.....oSSo.', '....ss......ss..', '...ossso....ss..', '..oSSSSo...osso.', '..oSSSSo..oSSSSo'],
  ],
  moss: [
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................', '..m.......m.....',
      '.mMm..m..mMm..m.', 'mmMmmmMmmmMmmmMm', 'mMmmMmmMmmmMmmMm', 'MmmMmmMmMmmMmmMm'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................', '......m.........',
      '.m...mMm....m...', 'mMmmmmMmmm.mMmm.', 'mmMmmMmmMmmmmMmm', 'MmmMmmmMmmMmmmMm'],
    ['................', '................', '................', '................', '................', '................',
      '................', '................', '................', '................', '................', '...........m....',
      '..m..m....mMm...', '.mMmmMm..mmmmm.m', 'mmmMmmmmMmmMmmMm', 'mMmmMmMmmMmmmMmm'],
  ],
  amethyst: [
    ['................', '................', '................', '................', '......o.........', '.....oxo........',
      '.....oxXo.......', '....oxxXo..o....', '....oxXxo.oxo...', '.o..oxxxooxXo...', 'oxo.oxXxooxxo...', 'oxXooxxxoxxxo.o.',
      'oxxooxXxoxXxooxo', 'oxXooxxxoxxxooXo', 'ooxxoxxxxoxxoxxo', 'oooooooooooooooo'],
    ['................', '................', '................', '................', '................', '........o.......',
      '.......oxo......', '..o....oxXo.....', '.oxo..oxxXo.....', '.oxXo.oxxxo..o..', '.oxxo.oxXxo.oxo.', '.oxxooxxxxo.oXo.',
      'ooxXooxXxxooxxo.', 'oxxxooxxxxooxxo.', 'ooxxoxxxxxoxxxo.', 'oooooooooooooooo'],
    ['oooooooooooooooo', 'ooxxoxxxxooxxxoo', '.oxXooxXxo.oxXo.', '.oxxo.oxxo..oxo.', '..oxo.oxXo...o..', '..oo..oxxo......',
      '.......oxo......', '.......oo.......', '................', '................', '................', '................',
      '................', '................', '................', '................'],
  ],
};

const PAL = {
  grass: { g: '#5cae4a', G: '#3f8a38' },
  flower: { g: '#4f9a40', G: '#3f8a38', p: '#ff8ec0', b: '#8ec5ff', w: '#ffffff', y: '#ffe066', o: '#ff9a3a' },
  roots: { r: '#7a5230', R: '#5a3a20' },
  mushroom: { o: OUT, m: '#e8743a', M: '#ffd0a0', s: '#f4e4c1', S: '#c8b890' },
  pebbles: { k: '#6d6d78', K: '#9a9aa6' },
  glowshroom: { o: '#1b2a4a', c: '#5ad8ff', C: '#d4fbff', s: '#bfe8f0', S: '#8ab8c8', O: '#1b2a4a' },
  crystal: { o: '#2a1d4a', x: '#b98cff', X: '#f0e0ff' },
  stalactite: { k: '#4a4860', K: '#6a6880' },
  giantshroom: { o: '#1b2a4a', c: '#6ff0ff', C: '#e8ffff', s: '#c8f0f8', S: '#8ab8c8' },
  moss: { m: '#3fd07a', M: '#aaffc8' },
  amethyst: { o: '#3a1f5a', x: '#d08cff', X: '#ffe8ff' },
};

// deeper layers: the same shapes in new colours
DECOR.spacecrystal = DECOR.crystal;
PAL.spacecrystal = { o: '#0f1a3a', x: '#6ff0ff', X: '#ffffff' };
DECOR.emberflower = DECOR.flower;
PAL.emberflower = { g: '#8a3a2a', G: '#5a2a1a', p: '#ff6a2a', b: '#ffb34a', w: '#ffe066', y: '#fff2a0', o: '#ff4a1a' };

// the Moon's decorations
Object.assign(DECOR, MOON_DECOR);
Object.assign(PAL, MOON_DECOR_PAL);

// Mars's decorations (and fire crystals: the crystal shape in red and gold)
Object.assign(DECOR, MARS_DECOR);
Object.assign(PAL, MARS_DECOR_PAL);
DECOR.firecrystal = DECOR.crystal;
PAL.firecrystal = { o: '#4a0a0a', x: '#ff5a2a', X: '#ffe066' };

// Saturn's decorations (and ice and aurora crystals; drips of strawberry ice cream)
Object.assign(DECOR, SATURN_DECOR);
Object.assign(PAL, SATURN_DECOR_PAL);
DECOR.icecrystal = DECOR.crystal;
PAL.icecrystal = { o: '#2a6a98', x: '#9fe8ff', X: '#ffffff' };
DECOR.auroracrystal = DECOR.crystal;
PAL.auroracrystal = { o: '#1a2a5a', x: '#3ae0a0', X: '#d0a0ff' };
DECOR.icedrip = DECOR.cheesedrip;
PAL.icedrip = { c: '#ff8ab8', C: '#ffd0e4' };

export const GLOWING = {
  mushroom: 0xffa050, glowshroom: 0x5ad8ff, crystal: 0xb98cff, giantshroom: 0x6ff0ff, moss: 0x7aff9a, amethyst: 0xd08cff,
  spacecrystal: 0x6ff0ff, emberflower: 0xff8a3a, firecrystal: 0xff6a2a, ...MARS_GLOWING, icecrystal: 0x9fe8ff, auroracrystal: 0x3ae0a0,
  ...Object.fromEntries(Object.entries(MOON_GLOWING).filter(([, c]) => c)),
};

// wood, iron, diamond, amber picks; then the brick, star, moon, crystal and laser drills;
// then the ruby, opal and mega drills
const PICK_HEADS = ['#b07a44', '#d4dce6', '#6ff0ff', '#f0a030', '#e0403a', '#ffe066', '#9ad8ff', '#b070ff', '#ff4a8a', '#ff2a4a', '#ff8a2a', '#3affe0', '#c8f8ff', '#ffc8e8', '#4a6aff'];

export function drawDecor(scene, canvasTexture, rect) {
  for (const [kind, variants] of Object.entries(DECOR)) {
    const { tex, ctx } = canvasTexture(scene, `decor-${kind}`, 48, 16);
    variants.forEach((rows, i) => {
      drawMap(ctx, i * 16, 0, rows, PAL[kind]);
      tex.add(i, 0, i * 16, 0, 16, 16);
    });
    tex.refresh();
  }

  // pickaxe: handle from bottom-left to top-right, head across the top;
  // the last two are drills, a cone pointing up-right
  {
    const { tex, ctx } = canvasTexture(scene, 'pick', 14 * PICK_HEADS.length, 14);
    PICK_HEADS.forEach((head, i) => {
      const ox = i * 14;
      const drill = i >= 4;
      const len = drill ? 6 : 9;
      for (let k = 0; k < len; k++) rect(ctx, OUT, ox + 1 + k, 12 - k, 3, 2);
      for (let k = 0; k < len; k++) rect(ctx, drill ? '#8a94a8' : '#8a5a34', ox + 2 + k, 12 - k, 1, 1);
      if (drill) {
        // a stepped cone from the grip out to the tip, with a spiral stripe
        for (let k = 0; k < 6; k++) {
          const w = 6 - k;
          rect(ctx, OUT, ox + 6 + k, 7 - k - w / 2, w + 1, w + 1);
        }
        for (let k = 0; k < 6; k++) {
          const w = 5 - k;
          if (w > 0) rect(ctx, head, ox + 7 + k, 7 - k - w / 2 + 0.5, w, w);
        }
        rect(ctx, '#ffffff', ox + 8, 5, 1, 1);
        rect(ctx, '#ffffff', ox + 11, 3, 1, 1);
      } else {
        rect(ctx, OUT, ox + 5, 0, 9, 4);
        rect(ctx, OUT, ox + 11, 2, 3, 8);
        rect(ctx, head, ox + 6, 1, 7, 2);
        rect(ctx, head, ox + 12, 3, 1, 6);
        rect(ctx, '#ffffff', ox + 7, 1, 2, 1);
      }
      tex.add(i, 0, ox, 0, 14, 14);
    });
    tex.refresh();
  }

  // "push the stick down" hint: a thumbstick seen from above, and a big arrow
  {
    const { tex, ctx } = canvasTexture(scene, 'icon-stick-down', 14, 21);
    drawMap(ctx, 0, 0, [
      '....oooooo....',
      '..oowwwwwwoo..',
      '.owwwwwwwwwwo.',
      '.owwwkkkkwwwo.',
      'owwwkKKKKkwwwo',
      'owwwkKKKKkwwwo',
      'owwwkKKKKkwwwo',
      '.owwwkkkkwwwo.',
      '.owwwwwwwwwwo.',
      '..oowwwwwwoo..',
      '....oooooo....',
      '..............',
      '.....oooo.....',
      '.....oyyo.....',
      '..ooooyyoooo..',
      '..oyyyyyyyyo..',
      '...oyyyyyyo...',
      '....oyyyyo....',
      '.....oyyo.....',
      '......oo......',
      '..............',
    ], { o: OUT, w: '#e8e4f0', k: '#2a1d2e', K: '#55505e', y: '#ffe066' });
    tex.refresh();
  }
}
