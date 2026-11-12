// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';

const take = (rng: () => number, n: number) => Array.from({ length: n }, () => rng());

describe('mulberry32', () => {
  // First five 32-bit outputs per seed, computed with an independent
  // big-integer transcription of the published C definition:
  //   z = (state += 0x6D2B79F5); z = (z ^ z >> 15) * (z | 1);
  //   z ^= z + (z ^ z >> 7) * (z | 61); return z ^ z >> 14;
  const REFERENCE: [number, number[]][] = [
    [0, [0x4434b462, 0x00159c37, 0x39285b08, 0x256d8104, 0x77a2cbd4]],
    [1, [0xa087eaf3, 0x00b349c9, 0x8706c4eb, 0xfb2627fd, 0xf7e79d2b]],
    [7, [0x02ff152c, 0x0fdc7f12, 0xfa169e5e, 0xb2f38b96, 0x857d6fe7]],
    [0xdeadbeef, [0xf0fd995a, 0x4466f0cf, 0xc5a3fa66, 0x5bb06c70, 0x79bd1972]],
    [0xffffffff, [0xe57bf3d3, 0x3081a5a4, 0xb7350390, 0xf1ade904, 0xd8616a2f]],
  ];

  it.each(REFERENCE)('matches the reference sequence for seed %i', (seed, words) => {
    expect(take(mulberry32(seed), 5).map((x) => x * 2 ** 32)).toEqual(words);
  });
  it('returns numbers in [0, 1)', () => {
    const values = take(mulberry32(42), 20_000);
    expect(values.reduce((a, b) => Math.min(a, b))).toBeGreaterThanOrEqual(0);
    expect(values.reduce((a, b) => Math.max(a, b))).toBeLessThan(1);
  });
  it('repeats exactly for the same seed', () => {
    expect(take(mulberry32(2008), 200)).toEqual(take(mulberry32(2008), 200));
  });
  it('differs between seeds', () => {
    expect(take(mulberry32(1), 5)).not.toEqual(take(mulberry32(2), 5));
  });
  it('keeps separate state per generator', () => {
    const alone = take(mulberry32(5), 6);
    const a = mulberry32(5);
    const b = mulberry32(5);
    const interleaved = [a(), b(), a(), b(), a(), b()];
    expect(interleaved).toEqual([alone[0], alone[0], alone[1], alone[1], alone[2], alone[2]]);
  });
  it('reads the seed as an unsigned 32-bit integer', () => {
    expect(take(mulberry32(-1), 3)).toEqual(take(mulberry32(0xffffffff), 3));
    expect(take(mulberry32(2 ** 32 + 7), 3)).toEqual(take(mulberry32(7), 3));
    expect(take(mulberry32(7.9), 3)).toEqual(take(mulberry32(7), 3));
  });
  it('spreads its output evenly', () => {
    const n = 100_000;
    const buckets = new Array<number>(10).fill(0);
    let sum = 0;
    for (const x of take(mulberry32(123), n)) {
      buckets[Math.floor(x * 10)]++;
      sum += x;
    }
    expect(sum / n).toBeCloseTo(0.5, 2);
    for (const count of buckets) {
      expect(count).toBeGreaterThan(n / 10 - 500);
      expect(count).toBeLessThan(n / 10 + 500);
    }
  });
});
