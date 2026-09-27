// Co-op camera maths: frame both players, keep them from drifting too far
// apart (the soft wall), and spot a player who has left the screen.

import { CAMERA } from '../tuning.js';

export function frameCamera(points, view, opts = CAMERA) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const fit = Math.min(view.w / (maxX - minX + opts.margin * 2), view.h / (maxY - minY + opts.margin * 2));
  return {
    zoom: Math.max(opts.minZoom, Math.min(opts.maxZoom, fit)),
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  };
}

export function wallLimits(view, opts = CAMERA) {
  return { dx: view.w / opts.minZoom - opts.margin * 2, dy: view.h / opts.minZoom - opts.margin * 2 };
}

// Undo a player's own movement on any axis where it takes them past the limit
// from their partner. Moving back toward the partner is always allowed.
export function applySoftWall(prev, next, partner, limits) {
  const out = { x: next.x, y: next.y };
  const over = (v, p, lim) => Math.abs(v - p) > lim;
  if (over(next.x, partner.x, limits.dx) && Math.abs(next.x - partner.x) > Math.abs(prev.x - partner.x)) out.x = prev.x;
  if (over(next.y, partner.y, limits.dy) && Math.abs(next.y - partner.y) > Math.abs(prev.y - partner.y)) out.y = prev.y;
  return out;
}

export function isOffscreen(point, rect, pad = 8) {
  return point.x < rect.x - pad || point.x > rect.right + pad || point.y < rect.y - pad || point.y > rect.bottom + pad;
}
