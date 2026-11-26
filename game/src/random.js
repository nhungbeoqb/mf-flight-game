// Seeded random numbers: the same seed always builds the same Sound,
// so screenshots and replays are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickSeed(querySeed) {
  const n = Number.parseInt(querySeed, 10);
  return Number.isFinite(n) ? n : 20261126;
}
