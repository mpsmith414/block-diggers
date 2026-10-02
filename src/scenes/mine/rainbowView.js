// Rainbow Planet in the mine: the layers' colours (the rock tinted row by
// row), the gems (tiny ones on their blocks; bigger ones as one gem that
// cracks a bit more with every hit, then shatters), the treasure chests and
// decorations, a banner for each new layer, and the sparkles it all gives.
// Sparkles go straight into a jar: they never take backpack space.

import { B } from '../../world/blocks.js';
import { rowColor, layerOfRow, PATTERNS } from '../../world/rainbow.js';
import { gemInfo, hitGem, crackStage } from '../../game/rainbowGems.js';
import { RAINBOW_TILES } from '../../art/textures.js';
import { TILE, PLAYER, RAINBOW, GEAR_TUNE } from '../../tuning.js';

const mix = (a, b, t) => {
  const ch = (c, s) => (c >> s) & 255;
  const lerp = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (lerp(16) << 16) | (lerp(8) << 8) | lerp(0);
};
const ROCKY = new Set([B.RAINBOW_ROCK, B.RAINBOW_GEM, B.RAINBOW_GEM_PART, B.RAINBOW_SHINY]);

// How each grid row looks (its layer, pattern and tint), for the map view.
export function rainbowPainter(world) {
  const rows = [];
  for (const l of world.layers) {
    const pattern = PATTERNS.indexOf(l.look.pattern);
    for (let y = l.top; y <= l.bottom; y++) {
      rows[y] = { look: l.look, pattern, tint: rowColor(l.look, world.top + y - (l.n - 1) * RAINBOW.layerRows) };
    }
  }
  const rowOf = (y) => rows[Math.min(Math.max(0, y), rows.length - 1)];
  return {
    rowOf,
    front(x, y, id) {
      if (!ROCKY.has(id)) return null;
      const r = rowOf(y);
      // (a shiny floor is the rock's colour, almost white)
      return { index: RAINBOW_TILES.pattern(r.pattern, (x * 7 + y * 3) & 3), tint: id === B.RAINBOW_SHINY ? mix(r.tint, 0xffffff, 0.6) : r.tint };
    },
    back(x, y) {
      const r = rowOf(y);
      return { index: RAINBOW_TILES.back(r.pattern), tint: r.tint };
    },
  };
}

export function createRainbowView(scene, painter, { startDeepest = 0 } = {}) {
  const world = scene.world;
  const px = (c) => c * TILE;
  const key = (x, y) => `${x},${y}`;
  const lookOf = (n) => world.layers.find((l) => l.n === n).look;

  // the gems
  const tinyAt = new Map();
  const bigAt = new Map();
  for (const g of world.gems) {
    const look = lookOf(g.n).gem;
    const { cells } = gemInfo(g.size);
    g.look = look;
    g.img = scene.add.image(px(g.x), px(g.y), `rgem-${look.shape}-${g.size}`).setOrigin(0).setDepth(10.5).setTint(look.color);
    if (cells === 1) {
      tinyAt.set(key(g.x, g.y), g);
      continue;
    }
    g.crack = scene.add.image(px(g.x), px(g.y), 'rgem-crack', 0).setOrigin(0).setDepth(10.6).setScale((cells * TILE) / 64).setVisible(false);
    for (let y = g.y; y < g.y + cells; y++) for (let x = g.x; x < g.x + cells; x++) bigAt.set(key(x, y), g);
  }

  // treasure chests, in their layer's colours
  const chests = world.rchests.map((c) => ({
    ...c,
    open: false,
    sprite: scene.add.sprite(px(c.x) + TILE / 2, px(c.y + 1), 'rchest', 0).setOrigin(0.5, 1).setDepth(11)
      .setTint(mix(lookOf(c.n).colors[0], 0xffffff, 0.35)),
  }));

  // decorations: on cave floors, or hanging from their ceilings
  const decor = world.rdecor.map((d) => {
    const look = lookOf(d.n);
    const tint = mix(d.ceiling ? look.gem.light : look.colors[look.colors.length - 1], 0xffffff, 0.3);
    const img = d.ceiling
      ? scene.add.image(px(d.x) + TILE / 2, px(d.y), `rdecor-${d.kind}`).setOrigin(0.5, 0).setFlipY(d.kind !== 'vine')
      : scene.add.image(px(d.x) + TILE / 2, px(d.y + 1), `rdecor-${d.kind}`).setOrigin(0.5, 1);
    img.setDepth(9).setTint(tint);
    if (d.kind === 'bubble') scene.tweens.add({ targets: img, y: img.y - 3, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return { ...d, img, support: { x: d.x, y: d.ceiling ? d.y - 1 : d.y + 1 } };
  });

  // sparkles fly to the player and into their jar
  function giveSparkles(a, n, cx, cy) {
    a.pack.ores.sparkle = (a.pack.ores.sparkle ?? 0) + n;
    scene.effects.orePop(cx, cy, 'sparkle', a.sprite);
    scene.events.emit('oreCollected', { slot: a.slot, ore: 'sparkle' });
  }

  function shatter(a, g) {
    const { cells, sparkles } = gemInfo(g.size);
    for (let y = g.y; y < g.y + cells; y++) {
      for (let x = g.x; x < g.x + cells; x++) {
        scene.grid.set(x, y, B.AIR);
        scene.mapView.sync(x, y);
        bigAt.delete(key(x, y));
      }
    }
    const cx = px(g.x) + (cells * TILE) / 2;
    const cy = px(g.y) + (cells * TILE) / 2;
    // the pieces fly apart
    for (let i = 0; i < cells * 3; i++) {
      const bit = scene.add.image(cx, cy, `rgem-${g.look.shape}-tiny`).setDepth(45).setTint(g.look.color).setScale(0.4 + Math.random() * 0.4);
      const ang = Math.random() * Math.PI * 2;
      const dist = cells * 6 + Math.random() * cells * 6;
      scene.tweens.add({
        targets: bit, x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist + 10, angle: 360 * (Math.random() - 0.5), alpha: 0,
        duration: 500 + Math.random() * 300, ease: 'Quad.easeOut', onComplete: () => bit.destroy(),
      });
    }
    scene.effects.sparkle(cx, cy, g.look.light, 6 + cells * 2);
    scene.effects.sparkle(cx, cy, 0xffffff, 4 + cells);
    g.img.destroy();
    g.crack.destroy();
    if (g.size === 'massive') {
      scene.cameras.main.flash(200, 255, 240, 255);
      scene.cameras.main.shake(220, 0.006);
      scene.effects.confetti(cx, cy);
    } else {
      scene.cameras.main.shake(100, 0.003);
    }
    scene.events.emit('gemBreak', g.size);
    giveSparkles(a, sparkles, Math.floor(cx / TILE), Math.floor(cy / TILE));
  }

  let banner = layerOfRow(startDeepest);
  let twinkleT = 0;
  const shown = new Set();

  return {
    // sparkles for player `a` from cell (x, y) (the treasure hunt's chest uses this too)
    give: giveSparkles,

    // Magnet Mitts pulled a tiny gem out of the rock (the block is rock again now)
    pluck(a, x, y) {
      const g = tinyAt.get(key(x, y));
      if (!g) return;
      g.img.destroy();
      tinyAt.delete(key(x, y));
      giveSparkles(a, gemInfo('tiny').sparkles, x, y);
    },

    // A block was dug: a tiny gem's sparkle, and decorations that lost their support.
    mined(a, m) {
      if (m.id === B.RAINBOW_GEM) {
        const g = tinyAt.get(key(m.x, m.y));
        if (g) {
          g.img.destroy();
          tinyAt.delete(key(m.x, m.y));
          giveSparkles(a, gemInfo('tiny').sparkles, m.x, m.y);
        }
      }
      for (const d of decor) {
        if (!d.gone && d.support.x === m.x && d.support.y === m.y) {
          d.gone = true;
          scene.tweens.add({ targets: d.img, alpha: 0, y: d.img.y + 6, duration: 300, onComplete: () => d.img.destroy() });
        }
      }
    },
    // the chunks a dug block throws: in its row's colour
    chunkTint: (x, y, id) => (ROCKY.has(id) ? painter.rowOf(y).tint : null),

    // A dig on a block of a big gem: one hit on the whole gem.
    chip(a, c) {
      const g = bigAt.get(key(c.x, c.y));
      if (!g) return;
      const { broken } = hitGem(g);
      if (broken) {
        shatter(a, g);
        return;
      }
      const stage = crackStage(g);
      g.crack.setFrame(stage).setVisible(stage > 0);
      scene.effects.sparkle(px(c.x) + TILE / 2, px(c.y) + TILE / 2, g.look.light, 4);
      const x0 = g.img.x;
      scene.tweens.add({ targets: [g.img, g.crack], x: x0 + 2, duration: 40, yoyo: true, repeat: 1, onComplete: () => { g.img.x = x0; g.crack.x = x0; } });
      scene.events.emit('gemHit');
    },

    update(dt) {
      for (const a of scene.avatars) {
        if (!a || a.bubbling) continue;
        const cx = Math.floor((a.p.x + PLAYER.w / 2) / TILE);
        const cy = Math.floor((a.p.y + PLAYER.h / 2) / TILE);
        // walk into a chest to open it
        for (const c of chests) {
          if (c.open || c.x !== cx || c.y !== cy) continue;
          c.open = true;
          c.sprite.setFrame(1);
          scene.trip.chests++;
          scene.events.emit('chestOpened');
          scene.effects.sparkle(px(c.x) + TILE / 2, px(c.y) + 4, 0xfff2a0, 10);
          // (Lucky Mittens: half as much again)
          giveSparkles(a, scene.lucky?.(a) ? Math.round(c.sparkles * GEAR_TUNE.luckyMul) : c.sparkles, c.x, c.y);
        }
        // a new layer: its banner (the first time ever, with a ribbon)
        const n = layerOfRow(world.top + cy);
        if (!shown.has(n) && (n > banner || shown.size === 0)) {
          shown.add(n);
          const record = n > banner;
          banner = Math.max(banner, n);
          scene.scene.get('Hud')?.rainbowBanner(lookOf(n), n, record);
          scene.events.emit(record ? 'discover' : 'rainbowLayer', n);
        }
      }
      // now and then a gem in view twinkles
      twinkleT -= dt;
      if (twinkleT <= 0) {
        twinkleT = 0.25;
        const view = scene.cameras.main.worldView;
        const near = world.gems.filter((g) => g.img.active && g.img.x > view.x && g.img.x < view.right && g.img.y > view.y && g.img.y < view.bottom);
        if (near.length) {
          const g = near[Math.floor(Math.random() * near.length)];
          const s = gemInfo(g.size).cells * TILE;
          scene.effects.sparkle(g.img.x + Math.random() * s, g.img.y + Math.random() * s, 0xffffff, 2);
        }
      }
    },

    // the big gems glow a little in the dark, and so do unopened chests
    lights(view, flicker) {
      const out = [];
      for (const g of world.gems) {
        if (!g.img.active || g.size === 'tiny') continue;
        const s = gemInfo(g.size).cells * TILE;
        const x = g.img.x + s / 2;
        const y = g.img.y + s / 2;
        if (x < view.x - 96 || x > view.right + 96 || y < view.y - 96 || y > view.bottom + 96) continue;
        out.push({ x, y, r: (gemInfo(g.size).cells * 0.5 + 0.8) * flicker, glow: 0.1, color: g.look.color });
      }
      // (X-Ray Goggles: unopened chests shine right through the dark)
      const r = scene.xray ? 2.6 : 1.2;
      for (const c of chests) if (!c.open) out.push({ x: px(c.x) + 8, y: px(c.y) + 8, r: r * flicker, glow: scene.xray ? 0.3 : 0.1, color: 0xfff2a0 });
      return out;
    },
  };
}
