import { describe, it, expect } from 'vitest';
import { noteFreq, parseTrack, SONGS, PENTATONIC } from '../../src/audio/synth.js';

describe('noteFreq', () => {
  it('knows concert A and friends', () => {
    expect(noteFreq('A4')).toBeCloseTo(440, 5);
    expect(noteFreq('A5')).toBeCloseTo(880, 5);
    expect(noteFreq('C4')).toBeCloseTo(261.63, 1);
    expect(noteFreq('F#4')).toBeCloseTo(369.99, 1);
    expect(noteFreq('Bb3')).toBeCloseTo(233.08, 1);
  });
  it('returns null for rests and junk', () => {
    expect(noteFreq('.')).toBeNull();
    expect(noteFreq('H9')).toBeNull();
  });
});

describe('parseTrack', () => {
  it('turns tokens into notes with lengths (holds extend)', () => {
    expect(parseTrack('C4 - . E4')).toEqual([
      { step: 0, freq: noteFreq('C4'), len: 2 },
      { step: 3, freq: noteFreq('E4'), len: 1 },
    ]);
  });
});

describe('songs', () => {
  for (const [name, song] of Object.entries(SONGS)) {
    it(`${name}: every track fits the song length and every note parses`, () => {
      expect(song.bpm).toBeGreaterThan(40);
      for (const t of song.tracks) {
        const tokens = t.notes.trim().split(/\s+/);
        expect(tokens).toHaveLength(song.steps);
        for (const tok of tokens) if (tok !== '.' && tok !== '-' && tok !== 'x') expect(noteFreq(tok)).not.toBeNull();
      }
    });
  }
  it('has a pentatonic ladder for ore streaks', () => {
    expect(PENTATONIC.length).toBeGreaterThanOrEqual(8);
    PENTATONIC.forEach((n) => expect(noteFreq(n)).not.toBeNull());
  });
});
