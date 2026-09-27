// Pure music helpers and song data. Notes are like 'C4', 'F#5', 'Bb3';
// '.' is a rest, '-' holds the previous note, 'x' is a drum hit.

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function noteFreq(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return null;
  const semis = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((semis - 69) / 12);
}

export function parseTrack(notes) {
  const tokens = notes.trim().split(/\s+/);
  const out = [];
  tokens.forEach((tok, step) => {
    if (tok === '-') {
      if (out.length) out[out.length - 1].len++;
      return;
    }
    if (tok === '.') return;
    if (tok === 'x') {
      out.push({ step, freq: 0, len: 1, drum: true });
      return;
    }
    out.push({ step, freq: noteFreq(tok), len: 1 });
  });
  return out;
}

// Rising ladder for ore "dings": each ore in a quick streak goes one step up.
export const PENTATONIC = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6'];

const bars = (...b) => b.join(' ');

// Camp: warm and bouncy, C – Am – F – G, twice with a variation.
const campLead = bars(
  'E5 - G5 . A5 - G5 . E5 - D5 . C5 - - .',
  'C5 - E5 . A5 - G5 . E5 - - . D5 . C5 .',
  'A4 - C5 . F5 - E5 . C5 - A4 . C5 - - .',
  'B4 - D5 . G5 - F5 . D5 - - . B4 - - .',
  'E5 - G5 . C6 - B5 . A5 - G5 . E5 - - .',
  'C5 - E5 . A5 - C6 . B5 - A5 . G5 . E5 .',
  'F5 - A5 . C6 - A5 . G5 - F5 . E5 - D5 .',
  'D5 - E5 . D5 - B4 . C5 - - - - - - .',
);
const campBass = bars(
  'C3 - - . G2 - - . C3 - - . G2 - E2 .',
  'A2 - - . E2 - - . A2 - - . E2 - G2 .',
  'F2 - - . C3 - - . F2 - - . C3 - A2 .',
  'G2 - - . D3 - - . G2 - - . D3 - B2 .',
  'C3 - - . G2 - - . C3 - - . G2 - E2 .',
  'A2 - - . E2 - - . A2 - - . E2 - G2 .',
  'F2 - - . C3 - - . F2 - - . C3 - A2 .',
  'G2 - - . D3 - - . C3 - - - - - - .',
);
const campArp = bars(
  'C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4',
  'A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4',
  'F3 A3 C4 A3 F3 A3 C4 A3 F3 A3 C4 A3 F3 A3 C4 A3',
  'G3 B3 D4 B3 G3 B3 D4 B3 G3 B3 D4 B3 G3 B3 D4 B3',
  'C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4',
  'A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4',
  'F3 A3 C4 A3 F3 A3 C4 A3 F3 A3 C4 A3 F3 A3 C4 A3',
  'G3 B3 D4 B3 G3 B3 D4 B3 C4 E4 G4 E4 C4 - - .',
);

// Mine: slower, softer, a little mysterious. Am – F – C – E.
const mineLead = bars(
  'A4 - - . . . C5 . E5 - - . D5 - C5 .',
  'A4 - - . . . F4 . A4 - - . C5 - - .',
  'G4 - - . . . C5 . E5 - - . G5 - E5 .',
  'E5 - - . D5 - - . B4 - - . G#4 - - .',
  'A4 - - . . . C5 . E5 - - . A5 - G5 .',
  'F5 - - . E5 - - . C5 - - . A4 - - .',
  'G4 - - . C5 - - . E5 - D5 . C5 - - .',
  'B4 - - . G#4 - - . A4 - - - - - - .',
);
const mineBass = bars(
  'A2 - - - - - - - E2 - - - - - - .',
  'F2 - - - - - - - C2 - - - - - - .',
  'C3 - - - - - - - G2 - - - - - - .',
  'E2 - - - - - - - B2 - - - - - - .',
  'A2 - - - - - - - E2 - - - - - - .',
  'F2 - - - - - - - C2 - - - - - - .',
  'C3 - - - - - - - G2 - - - - - - .',
  'E2 - - - - - - - A2 - - - - - - .',
);
const mineBell = bars(
  '. . . . A5 . . . . . . . E6 . . .',
  '. . . . F5 . . . . . . . C6 . . .',
  '. . . . G5 . . . . . . . E6 . . .',
  '. . . . G#5 . . . . . . . B5 . . .',
  '. . . . A5 . . . . . . . E6 . . .',
  '. . . . F5 . . . . . . . C6 . . .',
  '. . . . G5 . . . . . . . E6 . . .',
  '. . . . E5 . . . . . . . A5 . . .',
);

export const SONGS = {
  // Slow, soft and round: sine/triangle only, gentle attacks, long tails.
  camp: {
    bpm: 72,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.06, notes: campLead, decay: 1.1, attack: 0.03 },
      { wave: 'sine', gain: 0.13, notes: campBass, decay: 1.1, attack: 0.02 },
      { wave: 'sine', gain: 0.03, notes: campArp, decay: 1.4, attack: 0.02 },
    ],
  },
  mine: {
    bpm: 64,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.055, notes: mineLead, decay: 1.1, attack: 0.04 },
      { wave: 'sine', gain: 0.12, notes: mineBass, decay: 1.1, attack: 0.05 },
      { wave: 'sine', gain: 0.04, notes: mineBell, decay: 3, attack: 0.01 },
    ],
  },
};
