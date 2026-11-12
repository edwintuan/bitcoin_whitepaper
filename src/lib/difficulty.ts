import { bitsToTarget } from './header';

/** How long 2016 blocks are meant to take: 14 days, in seconds (Bitcoin Core v32.1, src/kernel/chainparams.cpp:127). */
export const TARGET_TIMESPAN = 14 * 24 * 60 * 60;

/** The intended gap between blocks: 600 seconds (src/kernel/chainparams.cpp:128). */
export const TARGET_SPACING = 10 * 60;

/** Blocks between two difficulty adjustments: 2016 (src/consensus/params.h:130). */
export const RETARGET_INTERVAL = TARGET_TIMESPAN / TARGET_SPACING;

/** The target that counts as difficulty 1: compact bits `0x1d00ffff`. */
const DIFFICULTY_1_TARGET = bitsToTarget(0x1d00ffff);

/**
 * The retarget rule, a port of `CalculateNextWorkRequired` (Bitcoin Core
 * v32.1, src/pow.cpp:50-85): scale the previous target by how long the last
 * period really took compared with two weeks. Blocks that came too fast give
 * a smaller target (harder); too slow, a larger one (easier).
 *
 * The measured time is first clamped to between a quarter of and four times
 * `TARGET_TIMESPAN`, so one adjustment changes the target by at most a factor
 * of four either way, and the result never exceeds `limit`, the easiest target
 * the network allows.
 *
 * Works on full-precision targets. Bitcoin Core starts from, and stores, the
 * compact form; to reproduce a real retarget pass `bitsToTarget(bits)` in and
 * put the result through `targetToBits`.
 *
 * @param prev target in force during the period that just ended
 * @param actualTimespan seconds the period took (time of its last block minus
 * time of its first); fractions of a second are dropped
 * @param limit the proof-of-work limit; mainnet's is `2^224 − 1`
 * @throws RangeError if `actualTimespan` is NaN.
 */
export function nextTarget(prev: bigint, actualTimespan: number, limit: bigint): bigint {
  if (Number.isNaN(actualTimespan)) {
    throw new RangeError('actualTimespan must be a number of seconds, got NaN');
  }
  const clamped = Math.min(Math.max(actualTimespan, TARGET_TIMESPAN / 4), TARGET_TIMESPAN * 4);
  const next = (prev * BigInt(Math.trunc(clamped))) / BigInt(TARGET_TIMESPAN);
  return next > limit ? limit : next;
}

/**
 * Difficulty as block explorers quote it: how many times harder `target` is to
 * meet than the difficulty-1 target `0x1d00ffff`. The toy targets the figures
 * mine against are far easier than that, so they come out well below 1. A
 * target of zero gives `Infinity`.
 */
export function difficultyOf(target: bigint): number {
  return Number(DIFFICULTY_1_TARGET) / Number(target);
}
