// A Wonder Galaxy planet. This scene is the frame every Wonder planet shares,
// and one module per planet (src/scenes/wonder/<id>.js) does the rest: the
// world, the moves, the things to collect and the prize.
//
// The frame: the Wonder Rocket lands on the pad and everyone pops out; A at
// the rocket opens the star map; holding B for 2 seconds zips you back to the
// rocket; a player left far behind pops over next to the other; the goal
// counter (in WonderHud) fills; the prize party; the stickers; the song.
//
// A module is made by `create(scene)` and gives back:
//   world: { w, h }         the size of the world, in pixels
//   pad: { x, y }           where the rocket stands (its feet)
//   zoom: [min, max]        how far the camera may zoom out / in
//   goal(): { have, need }  (or { progress } for a climb, { place } for a race)
//   spawn(a)                set up a new player (near the pad, or `a.at`)
//   step(a, i, e, dt, time) one player's frame: i is the intent, e the presses
//   update(dt, time)        the world's frame, after the players
//   focus(a): { x, y }      where the camera looks for this player
//   place(a, x, y)          put a player at a spot (feet at y)
//   onFoot(a)               true when the player can use the rocket
//   regroup                 (optional) false: the module keeps players together itself
//   ready()                 (optional) the counter just filled: return the prize's spot

import Phaser from 'phaser';
import { createEdge, createHoldTimer } from '../input/intents.js';
import { animateCharacter } from './common/avatarView.js';
import { createEffects } from './mine/effects.js';
import { createGearView } from './common/gearView.js';
import { getState, setState } from '../save/store.js';
import { attachAudio } from '../audio/wire.js';
import { createPauseWatch } from './common/pauseWatch.js';
import { earnSticker } from './common/stickers.js';
import { charFor } from '../game/cast.js';
import { wonderById, markVisited, winPrize, stickerIds } from '../game/wonder/planets.js';
import { WONDER_MODULES } from './wonder/index.js';

const IDLE = { moveX: 0, moveY: 0, jump: false, bubble: false, home: false, pause: false };
const HOME_HOLD_MS = 2000;
const SPREAD = { x: 560, y: 320 }; // farther apart than this and the idle one pops over
const ROCKET_REACH = 22;

export class WonderScene extends Phaser.Scene {
  constructor() {
    super('Wonder');
  }

  init(data) {
    this.planet = data?.planet ?? 'spooky';
    this.from = data?.from ?? null;
    this.landing = data?.landing !== false;
  }

  create() {
    this.session = this.registry.get('input');
    this.session.setJoining(true);
    this.info = wonderById(this.planet);
    this.avatars = [];
    this.leaving = false;
    this.landingNow = false;
    this.starMapOpen = false;
    this.goalDone = false;
    this.partying = false;
    this.focusAt = null;
    this.effects = createEffects(this);
    this.gearView = createGearView(this);
    const onGear = () => this.gearView.refresh();
    this.events.on('gearChanged', onGear);
    this.events.once('shutdown', () => this.events.off('gearChanged', onGear));

    this.mod = WONDER_MODULES[this.planet](this);
    const { world, pad } = this.mod;
    this.rocket = this.add.image(pad.x, pad.y, 'wonder-ship').setOrigin(0.5, 1).setDepth(8);
    this.rocketPrompt = this.add.image(pad.x, pad.y - 92, 'btn-a').setScale(1.5).setDepth(70).setVisible(false);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, world.w, world.h);
    cam.setRoundPixels(true);
    this.cam = { zoom: this.mod.zoom[1], x: pad.x, y: pad.y - 40 };
    cam.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
    cam.fadeIn(400, 20, 12, 30);

    attachAudio(this);
    this.pauseWatch = createPauseWatch(this);
    this.scene.launch('WonderHud', { wonder: this });
    this.events.once('shutdown', () => this.scene.stop('WonderHud'));

    // landing here: the visit is kept, and its sticker
    const { state, first } = markVisited(getState(this.registry), this.planet);
    if (first) setState(this.registry, state);
    this.time.delayedCall(this.landing ? 2600 : 300, () => earnSticker(this, stickerIds(this.planet).visit));
    if (this.landing) this.playLanding();
  }

  // ---------- the rocket ----------

  // The Wonder Rocket comes down onto the pad in flames and dust; everyone pops out.
  playLanding() {
    this.landingNow = true;
    const { x, y } = this.mod.pad;
    this.rocket.setY(y - 260);
    const flame = this.add.sprite(x, this.rocket.y, 'rocket-flame', 0).setOrigin(0.5, 0).setDepth(7);
    const flicker = this.time.addEvent({ delay: 80, loop: true, callback: () => flame.setFrame((Number(flame.frame.name) + 1) % 3) });
    this.tweens.add({
      targets: this.rocket,
      y,
      duration: 2200,
      ease: 'Cubic.easeOut',
      onUpdate: () => flame.setPosition(x, this.rocket.y - 6),
      onComplete: () => {
        flicker.remove();
        flame.destroy();
        this.cameras.main.shake(200, 0.006);
        for (let i = 0; i < 10; i++) {
          const d = this.add.image(x + (i - 4.5) * 8, y - 2, 'smoke').setDepth(9);
          this.tweens.add({ targets: d, x: d.x + (i - 4.5) * 5, y: d.y - 8, scale: 2.5, alpha: 0, duration: 900, onComplete: () => d.destroy() });
        }
        this.events.emit('landed');
        this.time.delayedCall(400, () => {
          this.landingNow = false;
          for (const a of this.avatars.filter(Boolean)) this.popOut(a);
        });
      },
    });
  }

  popOut(a) {
    const { x, y } = this.mod.pad;
    this.mod.place(a, x + (a.slot ? 14 : -14), y);
    a.hidden = false;
    this.effects.sparkle(x, y - 10, 0xffffff, 8);
    this.events.emit('joined', a);
  }

  nearRocket(a) {
    if (!this.mod.onFoot(a)) return false;
    const f = this.mod.focus(a);
    return Math.abs(f.x - this.mod.pad.x) < ROCKET_REACH && Math.abs(f.y - (this.mod.pad.y - 8)) < 40;
  }

  // Press A at the rocket: the star map opens over the planet.
  openStarMap(a) {
    if (this.leaving || this.landingNow || this.starMapOpen || this.partying) return;
    this.starMapOpen = true;
    this.scene.pause();
    this.scene.launch('StarMap', { camp: this, here: this.planet, slot: a.slot });
  }

  // The star map closed (B), or a planet was picked.
  starMapDone(to) {
    this.starMapOpen = false;
    this.scene.resume();
    for (const a of this.avatars.filter(Boolean)) for (const edge of Object.values(a.edges)) edge(true);
    if (to && to !== this.planet) this.flyTo(to);
  }

  // Everyone climbs aboard; lift-off is its own scene.
  flyTo(to) {
    if (this.leaving) return;
    this.leaving = true;
    this.events.emit('tripStart');
    for (const a of this.avatars.filter(Boolean)) {
      a.hidden = true;
      this.effects.sparkle(this.mod.focus(a).x, this.mod.focus(a).y, 0xffffff, 6);
    }
    this.time.delayedCall(500, () => this.cameras.main.fadeOut(400, 20, 12, 30));
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Launch', { from: this.planet, to, ship: 'wonder-ship' });
    });
  }

  // Hold B: back to the rocket, in a whoosh.
  zipHome() {
    this.events.emit('goHome');
    for (const a of this.avatars.filter(Boolean)) {
      const f = this.mod.focus(a);
      this.effects.sparkle(f.x, f.y, 0xff8ac8, 8);
      this.mod.place(a, this.mod.pad.x + (a.slot ? 14 : -14), this.mod.pad.y);
      a.idleT = 0;
    }
    this.effects.sparkle(this.mod.pad.x, this.mod.pad.y - 10, 0xffffff, 10);
  }

  // ---------- players ----------

  avatarFor(slot) {
    if (this.avatars[slot]) return this.avatars[slot];
    const char = charFor(this.registry, slot);
    const a = {
      slot,
      char,
      sprite: this.add.sprite(0, 0, `char-${char}`, 0).setOrigin(0.5, 1).setDepth(30),
      ring: this.add.graphics().setDepth(80),
      edges: { a: createEdge(), up: createEdge(), down: createEdge(), left: createEdge(), right: createEdge(), y: createEdge() },
      homeHold: createHoldTimer(HOME_HOLD_MS),
      walkT: 0,
      idleT: 0,
      hidden: this.landingNow,
    };
    this.avatars[slot] = a;
    // a late joiner pops in next to whoever is already here
    const other = this.avatars.find((o) => o && o !== a && !o.hidden);
    if (other) a.at = this.mod.focus(other);
    this.mod.spawn(a);
    this.gearView.add(a);
    if (!a.hidden) {
      const f = this.mod.focus(a);
      this.effects.sparkle(f.x, f.y, 0xffffff, 8);
      this.events.emit('joined', a);
    }
    return a;
  }

  awake() {
    const all = this.avatars.filter((a) => a && !a.hidden);
    const up = all.filter((a) => !this.session.slots.find((s) => s.slot === a.slot)?.resting);
    return up.length ? up : all;
  }

  // Draw a player's character in the usual way (modules call this with their body).
  drawCharacter(a, body, dt, time, { flipY = false } = {}) {
    animateCharacter(a.sprite, body, a, dt, time);
    a.sprite.setFlipY(flipY);
    if (flipY) a.sprite.setY(Math.round(body.y));
    a.sprite.setVisible(!a.hidden);
  }

  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    if (!this.leaving && this.pauseWatch.update()) return;
    let promptRocket = false;
    for (const { slot, intent } of this.session.slots) {
      const a = this.avatarFor(slot);
      let i = intent ?? IDLE;
      const e = {
        a: a.edges.a(!!i.jump), up: a.edges.up(i.moveY < -0.5), down: a.edges.down(i.moveY > 0.5),
        left: a.edges.left(i.moveX < -0.5), right: a.edges.right(i.moveX > 0.5), y: a.edges.y(!!i.bubble),
      };
      if (i.moveX || i.moveY || i.jump) a.idleT = 0;
      else a.idleT += dt;
      const frozen = this.leaving || a.hidden || this.partying;
      if (!frozen && this.nearRocket(a)) {
        promptRocket = true;
        if (e.a) { this.openStarMap(a); e.a = false; }
        i = { ...i, jump: false }; // (A uses the rocket instead)
      }
      if (frozen) i = IDLE;
      // hold B: back to the rocket
      if (a.homeHold.update(!!(intent && intent.home) && !frozen, deltaMs)) this.zipHome();
      this.mod.step(a, i, frozen ? {} : e, dt, time);
      this.drawHoldRing(a);
    }
    this.rocketPrompt.setVisible(promptRocket).setY(this.mod.pad.y - 92 + Math.sin(time / 200) * 2);
    this.mod.update(dt, time);
    this.gearView.update();
    if (this.mod.regroup !== false) this.regroup(dt);
    this.checkGoal();
    this.updateCamera(dt);
  }

  drawHoldRing(a) {
    const prog = a.homeHold.progress();
    a.ring.clear();
    if (prog <= 0.05 || a.hidden) return;
    const f = this.mod.focus(a);
    const x = f.x;
    const y = f.y - 30;
    a.ring.fillStyle(0x1b1428, 0.6).fillCircle(x, y, 7);
    a.ring.lineStyle(3, 0xff8ac8, 1).beginPath();
    a.ring.arc(x, y, 5.5, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2, false).strokePath();
    a.ring.fillStyle(0xb07ae0, 1).fillRect(x - 1, y - 3, 2, 6);
  }

  // Two players too far apart: the one who's been sitting still pops over
  // next to the other (with a bubble pop), so the camera can keep both.
  regroup(dt) {
    const up = this.awake();
    if (up.length < 2 || this.partying || this.landingNow) { this.apartT = 0; return; }
    const [p, q] = up.map((a) => this.mod.focus(a));
    const far = Math.abs(p.x - q.x) > SPREAD.x || Math.abs(p.y - q.y) > SPREAD.y;
    this.apartT = far ? (this.apartT ?? 0) + dt : 0;
    if (this.apartT < 1.5) return;
    this.apartT = 0;
    const [stay, move] = up[0].idleT <= up[1].idleT ? up : [up[1], up[0]];
    const to = this.mod.focus(stay);
    const from = this.mod.focus(move);
    this.effects.sparkle(from.x, from.y, 0x9ff6ff, 8);
    this.mod.place(move, to.x + (stay.slot < move.slot ? 14 : -14), to.y + 8);
    this.effects.sparkle(to.x, to.y, 0x9ff6ff, 8);
    this.events.emit('bubblePop');
  }

  // ---------- the goal and the prize ----------

  goal() {
    return { kind: this.info.goal.kind, icon: this.info.goal.icon, prize: this.info.prize, done: this.goalDone, need: this.info.goal.need, ...this.mod.goal() };
  }

  checkGoal() {
    if (this.goalDone) return;
    const g = this.mod.goal();
    if (this.info.goal.kind !== 'count' || g.have < g.need) return;
    this.goalDone = true;
    this.events.emit('fanfare');
    this.cameras.main.flash(250, 255, 240, 200);
    const spot = this.mod.ready?.();
    // the camera goes to show where the prize is, then comes back
    if (spot) {
      this.time.delayedCall(500, () => { this.focusAt = { zoom: this.mod.zoom[0], ...spot }; });
      this.time.delayedCall(2600, () => { this.focusAt = null; });
    }
  }

  // Someone reached the prize: the party! (Every time; its sticker and the
  // star map's lit prize come the first time.)
  prizeParty(x, y, { done = () => {} } = {}) {
    if (this.partying) return;
    this.partying = true;
    this.goalDone = true;
    this.focusAt = { x, y: y - 26, zoom: this.mod.zoom[0] };
    this.events.emit('fanfare');
    this.cameras.main.flash(300, 255, 230, 160);
    const prize = this.add.image(x, y, `wprize-${this.info.prize}`).setScale(0).setDepth(90);
    const glow = this.add.image(x, y - 40, 'light').setTint(0xffe9a0).setAlpha(0).setScale(3).setDepth(89).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: prize, y: y - 44, scale: 4, duration: 900, ease: 'Back.easeOut' });
    this.tweens.add({ targets: glow, alpha: 0.6, duration: 900 });
    this.tweens.add({ targets: prize, angle: { from: -6, to: 6 }, duration: 300, yoyo: true, repeat: 6, delay: 900 });
    for (let k = 0; k < 6; k++) this.time.delayedCall(k * 300, () => this.effects.confetti(x + Phaser.Math.Between(-50, 50), y - Phaser.Math.Between(30, 80)));
    for (const a of this.avatars.filter(Boolean)) this.time.delayedCall(400, () => this.mod.cheer?.(a));
    this.time.delayedCall(1200, () => {
      const ids = stickerIds(this.planet);
      const { state, first } = winPrize(getState(this.registry), this.planet);
      if (first) setState(this.registry, state);
      earnSticker(this, ids.prize);
      this.events.emit('party');
    });
    this.time.delayedCall(4200, () => {
      this.tweens.add({ targets: [prize, glow], alpha: 0, duration: 500, onComplete: () => { prize.destroy(); glow.destroy(); } });
      this.partying = false;
      this.focusAt = null;
      done();
    });
  }

  // The planet's fun moment happened (its sticker, once).
  fun() {
    earnSticker(this, stickerIds(this.planet).fun);
  }

  // ---------- the camera ----------

  updateCamera(dt) {
    const pts = this.focusAt ? [this.focusAt] : this.landingNow ? [{ x: this.mod.pad.x, y: this.rocket.y - 30 }] : this.awake().map((a) => this.mod.focus(a));
    if (!pts.length) return;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const [zmin, zmax] = this.mod.zoom;
    const fitX = this.scale.width / (Math.max(...xs) - Math.min(...xs) + 200);
    const fitY = this.scale.height / (Math.max(...ys) - Math.min(...ys) + 140);
    // (a party or a reveal can ask for its own zoom: usually the widest)
    const zoom = this.focusAt?.zoom ?? Phaser.Math.Clamp(Math.min(fitX, fitY), zmin, zmax);
    const lead = this.mod.lead?.() ?? { x: 0, y: 0 };
    const tx = (Math.min(...xs) + Math.max(...xs)) / 2 + lead.x;
    const ty = (Math.min(...ys) + Math.max(...ys)) / 2 + lead.y;
    const k = 1 - Math.exp(-dt * (this.focusAt ? 5 : 6));
    this.cam.zoom += (zoom - this.cam.zoom) * k;
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.cameras.main.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
  }
}
