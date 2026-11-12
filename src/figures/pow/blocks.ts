import { GENESIS_HASH, bitsToTarget, targetFromZeroBits, targetToBits } from '@/lib/header';
import type { BlockHeader } from '@/lib/header';

/** The real header of mainnet block 1, mined on 9 January 2009. */
export const BLOCK_1: BlockHeader = Object.freeze({
  version: 1,
  prevHash: GENESIS_HASH,
  merkleRoot: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
  time: 1231469665,
  bits: 0x1d00ffff,
  nonce: 2573394689,
});

export const BLOCK_1_HASH = '00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048';

/**
 * The target for "`zeroBits` leading zero bits", as a header would carry it:
 * packed into the four-byte compact form and expanded again, so the `bits`
 * shown in the figure and the target mined against are the same number.
 */
export function toyTarget(zeroBits: number): { bits: number; target: bigint } {
  const bits = targetToBits(targetFromZeroBits(zeroBits));
  return { bits, target: bitsToTarget(bits) };
}

/** Average number of hashes needed to find `zeroBits` leading zero bits. */
export function expectedTries(zeroBits: number): number {
  return 2 ** zeroBits;
}
