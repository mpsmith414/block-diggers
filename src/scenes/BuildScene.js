// The Build Yard: a sunny meadow past the gate at the end of Earth camp.
// Build with every block you've found on your adventures, as many as you
// like: LB/RB pick a block, Y puts it where you're pointing (beside you,
// above your head with the stick up, under your feet with the stick down),
// B takes it away. Walk out through the gate on the left to go back to camp.
// Whatever you build stays.

import Phaser from 'phaser';
import { B } from '../world/blocks.js';
import { createPlayer, stepPlayer, standAt } from '../game/player.js';
import { createYard, yardEdits, placeBlock, removeBlock, aimCell, unlockedBlocks, tallest, kindsUsed } from '../game/build.js';
import { createEdge } from '../input/intents.js';
import { CHARACTERS } from '../art/characters.js';
import { animateCharacter } from './common/avatarView.js';
import { createEffects } from './mine/effects.js';
import { createSuitView } from './common/suitView.js';
import { getState, setState } from '../save/store.js';
import { PHASES, phaseForTrips } from '../game/timeOfDay.js';
import { attachAudio } from '../audio/wire.js';
import { createPauseWatch } from './common/pauseWatch.js';
import { earnSticker } from './common/stickers.js';
import { walkMul } from '../game/perks.js';
import { TILE, PLAYER, BUILD } from '../tuning.js';

const IDLE = { moveX: 0, moveY: 0, jump: false, bubble: false, home: false, pause: false, prev: false, next: false };
const GROUND_Y = BUILD.ground * TILE;

export class BuildScene extends Phaser.Scene {
  constructor() {
    super('Build');
  }

  create() {
    this.session = this.registry.get('input');
    this.session.setJoining(true);
    const state = getState(this.registry);
    this.grid = createYard(state.build?.edits ?? []);
    this.blocks = unlockedBlocks(state);
    this.walkMul = walkMul(state);
    this.W = BUILD.w * TILE;
    this.avatars = [];
    this.leaving = false;
    this.dirty = false;
    this.saveT = 0;

    this.drawSky(state);
    this.map = this.make.tilemap({ width: BUILD.w, height: BUILD.h, tileWidth: TILE, tileHeight: TILE });
    const ts = this.map.addTilesetImage('tiles', 'tiles', TILE, TILE, 1, 2);
    this.layer = this.map.createBlankLayer('yard', ts).setDepth(10);
    for (let y = 0; y < BUILD.h; y++) for (let x = 0; x < BUILD.w; x++) this.drawCell(x, y);
    // the gate back to camp, and flowers along the meadow
    this.add.image(1.5 * TILE, GROUND_Y + 1, 'yard-gate').setOrigin(0.5, 1).setDepth(5);
    for (let i = 0; i < 30; i++) {
      const x = 60 + ((i * 131) % (this.W - 80));
      this.add.image(x, GROUND_Y + 1, 'flower', i % 3).setOrigin(0.5, 1).setDepth(4);
    }
    this.effects = createEffects(this);
    this.suits = createSuitView(this);

    const cam = this.cameras.main;
    cam.setBounds(0, -6 * TILE, this.W, (BUILD.h + 6) * TILE);
    cam.setRoundPixels(true);
    this.cam = { zoom: 1.5, x: 4 * TILE, y: GROUND_Y - 40 };
    cam.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
    cam.fadeIn(400, 20, 12, 30);

    attachAudio(this);
    this.pauseWatch = createPauseWatch(this);
    this.scene.launch('BuildHud', { yard: this });
    this.events.once('shutdown', () => {
      this.scene.stop('BuildHud');
      this.save();
    });
    earnSticker(this, 'build-yard');
  }

  // The meadow's sky follows camp's time of day.
  drawSky(state) {
    const ph = PHASES[phaseForTrips(state.trips ?? 0)];
    const top = -6 * TILE;
    const g = this.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
    g.fillGradientStyle(ph.skyTop, ph.skyTop, ph.skyBottom, ph.skyBottom, 1);
    g.fillRect(-200, top, this.W + 400, GROUND_Y - top + 40);
    const orb = this.add.graphics().setDepth(-29).setScrollFactor(0.1, 1);
    if (ph.sun) orb.fillStyle(ph.sun.color, 1).fillCircle(ph.sun.x, GROUND_Y - ph.sun.y - 120, 16);
    if (ph.moon) orb.fillStyle(0xfff6d0, 1).fillCircle(ph.moon.x, GROUND_Y - ph.moon.y - 120, 13);
    if (state.sunHeart) this.add.image(260, GROUND_Y - 220, 'mini-sun').setDepth(-29).setScrollFactor(0.15, 1).setScale(1.4);
    const far = this.add.graphics().setDepth(-28).setScrollFactor(0.35, 1);
    far.fillStyle(ph.far, 1);
    for (let i = 0; i < 10; i++) far.fillCircle(i * 120 - 40, GROUND_Y - 6, 70);
    const near = this.add.graphics().setDepth(-27).setScrollFactor(0.6, 1);
    near.fillStyle(ph.near[0], 1);
    for (let i = 0; i < 12; i++) near.fillCircle(i * 100 - 30, GROUND_Y + 12, 58);
    for (let i = 0; i < 5; i++) {
      const c = this.add.graphics().setDepth(-26).setScrollFactor(0.3, 1);
      c.fillStyle(0xffffff, ph.clouds).fillRect(0, 0, 30, 7).fillRect(6, -5, 16, 5);
      c.setPosition(i * 220, top + 40 + (i % 3) * 30);
      this.tweens.add({ targets: c, x: c.x + 120, duration: 40000 + i * 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  drawCell(x, y) {
    const id = this.grid.get(x, y);
    if (id === B.AIR) this.layer.removeTileAt(x, y);
    else this.layer.putTileAt(id, x, y);
  }

  avatarFor(slot) {
    if (this.avatars[slot]) return this.avatars[slot];
    const state = getState(this.registry);
    const chars = this.registry.get('characters') ?? state.characters ?? CHARACTERS;
    const char = chars[slot] ?? CHARACTERS[slot];
    const a = {
      slot,
      char,
      p: createPlayer(standAt(BUILD.gate + 1 + slot, BUILD.ground - 1)),
      sprite: this.add.sprite(0, 0, `char-${char}`, 0).setOrigin(0.5, 1).setDepth(30),
      aim: this.add.image(0, 0, 'build-aim').setOrigin(0).setDepth(31),
      ghost: this.add.image(0, 0, 'tiles', B.DIRT).setOrigin(0).setDepth(9).setAlpha(0.45),
      edges: { y: createEdge(), b: createEdge(), prev: createEdge(), next: createEdge() },
      sel: 0,
      walkT: 0,
    };
    this.avatars[slot] = a;
    animateCharacter(a.sprite, a.p, a, 0, 0);
    this.suits.add(a);
    this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xffffff, 8);
    this.events.emit('joined', a);
    return a;
  }

  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    if (!this.leaving && this.pauseWatch.update()) return;
    for (const { slot, intent } of this.session.slots) {
      const a = this.avatarFor(slot);
      const i = intent ?? IDLE;
      const e = {
        y: a.edges.y(!!i.bubble),
        b: a.edges.b(!!i.home),
        prev: a.edges.prev(!!i.prev),
        next: a.edges.next(!!i.next),
      };
      const n = this.blocks.length;
      if (e.prev) { a.sel = (a.sel - 1 + n) % n; this.events.emit('pickerMove'); }
      if (e.next) { a.sel = (a.sel + 1) % n; this.events.emit('pickerMove'); }
      const aim = aimCell(a.p, i.moveX, i.moveY);
      if (!this.leaving) {
        if (e.y) this.place(a, aim);
        if (e.b) this.dig(aim);
        const r = stepPlayer(a.p, this.leaving ? IDLE : i, this.grid, { dt, canMine: false, walkMul: this.walkMul });
        if (r.jumped) this.events.emit('jump', a);
        if (r.sprung) {
          this.events.emit('spring', a);
          this.effects.sparkle(a.sprite.x, a.sprite.y, 0x6ae07a, 6);
        }
        // out through the gate: back to camp
        if (a.p.x <= 3 && i.moveX < -0.5) this.goBack();
      }
      a.p.x = Phaser.Math.Clamp(a.p.x, 2, this.W - PLAYER.w - 2);
      animateCharacter(a.sprite, a.p, a, dt, time);
      // where the block would go: an outline and a see-through block
      const free = this.grid.inside(aim.x, aim.y) && aim.x >= BUILD.gate && this.grid.get(aim.x, aim.y) === B.AIR && aim.y < BUILD.h - 1;
      a.aim.setVisible(free && !this.leaving).setPosition(aim.x * TILE, aim.y * TILE).setAlpha(0.6 + Math.sin(time / 150) * 0.3);
      a.ghost.setVisible(free && !this.leaving).setPosition(aim.x * TILE, aim.y * TILE).setFrame(this.blocks[a.sel]);
    }
    this.suits.update();
    this.updateCamera(dt);
    // save a moment after building (and when leaving)
    if (this.dirty) {
      this.saveT -= dt;
      if (this.saveT <= 0) this.save();
    }
  }

  place(a, aim) {
    const id = this.blocks[a.sel];
    const bodies = this.avatars.filter(Boolean).map((o) => o.p);
    if (!placeBlock(this.grid, aim.x, aim.y, id, bodies)) {
      this.events.emit('nope');
      return;
    }
    this.drawCell(aim.x, aim.y);
    const t = this.layer.getTileAt(aim.x, aim.y);
    if (t) {
      // a little pop as it lands
      const pop = this.add.image(aim.x * TILE + TILE / 2, aim.y * TILE + TILE / 2, 'tiles', id).setDepth(11).setScale(1.4);
      this.tweens.add({ targets: pop, scale: 1, duration: 120, ease: 'Back.easeOut', onComplete: () => pop.destroy() });
    }
    this.effects.sparkle(aim.x * TILE + TILE / 2, aim.y * TILE + TILE / 2, 0xffffff, 4);
    this.events.emit('place');
    this.changed();
    const state = getState(this.registry);
    const placed = (state.build?.placed ?? 0) + 1;
    setState(this.registry, { ...state, build: { ...state.build, placed } });
    earnSticker(this, 'build-first');
    if (placed >= 100) earnSticker(this, 'build-100');
    if (tallest(this.grid) >= 12) earnSticker(this, 'build-tower');
    if (kindsUsed(this.grid) >= 8) earnSticker(this, 'build-rainbow');
  }

  dig(aim) {
    const id = removeBlock(this.grid, aim.x, aim.y);
    if (id == null) return;
    this.drawCell(aim.x, aim.y);
    this.effects.chunks(aim.x, aim.y, id);
    this.events.emit('unplace');
    this.changed();
  }

  changed() {
    this.dirty = true;
    this.saveT = 1;
  }

  save() {
    if (!this.dirty) return;
    this.dirty = false;
    const state = getState(this.registry);
    setState(this.registry, { ...state, build: { ...state.build, edits: yardEdits(this.grid) } });
  }

  goBack() {
    if (this.leaving) return;
    this.leaving = true;
    this.save();
    this.cameras.main.fadeOut(400, 20, 12, 30);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Camp', { planet: 'earth', fromYard: true }));
  }

  updateCamera(dt) {
    const pts = this.avatars.filter(Boolean).map((a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y }));
    if (!pts.length) return;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const zoom = Math.max(0.9, Math.min(1.5, this.scale.width / (Math.max(...xs) - Math.min(...xs) + 160)));
    const tx = (Math.min(...xs) + Math.max(...xs)) / 2;
    // keep the grass low on screen, but follow a builder up a tall tower
    const ty = Math.min(GROUND_Y - 50, Math.min(...ys) + 20);
    const k = 1 - Math.exp(-dt * 4);
    this.cam.zoom += (zoom - this.cam.zoom) * k;
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.cameras.main.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
  }
}
