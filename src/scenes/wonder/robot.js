// Robot Planet: Mega Bot City. Each player climbs into their own Mega Bot,
// a giant robot with their character in the glass dome. Walk into crates and
// scrap to punch them apart; jump, and land with a STOMP that smashes what's
// under you. Conveyor belts carry you, springs throw you up to the girders.
// Walk into a broken robot to fix it: it beeps, turns colourful and marches
// behind you in a parade. Fix all twelve and the Robot Factory opens.

import Phaser from 'phaser';
import { robotLevel, ROBOT, MECH, RB, smash, punchCells, stompCells, beltUnder } from '../../game/wonder/robot.js';
import { moveBody, onFloor, touching } from '../../game/wonder/body.js';
import { createRng } from '../../world/rng.js';
import { bakeTiles } from './kit.js';
import { TILE } from '../../tuning.js';

const T = TILE;
const COLORS = [0xff5a6a, 0x4ab0ff, 0x6ad07a, 0xffd84a, 0xb07ae0, 0xff9a3a];
const GAP = 18; // how far apart the parade marches (in steps of the trail)

export function createRobot(scene) {
  const L = robotLevel();
  const { level } = L;
  const G = ROBOT.ground;
  const GY = G * T;
  const W = level.w * T;
  const H = level.h * T;
  let fixed = 0;

  drawBackdrop(scene, W, GY);
  const FRAME = { [RB.FLOOR]: 0, [RB.UNDER]: 1, [RB.STEEL]: 4, [RB.BELT_R]: 5, [RB.BELT_L]: 5, [RB.GIRDER]: 6, [RB.SPRING]: 0 };
  bakeTiles(scene, level, 'robot-tiles', (n) => FRAME[n] ?? null, 2);
  // crates and scrap are sprites of their own (they get smashed)
  const blocks = new Map();
  for (let y = 0; y < level.h; y++) {
    for (let x = 0; x < level.w; x++) {
      const n = level.get(x, y);
      if (n === RB.CRATE || n === RB.SCRAP) blocks.set(`${x},${y}`, scene.add.image(x * T, y * T, 'robot-tiles', n === RB.CRATE ? 2 : 3).setOrigin(0).setDepth(3));
    }
  }
  const belts = L.belts.map((b) => ({ ...b, strip: scene.add.tileSprite(b.x0 * T, GY, (b.x1 - b.x0 + 1) * T, 6, 'robot-belt').setOrigin(0).setDepth(3).setFlipX(b.dir < 0) }));
  const springs = L.springs.map((x) => ({ x, sprite: scene.add.sprite(x * T + 8, GY + 10, 'robot-spring', 0).setOrigin(0.5, 1).setDepth(4) }));

  // the factory, its door shut
  const fx = L.factory.door * T;
  scene.add.image(fx, GY, 'robot-factory').setOrigin(0.5, 1).setDepth(0);
  const door = scene.add.image(fx, GY - 2, 'robot-door').setOrigin(0.5, 1).setDepth(1);
  const factoryGlow = scene.add.image(fx, GY - 30, 'light').setTint(0xffe066).setScale(2.4).setAlpha(0).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);

  // the broken robots
  const robots = L.robots.map((r, k) => ({
    ...r, color: COLORS[k % COLORS.length], leader: null, index: 0, hop: 0,
    sprite: scene.add.sprite(r.x * T + 8, (r.y + 1) * T, 'robot-bot', 0).setOrigin(0.5, 1).setDepth(26),
  }));
  const sparks = createRng(5);
  let partied = false;
  let party = false;

  // ---------- the Mega Bots ----------

  const spawn = (a) => {
    const at = a.at ?? { x: scene.mod.pad.x + (a.slot ? 22 : -22), y: GY };
    a.b = { x: at.x - MECH.w / 2, y: Math.min(at.y, GY) - MECH.h, w: MECH.w, h: MECH.h, vx: 0, vy: 0, facing: 1, grounded: false };
    a.mech = scene.add.sprite(0, 0, 'robot-mech', 0).setOrigin(0.5, 1).setDepth(30);
    a.glass = scene.add.image(0, 0, 'robot-glass').setOrigin(0.5, 0).setDepth(31);
    a.fist = scene.add.image(0, 0, 'robot-fist').setDepth(29.5).setVisible(false);
    a.sprite.setDepth(29);
    a.trail = [];
    a.line = [];
    a.punchT = 0;
    a.walkT = 0;
  };

  const breakAt = (cells, a) => {
    const broken = smash(level, cells);
    for (const c of broken) {
      const img = blocks.get(`${c.x},${c.y}`);
      if (img) { img.destroy(); blocks.delete(`${c.x},${c.y}`); }
      scene.effects.chunks(c.x, c.y, null, c.n === RB.CRATE ? 0xe8862a : 0x8a8a9a);
      if (Math.random() < 0.5) scene.effects.sparkle(c.x * T + 8, c.y * T + 8, 0xffd84a, 3);
    }
    return broken;
  };

  const punch = (a, dir) => {
    a.punchT = 0.28;
    const cells = punchCells(a.b, dir);
    const broken = breakAt(cells, a);
    if (!broken.length) return;
    scene.events.emit('sfx', 'punch');
    scene.cameras.main.shake(90, 0.004);
    const x0 = a.b.x + a.b.w / 2 + dir * 14;
    const y = a.b.y + 22;
    a.fist.setVisible(true).setPosition(x0, y).setFlipX(dir < 0);
    scene.tweens.add({ targets: a.fist, x: x0 + dir * 18, duration: 80, yoyo: true, onComplete: () => a.fist.setVisible(false) });
  };

  const stomp = (a) => {
    const broken = breakAt(stompCells(a.b), a);
    scene.events.emit('sfx', 'stomp');
    scene.cameras.main.shake(160, broken.length ? 0.01 : 0.005);
    for (let k = 0; k < 6; k++) {
      const d = scene.add.image(a.b.x + a.b.w / 2 + (k - 2.5) * 8, a.b.y + a.b.h - 2, 'smoke').setDepth(32).setScale(0.8);
      scene.tweens.add({ targets: d, x: d.x + (k - 2.5) * 6, scale: 1.8, alpha: 0, duration: 500, onComplete: () => d.destroy() });
    }
    scene.tweens.add({ targets: a.mech, scaleY: 0.86, scaleX: 1.1, duration: 80, yoyo: true });
    if (broken.length) scene.fun();
  };

  const fix = (a, r) => {
    r.leader = a;
    r.index = a.line.length;
    a.line.push(r);
    fixed++;
    scene.events.emit('sfx', 'fixed');
    scene.events.emit('pickup');
    r.sprite.setFrame(1).setTint(r.color);
    scene.tweens.add({ targets: r.sprite, y: r.sprite.y - 16, duration: 200, yoyo: true, ease: 'Quad.easeOut' });
    // a wrench twirls over it
    const wrench = scene.add.image(r.sprite.x, r.sprite.y - 22, 'wonder-bot').setScale(1.4).setDepth(60);
    scene.tweens.add({ targets: wrench, angle: 360, y: wrench.y - 12, alpha: 0, duration: 700, onComplete: () => wrench.destroy() });
    scene.effects.sparkle(r.sprite.x, r.sprite.y - 8, r.color, 10);
  };

  const step = (a, i, e, dt, time) => {
    const b = a.b;
    const wasGrounded = onFloor(level, b, MECH.gravity);
    b.vx = (i.moveX || 0) * MECH.speed;
    if (i.moveX) b.facing = Math.sign(i.moveX);
    if (e.a && wasGrounded) { b.vy = -MECH.jump; scene.events.emit('jump', a); }
    // a belt carries you along
    if (wasGrounded) {
      const belt = beltUnder(level, [{ x: Math.floor((b.x + 4) / T), y: G }, { x: Math.floor((b.x + b.w - 4) / T), y: G }].filter(() => b.y + b.h >= GY - 1));
      b.x += belt * MECH.belt * dt;
    }
    const out = moveBody(b, level, dt, { gravity: MECH.gravity, maxFall: MECH.maxFall });
    if (out.floor) {
      if (out.floor.some((c) => level.get(c.x, c.y) === RB.SPRING)) {
        b.vy = -MECH.spring;
        scene.events.emit('sfx', 'boing');
        const sp = springs.find((s) => out.floor.some((c) => c.x === s.x));
        if (sp) { sp.sprite.setFrame(1); scene.time.delayedCall(180, () => sp.sprite.setFrame(0)); }
      } else if (out.impact >= MECH.stomp) stomp(a);
    }
    // pushing into a wall: punch it
    a.punchT = Math.max(0, a.punchT - dt);
    const wall = out.right ?? out.left;
    if (wall && i.moveX && a.punchT <= 0 && !a.hidden) punch(a, out.right ? 1 : -1);
    b.grounded = onFloor(level, b, MECH.gravity);
    // fix a broken robot by walking into it
    if (!a.hidden) {
      for (const r of robots) {
        if (!r.leader && touching(b, { x: r.x * T + 2, y: r.y * T + 2, w: 12, h: 14 })) fix(a, r);
      }
    }
    // the trail the parade follows
    const feet = { x: b.x + b.w / 2, y: b.y + b.h, f: b.facing };
    const last = a.trail[a.trail.length - 1];
    if (!last || Math.hypot(last.x - feet.x, last.y - feet.y) > 1.5) {
      a.trail.push(feet);
      if (a.trail.length > GAP * (ROBOT.need + 2)) a.trail.shift();
    }
    drawMech(a, dt, time);
  };

  const drawMech = (a, dt, time) => {
    const b = a.b;
    const x = Math.round(b.x + b.w / 2);
    const y = Math.round(b.y + b.h);
    let frame = 0;
    if (!b.grounded) frame = 3;
    else if (b.vx) {
      const was = Math.floor(a.walkT * 4) % 2;
      a.walkT += dt;
      frame = 1 + (Math.floor(a.walkT * 4) % 2);
      if (Math.floor(a.walkT * 4) % 2 !== was) { scene.cameras.main.shake(40, 0.0015); }
    }
    a.mech.setFrame(frame).setPosition(x, y).setFlipX(b.facing < 0).setVisible(!a.hidden);
    a.glass.setPosition(x, y - 56).setVisible(!a.hidden);
    // your character, sitting in the dome
    a.sprite.setPosition(x, y - 37).setFlipX(b.facing < 0).setFrame(b.vx && b.grounded ? 1 + (Math.floor(time / 160) % 2) : 0).setScale(1).setVisible(!a.hidden);
  };

  // ---------- the world ----------

  const update = (dt, time) => {
    for (const bt of belts) bt.strip.tilePositionX -= bt.dir * MECH.belt * dt;
    // the parade: each fixed robot follows the trail behind its Mega Bot
    for (const r of robots) {
      if (!r.leader) {
        if (sparks.next() < dt * 1.2) scene.effects.sparkle(r.sprite.x + sparks.int(-5, 5), r.sprite.y - 10, 0xffe066, 1);
        continue;
      }
      const trail = r.leader.trail;
      const p = trail[Math.max(0, trail.length - 1 - (r.index + 1) * GAP)] ?? trail[0];
      if (!p) continue;
      const moving = Math.abs(r.sprite.x - p.x) > 0.3;
      r.sprite.setPosition(p.x - p.f * 6, p.y - (party ? Math.abs(Math.sin(time / 150 + r.index)) * 10 : 0));
      r.sprite.setFlipX(p.f < 0).setVisible(!r.leader.hidden || party);
      r.sprite.setFrame(moving || party ? 1 + (Math.floor(time / 150 + r.index) % 2) : 1);
    }
  };

  // all twelve fixed: the factory lights up and its door slides open
  const ready = () => {
    scene.time.delayedCall(700, () => {
      scene.events.emit('sfx', 'whirr');
      scene.tweens.add({ targets: door, scaleY: 0.05, duration: 1200, ease: 'Cubic.easeInOut' });
      scene.tweens.add({ targets: factoryGlow, alpha: 0.55, duration: 600, yoyo: true, repeat: -1, hold: 300 });
    });
    return { x: fx, y: GY - 70 };
  };

  // in through the factory door: the parade dances, the Golden Mega Bot
  const checkParty = () => {
    if (partied || !scene.goalDone) return;
    const a = scene.avatars.find((v) => v && !v.hidden && v.b.grounded && Math.abs(v.b.x + v.b.w / 2 - fx) < 24);
    if (!a) return;
    partied = true;
    party = true;
    scene.events.emit('sfx', 'fixed');
    scene.prizeParty(fx, GY - 50, { done: () => { party = false; } });
  };

  return {
    world: { w: W, h: H },
    pad: { x: L.pad.x * T + 8, y: GY },
    zoom: [1.0, 1.35],
    lead: () => ({ x: 0, y: -36 }),
    goal: () => ({ have: fixed, need: ROBOT.need }),
    spawn,
    step,
    update: (dt, time) => { update(dt, time); checkParty(); },
    focus: (a) => ({ x: a.b.x + a.b.w / 2, y: a.b.y + a.b.h - 20 }),
    place: (a, x, y) => { a.b.x = x - a.b.w / 2; a.b.y = Math.min(y, GY) - a.b.h; a.b.vx = 0; a.b.vy = 0; a.trail.length = 0; },
    onFoot: (a) => a.b.grounded,
    ready,
    cheer: (a) => { a.b.vy = -MECH.jump * 0.7; },
  };
}

// A pale steel-blue sky, a giant gear turning slowly, the far-off city.
function drawBackdrop(scene, W, GY) {
  const g = scene.add.graphics().setDepth(-30);
  g.fillGradientStyle(0x6a9ad8, 0x6a9ad8, 0xc8dcf0, 0xc8dcf0, 1);
  g.fillRect(0, 0, W, GY + 8);
  const gear = scene.add.image(260, 70, 'robot-gear').setScrollFactor(0.15, 0.3).setDepth(-29).setScale(2.2);
  scene.tweens.add({ targets: gear, angle: 360, duration: 30000, repeat: -1 });
  const gear2 = scene.add.image(420, 110, 'robot-gear').setScrollFactor(0.15, 0.3).setDepth(-29).setScale(1.2);
  scene.tweens.add({ targets: gear2, angle: -360, duration: 16000, repeat: -1 });
  for (let x = 0; x < W * 0.5 + 600; x += 128) scene.add.image(x, GY + 4, 'robot-skyline').setOrigin(0, 1).setScrollFactor(0.5, 1).setDepth(-28);
  // blinking lights on the far towers
  for (let k = 0; k < 18; k++) {
    const l = scene.add.image(k * 90 + 40, GY - 60 - (k % 4) * 14, 'pixel').setScrollFactor(0.5, 1).setDepth(-27).setTint(0xff5a6a).setDisplaySize(2, 2);
    scene.tweens.add({ targets: l, alpha: 0.1, duration: 500 + (k % 5) * 200, yoyo: true, repeat: -1 });
  }
}
