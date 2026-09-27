// Dev only: render a song through the real music chain to a WAV data URL,
// so it can be listened to outside the game.

import { SONGS, parseTrack } from '../audio/synth.js';
import { buildMusicChain } from '../audio/audio.js';
import { playNote } from '../audio/music.js';

export async function renderSong(name, seconds = 30, gain = 0.9) {
  const rate = 44100;
  const ctx = new OfflineAudioContext(2, rate * seconds, rate);
  const master = ctx.createGain();
  master.gain.value = gain;
  master.connect(ctx.destination);
  const music = buildMusicChain(ctx, master);
  const noise = ctx.createBuffer(1, rate, rate);
  noise.getChannelData(0).forEach((_, i, d) => { d[i] = Math.random() * 2 - 1; });
  const song = SONGS[name];
  const stepDur = 60 / song.bpm / 4;
  const tracks = song.tracks.map((t) => parseTrack(t.notes));
  for (let loop = 0; loop * song.steps * stepDur < seconds; loop++) {
    tracks.forEach((notes, i) => {
      for (const n of notes) {
        const t = (loop * song.steps + n.step) * stepDur + 0.05;
        if (t < seconds - 0.1) playNote(ctx, music, noise, song.tracks[i], n, t, stepDur);
      }
    });
  }
  const buf = await ctx.startRendering();
  return toWavDataUrl(buf);
}

function toWavDataUrl(buf) {
  const ch = buf.numberOfChannels;
  const len = buf.length;
  const data = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const str = (o, s) => [...s].forEach((c, i) => data.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); data.setUint32(4, 36 + len * ch * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
  data.setUint32(24, buf.sampleRate, true); data.setUint32(28, buf.sampleRate * ch * 2, true);
  data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true);
  str(36, 'data'); data.setUint32(40, len * ch * 2, true);
  const chans = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let o = 44;
  let peak = 0;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, chans[c][i]));
      peak = Math.max(peak, Math.abs(v));
      data.setInt16(o, v * 0x7fff, true);
      o += 2;
    }
  }
  let bin = '';
  const bytes = new Uint8Array(data.buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { url: `data:audio/wav;base64,${btoa(bin)}`, peak };
}
