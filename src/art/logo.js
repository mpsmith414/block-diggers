// The "BLOCK DIGGERS" logo, built from little grass-topped dirt blocks.

const GLYPHS = {
  B: ['11110', '10001', '11110', '10001', '11110'],
  L: ['10000', '10000', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '01110'],
  C: ['01111', '10000', '10000', '10000', '01111'],
  K: ['10001', '10010', '11100', '10010', '10001'],
  D: ['11110', '10001', '10001', '10001', '11110'],
  I: ['11111', '00100', '00100', '00100', '11111'],
  G: ['01111', '10000', '10011', '10001', '01111'],
  E: ['11111', '10000', '11110', '10000', '11111'],
  R: ['11110', '10001', '11110', '10010', '10001'],
  S: ['01111', '10000', '01110', '00001', '11110'],
};

const PX = 6; // one glyph pixel = one 6×6 block

function wordBits(word) {
  const cols = [];
  [...word].forEach((ch, i) => {
    const g = GLYPHS[ch];
    for (let x = 0; x < 5; x++) cols.push(g.map((row) => row[x] === '1'));
    if (i < word.length - 1) cols.push([false, false, false, false, false]);
  });
  return cols; // cols[x][y]
}

function drawWord(ctx, word, ox, oy, rect, palette) {
  const cols = wordBits(word);
  cols.forEach((col, x) => col.forEach((on, y) => {
    if (!on) return;
    const px = ox + x * PX;
    const py = oy + y * PX;
    const top = y === 0 || !col[y - 1];
    rect(ctx, '#2a1d2e', px - 1, py - 1, PX + 2, PX + 2);
    rect(ctx, palette.body, px, py, PX, PX);
    rect(ctx, palette.dark, px, py + PX - 1, PX, 1);
    rect(ctx, palette.speck, px + 1 + ((x + y) % 3), py + 2, 1, 1);
    if (top) {
      rect(ctx, palette.top, px, py, PX, 2);
      rect(ctx, palette.topLight, px, py, PX, 1);
    }
  }));
  return cols.length * PX;
}

export function drawLogo(scene, canvasTexture, rect) {
  const w1 = wordBits('BLOCK').length * PX;
  const w2 = wordBits('DIGGERS').length * PX;
  const W = Math.max(w1, w2) + 8;
  const H = PX * 5 * 2 + 18;
  const { tex, ctx } = canvasTexture(scene, 'logo', W, H);
  const dirt = { body: '#9a6a3c', dark: '#6b4424', speck: '#b8864e', top: '#5aa63c', topLight: '#8ad65a' };
  const stone = { body: '#8e8e98', dark: '#5f5f68', speck: '#b0b0ba', top: '#f5c629', topLight: '#fff2a0' };
  drawWord(ctx, 'BLOCK', Math.round((W - w1) / 2), 4, rect, dirt);
  drawWord(ctx, 'DIGGERS', Math.round((W - w2) / 2), 4 + PX * 5 + 8, rect, stone);
  tex.refresh();

  // a check mark for "ready"
  const c = canvasTexture(scene, 'check', 12, 10);
  const pts = [[1, 5], [2, 6], [3, 7], [4, 8], [5, 7], [6, 6], [7, 5], [8, 4], [9, 3], [10, 2]];
  for (const [x, y] of pts) {
    rect(c.ctx, '#1f4a1f', x - 1, y - 1, 3, 3);
  }
  for (const [x, y] of pts) rect(c.ctx, '#6be26a', x, y, 1, 2);
  c.tex.refresh();
}
