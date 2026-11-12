// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { attackerSuccessProbability as P, minConfirmations } from '@/lib/attack';
import {
  BELOW_FLOOR,
  FLOOR,
  THRESHOLD,
  blocksToWait,
  countNoun,
  curve,
  curvePoints,
  exactValue,
  formatChance,
  formatInHundred,
  formatOneIn,
  formatPercent,
  logPosition,
  oddsForm,
  tickStep,
  zRange,
} from './chart';

describe('zRange', () => {
  it('ends the horizontal axis soon after the curve has left the chart', () => {
    expect(zRange(0.01)).toBe(10);
    expect(zRange(0.05)).toBe(20);
    expect(zRange(0.1)).toBe(20);
    expect(zRange(0.2)).toBe(40);
    expect(zRange(0.3)).toBe(80);
  });
  it('never offers more than 100 blocks, or fewer than 10', () => {
    for (let percent = 1; percent <= 49; percent++) {
      const range = zRange(percent / 100);
      expect(range).toBeGreaterThanOrEqual(10);
      expect(range).toBeLessThanOrEqual(100);
      expect(range % 10).toBe(0);
    }
    expect(zRange(0.35)).toBe(100);
    expect(zRange(0.49)).toBe(100);
  });
  it('grows with the attacker’s share', () => {
    for (let percent = 2; percent <= 49; percent++) {
      expect(zRange(percent / 100)).toBeGreaterThanOrEqual(zRange((percent - 1) / 100));
    }
  });
});

describe('curve', () => {
  it('is the engine’s probability for z = 0 … zMax', () => {
    const values = curve(0.1, 20);
    expect(values).toHaveLength(21);
    values.forEach((value, z) => expect(value).toBe(P(0.1, z)));
  });
});

describe('logPosition', () => {
  it('puts certainty at the top and the floor at the bottom, a ninth of the way per factor of ten', () => {
    expect(logPosition(1)).toBe(0);
    expect(logPosition(FLOOR)).toBeCloseTo(1, 12);
    expect(logPosition(THRESHOLD)).toBeCloseTo(3 / 9, 12);
    expect(logPosition(1e-6)).toBeCloseTo(6 / 9, 12);
  });
  it('clamps what the formula cannot resolve: values under the floor, zero, rounding noise below zero', () => {
    expect(logPosition(1e-12)).toBe(1);
    expect(logPosition(0)).toBe(1);
    expect(logPosition(-5.5e-17)).toBe(1);
    expect(logPosition(Number.NaN)).toBe(1);
    expect(logPosition(1.5)).toBe(0);
  });
});

describe('curvePoints', () => {
  it('follows the curve down to the floor and stops where it leaves the chart', () => {
    const values = curve(0.1, 20);
    const points = curvePoints(values);
    // P(0.1, z) is still above one in a billion at z = 15 and below it at z = 16.
    expect(values[15]).toBeGreaterThan(FLOOR);
    expect(values[16]).toBeLessThan(FLOOR);
    expect(points).toHaveLength(17);
    expect(points[0]).toEqual({ z: 0, at: 0 });
    points.slice(0, 16).forEach((point, z) => {
      expect(point.z).toBe(z);
      expect(point.at).toBeCloseTo(logPosition(values[z]), 12);
    });
    const exit = points[16];
    expect(exit.at).toBe(1);
    expect(exit.z).toBeGreaterThan(15);
    expect(exit.z).toBeLessThan(16);
  });
  it('keeps going to the end of the axis when the curve never reaches the floor', () => {
    const points = curvePoints(curve(0.45, 100));
    expect(points).toHaveLength(101);
    expect(points[100].at).toBeLessThan(1);
  });
  it('moves down the chart with every block', () => {
    for (const q of [0.01, 0.1, 0.3, 0.45, 0.49]) {
      const points = curvePoints(curve(q, zRange(q)));
      for (let i = 1; i < points.length; i++) expect(points[i].at).toBeGreaterThan(points[i - 1].at);
    }
  });
});

describe('blocksToWait', () => {
  it('is the paper’s table: the first z with P under 0.1%', () => {
    const paper: [number, number][] = [[0.1, 5], [0.15, 8], [0.2, 11], [0.25, 15], [0.3, 24], [0.35, 41], [0.4, 89], [0.45, 340]];
    for (const [q, z] of paper) expect(blocksToWait(q)).toBe(z);
  });
  it('agrees with the engine for every share the slider offers, and remembers the answer', () => {
    for (let percent = 1; percent <= 46; percent++) {
      expect(blocksToWait(percent / 100)).toBe(minConfirmations(percent / 100, THRESHOLD));
    }
    expect(blocksToWait(0.49)).toBe(Number.POSITIVE_INFINITY);
    expect(blocksToWait(0.49)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('formatPercent', () => {
  it('shows three significant figures, without exponents', () => {
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(0.2045873)).toBe('20.5%');
    expect(formatPercent(0.0509779)).toBe('5.10%');
    expect(formatPercent(0.0131722)).toBe('1.32%');
    expect(formatPercent(0.0009137)).toBe('0.0914%');
    expect(formatPercent(0.0000012)).toBe('0.000120%');
  });
  it('does not round a chance below certainty up to 100%', () => {
    expect(formatPercent(0.99996)).toBe('99.9%');
  });
  it('prints nothing misleading for values the formula cannot resolve', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(-5.5e-17)).toBe('0%');
  });
});

describe('formatChance', () => {
  it('is the percentage down to one in a billion, and only "less than" below that', () => {
    expect(formatChance(0.0009137)).toBe('0.0914%');
    expect(formatChance(2e-9)).toBe('0.000000200%');
    expect(formatChance(1e-12)).toBe(BELOW_FLOOR);
    expect(formatChance((0.01 / 0.99) ** 15)).toBe(BELOW_FLOOR);
    expect(formatChance(0)).toBe(BELOW_FLOOR);
    expect(formatChance(-5.5e-17)).toBe(BELOW_FLOOR);
  });
});

describe('formatOneIn', () => {
  it('turns a small probability into the N of "one in N"', () => {
    expect(formatOneIn(0.0509779)).toBe('20');
    expect(formatOneIn(0.0009137)).toBe('1,094');
    expect(formatOneIn(0.001)).toBe('1,000');
    expect(formatOneIn(2e-9)).toBe('500,000,000');
  });
});

describe('oddsForm', () => {
  it('says how to put a probability into words', () => {
    expect(oddsForm(1)).toBe('certain');
    expect(oddsForm(0.9632124)).toBe('inHundred');
    expect(oddsForm(0.2045873)).toBe('inHundred');
    expect(oddsForm(0.1)).toBe('inHundred');
    expect(oddsForm(0.0509779)).toBe('oneIn');
    expect(oddsForm(0.0009137)).toBe('oneIn');
    expect(oddsForm(2e-9)).toBe('oneIn');
    expect(oddsForm(1e-12)).toBe('belowFloor');
    expect(oddsForm(0)).toBe('belowFloor');
    expect(oddsForm(-5.5e-17)).toBe('belowFloor');
  });
  it('never offers "one in N" where N would be a fraction of a single attempt', () => {
    // At 49% and five blocks the old wording read "1 in 1.0".
    for (let percent = 1; percent <= 49; percent++) {
      for (let z = 1; z <= 100; z++) {
        const p = P(percent / 100, z);
        if (oddsForm(p) === 'oneIn') expect(1 / p, `q=${percent}% z=${z}`).toBeGreaterThan(10);
      }
    }
  });
});

describe('formatInHundred', () => {
  it('gives the number of attempts in a hundred that succeed', () => {
    expect(formatInHundred(0.9632124)).toBe('96');
    expect(formatInHundred(0.2045873)).toBe('20');
    expect(formatInHundred(0.1)).toBe('10');
    expect(formatInHundred(0.6277491)).toBe('63');
  });
  it('does not round a chance below certainty up to 100 in 100', () => {
    expect(formatInHundred(0.9996)).toBe('99');
    expect(formatInHundred(1)).toBe('100');
  });
});

describe('exactValue', () => {
  it('prints seven decimals, as the paper does, while they say something', () => {
    expect(exactValue(1)).toEqual({ kind: 'decimal', text: '1.0000000' });
    expect(exactValue(0.0009137)).toEqual({ kind: 'decimal', text: '0.0009137' });
    expect(exactValue(P(0.1, 10))).toEqual({ kind: 'decimal', text: '0.0000012' });
    expect(exactValue(0.000001)).toEqual({ kind: 'decimal', text: '0.0000010' });
  });
  it('writes a power of ten, as the chart’s axis does, once seven decimals would be zeros', () => {
    expect(exactValue(2.937e-7)).toEqual({ kind: 'power', mantissa: '2.937', exponent: -7 });
    expect(exactValue(9.99e-7)).toEqual({ kind: 'power', mantissa: '9.990', exponent: -7 });
    expect(exactValue(1.5e-9)).toEqual({ kind: 'power', mantissa: '1.500', exponent: -9 });
    // Rounding the mantissa must carry into the exponent, never print 10.000 × 10ⁿ.
    expect(exactValue(9.99996e-8)).toEqual({ kind: 'power', mantissa: '1.000', exponent: -7 });
  });
  it('only says "below one in a billion" for what the formula cannot resolve', () => {
    expect(exactValue(1e-12)).toEqual({ kind: 'below', exponent: -9 });
    expect(exactValue(0)).toEqual({ kind: 'below', exponent: -9 });
    expect(exactValue(-5.5e-17)).toEqual({ kind: 'below', exponent: -9 });
  });
});

describe('tickStep', () => {
  it('puts four to eight numbers on the horizontal axis, the last of them at its end', () => {
    for (let zMax = 10; zMax <= 100; zMax += 10) {
      const step = tickStep(zMax);
      expect(zMax % step, `zMax=${zMax}`).toBe(0);
      const labels = zMax / step + 1;
      expect(labels, `zMax=${zMax}`).toBeGreaterThanOrEqual(4);
      expect(labels, `zMax=${zMax}`).toBeLessThanOrEqual(8);
    }
  });
  it('counts in twos, fives, tens, twenties or thirties', () => {
    expect([10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(tickStep)).toEqual([2, 5, 5, 10, 10, 10, 10, 20, 30, 20]);
  });
});

describe('countNoun', () => {
  it('uses the singular for exactly one', () => {
    expect(countNoun(1, '1 block', '{count} blocks')).toBe('1 block');
    expect(countNoun(0, '1 block', '{count} blocks')).toBe('0 blocks');
    expect(countNoun(5, '1 block', '{count} blocks')).toBe('5 blocks');
  });
  it('groups the digits of a large count', () => {
    expect(countNoun(1094, '1 block', '{count} blocks')).toBe('1,094 blocks');
    expect(countNoun(1094, '1 個區塊', '{count} 個區塊')).toBe('1,094 個區塊');
  });
});
