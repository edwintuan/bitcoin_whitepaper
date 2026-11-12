// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes, utf8 } from './bytes';
import { sha256 } from './hash';
import {
  addressSteps, generateKeyPair, keyPairFromPrivate, pubkeyToAddress, sign, verify,
} from './keys';

/** The order of the secp256k1 group: valid private keys are 1 … N − 1. */
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const hex32 = (n: bigint) => n.toString(16).padStart(64, '0');

const PRIV_1 = hex32(1n);
const PUB_1 = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
const digest = (text: string) => sha256(utf8(text));

describe('key pairs', () => {
  it('derives the generator point from private key 1', () => {
    const pair = keyPairFromPrivate(PRIV_1);
    expect(bytesToHex(pair.pub)).toBe(PUB_1);
    expect(bytesToHex(pair.priv)).toBe(PRIV_1);
  });
  it('derives other well-known compressed public keys', () => {
    const cases: [string, string][] = [
      [hex32(2n), '02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5'],
      [hex32(3n), '02f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9'],
      // N − 1 is the negation of the generator: same x, odd y, so the prefix is 03.
      [hex32(N - 1n), '0379be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'],
      // Worked example in "Mastering Bitcoin", chapter 4.
      ['3aba4162c7251c891207b747840551a71939b0de081f85c4e44cf7c13e41daa6', '025c0de3b9c8ab18dd04e3511243ec2952002dbfadc864b9628910169d9b9b00ec'],
    ];
    for (const [priv, pub] of cases) expect(bytesToHex(keyPairFromPrivate(priv).pub)).toBe(pub);
  });
  it('rejects private keys outside 1 … N − 1 or of the wrong length', () => {
    expect(() => keyPairFromPrivate(hex32(0n))).toThrow();
    expect(() => keyPairFromPrivate(hex32(N))).toThrow();
    expect(() => keyPairFromPrivate('f'.repeat(64))).toThrow();
    expect(() => keyPairFromPrivate('01')).toThrow();
    expect(() => keyPairFromPrivate(PRIV_1 + '00')).toThrow();
    expect(() => keyPairFromPrivate('zz'.repeat(32))).toThrow();
  });
  it('generates a fresh, well-formed pair every time', () => {
    const a = generateKeyPair();
    const b = generateKeyPair();
    expect(bytesToHex(a.priv)).not.toBe(bytesToHex(b.priv));
    expect(bytesToHex(a.pub)).not.toBe(bytesToHex(b.pub));
    for (const pair of [a, b]) {
      expect(pair.priv).toHaveLength(32);
      expect(pair.pub).toHaveLength(33);
      expect([2, 3]).toContain(pair.pub[0]);
      expect(bytesToHex(keyPairFromPrivate(bytesToHex(pair.priv)).pub)).toBe(bytesToHex(pair.pub));
    }
  });
});

describe('signatures', () => {
  const { priv, pub } = keyPairFromPrivate(PRIV_1);
  const msg = digest('Satoshi Nakamoto');
  const sig = sign(msg, priv);

  // Published RFC 6979 test vectors for secp256k1 with SHA-256 and low-S,
  // each also recomputed with an independent big-integer implementation.
  const RFC6979: [string, string, string][] = [
    [PRIV_1, 'Satoshi Nakamoto',
      '934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8' + '2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5'],
    [PRIV_1, 'All those moments will be lost in time, like tears in rain. Time to die...',
      '8600dbd41e348fe5c9465ab92d23e3db8b98b873beecd930736488696438cb6b' + '547fe64427496db33bf66019dacbf0039c04199abb0122918601db38a72cfc21'],
    [hex32(N - 1n), 'Satoshi Nakamoto',
      'fd567d121db66e382991534ada77a6bd3106f0a1098c231e47993447cd6af2d0' + '6b39cd0eb1bc8603e159ef5c20a5c8ad685a45b06ce9bebed3f153d10d93bed5'],
    ['f8b8af8ce3c7cca5e300d33939540c10d45ce001b8f252bfbc57ba0342904181', 'Alan Turing',
      '7063ae83e7f62bbb171798131b4a0564b956930092b33b07b395615d9ec7e15c' + '58dfcc1e00a35e1572f366ffe34ba0fc47db1e7189759b9fb233c5b05ab388ea'],
  ];

  it.each(RFC6979)('signs the given 32-byte hash as is, deterministically (key %s, "%s")', (privHex, text, want) => {
    const pair = keyPairFromPrivate(privHex);
    const signature = sign(digest(text), pair.priv);
    expect(bytesToHex(signature)).toBe(want);
    expect(verify(signature, digest(text), pair.pub)).toBe(true);
  });
  it('produces a 64-byte compact signature that verifies', () => {
    expect(sig).toHaveLength(64);
    expect(verify(sig, msg, pub)).toBe(true);
  });
  it('fails when any byte of the message hash changes', () => {
    for (let i = 0; i < msg.length; i++) {
      const tampered = Uint8Array.from(msg);
      tampered[i] ^= 0x01;
      expect(verify(sig, tampered, pub)).toBe(false);
    }
  });
  it('fails when any byte of the signature changes', () => {
    for (let i = 0; i < sig.length; i++) {
      const tampered = Uint8Array.from(sig);
      tampered[i] ^= 0x01;
      expect(verify(tampered, msg, pub)).toBe(false);
    }
  });
  it('fails under any other public key', () => {
    expect(verify(sig, msg, keyPairFromPrivate(hex32(2n)).pub)).toBe(false);
    expect(verify(sig, msg, keyPairFromPrivate(hex32(N - 1n)).pub)).toBe(false);
    expect(verify(sig, msg, generateKeyPair().pub)).toBe(false);
  });
  it('rejects the mirrored high-S form of a valid signature', () => {
    const s = BigInt(`0x${bytesToHex(sig.subarray(32))}`);
    const mirrored = Uint8Array.from(sig);
    mirrored.set(hexToBytes(hex32(N - s)), 32);
    expect(verify(mirrored, msg, pub)).toBe(false);
  });
  it('answers false, rather than throwing, for malformed input', () => {
    expect(verify(sig.subarray(0, 63), msg, pub)).toBe(false);
    expect(verify(new Uint8Array(65), msg, pub)).toBe(false);
    expect(verify(new Uint8Array(64), msg, pub)).toBe(false);
    expect(verify(sig, msg.subarray(0, 31), pub)).toBe(false);
    expect(verify(sig, msg, pub.subarray(0, 32))).toBe(false);
    expect(verify(sig, msg, new Uint8Array(33))).toBe(false);
    expect(verify(sig, msg, hexToBytes('02' + 'ff'.repeat(32)))).toBe(false);
  });
  it('works with a freshly generated pair', () => {
    const pair = generateKeyPair();
    const fresh = sign(msg, pair.priv);
    expect(verify(fresh, msg, pair.pub)).toBe(true);
    expect(verify(fresh, msg, pub)).toBe(false);
  });
  it('refuses to sign anything but a 32-byte hash, or with an invalid key', () => {
    expect(() => sign(utf8('Satoshi Nakamoto'), priv)).toThrow(RangeError);
    expect(() => sign(new Uint8Array(0), priv)).toThrow(RangeError);
    expect(() => sign(msg, new Uint8Array(32))).toThrow();
    expect(() => sign(msg, priv.subarray(1))).toThrow();
  });
  it('does not modify its inputs', () => {
    const before = [bytesToHex(msg), bytesToHex(priv), bytesToHex(pub), bytesToHex(sig)];
    sign(msg, priv);
    verify(sig, msg, pub);
    expect([bytesToHex(msg), bytesToHex(priv), bytesToHex(pub), bytesToHex(sig)]).toEqual(before);
  });
});

describe('addresses', () => {
  const pub1 = hexToBytes(PUB_1);

  it('encodes the BIP 173 example key as P2PKH and P2WPKH', () => {
    expect(pubkeyToAddress(pub1, 'p2pkh')).toBe('1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
    expect(pubkeyToAddress(pub1, 'p2wpkh')).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
  });
  it('encodes the "Mastering Bitcoin" example key', () => {
    const pub = hexToBytes('025c0de3b9c8ab18dd04e3511243ec2952002dbfadc864b9628910169d9b9b00ec');
    expect(pubkeyToAddress(pub, 'p2pkh')).toBe('14cxpo3MBCYYWCgF74SWTdcmxipnGUsPw3');
  });
  it('keeps the leading 1 that stands for a leading zero byte of the hash', () => {
    // HASH160 of the key for private key 2 starts with 0x06; Base58Check still needs the version byte's "1".
    expect(pubkeyToAddress(keyPairFromPrivate(hex32(2n)).pub, 'p2pkh')).toBe('1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP');
  });
  it('shows every step from public key to address (Bitcoin wiki worked example)', () => {
    const pub = hexToBytes('0250863ad64a87ae8a2fe83c1af1a8403cb53f53e486d8511dad8a04887e5b2352');
    expect(addressSteps(pub)).toEqual({
      sha256: '0b7c28c9b7290c98d7438e70b3d3f7c848fbd7d1dc194ff83f4f7cc9b1378e98',
      hash160: 'f54a5851e9372b87810a8e60cdd2e7cfd80b6e31',
      p2pkh: '1PMycacnJaSqwwJqjawXBErnLsZ7RkXUAs',
      p2wpkh: 'bc1q7499s50fxu4c0qg23esvm5h8elvqkm33r2tdza',
    });
  });
  it('shows the steps for the generator key', () => {
    expect(addressSteps(pub1)).toEqual({
      sha256: '0f715baf5d4c2ed329785cef29e562f73488c8a2bb9dbc5700b361d54b9b0554',
      hash160: '751e76e8199196d454941c45d1b3a323f1433bd6',
      p2pkh: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
      p2wpkh: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    });
  });
  it('gives different addresses to the two keys that share an x coordinate', () => {
    const mirror = keyPairFromPrivate(hex32(N - 1n)).pub;
    expect(pubkeyToAddress(mirror, 'p2pkh')).toBe('1GrLCmVQXoyJXaPJQdqssNqwxvha1eUo2E');
    expect(pubkeyToAddress(mirror, 'p2wpkh')).toBe('bc1q4h0ycu78h88wzldxc7e79vhw5xsde0n8jk4wl5');
  });
  it('rejects anything that is not a compressed public key on the curve', () => {
    const uncompressed = hexToBytes(
      '04' + '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' +
      '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
    );
    for (const bad of [uncompressed, pub1.subarray(0, 32), new Uint8Array(33), hexToBytes('02' + 'ff'.repeat(32)), new Uint8Array(0)]) {
      expect(() => pubkeyToAddress(bad, 'p2pkh')).toThrow(RangeError);
      expect(() => pubkeyToAddress(bad, 'p2wpkh')).toThrow(RangeError);
      expect(() => addressSteps(bad)).toThrow(RangeError);
    }
  });
});
