/**
 * Mulberry32, a small seeded pseudo-random generator. Returns a function that
 * yields numbers in [0, 1), like `Math.random`, except that the same seed
 * always replays the same sequence. The simulations take one of these so a
 * run can be reproduced exactly, in tests and when a reader presses replay.
 *
 * Not a source of secrets: keys come from the platform's CSPRNG in `keys.ts`.
 *
 * @param seed read as an unsigned 32-bit integer (fractions dropped, wraps at 2^32)
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 2 ** 32;
  };
}
