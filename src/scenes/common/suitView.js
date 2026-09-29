// The Sun Suit pieces your characters wear (for now: the Helmet from the
// Moon Heart). An overlay that follows each character sprite.

import { getState } from '../../save/store.js';

export function createSuitView(scene) {
  const worn = new Map(); // avatar → helmet image
  const hasHelmet = () => (getState(scene.registry).suit ?? []).includes('helmet');

  const add = (a) => {
    if (worn.has(a) || !hasHelmet()) return;
    worn.set(a, scene.add.image(0, 0, 'suit-helmet').setOrigin(0.5, 1).setDepth(a.sprite.depth + 0.5));
  };

  return {
    add,
    // after winning a piece: everyone puts it on
    refresh() {
      for (const a of scene.avatars) if (a) add(a);
    },
    update() {
      for (const [a, img] of worn) {
        const s = a.sprite;
        img.setPosition(s.x, s.y).setFlipX(s.flipX).setScale(s.scaleX, s.scaleY)
          .setAngle(s.angle).setAlpha(s.alpha).setVisible(s.visible);
      }
    },
  };
}
