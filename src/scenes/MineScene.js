import Phaser from 'phaser';
import { generateMine, carveStation } from '../world/worldgen.js';
import { generateMoon } from '../world/moon.js';
import { createRng } from '../world/rng.js';
import { B, dropOf } from '../world/blocks.js';
import { createPlayer, stepPlayer, standAt, playerCell, knockback } from '../game/player.js';
import { discovery } from '../game/trip.js';
import { CAVE_KINDS, DINO_KINDS } from '../game/pets.js';
import { createPowerups, touchLava, stepPowerups, multipliers } from '../game/powerups.js';
import {
  createBackpack, addOre, packFull, createPickup, stepPickups, collectPickups, chestLoot, attractPickups, scatterOres,
} from '../game/loot.js';
import { frameCamera, wallLimits, applySoftWall, isOffscreen } from '../game/camera.js';
import { stepBubble } from '../game/bubble.js';
import { createEdge, createHoldTimer } from '../input/intents.js';
import { CHARACTERS } from '../art/characters.js';
import { createMapView } from './mine/mapView.js';
import { createDarkness } from './mine/darkness.js';
import { createEffects } from './mine/effects.js';
import { createHazards } from './mine/hazardsView.js';
import { createDecorView } from './mine/decorView.js';
import { getState } from '../save/store.js';
import { packCap, revealsChests, luck } from '../game/perks.js';
import { createFindsView } from './mine/findsView.js';
import { createPetsView } from './mine/petsView.js';
import { earnSticker } from './common/stickers.js';
import { animateCharacter } from './common/avatarView.js';
import { attachAudio } from '../audio/wire.js';
import { createPauseWatch } from './common/pauseWatch.js';
import {
  TILE, MINE_W, MINE_H, SKY_ROWS, SHAFT_X, PLAYER, BACKPACK, LANTERN, PICKUP, CAMERA, BUBBLE, BONK, HOME_HOLD_MS,
  LAYERS, LOW_GRAVITY,
} from '../tuning.js';

const GLINT_COLORS = {
  coal: 0x9a96a8, iron: 0xf5d2b8, gold: 0xffe066, diamond: 0x9ff6ff, emerald: 0x8affb0, amber: 0xffc060, brick: 0xff7a6a, star: 0xfffbe0,
};
const HUD_STRIP = 36; // screen pixels at the top used by the HUD
const DEFAULT_UPGRADES = { pick: 0, pack: 0, lantern: 0 };

export class MineScene extends Phaser.Scene {
  constructor() {
    super('Mine');
  }

  init(data) {
    this.seed = data?.seed ?? (Date.now() >>> 0);
    this.upgrades = data?.upgrades ?? this.registry.get('upgrades') ?? DEFAULT_UPGRADES;
    this.startRow = data?.startRow ?? null;
    this.moon = data?.world === 'moon';
  }

  create() {
    this.session = this.registry.get('input');
    const saved = getState(this.registry);
    this.eggKinds = CAVE_KINDS.filter((k) => !(saved.pets ?? []).includes(k));
    const dinoEggKinds = DINO_KINDS.filter((k) => !(saved.pets ?? []).includes(k));
    this.luck = luck(saved);
    this.world = this.moon ? generateMoon(this.seed) : generateMine(this.seed, { luck: this.luck, eggKinds: this.eggKinds, dinoEggKinds });
    this.grid = this.world.grid;
    if (this.moon) this.startRow = null;
    if (this.startRow) carveStation(this.world, SHAFT_X, this.startRow);
    this.rng = createRng(this.seed ^ 0x9e3779b9);
    // Phaser reuses this object across trips: reset all per-trip state here.
    this.avatars = [];
    this.pickups = [];
    this.pickupSprites = new Map();
    this.goingHome = false;
    this.offscreenGraceUntil = 0;
    this.glintT = 0;
    this.trip = { deepest: 0, chests: 0, stickers: [] };
    this.knownLayers = [...(saved.records?.layers ?? [])];
    this.seenChests = new Set();
    this.revealAll = revealsChests(getState(this.registry));
    this.scanT = 0;
    // scene events outlive a restart, so remove this listener when the trip ends
    const onSticker = (id) => { if (!this.trip.stickers.includes(id)) this.trip.stickers.push(id); };
    this.events.on('sticker', onSticker);
    this.events.once('shutdown', () => this.events.off('sticker', onSticker));

    if (this.moon) this.drawSpace(); else this.drawSky();
    this.mapView = createMapView(this, this.grid, { moon: this.moon });
    if (this.moon) this.drawLander(); else this.drawEntrance();
    if (this.startRow) this.drawStation();
    this.effects = createEffects(this);
    this.decor = createDecorView(this, this.world.decor);
    this.firstTrip = (getState(this.registry)?.trips ?? 0) === 0;
    this.dugCount = 0;
    this.hazards = createHazards(this);
    this.finds = createFindsView(this);
    this.pets = createPetsView(this, saved.pets ?? []);
    const rows = this.grid.h;
    this.darkness = createDarkness(this, { w: MINE_W * TILE, h: rows * TILE });
    this.lavaCells = [];
    this.meteorites = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < MINE_W; x++) {
        const id = this.grid.get(x, y);
        if (id === B.LAVA) this.lavaCells.push({ x, y });
        else if (id === B.METEORITE) this.meteorites.push({ x, y });
      }
    }

    const cam = this.cameras.main;
    cam.setBounds(0, -SKY_ROWS * TILE, MINE_W * TILE, (rows + SKY_ROWS) * TILE);
    cam.setRoundPixels(true);
    this.cam = { zoom: CAMERA.maxZoom, x: SHAFT_X * TILE, y: (this.startRow ?? -1) * TILE };
    cam.setZoom(this.cam.zoom);
    cam.centerOn(this.cam.x, this.cam.y);
    this.wall = wallLimits({ w: this.scale.width, h: this.scale.height });

    attachAudio(this);
    this.pauseWatch = createPauseWatch(this);
    this.scene.launch('Hud', { source: this });
    this.events.once('shutdown', () => this.scene.stop('Hud'));
  }

  drawSky() {
    const top = -SKY_ROWS * TILE;
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0x6b5b95, 0x6b5b95, 0xf6a96b, 0xf6a96b, 1);
    g.fillRect(0, top, MINE_W * TILE, SKY_ROWS * TILE);
    // soft hills on the horizon
    g.fillStyle(0x8fb86a, 1);
    for (let i = 0; i < 7; i++) g.fillCircle(i * 130 + 30, 6, 46);
    g.fillStyle(0x7aa85a, 1);
    for (let i = 0; i < 8; i++) g.fillCircle(i * 110 - 20, 10, 34);
    // a couple of clouds
    g.fillStyle(0xffffff, 0.8);
    for (const [x, y] of [[90, top + 22], [300, top + 34], [560, top + 18], [700, top + 40]]) {
      g.fillRect(x, y, 26, 6);
      g.fillRect(x + 5, y - 4, 14, 4);
    }
  }

  // The Moon's sky: black, full of stars, with the Earth hanging in it.
  drawSpace() {
    const top = -SKY_ROWS * TILE;
    const g = this.add.graphics().setDepth(-10);
    g.fillGradientStyle(0x05040f, 0x05040f, 0x1a1a38, 0x1a1a38, 1);
    g.fillRect(0, top, MINE_W * TILE, SKY_ROWS * TILE);
    const rng = createRng(this.seed ^ 0x5a5a);
    for (let i = 0; i < 90; i++) {
      const s = this.add.image(rng.int(0, MINE_W * TILE), top + rng.int(0, SKY_ROWS * TILE - 8), 'pixel').setDepth(-9)
        .setTint(rng.pick([0xffffff, 0xfff6d0, 0x9ff6ff])).setAlpha(0.4 + rng.next() * 0.6);
      if (i % 4 === 0) this.tweens.add({ targets: s, alpha: 0.1, duration: 700 + (i % 5) * 300, yoyo: true, repeat: -1 });
    }
    this.earth = this.add.image(SHAFT_X * TILE + 150, top + 60, 'earth').setDepth(-8).setScale(1.6);
    this.tweens.add({ targets: this.earth, y: this.earth.y - 4, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // The rocket stands where you landed, and (every trip) you plant a flag.
  drawLander() {
    const x = SHAFT_X * TILE + TILE / 2;
    this.add.image(x + 44, 0, 'rocket-ship').setOrigin(0.5, 0.95).setDepth(5);
    this.lander = { x: x + 44, y: -40 };
    this.time.delayedCall(1200, () => {
      const flag = this.add.image(x - 22, 1, 'moon-flag').setOrigin(0.15, 1).setDepth(6).setScale(1, 0);
      this.tweens.add({ targets: flag, scaleY: 1, duration: 400, ease: 'Back.easeOut' });
      this.effects.sparkle(x - 20, -8, 0xffffff, 8);
      earnSticker(this, 'moon-flag');
    });
    this.time.delayedCall(3500, () => earnSticker(this, 'moon-earthrise'));
  }

  // A little wooden frame over the shaft, with a lantern.
  drawEntrance() {
    const x = SHAFT_X * TILE;
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(0x6b3f1c, 1);
    g.fillRect(x - 4, -30, 4, 30);
    g.fillRect(x + TILE, -30, 4, 30);
    g.fillRect(x - 8, -34, TILE + 16, 5);
    g.fillStyle(0x9a5f2c, 1);
    g.fillRect(x - 8, -34, TILE + 16, 2);
    g.fillStyle(0xffcf4a, 1);
    g.fillRect(x + TILE + 6, -28, 4, 5);
  }

  avatarFor(slot) {
    if (this.avatars[slot]) return this.avatars[slot];
    const chars = this.registry.get('characters') ?? CHARACTERS;
    const char = chars[slot] ?? CHARACTERS[slot];
    const partner = this.avatars.find(Boolean);
    const start = partner
      ? { x: partner.p.x, y: partner.p.y }
      : standAt(this.world.spawn.x + slot, this.startRow ?? this.world.spawn.y);
    const a = {
      slot,
      char,
      p: createPlayer(start),
      pack: createBackpack(packCap({ ...getState(this.registry), upgrades: this.upgrades })),
      sprite: this.add.sprite(0, 0, `char-${char}`, 0).setOrigin(0.5, 1).setDepth(30),
      crack: this.add.image(0, 0, 'cracks', 0).setOrigin(0).setDepth(20).setVisible(false),
      full: this.add.image(0, 0, 'icon-full').setDepth(61).setVisible(false),
      fullHint: this.add.image(0, 0, 'btn-b').setDepth(61).setVisible(false),
      bubble: this.add.image(0, 0, 'bubble').setDepth(62).setVisible(false),
      bubbling: false,
      invuln: 0,
      pu: createPowerups(),
      emberT: 0,
      bubbleEdge: createEdge(),
      homeHold: createHoldTimer(HOME_HOLD_MS),
      ring: this.add.graphics().setDepth(63),
      pick: this.add.image(0, 0, 'pick', this.upgrades.pick).setOrigin(0.15, 0.85).setDepth(31).setVisible(false),
      hint: this.add.image(0, 0, 'icon-stick-down').setDepth(64).setVisible(false),
      wasGrounded: true,
      dustT: 0,
      walkT: 0,
    };
    this.avatars[slot] = a;
    // a little poof as they appear
    this.drawAvatar(a, 0, this.time.now);
    a.sprite.setScale(0.2);
    this.tweens.add({ targets: a.sprite, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xffffff, 8);
    this.offscreenGraceUntil = this.time.now + 1500;
    this.events.emit('joined', a);
    return a;
  }

  partnerOf(a) {
    return this.avatars.find((o) => o && o !== a) ?? null;
  }

  startBubble(a) {
    if (a.bubbling) return;
    a.bubbling = true;
    a.p.mining = null;
    a.bubble.setVisible(true).setScale(0.3);
    this.tweens.add({ targets: a.bubble, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.events.emit('bubble', a);
  }

  stepBubbling(a, dt) {
    const partner = this.partnerOf(a);
    if (!partner) {
      a.bubbling = false;
      a.bubble.setVisible(false);
      return;
    }
    if (partner.bubbling) {
      // both bubbling (never wait on each other): player 1 pops, player 2 floats over
      if (a.slot < partner.slot) {
        a.bubbling = false;
        a.bubble.setVisible(false);
        this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xc8f0ff, 8);
        this.events.emit('bubblePop', a);
      }
      return;
    }
    if (stepBubble(a.p, { x: partner.p.x, y: partner.p.y }, dt)) {
      a.bubbling = false;
      a.p.grounded = partner.p.grounded;
      a.bubble.setVisible(false);
      this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xc8f0ff, 8);
      this.events.emit('bubblePop', a);
    }
  }

  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const slots = this.session.slots;
    for (const { slot } of slots) this.avatarFor(slot);
    const coop = this.avatars.filter(Boolean).length > 1;

    if (!this.goingHome && this.pauseWatch.update()) return;
    if (this.goingHome) {
      for (const a of this.avatars) if (a) this.drawAvatar(a, dt, time);
      this.updateCamera(dt);
      this.drawLights(time);
      return;
    }
    for (const { slot, intent } of slots) {
      const a = this.avatars[slot];
      const partner = coop ? this.partnerOf(a) : null;
      // hold B to go home (both players)
      if (a.homeHold.update(!!(intent && intent.home), deltaMs)) {
        this.goHome();
        return;
      }
      this.drawHoldRing(a);
      if (a.bubbling) {
        this.stepBubbling(a, dt);
      } else if (intent) {
        const prev = { x: a.p.x, y: a.p.y };
        this.stepAvatar(a, intent, dt);
        if (partner && !partner.bubbling) this.softWall(a, prev, partner);
        const wantsBubble = a.bubbleEdge(intent.bubble);
        if (partner && wantsBubble && Math.hypot(partner.p.x - a.p.x, partner.p.y - a.p.y) > BUBBLE.minDistance) {
          this.startBubble(a);
        }
      }
      this.drawAvatar(a, dt, time);
    }
    this.hazards.update(dt, time);
    this.finds.update(dt, time);
    this.pets.update(dt, time);
    for (const a of this.avatars) if (a) a.invuln = Math.max(0, a.invuln - dt);
    if (coop) this.catchOffscreen(dt);
    this.updateCamera(dt);
    this.stepPickups(dt, time);
    this.twinkleOres(dt);
    this.scanSurroundings(dt);
    this.drawLights(time);
  }

  drawHoldRing(a) {
    const prog = a.homeHold.progress();
    a.ring.clear();
    if (prog <= 0.05) return;
    const x = a.sprite.x;
    const y = a.sprite.y - 26;
    a.ring.fillStyle(0x1b1428, 0.6).fillCircle(x, y, 7);
    a.ring.lineStyle(3, 0xffe066, 1).beginPath();
    a.ring.arc(x, y, 5.5, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2, false).strokePath();
    a.ring.fillStyle(0xc8904e, 1).fillRect(x - 1, y - 3, 2, 6); // a little rope
  }

  // A rope drops to each player and pulls everyone up to camp (on the Moon,
  // you're beamed back to the rocket instead).
  goHome() {
    if (this.goingHome) return;
    this.goingHome = true;
    this.events.emit('goHome');
    if (this.moon) {
      this.beamHome();
      return;
    }
    const top = -2 * TILE;
    const players = this.avatars.filter(Boolean);
    for (const a of players) {
      a.ring.clear();
      a.bubbling = false;
      a.bubble.setVisible(false);
      a.p.mining = null;
      a.crack.setVisible(false);
      const rope = this.add.tileSprite(a.sprite.x, top, 3, 1, 'rope').setOrigin(0.5, 0).setDepth(52);
      const length = a.sprite.y - 14 - top;
      this.tweens.addCounter({
        from: 0,
        to: length,
        duration: 350,
        ease: 'Quad.easeOut',
        onUpdate: (tw) => rope.setSize(3, Math.max(1, tw.getValue())),
        onComplete: () => {
          this.tweens.add({
            targets: a.p,
            y: top,
            duration: 700 + Math.min(1300, length * 0.5),
            ease: 'Quad.easeIn',
            onUpdate: () => rope.setSize(3, Math.max(1, a.p.y - top)),
          });
        },
      });
    }
    this.time.delayedCall(1300, () => this.cameras.main.fadeOut(700, 20, 12, 30));
    this.cameras.main.once('camerafadeoutcomplete', () => this.arriveHome(players));
  }

  // Beam me up: a column of light, a sparkle, and everyone floats away.
  beamHome() {
    const players = this.avatars.filter(Boolean);
    for (const a of players) {
      a.ring.clear();
      a.bubbling = false;
      a.bubble.setVisible(false);
      a.p.mining = null;
      a.crack.setVisible(false);
      const beam = this.add.rectangle(a.sprite.x, a.sprite.y + 2, 18, 400, 0x9ff6ff, 0.45).setOrigin(0.5, 1).setDepth(52)
        .setBlendMode(Phaser.BlendModes.ADD).setScale(0.3, 0);
      this.tweens.add({ targets: beam, scaleY: 1, scaleX: 1, duration: 400, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: beam, alpha: 0, delay: 1300, duration: 400 });
      this.tweens.add({ targets: a.sprite, alpha: 0, scaleX: 0.2, delay: 500, duration: 700 });
      for (let i = 0; i < 6; i++) this.time.delayedCall(400 + i * 120, () => this.effects.sparkle(a.sprite.x, a.sprite.y - 8 - i * 6, 0x9ff6ff, 4));
    }
    this.time.delayedCall(1500, () => this.cameras.main.fadeOut(700, 5, 4, 15));
    this.cameras.main.once('camerafadeoutcomplete', () => this.arriveHome(players));
  }

  arriveHome(players) {
    const packs = [];
    for (const a of players) packs[a.slot] = { ...a.pack.ores };
    this.scene.start('Camp', {
      arrived: {
        packs: packs.map((p) => p ?? {}), deepest: this.trip.deepest, chests: this.trip.chests,
        stickers: this.trip.stickers, eggs: [...this.finds.carried], hearts: this.finds.hearts,
        cheese: this.finds.cheese, moon: this.moon,
      },
    });
  }

  // Your own walking and climbing can't take you out of the shared view.
  softWall(a, prev, partner) {
    const next = applySoftWall(prev, a.p, partner.p, this.wall);
    if (next.x !== a.p.x) { a.p.x = next.x; a.p.vx = 0; }
    if (a.p.climbing && next.y !== a.p.y) { a.p.y = next.y; a.p.vy = 0; }
  }

  // Fell or got knocked out of view anyway: bubble them back to their partner.
  catchOffscreen(dt) {
    if (this.time.now < (this.offscreenGraceUntil ?? 0)) return;
    if (this.avatars.some((a) => a && a.bubbling)) return; // one bubble at a time
    const view = this.cameras.main.worldView;
    for (const a of this.avatars) {
      if (!a) continue;
      const off = isOffscreen({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 }, view);
      a.offT = off ? (a.offT ?? 0) + dt : 0;
    }
    // only once they've been out of view for a moment (the camera can lag a fast fall)
    const out = this.avatars.filter((a) => a && a.offT > 0.5);
    if (!out.length) return;
    // if both are "out" (camera can't fit them), bubble the one who is falling, else the lower one
    const pick = out.find((a) => !a.p.grounded) ?? out.sort((m, n) => n.p.y - m.p.y)[0];
    this.startBubble(pick);
  }

  updateCamera(dt) {
    const pts = this.avatars.filter(Boolean).map((a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 - 6 }));
    if (!pts.length) return;
    // keep the top strip clear for the HUD panels
    const hud = HUD_STRIP;
    const f = frameCamera(pts, { w: this.scale.width, h: this.scale.height - hud });
    f.y -= hud / 2 / f.zoom;
    const k = 1 - Math.exp(-dt * 5);
    this.cam.zoom += (f.zoom - this.cam.zoom) * k;
    this.cam.x += (f.x - this.cam.x) * k;
    this.cam.y += (f.y - this.cam.y) * k;
    const cam = this.cameras.main;
    cam.setZoom(this.cam.zoom);
    cam.centerOn(this.cam.x, this.cam.y);
  }

  stepAvatar(a, intent, dt) {
    const mul = multipliers(a.pu);
    // drinking: stand still and glug
    const row = (a.p.y + PLAYER.h / 2) / TILE;
    const floaty = this.moon || (row >= LAYERS.meteor.top && row <= LAYERS.meteor.bottom);
    const r = stepPlayer(a.p, mul.drinking ? { ...intent, moveX: 0, moveY: 0, jump: false } : intent, this.grid,
      { pickLevel: this.upgrades.pick, dt, digMul: mul.dig, walkMul: mul.walk, gravityMul: floaty ? LOW_GRAVITY : 1 });
    if (r.sprung) {
      this.events.emit('spring', a);
      earnSticker(this, 'find-spring');
      a.sprite.setScale(1.3, 0.7);
      this.effects.sparkle(a.sprite.x, a.sprite.y, 0x6ae07a, 6);
    }
    for (const ev of stepPowerups(a.pu, dt, { inWater: a.p.inWater && !a.bubbling })) this.powerupEvent(a, ev);
    if (r.jumped) this.events.emit('jump', a);
    for (const m of r.mined) {
      this.mapView.syncMined(m.x, m.y);
      this.effects.chunks(m.x, m.y, m.id);
      this.events.emit('blockMined', m);
      this.hazards.mined(m.x, m.y);
      this.decor.mined(m.x, m.y);
      this.finds.mined(m);
      if (m.id === B.MOONROCK) earnSticker(this, 'moon-rock');
      this.dugCount++;
      if (m.drop) this.giveOre(a, m.drop, m.x, m.y);
    }
    const target = a.p.mining ? this.grid.get(a.p.mining.cx, a.p.mining.cy) : null;
    if (r.bounced && target === B.BOOM) this.finds.light(a.p.mining.cx, a.p.mining.cy);
    if (r.bounced && target !== B.BOOM && target !== B.BOULDER) {
      const { cx, cy } = a.p.mining ?? playerCell(a.p);
      this.effects.sparkle(cx * TILE + TILE / 2, cy * TILE + TILE / 2, 0xaaaaaa, 3);
      this.cameras.main.shake(80, 0.002);
      this.events.emit('bounce', a);
    }

    // treasure chest: walk into it to open
    const { cx, cy } = playerCell(a.p);
    if (this.grid.get(cx, cy) === B.CHEST) this.openChest(cx, cy);
    if (this.touchedLava(a)) this.lavaTouch(a);

    // collect ores lying around (nearby ones float in)
    attractPickups(this.pickups, { x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 }, a.pack, dt, this.pets.magnet());
    const box = { x: a.p.x, y: a.p.y, w: PLAYER.w, h: PLAYER.h };
    const { list, collected } = collectPickups(this.pickups, box, a.pack);
    this.pickups = list;
    for (const ore of collected) {
      earnSticker(this, `ore-${ore}`);
      this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xfff2a0, 3);
      this.events.emit('oreCollected', { slot: a.slot, ore });
    }
  }

  giveOre(a, ore, cx, cy) {
    earnSticker(this, `ore-${ore}`);
    if (addOre(a.pack, ore)) {
      this.effects.orePop(cx, cy, ore, a.sprite);
      this.events.emit('oreCollected', { slot: a.slot, ore });
    } else {
      this.pickups.push(createPickup({ x: cx * TILE + TILE / 2, y: cy * TILE + TILE / 2, ore }));
      this.effects.flash(a.sprite.x, a.sprite.y - 20, 'icon-full');
      this.events.emit('packFull', a);
    }
  }

  // The lava cell the player's box touches, or null.
  touchedLava(a) {
    const x0 = Math.floor((a.p.x + 1) / TILE);
    const x1 = Math.floor((a.p.x + PLAYER.w - 1) / TILE);
    const y0 = Math.floor((a.p.y + 2) / TILE);
    const y1 = Math.floor((a.p.y + PLAYER.h - 1) / TILE);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.grid.get(x, y) === B.LAVA) return { x, y };
    return null;
  }

  // Lava: pop up out of it (if you're in it) and hop well away from it.
  powerupEvent(a, ev) {
    const x = a.sprite.x;
    const y = a.sprite.y;
    if (ev === 'drinkStart') {
      this.events.emit('glug', a);
      // little gulps of bubbles
      for (let i = 0; i < 6; i++) {
        this.time.delayedCall(i * 200, () => {
          const b = this.add.image(a.sprite.x + a.p.facing * 5, a.sprite.y - 10, 'pixel').setTint(0xe0ffff).setDisplaySize(2, 2).setDepth(41);
          this.tweens.add({ targets: b, y: b.y - 10, alpha: 0, duration: 500, onComplete: () => b.destroy() });
        });
      }
    } else if (ev === 'burp') {
      this.events.emit('burp', a);
      const bub = this.add.image(x + a.p.facing * 6, y - 12, 'burp').setDepth(62).setScale(0.3);
      this.tweens.add({
        targets: bub, scale: 1.4, y: y - 34, duration: 900, ease: 'Sine.easeOut',
        onComplete: () => {
          this.effects.sparkle(bub.x, bub.y, 0xc8f0ff, 8);
          bub.destroy();
        },
      });
      earnSticker(this, 'adv-drink');
    } else if (ev === 'lavaEnd') {
      this.events.emit('cooldown', a);
      for (let i = 0; i < 6; i++) {
        const puff = this.add.image(x + (Math.random() - 0.5) * 12, y - 6, 'smoke').setDepth(41).setTint(0xb0a8a0);
        this.tweens.add({ targets: puff, y: puff.y - 18, scale: 2, alpha: 0, duration: 800, delay: i * 50, onComplete: () => puff.destroy() });
      }
    }
  }

  // Lava turns you into a LAVA MONSTER (the player's own idea!). While you
  // are one, lava can't hurt you and you dig twice as fast.
  lavaTouch(a) {
    if (!touchLava(a.pu)) return; // already a monster: the timer just tops up
    this.events.emit('lavaMonster', a);
    this.cameras.main.flash(180, 255, 140, 60);
    this.cameras.main.shake(200, 0.006);
    this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xff8a1f, 12);
    this.effects.confetti(a.sprite.x, a.sprite.y - 10);
    earnSticker(this, 'adv-lavamonster');
  }

  // A hazard touched a player: knock back, scatter up to 3 ores, brief safety.
  bonk(a, fromX, { noKnock = false, kind = null, enemy = null } = {}) {
    if (kind && !a.bubbling && a.invuln <= 0) earnSticker(this, `creature-${kind}`);
    // a lava monster is not bothered by anything: creatures poof away
    if (a.pu.lava > 0) {
      if (enemy) {
        this.hazards.squash(enemy);
        this.effects.sparkle(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 0xff8a1f, 8);
        this.events.emit('squash', a);
      }
      return;
    }
    if (a.bubbling || a.invuln > 0) return;
    a.invuln = BONK.invuln;
    const dir = Math.sign(a.p.x + PLAYER.w / 2 - fromX) || -a.p.facing || 1;
    if (!noKnock) knockback(a.p, dir);
    const x = a.p.x + PLAYER.w / 2;
    const y = a.p.y + 4;
    for (const ore of scatterOres(a.pack, this.rng, BONK.scatter)) {
      this.pickups.push(createPickup({
        x, y, ore, ttl: PICKUP.scatterTtl, delay: PICKUP.scatterDelay,
        vx: (this.rng.next() - 0.5) * 160, vy: -120 - this.rng.next() * 60,
      }));
    }
    this.cameras.main.shake(120, 0.004);
    this.effects.sparkle(x, y, 0xffffff, 6);
    a.sprite.setTintFill(0xffffff);
    a.bonkFlash = true;
    this.time.delayedCall(90, () => { a.bonkFlash = false; a.sprite.clearTint(); });
    this.events.emit('bonk', a);
  }

  squash(a, e) {
    earnSticker(this, e.golden ? 'creature-goldslime' : e.species === 'moonblob' ? 'moon-blob' : `creature-${e.species ?? 'slime'}`);
    if (e.golden) {
      for (let i = 0; i < 5; i++) {
        this.pickups.push(createPickup({ x: e.x + 6, y: e.y, ore: 'gold', delay: 0.3, vx: (this.rng.next() - 0.5) * 140, vy: -140 - this.rng.next() * 60 }));
      }
      this.effects.confetti(e.x + 6, e.y);
    }
    this.hazards.squash(e);
    a.p.vy = -200;
    this.effects.sparkle(e.x + e.w / 2, e.y + e.h / 2, 0x9ae67a, 8);
    this.effects.chunks(Math.floor((e.x + 6) / TILE), Math.floor(e.y / TILE), 99);
    this.events.emit('squash', a);
  }

  openChest(cx, cy) {
    this.grid.set(cx, cy, B.AIR);
    this.mapView.sync(cx, cy);
    const x = cx * TILE + TILE / 2;
    const y = cy * TILE + TILE / 2;
    for (const ore of chestLoot(cy, this.rng)) {
      this.pickups.push(createPickup({
        x, y, ore, delay: 0.45, vx: (this.rng.next() - 0.5) * 110, vy: -110 - this.rng.next() * 40,
      }));
    }
    this.effects.sparkle(x, y, 0xffe066, 8);
    this.cameras.main.flash(120, 255, 230, 150);
    this.trip.chests++;
    this.events.emit('chestOpened', { x: cx, y: cy });
  }

  stepPickups(dt, time) {
    this.pickups = stepPickups(this.pickups, this.grid, dt);
    const alive = new Set(this.pickups);
    for (const [p, sprite] of this.pickupSprites) {
      if (!alive.has(p)) {
        sprite.destroy();
        this.pickupSprites.delete(p);
      }
    }
    for (const p of this.pickups) {
      let sprite = this.pickupSprites.get(p);
      if (!sprite) {
        sprite = this.add.image(p.x, p.y, `ore-${p.ore}`).setDepth(25).setScale(PICKUP.size / 10);
        this.pickupSprites.set(p, sprite);
      }
      const bob = p.vy === 0 ? Math.sin(time / 250 + p.x) * 1 : 0;
      sprite.setPosition(p.x, p.y + bob - 1);
      // blink when about to vanish
      sprite.setVisible(!(p.ttl < 3 && Math.floor(time / 120) % 2 === 0));
    }
  }

  drawAvatar(a, dt, time) {
    const { p, sprite } = a;
    animateCharacter(sprite, p, a, dt, time);
    sprite.setAlpha(a.invuln > 0 && Math.floor(time / 90) % 2 === 0 ? 0.35 : 1);
    // lava monster: bigger, glowing, flickering, dropping embers
    if (a.pu.lava > 0) {
      sprite.setScale(sprite.scaleX * 1.3, sprite.scaleY * 1.3);
      sprite.setTint(Math.floor(time / 110) % 2 ? 0xff6a2a : 0xffa040);
      a.emberT -= dt;
      if (a.emberT <= 0) {
        a.emberT = 0.08;
        const e = this.add.image(sprite.x + (Math.random() - 0.5) * 12, sprite.y - Math.random() * 16, 'pixel')
          .setTint(Math.random() < 0.5 ? 0xffb34a : 0xff5a1a).setDisplaySize(2, 2).setDepth(40);
        this.tweens.add({ targets: e, y: e.y - 12, alpha: 0, duration: 600, onComplete: () => e.destroy() });
      }
    } else if (a.pu.zoom > 0) {
      if (!a.bonkFlash) sprite.clearTint();
      a.emberT -= dt;
      if (a.emberT <= 0 && a.p.vx !== 0) {
        a.emberT = 0.06;
        const d = this.add.image(sprite.x - a.p.facing * 6, sprite.y - 3, 'pixel').setTint(0x6ad0ff).setDisplaySize(2, 2).setDepth(29);
        this.tweens.add({ targets: d, y: d.y + 3, alpha: 0, duration: 400, onComplete: () => d.destroy() });
      }
    } else if (!a.bonkFlash) {
      sprite.clearTint();
    }
    // drinking: tip the head down
    sprite.setAngle(a.pu.drinking > 0 ? a.p.facing * 18 + Math.sin(time / 60) * 4 : 0);
    const digging = p.mining && p.mining.need !== Infinity;
    this.drawPick(a, time);
    this.dust(a, dt);
    // first trip ever: show "push the stick down" until a few blocks are dug
    const showHint = this.firstTrip && this.dugCount < 3 && !a.bubbling && !this.goingHome;
    a.hint.setVisible(showHint).setPosition(sprite.x, sprite.y - 30 + Math.sin(time / 180) * 3);

    if (digging) {
      const f = Math.min(3, Math.floor((p.mining.t / p.mining.need) * 4));
      a.crack.setVisible(true).setPosition(p.mining.cx * TILE, p.mining.cy * TILE).setFrame(f);
    } else {
      a.crack.setVisible(false);
    }
    // backpack full: show the bag, then a pulsing B ("hold B to go home")
    const full = packFull(a.pack) && !a.bubbling;
    const bob = Math.sin(time / 200) * 1.5;
    a.full.setVisible(full).setPosition(sprite.x - 6, sprite.y - 22 + bob);
    a.fullHint.setVisible(full && Math.floor(time / 500) % 2 === 0).setPosition(sprite.x + 7, sprite.y - 22 + bob);
    if (a.bubbling) {
      const wob = 1 + Math.sin(time / 90) * 0.06;
      a.bubble.setPosition(sprite.x, sprite.y - 7).setScale(wob, 2 - wob);
      sprite.setFrame(0);
    }
  }

  // Ores and chests glint in the dark, so there's always something to dig toward.
  twinkleOres(dt) {
    this.glintT = (this.glintT ?? 0) - dt;
    if (this.glintT > 0) return;
    this.glintT = 0.12;
    const players = this.avatars.filter(Boolean);
    if (!players.length) return;
    const a = players[Math.floor(this.rng.next() * players.length)];
    const { cx, cy } = playerCell(a.p);
    const lit = LANTERN[this.upgrades.lantern] - 0.5;
    for (let tries = 0; tries < 12; tries++) {
      const x = cx + this.rng.int(-12, 12);
      const y = cy + this.rng.int(-8, 8);
      if (Math.hypot(x - cx, y - cy) < lit) continue;
      const id = this.grid.get(x, y);
      // the meteor field's rock twinkles with tiny stars
      if (id === B.METEOR) {
        const s = this.add.image(x * TILE + this.rng.int(2, 14), y * TILE + this.rng.int(2, 14), 'pixel')
          .setDepth(55).setTint(this.rng.pick([0xffffff, 0xffe066, 0x9ff6ff])).setAlpha(0);
        this.tweens.add({ targets: s, alpha: 0.8, duration: 500, yoyo: true, hold: 600, onComplete: () => s.destroy() });
        return;
      }
      const ore = dropOf(id);
      if (!ore && id !== B.CHEST) continue;
      const color = id === B.CHEST ? 0xffe066 : GLINT_COLORS[ore];
      const g = this.add.image(x * TILE + this.rng.int(3, 13), y * TILE + this.rng.int(3, 13), 'glint')
        .setDepth(55).setTint(color).setScale(0).setAlpha(0.9);
      this.tweens.add({ targets: g, scale: 1, duration: 260, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => g.destroy() });
      return;
    }
  }

  // The pickaxe appears in hand while digging and swings at the target.
  drawPick(a, time) {
    const m = a.p.mining;
    if (!m || this.goingHome || a.bubbling) {
      a.pick.setVisible(false);
      return;
    }
    const cx = a.p.x + PLAYER.w / 2;
    const cy = a.p.y + PLAYER.h / 2;
    const tx = m.cx * TILE + TILE / 2;
    const ty = m.cy * TILE + TILE / 2;
    const base = Math.atan2(ty - cy, tx - cx);
    const swing = Math.sin(time / 55) * 0.7;
    const left = tx < cx - 1;
    // the sprite points up-right (or up-left when flipped), handle at the origin
    const natural = left ? (-3 * Math.PI) / 4 : -Math.PI / 4;
    a.pick.setVisible(true)
      .setFlipX(left)
      .setOrigin(left ? 0.85 : 0.15, 0.85)
      .setPosition(cx + Math.cos(base) * 6, cy + Math.sin(base) * 6)
      .setRotation(base - natural + (left ? -swing : swing) - (left ? -0.5 : 0.5));
  }

  // Little puffs when landing, and now and then while walking.
  dust(a, dt) {
    const p = a.p;
    const x = p.x + PLAYER.w / 2;
    const y = p.y + PLAYER.h;
    if (p.grounded && !a.wasGrounded) {
      for (const dx of [-5, 5]) this.puff(x + dx, y, dx);
    }
    a.wasGrounded = p.grounded;
    a.dustT -= dt;
    if (p.grounded && p.vx !== 0 && a.dustT <= 0) {
      a.dustT = 0.28;
      this.puff(x - Math.sign(p.vx) * 5, y, -Math.sign(p.vx) * 3);
    }
  }

  puff(x, y, dx) {
    const d = this.add.image(x, y - 1, 'smoke').setDepth(29).setScale(0.4).setAlpha(0.6).setTint(0xd8c8b0);
    this.tweens.add({ targets: d, x: x + dx, y: y - 4, scale: 0.9, alpha: 0, duration: 380, onComplete: () => d.destroy() });
  }

  // A cosy little station where the minecart drops you off.
  drawStation() {
    const y = (this.startRow + 1) * TILE;
    const x0 = (SHAFT_X - 3) * TILE;
    const g = this.add.graphics().setDepth(12);
    g.fillStyle(0x6b4424, 1);
    for (let x = x0; x < x0 + 7 * TILE; x += 6) g.fillRect(x, y - 2, 3, 2);
    g.fillStyle(0xb8c4d0, 1).fillRect(x0, y - 3, 7 * TILE, 1);
    this.add.image(x0 + 12, y - 2, 'cart', 0).setOrigin(0.5, 1).setDepth(13);
    this.stationLight = { x: SHAFT_X * TILE + 8, y: y - 20 };
  }

  // Twice a second: note the deepest row, chests the lanterns have found,
  // and cave life you've seen (for stickers).
  scanSurroundings(dt) {
    for (const a of this.avatars) {
      if (!a) continue;
      const row = Math.floor((a.p.y + PLAYER.h / 2) / TILE);
      this.trip.deepest = Math.max(this.trip.deepest, row);
      const found = this.moon ? null : discovery(row, this.knownLayers);
      if (found) this.discover(found, a);
    }
    this.scanT -= dt;
    if (this.scanT > 0) return;
    this.scanT = 0.5;
    const r = LANTERN[this.upgrades.lantern];
    for (const a of this.avatars) {
      if (!a) continue;
      const { cx, cy } = playerCell(a.p);
      this.world.chests.forEach((c, i) => {
        if (Math.hypot(c.x - cx, c.y - cy) <= r) this.seenChests.add(i);
      });
      const STICKER_FOR = { skeleton: 'find-skeleton', spacecrystal: 'moon-crystal' };
      for (const kind of this.decor.kindsNear(cx, cy, r - 0.5)) earnSticker(this, STICKER_FOR[kind] ?? `cave-${kind}`);
    }
  }

  // First time in one of the deep layers: a banner, a fanfare and a badge.
  discover(layer, a) {
    this.knownLayers.push(layer);
    this.events.emit('discover', layer);
    this.effects.confetti(a.sprite.x, a.sprite.y - 12);
    this.scene.get('Hud')?.banner(layer);
    this.time.delayedCall(3800, () => earnSticker(this, `badge-${layer}`)); // after the banner
  }

  drawLights(time) {
    const lights = [];
    const flicker = 1 + Math.sin(time / 130) * 0.03 + Math.sin(time / 57) * 0.02;
    for (const a of this.avatars) {
      if (!a) continue;
      if (a.pu.lava > 0) lights.push({ x: a.sprite.x, y: a.sprite.y - 8, r: 3 * flicker, glow: 0.3, color: 0xff7a2a });
      lights.push({
        x: a.sprite.x, y: a.sprite.y - 8, r: LANTERN[this.upgrades.lantern] * flicker, glow: 0.16,
      });
    }
    const view = this.cameras.main.worldView;
    for (const c of this.lavaCells) {
      const x = c.x * TILE + TILE / 2;
      const y = c.y * TILE + TILE / 2;
      if (x < view.x - 64 || x > view.right + 64 || y < view.y - 64 || y > view.bottom + 64) continue;
      if (this.grid.get(c.x, c.y) !== B.LAVA) continue;
      lights.push({ x, y, r: 1.6 * flicker, glow: 0.12, color: 0xff6a2a });
    }
    lights.push(...this.decor.lights(view, flicker));
    lights.push(...this.pets.lights());
    for (const e of this.finds.eggs) if (!e.taken) lights.push({ x: e.x * TILE + 8, y: e.y * TILE + 8, r: 1.1 * flicker, glow: 0.1, color: 0xfff2a0 });
    if (this.stationLight) lights.push({ ...this.stationLight, r: 3.5 * flicker, glow: 0.14 });
    const heart = this.finds.heart;
    if (heart && heart.s) lights.push({ x: heart.s.x, y: heart.s.y, r: 4 * flicker, glow: 0.3, color: 0xff6a9a });
    for (const m of this.meteorites) {
      if (this.grid.get(m.x, m.y) === B.METEORITE) lights.push({ x: m.x * TILE + 8, y: m.y * TILE + 8, r: 1.2 * flicker, glow: 0.12, color: 0xffb04a });
    }
    for (const c of this.world.chests) {
      if (this.grid.get(c.x, c.y) !== B.CHEST) continue;
      lights.push({ x: c.x * TILE + TILE / 2, y: c.y * TILE + TILE / 2, r: 1.3 * flicker, glow: 0.14, color: 0xffd86b });
    }
    this.darkness.draw(lights);
  }
}
