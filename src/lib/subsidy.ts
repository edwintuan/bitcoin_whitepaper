/** Satoshis in one bitcoin (Bitcoin Core v32.1, src/consensus/amount.h:15). */
export const COIN = 100_000_000n;

/** Blocks between two halvings of the subsidy (src/kernel/chainparams.cpp:114). */
export const HALVING_INTERVAL = 210_000;

/** The subsidy of the first 210,000 blocks, in satoshis. */
const INITIAL_SUBSIDY = 50n * COIN;

function assertHeight(height: number): void {
  if (!Number.isSafeInteger(height) || height < 0) {
    throw new RangeError(`block height must be a non-negative integer, got ${height}`);
  }
}

/**
 * How many halvings have taken effect at this height: 0 for blocks
 * 0 … 209,999, 1 from block 210,000, and so on.
 *
 * @throws RangeError unless `height` is a non-negative integer.
 */
export function halvingsAt(height: number): number {
  assertHeight(height);
  return Math.floor(height / HALVING_INTERVAL);
}

/**
 * The new coins the block at `height` may create, in satoshis. The same
 * integer arithmetic as `GetBlockSubsidy` (Bitcoin Core v32.1,
 * src/validation.cpp:1833-1844): 50 BTC shifted right once per halving. The
 * shift drops fractions of a satoshi, which is why the total stops short of 21
 * million, and after 33 halvings nothing is left.
 *
 * Core also returns 0 outright from 64 halvings on, because shifting a 64-bit
 * integer that far is undefined in C++. A bigint shift is defined and gives
 * the same 0, so no special case is needed here.
 *
 * @throws RangeError unless `height` is a non-negative integer.
 */
export function blockSubsidy(height: number): bigint {
  return INITIAL_SUBSIDY >> BigInt(halvingsAt(height));
}

/**
 * Total satoshis issued once the block at `height` has been mined: the sum of
 * the subsidies of blocks 0 … `height`. This is the scheduled issuance. Coins
 * that exist but can never be spent, such as the genesis block's 50 BTC, are
 * not subtracted.
 *
 * @throws RangeError unless `height` is a non-negative integer.
 */
export function supplyAt(height: number): bigint {
  assertHeight(height);
  const interval = BigInt(HALVING_INTERVAL);
  let blocksLeft = BigInt(height) + 1n;
  let supply = 0n;
  for (let subsidy = INITIAL_SUBSIDY; subsidy > 0n && blocksLeft > 0n; subsidy >>= 1n) {
    const blocks = blocksLeft < interval ? blocksLeft : interval;
    supply += blocks * subsidy;
    blocksLeft -= blocks;
  }
  return supply;
}

/**
 * The sum of every block subsidy there will ever be: 2,099,999,997,690,000
 * satoshis, which is 0.0231 BTC short of 21 million. The last satoshi is
 * issued by block 6,929,999.
 */
export const MAX_SUPPLY = supplyAt(33 * HALVING_INTERVAL);
