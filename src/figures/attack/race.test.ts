// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { catchUpProbability, simulateRace } from '@/lib/attack';
import { mulberry32 } from '@/lib/rng';
import { raceFrame, raceSeed, raceWindow, runRaces } from './race';

describe('raceFrame', () => {
  // The attacker starts 3 behind, then: attacker, honest, honest, attacker.
  const path = [3, 2, 3, 4, 3];

  it('starts with the honest chain z blocks long and the attacker’s empty', () => {
    expect(raceFrame(path, 0)).toEqual({ honest: 3, attacker: 0, gap: 3 });
  });
  it('adds one block to one chain per step, keeping their difference equal to the gap', () => {
    expect(raceFrame(path, 1)).toEqual({ honest: 3, attacker: 1, gap: 2 });
    expect(raceFrame(path, 2)).toEqual({ honest: 4, attacker: 1, gap: 3 });
    expect(raceFrame(path, 3)).toEqual({ honest: 5, attacker: 1, gap: 4 });
    expect(raceFrame(path, 4)).toEqual({ honest: 5, attacker: 2, gap: 3 });
  });
  it('stays on the last frame when asked for a step past the end', () => {
    expect(raceFrame(path, 99)).toEqual(raceFrame(path, 4));
  });
  it('agrees with every step of a real race', () => {
    const { path: real } = simulateRace(0.4, 4, mulberry32(5));
    let honest = 4;
    let attacker = 0;
    for (let step = 1; step < real.length; step++) {
      if (real[step] < real[step - 1]) attacker++;
      else honest++;
      expect(raceFrame(real, step)).toEqual({ honest, attacker, gap: real[step] });
    }
  });
});

describe('runRaces', () => {
  it('plays the engine’s race the given number of times from one generator', () => {
    const rng = mulberry32(11);
    let caughtUp = 0;
    for (let i = 0; i < 250; i++) if (simulateRace(0.35, 3, rng).caughtUp) caughtUp++;
    expect(runRaces(0.35, 3, 250, mulberry32(11))).toEqual({ races: 250, caughtUp });
  });
  it('replays exactly from the same seed and differs from another', () => {
    const run = (seed: number) => runRaces(0.4, 2, 1000, mulberry32(seed));
    expect(run(raceSeed(0))).toEqual(run(raceSeed(0)));
    expect(run(raceSeed(0))).not.toEqual(run(raceSeed(1)));
  });
  it('lands near the engine’s catchUpProbability, (q/p)^z, which is what it estimates', () => {
    const { races, caughtUp } = runRaces(0.3, 2, 20_000, mulberry32(1));
    expect(Math.abs(caughtUp / races - catchUpProbability(0.3, 2))).toBeLessThan(0.012);
  });
  it('counts nothing when asked for no races', () => {
    expect(runRaces(0.3, 2, 0, mulberry32(1))).toEqual({ races: 0, caughtUp: 0 });
  });
});

describe('raceWindow', () => {
  it('shows everything while both chains fit', () => {
    expect(raceWindow(6, 2, 20)).toEqual({ hidden: 0, honest: 6, attacker: 2 });
  });
  it('slides so the honest tip stays in view, hiding the same number of blocks from both rows', () => {
    expect(raceWindow(26, 22, 20)).toEqual({ hidden: 6, honest: 20, attacker: 16 });
  });
  it('shows an empty row when the attacker’s tip has fallen off the left edge', () => {
    expect(raceWindow(40, 5, 20)).toEqual({ hidden: 20, honest: 20, attacker: 0 });
  });
});

describe('raceSeed', () => {
  it('gives every race its own seed', () => {
    const seeds = Array.from({ length: 50 }, (_, n) => raceSeed(n));
    expect(new Set(seeds).size).toBe(50);
    expect(raceSeed(0)).toBe(raceSeed(0));
  });
});
