// Friends at camp: they wander near their home, show what they'd like in a
// speech bubble, and give a reward when you bring it.

import { presentVisitors, fulfill, VISITORS } from '../../game/visitors.js';
import { getState, setState } from '../../save/store.js';
import { createRng } from '../../world/rng.js';
import { earnSticker } from '../common/stickers.js';
import { TILE, CAMP, PLAYER } from '../../tuning.js';

const INK = 0x4a3222;

export function createVisitorsView(camp) {
  const groundY = CAMP.ground * TILE;
  const rng = createRng((Date.now() ^ 0x5bd1e995) >>> 0);
  const friends = [];

  const homeX = (id) => {
    const v = VISITORS.find((q) => q.id === id);
    const state = getState(camp.registry);
    if (v.home === 'stall') return CAMP.stallX * TILE - 26;
    const plot = state.plots.indexOf(v.home);
    if (plot >= 0) return CAMP.plots[plot] * TILE + (CAMP.plotW * TILE) / 2 + 30;
    return (CAMP.fireX - 2) * TILE;
  };

  function bubbleFor(f) {
    if (f.bubble) f.bubble.destroy();
    const req = getState(camp.registry).visitors.requests[f.id];
    const c = camp.add.container(0, 0).setDepth(67);
    const g = camp.add.graphics();
    const w = req ? 34 : 18;
    g.fillStyle(0x3a2a24, 1).fillRoundedRect(-w / 2 - 1, -11, w + 2, 18, 5);
    g.fillStyle(0xf4e4c1, 1).fillRoundedRect(-w / 2, -10, w, 16, 4);
    g.fillStyle(0xf4e4c1, 1).fillTriangle(-3, 6, 3, 6, 0, 10);
    c.add(g);
    if (req) {
      c.add(camp.add.image(-8, -2, `ore-${req.ore}`));
      f.count = camp.add.bitmapText(-1, -5, 'pixel', `x${req.n}`).setTint(INK);
      c.add(f.count);
    } else {
      c.add(camp.add.image(0, -2, 'heart'));
    }
    f.bubble = c;
  }

  function add(id, arriving) {
    const x = homeX(id);
    const f = { id, home: x, x: arriving ? x + 120 : x, t: arriving ? 4 : Math.random() * 5, target: x, speed: arriving ? 45 : 18, sprite: camp.add.sprite(0, 0, `friend-${id}`, 0).setOrigin(0.5, 1).setDepth(28) };
    friends.push(f);
    bubbleFor(f);
    if (arriving) {
      // walk in from the edge of the camp with a little flurry of hearts
      camp.time.delayedCall(1500, () => {
        for (let i = 0; i < 5; i++) {
          const h = camp.add.image(f.x, groundY - 20, 'heart').setDepth(68);
          camp.tweens.add({ targets: h, y: h.y - 30 - i * 6, x: h.x + (i - 2) * 8, alpha: 0, duration: 1200, delay: i * 120, onComplete: () => h.destroy() });
        }
      });
    }
  }

  // who's here, and did anyone new move in?
  const state = getState(camp.registry);
  const seen = state.visitors.seen ?? [];
  const present = presentVisitors(state);
  present.forEach((id) => add(id, !seen.includes(id)));
  if (present.some((id) => !seen.includes(id))) {
    setState(camp.registry, { ...state, visitors: { ...state.visitors, seen: [...new Set([...seen, ...present])] } });
  }

  return {
    refreshBubbles() { friends.forEach(bubbleFor); },

    // the friend a player is standing next to
    near(a) {
      const x = a.p.x + PLAYER.w / 2;
      return friends.find((f) => Math.abs(f.x - x) < 14) ?? null;
    },

    give(f) {
      const s = getState(camp.registry);
      const req = s.visitors.requests[f.id];
      const r = fulfill(s, f.id, rng);
      if (!r) {
        if (f.count) f.count.setTint(0xd0463a);
        camp.tweens.add({ targets: f.bubble, x: { from: f.bubble.x - 3, to: f.bubble.x }, duration: 60, yoyo: true, repeat: 2, onComplete: () => f.count && f.count.setTint(INK) });
        camp.events.emit('nope');
        return false;
      }
      setState(camp.registry, r.state);
      const hud = camp.scene.get('CampHud');
      hud.syncBank(r.state.bank);
      if (req) hud.flyToWorld(Array(req.n).fill(req.ore), f.x, groundY - 12);
      for (let i = 0; i < 6; i++) {
        const h = camp.add.image(f.x, groundY - 20, 'heart').setDepth(68);
        camp.tweens.add({ targets: h, y: h.y - 26 - (i % 3) * 8, x: h.x + (i - 3) * 6, alpha: 0, duration: 1100, delay: 300 + i * 80, onComplete: () => h.destroy() });
      }
      camp.tweens.add({ targets: f.sprite, y: f.sprite.y - 8, duration: 150, yoyo: true, repeat: 2 });
      // the reward
      camp.time.delayedCall(900, () => {
        if (r.reward.kind === 'ore') {
          hud.flyList(f.x, groundY - 24, Array(r.reward.n).fill(r.reward.ore), getState(camp.registry).bank);
        } else if (r.reward.kind === 'decor') {
          const key = r.reward.id.startsWith('trophy') ? r.reward.id : `deco-${r.reward.id}`;
          const icon = camp.add.image(f.x, groundY - 20, key).setOrigin(0.5, 1).setDepth(68);
          camp.tweens.add({ targets: icon, y: groundY - 50, scale: 1.4, duration: 600, ease: 'Back.easeOut', yoyo: true, hold: 500, onComplete: () => icon.destroy() });
          camp.effects.confetti(f.x, groundY - 30);
        } else {
          camp.campPets.hatchAll([r.reward.egg]);
        }
        earnSticker(camp, `friend-${f.id}`);
      });
      camp.events.emit('thanks', f);
      bubbleFor(f);
      return true;
    },

    update(dt, time) {
      for (const f of friends) {
        f.t -= dt;
        if (f.t <= 0) {
          f.t = 2 + Math.random() * 3;
          f.target = f.home + (Math.random() - 0.5) * 40;
        }
        const dx = f.target - f.x;
        if (Math.abs(dx) < 1) f.speed = 18; // arrived: back to a stroll
        const step = Math.sign(dx) * Math.min(Math.abs(dx), f.speed * dt);
        f.x += step;
        f.sprite.setPosition(Math.round(f.x), groundY)
          .setFrame(Math.abs(dx) > 1 ? Math.floor(time / 220) % 2 : 0)
          .setFlipX(dx < -1);
        f.bubble.setPosition(Math.round(f.x), groundY - 28 + Math.sin(time / 300 + f.home) * 1.5);
      }
    },
  };
}
