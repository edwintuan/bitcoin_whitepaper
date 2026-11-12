import { ripemd160 } from '@noble/hashes/legacy.js';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8 } from './bytes';

/** SHA-256 of the bytes: a 32-byte digest. */
export function sha256(b: Uint8Array): Uint8Array {
  return nobleSha256(b);
}

/**
 * Double SHA-256, `SHA-256(SHA-256(b))`: the hash Bitcoin uses for block
 * headers, transaction ids, Merkle nodes and message checksums.
 *
 * Byte order: the 32 bytes come back exactly as SHA-256 emits them, which is
 * the order Bitcoin puts on the wire. A block hash or txid shown to a reader
 * is these bytes reversed; `headerHash`, `txid` and the Merkle functions do
 * that reversal for you and return display-order hex.
 */
export function sha256d(b: Uint8Array): Uint8Array {
  return nobleSha256(nobleSha256(b));
}

/**
 * HASH160, `RIPEMD-160(SHA-256(b))`: the 20-byte fingerprint of a public key
 * that a P2PKH or P2WPKH address encodes. Never reversed for display.
 */
export function hash160(b: Uint8Array): Uint8Array {
  return ripemd160(nobleSha256(b));
}

/**
 * SHA-256 of a string's UTF-8 bytes, as lower-case hex in the digest's own
 * byte order (not reversed). For hashing text a reader types.
 */
export function sha256Hex(s: string): string {
  return bytesToHex(nobleSha256(utf8(s)));
}
