import { describe, expect, it } from 'vitest';
import {
  BANK_FEE, PRICE, balances, coinOutcome, give, holders, ledger, mintRecord, newCoin, newPayment, resetCoin,
  setMint, stepPayment,
} from './trust';
import type { Payment } from './trust';

const run = (payment: Payment, ...actions: ('pay' | 'dispute' | 'reset')[]) =>
  actions.reduce(stepPayment, payment);

describe('a payment through a bank', () => {
  it('starts with the money in the customer’s account and nothing recorded', () => {
    const payment = newPayment('bank');
    expect(payment.status).toBe('idle');
    expect(balances(payment)).toEqual({ customer: PRICE, bank: 0, merchant: 0, goodsSent: false });
    expect(ledger(payment)).toEqual([]);
  });

  it('is recorded by the bank, which keeps a fee out of what the merchant receives', () => {
    const paid = run(newPayment('bank'), 'pay');
    expect(paid.status).toBe('paid');
    expect(balances(paid)).toEqual({ customer: 0, bank: BANK_FEE, merchant: PRICE - BANK_FEE, goodsSent: true });
    expect(ledger(paid)).toEqual([
      { kind: 'payment', amount: PRICE, undone: false },
      { kind: 'fee', amount: BANK_FEE, undone: false },
    ]);
  });

  it('is reversed when the customer disputes it: the merchant has sent the goods and holds nothing', () => {
    const reversed = run(newPayment('bank'), 'pay', 'dispute');
    expect(reversed.status).toBe('reversed');
    expect(balances(reversed)).toEqual({ customer: PRICE, bank: 0, merchant: 0, goodsSent: true });
    expect(ledger(reversed)).toEqual([
      { kind: 'payment', amount: PRICE, undone: true },
      { kind: 'fee', amount: BANK_FEE, undone: true },
      { kind: 'reversal', amount: PRICE, undone: false },
    ]);
  });

  it('cannot be disputed before it is made, paid twice, or reversed twice', () => {
    const idle = newPayment('bank');
    expect(run(idle, 'dispute')).toEqual(idle);
    const paid = run(idle, 'pay');
    expect(run(paid, 'pay')).toEqual(paid);
    const reversed = run(paid, 'dispute');
    expect(run(reversed, 'dispute')).toEqual(reversed);
    expect(run(reversed, 'pay')).toEqual(reversed);
  });
});

describe('a payment handed over directly', () => {
  it('moves the whole amount, with no fee and no record anywhere', () => {
    const paid = run(newPayment('direct'), 'pay');
    expect(paid.status).toBe('paid');
    expect(balances(paid)).toEqual({ customer: 0, bank: 0, merchant: PRICE, goodsSent: true });
    expect(ledger(paid)).toEqual([]);
  });

  it('cannot be reversed: a dispute changes nothing and is only counted', () => {
    const paid = run(newPayment('direct'), 'pay');
    const disputed = run(paid, 'dispute');
    expect(disputed.status).toBe('paid');
    expect(disputed.refusals).toBe(1);
    expect(balances(disputed)).toEqual(balances(paid));
    expect(run(disputed, 'dispute').refusals).toBe(2);
  });

  it('has nothing to dispute before the money has changed hands', () => {
    const idle = newPayment('direct');
    expect(run(idle, 'dispute')).toEqual(idle);
  });
});

describe('either payment', () => {
  it('never creates or destroys money', () => {
    for (const lane of ['bank', 'direct'] as const) {
      let payment = newPayment(lane);
      for (const action of ['pay', 'dispute', 'dispute', 'pay', 'reset', 'pay'] as const) {
        payment = stepPayment(payment, action);
        const { customer, bank, merchant } = balances(payment);
        expect(customer + bank + merchant, `${lane} after ${action}`).toBe(PRICE);
      }
    }
  });

  it('goes back to the start on reset', () => {
    expect(run(newPayment('bank'), 'pay', 'dispute', 'reset')).toEqual(newPayment('bank'));
    expect(run(newPayment('direct'), 'pay', 'dispute', 'reset')).toEqual(newPayment('direct'));
  });

  it('does not mutate the state it is given', () => {
    const idle = newPayment('bank');
    stepPayment(idle, 'pay');
    expect(idle).toEqual(newPayment('bank'));
  });
});

describe('a digital coin with no one checking', () => {
  it('starts with nobody but the payer holding it', () => {
    const coin = newCoin();
    expect(coin.mint).toBe(false);
    expect(holders(coin)).toEqual([]);
    expect(coinOutcome(coin)).toBe('ready');
  });

  it('is accepted by the first payee', () => {
    const coin = give(newCoin(), 'first');
    expect(coin.attempts).toEqual([{ to: 'first', accepted: true }]);
    expect(holders(coin)).toEqual(['first']);
    expect(coinOutcome(coin)).toBe('spent-once');
  });

  it('is accepted by the second payee as well: the same coin is spent twice', () => {
    const coin = give(give(newCoin(), 'first'), 'second');
    expect(holders(coin)).toEqual(['first', 'second']);
    expect(coinOutcome(coin)).toBe('spent-twice');
  });

  it('can be spent twice in either order', () => {
    const coin = give(give(newCoin(), 'second'), 'first');
    expect(holders(coin)).toEqual(['second', 'first']);
    expect(coinOutcome(coin)).toBe('spent-twice');
  });

  it('keeps no record anywhere', () => {
    expect(mintRecord(give(give(newCoin(), 'first'), 'second'))).toBeNull();
  });

  it('is offered to each payee once', () => {
    const once = give(newCoin(), 'first');
    expect(give(once, 'first')).toEqual(once);
  });
});

describe('a digital coin checked by a mint', () => {
  const minted = setMint(newCoin(), true);

  it('is accepted the first time, and the mint records who received it', () => {
    const coin = give(minted, 'second');
    expect(coin.attempts).toEqual([{ to: 'second', accepted: true }]);
    expect(mintRecord(coin)).toBe('second');
    expect(coinOutcome(coin)).toBe('spent-once');
  });

  it('is refused the second time', () => {
    const coin = give(give(minted, 'first'), 'second');
    expect(coin.attempts).toEqual([
      { to: 'first', accepted: true },
      { to: 'second', accepted: false },
    ]);
    expect(holders(coin)).toEqual(['first']);
    expect(mintRecord(coin)).toBe('first');
    expect(coinOutcome(coin)).toBe('refused');
  });

  it('starts afresh when the mint is switched on or off', () => {
    const spentTwice = give(give(newCoin(), 'first'), 'second');
    expect(setMint(spentTwice, true)).toEqual({ mint: true, attempts: [] });
    const refused = give(give(minted, 'first'), 'second');
    expect(setMint(refused, false)).toEqual(newCoin());
  });

  it('keeps everything as it is when the switch does not change', () => {
    const coin = give(minted, 'first');
    expect(setMint(coin, true)).toBe(coin);
  });

  it('stays switched on through a reset', () => {
    const coin = give(give(minted, 'first'), 'second');
    expect(resetCoin(coin)).toEqual({ mint: true, attempts: [] });
    expect(resetCoin(give(newCoin(), 'first'))).toEqual(newCoin());
  });

  it('does not mutate the state it is given', () => {
    give(minted, 'first');
    expect(minted).toEqual({ mint: true, attempts: [] });
  });
});
