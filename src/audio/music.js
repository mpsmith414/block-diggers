// A tiny look-ahead sequencer for the chiptune loops in synth.js.

import { SONGS, parseTrack } from './synth.js';
import { MUSIC_LEVEL } from './audio.js';

const LOOKAHEAD = 0.12; // seconds scheduled ahead
const TICK_MS = 30;

export function createMusic(audio) {
  let song = null;
  let parsed = null;
  let step = 0;
  let nextTime = 0;
  let timer = null;
  let current = null;

  const stepDur = () => 60 / song.bpm / 4;

  const voice = (track, n, t) => playNote(audio.ctx, audio.music, audio.noise(), track, n, t, stepDur());

  function schedule() {
    if (!song || !audio.ready) return;
    const ctx = audio.ctx;
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      for (let i = 0; i < parsed.length; i++) {
        for (const n of parsed[i].byStep[step] ?? []) voice(song.tracks[i], n, nextTime);
      }
      step = (step + 1) % song.steps;
      nextTime += stepDur();
    }
  }

  return {
    play(name) {
      if (current === name) return;
      current = name;
      song = SONGS[name];
      parsed = song.tracks.map((t) => {
        const byStep = [];
        for (const n of parseTrack(t.notes)) (byStep[n.step] ||= []).push(n);
        return { byStep };
      });
      step = 0;
      nextTime = 0;
      if (audio.ready) {
        const g = audio.music.gain;
        const t = audio.ctx.currentTime;
        g.cancelScheduledValues(t);
        g.setValueAtTime(0.0001, t);
        g.exponentialRampToValueAtTime(MUSIC_LEVEL, t + 2.5);
      }
      if (!timer) timer = setInterval(schedule, TICK_MS);
    },
    stop() {
      current = null;
      song = null;
    },
    get current() { return current; },
  };
}

// One note of one track, into `dest`, at time `t`.
export function playNote(ctx, dest, noiseBuf, track, n, t, stepDur) {
  const dur = n.len * stepDur * (track.decay ?? 1);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(track.gain, t + (track.attack ?? 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.05, dur));
  g.connect(dest);
  if (track.wave === 'noise' || n.drum) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    src.connect(f).connect(g);
    src.start(t, Math.random() * 0.5);
    src.stop(t + 0.06);
    return;
  }
  const o = ctx.createOscillator();
  o.type = track.wave;
  o.frequency.setValueAtTime(n.freq, t);
  o.connect(g);
  o.start(t);
  o.stop(t + Math.max(0.06, dur) + 0.05);
}
