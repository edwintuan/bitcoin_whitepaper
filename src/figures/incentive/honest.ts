/**
 * The arithmetic of the paper's last paragraph on incentive: what a miner
 * with a given share of the hash power earns, on average, by following the
 * rules. Nothing here is an estimate of the market; it is the subsidy
 * schedule and a division.
 */
import { catchUpProbability } from '@/lib/attack';
import { blockSubsidy } from '@/lib/subsidy';

/**
 * Blocks in an average day. The difficulty aims for one block every ten
 * minutes (`nPowTargetSpacing = 10 * 60`, Bitcoin Core v32.1,
 * src/kernel/chainparams.cpp:128): 24 × 6 = 144.
 */
export const BLOCKS_PER_DAY = 144;

function assertShare(sharePercent: number): void {
  if (!Number.isInteger(sharePercent) || sharePercent < 0 || sharePercent > 100) {
    throw new RangeError(`share must be a whole percentage from 0 to 100, got ${sharePercent}`);
  }
}

/** The blocks a miner with `sharePercent` of the hash power finds in an average day. */
export function blocksPerDay(sharePercent: number): number {
  assertShare(sharePercent);
  return (BLOCKS_PER_DAY * sharePercent) / 100;
}

/**
 * The new coins those blocks create, in satoshis, at the subsidy of `height`.
 * Fees come on top and are not counted.
 *
 * An average may have a fraction of a satoshi; it is rounded to the nearest
 * one, so that a share and the rest of the network always add up to the whole
 * day's coins. (A fraction of exactly one half cannot occur: 144 is a multiple
 * of four and 50 is not.)
 */
export function coinsPerDay(sharePercent: number, height: number): bigint {
  assertShare(sharePercent);
  return (blockSubsidy(height) * BigInt(BLOCKS_PER_DAY) * BigInt(sharePercent) + 50n) / 100n;
}

/** Whether the rules pay this share more new coins than all the other miners together: only above half. */
export function outearnsTheRest(sharePercent: number): boolean {
  assertShare(sharePercent);
  return sharePercent > 100 - sharePercent;
}

/**
 * Whether an attacker with this share is certain to catch up with the honest
 * chain in the end, however far behind it starts. The paper's section 11
 * gives that probability as 1 when p ≤ q, so exactly half is enough.
 */
export function surelyCatchesUp(sharePercent: number): boolean {
  assertShare(sharePercent);
  return catchUpProbability(sharePercent / 100, 1) === 1;
}
