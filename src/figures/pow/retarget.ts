import { TARGET_TIMESPAN, nextTarget } from '@/lib/difficulty';
import { bitsToTarget } from '@/lib/header';

/** The easiest target the network allows, and an arbitrary starting point well below it. */
const LIMIT = bitsToTarget(0x1d00ffff);
const START = bitsToTarget(0x1b0404cb);

/** Hash power against the level the difficulty expects: three doublings either way. */
export const POWERS = [0.125, 0.25, 0.5, 1, 2, 4, 8];

const ratio = (a: bigint, b: bigint) => Number((a * 1_000_000n) / b) / 1_000_000;

export interface Period {
  number: number;
  /** Average minutes per block during this period. */
  minutes: number;
  /** Days the period's 2,016 blocks take. */
  days: number;
  /** What the difficulty is multiplied by at the end of the period. */
  factor: number;
}

/**
 * Hash power changes by `power` once, at the start. This is what the next
 * `count` periods look like under the real rule (`nextTarget` in the engine),
 * including its limit of a factor of four per adjustment.
 */
export function retargetRun(power: number, count = 4): Period[] {
  const periods: Period[] = [];
  let target = START;
  for (let k = 0; k < count; k++) {
    const difficulty = ratio(START, target);
    const actual = Math.round((TARGET_TIMESPAN * difficulty) / power);
    const next = nextTarget(target, actual, LIMIT);
    periods.push({
      number: k + 1,
      minutes: (10 * difficulty) / power,
      days: (14 * difficulty) / power,
      factor: ratio(target, next),
    });
    target = next;
  }
  return periods;
}

/** Where a block time sits on a scale of three doublings either side of ten minutes: −1 (fast) to 1 (slow). */
export function scalePosition(minutes: number): number {
  return Math.max(-3, Math.min(3, Math.log2(minutes / 10))) / 3;
}

/** A number to at most `digits` decimals, without zeros after the point: 2.50 → "2.5", 10 → "10". */
export function trim(value: number, digits: number): string {
  const text = value.toFixed(digits);
  return text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;
}
