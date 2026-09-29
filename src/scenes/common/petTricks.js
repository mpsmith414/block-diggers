// Pet tricks (Y): a flip for the walkers, a spin for the flyers, and hearts.

import { earnSticker } from './stickers.js';

const FLIPPERS = ['mole', 'rex', 'trike', 'moonpup', 'rover', 'yeti'];
const TRICK_TIME = 0.7;

export function playTrick(scene, pet) {
  if (pet.trickT > 0) return;
  pet.trickT = TRICK_TIME + Math.random() * 0.2;
  pet.trickDir = Math.random() < 0.5 ? 1 : -1;
  scene.events.emit('trick', pet);
  for (let i = 0; i < 3; i++) {
    scene.time.delayedCall(150 + i * 120, () => {
      const h = scene.add.image(pet.sprite.x + (i - 1) * 6, pet.sprite.y - 10, 'heart').setDepth(40).setScale(0.7);
      scene.tweens.add({ targets: h, y: h.y - 18, alpha: 0, scale: 1.1, duration: 800, onComplete: () => h.destroy() });
    });
  }
  earnSticker(scene, 'silly-trick');
}

// How far through its trick a pet is: an up-and-down hop and a full turn.
export function trickOffset(pet, dt) {
  if (!(pet.trickT > 0)) return { y: 0, angle: 0 };
  pet.trickT = Math.max(0, pet.trickT - dt);
  const k = 1 - pet.trickT / TRICK_TIME;
  const t = Math.min(1, Math.max(0, k));
  const hop = FLIPPERS.includes(pet.kind) ? 16 : 6;
  return { y: -Math.sin(t * Math.PI) * hop, angle: pet.trickDir * t * 360 };
}
