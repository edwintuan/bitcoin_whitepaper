import { utf8, wireToHash } from '@/lib/bytes';
import { sha256d } from '@/lib/hash';
import { GENESIS_HASH, headerHash, meetsTarget } from '@/lib/header';
import type { BlockHeader } from '@/lib/header';
import { mineSync } from '@/lib/miner';
import { toyTarget } from './blocks';

/** Easy enough to redo in a second or two, hard enough to watch. */
export const TOY_ZERO_BITS = 10;
const { bits: TOY_BITS, target } = toyTarget(TOY_ZERO_BITS);
export const TOY_TARGET = target;

/** A block of the tamper scene: real header, one line of text for contents. */
export interface ToyBlock {
  data: string;
  /** The previous-block hash this block was mined against. */
  prev: string;
  nonce: number;
  hash: string;
}

/**
 * The real 80-byte header for a toy block. Its only "transaction" is a line
 * of text, so the Merkle root is simply that text's double SHA-256.
 */
export function headerOf(block: Pick<ToyBlock, 'data' | 'prev' | 'nonce'>, index: number): BlockHeader {
  return {
    version: 1,
    prevHash: block.prev,
    merkleRoot: wireToHash(sha256d(utf8(block.data))),
    time: 1231469665 + index * 600,
    bits: TOY_BITS,
    nonce: block.nonce,
  };
}

/** Mines a valid chain on top of the real genesis block, one block per line of text. */
export function buildChain(data: readonly string[]): ToyBlock[] {
  const chain: ToyBlock[] = [];
  let prev = GENESIS_HASH;
  data.forEach((text, index) => {
    const found = mineSync(headerOf({ data: text, prev, nonce: 0 }, index), TOY_TARGET, 5_000_000);
    chain.push({ data: text, prev, nonce: found.nonce, hash: found.hash });
    prev = found.hash;
  });
  return chain;
}

/** Changes what one block says. Its nonce stays, so its hash changes and almost surely stops qualifying. */
export function editBlock(chain: readonly ToyBlock[], index: number, data: string): ToyBlock[] {
  return chain.map((block, i) => {
    if (i !== index) return block;
    const next = { ...block, data };
    return { ...next, hash: headerHash(headerOf(next, i)) };
  });
}

/**
 * - `hash`: the block's own hash no longer meets the target.
 * - `link`: the block is cut off: it points at a hash that is gone, or stands on a block that failed.
 */
export type ChainProblem = 'hash' | 'link' | null;

export function chainProblems(chain: readonly ToyBlock[]): ChainProblem[] {
  const found: ChainProblem[] = [];
  chain.forEach((block, index) => {
    const expectedPrev = index === 0 ? GENESIS_HASH : chain[index - 1].hash;
    if (!meetsTarget(block.hash, TOY_TARGET)) found.push('hash');
    // A block is only as good as what it stands on: once one block fails,
    // everything built on it is cut off, however much work it carries.
    else if (block.prev !== expectedPrev || (index > 0 && found[index - 1] !== null)) found.push('link');
    else found.push(null);
  });
  return found;
}

/** What an edit did to the chain, in the terms the figure explains it in. */
export type Damage =
  | { kind: 'whole' }
  /** An edited block fails, and `count` blocks in all no longer hold. */
  | { kind: 'broken'; count: number }
  /** The last block was edited: it fails, and nothing stood on it. */
  | { kind: 'alone' }
  /**
   * An edited block still meets the target by chance, about once in
   * 2^TOY_ZERO_BITS edits. Its hash changed all the same, so the `count`
   * blocks built on the old one are cut off.
   */
  | { kind: 'lucky'; count: number };

export function describeDamage(problems: readonly ChainProblem[]): Damage {
  const count = problems.filter(Boolean).length;
  if (count === 0) return { kind: 'whole' };
  if (!problems.includes('hash')) return { kind: 'lucky', count };
  if (count === 1) return { kind: 'alone' };
  return { kind: 'broken', count };
}
