/**
 * The guided steps of the wallet figure: the amount each one types, the part
 * it points at, and where the walkthrough goes when the reader acts by hand
 * instead of pressing Next.
 *
 *   0  meet your coins            1  split one coin (pay 0.15)
 *   2  combine coins (pay 0.6)    3  find the fee (0.15, then the special cases)
 *   4  send, then pay again
 *
 * The rule behind every move: after the reader's action the step on screen
 * must still describe what the figure shows. If another step does, go there;
 * if none does, let the walkthrough go.
 */
import { parseBtc } from './wallet';

/** The part of the figure a step points at. */
export type Highlight = 'wallet' | 'tx' | 'fee' | 'send';

export interface Step {
  /** What the step types into the amount field. */
  amount: string;
  highlight: Highlight;
}

export const STEPS: Step[] = [
  { amount: '', highlight: 'wallet' },
  { amount: '0.15', highlight: 'tx' },
  { amount: '0.6', highlight: 'tx' },
  { amount: '0.15', highlight: 'fee' },
  { amount: '0.15', highlight: 'send' },
];

const FIRST_STEP = 0;
const FEE_STEP = 3;
const SEND_STEP = 4;

/**
 * Where to send the walkthrough: a step, `null` to let the reader explore
 * freely, or `undefined` to leave it where it is.
 */
export type Move = number | null | undefined;

/** What the reader did by hand. */
export type WalletAction =
  /** Typed an amount, or pressed one of the two on offer. `sats` is null while it is unfinished or not an amount. */
  | { kind: 'amount'; sats: bigint | null }
  /** Pressed one of the special cases. */
  | { kind: 'special' }
  /** Pressed a coin, to choose it or to leave it out. */
  | { kind: 'coin' }
  | { kind: 'send' }
  | { kind: 'reset' };

/** The step that shows a transaction for exactly this amount, if there is one. */
const stepPaying = (sats: bigint | null): number | undefined => {
  if (sats === null) return undefined;
  const index = STEPS.findIndex((entry) => entry.highlight === 'tx' && parseBtc(entry.amount) === sats);
  return index === -1 ? undefined : index;
};

/**
 * Where the walkthrough goes after the reader's own action.
 *
 * @param step the step on screen, or null when the reader is exploring freely
 */
export function afterWalletAction(step: number | null, action: WalletAction): Move {
  // A reader who has left the walkthrough is never pulled back into it.
  if (step === null) return undefined;
  const go = (target: number): Move => (target === step ? undefined : target);

  switch (action.kind) {
    case 'coin':
      // Only the last step talks about choosing coins. Anywhere else no step describes a hand-picked
      // wallet, least of all "Press Send" while there is nothing to send.
      return step === SEND_STEP ? undefined : null;
    case 'amount': {
      // The first step types nothing; an amount that a later step pays takes the reader to that step.
      const target = step === FIRST_STEP ? stepPaying(action.sats) : undefined;
      return target === undefined ? undefined : go(target);
    }
    case 'special':
      return go(FEE_STEP);
    case 'send':
      return go(SEND_STEP);
    case 'reset':
      return go(FIRST_STEP);
  }
}
