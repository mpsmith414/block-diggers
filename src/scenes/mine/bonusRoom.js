// Bits every bonus room shares (the Moon's skate park, the Mars arcade): the
// room's painted back wall with twinkling stars, its ceiling lamps, and
// treasure that pops up and flies into a player's backpack.

import { addOre, createPickup } from '../../game/loot.js';
import { TILE } from '../../tuning.js';

// The room in px, with a gradient back wall, stars and four ceiling lamps.
export function drawRoom(scene, cells, { top, bottom, stars = 26 }) {
  const room = { x0: cells.x0 * TILE, x1: (cells.x1 + 1) * TILE, y0: cells.top * TILE, y1: cells.floor * TILE };
  const wall = scene.add.graphics().setDepth(0.5);
  wall.fillGradientStyle(top, top, bottom, bottom, 1).fillRect(room.x0, room.y0, room.x1 - room.x0, room.y1 - room.y0);
  for (let i = 0; i < stars; i++) {
    const st = scene.add.image(room.x0 + ((i * 97) % (room.x1 - room.x0)), room.y0 + 8 + ((i * 53) % (room.y1 - room.y0 - 40)), 'pixel')
      .setTint([0xffffff, 0xfff2a0, 0x9ff6ff][i % 3]).setDisplaySize(i % 5 ? 1 : 2, i % 5 ? 1 : 2).setDepth(0.6);
    scene.tweens.add({ targets: st, alpha: 0.2, duration: 700 + (i % 6) * 250, yoyo: true, repeat: -1 });
  }
  const lamps = [0.15, 0.38, 0.62, 0.85].map((f) => ({ x: room.x0 + (room.x1 - room.x0) * f, y: room.y0 + 5 }));
  for (const l of lamps) scene.add.image(l.x, room.y0, 'skate-lamp').setOrigin(0.5, 0).setDepth(2);
  return { room, wall, lamps, inRoom: ({ x, y }) => x >= room.x0 && x <= room.x1 && y >= room.y0 && y <= room.y1 };
}

// The lamps' light (only when the room is near the view).
export function roomLights(room, lamps, view, flicker, extra = []) {
  if (room.x1 < view.x - 64 || room.x0 > view.right + 64 || room.y1 < view.y - 64 || room.y0 > view.bottom + 64) return [];
  return [...lamps.map((l) => ({ x: l.x, y: l.y + 30, r: 5.5 * flicker, glow: 0.12, color: 0xfff6c0 })), ...extra];
}

// Treasure pops up from (x, y) and flies into a's backpack (if it's full, it
// drops on the floor instead).
export function flyOres(scene, a, x, y, ores) {
  ores.forEach((ore, i) => {
    const g = scene.add.image(x, y, `ore-${ore}`).setDepth(45).setScale(1.2);
    scene.tweens.add({
      targets: g, x: x + (i - (ores.length - 1) / 2) * 10, y: y - 24 - (i % 2) * 6, duration: 350, delay: i * 80, ease: 'Quad.easeOut',
      onComplete: () => scene.tweens.add({
        targets: g, x: a.sprite.x, y: a.sprite.y - 8, scale: 0.5, duration: 260, ease: 'Quad.easeIn',
        onComplete: () => {
          g.destroy();
          if (addOre(a.pack, ore)) {
            scene.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xfff2a0, 3);
            scene.events.emit('oreCollected', { slot: a.slot, ore });
          } else {
            scene.pickups.push(createPickup({ x: a.sprite.x, y: a.sprite.y - 8, ore, delay: 0.5 }));
          }
        },
      }),
    });
  });
}
