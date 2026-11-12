/**
 * A deliberately small model of transactions for the figures: outputs carry an
 * amount and the name of an owner instead of a locking script, and inputs
 * carry no signature. It keeps the part the whitepaper's sections 2 and 9 are
 * about (coins are outputs, spending consumes them whole, what is left over is
 * the fee) and nothing else. It is not Bitcoin's wire format.
 */
import { concatBytes, hashToWire, u32le, u64le, utf8, varInt, wireToHash } from './bytes';
import { sha256d } from './hash';

/** A reference to one output of an earlier transaction. */
export interface Outpoint {
  /** Id of the transaction that created the output: display-order hex, as `txid` returns it. */
  txid: string;
  /** Position of the output in that transaction, counting from 0. */
  vout: number;
}

/** An amount in satoshis and who may spend it: a name or an address, for display only. */
export interface TxOut {
  value: bigint;
  owner: string;
}

/** A transaction: the outputs it spends and the outputs it creates. */
export interface Tx {
  inputs: Outpoint[];
  outputs: TxOut[];
}

/** An unspent transaction output: where it is, how much it holds and whose it is. */
export interface Utxo extends Outpoint, TxOut {}

/** What coin selection decided: which outputs to spend and how the total divides. */
export interface Selection {
  inputs: Utxo[];
  /** Sum of the selected inputs. */
  total: bigint;
  /** `baseFee` plus `feePerInput` for each selected input. */
  fee: bigint;
  /** `total − amount − fee`: what should come back to the payer. */
  change: bigint;
}

const outpointKey = (o: Outpoint): string => `${o.txid.toLowerCase()}:${o.vout}`;

const sum = (values: bigint[]): bigint => values.reduce((a, b) => a + b, 0n);

/**
 * The transaction id: double SHA-256 of the canonical serialization, returned
 * in display order (digest reversed), like a real txid.
 *
 * The serialization follows the shape of Bitcoin's, minus version, scripts,
 * sequence numbers and lock time:
 *
 * ```
 * CompactSize   number of inputs
 * per input:    txid, 32 bytes in wire order (the display hex reversed)
 *               vout, 4 bytes little-endian
 * CompactSize   number of outputs
 * per output:   value, 8 bytes little-endian
 *               CompactSize length of owner in UTF-8 bytes, then those bytes
 * ```
 *
 * Every field is fixed-width or length-prefixed, so two different transactions
 * never serialize to the same bytes. Two transactions with identical inputs
 * and outputs are the same transaction and share an id.
 *
 * @throws RangeError if an input txid is not 64 hex characters, a vout is not
 * an unsigned 32-bit integer, or a value is outside 0 … 2^64 − 1.
 */
export function txid(tx: Tx): string {
  const parts = [varInt(tx.inputs.length)];
  for (const input of tx.inputs) {
    parts.push(hashToWire(input.txid), u32le(input.vout));
  }
  parts.push(varInt(tx.outputs.length));
  for (const output of tx.outputs) {
    const owner = utf8(output.owner);
    parts.push(u64le(output.value), varInt(owner.length), owner);
  }
  return wireToHash(sha256d(concatBytes(...parts)));
}

/** Looks up the unspent output behind each input, in input order. */
function spentOutputs(tx: Tx, utxos: Utxo[]): Utxo[] {
  const unspent = new Map(utxos.map((utxo) => [outpointKey(utxo), utxo]));
  const seen = new Set<string>();
  return tx.inputs.map((input) => {
    const key = outpointKey(input);
    const utxo = unspent.get(key);
    if (!utxo) throw new Error(`input ${key} is not an unspent output`);
    if (seen.has(key)) throw new Error(`input ${key} is spent twice by this transaction`);
    seen.add(key);
    return utxo;
  });
}

/**
 * The total value of the outputs a transaction spends.
 *
 * @throws Error if an input is not in `utxos` (never existed, or already
 * spent) or the transaction lists the same output twice.
 */
export function inputValue(tx: Tx, utxos: Utxo[]): bigint {
  return sum(spentOutputs(tx, utxos).map((utxo) => utxo.value));
}

/**
 * The fee a transaction pays: inputs minus outputs. Nothing in a transaction
 * states the fee; it is whatever the outputs leave unclaimed. The result is
 * negative when the outputs exceed the inputs, which makes the transaction
 * invalid (`applyTx` rejects it).
 *
 * @throws Error under the same conditions as {@link inputValue}.
 */
export function fee(tx: Tx, utxos: Utxo[]): bigint {
  return inputValue(tx, utxos) - sum(tx.outputs.map((output) => output.value));
}

/**
 * Applies a transaction to a UTXO set and returns the new set: the spent
 * outputs are gone and the transaction's outputs are appended, each addressed
 * by this transaction's id and its position. `utxos` is not modified.
 *
 * @throws Error if the transaction is invalid: it has no inputs, spends an
 * output that is not in the set (a double spend), lists an output twice, has a
 * negative output, or pays out more than it takes in.
 */
export function applyTx(utxos: Utxo[], tx: Tx): Utxo[] {
  if (tx.inputs.length === 0) {
    throw new Error('a transaction needs at least one input');
  }
  if (tx.outputs.some((output) => output.value < 0n)) {
    throw new Error('output values must not be negative');
  }
  const paid = fee(tx, utxos);
  if (paid < 0n) {
    throw new Error(`outputs exceed inputs by ${-paid}`);
  }
  const spent = new Set(tx.inputs.map(outpointKey));
  const id = txid(tx);
  return [
    ...utxos.filter((utxo) => !spent.has(outpointKey(utxo))),
    ...tx.outputs.map((output, vout) => ({ txid: id, vout, value: output.value, owner: output.owner })),
  ];
}

/**
 * Picks outputs to pay `amount`, with a fee of `baseFee` plus `feePerInput`
 * for every output spent (each input makes a real transaction larger, and
 * fees are charged by size).
 *
 * The strategy is the simplest one worth showing, not Bitcoin Core's:
 *
 * 1. if a single output covers amount and fee, use the smallest such output;
 * 2. otherwise add outputs from the largest down until the total covers the
 *    amount and the fee for that many inputs.
 *
 * Outputs of equal value are taken in the order they appear in `utxos`.
 *
 * @returns the selection, or `null` when no combination of `utxos` covers the
 * amount and the fee for its inputs.
 * @throws RangeError if `amount` is not positive or a fee is negative.
 */
export function selectCoins(utxos: Utxo[], amount: bigint, feePerInput: bigint, baseFee: bigint): Selection | null {
  if (amount <= 0n) throw new RangeError('amount must be positive');
  if (feePerInput < 0n || baseFee < 0n) throw new RangeError('fees must not be negative');

  const select = (inputs: Utxo[]): Selection | null => {
    const total = sum(inputs.map((utxo) => utxo.value));
    const cost = baseFee + feePerInput * BigInt(inputs.length);
    return total >= amount + cost ? { inputs, total, fee: cost, change: total - amount - cost } : null;
  };
  const byValue = (a: Utxo, b: Utxo): number => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0);

  for (const utxo of [...utxos].sort(byValue)) {
    const single = select([utxo]);
    if (single) return single;
  }
  const largestFirst = [...utxos].sort((a, b) => byValue(b, a));
  for (let count = 2; count <= largestFirst.length; count++) {
    const several = select(largestFirst.slice(0, count));
    if (several) return several;
  }
  return null;
}

/**
 * Turns a selection into a payment: one output of `amount` to `to` and, if
 * there is change worth keeping, a second output returning it to `changeTo`.
 *
 * Change smaller than `dust` gets no output of its own. It stays unclaimed and
 * so goes to the miner, on top of `sel.fee`; `fee(tx, utxos)` then reports
 * `sel.fee + sel.change`.
 *
 * @throws RangeError if the selection does not add up for this amount, that
 * is unless `sel.total === amount + sel.fee + sel.change` with `sel.change ≥ 0`.
 */
export function buildPayment(sel: Selection, to: string, amount: bigint, changeTo: string, dust: bigint): Tx {
  if (sel.change < 0n || sel.total !== amount + sel.fee + sel.change) {
    throw new RangeError('selection does not add up to amount + fee + change');
  }
  const outputs: TxOut[] = [{ value: amount, owner: to }];
  if (sel.change > 0n && sel.change >= dust) {
    outputs.push({ value: sel.change, owner: changeTo });
  }
  return { inputs: sel.inputs.map((utxo) => ({ txid: utxo.txid, vout: utxo.vout })), outputs };
}
