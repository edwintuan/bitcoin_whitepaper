import { checkTransfer, coinProblems, redirect } from './coin';
import type { Transfer, TransferProblem } from './coin';

/**
 * What the reader has done to the coin of the first scene, and what has been
 * checked since. A check is only ever the result of one that was run: when
 * the reader pressed Verify, or when a rewrite changed the coin.
 */
export interface Inspection {
  /** Index of the transfer rewritten to pay the attacker. Only one transfer is rewritten at a time. */
  forged: number | null;
  /** The outcome of every check run on the coin as it stands, by transfer. A transfer that is not in here has not been checked. */
  checks: ReadonlyMap<number, TransferProblem>;
  /** The transfer whose check is spelled out under the chain. */
  selected: number | null;
  /** The transfer the last rewrite put back as it was, to make room for its own. */
  restored: number | null;
}

export const NOTHING_CHECKED: Inspection = { forged: null, checks: new Map(), selected: null, restored: null };

/** The coin as the reader has left it: the honest one, with at most one transfer paying the attacker instead. */
export function coinOf(honest: readonly Transfer[], forged: number | null, attacker: Uint8Array): Transfer[] {
  return forged === null ? [...honest] : redirect(honest, forged, attacker);
}

/** The reader presses Verify: this transfer, and the chain behind it, is checked here and now. */
export function verifyOne(state: Inspection, coin: readonly Transfer[], index: number, firstSigner: string): Inspection {
  const checks = new Map(state.checks).set(index, checkTransfer(coin, index, firstSigner));
  return { ...state, checks, selected: index, restored: null };
}

/**
 * The reader rewrites one transfer to pay the attacker or, with `null`, puts
 * the rewritten one back. Either way the coin has changed, so every transfer
 * is checked again, as a payee handed this coin would check it.
 */
export function rewrite(
  state: Inspection,
  honest: readonly Transfer[],
  index: number | null,
  attacker: Uint8Array,
  firstSigner: string,
): Inspection {
  if (index === null && state.forged === null) return state;
  const found = coinProblems(coinOf(honest, index, attacker), firstSigner);
  return {
    forged: index,
    checks: new Map(found.map((problem, transfer): [number, TransferProblem] => [transfer, problem])),
    // Putting a transfer back leaves its check on show, now passing.
    selected: index ?? state.forged,
    restored: index !== null && state.forged !== null && state.forged !== index ? state.forged : null,
  };
}

/**
 * A guided step starts from the coin as it was signed. Checks made on a
 * rewritten coin go with the rewrite; checks of the honest coin still hold.
 */
export function startStep(state: Inspection): Inspection {
  return state.forged === null ? { ...state, selected: null, restored: null } : NOTHING_CHECKED;
}
