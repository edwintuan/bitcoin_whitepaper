/**
 * The guided steps of the payment verification figure: the scene each one
 * plays in, the part it points at, and where the walkthrough goes when the
 * reader acts by hand instead of pressing Next.
 *
 *   0  hold only the headers (pick a payment)   1  ask for the branch
 *   2  fold it up                               3  try a forgery
 *   4  count the saving (the size scene)
 *
 * The rule behind every move: after the reader's action the step on screen
 * must still describe what the figure shows.
 */

export type Scene = 'proof' | 'size';

/** The part of the check a step points at. */
export type ProofHighlight = 'pick' | 'ask' | 'next' | 'tamper';

export interface Step {
  scene: Scene;
  highlight: ProofHighlight | 'size';
}

export const STEPS: Step[] = [
  { scene: 'proof', highlight: 'pick' },
  { scene: 'proof', highlight: 'ask' },
  { scene: 'proof', highlight: 'next' },
  { scene: 'proof', highlight: 'tamper' },
  { scene: 'size', highlight: 'size' },
];

const ASK_STEP = 1;
const FOLD_STEP = 2;
const TAMPER_STEP = 3;
const SIZE_STEP = 4;

/**
 * Where to send the walkthrough: a step, `null` to let the reader explore
 * freely, or `undefined` to leave it where it is.
 */
export type Move = number | null | undefined;

/** What the reader did by hand in the check. */
export type ProofAction = 'pick' | 'ask' | 'next' | 'tamper' | 'startAgain';

/**
 * Where the walkthrough goes after the reader picks a payment, asks for its
 * branch, folds a hash, tampers or starts again.
 *
 * @param step the step on screen, or null when the reader is exploring freely
 */
export function afterProofAction(step: number | null, action: ProofAction): Move {
  // A reader who has left the walkthrough is never pulled back into it.
  if (step === null) return undefined;

  switch (action) {
    case 'pick':
    case 'startAgain':
      // Either one leaves a payment with no branch: from the fold onwards, that is the step about asking.
      return step >= FOLD_STEP ? ASK_STEP : undefined;
    case 'ask':
      return step < ASK_STEP ? ASK_STEP : undefined;
    case 'next':
      return step < FOLD_STEP ? FOLD_STEP : undefined;
    case 'tamper':
      return step === TAMPER_STEP ? undefined : TAMPER_STEP;
  }
}

/**
 * Where the walkthrough goes when the reader chooses a scene on the tabs.
 * The size scene has a step of its own. Going back to the check leaves it as
 * the reader left it, which no step describes, so the walkthrough lets go.
 */
export function afterScene(step: number | null, scene: Scene): Move {
  if (step === null || STEPS[step]?.scene === scene) return undefined;
  return scene === 'size' ? SIZE_STEP : null;
}
