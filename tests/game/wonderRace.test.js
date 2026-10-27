import { describe, it, expect } from 'vitest';
import { RACE, TRACK, BOOSTS, LOOPS, HOOP, groundY, createKart, stepKart, racerPace, places, coinSpots, inPond } from '../../src/game/wonder/race.js';

const DT = 1 / 60;

describe('Race Planet: the track', () => {
  it('the segments join up with no gaps, from the start to the far end', () => {
    expect(TRACK[0].x0).toBe(0);
    expect(TRACK[TRACK.length - 1].x1).toBe(RACE.w);
    for (let i = 1; i < TRACK.length; i++) expect(TRACK[i].x0).toBe(TRACK[i - 1].x1);
  });

  it('the ground never rises like a wall (it only drops away, off a ramp)', () => {
    for (let x = 1; x < RACE.w - 1; x++) expect(groundY(x - 1) - groundY(x), `at ${x}`).toBeLessThan(3);
  });

  it('loops, boost pads and the finish sit on flat ground', () => {
    for (const lx of LOOPS) expect(groundY(lx - 30)).toBe(groundY(lx + 60));
    for (const [a, b] of BOOSTS) expect(groundY(a)).toBe(groundY(b));
    expect(groundY(RACE.finishX)).toBe(groundY(RACE.podiumX));
  });

  it('coins float above the ground, in reach', () => {
    for (const c of coinSpots()) {
      expect(c.y).toBeLessThan(groundY(c.x));
      expect(groundY(c.x) - c.y).toBeLessThan(110);
    }
  });
});

describe('Race Planet: driving', () => {
  it('holding the gas on the flat reaches top speed; letting go coasts to a stop', () => {
    const k = createKart(100, 'p');
    for (let i = 0; i < 120; i++) stepKart(k, { gas: true }, DT);
    expect(k.vx).toBeCloseTo(RACE.maxSpeed, 0);
    for (let i = 0; i < 400; i++) stepKart(k, {}, DT);
    expect(k.vx).toBe(0);
  });

  it('before the race the start line is a wall, and you drive slowly', () => {
    const k = createKart(100, 'p');
    for (let i = 0; i < 400; i++) stepKart(k, { gas: true }, DT, { free: true });
    expect(k.x).toBeLessThan(RACE.startX);
    expect(k.vx).toBeLessThanOrEqual(RACE.freeMax + 0.01);
  });

  it('rolling hills keep you on the ground', () => {
    const k = createKart(430, 'p');
    k.vx = RACE.maxSpeed;
    let flew = false;
    for (let i = 0; i < 400 && k.x < 1400; i++) if (stepKart(k, { gas: true }, DT).launched) flew = true;
    expect(flew).toBe(false);
  });

  it('a boost then the ramp flies you right over the pond', () => {
    const k = createKart(1400, 'p');
    k.vx = RACE.maxSpeed;
    let launched = 0;
    let landedAt = null;
    for (let i = 0; i < 400 && landedAt === null; i++) {
      const ev = stepKart(k, { gas: true }, DT);
      if (ev.launched) launched = k.x;
      if (ev.landed && launched) landedAt = k.x;
    }
    expect(launched).toBeGreaterThan(1790);
    expect(inPond(landedAt)).toBe(false);
    expect(landedAt).toBeGreaterThan(1950);
  });

  it('without the boost you splash into the pond, and still drive out of it', () => {
    const k = createKart(1640, 'p');
    k.vx = 120;
    for (let i = 0; i < 900 && k.x < 2100; i++) stepKart(k, { gas: true }, DT);
    expect(k.x).toBeGreaterThanOrEqual(2100);
  });

  it('the loop-the-loop goes all the way round and out the other side, fast', () => {
    const k = createKart(LOOPS[0] - 100, 'p');
    k.vx = 60;
    let looped = false;
    let top = Infinity;
    for (let i = 0; i < 300 && k.x < LOOPS[0] + 100; i++) {
      if (stepKart(k, { gas: true }, DT).looped) looped = true;
      top = Math.min(top, k.y);
    }
    expect(looped).toBe(true);
    expect(groundY(LOOPS[0]) - top).toBeGreaterThan(RACE.loopR * 1.8);
    expect(k.onGround).toBe(true);
    expect(k.vx).toBeGreaterThanOrEqual(RACE.maxSpeed - 5);
  });

  it('the boost before the big ramp sends you through the hoop', () => {
    const k = createKart(4100, 'p');
    k.vx = RACE.maxSpeed;
    let hoop = false;
    for (let i = 0; i < 300 && k.x < 4800; i++) if (stepKart(k, { gas: true }, DT).hoop) hoop = true;
    expect(hoop).toBe(true);
    expect(HOOP.x).toBeGreaterThan(4520);
  });

  it('A in the air spins a trick; landing it gives a little boost', () => {
    const k = createKart(1500, 'p');
    k.vx = RACE.maxSpeed;
    let trick = false;
    let boosted = false;
    for (let i = 0; i < 300 && k.x < 2100; i++) {
      const ev = stepKart(k, { gas: true, hop: !k.onGround }, DT);
      if (ev.trick) trick = true;
      if (ev.landed && ev.boosted) boosted = true;
    }
    expect(trick).toBe(true);
    expect(boosted).toBe(true);
  });
});

describe('Race Planet: the race', () => {
  const race = (playerGas) => {
    const me = createKart(RACE.startX - 60, 'p');
    const bots = [0.97, 0.93, 0.89].map((p, i) => ({ k: createKart(RACE.startX - 80 - i * 20, `b${i}`), pace: p }));
    let t = 0;
    while (t < 200 && me.finishT === null) {
      t += DT;
      stepKart(me, { gas: playerGas(t) }, DT);
      for (const b of bots) stepKart(b.k, { gas: true }, DT, { maxMul: racerPace(b.k, b.pace, me.x) });
      for (const k of [me, ...bots.map((b) => b.k)]) if (k.finishT === null && k.x >= RACE.finishX) k.finishT = t;
    }
    return { place: places([me, ...bots.map((b) => b.k)]).get(me), t };
  };

  it('a player who keeps going wins, in about a minute', () => {
    const r = race(() => true);
    expect(r.place).toBe(1);
    expect(r.t).toBeGreaterThan(40);
    expect(r.t).toBeLessThan(90);
  });

  it('a player who stops now and then is still close to the front', () => {
    const r = race((t) => Math.floor(t) % 5 !== 0);
    expect(r.place).toBeLessThanOrEqual(2);
  });

  it('places: finishers by time, then the rest by how far along', () => {
    const a = { x: 9000, finishT: 50 };
    const b = { x: 9000, finishT: 48 };
    const c = { x: 7000, finishT: null };
    const d = { x: 8000, finishT: null };
    const p = places([a, b, c, d]);
    expect([p.get(b), p.get(a), p.get(d), p.get(c)]).toEqual([1, 2, 3, 4]);
  });
});
