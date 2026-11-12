/**
 * The guided steps of the Merkle tree figure: the scene each one plays in,
 * the part it points at, and where the walkthrough goes when the reader acts
 * by hand instead of pressing Next.
 *
 *   0  hash in pairs (four transactions)   1  add an odd one (five)
 *   2  mark what is spent ("Back to four") 3  prune
 *   4  count the headers (the storage scene)
 *
 * The rule behind every move: after the reader's action the step on screen
 * must still describe what the figure shows. If another step does, go there;
 * if none does, let the walkthrough go.
 */

export type Scene = 'tree' | 'storage';

/** The part of the tree scene a step points at. */
export type TreeHighlight = 'play' | 'leaves' | 'prune';

export interface Step {
  scene: Scene;
  highlight: TreeHighlight | 'interval';
}

export const STEPS: Step[] = [
  { scene: 'tree', highlight: 'play' },
  { scene: 'tree', highlight: 'play' },
  { scene: 'tree', highlight: 'leaves' },
  { scene: 'tree', highlight: 'prune' },
  { scene: 'storage', highlight: 'interval' },
];

const MARK_STEP = 2;
const PRUNE_STEP = 3;
const STORAGE_STEP = 4;

/** The number of transactions the step about marking talks about. */
const MARK_STEP_COUNT = 4;

/**
 * Where to send the walkthrough: a step, `null` to let the reader explore
 * freely, or `undefined` to leave it where it is.
 */
export type Move = number | null | undefined;

/** What the reader did by hand in the tree scene. */
export type TreeAction = 'mark' | 'resize' | 'prune' | 'startOver';

/** The block as the action left it. */
export interface TreeState {
  /** Transactions in the block. */
  count: number;
  /** Transactions marked as spent that a pruning would still remove. */
  waiting: number;
  /** Whether the block has been pruned. */
  pruned: boolean;
}

/** The step about marking, if the block has the four transactions it speaks of; otherwise no step fits. */
const markStepFor = (after: TreeState): Move => (after.count === MARK_STEP_COUNT ? MARK_STEP : null);

/**
 * Where the walkthrough goes after the reader marks a transaction, changes
 * their number, prunes or starts over.
 *
 * @param step the step on screen, or null when the reader is exploring freely
 * @param after the block once the action has been applied
 */
export function afterTreeAction(step: number | null, action: TreeAction, after: TreeState): Move {
  // A reader who has left the walkthrough is never pulled back into it.
  if (step === null) return undefined;
  const nothingToPrune = !after.pruned && after.waiting === 0;

  switch (action) {
    case 'mark':
      // The two build steps hand over to the step about marking.
      if (step < MARK_STEP) return markStepFor(after);
      // "Press Prune" makes no sense once the last mark is gone and nothing has been pruned.
      if (step === PRUNE_STEP && nothingToPrune) return markStepFor(after);
      return undefined;
    case 'resize':
      // The first three steps each name the number of transactions on screen.
      return step <= MARK_STEP ? null : undefined;
    case 'prune':
      return step === PRUNE_STEP ? undefined : PRUNE_STEP;
    case 'startOver':
      return step === PRUNE_STEP && nothingToPrune ? markStepFor(after) : undefined;
  }
}

/**
 * Where the walkthrough goes when the reader chooses a scene on the tabs.
 * The storage scene has a step of its own. Going back to the tree leaves it
 * as the reader left it, which no step describes, so the walkthrough lets go.
 */
export function afterScene(step: number | null, scene: Scene): Move {
  if (step === null || STEPS[step]?.scene === scene) return undefined;
  return scene === 'storage' ? STORAGE_STEP : null;
}
