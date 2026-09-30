import { describe, it, expect } from 'vitest';
import { songFor } from '../../src/audio/wire.js';
import { SONGS } from '../../src/audio/synth.js';

describe('which song plays where', () => {
  it('Earth keeps its camp and mine songs; every other planet has its own theme', () => {
    expect(songFor('Camp', 'earth')).toBe('camp');
    expect(songFor('Mine', 'earth')).toBe('mine');
    for (const planet of ['moon', 'mars', 'saturn', 'dino', 'sun']) {
      expect(songFor('Mine', planet)).toBe(planet);
      expect(songFor('Camp', planet)).toBe(planet);
      expect(SONGS[planet]).toBeTruthy();
    }
    expect(songFor('Build')).toBe('camp');
    expect(songFor('Title')).toBe('camp');
    expect(SONGS.arcade).toBeTruthy();
  });
});
