/**
 * What the figure for section 8 arranges for its drawing: a short chain of
 * real, mined block headers, the eight transactions the middle block commits
 * to, the two ways the reader can tamper, and a larger block to measure a
 * branch on. Proofs, hashing and the fold of a branch one sibling at a time
 * come from the engine in src/lib.
 */
import { utf8, wireToHash } from '@/lib/bytes';
import { sha256Hex, sha256d } from '@/lib/hash';
import { GENESIS_HASH, compactTargetFromZeroBits } from '@/lib/header';
import type { BlockHeader } from '@/lib/header';
import { merkleProof, merkleRoot } from '@/lib/merkle';
import type { ProofStep } from '@/lib/merkle';
import { mineSync } from '@/lib/miner';
import { txid } from '@/lib/tx';
import type { Tx } from '@/lib/tx';

/* ------------------------------------------------------------ the payments */

/** Transactions in the block the reader's payment sits in: a branch of three hashes. */
export const BLOCK_TX_COUNT = 8;

export interface Payment {
  tx: Tx;
  /** The transaction id: what the wallet starts its check from. */
  id: string;
  /** Satoshis paid by the transaction's one output. */
  amount: bigint;
}

/** Satoshis paid by each of the block's transactions. Arbitrary, all different. */
const AMOUNTS = [1_250_000n, 40_000_000n, 5_000_000n, 730_000n, 12_000_000n, 2_500_000n, 90_000_000n, 310_000n];

function payment(index: number, amount: bigint): Payment {
  const tx: Tx = {
    inputs: [{ txid: sha256Hex(`section 8, coin spent by transaction ${index}`), vout: 0 }],
    outputs: [{ value: amount, owner: `payee ${index}` }],
  };
  return { tx, id: txid(tx), amount };
}

/** The block's eight transactions, in block order, each with its real id. */
export function blockPayments(): Payment[] {
  return AMOUNTS.map((amount, index) => payment(index, amount));
}

/**
 * The forgery the figure offers: the same payment claiming a hundred times
 * the amount. It spends the same coin, but it is a different transaction, so
 * it has a different id.
 */
export function forge(original: Payment): Payment {
  const amount = original.amount * 100n;
  const tx: Tx = { inputs: original.tx.inputs, outputs: [{ ...original.tx.outputs[0], value: amount }] };
  return { tx, id: txid(tx), amount };
}

/**
 * A hash with one hex digit changed: the smallest lie a dishonest node could
 * tell. It is the first digit, because a shortened hash shows only its
 * leading digits and the reader has to be able to see the change.
 */
export function corrupt(hash: string): string {
  return (hash[0].toLowerCase() === '0' ? '1' : '0') + hash.slice(1);
}

/* --------------------------------------------------------------- the tree */

/**
 * - `path`: the picked transaction and the hashes the wallet computes on its way up
 * - `sibling`: the hash beside each step, which only a full node can supply
 * - `none`: the rest of the tree, which the wallet never sees
 */
export type NodeRole = 'path' | 'sibling' | 'none';

/** The role of every node in a tree of `leafCount` transactions when the one at `index` is being proved. */
export function nodeRoles(leafCount: number, index: number): NodeRole[][] {
  const rows: NodeRole[][] = [];
  for (let width = leafCount, at = index; ; width = Math.ceil(width / 2), at >>= 1) {
    rows.push(
      Array.from({ length: width }, (_, i): NodeRole => {
        if (i === at) return 'path';
        return width > 1 && i === (at ^ 1) ? 'sibling' : 'none';
      }),
    );
    if (width === 1) break;
  }
  return rows;
}

/* ------------------------------------------------------------- the headers */

/** A toy target: about a thousand tries a block, so the chain is mined as the page loads. */
const { bits: CHAIN_BITS, target: chainTarget } = compactTargetFromZeroBits(10);
export const CHAIN_TARGET = chainTarget;

/** Position, in `headerChain()`, of the block that holds the payments. */
export const PAYMENT_BLOCK = 1;

export interface ChainBlock {
  height: number;
  header: BlockHeader;
  hash: string;
}

let chain: ChainBlock[] | null = null;

/**
 * Three real headers mined on top of the genesis block. The middle one
 * commits to `blockPayments()` through its Merkle root; the other two commit
 * to transactions the figure never shows. Computed once.
 */
export function headerChain(): ChainBlock[] {
  if (chain) return chain;
  const paymentsRoot = merkleRoot(blockPayments().map((entry) => entry.id));
  const blocks: ChainBlock[] = [];
  let prevHash = GENESIS_HASH;
  for (let i = 0; i < 3; i++) {
    const unmined: BlockHeader = {
      version: 1,
      prevHash,
      merkleRoot: i === PAYMENT_BLOCK ? paymentsRoot : wireToHash(sha256d(utf8(`section 8, the transactions of block ${i + 1}`))),
      time: 1231469665 + i * 600,
      bits: CHAIN_BITS,
      nonce: 0,
    };
    const found = mineSync(unmined, CHAIN_TARGET, 5_000_000);
    blocks.push({ height: i + 1, header: { ...unmined, nonce: found.nonce }, hash: found.hash });
    prevHash = found.hash;
  }
  chain = blocks;
  return blocks;
}

/* --------------------------------------------------------- a larger block */

/** The size scene doubles the block from 2^3 = 8 transactions up to 2^12 = 4,096. */
export const MIN_DOUBLINGS = 3;
export const MAX_DOUBLINGS = 12;

export interface BigBlock {
  /** Transactions in the block. */
  count: number;
  /** Position of the transaction being proved. */
  index: number;
  txid: string;
  proof: ProofStep[];
  root: string;
}

const bigBlocks = new Map<number, BigBlock>();

/**
 * A block of `2^doublings` transaction ids with the Merkle branch for one of
 * them, built for real: thousands of double SHA-256 hashes for the largest.
 * Each size is computed once.
 *
 * @throws RangeError outside MIN_DOUBLINGS … MAX_DOUBLINGS.
 */
export function bigBlock(doublings: number): BigBlock {
  if (!Number.isInteger(doublings) || doublings < MIN_DOUBLINGS || doublings > MAX_DOUBLINGS) {
    throw new RangeError(`doublings must be a whole number within ${MIN_DOUBLINGS} … ${MAX_DOUBLINGS}, got ${doublings}`);
  }
  const cached = bigBlocks.get(doublings);
  if (cached) return cached;
  const count = 2 ** doublings;
  // Each id is that of a real toy transaction: one output, paying i + 1 satoshis.
  const txids = Array.from({ length: count }, (_, i) =>
    txid({ inputs: [], outputs: [{ value: BigInt(i + 1), owner: `block of ${count}` }] }),
  );
  // Somewhere in the middle, on an odd position, so the siblings fall on both sides.
  const index = Math.floor(count / 3) | 1;
  const block: BigBlock = { count, index, txid: txids[index], proof: merkleProof(txids, index), root: merkleRoot(txids) };
  bigBlocks.set(doublings, block);
  return block;
}
