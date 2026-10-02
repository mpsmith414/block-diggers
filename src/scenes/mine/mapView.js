// Draws the mine grid with a Phaser tilemap: a static back-wall layer and a
// front layer of blocks that is kept in sync as cells are mined. `paint`
// (Rainbow Planet) picks a cell's tile frame and tint: { front(x, y, id), back(x, y) }
// return { index, tint } (front returns null for blocks drawn as usual).

import { B } from '../../world/blocks.js';
import { BACK, TILE_MARGIN, TILE_SPACING } from '../../art/textures.js';
import { layerAt } from '../../world/worldgen.js';
import { varyTile } from '../../art/tileVariety.js';
import { TILE } from '../../tuning.js';

export function createMapView(scene, grid, { layerAt: layerOf = layerAt, top = 'dirt', paint = null } = {}) {
  const map = scene.make.tilemap({ width: grid.w, height: grid.h, tileWidth: TILE, tileHeight: TILE });
  const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, TILE_MARGIN, TILE_SPACING);
  const back = map.createBlankLayer('back', tileset).setDepth(0);
  const front = map.createBlankLayer('front', tileset).setDepth(10);

  const backRows = [];
  const frontRows = [];
  for (let y = 0; y < grid.h; y++) {
    const b = [];
    const f = [];
    for (let x = 0; x < grid.w; x++) {
      b.push(paint ? paint.back(x, y).index : y === 0 ? BACK[top] : BACK[layerOf(y)]);
      const id = grid.get(x, y);
      f.push(id === B.AIR || id === B.EGG || id === B.UFO ? -1 : paint?.front(x, y, id)?.index ?? id);
    }
    backRows.push(b);
    frontRows.push(f);
  }
  back.putTilesAt(backRows, 0, 0);
  front.putTilesAt(frontRows, 0, 0);
  // rock drawn mirrored different ways, so walls don't look like wallpaper
  back.forEachTile((t) => varyTile(t, t.x, t.y, true));
  front.forEachTile((t) => varyTile(t, t.x, t.y), undefined, 0, 0, grid.w, grid.h, { isNotEmpty: true });
  if (paint) {
    back.forEachTile((t) => { t.tint = paint.back(t.x, t.y).tint; });
    front.forEachTile((t) => {
      const p = paint.front(t.x, t.y, grid.get(t.x, t.y));
      if (p) t.tint = p.tint;
    }, undefined, 0, 0, grid.w, grid.h, { isNotEmpty: true });
  }

  const sync = (x, y) => {
    const id = grid.get(x, y);
    if (id === B.AIR || id === B.EGG || id === B.UFO) {
      front.removeTileAt(x, y);
      return;
    }
    const p = paint?.front(x, y, id);
    const t = front.putTileAt(p ? p.index : id, x, y);
    varyTile(t, x, y);
    if (p) t.tint = p.tint;
  };

  return {
    map,
    front,
    sync,
    // After mining (x, y): the cell, plus any ladder that was extended below it.
    syncMined(x, y) {
      sync(x, y);
      for (let yy = y + 1; yy < grid.h; yy++) {
        const tile = front.getTileAt(x, yy);
        if (grid.get(x, yy) !== B.LADDER || (tile && tile.index === B.LADDER)) break;
        sync(x, yy);
      }
    },
  };
}
