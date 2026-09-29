// Art for the things you find: golden slime, eggs, geode and fossil stickers,
// the big chest icon, and the "together!" icon for team-up things.

import { drawMap } from './pixelmap.js';

const OUT = '#2a1d2e';

const SLIME_ROWS = (squish) => {
  const top = squish ? 5 : 2;
  const rows = Array.from({ length: 12 }, () => '................'.split(''));
  const put = (x, y, ch) => { if (rows[y] && x >= 0 && x < 16) rows[y][x] = ch; };
  for (let y = top - 1; y < 12; y++) for (let x = 2; x < 14; x++) put(x, y, 'o');
  for (let y = top + 1; y < 11; y++) { put(1, y, 'o'); put(14, y, 'o'); }
  for (let y = top; y < 11; y++) for (let x = 2; x < 14; x++) put(x, y, 'b');
  for (let y = top + 2; y < 10; y++) { put(1, y, 'b'); put(14, y, 'b'); }
  for (let x = 2; x < 14; x++) put(x, 10, 'd');
  put(4, top + 1, 'h'); put(5, top + 1, 'h'); put(6, top + 1, 'h'); put(4, top + 2, 'h');
  for (const ex of [5, 9]) { put(ex, top + 4, 'k'); put(ex + 1, top + 4, 'k'); put(ex, top + 5, 'k'); put(ex + 1, top + 5, 'k'); put(ex, top + 4, 'w'); }
  put(3, top + 6, 'p'); put(12, top + 6, 'p');
  return rows.map((r) => r.join(''));
};

const EGG = [
  '....oooo....',
  '...oeeeeo...',
  '..oeeeeeeo..',
  '..oesseeeo..',
  '.oeeeeeseeo.',
  '.oeeeeeeeeo.',
  '.oeseeeeeeo.',
  '.oeeeeesseo.',
  '.oeeeeeeeeo.',
  '..oeeseeeo..',
  '..oEeeeeEo..',
  '...oEEEEo...',
  '....oooo....',
];
export const EGG_KINDS = ['mole', 'glowbug', 'batbuddy', 'golden', 'rex', 'trike', 'moonpup', 'rover', 'yeti', 'longneck', 'sundragon'];
const EGG_COLORS = {
  mole: { e: '#e8d0b0', s: '#8a5a34', E: '#c8a888' },
  glowbug: { e: '#fff6b0', s: '#ffd84a', E: '#e0c860' },
  batbuddy: { e: '#b8f0f0', s: '#3aa0a8', E: '#88c8cc' },
  golden: { e: '#ffd84a', s: '#fff6c0', E: '#c89a20' },
  // big speckled dinosaur eggs
  rex: { e: '#b8e0a0', s: '#3a7a2a', E: '#88b870' },
  trike: { e: '#f0d0a0', s: '#c86a3a', E: '#c8a070' },
  // the Moon Pup's egg: silver with blue spots
  moonpup: { e: '#e0e4f0', s: '#5ab0f0', E: '#a8b0c8' },
  // the Rover Bot's egg: shiny silver with red bolts
  rover: { e: '#d0d8e4', s: '#e0304a', E: '#8a94a8' },
  // the Yeti Cub's egg: fluffy white with blue spots
  yeti: { e: '#ffffff', s: '#8ad0ff', E: '#c8e0f0' },
  // the Longneck's egg: green with yellow spots
  longneck: { e: '#a8e080', s: '#ffe066', E: '#7ab05a' },
  // the Sun Dragon's egg: gold with orange flame spots
  sundragon: { e: '#ffe066', s: '#ff6a1a', E: '#e0a020' },
};

const FOSSILS = [
  // shell
  ['................', '.....oooooo.....', '....ossssssoo...', '...ossooooosso..', '..osso.oooo.sso.', '..oso.osssso.so.', '..oso.oso.oso.so',
    '..oso.oso.oso.so', '..oso..oosso.so.', '..osso....o.sso.', '...osso....sso..', '....ossssssoo...', '.....oooooo.....', '................', '................', '................'],
  // bone
  ['................', '................', '................', '..oo........oo..', '.osso......osso.', '.osssoooooosssso', '..osssssssssso..', '.osssoooooosssso',
    '.osso......osso.', '..oo........oo..', '................', '................', '................', '................', '................', '................'],
  // dino skull
  ['................', '................', '....oooooo......', '..oossssssoo....', '.ossooosssssoo..', '.osoOOosssssssoo', '.ossooossssssssso', '.ossssssssssoooo',
    '..osssssssssso..', '..osososososo...', '...o.o.o.o.o....', '..osososo.......', '...ooooo........', '................', '................', '................'],
];

export function drawFindsArt(scene, canvasTexture, rect) {
  {
    const { tex, ctx } = canvasTexture(scene, 'slime-gold', 32, 12);
    const pal = { o: '#6a4a10', b: '#ffd84a', d: '#d8a820', h: '#fff6c0', k: OUT, w: '#ffffff', p: '#ff8fa3' };
    drawMap(ctx, 0, 0, SLIME_ROWS(false), pal);
    drawMap(ctx, 16, 0, SLIME_ROWS(true), pal);
    tex.add(0, 0, 0, 0, 16, 12);
    tex.add(1, 0, 16, 0, 16, 12);
    tex.refresh();
  }
  {
    const { tex, ctx } = canvasTexture(scene, 'egg', 12 * EGG_KINDS.length, 13);
    EGG_KINDS.forEach((k, i) => {
      drawMap(ctx, i * 12, 0, EGG, { o: OUT, ...EGG_COLORS[k] });
      tex.add(i, 0, i * 12, 0, 12, 13);
    });
    tex.refresh();
    const dino = canvasTexture(scene, 'egg-dino', 12, 13);
    drawMap(dino.ctx, 0, 0, EGG, { o: OUT, ...EGG_COLORS.rex });
    dino.tex.refresh();
  }
  {
    const { tex, ctx } = canvasTexture(scene, 'find-geode', 16, 16);
    // two halves of a cracked geode, crystals inside
    for (const ox of [0, 9]) {
      rect(ctx, OUT, ox, 3, 7, 11);
      rect(ctx, '#8e8e98', ox + 1, 4, 5, 9);
      rect(ctx, '#3a3548', ox + (ox ? 1 : 3), 5, 3, 7);
      rect(ctx, '#b98cff', ox + (ox ? 1 : 3), 6, 2, 5);
      rect(ctx, '#f0e0ff', ox + (ox ? 1 : 3), 7, 1, 2);
    }
    tex.refresh();
  }
  {
    const { tex, ctx } = canvasTexture(scene, 'find-fossil', 48, 16);
    FOSSILS.forEach((rows, i) => {
      drawMap(ctx, i * 16, 0, rows, { o: '#7a6a50', s: '#f4ead4', O: OUT });
      tex.add(i, 0, i * 16, 0, 16, 16);
    });
    tex.refresh();
  }
  {
    const { tex, ctx } = canvasTexture(scene, 'find-bigchest', 32, 16);
    rect(ctx, '#3a1f4a', 0, 3, 32, 13);
    rect(ctx, '#7a4ab0', 1, 4, 30, 5);
    rect(ctx, '#7a4ab0', 1, 10, 30, 5);
    rect(ctx, '#ffd84a', 0, 9, 32, 1);
    rect(ctx, '#ffd84a', 1, 4, 1, 11);
    rect(ctx, '#ffd84a', 30, 4, 1, 11);
    rect(ctx, '#ffd84a', 14, 7, 4, 5);
    rect(ctx, '#fff2a0', 15, 8, 1, 1);
    tex.refresh();
  }
  {
    // two little hands high-fiving, with a heart
    const { tex, ctx } = canvasTexture(scene, 'icon-together', 16, 12);
    drawMap(ctx, 0, 0, [
      '.....rr.rr......',
      '....rrrrrrr.....',
      '.....rrrrr......',
      '......rrr.......',
      '.oo....r....oo..',
      'osso.......osso.',
      'ossso.....ossso.',
      '.osss o.o sssso.',
      '..osssoooosssso.',
      '...osso..ossso..',
      '....oo....oo....',
      '................',
    ], { o: OUT, s: '#f2c29b', r: '#ff6b8a' });
    tex.refresh();
  }
}
