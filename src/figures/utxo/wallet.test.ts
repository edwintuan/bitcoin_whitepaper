// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { fee, txid } from '@/lib/tx';
import type { Utxo } from '@/lib/tx';
import {
  BASE_FEE,
  DUST,
  FEE_PER_INPUT,
  PAYEE,
  YOU,
  coinKey,
  coinSide,
  edgeAmounts,
  mine,
  parseBtc,
  planPayment,
  readAmount,
  send,
  startingCoins,
} from './wallet';
import type { Plan } from './wallet';

const BTC = 100_000_000n;
const sats = (btc: string) => parseBtc(btc)!;
const total = (coins: Utxo[]) => coins.reduce((sum, coin) => sum + coin.value, 0n);
const values = (coins: Utxo[]) => coins.map((coin) => coin.value);

function ready(plan: Plan) {
  if (plan.kind !== 'ready') throw new Error(`expected a ready plan, got ${plan.kind}`);
  return plan;
}
function short(plan: Plan) {
  if (plan.kind !== 'short') throw new Error(`expected a short plan, got ${plan.kind}`);
  return plan;
}

describe('startingCoins', () => {
  const coins = startingCoins();

  it('is five real unspent outputs of different sizes, all yours', () => {
    expect(values(coins)).toEqual([sats('0.5'), sats('0.2'), sats('0.1'), sats('0.05'), sats('0.02')]);
    expect(new Set(coins.map(coinKey)).size).toBe(5);
    for (const coin of coins) {
      expect(coin.owner).toBe(YOU);
      expect(coin.txid).toMatch(/^[0-9a-f]{64}$/);
    }
    expect(total(coins)).toBe(sats('0.87'));
  });

  it('is the same wallet every time', () => {
    expect(startingCoins()).toEqual(coins);
  });
});

describe('parseBtc', () => {
  it('reads an amount in bitcoin as satoshis', () => {
    expect(parseBtc('0.15')).toBe(15_000_000n);
    expect(parseBtc('1')).toBe(BTC);
    expect(parseBtc('.5')).toBe(50_000_000n);
    expect(parseBtc('2.')).toBe(2n * BTC);
    expect(parseBtc('0.00000001')).toBe(1n);
    expect(parseBtc(' 0.2 ')).toBe(20_000_000n);
    expect(parseBtc('21000000')).toBe(21_000_000n * BTC);
  });

  it('refuses what is not a positive amount with at most eight decimals', () => {
    for (const text of ['', ' ', '.', 'abc', '-1', '+1', '1,5', '1e3', '0.000000001', '0', '0.0', '1 2', '0x10']) {
      expect(parseBtc(text), JSON.stringify(text)).toBeNull();
    }
  });
});

describe('readAmount', () => {
  it('reads a positive amount as satoshis', () => {
    expect(readAmount('0.15')).toEqual({ kind: 'amount', sats: 15_000_000n });
    expect(readAmount(' 2. ')).toEqual({ kind: 'amount', sats: 2n * BTC });
    expect(readAmount('0.00000001')).toEqual({ kind: 'amount', sats: 1n });
  });

  it('takes nothing, or only zeros so far, for an amount that is still being typed', () => {
    for (const text of ['', ' ', '0', '0.', '.', '0.0', '00', '0.00000000', ' 0.0 ']) {
      expect(readAmount(text), JSON.stringify(text)).toEqual({ kind: 'unfinished' });
    }
  });

  it('follows 0.15 key by key without once calling it wrong', () => {
    expect(['0', '0.', '0.1', '0.15'].map((text) => readAmount(text).kind)).toEqual(['unfinished', 'unfinished', 'amount', 'amount']);
  });

  it('says so when the text cannot become an amount', () => {
    for (const text of ['abc', '-1', '+1', '1,5', '1e3', '0.000000001', '0.000000000', '1 2', '0x10']) {
      expect(readAmount(text), JSON.stringify(text)).toEqual({ kind: 'bad' });
    }
  });

  it('reads full-width digits, as a Chinese input method types them', () => {
    expect(readAmount('０．１５')).toEqual({ kind: 'amount', sats: 15_000_000n });
    expect(readAmount('０．')).toEqual({ kind: 'unfinished' });
  });
});

describe('planPayment, letting the wallet choose', () => {
  const coins = startingCoins();

  it('is idle until there is an amount', () => {
    expect(planPayment(coins, null, null)).toEqual({ kind: 'idle' });
  });

  it('splits one coin: the smallest that covers the amount and the fee', () => {
    const plan = ready(planPayment(coins, sats('0.15'), null));
    expect(plan.manual).toBe(false);
    expect(values(plan.selection.inputs)).toEqual([sats('0.2')]);
    expect(plan.tx.outputs).toEqual([
      { value: sats('0.15'), owner: PAYEE },
      { value: sats('0.04998'), owner: YOU },
    ]);
    expect(plan.fee).toBe(BASE_FEE + FEE_PER_INPUT);
    expect(plan.change).toBe(sats('0.04998'));
    expect(plan.dust).toBe(0n);
    expect(plan.outcome).toBe('change');
  });

  it('combines coins when no single one is enough, and charges for each input', () => {
    const plan = ready(planPayment(coins, sats('0.6'), null));
    expect(values(plan.selection.inputs)).toEqual([sats('0.5'), sats('0.2')]);
    expect(plan.fee).toBe(BASE_FEE + 2n * FEE_PER_INPUT);
    expect(plan.change).toBe(sats('0.09997'));
    expect(plan.outcome).toBe('change');
  });

  it('reports the fee the engine measures: inputs minus outputs', () => {
    for (const amount of ['0.15', '0.6', '0.01', '0.86']) {
      const plan = ready(planPayment(coins, sats(amount), null));
      expect(plan.fee).toBe(fee(plan.tx, coins));
      expect(plan.selection.total).toBe(sats(amount) + plan.fee + plan.change);
    }
  });

  it('makes no change output when the coin matches exactly', () => {
    const plan = ready(planPayment(coins, sats('0.19998'), null));
    expect(plan.tx.outputs).toEqual([{ value: sats('0.19998'), owner: PAYEE }]);
    expect(plan.change).toBe(0n);
    expect(plan.dust).toBe(0n);
    expect(plan.fee).toBe(2_000n);
    expect(plan.outcome).toBe('exact');
  });

  it('leaves change below the dust limit to the fee', () => {
    const plan = ready(planPayment(coins, sats('0.199977'), null));
    expect(plan.tx.outputs).toEqual([{ value: sats('0.199977'), owner: PAYEE }]);
    expect(plan.change).toBe(0n);
    expect(plan.dust).toBe(300n);
    expect(plan.dust < DUST).toBe(true);
    expect(plan.fee).toBe(2_300n);
    expect(plan.outcome).toBe('dust');
  });

  it('keeps change that is exactly at the dust limit', () => {
    const plan = ready(planPayment(coins, sats('0.2') - 2_000n - DUST, null));
    expect(plan.change).toBe(DUST);
    expect(plan.outcome).toBe('change');
  });

  it('says how much is missing when the whole wallet is not enough', () => {
    const plan = short(planPayment(coins, sats('1'), null));
    expect(plan.manual).toBe(false);
    expect(plan.total).toBe(sats('0.87'));
    expect(plan.fee).toBe(BASE_FEE + 5n * FEE_PER_INPUT);
    expect(plan.missing).toBe(sats('1') + plan.fee - sats('0.87'));
  });

  it('cannot send the whole balance: the fee has to come from somewhere', () => {
    expect(short(planPayment(coins, sats('0.87'), null)).missing).toBe(BASE_FEE + 5n * FEE_PER_INPUT);
    expect(ready(planPayment(coins, sats('0.87') - 6_000n, null)).outcome).toBe('exact');
  });

  it('has nothing to offer from an empty wallet', () => {
    expect(short(planPayment([], sats('0.1'), null)).missing).toBe(sats('0.1') + BASE_FEE);
  });
});

describe('planPayment, with coins chosen by hand', () => {
  const coins = startingCoins();
  const pick = (...btc: string[]) => new Set(btc.map((value) => coinKey(coins.find((coin) => coin.value === sats(value))!)));

  it('spends exactly the coins picked, however wasteful', () => {
    const plan = ready(planPayment(coins, sats('0.15'), pick('0.5')));
    expect(plan.manual).toBe(true);
    expect(values(plan.selection.inputs)).toEqual([sats('0.5')]);
    expect(plan.change).toBe(sats('0.34998'));
    expect(plan.fee).toBe(fee(plan.tx, coins));
  });

  it('keeps the wallet’s order for the inputs', () => {
    const plan = ready(planPayment(coins, sats('0.1'), pick('0.02', '0.05', '0.1')));
    expect(values(plan.selection.inputs)).toEqual([sats('0.1'), sats('0.05'), sats('0.02')]);
    expect(plan.fee).toBe(BASE_FEE + 3n * FEE_PER_INPUT);
    expect(plan.change).toBe(sats('0.17') - sats('0.1') - 4_000n);
  });

  it('says how much the picked coins fall short', () => {
    const plan = short(planPayment(coins, sats('0.15'), pick('0.05')));
    expect(plan.manual).toBe(true);
    expect(values(plan.inputs)).toEqual([sats('0.05')]);
    expect(plan.missing).toBe(sats('0.15') + 2_000n - sats('0.05'));
  });

  it('needs at least one coin', () => {
    expect(short(planPayment(coins, sats('0.15'), new Set())).missing).toBe(sats('0.15') + BASE_FEE);
  });

  it('ignores a pick that is no longer in the wallet', () => {
    const gone = new Set(['00'.repeat(32) + ':0']);
    expect(short(planPayment(coins, sats('0.15'), gone)).inputs).toEqual([]);
  });

  it('applies the same exact and dust rules', () => {
    expect(ready(planPayment(coins, sats('0.09998'), pick('0.1'))).outcome).toBe('exact');
    const dusty = ready(planPayment(coins, sats('0.09998') - 100n, pick('0.1')));
    expect([dusty.outcome, dusty.dust, dusty.fee]).toEqual(['dust', 100n, 2_100n]);
  });
});

describe('send', () => {
  const start = startingCoins();
  const plan = ready(planPayment(start, sats('0.15'), null));
  const after = send(start, plan);

  it('removes the spent coin and brings the change back as a new one', () => {
    expect(values(mine(after))).toEqual([sats('0.5'), sats('0.1'), sats('0.05'), sats('0.02'), sats('0.04998')]);
    const change = mine(after)[4];
    expect(change.txid).toBe(txid(plan.tx));
    expect(change.vout).toBe(1);
  });

  it('creates the payment as a coin for the payee', () => {
    const theirs = after.filter((coin) => coin.owner === PAYEE);
    expect(theirs).toEqual([{ txid: txid(plan.tx), vout: 0, value: sats('0.15'), owner: PAYEE }]);
  });

  it('destroys nothing but the fee', () => {
    expect(total(after)).toBe(total(start) - plan.fee);
  });

  it('does not touch the set it was given', () => {
    expect(start).toEqual(startingCoins());
  });

  it('lets the change be spent in the next payment', () => {
    const next = ready(planPayment(mine(after), sats('0.04'), null));
    expect(values(next.selection.inputs)).toEqual([sats('0.04998')]);
    const later = send(after, next);
    expect(total(later)).toBe(total(start) - plan.fee - next.fee);
    expect(later.filter((coin) => coin.owner === PAYEE)).toHaveLength(2);
  });

  it('refuses to spend the same coin twice', () => {
    expect(() => send(after, plan)).toThrow();
  });
});

describe('edgeAmounts', () => {
  it('finds amounts that show each special case in the wallet as it stands', () => {
    const coins = startingCoins();
    const edge = edgeAmounts(coins)!;
    expect(ready(planPayment(coins, edge.exact, null)).outcome).toBe('exact');
    expect(ready(planPayment(coins, edge.dust, null)).outcome).toBe('dust');
    expect(planPayment(coins, edge.tooMuch, null).kind).toBe('short');
  });

  it('still works after the wallet has changed', () => {
    let coins = startingCoins();
    for (const amount of ['0.15', '0.6', '0.04']) {
      coins = send(coins, ready(planPayment(mine(coins), sats(amount), null)));
      const edge = edgeAmounts(mine(coins))!;
      expect(ready(planPayment(mine(coins), edge.exact, null)).outcome).toBe('exact');
      expect(ready(planPayment(mine(coins), edge.dust, null)).outcome).toBe('dust');
      expect(planPayment(mine(coins), edge.tooMuch, null).kind).toBe('short');
    }
  });

  it('has nothing to suggest for an empty wallet', () => {
    expect(edgeAmounts([])).toBeNull();
  });
});

describe('coinSide', () => {
  it('draws a coin as a square whose area follows its value', () => {
    const half = coinSide(sats('0.5'));
    const eighth = coinSide(sats('0.125'));
    expect(half / eighth).toBeCloseTo(2, 5);
  });

  it('keeps the smallest coins large enough to press', () => {
    expect(coinSide(1n)).toBe(coinSide(sats('0.0001')));
    expect(coinSide(1n)).toBeGreaterThanOrEqual(24);
  });

  it('never lets one coin outgrow a phone screen', () => {
    expect(coinSide(sats('21000000'))).toBeLessThanOrEqual(120);
  });
});
