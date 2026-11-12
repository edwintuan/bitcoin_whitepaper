// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { COIN } from '@/lib/subsidy';
import { BLOCKS_PER_DAY, blocksPerDay, coinsPerDay, outearnsTheRest, surelyCatchesUp } from './honest';

describe('what the rules pay a miner on an average day', () => {
  it('counts 144 blocks to the day: one every ten minutes', () => {
    expect(BLOCKS_PER_DAY).toBe(144);
    expect(BLOCKS_PER_DAY).toBe((24 * 60) / 10);
  });

  it('gives a miner its share of those blocks', () => {
    expect(blocksPerDay(100)).toBe(144);
    expect(blocksPerDay(51)).toBeCloseTo(73.44, 10);
    expect(blocksPerDay(1)).toBeCloseTo(1.44, 10);
    expect(blocksPerDay(0)).toBe(0);
  });

  it('pays each of them the subsidy of the chosen height', () => {
    expect(coinsPerDay(100, 0)).toBe(7_200n * COIN);
    expect(coinsPerDay(51, 840_000)).toBe(22_950_000_000n); // 229.5 BTC
    expect(coinsPerDay(49, 840_000)).toBe(22_050_000_000n); // 220.5 BTC
    expect(coinsPerDay(51, 840_000) + coinsPerDay(49, 840_000)).toBe(coinsPerDay(100, 840_000));
  });

  it('pays nothing new once the subsidy is zero', () => {
    expect(coinsPerDay(60, 6_930_000)).toBe(0n);
    expect(coinsPerDay(60, 7_000_000)).toBe(0n);
  });

  it('rounds an average to the nearest satoshi, as it may have a fraction of one', () => {
    // 144 blocks × 33% × 1 satoshi = 47.52 satoshis
    expect(coinsPerDay(33, 6_720_000)).toBe(48n);
    // 144 × 99% = 142.56 and 144 × 1% = 1.44
    expect(coinsPerDay(99, 6_720_000)).toBe(143n);
    expect(coinsPerDay(1, 6_720_000)).toBe(1n);
  });

  it('gives two shares that make up the whole exactly the whole, at every share and in every era', () => {
    for (const height of [0, 840_000, 2_100_000, 6_510_000, 6_720_000, 6_930_000]) {
      const all = coinsPerDay(100, height);
      for (let share = 0; share <= 100; share++) {
        expect(coinsPerDay(share, height) + coinsPerDay(100 - share, height), `${share}% at ${height}`).toBe(all);
      }
    }
  });

  it('rejects a share that is not a whole percentage from 0 to 100', () => {
    for (const bad of [-1, 101, 50.5, Number.NaN]) {
      expect(() => blocksPerDay(bad)).toThrow(RangeError);
      expect(() => coinsPerDay(bad, 0)).toThrow(RangeError);
    }
  });
});

describe('where half the hash power makes the difference', () => {
  it('takes more than half to be paid more new coins than everyone else together', () => {
    expect(outearnsTheRest(49)).toBe(false);
    expect(outearnsTheRest(50)).toBe(false);
    expect(outearnsTheRest(51)).toBe(true);
    for (let share = 0; share <= 100; share++) {
      expect(outearnsTheRest(share)).toBe(coinsPerDay(share, 0) > coinsPerDay(100 - share, 0));
    }
  });

  it('takes half or more for an attacker to be sure of catching up: the paper’s p ≤ q', () => {
    expect(surelyCatchesUp(1)).toBe(false);
    expect(surelyCatchesUp(49)).toBe(false);
    expect(surelyCatchesUp(50)).toBe(true);
    expect(surelyCatchesUp(51)).toBe(true);
    expect(surelyCatchesUp(99)).toBe(true);
  });

  it('rejects a share that is not a whole percentage from 0 to 100', () => {
    for (const bad of [-1, 101, 50.5, Number.NaN]) {
      expect(() => outearnsTheRest(bad)).toThrow(RangeError);
      expect(() => surelyCatchesUp(bad)).toThrow(RangeError);
    }
  });
});
