// Renders the game's own sound effects at trailer times: node sfxrender.mjs events.json out.wav
import { chromium } from 'playwright';
import fs from 'node:fs';
const [evFile, outFile] = process.argv.slice(2);
const events = JSON.parse(fs.readFileSync(evFile, 'utf8'));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
await page.goto('http://localhost:5173/block-diggers/diag.html');
const b64 = await page.evaluate(async ({ events, dur }) => {
  const { createSfx } = await import('/block-diggers/src/audio/sfx.js');
  const sr = 48000;
  const ctx = new OfflineAudioContext(2, Math.ceil(sr * dur), sr);
  const out = ctx.createGain(); out.gain.value = 1; out.connect(ctx.destination);
  let base = 0;
  const px = new Proxy(ctx, { get(t, p) { if (p === 'currentTime') return base; const v = t[p]; return typeof v === 'function' ? v.bind(t) : v; } });
  const nb = ctx.createBuffer(1, sr, sr); const nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const buses = {};
  const bus = (g) => { if (!buses[g]) { const n = ctx.createGain(); n.gain.value = g; n.connect(out); buses[g] = n; } return buses[g]; };
  let cur = bus(1);
  const audio = { get ctx() { return px; }, get sfx() { return cur; }, ready: true, noise: () => nb };
  const sfx = createSfx(audio);
  performance.now = () => base * 1000;
  for (const e of events) { base = e.t; cur = bus(e.gain ?? 1); sfx.play(e.name, e.arg); }
  const buf = await ctx.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  const i16 = new Int16Array(L.length * 2);
  for (let i = 0; i < L.length; i++) { i16[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; i16[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  const bytes = new Uint8Array(i16.buffer); let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}, { events, dur: 85 });
const pcm = Buffer.from(b64, 'base64');
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(48000, 24); h.writeUInt32LE(48000 * 4, 28);
h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
fs.writeFileSync(outFile, Buffer.concat([h, pcm]));
console.log('sfx', events.length, 'events');
await browser.close();
