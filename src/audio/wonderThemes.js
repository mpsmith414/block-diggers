// A song for every Wonder planet. Same format as themes.js: 8 bars of 16
// steps; '.' rest, '-' hold, 'x' a soft drum.

const bars = (...b) => b.join(' ');
const each = (bar, n = 8) => bars(...Array(n).fill(bar));

// Spooky: a sneaky, silly creep in A minor (Am – F – E – Am), plucky and light, never scary.
const spookyLead = bars(
  'A4 . C5 . E5 . D#5 . E5 - - . C5 . A4 .',
  'F4 . A4 . C5 . B4 . C5 - - . A4 . F4 .',
  'E4 . G#4 . B4 . A#4 . B4 - - . G#4 . E4 .',
  'A4 . . . E5 . . . A5 - - - - - - .',
  'C6 . B5 . A5 . G#5 . A5 - - . E5 - - .',
  'F5 . E5 . D5 . C5 . D5 - - . A4 - - .',
  'B4 . C5 . D5 . E5 . G#5 - - . B5 - - .',
  'A5 - - . E5 - - . A4 - - - - - - .',
);
const spookyBass = bars(
  'A2 . . . E2 . . . A2 . . . E2 . . .', 'F2 . . . C3 . . . F2 . . . C3 . . .',
  'E2 . . . B2 . . . E2 . . . G#2 . . .', 'A2 . . . E2 . . . A2 . G2 . F2 . E2 .',
  'A2 . . . E2 . . . A2 . . . E2 . . .', 'F2 . . . C3 . . . F2 . . . C3 . . .',
  'E2 . . . B2 . . . E2 . . . G#2 . . .', 'A2 . . . E2 . . . A2 - - - - - - .',
);
const spookyBells = each('. . x . . . . . . . x . . x . .');

// Robot: bleepy and bouncy in C, square-wave arpeggios over a marching bass.
const robotLead = bars(
  'C5 . C5 . G5 . E5 . C6 - - . G5 . . .',
  'A4 . A4 . E5 . C5 . A5 - - . E5 . . .',
  'F4 . F4 . C5 . A4 . F5 - - . C5 . . .',
  'G4 . B4 . D5 . G5 . B5 . D6 . G5 . . .',
  'C5 . E5 . G5 . C6 . E6 - C6 . G5 . E5 .',
  'A4 . C5 . E5 . A5 . C6 - A5 . E5 . C5 .',
  'F4 . A4 . C5 . F5 . A5 - F5 . D5 . B4 .',
  'G4 . D5 . G5 . B5 . C6 - - . . . . .',
);
const robotBass = bars(
  'C3 . C3 . C3 . C3 . C3 . C3 . G2 . G2 .', 'A2 . A2 . A2 . A2 . A2 . A2 . E2 . E2 .',
  'F2 . F2 . F2 . F2 . F2 . F2 . C3 . C3 .', 'G2 . G2 . G2 . G2 . G2 . G2 . B2 . D3 .',
  'C3 . C3 . C3 . C3 . C3 . C3 . G2 . G2 .', 'A2 . A2 . A2 . A2 . A2 . A2 . E2 . E2 .',
  'F2 . F2 . F2 . F2 . G2 . G2 . G2 . G2 .', 'C3 . G2 . C3 . G2 . C3 - - - - - - .',
);
const robotDrums = each('x . . . x . x . x . . . x . x x');

// Ocean: slow, rolling waves in F (F – Dm – Bb – C), a gentle sine with a rippling arpeggio.
const oceanLead = bars(
  'C5 - - - A4 - - - F5 - - - E5 - - -',
  'D5 - - - F5 - - - A5 - - - - - - .',
  'Bb4 - - - D5 - - - F5 - - - D5 - - -',
  'C5 - - - E5 - - - G5 - - - - - - .',
  'A5 - - - G5 - - - F5 - - - C5 - - -',
  'D5 - - - E5 - - - F5 - - - A5 - - -',
  'Bb5 - - - A5 - - - G5 - - - F5 - - -',
  'E5 - - - G5 - - - F5 - - - - - - .',
);
const oceanBass = bars(
  'F2 - - - - - - - C3 - - - - - - .', 'D2 - - - - - - - A2 - - - - - - .',
  'Bb2 - - - - - - - F2 - - - - - - .', 'C3 - - - - - - - G2 - - - - - - .',
  'F2 - - - - - - - C3 - - - - - - .', 'D2 - - - - - - - A2 - - - - - - .',
  'Bb2 - - - - - - - F2 - - - - - - .', 'C3 - - - - - - - F2 - - - - - - .',
);
const oceanRipple = bars(
  'F5 . A5 . C6 . A5 . F5 . A5 . C6 . A5 .', 'D5 . F5 . A5 . F5 . D5 . F5 . A5 . F5 .',
  'Bb4 . D5 . F5 . D5 . Bb4 . D5 . F5 . D5 .', 'C5 . E5 . G5 . E5 . C5 . E5 . G5 . E5 .',
  'F5 . A5 . C6 . A5 . F5 . A5 . C6 . A5 .', 'D5 . F5 . A5 . F5 . D5 . F5 . A5 . F5 .',
  'Bb4 . D5 . F5 . D5 . Bb4 . D5 . F5 . D5 .', 'C5 . E5 . G5 . E5 . F5 . A5 . C6 . A5 .',
);

// Upside-Down: a happy tune in G whose lines keep tumbling down when you'd expect up.
const upsideLead = bars(
  'D6 . B5 . G5 . D5 . G5 - - . B5 . D6 .',
  'E6 . C6 . A5 . E5 . A5 - - . C6 . E6 .',
  'D6 . C6 . B5 . A5 . G5 . F#5 . E5 . D5 .',
  'G5 - - . D5 - - . G4 - - - - - - .',
  'B5 . D6 . B5 . G5 . D5 . G5 . B5 . D6 .',
  'C6 . E6 . C6 . A5 . E5 . A5 . C6 . E6 .',
  'D6 . . . F#5 . . . A5 . C6 . D6 . F#6 .',
  'G6 - - . D6 - - . G5 - - - - - - .',
);
const upsideBass = bars(
  'G2 . . . D3 . . . G2 . . . D3 . . .', 'C3 . . . G2 . . . C3 . . . G2 . . .',
  'D3 . . . A2 . . . D3 . . . F#2 . . .', 'G2 . . . D2 . . . G2 - - - - - - .',
  'G2 . . . D3 . . . G2 . . . D3 . . .', 'C3 . . . G2 . . . C3 . . . G2 . . .',
  'D3 . . . A2 . . . D3 . . . F#2 . . .', 'G2 . . . D3 . . . G2 - - - - - - .',
);
const upsideTick = each('x . . . . . x . . . x . . . . .');

// Jelly: boing-y and bouncy in D, short wobbly notes that hop up and down.
const jellyLead = bars(
  'D5 . F#5 . A5 . F#5 . D5 . . . A4 . . .',
  'G5 . B5 . D6 . B5 . G5 . . . D5 . . .',
  'A5 . G5 . F#5 . E5 . D5 . E5 . F#5 . A5 .',
  'E5 . . . A4 . . . E5 - - . . . . .',
  'D5 . F#5 . A5 . D6 . A5 . F#5 . D5 . . .',
  'G5 . B5 . D6 . G6 . D6 . B5 . G5 . . .',
  'F#5 . A5 . G5 . B5 . A5 . C#6 . D6 . . .',
  'A5 . . . E5 . . . D5 - - - - - - .',
);
const jellyBass = bars(
  'D3 . . D3 A2 . . . D3 . . D3 A2 . . .', 'G2 . . G2 D3 . . . G2 . . G2 D3 . . .',
  'D3 . . D3 A2 . . . D3 . . D3 F#2 . . .', 'A2 . . A2 E2 . . . A2 . . . C#3 . . .',
  'D3 . . D3 A2 . . . D3 . . D3 A2 . . .', 'G2 . . G2 D3 . . . G2 . . G2 D3 . . .',
  'D3 . . . G2 . . . A2 . . . A2 . . .', 'D3 . . . A2 . . . D3 - - - - - - .',
);
const jellyDrums = each('x . . x . . x . x . . x . . x .');

// Race: fast and driving in E, a revving arcade tune.
const raceLead = bars(
  'E5 . E5 . B5 . E5 . G#5 . F#5 . E5 . B4 .',
  'A4 . C#5 . E5 . A5 . G#5 . F#5 . E5 . C#5 .',
  'B4 . D#5 . F#5 . B5 . A5 . G#5 . F#5 . D#5 .',
  'E5 . G#5 . B5 . E6 . B5 - - . - - . .',
  'E6 . D#6 . C#6 . B5 . A5 . G#5 . F#5 . E5 .',
  'A5 . G#5 . F#5 . E5 . C#5 . E5 . A5 . C#6 .',
  'B5 . A5 . G#5 . F#5 . D#5 . F#5 . B5 . D#6 .',
  'E6 - - . B5 - - . E5 - - - - - - .',
);
const raceBass = bars(
  'E2 . E3 . E2 . E3 . E2 . E3 . E2 . E3 .', 'A2 . A3 . A2 . A3 . A2 . A3 . A2 . A3 .',
  'B2 . B3 . B2 . B3 . B2 . B3 . B2 . B3 .', 'E2 . E3 . E2 . E3 . E2 . E3 . B2 . B2 .',
  'E2 . E3 . E2 . E3 . E2 . E3 . E2 . E3 .', 'A2 . A3 . A2 . A3 . A2 . A3 . A2 . A3 .',
  'B2 . B3 . B2 . B3 . B2 . B3 . B2 . B3 .', 'E2 . E3 . B2 . B3 . E2 - - - - - - .',
);
const raceDrums = each('x . x . x . x . x . x . x x x x');

// Dragon: a soaring adventure in D (D – Bm – G – A), big leaps.
const dragonLead = bars(
  'D5 - - . A5 - - . D6 - - - C#6 - B5 -',
  'B5 - - . F#5 - - . D5 - - - F#5 - - .',
  'G5 - - . B5 - - . D6 - - - E6 - D6 -',
  'C#6 - - . A5 - - . E5 - - - - - - .',
  'F#6 - - . E6 - - . D6 - - - A5 - - .',
  'G5 - - . F#5 - - . E5 - - - D5 - - .',
  'B4 - - . D5 - - . G5 - - - B5 - - .',
  'A5 - - . C#6 - - . D6 - - - - - - .',
);
const dragonBass = bars(
  'D2 . . . D3 . . . D2 . . . A2 . . .', 'B1 . . . B2 . . . B1 . . . F#2 . . .',
  'G2 . . . G3 . . . G2 . . . D3 . . .', 'A2 . . . A3 . . . A2 . . . E2 . . .',
  'D2 . . . D3 . . . D2 . . . A2 . . .', 'B1 . . . B2 . . . B1 . . . F#2 . . .',
  'G2 . . . G3 . . . A2 . . . A3 . . .', 'D2 . . . A2 . . . D2 - - - - - - .',
);
const dragonDrums = each('x . . . . . . . x . . . x . . .');

// Tiny: a tiptoe pizzicato in G, short plucky notes for bug-sized feet.
const tinyLead = bars(
  'G5 . B5 . D6 . . . B5 . G5 . D5 . . .',
  'E5 . G5 . C6 . . . G5 . E5 . C5 . . .',
  'A5 . C6 . E6 . . . C6 . A5 . F#5 . . .',
  'G5 . D5 . B4 . D5 . G5 . . . . . . .',
  'B5 . A5 . G5 . A5 . B5 . D6 . B5 . . .',
  'C6 . B5 . A5 . B5 . C6 . E6 . C6 . . .',
  'D6 . C6 . B5 . A5 . F#5 . A5 . D6 . . .',
  'G5 . . . D5 . . . G5 . . . . . . .',
);
const tinyBass = bars(
  'G2 . . . D3 . . . G2 . . . D3 . . .', 'C3 . . . G2 . . . C3 . . . G2 . . .',
  'D3 . . . A2 . . . D3 . . . F#2 . . .', 'G2 . . . D3 . . . G2 . . . . . . .',
  'G2 . . . D3 . . . G2 . . . D3 . . .', 'C3 . . . G2 . . . C3 . . . G2 . . .',
  'D3 . . . A2 . . . D3 . . . F#2 . . .', 'G2 . . . D3 . . . G2 . . . . . . .',
);
const tinyTick = each('. . x . . . x . . . x . . . x .');

export const WONDER_THEMES = {
  spooky: {
    bpm: 92,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.06, notes: spookyLead, decay: 0.5, attack: 0.01 },
      { wave: 'sine', gain: 0.12, notes: spookyBass, decay: 0.5, attack: 0.01 },
      { wave: 'noise', gain: 0.02, notes: spookyBells, decay: 1, attack: 0.005 },
    ],
  },
  robot: {
    bpm: 116,
    steps: 128,
    tracks: [
      { wave: 'square', gain: 0.02, notes: robotLead, decay: 0.5, attack: 0.01 },
      { wave: 'triangle', gain: 0.1, notes: robotBass, decay: 0.5, attack: 0.01 },
      { wave: 'noise', gain: 0.02, notes: robotDrums, decay: 1, attack: 0.005 },
    ],
  },
  ocean: {
    bpm: 60,
    steps: 128,
    tracks: [
      { wave: 'sine', gain: 0.06, notes: oceanLead, decay: 1.2, attack: 0.08 },
      { wave: 'sine', gain: 0.11, notes: oceanBass, decay: 1.1, attack: 0.1 },
      { wave: 'triangle', gain: 0.025, notes: oceanRipple, decay: 1.5, attack: 0.02 },
    ],
  },
  upside: {
    bpm: 100,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.06, notes: upsideLead, decay: 0.7, attack: 0.01 },
      { wave: 'sine', gain: 0.12, notes: upsideBass, decay: 0.7, attack: 0.02 },
      { wave: 'noise', gain: 0.018, notes: upsideTick, decay: 1, attack: 0.005 },
    ],
  },
  jelly: {
    bpm: 108,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.065, notes: jellyLead, decay: 0.35, attack: 0.01 },
      { wave: 'sine', gain: 0.12, notes: jellyBass, decay: 0.4, attack: 0.01 },
      { wave: 'noise', gain: 0.018, notes: jellyDrums, decay: 1, attack: 0.005 },
    ],
  },
  race: {
    bpm: 132,
    steps: 128,
    tracks: [
      { wave: 'square', gain: 0.02, notes: raceLead, decay: 0.5, attack: 0.01 },
      { wave: 'triangle', gain: 0.1, notes: raceBass, decay: 0.4, attack: 0.01 },
      { wave: 'noise', gain: 0.02, notes: raceDrums, decay: 1, attack: 0.005 },
    ],
  },
  dragon: {
    bpm: 92,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.065, notes: dragonLead, decay: 1, attack: 0.02 },
      { wave: 'sine', gain: 0.13, notes: dragonBass, decay: 0.8, attack: 0.02 },
      { wave: 'noise', gain: 0.02, notes: dragonDrums, decay: 1, attack: 0.005 },
    ],
  },
  tiny: {
    bpm: 104,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.065, notes: tinyLead, decay: 0.25, attack: 0.005 },
      { wave: 'sine', gain: 0.11, notes: tinyBass, decay: 0.3, attack: 0.01 },
      { wave: 'noise', gain: 0.016, notes: tinyTick, decay: 1, attack: 0.005 },
    ],
  },
};
