// The Moon Skate Park, in the mine: the half pipe, lamps, and a rack with two
// skateboards (one each in co-op). Walk into a board to hop on; left/right
// push and pump, A pops an ollie, A in the air does a random trick (combo
// them!), and down steps off. Landed tricks pop out space gems.

import { createPipe, createSkate, stepSkate } from '../../game/skate.js';
import { drawRoom, roomLights, flyOres } from './bonusRoom.js';
import { createEdge } from '../../input/intents.js';
import { earnSticker } from '../common/stickers.js';
import { TILE, PLAYER, SKATE } from '../../tuning.js';

const HALF = 8; // half a character's height: tricks spin around the middle
const NONE = {
  busy: () => false, step() {}, update() {}, draw() {}, leave() {}, lights: () => [], framePoints: () => [],
};

export function createSkateView(scene) {
  const park = scene.world.skatepark;
  if (!park) return NONE;
  const pipe = createPipe(park.x0 * TILE + SKATE.deck, park.floor * TILE);
  const midX = pipe.x0 + SKATE.R + SKATE.F / 2;
  // the park's back wall: a starry night mural with neon stripes
  const { room, wall: mural, lamps, inRoom } = drawRoom(scene, park, { top: 0x10163a, bottom: 0x2a1850 });
  for (const [c, dy] of [[0xff7eb6, 44], [0x3affe0, 52], [0xffe066, 60]]) {
    mural.lineStyle(2, c, 0.55).beginPath();
    for (let x = room.x0; x <= room.x1; x += 16) mural.lineTo(x, room.y0 + dy + ((x / 16) % 2 ? 6 : -6));
    mural.strokePath();
  }
  mural.lineStyle(2, 0xffe066, 0.7).strokeCircle(room.x0 + 60, room.y0 + 24, 12);
  mural.fillStyle(0x10163a, 1).fillCircle(room.x0 + 66, room.y0 + 20, 11);
  scene.add.image(room.x0, pipe.floor, 'halfpipe').setOrigin(0, 1).setDepth(1);
  scene.add.image(midX, pipe.floor, 'skate-rack').setOrigin(0.5, 1).setDepth(3);
  const boards = [-6, 6].map((dx) => {
    const home = { x: midX + dx, y: pipe.floor - 3, angle: dx < 0 ? -75 : 75 };
    return { home, rider: null, ready: true, s: scene.add.image(home.x, home.y, 'skateboard').setOrigin(0.5, 0.5).setAngle(home.angle).setDepth(4) };
  });

  const center = (a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 });

  function hopOn(a, board) {
    board.rider = a;
    board.ready = false;
    a.board = board;
    a.skate = createSkate(pipe, Math.max(pipe.x0 + 2, Math.min(pipe.x1 - 2, center(a).x)));
    a.skate.fresh = true;
    a.skateJump = createEdge();
    a.skateDown = createEdge();
    a.trailT = 0;
    a.p.vx = 0;
    a.p.vy = 0;
    a.p.mining = null;
    scene.effects.sparkle(a.sprite.x, a.sprite.y - 6, 0x3affe0, 10);
    scene.events.emit('skateOn', a);
    earnSticker(scene, 'skate-board');
  }

  function stepOff(a) {
    if (!a.skate) return;
    const board = a.board;
    a.skate = null;
    a.board = null;
    a.skateArmed = false;
    a.sprite.setAngle(0).setFlipY(false);
    a.p.x = Math.max(pipe.x0 + 1, Math.min(pipe.x1 - PLAYER.w - 1, a.p.x));
    a.p.vx = 0;
    a.p.vy = 0;
    if (board) {
      board.rider = null;
      board.s.setScale(1).setDepth(4);
      // (it rolls back to the rack; only then can it be grabbed again)
      scene.tweens.add({
        targets: board.s, x: board.home.x, y: board.home.y, angle: board.home.angle, duration: 500, ease: 'Quad.easeOut', onComplete: () => { board.ready = true; },
      });
    }
  }

  function landed(a, ev) {
    if (!ev.tricks.length) return;
    scene.events.emit('skateLand', a);
    const x = a.skate.x;
    const y = a.skate.y - 10;
    scene.effects.confetti(x, y);
    scene.effects.sparkle(x, y, 0xffe066, 6 + ev.tricks.length * 3);
    if (ev.tricks.length >= 3) scene.cameras.main.flash(120, 200, 255, 240);
    for (const kind of ev.tricks) earnSticker(scene, `trick-${kind}`);
    // the gems pop up out of the landing and into your backpack
    flyOres(scene, a, x, y, Array(ev.gems).fill('spacegem'));
    scene.trip.skateGems = (scene.trip.skateGems ?? 0) + ev.gems;
  }

  return {
    // Hop on a board, and the park's sticker when you first walk in.
    update() {
      for (const a of scene.avatars) {
        if (!a || a.skate) continue;
        const c = center(a);
        if (inRoom(c)) earnSticker(scene, 'skate-park');
        // step away from the rack before you can grab a board again
        if (Math.abs(c.x - midX) > 22) a.skateArmed = true;
        if (a.skateArmed === false || a.bubbling || scene.goingHome) continue;
        const board = boards.find((b) => !b.rider && b.ready && Math.abs(b.s.x - c.x) < 12 && Math.abs(b.s.y - c.y) < 14);
        if (board) hopOn(a, board);
      }
    },

    // Skating instead of walking: A pops and tricks, down steps off.
    step(a, intent, dt) {
      const sk = a.skate;
      const jump = a.skateJump(!!intent.jump);
      const down = a.skateDown((intent.moveY ?? 0) > 0.5);
      if (sk.fresh) {
        sk.fresh = false; // (a button already held as you hopped on doesn't count)
      } else if (down) {
        stepOff(a);
        return;
      } else {
        const left = Math.max(0, SKATE.gemCap - (scene.trip.skateGems ?? 0));
        for (const ev of stepSkate(sk, pipe, intent, { jump }, dt, scene.rng, left)) {
          if (ev.type === 'air') scene.events.emit('skatePop', a);
          if (ev.type === 'trick') {
            scene.events.emit('skateTrick', a);
            scene.effects.sparkle(sk.x, sk.y - 8, 0xffffff, 5);
          }
          if (ev.type === 'land') landed(a, ev);
        }
      }
      const moving = sk.air ? sk.vx : sk.v * Math.cos(sk.angle);
      if (Math.abs(moving) > 8) a.p.facing = Math.sign(moving);
      a.p.x = sk.x - PLAYER.w / 2;
      a.p.y = sk.y - PLAYER.h - 5;
      a.p.vx = 0;
      a.p.vy = 0;
      a.p.grounded = !sk.air;
      a.p.mining = null;
    },

    // Put the rider on the board, leaning with the pipe (or mid-trick).
    draw(a, time) {
      const sk = a.skate;
      if (!sk || a.bubbling) return;
      const s = a.sprite;
      const b = a.board.s;
      const lean = sk.air ? 0 : sk.angle;
      const nx = Math.sin(lean);
      const ny = -Math.cos(lean);
      // the board sits on the surface; the rider stands on it
      const bx = sk.x + nx * 3;
      const by = sk.y + ny * 3;
      b.setPosition(bx, by).setAngle((lean * 180) / Math.PI).setScale(1, 1).setFlipX(a.p.facing < 0).setDepth(28);
      let fx = sk.x + nx * 5;
      let fy = sk.y + ny * 5;
      let angle = (lean * 180) / Math.PI;
      s.setFrame(0).setFlipY(false);
      const trick = sk.trick;
      if (trick) {
        const p = trick.t / SKATE.trickTime;
        const face = a.p.facing || 1;
        let turn = 0; // (degrees, around the rider's middle)
        if (trick.kind === 'kickflip') {
          b.setScale(1, Math.cos(p * Math.PI * 2));
          fy -= 4;
        } else if (trick.kind === 'spin360') {
          s.setScale(Math.max(0.15, Math.abs(Math.cos(p * Math.PI * 2))) * s.scaleX, s.scaleY);
          if (p > 0.25 && p < 0.75) s.setFlipX(!s.flipX);
          b.setAngle(p * 360);
        } else if (trick.kind === 'superman') {
          turn = -face * 90;
          fy -= 6;
        } else if (trick.kind === 'grab') {
          // tucked up, holding the board out in front
          s.setScale(s.scaleX, s.scaleY * 0.8);
          b.setPosition(fx + face * 5, fy - 5).setAngle(face * -60).setDepth(31);
        } else if (trick.kind === 'handstand') {
          turn = 180;
        } else if (trick.kind === 'backflip') {
          // the board flips round with you, stuck to your feet
          turn = -face * 360 * p;
          const r = (turn * Math.PI) / 180;
          const cx = fx;
          const cy = fy - HALF;
          b.setPosition(cx - (HALF + 2) * Math.sin(r), cy + (HALF + 2) * Math.cos(r)).setAngle(turn);
        }
        if (turn) {
          const r = (turn * Math.PI) / 180;
          fx += -HALF * Math.sin(r);
          fy += -HALF + HALF * Math.cos(r);
          angle = turn;
        }
        // a trail of stars
        a.trailT -= 1 / 60;
        if (a.trailT <= 0) {
          a.trailT = 0.04;
          const st = scene.add.image(fx, fy - HALF, 'pixel').setTint([0xffe066, 0x3affe0, 0xff7eb6][Math.floor(time / 40) % 3])
            .setDisplaySize(2, 2).setDepth(29);
          scene.tweens.add({ targets: st, alpha: 0, scale: 0.2, duration: 450, onComplete: () => st.destroy() });
        }
      }
      s.setPosition(Math.round(fx), Math.round(fy)).setAngle(angle);
    },

    leave: stepOff,
    busy: (a) => !!a.skate,

    // while anyone skates, the camera keeps the whole pipe in view
    framePoints() {
      if (!scene.avatars.some((a) => a && a.skate)) return [];
      return [{ x: pipe.x0 - 8, y: pipe.lipY - 40 }, { x: pipe.x1 + 8, y: pipe.floor + 4 }];
    },

    // the lamps light up the whole park
    lights(view, flicker) {
      return roomLights(room, lamps, view, flicker, [{ x: midX, y: pipe.floor - 20, r: 5 * flicker, glow: 0.1, color: 0x3affe0 }]);
    },
  };
}
