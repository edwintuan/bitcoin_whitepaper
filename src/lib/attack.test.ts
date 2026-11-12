// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { attackerSuccessProbability as P, catchUpProbability, giveUpGap, minConfirmations, simulateRace } from './attack';
import { mulberry32 } from './rng';

describe('attacker success probability (whitepaper section 11)', () => {
  it('reproduces the q = 0.1 table', () => {
    const want = [1.0, 0.2045873, 0.0509779, 0.0131722, 0.0034552, 0.0009137, 0.0002428, 0.0000647, 0.0000173, 0.0000046, 0.0000012];
    want.forEach((p, z) => expect(P(0.1, z)).toBeCloseTo(p, 7));
  });
  it('reproduces the q = 0.3 table', () => {
    const want: [number, number][] = [[0, 1.0], [5, 0.1773523], [10, 0.0416605], [15, 0.0101008], [20, 0.0024804], [25, 0.0006132], [30, 0.0001522], [35, 0.0000379], [40, 0.0000095], [45, 0.0000024], [50, 0.0000006]];
    want.forEach(([z, p]) => expect(P(0.3, z)).toBeCloseTo(p, 7));
  });
  it('reproduces the P < 0.1% table', () => {
    const want: [number, number][] = [[0.10, 5], [0.15, 8], [0.20, 11], [0.25, 15], [0.30, 24], [0.35, 41], [0.40, 89], [0.45, 340]];
    want.forEach(([q, z]) => expect(minConfirmations(q, 0.001)).toBe(z));
  });
  it('is certain when the attacker has the majority', () => {
    expect(P(0.5, 10)).toBe(1);
    expect(P(0.6, 100)).toBe(1);
  });
  it('agrees with a Monte Carlo race for small z', () => {
    const rng = mulberry32(7); let wins = 0; const runs = 20000;
    for (let i = 0; i < runs; i++) if (simulateRace(0.3, 2, rng).caughtUp) wins++;
    expect(wins / runs).toBeGreaterThan(0.15);
    expect(wins / runs).toBeLessThan(0.7);
  });

  it('is 1 with no confirmations, whatever the attacker has', () => {
    for (const q of [0, 0.01, 0.3, 0.49, 0.5, 1]) expect(P(q, 0)).toBe(1);
  });
  it('is 0 for an attacker with no hash power once there is a confirmation', () => {
    for (const z of [1, 2, 10, 100]) expect(P(0, z)).toBe(0);
  });
  it('falls with every extra confirmation', () => {
    for (const q of [0.05, 0.2, 0.3, 0.4, 0.45, 0.49]) {
      for (let z = 1; z <= 100 && P(q, z) > 1e-9; z++) {
        expect(P(q, z)).toBeLessThan(P(q, z - 1));
      }
    }
  });
  it('rises with the attacker\'s share of hash power', () => {
    // Each z starts at a share where P is still well above rounding error.
    for (const [z, firstPercent] of [[1, 2], [6, 10], [30, 30]]) {
      for (let percent = firstPercent; percent < 50; percent += 2) {
        expect(P(percent / 100, z)).toBeGreaterThan(P((percent - 2) / 100, z));
      }
    }
  });
  it('stays a probability, to within rounding, across the range the figure uses', () => {
    for (let percent = 1; percent <= 49; percent++) {
      for (let z = 0; z <= 100; z++) {
        const p = P(percent / 100, z);
        expect(p).toBeLessThanOrEqual(1);
        expect(p).toBeGreaterThan(-1e-12);
      }
    }
  });
});

describe('minConfirmations', () => {
  it('reads thresholds off the q = 0.1 table', () => {
    // P(0.1, z) is 1, 0.2045873, 0.0509779, 0.0131722, 0.0034552, 0.0009137, 0.0002428, 0.0000647, …
    expect(minConfirmations(0.1, 0.25)).toBe(1);
    expect(minConfirmations(0.1, 0.01)).toBe(4);
    expect(minConfirmations(0.1, 0.0001)).toBe(7);
  });
  it('returns the first z below the threshold, not a later one', () => {
    for (const [q, pMax] of [[0.05, 0.01], [0.22, 0.001], [0.33, 1e-6], [0.42, 0.05], [0.45, 0.01]]) {
      const z = minConfirmations(q, pMax);
      expect(P(q, z)).toBeLessThan(pMax);
      expect(P(q, z - 1)).toBeGreaterThanOrEqual(pMax);
    }
  });
  it('demands a strictly lower probability, so an exact tie is not enough', () => {
    const tie = P(0.3, 12);
    expect(minConfirmations(0.3, tie)).toBe(13);
  });
  it('needs no confirmations for a threshold above 1', () => {
    expect(minConfirmations(0.3, 1.5)).toBe(0);
    expect(minConfirmations(0.9, 1.5)).toBe(0);
    expect(minConfirmations(0.3, 1)).toBe(1);
  });
  it('needs one confirmation against an attacker with no hash power', () => {
    expect(minConfirmations(0, 0.001)).toBe(1);
  });
  it('is infinite against a majority attacker', () => {
    expect(minConfirmations(0.5, 0.001)).toBe(Number.POSITIVE_INFINITY);
    expect(minConfirmations(0.75, 0.999)).toBe(Number.POSITIVE_INFINITY);
    expect(minConfirmations(1, 0.5)).toBe(Number.POSITIVE_INFINITY);
  });
  it('is infinite for a threshold no probability can be under', () => {
    expect(minConfirmations(0.1, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(minConfirmations(0.1, -0.5)).toBe(Number.POSITIVE_INFINITY);
  });
  it('gives up with Infinity, instead of hanging, when the answer is out of reach of double precision', () => {
    expect(minConfirmations(0.49, 0.001)).toBe(Number.POSITIVE_INFINITY);
    expect(minConfirmations(0.499999, 0.5)).toBe(Number.POSITIVE_INFINITY);
    expect(minConfirmations(0.1, 1e-20)).toBe(Number.POSITIVE_INFINITY);
    expect(minConfirmations(0.000001, 1e-300)).toBe(Number.POSITIVE_INFINITY);
  });
  it('still answers at q = 0.4675 and gives up just above', () => {
    expect(minConfirmations(0.4675, 0.001)).toBe(789);
    expect(minConfirmations(0.468, 0.001)).toBe(Number.POSITIVE_INFINITY);
  });
  it('is infinite for inputs that are not numbers in range', () => {
    expect(minConfirmations(Number.NaN, 0.001)).toBe(Number.POSITIVE_INFINITY);
    expect(minConfirmations(0.1, Number.NaN)).toBe(Number.POSITIVE_INFINITY);
    expect(minConfirmations(-0.1, 0.001)).toBe(Number.POSITIVE_INFINITY);
    expect(minConfirmations(1.5, 0.001)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('simulateRace', () => {
  const always = (x: number) => () => x;
  const script = (...draws: number[]) => {
    let i = 0;
    return () => draws[i++ % draws.length];
  };

  it('has already caught up when it starts level', () => {
    expect(simulateRace(0.3, 0, always(0.99))).toEqual({ caughtUp: true, steps: 0, path: [0] });
  });
  it('closes the gap by one block each time the draw falls below q', () => {
    expect(simulateRace(0.3, 3, always(0))).toEqual({ caughtUp: true, steps: 3, path: [3, 2, 1, 0] });
    expect(simulateRace(0.3, 1, always(0.2999))).toEqual({ caughtUp: true, steps: 1, path: [1, 0] });
  });
  it('falls a block further behind on every other draw', () => {
    // attacker, honest, honest, attacker, attacker, attacker
    const result = simulateRace(0.3, 2, script(0.1, 0.9, 0.3, 0.29, 0, 0.1));
    expect(result).toEqual({ caughtUp: true, steps: 6, path: [2, 1, 2, 3, 2, 1, 0] });
  });
  it('gives up once it trails so far that getting back to the start is a one-in-a-thousand shot', () => {
    // (0.3 / 0.7)^n first drops below 0.001 at n = 9.
    expect((0.3 / 0.7) ** 8).toBeGreaterThan(0.001);
    expect((0.3 / 0.7) ** 9).toBeLessThan(0.001);
    const result = simulateRace(0.3, 2, always(0.99));
    expect(result.caughtUp).toBe(false);
    expect(result.steps).toBe(9);
    expect(result.path).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
  it('gives up after a single block when it has no hash power', () => {
    expect(simulateRace(0, 4, always(0))).toEqual({ caughtUp: false, steps: 1, path: [4, 5] });
  });
  it('stops at maxSteps when neither side pulls away', () => {
    const result = simulateRace(0.5, 2, script(0.1, 0.9), 10);
    expect(result.caughtUp).toBe(false);
    expect(result.steps).toBe(10);
    expect(result.path).toEqual([2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2]);
  });
  it('keeps a majority attacker racing however far it falls behind, until maxSteps', () => {
    const result = simulateRace(0.6, 2, () => 0.99, 500);
    expect(result.steps).toBe(500);
    expect(result.path[500]).toBe(502);
    expect(simulateRace(0.5, 2, () => 0.99, 500).steps).toBe(500);
  });
  it('never gives up early when the attacker has the majority', () => {
    const rng = mulberry32(11);
    for (let i = 0; i < 200; i++) expect(simulateRace(0.7, 5, rng).caughtUp).toBe(true);
  });
  it('draws exactly one random number per block', () => {
    let draws = 0;
    const seeded = mulberry32(3);
    const result = simulateRace(0.4, 6, () => { draws++; return seeded(); });
    expect(draws).toBe(result.steps);
  });
  it('records a path that moves one block at a time and ends at 0 only on success', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 300; i++) {
      const { caughtUp, steps, path } = simulateRace(0.4, 4, rng);
      expect(path[0]).toBe(4);
      expect(path).toHaveLength(steps + 1);
      for (let j = 1; j < path.length; j++) expect(Math.abs(path[j] - path[j - 1])).toBe(1);
      expect(path[path.length - 1] === 0).toBe(caughtUp);
      expect(path.slice(0, -1).every((gap) => gap > 0)).toBe(true);
    }
  });
  it('replays identically from the same seed', () => {
    const run = () => { const rng = mulberry32(2024); return Array.from({ length: 50 }, () => simulateRace(0.35, 3, rng)); };
    expect(run()).toEqual(run());
  });
  it('catches up about (q/p)^z of the time: the pure catch-up odds, without the Poisson term of P', () => {
    const estimate = (q: number, z: number, seed: number) => {
      const rng = mulberry32(seed);
      let wins = 0;
      for (let i = 0; i < 20_000; i++) if (simulateRace(q, z, rng).caughtUp) wins++;
      return wins / 20_000;
    };
    expect(Math.abs(estimate(0.3, 2, 1) - (0.3 / 0.7) ** 2)).toBeLessThan(0.012);
    expect(Math.abs(estimate(0.45, 3, 2) - (0.45 / 0.55) ** 3)).toBeLessThan(0.015);
    expect(Math.abs(estimate(0.1, 1, 3) - 0.1 / 0.9)).toBeLessThan(0.01);
  });
});

describe('catchUpProbability: the paper\'s q_z', () => {
  it('is (q/p)^z below half the hash power', () => {
    expect(catchUpProbability(0.1, 1)).toBeCloseTo(1 / 9, 15);
    expect(catchUpProbability(0.3, 2)).toBeCloseTo((0.3 / 0.7) ** 2, 15);
    expect(catchUpProbability(0.25, 6)).toBeCloseTo((1 / 3) ** 6, 15);
  });
  it('is certain from half the hash power upward, and when there is nothing to catch up', () => {
    expect(catchUpProbability(0.5, 40)).toBe(1);
    expect(catchUpProbability(0.8, 3)).toBe(1);
    expect(catchUpProbability(0.2, 0)).toBe(1);
  });
  it('is 0 for an attacker with no hash power who is behind', () => {
    expect(catchUpProbability(0, 1)).toBe(0);
  });
  it('is what the paper\'s P is built from: P(q, z) is the Poisson-weighted mix of q_(z-k)', () => {
    const q = 0.2;
    const z = 6;
    const lambda = (z * q) / (1 - q);
    let mix = 0;
    let poisson = Math.exp(-lambda);
    for (let k = 0; k <= 200; k++) {
      if (k > 0) poisson *= lambda / k;
      mix += poisson * (k <= z ? catchUpProbability(q, z - k) : 1);
    }
    expect(mix).toBeCloseTo(P(q, z), 12);
  });
});

describe('giveUpGap: where a losing attacker abandons the race', () => {
  it('is the gap at which simulateRace stops when the honest side finds every block', () => {
    for (const [q, z] of [[0.1, 1], [0.3, 4], [0.45, 10], [0.01, 3], [0, 2]] as const) {
      const { path, caughtUp } = simulateRace(q, z, () => 0.999999, 10_000);
      expect(caughtUp).toBe(false);
      expect(giveUpGap(q, z)).toBe(path[path.length - 1]);
    }
  });
  it('lies beyond the start by the number of blocks that make regaining it a one-in-a-thousand shot', () => {
    // (0.3/0.7)^8 is 0.0011, (0.3/0.7)^9 is 0.0005: nine more blocks behind is the first gap past the threshold.
    expect(giveUpGap(0.3, 4)).toBe(4 + 9);
    expect(giveUpGap(0, 2)).toBe(3);
  });
  it('is never reached by an attacker with half the hash power or more', () => {
    expect(giveUpGap(0.5, 3)).toBe(Number.POSITIVE_INFINITY);
    expect(giveUpGap(0.9, 3)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('arguments', () => {
  const rng = () => 0.5;
  const calls: [name: string, call: (q: number, z: number) => unknown][] = [
    ['attackerSuccessProbability', (q, z) => P(q, z)],
    ['catchUpProbability', (q, z) => catchUpProbability(q, z)],
    ['giveUpGap', (q, z) => giveUpGap(q, z)],
    ['simulateRace', (q, z) => simulateRace(q, z, rng, 10)],
  ];
  it.each(calls)('%s rejects a share of hash power outside 0 to 1', (_name, call) => {
    for (const q of [-0.1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => call(q, 3)).toThrow(RangeError);
  });
  it.each(calls)('%s rejects a number of blocks that is negative or not whole', (_name, call) => {
    for (const z of [-1, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => call(0.3, z)).toThrow(RangeError);
  });
  it.each(calls)('%s accepts the ends of the range', (_name, call) => {
    expect(() => call(0, 0)).not.toThrow();
    expect(() => call(1, 0)).not.toThrow();
  });
});
