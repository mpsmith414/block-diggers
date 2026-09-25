import './diag.css';
import { readPad, BUTTON_INDEX } from '../input/devices.js';
import { applyDeadzone, createEdge } from '../input/intents.js';
import {
  installBackGuard, setCursorHidden, setPointerLock, setFullscreen, createEventBlocker,
} from '../input/tvGuard.js';

// Controller diagnostics for the Fire TV Cube's Silk browser.
// Answers: which inputs reach the page, which ones drive Silk's cursor,
// and whether any page-side trick switches the cursor off.
//
// The evidence tally counts everything that arrives, whatever its source, so
// one photo at the end of a test shows what got through. (An earlier version
// only counted cursor/key events while a stick was visibly reaching the page,
// which read as all zeros when Silk kept the sticks for itself.)

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const setHTML = (node, html) => { if (node.innerHTML !== html) node.innerHTML = html; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Race a promise against a timeout.
const within = (promiseOrValue, ms, fallback) => {
  let timer;
  const timeout = new Promise((r) => { timer = setTimeout(() => r(fallback), ms); });
  return Promise.race([Promise.resolve(promiseOrValue), timeout]).finally(() => clearTimeout(timer));
};

// ---------- layout ----------
const app = document.getElementById('app');
const statsBox = el('div', 'stats');
const arena = el('canvas', 'arena');
arena.width = 640;
arena.height = 240;
const table = el('table', 'verdict');
const resetBtn = el('button', 'reset', 'Reset (X)');
const tableHeading = el('h2', null, 'Everything that arrived ');
tableHeading.append(resetBtn);
const hint = el('p', 'hint', 'Wiggle both sticks, press the D-pad and every button, then take a photo.');
const togglesBox = el('div', 'toggles');
const padsBox = el('div', 'pads');
const keyLogBox = el('ol', 'keylog');
// Two-column grid so the arena, tally and toggles all fit on one TV screen
// (960x540) without scrolling. Controllers/Last keys stay below the fold.
const colLeft = el('div', 'col-left');
colLeft.append(arena, tableHeading, hint, table);
const colRight = el('div', 'col-right');
colRight.append(el('h2', null, 'Cursor fixes: LB/RB pick · Y flips · or click · or keys 1–5'), togglesBox);
const mainGrid = el('div', 'main-grid');
mainGrid.append(colLeft, colRight);
app.append(
  el('h1', null, 'Block Diggers · Controller Check'),
  statsBox, mainGrid,
  el('h2', null, 'Controllers'), padsBox,
  el('h2', null, 'Last keys'), keyLogBox,
);

// ---------- evidence tally ----------
const BTN_NAMES = {
  0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
  8: 'View', 9: 'Menu', 10: 'LS', 11: 'RS', 16: 'Home',
};
const DPAD = { 12: '↑', 13: '↓', 14: '←', 15: '→' };
const blankEvidence = () => ({ pads: new Set(), stickMax: [0, 0, 0, 0], buttons: {}, keys: {}, moves: 0, clicks: 0 });
let ev = blankEvidence();
const prevPressed = {}; // gamepad index -> Set of button indices down last frame
let lastPointer = null;
let backCount = 0;
const keyLog = [];
let renderedKeys = '';

// Registered before any blocker so these always see the events.
window.addEventListener('pointermove', (e) => {
  ev.moves++;
  lastPointer = { x: e.clientX, y: e.clientY };
}, { capture: true });

window.addEventListener('keydown', (e) => {
  keyLog.unshift(`${JSON.stringify(e.key)}  code=${e.code || '-'}  keyCode=${e.keyCode}`);
  keyLog.length = Math.min(keyLog.length, 8);
  if (e.repeat) return; // logged above, but a held key counts once and toggles nothing
  const name = e.key === ' ' ? 'Space' : e.key;
  ev.keys[name] = (ev.keys[name] || 0) + 1;
  const n = Number(e.key);
  if (n >= 1 && n <= TOGGLES.length) flip(n - 1);
  else fireArmed();
}, { capture: true });

window.addEventListener('pointerdown', (e) => {
  ev.clicks++;
  if (e.target.closest && e.target.closest('.toggle')) return; // the button's own click handles it
  fireArmed();
}, { capture: true });

installBackGuard(window, () => { backCount++; });
resetBtn.addEventListener('click', () => { ev = blankEvidence(); });

// ---------- cursor-fix toggles ----------
const blockKeys = createEventBlocker(window, ['keydown', 'keyup']);
const blockPointer = createEventBlocker(window, ['pointermove', 'mousemove']);
const TOGGLES = [
  { name: 'Hide cursor (CSS)', on: false, result: '', apply: (on) => (setCursorHidden(document, on), 'ok') },
  { name: 'Pointer lock', on: false, result: '', gesture: true, apply: (on) => setPointerLock(document, arena, on) },
  { name: 'Fullscreen', on: false, result: '', gesture: true, apply: (on) => setFullscreen(document, document.documentElement, on) },
  { name: 'Block key defaults', on: false, result: '', apply: (on) => (blockKeys.set(on), 'ok') },
  { name: 'Block pointer moves', on: false, result: '', apply: (on) => (blockPointer.set(on), 'ok') },
];
let selected = 0;
let armed = null;
const busy = new Set();

// apply() runs synchronously inside flip(), so a flip called from a click or
// keydown handler still counts as a user gesture for pointer lock / fullscreen.
async function flip(i) {
  if (busy.has(i)) return;
  busy.add(i);
  try {
    const t = TOGGLES[i];
    const want = !t.on;
    t.result = 'trying…';
    renderToggles();
    const result = await within(t.apply(want), 3000, 'error: no answer after 3s');
    if (result === 'ok') {
      t.on = want;
      t.result = 'ok';
      if (armed === i) armed = null;
    } else if (t.gesture && want) {
      t.result = `${result} · armed: click or press any key`;
      armed = i;
    } else {
      t.result = result;
    }
    renderToggles();
  } finally {
    busy.delete(i);
  }
}

function fireArmed() {
  if (armed == null) return;
  const i = armed;
  armed = null;
  flip(i);
}

const toggleButtons = TOGGLES.map((t, i) => {
  const b = el('button', 'toggle');
  b.addEventListener('click', () => flip(i));
  togglesBox.append(b);
  return b;
});

function renderToggles() {
  TOGGLES.forEach((t, i) => {
    const b = toggleButtons[i];
    b.className = `toggle${t.on ? ' on' : ''}${i === selected ? ' selected' : ''}`;
    setHTML(b, `${i + 1}. ${t.name}: <b>${t.on ? 'ON' : 'off'}</b><small>${esc(t.result) || '&nbsp;'}</small>`);
  });
}
renderToggles();

// The browser can drop pointer lock / fullscreen on its own (Esc, focus
// loss, etc.) without going through flip(); keep the toggle state in sync.
document.addEventListener('pointerlockchange', () => {
  TOGGLES[1].on = !!document.pointerLockElement;
  renderToggles();
});
document.addEventListener('fullscreenchange', () => {
  TOGGLES[2].on = !!document.fullscreenElement;
  renderToggles();
});

function renderKeys() {
  const keyStr = keyLog.join('\n');
  if (renderedKeys === keyStr) return;
  renderedKeys = keyStr;
  keyLogBox.innerHTML = '';
  keyLog.forEach((key) => {
    const li = document.createElement('li');
    li.textContent = key;
    keyLogBox.append(li);
  });
}

// ---------- per-frame ----------
const dots = {
  leftStick: { x: 110, y: 120, color: '#4aa3ff', tag: 'L' },
  rightStick: { x: 320, y: 120, color: '#ffa94a', tag: 'R' },
  dpad: { x: 530, y: 120, color: '#5fd35f', tag: 'D' },
};
const lbEdge = createEdge();
const rbEdge = createEdge();
const yEdge = createEdge();
const xEdge = createEdge();
const wrap = (v, max) => ((v % max) + max) % max;
let last = performance.now();

function move(k, v, dt) {
  if (v.x === 0 && v.y === 0) return;
  const d = dots[k];
  d.x = wrap(d.x + v.x * 240 * dt, arena.width);
  d.y = wrap(d.y + v.y * 240 * dt, arena.height);
}

function tallyPad(gp) {
  ev.pads.add(`#${gp.index} ${gp.id}`);
  for (let i = 0; i < 4; i++) ev.stickMax[i] = Math.max(ev.stickMax[i], Math.abs(gp.axes[i] ?? 0));
  const before = prevPressed[gp.index] || new Set();
  const now = new Set();
  gp.buttons.forEach((b, i) => {
    if (!(b && b.pressed)) return;
    now.add(i);
    if (!before.has(i)) ev.buttons[i] = (ev.buttons[i] || 0) + 1;
  });
  prevPressed[gp.index] = now;
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  let pads = [];
  try { pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean); } catch { pads = []; }

  let lb = false; let rb = false; let y = false; let x = false;
  for (const gp of pads) {
    tallyPad(gp);
    const s = readPad(gp);
    move('leftStick', applyDeadzone(s.axes.lx, s.axes.ly), dt);
    move('rightStick', applyDeadzone(s.axes.rx, s.axes.ry), dt);
    move('dpad', {
      x: (s.buttons.right ? 1 : 0) - (s.buttons.left ? 1 : 0),
      y: (s.buttons.down ? 1 : 0) - (s.buttons.up ? 1 : 0),
    }, dt);
    lb ||= s.buttons.lb; rb ||= s.buttons.rb; y ||= s.buttons.y; x ||= s.buttons.x;
  }

  if (lbEdge(lb)) { selected = (selected + TOGGLES.length - 1) % TOGGLES.length; renderToggles(); }
  if (rbEdge(rb)) { selected = (selected + 1) % TOGGLES.length; renderToggles(); }
  if (yEdge(y)) flip(selected);
  if (xEdge(x)) ev = blankEvidence();

  renderStats(pads.length);
  renderTable();
  renderPads(pads);
  renderKeys();
  drawArena();
  requestAnimationFrame(frame);
}

function chip(label, value, good) {
  const cls = good === undefined ? 'chip' : `chip ${good ? 'good' : 'bad'}`;
  return `<span class="${cls}">${label}: <b>${value}</b></span>`;
}

function renderStats(padCount) {
  const focus = document.hasFocus();
  setHTML(statsBox, [
    chip('Page focus', focus ? 'yes' : 'NO', focus),
    chip('Controllers', padCount, padCount > 0),
    chip('Pointer lock', document.pointerLockElement ? 'on' : 'off'),
    chip('Fullscreen', document.fullscreenElement ? 'on' : 'off'),
    chip('Back presses', backCount),
  ].join(''));
}

// A cell that reads green when something arrived and red when nothing did.
const cell = (text, got) => `<td class="${got ? 'got' : 'none'}">${text}</td>`;
const counts = (entries) => entries.map(([name, n]) => `${esc(name)}×${n}`).join('  ');

function renderTable() {
  const [lx, ly, rx, ry] = ev.stickMax;
  const stick = (a, b) => cell(`max ${a.toFixed(2)} ↔ · ${b.toFixed(2)} ↕`, Math.max(a, b) > 0.3);
  const dpad = Object.entries(DPAD).map(([i, name]) => [name, ev.buttons[i] || 0]);
  const buttons = Object.entries(ev.buttons)
    .filter(([i]) => !DPAD[i])
    .map(([i, n]) => [BTN_NAMES[i] || `#${i}`, n]);
  const keys = Object.entries(ev.keys).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const rows = [
    ['Controllers seen', cell(ev.pads.size ? [...ev.pads].map(esc).join('<br>') : 'none', ev.pads.size > 0)],
    ['Left stick', stick(lx, ly)],
    ['Right stick', stick(rx, ry)],
    ['D-pad', cell(counts(dpad), dpad.some(([, n]) => n > 0))],
    ['Buttons', cell(buttons.length ? counts(buttons) : 'none', buttons.length > 0)],
    ['Keys', cell(keys.length ? counts(keys) : 'none', keys.length > 0)],
    ['Cursor', cell(`${ev.moves} moves · ${ev.clicks} clicks`, ev.moves + ev.clicks > 0)],
  ];
  setHTML(table, rows.map(([label, td]) => `<tr><th>${label}</th>${td}</tr>`).join(''));
}

function renderPads(pads) {
  if (pads.length === 0) {
    setHTML(padsBox, '<pre>No controllers seen yet. Press a button on each controller.</pre>');
    return;
  }
  const html = pads.map((gp) => {
    const s = readPad(gp);
    const lit = Object.keys(BUTTON_INDEX).filter((k) => s.buttons[k]).join(' ') || '-';
    const raw = gp.buttons.map((b, i) => (b && b.pressed ? i : null)).filter((i) => i !== null).join(',') || '-';
    const axes = gp.axes.map((a) => a.toFixed(2)).join('  ');
    return `<pre>#${gp.index} ${esc(gp.id)}\nmapping: ${esc(gp.mapping || '(none)')}  buttons: ${gp.buttons.length}  axes: ${gp.axes.length}\naxes: ${axes}\npressed: ${lit}   raw: ${raw}</pre>`;
  }).join('');
  setHTML(padsBox, html);
}

function drawArena() {
  const ctx = arena.getContext('2d');
  ctx.clearRect(0, 0, arena.width, arena.height);
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const d of Object.values(dots)) {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141020';
    ctx.fillText(d.tag, d.x, d.y + 1);
  }
  if (lastPointer) {
    const r = arena.getBoundingClientRect();
    const px = ((lastPointer.x - r.left) / r.width) * arena.width;
    const py = ((lastPointer.y - r.top) / r.height) * arena.height;
    if (px >= 0 && px <= arena.width && py >= 0 && py <= arena.height) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

requestAnimationFrame(frame);
