// Little bits of juice: block chunks, ore pops, sparkles. Capped so the
// screen never fills with particles.

import { TILE } from '../../tuning.js';

const MAX_BITS = 30;

export const BLOCK_CHUNK_COLORS = {
  1: 0x5aa63c, 2: 0x8a5a34, 3: 0x7d7d86, 4: 0x3f3d4f, 6: 0x77706a,
  7: 0x8a5a34, 8: 0x7d7d86, 9: 0x7d7d86, 10: 0x7d7d86, 11: 0x3f3d4f, 12: 0x3f3d4f, 13: 0x3f3d4f,
  17: 0x4b3f8a, 26: 0x4b3f8a, 27: 0x4b3f8a, 28: 0x4b3f8a,
  29: 0xd0a868, 30: 0xb8645a, 31: 0x2e2c55, 32: 0x7a3420, 33: 0xd0a868, 34: 0xb8645a, 35: 0x2e2c55,
  36: 0xff5a8a, 37: 0x6ae07a, 38: 0x4a3040, 39: 0xb8b8c8, 40: 0xb8b8c8, 41: 0xffd84a,
  42: 0xd89a3a, 43: 0x34287a, 44: 0x5a6a78, 45: 0x4e78a8, 46: 0xb8b8c8, 47: 0x34287a, 48: 0x5a6a78, 51: 0x4e78a8,
  53: 0xc8583a, 54: 0x7a4a32, 55: 0x524650, 56: 0xb8844c, 57: 0xa8321a, 58: 0xc8583a, 59: 0x7a4a32, 60: 0x524650, 61: 0xb8844c, 62: 0xa8321a,
  68: 0xb8e4f8, 69: 0xf8e0c8, 70: 0x1e3a6a, 71: 0x1a2240, 72: 0xf0d890, 73: 0xb8e4f8, 74: 0xf8e0c8, 75: 0x1e3a6a, 76: 0x1a2240, 77: 0xf0d890, 78: 0xffffff, 81: 0xffffff,
  99: 0x7ad65a, // slime goo
};

export function createEffects(scene) {
  let live = 0;
  const bit = (x, y, color, size = 3) => {
    if (live >= MAX_BITS) return null;
    live++;
    const img = scene.add.image(x, y, 'pixel').setDisplaySize(size, size).setTint(color).setDepth(40);
    img.once('destroy', () => { live--; });
    return img;
  };

  return {
    // A block breaks into a few chunks that hop out and fall.
    chunks(cx, cy, blockId) {
      const color = BLOCK_CHUNK_COLORS[blockId] ?? 0x8a5a34;
      for (let i = 0; i < 5; i++) {
        const x = cx * TILE + 4 + Math.random() * 8;
        const y = cy * TILE + 4 + Math.random() * 8;
        const b = bit(x, y, color, 2 + Math.round(Math.random() * 2));
        if (!b) return;
        scene.tweens.add({
          targets: b,
          x: x + (Math.random() - 0.5) * 20,
          y: { value: y + 10 + Math.random() * 8, ease: 'Quad.easeIn' },
          alpha: 0,
          duration: 380 + Math.random() * 200,
          onComplete: () => b.destroy(),
        });
      }
    },

    // An ore icon pops out of the block, then flies into the player.
    orePop(cx, cy, ore, target) {
      const x0 = cx * TILE + TILE / 2;
      const y0 = cy * TILE + TILE / 2;
      const icon = scene.add.image(x0, y0, `ore-${ore}`).setDepth(60);
      scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 420,
        onUpdate: (tw) => {
          const t = tw.getValue();
          if (t < 0.45) {
            const k = t / 0.45;
            icon.setPosition(x0, y0 - 14 * Math.sin((k * Math.PI) / 2));
            icon.setScale(1 + 0.4 * k);
          } else {
            const k = (t - 0.45) / 0.55;
            const e = k * k;
            icon.setPosition(x0 + (target.x - x0) * e, y0 - 14 + (target.y - 10 - (y0 - 14)) * e);
            icon.setScale(1.4 - 0.8 * k);
            icon.setAlpha(1 - 0.7 * k);
          }
        },
        onComplete: () => icon.destroy(),
      });
      this.sparkle(x0, y0, 0xfff2a0);
    },

    sparkle(x, y, color = 0xffffff, n = 4) {
      for (let i = 0; i < n; i++) {
        const b = bit(x, y, color, 2);
        if (!b) return;
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        scene.tweens.add({
          targets: b,
          x: x + Math.cos(a) * 12,
          y: y + Math.sin(a) * 12,
          alpha: 0,
          duration: 350,
          onComplete: () => b.destroy(),
        });
      }
    },

    // A celebration: a burst of colourful confetti that flutters down.
    confetti(x, y) {
      const colors = [0xff7eb6, 0xffd84a, 0x8ec5ff, 0x7ad65a, 0xffffff, 0xb98cff];
      for (let i = 0; i < 40; i++) {
        const c = scene.add.image(x, y, 'pixel').setTint(colors[i % colors.length]).setDisplaySize(2, 3).setDepth(65);
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const v = 60 + Math.random() * 70;
        scene.tweens.add({
          targets: c,
          x: x + Math.cos(a) * v,
          y: { value: y + Math.sin(a) * v + 70, ease: 'Quad.easeIn' },
          angle: Math.random() * 720 - 360,
          alpha: { from: 1, to: 0 },
          duration: 1400 + Math.random() * 600,
          onComplete: () => c.destroy(),
        });
      }
    },

    // Short floating icon (e.g. "bounced off" or "full") above a point.
    flash(x, y, key) {
      const icon = scene.add.image(x, y, key).setDepth(60);
      scene.tweens.add({ targets: icon, y: y - 10, alpha: 0, duration: 700, onComplete: () => icon.destroy() });
    },
  };
}
