// Rainbow Planet's gems. Each layer has its own gem in one size: lots of tiny
// ones, chunky 2x2s, big 4x4s, or one or two massive 8x8s. A gem bigger than
// one block is one thing: digging any of its blocks is a hit on the whole gem,
// cracks spread, and on the last hit it shatters into sparkles. Pure.

export const GEMS = {
  tiny: { cells: 1, hits: 1, sparkles: 1, count: [40, 60] },
  chunky: { cells: 2, hits: 2, sparkles: 6, count: [12, 18] },
  big: { cells: 4, hits: 5, sparkles: 30, count: [3, 5] },
  massive: { cells: 8, hits: 12, sparkles: 150, count: [1, 2] },
};

export const gemInfo = (size) => GEMS[size];

// One hit on a gem (it remembers how many it has left).
export function hitGem(gem) {
  gem.hits -= 1;
  return { broken: gem.hits <= 0, hitsLeft: Math.max(0, gem.hits) };
}

// How cracked it looks: 0 (whole) to 3 (about to go).
export function crackStage(gem) {
  const total = GEMS[gem.size].hits;
  return Math.min(3, Math.floor((1 - gem.hits / total) * 4));
}
