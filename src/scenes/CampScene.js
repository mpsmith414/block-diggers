import Phaser from 'phaser';
import { createGrid } from '../world/grid.js';
import { B } from '../world/blocks.js';
import { createPlayer, stepPlayer, standAt, playerCell } from '../game/player.js';
import { frameCamera } from '../game/camera.js';
import {
  UPGRADE_KINDS, nextUpgrade, buyUpgrade, buildOnPlot, depositPacks, canAfford, blueprintsFor, plotsOf, blueprintOk,
} from '../game/economy.js';
import { createEdge } from '../input/intents.js';
import { CHARACTERS } from '../art/characters.js';
import { BUILDING_SIZE } from '../art/camp.js';
import { animateCharacter } from './common/avatarView.js';
import { createEffects } from './mine/effects.js';
import { varyTile } from '../art/tileVariety.js';
import { getState, setState } from '../save/store.js';
import { PHASES, phaseForTrips } from '../game/timeOfDay.js';
import { attachAudio } from '../audio/wire.js';
import { createPauseWatch } from './common/pauseWatch.js';
import { createPerksView } from './camp/perksView.js';
import { createCampPets } from './camp/campPets.js';
import { createDecorView } from './camp/decorView.js';
import { createVisitorsView } from './camp/visitorsView.js';
import { BUYABLE, buyDecor, decorById, decorUnlocked } from '../game/decor.js';
import { refreshRequests, presentVisitors } from '../game/visitors.js';
import { createRng } from '../world/rng.js';
import { earnSticker } from './common/stickers.js';
import { growGarden, leavePenGift, elevatorStops, campGift, winSuitPiece, hasSuit, walkMul, winSunHeart } from '../game/perks.js';
import { drawMoonBackdrop, drawMoonProps } from './camp/moonScenery.js';
import { drawMarsBackdrop, drawMarsProps } from './camp/marsScenery.js';
import { drawSaturnBackdrop, drawSaturnProps } from './camp/saturnScenery.js';
import { drawDinoBackdrop, drawDinoProps } from './camp/dinoScenery.js';
import { drawSunBackdrop, drawSunProps } from './camp/sunScenery.js';
import { planetById, rocketTo, PLANETS } from '../game/planets.js';
import { createSuitView } from './common/suitView.js';
import { summarizeTrip } from '../game/trip.js';
import { TILE, CAMP, PLAYER, SKY_ROWS } from '../tuning.js';

const GROUND_Y = CAMP.ground * TILE;
const HUD_STRIP = 40;
const IDLE = { moveX: 0, moveY: 0, jump: false, bubble: false, home: false, pause: false };
// the rocket buildings (each opens the star map), and the ground of each camp
const ROCKETS = ['rocket', 'marsrocket', 'saturnrocket', 'dinorocket', 'sunrocket'];
const GROUND = { earth: [B.GRASS, B.DIRT], moon: [B.MOONROCK, B.MOONROCK], mars: [B.MARS_ROCK, B.MARS_ROCK], saturn: [B.SNOW, B.SNOW], dino: [B.GRASS, B.DIRT], sun: [B.CORONA_ROCK, B.CORONA_ROCK] };
// each camp's sky and scenery (Earth's are drawn here in the scene)
const SCENERY = {
  moon: [drawMoonBackdrop, drawMoonProps], mars: [drawMarsBackdrop, drawMarsProps], saturn: [drawSaturnBackdrop, drawSaturnProps],
  dino: [drawDinoBackdrop, drawDinoProps], sun: [drawSunBackdrop, drawSunProps],
};
// the big ship that flies a route: the rocket of the farther planet (the
// Rocket Ship to the Moon, the Mars Rocket to Mars, the Saturn Rocket to Saturn)
const SHIP = { moon: 'rocket-ship', mars: 'mars-ship', saturn: 'saturn-ship', dino: 'dino-ship', sun: 'sun-ship' };
const order = (id) => PLANETS.findIndex((p) => p.id === id);
export const shipFor = (from, to) => SHIP[order(from) > order(to) ? from : to] ?? 'rocket-ship';
// where each rocket building's ship stands, from the left of its plot
const SHIP_X = { rocket: 48, marsrocket: 52, saturnrocket: 40, dinorocket: 52, sunrocket: 40 };

export class CampScene extends Phaser.Scene {
  constructor() {
    super('Camp');
  }

  init(data) {
    this.arrived = data?.arrived ?? null;
    this.planetArg = data?.planet ?? data?.arrived?.planet ?? null;
    this.landing = !!data?.landing;
    this.from = data?.from ?? null;
    this.fromYard = !!data?.fromYard;
  }

  create() {
    this.session = this.registry.get('input');
    this.session.setJoining(true);
    // which camp: Earth's, or Moon Base (you come back to the camp you left from)
    const saved = getState(this.registry);
    this.planet = this.planetArg ?? saved.planet ?? 'earth';
    this.onEarth = this.planet === 'earth';
    this.L = planetById(this.planet)?.camp ?? CAMP;
    this.walkMul = walkMul(saved);
    this.W = this.L.w * TILE;
    if (saved.planet !== this.planet) setState(this.registry, { ...saved, planet: this.planet });
    this.grid = createGrid(this.L.w, this.L.h);
    for (let x = 0; x < this.L.w; x++) {
      const [top, under] = GROUND[this.planet] ?? GROUND.earth;
      this.grid.set(x, this.L.ground, top);
      for (let y = this.L.ground + 1; y < this.L.h; y++) this.grid.set(x, y, under);
    }
    this.effects = createEffects(this);
    this.avatars = [];
    this.buildings = [];
    this.critters = [];
    this.leaving = false;
    this.arriving = !!this.arrived; // summary + deposit in progress: the mine waits
    this.landingNow = false;
    this.starMapOpen = false;
    // arriving home counts as the next trip for the sky
    const trips = (getState(this.registry).trips ?? 0) + (this.arrived ? 1 : 0);
    this.phase = phaseForTrips(trips);

    const sky = { W: this.W, top: -SKY_ROWS * TILE, groundY: GROUND_Y };
    const [backdrop, props] = SCENERY[this.planet] ?? [];
    if (this.onEarth) this.drawBackdrop();
    else backdrop(this, sky);
    this.drawGround();
    if (this.onEarth) this.drawProps();
    else props(this, { L: this.L, groundY: GROUND_Y });
    this.drawCommonProps();
    this.placeBuildings();
    // the building perks, decorating and visitors live at Earth camp
    this.perks = this.onEarth ? createPerksView(this) : null;
    this.campPets = createCampPets(this);
    this.suits = createSuitView(this);
    // visitors need a request; make sure everyone present has one
    if (this.onEarth) {
      const st = getState(this.registry);
      if (presentVisitors(st).some((id) => !st.visitors.requests[id] && !this.arrived)) {
        const fresh = refreshRequests(st, createRng(Date.now() >>> 0)).visitors.requests;
        setState(this.registry, { ...st, visitors: { ...st.visitors, requests: { ...fresh, ...st.visitors.requests } } });
      }
    }
    this.decor = this.onEarth ? createDecorView(this) : null;
    this.visitors = this.onEarth ? createVisitorsView(this) : null;
    this.perks?.refresh();
    // older saves: back-fill stickers for buildings already standing
    for (const id of plotsOf(getState(this.registry), this.planet)) if (id) earnSticker(this, `bld-${id}`, { quiet: true });
    if (!this.onEarth) earnSticker(this, `trip-${this.planet}base`);

    const cam = this.cameras.main;
    cam.setBounds(0, -SKY_ROWS * TILE, this.W, (this.L.h + SKY_ROWS) * TILE);
    cam.setRoundPixels(true);
    const startX = this.landing ? this.rocketX(this.from) : this.fromYard ? this.W - 4 * TILE : this.L.shaftX * TILE;
    this.cam = { zoom: 1.5, x: startX, y: GROUND_Y - 40 };
    cam.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
    cam.fadeIn(400, 20, 12, 30);

    attachAudio(this);
    this.pauseWatch = createPauseWatch(this);
    this.scene.launch('CampHud', { camp: this });
    this.events.once('shutdown', () => this.scene.stop('CampHud'));

    if (this.arrived) this.time.delayedCall(500, () => this.showSummary());
    if (this.landing) this.playLanding();
  }

  // ---------- scenery ----------

  drawBackdrop() {
    const ph = PHASES[this.phase];
    const top = -SKY_ROWS * TILE;
    const h = GROUND_Y - top;
    const W = this.W;
    const sky = this.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
    sky.fillGradientStyle(ph.skyTop, ph.skyTop, ph.skyBottom, ph.skyBottom, 1);
    sky.fillRect(-200, top, W + 400, h);
    const orb = this.add.graphics().setDepth(-29).setScrollFactor(0.1, 1);
    if (ph.sun) {
      orb.fillStyle(0xffe6a0, 0.25).fillCircle(ph.sun.x, GROUND_Y - ph.sun.y, 28);
      orb.fillStyle(ph.sun.color, 1).fillCircle(ph.sun.x, GROUND_Y - ph.sun.y, 16);
      orb.fillStyle(0xfff8e0, 1).fillCircle(ph.sun.x - 4, GROUND_Y - ph.sun.y - 4, 6);
    }
    // after the finale: the mini-sun hangs over Earth camp forever, gently pulsing
    if (getState(this.registry).sunHeart) {
      // (above the night's dimming, so it glows in the dark too)
      const ms = this.add.image(250, GROUND_Y - 92, 'mini-sun').setDepth(26).setScrollFactor(0.15, 1).setScale(1.4);
      const halo = this.add.image(ms.x, ms.y, 'light').setDepth(26).setScrollFactor(0.15, 1).setTint(0xffd84a).setAlpha(0.4).setScale(1)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: ms, scale: 1.55, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: halo, alpha: 0.2, scale: 1.8, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.time.delayedCall(1200, () => earnSticker(this, 'sun-minisun'));
    }
    if (ph.moon) {
      // twinkling stars and a crescent moon
      for (let i = 0; i < 60; i++) {
        const st = this.add.image((i * 173) % (W + 200) - 100, top + ((i * 61) % (h - 40)), 'pixel')
          .setDepth(-29).setScrollFactor(0.15, 1).setDisplaySize(1, 1).setTint(0xfff6d0);
        this.tweens.add({ targets: st, alpha: { from: 0.2, to: 1 }, duration: 800 + (i % 7) * 300, yoyo: true, repeat: -1 });
      }
      orb.fillStyle(0xfff6d0, 0.15).fillCircle(ph.moon.x, GROUND_Y - ph.moon.y, 26);
      orb.fillStyle(0xfff6d0, 1).fillCircle(ph.moon.x, GROUND_Y - ph.moon.y, 13);
      orb.fillStyle(ph.skyTop, 1).fillCircle(ph.moon.x + 6, GROUND_Y - ph.moon.y - 4, 11);
    }
    // far hills, near hills (parallax)
    const far = this.add.graphics().setDepth(-28).setScrollFactor(0.35, 1);
    far.fillStyle(ph.far, 1);
    for (let i = 0; i < 12; i++) far.fillCircle(i * 110 - 40, GROUND_Y - 6, 70);
    const near = this.add.graphics().setDepth(-27).setScrollFactor(0.6, 1);
    near.fillStyle(ph.near[0], 1);
    for (let i = 0; i < 14; i++) near.fillCircle(i * 95 - 30, GROUND_Y + 12, 58);
    near.fillStyle(ph.near[1], 1);
    for (let i = 0; i < 14; i++) near.fillCircle(i * 95 + 20, GROUND_Y + 24, 50);
    // drifting clouds
    for (let i = 0; i < 6; i++) {
      const c = this.add.graphics().setDepth(-26).setScrollFactor(0.3, 1);
      c.fillStyle(0xffffff, ph.clouds);
      c.fillRect(0, 0, 30, 7).fillRect(6, -5, 16, 5).fillRect(20, -3, 8, 3);
      c.setPosition(i * 190, top + 16 + (i % 3) * 14);
      this.tweens.add({ targets: c, x: c.x + 120, duration: 40000 + i * 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // night: dim the scenery (lights and players are drawn above this)
    if (ph.night) {
      this.add.rectangle(-200, top, W + 400, h + this.L.h * TILE, 0x1a1e48, ph.night)
        .setOrigin(0).setDepth(25).setBlendMode(Phaser.BlendModes.MULTIPLY);
    }
  }

  drawGround() {
    const map = this.make.tilemap({ width: this.L.w, height: this.L.h, tileWidth: TILE, tileHeight: TILE });
    const ts = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 1, 2);
    const layer = map.createBlankLayer('ground', ts).setDepth(10);
    for (let y = 0; y < this.L.h; y++) for (let x = 0; x < this.L.w; x++) {
      const id = this.grid.get(x, y);
      if (id !== B.AIR) varyTile(layer.putTileAt(id, x, y), x, y);
    }
  }

  drawProps() {
    const W = this.W;
    // trees behind everything
    for (const x of [1, 8, 13.5, 25.5, 38.5, 52.5, 60.5, 69, 76, 82]) {
      this.add.image(x * TILE, GROUND_Y + 2, 'tree').setOrigin(0.5, 1).setDepth(-5);
    }
    // the gate to the Build Yard, at the right end
    this.add.image(W - 1.5 * TILE, GROUND_Y + 1, 'yard-gate').setOrigin(0.5, 1).setDepth(4);
    // meadow flowers along the ground
    for (let i = 0; i < 116; i++) {
      const x = 4 + ((i * 97) % (W - 8));
      const f = this.add.image(x, GROUND_Y + 1, 'flower', i % 3).setOrigin(0.5, 1).setDepth(11);
      this.tweens.add({ targets: f, angle: { from: -6, to: 6 }, duration: 1400 + (i % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // mine entrance
    this.add.image(CAMP.shaftX * TILE + TILE / 2, GROUND_Y + 16, 'shaft').setOrigin(0.5, 1).setDepth(12);
    // the market stall
    this.add.image(CAMP.stallX * TILE + TILE / 2, GROUND_Y, 'stall').setOrigin(0.5, 1).setDepth(3);
    // the sticker book on its lectern
    this.add.image(CAMP.lecternX * TILE + TILE / 2, GROUND_Y, 'lectern').setOrigin(0.5, 1).setDepth(5);
    // upgrade bench
    this.add.image(CAMP.benchX * TILE + TILE / 2, GROUND_Y, 'bench').setOrigin(0.5, 1).setDepth(5);
    // campfire with flicker, glow and embers
    const fx = CAMP.fireX * TILE + TILE / 2;
    const night = PHASES[this.phase].night > 0;
    const glow = this.add.image(fx, GROUND_Y - 6, 'light').setTint(0xffa040).setAlpha(night ? 0.5 : 0.28).setScale(night ? 2.2 : 1.1).setDepth(night ? 26 : 6);
    if (night) glow.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: glow, alpha: 0.18, scale: 1.0, duration: 180, yoyo: true, repeat: -1 });
    const fire = this.add.sprite(fx, GROUND_Y, 'fire', 0).setOrigin(0.5, 1).setDepth(night ? 26 : 7);
    this.time.addEvent({ delay: 120, loop: true, callback: () => fire.setFrame((Number(fire.frame.name) + 1) % 3) });
    this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        const e = this.add.image(fx + Phaser.Math.Between(-3, 3), GROUND_Y - 10, 'pixel').setTint(0xffb34a).setDepth(8).setDisplaySize(1, 1);
        this.tweens.add({ targets: e, y: e.y - 24, x: e.x + Phaser.Math.Between(-6, 6), alpha: 0, duration: 1200, onComplete: () => e.destroy() });
      },
    });
    // fireflies drifting about (more at night)
    for (let i = 0; i < PHASES[this.phase].fireflies; i++) {
      const f = this.add.image(Phaser.Math.Between(40, W - 40), GROUND_Y - Phaser.Math.Between(12, 60), 'pixel')
        .setTint(0xfff27a).setDepth(27).setDisplaySize(1, 1).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-30, 30), y: f.y + Phaser.Math.Between(-12, 12), duration: 3000 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: f, alpha: { from: 0.2, to: 1 }, duration: 700 + i * 90, yoyo: true, repeat: -1 });
    }
  }

  // Stakes on empty plots, floating prompts and stars: the same at every camp.
  drawCommonProps() {
    const L = this.L;
    this.stakes = L.plots.map((px) => this.add.image(px * TILE + (L.plotW * TILE) / 2, GROUND_Y, 'stake').setOrigin(0.5, 1).setDepth(5));
    // floating prompts
    this.prompt = this.add.image(0, 0, 'btn-a').setDepth(70).setVisible(false);
    // gold stars point at things you can afford right now
    this.benchStar = this.add.image(0, 0, 'star').setDepth(69).setVisible(false);
    this.plotStar = this.add.image(0, 0, 'star').setDepth(69).setVisible(false);
    this.downPrompt = this.add.image(0, 0, 'arrow-r').setAngle(90).setDepth(70).setVisible(false);
  }

  placeBuildings() {
    plotsOf(getState(this.registry), this.planet).forEach((id, i) => { if (id) this.addBuilding(i, id, false); });
  }

  addBuilding(plot, id, animate) {
    const x = this.L.plots[plot] * TILE;
    const sprite = this.add.image(x, GROUND_Y, `bld-${id}`).setOrigin(0, 1).setDepth(3);
    this.stakes[plot].setVisible(false);
    const b = { plot, id, sprite, x, t: 0, building: animate };
    this.buildings[plot] = b;
    if (animate) {
      sprite.setCrop(0, BUILDING_SIZE.h, BUILDING_SIZE.w, 0);
      this.tweens.addCounter({
        from: 0,
        to: BUILDING_SIZE.h,
        duration: this.L.buildSeconds * 1000,
        onUpdate: (tw) => {
          // reveal in 8-pixel "block" rows, bottom first
          const shown = Math.floor(tw.getValue() / 8) * 8;
          sprite.setCrop(0, BUILDING_SIZE.h - shown, BUILDING_SIZE.w, shown);
          if (Math.random() < 0.3) this.effects.sparkle(x + Math.random() * BUILDING_SIZE.w, GROUND_Y - shown, 0xffe9a0, 2);
          if (shown !== b.lastShown) { b.lastShown = shown; this.events.emit('building', b); }
        },
        onComplete: () => {
          sprite.setCrop();
          b.building = false;
          this.perks?.refresh();
          earnSticker(this, `bld-${id}`);
          this.effects.sparkle(x + BUILDING_SIZE.w / 2, GROUND_Y - 40, 0xffffff, 10);
          this.cameras.main.flash(200, 255, 240, 200);
          this.addExtras(b);
          this.effects.confetti(x + BUILDING_SIZE.w / 2, GROUND_Y - 50);
          for (const a of this.avatars) if (a && a.p.grounded) a.p.vy = -170;
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
    if (id === 'house' && PHASES[this.phase].night) {
      for (const wx of [26, 70]) {
        this.add.image(x + wx, GROUND_Y - 26, 'light').setTint(0xffc860).setAlpha(0.45).setScale(0.5).setDepth(26).setBlendMode(Phaser.BlendModes.ADD);
      }
    }
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
    if (id === 'workshop') {
      // a little wind-up robot toddles about outside
      const s = this.add.sprite(x + 20, GROUND_Y, 'toyrobot', 0).setOrigin(0.5, 1).setDepth(4);
      this.critters.push({ s, minX: x - 30, maxX: x + BUILDING_SIZE.w + 30, vx: 0, t: 0.5 });
      this.time.addEvent({ delay: 1600, loop: true, callback: () => this.effects.sparkle(x + 48, GROUND_Y - 62, 0xc0c8d8, 2) });
    }
    if (id === 'rocket') {
      // steam puffs at the launch pad; the rocket is ready to go
      this.time.addEvent({
        delay: 900,
        loop: true,
        callback: () => {
          for (const dx of [-8, 8]) {
            const s = this.add.image(x + 48 + dx, GROUND_Y - 4, 'smoke').setDepth(4).setAlpha(0.7);
            this.tweens.add({ targets: s, x: s.x + dx * 2, y: s.y - 6, scale: 2, alpha: 0, duration: 1400, onComplete: () => s.destroy() });
          }
        },
      });
    }
    // Moon Base
    if (id === 'cheesefactory') {
      // space mice scurry about, and the chimney puffs little cheesy clouds
      for (let i = 0; i < 2; i++) {
        const s = this.add.sprite(x + 20 + i * 40, GROUND_Y, 'mouse', 0).setOrigin(0.5, 1).setDepth(4).setScale(0.8);
        this.critters.push({ s, minX: x - 10, maxX: x + BUILDING_SIZE.w + 10, vx: 0, t: i });
      }
      this.time.addEvent({
        delay: 800,
        loop: true,
        callback: () => {
          const c = this.add.image(x + 82, GROUND_Y - 80, 'smoke').setDepth(2).setTintFill(0xfff0a0).setAlpha(0.7);
          this.tweens.add({ targets: c, y: c.y - 26, x: c.x + 6, scale: 2, alpha: 0, duration: 2200, onComplete: () => c.destroy() });
        },
      });
    }
    if (id === 'telescope') {
      this.time.addEvent({ delay: 700, loop: true, callback: () => this.effects.sparkle(x + 71 + Phaser.Math.Between(-3, 3), GROUND_Y - 71, 0x9ff6ff, 3) });
    }
    if (id === 'hangar') {
      // the friendly alien's UFO hovers over its hangar
      const ufo = this.add.sprite(x + 48, GROUND_Y - 62, 'ufo', 0).setOrigin(0.5, 1).setDepth(4).setScale(0.7);
      this.tweens.add({ targets: ufo, y: ufo.y - 6, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.hangarUfo = ufo;
    }
    if (id === 'marsrocket') {
      this.time.addEvent({
        delay: 900,
        loop: true,
        callback: () => {
          for (const dx of [-12, 0, 12]) {
            const s = this.add.image(x + 52 + dx, GROUND_Y - 2, 'smoke').setDepth(4).setAlpha(0.7);
            this.tweens.add({ targets: s, x: s.x + dx, y: s.y - 6, scale: 2, alpha: 0, duration: 1400, onComplete: () => s.destroy() });
          }
        },
      });
    }
    // Mars Base
    if (id === 'robotfactory') {
      // little robots toddle about, and bolts pop out of the chimney
      for (let i = 0; i < 2; i++) {
        const s = this.add.sprite(x + 14 + i * 50, GROUND_Y, 'toyrobot', 0).setOrigin(0.5, 1).setDepth(4);
        this.critters.push({ s, minX: x - 10, maxX: x + BUILDING_SIZE.w + 10, vx: 0, t: i * 0.7 });
      }
      this.time.addEvent({
        delay: 1400,
        loop: true,
        callback: () => {
          const b = this.add.image(x + 77, GROUND_Y - 74, 'ore-bolt').setDepth(2).setScale(0.8);
          this.tweens.add({ targets: b, y: b.y - 20, x: b.x + Phaser.Math.Between(-10, 10), angle: 360, alpha: 0, duration: 1100, ease: 'Quad.easeOut', onComplete: () => b.destroy() });
        },
      });
    }
    if (id === 'weather') {
      // the anemometer spins, and the station's dish blinks
      const cups = this.add.sprite(x + 72, GROUND_Y - 72, 'anemometer', 0).setOrigin(0.5, 1).setDepth(4);
      this.time.addEvent({ delay: 120, loop: true, callback: () => cups.setFrame(cups.frame.name === 0 ? 1 : 0) });
      this.time.addEvent({ delay: 1100, loop: true, callback: () => this.effects.sparkle(x + 28, GROUND_Y - 60, 0xff5a5a, 2) });
    }
    if (id === 'garage') {
      // the rover drives out and back
      const rover = this.add.sprite(x + 48, GROUND_Y, 'rover-car', 0).setOrigin(0.5, 1).setDepth(4);
      this.critters.push({ s: rover, minX: x - 20, maxX: x + BUILDING_SIZE.w + 20, vx: 0, t: 0.3, fast: true });
    }
    if (id === 'saturnrocket') {
      this.time.addEvent({
        delay: 900,
        loop: true,
        callback: () => {
          for (const dx of [-12, 0, 12]) {
            const s = this.add.image(x + 40 + dx, GROUND_Y - 2, 'smoke').setDepth(4).setAlpha(0.7);
            this.tweens.add({ targets: s, x: s.x + dx, y: s.y - 6, scale: 2, alpha: 0, duration: 1400, onComplete: () => s.destroy() });
          }
        },
      });
    }
    // Dino Camp
    if (id === 'nursery') {
      // baby dinos toddle about outside
      for (let i = 0; i < 2; i++) {
        const s = this.add.sprite(x + 10 + i * 30, GROUND_Y, 'raptor', 0).setOrigin(0.5, 1).setDepth(4).setScale(0.7);
        this.critters.push({ s, minX: x - 10, maxX: x + 50, vx: 0, t: i * 0.6 });
      }
    }
    if (id === 'treehouse') {
      // the lookout flag waves, and a firefly or two drifts in the leaves
      this.time.addEvent({ delay: 900, loop: true, callback: () => this.effects.sparkle(x + 48 + Phaser.Math.Between(-24, 24), GROUND_Y - 66 + Phaser.Math.Between(-8, 8), 0xfff27a, 2) });
    }
    if (id === 'pteroperch') {
      // the ptero taxi circles over its perch
      const ptero = this.add.sprite(x + 48, GROUND_Y - 70, 'ptero-taxi', 0).setDepth(4);
      this.tweens.add({ targets: ptero, x: x + 70, y: GROUND_Y - 80, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', onYoyo: () => ptero.setFlipX(true), onRepeat: () => ptero.setFlipX(false) });
      this.time.addEvent({ delay: 220, loop: true, callback: () => ptero.setFrame(ptero.frame.name === 0 ? 1 : 0) });
    }
    if (id === 'sunrocket') {
      this.time.addEvent({
        delay: 900,
        loop: true,
        callback: () => {
          for (const dx of [-12, 0, 12]) {
            const s = this.add.image(x + 40 + dx, GROUND_Y - 2, 'smoke').setDepth(4).setAlpha(0.7).setTint(0xffe0a0);
            this.tweens.add({ targets: s, x: s.x + dx, y: s.y - 6, scale: 2, alpha: 0, duration: 1400, onComplete: () => s.destroy() });
          }
        },
      });
    }
    // Solar Station
    if (id === 'sunflowers') {
      // the big sunflowers nod, and a sunstone pops out now and then
      this.time.addEvent({
        delay: 1700,
        loop: true,
        callback: () => {
          const c = this.add.image(x + 48 + Phaser.Math.Between(-26, 26), GROUND_Y - 62, 'ore-sunstone').setDepth(2);
          this.tweens.add({ targets: c, y: c.y - 16, alpha: 0, duration: 1000, ease: 'Quad.easeOut', onComplete: () => c.destroy() });
        },
      });
    }
    if (id === 'sundial') {
      // its shadow creeps around the dial
      const hand = this.add.rectangle(x + 48, GROUND_Y - 52, 20, 2, 0x5a3214, 0.5).setOrigin(1, 0.5).setDepth(4);
      this.tweens.add({ targets: hand, angle: 360, duration: 12000, repeat: -1 });
    }
    if (id === 'sunbeam') {
      // sparkles slide down the beam
      this.time.addEvent({
        delay: 400,
        loop: true,
        callback: () => {
          const s = this.add.image(x + 48 + Phaser.Math.Between(-6, 6), GROUND_Y - 66, 'pixel').setTint(0xffffff).setDisplaySize(2, 2).setDepth(4);
          this.tweens.add({ targets: s, y: GROUND_Y - 4, alpha: 0, duration: 1200, onComplete: () => s.destroy() });
        },
      });
    }
    if (id === 'hall') {
      // the crown on the roof twinkles
      this.time.addEvent({ delay: 700, loop: true, callback: () => this.effects.sparkle(x + 48 + Phaser.Math.Between(-6, 6), GROUND_Y - 68 + Phaser.Math.Between(-4, 4), 0xffd84a, 2) });
    }
    // Ring Station
    if (id === 'parlour') {
      // a penguin comes for ice cream, and little cones pop out of the roof
      const s = this.add.sprite(x + 20, GROUND_Y, 'penguin', 0).setOrigin(0.5, 1).setDepth(4);
      this.critters.push({ s, minX: x - 10, maxX: x + BUILDING_SIZE.w + 10, vx: 0, t: 0.4 });
      this.time.addEvent({
        delay: 1500,
        loop: true,
        callback: () => {
          const c = this.add.image(x + 48, GROUND_Y - 78, 'ore-icecream').setDepth(2);
          this.tweens.add({ targets: c, y: c.y - 18, x: c.x + Phaser.Math.Between(-12, 12), alpha: 0, duration: 1100, ease: 'Quad.easeOut', onComplete: () => c.destroy() });
        },
      });
    }
    if (id === 'lighthouse') {
      // the lamp's beam sweeps back and forth
      const beam = this.add.triangle(x + 48, GROUND_Y - 66, 0, 0, 80, -9, 80, 9, 0xfff6a0, 0.35).setOrigin(0, 0.5).setDepth(2).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: beam, angle: { from: -160, to: -20 }, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.time.addEvent({ delay: 800, loop: true, callback: () => this.effects.sparkle(x + 48, GROUND_Y - 66, 0xfff6a0, 2) });
    }
    if (id === 'skilift') {
      // chairs ride the cable up the slope and back
      const chair = this.add.sprite(x + 30, GROUND_Y - 54, 'ski-chair', 0).setOrigin(0.5, 0).setDepth(4);
      this.tweens.add({
        targets: chair, x: x + 90, y: GROUND_Y - 73, duration: 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        onYoyo: () => chair.setFrame(1), onRepeat: () => chair.setFrame(0),
      });
    }
    if (id === 'dinorocket') {
      this.time.addEvent({
        delay: 900,
        loop: true,
        callback: () => {
          for (const dx of [-12, 0, 12]) {
            const s = this.add.image(x + 52 + dx, GROUND_Y - 2, 'smoke').setDepth(4).setAlpha(0.7);
            this.tweens.add({ targets: s, x: s.x + dx, y: s.y - 6, scale: 2, alpha: 0, duration: 1400, onComplete: () => s.destroy() });
          }
        },
      });
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
    // arriving by rocket: you start inside it (hidden until the door opens)
    // (back from the Build Yard: you come in through its gate, at the right end)
    const start = this.landingNow ? { ...standAt(0, this.L.ground - 1), x: this.rocketX(this.from) - PLAYER.w / 2 }
      : this.fromYard ? standAt(this.L.w - 3 - slot, this.L.ground - 1) : standAt(this.L.shaftX + 1 + slot, this.L.ground - 1);
    const a = {
      slot,
      char,
      p: createPlayer(start),
      sprite: this.add.sprite(0, 0, `char-${char}`, 0).setOrigin(0.5, 1).setDepth(30),
      edges: { a: createEdge(), b: createEdge(), y: createEdge(), left: createEdge(), right: createEdge(), down: createEdge() },
      walkT: 0,
    };
    this.avatars[slot] = a;
    animateCharacter(a.sprite, a.p, a, 0, 0);
    this.suits.add(a);
    if (this.landingNow) a.sprite.setAlpha(0);
    else this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xffffff, 8);
    this.events.emit('joined', a);
    return a;
  }

  zoneOf(a) {
    const L = this.L;
    const { cx } = playerCell(a.p);
    if (Math.abs(cx - L.shaftX) <= 1) return { kind: 'shaft' };
    if (Math.abs(cx - L.benchX) <= 1) return { kind: 'bench' };
    if (cx === L.lecternX) return { kind: 'lectern' };
    if (this.onEarth && Math.abs(cx - L.stallX) <= 1) return { kind: 'stall' };
    if (L.padX && Math.abs(cx - L.padX) <= 2) return { kind: 'rocket', x: L.padX * TILE + TILE / 2 };
    const plot = L.plots.findIndex((px) => cx >= px && cx < px + L.plotW);
    const here = plot >= 0 ? plotsOf(getState(this.registry), this.planet)[plot] : undefined;
    const ready = plot >= 0 && this.buildings[plot] && !this.buildings[plot].building;
    if (plot >= 0 && !here) return { kind: 'plot', plot };
    // the elevator (the minecart, the Moon's UFO, the Mars rover); rockets open the star map
    if (here && here === planetById(this.planet)?.perks?.elevator && ready) return { kind: 'cart', plot };
    if (ROCKETS.includes(here) && ready) return { kind: 'rocket', plot, x: L.plots[plot] * TILE + (L.plotW * TILE) / 2 };
    // the Hall of Heroes: press A to play the finale again
    if (here === 'hall' && ready) return { kind: 'hall', plot, x: L.plots[plot] * TILE + (L.plotW * TILE) / 2 };
    return null;
  }

  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    if (!this.leaving && this.pauseWatch.update()) return;
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
        y: a.edges.y(!!i.bubble),
      };
      if (e.y && !this.leaving) this.campPets.trick(a);
      if (this.landingNow) {
        // still coming down in the rocket
        a.sprite.setAlpha(0);
        continue;
      }
      const picking = hud.picker && hud.picker.slot === slot;
      const zone = this.zoneOf(a);
      if (picking) {
        if (e.left) hud.pickerMove(-1);
        if (e.right) hud.pickerMove(1);
        if (e.a) this.confirmPick(hud);
        if (e.b) hud.closePicker();
        stepPlayer(a.p, IDLE, this.grid, { dt, canMine: false });
      } else if (!this.leaving) {
        // what A does here, in priority order: place what you carry, help a
        // friend, use the thing you're standing at, pick up a decoration
        let move = i;
        let action = null;
        const friend = !a.carrying && this.visitors?.near(a);
        const decorIndex = !a.carrying && !friend && !zone && this.decor ? this.decor.under(a) : -1;
        if (a.carrying) {
          action = { x: a.p.x + PLAYER.w / 2, key: this.decor.canDrop(a) ? 'btn-a' : null };
          if (e.a) {
            if (this.decor.place(a)) this.events.emit('place');
            else { this.events.emit('nope'); this.cameras.main.shake(80, 0.003); }
          }
          if (e.b) this.decor.stow(a);
        } else if (friend) {
          action = { x: friend.x, key: 'btn-a', y: GROUND_Y - 44 };
          if (e.a) this.visitors.give(friend);
        } else if (zone && zone.kind === 'lectern') {
          action = { x: this.L.lecternX * TILE + TILE / 2, key: 'btn-a' };
          if (e.a && !hud.picker) {
            this.scene.pause();
            this.scene.launch('Book', { target: 'Camp' });
          }
        } else if (zone && zone.kind === 'rocket') {
          action = { x: zone.x, key: 'btn-a', y: GROUND_Y - 90 };
          if (e.a && !hud.picker) this.openStarMap(a);
        } else if (zone && zone.kind === 'hall' && !this.partying) {
          action = { x: zone.x, key: 'btn-a', y: GROUND_Y - 92 };
          if (e.a && !hud.picker && !this.partying && !this.arriving && !this.leaving) this.finaleParty();
        } else if (zone && (zone.kind === 'bench' || zone.kind === 'plot' || zone.kind === 'cart' || zone.kind === 'stall')) {
          const x = zone.kind === 'bench' ? this.L.benchX * TILE + TILE / 2
            : zone.kind === 'stall' ? this.L.stallX * TILE + TILE / 2
              : this.L.plots[zone.plot] * TILE + (this.L.plotW * TILE) / 2;
          action = { x, key: 'btn-a', zone };
          if (e.a && !hud.picker) this.openPicker(hud, a, zone);
        } else if (decorIndex >= 0) {
          action = { x: getState(this.registry).decor.placed[decorIndex].x, key: 'icon-hand' };
          if (e.a) {
            this.decor.pickUp(a, decorIndex);
            this.events.emit('pickerOpen');
          }
        }
        if (action) move = { ...i, jump: false }; // A acts here instead of jumping
        if (zone && zone.kind === 'shaft' && e.down) this.startTrip();
        if (stepPlayer(a.p, move, this.grid, { dt, canMine: false, walkMul: this.walkMul }).jumped) this.events.emit('jump', a);
        if (action && action.key && !hud.picker) prompt = action;
        if (zone && zone.kind === 'shaft') downPrompt = true;
      }
      // through the gate at the right end of Earth camp: the Build Yard
      if (this.onEarth && !this.leaving && !this.arriving && !a.carrying && a.p.x >= this.W - PLAYER.w - 3 && i.moveX > 0.5) this.goToYard();
      a.p.x = Phaser.Math.Clamp(a.p.x, 2, this.W - PLAYER.w - 2);
      animateCharacter(a.sprite, a.p, a, dt, time);
      if (this.onEarth) this.pondDrink(a, dt, time);
    }

    // floating prompts over the thing you can use
    const bob = Math.sin(time / 200) * 2;
    if (prompt) {
      this.prompt.setTexture(prompt.key).setVisible(true).setPosition(prompt.x, (prompt.y ?? GROUND_Y - 34) + bob);
    } else {
      this.prompt.setVisible(false);
    }
    // a planet whose mine you've never been down: the way down always shows
    this.newPlanet = !this.onEarth && !(getState(this.registry).records?.planetDeepest?.[this.planet] > 0);
    this.downPrompt.setVisible(!!downPrompt || (this.newPlanet && !this.arriving)).setPosition(this.L.shaftX * TILE + TILE / 2, GROUND_Y - 42 + bob);

    this.updateStars(time, prompt);
    this.perks?.update(time);
    this.campPets.update(dt, time);
    this.decor?.update(time);
    this.visitors?.update(dt, time);
    this.suits.update();
    this.stepCritters(dt, time);
    this.updateCamera(dt);
  }

  // Stand still at the pond for a moment and you have a big drink (and a burp).
  pondDrink(a, dt, time) {
    const cx = a.p.x + PLAYER.w / 2;
    const atPond = !a.carrying && a.p.grounded && a.p.vx === 0
      && getState(this.registry).decor.placed.some((d) => d.id === 'pond' && Math.abs(d.x - cx) < 14);
    a.pondT = atPond ? (a.pondT ?? 0) + dt : 0;
    if (a.drinking > 0) {
      a.drinking -= dt;
      a.sprite.setAngle(a.p.facing * 18 + Math.sin(time / 60) * 4);
      if (a.drinking <= 0) {
        a.sprite.setAngle(0);
        this.events.emit('burp', a);
        const bub = this.add.image(a.sprite.x + a.p.facing * 6, a.sprite.y - 12, 'burp').setDepth(62).setScale(0.3);
        this.tweens.add({ targets: bub, scale: 1.4, y: bub.y - 30, duration: 900, ease: 'Sine.easeOut', onComplete: () => { this.effects.sparkle(bub.x, bub.y, 0xc8f0ff, 8); bub.destroy(); } });
        earnSticker(this, 'adv-drink');
        a.pondT = -3; // a little rest before the next drink
      }
    } else if (a.pondT > 1) {
      a.drinking = 1.4;
      this.events.emit('glug', a);
    }
  }

  updateStars(time, prompt) {
    const state = getState(this.registry);
    const hud = this.scene.get('CampHud');
    const counting = hud && hud.counting;
    const bob = Math.sin(time / 250) * 2;
    const pulse = 1 + Math.sin(time / 180) * 0.15;
    const upgrade = UPGRADE_KINDS.some((k) => {
      const n = nextUpgrade(state, k);
      return n && canAfford(state.bank, n.cost);
    });
    const benchPrompted = prompt && prompt.zone && prompt.zone.kind === 'bench';
    this.benchStar.setVisible(upgrade && !counting && !benchPrompted)
      .setPosition(this.L.benchX * TILE + TILE / 2, GROUND_Y - 36 + bob).setScale(pulse);
    const plots = plotsOf(state, this.planet);
    const built = new Set(plots.filter(Boolean));
    const blueprint = blueprintsFor(this.planet).some((b) => !built.has(b.id) && canAfford(state.bank, b.cost) && blueprintOk(state, b));
    const plot = plots.findIndex((p) => !p);
    const plotPrompted = prompt && prompt.zone && prompt.zone.kind === 'plot';
    this.plotStar.setVisible(blueprint && plot >= 0 && !counting && !plotPrompted && !this.buildings[plot])
      .setPosition(this.L.plots[Math.max(0, plot)] * TILE + (this.L.plotW * TILE) / 2, GROUND_Y - 36 + bob).setScale(pulse);

    // a star you can't see gets an arrow at the edge of the screen
    const view = this.cameras.main.worldView;
    let side = 0;
    for (const s of [this.benchStar, this.plotStar, this.downPrompt]) {
      if (!s.visible) continue;
      if (s.x > view.right) side = side || 1;
      else if (s.x < view.x) side = side || -1;
    }
    if (hud && hud.pointTo) hud.pointTo(side, time);
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
      c.s.x = Phaser.Math.Clamp(c.s.x + c.vx * (c.fast ? 3 : 1) * dt, c.minX, c.maxX);
      if (c.s.x === c.minX || c.s.x === c.maxX) c.vx = -c.vx;
      if (c.vx) c.s.setFlipX(c.vx < 0).setFrame(Math.floor(time / 200) % 2);
      else c.s.setFrame(0);
    }
  }

  updateCamera(dt) {
    const pts = this.landingNow ? [{ x: this.rocketX(this.from), y: GROUND_Y - 30 }] : this.avatars.filter(Boolean).map((a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y }));
    if (!pts.length) pts.push({ x: this.L.shaftX * TILE, y: GROUND_Y - 20 });
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
    if (zone.kind === 'cart') {
      // the elevator: any layer you've reached (the deepest one first)
      const stops = elevatorStops(state, this.planet);
      const deepest = stops.map((s) => s.open).lastIndexOf(true);
      hud.openPicker({
        slot: a.slot,
        kind: 'elevator',
        planet: this.planet,
        index: deepest,
        options: stops.map((s) => ({ id: s.layer, row: s.row, cost: null, affordable: s.open })),
      });
      return;
    }
    if (zone.kind === 'stall') {
      const stockIds = Object.keys(state.decor.stock).filter((id) => state.decor.stock[id] > 0);
      const ids = [...new Set([...stockIds, ...BUYABLE.filter((d) => decorUnlocked(state, d.id)).map((d) => d.id)])];
      hud.openPicker({
        slot: a.slot,
        kind: 'decor',
        options: ids.map((id) => {
          const stock = state.decor.stock[id] ?? 0;
          const cost = decorById(id).cost;
          return { id, cost: stock ? null : cost, stock, affordable: stock > 0 || (!!cost && canAfford(state.bank, cost)) };
        }),
      });
      return;
    }
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
      const built = new Set(plotsOf(state, this.planet).filter(Boolean));
      const options = blueprintsFor(this.planet).filter((b) => !built.has(b.id))
        .map((b) => ({ id: b.id, cost: b.cost, needs: b.needs?.suit ?? (b.needs?.sunHeart ? 'sunHeart' : null), affordable: canAfford(state.bank, b.cost) && blueprintOk(state, b) }));
      if (!options.length) return;
      hud.openPicker({ slot: a.slot, kind: 'blueprint', plot: zone.plot, options });
    }
  }

  confirmPick(hud) {
    const pick = hud.picker;
    const opt = pick.options[pick.index];
    const state = getState(this.registry);
    let next = null;
    if (pick.kind === 'elevator') {
      if (!opt.affordable) {
        hud.pickerNope();
        this.events.emit('nope');
        return;
      }
      this.startTrip({ startRow: opt.row });
      return;
    }
    if (pick.kind === 'decor') {
      const a = this.avatars[pick.slot];
      if (!opt.stock) {
        const bought = buyDecor(state, opt.id);
        if (!bought) {
          hud.pickerNope();
          this.events.emit('nope');
          return;
        }
        setState(this.registry, bought);
      }
      hud.closePicker();
      hud.syncBank(getState(this.registry).bank);
      this.decor.carry(a, opt.id);
      this.events.emit('upgraded');
      return;
    }
    if (pick.kind === 'upgrade') next = buyUpgrade(state, opt.id);
    else next = buildOnPlot(state, pick.plot, opt.id, this.planet);
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
      const bench = { x: this.L.benchX * TILE + TILE / 2, y: GROUND_Y - 20 };
      this.effects.sparkle(bench.x, bench.y, 0xffe066, 12);
      this.cameras.main.flash(150, 255, 240, 180);
      this.events.emit('upgraded', opt.id);
    }
  }

  // The trip card first (records, stickers), then the ores fly into the bank.
  showSummary() {
    const { packs, deepest = 0, chests = 0, stickers = [], planet = 'earth' } = this.arrived;
    let state = leavePenGift(growGarden(getState(this.registry)));
    const summary = summarizeTrip({ packs, deepest, chests, stickers, planet }, state.records);
    state = setState(this.registry, { ...refreshRequests({ ...state, records: summary.records }, createRng(Date.now() >>> 0)) });
    this.perks?.refresh();
    this.visitors?.refreshBubbles();
    const chars = this.registry.get('characters') ?? state.characters ?? CHARACTERS;
    this.scene.launch('Summary', { summary, packs, chars, onDone: () => this.depositArrivals() });
  }

  depositArrivals() {
    const packs = this.arrived.packs;
    const hud = this.scene.get('CampHud');
    const hearts = this.arrived.hearts ?? 0;
    // a planet's heart brings that planet's Sun Suit piece
    const piece = planetById(this.arrived.planet ?? this.planet)?.suit;
    const suitHearts = this.arrived.suitHearts ?? this.arrived.moonHearts ?? 0;
    const newPiece = suitHearts > 0 && piece && !hasSuit(getState(this.registry), piece) ? piece : null;
    let banked = depositPacks(getState(this.registry), packs, { hearts });
    if (newPiece) banked = winSuitPiece(banked, newPiece);
    // the Sun's Heart: a crown for everyone, and the grand finale
    const sunHeart = suitHearts > 0 && (this.arrived.planet ?? this.planet) === 'sun';
    if (sunHeart) banked = winSunHeart(banked);
    // each camp's own gift: dinosaurs dig up amber at home, space mice make
    // cheese on the Moon, robots build bolts on Mars
    const park = campGift(banked, this.planet);
    const state = setState(this.registry, { ...park.state, trips: (getState(this.registry).trips ?? 0) + 1 });
    const flyTime = hud.flyOres(packs, this.avatars, state.bank);
    // the Heart of the World and the dino park's amber arrive after the packs
    const a0 = this.avatars.find(Boolean);
    if (hearts) this.time.delayedCall(flyTime, () => hud.flyList(a0 ? a0.sprite.x : this.L.shaftX * TILE, GROUND_Y - 20, Array(hearts).fill('heart'), state.bank));
    if (park.ores.length) {
      const giver = planetById(this.planet).perks.gift.building;
      const px = this.L.plots[plotsOf(state, this.planet).indexOf(giver)] * TILE + 48;
      this.time.delayedCall(flyTime + 300, () => hud.flyList(px, GROUND_Y - 30, park.ores, state.bank));
    }
    const eggs = this.arrived.eggs ?? [];
    this.time.delayedCall(flyTime + 400, () => {
      if (newPiece) this.suitParty(newPiece, () => { this.arriving = false; if (eggs.length) this.campPets.hatchAll(eggs); });
      else if (sunHeart) this.finaleParty(() => { this.arriving = false; if (eggs.length) this.campPets.hatchAll(eggs); });
      else {
        this.arriving = false;
        if (eggs.length) this.campPets.hatchAll(eggs);
      }
    });
    this.arrived = null;
  }

  // Where the ship for a trip to (or from) `other` stands: the rocket building
  // that flies there (Earth's Rocket Ship, the Moon's Mars Rocket), or the pad.
  rocketBuilding(other) {
    if (this.onEarth) return 'rocket';
    const r = rocketTo(other);
    return r && r.at === this.planet ? r.id : null;
  }

  rocketX(other = null) {
    const id = this.rocketBuilding(other);
    if (!id) return this.L.padX * TILE + TILE / 2;
    const plot = plotsOf(getState(this.registry), this.planet).indexOf(id);
    // (rockets on towers stand a little off their plot's middle)
    return plot >= 0 ? this.L.plots[plot] * TILE + (SHIP_X[id] ?? 48) : this.L.shaftX * TILE;
  }

  // Press A at a rocket: the star map opens over the camp.
  openStarMap(a) {
    if (this.leaving || this.arriving || this.starMapOpen) return;
    this.starMapOpen = true;
    this.scene.get('CampHud').closePicker();
    this.scene.pause();
    this.scene.launch('StarMap', { camp: this, here: this.planet, slot: a.slot });
  }

  // The star map closed (B), or a planet was picked.
  starMapDone(to) {
    this.starMapOpen = false;
    this.scene.resume();
    // fresh edges, so the button that closed the map doesn't also press here
    for (const a of this.avatars.filter(Boolean)) for (const edge of Object.values(a.edges)) edge(true);
    if (to && to !== this.planet) this.flyTo(to);
  }

  // Everyone climbs aboard; lift-off is its own scene.
  flyTo(to) {
    if (this.leaving || this.arriving) return;
    this.campPets.flush();
    this.leaving = true;
    this.events.emit('tripStart');
    const door = this.rocketX(to);
    for (const a of this.avatars.filter(Boolean)) {
      this.tweens.add({ targets: a.p, x: door - PLAYER.w / 2, duration: 500 });
      this.tweens.add({ targets: a.sprite, alpha: 0, delay: 450, duration: 250 });
    }
    this.time.delayedCall(800, () => this.cameras.main.fadeOut(400, 20, 12, 30));
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Launch', { from: this.planet, to, ship: shipFor(this.planet, to) });
    });
  }

  // Arriving by rocket: it comes down onto the pad in flames and dust, and
  // everyone pops out.
  playLanding() {
    this.arriving = true;
    this.landingNow = true;
    const x = this.rocketX(this.from);
    const ship = this.add.image(x, GROUND_Y - 4 - 260, shipFor(this.from, this.planet)).setOrigin(0.5, 1).setDepth(8);
    const flame = this.add.sprite(x, ship.y, 'rocket-flame', 0).setOrigin(0.5, 0).setDepth(7);
    const flicker = this.time.addEvent({ delay: 80, loop: true, callback: () => flame.setFrame((Number(flame.frame.name) + 1) % 3) });
    // hide what stands there now (it is the rocket coming in)
    const building = this.rocketBuilding(this.from);
    const standing = building ? this.buildings.find((b) => b && b.id === building)?.sprite : this.padRocket;
    if (standing) standing.setVisible(false);
    this.tweens.add({
      targets: ship,
      y: GROUND_Y - 4,
      duration: 2200,
      ease: 'Cubic.easeOut',
      onUpdate: () => flame.setPosition(x, ship.y - 6),
      onComplete: () => {
        flicker.remove();
        flame.destroy();
        this.cameras.main.shake(200, 0.006);
        for (let i = 0; i < 10; i++) {
          const d = this.add.image(x + (i - 4.5) * 8, GROUND_Y - 2, 'smoke').setDepth(9).setTint({ earth: 0xd8c8b0, moon: 0xc8c8d8, mars: 0xe0886a, saturn: 0xf0f8ff, dino: 0xd8c8b0, sun: 0xffd890 }[this.planet] ?? 0xc8c8d8);
          this.tweens.add({ targets: d, x: d.x + (i - 4.5) * 5, y: d.y - 8, scale: 2.5, alpha: 0, duration: 900, onComplete: () => d.destroy() });
        }
        this.events.emit('built');
        this.time.delayedCall(400, () => {
          if (standing) { standing.setVisible(true); ship.destroy(); }
          else ship.setDepth(3);
          for (const a of this.avatars.filter(Boolean)) {
            a.p.x = x - PLAYER.w / 2 + (a.slot ? 10 : -10);
            a.sprite.setAlpha(1);
            this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xffffff, 8);
            a.p.vy = -150;
          }
          this.landingNow = false;
          if (!this.arrived) this.arriving = false;
        });
      },
    });
  }

  // A planet's Heart came home: its Sun Suit piece! Confetti, a fanfare, and
  // the piece drops onto everyone (the Helmet onto heads, the Boots onto feet).
  suitParty(piece, done) {
    earnSticker(this, `suit-${piece}`);
    this.events.emit('fanfare');
    this.cameras.main.flash(300, 200, 240, 255);
    const key = piece === 'helmet' ? 'suit-helmet' : `suit-${piece}`;
    for (const a of this.avatars.filter(Boolean)) {
      const h = this.add.image(a.sprite.x, a.sprite.y - 90, key).setOrigin(0.5, 1).setDepth(40).setScale(piece === 'helmet' ? 2 : 3);
      for (let i = 0; i < 3; i++) this.time.delayedCall(i * 250, () => this.effects.confetti(a.sprite.x + (i - 1) * 16, a.sprite.y - 30));
      this.tweens.add({
        targets: h, y: a.sprite.y, scale: 1, duration: 1100, ease: 'Bounce.easeOut',
        onComplete: () => {
          h.destroy();
          this.suits.refresh();
          a.p.vy = -170;
          this.effects.sparkle(a.sprite.x, a.sprite.y - 12, { helmet: 0x9ff6ff, boots: 0xffa050, gloves: 0xffd84a, jetpack: 0xff8a2a }[piece] ?? 0xffffff, 12);
        },
      });
    }
    this.time.delayedCall(1800, done);
  }

  // The grand finale (the Sun's Heart came home, or A in the Hall of Heroes):
  // a gold flash and a fanfare, fireworks, every pet doing tricks, the camp
  // friends hopping in, a giant trophy bouncing down, and a crown for everyone.
  finaleParty(done = () => {}) {
    this.partying = true;
    const cam = this.cameras.main;
    const mid = cam.midPoint.x;
    const top = cam.worldView.y;
    this.events.emit('fanfare');
    cam.flash(500, 255, 220, 120);
    // fireworks across the sky
    const COLORS = [0xffd84a, 0xff6a8a, 0x6ad0ff, 0x7aff9a, 0xffffff, 0xb070ff, 0xff9a2a];
    for (let i = 0; i < 14; i++) {
      this.time.delayedCall(300 + i * 380, () => {
        const x = mid + Phaser.Math.Between(-150, 150);
        const y = top + Phaser.Math.Between(24, 90);
        const color = COLORS[i % COLORS.length];
        this.events.emit('firework');
        for (let k = 0; k < 18; k++) {
          const ang = (k / 18) * Math.PI * 2;
          const p = this.add.image(x, y, 'pixel').setTint(k % 3 ? color : 0xffffff).setDisplaySize(3, 3).setDepth(45);
          this.tweens.add({
            targets: p, x: x + Math.cos(ang) * 46, y: y + Math.sin(ang) * 46 + 12, alpha: 0, duration: 1100, ease: 'Quad.easeOut', onComplete: () => p.destroy(),
          });
        }
        this.effects.sparkle(x, y, color, 6);
      });
    }
    // every pet does tricks, over and over
    for (let i = 0; i < 4; i++) this.time.delayedCall(600 + i * 1000, () => this.campPets.trick());
    // the camp friends pop in and hop
    const friends = ['bear', 'rabbit', 'owl'].map((id, i) => {
      const f = this.add.sprite(mid - 90 + i * 90, GROUND_Y + 30, `friend-${id}`, 0).setOrigin(0.5, 1).setDepth(28);
      this.tweens.add({ targets: f, y: GROUND_Y, duration: 400, delay: 800 + i * 250, ease: 'Back.easeOut' });
      this.tweens.add({ targets: f, y: GROUND_Y - 14, duration: 260, delay: 1400 + i * 250, yoyo: true, repeat: 7, ease: 'Quad.easeOut' });
      return f;
    });
    // the giant gold trophy bounces down in the middle
    // (beside the players, not on top of them)
    const a0 = this.avatars.find(Boolean);
    const tx = a0 ? a0.sprite.x + (a0.sprite.x + 90 < cam.worldView.right - 30 ? 80 : -80) : mid;
    const trophy = this.add.image(tx, top - 60, 'trophy-big').setOrigin(0.5, 1).setDepth(27).setScale(1.5);
    const shine = this.add.image(tx, GROUND_Y - 34, 'light').setTint(0xffd84a).setAlpha(0).setScale(1.3).setDepth(26).setBlendMode(Phaser.BlendModes.ADD);
    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: trophy, y: GROUND_Y, duration: 1200, ease: 'Bounce.easeOut' });
      this.tweens.add({ targets: shine, alpha: 0.35, duration: 800, delay: 900 });
    });
    this.time.delayedCall(2900, () => {
      this.effects.confetti(tx, GROUND_Y - 40);
      this.effects.sparkle(tx, GROUND_Y - 40, 0xffd84a, 16);
      this.events.emit('party');
      earnSticker(this, 'sun-finale');
    });
    // …and a gold crown lands on everyone
    this.time.delayedCall(3600, () => {
      for (const a of this.avatars.filter(Boolean)) {
        const c = this.add.image(a.sprite.x, a.sprite.y - 100, 'crown-icon').setOrigin(0.5, 1).setDepth(46).setScale(3);
        this.tweens.add({
          targets: c, y: a.sprite.y - 16, scale: 1, duration: 1000, ease: 'Bounce.easeOut',
          onComplete: () => {
            c.destroy();
            this.suits.refresh();
            a.p.vy = -170;
            this.effects.sparkle(a.sprite.x, a.sprite.y - 18, 0xffd84a, 12);
          },
        });
      }
      earnSticker(this, 'sun-crown');
    });
    // it all settles: the friends wave goodbye, the trophy shines and fades
    this.time.delayedCall(8200, () => {
      for (const f of friends) this.tweens.add({ targets: f, y: GROUND_Y + 30, alpha: 0, duration: 500, onComplete: () => f.destroy() });
      this.tweens.add({ targets: [trophy, shine], alpha: 0, duration: 800, onComplete: () => { trophy.destroy(); shine.destroy(); } });
      this.partying = false;
      done();
    });
  }

  // Off to the Build Yard (through the gate at the right end of Earth camp).
  goToYard() {
    this.leaving = true;
    this.campPets.flush();
    this.scene.get('CampHud').closePicker();
    this.cameras.main.fadeOut(400, 20, 12, 30);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Build'));
  }

  startTrip({ startRow = null } = {}) {
    if (this.leaving || this.arriving) return;
    this.campPets.flush();
    this.leaving = true;
    const hud = this.scene.get('CampHud');
    hud.closePicker();
    this.events.emit('tripStart');
    for (const a of this.avatars.filter(Boolean)) {
      this.tweens.add({ targets: a.p, x: this.L.shaftX * TILE + 2, duration: 300 });
    }
    this.cameras.main.fadeOut(500, 20, 12, 30);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const state = getState(this.registry);
      this.scene.start('Mine', {
        seed: (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0,
        upgrades: state.upgrades,
        startRow,
        planet: this.planet,
      });
    });
  }
}
