// Shared character drawing for the mine and the camp: position, facing and
// the walk / climb / jump frames, plus a tiny squash while digging.

import { PLAYER } from '../../tuning.js';

export function animateCharacter(sprite, p, state, dt, time) {
  sprite.setPosition(Math.round(p.x + PLAYER.w / 2), Math.round(p.y + PLAYER.h));
  sprite.setFlipX(p.facing < 0);
  let frame = 0;
  if (p.climbing && p.vy !== 0) frame = Math.floor(time / 150) % 2 ? 3 : 0;
  else if (p.climbing) frame = 3;
  else if (p.grounded && p.vx !== 0) {
    state.walkT = (state.walkT ?? 0) + dt;
    frame = 1 + (Math.floor(state.walkT * 8) % 2);
  } else if (!p.grounded) frame = 1;
  sprite.setFrame(frame);
  const digging = p.mining && p.mining.need !== Infinity;
  // idle breathing, or a squash while digging
  const breathe = p.vx === 0 && p.grounded && !digging ? Math.sin(time / 400) * 0.03 : 0;
  sprite.setScale(1, digging ? 1 - 0.06 * Math.abs(Math.sin(time / 60)) : 1 + breathe);
}
