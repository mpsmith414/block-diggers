import Phaser from 'phaser';
import { generateMine } from '../world/worldgen.js';
import { createRng } from '../world/rng.js';
import { B, dropOf } from '../world/blocks.js';
import { createPlayer, stepPlayer, standAt, playerCell, knockback } from '../game/player.js';
import { lavaEscape } from '../game/hazards.js';
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
import { animateCharacter } from './common/avatarView.js';
import {
  TILE, MINE_W, MINE_H, SKY_ROWS, SHAFT_X, PLAYER, BACKPACK, LANTERN, PICKUP, CAMERA, BUBBLE, BONK, HOME_HOLD_MS,
} from '../tuning.js';

const GLINT_COLORS = { coal: 0x9a96a8, iron: 0xf5d2b8, gold: 0xffe066, diamond: 0x9ff6ff, emerald: 0x8affb0 };
const HUD_STRIP = 36; // screen pixels at the top used by the HUD
const DEFAULT_UPGRADES = { pick: 0, pack: 0, lantern: 0 };

export class MineScene extends Phaser.Scene {
  constructor() {
    super('Mine');
  }

  init(data) {
    this.seed = data?.seed ?? (Date.now() >>> 0);
    this.upgrades = data?.upgrades ?? this.registry.get('upgrades') ?? DEFAULT_UPGRADES;
  }

  create() {
    this.session = this.registry.get('input');
    this.world = generateMine(this.seed);
    this.grid = this.world.grid;
    this.rng = createRng(this.seed ^ 0x9e3779b9);
    // Phaser reuses this object across trips: reset all per-trip state here.
    this.avatars = [];
    this.pickups = [];
    this.pickupSprites = new Map();
    this.goingHome = false;
    this.offscreenGraceUntil = 0;
    this.glintT = 0;

    this.drawSky();
    this.mapView = createMapView(this, this.grid);
    this.drawEntrance();
    this.effects = createEffects(this);
    this.hazards = createHazards(this);
    this.darkness = createDarkness(this, { w: MINE_W * TILE, h: MINE_H * TILE });
    this.lavaCells = [];
    for (let y = 0; y < MINE_H; y++) {
      for (let x = 0; x < MINE_W; x++) if (this.grid.get(x, y) === B.LAVA) this.lavaCells.push({ x, y });
    }

    const cam = this.cameras.main;
    cam.setBounds(0, -SKY_ROWS * TILE, MINE_W * TILE, (MINE_H + SKY_ROWS) * TILE);
    cam.setRoundPixels(true);
    this.cam = { zoom: CAMERA.maxZoom, x: SHAFT_X * TILE, y: -TILE };
    cam.setZoom(this.cam.zoom);
    cam.centerOn(this.cam.x, this.cam.y);
    this.wall = wallLimits({ w: this.scale.width, h: this.scale.height });

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
      : standAt(this.world.spawn.x + slot, this.world.spawn.y);
    const a = {
      slot,
      char,
      p: createPlayer(start),
      pack: createBackpack(BACKPACK[this.upgrades.pack]),
      sprite: this.add.sprite(0, 0, `char-${char}`, 0).setOrigin(0.5, 1).setDepth(30),
      crack: this.add.image(0, 0, 'cracks', 0).setOrigin(0).setDepth(20).setVisible(false),
      full: this.add.image(0, 0, 'icon-full').setDepth(61).setVisible(false),
      bubble: this.add.image(0, 0, 'bubble').setDepth(62).setVisible(false),
      bubbling: false,
      invuln: 0,
      bubbleEdge: createEdge(),
      homeHold: createHoldTimer(HOME_HOLD_MS),
      ring: this.add.graphics().setDepth(63),
      walkT: 0,
    };
    this.avatars[slot] = a;
    // a little poof as they appear
    this.drawAvatar(a, 0, this.time.now);
    a.sprite.setScale(0.2);
    this.tweens.add({ targets: a.sprite, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xffffff, 8);
    this.offscreenGraceUntil = this.time.now + 1500;
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
    if (partner.bubbling) return; // wait for them to land first
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
    for (const a of this.avatars) if (a) a.invuln = Math.max(0, a.invuln - dt);
    if (coop) this.catchOffscreen();
    this.updateCamera(dt);
    this.stepPickups(dt, time);
    this.twinkleOres(dt);
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

  // A rope drops to each player and pulls everyone up to camp.
  goHome() {
    if (this.goingHome) return;
    this.goingHome = true;
    this.events.emit('goHome');
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
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const packs = [];
      for (const a of players) packs[a.slot] = { ...a.pack.ores };
      this.scene.start('Camp', { arrived: { packs: packs.map((p) => p ?? {}) } });
    });
  }

  // Your own walking and climbing can't take you out of the shared view.
  softWall(a, prev, partner) {
    const next = applySoftWall(prev, a.p, partner.p, this.wall);
    if (next.x !== a.p.x) { a.p.x = next.x; a.p.vx = 0; }
    if (a.p.climbing && next.y !== a.p.y) { a.p.y = next.y; a.p.vy = 0; }
  }

  // Fell or got knocked out of view anyway: bubble them back to their partner.
  catchOffscreen() {
    if (this.time.now < (this.offscreenGraceUntil ?? 0)) return;
    const view = this.cameras.main.worldView;
    const out = this.avatars.filter((a) => a && !a.bubbling &&
      isOffscreen({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 }, view));
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
    const r = stepPlayer(a.p, intent, this.grid, { pickLevel: this.upgrades.pick, dt });
    for (const m of r.mined) {
      this.mapView.syncMined(m.x, m.y);
      this.effects.chunks(m.x, m.y, m.id);
      this.events.emit('blockMined', m);
      this.hazards.mined(m.x, m.y);
      if (m.drop) this.giveOre(a, m.drop, m.x, m.y);
    }
    if (r.bounced) {
      const { cx, cy } = a.p.mining ?? playerCell(a.p);
      this.effects.sparkle(cx * TILE + TILE / 2, cy * TILE + TILE / 2, 0xaaaaaa, 3);
      this.cameras.main.shake(80, 0.002);
      this.events.emit('bounce', a);
    }

    // treasure chest: walk into it to open
    const { cx, cy } = playerCell(a.p);
    if (this.grid.get(cx, cy) === B.CHEST) this.openChest(cx, cy);
    const lava = this.touchedLava(a);
    if (lava) this.lavaBonk(a, lava);

    // collect ores lying around (nearby ones float in)
    attractPickups(this.pickups, { x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 }, a.pack, dt);
    const box = { x: a.p.x, y: a.p.y, w: PLAYER.w, h: PLAYER.h };
    const { list, collected } = collectPickups(this.pickups, box, a.pack);
    this.pickups = list;
    for (const ore of collected) {
      this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xfff2a0, 3);
      this.events.emit('oreCollected', { slot: a.slot, ore });
    }
  }

  giveOre(a, ore, cx, cy) {
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
  lavaBonk(a, lava) {
    const { cx, cy } = playerCell(a.p);
    if (this.grid.get(cx, cy) === B.LAVA) {
      const safe = lavaEscape(this.grid, cx, cy);
      const s = standAt(safe.cx, safe.cy);
      a.p.x = s.x;
      a.p.y = s.y;
    }
    const wasSafe = a.invuln > 0;
    this.bonk(a, lava.x * TILE + TILE / 2);
    if (!wasSafe) {
      a.p.vy = -PLAYER.lavaHop;
      this.effects.sparkle(a.sprite.x, a.sprite.y, 0xff8a1f, 8);
    }
  }

  // A hazard touched a player: knock back, scatter up to 3 ores, brief safety.
  bonk(a, fromX, { noKnock = false } = {}) {
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
    this.time.delayedCall(90, () => a.sprite.clearTint());
    this.events.emit('bonk', a);
  }

  squash(a, e) {
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
    const digging = p.mining && p.mining.need !== Infinity;

    if (digging) {
      const f = Math.min(3, Math.floor((p.mining.t / p.mining.need) * 4));
      a.crack.setVisible(true).setPosition(p.mining.cx * TILE, p.mining.cy * TILE).setFrame(f);
    } else {
      a.crack.setVisible(false);
    }
    a.full.setVisible(packFull(a.pack) && !a.bubbling).setPosition(sprite.x, sprite.y - 22 + Math.sin(time / 200) * 1.5);
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
      const ore = dropOf(id);
      if (!ore && id !== B.CHEST) continue;
      const color = id === B.CHEST ? 0xffe066 : GLINT_COLORS[ore];
      const g = this.add.image(x * TILE + this.rng.int(3, 13), y * TILE + this.rng.int(3, 13), 'glint')
        .setDepth(55).setTint(color).setScale(0).setAlpha(0.9);
      this.tweens.add({ targets: g, scale: 1, duration: 260, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => g.destroy() });
      return;
    }
  }

  drawLights(time) {
    const lights = [];
    const flicker = 1 + Math.sin(time / 130) * 0.03 + Math.sin(time / 57) * 0.02;
    for (const a of this.avatars) {
      if (!a) continue;
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
    for (const c of this.world.chests) {
      if (this.grid.get(c.x, c.y) !== B.CHEST) continue;
      lights.push({ x: c.x * TILE + TILE / 2, y: c.y * TILE + TILE / 2, r: 1.3 * flicker, glow: 0.14, color: 0xffd86b });
    }
    this.darkness.draw(lights);
  }
}
