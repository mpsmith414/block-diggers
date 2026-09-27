// Draw a sprite from rows of characters: each character is a palette key,
// '.' (or any key missing from the palette) is transparent.

export function drawMap(ctx, ox, oy, rows, palette, { flip = false } = {}) {
  rows.forEach((row, y) => {
    const w = row.length;
    for (let x = 0; x < w; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(ox + (flip ? w - 1 - x : x), oy + y, 1, 1);
    }
  });
}
