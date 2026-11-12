/**
 * The block of the "what a block pays" scene: a few transactions in the
 * engine's own model (`src/lib/tx.ts`), their fees, and the check a node
 * applies to the coinbase.
 */
import { sha256Hex } from '@/lib/hash';
import { blockSubsidy } from '@/lib/subsidy';
import { fee, inputValue } from '@/lib/tx';
import type { Tx, Utxo } from '@/lib/tx';

/** A payment to put in the block: who pays whom, from a coin of what size, leaving what fee. */
export interface Sample {
  id: string;
  from: string;
  to: string;
  /** Value of the one coin the payer spends, in satoshis. */
  input: bigint;
  /** What the recipient gets. */
  amount: bigint;
  /** What the outputs leave unclaimed to begin with. */
  fee: bigint;
}

/** How much one press of − or + changes a fee, in satoshis. */
export const FEE_STEP = 1_000n;

/** The scene shows at most this many transactions, so the block stays readable on a phone. */
export const MAX_TXS = 5;

/** Example payments. The amounts are made up; nothing here describes real fee levels. */
export const SAMPLES: readonly Sample[] = [
  { id: 'a', from: 'alice', to: 'bob', input: 50_000_000n, amount: 20_000_000n, fee: 4_000n },
  { id: 'b', from: 'bob', to: 'carol', input: 12_000_000n, amount: 5_000_000n, fee: 2_000n },
  { id: 'c', from: 'carol', to: 'dan', input: 300_000_000n, amount: 250_000_000n, fee: 9_000n },
  { id: 'd', from: 'dan', to: 'erin', input: 2_500_000n, amount: 1_200_000n, fee: 1_000n },
  { id: 'e', from: 'erin', to: 'alice', input: 80_000_000n, amount: 79_000_000n, fee: 6_000n },
  { id: 'f', from: 'frank', to: 'carol', input: 7_000_000n, amount: 3_300_000n, fee: 3_000n },
];

/** A transaction in the block, with the coin it spends, so its fee can be worked out. */
export interface BlockTx {
  /** Id of the sample it was made from. */
  id: string;
  sample: Sample;
  tx: Tx;
  /** The unspent outputs its inputs refer to. */
  spends: Utxo[];
}

const build = (sample: Sample, change: bigint): BlockTx => {
  // The coin being spent is named by a real hash of a label, as an outpoint needs one.
  const coin: Utxo = {
    txid: sha256Hex(`coin of ${sample.from} (${sample.id})`),
    vout: 0,
    value: sample.input,
    owner: sample.from,
  };
  const outputs = [{ value: sample.amount, owner: sample.to }];
  if (change > 0n) outputs.push({ value: change, owner: sample.from });
  return { id: sample.id, sample, tx: { inputs: [{ txid: coin.txid, vout: coin.vout }], outputs }, spends: [coin] };
};

/** Builds a sample as a transaction: one coin in; a payment and the change out. */
export function makeTx(sample: Sample): BlockTx {
  return build(sample, sample.input - sample.amount - sample.fee);
}

/** Sum of the coins a transaction spends. */
export function inputTotal(entry: BlockTx): bigint {
  return inputValue(entry.tx, entry.spends);
}

/** Sum of the outputs it creates. */
export function outputTotal(entry: BlockTx): bigint {
  return entry.tx.outputs.reduce((sum, output) => sum + output.value, 0n);
}

/** Its fee: whatever the outputs leave unclaimed, as the engine computes it. */
export function feeOf(entry: BlockTx): bigint {
  return fee(entry.tx, entry.spends);
}

/**
 * The same payment with a different fee. Nothing in a transaction states the
 * fee, so the only way to change it is to change an output: here the change
 * that returns to the payer. The fee is held between zero and everything the
 * payment leaves over; at that upper end there is no change output at all.
 */
export function withFee(entry: BlockTx, wanted: bigint): BlockTx {
  const room = entry.sample.input - entry.sample.amount;
  const next = wanted < 0n ? 0n : wanted > room ? room : wanted;
  return build(entry.sample, room - next);
}

/** One step of {@link FEE_STEP} up (`1`) or down (`-1`). */
export function stepFee(entry: BlockTx, direction: 1 | -1): BlockTx {
  return withFee(entry, feeOf(entry) + BigInt(direction) * FEE_STEP);
}

/** Adds the first sample that is not in the block yet. Returns the same list when the block is full. */
export function addSample(txs: BlockTx[]): BlockTx[] {
  if (txs.length >= MAX_TXS) return txs;
  const next = SAMPLES.find((sample) => !txs.some((entry) => entry.id === sample.id));
  return next ? [...txs, makeTx(next)] : txs;
}

/** All the fees in the block. */
export function totalFees(txs: BlockTx[]): bigint {
  return txs.reduce((sum, entry) => sum + feeOf(entry), 0n);
}

/**
 * The most the coinbase of a block at `height` may pay out: subsidy plus fees
 * (`blockReward` in `ConnectBlock`, Bitcoin Core v32.1, src/validation.cpp:2608).
 */
export function coinbaseLimit(height: number, txs: BlockTx[]): bigint {
  return blockSubsidy(height) + totalFees(txs);
}

/** What the reader has the coinbase claim, relative to the limit. */
export type Claim = 'under' | 'exact' | 'over';

/** The amount for a claim. One satoshi under a limit of zero is still zero. */
export function claimFor(limit: bigint, claim: Claim): bigint {
  if (claim === 'over') return limit + 1n;
  if (claim === 'under') return limit > 0n ? limit - 1n : 0n;
  return limit;
}

/**
 * The check every node makes on a block's coinbase (src/validation.cpp:2609-2612).
 * More than the limit makes the whole block invalid; the reason and the
 * wording of the message are Bitcoin Core's. Less than the limit is allowed.
 */
export function checkCoinbase(
  actual: bigint,
  limit: bigint,
): { ok: true } | { ok: false; reason: 'bad-cb-amount'; message: string } {
  if (actual > limit) {
    return {
      ok: false,
      reason: 'bad-cb-amount',
      message: `coinbase pays too much (actual=${actual} vs limit=${limit})`,
    };
  }
  return { ok: true };
}

/**
 * A rejection as Bitcoin Core prints it: the reason, then the message, joined
 * by a comma (`ValidationState::ToString`, src/consensus/validation.h:118-129).
 */
export function rejectLine(verdict: { reason: string; message: string }): string {
  return `${verdict.reason}, ${verdict.message}`;
}
