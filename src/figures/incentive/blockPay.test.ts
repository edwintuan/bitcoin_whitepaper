// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { COIN, blockSubsidy } from '@/lib/subsidy';
import { fee } from '@/lib/tx';
import {
  FEE_STEP,
  MAX_TXS,
  SAMPLES,
  addSample,
  checkCoinbase,
  claimFor,
  coinbaseLimit,
  feeOf,
  inputTotal,
  makeTx,
  outputTotal,
  rejectLine,
  stepFee,
  totalFees,
  withFee,
} from './blockPay';

describe('the sample transactions', () => {
  it('are payments that leave something for the miner', () => {
    expect(SAMPLES.length).toBeGreaterThanOrEqual(5);
    expect(MAX_TXS).toBeLessThanOrEqual(SAMPLES.length);
    for (const sample of SAMPLES) {
      expect(sample.amount).toBeGreaterThan(0n);
      expect(sample.fee).toBeGreaterThan(0n);
      expect(sample.fee % FEE_STEP).toBe(0n);
      expect(sample.input).toBeGreaterThan(sample.amount + sample.fee);
    }
    expect(new Set(SAMPLES.map((sample) => sample.id)).size).toBe(SAMPLES.length);
  });
});

describe('makeTx', () => {
  const built = makeTx(SAMPLES[0]);

  it('builds a transaction in the engine’s model: one coin in, a payment and change out', () => {
    expect(built.tx.inputs).toHaveLength(1);
    expect(built.spends).toHaveLength(1);
    expect(built.spends[0].value).toBe(SAMPLES[0].input);
    expect(built.tx.outputs).toHaveLength(2);
    expect(built.tx.outputs[0].value).toBe(SAMPLES[0].amount);
    expect(built.tx.outputs[1].value).toBe(SAMPLES[0].input - SAMPLES[0].amount - SAMPLES[0].fee);
  });

  it('leaves the fee unclaimed: the engine finds it as inputs minus outputs', () => {
    expect(fee(built.tx, built.spends)).toBe(SAMPLES[0].fee);
    expect(feeOf(built)).toBe(SAMPLES[0].fee);
    expect(inputTotal(built)).toBe(SAMPLES[0].input);
    expect(outputTotal(built)).toBe(SAMPLES[0].input - SAMPLES[0].fee);
    expect(inputTotal(built) - outputTotal(built)).toBe(feeOf(built));
  });

  it('gives every sample a coin of its own to spend', () => {
    const outpoints = SAMPLES.map((sample) => makeTx(sample).tx.inputs[0].txid);
    expect(new Set(outpoints).size).toBe(SAMPLES.length);
    for (const txid of outpoints) expect(txid).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('withFee', () => {
  const built = makeTx(SAMPLES[0]);
  const room = SAMPLES[0].input - SAMPLES[0].amount;

  it('changes the fee by changing what comes back as change; the payment is untouched', () => {
    const dearer = withFee(built, SAMPLES[0].fee + 5_000n);
    expect(feeOf(dearer)).toBe(SAMPLES[0].fee + 5_000n);
    expect(dearer.tx.outputs[0]).toEqual(built.tx.outputs[0]);
    expect(dearer.tx.outputs[1].value).toBe(built.tx.outputs[1].value - 5_000n);
    expect(inputTotal(dearer)).toBe(inputTotal(built));
    expect(feeOf(built)).toBe(SAMPLES[0].fee); // the original is not modified
  });

  it('allows a fee of zero and nothing below it', () => {
    expect(feeOf(withFee(built, 0n))).toBe(0n);
    expect(feeOf(withFee(built, -1n))).toBe(0n);
    expect(withFee(built, 0n).tx.outputs[1].value).toBe(room);
  });

  it('cannot give away more than the change: at most everything the payment leaves over', () => {
    const all = withFee(built, room + 1n);
    expect(feeOf(all)).toBe(room);
    expect(all.tx.outputs).toHaveLength(1); // no change output of zero
    expect(feeOf(withFee(all, 1_000n))).toBe(1_000n); // and the change comes back when the fee drops
    expect(withFee(all, 1_000n).tx.outputs).toHaveLength(2);
  });

  it('steps a fee up and down by a fixed amount', () => {
    expect(feeOf(stepFee(built, 1))).toBe(SAMPLES[0].fee + FEE_STEP);
    expect(feeOf(stepFee(built, -1))).toBe(SAMPLES[0].fee - FEE_STEP);
    expect(feeOf(stepFee(withFee(built, 0n), -1))).toBe(0n);
  });
});

describe('the list of transactions in the block', () => {
  it('adds the first sample that is not in the block yet, up to the limit', () => {
    let txs = [makeTx(SAMPLES[0]), makeTx(SAMPLES[2])];
    txs = addSample(txs);
    expect(txs.map((entry) => entry.id)).toEqual([SAMPLES[0].id, SAMPLES[2].id, SAMPLES[1].id]);
    while (txs.length < MAX_TXS) txs = addSample(txs);
    expect(addSample(txs)).toBe(txs);
    expect(new Set(txs.map((entry) => entry.id)).size).toBe(MAX_TXS);
  });

  it('adds up the fees', () => {
    expect(totalFees([])).toBe(0n);
    const txs = SAMPLES.slice(0, 3).map(makeTx);
    expect(totalFees(txs)).toBe(SAMPLES[0].fee + SAMPLES[1].fee + SAMPLES[2].fee);
  });
});

describe('what the coinbase may claim', () => {
  const txs = SAMPLES.slice(0, 3).map(makeTx);
  const fees = totalFees(txs);

  it('is the subsidy at the block’s height plus every fee in the block', () => {
    expect(coinbaseLimit(0, txs)).toBe(50n * COIN + fees);
    expect(coinbaseLimit(840_000, txs)).toBe(312_500_000n + fees);
    expect(coinbaseLimit(840_000, [])).toBe(blockSubsidy(840_000));
  });

  it('is the fees alone once the subsidy has run out', () => {
    expect(coinbaseLimit(6_930_000, txs)).toBe(fees);
    expect(coinbaseLimit(6_930_000, [])).toBe(0n);
  });

  it('can be claimed in full, one satoshi short, or one satoshi over', () => {
    expect(claimFor(1_000n, 'exact')).toBe(1_000n);
    expect(claimFor(1_000n, 'under')).toBe(999n);
    expect(claimFor(1_000n, 'over')).toBe(1_001n);
    expect(claimFor(0n, 'under')).toBe(0n); // nothing to leave unclaimed
  });
});

describe('checkCoinbase', () => {
  it('accepts a coinbase that claims the limit or less', () => {
    expect(checkCoinbase(312_523_000n, 312_523_000n)).toEqual({ ok: true });
    expect(checkCoinbase(312_522_999n, 312_523_000n)).toEqual({ ok: true });
    expect(checkCoinbase(0n, 0n)).toEqual({ ok: true });
  });

  it('rejects one satoshi too much, with Bitcoin Core’s reason and message', () => {
    expect(checkCoinbase(312_523_001n, 312_523_000n)).toEqual({
      ok: false,
      reason: 'bad-cb-amount',
      message: 'coinbase pays too much (actual=312523001 vs limit=312523000)',
    });
  });
});

describe('rejectLine', () => {
  it('prints the reason and the message as Bitcoin Core does, joined by a comma', () => {
    // ValidationState::ToString, src/consensus/validation.h:118-129
    const verdict = checkCoinbase(312_523_001n, 312_523_000n);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(rejectLine(verdict)).toBe('bad-cb-amount, coinbase pays too much (actual=312523001 vs limit=312523000)');
    }
  });
});
