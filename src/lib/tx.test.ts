// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { sha256Hex } from './hash';
import { applyTx, buildPayment, fee, inputValue, selectCoins, txid } from './tx';
import type { Selection, Tx, Utxo } from './tx';

/** An unspent output to seed a wallet with; its txid is just a hash of its name. */
const coin = (name: string, value: bigint, owner = 'alice'): Utxo => ({
  txid: sha256Hex(name), vout: 0, value, owner,
});
const total = (utxos: Utxo[]) => utxos.reduce((sum, u) => sum + u.value, 0n);

describe('txid', () => {
  // Modelled on the first bitcoin payment: one 50 BTC coin in, 10 BTC to Hal, 40 BTC back.
  const payment: Tx = {
    inputs: [{ txid: '0437cd7f8525ceed2324359c2d0ba26006d92d856a9c20fa0241106ee5a597c9', vout: 0 }],
    outputs: [{ value: 1_000_000_000n, owner: 'hal' }, { value: 4_000_000_000n, owner: 'satoshi' }],
  };

  // Expected ids were computed from the documented layout by a separate script
  // that shares no code with this project.
  it('hashes the canonical serialization (known answers)', () => {
    expect(txid(payment)).toBe('e9d3498a72993807cc79e17ad62ee55af59899c7ba780d4cec53a7e6de048a01');
    expect(txid({
      inputs: [
        { txid: 'b1fea52486ce0c62bb442b530a3f0132b826c74e473d1f2c220bfa78111c5082', vout: 0 },
        { txid: 'f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e9831e9e16', vout: 1 },
      ],
      outputs: [{ value: 123_456_789n, owner: '陳大文' }],
    })).toBe('0ed78c44e1fde8f8e46c65c50649bebe79d365d3ac1e32e2a593cd7ca2957aa3');
    expect(txid({ inputs: [], outputs: [] })).toBe('905c0ed9955a5c67b7edc8881fe862fddce009a2294ef8f4ba03834b4aeb7f40');
  });
  it('is stable for equal transactions', () => {
    const copy: Tx = {
      inputs: payment.inputs.map((i) => ({ ...i })),
      outputs: payment.outputs.map((o) => ({ ...o })),
    };
    expect(txid(copy)).toBe(txid(payment));
    expect(txid(payment)).toMatch(/^[0-9a-f]{64}$/);
  });
  it('treats the input txid as case-insensitive hex', () => {
    const shouted: Tx = { ...payment, inputs: [{ txid: payment.inputs[0].txid.toUpperCase(), vout: 0 }] };
    expect(txid(shouted)).toBe(txid(payment));
  });
  it('changes when any field changes', () => {
    const [input] = payment.inputs;
    const [toHal, change] = payment.outputs;
    const variants: Tx[] = [
      { ...payment, inputs: [{ ...input, txid: sha256Hex('another coin') }] },
      { ...payment, inputs: [{ ...input, vout: 1 }] },
      { ...payment, inputs: [input, { txid: sha256Hex('another coin'), vout: 0 }] },
      { ...payment, inputs: [] },
      { ...payment, outputs: [{ ...toHal, value: toHal.value + 1n }, change] },
      { ...payment, outputs: [{ ...toHal, owner: 'hal ' }, change] },
      { ...payment, outputs: [toHal, { ...change, owner: 'Satoshi' }] },
      { ...payment, outputs: [change, toHal] },
      { ...payment, outputs: [toHal] },
      { ...payment, outputs: [toHal, change, { value: 0n, owner: '' }] },
    ];
    const ids = new Set(variants.map(txid));
    expect(ids.size).toBe(variants.length);
    expect(ids.has(txid(payment))).toBe(false);
  });
  it('changes when inputs are reordered', () => {
    const a = { txid: sha256Hex('a'), vout: 0 };
    const b = { txid: sha256Hex('b'), vout: 0 };
    expect(txid({ inputs: [a, b], outputs: [] })).not.toBe(txid({ inputs: [b, a], outputs: [] }));
  });
  it('frames owner names so that neighbours cannot blur into each other', () => {
    const split = (first: string, second: string): Tx => ({
      inputs: [],
      outputs: [{ value: 1n, owner: first }, { value: 1n, owner: second }],
    });
    expect(txid(split('ab', 'c'))).not.toBe(txid(split('a', 'bc')));
  });
  it('rejects fields it cannot serialize', () => {
    expect(() => txid({ inputs: [{ txid: 'abcd', vout: 0 }], outputs: [] })).toThrow(RangeError);
    expect(() => txid({ inputs: [{ txid: sha256Hex('a'), vout: -1 }], outputs: [] })).toThrow(RangeError);
    expect(() => txid({ inputs: [{ txid: sha256Hex('a'), vout: 0.5 }], outputs: [] })).toThrow(RangeError);
    expect(() => txid({ inputs: [], outputs: [{ value: -1n, owner: 'bob' }] })).toThrow(RangeError);
  });
});

describe('inputValue and fee', () => {
  const utxos = [coin('a', 70n), coin('b', 30n), { ...coin('a', 5n), vout: 1 }];
  const spend = (outputs: bigint[], inputs = [utxos[0], utxos[1]]): Tx => ({
    inputs: inputs.map(({ txid: id, vout }) => ({ txid: id, vout })),
    outputs: outputs.map((value) => ({ value, owner: 'bob' })),
  });

  it('adds up the outputs being spent', () => {
    expect(inputValue(spend([]), utxos)).toBe(100n);
    expect(inputValue(spend([], [utxos[1]]), utxos)).toBe(30n);
    expect(inputValue({ inputs: [], outputs: [] }, utxos)).toBe(0n);
  });
  it('tells apart two outputs of the same transaction', () => {
    expect(inputValue(spend([], [utxos[2]]), utxos)).toBe(5n);
    expect(inputValue(spend([], [utxos[0], utxos[2]]), utxos)).toBe(75n);
  });
  it('charges whatever the outputs leave behind', () => {
    expect(fee(spend([60n, 39n]), utxos)).toBe(1n);
    expect(fee(spend([100n]), utxos)).toBe(0n);
    expect(fee(spend([]), utxos)).toBe(100n);
  });
  it('reports a negative fee, without throwing, when outputs exceed inputs', () => {
    expect(fee(spend([150n]), utxos)).toBe(-50n);
  });
  it('throws when an input is not among the unspent outputs', () => {
    const missing: Tx = { inputs: [{ txid: sha256Hex('nowhere'), vout: 0 }], outputs: [] };
    expect(() => inputValue(missing, utxos)).toThrow(/not an unspent output/);
    expect(() => fee(missing, utxos)).toThrow(/not an unspent output/);
    expect(() => inputValue(spend([], [{ ...utxos[1], vout: 7 }]), utxos)).toThrow(/not an unspent output/);
  });
  it('throws when one transaction lists the same output twice', () => {
    expect(() => inputValue(spend([], [utxos[0], utxos[0]]), utxos)).toThrow(/twice/);
  });
  it('finds an input whose txid is written in upper case', () => {
    const shouted: Tx = { inputs: [{ txid: utxos[1].txid.toUpperCase(), vout: 0 }], outputs: [] };
    expect(inputValue(shouted, utxos)).toBe(30n);
  });
});

describe('applyTx', () => {
  const a = coin('a', 70n);
  const b = coin('b', 30n);
  const c = coin('c', 8n, 'carol');
  const utxos = [a, b, c];
  const pay: Tx = {
    inputs: [{ txid: a.txid, vout: 0 }, { txid: b.txid, vout: 0 }],
    outputs: [{ value: 60n, owner: 'bob' }, { value: 39n, owner: 'alice' }],
  };

  it('removes the spent outputs and appends the new ones', () => {
    expect(applyTx(utxos, pay)).toEqual([
      c,
      { txid: txid(pay), vout: 0, value: 60n, owner: 'bob' },
      { txid: txid(pay), vout: 1, value: 39n, owner: 'alice' },
    ]);
  });
  it('returns a new set and leaves the old one as it was', () => {
    const before = [...utxos];
    const after = applyTx(utxos, pay);
    expect(after).not.toBe(utxos);
    expect(utxos).toEqual(before);
  });
  it('takes exactly the fee out of circulation', () => {
    expect(total(utxos) - total(applyTx(utxos, pay))).toBe(fee(pay, utxos));
    expect(fee(pay, utxos)).toBe(1n);
  });
  it('lets the new outputs be spent in turn', () => {
    const after = applyTx(utxos, pay);
    const next: Tx = { inputs: [{ txid: txid(pay), vout: 0 }], outputs: [{ value: 60n, owner: 'dave' }] };
    expect(applyTx(after, next)).toEqual([
      c,
      { txid: txid(pay), vout: 1, value: 39n, owner: 'alice' },
      { txid: txid(next), vout: 0, value: 60n, owner: 'dave' },
    ]);
  });
  it('accepts a transaction that pays no fee, and one that pays everything as fee', () => {
    const noFee: Tx = { inputs: [{ txid: c.txid, vout: 0 }], outputs: [{ value: 8n, owner: 'erin' }] };
    const allFee: Tx = { inputs: [{ txid: c.txid, vout: 0 }], outputs: [] };
    expect(total(applyTx(utxos, noFee))).toBe(total(utxos));
    expect(applyTx(utxos, allFee)).toEqual([a, b]);
  });

  it('throws when the same output is spent by a second transaction', () => {
    const after = applyTx(utxos, pay);
    const again: Tx = { inputs: [{ txid: a.txid, vout: 0 }], outputs: [{ value: 70n, owner: 'mallory' }] };
    expect(() => applyTx(after, again)).toThrow(/not an unspent output/);
    expect(() => applyTx(after, pay)).toThrow(/not an unspent output/);
  });
  it('throws when one transaction spends the same output twice', () => {
    const twice: Tx = {
      inputs: [{ txid: a.txid, vout: 0 }, { txid: a.txid, vout: 0 }],
      outputs: [{ value: 140n, owner: 'mallory' }],
    };
    expect(() => applyTx(utxos, twice)).toThrow(/twice/);
  });
  it('throws when outputs exceed inputs', () => {
    const greedy: Tx = { inputs: [{ txid: c.txid, vout: 0 }], outputs: [{ value: 9n, owner: 'mallory' }] };
    expect(() => applyTx(utxos, greedy)).toThrow(/exceed/);
  });
  it('throws on a negative output, even when the totals would balance', () => {
    const trick: Tx = {
      inputs: [{ txid: c.txid, vout: 0 }],
      outputs: [{ value: 1_000n, owner: 'mallory' }, { value: -992n, owner: 'mallory' }],
    };
    expect(() => applyTx(utxos, trick)).toThrow(/negative/);
  });
  it('throws on a transaction with no inputs, which would create coins from nothing', () => {
    expect(() => applyTx(utxos, { inputs: [], outputs: [{ value: 0n, owner: 'mallory' }] })).toThrow(/at least one input/);
    expect(() => applyTx(utxos, { inputs: [], outputs: [] })).toThrow(/at least one input/);
  });
});

describe('selectCoins', () => {
  const wallet = [coin('five', 5n), coin('fifty', 50n), coin('twenty', 20n), coin('hundred', 100n)];
  const values = (sel: Selection | null) => sel?.inputs.map((u) => u.value);

  it('prefers the smallest single output that covers amount and fee', () => {
    expect(selectCoins(wallet, 15n, 1n, 2n)).toEqual({ inputs: [wallet[2]], total: 20n, fee: 3n, change: 2n });
    expect(values(selectCoins(wallet, 21n, 0n, 0n))).toEqual([50n]);
    expect(values(selectCoins(wallet, 5n, 0n, 0n))).toEqual([5n]);
  });
  it('counts the fee when judging whether one output is enough', () => {
    // 20 covers the amount but not the amount plus a fee of 1.
    expect(selectCoins(wallet, 20n, 1n, 0n)).toEqual({ inputs: [wallet[1]], total: 50n, fee: 1n, change: 29n });
  });
  it('otherwise adds outputs from the largest down until the total suffices', () => {
    expect(selectCoins(wallet, 120n, 1n, 0n)).toEqual({
      inputs: [wallet[3], wallet[1]], total: 150n, fee: 2n, change: 28n,
    });
    expect(values(selectCoins(wallet, 160n, 0n, 0n))).toEqual([100n, 50n, 20n]);
  });
  it('charges for every input it adds', () => {
    const tens = [coin('x', 10n), coin('y', 10n), coin('z', 10n)];
    // Two tens make 20, but two inputs cost 2: a third is needed.
    expect(selectCoins(tens, 19n, 1n, 0n)).toEqual({ inputs: tens, total: 30n, fee: 3n, change: 8n });
    expect(selectCoins(tens, 15n, 1n, 4n)).toEqual({ inputs: [tens[0], tens[1], tens[2]], total: 30n, fee: 7n, change: 8n });
  });
  it('leaves no change when the coins fit exactly', () => {
    expect(selectCoins(wallet, 47n, 1n, 2n)).toEqual({ inputs: [wallet[1]], total: 50n, fee: 3n, change: 0n });
    expect(selectCoins(wallet, 175n, 0n, 0n)?.change).toBe(0n);
  });
  it('returns null when the wallet cannot cover amount and fee', () => {
    expect(selectCoins(wallet, 176n, 0n, 0n)).toBeNull();
    expect(selectCoins(wallet, 175n, 1n, 0n)).toBeNull(); // enough for the amount, not for the fee
    expect(selectCoins(wallet, 172n, 0n, 4n)).toBeNull();
    expect(selectCoins([], 1n, 0n, 0n)).toBeNull();
  });
  it('breaks ties by wallet order', () => {
    const twins = [coin('first', 10n), coin('second', 10n), coin('third', 10n)];
    expect(selectCoins(twins, 7n, 0n, 0n)?.inputs).toEqual([twins[0]]);
    expect(selectCoins(twins, 17n, 0n, 0n)?.inputs).toEqual([twins[0], twins[1]]);
  });
  it('does not reorder or change the wallet it is given', () => {
    const before = [...wallet];
    selectCoins(wallet, 120n, 1n, 0n);
    expect(wallet).toEqual(before);
  });
  it('rejects an amount that is not positive, and negative fees', () => {
    expect(() => selectCoins(wallet, 0n, 0n, 0n)).toThrow(RangeError);
    expect(() => selectCoins(wallet, -5n, 0n, 0n)).toThrow(RangeError);
    expect(() => selectCoins(wallet, 5n, -1n, 0n)).toThrow(RangeError);
    expect(() => selectCoins(wallet, 5n, 0n, -1n)).toThrow(RangeError);
  });
});

describe('buildPayment', () => {
  const wallet = [coin('five', 5n), coin('fifty', 50n), coin('twenty', 20n), coin('hundred', 100n)];

  it('pays the recipient and returns the change', () => {
    const sel = selectCoins(wallet, 30n, 1n, 2n) as Selection;
    expect(buildPayment(sel, 'bob', 30n, 'alice', 5n)).toEqual({
      inputs: [{ txid: wallet[1].txid, vout: 0 }],
      outputs: [{ value: 30n, owner: 'bob' }, { value: 17n, owner: 'alice' }],
    });
  });
  it('spends the selection so that the fee paid is the fee selected', () => {
    const sel = selectCoins(wallet, 120n, 1n, 3n) as Selection;
    const tx = buildPayment(sel, 'bob', 120n, 'alice', 5n);
    expect(fee(tx, wallet)).toBe(sel.fee);
    expect(applyTx(wallet, tx)).toEqual([
      wallet[0],
      wallet[2],
      { txid: txid(tx), vout: 0, value: 120n, owner: 'bob' },
      { txid: txid(tx), vout: 1, value: sel.change, owner: 'alice' },
    ]);
  });
  it('folds change below the dust limit into the fee instead of creating an output', () => {
    const sel = selectCoins(wallet, 15n, 1n, 2n) as Selection; // spends the 20: change is 2
    const tx = buildPayment(sel, 'bob', 15n, 'alice', 3n);
    expect(tx.outputs).toEqual([{ value: 15n, owner: 'bob' }]);
    expect(fee(tx, wallet)).toBe(sel.fee + sel.change);
  });
  it('keeps change that is exactly the dust limit', () => {
    const sel = selectCoins(wallet, 15n, 1n, 2n) as Selection;
    expect(buildPayment(sel, 'bob', 15n, 'alice', 2n).outputs).toEqual([
      { value: 15n, owner: 'bob' }, { value: 2n, owner: 'alice' },
    ]);
  });
  it('creates no empty change output when the coins fit exactly', () => {
    const sel = selectCoins(wallet, 47n, 1n, 2n) as Selection;
    expect(buildPayment(sel, 'bob', 47n, 'alice', 0n).outputs).toEqual([{ value: 47n, owner: 'bob' }]);
  });
  it('rejects a selection that was made for a different amount', () => {
    const sel = selectCoins(wallet, 30n, 1n, 2n) as Selection;
    expect(() => buildPayment(sel, 'bob', 31n, 'alice', 5n)).toThrow(RangeError);
    expect(() => buildPayment({ ...sel, change: -1n, total: sel.total - sel.change - 1n }, 'bob', 30n, 'alice', 5n)).toThrow(RangeError);
  });
});
