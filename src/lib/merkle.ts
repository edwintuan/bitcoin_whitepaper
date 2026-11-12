import { concatBytes, hashToWire, wireToHash } from './bytes';
import { sha256d } from './hash';

/**
 * One step of a Merkle proof: the hash of the sibling node, and the side the
 * sibling sits on. `'left'` means the parent is `H(sibling ‖ ours)`, `'right'`
 * means `H(ours ‖ sibling)`.
 */
export interface ProofStep {
  /** Sibling hash, display order. */
  hash: string;
  position: 'left' | 'right';
}

/** Validates a display-order hash and returns it in lower case. */
function normalize(hashHex: string): string {
  return wireToHash(hashToWire(hashHex));
}

/**
 * The parent of two Merkle nodes: `sha256d(left ‖ right)`.
 *
 * Byte order: arguments and result are display-order hex, as txids are shown.
 * Inside, each child is reversed into wire order before the two are joined and
 * hashed, and the digest is reversed again on the way out. Hashing the strings
 * as written would give a different, wrong, tree.
 *
 * @throws RangeError unless both children are 64 hex characters.
 */
export function merkleParent(left: string, right: string): string {
  return wireToHash(sha256d(concatBytes(hashToWire(left), hashToWire(right))));
}

/**
 * Builds the whole tree bottom-up. `levels[0]` holds the txids, each next
 * level holds the parents of the one below, and the last level holds only the
 * root. All hashes are display-order hex, in lower case.
 *
 * A level with an odd number of nodes pairs its last node with itself, as
 * `ComputeMerkleRoot` does (Bitcoin Core v32.1, src/consensus/merkle.cpp:51-73).
 * The duplicate is used for hashing only: it is not added to the level, so a
 * block of 3 transactions gives levels of 3, 2 and 1 nodes.
 *
 * @throws RangeError for an empty list (every block has at least its coinbase
 * transaction) or a txid that is not 64 hex characters.
 */
export function merkleLevels(txids: string[]): string[][] {
  if (txids.length === 0) {
    throw new RangeError('a merkle tree needs at least one txid');
  }
  const levels = [txids.map(normalize)];
  for (let level = levels[0]; level.length > 1; ) {
    const parents: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      parents.push(merkleParent(level[i], level[i + 1] ?? level[i]));
    }
    levels.push(parents);
    level = parents;
  }
  return levels;
}

/**
 * The Merkle root a block header commits to, display order. For a block with
 * a single transaction the root is that transaction's id.
 *
 * @throws RangeError for an empty list or a malformed txid.
 */
export function merkleRoot(txids: string[]): string {
  const levels = merkleLevels(txids);
  return levels[levels.length - 1][0];
}

/**
 * The Merkle branch for the transaction at `index`: one sibling per level,
 * from the leaves up to just below the root, so about log2(n) hashes. Where a
 * node is the lone last one of an odd level, its sibling is its own hash, on
 * the right. Sibling hashes are display-order hex, like the txids.
 *
 * @throws RangeError if `index` is not a position in `txids`.
 */
export function merkleProof(txids: string[], index: number): ProofStep[] {
  if (!Number.isInteger(index) || index < 0 || index >= txids.length) {
    throw new RangeError(`index ${index} is outside a list of ${txids.length} txids`);
  }
  const levels = merkleLevels(txids);
  const proof: ProofStep[] = [];
  let position = index;
  for (const level of levels.slice(0, -1)) {
    const isRightChild = position % 2 === 1;
    const sibling = isRightChild ? position - 1 : position + 1;
    proof.push({
      hash: level[sibling] ?? level[position],
      position: isRightChild ? 'left' : 'right',
    });
    position >>= 1;
  }
  return proof;
}

/**
 * What a light client does: fold the proof into the txid, one sibling at a
 * time, and check that the result is the Merkle root from a block header.
 * `txid`, the proof's hashes and `root` are all display-order hex, in either
 * case. Returns `false`, never throws, when any of them is not a well-formed
 * hash.
 */
export function verifyProof(txid: string, proof: ProofStep[], root: string): boolean {
  try {
    let node = normalize(txid);
    for (const step of proof) {
      node = step.position === 'left' ? merkleParent(step.hash, node) : merkleParent(node, step.hash);
    }
    return node === normalize(root);
  } catch {
    return false;
  }
}

/**
 * Finds what whitepaper section 7 lets a node discard: the largest subtrees
 * whose transactions are all spent. Each returned node (`levels[level][index]`)
 * can stand in, as a bare hash, for everything beneath it, and the root stays
 * computable from what is left. Nodes are listed left to right.
 *
 * With leaves 0-2 of four spent, the result is the parent of leaves 0 and 1
 * and leaf 2 itself: the paper's "Hash01" and "Hash2". If every leaf is spent
 * the result is the root alone.
 *
 * @param levels a tree from {@link merkleLevels}
 * @param spent one flag per leaf, in leaf order
 * @throws RangeError if `spent` does not have one entry per leaf.
 */
export function prunableNodes(levels: string[][], spent: boolean[]): { level: number; index: number }[] {
  if (levels.length === 0 || spent.length !== levels[0].length) {
    throw new RangeError('spent needs exactly one entry per leaf of the tree');
  }
  // allSpent[level][index]: every leaf under that node is spent. A lone last
  // node has a single child, so it simply inherits that child's flag.
  const allSpent = [spent];
  for (let level = 1; level < levels.length; level++) {
    const below = allSpent[level - 1];
    allSpent.push(levels[level].map((_, i) => below[2 * i] && (below[2 * i + 1] ?? true)));
  }
  const found: { level: number; index: number }[] = [];
  const visit = (level: number, index: number): void => {
    if (allSpent[level][index]) {
      found.push({ level, index });
    } else if (level > 0) {
      visit(level - 1, 2 * index);
      if (2 * index + 1 < levels[level - 1].length) visit(level - 1, 2 * index + 1);
    }
  };
  visit(levels.length - 1, 0);
  return found;
}
