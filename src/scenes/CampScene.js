import Phaser from 'phaser';
import { createGrid } from '../world/grid.js';
import { B } from '../world/blocks.js';
import { createPlayer, stepPlayer, standAt, playerCell } from '../game/player.js';
import { frameCamera } from '../game/camera.js';
import { BLUEPRINTS, UPGRADE_KINDS, nextUpgrade, buyUpgrade, buildOnPlot, depositPacks, canAfford } from '../game/economy.js';
import { createEdge } from '../input/intents.js';
import { CHARACTERS } from '../art/characters.js';
import { BUILDING_SIZE } from '../art/camp.js';
import { animateCharacter } from './common/avatarView.js';
import { createEffects } from './mine/effects.js';
import { getState, setState } from '../save/store.js';
import { TILE, CAMP, PLAYER, SKY_ROWS } from '../tuning.js';

const W = CAMP.w * TILE;
const GROUND_Y = CAMP.ground * TILE;
const HUD_STRIP = 40;
const IDLE = { moveX: 0, moveY: 0, jump: false, bubble: false, home: false, pause: false };

export class CampScene extends Phaser.Scene {
  constructor() {
    super('Camp');
  }

  init(data) {
    this.arrived = data?.arrived ?? null;
  }

  create() {
    this.session = this.registry.get('input');
    this.session.setJoining(true);
    this.grid = createGrid(CAMP.w, CAMP.h);
    for (let x = 0; x < CAMP.w; x++) {
      this.grid.set(x, CAMP.ground, B.GRASS);
      for (let y = CAMP.ground + 1; y < CAMP.h; y++) this.grid.set(x, y, B.DIRT);
    }
    this.effects = createEffects(this);
    this.avatars = [];
    this.buildings = [];
    this.critters = [];
    this.leaving = false;

    this.drawBackdrop();
    this.drawGround();
    this.drawProps();
    this.placeBuildings();

    const cam = this.cameras.main;
    cam.setBounds(0, -SKY_ROWS * TILE, W, (CAMP.h + SKY_ROWS) * TILE);
    cam.setRoundPixels(true);
    this.cam = { zoom: 1.5, x: CAMP.shaftX * TILE, y: GROUND_Y - 40 };
    cam.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
    cam.fadeIn(400, 20, 12, 30);

    this.scene.launch('CampHud', { camp: this });
    this.events.once('shutdown', () => this.scene.stop('CampHud'));

    if (this.arrived) this.time.delayedCall(500, () => this.depositArrivals());
  }

  // ---------- scenery ----------

  drawBackdrop() {
    const top = -SKY_ROWS * TILE;
    const h = GROUND_Y - top;
    const sky = this.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
    sky.fillGradientStyle(0x5b4b8a, 0x5b4b8a, 0xf7a86b, 0xf7a86b, 1);
    sky.fillRect(-200, top, W + 400, h);
    // the sun, low and warm
    const sun = this.add.graphics().setDepth(-29).setScrollFactor(0.1, 1);
    sun.fillStyle(0xffe6a0, 0.25).fillCircle(300, GROUND_Y - 64, 28);
    sun.fillStyle(0xffd27a, 1).fillCircle(300, GROUND_Y - 64, 16);
    sun.fillStyle(0xfff2c8, 1).fillCircle(296, GROUND_Y - 68, 6);
    // far hills, near hills (parallax)
    const far = this.add.graphics().setDepth(-28).setScrollFactor(0.35, 1);
    far.fillStyle(0x9a86b8, 1);
    for (let i = 0; i < 12; i++) far.fillCircle(i * 110 - 40, GROUND_Y - 6, 70);
    const near = this.add.graphics().setDepth(-27).setScrollFactor(0.6, 1);
    near.fillStyle(0x7fb267, 1);
    for (let i = 0; i < 14; i++) near.fillCircle(i * 95 - 30, GROUND_Y + 12, 58);
    near.fillStyle(0x6aa258, 1);
    for (let i = 0; i < 14; i++) near.fillCircle(i * 95 + 20, GROUND_Y + 24, 50);
    // drifting clouds
    for (let i = 0; i < 6; i++) {
      const c = this.add.graphics().setDepth(-26).setScrollFactor(0.3, 1);
      c.fillStyle(0xffffff, 0.85);
      c.fillRect(0, 0, 30, 7).fillRect(6, -5, 16, 5).fillRect(20, -3, 8, 3);
      c.setPosition(i * 190, top + 16 + (i % 3) * 14);
      this.tweens.add({ targets: c, x: c.x + 120, duration: 40000 + i * 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  drawGround() {
    const map = this.make.tilemap({ width: CAMP.w, height: CAMP.h, tileWidth: TILE, tileHeight: TILE });
    const ts = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 1, 2);
    const layer = map.createBlankLayer('ground', ts).setDepth(10);
    for (let y = 0; y < CAMP.h; y++) for (let x = 0; x < CAMP.w; x++) {
      const id = this.grid.get(x, y);
      if (id !== B.AIR) layer.putTileAt(id, x, y);
    }
  }

  drawProps() {
    // trees behind everything
    for (const x of [1, 8, 13.5, 25.5, 38.5, 52.5, 60.5]) {
      this.add.image(x * TILE, GROUND_Y + 2, 'tree').setOrigin(0.5, 1).setDepth(-5);
    }
    // meadow flowers along the ground
    for (let i = 0; i < 70; i++) {
      const x = 4 + ((i * 97) % (W - 8));
      const f = this.add.image(x, GROUND_Y + 1, 'flower', i % 3).setOrigin(0.5, 1).setDepth(11);
      this.tweens.add({ targets: f, angle: { from: -6, to: 6 }, duration: 1400 + (i % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // mine entrance
    this.add.image(CAMP.shaftX * TILE + TILE / 2, GROUND_Y + 16, 'shaft').setOrigin(0.5, 1).setDepth(12);
    // upgrade bench
    this.add.image(CAMP.benchX * TILE + TILE / 2, GROUND_Y, 'bench').setOrigin(0.5, 1).setDepth(5);
    // campfire with flicker, glow and embers
    const fx = CAMP.fireX * TILE + TILE / 2;
    const glow = this.add.image(fx, GROUND_Y - 6, 'light').setTint(0xffa040).setAlpha(0.28).setScale(1.1).setDepth(6);
    this.tweens.add({ targets: glow, alpha: 0.18, scale: 1.0, duration: 180, yoyo: true, repeat: -1 });
    const fire = this.add.sprite(fx, GROUND_Y, 'fire', 0).setOrigin(0.5, 1).setDepth(7);
    this.time.addEvent({ delay: 120, loop: true, callback: () => fire.setFrame((Number(fire.frame.name) + 1) % 3) });
    this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        const e = this.add.image(fx + Phaser.Math.Between(-3, 3), GROUND_Y - 10, 'pixel').setTint(0xffb34a).setDepth(8).setDisplaySize(1, 1);
        this.tweens.add({ targets: e, y: e.y - 24, x: e.x + Phaser.Math.Between(-6, 6), alpha: 0, duration: 1200, onComplete: () => e.destroy() });
      },
    });
    // fireflies drifting about
    for (let i = 0; i < 10; i++) {
      const f = this.add.image(Phaser.Math.Between(40, W - 40), GROUND_Y - Phaser.Math.Between(12, 60), 'pixel')
        .setTint(0xfff27a).setDepth(20).setDisplaySize(1, 1).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-30, 30), y: f.y + Phaser.Math.Between(-12, 12), duration: 3000 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: f, alpha: { from: 0.2, to: 1 }, duration: 700 + i * 90, yoyo: true, repeat: -1 });
    }
    // plot stakes
    this.stakes = CAMP.plots.map((px) => this.add.image(px * TILE + (CAMP.plotW * TILE) / 2, GROUND_Y, 'stake').setOrigin(0.5, 1).setDepth(5));
    // floating prompts
    this.prompt = this.add.image(0, 0, 'btn-a').setDepth(70).setVisible(false);
    this.downPrompt = this.add.image(0, 0, 'arrow-r').setAngle(90).setDepth(70).setVisible(false);
  }

  placeBuildings() {
    const state = getState(this.registry);
    state.plots.forEach((id, i) => { if (id) this.addBuilding(i, id, false); });
  }

  addBuilding(plot, id, animate) {
    const x = CAMP.plots[plot] * TILE;
    const sprite = this.add.image(x, GROUND_Y, `bld-${id}`).setOrigin(0, 1).setDepth(3);
    this.stakes[plot].setVisible(false);
    const b = { plot, id, sprite, x, t: 0 };
    this.buildings[plot] = b;
    if (animate) {
      sprite.setCrop(0, BUILDING_SIZE.h, BUILDING_SIZE.w, 0);
      this.tweens.addCounter({
        from: 0,
        to: BUILDING_SIZE.h,
        duration: CAMP.buildSeconds * 1000,
        onUpdate: (tw) => {
          // reveal in 8-pixel "block" rows, bottom first
          const shown = Math.floor(tw.getValue() / 8) * 8;
          sprite.setCrop(0, BUILDING_SIZE.h - shown, BUILDING_SIZE.w, shown);
          if (Math.random() < 0.3) this.effects.sparkle(x + Math.random() * BUILDING_SIZE.w, GROUND_Y - shown, 0xffe9a0, 2);
        },
        onComplete: () => {
          sprite.setCrop();
          this.effects.sparkle(x + BUILDING_SIZE.w / 2, GROUND_Y - 40, 0xffffff, 10);
          this.cameras.main.flash(200, 255, 240, 200);
          this.addExtras(b);
          this.events.emit('built', b);
        },
      });
    } else {
      this.addExtras(b);
    }
  }

  // Life for each building: smoke, animals, a waving flag, the minecart.
  addExtras(b) {
    const { x, id } = b;
    if (id === 'house') {
      this.time.addEvent({
        delay: 700,
        loop: true,
        callback: () => {
          const s = this.add.image(x + 71, GROUND_Y - 74, 'smoke').setDepth(2).setAlpha(0.8);
          this.tweens.add({ targets: s, y: s.y - 30, x: s.x + 8, scale: 2, alpha: 0, duration: 2600, onComplete: () => s.destroy() });
        },
      });
    }
    if (id === 'pen') {
      for (let i = 0; i < 4; i++) {
        const key = i % 2 ? 'sheep' : 'pig';
        const s = this.add.sprite(x + 16 + i * 18, GROUND_Y - 4, key, 0).setOrigin(0.5, 1).setDepth(4);
        this.critters.push({ s, minX: x + 12, maxX: x + BUILDING_SIZE.w - 12, vx: 0, t: Math.random() * 2 });
      }
    }
    if (id === 'tower') {
      const flag = this.add.image(x + 49, GROUND_Y - 80, 'flag').setOrigin(0, 0).setDepth(3);
      this.tweens.add({ targets: flag, scaleX: 0.8, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (id === 'minecart') {
      const cart = this.add.sprite(0, 0, 'cart', 0).setOrigin(0.5, 1).setDepth(4);
      this.critters.push({ cart, cx: x + 48, cy: GROUND_Y - 18, t: 0 });
    }
    if (id === 'statue') {
      this.time.addEvent({ delay: 900, loop: true, callback: () => this.effects.sparkle(x + 48 + Phaser.Math.Between(-12, 12), GROUND_Y - 50 + Phaser.Math.Between(-10, 10), 0xd4fbff, 4) });
    }
    if (id === 'garden') {
      for (let i = 0; i < 2; i++) {
        const bf = this.add.image(x + 30 + i * 30, GROUND_Y - 36, 'pixel').setTint(i ? 0xffd1e6 : 0xffffff).setDisplaySize(2, 2).setDepth(4);
        this.tweens.add({ targets: bf, x: bf.x + 20, y: bf.y - 8, duration: 2200 + i * 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: bf, scaleX: 0.3, duration: 120, yoyo: true, repeat: -1 });
      }
    }
  }

  // ---------- players ----------

  avatarFor(slot) {
    if (this.avatars[slot]) return this.avatars[slot];
    const state = getState(this.registry);
    const chars = this.registry.get('characters') ?? state.characters ?? CHARACTERS;
    const char = chars[slot] ?? CHARACTERS[slot];
    const start = standAt(CAMP.shaftX + 1 + slot, CAMP.ground - 1);
    const a = {
      slot,
      char,
      p: createPlayer(start),
      sprite: this.add.sprite(0, 0, `char-${char}`, 0).setOrigin(0.5, 1).setDepth(30),
      edges: { a: createEdge(), b: createEdge(), left: createEdge(), right: createEdge(), down: createEdge() },
      walkT: 0,
    };
    this.avatars[slot] = a;
    animateCharacter(a.sprite, a.p, a, 0, 0);
    this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xffffff, 8);
    return a;
  }

  zoneOf(a) {
    const { cx } = playerCell(a.p);
    if (Math.abs(cx - CAMP.shaftX) <= 1) return { kind: 'shaft' };
    if (Math.abs(cx - CAMP.benchX) <= 1) return { kind: 'bench' };
    const plot = CAMP.plots.findIndex((px) => cx >= px && cx < px + CAMP.plotW);
    if (plot >= 0 && !getState(this.registry).plots[plot]) return { kind: 'plot', plot };
    return null;
  }

  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const hud = this.scene.get('CampHud');
    let prompt = null;
    let downPrompt = null;
    for (const { slot, intent } of this.session.slots) {
      const a = this.avatarFor(slot);
      const i = intent ?? IDLE;
      const e = {
        a: a.edges.a(!!i.jump),
        b: a.edges.b(!!i.home),
        left: a.edges.left(i.moveX < -0.5),
        right: a.edges.right(i.moveX > 0.5),
        down: a.edges.down(i.moveY > 0.5),
      };
      const picking = hud.picker && hud.picker.slot === slot;
      const zone = this.zoneOf(a);
      if (picking) {
        if (e.left) hud.pickerMove(-1);
        if (e.right) hud.pickerMove(1);
        if (e.a) this.confirmPick(hud);
        if (e.b) hud.closePicker();
        stepPlayer(a.p, IDLE, this.grid, { dt, canMine: false });
      } else if (!this.leaving) {
        let move = i;
        if (zone && (zone.kind === 'bench' || zone.kind === 'plot')) {
          move = { ...i, jump: false }; // A opens the picker here instead of jumping
          if (e.a && !hud.picker) this.openPicker(hud, a, zone);
        }
        if (zone && zone.kind === 'shaft' && e.down) this.startTrip();
        stepPlayer(a.p, move, this.grid, { dt, canMine: false });
        if (zone && zone.kind !== 'shaft' && !hud.picker) prompt = zone;
        if (zone && zone.kind === 'shaft') downPrompt = true;
      }
      a.p.x = Phaser.Math.Clamp(a.p.x, 2, W - PLAYER.w - 2);
      animateCharacter(a.sprite, a.p, a, dt, time);
    }

    // floating prompts over the thing you can use
    const bob = Math.sin(time / 200) * 2;
    if (prompt) {
      const x = prompt.kind === 'bench' ? CAMP.benchX * TILE + TILE / 2 : CAMP.plots[prompt.plot] * TILE + (CAMP.plotW * TILE) / 2;
      this.prompt.setVisible(true).setPosition(x, GROUND_Y - 34 + bob);
    } else {
      this.prompt.setVisible(false);
    }
    this.downPrompt.setVisible(!!downPrompt).setPosition(CAMP.shaftX * TILE + TILE / 2, GROUND_Y - 42 + bob);

    this.stepCritters(dt, time);
    this.updateCamera(dt);
  }

  stepCritters(dt, time) {
    for (const c of this.critters) {
      if (c.cart) {
        c.t += dt * 0.8;
        const x = c.cx + Math.cos(c.t) * 40;
        const y = c.cy + Math.sin(c.t) * 12 + 6;
        c.cart.setPosition(x, y).setDepth(Math.sin(c.t) > 0 ? 6 : 2).setFlipX(Math.sin(c.t) > 0);
        continue;
      }
      c.t -= dt;
      if (c.t <= 0) {
        c.vx = [-12, 0, 0, 12][Math.floor(Math.random() * 4)];
        c.t = 1 + Math.random() * 2;
      }
      c.s.x = Phaser.Math.Clamp(c.s.x + c.vx * dt, c.minX, c.maxX);
      if (c.s.x === c.minX || c.s.x === c.maxX) c.vx = -c.vx;
      if (c.vx) c.s.setFlipX(c.vx < 0).setFrame(Math.floor(time / 200) % 2);
      else c.s.setFrame(0);
    }
  }

  updateCamera(dt) {
    const pts = this.avatars.filter(Boolean).map((a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y }));
    if (!pts.length) pts.push({ x: CAMP.shaftX * TILE, y: GROUND_Y - 20 });
    const f = frameCamera(pts, { w: this.scale.width, h: this.scale.height - HUD_STRIP }, { minZoom: 0.9, maxZoom: 1.5, margin: 60 });
    f.y = GROUND_Y - 44 - HUD_STRIP / 2 / f.zoom;
    const k = 1 - Math.exp(-dt * 4);
    this.cam.zoom += (f.zoom - this.cam.zoom) * k;
    this.cam.x += (f.x - this.cam.x) * k;
    this.cam.y += (f.y - this.cam.y) * k;
    this.cameras.main.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
  }

  // ---------- actions ----------

  openPicker(hud, a, zone) {
    const state = getState(this.registry);
    if (zone.kind === 'bench') {
      hud.openPicker({
        slot: a.slot,
        kind: 'upgrade',
        options: UPGRADE_KINDS.map((kind) => {
          const next = nextUpgrade(state, kind);
          return { id: kind, level: state.upgrades[kind], cost: next?.cost ?? null, affordable: !!next && canAfford(state.bank, next.cost) };
        }),
      });
    } else {
      const built = new Set(state.plots.filter(Boolean));
      const options = BLUEPRINTS.filter((b) => !built.has(b.id))
        .map((b) => ({ id: b.id, cost: b.cost, affordable: canAfford(state.bank, b.cost) }));
      if (!options.length) return;
      hud.openPicker({ slot: a.slot, kind: 'blueprint', plot: zone.plot, options });
    }
  }

  confirmPick(hud) {
    const pick = hud.picker;
    const opt = pick.options[pick.index];
    const state = getState(this.registry);
    let next = null;
    if (pick.kind === 'upgrade') next = buyUpgrade(state, opt.id);
    else next = buildOnPlot(state, pick.plot, opt.id);
    if (!next) {
      hud.pickerNope();
      this.events.emit('nope');
      return;
    }
    setState(this.registry, next);
    hud.closePicker();
    hud.syncBank(next.bank);
    if (pick.kind === 'blueprint') this.addBuilding(pick.plot, opt.id, true);
    else {
      const bench = { x: CAMP.benchX * TILE + TILE / 2, y: GROUND_Y - 20 };
      this.effects.sparkle(bench.x, bench.y, 0xffe066, 12);
      this.cameras.main.flash(150, 255, 240, 180);
      this.events.emit('upgraded', opt.id);
    }
  }

  depositArrivals() {
    const packs = this.arrived.packs;
    const hud = this.scene.get('CampHud');
    const state = setState(this.registry, { ...depositPacks(getState(this.registry), packs), trips: (getState(this.registry).trips ?? 0) + 1 });
    hud.flyOres(packs, this.avatars, state.bank);
    this.arrived = null;
  }

  startTrip() {
    if (this.leaving) return;
    this.leaving = true;
    const hud = this.scene.get('CampHud');
    hud.closePicker();
    this.events.emit('tripStart');
    for (const a of this.avatars.filter(Boolean)) {
      this.tweens.add({ targets: a.p, x: CAMP.shaftX * TILE + 2, duration: 300 });
    }
    this.cameras.main.fadeOut(500, 20, 12, 30);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Mine', { seed: (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0, upgrades: getState(this.registry).upgrades });
    });
  }
}
