// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { proofStatus, sizeStatus } from './sentences';
import type { ProofStatusInput } from './sentences';

/** A branch of three hashes, asked for and not yet folded, unless a test says otherwise. */
const state = (over: Partial<ProofStatusInput> = {}): ProofStatusInput => ({
  asked: true,
  folded: 0,
  steps: 3,
  ours: null,
  equal: false,
  tamper: 'none',
  ...over,
});

describe('the status line of the check', () => {
  it('asks for a payment and a proof before anything has been asked', () => {
    expect(proofStatus('en', state({ asked: false }))).toEqual({
      lead: null,
      text: 'Press a transaction to pick the payment you are waiting for. Then ask a full node to prove it is in block 2.',
    });
  });

  it('counts what the node sent, one hash for each level below the top', () => {
    expect(proofStatus('en', state()).text).toBe(
      'The node sent 3 hashes, 96 bytes in all: one for each level below the top. The rest of the tree stays out of sight.',
    );
  });

  it('says which side the wallet’s own hash went on at each step', () => {
    expect(proofStatus('en', state({ folded: 1, ours: 'left' })).text).toBe(
      'Step 1 of 3: your hash goes on the left, the sibling on the right, and the pair is hashed.',
    );
    expect(proofStatus('en', state({ folded: 2, ours: 'right' })).text).toBe(
      'Step 2 of 3: the sibling goes on the left, your hash on the right, and the pair is hashed.',
    );
  });

  it('opens the verdict with a sentence of its own', () => {
    const equal = proofStatus('en', state({ folded: 3, ours: 'left', equal: true }));
    expect(equal.lead).toBe('Equal.');
    expect(equal.text).toMatch(/^What you computed is the Merkle root in the header/);
    expect(proofStatus('zh', state({ folded: 3, ours: 'left', equal: true })).lead).toBe('相等。');
  });

  it('explains a rejection by what was tampered with', () => {
    const forged = proofStatus('en', state({ folded: 3, ours: 'left', tamper: 'tx' }));
    expect(forged.lead).toBe('Not equal.');
    expect(forged.text).toMatch(/^A payment of a different amount is a different transaction/);
    const corrupted = proofStatus('en', state({ folded: 3, ours: 'left', tamper: 'sibling' }));
    expect(corrupted.lead).toBe('Not equal.');
    expect(corrupted.text).toMatch(/^One altered hash changes every hash above it/);
    expect(proofStatus('zh', state({ folded: 3, ours: 'left', tamper: 'sibling' })).lead).toBe('不相等。');
  });
});

describe('the status line of the size scene', () => {
  it('counts the branch and says what the comparison leaves out', () => {
    expect(sizeStatus('en', 8, 3)).toBe(
      '8 transactions, 3 hashes. Double the block and the branch grows by one hash: 32 bytes. The block itself is far larger than its ids: every transaction is at least 60 bytes.',
    );
    expect(sizeStatus('en', 4096, 12)).toMatch(/^4,096 transactions, 12 hashes\./);
  });

  it('speaks Chinese without a space between its sentences', () => {
    expect(sizeStatus('zh', 8, 3)).toBe(
      '8 筆交易，3 個哈希。區塊再大一倍，分支只多一個哈希，即 32 位元組。區塊本身比這些交易 ID 大得多：每筆交易最少也有 60 位元組。',
    );
  });
});
