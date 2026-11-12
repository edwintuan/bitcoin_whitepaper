// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SECTIONS } from '@/content/sections';
import { STEPS, afterWalletAction } from './walkthrough';

const sats = (btc: number) => BigInt(Math.round(btc * 1e8));

describe('the guided steps of the wallet figure', () => {
  it('has one entry for each step the chapter writes', () => {
    const section = SECTIONS.find((entry) => entry.id === 'combining-splitting-value')!;
    expect(STEPS).toHaveLength(section.figure!.steps.en.length);
    expect(STEPS).toHaveLength(section.figure!.steps.zh.length);
  });

  it('types the amount each step talks about and points at one part', () => {
    expect(STEPS.map((step) => step.amount)).toEqual(['', '0.15', '0.6', '0.15', '0.15']);
    expect(STEPS.map((step) => step.highlight)).toEqual(['wallet', 'tx', 'tx', 'fee', 'send']);
  });
});

describe('pressing a coin by hand', () => {
  it('lets the walkthrough go in every step but the last: jumping to "Press Send" with nothing to send would be untrue', () => {
    for (const step of [0, 1, 2, 3]) expect(afterWalletAction(step, { kind: 'coin' }), `step ${step}`).toBeNull();
  });

  it('stays in the last step, which invites the reader to choose coins', () => {
    expect(afterWalletAction(4, { kind: 'coin' })).toBeUndefined();
  });
});

describe('giving an amount by hand in the first step', () => {
  it('moves to the step that pays that amount', () => {
    expect(afterWalletAction(0, { kind: 'amount', sats: sats(0.15) })).toBe(1);
    expect(afterWalletAction(0, { kind: 'amount', sats: sats(0.6) })).toBe(2);
  });

  it('stays while the amount is unfinished or one no step talks about', () => {
    expect(afterWalletAction(0, { kind: 'amount', sats: null })).toBeUndefined();
    expect(afterWalletAction(0, { kind: 'amount', sats: sats(0.1) })).toBeUndefined();
  });

  it('leaves the later steps where they are', () => {
    for (const step of [1, 2, 3, 4]) {
      expect(afterWalletAction(step, { kind: 'amount', sats: sats(0.6) }), `step ${step}`).toBeUndefined();
    }
  });
});

describe('the other actions', () => {
  it('goes to the step about the fee for a special case', () => {
    for (const step of [0, 1, 2, 4]) expect(afterWalletAction(step, { kind: 'special' })).toBe(3);
    expect(afterWalletAction(3, { kind: 'special' })).toBeUndefined();
  });

  it('goes to the last step once a payment is sent', () => {
    for (const step of [0, 1, 2, 3]) expect(afterWalletAction(step, { kind: 'send' })).toBe(4);
    expect(afterWalletAction(4, { kind: 'send' })).toBeUndefined();
  });

  it('goes back to the first step when the wallet is reset', () => {
    for (const step of [1, 2, 3, 4]) expect(afterWalletAction(step, { kind: 'reset' })).toBe(0);
    expect(afterWalletAction(0, { kind: 'reset' })).toBeUndefined();
  });

  it('never pulls a reader who is exploring freely back into the walkthrough', () => {
    for (const kind of ['coin', 'special', 'send', 'reset'] as const) {
      expect(afterWalletAction(null, { kind })).toBeUndefined();
    }
    expect(afterWalletAction(null, { kind: 'amount', sats: sats(0.15) })).toBeUndefined();
  });
});
