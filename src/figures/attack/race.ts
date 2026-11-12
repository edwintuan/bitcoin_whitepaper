/**
 * Helpers around the engine's `simulateRace` for the race scene: turning a
 * recorded walk into two chains to draw, and running many races.
 *
 * A race starts where the paper's q_z starts: the attacker exactly z blocks
 * behind. What many races estimate is the engine's `catchUpProbability`, not
 * the paper's P, which also weighs the blocks the attacker may have mined in
 * secret while the merchant waited.
 */
import { simulateRace } from '@/lib/attack';

/** Seeds count up from the date on the paper, 31 October 2008, so every race can be replayed. */
const FIRST_SEED = 20081031;

/** The seed of race number `n` (from 0) for `mulberry32`. */
export function raceSeed(n: number): number {
  return FIRST_SEED + n;
}

export interface RaceFrame {
  /** Blocks on the honest branch since the fork. */
  honest: number;
  /** Blocks on the attacker's branch since the fork. */
  attacker: number;
  gap: number;
}

/**
 * Both branches after `step` blocks of a race, from the walk `simulateRace`
 * recorded. The honest branch starts `path[0]` blocks long, the attacker's
 * empty; every step adds one block to one of them.
 */
export function raceFrame(path: readonly number[], step: number): RaceFrame {
  const at = Math.max(0, Math.min(step, path.length - 1));
  const gap = path[at];
  // honest − attacker = gap, and honest + attacker = starting lead + blocks found.
  const total = path[0] + at;
  return { honest: (total + gap) / 2, attacker: (total - gap) / 2, gap };
}

export interface Tally {
  races: number;
  caughtUp: number;
}

/** Plays `count` races, one after another, drawing from the same generator. */
export function runRaces(q: number, z: number, count: number, rng: () => number): Tally {
  let caughtUp = 0;
  for (let i = 0; i < count; i++) {
    if (simulateRace(q, z, rng).caughtUp) caughtUp++;
  }
  return { races: count, caughtUp };
}

export interface RaceWindow {
  /** Blocks cut off the left end of both rows. */
  hidden: number;
  /** Blocks of each branch left to draw. */
  honest: number;
  attacker: number;
}

/**
 * Which part of two long branches to draw in `capacity` slots: the stretch
 * that ends at the honest tip. Both rows lose the same blocks on the left, so
 * the distance between the two tips stays true to the gap.
 */
export function raceWindow(honest: number, attacker: number, capacity: number): RaceWindow {
  const hidden = Math.max(0, honest - capacity);
  return { hidden, honest: honest - hidden, attacker: Math.max(0, attacker - hidden) };
}
