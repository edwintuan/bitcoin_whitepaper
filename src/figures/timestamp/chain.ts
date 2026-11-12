import { bytesToHex, concatBytes, hexToBytes, utf8, varInt } from '@/lib/bytes';
import { sha256 } from '@/lib/hash';

/** What the first block carries in place of a previous hash: 32 zero bytes. */
export const NO_PREVIOUS = '00'.repeat(32);

/** A block of the timestamp server in section 3: some items, and the hash of the block before. */
export interface StampBlock {
  items: string[];
  /** The hash of the block before, as this block carries it. */
  prev: string;
  /** SHA-256 of `prev` and the items as they stand now. Always up to date. */
  hash: string;
  /** The hash that was made public when this block was last published. */
  published: string;
}

/**
 * The timestamp of a block: SHA-256 over the previous hash (32 bytes) and then
 * every item, each as its length in bytes followed by its UTF-8 text. The
 * length in front keeps different lists of items from ever hashing the same
 * bytes. Hex in the digest's own byte order.
 */
export function stampHash(prev: string, items: readonly string[]): string {
  const parts = [hexToBytes(prev)];
  for (const item of items) {
    const bytes = utf8(item);
    parts.push(varInt(bytes.length), bytes);
  }
  return bytesToHex(sha256(concatBytes(...parts)));
}

/** Publishes one block after another, each on the hash of the one before. */
export function buildChain(blocks: readonly (readonly string[])[]): StampBlock[] {
  const chain: StampBlock[] = [];
  let prev = NO_PREVIOUS;
  for (const items of blocks) {
    const hash = stampHash(prev, items);
    chain.push({ items: [...items], prev, hash, published: hash });
    prev = hash;
  }
  return chain;
}

/**
 * Changes the words of one item after the fact. The block's hash follows its
 * contents, so it changes; the hash that was published does not, and neither
 * does any later block.
 */
export function editItem(chain: readonly StampBlock[], block: number, item: number, text: string): StampBlock[] {
  return chain.map((current, index) => {
    if (index !== block || item < 0 || item >= current.items.length) return current;
    const items = current.items.map((old, i) => (i === item ? text : old));
    return { ...current, items, hash: stampHash(current.prev, items) };
  });
}

/**
 * - `ok`: the block says what was published and follows the block before it.
 * - `changed`: its contents no longer give the hash that was published.
 * - `broken`: it does not follow: it carries a previous hash that is not the
 *   hash of the block before, or it stands on a block that does not follow.
 */
export type StampStatus = 'ok' | 'changed' | 'broken';

export function chainStatus(chain: readonly StampBlock[]): StampStatus[] {
  const status: StampStatus[] = [];
  chain.forEach((block, index) => {
    const expected = index === 0 ? NO_PREVIOUS : chain[index - 1].hash;
    if (block.prev !== expected || status[index - 1] === 'broken') status.push('broken');
    else status.push(block.hash === block.published ? 'ok' : 'changed');
  });
  return status;
}

/** The blocks to publish again, in order: from the first that is not `ok` to the end. */
export function repairPlan(chain: readonly StampBlock[]): number[] {
  const first = chainStatus(chain).findIndex((status) => status !== 'ok');
  return first === -1 ? [] : chain.slice(first).map((_, offset) => first + offset);
}

/**
 * What it takes to make the chain whole again, in hashes: a new one for the
 * block that was edited and for every block published since.
 */
export function repairCost(chain: readonly StampBlock[]): number {
  return repairPlan(chain).length;
}

/**
 * Publishes one block again: it takes the hash the block before has now, is
 * hashed once, and that hash becomes the published one.
 */
export function republish(chain: readonly StampBlock[], index: number): StampBlock[] {
  return chain.map((block, i) => {
    if (i !== index) return block;
    const prev = i === 0 ? NO_PREVIOUS : chain[i - 1].hash;
    const hash = stampHash(prev, block.items);
    return { ...block, prev, hash, published: hash };
  });
}
