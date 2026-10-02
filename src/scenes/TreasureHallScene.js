// The Treasure Hall: a long room behind the big door in Rainbow Village.
// Twelve pedestals in a row, one for each treasure of the treasure hunt (a
// found one glows and bobs; one still to find is a faint "?"), and a big
// plinth at the end for the grand prize, a golden statue of the robot.
// Treasures found since your last visit drop onto their pedestals one after
// another with a fanfare. At the door on the left, A (or up) goes back out
// to the village.

import Phaser from 'phaser';
import { createGrid } from '../world/grid.js';
import { B } from '../world/blocks.js';
import { createPlayer, stepPlayer, standAt } from '../game/player.js';
import { createEdge } from '../input/intents.js';
import { animateCharacter } from './common/avatarView.js';
import { createEffects } from './mine/effects.js';
import { createGearView } from './common/gearView.js';
import { createGearFx } from './common/gearFx.js';
import { getState, setState } from '../save/store.js';
import { attachAudio } from '../audio/wire.js';
import { createPauseWatch } from './common/pauseWatch.js';
import { HUNT_TREASURES, STATUE, huntOf, newlyFound, markShown } from '../game/hunt.js';
import { powersOf } from '../game/gear.js';
import { gearMoves } from '../game/perks.js';
import { TILE, PLAYER, HALL } from '../tuning.js';
import { charFor } from '../game/cast.js';
import { goldKey } from '../art/gold.js';

const IDLE = { moveX: 0, moveY: 0, jump: false, bubble: false, home: false, pause: false };
const GROUND_Y = HALL.ground * TILE;
const GOLD = 0xffd84a;
const STEP = 2000; // (ms) between new treasures in the show
const STATUE_CHAR = 'robot'; // who the golden statue is
const pedestalX = (i) => (HALL.first + i * HALL.step) * TILE;
const PLINTH_X = HALL.plinth * TILE;
const DOOR_X = HALL.door * TILE;

export class TreasureHallScene extends Phaser.Scene {
  constructor() {
    super('Hall');
  }

  create() {
    this.session = this.registry.get('input');
    this.session.setJoining(true);
    this.planet = 'rainbow'; // (Rainbow Village's song)
    this.W = HALL.w * TILE;
    this.avatars = [];
    this.leaving = false;
    this.showing = false;
    // the room: a floor to stand on, and walls at both ends
    this.grid = createGrid(HALL.w, HALL.h);
    for (let x = 0; x < HALL.w; x++) for (let y = HALL.ground; y < HALL.h; y++) this.grid.set(x, y, B.STONE);
    for (let y = 0; y < HALL.ground; y++) { this.grid.set(0, y, B.STONE); this.grid.set(HALL.w - 1, y, B.STONE); }

    this.drawRoom();
    this.effects = createEffects(this);
    this.gearView = createGearView(this);
    this.gearFx = createGearFx(this);
    const hunt = huntOf(getState(this.registry));
    const fresh = newlyFound(hunt);
    this.drawTreasures(hunt, fresh);
    this.statues = [];
    if (hunt.found.includes(STATUE) && !fresh.includes(STATUE)) this.raiseStatues(false);
    // the Gear page (from the pause menu): everyone, statues too, dresses again
    const onGear = () => this.refreshGear();
    this.events.on('gearChanged', onGear);
    this.events.once('shutdown', () => this.events.off('gearChanged', onGear));
    this.doorPrompt = this.add.image(DOOR_X, GROUND_Y - 58, 'btn-a').setScale(1.5).setDepth(70).setVisible(false);

    const cam = this.cameras.main;
    cam.setBounds(0, -2 * TILE, this.W, (HALL.h + 2) * TILE);
    cam.setRoundPixels(true);
    this.cam = { zoom: 1.5, x: DOOR_X + 4 * TILE, y: GROUND_Y - 50 };
    cam.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
    cam.fadeIn(400, 20, 12, 30);

    attachAudio(this);
    this.pauseWatch = createPauseWatch(this);
    if (fresh.length) this.time.delayedCall(700, () => this.showNew(fresh));
  }

  // ---------- the room ----------

  drawRoom() {
    const W = this.W;
    const g = this.add.graphics().setDepth(-20);
    // the back wall: deep purple, lighter at the top, with a gold rail and wainscot
    g.fillGradientStyle(0x4a2a6a, 0x4a2a6a, 0x2a1840, 0x2a1840, 1);
    g.fillRect(0, -2 * TILE, W, GROUND_Y + 2 * TILE);
    for (let x = 0; x < W; x += 32) g.fillStyle(0x56327a, 1).fillRect(x, -2 * TILE, 16, GROUND_Y - 30 + 2 * TILE);
    g.fillStyle(0x6a3a8a, 1).fillRect(0, GROUND_Y - 30, W, 30);
    g.fillStyle(GOLD, 1).fillRect(0, GROUND_Y - 31, W, 2);
    g.fillStyle(0xc8902a, 1).fillRect(0, GROUND_Y - 29, W, 1);
    // the floor: warm wood, and a red carpet down the middle
    g.fillStyle(0x8a4a2a, 1).fillRect(0, GROUND_Y, W, (HALL.h - HALL.ground) * TILE);
    for (let x = 0; x < W; x += 24) g.fillStyle(0x6a3a2a, 1).fillRect(x, GROUND_Y, 1, (HALL.h - HALL.ground) * TILE);
    g.fillStyle(0xc83a3a, 1).fillRect(DOOR_X + 20, GROUND_Y, W - DOOR_X - 36, 5);
    g.fillStyle(GOLD, 1).fillRect(DOOR_X + 20, GROUND_Y + 5, W - DOOR_X - 36, 1);
    // columns and rainbow banners along the wall, and lanterns glowing between them
    for (let i = 0; i < 7; i++) {
      const x = pedestalX(0) - 22 + i * 5 * TILE;
      this.add.image(x, GROUND_Y, 'hall-column').setOrigin(0.5, 1).setDepth(-10);
      this.add.image(x + 40, GROUND_Y - 96, 'hall-banner').setOrigin(0.5, 0).setDepth(-10);
      const glow = this.add.image(x + 40, GROUND_Y - 108, 'light').setTint(0xffe9a0).setAlpha(0.3).setScale(1.2).setDepth(-11);
      this.tweens.add({ targets: glow, alpha: 0.15, duration: 1200 + i * 90, yoyo: true, repeat: -1 });
    }
    // the door back out, and the end wall behind the grand plinth
    this.add.image(DOOR_X, GROUND_Y + 1, 'hall-door').setOrigin(0.5, 1).setDepth(-5);
    this.add.image(PLINTH_X, GROUND_Y + 1, 'hall-plinth').setOrigin(0.5, 1).setDepth(2);
    const spot = this.add.image(PLINTH_X, GROUND_Y - 60, 'light').setTint(0xfff2a0).setAlpha(0.25).setScale(3).setDepth(-9);
    this.tweens.add({ targets: spot, alpha: 0.4, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // the plinth waits with a "?" until the grand prize is found
    this.plinthMark = this.add.bitmapText(PLINTH_X, GROUND_Y - 40, 'pixel', '?').setOrigin(0.5).setScale(5).setTint(0xffffff).setAlpha(0.25).setDepth(3);
  }

  drawTreasures(hunt, fresh) {
    this.pedestals = HUNT_TREASURES.map((id, i) => {
      const x = pedestalX(i);
      this.add.image(x, GROUND_Y + 1, 'hall-pedestal').setOrigin(0.5, 1).setDepth(2);
      const y = GROUND_Y - 30;
      const mark = this.add.bitmapText(x, y, 'pixel', '?').setOrigin(0.5).setScale(3).setTint(0xffffff).setAlpha(0.25).setDepth(3);
      const glow = this.add.image(x, y, 'light').setTint(0xffe066).setAlpha(0).setScale(0.9).setDepth(2.5);
      const img = this.add.image(x, y, `treasure-${id}`).setScale(1.5).setDepth(3).setVisible(false);
      const p = { id, x, y, mark, glow, img };
      if (hunt.found.includes(id) && !fresh.includes(id)) this.placeTreasure(p);
      return p;
    });
  }

  // A treasure on its pedestal: glowing softly and bobbing (the dragon egg wobbles).
  placeTreasure(p) {
    p.mark.setVisible(false);
    p.img.setVisible(true).setPosition(p.x, p.y).setAlpha(1);
    p.glow.setAlpha(0.45);
    this.tweens.add({ targets: p.img, y: p.y - 2, duration: 900 + (p.x % 300), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: p.glow, alpha: 0.25, scale: 1.1, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (p.id === 'dragonegg') this.tweens.add({ targets: p.img, angle: { from: -8, to: 8 }, duration: 160, yoyo: true, repeat: -1, repeatDelay: 1800 });
  }

  // The golden statue on the big plinth: the robot (the owner's son always
  // plays the robot), in gold, wearing the gear of whoever's playing the robot.
  raiseStatues(animate) {
    for (const s of this.statues) s.sprite.destroy();
    const slots = this.session.slots.map((s) => s.slot);
    const slot = slots.find((sl) => charFor(this.registry, sl) === STATUE_CHAR) ?? 0;
    const sprite = this.add.sprite(PLINTH_X, GROUND_Y - 15, goldKey(this, `char-${STATUE_CHAR}`), 0)
      .setOrigin(0.5, 1).setScale(3.5).setDepth(4);
    const statue = { slot, sprite, gold: true };
    this.gearView.add(statue);
    this.statues = [statue];
    if (animate) {
      sprite.setScale(3.5, 0);
      this.tweens.add({ targets: sprite, scaleY: 3.5, duration: 900, ease: 'Back.easeOut' });
    }
    this.plinthMark.setVisible(false);
    // a shine sweeps across them now and then
    if (!this.shine) {
      this.shine = this.add.rectangle(PLINTH_X - 56, GROUND_Y - 40, 4, 60, 0xffffff, 0.45).setAngle(20).setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: this.shine, x: PLINTH_X + 56, duration: 800, repeat: -1, repeatDelay: 2600, ease: 'Quad.easeInOut' });
      this.time.addEvent({ delay: 900, loop: true, callback: () => this.effects.sparkle(PLINTH_X + Phaser.Math.Between(-40, 40), GROUND_Y - Phaser.Math.Between(20, 60), 0xfff2a0, 2) });
    }
  }

  refreshGear() {
    const st = getState(this.registry);
    for (const a of this.avatars) if (a) a.powers = powersOf(st, a.slot);
    this.gearView.refresh();
    for (const s of this.statues) this.gearView.add(s);
  }

  // Treasures found since the last visit: the camera goes to each one in
  // turn and it drops onto its pedestal with a fanfare. Then they're saved as shown.
  showNew(fresh) {
    this.showing = true;
    fresh.forEach((id, i) => {
      this.time.delayedCall(i * STEP, () => {
        const statue = id === STATUE;
        const x = statue ? PLINTH_X : this.pedestals.find((p) => p.id === id).x;
        this.focus = { x, y: GROUND_Y - 50 };
        this.time.delayedCall(900, () => {
          if (statue) {
            this.raiseStatues(true);
            this.cameras.main.flash(300, 255, 240, 180);
            this.effects.confetti(x, GROUND_Y - 70);
            this.events.emit('party');
            return;
          }
          const p = this.pedestals.find((q) => q.id === id);
          p.mark.setVisible(false);
          p.img.setVisible(true).setPosition(p.x, p.y - 90).setAlpha(0);
          this.tweens.add({
            targets: p.img, y: p.y, alpha: 1, duration: 600, ease: 'Bounce.easeOut',
            onComplete: () => {
              this.placeTreasure(p);
              this.effects.sparkle(p.x, p.y, 0xffe066, 14);
              this.effects.confetti(p.x, p.y - 20);
              this.events.emit('fanfare');
            },
          });
        });
      });
    });
    // (the statue gets a moment longer to be admired)
    this.time.delayedCall(fresh.length * STEP + (fresh.includes(STATUE) ? 2500 : 800), () => {
      this.showing = false;
      this.focus = null;
      const st = getState(this.registry);
      setState(this.registry, { ...st, hunt: markShown(huntOf(st)) });
    });
  }

  // ---------- players ----------

  avatarFor(slot) {
    if (this.avatars[slot]) return this.avatars[slot];
    const char = charFor(this.registry, slot);
    const a = {
      slot,
      char,
      p: createPlayer(standAt(HALL.door + 1 + slot, HALL.ground - 1)),
      sprite: this.add.sprite(0, 0, `char-${char}`, 0).setOrigin(0.5, 1).setDepth(30),
      edges: { a: createEdge(), up: createEdge() },
      walkT: 0,
    };
    a.powers = powersOf(getState(this.registry), slot);
    this.avatars[slot] = a;
    animateCharacter(a.sprite, a.p, a, 0, 0);
    this.gearView.add(a);
    this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xffffff, 8);
    this.events.emit('joined', a);
    return a;
  }

  awake() {
    const all = this.avatars.filter(Boolean);
    const up = all.filter((a) => !this.session.slots.find((s) => s.slot === a.slot)?.resting);
    return up.length ? up : all;
  }

  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    if (!this.leaving && this.pauseWatch.update()) return;
    let atDoor = false;
    for (const { slot, intent } of this.session.slots) {
      const a = this.avatarFor(slot);
      const i = intent ?? IDLE;
      const e = { a: a.edges.a(!!i.jump), up: a.edges.up(i.moveY < -0.5) };
      const door = Math.abs(a.p.x + PLAYER.w / 2 - DOOR_X) < 14;
      if (door) atDoor = true;
      let move = this.leaving ? IDLE : i;
      if (door && !this.leaving) {
        move = { ...i, jump: false }; // A goes out instead of jumping
        if (e.a || e.up) this.goBack();
      }
      const gear = gearMoves(a.powers);
      const r = stepPlayer(a.p, move, this.grid, {
        dt, canMine: false, walkMul: gear.walkMul, jumpMul: gear.jumpMul, grip: gear.grip, jetpack: gear.jetpack,
        glide: gear.glide, balloon: gear.balloon, gecko: gear.gecko, skates: gear.skates,
      });
      if (r.jumped) this.events.emit('jump', a);
      this.gearFx.step(a, a.powers, r, dt);
      a.p.x = Phaser.Math.Clamp(a.p.x, TILE + 2, this.W - TILE - PLAYER.w - 2);
      if (a.p.y < 8) { a.p.y = 8; a.p.vy = Math.max(0, a.p.vy); }
      animateCharacter(a.sprite, a.p, a, dt, time);
    }
    this.doorPrompt.setVisible(atDoor && !this.leaving).setY(GROUND_Y - 58 + Math.sin(time / 200) * 2);
    this.gearView.update();
    this.updateCamera(dt);
  }

  updateCamera(dt) {
    const pts = this.focus ? [this.focus] : this.awake().map((a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y }));
    if (!pts.length) return;
    const xs = pts.map((p) => p.x);
    const zoom = Math.max(0.9, Math.min(1.5, this.scale.width / (Math.max(...xs) - Math.min(...xs) + 160)));
    const tx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const k = 1 - Math.exp(-dt * (this.focus ? 6 : 4));
    this.cam.zoom += (zoom - this.cam.zoom) * k;
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (GROUND_Y - 50 - this.cam.y) * k;
    this.cameras.main.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
  }

  goBack() {
    if (this.leaving || this.showing) return;
    this.leaving = true;
    this.events.emit('tripStart');
    this.cameras.main.fadeOut(400, 20, 12, 30);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Camp', { planet: 'rainbow', fromHall: true }));
  }
}
