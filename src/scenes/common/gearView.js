// What each character is wearing: their own gear on each body part (hats,
// backs, feet, hands; the Sun Suit pieces are gear too). Overlays that follow
// each character sprite; the framed ones follow the walk frames, backs go
// behind the character, the Glider Cape spreads out while gliding, and the
// Rocket Boots puff little flames from the heels when you run.

import { getState } from '../../save/store.js';
import { SLOTS, wornBy } from '../../game/gear.js';
import { gearLook } from '../../art/gear.js';
import { goldKey } from '../../art/gold.js';

// drawn bottom to top: backs (behind), feet, hands, then the hat
const ORDER = ['back', 'feet', 'hands', 'head'];

export function createGearView(scene) {
  const worn = new Map(); // avatar → [{ id, look, img }]

  const clear = (a) => {
    for (const w of worn.get(a) ?? []) w.img.destroy();
    worn.delete(a);
  };

  const add = (a) => {
    clear(a);
    const on = wornBy(getState(scene.registry), a.slot);
    const list = [];
    ORDER.forEach((part, i) => {
      const id = on[part];
      if (!id || !SLOTS.includes(part)) return;
      const look = gearLook(id);
      if (!scene.textures.exists(look.key)) return;
      const depth = a.sprite.depth + (look.behind ? -0.5 : 0.2 + i * 0.1);
      // (the Treasure Hall's golden statues wear golden gear)
      const key = a.gold ? goldKey(scene, look.key) : look.key;
      list.push({ id, look, img: scene.add.image(0, 0, key, look.framed ? 0 : undefined).setOrigin(0.5, 1).setDepth(depth) });
    });
    worn.set(a, list);
  };

  return {
    add,
    // after a change on the Gear page, a purchase or a piece won: everyone dresses again
    refresh() {
      for (const a of scene.avatars) if (a) add(a);
    },
    update() {
      for (const [a, list] of worn) {
        if (!a.sprite.active) { clear(a); continue; }
        const s = a.sprite;
        for (const { id, look, img } of list) {
          img.setPosition(s.x, s.y).setFlipX(s.flipX).setScale(s.scaleX, s.scaleY)
            .setAngle(s.angle).setAlpha(s.alpha).setVisible(s.visible);
          if (look.framed) img.setFrame(id === 'glider' && a.gliding ? 4 : Number(s.frame.name) || 0);
          // rocket boots: a little flame from the heels when running
          if (id === 'boots' && a.p && a.p.grounded && a.p.vx !== 0 && s.visible && s.alpha > 0.5) {
            a.bootT = (a.bootT ?? 0) - 1;
            if (a.bootT <= 0) {
              a.bootT = 5;
              const f = scene.add.image(s.x - Math.sign(a.p.vx) * 5, s.y - 1, 'pixel')
                .setTint(Math.random() < 0.5 ? 0xffb34a : 0xff5a1a).setDisplaySize(2, 2).setDepth(s.depth - 0.5);
              scene.tweens.add({ targets: f, x: f.x - Math.sign(a.p.vx) * 5, y: f.y - 2, alpha: 0, duration: 260, onComplete: () => f.destroy() });
            }
          }
        }
      }
    },
  };
}
