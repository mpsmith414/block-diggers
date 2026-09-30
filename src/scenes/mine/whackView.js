// Earth's Mole Fair, in the mine: Whack-a-Mole. Take a toy mallet from the
// stand (two, for co-op): left/right hop you from molehill to molehill, A
// bonks, down puts the mallet back. Rounds last 30 seconds (the bulbs under
// the scoreboard go out one by one); every bonk sends treasure to your
// backpack; a golden mole is worth 3.

import { createWhack, stepWhack, whack, whackReward } from '../../game/whack.js';
import { createEdge } from '../../input/intents.js';
import { earnSticker } from '../common/stickers.js';
import { drawRoom, roomLights, flyOres } from './bonusRoom.js';
import { TILE, PLAYER, WHACK } from '../../tuning.js';

const NONE = {
  busy: () => false, step() {}, update() {}, draw() {}, leave() {}, lights: () => [], framePoints: () => [],
};
const BULBS = 20;

export function createWhackView(scene) {
  const cells = scene.world.molefair;
  if (!cells) return NONE;
  const { room, wall, lamps, inRoom } = drawRoom(scene, cells, { top: 0x2a1a3a, bottom: 0x6a3a2a, stars: 12 });
  const floorY = cells.floor * TILE;
  // bunting across the back wall
  for (let x = room.x0 + 4, i = 0; x < room.x1 - 8; x += 12, i++) {
    const y = floorY - 134 + Math.round(Math.sin((x - room.x0) / 45) * 4);
    wall.fillStyle([0xff5a5a, 0xffe066, 0x5ad0ff, 0x7aff9a][i % 4], 1).fillTriangle(x, y, x + 10, y, x + 5, y + 8);
  }

  // the stand by the door, the five molehills, the scoreboard and its bulbs
  const standX = room.x0 + 30;
  scene.add.image(standX, floorY, 'mallet-stand').setOrigin(0.5, 1).setDepth(3);
  const mallets = [-5, 5].map((dx) => {
    const home = { x: standX + dx, y: floorY - 3, angle: dx * 3 };
    return { home, holder: null, ready: true, s: scene.add.image(home.x, home.y, 'mallet').setOrigin(0.5, 1).setAngle(home.angle).setDepth(4) };
  });
  const holes = Array.from({ length: WHACK.holes }, (_, i) => {
    const x = room.x0 + 76 + i * 40;
    scene.add.image(x, floorY - 1, 'mole-hole').setOrigin(0.5, 1).setDepth(1);
    const mole = scene.add.sprite(x, floorY + 16, 'whack-mole', 0).setOrigin(0.5, 1).setDepth(2);
    scene.add.image(x, floorY + 1, 'mole-mound').setOrigin(0.5, 1).setDepth(3);
    return { x, mole, up: false };
  });
  const boardX = (room.x0 + room.x1) / 2 + 16;
  const boardY = floorY - 118;
  scene.add.image(boardX, boardY, 'whack-board').setOrigin(0.5, 0).setDepth(1);
  const scoreText = scene.add.bitmapText(boardX + 12, boardY + 16, 'pixel', '0').setOrigin(0.5).setScale(2).setDepth(1.1).setTint(0xffe066);
  const bulbs = Array.from({ length: BULBS }, (_, i) => scene.add.image(boardX - 38 + i * 4, boardY + 40, 'pixel').setDisplaySize(3, 3).setDepth(1.1));

  let game = null; // the round being played
  let best = 0;
  let pause = 0; // counting down to the next round
  let waving = 0; // the end-of-round wave
  const players = () => scene.avatars.filter((a) => a && a.whack);

  const moleUp = (h, golden) => {
    h.up = true;
    h.mole.setFrame(golden ? 2 : 0).setAngle(0);
    scene.tweens.killTweensOf(h.mole);
    scene.tweens.add({ targets: h.mole, y: floorY - 3, duration: 140, ease: 'Back.easeOut' });
  };
  const moleDown = (h, delay = 0) => {
    h.up = false;
    scene.tweens.add({ targets: h.mole, y: floorY + 16, duration: 160, delay, ease: 'Quad.easeIn' });
  };

  function takeMallet(a, m) {
    m.holder = a;
    m.ready = false;
    a.whack = { mallet: m, hole: 0, swing: 0, fresh: true };
    a.whackA = createEdge();
    a.whackDown = createEdge();
    a.whackLeft = createEdge();
    a.whackRight = createEdge();
    a.p.vx = 0;
    a.p.vy = 0;
    a.p.mining = null;
    a.p.facing = 1;
    m.s.setDepth(31);
    scene.events.emit('whackOn', a);
    if (!game && !waving) pause = Math.min(pause || 1.2, 1.2);
  }

  function leave(a) {
    if (!a.whack) return;
    const m = a.whack.mallet;
    a.whack = null;
    a.whackArmed = false;
    m.holder = null;
    m.s.setDepth(4);
    scene.tweens.add({ targets: m.s, x: m.home.x, y: m.home.y, angle: m.home.angle, duration: 400, onComplete: () => { m.ready = true; } });
    if (!players().length) {
      // nobody playing: the moles go home
      game = null;
      pause = 0;
      for (const h of holes) if (h.up) moleDown(h);
    }
  }

  function bonk(a) {
    if (!game || game.over) return;
    const h = holes[a.whack.hole];
    const r = whack(game, a.whack.hole);
    if (!r.hit) {
      scene.events.emit('whackMiss');
      scene.effects.chunks(Math.floor(h.x / TILE), cells.floor, 'goo');
      return;
    }
    h.up = false;
    h.mole.setFrame(r.golden ? 3 : 1);
    scene.tweens.add({ targets: h.mole, scaleY: 0.7, duration: 80, yoyo: true });
    moleDown(h, 250);
    scene.effects.sparkle(h.x, floorY - 12, r.golden ? 0xffd84a : 0xffffff, r.golden ? 12 : 6);
    scene.events.emit(r.golden ? 'whackGolden' : 'whackBonk');
    earnSticker(scene, 'whack-mole');
    if (r.golden) earnSticker(scene, 'whack-golden');
    scoreText.setText(String(game.score));
    scene.tweens.add({ targets: scoreText, scale: 2.6, duration: 90, yoyo: true });
    if ((scene.trip.whackPrizes ?? 0) < WHACK.cap) {
      scene.trip.whackPrizes = (scene.trip.whackPrizes ?? 0) + 1;
      flyOres(scene, a, h.x, floorY - 14, whackReward(r.golden));
    }
  }

  function endRound(score) {
    best = Math.max(best, score);
    waving = 2.6;
    pause = 4;
    scene.events.emit('whackEnd');
    scene.effects.confetti(boardX, boardY + 10);
    scene.tweens.add({ targets: scoreText, scale: 3.2, duration: 300, yoyo: true, repeat: 2 });
    if (score >= WHACK.star) earnSticker(scene, 'whack-star');
    // every mole pops up and waves
    holes.forEach((h, i) => scene.time.delayedCall(i * 90, () => moleUp(h, false)));
  }

  return {
    busy: (a) => !!a.whack,

    // Holding a mallet: hop between the molehills, bonk, or put it back.
    step(a, intent, dt) {
      const w = a.whack;
      const pressed = a.whackA(!!intent.jump);
      const down = a.whackDown((intent.moveY ?? 0) > 0.5);
      const left = a.whackLeft((intent.moveX ?? 0) < -0.5);
      const right = a.whackRight((intent.moveX ?? 0) > 0.5);
      if (w.fresh) {
        w.fresh = false;
      } else if (down) {
        leave(a);
        return;
      } else {
        if (left) w.hole = Math.max(0, w.hole - 1);
        if (right) w.hole = Math.min(WHACK.holes - 1, w.hole + 1);
        if (pressed && w.swing <= 0) {
          w.swing = 0.22;
          scene.time.delayedCall(70, () => { if (a.whack === w) bonk(a); });
        }
      }
      w.swing = Math.max(0, w.swing - dt);
      // stand just left of the hill, and hop over to the next one
      const tx = holes[w.hole].x - 14 - PLAYER.w / 2;
      const dx = tx - a.p.x;
      a.p.x += Math.sign(dx) * Math.min(Math.abs(dx), 260 * dt);
      a.p.vx = 0;
      a.p.vy = 0;
      a.p.grounded = true;
      a.p.facing = 1;
      a.p.mining = null;
    },

    update(dt) {
      for (const a of scene.avatars) {
        if (!a || a.bubbling) continue;
        const c = { x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 };
        if (inRoom(c)) earnSticker(scene, 'whack-fair');
        const atStand = Math.abs(c.x - standX) < 12 && a.p.y + PLAYER.h > floorY - 4;
        if (!atStand) a.whackArmed = true;
        if (!a.whack && atStand && a.whackArmed !== false && !a.skate && !a.claw && !scene.goingHome) {
          const m = mallets.find((q) => !q.holder && q.ready);
          if (m) takeMallet(a, m);
        }
      }
      // the round: a short pause, then 30 seconds of moles, then the wave
      if (players().length) {
        if (waving > 0) {
          waving -= dt;
          holes.forEach((h, i) => h.mole.setAngle(Math.sin(scene.time.now / 120 + i) * 12));
          if (waving <= 0) holes.forEach((h) => moleDown(h));
        }
        if (!game || game.over) {
          pause -= dt;
          if (pause <= 0 && waving <= 0) {
            game = createWhack();
            scoreText.setText('0');
            scene.events.emit('whackStart');
          }
        } else {
          for (const ev of stepWhack(game, dt, scene.rng)) {
            if (ev.type === 'pop') {
              moleUp(holes[ev.hole], ev.golden);
              scene.events.emit('whackPop');
            }
            if (ev.type === 'hide' && holes[ev.hole].up) moleDown(holes[ev.hole]);
            if (ev.type === 'end') endRound(ev.score);
          }
        }
      }
      // the timer bulbs: lit for the time left in the round
      const lit = game && !game.over ? Math.ceil((game.time / WHACK.round) * BULBS) : (game ? 0 : BULBS);
      bulbs.forEach((b, i) => b.setTint(i < lit ? (i % 2 ? 0xffe066 : 0xff7eb6) : 0x3a2a4a));
      if (!game && !players().length) scoreText.setText(String(best));
    },

    // the mallet: raised up high, then down with a bonk
    draw(a) {
      const w = a.whack;
      if (!w) return;
      const s = a.sprite;
      const t = w.swing > 0 ? 1 - w.swing / 0.22 : 0;
      const angle = w.swing > 0 ? (t < 0.35 ? -40 + t * 400 : 100 - (t - 0.35) * 200) : -40;
      w.mallet.s.setPosition(s.x + 4, s.y - 6).setAngle(angle);
    },

    leave,

    // while anyone plays, the camera shows the molehills and the scoreboard
    framePoints() {
      if (!players().length) return [];
      return [{ x: room.x0 + 8, y: boardY - 8 }, { x: room.x1 - 8, y: floorY + 4 }];
    },

    lights(view, flicker) {
      return roomLights(room, lamps, view, flicker, [{ x: boardX, y: boardY + 18, r: 3.5 * flicker, glow: 0.12, color: 0xffe066 }]);
    },
  };
}
