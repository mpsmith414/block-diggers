// The treasure map's X in the mine: a pirate chest in a little sealed cave,
// and a big red X painted on the rock over it that glows through the dark
// when someone is near. Walk into the chest to open it: a treasure for the
// Treasure Hall (or the grand prize, the golden statue) and a pile of
// sparkles. The HUD's compass arrows and the depth strip read `target()`.

import { getState, setState } from '../../save/store.js';
import { huntOf, openChest } from '../../game/hunt.js';
import { createRng } from '../../world/rng.js';
import { earnSticker } from '../common/stickers.js';
import { TILE, PLAYER, HUNT, GEAR_TUNE } from '../../tuning.js';

export function createHuntView(scene) {
  const c = scene.world.huntChest;
  const px = (v) => v * TILE;
  const golden = !!huntOf(getState(scene.registry)).map?.golden;
  const chestX = px(c.x) + TILE / 2;
  const chestY = px(c.y + 1);
  const chest = scene.add.sprite(chestX, chestY, 'hunt-chest', 0).setOrigin(0.5, 1).setDepth(11);
  // the X: over the middle of the cave, above the dark (it glows when you're near)
  const midY = px(c.cave.y0 + c.cave.y1 + 1) / 2;
  // (a golden map's X is gold)
  const mark = scene.add.image(chestX, midY, golden ? 'hunt-x-gold' : 'hunt-x').setDepth(52).setAlpha(0).setScale(0.75);
  let open = false;
  let near = false;
  let t = 0;

  function openIt(a) {
    open = true;
    chest.setFrame(1);
    scene.tweens.add({ targets: mark, alpha: 0, scale: 1.2, duration: 400, onComplete: () => mark.destroy() });
    const state = getState(scene.registry);
    const r = openChest(huntOf(state), createRng((Date.now() ^ (Math.random() * 1e9)) >>> 0));
    if (!r) return;
    setState(scene.registry, { ...state, hunt: r.hunt });
    scene.trip.chests++;
    scene.events.emit('chestOpened');
    scene.events.emit('discover');
    // a burst of gold, confetti and a flash
    scene.cameras.main.flash(250, 255, 240, 180);
    scene.cameras.main.shake(160, 0.004);
    scene.effects.confetti(chestX, chestY - 16);
    scene.effects.sparkle(chestX, chestY - 10, 0xffd84a, 16);
    scene.effects.sparkle(chestX, chestY - 10, 0xffffff, 8);
    // the sparkles go into the opener's jar (Lucky Mittens: half as much again)
    const n = scene.lucky?.(a) ? Math.round(r.sparkles * GEAR_TUNE.luckyMul) : r.sparkles;
    scene.rainbowView.give(a, n, c.x, c.y);
    if (r.prize) {
      // the treasure rises out of the chest, then its card and its sticker
      const pop = scene.add.image(chestX, chestY - 10, r.prize === 'statue' ? 'hunt-statue-icon' : `treasure-${r.prize}`).setDepth(53);
      scene.tweens.add({ targets: pop, y: chestY - 40, scale: 2, duration: 700, ease: 'Back.easeOut' });
      scene.tweens.add({ targets: pop, alpha: 0, delay: 1800, duration: 400, onComplete: () => pop.destroy() });
      scene.scene.get('Hud')?.treasureCard(r.prize);
      earnSticker(scene, `hunt-${r.prize}`);
    }
  }

  return {
    // where the HUD's arrows point (the chest, until it's open)
    target: () => (open ? null : { x: chestX, y: chestY - TILE / 2, row: c.y, golden }),

    update(dt) {
      if (open) return;
      t += dt;
      near = false;
      for (const a of scene.avatars) {
        if (!a || a.bubbling) continue;
        const cx = Math.floor((a.p.x + PLAYER.w / 2) / TILE);
        const cy = Math.floor((a.p.y + PLAYER.h / 2) / TILE);
        if (cx === c.x && cy === c.y) {
          openIt(a);
          return;
        }
        if (Math.hypot(cx - c.x, cy - c.y) <= HUNT.glow) near = true;
      }
      // the X fades in when someone's near, and pulses
      const want = near ? 0.65 + Math.sin(t * 4) * 0.25 : 0;
      mark.setAlpha(mark.alpha + (want - mark.alpha) * Math.min(1, dt * 5));
    },

    // the chest glows a little in the dark (a lot with the X-Ray Goggles), and the X when it shows
    lights(view, flicker) {
      if (open) return [];
      const out = [{ x: chestX, y: chestY - 6, r: (scene.xray ? 3 : 1.4) * flicker, glow: scene.xray ? 0.35 : 0.12, color: 0xffd86b }];
      if (near) out.push({ x: chestX, y: midY, r: 3 * flicker, glow: 0.25, color: golden ? 0xffe066 : 0xff6a5a });
      return out;
    },
  };
}
