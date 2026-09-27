import { describe, it, expect } from 'vitest';
import { createPowerups, touchLava, stepPowerups, multipliers } from '../../src/game/powerups.js';
import { POWERUPS } from '../../src/tuning.js';

const run = (pu, seconds, opts = {}) => {
  const events = [];
  for (let t = 0; t < seconds - 1e-9; t += 0.05) events.push(...stepPowerups(pu, 0.05, opts));
  return events;
};

describe('lava monster', () => {
  it('touching lava turns you into a lava monster (once), for a while, then back', () => {
    const pu = createPowerups();
    expect(touchLava(pu)).toBe(true);
    expect(touchLava(pu)).toBe(false); // already a monster: just keeps going
    expect(multipliers(pu)).toMatchObject({ dig: 2, lavaSafe: true });
    const ev = run(pu, POWERUPS.lavaTime + 0.1);
    expect(ev).toContain('lavaEnd');
    expect(multipliers(pu)).toMatchObject({ dig: 1, lavaSafe: false });
  });
  it('touching lava again while a monster tops the timer back up', () => {
    const pu = createPowerups();
    touchLava(pu);
    run(pu, POWERUPS.lavaTime - 1);
    touchLava(pu);
    expect(run(pu, 2)).not.toContain('lavaEnd');
  });
});

describe('drinking water', () => {
  it('a moment in the water: drink, burp, then zoomies', () => {
    const pu = createPowerups();
    const ev = run(pu, POWERUPS.drinkAfter + POWERUPS.drinkTime + 0.2, { inWater: true });
    expect(ev).toContain('drinkStart');
    expect(ev).toContain('burp');
    expect(multipliers(pu)).toMatchObject({ walk: POWERUPS.zoomSpeed, dig: POWERUPS.zoomSpeed });
    expect(run(pu, POWERUPS.zoomTime + 0.1)).toContain('zoomEnd');
    expect(multipliers(pu).walk).toBe(1);
  });
  it('a quick dip is not enough, and you must leave the water before drinking again', () => {
    const pu = createPowerups();
    expect(run(pu, POWERUPS.drinkAfter - 0.2, { inWater: true })).not.toContain('drinkStart');
    run(pu, 0.5); // left the water: the count starts over
    expect(run(pu, POWERUPS.drinkAfter - 0.2, { inWater: true })).not.toContain('drinkStart');
    run(pu, POWERUPS.drinkAfter + POWERUPS.drinkTime + 0.2, { inWater: true }); // drank
    expect(run(pu, 5, { inWater: true })).not.toContain('drinkStart'); // still in: no second drink
    run(pu, POWERUPS.drinkCooldown + 0.1); // out for a while
    expect(run(pu, POWERUPS.drinkAfter + 0.2, { inWater: true })).toContain('drinkStart');
  });
  it('being a lava monster beats zoomies for digging', () => {
    const pu = createPowerups();
    run(pu, POWERUPS.drinkAfter + POWERUPS.drinkTime + 0.2, { inWater: true });
    touchLava(pu);
    expect(multipliers(pu).dig).toBe(2);
  });
});
