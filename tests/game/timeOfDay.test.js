import { describe, it, expect } from 'vitest';
import { phaseForTrips, PHASES, PHASE_ORDER } from '../../src/game/timeOfDay.js';

describe('phaseForTrips', () => {
  it('starts in the morning and cycles through the day every 4 trips', () => {
    expect([0, 1, 2, 3, 4, 7].map(phaseForTrips)).toEqual(['morning', 'day', 'sunset', 'night', 'morning', 'night']);
    expect(phaseForTrips(undefined)).toBe('morning');
  });
  it('every phase has its palette', () => {
    for (const p of PHASE_ORDER) expect(PHASES[p].skyTop).toBeTypeOf('number');
  });
});
