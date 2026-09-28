// Drives Block Diggers in headless Chromium, frame by frame, and records clips.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.dirname(new URL(import.meta.url).pathname);
const URL_ = 'http://localhost:5173/block-diggers/';

export function fullSave(over = {}) {
  const bank = { coal: 240, iron: 180, gold: 120, diamond: 60, emerald: 40, amber: 50, brick: 70, star: 30, heart: 0, cheese: 12 };
  const stickers = {};
  for (const o of ['coal', 'iron', 'gold', 'diamond', 'emerald', 'amber', 'brick', 'star']) stickers[`ore-${o}`] = true;
  return {
    version: 4,
    bank,
    upgrades: { pick: 5, pack: 4, lantern: 4 },
    plots: ['garden', 'house', 'pen', 'tower', 'minecart', 'statue', 'dinopark', 'workshop', 'rocket'],
    characters: ['fox', 'dino'],
    trips: 2,
    records: { deepest: 388, mostOres: 140, layers: ['dirt', 'stone', 'deep', 'crystal', 'dino', 'brick', 'meteor', 'core'], moonTrips: 1 },
    stickers,
    trophiesAwarded: [],
    pets: ['mole', 'glowbug', 'batbuddy', 'rex', 'trike'],
    decor: {
      stock: {},
      placed: [
        { id: 'lamp', x: 60 }, { id: 'windmill', x: 290 }, { id: 'flowerbed', x: 400 }, { id: 'lamp', x: 425 },
        { id: 'pond', x: 480 }, { id: 'pumpkin', x: 520 }, { id: 'crystallamp', x: 545 }, { id: 'bench', x: 570 },
        { id: 'fence', x: 600 }, { id: 'rainbowarch', x: 640 }, { id: 'brickcastle', x: 700 }, { id: 'brickcar', x: 735 },
        { id: 'mailbox', x: 760 }, { id: 'lamp', x: 780 }, { id: 'brickrobot', x: 1080 }, { id: 'crystallamp', x: 1130 },
        { id: 'flowerbed', x: 1160 }, { id: 'lamp', x: 1190 },
      ],
    },
    garden: { stock: 6 },
    pen: { gifts: 2 },
    visitors: { met: ['bear', 'rabbit', 'owl'], requests: {}, seen: ['bear', 'rabbit', 'owl'] },
    ...over,
  };
}

export async function openGame({ save = fullSave(), seed = 1234, chars = ['fox', 'dino'] } = {}) {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => console.log('pageerror:', e.message));
  await page.addInitScript(({ save, seed }) => {
    const g = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (t, o) {
      if (/webgl/.test(t)) o = { ...(o || {}), preserveDrawingBuffer: true };
      return g.call(this, t, o);
    };
    // deterministic randomness
    let s = seed >>> 0;
    Math.random = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    try { localStorage.clear(); if (save) localStorage.setItem('block-diggers-save', JSON.stringify(save)); } catch {}
    window.__sfxLog = [];
    window.__frame = 0;
  }, { save, seed });
  await page.goto(URL_);
  await page.waitForFunction(() => window.h && window.__game && window.__game.scene.isActive('Title'), null, { timeout: 60000 });
  await page.evaluate(() => {
    const audio = __game.registry.get('audio');
    audio.sfx = { play: (name, arg) => window.__sfxLog.push({ f: window.__frame, name, arg: typeof arg === 'object' ? undefined : arg }) };
    audio.music = { play() {}, stop() {}, current: null };
    window.S = (k) => __game.scene.getScene(k);
    __game.loop.sleep();
  });
  await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'tools.js'), 'utf8') });
  await page.waitForFunction(() => window.__toolsReady);
  await page.evaluate((chars) => __game.registry.set('characters', chars), chars);
  const d = new Director(browser, page);
  return d;
}

class Director {
  constructor(browser, page) {
    this.browser = browser;
    this.page = page;
    this.pads = [{}, {}];
  }
  ev(fn, arg) { return this.page.evaluate(fn, arg); }
  async advance(ms) { await this.page.evaluate((ms) => h.advance(ms), ms); }
  async pad(i, state) { this.pads[i] = state; await this.page.evaluate(([i, s]) => h.pad(i, s), [i, state]); }
  // Join two players from the title screen and pick characters.
  async joinPlayers(n = 2) {
    for (let i = 0; i < n; i++) {
      await this.pad(i, { a: true }); await this.advance(80);
      await this.pad(i, {}); await this.advance(80);
    }
    await this.advance(200);
  }
  // Start a scene fresh (stops gameplay scenes first).
  async start(key, data) {
    await this.page.evaluate(([key, data]) => {
      for (const k of ['Mine', 'Camp', 'Title', 'Launch', 'Summary', 'Hud', 'CampHud', 'Book', 'Pause']) {
        if (__game.scene.isActive(k) || __game.scene.isSleeping(k)) __game.scene.stop(k);
      }
      __game.scene.start(key, data);
    }, [key, data]);
    await this.advance(50);
  }
  // Record `frames` frames at 60fps into clips/<name>. `script(f)` may return
  // actions for frame f: { p0: padState, p1: padState, js: 'code' }.
  async record(name, frames, script = () => null, { batch = 30 } = {}) {
    const dir = path.join(ROOT, 'clips', name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    await this.page.evaluate(() => { window.__sfxLog = []; window.__frame = 0; });
    const t0 = Date.now();
    let f = 0;
    while (f < frames) {
      const n = Math.min(batch, frames - f);
      const acts = [];
      for (let k = 0; k < n; k++) acts.push(script(f + k) || null);
      const shots = await this.page.evaluate(async (acts) => {
        const out = [];
        for (const a of acts) {
          if (a) {
            if (a.p0) h.pad(0, a.p0);
            if (a.p1) h.pad(1, a.p1);
            if (a.js) (0, eval)(a.js);
            if (a.fn) await (0, eval)(a.fn)();
          }
          if (window.__onFrame) window.__onFrame(window.__frame);
          h.advance(window.__stepMs || 1000 / 60);
          out.push(__game.canvas.toDataURL('image/png'));
          window.__frame++;
        }
        return out;
      }, acts);
      shots.forEach((s, k) => fs.writeFileSync(path.join(dir, `${String(f + k).padStart(5, '0')}.png`), Buffer.from(s.split(',')[1], 'base64')));
      f += n;
    }
    const log = await this.page.evaluate(() => window.__sfxLog);
    fs.writeFileSync(path.join(dir, 'sfx.json'), JSON.stringify(log));
    console.log(`recorded ${name}: ${frames} frames, ${log.length} sfx, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    await this.page.evaluate(() => { window.__onFrame = null; });
  }
  // window.CAM = {x, y, zoom} overrides the scene's own camera while set.
  async camOverride(key) {
    await this.page.evaluate((key) => {
      const sc = S(key);
      if (sc.__camPatched) return;
      sc.__camPatched = true;
      const orig = sc.updateCamera.bind(sc);
      sc.updateCamera = (dt) => {
        if (!window.CAM) return orig(dt);
        const c = window.CAM;
        if (sc.cam) Object.assign(sc.cam, { x: c.x, y: c.y, zoom: c.zoom });
        sc.cameras.main.setZoom(c.zoom).centerOn(c.x, c.y);
      };
    }, key);
  }
  async hud(visible) {
    await this.page.evaluate((v) => { for (const k of ['Hud', 'CampHud', 'Toast']) { const s = S(k); if (s && s.sys.settings.active) s.sys.setVisible(v); } }, visible);
  }
  async shot(file) {
    const s = await this.page.evaluate(() => __game.canvas.toDataURL('image/png'));
    fs.writeFileSync(path.join(ROOT, file), Buffer.from(s.split(',')[1], 'base64'));
  }
  close() { return this.browser.close(); }
}
