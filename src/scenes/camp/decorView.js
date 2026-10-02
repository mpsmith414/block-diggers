// Placed decorations at camp, and carrying one around to place it.

import Phaser from 'phaser';
import { placeDecor, pickUpDecor, canPlace, takeFromStock, decorOf } from '../../game/decor.js';
import { decorLook } from '../../art/decorItems.js';
import { PHASES } from '../../game/timeOfDay.js';
import { getState, setState } from '../../save/store.js';
import { TILE, CAMP, PLAYER } from '../../tuning.js';

export function createDecorView(camp) {
  const groundY = CAMP.ground * TILE;
  let sprites = [];
  const night = PHASES[camp.phase].night > 0;
  const planet = camp.planet ?? 'earth';
  const mine = () => decorOf(getState(camp.registry), planet);

  function render() {
    for (const s of sprites) s.forEach((o) => o.destroy());
    sprites = mine().placed.map((d) => {
      const look = decorLook(d.id);
      const parts = [];
      const img = camp.add.image(d.x, groundY + (look.sink ?? 0), look.key).setOrigin(0.5, 1).setDepth(look.sink ? 11 : 4).setScale(look.scale ?? 1);
      parts.push(img);
      if (d.id === 'windmill') {
        const blades = camp.add.image(d.x, groundY - 32, 'deco-blades').setDepth(5);
        camp.tweens.add({ targets: blades, angle: 360, duration: 6000, repeat: -1 });
        parts.push(blades);
      }
      if (d.id === 'pond') {
        const fish = camp.add.image(d.x, groundY, 'fish').setDepth(11).setVisible(false);
        camp.time.addEvent({
          delay: 2600 + Math.random() * 2000,
          loop: true,
          callback: () => {
            fish.setVisible(true).setPosition(d.x - 6 + Math.random() * 12, groundY);
            camp.tweens.add({ targets: fish, y: groundY - 10, angle: { from: -40, to: 40 }, duration: 350, yoyo: true, onComplete: () => fish.setVisible(false) });
          },
        });
        parts.push(fish);
        // once you've found a rubber duck in the mine, one floats here
        if (getState(camp.registry).stickers['silly-duck']) {
          const duck = camp.add.image(d.x + 6, groundY - 1, 'duck').setOrigin(0.5, 1).setDepth(12);
          camp.tweens.add({ targets: duck, y: groundY, angle: { from: -6, to: 6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          camp.tweens.add({ targets: duck, x: d.x - 6, duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => duck.setFlipX(!duck.flipX), onRepeat: () => duck.setFlipX(!duck.flipX) });
          parts.push(duck);
        }
      }
      if (look.glow && (night || !look.nightOnly)) {
        const glow = camp.add.image(d.x, groundY - look.glowY, 'light').setTint(look.glow)
          .setAlpha(night ? 0.45 : 0.25).setScale(night ? 1 : 0.6).setDepth(26).setBlendMode(Phaser.BlendModes.ADD);
        camp.tweens.add({ targets: glow, alpha: glow.alpha * 0.75, duration: 900, yoyo: true, repeat: -1 });
        parts.push(glow);
      }
      return parts;
    });
  }
  render();

  const carriedIcon = (a) => {
    if (!a.carryIcon) a.carryIcon = camp.add.image(0, 0, 'pixel').setDepth(66).setVisible(false);
    return a.carryIcon;
  };

  return {
    render,

    // Start carrying: from stock (the picker already bought it if needed).
    carry(a, id) {
      const next = takeFromStock(getState(camp.registry), id, planet);
      if (!next) return false;
      setState(camp.registry, next);
      a.carrying = id;
      const look = decorLook(id);
      carriedIcon(a).setTexture(look.key).setScale(look.scale ?? 1).setVisible(true).setOrigin(0.5, 1);
      return true;
    },

    // A: put it down here if there's room
    place(a) {
      const x = Math.round(a.p.x + PLAYER.w / 2);
      const next = placeDecor(getState(camp.registry), a.carrying, x, planet);
      if (!next) return false;
      setState(camp.registry, next);
      a.carrying = null;
      carriedIcon(a).setVisible(false);
      camp.effects.sparkle(x, groundY - 8, 0xffe9a0, 8);
      render();
      return true;
    },

    // B: put it back in the bag
    stow(a) {
      // (back into the bag: placing it and picking it up again does exactly that)
      const s = getState(camp.registry);
      const d = decorOf(s, planet);
      const stock = { ...d.stock, [a.carrying]: (d.stock[a.carrying] ?? 0) + 1 };
      setState(camp.registry, planet === 'earth' ? { ...s, decor: { ...d, stock } }
        : { ...s, bases: { ...s.bases, [planet]: { ...s.bases[planet], decor: { ...d, stock } } } });
      a.carrying = null;
      carriedIcon(a).setVisible(false);
    },

    // index of a placed decoration under this player, or -1
    under(a) {
      const x = a.p.x + PLAYER.w / 2;
      return mine().placed.findIndex((d) => Math.abs(d.x - x) < 9);
    },

    pickUp(a, index) {
      const s = getState(camp.registry);
      const id = decorOf(s, planet).placed[index].id;
      setState(camp.registry, pickUpDecor(s, index, planet));
      render();
      this.carry(a, id);
    },

    canDrop(a) {
      return canPlace(getState(camp.registry), a.carrying, Math.round(a.p.x + PLAYER.w / 2), planet);
    },

    update(time) {
      for (const a of camp.avatars) {
        if (!a || !a.carrying) continue;
        const icon = carriedIcon(a);
        const ok = this.canDrop(a);
        icon.setPosition(a.sprite.x, a.sprite.y - 18 + Math.sin(time / 200) * 2).setAlpha(ok ? 1 : 0.45);
      }
    },
  };
}
