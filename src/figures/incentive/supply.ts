/**
 * The issuance schedule as the supply scene needs it: eras, the jumps between
 * halvings, and the points of the two charts. Every amount comes from
 * `src/lib/subsidy.ts` and stays a bigint number of satoshis.
 */
import { HALVING_INTERVAL, MAX_SUPPLY, blockSubsidy, halvingsAt, supplyAt } from '@/lib/subsidy';

/** The right-hand end of the height control and of both charts. */
export const MAX_HEIGHT = 7_000_000;

/** The first height whose subsidy is zero, found by asking the engine. */
export const SUBSIDY_END = (() => {
  let height = 0;
  while (blockSubsidy(height) > 0n) height += HALVING_INTERVAL;
  return height;
})();

/** How many halvings it takes for the subsidy to reach zero. */
export const HALVINGS = SUBSIDY_END / HALVING_INTERVAL;

/** The last block that issues anything. */
export const LAST_PAYING_BLOCK = SUBSIDY_END - 1;

/** A stretch of blocks that all carry the same subsidy. */
export interface Era {
  /** Halvings that have taken effect: 0 for the first 210,000 blocks. */
  halvings: number;
  /** Its first block. */
  start: number;
  /** Its last block; `null` for the final era, which never ends. */
  end: number | null;
  /** New coins per block, in satoshis. */
  subsidy: bigint;
}

/** The era a block belongs to. Everything from {@link SUBSIDY_END} on is one last era of zero. */
export function eraAt(height: number): Era {
  const halvings = Math.min(halvingsAt(height), HALVINGS);
  const start = halvings * HALVING_INTERVAL;
  return {
    halvings,
    start,
    end: halvings < HALVINGS ? start + HALVING_INTERVAL - 1 : null,
    subsidy: blockSubsidy(start),
  };
}

/** The first block of the next era, or `null` once the subsidy is zero. */
export function nextHalving(height: number): number | null {
  const next = (Math.floor(height / HALVING_INTERVAL) + 1) * HALVING_INTERVAL;
  return next <= SUBSIDY_END ? next : null;
}

/**
 * The nearest era start below `height`: the start of this era from inside
 * it, of the era before from its first block. `null` at block 0.
 */
export function previousHalving(height: number): number | null {
  if (height <= 0) return null;
  return Math.min(Math.floor((height - 1) / HALVING_INTERVAL) * HALVING_INTERVAL, SUBSIDY_END);
}

/** A whole height within the range of the control. */
export function clampHeight(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_HEIGHT, Math.round(value)));
}

/**
 * How much of the eventual total exists once the block at `height` is mined,
 * in per cent with two decimals. The figure is cut off, not rounded, so it
 * reads `100` only when the last satoshi has been issued.
 */
export function shareOfLimit(height: number): string {
  const supply = supplyAt(height);
  if (supply === MAX_SUPPLY) return '100';
  const hundredths = (supply * 10_000n) / MAX_SUPPLY;
  return `${hundredths / 100n}.${(hundredths % 100n).toString().padStart(2, '0')}`;
}

/** The subsidy chart: one flat step per era, the last one running to the end of the range. */
export function stairs(): { from: number; to: number; subsidy: bigint }[] {
  const steps = [];
  for (let from = 0; from <= SUBSIDY_END; from += HALVING_INTERVAL) {
    steps.push({ from, to: from < SUBSIDY_END ? from + HALVING_INTERVAL : MAX_HEIGHT, subsidy: blockSubsidy(from) });
  }
  return steps;
}

/**
 * The supply chart: what the blocks below each height have issued. Within an
 * era the supply grows in a straight line, so one point per halving (and one
 * at each end of the range) draws the curve exactly.
 */
export function supplyCurve(): { height: number; supply: bigint }[] {
  const points = [{ height: 0, supply: 0n }];
  for (let height = HALVING_INTERVAL; height <= SUBSIDY_END; height += HALVING_INTERVAL) {
    points.push({ height, supply: supplyAt(height - 1) });
  }
  points.push({ height: MAX_HEIGHT, supply: supplyAt(MAX_HEIGHT - 1) });
  return points;
}

/** An amount in satoshis with its digits grouped. Exact for any size. */
export function satsText(sats: bigint): string {
  return sats.toLocaleString('en-US');
}
