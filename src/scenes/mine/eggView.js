// Dino Planet's Egg Grove, in the mine: Egg Catch. A pterodactyl flies back
// and forth dropping eggs; everyone in the grove carries a basket over their
// head, so just run under them. A speckled egg is 1, a golden egg 3, a
// rotten egg (pee-yew!) nothing. Rounds last 30 seconds (the bulbs under the
// scoreboard go out one by one); every catch sends treasure to your backpack.

import { createEggGame, stepEggGame, eggReward } from '../../game/eggcatch.js';
import { earnSticker } from '../common/stickers.js';
import { drawRoom, roomLights, flyOres } from './bonusRoom.js';
import { TILE, PLAYER, EGGS } from '../../tuning.js';

const NONE = {
  busy: () => false, step() {}, update() {}, draw() {}, leave() {}, lights: () => [], framePoints: () => [], occupied: () => false, contains: () => false,
};
const BULBS = 10; // (big enough to read from the sofa)
const FRAME = { egg: 0, golden: 1, rotten: 2 };
const BASKET_UP = 22; // the basket rim, above a player's feet (px)

export function createEggView(scene) {
  const cells = scene.world.grove;
  if (!cells) return NONE;
  const { room, wall, lamps, inRoom } = drawRoom(scene, cells, { top: 0x8a2a4a, bottom: 0xe0703a, stars: 6 });
  const floorY = cells.floor * TILE;
  // a jungle sunset: a smoking volcano far off, and tree ferns along the back
  scene.add.image(room.x0 + 200, floorY - 6, 'volcano-big').setOrigin(0.5, 1).setScale(0.6).setDepth(0.55).setAlpha(0.85);
  wall.fillStyle(0x4a9a3a, 1);
  for (let i = 0; i < 6; i++) wall.fillEllipse(room.x0 + i * 56, floorY + 6, 90, 40);
  for (const x of [room.x0 + 20, room.x0 + 120, room.x1 - 30]) scene.add.image(x, floorY + 2, 'treefern').setOrigin(0.5, 1).setScale(0.8).setDepth(0.6);

  const boardX = (room.x0 + room.x1) / 2 + 20;
  const boardY = floorY - 118;
  scene.add.image(boardX, boardY, 'egg-board').setOrigin(0.5, 0).setDepth(1);
  const scoreText = scene.add.bitmapText(boardX + 12, boardY + 16, 'pixel', '0').setOrigin(0.5).setScale(2).setDepth(1.1).setTint(0xffe066);
  const bulbs = Array.from({ length: BULBS }, (_, i) => scene.add.image(boardX - 35 + i * 8, boardY + 40, 'pixel').setDisplaySize(6, 6).setDepth(1.1));
  const dropY = room.y0 + 34;
  const ptero = scene.add.sprite((room.x0 + room.x1) / 2, dropY - 10, 'ptero', 0).setDepth(6).setScale(1.8);

  let game = null;
  let best = 0;
  let pause = 1.5;
  const eggSprites = new Map();
  const baskets = new Map(); // avatar → its basket sprite
  const here = () => scene.avatars.filter((a) => a && !a.bubbling && inRoom({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 }));

  function caught(a, egg) {
    const x = egg.x;
    const y = a.sprite.y - BASKET_UP;
    eggSprites.get(egg)?.destroy();
    eggSprites.delete(egg);
    const b = baskets.get(a);
    if (b) scene.tweens.add({ targets: b, scaleY: 0.7, duration: 70, yoyo: true });
    if (egg.kind === 'rotten') {
      // pee-yew! a green stink cloud (harmless)
      scene.events.emit('eggRotten');
      earnSticker(scene, 'egg-rotten');
      for (let i = 0; i < 6; i++) {
        const c = scene.add.image(x + (i - 2.5) * 3, y, 'smoke').setDepth(40).setTint(0x9ac870).setAlpha(0.8);
        scene.tweens.add({ targets: c, y: y - 20 - i * 3, x: c.x + (i - 2.5) * 4, scale: 2, alpha: 0, duration: 900, onComplete: () => c.destroy() });
      }
      return;
    }
    scene.events.emit(egg.kind === 'golden' ? 'eggGolden' : 'eggCatch');
    earnSticker(scene, 'egg-catch');
    if (egg.kind === 'golden') earnSticker(scene, 'egg-golden');
    scene.effects.sparkle(x, y, egg.kind === 'golden' ? 0xffd84a : 0xffffff, egg.kind === 'golden' ? 12 : 5);
    scoreText.setText(String(game.score));
    scene.tweens.add({ targets: scoreText, scale: 2.6, duration: 90, yoyo: true });
    if ((scene.trip.eggPrizes ?? 0) < EGGS.cap) {
      scene.trip.eggPrizes = (scene.trip.eggPrizes ?? 0) + 1;
      flyOres(scene, a, x, y - 4, eggReward(egg.kind));
    }
  }

  function splat(egg) {
    eggSprites.get(egg)?.destroy();
    eggSprites.delete(egg);
    const s = scene.add.image(egg.x, floorY + 1, 'egg-splat').setOrigin(0.5, 1).setDepth(4);
    scene.tweens.add({ targets: s, alpha: 0, delay: 1200, duration: 600, onComplete: () => s.destroy() });
    scene.events.emit(egg.kind === 'rotten' ? 'eggRottenSplat' : 'eggSplat');
  }

  function endRound(score) {
    best = Math.max(best, score);
    pause = 4;
    scene.events.emit('eggEnd');
    scene.effects.confetti(boardX, boardY + 10);
    scene.tweens.add({ targets: scoreText, scale: 3.2, duration: 300, yoyo: true, repeat: 2 });
    if (score >= EGGS.star) earnSticker(scene, 'egg-star');
    // the pterodactyl does a happy loop
    scene.tweens.add({ targets: ptero, y: dropY - 30, duration: 400, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
  }

  return {
    // is anyone in the room? (the bonus rooms play the arcade tune)
    occupied: () => scene.avatars.some((a) => a && inRoom({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 })),
    contains: (a) => inRoom({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 }),
    busy: () => false,
    step() {},

    update(dt) {
      const players = here();
      if (players.length) earnSticker(scene, 'egg-grove');
      // everyone in the grove holds a basket up
      for (const a of scene.avatars) {
        if (!a) continue;
        const inside = players.includes(a);
        let b = baskets.get(a);
        if (inside && !b) {
          b = scene.add.image(0, 0, 'basket').setOrigin(0.5, 0).setScale(1.2).setDepth(32);
          baskets.set(a, b);
        }
        if (b) b.setVisible(inside).setPosition(a.sprite.x, a.sprite.y - BASKET_UP);
      }
      if (!players.length) {
        // nobody here: the round stops, the eggs vanish
        if (game) {
          for (const s of eggSprites.values()) s.destroy();
          eggSprites.clear();
          game = null;
          pause = 1.5;
        }
      } else if (!game || (game.over && !game.eggs.length)) {
        pause -= dt;
        if (pause <= 0) {
          game = createEggGame(room.x0, room.x1, dropY, floorY);
          game.ptero.x = ptero.x;
          scoreText.setText('0');
          scene.events.emit('eggStart');
        }
      }
      if (game) {
        const rims = players.map((a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h - BASKET_UP }));
        for (const ev of stepEggGame(game, rims, dt, scene.rng)) {
          if (ev.type === 'drop') {
            eggSprites.set(ev.egg, scene.add.image(ev.egg.x, ev.egg.y, 'catch-egg', FRAME[ev.egg.kind]).setOrigin(0.5, 1).setScale(1.3).setDepth(7));
            scene.events.emit('eggDrop');
            ptero.setFrame(1);
          }
          if (ev.type === 'catch') caught(players[ev.basket], ev.egg);
          if (ev.type === 'splat') splat(ev.egg);
          if (ev.type === 'end') endRound(ev.score);
        }
        for (const [egg, s] of eggSprites) s.setPosition(egg.x, egg.y).setAngle(Math.sin(egg.y / 12) * 10);
        ptero.x = game.ptero.x;
        ptero.setFlipX(game.ptero.dir < 0);
      }
      ptero.setFrame(Math.floor(scene.time.now / 200) % 2);
      // the timer bulbs: lit for the time left in the round
      const lit = game && !game.over ? Math.ceil((game.time / EGGS.round) * BULBS) : (game ? 0 : BULBS);
      bulbs.forEach((b, i) => b.setTint(i < lit ? (i % 2 ? 0xffe066 : 0xff8a3a) : 0x3a4a2a));
      if (!game) scoreText.setText(String(best));
    },

    draw() {},
    leave() {},

    // anyone in the grove: the camera shows it all, pterodactyl to floor
    framePoints() {
      if (!here().length) return [];
      return [{ x: room.x0 + 4, y: dropY - 22 }, { x: room.x1 - 4, y: floorY + 4 }];
    },

    lights(view, flicker) {
      return roomLights(room, lamps, view, flicker);
    },
  };
}
