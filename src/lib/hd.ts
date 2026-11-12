/**
 * Hierarchical deterministic keys: the private-key half of BIP 32, enough to
 * derive a wallet's addresses from one seed. The privacy figure and the HD
 * wallet card use it so that the "fresh address for every payment" they show
 * is a real derivation and not a list of unrelated random keys.
 *
 * For demonstrations only: seeds used on the page are public.
 */
import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex, concatBytes, hexToBytes, utf8 } from './bytes';
import { keyPairFromPrivate } from './keys';

/** Indices from here up are hardened: written with an apostrophe, 0' = 2^31. */
export const HARDENED = 0x80000000;

/** The order of the secp256k1 group. Private keys are integers modulo this number. */
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

/** An extended private key (BIP 32): a key, its chain code, and the public key that goes with it. */
export interface HdKey {
  /** 32-byte private key. */
  priv: Uint8Array;
  /** 32 bytes of extra entropy that make the children depend on more than the key. */
  chainCode: Uint8Array;
  /** 33-byte compressed public key. */
  pub: Uint8Array;
}

const toBigInt = (bytes: Uint8Array): bigint => BigInt(`0x${bytesToHex(bytes)}`);
const to32Bytes = (value: bigint): Uint8Array => hexToBytes(value.toString(16).padStart(64, '0'));

/** ser32 of the BIP: four bytes, most significant first. */
function ser32(index: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, index, false);
  return out;
}

function extended(priv: Uint8Array, chainCode: Uint8Array): HdKey {
  // Throws for a key outside 1 … n − 1, which BIP 32 also declares invalid.
  return { priv, chainCode, pub: keyPairFromPrivate(bytesToHex(priv)).pub };
}

/**
 * Refuses a key that is not one this module could have made: the two halves
 * must be 32 bytes each and the public key must be the private key's own.
 * Deriving from anything else would give a child that looks valid and is not.
 */
function assertExtended(key: HdKey): void {
  if (key.priv.length !== 32 || key.chainCode.length !== 32) {
    throw new RangeError(
      `an extended key is a 32-byte key and a 32-byte chain code, got ${key.priv.length} and ${key.chainCode.length} bytes`,
    );
  }
  let pub: Uint8Array;
  try {
    pub = keyPairFromPrivate(bytesToHex(key.priv)).pub;
  } catch {
    throw new RangeError('the private key of an extended key must be within 1 … n − 1');
  }
  if (bytesToHex(pub) !== bytesToHex(key.pub)) {
    throw new RangeError('the public key of an extended key must be the one its private key gives');
  }
}

/**
 * The master key of a wallet: `HMAC-SHA512(key = "Bitcoin seed", data = seed)`,
 * left half the private key, right half the chain code (BIP 32, "Master key
 * generation").
 *
 * @throws RangeError unless the seed is 16 to 64 bytes long; throws for the
 * one seed in about 2^127 whose left half is 0 or not below n, which BIP 32
 * declares an invalid master key.
 */
export function masterFromSeed(seed: Uint8Array): HdKey {
  if (seed.length < 16 || seed.length > 64) {
    throw new RangeError(`a BIP 32 seed is 16 to 64 bytes, got ${seed.length}`);
  }
  const I = hmac(sha512, utf8('Bitcoin seed'), seed);
  return extended(I.slice(0, 32), I.slice(32));
}

/**
 * CKDpriv of BIP 32: the child of `parent` at `index`.
 *
 * A hardened child (index ≥ 2^31) is derived from the parent's private key; a
 * normal child from its public key, which is why a normal child's public key
 * can also be worked out by someone who holds only the parent's public key
 * and chain code. In both cases the child's private key is the left half of
 * the HMAC plus the parent's key, modulo the order of the curve.
 *
 * @throws RangeError unless `index` is an unsigned 32-bit integer and `parent`
 * is a well-formed extended key: a 32-byte private key within 1 … n − 1, a
 * 32-byte chain code, and the public key that belongs to that private key.
 * Throws for the one-in-2^127 index whose key is invalid, where BIP 32 says to
 * move on to the next index.
 */
export function deriveChild(parent: HdKey, index: number): HdKey {
  assertExtended(parent);
  return ckdPriv(parent, index);
}

/** CKDpriv itself, for a parent already known to be well formed. */
function ckdPriv(parent: HdKey, index: number): HdKey {
  if (!Number.isInteger(index) || index < 0 || index > 0xffffffff) {
    throw new RangeError(`a child index is an unsigned 32-bit integer, got ${index}`);
  }
  const data =
    index >= HARDENED
      ? concatBytes(Uint8Array.of(0), parent.priv, ser32(index))
      : concatBytes(parent.pub, ser32(index));
  const I = hmac(sha512, parent.chainCode, data);
  const tweak = toBigInt(I.slice(0, 32));
  const child = (tweak + toBigInt(parent.priv)) % N;
  if (tweak >= N || child === 0n) {
    throw new RangeError(`index ${index} gives an invalid key; use the next index`);
  }
  return extended(to32Bytes(child), I.slice(32));
}

/**
 * Follows a written path such as `m/84'/0'/0'/0/5` down from the master key.
 * A hardened step may be marked with `'`, `h` or `H`.
 *
 * @throws RangeError unless the path is `m` followed by steps of the form `/number` or `/number'`,
 * each number below 2^31, and `master` is a well-formed extended key (see `deriveChild`).
 */
export function derivePath(master: HdKey, path: string): HdKey {
  const steps = path.split('/');
  if (steps[0] !== 'm') throw new RangeError(`a derivation path starts at m: ${path}`);
  assertExtended(master);
  // Checked once: every key below is made here, so it is well formed by construction.
  let key = master;
  for (const step of steps.slice(1)) {
    const match = /^(\d+)(['hH]?)$/.exec(step);
    const number = match ? Number(match[1]) : Number.NaN;
    if (!match || !(number < HARDENED)) throw new RangeError(`not a derivation path: ${path}`);
    key = ckdPriv(key, match[2] ? number + HARDENED : number);
  }
  return key;
}
