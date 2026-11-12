/**
 * Numbers behind the calculator's chart. Every probability comes from the
 * engine's port of the paper's function; this module only decides what part
 * of it to show and how to write it down.
 *
 * `z` is the paper's z throughout: blocks linked after the block that holds
 * the payment. That block is itself the first confirmation, so z blocks on
 * top are z + 1 confirmations.
 */
import { attackerSuccessProbability, minConfirmations } from '@/lib/attack';
import { fill, formatCount } from '@/text/format';

/** The lowest probability the chart draws: one in a billion. Far above the formula's rounding error of about 1e-15. */
export const FLOOR = 1e-9;

/** The paper's own yardstick: "Solving for P less than 0.1%". */
export const THRESHOLD = 0.001;

/** Factors of ten between certainty and the floor. */
export const DECADES = 9;

const LOG_FLOOR = Math.log10(FLOOR);

/**
 * How far the horizontal axis should run for this share of hash power: to the
 * first multiple of ten past the point where the curve drops under the floor,
 * and never past 100 blocks.
 */
export function zRange(q: number): number {
  let z = 0;
  while (z < 100 && attackerSuccessProbability(q, z) >= FLOOR) z++;
  return Math.min(100, Math.max(10, Math.ceil(z / 10) * 10));
}

/** P for z = 0 … zMax. */
export function curve(q: number, zMax: number): number[] {
  return Array.from({ length: zMax + 1 }, (_, z) => attackerSuccessProbability(q, z));
}

/**
 * Where a probability sits on the logarithmic axis: 0 at the top (certainty),
 * 1 at the bottom (the floor). Anything the formula cannot resolve (values
 * under the floor, zero, the slightly negative results of rounding) is
 * clamped to the bottom.
 */
export function logPosition(p: number): number {
  if (!(p > FLOOR)) return 1;
  if (p >= 1) return 0;
  return Math.log10(p) / LOG_FLOOR;
}

export interface CurvePoint {
  /** Whole for a computed value; fractional only for the point where the line leaves the chart. */
  z: number;
  /** 0 … 1, as {@link logPosition}. */
  at: number;
}

/**
 * The line to draw: one point per z while the value is above the floor, then
 * one last point on the bottom edge, placed where the straight line to the
 * next value crosses it.
 */
export function curvePoints(values: readonly number[]): CurvePoint[] {
  const points: CurvePoint[] = [];
  for (let z = 0; z < values.length; z++) {
    if (values[z] > FLOOR) {
      points.push({ z, at: logPosition(values[z]) });
      continue;
    }
    if (z > 0) {
      const above = Math.log10(values[z - 1]);
      // Rounding noise can be zero or negative; any value far below the floor gives a near-vertical exit.
      const below = Math.log10(Math.max(values[z], 1e-16));
      points.push({ z: z - 1 + (above - LOG_FLOOR) / (above - below), at: 1 });
    }
    break;
  }
  return points;
}

const waits = new Map<number, number>();

/**
 * The paper's last table for any share: the smallest z with P below 0.1%.
 * `Infinity` where no such z can be computed (see `minConfirmations`). The
 * search can take tens of milliseconds near q = 0.47, so answers are kept.
 */
export function blocksToWait(q: number): number {
  let z = waits.get(q);
  if (z === undefined) {
    z = minConfirmations(q, THRESHOLD);
    waits.set(q, z);
  }
  return z;
}

/** A probability as a percentage with three significant figures and no exponent: 0.0009137 → "0.0914%". */
export function formatPercent(p: number): string {
  if (!(p > 0)) return '0%';
  if (p >= 1) return '100%';
  const percent = p * 100;
  const digits = Math.min(12, Math.max(0, 2 - Math.floor(Math.log10(percent))));
  const text = percent.toFixed(digits);
  // 99.996 would print as 100.0: it is not certainty, so do not say so.
  return Number(text) >= 100 ? '99.9%' : `${text}%`;
}

/** What to print in place of a percentage once it is under the chart's floor. */
export const BELOW_FLOOR = '< 0.0000001%';

/** {@link formatPercent}, except that anything under one in a billion is only said to be under it. */
export function formatChance(p: number): string {
  return p > FLOOR ? formatPercent(p) : BELOW_FLOOR;
}

/** How a probability is best put into words. */
export type OddsForm = 'certain' | 'inHundred' | 'oneIn' | 'belowFloor';

/**
 * "1 in N" reads well for a rare event and badly for a likely one (it comes
 * out as "1 in 1.0"), so from one chance in ten upwards the odds are given as
 * so many in a hundred.
 */
export function oddsForm(p: number): OddsForm {
  if (!(p > FLOOR)) return 'belowFloor';
  if (p >= 1) return 'certain';
  return p >= 0.1 ? 'inHundred' : 'oneIn';
}

/** The N of "one in N", for a chance below one in ten: 0.0009137 → "1,094". */
export function formatOneIn(p: number): string {
  return formatCount(Math.round(1 / p));
}

/** The N of "N in 100": 0.2045873 → "20". Never 100 for a chance short of certainty. */
export function formatInHundred(p: number): string {
  return p >= 1 ? '100' : String(Math.min(99, Math.round(p * 100)));
}

/** A probability written out in full: as a decimal, as a power of ten, or only as being under the floor. */
export type Exact =
  | { kind: 'decimal'; text: string }
  | { kind: 'power'; mantissa: string; exponent: number }
  | { kind: 'below'; exponent: number };

/**
 * The value behind the percentage. The paper prints seven decimals; once those
 * would all be zeros the value is given as a power of ten, the way the chart's
 * axis is labelled, and under the chart's floor only as lying below it.
 */
export function exactValue(p: number): Exact {
  if (!(p > FLOOR)) return { kind: 'below', exponent: Math.round(LOG_FLOOR) };
  if (p >= 1e-6) return { kind: 'decimal', text: p.toFixed(7) };
  // toExponential carries a mantissa that rounds up to ten into the exponent.
  const [mantissa, exponent] = p.toExponential(3).split('e');
  return { kind: 'power', mantissa, exponent: Number(exponent) };
}

/**
 * Spacing of the numbers along the horizontal axis, which ends on a multiple
 * of ten: four to eight of them, the last at the end of the axis.
 */
export function tickStep(zMax: number): number {
  return [2, 5, 10, 20, 30, 50].find((step) => zMax % step === 0 && zMax / step <= 7) ?? zMax;
}

/** A count with its noun, singular for exactly one: `countNoun(1, '1 block', '{count} blocks')`. */
export function countNoun(count: number, one: string, many: string): string {
  return count === 1 ? one : fill(many, { count: formatCount(count) });
}
