import { describe, expect, it } from 'vitest';
import { placeAt } from './places';

describe('placeAt', () => {
  const tops = [100, 900, 1500, 4000];

  it('is nowhere above the first place', () => {
    expect(placeAt(tops, 99)).toBe(-1);
    expect(placeAt([], 500)).toBe(-1);
  });

  it('is the last place whose top the line has passed', () => {
    expect(placeAt(tops, 100)).toBe(0);
    expect(placeAt(tops, 899)).toBe(0);
    expect(placeAt(tops, 900)).toBe(1);
    expect(placeAt(tops, 3999)).toBe(2);
  });

  it('stays on the last place however far below it', () => {
    expect(placeAt(tops, 4000)).toBe(3);
    expect(placeAt(tops, 1e9)).toBe(3);
  });
});
