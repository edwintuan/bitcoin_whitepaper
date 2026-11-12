// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { COIN, HALVING_INTERVAL, MAX_SUPPLY, blockSubsidy, supplyAt } from '@/lib/subsidy';
import {
  HALVINGS,
  LAST_PAYING_BLOCK,
  MAX_HEIGHT,
  SUBSIDY_END,
  clampHeight,
  eraAt,
  nextHalving,
  previousHalving,
  satsText,
  shareOfLimit,
  stairs,
  supplyCurve,
} from './supply';

describe('the end of the subsidy, as the engine computes it', () => {
  it('comes after 33 halvings, at block 6,930,000', () => {
    expect(HALVINGS).toBe(33);
    expect(SUBSIDY_END).toBe(6_930_000);
    expect(blockSubsidy(SUBSIDY_END)).toBe(0n);
    expect(blockSubsidy(SUBSIDY_END - 1)).toBe(1n);
  });

  it('makes block 6,929,999 the last to issue anything', () => {
    expect(LAST_PAYING_BLOCK).toBe(6_929_999);
    expect(supplyAt(LAST_PAYING_BLOCK)).toBe(MAX_SUPPLY);
    expect(supplyAt(LAST_PAYING_BLOCK - 1)).toBe(MAX_SUPPLY - 1n);
  });

  it('fits inside the range of the height control', () => {
    expect(MAX_HEIGHT).toBe(7_000_000);
    expect(SUBSIDY_END).toBeLessThan(MAX_HEIGHT);
  });
});

describe('eraAt', () => {
  it('gives the stretch of blocks that share a subsidy', () => {
    expect(eraAt(0)).toEqual({ halvings: 0, start: 0, end: 209_999, subsidy: 50n * COIN });
    expect(eraAt(209_999)).toEqual(eraAt(0));
    expect(eraAt(210_000)).toEqual({ halvings: 1, start: 210_000, end: 419_999, subsidy: 25n * COIN });
    expect(eraAt(840_000)).toEqual({ halvings: 4, start: 840_000, end: 1_049_999, subsidy: 312_500_000n });
  });

  it('ends with one satoshi a block, then nothing for ever', () => {
    expect(eraAt(6_929_999)).toEqual({ halvings: 32, start: 6_720_000, end: 6_929_999, subsidy: 1n });
    expect(eraAt(6_930_000)).toEqual({ halvings: 33, start: 6_930_000, end: null, subsidy: 0n });
    expect(eraAt(MAX_HEIGHT)).toEqual({ halvings: 33, start: 6_930_000, end: null, subsidy: 0n });
  });
});

describe('jumping between halvings', () => {
  it('goes forward to the first block with a smaller subsidy', () => {
    expect(nextHalving(0)).toBe(210_000);
    expect(nextHalving(209_999)).toBe(210_000);
    expect(nextHalving(210_000)).toBe(420_000);
    expect(nextHalving(6_929_999)).toBe(6_930_000);
  });
  it('has nowhere to go once the subsidy is zero', () => {
    expect(nextHalving(6_930_000)).toBeNull();
    expect(nextHalving(MAX_HEIGHT)).toBeNull();
  });
  it('goes back to the start of the era before, or of this one from inside it', () => {
    expect(previousHalving(0)).toBeNull();
    expect(previousHalving(1)).toBe(0);
    expect(previousHalving(210_000)).toBe(0);
    expect(previousHalving(210_001)).toBe(210_000);
    expect(previousHalving(MAX_HEIGHT)).toBe(6_930_000);
  });
  it('visits every halving from one end to the other', () => {
    const visited: number[] = [];
    for (let height: number | null = 0; height !== null; height = nextHalving(height)) visited.push(height);
    expect(visited).toHaveLength(HALVINGS + 1);
    expect(visited[visited.length - 1]).toBe(SUBSIDY_END);
    visited.forEach((height, index) => expect(height).toBe(index * HALVING_INTERVAL));
  });
});

describe('clampHeight', () => {
  it('keeps a height whole and inside the control’s range', () => {
    expect(clampHeight(840_000)).toBe(840_000);
    expect(clampHeight(-5)).toBe(0);
    expect(clampHeight(7_500_000)).toBe(MAX_HEIGHT);
    expect(clampHeight(1234.6)).toBe(1235);
    expect(clampHeight(Number.NaN)).toBe(0);
  });
});

describe('shareOfLimit', () => {
  it('is the part of the eventual total issued by a height, in per cent with two decimals', () => {
    expect(shareOfLimit(0)).toBe('0.00');
    expect(shareOfLimit(209_999)).toBe('50.00');
    expect(shareOfLimit(419_999)).toBe('75.00');
    expect(shareOfLimit(839_999)).toBe('93.75');
  });
  it('is cut off, never rounded up: 100 only once the last satoshi exists', () => {
    expect(shareOfLimit(LAST_PAYING_BLOCK - 1)).toBe('99.99');
    expect(shareOfLimit(LAST_PAYING_BLOCK)).toBe('100');
    expect(shareOfLimit(MAX_HEIGHT)).toBe('100');
    expect(shareOfLimit(2_000_000)).toBe('99.85');
  });
});

describe('stairs', () => {
  const steps = stairs();
  it('has one step per era and a last, flat one to the end of the range', () => {
    expect(steps).toHaveLength(HALVINGS + 1);
    expect(steps[0]).toEqual({ from: 0, to: 210_000, subsidy: 50n * COIN });
    expect(steps[32]).toEqual({ from: 6_720_000, to: 6_930_000, subsidy: 1n });
    expect(steps[33]).toEqual({ from: 6_930_000, to: MAX_HEIGHT, subsidy: 0n });
  });
  it('joins up, and takes every value from the engine', () => {
    steps.forEach((step, index) => {
      if (index > 0) expect(step.from).toBe(steps[index - 1].to);
      expect(step.subsidy).toBe(blockSubsidy(step.from));
      expect(step.subsidy).toBe(blockSubsidy(step.to - 1));
    });
  });
});

describe('supplyCurve', () => {
  const points = supplyCurve();
  it('starts at nothing and bends at every halving', () => {
    expect(points).toHaveLength(HALVINGS + 2);
    expect(points[0]).toEqual({ height: 0, supply: 0n });
    expect(points[1]).toEqual({ height: 210_000, supply: 10_500_000n * COIN });
    expect(points[2]).toEqual({ height: 420_000, supply: 15_750_000n * COIN });
  });
  it('reaches the limit when the subsidy ends and stays there', () => {
    expect(points[33]).toEqual({ height: SUBSIDY_END, supply: MAX_SUPPLY });
    expect(points[34]).toEqual({ height: MAX_HEIGHT, supply: MAX_SUPPLY });
  });
  it('holds, at each height, what the blocks below it have issued', () => {
    for (const point of points.slice(1)) expect(point.supply).toBe(supplyAt(point.height - 1));
    points.forEach((point, index) => {
      if (index > 0) expect(point.supply >= points[index - 1].supply).toBe(true);
    });
  });
});

describe('satsText', () => {
  it('groups the digits of an amount in satoshis without going through a float', () => {
    expect(satsText(312_500_000n)).toBe('312,500,000');
    expect(satsText(MAX_SUPPLY)).toBe('2,099,999,997,690,000');
    expect(satsText(0n)).toBe('0');
    expect(satsText(9_007_199_254_740_993n)).toBe('9,007,199,254,740,993'); // beyond what a float can hold
  });
});
