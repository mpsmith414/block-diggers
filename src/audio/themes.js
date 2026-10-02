// A theme for every planet (its camp and its mines), and an arcade tune for
// the bonus rooms. Same format as the songs in synth.js: 8 bars of 16 steps;
// '.' rest, '-' hold, 'x' a soft drum/jingle.

const bars = (...b) => b.join(' ');
const each = (bar, n = 8) => bars(...Array(n).fill(bar));

// The Moon: floaty and twinkly. Dm – Bb – F – C, slow and soft.
const moonLead = bars(
  'D5 - - - F5 - - - A5 - - - G5 - F5 -',
  'F5 - - - D5 - - - . . . . . . . .',
  'C5 - - - F5 - - - A5 - - - C6 - - -',
  'G5 - - - E5 - - - . . . . . . . .',
  'A5 - - - G5 - - - F5 - - - E5 - D5 -',
  'D5 - - - F5 - - - Bb5 - - - A5 - - -',
  'A5 - - - G5 - - - F5 - - - C5 - - -',
  'E5 - - - - - - - D5 - - - - - - .',
);
const moonBass = bars(
  'D3 - - - - - - - - - - - - - - .', 'Bb2 - - - - - - - - - - - - - - .',
  'F2 - - - - - - - - - - - - - - .', 'C3 - - - - - - - - - - - - - - .',
  'D3 - - - - - - - - - - - - - - .', 'Bb2 - - - - - - - - - - - - - - .',
  'F2 - - - - - - - - - - - - - - .', 'C3 - - - - - - - D3 - - - - - - .',
);
const moonTwinkle = bars(
  'D6 . A5 . F6 . A5 . D6 . A5 . F6 . A5 .', 'Bb5 . F5 . D6 . F5 . Bb5 . F5 . D6 . F5 .',
  'F5 . C6 . A5 . C6 . F5 . C6 . A5 . C6 .', 'C6 . G5 . E6 . G5 . C6 . G5 . E6 . G5 .',
  'D6 . A5 . F6 . A5 . D6 . A5 . F6 . A5 .', 'Bb5 . F5 . D6 . F5 . Bb5 . F5 . D6 . F5 .',
  'F5 . C6 . A5 . C6 . F5 . C6 . A5 . C6 .', 'C6 . G5 . E6 . G5 . D6 . A5 . F6 . A5 .',
);

// Mars: a little spacey and mysterious. Em – C – Am – B, a pulsing bass.
const marsLead = bars(
  'E5 - . G5 - . B5 - A5 - G5 . E5 - - .',
  'C5 - . E5 - . G5 - - . E5 - C5 - - .',
  'A4 - . C5 - . E5 - D5 - C5 . A4 - - .',
  'B4 - - . D#5 - - . F#5 - - . D#5 - - .',
  'G5 - . B5 - . E6 - D6 - B5 . G5 - - .',
  'E5 - . G5 - . C6 - - . G5 - E5 - - .',
  'C5 - . E5 - . A5 - G5 - E5 . C5 - - .',
  'D#5 - - . F#5 - - . B4 - - - - - - .',
);
const marsBass = bars(
  'E2 . E2 . E2 . E2 . E2 . E2 . G2 . B2 .', 'C2 . C2 . C2 . C2 . C2 . C2 . E2 . G2 .',
  'A2 . A2 . A2 . A2 . A2 . A2 . C3 . E3 .', 'B1 . B1 . B1 . B1 . D#2 . D#2 . F#2 . B1 .',
  'E2 . E2 . E2 . E2 . E2 . E2 . G2 . B2 .', 'C2 . C2 . C2 . C2 . C2 . C2 . E2 . G2 .',
  'A2 . A2 . A2 . A2 . A2 . A2 . C3 . E3 .', 'B1 . B1 . B1 . B1 . D#2 . D#2 . F#2 . B1 .',
);
const marsPad = bars(
  'B5 - - - - - - - - - - - - - - .', 'G5 - - - - - - - - - - - - - - .',
  'E5 - - - - - - - - - - - - - - .', 'F#5 - - - - - - - - - - - - - - .',
  'B5 - - - - - - - - - - - - - - .', 'G5 - - - - - - - - - - - - - - .',
  'E5 - - - - - - - - - - - - - - .', 'D#5 - - - - - - - - - - - - - - .',
);

// Saturn: snowy, with sleigh bells. G – C – D – G – Em – C – D – G.
const saturnLead = bars(
  'D5 . G5 . B5 . A5 . G5 - - . D5 - - .',
  'E5 . G5 . C6 . B5 . A5 - - . E5 - - .',
  'F#5 . A5 . D6 . C6 . A5 - - . F#5 - - .',
  'G5 - - . B5 - - . G5 - - - - - - .',
  'B5 . G5 . E5 . G5 . B5 - - . E6 - - .',
  'C6 . B5 . A5 . G5 . E5 - - . G5 - - .',
  'A5 . F#5 . D5 . F#5 . A5 - - . C6 - - .',
  'B5 - - . A5 - - . G5 - - - - - - .',
);
const saturnBass = bars(
  'G2 - . . D3 - . . G2 - . . D3 - . .', 'C3 - . . G2 - . . C3 - . . G2 - . .',
  'D3 - . . A2 - . . D3 - . . A2 - . .', 'G2 - . . D3 - . . G2 - . . D3 - . .',
  'E2 - . . B2 - . . E2 - . . B2 - . .', 'C3 - . . G2 - . . C3 - . . G2 - . .',
  'D3 - . . A2 - . . D3 - . . A2 - . .', 'G2 - . . D3 - . . G2 - - - - - - .',
);
const saturnBells = each('. . x . . . x . . . x . . . x x');

// Dino Planet: jungle marimba and drums. Dm – G – Dm – C.
const dinoLead = bars(
  'D5 . F5 . A5 . F5 . G5 . A5 . F5 . D5 .',
  'B4 . D5 . G5 . D5 . E5 . G5 . D5 . B4 .',
  'D5 . F5 . A5 . C6 . A5 . G5 . F5 . E5 .',
  'C5 . E5 . G5 . E5 . C5 - - . . . . .',
  'A5 . A5 . G5 . F5 . G5 . A5 . D6 - - .',
  'B5 . B5 . A5 . G5 . A5 . B5 . G5 - - .',
  'F5 . E5 . D5 . E5 . F5 . G5 . A5 . F5 .',
  'E5 . D5 . C5 . E5 . D5 - - - - - - .',
);
const dinoBassDm = 'D2 - . D2 . . A2 . D2 - . D2 . . C3 .';
const dinoBassG = 'G2 - . G2 . . D3 . G2 - . G2 . . F2 .';
const dinoBassC = 'C2 - . C2 . . G2 . C2 - . C2 . . A2 .';
const dinoBass = bars(dinoBassDm, dinoBassG, dinoBassDm, dinoBassC, dinoBassDm, dinoBassG, dinoBassDm, dinoBassC);
const dinoDrums = each('x . . x . . x . x . . x . x . .');

// The Sun: bright and triumphant. C – F – G – C – Am – F – G – C.
const sunLead = bars(
  'G4 - C5 - E5 - G5 - - - E5 - G5 - - -',
  'A5 - - - G5 - F5 - A5 - - - C6 - - -',
  'B5 - - - A5 - G5 - D5 - - - G5 - - -',
  'C6 - - - - - - - G5 - E5 - C5 - - -',
  'A5 - - - C6 - B5 - A5 - - - E5 - - -',
  'F5 - A5 - C6 - A5 - F5 - - - A5 - - -',
  'G5 - - - B5 - D6 - C6 - B5 - A5 - G5 -',
  'C6 - - - - - - - - - - - - - - .',
);
const sunHarmony = bars(
  'E4 - - - - - - - G4 - - - - - - .', 'F4 - - - - - - - A4 - - - - - - .',
  'G4 - - - - - - - B4 - - - - - - .', 'E4 - - - - - - - G4 - - - - - - .',
  'E4 - - - - - - - A4 - - - - - - .', 'F4 - - - - - - - A4 - - - - - - .',
  'G4 - - - - - - - B4 - - - - - - .', 'E4 - - - - - - - - - - - - - - .',
);
const sunBass = bars(
  'C3 - - . C3 - - . G2 - - . G2 - - .', 'F2 - - . F2 - - . C3 - - . C3 - - .',
  'G2 - - . G2 - - . D3 - - . D3 - - .', 'C3 - - . C3 - - . G2 - - . G2 - - .',
  'A2 - - . A2 - - . E2 - - . E2 - - .', 'F2 - - . F2 - - . C3 - - . C3 - - .',
  'G2 - - . G2 - - . D3 - - . D3 - - .', 'C3 - - - - - - - - - - - - - - .',
);
const sunDrums = each('. . . . x . . . . . . . x . . .');

// Rainbow Planet: bright and bubbly, with a twinkly arpeggio. D – Bm – G – A.
const rainbowLead = bars(
  'D5 - F#5 - A5 - D6 - A5 - F#5 - A5 - - -',
  'B4 - D5 - F#5 - B5 - - - A5 - F#5 - - -',
  'G4 - B4 - D5 - G5 - D5 - B4 - D5 - - -',
  'A4 - C#5 - E5 - A5 - - - G5 - E5 - - -',
  'D6 - - - C#6 - B5 - A5 - - - F#5 - - -',
  'B5 - - - A5 - G5 - F#5 - - - D5 - - -',
  'G5 - A5 - B5 - D6 - E6 - - - D6 - B5 -',
  'A5 - - - - - - - D5 - - - - - - .',
);
const rainbowTwinkle = bars(
  'D6 . A5 . F#6 . A5 . D6 . A5 . F#6 . A5 .', 'B5 . F#5 . D6 . F#5 . B5 . F#5 . D6 . F#5 .',
  'G5 . D6 . B5 . D6 . G5 . D6 . B5 . D6 .', 'A5 . E6 . C#6 . E6 . A5 . E6 . C#6 . E6 .',
  'D6 . A5 . F#6 . A5 . D6 . A5 . F#6 . A5 .', 'B5 . F#5 . D6 . F#5 . B5 . F#5 . D6 . F#5 .',
  'G5 . D6 . B5 . D6 . G5 . D6 . B5 . D6 .', 'A5 . E6 . C#6 . E6 . D6 . A5 . F#6 . A5 .',
);
const rainbowBass = bars(
  'D3 - - . D3 - - . A2 - - . A2 - - .', 'B2 - - . B2 - - . F#2 - - . F#2 - - .',
  'G2 - - . G2 - - . D3 - - . D3 - - .', 'A2 - - . A2 - - . E2 - - . E2 - - .',
  'D3 - - . D3 - - . A2 - - . A2 - - .', 'B2 - - . B2 - - . F#2 - - . F#2 - - .',
  'G2 - - . G2 - - . D3 - - . D3 - - .', 'A2 - - . A2 - - . D3 - - - - - - .',
);
const rainbowDrums = each('x . . . . . x . x . . . . . x .');

// The bonus rooms: a bouncy arcade tune. C – Am – F – G.
const arcadeLead = bars(
  'C5 . E5 . G5 . C6 . G5 . E5 . G5 . C6 .',
  'A4 . C5 . E5 . A5 . E5 . C5 . E5 . A5 .',
  'F4 . A4 . C5 . F5 . C5 . A4 . C5 . F5 .',
  'G4 . B4 . D5 . G5 . F5 . D5 . B4 . G4 .',
  'E5 - G5 - C6 - - . B5 . A5 . G5 - - .',
  'C6 - B5 - A5 - - . G5 . E5 . C5 - - .',
  'A5 - G5 - F5 - - . E5 . D5 . C5 - - .',
  'D5 . E5 . F5 . G5 . A5 . B5 . C6 - - .',
);
const arcadeC = 'C3 . C3 . G2 . G2 . C3 . C3 . G2 . G2 .';
const arcadeAm = 'A2 . A2 . E2 . E2 . A2 . A2 . E2 . E2 .';
const arcadeF = 'F2 . F2 . C3 . C3 . F2 . F2 . C3 . C3 .';
const arcadeG = 'G2 . G2 . D3 . D3 . G2 . G2 . D3 . D3 .';
const arcadeBass = bars(arcadeC, arcadeAm, arcadeF, arcadeG, arcadeC, arcadeAm, arcadeF, arcadeG);
const arcadeDrums = each('x . x . x . x . x . x . x . x x');

export const THEMES = {
  moon: {
    bpm: 58,
    steps: 128,
    tracks: [
      { wave: 'sine', gain: 0.06, notes: moonLead, decay: 1.2, attack: 0.06 },
      { wave: 'sine', gain: 0.11, notes: moonBass, decay: 1.1, attack: 0.08 },
      { wave: 'triangle', gain: 0.025, notes: moonTwinkle, decay: 2.5, attack: 0.01 },
    ],
  },
  mars: {
    bpm: 70,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.055, notes: marsLead, decay: 1, attack: 0.03 },
      { wave: 'sine', gain: 0.11, notes: marsBass, decay: 0.8, attack: 0.02 },
      { wave: 'sine', gain: 0.025, notes: marsPad, decay: 1.2, attack: 0.3 },
    ],
  },
  saturn: {
    bpm: 78,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.06, notes: saturnLead, decay: 1, attack: 0.02 },
      { wave: 'sine', gain: 0.12, notes: saturnBass, decay: 0.9, attack: 0.02 },
      { wave: 'noise', gain: 0.02, notes: saturnBells, decay: 1, attack: 0.005 },
    ],
  },
  dino: {
    bpm: 88,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.06, notes: dinoLead, decay: 0.6, attack: 0.01 },
      { wave: 'sine', gain: 0.13, notes: dinoBass, decay: 0.9, attack: 0.02 },
      { wave: 'noise', gain: 0.025, notes: dinoDrums, decay: 1, attack: 0.005 },
    ],
  },
  sun: {
    bpm: 84,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.065, notes: sunLead, decay: 1, attack: 0.02 },
      { wave: 'square', gain: 0.012, notes: sunHarmony, decay: 1, attack: 0.05 },
      { wave: 'sine', gain: 0.12, notes: sunBass, decay: 0.9, attack: 0.02 },
      { wave: 'noise', gain: 0.02, notes: sunDrums, decay: 1, attack: 0.005 },
    ],
  },
  rainbow: {
    bpm: 104,
    steps: 128,
    tracks: [
      { wave: 'triangle', gain: 0.06, notes: rainbowLead, decay: 1, attack: 0.02 },
      { wave: 'square', gain: 0.012, notes: rainbowTwinkle, decay: 0.6, attack: 0.01 },
      { wave: 'sine', gain: 0.12, notes: rainbowBass, decay: 0.9, attack: 0.02 },
      { wave: 'noise', gain: 0.02, notes: rainbowDrums, decay: 1, attack: 0.005 },
    ],
  },
  arcade: {
    bpm: 116,
    steps: 128,
    tracks: [
      { wave: 'square', gain: 0.022, notes: arcadeLead, decay: 0.7, attack: 0.01 },
      { wave: 'triangle', gain: 0.1, notes: arcadeBass, decay: 0.7, attack: 0.01 },
      { wave: 'noise', gain: 0.018, notes: arcadeDrums, decay: 1, attack: 0.005 },
    ],
  },
};
