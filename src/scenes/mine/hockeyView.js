// Saturn's Ice Rink, in the mine: Ice Hockey, a real match against the
// penguins, first to 3. You defend the left net (your goalie wears a blue
// scarf) and shoot at the right one. Penguin skaters in red scarves chase the
// puck, push it at your net and shoot; skate into it to steal it, and jump (A)
// right by it for a big shot. A 3-2-1 faceoff starts each point. Win: a
// trophy and a big prize. Lose: the penguins dance, and a rematch starts.
// Nobody is taken over: you play by moving.

import { createRink, stepRink, hockeyReward, hockeyWinPrize } from '../../game/hockey.js';
import { earnSticker } from '../common/stickers.js';
import { drawRoom, roomLights, flyOres } from './bonusRoom.js';
import { createRng } from '../../world/rng.js';
import { TILE, PLAYER, HOCKEY } from '../../tuning.js';

const NONE = {
  busy: () => false, step() {}, update() {}, draw() {}, leave() {}, lights: () => [], framePoints: () => [], occupied: () => false,
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
  const rng = createRng((scene.seed ?? 1) ^ 0x40c4e1);
  // the nets and their lamps
  scene.add.image(room.x0, floorY, 'hockey-goal').setOrigin(0, 1).setDepth(2).setFlipX(true);
  scene.add.image(room.x1, floorY, 'hockey-goal').setOrigin(1, 1).setDepth(2);
  const lampsAt = { left: room.x0 + 13, right: room.x1 - 13 };
  const goalLamps = {
    left: scene.add.sprite(lampsAt.left, floorY - 32, 'goal-lamp', 0).setOrigin(0.5, 1).setDepth(2),
    right: scene.add.sprite(lampsAt.right, floorY - 32, 'goal-lamp', 0).setOrigin(0.5, 1).setDepth(2),
  };
  // a penguin in a scarf: blue (0) is your team, red (1) theirs
  const penguin = (x, team, scale) => ({
    s: scene.add.sprite(x, floorY, 'penguin', 0).setOrigin(0.5, 1).setScale(scale).setDepth(5),
    scarf: scene.add.sprite(x, floorY, 'hockey-scarf', team).setOrigin(0.5, 1).setScale(scale).setDepth(5.1),
  });
  const goalies = rink.goalies.map((g) => ({ g, ...penguin(g.x, g.side === 'left' ? 0 : 1, 1.4) }));
  for (const gl of goalies) { gl.s.setFlipX(gl.g.side === 'right'); gl.scarf.setFlipX(gl.g.side === 'right'); }
  const skaters = [0, 1].map(() => ({ ...penguin(rink.mid, 1, 1.2), stick: scene.add.image(rink.mid, floorY, 'hockey-stick').setOrigin(0.5, 1).setDepth(5.2) }));
  // the puck sits on the ice, with a shadow under it and streaks behind it when it's fast
  const trail = scene.add.graphics().setDepth(6.8);
  const shadow = scene.add.image(rink.puck.x, floorY - 1, 'hockey-puck-shadow').setOrigin(0.5, 0).setDepth(6.9);
  const puck = scene.add.image(rink.puck.x, floorY, 'hockey-puck').setOrigin(0.5, 1).setDepth(7);
  // the scoreboard: your face and score, a penguin and theirs
  const boardY = floorY - 110;
  const mid = rink.mid;
  scene.add.image(mid, boardY, 'hockey-board').setOrigin(0.5, 0).setDepth(1);
  const face = scene.add.image(mid - 30, boardY + 16, 'penguin', 0).setScale(0.6).setDepth(1.1).setVisible(false);
  scene.add.image(mid + 14, boardY + 16, 'penguin', 0).setScale(0.8).setDepth(1.1);
  const usText = scene.add.bitmapText(mid - 12, boardY + 16, 'pixel', '0').setOrigin(0.5).setScale(2).setDepth(1.1).setTint(0x9fe8ff);
  const themText = scene.add.bitmapText(mid + 31, boardY + 16, 'pixel', '0').setOrigin(0.5).setScale(2).setDepth(1.1).setTint(0xffb0a0);
  const showScore = () => { usText.setText(String(rink.score.us)); themText.setText(String(rink.score.them)); };
  // the 3-2-1 and the winners' trophy over the middle of the ice, and the penguins' flag over your net
  const countText = scene.add.bitmapText(mid, floorY - 56, 'pixel', '').setOrigin(0.5).setScale(4).setDepth(40).setTint(0xffd84a).setVisible(false);
  const trophy = scene.add.image(mid, floorY - 30, 'hockey-trophy').setOrigin(0.5, 1).setDepth(41).setVisible(false);
  const flag = scene.add.image(room.x0 + 10, floorY - 38, 'hockey-flag').setOrigin(0.1, 1).setDepth(41).setVisible(false);
  // each player holds a stick while they're on the ice
  const sticks = new Map();

  // A jump right by the puck is a shot
  const shooters = new Set();
  const onJump = (a) => shooters.add(a);
  scene.events.on('jump', onJump);
  scene.events.once('shutdown', () => scene.events.off('jump', onJump));

  let lastTouch = null;
  const middle = (a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 });
  const onIce = (a) => a.p.y + PLAYER.h >= floorY - 3 && inRoom(middle(a));
  const flash = (side) => {
    const lamp = goalLamps[side];
    scene.time.addEvent({ delay: 120, repeat: 11, callback: () => lamp.setFrame(lamp.frame.name === 0 ? 1 : 0) });
    scene.time.delayedCall(1500, () => lamp.setFrame(0));
  };
  const flop = (side) => {
    const gl = goalies.find((q) => q.g.side === side);
    scene.tweens.add({ targets: [gl.s, gl.scarf], angle: side === 'left' ? -60 : 60, duration: 200, yoyo: true, hold: 600 });
  };
  const spray = () => scene.effects.sparkle(rink.puck.x, floorY - 3, 0xdff4ff, 4);
  const netX = (side) => (side === 'left' ? room.x0 + 14 : room.x1 - 14);

  function goal(ev) {
    showScore();
    const x = netX(ev.side);
    flash(ev.side);
    flop(ev.side);
    scene.tweens.add({ targets: ev.team === 'us' ? usText : themText, scale: 3, duration: 150, yoyo: true, repeat: 1 });
    if (ev.team === 'them') {
      scene.events.emit('hockeyThem');
      scene.effects.sparkle(x, floorY - 12, 0xffb0a0, 8);
      return;
    }
    scene.effects.confetti(x, floorY - 14);
    scene.effects.sparkle(x, floorY - 12, 0x9fe8ff, 12);
    scene.cameras.main.flash(150, 200, 240, 255);
    scene.events.emit('hockeyGoal');
    earnSticker(scene, 'hockey-goal');
    scene.trip.hockeyGoals = (scene.trip.hockeyGoals ?? 0) + 1;
    const who = lastTouch ?? scene.avatars.find(Boolean);
    if (who && scene.trip.hockeyGoals <= HOCKEY.cap) flyOres(scene, who, x, floorY - 16, hockeyReward());
  }

  function win(bodies) {
    scene.events.emit('hockeyWin');
    for (const side of ['left', 'right']) scene.effects.confetti(netX(side), floorY - 14);
    scene.tweens.killTweensOf(trophy);
    trophy.setVisible(true).setAlpha(1).setScale(0);
    scene.tweens.add({ targets: trophy, scale: 2, duration: 400, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: trophy, alpha: 0, delay: HOCKEY.overTime * 1000 - 400, duration: 300 });
    earnSticker(scene, 'hockey-five');
    scene.trip.hockeyWins = (scene.trip.hockeyWins ?? 0) + 1;
    // the prize, shared out between everyone on the ice
    const team = bodies.filter((b) => b.onIce).map((b) => b.a);
    if (!team.length) team.push(...[lastTouch ?? scene.avatars.find(Boolean)].filter(Boolean));
    const shares = team.map(() => []);
    hockeyWinPrize(scene.trip.hockeyWins).forEach((ore, i) => shares[i % shares.length]?.push(ore));
    team.forEach((a, i) => { if (shares[i].length) flyOres(scene, a, trophy.x, trophy.y - 30, shares[i]); });
  }

  function lose() {
    scene.events.emit('hockeyLose');
    scene.tweens.killTweensOf(flag);
    flag.setVisible(true).setAlpha(1).setScale(1);
    scene.tweens.add({ targets: flag, scaleX: 0.7, duration: 250, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: flag, alpha: 0, delay: HOCKEY.overTime * 1000 - 300, duration: 300 });
  }

  function cleared() {
    showScore();
    for (const img of [trophy, flag]) { scene.tweens.killTweensOf(img); img.setVisible(false); }
  }

  return {
    rink, // (for the dev harness)
    // is anyone in the room? (the bonus rooms play the arcade tune)
    occupied: () => scene.avatars.some((a) => a && inRoom(middle(a))),
    busy: () => false,
    step() {},

    update(dt) {
      const bodies = [];
      for (const a of scene.avatars) {
        if (!a || a.bubbling || !inRoom(middle(a))) continue;
        earnSticker(scene, 'hockey-rink');
        // (a shot is the jump itself, so its feet may already be just off the ice)
        const shoot = shooters.has(a);
        const iced = onIce(a) || (shoot && a.p.y + PLAYER.h >= floorY - 12);
        bodies.push({ a, x: middle(a).x, vx: a.p.vx, onIce: iced, facing: a.p.facing, shoot });
      }
      shooters.clear();
      for (const b of bodies) if (b.onIce && Math.abs(b.x - rink.puck.x) < HOCKEY.reach) lastTouch = b.a;
      for (const ev of stepRink(rink, bodies, dt, rng)) {
        if (ev.type === 'hit') {
          scene.events.emit('hockeyHit');
          spray();
        }
        if (ev.type === 'shot') {
          scene.events.emit('hockeyShot');
          scene.effects.sparkle(rink.puck.x, floorY - 6, 0xffffff, 6);
          spray();
        }
        if (ev.type === 'save') {
          scene.events.emit('hockeySave');
          earnSticker(scene, 'hockey-save');
          const gl = goalies.find((q) => q.g.side === ev.side);
          scene.tweens.add({ targets: [gl.s, gl.scarf], scaleX: 1.7, scaleY: 1.2, duration: 90, yoyo: true });
        }
        if (ev.type === 'goal') goal(ev);
        if (ev.type === 'win') win(bodies);
        if (ev.type === 'lose') lose();
        if (ev.type === 'reset') cleared();
        if (ev.type === 'countdown') {
          scene.events.emit('hockeyCountdown');
          countText.setText(String(ev.n)).setVisible(true).setScale(6);
          scene.tweens.add({ targets: countText, scale: 4, duration: 220, ease: 'Back.easeOut' });
          if (ev.n === HOCKEY.countdown) {
            puck.setAlpha(0);
            scene.tweens.add({ targets: puck, alpha: 1, duration: 300 });
          }
        }
        if (ev.type === 'drop') {
          countText.setVisible(false);
          scene.effects.sparkle(rink.mid, floorY - 8, 0xffffff, 6);
        }
      }
      if (!face.visible) {
        const first = scene.avatars.find(Boolean);
        if (first) face.setTexture(first.sprite.texture.key, 0).setVisible(true);
      }

      // the puck slides (with streaks when it's fast)
      const p = rink.puck;
      puck.setPosition(p.x, floorY);
      shadow.setPosition(p.x, floorY - 1);
      trail.clear();
      if (Math.abs(p.vx) > 120) {
        const dir = Math.sign(p.vx);
        for (let i = 0; i < 3; i++) {
          trail.lineStyle(1, 0xdff4ff, 0.7 - i * 0.2);
          const x = p.x - dir * (8 + i * 5);
          trail.lineBetween(x, floorY - 2 - (i % 2) * 2, x - dir * 4, floorY - 2 - (i % 2) * 2);
        }
      }

      // the goalies hop (and flap while they're up); yours dances when you win
      const t = scene.time.now / 1000;
      const weWon = rink.phase === 'over' && rink.winner === 'us';
      const theyWon = rink.phase === 'over' && rink.winner === 'them';
      for (const gl of goalies) {
        const { g, s, scarf } = gl;
        const k = g.up ? Math.sin(((g.t - HOCKEY.stand) / HOCKEY.hop) * Math.PI) : 0;
        const dance = (weWon && g.side === 'left') || (theyWon && g.side === 'right');
        const y = floorY - Math.max(0, k) * 22 - (dance ? Math.abs(Math.sin(t * 10)) * 5 : 0);
        s.setPosition(g.x, y).setFrame(g.up || dance ? Math.floor(scene.time.now / 120) % 2 : 0);
        // (your goalie wiggles while you win; the flop after a goal is a tween)
        if (weWon && g.side === 'left') {
          s.setAngle(Math.sin(t * 12) * 15);
          gl.wiggled = true;
        } else if (gl.wiggled) {
          s.setAngle(0);
          gl.wiggled = false;
        }
        scarf.setPosition(s.x, s.y).setAngle(s.angle).setScale(s.scaleX, s.scaleY);
      }

      // the penguin skaters waddle, slip and spin, and dance when they win
      skaters.forEach((v, i) => {
        const sk = rink.skaters[i];
        const show = !!sk;
        for (const img of [v.s, v.scarf, v.stick]) img.setVisible(show);
        if (!sk) return;
        const moving = Math.abs(sk.vx) > 1;
        const y = floorY - (theyWon ? Math.abs(Math.sin(t * 10 + i)) * 5 : moving ? Math.abs(Math.sin(t * 14 + i)) * 1.5 : 0);
        // (a slip spins it on the spot: it flips round and round, wobbling)
        const slipping = sk.slipT > 0;
        const flip = slipping ? Math.floor(sk.slipT * 14) % 2 === 0 : sk.facing < 0;
        v.s.setPosition(sk.x, y).setFlipX(flip).setAngle(slipping ? Math.sin(sk.slipT * 30) * 20 : 0)
          .setFrame(moving || theyWon ? Math.floor(scene.time.now / 120 + i) % 2 : 0);
        v.scarf.setPosition(sk.x, y).setFlipX(flip).setAngle(v.s.angle);
        v.stick.setPosition(sk.x + sk.facing * 7, floorY).setFlipX(flip).setVisible(sk.slipT <= 0);
      });

      // a stick for each player on the ice
      for (const a of scene.avatars) {
        if (!a) continue;
        if (!sticks.has(a)) sticks.set(a, scene.add.image(0, 0, 'hockey-stick').setOrigin(0.5, 1).setDepth(31));
        const stick = sticks.get(a);
        const show = !a.bubbling && onIce(a);
        stick.setVisible(show);
        if (show) stick.setPosition(a.sprite.x + a.p.facing * 6, floorY).setFlipX(a.p.facing < 0);
      }
    },

    draw() {},
    leave() {},

    // anyone in the rink: the camera shows the whole ice, goal to goal
    framePoints() {
      const here = scene.avatars.some((a) => a && inRoom(middle(a)));
      if (!here) return [];
      return [{ x: room.x0 + 4, y: boardY - 6 }, { x: room.x1 - 4, y: floorY + 12 }];
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
