// Saturn's Ice Rink, in the mine: Ice Hockey. A giant snowball puck slides
// between two goals, each with a penguin goalie who hops up and down. Just
// skate into the puck to knock it along; jump (A) right by it for a big shot.
// Shoot while the penguin is up and it's a GOAL: a horn, the lamp flashes,
// and treasure for your backpack. Nobody is taken over: you play by moving.

import { createRink, stepRink, hockeyReward } from '../../game/hockey.js';
import { earnSticker } from '../common/stickers.js';
import { drawRoom, roomLights, flyOres } from './bonusRoom.js';
import { TILE, PLAYER, HOCKEY } from '../../tuning.js';

const NONE = {
  busy: () => false, step() {}, update() {}, draw() {}, leave() {}, lights: () => [], framePoints: () => [],
};

export function createHockeyView(scene) {
  const cells = scene.world.rink;
  if (!cells) return NONE;
  const { room, wall, lamps, inRoom } = drawRoom(scene, cells, { top: 0x080c28, bottom: 0x1a2a5a, stars: 30 });
  const floorY = cells.floor * TILE;
  // an aurora across the sky, and the rink's boards along the back
  for (const [c, dy] of [[0x3ae0a0, 24], [0xb070ff, 34]]) {
    wall.lineStyle(5, c, 0.35).beginPath();
    for (let x = room.x0; x <= room.x1; x += 8) wall.lineTo(x, room.y0 + dy + Math.sin((x - room.x0) / 30) * 8);
    wall.strokePath();
  }
  wall.fillStyle(0xf4faff, 1).fillRect(room.x0, floorY - 18, room.x1 - room.x0, 18);
  wall.fillStyle(0xe0403a, 1).fillRect(room.x0, floorY - 14, room.x1 - room.x0, 2);
  wall.fillStyle(0x4a8aff, 1).fillRect(room.x0 + (room.x1 - room.x0) / 2 - 1, floorY - 18, 2, 18);

  const rink = createRink(room.x0, room.x1);
  // the nets, their lamps, the penguin goalies, the puck and the scoreboard
  scene.add.image(room.x0, floorY, 'hockey-goal').setOrigin(0, 1).setDepth(2).setFlipX(true);
  scene.add.image(room.x1, floorY, 'hockey-goal').setOrigin(1, 1).setDepth(2);
  const lampsAt = { left: room.x0 + 13, right: room.x1 - 13 };
  const goalLamps = {
    left: scene.add.sprite(lampsAt.left, floorY - 32, 'goal-lamp', 0).setOrigin(0.5, 1).setDepth(2),
    right: scene.add.sprite(lampsAt.right, floorY - 32, 'goal-lamp', 0).setOrigin(0.5, 1).setDepth(2),
  };
  const goalies = rink.goalies.map((g) => ({ g, s: scene.add.sprite(g.x, floorY, 'penguin', 0).setOrigin(0.5, 1).setScale(1.4).setDepth(5).setFlipX(g.side === 'right') }));
  const puck = scene.add.image(rink.puck.x, floorY + 1, 'hockey-ball').setOrigin(0.5, 1).setDepth(6);
  const boardX = rink.mid;
  const boardY = floorY - 110;
  scene.add.image(boardX, boardY, 'hockey-board').setOrigin(0.5, 0).setDepth(1);
  const scoreText = scene.add.bitmapText(boardX + 12, boardY + 16, 'pixel', '0').setOrigin(0.5).setScale(2).setDepth(1.1).setTint(0x9fe8ff);

  // A jump right by the puck is a shot
  const shooters = new Set();
  const onJump = (a) => shooters.add(a);
  scene.events.on('jump', onJump);
  scene.events.once('shutdown', () => scene.events.off('jump', onJump));

  let lastTouch = null;
  const onIce = (a) => a.p.y + PLAYER.h >= floorY - 3 && a.p.x + PLAYER.w / 2 > room.x0 && a.p.x + PLAYER.w / 2 < room.x1;
  const flash = (side) => {
    const lamp = goalLamps[side];
    scene.time.addEvent({ delay: 120, repeat: 11, callback: () => lamp.setFrame(lamp.frame.name === 0 ? 1 : 0) });
    scene.time.delayedCall(1500, () => lamp.setFrame(0));
  };

  function goal(side) {
    scoreText.setText(String(rink.score));
    scene.tweens.add({ targets: scoreText, scale: 3, duration: 150, yoyo: true, repeat: 1 });
    flash(side);
    const x = side === 'left' ? room.x0 + 14 : room.x1 - 14;
    scene.effects.confetti(x, floorY - 14);
    scene.effects.sparkle(x, floorY - 12, 0x9fe8ff, 12);
    scene.cameras.main.flash(150, 200, 240, 255);
    scene.events.emit('hockeyGoal');
    earnSticker(scene, 'hockey-goal');
    scene.trip.hockeyGoals = (scene.trip.hockeyGoals ?? 0) + 1;
    if (scene.trip.hockeyGoals >= HOCKEY.trick) earnSticker(scene, 'hockey-five');
    const who = lastTouch ?? scene.avatars.find(Boolean);
    if (who && scene.trip.hockeyGoals <= HOCKEY.cap) flyOres(scene, who, x, floorY - 16, hockeyReward());
    // the goalie flops down, a bit sad (then cheers up)
    const gl = goalies.find((q) => q.g.side === side);
    scene.tweens.add({ targets: gl.s, angle: side === 'left' ? -60 : 60, duration: 200, yoyo: true, hold: 600 });
  }

  return {
    busy: () => false,
    step() {},

    update(dt) {
      const bodies = [];
      for (const a of scene.avatars) {
        if (!a || a.bubbling) continue;
        const c = { x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 };
        if (inRoom(c)) earnSticker(scene, 'hockey-rink');
        // (a shot is the jump itself, so its feet may already be just off the ice)
        const shoot = shooters.has(a);
        const iced = onIce(a) || (shoot && a.p.y + PLAYER.h >= floorY - 12);
        bodies.push({ a, x: c.x, vx: a.p.vx, onIce: iced, facing: a.p.facing, shoot });
      }
      shooters.clear();
      for (const b of bodies) if (b.onIce && Math.abs(b.x - rink.puck.x) < HOCKEY.reach) lastTouch = b.a;
      for (const ev of stepRink(rink, bodies, dt)) {
        if (ev.type === 'hit') scene.events.emit('hockeyHit');
        if (ev.type === 'shot') {
          scene.events.emit('hockeyShot');
          scene.effects.sparkle(rink.puck.x, floorY - 6, 0xffffff, 6);
        }
        if (ev.type === 'save') {
          scene.events.emit('hockeySave');
          earnSticker(scene, 'hockey-save');
          const gl = goalies.find((q) => q.g.side === ev.side);
          scene.tweens.add({ targets: gl.s, scaleX: 1.7 * Math.sign(gl.s.scaleX || 1), scaleY: 1.2, duration: 90, yoyo: true });
        }
        if (ev.type === 'goal') goal(ev.side);
        if (ev.type === 'drop') {
          puck.setAlpha(0);
          scene.tweens.add({ targets: puck, alpha: 1, duration: 300 });
          scene.effects.sparkle(rink.mid, floorY - 8, 0xffffff, 6);
        }
      }
      // draw: the puck rolls; the penguins hop (and flap while they're up)
      puck.setPosition(rink.puck.x, floorY + 1).setAngle(puck.angle + rink.puck.vx * dt * 6);
      for (const { g, s } of goalies) {
        const k = g.up ? Math.sin(((g.t - HOCKEY.stand) / HOCKEY.hop) * Math.PI) : 0;
        s.setPosition(g.x, floorY - Math.max(0, k) * 22).setFrame(g.up ? Math.floor(scene.time.now / 120) % 2 : 0);
      }
    },

    draw() {},
    leave() {},

    // anyone in the rink: the camera shows the whole ice, goal to goal
    framePoints() {
      const here = scene.avatars.some((a) => a && inRoom({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 }));
      if (!here) return [];
      return [{ x: room.x0 + 4, y: boardY - 6 }, { x: room.x1 - 4, y: floorY + 4 }];
    },

    lights(view, flicker) {
      return roomLights(room, lamps, view, flicker, [
        { x: rink.mid, y: floorY - 30, r: 6 * flicker, glow: 0.1, color: 0xc8f0ff },
        { x: lampsAt.left, y: floorY - 34, r: 2 * flicker, glow: 0.12, color: 0xff5a3a },
        { x: lampsAt.right, y: floorY - 34, r: 2 * flicker, glow: 0.12, color: 0xff5a3a },
      ]);
    },
  };
}
