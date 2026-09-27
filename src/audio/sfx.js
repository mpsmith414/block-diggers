// Chiptune sound effects, synthesised on the fly. Soft and friendly: no
// harsh buzzers, short envelopes, a little pitch variety so repeats don't grate.

import { noteFreq, PENTATONIC } from './synth.js';

export function createSfx(audio) {
  // everything here is mixed under the music bus volume; keep it gentle
  const now = () => audio.ctx.currentTime;
  const ok = () => audio.ready;

  function tone({ type = 'square', freq, to = null, dur = 0.12, gain = 0.2, attack = 0.005, at = 0 }) {
    const ctx = audio.ctx;
    const t = now() + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audio.sfx);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise({ dur = 0.1, gain = 0.2, freq = 2000, to = null, q = 1, type = 'bandpass', at = 0 }) {
    const ctx = audio.ctx;
    const buf = audio.noise();
    if (!buf) return;
    const t = now() + at;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(audio.sfx);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  const vary = (f, amt = 0.06) => f * (1 + (Math.random() - 0.5) * amt);
  let streak = 0;
  let lastOre = 0;
  let lastDig = 0;

  const voices = {
    // digging: a soft crunch, deeper and chunkier for harder rock
    dig(hardness = 'soft') {
      const t = performance.now();
      if (t - lastDig < 40) return;
      lastDig = t;
      const base = { soft: 900, stone: 1600, deep: 1200 }[hardness] ?? 900;
      noise({ dur: 0.09, gain: 0.22, freq: vary(base, 0.3), to: base * 0.5, q: 1.5 });
      tone({ type: 'triangle', freq: vary(hardness === 'soft' ? 160 : 240), to: 90, dur: 0.07, gain: 0.12 });
    },
    // ore: a bright ding that climbs the scale during a streak
    ore() {
      const t = performance.now();
      streak = t - lastOre < 1600 ? Math.min(streak + 1, PENTATONIC.length - 1) : 0;
      lastOre = t;
      const f = noteFreq(PENTATONIC[streak]);
      tone({ type: 'square', freq: f, dur: 0.12, gain: 0.09 });
      tone({ type: 'triangle', freq: f * 2, dur: 0.25, gain: 0.07, at: 0.05 });
    },
    bounce() { tone({ type: 'square', freq: 180, to: 140, dur: 0.1, gain: 0.07 }); },
    bonk() {
      tone({ type: 'square', freq: 520, to: 140, dur: 0.28, gain: 0.12 });
      tone({ type: 'triangle', freq: 260, to: 80, dur: 0.3, gain: 0.15 });
    },
    squash() {
      noise({ dur: 0.12, gain: 0.25, freq: 500, to: 200, q: 3, type: 'lowpass' });
      tone({ type: 'sine', freq: 300, to: 700, dur: 0.12, gain: 0.15 });
    },
    jump() { tone({ type: 'square', freq: 330, to: 620, dur: 0.1, gain: 0.05 }); },
    chest() {
      ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => tone({ type: 'square', freq: noteFreq(n), dur: 0.16, gain: 0.07, at: i * 0.06 }));
      noise({ dur: 0.5, gain: 0.05, freq: 6000, q: 0.7, type: 'highpass', at: 0.1 });
    },
    bubble() { tone({ type: 'sine', freq: 300, to: 900, dur: 0.35, gain: 0.12 }); },
    pop() {
      tone({ type: 'sine', freq: 900, to: 1500, dur: 0.06, gain: 0.14 });
      noise({ dur: 0.05, gain: 0.08, freq: 3000, q: 2 });
    },
    whoosh() { noise({ dur: 1.2, gain: 0.18, freq: 300, to: 3000, q: 1.2 }); },
    full() { tone({ type: 'triangle', freq: 440, to: 330, dur: 0.18, gain: 0.08 }); },
    build() {
      ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone({ type: 'square', freq: noteFreq(n), dur: 0.2, gain: 0.08, at: i * 0.1 }));
      tone({ type: 'triangle', freq: noteFreq('C4'), dur: 0.6, gain: 0.12, at: 0.3 });
      tone({ type: 'square', freq: noteFreq('G5'), dur: 0.5, gain: 0.06, at: 0.4 });
      tone({ type: 'square', freq: noteFreq('C6'), dur: 0.7, gain: 0.07, at: 0.4 });
    },
    hammer() { noise({ dur: 0.06, gain: 0.2, freq: 2500, q: 4 }); tone({ type: 'square', freq: vary(700, 0.2), dur: 0.05, gain: 0.04 }); },
    upgrade() {
      ['G4', 'C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone({ type: 'square', freq: noteFreq(n), dur: 0.14, gain: 0.08, at: i * 0.07 }));
    },
    deposit(i = 0) { tone({ type: 'triangle', freq: noteFreq(PENTATONIC[i % PENTATONIC.length]) * 0.5, dur: 0.08, gain: 0.1 }); },
    tick() { tone({ type: 'square', freq: 880, dur: 0.03, gain: 0.04 }); },
    open() { tone({ type: 'square', freq: 520, to: 780, dur: 0.08, gain: 0.05 }); },
    close() { tone({ type: 'square', freq: 700, to: 460, dur: 0.08, gain: 0.05 }); },
    nope() { tone({ type: 'triangle', freq: 200, dur: 0.08, gain: 0.12 }); tone({ type: 'triangle', freq: 170, dur: 0.1, gain: 0.12, at: 0.09 }); },
    sticker() {
      ['E6', 'G6', 'C7'].forEach((n, i) => tone({ type: 'triangle', freq: noteFreq(n), dur: 0.22, gain: 0.08, at: i * 0.07 }));
    },
    fuse() { noise({ dur: 0.4, gain: 0.08, freq: 4000, q: 2 }); },
    boom() {
      noise({ dur: 0.7, gain: 0.35, freq: 800, to: 90, q: 0.7, type: 'lowpass' });
      tone({ type: 'sine', freq: 120, to: 50, dur: 0.5, gain: 0.25 });
      ['C5', 'E5', 'G5'].forEach((n, i) => tone({ type: 'triangle', freq: noteFreq(n), dur: 0.2, gain: 0.05, at: 0.15 + i * 0.05 }));
    },
    rumble() { noise({ dur: 0.45, gain: 0.25, freq: 300, to: 120, q: 0.8, type: 'lowpass' }); },
    crack() {
      noise({ dur: 0.08, gain: 0.25, freq: 3000, q: 3 });
      ['G5', 'B5', 'D6', 'G6'].forEach((n, i) => tone({ type: 'triangle', freq: noteFreq(n), dur: 0.25, gain: 0.06, at: 0.05 + i * 0.05 }));
    },
    splash() { noise({ dur: 0.35, gain: 0.18, freq: 1200, to: 400, q: 1, type: 'bandpass' }); },
    egg() { ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone({ type: 'sine', freq: noteFreq(n), dur: 0.2, gain: 0.08, at: i * 0.06 })); },
    sniff() { tone({ type: 'sine', freq: 900, to: 1400, dur: 0.12, gain: 0.05 }); tone({ type: 'sine', freq: 1000, to: 1500, dur: 0.12, gain: 0.05, at: 0.14 }); },
    hatch() {
      noise({ dur: 0.1, gain: 0.2, freq: 2500, q: 3 });
      ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => tone({ type: 'triangle', freq: noteFreq(n), dur: 0.2, gain: 0.08, at: 0.12 + i * 0.07 }));
    },
    wobble() { tone({ type: 'sine', freq: 300, to: 360, dur: 0.1, gain: 0.06 }); },
    // ---- silly noises (all gentle) ----
    quack() {
      tone({ type: 'sawtooth', freq: 620, to: 480, dur: 0.12, gain: 0.06 });
      tone({ type: 'square', freq: 900, to: 700, dur: 0.1, gain: 0.03, at: 0.02 });
      tone({ type: 'sawtooth', freq: 600, to: 440, dur: 0.14, gain: 0.06, at: 0.18 });
    },
    peeyew() {
      tone({ type: 'sine', freq: 1200, to: 300, dur: 0.7, gain: 0.08 });
      tone({ type: 'triangle', freq: 1210, to: 310, dur: 0.7, gain: 0.04 });
    },
    pffbt() {
      noise({ dur: 0.5, gain: 0.14, freq: 180, to: 90, q: 6, type: 'bandpass' });
      tone({ type: 'sawtooth', freq: 95, to: 70, dur: 0.5, gain: 0.07 });
      tone({ type: 'square', freq: 140, to: 60, dur: 0.15, gain: 0.03, at: 0.4 });
    },
    achoo() {
      tone({ type: 'sine', freq: 500, to: 800, dur: 0.35, gain: 0.05 });
      noise({ dur: 0.4, gain: 0.14, freq: 3000, to: 900, q: 0.9, type: 'bandpass', at: 0.4 });
      tone({ type: 'triangle', freq: 700, to: 250, dur: 0.25, gain: 0.07, at: 0.4 });
    },
    dizzy() {
      [0, 0.18, 0.36].forEach((at) => tone({ type: 'sine', freq: 1500, to: 1900, dur: 0.1, gain: 0.05, at }));
    },
    giggle() {
      [0, 0.1, 0.2, 0.3].forEach((at, i) => tone({ type: 'triangle', freq: 900 + i * 60, to: 1100 + i * 60, dur: 0.07, gain: 0.05, at }));
    },
    caw() { tone({ type: 'sawtooth', freq: 700, to: 420, dur: 0.22, gain: 0.04 }); },
    squeak() { tone({ type: 'sine', freq: 2200, to: 2600, dur: 0.06, gain: 0.03 }); },
    whirr() { tone({ type: 'square', freq: 220, to: 260, dur: 0.3, gain: 0.025 }); },
    blorp() { tone({ type: 'sine', freq: 180, to: 420, dur: 0.14, gain: 0.06 }); },
    crackle() { noise({ dur: 0.18, gain: 0.05, freq: 5000, q: 1.5, type: 'highpass' }); },
    trick() { ['C6', 'E6', 'G6', 'E6', 'C7'].forEach((n, i) => tone({ type: 'triangle', freq: noteFreq(n), dur: 0.12, gain: 0.06, at: i * 0.07 })); },
    rawr() {
      tone({ type: 'sawtooth', freq: 320, to: 180, dur: 0.35, gain: 0.07 });
      tone({ type: 'square', freq: 480, to: 260, dur: 0.3, gain: 0.04 });
      noise({ dur: 0.3, gain: 0.08, freq: 900, to: 400, q: 2, type: 'bandpass' });
    },
    boing() {
      tone({ type: 'sine', freq: 180, to: 520, dur: 0.25, gain: 0.14 });
      tone({ type: 'triangle', freq: 360, to: 900, dur: 0.2, gain: 0.05, at: 0.03 });
    },
    // a new layer: a little trumpet fanfare
    fanfare() {
      [['G4', 0, 0.12], ['C5', 0.12, 0.12], ['E5', 0.24, 0.12], ['G5', 0.36, 0.3], ['E5', 0.66, 0.1], ['G5', 0.76, 0.5]]
        .forEach(([n, at, dur]) => {
          tone({ type: 'square', freq: noteFreq(n), dur, gain: 0.06, at });
          tone({ type: 'triangle', freq: noteFreq(n) / 2, dur, gain: 0.08, at });
        });
    },
    // the Heart of the World: a big shimmering chord
    heart() {
      ['C4', 'G4', 'C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone({ type: 'triangle', freq: noteFreq(n), dur: 1.2, gain: 0.06, at: i * 0.08 }));
      noise({ dur: 1.5, gain: 0.06, freq: 7000, q: 0.7, type: 'highpass', at: 0.3 });
    },
    roar() {
      noise({ dur: 0.6, gain: 0.3, freq: 300, to: 120, q: 1.5, type: 'lowpass' });
      tone({ type: 'sawtooth', freq: 140, to: 70, dur: 0.6, gain: 0.08 });
      tone({ type: 'square', freq: 220, to: 110, dur: 0.5, gain: 0.05 });
    },
    hiss() { noise({ dur: 0.7, gain: 0.15, freq: 5000, to: 1500, q: 0.8, type: 'highpass' }); },
    glug() {
      [0, 0.22, 0.44, 0.66, 0.88].forEach((at, i) => tone({ type: 'sine', freq: 260 - i * 15, to: 140, dur: 0.12, gain: 0.14, at }));
    },
    burp() {
      noise({ dur: 0.45, gain: 0.3, freq: 350, to: 150, q: 4, type: 'bandpass' });
      tone({ type: 'sawtooth', freq: 120, to: 70, dur: 0.45, gain: 0.1 });
      tone({ type: 'sine', freq: 900, to: 1400, dur: 0.08, gain: 0.08, at: 0.5 });
    },
    join() { ['E5', 'A5'].forEach((n, i) => tone({ type: 'square', freq: noteFreq(n), dur: 0.12, gain: 0.07, at: i * 0.08 })); },
    lava() { noise({ dur: 0.3, gain: 0.15, freq: 400, to: 1500, q: 1, type: 'lowpass' }); },
    gravel() { noise({ dur: 0.2, gain: 0.25, freq: 600, to: 150, q: 0.8, type: 'lowpass' }); },
  };

  return {
    play(name, arg) {
      if (!ok() || !voices[name]) return;
      try {
        voices[name](arg);
      } catch {
        /* never let a sound break the game */
      }
    },
  };
}
