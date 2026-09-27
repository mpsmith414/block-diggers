// What buildings do, at camp: gem flowers to harvest in the garden, gift
// boxes in the pen, and a little perk bubble over each building you visit.

import { harvestGarden, collectPenGift } from '../../game/perks.js';
import { getState, setState } from '../../save/store.js';
import { createRng } from '../../world/rng.js';
import { TILE, CAMP, PLAYER } from '../../tuning.js';

const PERK_ICON = { house: 'perk-bag', tower: 'perk-eye', statue: 'perk-luck', garden: 'gem-bud', pen: 'gift' };

export function createPerksView(camp) {
  const groundY = CAMP.ground * TILE;
  const rng = createRng(Date.now() >>> 0);
  const buds = [];
  const gifts = [];
  const bubble = camp.add.container(0, 0).setDepth(68).setVisible(false);
  const bubbleBg = camp.add.graphics();
  bubbleBg.fillStyle(0x3a2a24, 1).fillRoundedRect(-10, -10, 20, 20, 5);
  bubbleBg.fillStyle(0xf4e4c1, 1).fillRoundedRect(-9, -9, 18, 18, 4);
  bubbleBg.fillStyle(0xf4e4c1, 1).fillTriangle(-3, 9, 3, 9, 0, 13);
  const bubbleIcon = camp.add.image(0, 0, 'perk-bag');
  bubble.add([bubbleBg, bubbleIcon]);

  const plotOf = (id) => getState(camp.registry).plots.indexOf(id);
  const plotX = (plot) => CAMP.plots[plot] * TILE;

  function refresh() {
    const state = getState(camp.registry);
    // gem flowers in the garden
    buds.forEach((b) => b.destroy());
    buds.length = 0;
    const g = plotOf('garden');
    if (g >= 0 && camp.buildings[g] && !camp.buildings[g].building) {
      for (let i = 0; i < state.garden.stock; i++) {
        const bx = plotX(g) + 10 + ((i * 37) % 76);
        const by = groundY - 30 - (i % 3) * 5;
        const b = camp.add.image(bx, by, 'gem-bud').setDepth(4);
        camp.tweens.add({ targets: b, y: by - 2, duration: 700 + (i % 4) * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        buds.push(b);
      }
    }
    // gift boxes in the pen
    gifts.forEach((b) => b.destroy());
    gifts.length = 0;
    const p = plotOf('pen');
    if (p >= 0 && camp.buildings[p] && !camp.buildings[p].building) {
      for (let i = 0; i < state.pen.gifts; i++) {
        const gx = plotX(p) + 30 + i * 18;
        const b = camp.add.image(gx, groundY - 1, 'gift').setOrigin(0.5, 1).setDepth(5);
        camp.tweens.add({ targets: b, scaleY: 0.9, duration: 500, yoyo: true, repeat: -1, delay: i * 120 });
        gifts.push(b);
      }
    }
  }

  function payOut(worldX, worldY, ores) {
    const hud = camp.scene.get('CampHud');
    hud.flyList(worldX, worldY, ores, getState(camp.registry).bank);
  }

  return {
    refresh,

    update(time) {
      const state = getState(camp.registry);
      let shown = null;
      for (const a of camp.avatars) {
        if (!a) continue;
        const cx = a.p.x + PLAYER.w / 2;
        const plot = CAMP.plots.findIndex((px) => cx >= px * TILE && cx < (px + CAMP.plotW) * TILE);
        const id = plot >= 0 ? state.plots[plot] : null;
        if (!id || !camp.buildings[plot] || camp.buildings[plot].building) continue;
        // harvest the garden by walking through it
        if (id === 'garden' && state.garden.stock > 0) {
          const r = harvestGarden(state, rng);
          setState(camp.registry, r.state);
          buds.forEach((b) => camp.effects.sparkle(b.x, b.y, 0xe080ff, 3));
          payOut(cx, groundY - 30, r.ores);
          camp.events.emit('harvest');
          refresh();
          return;
        }
        // pick up a gift by walking over it
        const gift = gifts.find((g) => Math.abs(g.x - cx) < 10);
        if (id === 'pen' && gift) {
          const r = collectPenGift(state, rng);
          setState(camp.registry, r.state);
          camp.effects.confetti(gift.x, gift.y - 8);
          payOut(gift.x, gift.y - 8, r.ores);
          camp.events.emit('gift');
          refresh();
          return;
        }
        if (PERK_ICON[id]) shown = { id, x: plotX(plot) + (CAMP.plotW * TILE) / 2 };
      }
      if (shown) {
        bubbleIcon.setTexture(PERK_ICON[shown.id]);
        bubble.setVisible(true).setPosition(shown.x, groundY - 88 + Math.sin(time / 250) * 2);
      } else {
        bubble.setVisible(false);
      }
    },
  };
}
