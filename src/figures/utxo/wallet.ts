/**
 * What the figure for section 9 computes: a wallet of real unspent outputs in
 * the toy transaction model of src/lib/tx.ts, and the plan for one payment.
 * Coin selection, building the payment, measuring the fee and applying the
 * transaction all come from that engine; this file decides which of them to
 * call and puts a name on each outcome.
 */
import { sha256Hex } from '@/lib/hash';
import { applyTx, buildPayment, fee, selectCoins, txid } from '@/lib/tx';
import type { Outpoint, Selection, Tx, Utxo } from '@/lib/tx';

/** Owner names in the toy model. They are hashed into transaction ids, so they do not follow the page's language. */
export const YOU = 'you';
export const PAYEE = 'bob';

/**
 * The figure's fee, in satoshis: a flat part plus a part for every coin
 * spent, because each input makes a real transaction larger and fees are
 * charged by size.
 */
export const BASE_FEE = 1_000n;
export const FEE_PER_INPUT = 1_000n;

/**
 * Change below this many satoshis gets no output of its own. 546 is Bitcoin
 * Core's default dust threshold for a pay-to-public-key-hash output
 * (v32.1, src/policy/policy.cpp:27-64, at DUST_RELAY_TX_FEE of 3,000 sat/kvB).
 */
export const DUST = 546n;

const feeFor = (inputs: number): bigint => BASE_FEE + FEE_PER_INPUT * BigInt(inputs);
const sum = (coins: Utxo[]): bigint => coins.reduce((total, coin) => total + coin.value, 0n);

/** A coin's name: the transaction that created it and its position there. */
export const coinKey = (coin: Outpoint): string => `${coin.txid}:${coin.vout}`;

/** The coins in a set that belong to the reader. */
export const mine = (coins: Utxo[]): Utxo[] => coins.filter((coin) => coin.owner === YOU);

/** Satoshis in the wallet the figure opens with, largest first. */
const STARTING_VALUES = [50_000_000n, 20_000_000n, 10_000_000n, 5_000_000n, 2_000_000n];

/**
 * The wallet the figure opens with: five unspent outputs, each created by
 * its own earlier transaction, whose real id the output is named by.
 */
export function startingCoins(): Utxo[] {
  return STARTING_VALUES.map((value, i) => {
    const funding: Tx = {
      inputs: [{ txid: sha256Hex(`section 9, the coin that paid for coin ${i}`), vout: 0 }],
      outputs: [{ value, owner: YOU }],
    };
    return { txid: txid(funding), vout: 0, value, owner: YOU };
  });
}

/**
 * Reads an amount typed in bitcoin and returns it in satoshis: "0.15" →
 * 15000000n. Returns null for anything that is not a positive decimal number
 * with at most eight places after the point.
 */
export function parseBtc(text: string): bigint | null {
  const match = /^(\d*)(?:\.(\d{0,8}))?$/.exec(text.trim());
  if (!match) return null;
  const [, whole, fraction = ''] = match;
  if (whole === '' && fraction === '') return null;
  const sats = BigInt(whole === '' ? '0' : whole) * 100_000_000n + BigInt(fraction.padEnd(8, '0'));
  return sats > 0n ? sats : null;
}

/**
 * - `unfinished`: nothing yet, or only zeros so far ("0", "0.", "0.00")
 * - `bad`: text that cannot become an amount in bitcoin
 * - `amount`: a positive amount, in satoshis
 */
export type AmountRead = { kind: 'unfinished' } | { kind: 'bad' } | { kind: 'amount'; sats: bigint };

/**
 * Reads the amount field as the reader types in it. Zero so far is not a
 * mistake: "0." is how "0.15" begins, so it is no reason to show an error.
 * Full-width digits and the full-width full stop, which a Chinese input
 * method produces, count as their plain forms.
 */
export function readAmount(text: string): AmountRead {
  const plain = text.normalize('NFKC');
  if (/^\s*0*\.?0{0,8}\s*$/.test(plain)) return { kind: 'unfinished' };
  const sats = parseBtc(plain);
  return sats === null ? { kind: 'bad' } : { kind: 'amount', sats };
}

/**
 * - `idle`: no amount to pay yet
 * - `short`: the coins on offer cannot cover the amount and its fee
 * - `ready`: a transaction that could be sent as it stands
 */
export type Plan =
  | { kind: 'idle' }
  | {
      kind: 'short';
      /** True when the reader chose the coins. */
      manual: boolean;
      /** The coins that were on offer: the picked ones, or the whole wallet. */
      inputs: Utxo[];
      total: bigint;
      /** The fee for spending all of `inputs`. */
      fee: bigint;
      /** How much more than `total` the payment and its fee need. */
      missing: bigint;
    }
  | {
      kind: 'ready';
      manual: boolean;
      selection: Selection;
      tx: Tx;
      /** What the miner receives: inputs minus outputs, as the engine measures it. */
      fee: bigint;
      /** Value that comes back in an output of its own; 0n when there is none. */
      change: bigint;
      /** Change too small to be worth an output, left to the fee; 0n otherwise. */
      dust: bigint;
      /** `change`: two outputs. `exact`: nothing was left over. `dust`: the leftover went to the fee. */
      outcome: 'change' | 'exact' | 'dust';
    };

/**
 * Plans a payment of `amount` satoshis from `wallet`.
 *
 * With `manual` null the wallet chooses the coins (`selectCoins`). Otherwise
 * exactly the coins whose keys are in `manual` are spent, in wallet order.
 */
export function planPayment(wallet: Utxo[], amount: bigint | null, manual: ReadonlySet<string> | null): Plan {
  if (amount === null) return { kind: 'idle' };

  let selection: Selection | null;
  if (manual === null) {
    selection = selectCoins(wallet, amount, FEE_PER_INPUT, BASE_FEE);
  } else {
    const inputs = wallet.filter((coin) => manual.has(coinKey(coin)));
    const total = sum(inputs);
    const cost = feeFor(inputs.length);
    selection = total >= amount + cost && inputs.length > 0 ? { inputs, total, fee: cost, change: total - amount - cost } : null;
  }

  if (selection === null) {
    const inputs = manual === null ? wallet : wallet.filter((coin) => manual.has(coinKey(coin)));
    const total = sum(inputs);
    const cost = feeFor(inputs.length);
    return { kind: 'short', manual: manual !== null, inputs, total, fee: cost, missing: amount + cost - total };
  }

  const tx = buildPayment(selection, PAYEE, amount, YOU, DUST);
  const hasChange = tx.outputs.length === 2;
  return {
    kind: 'ready',
    manual: manual !== null,
    selection,
    tx,
    fee: fee(tx, wallet),
    change: hasChange ? selection.change : 0n,
    dust: hasChange ? 0n : selection.change,
    outcome: hasChange ? 'change' : selection.change === 0n ? 'exact' : 'dust',
  };
}

/**
 * Sends a planned payment: the coins it spends leave the set, and its outputs
 * join it as new coins (`applyTx`). `coins` is every unspent output the figure
 * knows, the payee's included, and is not modified.
 *
 * @throws Error if the plan spends a coin that is no longer in `coins`.
 */
export function send(coins: Utxo[], plan: Extract<Plan, { kind: 'ready' }>): Utxo[] {
  return applyTx(coins, plan.tx);
}

/** Amounts that bring out each special case for the wallet as it stands. */
export interface EdgeAmounts {
  /** Uses a coin up exactly: no change. */
  exact: bigint;
  /** Leaves change too small to keep. */
  dust: bigint;
  /** More than the wallet holds. */
  tooMuch: bigint;
}

/** Change the dust example leaves over, in satoshis: well under the limit. */
const DUST_EXAMPLE = 300n;

/**
 * Finds amounts that show the exact, dust and insufficient cases with these
 * coins, checking each against `planPayment`. Null when the wallet has no
 * coin large enough to demonstrate them.
 */
export function edgeAmounts(wallet: Utxo[]): EdgeAmounts | null {
  const oneInput = feeFor(1);
  const bySize = [...wallet].sort((a, b) => (a.value < b.value ? 1 : a.value > b.value ? -1 : 0));
  const outcomeOf = (amount: bigint) => {
    if (amount <= 0n) return null;
    const plan = planPayment(wallet, amount, null);
    return plan.kind === 'ready' ? plan.outcome : null;
  };
  const exact = bySize.map((coin) => coin.value - oneInput).find((amount) => outcomeOf(amount) === 'exact');
  const dust = bySize.map((coin) => coin.value - oneInput - DUST_EXAMPLE).find((amount) => outcomeOf(amount) === 'dust');
  if (exact === undefined || dust === undefined) return null;
  return { exact, dust, tooMuch: sum(wallet) + 10_000_000n };
}

/* ------------------------------------------------------------------ drawing */

/** Side, in pixels, of the square drawn for the 0.5 BTC coin the wallet opens with. */
const REFERENCE_SIDE = 84;
const REFERENCE_VALUE = 50_000_000;
const MIN_SIDE = 26;
const MAX_SIDE = 112;

/** The side of the square a coin is drawn as. Area follows value, within limits that keep it usable. */
export function coinSide(value: bigint): number {
  const side = REFERENCE_SIDE * Math.sqrt(Number(value) / REFERENCE_VALUE);
  return Math.max(MIN_SIDE, Math.min(MAX_SIDE, side));
}
