// Two silly powers, asked for by the player himself:
//  - touch lava and you become a LAVA MONSTER for a while (lava-proof,
//    fast digging, creatures poof away);
//  - sit in water for a moment and you DRINK it (glug glug… BURP), which
//    gives you the ZOOMIES (faster walking and digging).

import { POWERUPS, RIDE } from '../tuning.js';

export function createPowerups() {
  return { lava: 0, zoom: 0, ride: 0, inWaterT: 0, drinking: 0, needOut: false, outT: 0 };
}

// Hop on a friendly parasaur. Returns true if this started a ride (you weren't riding).
export function startRide(pu) {
  if (pu.ride > 0) return false;
  pu.ride = RIDE.time;
  return true;
}

// Returns true if this touch turned you into a lava monster (it wasn't one).
export function touchLava(pu) {
  const became = pu.lava <= 0;
  pu.lava = POWERUPS.lavaTime;
  return became;
}

// Advance timers. Returns a list of event names that happened this step.
export function stepPowerups(pu, dt, { inWater = false } = {}) {
  const ev = [];
  if (pu.lava > 0) {
    pu.lava -= dt;
    if (pu.lava <= 0) { pu.lava = 0; ev.push('lavaEnd'); }
  }
  if (pu.zoom > 0) {
    pu.zoom -= dt;
    if (pu.zoom <= 0) { pu.zoom = 0; ev.push('zoomEnd'); }
  }
  if (pu.ride > 0) {
    pu.ride -= dt;
    if (pu.ride <= 0) { pu.ride = 0; ev.push('rideEnd'); }
  }
  if (pu.drinking > 0) {
    pu.drinking -= dt;
    if (pu.drinking <= 0) {
      pu.drinking = 0;
      pu.zoom = POWERUPS.zoomTime;
      pu.needOut = true;
      pu.outT = 0;
      ev.push('burp');
    }
    return ev;
  }
  if (inWater) {
    pu.inWaterT += dt;
    if (!pu.needOut && pu.inWaterT >= POWERUPS.drinkAfter) {
      pu.drinking = POWERUPS.drinkTime;
      ev.push('drinkStart');
    }
  } else {
    pu.inWaterT = 0;
    if (pu.needOut) {
      pu.outT += dt;
      if (pu.outT >= POWERUPS.drinkCooldown) pu.needOut = false;
    }
  }
  return ev;
}

export function multipliers(pu) {
  const zoom = pu.zoom > 0 ? POWERUPS.zoomSpeed : 1;
  const riding = pu.ride > 0;
  return {
    dig: pu.lava > 0 ? 2 : zoom,
    walk: zoom * (riding ? RIDE.speed : 1),
    jump: riding ? RIDE.jump : 1,
    riding,
    lavaSafe: pu.lava > 0,
    drinking: pu.drinking > 0,
  };
}
