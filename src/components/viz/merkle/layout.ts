/**
 * Where the boxes of a Merkle tree go. Geometry only: no hashes, no state.
 *
 * The tree is drawn on a grid as wide as the leaf count rounded up to a power
 * of two. A node of level `l` spans `2^l` columns, so every parent sits
 * centred over the two slots it is hashed from. Where a level has an odd
 * number of nodes, Bitcoin pairs the last one with itself; the layout gives
 * that node a second slot beside it, flagged `ghost`, so the pairing can be
 * drawn as what it is: a hash joined with a copy of itself.
 */

/** One box of the drawing. */
export interface Slot {
  /** 0 is the row of transactions; the root is the last level. */
  level: number;
  /** Position in the row, left to right. A copy takes the index after the node it repeats. */
  index: number;
  /** True for the copy that stands in as the missing partner of a lone last node. */
  ghost: boolean;
  /** First grid column, counting from 0. */
  col: number;
  /** Columns covered. */
  span: number;
}

export interface TreeLayout {
  /** Grid columns: the leaf count rounded up to a power of two. */
  cols: number;
  /** `rows[level]`: that level's slots, real nodes first, then at most one copy. */
  rows: Slot[][];
}

/**
 * The slots for a tree of `leafCount` transactions.
 *
 * @throws RangeError unless `leafCount` is a positive integer.
 */
export function treeLayout(leafCount: number): TreeLayout {
  if (!Number.isInteger(leafCount) || leafCount < 1) {
    throw new RangeError(`a tree needs a positive whole number of leaves, got ${leafCount}`);
  }
  const rows: Slot[][] = [];
  for (let count = leafCount, level = 0; ; count = Math.ceil(count / 2), level++) {
    const span = 2 ** level;
    const row: Slot[] = Array.from({ length: count }, (_, index) => ({ level, index, ghost: false, col: index * span, span }));
    if (count > 1 && count % 2 === 1) {
      row.push({ level, index: count, ghost: true, col: count * span, span });
    }
    rows.push(row);
    if (count === 1) break;
  }
  return { cols: 2 ** (rows.length - 1), rows };
}

/**
 * The two slots a node is hashed from, left then right. The right one is a
 * copy when the left one is alone on its level. Leaves and copies have none.
 */
export function childrenOf(layout: TreeLayout, parent: Slot): [Slot, Slot] | null {
  if (parent.level === 0 || parent.ghost) return null;
  const below = layout.rows[parent.level - 1];
  const left = below[2 * parent.index];
  const right = below[2 * parent.index + 1];
  return left && right ? [left, right] : null;
}

/** The middle of a slot, as a percentage of the tree's width. */
export function centre(slot: Slot, cols: number): number {
  return ((slot.col + slot.span / 2) / cols) * 100;
}
