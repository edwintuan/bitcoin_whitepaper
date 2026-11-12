import {
  bytesToHex as nobleBytesToHex,
  concatBytes as nobleConcatBytes,
  hexToBytes as nobleHexToBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

/**
 * Decodes a hex string into bytes, in the order written: the first two
 * characters become byte 0. Accepts upper and lower case.
 *
 * @throws RangeError on odd length or any non-hex character (no `0x`, no spaces).
 */
export function hexToBytes(hex: string): Uint8Array {
  return nobleHexToBytes(hex);
}

/** Encodes bytes as lower-case hex, in the order stored: byte 0 comes first. */
export function bytesToHex(b: Uint8Array): string {
  return nobleBytesToHex(b);
}

/**
 * Returns a reversed copy; the input is left untouched.
 *
 * This is the one conversion between the two byte orders of a Bitcoin hash.
 * Hashing produces 32 bytes that go on the wire as they are, while block
 * explorers print the same bytes back to front. Across this app a hash held as
 * a hex string is always in that printed "display order"; {@link hashToWire}
 * and {@link wireToHash} apply the reversal at the boundary.
 */
export function reverseBytes(b: Uint8Array): Uint8Array {
  return Uint8Array.from(b).reverse();
}

/**
 * Converts a block hash or txid from the hex string the app passes around
 * (display order, big-endian, as block explorers print it) into the 32 bytes
 * Bitcoin serializes (little-endian, i.e. the string read back to front).
 *
 * @throws RangeError unless `hashHex` is exactly 64 hex characters.
 */
export function hashToWire(hashHex: string): Uint8Array {
  const bytes = hexToBytes(hashHex);
  if (bytes.length !== 32) {
    throw new RangeError(`expected a 32-byte hash (64 hex characters), got ${bytes.length} bytes`);
  }
  return bytes.reverse();
}

/**
 * The inverse of {@link hashToWire}: turns 32 bytes in wire order, such as the
 * raw output of `sha256d`, into lower-case display-order hex.
 *
 * @throws RangeError unless `bytes` is exactly 32 bytes long.
 */
export function wireToHash(bytes: Uint8Array): string {
  if (bytes.length !== 32) {
    throw new RangeError(`expected a 32-byte hash, got ${bytes.length} bytes`);
  }
  return bytesToHex(reverseBytes(bytes));
}

/** Joins the parts, in order, into one freshly allocated array. */
export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  return nobleConcatBytes(...parts);
}

/**
 * Encodes an unsigned 32-bit integer as 4 little-endian bytes, the layout of
 * the version, time, bits and nonce fields of a block header.
 *
 * @throws RangeError unless `n` is an integer within 0 … 2^32 − 1.
 */
export function u32le(n: number): Uint8Array {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) {
    throw new RangeError(`u32le expects an integer within 0 … 2^32 − 1, got ${n}`);
  }
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, n, true);
  return out;
}

/**
 * Encodes an unsigned 64-bit integer as 8 little-endian bytes, the layout of
 * an amount in satoshis.
 *
 * @throws RangeError unless `n` is within 0 … 2^64 − 1.
 */
export function u64le(n: bigint): Uint8Array {
  if (n < 0n || n > 0xffffffffffffffffn) {
    throw new RangeError(`u64le expects a value within 0 … 2^64 − 1, got ${n}`);
  }
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, n, true);
  return out;
}

/**
 * Encodes a count as a Bitcoin CompactSize ("varint"), always in the shortest
 * form: one byte below 0xfd; otherwise a marker byte (0xfd, 0xfe or 0xff)
 * followed by the value as 2, 4 or 8 little-endian bytes (`WriteCompactSize`,
 * Bitcoin Core v32.1, src/serialize.h:302-324).
 *
 * @throws RangeError unless `n` is a non-negative safe integer.
 */
export function varInt(n: number): Uint8Array {
  if (!Number.isSafeInteger(n) || n < 0) {
    throw new RangeError(`varInt expects a non-negative safe integer, got ${n}`);
  }
  if (n < 0xfd) return Uint8Array.of(n);
  if (n <= 0xffff) return Uint8Array.of(0xfd, n & 0xff, n >>> 8);
  if (n <= 0xffffffff) return concatBytes(Uint8Array.of(0xfe), u32le(n));
  return concatBytes(Uint8Array.of(0xff), u64le(BigInt(n)));
}

/** Encodes a string as UTF-8 bytes. */
export function utf8(s: string): Uint8Array {
  return utf8ToBytes(s);
}
