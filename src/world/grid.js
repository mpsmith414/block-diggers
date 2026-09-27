// The mine grid: block get/set, mining times, and what mining a cell leaves behind.

import { B, hardnessOf, dropOf } from './blocks.js';
import { MINE_TIME, SKY_ROWS } from '../tuning.js';

export function createGrid(w, h, cells = new Uint8Array(w * h)) {
  const inside = (x, y) => x >= 0 && x < w && y >= 0 && y < h;
  return {
    w,
    h,
    cells,
    inside,
    get(x, y) {
      if (x < 0 || x >= w || y >= h) return B.BEDROCK;
      if (y < 0) return y >= -SKY_ROWS ? B.AIR : B.BEDROCK;
      return cells[y * w + x];
    },
    set(x, y, id) {
      if (inside(x, y)) cells[y * w + x] = id;
    },
  };
}

export function mineTime(id, pickLevel) {
  const hardness = hardnessOf(id);
  if (!hardness) return Infinity;
  return MINE_TIME[hardness][pickLevel];
}

// Mining up or down leaves a ladder, so you can always climb back. If a ladder
// opens into air below (a cave), it continues down to the floor.
export function mineCell(grid, x, y, { ladder }) {
  const id = grid.get(x, y);
  grid.set(x, y, ladder ? B.LADDER : B.AIR);
  if (ladder) {
    for (let yy = y + 1; grid.inside(x, yy) && grid.get(x, yy) === B.AIR; yy++) grid.set(x, yy, B.LADDER);
  }
  return { id, drop: dropOf(id) };
}
