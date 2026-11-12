/**
 * What the figure for section 7 arranges for its drawing: a small block of
 * real transaction ids, which of its nodes survive pruning, and what is left
 * on disk afterwards. Hashing, the choice of prunable subtrees and the root
 * recomputed from what is left all come from the engine in src/lib.
 */
import { sha256Hex } from '@/lib/hash';
import { GENESIS_HASH, bitsToTarget, targetFromZeroBits, targetToBits } from '@/lib/header';
import type { BlockHeader } from '@/lib/header';
import { merkleRoot, prunableNodes } from '@/lib/merkle';
import type { PrunedStore } from '@/lib/merkle';
import { mineSync } from '@/lib/miner';
import { txid } from '@/lib/tx';

/** The figure lets the block hold this many transactions. */
export const MIN_TXS = 2;
export const MAX_TXS = 8;

/** A block header, serialized: 4 + 32 + 32 + 4 + 4 + 4 bytes. */
export const HEADER_BYTES = 80;

/**
 * The ids of the block's first `count` transactions. Each is the real id of a
 * small transaction in the toy model of src/lib/tx.ts, so the leaves of the
 * tree are genuine double SHA-256 hashes. Asking for more transactions never
 * changes the earlier ones.
 *
 * @throws RangeError unless `count` is a positive integer.
 */
export function blockTxids(count: number): string[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`a block holds a positive whole number of transactions, got ${count}`);
  }
  return Array.from({ length: count }, (_, i) =>
    txid({
      inputs: [{ txid: sha256Hex(`section 7, coin spent by transaction ${i}`), vout: 0 }],
      outputs: [{ value: BigInt(i + 1) * 1_000_000n, owner: `payee ${i}` }],
    }),
  );
}

/* ------------------------------------------------------------------- header */

/** Easy enough to mine in a few milliseconds whenever the transactions change. */
const BLOCK_BITS = targetToBits(targetFromZeroBits(10));
export const BLOCK_TARGET = bitsToTarget(BLOCK_BITS);

/**
 * A real header for the block: it commits to the transactions through the
 * Merkle root alone, and is mined so that its hash meets a toy target.
 */
export function blockHeader(txids: string[]): { header: BlockHeader; hash: string } {
  const unmined: BlockHeader = {
    version: 1,
    prevHash: GENESIS_HASH,
    merkleRoot: merkleRoot(txids),
    time: 1231469665,
    bits: BLOCK_BITS,
    nonce: 0,
  };
  const found = mineSync(unmined, BLOCK_TARGET, 5_000_000);
  return { header: { ...unmined, nonce: found.nonce }, hash: found.hash };
}

/* ------------------------------------------------------------------ pruning */

/**
 * - `tx`: a transaction still on disk and unspent
 * - `spent`: a transaction still on disk, marked as spent
 * - `hash`: an interior hash, recomputed from what is beneath it whenever needed
 * - `stub`: a single stored hash standing in for a pruned subtree
 * - `gone`: pruned away beneath a stub
 */
export type NodeState = 'tx' | 'spent' | 'hash' | 'stub' | 'gone';

const stubKey = (level: number, index: number) => `${level}:${index}`;

function checkFlags(levels: string[][], flags: boolean[], name: string): void {
  if (levels.length === 0 || flags.length !== levels[0].length) {
    throw new RangeError(`${name} needs exactly one entry per transaction`);
  }
}

/**
 * The state of every node, row by row like `levels`.
 *
 * @param levels a tree from `merkleLevels`
 * @param spent the reader's marks, one per transaction
 * @param pruned the marks as they stood when the block was last pruned (all false if never)
 * @throws RangeError unless both lists have one entry per transaction.
 */
export function nodeStates(levels: string[][], spent: boolean[], pruned: boolean[]): NodeState[][] {
  checkFlags(levels, spent, 'spent');
  checkFlags(levels, pruned, 'pruned');
  const stubs = new Set(prunableNodes(levels, pruned).map((node) => stubKey(node.level, node.index)));
  return levels.map((row, level) =>
    row.map((_, index) => {
      if (stubs.has(stubKey(level, index))) return 'stub';
      // A node is gone when one of its ancestors is a stub.
      for (let up = level + 1, at = index >> 1; up < levels.length; up++, at >>= 1) {
        if (stubs.has(stubKey(up, at))) return 'gone';
      }
      if (level > 0) return 'hash';
      return spent[index] ? 'spent' : 'tx';
    }),
  );
}

/**
 * What is left on disk once every fully spent subtree has been replaced by
 * its hash: the store the engine's `rootFromStore` recomputes the root from.
 *
 * @throws RangeError unless `pruned` has one entry per transaction.
 */
export function prunedStore(levels: string[][], pruned: boolean[]): PrunedStore {
  checkFlags(levels, pruned, 'pruned');
  const txids = new Map<number, string>();
  pruned.forEach((isPruned, index) => {
    if (!isPruned) txids.set(index, levels[0][index]);
  });
  return {
    leafCount: levels[0].length,
    txids,
    stubs: prunableNodes(levels, pruned).map((node) => ({ ...node, hash: levels[node.level][node.index] })),
  };
}

export interface StorageCount {
  txTotal: number;
  /** Transactions still stored whole. */
  txKept: number;
  /**
   * Hashes stored in place of pruned subtrees. When every transaction is
   * pruned the one hash that stands for them is the Merkle root, which the
   * header holds anyway: nothing is kept beside the header, and this is 0.
   */
  stubHashes: number;
  /** Nodes beneath the stubs: their hashes can no longer be shown or recomputed. */
  hashesGone: number;
}

/** What pruning kept and what it dropped, counted in transactions and hashes. */
export function storageCount(levels: string[][], pruned: boolean[]): StorageCount {
  const states = nodeStates(levels, pruned, pruned);
  const flat = states.flat();
  const rootIsStub = states[states.length - 1][0] === 'stub';
  return {
    txTotal: pruned.length,
    txKept: pruned.filter((isPruned) => !isPruned).length,
    stubHashes: flat.filter((state) => state === 'stub').length - (rootIsStub ? 1 : 0),
    hashesGone: flat.filter((state) => state === 'gone').length,
  };
}

/* ------------------------------------------------------- the paper's arithmetic */

/**
 * Bytes of block headers produced in a year of 365 days when a block arrives
 * every `intervalMinutes`: the paper's 80 bytes × 6 × 24 × 365 at ten minutes.
 *
 * @throws RangeError unless the interval is positive.
 */
export function yearlyHeaderBytes(intervalMinutes: number): number {
  if (!(intervalMinutes > 0)) throw new RangeError(`the block interval must be positive, got ${intervalMinutes}`);
  return HEADER_BYTES * (60 / intervalMinutes) * 24 * 365;
}

/**
 * What a year of headers is measured against: the size of the largest block.
 * The rule is a weight of 4,000,000 units (`MAX_BLOCK_WEIGHT`, Bitcoin Core
 * v32.1, src/consensus/consensus.h:15), which keeps a serialized block just
 * under this many bytes.
 */
export const LARGEST_BLOCK_BYTES = 4_000_000;

/** Bytes as megabytes of a million bytes, to one decimal place, as the paper counts them: 4204800 → "4.2". */
export function megabytes(bytes: number): string {
  return (bytes / 1_000_000).toFixed(1);
}
