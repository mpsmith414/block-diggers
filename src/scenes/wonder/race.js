// Race Planet: Rocket Kart Rally. Everyone has a kart with their character
// in it. Drive up to the start line and the racers line up: 3, 2, 1, GO!
// Hold right to go, left to slow down, A to hop (and A again in the air to
// spin a trick). Boost pads, a jump over the pond, two loop-the-loops, a hoop
// to fly through, coins along the way. The penguin, the alien and the
// martian race too, staying close. At the finish: the podium, every time,
// and first place wins the Golden Cup. A races again; hold B for the rocket.

import Phaser from 'phaser';
import { RACE, TRACK, BOOSTS, LOOPS, HOOP, TUNNEL, groundY, createKart, stepKart, racerPace, places, coinSpots } from '../../game/wonder/race.js';
import { KART_COLORS } from '../../art/wonder/race.js';
import { createPickups } from './kit.js';

const RACERS = [
  { key: 'penguin', pace: 0.97, color: 1 },
  { key: 'alien', pace: 0.93, color: 2 },
  { key: 'martian', pace: 0.89, color: 4 },
];
const GRID = [40, 70, 100, 130, 160];
const PAD_X = 80;

export function createRace(scene) {
  const W = RACE.w;
  const H = RACE.h;
  drawWorld(scene);

  let state = 'free'; // free → count → race → done
  let raceT = 0;
  let bestPlace = 1;
  let coins = 0;
  let pickups = null;
  let doneAt = null;
  let raceId = 0; // (a countdown that was called off doesn't start the race)
  const countText = scene.add.bitmapText(0, 0, 'pixel', '').setOrigin(0.5).setDepth(95).setTint(0xffe066).setVisible(false);
  const racePrompt = scene.add.image(0, 0, 'btn-a').setScale(1.5).setDepth(75).setVisible(false);

  const kartSprite = (color) => scene.add.sprite(0, 0, 'race-kart', color * 2).setOrigin(0.5, 1).setDepth(30);
  const racers = RACERS.map((r, i) => {
    const k = createKart(RACE.startX - GRID[i + 2], r.key);
    return { ...r, k, kart: kartSprite(r.color), rider: scene.add.image(0, 0, r.key, 0).setOrigin(0.5, 1).setDepth(29.5) };
  });

  const resetCoins = () => {
    if (pickups) for (const p of pickups.list) if (!p.taken) p.img.destroy();
    pickups = createPickups(scene, coinSpots().map((c) => ({ x: c.x, y: c.y, key: 'wonder-coin' })), { size: 14 });
  };
  resetCoins();

  // ---------- the drivers ----------

  const humans = () => scene.avatars.filter((a) => a && !a.hidden);

  const spawn = (a) => {
    const x = a.at?.x ?? PAD_X + (a.slot ? 18 : -18);
    a.k = createKart(Math.min(x, RACE.startX - 30), `p${a.slot}`);
    a.kart = kartSprite(a.slot ? 3 : 0);
    a.sprite.setDepth(29.5);
    if (state !== 'free') {
      // joining mid-race: start from the back of the pack
      const others = humans().filter((o) => o !== a && o.k);
      if (others.length) { a.k.x = Math.min(...others.map((o) => o.k.x)); a.k.y = groundY(a.k.x); }
    }
  };

  // everyone onto the grid, then the countdown
  const lineUp = () => {
    state = 'count';
    const id = ++raceId;
    raceT = 0;
    doneAt = null;
    coins = 0;
    resetCoins();
    const all = [...humans().map((a) => a.k), ...racers.map((r) => r.k)];
    all.forEach((k, i) => Object.assign(k, createKart(RACE.startX - GRID[i % GRID.length], k.who)));
    for (const r of racers) r.k.who = r.key;
    ['3', '2', '1', 'GO'].forEach((n, i) => scene.time.delayedCall(400 + i * 800, () => {
      if (id !== raceId || state !== 'count') return;
      countText.setText(n === 'GO' ? 'GO!' : n).setScale(8).setAlpha(1).setVisible(true);
      scene.tweens.add({ targets: countText, scale: 11, alpha: 0, duration: 700, ease: 'Quad.easeOut' });
      scene.events.emit('sfx', n === 'GO' ? 'horn' : 'beep');
      if (n === 'GO') state = 'race';
    }));
  };

  const finish = () => {
    state = 'done';
    const order = places([...humans().map((a) => a.k), ...racers.map((r) => r.k)]);
    bestPlace = Math.min(...humans().map((a) => order.get(a.k)));
    // the podium: the top three stand on it
    const top = [...order.entries()].sort((p, q) => p[1] - q[1]).slice(0, 3);
    const spots = [{ x: RACE.podiumX, y: 4 }, { x: RACE.podiumX - 38, y: 16 }, { x: RACE.podiumX + 38, y: 24 }];
    const gy = groundY(RACE.podiumX);
    top.forEach(([k], i) => Object.assign(k, { x: spots[i].x, y: gy - 40 + spots[i].y, vx: 0, vy: 0, onGround: true, angle: 0, boostT: 0, parked: true }));
    for (const [k, p] of order) if (p > 3) Object.assign(k, { x: RACE.podiumX + 70 + p * 20, y: groundY(RACE.podiumX + 70 + p * 20), vx: 0, parked: true });
    if (bestPlace === 1) scene.prizeParty(RACE.podiumX, gy - 44);
    else {
      scene.events.emit('party');
      for (let k = 0; k < 4; k++) scene.time.delayedCall(k * 250, () => scene.effects.confetti(RACE.podiumX + (k - 1.5) * 30, gy - 60));
    }
  };

  const fx = (a, ev, k) => {
    if (ev.launched) scene.events.emit('sfx', 'jump');
    if (ev.boosted) {
      scene.events.emit('sfx', 'vroom');
      for (let i = 0; i < 6; i++) scene.time.delayedCall(i * 60, () => scene.effects.sparkle(k.x - 14, k.y - 6, 0xffb04a, 2));
    }
    if (ev.landed) for (let i = 0; i < 3; i++) scene.effects.sparkle(k.x - 6 + i * 6, k.y - 1, 0xd8c8b0, 1);
    if (ev.trick) scene.events.emit('sfx', 'trick');
    if (ev.splash) scene.events.emit('sfx', 'splash');
    if (ev.looped && a) { scene.events.emit('sfx', 'whoosh'); scene.fun(); }
    if (ev.hoop && a && !k.hooped) { k.hooped = true; scene.events.emit('sfx', 'chime', 5); scene.effects.sparkle(HOOP.x, HOOP.y, 0xffe066, 14); }
  };

  const step = (a, i, e, dt) => {
    const k = a.k;
    if (state === 'done' && !scene.partying && e.a && !a.hidden) { lineUp(); return; }
    if (state === 'count' || k.parked) { drawKart(a.kart, a.sprite, k, scene.time.now); return; }
    // a player left far behind gets a push to catch up
    const lead = Math.max(...humans().map((o) => o.k.x));
    const maxMul = state === 'race' && lead - k.x > 300 ? RACE.catchUp : 1;
    const input = { gas: (i.moveX || 0) > 0.3, brake: (i.moveX || 0) < -0.3, hop: !!e.a };
    const ev = stepKart(k, a.hidden ? {} : input, dt, { maxMul, free: state !== 'race' });
    fx(a, ev, k);
    if (input.hop && k.onGround === false && ev.launched) scene.events.emit('jump', a);
    if (state === 'free' && k.x >= RACE.startX - 12 && !a.hidden) lineUp();
    if (state === 'race') {
      for (const p of pickups.take({ x: k.x - 10, y: k.y - 18, w: 20, h: 16 })) { coins++; k.coins++; scene.events.emit('pickup'); scene.effects.sparkle(p.x, p.y, 0xffd84a, 3); }
      if (k.finishT === null && k.x >= RACE.finishX) {
        k.finishT = raceT;
        k.parked = true;
        scene.events.emit('fanfare');
        scene.effects.confetti(k.x, k.y - 30);
      }
    }
    drawKart(a.kart, a.sprite, k, scene.time.now);
    a.kart.setVisible(!a.hidden);
    a.sprite.setVisible(!a.hidden);
  };

  const update = (dt, time) => {
    const hs = humans();
    if (state === 'race') {
      raceT += dt;
      const nearest = (x) => hs.reduce((best, a) => (Math.abs(a.k.x - x) < Math.abs(best - x) ? a.k.x : best), hs[0]?.k.x ?? x);
      for (const r of racers) {
        if (!r.k.parked) {
          const ev = stepKart(r.k, { gas: true }, dt, { maxMul: racerPace(r.k, r.pace, nearest(r.k.x)) });
          if (ev.boosted) scene.effects.sparkle(r.k.x - 14, r.k.y - 6, 0xffb04a, 2);
          if (r.k.finishT === null && r.k.x >= RACE.finishX) { r.k.finishT = raceT; r.k.parked = true; }
        }
      }
      const order = places([...hs.map((a) => a.k), ...racers.map((r) => r.k)]);
      bestPlace = Math.min(...hs.map((a) => order.get(a.k)));
      // the race is over when every player is home (or a while after the first)
      if (hs.some((a) => a.k.finishT !== null) && doneAt === null) doneAt = raceT;
      if (hs.length && (hs.every((a) => a.k.finishT !== null) || (doneAt !== null && raceT - doneAt > 10))) {
        for (const a of hs) if (a.k.finishT === null) a.k.finishT = raceT + 1;
        const id = raceId;
        scene.time.delayedCall(1200, () => { if (id === raceId) finish(); });
        state = 'finishing';
      }
    }
    for (const r of racers) drawKart(r.kart, r.rider, r.k, time, true);
    // the countdown sits over the start; the A prompt says "race again"
    const cam = scene.cameras.main;
    countText.setPosition(cam.midPoint.x, cam.midPoint.y - 30);
    const again = state === 'done' && !scene.partying;
    racePrompt.setVisible(again);
    if (again) racePrompt.setPosition(RACE.podiumX, groundY(RACE.podiumX) - 92 + Math.sin(time / 200) * 2);
  };

  return {
    world: { w: W, h: H },
    pad: { x: PAD_X, y: groundY(PAD_X) },
    zoom: [0.95, 1.3],
    regroup: false,
    lead: () => ({ x: state === 'race' ? 60 : 0, y: -30 }),
    goal: () => ({ place: bestPlace, coins }),
    spawn,
    step,
    update,
    focus: (a) => ({ x: a.k.x, y: a.k.y - 12 }),
    // (hold B: back to the rocket, and the race is off)
    place: (a, x) => {
      Object.assign(a.k, createKart(Math.min(x, RACE.startX - 30), a.k.who));
      if (state !== 'free') {
        state = 'free';
        raceId++;
        countText.setVisible(false);
        for (const h of humans()) if (h !== a) Object.assign(h.k, createKart(PAD_X + (h.slot ? 18 : -18), h.k.who));
        racers.forEach((r, i) => Object.assign(r.k, createKart(RACE.startX - GRID[i + 2], r.key)));
      }
    },
    onFoot: (a) => (state === 'free' || state === 'done') && Math.abs(a.k.vx) < 20 && a.k.onGround,
    cheer: (a) => { a.k.spin = 0.001; },
  };
}

// A kart and whoever's driving it, tilted with the ground (or the loop).
function drawKart(kart, rider, k, time, racer = false) {
  const moving = Math.abs(k.vx) > 5;
  const color = Math.floor(Number(kart.frame.name) / 2);
  kart.setFrame(color * 2 + (moving && Math.floor(time / (k.vx > 150 ? 60 : 120)) % 2)).setPosition(Math.round(k.x), Math.round(k.y)).setAngle(k.angle);
  const a = (k.angle * Math.PI) / 180;
  // the seat is 10px back and 8px up from the kart's feet
  const sx = -2;
  const sy = -8;
  rider.setPosition(Math.round(k.x + sx * Math.cos(a) - sy * Math.sin(a)), Math.round(k.y + sx * Math.sin(a) + sy * Math.cos(a))).setAngle(k.angle);
  if (racer) rider.setFrame(0);
  else rider.setFrame(0).setFlipX(false).setScale(1);
}

// The sky, far hills, the track's ground (grass over earth), the pond, the
// tunnel, the loops, the hoop, the boost pads, the banners and the crowd.
function drawWorld(scene) {
  const W = RACE.w;
  const H = RACE.h;
  const g = scene.add.graphics().setDepth(-30);
  g.fillGradientStyle(0x5ab0ff, 0x5ab0ff, 0xc8ecff, 0xc8ecff, 1);
  g.fillRect(0, 0, W, H);
  const hills = scene.add.graphics().setScrollFactor(0.4, 1).setDepth(-29);
  hills.fillStyle(0x8ad08a, 1);
  for (let x = -60; x < W * 0.4 + 600; x += 110) hills.fillCircle(x, 420, 70 + ((x * 13) % 40));
  hills.fillStyle(0xb8e0f8, 1);
  for (let x = 0; x < W * 0.4 + 600; x += 260) hills.fillTriangle(x, 380, x + 90, 250 + ((x * 7) % 50), x + 180, 380);
  scene.add.image(380, 60, 'light').setScrollFactor(0.1, 1).setTint(0xfff2a0).setScale(1.6).setDepth(-29);
  const clouds = scene.add.graphics().setScrollFactor(0.25, 1).setDepth(-29);
  clouds.fillStyle(0xffffff, 0.9);
  for (let x = 30; x < W * 0.25 + 600; x += 190) clouds.fillRoundedRect(x, 50 + (x % 4) * 14, 70, 14, 7).fillRoundedRect(x + 18, 40 + (x % 4) * 14, 34, 14, 7);

  // trees beside the track (behind it)
  for (let x = 60; x < W; x += 230 + ((x * 7) % 120)) {
    if (x > TUNNEL[0] - 40 && x < TUNNEL[1] + 40) continue;
    scene.add.image(x, groundY(x) + 4, 'race-tree').setOrigin(0.5, 1).setDepth(-5).setScale(0.9 + ((x * 3) % 5) / 10);
  }
  // the ground, in chunks: grass on top, earth below, a road stripe
  for (let x0 = 0; x0 < W; x0 += 480) {
    const gr = scene.add.graphics().setDepth(5);
    const pts = [];
    for (let x = x0; x <= Math.min(W, x0 + 480); x += 4) pts.push({ x, y: groundY(x) });
    gr.fillStyle(0x8a5a34, 1);
    gr.beginPath();
    gr.moveTo(pts[0].x, H);
    for (const p of pts) gr.lineTo(p.x, p.y);
    gr.lineTo(pts[pts.length - 1].x, H);
    gr.closePath();
    gr.fillPath();
    for (const p of pts) {
      gr.fillStyle(0x5aa63c, 1).fillRect(p.x, p.y, 4, 7);
      gr.fillStyle(0x7cc95a, 1).fillRect(p.x, p.y, 4, 2);
      if (p.x % 48 === 0) gr.fillStyle(0x6a4224, 1).fillRect(p.x + 1, p.y + 16 + (p.x % 96 ? 8 : 0), 3, 3);
    }
  }
  // the pond
  const pond = TRACK.find((s) => s.shape === 'pond');
  const water = scene.add.graphics().setDepth(6);
  water.fillStyle(0x4ab0ff, 0.75).fillRect(pond.x0, pond.y - 2, pond.x1 - pond.x0, pond.depth + 4);
  water.fillStyle(0xbfe8ff, 0.9).fillRect(pond.x0, pond.y - 2, pond.x1 - pond.x0, 2);
  // the tunnel: a hill over the road, dark inside
  const tun = scene.add.graphics().setDepth(40);
  const ty = groundY(TUNNEL[0]);
  tun.fillStyle(0x6a6a7a, 1).fillRect(TUNNEL[0], ty - 70, TUNNEL[1] - TUNNEL[0], 24);
  tun.fillStyle(0x5aa63c, 1).fillRect(TUNNEL[0], ty - 76, TUNNEL[1] - TUNNEL[0], 8);
  for (let x = TUNNEL[0]; x < TUNNEL[1]; x += 40) tun.fillStyle(0xffe066, 0.9).fillRect(x + 18, ty - 47, 4, 3);
  const inside = scene.add.graphics().setDepth(-4);
  inside.fillStyle(0x3a3a4a, 1).fillRect(TUNNEL[0], ty - 46, TUNNEL[1] - TUNNEL[0], 46);
  for (const x of TUNNEL) tun.fillStyle(0x4a4a5a, 1).fillRect(x - 6, ty - 76, 12, 76);
  // the loops: a ring of track standing up (drawn over the karts' back half)
  for (const lx of LOOPS) {
    const cy = groundY(lx) - RACE.loopR;
    const ring = scene.add.graphics().setDepth(4);
    ring.lineStyle(10, 0x6a6a7a, 1).strokeCircle(lx + 12, cy, RACE.loopR + 6);
    ring.lineStyle(2, 0xffffff, 0.7).strokeCircle(lx + 12, cy, RACE.loopR + 2);
    ring.fillStyle(0x4a4a5a, 1).fillRect(lx + 8, cy + RACE.loopR - 2, 8, 10);
  }
  // the hoop, the boost pads
  scene.add.image(HOOP.x, HOOP.y + 32, 'race-hoop').setOrigin(0.5, 1).setDepth(31);
  for (const [a, b] of BOOSTS) {
    const pad = scene.add.image((a + b) / 2, groundY(a) + 1, 'race-boost').setOrigin(0.5, 1).setDepth(6).setDisplaySize(b - a, 6);
    scene.tweens.add({ targets: pad, alpha: 0.6, duration: 300, yoyo: true, repeat: -1 });
  }
  // the start, the finish, the crowd and the podium
  scene.add.image(RACE.startX, groundY(RACE.startX) + 2, 'race-start').setOrigin(0.5, 1).setDepth(-3);
  scene.add.image(RACE.finishX, groundY(RACE.finishX) + 2, 'race-finish').setOrigin(0.5, 1).setDepth(-3);
  for (const x of [RACE.finishX - 260, RACE.finishX - 130, RACE.finishX + 120]) {
    const crowd = scene.add.image(x, groundY(x) + 2, 'race-crowd').setOrigin(0.5, 1).setDepth(-3);
    scene.tweens.add({ targets: crowd, y: crowd.y - 2, duration: 220, yoyo: true, repeat: -1 });
  }
  scene.add.image(RACE.podiumX, groundY(RACE.podiumX) + 1, 'race-podium').setOrigin(0.5, 1).setDepth(7);
}
