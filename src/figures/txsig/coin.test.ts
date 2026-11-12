// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bytesToHex, concatBytes, hexToBytes } from '@/lib/bytes';
import { sha256 } from '@/lib/hash';
import { keyPairFromPrivate, verify } from '@/lib/keys';
import {
  EARLIER_TX, buildCoin, checkTransfer, coinProblems, redirect, signTransfer, signatureHolds, transferHash,
} from './coin';

const key = (n: number) => keyPairFromPrivate(n.toString(16).padStart(64, '0'));

/** Owner 0 is off the left edge of the figure; owners 1 to 3 are shown. */
const OWNERS = [key(11), key(12), key(13), key(14)];
const ATTACKER = key(99);
const pubHex = (index: number) => bytesToHex(OWNERS[index].pub);

describe('transferHash', () => {
  it('is the SHA-256 of the previous transaction’s hash followed by the next owner’s public key', () => {
    const prev = 'ab'.repeat(32);
    const expected = bytesToHex(sha256(concatBytes(hexToBytes(prev), OWNERS[1].pub)));
    expect(transferHash({ prev, to: pubHex(1) })).toBe(expected);
  });

  it('changes when either part changes', () => {
    const base = transferHash({ prev: EARLIER_TX, to: pubHex(1) });
    expect(transferHash({ prev: EARLIER_TX, to: pubHex(2) })).not.toBe(base);
    expect(transferHash({ prev: 'cd'.repeat(32), to: pubHex(1) })).not.toBe(base);
  });
});

describe('signTransfer', () => {
  const transfer = signTransfer(EARLIER_TX, OWNERS[1].pub, OWNERS[0]);

  it('names the next owner and the transaction being spent', () => {
    expect(transfer.to).toBe(pubHex(1));
    expect(transfer.prev).toBe(EARLIER_TX);
  });

  it('carries a real 64-byte signature by the current owner over the transfer’s hash', () => {
    expect(transfer.sig).toMatch(/^[0-9a-f]{128}$/);
    expect(verify(hexToBytes(transfer.sig), hexToBytes(transferHash(transfer)), OWNERS[0].pub)).toBe(true);
  });

  it('verifies under the signer’s key and no other', () => {
    expect(signatureHolds(transfer, pubHex(0))).toBe(true);
    expect(signatureHolds(transfer, pubHex(1))).toBe(false);
    expect(signatureHolds(transfer, bytesToHex(ATTACKER.pub))).toBe(false);
  });

  it('never throws on a key or signature that is not well formed', () => {
    expect(signatureHolds(transfer, '00')).toBe(false);
    expect(signatureHolds({ ...transfer, sig: 'ff' }, pubHex(0))).toBe(false);
  });
});

describe('buildCoin', () => {
  const coin = buildCoin(OWNERS);

  it('makes one transfer for each change of hands', () => {
    expect(coin).toHaveLength(3);
    expect(coin.map((transfer) => transfer.to)).toEqual([pubHex(1), pubHex(2), pubHex(3)]);
  });

  it('chains each transfer to the hash of the one before', () => {
    expect(coin[0].prev).toBe(EARLIER_TX);
    expect(coin[1].prev).toBe(transferHash(coin[0]));
    expect(coin[2].prev).toBe(transferHash(coin[1]));
  });

  it('has every transfer signed by the owner the previous transfer paid', () => {
    expect(signatureHolds(coin[0], pubHex(0))).toBe(true);
    expect(signatureHolds(coin[1], coin[0].to)).toBe(true);
    expect(signatureHolds(coin[2], coin[1].to)).toBe(true);
  });

  it('checks out as a chain of ownership', () => {
    expect(coinProblems(coin, pubHex(0))).toEqual([null, null, null]);
  });

  it('is the same coin every time for the same keys', () => {
    expect(buildCoin(OWNERS)).toEqual(coin);
  });

  it('does not check out if the first signer is someone else', () => {
    expect(coinProblems(coin, bytesToHex(ATTACKER.pub))).toEqual(['signature', 'link', 'link']);
  });
});

describe('redirect', () => {
  const coin = buildCoin(OWNERS);
  const attacker = bytesToHex(ATTACKER.pub);

  it('rewrites who one transfer pays and nothing else', () => {
    const forged = redirect(coin, 1, ATTACKER.pub);
    expect(forged[1]).toEqual({ ...coin[1], to: attacker });
    expect(forged[0]).toBe(coin[0]);
    expect(forged[2]).toBe(coin[2]);
    expect(coin[1].to).toBe(pubHex(2)); // the original is not mutated
  });

  it('changes the hash of that transfer, so the old signature no longer fits', () => {
    const forged = redirect(coin, 1, ATTACKER.pub);
    expect(transferHash(forged[1])).not.toBe(transferHash(coin[1]));
    expect(signatureHolds(forged[1], pubHex(1))).toBe(false);
  });

  it('breaks the rewritten transfer and cuts off every transfer after it', () => {
    expect(coinProblems(redirect(coin, 1, ATTACKER.pub), pubHex(0))).toEqual([null, 'signature', 'link']);
    expect(coinProblems(redirect(coin, 0, ATTACKER.pub), pubHex(0))).toEqual(['signature', 'link', 'link']);
    expect(coinProblems(redirect(coin, 2, ATTACKER.pub), pubHex(0))).toEqual([null, null, 'signature']);
  });

  it('cannot be patched up by the attacker signing in the owner’s place', () => {
    const forged = redirect(coin, 1, ATTACKER.pub);
    const resigned = forged.map((transfer, i) => (i === 1 ? signTransfer(transfer.prev, ATTACKER.pub, ATTACKER) : transfer));
    // The signature is now valid, but it is the attacker's, not Owner 1's.
    expect(signatureHolds(resigned[1], attacker)).toBe(true);
    expect(coinProblems(resigned, pubHex(0))[1]).toBe('signature');
  });

  it('is undone by putting the real recipient back', () => {
    const forged = redirect(coin, 1, ATTACKER.pub);
    expect(coinProblems(redirect(forged, 1, OWNERS[2].pub), pubHex(0))).toEqual([null, null, null]);
  });
});

describe('the gap: one coin signed over twice', () => {
  const coin = buildCoin(OWNERS);
  const someoneElse = key(15);
  const second = signTransfer(coin[2].prev, someoneElse.pub, OWNERS[2]);

  it('gives two transfers that spend the same transaction and pay different people', () => {
    expect(second.prev).toBe(coin[2].prev);
    expect(second.to).not.toBe(coin[2].to);
  });

  it('has a valid signature by the same owner on both', () => {
    expect(signatureHolds(coin[2], pubHex(2))).toBe(true);
    expect(signatureHolds(second, pubHex(2))).toBe(true);
  });

  it('passes every check a payee can make from the signatures alone, whichever one they are shown', () => {
    expect(coinProblems([coin[0], coin[1], coin[2]], pubHex(0))).toEqual([null, null, null]);
    expect(coinProblems([coin[0], coin[1], second], pubHex(0))).toEqual([null, null, null]);
  });
});

describe('checkTransfer', () => {
  const coin = buildCoin(OWNERS);

  it('passes each transfer of an untouched coin', () => {
    expect([0, 1, 2].map((index) => checkTransfer(coin, index, pubHex(0)))).toEqual([null, null, null]);
  });

  it('fails the rewritten transfer on its signature', () => {
    expect(checkTransfer(redirect(coin, 1, ATTACKER.pub), 1, pubHex(0))).toBe('signature');
  });

  it('still passes a transfer that comes before the rewritten one', () => {
    expect(checkTransfer(redirect(coin, 1, ATTACKER.pub), 0, pubHex(0))).toBeNull();
  });

  it('fails a later transfer on its link, because it checks the chain behind it too', () => {
    expect(checkTransfer(redirect(coin, 1, ATTACKER.pub), 2, pubHex(0))).toBe('link');
    // Transfer 3 follows from transfer 2 as written, but transfer 2 no longer follows from anything.
    expect(checkTransfer(redirect(coin, 0, ATTACKER.pub), 2, pubHex(0))).toBe('link');
  });

  it('agrees with a check of the whole coin, transfer by transfer', () => {
    for (const forged of [coin, redirect(coin, 0, ATTACKER.pub), redirect(coin, 1, ATTACKER.pub), redirect(coin, 2, ATTACKER.pub)]) {
      const whole = coinProblems(forged, pubHex(0));
      expect(forged.map((_, index) => checkTransfer(forged, index, pubHex(0)))).toEqual(whole);
    }
  });

  it('does not look at transfers that come after the one asked about', () => {
    const broken = [coin[0], coin[1], { ...coin[2], sig: 'ff' }];
    expect(checkTransfer(broken, 1, pubHex(0))).toBeNull();
    expect(checkTransfer(broken, 2, pubHex(0))).toBe('signature');
  });
});
