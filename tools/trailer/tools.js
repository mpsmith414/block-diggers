// Injected into the page: helpers for staging shots.
(async () => {
  const base = '/block-diggers/src/';
  const hz = await import(base + 'game/hazards.js');
  const blocks = await import(base + 'world/blocks.js');
  const player = await import(base + 'game/player.js');
  const tuning = await import(base + 'tuning.js');
  const B = blocks.B;
  const T = {
    B, hz, player, tuning,
    m: () => S('Mine'),
    c: () => S('Camp'),
    set(x, y, id) {
      const m = T.m();
      const was = m.grid.get(x, y);
      m.grid.set(x, y, id);
      m.mapView.sync(x, y);
      if (id === B.LAVA) m.lavaCells.push({ x, y });
      if (id === B.METEORITE) m.meteorites.push({ x, y });
      return was;
    },
    fill(x0, y0, x1, y1, id) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) T.set(x, y, id); },
    get(x, y) { return T.m().grid.get(x, y); },
    // stand avatar `slot` on the floor of cell (cx, cy)
    place(slot, cx, cy, facing = 1) {
      const a = T.m().avatars[slot];
      const p = player.standAt(cx, cy);
      Object.assign(a.p, { x: p.x, y: p.y, vx: 0, vy: 0, mining: null, knock: null, climbing: false, facing });
      a.fall = { ...a.fall, peak: a.p.y };
      if (a.fall) { for (const k of Object.keys(a.fall)) if (typeof a.fall[k] === 'number') a.fall[k] = a.p.y; }
    },
    placeCamp(slot, x) {
      const a = T.c().avatars[slot];
      a.p.x = x; a.p.vx = 0;
    },
    cam(x, y, zoom) { window.CAM = { x, y, zoom }; },
    nocam() { window.CAM = null; },
    lantern(n) { T.m().upgrades = { ...T.m().upgrades, lantern: n }; },
    spawn(kind, species, cx, cy, dir = 1) {
      const m = T.m();
      const e = kind === 'slime' ? hz.createSlime(cx * 16 + 2, cy * 16 + 6, dir) : hz.createBat(cx * 16 + 3, cy * 16 + 4, dir);
      e.species = species;
      e.voiceT = 99; e.giggleT = 0;
      m.hazards.enemies.push(e);
      return e;
    },
    clearEnemies() { const m = T.m(); for (const e of [...m.hazards.enemies]) m.hazards.squash(e); },
    noSpawn() { const t = T.m(); t.__noSpawn = true; },
    // horizontal floor runs: air cells with solid below, within rows top..bottom
    runs(top, bottom, minLen = 6) {
      const m = T.m(); const out = [];
      for (let y = top; y <= bottom; y++) {
        let x0 = null;
        for (let x = 1; x < m.grid.w; x++) {
          const ok = m.grid.get(x, y) === B.AIR && m.grid.get(x, y - 1) === B.AIR && blocks.isSolid(m.grid.get(x, y + 1));
          if (ok && x0 === null) x0 = x;
          if (!ok && x0 !== null) { if (x - x0 >= minLen) out.push({ x0, x1: x - 1, y, len: x - x0 }); x0 = null; }
        }
      }
      return out.sort((a, b) => b.len - a.len);
    },
    // follow avatar(s) with a smoothed camera
    follow(zoom, { slot = null, dx = 0, dy = 0, k = 0.12 } = {}) {
      const m = S('Mine') && S('Mine').sys.settings.active ? S('Mine') : S('Camp');
      const as = m.avatars.filter(Boolean).filter((a) => slot === null || a.slot === slot);
      const x = as.reduce((s, a) => s + a.p.x + 6, 0) / as.length + dx;
      const y = as.reduce((s, a) => s + a.p.y + 7, 0) / as.length + dy;
      const c = window.CAM || { x, y, zoom };
      window.CAM = { x: c.x + (x - c.x) * k, y: c.y + (y - c.y) * k, zoom: c.zoom + (zoom - c.zoom) * k };
    },
    glow(mul) {
      const m = T.m();
      if (!m.__glowOrig) m.__glowOrig = m.darkness.draw;
      const orig = m.__glowOrig;
      m.darkness.draw = (lights) => orig(lights.map((l) => ({ ...l, glow: l.glow ? l.glow * mul : l.glow })));
    },
    hide(keys = ['Hud', 'CampHud', 'Toast']) { for (const k of keys) { const s = S(k); if (s) s.sys.setVisible(false); } },
  };
  window.T = T;
  window.__toolsReady = true;
})();
