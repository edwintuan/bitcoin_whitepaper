import { secp256k1 } from '@noble/curves/secp256k1.js';
import { bech32, createBase58check } from '@scure/base';
import { bytesToHex, concatBytes, hexToBytes } from './bytes';
import { hash160, sha256 } from './hash';

/**
 * A secp256k1 key pair. `priv` is the 32-byte private key; `pub` is the public
 * key in 33-byte compressed form: 0x02 or 0x03 (the parity of y) followed by
 * the x coordinate.
 *
 * For demonstrations only. These keys live in page memory in plain sight and
 * must never guard real funds.
 */
export interface KeyPair {
  priv: Uint8Array;
  pub: Uint8Array;
}

const base58check = createBase58check(sha256);

/** Version byte that makes a Base58Check address start with "1": mainnet pay-to-public-key-hash. */
const P2PKH_VERSION = 0x00;
/** Human-readable part of a mainnet Bech32 address. */
const BECH32_PREFIX = 'bc';
/** Witness version 0, the first data character ("q") of a P2WPKH address. */
const WITNESS_VERSION = 0;

/** Generates a key pair from the platform's cryptographic random source (`crypto.getRandomValues`). */
export function generateKeyPair(): KeyPair {
  const { secretKey, publicKey } = secp256k1.keygen();
  return { priv: secretKey, pub: publicKey };
}

/**
 * Rebuilds a key pair from a private key given as 64 hex characters, written
 * as the big-endian number it is: private key 1 is 63 zeros and a "1".
 *
 * @throws if the key is not 32 bytes or not within 1 … n − 1, n being the order of the curve.
 */
export function keyPairFromPrivate(privHex: string): KeyPair {
  const priv = hexToBytes(privHex);
  return { priv, pub: secp256k1.getPublicKey(priv, true) };
}

/**
 * Signs a 32-byte message hash with ECDSA and returns the 64-byte compact
 * signature: r then s, 32 big-endian bytes each.
 *
 * `msgHash` is signed as given and is not hashed again, so pass the digest,
 * for example `sha256(message)`. The nonce is derived from the key and the
 * hash (RFC 6979), so the same inputs always give the same signature, and `s`
 * is always in the lower half of its range ("low-S"), as Bitcoin requires of
 * standard transactions.
 *
 * @throws RangeError if `msgHash` is not 32 bytes; throws if `priv` is not a valid private key.
 */
export function sign(msgHash: Uint8Array, priv: Uint8Array): Uint8Array {
  if (msgHash.length !== 32) {
    throw new RangeError(`sign expects a 32-byte message hash, got ${msgHash.length} bytes`);
  }
  return secp256k1.sign(msgHash, priv, { prehash: false });
}

/**
 * Checks a 64-byte compact signature over a 32-byte message hash against a
 * public key. `msgHash` must be the same digest that was passed to `sign`.
 *
 * Returns `false`, never throws, for anything that does not verify: a wrong
 * key, a changed hash or signature, input of the wrong length, bytes that are
 * not a point on the curve, and the mirrored "high-S" twin of a valid signature.
 */
export function verify(sig: Uint8Array, msgHash: Uint8Array, pub: Uint8Array): boolean {
  if (sig.length !== 64 || msgHash.length !== 32) return false;
  return secp256k1.verify(sig, msgHash, pub, { prehash: false });
}

function assertCompressedPublicKey(pub: Uint8Array): void {
  if (!secp256k1.utils.isValidPublicKey(pub, true)) {
    throw new RangeError('expected a 33-byte compressed secp256k1 public key');
  }
}

function encodeP2pkh(keyHash: Uint8Array): string {
  return base58check.encode(concatBytes(Uint8Array.of(P2PKH_VERSION), keyHash));
}

function encodeP2wpkh(keyHash: Uint8Array): string {
  return bech32.encode(BECH32_PREFIX, [WITNESS_VERSION, ...bech32.toWords(keyHash)]);
}

/**
 * Derives a mainnet address from a compressed public key. Both kinds encode
 * the same 20-byte HASH160 of the key:
 *
 * - `'p2pkh'`: Base58Check of version byte 0x00 and the hash, the original "1…" form;
 * - `'p2wpkh'`: Bech32 with prefix "bc" and witness version 0 (BIP 173), the "bc1q…" form.
 *
 * @throws RangeError unless `pub` is a 33-byte compressed key on the curve.
 */
export function pubkeyToAddress(pub: Uint8Array, kind: 'p2pkh' | 'p2wpkh'): string {
  assertCompressedPublicKey(pub);
  const keyHash = hash160(pub);
  return kind === 'p2pkh' ? encodeP2pkh(keyHash) : encodeP2wpkh(keyHash);
}

/**
 * The derivation from public key to address, one stage at a time, for a figure
 * that reveals it step by step: SHA-256 of the key, then RIPEMD-160 of that
 * (together HASH160), then the two encodings of the 20-byte result. The hex
 * strings are in the hashes' own byte order; nothing here is reversed.
 *
 * @throws RangeError unless `pub` is a 33-byte compressed key on the curve.
 */
export function addressSteps(pub: Uint8Array): { sha256: string; hash160: string; p2pkh: string; p2wpkh: string } {
  assertCompressedPublicKey(pub);
  const keyHash = hash160(pub);
  return {
    sha256: bytesToHex(sha256(pub)),
    hash160: bytesToHex(keyHash),
    p2pkh: encodeP2pkh(keyHash),
    p2wpkh: encodeP2wpkh(keyHash),
  };
}
