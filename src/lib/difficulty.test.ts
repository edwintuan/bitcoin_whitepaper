// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { RETARGET_INTERVAL, TARGET_SPACING, TARGET_TIMESPAN, difficultyOf, nextTarget } from './difficulty';
import { bitsToTarget, targetFromZeroBits, targetToBits } from './header';

// Mainnet's proof-of-work limit (Bitcoin Core v32.1, src/kernel/chainparams.cpp:126).
const POW_LIMIT = (1n << 224n) - 1n;
const HUGE_LIMIT = (1n << 256n) - 1n;
const DIFFICULTY_1 = bitsToTarget(0x1d00ffff);

describe('retarget constants', () => {
  it('aims for one block every ten minutes, re-tuned every two weeks', () => {
    expect(TARGET_TIMESPAN).toBe(1_209_600);
    expect(TARGET_SPACING).toBe(600);
    expect(RETARGET_INTERVAL).toBe(2016);
  });
});

describe('nextTarget', () => {
  const t = bitsToTarget(0x1b0404cb);

  it('keeps the target when the period took exactly two weeks', () => {
    expect(nextTarget(t, TARGET_TIMESPAN, HUGE_LIMIT)).toBe(t);
  });
  it('halves the target when blocks came twice as fast', () => {
    expect(nextTarget(t, TARGET_TIMESPAN / 2, HUGE_LIMIT)).toBe(t / 2n);
  });
  it('doubles the target when blocks came half as fast', () => {
    expect(nextTarget(t, TARGET_TIMESPAN * 2, HUGE_LIMIT)).toBe(t * 2n);
  });
  it('tightens by at most a factor of four', () => {
    expect(nextTarget(t, TARGET_TIMESPAN / 10, HUGE_LIMIT)).toBe(t / 4n);
    expect(nextTarget(t, 0, HUGE_LIMIT)).toBe(t / 4n);
    expect(nextTarget(t, -5000, HUGE_LIMIT)).toBe(t / 4n);
  });
  it('loosens by at most a factor of four', () => {
    expect(nextTarget(t, TARGET_TIMESPAN * 10, HUGE_LIMIT)).toBe(t * 4n);
    expect(nextTarget(t, Number.POSITIVE_INFINITY, HUGE_LIMIT)).toBe(t * 4n);
  });
  it('never exceeds the limit', () => {
    expect(nextTarget(POW_LIMIT, TARGET_TIMESPAN * 2, POW_LIMIT)).toBe(POW_LIMIT);
    expect(nextTarget(POW_LIMIT / 2n, TARGET_TIMESPAN * 4, POW_LIMIT)).toBe(POW_LIMIT);
    expect(nextTarget(t, TARGET_TIMESPAN * 4, t)).toBe(t);
  });
  it('counts whole seconds only, as block timestamps do', () => {
    expect(nextTarget(t, 1_000_000.7, HUGE_LIMIT)).toBe((t * 1_000_000n) / BigInt(TARGET_TIMESPAN));
  });
  it('rejects a timespan that is not a number', () => {
    expect(() => nextTarget(t, Number.NaN, HUGE_LIMIT)).toThrow(RangeError);
  });

  // Bitcoin Core v32.1, src/test/pow_tests.cpp:17-78. Each case is
  // [previous bits, first block time, last block time, expected next bits].
  const CORE_CASES: [string, number, number, number, number][] = [
    ['no limit applies (blocks 30240 to 32255)', 0x1d00ffff, 1261130161, 1262152739, 0x1d00d86a],
    ['capped by the proof-of-work limit (blocks 0 to 2015)', 0x1d00ffff, 1231006505, 1233061996, 0x1d00ffff],
    ['capped at a quarter (blocks 66528 to 68543)', 0x1c05a3f4, 1279008237, 1279297671, 0x1c0168fd],
    ['capped at four times', 0x1c387f6f, 1263163443, 1269211443, 0x1d00e1fd],
  ];
  it.each(CORE_CASES)("matches Bitcoin Core's retarget test: %s", (_name, prevBits, firstTime, lastTime, wantBits) => {
    const next = nextTarget(bitsToTarget(prevBits), lastTime - firstTime, POW_LIMIT);
    expect(targetToBits(next)).toBe(wantBits);
  });
});

describe('difficultyOf', () => {
  it('is 1 at the difficulty-1 target 0x1d00ffff', () => {
    expect(difficultyOf(DIFFICULTY_1)).toBe(1);
  });
  it('doubles when the target halves', () => {
    expect(difficultyOf(DIFFICULTY_1 / 2n)).toBe(2);
    expect(difficultyOf(DIFFICULTY_1 / 4n)).toBe(4);
  });
  it('matches the worked example for bits 0x1b0404cb', () => {
    expect(difficultyOf(bitsToTarget(0x1b0404cb))).toBeCloseTo(16307.420938523983, 6);
  });
  it('is far below 1 for the toy targets the figures mine against', () => {
    // 16 zero bits take 2^16 tries on average; difficulty 1 takes about 2^32.
    expect(difficultyOf(targetFromZeroBits(16))).toBeCloseTo(2 ** 16 / (2 ** 48 / 0xffff), 12);
    expect(difficultyOf(targetFromZeroBits(16))).toBeLessThan(1);
  });
  it('is infinite for a target of zero, which no hash but zero can meet', () => {
    expect(difficultyOf(0n)).toBe(Number.POSITIVE_INFINITY);
  });
});
