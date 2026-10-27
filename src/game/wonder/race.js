// Race Planet: Rocket Kart Rally. The track, the kart's physics and the
// racers' driving (pure, so it's all tested).
//
// The track is seen from the side: the ground is a height for every x (no
// tiles). Rolling hills, a ramp over a pond, the loop-the-loop, a big hill,
// a tunnel, a ramp up through a hoop, bumps, a second loop, a long
// downhill, a last jump, and the finish line.

export const RACE = {
  startX: 320, finishX: 8600, podiumX: 8840, w: 9240, h: 560, base: 400,
  gravity: 900, maxSpeed: 178, accel: 230, coast: 45, brake: 320, freeMax: 100,
  slopePull: 240, hop: 240, boost: 310, boostTime: 1.0, trickBoost: 60,
  loopTime: 1.0, loopR: 52, water: 95, catchUp: 1.35,
};

// The track, as segments from x0 to x1. Each has a shape:
//   flat: stays at `y`; hills: rolls (`amp` high, `waves` bumps);
//   ramp: a straight run from y0 to y1 (a kicker if it ends going up);
//   pond: a dip of water.
export const TRACK = [
  { x0: 0, x1: 420, shape: 'flat', y: 400 },
  { x0: 420, x1: 1420, shape: 'hills', y: 400, amp: 34, waves: 3 },
  { x0: 1420, x1: 1660, shape: 'flat', y: 400 },
  { x0: 1660, x1: 1800, shape: 'ramp', y0: 400, y1: 330 },
  { x0: 1800, x1: 1810, shape: 'ramp', y0: 330, y1: 420 },
  { x0: 1810, x1: 1940, shape: 'pond', y: 420, depth: 26 },
  { x0: 1940, x1: 1950, shape: 'ramp', y0: 420, y1: 400 },
  { x0: 1950, x1: 2900, shape: 'flat', y: 400 },
  { x0: 2900, x1: 3500, shape: 'hills', y: 400, amp: 96, waves: 1 },
  { x0: 3500, x1: 4380, shape: 'flat', y: 400 },
  { x0: 4380, x1: 4520, shape: 'ramp', y0: 400, y1: 320 },
  { x0: 4520, x1: 4530, shape: 'ramp', y0: 320, y1: 420 },
  { x0: 4530, x1: 4900, shape: 'flat', y: 420 },
  { x0: 4900, x1: 5900, shape: 'hills', y: 420, amp: 16, waves: 6 },
  { x0: 5900, x1: 6480, shape: 'flat', y: 420 },
  { x0: 6480, x1: 6500, shape: 'ramp', y0: 420, y1: 440 },
  { x0: 6500, x1: 7500, shape: 'hills', y: 440, amp: 40, waves: 2 },
  { x0: 7500, x1: 7700, shape: 'flat', y: 440 },
  { x0: 7700, x1: 7880, shape: 'ramp', y0: 440, y1: 384 },
  { x0: 7880, x1: 7890, shape: 'ramp', y0: 384, y1: 420 },
  { x0: 7890, x1: 9240, shape: 'flat', y: 420 },
];

export const BOOSTS = [[1520, 1600], [2300, 2380], [4220, 4300], [5960, 6040], [8060, 8140]];
export const LOOPS = [2600, 6250];
export const HOOP = { x: 4590, y: 300 };
export const TUNNEL = [3700, 4200];

const segAt = (x) => TRACK.find((s) => x >= s.x0 && x < s.x1) ?? TRACK[TRACK.length - 1];

// The ground's height (y, down is bigger) at x.
export function groundY(x) {
  const s = segAt(Math.max(0, Math.min(RACE.w - 1, x)));
  const t = (x - s.x0) / (s.x1 - s.x0);
  if (s.shape === 'flat') return s.y;
  if (s.shape === 'ramp') return s.y0 + (s.y1 - s.y0) * t;
  if (s.shape === 'hills') return s.y - s.amp * (1 - Math.cos(t * Math.PI * 2 * s.waves)) / 2;
  if (s.shape === 'pond') return s.y + s.depth * Math.sin(t * Math.PI);
  return RACE.base;
}

export const slopeAt = (x) => (groundY(x + 1) - groundY(x - 1)) / 2;
export const inPond = (x) => segAt(x).shape === 'pond';

export function createKart(x, who) {
  return { who, x, y: groundY(x), vx: 0, vy: 0, onGround: true, angle: 0, boostT: 0, loopT: -1, loopX: 0, spin: 0, tricked: false, finishT: null, coins: 0, parked: false, hooped: false };
}

// One frame of driving. input: { gas, brake, hop }. opts: { maxMul, free }
// (free: before the race, slow, and the start line is a wall). Returns what
// happened this frame: launched, landed, boosted, looped, trick.
export function stepKart(k, input, dt, { maxMul = 1, free = false } = {}) {
  const ev = { launched: false, landed: false, boosted: false, looped: false, trick: false, splash: false, hoop: false };
  // the loop-the-loop: once you're in, round you go
  if (k.loopT >= 0) {
    k.loopT += dt;
    const t = Math.min(1, k.loopT / RACE.loopTime);
    const a = t * Math.PI * 2;
    const R = RACE.loopR;
    k.x = k.loopX + Math.sin(a) * R + t * 24;
    k.y = groundY(k.loopX) - R + Math.cos(a) * R;
    k.angle = -a * (180 / Math.PI);
    if (t >= 1) {
      k.loopT = -1;
      k.x = k.loopX + 24;
      k.y = groundY(k.x);
      k.angle = 0;
      k.vx = Math.max(k.vx, RACE.maxSpeed);
      k.onGround = true;
    }
    return ev;
  }
  const max = (free ? RACE.freeMax : RACE.maxSpeed) * maxMul * (k.onGround && inPond(k.x) ? RACE.water / RACE.maxSpeed : 1);
  if (k.boostT > 0) {
    k.boostT -= dt;
    k.vx = Math.max(k.vx, RACE.boost);
  } else if (input.gas) k.vx = Math.min(Math.max(k.vx, 0) + RACE.accel * dt, Math.max(max, k.vx - RACE.coast * dt));
  else if (input.brake) k.vx = Math.max(0, k.vx - RACE.brake * dt);
  else k.vx = Math.max(0, k.vx - RACE.coast * dt);
  if (k.vx > max && k.boostT <= 0) k.vx = Math.max(max, k.vx - RACE.coast * 3 * dt);

  if (k.onGround) {
    const s = slopeAt(k.x);
    k.vx = Math.max(0, k.vx + s * RACE.slopePull * dt); // (downhill speeds you up)
    if (input.hop) {
      k.onGround = false;
      k.vy = -RACE.hop + k.vx * s;
      ev.launched = true;
    } else {
      const nx = k.x + k.vx * dt;
      // the ground falls away faster than you'd fall: off you fly (off a
      // ramp's lip), keeping the climb you had on the way up
      const fly = k.y + k.vy * dt + 0.5 * RACE.gravity * dt * dt;
      if (groundY(nx) > fly + 1.5 && k.vx > 60) {
        k.onGround = false;
        k.x = nx;
        k.y += k.vy * dt;
        ev.launched = true;
      } else {
        k.x = nx;
        k.y = groundY(nx);
        k.vy = k.vx * (groundY(nx) - groundY(nx - 1)); // (the slope you came up, not the drop ahead)
        k.angle = Math.atan(slopeAt(nx)) * (180 / Math.PI);
        if (inPond(nx) && k.vx > 30 && Math.random() < dt * 8) ev.splash = true;
      }
    }
  }
  if (!k.onGround) {
    k.vy += RACE.gravity * dt;
    k.x += k.vx * dt;
    k.y += k.vy * dt;
    if (input.hop && !k.tricked) { k.tricked = true; k.spin = 0.001; ev.trick = true; }
    if (k.spin > 0) k.spin = Math.min(1, k.spin + dt * 2.2);
    k.angle = k.spin > 0 && k.spin < 1 ? -k.spin * 360 : Math.max(-30, Math.min(30, Math.atan2(k.vy, Math.max(40, k.vx)) * (180 / Math.PI)));
    if (Math.abs(k.x - HOOP.x) < 10 && Math.abs(k.y - 12 - HOOP.y) < 26) ev.hoop = true;
    if (k.y >= groundY(k.x)) {
      k.y = groundY(k.x);
      k.onGround = true;
      k.vy = 0;
      ev.landed = true;
      // a trick that finished in the air: a little boost
      if (k.spin >= 1) { k.vx += RACE.trickBoost; ev.boosted = true; }
      k.spin = 0;
      k.tricked = false;
      k.angle = Math.atan(slopeAt(k.x)) * (180 / Math.PI);
    }
  }
  // boost pads
  if (k.onGround && BOOSTS.some(([a, b]) => k.x >= a && k.x <= b) && k.boostT <= 0) {
    k.boostT = RACE.boostTime;
    ev.boosted = true;
  }
  // into a loop (on the ground, going along)
  for (const lx of LOOPS) {
    if (k.onGround && !free && k.x >= lx && k.x - k.vx * dt < lx) {
      k.loopT = 0;
      k.loopX = lx;
      ev.looped = true;
    }
  }
  if (free) k.x = Math.min(k.x, RACE.startX - 8);
  k.x = Math.max(8, Math.min(RACE.w - 8, k.x));
  return ev;
}

// How a racer drives: always on the gas, at its own pace, easing off when
// it's far ahead of the nearest player and pushing when far behind, and a
// touch slower on the last stretch (so a child who keeps going usually wins).
export function racerPace(k, pace, playerX) {
  const ahead = k.x - playerX;
  let mul = pace;
  if (ahead > 260) mul *= 0.72;
  else if (ahead > 120) mul *= 0.88;
  else if (ahead < -320) mul *= 1.18;
  if (k.x > RACE.finishX * 0.82) mul *= 0.9;
  return mul;
}

// Places, from the order karts crossed the line, then how far along the rest are.
export function places(karts) {
  const sorted = [...karts].sort((a, b) => {
    if (a.finishT !== null && b.finishT !== null) return a.finishT - b.finishT;
    if (a.finishT !== null) return -1;
    if (b.finishT !== null) return 1;
    return b.x - a.x;
  });
  return new Map(sorted.map((k, i) => [k, i + 1]));
}

// The coins: a row along the flat bits, arcs over the jumps and the hill.
export function coinSpots() {
  const out = [];
  const row = (x0, x1, step = 40, up = 18) => { for (let x = x0; x <= x1; x += step) out.push({ x, y: groundY(x) - up }); };
  const arc = (x0, x1, h, n = 7) => { for (let i = 0; i < n; i++) { const t = i / (n - 1); const x = x0 + (x1 - x0) * t; out.push({ x, y: groundY(x) - 18 - Math.sin(t * Math.PI) * h }); } };
  row(500, 1380, 80);
  arc(1810, 1950, 60);
  row(2200, 2520, 40);
  arc(2940, 3460, 40, 9);
  row(3700, 4200, 60, 14);
  arc(4540, 4760, 50);
  row(4950, 5850, 100, 22);
  row(6550, 7450, 90);
  arc(7890, 8200, 50);
  return out;
}
