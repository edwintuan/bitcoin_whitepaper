/**
 * The two small state machines behind Fig. 1.1. No cryptography: section 1 of
 * the paper is about who has to be trusted, and that is all these model.
 */

/* ------------------------------------------------- one payment, two routes */

/** Price of the goods, the same on both routes. */
export const PRICE = 100;
/** What the bank keeps for standing in the middle. */
export const BANK_FEE = 3;

/** `bank`: the bank moves the money in its ledger. `direct`: cash changes hands. */
export type Route = 'bank' | 'direct';

export type PaymentAction = 'pay' | 'dispute' | 'reset';

export interface Payment {
  route: Route;
  status: 'idle' | 'paid' | 'reversed';
  /** Disputes raised with no one there to hear them. Only the direct route counts any. */
  refusals: number;
}

export function newPayment(route: Route): Payment {
  return { route, status: 'idle', refusals: 0 };
}

/**
 * - `pay` works once, from the start.
 * - `dispute` needs a payment to dispute. A bank reverses it. Without a bank
 *   nobody can, so the payment stands and the attempt is only counted.
 * - `reset` goes back to the start.
 */
export function stepPayment(payment: Payment, action: PaymentAction): Payment {
  if (action === 'reset') return newPayment(payment.route);
  if (action === 'pay') return payment.status === 'idle' ? { ...payment, status: 'paid' } : payment;
  if (payment.status !== 'paid') return payment;
  return payment.route === 'bank'
    ? { ...payment, status: 'reversed' }
    : { ...payment, refusals: payment.refusals + 1 };
}

export interface Balances {
  customer: number;
  bank: number;
  merchant: number;
  /** Goods leave the merchant when the payment arrives. A reversal does not bring them back. */
  goodsSent: boolean;
}

export function balances(payment: Payment): Balances {
  if (payment.status === 'idle') return { customer: PRICE, bank: 0, merchant: 0, goodsSent: false };
  if (payment.status === 'reversed') return { customer: PRICE, bank: 0, merchant: 0, goodsSent: true };
  const fee = payment.route === 'bank' ? BANK_FEE : 0;
  return { customer: 0, bank: fee, merchant: PRICE - fee, goodsSent: true };
}

export interface LedgerEntry {
  kind: 'payment' | 'fee' | 'reversal';
  amount: number;
  /** Struck out by a later reversal. */
  undone: boolean;
}

/** What the bank has written down. Cash leaves no record with anyone. */
export function ledger(payment: Payment): LedgerEntry[] {
  if (payment.route !== 'bank' || payment.status === 'idle') return [];
  const undone = payment.status === 'reversed';
  const entries: LedgerEntry[] = [
    { kind: 'payment', amount: PRICE, undone },
    { kind: 'fee', amount: BANK_FEE, undone },
  ];
  if (undone) entries.push({ kind: 'reversal', amount: PRICE, undone: false });
  return entries;
}

/* ------------------------------------------------ one coin, offered twice */

export type Payee = 'first' | 'second';

export interface CoinState {
  /** Whether a mint checks every coin before a payee accepts it. */
  mint: boolean;
  /** Every time the payer has offered the coin, in order. */
  attempts: { to: Payee; accepted: boolean }[];
}

export function newCoin(): CoinState {
  return { mint: false, attempts: [] };
}

/**
 * The payer sends the coin file to a payee. A file is not used up by being
 * sent, so with nobody checking, every payee receives a perfect copy. A mint
 * accepts a coin only the first time it sees it.
 */
export function give(coin: CoinState, to: Payee): CoinState {
  if (coin.attempts.some((attempt) => attempt.to === to)) return coin;
  const alreadySpent = coin.attempts.some((attempt) => attempt.accepted);
  return { ...coin, attempts: [...coin.attempts, { to, accepted: !(coin.mint && alreadySpent) }] };
}

/** Switching the mint on or off starts the experiment again. */
export function setMint(coin: CoinState, mint: boolean): CoinState {
  return coin.mint === mint ? coin : { mint, attempts: [] };
}

export function resetCoin(coin: CoinState): CoinState {
  return { mint: coin.mint, attempts: [] };
}

/** The payees who now hold the coin, in the order they received it. */
export function holders(coin: CoinState): Payee[] {
  return coin.attempts.filter((attempt) => attempt.accepted).map((attempt) => attempt.to);
}

/** Whom the mint has the coin down as spent to. Null without a mint, or before the first spend. */
export function mintRecord(coin: CoinState): Payee | null {
  return coin.mint ? (holders(coin)[0] ?? null) : null;
}

/**
 * - `ready`: the coin has not been offered yet.
 * - `spent-once`: one payee holds it.
 * - `spent-twice`: two payees hold the same coin, and neither can tell.
 * - `refused`: the mint turned the second spend away.
 */
export type CoinOutcome = 'ready' | 'spent-once' | 'spent-twice' | 'refused';

export function coinOutcome(coin: CoinState): CoinOutcome {
  if (coin.attempts.some((attempt) => !attempt.accepted)) return 'refused';
  const held = holders(coin).length;
  return held === 0 ? 'ready' : held === 1 ? 'spent-once' : 'spent-twice';
}
