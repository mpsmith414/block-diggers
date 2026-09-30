// The Mars arcade, in the mine: a big claw machine full of prizes. Walk up to
// the joystick to play (one at a time): left/right moves the claw, A drops
// it, down steps away. Whatever it grabs goes down the chute and pops out of
// the prize door, and its treasure flies into your backpack.

import { stockPrizes, createClaw, stepClaw, prizeReward } from '../../game/claw.js';
import { createEdge } from '../../input/intents.js';
import { earnSticker } from '../common/stickers.js';
import { drawRoom, roomLights, flyOres } from './bonusRoom.js';
import { TILE, PLAYER, CLAW } from '../../tuning.js';

const NONE = {
  busy: () => false, step() {}, update() {}, draw() {}, leave() {}, lights: () => [], framePoints: () => [],
};
const W = 144;
const H = 128;
const JOY = 109; // the joystick, from the cabinet's left (px)
const LOOK = {
  ruby: ['ore-ruby', 0, 1], bolt: ['ore-bolt', 0, 1], coin: ['ore-coin', 0, 1], opal: ['ore-opal', 0, 1],
  robot: ['toyrobot', 0, 0.7], martian: ['martian', 0, 0.8], golden: ['claw-golden', 0, 0.8],
};

export function createClawView(scene) {
  const cells = scene.world.arcade;
  if (!cells) return NONE;
  // the back wall: a Martian city at night, with ruins against a red sky
  const { room, wall, lamps, inRoom } = drawRoom(scene, cells, { top: 0x2a0e2a, bottom: 0x6a2a2a });
  wall.fillStyle(0x3a1420, 1);
  for (const [x, w, h] of [[20, 40, 60], [70, 24, 90], [150, 50, 50], [210, 30, 76]]) {
    wall.fillTriangle(room.x0 + x, room.y1, room.x0 + x + w / 2, room.y1 - h, room.x0 + x + w, room.y1);
  }
  wall.fillStyle(0xffd0a0, 0.9).fillCircle(room.x0 + 40, room.y0 + 26, 7).fillCircle(room.x0 + 230, room.y0 + 40, 3);

  const floorY = cells.floor * TILE;
  const ox = Math.round((room.x0 + room.x1) / 2 - W / 2 + 8);
  const oy = floorY - H;
  scene.add.image(ox, oy, 'claw-cabinet').setOrigin(0, 0).setDepth(1);
  const stick = scene.add.image(ox + JOY, oy + 99, 'claw-stick').setOrigin(0.5, 1).setDepth(2);
  const cable = scene.add.graphics().setDepth(2);
  const clawS = scene.add.sprite(0, 0, 'claw', 0).setOrigin(0.5, 1).setDepth(3);

  const claw = createClaw(stockPrizes(scene.rng));
  const sprites = new Map(); // prize → its sprite in the glass
  const sprite = (p) => {
    if (!sprites.has(p)) {
      const [key, frame, scale] = LOOK[p.kind];
      sprites.set(p, scene.add.image(0, 0, key, frame).setOrigin(0.5, 1).setScale(scale).setDepth(2));
    }
    return sprites.get(p);
  };
  // the pile: every other prize sits a little higher, so it looks heaped
  // (`drop`: tumble back down into place instead of jumping there)
  const layout = (drop = null) => {
    [...claw.prizes].sort((m, n) => m.x - n.x).forEach((p, i) => {
      const x = ox + p.x;
      const y = oy + 96 - (i % 2) * 4;
      if (p === drop) scene.tweens.add({ targets: sprite(p), x, y, angle: { from: -30, to: 0 }, duration: 450, ease: 'Bounce.easeOut' });
      else sprite(p).setPosition(x, y);
    });
  };
  layout();

  let owner = null;
  let lastOwner = null;
  let move = 0;
  let drop = false;
  const zone = (a) => {
    const cx = a.p.x + PLAYER.w / 2;
    return Math.abs(cx - (ox + JOY)) < 10 && a.p.y + PLAYER.h > floorY - 4;
  };

  function takeControl(a) {
    owner = a;
    lastOwner = a;
    a.claw = true;
    a.clawA = createEdge();
    a.clawDown = createEdge();
    a.clawFresh = true;
    a.p.x = ox + JOY - PLAYER.w / 2;
    a.p.vx = 0;
    a.p.vy = 0;
    a.p.mining = null;
    scene.events.emit('clawOn', a);
  }

  function leave(a) {
    if (owner !== a) return;
    owner = null;
    a.claw = false;
    a.clawArmed = false;
    move = 0;
  }

  function prizeOut(prize) {
    // down the chute, then out of the prize door
    const s = sprite(prize);
    scene.tweens.add({
      targets: s, x: ox + 19, y: oy + 100, duration: 400, ease: 'Quad.easeIn',
      onComplete: () => {
        s.destroy();
        sprites.delete(prize);
        const x = ox + 20;
        const y = oy + 112;
        const who = owner ?? lastOwner ?? scene.avatars.find(Boolean);
        const { ores, sticker } = prizeReward(prize.kind);
        const pop = scene.add.image(x, y, ...LOOK[prize.kind].slice(0, 2)).setScale(LOOK[prize.kind][2] * 1.6).setDepth(45);
        scene.tweens.add({ targets: pop, y: y - 20, duration: 300, ease: 'Back.easeOut', yoyo: true, hold: 500, onComplete: () => pop.destroy() });
        scene.effects.confetti(x, y - 6);
        scene.effects.sparkle(x, y - 6, prize.kind === 'golden' ? 0xffd84a : 0xffffff, prize.kind === 'golden' ? 16 : 8);
        if (prize.kind === 'golden') scene.cameras.main.flash(200, 255, 230, 140);
        scene.events.emit(prize.kind === 'golden' ? 'clawJackpot' : 'clawPrize');
        if (sticker) earnSticker(scene, sticker);
        if (who) scene.time.delayedCall(500, () => flyOres(scene, who, x, y - 10, ores));
      },
    });
  }

  return {
    busy: (a) => owner === a,

    // At the joystick: remember the stick; A drops the claw; down steps away.
    step(a, intent) {
      const pressed = a.clawA(!!intent.jump);
      const down = a.clawDown((intent.moveY ?? 0) > 0.5);
      a.p.vx = 0;
      a.p.vy = 0;
      a.p.grounded = true;
      a.p.mining = null;
      if (a.clawFresh) {
        a.clawFresh = false; // (a button already held as you walked up doesn't count)
        return;
      }
      if (down) {
        leave(a);
        return;
      }
      move = intent.moveX ?? 0;
      if (pressed) drop = true;
    },

    update(dt) {
      for (const a of scene.avatars) {
        if (!a || a.bubbling) continue;
        if (inRoom({ x: a.p.x, y: a.p.y })) earnSticker(scene, 'claw-machine');
        if (!zone(a)) a.clawArmed = true;
        if (!owner && a.clawArmed !== false && !a.skate && !scene.goingHome && zone(a)) takeControl(a);
      }
      for (const ev of stepClaw(claw, { moveX: owner ? move : 0 }, { drop }, dt, scene.rng)) {
        if (ev.type === 'drop') scene.events.emit('clawDrop');
        if (ev.type === 'grab') scene.events.emit('clawGrab');
        if (ev.type === 'miss') scene.events.emit('clawMiss');
        if (ev.type === 'slip') {
          scene.events.emit('clawSlip');
          layout(ev.prize);
        }
        if (ev.type === 'prize') prizeOut(ev.prize);
      }
      drop = false;
      // the claw, its cable, the stick and whatever it's holding
      const x = ox + claw.x;
      const y = oy + claw.y;
      clawS.setPosition(x, y).setFrame(['close', 'up', 'carry'].includes(claw.phase) && (claw.phase !== 'close' || claw.t > 0.15) ? 1 : 0);
      cable.clear().fillStyle(0xc0c8d8, 1).fillRect(x - 0.5, oy + 20, 1, Math.max(0, y - 14 - (oy + 20)));
      stick.setAngle(owner ? move * 25 : 0);
      if (claw.held) sprite(claw.held).setPosition(x, y + 2);
    },

    draw() {},
    leave,

    // while someone plays, the camera shows the whole machine
    framePoints() {
      if (!owner) return [];
      return [{ x: ox - 12, y: oy - 10 }, { x: ox + W + 12, y: floorY + 4 }];
    },

    lights(view, flicker) {
      return roomLights(room, lamps, view, flicker, [
        { x: ox + W / 2, y: oy + 8, r: 3 * flicker, glow: 0.14, color: 0xff7eb6 },
        { x: ox + 64, y: oy + 60, r: 4 * flicker, glow: 0.08, color: 0x9ff6ff },
      ]);
    },
  };
}
