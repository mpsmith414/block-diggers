// Draws the mine grid with a Phaser tilemap: a static back-wall layer and a
// front layer of blocks that is kept in sync as cells are mined.

import { B } from '../../world/blocks.js';
import { BACK, TILE_MARGIN, TILE_SPACING } from '../../art/textures.js';
import { layerAt } from '../../world/worldgen.js';
import { TILE } from '../../tuning.js';

export function createMapView(scene, grid, { layerAt: layerOf = layerAt, top = 'dirt' } = {}) {
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
      b.push(y === 0 ? BACK[top] : BACK[layerOf(y)]);
      const id = grid.get(x, y);
      f.push(id === B.AIR || id === B.EGG || id === B.UFO ? -1 : id);
    }
    backRows.push(b);
    frontRows.push(f);
  }
  back.putTilesAt(backRows, 0, 0);
  front.putTilesAt(frontRows, 0, 0);

  const sync = (x, y) => {
    const id = grid.get(x, y);
    if (id === B.AIR || id === B.EGG || id === B.UFO) front.removeTileAt(x, y);
    else front.putTileAt(id, x, y);
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
