// Bubble to partner: float straight to them, through blocks.

import { BUBBLE } from '../tuning.js';

export function stepBubble(p, target, dt) {
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const d = Math.hypot(dx, dy);
  const step = BUBBLE.speed * dt;
  p.vx = 0;
  p.vy = 0;
  if (d <= step) {
    p.x = target.x;
    p.y = target.y;
    return true;
  }
  p.x += (dx / d) * step;
  p.y += (dy / d) * step;
  return false;
}
