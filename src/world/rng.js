// Seeded PRNG (mulberry32). Same seed, same mine.

export function createRng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return {
    next,
    int,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    weighted(weights) {
      const entries = Object.entries(weights);
      let r = next() * entries.reduce((sum, [, w]) => sum + w, 0);
      for (const [key, w] of entries) {
        r -= w;
        if (r < 0) return key;
      }
      return entries[entries.length - 1][0];
    },
  };
}
