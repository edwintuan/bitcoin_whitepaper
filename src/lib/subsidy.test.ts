// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { COIN, HALVING_INTERVAL, MAX_SUPPLY, blockSubsidy, halvingsAt, supplyAt } from './subsidy';

describe('subsidy', () => {
  it('starts at 50 BTC and halves every 210,000 blocks', () => {
    expect(blockSubsidy(0)).toBe(50n * COIN);
    expect(blockSubsidy(209_999)).toBe(50n * COIN);
    expect(blockSubsidy(210_000)).toBe(25n * COIN);
    expect(blockSubsidy(630_000)).toBe(625_000_000n);
    expect(halvingsAt(840_000)).toBe(4);
  });
  it('reaches zero', () => {
    expect(blockSubsidy(33 * 210_000)).toBe(0n);
    expect(blockSubsidy(64 * 210_000)).toBe(0n);
  });
  it('never reaches 21 million', () => {
    expect(MAX_SUPPLY).toBe(2_099_999_997_690_000n);
    expect(supplyAt(0)).toBe(50n * COIN);
    expect(supplyAt(209_999)).toBe(10_500_000n * COIN);
    expect(supplyAt(40_000_000)).toBe(MAX_SUPPLY);
  });

  it('uses the units and interval of Bitcoin Core', () => {
    expect(COIN).toBe(100_000_000n);
    expect(HALVING_INTERVAL).toBe(210_000);
  });
  it('counts halvings from zero, changing exactly at each multiple of the interval', () => {
    expect(halvingsAt(0)).toBe(0);
    expect(halvingsAt(209_999)).toBe(0);
    expect(halvingsAt(210_000)).toBe(1);
    expect(halvingsAt(419_999)).toBe(1);
    expect(halvingsAt(420_000)).toBe(2);
  });
  it('drops the fraction of a satoshi instead of rounding', () => {
    // 50 BTC / 2^10 is 4,882,812.5 satoshis.
    expect(blockSubsidy(10 * 210_000)).toBe(4_882_812n);
  });
  it('pays one last satoshi per block in the 33rd period', () => {
    expect(blockSubsidy(32 * 210_000)).toBe(1n);
    expect(blockSubsidy(33 * 210_000 - 1)).toBe(1n);
    expect(blockSubsidy(Number.MAX_SAFE_INTEGER)).toBe(0n);
  });
  it('adds one block subsidy to the supply per block', () => {
    expect(supplyAt(1)).toBe(100n * COIN);
    expect(supplyAt(210_000)).toBe(10_500_025n * COIN);
    for (const height of [1, 209_999, 210_000, 210_001, 6_929_999, 6_930_000]) {
      expect(supplyAt(height) - supplyAt(height - 1)).toBe(blockSubsidy(height));
    }
  });
  it('equals the block-by-block total across the first halving', () => {
    let total = 0n;
    for (let height = 0; height <= 210_500; height++) total += blockSubsidy(height);
    expect(supplyAt(210_500)).toBe(total);
  });
  it('stops growing after the last paying block', () => {
    expect(supplyAt(33 * 210_000 - 2)).toBe(MAX_SUPPLY - 1n);
    expect(supplyAt(33 * 210_000 - 1)).toBe(MAX_SUPPLY);
    expect(supplyAt(33 * 210_000)).toBe(MAX_SUPPLY);
    expect(supplyAt(Number.MAX_SAFE_INTEGER)).toBe(MAX_SUPPLY);
    expect(MAX_SUPPLY).toBeLessThan(21_000_000n * COIN);
  });
  it('rejects heights that are not non-negative integers', () => {
    for (const bad of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => halvingsAt(bad)).toThrow(RangeError);
      expect(() => blockSubsidy(bad)).toThrow(RangeError);
      expect(() => supplyAt(bad)).toThrow(RangeError);
    }
  });
});
