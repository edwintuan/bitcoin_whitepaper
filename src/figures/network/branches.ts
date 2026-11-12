/**
 * Two branches growing from one block, the way nodes that follow the
 * longest-chain rule make them grow. The term visual for "longest chain"
 * plays this; it lives here so that the rule has a test.
 */

export type Branch = 'upper' | 'lower';

/** How many blocks each branch has, not counting the block they share. */
export interface Branches {
  upper: number;
  lower: number;
}

/** How long a branch may get before the picture starts over. */
export const BRANCH_LIMIT = 5;

/** A fork: one block on each branch. */
export const START: Branches = { upper: 1, lower: 1 };

/**
 * The branches nodes are building on. While the two are level, each node
 * stays on the one it had first, so both; as soon as one is longer, every
 * node is on that one.
 */
export function buildingOn(state: Branches): Branch[] {
  if (state.upper === state.lower) return ['upper', 'lower'];
  return [state.upper > state.lower ? 'upper' : 'lower'];
}

/**
 * One more block. It lands on a branch nodes are building on: either of the
 * two, with even odds, while they are level, and only the longer one after
 * that. Once a branch has reached the limit the picture starts over.
 *
 * @param random a source of numbers in [0, 1), such as `mulberry32`
 */
export function grow(state: Branches, random: () => number): Branches {
  if (Math.max(state.upper, state.lower) >= BRANCH_LIMIT) return START;
  const candidates = buildingOn(state);
  const branch = candidates[candidates.length === 1 ? 0 : random() < 0.5 ? 0 : 1];
  return { ...state, [branch]: state[branch] + 1 };
}
