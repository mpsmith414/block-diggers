// The Sun's Launch Deck, in the mine: the Firework Launcher. Balloons float up
// from below; jump on one of the five launch pads to send a firework rocket
// straight up. A rocket that hits a balloon bursts it into a firework, and
// the burst pops the balloons close by too (chain reactions!). Rounds last 30
// seconds (the bulbs under the scoreboard go out one by one); every pop sends
// treasure to whoever launched it.

import { createShow, stepShow, launch, fireworkReward } from '../../game/fireworks.js';
import { BALLOON_COLORS } from '../../art/fireworks.js';
import { earnSticker } from '../common/stickers.js';
import { drawRoom, roomLights, flyOres } from './bonusRoom.js';
import { TILE, PLAYER, FIREWORKS } from '../../tuning.js';

const NONE = {
  busy: () => false, step() {}, update() {}, draw() {}, leave() {}, lights: () => [], framePoints: () => [], occupied: () => false, contains: () => false,
};
const BULBS = 10; // (big enough to read from the sofa)
const FRAME = { red: 0, blue: 1, green: 2, pink: 3, gold: 4 };
const hex = (c) => parseInt(c.slice(1), 16);

export function createFireworksView(scene) {
  const cells = scene.world.deck;
  if (!cells) return NONE;
  const { room, wall, lamps, inRoom } = drawRoom(scene, cells, { top: 0x0a0624, bottom: 0x3a1a4a, stars: 40 });
  const floorY = cells.floor * TILE;
  // a golden stage along the floor, with a glow behind it
  wall.fillStyle(0xff9a2a, 0.25).fillEllipse((room.x0 + room.x1) / 2, floorY, room.x1 - room.x0, 60);

  const pads = [0, 1, 2, 3, 4].map((i) => room.x0 + 56 + i * 44);
  const padSprites = pads.map((x) => scene.add.image(x, floorY + 1, 'fw-pad').setOrigin(0.5, 1).setScale(1.3).setDepth(3));
  const boardX = (room.x0 + room.x1) / 2;
  const boardY = room.y0 + 14;
  scene.add.image(boardX, boardY, 'fw-board').setOrigin(0.5, 0).setDepth(1);
  const scoreText = scene.add.bitmapText(boardX + 12, boardY + 16, 'pixel', '0').setOrigin(0.5).setScale(2).setDepth(1.1).setTint(0xffe066);
  const bulbs = Array.from({ length: BULBS }, (_, i) => scene.add.image(boardX - 35 + i * 8, boardY + 40, 'pixel').setDisplaySize(6, 6).setDepth(1.1));
  const topY = boardY + 50; // rockets burst here if they hit nothing

  let game = null;
  let best = 0;
  let pause = 1.5;
  const balloonSprites = new Map();
  const rocketSprites = new Map();
  const here = () => scene.avatars.filter((a) => a && !a.bubbling && inRoom({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 }));
  const launchers = new Map(); // pad → who launched its last rocket

  // jumping on a pad launches a rocket from it
  const onJump = (a) => {
    if (!game || game.over) return;
    const cx = a.p.x + PLAYER.w / 2;
    const i = pads.findIndex((x) => Math.abs(x - cx) < 11);
    if (i < 0 || a.p.y + PLAYER.h < floorY - 12) return;
    const r = launch(game, i);
    if (!r) return;
    launchers.set(i, a);
    rocketSprites.set(r, scene.add.image(r.x, r.y, 'fw-rocket').setOrigin(0.5, 0).setScale(1.3).setDepth(8));
    scene.tweens.add({ targets: padSprites[i], scaleY: 0.8, duration: 80, yoyo: true });
    scene.effects.sparkle(r.x, floorY - 4, 0xffb030, 6);
    scene.events.emit('fwLaunch');
    earnSticker(scene, 'fw-deck');
  };
  scene.events.on('jump', onJump);
  scene.events.once('shutdown', () => scene.events.off('jump', onJump));

  // a burst of coloured sparks (bigger for a chain)
  function burst(x, y, color, size) {
    for (let k = 0; k < 12 + size * 4; k++) {
      const ang = (k / (12 + size * 4)) * Math.PI * 2;
      const p = scene.add.image(x, y, 'pixel').setTint(k % 3 ? color : 0xffffff).setDisplaySize(3, 3).setDepth(45);
      const r = 28 + size * 8;
      scene.tweens.add({ targets: p, x: x + Math.cos(ang) * r, y: y + Math.sin(ang) * r + 8, alpha: 0, duration: 800, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    }
  }

  function popped(ev) {
    const b = ev.balloon;
    balloonSprites.get(b)?.destroy();
    balloonSprites.delete(b);
    burst(b.x, b.y - 8, hex(BALLOON_COLORS[b.kind][0]), ev.chain);
    scene.events.emit(ev.chain > 1 ? 'fwChain' : 'fwPop');
    earnSticker(scene, 'fw-pop');
    if (b.kind === 'gold') earnSticker(scene, 'fw-golden');
    if (ev.chain >= 3) {
      earnSticker(scene, 'fw-chain');
      scene.cameras.main.flash(120, 255, 230, 180);
    }
    scoreText.setText(String(game.score));
    scene.tweens.add({ targets: scoreText, scale: 2.6, duration: 90, yoyo: true });
    const who = launchers.get(ev.pad) ?? here()[0];
    if (who && (scene.trip.fwPrizes ?? 0) < FIREWORKS.cap) {
      scene.trip.fwPrizes = (scene.trip.fwPrizes ?? 0) + 1;
      flyOres(scene, who, b.x, b.y - 8, fireworkReward(b.kind));
    }
  }

  function endRound(score) {
    best = Math.max(best, score);
    pause = 4;
    scene.events.emit('fwEnd');
    if (score >= FIREWORKS.star) earnSticker(scene, 'fw-star');
    // a finale: fireworks all across the sky
    for (let i = 0; i < 6; i++) {
      scene.time.delayedCall(i * 250, () => {
        const x = room.x0 + 30 + ((i * 53) % (room.x1 - room.x0 - 60));
        burst(x, topY + 20 + (i % 3) * 16, [0xff5a5a, 0x5aa8ff, 0x5ae07a, 0xffd84a, 0xff8ad0][i % 5], 2);
        scene.events.emit('fwPop');
      });
    }
    scene.tweens.add({ targets: scoreText, scale: 3.2, duration: 300, yoyo: true, repeat: 2 });
  }

  return {
    // is anyone in the room? (the bonus rooms play the arcade tune)
    occupied: () => scene.avatars.some((a) => a && inRoom({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 })),
    contains: (a) => inRoom({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 }),
    busy: () => false,
    step() {},

    update(dt) {
      const players = here();
      if (!players.length) {
        if (game) {
          for (const s of [...balloonSprites.values(), ...rocketSprites.values()]) s.destroy();
          balloonSprites.clear();
          rocketSprites.clear();
          game = null;
          pause = 1.5;
        }
      } else if (!game || (game.over && !game.balloons.length && !game.rockets.length)) {
        pause -= dt;
        if (pause <= 0) {
          game = createShow(room.x0, room.x1, topY, floorY, pads);
          scoreText.setText('0');
          scene.events.emit('fwStart');
        }
      }
      if (game) {
        for (const ev of stepShow(game, dt, scene.rng)) {
          if (ev.type === 'spawn') balloonSprites.set(ev.balloon, scene.add.image(ev.balloon.x, ev.balloon.y, 'fw-balloon', FRAME[ev.balloon.kind]).setOrigin(0.5, 0.2).setScale(1.4).setDepth(5));
          if (ev.type === 'pop') popped(ev);
          if (ev.type === 'fizzle') {
            rocketSprites.get(ev.rocket)?.destroy();
            rocketSprites.delete(ev.rocket);
            burst(ev.rocket.x, ev.rocket.y, 0xffe066, 0);
            scene.events.emit('fwPop');
          }
          if (ev.type === 'escape') {
            const s = balloonSprites.get(ev.balloon);
            balloonSprites.delete(ev.balloon);
            if (s) scene.tweens.add({ targets: s, alpha: 0, y: s.y - 10, duration: 300, onComplete: () => s.destroy() });
          }
          if (ev.type === 'end') endRound(ev.score);
        }
        // rockets that hit something are gone from the game: remove their sprites
        for (const [r, s] of rocketSprites) {
          if (!game.rockets.includes(r)) { s.destroy(); rocketSprites.delete(r); continue; }
          s.setPosition(r.x, r.y);
          if (Math.random() < 0.6) {
            const e = scene.add.image(r.x + (Math.random() - 0.5) * 3, r.y + 12, 'pixel').setTint(Math.random() < 0.5 ? 0xffb030 : 0xffe066).setDisplaySize(2, 2).setDepth(7);
            scene.tweens.add({ targets: e, y: e.y + 6, alpha: 0, duration: 300, onComplete: () => e.destroy() });
          }
        }
        for (const [b, s] of balloonSprites) s.setPosition(b.x, b.y).setAngle(Math.sin(b.phase) * 8);
      }
      // the timer bulbs: lit for the time left in the round
      const lit = game && !game.over ? Math.ceil((game.time / FIREWORKS.round) * BULBS) : (game ? 0 : BULBS);
      bulbs.forEach((b, i) => b.setTint(i < lit ? (i % 2 ? 0xffe066 : 0xff5a5a) : 0x3a2a4a));
      if (!game) scoreText.setText(String(best));
    },

    draw() {},
    leave() {},

    // anyone on the deck: the camera shows the whole sky
    framePoints() {
      if (!here().length) return [];
      return [{ x: room.x0 + 4, y: boardY - 4 }, { x: room.x1 - 4, y: floorY + 4 }];
    },

    lights(view, flicker) {
      return roomLights(room, lamps, view, flicker, pads.map((x) => ({ x, y: floorY - 6, r: 1.6 * flicker, glow: 0.12, color: 0xffb030 })));
    },
  };
}
