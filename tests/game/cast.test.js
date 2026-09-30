import { describe, it, expect } from 'vitest';
import { castFor, charFor } from '../../src/game/cast.js';

describe('who is who', () => {
  it('keeps the title screen picks', () => {
    expect(castFor(['dino', 'fox'], [], 1)).toEqual(['dino', 'fox']);
  });

  it('a player joining at camp gets their last character, unless their partner has it', () => {
    expect(castFor(['dino'], ['dino', 'robot'], 1)).toEqual(['dino', 'robot']);
    expect(castFor(['fox'], ['miner', 'fox'], 1)).toEqual(['fox', 'miner']);
    expect(castFor(['fox'], [], 1)).toEqual(['fox', 'miner']);
  });

  it('remembers the drop-in so every scene agrees', () => {
    const reg = new Map([['characters', ['robot']], ['save', { characters: ['robot', 'robot'] }]]);
    expect(charFor(reg, 1)).toBe('fox');
    expect(reg.get('characters')).toEqual(['robot', 'fox']);
    expect(charFor(reg, 0)).toBe('robot');
  });
});
