import { openGame, fullSave } from './director.mjs';

const SEED = 777;
const HI = { w: 960, h: 540 };

async function mine(d, { seed = SEED, row = null, lantern = 1, pick = 5, world, hi = true } = {}) {
  await d.ev(([hi]) => { if (hi) __game.scale.resize(960, 540); T.tuning.SPAWN.every = 1e9; }, [hi]);
  await d.start('Mine', { seed, upgrades: { pick, pack: 4, lantern }, startRow: row, world });
  await d.advance(400);
  await d.camOverride('Mine');
  await d.ev(() => T.hide());
}
async function camp(d, { hi = true } = {}) {
  await d.ev(([hi]) => { if (hi) __game.scale.resize(960, 540); }, [hi]);
  await d.start('Camp');
  await d.advance(600);
  await d.camOverride('Camp');
  await d.ev(() => { T.hide(); const c = T.c(); for (const k of ['prompt', 'benchStar', 'plotStar', 'downPrompt']) c[k].setAlpha(0); });
}
const onFrame = (d, src) => d.ev((src) => { window.__onFrame = (0, eval)(src); }, src);
const ms = (s) => Math.round(s * 60);

export const SHOTS = {
  // ---------------- Act I ----------------
  async camp_night(d) {
    await camp(d);
    await d.ev(() => { T.placeCamp(0, 230); T.placeCamp(1, 268); const c = T.c(); c.avatars[0].p.facing = 1; c.avatars[1].p.facing = -1; });
    await onFrame(d, `(f) => T.cam(120 + f * 0.75, 112, 3)`);
    await d.record('camp_night', 480);
  },
  async descend(d) {
    await mine(d, { lantern: 0 });
    await d.ev(() => {
      for (let y = 4; y < 40; y++) T.set(24, y, T.B.LADDER);
      T.set(24, 40, T.B.DIRT);
      for (const [x, y] of [[21, 10], [27, 13], [20, 18], [22, 22], [28, 25], [26, 29], [19, 27], [29, 19], [21, 31], [27, 34], [22, 36]]) T.set(x, y, T.B.COAL_DIRT);
      T.place(0, 24, 3); T.place(1, 24, 1);
    });
    await d.record('descend', 540, (f) => {
      if (f === 0) return { p0: { ly: 1 }, p1: { ly: 1 }, js: `T.cam(24*16+8, 30, 4)` };
      return { js: `T.follow(4, { slot: 0, dy: -12, k: 0.05 })` };
    });
  },
  async crystal(d) {
    await mine(d, { row: 150, lantern: 2 });
    await d.ev(() => { T.place(0, 17, 175); T.place(1, 16, 175); T.glow(0.7); });
    await d.record('crystal', 420, (f) => {
      if (f === 0) return { p0: { lx: 0.7 }, p1: { lx: 0.7 }, js: `T.cam(21*16, 175*16-40, 3)` };
      return { js: `T.follow(3, { dy: -36, k: 0.03 })` };
    });
  },
  async heroes(d) {
    await mine(d, { row: 60, lantern: 4 });
    await d.ev(() => { T.place(0, 23, 60, 1); T.place(1, 25, 60, -1); T.glow(0.25); S('Mine').stationLight = null; });
    await d.record('heroes', 330, (f) => {
      if (f === 0) return { js: `T.cam(24*16+8, 60*16+4, 7)` };
      if (f === 150) return { js: `S('Mine').startSneeze(S('Mine').avatars[1])` };
      return null;
    });
  },
  // ---------------- Act II ----------------
  async dig_down(d) {
    await mine(d, { row: 20, lantern: 3 });
    await d.ev(() => {
      const ores = [T.B.COAL_DIRT, T.B.GOLD_STONE, T.B.DIRT, T.B.IRON, T.B.DIAMOND, T.B.DIRT, T.B.EMERALD, T.B.GOLD_STONE, T.B.DIRT, T.B.DIAMOND, T.B.COAL_DIRT, T.B.GOLD_STONE];
      for (let i = 0; i < 30; i++) { T.set(23, 21 + i, ores[i % ores.length]); T.set(25, 21 + i, ores[(i + 5) % ores.length]); }
      T.place(0, 23, 20); T.place(1, 25, 20); T.glow(0.5);
    });
    await d.record('dig_down', 300, (f) => {
      if (f === 0) return { p0: { ly: 1 }, p1: { ly: 1 }, js: `T.cam(24*16+8, 20*16, 4)` };
      return { js: `T.follow(4, { dy: 10, k: 0.15 })` };
    });
  },
  async ore_streak(d) {
    await mine(d, { row: 60, lantern: 3 });
    await d.ev(() => {
      const ores = [T.B.GOLD_STONE, T.B.DIAMOND, T.B.EMERALD, T.B.GOLD_STONE, T.B.DIAMOND, T.B.EMERALD, T.B.IRON, T.B.DIAMOND, T.B.GOLD_STONE, T.B.EMERALD, T.B.DIAMOND, T.B.GOLD_STONE, T.B.EMERALD, T.B.DIAMOND];
      for (let i = 0; i < ores.length; i++) { T.set(28 + i, 60, ores[i]); T.set(28 + i, 59, ores[(i + 3) % ores.length]); T.set(28 + i, 58, T.B.STONE); T.set(28 + i, 61, T.B.STONE); }
      T.place(0, 26, 60); T.place(1, 24, 60); T.glow(0.5);
    });
    await d.record('ore_streak', 300, (f) => {
      if (f === 0) return { p0: { lx: 1 }, p1: { lx: 1 }, js: `T.cam(28*16, 60*16, 4)` };
      return { js: `T.follow(4, { slot: 0, dx: 20, dy: -6, k: 0.12 })` };
    });
  },
  async lava_monster(d) {
    await mine(d, { row: 110, lantern: 3 });
    await d.ev(() => {
      // a corridor to the right: floor, a lava pool, then rock with gems and slimes
      T.fill(27, 107, 44, 110, T.B.AIR);
      T.fill(27, 111, 44, 112, T.B.DEEP);
      T.fill(27, 106, 44, 106, T.B.DEEP);
      T.set(30, 111, T.B.LAVA); T.set(31, 111, T.B.LAVA); T.set(30, 112, T.B.DEEP);
      T.fill(38, 107, 39, 110, T.B.DEEP);
      T.set(38, 109, T.B.DIAMOND); T.set(38, 110, T.B.GOLD_DEEP); T.set(39, 110, T.B.EMERALD); T.set(39, 109, T.B.DIAMOND);
      T.place(0, 26, 110); T.place(1, 23, 110); T.glow(0.6);
      T.spawn('slime', 'slime', 35, 110, -1); T.spawn('slime', 'slime', 33, 110, -1); T.spawn('bat', 'bat', 34, 108, -1);
    });
    await d.record('lava_monster', 420, (f) => {
      if (f === 0) return { p0: { lx: 1 }, p1: { lx: 0 }, js: `T.cam(29*16, 110*16, 3.5)` };
      return { js: `T.follow(3.5, { slot: 0, dx: 30, dy: -10, k: 0.1 })` };
    });
  },
  async dino(d) {
    await mine(d, { row: 190, lantern: 3 });
    await d.ev(() => { T.place(0, 24, 197, 1); T.place(1, 23, 197, 1); T.glow(0.6); });
    await d.record('dino', 360, (f) => {
      if (f === 0) return { js: `T.cam(24*16, 196*16+4, 5)` };
      if (f === 90) return { js: `T.spawn('bat', 'ptero', 29, 196, -1); T.spawn('bat', 'ptero', 30, 195, -1);` };
      return null;
    });
  },
  async brick_spring(d) {
    await mine(d, { row: 262, lantern: 3 });
    await d.ev(() => {
      T.fill(25, 252, 42, 262, T.B.AIR);
      T.fill(25, 263, 42, 264, T.B.BRICKS);
      T.set(30, 263, T.B.SPRING); T.set(36, 263, T.B.SPRING);
      T.fill(43, 250, 44, 264, T.B.BRICKS); T.fill(25, 250, 42, 251, T.B.BRICKS);
      for (const x of [28, 33, 39]) T.set(x, 251, T.B.BRICK_ORE);
      T.place(0, 26, 262); T.place(1, 24, 262); T.glow(0.6);
      T.spawn('slime', 'robot', 33, 262, -1);
    });
    await d.record('brick_spring', 420, (f) => {
      if (f === 0) return { p0: { lx: 1 }, p1: { lx: 0.6 }, js: `T.cam(32*16, 258*16, 3)` };
      return { js: `T.follow(3, { slot: 0, dy: -20, k: 0.08 })` };
    });
  },
  async meteor(d) {
    await mine(d, { row: 300, lantern: 3 });
    await d.ev(() => {
      T.fill(25, 292, 42, 300, T.B.AIR);
      T.fill(25, 301, 42, 302, T.B.METEOR);
      T.fill(43, 290, 44, 302, T.B.METEOR); T.fill(25, 290, 42, 291, T.B.METEOR);
      T.set(36, 300, T.B.METEORITE); T.set(36, 299, T.B.METEOR); T.set(36, 301, T.B.METEOR);
      for (const x of [29, 31, 40]) T.set(x, 291, T.B.STAR);
      T.place(0, 26, 300); T.place(1, 24, 300); T.glow(0.6);
      T.spawn('bat', 'alien', 32, 295, -1); T.spawn('bat', 'alien', 39, 294, -1);
    });
    await d.record('meteor', 480, (f) => {
      const a = [];
      if (f === 0) return { p0: { lx: 0.8, a: true }, p1: { lx: 0.6 }, js: `T.cam(31*16, 296*16, 3)` };
      if (f === 20) return { p0: { lx: 0.8 }, p1: { lx: 0.6, a: true } };
      if (f === 40) return { p0: { lx: 0.8 }, p1: { lx: 0.6 } };
      if (f === 130) return { p0: { lx: 1 }, p1: { lx: 0.3 } };
      if (f === 300) return { p0: { a: true }, p1: { a: true } };
      if (f === 320) return { p0: {}, p1: {} };
      return { js: `T.follow(3, { dy: -30, k: 0.05 })` };
    });
  },
  async boom(d) {
    await mine(d, { row: 70, lantern: 3 });
    await d.ev(() => {
      T.fill(27, 67, 36, 70, T.B.AIR); T.fill(27, 71, 36, 72, T.B.STONE);
      T.set(29, 70, T.B.BOOM); T.set(30, 70, T.B.BOOM); T.set(30, 69, T.B.BOOM);
      T.fill(31, 66, 33, 70, T.B.STONE); T.set(31, 69, T.B.GOLD_STONE); T.set(32, 70, T.B.DIAMOND); T.set(31, 70, T.B.GOLD_STONE);
      T.place(0, 28, 70); T.place(1, 25, 70); T.glow(0.6);
    });
    await d.record('boom', 300, (f) => {
      if (f === 0) return { p0: { lx: 1 }, js: `T.cam(28*16, 69*16, 3.5)` };
      if (f === 20) return { p0: { lx: -1 }, p1: { lx: -0.5 } };
      if (f === 60) return { p0: {}, p1: {} };
      return null;
    });
  },
  async bigchest(d) {
    await mine(d, { row: 140, lantern: 3 });
    await d.ev(() => {
      T.fill(12, 141, 21, 143, T.B.AIR);
      T.set(16, 143, T.B.BIGCHEST); T.set(17, 143, T.B.BIGCHEST_R);
      T.fill(12, 144, 21, 145, T.B.DEEP);
      T.place(0, 13, 143); T.place(1, 20, 143, -1); T.glow(0.6);
    });
    await d.record('bigchest', 300, (f) => {
      if (f === 0) return { js: `T.cam(17*16, 142*16+8, 4.5)` };
      if (f === 40) return { p0: { lx: 1 }, p1: { lx: -1 } };
      if (f === 130) return { p0: {}, p1: {} };
      return null;
    });
  },
  async bubble(d) {
    await mine(d, { row: 150, lantern: 3 });
    await d.ev(() => { T.place(0, 26, 175, -1); T.place(1, 16, 175); T.glow(0.6); });
    await d.record('bubble', 300, (f) => {
      if (f === 0) return { js: `T.cam(21*16, 173*16, 3)` };
      if (f === 40) return { p1: { y: true } };
      if (f === 46) return { p1: {} };
      return null;
    });
  },
  async camp_build(d) {
    await camp(d);
    await d.ev(() => { T.placeCamp(0, 93 * 16 - 20); T.placeCamp(1, 99 * 16 + 30); });
    await d.record('camp_build', 480, (f) => {
      if (f === 0) return { js: `T.cam(96*16, 150, 3.5)` };
      if (f === 30) return { js: `(() => { const c = T.c(); c.addBuilding(7, 'workshop', true); c.events.emit('built'); })()` };
      return null;
    });
  },
  async camp_day(d) {
    await camp(d);
    await d.ev(() => { T.placeCamp(0, 700); T.placeCamp(1, 740); });
    await onFrame(d, `(f) => T.cam(420 + f * 2.2, 120, 2)`);
    await d.record('camp_day', 480, (f) => (f === 0 ? { p0: { lx: 1 }, p1: { lx: 1 } } : null));
  },
  // ---------------- Act III ----------------
  async core_heart(d) {
    await mine(d, { row: 370, lantern: 1 });
    await d.ev(() => { T.place(0, 20, 387); T.place(1, 19, 387); T.glow(0.8); });
    await d.record('core_heart', 480, (f) => {
      if (f === 0) return { js: `T.cam(24*16+8, 372*16, 3)` };
      if (f < 240) return { js: `T.cam(24*16+8, 372*16 + ${f} * 0.3 * 16 * (1 - ${f}/480) , 3)` };
      if (f === 240) return { p0: { lx: 1 }, p1: { lx: 1 } };
      return null;
    });
  },
  async launch(d) {
    await d.ev(() => { window.__stepMs = 15; });
    await d.start('Launch', {});
    await d.ev(() => { const L = S('Launch'); const orig = L.add.bitmapText.bind(L.add); L.add.bitmapText = (...a) => orig(...a).setVisible(false); });
    await d.record('launch', 460);
  },
  async moon(d) {
    await mine(d, { world: 'moon', lantern: 3 });
    await d.ev(() => { T.glow(0.5); });
    await d.record('moon', 480, (f) => {
      if (f === 0) return { js: `T.cam(24*16+40, -40, 3)` };
      if (f === 90) return { p0: { lx: 0.7, a: true }, p1: { lx: 0.5, a: true } };
      if (f === 110) return { p0: { lx: 0.7 }, p1: { lx: 0.5 } };
      if (f === 220) return { p0: { lx: 0.7, a: true }, p1: { lx: 0.5, a: true } };
      if (f === 240) return { p0: { lx: 0.7 }, p1: { lx: 0.5 } };
      if (f === 360) return { p0: {}, p1: {} };
      return { js: `T.follow(3, { dx: 40, dy: -50, k: 0.03 })` };
    });
  },
  async drink(d) {
    await camp(d);
    await d.ev(() => { T.placeCamp(1, 1250 - 6); T.placeCamp(0, 1218); const c = T.c(); c.avatars[1].p.facing = -1; c.avatars[0].p.facing = 1; });
    await d.record('drink', 330, (f) => (f === 0 ? { js: `T.cam(1244, 158, 7)` } : null));
  },
  // quick flurry
  async flurry_chest(d) {
    await mine(d, { row: 80, lantern: 3 });
    await d.ev(() => {
      T.fill(22, 77, 30, 80, T.B.AIR); T.fill(22, 81, 30, 82, T.B.STONE);
      T.set(27, 80, T.B.CHEST);
      T.place(0, 24, 80); T.place(1, 22, 80); T.glow(0.6);
    });
    await d.record('flurry_chest', 180, (f) => (f === 0 ? { p0: { lx: 1 }, js: `T.cam(26*16, 79*16+8, 4.5)` } : null));
  },
  async flurry_slime(d) {
    await mine(d, { row: 30, lantern: 3 });
    await d.ev(() => {
      T.fill(20, 26, 30, 30, T.B.AIR); T.fill(20, 31, 30, 32, T.B.DIRT);
      T.place(0, 22, 30); T.place(1, 20, 30); T.glow(0.6);
      T.spawn('slime', 'slime', 26, 30, -1);
    });
    await d.record('flurry_slime', 180, (f) => {
      if (f === 0) return { p0: { lx: 1, a: true }, js: `T.cam(25*16, 29*16, 4)` };
      if (f === 25) return { p0: { lx: 0.4 } };
      if (f === 60) return { p0: {} };
      return null;
    });
  },
  async flurry_geode(d) {
    await mine(d, { row: 90, lantern: 3 });
    await d.ev(() => {
      T.fill(20, 87, 30, 90, T.B.AIR); T.fill(20, 91, 30, 92, T.B.STONE);
      T.set(26, 90, T.B.GEODE); T.set(26, 89, T.B.STONE);
      T.place(0, 24, 90); T.place(1, 22, 90); T.glow(0.6);
    });
    await d.record('flurry_geode', 180, (f) => (f === 0 ? { p0: { lx: 1 }, js: `T.cam(25*16+8, 89*16+8, 4.5)` } : null));
  },
};

SHOTS.camp_night.save = fullSave({ trips: 3 });
SHOTS.camp_day.save = fullSave({ trips: 1 });
SHOTS.camp_build.save = (() => { const s = fullSave({ trips: 0 }); s.plots[7] = null; return s; })();
SHOTS.drink.save = (() => { const s = fullSave({ trips: 2, pets: [] }); s.decor.placed = s.decor.placed.filter((d) => d.x < 1000 && d.id !== 'pond'); s.decor.placed.push({ id: 'pond', x: 1250 }, { id: 'lamp', x: 1212 }, { id: 'flowerbed', x: 1292 }); return s; })();
SHOTS.heroes.save = fullSave({ pets: [] });
SHOTS.descend.save = fullSave({ pets: ['glowbug'] });
SHOTS.dino.save = fullSave({ pets: ['rex', 'trike'] });
SHOTS.core_heart.save = fullSave({ pets: [] });
SHOTS.moon.save = fullSave({ pets: [] });
for (const k of ['dig_down', 'ore_streak', 'lava_monster', 'brick_spring', 'meteor', 'boom', 'bigchest', 'bubble', 'flurry_chest', 'flurry_slime', 'flurry_geode', 'crystal']) {
  SHOTS[k].save = fullSave({ pets: k === 'crystal' ? ['glowbug', 'batbuddy'] : [] });
}

const names = process.argv.slice(2);
for (const n of names) {
  const d = await openGame(SHOTS[n].save ? { save: SHOTS[n].save } : {});
  await d.joinPlayers(2);
  try { await SHOTS[n](d); } catch (e) { console.log('shot failed', n, e.message); }
  await d.close();
}
