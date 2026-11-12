// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { coinCount, walletStatus } from './sentences';
import type { WalletStatusInput } from './sentences';
import { coinKey, parseBtc, planPayment, startingCoins } from './wallet';

const coins = startingCoins();
const sats = (btc: string) => parseBtc(btc)!;

/** The figure as it opens, unless a test says otherwise. */
const state = (over: Partial<WalletStatusInput> = {}): WalletStatusInput => ({
  badAmount: false,
  plan: { kind: 'idle' },
  amount: null,
  picked: null,
  sent: null,
  walletEmpty: false,
  ...over,
});

/** The state while paying `btc`, the wallet choosing unless coins are named by their value. */
const paying = (btc: string, pick?: string[]): WalletStatusInput => {
  const manual = pick ? new Set(coins.filter((coin) => pick.some((value) => sats(value) === coin.value)).map(coinKey)) : null;
  return state({ plan: planPayment(coins, sats(btc), manual), amount: sats(btc) });
};

describe('counting coins', () => {
  it('writes one coin in the singular', () => {
    expect(coinCount('en', 1)).toBe('1 coin');
    expect(coinCount('en', 3)).toBe('3 coins');
    expect(coinCount('zh', 1)).toBe('1 枚幣');
    expect(coinCount('zh', 3)).toBe('3 枚幣');
  });
});

describe('the status line of the wallet figure', () => {
  it('invites an amount when nothing has been typed', () => {
    expect(walletStatus('en', state())).toBe(
      'Type an amount, or press one of the amounts on offer. Nothing is sent until you press Send.',
    );
  });

  it('asks for a proper amount when the text cannot become one', () => {
    expect(walletStatus('en', state({ badAmount: true }))).toBe(
      'Enter an amount in BTC, such as 0.15, with at most eight decimal places.',
    );
  });

  it('describes a coin being split', () => {
    expect(walletStatus('en', paying('0.15'))).toBe(
      'One coin is enough. The wallet takes the smallest that covers the payment and the fee, 0.2 BTC, and splits it: 0.15 to Bob, 0.04998 back to you.',
    );
  });

  it('describes coins being combined', () => {
    expect(walletStatus('en', paying('0.6'))).toBe(
      'No single coin covers it, so the wallet combines 2 coins, worth 0.7 BTC together. 0.09997 comes back as change.',
    );
    expect(walletStatus('zh', paying('0.6'))).toBe(
      '沒有一枚幣足以單獨支付，錢包於是合併 2 枚幣，合共 0.7 BTC；其中 0.09997 以找續的形式退回。',
    );
  });

  it('describes a choice made by hand', () => {
    expect(walletStatus('en', paying('0.08', ['0.1']))).toBe(
      'Your choice: 1 coin, worth 0.1 BTC. Whatever exceeds the payment and the fee comes back as change: 0.01998.',
    );
  });

  it('explains the exact fit and the change too small to keep', () => {
    expect(walletStatus('en', paying('0.49998'))).toMatch(/^An exact fit\./);
    expect(walletStatus('en', paying('0.499977'))).toBe(
      'The change would be 0.000003 BTC, below the dust limit of 0.00000546 BTC: spending it later would cost more than it holds. So no change output is made, and the remainder is left to the fee.',
    );
  });

  it('says how much is missing, from the wallet or from the coins picked', () => {
    expect(walletStatus('en', paying('0.97'))).toBe(
      'Not enough funds. All your coins together hold 0.87 BTC, but paying 0.97 takes 0.97006 with the fee: 0.10006 more than you have.',
    );
    expect(walletStatus('en', paying('0.15', ['0.1']))).toBe(
      'The coins you picked hold 0.1 BTC, 0.05002 short of the payment and its fee. Pick another coin, or let the wallet choose.',
    );
    expect(walletStatus('en', paying('0.15', []))).toBe(
      'No coin is selected. Press a coin to spend it, or let the wallet choose.',
    );
  });

  it('counts the coins picked before an amount is typed', () => {
    expect(walletStatus('en', state({ picked: { coins: 1, total: sats('0.1') } }))).toBe(
      'You picked 1 coin, worth 0.1 BTC. Now type the amount to pay.',
    );
  });

  it('reports a payment that was sent, with and without change', () => {
    expect(walletStatus('en', state({ sent: { spent: 1, amount: sats('0.15'), change: sats('0.04998') } }))).toBe(
      'Sent. What you spent, 1 coin, no longer exists, and a new coin of 0.04998 BTC came back as change. Bob holds his 0.15 BTC as a coin of his own.',
    );
    expect(walletStatus('en', state({ sent: { spent: 2, amount: sats('0.6'), change: 0n } }))).toMatch(
      /^Sent\. What you spent, 2 coins, no longer exists, and nothing came back/,
    );
  });

  it('sets a Chinese count against the words after it without a gap', () => {
    expect(walletStatus('zh', state({ sent: { spent: 1, amount: sats('0.15'), change: sats('0.04998') } }))).toBe(
      '已發送。你花掉的 1 枚幣從此不再存在，另有一枚 0.04998 BTC 的新幣作為找續回到錢包。鮑勃收到的 0.15 BTC，則成為他自己的一枚幣。',
    );
  });

  it('says so when every coin has been spent', () => {
    expect(walletStatus('en', state({ walletEmpty: true }))).toBe('Every coin has been spent. Reset the wallet to start again.');
  });
});
