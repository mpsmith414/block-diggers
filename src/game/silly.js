// Silly things: sneezing in the dust, going dizzy after a big fall, smelly
// socks in chests and whoopee cushions. None of them ever cost you anything.

import { SILLY, TILE } from '../tuning.js';

// ---- sneezing: dusty digging adds up until ACHOO ----

export function createSneeze(rng) {
  return { dust: 0, at: rng.int(SILLY.sneezeMin, SILLY.sneezeMax) };
}

const DUSTY = new Set(['soft', 'sand']);

// Returns true when this dig sets off a sneeze.
export function addDust(s, hardness, rng) {
  if (!DUSTY.has(hardness)) return false;
  s.dust++;
  if (s.dust < s.at) return false;
  s.dust = 0;
  s.at = rng.int(SILLY.sneezeMin, SILLY.sneezeMax);
  return true;
}

// ---- dizzy: a long drop onto the ground ----

export function createFall() {
  return { top: null };
}

// Call every frame with the player; returns 'dizzy' on a big landing.
export function trackFall(f, p) {
  if (p.inWater || p.climbing) {
    f.top = null;
    return null;
  }
  if (!p.grounded) {
    f.top = f.top === null ? p.y : Math.min(f.top, p.y);
    return null;
  }
  const dropped = f.top !== null && p.y - f.top >= SILLY.dizzyRows * TILE;
  f.top = null;
  return dropped ? 'dizzy' : null;
}

// ---- joke finds ----

export const chestSock = (rng) => rng.chance(SILLY.sockChance);

// Your feet are on a puffed-up cushion.
export function cushionPressed(cushion, box) {
  if (cushion.flat > 0) return false;
  const cx = box.x + box.w / 2;
  const feet = box.y + box.h;
  const left = cushion.x * TILE;
  const top = cushion.y * TILE;
  return cx >= left - 2 && cx <= left + TILE + 2 && feet >= top + TILE - 6 && feet <= top + TILE + 2;
}
