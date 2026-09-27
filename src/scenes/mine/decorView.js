// Draws cave decorations and removes them when what they grow on is dug away.

import { GLOWING } from '../../art/decor.js';
import { TILE } from '../../tuning.js';

export function createDecorView(scene, decor) {
  const byCell = new Map();
  const key = (x, y) => `${x},${y}`;
  for (const d of decor) {
    const img = scene.add.image(d.x * TILE, d.y * TILE, `decor-${d.kind}`, d.v).setOrigin(0).setDepth(11);
    if (Math.random() < 0.5) img.setFlipX(true);
    if (d.kind === 'grass' || d.kind === 'flower') {
      scene.tweens.add({ targets: img, skewX: { from: -0.05, to: 0.05 }, duration: 1500 + Math.random() * 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    byCell.set(key(d.x, d.y), { ...d, img });
  }

  const remove = (x, y) => {
    const d = byCell.get(key(x, y));
    if (!d) return;
    d.img.destroy();
    byCell.delete(key(x, y));
    scene.effects.sparkle(x * TILE + TILE / 2, y * TILE + TILE / 2, GLOWING[d.kind] ?? 0x9ae67a, 3);
  };

  return {
    // a cell was dug out: things standing on it or hanging from it go too
    mined(x, y) {
      const above = byCell.get(key(x, y - 1));
      if (above && above.on === 'floor') remove(x, y - 1);
      const below = byCell.get(key(x, y + 1));
      if (below && below.on === 'ceil') remove(x, y + 1);
    },
    // a cell got filled (gravel landed there)
    filled(x, y) {
      remove(x, y);
    },
    // glowing things near the view, as lights for the darkness
    lights(view, flicker) {
      const out = [];
      const x0 = Math.floor((view.x - 32) / TILE);
      const x1 = Math.ceil((view.right + 32) / TILE);
      const y0 = Math.floor((view.y - 32) / TILE);
      const y1 = Math.ceil((view.bottom + 32) / TILE);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const d = byCell.get(key(x, y));
          if (!d || !GLOWING[d.kind]) continue;
          const cy = d.on === 'floor' ? y * TILE + 11 : y * TILE + 5;
          out.push({ x: x * TILE + TILE / 2, y: cy, r: (d.kind === 'mushroom' ? 0.9 : 1.3) * flicker, glow: 0.1, color: GLOWING[d.kind] });
          if (out.length >= 24) return out;
        }
      }
      return out;
    },
  };
}
