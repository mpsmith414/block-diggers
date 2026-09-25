import './diag.css';
import { readPad, BUTTON_INDEX } from '../input/devices.js';
import { applyDeadzone, createEdge } from '../input/intents.js';
import {
  installBackGuard, setCursorHidden, setPointerLock, setFullscreen, createEventBlocker,
} from '../input/tvGuard.js';

// Controller diagnostics for the Fire TV Cube's Silk browser.
// Answers: which inputs reach the page, which ones drive Silk's cursor,
// and whether any page-side trick switches the cursor off.

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const setHTML = (node, html) => { if (node.innerHTML !== html) node.innerHTML = html; };

// ---------- layout ----------
const app = document.getElementById('app');
const statsBox = el('div', 'stats');
const arena = el('canvas', 'arena');
arena.width = 640;
arena.height = 240;
const table = el('table', 'verdict');
const resetBtn = el('button', 'reset', 'Reset counts (X)');
const tableHeading = el('h2', null, 'What each input does ');
tableHeading.append(resetBtn);
const togglesBox = el('div', 'toggles');
const padsBox = el('div', 'pads');
const keyLogBox = el('ol', 'keylog');
app.append(
  el('h1', null, 'Block Diggers · Controller Check'),
  statsBox, arena,
  tableHeading, table,
  el('h2', null, 'Cursor fixes: LB/RB pick · Y flips · or click · or keys 1–5'), togglesBox,
  el('h2', null, 'Controllers'), padsBox,
  el('h2', null, 'Last keys'), keyLogBox,
);

// ---------- measurements ----------
const INPUTS = ['leftStick', 'rightStick', 'dpad'];
const LABEL = { leftStick: 'Left stick', rightStick: 'Right stick', dpad: 'D-pad' };
const blankSeen = () => Object.fromEntries(INPUTS.map((k) => [k, { game: 0, pointer: 0, keys: 0 }]));
let seen = blankSeen();
let active = { leftStick: false, rightStick: false, dpad: false };
let lastPointer = null;
let backCount = 0;
const keyLog = [];
const rate = { pointer: 0, keys: 0 };
const windowCount = { pointer: 0, keys: 0 };
let windowStart = performance.now();

// Registered before any blocker so these always see the events.
window.addEventListener('pointermove', (e) => {
  windowCount.pointer++;
  lastPointer = { x: e.clientX, y: e.clientY };
  for (const k of INPUTS) if (active[k]) seen[k].pointer++;
}, { capture: true });

window.addEventListener('keydown', (e) => {
  windowCount.keys++;
  for (const k of INPUTS) if (active[k]) seen[k].keys++;
  keyLog.unshift(`${JSON.stringify(e.key)}  code=${e.code || '-'}  keyCode=${e.keyCode}`);
  keyLog.length = Math.min(keyLog.length, 8);
  const n = Number(e.key);
  if (n >= 1 && n <= TOGGLES.length) flip(n - 1);
  else fireArmed();
}, { capture: true });

window.addEventListener('pointerdown', (e) => {
  if (e.target.closest && e.target.closest('.toggle')) return; // the button's own click handles it
  fireArmed();
}, { capture: true });

installBackGuard(window, () => { backCount++; });
resetBtn.addEventListener('click', () => { seen = blankSeen(); });

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

// apply() runs synchronously inside flip(), so a flip called from a click or
// keydown handler still counts as a user gesture for pointer lock / fullscreen.
async function flip(i) {
  const t = TOGGLES[i];
  const want = !t.on;
  const result = await t.apply(want);
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
    setHTML(b, `${i + 1}. ${t.name}: <b>${t.on ? 'ON' : 'off'}</b><small>${t.result || '&nbsp;'}</small>`);
  });
}
renderToggles();

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

function move(k, v, dt, next) {
  if (v.x === 0 && v.y === 0) return;
  next[k] = true;
  seen[k].game++;
  const d = dots[k];
  d.x = wrap(d.x + v.x * 240 * dt, arena.width);
  d.y = wrap(d.y + v.y * 240 * dt, arena.height);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (now - windowStart >= 1000) {
    rate.pointer = windowCount.pointer;
    rate.keys = windowCount.keys;
    windowCount.pointer = 0;
    windowCount.keys = 0;
    windowStart = now;
  }

  let pads = [];
  try { pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean); } catch { pads = []; }

  const next = { leftStick: false, rightStick: false, dpad: false };
  let lb = false; let rb = false; let y = false; let x = false;
  for (const gp of pads) {
    const s = readPad(gp);
    move('leftStick', applyDeadzone(s.axes.lx, s.axes.ly), dt, next);
    move('rightStick', applyDeadzone(s.axes.rx, s.axes.ry), dt, next);
    move('dpad', {
      x: (s.buttons.right ? 1 : 0) - (s.buttons.left ? 1 : 0),
      y: (s.buttons.down ? 1 : 0) - (s.buttons.up ? 1 : 0),
    }, dt, next);
    lb ||= s.buttons.lb; rb ||= s.buttons.rb; y ||= s.buttons.y; x ||= s.buttons.x;
  }
  active = next;

  if (lbEdge(lb)) { selected = (selected + TOGGLES.length - 1) % TOGGLES.length; renderToggles(); }
  if (rbEdge(rb)) { selected = (selected + 1) % TOGGLES.length; renderToggles(); }
  if (yEdge(y)) flip(selected);
  if (xEdge(x)) seen = blankSeen();

  renderStats(pads.length);
  renderTable();
  renderPads(pads);
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
    chip('Cursor events/s', rate.pointer, rate.pointer === 0),
    chip('Keys/s', rate.keys),
    chip('Pointer lock', document.pointerLockElement ? 'on' : 'off'),
    chip('Fullscreen', document.fullscreenElement ? 'on' : 'off'),
    chip('Back presses', backCount),
  ].join(''));
}

function verdict(s) {
  if (s.game === 0 && s.pointer === 0 && s.keys === 0) return '— not tried';
  if (s.game === 0) return '❌ never reaches game';
  if (s.pointer > 0) return '⚠️ also moves cursor';
  if (s.keys > 0) return '⚠️ also sends keys';
  return '✅ clean';
}

function renderTable() {
  const rows = INPUTS.map((k) => {
    const s = seen[k];
    return `<tr><td>${LABEL[k]}</td><td>${s.game}</td><td>${s.pointer}</td><td>${s.keys}</td><td>${verdict(s)}</td></tr>`;
  }).join('');
  setHTML(table, `<tr><th>Input</th><th>Game frames</th><th>Cursor events</th><th>Key events</th><th>Verdict</th></tr>${rows}`);
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
    return `<pre>#${gp.index} ${gp.id}\nmapping: ${gp.mapping || '(none)'}  buttons: ${gp.buttons.length}  axes: ${gp.axes.length}\naxes: ${axes}\npressed: ${lit}   raw: ${raw}</pre>`;
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
