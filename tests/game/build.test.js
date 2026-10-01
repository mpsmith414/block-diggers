import { describe, it, expect } from 'vitest';
import { unlockedBlocks, createYard, yardEdits, placeBlock, removeBlock, aimCell, tallest, kindsUsed, canEdit } from '../../src/game/build.js';
import { B } from '../../src/world/blocks.js';
import { defaultState } from '../../src/save/save.js';
import { BUILD, TILE, PLAYER } from '../../src/tuning.js';

const withLayers = (layers, deepest = 0) => ({ ...defaultState(), records: { ...defaultState().records, layers, deepest } });

describe('the build yard: blocks you can build with', () => {
  it('a brand-new player has grass, dirt, stone and ladders', () => {
    expect(unlockedBlocks(defaultState())).toEqual([B.GRASS, B.DIRT, B.STONE, B.LADDER]);
  });

  it('reaching a layer (on any planet) unlocks its rock and treasure, once each', () => {
    const blocks = unlockedBlocks(withLayers(['crystal', 'craters', 'rings'], 160));
    for (const id of [B.CRYSTAL, B.DIAMOND, B.MOONROCK, B.MOONSTONE, B.ICE, B.FROST, B.DEEP, B.IRON]) expect(blocks).toContain(id);
    expect(blocks).not.toContain(B.BRICKS);
    expect(blocks).not.toContain(B.SUN_CORE);
    expect(new Set(blocks).size).toBe(blocks.length);
  });

  it('never unlocks anything dangerous or special', () => {
    const all = unlockedBlocks(withLayers(['dirt', 'stone', 'deep', 'crystal', 'dino', 'brick', 'meteor', 'core', 'suncore', 'mooncore'], 400));
    for (const id of [B.LAVA, B.BOOM, B.CHEST, B.BEDROCK, B.EGG, B.AIR]) expect(all).not.toContain(id);
  });
});

describe('the build yard: building', () => {
  it('starts as a meadow: grass over dirt, bedrock at the bottom, sky above', () => {
    const g = createYard();
    expect(g.get(10, BUILD.ground)).toBe(B.GRASS);
    expect(g.get(10, BUILD.ground + 1)).toBe(B.DIRT);
    expect(g.get(10, BUILD.h - 1)).toBe(B.BEDROCK);
    expect(g.get(10, BUILD.ground - 1)).toBe(B.AIR);
    expect(yardEdits(g)).toEqual([]);
  });

  it('places blocks in the air (not inside a player), and takes them away again', () => {
    const g = createYard();
    const y = BUILD.ground - 1;
    expect(placeBlock(g, 10, y, B.BRICKS)).toBe(true);
    expect(placeBlock(g, 10, y, B.STONE)).toBe(false); // already full
    const player = { x: 12 * TILE + 2, y: (y + 1) * TILE - PLAYER.h };
    expect(placeBlock(g, 12, y, B.STONE, [player])).toBe(false);
    expect(placeBlock(g, 12, y, B.LADDER, [player])).toBe(true); // (you can stand in a ladder)
    expect(removeBlock(g, 10, y)).toBe(B.BRICKS);
    expect(removeBlock(g, 10, y)).toBe(null);
    expect(removeBlock(g, 10, BUILD.h - 1)).toBe(null); // the bottom stays
    expect(placeBlock(g, 0, y, B.STONE)).toBe(false); // (the gate is kept clear)
  });

  it('saves only what changed, and comes back the same', () => {
    const g = createYard();
    placeBlock(g, 20, BUILD.ground - 1, B.DIAMOND);
    placeBlock(g, 20, BUILD.ground - 2, B.RUBY);
    removeBlock(g, 30, BUILD.ground);
    const edits = yardEdits(g);
    expect(edits).toHaveLength(3);
    const again = createYard(edits);
    expect(again.get(20, BUILD.ground - 2)).toBe(B.RUBY);
    expect(again.get(30, BUILD.ground)).toBe(B.AIR);
    expect(yardEdits(again)).toEqual(edits);
  });

  it('aims beside you, above your head, or under your feet', () => {
    const p = { x: 10 * TILE + 2, y: (BUILD.ground) * TILE - PLAYER.h, facing: 1 };
    const row = BUILD.ground - 1;
    expect(aimCell(p)).toEqual({ x: 11, y: row });
    expect(aimCell({ ...p, facing: -1 })).toEqual({ x: 9, y: row });
    expect(aimCell(p, -1, 0)).toEqual({ x: 9, y: row });
    expect(aimCell(p, 0, -1)).toEqual({ x: 10, y: row - 1 });
    expect(aimCell(p, 0, 1)).toEqual({ x: 10, y: row + 1 });
  });

  it('knows how tall your tallest build is and how many kinds of block you used', () => {
    const g = createYard();
    for (let k = 1; k <= 5; k++) placeBlock(g, 15, BUILD.ground - k, k % 2 ? B.BRICKS : B.STONE);
    expect(tallest(g)).toBe(5);
    expect(kindsUsed(g)).toBe(2);
  });
});

describe('where you can build', () => {
  it('everywhere past the gate, except the bottom row', () => {
    expect(canEdit(BUILD.gate - 1, 10)).toBe(false); // the gate itself (A there goes back to camp)
    expect(canEdit(BUILD.gate, 10)).toBe(true);
    expect(canEdit(BUILD.w - 1, BUILD.ground)).toBe(true); // the meadow's ground can be dug
    expect(canEdit(10, BUILD.h - 1)).toBe(false);
  });
});
