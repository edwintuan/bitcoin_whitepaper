// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mulberry32 } from '@/lib/rng';
import { BRANCH_LIMIT, START, buildingOn, grow } from './branches';
import type { Branches } from './branches';

/** Every state from the start until the picture starts over, for one seed. */
function run(seed: number): Branches[] {
  const random = mulberry32(seed);
  const states = [START];
  for (let i = 0; i < 20; i++) {
    const next = grow(states[states.length - 1], random);
    if (next === START) break;
    states.push(next);
  }
  return states;
}

describe('two branches from one block', () => {
  it('start level, with nodes building on both: each stays on the one it had first', () => {
    expect(START).toEqual({ upper: 1, lower: 1 });
    expect(buildingOn(START)).toEqual(['upper', 'lower']);
  });

  it('take the next block on either branch while they are level, with even odds', () => {
    const random = mulberry32(7);
    let upper = 0;
    for (let i = 0; i < 400; i++) upper += grow(START, random).upper === 2 ? 1 : 0;
    expect(upper).toBeGreaterThan(160);
    expect(upper).toBeLessThan(240);
  });

  it('have every node build on the longer one as soon as one is longer', () => {
    expect(buildingOn({ upper: 2, lower: 1 })).toEqual(['upper']);
    expect(buildingOn({ upper: 1, lower: 4 })).toEqual(['lower']);
  });

  it('grow only where nodes are building: the shorter branch never gets another block', () => {
    for (let seed = 0; seed < 60; seed++) {
      const states = run(seed);
      for (let i = 1; i < states.length; i++) {
        const [before, after] = [states[i - 1], states[i]];
        const grew = after.upper > before.upper ? 'upper' : 'lower';
        expect(after.upper + after.lower, `seed ${seed}`).toBe(before.upper + before.lower + 1);
        expect(buildingOn(before), `seed ${seed}`).toContain(grew);
      }
      // After the tie was broken the loser stayed at one block.
      const last = states[states.length - 1];
      expect(Math.min(last.upper, last.lower), `seed ${seed}`).toBe(1);
      expect(Math.max(last.upper, last.lower), `seed ${seed}`).toBe(BRANCH_LIMIT);
    }
  });

  it('start over once the longer branch is as long as the picture has room for', () => {
    const random = mulberry32(1);
    expect(grow({ upper: BRANCH_LIMIT, lower: 1 }, random)).toBe(START);
    expect(grow({ upper: 1, lower: BRANCH_LIMIT }, random)).toBe(START);
  });
});
