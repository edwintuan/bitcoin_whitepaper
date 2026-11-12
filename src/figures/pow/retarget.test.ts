import { describe, expect, it } from 'vitest';
import { POWERS, retargetRun, scalePosition, trim } from './retarget';

describe('retargetRun', () => {
  it('changes nothing while hash power matches the difficulty', () => {
    for (const period of retargetRun(1)) {
      expect(period.minutes).toBeCloseTo(10, 2);
      expect(period.days).toBeCloseTo(14, 2);
      expect(period.factor).toBeCloseTo(1, 3);
    }
  });

  it('numbers the periods from 1', () => {
    expect(retargetRun(2).map((period) => period.number)).toEqual([1, 2, 3, 4]);
  });

  it('settles a doubling in one adjustment', () => {
    const [first, second] = retargetRun(2);
    expect(first.minutes).toBeCloseTo(5, 2);
    expect(first.days).toBeCloseTo(7, 2);
    expect(first.factor).toBeCloseTo(2, 2);
    expect(second.minutes).toBeCloseTo(10, 1);
    expect(second.factor).toBeCloseTo(1, 2);
  });

  it('settles a halving in one adjustment', () => {
    const [first, second] = retargetRun(0.5);
    expect(first.minutes).toBeCloseTo(20, 2);
    expect(first.days).toBeCloseTo(28, 2);
    expect(first.factor).toBeCloseTo(0.5, 2);
    expect(second.minutes).toBeCloseTo(10, 1);
  });

  it('never moves the difficulty by more than a factor of four at once', () => {
    const up = retargetRun(8);
    expect(up[0].minutes).toBeCloseTo(1.25, 2);
    expect(up[0].factor).toBeCloseTo(4, 2);
    expect(up[1].minutes).toBeCloseTo(5, 1);
    expect(up[1].factor).toBeCloseTo(2, 2);
    expect(up[2].minutes).toBeCloseTo(10, 1);

    const down = retargetRun(0.125);
    expect(down[0].minutes).toBeCloseTo(80, 1);
    expect(down[0].days).toBeCloseTo(112, 1);
    expect(down[0].factor).toBeCloseTo(0.25, 3);
    expect(down[1].minutes).toBeCloseTo(20, 1);
    expect(down[1].factor).toBeCloseTo(0.5, 2);
    expect(down[2].minutes).toBeCloseTo(10, 1);
  });

  it('offers whole doublings, so every figure on screen is exact', () => {
    expect(POWERS).toEqual([0.125, 0.25, 0.5, 1, 2, 4, 8]);
  });
});

describe('scalePosition', () => {
  it('puts ten minutes in the middle and three doublings at either end', () => {
    expect(scalePosition(10)).toBe(0);
    expect(scalePosition(80)).toBe(1);
    expect(scalePosition(1.25)).toBe(-1);
    expect(scalePosition(20)).toBeCloseTo(1 / 3);
    expect(scalePosition(5)).toBeCloseTo(-1 / 3);
  });

  it('stops at the ends', () => {
    expect(scalePosition(1000)).toBe(1);
    expect(scalePosition(0.01)).toBe(-1);
  });
});

describe('trim', () => {
  it('drops zeros after the point only', () => {
    expect(trim(2.5, 1)).toBe('2.5');
    expect(trim(5, 1)).toBe('5');
    expect(trim(1.25, 2)).toBe('1.25');
    expect(trim(0.125, 3)).toBe('0.125');
    expect(trim(0.25, 3)).toBe('0.25');
  });

  it('keeps the zeros of a whole number', () => {
    expect(trim(10, 0)).toBe('10');
    expect(trim(80, 1)).toBe('80');
    expect(trim(100, 2)).toBe('100');
  });
});
