// @vitest-environment node
import { describe, expect, it } from 'vitest';
import attackSource from '@/lib/attack.ts?raw';
import { attackerSuccessProbability as P } from '@/lib/attack';
import { formatValue, poisson, portSource, tallest, traceAttack } from './trace';

describe('traceAttack', () => {
  it('ends on exactly the number the engine returns: same operations in the same order', () => {
    for (const q of [0.01, 0.1, 0.25, 0.3, 0.45, 0.49]) {
      for (const z of [0, 1, 2, 5, 10, 24, 50, 100]) {
        expect(Object.is(traceAttack(q, z).result, P(q, z)), `q=${q} z=${z}`).toBe(true);
      }
    }
  });

  it('records the paper’s variables before the loop starts', () => {
    const trace = traceAttack(0.1, 5);
    expect(trace.p).toBe(0.9);
    expect(trace.ratio).toBe(0.1 / 0.9);
    expect(trace.lambda).toBe(5 * (0.1 / 0.9));
    expect(trace.lambda).toBeCloseTo(0.5555556, 7);
  });

  it('has one row per pass of the outer loop, k = 0 … z', () => {
    const { rows } = traceAttack(0.1, 5);
    expect(rows.map((row) => row.k)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('shows the sum falling from 1 to the answer, one pass at a time', () => {
    const { rows, result } = traceAttack(0.1, 5);
    let previous = 1;
    for (const row of rows) {
      // sum -= poisson * (1 - pow(q / p, z - k))
      expect(row.sum).toBe(previous - row.poisson * (1 - row.catchUp));
      expect(row.sum).toBeLessThanOrEqual(previous);
      previous = row.sum;
    }
    expect(rows[5].sum).toBe(result);
    expect(result.toFixed(7)).toBe('0.0009137');
  });

  it('gives each pass the Poisson weight of k blocks and the chance of catching up from z − k behind', () => {
    const { rows, lambda, ratio } = traceAttack(0.3, 4);
    rows.forEach((row) => {
      expect(row.poisson).toBe(poisson(lambda, row.k));
      expect(row.catchUp).toBe(Math.pow(ratio, 4 - row.k));
    });
    // Level with the honest chain already: catching up is certain, so the last pass subtracts nothing.
    expect(rows[4].catchUp).toBe(1);
    expect(rows[4].sum).toBe(rows[3].sum);
  });

  it('is a single pass that changes nothing when z is 0', () => {
    const trace = traceAttack(0.2, 0);
    expect(trace.lambda).toBe(0);
    expect(trace.rows).toEqual([{ k: 0, poisson: 1, catchUp: 1, sum: 1 }]);
    expect(trace.result).toBe(1);
  });
});

describe('poisson', () => {
  it('is λ^k e^−λ / k!, built up the way the paper’s inner loop does', () => {
    expect(poisson(2, 0)).toBe(Math.exp(-2));
    expect(poisson(2, 1)).toBeCloseTo(2 * Math.exp(-2), 15);
    expect(poisson(2, 3)).toBeCloseTo((8 / 6) * Math.exp(-2), 15);
    expect(poisson(0, 0)).toBe(1);
    expect(poisson(0, 3)).toBe(0);
  });
  it('adds up to 1 over all k', () => {
    for (const lambda of [0.5, 1, 2.5, 6]) {
      let total = 0;
      for (let k = 0; k < 60; k++) total += poisson(lambda, k);
      expect(total).toBeCloseTo(1, 12);
    }
  });
  it('peaks near the mean', () => {
    const at = (k: number) => poisson(4, k);
    expect(at(4)).toBeGreaterThan(at(1));
    expect(at(4)).toBeGreaterThan(at(8));
    expect(at(3)).toBeCloseTo(at(4), 12);
  });
});

describe('portSource', () => {
  const { code: port, startLine } = portSource(attackSource);
  const lines = port.split('\n');

  it('cuts the port of the paper’s function out of the engine’s own file', () => {
    expect(lines[0]).toBe('export function attackerSuccessProbability(q: number, z: number): number {');
    expect(lines[lines.length - 1]).toBe('}');
    expect(port).not.toContain('minConfirmations');
    expect(attackSource.split('\n')[startLine - 1]).toBe(lines[0]);
  });

  it('keeps the lines that mirror the paper', () => {
    for (const line of [
      '  const p = 1.0 - q;',
      '  const lambda = z * (q / p);',
      '  let sum = 1.0;',
      '  for (k = 0; k <= z; k++) {',
      '    let poisson = Math.exp(-lambda);',
      '    for (i = 1; i <= k; i++)',
      '      poisson *= lambda / i;',
      '    sum -= poisson * (1 - Math.pow(q / p, z - k));',
      '  return sum;',
    ]) {
      expect(lines, line).toContain(line);
    }
  });

  it('fails loudly if the function is ever renamed or moved', () => {
    expect(() => portSource('export const nothing = 1;\n')).toThrow();
  });
});

describe('formatValue', () => {
  it('prints a variable to seven significant figures, without trailing zeros', () => {
    expect(formatValue(0.9)).toBe('0.9');
    expect(formatValue(0.1 / 0.9)).toBe('0.1111111');
    expect(formatValue(5 * (0.1 / 0.9))).toBe('0.5555556');
    expect(formatValue(traceAttack(0.1, 5).result)).toBe('0.0009136822');
    expect(formatValue(1)).toBe('1');
    expect(formatValue(0)).toBe('0');
  });
  it('keeps an exponent only where a plain decimal would be mostly zeros', () => {
    expect(formatValue(0.00001)).toBe('0.00001');
    expect(formatValue(0.0000012345678)).toBe('1.2346e−6');
    expect(formatValue(3.2e-12)).toBe('3.2000e−12');
  });
  it('writes a true minus sign', () => {
    expect(formatValue(-5.5e-17)).toBe('−5.5000e−17');
    expect(formatValue(-0.25)).toBe('−0.25');
  });
});

describe('tallest', () => {
  const bars = (mean: number) => Array.from({ length: 11 }, (_, k) => poisson(mean, k));

  it('finds the one most likely count when the average is not a whole number', () => {
    expect(tallest(bars(0.5))).toEqual([0]);
    expect(tallest(bars(2.5))).toEqual([2]);
    expect(tallest(bars(5.5))).toEqual([5]);
  });

  it('finds both when the average is a whole number: k = λ − 1 and k = λ are equally likely', () => {
    expect(tallest(bars(1))).toEqual([0, 1]);
    expect(tallest(bars(2))).toEqual([1, 2]);
    expect(tallest(bars(6))).toEqual([5, 6]);
  });

  it('does not take a bar that is merely close for an equal one', () => {
    expect(tallest([0.2, 0.27, 0.2699, 0.1])).toEqual([1]);
    expect(tallest([])).toEqual([]);
  });
});
