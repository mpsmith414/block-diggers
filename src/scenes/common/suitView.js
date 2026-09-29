// The Sun Suit pieces your characters wear: the Helmet (from the Moon Heart),
// the Boots (from the Mars Heart), the Gloves (from the Saturn Heart) and the
// Jetpack (from the Dino Heart), and the crown from the Sun's Heart. Overlays that follow each character
// sprite; the Boots follow the legs frame by frame, and puff little flames
// from the heels when you run.

import { getState } from '../../save/store.js';

const PIECES = [
  { id: 'helmet', key: 'suit-helmet', framed: false },
  { id: 'boots', key: 'suit-boots-worn', framed: true },
  { id: 'gloves', key: 'suit-gloves-worn', framed: true },
  { id: 'jetpack', key: 'suit-jetpack-worn', framed: true },
  // the crown (from the Sun's Heart), for everyone
  { id: 'crown', key: 'suit-crown-worn', framed: false },
];

export function createSuitView(scene) {
  const worn = new Map(); // avatar → [{ piece, img }]
  const has = (id) => (getState(scene.registry).suit ?? []).includes(id);

  const add = (a) => {
    const list = worn.get(a) ?? [];
    for (const piece of PIECES) {
      if (!has(piece.id) || list.some((w) => w.piece === piece)) continue;
      list.push({ piece, img: scene.add.image(0, 0, piece.key, 0).setOrigin(0.5, 1).setDepth(a.sprite.depth + 0.5) });
    }
    worn.set(a, list);
  };

  return {
    add,
    // after winning a piece: everyone puts it on
    refresh() {
      for (const a of scene.avatars) if (a) add(a);
    },
    update() {
      for (const [a, list] of worn) {
        const s = a.sprite;
        for (const { piece, img } of list) {
          img.setPosition(s.x, s.y).setFlipX(s.flipX).setScale(s.scaleX, s.scaleY)
            .setAngle(s.angle).setAlpha(s.alpha).setVisible(s.visible);
          if (piece.framed) img.setFrame(Number(s.frame.name) || 0);
          // rocket boots: a little flame from the heels when running
          if (piece.id === 'boots' && a.p && a.p.grounded && a.p.vx !== 0 && s.visible && s.alpha > 0.5) {
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
